# Official Truth Source Catalog Gateway 1 — Handoff

Date: 1 October 2026
Issue: #684
Draft PR: #686
Branch: `feat/official-truth-source-catalog-gateway-1`
Baseline: `main@9c494110196a2877f6eba3babe7cf5ae7c00acf1`

Logical agent: **Jetnity Official Truth source catalog gateway 1**, Generation 1
Session: https://cursor.com/agents/bc-b1db9c5e-3aa7-442a-8ccf-7421a1ac8257
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

## Current state

The repository contains a dormant source-catalog gateway. It has not been applied to Development or Production. Merge remains held. There is no merge PASS.

Server module:

`lib/readiness/official-truth-source-catalog-server.ts`

Migration, created by Supabase CLI `2.48.3` and not renamed:

`supabase/migrations/20261001182728_official_truth_source_catalog_gateway_1.sql`

SHA-256: `78e17e41f987fbedb8d56d15021730eef76af0b3477bc03061165745f4fc2124`

Read first:

1. `docs/OFFICIAL_TRUTH_SOURCE_CATALOG_GATEWAY_1_TASK_2026-10-01.md`
2. `docs/OFFICIAL_TRUTH_SOURCE_CATALOG_GATEWAY_1_REPORT_2026-10-01.md`
3. `docs/OFFICIAL_TRUTH_SOURCE_CATALOG_GATEWAY_1_SELF_REVIEW_2026-10-01.md`
4. `lib/readiness/source-registry.ts`
5. `supabase/migrations/20261001121258_official_truth_private_evidence_store_schema_1.sql` for the private tables this gateway uses

`source-registry.ts` remains canonical. Do not start a second trust model. Do not edit the freshness lane or global continuity files from this lane.

## Session facts

- Machine mode: `NORMAL`. `.jetnity/operating-mode.json` was not edited.
- The binding baseline is `main@9c494110196a2877f6eba3babe7cf5ae7c00acf1`. Re-fetch before treating any later SHA as current. Do not rebase this lane onto a newer main unless the Technical Lead assigns that.
- Local proof: throwaway PostgreSQL 16.15, dropped after the test. Development was not queried. Production was not contacted.
- Local validation recorded before the push of this head:
  - focused catalog tests: 4 pass / 0 fail
  - schema-reference tests: 4 pass / 0 fail
  - `npm test`: 4182 pass / 0 fail
  - `npm run typecheck`: pass
  - `npm run lint`: 0 errors, 148 warnings, none in this lane
  - `npm run build`: pass, Next.js 16.3.8, 25 static pages
  - dead-code 0, unused exports 0, unused packages 0, API protection PASS, operating-mode guard PASS, `git diff --check` pass
  - `check:schema-bezug`, after the new server file was indexed: LOCAL/UNAPPLIED for `official_truth_source_catalog_v1` from `lib/readiness/official-truth-source-catalog-server.ts` to `supabase/migrations/20261001182728_official_truth_source_catalog_gateway_1.sql`, beside the two existing registrations
- `db:rechte`, `db:rls`, `db:sicherheit`, and `auth:pruefen` were not run locally. They talk to live Development. GitHub CI may still run `auth:pruefen`. That is not an apply of this migration.
- Exact-head GitHub CI, Auth, and Vercel Preview belong to the pushed tip. This file does not embed a run id, because writing one after the run would create a newer head. Read the checks on the tip SHA.

## Gateway boundary

- Public functions: `quellenKatalogLesen` and `quelleRegistrieren`.
- Canonical validation: `quellenRegistryErstellen` before a write, and again for every read.
- Exact duplicate: idempotent no-op when source fields and the complete domain set match.
- Conflicting duplicate: fail closed. No update and no delete. A domain is never moved between sources.
- Cross-source exact and parent/child overlap fail. Parent/child on the same new source follows the canonical registry and is stored.
- A single-label host is `invalid_domain`.
- A stored catalog that `quellenRegistryErstellen` rejects fails closed. Do not repair it inside this function.
- No direct grant on `private.official_sources` or `private.official_source_domains`.
- Missing `NEXT_PUBLIC_SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY` returns `catalog_not_configured`.
- `requirementsProviderAus()` stays `null`.
- Do not import Candidate Evidence or CH research. Do not seed a real source. Do not apply, repair, reset, or push this migration.

## Schema reference

`scripts/db/verwendung.mjs` registers exactly three LOCAL/UNAPPLIED RPCs:

- `admin_account_counts_v1`
- `official_truth_store_accepted_v1`
- `official_truth_source_catalog_v1` from `lib/readiness/official-truth-source-catalog-server.ts` to `supabase/migrations/20261001182728_official_truth_source_catalog_gateway_1.sql`

The call site is the string literal `.rpc('official_truth_source_catalog_v1', ...)`. The exported constant is not the call. An unknown name, a call from another file, and a missing SQL file still fail.

## Stop

Stay Draft.

Cursor does not Ready, merge, apply remotely, seed real data, or start a follow-up slice. The next action is independent Technical-Lead review of the exact pushed head.
