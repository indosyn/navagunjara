/**
 * Wishlist — list, add items.
 *
 * @route GET  /api/v1/wishlist
 * @route POST /api/v1/wishlist
 * @auth  User
 *
 * @author Anurag Muthyam
 * @organization indosyn
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { wishlistService } from "@/services/wishlist.service";
import { apiSuccess, apiError } from "@/lib/utils";
import { createLogger } from "@/lib/logger";
import { z } from "zod";

const log = createLogger("api.wishlist");

const addSchema = z.object({
  productId: z.number().int().positive(),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      const err = apiError("Authentication required", 401);
      return NextResponse.json(err.body, { status: err.status });
    }

    const items = await wishlistService.list(session.user.id);
    const res = apiSuccess(items, "Wishlist retrieved");
    return NextResponse.json(res.body, { status: res.status });
  } catch (error) {
    log.error({ error }, "GET /api/v1/wishlist failed");
    const err = apiError("Failed to fetch wishlist", 500);
    return NextResponse.json(err.body, { status: err.status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      const err = apiError("Authentication required", 401);
      return NextResponse.json(err.body, { status: err.status });
    }

    const body = await req.json();
    const parsed = addSchema.safeParse(body);
    if (!parsed.success) {
      const err = apiError("Validation failed", 400, "VALIDATION_ERROR", parsed.error.message);
      return NextResponse.json(err.body, { status: err.status });
    }

    const item = await wishlistService.add(
      session.user.id,
      parsed.data.productId.toString()
    );
    const res = apiSuccess(item, "Added to wishlist", 201);
    return NextResponse.json(res.body, { status: res.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    log.error({ error }, "POST /api/v1/wishlist failed");

    if (message === "ALREADY_IN_WISHLIST") {
      const err = apiError("Product already in wishlist", 409, "ALREADY_IN_WISHLIST");
      return NextResponse.json(err.body, { status: err.status });
    }
    if (message === "PRODUCT_NOT_FOUND") {
      const err = apiError("Product not found", 404, "PRODUCT_NOT_FOUND");
      return NextResponse.json(err.body, { status: err.status });
    }

    const err = apiError("Failed to add to wishlist", 500);
    return NextResponse.json(err.body, { status: err.status });
  }
}
