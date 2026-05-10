"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useCart } from "@/hooks/useCart";
import { formatINR } from "@/lib/utils";
import { ReviewSection } from "@/components/product/ReviewSection";
import { WishlistButton } from "@/components/product/WishlistButton";

function DetailSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12">
      <div className="grid md:grid-cols-2 gap-8 md:gap-12">
        <div className="aspect-square rounded-2xl animate-shimmer" />
        <div className="space-y-4 py-4">
          <div className="h-6 w-20 bg-gray-100 rounded-full" />
          <div className="h-8 w-3/4 bg-gray-100 rounded-lg" />
          <div className="h-8 w-1/3 bg-gray-100 rounded-lg" />
          <div className="h-20 w-full bg-gray-100 rounded-lg mt-4" />
          <div className="h-12 w-40 bg-gray-100 rounded-lg mt-6" />
        </div>
      </div>
    </div>
  );
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const addItem = useCart((s) => s.addItem);
  const [product, setProduct] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [jRes, cRes] = await Promise.all([
        fetch(`/api/v1/jewelry/${id}`),
        fetch(`/api/v1/clothing/${id}`),
      ]);
      if (jRes.ok) {
        const json = await jRes.json();
        setProduct({ ...json.data, productType: "JEWELRY" });
      } else if (cRes.ok) {
        const json = await cRes.json();
        setProduct({ ...json.data, productType: "CLOTHING" });
      }
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) {
    return <DetailSkeleton />;
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 text-center">
        <svg className="mx-auto w-16 h-16 text-[var(--color-border)]" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
        <h2 className="mt-4 text-2xl font-bold text-[var(--color-foreground)]">Product not found</h2>
        <p className="mt-2 text-[var(--color-muted)]">The product you are looking for does not exist or has been removed.</p>
      </div>
    );
  }

  const outOfStock = Number(product.stockQuantity ?? 0) <= 0;
  const jewelry = product.jewelry as Record<string, unknown> | undefined;
  const clothing = product.clothing as Record<string, unknown> | undefined;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12">
      <div className="grid md:grid-cols-2 gap-8 md:gap-12">
        {/* Image */}
        <div className="relative aspect-square bg-[var(--color-surface-raised)] rounded-2xl overflow-hidden border border-[var(--color-border)]">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl as string}
              alt={product.name as string}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-gradient-to-br from-[var(--color-primary-50)] to-[var(--color-primary-100)]">
              <svg className="w-24 h-24 text-[var(--color-primary)]/15" fill="none" viewBox="0 0 24 24" strokeWidth={0.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
              </svg>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <Badge label={product.productType as string} />
            <WishlistButton productId={id} />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-[var(--color-foreground)] tracking-tight mb-3">
            {product.name as string}
          </h1>
          <p className="text-3xl font-semibold text-[var(--color-primary)] mb-6">
            {formatINR(product.price as number)}
          </p>

          {product.description ? (
            <p className="text-[var(--color-muted)] leading-relaxed mb-6">{String(product.description)}</p>
          ) : null}

          {/* Specs */}
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-5 mb-8">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-muted)] mb-3">Specifications</h3>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              {jewelry ? (
                <>
                  <div>
                    <dt className="text-[var(--color-muted)]">Type</dt>
                    <dd className="font-medium text-[var(--color-foreground)]">{String(jewelry.jewelleryType)}</dd>
                  </div>
                  <div>
                    <dt className="text-[var(--color-muted)]">Material</dt>
                    <dd className="font-medium text-[var(--color-foreground)]">{String(jewelry.material)}</dd>
                  </div>
                  {jewelry.gemstone ? (
                    <div>
                      <dt className="text-[var(--color-muted)]">Gemstone</dt>
                      <dd className="font-medium text-[var(--color-foreground)]">{String(jewelry.gemstone)}</dd>
                    </div>
                  ) : null}
                  {jewelry.weightGrams ? (
                    <div>
                      <dt className="text-[var(--color-muted)]">Weight</dt>
                      <dd className="font-medium text-[var(--color-foreground)]">{String(jewelry.weightGrams)}g</dd>
                    </div>
                  ) : null}
                  {jewelry.caratValue ? (
                    <div>
                      <dt className="text-[var(--color-muted)]">Carat</dt>
                      <dd className="font-medium text-[var(--color-foreground)]">{String(jewelry.caratValue)}</dd>
                    </div>
                  ) : null}
                </>
              ) : null}
              {clothing ? (
                <>
                  <div>
                    <dt className="text-[var(--color-muted)]">Type</dt>
                    <dd className="font-medium text-[var(--color-foreground)]">{String(clothing.clothingType)}</dd>
                  </div>
                  <div>
                    <dt className="text-[var(--color-muted)]">Size</dt>
                    <dd className="font-medium text-[var(--color-foreground)]">{String(clothing.size)}</dd>
                  </div>
                  <div>
                    <dt className="text-[var(--color-muted)]">Color</dt>
                    <dd className="font-medium text-[var(--color-foreground)]">{String(clothing.color)}</dd>
                  </div>
                  <div>
                    <dt className="text-[var(--color-muted)]">Gender</dt>
                    <dd className="font-medium text-[var(--color-foreground)]">{String(clothing.gender)}</dd>
                  </div>
                  {clothing.fabric ? (
                    <div>
                      <dt className="text-[var(--color-muted)]">Fabric</dt>
                      <dd className="font-medium text-[var(--color-foreground)]">{String(clothing.fabric)}</dd>
                    </div>
                  ) : null}
                </>
              ) : null}
              <div className="col-span-2 pt-2 border-t border-[var(--color-border)]">
                <dt className="text-[var(--color-muted)]">Availability</dt>
                <dd className="font-medium">
                  {outOfStock ? (
                    <span className="text-[var(--color-error)]">Out of stock</span>
                  ) : (
                    <span className="text-[var(--color-success)]">{String(product.stockQuantity)} available</span>
                  )}
                </dd>
              </div>
            </dl>
          </div>

          <Button
            variant={outOfStock ? "ghost" : "primary"}
            size="lg"
            disabled={outOfStock}
            className="w-full md:w-auto"
            onClick={() =>
              addItem({
                productId: String(product.id),
                name: product.name as string,
                price: Number(product.price),
                imageUrl: (product.imageUrl as string) ?? null,
                productType: product.productType as "JEWELRY" | "CLOTHING",
              })
            }
          >
            {outOfStock ? "Out of Stock" : "Add to Cart"}
          </Button>
        </div>
      </div>

      {/* Reviews */}
      <div className="mt-16 border-t border-[var(--color-border)] pt-12">
        <ReviewSection productId={id} />
      </div>
    </div>
  );
}
