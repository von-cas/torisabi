import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

// Deliberately not a nonce-based CSP: Next inlines hydration data and Tailwind
// injects styles, so 'unsafe-inline' is required for script-src and style-src
// without adding nonce plumbing through middleware. The clauses that actually
// matter here — frame-ancestors, base-uri, form-action, and a closed default-src
// — are all enforced.
const CSP = [
  "default-src 'self'",
  "img-src 'self' data: blob: https://*.supabase.co",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const nextConfig: NextConfig = {
  images: {
    // Supabase Storage serves product photos; the exact host is set per environment.
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co" }],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          { key: "Content-Security-Policy", value: CSP },
        ],
      },
    ];
  },
};

// Gives `next dev` access to Cloudflare bindings.
initOpenNextCloudflareForDev();

export default nextConfig;
