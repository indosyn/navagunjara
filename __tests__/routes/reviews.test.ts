/** @jest-environment node */
/**
 * Tests for review routes.
 *
 * @author Anurag Muthyam
 * @organization indosyn
 */

jest.mock("@/lib/api-auth", () => ({ getApiSession: jest.fn() }));
jest.mock("@/services/review.service", () => ({
  reviewService: {
    listByProduct: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  },
}));
jest.mock("@/lib/logger", () => ({
  createLogger: () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() }),
}));
jest.mock("@/lib/rate-limit", () => ({
  enforceRateLimit: jest.fn(() => null),
  rateLimit: jest.fn(() => ({ allowed: true, resetMs: 0 })),
}));

import { GET, POST } from "@/app/api/v1/reviews/route";
import { PUT, DELETE } from "@/app/api/v1/reviews/[id]/route";
import { getApiSession } from "@/lib/api-auth";
import { reviewService } from "@/services/review.service";
import { makeRequest, paramsFor } from "../helpers/route";

const getSession = getApiSession as jest.Mock;
const admin = { user: { id: "1", email: "a@x.com", role: "ADMIN" } };
const user = { user: { id: "2", email: "c@x.com", role: "USER" } };

describe("GET /api/v1/reviews", () => {
  beforeEach(() => jest.clearAllMocks());

  it("400 missing productId", async () => {
    const res = await GET(makeRequest("/api/v1/reviews"));
    expect(res.status).toBe(400);
  });

  it("200 with productId", async () => {
    (reviewService.listByProduct as jest.Mock).mockResolvedValueOnce({ content: [] });
    const res = await GET(makeRequest("/api/v1/reviews", { searchParams: { productId: "1" } }));
    expect(res.status).toBe(200);
  });

  it("500 on service error", async () => {
    (reviewService.listByProduct as jest.Mock).mockRejectedValueOnce(new Error("boom"));
    const res = await GET(makeRequest("/api/v1/reviews", { searchParams: { productId: "1" } }));
    expect(res.status).toBe(500);
  });
});

describe("POST /api/v1/reviews", () => {
  beforeEach(() => jest.clearAllMocks());

  const body = { productId: 1, rating: 5, comment: "Great" };

  it("401 no session", async () => {
    getSession.mockResolvedValueOnce(null);
    const res = await POST(makeRequest("/api/v1/reviews", { method: "POST", body }));
    expect(res.status).toBe(401);
  });

  it("401 admin (USER only)", async () => {
    getSession.mockResolvedValueOnce(admin);
    const res = await POST(makeRequest("/api/v1/reviews", { method: "POST", body }));
    expect(res.status).toBe(401);
  });

  it("400 invalid", async () => {
    getSession.mockResolvedValueOnce(user);
    const res = await POST(makeRequest("/api/v1/reviews", { method: "POST", body: { productId: 1 } }));
    expect(res.status).toBe(400);
  });

  it("201 success", async () => {
    getSession.mockResolvedValueOnce(user);
    (reviewService.create as jest.Mock).mockResolvedValueOnce({ id: "r1" });
    const res = await POST(makeRequest("/api/v1/reviews", { method: "POST", body }));
    expect(res.status).toBe(201);
  });

  it("409 ALREADY_REVIEWED", async () => {
    getSession.mockResolvedValueOnce(user);
    (reviewService.create as jest.Mock).mockRejectedValueOnce(new Error("ALREADY_REVIEWED"));
    const res = await POST(makeRequest("/api/v1/reviews", { method: "POST", body }));
    expect(res.status).toBe(409);
  });

  it("500 generic", async () => {
    getSession.mockResolvedValueOnce(user);
    (reviewService.create as jest.Mock).mockRejectedValueOnce(new Error("boom"));
    const res = await POST(makeRequest("/api/v1/reviews", { method: "POST", body }));
    expect(res.status).toBe(500);
  });
});

