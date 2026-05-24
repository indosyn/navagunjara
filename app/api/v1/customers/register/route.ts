/**
 * Customer registration and listing routes.
 *
 * - `POST /api/v1/customers/register` — public registration.
 * - `GET  /api/v1/customers/register` — admin-only paginated list.
 *
 * @module api/v1/customers/register
 * @author Anurag Muthyam
 * @organization indosyn
 */

import { NextRequest, NextResponse } from "next/server";
import { registerCustomerSchema } from "@/lib/validations";
import { customerService } from "@/services/customer.service";
import { getApiSession } from "@/lib/api-auth";
import { createLogger } from "@/lib/logger";
import { rateLimit } from "@/lib/rate-limit";

const log = createLogger("api.customers.register");

// 5 registration attempts per minute per IP
const REGISTER_RATE_LIMIT = 5;
const REGISTER_WINDOW_MS = 60_000;

/**
 * Register a new customer account.
 *
 * @param req - Incoming request with registration JSON body.
 * @returns 201 with customer profile on success.
 */
export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const { allowed, resetMs } = await rateLimit(`register:${ip}`, REGISTER_RATE_LIMIT, REGISTER_WINDOW_MS);
    if (!allowed) {
      log.warn({ ip }, "Registration rate limit exceeded");
      return NextResponse.json(
        { success: false, message: "Too many registration attempts. Try again later." },
        { status: 429, headers: { "Retry-After": String(Math.ceil(resetMs / 1000)) } }
      );
    }

    const body = await req.json();
    const parsed = registerCustomerSchema.safeParse(body);
    if (!parsed.success) {
      log.warn("Validation failed on registration");
      return NextResponse.json(
        { success: false, message: "Validation failed", errorDetail: parsed.error.flatten() },
        { status: 400 }
      );
    }
    log.info({ email: parsed.data.email }, "Registering customer");
    const customer = await customerService.register(parsed.data);
    log.info({ email: parsed.data.email }, "Customer registered");
    return NextResponse.json(
      { success: true, message: "Customer registered successfully", data: customer },
      { status: 201 }
    );
  } catch (e) {
    if (e instanceof Error && e.message === "DUPLICATE_EMAIL") {
      log.warn("Duplicate email on registration");
      return NextResponse.json(
        { success: false, message: "Email already registered", errorCode: "DUPLICATE_EMAIL" },
        { status: 409 }
      );
    }
    log.error({ err: e }, "Registration error");
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * List all customers (admin only, paginated).
 *
 * @param req - Incoming request with `page` and `size` query params.
 * @returns Paginated customer list.
 */
export async function GET(req: NextRequest) {
  const session = await getApiSession(req);
  if (!session) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(0, Number(searchParams.get("page") ?? 0));
  const size = Math.min(100, Math.max(1, Number(searchParams.get("size") ?? 20)));

  log.debug({ page, size }, "Admin listing customers");
  const result = await customerService.list(page, size);
  return NextResponse.json({ success: true, message: "Success", data: result });
}
