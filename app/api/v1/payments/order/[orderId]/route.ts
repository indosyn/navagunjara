/**
 * Payment lookup by order stub.
 *
 * @route GET /api/v1/payments/order/:orderId
 * @status 501 — Not Implemented (Phase 2 — Razorpay)
 *
 * @author Anurag Muthyam
 * @organization indosyn
 */

import { NextResponse } from "next/server";

const STUB = {
  success: false,
  message: "Payment integration coming in Phase 2 (Razorpay)",
} as const;

export async function GET() {
  return NextResponse.json(STUB, { status: 501 });
}
