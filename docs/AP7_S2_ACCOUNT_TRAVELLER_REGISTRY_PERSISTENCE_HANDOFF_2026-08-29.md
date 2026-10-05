# Jetnity – AP-7-S2 Account Traveller Registry Persistence Handoff

Stand: 29. August 2026  
Status: **AUTHORING COMPLETE / DEVELOPMENT VERIFIED / STOP FOR INDEPENDENT TECHNICAL-LEAD REVIEW**

## What is finished

AP-7-S2 implements the Product-Owner-approved account-owned persistence foundation for the existing Dual-Authority traveller model:

- three additive Registry tables;
- UUID identities/client refs;
- explicit multi-citizenship and multi-document relations;
- same-owner/same-traveller Composite-FKs;
- owner-only RLS and authenticated CRUD grants;
- anon no table access;
- concurrency-safe 8/12 child limits on INSERT and UPDATE;
- no Admin/service-role bypass and no SECURITY DEFINER;
- no sensitive document payload fields;
- no Registry→Trip live relation.

Development apply and adversarial behavior checks are recorded in `docs/AP7_S2_ACCOUNT_TRAVELLER_REGISTRY_PERSISTENCE_STATUS_2026-08-29.md`.

## Development branch note

Supabase `develop` contains historical develop-only migration-version drift already documented by P2-TA-04 C1. A rebase surfaced that old history as `MIGRATIONS_FAILED` before S2 apply. Technical Lead reset the non-production branch to current Production migration state, returned it to healthy and then applied the exact S2 SQL successfully. Production remained untouched.

## Hard boundaries

Still not built or authorized by this slice:

- Account Registry UI/CRUD screens;
- Registry→Trip materialization/runtime;
- Guest→Registry import/dedup/backfill;
- any change to trip-scoped Foundation-E tables;
- passport/document numbers, scans, MRZ, biometrics, DOB/health;
- Auth/MFA/AAL changes;
- Admin/Support cross-account Registry access;
- Provider live/paid, TW-8, Payments.

## Review protocol

1. Independently compare branch against current `main` and verify 0 behind.
2. Review exact migration SQL, regression test and docs/ADR.
3. Verify GitHub Actions and Vercel Preview on the exact head.
4. Verify 0 unresolved review threads.
5. Re-check Development catalog/row counts if the head changes.
6. Only after Technical-Lead PASS apply the exact approved migration SQL to Production.
7. Immediately verify Production tables, constraints, RLS, grants, function, triggers, migration history and zero initial rows.
8. Merge only the exact reviewed head; then verify post-merge CI/Vercel Production and persist closure.

Any new code/schema/RLS/grant commit invalidates earlier exact-head gates. No automatic AP-7-S3/UI follow-up.
