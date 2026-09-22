# Homepage Confirmed Route Entry 1 — STATUS

Date: 2026-09-22  
Status: **TL CHANGES REQUIRED R4 ADDRESSED / STOP FOR INDEPENDENT TECHNICAL-LEAD RE-REVIEW**  
Parent issue: #110 (bounded partial; must not auto-close)  
Draft PR: #543  
Branch: `feat/homepage-confirmed-route-entry-1`  
Agent: Jetnity homepage confirmed route entry 1, Generation 1  
Required and actual model: Cursor Grok 4.6 High Fast (`cursor-grok-4.6-high-fast`)  
Session: `bc-63084de2-f351-4c8c-be85-c36cda45935e`  
https://cursor.com/agents/bc-63084de2-f351-4c8c-be85-c36cda45935e  
Baseline: originally `main@35148a4ba065be1315dddf21174d7f272518d34c`  
Reviewed head that required R4: `0a66982c20c17f665f3d985bb9ff9387a3322f12`  
Operating mode re-read: `NORMAL`

This is not a Technical-Lead PASS and is not Ready. Self-review is not TL PASS. Do not merge. Do not start a follow-up slice.

## What landed (unchanged contract)

Provider-independent confirmed-place route entry only. Hero preserved. One `OrtSuche`, compact chips, intentional duplicates, add/remove/replace/keyboard reorder. Single target stays `zielId`; multiple use repeated `zielIds`. Full-list validation before lookup; no partial route; canonical server names; guest-draft protection and Account independence kept; `zielIds` is noindex / non-generic CTA. No NLP parser, no model activation, **#110 stays open**.

## TL review fixes

Independent review of `676d64b4` (R1/R2/R3) was addressed earlier in this session. Independent re-review of `0a66982c` found **R1/R2 independently fixed** and **NEW R4 (P1)**.

**R4:** Shared `OrtSuche` no longer treats a missing `initialText` as `""` and therefore no longer wipes a post-confirmation edit (Paris → Parix). `ortSucheAnzeigetextAbstimmen` distinguishes parent seed changes (including explicit `""`) from selection invalidation. AccountBesuchFormular was not edited; it already omits `initialText` and inherits the same contract. The previous STATUS claim that origin “still does not wipe typing” was wrong for the post-confirmation case and is withdrawn.

R1/R2 hydrated scenarios remain in the suite and still PASS.

## Drift at this persist

`origin/main` re-read: **`0b0c7bccae4a8803d780bec798dae3e49b6bba5a`** (PR #544 remaining-build map merged).  
Merge-base with this branch remains `35148a4ba065be1315dddf21174d7f272518d34c`.  
Before this persist: **7 ahead / 6 behind**. Behind commits are docs-only #544. No automatic merge/rebase/force.

## Local gates before persist

| Check | Result |
| --- | --- |
| Owned + related node:test | 148 pass / 0 fail |
| Hydrated controller script | 9 PASS |
| `npm run typecheck` | pass |
| eslint on OrtSuche | 0 errors (existing search-effect warning) |
| `check:exports` / `check:dead` | pass |
| Auth / Production / provider / DB | not mutated |

Exact-head CI/Auth/Preview on the freeze SHA must be re-read after this persist. Gates on `0a66982c` do not transfer.

## Browser evidence

Hydrated Chromium, synthetic place search, stubbed Next/server actions. R4 screenshots: `r4_origin_confirmed_edit_keeps_text.png`, `r4_minimal_ortsuche_without_initialtext.png`, `r4_parent_seed_and_reset.png`. **Not physical-device acceptance** and **not authenticated Preview E2E**.

## Remaining #110

Arbitrary sentence interpretation such as "Lima und Cusco" remains a later gated model slice.
