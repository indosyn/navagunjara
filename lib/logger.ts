/**
 * Centralized Pino logger for the Navagunjara e-commerce platform.
 *
 * Pino is chosen over Winston for production-scale traffic because it is
 * ~5× faster (ndjson serialization, no synchronous formatting) and has a
 * smaller memory footprint under high concurrency.
 *
 * - **Production**: structured JSON (ndjson) at `info` level — ready for
 *   ELK / CloudWatch / Datadog ingestion.
 * - **Development**: colorized, human-readable output via `pino-pretty`.
 *
 * Usage:
 * ```ts
 * import { createLogger } from "@/lib/logger";
 * const log = createLogger("order.service");
 * log.info({ orderId: "123", total: 4500 }, "Order placed");
 * ```
 *
 * @module lib/logger
 * @author Anurag Muthyam
 * @organization indosyn
 */

import pino from "pino";

/** Whether the runtime is a production build. */
const isProd = process.env.NODE_ENV === "production";

/**
 * Base Pino configuration shared by every child logger.
 *
 * @remarks
 * `pino-pretty` is loaded only in dev via the `transport` option so the
 * production bundle never pays for its weight.
 */
const baseConfig: pino.LoggerOptions = {
  level: process.env.LOG_LEVEL ?? (isProd ? "info" : "debug"),
  timestamp: pino.stdTimeFunctions.isoTime,
  ...(isProd
    ? {}
    : {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "HH:MM:ss.l",
            ignore: "pid,hostname",
          },
        },
      }),
};

/** Root Pino instance — all child loggers derive from this. */
const rootLogger = pino(baseConfig);

/**
 * Create a child logger scoped to a specific module or service.
 *
 * Each child logger carries a `module` field so every log line is
 * instantly traceable to the originating file.
 *
 * @param module - Logical module name, e.g. `"jewelry.service"`, `"api.orders"`.
 * @returns A Pino child logger with the `module` label attached.
 *
 * @example
 * ```ts
 * const log = createLogger("customer.service");
 * log.info({ email: "u@example.com" }, "Customer registered");
 * log.error({ err }, "Registration failed");
 * ```
 */
export function createLogger(module: string): pino.Logger {
  return rootLogger.child({ module });
}

/**
 * Root application logger — use for one-off or cross-cutting log statements
 * that don't belong to a specific module.
 */
export const logger = createLogger("navagunjara");

/**
 * Lightweight client-side logger for browser environments.
 *
 * Maps to `console.*` methods so it works universally and can be replaced
 * with a remote logging service (e.g. Sentry, LogRocket) later.
 *
 * @param module - UI module name, e.g. `"CartDrawer"`, `"useCart"`.
 * @returns An object with `debug`, `info`, `warn`, and `error` methods.
 *
 * @example
 * ```ts
 * const log = clientLogger("ProductCard");
 * log.info("Added to cart", { productId: "42" });
 * ```
 */
export function clientLogger(module: string) {
  const prefix = `[${module}]`;
  return {
    debug: (msg: string, meta?: Record<string, unknown>) =>
      process.env.NODE_ENV !== "production" && console.debug(prefix, msg, meta ?? ""),
    info: (msg: string, meta?: Record<string, unknown>) =>
      console.info(prefix, msg, meta ?? ""),
    warn: (msg: string, meta?: Record<string, unknown>) =>
      console.warn(prefix, msg, meta ?? ""),
    error: (msg: string, meta?: Record<string, unknown>) =>
      console.error(prefix, msg, meta ?? ""),
  };
}
