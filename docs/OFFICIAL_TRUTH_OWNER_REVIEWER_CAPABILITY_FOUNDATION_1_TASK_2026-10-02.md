# Official Truth Owner Reviewer Capability Foundation 1 — Binding Task

Date: 2 October 2026
Issue: #742
Baseline: `main@4a47190226d1d52bdb65374ad479393f0cdd0d4f`
Branch: `feat/official-truth-owner-reviewer-capability-foundation-1`
Logical agent: **Jetnity Official Truth owner reviewer capability foundation 1**
Generation: **1**
Required model: **Grok 4.7 High Fast** — not Auto.

## Technical-Lead R1 scope amendment — 2 October 2026

Independent Technical-Lead review `5394162809` found one governance issue on exact head `d3017b169a189baf322a9544bc819a0c4a8d7e23`: the approved capability changes the repository-wide `CAPABILITIES` inventory, and `lib/admin/analyst/system-health-insights.test.ts` contains a frozen expected list of those global capability names.

That test-only dependency is therefore now explicitly added to the allowed test scope:

- `lib/admin/analyst/system-health-insights.test.ts`

The only permitted change in that file is to keep the frozen global capability inventory aligned with the approved new capability and, if necessary, clarify the test name/comment so it still proves the Analyst does not invent its own capability.

No Analyst runtime file is allowed. No other scope expands.

The existing semantic change on R1 head is acceptable under this amendment. The author must update REPORT/HANDOFF/SELF_REVIEW so it is recorded as **R1-authorized**, not as a self-granted "Allowlist exception", then rerun all gates on the new exact head.

All other task requirements below remain binding.

## 1. Product-Owner authority

Issue #739 is CLOSED / APPROVE A.

Binding Product-Owner decision:
- add dedicated capability `official-truth-freigeben`;
- V1 minimum role `owner`;
- current AAL2 required;
- only normal role grant carries Official Truth authority;
- break-glass does not carry data-plane/acceptance authority.

Future directive #741 is separate and must not be implemented here:
Jetnity Copilot Pro shall later gain autonomous Official Truth approval through a separately versioned deterministic fail-closed Autopilot. Model output alone remains insufficient authority.

## 2. Purpose

Implement only the reusable **authority foundation**.

No Official Truth review endpoint.
No decision persistence.
No trusted fact.
No Rule acceptance call.
No real user-role mutation.
No remote Supabase apply.
No Production mutation.

## 3. Application capability

In `lib/auth/roles.ts` add exactly:

`official-truth-freigeben: 'owner'`

to the canonical `CAPABILITY_MINIMUM`.

Do not add a one-off `role === 'owner'` authorization path.

The existing capability model remains the sole application authority vocabulary.

## 4. Server/admin semantics

Do not modify `admin-guard.ts` or `admin-access.ts` runtime unless the existing generic capability path is proven incapable of representing this choice. If that happens, STOP and report instead of widening scope.

The existing semantics must remain:
- verified server user comes from `auth.getUser()`;
- capability role comes from `profiles.role`;
- current AAL2 is required by the existing admin guard;
- break-glass may open an admin surface but `reachesDatabase()` remains false;
- later Official Truth fact-entry/acceptance must require `grant === 'role'`.

Add/adjust pure tests so they explicitly prove:
- owner satisfies `official-truth-freigeben`;
- admin/operator/moderator/creator/user do not;
- break-glass can never become database authority for this capability;
- generic capability iteration still matches minimum roles.

Do not create an endpoint in this slice.

## 5. Database capability function

Create a new forward-only migration **using the Supabase CLI command**:

`supabase migration new official_truth_owner_reviewer_capability_1`

Do not invent a migration timestamp manually. If the CLI is unavailable, STOP and report; do not fabricate a filename.

The migration must add exactly one new database capability function:

`public.darf_official_truth_freigeben()`

Required contract:
- returns boolean;
- `language sql`;
- `stable`;
- `parallel safe`;
- `security invoker`;
- pinned `search_path = pg_catalog`;
- true only when:
  - `public.hat_rolle_mindestens('owner')`, AND
  - `public.aktuelles_admin_aal2()`;
- fail closed otherwise;
- no table/RLS/policy/ownership mutation;
- no SECURITY DEFINER;
- no caller-supplied reviewer/role/AAL value;
- no user_metadata authorization.

