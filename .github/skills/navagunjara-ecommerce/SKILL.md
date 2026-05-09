---
name: navagunjara-ecommerce
description: >
  Full-stack e-commerce development skill for the Navagunjara monorepo.
  Covers Next.js (App Router), TypeScript, Prisma + PostgreSQL, Auth.js,
  Stripe, Tailwind CSS, and the admin dashboard. Use for any feature,
  API route, UI component, or database change in this project.
argument-hint: "[feature name, route, or task description]"
---

# Navagunjara E-Commerce Skill

## Project Overview

Navagunjara is a full-stack e-commerce application for selling **clothing** and
**jewelry**. It is built as a **single Next.js monorepo** — one repo, one
deployment, one pipeline.

| Concern           | Choice                                    |
|-------------------|-------------------------------------------|
| Framework         | Next.js (App Router, TypeScript)          |
| Styling           | Tailwind CSS                              |
| Database          | PostgreSQL                                |
| ORM               | Prisma                                    |
| Auth              | Auth.js (NextAuth v5)                     |
| Payments          | Stripe                                    |
| Image uploads     | Cloudinary (or UploadThing)               |
| Validation        | Zod                                       |
| Forms             | React Hook Form                           |
| Hosting           | Vercel (app) + Neon / Railway (Postgres)  |

---

## Repository Structure

```
store-app/
├── app/                     → Next.js App Router pages and layouts
│   ├── (public)/            → Public-facing storefront routes
│   │   ├── page.tsx         → Homepage
│   │   ├── products/        → Product listing and detail pages
│   │   ├── cart/            → Shopping cart
│   │   └── checkout/        → Checkout flow
│   ├── (auth)/              → Login, signup, password-reset pages
│   ├── admin/               → Admin dashboard (ADMIN role only)
│   │   ├── page.tsx         → Dashboard overview
│   │   ├── products/        → Product CRUD
│   │   ├── orders/          → Order management
│   │   ├── uploads/         → Image upload management
│   │   └── inventory/       → Inventory management
│   └── api/                 → Next.js API routes (backend)
│       ├── auth/            → Auth.js handlers
│       ├── products/        → Product API
│       ├── orders/          → Order API
│       ├── payments/        → Stripe webhooks and payment intent
│       └── admin/           → Admin-only API endpoints
├── components/              → Reusable UI components
│   ├── ui/                  → Primitives (Button, Input, Modal, Badge)
│   ├── product/             → ProductCard, ProductGrid, ProductForm
│   ├── cart/                → CartDrawer, CartItem, CartSummary
│   ├── checkout/            → CheckoutForm, AddressForm, PaymentForm
│   └── admin/               → AdminNav, DataTable, ImageUploader
├── lib/                     → Utilities and shared logic
│   ├── db.ts                → Prisma client singleton
│   ├── auth.ts              → Auth.js config and helpers
│   ├── stripe.ts            → Stripe client
│   ├── cloudinary.ts        → Cloudinary config
│   └── utils.ts             → General utilities
├── services/                → Business logic layer
│   ├── product.service.ts   → Product CRUD operations
│   ├── order.service.ts     → Order management
│   ├── payment.service.ts   → Payment processing
│   ├── customer.service.ts  → Customer management
│   └── admin.service.ts     → Admin operations
├── prisma/                  → Prisma ORM
│   ├── schema.prisma        → Database schema
│   └── migrations/          → Auto-generated migrations
├── types/                   → Shared TypeScript types and interfaces
│   ├── product.types.ts
│   ├── order.types.ts
│   ├── customer.types.ts
│   └── api.types.ts
├── hooks/                   → Custom React hooks
│   ├── useCart.ts
│   ├── useProducts.ts
│   └── useCheckout.ts
├── middleware/              → Next.js middleware (auth/authz guards)
│   └── middleware.ts
├── public/                  → Static assets (logo, icons, fallback images)
├── styles/                  → Global styles
│   └── globals.css
└── .env.production          → Production environment variables (gitignored)
    .env.preprod             → Pre-production environment variables (gitignored)
```

---

## Database Schema (Prisma)

The Prisma schema must match the migrated PostgreSQL tables. Use the
following model definitions as the canonical source:

### Core models
- **Customer** — id, firstName, lastName, email (unique), phone, passwordHash,
  address fields, country (default "IND"), createdAt, updatedAt
- **Product** — id, productType (CLOTHING | JEWELRY), name, description, price,
  stockQuantity, imageUrls (String[]), category, active (default true), timestamps
- **Jewelry** (extends Product via relation) — jewelleryType, material, gemstone,
  weightGrams, caratValue
- **Clothing** (extends Product via relation) — clothingType, size, color, fabric,
  gender
- **Order** — id, customerId (→ Customer), status (PENDING | CONFIRMED | SHIPPED |
  DELIVERED | CANCELLED), totalAmount, delivery address fields, orderedAt, updatedAt
- **OrderItem** — id, orderId (→ Order), productId (→ Product), quantity,
  unitPrice, subtotal
- **Payment** — id, orderId (→ Order), amount, currency (default "INR"), method,
  status, stripePaymentIntentId, transactionId, failureReason, initiatedAt, completedAt
- **Admin** — id, firstName, lastName, email (unique), passwordHash, createdAt, updatedAt

### Seeded admin account
- Email: `admin@navagunjara.com`
- Password (plain): `Admin@123`
- BCrypt hash: `$2a$12$MqBNEJOyDi7W.fhqeKd9iuzNJHuNFl4xgBpIRHyLaEpLWcJaG1MLu`

---

## Environment Variables Reference

### Required variables for all environments

