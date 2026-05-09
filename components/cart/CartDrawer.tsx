"use client";

import { useCart } from "@/hooks/useCart";
import { formatINR } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import Image from "next/image";

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
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-40"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-xl z-50 transform transition-transform ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">Shopping Cart</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl">
              ×
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {items.length === 0 ? (
              <p className="text-center text-gray-400 py-8">Your cart is empty</p>
            ) : (
              items.map((item) => (
                <div key={item.productId} className="flex gap-3 border-b pb-4">
                  <div className="relative w-16 h-16 rounded bg-gray-100 flex-shrink-0">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        className="object-cover rounded"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400">
                        ✦
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-sm text-amber-700">{formatINR(item.price)}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <button
                        className="w-6 h-6 rounded border text-sm"
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity - 1)
                        }
                      >
                        −
                      </button>
                      <span className="text-sm w-6 text-center">{item.quantity}</span>
                      <button
                        className="w-6 h-6 rounded border text-sm"
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity + 1)
                        }
                      >
                        +
                      </button>
                      <button
                        className="ml-auto text-xs text-red-500 hover:text-red-700"
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

          {items.length > 0 && (
            <div className="p-4 border-t space-y-3">
              <div className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span className="text-amber-700">{formatINR(totalPrice())}</span>
              </div>
              <Button variant="primary" size="lg" className="w-full" onClick={onClose}>
                <a href="/checkout" className="w-full">
                  Proceed to Checkout
                </a>
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
