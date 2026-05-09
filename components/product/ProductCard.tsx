"use client";

import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useCart } from "@/hooks/useCart";
import { formatINR } from "@/lib/utils";
import { WishlistButton } from "@/components/product/WishlistButton";
import { showToast } from "@/components/ui/Toast";

interface ProductCardProps {
  id: string;
  name: string;
  price: string | number;
  imageUrl: string | null;
  productType: "JEWELRY" | "CLOTHING";
  stockQuantity: number;
}

export function ProductCard({
  id,
  name,
  price,
  imageUrl,
  productType,
  stockQuantity,
}: ProductCardProps) {
  const addItem = useCart((s) => s.addItem);
  const outOfStock = stockQuantity <= 0;

  return (
    <div className="group rounded-xl border border-[var(--color-border)] bg-white overflow-hidden card-hover">
      <Link href={`/products/${id}`} className="block">
        <div className="relative aspect-square bg-[var(--color-surface-raised)] overflow-hidden">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={name}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover img-zoom"
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-gradient-to-br from-[var(--color-primary-50)] to-[var(--color-primary-100)]">
              <svg className="w-12 h-12 text-[var(--color-primary)]/20" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
              </svg>
            </div>
          )}
          <Badge label={productType} className="absolute top-3 left-3" />
          {outOfStock ? (
            <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
              <span className="text-sm font-semibold text-[var(--color-muted)] bg-white/90 px-3 py-1 rounded-full">
                Out of Stock
              </span>
            </div>
          ) : null}
        </div>
      </Link>
      <div className="p-4">
        <div className="flex items-start justify-between gap-1">
          <Link href={`/products/${id}`} className="flex-1 min-w-0">
            <h3 className="font-medium text-[var(--color-foreground)] truncate group-hover:text-[var(--color-primary)] transition-colors">
              {name}
            </h3>
          </Link>
          <WishlistButton productId={id} className="text-lg ml-1 shrink-0" />
        </div>
        <p className="mt-1 text-lg font-semibold text-[var(--color-primary)]">
          {formatINR(price)}
        </p>
        <Button
          variant={outOfStock ? "ghost" : "primary"}
          size="sm"
          className="w-full mt-3"
          disabled={outOfStock}
          onClick={() => {
            addItem({
              productId: id,
              name,
              price: Number(price),
              imageUrl,
              productType,
            });
            showToast(`${name} added to cart`);
          }}
        >
          {outOfStock ? "Out of Stock" : "Add to Cart"}
        </Button>
      </div>
    </div>
  );
}
