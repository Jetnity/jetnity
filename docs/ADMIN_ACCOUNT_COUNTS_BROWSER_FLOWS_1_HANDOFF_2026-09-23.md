# Admin Account Counts Browser Flows 1 — HANDOFF

Stand: 2026-09-23  
Für den nächsten unabhängigen Technical-Lead-Review. Nicht für einen neuen Produkt-Agenten. Nicht für #556, #557 oder #558.

## Identity

- Agent: **Jetnity admin account counts browser flows 1**, Generation 1
- Session: `bc-9495c303-3b54-4a76-a467-665b3f1a8eb9`
- URL: https://cursor.com/agents/bc-9495c303-3b54-4a76-a467-665b3f1a8eb9
- Model required and actual: `cursor-grok-4.6-high-fast` (no Auto, no substitution)
- Observed display name: `Admin account counts browser flows`
- UI rename: **not performed**
- PR: #559 draft
- Branch: `test/admin-account-counts-browser-flows-1`
- Baseline / merge-base: `fa7f651c023eb361fb142cbb931bc702f3a3d213`
- Task v1 unchanged: `58afaa15d15dce87c180f4f0eb73b8dc248e896e`
- Frozen interface: §4 of `docs/ADMIN_ACCOUNT_COUNTS_LOCAL_RUNTIME_1_TASK_2026-09-23.md` at `0aa33e88a021756a5cee64a130d544122977880a`
- Implementation persist: `e040fa9d`
- Unit-test persist: `a923f061`

## What was delivered

Complete awaited Playwright consumer code for G6–G19 against the frozen in-memory context. Each scenario uses runtime-owned `useApp`, `newBrowserSession` / `closeBrowserSession`, fixture controls and `rpcObserver`. Secrets stay in memory. Evidence is sanitized count-section clips and gate receipts only.

Controlled-context unit tests prove sequencing, abort, negative assertions, missing context, cleanup/restore and privacy. They are **not** real UI/Auth/MFA execution.

## First unread action for Technical Lead

1. Independent exact-head review of **this frozen head**. Cover `flows.mjs`, session/HTTP/observer consumers, unit doubles, and the honest NOT RUN boundary.
2. Do not treat helper/double PASS, Preview READY, or later CI as a browser PASS or whole-run PASS.
3. Integration order remains **#558 then #559** after a specific TL instruction naming the merged main SHA. Neither agent auto-syncs.
4. Actual integrated browser execution is a later explicit TL gate. It is not authorized on the user's incoming Mac by this task.
5. Do not merge. Do not mark Ready. Do not start a follow-up slice from Cursor.

## Do not do

- Hosted SQL / account read / grant / apply / activation
- Production or Preview enablement of the statistics runtime
- Sync/rebase/merge/force/cherry-pick onto newer main without an exact later TL instruction
- Import unmerged #558 implementation or rewrite the §4 interface
- Resume closed #556 as if it ran login→TOTP→Admin
- Treat quiet page requests as server-RPC silence
- Inject cookies, forged AAL2, `storageState` or Auth mocks labeled as real execution
- Start another agent or follow-up from Cursor
