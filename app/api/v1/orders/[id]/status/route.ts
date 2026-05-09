/**
 * Update order status (admin only).
 *
 * @route PUT /api/v1/orders/:id/status
 * @access ADMIN
 *
 * @author Anurag Muthyam
 * @organization indosyn
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { updateOrderStatusSchema } from "@/lib/validations";
import { orderService } from "@/services/order.service";
import { createLogger } from "@/lib/logger";

const log = createLogger("api.orders.status");

/** @author Anurag Muthyam */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = updateOrderStatusSchema.safeParse(body);
    if (!parsed.success) {
      log.warn({ id }, "Status update validation failed");
      return NextResponse.json(
        { success: false, message: "Validation failed", errorDetail: parsed.error.flatten() },
        { status: 400 }
      );
    }
    log.info({ id, status: parsed.data.status }, "Updating order status");
    const order = await orderService.updateStatus(id, parsed.data.status);
    return NextResponse.json({ success: true, message: "Order status updated", data: order });
  } catch (e) {
    if (e instanceof Error && e.message === "NOT_FOUND") {
      return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
    }
    log.error({ err: e, id }, "Status update error");
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
