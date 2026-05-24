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
  // timingSafeEqual requires equal-length buffers — a wrong-length signature
  // would otherwise throw ERR_CRYPTO_TIMING_SAFE_EQUAL_LENGTH.
  const expectedBuf = Buffer.from(expected, "utf8");
  const givenBuf = Buffer.from(signature ?? "", "utf8");
  if (expectedBuf.length !== givenBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, givenBuf);
}

/**
 * Verify a Razorpay webhook signature.
 *
 * Razorpay computes `HMAC_SHA256(rawBody, webhookSecret)` and sends it as the
 * `x-razorpay-signature` header. We MUST verify against the raw request body
 * (not a re-stringified JSON) so the byte sequence matches exactly.
 *
 * @param rawBody   - Raw HTTP request body (string).
 * @param signature - Value of the `x-razorpay-signature` header.
 * @returns `true` if the signature is valid.
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string | null | undefined
): boolean {
  if (!signature) return false;
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    // Fail closed in production; allow signed-by-key-secret fallback only in dev.
    return false;
  }
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  // timingSafeEqual requires equal-length buffers
  const expectedBuf = Buffer.from(expected, "utf8");
  const givenBuf = Buffer.from(signature, "utf8");
  if (expectedBuf.length !== givenBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, givenBuf);
}
