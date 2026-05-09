/**
 * Unit tests for jewelry service.
 *
 * @module __tests__/services/jewelry.service.test
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

import { jewelryService } from "@/services/jewelry.service";

const MOCK_PRODUCT = {
  id: BigInt(10),
  name: "Gold Necklace",
  description: "22K gold necklace",
  price: 45000,
  stockQuantity: 5,
  imageUrl: null,
  productType: "JEWELRY",
  category: "JEWELRY",
  active: true,
  createdAt: new Date("2024-06-01"),
  updatedAt: new Date("2024-06-01"),
  jewelry: {
    jewelleryType: "NECKLACE",
    material: "Gold",
    gemstone: null,
    weightGrams: 15.5,
    caratValue: 22,
  },
};

beforeEach(() => jest.clearAllMocks());

/* ── list ────────────────────────────────────────────────────────────────── */
describe("jewelryService.list", () => {
  it("returns paginated jewelry products", async () => {
    (mockDb.product.findMany as jest.Mock).mockResolvedValue([MOCK_PRODUCT]);
    (mockDb.product.count as jest.Mock).mockResolvedValue(1);

    const result = await jewelryService.list(0, 10);
    expect(result.content).toHaveLength(1);
    expect(result.totalElements).toBe(1);
    expect(result.totalPages).toBe(1);
  });

  it("returns empty content when no products", async () => {
    (mockDb.product.findMany as jest.Mock).mockResolvedValue([]);
    (mockDb.product.count as jest.Mock).mockResolvedValue(0);

    const result = await jewelryService.list(0, 10);
    expect(result.content).toHaveLength(0);
    expect(result.totalPages).toBe(0);
  });
});

/* ── search ──────────────────────────────────────────────────────────────── */
describe("jewelryService.search", () => {
  it("searches by name", async () => {
    (mockDb.product.findMany as jest.Mock).mockResolvedValue([MOCK_PRODUCT]);
    (mockDb.product.count as jest.Mock).mockResolvedValue(1);

    const result = await jewelryService.search({ name: "Gold" }, 0, 10);
    expect(result.content).toHaveLength(1);

    const whereArg = (mockDb.product.findMany as jest.Mock).mock.calls[0][0].where;
    expect(whereArg.name).toEqual({ contains: "Gold", mode: "insensitive" });
  });

  it("searches by jewelry type", async () => {
    (mockDb.product.findMany as jest.Mock).mockResolvedValue([MOCK_PRODUCT]);
    (mockDb.product.count as jest.Mock).mockResolvedValue(1);

    await jewelryService.search({ type: "NECKLACE" }, 0, 10);

    const whereArg = (mockDb.product.findMany as jest.Mock).mock.calls[0][0].where;
    expect(whereArg.jewelry).toEqual({ jewelleryType: "NECKLACE" });
  });

  it("returns empty when no match", async () => {
    (mockDb.product.findMany as jest.Mock).mockResolvedValue([]);
    (mockDb.product.count as jest.Mock).mockResolvedValue(0);

    const result = await jewelryService.search({ name: "xyz" }, 0, 10);
    expect(result.content).toHaveLength(0);
  });
});

/* ── findById ───────────────────────────────────────────────────────────── */
describe("jewelryService.findById", () => {
  it("returns a jewelry product", async () => {
    (mockDb.product.findFirst as jest.Mock).mockResolvedValue(MOCK_PRODUCT);

    const result = await jewelryService.findById("10");
    expect(result).toHaveProperty("name", "Gold Necklace");
  });

  it("throws NOT_FOUND when product does not exist", async () => {
    (mockDb.product.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(jewelryService.findById("999")).rejects.toThrow("NOT_FOUND");
  });
});

/* ── create ──────────────────────────────────────────────────────────────── */
describe("jewelryService.create", () => {
  it("creates a jewelry product", async () => {
    (mockDb.product.create as jest.Mock).mockResolvedValue(MOCK_PRODUCT);

    const result = await jewelryService.create({
      name: "Gold Necklace",
      price: 45000,
      stockQuantity: 5,
      jewelleryType: "NECKLACE",
      material: "Gold",
    });

    expect(result).toHaveProperty("name", "Gold Necklace");
    expect(mockDb.product.create).toHaveBeenCalledTimes(1);
  });
});

/* ── update ──────────────────────────────────────────────────────────────── */
describe("jewelryService.update", () => {
  it("updates an existing jewelry product", async () => {
    (mockDb.product.findFirst as jest.Mock).mockResolvedValue(MOCK_PRODUCT);
    const updated = { ...MOCK_PRODUCT, name: "Silver Necklace" };
    (mockDb.product.update as jest.Mock).mockResolvedValue(updated);

    const result = await jewelryService.update("10", { name: "Silver Necklace" });
    expect(result).toHaveProperty("name", "Silver Necklace");
  });

  it("throws NOT_FOUND when product does not exist", async () => {
    (mockDb.product.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(
      jewelryService.update("999", { name: "Nope" })
    ).rejects.toThrow("NOT_FOUND");
  });
});

/* ── delete ──────────────────────────────────────────────────────────────── */
describe("jewelryService.delete", () => {
  it("soft-deletes the product", async () => {
    (mockDb.product.findFirst as jest.Mock).mockResolvedValue(MOCK_PRODUCT);
    (mockDb.product.update as jest.Mock).mockResolvedValue({
      ...MOCK_PRODUCT,
      active: false,
    });

    await jewelryService.delete("10");
    expect(mockDb.product.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ active: false }),
      })
    );
  });

  it("throws NOT_FOUND when product does not exist", async () => {
    (mockDb.product.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(jewelryService.delete("999")).rejects.toThrow("NOT_FOUND");
  });
});
