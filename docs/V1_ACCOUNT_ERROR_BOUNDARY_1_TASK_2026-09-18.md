# Jetnity – V1 Account Error Boundary 1 Task

Stand: 18. September 2026  
Status: **ACTIVE / PARALLEL BOUNDED REMEDIATION / SMALL RUNTIME SLICE**

Issue: #468  
Source audit: #438 / merged PR #449 / finding 4.2  
Canonical base: `main@c3cde9ad1e2daa2ed0a3912ed6a55de803476385`

Branch: `fix/v1-account-error-boundary-1`

Cursor-Agent: **Jetnity V1 account error boundary 1**  
Generation: **1**  
Required parent model: **Cursor Grok 4.6 High Fast**

Do not use Auto. If unavailable, STOP/report.

## Goal

Add a truthful Next.js error boundary for `/account/*` without changing Auth/session/account semantics.

## Required behavior

- create `app/account/error.tsx` as a client error boundary;
- provide retry/reset and at least one safe navigation path out of the failed account subtree;
- use existing `oeffentlicheFehlerId()` for a user-visible error identifier;
- no stack/raw error detail in Production;
- development-only diagnostics may follow current conventions;
- do not claim saved trips/data are definitely unaffected;
- do not claim the Fehler-ID is correlated to operator-side tracking;
- preserve accessibility/mobile usability;
- add the smallest focused regression/contract test for existence and truth/safety invariants.

## Allowed write scope

- `app/account/error.tsx`
- one focused test under `lib/next/**` or another existing appropriate test area
- `docs/V1_ACCOUNT_ERROR_BOUNDARY_1_TASK_2026-09-18.md`
- `docs/V1_ACCOUNT_ERROR_BOUNDARY_1_STATUS_2026-09-18.md`
- `docs/V1_ACCOUNT_ERROR_BOUNDARY_1_HANDOFF_2026-09-18.md`
- `docs/V1_ACCOUNT_ERROR_BOUNDARY_1_SELF_REVIEW_2026-09-18.md`

## Parallel isolation

Runs concurrently with #467 and #469. Do not touch support-process docs, AdminStatsStrip, admin truth-copy, or global continuity docs. No cross-branch merges during implementation.

## Hard exclusions

No changes to public/admin error boundaries, Auth/session/MFA/AAL/OAuth, account settings, Supabase/schema/RLS/migrations, providers/secrets/costs.

## Validation

Focused test, full tests, typecheck, lint, Production build, repo hygiene, exact-head CI + Vercel Preview, drift/thread report.

No Ready. No merge. No follow-up slice.

Final state: **STOP FOR TECHNICAL-LEAD REVIEW**.
