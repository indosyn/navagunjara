/**
 * Hybrid session resolver for API routes.
 *
 * Resolves the caller's identity from either:
 *   1. NextAuth cookie session (browser clients), or
 *   2. `Authorization: Bearer <jwt>` header issued by
 *      `POST /api/v1/auth/login` (Postman / external clients).
 *
 * Returns a shape compatible with `auth()` so existing call sites
 * can swap `await auth()` for `await getApiSession(req)`.
 *
 * @module lib/api-auth
 * @author Anurag Muthyam
 * @organization indosyn
 */

import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { auth } from "@/lib/auth";
import { env } from "@/lib/env";
import { db } from "@/lib/db";
import type { UserRole } from "@/types";

const JWT_SECRET = new TextEncoder().encode(env.NEXTAUTH_SECRET);

// Cache tokenVersion lookups for a short TTL so we don't hit Postgres on
// every authenticated request. A stale read is acceptable because the worst
// case is a few extra seconds of validity for a rotated/invalidated session.
const TV_CACHE_TTL_MS = 60_000;
const tvCache = new Map<string, { tv: number; expires: number }>();

/**
 * Drop the cached tokenVersion for `(role, id)`. Call this whenever the
 * underlying value changes (login, password rotation, forced logout) so the
 * next authenticated request observes the fresh value instead of a stale
 * cache hit that could let revoked tokens through for up to TV_CACHE_TTL_MS.
 */
export function invalidateTokenVersionCache(role: UserRole, id: string | bigint): void {
  tvCache.delete(`${role}:${String(id)}`);
}

async function loadCurrentTokenVersion(
  role: UserRole,
  id: string
): Promise<number | null> {
  const cacheKey = `${role}:${id}`;
  const now = Date.now();
  const hit = tvCache.get(cacheKey);
  if (hit && hit.expires > now) return hit.tv;

  let bigId: bigint;
  try {
    bigId = BigInt(id);
  } catch {
    return null;
  }

  try {
    if (role === "ADMIN") {
      const row = await db.admin.findUnique({
        where: { id: bigId },
        select: { tokenVersion: true },
      });
      if (!row) return null;
      tvCache.set(cacheKey, { tv: row.tokenVersion, expires: now + TV_CACHE_TTL_MS });
      return row.tokenVersion;
    }
    const row = await db.customer.findUnique({
      where: { id: bigId },
      select: { tokenVersion: true, status: true },
    });
    if (!row || row.status !== "ACTIVE") return null;
    tvCache.set(cacheKey, { tv: row.tokenVersion, expires: now + TV_CACHE_TTL_MS });
    return row.tokenVersion;
  } catch {
    // DB unavailable: fail closed for safety on token-version checks.
    return null;
  }
}

export interface ApiSession {
  user: {
    id: string;
    email: string;
    role: UserRole;
  };
}

/**
 * Resolve the session for an API request. Tries NextAuth session first,
 * then falls back to verifying the `Authorization: Bearer` JWT.
 *
 * @param req - Optional NextRequest (required to read Bearer header).
 * @returns ApiSession or null if neither auth source is valid.
 */
export async function getApiSession(
  req?: NextRequest
): Promise<ApiSession | null> {
  // 1) Cookie-based NextAuth session (browser/UI clients)
  const session = await auth();
  if (session?.user) {
    return {
      user: {
        id: String(session.user.id),
        email: String(session.user.email ?? ""),
        role: (session.user.role ?? "USER") as UserRole,
      },
    };
  }

  // 2) Bearer JWT (Postman / external API clients)
  const header = req?.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match) return null;

  try {
    const { payload } = await jwtVerify(match[1], JWT_SECRET);
    if (!payload?.id || !payload?.email) return null;
    const role = (payload.role as UserRole) ?? "USER";
    const id = String(payload.id);

    // Enforce tokenVersion: bumped on password change / forced logout. If
    // the token's tv claim is missing or doesn't match the current DB
    // value, treat as invalid so legacy or revoked sessions are rejected.
    const currentTv = await loadCurrentTokenVersion(role, id);
    if (currentTv === null) return null;
    const tokenTv = typeof payload.tv === "number" ? payload.tv : -1;
    if (tokenTv !== currentTv) return null;

    return {
      user: {
        id,
        email: String(payload.email),
        role,
      },
    };
  } catch {
    return null;
  }
}
