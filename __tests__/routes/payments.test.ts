/** @jest-environment node */
/**
 * Tests for payment routes (initiate, confirm, fail, by-order, webhook).
 *
 * @author Anurag Muthyam
 * @organization indosyn
 */

jest.mock("@/lib/api-auth", () => ({ getApiSession: jest.fn() }));
jest.mock("@/services/payment.service", () => ({
  paymentService: {
    createOrder: jest.fn(),
    verify: jest.fn(),
    markFailed: jest.fn(),
    findByOrderId: jest.fn(),
  },
}));
jest.mock("@/lib/logger", () => ({
  createLogger: () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() }),
}));
jest.mock("@/lib/rate-limit", () => ({
  enforceRateLimit: jest.fn(() => null),
  rateLimit: jest.fn(() => ({ allowed: true, resetMs: 0 })),
}));
jest.mock("@/lib/idempotency", () => ({
  checkIdempotency: jest.fn(async () => null),
  rememberIdempotency: jest.fn(async () => undefined),
}));
jest.mock("@/lib/email", () => ({
  sendOrderConfirmation: jest.fn(),
}));
jest.mock("@/lib/razorpay", () => ({
  verifyWebhookSignature: jest.fn(),
}));
jest.mock("@/lib/db", () => ({
  db: {
    order: { findUnique: jest.fn(), update: jest.fn() },
    payment: { updateMany: jest.fn(), findFirst: jest.fn() },
  },
}));

import { POST as initiate } from "@/app/api/v1/payments/route";
import { POST as confirm } from "@/app/api/v1/payments/[id]/confirm/route";
import { POST as fail } from "@/app/api/v1/payments/[id]/fail/route";
import { GET as byOrder } from "@/app/api/v1/payments/order/[orderId]/route";
import { POST as webhook } from "@/app/api/v1/payments/webhook/route";
import { getApiSession } from "@/lib/api-auth";
import { paymentService } from "@/services/payment.service";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { db } from "@/lib/db";
import { makeRequest, paramsFor } from "../helpers/route";

const getSession = getApiSession as jest.Mock;
const user = { user: { id: "2", email: "c@x.com", role: "USER" } };

describe("POST /api/v1/payments (initiate)", () => {
  beforeEach(() => jest.clearAllMocks());

  it("401", async () => {
    getSession.mockResolvedValueOnce(null);
    const res = await initiate(makeRequest("/api/v1/payments", { method: "POST", body: { orderId: 1, method: "UPI" } }));
    expect(res.status).toBe(401);
  });

  it("400 invalid", async () => {
    getSession.mockResolvedValueOnce(user);
    const res = await initiate(makeRequest("/api/v1/payments", { method: "POST", body: { method: "FAKE" } }));
    expect(res.status).toBe(400);
  });

  it("200 success", async () => {
    getSession.mockResolvedValueOnce(user);
    (paymentService.createOrder as jest.Mock).mockResolvedValueOnce({ id: "p1" });
    const res = await initiate(makeRequest("/api/v1/payments", { method: "POST", body: { orderId: 1, method: "UPI" } }));
    expect(res.status).toBe(200);
  });

  it("404 ORDER_NOT_FOUND", async () => {
    getSession.mockResolvedValueOnce(user);
    (paymentService.createOrder as jest.Mock).mockRejectedValueOnce(new Error("ORDER_NOT_FOUND"));
    const res = await initiate(makeRequest("/api/v1/payments", { method: "POST", body: { orderId: 1, method: "UPI" } }));
    expect(res.status).toBe(404);
  });

  it("400 ORDER_NOT_PENDING", async () => {
    getSession.mockResolvedValueOnce(user);
    (paymentService.createOrder as jest.Mock).mockRejectedValueOnce(new Error("ORDER_NOT_PENDING"));
    const res = await initiate(makeRequest("/api/v1/payments", { method: "POST", body: { orderId: 1, method: "UPI" } }));
    expect(res.status).toBe(400);
  });

  it("500 generic", async () => {
    getSession.mockResolvedValueOnce(user);
    (paymentService.createOrder as jest.Mock).mockRejectedValueOnce(new Error("boom"));
    const res = await initiate(makeRequest("/api/v1/payments", { method: "POST", body: { orderId: 1, method: "UPI" } }));
    expect(res.status).toBe(500);
  });
});

