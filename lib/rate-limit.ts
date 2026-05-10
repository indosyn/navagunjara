/**
 * In-memory sliding-window rate limiter.
 *
 * Uses a Map of IP → timestamps. Suitable for single-instance deployments.
 * For multi-instance, swap with Redis-backed implementation.
 *
 * @module lib/rate-limit
 * @author Anurag Muthyam
 * @organization indosyn
 */

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

// Clean stale entries every 5 minutes
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  const cutoff = now - windowMs;
  for (const [key, entry] of store) {
    entry.timestamps = entry.timestamps.filter((t) => t > cutoff);
    if (entry.timestamps.length === 0) store.delete(key);
  }
}

/**
 * Check if a request should be rate-limited.
 *
 * @param key - Unique identifier (usually IP address)
 * @param limit - Max number of requests allowed in the window
 * @param windowMs - Time window in milliseconds (default 60 000 = 1 minute)
 * @returns `{ allowed, remaining, resetMs }` — whether the request is allowed,
 *          how many requests remain, and when the window resets.
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number = 60_000
): { allowed: boolean; remaining: number; resetMs: number } {
  cleanup(windowMs);

  const now = Date.now();
  const cutoff = now - windowMs;
  let entry = store.get(key);

  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  // Remove expired timestamps
  entry.timestamps = entry.timestamps.filter((t) => t > cutoff);

  if (entry.timestamps.length >= limit) {
    const oldest = entry.timestamps[0];
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
}
