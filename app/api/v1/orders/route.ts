/**
 * Order listing and placement routes.
 *
 * @route GET  /api/v1/orders — list orders (users see own; admins see all)
 * @route POST /api/v1/orders — place a new order
 *
 * @author Anurag Muthyam
 * @organization indosyn
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createOrderSchema } from "@/lib/validations";
import { orderService } from "@/services/order.service";
import { createLogger } from "@/lib/logger";

const log = createLogger("api.orders");

/** @author Anurag Muthyam */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(0, Number(searchParams.get("page") ?? 0));
  const size = Math.min(100, Math.max(1, Number(searchParams.get("size") ?? 10)));
  const status = searchParams.get("status") ?? undefined;

  if (session.user.role === "ADMIN") {
    const customerId = searchParams.get("customerId");
    if (customerId) {
      log.debug({ customerId, page, size }, "Admin listing orders by customer");
      const result = await orderService.listByCustomer(customerId, page, size);
      return NextResponse.json({ success: true, message: "Success", data: result });
    }
    log.debug({ page, size, status }, "Admin listing all orders");
    const result = await orderService.listAll(page, size, status);
    return NextResponse.json({ success: true, message: "Success", data: result });
  }

  log.debug({ userId: session.user.id, page, size }, "Customer listing own orders");
  const result = await orderService.listByCustomer(session.user.id, page, size);
  return NextResponse.json({ success: true, message: "Success", data: result });
}

/** @author Anurag Muthyam */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = createOrderSchema.safeParse(body);
    if (!parsed.success) {
      log.warn("Order placement validation failed");
      return NextResponse.json(
        { success: false, message: "Validation failed", errorDetail: parsed.error.flatten() },
        { status: 400 }
      );
    }
    log.info({ customerId: parsed.data.customerId }, "Placing order");
    const order = await orderService.place(parsed.data);
    log.info("Order placed");
    return NextResponse.json(
      { success: true, message: "Order placed successfully", data: order },
      { status: 201 }
    );
  } catch (e) {
    if (e instanceof Error) {
      if (e.message === "PRODUCT_NOT_FOUND") {
        return NextResponse.json(
          { success: false, message: "One or more products not found" },
          { status: 404 }
        );
      }
      if (e.message.startsWith("INSUFFICIENT_STOCK")) {
        log.warn({ detail: e.message }, "Insufficient stock");
        return NextResponse.json(
          { success: false, message: "Insufficient stock", errorDetail: e.message },
          { status: 400 }
        );
      }
    }
    log.error({ err: e }, "Order placement error");
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
