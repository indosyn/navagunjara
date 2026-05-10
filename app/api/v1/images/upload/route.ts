/**
 * Image upload for products.
 *
 * @route POST /api/v1/images/upload
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

const log = createLogger("api.images.upload");

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      const err = apiError("Admin access required", 403);
      return NextResponse.json(err.body, { status: err.status });
    }

    const formData = await req.formData();
    const productId = formData.get("productId") as string;
    if (!productId) {
      const err = apiError("productId is required", 400);
      return NextResponse.json(err.body, { status: err.status });
    }

    const files = formData.getAll("images") as File[];
    if (files.length === 0) {
      const err = apiError("At least one image is required", 400);
      return NextResponse.json(err.body, { status: err.status });
    }

    // Validate file types and sizes
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
    for (const file of files) {
      if (!ALLOWED.includes(file.type)) {
        const err = apiError(`Invalid file type: ${file.type}. Allowed: JPEG, PNG, WebP`, 400);
        return NextResponse.json(err.body, { status: err.status });
      }
      if (file.size > MAX_SIZE) {
        const err = apiError(`File ${file.name} exceeds 5MB limit`, 400);
        return NextResponse.json(err.body, { status: err.status });
      }
    }

    const fileBuffers = await Promise.all(
      files.map(async (file) => ({
        buffer: Buffer.from(await file.arrayBuffer()),
        filename: file.name,
      }))
    );

    const images = await imageService.upload(productId, fileBuffers);
    const res = apiSuccess(images, "Images uploaded", 201);
    return NextResponse.json(res.body, { status: res.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    log.error({ error }, "POST /api/v1/images/upload failed");

    if (message === "PRODUCT_NOT_FOUND") {
      const err = apiError("Product not found", 404);
      return NextResponse.json(err.body, { status: err.status });
    }

    const err = apiError("Failed to upload images", 500);
    return NextResponse.json(err.body, { status: err.status });
  }
}
