# Jetnity – Admin Security Refresh Ordering 1 – TASK v1

Stand: 29. September 2026
Issue: #619
Branch: `fix/admin-security-refresh-ordering-1`
Canonical baseline: `main@6b267186bd8f8261b76583cc3a20af4ddc4fbf89`

## 1. Objective

Repair a bounded read-ordering defect in the existing Admin Security surface.

`SecurityWidget` performs:
- an initial refresh;
- polling every 15 seconds;
- manual refresh;
- refresh after successful block/unblock action.

Current `refresh()` has no request-order guard. If an older request finishes after a newer one, the older result can overwrite newer data or error truth.

Newer read intent must remain authoritative.

## 2. Parallel boundary

PR #616 owns Admin Users created-at honesty.

This slice must not touch:
- `app/(admin)/admin/users/page.tsx`
- `components/admin/UsersTable.tsx`
- any #616 helper/evidence path.

No overlap with #616 is expected.

## 3. Required reading

Before editing:

1. `JETNITY_START_HERE.md`
2. `.jetnity/operating-mode.json`
3. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
4. merged #614 Admin Security Filter Honesty closure
5. merged #618 Admin Security Blocklist Bound Honesty closure
6. `components/admin/security/SecurityWidget.tsx`
7. `lib/admin/ehrliche-zustaende.ts`
8. existing Admin load-state helpers and Security tests.

Re-fetch current main/open PRs/active writers and confirm no collision before material work.

## 4. Product truth contract

Each refresh has an ordering identity.

Once refresh B starts after refresh A:
- A may finish, but A cannot become authoritative;
- only the latest started refresh may change current data/error/loading-authoritative state.

A stale success must not clear a newer failure.
A stale failure must not hide a newer success.

Existing stale-data-on-failure behavior for the **current** request remains: if a current refresh fails after prior valid data exists, keep the prior data visible and show the current failure.

## 5. Acceptance cases

1. Initial read still runs once per ordinary production mount behavior.
2. Two overlapping reads A then B:
   - B success, then A success → B stays visible.
3. B failure, then A success → B failure stays authoritative; A cannot clear it.
4. B success, then A failure → B success stays authoritative; A cannot add an obsolete error.
5. Loading indicator tracks the latest authoritative read, not a stale completion.
6. Manual refresh continues to work.
7. Polling interval remains 15 seconds and does not produce a loop or request storm.
8. Successful block/unblock may still trigger a read refresh as today; write request contract is untouched.
9. #614 event filter/no-match behavior remains unchanged.
10. #614/#618 200-row event/blocklist bound notices remain unchanged.
11. Error/empty/unknown distinctions remain unchanged.
12. No event ingestion, enforcement, retention, Auth/RLS or database change.

## 6. Before/after evidence

Use actual `SecurityWidget` with synthetic fetch timing.

Baseline proof must reproduce at least one stale-response case:
- start A;
- start B;
- resolve B first;
- resolve A second;
- show that baseline A can overwrite B.

Fixed proof must cover:
- success/success inversion;
- newer failure vs older success;
- newer success vs older failure;
- loading state;
- no request storm;
- existing filter/bound semantics;
- no POST unless a specific block/unblock interaction case is intentionally tested, and if so use synthetic stub only.

No Production security data or mutation.

## 7. Exclusive write ownership

Allowed runtime write:
- `components/admin/security/SecurityWidget.tsx` — read refresh ordering only.

Optional:
- one narrow helper under `lib/admin/security/`;
- focused tests;
- bounded harness/evidence script using existing tooling.

Allowed slice docs/evidence:
- `docs/ADMIN_SECURITY_REFRESH_ORDERING_1_TASK_2026-09-29.md`
- STATUS / HANDOFF / SELF_REVIEW with same prefix
- `docs/evidence/admin-security-refresh-ordering-1/`

Do NOT edit:
- security API routes;
- block/unblock request contracts;
- SQL/migrations/Auth/RLS;
- filter/bound copy unless a strictly necessary mechanical reference update is required;
- users/payments paths;
- package/lockfile/workflows;
- global continuity.

If correct implementation requires a forbidden path, STOP and report.

## 8. Hard boundaries

No:
- security_events producer/INSERT;
- finding 5.2 closure;
- IP enforcement;
- retention;
- DB/Auth/RLS/Production mutation;
- provider/payment/spend;
- indexing/launch;
- new dependency;
- follow-up slice.

## 9. Validation

At minimum:
- focused request-order unit tests if helper exists;
- actual-component synthetic race harness;
- merged #614/#618 Security honesty tests;
- full repository-required tests;
- typecheck;
- lint;
- Admin API protection;
- schema/dead/export/dependency hygiene;
- Production build.

Before STOP:
- re-read main;
- confirm branch ahead/behind;
- prove no overlap with #616;
- exact diff self-review;
- document limitations.

Exact-head CI/Auth/Vercel remain Technical-Lead gates.

## 10. Agent contract

Logical agent: **Jetnity admin security refresh ordering 1**
Generation: **1**
Required model: **Grok 4.7 High Fast**
No Auto / no substitution.

Cursor is sole runtime writer for this slice.
Cursor does not Ready, merge, or start another slice.
Review fixes remain in the same logical agent/session.

**STOP FOR INDEPENDENT CHATGPT TECHNICAL-LEAD CODE + INTERACTION REVIEW.**
