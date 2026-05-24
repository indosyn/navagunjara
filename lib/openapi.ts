/**
 * OpenAPI specification generator for Navagunjara API.
 *
 * This file is the single source of truth for the Swagger UI served at /api/docs
 * and the OpenAPI JSON served at /api/openapi. The endpoint list here must stay
 * in lockstep with both the actual route handlers under app/api and the Postman
 * collection under collection/navagunjara.postman_collection.json.
 *
 * @module lib/openapi
 * @author Anurag Muthyam
 * @organization indosyn
 */

import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
  extendZodWithOpenApi,
} from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

// Must be called once at module load so the @asteasolutions/zod-to-openapi
// generator can introspect Zod schemas (registers an internal metadata
// registry on the Zod prototype).
extendZodWithOpenApi(z);

import {
  loginSchema,
  registerCustomerSchema,
  updateCustomerSchema,
  changePasswordSchema,
  createJewelrySchema,
  updateJewelrySchema,
  createClothingSchema,
  updateClothingSchema,
  createOrderSchema,
  updateOrderStatusSchema,
  createReviewSchema,
  updateReviewSchema,
  razorpayVerifySchema,
} from "./validations";

const registry = new OpenAPIRegistry();

// ─── Response Schemas ──────────────────────────────────────────────────────

registry.registerComponent("schemas", "ApiSuccess", {
  type: "object",
  properties: {
    success: { type: "boolean", example: true },
    message: { type: "string", example: "Success" },
    data: { type: "object" },
  },
  required: ["success"],
});

registry.registerComponent("schemas", "ApiError", {
  type: "object",
  properties: {
    success: { type: "boolean", example: false },
    message: { type: "string", example: "Validation failed" },
    errorCode: { type: "string", example: "VALIDATION_ERROR" },
    errorDetail: { type: "object" },
  },
  required: ["success", "message"],
});

registry.registerComponent("schemas", "LoginResponse", {
  type: "object",
  properties: {
    success: { type: "boolean", example: true },
    message: { type: "string", example: "Login successful" },
    data: {
      type: "object",
      properties: {
        token: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
        user: {
          type: "object",
          properties: {
            id: { type: "number", example: 1 },
            email: { type: "string", example: "priya@example.com" },
            firstName: { type: "string", example: "Priya" },
            lastName: { type: "string", example: "Sharma" },
            role: { type: "string", enum: ["CUSTOMER", "ADMIN"], example: "CUSTOMER" },
          },
        },
      },
    },
  },
});

// ─── Security Schemes ──────────────────────────────────────────────────────

registry.registerComponent("securitySchemes", "bearerAuth", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
});

const ok = {
  200: {
    description: "Success",
    content: { "application/json": { schema: { $ref: "#/components/schemas/ApiSuccess" } } },
  },
};
const created = {
  201: {
    description: "Created",
    content: { "application/json": { schema: { $ref: "#/components/schemas/ApiSuccess" } } },
  },
};
const validationError = {
  400: {
    description: "Validation failed",
    content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } },
  },
};
const unauthorized = {
  401: {
    description: "Unauthorized",
    content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } },
  },
};
const forbidden = {
  403: {
    description: "Forbidden",
    content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } },
  },
};
const notFound = {
  404: {
    description: "Not found",
    content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } },
  },
};

// `request.params` in @asteasolutions/zod-to-openapi v8 must be a ZodObject
// (its keys are introspected to derive OpenAPI path parameters). Passing a
// raw `{ id: { schema: ... } }` blob silently produced an undefined-parent
// crash inside `generateInlineParameters`. Using `z.object({ id: z.string() })`
// is the supported shape.
const idParam = {
  params: z.object({
    id: z.string(),
  }),
};

// ─── Health ────────────────────────────────────────────────────────────────

registry.registerPath({
  method: "get",
  path: "/api/health",
  tags: ["Health"],
  summary: "Health check",
  description: "Application health and readiness check.",
  responses: {
    200: {
      description: "Service is healthy",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              status: { type: "string", example: "ok" },
              timestamp: { type: "string", example: "2024-01-01T00:00:00.000Z" },
            },
          },
        },
      },
    },
  },
});

