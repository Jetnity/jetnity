# Jetnity – V1 Core Regression Hunter 1 – HANDOFF

Stand: 21. September 2026  
Status: **AUDIT COMPLETE / DOCS-ONLY / STOP FOR TECHNICAL-LEAD REVIEW / KEIN READY / KEIN MERGE / KEIN FOLGESLICE**

Binding task: `docs/V1_CORE_REGRESSION_HUNTER_1_TASK_2026-09-21.md`  
QA report: `docs/V1_CORE_REGRESSION_HUNTER_1_REPORT_2026-09-21.md`  
Status: `docs/V1_CORE_REGRESSION_HUNTER_1_STATUS_2026-09-21.md`  
Self-review: `docs/V1_CORE_REGRESSION_HUNTER_1_SELF_REVIEW_2026-09-21.md`

This document is enough for a new agent or Technical Lead to continue without the chat.

---

## 1. Where the work lives

| | |
| --- | --- |
| Issue | #496 |
| Draft PR | #498 |
| Branch | `audit/v1-core-regression-hunter-1` |
| Canonical / live main | `4169c5b4a2d6e2f663bfaace385a2d482a4cc2d9` |
| Dispatch head | `b27f620f418aed9d03df098b3b3730dcd1080578` |
| Agent | Jetnity V1 core regression hunter 1, Generation 1 |
| Parent model | Cursor Grok 4.6 High Fast (`originalModelName=cursor-grok-4.6-high-fast`) |
| Session | `bc-3f1efd48-1c68-489a-8e1b-12ed3bf26f2a` |

Read first:

1. the binding task
2. the QA report — the substance
3. STATUS and this handoff
4. the adversarial SELF_REVIEW
5. live PR #498, live `origin/main`, live CI and Vercel on the **current HEAD**

---

## 2. What changed

Docs only. Four new slice-local files plus the pre-existing task. No runtime, schema, script, package or global continuity edit.

Parallel boundaries honoured:

- did not edit PR #494 harness / `scripts/db` / `package.json`
- did not edit PR #497 reconciliation docs
- did not merge another branch

---

## 3. What a reviewer should verify first

1. Merge-base equals live `origin/main@4169c5b4` and behind=0.
2. Diff vs main is docs-only under `docs/V1_CORE_REGRESSION_HUNTER_1_*`.
3. Review threads 0 on the content head.
4. Re-fetch exact-head CI / Auth / Preview after this persist.
5. Spot-check the four look-first findings against the cited lines:
   - `proxy.ts` catch → `scope.deny` (RH-1.1)
   - `lib/mobility/kanten.ts` `benoetigteKanten` (RH-3.1)
   - `SecurityWidget.tsx` `includes('failed')` vs `kennzahlen.ts` `auth_failed` (RH-10.1)
   - `ARCHITECTURE.md` L133 / `docs/DATENBANK.md` L262 vs `docs/AUTH.md` L117 (RH-12.1)
6. Confirm this self-review is not treated as Technical-Lead PASS.

---

## 4. What this slice does not mean

- Historical G2 findings are **not** re-classified here. That is PR #497.
- Finding 5.2 ingestion remains OPEN as architecture. Producer proof is PR #494.
- Leftover HOLD sentences in `docs/ACTIVE_WORK_STATUS.md` were recorded (RH-12.3), not corrected.
- No finding is approved for implementation by this handoff.

---

## 5. Recommended Technical-Lead next step

Independent exact-head review of #498. Then either:

- PASS and merge this docs-only hunter; or
- CHANGES REQUIRED back to this same session / generation.

If later remediation is selected, it must be a **new numbered slice** with its own branch. Suggested ungated cluster, one PR each, only after TL decides they are worth a writer:

1. RH-1.1 HTML lookup-failed vs login  
2. RH-3.1 sort mobility edges by `position`  
3. RH-10.1 shared security KPI predicate  
4. RH-12.1 / RH-12.2 leftover architecture/comment sentences  

Do not mix those with #494 or #497.

---

## 6. Next Cursor/Guardian action

**STOP FOR TECHNICAL-LEAD REVIEW.** No Ready. No merge. No follow-up slice.
