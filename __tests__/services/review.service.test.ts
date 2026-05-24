/**
 * Unit tests for review service.
 *
 * @module __tests__/services/review.service.test
 * @author Anurag Muthyam
 * @organization indosyn
 */

import { mockDb } from "../mocks/db.mock";

jest.mock("@/lib/logger", () => ({
  createLogger: () => ({ info: jest.fn(), warn: jest.fn(), debug: jest.fn(), error: jest.fn() }),
}));

import { reviewService } from "@/services/review.service";

const MOCK_CUSTOMER = { firstName: "Priya", lastName: "Sharma" };
const MOCK_REVIEW = {
  id: BigInt(1),
  productId: BigInt(10),
  customerId: BigInt(2),
  rating: 5,
  title: "Great",
  comment: "Loved it",
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
  customer: MOCK_CUSTOMER,
};

beforeEach(() => jest.clearAllMocks());

describe("reviewService.create", () => {
  it("creates a review", async () => {
    (mockDb.review.findUnique as jest.Mock).mockResolvedValue(null);
    (mockDb.review.create as jest.Mock).mockResolvedValue(MOCK_REVIEW);
    const res = await reviewService.create("2", { productId: 10, rating: 5, title: "Great", comment: "Loved it" }) as { customerName: string; rating: number };
    expect(res.customerName).toBe("Priya Sharma");
    expect(res.rating).toBe(5);
  });

  it("handles null title and comment", async () => {
    (mockDb.review.findUnique as jest.Mock).mockResolvedValue(null);
    (mockDb.review.create as jest.Mock).mockResolvedValue({ ...MOCK_REVIEW, title: null, comment: null });
    await reviewService.create("2", { productId: 10, rating: 4 });
    expect((mockDb.review.create as jest.Mock).mock.calls[0][0].data.title).toBeNull();
    expect((mockDb.review.create as jest.Mock).mock.calls[0][0].data.comment).toBeNull();
  });

  it("throws ALREADY_REVIEWED when existing", async () => {
    (mockDb.review.findUnique as jest.Mock).mockResolvedValue(MOCK_REVIEW);
    await expect(reviewService.create("2", { productId: 10, rating: 5 })).rejects.toThrow("ALREADY_REVIEWED");
  });
});

describe("reviewService.update", () => {
  it("updates rating, title, comment selectively", async () => {
    (mockDb.review.findUnique as jest.Mock).mockResolvedValue(MOCK_REVIEW);
    (mockDb.review.update as jest.Mock).mockResolvedValue({ ...MOCK_REVIEW, rating: 3 });
    const res = await reviewService.update("1", "2", { rating: 3 }) as { rating: number };
    expect(res.rating).toBe(3);
    const updateData = (mockDb.review.update as jest.Mock).mock.calls[0][0].data;
    expect(updateData.rating).toBe(3);
    expect(updateData.title).toBeUndefined();
  });

  it("updates with all fields", async () => {
    (mockDb.review.findUnique as jest.Mock).mockResolvedValue(MOCK_REVIEW);
    (mockDb.review.update as jest.Mock).mockResolvedValue(MOCK_REVIEW);
    await reviewService.update("1", "2", { rating: 4, title: "ok", comment: "fine" });
    const updateData = (mockDb.review.update as jest.Mock).mock.calls[0][0].data;
    expect(updateData).toEqual({ rating: 4, title: "ok", comment: "fine" });
  });

  it("throws NOT_FOUND when review missing", async () => {
    (mockDb.review.findUnique as jest.Mock).mockResolvedValue(null);
    await expect(reviewService.update("1", "2", { rating: 3 })).rejects.toThrow("NOT_FOUND");
  });

  it("throws FORBIDDEN when customer mismatch", async () => {
    (mockDb.review.findUnique as jest.Mock).mockResolvedValue(MOCK_REVIEW);
    await expect(reviewService.update("1", "999", { rating: 3 })).rejects.toThrow("FORBIDDEN");
  });
});

describe("reviewService.remove", () => {
  it("deletes when author", async () => {
    (mockDb.review.findUnique as jest.Mock).mockResolvedValue(MOCK_REVIEW);
    (mockDb.review.delete as jest.Mock).mockResolvedValue(MOCK_REVIEW);
    await reviewService.remove("1", "2", false);
    expect(mockDb.review.delete).toHaveBeenCalled();
  });

  it("deletes when admin (any customerId)", async () => {
    (mockDb.review.findUnique as jest.Mock).mockResolvedValue(MOCK_REVIEW);
    (mockDb.review.delete as jest.Mock).mockResolvedValue(MOCK_REVIEW);
    await reviewService.remove("1", null, true);
    expect(mockDb.review.delete).toHaveBeenCalled();
  });

  it("throws NOT_FOUND when missing", async () => {
    (mockDb.review.findUnique as jest.Mock).mockResolvedValue(null);
    await expect(reviewService.remove("1", "2", false)).rejects.toThrow("NOT_FOUND");
  });

  it("throws FORBIDDEN when non-author non-admin", async () => {
    (mockDb.review.findUnique as jest.Mock).mockResolvedValue(MOCK_REVIEW);
    await expect(reviewService.remove("1", "999", false)).rejects.toThrow("FORBIDDEN");
  });
});

describe("reviewService.listByProduct", () => {
  it("returns paginated reviews with summary", async () => {
    (mockDb.review.findMany as jest.Mock).mockResolvedValue([MOCK_REVIEW, MOCK_REVIEW]);
    (mockDb.review.count as jest.Mock).mockResolvedValue(2);
    (mockDb.review.aggregate as jest.Mock).mockResolvedValue({ _avg: { rating: 4.5 } });
    (mockDb.review.groupBy as jest.Mock).mockResolvedValue([
      { rating: 5, _count: { rating: 1 } },
      { rating: 4, _count: { rating: 1 } },
    ]);

    const res = await reviewService.listByProduct("10", 0, 10);
    expect(res.content).toHaveLength(2);
    expect(res.totalElements).toBe(2);
    expect(res.summary.averageRating).toBe(4.5);
    expect(res.summary.distribution[5]).toBe(1);
    expect(res.summary.distribution[4]).toBe(1);
    expect(res.summary.distribution[1]).toBe(0);
    expect(res.last).toBe(true);
  });

  it("handles empty result with null average", async () => {
    (mockDb.review.findMany as jest.Mock).mockResolvedValue([]);
    (mockDb.review.count as jest.Mock).mockResolvedValue(0);
    (mockDb.review.aggregate as jest.Mock).mockResolvedValue({ _avg: { rating: null } });
    (mockDb.review.groupBy as jest.Mock).mockResolvedValue([]);
    const res = await reviewService.listByProduct("10", 0, 10);
    expect(res.summary.averageRating).toBe(0);
    expect(res.totalPages).toBe(0);
  });

  it("computes last=false when more pages exist", async () => {
    (mockDb.review.findMany as jest.Mock).mockResolvedValue([MOCK_REVIEW]);
    (mockDb.review.count as jest.Mock).mockResolvedValue(25);
    (mockDb.review.aggregate as jest.Mock).mockResolvedValue({ _avg: { rating: 5 } });
    (mockDb.review.groupBy as jest.Mock).mockResolvedValue([]);
    const res = await reviewService.listByProduct("10", 0, 10);
    expect(res.last).toBe(false);
    expect(res.totalPages).toBe(3);
  });
});
