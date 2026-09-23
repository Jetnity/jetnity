# Admin Account Counts Browser Flows 1 — HANDOFF

Stand: 2026-09-23  
Für den nächsten unabhängigen Technical-Lead-Review. Nicht für einen neuen Produkt-Agenten. Nicht für #556, #557 oder a completed #558 runtime session.

## Identity

- Agent: **Jetnity admin account counts browser flows 1**, Generation 1
- Session: `bc-9495c303-3b54-4a76-a467-665b3f1a8eb9` (SAME session)
- URL: https://cursor.com/agents/bc-9495c303-3b54-4a76-a467-665b3f1a8eb9
- Model required and actual: `cursor-grok-4.6-high-fast` (no Auto, no substitution)
- Observed display name: `Admin account counts browser flows`
- UI rename: **not performed**
- PR: #559 draft
- Branch: `test/admin-account-counts-browser-flows-1`
- Product baseline: `fa7f651c023eb361fb142cbb931bc702f3a3d213`
- Authorized main / merge-base: `86534228bad59d2951e5586400a93b524aac9cd1`
- Merge commit: `eced386af126dd50f73ff5605102ff7c14d86b5a`
- Task v1 unchanged: `58afaa15d15dce87c180f4f0eb73b8dc248e896e`
- Frozen interface: §4 of `docs/ADMIN_ACCOUNT_COUNTS_LOCAL_RUNTIME_1_TASK_2026-09-23.md` at `0aa33e88a021756a5cee64a130d544122977880a`
- Prior NAV acceptance: TL review `5294272571` on `3e5e5039` (bounded NAV only)

## What was delivered

Authorized exact-main synchronization after #558 CLOSED / MERGED / POST-MERGE VERIFIED. Merge of `86534228` into this existing branch, then consumer-only alignment to the now-main producer evidence contract:

- artifact names `${runId}-counts-desktop.png` / `${runId}-counts-mobile.png` / `${runId}-browser-flows-gates.json`
- exact G6–G19 output ids matching now-main `BROWSER_GATES`
- receipt `runId` + `productHead` identity; extra keys fail closed
- PNG screenshot profile IHDR/IDAT/IEND
- no rewrite of accepted runtime files; no merge conflicts

Controlled-context unit tests: **30/30 PASS**. They are **not** real UI/Auth/MFA execution.

Accepted-parser equivalence (separate command):

`node --import ./scripts/server-only-test-register.mjs --import tsx scripts/e2e/admin-account-counts-browser-flows-1/parser-equivalence.ts`

## First unread action for Technical Lead

1. Independent exact-head review of **this frozen post-sync head**.
2. Do not treat helper/double PASS, Preview READY, or later CI as a browser PASS or whole-run PASS.
3. Real integrated login→TOTP/AAL2→Admin remains a later explicit TL gate and is not authorized on the user's Mac.
4. Do not merge. Do not mark Ready. Do not start a follow-up slice from Cursor.

## Do not do

- Hosted SQL / account read / grant / apply / activation
- Rebase/force/reset/cherry-pick
- Rewrite accepted #558 runtime files
- Inject cookies, forged AAL2, `storageState` or Auth mocks labeled as real execution
- Start another agent or follow-up from Cursor
