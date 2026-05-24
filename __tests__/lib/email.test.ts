/** @jest-environment node */
/**
 * Tests for `lib/email.ts` — Resend wrappers.
 *
 * @author Anurag Muthyam
 * @organization indosyn
 */

jest.mock("resend", () => {
  const send = jest.fn();
  return {
    Resend: jest.fn().mockImplementation(() => ({ emails: { send } })),
    __send: send,
  };
});
jest.mock("@/lib/logger", () => ({
  createLogger: () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() }),
}));

import {
  sendOrderConfirmation,
  sendShippingNotification,
  sendDeliveryConfirmation,
} from "@/lib/email";

const send = (jest.requireMock("resend") as { __send: jest.Mock }).__send;

describe("email helpers", () => {
  beforeEach(() => {
    send.mockReset();
    send.mockResolvedValue({ id: "msg" });
  });

  it("sendOrderConfirmation sends email", async () => {
    await sendOrderConfirmation("c@x.com", "ord-1", "100", 2);
    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][0].subject).toMatch(/Order Confirmed/);
  });

  it("sendOrderConfirmation swallows send errors", async () => {
    send.mockRejectedValueOnce(new Error("smtp"));
    await expect(sendOrderConfirmation("c@x.com", "1", "1", 1)).resolves.toBeUndefined();
  });

  it("sendShippingNotification sends email", async () => {
    await sendShippingNotification("c@x.com", "ord-1");
    expect(send.mock.calls[0][0].subject).toMatch(/Shipped/);
  });

  it("sendShippingNotification swallows send errors", async () => {
    send.mockRejectedValueOnce(new Error("smtp"));
    await expect(sendShippingNotification("c@x.com", "1")).resolves.toBeUndefined();
  });

  it("sendDeliveryConfirmation sends email", async () => {
    await sendDeliveryConfirmation("c@x.com", "ord-1");
    expect(send.mock.calls[0][0].subject).toMatch(/Delivered/);
  });

  it("sendDeliveryConfirmation swallows send errors", async () => {
    send.mockRejectedValueOnce(new Error("smtp"));
    await expect(sendDeliveryConfirmation("c@x.com", "1")).resolves.toBeUndefined();
  });
});
