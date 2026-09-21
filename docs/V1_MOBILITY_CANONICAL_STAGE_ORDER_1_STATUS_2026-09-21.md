# Jetnity – V1 Mobility Canonical Stage Order 1 STATUS

Stand: 21. September 2026  
Status: **MAIN INTEGRATED / ACTIVE_WORK_STATUS REMOVED FROM DIFF / DRAFT / NOT READY / NOT MERGED / RE-GATE THEN STOP FOR TECHNICAL-LEAD REVIEW**

Issue: #501  
Draft PR: #502  
Branch: `fix/v1-mobility-canonical-stage-order-1`  
Binding task: `docs/V1_MOBILITY_CANONICAL_STAGE_ORDER_1_TASK_2026-09-21.md`  
Source finding: RH-3.1 in `docs/V1_CORE_REGRESSION_HUNTER_1_REPORT_2026-09-21.md`  
Assigned dispatch base: `main@d1949e23b3dda30b7482265822e7e1279f244228`  
Integrated main: `main@546b33d9b5086d23c1fb93eb2af2aaf84bbefd12` (#497 docs-only)  
Dispatch head: `36bcd1c8c91bb277ce2e06ba7e0576ad5bab2ee0`

Cursor-Agent: **Jetnity V1 mobility canonical stage order 1**, Generation 1  
Required model: **Cursor Grok 4.6 High Fast** — no Auto/substitution

This file is point-in-time continuity. Every new head invalidates older exact-head gates. Agent self-review is not Technical-Lead PASS. Final CI/Auth/Vercel IDs belong in a PR comment, not a later evidence-only commit.

---

## 1. Implemented

`benoetigteKanten()` now copies `reise.stages`, sorts like timeline `etappenSortieren` (`position`, then `id`), then walks named stages. Outbound, connection and return edges therefore follow canonical stage order, not incidental array order.

Matching, duplicate-transfer, same-day-flight and fail-closed status rules are unchanged.

## 2. Tests added

In `lib/mobility/kanten.test.ts`:

- the existing `reise-orte` out-of-order fixture (Phuket/Bangkok/Chiang Mai) must yield Zürich→Bangkok, Bangkok→Chiang Mai, Chiang Mai→Phuket, Phuket→Zürich;
- first canonical stage, not array-first stage, decides whether outbound is skipped;
- two matching outbound transfers still fail closed (`unknown`) after the sort.

## 3. Scope held

Touched only:

- `lib/mobility/kanten.ts`
- `lib/mobility/kanten.test.ts`
- slice-local docs (`docs/V1_MOBILITY_CANONICAL_STAGE_ORDER_1_*`)

`docs/ACTIVE_WORK_STATUS.md` is restored to current main and is not part of this PR diff.

Not touched: trip schema/types/migrations, provider code, UI, `package.json`, PR #494 harness, PR #497 reconciliation docs, sibling P2-fix branches.

## 4. Gates

Local and exact-head CI/Auth/Vercel are recorded in the PR #502 comment after the frozen head. Do not treat this file as live CI evidence.

## 5. Next step

Run required gates, freeze the implementation head, report exact-head IDs in a PR comment, then **STOP FOR TECHNICAL-LEAD REVIEW**. No Ready. No merge. No follow-up slice.
