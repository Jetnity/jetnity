# Official Truth Fact-Entry Role/Data-Plane Authority Guard 1 — Binding Task

Date: 2 October 2026
Issue: #760
Source audit: merged #749 / F9
Prerequisites: merged #755/F1, #757/F3, #759/F5
Baseline: `main@169b89def147891ed4685818d0db57ba9b88eb46`
Branch: `fix/official-truth-fact-entry-authority-guard-1`
Logical agent: **Jetnity Official Truth fact-entry role data-plane authority guard 1**
Generation: **1**
Required model: **Grok 4.7 High Fast** — not Auto.

## Purpose

Close the next confirmed #741 blocker from #749 F9 without creating an acceptance route.

A future Official Truth fact-entry or acceptance request must not be authorized merely because a generic admin surface opened. Break-glass is surface-only.

The future live path must pass one dedicated server-only guard that proves all of:

1. verified authenticated user and current AAL2 through the existing admin guard;
2. capability `official-truth-freigeben`;
3. `grant === 'role'`;
4. `reachesDatabase(decision) === true`;
5. user-scoped database capability `public.darf_official_truth_freigeben()` returns exactly boolean `true`.

Anything else fails closed.

## Supabase current-doc check

Technical Lead re-read the installed Supabase skill and current Supabase database-function guidance before dispatch.

Keep the already merged capability foundation unchanged:
- `SECURITY INVOKER`;
- explicit EXECUTE grants;
- no caller-supplied role/reviewer/AAL;
- no service-role authorization path.

Do not edit the existing migration in this slice.
Do not apply it.

## Existing truth to reuse

Application authority:
- `evaluateAdminAccess({ capability: 'official-truth-freigeben', ... })`
- `reachesDatabase(decision)`
- `CAPABILITY_MINIMUM['official-truth-freigeben'] === 'owner'`

Database authority:
- existing LOCAL/UNAPPLIED migration function:
  `public.darf_official_truth_freigeben()`
- it is true only for owner + current AAL2.

User-scoped client:
- `createServerComponentClient()`
- do not use a service-role/admin client.

Generated types:
- `types/supabase.ts` intentionally does not yet contain this LOCAL/UNAPPLIED RPC.
- do not hand-edit generated types.
- follow the existing narrow wrapper-client pattern used by Admin Account Counts when a repo-known RPC is not in current generated types.
- the narrow cast/wrapper must be isolated and documented; no general `any` spread.

## Target architecture

Preferred new module:

`lib/readiness/official-truth-fact-entry-authority-server.ts`

It must import `server-only`.

The module may expose:

### Pure decision seam

A small deterministic function that consumes already server-derived access and RPC result for focused tests.

It is NOT the live authority entry.

### Live server entry

A no-argument exported loader/guard, for example:

`loadOfficialTruthFactEntryAuthority()`

The live entry:
- accepts no caller-provided role, grant, reviewer, AAL, capability, user id, email, RPC result, environment snapshot or dependency override;
- calls `evaluateAdminAccess` itself with exactly capability `official-truth-freigeben`;
- explicitly checks `decision.allowed`;
- explicitly checks `decision.grant === 'role'`;
- explicitly checks `reachesDatabase(decision)`;
- only after those checks calls the user-scoped capability RPC;
- returns authorized only when the RPC data is exactly boolean `true`;
- never authorizes on break-glass;
- never authorizes on missing/unapplied RPC, RPC error, malformed data, null, false or exception.

## Result contract

Use a small fail-closed result shape.

Recommended success:
- `{ status: 'authorized', grant: 'role', capability: 'official-truth-freigeben' }`

Do not include email, user id, role string, AAL token or personal/session data unless proven necessary. F7 will own any later persisted authorized decision record.

Recommended blocked statuses may distinguish:
- access forbidden;
- access lookup failed;
- role grant required;
- database capability denied;
- database capability unavailable;
- database capability failed.

Do not echo database errors or sensitive values to the result.

## RPC wrapper

Use one exact user-scoped RPC:
`darf_official_truth_freigeben`

Requirements:
- no service-role client;
- no admin client;
- no raw SQL;
- no migration;
- no schema apply;
- no caller-selected RPC name;
- no caller-selected capability;
- no alternate fallback RPC;
- no retry that changes authority semantics.

