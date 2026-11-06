# Official Truth Owner Session Candidate 1 — R5
Date: 6 November 2026. Parent: #1139 / #917.
Status: CANDIDATE IMPLEMENTED / INDEPENDENT REVIEW AND NATIVE CI PENDING; no Technical-Lead PASS, no hosted or effective authorization change.
Baseline: `4ee93d9c073f88173ed4cc80e7c688104cae9601`.
Writer: **Jetnity Official Truth Owner Session Candidate 1 — Codex Generation 1**. One writer; root Technical Lead and separately named readers review independently.
Branch: `fix/official-truth-owner-session-candidate-1-20261106`.

## Owner request and finite result
The Product Owner explicitly requests concrete implementation toward completing the entry-requirements database and full feature now. R3 design and R4 Development metadata are already complete. Build an executable, locally proved correction candidate, rather than another test of the unchanged defect. This is independently authorized code-only preparation; it neither answers nor circumvents the refused #917 hosted readback.

Deliver exact offline SQL that closes the current own-account status/session witness gap and integrates an authoritative check into both reserve and recheck of the existing application-pilot RPC. Execute against an owned disposable PostgreSQL instance with synthetic identities. Preserve the original canonical migrations and all runtime/source/provider enablement.

References:
- [Current reconstruction](https://github.com/Jetnity/jetnity/issues/751#issuecomment-6688706004)
- [R3 authority/ACL/concurrency design](https://github.com/Jetnity/jetnity/issues/1139#issuecomment-6688003733)
- [R4 Development metadata and session-policy evidence](https://github.com/Jetnity/jetnity/issues/1139#issuecomment-6688370759)
- [Original refusal](https://github.com/Jetnity/jetnity/issues/917#issuecomment-6164202501)

## Scope and files
New candidate SQL below `scripts/db/official-truth-owner-session-candidate-1/`; a native test below `lib/readiness/` discovered by existing npm test; this document with task, implementation decisions, validation, limits, handoff and self-review.
Reuse existing owned-cluster/test infrastructure. Read source-current helper definitions and the exact Stage2 pilot migration; mechanically anchor unchanged source inputs/differences. Existing #1141 diagnostic must remain unchanged and continue to identify canonical source's unresolved P1.
Do not put candidate SQL in `supabase/migrations`, wire it to any deploy/apply script, add packages, change CI/workflows, or change global admin/role helpers.

## Required authority contract
- Keep `public.darf_official_truth_freigeben()` argumentless boolean SECURITY INVOKER. No caller-supplied uid/session/status/role authority.
- Add own-subject helper(s) only in new non-exposed `jetnity_ot_auth` schema. Explicit proposed function owner `postgres`, fixed safe search_path, fully qualified SQL, no dynamic SQL or returned user/session details. Actual target owner privileges/schema exposure remain unverified prerequisites.
- Only required USAGE on the new schema and EXECUTE on exact own boolean for authenticated; inventory existing service_role capability grant deliberately. PUBLIC/anon receive no execute; no client SELECT/UPDATE on auth tables; no new USAGE on existing private schema; no managed Auth RLS/role edits or fallback privilege path.
- One same trusted request subject must have stored Owner role, own profile exactly active, current AAL2, existing non-deleted/non-anonymous/non-currently-banned Auth user, valid own session id bound to that user, current valid session state. User/app metadata does not grant authority. Missing/inconsistent/malformed witnesses never authorize.
- Bound solely to reviewed Development policy: timebox 0, inactivity 0, single_per_user false, mfa_allow_low_aal false. Do not pretend existence alone covers other policies or Production. R4 found refreshed_at timestamp WITHOUT time zone; avoid inventing semantics. Record exact policy preconditions, not a second live configuration or caller-supplied policy authority.
- Explicit coherent VOLATILE/STABLE and PARALLEL classifications. Technical schema/ACL failures fail closed and stay diagnosable; no blanket catch-and-allow.

## Mutation/concurrency contract
The existing pilot checks capability before a waiting grant FOR UPDATE. Candidate must preserve payload/ownership/finite grant semantics and apply fresh authoritative validation after relevant waits for BOTH reserve and recheck.
Define an exact serialization point and bounded locking contract for own account/profile/session and relevant trip/grant state. Consider Auth-delete cascade/lock inversion, non-key status updates, session revocation, current clock expiry and isolation levels. Use fail-closed contention; do not use SKIP LOCKED for authority. No network while locks held. Locks/guard must not be hidden in the public stable boolean. Do not claim retroactive cancellation of already-serialized committed work.

## Mandatory native acceptance
1. Active own Owner+AAL2+valid own user/session works. Lower roles, missing user/profile/sub/session, malformed/foreign session, AAL1/missing/unknown, revoked/deleted/expired session, inactive profile pending/disabled/banned and Auth bans/deletion/anonymity fail.
2. Same claims active→disabled→active, session removal and actual synthetic user deletion fail closed; metadata elevation and direct RPC bypass fail. Self-reactivation is rejected by the relevant actual profile trigger contract.
3. Verify real SQLSTATE and catalog owner/security/volatility/search_path/ACL checks; unauthenticated/service-key-only/direct-table/private-guard calls cannot gain authority.
4. Two independent native connections reproduce precheck→grant wait→committed disable/revoke→resume, proving no grant consumption/success; test recheck too. Test expiry while waiting, conflicting row locks fail closed, delete/FK ordering, and positive serialization semantics. Use deterministic coordination and bounded timeouts.
5. Exercise the actual candidate pilot RPC against source-derived schema, not only a toy look-alike function or SQL text assertions.
6. Schema/permission errors yield no authorization; source drift is detected. Native tests must really run in CI. Local missing PostgreSQL is explicit SKIP, never PASS.
7. Whole existing CI/typecheck/lint/hygiene/build and Auth checks; exact-head Preview; root full diff/source review. If merged as inert code-only preparation, actual-main CI/Production closure is required.

## Hard non-scope / gate
No hosted SQL, migration/apply/readback, real accounts/sessions/tokens/PII, credentials, network source retrieval or accepted visa fact. No edits/copies from held #1131/#1135/#985/#937/#913. No retry/rephrase/reroute of #917 readback; support already SENT, no clearance evidenced. No real Auth/RLS/Production mutation, new live grants, provider/cost/launch/indexing change. No source/extractor registration, applicationPilot availability or requirementsProvider activation.
Separate existing service-role-only trusted-store RPC authority is unchanged and not claimed fixed.
This candidate does not close #1139/#917 or prove effective Dev/Production policy. Live baseline reconciliation, actual owner/ACL/trigger/FK/exposure/JWT checks and exact special PO gate remain prerequisites to any effective change. No automatic Stage2 after readback.

## Handoff / STOP
Report exact commit, files and diff, source anchors, executed vs skipped tests, residual risks and next action. Recheck live main before handing off. Self-review is not TL PASS.
**do not mark Ready; do not merge; do not start a follow-up slice.**
Stop after delivering this candidate for independent Technical-Lead review. Immediate review fixes stay with this same writer/session. A new head invalidates all previous gates.

## Implemented candidate and bounded design decision

The R5 writer has implemented the following three files; their integration and effective deployment are separate decisions:

| File | Purpose |
| --- | --- |
| `scripts/db/official-truth-owner-session-candidate-1/authority-candidate.sql` | New own-subject Boolean witness, preserved public INVOKER capability and private VOLATILE mutation guard. |
| `scripts/db/official-truth-owner-session-candidate-1/pilot-candidate.sql` | Existing pilot RPC with post-grant trip/authority validation and bounded grant wait. |
| `lib/readiness/official-truth-owner-session-candidate-local.test.ts` | Current-source anchors, actual native SQL/ACL behavior and coordinated concurrency tests. |

Both SQL files remain outside all canonical migration/apply paths. There is no runtime import, CLI command, remote connection, configuration activation, dependency or workflow change. The previous #1141 diagnostic remains unchanged and continues to mark the canonical helper chain as KNOWN P1.

### Identity, policy and privileges

The Boolean requires the same canonical UUID subject in trusted claims and `auth.uid()`, claim role `authenticated`, current claim AAL2, integer numeric future `exp`, a matching own Session with stored AAL2 and future/null `not_after`, an existing non-deleted/non-anonymous/non-currently-banned Auth user and own stored Owner/active profile. Missing/malformed/inconsistent inputs never authorize. SQL/type/permission failures propagate; no catch-and-allow exists. User/app metadata cannot elevate authority.

`own_active_session_v1()` is STABLE/PARALLEL UNSAFE and observes the statement snapshot/time. `public.darf_official_truth_freigeben()` remains argumentless, INVOKER and STABLE but becomes PARALLEL UNSAFE. CREATE OR REPLACE preserves its existing owner; its existing authenticated/service_role caller grants remain. A service-key-only claim does not satisfy the human session witness.

The new schema, Boolean and guard explicitly use proposed owner `postgres`; the candidate pilot explicitly runs as that owner. Authenticated/service_role obtain only new-schema USAGE and exact Boolean EXECUTE. The private mutation guard is executable only by its owner. PUBLIC/anon receive neither Boolean nor guard execution. No candidate grant changes any Auth table or existing private schema. The actual target owner's existing privileges, function ACLs, schema exposure and ownership remain unverified preconditions, not facts inferred from the fixture.

This candidate is tied only to the already evidenced Development policy: timebox 0, inactivity 0, single_per_user false and strict AAL. It does not implement alternate policies or infer `refreshed_at` timezone semantics; no second configuration authority was added. Current target policy must be reverified before effective use. [Supabase session documentation](https://supabase.com/docs/guides/auth/sessions) explains why row presence alone does not prove other configured lifetime policies.

### Mutation authorization and concurrency

The cheap Boolean precheck is not reusable authority. The existing real pilot grant lock is acquired first with a 3-second lock timeout. After that possible wait, the candidate revalidates and locks the current own Trip/revision using FOR SHARE NOWAIT, then the private VOLATILE guard locks **own Auth user → own Session → own profile** using FOR SHARE NOWAIT. The guard also bounds relation-lock waits to 2 seconds.

After those locks, a fresh clock defines the authorization instant and the guard rereads the complete current user/profile/session predicate, including both numeric claim expiry and Session expiry. Both reserve and recheck use this guard. Grant expiry is then checked using the current clock. No network occurs in the transaction. Locks persist until transaction completion. NOWAIT makes Auth-delete/FK inversions fail closed rather than wait while holding the pilot grant. Stronger isolation serialization errors propagate; previously serialized work is not retroactively cancelled by a later revocation.

The existing payload shape, finite grant semantics and returned fields are unchanged. The test compares the actual candidate pilot body against the anchored original plus the exact added post-lock block/timeout. Primary references: [PostgreSQL volatility](https://www.postgresql.org/docs/17/xfunc-volatility.html), [row locking](https://www.postgresql.org/docs/17/explicit-locking.html), [locking privileges](https://www.postgresql.org/docs/17/sql-select.html).

### Native proof scope and non-vacuity

The fixture reuses nine canonical Trip migrations, exact final role/AAL/capability bodies, the exact current profile status constraint, the exact profile-protection trigger body and its source rename, and the complete original Stage2 schema/RPC before applying the candidate. Sixteen canonical input blobs are pinned; conservative later-DDL guards cover selected helpers, pilot, profile trigger and grant table. This is not a general SQL parser, dynamic-SQL detector or whole deployed ACL replay.

Managed Auth rows, enum/FK behavior and privileges are synthetic. Profile ON DELETE CASCADE is anchored to the baseline source; the managed Session FK remains an explicit fixture assumption. The proposed `postgres` fixture role is **NOLOGIN/NOSUPERUSER**, with explicitly stated local table grants and BYPASSRLS; this does not prove the real target has those privileges. The role-escalation negative uses a separate synthetic non-superuser authenticator with only authenticated membership and checks session_user/current_user; using the bootstrap superuser session there would be vacuous.

Tests cover active-owner success, same claims after status/session/user changes, all lower roles, missing/foreign/malformed/expired witnesses, Auth ban/deletion/anonymity, direct RPC/ACL failures, real privilege removal and schema loss, and metadata elevation while the account still owns the valid Session. Self-reactivation reaches the actual trigger: a no-op own UPDATE first proves row accessibility; changing own status/role must then raise 23514.

Concurrent tests observe the actual waiting PID, blocker PID and Lock state before committing invalidations. Reserve and recheck are both exercised after committed disable/revoke/ban, Session or numeric claim expiry, Trip owner/revision change and grant expiry. Grant expiry is proven still future after the wait is observed. Successful NULL-return transactions **commit before no-consumption readback**; error paths roll back. The suite also exercises non-key row-lock conflicts, real lock timeout, actual synthetic Auth-user FK cascade inversion, repeatable-read/serializable 40001 and locks held after RPC return through commit.

### Writer validation and handoff

- Source snapshot: main `4ee93d9c073f88173ed4cc80e7c688104cae9601`; original 75 migration copies independently blob-checked by root; selected sixteen hashes also verified by the new test.
- Local Node 24 syntax/transpilation and the source/candidate-body guard **PASS**.
- Local native test **SKIP: PostgreSQL binaries unavailable**. No native acceptance, full typecheck/lint/build or CI PASS is claimed by this local run. The initial static run caught a JavaScript replacement-string dollar-delimiter error; it was corrected before publication and reran green.
- Full exact-head CI must actually execute the native parent and all native subtests. Root independently checks original logs, Preview, all changed files, open threads, and any new main drift. Author self-review is never Technical-Lead PASS.
- Pre-publication root/reviewer findings corrected in this same writer session: source drift coverage, genuine non-superuser SET ROLE negative, commit-before-readback for NULL cases, observed-valid grant expiry and own-session metadata elevation.

**Effective release remains NO-GO.** This executable source-bound candidate does not close #1139/#917 or establish real JWT validation, installed Dev/Production functions, actual Auth lifecycle/FK/ACL/exposure, accepted source identity or any visa answer. The specific #917 platform refusal and separate #1131/#1135 refusals remain intact. No hosted query or mutation was made.

The exact next implementation gate is independent review and actual native CI execution of this candidate. After inert integration, legitimate clearance and unchanged #917 readback are still needed before a target-bound correction package and the special PO gate for an effective database/Auth change. No automatic Stage2/Official Truth activation follows.

**Writer STOP for independent review. No Ready, merge or follow-up authority.**

