# Admin Account Counts Rollout Preparation 1 — Binding Task v1

Date: 2026-09-23
Status: TL AUTHORIZED PREPARATION / LOCAL EXECUTION ONLY / NOT PRODUCTION APPROVAL
Agent: **Jetnity admin account counts rollout preparation 1**
Generation: **1 — NEW dedicated session**
Required model: **Cursor Grok 4.6 High Fast / cursor-grok-4.6-high-fast**. No Auto or substitution.
Branch: `feat/admin-account-counts-rollout-preparation-1`
Exact baseline: **f0237baf8809e5528b5f73e918f0e37a7d9b4477**; operating mode NORMAL.
Record actual acknowledgement/session/footer/model evidence. Do not invent a UI rename.

## 1. Mandate and concrete outcome

PO: "Ok weiter. Wenn möglich mehrere Agenten einsetzen" after TL next-step selection #512 comment **5787415489**. This authorizes the preparation below, NOT installation on any hosted database or relaxation of hosted application guards.

Deliver a small, reviewable installation/verification/rollback package for the existing account-count feature, prove that package on disposable local PostgreSQL, and supply the precise later activation design and PO decision packet. This is NOT another general audit or redesign. Reuse closed #550/#552/#551/#553/#554. Never restart their agents.

Read AGENTS.md, JETNITY_START_HERE.md, TL/Cursor operating standard, multi-agent operating system and slice-planning standard, current checkpoint and latest #512 conversation. Startup prose about #551 pending is historical. Closure **5786315762** and #554 final closure **5786365883** supersede those writer pins.

Only two measures: presently existing registered accounts and their subset created during the previous fixed 720 hours, with original measured_at/window_start/definition. Test/internal/unconfirmed accounts remain included according to the accepted contract. No visitor, active-user, deduplicated-person, qualified partner-reach, conversion or revenue claim. No charts/export/tracking/provider calls.

## 2. Stable source contract

Use the exact baseline's accepted files unchanged:
- `scripts/db/admin-account-counts-1-candidate.sql`, SHA256 **dcf4d35d894975b3c36860454ca8b0714af11c243fdcef900159a9929ccd4420**.
- `scripts/db/admin-account-counts-1-bootstrap.sql`, SHA256 **0413821d7c75c76908dd437527d623fcbed59c524135adbf5e5974730e6f6ea2**; lightweight LOCAL fixture, not a real GoTrue schema or a Production installer.
- `scripts/db/admin-account-counts-delivery-1-rpc.sql`, SHA256 **13fa3fe280d76d42ca6b2a1dff12077edc3d44a599a22300e89dd5578d63a6fb**.
- `lib/admin/account-counts-delivery/contract.ts`, blob **6826eeea70aecc0507d05624daaeac47af0be9b8**; `parser.ts`, blob **6205ecbba621b048fff479856c5523fab5ec4f6d**.
- Read activation.ts, reader.ts, shared `lib/supabase/server.ts`, actual Admin component/page, `lib/auth/admin-guard.ts`, admin-access/AAL/roles and dependency SQL.
- Reuse reviewed isolation/lifecycle helpers from accepted local/HTTP proof where suitable. Do not build a second generic process framework.

A hash/contract mismatch is BLOCKED until TL resolves it, not permission to target other code. Keep all accepted source/test/evidence files read-only.

## 3. Exclusive write ownership

May ADD only:
- `scripts/db/admin-account-counts-rollout-preparation-1/` for bounded LOCAL-ONLY composition, preflight/verify/rollback SQL, runner/tests and a small manifest. No general remote executor. No dependency installation inside a remote path.
- `docs/ADMIN_ACCOUNT_COUNTS_ROLLOUT_PREPARATION_1_PLAN_2026-09-23.md` (including environment state machine, prerequisites and stop criteria).
- `docs/ADMIN_ACCOUNT_COUNTS_ROLLOUT_PREPARATION_1_PO_PACKET_2026-09-23.md` (German, concise, NOT a claim that approval has occurred).
- `docs/ADMIN_ACCOUNT_COUNTS_ROLLOUT_PREPARATION_1_{STATUS,HANDOFF,SELF_REVIEW}_2026-09-23.md`.
- `docs/evidence/admin-account-counts-rollout-preparation-1/` (small sanitized receipts only).

This TASK is immutable/TL-owned. No app/components/lib/types/checker/package/lock/CI/config/governance/central-status files; no automatic migration directory. No writes to the parallel browser-acceptance agent's paths. No copied product-source fork; compose exact existing sources and record hashes.

## 4. Installation and rollback acceptance

1. Inventory exact dependency signatures/definitions, schema and function owners, ACL/default privileges and managed-table protections. Derive from source plus the dated TL catalog evidence below; do not claim it is your own remote read.
2. Installation must be transactionally fail-closed with bounded locks/timeouts and pre/postconditions. Refuse unexpected pre-existing schema/function/owner/ACL/default-privilege drift instead of blindly CREATE OR REPLACE/revoking an unrelated shared schema. Explicitly distinguish fresh install, exact already-installed state, and incompatible state. Account for executor-sensitive ALTER DEFAULT PRIVILEGES and schema ownership; do not invent Production superuser privileges.
3. Preserve the accepted producer and wrapper semantics. No client SELECT on auth.users, new BYPASSRLS role, managed auth policy change, disabled RLS, service-role application read or jetnity_internal exposure. No new count arguments or filters.
4. Rehearse fresh installation, unchanged repeat handling, forced installation failure (no partial residue), unexpected existing object refusal, verification, rollback and reinstall on ONLY a new private disposable database. Use labelled synthetic data. Test both legitimate and denied callers without implying full browser/MFA evidence.
5. Rollback touches only objects demonstrably installed by this package with exact identity/signature/owner/definition/ACL checks and no unexpected dependencies. No DROP CASCADE, schema-wide wipe or role drop. Refuse drift/dependencies; preserve unrelated sentinel objects. Define separately immediate access revocation, application disable and eventual object removal. Disabling the UI is NOT revocation of the RPC permission, and PostgreSQL REVOKE PUBLIC must be explicit where needed.
6. Never run raw bootstrap on a hosted database. Keep package outside migration discovery and hard-reject hosted URLs/refs/inherited connection defaults. psql -X, private sockets, early ownership registration and confirmed process stop before cleanup remain binding. Tests must use bounded actual execution rather than source regexes alone.

