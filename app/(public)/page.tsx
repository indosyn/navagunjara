/**
 * Home page — hero section and featured products.
 *
 * Uses ISR (revalidate every 60 s) so static HTML is served from the edge
 * while product data stays fresh.
 *
 * @author Anurag Muthyam
 * @organization indosyn
 */

import Link from "next/link";
import { Button } from "@/components/ui/Button";

/** Revalidate featured products every 60 seconds (ISR). */
export const revalidate = 60;

async function fetchFeatured(type: string) {
  try {
    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/v1/${type}?page=0&size=4`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data?.content ?? [];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const [jewelry, clothing] = await Promise.all([
    fetchFeatured("jewelry"),
    fetchFeatured("clothing"),
  ]);

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-amber-50 to-amber-100 py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Exquisite Indian Jewelry & Clothing
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Discover handcrafted jewelry and traditional Indian clothing,
            curated with love and heritage.
          </p>
          <Link href="/products">
            <Button size="lg">Explore Collection</Button>
          </Link>
        </div>
      </section>

      {/* Featured Jewelry */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Featured Jewelry</h2>
          <Link href="/products?type=JEWELRY" className="text-amber-700 hover:text-amber-800 text-sm font-medium">
            View All →
          </Link>
        </div>
        {jewelry.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {jewelry.map((item: Record<string, string | number | null>) => (
              <Link
                key={String(item.id)}
                href={`/products/${item.id}`}
                className="group rounded-lg border bg-white p-4 hover:shadow-md transition-shadow"
              >
                <div className="aspect-square bg-gray-100 rounded mb-3 flex items-center justify-center text-4xl text-gray-300">
                  ✦
                </div>
                <h3 className="font-medium truncate group-hover:text-amber-700">
                  {String(item.name)}
                </h3>
                <p className="text-amber-700 font-semibold mt-1">
                  ₹{Number(item.price).toLocaleString("en-IN")}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-center py-8">No jewelry yet</p>
        )}
      </section>

      {/* Featured Clothing */}
      <section className="max-w-7xl mx-auto px-4 py-16 bg-gray-50">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            Featured Clothing
          </h2>
          <Link href="/products?type=CLOTHING" className="text-amber-700 hover:text-amber-800 text-sm font-medium">
            View All →
          </Link>
        </div>
        {clothing.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {clothing.map((item: Record<string, string | number | null>) => (
              <Link
                key={String(item.id)}
                href={`/products/${item.id}`}
                className="group rounded-lg border bg-white p-4 hover:shadow-md transition-shadow"
              >
                <div className="aspect-square bg-gray-100 rounded mb-3 flex items-center justify-center text-4xl text-gray-300">
                  👗
                </div>
                <h3 className="font-medium truncate group-hover:text-amber-700">
                  {String(item.name)}
                </h3>
                <p className="text-amber-700 font-semibold mt-1">
                  ₹{Number(item.price).toLocaleString("en-IN")}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-center py-8">No clothing yet</p>
        )}
      </section>
    </div>
  );
}
