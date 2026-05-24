/**
 * Tests for ProductGrid empty/list states.
 *
 * @author Anurag Muthyam
 * @organization indosyn
 */

jest.mock("next-auth/react", () => ({ useSession: () => ({ data: null }) }));
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...(props as React.ImgHTMLAttributes<HTMLImageElement>)} />;
  },
}));
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

import { render, screen } from "@testing-library/react";
import { ProductGrid } from "@/components/product/ProductGrid";

describe("ProductGrid", () => {
  it("renders empty state", () => {
    render(<ProductGrid products={[]} />);
    expect(screen.getByText("No products found")).toBeInTheDocument();
  });

  it("renders product cards", () => {
    render(
      <ProductGrid
        products={[
          {
            id: "1",
            name: "Saree",
            price: 1000,
            imageUrl: null,
            productType: "CLOTHING",
            stockQuantity: 3,
          },
          {
            id: "2",
            name: "Ring",
            price: 5000,
            imageUrl: "https://x/y.jpg",
            productType: "JEWELRY",
            stockQuantity: 0,
          },
        ]}
      />
    );
    expect(screen.getByText("Saree")).toBeInTheDocument();
    expect(screen.getByText("Ring")).toBeInTheDocument();
    // Out-of-stock badge appears for second product
    expect(screen.getAllByText("Out of Stock").length).toBeGreaterThan(0);
  });
});
