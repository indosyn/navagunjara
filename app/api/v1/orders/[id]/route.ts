/**
 * Order detail endpoint.
 *
 * @route GET /api/v1/orders/:id
 * @access Authenticated
 *
 * @author Anurag Muthyam
 * @organization indosyn
 */

import { NextRequest, NextResponse } from "next/server";
import { getApiSession } from "@/lib/api-auth";
import { orderService } from "@/services/order.service";
import { createLogger } from "@/lib/logger";

const log = createLogger("api.orders.[id]");

/** @author Anurag Muthyam */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getApiSession(req);
  if (!session) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  try {
    log.debug({ id }, "GET /orders/:id");
    const order = await orderService.findById(id);
    return NextResponse.json({ success: true, message: "Success", data: order });
  } catch {
    log.warn({ id }, "Order not found");
    return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
  }
}
