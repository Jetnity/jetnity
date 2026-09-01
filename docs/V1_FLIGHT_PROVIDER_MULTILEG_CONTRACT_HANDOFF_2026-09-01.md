# V1 Flight Provider Multi-Leg Contract – Exact-Head Handoff

Stand: 1. September 2026  
Status: **STOP FOR INDEPENDENT TECHNICAL-LEAD REVIEW**  
Logical agent: **`Jetnity V1 flight provider multileg contract 1`**  
Generation: **1**  
Session: `bc-b592d931-3ecb-4cec-b250-ab19a19930b1`  
Draft-PR: https://github.com/Jetnity/jetnity/pull/403  
Issue: https://github.com/Jetnity/jetnity/issues/402  
Binding: `docs/V1_FLIGHT_PROVIDER_MULTILEG_CONTRACT_RECONCILIATION_TASK_2026-09-01.md`

> Ein Git-Commit kann seinen eigenen finalen SHA nicht im Tree tragen. Exact Head + Ahead/Behind stehen live im PR.

Cursor does **not** mark Ready, merge, or start a follow-up slice.

---

## Zuerst lesen

1. Issue #402
2. `docs/V1_FLIGHT_PROVIDER_MULTILEG_CONTRACT_RECONCILIATION_TASK_2026-09-01.md`
3. `docs/V1_FLIGHT_PROVIDER_MULTILEG_CONTRACT_SELF_REVIEW_2026-09-01.md`
4. `lib/providers/flights/domain.ts`
5. `lib/providers/flights/map-search-request.ts`
6. `lib/providers/flights/map-search-request.test.ts`
7. ADR-0207 in `DECISIONS.md`

## What a new chat must know

This is **SINGLE_AGENT** Generation 1 on the existing TL-scaffolded branch.

Canonical product search remains `FlugSuchanfrage.legs[]` (1–6). Runtime `FlugProvider.suchen` and Duffel already consume that shape. The later offline request type had drifted to origin/destination/`returnDate` and had **zero runtime callers**.

Implemented reconciliation:

- `FlightProviderSearchRequest` is now ordered `legs[]`;
- `flightProviderSearchRequestAus()` projects a validated `FlugSuchanfrage` plus external `{ market, locale }`;
- ranking-`context` and `stopPreference` do not leak;
- no second 1–6 validator;
- Skyscanner remains fixture-only / non-promotable;
- Duffel runtime is unchanged.

## Transport at handoff write

| Item | Value |
| --- | --- |
| Canonical baseline | `main@7d826d6c26ad4f38894f18858081a179622af4de` |
| TL-owned task commit | `347c129ba283d3e7163506da98b09405053d9c40` |
| Implementation commit | `3d544fa653c0f31f3447f1f24208492732f0286a` |
| Final head | **read live on PR #403** after this handoff commit |
| Ahead / behind `origin/main` | re-check live |
| Draft | stays Draft |

## Changed files

| File | Role |
| --- | --- |
| `lib/providers/flights/domain.ts` | ordered-leg request; no `returnDate` / ranking context |
| `lib/providers/flights/map-search-request.ts` | explicit mapping seam from `FlugSuchanfrage` |
| `lib/providers/flights/map-search-request.test.ts` | deterministic 1 / 2 / 3–6 / max-6 / context-leak tests |
| `DECISIONS.md` | ADR-0207 |
| `ARCHITECTURE.md` / `docs/FLUEGE.md` | contract note |
| `docs/ACTIVE_WORK_STATUS.md` / `JETNITY_START_HERE.md` / `ROADMAP.md` | current-slice pointer |
| this handoff / self-review / task status | exact-head continuity |

## Non-scope proof

`git diff --name-only 347c129ba283d3e7163506da98b09405053d9c40` contains **no** path under:

- `lib/flights/duffel/`
- `lib/providers/skyscanner/`
- `supabase/`
- `app/api/`
- Commercial Provenance writer/persistence
- TW-8 / TW-9 / Destination Essentials

No provider selection, application, secret, network, paid/live call, or Production S6 change.

## Local gates on implementation head `3d544fa6`

| Gate | Outcome |
| --- | --- |
| Focused contract tests | **10/10 pass** |
| `lib/flights/**` + Skyscanner adapter tests | **137/137 pass** |
| `npm test` | **3122/3122 pass** |
| `npm run typecheck` | **pass** |
| `npm run lint` | **0 errors** (137 pre-existing warnings; none in changed Flight files) |
| `npm run build` | **pass** (Next.js 16.3.3) |

GitHub Actions, Vercel and main-drift review belong to the independent Technical Lead.

## Next step

Independent ChatGPT Technical-Lead Exact-Head review of the live PR head. Cursor stops here.
