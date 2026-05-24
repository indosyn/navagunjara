/**
 * Edge proxy — auth guards for `/admin/*` and `/account/*` routes.
 *
 * Renamed from `middleware.ts` for Next.js 16 (`middleware` file convention
 * was deprecated in favour of `proxy`). The Proxy runtime is `nodejs`.
 *
 * Uses the Edge-safe auth config (no Prisma/DB imports) — kept compatible
 * with the previous setup so behaviour is unchanged.
 *
 * @module proxy
 * @author Anurag Muthyam
 * @organization indosyn
 */

import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

// Renaming the export name to `proxy` per Next 16 recommendation. The default
// export of `auth` would still work, but the docs encourage matching the
// convention name. We re-export as both default and named `proxy`.
export const proxy = auth;
export default auth;

export const config = {
  matcher: ["/admin/:path*", "/account/:path*"],
};
