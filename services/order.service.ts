/**
 * Order service — handles order placement, listing, cancellation,
 * and status updates.
 *
 * Order placement runs inside a database transaction to ensure atomicity
 * of stock decrement + order creation. All BigInt / Decimal values are
 * serialized before returning.
 *
 * @module services/order.service
 * @author Anurag Muthyam
 * @organization indosyn
 */

import { db } from "@/lib/db";
import { serializeDecimal } from "@/lib/utils";
import { createLogger } from "@/lib/logger";
import type { CreateOrderInput } from "@/lib/validations";

const log = createLogger("order.service");

export const orderService = {
  /**
   * Place a new order with stock validation and atomic stock decrement.
   *
   * @param data - Validated order payload including items and delivery address.
   * @returns The created order with items, product names, and customer info.
   * @throws `PRODUCT_NOT_FOUND` if any item references an inactive or missing product.
   * @throws `INSUFFICIENT_STOCK:<productId>` if stock is too low for any item.
   *
   * @author Anurag Muthyam
   * @organization indosyn
   */
  async place(data: CreateOrderInput) {
    log.info({ customerId: data.customerId, itemCount: data.items.length }, "place: starting order placement");
    // Validate all products exist and have sufficient stock
    const productIds = data.items.map((i) => BigInt(i.productId));
    const products = await db.product.findMany({
      where: { id: { in: productIds }, active: true },
    });

    if (products.length !== data.items.length) {
      log.warn({ requested: data.items.length, found: products.length }, "place: one or more products not found");
      throw new Error("PRODUCT_NOT_FOUND");
    }

    // Check stock
    for (const item of data.items) {
      const product = products.find((p) => p.id === BigInt(item.productId));
      if (!product || product.stockQuantity < item.quantity) {
        log.warn({ productId: item.productId, requested: item.quantity, available: product?.stockQuantity }, "place: insufficient stock");
        throw new Error(`INSUFFICIENT_STOCK:${item.productId}`);
      }
    }

    // Calculate total
    const totalAmount = data.items.reduce((sum, item) => {
      const product = products.find((p) => p.id === BigInt(item.productId))!;
      return sum + Number(product.price) * item.quantity;
    }, 0);

    // Create order + items in a transaction
    const order = await db.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          customerId: BigInt(data.customerId),
          status: "PENDING",
          totalAmount: totalAmount,
          deliveryAddress: data.deliveryAddress,
          deliveryCity: data.deliveryCity,
          deliveryState: data.deliveryState,
          deliveryPincode: data.deliveryPincode,
          orderedAt: new Date(),
          updatedAt: new Date(),
          items: {
            create: data.items.map((item) => {
              const product = products.find(
                (p) => p.id === BigInt(item.productId)
              )!;
              const unitPrice = Number(product.price);
              return {
                productId: BigInt(item.productId),
                quantity: item.quantity,
                unitPrice: unitPrice,
                subtotal: unitPrice * item.quantity,
              };
            }),
          },
        },
        include: {
          customer: true,
          items: { include: { product: true } },
        },
      });

      // Decrement stock
      for (const item of data.items) {
        await tx.product.update({
          where: { id: BigInt(item.productId) },
          data: { stockQuantity: { decrement: item.quantity } },
        });
      }

      return newOrder;
    });

    log.info({ orderId: order.id.toString(), total: totalAmount }, "place: order created");
    return serializeDecimal(formatOrder(order));
  },

  /**
   * List orders for a specific customer with pagination.
   *
   * @param customerId - Customer ID.
   * @param page       - Zero-based page index.
   * @param size       - Items per page.
   * @returns Paginated order list.
   *
   * @author Anurag Muthyam
   * @organization indosyn
   */
  async listByCustomer(customerId: string, page: number, size: number) {
    log.debug({ customerId, page, size }, "listByCustomer: fetching orders");
    const where = { customerId: BigInt(customerId) };
    const [orders, total] = await Promise.all([
      db.order.findMany({
        where,
        include: { customer: true, items: { include: { product: true } } },
        skip: page * size,
        take: size,
        orderBy: { orderedAt: "desc" },
      }),
      db.order.count({ where }),
    ]);
    return {
      content: orders.map((o) => serializeDecimal(formatOrder(o))),
      page,
      size,
      totalElements: total,
      totalPages: Math.ceil(total / size),
      last: (page + 1) * size >= total,
    };
  },

  /**
   * List all orders with optional status filter (admin use).
   *
   * @param page   - Zero-based page index.
   * @param size   - Items per page.
   * @param status - Optional order status filter.
   * @returns Paginated order list.
   *
   * @author Anurag Muthyam
   * @organization indosyn
   */
  async listAll(page: number, size: number, status?: string) {
    log.debug({ page, size, status }, "listAll: fetching all orders");
    const where = status ? { status } : {};
    const [orders, total] = await Promise.all([
      db.order.findMany({
        where,
        include: { customer: true, items: { include: { product: true } } },
        skip: page * size,
        take: size,
        orderBy: { orderedAt: "desc" },
      }),
      db.order.count({ where }),
    ]);
    return {
      content: orders.map((o) => serializeDecimal(formatOrder(o))),
      page,
      size,
      totalElements: total,
      totalPages: Math.ceil(total / size),
      last: (page + 1) * size >= total,
    };
  },

  /**
   * Find a single order by ID.
   *
   * @param id - Order ID.
   * @returns Serialized order with items and customer info.
   * @throws `NOT_FOUND` if the order does not exist.
   *
   * @author Anurag Muthyam
   * @organization indosyn
   */
  async findById(id: string) {
    log.debug({ id }, "findById: looking up order");

    const order = await db.order.findUnique({
      where: { id: BigInt(id) },
      include: { customer: true, items: { include: { product: true } } },
    });
    if (!order) {
      log.warn({ id }, "findById: order not found");
      throw new Error("NOT_FOUND");
    }
    return serializeDecimal(formatOrder(order));
  },

  /**
   * Cancel a pending order (customer-initiated).
   *
   * @param id                   - Order ID.
   * @param requestingCustomerId - ID of the customer requesting cancellation.
   * @returns The cancelled order.
   * @throws `NOT_FOUND` / `FORBIDDEN` / `CANNOT_CANCEL`.
   *
   * @author Anurag Muthyam
   * @organization indosyn
   */
  async cancel(id: string, requestingCustomerId: string) {
    log.info({ id, requestingCustomerId }, "cancel: cancellation requested");

    const order = await db.order.findUnique({ where: { id: BigInt(id) } });
    if (!order) {
      log.warn({ id }, "cancel: order not found");
      throw new Error("NOT_FOUND");
    }
    if (order.customerId !== BigInt(requestingCustomerId)) {
      log.warn({ id, requestingCustomerId }, "cancel: forbidden — customer mismatch");
      throw new Error("FORBIDDEN");
    }
    if (order.status !== "PENDING") {
      log.warn({ id, status: order.status }, "cancel: order not in PENDING state");
      throw new Error("CANNOT_CANCEL");
    }

    const updated = await db.order.update({
      where: { id: BigInt(id) },
      data: { status: "CANCELLED", updatedAt: new Date() },
      include: { customer: true, items: { include: { product: true } } },
    });

    log.info({ id }, "cancel: order cancelled");
    return serializeDecimal(formatOrder(updated));
  },

  /**
   * Update an order's status (admin-initiated).
   *
   * @param id     - Order ID.
   * @param status - New status value.
   * @returns The updated order.
   * @throws `NOT_FOUND` if the order does not exist.
   *
   * @author Anurag Muthyam
   * @organization indosyn
   */
  async updateStatus(id: string, status: string) {
    log.info({ id, status }, "updateStatus: changing order status");

    const order = await db.order.findUnique({ where: { id: BigInt(id) } });
    if (!order) {
      log.warn({ id }, "updateStatus: order not found");
      throw new Error("NOT_FOUND");
    }

    const updated = await db.order.update({
      where: { id: BigInt(id) },
      data: { status, updatedAt: new Date() },
      include: { customer: true, items: { include: { product: true } } },
    });

    log.info({ id, from: order.status, to: status }, "updateStatus: status updated");
    return serializeDecimal(formatOrder(updated));
  },
};

// Shape the order response to match the API contract
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatOrder(order: any) {
  return {
    id: order.id,
    customerId: order.customerId,
    customerName: `${order.customer.firstName} ${order.customer.lastName}`,
    status: order.status,
    totalAmount: order.totalAmount,
    deliveryAddress: order.deliveryAddress,
    deliveryCity: order.deliveryCity,
    deliveryState: order.deliveryState,
    deliveryPincode: order.deliveryPincode,
    orderedAt: order.orderedAt,
    updatedAt: order.updatedAt,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    items: order.items.map((item: any) => ({
      productId: item.productId,
      productName: item.product.name,
      imageUrl: item.product.imageUrl,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      subtotal: item.subtotal,
    })),
  };
}
