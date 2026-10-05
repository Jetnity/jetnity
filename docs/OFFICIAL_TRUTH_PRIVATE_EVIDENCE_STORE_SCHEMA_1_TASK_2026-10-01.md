# Official Truth Private Evidence Store Schema 1 — Binding Task v1.0

Date: 1 October 2026
Issue: #674
Branch: `feat/official-truth-private-evidence-store-schema-1`
Baseline: `main@0d6ff1846fe49ba614174c62b542373fc5454667`

Cursor-Agent: **Jetnity Official Truth private evidence store schema 1**
Generation: **1**
Required model: **Grok 4.7 High Fast** — not Auto.

## 1. Authority and parent

Product-Owner source strategy:
- Issue #294 comment `5928669189`.

Parent foundation:
- Issue #672 / PR #673
- merged `main@0d6ff1846fe49ba614174c62b542373fc5454667`
- ADR-0216
- `docs/OFFICIAL_TRUTH_SOURCE_EVIDENCE_ARCHITECTURE_2026-10-01.md`

PR #673 is MERGED / POST-MERGE VERIFIED / CLOSED:
- post-merge CI `36852815814` SUCCESS
- Auth job `110338210438` SUCCESS
- Typecheck/Lint/Build job `110338210341` SUCCESS
- Vercel Production `dpl_Fnmc5RTZrxNdB3EcWu5mqr3Wq8ry` READY on exact merge SHA.

## 2. Live state to reconstruct before editing

Re-fetch `main`, open PRs/issues and relevant schema files.

At task creation:
- `main = 0d6ff1846fe49ba614174c62b542373fc5454667`
- machine mode NORMAL
- no active current product/runtime writer
- historical Draft PRs #52/#50/#40/#39/#28 are not current writers
- #626 remains OPEN/BLOCKED; do not touch it
- KAYAK/IATA/Sherpa/PrivacyBee gates unchanged
- public indexing/launch remains closed

Supabase read-only precheck:
- Production project: `qscbgcdmivbbnzrcyegn`
- Development branch/ref: `develop` / `yfvbxvijcorffwxbxahl`
- Development ACTIVE_HEALTHY
- no Official Evidence tables exist
- Development `private` currently has no tables/functions
- `pg_cron` is installed; `pgmq` is not installed
- this slice must not enable/use scheduler/queue.

Current Supabase guidance:
- internal tables should remain in an unexposed schema when they are not a browser API;
- grants determine Data API reachability, RLS controls rows after exposure;
- do not rely on implicit/default grants;
- do not expose service-role credentials client-side.

## 3. Goal

Create the **first typed persistence schema** for global, reusable, non-personal Jetnity Official Evidence.

This is schema/contracts/tests only.

Cursor MUST NOT apply the migration to any remote Supabase project.

After independent Technical-Lead exact-head PASS, the Technical Lead may apply the accepted migration to **Development only** and run readback + security/performance advisors. Production remains separately gated.

## 4. Canonical semantics to persist

The database must preserve the merged TypeScript contract without inventing a second truth model.

### 4.1 Source Registry

Persist registered sources and domains separately.

Expected logical entities:

#### `private.official_sources`
At minimum:
- stable `source_id`
- `source_class`: `official_authority | licensed_evidence_provider`
- `publisher_name`
- `authority_name` nullable with class-consistency checks
- created/updated timestamps only if justified

Constraints:
- source id consistent with TypeScript source-id contract
- official authority requires authority name
- licensed evidence provider has no authority name
- no provider is mislabeled as government authority
- no real source rows in this migration.

#### `private.official_source_domains`
At minimum:
- `source_id` FK
- normalized domain
- deterministic uniqueness

Constraints should reject clearly malformed forms (scheme/path/credentials/port/wildcard/whitespace) without pretending SQL can prove DNS ownership.

No real authority-domain catalog is seeded.

### 4.2 Evidence Versions

Expected logical entity:

#### `private.official_evidence_versions`

