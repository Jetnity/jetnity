# Jetnity – AP-7-S2 Account Traveller Registry Persistence Status

Stand: 29. August 2026  
Status: **IMPLEMENTED ON BRANCH / DEVELOPMENT VERIFIED / STOP FOR INDEPENDENT TECHNICAL-LEAD EXACT-HEAD REVIEW**  
Issue: #209  
Branch: `feat/ap7-s2-account-traveller-registry-persistence-2026-08-29`

## Baseline and authorization

- Baseline: `main @ ef0a0b151f24d13b27e691de4771198dc241e014`.
- Product-Owner gate integrated via #208 after exact-head review.
- Binding scope: `docs/AP7_S2_PRODUCT_OWNER_PRODUCTION_IDENTITY_RLS_GATE_2026-08-29.md`.
- Task: `docs/AP7_S2_ACCOUNT_TRAVELLER_REGISTRY_PERSISTENCE_TASK_2026-08-29.md`.

## Implemented

Repository migration: `supabase/migrations/20260829201500_account_traveller_registry_persistence.sql`.

It adds exactly:

- `account_travellers`
- `account_traveller_citizenships`
- `account_traveller_documents`
- `account_traveller_kinder_limit_pruefen()` as SECURITY INVOKER
- owner-only RLS policies and authenticated CRUD grants
- concurrency-safe 8/12 child limits on INSERT/UPDATE/reparenting
- timestamp triggers, FK/unique/check constraints and indexes.

No Trip table or existing `trip_traveller*` table is changed. No UI/runtime/backfill/live-link is added.

## Supabase Development verification

Existing non-default branch `develop` / project `yfvbxvijcorffwxbxahl` was used; no new paid branch was created.

A rebase initially ended `MIGRATIONS_FAILED` because Development retains historical develop-only migration versions documented by P2-TA-04 C1. This occurred before AP-7-S2 apply and was not an S2 SQL failure. The Technical Lead reset Development to the current Production migration tip and verified the branch returned healthy; historical version rows remain preserved by Supabase.

AP-7-S2 was then applied successfully to Development as migration `20260829201146_account_traveller_registry_persistence` using the exact repository SQL body.

Live catalog verification after apply:

- all three tables exist with RLS enabled;
- all start with 0 rows;
- only `authenticated` has SELECT/INSERT/UPDATE/DELETE table grants; `anon` has none;
- all policies are owner-only `auth.uid()` policies;
- Parent FK is `auth.users(id) ON DELETE CASCADE`;
- child→parent Composite-FKs bind `traveller_id + user_id`;
- document→citizenship Composite-FK binds `citizenship_id + traveller_id + user_id` and nulls only `citizenship_id` on citizenship deletion;
- limit triggers fire on INSERT and UPDATE;
- limit function is `SECURITY INVOKER`, fixed `search_path=public, pg_temp`, no public/anon execute;
- zero sensitive/trip-link columns found.

Adversarial transaction, rolled back in full, verified:

- user B cannot be written by user A through RLS;
- user A sees only own parent rows and user B only own parent rows;
- cross-owner child parent reference rejected;
- 9th Citizenship rejected;
- reparenting a Citizenship into an already full parent rejected;
- 13th Document rejected;
- cross-traveller Citizenship relation rejected;
- deleting a referenced Citizenship sets only `citizenship_id` to NULL;
- `anon` SELECT rejected.

Separate two-transaction evidence verified `updated_at` advances through the shared `setze_aktualisiert_am()` trigger; the temporary fixture was removed afterward. Development row counts returned to 0/0/0.

## Repository regression coverage

`lib/traveller/account-registry-persistence.test.ts` locks:

- three-table additive scope;
- no Trip live-link/backfill;
- composite owner and Citizenship relation constraints;
- 8/12 INSERT+UPDATE limits;
- owner-only RLS / anon revoke / authenticated CRUD;
- SECURITY INVOKER and no service-role/Admin bypass;
- sensitive/default-credential fields remain absent.

## Hard non-scope held

No Registry UI, Registry→Trip runtime, Guest→Registry import, backfill, existing trip traveller mutation, sensitive document payload, Auth/MFA/AAL, Admin/Support bypass, provider work, TW-8, Payments or Branch Protection.

## Exact next step

Independent Technical-Lead review of the final PR head, including diff, CI, Vercel Preview, review threads and Development evidence. Production is **not yet mutated**. Only after exact-head PASS may the Product-Owner-approved exact migration be applied to Production.
