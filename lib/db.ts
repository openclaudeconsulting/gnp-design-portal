/**
 * Prisma client singleton for Next.js.
 *
 * Without this, hot-reload in dev creates a new PrismaClient per request and
 * exhausts the DB connection pool. The global cache fixes it.
 *
 * See: https://www.prisma.io/docs/guides/nextjs
 */

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
