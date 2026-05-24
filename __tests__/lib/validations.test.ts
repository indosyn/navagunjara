/**
 * Tests for Zod validation schemas.
 *
 * @module __tests__/lib/validations.test
 * @author Anurag Muthyam
 * @organization indosyn
 */

import {
  loginSchema,
  registerCustomerSchema,
  updateCustomerSchema,
  changePasswordSchema,
  createJewelrySchema,
  updateJewelrySchema,
  createClothingSchema,
  createOrderSchema,
  updateOrderStatusSchema,
  createReviewSchema,
  updateReviewSchema,
  razorpayVerifySchema,
} from "@/lib/validations";

describe("loginSchema", () => {
  it("accepts valid input", () => {
    expect(loginSchema.safeParse({ email: "a@b.com", password: "x" }).success).toBe(true);
  });
  it("rejects bad email", () => {
    expect(loginSchema.safeParse({ email: "not-email", password: "x" }).success).toBe(false);
  });
  it("rejects empty password", () => {
    expect(loginSchema.safeParse({ email: "a@b.com", password: "" }).success).toBe(false);
  });
});

describe("registerCustomerSchema", () => {
  const valid = {
    firstName: "A", lastName: "B", email: "a@b.com",
    phone: "9876543210", password: "Secret@1234XYZ",
    addressLine1: "x", city: "y", state: "z", pincode: "560001",
  };

  it("accepts valid input", () => {
    expect(registerCustomerSchema.safeParse(valid).success).toBe(true);
  });
  it("rejects bad phone", () => {
    expect(registerCustomerSchema.safeParse({ ...valid, phone: "1234567890" }).success).toBe(false);
  });
  it("rejects pincode starting with 0", () => {
    expect(registerCustomerSchema.safeParse({ ...valid, pincode: "060001" }).success).toBe(false);
  });
  it("rejects weak password (too short)", () => {
    expect(registerCustomerSchema.safeParse({ ...valid, password: "Sh0rt!" }).success).toBe(false);
  });
  it("rejects password missing uppercase", () => {
    expect(registerCustomerSchema.safeParse({ ...valid, password: "longerpass@1234" }).success).toBe(false);
  });
  it("rejects password missing digit", () => {
    expect(registerCustomerSchema.safeParse({ ...valid, password: "Longpass@!!!!" }).success).toBe(false);
  });
  it("rejects password missing symbol", () => {
    expect(registerCustomerSchema.safeParse({ ...valid, password: "Longpass12345" }).success).toBe(false);
  });
});

describe("updateCustomerSchema", () => {
  it("accepts partial update", () => {
    expect(updateCustomerSchema.safeParse({ firstName: "A" }).success).toBe(true);
  });
  it("rejects bad phone", () => {
    expect(updateCustomerSchema.safeParse({ phone: "0000000000" }).success).toBe(false);
  });
});

describe("changePasswordSchema", () => {
  it("requires strong newPassword", () => {
    expect(changePasswordSchema.safeParse({ currentPassword: "x", newPassword: "weak" }).success).toBe(false);
    expect(changePasswordSchema.safeParse({ currentPassword: "x", newPassword: "Secret@1234XYZ" }).success).toBe(true);
  });
});

describe("createJewelrySchema", () => {
  const valid = {
    name: "n", price: 100, stockQuantity: 1,
    jewelleryType: "NECKLACE" as const, material: "gold",
  };
  it("accepts valid", () => {
    expect(createJewelrySchema.safeParse(valid).success).toBe(true);
  });
  it("rejects negative price", () => {
    expect(createJewelrySchema.safeParse({ ...valid, price: -1 }).success).toBe(false);
  });
  it("rejects negative stock", () => {
    expect(createJewelrySchema.safeParse({ ...valid, stockQuantity: -1 }).success).toBe(false);
  });
  it("rejects invalid jewelleryType", () => {
    expect(createJewelrySchema.safeParse({ ...valid, jewelleryType: "INVALID" }).success).toBe(false);
  });
  it("accepts empty imageUrl literal", () => {
    expect(createJewelrySchema.safeParse({ ...valid, imageUrl: "" }).success).toBe(true);
  });
});

describe("updateJewelrySchema", () => {
  it("accepts partial", () => {
    expect(updateJewelrySchema.safeParse({ price: 200 }).success).toBe(true);
  });
});

describe("createClothingSchema", () => {
  const valid = {
    name: "n", price: 100, stockQuantity: 1,
    clothingType: "SAREE" as const, size: "FREE_SIZE" as const,
    color: "red", gender: "FEMALE" as const,
  };
  it("accepts valid", () => {
    expect(createClothingSchema.safeParse(valid).success).toBe(true);
  });
  it("rejects bad size", () => {
    expect(createClothingSchema.safeParse({ ...valid, size: "BAD" }).success).toBe(false);
  });
});

describe("createOrderSchema", () => {
  const valid = {
    customerId: 1,
    items: [{ productId: 1, quantity: 2 }],
    deliveryAddress: "x", deliveryCity: "y", deliveryState: "z",
    deliveryPincode: "560001",
  };
  it("accepts valid", () => {
    expect(createOrderSchema.safeParse(valid).success).toBe(true);
  });
  it("rejects empty items", () => {
    expect(createOrderSchema.safeParse({ ...valid, items: [] }).success).toBe(false);
  });
  it("rejects zero quantity", () => {
    expect(createOrderSchema.safeParse({ ...valid, items: [{ productId: 1, quantity: 0 }] }).success).toBe(false);
  });
});

describe("updateOrderStatusSchema", () => {
  it("accepts PENDING/CONFIRMED/SHIPPED/DELIVERED/CANCELLED", () => {
    for (const s of ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"]) {
      expect(updateOrderStatusSchema.safeParse({ status: s }).success).toBe(true);
    }
  });
  it("rejects unknown", () => {
    expect(updateOrderStatusSchema.safeParse({ status: "X" }).success).toBe(false);
  });
});

describe("createReviewSchema", () => {
  it("accepts valid", () => {
    expect(createReviewSchema.safeParse({ productId: 1, rating: 5 }).success).toBe(true);
  });
  it("rejects rating > 5", () => {
    expect(createReviewSchema.safeParse({ productId: 1, rating: 6 }).success).toBe(false);
  });
  it("rejects rating < 1", () => {
    expect(createReviewSchema.safeParse({ productId: 1, rating: 0 }).success).toBe(false);
  });
});

describe("updateReviewSchema", () => {
  it("accepts partial", () => {
    expect(updateReviewSchema.safeParse({ rating: 3 }).success).toBe(true);
    expect(updateReviewSchema.safeParse({}).success).toBe(true);
  });
});

describe("razorpayVerifySchema", () => {
  it("accepts valid", () => {
    expect(razorpayVerifySchema.safeParse({
      razorpay_order_id: "o", razorpay_payment_id: "p",
      razorpay_signature: "s", orderId: 1,
    }).success).toBe(true);
  });
  it("rejects empty strings", () => {
    expect(razorpayVerifySchema.safeParse({
      razorpay_order_id: "", razorpay_payment_id: "p",
      razorpay_signature: "s", orderId: 1,
    }).success).toBe(false);
  });
});
