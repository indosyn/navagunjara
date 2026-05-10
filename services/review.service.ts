/**
 * Review service — handles product reviews and ratings.
 *
 * @module services/review.service
 * @author Anurag Muthyam
 * @organization indosyn
 */

import { db } from "@/lib/db";
import { serializeDecimal } from "@/lib/utils";
import { createLogger } from "@/lib/logger";
import type { CreateReviewInput, UpdateReviewInput } from "@/lib/validations";

const log = createLogger("review.service");

export const reviewService = {
  /**
   * Create a product review (one per customer per product).
   *
   * @param customerId - Customer ID.
   * @param data       - Review payload (productId, rating, title, comment).
   * @returns Created review.
   * @throws `ALREADY_REVIEWED` if customer already reviewed this product.
   */
  async create(customerId: string, data: CreateReviewInput) {
    log.info({ customerId, productId: data.productId }, "create: submitting review");

    const existing = await db.review.findUnique({
      where: {
        productId_customerId: {
          productId: BigInt(data.productId),
          customerId: BigInt(customerId),
        },
      },
    });
    if (existing) {
      log.warn({ customerId, productId: data.productId }, "create: already reviewed");
      throw new Error("ALREADY_REVIEWED");
    }

    const review = await db.review.create({
      data: {
        productId: BigInt(data.productId),
        customerId: BigInt(customerId),
        rating: data.rating,
        title: data.title ?? null,
        comment: data.comment ?? null,
      },
      include: { customer: true },
    });

    log.info({ reviewId: review.id.toString() }, "create: review created");
    return serializeDecimal(formatReview(review));
  },

  /**
   * Update an existing review.
   *
   * @param reviewId   - Review ID.
   * @param customerId - Customer ID (must be the review author).
   * @param data       - Fields to update.
   * @returns Updated review.
   * @throws `NOT_FOUND` | `FORBIDDEN`.
   */
  async update(reviewId: string, customerId: string, data: UpdateReviewInput) {
    log.info({ reviewId, customerId }, "update: updating review");

    const review = await db.review.findUnique({ where: { id: BigInt(reviewId) } });
    if (!review) throw new Error("NOT_FOUND");
    if (review.customerId !== BigInt(customerId)) throw new Error("FORBIDDEN");

    const updated = await db.review.update({
      where: { id: BigInt(reviewId) },
      data: {
        ...(data.rating !== undefined && { rating: data.rating }),
        ...(data.title !== undefined && { title: data.title }),
        ...(data.comment !== undefined && { comment: data.comment }),
      },
      include: { customer: true },
    });

    log.info({ reviewId }, "update: review updated");
    return serializeDecimal(formatReview(updated));
  },

  /**
   * Delete a review.
   *
   * @param reviewId   - Review ID.
   * @param customerId - Customer ID (author) or null for admin.
   * @param isAdmin    - Whether the requester is an admin.
   */
  async remove(reviewId: string, customerId: string | null, isAdmin: boolean) {
    log.info({ reviewId, customerId, isAdmin }, "remove: deleting review");

    const review = await db.review.findUnique({ where: { id: BigInt(reviewId) } });
    if (!review) throw new Error("NOT_FOUND");
    if (!isAdmin && review.customerId !== BigInt(customerId!)) throw new Error("FORBIDDEN");

    await db.review.delete({ where: { id: BigInt(reviewId) } });
    log.info({ reviewId }, "remove: review deleted");
  },

  /**
   * List reviews for a product with pagination.
   *
   * @param productId - Product ID.
   * @param page      - Zero-based page index.
   * @param size      - Items per page.
   * @returns Paginated review list with summary.
   */
  async listByProduct(productId: string, page: number, size: number) {
    log.debug({ productId, page, size }, "listByProduct: fetching reviews");

    const where = { productId: BigInt(productId) };
    const [reviews, total, aggregate] = await Promise.all([
      db.review.findMany({
        where,
        include: { customer: true },
        skip: page * size,
        take: size,
        orderBy: { createdAt: "desc" },
      }),
      db.review.count({ where }),
      db.review.aggregate({
        where,
        _avg: { rating: true },
      }),
    ]);

    // Rating distribution
    const allRatings = await db.review.groupBy({
      by: ["rating"],
      where,
      _count: { rating: true },
    });
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const r of allRatings) {
      distribution[r.rating] = r._count.rating;
    }

    return {
      content: reviews.map((r) => serializeDecimal(formatReview(r))),
      page,
      size,
      totalElements: total,
      totalPages: Math.ceil(total / size),
      last: (page + 1) * size >= total,
      summary: {
        averageRating: aggregate._avg.rating ?? 0,
        totalReviews: total,
        distribution,
      },
    };
  },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatReview(review: any) {
  return {
    id: review.id,
    productId: review.productId,
    customerId: review.customerId,
    customerName: `${review.customer.firstName} ${review.customer.lastName}`,
    rating: review.rating,
    title: review.title,
    comment: review.comment,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
  };
}
