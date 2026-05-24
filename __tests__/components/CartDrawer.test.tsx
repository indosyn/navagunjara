/**
 * Tests for CartDrawer — empty + populated + quantity ops.
 *
 * @author Anurag Muthyam
 * @organization indosyn
 */

interface CartItem {
  productId: string;
  name: string;
  price: number;
  imageUrl: string | null;
  productType: "JEWELRY" | "CLOTHING";
  quantity: number;
}
const state = {
  items: [] as CartItem[],
  removeItem: jest.fn(),
  updateQuantity: jest.fn(),
  totalPrice: () => state.items.reduce((s, i) => s + i.price * i.quantity, 0),
};

jest.mock("@/hooks/useCart", () => ({
  useCart: (selector: (s: typeof state) => unknown) => selector(state),
}));
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, onClick }: { children: React.ReactNode; href: string; onClick?: () => void }) => (
    <a href={href} onClick={onClick}>{children}</a>
  ),
}));

import { render, screen, fireEvent } from "@testing-library/react";
import { CartDrawer } from "@/components/cart/CartDrawer";

describe("CartDrawer", () => {
  beforeEach(() => {
    state.items = [];
    state.removeItem.mockReset();
    state.updateQuantity.mockReset();
  });

  it("renders empty state when no items", () => {
    render(<CartDrawer open onClose={() => {}} />);
    expect(screen.getByText("Your cart is empty")).toBeInTheDocument();
  });

  it("does not render overlay when closed", () => {
    const { container } = render(<CartDrawer open={false} onClose={() => {}} />);
    expect(container.querySelector("[aria-hidden='true']")).toBeNull();
  });

  it("renders items + total + invokes update/remove", () => {
    state.items = [
      {
        productId: "1",
        name: "Ring",
        price: 1000,
        imageUrl: null,
        productType: "JEWELRY",
        quantity: 2,
      },
    ];
    const onClose = jest.fn();
    render(<CartDrawer open onClose={onClose} />);

    expect(screen.getByText("Ring")).toBeInTheDocument();
    expect(screen.getAllByText(/2,000/).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByLabelText("Increase quantity"));
    expect(state.updateQuantity).toHaveBeenCalledWith("1", 3);

    fireEvent.click(screen.getByLabelText("Decrease quantity"));
    expect(state.updateQuantity).toHaveBeenCalledWith("1", 1);

    fireEvent.click(screen.getByText("Remove"));
    expect(state.removeItem).toHaveBeenCalledWith("1");

    fireEvent.click(screen.getByLabelText("Close cart"));
    expect(onClose).toHaveBeenCalled();
  });

  it("invokes onClose when overlay clicked", () => {
    const onClose = jest.fn();
    render(<CartDrawer open onClose={onClose} />);
    const overlay = document.querySelector("[aria-hidden='true']")!;
    fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalled();
  });
});
