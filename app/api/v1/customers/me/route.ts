/**
 * Current-user profile endpoint.
 *
 * @route GET /api/v1/customers/me
 * @access Authenticated
 *
 * @author Anurag Muthyam
 * @organization indosyn
 */

import { NextRequest, NextResponse } from "next/server";
import { getApiSession } from "@/lib/api-auth";
import { customerService } from "@/services/customer.service";
import { createLogger } from "@/lib/logger";

const log = createLogger("api.customers.me");

export async function GET(req: NextRequest) {
  const session = await getApiSession(req);
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

/**
 * Close (soft-delete) the currently-authenticated customer account.
 *
 * The row is NOT removed: status flips to DEACTIVATED so the user can no
 * longer log in, while all orders, invoices, and reviews remain intact for
 * accounting and audit purposes. Use the `anonymize` flag in the query
 * string to additionally scrub PII (GDPR right-to-erasure).
 *
 * @route DELETE /api/v1/customers/me
 * @access Authenticated
 */
export async function DELETE(req: NextRequest) {
  const session = await getApiSession(req);
  if (!session) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  try {
    const anonymize = new URL(req.url).searchParams.get("anonymize") === "true";
    log.info({ userId: session.user.id, anonymize }, "Closing customer account");
    const result = anonymize
      ? await customerService.anonymize(session.user.id)
      : await customerService.deactivate(session.user.id);
    return NextResponse.json({
      success: true,
      message: anonymize ? "Account anonymized" : "Account deactivated",
      data: result,
    });
  } catch (e) {
    if (e instanceof Error && e.message === "NOT_FOUND") {
      return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });
    }
    log.error({ err: e, userId: session.user.id }, "Account closure error");
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
