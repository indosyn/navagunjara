import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Upsert default admin account
  const passwordHash = await bcrypt.hash("Admin@123", 12);
  const admin = await prisma.admin.upsert({
    where: { email: "admin@navagunjara.com" },
    update: {},
    create: {
      firstName: "Super",
      lastName: "Admin",
      email: "admin@navagunjara.com",
      password: passwordHash,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  console.log(`✅ Admin upserted: ${admin.email}`);
  console.log("✅ Seed complete.");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
