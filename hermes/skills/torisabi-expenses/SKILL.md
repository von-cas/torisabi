---
name: torisabi-expenses
description: "Log a Torisabi shop expense from a receipt photo. Use whenever Von or his wife sends a receipt, invoice or payment screenshot for something the shop paid for — stock, packaging, shipping, ads, domain — and wants it recorded."
version: 1.0.0
author: Von
license: MIT
platforms: [macos]
metadata:
  hermes:
    tags: [Torisabi, shop, expenses, receipts, bookkeeping]
---

# Torisabi expenses

Turns a receipt photo into an expense row in the Torisabi books
(torisabi.com/admin/expenses). Every row is flagged **needs review** and sorts
to the top of the list until the owner confirms it, so a number read off a photo
is never trusted silently. Expenses feed the profit report — sales minus
expenses for any date range.

## When to use

- A receipt, invoice or payment screenshot arrives for something **the shop**
  bought: stock, packaging, courier fees, ads, the domain, supplies, fare
- "Log this for Torisabi", "shop expense", "add to the shop books"

## When NOT to use

- **A personal receipt** — groceries, bills, Von's own spending. That is the
  `expense-tracker` skill and a different spreadsheet entirely. If it is not
  clear whose expense it is, ask before logging.
- **A photo of an item to sell** — that is `torisabi-products`, which creates a
  draft product. A receipt for stock the shop *bought* can be both: log the
  expense here, and add the item separately if they ask for it.

## How to run it

```bash
python3 ~/.hermes/scripts/torisabi_add_expense.py RECEIPT \
  --amount 731.01 \
  --category "website and domain" \
  --payee "Cloudflare" \
  --description "torisabi.com domain registration, 1 year" \
  --date 2026-08-05
```

Incoming images are saved under `~/.hermes/image_cache/` — pass that path. The
receipt itself is optional (`--amount` alone works, for a spoken "I paid ₱250
for the courier"), but attach it whenever there is one: it is stored alongside
the row as proof.

`--amount` is the only required flag. Everything else is optional; pass what the
receipt or the message actually says.

## Rules

- **Never invent an amount.** Read the total off the receipt. If the photo is
  too blurry to read it with confidence, say so and ask — do not guess, and do
  not log a placeholder.
- Amounts are plain pesos: `731.01` or `1850`. No currency symbol needed. Stored
  to the centavo.
- Categories are fixed: `product inventory`, `packaging`, `shipping`,
  `advertising`, `website and domain`, `supplies`, `transportation`, `other`.
  Anything else silently becomes `other` — the script says so when it does.
- `--date` is the date **on the receipt**, `YYYY-MM-DD`. Left off, it uses today.
  A receipt photographed days later still belongs on its own date.
- One receipt, one run. A receipt covering several purchases is still one
  expense unless they ask to split it.

## After it runs

Report the amount, category and date it printed, and remind them it is waiting
for a quick confirm at `https://www.torisabi.com/admin/expenses`.

If they mention Von's home connection cannot open torisabi.com, that is a known
ISP routing problem, not a site fault — suggest mobile data or Cloudflare WARP.
The logging itself talks to Supabase directly and is unaffected.

## If it fails

The script is all-or-nothing: if the row cannot be written, the receipt image it
already uploaded is removed, so a retry never leaves an orphan behind.

- `Could not read '…' as a peso amount` — the amount was not a plain number.
- `Cannot read /Users/von/torisabi/.env.local` — the project moved, or the
  credentials file is gone.
- `Supabase POST … failed (401/403)` — the service key was rotated. Fresh key
  at https://supabase.com/dashboard/project/lwzyyikatufzwuoatpvm/settings/api-keys
