# Provider Viator Activities Contract Audit Task — 2026-08-29

Status: AUTHORIZED / AUDIT + CONTRACT PREP ONLY

Cursor-Agent: `Jetnity provider viator audit 1`
Baseline main: `69ef27b169780e41ba506a69acb15caafa645517`
Branch: `audit/provider-viator-activities-contract-2026-08-29`

## Goal
Reconstruct the current official Viator Partner API contract for affiliate-style tours/activities distribution and define the smallest future Jetnity activities adapter contract that can plug into the shared provider adapter core after that core is accepted.

## Required evidence
Use current first-party Viator Partner API documentation as primary evidence. Verify at minimum: affiliate vs merchant capability boundaries; API access/onboarding requirements; authentication; environments/test facilities if any; product/content search/discovery; availability/pricing/traveller combinations; product/options identifiers; currencies; cancellation/terms; photos/reviews/content; affiliate URL/deeplink generation/tracking; rate/error behavior where officially documented; localization; freshness/update semantics; booking endpoints that are explicitly unavailable/non-required for affiliates; commercial/attribution obligations.

## Jetnity architecture output
Define provider-specific mapping boundaries for future `activities` adapter while preserving provider-neutral Jetnity contracts. Identify shared-core vs Viator-specific responsibilities. Define realistic offline fixtures and fail-closed validation. Explicitly separate content/affiliate evidence from live commercial price/availability truth and prevent fixture/test evidence from minting `live_api` or `persisted_snapshot`. Specify future server-only transport/auth, parser/normalizer, redirect/deeplink attribution, observability, error mapping and activation gates.

## Hard constraints
- docs/evidence/contracts only; no runtime code
- no signup, API key, secret, real network call, paid call or commercial activation
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