/**
 * Helpers for unit-testing Next.js Route Handlers.
 *
 * @module __tests__/helpers/route
 * @author Anurag Muthyam
 * @organization indosyn
 */

import { NextRequest } from "next/server";

export interface RouteRequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  searchParams?: Record<string, string>;
}

/**
 * Build a NextRequest for a unit test. Always uses an absolute URL so
 * `req.nextUrl.searchParams` and `new URL(req.url)` both work.
 */
export function makeRequest(path: string, opts: RouteRequestOptions = {}): NextRequest {
  const url = new URL(path, "http://localhost:3000");
  for (const [k, v] of Object.entries(opts.searchParams ?? {})) {
    url.searchParams.set(k, v);
  }
  const init: Record<string, unknown> = {
    method: opts.method ?? "GET",
    headers: { "content-type": "application/json", ...(opts.headers ?? {}) },
  };
  if (opts.body !== undefined) {
    init.body = typeof opts.body === "string" ? opts.body : JSON.stringify(opts.body);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new NextRequest(url, init as any);
}

/** Wrap a value in the route-handler params Promise shape. */
export function paramsFor<T extends Record<string, string>>(p: T): { params: Promise<T> } {
  return { params: Promise.resolve(p) };
}
