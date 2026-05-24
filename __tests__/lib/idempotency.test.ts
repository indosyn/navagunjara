/**
 * Tests for idempotency helpers.
 *
 * @jest-environment node
 * @module __tests__/lib/idempotency.test
 * @author Anurag Muthyam
 * @organization indosyn
 */

import { mockDb } from "../mocks/db.mock";

jest.mock("@/lib/logger", () => ({
  createLogger: () => ({ info: jest.fn(), warn: jest.fn(), debug: jest.fn(), error: jest.fn() }),
}));

import { readIdempotencyKey, checkIdempotency, rememberIdempotency } from "@/lib/idempotency";
import { NextRequest } from "next/server";

function req(headers: Record<string, string> = {}): NextRequest {
  return { headers: { get: (k: string) => headers[k.toLowerCase()] ?? null } } as unknown as NextRequest;
}

beforeEach(() => jest.clearAllMocks());

describe("readIdempotencyKey", () => {
  it("returns key when header present", () => {
    expect(readIdempotencyKey(req({ "idempotency-key": "abc-123" }))).toBe("abc-123");
  });
  it("trims whitespace", () => {
    expect(readIdempotencyKey(req({ "idempotency-key": "  abc  " }))).toBe("abc");
  });
  it("returns null when missing", () => {
    expect(readIdempotencyKey(req())).toBeNull();
  });
  it("returns null for empty/whitespace", () => {
    expect(readIdempotencyKey(req({ "idempotency-key": "   " }))).toBeNull();
  });
  it("returns null for over-long key", () => {
    expect(readIdempotencyKey(req({ "idempotency-key": "x".repeat(300) }))).toBeNull();
  });
});

describe("checkIdempotency", () => {
  it("returns null when no header", async () => {
    expect(await checkIdempotency(req(), "scope", "a1")).toBeNull();
  });

  it("returns null when no cached row", async () => {
    (mockDb.idempotencyKey.findUnique as jest.Mock).mockResolvedValue(null);
    expect(await checkIdempotency(req({ "idempotency-key": "k1" }), "scope", "a1")).toBeNull();
  });

  it("returns cached response when row exists for same actor", async () => {
    (mockDb.idempotencyKey.findUnique as jest.Mock).mockResolvedValue({
      actorId: "a1",
      expiresAt: new Date(Date.now() + 10_000),
      responseStatus: 201,
      responseBody: JSON.stringify({ success: true, data: { id: 1 } }),
    });
    const res = await checkIdempotency(req({ "idempotency-key": "k1" }), "scope", "a1");
    expect(res).not.toBeNull();
    expect(res!.status).toBe(201);
    expect(res!.headers.get("x-idempotent-replay")).toBe("true");
  });

  it("returns 409 when actor mismatch", async () => {
    (mockDb.idempotencyKey.findUnique as jest.Mock).mockResolvedValue({
      actorId: "other",
      expiresAt: new Date(Date.now() + 10_000),
      responseStatus: 200,
      responseBody: "{}",
    });
    const res = await checkIdempotency(req({ "idempotency-key": "k1" }), "scope", "a1");
    expect(res!.status).toBe(409);
  });

  it("returns null and deletes when expired", async () => {
    (mockDb.idempotencyKey.findUnique as jest.Mock).mockResolvedValue({
      actorId: "a1",
      expiresAt: new Date(Date.now() - 10_000),
      responseStatus: 200,
      responseBody: "{}",
    });
    (mockDb.idempotencyKey.delete as jest.Mock | undefined) ??
      ((mockDb.idempotencyKey as unknown as Record<string, jest.Mock>).delete = jest.fn());
    (mockDb.idempotencyKey as unknown as { delete: jest.Mock }).delete.mockResolvedValue({});
    const res = await checkIdempotency(req({ "idempotency-key": "k1" }), "scope", "a1");
    expect(res).toBeNull();
  });

  it("fails open on DB error (returns null)", async () => {
    (mockDb.idempotencyKey.findUnique as jest.Mock).mockRejectedValue(new Error("boom"));
    const res = await checkIdempotency(req({ "idempotency-key": "k1" }), "scope", "a1");
    expect(res).toBeNull();
  });

  it("handles unparseable cached body", async () => {
    (mockDb.idempotencyKey.findUnique as jest.Mock).mockResolvedValue({
      actorId: "a1",
      expiresAt: new Date(Date.now() + 10_000),
      responseStatus: 200,
      responseBody: "{not json",
    });
    const res = await checkIdempotency(req({ "idempotency-key": "k1" }), "scope", "a1");
    expect(res).not.toBeNull();
  });
});

describe("rememberIdempotency", () => {
  it("upserts when key present", async () => {
    (mockDb.idempotencyKey.upsert as jest.Mock).mockResolvedValue({});
    await rememberIdempotency(req({ "idempotency-key": "k1" }), "scope", "a1", 201, { x: 1 });
    expect(mockDb.idempotencyKey.upsert).toHaveBeenCalled();
  });

  it("no-ops when no key", async () => {
    await rememberIdempotency(req(), "scope", "a1", 200, {});
    expect(mockDb.idempotencyKey.upsert).not.toHaveBeenCalled();
  });

  it("swallows DB errors", async () => {
    (mockDb.idempotencyKey.upsert as jest.Mock).mockRejectedValue(new Error("boom"));
    await expect(
      rememberIdempotency(req({ "idempotency-key": "k1" }), "scope", "a1", 200, {})
    ).resolves.toBeUndefined();
  });
});
