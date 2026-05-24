/**
 * Mark a payment as failed.
 *
 * @route POST /api/v1/payments/:id/fail
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
import { db } from "@/lib/db";

const log = createLogger("api.payments.fail");

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getApiSession(req);
    if (!session) {
      const err = apiError("Authentication required", 401);
      return NextResponse.json(err.body, { status: err.status });
    }

    const { id } = await params;

    // Ownership check — customers may only mark their OWN payments as failed.
    // Admins may mark any payment as failed (e.g. for support cases).
    let paymentBigInt: bigint;
    try {
      paymentBigInt = BigInt(id);
    } catch {
      const err = apiError("Payment not found", 404, "PAYMENT_NOT_FOUND");
      return NextResponse.json(err.body, { status: err.status });
    }
    const existing = await db.payment.findUnique({
      where: { id: paymentBigInt },
      select: { id: true, order: { select: { customerId: true } } },
    });
    if (!existing) {
      const err = apiError("Payment not found", 404, "PAYMENT_NOT_FOUND");
      return NextResponse.json(err.body, { status: err.status });
    }
    if (
      session.user.role !== "ADMIN" &&
      existing.order.customerId.toString() !== session.user.id
    ) {
      log.warn(
        {
          paymentId: id,
          actor: session.user.id,
          owner: existing.order.customerId.toString(),
        },
        "fail: ownership check failed"
      );
      const err = apiError("Forbidden", 403, "FORBIDDEN");
      return NextResponse.json(err.body, { status: err.status });
    }

    const body = await req.json();
    const reason = typeof body.reason === "string" ? body.reason : "Payment failed";

    const payment = await paymentService.markFailed(id, reason);

    const res = apiSuccess(payment, "Payment marked as failed");
    return NextResponse.json(res.body, { status: res.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    log.error({ error }, "POST /api/v1/payments/:id/fail failed");
    if (message === "PAYMENT_NOT_FOUND") {
      const err = apiError("Payment not found", 404, "PAYMENT_NOT_FOUND");
      return NextResponse.json(err.body, { status: err.status });
    }
    const err = apiError("Failed to update payment", 500);
    return NextResponse.json(err.body, { status: err.status });
  }
}
