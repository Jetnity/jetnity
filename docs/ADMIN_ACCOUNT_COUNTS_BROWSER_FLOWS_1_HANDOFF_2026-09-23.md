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
- Previous reviewed head: `9fb5ecbdf4a643696cc59b95857cedc5ad643e80`
- TL re-review `5293522604`: CHANGES REQUIRED (navigation Response only on the test double)
- Diagnostic: `#558` comment `5798281067` (evidence only)

## What was delivered

Same-session correction: document navigations now keep the actual awaited Playwright `goto`/`reload` Response and pass that current Response into UI assertions. `page.lastNavigation` / `page.lastResponse` are not used. Playwright-shaped G7 / G11 OFF / G14 paths prove a current 200 can progress while 500/404/null/stale/foreign-origin and blank/mismatched UI fail. Prior B2/B3 controls remain. Historical receipts were not overwritten.

Controlled-context unit tests: **29/29 PASS**. They are **not** real UI/Auth/MFA execution.

Accepted-parser equivalence (separate command):

`node --import ./scripts/server-only-test-register.mjs --import tsx scripts/e2e/admin-account-counts-browser-flows-1/parser-equivalence.ts`

## First unread action for Technical Lead

1. Independent exact-head re-review of **this frozen head**, especially current-navigation Response wiring on G7/G11/G14 and the other goto/reload transitions.
2. Do not treat helper/double PASS, Preview READY, or later CI as a browser PASS or whole-run PASS.
3. Integration order remains **#558 then #559** after a specific TL instruction naming the merged main SHA. #558 still owns R1/R2/R3/R5 and `evidenceDir`.
4. Do not merge. Do not mark Ready. Do not start a follow-up slice from Cursor.

## Do not do

- Hosted SQL / account read / grant / apply / activation
- Sync/rebase/merge/force onto newer main without an exact later TL instruction
- Import unmerged #558 implementation or invent Page properties on the runtime API
- Inject cookies, forged AAL2, `storageState` or Auth mocks labeled as real execution
- Start another agent or follow-up from Cursor
