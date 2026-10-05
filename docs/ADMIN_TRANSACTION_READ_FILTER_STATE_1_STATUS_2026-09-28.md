# Admin Transaction Read Filter State 1 — Status

Date: 2026-09-28
Issue: #611
Draft PR: #612
Branch: `fix/admin-transaction-read-filter-state-1`
Task: `docs/ADMIN_TRANSACTION_READ_FILTER_STATE_1_TASK_2026-09-28.md`
Status: **IMPLEMENTATION DELIVERED / NOT A PASS / NOT MERGED / NO FOLLOW-UP SLICE**

Cursor-Agent: **Jetnity admin transaction read filter state 1**, Generation 1.
Required model: **Grok 4.7 High Fast**.
`originalModelName=grok-4.7-high-fast` from cursor-cloud `run-info`. Not Auto.
Session: https://cursor.com/agents/bc-4accb551-2954-4d10-bc22-eab9784512ef (`bc-4accb551-2954-4d10-bc22-eab9784512ef`).

## Live baseline

Fetched `origin/main` at the start and again before this status. Both reads were `bed4847d7ad0d601b756e3d56011b8525f7aaa5b` (#610). This branch was 1 ahead / 0 behind that main before the implementation commit (task commit `44fd0798`). No other open PR is the writer for this file. Historical Drafts #40 and #39 are not owners.

Implementation commit: `35de05ddb9023a446080894007fd58b0df14e8f5`.
Exact review head: re-read `git rev-parse HEAD` on this branch. This status is part of that tip. Author self-review is not a Technical-Lead PASS.

## Result

The visible transaction filter is what the list request uses.

- A status change passes the new status into that gesture's read. It no longer reuses the previous render's `status`.
- Search is trimmed. Filtern and Enter commit the visible `q` and the visible status.
- Mehr laden uses the last committed snapshot plus the current cursor. An uncommitted search draft is not sent.
- A newer gesture increments a read clock. An older response cannot replace rows, cursor, done, or the error of the newer read.
- A changed filter clears the previous rows and cursor before its first page is authoritative. A failed newer read stays a failure.
- Empty, pending, error, and retry stay distinct. Local amounts stay `CHF`. Refund copy was not edited.

## Delivery

Handoff: `docs/ADMIN_TRANSACTION_READ_FILTER_STATE_1_HANDOFF_2026-09-28.md`
Self-review: `docs/ADMIN_TRANSACTION_READ_FILTER_STATE_1_SELF_REVIEW_2026-09-28.md`
Evidence: `docs/evidence/admin-transaction-read-filter-state-1/`

## Checks run on this working tree

| Check | Result |
| --- | --- |
| Baseline harness `--baseline` before the fix | Exit 0. Stale `paid` and dropped in-flight `failed` reproduced. `before.json`. |
| Baseline harness `--baseline` after the fix | Exit 1. The `paid` gesture now sends `status=paid`. Expected probe. |
| Fixed harness | Exit 0. 10 cases. `after.json`. |
| `npm test` | 4032 pass, 0 fail. |
| `npm run typecheck` | Pass. |
| `npm run lint` | 0 errors, 144 warnings. The new initial-load effect does not add a warning. Overview and refund `any` warnings in the same file were already there and were not edited. |
| `npm run check:api-schutz` | 12 admin routes, all `requireAdminApi()`. |
| `npm run check:schema-bezug` | Pass. Existing local/unapplied account-count RPC note only. |
| `npm run check:dead` | 0 unreached. |
| `npm run check:exports` | 0 unused. |
| `npm run check:deps` | 0 unused. |
| `npm run check:setup:ci` | Pass, with the existing missing `.env` warning. |
| `npm run check:operating-mode` | Pass. Mode is `NORMAL`. |
| `npm run build` | Pass. Next.js 16.3.3 compiled and generated 25 static pages. |

`auth:pruefen` was not run. This slice does not change Auth. That CI job needs repository secrets.

## Stop

Independent ChatGPT Technical-Lead exact-head code and interaction review. Cursor does not Ready or merge. C2 and C3 were not started.
