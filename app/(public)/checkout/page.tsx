"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { RazorpayCheckout } from "@/components/payment/RazorpayCheckout";
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
  const [orderId, setOrderId] = useState<string | null>(null);

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
      // Order created — show payment
      setOrderId(String(json.data.id));
      setSubmitting(false);
    } catch {
      setError("Something went wrong");
      setSubmitting(false);
    }
  };

  const handlePaymentSuccess = () => {
    clearCart();
    router.push(`/account/orders/${orderId}`);
  };

  const handlePaymentFailure = (reason: string) => {
    setError(`Payment failed: ${reason}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12 animate-fade-in">
      <h1 className="text-3xl font-bold text-[var(--color-foreground)] tracking-tight mb-8">Checkout</h1>
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Address form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="bg-white rounded-xl border border-[var(--color-border)] p-6">
            <h2 className="text-lg font-semibold text-[var(--color-foreground)] mb-5">Delivery Address</h2>
            <div className="space-y-4">
              <Input
                label="Address"
                required
                placeholder="Street address"
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
                placeholder="560001"
                {...register("deliveryPincode")}
                error={errors.deliveryPincode?.message}
              />
            </div>
          </div>

          {error ? (
            <div className="flex items-center gap-2 text-sm text-[var(--color-error)] bg-red-50 px-4 py-3 rounded-lg">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
              {error}
            </div>
          ) : null}
          {!orderId ? (
            <Button type="submit" size="lg" className="w-full" loading={submitting}>
              Proceed to Payment
            </Button>
          ) : (
            <div className="bg-white rounded-xl border border-[var(--color-border)] p-6 space-y-4">
              <div className="flex items-center gap-2 text-sm text-[var(--color-success)] bg-green-50 px-4 py-3 rounded-lg">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                Order #{orderId} created. Complete payment below.
              </div>
              <RazorpayCheckout
                orderId={orderId}
                amount={Math.round(totalPrice() * 100)}
                onSuccess={handlePaymentSuccess}
                onFailure={handlePaymentFailure}
              />
            </div>
          )}
        </form>

        {/* Summary */}
        <div className="border border-[var(--color-border)] rounded-xl p-6 bg-white h-fit sticky top-24">
          <h2 className="text-lg font-semibold text-[var(--color-foreground)] mb-4">Order Summary</h2>
          <div className="space-y-3 mb-4">
            {items.map((item) => (
              <div key={item.productId} className="flex justify-between text-sm">
                <span className="text-[var(--color-muted)]">
                  {item.name} <span className="text-[var(--color-foreground)] font-medium">x {item.quantity}</span>
                </span>
                <span className="font-medium text-[var(--color-foreground)]">{formatINR(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="space-y-2 border-t border-[var(--color-border)] pt-4">
            <div className="flex justify-between text-sm text-[var(--color-muted)]">
              <span>Shipping</span>
              <span className="text-[var(--color-success)] font-medium">Free</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2">
              <span>Total</span>
              <span className="text-[var(--color-primary)]">{formatINR(totalPrice())}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
