/**
 * Unit tests for wishlist service.
 *
 * @module __tests__/services/wishlist.service.test
 * @author Anurag Muthyam
 * @organization indosyn
 */

import { mockDb } from "../mocks/db.mock";

jest.mock("@/lib/logger", () => ({
  createLogger: () => ({ info: jest.fn(), warn: jest.fn(), debug: jest.fn(), error: jest.fn() }),
}));

import { wishlistService } from "@/services/wishlist.service";

const MOCK_PRODUCT = {
  id: BigInt(10),
  name: "Necklace",
  price: "5000",
  imageUrl: "u",
  productType: "JEWELRY",
  stockQuantity: 2,
  active: true,
};

const MOCK_ITEM = {
  id: BigInt(1),
  productId: BigInt(10),
  customerId: BigInt(2),
  addedAt: new Date("2024-01-01"),
  product: MOCK_PRODUCT,
};

beforeEach(() => jest.clearAllMocks());

describe("wishlistService.add", () => {
  it("creates a wishlist item", async () => {
    (mockDb.product.findUnique as jest.Mock).mockResolvedValue(MOCK_PRODUCT);
    (mockDb.wishlistItem.findUnique as jest.Mock).mockResolvedValue(null);
    (mockDb.wishlistItem.create as jest.Mock).mockResolvedValue(MOCK_ITEM);

    const res = await wishlistService.add("2", "10") as { productName: string; inStock: boolean };
    expect(res.productName).toBe("Necklace");
    expect(res.inStock).toBe(true);
  });

  it("throws PRODUCT_NOT_FOUND when product missing", async () => {
    (mockDb.product.findUnique as jest.Mock).mockResolvedValue(null);
    await expect(wishlistService.add("2", "10")).rejects.toThrow("PRODUCT_NOT_FOUND");
  });

  it("throws ALREADY_IN_WISHLIST when item exists", async () => {
    (mockDb.product.findUnique as jest.Mock).mockResolvedValue(MOCK_PRODUCT);
    (mockDb.wishlistItem.findUnique as jest.Mock).mockResolvedValue(MOCK_ITEM);
    await expect(wishlistService.add("2", "10")).rejects.toThrow("ALREADY_IN_WISHLIST");
  });

  it("marks out-of-stock items correctly", async () => {
    (mockDb.product.findUnique as jest.Mock).mockResolvedValue({ ...MOCK_PRODUCT, stockQuantity: 0 });
    (mockDb.wishlistItem.findUnique as jest.Mock).mockResolvedValue(null);
    (mockDb.wishlistItem.create as jest.Mock).mockResolvedValue({
      ...MOCK_ITEM,
      product: { ...MOCK_PRODUCT, stockQuantity: 0 },
    });
    const res = await wishlistService.add("2", "10") as { inStock: boolean };
    expect(res.inStock).toBe(false);
  });
});

describe("wishlistService.remove", () => {
  it("removes an existing item", async () => {
    (mockDb.wishlistItem.findUnique as jest.Mock).mockResolvedValue(MOCK_ITEM);
    (mockDb.wishlistItem.delete as jest.Mock).mockResolvedValue(MOCK_ITEM);
    await expect(wishlistService.remove("2", "10")).resolves.toBeUndefined();
    expect(mockDb.wishlistItem.delete).toHaveBeenCalled();
  });

  it("throws NOT_FOUND when item missing", async () => {
    (mockDb.wishlistItem.findUnique as jest.Mock).mockResolvedValue(null);
    await expect(wishlistService.remove("2", "10")).rejects.toThrow("NOT_FOUND");
  });
});

describe("wishlistService.list", () => {
  it("returns formatted items", async () => {
    (mockDb.wishlistItem.findMany as jest.Mock).mockResolvedValue([MOCK_ITEM, MOCK_ITEM]);
    const res = await wishlistService.list("2");
    expect(res).toHaveLength(2);
    expect((res[0] as { productName: string }).productName).toBe("Necklace");
  });

  it("returns empty array when none", async () => {
    (mockDb.wishlistItem.findMany as jest.Mock).mockResolvedValue([]);
    const res = await wishlistService.list("2");
    expect(res).toEqual([]);
  });
});

describe("wishlistService.isWishlisted", () => {
  it("returns true when item exists", async () => {
    (mockDb.wishlistItem.findUnique as jest.Mock).mockResolvedValue(MOCK_ITEM);
    expect(await wishlistService.isWishlisted("2", "10")).toBe(true);
  });

  it("returns false when item missing", async () => {
    (mockDb.wishlistItem.findUnique as jest.Mock).mockResolvedValue(null);
    expect(await wishlistService.isWishlisted("2", "10")).toBe(false);
  });
});
