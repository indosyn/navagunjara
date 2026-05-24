/**
 * Payment lookup by order ID.
 *
 * @route GET /api/v1/payments/order/:orderId
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

const log = createLogger("api.payments.order");

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await getApiSession(req);
    if (!session) {
      const err = apiError("Authentication required", 401);
      return NextResponse.json(err.body, { status: err.status });
    }

    const { orderId } = await params;
    const payments = await paymentService.findByOrderId(orderId);

    const res = apiSuccess(payments, "Payments retrieved");
    return NextResponse.json(res.body, { status: res.status });
  } catch (error) {
    log.error({ error }, "GET /api/v1/payments/order/:orderId failed");
    const err = apiError("Failed to fetch payments", 500);
    return NextResponse.json(err.body, { status: err.status });
  }
}
