/** @jest-environment node */
/**
 * Tests for wishlist routes.
 *
 * @author Anurag Muthyam
 * @organization indosyn
 */

jest.mock("@/lib/api-auth", () => ({ getApiSession: jest.fn() }));
jest.mock("@/services/wishlist.service", () => ({
  wishlistService: {
    list: jest.fn(),
    add: jest.fn(),
    remove: jest.fn(),
  },
}));
jest.mock("@/lib/logger", () => ({
  createLogger: () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() }),
}));

import { GET, POST } from "@/app/api/v1/wishlist/route";
import { DELETE } from "@/app/api/v1/wishlist/[productId]/route";
import { getApiSession } from "@/lib/api-auth";
import { wishlistService } from "@/services/wishlist.service";
import { makeRequest, paramsFor } from "../helpers/route";

const getSession = getApiSession as jest.Mock;
const user = { user: { id: "2", email: "c@x.com", role: "USER" } };

describe("/api/v1/wishlist", () => {
  beforeEach(() => jest.clearAllMocks());

  it("GET 401", async () => {
    getSession.mockResolvedValueOnce(null);
    const res = await GET(makeRequest("/api/v1/wishlist"));
    expect(res.status).toBe(401);
  });

  it("GET 200", async () => {
    getSession.mockResolvedValueOnce(user);
    (wishlistService.list as jest.Mock).mockResolvedValueOnce([]);
    const res = await GET(makeRequest("/api/v1/wishlist"));
    expect(res.status).toBe(200);
  });

  it("GET 500", async () => {
    getSession.mockResolvedValueOnce(user);
    (wishlistService.list as jest.Mock).mockRejectedValueOnce(new Error("boom"));
    const res = await GET(makeRequest("/api/v1/wishlist"));
    expect(res.status).toBe(500);
  });

  it("POST 401", async () => {
    getSession.mockResolvedValueOnce(null);
    const res = await POST(makeRequest("/api/v1/wishlist", { method: "POST", body: { productId: 1 } }));
    expect(res.status).toBe(401);
  });

  it("POST 400 invalid", async () => {
    getSession.mockResolvedValueOnce(user);
    const res = await POST(makeRequest("/api/v1/wishlist", { method: "POST", body: {} }));
    expect(res.status).toBe(400);
  });

  it("POST 201", async () => {
    getSession.mockResolvedValueOnce(user);
    (wishlistService.add as jest.Mock).mockResolvedValueOnce({ id: "w" });
    const res = await POST(makeRequest("/api/v1/wishlist", { method: "POST", body: { productId: 1 } }));
    expect(res.status).toBe(201);
  });

  it("POST 409 ALREADY_IN_WISHLIST", async () => {
    getSession.mockResolvedValueOnce(user);
    (wishlistService.add as jest.Mock).mockRejectedValueOnce(new Error("ALREADY_IN_WISHLIST"));
    const res = await POST(makeRequest("/api/v1/wishlist", { method: "POST", body: { productId: 1 } }));
    expect(res.status).toBe(409);
  });

  it("POST 404 PRODUCT_NOT_FOUND", async () => {
    getSession.mockResolvedValueOnce(user);
    (wishlistService.add as jest.Mock).mockRejectedValueOnce(new Error("PRODUCT_NOT_FOUND"));
    const res = await POST(makeRequest("/api/v1/wishlist", { method: "POST", body: { productId: 1 } }));
    expect(res.status).toBe(404);
  });

  it("POST 500", async () => {
    getSession.mockResolvedValueOnce(user);
    (wishlistService.add as jest.Mock).mockRejectedValueOnce(new Error("boom"));
    const res = await POST(makeRequest("/api/v1/wishlist", { method: "POST", body: { productId: 1 } }));
    expect(res.status).toBe(500);
  });
});

describe("DELETE /api/v1/wishlist/[productId]", () => {
  beforeEach(() => jest.clearAllMocks());

  it("401", async () => {
    getSession.mockResolvedValueOnce(null);
    const res = await DELETE(
      makeRequest("/api/v1/wishlist/1", { method: "DELETE" }),
      paramsFor({ productId: "1" })
    );
    expect(res.status).toBe(401);
  });

  it("200", async () => {
    getSession.mockResolvedValueOnce(user);
    (wishlistService.remove as jest.Mock).mockResolvedValueOnce(undefined);
    const res = await DELETE(
      makeRequest("/api/v1/wishlist/1", { method: "DELETE" }),
      paramsFor({ productId: "1" })
    );
    expect(res.status).toBe(200);
  });

  it("404 NOT_FOUND", async () => {
    getSession.mockResolvedValueOnce(user);
    (wishlistService.remove as jest.Mock).mockRejectedValueOnce(new Error("NOT_FOUND"));
    const res = await DELETE(
      makeRequest("/api/v1/wishlist/1", { method: "DELETE" }),
      paramsFor({ productId: "1" })
    );
    expect(res.status).toBe(404);
  });

  it("500", async () => {
    getSession.mockResolvedValueOnce(user);
    (wishlistService.remove as jest.Mock).mockRejectedValueOnce(new Error("boom"));
    const res = await DELETE(
      makeRequest("/api/v1/wishlist/1", { method: "DELETE" }),
      paramsFor({ productId: "1" })
    );
    expect(res.status).toBe(500);
  });
});
