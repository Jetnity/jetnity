# Jetnity Official Truth – private ACL/RLS native CI check

**Date:** 06 November 2026, Europe/Zurich  
**Tracking:** https://github.com/Jetnity/jetnity/issues/1138  
**Parent:** https://github.com/Jetnity/jetnity/issues/917  
**Baseline main:** `bc452974959e17f69bf6a54dd8a4fc10f51cec9f` (read current HEAD again)  
**Writer:** ChatGPT Technical Lead, independent code-only test. Cursor unavailable; no overlap with Owner's active Copilot token-format task.

## Scope
One new test `lib/readiness/official-truth-private-rls-acl-native.test.ts` executes the exact seven source-controlled Official Truth Foundation/Identity/Fingerprint migrations in an owned local PostgreSQL cluster. It does not modify existing SQL or run the earlier `db:rls` remote-connected script.

- Base private Evidence and Source (20261001121258).
- Accepted Rule Claim typed facts (20261001151048).
- service_role-only writer (20261001180549).
- source catalog (20261001193748).
- identity V2 (20261004010705).
- content catalog/profile hardening (20261004223959).
- fingerprint protocol V2 (20261010180000).

The test pins a **22-table expected inventory** from the above migrations and compares actual PostgreSQL catalog tables dynamically. For every table, it asserts `relrowsecurity=true`, `relforcerowsecurity=true`, zero `pg_policy` rows and zero direct table DML/DDL-trigger grants for `anon`, `authenticated` and `service_role`. It explicitly tests denied direct SELECT/INSERT for representative tables, `private` schema USAGE revocation, and exact gateway RPC execution boundary (only `service_role`). A read of the **empty local** source catalog is allowed via the existing gateway; no real source/evidence/rule is registered. All check inputs are synthetic; all actual tables start empty except the inert source-profile pin introduced by the hardening migration.

The test uses `startLocalProofCluster` and the real migrations with temporary Unix-socket-only PostgreSQL; no remote DSN, Supabase Management API, secret, actual owner identity, auth token, or hosted DB access. It is automatically invoked by `npm test`; if PostgreSQL binaries are unavailable, the native test is explicitly marked SKIP and **cannot** count as a native PG PASS.

## Deliberate exclusions / remaining gates
- `20261011111839` original-custody lifecycle and `20261023153726` current-version lookup are LOCAL_DEV_ONLY and depend on other independently gated contracts. `20261013184409` CH→DE pilot also depends on Trip/Traveller + Owner/AAL2, so the **three local-only branches are not included** in the seven-migration Foundation matrix. They remain outside this isolated foundation test; don't label them tested or applied.
- This is a **local repository migration behavior check only**, not a Supabase-signed JWT, real Dev/Prod ACL/RLS, actual migration history or #917 Stage1/Stage2 evidence. Stage1 remains UNVERIFIED and Stage2 NOT_ATTEMPTED. Do not treat success as authorization to import research, activate the provider/pilot or apply migrations.
- #1131/#1135 received distinct platform-denied Ready transitions; this test does not copy/reimplement their code or route those denied actions through another worker.
- #1139 remains a separate Owner/status/session witness project; role+AAL2 alone is not authorization for disabled/banned accounts. No change in Auth/RLS/Owner code made here.

## Verification and STOP
CI full Typecheck/Lint/Tests/Build/Auth must be inspected on **exact final PR HEAD**. Record actual native test run (not skip), expected negative errors, and no extra DDL changes. Independently review any new/future table or RPC name instead of automatically allowing it. A regular TL Ready/Merge decision (if permitted) applies **only** to this test-only slice; nothing in this report approves source/DB runtime activation.
