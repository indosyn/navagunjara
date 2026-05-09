/**
 * Clothing search endpoint.
 *
 * @route GET /api/v1/clothing/search?type=&gender=&name=
 * @access Public
 *
 * @author Anurag Muthyam
 * @organization indosyn
 */

import { NextRequest, NextResponse } from "next/server";
import { clothingService } from "@/services/clothing.service";
import { createLogger } from "@/lib/logger";

const log = createLogger("api.clothing.search");

/** @author Anurag Muthyam */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? undefined;
  const gender = searchParams.get("gender") ?? undefined;
  const name = searchParams.get("name") ?? undefined;
  const page = Math.max(0, Number(searchParams.get("page") ?? 0));
  const size = Math.min(100, Math.max(1, Number(searchParams.get("size") ?? 10)));

  log.debug({ type, gender, name, page, size }, "GET /clothing/search");
  const result = await clothingService.search({ type, gender, name }, page, size);
  return NextResponse.json(
    { success: true, message: "Success", data: result },
    { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" } }
  );
}
