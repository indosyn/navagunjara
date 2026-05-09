/**
 * Jewelry service — CRUD operations for jewelry products.
 *
 * Handles listing, searching, creating, updating, and soft-deleting
 * jewelry products. All responses have BigInt / Decimal values serialized
 * for JSON safety.
 *
 * @module services/jewelry.service
 * @author Anurag Muthyam
 * @organization indosyn
 */

import { db } from "@/lib/db";
import { serializeDecimal } from "@/lib/utils";
import { createLogger } from "@/lib/logger";
import type { CreateJewelryInput, UpdateJewelryInput } from "@/lib/validations";

const log = createLogger("jewelry.service");

const INCLUDE_JEWELRY = { jewelry: true } as const;

/** Lean select for list views — avoids fetching full description / metadata. */
const LIST_SELECT = {
  id: true,
  name: true,
  price: true,
  stockQuantity: true,
  imageUrl: true,
  productType: true,
  active: true,
  createdAt: true,
  jewelry: { select: { jewelleryType: true, material: true } },
} as const;

export const jewelryService = {
  /**
   * List active jewelry products with server-side pagination.
   *
   * @param page - Zero-based page index.
   * @param size - Number of items per page.
   * @returns Paginated jewelry result set.
   *
   * @author Anurag Muthyam
   * @organization indosyn
   */
  async list(page: number, size: number) {
    log.debug({ page, size }, "list: fetching jewelry page");

    const where = { productType: "JEWELRY", active: true };
    const [items, total] = await Promise.all([
      db.product.findMany({
        where,
        select: LIST_SELECT,
        skip: page * size,
        take: size,
        orderBy: { createdAt: "desc" },
      }),
      db.product.count({ where }),
    ]);

    log.debug({ count: items.length, total }, "list: returned items");
    return {
      content: items.map(serializeDecimal),
      page,
      size,
      totalElements: total,
      totalPages: Math.ceil(total / size),
      last: (page + 1) * size >= total,
    };
  },

  /**
   * Search jewelry products by name and/or jewelry type.
   *
   * @param filters - Optional `name` (partial) and `type` (exact) filters.
   * @param page    - Zero-based page index.
   * @param size    - Items per page.
   * @returns Filtered, paginated jewelry result set.
   *
   * @author Anurag Muthyam
   * @organization indosyn
   */
  async search(
    filters: { type?: string; name?: string },
    page: number,
    size: number
  ) {
    log.debug({ filters, page, size }, "search: querying jewelry");

    const where: Record<string, unknown> = { productType: "JEWELRY", active: true };
    if (filters.name) where.name = { contains: filters.name, mode: "insensitive" };
    if (filters.type) {
      where.jewelry = { jewelleryType: filters.type };
    }
    const [items, total] = await Promise.all([
      db.product.findMany({
        where,
        include: INCLUDE_JEWELRY,
        skip: page * size,
        take: size,
        orderBy: { createdAt: "desc" },
      }),
      db.product.count({ where }),
    ]);

    log.debug({ count: items.length, total }, "search: matched items");
    return {
      content: items.map(serializeDecimal),
      page,
      size,
      totalElements: total,
      totalPages: Math.ceil(total / size),
      last: (page + 1) * size >= total,
    };
  },

  /**
   * Find a single jewelry product by ID.
   *
   * @param id - Product ID (BigInt as string).
   * @returns Serialized jewelry product with details.
   * @throws `NOT_FOUND` when no active jewelry matches the ID.
   *
   * @author Anurag Muthyam
   * @organization indosyn
   */
  async findById(id: string) {
    log.debug({ id }, "findById: looking up jewelry");

    const item = await db.product.findFirst({
      where: { id: BigInt(id), productType: "JEWELRY" },
      include: INCLUDE_JEWELRY,
    });
    if (!item) {
      log.warn({ id }, "findById: jewelry not found");
      throw new Error("NOT_FOUND");
    }

    log.debug({ id, name: item.name }, "findById: found jewelry");
    return serializeDecimal(item);
  },

  /**
   * Create a new jewelry product with its detail record.
   *
   * @param data - Validated jewelry creation payload.
   * @returns The newly created product with jewelry details.
   *
   * @author Anurag Muthyam
   * @organization indosyn
   */
  async create(data: CreateJewelryInput) {
    log.info({ name: data.name, type: data.jewelleryType }, "create: creating jewelry product");

    const product = await db.product.create({
      data: {
        productType: "JEWELRY",
        name: data.name,
        description: data.description ?? null,
        price: data.price,
        stockQuantity: data.stockQuantity,
        imageUrl: data.imageUrl || null,
        category: "JEWELRY",
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        jewelry: {
          create: {
            jewelleryType: data.jewelleryType,
            material: data.material,
            gemstone: data.gemstone ?? null,
            weightGrams: data.weightGrams ?? null,
            caratValue: data.caratValue ?? null,
          },
        },
      },
      include: INCLUDE_JEWELRY,
    });

    log.info({ id: product.id.toString(), name: product.name }, "create: jewelry created");
    return serializeDecimal(product);
  },

  /**
   * Update an existing jewelry product and its detail fields.
   *
   * @param id   - Product ID.
   * @param data - Partial update payload.
   * @returns The updated product with jewelry details.
   * @throws `NOT_FOUND` if the product does not exist.
   *
   * @author Anurag Muthyam
   * @organization indosyn
   */
  async update(id: string, data: UpdateJewelryInput) {
    log.info({ id }, "update: updating jewelry");

    const existing = await db.product.findFirst({
      where: { id: BigInt(id), productType: "JEWELRY" },
    });
    if (!existing) {
      log.warn({ id }, "update: jewelry not found");
      throw new Error("NOT_FOUND");
    }

    const { jewelleryType, material, gemstone, weightGrams, caratValue, ...productData } = data;

    const product = await db.product.update({
      where: { id: BigInt(id) },
      data: {
        ...productData,
        updatedAt: new Date(),
        jewelry: {
          update: {
            ...(jewelleryType && { jewelleryType }),
            ...(material && { material }),
            gemstone: gemstone ?? undefined,
            weightGrams: weightGrams ?? undefined,
            caratValue: caratValue ?? undefined,
          },
        },
      },
      include: INCLUDE_JEWELRY,
    });

    log.info({ id, name: product.name }, "update: jewelry updated");
    return serializeDecimal(product);
  },

  /**
   * Soft-delete a jewelry product (sets `active = false`).
   *
   * @param id - Product ID.
   * @throws `NOT_FOUND` if the product does not exist.
   *
   * @author Anurag Muthyam
   * @organization indosyn
   */
  async delete(id: string) {
    log.info({ id }, "delete: soft-deleting jewelry");

    const existing = await db.product.findFirst({
      where: { id: BigInt(id), productType: "JEWELRY" },
    });
    if (!existing) {
      log.warn({ id }, "delete: jewelry not found");
      throw new Error("NOT_FOUND");
    }
    // Soft delete
    await db.product.update({
      where: { id: BigInt(id) },
      data: { active: false, updatedAt: new Date() },
    });

    log.info({ id, name: existing.name }, "delete: jewelry deactivated");
  },
};
