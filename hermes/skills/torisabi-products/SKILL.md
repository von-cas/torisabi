---
name: torisabi-products
description: "Add a product to the Torisabi shop from a photo. Use whenever Von or his wife sends a photo of an item to sell, or asks to add/list an item for Torisabi."
version: 1.0.0
author: Von
license: MIT
platforms: [macos]
metadata:
  hermes:
    tags: [Torisabi, shop, products, photos, ecommerce]
---

# Torisabi products

Turns a photo of an item into a **draft** product in the Torisabi shop
(torisabi.com). Drafts are invisible on the public site until reviewed and
published at `/admin/products` — so it is always safe to run; nothing goes live
by accident.

## When to use

Trigger on any of these:

- A photo arrives with wording like "add this to Torisabi", "list this", "new
  item", "for the shop", or a price alongside a product photo
- "Add to the shop" / "put this on the website"
- Several photos of the same item sent together

If a photo arrives with no context at all, ask whether it is a Torisabi item
before uploading. Don't guess.

## How to run it

```bash
python3 ~/.hermes/scripts/torisabi_add_product.py PHOTO [PHOTO ...] \
  --name "Woven Rattan Bag" \
  --price 1850 \
  --cost 1100 \
  --category "Bags" \
  --description "Hand-woven rattan with a cotton lining."
```

Incoming images are saved under `~/.hermes/image_cache/` — pass those paths.
Multiple photos of the **same** item go in one command (max 10); the first
becomes the main photo. Separate items need separate runs.

Every flag except the photo is optional. Pass whatever the message actually
said and leave the rest for the review step — a draft with just a photo is
useful; a draft with an invented price is not.

## Rules

- **Never invent a price, cost, or description.** If the message didn't say it,
  omit the flag. `--price` left off stores ₱0.00 and the review screen shows
  "price: not set yet".
- `--cost` is what *they paid*. It is private, never shown on the website, and
  feeds the profit report. Only pass it if the message states it.
- Prices are plain pesos: `1850` or `1850.50`. No currency symbol needed.
- The script resizes to a 1600px display copy and a 400px thumbnail in WebP,
  so send the original photo — don't pre-shrink it.
- Product codes (TS-001, TS-002 …) are assigned by the database. Never invent one.

## After it runs

Report back the product code it printed and remind them to review and publish:
`https://www.torisabi.com/admin/products`

If the reply mentions Von's home connection can't open torisabi.com, that's a
known ISP routing problem, not a site fault — suggest mobile data or Cloudflare
WARP. The upload itself talks to Supabase directly and is unaffected.

## If it fails

The script is all-or-nothing: a failed upload removes anything it already
created, so a retry is always safe and never leaves a half-built product.

- `Cannot read /Users/von/torisabi/.env.local` — the project moved, or the
  credentials file is gone.
- `Supabase POST … failed (401/403)` — the service key was rotated. Fresh key
  at https://supabase.com/dashboard/project/lwzyyikatufzwuoatpvm/settings/api-keys
- `Could not read '…' as a peso amount` — the price wasn't a plain number.
