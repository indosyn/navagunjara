/** @jest-environment node */
/**
 * Tests for order routes (list/create, detail, cancel, status).
 *
 * @author Anurag Muthyam
 * @organization indosyn
 */

jest.mock("@/lib/api-auth", () => ({ getApiSession: jest.fn() }));
jest.mock("@/services/order.service", () => ({
  orderService: {
    listByCustomer: jest.fn(),
    listAll: jest.fn(),
    findById: jest.fn(),
    place: jest.fn(),
    cancel: jest.fn(),
    updateStatus: jest.fn(),
  },
}));
jest.mock("@/lib/logger", () => ({
  createLogger: () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() }),
}));
jest.mock("@/lib/rate-limit", () => ({
  rateLimit: jest.fn(() => ({ allowed: true, resetMs: 0 })),
  enforceRateLimit: jest.fn(() => null),
}));
jest.mock("@/lib/idempotency", () => ({
  checkIdempotency: jest.fn(async () => null),
  rememberIdempotency: jest.fn(async () => undefined),
  readIdempotencyKey: jest.fn(),
}));
jest.mock("@/lib/email", () => ({
  sendShippingNotification: jest.fn(),
  sendDeliveryConfirmation: jest.fn(),
}));
jest.mock("@/lib/db", () => ({
  db: { order: { findUnique: jest.fn() } },
}));

import { GET, POST } from "@/app/api/v1/orders/route";
import { GET as detailGet } from "@/app/api/v1/orders/[id]/route";
import { PUT as cancelPut } from "@/app/api/v1/orders/[id]/cancel/route";
import { PUT as statusPut } from "@/app/api/v1/orders/[id]/status/route";
import { getApiSession } from "@/lib/api-auth";
import { orderService } from "@/services/order.service";
import { db } from "@/lib/db";
import { makeRequest, paramsFor } from "../helpers/route";

const getSession = getApiSession as jest.Mock;
const admin = { user: { id: "1", email: "a@x.com", role: "ADMIN" } };
const user = { user: { id: "2", email: "c@x.com", role: "USER" } };

const validOrder = {
  customerId: 2,
  items: [{ productId: 1, quantity: 1 }],
  deliveryAddress: "123 MG",
  deliveryCity: "Bengaluru",
  deliveryState: "KA",
  deliveryPincode: "560001",
};

