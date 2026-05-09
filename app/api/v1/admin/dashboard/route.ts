/**
 * Admin dashboard statistics endpoint.
 *
 * @route GET /api/v1/admin/dashboard
 * @access ADMIN
 *
 * @author Anurag Muthyam
 * @organization indosyn
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { adminService } from "@/services/admin.service";
import { createLogger } from "@/lib/logger";

const log = createLogger("api.admin.dashboard");

/** @author Anurag Muthyam */
export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
  }
  log.info("Fetching admin dashboard stats");
  const stats = await adminService.getDashboardStats();
  return NextResponse.json({ success: true, message: "Success", data: stats });
}
