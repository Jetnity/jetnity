# World Map 1 – Adversarial Self-Review

Stand: 2. September 2026
Branch: `feat/phase-1-world-map-1-planned-truth`
Issue: #419
Draft PR: #422
Rejected exact head: `bf2936c9fb41a6e65ed4d29f573c2820c0a7e3dc`
Runtime review-fix head reviewed by the agent: `81ee553ea5853ab41e016c2953cf0e178a8bcf76`
Agent self-review is **not** Technical-Lead PASS.

This is the same logical agent/session after Technical-Lead review `5092964996` (CHANGES REQUIRED). Only those three findings were fixed.

## Scope fidelity

In scope:

- existing `reisenLaden()` / `TripSummary` path
- stored stage `country_code`, `place_id`, `latitude`, `longitude`
- one deterministic World Map derivation
- bounded Account Home `Deine Welt`
- local map rendering
- focused deterministic tests
- the three review-fix items only

Out of scope and not introduced:

- DB/Supabase/RLS/Auth mutation
- visited/travel-history persistence
- geocoding or free-text country/place inference
- external map API/tile/token/runtime geography fetch
- provider/secret/paid/live call or Production S6
- TW-8/TW-9
- service worker / offline / push
- indexing / domain cutover
- follow-up slice

## Review-fix attacks

| Attack | Result |
| --- | --- |
| Silent `herkuenfte[0]` navigation default for an aggregated place | Rejected. Navigation uses `ort.reisen`, unique by `tripId`. |
| Dedupe two same-title trips as one action | Rejected. Same title still yields two links with different hrefs. |
| Treat required map fields as a breaking `TripSummaryStage` change | Rejected. Fields are optional; legacy `{ name, position }` fail-closed. |
| Replace `ACTIVE_WORK_STATUS.md` with a World-Map-only document | Rejected. Canonical `origin/main` content restored; World Map 1 is additive. |
| Weaken Product-Owner gates A–E | Rejected. All remain UNAPPROVED. |

## Truth attacks

| Attack | Result |
| --- | --- |
| Infer visited from past dates | Rejected. `besuchtLage` stays `nicht_erfasst`. |
| Infer visited from `archived` / `booked` / `planned` / `draft` | Rejected. |
| Show `0 besucht` as known empty history | Rejected. Copy says history is not yet captured. |
| Infer country from stage name or coordinates | Rejected. |
| Infer coordinates from name/country/placeId | Rejected. Invalid/missing coords stay unplotted. |
| Merge two Paris stages without the same `placeId` | Rejected. |
| Drop unplotted destinations | Rejected. They remain in the accessible list. |
| Treat account load error as empty world | Rejected. `lage: 'fehler'`. |
| Auto-mount Flight/Hotel/Activities search | Rejected. |
| Fetch Mapbox/OSM/Google tiles or a geocoder | Rejected. Local silhouette only. |
| Add a second account-trip query or service-role read | Rejected. |

## Residual observations, not blockers

1. Stages without stored coordinates produce an honest list-only world. That can look sparse, but inventing points would violate the truth contract.
2. Overlapping markers are possible. The list remains the accessible source of information.
3. A later visited-history slice needs its own persistence contract. This slice must not be extended into that work during review.
4. Preview HTML is expected to remain Vercel-SSO protected. Exact-head Preview must be read authenticated. Local production-build `/ui-audit/account` evidence was recaptured for `reise`/`leer`/`fehler` after the review-fix.
5. The full `npm run audit:account` harness aborted because its spawned `next dev` collided with the workspace Next lock. The focused production-build Playwright check is the local UI evidence for this head.

## Recommendation

Technical Lead should exact-head review Draft PR #422 on the new head after this review-fix.
**Do not Ready. Do not merge from this agent.**
