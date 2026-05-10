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
import { auth } from "@/lib/auth";
import { paymentService } from "@/services/payment.service";
import { apiSuccess, apiError } from "@/lib/utils";
import { createLogger } from "@/lib/logger";
import { z } from "zod";

const log = createLogger("api.payments");

const initiateSchema = z.object({
  orderId: z.number().int().positive(),
  method: z.enum(["UPI", "CARD", "NET_BANKING", "WALLET"]),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      const err = apiError("Authentication required", 401);
      return NextResponse.json(err.body, { status: err.status });
    }

    const body = await req.json();
    const parsed = initiateSchema.safeParse(body);
    if (!parsed.success) {
      const err = apiError("Validation failed", 400, "VALIDATION_ERROR", parsed.error.message);
      return NextResponse.json(err.body, { status: err.status });
    }

    const result = await paymentService.createOrder(
      parsed.data.orderId.toString(),
      parsed.data.method
    );

    const res = apiSuccess(result, "Payment initiated");
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
