/**
 * Razorpay webhook handler.
 *
 * Razorpay POSTs payment lifecycle events to this endpoint. We verify the
 * `x-razorpay-signature` header against the raw request body using
 * `RAZORPAY_WEBHOOK_SECRET`, then update the local Payment + Order records
 * for the events we care about:
 *
 *   - `payment.captured` → mark Payment SUCCESS, Order PAID
 *   - `payment.failed`   → mark Payment FAILED (Order left as-is)
 *
 * This endpoint is intentionally idempotent — Razorpay may retry on
 * non-2xx responses, so we always return 200 unless the signature itself
 * is invalid (which returns 401 so Razorpay knows the delivery is broken).
 *
 * @route POST /api/v1/payments/webhook
 * @auth  Public (signature-verified)
 *
 * @author Anurag Muthyam
 * @organization indosyn
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { db } from "@/lib/db";
import { createLogger } from "@/lib/logger";

const log = createLogger("api.payments.webhook");

// Minimal shape of the Razorpay webhook payload we care about. The real
// payload has many more fields; we only read what we need.
interface RazorpayWebhookPayment {
  id: string;
  order_id: string;
  status: string;
  method?: string;
  amount?: number;
  currency?: string;
  error_code?: string;
  error_description?: string;
}

interface RazorpayWebhookEvent {
  event: string;
  payload?: {
    payment?: { entity?: RazorpayWebhookPayment };
  };
}

export async function POST(req: NextRequest) {
  // Read raw body once — signature verification MUST use the exact bytes.
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature");

  if (!verifyWebhookSignature(rawBody, signature)) {
    log.warn(
      { hasSig: Boolean(signature), bodyLen: rawBody.length },
      "webhook: signature verification failed"
    );
    return NextResponse.json(
      { success: false, message: "Invalid signature" },
      { status: 401 }
    );
  }

  let event: RazorpayWebhookEvent;
  try {
    event = JSON.parse(rawBody) as RazorpayWebhookEvent;
  } catch {
    log.warn("webhook: malformed JSON payload");
    // Return 200 so Razorpay doesn't retry forever on a bad payload.
    return NextResponse.json({ success: true, ignored: "malformed" });
  }

  const payment = event.payload?.payment?.entity;
  if (!payment) {
    log.info({ event: event.event }, "webhook: event without payment entity, ignored");
    return NextResponse.json({ success: true, ignored: "no-payment-entity" });
  }

  try {
    switch (event.event) {
      case "payment.captured": {
        const updated = await db.payment.updateMany({
          where: { razorpayOrderId: payment.order_id },
          data: {
            status: "SUCCESS",
            razorpayPaymentId: payment.id,
            completedAt: new Date(),
          },
        });

        if (updated.count > 0) {
          // Promote the corresponding order to PAID. We look up via the
          // razorpay_order_id so the same logic works whether the user
          // confirmed via the SPA confirm endpoint or only via webhook.
          const paymentRow = await db.payment.findFirst({
            where: { razorpayOrderId: payment.order_id },
            select: { orderId: true },
          });
          if (paymentRow) {
            await db.order.update({
              where: { id: paymentRow.orderId },
              data: { status: "PAID", updatedAt: new Date() },
            });
          }
          log.info(
            { razorpayOrderId: payment.order_id, paymentId: payment.id },
            "webhook: payment captured"
          );
        } else {
          log.warn(
            { razorpayOrderId: payment.order_id },
            "webhook: payment.captured for unknown razorpay order"
          );
        }
        break;
      }

      case "payment.failed": {
        await db.payment.updateMany({
          where: { razorpayOrderId: payment.order_id },
          data: {
            status: "FAILED",
            razorpayPaymentId: payment.id,
            failureReason:
              payment.error_description?.slice(0, 500) ??
              payment.error_code ??
              "Razorpay reported payment failure",
            completedAt: new Date(),
          },
        });
        log.info(
          { razorpayOrderId: payment.order_id, code: payment.error_code },
          "webhook: payment failed"
        );
        break;
      }

      default:
        log.debug({ event: event.event }, "webhook: event type not handled");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    // Log + return 500 so Razorpay retries — DB errors are transient.
    log.error({ error, event: event.event }, "webhook: handler failed");
    return NextResponse.json(
      { success: false, message: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
