# Admin Transaction Read Filter State 1 — Handoff

Date: 2026-09-28
Issue: #611
Draft PR: #612
Branch: `fix/admin-transaction-read-filter-state-1`
Agent: **Jetnity admin transaction read filter state 1**, Generation 1
Session: `bc-4accb551-2954-4d10-bc22-eab9784512ef`
Model: `grok-4.7-high-fast` (Grok 4.7 High Fast, not Auto)

## Where this stands

The read-filter fix is implemented on Draft PR #612. It is not reviewed, not Ready, and not merged.

`origin/main` was `bed4847d7ad0d601b756e3d56011b8525f7aaa5b` immediately before the status commit. Implementation commit: `35de05ddb9023a446080894007fd58b0df14e8f5`. Re-read main, the branch tip, ahead/behind, and open PRs before review. A new head invalidates this handoff's implied gate.

## What changed

`TransactionsCard` now builds each list URL from an explicit snapshot (`q` trimmed, status, and cursor only for Mehr laden). A monotonic read clock drops older responses. A different filter clears rows and pagination before the replacement page arrives.

Helper: `lib/admin/payments/transaction-read-filter.ts`
Unit tests: `lib/admin/payments/transaction-read-filter.test.ts`
Harness: `scripts/admin-transaction-read-filter-state-1-verify.mjs`
Evidence: `docs/evidence/admin-transaction-read-filter-state-1/`

`RefundCard`, the refund route, the list route, payment schema, Stripe, provider code, DB, Auth, RLS, dependencies, and workflows were not edited.

## Reviewer notes

- Reproduce the old defect only with `--baseline` on a checkout of the pre-fix component. On this head that probe must fail.
- The acceptance gate is `node scripts/admin-transaction-read-filter-state-1-verify.mjs`.
- The harness stubs `fetch` and is not signed-in Admin E2E.
- Superseded reads are ignored, not aborted.
- A status change commits the search text currently in the field, because the old `filtern()` did that. Mehr laden does not.
- C2 and C3 from #610 remain later residuals. Do not treat this handoff as permission to start them.

## Stop

Technical Lead reviews the exact branch tip. Cursor does not Ready, merge, or open the next slice.
