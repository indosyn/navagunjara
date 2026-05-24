/**
 * Payment initiation — creates a Razorpay order for checkout.
 *
 * @route POST /api/v1/payments
 * @auth  User
 *
 * @author Anurag Muthyam
 * @organization indosyn
 */

import { NextRequest, NextResponse } from "next/server";
import { getApiSession } from "@/lib/api-auth";
import { paymentService } from "@/services/payment.service";
import { apiSuccess, apiError } from "@/lib/utils";
import { createLogger } from "@/lib/logger";
import { checkIdempotency, rememberIdempotency } from "@/lib/idempotency";
import { enforceRateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const log = createLogger("api.payments");

const initiateSchema = z.object({
  orderId: z.number().int().positive(),
  // The user picks the actual payment method inside Razorpay's hosted Checkout
  // modal, so we don't know it at initiation time. We accept any of these
  // hint values; the webhook later overwrites with the real method Razorpay
  // observed (upi/card/netbanking/wallet/emi/paylater/…).
  method: z
    .enum(["UPI", "CARD", "NET_BANKING", "WALLET", "EMI", "PAY_LATER", "PENDING"])
    .default("PENDING"),
});

export async function POST(req: NextRequest) {
  try {
    // 30 payment-init requests per IP per minute in prod.
    const blocked = await enforceRateLimit(req, "payments.create", 30, 60_000);
    if (blocked) return blocked;

    const session = await getApiSession(req);
    if (!session) {
      const err = apiError("Authentication required", 401);
      return NextResponse.json(err.body, { status: err.status });
    }

    // Idempotency-Key replay protection.
    const replay = await checkIdempotency(req, "payments.create", session.user.id);
    if (replay) return replay;

    const body = await req.json();
    const parsed = initiateSchema.safeParse(body);
    if (!parsed.success) {
      const err = apiError("Validation failed", 400, "VALIDATION_ERROR", parsed.error.message);
      await rememberIdempotency(req, "payments.create", session.user.id, err.status, err.body);
      return NextResponse.json(err.body, { status: err.status });
    }

    const result = await paymentService.createOrder(
      parsed.data.orderId.toString(),
      parsed.data.method
    );

    const res = apiSuccess(result, "Payment initiated");
    await rememberIdempotency(req, "payments.create", session.user.id, res.status, res.body);
    return NextResponse.json(res.body, { status: res.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    log.error({ error }, "POST /api/v1/payments failed");

    if (message === "ORDER_NOT_FOUND") {
      const err = apiError("Order not found", 404, "ORDER_NOT_FOUND");
      return NextResponse.json(err.body, { status: err.status });
    }
    if (message === "ORDER_NOT_PENDING") {
      const err = apiError("Order is not in pending state", 400, "ORDER_NOT_PENDING");
      return NextResponse.json(err.body, { status: err.status });
    }

    const err = apiError("Failed to initiate payment", 500);
    return NextResponse.json(err.body, { status: err.status });
  }
}