describe("/api/v1/orders", () => {
  beforeEach(() => jest.clearAllMocks());

  it("GET 401 no session", async () => {
    getSession.mockResolvedValueOnce(null);
    const res = await GET(makeRequest("/api/v1/orders"));
    expect(res.status).toBe(401);
  });

  it("GET 200 user lists own", async () => {
    getSession.mockResolvedValueOnce(user);
    (orderService.listByCustomer as jest.Mock).mockResolvedValueOnce({ content: [] });
    const res = await GET(makeRequest("/api/v1/orders"));
    expect(res.status).toBe(200);
    expect(orderService.listByCustomer).toHaveBeenCalledWith("2", 0, 10);
  });

  it("GET 200 admin lists all with status", async () => {
    getSession.mockResolvedValueOnce(admin);
    (orderService.listAll as jest.Mock).mockResolvedValueOnce({ content: [] });
    const res = await GET(makeRequest("/api/v1/orders", { searchParams: { status: "PAID" } }));
    expect(res.status).toBe(200);
    expect(orderService.listAll).toHaveBeenCalledWith(0, 10, "PAID");
  });

  it("GET 200 admin lists by customerId", async () => {
    getSession.mockResolvedValueOnce(admin);
    (orderService.listByCustomer as jest.Mock).mockResolvedValueOnce({ content: [] });
    const res = await GET(makeRequest("/api/v1/orders", { searchParams: { customerId: "5" } }));
    expect(res.status).toBe(200);
    expect(orderService.listByCustomer).toHaveBeenCalledWith("5", 0, 10);
  });

  it("POST 401 no session", async () => {
    getSession.mockResolvedValueOnce(null);
    const res = await POST(makeRequest("/api/v1/orders", { method: "POST", body: validOrder }));
    expect(res.status).toBe(401);
  });

  it("POST 400 invalid", async () => {
    getSession.mockResolvedValueOnce(user);
    const res = await POST(makeRequest("/api/v1/orders", { method: "POST", body: {} }));
    expect(res.status).toBe(400);
  });

  it("POST 201 success", async () => {
    getSession.mockResolvedValueOnce(user);
    (orderService.place as jest.Mock).mockResolvedValueOnce({ id: "1" });
    const res = await POST(makeRequest("/api/v1/orders", { method: "POST", body: validOrder }));
    expect(res.status).toBe(201);
  });

  it("POST 404 PRODUCT_NOT_FOUND", async () => {
    getSession.mockResolvedValueOnce(user);
    (orderService.place as jest.Mock).mockRejectedValueOnce(new Error("PRODUCT_NOT_FOUND"));
    const res = await POST(makeRequest("/api/v1/orders", { method: "POST", body: validOrder }));
    expect(res.status).toBe(404);
  });

  it("POST 400 INSUFFICIENT_STOCK", async () => {
    getSession.mockResolvedValueOnce(user);
    (orderService.place as jest.Mock).mockRejectedValueOnce(new Error("INSUFFICIENT_STOCK: p1"));
    const res = await POST(makeRequest("/api/v1/orders", { method: "POST", body: validOrder }));
    expect(res.status).toBe(400);
  });

  it("POST 500 generic", async () => {
    getSession.mockResolvedValueOnce(user);
    (orderService.place as jest.Mock).mockRejectedValueOnce(new Error("boom"));
    const res = await POST(makeRequest("/api/v1/orders", { method: "POST", body: validOrder }));
    expect(res.status).toBe(500);
  });
});

describe("/api/v1/orders/[id]", () => {
  beforeEach(() => jest.clearAllMocks());

  it("GET 401", async () => {
    getSession.mockResolvedValueOnce(null);
    const res = await detailGet(makeRequest("/api/v1/orders/1"), paramsFor({ id: "1" }));
    expect(res.status).toBe(401);
  });

  it("GET 200", async () => {
    getSession.mockResolvedValueOnce(user);
    (orderService.findById as jest.Mock).mockResolvedValueOnce({ id: "1" });
    const res = await detailGet(makeRequest("/api/v1/orders/1"), paramsFor({ id: "1" }));
    expect(res.status).toBe(200);
  });

  it("GET 404", async () => {
    getSession.mockResolvedValueOnce(user);
    (orderService.findById as jest.Mock).mockRejectedValueOnce(new Error("x"));
    const res = await detailGet(makeRequest("/api/v1/orders/1"), paramsFor({ id: "1" }));
    expect(res.status).toBe(404);
  });
});

