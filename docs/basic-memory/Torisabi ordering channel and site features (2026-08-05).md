---
title: Torisabi ordering channel and site features (2026-08-05)
type: note
permalink: ai-memory/projects/torisabi-ordering-channel-and-site-features-2026-08-05
tags:
- torisabi
- facebook
- messenger
- features
---

# Torisabi ordering channel and site features (2026-08-05)

Durable changes to the live Torisabi site. See [[Torisabi build — live infrastructure facts]].

## Ordering channel switched: Instagram → Facebook Messenger
- [decision] Ordering is now **Facebook Messenger**, not Instagram. Single "Message to order" button opens the Torisabi Ph chat via `https://m.me/61563228086384` (verified to resolve to the real thread). The old copy-order-message button and the displayed order text were removed everywhere.
- [fact] Facebook profile: `https://www.facebook.com/people/Torisabi-Ph/61563228086384/`. Env: `NEXT_PUBLIC_FACEBOOK_ID=61563228086384` (code has this as a hardcoded fallback too). The old `NEXT_PUBLIC_INSTAGRAM_USERNAME` is unused now (still set on Netlify, harmless).
- [fact] Component: `src/components/site/messenger.tsx` (`MESSENGER_URL`, `FACEBOOK_PROFILE_URL`, `FACEBOOK_LABEL`, `MessengerIcon`). Replaced the deleted `instagram.tsx`. Organization JSON-LD `sameAs` points at the Facebook profile.
- [issue] **Neither Messenger nor Instagram lets a link pre-type the composer.** The button opens the chat; the product name + code shown on the page are what the customer references. True "prefilled message" is impossible via URL — same limitation that made the original design use copy+open.

## Photos are unlimited
- [fact] The admin uploader (create form + edit page) has NO photo-count cap — both loop over every selected file; the public carousel shows them all. To pick several: select multiple in the file picker at once (Cmd/Shift-click on desktop, tap several in the iOS photo picker). After saving, the Edit page lets you keep adding, and reorder with up/down arrows.
- [fact] The Hermes photo endpoint cap was raised 10→40 (a safety ceiling, not a product limit). Proven: 15 photos on one product stored/read back fine.

## Favicon + zoom
- [fact] Favicon replaced the illegible full-wordmark tile with a magenta rounded tile + white "T" (`src/app/icon.png` 512, `apple-icon.png` 180), applied site-wide by Next.
- [fact] Product main image is zoomable: desktop hover-magnify (keeps next/image for LCP) + tap-to-open full-screen viewer with pinch/pan/double-tap-reset/scroll/Escape. Component `src/components/site/zoomable-image.tsx`, no library.

## Live business data
- [fact] First real product is live: **TS-001 "Jujutsu Kaisen"** (manual, available), added through the admin by Von/wife. Do not delete. Product code sequence continues from there.

## Relations
- relates_to [[Torisabi build — live infrastructure facts]]
- relates_to [[Torisabi project — wife's business website]]


## Social links added to footer (2026-08-06)

- [decision] Footer has a "Follow along" icon row with Facebook, Instagram, and TikTok. Icons are circular bordered buttons, open in a new tab.
- [fact] Instagram handle: `torisabi.ph` → https://www.instagram.com/torisabi.ph
- [fact] TikTok handle: `torisabiph.co` → https://www.tiktok.com/@torisabiph.co (note: NOT the same slug as Instagram)
- [fact] All Torisabi profile URLs now live in one file: `src/lib/social.ts` (single source; env-overridable via NEXT_PUBLIC_INSTAGRAM_HANDLE / NEXT_PUBLIC_TIKTOK_HANDLE / NEXT_PUBLIC_FACEBOOK_ID). `messenger.tsx` re-exports the Messenger/Facebook constants from it.
- [fact] Icon components (FacebookIcon, InstagramIcon, TikTokIcon) + SOCIAL_LINKS array live in `src/components/site/social.tsx`.
- [decision] Organization JSON-LD `sameAs` (in `src/lib/seo.ts`) now lists Facebook + Instagram + TikTok so search engines link the site to all three accounts.
- [completed-action] Committed (057fbe8) and pushed to main; Netlify auto-deployed; verified live in footer HTML at https://www.torisabi.com.


## Public-page caching (ISR + on-demand purge) — 2026-08-06

Motivation: Netlify credit-based billing. Deploys cost 15 credits each (the real driver); compute is per-visit dynamic render. Added caching to cut compute as traffic grows. (Deploy count is the bigger lever — Von batches deploys manually.)

- [decision] Home (`/`) and product pages (`/products/[slug]`) are now **ISR (revalidate=3600)**, served from cache, not re-rendered per visitor. `/products` search stays dynamic (query-dependent).
- [fact] Public reads use a **cookie-free** Supabase client `src/lib/supabase/public.ts` (`createPublicClient`) — the old `createClient` used `cookies()`, which forced every public page dynamic. Cookie-free = pages can be cached.
- [fact] Reads wrapped in `unstable_cache` tagged `CATALOGUE_TAG = "catalogue"` in `src/lib/queries.ts` (1h backstop TTL).
- [fact] `/products/[slug]` needed `generateStaticParams` to actually cache — `export const revalidate` ALONE is ignored on a dynamic-param route (verified: without it the slug page returned `Cache-Control: private, no-store`).
- [decision] Instant freshness via on-demand purge: admin writes (client-side Supabase) call `revalidatePublicSite()` (`src/lib/revalidate-public.ts`) → `POST /api/revalidate` → `revalidateTag("catalogue", "max")`. Wired in product-form (save/create/archive/delete), product-table (status/mark-sold), product-photos (add/reorder/remove).
- [fact] Next 16 `revalidateTag` signature is `(tag, profile)` — 2 args required; `"max"` = invalidate immediately.
- [fact] `/api/revalidate` is admin-only: checks `supabase.auth.getUser()`, 401 if no session. Auth cookie is SameSite=Lax so cross-site can't trigger it. Verified 401 unauth locally.
- [fact] Middleware only writes `no-store` cookies when a real session refreshes, so anonymous visitors get cacheable responses.
- [decision] MASTER-PLAN §10 and AGENTS.md updated: any new public read must be tagged `CATALOGUE_TAG`; any new product mutation must call `revalidatePublicSite()`/`revalidateTag`, or the site goes stale.
- [fact] Verified locally (`next build` + `next start`): home + slug `x-nextjs-cache: HIT`, `s-maxage=3600`; search 200; unknown slug 404.
- [status] As of 2026-08-06 NOT yet committed/pushed — Von batches deploys manually to save Netlify credits. All testing was local.
