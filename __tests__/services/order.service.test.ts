/**
 * Unit tests for order service.
 *
 * @module __tests__/services/order.service.test
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

import { orderService } from "@/services/order.service";

const MOCK_PRODUCT = {
  id: BigInt(10),
  name: "Gold Ring",
  price: 25000,
  stockQuantity: 5,
  active: true,
};

const MOCK_ORDER = {
  id: BigInt(1),
  customerId: BigInt(100),
  status: "PENDING",
  totalAmount: 50000,
  deliveryAddress: "123 MG Road",
  deliveryCity: "Bangalore",
  deliveryState: "Karnataka",
  deliveryPincode: "560001",
  orderedAt: new Date("2024-06-01"),
  updatedAt: new Date("2024-06-01"),
  customer: {
    id: BigInt(100),
    firstName: "Ravi",
    lastName: "Kumar",
    email: "ravi@example.com",
  },
  items: [
    {
      id: BigInt(1),
      productId: BigInt(10),
      quantity: 2,
      unitPrice: 25000,
      subtotal: 50000,
      product: MOCK_PRODUCT,
    },
  ],
};

beforeEach(() => jest.clearAllMocks());

/* ── place ──────────────────────────────────────────────────────────────── */
describe("orderService.place", () => {
  it("places an order when stock is sufficient", async () => {
    (mockDb.product.findMany as jest.Mock).mockResolvedValue([MOCK_PRODUCT]);
    (mockDb.$transaction as jest.Mock).mockImplementation(async (fn) => {
      return fn({
        order: { create: jest.fn().mockResolvedValue(MOCK_ORDER) },
        product: {
          update: jest.fn().mockResolvedValue(MOCK_PRODUCT),
          updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        },
      });
    });

    const result = await orderService.place({
      customerId: "100",
      deliveryAddress: "123 MG Road",
      deliveryCity: "Bangalore",
      deliveryState: "Karnataka",
      deliveryPincode: "560001",
      items: [{ productId: "10", quantity: 2 }],
    });

    expect(result).toBeDefined();
    expect(mockDb.$transaction).toHaveBeenCalledTimes(1);
  });

  it("throws PRODUCT_NOT_FOUND when a product is missing", async () => {
    (mockDb.product.findMany as jest.Mock).mockResolvedValue([]);

    await expect(
      orderService.place({
        customerId: "100",
        deliveryAddress: "123 MG Road",
        deliveryCity: "Bangalore",
        deliveryState: "Karnataka",
        deliveryPincode: "560001",
        items: [{ productId: "999", quantity: 1 }],
      })
    ).rejects.toThrow("PRODUCT_NOT_FOUND");
  });

  it("throws INSUFFICIENT_STOCK when quantity exceeds stock", async () => {
    const lowStock = { ...MOCK_PRODUCT, stockQuantity: 1 };
    (mockDb.product.findMany as jest.Mock).mockResolvedValue([lowStock]);

    await expect(
      orderService.place({
        customerId: "100",
        deliveryAddress: "123 MG Road",
        deliveryCity: "Bangalore",
        deliveryState: "Karnataka",
        deliveryPincode: "560001",
        items: [{ productId: "10", quantity: 5 }],
      })
    ).rejects.toThrow("INSUFFICIENT_STOCK:10");
  });
});

/* ── findById ───────────────────────────────────────────────────────────── */
describe("orderService.findById", () => {
  it("returns the order when found", async () => {
    (mockDb.order.findUnique as jest.Mock).mockResolvedValue(MOCK_ORDER);

    const result = await orderService.findById("1");
    expect(result).toBeDefined();
  });

  it("throws NOT_FOUND when order does not exist", async () => {
    (mockDb.order.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(orderService.findById("999")).rejects.toThrow("NOT_FOUND");
  });
});

/* ── cancel ──────────────────────────────────────────────────────────────── */
describe("orderService.cancel", () => {
  it("cancels a PENDING order for the owning customer", async () => {
    (mockDb.order.findUnique as jest.Mock).mockResolvedValue({
      id: BigInt(1),
      customerId: BigInt(100),
      status: "PENDING",
    });
    (mockDb.order.update as jest.Mock).mockResolvedValue(MOCK_ORDER);

    const result = await orderService.cancel("1", "100");
    expect(result).toBeDefined();
  });

  it("throws FORBIDDEN when customer does not own the order", async () => {
    (mockDb.order.findUnique as jest.Mock).mockResolvedValue({
      id: BigInt(1),
      customerId: BigInt(100),
      status: "PENDING",
    });

    await expect(orderService.cancel("1", "999")).rejects.toThrow("FORBIDDEN");
  });

  it("throws CANNOT_CANCEL when order is not PENDING", async () => {
    (mockDb.order.findUnique as jest.Mock).mockResolvedValue({
      id: BigInt(1),
      customerId: BigInt(100),
      status: "SHIPPED",
    });

    await expect(orderService.cancel("1", "100")).rejects.toThrow(
      "CANNOT_CANCEL"
    );
  });

  it("throws NOT_FOUND when order does not exist", async () => {
    (mockDb.order.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(orderService.cancel("999", "100")).rejects.toThrow(
      "NOT_FOUND"
    );
  });
});

/* ── listByCustomer ─────────────────────────────────────────────────────── */
describe("orderService.listByCustomer", () => {
  it("returns paginated orders", async () => {
    (mockDb.order.findMany as jest.Mock).mockResolvedValue([MOCK_ORDER]);
    (mockDb.order.count as jest.Mock).mockResolvedValue(1);

    const result = await orderService.listByCustomer("100", 0, 10);
    expect(result.totalElements).toBe(1);
    expect(result.content).toHaveLength(1);
  });
});

/* ── listAll ────────────────────────────────────────────────────────────── */
describe("orderService.listAll", () => {
  it("returns all orders", async () => {
    (mockDb.order.findMany as jest.Mock).mockResolvedValue([MOCK_ORDER]);
    (mockDb.order.count as jest.Mock).mockResolvedValue(1);

    const result = await orderService.listAll(0, 10);
    expect(result.totalElements).toBe(1);
  });

  it("applies status filter when provided", async () => {
    (mockDb.order.findMany as jest.Mock).mockResolvedValue([]);
    (mockDb.order.count as jest.Mock).mockResolvedValue(0);

    await orderService.listAll(0, 10, "PENDING");

    const whereArg = (mockDb.order.findMany as jest.Mock).mock.calls[0][0].where;
    expect(whereArg).toEqual({ status: "PENDING" });
  });
});
