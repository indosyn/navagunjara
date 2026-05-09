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
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-40 bg-gray-200 rounded" />
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-5 h-28 shadow-sm" />
          ))}
        </div>
      </div>
    );
  }

  const cards = [
    { label: "Total Orders", value: stats.totalOrders, color: "bg-blue-500", icon: "📦" },
    { label: "Pending Orders", value: stats.pendingOrders, color: "bg-yellow-500", icon: "⏳" },
    { label: "Revenue", value: formatINR(stats.totalRevenue), color: "bg-green-500", icon: "💰" },
    { label: "Products", value: stats.totalProducts, color: "bg-purple-500", icon: "🏷️" },
    { label: "Customers", value: stats.totalCustomers, color: "bg-indigo-500", icon: "👥" },
  ];

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-[var(--color-foreground)] mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {cards.map((card, i) => (
          <div
            key={card.label}
            className="bg-white rounded-xl p-5 shadow-sm border border-[var(--color-border)] hover:shadow-md transition-shadow animate-slide-up"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-[var(--color-muted)]">{card.label}</p>
              <span className="text-lg">{card.icon}</span>
            </div>
            <p className="text-2xl font-bold text-[var(--color-foreground)]">{card.value}</p>
            <div className={`h-1 ${card.color} rounded-full mt-3`} />
          </div>
        ))}
      </div>

      {/* Low stock alert */}
      {stats.lowStockProducts.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-[var(--color-border)] p-6">
          <h2 className="text-lg font-semibold mb-4 text-[var(--color-error)] flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
            Low Stock Alert
          </h2>
          <div className="space-y-2">
            {stats.lowStockProducts.map((p) => (
              <div
                key={p.id}
                className="flex justify-between items-center text-sm border-b border-[var(--color-border)] pb-2 last:border-0"
              >
                <span className="text-[var(--color-foreground)]">{p.name}</span>
                <span className="text-[var(--color-error)] font-medium bg-red-50 px-2 py-0.5 rounded-full text-xs">
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
