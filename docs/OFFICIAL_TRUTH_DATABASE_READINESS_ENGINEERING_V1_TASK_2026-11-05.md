# Official Truth Database Readiness — Engineering V1 Task

Date: 2026-11-05 (Europe/Zurich)  
Issue context: #917 (parent), #741, #968, #982  
Bounded branch: `feat/official-truth-db-readiness-v1`

## Goal

Deliver one small, concrete engineering slice after the read-only readiness audit:

1. versioned dependency matrix for Official-Truth migrations,
2. targeted synthetic local security checks for existing SQL contracts (store/catalog/owner-reviewer),
3. explicit missing-evidence list for the first complete CH→DE source/rule path.

No migration apply, no Supabase SQL execution, no production permission change, no Ready, no Merge.

## Fixed baseline for this task

- Development migration history: **80**
- Production migration history: **60**
- Divergence: **25 development-only**, **5 production-only**

This slice reuses that verified baseline; it does not re-open migration counting work.

## In scope

- Update/add docs for migration dependency classification and pending gates.
- Add/extend local synthetic contract tests for security-critical SQL properties:
  - `SECURITY DEFINER` vs `SECURITY INVOKER`,
  - `EXECUTE` grants,
  - role/AAL2 gate semantics,
  - fixed `search_path`,
  - fail-closed behavior.
- Run targeted local tests and report exact outcomes.
- Open a Draft PR from current verified `main`.

## Out of scope (hard)

- No overlap with blocked workstreams in #985 and #937.
- No runtime/provider activation (`requirementsProviderAus()` remains off).
- No hosted Development/Production DB writes.
- No migration execution.
- No new secrets, no new paid provider dependency.

## Deliverables

1. `docs/OFFICIAL_TRUTH_MIGRATION_DEPENDENCY_MATRIX_2026-11-05.md`
2. targeted local synthetic test coverage for the owner-reviewer SQL contract
3. Draft PR with exact head, diff summary, CI status, and remaining gates

## Acceptance criteria for this bounded slice

- Dependency matrix clearly separates:
  - productive required migrations,
  - currently local/dev-only migrations,
  - unresolved gates before first complete CH→DE path.
- New security test is deterministic, synthetic, and local-only (disposable PostgreSQL); it distinguishes mocked upstream helpers from real source definitions and **does not** assert live RLS/ACL or signed-JWT proof.
- Test output is attached in the handoff/report.
- Existing #917 Stage1 readback STOP remains untouched.

## Technical Lead R1 correction scope (05.11.2026)

The database dependency diagram explicitly separates the current-request-only CH→DE pilot from retained-original custody/lookup. The local SQL proof applies the real owner-reviewer capability migration against **mocked** role/AAL2 helpers, and independently pins the actual upstream migration source definitions. Only the fully authorized #917 readback can prove deployed definitions, grants, JWT semantics and RLS. This is a bounded correction of the existing Engineering V1 scope, not permission for a hosted SQL call or a new migration.

## Stop condition

After docs + tests + draft PR evidence are published: **STOP for independent Technical-Lead review.**

