/**
 * Razorpay webhook handler.
 *
 * Razorpay POSTs payment lifecycle events to this endpoint. We verify the
 * `x-razorpay-signature` header against the raw request body using
 * `RAZORPAY_WEBHOOK_SECRET`, then update the local Payment + Order records
 * for the events we care about:
 *
 *   - `payment.captured` → mark Payment SUCCESS, Order CONFIRMED
 *   - `order.paid`       → same as payment.captured (defensive fallback)
 *   - `payment.failed`   → mark Payment FAILED (Order left as-is)
 *
 * This endpoint is intentionally idempotent — Razorpay may retry on
 * non-2xx responses (and may fire `payment.captured` + `order.paid` for the
 * same successful payment), so duplicate deliveries are no-ops. We always
 * return 200 unless the signature itself is invalid (which returns 401 so
 * Razorpay knows the delivery is broken).
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
    order?: { entity?: { id: string; amount?: number } };
  };
}

/**
 * Normalise Razorpay's payment-method strings (`upi`, `card`, `netbanking`,
 * `wallet`, `emi`, `paylater`, …) to the upper-case form we store in the
 * `payments.method` column.
 */
function normaliseMethod(raw: string | undefined): string {
  if (!raw) return "UNKNOWN";
  const m = raw.toLowerCase();
  if (m === "netbanking") return "NET_BANKING";
  if (m === "paylater") return "PAY_LATER";
  return m.toUpperCase();
}

async function applyCapture(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  amount: number | undefined,
  method: string | undefined
): Promise<void> {
  const paymentRow = await db.payment.findFirst({
    where: { razorpayOrderId },
    select: { id: true, orderId: true, amount: true, status: true },
  });
  if (!paymentRow) {
    log.warn({ razorpayOrderId }, "webhook: capture for unknown razorpay order");
    return;
  }

  // Idempotency — Razorpay retries deliveries and also fires both
  // `payment.captured` and `order.paid` for the same payment. Skip if
  // we've already recorded SUCCESS.
  if (paymentRow.status === "SUCCESS") {
    log.debug(
      { razorpayOrderId, paymentId: paymentRow.id.toString() },
      "webhook: payment already SUCCESS, skipping duplicate"
    );
    return;
  }

  // Amount tamper check — Razorpay reports `amount` in paise. Our stored
  // amount is in rupees as a Decimal. Allow only an exact match.
  if (typeof amount === "number") {
    const expectedPaise = Math.round(Number(paymentRow.amount) * 100);
    if (amount !== expectedPaise) {
      log.error(
        {
          razorpayOrderId,
          paymentId: paymentRow.id.toString(),
          expectedPaise,
          receivedPaise: amount,
        },
        "webhook: amount mismatch — refusing to mark as paid"
      );
      return;
    }
  }

  await db.$transaction([
    db.payment.update({
      where: { id: paymentRow.id },
      data: {
        status: "SUCCESS",
        razorpayPaymentId,
        // Persist the real method Razorpay observed (upi/card/netbanking/…).
        method: normaliseMethod(method),
        completedAt: new Date(),
      },
    }),
    db.order.update({
      where: { id: paymentRow.orderId },
      // CONFIRMED is the canonical post-payment status in our system
      // (see lib/validations.ts orderStatusUpdateSchema enum).
      data: { status: "CONFIRMED", updatedAt: new Date() },
    }),
  ]);

  log.info(
    {
      razorpayOrderId,
      paymentId: paymentRow.id.toString(),
      orderId: paymentRow.orderId.toString(),
      method: normaliseMethod(method),
    },
    "webhook: payment captured and order confirmed"
  );
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

  try {
    switch (event.event) {
      case "payment.captured": {
        const p = event.payload?.payment?.entity;
        if (!p) break;
        await applyCapture(p.order_id, p.id, p.amount, p.method);
        break;
      }

      case "order.paid": {
        // Defensive fallback — fires alongside payment.captured but covers the
        // case where the captured event was missed. applyCapture is idempotent.
        const p = event.payload?.payment?.entity;
        const o = event.payload?.order?.entity;
        if (p) {
          await applyCapture(p.order_id, p.id, p.amount, p.method);
        } else if (o) {
          log.info({ rzpOrderId: o.id }, "webhook: order.paid without payment entity");
        }
        break;
      }

      case "payment.failed": {
        const p = event.payload?.payment?.entity;
        if (!p) break;
        await db.payment.updateMany({
          where: { razorpayOrderId: p.order_id, status: { not: "SUCCESS" } },
          data: {
            status: "FAILED",
            razorpayPaymentId: p.id,
            failureReason:
              p.error_description?.slice(0, 500) ??
              p.error_code ??
              "Razorpay reported payment failure",
            completedAt: new Date(),
          },
        });
        log.info(
          { razorpayOrderId: p.order_id, code: p.error_code },
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
