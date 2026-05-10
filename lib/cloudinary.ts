/**
 * Cloudinary SDK configuration and upload helpers.
 *
 * @module lib/cloudinary
 * @author Anurag Muthyam
 * @organization indosyn
 */

import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Upload a file buffer to Cloudinary.
 *
 * @param buffer - File buffer from multipart form data.
 * @param folder - Cloudinary folder path (e.g. `"products/jewelry"`).
 * @returns Upload result with `secure_url` and `public_id`.
 */
export async function uploadImage(
  buffer: Buffer,
  folder: string
): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: `navagunjara/${folder}`,
          resource_type: "image",
          transformation: [
            { width: 1200, height: 1200, crop: "limit", quality: "auto:good" },
          ],
        },
        (error, result) => {
          if (error || !result) return reject(error ?? new Error("Upload failed"));
          resolve({ url: result.secure_url, publicId: result.public_id });
        }
      )
      .end(buffer);
  });
}

/**
 * Delete an image from Cloudinary by its public ID.
 *
 * @param publicId - Cloudinary public ID.
 */
export async function deleteImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}

export { cloudinary };
