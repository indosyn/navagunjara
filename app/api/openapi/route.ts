/**
 * OpenAPI specification endpoint.
 * Serves the OpenAPI 3.0 spec as JSON.
 *
 * @module app/api/openapi/route
 * @author Anurag Muthyam
 * @organization indosyn
 */

import { NextResponse } from "next/server";
import { openApiSpec } from "@/lib/openapi";

/**
 * GET /api/openapi
 * Returns the OpenAPI 3.0 specification as JSON.
 */
export async function GET() {
  return NextResponse.json(openApiSpec);
}
