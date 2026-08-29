# Provider HBX Hotels Contract Audit Task — 2026-08-29

Status: AUTHORIZED / AUDIT + CONTRACT PREP ONLY

Cursor-Agent: `Jetnity provider hbx audit 1`
Baseline main: `69ef27b169780e41ba506a69acb15caafa645517`
Branch: `audit/provider-hbx-hotels-contract-2026-08-29`

## Goal
Reconstruct the current official HBX/Hotelbeds Hotels API contract and define the smallest future Jetnity accommodations adapter contract that can plug into the shared provider adapter core after that core is accepted.

## Required evidence
Use current first-party HBX documentation as primary evidence. Verify at minimum: evaluation/test access; Api-key + X-Signature auth; environment separation; Hotel Booking API availability/search flow; Content API separation; CheckRates/booking semantics only to understand boundaries; quotas/rate/error behavior where officially documented; currency/price/taxes/fees/cancellation/availability semantics; hotel/property/room/rate identifiers; timestamps/freshness; localization; content/images; attribution/commercial model; certification/go-live requirements.

## Jetnity architecture output
Define provider-specific mapping boundaries for future `accommodations` adapter while preserving provider-neutral Jetnity contracts. Identify what belongs in shared core vs HBX adapter. Define fixture shapes and fail-closed validation. Specify how test/evaluation evidence is prevented from minting `live_api` or `persisted_snapshot` Commercial Truth. Document expected future server-only credential/signature factory, transport calls, parser/normalizer, deeplink/redirect or booking-model implications, observability fields, error mapping, and activation gates.

## Hard constraints
- docs/evidence/contracts only; no runtime code
- no signup, API key, secret, real network call, paid call, commercial agreement or certification action
- no Supabase/Vercel/Production mutation
- no Commercial-Provenance write/mint
- no shared-core edits
- no UI
- do not mark Ready
- do not merge
- do not start implementation follow-up

## Deliverables
Create provider-specific audit/status, proposed adapter contract/architecture, handoff and self-review docs. Include exact source URLs/titles/dates where available, open unknowns, risks and a precise future implementation task proposal. Re-fetch `origin/main` before handoff and report drift.

## STOP
Stop after evidence + architecture prep for independent ChatGPT Technical-Lead review.