// ─── Authentication ────────────────────────────────────────────────────────

registry.registerPath({
  method: "post",
  path: "/api/v1/auth/login",
  tags: ["Authentication"],
  summary: "Login",
  description: "Authenticate a customer or admin and receive a JWT.",
  request: {
    body: {
      content: { "application/json": { schema: loginSchema } },
    },
  },
  responses: {
    200: {
      description: "Login successful",
      content: { "application/json": { schema: { $ref: "#/components/schemas/LoginResponse" } } },
    },
    ...validationError,
    ...unauthorized,
  },
});

// ─── Customers ─────────────────────────────────────────────────────────────

registry.registerPath({
  method: "post",
  path: "/api/v1/customers/register",
  tags: ["Customers"],
  summary: "Register customer",
  description: "Create a new customer account.",
  request: {
    body: { content: { "application/json": { schema: registerCustomerSchema } } },
  },
  responses: { ...created, ...validationError },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/customers",
  tags: ["Customers"],
  summary: "List customers (admin)",
  description: "Paginated list of all customers. Admin only.",
  security: [{ bearerAuth: [] }],
  responses: { ...ok, ...unauthorized, ...forbidden },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/customers/me",
  tags: ["Customers"],
  summary: "Get current customer",
  description: "Get the authenticated customer's profile.",
  security: [{ bearerAuth: [] }],
  responses: { ...ok, ...unauthorized },
});

registry.registerPath({
  method: "put",
  path: "/api/v1/customers/me/password",
  tags: ["Customers"],
  summary: "Change password",
  description: "Change the authenticated customer's password.",
  security: [{ bearerAuth: [] }],
  request: {
    body: { content: { "application/json": { schema: changePasswordSchema } } },
  },
  responses: { ...ok, ...validationError, ...unauthorized },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/customers/{id}",
  tags: ["Customers"],
  summary: "Get customer by ID",
  description: "Retrieve a customer profile by ID.",
  security: [{ bearerAuth: [] }],
  request: idParam,
  responses: { ...ok, ...unauthorized, ...notFound },
});

registry.registerPath({
  method: "put",
  path: "/api/v1/customers/{id}",
  tags: ["Customers"],
  summary: "Update customer",
  description: "Update a customer profile.",
  security: [{ bearerAuth: [] }],
  request: {
    ...idParam,
    body: { content: { "application/json": { schema: updateCustomerSchema } } },
  },
  responses: { ...ok, ...validationError, ...unauthorized, ...notFound },
});

// ─── Jewelry ───────────────────────────────────────────────────────────────

registry.registerPath({
  method: "get",
  path: "/api/v1/jewelry",
  tags: ["Jewelry"],
  summary: "List jewelry",
  description: "Paginated list of jewelry products.",
  responses: { ...ok },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/jewelry",
  tags: ["Jewelry"],
  summary: "Create jewelry (admin)",
  description: "Create a new jewelry product. Admin only.",
  security: [{ bearerAuth: [] }],
  request: {
    body: { content: { "application/json": { schema: createJewelrySchema } } },
  },
  responses: { ...created, ...validationError, ...unauthorized, ...forbidden },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/jewelry/search",
  tags: ["Jewelry"],
  summary: "Search jewelry",
  description: "Search jewelry by query, category, material, gemstone, and price range.",
  responses: { ...ok },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/jewelry/{id}",
  tags: ["Jewelry"],
  summary: "Get jewelry by ID",
  description: "Retrieve a single jewelry product.",
  request: idParam,
  responses: { ...ok, ...notFound },
});

registry.registerPath({
  method: "put",
  path: "/api/v1/jewelry/{id}",
  tags: ["Jewelry"],
  summary: "Update jewelry (admin)",
  description: "Update an existing jewelry product. Admin only.",
  security: [{ bearerAuth: [] }],
  request: {
    ...idParam,
    body: { content: { "application/json": { schema: updateJewelrySchema } } },
  },
  responses: { ...ok, ...validationError, ...unauthorized, ...forbidden, ...notFound },
});

