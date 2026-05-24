"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { useCart } from "@/hooks/useCart";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { ToastContainer } from "@/components/ui/Toast";

function ShoppingBagIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
    </svg>
  );
}

function UserIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
  );
}

function HeartIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
    </svg>
  );
}

function MenuIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
  );
}

function XIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}

function Header() {
  const { data: session } = useSession();
  const totalItems = useCart((s) => s.totalItems);
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  // Cart is persisted to localStorage by Zustand; on the server we don't know
  // its value, so we only render the count badge after hydration to avoid an
  // SSR/CSR mismatch.
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);
  const count = mounted ? totalItems() : 0;

  const navLinks = [
    { href: "/products", label: "Products" },
    ...(session ? [{ href: "/wishlist", label: "Wishlist" }] : []),
    ...(session?.user.role === "ADMIN" ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  return (
    <>
      <header className="sticky top-0 z-30 glass border-b border-[var(--color-border)]">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-xl font-bold tracking-tight text-[var(--color-primary)] group-hover:text-[var(--color-primary-dark)] transition-colors">
              Navagunjara
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2 text-sm font-medium text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-black/[0.04] rounded-lg transition-all"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {session ? (
              <Link
                href="/wishlist"
                className="hidden md:flex items-center justify-center w-10 h-10 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-50)] transition-all"
                aria-label="Wishlist"
              >
                <HeartIcon />
              </Link>
            ) : null}

            <button
              onClick={() => setCartOpen(true)}
              className="relative flex items-center justify-center w-10 h-10 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-50)] transition-all"
              aria-label="Open shopping cart"
            >
              <ShoppingBagIcon />
              {count > 0 ? (
                <span
                  key={count}
                  className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-[var(--color-primary)] text-white text-[10px] font-bold px-1 animate-bounce-in"
                >
                  {count}
                </span>
              ) : null}
            </button>

            {session ? (
              <div className="hidden md:flex items-center gap-1 ml-1">
                <Link
                  href="/account"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-black/[0.04] transition-all"
                >
                  <UserIcon className="w-4 h-4" />
                  {session.user.firstName}
                </Link>
                <button
                  onClick={() => signOut()}
                  className="px-3 py-2 text-sm font-medium text-[var(--color-muted)] hover:text-[var(--color-error)] hover:bg-red-50 rounded-lg transition-all"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="hidden md:flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] rounded-lg transition-colors ml-2"
              >
                Sign In
              </Link>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-black/[0.04] transition-all ml-1"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
            >
              {mobileOpen ? <XIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen ? (
          <div className="md:hidden border-t border-[var(--color-border)] bg-white animate-fade-in">
            <nav className="flex flex-col px-4 py-3 gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="px-3 py-2.5 text-sm font-medium text-[var(--color-foreground)] hover:bg-[var(--color-primary-50)] rounded-lg transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              {session ? (
                <>
                  <Link
                    href="/account"
                    onClick={() => setMobileOpen(false)}
                    className="px-3 py-2.5 text-sm font-medium text-[var(--color-foreground)] hover:bg-[var(--color-primary-50)] rounded-lg transition-colors"
                  >
                    My Account
                  </Link>
                  <button
                    onClick={() => { signOut(); setMobileOpen(false); }}
                    className="px-3 py-2.5 text-sm font-medium text-left text-[var(--color-error)] hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="px-3 py-2.5 text-sm font-semibold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] rounded-lg text-center mt-1 transition-colors"
                >
                  Sign In
                </Link>
              )}
            </nav>
          </div>
        ) : null}
      </header>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[var(--color-foreground)] text-white/60 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-12 border-b border-white/10">
          {/* Brand */}
          <div>
            <h3 className="text-lg font-bold text-white mb-3">Navagunjara</h3>
            <p className="text-sm leading-relaxed">
              Discover handcrafted Indian jewelry and traditional clothing, curated with love and heritage.
            </p>
            {/* Trust badges */}
            <div className="flex items-center gap-3 mt-4">
              <div className="flex items-center gap-1.5 text-xs text-white/40">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
                Secure Payments
              </div>
              <div className="flex items-center gap-1.5 text-xs text-white/40">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                </svg>
                Authentic
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">Shop</h4>
            <nav className="flex flex-col gap-2">
              <Link href="/products?type=JEWELRY" className="text-sm hover:text-white transition-colors">
                Jewelry Collection
              </Link>
              <Link href="/products?type=CLOTHING" className="text-sm hover:text-white transition-colors">
                Clothing Collection
              </Link>
              <Link href="/products" className="text-sm hover:text-white transition-colors">
                All Products
              </Link>
            </nav>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">Support</h4>
            <nav className="flex flex-col gap-2">
              <Link href="/cart" className="text-sm hover:text-white transition-colors">
                Shopping Cart
              </Link>
              <Link href="/login" className="text-sm hover:text-white transition-colors">
                My Account
              </Link>
            </nav>
          </div>
        </div>

        {/* Copyright */}
        <div className="py-6 text-center text-xs">
          &copy; {currentYear} Navagunjara. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <a href="#main-content" className="skip-to-content">
        Skip to content
      </a>
      <Header />
      <main id="main-content" className="flex-1">{children}</main>
      <Footer />
      <ToastContainer />
    </>
  );
}
