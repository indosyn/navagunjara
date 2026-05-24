/**
 * Rate limiter with pluggable backend.
 *
 * Backends:
 * - **memory** (default): sliding-window `Map<key, timestamps>`. Per-process
 *   only — fine for single-instance dev or Docker. Will NOT correctly limit
 *   across multiple replicas / serverless functions.
 * - **upstash**: fixed-window counter via Upstash Redis REST API. Auto-selected
 *   when `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set.
 *   Safe for multi-instance / Vercel / serverless deployments.
 *
 * The exported API is async to accommodate Redis. Call sites must `await`.
 *
 * @module lib/rate-limit
 * @author Anurag Muthyam
 * @organization indosyn
 */

import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetMs: number;
}

interface RateLimitBackend {
  hit(key: string, limit: number, windowMs: number): Promise<RateLimitResult>;
}

// ────────────────────────────────────────────────────────────────────────────
// In-memory sliding-window backend (default)
// ────────────────────────────────────────────────────────────────────────────

interface MemoryEntry {
  timestamps: number[];
}

const memoryStore = new Map<string, MemoryEntry>();
const MEMORY_CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastMemoryCleanup = Date.now();

function memoryCleanup(windowMs: number) {
  const now = Date.now();
  if (now - lastMemoryCleanup < MEMORY_CLEANUP_INTERVAL_MS) return;
  lastMemoryCleanup = now;
  const cutoff = now - windowMs;
  for (const [key, entry] of memoryStore) {
    entry.timestamps = entry.timestamps.filter((t) => t > cutoff);
    if (entry.timestamps.length === 0) memoryStore.delete(key);
  }
}

const memoryBackend: RateLimitBackend = {
  async hit(key, limit, windowMs) {
    memoryCleanup(windowMs);

    const now = Date.now();
    const cutoff = now - windowMs;
    let entry = memoryStore.get(key);

    if (!entry) {
      entry = { timestamps: [] };
      memoryStore.set(key, entry);
    }

    entry.timestamps = entry.timestamps.filter((t) => t > cutoff);

    if (entry.timestamps.length >= limit) {
      const oldest = entry.timestamps[0]!;
      return {
        allowed: false,
        remaining: 0,
        resetMs: oldest + windowMs - now,
      };
    }

    entry.timestamps.push(now);
    return {
      allowed: true,
      remaining: limit - entry.timestamps.length,
      resetMs: windowMs,
    };
  },
};

// ────────────────────────────────────────────────────────────────────────────
// Upstash Redis REST backend (fixed window)
// ────────────────────────────────────────────────────────────────────────────

function makeUpstashBackend(url: string, token: string): RateLimitBackend {
  return {
    async hit(key, limit, windowMs) {
      const windowSec = Math.max(1, Math.ceil(windowMs / 1000));
      const bucket = Math.floor(Date.now() / windowMs);
      const rkey = `rl:${key}:${bucket}`;

      // Pipeline: INCR + EXPIRE — single round-trip.
      const res = await fetch(`${url}/pipeline`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([
          ["INCR", rkey],
          ["EXPIRE", rkey, String(windowSec)],
        ]),
      });

      if (!res.ok) {
        // Fail open — never block legitimate traffic on a Redis blip — but
        // log so on-call notices. Memory backend cannot help here because
        // serverless instances don't share state.
        console.error(
          `[rate-limit] upstash error ${res.status}; failing open`
        );
        return { allowed: true, remaining: limit, resetMs: windowMs };
      }

      const data = (await res.json()) as Array<{ result: number | string }>;
      const count = Number(data[0]?.result ?? 0);
      const remaining = Math.max(0, limit - count);
      const resetMs = (bucket + 1) * windowMs - Date.now();

      if (count > limit) {
        return { allowed: false, remaining: 0, resetMs };
      }
      return { allowed: true, remaining, resetMs };
    },
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Backend selection — done once at module init
// ────────────────────────────────────────────────────────────────────────────

const backend: RateLimitBackend = (() => {
  const url = env.UPSTASH_REDIS_REST_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    if (env.NODE_ENV !== "test") {
      console.info("[rate-limit] using Upstash Redis backend");
    }
    return makeUpstashBackend(url, token);
  }
  if (env.NODE_ENV === "production") {
    console.warn(
      "[rate-limit] WARNING: using in-memory backend in production. " +
        "Set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN for multi-instance safety."
    );
  }
  return memoryBackend;
})();

/**
 * Check if a request should be rate-limited.
 *
 * @param key - Unique identifier (usually IP address)
 * @param limit - Max number of requests allowed in the window
 * @param windowMs - Time window in milliseconds (default 60 000 = 1 minute)
 * @returns `{ allowed, remaining, resetMs }`.
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number = 60_000
): Promise<RateLimitResult> {
  return backend.hit(key, limit, windowMs);
}

/**
 * Returns the best-effort client IP for rate-limit bucketing. Falls back to
 * "unknown" so the limiter still works behind misconfigured proxies (worst
 * case: one shared bucket per pod, which still throttles attackers).
 */
export function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

/**
 * Convenience wrapper for route handlers: returns a `NextResponse` 429 if the
 * caller is over the limit, or `null` if the request may proceed.
 *
 *   const block = enforceRateLimit(req, "orders.create", 30, 60_000);
 *   if (block) return block;
 *
 * Limits are relaxed by ~10x outside production so jest/newman runs don't
 * trip them; tune by passing explicit numbers for prod-sensitive routes.
 */
export async function enforceRateLimit(
  req: NextRequest,
  scope: string,
  limit: number,
  windowMs: number = 60_000
): Promise<NextResponse | null> {
  const effectiveLimit = env.NODE_ENV === "production" ? limit : limit * 10;
  const ip = clientIp(req);
  const key = `${scope}:${ip}`;
  const { allowed, remaining, resetMs } = await rateLimit(key, effectiveLimit, windowMs);
  if (allowed) return null;
  return NextResponse.json(
    {
      success: false,
      message: "Too many requests. Try again later.",
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(Math.ceil(resetMs / 1000)),
        "X-RateLimit-Limit": String(effectiveLimit),
        "X-RateLimit-Remaining": String(remaining),
      },
    }
  );
}
