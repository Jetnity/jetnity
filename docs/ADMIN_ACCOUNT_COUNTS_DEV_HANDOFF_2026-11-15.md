# Admin account counts — Dev implementation and handoff

## Result and authorization

The existing account-count feature now has a separate, default-off Dev activation path. It requires the exact Jetnity Vercel project, this task's Preview branch, and the exact confirmed Dev Supabase URL in both the current environment and the shared client's captured configuration. The original moderator-or-higher, AAL2, active/nonanonymous caller checks, reader, literal RPC, exact-decimal parser and counting definition remain in force.

Sasa authorizes necessary Dev work. Production, merges, new costs and login/2FA remain reserved. This package does not make any of those actions. Task-only commit `c9adeae1f881e11a3cea0c0cb200ce5ba3550c6f` precedes implementation on `feat/admin-account-counts-dev-20261115`, based on main `63544e820e912bd275556588c956a09b99b1cf90`.

The count card describes the connected test database accurately, shows the measurement time and exact 720-hour observation window, and preserves the population caveats. Missing or denied data remains unavailable, never a fabricated zero. This adds no visitor analytics or customer-facing entry information.

## Exact target and data package

- Confirmed nondefault Supabase branch: `develop`, `yfvbxvijcorffwxbxahl`; parent identity `qscbgcdmivbbnzrcyegn`. Only branch/project metadata was read on the parent. All database reads use the Dev ID.
- Confirmed Dev PostgreSQL 17.6, postgres session/current user, NOSUPERUSER+BYPASSRLS, two-minute statement timeout, existing postgres SELECT on auth.users and no client-role SELECT. Reporting schema and count functions were absent at preflight.
- Vercel project `prj_wTTVawPItEO7a4HihEmaU3PsuaXM`; branch `feat/admin-account-counts-dev-20261115`; Preview only. No project-wide or other-branch environment changes are authorized by this package.
- Producer file SHA256: `612f755c12f1817e129226648b6c6fd2c1eba19b57bd163102a2eb5e344c12de`.
- Wrapper file SHA256: `13fa3fe280d76d42ca6b2a1dff12077edc3d44a599a22300e89dd5578d63a6fb`.
- Generated install SQL SHA256: `5fd5c6d3859b69162b9c01350ad008921f3bc9efe81b2c135cda8f2568d5b7bd`.

`lib/admin/account-counts-dev/installation.ts` produces the committed `scripts/db/admin-account-counts-dev-20261115/install.sql`; it does not connect to a database. The accepted source files stay byte-identical. Exactly three DDL heads become strict CREATE so existing or concurrently created objects cannot be replaced. Producer/wrapper bodies, population and caller contract remain byte-identical.

One atomic DO statement checks source tables, required column/identity constraints, helper bodies/signatures/owners/configurations/ACLs, and the already installed profile-integrity function and complete trigger binding. It requires a fresh reporting namespace and public function name, including all overloads. A scoped advisory lock and five-second lock timeout bound competing installation attempts. It creates only the reporting schema and two functions, verifies complete function and ACL contracts, checks a before/after catalog snapshot of existing authority, and requests PostgREST schema refresh only on commit. Any failure rolls the whole statement back. No Auth/profile row, existing guard, privilege role, client auth.users grant or managed-Auth configuration is changed.

The existing profile guard belongs to #1197. Its observed source hash is `b513eca8cc5d7b3981d9b9eb1473428e628410dcb0f4b718290d4cc314756a8d`. This package only verifies it. The synthetic native fixture copies its reviewed definition into a disposable local cluster; that fixture must never be applied to hosted Dev or Production.

## Review corrections and evidence

The first complete review was collected before a single correction batch: SQL record/alias ambiguity, missing fixture terminators, incomplete trigger qualifiers and helper return identities, catalog-search-path setup, source-authority snapshot coverage, and explicit Vercel project binding. All were corrected together. A final SQL review added explicit pg_temp ordering after pg_catalog and moved the authority snapshot before prerequisite checks; those two corrections were also applied together. Native regressions cover temporary catalog shadowing and an authority change after successful prerequisite checks. New negative cases also cover restricted WHEN and UPDATE OF triggers, changed SETOF helper shape, missing/wrong Vercel project and zero transport on every rejected activation.

Local verification:

- After the first correction batch, 358 Admin tests passed, zero failed/skipped, across 43 files. After the final two SQL corrections, all four directly affected composer/source tests passed again against the regenerated SQL. Browser/native files are deliberately excluded from these local results.
- TypeScript and scoped ESLint passed; whitespace check passed.
- API protection, schema-reference and dead-code/export/dependency checks passed during this implementation. Existing generated-schema output remains a historical/local declaration, not evidence of a hosted installation.
- Fresh protected-path check: no overlap with #1196 (102 paths), #1197 (306 paths) or #1198 (98 paths). Shared types, factories, auth guards, workflow, package files, global coordination documents and all three protected lanes remain unchanged.

The normal existing core CI discovers the new native test. It executes the exact generated installation against disposable PostgreSQL, collects all 14 subcase outcomes, proves real allowed/denied caller behavior, prerequisite rejection, concurrent-creator safety and rollback after either creation boundary. The existing core runner supplies PostgreSQL 16; the test prints the actual engine and makes no PG17 or hosted-session claim. The local workspace cannot open PostgreSQL or Chromium sockets, so those blocked operations were not retried.

At this committed handoff, full CI and final exact-head review are pending. No hosted installation or environment activation has occurred. Final run/head, native results, actual migration identity/hash and any branch-specific environment/deployment changes will be recorded in the Draft PR after they occur. Earlier Admin branches have a known, separately reported Auth `uri_allow_list` mismatch against the protected configuration; this package does not alter that configuration or treat a formally red run as fully green.

## Remaining Dev execution and acceptance

After successful relevant CI and final review: reconfirm the nondefault Dev branch and all live prerequisites, apply only the exact reviewed SQL through the explicit Dev API target, and read back its metadata and migration identity. If an apply response is ambiguous, inspect actual state before any retry. Do not clean up or replace existing objects to force a pass.

Any configuration uses only three branch-specific Preview values: the confirmed Dev public URL, its existing public API key and `JETNITY_ADMIN_ACCOUNT_COUNTS_DEV_ENABLED=true`. Keep the platform-supplied project/branch identity checks. Rebuild the same reviewed commit for those environment values; no Production promotion or new service.

A genuine public/anonymous denied RPC can verify hosted transport without an account login. A positive hosted moderator/owner+AAL2 browser check requires Sasa's legitimate session and remains explicitly unrun until observed. Synthetic private-cluster JWT claims do not constitute hosted authentication evidence. No new login, account, TOTP, token reconstruction or hosted JWT fabrication is part of this work.

The Draft PR stays Draft and unmerged. After this bounded package, the next Admin correctness gap is the existing non-atomic refund ledger; broader marketing/CMS/localization product work and customer-journey acceptance retain the previously agreed order.
