# Official Truth Owner Session Candidate 1 — R5
Date: 6 November 2026. Parent: #1139 / #917.
Status: IMPLEMENTATION ASSIGNED; no Technical-Lead PASS, no hosted or effective authorization change.
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
