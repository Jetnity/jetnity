# Admin Transaction Read Filter State 1 — Self-review

Date: 2026-09-28
Agent: **Jetnity admin transaction read filter state 1**, Generation 1
This is not a Technical-Lead PASS.

## Scope

Diff intent:

- `components/admin/payments/PaymentsCenter.tsx` — import plus `TransactionsCard` only
- `lib/admin/payments/transaction-read-filter.ts`
- `lib/admin/payments/transaction-read-filter.test.ts`
- `scripts/admin-transaction-read-filter-state-1-verify.mjs`
- `docs/evidence/admin-transaction-read-filter-state-1/`
- this status, handoff, and self-review

`RefundCard` still posts `{ payment_id, amount_chf, reason }` and still uses `ADMIN_EHRLICHE_TEXTE`. The harness opened the refund tab and recorded no POST. The list route was not edited. The server still applies `status` only when the query sends it.

## What I checked against the task

| Case | Evidence |
| --- | --- |
| A. `all → paid` and `paid → failed` send the new status | Fixed harness `all-to-paid-then-failed`. Before the fix, `before.json` showed the opposite. |
| B. Filtern, Enter, clear | `filtern-and-enter-and-clear` |
| C. Older in-flight response cannot win; B's failure stays B's failure; no storm | `inflight-older-cannot-overwrite`, `inflight-b-failure-hides-a`, `no-request-storm` |
| D. Mehr laden, cursor reset, stale page cannot append | `pagination-committed-and-stale-page` |
| E. Pending, empty, error, retry; local CHF; refund copy | `initial-all-omits-status`, `empty-error-retry-stay-distinct`, `refund-and-local-copy-unchanged` |

The baseline was run on the unfixed component before the edit. `before.json` is that run.

## Skepticism

1. The harness is Playwright plus a stubbed `fetch`. It does not sign in, does not pass `requireAdminApi`, and does not read `payments`. A green harness is not Admin E2E.
2. I did not abort the superseded `fetch`. The clock ignores its body. A slow first read can still reach the list route after the operator has moved on. That is one read per gesture, which the storm case counted as four, then quiet. Aborting would be a later refinement, not a second slice I started.
3. Dev `StrictMode` can run the initial effect twice. The second read wins; the first response is ignored. The harness does not mount StrictMode, so it does not demonstrate that double start. It also does not loop.
4. Same-filter Filtern keeps the current rows until the refresh returns, so a failed refresh can still say the visible rows are older. A different `q` or status removes those rows immediately. I chose that so a failed new filter cannot keep the previous filter's rows. The task's failure case is covered by `inflight-b-failure-hides-a`.
5. `npm run lint` reports 144 warnings and 0 errors. I did not clear the pre-existing overview effect warning or the refund `any`. Those lines are outside this edit.
6. `auth:pruefen` was not run. No Auth file changed, and the local environment has no Supabase secrets. I am not calling that check passed.
7. Traveller context does not apply. This list does not choose a citizenship, document, or route, and it does not collect one.

## Stop

I did not mark Ready, did not merge, and did not start C2, C3, or another slice.
