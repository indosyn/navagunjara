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
| 📦 Postman Collection | [collection/](collection/navagunjara-nextjs.postman_collection.json) |
| 🧰 Dev Environment | [navagunjara-dev](collection/navagunjara-dev.postman_environment.json) |
| 🧰 Pre-prod Environment | [navagunjara-preprod](collection/navagunjara-preprod.postman_environment.json) |
| 🗄️ Prisma Schema | [prisma/schema.prisma](prisma/schema.prisma) |
| 🌱 Database Seed | [prisma/seed.ts](prisma/seed.ts) |
| 🔐 Auth Config | [lib/auth.ts](lib/auth.ts) |
| 🎨 UI Components | [components/](components/) |
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
    ├── payments/     # Razorpay stubs (Phase 2)
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
| POST | `/api/v1/payments/*` | User | 501 — Phase 2 |

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 20+ |
| PostgreSQL | 14+ |
| npm | 10+ |

## Quick Start

```bash
# Clone & install
git clone <repository-url>
cd navagunjara
npm install

# Database setup
npx prisma generate
npx prisma db push
npm run db:seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start dev server (Turbopack) |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run lint` | ESLint check |
| `npm test` | Run Jest unit tests |
| `npm run test:watch` | Jest in watch mode |
| `npm run test:coverage` | Jest with coverage report |
| `npm run typecheck` | TypeScript strict check |
| `npm run db:generate` | Regenerate Prisma client |
| `npm run db:push` | Push schema to database |
| `npm run db:seed` | Seed database |
| `npm run db:studio` | Open Prisma Studio |

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
| `RAZORPAY_KEY_ID` | Razorpay public key (Phase 2) |
| `RAZORPAY_KEY_SECRET` | Razorpay secret key (Phase 2) |

## CI/CD Workflows

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| [release.yml](.github/workflows/release.yml) | Push to `main` | Create GitHub release |
| [hygiene.yml](.github/workflows/hygiene.yml) | PR / Push | Lint, typecheck, test |
| [branch-protection.yml](.github/workflows/branch-protection.yml) | PR | Branch rules enforcement |
| [deploy-dashboard.yml](.github/workflows/deploy-dashboard.yml) | Manual | Deploy dashboard |
| [aggregate-reports.yml](.github/workflows/aggregate-reports.yml) | Schedule | Aggregate reports |

## Postman

Import the collection and environment into Postman:

1. Collection: `collection/navagunjara-nextjs.postman_collection.json`
2. Environment: `collection/navagunjara-dev.postman_environment.json` (dev) or `collection/navagunjara-preprod.postman_environment.json` (pre-prod)
3. Run "Login" first — the test script auto-sets the `token` variable for subsequent requests.

---

**Author:** Anurag Muthyam · **Organization:** indosyn
