<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Torisabi — working notes for agents

Product catalog for torisabi.com. Customers browse here and order through
Instagram DMs; the owner runs products, orders, invoices and expenses from
`/admin`. **`MASTER-PLAN.md` is the single source of truth** — read it before
doing anything, and follow the builder protocol in its §11.

## Stack

Next.js 16 (App Router) · React 19 · Tailwind v4 · shadcn/ui · TypeScript ·
Supabase (Postgres + Auth + Storage, Singapore) · Cloudflare Workers via
`@opennextjs/cloudflare`.

## Rules that are easy to get wrong

- **Money is integer centavos.** ₱1,250.00 is `125000`. Never floats. Use
  `src/lib/money.ts`.
- **Public reads go through the views**, `public_products` and
  `public_product_photos` — never the base tables. `cost_centavos` is private and
  the `anon` role has no grant on `products` at all. Use `src/lib/queries.ts`.
- **Sold items stay on the site.** Status `sold_out` renders a SOLD badge and a
  disabled button; it is never hidden. Only `draft` and archived are invisible.
- **Public pages render dynamically** so an admin edit shows immediately. Do not
  add ISR or an incremental cache without revisiting §10 of the plan.
- The orders payment column is `payment_state`, not `payment_status`.
- Product codes, order numbers and invoice numbers come from database
  sequences. Never generate them client-side.

## Verify proportionally

`MASTER-PLAN.md` §11 carries the binding build principles: simplest solution
that meets the requirement, and the smallest check that gives real confidence.
The task GATEs in §11 *are* the agreed checks — pass one, record the evidence,
stop. Do not add test files to raise coverage.

Useful commands:

```bash
npm run dev          # local site at :3000
npx tsc --noEmit     # type check
npm run preview      # build + run the real Workers runtime locally
npm run deploy       # build + deploy to Cloudflare
```

Schema changes go in `supabase/migrations/`. After any change to security rules,
re-run the probe:

```bash
psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f supabase/tests/rls_probe.sql
```

## Secrets

`.env.local` and `.dev.vars` are git-ignored and must stay that way.
`SUPABASE_SERVICE_ROLE_KEY` and `HERMES_API_KEY` are server-only — never prefix
either with `NEXT_PUBLIC_`, and never import `src/lib/supabase/service.ts` from a
Client Component.
