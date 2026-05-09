"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatINR } from "@/lib/utils";

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Record<string, unknown> | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetch(`/api/v1/orders/${id}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setOrder(json.data);
      });
  }, [id]);

  const updateStatus = async (status: string) => {
    setUpdating(true);
    const res = await fetch(`/api/v1/orders/${id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const json = await res.json();
    if (json.success) setOrder(json.data);
    setUpdating(false);
  };

  if (!order) return <p className="text-gray-400">Loading...</p>;

  const items = order.items as Array<Record<string, unknown>>;
  const statuses = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"];

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">Order #{String(order.id)}</h1>

      <div className="bg-white rounded-lg shadow-sm p-6 space-y-4 mb-6">
        <div className="flex justify-between">
          <span className="text-gray-500">Customer</span>
          <span>{String(order.customerName)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Status</span>
          <Badge label={String(order.status)} />
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Total</span>
          <span className="font-semibold text-amber-700">
            {formatINR(order.totalAmount as number)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Delivery</span>
          <span className="text-right text-sm">
            {String(order.deliveryAddress)}, {String(order.deliveryCity)},{" "}
            {String(order.deliveryState)} — {String(order.deliveryPincode)}
          </span>
        </div>
      </div>

      {/* Items */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="font-semibold mb-4">Items</h2>
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="flex justify-between text-sm border-b pb-2">
              <span>
                {String(item.productName)} × {String(item.quantity)}
              </span>
              <span>{formatINR(item.subtotal as number)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Update status */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="font-semibold mb-4">Update Status</h2>
        <div className="flex gap-2 flex-wrap">
          {statuses.map((s) => (
            <Button
              key={s}
              variant={order.status === s ? "primary" : "outline"}
              size="sm"
              disabled={updating || order.status === s}
              onClick={() => updateStatus(s)}
            >
              {s}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
