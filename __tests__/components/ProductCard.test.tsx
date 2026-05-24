/**
 * Tests for ProductCard add-to-cart + image fallback.
 *
 * @author Anurag Muthyam
 * @organization indosyn
 */

const addItem = jest.fn();
jest.mock("@/hooks/useCart", () => ({
  useCart: (selector: (s: { addItem: jest.Mock }) => unknown) =>
    selector({ addItem }),
}));
jest.mock("@/components/ui/Toast", () => ({ showToast: jest.fn() }));
jest.mock("next-auth/react", () => ({ useSession: () => ({ data: null }) }));
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => (
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    <img {...(props as React.ImgHTMLAttributes<HTMLImageElement>)} />
  ),
}));
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

import { render, screen, fireEvent } from "@testing-library/react";
import { ProductCard } from "@/components/product/ProductCard";

describe("ProductCard", () => {
  beforeEach(() => addItem.mockClear());

  it("renders name + price + JEWELRY badge", () => {
    render(
      <ProductCard
        id="1"
        name="Ring"
        price={5000}
        imageUrl="https://x.jpg"
        productType="JEWELRY"
        stockQuantity={3}
      />
    );
    expect(screen.getByText("Ring")).toBeInTheDocument();
    expect(screen.getByText(/JEWELRY/)).toBeInTheDocument();
  });

  it("adds to cart on click", () => {
    render(
      <ProductCard
        id="1"
        name="Ring"
        price={5000}
        imageUrl="https://x.jpg"
        productType="JEWELRY"
        stockQuantity={3}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /Add to Cart/ }));
    expect(addItem).toHaveBeenCalledWith({
      productId: "1",
      name: "Ring",
      price: 5000,
      imageUrl: "https://x.jpg",
      productType: "JEWELRY",
    });
  });

  it("renders fallback icon when no imageUrl", () => {
    render(
      <ProductCard
        id="1"
        name="X"
        price={1}
        imageUrl={null}
        productType="CLOTHING"
        stockQuantity={1}
      />
    );
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("shows Out of Stock when stockQuantity = 0", () => {
    render(
      <ProductCard
        id="1"
        name="X"
        price={1}
        imageUrl={null}
        productType="CLOTHING"
        stockQuantity={0}
      />
    );
    expect(screen.getAllByText("Out of Stock").length).toBeGreaterThan(0);
    const btn = screen.getByRole("button", { name: "Out of Stock" });
    expect(btn).toBeDisabled();
  });
});
