/**
 * Change current user's password.
 *
 * @route PUT /api/v1/customers/me/password
 * @access Authenticated
 *
 * @author Anurag Muthyam
 * @organization indosyn
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { changePasswordSchema } from "@/lib/validations";
import { customerService } from "@/services/customer.service";
import { createLogger } from "@/lib/logger";

const log = createLogger("api.customers.password");

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) {
      log.warn({ userId: session.user.id }, "Password change validation failed");
      return NextResponse.json(
        { success: false, message: "Validation failed", errorDetail: parsed.error.flatten() },
        { status: 400 }
      );
    }
    log.info({ userId: session.user.id }, "Changing password");
    await customerService.changePassword(session.user.id, parsed.data);
    log.info({ userId: session.user.id }, "Password changed");
    return NextResponse.json({ success: true, message: "Password changed successfully" });
  } catch (e) {
    if (e instanceof Error && e.message === "INVALID_CURRENT_PASSWORD") {
      log.warn({ userId: session.user.id }, "Invalid current password");
      return NextResponse.json(
        { success: false, message: "Current password is incorrect" },
        { status: 400 }
      );
    }
    log.error({ err: e }, "Password change error");
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
