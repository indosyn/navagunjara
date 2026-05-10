/**
 * Email service using Resend for transactional emails.
 *
 * @module lib/email
 * @author Anurag Muthyam
 * @organization indosyn
 */

import { Resend } from "resend";
import { createLogger } from "@/lib/logger";

const log = createLogger("email");

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL ?? "orders@navagunjara.com";

/**
 * Send an order confirmation email to the customer.
 *
 * @param to        - Customer email address.
 * @param orderId   - Order ID.
 * @param total     - Order total formatted as string.
 * @param itemCount - Number of items in the order.
 */
export async function sendOrderConfirmation(
  to: string,
  orderId: string,
  total: string,
  itemCount: number
): Promise<void> {
  try {
    await resend.emails.send({
      from: `Navagunjara <${FROM}>`,
      to,
      subject: `Order Confirmed — #${orderId}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <h1 style="color:#b45309">🦚 Navagunjara</h1>
          <h2>Order Confirmed!</h2>
          <p>Thank you for your order. Here are your order details:</p>
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>Order ID</strong></td><td style="padding:8px;border-bottom:1px solid #eee">#${orderId}</td></tr>
            <tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>Items</strong></td><td style="padding:8px;border-bottom:1px solid #eee">${itemCount} item(s)</td></tr>
            <tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>Total</strong></td><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;color:#b45309">₹${total}</td></tr>
          </table>
          <p style="margin-top:24px">We'll send you another email when your order ships.</p>
          <p style="color:#9ca3af;font-size:12px;margin-top:32px">© ${new Date().getFullYear()} Navagunjara. All rights reserved.</p>
        </div>
      `,
    });
    log.info({ to, orderId }, "Order confirmation email sent");
  } catch (err) {
    log.error({ err, to, orderId }, "Failed to send order confirmation email");
  }
}

/**
 * Send a shipping notification email.
 *
 * @param to      - Customer email address.
 * @param orderId - Order ID.
 */
export async function sendShippingNotification(
  to: string,
  orderId: string
): Promise<void> {
  try {
    await resend.emails.send({
      from: `Navagunjara <${FROM}>`,
      to,
      subject: `Order Shipped — #${orderId}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <h1 style="color:#b45309">🦚 Navagunjara</h1>
          <h2>Your Order Has Shipped! 🚚</h2>
          <p>Great news! Your order <strong>#${orderId}</strong> has been shipped and is on its way to you.</p>
          <p>You can track your order status in your <a href="${process.env.NEXT_PUBLIC_APP_URL}/account" style="color:#b45309">account</a>.</p>
          <p style="color:#9ca3af;font-size:12px;margin-top:32px">© ${new Date().getFullYear()} Navagunjara. All rights reserved.</p>
        </div>
      `,
    });
    log.info({ to, orderId }, "Shipping notification email sent");
  } catch (err) {
    log.error({ err, to, orderId }, "Failed to send shipping notification email");
  }
}

/**
 * Send an order delivered email.
 *
 * @param to      - Customer email address.
 * @param orderId - Order ID.
 */
export async function sendDeliveryConfirmation(
  to: string,
  orderId: string
): Promise<void> {
  try {
    await resend.emails.send({
      from: `Navagunjara <${FROM}>`,
      to,
      subject: `Order Delivered — #${orderId}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <h1 style="color:#b45309">🦚 Navagunjara</h1>
          <h2>Order Delivered! 🎉</h2>
          <p>Your order <strong>#${orderId}</strong> has been delivered successfully.</p>
          <p>We hope you love your purchase! Please take a moment to <a href="${process.env.NEXT_PUBLIC_APP_URL}/account" style="color:#b45309">leave a review</a>.</p>
          <p style="color:#9ca3af;font-size:12px;margin-top:32px">© ${new Date().getFullYear()} Navagunjara. All rights reserved.</p>
        </div>
      `,
    });
    log.info({ to, orderId }, "Delivery confirmation email sent");
  } catch (err) {
    log.error({ err, to, orderId }, "Failed to send delivery confirmation email");
  }
}
