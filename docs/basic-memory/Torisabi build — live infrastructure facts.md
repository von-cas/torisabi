---
title: Torisabi build — live infrastructure facts
type: note
permalink: ai-memory/projects/torisabi-build-live-infrastructure-facts
tags:
- torisabi
- netlify
- supabase
- infrastructure
- design
---

# Torisabi build — live infrastructure facts

Updated 2026-08-05. Site is **LIVE at https://www.torisabi.com on Netlify**, redesigned around the real brand. See [[Torisabi project — wife's business website]] for decisions and [[Torisabi Hermes integration]] for the photo flow.

## Live resources
- [fact] **Hosting: Netlify** free tier. Site `torisabi`, id `124d9e4e-c35f-42ea-ad4e-d3f2acadacde`, team Torisabi.
- [fact] **GitHub repo `von-cas/torisabi` is now PUBLIC** (made public 2026-08-05 so Netlify free-tier auto-deploy works — it only auto-builds private repos on paid teams). Push to `main` → Netlify auto-builds and publishes. No secrets in the repo: `.env.local`/`.dev.vars` git-ignored, only `.env.example` tracked (blank values), verified against full history.
- [fact] Manual deploy fallback: `npx netlify deploy --build --prod`.
- [fact] Domain registered at Cloudflare but **DNS only (grey cloud)** — `torisabi.com` + `www` are CNAMEs to `torisabi.netlify.app`. Cloudflare is NOT in the request path. Do NOT enable proxying (would route back through the IPs Von's PLDT line can't reach on 443).
- [fact] Supabase project ref `lwzyyikatufzwuoatpvm`, region `ap-southeast-1` (Singapore). Created with "auto-expose new tables" OFF → every grant must be explicit in a migration.
- [fact] Migrations 0001–0005 applied to production. 0004 = audit_log (trigger writes one row per mutation, update diffs record only changed fields as {from,to}); 0005 = service_role read grant on it.
- [fact] Product code sequence reset to 1 (2026-08-05) after demo/probe seeding — first real product = TS-001.

## Brand + design
- [fact] Business is **Torisabi Ph**, a handmade **crafter** (keychains, beaded charms, resin/clay pieces) in **Zamboanga**. TikTok @torisabiph.co, Instagram **@torisabi.ph**.
- [fact] Ordering channel is Instagram DMs: `https://ig.me/m/torisabi.ph`. Env var `NEXT_PUBLIC_INSTAGRAM_USERNAME=torisabi.ph` (set on Netlify + locally).
- [fact] Logo = hand-drawn multicolour bubble-letter "ToriSabi" wordmark with strawberry/stars, saved from the TikTok avatar to `public/logo.png` (900px, 38KB) + favicons `src/app/icon.png` / `apple-icon.png`.
- [decision] Public site redesigned 2026-08-05: pure white canvas (Von's explicit requirement), everything else a die-cut "sticker" (ink outline + offset colour block), hand-drawn squiggle rules from the logo. Palette sampled from logo: magenta #E8309C signature, aqua #3DD6F5 + lemon #E4E13A fills only (yellow never text), grape #9B4FD8 labels/focus ring, leaf green in-stock dot, berry SOLD stamp. Fonts: Baloo 2 (display) + Rubik (body) + Geist Mono (product code). Design skill installed at `.agents/skills/frontend-design`.

## Netlify traps (durable)
- [issue] New Netlify sites ship with **SSO protection ON** (`sso_login: true`) → 401 on every route. Fix via `netlify api updateSite` `{"body":{"sso_login":false}}`.
- [issue] `netlify env:set --secret` withholds the value from the BUILD — fatal for `NEXT_PUBLIC_*` (Next inlines them at build). Set public vars WITHOUT `--secret`.
- [issue] Free-tier auto-deploy of a PRIVATE repo is blocked ("Unrecognized Git contributor") even after linking GitHub — it's a paid gate. Fix: make the repo public, or CLI deploy.
- [issue] Chrome DevTools debugging (Claude driving the browser) blocks clicks in OAuth popups — use Safari for OAuth approvals.

## Relations
- relates_to [[Torisabi project — wife's business website]]
- relates_to [[Torisabi Hermes integration]]