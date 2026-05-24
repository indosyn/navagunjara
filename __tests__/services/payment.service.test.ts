/**
 * Unit tests for payment service.
 *
 * @module __tests__/services/payment.service.test
 * @author Anurag Muthyam
 * @organization indosyn
 */

import { mockDb } from "../mocks/db.mock";

jest.mock("@/lib/logger", () => ({
  createLogger: () => ({ info: jest.fn(), warn: jest.fn(), debug: jest.fn(), error: jest.fn() }),
}));

const mockRzpCreate = jest.fn();
const mockVerifySig = jest.fn();
jest.mock("@/lib/razorpay", () => ({
  razorpay: { orders: { create: (...a: unknown[]) => mockRzpCreate(...a) } },
  verifySignature: (...a: unknown[]) => mockVerifySig(...a),
}));

import { paymentService } from "@/services/payment.service";

const MOCK_ORDER = {
  id: BigInt(20),
  status: "PENDING",
  totalAmount: "1500.00",
};

const MOCK_PAYMENT = {
  id: BigInt(7),
  orderId: BigInt(20),
  amount: "1500.00",
  currency: "INR",
  method: "UPI",
  status: "PENDING",
  razorpayOrderId: "rzp_order_x",
  initiatedAt: new Date("2024-01-01"),
};

beforeEach(() => jest.clearAllMocks());

describe("paymentService.createOrder", () => {
  it("creates rzp order and payment record", async () => {
    (mockDb.order.findUnique as jest.Mock).mockResolvedValue(MOCK_ORDER);
    (mockDb.payment.findFirst as jest.Mock).mockResolvedValue(null);
    mockRzpCreate.mockResolvedValue({ id: "rzp_order_x" });
    (mockDb.payment.create as jest.Mock).mockResolvedValue(MOCK_PAYMENT);

    const res = await paymentService.createOrder("20", "UPI") as { razorpayOrderId: string; amount: number };
    expect(res.razorpayOrderId).toBe("rzp_order_x");
    expect(res.amount).toBe(150000); // 1500 * 100
    expect(mockRzpCreate).toHaveBeenCalledWith(expect.objectContaining({ amount: 150000, currency: "INR" }));
  });

  it("throws ORDER_NOT_FOUND", async () => {
    (mockDb.order.findUnique as jest.Mock).mockResolvedValue(null);
    await expect(paymentService.createOrder("20", "UPI")).rejects.toThrow("ORDER_NOT_FOUND");
  });

  it("throws ORDER_NOT_PENDING when status not PENDING", async () => {
    (mockDb.order.findUnique as jest.Mock).mockResolvedValue({ ...MOCK_ORDER, status: "CONFIRMED" });
    await expect(paymentService.createOrder("20", "UPI")).rejects.toThrow("ORDER_NOT_PENDING");
  });

  it("returns existing pending payment instead of creating new", async () => {
    (mockDb.order.findUnique as jest.Mock).mockResolvedValue(MOCK_ORDER);
    (mockDb.payment.findFirst as jest.Mock).mockResolvedValue(MOCK_PAYMENT);
    const res = await paymentService.createOrder("20", "UPI") as { razorpayOrderId: string };
    expect(res.razorpayOrderId).toBe("rzp_order_x");
    expect(mockRzpCreate).not.toHaveBeenCalled();
    expect(mockDb.payment.create).not.toHaveBeenCalled();
  });
});

describe("paymentService.verify", () => {
  const VERIFY_INPUT = {
    razorpay_order_id: "rzp_order_x",
    razorpay_payment_id: "rzp_pay_y",
    razorpay_signature: "sig",
    orderId: "20",
  };

  it("verifies and confirms order", async () => {
    mockVerifySig.mockReturnValue(true);
    (mockDb.payment.findFirst as jest.Mock).mockResolvedValue(MOCK_PAYMENT);
    (mockDb.$transaction as jest.Mock).mockResolvedValue([{ ...MOCK_PAYMENT, status: "SUCCESS" }, MOCK_ORDER]);

    const res = await paymentService.verify(VERIFY_INPUT) as { status: string };
    expect(res.status).toBe("SUCCESS");
    expect(mockDb.$transaction).toHaveBeenCalled();
  });

  it("throws INVALID_SIGNATURE when signature mismatch", async () => {
    mockVerifySig.mockReturnValue(false);
    await expect(paymentService.verify(VERIFY_INPUT)).rejects.toThrow("INVALID_SIGNATURE");
  });

  it("throws PAYMENT_NOT_FOUND when payment missing", async () => {
    mockVerifySig.mockReturnValue(true);
    (mockDb.payment.findFirst as jest.Mock).mockResolvedValue(null);
    await expect(paymentService.verify(VERIFY_INPUT)).rejects.toThrow("PAYMENT_NOT_FOUND");
  });

  it("throws ORDER_MISMATCH when claimed orderId differs from payment", async () => {
    mockVerifySig.mockReturnValue(true);
    (mockDb.payment.findFirst as jest.Mock).mockResolvedValue({ ...MOCK_PAYMENT, orderId: BigInt(99) });
    await expect(paymentService.verify(VERIFY_INPUT)).rejects.toThrow("ORDER_MISMATCH");
  });
});

describe("paymentService.findByOrderId", () => {
  it("returns payments for an order", async () => {
    (mockDb.payment.findMany as jest.Mock).mockResolvedValue([MOCK_PAYMENT]);
    const res = await paymentService.findByOrderId("20");
    expect(res).toHaveLength(1);
  });
});

describe("paymentService.markFailed", () => {
  it("marks payment failed", async () => {
    (mockDb.payment.findUnique as jest.Mock).mockResolvedValue(MOCK_PAYMENT);
    (mockDb.payment.update as jest.Mock).mockResolvedValue({ ...MOCK_PAYMENT, status: "FAILED" });
    const res = await paymentService.markFailed("7", "user cancelled") as { status: string };
    expect(res.status).toBe("FAILED");
  });

  it("throws PAYMENT_NOT_FOUND when missing", async () => {
    (mockDb.payment.findUnique as jest.Mock).mockResolvedValue(null);
    await expect(paymentService.markFailed("7", "x")).rejects.toThrow("PAYMENT_NOT_FOUND");
  });

  it("throws PAYMENT_NOT_FOUND for non-numeric id", async () => {
    await expect(paymentService.markFailed("placeholder-id", "x")).rejects.toThrow("PAYMENT_NOT_FOUND");
  });
});
