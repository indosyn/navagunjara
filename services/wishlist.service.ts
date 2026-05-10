/**
 * Wishlist service — manages customer product wishlists.
 *
 * @module services/wishlist.service
 * @author Anurag Muthyam
 * @organization indosyn
 */

import { db } from "@/lib/db";
import { serializeDecimal } from "@/lib/utils";
import { createLogger } from "@/lib/logger";

const log = createLogger("wishlist.service");

export const wishlistService = {
  /**
   * Add a product to the customer's wishlist.
   *
   * @param customerId - Customer ID.
   * @param productId  - Product ID to add.
   * @returns The wishlist item.
   * @throws `ALREADY_IN_WISHLIST` | `PRODUCT_NOT_FOUND`.
   */
  async add(customerId: string, productId: string) {
    log.info({ customerId, productId }, "add: adding to wishlist");

    const product = await db.product.findUnique({
      where: { id: BigInt(productId), active: true },
    });
    if (!product) throw new Error("PRODUCT_NOT_FOUND");

    const existing = await db.wishlistItem.findUnique({
      where: {
        customerId_productId: {
          customerId: BigInt(customerId),
          productId: BigInt(productId),
        },
      },
    });
    if (existing) throw new Error("ALREADY_IN_WISHLIST");

    const item = await db.wishlistItem.create({
      data: {
        customerId: BigInt(customerId),
        productId: BigInt(productId),
      },
      include: { product: true },
    });

    log.info({ wishlistItemId: item.id.toString() }, "add: added to wishlist");
    return serializeDecimal(formatWishlistItem(item));
  },

  /**
   * Remove a product from the customer's wishlist.
   *
   * @param customerId - Customer ID.
   * @param productId  - Product ID to remove.
   * @throws `NOT_FOUND`.
   */
  async remove(customerId: string, productId: string) {
    log.info({ customerId, productId }, "remove: removing from wishlist");

    const item = await db.wishlistItem.findUnique({
      where: {
        customerId_productId: {
          customerId: BigInt(customerId),
          productId: BigInt(productId),
        },
      },
    });
    if (!item) throw new Error("NOT_FOUND");

    await db.wishlistItem.delete({ where: { id: item.id } });
    log.info({ productId }, "remove: removed from wishlist");
  },

  /**
   * List all wishlist items for a customer.
   *
   * @param customerId - Customer ID.
   * @returns Array of wishlist items with product details.
   */
  async list(customerId: string) {
    log.debug({ customerId }, "list: fetching wishlist");

    const items = await db.wishlistItem.findMany({
      where: { customerId: BigInt(customerId) },
      include: { product: true },
      orderBy: { addedAt: "desc" },
    });

    return items.map((item) => serializeDecimal(formatWishlistItem(item)));
  },

  /**
   * Check if a product is in the customer's wishlist.
   *
   * @param customerId - Customer ID.
   * @param productId  - Product ID.
   * @returns `true` if the product is wishlisted.
   */
  async isWishlisted(customerId: string, productId: string): Promise<boolean> {
    const item = await db.wishlistItem.findUnique({
      where: {
        customerId_productId: {
          customerId: BigInt(customerId),
          productId: BigInt(productId),
        },
      },
    });
    return item !== null;
  },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatWishlistItem(item: any) {
  return {
    id: item.id,
    productId: item.productId,
    productName: item.product.name,
    productPrice: item.product.price,
    productImageUrl: item.product.imageUrl,
    productType: item.product.productType,
    inStock: item.product.stockQuantity > 0,
    addedAt: item.addedAt,
  };
}
