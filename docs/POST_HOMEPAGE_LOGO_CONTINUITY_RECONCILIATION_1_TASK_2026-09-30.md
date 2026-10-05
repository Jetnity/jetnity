# Jetnity Post Homepage/Logo Continuity Reconciliation 1 — TASK

Stand: 30 September 2026
Status: **BOUNDED DOCS-ONLY GLOBAL CONTINUITY REPAIR / NO RUNTIME AUTHORITY**

Issue: #652
Branch: `docs/post-homepage-logo-continuity-reconciliation-1`
Baseline: `main@b5534340b0535402ffbe223f3687744e465c11b9`

## 1. Why this exists

The Binding Slice Precheck / Continuity Gate requires the canonical current-state pointers to be reconciled after material merges before another chat or runtime slice relies on them.

Live state at dispatch:
- machine mode `NORMAL`;
- current main `b5534340b0535402ffbe223f3687744e465c11b9`;
- #649/#648 premium homepage closed, merged and post-merge verified;
- #651/#650 official Jetnity logo closed, merged and post-merge verified;
- post-#651 push CI `36758986306` SUCCESS;
- Vercel Production `dpl_5yh4KNcckHse86VmHQtSx3ggLDwf` READY on exact main with `jetnity.com`;
- public homepage serves that deployment, retains H1 **Deine ganze Reise. Intelligent an einem Ort.**, premium homepage structure, and `/brand/jetnity-logo.png`;
- public logo asset returns HTTP 200;
- public indexing remains `noindex, nofollow`; robots stays `Disallow: /`;
- Trip Workspace four-mode IA remains integrated;
- no active runtime/product writer;
- open PRs #52/#50/#40/#39/#28 are historical, not active;
- #626 remains OPEN/BLOCKED, no workaround;
- KAYAK/IATA waiting, Sherpa response received/outgoing paused, #585 deferred;
- provider/payment/Production/indexing/launch gates remain closed.

The current top blocks in global pointers still describe Draft #647 as the only writer and an older current main. That is now stale.

## 2. Writer identity

Logical agent: **Jetnity post-Homepage/Logo continuity reconciliation 1**
Generation: **1**
Required model: **Grok 4.7 High Fast**, not Auto.

Record actual Cursor session URL and `originalModelName` before editing. If the required model is unavailable, STOP.

## 3. Read first

1. `.jetnity/operating-mode.json`
2. `JETNITY_START_HERE.md`
3. Technical-Lead / Cursor standard
4. Binding Slice Precheck standard
5. `docs/ACTIVE_WORK_STATUS.md`
6. `JETNITY_HANDOFF.md`
7. closure evidence for #649/#648 and #651/#650
8. live main/open PRs/open issues/Actions/Vercel
9. Issue #652

Live evidence wins.

## 4. Allowed write ownership

Only:
- `JETNITY_START_HERE.md`
- `JETNITY_HANDOFF.md`
- `docs/ACTIVE_WORK_STATUS.md`
- `docs/POST_HOMEPAGE_LOGO_CONTINUITY_RECONCILIATION_1_TASK_2026-09-30.md`
- `docs/POST_HOMEPAGE_LOGO_CONTINUITY_RECONCILIATION_1_REPORT_2026-09-30.md`
- `docs/POST_HOMEPAGE_LOGO_CONTINUITY_RECONCILIATION_1_HANDOFF_2026-09-30.md`
- `docs/POST_HOMEPAGE_LOGO_CONTINUITY_RECONCILIATION_1_SELF_REVIEW_2026-09-30.md`

No runtime/assets/code.

## 5. Required current truth

Add a concise top block that records:
- current main `b5534340b0535402ffbe223f3687744e465c11b9`;
- premium homepage #649 closed;
- official logo #651 closed;
- current post-merge CI and Production;
- premium homepage and official brand live together;
- Search/AI/entity/truth architecture preserved;
- public indexing/launch still fail-closed;
- no active runtime/product writer;
- #626 OPEN/BLOCKED;
- provider/legal waiting/deferred states unchanged;
- no runtime follow-up selected by this docs task;
- fresh Binding Slice Precheck required before any new runtime/product slice.

Preserve old snapshots as historical. Do not rewrite them to pretend they were authored later.

## 6. Hard boundaries

No `app/`, `components/`, `lib/`, `public/`, Supabase, Auth, provider, payment, dependency, legal/privacy, indexing/robots, operating-mode, Production or cost mutation.

No #626 workaround.

No next product/runtime slice.

## 7. Gates

- exact branch head + current main;
- merge-base/ahead/behind;
- changed-file manifest;
- `git diff --check`;
- operating-mode guard;
- exact-head GitHub CI;
- Vercel may auto-run but no runtime acceptance is claimed;
- no review threads;
- report/self-review/handoff with agent identity.

Stay Draft.
No Ready.
No merge.
No follow-up slice.
STOP for independent main-chat Technical-Lead review.
