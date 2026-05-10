/**
 * Clothing service — CRUD operations for clothing products.
 *
 * Handles listing, searching, creating, updating, and soft-deleting
 * clothing products. All responses have BigInt / Decimal values serialized
 * for JSON safety.
 *
 * @module services/clothing.service
 * @author Anurag Muthyam
 * @organization indosyn
 */

import { db } from "@/lib/db";
import { serializeDecimal } from "@/lib/utils";
import { createLogger } from "@/lib/logger";
import type { CreateClothingInput, UpdateClothingInput } from "@/lib/validations";

const log = createLogger("clothing.service");

const INCLUDE_CLOTHING = { clothing: true } as const;

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
  clothing: { select: { clothingType: true, size: true, color: true, gender: true } },
} as const;

export const clothingService = {
  /**
   * List active clothing products with server-side pagination.
   *
   * @param page - Zero-based page index.
   * @param size - Items per page.
   * @returns Paginated clothing result set.
   */
  async list(page: number, size: number) {
    log.debug({ page, size }, "list: fetching clothing page");

    const where = { productType: "CLOTHING", active: true };
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
   * Search clothing products by name, clothing type, and/or gender.
   *
   * @param filters - Optional `name`, `type`, and `gender` filters.
   * @param page    - Zero-based page index.
   * @param size    - Items per page.
   * @returns Filtered, paginated clothing result set.
   */
  async search(
    filters: { type?: string; gender?: string; name?: string },
    page: number,
    size: number
  ) {
    log.debug({ filters, page, size }, "search: querying clothing");

    const where: Record<string, unknown> = { productType: "CLOTHING", active: true };
    if (filters.name) where.name = { contains: filters.name, mode: "insensitive" };
    if (filters.type || filters.gender) {
      where.clothing = {
        ...(filters.type && { clothingType: filters.type }),
        ...(filters.gender && { gender: filters.gender }),
      };
    }
    const [items, total] = await Promise.all([
      db.product.findMany({
        where,
        include: INCLUDE_CLOTHING,
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
   * Find a single clothing product by ID.
   *
   * @param id - Product ID (BigInt as string).
   * @returns Serialized clothing product with details.
   * @throws `NOT_FOUND` when no active clothing matches the ID.
   */
  async findById(id: string) {
    log.debug({ id }, "findById: looking up clothing");

    const item = await db.product.findFirst({
      where: { id: BigInt(id), productType: "CLOTHING" },
      include: INCLUDE_CLOTHING,
    });
    if (!item) {
      log.warn({ id }, "findById: clothing not found");
      throw new Error("NOT_FOUND");
    }

    log.debug({ id, name: item.name }, "findById: found clothing");
    return serializeDecimal(item);
  },

  /**
   * Create a new clothing product with its detail record.
   *
   * @param data - Validated clothing creation payload.
   * @returns The newly created product with clothing details.
   */
  async create(data: CreateClothingInput) {
    log.info({ name: data.name, type: data.clothingType }, "create: creating clothing product");

    const product = await db.product.create({
      data: {
        productType: "CLOTHING",
        name: data.name,
        description: data.description ?? null,
        price: data.price,
        stockQuantity: data.stockQuantity,
        imageUrl: data.imageUrl || null,
        category: "CLOTHING",
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        clothing: {
          create: {
            clothingType: data.clothingType,
            size: data.size,
            color: data.color,
            fabric: data.fabric ?? null,
            gender: data.gender,
          },
        },
      },
      include: INCLUDE_CLOTHING,
    });

    log.info({ id: product.id.toString(), name: product.name }, "create: clothing created");
    return serializeDecimal(product);
  },

  /**
   * Update an existing clothing product and its detail fields.
   *
   * @param id   - Product ID.
   * @param data - Partial update payload.
   * @returns The updated product with clothing details.
   * @throws `NOT_FOUND` if the product does not exist.
   */
  async update(id: string, data: UpdateClothingInput) {
    log.info({ id }, "update: updating clothing");

    const existing = await db.product.findFirst({
      where: { id: BigInt(id), productType: "CLOTHING" },
    });
    if (!existing) {
      log.warn({ id }, "update: clothing not found");
      throw new Error("NOT_FOUND");
    }

    const { clothingType, size, color, fabric, gender, ...productData } = data;

    const product = await db.product.update({
      where: { id: BigInt(id) },
      data: {
        ...productData,
        updatedAt: new Date(),
        clothing: {
          update: {
            ...(clothingType && { clothingType }),
            ...(size && { size }),
            ...(color && { color }),
            ...(fabric !== undefined && { fabric }),
            ...(gender && { gender }),
          },
        },
      },
      include: INCLUDE_CLOTHING,
    });

    log.info({ id, name: product.name }, "update: clothing updated");
    return serializeDecimal(product);
  },

  /**
   * Soft-delete a clothing product (sets `active = false`).
   *
   * @param id - Product ID.
   * @throws `NOT_FOUND` if the product does not exist.
   */
  async delete(id: string) {
    log.info({ id }, "delete: soft-deleting clothing");

    const existing = await db.product.findFirst({
      where: { id: BigInt(id), productType: "CLOTHING" },
    });
    if (!existing) {
      log.warn({ id }, "delete: clothing not found");
      throw new Error("NOT_FOUND");
    }
    await db.product.update({
      where: { id: BigInt(id) },
      data: { active: false, updatedAt: new Date() },
    });

    log.info({ id, name: existing.name }, "delete: clothing deactivated");
  },
};