registry.registerPath({
  method: "delete",
  path: "/api/v1/jewelry/{id}",
  tags: ["Jewelry"],
  summary: "Delete jewelry (admin)",
  description: "Delete a jewelry product. Admin only.",
  security: [{ bearerAuth: [] }],
  request: idParam,
  responses: { ...ok, ...unauthorized, ...forbidden, ...notFound },
});

// ─── Clothing ──────────────────────────────────────────────────────────────

registry.registerPath({
  method: "get",
  path: "/api/v1/clothing",
  tags: ["Clothing"],
  summary: "List clothing",
  description: "Paginated list of clothing products.",
  responses: { ...ok },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/clothing",
  tags: ["Clothing"],
  summary: "Create clothing (admin)",
  description: "Create a new clothing product. Admin only.",
  security: [{ bearerAuth: [] }],
  request: {
    body: { content: { "application/json": { schema: createClothingSchema } } },
  },
  responses: { ...created, ...validationError, ...unauthorized, ...forbidden },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/clothing/search",
  tags: ["Clothing"],
  summary: "Search clothing",
  description: "Search clothing by query, category, fabric, occasion, color, size, and price.",
  responses: { ...ok },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/clothing/{id}",
  tags: ["Clothing"],
  summary: "Get clothing by ID",
  description: "Retrieve a single clothing product.",
  request: idParam,
  responses: { ...ok, ...notFound },
});

registry.registerPath({
  method: "put",
  path: "/api/v1/clothing/{id}",
  tags: ["Clothing"],
  summary: "Update clothing (admin)",
  description: "Update an existing clothing product. Admin only.",
  security: [{ bearerAuth: [] }],
  request: {
    ...idParam,
    body: { content: { "application/json": { schema: updateClothingSchema } } },
  },
  responses: { ...ok, ...validationError, ...unauthorized, ...forbidden, ...notFound },
});

registry.registerPath({
  method: "delete",
  path: "/api/v1/clothing/{id}",
  tags: ["Clothing"],
  summary: "Delete clothing (admin)",
  description: "Delete a clothing product. Admin only.",
  security: [{ bearerAuth: [] }],
  request: idParam,
  responses: { ...ok, ...unauthorized, ...forbidden, ...notFound },
});

// ─── Orders ────────────────────────────────────────────────────────────────

registry.registerPath({
  method: "get",
  path: "/api/v1/orders",
  tags: ["Orders"],
  summary: "List orders",
  description:
    "Returns paginated orders. Customers see their own orders; admins see all orders (filterable by `customerId` and `status`).",
  security: [{ bearerAuth: [] }],
  responses: { ...ok, ...unauthorized },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/orders",
  tags: ["Orders"],
  summary: "Place order",
  description: "Create a new order for the authenticated customer.",
  security: [{ bearerAuth: [] }],
  request: {
    body: { content: { "application/json": { schema: createOrderSchema } } },
  },
  responses: { ...created, ...validationError, ...unauthorized },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/orders/{id}",
  tags: ["Orders"],
  summary: "Get order by ID",
  description: "Retrieve an order. Customers can only fetch their own orders.",
  security: [{ bearerAuth: [] }],
  request: idParam,
  responses: { ...ok, ...unauthorized, ...forbidden, ...notFound },
});

registry.registerPath({
  method: "put",
  path: "/api/v1/orders/{id}/cancel",
  tags: ["Orders"],
  summary: "Cancel order",
  description: "Cancel a pending order owned by the authenticated customer.",
  security: [{ bearerAuth: [] }],
  request: idParam,
  responses: { ...ok, ...unauthorized, ...forbidden, ...notFound },
});

registry.registerPath({
  method: "put",
  path: "/api/v1/orders/{id}/status",
  tags: ["Orders"],
  summary: "Update order status (admin)",
  description: "Change the status of any order. Admin only.",
  security: [{ bearerAuth: [] }],
  request: {
    ...idParam,
    body: { content: { "application/json": { schema: updateOrderStatusSchema } } },
  },
  responses: { ...ok, ...validationError, ...unauthorized, ...forbidden, ...notFound },
});

