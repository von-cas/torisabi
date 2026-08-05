# Hermes integration

Version-controlled copies of the Hermes pieces that drive Torisabi. The live
copies Hermes actually loads are outside this repo:

| Repo copy | Live location |
|---|---|
| `scripts/torisabi_add_product.py` | `~/.hermes/scripts/torisabi_add_product.py` |
| `scripts/torisabi_add_expense.py` | `~/.hermes/scripts/torisabi_add_expense.py` |
| `scripts/torisabi_keepalive.sh` | `~/.hermes/scripts/torisabi_keepalive.sh` |
| `skills/torisabi-products/SKILL.md` | `~/.hermes/skills/productivity/torisabi-products/SKILL.md` |
| `skills/torisabi-expenses/SKILL.md` | `~/.hermes/skills/productivity/torisabi-expenses/SKILL.md` |

After editing anything here, copy it back:

```bash
cp hermes/scripts/* ~/.hermes/scripts/
for skill in torisabi-products torisabi-expenses; do
  mkdir -p ~/.hermes/skills/productivity/$skill
  cp hermes/skills/$skill/SKILL.md ~/.hermes/skills/productivity/$skill/
done
```

## Photo → draft product

Send a photo to Hermes with a line like "add this to Torisabi, ₱1,850, rattan
bag". The skill calls `torisabi_add_product.py`, which resizes to a 1600px
display copy and a 400px thumbnail in WebP, uploads both to Supabase Storage,
and inserts a product with status `draft` and source `hermes`. Nothing is public
until it is published at `/admin/products`.

The script is all-or-nothing: any failure removes what it already uploaded, so
retrying never leaves a half-built product.

## Receipt → expense

Send a receipt photo with a line like "log this for Torisabi, ₱731.01, domain".
The `torisabi-expenses` skill calls `torisabi_add_expense.py`, which resizes the
receipt to a 1600px WebP, stores it under `receipts/<expense-id>/` in the
product-photos bucket, and inserts an expense with source `hermes` and
`needs_review` set. Flagged rows sort to the top of `/admin/expenses` until the
owner confirms them, so nothing a machine read off a photo is trusted silently.

The receipt is optional — `--amount` alone logs the expense. Categories are the
fixed list from `src/lib/types.ts`; anything unrecognised is filed under `other`
for the owner to correct during review. Same all-or-nothing rule: if the row
cannot be written, the uploaded image is removed.

Two skills, two jobs: a photo of an item to **sell** is `torisabi-products`; a
receipt for something the shop **bought** is `torisabi-expenses`. A personal
receipt belongs to neither — that is the separate `expense-tracker` skill.

## Keep-alive cron

```
hermes cron list        # job "torisabi-keepalive", daily 09:00
```

Runs `torisabi_keepalive.sh`, which reads one row from Supabase so the free tier
never hits its 7-day inactivity pause. Silent on success; only failures reach
Telegram.

## Why these talk to Supabase directly

The site exposes `POST /api/hermes/products` and `POST /api/hermes/expenses` for
the same jobs, guarded by `HERMES_API_KEY`. These scripts skip them and use the
service key against Supabase
instead, for two reasons: this machine is trusted and already holds the key, so
the HTTP hop adds nothing; and Von's home ISP cannot open port 443 to the
Cloudflare IPs serving torisabi.com, while Supabase is reachable. The HTTP
endpoint remains the right entry point for anything remote — a phone, a VPS, or
a Hermes instance elsewhere.
