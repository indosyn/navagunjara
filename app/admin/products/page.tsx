"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Pagination } from "@/components/ui/Pagination";
import { Button } from "@/components/ui/Button";
import { formatINR } from "@/lib/utils";

type ProductType = "JEWELRY" | "CLOTHING";

export default function AdminProductsPage() {
  const [tab, setTab] = useState<ProductType>("JEWELRY");
  const [page, setPage] = useState(0);
  const [data, setData] = useState<{
    content: Record<string, unknown>[];
    totalPages: number;
  }>({ content: [], totalPages: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/v1/${tab.toLowerCase()}?page=${page}&size=20`)
      .then((r) => r.json())
      .then((json) => {
        if (!cancelled) {
          setData(json.data ?? { content: [], totalPages: 0 });
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [tab, page]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Products</h1>
        <Link href="/admin/products/new">
          <Button>Add Product</Button>
        </Link>
      </div>

      <div className="flex gap-2 mb-6">
        {(["JEWELRY", "CLOTHING"] as ProductType[]).map((t) => (
          <button
            key={t}
            onClick={() => {
              setLoading(true);
              setTab(t);
              setPage(0);
            }}
            className={`px-4 py-2 rounded text-sm font-medium ${
              tab === t
                ? "bg-amber-700 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            {t.charAt(0) + t.slice(1).toLowerCase()}
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
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.content.map((p) => (
                <tr key={String(p.id)}>
                  <td className="px-4 py-3 font-medium">{String(p.name)}</td>
                  <td className="px-4 py-3">
                    <Badge label={tab} />
                  </td>
                  <td className="px-4 py-3">{formatINR(p.price as number)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        Number(p.stockQuantity) <= 10
                          ? "text-red-600 font-medium"
                          : ""
                      }
                    >
                      {String(p.stockQuantity)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/products/${p.id}/edit`}
                      className="text-amber-700 hover:underline text-sm"
                    >
                      Edit
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
