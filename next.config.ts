import type { NextConfig } from "next";

// `NEXT_PUBLIC_APP_URL` is a public URL like `https://navagunjara.com`. The
// Next.js Server Actions guard wants a bare `host[:port]`, e.g. `navagunjara.com`.
const publicAppUrl =
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
let allowedHost = "localhost:3000";
try {
  allowedHost = new URL(publicAppUrl).host;
} catch {
  // fall through with default
}

// Razorpay checkout script + Cloudinary images require us to relax the default
// CSP slightly. Keep this list narrow: any new third-party script needs to be
// reviewed and added here explicitly rather than widening `script-src` to '*'.
const RAZORPAY_HOST = "https://checkout.razorpay.com";
const RAZORPAY_API = "https://api.razorpay.com";
const RAZORPAY_LUMBERJACK = "https://lumberjack.razorpay.com";

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: [
      `default-src 'self'`,
      `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${RAZORPAY_HOST}`,
      `style-src 'self' 'unsafe-inline'`,
      `img-src 'self' data: blob: https://res.cloudinary.com https://images.unsplash.com https://via.placeholder.com`,
      `font-src 'self' data:`,
      `connect-src 'self' ${RAZORPAY_API} ${RAZORPAY_LUMBERJACK}`,
      `frame-src 'self' ${RAZORPAY_HOST} https://api.razorpay.com`,
      `object-src 'none'`,
      `base-uri 'self'`,
      `form-action 'self'`,
      `frame-ancestors 'none'`,
      `upgrade-insecure-requests`,
    ].join("; "),
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(self)",
  },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "via.placeholder.com" },
    ],
  },
  experimental: {
    serverActions: {
      // Read from NEXT_PUBLIC_APP_URL so we don't reject prod origins. Always
      // allow localhost:3000 for local dev / e2e runs.
      allowedOrigins: Array.from(
        new Set([allowedHost, "localhost:3000"])
      ),
    },
  },
  async headers() {
    return [
      {
        // Apply hardening headers to every response. Static assets are not
        // sensitive but the headers are cheap and make scanners happy.
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;