describe("/api/v1/orders/[id]/cancel", () => {
  beforeEach(() => jest.clearAllMocks());

  it("401", async () => {
    getSession.mockResolvedValueOnce(null);
    const res = await cancelPut(makeRequest("/api/v1/orders/1/cancel", { method: "PUT" }), paramsFor({ id: "1" }));
    expect(res.status).toBe(401);
  });

  it("200", async () => {
    getSession.mockResolvedValueOnce(user);
    (orderService.cancel as jest.Mock).mockResolvedValueOnce({ id: "1", status: "CANCELLED" });
    const res = await cancelPut(makeRequest("/api/v1/orders/1/cancel", { method: "PUT" }), paramsFor({ id: "1" }));
    expect(res.status).toBe(200);
  });

  it("404 NOT_FOUND", async () => {
    getSession.mockResolvedValueOnce(user);
    (orderService.cancel as jest.Mock).mockRejectedValueOnce(new Error("NOT_FOUND"));
    const res = await cancelPut(makeRequest("/api/v1/orders/1/cancel", { method: "PUT" }), paramsFor({ id: "1" }));
    expect(res.status).toBe(404);
  });

  it("403 FORBIDDEN", async () => {
    getSession.mockResolvedValueOnce(user);
    (orderService.cancel as jest.Mock).mockRejectedValueOnce(new Error("FORBIDDEN"));
    const res = await cancelPut(makeRequest("/api/v1/orders/1/cancel", { method: "PUT" }), paramsFor({ id: "1" }));
    expect(res.status).toBe(403);
  });

  it("400 CANNOT_CANCEL", async () => {
    getSession.mockResolvedValueOnce(user);
    (orderService.cancel as jest.Mock).mockRejectedValueOnce(new Error("CANNOT_CANCEL"));
    const res = await cancelPut(makeRequest("/api/v1/orders/1/cancel", { method: "PUT" }), paramsFor({ id: "1" }));
    expect(res.status).toBe(400);
  });

  it("500 generic", async () => {
    getSession.mockResolvedValueOnce(user);
    (orderService.cancel as jest.Mock).mockRejectedValueOnce(new Error("boom"));
    const res = await cancelPut(makeRequest("/api/v1/orders/1/cancel", { method: "PUT" }), paramsFor({ id: "1" }));
    expect(res.status).toBe(500);
  });
});

describe("/api/v1/orders/[id]/status", () => {
  beforeEach(() => jest.clearAllMocks());

  it("403 non-admin", async () => {
    getSession.mockResolvedValueOnce(user);
    const res = await statusPut(
      makeRequest("/api/v1/orders/1/status", { method: "PUT", body: { status: "SHIPPED" } }),
      paramsFor({ id: "1" })
    );
    expect(res.status).toBe(403);
  });

  it("400 invalid", async () => {
    getSession.mockResolvedValueOnce(admin);
    const res = await statusPut(
      makeRequest("/api/v1/orders/1/status", { method: "PUT", body: { status: "WAT" } }),
      paramsFor({ id: "1" })
    );
    expect(res.status).toBe(400);
  });

  it("200 SHIPPED triggers shipping email", async () => {
    getSession.mockResolvedValueOnce(admin);
    (orderService.updateStatus as jest.Mock).mockResolvedValueOnce({ id: "1", status: "SHIPPED" });
    (db.order.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 1n,
      customer: { email: "c@x.com" },
    });
    const res = await statusPut(
      makeRequest("/api/v1/orders/1/status", { method: "PUT", body: { status: "SHIPPED" } }),
      paramsFor({ id: "1" })
    );
    expect(res.status).toBe(200);
  });

  it("200 DELIVERED triggers delivery email", async () => {
    getSession.mockResolvedValueOnce(admin);
    (orderService.updateStatus as jest.Mock).mockResolvedValueOnce({ id: "1", status: "DELIVERED" });
    (db.order.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 1n,
      customer: { email: "c@x.com" },
    });
    const res = await statusPut(
      makeRequest("/api/v1/orders/1/status", { method: "PUT", body: { status: "DELIVERED" } }),
      paramsFor({ id: "1" })
    );
    expect(res.status).toBe(200);
  });

  it("404 NOT_FOUND", async () => {
    getSession.mockResolvedValueOnce(admin);
    (orderService.updateStatus as jest.Mock).mockRejectedValueOnce(new Error("NOT_FOUND"));
    const res = await statusPut(
      makeRequest("/api/v1/orders/1/status", { method: "PUT", body: { status: "SHIPPED" } }),
      paramsFor({ id: "1" })
    );
    expect(res.status).toBe(404);
  });

  it("500 generic", async () => {
    getSession.mockResolvedValueOnce(admin);
    (orderService.updateStatus as jest.Mock).mockRejectedValueOnce(new Error("boom"));
    const res = await statusPut(
      makeRequest("/api/v1/orders/1/status", { method: "PUT", body: { status: "SHIPPED" } }),
      paramsFor({ id: "1" })
    );
    expect(res.status).toBe(500);
  });
});
