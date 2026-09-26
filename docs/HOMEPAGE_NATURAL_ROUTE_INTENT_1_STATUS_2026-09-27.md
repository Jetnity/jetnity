# Homepage Natural Route Intent 1 — STATUS

Date: 2026-09-27  
Status: **IMPLEMENTED / STOP FOR INDEPENDENT TECHNICAL-LEAD EXACT-HEAD REVIEW**  
Parent issue: #110 (bounded remaining intent layer; must not auto-close)  
Draft PR: #575  
Branch: `feat/homepage-natural-route-intent-1`  
Agent: Jetnity homepage natural route intent 1, Generation 1  
Required and actual model: Cursor Grok 4.6 High Fast (`originalModelName=cursor-grok-4.6-high-fast`)  
Session: `bc-fe25bf01-3d21-4b29-8b9f-81743491d7d7`  
URL: https://cursor.com/agents/bc-fe25bf01-3d21-4b29-8b9f-81743491d7d7  
Operating mode re-read: `NORMAL`

This is not a Technical-Lead PASS and is not Ready. Self-review is not TL PASS. Do not merge. Do not start a follow-up slice.

`docs/ACTIVE_WORK_STATUS.md` was not edited. Parallel docs-only PR #574 owns that global file.

## What landed

Deterministic homepage intent on top of merged #543:

- Pure helper `lib/places/route-intent.ts`: whitespace normalize, language conjunctions DE/EN/FR/IT/ES/PT/PL plus comma/semicolon/newline/arrow/`&`, order/duplicates preserved, `GRENZEN.etappenJeReise` enforced, no Place IDs.
- Whole canonical `/api/search/places?rolle=ziel` check **before** any split. Exact folded label, `landAliasMatch`, and bounded `Lima, Peru` label+description context count as one place. User still confirms in `OrtSuche`.
- Search 503/network/malformed → fail closed to existing single pending confirmation. No guessed route.
- Recognized 2..N phrases become an ordered confirmation queue. Status: `N Ziele erkannt – bitte Ziel i von N bestätigen`.
- Final submit still uses `routeAbsendenPruefen` / `routeEinstiegHref` / server revalidation. No auto-submit, no auto-select, no free-text Place truth.
- Cancel remaining queue keeps already confirmed chips. Discard current text does not skip a queued destination.

## Local gates on the persist head

Evidence persist: `ae66d8ff7a23b844041a4b0d14a3614e61e69e1a`. Re-read `git rev-parse HEAD` after this freeze persist. That SHA is the freeze. Older exact-head gates do not apply.

| Check | Result |
| --- | --- |
| Focused route-intent + UI tests | pass |
| Existing #543 route-entry unit tests | pass |
| Related places / guest / create / a11y tests | 266 pass / 0 fail |
| Full `npm test` | 3924 pass / 0 fail |
| Hydrated this slice | 9 PASS |
| Hydrated #543 | 10 PASS |
| `npm run typecheck` | pass |
| ESLint owned files | pass |
| Repo `npm run lint` | 1 pre-existing error was **this slice's render-time ref**; fixed. Remaining full-repo output is inherited warnings plus that previously failing rule on other files. Owned files clean after the fix. |
| Production build | pass (`next build` 16.3.3, compiled + static generation) |
| `check:dead` / `check:exports` / `check:api-schutz` / `check:operating-mode` | pass |
| Auth / Production / provider / DB | not mutated |
| `docs/ACTIVE_WORK_STATUS.md` | not edited |

Exact-head GitHub CI/Auth/Preview must be re-read on the freeze SHA after this persist.

## Scope

Changed runtime: `components/places/StartzielForm.tsx`, new `lib/places/route-intent.ts`, focused tests, dedicated hydrated harness/script, own STATUS/HANDOFF/SELF_REVIEW, own evidence.

Not edited: `TripPlanner`, Guest storage, DB/Auth/migrations, providers/models, `OrtSuche.tsx` (existing `initialText` remount is enough), `docs/ACTIVE_WORK_STATUS.md`.

## Remaining #110

Arbitrary sentence interpretation beyond separator syntax remains later and model-gated. Physical-device acceptance remains pending. This slice does not close #110.
