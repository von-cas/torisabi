# Hermes integration

Version-controlled copies of the Hermes pieces that drive Torisabi. The live
copies Hermes actually loads are outside this repo:

| Repo copy | Live location |
|---|---|
| `scripts/torisabi_add_product.py` | `~/.hermes/scripts/torisabi_add_product.py` |
| `scripts/torisabi_keepalive.sh` | `~/.hermes/scripts/torisabi_keepalive.sh` |
| `skills/torisabi-products/SKILL.md` | `~/.hermes/skills/productivity/torisabi-products/SKILL.md` |

After editing anything here, copy it back:

```bash
cp hermes/scripts/* ~/.hermes/scripts/ && cp hermes/skills/torisabi-products/SKILL.md ~/.hermes/skills/productivity/torisabi-products/
```

## Photo → draft product

Send a photo to Hermes with a line like "add this to Torisabi, ₱1,850, rattan
bag". The skill calls `torisabi_add_product.py`, which resizes to a 1600px
display copy and a 400px thumbnail in WebP, uploads both to Supabase Storage,
and inserts a product with status `draft` and source `hermes`. Nothing is public
until it is published at `/admin/products`.

The script is all-or-nothing: any failure removes what it already uploaded, so
retrying never leaves a half-built product.

## Keep-alive cron

```
hermes cron list        # job "torisabi-keepalive", daily 09:00
```

Runs `torisabi_keepalive.sh`, which reads one row from Supabase so the free tier
never hits its 7-day inactivity pause. Silent on success; only failures reach
Telegram.

## Why these talk to Supabase directly

The site exposes `POST /api/hermes/products` for the same job, guarded by
`HERMES_API_KEY`. These scripts skip it and use the service key against Supabase
instead, for two reasons: this machine is trusted and already holds the key, so
the HTTP hop adds nothing; and Von's home ISP cannot open port 443 to the
Cloudflare IPs serving torisabi.com, while Supabase is reachable. The HTTP
endpoint remains the right entry point for anything remote — a phone, a VPS, or
a Hermes instance elsewhere.
