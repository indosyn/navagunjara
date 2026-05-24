/**
 * Unit tests for customer service.
 *
 * @module __tests__/services/customer.service.test
 * @author Anurag Muthyam
 * @organization indosyn
 */

import { mockDb } from "../mocks/db.mock";

// Must mock bcryptjs before importing the service
jest.mock("bcryptjs", () => ({
  hash: jest.fn().mockResolvedValue("$hashed$"),
  compare: jest.fn(),
}));

jest.mock("@/lib/logger", () => ({
  createLogger: () => ({
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
  }),
}));

import { customerService } from "@/services/customer.service";
import bcrypt from "bcryptjs";

const MOCK_CUSTOMER = {
  id: BigInt(1),
  firstName: "Ravi",
  lastName: "Kumar",
  email: "ravi@example.com",
  phone: "9876543210",
  password: "$hashed$",
  addressLine1: "123 MG Road",
  addressLine2: null,
  city: "Bangalore",
  state: "Karnataka",
  pincode: "560001",
  country: "IND",
  status: "ACTIVE",
  deletedAt: null,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

beforeEach(() => jest.clearAllMocks());

/* ── register ───────────────────────────────────────────────────────────── */
describe("customerService.register", () => {
  it("creates a customer and strips the password", async () => {
    (mockDb.customer.findUnique as jest.Mock).mockResolvedValue(null);
    (mockDb.customer.create as jest.Mock).mockResolvedValue(MOCK_CUSTOMER);

    const result = await customerService.register({
      firstName: "Ravi",
      lastName: "Kumar",
      email: "ravi@example.com",
      phone: "9876543210",
      password: "Secret123!",
      addressLine1: "123 MG Road",
      city: "Bangalore",
      state: "Karnataka",
      pincode: "560001",
    });

    expect(result).not.toHaveProperty("password");
    expect(result).toHaveProperty("email", "ravi@example.com");
    expect(mockDb.customer.create).toHaveBeenCalledTimes(1);
  });

  it("throws DUPLICATE_EMAIL when email already exists", async () => {
    (mockDb.customer.findUnique as jest.Mock).mockResolvedValue(MOCK_CUSTOMER);

    await expect(
      customerService.register({
        firstName: "Ravi",
        lastName: "Kumar",
        email: "ravi@example.com",
        phone: "9876543210",
        password: "Secret123!",
        addressLine1: "123 MG Road",
        city: "Bangalore",
        state: "Karnataka",
        pincode: "560001",
      })
    ).rejects.toThrow("DUPLICATE_EMAIL");
  });
});

/* ── findById ───────────────────────────────────────────────────────────── */
describe("customerService.findById", () => {
  it("returns customer without password", async () => {
    (mockDb.customer.findUnique as jest.Mock).mockResolvedValue(MOCK_CUSTOMER);

    const result = await customerService.findById("1");
    expect(result).not.toHaveProperty("password");
    expect(result).toHaveProperty("firstName", "Ravi");
  });

  it("throws NOT_FOUND when customer does not exist", async () => {
    (mockDb.customer.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(customerService.findById("999")).rejects.toThrow("NOT_FOUND");
  });
});

/* ── findByEmail ────────────────────────────────────────────────────────── */
describe("customerService.findByEmail", () => {
  it("delegates to Prisma findUnique", async () => {
    (mockDb.customer.findUnique as jest.Mock).mockResolvedValue(MOCK_CUSTOMER);

    const result = await customerService.findByEmail("ravi@example.com");
    expect(result).toEqual(MOCK_CUSTOMER);
  });

  it("returns null when not found", async () => {
    (mockDb.customer.findUnique as jest.Mock).mockResolvedValue(null);

    const result = await customerService.findByEmail("unknown@example.com");
    expect(result).toBeNull();
  });
});

/* ── update ──────────────────────────────────────────────────────────────── */
describe("customerService.update", () => {
  it("updates profile and strips password", async () => {
    const updated = { ...MOCK_CUSTOMER, firstName: "Ravi Updated" };
    (mockDb.customer.update as jest.Mock).mockResolvedValue(updated);

    const result = await customerService.update("1", {
      firstName: "Ravi Updated",
    });

    expect(result).toHaveProperty("firstName", "Ravi Updated");
    expect(result).not.toHaveProperty("password");
  });
});

/* ── changePassword ─────────────────────────────────────────────────────── */
describe("customerService.changePassword", () => {
  it("updates password when current password is valid", async () => {
    (mockDb.customer.findUnique as jest.Mock).mockResolvedValue(MOCK_CUSTOMER);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (mockDb.customer.update as jest.Mock).mockResolvedValue(MOCK_CUSTOMER);

    await expect(
      customerService.changePassword("1", {
        currentPassword: "OldPass123!",
        newPassword: "NewPass456!",
      })
    ).resolves.toBeUndefined();
  });

  it("throws INVALID_CURRENT_PASSWORD when wrong", async () => {
    (mockDb.customer.findUnique as jest.Mock).mockResolvedValue(MOCK_CUSTOMER);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(
      customerService.changePassword("1", {
        currentPassword: "WrongPass",
        newPassword: "NewPass456!",
      })
    ).rejects.toThrow("INVALID_CURRENT_PASSWORD");
  });

  it("throws NOT_FOUND when customer does not exist", async () => {
    (mockDb.customer.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(
      customerService.changePassword("999", {
        currentPassword: "Any",
        newPassword: "New123!",
      })
    ).rejects.toThrow("NOT_FOUND");
  });
});

/* ── list ────────────────────────────────────────────────────────────────── */
describe("customerService.list", () => {
  it("returns paginated results without passwords", async () => {
    (mockDb.customer.findMany as jest.Mock).mockResolvedValue([MOCK_CUSTOMER]);
    (mockDb.customer.count as jest.Mock).mockResolvedValue(1);

    const result = await customerService.list(0, 10);
    expect(result.totalElements).toBe(1);
    expect(result.totalPages).toBe(1);
    expect(result.content[0]).not.toHaveProperty("password");
  });

  it("calculates pagination correctly", async () => {
    (mockDb.customer.findMany as jest.Mock).mockResolvedValue([]);
    (mockDb.customer.count as jest.Mock).mockResolvedValue(25);

    const result = await customerService.list(1, 10);
    expect(result.totalPages).toBe(3);
    expect(result.page).toBe(1);
    expect(result.last).toBe(false);
  });

  it("marks last page correctly", async () => {
    (mockDb.customer.findMany as jest.Mock).mockResolvedValue([]);
    (mockDb.customer.count as jest.Mock).mockResolvedValue(10);

    const result = await customerService.list(0, 10);
    expect(result.last).toBe(true);
  });
});
