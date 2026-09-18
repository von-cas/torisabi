---
title: Torisabi Hermes integration
type: note
permalink: ai-memory/projects/torisabi-hermes-integration
tags:
- torisabi
- hermes
- cron
- automation
---

# Torisabi Hermes integration

Built 2026-08-05. Lets Von and his wife add shop items by sending a photo to Hermes, and keeps the free Supabase project awake. See [[Torisabi build — live infrastructure facts]] for identifiers.

## What exists
- [fact] Skill `torisabi-products` at `~/.hermes/skills/productivity/torisabi-products/SKILL.md` — registered and enabled. Triggers on a photo plus wording like "add this to Torisabi", "list this", "for the shop".
- [fact] Script `~/.hermes/scripts/torisabi_add_product.py` — resizes to 1600px display + 400px thumb WebP (Pillow, system python3 has 11.3.0), uploads to Supabase Storage, inserts product with `status='draft'`, `source='hermes'`. Flags: `--name --price --cost --category --description`. Prices in plain pesos, converted to integer centavos.
- [fact] Cron `torisabi-keepalive` (id 65b2c377d86c), daily 09:00, `--no-agent --script torisabi_keepalive.sh --deliver telegram`. Silent on success; only failures reach Telegram.
- [fact] Version-controlled copies live in the repo at `torisabi/hermes/` with a README mapping repo path → live path. Edits must be copied back to `~/.hermes/`.

## Design decisions
- [decision] Both scripts talk to **Supabase directly**, not the site's `POST /api/hermes/products`. Reasons: the Mac already holds the service key so the HTTP hop adds nothing, and Von's ISP cannot reach the Cloudflare IPs serving torisabi.com — a website ping from the Mac would report a false failure daily. The HTTP endpoint stays for remote callers (phone, VPS).
- [decision] The uploader is all-or-nothing: a failed photo upload or insert deletes what it already created, so retries never leave a half-built product.
- [decision] The skill forbids inventing a price/cost/description — omit the flag if the message didn't say it. `--cost` is private and feeds profit reporting.

## Gotchas
- [issue] `hermes cron create` needs `--script <name>` relative to `~/.hermes/scripts/`, plus `--no-agent` for the silent watchdog pattern.
- [issue] Hermes skills live in `~/.hermes/skills/<category>/<name>/SKILL.md` (categories: apple, productivity, research, …). There is no `plugins/` dir on this Mac.
- [issue] Verifying MFA: `auth.admin.listUsers()` omits factors and makes it look like MFA is missing. Use `auth.admin.mfa.listFactors({userId})` or `getUserById`.

## Relations
- relates_to [[Torisabi build — live infrastructure facts]]
- relates_to [[Torisabi project — wife's business website]]
- relates_to [[Hermes Agent Config]]