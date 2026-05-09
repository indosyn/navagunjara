/**
 * Prisma singleton — prevents multiple PrismaClient instances during
 * hot-reload in development.
 *
 * @module lib/db
 * @author Anurag Muthyam
 * @organization indosyn
 */

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const db =
  globalForPrisma.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
