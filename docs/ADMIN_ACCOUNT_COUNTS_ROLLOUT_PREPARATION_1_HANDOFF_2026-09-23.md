# Admin Account Counts Rollout Preparation 1 — HANDOFF

Stand: 23. September 2026  
Für den nächsten unabhängigen Technical-Lead-Review. Nicht für einen neuen Produkt-Agenten. Same session continued after CHANGES REQUIRED on `79e5ec6dfa096c7ce19e7df40a4a403fc9f8fa30`.

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

## What was delivered

Local-only install/preflight/verify/revoke/rollback package composing the unchanged accepted producer and wrapper.

R1: shared exact identity contract (`sql/identity.sql`) used by classify + verify + rollback. Pinned `pg_get_functiondef` SHA-256, schema/wrapper/producer owners, ACL and executor-sensitive default privileges are part of `identity_core_ok`. Adversarial body/owner/ACL/schema/ADP/dependency drift is refused and not repaired.

R2: `REVOKED_EXACT` allows this package to remove objects after its own REVOKE when identity stays exact. Other drift stays refused. No CASCADE. Sentinel preserved.

93/93 disposable proofs on PostgreSQL 16.15. German PO packet distinguishes PREPARED / TESTED / NOT RUN / BLOCKED. Banned/disabled privileged callers remain a later-live **NO-GO**.

## First unread action for Technical Lead

1. Independent exact-head re-review of this preparation PR only (R1/R2).
2. Record exact-head CI/Auth/Preview in the PR conversation after this freeze; a new head invalidates older gates including `79e5ec6d`.
3. Do not merge. Do not mark Ready. Do not start a follow-up slice from Cursor.
4. Parallel browser-acceptance lane stays independent; synthesize later. Preparation has first integration priority if independently acceptable.
5. Banned/disabled privileged-caller gap is a **NO-GO** for later exposure, not a residual to ignore, and was not “fixed” in this PR.

## Do not do

- Hosted SQL / account read
- Production or Preview enablement
- Sync/rebase/merge/force onto newer main without an exact later TL instruction
- Rewrite accepted producer/wrapper/Auth to hide the banned-status gap
- Import the sibling browser branch
- Treat local 16.15 as Production 17.6
- Treat green local 93/93 or later CI as Technical-Lead PASS
