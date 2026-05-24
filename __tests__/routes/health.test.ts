/** @jest-environment node */
/**
 * Tests for the health-check route.
 *
 * @author Anurag Muthyam
 * @organization indosyn
 */

jest.mock("@/lib/db", () => ({ db: { $queryRaw: jest.fn() } }));
jest.mock("@/lib/logger", () => ({
  createLogger: () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() }),
}));

import { GET } from "@/app/api/health/route";
import { db } from "@/lib/db";
import { makeRequest } from "../helpers/route";

const $queryRaw = db.$queryRaw as unknown as jest.Mock;

describe("GET /api/health", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 200 UP for liveness probe", async () => {
    const res = await GET(makeRequest("/api/health"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ success: true, message: "OK", data: { status: "UP" } });
    expect($queryRaw).not.toHaveBeenCalled();
  });

  it("returns 200 READY when db is up", async () => {
    $queryRaw.mockResolvedValueOnce([{ "?column?": 1 }]);
    const res = await GET(makeRequest("/api/health", { searchParams: { probe: "ready" } }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.status).toBe("UP");
    expect(body.data.checks[0]).toMatchObject({ name: "database", status: "UP" });
  });

  it("returns 503 NOT_READY when db is down", async () => {
    $queryRaw.mockRejectedValueOnce(new Error("connection refused"));
    const res = await GET(makeRequest("/api/health", { searchParams: { probe: "ready" } }));
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.data.status).toBe("DOWN");
    expect(body.data.checks[0]).toMatchObject({ name: "database", status: "DOWN" });
    expect(body.data.checks[0].error).toContain("connection refused");
  });

  it("times out a hung dependency", async () => {
    $queryRaw.mockImplementationOnce(() => new Promise(() => {}));
    const res = await GET(makeRequest("/api/health", { searchParams: { probe: "ready" } }));
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.data.checks[0].status).toBe("DOWN");
    expect(body.data.checks[0].error).toMatch(/timed out/);
  }, 5000);
});
