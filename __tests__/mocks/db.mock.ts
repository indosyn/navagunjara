/**
 * Shared Prisma mock for service unit tests.
 *
 * Provides a deep-mock of PrismaClient with Jest auto-mock functions
 * on every model method. Import this in service test files and configure
 * return values per test.
 *
 * @module __tests__/mocks/db.mock
 * @author Anurag Muthyam
 * @organization indosyn
 */

import { jest } from "@jest/globals";

const mockDb = {
  customer: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  product: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  order: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
  },
  $transaction: jest.fn(),
};

jest.mock("@/lib/db", () => ({
  db: mockDb,
}));

export { mockDb };
