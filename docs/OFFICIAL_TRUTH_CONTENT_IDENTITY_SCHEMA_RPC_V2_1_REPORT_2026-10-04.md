# Official Truth content identity private schema/RPC v2 1 — Report

Date: 4 October 2026. Issue #810; Draft PR #811; Generation 1.
Branch: `feat/official-truth-content-identity-schema-rpc-v2-1`.
Baseline: `65dadd97045b43e604511d0f8ce33b7c5ae0abc0`.
Immutable dispatch: `404b1adcd91a96921d5a6176729d368732c2705f`.
Execution: Codex Desktop, **gpt-6-astra**, reasoning effort **xhigh** (GPT-6 Astra — Sehr hoch).

## Status and boundary

Classification while exact-head Linux database validation is pending: **CONTENT_IDENTITY_SCHEMA_RPC_V2_BLOCKED**.
The final delivery SHA and exact-head CI result are recorded in PR #811's body and the writer's delivery message. A file cannot contain the SHA of the commit containing its own final bytes.

This is S1 schema/RPC definition only. No Development or Production apply, Supabase db push, linked reset, live mutation, real source/item/profile/blocked-domain registration, GOV.UK/CTA registration, runtime v2 caller, generated type change, R2 or F8 occurred. The PR remains Draft. Ready, merge and later apply require separate Technical Lead decisions.

## CLI provenance and exact scope

The Technical Lead approved `npx --yes supabase@2.48.3` after the global CLI was unavailable. `npx --yes supabase@2.48.3 --version` reported **2.48.3**. The sole generation command was:

```sh
npx --yes supabase@2.48.3 migration new official_truth_content_identity_2
```

The CLI generated `supabase/migrations/20261004010705_official_truth_content_identity_2.sql`. Its filename/timestamp were never changed. The external npx cache was used. No CLI project dependency or Homebrew installation was introduced. `package.json` and `package-lock.json` remain byte-identical to dispatch. The ignored `supabase/.temp/cli-latest` file produced by the CLI was removed after it triggered the existing sanitation test; no existing tracked file was changed.

Exactly six changed files relative to baseline:

1. `docs/OFFICIAL_TRUTH_CONTENT_IDENTITY_SCHEMA_RPC_V2_1_TASK_2026-10-04.md` — existing immutable dispatch seed, unchanged by this writer.
2. `supabase/migrations/20261004010705_official_truth_content_identity_2.sql`.
3. `lib/readiness/official-truth-content-identity-schema-v2.test.ts`.
4. `docs/OFFICIAL_TRUTH_CONTENT_IDENTITY_SCHEMA_RPC_V2_1_REPORT_2026-10-04.md`.
5. `docs/OFFICIAL_TRUTH_CONTENT_IDENTITY_SCHEMA_RPC_V2_1_HANDOFF_2026-10-04.md`.
6. `docs/OFFICIAL_TRUTH_CONTENT_IDENTITY_SCHEMA_RPC_V2_1_SELF_REVIEW_2026-10-04.md`.

## Implemented contract

The migration encloses cutover in one transaction. ACCESS EXCLUSIVE locks precede material DDL. Exact row counts include sources, domains, Evidence, Rule Claims, support and every present dependent fact table. Any row raises SQLSTATE 55000 and rolls everything back; no deletion, truncation, guessing or backfill occurs. A future apply must re-prove emptiness under these locks.

Authority/domain identity and the existing domain primary key remain intact. Six new private tables hold blocked domains, immutable item identity, item versions, representations, permanent URL reservations and per-version exact URL bindings. The additional reservation table makes ownership global across all historical versions while permitting one representation stream to reuse its own URL. Descriptor updates/deletes and Evidence updates/deletes are unsupported; no transition/rebind operation is exposed.

Item identity is `(source_id, content_item_id)`. External identity is unique within its authority. Composite source-class FK excludes providers. Partial unique indexes enforce one current item/representation version, and deferred completion requires current representations to reference current items, stable media/locale per stream, 1..16 contiguous sorted request URLs and exactly one matching final URL. Publisher/authority identifiers are unique sorted bounded arrays. Exact canonical HTTPS structural checks reject credentials, non-default/explicit ports, fragments, wildcard permission, dot-segments, local/IP hosts and malformed percent escapes. Path/query bytes and query order are preserved. Request and final URLs must match the authority domains and global deny list.

Evidence requires identity schema 2, ev2/v3 formats and an exact nine-column catalog FK including item/version, representation/version, profile/version, media type and final URL. All existing regulatory-cell/hash/time/validity/lifecycle constraints remain. A predecessor must already exist, share authority/item/representation/lookup and actual regulatory-cell columns, and have strictly earlier retrieval time. Insert-only acceptance plus immutability prevents cycles.

