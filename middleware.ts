/**
 * Edge middleware — auth guards for `/admin/*` and `/account/*` routes.
 *
 * @module middleware
 * @author Anurag Muthyam
 * @organization indosyn
 */

import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // Protect admin routes — must be authenticated with ADMIN role
  if (pathname.startsWith("/admin")) {
    if (!session) {
      return NextResponse.redirect(new URL("/login?callbackUrl=/admin", req.url));
    }
    if (session.user.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // Protect account routes — must be authenticated
  if (pathname.startsWith("/account")) {
    if (!session) {
      return NextResponse.redirect(
        new URL(`/login?callbackUrl=${pathname}`, req.url)
      );
    }
  }
});

export const config = {
  matcher: ["/admin/:path*", "/account/:path*"],
};
