import type { MetadataRoute } from "next";

/**
 * MASTER-PLAN.md §10 SEO: crawl everything public, keep bots out of the admin
 * dashboard and the API. The sitemap is advertised on the canonical www host —
 * hardcoded rather than read from an env var so a misconfigured deploy can never
 * point Google at the wrong origin.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api"],
    },
    sitemap: "https://www.torisabi.com/sitemap.xml",
  };
}
