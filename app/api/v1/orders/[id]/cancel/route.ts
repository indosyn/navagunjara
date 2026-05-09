/**
 * Cancel an order.
 *
 * @route PUT /api/v1/orders/:id/cancel
 * @access Authenticated (own orders only; only PENDING)
 *
 * @author Anurag Muthyam
 * @organization indosyn
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { orderService } from "@/services/order.service";
import { createLogger } from "@/lib/logger";

const log = createLogger("api.orders.cancel");

/** @author Anurag Muthyam */
export async function PUT(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    log.info({ id, userId: session.user.id }, "Cancelling order");
    const order = await orderService.cancel(id, session.user.id);
    log.info({ id }, "Order cancelled");
    return NextResponse.json({ success: true, message: "Order cancelled", data: order });
  } catch (e) {
    if (e instanceof Error) {
      if (e.message === "NOT_FOUND")
        return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
      if (e.message === "FORBIDDEN")
        return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
      if (e.message === "CANNOT_CANCEL")
        return NextResponse.json(
          { success: false, message: "Only PENDING orders can be cancelled" },
          { status: 400 }
        );
    }
    log.error({ err: e, id }, "Order cancel error");
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