describe("POST /api/v1/payments/[id]/confirm", () => {
  beforeEach(() => jest.clearAllMocks());

  const body = {
    razorpay_order_id: "ord_x",
    razorpay_payment_id: "pay_x",
    razorpay_signature: "sig_x",
    orderId: 1,
  };

  it("401", async () => {
    getSession.mockResolvedValueOnce(null);
    const res = await confirm(makeRequest("/api/v1/payments/1/confirm", { method: "POST", body }));
    expect(res.status).toBe(401);
  });

  it("400 invalid", async () => {
    getSession.mockResolvedValueOnce(user);
    const res = await confirm(makeRequest("/api/v1/payments/1/confirm", { method: "POST", body: {} }));
    expect(res.status).toBe(400);
  });

  it("200 success", async () => {
    getSession.mockResolvedValueOnce(user);
    (paymentService.verify as jest.Mock).mockResolvedValueOnce({ id: "p" });
    (db.order.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 1n,
      totalAmount: { toString: () => "100" },
      customer: { email: "c@x.com" },
      items: [{}],
    });
    const res = await confirm(makeRequest("/api/v1/payments/1/confirm", { method: "POST", body }));
    expect(res.status).toBe(200);
  });

  it("400 INVALID_SIGNATURE", async () => {
    getSession.mockResolvedValueOnce(user);
    (paymentService.verify as jest.Mock).mockRejectedValueOnce(new Error("INVALID_SIGNATURE"));
    const res = await confirm(makeRequest("/api/v1/payments/1/confirm", { method: "POST", body }));
    expect(res.status).toBe(400);
  });

  it("404 PAYMENT_NOT_FOUND", async () => {
    getSession.mockResolvedValueOnce(user);
    (paymentService.verify as jest.Mock).mockRejectedValueOnce(new Error("PAYMENT_NOT_FOUND"));
    const res = await confirm(makeRequest("/api/v1/payments/1/confirm", { method: "POST", body }));
    expect(res.status).toBe(404);
  });

  it("500 generic", async () => {
    getSession.mockResolvedValueOnce(user);
    (paymentService.verify as jest.Mock).mockRejectedValueOnce(new Error("boom"));
    const res = await confirm(makeRequest("/api/v1/payments/1/confirm", { method: "POST", body }));
    expect(res.status).toBe(500);
  });
});

describe("POST /api/v1/payments/[id]/fail", () => {
  beforeEach(() => jest.clearAllMocks());

  it("401", async () => {
    getSession.mockResolvedValueOnce(null);
    const res = await fail(
      makeRequest("/api/v1/payments/1/fail", { method: "POST", body: { reason: "x" } }),
      paramsFor({ id: "1" })
    );
    expect(res.status).toBe(401);
  });

  it("200", async () => {
    getSession.mockResolvedValueOnce(user);
    (paymentService.markFailed as jest.Mock).mockResolvedValueOnce({ id: "p" });
    const res = await fail(
      makeRequest("/api/v1/payments/1/fail", { method: "POST", body: { reason: "x" } }),
      paramsFor({ id: "1" })
    );
    expect(res.status).toBe(200);
  });

  it("200 with default reason when missing", async () => {
    getSession.mockResolvedValueOnce(user);
    (paymentService.markFailed as jest.Mock).mockResolvedValueOnce({ id: "p" });
    const res = await fail(
      makeRequest("/api/v1/payments/1/fail", { method: "POST", body: {} }),
      paramsFor({ id: "1" })
    );
    expect(res.status).toBe(200);
    expect(paymentService.markFailed).toHaveBeenCalledWith("1", "Payment failed");
  });

  it("404 PAYMENT_NOT_FOUND", async () => {
    getSession.mockResolvedValueOnce(user);
    (paymentService.markFailed as jest.Mock).mockRejectedValueOnce(new Error("PAYMENT_NOT_FOUND"));
    const res = await fail(
      makeRequest("/api/v1/payments/1/fail", { method: "POST", body: { reason: "x" } }),
      paramsFor({ id: "1" })
    );
    expect(res.status).toBe(404);
  });

  it("500 generic", async () => {
    getSession.mockResolvedValueOnce(user);
    (paymentService.markFailed as jest.Mock).mockRejectedValueOnce(new Error("boom"));
    const res = await fail(
      makeRequest("/api/v1/payments/1/fail", { method: "POST", body: { reason: "x" } }),
      paramsFor({ id: "1" })
    );
    expect(res.status).toBe(500);
  });
});

describe("GET /api/v1/payments/order/[orderId]", () => {
  beforeEach(() => jest.clearAllMocks());

  it("401", async () => {
    getSession.mockResolvedValueOnce(null);
    const res = await byOrder(makeRequest("/api/v1/payments/order/1"), paramsFor({ orderId: "1" }));
    expect(res.status).toBe(401);
  });

  it("200", async () => {
    getSession.mockResolvedValueOnce(user);
    (paymentService.findByOrderId as jest.Mock).mockResolvedValueOnce([]);
    const res = await byOrder(makeRequest("/api/v1/payments/order/1"), paramsFor({ orderId: "1" }));
    expect(res.status).toBe(200);
  });

  it("500 generic", async () => {
    getSession.mockResolvedValueOnce(user);
    (paymentService.findByOrderId as jest.Mock).mockRejectedValueOnce(new Error("boom"));
    const res = await byOrder(makeRequest("/api/v1/payments/order/1"), paramsFor({ orderId: "1" }));
    expect(res.status).toBe(500);
  });
});