```env
# App
NEXT_PUBLIC_APP_URL=

# Database (Prisma)
DATABASE_URL=

# Auth.js (NextAuth v5)
NEXTAUTH_SECRET=
NEXTAUTH_URL=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=

# JWT (if using custom JWT outside Auth.js)
JWT_SECRET=
JWT_EXPIRATION_MS=86400000
```

### Pre-prod specific
- Use a separate Postgres database (not production data)
- Use Stripe test keys (`sk_test_...`, `pk_test_...`)
- Point `NEXTAUTH_URL` to the pre-prod domain

---

## User Roles and Authorization

| Role  | Capabilities |
|-------|-------------|
| USER  | Browse, cart, checkout, manage own account |
| ADMIN | All above + full admin dashboard access |
| GUEST | Browse and guest checkout only (no account) |

### Middleware guard pattern

```typescript
// middleware/middleware.ts
import { auth } from "@/lib/auth";
export default auth((req) => {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/admin") && req.auth?.user?.role !== "ADMIN") {
    return Response.redirect(new URL("/login", req.url));
  }
});
export const config = { matcher: ["/admin/:path*", "/account/:path*"] };
```

---

## API Route Conventions

All API routes live under `app/api/`. Follow these conventions:

- Use `NextRequest` / `NextResponse` types
- Validate request bodies with **Zod** schemas before processing
- Return consistent JSON shape: `{ data, error, message }`
- Use service layer — never write DB queries directly in API routes
- Use `auth()` from Auth.js to get the session in server components/routes
- HTTP status codes: 200 OK, 201 Created, 400 Bad Request, 401 Unauthorized,
  403 Forbidden, 404 Not Found, 500 Internal Server Error

### Example API route pattern

```typescript
import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import { productService } from "@/services/product.service";

const createProductSchema = z.object({
  name: z.string().min(1),
  price: z.number().positive(),
  productType: z.enum(["CLOTHING", "JEWELRY"]),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = createProductSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const product = await productService.create(parsed.data);
  return NextResponse.json({ data: product }, { status: 201 });
}
```

---

## Service Layer Pattern

Business logic must live in `services/`. Services call Prisma directly.

```typescript
// services/product.service.ts
import { db } from "@/lib/db";

export const productService = {
  async findAll(filters?: { category?: string; active?: boolean }) {
    return db.product.findMany({ where: filters ?? {} });
  },
  async findById(id: number) {
    return db.product.findUnique({ where: { id } });
  },
  async create(data: CreateProductDto) {
    return db.product.create({ data });
  },
};
```

---

## UI Component Standards

- All components: **TypeScript** with explicit prop interfaces (no `any`)
- Styling: **Tailwind CSS** utility classes only — no inline styles
- Forms: **React Hook Form** + **Zod** resolver
- No hardcoded colors or spacing — use Tailwind design tokens
- Accessible: `aria-label`, `role`, `aria-expanded` as appropriate
- Server components by default; add `"use client"` only when needed

---

## Admin Dashboard

Routes under `/admin/*` are guarded by middleware. All admin pages:
1. Verify `ADMIN` role via `auth()` at the server component level
2. Redirect to `/login` if unauthenticated
3. Redirect to `/` (403) if authenticated but not ADMIN

Admin pages to implement:
- `/admin` — Dashboard overview (order counts, revenue, inventory alerts)
- `/admin/products` — Product list with search, filter, pagination
- `/admin/products/new` — Create product form (clothing or jewelry)
- `/admin/products/[id]/edit` — Edit product form
- `/admin/orders` — Order list with status filters
- `/admin/uploads` — Image upload management
- `/admin/inventory` — Low-stock alerts and quantity updates

---

## Payments (Stripe)

- Use `stripe.paymentIntents.create()` server-side
- Never expose `STRIPE_SECRET_KEY` to the client
- Use Stripe webhooks for order confirmation (`payment_intent.succeeded`)
- Guest checkout: collect email for order confirmation, no account required

---

## Image Uploads

- Use Cloudinary signed uploads from the admin dashboard
- Store image URLs in `Product.imageUrls` (String array in Prisma)
- Use Next.js `<Image>` with Cloudinary loader for optimized delivery
- Restrict uploads to authenticated ADMIN users only

---

## Development Workflow

When implementing any feature in this project:

1. **Define types** in `types/` first — shared across frontend and backend
2. **Update Prisma schema** if DB changes are needed → run `prisma migrate dev`
3. **Implement service** in `services/` with Prisma queries
4. **Create API route** in `app/api/` calling the service, with Zod validation
5. **Build UI component** in `components/` using Tailwind + React Hook Form
6. **Wire page** in `app/` using the component and calling the API or using
   Server Actions
7. **Write unit tests** for services and API route handlers
8. **Run lint and type-check** before committing: `npm run lint && npx tsc --noEmit`

---

## Scripts Reference

```bash
# Development
npm run dev

# Build
npm run build

# Lint
npm run lint

# Type check
npx tsc --noEmit

# Prisma
npx prisma migrate dev        # run migrations (dev)
npx prisma migrate deploy     # run migrations (prod/preprod)
npx prisma db seed            # seed database
npx prisma studio             # open Prisma Studio GUI

# Tests
npm test
npm run test:coverage
```

---

## Quality Gates (before every PR)

- [ ] `npx tsc --noEmit` passes (zero type errors)
- [ ] `npm run lint` passes (zero ESLint errors)
- [ ] `npm test` passes
- [ ] No `any` types introduced
- [ ] No secrets committed (env vars only)
- [ ] API routes validated with Zod
- [ ] Admin routes protected by middleware + server-side auth check
- [ ] Prisma migration generated for schema changes
