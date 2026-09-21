# Jetnity – V1 Admin Security KPI Taxonomy Alignment 1 HANDOFF

Stand: 21. September 2026  
Status: **IMPLEMENTATION COMPLETE FOR TL REVIEW / DRAFT / KEIN READY / KEIN MERGE / KEIN FOLGESLICE**

Binding task: `docs/V1_ADMIN_SECURITY_KPI_TAXONOMY_ALIGNMENT_1_TASK_2026-09-21.md`  
Decision: `docs/V1_ADMIN_SECURITY_KPI_TAXONOMY_ALIGNMENT_1_DECISION_2026-09-21.md`  
Status: `docs/V1_ADMIN_SECURITY_KPI_TAXONOMY_ALIGNMENT_1_STATUS_2026-09-21.md`  
Self-review: `docs/V1_ADMIN_SECURITY_KPI_TAXONOMY_ALIGNMENT_1_SELF_REVIEW_2026-09-21.md`

This document is enough for a new agent or Technical Lead to continue without the chat.

---

## 1. Where the work lives

| | |
| --- | --- |
| Issue | #503 |
| Draft PR | #504 |
| Branch | `fix/v1-admin-security-kpi-taxonomy-alignment-1` |
| Canonical base | `main@d1949e23b3dda30b7482265822e7e1279f244228` |
| Dispatch head | `df5c2a1861139432c5286fe11da7eb2feed3cc03` |
| Agent | Jetnity V1 admin security kpi taxonomy alignment 1, Generation 1 |
| Parent model | Cursor Grok 4.6 High Fast (confirmed `originalModelName=cursor-grok-4.6-high-fast`) |
| Session | `bc-1ef7e31e-c82e-4545-b5ac-67117b3730a7` |

Read first:

1. the binding task and RH-10.1 / RH-10.2 in `docs/V1_CORE_REGRESSION_HUNTER_1_REPORT_2026-09-21.md`
2. `lib/admin/security-event-taxonomy.ts`
3. `SecurityWidget.tsx` KPI lines and `lib/admin/kennzahlen.ts`
4. this handoff, STATUS, DECISION, SELF_REVIEW
5. live PR #504, live `origin/main`, live CI and Vercel on the **current HEAD**
6. the PR comment that holds exact-head gate IDs

## 2. What changed

One shared presentation taxonomy. Widget and aggregator no longer keep private string rules.

- Login-Fehler: exact `auth_failed` | `login_failed`
- Auffälligkeiten: `anomaly*` | exact `bot` | `suspicious` | `ddos`

Historical types remain readable. No producer. Honest incomplete-ingestion copy and null/error != zero preserved.

Parallel boundaries honoured:

- did not edit PR #494 local DB harness / `package.json`
- did not edit PR #497 reconciliation docs
- did not merge another branch
- did not touch sibling P2-fix ownership

## 3. What a reviewer should verify first

1. Merge-base equals the live `origin/main` used as canonical base, behind=0, or any later drift is reported honestly.
2. Diff stays inside the allowed ownership set.
3. Widget still derives 24h KPIs from unfiltered `aufgezeichneteEvents`.
4. Neither surface uses `includes('failed')` or the old `bot|suspicious|ddos` regex.
5. Coverage-truth source contracts still see `failed` / `suspicious` variable names and honest copy.
6. Review threads 0 on the content head.
7. Re-fetch exact-head CI / Auth / Preview from the PR comment / live SHA. Do not trust IDs copied into an older commit.

## 4. What this slice does not mean

- Finding 5.2 ingestion is **not** closed.
- #487 / #494 producer work is **not** advanced.
- Blocklist enforcement is **not** implemented.
- Ready / merge is **not** granted.

## 5. Next Cursor/Guardian action

**STOP FOR TECHNICAL-LEAD REVIEW.** No Ready. No merge. No follow-up slice.
