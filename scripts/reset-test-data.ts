/**
 * Reset test data for repeatable Postman/Newman runs.
 *
 * What it does (idempotent, safe to run any number of times):
 *
 *   1. Deletes all Payment, OrderItem, and Order rows.
 *   2. Deletes WishlistItem and Review rows.
 *   3. Deletes any Customer whose email looks like a test fixture
 *      (matches `test+*`, `newman+*`, `nm+*`, or `deleted+*@navagunjara.invalid`).
 *      The canonical seed customer (`priya@example.com`) is preserved.
 *   4. Restores `stockQuantity >= MIN_TEST_STOCK` for every product so that
 *      newman runs that create orders never exhaust inventory.
 *
 * Designed for local + CI test loops. Do NOT run against production.
 *
 * Usage:
 *   npx tsx scripts/reset-test-data.ts
 *
 * @author Anurag Muthyam
 * @organization indosyn
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const MIN_TEST_STOCK = 50;
const TEST_EMAIL_PREFIXES = ["test+", "newman+", "nm+", "qa+", "postman+"];
const SOFT_DELETED_DOMAIN_SUFFIX = "@navagunjara.invalid";

function refuseIfProduction(): void {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "reset-test-data.ts refuses to run with NODE_ENV=production"
    );
  }
  const url = process.env.DATABASE_URL ?? "";
  if (/prod|production/i.test(url)) {
    throw new Error(
      "reset-test-data.ts refuses to run against a DATABASE_URL that looks like production"
    );
  }
}

async function main(): Promise<void> {
  refuseIfProduction();

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  console.log("Resetting test data...");

  // Order matters — child tables before parents.
  const payments = await prisma.payment.deleteMany({});
  const orderItems = await prisma.orderItem.deleteMany({});
  const orders = await prisma.order.deleteMany({});
  const wishlists = await prisma.wishlistItem.deleteMany({});
  const reviews = await prisma.review.deleteMany({});

  console.log(
    `  deleted payments=${payments.count} order_items=${orderItems.count} orders=${orders.count} wishlists=${wishlists.count} reviews=${reviews.count}`
  );

  // Test-fixture customers. Build OR clause for each pattern.
  const customerWhere = {
    OR: [
      ...TEST_EMAIL_PREFIXES.map((p) => ({
        email: { startsWith: p },
      })),
      { email: { endsWith: SOFT_DELETED_DOMAIN_SUFFIX } },
    ],
  };
  const customers = await prisma.customer.deleteMany({ where: customerWhere });
  console.log(`  deleted test customers=${customers.count}`);

  // Restore stock floor on every product. Update only those below the floor so
  // we don't accidentally clamp products that legitimately have more in stock.
  const lowStock = await prisma.product.findMany({
    where: { stockQuantity: { lt: MIN_TEST_STOCK } },
    select: { id: true },
  });
  if (lowStock.length > 0) {
    const restored = await prisma.product.updateMany({
      where: { id: { in: lowStock.map((p) => p.id) } },
      data: { stockQuantity: MIN_TEST_STOCK },
    });
    console.log(
      `  restored stockQuantity to ${MIN_TEST_STOCK} on ${restored.count} products`
    );
  } else {
    console.log(`  all products already have stockQuantity >= ${MIN_TEST_STOCK}`);
  }

  await prisma.$disconnect();
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
