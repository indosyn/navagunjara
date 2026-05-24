/**
 * Zod validation schemas for all API request payloads.
 *
 * @module lib/validations
 * @author Anurag Muthyam
 * @organization indosyn
 */

import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

// Extend Zod with OpenAPI methods
extendZodWithOpenApi(z);

// ─── Auth ──────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email("Invalid email address").openapi({ example: "customer@navagunjara.com" }),
  password: z.string().min(1, "Password is required").openapi({ example: "password123" }),
}).openapi("LoginRequest");

export type LoginInput = z.infer<typeof loginSchema>;

// ─── Customer ─────────────────────────────────────────────────────────────────

// Strong password policy — 12+ chars, mix of upper/lower/digit/symbol.
// Used for new account creation and password rotation. Login still accepts
// any non-empty string so legacy/short passwords can still authenticate
// long enough for the user to change them.
const strongPassword = z
  .string()
  .min(12, "Password must be at least 12 characters")
  .regex(/[A-Z]/, "Password must contain an uppercase letter")
  .regex(/[a-z]/, "Password must contain a lowercase letter")
  .regex(/[0-9]/, "Password must contain a digit")
  .regex(/[^A-Za-z0-9]/, "Password must contain a symbol");

export const registerCustomerSchema = z.object({
  firstName: z.string().min(1, "First name is required").openapi({ example: "Priya" }),
  lastName: z.string().min(1, "Last name is required").openapi({ example: "Sharma" }),
  email: z.string().email("Invalid email address").openapi({ example: "priya.sharma@example.com" }),
  // 10-digit Indian mobile starting with 6–9
  phone: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number").openapi({ example: "9876543210" }),
  password: strongPassword.openapi({ example: "SecurePass@123" }),
  addressLine1: z.string().min(1, "Address is required").openapi({ example: "123 MG Road" }),
  addressLine2: z.string().optional().openapi({ example: "Near City Mall" }),
  city: z.string().min(1, "City is required").openapi({ example: "Bangalore" }),
  state: z.string().min(1, "State is required").openapi({ example: "Karnataka" }),
  // 6-digit Indian pincode not starting with 0
  pincode: z.string().regex(/^[1-9][0-9]{5}$/, "Enter a valid 6-digit pincode").openapi({ example: "560001" }),
}).openapi("RegisterCustomerRequest");

export type RegisterCustomerInput = z.infer<typeof registerCustomerSchema>;

export const updateCustomerSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().regex(/^[6-9]\d{9}$/).optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().regex(/^[1-9][0-9]{5}$/).optional(),
});

export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: strongPassword,
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

// ─── Jewelry ──────────────────────────────────────────────────────────────────

export const createJewelrySchema = z.object({
  name: z.string().min(1, "Name is required").openapi({ example: "Gold Temple Necklace" }),
  description: z.string().optional().openapi({ example: "Traditional South Indian temple jewelry with intricate craftsmanship" }),
  price: z.number().positive("Price must be positive").openapi({ example: 45000 }),
  stockQuantity: z.number().int().min(0, "Stock cannot be negative").openapi({ example: 5 }),
  imageUrl: z.string().url().optional().or(z.literal("")).openapi({ example: "https://res.cloudinary.com/navagunjara/image/upload/v1/jewelry/necklace1.jpg" }),
  jewelleryType: z.enum([
    "NECKLACE", "RING", "BRACELET", "EARRING", "ANKLET",
    "BANGLE", "PENDANT", "BROOCH", "OTHER",
  ]).openapi({ example: "NECKLACE" }),
  material: z.string().min(1, "Material is required").openapi({ example: "22K Gold" }),
  gemstone: z.string().optional().openapi({ example: "Ruby, Emerald" }),
  weightGrams: z.number().positive().optional().openapi({ example: 35.5 }),
  caratValue: z.number().positive().optional().openapi({ example: 22 }),
}).openapi("CreateJewelryRequest");

export type CreateJewelryInput = z.infer<typeof createJewelrySchema>;

export const updateJewelrySchema = createJewelrySchema.partial();
export type UpdateJewelryInput = z.infer<typeof updateJewelrySchema>;

// ─── Clothing ─────────────────────────────────────────────────────────────────

export const createClothingSchema = z.object({
  name: z.string().min(1, "Name is required").openapi({ example: "Banarasi Silk Saree" }),
  description: z.string().optional().openapi({ example: "Elegant handwoven Banarasi silk saree with golden zari work" }),
  price: z.number().positive("Price must be positive").openapi({ example: 12500 }),
  stockQuantity: z.number().int().min(0, "Stock cannot be negative").openapi({ example: 10 }),
  imageUrl: z.string().url().optional().or(z.literal("")).openapi({ example: "https://res.cloudinary.com/navagunjara/image/upload/v1/clothing/saree1.jpg" }),
  clothingType: z.enum([
    "SAREE", "KURTA", "LEHENGA", "SALWAR_KAMEEZ", "DUPATTA",
    "SHERWANI", "DHOTI", "BLOUSE", "KURTI", "OTHER",
  ]).openapi({ example: "SAREE" }),
  size: z.enum(["XS", "S", "M", "L", "XL", "XXL", "XXXL", "FREE_SIZE"]).openapi({ example: "FREE_SIZE" }),
  color: z.string().min(1, "Color is required").openapi({ example: "Red with Gold" }),
  fabric: z.string().optional().openapi({ example: "Pure Silk" }),
  gender: z.enum(["MALE", "FEMALE", "UNISEX"]).openapi({ example: "FEMALE" }),
}).openapi("CreateClothingRequest");

export type CreateClothingInput = z.infer<typeof createClothingSchema>;

export const updateClothingSchema = createClothingSchema.partial();
export type UpdateClothingInput = z.infer<typeof updateClothingSchema>;

// ─── Orders ───────────────────────────────────────────────────────────────────

export const orderItemSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
});

export const createOrderSchema = z.object({
  customerId: z.number().int().positive("Customer ID is required"),
  items: z.array(orderItemSchema).min(1, "At least one item is required"),
  deliveryAddress: z.string().min(1, "Delivery address is required"),
  deliveryCity: z.string().min(1, "Delivery city is required"),
  deliveryState: z.string().min(1, "Delivery state is required"),
  deliveryPincode: z.string().regex(/^[1-9][0-9]{5}$/, "Enter a valid 6-digit pincode"),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const updateOrderStatusSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"]),
});

export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;

// ─── Reviews ──────────────────────────────────────────────────────────────────

export const createReviewSchema = z.object({
  productId: z.number().int().positive("Product ID is required"),
  rating: z.number().int().min(1, "Rating must be 1–5").max(5, "Rating must be 1–5"),
  title: z.string().max(255).optional(),
  comment: z.string().max(2000).optional(),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;

export const updateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  title: z.string().max(255).optional(),
  comment: z.string().max(2000).optional(),
});

export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;

// ─── Razorpay ─────────────────────────────────────────────────────────────────

export const razorpayVerifySchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
  orderId: z.number().int().positive(),
});

export type RazorpayVerifyInput = z.infer<typeof razorpayVerifySchema>;