Persist the contract from `lib/readiness/evidence.ts`, including:
- `version_id`
- `previous_version_id` nullable self-reference
- lifecycle: `candidate | accepted | conflicted | superseded`
- validation state: `pending | valid | rejected`
- `source_id`
- `canonical_url`
- `retrieved_at`
- `source_content_hash`
- `valid_from` / `valid_until`
- `lookup_key`
- `extraction_note`

Persist the reusable scope as typed columns, not one opaque JSON truth blob:
- destination country
- transit country
- citizenship mode + citizenship country-code set
- credential-option mode
- document type
- issuing country
- related citizenship country nullable
- residence mode + residence country
- requirement type
- validity mode + travel date

### 4.3 Important representation requirements

Preserve the current TypeScript semantics losslessly:

- `validFrom/validUntil` accept either date-only `YYYY-MM-DD` **or** a timestamp. Do not silently convert date-only semantics into an instant. Choose an explicit lossless representation and document it.
- `retrieved_at` is an actual retrieval instant.
- `source_content_hash` is 64 lowercase hex and represents trusted source material, not model prose.
- `lookup_key` is the current `evidence-key:v2:<sha256>` contract.
- `version_id` follows the current `ev1_<32 hex>` contract.
- destination and transit remain distinct; at least one target must be known.
- issuer country is never citizenship.
- `related_citizenship_country_code` is only an explicit relation; null remains unlinked.
- if a related citizenship is non-null, it must belong to the persisted citizenship set.
- no Primary/Default/Preferred citizenship/passport field.
- no user/account/trip/traveller/document client identifiers.
- no passport/document number, MRZ, scan, biometric, DOB, health record.
- `unknown` must never be represented by absence in a way that implies `not_required`.

### 4.4 Taxonomy synchronization

The migration and static tests must stay synchronized with:
- `OFFICIAL_REQUIREMENT_TYPES`
- `TRAVELLER_DOCUMENT_TYPES`
- `EVIDENCE_LIFECYCLES`
- `EVIDENCE_VALIDATION_STATES`
- source classes
- lookup/version format contracts.

Do not manually introduce a narrower SQL enum/check that silently rejects a current valid TypeScript value.

## 5. Security boundary

This store is global Jetnity infrastructure, not user-owned browser data.

Requirements:
- use an **unexposed internal/private schema**;
- no direct browser/client table writes;
- no public API table exposure;
- no public wrapper/RPC in this slice;
- no SECURITY DEFINER function in this slice;
- no runtime service-role secret or client code;
- explicitly revoke unintended access from `PUBLIC`, `anon`, and `authenticated`;
- do not grant table writes to browser roles;
- do not grant direct browser reads merely for convenience;
- RLS may be enabled as defense-in-depth, but do not add fake user ownership policies to global evidence;
- do not add the private schema to exposed schemas;
- do not change unrelated global/default privileges.

A later server-only store adapter / controlled read-write path is a separate slice.

## 6. Database integrity

Prefer database constraints for facts the DB can prove.

Include appropriate:
- PKs/FKs
- uniqueness
- mode-specific nullability checks
- ISO-2 shape checks (shape only; do not pretend SQL proves geopolitical validity)
- source class/authority consistency
- lifecycle/validation values
- hash/key/version formats
- validity-window consistency
- useful indexes for:
  - lookup-key retrieval ordered by newest retrieval
  - source history
  - accepted evidence lookup if a partial index is clearly justified.

Do not create:
- triggers
- cron jobs
- queues
- webhooks
- HTTP calls
- seed rows
- refresh jobs
- cleanup jobs.

## 7. Migration creation rule

Before creating the migration:
- inspect repository migration conventions;
- use `supabase migration new official_truth_private_evidence_store_schema_1` to create the migration file if the CLI is available;
- **do not invent a migration timestamp/filename manually**;
- if the CLI is unavailable, STOP and report that exact blocker instead of guessing.

Do not apply, push, repair or merge any Supabase remote migration history.

## 8. Required static tests

Create a focused repository test, expected path:

`lib/readiness/evidence-store-schema.test.ts`

