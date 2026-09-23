# Admin Account Counts Browser Flows 1 — HANDOFF

Stand: 2026-09-23  
Für den nächsten unabhängigen Technical-Lead-**Re-Review**. Nicht für einen neuen Produkt-Agenten. Nicht für #556, #557 oder #558.

## Identity

- Agent: **Jetnity admin account counts browser flows 1**, Generation 1
- Session: `bc-9495c303-3b54-4a76-a467-665b3f1a8eb9` (SAME session)
- URL: https://cursor.com/agents/bc-9495c303-3b54-4a76-a467-665b3f1a8eb9
- Model required and actual: `cursor-grok-4.6-high-fast` (no Auto, no substitution)
- Observed display name: `Admin account counts browser flows`
- UI rename: **not performed**
- PR: #559 draft
- Branch: `test/admin-account-counts-browser-flows-1`
- Baseline / merge-base: `fa7f651c023eb361fb142cbb931bc702f3a3d213`
- Task v1 unchanged: `58afaa15d15dce87c180f4f0eb73b8dc248e896e`
- Frozen interface: §4 of `docs/ADMIN_ACCOUNT_COUNTS_LOCAL_RUNTIME_1_TASK_2026-09-23.md` at `0aa33e88a021756a5cee64a130d544122977880a`
- Previous reviewed head: `d12ec6e9637ff3cd66113c2540f1ae2418520f9d`
- TL review `5291538166`: CHANGES REQUIRED (B1–B4)

## What was delivered

Same-session B1–B4 correction of the awaited Playwright consumer for G6–G19. Assertions now use the accepted count parser, exact caller-status semantics, exact local-project Auth capture, true zero→one/+1 and active-restoration facts, bounded waits, ownership-stop after failed close/restore, secret-safe returned gates, and exclusive fail-closed receipts. Historical receipt `aacbf1-20260923T123800Z` was not overwritten.

Controlled-context unit tests: **22/22 PASS**. They are **not** real UI/Auth/MFA execution.

## First unread action for Technical Lead

1. Independent exact-head re-review of **this frozen head**. Cover B1–B4: HTTP/UI denial, success contract, Auth origin/session binding, G12/G16/budgets/ownership-stop, receipt privacy/exclusivity.
2. Do not treat helper/double PASS, Preview READY, or later CI as a browser PASS or whole-run PASS.
3. Integration order remains **#558 then #559** after a specific TL instruction naming the merged main SHA. Neither agent auto-syncs. #558 must fix its own `evidenceDir`.
4. Actual integrated browser execution is a later explicit TL gate. It is not authorized on the user's incoming Mac by this task.
5. Do not merge. Do not mark Ready. Do not start a follow-up slice from Cursor.

## Do not do

- Hosted SQL / account read / grant / apply / activation
- Production or Preview enablement of the statistics runtime
- Sync/rebase/merge/force/cherry-pick onto newer main without an exact later TL instruction
- Import unmerged #558 implementation, rewrite the §4 interface, or default `evidenceDir`
- Resume closed #556 as if it ran login→TOTP→Admin
- Treat quiet page requests as server-RPC silence
- Inject cookies, forged AAL2, `storageState` or Auth mocks labeled as real execution
- Start another agent or follow-up from Cursor
