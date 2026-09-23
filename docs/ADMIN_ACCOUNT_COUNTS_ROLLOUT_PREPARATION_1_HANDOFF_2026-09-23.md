# Admin Account Counts Rollout Preparation 1 — HANDOFF

Stand: 23. September 2026  
Für den nächsten unabhängigen Technical-Lead-Review. Nicht für einen neuen Produkt-Agenten. Same session continued after residual R1/R3 CHANGES REQUIRED on `9ad07d64066218ff87005581236f4987e117cf42` (review 5288692633).

## Identity

- Agent: **Jetnity admin account counts rollout preparation 1**, Generation 1
- Session: `bc-4bf6acab-25f3-4d63-9199-ac365b9c011a`
- URL: https://cursor.com/agents/bc-4bf6acab-25f3-4d63-9199-ac365b9c011a
- Model required and actual: `cursor-grok-4.6-high-fast` (no Auto, no substitution)
- Observed display name: `Admin account counts rollout preparation`
- UI rename: **not performed**
- PR: #555 draft
- Branch: `feat/admin-account-counts-rollout-preparation-1`
- Baseline: `f0237baf8809e5528b5f73e918f0e37a7d9b4477`
- Newer-main drift: none at persist
- Do not resume closed #550/#552/#551/#553/#554 sessions
- Do not import or restart #556

## What was delivered

Residual R1: exact ACL tuples (grantor/grantee/privilege/`is_grantable` + owner entries). `WITH GRANT OPTION`, unexpected default-ACL rows, and same-name public overloads are `INCOMPATIBLE` and left in place.

R3: staged install commits only as `REVOKED_EXACT` after in-transaction revoke. Granted local-test is labelled database-exposed. PO exposure gate is before the first hosted grant.

R2 revoke→removal preserved. 136/136 disposable proofs on PostgreSQL 16.15. Banned/disabled privileged callers remain a later-live **NO-GO**.

## First unread action for Technical Lead

1. Independent exact-head re-review of this preparation PR only (residual R1 + R3).
2. Record exact-head CI/Auth/Preview in the PR conversation after this freeze; a new head invalidates `9ad07d64`.
3. Do not merge. Do not mark Ready. Do not start a follow-up slice from Cursor.

## Do not do

- Hosted SQL / account read / grant/apply
- Production or Preview enablement
- Sync/rebase/merge/force onto newer main without an exact later TL instruction
- Rewrite accepted producer/wrapper/Auth to hide the banned-status gap
- Import the sibling browser branch
- Treat local 16.15 as Production 17.6
- Treat green local 136/136 or later CI as Technical-Lead PASS
- Call granted-RPC + UI OFF “unexposed”
