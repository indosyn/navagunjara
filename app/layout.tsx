import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/providers/SessionProvider";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "Navagunjara — Indian Jewelry & Clothing",
    template: "%s | Navagunjara",
  },
  description:
    "Discover handcrafted Indian jewelry and traditional clothing at Navagunjara. Premium quality, heritage craftsmanship.",
  keywords: ["Indian jewelry", "traditional clothing", "handcrafted", "saree", "gold jewelry", "ethnic wear"],
  authors: [{ name: "Navagunjara" }],
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "Navagunjara",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col font-sans antialiased">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
