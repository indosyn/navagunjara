/**
 * Unit tests for admin service.
 *
 * @module __tests__/services/admin.service.test
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

import { adminService } from "@/services/admin.service";

beforeEach(() => jest.clearAllMocks());

/* ── getDashboardStats ──────────────────────────────────────────────────── */
describe("adminService.getDashboardStats", () => {
  it("returns aggregated dashboard metrics", async () => {
    (mockDb.order.count as jest.Mock)
      .mockResolvedValueOnce(50) // totalOrders
      .mockResolvedValueOnce(5); // pendingOrders
    (mockDb.order.aggregate as jest.Mock).mockResolvedValue({
      _sum: { totalAmount: 500000 },
    });
    (mockDb.product.count as jest.Mock).mockResolvedValue(30);
    (mockDb.product.findMany as jest.Mock).mockResolvedValue([
      { id: BigInt(1), name: "Ring", stockQuantity: 2, productType: "JEWELRY", imageUrl: null },
    ]);
    (mockDb.customer.count as jest.Mock).mockResolvedValue(120);

    const result = (await adminService.getDashboardStats()) as Record<string, unknown>;

    expect(result).toHaveProperty("totalOrders", 50);
    expect(result).toHaveProperty("pendingOrders", 5);
    expect(result).toHaveProperty("totalProducts", 30);
    expect(result).toHaveProperty("totalCustomers", 120);
    expect(result).toHaveProperty("lowStockProducts");
    expect((result.lowStockProducts as unknown[]).length).toBe(1);
  });

  it("defaults revenue to 0 when no orders", async () => {
    (mockDb.order.count as jest.Mock)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0);
    (mockDb.order.aggregate as jest.Mock).mockResolvedValue({
      _sum: { totalAmount: null },
    });
    (mockDb.product.count as jest.Mock).mockResolvedValue(0);
    (mockDb.product.findMany as jest.Mock).mockResolvedValue([]);
    (mockDb.customer.count as jest.Mock).mockResolvedValue(0);

    const result = (await adminService.getDashboardStats()) as Record<string, unknown>;
    expect(result).toHaveProperty("totalRevenue", 0);
  });
});

/* ── getRecentOrders ────────────────────────────────────────────────────── */
describe("adminService.getRecentOrders", () => {
  it("returns recent orders with default limit", async () => {
    const mockOrders = [
      {
        id: BigInt(1),
        customerId: BigInt(100),
        status: "PENDING",
        totalAmount: 10000,
        orderedAt: new Date(),
        customer: { firstName: "Ravi" },
        items: [],
      },
    ];
    (mockDb.order.findMany as jest.Mock).mockResolvedValue(mockOrders);

    const result = await adminService.getRecentOrders();
    expect(result).toBeDefined();
    expect(mockDb.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 5 })
    );
  });

  it("respects custom limit", async () => {
    (mockDb.order.findMany as jest.Mock).mockResolvedValue([]);

    await adminService.getRecentOrders(3);
    expect(mockDb.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 3 })
    );
  });
});
