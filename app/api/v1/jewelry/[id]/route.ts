/**
 * Jewelry detail, update, and soft-delete routes.
 *
 * @route GET    /api/v1/jewelry/:id — public
 * @route PUT    /api/v1/jewelry/:id — ADMIN
 * @route DELETE /api/v1/jewelry/:id — ADMIN (soft delete)
 *
 * @author Anurag Muthyam
 * @organization indosyn
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { updateJewelrySchema } from "@/lib/validations";
import { jewelryService } from "@/services/jewelry.service";
import { createLogger } from "@/lib/logger";

const log = createLogger("api.jewelry.[id]");

/** @author Anurag Muthyam */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    log.debug({ id }, "GET /jewelry/:id");
    const product = await jewelryService.findById(id);
    return NextResponse.json({ success: true, message: "Success", data: product });
  } catch {
    log.warn({ id }, "Jewelry not found");
    return NextResponse.json({ success: false, message: "Jewelry not found" }, { status: 404 });
  }
}

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
    const parsed = updateJewelrySchema.safeParse(body);
    if (!parsed.success) {
      log.warn({ id }, "Jewelry update validation failed");
      return NextResponse.json(
        { success: false, message: "Validation failed", errorDetail: parsed.error.flatten() },
        { status: 400 }
      );
    }
    log.info({ id }, "Updating jewelry");
    const product = await jewelryService.update(id, parsed.data);
    return NextResponse.json({ success: true, message: "Jewelry updated", data: product });
  } catch (e) {
    if (e instanceof Error && e.message === "NOT_FOUND") {
      return NextResponse.json({ success: false, message: "Jewelry not found" }, { status: 404 });
    }
    log.error({ err: e, id }, "Jewelry update error");
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

/** @author Anurag Muthyam */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
  }

  try {
    log.info({ id }, "Deleting jewelry");
    await jewelryService.delete(id);
    return NextResponse.json({ success: true, message: "Jewelry deleted" });
  } catch {
    log.warn({ id }, "Jewelry not found for delete");
    return NextResponse.json({ success: false, message: "Jewelry not found" }, { status: 404 });
  }
}
