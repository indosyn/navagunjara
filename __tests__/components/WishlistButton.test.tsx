/**
 * Tests for WishlistButton — useSession gate + add/remove fetch behaviour.
 *
 * @author Anurag Muthyam
 * @organization indosyn
 */

const useSession = jest.fn();
jest.mock("next-auth/react", () => ({ useSession: () => useSession() }));

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { WishlistButton } from "@/components/product/WishlistButton";

const fetchMock = jest.fn();
beforeAll(() => {
  (global as unknown as { fetch: jest.Mock }).fetch = fetchMock;
});

describe("WishlistButton", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    useSession.mockReset();
  });

  it("renders nothing when not signed in", () => {
    useSession.mockReturnValue({ data: null });
    const { container } = render(<WishlistButton productId="1" />);
    expect(container.firstChild).toBeNull();
  });

  it("hydrates wishlisted state from initial fetch", async () => {
    useSession.mockReturnValue({ data: { user: { id: "1" } } });
    fetchMock.mockResolvedValueOnce({
      json: async () => ({ success: true, data: [{ productId: 7 }] }),
    });
    render(<WishlistButton productId="7" />);
    await waitFor(() => {
      const btn = screen.getByRole("button");
      expect(btn).toHaveAttribute("aria-label", "Remove from wishlist");
    });
  });

  it("posts add when not wishlisted then becomes wishlisted", async () => {
    useSession.mockReturnValue({ data: { user: { id: "1" } } });
    fetchMock.mockResolvedValueOnce({
      json: async () => ({ success: true, data: [] }),
    });
    fetchMock.mockResolvedValueOnce({ ok: true });
    render(<WishlistButton productId="5" />);
    await waitFor(() => {
      expect(screen.getByRole("button")).toHaveAttribute("aria-label", "Add to wishlist");
    });
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => {
      expect(screen.getByRole("button")).toHaveAttribute("aria-label", "Remove from wishlist");
    });
    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/v1/wishlist",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("deletes when already wishlisted", async () => {
    useSession.mockReturnValue({ data: { user: { id: "1" } } });
    fetchMock.mockResolvedValueOnce({
      json: async () => ({ success: true, data: [{ productId: 5 }] }),
    });
    fetchMock.mockResolvedValueOnce({ ok: true });
    render(<WishlistButton productId="5" />);
    await waitFor(() => {
      expect(screen.getByRole("button")).toHaveAttribute("aria-label", "Remove from wishlist");
    });
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => {
      expect(screen.getByRole("button")).toHaveAttribute("aria-label", "Add to wishlist");
    });
    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/v1/wishlist/5",
      expect.objectContaining({ method: "DELETE" })
    );
  });

  it("ignores hydrate fetch errors", async () => {
    useSession.mockReturnValue({ data: { user: { id: "1" } } });
    fetchMock.mockRejectedValueOnce(new Error("network"));
    render(<WishlistButton productId="9" />);
    await waitFor(() => {
      expect(screen.getByRole("button")).toBeInTheDocument();
    });
  });

  it("ignores toggle fetch errors", async () => {
    useSession.mockReturnValue({ data: { user: { id: "1" } } });
    fetchMock.mockResolvedValueOnce({
      json: async () => ({ success: true, data: [] }),
    });
    fetchMock.mockRejectedValueOnce(new Error("net"));
    render(<WishlistButton productId="9" />);
    await waitFor(() => {
      expect(screen.getByRole("button")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button"));
    // Button should be re-enabled after error
    await waitFor(() => {
      expect(screen.getByRole("button")).not.toBeDisabled();
    });
  });
});
