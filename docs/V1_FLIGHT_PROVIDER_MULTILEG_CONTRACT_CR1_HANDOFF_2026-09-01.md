# V1 Flight Provider Multi-Leg Contract – CR-1 Exact-Head Handoff

Stand: 1. September 2026  
Status: **STOP FOR FRESH INDEPENDENT TECHNICAL-LEAD REVIEW**  
Logical agent: **`Jetnity V1 flight provider multileg contract 1`**  
Generation: **1**  
Session: `bc-b592d931-3ecb-4cec-b250-ab19a19930b1`  
Draft-PR: https://github.com/Jetnity/jetnity/pull/403  
Issue: https://github.com/Jetnity/jetnity/issues/402  
Binding: `docs/V1_FLIGHT_PROVIDER_MULTILEG_CONTRACT_RECONCILIATION_TASK_2026-09-01.md`  
Binding review: **CHANGES REQUIRED `5078055105`**

Cursor does **not** mark Ready, merge, or start a follow-up slice.  
The previous handoff for `3d544fa6` is superseded and must not be reused as gate evidence.

> Ein Git-Commit kann seinen eigenen SHA nicht im Tree tragen. The exact final SHA is recorded after this file is committed and is the live PR tip.

---

## Zuerst lesen

1. Technical-Lead CHANGES REQUIRED `5078055105` on rejected head `3d544fa653c0f31f3447f1f24208492732f0286a`
2. `docs/V1_FLIGHT_PROVIDER_MULTILEG_CONTRACT_RECONCILIATION_TASK_2026-09-01.md`
3. `docs/V1_FLIGHT_PROVIDER_MULTILEG_CONTRACT_SELF_REVIEW_2026-09-01.md`
4. `lib/providers/flights/domain.ts`
5. `lib/providers/flights/map-search-request.ts`
6. `lib/providers/flights/map-search-request.test.ts`
7. ADR-0207 in `DECISIONS.md`

## What a new chat must know

Same logical agent, Generation 1, same session. Do not start a new agent.

Rejected defect: `3d544fa6` dropped `stopPreference` from `FlightProviderSearchRequest` and tested that absence. Duffel runtime already maps:

- `stopPreference === 'nonstop'` → `max_connections = 0`
- `stopPreference === 'at_most_one'` → `max_connections = 1`

That is provider-search constraint semantics. Dropping it would silently broaden a user-requested nonstop / at-most-one search on any future adapter using this seam.

CR-1 correction:

- `FlightProviderSearchRequest.stopPreference` is canonical `FlugStoppPraeferenz`;
- `flightProviderSearchRequestAus()` copies it losslessly;
- no Duffel `max_connections` translation on the shared seam;
- ranking-`context` remains excluded;
- accepted ordered 1–6-leg, return-vs-multicity, passenger/cabin/currency, market/locale and Skyscanner fixture-only tests remain.

## Transport

| Item | Value |
| --- | --- |
| Canonical baseline | `main@7d826d6c26ad4f38894f18858081a179622af4de` |
| TL-owned task commit | `347c129ba283d3e7163506da98b09405053d9c40` |
| Rejected reviewed head | `3d544fa653c0f31f3447f1f24208492732f0286a` |
| Invalid later docs tip on rejected work | `9d524c888bf71c1817311c1b70843ed25f250f17` |
| CR-1 review-fix | `8c26ea877f0c606a03b690ccb886177a8a817e9c` |
| Exact final head | `3cee8aba6b2117c3291594ea794f1074ff125df9` |
| Draft | stays Draft |

## Changed files vs task commit `347c129b`

| File | Role |
| --- | --- |
| `lib/providers/flights/domain.ts` | ordered legs + canonical `stopPreference` |
| `lib/providers/flights/map-search-request.ts` | lossless `stopPreference`; drops only ranking `context` |
| `lib/providers/flights/map-search-request.test.ts` | 1/2/3–6 legs, max-6, context leak, `any`/`nonstop`/`at_most_one` |
| `DECISIONS.md` | ADR-0207 corrected |
| `ARCHITECTURE.md` / `docs/FLUEGE.md` | contract note |
| continuity / self-review / this handoff | Generation-1 CR-1 evidence |

## Non-scope proof

`git diff --name-only 347c129ba283d3e7163506da98b09405053d9c40 HEAD` has **no** path under:

- `lib/flights/duffel/`
- `lib/providers/skyscanner/`
- `supabase/`
- `app/api/`

No provider selection, application, secret, network, paid/live call, Production S6, Commercial Provenance writer, TW-8/TW-9 or #394.

## Local gates on CR-1 review-fix `8c26ea87`

Working tree was clean at `8c26ea877f0c606a03b690ccb886177a8a817e9c` when these commands ran.

| Command | Outcome |
| --- | --- |
| `node --import ./scripts/server-only-test-register.mjs --import tsx --test "lib/providers/flights/map-search-request.test.ts"` | **11/11 pass** |
| `node --import ./scripts/server-only-test-register.mjs --import tsx --test "lib/flights/**/*.test.ts" "lib/providers/skyscanner/flights/adapter.test.ts"` | **137/137 pass** |
| `npm test` | **3123/3123 pass** |
| `npm run typecheck` | **pass** |
| `npm run lint` | **0 errors** (137 pre-existing warnings; none in changed Flight files) |
| `npm run build` | **pass** (Next.js 16.3.3) |

CI/Vercel evidence for `3d544fa6` is invalid.

## Fresh gates re-run on exact head `3cee8aba`

Same session, clean tree at `3cee8aba6b2117c3291594ea794f1074ff125df9`:

| Command | Outcome |
| --- | --- |
| focused `map-search-request.test.ts` | **11/11 pass** |
| `lib/flights/**` + Skyscanner adapter tests | **137/137 pass** |
| `npm test` | **3123/3123 pass** |
| `npm run typecheck` | **pass** |
| `npm run lint` | **0 errors** (137 pre-existing warnings) |
| `npm run build` | **pass** |

A subsequent SHA-lock commit may sit on top of `3cee8aba` only to write this SHA into the tree. If present, that tip is the live review head; it must be re-gated before stop.

## Next step

Independent ChatGPT Technical-Lead Exact-Head re-review of the live PR head. Cursor stops here.
