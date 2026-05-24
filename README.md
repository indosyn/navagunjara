# 🦚 Navagunjara

Full-stack e-commerce platform for **Indian jewelry & clothing** — **Next.js 16**, **TypeScript**, **Prisma 7**, **PostgreSQL**, **Auth.js**, **Tailwind CSS**.

[![Next.js](https://img.shields.io/badge/Next.js-16.2-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7.8-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Jest](https://img.shields.io/badge/Jest-30-C21325?logo=jest&logoColor=white)](https://jestjs.io/)
[![License](https://img.shields.io/badge/Internal-indosyn-003366)](#)

## Quick Links

| Resource | Link |
|---|---|
| � **API Explorer (Swagger)** | Run `npm run dev` → [http://localhost:3000/api/docs](http://localhost:3000/api/docs) |
| 📦 Postman Collection | [navagunjara.postman_collection.json](collection/navagunjara.postman_collection.json) |
| 🧰 Pre-prod Environment | [navagunjara-preprod.postman_environment.json](collection/navagunjara-preprod.postman_environment.json) |
| 🗄️ Prisma Schema | [prisma/schema.prisma](prisma/schema.prisma) |
| 🌱 Database Seed | [prisma/seed.ts](prisma/seed.ts) |
| 🔐 Auth Config | [lib/auth.ts](lib/auth.ts) |
| 🎨 UI Components | [components/](components/) |
| 📖 API Docs (TypeDoc) | Run `npm run docs:open` → `docs/index.html` |
| ✅ Unit Tests | [\_\_tests\_\_/](__tests__/) |

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript (strict mode) |
| Database | PostgreSQL + Prisma 7 ORM |
| Auth | Auth.js v5 (Credentials, JWT) |
| Styling | Tailwind CSS 4 |
| State | Zustand (cart persistence) |
| Validation | Zod + React Hook Form |
| Logging | Pino + pino-pretty |
| Testing | Jest 30, Testing Library |
| Payments | Razorpay (Phase 2) |

## Architecture

```
app/
├── (auth)/           # Login, signup pages
├── (public)/         # Home, products, cart, checkout, account
├── admin/            # Dashboard, products CRUD, orders management
└── api/v1/           # REST API routes
    ├── auth/         # Login endpoint
    ├── customers/    # Registration, profile, password
    ├── jewelry/      # Jewelry CRUD + search
    ├── clothing/     # Clothing CRUD + search
    ├── orders/       # Order placement, cancellation
    ├── payments/     # Razorpay create, verify, fail
    ├── reviews/      # Product reviews & ratings
    ├── wishlist/     # Customer wishlist
    ├── images/       # Cloudinary image upload/delete
    └── admin/        # Dashboard stats, order management
services/             # Business logic layer
lib/                  # Auth, DB, logger, utils, validations
components/           # Reusable UI components
hooks/                # Custom React hooks (cart)
types/                # TypeScript interfaces & enums
```

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/auth/login` | Public | Login (returns JWT) |
| POST | `/api/v1/customers/register` | Public | Customer registration |
| GET | `/api/v1/customers/me` | User | Current user profile |
| PUT | `/api/v1/customers/:id` | User | Update profile |
| PUT | `/api/v1/customers/me/password` | User | Change password |
| GET | `/api/v1/jewelry` | Public | List jewelry (paginated) |
| GET | `/api/v1/jewelry/search` | Public | Search by name/type |
| GET | `/api/v1/jewelry/:id` | Public | Get jewelry by ID |
| POST | `/api/v1/jewelry` | Admin | Create jewelry |
| PUT | `/api/v1/jewelry/:id` | Admin | Update jewelry |
| DELETE | `/api/v1/jewelry/:id` | Admin | Soft-delete jewelry |
| GET | `/api/v1/clothing` | Public | List clothing (paginated) |
| GET | `/api/v1/clothing/search` | Public | Search by name/type/gender |
| GET | `/api/v1/clothing/:id` | Public | Get clothing by ID |
| POST | `/api/v1/clothing` | Admin | Create clothing |
| PUT | `/api/v1/clothing/:id` | Admin | Update clothing |
| DELETE | `/api/v1/clothing/:id` | Admin | Soft-delete clothing |
| POST | `/api/v1/orders` | User | Place order |
| GET | `/api/v1/orders` | User | My orders (paginated) |
| GET | `/api/v1/orders/:id` | User | Order details |
| PUT | `/api/v1/orders/:id/cancel` | User | Cancel pending order |
| GET | `/api/v1/admin/dashboard` | Admin | Dashboard stats |
| GET | `/api/v1/admin/orders` | Admin | All orders |
| PUT | `/api/v1/admin/orders/:id/status` | Admin | Update order status |
| GET | `/api/v1/admin/orders/recent` | Admin | Recent orders |
| GET | `/api/v1/admin/customers` | Admin | List customers |
| POST | `/api/v1/payments/*` | User | Razorpay create, verify, fail |
| GET | `/api/v1/reviews?productId=` | Public | Product reviews (paginated) |
| POST | `/api/v1/reviews` | User | Submit review |
| PUT | `/api/v1/reviews/:id` | User | Edit own review |
| DELETE | `/api/v1/reviews/:id` | User/Admin | Delete review |
| GET | `/api/v1/wishlist` | User | List wishlist |
| POST | `/api/v1/wishlist` | User | Add to wishlist |
| DELETE | `/api/v1/wishlist/:productId` | User | Remove from wishlist |
| POST | `/api/v1/images/upload` | Admin | Upload product images (Cloudinary) |
| DELETE | `/api/v1/images/:id` | Admin | Delete product image |

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 20+ |
| PostgreSQL | 14+ |
| npm | 10+ |
| Docker (optional) | 24+ |

## Quick Start

```bash
# Clone & install
git clone https://github.com/indosyn/navagunjara.git
cd navagunjara
npm install

# Database setup
cp .env.local.example .env.local   # or create .env.local manually (see Environment Variables)
npx prisma generate
npx prisma db push
npm run db:seed

# Start development server (UI + API on http://localhost:3000)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> **Note:** Next.js serves both the UI and all `/api/v1/*` routes in a single process.
> There is no separate backend to start — one command runs everything.

## Running in Pre-prod / Production Mode

```bash
# 1. Build the production bundle
npm run build

# 2. Start the production server (UI + API on http://localhost:3000)
npm start
```

### Using Docker Compose (recommended for pre-prod)

Spins up **PostgreSQL + the app** in one command:

```bash
# Start everything (builds the image on first run)
docker compose up -d

# Seed the database (first time only)
docker compose exec app npx prisma db push
docker compose exec app npm run db:seed

# View logs
docker compose logs -f app

# Stop
docker compose down
```

App available at [http://localhost:3000](http://localhost:3000).

### Pre-prod with External Database

```bash
# Set pre-prod database URL
$env:DATABASE_URL = "postgresql://user:pass@preprod-host:5432/navagunjara?schema=public"

# Build & start
npm run build
npm start
```

## Production Deployment

Before going live, work through this checklist. The app is designed to **fail fast at boot** when critical secrets are missing — that is by design (see [lib/env.ts](lib/env.ts)).

### 1. Environment variables

Copy [.env.example](.env.example) and populate every required value. Set in your platform's secret store (Vercel project env, AWS SSM, K8s `Secret`, etc.) — never commit a populated `.env` file.

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | ✅ | Pooled connection (e.g. PgBouncer transaction mode). |
| `NEXTAUTH_SECRET` | ✅ | **Min 32 chars.** Generate with `openssl rand -base64 32`. |
| `NEXTAUTH_URL` | ✅ | Public HTTPS URL of the deployment. |
| `NEXT_PUBLIC_APP_URL` | ✅ | Same as above. Used for Server Actions allowed origin + canonical URLs. |
| `RAZORPAY_KEY_ID` / `_SECRET` / `_WEBHOOK_SECRET` | ✅ | **Live** keys, not test. |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | ✅ | Live key id (client-side). |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` | ⚠️ | **Required for multi-instance / serverless.** Without it the rate limiter falls back to per-process in-memory state and bots will defeat it across replicas. |
| `CLOUDINARY_*` | optional | If absent, admin image uploads return 503. |
| `RESEND_API_KEY` | optional | If absent, order-confirmation emails are skipped. |

### 2. Database

```bash
# Apply schema (uses migrations if present, otherwise db push)
npx prisma migrate deploy

# Seed initial admin + demo data (requires SEED_ADMIN_PASSWORD + SEED_CUSTOMER_PASSWORD in env)
npm run db:seed
```

### 3. Build & start

```bash
npm ci
npx prisma generate
npm run build
npm start          # respects PORT, default 3000
```

Or the Docker image (includes `HEALTHCHECK` on `/api/health`):

```bash
docker build -t navagunjara .
docker run --env-file .env.production -p 3000:3000 navagunjara
```

### 4. Health check

`GET /api/health` returns `200 { success: true, data: { status: "UP" } }` when the app can serve traffic. Wire this into your load balancer / orchestrator liveness probe.

### 5. Razorpay webhooks

Configure your Razorpay dashboard webhook to point at `https://<your-domain>/api/v1/payments/webhook` and set the **same secret** as `RAZORPAY_WEBHOOK_SECRET`. The route uses timing-safe HMAC verification (see [lib/razorpay.ts](lib/razorpay.ts)).

### 6. Post-deploy smoke

```bash
curl -sf https://<your-domain>/api/health
curl -sf https://<your-domain>/api/v1/jewelry?page=0&size=1
```

Or run the Playwright smoke suite against the live URL:

```bash
PLAYWRIGHT_BASE_URL=https://<your-domain> npx playwright test
```

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start dev server — UI + API (Turbopack) |
| `npm run build` | Production build |
| `npm start` | Start production server — UI + API |
| `npm run lint` | ESLint check |
| `npm test` | Run Jest unit tests |
| `npm run test:watch` | Jest in watch mode |
| `npm run test:coverage` | Jest with coverage report |
| `npm run typecheck` | TypeScript strict check |
| `npm run docs` | Generate TypeDoc API documentation |
| `npm run docs:open` | Generate & open docs in browser |
| `npm run db:generate` | Regenerate Prisma client |
| `npm run db:push` | Push schema to database |
| `npm run db:seed` | Seed database |
| `npm run db:studio` | Open Prisma Studio |
| `docker compose up -d` | Start app + PostgreSQL via Docker |
| `npx playwright test` | Run E2E smoke tests |

## Testing

73 unit tests across 6 suites covering all services and utilities:

```bash
npm test              # Run all tests
npm run test:coverage # With coverage report
```

| Suite | Tests | Coverage |
|-------|-------|----------|
| `lib/utils` | 18 | apiSuccess, apiError, serializeDecimal, formatINR, capitalize, toTitleCase |
| `customer.service` | 13 | register, findById, findByEmail, update, changePassword, list |
| `jewelry.service` | 12 | list, search, findById, create, update, delete |
| `clothing.service` | 11 | list, search, findById, create, update, delete |
| `order.service` | 11 | place, findById, cancel, listByCustomer, listAll |
| `admin.service` | 8 | getDashboardStats, getRecentOrders |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_SECRET` | Auth.js session secret |
| `JWT_SECRET` | JWT signing key |
| `NEXTAUTH_URL` | Application base URL |
| `RAZORPAY_KEY_ID` | Razorpay public key |
| `RAZORPAY_KEY_SECRET` | Razorpay secret key |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay webhook HMAC secret |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Razorpay key (client-side) |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `RESEND_API_KEY` | Resend email API key |
| `RESEND_FROM_EMAIL` | Sender email address |

## API Documentation

### Interactive Swagger UI (Zod-OpenAPI)

Explore and test all API endpoints interactively via the auto-generated Swagger UI:

```bash
# 1. Start the dev server
npm run dev

# 2. Open the Swagger UI in your browser
start http://localhost:3000/api/docs

# 3. To get the raw OpenAPI JSON spec:
start http://localhost:3000/api/openapi
```

#### How to Test APIs in Swagger UI

1. Open [http://localhost:3000/api/docs](http://localhost:3000/api/docs)
2. **For public endpoints** (Login, Register, List Products) — click "Try it out", fill the body, click "Execute"
3. **For protected endpoints** (Orders, Admin, Wishlist):
   - First, call `POST /api/v1/auth/login` to get a JWT token
   - Click the **"Authorize"** button (top right 🔒)
   - Paste the token as: `Bearer <your-token>`
   - Now all protected endpoints will include the token automatically

The Swagger UI provides:
- **Try it out** — Execute API calls directly from the browser
- **Request/response examples** — See sample payloads and responses
- **Authentication** — Add your JWT token to test protected endpoints
- **Schema validation** — Auto-generated from Zod schemas

### TypeDoc (Code Documentation)

TypeDoc generates browsable code documentation from JSDoc comments:

```bash
# Generate docs to ./docs/
npm run docs

# Generate & open in browser
npm run docs:open
```

The generated docs cover all modules under `lib/`, `services/`, `types/`, `hooks/`, and `app/api/`. Open `docs/index.html` in any browser to browse.

## CI/CD Workflows

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| [release.yml](.github/workflows/release.yml) | Push to `main` | Create GitHub release |
| [hygiene.yml](.github/workflows/hygiene.yml) | PR / Push | Lint, typecheck, test |
| [branch-protection.yml](.github/workflows/branch-protection.yml) | PR | Branch rules enforcement |
| [deploy-dashboard.yml](.github/workflows/deploy-dashboard.yml) | Manual | Deploy dashboard |


## Postman & Swagger UI 

Import the collection and environment into Postman:

1. **Collection:** `collection/navagunjara.postman_collection.json`
2. **Environment:** `collection/navagunjara-preprod.postman_environment.json` (for pre-prod testing)
3. Run "Login" first — the test script auto-sets the `token` variable for subsequent requests.

> **Note:** For local development, use the Swagger UI at [http://localhost:3000/api/docs](http://localhost:3000/api/docs) instead — it's faster and requires no import.

---

**Author:** Anurag Muthyam · **Organization:** indosyn
