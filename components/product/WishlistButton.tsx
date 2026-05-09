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
      className={`w-9 h-9 flex items-center justify-center rounded-full border transition-all ${
        wishlisted
          ? "border-red-200 bg-red-50 text-red-500"
          : "border-[var(--color-border)] text-[var(--color-muted)] hover:text-red-400 hover:border-red-200"
      } ${className}`}
      aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
      title={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
    >
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill={wishlisted ? "currentColor" : "none"} strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
      </svg>
    </button>
  );
}
