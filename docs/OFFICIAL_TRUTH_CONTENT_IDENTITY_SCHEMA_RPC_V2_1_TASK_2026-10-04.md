# Official Truth Content Identity Private Schema/RPC v2 1 — Task

Date: 4 October 2026
Issue: #810
Baseline: `main@65dadd97045b43e604511d0f8ce33b7c5ae0abc0`
Branch: `feat/official-truth-content-identity-schema-rpc-v2-1`
Logical writer: **Jetnity Official Truth content identity private schema/RPC v2 1**
Generation: **1**
Execution environment: **Codex Desktop**
Preferred model: **GPT-6 Astra — Sehr hoch**
Status: **SCHEMA/RPC DEFINITION ONLY / NO LIVE APPLY / NO REAL ROWS / NO R2 / NO F8**

## Purpose

Implement the separately versioned **S1** schema/RPC definition selected by the merged source-identity architecture and enabled by the merged R1 pure content-item identity foundation.

This slice creates and locally proves one forward Supabase migration for an **empty-data v2 cutover**. It must not apply that migration to Development or Production.

No real source, content item, representation, identity profile, CTA pin, extractor, policy or Official Truth fact is registered here.

Live evidence overrides this task if anything changes after the baseline.

## Binding startup / collision gate

Before material work:

1. fetch live `origin/main`;
2. require exact baseline `65dadd97045b43e604511d0f8ce33b7c5ae0abc0`, otherwise STOP and report;
3. read `.jetnity/operating-mode.json`, require `NORMAL`;
4. read Issue #751;
5. read only #748 MATERIAL newer than marker `5971622750`;
6. inspect open PRs/writers and confirm #810 / this branch is the only overlapping Official Truth writer;
7. read this complete task;
8. re-prove the current v1 schema/RPC contracts from repository code/migrations;
9. use read-only database inspection only if needed; **do not apply or mutate anything**.

At task creation, read-only live state was:
- Development `yfvbxvijcorffwxbxahl`: all current private Official Truth source/domain/Evidence/Rule/fact tables = **0 rows**;
- Production `qscbgcdmivbbnzrcyegn`: no `private` Official Truth tables.

Those observations are not permission to delete/backfill and are not an apply-time guarantee.

Read at minimum:

