#!/usr/bin/env python3
"""Turn a photo into a draft Torisabi product.

Usage:
    torisabi_add_product.py PHOTO [PHOTO ...] [--name NAME] [--price 1850]
                            [--category Bags] [--description TEXT]

Creates the product with status `draft` and source `hermes`. Nothing appears on
the website until it is reviewed and published at /admin/products.

Why this talks to Supabase directly rather than POSTing to the site's
/api/hermes/products endpoint: keeping the moving parts to a minimum, and Von's
home ISP cannot open port 443 to the Cloudflare IPs serving torisabi.com while
it reaches Supabase fine. The HTTP endpoint stays available for callers that
are remote or untrusted; this machine is neither and already holds the key.
"""

import argparse
import json
import mimetypes
import os
import re
import sys
import unicodedata
import urllib.error
import urllib.request
import uuid
from io import BytesIO
from pathlib import Path

from PIL import Image, ImageOps

ENV_FILE = Path("/Users/von/torisabi/.env.local")
BUCKET = "product-photos"
DISPLAY_MAX = 1600
THUMB_MAX = 400
WEBP_QUALITY = 82
MAX_PHOTOS = 10


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


def slugify(text: str) -> str:
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode()
    text = re.sub(r"[^a-zA-Z0-9]+", "-", text).strip("-").lower()
    return text or f"item-{uuid.uuid4().hex[:8]}"


def peso_to_centavos(raw: str) -> int:
    cleaned = re.sub(r"[₱,\s]", "", raw)
    if not re.fullmatch(r"\d+(\.\d{1,2})?", cleaned):
        sys.exit(f"Could not read '{raw}' as a peso amount (try 1850 or 1850.50)")
    return round(float(cleaned) * 100)


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
    parser = argparse.ArgumentParser(description="Add a draft Torisabi product from photos.")
    parser.add_argument("photos", nargs="+", type=Path)
    parser.add_argument("--name")
    parser.add_argument("--price", help="Selling price in pesos, e.g. 1850 or 1850.50")
    parser.add_argument("--cost", help="What you paid, in pesos. Stays private.")
    parser.add_argument("--category")
    parser.add_argument("--description")
    args = parser.parse_args()

    photos = args.photos[:MAX_PHOTOS]
    dropped = len(args.photos) - len(photos)
    for photo in photos:
        if not photo.is_file():
            sys.exit(f"No such photo: {photo}")
        guessed, _ = mimetypes.guess_type(photo.name)
        if guessed and not guessed.startswith("image/"):
            sys.exit(f"Not an image: {photo}")

    env = load_env()
    name = args.name or f"Untitled item {uuid.uuid4().hex[:6]}"

    product = {
        "name": name,
        "slug": f"{slugify(name)}-{uuid.uuid4().hex[:6]}",  # suffix avoids collisions
        "price_centavos": peso_to_centavos(args.price) if args.price else 0,
        "status": "draft",
        "source": "hermes",
    }
    if args.cost:
        product["cost_centavos"] = peso_to_centavos(args.cost)
    if args.category:
        product["category"] = args.category
    if args.description:
        product["description"] = args.description

    created = json.loads(request(
        env, "POST", "/rest/v1/products", json.dumps(product).encode(),
        {"Content-Type": "application/json", "Prefer": "return=representation"},
    ))[0]
    product_id = created["id"]

    uploaded: list[str] = []
    try:
        rows = []
        for index, photo in enumerate(photos):
            display_key = f"{product_id}/{index}-display.webp"
            thumb_key = f"{product_id}/{index}-thumb.webp"
            upload(env, display_key, render(photo, DISPLAY_MAX))
            uploaded.append(display_key)
            upload(env, thumb_key, render(photo, THUMB_MAX))
            uploaded.append(thumb_key)
            rows.append({
                "product_id": product_id,
                "display_path": display_key,
                "thumb_path": thumb_key,
                "sort_order": index,
                "alt_text": name,
            })

        request(env, "POST", "/rest/v1/product_photos", json.dumps(rows).encode(),
                {"Content-Type": "application/json", "Prefer": "return=minimal"})
    except SystemExit:
        # All or nothing: never leave a half-built product for someone to find.
        for key_path in uploaded:
            try:
                request(env, "DELETE", f"/storage/v1/object/{BUCKET}/{key_path}", None, {})
            except SystemExit:
                pass
        request(env, "DELETE", f"/rest/v1/products?id=eq.{product_id}", None, {})
        raise

    print(f"Draft created: {created['code']} — {name}")
    print(f"  photos: {len(photos)}" + (f" ({dropped} ignored, max {MAX_PHOTOS})" if dropped else ""))
    if not args.price:
        print("  price: not set yet")
    print("  Review and publish: https://www.torisabi.com/admin/products")


if __name__ == "__main__":
    main()
