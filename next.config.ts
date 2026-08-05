import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  images: {
    // Supabase Storage serves product photos; the exact host is set per environment.
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co" }],
  },
};

// Gives `next dev` access to Cloudflare bindings.
initOpenNextCloudflareForDev();

export default nextConfig;
