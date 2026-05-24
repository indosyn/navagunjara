/**
 * Customer service — handles registration, lookup, profile updates, and
 * password management for platform customers.
 *
 * All returned objects have the `password` field stripped and BigInt / Decimal
 * values serialized to strings for JSON safety.
 *
 * @module services/customer.service
 * @author Anurag Muthyam
 * @organization indosyn
 */

import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { serializeDecimal } from "@/lib/utils";
import { createLogger } from "@/lib/logger";
import type {
  RegisterCustomerInput,
  UpdateCustomerInput,
  ChangePasswordInput,
} from "@/lib/validations";

const log = createLogger("customer.service");

export const customerService = {
  /**
   * Register a new customer account.
   *
   * @param data - Validated registration payload.
   * @returns The newly created customer (without password).
   * @throws `DUPLICATE_EMAIL` if the email is already taken.
   */
  async register(data: RegisterCustomerInput) {
    log.info({ email: data.email }, "register: attempting registration");

    const existing = await db.customer.findUnique({
      where: { email: data.email },
    });
    if (existing) {
      log.warn({ email: data.email }, "register: duplicate email");
      throw new Error("DUPLICATE_EMAIL");
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const customer = await db.customer.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        password: passwordHash,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2 ?? null,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        country: "IND",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    log.info({ id: customer.id.toString(), email: data.email }, "register: customer created");
    return omitPassword(serializeDecimal(customer) as Record<string, unknown>);
  },

  /**
   * Retrieve a single customer by primary key.
   *
   * @param id - Customer ID (BigInt as string).
   * @returns The customer record (without password).
   * @throws `NOT_FOUND` if no customer matches the ID.
   */
  async findById(id: string) {
    log.debug({ id }, "findById: looking up customer");

    const customer = await db.customer.findUnique({
      where: { id: BigInt(id) },
    });
    if (!customer) {
      log.warn({ id }, "findById: customer not found");
      throw new Error("NOT_FOUND");
    }

    log.debug({ id, email: customer.email }, "findById: found customer");
    return omitPassword(serializeDecimal(customer) as Record<string, unknown>);
  },

  /**
   * Retrieve a single customer by email address (used for auth).
   * Returns `null` for deactivated/anonymized accounts so they cannot log in.
   *
   * @param email - Customer's email.
   * @returns The raw Prisma customer or `null`.
   */
  async findByEmail(email: string) {
    log.debug({ email }, "findByEmail: looking up customer");
    const customer = await db.customer.findUnique({ where: { email } });
    if (!customer || customer.status !== "ACTIVE") {
      if (customer) {
        log.warn({ email, status: customer.status }, "findByEmail: inactive account ignored");
      }
      return null;
    }
    return customer;
  },

  /**
   * Update a customer's profile fields.
   *
   * @param id   - Customer ID.
   * @param data - Partial profile update payload.
   * @returns The updated customer (without password).
   */
  async update(id: string, data: UpdateCustomerInput) {
    log.info({ id }, "update: updating customer profile");

    const updated = await db.customer.update({
      where: { id: BigInt(id) },
      data: { ...data, updatedAt: new Date() },
    });

    log.info({ id }, "update: profile updated");
    return omitPassword(serializeDecimal(updated) as Record<string, unknown>);
  },

  /**
   * Change a customer's password after verifying the current one.
   *
   * @param id   - Customer ID.
   * @param data - Contains `currentPassword` and `newPassword`.
   * @throws `NOT_FOUND` if customer does not exist.
   * @throws `INVALID_CURRENT_PASSWORD` if the current password is wrong.
   */
  async changePassword(id: string, data: ChangePasswordInput) {
    log.info({ id }, "changePassword: password change requested");

    const customer = await db.customer.findUnique({
      where: { id: BigInt(id) },
    });
    if (!customer) {
      log.warn({ id }, "changePassword: customer not found");
      throw new Error("NOT_FOUND");
    }

    const valid = await bcrypt.compare(data.currentPassword, customer.password);
    if (!valid) {
      log.warn({ id }, "changePassword: invalid current password");
      throw new Error("INVALID_CURRENT_PASSWORD");
    }

    const newHash = await bcrypt.hash(data.newPassword, 12);
    await db.customer.update({
      where: { id: BigInt(id) },
      // Bump tokenVersion to invalidate all outstanding JWTs for this user.
      data: {
        password: newHash,
        tokenVersion: { increment: 1 },
        updatedAt: new Date(),
      },
    });

    log.info({ id }, "changePassword: password updated");
  },

  /**
   * List customers with server-side pagination (admin use).
   *
   * @param page - Zero-based page index.
   * @param size - Items per page.
   * @returns Paginated list of customers (without passwords).
   */
  async list(page: number, size: number) {
    log.debug({ page, size }, "list: fetching customer page");

    const [customers, total] = await Promise.all([
      db.customer.findMany({
        where: { status: "ACTIVE" },
        skip: page * size,
        take: size,
        orderBy: { createdAt: "desc" },
      }),
      db.customer.count({ where: { status: "ACTIVE" } }),
    ]);

    log.debug({ page, count: customers.length, total }, "list: fetched customers");
    return {
      content: customers.map((c) => omitPassword(serializeDecimal(c) as Record<string, unknown>)),
      page,
      size,
      totalElements: total,
      totalPages: Math.ceil(total / size),
      last: (page + 1) * size >= total,
    };
  },

  /**
   * Soft-delete a customer account. The row, orders, reviews, and wishlist
   * are all preserved — only the `status` flips to `DEACTIVATED` so the user
   * can no longer log in. This is the ONLY supported way to "delete" a
   * customer from application code. Hard `db.customer.delete()` calls are
   * forbidden and the database is configured with `onDelete: Restrict` on all
   * customer-owning tables so a stray delete will fail at the SQL level.
   *
   * @param id - Customer ID.
   * @returns The deactivated customer (without password).
   * @throws `NOT_FOUND` if customer does not exist.
   */
  async deactivate(id: string) {
    log.info({ id }, "deactivate: marking customer DEACTIVATED");
    const existing = await db.customer.findUnique({ where: { id: BigInt(id) } });
    if (!existing) {
      log.warn({ id }, "deactivate: customer not found");
      throw new Error("NOT_FOUND");
    }
    const updated = await db.customer.update({
      where: { id: BigInt(id) },
      data: { status: "DEACTIVATED", deletedAt: new Date(), updatedAt: new Date() },
    });
    log.info({ id }, "deactivate: account deactivated; history retained");
    return omitPassword(serializeDecimal(updated) as Record<string, unknown>);
  },

  /**
   * GDPR-style right-to-erasure: overwrite all personally-identifying fields
   * with placeholders while keeping the customer row (and therefore all
   * historical orders, invoices, and reviews) intact. The row's id is
   * preserved so foreign-key integrity is never violated.
   *
   * @param id - Customer ID.
   * @returns The anonymized customer (without password).
   * @throws `NOT_FOUND` if customer does not exist.
   */
  async anonymize(id: string) {
    log.info({ id }, "anonymize: scrubbing PII for customer");
    const existing = await db.customer.findUnique({ where: { id: BigInt(id) } });
    if (!existing) {
      log.warn({ id }, "anonymize: customer not found");
      throw new Error("NOT_FOUND");
    }
    const updated = await db.customer.update({
      where: { id: BigInt(id) },
      data: {
        firstName: "Deleted",
        lastName: "User",
        email: `deleted+${id}@navagunjara.invalid`,
        phone: "0000000000",
        password: "",
        addressLine1: null,
        addressLine2: null,
        city: null,
        state: null,
        pincode: null,
        status: "ANONYMIZED",
        deletedAt: new Date(),
        updatedAt: new Date(),
      },
    });
    log.info({ id }, "anonymize: PII scrubbed; order history retained");
    return omitPassword(serializeDecimal(updated) as Record<string, unknown>);
  },
};

/**
 * Strip the `password` field from a serialized customer record.
 * @internal
 */
function omitPassword(customer: Record<string, unknown>) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password: _pw, ...rest } = customer;
  return rest;
}
