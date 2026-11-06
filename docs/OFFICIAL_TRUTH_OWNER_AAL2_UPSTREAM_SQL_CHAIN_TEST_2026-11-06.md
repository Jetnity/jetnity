# Jetnity Official Truth – Real upstream Owner/AAL2 SQL, disposable local-only proof

Task tracker https://github.com/Jetnity/jetnity/issues/1136  
Parent https://github.com/Jetnity/jetnity/issues/917  
Baseline `main@7c66522a09253634efe0c346e9569c5b2c2c9e10`, mode NORMAL, source-controlled task only.  
Branch `test/official-truth-owner-aal2-upstream-sql-chain-20261106`; direct Technical Lead writer; no GitHub Copilot token files modified.

# Official Truth owner reviewer — actual upstream SQL local-only regression

**Date:** 06 November 2026, Europe/Zurich. **Parent:** #917. **Baseline:** `main@7c66522a09253634efe0c346e9569c5b2c2c9e10`, operating mode NORMAL.
**Task:** Improve the *independent local synthetic test proof* of the existing Owner + current AAL2 ability, without changing any live SQL, credentials, roles, migrations or pilot execution. Separate code path and files from blocked PR #1131/#1135.

## Concrete verification gap
`lib/readiness/official-truth-owner-reviewer-capability-contract.test.ts` currently applies the actual `20261002154952_official_truth_owner_reviewer_capability_1.sql` in an isolated PostgreSQL cluster but **replaces** the actual upstream `public.hat_rolle_mindestens` and `public.aktuelles_admin_aal2` with simplified SQL doubles. That proves only top-level AND and ACL, not the real source-defined helper composition. Matrix `docs/OFFICIAL_TRUTH_MIGRATION_DEPENDENCY_MATRIX_2026-11-05.md` explicitly declares this gap.

## Single bounded improvement
- Add a **separate** local PostgreSQL 16/17-only test (new file) loading the exact function definitions from the existing source-controlled migrations `20260817100000_rollenmodell.sql`, `20260827170000_admin_aal2_data_plane_alignment.sql` and `20261002154952_official_truth_owner_reviewer_capability_1.sql` (do not modify those migration files). Only the `auth.jwt()` / `auth.uid()` session-claim provider, minimal `creator_profiles` row fixture and roles are local synthetic scaffolding, **never** live Supabase.
- Execute real `rollenrang`, `aktuelle_rolle`, `hat_rolle_mindestens`, `aktuelles_admin_aal2`, `darf_official_truth_freigeben` definitions together in a disposable localhost-independent socket-only PG cluster, with no inherited remote DB variables. Assert owner+aal2 true, admin+aal2 false, owner+aal1 false, absent account false, user-controlled `user_metadata`/role claim cannot mint owner, no RLS table SELECT for ordinary roles, anon cannot invoke capability; verify actual function security mode, fixed search_path and grants.
- Fail closed on unexpected migration/function-name drift. No network tests, no real JWT signature verification, do not claim Production authenticated user or Supabase hosted parity. If PG unavailable, explicit skip, not fake PASS. Do not touch legacy mock test, SQL migrations, RLS, Auth config or any #917 denied endpoint.
- Versioned Task/Handoff docs and synthetic test only. PR Draft, exact-head CI Typecheck/Lint/Tests/Build/Auth, independent TL review and regular merge only if permitted. This scoped test cannot substitute for `#917 Stage1 UNVERIFIED / Stage2 NOT_ATTEMPTED` and must never be used as authorization for production migration.

**Security hold:** #1131 and #1135 separate platform-denied Ready, remain OPEN/DRAFT. No rerouting, reissue, cherry-pick or delegated completion of refused actions. GitHub Copilot reported on unrelated token-format work; do not overlap.

## Rollout boundary

This test uses the *exact helper-function definitions present in the existing repository migrations*, but a disposable PG cluster and synthetic `auth.jwt()` / `auth.uid()`, fixture profiles and roles. It proves only the source-defined SQL composition and local privilege behavior. It **cannot verify Supabase-signed JWTs**, effective deployed Supabase grants/RLS, actual Dev/Prod migration history, MFA, owner identity or #917 Stage1 readback. The previously refused hosted readback must never be retried or substituted by this test. Nothing is deployed/applied to real DBs and no privilege or application runtime is changed.

STOP for an independent Technical Lead exact-head review after native CI. Do not auto-Ready/Merge or treat local-proof PASS as Official Truth operational readiness.
