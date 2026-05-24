/**
 * Idempotency-Key replay protection for POST endpoints that create resources.
 *
 * Pattern: client sends `Idempotency-Key: <opaque>` on a mutating request.
 * The first request runs normally and the response (status + JSON body) is
 * persisted keyed by `(scope, key)`. Any later request with the same key from
 * the same authenticated actor returns the cached response unchanged, so
 * a network-level retry never creates a duplicate order/payment.
 *
 * Storage: `IdempotencyKey` table in PostgreSQL. Entries expire after `TTL_MS`
 * and are pruned lazily on read (cheap and avoids a cron dependency).
 *
 * Conflicts:
 *   - Same key + scope, different actor → 409 (key was issued to someone else).
 *   - Same key + scope + actor still in-flight → very rare race; we let both
 *     proceed; whichever finishes second loses the upsert and that response is
 *     returned to its own client. The first one's effects (order row) remain.
 *     If your downstream is non-idempotent, use a transactional advisory lock
 *     instead — out of scope for v1.
 *
 * Usage:
 *   const cached = await checkIdempotency(req, "orders.create", actorId);
 *   if (cached) return cached;          // replay → return original response
 *   const res   = NextResponse.json(...);
 *   await rememberIdempotency(req, "orders.create", actorId, res, body);
 *   return res;
 *
 * @module lib/idempotency
 * @author Anurag Muthyam
 * @organization indosyn
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createLogger } from "@/lib/logger";

const log = createLogger("lib.idempotency");

const HEADER = "idempotency-key";
const MAX_KEY_LENGTH = 255;
const TTL_MS = 24 * 60 * 60 * 1000; // 24h

/** Extract and validate the header; returns null if missing. */
export function readIdempotencyKey(req: NextRequest): string | null {
  const raw = req.headers.get(HEADER);
  if (!raw) return null;
  const trimmed = raw.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_KEY_LENGTH) return null;
  return trimmed;
}

/**
 * Look up a cached response. Returns a NextResponse to short-circuit the
 * handler, or null if the request is fresh. Returns a 409 response if the
 * same key was previously used by a different actor.
 */
export async function checkIdempotency(
  req: NextRequest,
  scope: string,
  actorId: string
): Promise<NextResponse | null> {
  const key = readIdempotencyKey(req);
  if (!key) return null;

  let row;
  try {
    row = await db.idempotencyKey.findUnique({
      where: { scope_key: { scope, key } },
    });
  } catch (e) {
    log.error({ err: e, scope }, "idempotency lookup failed");
    return null; // fail-open: better to risk a duplicate than to 500 here
  }

  if (!row) return null;

  // Expired → forget it and let the handler proceed.
  if (row.expiresAt.getTime() < Date.now()) {
    await db.idempotencyKey
      .delete({ where: { scope_key: { scope, key } } })
      .catch(() => undefined);
    return null;
  }

  if (row.actorId !== actorId) {
    log.warn({ scope, actorId, owner: row.actorId }, "idempotency key reused by different actor");
    return NextResponse.json(
      {
        success: false,
        message: "Idempotency-Key conflict: key belongs to a different actor",
      },
      { status: 409 }
    );
  }

  let body: unknown;
  try {
    body = JSON.parse(row.responseBody);
  } catch {
    body = { success: false, message: "Cached response unreadable" };
  }

  return NextResponse.json(body, {
    status: row.responseStatus,
    headers: { "x-idempotent-replay": "true" },
  });
}

/**
 * Persist the response so that a future replay with the same key returns it.
 * Silently no-ops if no header was supplied or on storage failure.
 */
export async function rememberIdempotency(
  req: NextRequest,
  scope: string,
  actorId: string,
  status: number,
  responseBody: unknown
): Promise<void> {
  const key = readIdempotencyKey(req);
  if (!key) return;

  const expiresAt = new Date(Date.now() + TTL_MS);
  try {
    await db.idempotencyKey.upsert({
      where: { scope_key: { scope, key } },
      create: {
        key,
        scope,
        actorId,
        responseStatus: status,
        responseBody: JSON.stringify(responseBody),
        expiresAt,
      },
      // Re-create on collision so the freshly completed response wins. The
      // earlier-completing request's persisted response is overwritten.
      update: {
        actorId,
        responseStatus: status,
        responseBody: JSON.stringify(responseBody),
        expiresAt,
      },
    });
  } catch (e) {
    log.error({ err: e, scope }, "idempotency persist failed");
  }
}
