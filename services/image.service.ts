/**
 * Image service — handles Cloudinary uploads and ProductImage records.
 *
 * @module services/image.service
 * @author Anurag Muthyam
 * @organization indosyn
 */

import { db } from "@/lib/db";
import { uploadImage, deleteImage } from "@/lib/cloudinary";
import { serializeDecimal } from "@/lib/utils";
import { createLogger } from "@/lib/logger";

const log = createLogger("image.service");

export const imageService = {
  /**
   * Upload images for a product.
   *
   * @param productId - Product ID.
   * @param files     - Array of `{ buffer, filename }`.
   * @returns Array of created ProductImage records.
   */
  async upload(
    productId: string,
    files: Array<{ buffer: Buffer; filename: string }>
  ) {
    log.info({ productId, count: files.length }, "upload: uploading images");

    const product = await db.product.findUnique({
      where: { id: BigInt(productId) },
    });
    if (!product) throw new Error("PRODUCT_NOT_FOUND");

    const folder = product.productType === "JEWELRY" ? "jewelry" : "clothing";
    const maxSort = await db.productImage.aggregate({
      where: { productId: BigInt(productId) },
      _max: { sortOrder: true },
    });
    let nextSort = (maxSort._max.sortOrder ?? -1) + 1;

    const results = [];
    for (const file of files) {
      const { url, publicId } = await uploadImage(file.buffer, folder);
      const image = await db.productImage.create({
        data: {
          productId: BigInt(productId),
          url,
          publicId,
          alt: file.filename.replace(/\.[^.]+$/, ""),
          sortOrder: nextSort++,
        },
      });

      // Set as primary image if it's the first one
      if (nextSort === 1) {
        await db.product.update({
          where: { id: BigInt(productId) },
          data: { imageUrl: url },
        });
      }

      results.push(serializeDecimal(image));
    }

    log.info({ productId, uploaded: results.length }, "upload: images uploaded");
    return results;
  },

  /**
   * List all images for a product.
   *
   * @param productId - Product ID.
   * @returns Array of ProductImage records.
   */
  async listByProduct(productId: string) {
    const images = await db.productImage.findMany({
      where: { productId: BigInt(productId) },
      orderBy: { sortOrder: "asc" },
    });
    return images.map((img) => serializeDecimal(img));
  },

  /**
   * Delete a product image (Cloudinary + DB).
   *
   * @param imageId - ProductImage ID.
   * @throws `NOT_FOUND`.
   */
  async remove(imageId: string) {
    log.info({ imageId }, "remove: deleting image");

    let parsedId: bigint;
    try {
      parsedId = BigInt(imageId);
    } catch {
      throw new Error("NOT_FOUND");
    }

    const image = await db.productImage.findUnique({ where: { id: parsedId } });
    if (!image) throw new Error("NOT_FOUND");

    if (image.publicId) {
      await deleteImage(image.publicId);
    }

    await db.productImage.delete({ where: { id: parsedId } });
    log.info({ imageId, publicId: image.publicId }, "remove: image deleted");
  },
};
