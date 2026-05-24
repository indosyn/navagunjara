/**
 * Tests for RazorpayCheckout — SDK gating, initiate, success, failure paths.
 *
 * @author Anurag Muthyam
 * @organization indosyn
 */

const useSession = jest.fn();
jest.mock("next-auth/react", () => ({ useSession: () => useSession() }));

import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { RazorpayCheckout } from "@/components/payment/RazorpayCheckout";

const fetchMock = jest.fn();

interface RzpHandlers { [k: string]: (e: unknown) => unknown }
interface RzpOptions { handler: (resp: unknown) => unknown; modal?: { ondismiss?: () => void } }
let lastRzp: { open: jest.Mock; on: jest.Mock; _options: RzpOptions; _handlers: RzpHandlers };

beforeAll(() => {
  (global as unknown as { fetch: jest.Mock }).fetch = fetchMock;
  (window as unknown as { Razorpay: jest.Mock }).Razorpay = jest.fn().mockImplementation((opts: RzpOptions) => {
    const handlers: RzpHandlers = {};
    lastRzp = {
      open: jest.fn(),
      on: jest.fn((ev: string, cb: (e: unknown) => unknown) => {
        handlers[ev] = cb;
      }),
      _options: opts,
      _handlers: handlers,
    };
    return lastRzp;
  });
});

describe("RazorpayCheckout", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    useSession.mockReset();
    useSession.mockReturnValue({
      data: { user: { firstName: "P", lastName: "S", email: "c@x.com" } },
    });
  });

  it("renders enabled with amount", () => {
    render(<RazorpayCheckout orderId="1" amount={10000} onSuccess={jest.fn()} onFailure={jest.fn()} />);
    expect(screen.getByRole("button", { name: /Pay/ })).toBeInTheDocument();
  });

  it("does nothing when not signed in", () => {
    useSession.mockReturnValue({ data: null });
    const onSuccess = jest.fn();
    render(<RazorpayCheckout orderId="1" amount={1} onSuccess={onSuccess} onFailure={jest.fn()} />);
    fireEvent.click(screen.getByRole("button"));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("onFailure when initiate fails", async () => {
    const onFailure = jest.fn();
    fetchMock.mockResolvedValueOnce({ ok: false, json: async () => ({ message: "ORDER_NOT_PENDING" }) });
    render(<RazorpayCheckout orderId="1" amount={1} onSuccess={jest.fn()} onFailure={onFailure} />);
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(onFailure).toHaveBeenCalledWith("ORDER_NOT_PENDING"));
  });

  it("opens Razorpay; success handler verifies and calls onSuccess", async () => {
    const onSuccess = jest.fn();
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            keyId: "rzp_test",
            amount: 100,
            razorpayOrderId: "ord_x",
            payment: { id: "p1" },
          },
        }),
      })
      .mockResolvedValueOnce({ ok: true });
    render(<RazorpayCheckout orderId="1" amount={100} onSuccess={onSuccess} onFailure={jest.fn()} />);
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(lastRzp).toBeDefined());
    await act(async () => {
      await lastRzp._options.handler({
        razorpay_order_id: "ord_x",
        razorpay_payment_id: "pay_x",
        razorpay_signature: "sig",
      });
    });
    expect(onSuccess).toHaveBeenCalled();
  });

  it("verify failure calls onFailure", async () => {
    const onFailure = jest.fn();
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { amount: 1, razorpayOrderId: "ord", payment: { id: "p1" } },
        }),
      })
      .mockResolvedValueOnce({ ok: false });
    render(<RazorpayCheckout orderId="1" amount={1} onSuccess={jest.fn()} onFailure={onFailure} />);
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(lastRzp).toBeDefined());
    await act(async () => {
      await lastRzp._options.handler({
        razorpay_order_id: "x",
        razorpay_payment_id: "x",
        razorpay_signature: "x",
      });
    });
    expect(onFailure).toHaveBeenCalledWith("Payment verification failed");
  });

  it("payment.failed handler records failure", async () => {
    const onFailure = jest.fn();
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { amount: 1, razorpayOrderId: "ord", payment: { id: "p1" } },
        }),
      })
      .mockResolvedValueOnce({ ok: true });
    render(<RazorpayCheckout orderId="1" amount={1} onSuccess={jest.fn()} onFailure={onFailure} />);
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(lastRzp).toBeDefined());
    await act(async () => {
      await lastRzp._handlers["payment.failed"]({ error: { description: "card declined" } });
    });
    expect(onFailure).toHaveBeenCalledWith("card declined");
  });

  it("network error calls onFailure", async () => {
    const onFailure = jest.fn();
    fetchMock.mockRejectedValueOnce(new Error("net"));
    render(<RazorpayCheckout orderId="1" amount={1} onSuccess={jest.fn()} onFailure={onFailure} />);
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(onFailure).toHaveBeenCalledWith("Something went wrong"));
  });
});
