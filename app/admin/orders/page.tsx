"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Pagination } from "@/components/ui/Pagination";
import { formatINR } from "@/lib/utils";
import Link from "next/link";

export default function AdminOrdersPage() {
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [data, setData] = useState<{
    content: Record<string, unknown>[];
    totalPages: number;
  }>({ content: [], totalPages: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const qs = statusFilter ? `&status=${statusFilter}` : "";
    fetch(`/api/v1/orders?page=${page}&size=20${qs}`)
      .then((r) => r.json())
      .then((json) => {
        setData(json.data ?? { content: [], totalPages: 0 });
        setLoading(false);
      });
  }, [page, statusFilter]);

  const statuses = ["", "PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Orders</h1>

      <div className="flex gap-2 mb-6 flex-wrap">
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => {
              setStatusFilter(s);
              setPage(0);
            }}
            className={`px-3 py-1.5 rounded text-sm ${
              statusFilter === s
                ? "bg-amber-700 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            {s || "All"}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-4 py-3">Order ID</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.content.map((o) => (
                <tr key={String(o.id)}>
                  <td className="px-4 py-3 font-mono text-xs">#{String(o.id)}</td>
                  <td className="px-4 py-3">{String(o.customerName)}</td>
                  <td className="px-4 py-3">{formatINR(o.totalAmount as number)}</td>
                  <td className="px-4 py-3">
                    <Badge label={String(o.status)} />
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {o.orderedAt
                      ? new Date(o.orderedAt as string).toLocaleDateString("en-IN")
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/orders/${o.id}`}
                      className="text-amber-700 hover:underline text-sm"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={page} totalPages={data.totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
