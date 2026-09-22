# Homepage Confirmed Route Entry 1 — STATUS

Date: 2026-09-22  
Status: **TL CHANGES REQUIRED ADDRESSED / STOP FOR INDEPENDENT TECHNICAL-LEAD RE-REVIEW**  
Parent issue: #110 (bounded partial; must not auto-close)  
Draft PR: #543  
Branch: `feat/homepage-confirmed-route-entry-1`  
Agent: Jetnity homepage confirmed route entry 1, Generation 1  
Required and actual model: Cursor Grok 4.6 High Fast (`cursor-grok-4.6-high-fast`)  
Session: `bc-63084de2-f351-4c8c-be85-c36cda45935e`  
https://cursor.com/agents/bc-63084de2-f351-4c8c-be85-c36cda45935e  
UI session title remained `Homepage confirmed route entry`. No programmable rename tool was available; a UI rename is not claimed.  
Baseline: `main@35148a4ba065be1315dddf21174d7f272518d34c`  
Task seed: `218786742e4bcd73556193b1aba8786e03f2e2f6`  
Reviewed head that required changes: `676d64b44db3080744b5ccda1354a7f3dd0590f5`  
Implementation head before this persist: `c47d24e1c4884208e74666cf7d3aea13763b27a9`  
Operating mode re-read: `NORMAL`

This is not a Technical-Lead PASS and is not Ready. Self-review is not TL PASS. Do not merge. Do not start a follow-up slice.

## What landed (unchanged contract)

Provider-independent confirmed-place route entry only. Hero preserved. One `OrtSuche`, compact chips, intentional duplicates, add/remove/replace/keyboard reorder. Single target stays `zielId`; multiple use repeated `zielIds`. Full-list validation before lookup; no partial route; canonical server names; guest-draft protection and Account independence kept; `zielIds` is noindex / non-generic CTA. No NLP parser, no model activation, **#110 stays open**.

## TL review fixes in this same session

Independent TL review of `676d64b4` was **CHANGES REQUIRED**. Same session addressed:

- **R1** StartzielForm no longer silently replaces or clears an unrelated pending draft when a confirmed chip is replaced, deleted, or when the replace target changes. Seeded replace text that still equals the occurrence name is not treated as an unrelated draft. Explicit “Unbestätigten Text verwerfen” remains the discard path. `OrtSuche` remounts only after confirmed select or explicit discard.
- **R2** TripPlanner swaps primary↔extra by occurrence identity (`primaerKey` + `tripPlannerPrimaerMitWeiteremTauschen`) and keys `OrtSuche` on that identity. Pending/empty/duplicate text survives both directions. Narrow `OrtSuche` sync: a null `value` plus changed `initialText` updates the visible input (origin without `initialText` still does not wipe typing).
- **R3** Hydrated Chromium regressions bundle the actual components with synthetic `/api/search/places` and stubbed Next router/link plus server actions. Coverage includes R1/R2 transitions, keyboard reorder, 390/768/1024/1440, 200% zoom, successful Paris→Rom→Paris chips, and ordered Account-create through the real submit path.

## Drift at this persist

`origin/main` re-read: still `35148a4ba065be1315dddf21174d7f272518d34c`.  
Merge-base: `35148a4ba065be1315dddf21174d7f272518d34c`.  
Ahead 6 / behind 0 versus `origin/main` before this persist (task seed + first delivery + this review-fix set + this persist). No unrequested merge/rebase/force.

## Local gates before persist

| Check | Result |
| --- | --- |
| Owned + related node:test (`scripts/homepage-route-entry-1-verify.mjs`) | 146 pass / 0 fail |
| Hydrated controller script (same verify) | 6 PASS |
| `npm run typecheck` | pass |
| eslint on owned files | 0 errors (existing OrtSuche setState-in-effect warnings) |
| `check:exports` | pass |
| `check:dead` | pass, 0 orphan modules |
| Auth / Production / provider / DB | not mutated |

Exact-head CI/Auth/Preview on the freeze SHA must be re-read after this persist. Gates on `676d64b4` / `04b14b25` do not transfer.

## Browser evidence

Hydrated Chromium against bundled actual components, synthetic place search. See `docs/evidence/homepage-confirmed-route-entry-1/`. Successful selected-chip and duplicate ordered create paths were exercised here. **Not physical-device acceptance** and **not authenticated Preview E2E**.

## Remaining #110

Arbitrary sentence interpretation such as "Lima und Cusco" remains a later gated model slice.
