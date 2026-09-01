# Destination Essentials 1 – Handoff

Stand: 1. September 2026  
Status: **REVIEW FIX IMPLEMENTED / LOCAL GATES GREEN / STOP FOR FRESH TECHNICAL-LEAD EXACT-HEAD RE-REVIEW**

## Identity

- Issue: #393
- PR: https://github.com/Jetnity/jetnity/pull/394 (Draft)
- Task: `docs/DESTINATION_ESSENTIALS_1_TASK_2026-09-01.md`
- Branch: `feat/phase-1-destination-essentials-1`
- Cursor-Agent: `Jetnity destination essentials 1`
- Generation: **1**
- Session: `bc-0dde2838-bb7b-4e97-b94a-6ac95002e2a2`
- Multi-Agent: **SINGLE_AGENT**
- Canonical base: `main@c4b6bf3266a9a6aa88a2f3e22e51007b6fb38a08`
- Rejected exact head: `52b9866d74d8d0db1916911e08bfed3168073472` (review `#5077136019`)
- Review-fix implementation commits: `83ea0fab06b6177d16530ae89142ef0669870e96` (truth) + `f4fde3f4b63dbc54f404381dd2ebfdfbbd442df7` (PWA gap-analysis accuracy)
- Exact head for this handoff: `0afcc0866ec5e2a902cbcf35b54cc2d362767e58` (this documentation commit). If a later lock commit exists on the same branch, CI/Preview must be read for that tip.
- Main drift at this handoff: **none** — `origin/main` re-fetched, still `c4b6bf3266a9a6aa88a2f3e22e51007b6fb38a08`

## Binding review addressed

Technical-Lead CHANGES REQUIRED `#5077136019` plus the same-session documentation-accuracy follow-up:

1. Mixed current Official outcomes across alternative credentials are no longer unconditional `required` / `not_required`. Compact states: `option_abhaengig`, `reisende_abhaengig`, `option_und_reisende_abhaengig`.
2. Official details expose canonical `officialCredentialLabel(...)`.
3. Deterministic tests cover same-traveller required vs not_required, reversed evaluation order, multiple travellers, and same-option mixed requirement types.
4. Safety/Seasonal source links use `Quelle öffnen` unless authority is `official_*`.
5. Identical Official action/source hrefs are deduped; validated action wins.
6. `docs/JETNITY_V1_PHASE1_GAP_ANALYSIS_2026-09-01.md` PWA row no longer says PWA is probably missing after verified PWA-1 closure.

## Production evidence limitation

Live re-scan of product callers:

- `TripWorkspaceAuditClient` injects `officialEvaluations` / `safetyEvaluations` / `seasonalEvaluations` (UI-audit harness only).
- `KontoArbeitsbereich` and `GastArbeitsbereich` do **not** pass those props to `TripWorkspace`.

No hidden API, fixture, local fake fact, or new runtime data source was added. If Guest/Account supplies no evaluations, Destination Essentials renders the honest bounded empty state. This slice remains a presentation/projection surface over supplied canonical truth only.

## Changed files in this review fix

- `lib/trips/destination-essentials.ts`
- `lib/trips/destination-essentials.test.ts`
- `components/trips/TripWorkspaceDestinationEssentials.tsx`
- `DECISIONS.md` (ADR-0207 point 7)
- `docs/JETNITY_V1_PHASE1_GAP_ANALYSIS_2026-09-01.md` (PWA row accuracy only)
- `docs/DESTINATION_ESSENTIALS_1_HANDOFF_2026-09-01.md`
- `docs/DESTINATION_ESSENTIALS_1_SELF_REVIEW_2026-09-01.md`
- `docs/ACTIVE_WORK_STATUS.md`

## Local gates on `f4fde3f4` (implementation + PWA row)

| Gate | Result |
| --- | --- |
| Targeted Destination Essentials tests | **17/17 pass** |
| Full repository suite | **3129 pass / 0 fail** |
| `npm run typecheck` | pass |
| `npm run lint` | pass (0 errors; 137 pre-existing warnings elsewhere) |
| `npm run build` | pass |
| `check:exports` / `check:dead` / `check:deps` / `check:api-schutz` / `check:schema-bezug` | pass |
| GitHub CI / Vercel Preview | must be read for **this branch tip** after the handoff commit; ancestor SHA evidence is not exact-head |

`/sw.js` was not introduced. No DB/Auth/provider/live API.

## Next

Independent Technical-Lead Exact-Head re-review of the new head.  
**DO NOT mark Ready. DO NOT merge.**  
**STOP FOR TECHNICAL-LEAD REVIEW.**