// ─── Payments ──────────────────────────────────────────────────────────────

registry.registerPath({
  method: "post",
  path: "/api/v1/payments",
  tags: ["Payments"],
  summary: "Initiate payment",
  description: "Create a Razorpay order for an existing pending order.",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              orderId: { type: "integer", example: 1 },
              method: { type: "string", enum: ["UPI", "CARD", "NET_BANKING", "WALLET"], example: "UPI" },
            },
            required: ["orderId", "method"],
          },
        },
      },
    },
  },
  responses: { ...created, ...validationError, ...unauthorized, ...notFound },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/payments/{id}/confirm",
  tags: ["Payments"],
  summary: "Confirm payment",
  description: "Verify a Razorpay signature and confirm payment for the order.",
  security: [{ bearerAuth: [] }],
  request: {
    ...idParam,
    body: { content: { "application/json": { schema: razorpayVerifySchema } } },
  },
  responses: { ...ok, ...validationError, ...unauthorized, ...notFound },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/payments/{id}/fail",
  tags: ["Payments"],
  summary: "Fail payment",
  description: "Mark a payment as failed.",
  security: [{ bearerAuth: [] }],
  request: idParam,
  responses: { ...ok, ...unauthorized, ...notFound },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/payments/order/{orderId}",
  tags: ["Payments"],
  summary: "Get payment by order",
  description: "Retrieve payment details for a given order ID.",
  security: [{ bearerAuth: [] }],
  request: {
    params: { orderId: { schema: { type: "string" } } } as never,
  },
  responses: { ...ok, ...unauthorized, ...notFound },
});

// ─── Reviews ───────────────────────────────────────────────────────────────

registry.registerPath({
  method: "get",
  path: "/api/v1/reviews",
  tags: ["Reviews"],
  summary: "List product reviews",
  description: "List reviews for a product. Required query param: `productId`.",
  responses: { ...ok },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/reviews",
  tags: ["Reviews"],
  summary: "Submit review",
  description: "Submit a new review for a product.",
  security: [{ bearerAuth: [] }],
  request: {
    body: { content: { "application/json": { schema: createReviewSchema } } },
  },
  responses: { ...created, ...validationError, ...unauthorized },
});

registry.registerPath({
  method: "put",
  path: "/api/v1/reviews/{id}",
  tags: ["Reviews"],
  summary: "Update review",
  description: "Update an existing review owned by the authenticated user.",
  security: [{ bearerAuth: [] }],
  request: {
    ...idParam,
    body: { content: { "application/json": { schema: updateReviewSchema } } },
  },
  responses: { ...ok, ...validationError, ...unauthorized, ...forbidden, ...notFound },
});

registry.registerPath({
  method: "delete",
  path: "/api/v1/reviews/{id}",
  tags: ["Reviews"],
  summary: "Delete review",
  description: "Delete a review owned by the authenticated user.",
  security: [{ bearerAuth: [] }],
  request: idParam,
  responses: { ...ok, ...unauthorized, ...forbidden, ...notFound },
});

// ─── Wishlist ──────────────────────────────────────────────────────────────

registry.registerPath({
  method: "get",
  path: "/api/v1/wishlist",
  tags: ["Wishlist"],
  summary: "Get wishlist",
  description: "Get the authenticated user's wishlist.",
  security: [{ bearerAuth: [] }],
  responses: { ...ok, ...unauthorized },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/wishlist",
  tags: ["Wishlist"],
  summary: "Add to wishlist",
  description: "Add a product to the authenticated user's wishlist.",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: { productId: { type: "string", example: "1" } },
            required: ["productId"],
          },
        },
      },
    },
  },
  responses: { ...created, ...validationError, ...unauthorized },
});

