/**
 * Wishlist heart toggle button.
 *
 * @component WishlistButton
 * @author Anurag Muthyam
 * @organization indosyn
 */

"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface WishlistButtonProps {
  productId: string;
  className?: string;
}

export function WishlistButton({ productId, className = "" }: WishlistButtonProps) {
  const { data: session } = useSession();
  const [wishlisted, setWishlisted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!session) return;
    // Check wishlist on mount
    fetch("/api/v1/wishlist")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const found = json.data.some((item: any) => String(item.productId) === productId);
          setWishlisted(found);
        }
      })
      .catch(() => {});
  }, [session, productId]);

  if (!session) return null;

  const toggle = async () => {
    setLoading(true);
    try {
      if (wishlisted) {
        await fetch(`/api/v1/wishlist/${productId}`, { method: "DELETE" });
        setWishlisted(false);
      } else {
        await fetch("/api/v1/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: Number(productId) }),
        });
        setWishlisted(true);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`text-2xl transition-colors ${
        wishlisted ? "text-red-500" : "text-gray-300 hover:text-red-400"
      } ${className}`}
      aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
      title={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
    >
      {wishlisted ? "♥" : "♡"}
    </button>
  );
}
