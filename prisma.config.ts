import "dotenv/config";
import { defineConfig } from "prisma/config";

// On managed Postgres (Neon, Supabase) the pooled `DATABASE_URL` goes through
// PgBouncer and can't run DDL safely. `DIRECT_URL` is the unpooled connection
// used ONLY by `prisma migrate` / `prisma db push`. In local dev where there
// is no pooler, leave DIRECT_URL unset and we fall back to DATABASE_URL.
const directUrl = process.env["DIRECT_URL"] || process.env["DATABASE_URL"] || "";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: directUrl,
  },
});
