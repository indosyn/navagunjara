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
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { formatINR } from "@/lib/utils";

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

function ProductPlaceholder({ type }: { type: "jewelry" | "clothing" }) {
  return (
    <div className="flex items-center justify-center h-full bg-gradient-to-br from-[var(--color-primary-50)] to-[var(--color-primary-100)]">
      <svg className="w-12 h-12 text-[var(--color-primary)]/30" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
        {type === "jewelry" ? (
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
        )}
      </svg>
    </div>
  );
}

export default async function HomePage() {
  const [jewelry, clothing] = await Promise.all([
    fetchFeatured("jewelry"),
    fetchFeatured("clothing"),
  ]);

  return (
    <div>
      {/* Hero */}
      <section className="relative gradient-hero overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[var(--color-primary)]/5 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full bg-[var(--color-accent)]/5 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 md:py-28 lg:py-36">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-[var(--color-primary)] mb-4 animate-fade-in">
              Handcrafted with Heritage
            </p>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-[var(--color-foreground)] leading-[1.1] tracking-tight text-balance animate-fade-in-up">
              Exquisite Indian{" "}
              <span className="gradient-text">Jewelry & Clothing</span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-[var(--color-muted)] max-w-2xl mx-auto leading-relaxed animate-fade-in-up stagger-2">
              Discover handcrafted jewelry and traditional Indian clothing, curated with love and heritage from master artisans.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4 animate-fade-in-up stagger-3">
              <Link href="/products">
                <Button size="lg" className="shadow-lg shadow-[var(--color-primary)]/20 hover:shadow-xl hover:shadow-[var(--color-primary)]/30 transition-shadow">
                  Explore Collection
                </Button>
              </Link>
              <Link href="/products?type=JEWELRY">
                <Button variant="outline" size="lg">
                  Shop Jewelry
                </Button>
              </Link>
            </div>
          </div>

          {/* Trust badges */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm text-[var(--color-muted)] animate-fade-in stagger-4">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-[var(--color-success)]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
              </svg>
              <span>Authentic Certified</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H18.375M3.375 14.25h15m-15 0V5.625m0 8.625h15V5.625m-15 0A1.125 1.125 0 0 1 4.5 4.5h15a1.125 1.125 0 0 1 1.125 1.125m-16.125 0h15" />
              </svg>
              <span>Free Shipping</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-[var(--color-info)]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
              </svg>
              <span>Secure Payment</span>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-foreground)] tracking-tight">
            Shop by Category
          </h2>
          <p className="mt-3 text-[var(--color-muted)]">
            Curated collections of traditional Indian craftsmanship
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            href="/products?type=JEWELRY"
            className="group relative h-64 md:h-80 rounded-2xl overflow-hidden bg-gradient-to-br from-amber-50 to-amber-100 card-hover"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent z-10" />
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-24 h-24 text-[var(--color-primary)]/20 group-hover:scale-110 transition-transform duration-500" fill="none" viewBox="0 0 24 24" strokeWidth={0.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
              </svg>
            </div>
            <div className="absolute bottom-0 left-0 right-0 z-20 p-6 md:p-8">
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-1">Jewelry</h3>
              <p className="text-white/80 text-sm">Gold, silver, gemstones and more</p>
            </div>
          </Link>

          <Link
            href="/products?type=CLOTHING"
            className="group relative h-64 md:h-80 rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-50 to-purple-100 card-hover"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent z-10" />
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-24 h-24 text-indigo-400/20 group-hover:scale-110 transition-transform duration-500" fill="none" viewBox="0 0 24 24" strokeWidth={0.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
              </svg>
            </div>
            <div className="absolute bottom-0 left-0 right-0 z-20 p-6 md:p-8">
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-1">Clothing</h3>
              <p className="text-white/80 text-sm">Sarees, lehengas, sherwanis and ethnic wear</p>
            </div>
          </Link>
        </div>
      </section>

      {/* Featured Jewelry */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--color-foreground)]">Featured Jewelry</h2>
            <p className="mt-1 text-sm text-[var(--color-muted)]">Our most popular pieces</p>
          </div>
          <Link
            href="/products?type=JEWELRY"
            className="text-sm font-semibold text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] flex items-center gap-1 transition-colors"
          >
            View All
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
        {jewelry.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {jewelry.map((item: Record<string, string | number | null>) => (
              <Link
                key={String(item.id)}
                href={`/products/${item.id}`}
                className="group rounded-xl border border-[var(--color-border)] bg-white overflow-hidden card-hover"
              >
                <div className="aspect-square relative overflow-hidden bg-[var(--color-surface-raised)]">
                  {item.imageUrl ? (
                    <Image
                      src={String(item.imageUrl)}
                      alt={String(item.name)}
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      className="object-cover img-zoom"
                    />
                  ) : (
                    <ProductPlaceholder type="jewelry" />
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-[var(--color-foreground)] truncate group-hover:text-[var(--color-primary)] transition-colors">
                    {String(item.name)}
                  </h3>
                  <p className="text-[var(--color-primary)] font-semibold mt-1">
                    {formatINR(Number(item.price))}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-[var(--color-surface-raised)] rounded-2xl">
            <p className="text-[var(--color-muted)]">No jewelry yet — check back soon</p>
          </div>
        )}
      </section>

      {/* Featured Clothing */}
      <section className="bg-[var(--color-surface-raised)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-[var(--color-foreground)]">Featured Clothing</h2>
              <p className="mt-1 text-sm text-[var(--color-muted)]">Traditional Indian elegance</p>
            </div>
            <Link
              href="/products?type=CLOTHING"
              className="text-sm font-semibold text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] flex items-center gap-1 transition-colors"
            >
              View All
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
          {clothing.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {clothing.map((item: Record<string, string | number | null>) => (
                <Link
                  key={String(item.id)}
                  href={`/products/${item.id}`}
                  className="group rounded-xl border border-[var(--color-border)] bg-white overflow-hidden card-hover"
                >
                  <div className="aspect-square relative overflow-hidden bg-[var(--color-surface-raised)]">
                    {item.imageUrl ? (
                      <Image
                        src={String(item.imageUrl)}
                        alt={String(item.name)}
                        fill
                        sizes="(max-width: 768px) 50vw, 25vw"
                        className="object-cover img-zoom"
                      />
                    ) : (
                      <ProductPlaceholder type="clothing" />
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-[var(--color-foreground)] truncate group-hover:text-[var(--color-primary)] transition-colors">
                      {String(item.name)}
                    </h3>
                    <p className="text-[var(--color-primary)] font-semibold mt-1">
                      {formatINR(Number(item.price))}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl border border-[var(--color-border)]">
              <p className="text-[var(--color-muted)]">No clothing yet — check back soon</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
