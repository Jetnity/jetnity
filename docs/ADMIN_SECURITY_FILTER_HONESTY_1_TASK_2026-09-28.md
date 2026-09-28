# Jetnity – Admin Security Filter Honesty 1 – TASK v1

Stand: 28. September 2026
Issue: #613
Branch: `fix/admin-security-filter-honesty-1`
Canonical baseline: `main@bed4847d7ad0d601b756e3d56011b8525f7aaa5b`

## 1. Objective

Fix a bounded operator-truth defect in the existing Admin Security read-only surface.

Current `SecurityWidget` can say `Keine aufgezeichneten Events in diesem Zeitraum.` even when the 7-day payload contains events and only the **client-side filter** has no match. The current read is also capped at 200 rows without the UI explaining that a full 200-row result may be truncated.

This slice is independent from active PR #612 and must not touch any #612-owned path.

## 2. Required reading

Before editing, re-read:

1. `JETNITY_START_HERE.md`
2. `.jetnity/operating-mode.json`
3. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
4. `docs/ADMIN_ACCOUNT_UNGATED_RESIDUAL_PRECHECK_1_REPORT_2026-09-28.md`
5. TL FINAL PASS on PR #610, review `5345097798`
6. `components/admin/security/SecurityWidget.tsx`
7. `lib/admin/ehrliche-zustaende.ts`
8. `app/api/admin/security/list/route.ts` as read-only reference
9. existing security coverage/taxonomy tests and Admin load-state helpers.

Re-fetch current main/open PRs/active writers before material work.

## 3. Product truth contract

Distinguish these states:

- payload empty: no recorded rows were returned in the bounded read window;
- payload non-empty + filter no match: recorded rows exist, but none match the current filter;
- payload length at the current maximum: the table may be bounded/truncated and must not imply completeness;
- read failure: unknown/unavailable, never a false empty state.

Do not weaken the existing banner that explains incomplete ingestion. A zero remains only "zero recorded rows in this bounded read", never "nothing happened".

## 4. Acceptance cases

1. Empty successful payload keeps the current honest period-empty message.
2. Non-empty payload plus unmatched filter renders a dedicated "no matches for this filter" message.
3. Clearing/changing the filter restores matching rows without altering source data.
4. A successful result with exactly the current list bound (200) visibly states that only up to 200 rows are shown and the view may be incomplete.
5. A result below the bound does not claim truncation.
6. Existing 24h KPI labels remain "Aufgezeichnete ..." and are not relabelled as complete incident truth.
7. Load failure remains failure/unavailable, not empty.
8. IP block remains explicitly not enforced.
9. No event producer/INSERT/ingestion/retention/enforcement is added.
10. No change to role/AAL/capability behavior.

## 5. Before/after evidence

Before implementing, reproduce the filter-empty wording defect with the actual `SecurityWidget` using synthetic data:
- at least one event in the payload;
- apply a filter with zero matches;
- capture the current message.

After implementing, prove:
- empty payload;
- unmatched filter;
- matched filter;
- 199 rows vs 200 rows boundary;
- failed read;
- no regression in KPI/coverage copy.

Synthetic data only. No real Production security events or personal data.

## 6. Exclusive write ownership

Allowed runtime writes:
- `components/admin/security/SecurityWidget.tsx`
- `lib/admin/ehrliche-zustaende.ts`

Optional if strictly necessary for testability:
- one narrow helper/test under `lib/admin/security/`
- focused audit/test script reusing existing tooling.

Read-only reference only:
- `app/api/admin/security/list/route.ts`

Do NOT edit:
- any #612 path;
- `components/admin/payments/PaymentsCenter.tsx`;
- any security event producer/SQL/migration;
- block/unblock routes;
- Auth/RLS;
- package/lockfile/workflows;
- global continuity.

If a correct fix requires changing the API contract or DB, STOP and report instead of expanding scope.

## 7. Hard boundaries

No:
- finding 5.2 ingestion closure;
- security event INSERT writer;
- retention rule;
- IP-block enforcement;
- provider/payment/spend;
- Production DB/Auth/RLS mutation;
- public indexing/launch;
- new dependency;
- C1/C3 implementation;
- follow-up slice.

## 8. Validation

At minimum:
- focused regression tests;
- existing security taxonomy/coverage tests;
- actual-component controlled interaction evidence;
- full repository-required tests;
- typecheck;
- lint;
- Admin API protection check;
- schema/dead/export/dependency hygiene;
- Production build.

Before STOP:
- re-read live main;
- confirm branch ahead/behind and no collision with PR #612;
- exact diff self-review;
- document limitations.

Exact-head CI/Auth/Vercel remain Technical-Lead gates.

## 9. Agent contract

Logical agent: **Jetnity admin security filter honesty 1**
Generation: **1**
Required model: **Grok 4.7 High Fast**
No Auto / no substitution.

Cursor is sole runtime writer for this slice.
Cursor does not Ready, merge, or start another slice.
Review fixes stay in the same logical agent/session.

**STOP FOR INDEPENDENT CHATGPT TECHNICAL-LEAD CODE + INTERACTION REVIEW.**
