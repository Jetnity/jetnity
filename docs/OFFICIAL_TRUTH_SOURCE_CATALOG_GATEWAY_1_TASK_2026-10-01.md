# Official Truth Source Catalog Gateway 1 — Binding Task

Date: 1 October 2026
Issue: #684
Baseline: `main@9c494110196a2877f6eba3babe7cf5ae7c00acf1`
Logical agent: **Jetnity Official Truth source catalog gateway 1**
Generation: **1**
Required model: **Grok 4.7 High Fast** — not Auto.

## Goal
Add a dormant trusted server-only Source Catalog gateway over the existing private `official_sources` and `official_source_domains` tables.

The existing `lib/readiness/source-registry.ts` remains canonical. Do not create a second trust model.

## Server module
Create:
`lib/readiness/official-truth-source-catalog-server.ts`

Requirements:
- `import 'server-only'`;
- use Supabase service-role credentials only server-side;
- no direct private-table Data API calls;
- expose a read function returning a `QuellenRegistry` built through `quellenRegistryErstellen(...)`;
- expose a register function for exactly one `QuellenEingabe`;
- before write, combine existing catalog + proposed source and validate with `quellenRegistryErstellen`;
- fail closed on invalid authority/provider combinations and overlapping domains;
- missing credentials => fail closed;
- no key leakage.

## Database gateway
Create exactly one migration via:
`supabase migration new official_truth_source_catalog_gateway_1`

Never invent the timestamp.

Create exactly one RPC:
`public.official_truth_source_catalog_v1(jsonb)`

Allowed operations only:
- `read_registry`
- `register_source`

Security:
- SECURITY DEFINER;
- empty search_path;
- schema-qualified references;
- revoke PUBLIC/anon/authenticated/service_role then grant EXECUTE only to service_role;
- no direct table grants;
- no policy;
- no dynamic SQL.

`register_source`:
- one source + its domains atomically;
- no UPDATE/DELETE;
- exact duplicate may be idempotent only when all source fields and complete domain set match;
- conflicting duplicate fails closed;
- independently reject exact and parent/child domain overlap against stored rows;
- never move a domain between sources.

No real catalog rows may be included.

## Schema-reference ownership
This lane alone may edit:
- `scripts/db/verwendung.mjs`
- `lib/admin/account-counts-delivery/schema-reference.test.ts`

Register the literal RPC as LOCAL/UNAPPLIED pinned to the exact server source path and exact migration path. No generic exemption.

## Tests
Create:
`lib/readiness/official-truth-source-catalog-server.test.ts`

Prove at minimum:
- canonical `quellenRegistryErstellen` validation is used;
- invalid source cannot reach RPC;
- official_authority requires authority;
- licensed provider cannot carry authority;
- exact overlap and parent/child overlap fail;
- exact duplicate idempotent;
- conflicting duplicate and partial domain failure rollback atomically;
- anon/authenticated cannot execute;
- service_role can execute gateway but cannot directly read/write private tables;
- migration has zero seed rows;
- read returns deterministic registry;
- missing credentials fail closed;
- `requirementsProviderAus()` remains null.

Use synthetic *.example data only.

## Non-scope
No real government/provider rows, no CH Candidate Evidence import, no OpenAI/web/provider calls, no runtime activation, no Source Monitor, no UI, no Production DB, no #626, no indexing/launch.

## File allowlist
Only:
- `lib/readiness/official-truth-source-catalog-server.ts`
- `lib/readiness/official-truth-source-catalog-server.test.ts`
- exactly one `supabase/migrations/*_official_truth_source_catalog_gateway_1.sql`
- `scripts/db/verwendung.mjs`
- `lib/admin/account-counts-delivery/schema-reference.test.ts`
- this task file
- `docs/OFFICIAL_TRUTH_SOURCE_CATALOG_GATEWAY_1_REPORT_2026-10-01.md`
- `docs/OFFICIAL_TRUTH_SOURCE_CATALOG_GATEWAY_1_HANDOFF_2026-10-01.md`
- `docs/OFFICIAL_TRUTH_SOURCE_CATALOG_GATEWAY_1_SELF_REVIEW_2026-10-01.md`

Do not edit global continuity files. Do not edit `source-registry.ts`; if truly blocked, stop and report.

## Validation / stop
Run focused tests, full tests, typecheck, lint, build, schema-reference hygiene, diff check.
Push one exact head, stay Draft, record session/model, STOP.
Cursor does not apply remotely, Ready, merge, seed real data, or start a follow-up slice.
