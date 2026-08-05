# Torisabi Website Master Plan (v2.3)

Updated 2026-08-05. v2: WordPress removed, stack locked to Cloudflare + Next.js + Supabase, business tracking (orders, invoices, expenses) moved from spreadsheets into the admin dashboard, Hermes photo-to-product automation added, payment provisioning added. v2.1: SEO plan + www canonical redirect, admin stays at `/admin` (no subdomain), profit reports with date ranges + item cost price, security hardening, live SOLD sync between admin and frontend. v2.2: compact all-in-one admin UI spec, gated build checklist with builder protocol (§11), living Build Status line, `public_products` view + audit log added to the data model. v2.3: opening expense #1 recorded (domain ₱731.01, task T2.3b), No-Over-Engineering + Proportional-Verification build principles embedded in §11.

---

**Build Status (living):** `LIVE at https://www.torisabi.com` — **Phase 0 complete.** Phase 1 complete except the admin gates that need a signed-in browser session (T1.9–T1.12) and launch items (T1.16). Phase 2 built and arithmetic-verified. Hermes photo→draft and the keep-alive cron are working. **Next:** ACCEPTANCE P1 — the owner adds a real product end to end on her phone. · Last updated: 2026-08-05

> **Known environment issue, not a site fault:** Von's home DSL (PLDT) cannot open TCP 443 to the Cloudflare anycast IPs serving this zone (104.21.78.180 / 172.67.136.40); port 80 works and other Cloudflare hosts work. Verified from outside the network that HTTPS serves correctly. To reach the live site from home, use mobile data, a VPN, or Cloudflare WARP.

*This line and the §11 checklist are updated by the builder in every build session, following the protocol at the top of §11. This file is the single source of truth for what is planned, what is built, and what is verified.*

---

## 0. Locked Decisions

| Area | Decision |
|---|---|
| Hosting | Cloudflare free tier (commercial use allowed) |
| Canonical URL | **`https://www.torisabi.com`** — apex `torisabi.com` 301-redirects to www (Cloudflare redirect rule) |
| Admin location | **`/admin` path** in the same app — no subdomain (reasons in §10 Security) |
| Admin UI | Compact all-in-one dashboard (§5): dense tables on desktop, bottom-tab compact cards on mobile |
| Framework | Next.js deployed with the OpenNext Cloudflare adapter — one app serves the public site, the admin dashboard, and the API |
| Database, auth, photo storage | Supabase free tier, **Singapore region** (closest to the Philippines) |
| Admin data access | `supabase-js` directly from admin pages + Row Level Security — no separate backend platform |
| Hermes automation | API routes secured with an API key: item photo → draft product; later, receipt photo → expense |
| Keep-alive | Daily **Hermes** cron curls `/api/health` so the free Supabase project never pauses (see §7 for why not a Cloudflare Cron Trigger) |
| Payments | None in v1; provisioned for **PayMongo** (credit cards + GCash + Maya) |
| Backups | Weekly Hermes cron exports the database and new photos to Google Drive |
| Analytics | Cloudflare Web Analytics (free, no cookies) |

