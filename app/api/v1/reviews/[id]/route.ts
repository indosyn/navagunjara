/**
 * Single review operations — update, delete.
 *
 * @route PUT    /api/v1/reviews/:id
 * @route DELETE /api/v1/reviews/:id
 * @auth  User (owner) | Admin (delete only)
 *
 * @author Anurag Muthyam
 * @organization indosyn
 */

import { NextRequest, NextResponse } from "next/server";
import { getApiSession } from "@/lib/api-auth";
import { reviewService } from "@/services/review.service";
import { updateReviewSchema } from "@/lib/validations";
import { apiSuccess, apiError } from "@/lib/utils";
import { createLogger } from "@/lib/logger";

const log = createLogger("api.reviews.id");

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getApiSession(req);
    if (!session) {
      const err = apiError("Authentication required", 401);
      return NextResponse.json(err.body, { status: err.status });
    }

    const { id } = await params;
    const body = await req.json();
    const parsed = updateReviewSchema.safeParse(body);
    if (!parsed.success) {
      const err = apiError("Validation failed", 400, "VALIDATION_ERROR", parsed.error.message);
      return NextResponse.json(err.body, { status: err.status });
    }

    const review = await reviewService.update(id, session.user.id, parsed.data);
    const res = apiSuccess(review, "Review updated");
    return NextResponse.json(res.body, { status: res.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    log.error({ error }, "PUT /api/v1/reviews/:id failed");

    if (message === "NOT_FOUND") {
      const err = apiError("Review not found", 404);
      return NextResponse.json(err.body, { status: err.status });
    }
    if (message === "FORBIDDEN") {
      const err = apiError("Not authorized to update this review", 403);
      return NextResponse.json(err.body, { status: err.status });
    }

    const err = apiError("Failed to update review", 500);
    return NextResponse.json(err.body, { status: err.status });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getApiSession(req);
    if (!session) {
      const err = apiError("Authentication required", 401);
      return NextResponse.json(err.body, { status: err.status });
    }

    const { id } = await params;
    const isAdmin = session.user.role === "ADMIN";

    await reviewService.remove(id, isAdmin ? null : session.user.id, isAdmin);
    const res = apiSuccess(null, "Review deleted");
    return NextResponse.json(res.body, { status: res.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    log.error({ error }, "DELETE /api/v1/reviews/:id failed");

    if (message === "NOT_FOUND") {
      const err = apiError("Review not found", 404);
      return NextResponse.json(err.body, { status: err.status });
    }
    if (message === "FORBIDDEN") {
      const err = apiError("Not authorized to delete this review", 403);
      return NextResponse.json(err.body, { status: err.status });
    }

    const err = apiError("Failed to delete review", 500);
    return NextResponse.json(err.body, { status: err.status });
  }
}
