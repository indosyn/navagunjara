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
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://navagunjara.com"),
  title: {
    default: "Navagunjara — Indian Jewelry & Clothing",
    template: "%s | Navagunjara",
  },
  description:
    "Discover handcrafted Indian jewelry and traditional clothing at Navagunjara. Premium quality, heritage craftsmanship.",
  keywords: ["Indian jewelry", "traditional clothing", "handcrafted", "saree", "gold jewelry", "ethnic wear"],
  authors: [{ name: "Navagunjara" }],
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "Navagunjara",
    title: "Navagunjara — Indian Jewelry & Clothing",
    description: "Discover handcrafted Indian jewelry and traditional clothing. Premium quality, heritage craftsmanship.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Navagunjara — Indian Jewelry & Clothing",
    description: "Discover handcrafted Indian jewelry and traditional clothing. Premium quality, heritage craftsmanship.",
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