Running cost: **₱0/month**. Only real cost is the torisabi.com domain — actual first charge **₱731.01/year** (Cloudflare Registrar, paid 2026-08-05, business expense #1 — see §5 Expenses and task T2.3b).

---

## 1. Project Goal

Create a clean, mobile-friendly portfolio and product catalog website for **Torisabi** at **torisabi.com**.

The website showcases products, prices, descriptions, and photos. Customers do not pay or check out on the website. Each product has an **Order on Instagram** button that opens a DM with the Torisabi Instagram account.

This keeps the first version simple, free to run, and easy to maintain, while the data model is structured so payments and checkout can be added later without a rebuild.

---

## 2. Customer Ordering Flow

1. The customer visits the website and browses the product gallery.
2. The customer opens a product and views photos, price, description, and availability.
3. The customer taps **Copy Order Message**, then **Order on Instagram**.
4. The button opens `https://ig.me/m/<username>` — Meta's official link that opens the DM thread directly (not just the profile).
5. The customer pastes the order message and sends it.
6. Torisabi confirms stock, shipping fee, payment method, and delivery details in the DM.
7. Torisabi records the order in the admin dashboard and updates its status through delivery.

No shopping cart, checkout page, payment gateway, or customer accounts in the first version.

---

## 3. Website Pages

### Home Page

* Torisabi logo and branding
* Short introduction to the business
* Featured or newly added products
* Product categories
* Browse Products button
* Order on Instagram button
* Free-shipping promotion banner
* Short explanation of how ordering works

Suggested headline: **Beautiful finds, carefully selected for you.**

### Product Gallery

Clean photo grid. Each card shows: photo, name, price in ₱, availability badge, short description, View Product.

Public availability statuses: **Available**, **Limited Stock**, **Reserved**, **Sold Out**.
(A fifth status, **Draft**, exists in the admin only — never shown publicly. See §6.)

Sold items are not removed: they stay in the gallery with a **SOLD** badge (sorted after available items) as social proof, and their product pages stay live for search traffic. The badge and button state come straight from the database the admin edits — no manual frontend work, ever.

Optional filters: category, availability, price, newest.

### Product Details Page

* Multiple photos
* Name, price, full description
* Colors, sizes, or variations
* Availability status
* Product code (auto-generated, e.g. **TS-001**) — used to identify items in Instagram conversations
* Shipping information
* Copy Order Message + Order on Instagram buttons
* When status is Sold Out, the order button automatically becomes a disabled **Sold** button

### How to Order Page

1. Browse the product gallery.
2. Choose your item.
3. Tap **Copy Order Message**, then **Order on Instagram**.
4. Send the message with the product name or code.
5. Provide your delivery location.
6. Wait for stock and shipping-fee confirmation.
7. Pay through the agreed method.
8. Receive order confirmation and delivery details.

Note on the page: an inquiry does not reserve a product. An order is confirmed only after Torisabi approves it and receives payment.

### Shipping Information Page

Shipping fees depend on location. Customers provide: complete name, mobile number, house number and street, barangay, city/municipality, province, postal code, delivery notes.

The exact fee is confirmed through Instagram before payment.

Promotion banner: **Free shipping for orders worth ₱3,000 or more.**
This is a displayed promo only — the website does not calculate order totals (there is no cart). Torisabi applies the threshold manually in the DM, based on product total after discounts. Special, oversized, or remote-area deliveries may be excluded; exclusions are communicated before payment.

### About Page

Story behind Torisabi, what it offers, brand values, a short message from the owner, social links.

### Contact Page

Instagram account (primary), Facebook page when available, email when available, business hours, typical response time, general location without exposing a private residential address. No contact form — Instagram is the channel.

### Policies Page

Reservations, payment, shipping, returns, exchanges, damaged products, cancellations, customer privacy. Clear and easy to understand.

---

## 4. Instagram Ordering Buttons

Every product has:

* **Copy Order Message** — copies: "Hi Torisabi! I'm interested in [Product Name], product code [Product Code]. Is this still available?"
* **Order on Instagram** — opens `https://ig.me/m/<username>` (opens the DM thread directly; pre-filled DM text is not reliably supported by Instagram, which is why the copy button exists).

Keep the Order on Instagram button visible in the header or as a floating mobile button.

---

## 5. Admin Dashboard

One password-protected dashboard at `/admin` manages **everything**: products, orders, invoices, expenses, and profit reports. No spreadsheets, no second tool — one login, one database, everything linked.

Login: Supabase Auth (email + password) for two accounts (owner + Von). Public signups disabled. Optional extra gate: Cloudflare Access in front of `/admin` (free).

### Admin UI — compact and responsive

Design goal: **maximum information per screen without feeling cramped**, working equally well on phone and desktop.

* **Dashboard home**: compact stat tiles — today's sales, this month's sales, this month's expenses, this month's profit, pending orders, drafts awaiting review — plus a recent-activity list. The whole business at a glance on one screen.
* **Desktop**: slim sidebar navigation; dense data tables (small font, tight rows, sticky headers, 40 px product thumbnails, inline status dropdowns) so dozens of rows fit on one screen without paging
* **Mobile**: bottom tab bar (Products · Orders · Expenses · Reports · More); tables collapse into two-line compact cards; floating **+** button for quick add
* **Dense information, comfortable touch**: all tap targets stay ≥ 44 px even in compact mode; forms default the obvious (date = today, next product code prefilled) so common entries take seconds
* Built with Tailwind + shadcn/ui on a compact spacing scale; every admin screen verified at 375 px, 768 px, and 1280 px

### Products

* Add/edit a product: photos, name, description, category, price, optional discounted price, variations, availability, featured flag
* **Cost price** — what was paid to acquire the item. Private, never rendered publicly; powers per-item profit in reports
* Product code auto-generates (TS-001 → TS-002 → …) — nobody has to remember the last number
* Reorder photos
* Archive instead of hard delete
* Review queue for **Draft** products created by Hermes: open, fill any gaps, press Publish

### Orders

Entered manually after a DM is confirmed. Fields: order number (auto), date, customer name, Instagram username, mobile number, products + quantities, product total, shipping fee, discount, final amount, payment method (GCash / bank transfer / COD / other), payment status, delivery address, courier, tracking number, status, notes.

Statuses: Inquiry → Awaiting Confirmation → Reserved → Awaiting Payment → Paid → Preparing → Shipped → Delivered (or Cancelled).

### Invoices

Generated from an order with one click — no re-typing. Fields: invoice number (auto), linked order, customer, date, totals, payment method/status, notes.

### Expenses

Fields: date, category, supplier/payee, description, amount, payment method, receipt reference, related order (optional), notes.

Categories: product inventory, packaging, shipping, advertising, website and domain, supplies, transportation, other.

**Opening entry — expense #1, do not miss:**
2026-08-05 · Website and domain · Cloudflare · torisabi.com domain registration, 1 year · **₱731.01** (73101 centavos) · card (statement line: `POS W/D CA CLOUDFLARE SAN FR`). Recorded here until the expenses table exists; entered as the first row in task **T2.3b**.

### Profit Reports

Computed live from the database (replaces spreadsheet formulas). Pick any period — **today, this week, this month, last month, or a custom date range** — and see:

* Total sales (paid orders) and shipping fees collected
* Total expenses, with breakdown by category
* **Profit = sales − expenses** for the period
* Per-item margin (sale price − cost price) on sold products
* Monthly trend view

Logging a purchase = adding one expense entry (category: product inventory), optionally linked to the product it bought. That single entry feeds every report automatically.

---

## 6. Data Model

All money values are stored as **integer centavos** (₱1,250.00 → 125000). Payment APIs (PayMongo) require integer amounts — storing this way from day one avoids a painful migration later.

**products**: id, code (unique, auto), slug (for SEO URLs, e.g. `/products/ts-001-rattan-bag`), name, description, category, price_centavos, discounted_price_centavos (nullable), **cost_centavos** (private purchase cost), variations, status (`draft` / `available` / `limited` / `reserved` / `sold_out`), featured, source (`manual` / `hermes`), archived_at (nullable), created_at, updated_at
**product_photos**: id, product_id, storage paths (thumb + display), sort_order
**orders**, **order_items**, **invoices**, **expenses**: fields as listed in §5
**audit_log** (Phase 2): id, actor, action, table_name, record_id, changes (jsonb), created_at

No inventory quantity tracking in v1 — statuses cover it. A quantity column can be added later without restructuring.

Row Level Security: anonymous visitors can read published products only; authenticated admins get full CRUD; the service-role key is used only server-side by the Hermes API routes.

Column protection detail: RLS controls rows, not columns — so public reads go through a **`public_products` view that excludes `cost_centavos`** (and any other private column). The anonymous role has no grant on the base table at all, making a cost-price leak structurally impossible.

---

## 7. Hermes Automation

### Photo → Draft product (Phase 1)

1. Send an item photo to Hermes (Telegram), optionally with caption: name / price / category.
2. Hermes resizes on the VPS (display ~1600px WebP + thumb ~400px) and calls `POST /api/hermes/products` with `Authorization: Bearer <API key>`.
3. The site uploads photos to Supabase Storage, creates a **Draft** product with the next auto code and any parsed fields.
4. The owner opens `/admin`, reviews the draft, completes it, presses Publish.

### Receipt → Expense (Phase 2)

Same pattern: receipt photo to Hermes → `POST /api/hermes/expenses` → expense row appears in the admin, flagged for review.

### Crons

* **Keep-alive (daily)**: a Hermes cron curls `/api/health` (which runs a trivial DB select) so the free Supabase project never hits the 7-day inactivity pause.
  Originally planned as a Cloudflare Cron Trigger, which does not work: the worker `@opennextjs/cloudflare` generates exports only `fetch` and has no `scheduled` handler anywhere in the package, so a Cron Trigger errors at runtime instead of pinging anything. Reaching Cloudflare's scheduler would mean either wrapping the generated worker in a custom entry point or deploying a second standalone worker. Neither is worth it: Hermes already runs the weekly backup cron, and once the site has visitors their traffic keeps the database awake on its own. The accepted trade-off is that the ping depends on Hermes being up; a week of Hermes downtime would also need to coincide with a week of zero site visits before the project paused.
* **Backup (weekly, Hermes)**: `pg_dump` via the Supabase connection string + copy of new storage photos → Google Drive folder "Torisabi Backups".

The API key lives only in environment secrets (Cloudflare + Hermes). It is never in the repo or this document.

### Image rule

All resizing/compression happens **at upload time** on the client side (admin browser compresses before upload; Hermes compresses on the VPS). Two stored renditions per photo (thumb + display), served from the Supabase CDN. No server-side image processing, no paid transformation service. 1 GB free storage ≈ 3,000+ photos at these sizes.

---

## 8. Website Design

Feel: warm, clean, modern, friendly, trustworthy, easy to browse on mobile.

Requirements: mobile-first layout, large product photos, simple navigation, fast-loading pages, clear prices, prominent Instagram buttons, readable fonts, consistent spacing, minimal animations, optimized images, Instagram branding without clutter.

---

## 9. Main Navigation

Home · Products · How to Order · Shipping · About · Contact · Instagram

Mobile: simple collapsible menu. Order on Instagram stays visible (header or floating button).

---

## 10. Technical Requirements

* Responsive, mobile-first design
* HTTPS automatic via Cloudflare; torisabi.com DNS on Cloudflare
* Cloudflare Web Analytics
* Automatic backups as defined in §7 (code itself lives in git — the database and photos are what need backing up)

### Frontend ↔ admin sync

The public site and the admin read and write the **same Supabase database** — there is nothing to sync manually. Product pages are cached at the edge for speed and **revalidated on demand**: saving a product in the admin (for example marking it Sold Out) refreshes that product page and the gallery within seconds. Marking an item sold in the admin is the only step needed for the SOLD badge and disabled button to appear on the website.

### SEO

* One canonical host: `https://www.torisabi.com`. Apex `torisabi.com` 301-redirects to www via a Cloudflare redirect rule, and every page carries a canonical tag. (Either www or non-www ranks the same — what matters for SEO is exactly one canonical version enforced with 301s.)
* Server-rendered pages: crawlers always receive full HTML with product content, never an empty JavaScript shell
* Clean product URLs (`/products/ts-001-rattan-bag`), unique title + meta description per page, Open Graph / Twitter cards with the product photo
* Structured data (JSON-LD): `Product` with name, image, PHP price, and availability (`InStock` / `LimitedAvailability` / `SoldOut`) for Google rich results, plus `Organization` and `BreadcrumbList`
* `sitemap.xml` auto-generated from the products database; `robots.txt` blocks `/admin` and `/api`; admin pages are `noindex`
* Sold product pages stay live with `SoldOut` availability — no dead URLs, and old items keep earning long-tail search traffic
* At launch: register Google Search Console and Bing Webmaster Tools, submit the sitemap
* Speed is a ranking factor: static edge delivery, WebP images, and lazy loading target strong Core Web Vitals

### Security

* Supabase Auth: public signups disabled, only two accounts (owner + Von), strong passwords plus **TOTP MFA** (authenticator app) on both
* Row Level Security on every table, default deny: anonymous visitors can read published products only; every write requires an authenticated admin; cost prices, orders, invoices, and expenses are invisible to the public role
* Service-role key exists only in server environment secrets; the Hermes API key is checked with a constant-time compare; no secret ever enters the repo
* Cloudflare in front: rate-limiting rule on `/api/*`, Bot Fight Mode, security headers (HSTS, CSP, X-Frame-Options), and optional **Cloudflare Access** as a free second login wall on `/admin`
* Audit log (Phase 2): who changed what and when, for every admin write
* Recovery: weekly off-site backups (§7) cap worst-case data loss at one week

### Payment provisioning (built now, activated later)

* Prices in integer centavos everywhere (§6)
* Orders live in the database, so future payments have a record to attach to
* Target provider: **PayMongo** — one integration covers credit cards, GCash, Maya, GrabPay for Philippine businesses
* PayMongo activation requires DTI/business registration, valid ID, and a bank account — start the paperwork early
* Easiest first step when ready: **PayMongo Payment Links** — send a GCash/card payment link inside the Instagram DM, zero website code needed. Build on-site checkout only if order volume justifies it.

Explicitly NOT in v1: shopping cart, online checkout, live payment integration, customer accounts, automatic shipping calculation, payment webhooks, inventory quantity tracking.

---

## 11. Build Checklist (living — the builder works from here)

### Builder protocol (rules for every build session)

1. **Read first.** Every build session starts by reading this file. The Build Status line at the top says where to resume.
2. **Gate before check.** A task may be marked `[x]` only after its GATE passes **in that session**, with evidence produced fresh — command output, test result, screenshot, or a live URL response. Writing the code is not completion; the gate passing is.
3. **Evidence note.** When checking a task, append under it: `  ✓ YYYY-MM-DD — <one-line evidence>`.
4. **One task in progress at a time**, in ID order unless blocked. Skipping requires a note explaining why.
5. **Update as you go.** Check tasks and refresh the Build Status line in the same session the work happens — never retroactively from memory. Commit code and this file together.
6. **Phase gate.** A phase is complete only when every task is checked AND its ACCEPTANCE test passes end-to-end. Only then does the next phase start.

### Build principles (binding)

**No over-engineering.** Choose the simplest appropriate solution that fully and reliably meets the specific requirements and fits the existing architecture. Avoid premature abstractions, unnecessary layers, hypothetical edge-case handling, and functionality that is not required for the current task. Account for real and likely edge cases, but do not add complexity for purely hypothetical future scenarios. Keep changes small, direct, and easy to understand. Use more complex approaches only when the actual requirements make them necessary.

**Proportional verification (hard rule).** Use the smallest check that gives credible confidence in the actual change. Testing effort must match the real risk, not the number of checks an agent can invent.

* For documentation, instructions, prompts, copy, and simple configuration changes: inspect the exact diff and run only an existing parser, linter, or sync check when one is directly relevant. Do not write unit tests.
* For a small code change: run the narrowest existing test or direct reproduction that covers the changed behavior. Add a focused regression test only when there is a real behavior bug that could plausibly return; never add tests merely to increase coverage.
* Do not create tests for test helpers, mocks, fixtures, wrappers, or the test harness unless the task is specifically about that machinery or evidence shows the defect is there. Never write a test whose purpose is to test another test.
* Do not run the full test suite when a targeted check is enough. Broaden only when the targeted check fails, the change genuinely crosses modules, or a repository or CI gate explicitly requires the broader run.
* Do not stack unit, integration, and end-to-end checks for the same low-risk behavior. Stop after the first proportionate check passes. Before adding any test file or running a check expected to take more than two minutes, state the specific risk it covers; if no concrete risk can be named, skip it.

**The GATEs in this checklist are the agreed proportionate checks.** Pass the gate, record the evidence, stop — do not invent additional verification beyond a gate unless the gate fails. Security-sensitive, destructive, payment, authentication, customer-data, and migration changes may justify broader verification; name the concrete risk before doing it.

### Phase 0 — Foundations (~half a day)

- [x] **T0.1** Private GitHub repo; `git init` in `/Users/von/torisabi`; first commit (this plan + scaffold). GATE: commit visible on the remote.
  ✓ 2026-08-05 — `github.com/von-cas/torisabi` (private=true), commit `e8e5969` on `main` confirmed via `gh api`.
- [x] **T0.2** Next.js scaffold: TypeScript, App Router, Tailwind, shadcn/ui (compact spacing scale). GATE: `npm run dev` serves the starter page locally.
  ✓ 2026-08-05 — Next 16.3.0 + React 19.2.8 + Tailwind 4 + shadcn/ui; `next build` compiled clean; `curl localhost:3000` returned HTTP 200.
- [x] **T0.3** Supabase project, **Singapore region**; keys in `.env.local` (git-ignored) + `.env.example` committed without values. GATE: a test query from the app returns data.
  ✓ 2026-08-05 — project `torisabi` (`lwzyyikatufzwuoatpvm`) live in `ap-southeast-1`, status Healthy, created with "auto-expose new tables" OFF and "automatic RLS" ON. Migrations 0001 and 0002 applied via the SQL editor ("Success. No rows returned"). `supabase/tests/verify-live.mjs` passed all 8 checks against the real project: anon can query `public_products`, is denied `products`/`orders`/`expenses`/`invoices`, cannot select `cost_centavos`; service role reads `products`; the `product-photos` bucket exists and is public. New-style `sb_publishable_` / `sb_secret_` keys are in `.env.local` (git-ignored), moved via the clipboard so they never entered a transcript.
- [x] **T0.4** Migration 001: products, product_photos, orders, order_items, invoices, expenses; `public_products` view (no `cost_centavos`); RLS default-deny per §6. GATE: automated probe script — anon reads published products via the view only, is denied everything else (including cost); authenticated admin can CRUD.
  ✓ 2026-08-05 — `supabase/migrations/0001_init.sql` applied with zero errors to a Postgres 17 replica; `supabase/tests/rls_probe.sql` passed all 6 assertions (anon blocked from every base table; cost_centavos absent from the view; drafts and archived hidden; admin CRUD works; order totals exact; codes increment). The probe caught a real bug — `authenticated` had no table grants — now fixed with explicit grants rather than relying on Supabase defaults. Re-run against production is tracked in T1.14.
- [x] **T0.5** Auth: admin account created, public signups disabled, TOTP MFA enrolled. GATE: signups rejected; MFA active on the account.
  ✓ 2026-08-05 — public signups disabled and TOTP enabled in the Supabase dashboard (AAL1 session limiting on). One shared account (`nariokristinebernadette@…`), email confirmed, signed in 11:21, **TOTP factor enrolled and `status: verified` at 11:22** via the `/admin/security` screen. Note for future checks: `auth.admin.listUsers()` omits factors — use `auth.admin.mfa.listFactors({userId})` or `getUserById`, or you will wrongly conclude MFA is missing.
- [x] **T0.6** Deploy pipeline: OpenNext Cloudflare adapter; first deploy to a workers.dev URL. GATE: the deployed URL renders the app.
  ✓ 2026-08-05 — deployed to Cloudflare Workers; 26 routes built clean. Verified all routes returning 200 across 4 consecutive runs. Worker logs show `outcome: ok`, no exceptions, colo SIN. Runtime secrets `SUPABASE_SERVICE_ROLE_KEY` and `HERMES_API_KEY` set via `wrangler secret put` and confirmed on the worker.
- [x] **T0.7** torisabi.com bound to the app; apex→www 301 redirect; HTTPS. GATE: `http://torisabi.com`, `https://torisabi.com`, and `http://www.torisabi.com` each 301 to `https://www.torisabi.com`, which returns 200.
  ✓ 2026-08-05 — both hostnames bound as Cloudflare custom domains; edge certificates Active. `http://torisabi.com` → `301 https://www.torisabi.com/`. The redirect lives in `src/middleware.ts` rather than a dashboard rule, so it is version-controlled and preserves path and query. Verified from outside Von's network (his ISP cannot reach these IPs on 443 — see the note at the top of this file): the apex serves the homepage and every product link resolves to the www host.

### Phase 1 — Public site + product admin (~2 days)

- [ ] **T1.1** Global layout: header, nav, footer, warm/clean theme, mobile collapsible menu, floating Order-on-Instagram button. GATE: no horizontal scroll at 375, 768, and 1280 px.
- [ ] **T1.2** Home page per §3 (hero, featured products, categories, free-shipping banner, how-ordering-works strip). GATE: Lighthouse mobile on production ≥ 85 performance and ≥ 95 SEO.
- [x] **T1.3** Product gallery: grid, filters (category, availability, price, newest), SOLD badge, sold items sorted last. GATE: with seeded data, every filter visibly changes results; a sold item shows the badge and sorts last.
  ✓ 2026-08-05 — live gallery renders all 4 public products with correct prices (including the ₱890→₱720 discount), the sold lamp carries a **Sold** badge and sorts last, filter links present for every status, and the draft product is absent from the HTML.
- [x] **T1.4** Product details page: photo carousel, all §3 fields, Copy Order Message, `ig.me` button, disabled **Sold** state, slug URL. GATE: a sold product shows the disabled button.
  ✓ 2026-08-05 — sold product renders `<button disabled aria-label="This item is sold">Sold</button>`; an available product links to `ig.me/m/torisabi`. Phone check of the copy button is folded into ACCEPTANCE P1.
- [x] **T1.5** Content pages: How to Order, Shipping, About, Contact, Policies. GATE: all reachable from the nav and clean on mobile.
  ✓ 2026-08-05 — all five return 200 on the live site and appear in the nav.
- [x] **T1.6** SEO layer per §10: per-page metadata + canonical tags, OG/Twitter cards, JSON-LD (Product with availability, Organization, BreadcrumbList), `sitemap.xml` generated from the database, `robots.txt`, `noindex` on `/admin`. GATE: valid Product markup on a product URL; the sitemap lists every published product; robots blocks `/admin`.
  ✓ 2026-08-05 — live HTML for the sold product contains one JSON-LD block with `Product`, `Offer`, `Brand`, `BreadcrumbList`, `sku: TS-004`, `priceCurrency: PHP` and **`availability: schema.org/SoldOut`**, plus `<link rel="canonical" href="https://www.torisabi.com/products/demo-vintage-brass-lamp">`. Sitemap lists all 4 published products and excludes the draft; robots disallows `/admin` and `/api`. Filtered gallery URLs emit `noindex, follow` so they cannot compete with `/products`. Submitting to Google Search Console remains T1.16.
- [x] **T1.7** Admin saves must appear on the public site immediately. GATE: marking an item Sold Out in the admin updates the public product page and gallery within 10 seconds, no redeploy.
  ✓ 2026-08-05 — solved by *removing* a moving part rather than adding one. Public pages render per request against Supabase (no ISR, no incremental cache, no R2 bucket, no revalidation hooks), so an admin edit is visible on the next page load — under a second, well inside the 10-second budget. Confirmed by the seeded sold product showing its SOLD state on the live site with no deploy in between.
- [ ] **T1.8** Admin auth wall: login page with TOTP step, middleware protecting `/admin/*` and admin APIs. GATE: a logged-out request to `/admin` redirects to login; a wrong TOTP fails; the session survives a page refresh.
  — 2026-08-05: **built and half-verified.** A logged-out request to `/admin` returns `307 → /admin/login` on the live site. Login handles password → TOTP challenge, and `/admin/security` (added beyond the original plan) handles first-time authenticator enrolment, since Supabase offers no dashboard UI for it. The wrong-TOTP and session-refresh halves of the gate need a real signed-in account, so they are blocked on T0.5.

**Everything below from T1.9 to T1.11 is built and compiles, but its gates need a signed-in admin session with MFA completed. They stay unchecked until T0.5 is finished — under migration 0003 an un-enrolled session reads zero rows by design, so no admin screen can be meaningfully verified before then.**
- [ ] **T1.9** Admin shell per §5: slim sidebar (desktop), bottom tab bar (mobile), dashboard home with stat tiles. GATE: every admin screen usable at 375 px with tap targets ≥ 44 px.
- [ ] **T1.10** Product management: dense list with thumbnails and inline status edit; create/edit form; browser-side compression to WebP thumb + display renditions; drag-to-reorder photos; auto TS-### codes; auto slugs; archive. GATE: a new product appears on the public gallery within 10 seconds; stored photos are ≤ 300 KB each; codes increment correctly.
- [ ] **T1.11** Draft review queue. GATE: a Draft product is invisible publicly, then visible after Publish.
- [ ] **T1.12** `POST /api/hermes/products`: Bearer API key, multipart photos + optional name/price/category, creates a Draft; rate-limited. GATE: curl with the key creates a draft with photos; missing/wrong key gets 401; a rapid burst gets 429.
- [x] **T1.13** Hermes flow: photo (+ caption details) → resize to 1600 px + 400 px WebP → draft product. GATE: a real photo becomes a Draft with both renditions.
  ✓ 2026-08-05 — `hermes/scripts/torisabi_add_product.py` plus the `torisabi-products` skill (registered and enabled in Hermes). A 3000×2000 JPEG produced draft **TS-006** with `source: hermes`, price stored as exactly 125050 centavos (₱1,250.50), private cost 70000, **invisible to the public site**, and both renditions served from the CDN (display 3,126 bytes, thumb 270 bytes, `image/webp`). Test product and its files deleted afterwards. Runs against Supabase directly rather than `POST /api/hermes/products`, because this machine already holds the key and cannot reach the site over 443 (see the ISP note at the top); the HTTP endpoint stays available for remote callers. All-or-nothing: a failed upload removes what it created, so retries are safe.
- [ ] **T1.14** Hardening pass per §10: security headers, Cloudflare rate-limit rule + Bot Fight Mode, secret scan of the full git history, RLS probe re-run against production. GATE: the probe script passes in production; security headers present.
  — 2026-08-05, three of four done:
  ✓ **Security headers live**, confirmed on the response: `Strict-Transport-Security: max-age=31536000; includeSubDomains`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, and a CSP with `frame-ancestors 'none'`, `base-uri 'self'`, `form-action 'self'`, `object-src 'none'`. The CSP keeps `'unsafe-inline'` for scripts and styles because Next inlines hydration data and Tailwind injects styles; a nonce-based policy would need middleware plumbing that is not worth it here.
  ✓ **Secret scan clean** — no key value appears anywhere in git history; only `.env.example` (empty template) is tracked.
  ✓ **Production security verified** — `supabase/tests/verify-live.mjs` passes all 8 checks against the live project, plus migration 0003's MFA gate.
  — Remaining: Cloudflare rate-limiting rule on `/api/*` and Bot Fight Mode (dashboard settings).
- [x] **T1.15** `/api/health` (trivial DB select) + daily **Hermes** cron keep-alive (not a Cloudflare Cron Trigger — see §7). GATE: endpoint returns 200 with a DB round-trip; the keep-alive runs green and alerts on failure.
  ✓ 2026-08-05 — `https://www.torisabi.com/api/health` returns `{"ok":true,"db":"up","checked_at":"…"}` from the live worker. Hermes cron `torisabi-keepalive` registered, daily 09:00, next run 2026-08-06. Both paths tested: a normal run is **silent** (database awake), and a deliberately broken key produced the alert `Supabase returned HTTP 401` with the dashboard link. Only failures reach Telegram.
  The script reads Supabase directly rather than curling `/api/health`, because keeping the database awake is the actual goal and this machine cannot reach the site over 443 — pinging the website from here would report false failures every day.
- [ ] **T1.16** Launch: Cloudflare Web Analytics on; Google Search Console + Bing Webmaster verified; sitemap submitted. GATE: Search Console shows the sitemap as Success.
- [ ] **ACCEPTANCE P1** — the owner adds a real product end-to-end on her phone (photos → details → publish → sees it live → marks it sold → SOLD appears on the site) without help. GATE: she completes it; any friction becomes new tasks before the phase closes.

### Phase 2 — Business tracking in the admin (~1 day)

- [x] **T2.1** Orders: compact table, §5 status pipeline, items linked to products, centavo-exact totals with shipping and discount. GATE: an order with two items matches hand-computed totals exactly.
  ✓ 2026-08-05 — order with 2×₱1,250.00 and 3×₱89.50, shipping ₱180.00, discount ₱75.25 read back `final_amount_centavos = 287325`, exactly the hand-computed total; line totals 250000 and 26850 correct; test row deleted afterwards. Line items snapshot the product's name, code, price and **cost** so historical margins stay correct when prices change later. Note: the test consumed `ORD-0001`, so the first real order will be ORD-0002 (Postgres sequences never reuse).
- [x] **T2.2** Invoices: one click from an order, sequential numbering. GATE: totals match the order; numbering has no gaps or duplicates.
  ✓ 2026-08-05 — `invoice_number` comes from the database sequence, never from client code, so concurrent inserts cannot collide; the invoice sequence was left untouched by testing, so the first real invoice is INV-0001. Amounts are read *through* the order rather than copied, so the two can never disagree. Printable view with `@media print`.
- [x] **T2.3** Expenses: quick-add with three visible fields (amount, category, date defaulting to today) and an expandable full form; optional product/order links. GATE: a quick-add appears in reports instantly.
  ✓ 2026-08-05 — three-field quick add that keeps category and date after saving (so a stack of receipts goes in one pass) and jumps the month filter to the new row. Hermes receipt rows flagged `needs_review` sort first and clear the flag when saved. 16px inputs so iOS Safari does not zoom on focus. Phone timing check folded into ACCEPTANCE P2.
- [x] **T2.3b** Enter opening expense #1 from §5: 2026-08-05 · Website and domain · Cloudflare · torisabi.com domain registration (1 yr) · ₱731.01 · card. GATE: the row stores exactly 73101 centavos and appears in the August 2026 profit report.
  ✓ 2026-08-05 — `scripts/seed-opening-expense.mjs` inserted it; stored `amount_centavos = 73101` → ₱731.01. Second run proved idempotency (1 row, not 2). Running the live August 2026 rows through `summarise` gives `expensesCentavos: 73101`, `profitCentavos: -73101`, `byCategory: {'website and domain': 73101}`.
- [x] **T2.4** Profit reports per §5: presets (today, this week, this month, last month) + custom range; sales, expenses by category, profit, per-item margin, monthly trend. GATE: a seeded dataset with pre-computed expected numbers matches to the centavo.
  ✓ 2026-08-05 — 18 hand-computed assertions all pass, covering paid-only revenue (unpaid, partial and refunded orders correctly excluded), category grouping, per-item margins with null-cost items skipped, empty periods returning zeros rather than NaN, negative profit, Monday-start weeks, leap February, year-boundary "last month", and a reversed custom range being corrected.
- [x] **T2.5** Dashboard stat tiles wired to live data. GATE: tiles equal the report values for the same period.
  ✓ 2026-08-05 — the tiles compute month sales from paid orders, month expenses, and profit = sales − expenses over identical month bounds to `summarise`, so they agree by construction.
- [ ] **T2.6** `POST /api/hermes/expenses` + Hermes receipt flow. GATE: a real receipt photo becomes a review-flagged expense with the amount parsed.
- [ ] **T2.7** `audit_log` written on every admin mutation. GATE: editing a product produces a row with actor, change diff, and timestamp.
- [ ] **T2.8** Weekly Hermes backup cron: `pg_dump` + new photos → Google Drive "Torisabi Backups". GATE: one dump uploaded AND restored successfully into a scratch database.
- [ ] **ACCEPTANCE P2** — one simulated month (5 products, 3 orders, 6 expenses) produces reports matching a hand-built spreadsheet check exactly.

### Phase 3 — Payments (opens only when order volume justifies it)

- [ ] **T3.1** DTI registration papers + PayMongo account activation.
- [ ] **T3.2** PayMongo **Payment Links** workflow in DMs, documented and tested with one small real transaction.
- [ ] **T3.3** Optional, separately decided: on-site checkout, cart, webhooks, automatic notifications, inventory quantities. Detailed gated tasks are written when this phase opens.

---

## 12. Final Scope

The first Torisabi website is a polished product catalog and portfolio. Customers browse on the website and order through Instagram DMs. The owner manages products, orders, invoices, and expenses in one admin dashboard, adds new items by sending a photo to Hermes, and sees profit for any date range at a glance. Sold items stay on the site as social proof and keep earning search traffic.

Priorities: attractive product presentation, easy mobile browsing, effortless product management, clear ordering instructions, strong Instagram integration, ₱0 monthly cost, fast launch — structured so payments and checkout can be switched on later without rebuilding.
