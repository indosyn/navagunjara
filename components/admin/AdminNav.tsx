"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/products", label: "Products", icon: "🏷️" },
  { href: "/admin/orders", label: "Orders", icon: "📦" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen p-4">
      <div className="mb-8">
        <Link href="/" className="text-xl font-bold text-amber-400">
          Navagunjara
        </Link>
        <p className="text-xs text-gray-400 mt-1">Admin Panel</p>
      </div>
      <nav className="space-y-1">
        {links.map((link) => {
          const active =
            link.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                active
                  ? "bg-amber-700 text-white"
                  : "text-gray-300 hover:bg-gray-800"
              }`}
            >
              <span>{link.icon}</span>
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
