# Decisions retained from the note review

Reviewed 2026-09-20 against local source. No live service or scheduler was changed or re-certified by this review.

## Current source takes precedence over the August plan

`package.json` uses the Netlify deploy command and adapter. Cloudflare is the historical host and current DNS provider described in the completed migration record, not the current application adapter. Do not restore the old Worker or enable proxying from a generic dashboard suggestion.

`src/lib/social.ts` is the canonical social registry. `OrderButtons` opens Messenger and copies the order note; Instagram is a follow link. This supersedes the early Instagram-ordering sections of MASTER-PLAN. A clipboard failure must not block opening the chat.

The earlier home-network reachability evidence justified changing hosts, but it did not prove the exact middlebox/blocklist mechanism or the experience of all PLDT customers. Old free-tier/commercial terms require fresh provider verification before reuse.

## Intake and cache behavior

Photo intake creates a draft for review, not a published product. Store money as integer centavos; do not invent missing price/cost. Roll back partial upload work on failure. Product/photo edits need the current catalogue invalidation path, and image preview/zoom must preserve the uploaded image. A `revalidateTag(..., "max")` call is not by itself proof that every visitor sees the new value immediately; verify the resulting public page.

Historical Hermes host paths and cron installation receipts do not define today's job owner. The shared host-placement record owns current scheduling.

Source notes: 502, 503, 504, 506. The original plan and all note receipts remain preserved.
