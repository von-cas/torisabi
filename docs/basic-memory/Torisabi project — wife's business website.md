---
title: Torisabi project — wife's business website
type: note
permalink: ai-memory/projects/torisabi-project-wifes-business-website
tags:
- torisabi
- website
- business
- hermes
---

# Torisabi project — wife's business website

Started 2026-08-05. Project folder `/Users/von/torisabi`, domain **torisabi.com**. Product catalog site for my wife's business; customers order via Instagram DM (`ig.me/m/<username>` + copy-message button), no on-site checkout in v1. Plan file: `/Users/von/torisabi/MASTER-PLAN.md` (v2.3, 2026-08-05) — single source of truth, with a living "Build Status" line and a gated build checklist in §11.

## Locked stack (Von, 2026-08-05)
- [decision] Hosting: Cloudflare free tier. Framework: Next.js via OpenNext Cloudflare adapter — ONE app serves public site + `/admin` + API. No WordPress, no Vercel (Hobby ToS bans commercial use).
- [decision] Canonical URL `https://www.torisabi.com`; apex 301-redirects to www via Cloudflare redirect rule.
- [decision] Admin lives at `/admin` path, NOT a subdomain. All-in-one dashboard: products, orders, invoices, expenses, profit reports. Compact UI: dense tables + stat tiles on desktop, bottom tab bar + two-line cards + quick-add on mobile, tap targets ≥44px, verified at 375/768/1280px. Tailwind + shadcn/ui.
- [decision] Supabase free tier, Singapore region: Postgres + Auth (signups disabled, 2 admin accounts, TOTP MFA) + Storage. Admin CRUD via supabase-js + RLS default-deny. Public reads go through a `public_products` VIEW that excludes `cost_centavos` (anon has no grant on the base table).
- [decision] Money stored as integer centavos. Payments deferred; target PayMongo (cards + GCash + Maya; needs DTI docs). First payment step = PayMongo Payment Links in DMs.
- [decision] Hermes: item photo (Telegram) → resize on VPS (1600px WebP + 400px thumb) → `POST /api/hermes/products` with Bearer API key → Draft product for review/publish. Phase 2: receipt → `POST /api/hermes/expenses`.
- [decision] Sold items stay on site with SOLD badge + disabled button, sorted after available; pages stay live for SEO. Frontend reads same DB as admin; on-demand revalidation on admin save (sold status live in ≤10s).
- [decision] SEO: server-rendered pages, slug URLs, JSON-LD Product schema with availability, auto sitemap from DB, robots blocks /admin + /api, Search Console + Bing at launch.
- [decision] Crons: daily Cloudflare Cron Trigger → `/api/health` keep-alive; weekly Hermes cron backs up pg_dump + new photos to Google Drive "Torisabi Backups" (gate includes a restore test).
- [decision] Builder protocol (MASTER-PLAN §11): every build session reads the plan first; tasks have IDs with explicit GATEs; a task is checked `[x]` only after its gate passes in-session with fresh evidence (`✓ date — evidence`); Build Status line updated every session; phases close only after their ACCEPTANCE test (P1 = wife publishes and sells a product from her phone unaided; P2 = simulated month matches hand-checked numbers). Von's No-Over-Engineering and Proportional-Verification rules are embedded in §11 as binding build principles — the gates ARE the agreed proportionate checks, no extra test stacking.
- [fact] Image rule: resize at upload time only (browser or Hermes VPS); two renditions per photo; no server-side image processing.

## Business records
- [fact] **Torisabi business expense #1**: 2026-08-05, ₱731.01 (73101 centavos), Cloudflare — torisabi.com domain registration 1 year, paid by card (statement line `POS W/D CA CLOUDFLARE SAN FR`). Recorded in MASTER-PLAN §5 opening entry; to be entered into the expenses table at task T2.3b.
- [fact] torisabi.com is already registered via Cloudflare Registrar — the Cloudflare account and DNS zone exist, so T0.7 is binding + redirects only.

## Status
- Plan v2.3 done 2026-08-05. Build not started. Next task: T0.1 (repo init). Estimates: Phase 0 ~half day, Phase 1 ~2 days, Phase 2 ~1 day.

## Relations
- relates_to [[Hermes Agent Config]]