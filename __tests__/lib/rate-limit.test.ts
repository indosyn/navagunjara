/**
 * Tests for in-memory rate limiter.
 *
 * @jest-environment node
 * @module __tests__/lib/rate-limit.test
 * @author Anurag Muthyam
 * @organization indosyn
 */

import { rateLimit, clientIp, enforceRateLimit } from "@/lib/rate-limit";
import { NextRequest } from "next/server";

function req(headers: Record<string, string> = {}): NextRequest {
  return { headers: { get: (k: string) => headers[k.toLowerCase()] ?? null } } as unknown as NextRequest;
}

beforeEach(() => {
  // each test uses its own key namespace via Date.now()
});

describe("rateLimit", () => {
  it("allows requests under limit", async () => {
    const key = `t1:${Date.now()}`;
    expect((await rateLimit(key, 3, 60_000)).allowed).toBe(true);
    expect((await rateLimit(key, 3, 60_000)).allowed).toBe(true);
    const third = await rateLimit(key, 3, 60_000);
    expect(third.allowed).toBe(true);
    expect(third.remaining).toBe(0);
  });

  it("blocks requests over the limit", async () => {
    const key = `t2:${Date.now()}`;
    for (let i = 0; i < 3; i++) await rateLimit(key, 3, 60_000);
    const blocked = await rateLimit(key, 3, 60_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.resetMs).toBeGreaterThan(0);
  });

  it("counts remaining correctly", async () => {
    const key = `t3:${Date.now()}`;
    const r = await rateLimit(key, 5, 60_000);
    expect(r.remaining).toBe(4);
  });
});

describe("clientIp", () => {
  it("uses x-forwarded-for first ip", () => {
    expect(clientIp(req({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" }))).toBe("1.2.3.4");
  });
  it("falls back to x-real-ip", () => {
    expect(clientIp(req({ "x-real-ip": "9.9.9.9" }))).toBe("9.9.9.9");
  });
  it("returns 'unknown' when no headers", () => {
    expect(clientIp(req())).toBe("unknown");
  });
});

describe("enforceRateLimit", () => {
  it("returns null when under limit (dev multiplies by 10)", async () => {
    const r = req({ "x-forwarded-for": `10.0.0.${Math.floor(Math.random() * 254)}` });
    const block = await enforceRateLimit(r, `scope:${Date.now()}`, 1, 60_000);
    expect(block).toBeNull();
  });

  it("returns 429 when limit exhausted", async () => {
    const ip = `10.1.1.${Math.floor(Math.random() * 254)}`;
    const r = req({ "x-forwarded-for": ip });
    const scope = `scope:${Date.now()}`;
    // Dev multiplier = 10, so limit=1 means 10 allowed; exhaust them.
    for (let i = 0; i < 10; i++) await enforceRateLimit(r, scope, 1, 60_000);
    const block = await enforceRateLimit(r, scope, 1, 60_000);
    expect(block).not.toBeNull();
    expect(block!.status).toBe(429);
    expect(block!.headers.get("Retry-After")).toBeDefined();
  });
});
