"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback, Suspense } from "react";
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

  const fetchProducts = useCallback(async () => {
    setLoading(true);
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

    setData({ content: paginated, totalPages });
    setLoading(false);
  }, [tab, page, search, minPrice, maxPrice, sortBy, inStockOnly]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const changeTab = (t: Tab) => {
    setTab(t);
    setPage(0);
    router.push(`/products?type=${t}`, { scroll: false });
  };

  const handleFilterApply = () => {
    setPage(0);
    fetchProducts();
  };

  const handleFilterReset = () => {
    setMinPrice("");
    setMaxPrice("");
    setSortBy("newest");
    setInStockOnly(false);
    setPage(0);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Products</h1>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="md:hidden text-sm text-amber-700 font-medium"
        >
          {showFilters ? "Hide Filters" : "Show Filters"}
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
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              className="w-full max-w-md rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          {loading ? (
            <LoadingSkeleton />
          ) : (
            <>
              {data.content.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No products found matching your filters.
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
