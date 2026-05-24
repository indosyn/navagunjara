/**
 * Health-check endpoints.
 *
 * Exposes both a shallow liveness probe and a deep readiness probe:
 *
 *   GET /api/health             → 200/UP. Process is alive (Kubernetes liveness).
 *   GET /api/health?probe=ready → 200 only if every critical dependency answers.
 *                                 503 with details otherwise. Use this for the
 *                                 load-balancer readiness probe.
 *
 * Currently checked dependencies:
 *   • PostgreSQL — `SELECT 1` via Prisma.
 *
 * @route GET /api/health
 * @author Anurag Muthyam
 * @organization indosyn
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createLogger } from "@/lib/logger";

const log = createLogger("api.health");

// Cap each dependency probe so a hung dependency cannot stall the probe.
const PROBE_TIMEOUT_MS = 2_000;

interface ProbeResult {
  name: string;
  status: "UP" | "DOWN";
  latencyMs: number;
  error?: string;
}

async function withTimeout<T>(
  p: Promise<T>,
  ms: number,
  label: string
): Promise<T> {
  let t: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    t = setTimeout(
      () => reject(new Error(`${label} timed out after ${ms}ms`)),
      ms
    );
  });
  try {
    return await Promise.race([p, timeout]);
  } finally {
    if (t) clearTimeout(t);
  }
}

async function checkDatabase(): Promise<ProbeResult> {
  const started = Date.now();
  try {
    await withTimeout(db.$queryRaw`SELECT 1`, PROBE_TIMEOUT_MS, "db");
    return { name: "database", status: "UP", latencyMs: Date.now() - started };
  } catch (e) {
    return {
      name: "database",
      status: "DOWN",
      latencyMs: Date.now() - started,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

export async function GET(req: NextRequest) {
  const probe = req.nextUrl.searchParams.get("probe");

  // Liveness: trivial 200 — process is up. Used by orchestrator restart logic.
  if (probe !== "ready") {
    return NextResponse.json(
      { success: true, message: "OK", data: { status: "UP" } },
      { status: 200 }
    );
  }

  // Readiness: every dependency must be UP for traffic to be routed here.
  const checks = await Promise.all([checkDatabase()]);
  const allUp = checks.every((c) => c.status === "UP");
  const httpStatus = allUp ? 200 : 503;

  if (!allUp) {
    log.warn({ checks }, "Readiness probe failed");
  }

  return NextResponse.json(
    {
      success: allUp,
      message: allUp ? "READY" : "NOT_READY",
      data: { status: allUp ? "UP" : "DOWN", checks },
    },
    { status: httpStatus }
  );
}