Missing function codes such as the current LOCAL/UNAPPLIED state must fail closed as unavailable, not as allowed.

## Mandatory adversarial tests

At minimum prove:

1. role-backed capability + database capability true => authorized;
2. break-glass + database true fixture => blocked before RPC; RPC call count remains zero;
3. break-glass with AAL2 cannot authorize;
4. access denial => blocked before RPC;
5. access lookup/AAL failure => fail closed;
6. role-backed app access + DB capability false => blocked;
7. missing/unapplied RPC => blocked/unavailable;
8. RPC permission error => blocked;
9. RPC exception/network-like failure => blocked;
10. malformed/null/non-boolean data => blocked;
11. exact boolean true is the only DB success;
12. live loader has no arguments and no caller dependency injection;
13. live loader calls `evaluateAdminAccess` with exact capability `official-truth-freigeben`;
14. live loader explicitly uses `reachesDatabase`;
15. live loader uses `createServerComponentClient`, not service-role/admin client;
16. wrapper invokes only `darf_official_truth_freigeben`;
17. `types/supabase.ts` is unchanged;
18. no file under `app/` calls this guard yet;
19. no `regelKandidatAkzeptieren`, trusted Rule store or acceptance call exists in this module;
20. no request body/user metadata/email allowlist is an authority input;
21. `requirementsProviderAus() === null` remains unchanged.

## Allowed runtime/test files

Create:
- `lib/readiness/official-truth-fact-entry-authority-server.ts`
- `lib/readiness/official-truth-fact-entry-authority-server.test.ts`

May update only if a narrowly necessary test export/type is proven:
- none preferred.

Do not edit:
- `lib/auth/admin-access.ts`
- `lib/auth/admin-guard.ts`
- `lib/auth/roles.ts`
- `lib/supabase/server.ts`
- `types/supabase.ts`
- any migration
- any app/API route
- #755/#757/#759 runtime modules.

If one of those must change, STOP and report instead.

## Allowed architecture/docs

May update:
- `docs/OFFICIAL_TRUTH_RULE_ACCEPTANCE_TRUST_BOUNDARY_1_ARCHITECTURE_2026-10-02.md`
  only to bind future fact-entry/acceptance paths to this dedicated role/data-plane guard.

Create:
- `docs/OFFICIAL_TRUTH_FACT_ENTRY_AUTHORITY_GUARD_1_REPORT_2026-10-02.md`
- `docs/OFFICIAL_TRUTH_FACT_ENTRY_AUTHORITY_GUARD_1_HANDOFF_2026-10-02.md`
- `docs/OFFICIAL_TRUTH_FACT_ENTRY_AUTHORITY_GUARD_1_SELF_REVIEW_2026-10-02.md`

Do not edit global startup or Guardian Current-State files in this lane.

## Relationship to later work

This slice closes F9 as the dedicated server authority precondition.

It does NOT create a request route and does NOT call acceptance.

A future F7/F8/#741 gate must call this guard before any fact-entry/acceptance action. Bypassing it would reopen F9.

F7 owns freshness/server-witness/authorized decision semantics.
F8 owns the final canonical acceptance preconditions.
F2 remains a separate provenance/hand-built candidate blocker.

## Hard boundaries

No database migration/apply.
No Development or Production Supabase mutation.
No RLS/Auth/role/profile mutation.
No endpoint/API/Server Action.
No accepted Rule write.
No `regelKandidatAkzeptieren`.
No store call.
No provider/model/network call except the dormant user-scoped RPC when the live loader is eventually invoked by a later route; this slice itself must not invoke it against remote systems during tests/review.
No secret/env mutation.
No cost.
No public launch/indexing.
Do not implement #741.
Do not touch #626.

## Validation

- fetch latest main;
- finish 0 behind;
- focused guard tests;
- full `npm test`;
- typecheck;
- lint;
- production build;
- `check:dead`;
- `check:exports`;
- `check:deps`;
- `check:api-schutz`;
- `check:schema-bezug`;
- `git diff --check`;
- operating-mode guard;
- no remote Supabase access.

Stay Draft.
Do not Ready.
Do not merge.
Do not start F7/F8/#741.
STOP for independent Technical-Lead exact-head review.
