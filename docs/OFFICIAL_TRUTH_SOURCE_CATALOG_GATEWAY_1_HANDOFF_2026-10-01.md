# Official Truth Source Catalog Gateway 1 — Handoff

Date: 1 October 2026
Issue: #684
Draft PR: #686
Branch: `feat/official-truth-source-catalog-gateway-1`
Original baseline: `main@9c494110196a2877f6eba3babe7cf5ae7c00acf1`
Integrated main: `main@98c9099bee1715f741e4aec87c2c386e9e5344ad`

Logical agent: **Jetnity Official Truth source catalog gateway 1**, Generation 1
Session: https://cursor.com/agents/bc-b1db9c5e-3aa7-442a-8ccf-7421a1ac8257
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

## Current state

The repository contains a dormant source-catalog gateway. Technical-Lead R3 applied that SQL exactly once to Development under history version `20261001193748`. This lane does not apply it again. Production was not changed. Merge remains held. There is no merge PASS.

Technical-Lead R1 review `5384194385` accepted catalog code and schema on `1f27a61f998f35cb2d17a574a56c92ae04977ea5`. The only required change was base freshness. This branch contains `main@ed5350e702f2b6b248cf49ae366420cf1b49039a` through merge `66852a163a5a7638f5dd48e8bb0fd0787f69bc3c`. #687 is preserved. The catalog implementation is unchanged from the accepted head.

After the R3 filename commit `89143d9d`, current main had moved to `main@98c9099bee1715f741e4aec87c2c386e9e5344ad` (#689). Merge `dc2359142003a408c3a02677c84fa39e183199ab` contains that main. #689 is preserved. The catalog migration bytes are unchanged. The branch is 0 behind that main.

Server module:

`lib/readiness/official-truth-source-catalog-server.ts`

Canonical repository migration, matching the one Development history version:

`supabase/migrations/20261001193748_official_truth_source_catalog_gateway_1.sql`

The original CLI file was `supabase/migrations/20261001182728_official_truth_source_catalog_gateway_1.sql`. Technical-Lead R3 review `5384562361` applied that SQL exactly once. `git mv` changed only the filename. SHA-256 before and after is `78e17e41f987fbedb8d56d15021730eef76af0b3477bc03061165745f4fc2124`. Do not apply it again.

Read first:

1. `docs/OFFICIAL_TRUTH_SOURCE_CATALOG_GATEWAY_1_TASK_2026-10-01.md`
2. `docs/OFFICIAL_TRUTH_SOURCE_CATALOG_GATEWAY_1_REPORT_2026-10-01.md`
3. `docs/OFFICIAL_TRUTH_SOURCE_CATALOG_GATEWAY_1_SELF_REVIEW_2026-10-01.md`
4. `lib/readiness/source-registry.ts`
5. `supabase/migrations/20261001121258_official_truth_private_evidence_store_schema_1.sql` for the private tables this gateway uses

`source-registry.ts` remains canonical. Do not start a second trust model. Do not edit the freshness lane or global continuity files from this lane.

## Session facts

- Machine mode: `NORMAL`. `.jetnity/operating-mode.json` was not edited.
- The original binding baseline is `main@9c494110196a2877f6eba3babe7cf5ae7c00acf1`. Technical-Lead R1 required integration of `main@ed5350e702f2b6b248cf49ae366420cf1b49039a`. That main is contained. R3 then required the branch to stay 0 behind current main. Current main is `main@98c9099bee1715f741e4aec87c2c386e9e5344ad`, merged in `dc2359142003a408c3a02677c84fa39e183199ab`. Do not rebase again unless the Technical Lead assigns a newer main.
- Local proof: throwaway PostgreSQL 16.15, dropped after the test. Development was not queried. Production was not contacted.
- Local validation of accepted head `1f27a61f`, historical for that head:
  - focused catalog tests: 4 pass / 0 fail
  - schema-reference tests: 4 pass / 0 fail
  - `npm test`: 4182 pass / 0 fail
  - `npm run typecheck`: pass
  - `npm run lint`: 0 errors, 148 warnings, none in this lane
  - `npm run build`: pass, Next.js 16.3.8, 25 static pages
  - dead-code 0, unused exports 0, unused packages 0, API protection PASS, operating-mode guard PASS, `git diff --check` pass
  - `check:schema-bezug`, after the new server file was indexed: LOCAL/UNAPPLIED for `official_truth_source_catalog_v1`, beside the two existing registrations. The R3 path is `supabase/migrations/20261001193748_official_truth_source_catalog_gateway_1.sql`.
- Re-validation after merging `main@ed5350e7`, recorded before the documentation commit on top of `66852a16`:
  - focused catalog tests: 4 pass / 0 fail
  - schema-reference tests: 4 pass / 0 fail
  - `npm test`: 4203 pass / 0 fail
  - `npm run typecheck`: pass
  - `npm run lint`: 0 errors, 148 warnings
  - `npm run build`: pass, Next.js 16.3.8, 25 static pages
  - dead-code 0, unused exports 0, unused packages 0, API protection PASS, operating-mode guard PASS, `git diff --check` pass
  - `check:schema-bezug` still lists the same three LOCAL/UNAPPLIED RPCs, including `official_truth_source_catalog_v1`
- Re-validation after the R3 rename and merge `dc235914`, recorded before the documentation commit on top of that merge:
  - focused catalog tests: 4 pass / 0 fail
  - schema-reference tests: 4 pass / 0 fail
  - `npm test`: 4216 pass / 0 fail
  - `npm run typecheck`: pass
  - `npm run lint`: 0 errors, 148 warnings
  - `npm run build`: pass, Next.js 16.3.8, 25 static pages
  - dead-code 0, unused exports 0, unused packages 0, API protection PASS, operating-mode guard PASS, `git diff --check` pass
  - `check:schema-bezug` pins `official_truth_source_catalog_v1` to `supabase/migrations/20261001193748_official_truth_source_catalog_gateway_1.sql`
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
- `official_truth_source_catalog_v1` from `lib/readiness/official-truth-source-catalog-server.ts` to `supabase/migrations/20261001193748_official_truth_source_catalog_gateway_1.sql`

The call site is the string literal `.rpc('official_truth_source_catalog_v1', ...)`. The exported constant is not the call. An unknown name, a call from another file, and a missing SQL file still fail.

## Stop

Stay Draft.

Cursor does not Ready, merge, apply remotely, seed real data, or start a follow-up slice. The next action is independent Technical-Lead review of the exact pushed head.
