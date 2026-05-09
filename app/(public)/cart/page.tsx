"use client";

import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/Button";
import { formatINR } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

export default function CartPage() {
  const items = useCart((s) => s.items);
  const removeItem = useCart((s) => s.removeItem);
  const updateQuantity = useCart((s) => s.updateQuantity);
  const totalPrice = useCart((s) => s.totalPrice);

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 text-center">
        <svg className="mx-auto w-16 h-16 text-[var(--color-border)]" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
        </svg>
        <h1 className="mt-4 text-2xl font-bold text-[var(--color-foreground)]">Your Cart is Empty</h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">Start shopping to add items to your cart</p>
        <Link href="/products" className="mt-6 inline-block">
          <Button>Continue Shopping</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12">
      <h1 className="text-3xl font-bold text-[var(--color-foreground)] tracking-tight mb-8">Shopping Cart</h1>
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div
              key={item.productId}
              className="flex gap-4 border border-[var(--color-border)] rounded-xl p-4 bg-white"
            >
              <div className="relative w-20 h-20 bg-[var(--color-surface-raised)] rounded-lg flex-shrink-0 overflow-hidden">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-gradient-to-br from-[var(--color-primary-50)] to-[var(--color-primary-100)]">
                    <svg className="w-6 h-6 text-[var(--color-primary)]/20" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-[var(--color-foreground)] truncate">{item.name}</h3>
                <p className="text-[var(--color-primary)] font-semibold text-sm mt-0.5">
                  {formatINR(item.price)}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    className="w-8 h-8 border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-surface-raised)] transition-colors flex items-center justify-center text-sm"
                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    aria-label="Decrease quantity"
                  >
                    -
                  </button>
                  <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                  <button
                    className="w-8 h-8 border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-surface-raised)] transition-colors flex items-center justify-center text-sm"
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                  <button
                    className="ml-3 text-xs text-[var(--color-error)] hover:text-red-700 font-medium transition-colors"
                    onClick={() => removeItem(item.productId)}
                  >
                    Remove
                  </button>
                </div>
              </div>
              <div className="text-right font-semibold text-[var(--color-foreground)] whitespace-nowrap">
                {formatINR(item.price * item.quantity)}
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="border border-[var(--color-border)] rounded-xl p-6 bg-white h-fit sticky top-24">
          <h2 className="text-lg font-semibold text-[var(--color-foreground)] mb-4">Order Summary</h2>
          <div className="space-y-2 mb-4 text-sm">
            <div className="flex justify-between text-[var(--color-muted)]">
              <span>Subtotal ({items.length} items)</span>
              <span>{formatINR(totalPrice())}</span>
            </div>
            <div className="flex justify-between text-[var(--color-muted)]">
              <span>Shipping</span>
              <span className="text-[var(--color-success)] font-medium">Free</span>
            </div>
          </div>
          <div className="border-t border-[var(--color-border)] pt-4 flex justify-between text-lg font-bold">
            <span>Total</span>
            <span className="text-[var(--color-primary)]">{formatINR(totalPrice())}</span>
          </div>
          <Link href="/checkout" className="block mt-6">
            <Button size="lg" className="w-full">
              Proceed to Checkout
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
