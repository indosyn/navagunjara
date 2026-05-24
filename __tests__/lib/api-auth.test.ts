/** @jest-environment node */
/**
 * Tests for `lib/api-auth.ts` — hybrid session resolution and token-version cache.
 *
 * @author Anurag Muthyam
 * @organization indosyn
 */

jest.mock("@/lib/env", () => ({
  env: { NEXTAUTH_SECRET: "test-secret-test-secret-test-secret-test", NODE_ENV: "test" },
}));
jest.mock("@/lib/auth", () => ({ auth: jest.fn() }));
jest.mock("@/lib/db", () => ({
  db: {
    admin: { findUnique: jest.fn() },
    customer: { findUnique: jest.fn() },
  },
}));
jest.mock("jose", () => ({ jwtVerify: jest.fn() }));

import { NextRequest } from "next/server";
import { getApiSession, invalidateTokenVersionCache } from "@/lib/api-auth";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { jwtVerify } from "jose";

const mAuth = auth as unknown as jest.Mock;
const mJwt = jwtVerify as unknown as jest.Mock;

function reqWith(headers: Record<string, string> = {}): NextRequest {
  return new NextRequest(new URL("http://localhost/x"), { headers });
}

describe("getApiSession", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (db.admin.findUnique as jest.Mock).mockReset();
    (db.customer.findUnique as jest.Mock).mockReset();
  });

  it("returns NextAuth session when present", async () => {
    mAuth.mockResolvedValueOnce({ user: { id: "5", email: "a@x.com", role: "ADMIN" } });
    const s = await getApiSession();
    expect(s?.user).toEqual({ id: "5", email: "a@x.com", role: "ADMIN" });
  });

  it("defaults role to USER and empty email when missing", async () => {
    mAuth.mockResolvedValueOnce({ user: { id: 7 } });
    const s = await getApiSession();
    expect(s?.user.role).toBe("USER");
    expect(s?.user.email).toBe("");
  });

  it("returns null when no NextAuth session and no Bearer header", async () => {
    mAuth.mockResolvedValueOnce(null);
    expect(await getApiSession(reqWith())).toBeNull();
  });

  it("rejects malformed Authorization header", async () => {
    mAuth.mockResolvedValueOnce(null);
    expect(await getApiSession(reqWith({ authorization: "Basic xyz" }))).toBeNull();
  });

  it("returns null when jwtVerify throws", async () => {
    mAuth.mockResolvedValueOnce(null);
    mJwt.mockRejectedValueOnce(new Error("bad"));
    expect(await getApiSession(reqWith({ authorization: "Bearer x.y.z" }))).toBeNull();
  });

  it("returns null when payload missing id/email", async () => {
    mAuth.mockResolvedValueOnce(null);
    mJwt.mockResolvedValueOnce({ payload: { id: "1" } });
    expect(await getApiSession(reqWith({ authorization: "Bearer x.y.z" }))).toBeNull();
  });

  it("verifies admin Bearer token with matching tokenVersion", async () => {
    mAuth.mockResolvedValueOnce(null);
    mJwt.mockResolvedValueOnce({
      payload: { id: "10", email: "a@x.com", role: "ADMIN", tv: 1 },
    });
    (db.admin.findUnique as jest.Mock).mockResolvedValueOnce({ tokenVersion: 1 });
    const s = await getApiSession(reqWith({ authorization: "Bearer x.y.z" }));
    expect(s?.user).toEqual({ id: "10", email: "a@x.com", role: "ADMIN" });
  });

  it("returns null when admin tokenVersion mismatch (revoked)", async () => {
    mAuth.mockResolvedValueOnce(null);
    invalidateTokenVersionCache("ADMIN", "11");
    mJwt.mockResolvedValueOnce({
      payload: { id: "11", email: "a@x.com", role: "ADMIN", tv: 0 },
    });
    (db.admin.findUnique as jest.Mock).mockResolvedValueOnce({ tokenVersion: 5 });
    const s = await getApiSession(reqWith({ authorization: "Bearer x.y.z" }));
    expect(s).toBeNull();
  });

  it("returns null when admin id not found", async () => {
    mAuth.mockResolvedValueOnce(null);
    invalidateTokenVersionCache("ADMIN", "99");
    mJwt.mockResolvedValueOnce({
      payload: { id: "99", email: "a@x.com", role: "ADMIN", tv: 1 },
    });
    (db.admin.findUnique as jest.Mock).mockResolvedValueOnce(null);
    expect(await getApiSession(reqWith({ authorization: "Bearer x.y.z" }))).toBeNull();
  });

  it("returns null when customer inactive", async () => {
    mAuth.mockResolvedValueOnce(null);
    invalidateTokenVersionCache("USER", "20");
    mJwt.mockResolvedValueOnce({
      payload: { id: "20", email: "c@x.com", role: "USER", tv: 1 },
    });
    (db.customer.findUnique as jest.Mock).mockResolvedValueOnce({
      tokenVersion: 1,
      status: "DEACTIVATED",
    });
    expect(await getApiSession(reqWith({ authorization: "Bearer x.y.z" }))).toBeNull();
  });

  it("verifies active customer with matching tokenVersion", async () => {
    mAuth.mockResolvedValueOnce(null);
    invalidateTokenVersionCache("USER", "21");
    mJwt.mockResolvedValueOnce({
      payload: { id: "21", email: "c@x.com", role: "USER", tv: 2 },
    });
    (db.customer.findUnique as jest.Mock).mockResolvedValueOnce({
      tokenVersion: 2,
      status: "ACTIVE",
    });
    const s = await getApiSession(reqWith({ authorization: "Bearer x.y.z" }));
    expect(s?.user).toEqual({ id: "21", email: "c@x.com", role: "USER" });
  });

  it("returns null on db error (fail-closed)", async () => {
    mAuth.mockResolvedValueOnce(null);
    invalidateTokenVersionCache("USER", "22");
    mJwt.mockResolvedValueOnce({
      payload: { id: "22", email: "c@x.com", role: "USER", tv: 1 },
    });
    (db.customer.findUnique as jest.Mock).mockRejectedValueOnce(new Error("db down"));
    expect(await getApiSession(reqWith({ authorization: "Bearer x.y.z" }))).toBeNull();
  });

  it("returns null when id is not a valid bigint", async () => {
    mAuth.mockResolvedValueOnce(null);
    mJwt.mockResolvedValueOnce({
      payload: { id: "abc", email: "c@x.com", role: "USER", tv: 1 },
    });
    expect(await getApiSession(reqWith({ authorization: "Bearer x.y.z" }))).toBeNull();
  });

  it("uses tv cache on second call (no second db hit)", async () => {
    mAuth.mockResolvedValue(null);
    invalidateTokenVersionCache("ADMIN", "30");
    mJwt.mockResolvedValue({
      payload: { id: "30", email: "a@x.com", role: "ADMIN", tv: 7 },
    });
    (db.admin.findUnique as jest.Mock).mockResolvedValueOnce({ tokenVersion: 7 });
    await getApiSession(reqWith({ authorization: "Bearer x.y.z" }));
    await getApiSession(reqWith({ authorization: "Bearer x.y.z" }));
    expect(db.admin.findUnique).toHaveBeenCalledTimes(1);
  });

  it("invalidateTokenVersionCache forces re-fetch", async () => {
    mAuth.mockResolvedValue(null);
    invalidateTokenVersionCache("ADMIN", "31");
    mJwt.mockResolvedValue({
      payload: { id: "31", email: "a@x.com", role: "ADMIN", tv: 1 },
    });
    (db.admin.findUnique as jest.Mock)
      .mockResolvedValueOnce({ tokenVersion: 1 })
      .mockResolvedValueOnce({ tokenVersion: 1 });
    await getApiSession(reqWith({ authorization: "Bearer x.y.z" }));
    invalidateTokenVersionCache("ADMIN", "31");
    await getApiSession(reqWith({ authorization: "Bearer x.y.z" }));
    expect(db.admin.findUnique).toHaveBeenCalledTimes(2);
  });
});
