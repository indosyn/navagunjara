/**
 * Unit tests for shared utility functions.
 *
 * @module __tests__/lib/utils.test
 * @author Anurag Muthyam
 * @organization indosyn
 */

import {
  apiSuccess,
  apiError,
  serializeDecimal,
  formatINR,
  capitalize,
  toTitleCase,
} from "@/lib/utils";

/* ── apiSuccess ─────────────────────────────────────────────────────────── */
describe("apiSuccess", () => {
  it("returns default 200 with success envelope", () => {
    const result = apiSuccess({ id: 1 });
    expect(result.status).toBe(200);
    expect(result.body).toEqual({
      success: true,
      message: "Success",
      data: { id: 1 },
    });
  });

  it("accepts custom message and status", () => {
    const result = apiSuccess("created", "Resource created", 201);
    expect(result.status).toBe(201);
    expect(result.body.message).toBe("Resource created");
    expect(result.body.data).toBe("created");
  });

  it("wraps null data", () => {
    const result = apiSuccess(null);
    expect(result.body.success).toBe(true);
    expect(result.body.data).toBeNull();
  });
});

/* ── apiError ───────────────────────────────────────────────────────────── */
describe("apiError", () => {
  it("returns error envelope with the given status", () => {
    const result = apiError("Not found", 404, "NOT_FOUND");
    expect(result.status).toBe(404);
    expect(result.body).toEqual({
      success: false,
      message: "Not found",
      errorCode: "NOT_FOUND",
      errorDetail: undefined,
    });
  });

  it("includes optional errorDetail", () => {
    const result = apiError("Validation", 400, "VALIDATION", "name is required");
    expect(result.body.errorDetail).toBe("name is required");
  });

  it("works without errorCode", () => {
    const result = apiError("Server error", 500);
    expect(result.body.errorCode).toBeUndefined();
    expect(result.body.success).toBe(false);
  });
});

/* ── serializeDecimal ───────────────────────────────────────────────────── */
describe("serializeDecimal", () => {
  it("returns null/undefined unchanged", () => {
    expect(serializeDecimal(null)).toBeNull();
    expect(serializeDecimal(undefined)).toBeUndefined();
  });

  it("converts BigInt to string", () => {
    expect(serializeDecimal(BigInt(12345))).toBe("12345");
  });

  it("converts Decimal-like objects to string", () => {
    const decimal = { toFixed: () => "9.99", toString: () => "9.99" };
    expect(serializeDecimal(decimal)).toBe("9.99");
  });

  it("recursively serializes arrays", () => {
    const result = serializeDecimal([BigInt(1), BigInt(2)]);
    expect(result).toEqual(["1", "2"]);
  });

  it("recursively serializes nested objects", () => {
    const result = serializeDecimal({
      id: BigInt(1),
      nested: { price: BigInt(100) },
    });
    expect(result).toEqual({ id: "1", nested: { price: "100" } });
  });

  it("passes through primitives unchanged", () => {
    expect(serializeDecimal("hello")).toBe("hello");
    expect(serializeDecimal(42)).toBe(42);
    expect(serializeDecimal(true)).toBe(true);
  });
});

/* ── formatINR ──────────────────────────────────────────────────────────── */
describe("formatINR", () => {
  it("formats a number as INR", () => {
    const result = formatINR(1500);
    expect(result).toContain("1,500");
    expect(result).toContain("₹");
  });

  it("handles string input", () => {
    const result = formatINR("2500.50");
    expect(result).toContain("2,500.50");
  });

  it("formats zero", () => {
    const result = formatINR(0);
    expect(result).toContain("0");
  });
});

/* ── capitalize ─────────────────────────────────────────────────────────── */
describe("capitalize", () => {
  it("capitalizes first letter and lowercases rest", () => {
    expect(capitalize("hello")).toBe("Hello");
    expect(capitalize("HELLO")).toBe("Hello");
  });

  it("handles single character", () => {
    expect(capitalize("a")).toBe("A");
  });

  it("handles empty string", () => {
    expect(capitalize("")).toBe("");
  });
});

/* ── toTitleCase ────────────────────────────────────────────────────────── */
describe("toTitleCase", () => {
  it("converts SNAKE_CASE to Title Case", () => {
    expect(toTitleCase("SALWAR_KAMEEZ")).toBe("Salwar Kameez");
  });

  it("converts single word", () => {
    expect(toTitleCase("SAREE")).toBe("Saree");
  });

  it("handles already-lowercase input", () => {
    expect(toTitleCase("free_size")).toBe("Free Size");
  });
});
