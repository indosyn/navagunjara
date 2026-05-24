/**
 * Product reviews — list reviews for a product, create a review.
 *
 * @route GET  /api/v1/reviews?productId=&page=&size=
 * @route POST /api/v1/reviews
 * @auth  GET: Public | POST: User
 *
 * @author Anurag Muthyam
 * @organization indosyn
 */

import { NextRequest, NextResponse } from "next/server";
import { getApiSession } from "@/lib/api-auth";
import { reviewService } from "@/services/review.service";
import { createReviewSchema } from "@/lib/validations";
import { apiSuccess, apiError } from "@/lib/utils";
import { createLogger } from "@/lib/logger";
import { enforceRateLimit } from "@/lib/rate-limit";

const log = createLogger("api.reviews");

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const productId = searchParams.get("productId");
    if (!productId) {
      const err = apiError("productId is required", 400);
      return NextResponse.json(err.body, { status: err.status });
    }

    const page = Math.max(0, Number(searchParams.get("page") ?? "0"));
    const size = Math.min(50, Math.max(1, Number(searchParams.get("size") ?? "10")));

    const result = await reviewService.listByProduct(productId, page, size);
    const res = apiSuccess(result, "Reviews retrieved");
    return NextResponse.json(res.body, {
      status: res.status,
      headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
    });
  } catch (error) {
    log.error({ error }, "GET /api/v1/reviews failed");
    const err = apiError("Failed to fetch reviews", 500);
    return NextResponse.json(err.body, { status: err.status });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Reviews are spammy if unrestricted. 10/min per IP in prod.
    const blocked = await enforceRateLimit(req, "reviews.create", 10, 60_000);
    if (blocked) return blocked;

    const session = await getApiSession(req);
    if (!session || session.user.role !== "USER") {
      const err = apiError("Authentication required", 401);
      return NextResponse.json(err.body, { status: err.status });
    }

    const body = await req.json();
    const parsed = createReviewSchema.safeParse(body);
    if (!parsed.success) {
      const err = apiError("Validation failed", 400, "VALIDATION_ERROR", parsed.error.message);
      return NextResponse.json(err.body, { status: err.status });
    }

    const review = await reviewService.create(session.user.id, parsed.data);
    const res = apiSuccess(review, "Review submitted", 201);
    return NextResponse.json(res.body, { status: res.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    log.error({ error }, "POST /api/v1/reviews failed");

    if (message === "ALREADY_REVIEWED") {
      const err = apiError("You have already reviewed this product", 409, "ALREADY_REVIEWED");
      return NextResponse.json(err.body, { status: err.status });
    }

    const err = apiError("Failed to submit review", 500);
    return NextResponse.json(err.body, { status: err.status });
  }
}
