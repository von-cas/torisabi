#!/usr/bin/env python3
"""Log a Torisabi business expense from a receipt photo.

Usage:
    torisabi_add_expense.py --amount 731.01 [RECEIPT]
                            [--category "website and domain"] [--payee Cloudflare]
                            [--description TEXT] [--date 2026-08-05]

The row is created with source `hermes` and `needs_review` set, so it sorts to
the top of /admin/expenses until the owner confirms it — a number read off a
photo is never trusted silently.

Why this talks to Supabase directly rather than POSTing to the site's
/api/hermes/expenses endpoint: the same reason as torisabi_add_product.py —
this machine is trusted and already holds the key, so the HTTP hop adds nothing,
and Von's home ISP cannot always open port 443 to the site. The HTTP endpoint
stays available for callers that are remote or untrusted; this machine is
neither.
"""

import argparse
import json
import mimetypes
import re
import sys
import urllib.error
import urllib.request
import uuid
from datetime import date
from io import BytesIO
from pathlib import Path

from PIL import Image, ImageOps

ENV_FILE = Path("/Users/von/torisabi/.env.local")
# Receipts share the product-photos bucket, namespaced under receipts/<id>/.
# It already exists; a second bucket would cost a migration for no gain.
BUCKET = "product-photos"
RECEIPT_MAX = 1600
WEBP_QUALITY = 85  # a receipt has to stay readable, so a notch above photos
# Mirrors EXPENSE_CATEGORIES in src/lib/types.ts. Anything else becomes "other".
CATEGORIES = (
    "product inventory",
    "packaging",
    "shipping",
    "advertising",
    "website and domain",
    "supplies",
    "transportation",
    "other",
)


def load_env() -> dict:
    if not ENV_FILE.is_file():
        sys.exit(f"Cannot read {ENV_FILE} — is the torisabi project still at that path?")
    env = {}
    for line in ENV_FILE.read_text().splitlines():
        if line and not line.startswith("#") and "=" in line:
            key, _, value = line.partition("=")
            env[key] = value
    for required in ("NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"):
        if not env.get(required):
            sys.exit(f"{required} missing from {ENV_FILE}")
    return env


def peso_to_centavos(raw: str) -> int:
    cleaned = re.sub(r"[₱,\s]", "", raw)
    if not re.fullmatch(r"\d+(\.\d{1,2})?", cleaned):
        sys.exit(f"Could not read '{raw}' as a peso amount (try 731.01 or 1850)")
    centavos = round(float(cleaned) * 100)
    if centavos <= 0:
        sys.exit("The amount has to be more than ₱0.00")
    return centavos


def render(path: Path, longest_edge: int) -> bytes:
    """Downscale to fit longest_edge and encode as WebP. Never upscales."""
    with Image.open(path) as img:
        img = ImageOps.exif_transpose(img)  # honour phone orientation
        img = img.convert("RGB")
        img.thumbnail((longest_edge, longest_edge), Image.LANCZOS)
        buf = BytesIO()
        img.save(buf, format="WEBP", quality=WEBP_QUALITY, method=6)
        return buf.getvalue()


def request(env: dict, method: str, path: str, body: bytes, headers: dict) -> bytes:
    url = f"{env['NEXT_PUBLIC_SUPABASE_URL']}{path}"
    key = env["SUPABASE_SERVICE_ROLE_KEY"]
    base = {"apikey": key, "Authorization": f"Bearer {key}"}
    req = urllib.request.Request(url, data=body, method=method, headers={**base, **headers})
    try:
        with urllib.request.urlopen(req, timeout=60) as response:
            return response.read()
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode(errors="replace")[:400]
        raise SystemExit(f"Supabase {method} {path} failed ({exc.code}): {detail}") from exc


def upload(env: dict, key_path: str, data: bytes) -> None:
    request(env, "POST", f"/storage/v1/object/{BUCKET}/{key_path}", data,
            {"Content-Type": "image/webp", "x-upsert": "true"})


def main() -> None:
    parser = argparse.ArgumentParser(description="Log a Torisabi expense from a receipt.")
    parser.add_argument("receipt", nargs="?", type=Path, help="Receipt photo. Optional.")
    parser.add_argument("--amount", required=True, help="Total in pesos, e.g. 731.01")
    parser.add_argument("--category", help=f"One of: {', '.join(CATEGORIES)}")
    parser.add_argument("--payee", help="Who was paid, e.g. Cloudflare")
    parser.add_argument("--description")
    parser.add_argument("--date", help="YYYY-MM-DD. Defaults to today.")
    args = parser.parse_args()

    if args.receipt is not None:
        if not args.receipt.is_file():
            sys.exit(f"No such receipt: {args.receipt}")
        guessed, _ = mimetypes.guess_type(args.receipt.name)
        if guessed and not guessed.startswith("image/"):
            sys.exit(f"Not an image: {args.receipt}")

    amount_centavos = peso_to_centavos(args.amount)

    # Unrecognised categories are expected — Hermes guesses from what the receipt
    # says — so they land in "other" for the owner to correct during review.
    category = (args.category or "other").strip().lower()
    guessed_category = category not in CATEGORIES
    if guessed_category:
        category = "other"

    if args.date:
        try:
            expense_date = date.fromisoformat(args.date).isoformat()
        except ValueError:
            sys.exit(f"Could not read '{args.date}' as a date (use YYYY-MM-DD)")
    else:
        expense_date = date.today().isoformat()

    env = load_env()
    # Generated here so the storage path and the expense row share an id without
    # a round trip; the receipt can then be uploaded before the row exists.
    expense_id = str(uuid.uuid4())

    receipt_key = None
    if args.receipt is not None:
        receipt_key = f"receipts/{expense_id}/receipt.webp"
        upload(env, receipt_key, render(args.receipt, RECEIPT_MAX))

    expense = {
        "id": expense_id,
        "expense_date": expense_date,
        "category": category,
        "amount_centavos": amount_centavos,
        "receipt_reference": receipt_key,
        "source": "hermes",
        # Sorts to the top of /admin/expenses until the owner confirms it.
        "needs_review": True,
    }
    if args.payee:
        expense["payee"] = args.payee
    if args.description:
        expense["description"] = args.description

    try:
        created = json.loads(request(
            env, "POST", "/rest/v1/expenses", json.dumps(expense).encode(),
            {"Content-Type": "application/json", "Prefer": "return=representation"},
        ))[0]
    except SystemExit:
        # All or nothing: never leave a receipt image nothing points at.
        if receipt_key:
            try:
                request(env, "DELETE", f"/storage/v1/object/{BUCKET}/{receipt_key}", None, {})
            except SystemExit:
                pass
        raise

    print(f"Expense logged: ₱{created['amount_centavos'] / 100:,.2f} · {category} · {expense_date}")
    if args.payee:
        print(f"  payee: {args.payee}")
    print(f"  receipt: {'stored' if receipt_key else 'none attached'}")
    if guessed_category:
        print(f"  category '{args.category}' is not one of ours — filed under other")
    print("  Flagged for review: https://www.torisabi.com/admin/expenses")


if __name__ == "__main__":
    main()
