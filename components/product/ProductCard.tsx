"use client";

import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useCart } from "@/hooks/useCart";
import { formatINR } from "@/lib/utils";
import { WishlistButton } from "@/components/product/WishlistButton";

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
    <div className="group rounded-lg border border-gray-200 bg-white overflow-hidden hover:shadow-md transition-shadow">
      <Link href={`/products/${id}`} className="block">
        <div className="relative aspect-square bg-gray-100">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={name}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 text-4xl">
              ✦
            </div>
          )}
          <Badge label={productType} className="absolute top-2 left-2" />
        </div>
      </Link>
      <div className="p-4">
        <div className="flex items-start justify-between">
          <Link href={`/products/${id}`} className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 truncate hover:text-amber-700">
              {name}
            </h3>
          </Link>
          <WishlistButton productId={id} className="text-lg ml-1" />
        </div>
        <p className="mt-1 text-lg font-semibold text-amber-700">
          {formatINR(price)}
        </p>
        <Button
          variant={outOfStock ? "ghost" : "primary"}
          size="sm"
          className="w-full mt-3"
          disabled={outOfStock}
          onClick={() =>
            addItem({
              productId: id,
              name,
              price: Number(price),
              imageUrl,
              productType,
            })
          }
        >
          {outOfStock ? "Out of Stock" : "Add to Cart"}
        </Button>
      </div>
    </div>
  );
}
