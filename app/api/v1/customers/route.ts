/**
 * List all customers (admin only, paginated).
 *
 * @route GET /api/v1/customers
 * @access ADMIN
 *
 * @author Anurag Muthyam
 * @organization indosyn
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { customerService } from "@/services/customer.service";
import { createLogger } from "@/lib/logger";

const log = createLogger("api.customers");

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(0, Number(searchParams.get("page") ?? 0));
  const size = Math.min(100, Math.max(1, Number(searchParams.get("size") ?? 20)));

  log.debug({ page, size }, "GET /customers — listing");
  const result = await customerService.list(page, size);
  return NextResponse.json({ success: true, message: "Success", data: result });
}
