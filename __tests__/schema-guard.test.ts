/**
 * Schema & code guard rails for customer-data durability.
 *
 * These tests enforce two invariants that protect customer data from
 * accidental destruction:
 *
 *   1. No relation pointing at the `Customer` model uses `onDelete: Cascade`.
 *      A stray `DELETE FROM customers` must never silently destroy orders,
 *      reviews or wishlist rows.
 *   2. No application code calls `db.customer.delete*` / `prisma.customer.delete*`.
 *      Customer "deletion" must go through `customerService.deactivate` or
 *      `customerService.anonymize`, which preserve the row and its
 *      foreign-key relationships.
 *
 * Both rules are enforced at the schema level (`onDelete: Restrict`) as
 * well; these tests are belt-and-braces so a future PR can't quietly
 * regress the invariant.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = join(__dirname, "..");

function readAllTsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === ".next" || entry === "docs") continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      out.push(...readAllTsFiles(full));
    } else if (entry.endsWith(".ts") || entry.endsWith(".tsx")) {
      out.push(full);
    }
  }
  return out;
}

describe("customer data durability guard", () => {
  it("schema has no onDelete: Cascade on any Customer relation", () => {
    const schema = readFileSync(join(REPO_ROOT, "prisma", "schema.prisma"), "utf8");
    // Match any relation field whose type is `Customer` (optionally followed
    // by `[]` or `?`) and whose @relation(...) attribute contains
    // `onDelete: Cascade`. The pattern intentionally tolerates whitespace
    // and additional attributes between the type and the cascade clause.
    const badPattern = /\bCustomer(?:\[\]|\?)?\s+@relation\([^)]*onDelete:\s*Cascade/;
    expect(schema).not.toMatch(badPattern);
  });

  it("schema defines a CustomerStatus enum with ACTIVE / DEACTIVATED / ANONYMIZED", () => {
    const schema = readFileSync(join(REPO_ROOT, "prisma", "schema.prisma"), "utf8");
    expect(schema).toMatch(/enum\s+CustomerStatus\b/);
    // The enum body sits between the opening `{` after the name and the
    // next `}`. Extract it explicitly so we don't need the dotall flag.
    const match = schema.match(/enum\s+CustomerStatus\s*\{([^}]*)\}/);
    expect(match).not.toBeNull();
    const body = match![1];
    expect(body).toMatch(/\bACTIVE\b/);
    expect(body).toMatch(/\bDEACTIVATED\b/);
    expect(body).toMatch(/\bANONYMIZED\b/);
  });

  it("no application code performs db.customer.delete* / prisma.customer.delete*", () => {
    const scanDirs = ["app", "services", "lib", "components", "hooks", "middleware.ts"];
    const offenders: string[] = [];
    for (const rel of scanDirs) {
      const abs = join(REPO_ROOT, rel);
      try {
        statSync(abs);
      } catch {
        continue;
      }
      const files = statSync(abs).isDirectory() ? readAllTsFiles(abs) : [abs];
      for (const f of files) {
        // Strip block + line comments so doc-comments that *describe* the
        // forbidden pattern (e.g. in this file or in customer.service.ts)
        // are not flagged as offenders.
        const text = readFileSync(f, "utf8")
          .replace(/\/\*[\s\S]*?\*\//g, "")
          .replace(/(^|[^:])\/\/.*$/gm, "$1");
        if (/\b(?:db|prisma)\.customer\.delete(?:Many)?\b/.test(text)) {
          offenders.push(f);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