registry.registerPath({
  method: "delete",
  path: "/api/v1/wishlist/{productId}",
  tags: ["Wishlist"],
  summary: "Remove from wishlist",
  description: "Remove a product from the authenticated user's wishlist.",
  security: [{ bearerAuth: [] }],
  request: {
    params: { productId: { schema: { type: "string" } } } as never,
  },
  responses: { ...ok, ...unauthorized, ...notFound },
});

// ─── Images ────────────────────────────────────────────────────────────────

registry.registerPath({
  method: "post",
  path: "/api/v1/images/upload",
  tags: ["Images"],
  summary: "Upload image",
  description: "Upload an image to Cloudinary. Accepts multipart/form-data with a `file` field.",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "multipart/form-data": {
          schema: {
            type: "object",
            properties: { file: { type: "string", format: "binary" } },
            required: ["file"],
          },
        },
      },
    },
  },
  responses: { ...created, ...validationError, ...unauthorized },
});

registry.registerPath({
  method: "delete",
  path: "/api/v1/images/{id}",
  tags: ["Images"],
  summary: "Delete image",
  description: "Delete an uploaded image from Cloudinary by its public ID.",
  security: [{ bearerAuth: [] }],
  request: idParam,
  responses: { ...ok, ...unauthorized, ...notFound },
});

// ─── Admin ─────────────────────────────────────────────────────────────────

registry.registerPath({
  method: "get",
  path: "/api/v1/admin/dashboard",
  tags: ["Admin"],
  summary: "Dashboard stats",
  description: "Admin dashboard statistics (counts, revenue, recent orders). Admin only.",
  security: [{ bearerAuth: [] }],
  responses: { ...ok, ...unauthorized, ...forbidden },
});

// ─── Generate OpenAPI Spec ─────────────────────────────────────────────────

const generator = new OpenApiGeneratorV3(registry.definitions);

const documentInput = {
  openapi: "3.0.0",
  info: {
    title: "Navagunjara API",
    version: "2.0.0",
    description:
      "Full-stack e-commerce platform for Indian jewelry & clothing. Built with Next.js, TypeScript, Prisma, and PostgreSQL.",
    contact: {
      name: "Anurag Muthyam",
      email: "anurag@indosyn.com",
    },
  },
  servers: [
    { url: "http://localhost:3000", description: "Local development" },
    { url: "https://preprod.navagunjara.com", description: "Pre-production" },
    { url: "https://navagunjara.com", description: "Production" },
  ],
  tags: [
    { name: "Health", description: "Application health checks" },
    { name: "Authentication", description: "User authentication" },
    { name: "Customers", description: "Customer accounts and profiles" },
    { name: "Jewelry", description: "Jewelry product catalog" },
    { name: "Clothing", description: "Clothing product catalog" },
    { name: "Orders", description: "Order management" },
    { name: "Payments", description: "Razorpay payment flow" },
    { name: "Reviews", description: "Product reviews" },
    { name: "Wishlist", description: "User wishlist" },
    { name: "Images", description: "Image upload via Cloudinary" },
    { name: "Admin", description: "Admin-only operations" },
  ],
};

function buildSpec(): Record<string, unknown> {
  try {
    return generator.generateDocument(documentInput) as unknown as Record<
      string,
      unknown
    >;
  } catch (err) {
    console.warn(
      "[openapi] Failed to generate spec; serving stub. " +
        (err instanceof Error ? err.message : String(err))
    );
    return {
      ...documentInput,
      paths: {},
      components: {
        schemas: {
          ApiError: {
            type: "object",
            properties: {
              success: { type: "boolean", example: false },
              message: { type: "string" },
            },
          },
        },
      },
      "x-generation-error": err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Generated OpenAPI 3.0 document. Wrapped in try/catch because
 * `@asteasolutions/zod-to-openapi` ^8.5.0 has a known incompatibility with
 * Zod ^4.4 that throws `Cannot read properties of undefined (reading 'parent')`
 * during `generateDocument()`. We don't want a broken Swagger generator to
 * crash the entire app at import-time (the route is dev-only convenience).
 */
export const openApiSpec = buildSpec();

