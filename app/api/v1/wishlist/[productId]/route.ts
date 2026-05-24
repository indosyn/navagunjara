/**
 * Remove a product from the wishlist.
 *
 * @route DELETE /api/v1/wishlist/:productId
 * @auth  User
 *
 * @author Anurag Muthyam
 * @organization indosyn
 */

import { NextRequest, NextResponse } from "next/server";
import { getApiSession } from "@/lib/api-auth";
import { wishlistService } from "@/services/wishlist.service";
import { apiSuccess, apiError } from "@/lib/utils";
import { createLogger } from "@/lib/logger";

const log = createLogger("api.wishlist.productId");

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const session = await getApiSession(req);
    if (!session) {
      const err = apiError("Authentication required", 401);
      return NextResponse.json(err.body, { status: err.status });
    }

    const { productId } = await params;
    await wishlistService.remove(session.user.id, productId);

    const res = apiSuccess(null, "Removed from wishlist");
    return NextResponse.json(res.body, { status: res.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    log.error({ error }, "DELETE /api/v1/wishlist/:productId failed");

    if (message === "NOT_FOUND") {
      const err = apiError("Item not in wishlist", 404);
      return NextResponse.json(err.body, { status: err.status });
    }

    const err = apiError("Failed to remove from wishlist", 500);
    return NextResponse.json(err.body, { status: err.status });
  }
}
