/** @jest-environment node */
/**
 * Tests for jewelry collection routes.
 *
 * @author Anurag Muthyam
 * @organization indosyn
 */

jest.mock("@/lib/api-auth", () => ({ getApiSession: jest.fn() }));
jest.mock("@/services/jewelry.service", () => ({
  jewelryService: {
    list: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    search: jest.fn(),
  },
}));
jest.mock("@/lib/logger", () => ({
  createLogger: () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() }),
}));

import { GET, POST } from "@/app/api/v1/jewelry/route";
import { getApiSession } from "@/lib/api-auth";
import { jewelryService } from "@/services/jewelry.service";
import { makeRequest } from "../helpers/route";

const getSession = getApiSession as jest.Mock;
const adminSession = { user: { id: "1", email: "a@x.com", role: "ADMIN" } };
const userSession = { user: { id: "2", email: "c@x.com", role: "USER" } };
const validBody = {
  name: "Necklace",
  description: "x",
  price: 1000,
  stockQuantity: 1,
  jewelleryType: "NECKLACE",
  material: "22K Gold",
};

describe("/api/v1/jewelry", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("GET", () => {
    it("returns paginated list with default params", async () => {
      (jewelryService.list as jest.Mock).mockResolvedValueOnce({ content: [], totalElements: 0 });
      const res = await GET(makeRequest("/api/v1/jewelry"));
      expect(res.status).toBe(200);
      expect(jewelryService.list).toHaveBeenCalledWith(0, 10);
      expect(res.headers.get("cache-control")).toContain("s-maxage=60");
    });

    it("clamps page/size", async () => {
      (jewelryService.list as jest.Mock).mockResolvedValueOnce({ content: [] });
      await GET(makeRequest("/api/v1/jewelry", { searchParams: { page: "-5", size: "999" } }));
      expect(jewelryService.list).toHaveBeenCalledWith(0, 100);
    });
  });

  describe("POST", () => {
    it("rejects unauthenticated requests", async () => {
      getSession.mockResolvedValueOnce(null);
      const res = await POST(makeRequest("/api/v1/jewelry", { method: "POST", body: validBody }));
      expect(res.status).toBe(401);
    });

    it("rejects non-admin", async () => {
      getSession.mockResolvedValueOnce(userSession);
      const res = await POST(makeRequest("/api/v1/jewelry", { method: "POST", body: validBody }));
      expect(res.status).toBe(403);
    });

    it("returns 400 on validation error", async () => {
      getSession.mockResolvedValueOnce(adminSession);
      const res = await POST(makeRequest("/api/v1/jewelry", { method: "POST", body: { name: "" } }));
      expect(res.status).toBe(400);
    });

    it("creates jewelry", async () => {
      getSession.mockResolvedValueOnce(adminSession);
      (jewelryService.create as jest.Mock).mockResolvedValueOnce({ id: "1", ...validBody });
      const res = await POST(makeRequest("/api/v1/jewelry", { method: "POST", body: validBody }));
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.data.id).toBe("1");
    });

    it("returns 500 on service error", async () => {
      getSession.mockResolvedValueOnce(adminSession);
      (jewelryService.create as jest.Mock).mockRejectedValueOnce(new Error("boom"));
      const res = await POST(makeRequest("/api/v1/jewelry", { method: "POST", body: validBody }));
      expect(res.status).toBe(500);
    });
  });
});
