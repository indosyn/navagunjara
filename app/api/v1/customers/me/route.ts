/**
 * Current-user profile endpoint.
 *
 * @route GET /api/v1/customers/me
 * @access Authenticated
 *
 * @author Anurag Muthyam
 * @organization indosyn
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { customerService } from "@/services/customer.service";
import { createLogger } from "@/lib/logger";

const log = createLogger("api.customers.me");

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  try {
    log.debug({ userId: session.user.id }, "GET /customers/me");
    const customer = await customerService.findById(session.user.id);
    return NextResponse.json({ success: true, message: "Success", data: customer });
  } catch {
    log.warn({ userId: session.user.id }, "Customer profile not found");
    return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });
  }
}
