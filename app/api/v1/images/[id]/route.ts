/**
 * Delete a product image.
 *
 * @route DELETE /api/v1/images/:id
 * @auth  Admin
 *
 * @author Anurag Muthyam
 * @organization indosyn
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { imageService } from "@/services/image.service";
import { apiSuccess, apiError } from "@/lib/utils";
import { createLogger } from "@/lib/logger";

const log = createLogger("api.images.id");

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      const err = apiError("Admin access required", 403);
      return NextResponse.json(err.body, { status: err.status });
    }

    const { id } = await params;
    await imageService.remove(id);

    const res = apiSuccess(null, "Image deleted");
    return NextResponse.json(res.body, { status: res.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    log.error({ error }, "DELETE /api/v1/images/:id failed");

    if (message === "NOT_FOUND") {
      const err = apiError("Image not found", 404);
      return NextResponse.json(err.body, { status: err.status });
    }

    const err = apiError("Failed to delete image", 500);
    return NextResponse.json(err.body, { status: err.status });
  }
}
