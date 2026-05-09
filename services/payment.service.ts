/**
 * Payment service — handles Razorpay order creation, verification,
 * and payment record management.
 *
 * @module services/payment.service
 * @author Anurag Muthyam
 * @organization indosyn
 */

import { db } from "@/lib/db";
import { razorpay, verifySignature } from "@/lib/razorpay";
import { serializeDecimal } from "@/lib/utils";
import { createLogger } from "@/lib/logger";

const log = createLogger("payment.service");

export const paymentService = {
  /**
   * Create a Razorpay order for an existing order.
   *
   * @param orderId - Internal order ID.
   * @param method  - Payment method (UPI, CARD, etc.).
   * @returns The Razorpay order object and internal payment record.
   * @throws `ORDER_NOT_FOUND` | `ORDER_NOT_PENDING` | `PAYMENT_EXISTS`.
   *
   * @author Anurag Muthyam
   * @organization indosyn
   */
  async createOrder(orderId: string, method: string) {
    log.info({ orderId, method }, "createOrder: initiating payment");

    const order = await db.order.findUnique({ where: { id: BigInt(orderId) } });
    if (!order) {
      log.warn({ orderId }, "createOrder: order not found");
      throw new Error("ORDER_NOT_FOUND");
    }
    if (order.status !== "PENDING") {
      log.warn({ orderId, status: order.status }, "createOrder: order not in PENDING state");
      throw new Error("ORDER_NOT_PENDING");
    }

    // Check for existing pending payment
    const existing = await db.payment.findFirst({
      where: { orderId: BigInt(orderId), status: "PENDING" },
    });
    if (existing) {
      log.info({ orderId, paymentId: existing.id.toString() }, "createOrder: returning existing pending payment");
      return serializeDecimal({
        payment: existing,
        razorpayOrderId: existing.razorpayOrderId,
      });
    }

    // Create Razorpay order
    const amountInPaise = Math.round(Number(order.totalAmount) * 100);
    const rzpOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `order_${orderId}`,
      notes: { orderId },
    });

    // Create payment record
    const payment = await db.payment.create({
      data: {
        orderId: BigInt(orderId),
        amount: order.totalAmount,
        currency: "INR",
        method,
        status: "PENDING",
        razorpayOrderId: rzpOrder.id,
        initiatedAt: new Date(),
      },
    });

    log.info({ paymentId: payment.id.toString(), rzpOrderId: rzpOrder.id }, "createOrder: payment initiated");
    return serializeDecimal({
      payment,
      razorpayOrderId: rzpOrder.id,
      amount: amountInPaise,
      currency: "INR",
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });
  },

  /**
   * Verify Razorpay payment and update records.
   *
   * @param data - Razorpay callback payload with order_id, payment_id, signature.
   * @returns Updated payment record.
   * @throws `INVALID_SIGNATURE` | `PAYMENT_NOT_FOUND`.
   *
   * @author Anurag Muthyam
   * @organization indosyn
   */
  async verify(data: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    orderId: string;
  }) {
    log.info({ rzpOrderId: data.razorpay_order_id }, "verify: verifying payment");

    const isValid = verifySignature(
      data.razorpay_order_id,
      data.razorpay_payment_id,
      data.razorpay_signature
    );
    if (!isValid) {
      log.warn({ rzpOrderId: data.razorpay_order_id }, "verify: invalid signature");
      throw new Error("INVALID_SIGNATURE");
    }

    const payment = await db.payment.findFirst({
      where: { razorpayOrderId: data.razorpay_order_id },
    });
    if (!payment) {
      log.warn({ rzpOrderId: data.razorpay_order_id }, "verify: payment record not found");
      throw new Error("PAYMENT_NOT_FOUND");
    }

    // Update payment + order in a transaction
    const [updatedPayment] = await db.$transaction([
      db.payment.update({
        where: { id: payment.id },
        data: {
          status: "SUCCESS",
          razorpayPaymentId: data.razorpay_payment_id,
          razorpaySignature: data.razorpay_signature,
          completedAt: new Date(),
        },
      }),
      db.order.update({
        where: { id: BigInt(data.orderId) },
        data: { status: "CONFIRMED", updatedAt: new Date() },
      }),
    ]);

    log.info({ paymentId: updatedPayment.id.toString(), orderId: data.orderId }, "verify: payment verified and order confirmed");
    return serializeDecimal(updatedPayment);
  },

  /**
   * Get payment(s) for an order.
   *
   * @param orderId - Internal order ID.
   * @returns Array of payment records.
   *
   * @author Anurag Muthyam
   * @organization indosyn
   */
  async findByOrderId(orderId: string) {
    log.debug({ orderId }, "findByOrderId: looking up payments");
    const payments = await db.payment.findMany({
      where: { orderId: BigInt(orderId) },
      orderBy: { initiatedAt: "desc" },
    });
    return payments.map((p) => serializeDecimal(p));
  },

  /**
   * Mark a payment as failed.
   *
   * @param paymentId     - Internal payment ID.
   * @param failureReason - Reason for failure.
   * @returns Updated payment record.
   *
   * @author Anurag Muthyam
   * @organization indosyn
   */
  async markFailed(paymentId: string, failureReason: string) {
    log.info({ paymentId, failureReason }, "markFailed: marking payment as failed");
    const updated = await db.payment.update({
      where: { id: BigInt(paymentId) },
      data: { status: "FAILED", failureReason, completedAt: new Date() },
    });
    return serializeDecimal(updated);
  },
};
