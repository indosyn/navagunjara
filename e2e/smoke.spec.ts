/**
 * E2E smoke tests — verifies critical user flows.
 *
 * @author Anurag Muthyam
 * @organization indosyn
 */

import { test, expect } from "@playwright/test";

test.describe("Public Pages", () => {
  test("home page loads", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Navagunjara/i);
  });

  test("products page loads and shows filters", async ({ page }) => {
    await page.goto("/products");
    await expect(page.getByRole("heading", { name: "Products" })).toBeVisible();
    await expect(page.getByText("Filters")).toBeVisible();
  });

  test("product detail page loads", async ({ page }) => {
    await page.goto("/products");
    const firstProduct = page.locator("a[href^='/products/']").first();
    if (await firstProduct.isVisible()) {
      await firstProduct.click();
      await expect(page.getByRole("heading")).toBeVisible();
      await expect(page.getByText("Reviews")).toBeVisible();
    }
  });
});

test.describe("Auth Flow", () => {
  test("login page renders", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /login|sign in/i })).toBeVisible();
  });

  test("register page renders", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByRole("heading", { name: /register|sign up/i })).toBeVisible();
  });
});

test.describe("Cart", () => {
  test("cart page loads", async ({ page }) => {
    await page.goto("/cart");
    await expect(page.getByRole("heading", { name: /cart/i })).toBeVisible();
  });
});
