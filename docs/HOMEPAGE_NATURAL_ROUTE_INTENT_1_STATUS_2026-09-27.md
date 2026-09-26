# Homepage Natural Route Intent 1 — STATUS

Date: 2026-09-27  
Status: **R1 IMPLEMENTED / STOP FOR INDEPENDENT TECHNICAL-LEAD EXACT-HEAD RE-REVIEW**  
Parent issue: #110 (bounded remaining intent layer; must not auto-close)  
Draft PR: #575  
Branch: `feat/homepage-natural-route-intent-1`  
Agent: Jetnity homepage natural route intent 1, Generation 1  
Required and actual model: Cursor Grok 4.6 High Fast (`originalModelName=cursor-grok-4.6-high-fast`)  
Session: `bc-fe25bf01-3d21-4b29-8b9f-81743491d7d7`  
URL: https://cursor.com/agents/bc-fe25bf01-3d21-4b29-8b9f-81743491d7d7  
Operating mode re-read: `NORMAL`

This is not a Technical-Lead PASS and is not Ready. Self-review is not TL PASS. Do not merge. Do not start a follow-up slice.

`docs/ACTIVE_WORK_STATUS.md` was not edited. Parallel docs-only PR #574 owns that global file and is now on this branch only via merge from `main@35ea065536649c20740a6d6bbd24294c2366aee3`.

## What landed

Deterministic homepage intent on top of merged #543, plus TL R1:

- Pure helper `lib/places/route-intent.ts`: whitespace normalize, language conjunctions DE/EN/FR/IT/ES/PT/PL plus comma/semicolon/newline/arrow/`&`, order/duplicates preserved, `GRENZEN.etappenJeReise` enforced, no Place IDs.
- Whole canonical `/api/search/places?rolle=ziel` check **before** any split. Exact folded label, `landAliasMatch`, and bounded `Lima, Peru` label+description context count as one place.
- **R1:** after the whole input is not one place, strong-separator blocks are kept first. Each conjunction block is proven again with the same local place search before it may be split. `Bosnien und Herzegowina, Kroatien` and `Trinidad und Tobago, Peru` keep the compound country. `Bosnien und Herzegowina und Kroatien` groups to two proven phrases or refuses; it never emits three destinations.
- Per-block search 503/network/malformed → keep that block intact. Whole-input 503 still fail-closes the entire string.
- Recognized 2..N phrases become an ordered confirmation queue. Every destination is still confirmed through `OrtSuche`.
- Final submit still uses `routeAbsendenPruefen` / `routeEinstiegHref` / server revalidation. No auto-submit, no auto-select, no free-text Place truth.

## Local gates on the persist working tree

Re-read `git rev-parse HEAD` after this persist. That SHA is the freeze. Older exact-head gates, including `cc819d2253361e38e6ac5d9fed328c39521b1ba7`, do not apply.

| Check | Result |
| --- | --- |
| Focused route-intent + UI tests | pass |
| Existing #543 route-entry unit tests | pass |
| Full `npm test` | 3931 pass / 0 fail |
| Hydrated this slice | 12 PASS |
| Hydrated #543 | 10 PASS |
| `npm run typecheck` | pass |
| ESLint owned files | pass |
| Production build | pass (`next build` 16.3.3, compiled + static generation) |
| `check:dead` / `check:exports` / `check:api-schutz` / `check:operating-mode` | pass |
| Auth / Production / provider / DB | not mutated |
| `docs/ACTIVE_WORK_STATUS.md` | not edited; #574 Account Counts closure preserved via merge |

Exact-head GitHub CI/Auth/Preview must be re-read on the freeze SHA after this persist.

## Scope

Changed runtime: `components/places/StartzielForm.tsx`, `lib/places/route-intent.ts`, focused tests, dedicated hydrated harness/script, own STATUS/HANDOFF/SELF_REVIEW, own evidence.

Not edited: `TripPlanner`, Guest storage, DB/Auth/migrations, providers/models, `OrtSuche.tsx`, `docs/ACTIVE_WORK_STATUS.md`.

## Remaining #110

Arbitrary sentence interpretation beyond separator syntax remains later and model-gated. Physical-device acceptance remains pending. This slice does not close #110.
