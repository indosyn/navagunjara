import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...\n");

  // ── Admin ──────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash("Admin@123", 12);
  const admin = await prisma.admin.upsert({
    where: { email: "admin@navagunjara.com" },
    update: { password: passwordHash },
    create: {
      firstName: "Super",
      lastName: "Admin",
      email: "admin@navagunjara.com",
      password: passwordHash,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
  console.log(`✅ Admin: ${admin.email}`);

  // ── Demo Customer ──────────────────────────────────────────────────────
  const custPw = await bcrypt.hash("Customer@123", 12);
  const customer = await prisma.customer.upsert({
    where: { email: "priya@example.com" },
    update: {},
    create: {
      firstName: "Priya",
      lastName: "Sharma",
      email: "priya@example.com",
      phone: "+91-9876543210",
      password: custPw,
      addressLine1: "42 MG Road",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560001",
      country: "IND",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
  console.log(`✅ Customer: ${customer.email}`);

  // ── Jewelry Products ───────────────────────────────────────────────────
  const jewelryItems = [
    {
      name: "Royal Kundan Necklace Set",
      description: "Handcrafted Kundan necklace with intricate meenakari work on the reverse side. Includes matching earrings. Perfect for weddings and festive occasions.",
      price: 24999.0,
      stockQuantity: 8,
      imageUrl: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600",
      category: "NECKLACE",
      jewelleryType: "NECKLACE",
      material: "Gold-plated Copper",
      gemstone: "Kundan & Meenakari",
      weightGrams: 85.5,
      caratValue: null,
    },
    {
      name: "Diamond Solitaire Ring",
      description: "Elegant 0.5 carat diamond solitaire set in 18K white gold. GIA certified. Classic six-prong setting.",
      price: 89999.0,
      stockQuantity: 3,
      imageUrl: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600",
      category: "RING",
      jewelleryType: "RING",
      material: "18K White Gold",
      gemstone: "Diamond",
      weightGrams: 4.2,
      caratValue: 0.5,
    },
    {
      name: "Temple Gold Jhumka Earrings",
      description: "Traditional South Indian temple jewelry jhumka earrings with Lakshmi motif. Gold-plated with antique matte finish.",
      price: 3499.0,
      stockQuantity: 25,
      imageUrl: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600",
      category: "EARRING",
      jewelleryType: "EARRING",
      material: "Gold-plated Brass",
      gemstone: null,
      weightGrams: 22.0,
      caratValue: null,
    },
    {
      name: "Emerald Tennis Bracelet",
      description: "Stunning emerald and diamond tennis bracelet in 14K yellow gold. 15 natural emeralds totaling 3.5 carats.",
      price: 149999.0,
      stockQuantity: 2,
      imageUrl: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600",
      category: "BRACELET",
      jewelleryType: "BRACELET",
      material: "14K Yellow Gold",
      gemstone: "Emerald & Diamond",
      weightGrams: 18.7,
      caratValue: 3.5,
    },
    {
      name: "Pearl Choker Necklace",
      description: "Freshwater pearl choker with sterling silver clasp. Three-strand design with graduated pearls. Elegant and timeless.",
      price: 7999.0,
      stockQuantity: 12,
      imageUrl: "https://images.unsplash.com/photo-1515562141589-67f0d569b6c1?w=600",
      category: "NECKLACE",
      jewelleryType: "NECKLACE",
      material: "Sterling Silver",
      gemstone: "Freshwater Pearl",
      weightGrams: 45.0,
      caratValue: null,
    },
    {
      name: "Oxidized Silver Bangle Set",
      description: "Set of 6 oxidized silver bangles with tribal motifs. Handcrafted by artisans from Rajasthan. Adjustable size.",
      price: 1899.0,
      stockQuantity: 30,
      imageUrl: "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=600",
      category: "BANGLE",
      jewelleryType: "BANGLE",
      material: "Oxidized Silver",
      gemstone: null,
      weightGrams: 120.0,
      caratValue: null,
    },
    {
      name: "Ruby Pendant with Chain",
      description: "Natural Burmese ruby pendant (1.2 carat) set in 22K gold with delicate chain. Certificate of authenticity included.",
      price: 54999.0,
      stockQuantity: 4,
      imageUrl: "https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=600",
      category: "PENDANT",
      jewelleryType: "PENDANT",
      material: "22K Gold",
      gemstone: "Burmese Ruby",
      weightGrams: 8.3,
      caratValue: 1.2,
    },
    {
      name: "Silver Anklet Pair",
      description: "Traditional Indian silver anklets (payal) with ghungroo bells. Adjustable chain closure. Produces a melodic sound.",
      price: 2499.0,
      stockQuantity: 20,
      imageUrl: "https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=600",
      category: "ANKLET",
      jewelleryType: "ANKLET",
      material: "925 Sterling Silver",
      gemstone: null,
      weightGrams: 35.0,
      caratValue: null,
    },
  ];

  console.log("\n📿 Seeding jewelry...");
  for (const j of jewelryItems) {
    const product = await prisma.product.create({
      data: {
        productType: "JEWELRY",
        name: j.name,
        description: j.description,
        price: j.price,
        stockQuantity: j.stockQuantity,
        imageUrl: j.imageUrl,
        category: j.category,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        jewelry: {
          create: {
            jewelleryType: j.jewelleryType,
            material: j.material,
            gemstone: j.gemstone,
            weightGrams: j.weightGrams,
            caratValue: j.caratValue,
          },
        },
      },
    });
    console.log(`  💎 ${product.name} — ₹${product.price}`);
  }

  // ── Clothing Products ──────────────────────────────────────────────────
  const clothingItems = [
    {
      name: "Banarasi Silk Saree — Royal Blue",
      description: "Authentic Banarasi silk saree with gold zari work. Pure mulberry silk with intricate floral butta pattern. Includes matching blouse piece.",
      price: 18999.0,
      stockQuantity: 6,
      imageUrl: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600",
      category: "SAREE",
      clothingType: "SAREE",
      size: "FREE_SIZE",
      color: "Royal Blue",
      fabric: "Pure Silk",
      gender: "FEMALE",
    },
    {
      name: "Men's Lucknowi Chikan Kurta",
      description: "Hand-embroidered Lucknowi chikan kurta in soft cotton. Delicate shadow work with mukaish highlights. Perfect for festive occasions.",
      price: 3999.0,
      stockQuantity: 15,
      imageUrl: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600",
      category: "KURTA",
      clothingType: "KURTA",
      size: "L",
      color: "White",
      fabric: "Cotton",
      gender: "MALE",
    },
    {
      name: "Bridal Lehenga — Crimson Red",
      description: "Heavily embroidered bridal lehenga with dupatta and blouse. Velvet base with zardosi, sequin, and pearl work. Semi-stitched.",
      price: 45999.0,
      stockQuantity: 3,
      imageUrl: "https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=600",
      category: "LEHENGA",
      clothingType: "LEHENGA",
      size: "M",
      color: "Crimson Red",
      fabric: "Velvet & Net",
      gender: "FEMALE",
    },
    {
      name: "Chanderi Cotton Dupatta",
      description: "Lightweight Chanderi cotton dupatta with block-printed motifs in indigo. Handwoven with gold-silver zari border.",
      price: 1499.0,
      stockQuantity: 40,
      imageUrl: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=600",
      category: "DUPATTA",
      clothingType: "DUPATTA",
      size: "FREE_SIZE",
      color: "Indigo Blue",
      fabric: "Chanderi Cotton",
      gender: "FEMALE",
    },
    {
      name: "Designer Sherwani — Ivory Gold",
      description: "Premium designer sherwani with gold thread embroidery. Includes churidar and stole. Ideal for groom or wedding guests.",
      price: 24999.0,
      stockQuantity: 5,
      imageUrl: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600",
      category: "SHERWANI",
      clothingType: "SHERWANI",
      size: "XL",
      color: "Ivory Gold",
      fabric: "Jacquard Silk",
      gender: "MALE",
    },
    {
      name: "Anarkali Salwar Kameez — Emerald",
      description: "Floor-length Anarkali suit with heavy stone and mirror work. Georgette fabric with santoon lining. Includes dupatta.",
      price: 5999.0,
      stockQuantity: 10,
      imageUrl: "https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=600",
      category: "SALWAR_KAMEEZ",
      clothingType: "SALWAR_KAMEEZ",
      size: "S",
      color: "Emerald Green",
      fabric: "Georgette",
      gender: "FEMALE",
    },
    {
      name: "Silk Dhoti — Cream with Gold Border",
      description: "Traditional silk dhoti with rich gold zari border. Suitable for puja, weddings, and cultural ceremonies.",
      price: 2999.0,
      stockQuantity: 18,
      imageUrl: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600",
      category: "DHOTI",
      clothingType: "DHOTI",
      size: "FREE_SIZE",
      color: "Cream",
      fabric: "Pure Silk",
      gender: "MALE",
    },
    {
      name: "Cotton Kurti — Mustard Block Print",
      description: "Comfortable A-line cotton kurti with Jaipur block print. Three-quarter sleeves, mandarin collar. Machine washable.",
      price: 899.0,
      stockQuantity: 50,
      imageUrl: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=600",
      category: "KURTI",
      clothingType: "KURTI",
      size: "M",
      color: "Mustard Yellow",
      fabric: "Cotton",
      gender: "FEMALE",
    },
  ];

  console.log("\n👗 Seeding clothing...");
  for (const c of clothingItems) {
    const product = await prisma.product.create({
      data: {
        productType: "CLOTHING",
        name: c.name,
        description: c.description,
        price: c.price,
        stockQuantity: c.stockQuantity,
        imageUrl: c.imageUrl,
        category: c.category,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        clothing: {
          create: {
            clothingType: c.clothingType,
            size: c.size,
            color: c.color,
            fabric: c.fabric,
            gender: c.gender,
          },
        },
      },
    });
    console.log(`  👘 ${product.name} — ₹${product.price}`);
  }

  // ── Demo Order ─────────────────────────────────────────────────────────
  const firstProduct = await prisma.product.findFirst();
  if (firstProduct && customer) {
    const order = await prisma.order.create({
      data: {
        customerId: customer.id,
        status: "CONFIRMED",
        totalAmount: firstProduct.price,
        deliveryAddress: "42 MG Road",
        deliveryCity: "Bengaluru",
        deliveryState: "Karnataka",
        deliveryPincode: "560001",
        orderedAt: new Date(),
        updatedAt: new Date(),
        items: {
          create: {
            productId: firstProduct.id,
            quantity: 1,
            unitPrice: firstProduct.price,
            subtotal: firstProduct.price,
          },
        },
      },
    });
    console.log(`\n✅ Demo order #${order.id} created`);
  }

  console.log("\n🎉 Seed complete! 8 jewelry + 8 clothing + 1 customer + 1 order");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
