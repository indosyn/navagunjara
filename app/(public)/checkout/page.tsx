"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatINR } from "@/lib/utils";
import { useState } from "react";

const checkoutSchema = z.object({
  deliveryAddress: z.string().min(1, "Address is required"),
  deliveryCity: z.string().min(1, "City is required"),
  deliveryState: z.string().min(1, "State is required"),
  deliveryPincode: z.string().regex(/^[1-9][0-9]{5}$/, "Enter a valid 6-digit pincode"),
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

export default function CheckoutPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const items = useCart((s) => s.items);
  const totalPrice = useCart((s) => s.totalPrice);
  const clearCart = useCart((s) => s.clearCart);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutForm>({ resolver: zodResolver(checkoutSchema) });

  if (!session) {
    router.push("/login?callbackUrl=/checkout");
    return null;
  }

  if (items.length === 0) {
    router.push("/cart");
    return null;
  }

  const onSubmit = async (data: CheckoutForm) => {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/v1/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: Number(session.user.id),
          items: items.map((i) => ({
            productId: Number(i.productId),
            quantity: i.quantity,
          })),
          ...data,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message ?? "Failed to place order");
        setSubmitting(false);
        return;
      }
      clearCart();
      router.push(`/account/orders/${json.data.id}`);
    } catch {
      setError("Something went wrong");
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Address form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <h2 className="text-lg font-semibold">Delivery Address</h2>
          <Input
            label="Address"
            required
            {...register("deliveryAddress")}
            error={errors.deliveryAddress?.message}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="City"
              required
              {...register("deliveryCity")}
              error={errors.deliveryCity?.message}
            />
            <Input
              label="State"
              required
              {...register("deliveryState")}
              error={errors.deliveryState?.message}
            />
          </div>
          <Input
            label="Pincode"
            required
            maxLength={6}
            {...register("deliveryPincode")}
            error={errors.deliveryPincode?.message}
          />
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <Button type="submit" size="lg" className="w-full" disabled={submitting}>
            {submitting ? "Placing Order..." : "Place Order"}
          </Button>
        </form>

        {/* Summary */}
        <div className="border rounded-lg p-6 h-fit">
          <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
          <div className="space-y-3 mb-4">
            {items.map((item) => (
              <div key={item.productId} className="flex justify-between text-sm">
                <span>
                  {item.name} × {item.quantity}
                </span>
                <span>{formatINR(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="border-t pt-3 flex justify-between text-lg font-bold">
            <span>Total</span>
            <span className="text-amber-700">{formatINR(totalPrice())}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