It must inspect the migration text and prove at least:
- migration creates only the expected Official Evidence schema objects;
- no INSERT/seed data;
- no cron/pgmq/net/http;
- no SECURITY DEFINER;
- no grant to anon/authenticated for table access;
- no public schema evidence tables/functions;
- no personal/sensitive column names;
- all TypeScript taxonomy values are represented in SQL constraints;
- version/hash/lookup formats align with the merged code contract;
- credential relation / issuer != citizenship invariant is represented;
- date-only vs instant validity can be stored losslessly;
- key lookup/source-history indexes are present;
- no source catalog rows.

Do not make fragile tests that pass on comments alone; inspect meaningful SQL patterns/structure.

## 9. Docs / ADR

Update:
- `ARCHITECTURE.md`
- `DECISIONS.md` with ADR-0217 if still free after re-fetch
- `docs/OFFICIAL_TRUTH_SOURCE_EVIDENCE_ARCHITECTURE_2026-10-01.md`

Create:
- `docs/OFFICIAL_TRUTH_PRIVATE_EVIDENCE_STORE_SCHEMA_1_TASK_2026-10-01.md`
- `docs/OFFICIAL_TRUTH_PRIVATE_EVIDENCE_STORE_SCHEMA_1_REPORT_2026-10-01.md`
- `docs/OFFICIAL_TRUTH_PRIVATE_EVIDENCE_STORE_SCHEMA_1_HANDOFF_2026-10-01.md`
- `docs/OFFICIAL_TRUTH_PRIVATE_EVIDENCE_STORE_SCHEMA_1_SELF_REVIEW_2026-10-01.md`

Docs must distinguish:
- repository migration exists
- Development remote migration is **not** applied by Cursor
- Production remote migration is not authorized/applied
- no real evidence rows exist
- no store adapter/runtime writer exists yet.

## 10. Exact allowlist

Only:
- exactly one generated `supabase/migrations/*_official_truth_private_evidence_store_schema_1.sql`
- `lib/readiness/evidence-store-schema.test.ts`
- `ARCHITECTURE.md`
- `DECISIONS.md`
- `docs/OFFICIAL_TRUTH_SOURCE_EVIDENCE_ARCHITECTURE_2026-10-01.md`
- `docs/OFFICIAL_TRUTH_PRIVATE_EVIDENCE_STORE_SCHEMA_1_TASK_2026-10-01.md`
- `docs/OFFICIAL_TRUTH_PRIVATE_EVIDENCE_STORE_SCHEMA_1_REPORT_2026-10-01.md`
- `docs/OFFICIAL_TRUTH_PRIVATE_EVIDENCE_STORE_SCHEMA_1_HANDOFF_2026-10-01.md`
- `docs/OFFICIAL_TRUTH_PRIVATE_EVIDENCE_STORE_SCHEMA_1_SELF_REVIEW_2026-10-01.md`

If anything else is needed, STOP and report. Do not widen the allowlist.

## 11. Hard non-scope

No:
- remote Supabase mutation by Cursor
- Production DB mutation
- Development DB mutation by Cursor
- seed/candidate/real evidence rows
- Source Monitor / refresh runtime
- pg_cron / pgmq / queue
- OpenAI/web/browser/provider calls
- Sherpa/Timatic adapter
- provider contact/credentials/terms/spend
- `requirementsProviderAus()` activation
- API/UI changes
- public indexing/launch
- #626 work
- sensitive traveller persistence
- follow-up slice dispatch.

## 12. Validation before handoff

- re-fetch `main`; prove 0 behind
- changed files exactly in allowlist
- `git diff --check`
- operating-mode guard
- targeted schema test
- full `npm test`
- typecheck/lint/build
- standard hygiene checks
- confirm no remote DB mutation occurred
- exact-head GitHub CI/Auth + Vercel Preview
- record session URL + actual `originalModelName`
- STOP for independent TL review.

## 13. Stop

Stay Draft.

Do not Ready.
Do not merge.
Do not apply migration remotely.
Do not start the next slice.

**STOP for independent main-chat Technical-Lead exact-head review.**
