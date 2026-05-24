/**
 * Validated, typed access to `process.env`.
 *
 * Why: scattered `process.env.X ?? "dev-default"` patterns silently ship insecure
 * fallbacks (e.g. `NEXTAUTH_SECRET="dev-secret"`) to production. This module
 * parses environment variables once at boot with a Zod schema and fails fast
 * when a production deployment is missing a critical secret.
 *
 * In `development` / `test` we permit dev-only defaults so local workflows
 * (jest, newman, `npm run dev`) keep working without a populated `.env`.
 *
 * Usage:
 *   import { env } from "@/lib/env";
 *   const secret = env.NEXTAUTH_SECRET;
 *
 * Never read `process.env` directly in new code outside of this module.
 *
 * @module lib/env
 * @author Anurag Muthyam
 * @organization indosyn
 */

import { z } from "zod";

const isProd = process.env.NODE_ENV === "production";

/**
 * Required-in-prod, optional-in-dev string. Falls back to `devDefault` outside
 * production and logs a single warning so the operator notices.
 *
 * @param devDefault - value used outside production when env var is absent
 * @param minLength - optional minimum length enforced in production
 */
function prodRequired(devDefault: string, minLength = 1) {
  return z
    .string()
    .optional()
    .transform((v, ctx) => {
      // In production: enforce both presence AND minimum length.
      if (isProd) {
        if (!v || v.length < minLength) {
          ctx.addIssue({
            code: "custom",
            message:
              minLength > 1
                ? `required in production (min ${minLength} chars)`
                : "required in production",
          });
          return z.NEVER;
        }
        return v;
      }
      // In dev/test: accept any non-empty value, otherwise fall back to default.
      if (v && v.length > 0) return v;
      return devDefault;
    });
}

const schema = z.object({
  // Runtime
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  // Database
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required"),

  // Auth — production secret must be at least 32 random bytes (base64).
  // Generate with: `openssl rand -base64 32`.
  NEXTAUTH_SECRET: prodRequired("dev-secret-do-not-use-in-prod-min-32-chars!", 32),
  NEXTAUTH_URL: z.string().url().optional(),

  // Rate-limit backend (multi-instance safe). When BOTH are present, the
  // limiter uses Upstash REST; otherwise it falls back to in-memory.
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),

  // Razorpay (payments)
  RAZORPAY_KEY_ID: prodRequired("rzp_test_dev_placeholder"),
  RAZORPAY_KEY_SECRET: prodRequired("rzp_test_secret_dev_placeholder"),
  RAZORPAY_WEBHOOK_SECRET: prodRequired("rzp_webhook_secret_dev_placeholder"),
  NEXT_PUBLIC_RAZORPAY_KEY_ID: z.string().optional(),

  // Cloudinary (image upload)
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  // Email (Resend)
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z
    .string()
    .email()
    .default("orders@navagunjara.com"),

  // Public site
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),

  // Observability
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .optional(),

  // Seed credentials (only used by prisma/seed.ts).
  // Defaults are intentionally weak and ONLY available in non-production —
  // production seeding requires explicit env vars to avoid shipping known
  // credentials. See `prisma/seed.ts` which validates these.
  SEED_ADMIN_EMAIL: z.string().email().default("admin@navagunjara.com"),
  SEED_ADMIN_PASSWORD: prodRequired("Admin@123-dev-only", 12),
  SEED_CUSTOMER_EMAIL: z.string().email().default("priya@example.com"),
  SEED_CUSTOMER_PASSWORD: prodRequired("Customer@123-dev-only", 12),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
    .join("\n");
  console.error(
    `\n[env] Invalid or missing environment variables:\n${issues}\n`
  );
  if (isProd) {
    throw new Error("Refusing to start: environment validation failed");
  }
}

export const env = (parsed.success ? parsed.data : process.env) as z.infer<
  typeof schema
>;

/**
 * Emit one-shot warnings at module load for dev-only fallbacks the operator
 * should know about. Kept tiny so it never grows into application logging.
 */
if (!isProd) {
  const dangerousDefaults: string[] = [];
  if (env.NEXTAUTH_SECRET === "dev-secret-do-not-use-in-prod-min-32-chars!") {
    dangerousDefaults.push("NEXTAUTH_SECRET");
  }
  if (env.RAZORPAY_KEY_SECRET === "rzp_test_secret_dev_placeholder") {
    dangerousDefaults.push("RAZORPAY_KEY_SECRET");
  }
  if (dangerousDefaults.length > 0 && process.env.NODE_ENV !== "test") {
    console.warn(
      `[env] Using insecure dev defaults for: ${dangerousDefaults.join(
        ", "
      )} — populate .env.local before any non-local use.`
    );
  }
}
