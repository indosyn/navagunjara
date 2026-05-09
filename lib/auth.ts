/**
 * Auth.js (NextAuth v5) configuration — credentials provider with
 * JWT strategy. Checks admin table then customer table.
 *
 * @module lib/auth
 * @author Anurag Muthyam
 * @organization indosyn
 */

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
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

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string;
        const password = credentials?.password as string;

        if (!email || !password) return null;

        // Check admins first
        const admin = await db.admin.findUnique({ where: { email } });
        if (admin) {
          const valid = await bcrypt.compare(password, admin.password);
          if (!valid) return null;
          return {
            id: admin.id.toString(),
            email: admin.email,
            role: "ADMIN" as UserRole,
            firstName: admin.firstName,
            lastName: admin.lastName,
          };
        }

        // Then check customers
        const customer = await db.customer.findUnique({ where: { email } });
        if (!customer) return null;

        const valid = await bcrypt.compare(password, customer.password);
        if (!valid) return null;

        return {
          id: customer.id.toString(),
          email: customer.email,
          role: "USER" as UserRole,
          firstName: customer.firstName,
          lastName: customer.lastName,
        };
      },
    }),
  ],
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
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
});
