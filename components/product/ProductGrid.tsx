import { ProductCard } from "./ProductCard";

interface Product {
  id: string;
  name: string;
  price: string | number;
  imageUrl: string | null;
  productType: "JEWELRY" | "CLOTHING";
  stockQuantity: number;
}

interface ProductGridProps {
  products: Product[];
}

export function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-20">
        <svg className="mx-auto w-16 h-16 text-[var(--color-border)]" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
        <p className="mt-4 text-lg font-medium text-[var(--color-foreground)]">No products found</p>
        <p className="mt-1 text-sm text-[var(--color-muted)]">Try adjusting your filters or search terms</p>
      </div>
    );
  }

  return (
    <div
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
      style={{ contentVisibility: "auto", containIntrinsicSize: "auto 600px" }}
    >
      {products.map((p) => (
        <ProductCard key={p.id} {...p} />
      ))}
    </div>
  );
}
