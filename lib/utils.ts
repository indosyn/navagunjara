/**
 * Shared utility functions for API responses, serialization, and formatting.
 *
 * @module lib/utils
 * @author Anurag Muthyam
 * @organization indosyn
 */

import { type NextResponse } from "next/server";
import type { ApiResponse } from "@/types";

/**
 * Build a success API response envelope.
 *
 * @param data - The payload to include in `data`.
 * @param message - Human-readable message (default `"Success"`).
 * @param status - HTTP status code (default `200`).
 * @returns Object with `body` and `status` ready for `NextResponse.json()`.
 */
export function apiSuccess<T>(
  data: T,
  message = "Success",
  status = 200
): { body: ApiResponse<T>; status: number } {
  return { body: { success: true, message, data }, status };
}

/**
 * Build an error API response envelope.
 */
export function apiError(
  message: string,
  status: number,
  errorCode?: string,
  errorDetail?: string
): { body: ApiResponse; status: number } {
  return {
    body: { success: false, message, errorCode, errorDetail },
    status,
  };
}

/**
 * Recursively convert BigInt / Prisma Decimal values to JSON-safe strings.
 */
export function serializeDecimal(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === "bigint") return value.toString();
  if (
    typeof value === "object" &&
    "toFixed" in (value as object) &&
    typeof (value as { toFixed: unknown }).toFixed === "function"
  ) {
    return (value as { toString: () => string }).toString();
  }
  if (Array.isArray(value)) return value.map(serializeDecimal);
  if (typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      result[k] = serializeDecimal(v);
    }
    return result;
  }
  return value;
}

/** Format a number as Indian Rupees (INR). */
export function formatINR(amount: number | string): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount));
}

/** Capitalize first letter of a string. */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/** Convert `SNAKE_CASE` to `Title Case` for display. */
export function toTitleCase(str: string): string {
  return str
    .split("_")
    .map((w) => capitalize(w))
    .join(" ");
}

/** Response-type helper for API route handlers. */
export type ApiHandler = (
  ...args: Parameters<typeof NextResponse.json>
) => ReturnType<typeof NextResponse.json>;
