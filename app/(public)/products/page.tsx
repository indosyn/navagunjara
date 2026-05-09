"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback, Suspense } from "react";
import { ProductGrid } from "@/components/product/ProductGrid";
import { Pagination } from "@/components/ui/Pagination";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";

type Tab = "ALL" | "JEWELRY" | "CLOTHING";

function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTab = (searchParams.get("type") ?? "ALL") as Tab;
  const initialPage = Number(searchParams.get("page") ?? 0);
  const initialSearch = searchParams.get("search") ?? "";

  const [tab, setTab] = useState<Tab>(initialTab);
  const [page, setPage] = useState(initialPage);
  const [search, setSearch] = useState(initialSearch);
  const [data, setData] = useState<{ content: Record<string, unknown>[]; totalPages: number }>({
    content: [],
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    let url: string;
    if (tab === "ALL") {
      // Fetch both
      const [jRes, cRes] = await Promise.all([
        fetch(`/api/v1/jewelry?page=${page}&size=12`),
        fetch(`/api/v1/clothing?page=${page}&size=12`),
      ]);
      const [jData, cData] = await Promise.all([jRes.json(), cRes.json()]);
      const content = [
        ...(jData.data?.content ?? []).map((p: Record<string, unknown>) => ({
          ...p,
          productType: "JEWELRY",
        })),
        ...(cData.data?.content ?? []).map((p: Record<string, unknown>) => ({
          ...p,
          productType: "CLOTHING",
        })),
      ];
      setData({
        content,
        totalPages: Math.max(jData.data?.totalPages ?? 0, cData.data?.totalPages ?? 0),
      });
      setLoading(false);
      return;
    }

    const endpoint = tab.toLowerCase();
    if (search) {
      url = `/api/v1/${endpoint}/search?name=${encodeURIComponent(search)}&page=${page}&size=12`;
    } else {
      url = `/api/v1/${endpoint}?page=${page}&size=12`;
    }
    const res = await fetch(url);
    const json = await res.json();
    const content = (json.data?.content ?? []).map((p: Record<string, unknown>) => ({
      ...p,
      productType: tab,
    }));
    setData({ content, totalPages: json.data?.totalPages ?? 0 });
    setLoading(false);
  }, [tab, page, search]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const changeTab = (t: Tab) => {
    setTab(t);
    setPage(0);
    router.push(`/products?type=${t}`, { scroll: false });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Products</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(["ALL", "JEWELRY", "CLOTHING"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => changeTab(t)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === t
                ? "bg-amber-700 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {t === "ALL" ? "All" : t.charAt(0) + t.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Search */}
      {tab !== "ALL" && (
        <div className="mb-6">
          <input
            type="text"
            placeholder={`Search ${tab.toLowerCase()}...`}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="w-full max-w-sm rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      )}

      {loading ? (
        <LoadingSkeleton />
      ) : (
        <>
          <ProductGrid
            products={data.content.map((p) => ({
              id: String(p.id),
              name: String(p.name),
              price: p.price as string | number,
              imageUrl: (p.imageUrl as string | null) ?? null,
              productType: p.productType as "JEWELRY" | "CLOTHING",
              stockQuantity: Number(p.stockQuantity ?? 0),
            }))}
          />
          <Pagination
            page={page}
            totalPages={data.totalPages}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <ProductsContent />
    </Suspense>
  );
}
