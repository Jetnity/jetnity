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

## Implementation handoff — diagnostic only
PR [#1141](https://github.com/Jetnity/jetnity/pull/1141), branch `test/official-truth-current-owner-status-proof-20261106`. Logical writer: **Jetnity Official Truth Current Owner Status Local Proof 1 — Codex Generation 1**; Codex task session `/root/current_owner_proof_writer`. No Cursor session was started. The exact final head and later native receipts must be read from the PR; this document does not claim its future independent review or merge.

One new test file has two tests:
- a source-selection check that runs without PostgreSQL;
- a native diagnostic using the existing owned, disposable socket-only PostgreSQL cluster.

### Bound source and fixture
The five selected functions have seven definitions across the baseline's 75 canonical migration files:

| Selected function | Final definition used |
| --- | --- |
| `rollenrang(rolle text)` | `20260817100000_rollenmodell.sql` |
| `aktuelle_rolle()` | **`20260817120300_generisches_profil.sql`** |
| `hat_rolle_mindestens(minimum text)` | `20260817100000_rollenmodell.sql` |
| `aktuelles_admin_aal2()` | `20260827170000_admin_aal2_data_plane_alignment.sql` |
| `darf_official_truth_freigeben()` | `20261002154952_official_truth_owner_reviewer_capability_1.sql` |

Their original DDL bodies are loaded unchanged. The scanner checks every canonical migration for CREATE FUNCTION and CREATE OR REPLACE FUNCTION, including quoted/unqualified names, case and whitespace variations, and new overloads. Later targeted ALTER/DROP also requires explicit review. Comments are excluded. This is a conservative **definition-selection guard**, not a PostgreSQL parser or proof against arbitrary constructed dynamic SQL.

The local fixture is deliberately minimal: synthetic roles, `auth.jwt()` / `auth.uid()`, and `public.profiles(user_id, role, status)`. The real final status CHECK is extracted unchanged from the profile migration; status is NOT NULL as in the baseline. Fixture role validity uses the real `rollenrang()`. This is not the full profiles table, its complete RLS/policy chain or the real Auth schema. No `auth.users` / `auth.sessions` table is installed; no deletion/FK, Auth-ban or session-lifetime behavior is claimed. In the actual profile contract the user foreign key cascades on deletion, so this proof invents no surviving orphaned profile.

The test loads the selected source grants and checks that the capability is SECURITY INVOKER, anonymous RPC execution is denied and authenticated direct profile SELECT is denied in this fixture. It does **not** replay the whole ACL history: for example, `20260817100300_rechte.sql` contains a dynamic blanket function REVOKE followed by explicit grants. Neither this source scanner nor the selected local grants prove full-migration or hosted ACL parity.

### Native diagnostic expectations, not a corrected permission policy
At writer delivery, the native test remains **unrun locally** and awaits exact-head CI. These are its explicit expected observations from the unchanged source:

| Case | Expected current-source result | Meaning |
| --- | --- | --- |
| Owner + AAL2 + active | true | Current role/AAL behavior only; no full authority acceptance |
| Owner + AAL2 + pending, disabled or banned | **true** | **Known P1 reproduced; RELEASE NO-GO** |
| Same synthetic claims; active → disabled → active | true on each separate call | Stored status currently does not affect this capability |
| Admin/user, missing profile or missing subject | false | Existing role/identity denial retained |
| Owner with AAL1, missing or unknown AAL | false | Existing AAL2 denial retained |
| Metadata role/AAL elevation | false | Metadata cannot replace stored role or top-level assurance |
| NULL or unknown status write | SQLSTATE 23502 / 23514 | Invalid fixture rows are rejected, not treated as valid statuses |
| Missing, unbound or malformed session_id | **true** with Owner+AAL2 | Current helper has no session binding under synthetic claims |
| Anonymous RPC/direct authenticated profile SELECT | SQLSTATE 42501 | Loaded local function/table privilege boundary |

The native test title and TAP diagnostics explicitly say **KNOWN GAP / RELEASE NO-GO**. Its green execution means the diagnostic observed the expected existing defect. It cannot satisfy #1139's final security acceptance, authorize a rollout, or turn an unsafe result into a desired regression contract. A future reviewed hardening must replace this diagnostic's expected-gap oracle with denial assertions; the source guard prevents a new migration from silently leaving the old helper composition under test.

### Verification actually performed by the writer
- Repository input copies: all 75 canonical migration files at baseline `9850a785…` read; 75/75 local copies matched their Git blob identities.
- Local Node 24 TypeScript syntax stripping and test execution against those source copies: **source-selection test PASS; native test explicitly SKIP** because PostgreSQL binaries are unavailable. This was a transient JavaScript transform with only the local import extension adjusted, not the repository's full TypeScript build.
- Six temporary source-guard challenges: unqualified CREATE, quoted multiline CREATE OR REPLACE, overload, ALTER and multi-function DROP each refused; comments-only declarations ignored. Temporary challenge file removed.
- **Not run locally:** native PostgreSQL, project typecheck, project lint, full test suite, hygiene or Production build. No installation or new infrastructure was used.
- Required exact-head native CI and protected Preview remain pending at this handoff. The root Technical Lead must verify native execution is not skipped before accepting this test-only slice.

### Concrete future design and separate gate
The next effective fix should remain scoped to **Official Truth authority**. Preserve the global `aktuelle_rolle()`, the general Admin guard and unrelated capabilities. Reuse the existing Account-Counts *pattern* of an own-profile, fail-closed active-status witness; do not import Counts-specific modules into Official Truth.

The desired authority must separately establish:
1. existing stored Owner role and current AAL2;
2. the caller's own stored profile status exactly `active`;
3. a present, eligible Auth user, with deletion/anonymity/active Auth-ban semantics explicitly defined;
4. the signed session_id bound to that same user's current session, with required expiry/timebox/inactivity semantics;
5. refusal for missing, inconsistent or unreadable evidence, also on the direct database RPC path.

Profile status, Auth-user state and session validity are distinct checks. A session row merely existing does not prove all configured lifetime/inactivity rules. [Supabase sessions](https://supabase.com/docs/guides/auth/sessions) and [JWT claims](https://supabase.com/docs/guides/auth/jwt-fields) describe the session_id relationship and limits; the hosted settings/schema were not inspected here.

The current invoker function cannot be assumed to read protected Auth tables. The future gateway/schema/function-owner/ACL design must be explicit and independently reviewed before any effective change. Do not add a blanket client SELECT on auth tables, broaden `private` schema USAGE, silently convert the capability to SECURITY DEFINER, trust caller-selected identities or rely only on a UI guard. This task implements **none** of those prospective privileges or witnesses.

**STOP:** the author has delivered diagnostic code and scoped design only. #1139 remains OPEN; effective Auth/RLS/hosted changes require the separately reserved Product-Owner gate and their own verification. #917 Stage1 remains UNVERIFIED / Stage2 NOT_ATTEMPTED. #1131/#1135 remain separate stops. No Ready, merge, automatic follow-up, accepted source, database import or provider activation.

