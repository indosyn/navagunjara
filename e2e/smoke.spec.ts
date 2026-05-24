/**
 * E2E smoke tests — exercises critical public flows end-to-end.
 *
 * Scope (intentionally narrow — these run on every deploy):
 *   1. Home, products list, product detail render
 *   2. Login + signup pages render and accept input
 *   3. Customer login → My Account loads
 *   4. Add-to-cart from product detail → cart page reflects item → checkout
 *      page reachable (we stop short of actually charging Razorpay)
 *
 * The suite assumes the seed data from `prisma/seed.ts` is present:
 *   - admin: SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD
 *   - customer: SEED_CUSTOMER_EMAIL / SEED_CUSTOMER_PASSWORD
 *
 * @author Anurag Muthyam
 * @organization indosyn
 */

import { test, expect, type Page } from "@playwright/test";

const CUSTOMER_EMAIL =
  process.env.SEED_CUSTOMER_EMAIL || "priya@example.com";
const CUSTOMER_PASSWORD =
  process.env.SEED_CUSTOMER_PASSWORD || "Customer@123-dev-only";

// ────────────────────────────────────────────────────────────────────────────
// Public pages
// ────────────────────────────────────────────────────────────────────────────

test.describe("Public pages", () => {
  test("home page loads with brand title", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Navagunjara/i);
  });

  test("products page lists items and shows filters", async ({ page }) => {
    await page.goto("/products");
    await expect(
      page.getByRole("heading", { name: "Products", level: 1 })
    ).toBeVisible();
    await expect(page.getByText(/Filters/i)).toBeVisible();
    // At least one product card should render from seeded data.
    await expect(page.locator("a[href^='/products/']").first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test("product detail page shows price and reviews section", async ({
    page,
  }) => {
    await page.goto("/products");
    await page.locator("a[href^='/products/']").first().click();
    await page.waitForURL(/\/products\/\d+/);
    await expect(page.getByText(/₹|Rs\.?/).first()).toBeVisible();
    await expect(page.getByText(/Reviews/i).first()).toBeVisible();
  });

  test("health endpoint responds 200", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.status).toBe("UP");
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Auth pages
// ────────────────────────────────────────────────────────────────────────────

test.describe("Auth pages", () => {
  test("login page renders email + password + Sign In", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByText(/Welcome back!? Sign in/i)).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /sign in/i })
    ).toBeVisible();
  });

  test("signup page renders the form and Create Account button", async ({
    page,
  }) => {
    await page.goto("/signup");
    await expect(page.getByText(/Create your account/i)).toBeVisible();
    await expect(page.getByLabel(/Email/i)).toBeVisible();
    await expect(
      page.getByRole("button", { name: /create account/i })
    ).toBeVisible();
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Authenticated customer flow
// ────────────────────────────────────────────────────────────────────────────

/**
 * Submit the credentials form on /login and wait for the post-auth redirect.
 * Auth.js redirects to `/` by default after a successful credentials login.
 */
async function loginAs(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
  // Wait until we're either on home, account, or somewhere not /login.
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), {
    timeout: 15_000,
  });
}

test.describe("Customer flow (requires seed data)", () => {
  test("customer can log in and reach their account page", async ({ page }) => {
    await loginAs(page, CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
    await page.goto("/account");
    // Account page should not bounce back to /login.
    await expect(page).not.toHaveURL(/\/login/);
  });

  test("add-to-cart → cart page shows item → checkout reachable", async ({
    page,
  }) => {
    // Cart is persisted in localStorage (Zustand persist middleware) so the
    // add-to-cart half doesn't require auth.
    await page.goto("/products");
    await page.locator("a[href^='/products/']").first().click();
    await page.waitForURL(/\/products\/\d+/);

    const addBtn = page.getByRole("button", { name: /add to cart/i });
    await expect(addBtn).toBeVisible({ timeout: 10_000 });
    await addBtn.click();

    await page.goto("/cart");
    await expect(
      page.getByRole("heading", { name: /shopping cart/i })
    ).toBeVisible();
    await expect(page.getByText(/your cart is empty/i)).toHaveCount(0);

    // Checkout requires auth — log in then navigate.
    await loginAs(page, CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
    await page.goto("/checkout");
    await expect(page).not.toHaveURL(/\/login/);
  });
});
