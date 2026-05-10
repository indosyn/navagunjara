/**
 * Admin service — aggregated dashboard statistics and recent-order queries.
 *
 * Uses `Promise.all` to fire all aggregate queries in parallel, keeping
 * dashboard load time under a single DB round-trip window.
 *
 * @module services/admin.service
 * @author Anurag Muthyam
 * @organization indosyn
 */

import { db } from "@/lib/db";
import { serializeDecimal } from "@/lib/utils";
import { createLogger } from "@/lib/logger";

const log = createLogger("admin.service");

export const adminService = {
  /**
   * Fetch aggregated dashboard statistics in a single parallel batch.
   *
   * @returns Object containing total orders, pending orders, revenue,
   *          product / customer counts, and up to 10 low-stock products.
   */
  async getDashboardStats() {
    log.info("getDashboardStats: fetching admin dashboard metrics");

    const [
      totalOrders,
      pendingOrders,
      totalRevenue,
      totalProducts,
      lowStockProducts,
      totalCustomers,
    ] = await Promise.all([
      db.order.count(),
      db.order.count({ where: { status: "PENDING" } }),
      db.order.aggregate({
        _sum: { totalAmount: true },
        where: { status: { notIn: ["CANCELLED"] } },
      }),
      db.product.count({ where: { active: true } }),
      db.product.findMany({
        where: { active: true, stockQuantity: { lte: 10 } },
        select: {
          id: true,
          name: true,
          stockQuantity: true,
          productType: true,
          imageUrl: true,
        },
        orderBy: { stockQuantity: "asc" },
        take: 10,
      }),
      db.customer.count(),
    ]);

    log.info(
      { totalOrders, pendingOrders, totalProducts, totalCustomers, lowStock: lowStockProducts.length },
      "getDashboardStats: metrics ready"
    );

    return serializeDecimal({
      totalOrders,
      pendingOrders,
      totalRevenue: totalRevenue._sum.totalAmount ?? 0,
      totalProducts,
      totalCustomers,
      lowStockProducts,
    });
  },

  /**
   * Retrieve the most recent orders (admin quick-view).
   *
   * @param limit - Maximum number of orders to return (default 5).
   * @returns Array of recent orders with customer and item data.
   */
  async getRecentOrders(limit = 5) {
    log.debug({ limit }, "getRecentOrders: fetching recent orders");

    const orders = await db.order.findMany({
      include: { customer: true, items: true },
      orderBy: { orderedAt: "desc" },
      take: limit,
    });

    log.debug({ count: orders.length }, "getRecentOrders: done");
    return serializeDecimal(orders);
  },
};
