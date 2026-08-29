# Jetnity – AP-7-S2 Account Traveller Registry Persistence / Identity / RLS Task

Stand: 29. August 2026  
Status: **PRODUCT-OWNER AUTHORIZED / IMPLEMENTATION TASK / NO UI OR TRIP RUNTIME**  
Issue: #209  
Baseline: `main @ ef0a0b151f24d13b27e691de4771198dc241e014`

## 1. Binding authorization

Product-Owner gate: `docs/AP7_S2_PRODUCT_OWNER_PRODUCTION_IDENTITY_RLS_GATE_2026-08-29.md`.

Approved architecture remains Dual-Authority:

- Account Registry = reusable current traveller identity/facts.
- Trip Snapshot = only Current Truth for a concrete trip.
- Registry edits never silently rewrite existing trips.

## 2. Exact scope

Implement one additive migration that creates:

- `public.account_travellers`
- `public.account_traveller_citizenships`
- `public.account_traveller_documents`

Required invariants:

1. UUID registry identities and UUID `client_ref` values.
2. Parent ownership bound directly to `auth.users(id) ON DELETE CASCADE`.
3. Children carry `user_id` and are bound to the same parent owner by composite FK.
4. Document→Citizenship relation, when present, must reference the same Registry traveller and same owner.
5. 8 citizenships and 12 documents maximum per Registry traveller, concurrency-safe and enforced on INSERT/UPDATE/reparenting.
6. RLS enabled on all three tables.
7. `authenticated` CRUD only under owner-only `auth.uid()` policies.
8. `anon` has no table privileges.
9. No Admin/Support bypass, no service-role product path, no `SECURITY DEFINER`.
10. `updated_at` maintained by the existing server-side timestamp trigger function.
11. No trip-specific 20-person cap on the account Registry.
12. No sensitive passport/document payload fields.

## 3. Development and Production gates

Before merge / Production apply:

- rebase existing Supabase `develop` branch onto current Production;
- apply the exact repository migration to `develop`;
- live-check tables, columns, constraints, indexes, triggers, policies and grants;
- adversarially verify cross-owner RLS behavior and child ownership where practical;
- verify 8/12 limits including UPDATE/reparenting path;
- verify zero sensitive columns and zero trip/live-reference columns;
- run repository CI and Vercel Preview on exact PR head;
- independent Technical-Lead exact-head diff review;
- apply to Production only the exact independently reviewed migration;
- immediately verify Production schema/RLS/grants/row counts and migration history;
- post-merge GitHub CI and Vercel Production must be terminal green.

Any material schema/RLS/grant change after Product-Owner authorization requires renewed Technical-Lead assessment and, if the special gate changes materially, renewed Product-Owner approval.

## 4. Hard non-scope

No:

- Registry UI or CRUD screens;
- Registry→Trip materialization/runtime;
- Guest→Registry import;
- automatic deduplication or backfill;
- changes to existing `trip_traveller*` tables;
- Registry FK/provenance link on trip snapshots;
- silent trip rewrite;
- passport/document numbers, scans/images, MRZ, biometrics, DOB or health data;
- Auth/Session/MFA/AAL changes;
- Admin/Support visibility into another account's Registry;
- Collaboration RLS;
- Provider runtime/secrets/paid calls;
- TW-8, Payments, Branch Protection or Build-Order changes.

## 5. STOP condition

After implementation, Development verification and author self-check, stop for independent Technical-Lead exact-head review. No automatic S3/UI/materialization follow-up from this slice.