Rule support retains the exact Evidence identity, accepted/valid state, official authority and same Rule scope. A unique claim/item key prevents two versions or renderings from counting twice. Deferred counts enforce explicit-primary = 1 and composed = 2..8 distinct ContentItemRefs. Two items under one authority are eligible for identity distinctness. The eight existing flat fact tables and deferred fact completeness implementation remain unchanged. No schema-1 applicability is persisted; action source IDs retain authority semantics.

## RPC and security

`public.official_truth_source_catalog_v2(jsonb)` exposes only `read_registry`, `register_source` and atomic initial `register_content_item`. Read uses one statement snapshot and explicit sorted arrays: sources (with domains), blocked_domains, content_items, item_versions, representations, representation_urls and url_reservations, plus `identity_schema: 2`. Empty is explicit success. Initial registration takes a complete item version 1/current descriptor and 1..16 distinct version 1/current representations. Exact duplicate is idempotent; differing duplicate/external/URL/domain overlap fails atomically. Explicit nullable pins and all required fields are mandatory; unknown/coercible fields are rejected. Profile identifiers are structural data only.

`public.official_truth_store_accepted_v2(jsonb)` retains accepted Evidence/Rule operations, strict typed shapes, all eight flat fact transports, duplicate comparison and transactional rollback. Eligibility is checked before duplicate success. Stored supports must be accepted/valid, current and authorized, share the actual regulatory cell, and satisfy item distinctness. Stale quality/lifecycle and historical descriptors fail. No arbitrary wall-clock freshness policy or digest derivation is introduced: trusted future code remains responsible for semantic freshness, digest authenticity, scope derivation, HTTP identity and legal completeness.

Both v2 functions are SECURITY DEFINER with empty search_path and schema-qualified relations/helpers. Execution is revoked from PUBLIC/anon/authenticated/service_role then granted only to service_role. Every new table has ENABLE/FORCE RLS, no policies and no API-role direct grants; private helper EXECUTE is revoked. Both v1 RPCs unconditionally raise 0A000 (feature_not_supported) for service_role; browser roles cannot execute them. There is no v1 fallback.

Writes require READ COMMITTED and serialize catalog/store locks in a consistent order. This deliberately rejects repeatable-read/serializable writes instead of accepting a stale pre-lock snapshot. Unique external identity and permanent URL keys provide a second ownership barrier. The single-statement reader needs no writer lock and sees a complete committed graph.

## Validation

Local macOS database limitation: **`spawnSync /usr/lib/postgresql/16/bin/initdb ENOENT`**. The Linux PostgreSQL 16 binaries are absent. No database test is skipped or presented as locally green. Exact-head Linux CI is required to close this gate.

- Full local `npm test`: **4,677 tests; 4,674 pass; 3 fail; 0 skipped**. All three failures are missing PostgreSQL 16: the new S1 fixture and the existing source-catalog/store disposable fixtures.
- New focused static test: PASS; new disposable test: FAIL with the exact ENOENT above.
- Directly affected existing schema/catalog/store tests plus S1: **40 tests; 37 pass; 3 fail; 0 skipped**, solely the missing PostgreSQL binaries.
- `npm run typecheck`: PASS.
- `npm run lint`: PASS, 0 errors / 149 existing warnings; no warning in the new test. Canonical `npm run build`: PASS (sandbox IPC restriction on first attempt; unchanged command succeeds with local execution approval).
- `check:operating-mode`, `check:api-schutz`, `check:schema-bezug`, `check:dead`, `check:exports`, `check:deps`: PASS; no generated-type/script exception required.
- Live pre-publication fetch: exact baseline retained, mode NORMAL, #751 names #810/#811 sole overlapping writer, no #748 MATERIAL after marker 5971622750, other open PRs are historical.
- `git diff --check`, scope, package and immutable-task checks: PASS at checkpoint; repeated before final STOP.
- Exact-head Linux CI: pending. This checkpoint does not claim database green.

The disposable fixture uses synthetic `.example` identities only, an environment whitelist without inherited database credentials, an ephemeral Unix-socket-only PostgreSQL cluster and no TCP listener. It applies the four v1 prerequisites plus S1 to disposable databases. Coverage includes empty/nonempty cutover rollback, every security surface, deterministic R1 graph reconstruction, external/URL/current constraints, strict registration/store parsing, lineage, eight fact families, support cardinality, late rollback, multi-call transactions and genuine concurrent duplicate/external/URL/domain/store races.
