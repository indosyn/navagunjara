/**
 * Auth.js (NextAuth v5) configuration — credentials provider with
 * JWT strategy. Checks admin table then customer table.
 *
 * This is the full auth config with DB access — NOT safe for Edge Runtime.
 * For middleware, use lib/auth.config.ts instead.
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
import { authConfig } from "@/lib/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
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
});
