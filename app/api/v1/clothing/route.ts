/**
 * Clothing listing and creation routes.
 *
 * @route GET  /api/v1/clothing — public, paginated
 * @route POST /api/v1/clothing — ADMIN only
 *
 * @author Anurag Muthyam
 * @organization indosyn
 */

import { NextRequest, NextResponse } from "next/server";
import { getApiSession } from "@/lib/api-auth";
import { createClothingSchema } from "@/lib/validations";
import { clothingService } from "@/services/clothing.service";
import { createLogger } from "@/lib/logger";

const log = createLogger("api.clothing");

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(0, Number(searchParams.get("page") ?? 0));
  const size = Math.min(100, Math.max(1, Number(searchParams.get("size") ?? 10)));

  log.debug({ page, size }, "GET /clothing");
  const result = await clothingService.list(page, size);
  return NextResponse.json(
    { success: true, message: "Success", data: result },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
  );
}

export async function POST(req: NextRequest) {
  const session = await getApiSession(req);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = createClothingSchema.safeParse(body);
    if (!parsed.success) {
      log.warn("Clothing creation validation failed");
      return NextResponse.json(
        { success: false, message: "Validation failed", errorDetail: parsed.error.flatten() },
        { status: 400 }
      );
    }
    log.info({ name: parsed.data.name }, "Creating clothing");
    const product = await clothingService.create(parsed.data);
    return NextResponse.json(
      { success: true, message: "Clothing created", data: product },
      { status: 201 }
    );
  } catch (e) {
    log.error({ err: e }, "Clothing creation error");
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
