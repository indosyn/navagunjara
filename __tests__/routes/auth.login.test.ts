/** @jest-environment node */
/**
 * Tests for POST /api/v1/auth/login.
 *
 * @author Anurag Muthyam
 * @organization indosyn
 */

jest.mock("@/lib/db", () => ({
  db: {
    admin: { findUnique: jest.fn() },
    customer: { findUnique: jest.fn() },
  },
}));
jest.mock("bcryptjs", () => ({ compare: jest.fn() }));
jest.mock("@/lib/logger", () => ({
  createLogger: () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() }),
}));
jest.mock("@/lib/rate-limit", () => ({
  rateLimit: jest.fn(() => ({ allowed: true, resetMs: 0 })),
  enforceRateLimit: jest.fn(() => null),
}));
jest.mock("@/lib/api-auth", () => ({
  invalidateTokenVersionCache: jest.fn(),
  getApiSession: jest.fn(),
}));
jest.mock("@/lib/env", () => ({
  env: { NEXTAUTH_SECRET: "test-secret-test-secret-test-secret-test", NODE_ENV: "test" },
}));
jest.mock("jose", () => ({
  SignJWT: class {
    setProtectedHeader() { return this; }
    setExpirationTime() { return this; }
    async sign() { return "header.payload.signature"; }
  },
}));

import { POST } from "@/app/api/v1/auth/login/route";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { rateLimit } from "@/lib/rate-limit";
import { makeRequest } from "../helpers/route";

const adminFind = db.admin.findUnique as jest.Mock;
const custFind = db.customer.findUnique as jest.Mock;
const compare = bcrypt.compare as unknown as jest.Mock;
const rateLimitMock = rateLimit as jest.Mock;

const adminRow = {
  id: 1n,
  email: "a@x.com",
  password: "hashed",
  firstName: "A",
  lastName: "D",
  tokenVersion: 0,
};
const custRow = {
  id: 2n,
  email: "c@x.com",
  password: "hashed",
  firstName: "C",
  lastName: "U",
  tokenVersion: 0,
  status: "ACTIVE",
};

describe("POST /api/v1/auth/login", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    rateLimitMock.mockReturnValue({ allowed: true, resetMs: 0 });
  });

  it("returns 400 on validation failure", async () => {
    const res = await POST(makeRequest("/api/v1/auth/login", { method: "POST", body: { email: "bad" } }));
    expect(res.status).toBe(400);
  });

  it("logs in admin successfully", async () => {
    adminFind.mockResolvedValueOnce(adminRow);
    compare.mockResolvedValueOnce(true);
    const res = await POST(
      makeRequest("/api/v1/auth/login", { method: "POST", body: { email: "a@x.com", password: "Password@1" } })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.role).toBe("ADMIN");
    expect(body.data.token.split(".").length).toBe(3);
  });

  it("returns 401 for wrong admin password", async () => {
    adminFind.mockResolvedValueOnce(adminRow);
    compare.mockResolvedValueOnce(false);
    const res = await POST(
      makeRequest("/api/v1/auth/login", { method: "POST", body: { email: "a@x.com", password: "Password@1" } })
    );
    expect(res.status).toBe(401);
  });

  it("logs in customer successfully", async () => {
    adminFind.mockResolvedValueOnce(null);
    custFind.mockResolvedValueOnce(custRow);
    compare.mockResolvedValueOnce(true);
    const res = await POST(
      makeRequest("/api/v1/auth/login", { method: "POST", body: { email: "c@x.com", password: "Password@1" } })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.role).toBe("USER");
  });

  it("returns 401 when account is not ACTIVE", async () => {
    adminFind.mockResolvedValueOnce(null);
    custFind.mockResolvedValueOnce({ ...custRow, status: "DEACTIVATED" });
    const res = await POST(
      makeRequest("/api/v1/auth/login", { method: "POST", body: { email: "c@x.com", password: "Password@1" } })
    );
    expect(res.status).toBe(401);
  });

  it("returns 401 when no account exists", async () => {
    adminFind.mockResolvedValueOnce(null);
    custFind.mockResolvedValueOnce(null);
    const res = await POST(
      makeRequest("/api/v1/auth/login", { method: "POST", body: { email: "x@x.com", password: "Password@1" } })
    );
    expect(res.status).toBe(401);
  });

  it("returns 401 for wrong customer password", async () => {
    adminFind.mockResolvedValueOnce(null);
    custFind.mockResolvedValueOnce(custRow);
    compare.mockResolvedValueOnce(false);
    const res = await POST(
      makeRequest("/api/v1/auth/login", { method: "POST", body: { email: "c@x.com", password: "Password@1" } })
    );
    expect(res.status).toBe(401);
  });

  it("returns 429 on rate limit", async () => {
    rateLimitMock.mockReturnValueOnce({ allowed: false, resetMs: 30_000 });
    const res = await POST(
      makeRequest("/api/v1/auth/login", { method: "POST", body: { email: "c@x.com", password: "Password@1" } })
    );
    expect(res.status).toBe(429);
    expect(res.headers.get("retry-after")).toBe("30");
  });

  it("returns 500 on unexpected error", async () => {
    adminFind.mockRejectedValueOnce(new Error("db down"));
    const res = await POST(
      makeRequest("/api/v1/auth/login", { method: "POST", body: { email: "c@x.com", password: "Password@1" } })
    );
    expect(res.status).toBe(500);
  });
});
