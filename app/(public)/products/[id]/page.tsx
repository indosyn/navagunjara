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

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const addItem = useCart((s) => s.addItem);
  const [product, setProduct] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      // Try jewelry first, then clothing
      let res = await fetch(`/api/v1/jewelry/${id}`);
      if (res.ok) {
        const json = await res.json();
        setProduct({ ...json.data, productType: "JEWELRY" });
        setLoading(false);
        return;
      }
      res = await fetch(`/api/v1/clothing/${id}`);
      if (res.ok) {
        const json = await res.json();
        setProduct({ ...json.data, productType: "CLOTHING" });
      }
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-gray-400">
        Loading...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Product not found</h2>
      </div>
    );
  }

  const outOfStock = Number(product.stockQuantity ?? 0) <= 0;
  const jewelry = product.jewelry as Record<string, unknown> | undefined;
  const clothing = product.clothing as Record<string, unknown> | undefined;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-12">
        {/* Image */}
        <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl as string}
              alt={product.name as string}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="flex items-center justify-center h-full text-6xl text-gray-300">
              ✦
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <Badge label={product.productType as string} />
            <WishlistButton productId={id} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {product.name as string}
          </h1>
          <p className="text-3xl font-semibold text-amber-700 mb-6">
            {formatINR(product.price as number)}
          </p>

          {product.description ? (
            <p className="text-gray-600 mb-6">{String(product.description)}</p>
          ) : null}

          {/* Specs */}
          <div className="space-y-2 text-sm text-gray-700 mb-8">
            {jewelry && (
              <>
                <p><strong>Type:</strong> {String(jewelry.jewelleryType)}</p>
                <p><strong>Material:</strong> {String(jewelry.material)}</p>
                {jewelry.gemstone && <p><strong>Gemstone:</strong> {String(jewelry.gemstone)}</p>}
                {jewelry.weightGrams && <p><strong>Weight:</strong> {String(jewelry.weightGrams)}g</p>}
                {jewelry.caratValue && <p><strong>Carat:</strong> {String(jewelry.caratValue)}</p>}
              </>
            )}
            {clothing && (
              <>
                <p><strong>Type:</strong> {String(clothing.clothingType)}</p>
                <p><strong>Size:</strong> {String(clothing.size)}</p>
                <p><strong>Color:</strong> {String(clothing.color)}</p>
                <p><strong>Gender:</strong> {String(clothing.gender)}</p>
                {clothing.fabric && <p><strong>Fabric:</strong> {String(clothing.fabric)}</p>}
              </>
            )}
            <p>
              <strong>In Stock:</strong>{" "}
              {outOfStock ? (
                <span className="text-red-600">Out of stock</span>
              ) : (
                <span className="text-green-600">{String(product.stockQuantity)} available</span>
              )}
            </p>
          </div>

          <Button
            variant={outOfStock ? "ghost" : "primary"}
            size="lg"
            disabled={outOfStock}
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
      <ReviewSection productId={id} />
    </div>
  );
}
