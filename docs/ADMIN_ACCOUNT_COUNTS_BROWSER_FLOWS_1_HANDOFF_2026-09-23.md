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
- Previous reviewed head: `9fc883927a001f9e7785a7b63f369e15144d6f2d`
- TL re-review `5292928238`: CHANGES REQUIRED (remaining B1–B3)
- Diagnostic: `#558` comment `5797455875` (evidence only)

## What was delivered

Same-session remaining B1–B3 correction of the awaited Playwright consumer for G6–G19. UI denials now require ready application copy on the exact local origin/path plus a valid navigation response. Anonymous/no-EXECUTE and invalid-JWT stay distinct source-contract kinds. The JS payload port is compared to the unchanged accepted TypeScript parser through locked `tsx`. Auth capture binds actor + session epoch and invalidates pending json after detach. A timeout marks the run terminal, refuses later resource-using gates, and still allows bounded cleanup of late handles. Historical receipts `aacbf1-20260923T123800Z` and `aacbf1-review-fix-b1-b4-20260923T133051Z` were not overwritten.

Controlled-context unit tests: **28/28 PASS**. They are **not** real UI/Auth/MFA execution.

## First unread action for Technical Lead

1. Independent exact-head re-review of **this frozen head**. Cover remaining B1–B3: ready UI vs URL/absence, anonymous vs invalid-JWT plus accepted-parser equivalence, actor/session-epoch capture + pending invalidation, terminal timeout with late-handle cleanup and consumer sequencing.
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