## 5. Enablement design, not runtime activation

The current application is explicitly limited to development/test, loopback and absence of hosted markers, and its guard is bound to the shared client's captured URL. A flag cannot enable Production. Describe the smallest later change needed; do not modify activation.ts or any runtime module here.

Specify OFF, isolated test, candidate installed-but-not-exposed, and separately authorized Production states. Pin effective client target/project/environment rather than trusting a mutable independent flag; unknown/Preview/target mismatch remains OFF. Separate database exposure from UI enablement, define cache/visibility and failure behavior, fast disable, rollback order and post-rollout smoke. No broad allowlist or secret embedded in code.

Targeted unresolved authorization review is required: actual role-backed moderator+ AAL2, break-glass denial, deleted/anonymous/no-subject, profile.status banned/disabled and Auth ban/revocation distinctions. Current application role lookup selects role only; producer checks caller existence/deleted/anonymous plus capability/AAL. Determine exact real protection; do NOT assume a status field blocks access. Record any newly proven prerequisite as NO-GO for future exposure and the smallest proposed correction requiring separate TL task/PO gate where applicable. Do not alter global Auth/roles/capabilities or rewrite accepted product SQL to make your readiness table green. Existing default-off acceptance is not live authorization approval.

PO packet must distinguish PREPARED / TESTED / NOT RUN / BLOCKED; list exact prospective changes, user benefit, owner/ACL risks, operating costs (no invented bill/zero-cost guarantee), rollback and reserved approvals. Parallel browser evidence is pending until independently reviewed; do not manufacture its outcome or wait indefinitely for its branch. TL combines the two deliveries.

## 6. Fresh baseline evidence supplied by TL (23 September)

GitHub main f0237baf; CI **35798706913** jobs **106983875471 TLB /106983875787 Auth** completed/success on readback. Connected Vercel Production **dpl_FHHisK2NMkvRc3sbhjXsJTJA27sA**, READY exact main; no newer deployment returned in scoped read.

TL READ ONLY metadata transaction on Production **qscbgcdmivbbnzrcyegn**: PG17.6/UTC; reporting schema/inner function/public wrapper ABSENT; latest migration **20260917120000 account_visits**. auth.users owner=supabase_auth_admin, RLS=true, FORCE=false, policies0. Existing postgres NOSUPERUSER/BYPASSRLS with SELECT on auth.users. anon/authenticated/service_role lack jetnity_internal USAGE. No account rows/counts or credentials read. This evidence permits local modelling, not a remote connection. No Development project or hosted branch is authorized for your tests.

## 7. Multi-Agent Suitability and integration

Decision: **MULTI_AGENT across two disjoint lanes; SINGLE_AGENT within this package**.

This agent owns local rollout mechanics, environment design and PO packet. Parallel **Jetnity admin account counts browser acceptance 1, Generation1**, branch `audit/admin-account-counts-browser-acceptance-1`, owns only a local real-application browser harness/evidence on the SAME immutable baseline. Both reuse already-merged sources; neither imports the other's unmerged work. TL owns shared-contract decisions and final evidence synthesis.

No second SQL/product writer. No runtime ownership is assigned. Integration order: this preparation PR first if independently acceptable, then browser-evidence PR after exact TL-authorized accepted-main synchronization and re-gating. This is order, not permission to merge. Do not merge/rebase/reset/force/cherry-pick/sync newer main without exact TL instruction. Report drift. A failed browser preflight does not block a truthful local package delivery or permit hosted fallback.

## 8. Verification / reporting / stop

Run local SQL cycle/fault controls and applicable repository tests/hygiene without changing rules. Record actual versions, exact commands/exit codes, source manifest, outcomes and cleanup. Node/static/SQL/browser evidence remain separate. One freeze then fresh exact-head CI/Auth/Preview in PR comments; no status-only churn. New head invalidates old gates. Same-session immediate review fixes.

P0 no incident established; P1 prevention: remote contact, destructive rollback, privilege widening; P2 installation identity/repeat/failure and authorization; P3 local-vs-hosted/browser coverage. Do not inflate a local rehearsal into Production readiness.

Official docs: PostgreSQL17 DROP FUNCTION/SCHEMA and ALTER DEFAULT PRIVILEGES; Supabase local-development, securing-your-api and changelog. Verify installed versions; changelog.md fetch was unsupported, TL consulted HTML. No logs.all/new connector/extension/hosted upgrades in this task.

No real accounts/keys, provider calls, contracts/Terms, payment, production SMTP, sensitive-data expansion, tracking, indexing/domain/store/public launch, hosted schema/config/secrets changes, new infrastructure, plan or budget increase. Existing Cursor usage only; quota/cost balance unknown. Switzerland-first, Flight-first/provider-later, jetnity.com and existing OS/Guardian limitations remain.

**Do not mark Ready. Do not merge. Do not start another agent or follow-up slice. STOP FOR INDEPENDENT TECHNICAL-LEAD REVIEW.**
