/**
 * Razorpay checkout button component. Loads Razorpay SDK and
 * handles the payment flow.
 *
 * @component RazorpayCheckout
 * @author Anurag Muthyam
 * @organization indosyn
 */

"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/Button";

interface RazorpayCheckoutProps {
  orderId: string;
  amount: number;
  onSuccess: () => void;
  onFailure: (reason: string) => void;
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any;
  }
}

export function RazorpayCheckout({
  orderId,
  amount,
  onSuccess,
  onFailure,
}: RazorpayCheckoutProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [sdkReady, setSdkReady] = useState(() => typeof window !== "undefined" && !!window.Razorpay);

  // Load Razorpay SDK
  useEffect(() => {
    if (sdkReady) return;
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setSdkReady(true);
    document.body.appendChild(script);
  }, [sdkReady]);

  const handlePayment = async () => {
    if (!session) return;
    setLoading(true);

    try {
      // Step 1: Create Razorpay order on backend
      const res = await fetch("/api/v1/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: Number(orderId), method: "CARD" }),
      });
      const json = await res.json();
      if (!res.ok) {
        onFailure(json.message ?? "Failed to initiate payment");
        setLoading(false);
        return;
      }

      const paymentData = json.data;

      // Step 2: Open Razorpay checkout
      const options = {
        key: paymentData.keyId ?? process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: paymentData.amount,
        currency: paymentData.currency ?? "INR",
        name: "Navagunjara",
        description: `Order #${orderId}`,
        order_id: paymentData.razorpayOrderId,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        handler: async (response: any) => {
          // Step 3: Verify payment on backend
          const verifyRes = await fetch(`/api/v1/payments/${paymentData.payment.id}/confirm`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId: Number(orderId),
            }),
          });
          if (verifyRes.ok) {
            onSuccess();
          } else {
            onFailure("Payment verification failed");
          }
        },
        prefill: {
          name: `${session.user.firstName} ${session.user.lastName}`,
          email: session.user.email,
        },
        theme: { color: "#b45309" },
        modal: {
          ondismiss: () => setLoading(false),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", async (response: { error: { description: string } }) => {
        await fetch(`/api/v1/payments/${paymentData.payment.id}/fail`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: response.error.description }),
        });
        onFailure(response.error.description);
        setLoading(false);
      });
      rzp.open();
    } catch {
      onFailure("Something went wrong");
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handlePayment}
      disabled={loading || !sdkReady}
      size="lg"
      className="w-full"
    >
      {loading ? "Processing..." : `Pay ₹${(amount / 100).toLocaleString("en-IN")}`}
    </Button>
  );
}
