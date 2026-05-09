/**
 * Verify Razorpay payment signature and confirm payment.
 *
 * @route POST /api/v1/payments/:id/confirm
 * @auth  User
 *
 * @author Anurag Muthyam
 * @organization indosyn
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { paymentService } from "@/services/payment.service";
import { razorpayVerifySchema } from "@/lib/validations";
import { apiSuccess, apiError } from "@/lib/utils";
import { createLogger } from "@/lib/logger";
import { sendOrderConfirmation } from "@/lib/email";
import { db } from "@/lib/db";

const log = createLogger("api.payments.confirm");

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      const err = apiError("Authentication required", 401);
      return NextResponse.json(err.body, { status: err.status });
    }

    const body = await req.json();
    const parsed = razorpayVerifySchema.safeParse(body);
    if (!parsed.success) {
      const err = apiError("Validation failed", 400, "VALIDATION_ERROR", parsed.error.message);
      return NextResponse.json(err.body, { status: err.status });
    }

    const payment = await paymentService.verify({
      razorpay_order_id: parsed.data.razorpay_order_id,
      razorpay_payment_id: parsed.data.razorpay_payment_id,
      razorpay_signature: parsed.data.razorpay_signature,
      orderId: parsed.data.orderId.toString(),
    });

    // Send confirmation email (fire and forget)
    const order = await db.order.findUnique({
      where: { id: BigInt(parsed.data.orderId) },
      include: { customer: true, items: true },
    });
    if (order) {
      sendOrderConfirmation(
        order.customer.email,
        order.id.toString(),
        order.totalAmount.toString(),
        order.items.length
      );
    }

    const res = apiSuccess(payment, "Payment verified successfully");
    return NextResponse.json(res.body, { status: res.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    log.error({ error }, "POST /api/v1/payments/:id/confirm failed");

    if (message === "INVALID_SIGNATURE") {
      const err = apiError("Invalid payment signature", 400, "INVALID_SIGNATURE");
      return NextResponse.json(err.body, { status: err.status });
    }
    if (message === "PAYMENT_NOT_FOUND") {
      const err = apiError("Payment not found", 404, "PAYMENT_NOT_FOUND");
      return NextResponse.json(err.body, { status: err.status });
    }

    const err = apiError("Payment verification failed", 500);
    return NextResponse.json(err.body, { status: err.status });
  }
}
