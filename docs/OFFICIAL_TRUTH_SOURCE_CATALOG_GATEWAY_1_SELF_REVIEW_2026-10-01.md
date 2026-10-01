# Official Truth Source Catalog Gateway 1 — Self-Review

Date: 1 October 2026
Issue: #684
Draft PR: #686
Branch: `feat/official-truth-source-catalog-gateway-1`

This is the author self-review. It is not an independent Technical-Lead PASS. Cursor does not Ready and does not merge.

## Scope check

Changed paths are the task allowlist:

- `lib/readiness/official-truth-source-catalog-server.ts`
- `lib/readiness/official-truth-source-catalog-server.test.ts`
- `supabase/migrations/20261001182728_official_truth_source_catalog_gateway_1.sql`
- `scripts/db/verwendung.mjs`
- `lib/admin/account-counts-delivery/schema-reference.test.ts`
- `docs/OFFICIAL_TRUTH_SOURCE_CATALOG_GATEWAY_1_REPORT_2026-10-01.md`
- `docs/OFFICIAL_TRUTH_SOURCE_CATALOG_GATEWAY_1_HANDOFF_2026-10-01.md`
- `docs/OFFICIAL_TRUTH_SOURCE_CATALOG_GATEWAY_1_SELF_REVIEW_2026-10-01.md`

`docs/OFFICIAL_TRUTH_SOURCE_CATALOG_GATEWAY_1_TASK_2026-10-01.md` was not rewritten.

`source-registry.ts`, provider code, UI, routes, `types/supabase.ts`, `.jetnity/operating-mode.json`, and global continuity files are unchanged by this lane.

Technical-Lead R1 review `5384194385` found no catalog code or schema defect on `1f27a61f998f35cb2d17a574a56c92ae04977ea5`. The later commit `66852a163a5a7638f5dd48e8bb0fd0787f69bc3c` merges `main@ed5350e702f2b6b248cf49ae366420cf1b49039a` and preserves #687. Relative to that main, the freshness files have no diff. Relative to `1f27a61f`, the catalog server, test, migration, and schema-reference registration have no diff. The migration SHA-256 is unchanged.

## Contract

- The public functions are `quellenKatalogLesen` and `quelleRegistrieren`.
- `quellenRegistryErstellen` is called three times in the server module: once for a read, once for the single input, and once for the combined catalog when the source id is new.
- Invalid input returns the canonical reason and does not call the transport. The static test counts zero transport calls for an invalid id, a missing authority, and a licensed provider that carries an authority name.
- `official_authority` without a usable authority name fails with `authority_required`. A licensed provider with an authority name fails with `provider_is_not_authority`. Whitespace-only authority on a licensed provider normalizes to `null` before the write payload.
- Cross-source child and parent overlap return `overlapping_domains` after `read_registry` and before `register_source`.
- A single-label host returns `invalid_domain` and does not reach the RPC. The canonical normalizer requires at least two labels.
- An exact normalized duplicate calls `register_source` and accepts only `idempotent`. A conflicting publisher returns `conflicting_duplicate` without a write call.
- Read order is not trusted. The test feeds reversed sources and reversed domains and requires deep equality with a direct `quellenRegistryErstellen` result. `blockedDomains` is empty.
- `requirementsProviderAus()` is null, and the server module does not mention it.

## Gateway

- One function, one `SECURITY DEFINER`, empty `search_path`, no `CREATE OR REPLACE`, no seed insert, no `UPDATE`/`DELETE`, no table grant, no policy.
- The runtime call is the literal `.rpc('official_truth_source_catalog_v1', ...)`. `LOCAL_UNAPPLIED_RPCS` lists exactly the previous two reviewed RPCs plus this one, pinned to the server file and this migration path.
- Throwaway PostgreSQL 16.15 proved: zero rows after migrate; `anon` and `authenticated` cannot execute; `service_role` cannot write `official_sources` or read `official_source_domains`; `service_role` can read an empty registry and register a synthetic source; idempotent replay keeps `registered_at`; direct SQL conflict and overlap leave counts unchanged; a two-domain payload whose second domain overlaps rolls back the source and the first domain; a superuser-inserted cross-source parent/child makes the next read and the next registration fail closed.
- Same-source `portal.example` plus `border.portal.example` is stored. That matches `quellenRegistryErstellen`. It is not a domain move.

## Disclosed limits

1. Generated types. `types/supabase.ts` is unchanged, so `official_truth_source_catalog_v1` is LOCAL/UNAPPLIED until a later apply. The registration is this one RPC, not a dynamic-name exemption.
2. `COALESCE` keyword. Schema-qualified `pg_catalog.coalesce` does not resolve the jsonb overload used here on PostgreSQL 16.15, as already found on the accepted-store writer. The keyword form does not depend on `search_path`.
3. Owner `EXECUTE`. `information_schema.routine_privileges` includes the function owner. The migration's only Data-API `GRANT EXECUTE` is `service_role`.
4. Version gap. Local proof is PostgreSQL 16.15. Earlier tasks state Development is 17.6. This session did not query Development. A Development apply is not done and is not authorized for Cursor.
5. The private schema still allows a source with no domain and a parent/child pair across sources. Only this gateway rejects those shapes. Rows written around the gateway make the read fail closed. This slice does not add a repair.
6. SQL dedupes an exact repeated domain inside one payload. It does not trim display names. The public function sends the already normalized source.
7. The table lock was not proven with two concurrent sessions.
8. `catalog_failed` covers both a transport failure and a stored catalog that the canonical builder rejects. The database text is not returned. The service key is not returned.
9. Global continuity files were left untouched because this lane must not edit them. The lane handoff is the continuity record for the next reader.

## Base re-gate

The integrated tree was validated again before the documentation commit that records it. `npm test` is 4203/4203. Typecheck, lint, build, hygiene, and `check:schema-bezug` passed. Catalog behavior was not edited to make those checks pass. The branch is 0 behind the assigned main. This self-review still is not an independent Technical-Lead PASS.

## Not claimed

No Ready. No merge. No Development apply. No Production mutation. No import. No provider activation. No follow-up slice. Exact-head CI and Vercel Preview are properties of the pushed tip, not of this self-review text.
