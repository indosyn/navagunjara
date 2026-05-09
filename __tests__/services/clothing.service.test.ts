/**
 * Unit tests for clothing service.
 *
 * @module __tests__/services/clothing.service.test
 * @author Anurag Muthyam
 * @organization indosyn
 */

import { mockDb } from "../mocks/db.mock";

jest.mock("@/lib/logger", () => ({
  createLogger: () => ({
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
  }),
}));

import { clothingService } from "@/services/clothing.service";

const MOCK_PRODUCT = {
  id: BigInt(20),
  name: "Silk Saree",
  description: "Kanchipuram silk saree",
  price: 12000,
  stockQuantity: 15,
  imageUrl: null,
  productType: "CLOTHING",
  category: "CLOTHING",
  active: true,
  createdAt: new Date("2024-06-01"),
  updatedAt: new Date("2024-06-01"),
  clothing: {
    clothingType: "SAREE",
    size: "FREE_SIZE",
    color: "Red",
    fabric: "Silk",
    gender: "FEMALE",
  },
};

beforeEach(() => jest.clearAllMocks());

/* ── list ────────────────────────────────────────────────────────────────── */
describe("clothingService.list", () => {
  it("returns paginated clothing products", async () => {
    (mockDb.product.findMany as jest.Mock).mockResolvedValue([MOCK_PRODUCT]);
    (mockDb.product.count as jest.Mock).mockResolvedValue(1);

    const result = await clothingService.list(0, 10);
    expect(result.content).toHaveLength(1);
    expect(result.totalElements).toBe(1);
  });
});

/* ── search ──────────────────────────────────────────────────────────────── */
describe("clothingService.search", () => {
  it("searches by name", async () => {
    (mockDb.product.findMany as jest.Mock).mockResolvedValue([MOCK_PRODUCT]);
    (mockDb.product.count as jest.Mock).mockResolvedValue(1);

    const result = await clothingService.search({ name: "Silk" }, 0, 10);
    expect(result.content).toHaveLength(1);
  });

  it("searches by clothing type", async () => {
    (mockDb.product.findMany as jest.Mock).mockResolvedValue([MOCK_PRODUCT]);
    (mockDb.product.count as jest.Mock).mockResolvedValue(1);

    await clothingService.search({ type: "SAREE" }, 0, 10);

    const whereArg = (mockDb.product.findMany as jest.Mock).mock.calls[0][0].where;
    expect(whereArg.clothing).toEqual(
      expect.objectContaining({ clothingType: "SAREE" })
    );
  });

  it("searches by gender", async () => {
    (mockDb.product.findMany as jest.Mock).mockResolvedValue([MOCK_PRODUCT]);
    (mockDb.product.count as jest.Mock).mockResolvedValue(1);

    await clothingService.search({ gender: "FEMALE" }, 0, 10);

    const whereArg = (mockDb.product.findMany as jest.Mock).mock.calls[0][0].where;
    expect(whereArg.clothing).toEqual(
      expect.objectContaining({ gender: "FEMALE" })
    );
  });
});

/* ── findById ───────────────────────────────────────────────────────────── */
describe("clothingService.findById", () => {
  it("returns a clothing product", async () => {
    (mockDb.product.findFirst as jest.Mock).mockResolvedValue(MOCK_PRODUCT);

    const result = await clothingService.findById("20");
    expect(result).toHaveProperty("name", "Silk Saree");
  });

  it("throws NOT_FOUND when product does not exist", async () => {
    (mockDb.product.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(clothingService.findById("999")).rejects.toThrow("NOT_FOUND");
  });
});

/* ── create ──────────────────────────────────────────────────────────────── */
describe("clothingService.create", () => {
  it("creates a clothing product", async () => {
    (mockDb.product.create as jest.Mock).mockResolvedValue(MOCK_PRODUCT);

    const result = await clothingService.create({
      name: "Silk Saree",
      price: 12000,
      stockQuantity: 15,
      clothingType: "SAREE",
      size: "FREE_SIZE",
      color: "Red",
      gender: "FEMALE",
    });

    expect(result).toHaveProperty("name", "Silk Saree");
    expect(mockDb.product.create).toHaveBeenCalledTimes(1);
  });
});

/* ── update ──────────────────────────────────────────────────────────────── */
describe("clothingService.update", () => {
  it("updates an existing clothing product", async () => {
    (mockDb.product.findFirst as jest.Mock).mockResolvedValue(MOCK_PRODUCT);
    const updated = { ...MOCK_PRODUCT, name: "Cotton Saree" };
    (mockDb.product.update as jest.Mock).mockResolvedValue(updated);

    const result = await clothingService.update("20", { name: "Cotton Saree" });
    expect(result).toHaveProperty("name", "Cotton Saree");
  });

  it("throws NOT_FOUND when product does not exist", async () => {
    (mockDb.product.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(
      clothingService.update("999", { name: "Nope" })
    ).rejects.toThrow("NOT_FOUND");
  });
});

/* ── delete ──────────────────────────────────────────────────────────────── */
describe("clothingService.delete", () => {
  it("soft-deletes the product", async () => {
    (mockDb.product.findFirst as jest.Mock).mockResolvedValue(MOCK_PRODUCT);
    (mockDb.product.update as jest.Mock).mockResolvedValue({
      ...MOCK_PRODUCT,
      active: false,
    });

    await clothingService.delete("20");
    expect(mockDb.product.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ active: false }),
      })
    );
  });

  it("throws NOT_FOUND when product does not exist", async () => {
    (mockDb.product.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(clothingService.delete("999")).rejects.toThrow("NOT_FOUND");
  });
});
