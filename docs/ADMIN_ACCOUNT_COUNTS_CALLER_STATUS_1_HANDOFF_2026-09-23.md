# Admin Account Counts Caller Status 1 — HANDOFF

Stand: 23. September 2026  
Für den nächsten unabhängigen Technical-Lead-Review. Nicht für einen neuen Produkt-Agenten. Nicht für #555 oder #556.

## Identity

- Agent: **Jetnity admin account counts caller status 1**, Generation 1
- Session: `bc-4bf98f13-10aa-4cff-af82-dee79ebc920c`
- URL: https://cursor.com/agents/bc-4bf98f13-10aa-4cff-af82-dee79ebc920c
- Model required and actual: `cursor-grok-4.6-high-fast` (no Auto, no substitution)
- Observed display name: `Admin account counts caller status`
- UI rename: **not performed**
- PR: #557 draft
- Branch: `fix/admin-account-counts-caller-status-1`
- Baseline: `87cdc1e6858ff0fb57481dd9c3d56fd618f1e03b`
- Task v1: `99fa42dca4c46116498d0cc74ea7cd26e467b591`
- Implementation persist: `bd44228d7ced523b85ff699b209fd42794900349`
- Do not resume closed #555 or active #556 sessions
- Do not import unmerged #556 work

## What was delivered

Feature-local caller-status restriction on the unapplied producer and the existing account-counts reader. Only an existing, nondeleted, nonanonymous, role/capability + AAL2 caller with a persisted **active** profile may read the aggregates. Blocked/unknown/missing status fails closed before counts. Metric population and 720-hour/output contract stay identical.

New identity pins were taken from a clean disposable PostgreSQL 16.15 install of the new candidate. Historical #555 object identity is refused. Leftover #555 installs classify `INCOMPATIBLE` and are not rewritten in place.

## First unread action for Technical Lead

1. Independent exact-head review of this caller-status PR only.
2. Record exact-head CI/Auth/Preview in the PR conversation after the frozen docs persist; a new head invalidates older gates.
3. Keep integration order: accept/integrate #556 first if ready, then this slice only after an explicit exact-main synchronization / compatibility re-pin instruction.
4. Do not merge. Do not mark Ready. Do not start a follow-up slice from Cursor.

## Do not do

- Hosted SQL / account read / grant / apply / activation
- Production or Preview enablement of the statistics runtime
- Sync/rebase/merge/force/cherry-pick onto newer main without an exact later TL instruction
- Import #556 scripts/e2e or docs/evidence
- Treat old #555 receipts or old browser receipts as tests of this new security code
- Treat local 16.15 as Production 17.6
- Treat green local proofs or later CI as Technical-Lead PASS
- Change global Auth/roles/MFA/session to make this feature green
- Declare Auth `banned_until` / session revocation fixed
