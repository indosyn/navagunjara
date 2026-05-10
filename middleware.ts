/**
 * Edge middleware — auth guards for `/admin/*` and `/account/*` routes.
 *
 * Uses the Edge-safe auth config (no Prisma/DB imports).
 *
 * @module middleware
 * @author Anurag Muthyam
 * @organization indosyn
 */

import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

export default auth;

export const config = {
  matcher: ["/admin/:path*", "/account/:path*"],
};
