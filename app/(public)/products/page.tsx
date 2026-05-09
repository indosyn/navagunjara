"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { ProductGrid } from "@/components/product/ProductGrid";
import { Pagination } from "@/components/ui/Pagination";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { SearchFilters } from "@/components/product/SearchFilters";

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
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [data, setData] = useState<{ content: Record<string, unknown>[]; totalPages: number }>({
    content: [],
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      let allProducts: Record<string, unknown>[] = [];
      let totalPages = 0;

      if (tab === "ALL") {
        const [jRes, cRes] = await Promise.all([
          fetch(`/api/v1/jewelry?page=0&size=100`),
          fetch(`/api/v1/clothing?page=0&size=100`),
        ]);
        const [jData, cData] = await Promise.all([jRes.json(), cRes.json()]);
        allProducts = [
          ...(jData.data?.content ?? []).map((p: Record<string, unknown>) => ({
            ...p,
            productType: "JEWELRY",
          })),
          ...(cData.data?.content ?? []).map((p: Record<string, unknown>) => ({
            ...p,
            productType: "CLOTHING",
          })),
        ];
      } else {
        const endpoint = tab.toLowerCase();
        let url: string;
        if (search) {
          url = `/api/v1/${endpoint}/search?name=${encodeURIComponent(search)}&page=0&size=100`;
        } else {
          url = `/api/v1/${endpoint}?page=0&size=100`;
        }
        const res = await fetch(url);
        const json = await res.json();
        allProducts = (json.data?.content ?? []).map((p: Record<string, unknown>) => ({
          ...p,
          productType: tab,
        }));
      }

      // Client-side filtering
      let filtered = allProducts;

      // Price range
      if (minPrice) {
        filtered = filtered.filter((p) => Number(p.price) >= Number(minPrice));
      }
      if (maxPrice) {
        filtered = filtered.filter((p) => Number(p.price) <= Number(maxPrice));
      }

      // In stock only
      if (inStockOnly) {
        filtered = filtered.filter((p) => Number(p.stockQuantity ?? 0) > 0);
      }

      // Sort
      if (sortBy === "price_asc") {
        filtered.sort((a, b) => Number(a.price) - Number(b.price));
      } else if (sortBy === "price_desc") {
        filtered.sort((a, b) => Number(b.price) - Number(a.price));
      } else if (sortBy === "name_asc") {
        filtered.sort((a, b) => String(a.name).localeCompare(String(b.name)));
      } else {
        filtered.sort(
          (a, b) =>
            new Date(String(b.createdAt ?? 0)).getTime() -
            new Date(String(a.createdAt ?? 0)).getTime()
        );
      }

      // Paginate client-side
      const pageSize = 12;
      totalPages = Math.ceil(filtered.length / pageSize);
      const paginated = filtered.slice(page * pageSize, (page + 1) * pageSize);

      if (!cancelled) {
        setData({ content: paginated, totalPages });
        setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [tab, page, search, minPrice, maxPrice, sortBy, inStockOnly]);

  const changeTab = (t: Tab) => {
    setTab(t);
    setPage(0);
    router.push(`/products?type=${t}`, { scroll: false });
  };

  const handleFilterApply = () => {
    setPage(0);
    setLoading(true);
  };

  const handleFilterReset = () => {
    setMinPrice("");
    setMaxPrice("");
    setSortBy("newest");
    setInStockOnly(false);
    setPage(0);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-foreground)] tracking-tight">Products</h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">Browse our curated collection</p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="md:hidden inline-flex items-center gap-2 px-3 py-2 text-sm font-medium border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-surface-raised)] transition-all"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
          </svg>
          {showFilters ? "Hide Filters" : "Filters"}
        </button>
      </div>

      <div className="flex gap-8">
        {/* Filters sidebar */}
        <div className={`w-64 shrink-0 ${showFilters ? "block" : "hidden md:block"}`}>
          <SearchFilters
            productType={tab}
            onProductTypeChange={changeTab}
            minPrice={minPrice}
            maxPrice={maxPrice}
            onMinPriceChange={setMinPrice}
            onMaxPriceChange={setMaxPrice}
            sortBy={sortBy}
            onSortChange={setSortBy}
            inStockOnly={inStockOnly}
            onInStockChange={setInStockOnly}
            onApply={handleFilterApply}
            onReset={handleFilterReset}
          />
        </div>

        {/* Products */}
        <div className="flex-1">
          {/* Search bar */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted)]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                className="w-full rounded-lg border border-[var(--color-border)] hover:border-[var(--color-border-hover)] bg-white pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40 focus:border-[var(--color-primary)] transition-all placeholder:text-[var(--color-muted)]/60"
              />
            </div>
          </div>

          {loading ? (
            <LoadingSkeleton />
          ) : (
            <>
              {data.content.length === 0 ? (
                <div className="text-center py-16">
                  <svg className="mx-auto w-14 h-14 text-[var(--color-border)]" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                  </svg>
                  <p className="mt-4 text-[var(--color-foreground)] font-medium">No products found</p>
                  <p className="mt-1 text-sm text-[var(--color-muted)]">Try adjusting your filters</p>
                </div>
              ) : (
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
              )}
              <Pagination
                page={page}
                totalPages={data.totalPages}
                onPageChange={setPage}
              />
            </>
          )}
        </div>
      </div>
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
