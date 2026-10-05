# Jetnity – Admin Transaction Read Filter State 1 – TASK v1

Stand: 28. September 2026  
Issue: #611  
Branch: `fix/admin-transaction-read-filter-state-1`  
Canonical baseline: `main@bed4847d7ad0d601b756e3d56011b8525f7aaa5b`

## 1. Objective

Repair the existing **read-only Admin transaction list** so the rows always correspond to the filter state visibly chosen by the operator.

This is the accepted C1 candidate from Admin + Account Ungated Residual Precheck 1 (#609/#610).

The existing backend status filter is already correct. The defect is client-side request state / ordering.

## 2. Verified baseline defect

Current `TransactionsCard` in `components/admin/payments/PaymentsCenter.tsx`:

1. renders with a current `status`;
2. status `onChange` calls `setStatus(next)`;
3. in the same event it calls `filtern()`;
4. `filtern()` calls the render-closure `load(true)`;
5. `load(true)` therefore still reads the previous `status`.

Example:
- visible filter changes `all → paid`;
- request from that gesture omits `status=paid`;
- UI shows `paid` while returned rows can be unfiltered.

The adjacent concurrency risk is also in scope:
- if filter/request A is in flight and the operator selects B, B must become authoritative;
- when A eventually resolves, A must not overwrite B's current list or leave B selected without a B request.

## 3. Required reading

Before editing, re-read live/current:

1. `JETNITY_START_HERE.md`
2. `.jetnity/operating-mode.json`
3. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
4. `docs/ADMIN_ACCOUNT_UNGATED_RESIDUAL_PRECHECK_1_REPORT_2026-09-28.md`
5. TL FINAL PASS on PR #610, review `5345097798`
6. PR #610 post-merge closure comment
7. `components/admin/payments/PaymentsCenter.tsx`
8. `app/api/admin/payments/list/route.ts` **read-only reference only**
9. existing Admin load/error helpers and relevant tests.

Re-fetch current `main`, open PRs, active writers and merge-base before material work.

## 4. Product / truth contract

The visible transaction filter is operator truth.

A list response may only become authoritative if it belongs to the current intended filter snapshot.

A filter snapshot includes at minimum:
- trimmed search `q`;
- status;
- pagination mode / cursor relevant to that request.

Do not silently reinterpret an older response as matching a newer visible filter.

Failure remains failure. Never turn a rejected/failed read into "Keine Transaktionen."

## 5. Acceptance cases

### A. Immediate status correctness

1. Initial `all` state may perform the existing initial load.
2. `all → paid` immediately requests `status=paid`.
3. `paid → failed` immediately requests `status=failed`.
4. The request triggered by the status gesture must never carry the previous status.

### B. Search + status snapshot

5. Pressing **Filtern** uses the currently visible trimmed `q` and currently visible status.
6. Pressing **Enter** in search uses the currently visible trimmed `q` and currently visible status.
7. Clearing search and filtering removes `q`; status remains correct.

### C. In-flight ordering

8. Hold response A in flight; select/filter B before A completes.
9. B must be requested or deterministically queued to run.
10. A completing after B was selected must not overwrite B's rows, cursor, done-state or error state as the authoritative current view.
11. If B fails, show B's failure; do not fall back to stale A rows as if they were current.
12. No infinite refetch loop or duplicate request storm.

### D. Pagination

13. "Mehr laden" uses the committed current filter snapshot plus the current cursor.
14. Changing q/status resets pagination/cursor/done before the replacement first page becomes authoritative.
15. A stale previous-page response cannot append into a newer filter's rows.

### E. Existing honesty and write boundaries

16. First-load pending, empty, error and retry states remain distinct.
17. Existing local transaction values are not relabelled as provider revenue.
18. `RefundCard` behavior/copy/request body remains unchanged.
19. No refund route, payment write, payment schema, provider, Stripe or money movement change.
20. Existing Admin authorization/capability behavior stays unchanged.

## 6. Before/after evidence

Before implementing, reproduce at least the primary stale-status defect using the actual `TransactionsCard` / `PaymentsCenter` component with controlled synthetic fetch responses.

After implementing, prove the acceptance cases above using:
- focused automated tests; and
- an actual-component controlled interaction harness for the status-change + delayed-response cases.

No real Production payments or personal data. All payment-list payloads must be synthetic. Do not invoke refund writes.

A browser/React harness may stub Next/fetch boundaries, but evidence must state that limitation. Do not claim signed-in Production Admin E2E unless separately authorized.

## 7. Exclusive write ownership

Allowed runtime write:
- `components/admin/payments/PaymentsCenter.tsx` — **TransactionsCard/read-filter portion only**.

Optionally, if it materially improves correctness/testability:
- one narrowly scoped helper under `lib/admin/payments/`;
- focused unit test(s) beside that helper;
- one bounded audit/test script reusing existing tooling.

Allowed slice docs/evidence:
- `docs/ADMIN_TRANSACTION_READ_FILTER_STATE_1_TASK_2026-09-28.md`
- `docs/ADMIN_TRANSACTION_READ_FILTER_STATE_1_STATUS_2026-09-28.md`
- `docs/ADMIN_TRANSACTION_READ_FILTER_STATE_1_HANDOFF_2026-09-28.md`
- `docs/ADMIN_TRANSACTION_READ_FILTER_STATE_1_SELF_REVIEW_2026-09-28.md`
- `docs/evidence/admin-transaction-read-filter-state-1/`

Do **not** edit:
- `RefundCard` implementation or its copy;
- `app/api/admin/payments/refund/route.ts`;
- `app/api/admin/payments/list/route.ts` (backend filtering is not the defect);
- Supabase migrations/RLS/Auth;
- payment/refund schema;
- Stripe/provider adapters;
- global Admin IA;
- package/lockfile/workflows unless TL explicitly expands scope;
- global continuity files from Cursor.

If the correct fix requires any forbidden path, STOP and report the dependency instead of expanding scope.

## 8. Hard boundaries

No:
- Production DB/Auth/RLS mutation;
- real payment/refund operation;
- provider contact/signup/terms/credentials/API calls/spend;
- Stripe/live payment activation;
- new dependency;
- public indexing/launch;
- unrelated Admin cleanup;
- C2/C3 implementation;
- next slice.

## 9. Validation

At minimum:
- focused new regression tests;
- relevant existing Admin/load-state tests;
- actual-component controlled interaction evidence;
- full repository-required test suite;
- typecheck;
- lint;
- Admin API protection check;
- schema/dead/export/dependency hygiene as CI requires;
- Production build.

Before STOP:
- re-read live main;
- confirm branch ahead/behind and collision state;
- exact diff self-review;
- document all limitations.

Exact-head GitHub Actions/Auth and Vercel are Technical-Lead gates after final push.

## 10. Agent contract

Logical agent: **Jetnity admin transaction read filter state 1**  
Generation: **1**  
Required model: **Grok 4.7 High Fast**  
No Auto / no substitution.

Cursor is the sole runtime writer for this slice.

Cursor:
- does not mark Ready;
- does not merge;
- does not start C2/C3 or another slice;
- uses the same logical session for review fixes.

Author self-review is not TL PASS.

**STOP FOR INDEPENDENT CHATGPT TECHNICAL-LEAD CODE + INTERACTION REVIEW.**
