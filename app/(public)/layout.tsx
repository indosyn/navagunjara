"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { useCart } from "@/hooks/useCart";
import { CartDrawer } from "@/components/cart/CartDrawer";

function Header() {
  const { data: session } = useSession();
  const totalItems = useCart((s) => s.totalItems);
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 bg-white border-b">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 h-16">
          <Link href="/" className="text-xl font-bold text-amber-700">
            Navagunjara
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link href="/products" className="hover:text-amber-700">
              Products
            </Link>
            {session && (
              <Link href="/wishlist" className="hover:text-amber-700">
                Wishlist
              </Link>
            )}
            {session?.user.role === "ADMIN" && (
              <Link href="/admin" className="hover:text-amber-700">
                Admin
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setCartOpen(true)}
              className="relative text-gray-700 hover:text-amber-700"
              aria-label="Open cart"
            >
              🛒
              {totalItems() > 0 && (
                <span className="absolute -top-2 -right-2 bg-amber-700 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {totalItems()}
                </span>
              )}
            </button>

            {session ? (
              <div className="flex items-center gap-3 text-sm">
                <Link
                  href="/account"
                  className="text-gray-700 hover:text-amber-700"
                >
                  {session.user.firstName}
                </Link>
                <button
                  onClick={() => signOut()}
                  className="text-gray-500 hover:text-red-600 text-sm"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="text-sm font-medium text-amber-700 hover:text-amber-800"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </header>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}

function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-8 text-center text-sm">
        © {new Date().getFullYear()} Navagunjara. All rights reserved.
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
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
