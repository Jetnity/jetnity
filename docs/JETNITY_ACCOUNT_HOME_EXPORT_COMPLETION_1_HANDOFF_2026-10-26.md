# Account Home and Export Completion 1 — Handoff

**Lane K · 26 October 2026 · Cursor Generation 1**

**Next actor:** ChatGPT / Technical Lead, for an independent exact-head review of Draft PR #1036 after this integration. Cursor does not PASS, Ready, or merge. Do not start a follow-up slice.

## Session

| | |
| --- | --- |
| Logical name | Jetnity Account Home and Export Completion 1 — Cursor Generation 1 |
| Model | `grok-4.7-high-fast` |
| Metadata source | Cursor Cloud run-info field `originalModelName` |
| Session | `bc-596c12d0-a045-48c8-ba62-db7ca4ca3809` |
| Link | https://cursor.com/agents/bc-596c12d0-a045-48c8-ba62-db7ca4ca3809 |
| Node | `v22.23.4` |
| Branch | `feat/r109-account-home-export-completion-1` |
| PR | Draft #1036 · tracking #1033 · parent #1026 |
| TASK | `docs/JETNITY_ACCOUNT_HOME_EXPORT_COMPLETION_1_TASK_V1_2026-10-26.md`, blob `ca05682f451fb9140af63922afbf9ec2b0cb0e35`, not edited |
| Seed | `8a9e5479337090079839629715f9a3f1a03116f9` |
| Mode | `NORMAL` |
| Accepted main | `7c5b32d309fa52f18bca1b1744421cb5b2cd1c84` |
| Accepted main tree | `a1a3e145b6870fa5e1d4c2f00bb04f9d5c240d8a` |
| Merge commit | `db09b714d4fe57459e37b672fef603853b66d0d4` |
| Merge parents | `c020b7cb81616d469d8021cb33395afe653ef659`, `7c5b32d309fa52f18bca1b1744421cb5b2cd1c84` |
| Proof commit | `d5b7bf3392bca6ed4d9d675d3d1b053c87d466bd` |
| Proof tree | `e50bd37d337968788c0eb64c4b2911af463f8eb8` |
| Merge-base | `7c5b32d309fa52f18bca1b1744421cb5b2cd1c84` |
| Ahead / behind at the proof commit | 11 / 0 |

This file is updated by the documentation commit on top of the proof commit, so it cannot name that documentation SHA. After push, the author block on #1036 is the exact `HEAD`, tree, ahead and behind. Re-fetch `origin/main` before review. A main move after `7c5b32d309fa52f18bca1b1744421cb5b2cd1c84` was not merged again.

Lock provenance, this session: `npm ci` from the integrated lock. Installed `ws@8.21.0` under `@supabase/realtime-js` and `source-map-js@1.2.2` under `postcss`. `package.json` and `package-lock.json` are byte-identical to accepted main. That install is distinct from historical S evidence and from native CI.

## Commits after the reviewed R1 head

- `db09b714d4fe57459e37b672fef603853b66d0d4` — merge of accepted U main, no conflicts
- `d5b7bf3392bca6ed4d9d675d3d1b053c87d466bd` — mounted blank id, duplicate id, and a row in all 13 tables; unused window-hint import removed
- this documentation commit — PLAN, STATUS, REPORT, SELF_REVIEW, HANDOFF

## Owned diff against accepted main

`app/account/settings/page.tsx`, `app/account/welt/page.tsx`, `components/account/AccountUebersicht.tsx`, `components/account/AccountUebersichtLive.tsx`, `components/account/AccountWeltKarte.tsx`, `components/account/account-home-export-1/KontoDatenexportAktion.tsx`, `components/account/account-home-export-1/ReiseFensterHinweis.tsx`, `components/account/account-home-export-1/ReiseFensterRahmen.tsx`, `components/account/account-home-export-1/useGeraetekalendertag.ts`, `components/account/world-explorer-1/WorldExplorer.tsx`, `lib/account/account-home-export-1/export-antwort.ts`, `lib/account/account-home-export-1/export-antwort.test.ts`, `lib/account/account-home-export-1/fenster.ts`, `lib/account/account-home-export-1/fenster.test.ts`, `lib/account/account-home-export-1/kalender.ts`, `lib/account/account-home-export-1/kalender.test.ts`, `lib/account/datenexport.ts`, `lib/account/datenexport.test.ts`, `lib/account/naechste-reise.test.ts`, `scripts/account-home-export-completion-1/audit.mjs`, `scripts/account-home-export-completion-1/harness.tsx`, `scripts/account-home-export-completion-1/server-only-stub.js`, the five owned docs, TASK V1, and `docs/evidence/account-home-export-completion-1/`.

Not changed by this lane: `lib/trips/daten.ts`, trip writers, `KontoLoeschen.tsx`, `app/api/account/export/route.ts`, Auth, privacy, migrations, packages, workflows, global CSS, `AGENTS.md`, operating mode, Root continuity docs. S, T, A and U files arrived only through the accepted-main merge and were not edited afterward.

## Tests and browser provenance

- Typecheck on the proof commit: pass.
- Lint on the proof commit: 0 errors, 175 warnings. The lane file warning is the pre-existing unused `weltMusterId` import.
- Five hygiene checks: pass, run on the merge before the proof commit. The proof commit does not add an export or a dependency.
- Production build: pass. `check:setup` warned that this VM has no `.env` file.
- `npm test`: 7308 pass, 5 skipped, 11 fail. The failures are native PG16 proofs with no local `initdb`. No hosted SQL.
- Focused account tests: 35 pass.
- Mounted Chromium audit, external network aborted, synthetic fixtures, production CSS from `.next/static/chunks/*.css` inlined (101,364 characters): pass. Evidence: `docs/evidence/account-home-export-completion-1/mounted-proof.json` and the PNG files beside it. Final counts: 21 requests, 3 downloads, 3 revokes, 0 page errors.
- Playwright Chromium is a local tool in this VM. It is not a product dependency.

## Checked

Account home and world window copy, including stage-less 200, complete empty, and separate trip and visit failures. Local midnight and offset. Settings export outcomes, including newer pointer and keyboard focus, keyboard cancel, timeout, unmount, a late old body, and a valid 13-table file. Blank id and duplicate id inside one table do not download. Widths 320/390/768/1440 and 32px root text on the home overview.

## Not checked

Real account, private export body, hosted database, real device, OS zoom, full tab order, screen reader, `AccountBesuche` mounted in the harness, CI, or Preview of this head. Source and synthetic proof are not hosted persistence.

## Findings

P0 none. P1 none. P2 and P3 are in the self-review. Special Product-Owner gates are unchanged, including #917 hosted STOP, #748 personal-browser suspension, Official Truth and provider hard-off, noindex and budget. No new cost, provider, or migration.

## Gate

Draft. Stop for independent Technical-Lead review. CI and Preview can be added later as a PR comment.

**do not mark Ready · do not merge · do not start a follow-up slice**
