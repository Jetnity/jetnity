# World Map 1 – Adversarial Self-Review

Stand: 2. September 2026
Branch: `feat/phase-1-world-map-1-planned-truth`
Issue: #419
Draft PR: #422
Runtime head reviewed by the agent: `e7514acf95a4160858325d40adad6f604c5bc561`
Agent self-review is **not** Technical-Lead PASS.

## Scope fidelity

In scope:

- existing `reisenLaden()` / `TripSummary` path
- stored stage `country_code`, `place_id`, `latitude`, `longitude`
- one deterministic World Map derivation
- bounded Account Home `Deine Welt`
- local map rendering
- focused deterministic tests

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
4. Preview HTML is Vercel-SSO protected (`302` to `vercel.com/sso-api`). Exact-head Preview must be read authenticated. Local production-build `/ui-audit/account` evidence was captured for mobile 390 and desktop 1280.

## Recommendation

Technical Lead should exact-head review Draft PR #422.  
**Do not Ready. Do not merge from this agent.**
