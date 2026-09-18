---
title: Torisabi stays on Netlify — Vercel migration rejected 2026-08-07
type: decision
permalink: ai-memory/projects/torisabi-stays-on-netlify-vercel-migration-rejected-2026-08-07
tags:
- torisabi
- vercel
- netlify
- hosting
- decision
---

# Torisabi stays on Netlify — Vercel migration rejected 2026-08-07

Von asked whether torisabi.com could move from Netlify to Vercel, motivated by disliking Netlify's credit system burning on every push+deploy. Investigated and **decided against it**. See [[Torisabi build — live infrastructure facts]].

## Decision

- [decision] **torisabi.com stays on Netlify.** No migration. Repo unchanged — `netlify.toml`, `@netlify/plugin-nextjs`, `netlify-cli` and the `deploy` script all stay as they are.
- [decision] Do not re-open this without new information. The two blocking reasons below are structural, not preferences.

## Why — reason 1: Vercel Hobby is already over its CPU cap

- [fact] Von's Vercel scope `vons-projects-2709a3c2` ("Von's projects") is on **plan: hobby** (verified via `GET https://api.vercel.com/v2/teams/...`).
- [fact] As of 2026-08-07 that account was **over the Fluid Active CPU limit: 4h 30m used / 4h included.** Everything else was well under (Fast Origin Transfer 932MB/10GB, Function Invocations 82K/1M, Edge Requests 71K/1M). CPU is the only binding constraint.
- [fact] Hobby has **no overage billing** — Vercel docs: "if you exceed your usage limits on the Hobby plan, you will have to wait until 30 days have passed before you can use the feature again." It stops, it does not bill.
- [issue] Torisabi's `src/middleware.ts` matches nearly every path and calls `updateSession()` → a Supabase auth round-trip per request. That is the most Active-CPU-hungry shape possible to add. Importing it would have risked a 30-day function pause taking down **usefixlink.com and livedesk.help** too.

## Why — reason 2: Hobby forbids commercial use, unambiguously

- [fact] Vercel's fair-use page lists **"Advertising the sale of a product or service"** verbatim as commercial usage. Torisabi is a product catalogue. Not a grey area, even though ordering happens off-site via Facebook Messenger and the site takes no payments.
- [fact] Hobby is "restricted to non-commercial personal use only"; commercial usage requires Pro ($20/mo) or Enterprise.

## Things confirmed along the way (still true, reusable)

- [fact] **Vercel's edge is reachable from Von's PLDT home line** — `curl https://vercel.com` gave `connect=0.09s`, HTTP 200. The port-443 blackhole that forced the move off Cloudflare (MASTER-PLAN §12) does **not** affect Vercel. So reachability is not a reason to avoid Vercel if the plan situation changes.
- [fact] Nothing in torisabi's `src/` is Netlify-specific. The only coupling is `netlify.toml`, two devDependencies, and the `deploy` script. A future migration is ~30 min of work plus DNS.
- [fact] Torisabi's DNS is at Cloudflare Registrar, **unproxied (grey cloud)**, pointing at Netlify. Proxying must stay off — see MASTER-PLAN §10.

## Open follow-up (not yet investigated)

- [issue] **4h 30m of Active CPU for just FixLink + LiveDesk is high** for two low-traffic projects. Worth profiling — likely a hot function, a middleware matcher that is too broad, or a polling loop. This threatens both products with a 30-day pause independent of anything torisabi-related.

## Relations
- relates_to [[Torisabi build — live infrastructure facts]]
- relates_to [[Torisabi ordering channel and site features (2026-08-05)]]
- relates_to [[FixLink Vercel deployment live with DNS pending - 2026-06-29]]
