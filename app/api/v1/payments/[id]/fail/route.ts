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
import { auth } from "@/lib/auth";
import { paymentService } from "@/services/payment.service";
import { apiSuccess, apiError } from "@/lib/utils";
import { createLogger } from "@/lib/logger";

const log = createLogger("api.payments.fail");

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      const err = apiError("Authentication required", 401);
      return NextResponse.json(err.body, { status: err.status });
    }

    const { id } = await params;
    const body = await req.json();
    const reason = typeof body.reason === "string" ? body.reason : "Payment failed";

    const payment = await paymentService.markFailed(id, reason);

    const res = apiSuccess(payment, "Payment marked as failed");
    return NextResponse.json(res.body, { status: res.status });
  } catch (error) {
    log.error({ error }, "POST /api/v1/payments/:id/fail failed");
    const err = apiError("Failed to update payment", 500);
    return NextResponse.json(err.body, { status: err.status });
  }
}
