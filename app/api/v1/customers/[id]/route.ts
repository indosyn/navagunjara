/**
 * Customer detail and update routes.
 *
 * @route GET /api/v1/customers/:id
 * @route PUT /api/v1/customers/:id
 * @access Authenticated (users can view/edit own; admins can access any)
 *
 * @author Anurag Muthyam
 * @organization indosyn
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { updateCustomerSchema } from "@/lib/validations";
import { customerService } from "@/services/customer.service";
import { createLogger } from "@/lib/logger";

const log = createLogger("api.customers.[id]");

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  try {
    log.debug({ id }, "GET /customers/:id");
    const customer = await customerService.findById(id);
    return NextResponse.json({ success: true, message: "Success", data: customer });
  } catch {
    log.warn({ id }, "Customer not found");
    return NextResponse.json({ success: false, message: "Customer not found" }, { status: 404 });
  }
}

/**
 * Update a customer profile.
 *
 * @author Anurag Muthyam
 * @organization indosyn
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  // Users can only update their own profile unless ADMIN
  if (session.user.id !== id && session.user.role !== "ADMIN") {
    return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = updateCustomerSchema.safeParse(body);
    if (!parsed.success) {
      log.warn({ id }, "Customer update validation failed");
      return NextResponse.json(
        { success: false, message: "Validation failed", errorDetail: parsed.error.flatten() },
        { status: 400 }
      );
    }
    log.info({ id }, "Updating customer");
    const customer = await customerService.update(id, parsed.data);
    return NextResponse.json({ success: true, message: "Customer updated", data: customer });
  } catch (e) {
    log.error({ err: e, id }, "Customer update error");
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
