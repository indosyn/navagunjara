/**
 * Tests for razorpay signature helpers.
 *
 * @module __tests__/lib/razorpay.test
 * @author Anurag Muthyam
 * @organization indosyn
 */

import crypto from "crypto";

// Set secret before importing module
process.env.RAZORPAY_KEY_SECRET = "test_secret";
process.env.RAZORPAY_KEY_ID = "test_id";
process.env.RAZORPAY_WEBHOOK_SECRET = "webhook_secret";

// razorpay module instantiates the SDK on import; mock it
jest.mock("razorpay", () => jest.fn().mockImplementation(() => ({ orders: { create: jest.fn() } })));

import { verifySignature, verifyWebhookSignature } from "@/lib/razorpay";

function sign(secret: string, body: string): string {
  return crypto.createHmac("sha256", secret).update(body).digest("hex");
}

describe("verifySignature", () => {
  it("returns true for valid signature", () => {
    const sig = sign("test_secret", "order1|pay1");
    expect(verifySignature("order1", "pay1", sig)).toBe(true);
  });

  it("returns false for wrong signature", () => {
    expect(verifySignature("order1", "pay1", "deadbeef".repeat(8))).toBe(false);
  });

  it("returns false for short signature (no crash)", () => {
    expect(verifySignature("order1", "pay1", "short")).toBe(false);
  });

  it("returns false for empty/null signature", () => {
    expect(verifySignature("order1", "pay1", "")).toBe(false);
    expect(verifySignature("order1", "pay1", null as unknown as string)).toBe(false);
  });
});

describe("verifyWebhookSignature", () => {
  it("returns true for valid signature", () => {
    const sig = sign("webhook_secret", '{"event":"payment"}');
    expect(verifyWebhookSignature('{"event":"payment"}', sig)).toBe(true);
  });

  it("returns false when signature header missing", () => {
    expect(verifyWebhookSignature('{}', null)).toBe(false);
    expect(verifyWebhookSignature('{}', undefined)).toBe(false);
  });

  it("returns false when signature length mismatch", () => {
    expect(verifyWebhookSignature('{}', "short")).toBe(false);
  });
});
