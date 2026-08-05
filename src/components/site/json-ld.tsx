/**
 * Renders one structured-data block (MASTER-PLAN.md §10 SEO).
 *
 * The objects come from `@/lib/seo`; this only serialises them into the single
 * script tag crawlers look for. `<` is escaped so an admin-authored product
 * name or description containing `</script>` cannot break out of the tag —
 * `<` is still valid JSON, so parsers read the same value.
 */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
