/** @jest-environment node */
/**
 * Tests for admin dashboard + OpenAPI routes.
 *
 * @author Anurag Muthyam
 * @organization indosyn
 */

jest.mock("@/lib/api-auth", () => ({ getApiSession: jest.fn() }));
jest.mock("@/services/admin.service", () => ({
  adminService: { getDashboardStats: jest.fn() },
}));
jest.mock("@/lib/logger", () => ({
  createLogger: () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() }),
}));
jest.mock("@/lib/openapi", () => ({
  openApiSpec: { openapi: "3.0.0", info: { title: "Test" } },
}));

import { GET as dashboard } from "@/app/api/v1/admin/dashboard/route";
import { GET as openapi } from "@/app/api/openapi/route";
import { getApiSession } from "@/lib/api-auth";
import { adminService } from "@/services/admin.service";
import { makeRequest } from "../helpers/route";

const getSession = getApiSession as jest.Mock;
const admin = { user: { id: "1", email: "a@x.com", role: "ADMIN" } };
const user = { user: { id: "2", email: "c@x.com", role: "USER" } };

describe("GET /api/v1/admin/dashboard", () => {
  beforeEach(() => jest.clearAllMocks());

  it("403 no session", async () => {
    getSession.mockResolvedValueOnce(null);
    const res = await dashboard(makeRequest("/api/v1/admin/dashboard"));
    expect(res.status).toBe(403);
  });

  it("403 non-admin", async () => {
    getSession.mockResolvedValueOnce(user);
    const res = await dashboard(makeRequest("/api/v1/admin/dashboard"));
    expect(res.status).toBe(403);
  });

  it("200 admin", async () => {
    getSession.mockResolvedValueOnce(admin);
    (adminService.getDashboardStats as jest.Mock).mockResolvedValueOnce({ orders: 10 });
    const res = await dashboard(makeRequest("/api/v1/admin/dashboard"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.orders).toBe(10);
  });
});

describe("GET /api/openapi", () => {
  it("returns spec", async () => {
    const res = await openapi();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.openapi).toBe("3.0.0");
  });
});
