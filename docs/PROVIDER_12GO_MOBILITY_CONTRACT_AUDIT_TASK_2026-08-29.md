# Provider 12Go Mobility Contract Audit Task — 2026-08-29

Status: AUTHORIZED / AUDIT + CONTRACT PREP ONLY

Cursor-Agent: `Jetnity provider 12go audit 1`
Baseline main: `69ef27b169780e41ba506a69acb15caafa645517`
Branch: `audit/provider-12go-mobility-contract-2026-08-29`

## Goal
Reconstruct the current official 12Go affiliate/API integration contract for multimodal ground transport and define the smallest future Jetnity mobility adapter contract that can plug into the shared provider adapter core after that core is accepted.

## Required evidence
Use current first-party 12Go/12Go Affiliate documentation as primary evidence. Verify at minimum: affiliate enrollment and API-access prerequisites; API availability/approval constraints; supported modes (train, bus, ferry, van, taxi/transfer and other relevant modes); search/timetable/route semantics; operator/service/trip identifiers; origin/destination/location taxonomy; schedule/timezone rules; pricing/currency/fees; availability; deeplink/affiliate/sub-ID tracking; booking redirect vs reseller/booking boundaries; authentication, environments, quotas/rate/error behavior where publicly documented; localization; cancellation/refund/terms boundaries; confidential/unknown API details that cannot be assumed before approval.

## Jetnity architecture output
Define provider-specific mapping boundaries for future `mobility` adapter while preserving provider-neutral Jetnity contracts. Rental cars remain a separate Jetnity Commercial Domain and must not be folded into this adapter. Identify shared-core vs 12Go-specific responsibilities. Define offline fixtures only for facts supportable by public contract evidence; mark inaccessible/confidential API fields as unknown rather than inventing them. Prevent fixture/test/affiliate-link evidence from minting `live_api` or `persisted_snapshot` Commercial Truth. Specify future server-only transport/auth, parser/normalizer, multimodal mapping, deeplink attribution, observability, error mapping and activation gates.

## Hard constraints
- docs/evidence/contracts only; no runtime code
- no signup, API approval request, API key, secret, real network call, paid call or commercial activation
- no Supabase/Vercel/Production mutation
- no Commercial-Provenance write/mint
- no shared-core edits
- no UI
- no rental-car domain merge
- do not mark Ready
- do not merge
- do not start implementation follow-up

## Deliverables
Create provider-specific audit/status, proposed adapter contract/architecture, handoff and self-review docs. Include exact source URLs/titles/dates where available, explicitly distinguish public facts from approval-gated/confidential unknowns, list risks, and propose the precise future implementation task. Re-fetch `origin/main` before handoff and report drift.

## STOP
Stop after evidence + architecture prep for independent ChatGPT Technical-Lead review.