# Homepage Confirmed Route Entry 1 — STATUS

Date: 2026-09-22  
Status: **IMPLEMENTATION DELIVERED / STOP FOR INDEPENDENT TECHNICAL-LEAD REVIEW**  
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
Implementation head before this persist: `04b14b2551c644217be97887d143c76d9b7242c4`  
Operating mode re-read: `NORMAL`

This is not a Technical-Lead PASS and is not Ready. Self-review is not TL PASS. Do not merge. Do not start a follow-up slice.

## What landed

Provider-independent confirmed-place route entry only.

- Homepage keeps the current green/lime hero and one progressive `OrtSuche`.
- After a confirmed place, compact occurrence chips allow add / remove / replace / keyboard reorder. Intentional duplicates stay (Paris → Rom → Paris). Occurrence identity is not the place ID.
- One target still uses `zielId`. Two or more use repeated `zielIds` in user order.
- `/planen` validates the entire list before lookup. Conflict with legacy `zielId`/`ziel`, empty, oversized, or malformed transport is a recoverable error and never a partial route.
- Server-confirmed names win. Failed reads stay distinguishable from empty matches. No auto-create on mount.
- Guest draft protection and Account independence are unchanged. `zielIds` is a recognized noindex / non-generic-CTA handoff key, including empty/malformed presence.
- Full arbitrary natural-language interpretation is unfinished. No comma/`und` parser, no model activation, no #110 close.

## Drift at this persist

`origin/main` re-read: still `35148a4ba065be1315dddf21174d7f272518d34c`.  
Merge-base: `35148a4ba065be1315dddf21174d7f272518d34c`.  
Ahead 3 / behind 0 versus `origin/main` before this persist (task seed + implementation + typecheck fix). No unrequested merge/rebase/force.

## Local gates before persist

| Check | Result |
| --- | --- |
| Owned + related node:test (`scripts/homepage-route-entry-1-verify.mjs`) | 140 pass / 0 fail |
| `npm run typecheck` | pass after `04b14b25` |
| eslint on owned files | 0 errors |
| `check:exports` | pass |
| `check:dead` | pass, 0 orphan modules |
| Auth / Production / provider | not mutated |

Exact-head CI/Auth/Preview on the freeze SHA must be re-read after this persist. Gates on `04b14b25` do not transfer. This VM followed Vercel SSO on the Preview alias and did not receive Jetnity HTML.

## Browser evidence

Chromium emulation only. See `docs/evidence/homepage-confirmed-route-entry-1/`. Local `/api/search/places` returned `[]`, so live chip-add against canonical suggestions was not available here. Pending-text, empty submit, 390/768/1024/1440 layout and handoff errors were exercised. Not a physical-device PASS.

## Remaining #110

Arbitrary sentence interpretation such as "Lima und Cusco" remains a later gated model slice.
