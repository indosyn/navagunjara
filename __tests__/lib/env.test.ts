/**
 * Tests for env validation.
 *
 * @module __tests__/lib/env.test
 * @author Anurag Muthyam
 * @organization indosyn
 */

describe("env (dev defaults)", () => {
  it("populates dev defaults for missing required-in-prod fields", async () => {
    jest.resetModules();
    const original = { ...process.env };
    // @ts-expect-error - NODE_ENV is read-only but we need to mock it
    process.env.NODE_ENV = "test";
    process.env.DATABASE_URL = "postgresql://test";
    delete process.env.NEXTAUTH_SECRET;
    delete process.env.RAZORPAY_KEY_ID;
    delete process.env.RAZORPAY_KEY_SECRET;
    delete process.env.RAZORPAY_WEBHOOK_SECRET;

    const { env } = await import("@/lib/env");
    expect(env.NEXTAUTH_SECRET).toBe("dev-secret-do-not-use-in-prod-min-32-chars!");
    expect(env.RAZORPAY_KEY_ID).toBe("rzp_test_dev_placeholder");
    expect(env.RAZORPAY_KEY_SECRET).toBe("rzp_test_secret_dev_placeholder");
    expect(env.RAZORPAY_WEBHOOK_SECRET).toBe("rzp_webhook_secret_dev_placeholder");

    process.env = original;
  });

  it("respects explicit env values when provided", async () => {
    jest.resetModules();
    const original = { ...process.env };
    // @ts-expect-error - NODE_ENV is read-only but we need to mock it
    process.env.NODE_ENV = "test";
    process.env.DATABASE_URL = "postgresql://test";
    process.env.NEXTAUTH_SECRET = "real-secret";
    process.env.RAZORPAY_KEY_ID = "rzp_id";
    process.env.RAZORPAY_KEY_SECRET = "rzp_sec";
    process.env.RAZORPAY_WEBHOOK_SECRET = "rzp_web";

    const { env } = await import("@/lib/env");
    expect(env.NEXTAUTH_SECRET).toBe("real-secret");
    expect(env.RAZORPAY_KEY_ID).toBe("rzp_id");

    process.env = original;
  });

  it("applies default for RESEND_FROM_EMAIL", async () => {
    jest.resetModules();
    const original = { ...process.env };
    // @ts-expect-error - NODE_ENV is read-only but we need to mock it
    process.env.NODE_ENV = "test";
    process.env.DATABASE_URL = "postgresql://test";
    delete process.env.RESEND_FROM_EMAIL;
    const { env } = await import("@/lib/env");
    expect(env.RESEND_FROM_EMAIL).toBe("orders@navagunjara.com");
    process.env = original;
  });

  it("applies default for NEXT_PUBLIC_APP_URL", async () => {
    jest.resetModules();
    const original = { ...process.env };
    // @ts-expect-error - NODE_ENV is read-only but we need to mock it
    process.env.NODE_ENV = "test";
    process.env.DATABASE_URL = "postgresql://test";
    delete process.env.NEXT_PUBLIC_APP_URL;
    const { env } = await import("@/lib/env");
    expect(env.NEXT_PUBLIC_APP_URL).toBe("http://localhost:3000");
    process.env = original;
  });
});
