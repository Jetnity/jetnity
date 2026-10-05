# Official Truth v2 Catalog Profile + Exact-Host Hardening 1 — Task

Date: 4 October 2026
Issue: #834
Status: **BINDING / SECURITY HARDENING / MIGRATION FILE ONLY / NO HOSTED APPLY / NO EXTRACTOR / NO F8**

## 1. Authority and baseline

Technical Lead independently reproduced the relevant residuals from `COS-20261004-2225-006`.

Baseline:
- main: `85a53346a87b6175f9e0ffad9901ff6bd45a2654` (Merge #831)
- mode: `NORMAL`
- #751 has active Workspace writer #832/#833; this Official Truth slice is intentionally file-disjoint
- latest processed MATERIAL report marker: `5984004655`
- TL processing update: #748 comment `5985154235`
- Development project `yfvbxvijcorffwxbxahl` currently contains exactly one valid GOV.UK source/item/representation and zero Evidence/Rule rows
- Production `qscbgcdmivbbnzrcyegn` has no Official Truth v2 objects
- Development migration `20261004010705 / official_truth_content_identity_2` is present
- intentionally unapplied `20261002154952` remains absent
- temporary `20261004091341` remains absent
- plain `db push` remains forbidden

Live evidence wins. Re-read main/mode/#751/#748/open PRs before edits. STOP if this slice overlaps another writer or if Official Truth state materially drifts.

## 2. Writer

Logical writer: **Jetnity Official Truth v2 catalog hardening 1**, Generation 1.

Execution:
**Codex Desktop**.

Required model:
**GPT-6 Astra — Sehr hoch** (`gpt-6-astra`, `xhigh`).

No Cursor. No delegated writer. Do not silently substitute model/effort.

## 3. Confirmed security gaps

### 3.1 Descendant host authorization

General source registry semantics currently allow a registered domain to resolve descendant hosts:

`host === domain || host.endsWith('.' + domain)`

Database function `private.official_identity_authorized_url_v2` has equivalent descendant semantics.

Therefore a source registered only for:
`www.gov.uk`

also authorizes:
`x.www.gov.uk`

The accepted GOV.UK content itself is stored at an exact `www.gov.uk` URL, so existing data is not wrong. The registration boundary is broader than required.

### 3.2 Raw RPC profile availability

The typed helper:
`contentItemRegistrieren`

reconstructs `createContentIdentityGraph` and fails closed with `profile_unavailable` unless the identity-profile tuple exists in the code-owned registry.

The DB RPC:
`public.official_truth_source_catalog_v2(jsonb)`

validates profile id/version shape but does not prove that tuple is a registered/active profile.

A raw service-role `register_content_item` can therefore store a profile tuple that the normal code reader later rejects.

## 4. Architectural decision

### 4.1 Keep executable profile authority in code

Do not move verifier functions or executable trust into the database.

`OFFICIAL_TRUTH_CONTENT_IDENTITY_PROFILE_REGISTRY` remains the executable code authority.

The database receives only **inert profile pin metadata**:
- identity_profile_id
- identity_profile_version
- current

No SQL verifier, parser, model or executable callback.

### 4.2 Exact-host content identity only

Do **not** globally rewrite the general source-registry descendant semantics in this slice.

Instead create/use a narrow exact-host resolver/check for **v2 content identity / representation URLs**.

This avoids unreviewed behavior change in unrelated source-registry consumers.

For v2 content identity:
- URL hostname must equal one of the registered source's domain strings exactly;
- descendant hostname is not enough;
- blocked-domain policy remains fail-closed.

Future legitimate distinct hosts must be explicitly registered as distinct domain strings.

## 5. Database migration

Create exactly one new migration using Supabase CLI naming, e.g. logical name:

`official_truth_v2_catalog_hardening_1`

Do not hand-invent the timestamp if the repository standard requires CLI creation.

**Do not apply it to any hosted project.**

### 5.1 Inert profile-pin table

Create:
`private.official_content_identity_profile_pins`

Required columns:
- `identity_profile_id text not null`
- `identity_profile_version integer not null`
- `current boolean not null`

Constraints:
- same profile-id grammar as code/representation table;
- version > 0;
- primary key `(identity_profile_id, identity_profile_version)`;
- at most one `current=true` row per profile id.

Seed exactly the already independently merged profile:
- id `govuk-eta-national-list-content-api-en`
- version `1`
- current `true`

This seed is inert metadata only. It does not execute or activate a verifier.

Security:
- RLS enabled;
- FORCE RLS;
- zero permissive policies;
- revoke all direct table privileges from public/anon/authenticated/service_role;
- immutable after insertion using the existing append-only identity trigger where safe;
- table/comment must state that it is a DB registration guard, not executable profile authority.

Future profile activation/retirement requires a separately reviewed migration or explicitly designed transition. No runtime profile-pin writer in this slice.

### 5.2 Representation binding

Add a foreign key from:
`private.official_content_representations(identity_profile_id, identity_profile_version)`

to:
`private.official_content_identity_profile_pins(identity_profile_id, identity_profile_version)`

Existing Development GOV.UK representation must be compatible with the migration.

Extend the representation eligibility/check path so **new current representation registration** requires the matching profile pin to exist and be `current=true`.

Raw RPC with:
- unknown profile id;
- known id / unknown version;
- known historical/inactive tuple

must fail atomically before a usable content registration can commit.

No partial source/item/representation/URL rows may survive a rejected transaction.

### 5.3 Exact-host SQL authorization

Replace only the v2 content authorization semantics in:
`private.official_identity_authorized_url_v2`

Registered source-domain match becomes exact hostname equality.

Do not allow:
`x.www.gov.uk`
from registered:
`www.gov.uk`

Keep:
- HTTPS/canonical URL validation;
- blocked-domain fail-closed behavior;
- exact registered `www.gov.uk` success.

Because accepted Evidence/Rule eligibility already calls this function, the stronger host rule must also apply there.

## 6. TypeScript exact-host boundary

Do not change general `quellenUrlAufloesen` descendant semantics globally.

Add the narrowest pure mechanism, for example:
- `quellenUrlExaktAufloesen`
or
- an explicit exact-host content-identity guard

and use it only for v2 Content Identity representation request/final URL validation.

Required:
- exact registered host succeeds;
- descendant of registered host fails `url_not_authorized` or the existing appropriate failure;
- different registered host fails source mismatch/authorization as before;
- blocked host remains blocked;
- no DNS or HTTP occurs;
- opaque URL parsing tricks, credentials, ports, fragments, non-HTTPS remain rejected by existing contracts.

`createContentIdentityGraph` and DB RPC must agree on this exact-host contract.

## 7. Profile registry consistency

The normal TypeScript path still requires the code-owned profile registry.

Tests must prove:
- code registry missing profile => helper fails before write;
- DB pin missing profile => raw RPC fails;
- both present => canonical GOV.UK registration succeeds;
- database profile pin presence alone does not execute verifier code;
- verifier is still not called during registration.

Do not expose the DB profile-pin table to browser/user callers.

No public route/action for profile registration.

## 8. Existing Development data compatibility

Use local/throwaway PostgreSQL proof only.

Simulate the existing Development state:
- source `govuk`
- exact domain `www.gov.uk`
- item `eta-national-list`
- representation `content-api-en`
- profile `govuk-eta-national-list-content-api-en` v1
- exact current Content API URL

Then apply the new migration locally.

Prove:
- migration succeeds over that existing state;
- seeded profile pin matches existing representation;
- no existing row changes identity;
- no delete/rebind/truncate;
- existing exact URL still authorized;
- read_registry data remains semantically identical for existing public fields.

No hosted Development apply in this slice.

## 9. Adversarial SQL/RPC tests

At minimum prove in disposable PostgreSQL:

1. exact `www.gov.uk` URL + seeded profile => success;
2. `x.www.gov.uk` => reject;
3. `www.gov.uk.evil.example` => reject;
4. unknown profile id => reject;
5. unknown profile version => reject;
6. inactive profile => reject in a controlled fixture;
7. failed raw RPC leaves no item/version/representation/url-reservation/url rows;
8. exact replay remains idempotent;
9. changed replay remains conflict;
10. service_role has execute only on intended RPC and no direct profile-pin table DML;
11. anon/authenticated cannot execute catalog v2 or mutate pin table;
12. profile-pin table RLS/FORCE RLS and immutability are active;
13. existing Evidence/Rule eligibility exact-host behavior is not weakened.

Do not create a production shortcut to manipulate `current` just for tests; use disposable SQL fixtures/transaction-local setup if needed.

## 10. TypeScript tests

Add/extend tests for:
- general source resolver descendant semantics remain unchanged outside Content Identity;
- Content Identity rejects descendant host;
- canonical GOV.UK exact host passes;
- gateway sends no write after descendant-host/profile failure;
- default GOV.UK profile still succeeds;
- profile verifier not executed at registration;
- import dormancy/no network/no DB remains.

## 11. Migration / apply governance

This implementation may create and merge the migration file.

It **must not**:
- call `supabase db push`;
- call hosted `apply_migration`;
- execute the migration against Development;
- execute anything against Production;
- alter migration history remotely.

After independent merge/post-merge verification, a **new explicit Product-Owner Development apply approval** is required.

That approval may cover only this exact reviewed migration and must be followed by an independently named read-only verifier.

## 12. #791 separation

Do not solve ETA extractor semantics here.

Preserve:
`NO_SOURCE_FAMILY_PROVEN_YET`

This slice does not add:
- entry-clearance/permission predicates;
- Ireland/CTA exemption semantics;
- Appendix ETA content item;
- composition policy;
- extractor;
- Evidence;
- Rule fact;
- F8.

Those remain later, separate work.

## 13. Unapplied migration separation

Do not edit/apply:
`20261002154952_official_truth_owner_reviewer_capability_1.sql`

It remains intentionally unapplied.

Do not make any plain-db-push path safe by silently applying it.

The repository may continue to contain this LOCAL/UNAPPLIED migration.

## 14. Allowed material files

Production/runtime only as genuinely needed:
- `lib/readiness/source-registry.ts`
- `lib/readiness/official-truth-content-identity.ts`
- `lib/readiness/official-truth-source-catalog-server.ts` only if required by exact failure mapping; avoid unnecessary transport changes

Tests:
- source-registry tests
- content-identity R1/R2 tests
- source-catalog-server tests
- relevant disposable PostgreSQL migration/RPC tests
- schema-reference/security tests if the new table/migration requires them

Database:
- exactly one new migration created by the normal Supabase CLI flow

Docs:
- this immutable TASK
- `docs/OFFICIAL_TRUTH_V2_CATALOG_PROFILE_EXACT_HOST_HARDENING_1_REPORT_2026-10-04.md`
- `docs/OFFICIAL_TRUTH_V2_CATALOG_PROFILE_EXACT_HOST_HARDENING_1_HANDOFF_2026-10-04.md`
- `docs/OFFICIAL_TRUTH_V2_CATALOG_PROFILE_EXACT_HOST_HARDENING_1_SELF_REVIEW_2026-10-04.md`

If another runtime surface is genuinely required, STOP before expanding scope.

## 15. Explicit non-scope

Absolutely no:
- hosted Development DB mutation;
- Production DB mutation;
- Production Official Truth apply;
- direct modification of existing registered rows;
- profile verifier semantic change;
- GOV.UK content/profile re-registration;
- Appendix ETA registration;
- trusted-fact extractor;
- Rule/Evidence storage;
- composition policy;
- region pin activation;
- F8;
- Workspace wiring;
- Auth/AAL/role/RLS policy broadening;
- `20261002154952` apply/edit;
- provider/model calls;
- launch/indexing;
- recurring cost;
- follow-up slice.

## 16. Validation

Final tree:
- `git diff --check`
- `npm run check:operating-mode`
- focused source-registry/content-identity/catalog/migration tests
- disposable PostgreSQL migration-upgrade proof from existing S1-like state
- `npm test`
- `npm run typecheck`
- `npm run lint`
- `npm run check:api-schutz`
- `npm run check:schema-bezug`
- `npm run check:dead`
- `npm run check:exports`
- `npm run check:deps`
- `npm run build`

No fabricated PASS. Report environment limits exactly.

## 17. Delivery

Before delivery:
- re-read main/mode/#751/#748;
- confirm Workspace #833 remains file-disjoint;
- immutable task seed unchanged;
- exact changed files;
- exact migration filename/version;
- merge-base/ahead/behind;
- final head;
- review threads;
- exact Codex model/effort evidence;
- confirm no hosted DB/Vercel/Production mutation by writer.

Create REPORT, HANDOFF, SELF_REVIEW.

PR remains Draft.

**STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD EXACT-HEAD REVIEW.**

Do not Ready.
Do not merge.
Do not apply the migration.
Do not start #791/extractor/F8 follow-up.
