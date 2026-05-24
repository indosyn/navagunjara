/** @jest-environment node */
/**
 * Tests for clothing routes.
 *
 * @author Anurag Muthyam
 * @organization indosyn
 */

jest.mock("@/lib/api-auth", () => ({ getApiSession: jest.fn() }));
jest.mock("@/services/clothing.service", () => ({
  clothingService: {
    list: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));
jest.mock("@/lib/logger", () => ({
  createLogger: () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() }),
}));

import { GET, POST } from "@/app/api/v1/clothing/route";
import {
  GET as detailGet,
  PUT as detailPut,
  DELETE as detailDelete,
} from "@/app/api/v1/clothing/[id]/route";
import { getApiSession } from "@/lib/api-auth";
import { clothingService } from "@/services/clothing.service";
import { makeRequest, paramsFor } from "../helpers/route";

const getSession = getApiSession as jest.Mock;
const admin = { user: { id: "1", email: "a@x.com", role: "ADMIN" } };
const user = { user: { id: "2", email: "c@x.com", role: "USER" } };
const valid = {
  name: "Saree",
  description: "x",
  price: 1000,
  stockQuantity: 1,
  clothingType: "SAREE",
  size: "FREE_SIZE",
  color: "Red",
  gender: "FEMALE",
};

describe("/api/v1/clothing", () => {
  beforeEach(() => jest.clearAllMocks());

  it("GET lists", async () => {
    (clothingService.list as jest.Mock).mockResolvedValueOnce({ content: [] });
    const res = await GET(makeRequest("/api/v1/clothing"));
    expect(res.status).toBe(200);
  });

  it("POST 403 non-admin", async () => {
    getSession.mockResolvedValueOnce(user);
    const res = await POST(makeRequest("/api/v1/clothing", { method: "POST", body: valid }));
    expect(res.status).toBe(403);
  });

  it("POST 400 invalid", async () => {
    getSession.mockResolvedValueOnce(admin);
    const res = await POST(makeRequest("/api/v1/clothing", { method: "POST", body: {} }));
    expect(res.status).toBe(400);
  });

  it("POST 201 success", async () => {
    getSession.mockResolvedValueOnce(admin);
    (clothingService.create as jest.Mock).mockResolvedValueOnce({ id: "1" });
    const res = await POST(makeRequest("/api/v1/clothing", { method: "POST", body: valid }));
    expect(res.status).toBe(201);
  });

  it("POST 500 on service error", async () => {
    getSession.mockResolvedValueOnce(admin);
    (clothingService.create as jest.Mock).mockRejectedValueOnce(new Error("boom"));
    const res = await POST(makeRequest("/api/v1/clothing", { method: "POST", body: valid }));
    expect(res.status).toBe(500);
  });
});

describe("/api/v1/clothing/[id]", () => {
  beforeEach(() => jest.clearAllMocks());

  it("GET 200", async () => {
    (clothingService.findById as jest.Mock).mockResolvedValueOnce({ id: "1" });
    const res = await detailGet(makeRequest("/api/v1/clothing/1"), paramsFor({ id: "1" }));
    expect(res.status).toBe(200);
  });

  it("GET 404", async () => {
    (clothingService.findById as jest.Mock).mockRejectedValueOnce(new Error("x"));
    const res = await detailGet(makeRequest("/api/v1/clothing/1"), paramsFor({ id: "1" }));
    expect(res.status).toBe(404);
  });

  it("PUT 403 non-admin", async () => {
    getSession.mockResolvedValueOnce(user);
    const res = await detailPut(
      makeRequest("/api/v1/clothing/1", { method: "PUT", body: {} }),
      paramsFor({ id: "1" })
    );
    expect(res.status).toBe(403);
  });

  it("PUT 400 invalid", async () => {
    getSession.mockResolvedValueOnce(admin);
    const res = await detailPut(
      makeRequest("/api/v1/clothing/1", { method: "PUT", body: { price: -1 } }),
      paramsFor({ id: "1" })
    );
    expect(res.status).toBe(400);
  });

  it("PUT 200 success", async () => {
    getSession.mockResolvedValueOnce(admin);
    (clothingService.update as jest.Mock).mockResolvedValueOnce({ id: "1" });
    const res = await detailPut(
      makeRequest("/api/v1/clothing/1", { method: "PUT", body: { price: 100 } }),
      paramsFor({ id: "1" })
    );
    expect(res.status).toBe(200);
  });

  it("PUT 404 NOT_FOUND", async () => {
    getSession.mockResolvedValueOnce(admin);
    (clothingService.update as jest.Mock).mockRejectedValueOnce(new Error("NOT_FOUND"));
    const res = await detailPut(
      makeRequest("/api/v1/clothing/1", { method: "PUT", body: { price: 100 } }),
      paramsFor({ id: "1" })
    );
    expect(res.status).toBe(404);
  });

  it("PUT 500 generic", async () => {
    getSession.mockResolvedValueOnce(admin);
    (clothingService.update as jest.Mock).mockRejectedValueOnce(new Error("boom"));
    const res = await detailPut(
      makeRequest("/api/v1/clothing/1", { method: "PUT", body: { price: 100 } }),
      paramsFor({ id: "1" })
    );
    expect(res.status).toBe(500);
  });

  it("DELETE 403", async () => {
    getSession.mockResolvedValueOnce(null);
    const res = await detailDelete(
      makeRequest("/api/v1/clothing/1", { method: "DELETE" }),
      paramsFor({ id: "1" })
    );
    expect(res.status).toBe(403);
  });

  it("DELETE 200", async () => {
    getSession.mockResolvedValueOnce(admin);
    (clothingService.delete as jest.Mock).mockResolvedValueOnce(undefined);
    const res = await detailDelete(
      makeRequest("/api/v1/clothing/1", { method: "DELETE" }),
      paramsFor({ id: "1" })
    );
    expect(res.status).toBe(200);
  });

  it("DELETE 404", async () => {
    getSession.mockResolvedValueOnce(admin);
    (clothingService.delete as jest.Mock).mockRejectedValueOnce(new Error("x"));
    const res = await detailDelete(
      makeRequest("/api/v1/clothing/1", { method: "DELETE" }),
      paramsFor({ id: "1" })
    );
    expect(res.status).toBe(404);
  });
});