- `JETNITY_START_HERE.md`
- `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
- `docs/JETNITY_BINDING_SLICE_PRECHECK_AND_CONTINUITY_GATE_2026-08-29.md`
- `docs/OFFICIAL_TRUTH_SOURCE_IDENTITY_GRANULARITY_RECONCILIATION_1_2026-10-04.md`
- its REPORT / HANDOFF / SELF_REVIEW
- `docs/OFFICIAL_TRUTH_CONTENT_ITEM_IDENTITY_FOUNDATION_1_REPORT_2026-10-04.md`
- `docs/OFFICIAL_TRUTH_CONTENT_ITEM_IDENTITY_FOUNDATION_1_HANDOFF_2026-10-04.md`
- `lib/readiness/official-truth-content-identity.ts`
- `supabase/migrations/20261001121258_official_truth_private_evidence_store_schema_1.sql`
- `supabase/migrations/20261001180549_official_truth_trusted_store_writer_1.sql`
- `supabase/migrations/20261001193748_official_truth_source_catalog_gateway_1.sql`
- relevant existing disposable PostgreSQL tests, especially source-catalog/store schema tests
- `scripts/db/verwendung.mjs`
- `types/supabase.ts`

## File ownership

Material changes are limited to exactly **6 files**:

1. this immutable task seed;
2. exactly one new CLI-generated migration matching:
   `supabase/migrations/*_official_truth_content_identity_2.sql`
3. exactly one new focused disposable PostgreSQL test:
   `lib/readiness/official-truth-content-identity-schema-v2.test.ts`
4. `docs/OFFICIAL_TRUTH_CONTENT_IDENTITY_SCHEMA_RPC_V2_1_REPORT_2026-10-04.md`
5. `docs/OFFICIAL_TRUTH_CONTENT_IDENTITY_SCHEMA_RPC_V2_1_HANDOFF_2026-10-04.md`
6. `docs/OFFICIAL_TRUTH_CONTENT_IDENTITY_SCHEMA_RPC_V2_1_SELF_REVIEW_2026-10-04.md`

Do not edit any existing migration, runtime module, existing test, generated type file, package/config or db script.

If a repository gate truly requires another file, STOP and report the exact requirement instead of expanding silently.

## Migration creation

Create the migration using the available Supabase CLI command equivalent to:

`supabase migration new official_truth_content_identity_2`

Use the CLI-generated timestamp. **Do not invent or hand-type a timestamped migration filename.**

If the required CLI is unavailable, STOP rather than fabricating the migration filename.

The migration itself is repository code only. Do not run a linked Supabase apply/push/reset against Development or Production.

Disposable local PostgreSQL execution is allowed only inside the focused test.

## A. Locked empty-data cutover precondition

The migration must begin with a fail-closed precondition before material schema conversion.

Acquire appropriate table locks on the existing v1 Official Truth tables and re-prove that **all** existing source/domain/Evidence/Rule/support/fact tables contain zero rows, including at minimum:

- `private.official_sources`
- `private.official_source_domains`
- `private.official_evidence_versions`
- `private.official_rule_claims`
- `private.official_rule_claim_support`
- every current `private.official_rule_claim_*` dependent fact table.

If any relevant row exists:
- abort the migration;
- delete nothing;
- truncate nothing;
- do not infer a content identity;
- do not backfill from URL/title/hash/sourceId;
- do not partially create v2 objects.

The future live apply will repeat this gate; this slice only defines/tests it.

Tests must prove at least one nonempty source/catalog case, one nonempty Evidence case and one nonempty Rule/fact case abort the whole cutover with no partial v2 schema.

## B. Preserve authority/domain identity

Keep the meaning and existing rows/contracts of:

- `private.official_sources`
- `private.official_source_domains`

The hostname remains authority-level trust, not publication identity.

Do not change the domain PK into `(source_id, domain)`.
Do not allow multiple sourceIds to claim the same/overlapping authority domain.
Do not seed a source.

Add a private global blocked-domain structure sufficient for the accepted v2 catalog snapshot:
- normalized exact domain;
- deny semantics are server-owned;
- no browser/public writer;
- empty is an explicit valid state.

Do not introduce a real blocked-domain row in this migration.

## C. Content-item identity tables

Implement the accepted Option-A private structures, at minimum equivalent in meaning to:

### `private.official_content_items`

- authority-scoped PK `(source_id, content_item_id)`;
- FK to existing source;
- immutable external identity namespace/value;
- uniqueness of `(source_id, external_id_namespace, external_content_id)`;
- bounded id shapes matching R1;
- official-primary content items must not be writable under a licensed-provider authority.

### `private.official_content_item_versions`

- exact item FK;
- positive `content_item_version`;
- PK including item + version;
- bounded expected authority/publisher identity metadata;
- at most one current version per ContentItemRef;
- immutable append-only descriptor semantics;
- no executable JSON or legal effect fields.

### `private.official_content_representations`

- exact ContentItemRef + exact `content_item_version`;
- `representation_id` + positive `representation_version`;
- exact FK to item descriptor version;
- expected final URL;
- expected normalized media type;
- identity profile id/version;
- bounded locale/schema pins;
- at most one current representation version per stream;
- current representation may only point to the current item descriptor version.

### `private.official_content_representation_urls`

Must round-trip R1's finite exact request URLs and expected final URL and preserve the architecture's exact URL reservation semantics.

Required:
- exact canonical HTTPS structural checks;
- globally unambiguous URL ownership;
- a URL cannot be assigned to two item/representation streams;
- deterministic ordering where ordering is stored;
- historical URL reservation remains fail-closed in this slice;
- no wildcard/path-prefix/regex publication permission;
- no caller-defined executable expression.

A conservative all-version reservation is acceptable and preferred for S1; no retire/rebind transition is required here.

## D. Private security

Every new private table:
- lives in schema `private`;
- has RLS enabled and **FORCE RLS**;
- has no permissive anon/authenticated browser policy;
- grants no direct table DML to anon/authenticated/service_role;
- is reachable only through explicitly granted SECURITY DEFINER RPCs where required.

Do not redesign Auth, AAL, owner roles or reviewer capability.

All SECURITY DEFINER functions:
- `set search_path = ''`;
- schema-qualify relations/functions;
- revoke from public/anon/authenticated/service_role before explicitly granting only intended execute to `service_role`;
- use strict input shapes;
- do not swallow exceptions that should rollback.

## E. Evidence v2 empty cutover

Because the locked precondition proves v1 Evidence is empty, convert `private.official_evidence_versions` to the accepted identity-aware v2 contract without legacy guessing.

Add required non-null identity fields equivalent to R1:

- `identity_schema = 2`;
- `content_item_id`;
- `content_item_version`;
- `representation_id`;
- `representation_version`;
- `identity_profile_id`;
- `identity_profile_version`;
- normalized `content_type`.

Change structural format constraints:
- `version_id` => `^ev2_[a-f0-9]{32}$`;
- `lookup_key` => `^evidence-key:v3:[a-f0-9]{64}$`;
- `previous_version_id` => ev2/null only.

Bind Evidence to the exact source/item/item-version/representation/representation-version/profile tuple represented by the content catalog.

Preserve all existing regulatory-cell constraints, lifecycle/validation, URL/hash/time/validity rules and source FK semantics unless the merged architecture explicitly requires an identity-format version change.

### Previous-version lineage

For a non-null previous version, enforce:
- previous row already exists;
- same source;
- same content item;
- same representation stream;
- same lookup stream/regulatory cell;
- no self-reference;
- chronological predecessor;
- no cycle can be introduced by the insert-only accepted-store path.

Do not bridge:
- another authority;
- another content item;
- HTML to API representation;
- another regulatory cell;
- ev1 to ev2.

No synthetic previous-version backfill.

## F. Rule-support v2 identity

Upgrade `private.official_rule_claim_support` so the persisted support relation retains the exact item-aware Evidence tuple, not sourceId alone.

Requirements:
- support still references the exact Evidence version;
- source class remains official-primary for accepted Rule support;
- one Rule Claim cannot count two Evidence versions/renderings of the **same ContentItemRef** as two supports;
- explicit-primary accepted Rule support = exactly one distinct ContentItemRef;
- composed accepted Rule support = 2..8 distinct ContentItemRefs;
- two distinct content items under one sourceId are allowed for composed quality;
- support_version_ids remain Evidence version ids, not content item ids.

Do not add schema-1 applicability persistence.
Do not change existing Rule fact tables except the minimum FK/check compatibility required by the ev2 support cutover.

Official Action source ids remain authority-level source ids and are not composition supports.

## G. Source catalog v2 RPC

Create:

`public.official_truth_source_catalog_v2(jsonb)`

It must be SECURITY DEFINER / service-role-only and provide a deterministic transaction-consistent **identity_schema=2** catalog snapshot.

### Required `read_registry`

Return explicit sorted collections sufficient for future R2 to rebuild one complete graph without a second catalog read:

- sources + domains;
- blocked domains;
- content items;
- content-item versions;
- representations;
- exact representation URL bindings.

Empty catalog must be a valid explicit success with empty arrays.
Missing/invalid schema is not the same as empty.

### Required registration behavior

Support only the smallest reviewed structural operations needed for future first registration:

1. `register_source`
   - preserve v1 strict source/domain semantics;
   - exact duplicate idempotent;
   - differing duplicate/conflicting/overlapping source/domain fails and fully rolls back.

2. one strict atomic **initial content-item registration** operation
   - requires an existing `official_authority` source;
   - registers one new item identity + version 1 and its initial representation version(s)/exact URLs as one transaction;
   - no partial item without representation or partial representation URLs;
   - exact duplicate payload is idempotent;
   - same external identity under a second local item fails;
   - duplicate/reserved URL fails;
   - profile id/version is stored structurally only; database does not create executable profile authority;
   - does not infer or register from hostname/path/body/model data.

Do not implement path move/retire/rebind in S1.
Do not seed a source/item/profile.

### Retire v1 catalog

After v2 activation, `public.official_truth_source_catalog_v1(jsonb)` must fail explicitly as unsupported. It must not continue to return a source-only registry or register a source under stale semantics.

Use a clear fail-closed SQLSTATE such as feature-not-supported; test it.

## H. Accepted store v2 RPC

Create:

`public.official_truth_store_accepted_v2(jsonb)`

It remains service-role-only and strict.

Support the existing logical operations:
- accepted Evidence;
- accepted Rule Claim.

### Accepted Evidence

Require the complete v2 identity tuple and current structural eligibility.

The RPC must:
- require accepted/valid lifecycle state;
- require ev2/version-v3 formats;
- require source official authority for Official-primary Evidence;
- verify exact item/version/representation/profile/catalog FK consistency;
- verify canonical URL belongs to the registered representation;
- verify content type matches the registered representation;
- enforce previous-version lineage above;
- treat exact duplicate as idempotent;
- conflicting duplicate fails;
- insert no source/catalog row;
- never claim HTTP authenticity or legal completeness from SQL alone.

### Accepted Rule Claim

Preserve the existing canonical flat Rule-fact storage semantics and deferred fact payload completeness trigger.

Additionally:
- derive source/content identity from already stored accepted Evidence;
- explicit-primary => exactly one distinct ContentItemRef;
- composed => 2..8 distinct ContentItemRefs;
- duplicate representations/versions of one item cannot inflate support count;
- two distinct items under one sourceId may satisfy the identity-distinctness prerequisite;
- all supports share the same regulatory cell/rule scope as required by existing semantics;
- providers/stale/invalid Evidence remain ineligible;
- exact duplicate idempotence and conflicting duplicate rollback are preserved.

No schema-1 applicability fact storage is added.
No autonomous acceptance/F8 is added.

### Retire v1 store

After v2 activation, `public.official_truth_store_accepted_v1(jsonb)` must fail explicitly as unsupported. No v1 fallback.

## I. No generated/runtime cutover yet

This slice defines schema/RPC only.

Do **not** modify:
- `types/supabase.ts`;
- `scripts/db/verwendung.mjs`;
- source catalog runtime reader;
- store runtime writer;
- Evidence types/runtime;
- retrieval/proof/extractor/composition;
- Rule constructor;
- region pin.

There is intentionally no production caller of v2 RPCs yet.

If CI unexpectedly requires a generated type/script change, STOP and report the exact gate rather than widening scope.

## J. Focused disposable PostgreSQL test

Create exactly:

`lib/readiness/official-truth-content-identity-schema-v2.test.ts`

Use the repository's existing disposable PostgreSQL testing style. No linked Supabase project.

The test must apply the required prerequisite v1 migrations plus the new S1 migration to disposable databases and prove at minimum:

### Cutover gate

1. empty v1 state => S1 migration succeeds;
2. nonempty source/domain state => S1 aborts, no partial v2 objects;
3. nonempty Evidence => aborts;
4. nonempty Rule/support/fact state => aborts.

### Schema/security

5. exact new tables/keys/checks exist;
6. v2 Evidence requires ev2/v3 + identity fields;
7. content current-version uniqueness;
8. external-id uniqueness;
9. URL reservation uniqueness;
10. provider source cannot own official content item;
11. RLS enabled + FORCE RLS;
12. no direct table DML grants;
13. v2 RPC execute service_role only;
14. v1 catalog/store explicitly unsupported.

### Catalog v2

15. empty read_registry returns identity_schema=2 and explicit sorted empty arrays;
16. register_source insert/idempotent/conflict;
17. cross-source equal/parent-child overlap fails;
18. valid initial item registration succeeds;
19. exact item registration duplicate is idempotent;
20. external identity conflict fails atomically;
21. duplicate URL across items/streams fails atomically;
22. wrong/unregistered/provider source fails;
23. deterministic read order;
24. no real seed row exists.

### Store v2

25. valid accepted ev2 Evidence inserts;
26. exact duplicate idempotent;
27. conflicting duplicate fails;
28. ev1 or lookup-v2 rejected;
29. wrong item/version/representation/profile/url/content-type fails;
30. predecessor same stream chronological succeeds;
31. cross-item/representation/scope/nonchronological predecessor fails;
32. explicit-primary one item accepted;
33. explicit-primary multiple items rejected;
34. composed same item twice/two representations rejected;
35. composed two distinct items under same sourceId accepted as identity prerequisite;
36. provider/invalid support rejected;
37. existing fact-payload completeness trigger remains effective;
38. transaction rollback leaves no partial support/fact rows.

### Concurrency

39. concurrent/conflicting registration of the same external identity or URL cannot produce split ownership;
40. exact duplicate concurrent registration is idempotent or one succeeds and the other resolves to exact idempotence after serialization, never two owners.

Use synthetic `.example` names/ids only.

## K. Static safety assertions

The focused test must also assert the migration contains no real-source seed or hard-coded GOV.UK/CTA registration.

Repository scope review must prove:
- no runtime importer added;
- no Development/Production apply command/script added;
- no secrets;
- no Auth/RLS role widening;
- no F8/R2.

## Required outputs

Create:
- `docs/OFFICIAL_TRUTH_CONTENT_IDENTITY_SCHEMA_RPC_V2_1_REPORT_2026-10-04.md`
- `docs/OFFICIAL_TRUTH_CONTENT_IDENTITY_SCHEMA_RPC_V2_1_HANDOFF_2026-10-04.md`
- `docs/OFFICIAL_TRUTH_CONTENT_IDENTITY_SCHEMA_RPC_V2_1_SELF_REVIEW_2026-10-04.md`

The immutable task seed remains byte-identical.

Report exact:
- final head;
- generated migration filename;
- migration CLI/tool version if available;
- changed files;
- disposable DB test results;
- full CI/type/lint/build results;
- no live apply;
- no real rows;
- v1 retirement behavior;
- v2 RPC security/grants;
- classification exactly one:
  - `CONTENT_IDENTITY_SCHEMA_RPC_V2_READY_FOR_DEVELOPMENT_APPLY`
  - `CONTENT_IDENTITY_SCHEMA_RPC_V2_BLOCKED`

## Required validation before STOP

- re-fetch live main/mode/#751/#748;
- confirm no writer collision;
- `git diff --check`;
- exactly 6 changed files;
- task seed byte-identical;
- migration filename CLI-generated;
- focused disposable PostgreSQL tests;
- directly affected existing source-catalog/store schema tests;
- full `npm test`;
- `npm run typecheck`;
- `npm run lint`;
- canonical Production build;
- operating-mode guard;
- schema-use/hygiene checks;
- inspect final diff for forbidden live apply/runtime/generated-type changes;
- exact final head.

If local macOS lacks PostgreSQL 16 binaries, do not fake green. Record the local limitation and require exact-head Linux CI to close the database-test gate.

## Delivery

Remain Draft.
Do not mark Ready.
Do not merge.
Do not apply the migration anywhere.
Do not start Development apply, R2 or real registration.

Report exact final head/model/migration/test results/classification and STOP for independent Technical-Lead exact-head review.
