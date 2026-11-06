# Official Truth Current Owner Status Local Proof 1
Date: 6 November 2026, Europe/Zurich. Tracking: #1139; parent #917.
Baseline: main `9850a78591c5cb05d05892c14d6db078f023d1a3`; mode NORMAL.
Single implementation writer: **Jetnity Official Truth Current Owner Status Local Proof 1 — Codex Generation 1**. Cursor remains unavailable; this is a Codex implementation task, not a claimed Cursor session. Root Technical Lead independently reviews and alone decides PASS/Ready/merge.

## Purpose and bounded authority
Continue #1139's already commissioned local proof/design preparation. Demonstrate the actual current source-helper behavior using the final `public.profiles` override, correcting the coverage gap of historical #1137. This is diagnostic test code and design documentation ONLY. A passing test of the existing unsafe behavior is explicitly a **diagnostic proof / RELEASE NO-GO**, never a secure-authorization PASS.

## Allowed paths
- New `lib/readiness/official-truth-current-owner-status-local.test.ts`.
- This task/evidence document `docs/OFFICIAL_TRUTH_CURRENT_OWNER_STATUS_LOCAL_PROOF_1_2026-11-06.md`.
No existing test, migration, runtime, package, workflow, policy or global status file may be modified.

## Required implementation and acceptance
1. Reuse existing `findLocalPgBins` / `startLocalProofCluster`; owned disposable local Unix-socket cluster only. No connection URL or inherited remote configuration. Explicit honest SKIP if native binaries unavailable.
2. Load unchanged exact source DDL for `rollenrang` and `hat_rolle_mindestens` from 20260817100000, **final `aktuelle_rolle` from 20260817120300**, AAL2 from 20260827170000 and capability from 20261002154952. Add a source-inventory guard that fails if any later migration supersedes these selected definitions, preventing a stale helper fixture from silently claiming current coverage.
3. Synthetic auth helpers/roles/profile fixture must be plainly identified. Use current `profiles` (not creator_profiles), valid roles, NOT NULL and allowed active/pending/disabled/banned status semantics. Invalid status/NULL are constraint-rejection tests, not invented valid fixture rows.
4. Execute actual source helpers for active Owner+AAL2, pending/disabled/banned Owner+AAL2, missing profile, lower role, AAL1/missing AAL, untrusted metadata elevation and same-claims status changes. Record that current Owner+AAL2 remains true across the four real status values: this **reproduces the open P1**, does not approve the result.
5. Current source helper does not bind session_id. With the unchanged synthetic claim setup, demonstrate missing/unbound session_id does not add protection; do not claim a real revoked signed JWT, actual Auth ban, full auth.sessions semantics or hosted exploit was tested. No new prospective definer/roles/ACL authorization implementation.
6. Verify source capability remains invoker and anon RPC execution remains denied; no direct fixture profile grant to caller. Keep the test finite, deterministic and no-network.
7. Document the scoped future design: only Official Truth authority, current stored active status plus separately defined own-subject/session witness; no global role helper rewrite. Separate profile-status, Auth user-ban/existence and session/timebox conditions. Existing counts status pattern is guidance, not a cross-domain module dependency.
8. Required results: native current-chain test actually executes (not SKIP) in exact-head CI, full Typecheck/Lint/Tests/Build/Auth, independent source/diff review and exact-head Preview. Report native proof separately from authorization safety. Do not close #1139 from diagnostic evidence.

## Non-scope and protected gates
No Supabase calls, hosted queries, migration apply, real accounts/tokens, role/status/session changes, Auth/RLS/grant/secret/provider/cost changes, new schema or runtime witness. No new grants on private/auth tables. No copying/reimplementation/retry of held #1131/#1135. #917 Stage1 remains UNVERIFIED, Stage2 NOT_ATTEMPTED; no alternate readback or imported research. #985/#937 and provider/Cursor holds remain.

## Evidence and STOP
Writer must report exact head, changed files, source assumptions, actual tests vs unrun tests, limitations, independent review handoff and remaining Product-Owner gate. This workspace has no local PostgreSQL binaries; do not claim local execution or install new paid infrastructure. Native validation comes from the existing isolated CI environment.
**Do not mark Ready. Do not merge. Do not start a follow-up slice.** Immediate review corrections stay with this same logical writer/session. Stop after delivery for independent Technical-Lead review.