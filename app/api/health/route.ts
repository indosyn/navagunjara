/**
 * Health-check endpoint.
 *
 * @route GET /api/health
 * @returns `{ success: true, data: { status: "UP" } }`
 *
 * @author Anurag Muthyam
 * @organization indosyn
 */

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { success: true, message: "OK", data: { status: "UP" } },
    { status: 200 }
  );
}
