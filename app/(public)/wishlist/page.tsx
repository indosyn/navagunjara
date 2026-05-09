/**
 * Wishlist page — displays customer's saved products.
 *
 * @page /wishlist
 * @author Anurag Muthyam
 * @organization indosyn
 */

"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { formatINR } from "@/lib/utils";

interface WishlistProduct {
  id: number;
  productId: number;
  addedAt: string;
  product: {
    id: number;
    name: string;
    price: number | string;
    imageUrl: string | null;
    productType: string;
    stockQuantity: number;
  };
}

export default function WishlistPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [items, setItems] = useState<WishlistProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status !== "authenticated") return;

    fetch("/api/v1/wishlist")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setItems(json.data ?? []);
      })
      .finally(() => setLoading(false));
  }, [status, router]);

  const removeItem = async (productId: number) => {
    await fetch(`/api/v1/wishlist/${productId}`, { method: "DELETE" });
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  if (loading || status === "loading") return <LoadingSkeleton />;
  if (!session) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">My Wishlist</h1>

      {items.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 mb-4">Your wishlist is empty.</p>
          <Link href="/products">
            <Button>Browse Products</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 p-4 border rounded-lg bg-white"
            >
              <div className="w-20 h-20 bg-gray-100 rounded overflow-hidden shrink-0">
                {item.product.imageUrl ? (
                  <Image
                    src={item.product.imageUrl}
                    alt={item.product.name}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 text-2xl">
                    ♦
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <Link
                  href={`/products/${item.productId}`}
                  className="font-medium text-gray-900 hover:text-amber-700 truncate block"
                >
                  {item.product.name}
                </Link>
                <p className="text-amber-700 font-semibold">
                  {formatINR(Number(item.product.price))}
                </p>
                <p className="text-xs text-gray-400">
                  {item.product.stockQuantity > 0 ? "In Stock" : "Out of Stock"}
                </p>
              </div>

              <button
                onClick={() => removeItem(item.productId)}
                className="text-red-500 hover:text-red-700 text-sm font-medium"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
