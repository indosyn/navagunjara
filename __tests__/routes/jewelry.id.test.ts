/** @jest-environment node */
/**
 * Tests for jewelry detail routes.
 *
 * @author Anurag Muthyam
 * @organization indosyn
 */

jest.mock("@/lib/api-auth", () => ({ getApiSession: jest.fn() }));
jest.mock("@/services/jewelry.service", () => ({
  jewelryService: {
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));
jest.mock("@/lib/logger", () => ({
  createLogger: () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() }),
}));

import { GET, PUT, DELETE } from "@/app/api/v1/jewelry/[id]/route";
import { getApiSession } from "@/lib/api-auth";
import { jewelryService } from "@/services/jewelry.service";
import { makeRequest, paramsFor } from "../helpers/route";

const getSession = getApiSession as jest.Mock;
const admin = { user: { id: "1", email: "a@x.com", role: "ADMIN" } };
const user = { user: { id: "2", email: "c@x.com", role: "USER" } };

describe("/api/v1/jewelry/[id]", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("GET", () => {
    it("returns 200 on hit", async () => {
      (jewelryService.findById as jest.Mock).mockResolvedValueOnce({ id: "1" });
      const res = await GET(makeRequest("/api/v1/jewelry/1"), paramsFor({ id: "1" }));
      expect(res.status).toBe(200);
    });

    it("returns 404 on miss", async () => {
      (jewelryService.findById as jest.Mock).mockRejectedValueOnce(new Error("nope"));
      const res = await GET(makeRequest("/api/v1/jewelry/1"), paramsFor({ id: "1" }));
      expect(res.status).toBe(404);
    });
  });

  describe("PUT", () => {
    it("403 without admin", async () => {
      getSession.mockResolvedValueOnce(user);
      const res = await PUT(
        makeRequest("/api/v1/jewelry/1", { method: "PUT", body: { price: 100 } }),
        paramsFor({ id: "1" })
      );
      expect(res.status).toBe(403);
    });

    it("400 on bad payload", async () => {
      getSession.mockResolvedValueOnce(admin);
      const res = await PUT(
        makeRequest("/api/v1/jewelry/1", { method: "PUT", body: { price: -1 } }),
        paramsFor({ id: "1" })
      );
      expect(res.status).toBe(400);
    });

    it("200 on success", async () => {
      getSession.mockResolvedValueOnce(admin);
      (jewelryService.update as jest.Mock).mockResolvedValueOnce({ id: "1", price: 100 });
      const res = await PUT(
        makeRequest("/api/v1/jewelry/1", { method: "PUT", body: { price: 100 } }),
        paramsFor({ id: "1" })
      );
      expect(res.status).toBe(200);
    });

    it("404 when service throws NOT_FOUND", async () => {
      getSession.mockResolvedValueOnce(admin);
      (jewelryService.update as jest.Mock).mockRejectedValueOnce(new Error("NOT_FOUND"));
      const res = await PUT(
        makeRequest("/api/v1/jewelry/1", { method: "PUT", body: { price: 100 } }),
        paramsFor({ id: "1" })
      );
      expect(res.status).toBe(404);
    });

    it("500 on generic error", async () => {
      getSession.mockResolvedValueOnce(admin);
      (jewelryService.update as jest.Mock).mockRejectedValueOnce(new Error("boom"));
      const res = await PUT(
        makeRequest("/api/v1/jewelry/1", { method: "PUT", body: { price: 100 } }),
        paramsFor({ id: "1" })
      );
      expect(res.status).toBe(500);
    });
  });

  describe("DELETE", () => {
    it("403 without admin", async () => {
      getSession.mockResolvedValueOnce(null);
      const res = await DELETE(makeRequest("/api/v1/jewelry/1", { method: "DELETE" }), paramsFor({ id: "1" }));
      expect(res.status).toBe(403);
    });

    it("200 on success", async () => {
      getSession.mockResolvedValueOnce(admin);
      (jewelryService.delete as jest.Mock).mockResolvedValueOnce(undefined);
      const res = await DELETE(makeRequest("/api/v1/jewelry/1", { method: "DELETE" }), paramsFor({ id: "1" }));
      expect(res.status).toBe(200);
    });

    it("404 on error", async () => {
      getSession.mockResolvedValueOnce(admin);
      (jewelryService.delete as jest.Mock).mockRejectedValueOnce(new Error("x"));
      const res = await DELETE(makeRequest("/api/v1/jewelry/1", { method: "DELETE" }), paramsFor({ id: "1" }));
      expect(res.status).toBe(404);
    });
  });
});
