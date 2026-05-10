"use client";

import { useCart } from "@/hooks/useCart";
import { formatINR } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export function CartDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const items = useCart((s) => s.items);
  const removeItem = useCart((s) => s.removeItem);
  const updateQuantity = useCart((s) => s.updateQuantity);
  const totalPrice = useCart((s) => s.totalPrice);

  return (
    <>
      {/* Overlay */}
      {open ? (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          onClick={onClose}
          aria-hidden="true"
        />
      ) : null}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-xl z-50 transform transition-transform ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
            <h2 className="text-lg font-semibold text-[var(--color-foreground)]">Shopping Cart</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--color-surface-raised)] transition-colors"
              aria-label="Close cart"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            {items.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto w-12 h-12 text-[var(--color-border)]" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                </svg>
                <p className="mt-3 text-sm text-[var(--color-muted)]">Your cart is empty</p>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.productId} className="flex gap-3 border border-[var(--color-border)] rounded-lg p-3">
                  <div className="w-14 h-14 bg-gradient-to-br from-[var(--color-primary-50)] to-[var(--color-primary-100)] rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-[var(--color-primary)]/20" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--color-foreground)] truncate">{item.name}</p>
                    <p className="text-sm font-semibold text-[var(--color-primary)] mt-0.5">{formatINR(item.price)}</p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <div className="inline-flex items-center border border-[var(--color-border)] rounded-md overflow-hidden">
                        <button
                          className="w-6 h-6 text-xs flex items-center justify-center hover:bg-[var(--color-surface-raised)] transition-colors"
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="text-xs w-7 text-center font-medium border-x border-[var(--color-border)] h-6 flex items-center justify-center">{item.quantity}</span>
                        <button
                          className="w-6 h-6 text-xs flex items-center justify-center hover:bg-[var(--color-surface-raised)] transition-colors"
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                      <button
                        className="ml-auto text-xs text-[var(--color-error)] hover:text-red-700 font-medium transition-colors"
                        onClick={() => removeItem(item.productId)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {items.length > 0 ? (
            <div className="border-t border-[var(--color-border)] px-5 py-4 space-y-4">
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-[var(--color-primary)]">{formatINR(totalPrice())}</span>
              </div>
              <Link href="/checkout" onClick={onClose} className="block">
                <Button variant="primary" size="lg" className="w-full">
                  Proceed to Checkout
                </Button>
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
