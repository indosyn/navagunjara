/**
 * Razorpay SDK singleton and utility helpers.
 *
 * @module lib/razorpay
 * @author Anurag Muthyam
 * @organization indosyn
 */

import Razorpay from "razorpay";
import crypto from "crypto";

const globalForRazorpay = globalThis as unknown as { razorpay: Razorpay };

export const razorpay =
  globalForRazorpay.razorpay ||
  new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });

if (process.env.NODE_ENV !== "production") globalForRazorpay.razorpay = razorpay;

/**
 * Verify Razorpay payment signature using HMAC SHA256.
 *
 * @param orderId   - Razorpay order ID.
 * @param paymentId - Razorpay payment ID.
 * @param signature - Razorpay signature from client callback.
 * @returns `true` if the signature is valid.
 */
export function verifySignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const body = `${orderId}|${paymentId}`;
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(signature)
  );
}