describe("PUT /api/v1/reviews/[id]", () => {
  beforeEach(() => jest.clearAllMocks());

  const body = { rating: 4 };

  it("401", async () => {
    getSession.mockResolvedValueOnce(null);
    const res = await PUT(
      makeRequest("/api/v1/reviews/1", { method: "PUT", body }),
      paramsFor({ id: "1" })
    );
    expect(res.status).toBe(401);
  });

  it("400 invalid", async () => {
    getSession.mockResolvedValueOnce(user);
    const res = await PUT(
      makeRequest("/api/v1/reviews/1", { method: "PUT", body: { rating: 99 } }),
      paramsFor({ id: "1" })
    );
    expect(res.status).toBe(400);
  });

  it("200 success", async () => {
    getSession.mockResolvedValueOnce(user);
    (reviewService.update as jest.Mock).mockResolvedValueOnce({ id: "r" });
    const res = await PUT(
      makeRequest("/api/v1/reviews/1", { method: "PUT", body }),
      paramsFor({ id: "1" })
    );
    expect(res.status).toBe(200);
  });

  it("404 NOT_FOUND", async () => {
    getSession.mockResolvedValueOnce(user);
    (reviewService.update as jest.Mock).mockRejectedValueOnce(new Error("NOT_FOUND"));
    const res = await PUT(
      makeRequest("/api/v1/reviews/1", { method: "PUT", body }),
      paramsFor({ id: "1" })
    );
    expect(res.status).toBe(404);
  });

  it("403 FORBIDDEN", async () => {
    getSession.mockResolvedValueOnce(user);
    (reviewService.update as jest.Mock).mockRejectedValueOnce(new Error("FORBIDDEN"));
    const res = await PUT(
      makeRequest("/api/v1/reviews/1", { method: "PUT", body }),
      paramsFor({ id: "1" })
    );
    expect(res.status).toBe(403);
  });

  it("500 generic", async () => {
    getSession.mockResolvedValueOnce(user);
    (reviewService.update as jest.Mock).mockRejectedValueOnce(new Error("boom"));
    const res = await PUT(
      makeRequest("/api/v1/reviews/1", { method: "PUT", body }),
      paramsFor({ id: "1" })
    );
    expect(res.status).toBe(500);
  });
});

describe("DELETE /api/v1/reviews/[id]", () => {
  beforeEach(() => jest.clearAllMocks());

  it("401", async () => {
    getSession.mockResolvedValueOnce(null);
    const res = await DELETE(
      makeRequest("/api/v1/reviews/1", { method: "DELETE" }),
      paramsFor({ id: "1" })
    );
    expect(res.status).toBe(401);
  });

  it("200 user removes own", async () => {
    getSession.mockResolvedValueOnce(user);
    (reviewService.remove as jest.Mock).mockResolvedValueOnce(undefined);
    const res = await DELETE(
      makeRequest("/api/v1/reviews/1", { method: "DELETE" }),
      paramsFor({ id: "1" })
    );
    expect(res.status).toBe(200);
    expect(reviewService.remove).toHaveBeenCalledWith("1", "2", false);
  });

  it("200 admin removes any", async () => {
    getSession.mockResolvedValueOnce(admin);
    (reviewService.remove as jest.Mock).mockResolvedValueOnce(undefined);
    const res = await DELETE(
      makeRequest("/api/v1/reviews/1", { method: "DELETE" }),
      paramsFor({ id: "1" })
    );
    expect(res.status).toBe(200);
    expect(reviewService.remove).toHaveBeenCalledWith("1", null, true);
  });

  it("404 NOT_FOUND", async () => {
    getSession.mockResolvedValueOnce(user);
    (reviewService.remove as jest.Mock).mockRejectedValueOnce(new Error("NOT_FOUND"));
    const res = await DELETE(
      makeRequest("/api/v1/reviews/1", { method: "DELETE" }),
      paramsFor({ id: "1" })
    );
    expect(res.status).toBe(404);
  });

  it("403 FORBIDDEN", async () => {
    getSession.mockResolvedValueOnce(user);
    (reviewService.remove as jest.Mock).mockRejectedValueOnce(new Error("FORBIDDEN"));
    const res = await DELETE(
      makeRequest("/api/v1/reviews/1", { method: "DELETE" }),
      paramsFor({ id: "1" })
    );
    expect(res.status).toBe(403);
  });

  it("500 generic", async () => {
    getSession.mockResolvedValueOnce(user);
    (reviewService.remove as jest.Mock).mockRejectedValueOnce(new Error("boom"));
    const res = await DELETE(
      makeRequest("/api/v1/reviews/1", { method: "DELETE" }),
      paramsFor({ id: "1" })
    );
    expect(res.status).toBe(500);
  });
});
