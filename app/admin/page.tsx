"use client";

import { useEffect, useState } from "react";
import { formatINR } from "@/lib/utils";

interface Stats {
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: string | number;
  totalProducts: number;
  totalCustomers: number;
  lowStockProducts: Array<{
    id: string;
    name: string;
    stockQuantity: number;
    productType: string;
  }>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/v1/admin/dashboard")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setStats(json.data);
      });
  }, []);

  if (!stats) {
    return <div className="text-gray-400">Loading dashboard...</div>;
  }

  const cards = [
    { label: "Total Orders", value: stats.totalOrders, color: "bg-blue-500" },
    { label: "Pending Orders", value: stats.pendingOrders, color: "bg-yellow-500" },
    { label: "Revenue", value: formatINR(stats.totalRevenue), color: "bg-green-500" },
    { label: "Products", value: stats.totalProducts, color: "bg-purple-500" },
    { label: "Customers", value: stats.totalCustomers, color: "bg-indigo-500" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className="text-2xl font-bold mt-1">{card.value}</p>
            <div className={`h-1 ${card.color} rounded mt-3`} />
          </div>
        ))}
      </div>

      {/* Low stock alert */}
      {stats.lowStockProducts.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4 text-red-600">
            Low Stock Alert
          </h2>
          <div className="space-y-2">
            {stats.lowStockProducts.map((p) => (
              <div
                key={p.id}
                className="flex justify-between items-center text-sm border-b pb-2"
              >
                <span>{p.name}</span>
                <span className="text-red-600 font-medium">
                  {p.stockQuantity} left
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