describe("POST /api/v1/payments/webhook", () => {
  beforeEach(() => jest.clearAllMocks());

  it("401 invalid signature", async () => {
    (verifyWebhookSignature as jest.Mock).mockReturnValueOnce(false);
    const res = await webhook(
      makeRequest("/api/v1/payments/webhook", {
        method: "POST",
        body: { event: "payment.captured" },
        headers: { "x-razorpay-signature": "bad" },
      })
    );
    expect(res.status).toBe(401);
  });

  it("200 on malformed JSON (ignored)", async () => {
    (verifyWebhookSignature as jest.Mock).mockReturnValueOnce(true);
    const res = await webhook(
      makeRequest("/api/v1/payments/webhook", {
        method: "POST",
        body: "not-json",
        headers: { "x-razorpay-signature": "ok" },
      })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ignored).toBe("malformed");
  });

  it("200 event without payment entity", async () => {
    (verifyWebhookSignature as jest.Mock).mockReturnValueOnce(true);
    const res = await webhook(
      makeRequest("/api/v1/payments/webhook", {
        method: "POST",
        body: { event: "order.paid", payload: {} },
        headers: { "x-razorpay-signature": "ok" },
      })
    );
    expect(res.status).toBe(200);
  });

  it("200 payment.captured updates payment + order", async () => {
    (verifyWebhookSignature as jest.Mock).mockReturnValueOnce(true);
    (db.payment.updateMany as jest.Mock).mockResolvedValueOnce({ count: 1 });
    (db.payment.findFirst as jest.Mock).mockResolvedValueOnce({ orderId: 5n });
    (db.order.update as jest.Mock).mockResolvedValueOnce({});
    const res = await webhook(
      makeRequest("/api/v1/payments/webhook", {
        method: "POST",
        body: {
          event: "payment.captured",
          payload: { payment: { entity: { id: "pay_x", order_id: "ord_x", status: "captured" } } },
        },
        headers: { "x-razorpay-signature": "ok" },
      })
    );
    expect(res.status).toBe(200);
    expect(db.order.update).toHaveBeenCalled();
  });

  it("200 payment.captured for unknown razorpay order (no payment row)", async () => {
    (verifyWebhookSignature as jest.Mock).mockReturnValueOnce(true);
    (db.payment.updateMany as jest.Mock).mockResolvedValueOnce({ count: 0 });
    const res = await webhook(
      makeRequest("/api/v1/payments/webhook", {
        method: "POST",
        body: {
          event: "payment.captured",
          payload: { payment: { entity: { id: "pay_x", order_id: "ord_x", status: "captured" } } },
        },
        headers: { "x-razorpay-signature": "ok" },
      })
    );
    expect(res.status).toBe(200);
    expect(db.order.update).not.toHaveBeenCalled();
  });

  it("200 payment.failed updates payment", async () => {
    (verifyWebhookSignature as jest.Mock).mockReturnValueOnce(true);
    (db.payment.updateMany as jest.Mock).mockResolvedValueOnce({ count: 1 });
    const res = await webhook(
      makeRequest("/api/v1/payments/webhook", {
        method: "POST",
        body: {
          event: "payment.failed",
          payload: {
            payment: {
              entity: {
                id: "pay_x",
                order_id: "ord_x",
                status: "failed",
                error_code: "GATEWAY",
                error_description: "card declined",
              },
            },
          },
        },
        headers: { "x-razorpay-signature": "ok" },
      })
    );
    expect(res.status).toBe(200);
  });

  it("200 unhandled event type", async () => {
    (verifyWebhookSignature as jest.Mock).mockReturnValueOnce(true);
    const res = await webhook(
      makeRequest("/api/v1/payments/webhook", {
        method: "POST",
        body: {
          event: "subscription.charged",
          payload: { payment: { entity: { id: "x", order_id: "x", status: "ok" } } },
        },
        headers: { "x-razorpay-signature": "ok" },
      })
    );
    expect(res.status).toBe(200);
  });

  it("500 when db handler throws", async () => {
    (verifyWebhookSignature as jest.Mock).mockReturnValueOnce(true);
    (db.payment.updateMany as jest.Mock).mockRejectedValueOnce(new Error("db"));
    const res = await webhook(
      makeRequest("/api/v1/payments/webhook", {
        method: "POST",
        body: {
          event: "payment.captured",
          payload: { payment: { entity: { id: "x", order_id: "x", status: "captured" } } },
        },
        headers: { "x-razorpay-signature": "ok" },
      })
    );
    expect(res.status).toBe(500);
  });
});
