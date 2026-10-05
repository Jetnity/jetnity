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
- Original baseline: `87cdc1e6858ff0fb57481dd9c3d56fd618f1e03b`
- C1 integration baseline / merge-base: `4381d20bfaa7f60f140823cc311d44409934197a`
- Executable source baseline: `9cf7aedd8dd190b4764d8ac178e23d9f8b42c773`
- Task v1 unchanged: `99fa42dca4c46116498d0cc74ea7cd26e467b591`
- Addendum: C1 exact-main sync + minimal source compatibility
- Implementation persist: `bd44228d7ced523b85ff699b209fd42794900349`
- Harness repair persist: `1f38a9689b79af81d7fa0742e83f851ec264f3d1`
- Authorized C1 merge: `90c943d48e58fd48b308b7b27b147647c33795ef`
- Previous freeze (invalidated by C1): `9cf7aedd8dd190b4764d8ac178e23d9f8b42c773`
- Do not resume closed #555 or closed #556 sessions
- Do not rewrite historical #556 receipts

## What was delivered

Feature-local caller-status restriction on the unapplied producer and the existing account-counts reader. Only an existing, nondeleted, nonanonymous, role/capability + AAL2 caller with a persisted **active** profile may read the aggregates. Blocked/unknown/missing status fails closed before counts. Metric population and 720-hour/output contract stay identical.

New identity pins were taken from a clean disposable PostgreSQL 16.15 install of the new candidate. Historical #555 object identity is refused. Leftover #555 installs classify `INCOMPATIBLE` and are not rewritten in place.

## First unread action for Technical Lead

1. Independent exact-head review of the **C1 resulting frozen head** after this persist. Cover the complete resulting diff, including `caller-status.ts`, new helper pins, old-producer refusal, and fresh exact-head CI/Auth/Preview.
2. Do not treat `9cf7aedd` CI `35853481624` or `0e7cebe6` CI `35852662043` as gates of the new head.
3. #556 is merged as preflight fallback only. Historical browser receipts are not tests of this source. No final TL PASS is implied by author C1 tests.
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
