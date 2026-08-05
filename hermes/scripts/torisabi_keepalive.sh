#!/usr/bin/env bash
# Torisabi keep-alive — MASTER-PLAN.md task T1.15.
#
# The free Supabase tier pauses a project after 7 days with no database
# activity, which would take torisabi.com offline. This runs a trivial read
# once a day so that never happens.
#
# It talks to Supabase directly rather than curling the website's /api/health,
# for two reasons: keeping the database awake is the actual goal, and Von's home
# ISP cannot reach the Cloudflare IPs serving the site (it reaches Supabase
# fine), so a website ping from this machine would report false failures.
#
# Watchdog convention: silent on success, prints only when something is wrong.
# Run by: hermes cron, job "torisabi-keepalive".

set -uo pipefail

ENV_FILE="/Users/von/torisabi/.env.local"

if [[ ! -r "$ENV_FILE" ]]; then
  echo "Torisabi keep-alive FAILED: cannot read $ENV_FILE"
  exit 0
fi

URL=$(grep '^NEXT_PUBLIC_SUPABASE_URL=' "$ENV_FILE" | cut -d= -f2-)
KEY=$(grep '^NEXT_PUBLIC_SUPABASE_ANON_KEY=' "$ENV_FILE" | cut -d= -f2-)

if [[ -z "$URL" || -z "$KEY" ]]; then
  echo "Torisabi keep-alive FAILED: Supabase URL or key missing from $ENV_FILE"
  exit 0
fi

# Cheapest possible read that still counts as activity: ask for the row count
# via a HEAD-style request, returning no rows.
CODE=$(curl -s -o /dev/null -w '%{http_code}' --max-time 30 \
  -H "apikey: $KEY" \
  -H "Authorization: Bearer $KEY" \
  -H "Prefer: count=exact" \
  -H "Range: 0-0" \
  "$URL/rest/v1/public_products?select=id" 2>/dev/null)

# PostgREST answers 200 or 206 (partial content) for a ranged read.
if [[ "$CODE" == "200" || "$CODE" == "206" ]]; then
  exit 0  # silent: database is awake
fi

echo "Torisabi keep-alive FAILED: Supabase returned HTTP ${CODE:-no response}."
echo "If this repeats, the project may have paused — check"
echo "https://supabase.com/dashboard/project/lwzyyikatufzwuoatpvm"
exit 0
