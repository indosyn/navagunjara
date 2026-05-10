/**
 * Auth.js configuration — Edge-safe subset (no Prisma / DB imports).
 *
 * This file is imported by middleware.ts which runs on the Edge Runtime.
 * The full auth config with database access lives in lib/auth.ts.
 *
 * @module lib/auth.config
 * @author Anurag Muthyam
 * @organization indosyn
 */

import type { NextAuthConfig } from "next-auth";
import type { UserRole } from "@/types";

declare module "next-auth" {
  interface User {
    id: string;
    role: UserRole;
    firstName: string;
    lastName: string;
  }
  interface Session {
    user: {
      id: string;
      email: string;
      role: UserRole;
      firstName: string;
      lastName: string;
    };
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    firstName: string;
    lastName: string;
  }
}

/**
 * Edge-safe auth config — callbacks, pages, and session settings.
 * No providers here (they need DB access).
 */
export const authConfig = {
  providers: [], // providers are added in lib/auth.ts
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as UserRole;
      session.user.firstName = token.firstName as string;
      session.user.lastName = token.lastName as string;
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const pathname = nextUrl.pathname;
      const session = auth;

      // Protect admin routes
      if (pathname.startsWith("/admin")) {
        if (!session) return false;
        if (session.user.role !== "ADMIN") return false;
      }

      // Protect account routes
      if (pathname.startsWith("/account")) {
        if (!session) return false;
      }

      return true;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
} satisfies NextAuthConfig;
