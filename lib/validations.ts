/**
 * Zod validation schemas for all API request payloads.
 *
 * @module lib/validations
 * @author Anurag Muthyam
 * @organization indosyn
 */

import { z } from "zod";

// ─── Auth ──────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ─── Customer ─────────────────────────────────────────────────────────────────

export const registerCustomerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  // 10-digit Indian mobile starting with 6–9
  phone: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  addressLine1: z.string().min(1, "Address is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  // 6-digit Indian pincode not starting with 0
  pincode: z.string().regex(/^[1-9][0-9]{5}$/, "Enter a valid 6-digit pincode"),
});

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
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

// ─── Jewelry ──────────────────────────────────────────────────────────────────

export const createJewelrySchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  price: z.number().positive("Price must be positive"),
  stockQuantity: z.number().int().min(0, "Stock cannot be negative"),
  imageUrl: z.string().url().optional().or(z.literal("")),
  jewelleryType: z.enum([
    "NECKLACE", "RING", "BRACELET", "EARRING", "ANKLET",
    "BANGLE", "PENDANT", "BROOCH", "OTHER",
  ]),
  material: z.string().min(1, "Material is required"),
  gemstone: z.string().optional(),
  weightGrams: z.number().positive().optional(),
  caratValue: z.number().positive().optional(),
});

export type CreateJewelryInput = z.infer<typeof createJewelrySchema>;

export const updateJewelrySchema = createJewelrySchema.partial();
export type UpdateJewelryInput = z.infer<typeof updateJewelrySchema>;

// ─── Clothing ─────────────────────────────────────────────────────────────────

export const createClothingSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  price: z.number().positive("Price must be positive"),
  stockQuantity: z.number().int().min(0, "Stock cannot be negative"),
  imageUrl: z.string().url().optional().or(z.literal("")),
  clothingType: z.enum([
    "SAREE", "KURTA", "LEHENGA", "SALWAR_KAMEEZ", "DUPATTA",
    "SHERWANI", "DHOTI", "BLOUSE", "KURTI", "OTHER",
  ]),
  size: z.enum(["XS", "S", "M", "L", "XL", "XXL", "XXXL", "FREE_SIZE"]),
  color: z.string().min(1, "Color is required"),
  fabric: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "UNISEX"]),
});

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
