/**
 * Clothing detail, update, and soft-delete routes.
 *
 * @route GET    /api/v1/clothing/:id — public
 * @route PUT    /api/v1/clothing/:id — ADMIN
 * @route DELETE /api/v1/clothing/:id — ADMIN (soft delete)
 *
 * @author Anurag Muthyam
 * @organization indosyn
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { updateClothingSchema } from "@/lib/validations";
import { clothingService } from "@/services/clothing.service";
import { createLogger } from "@/lib/logger";

const log = createLogger("api.clothing.[id]");

/** @author Anurag Muthyam */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    log.debug({ id }, "GET /clothing/:id");
    const product = await clothingService.findById(id);
    return NextResponse.json({ success: true, message: "Success", data: product });
  } catch {
    log.warn({ id }, "Clothing not found");
    return NextResponse.json({ success: false, message: "Clothing not found" }, { status: 404 });
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
    const parsed = updateClothingSchema.safeParse(body);
    if (!parsed.success) {
      log.warn({ id }, "Clothing update validation failed");
      return NextResponse.json(
        { success: false, message: "Validation failed", errorDetail: parsed.error.flatten() },
        { status: 400 }
      );
    }
    log.info({ id }, "Updating clothing");
    const product = await clothingService.update(id, parsed.data);
    return NextResponse.json({ success: true, message: "Clothing updated", data: product });
  } catch (e) {
    if (e instanceof Error && e.message === "NOT_FOUND") {
      return NextResponse.json({ success: false, message: "Clothing not found" }, { status: 404 });
    }
    log.error({ err: e, id }, "Clothing update error");
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
    log.info({ id }, "Deleting clothing");
    await clothingService.delete(id);
    return NextResponse.json({ success: true, message: "Clothing deleted" });
  } catch {
    log.warn({ id }, "Clothing not found for delete");
    return NextResponse.json({ success: false, message: "Clothing not found" }, { status: 404 });
  }
}