Privileges:
- explicitly revoke execute/all from `public` and `anon`;
- explicitly grant execute only to `authenticated` and `service_role`, consistent with the current admin capability family.

Current Supabase guidance verified by the Technical Lead on 2 October 2026:
- prefer SECURITY INVOKER for database functions;
- public functions otherwise need explicit privilege control;
- if SECURITY DEFINER were ever required, search_path must be pinned, but it is not required or allowed here.
No relevant 2026 breaking change was found that changes this function pattern.

## 6. Alignment tests

Update the narrow tests needed to keep the existing lockstep model correct.

Allowed test files:
- `lib/auth/roles.test.ts`
- `lib/auth/admin-access.test.ts`
- `lib/auth/admin-aal2-alignment.test.ts`
- `lib/auth/faehigkeiten-datenbank.test.ts` only if a real test change is necessary; prefer its existing generic coverage if sufficient.
- `lib/admin/analyst/system-health-insights.test.ts` only under the R1 amendment above; no Analyst runtime change.

The final tests must prove:
1. `minimumRoleFor('official-truth-freigeben') === 'owner'`;
2. only owner satisfies the application capability;
3. an admin does not satisfy it;
4. the database function's minimum role is owner;
5. the database function also requires `aktuelles_admin_aal2()`;
6. AAL1 owner fails the administrative capability matrix;
7. AAL2 owner passes;
8. AAL2 admin fails;
9. public/anon do not receive execute;
10. authenticated/service_role are the only intended execute roles;
11. break-glass remains non-database authority;
12. TypeScript and migration capability sets remain in lockstep.

Do not change existing role ranks or any other capability threshold.

## 7. Hard scope

Allowed runtime/test paths:
- `lib/auth/roles.ts`
- `lib/auth/roles.test.ts`
- `lib/auth/admin-access.test.ts`
- `lib/auth/admin-aal2-alignment.test.ts`
- `lib/auth/faehigkeiten-datenbank.test.ts` only if necessary
- `lib/admin/analyst/system-health-insights.test.ts` only under the R1 test-only amendment
- one new CLI-generated migration for this capability

Allowed lane docs:
- `docs/OFFICIAL_TRUTH_OWNER_REVIEWER_CAPABILITY_FOUNDATION_1_REPORT_2026-10-02.md`
- `docs/OFFICIAL_TRUTH_OWNER_REVIEWER_CAPABILITY_FOUNDATION_1_HANDOFF_2026-10-02.md`
- `docs/OFFICIAL_TRUTH_OWNER_REVIEWER_CAPABILITY_FOUNDATION_1_SELF_REVIEW_2026-10-02.md`

Read-only:
- this task except this Technical-Lead R1 amendment;
- #731 architecture;
- #739 decision packet/comment;
- #741 future Copilot Autopilot issue;
- `lib/auth/admin-guard.ts`;
- `lib/auth/admin-access.ts`;
- current admin AAL2 migrations;
- Official Truth runtime modules.

Forbidden:
- app/API routes or Server Actions;
- `regelKandidatAkzeptieren`;
- `trustedRuleFact`;
- decision/audit persistence;
- new tables;
- RLS/policy changes;
- real role/profile changes;
- remote Supabase Development or Production apply;
- Production Auth or DB mutation;
- provider/OpenAI/model/network calls;
- secrets/cost/indexing/launch;
- #626;
- implementation of #741;
- global current-state files.

## 8. Validation

Before handoff:
- fetch latest `origin/main`;
- finish 0 behind;
- `git diff --check`;
- operating-mode guard;
- focused role/admin/AAL2/capability tests;
- full `npm test`;
- typecheck;
- lint;
- production build;
- `check:dead`;
- `check:exports`;
- `check:deps`;
- `check:api-schutz`;
- `check:schema-bezug`;
- migration list/local consistency as applicable.

No remote database apply is needed or allowed for this slice.

## 9. Governance

Stay Draft.
Do not Ready.
Do not merge.
Do not start a follow-up endpoint, audit store, Production apply or Copilot Autopilot slice.
Self-review is not Technical-Lead PASS.

On CHANGES REQUIRED, stay in this same logical agent/session and fix only the named findings.

**STOP for independent Technical-Lead exact-head review.**
