# Official Truth Source Catalog Gateway 1 — Report

Date: 1 October 2026
Issue: #684
Draft PR: #686
Branch: `feat/official-truth-source-catalog-gateway-1`
Baseline: `main@9c494110196a2877f6eba3babe7cf5ae7c00acf1`

Logical agent: **Jetnity Official Truth source catalog gateway 1**, Generation 1
Session: https://cursor.com/agents/bc-b1db9c5e-3aa7-442a-8ccf-7421a1ac8257
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

## What this slice does

A dormant server-only gateway reads and registers the private Official Truth source catalog. `lib/readiness/source-registry.ts` stays the only trust rule. Every returned registry is built with `quellenRegistryErstellen`. The database path is one transactional function, `public.official_truth_source_catalog_v1(jsonb)`.

The module is not imported by a route, the Source Router, Copilot, a cron, a queue, or `requirementsProviderAus()`. That function stays `null`.

## Chosen transport behavior

- Operations are only `read_registry` and `register_source`. Any other operation raises `22023`.
- `quellenKatalogLesen` maps the gateway rows through `quellenRegistryErstellen`. Domain order and source order in the response do not change the registry. `blockedDomains` stays empty because this schema has no blocked-domain table.
- `quelleRegistrieren` accepts exactly one `QuellenEingabe`. `quellenRegistryErstellen([eingabe])` runs before any RPC. An invalid id, class, publisher, authority, or domain does not reach the gateway.
- A new source is combined with the catalog already read and checked again with `quellenRegistryErstellen`. Cross-source overlap returns the canonical `overlapping_domains` and does not call `register_source`.
- An existing source id with the same class, publisher, authority, and complete normalized domain set is sent to the gateway. The function returns `idempotent` and does not write. `registered_at` stays the first value.
- The same source id with any other field or domain set returns `conflicting_duplicate` from the server without a write call. A direct `service_role` call raises `23505`, `conflicting official source`.
- The public server sends the normalized source from `quellenRegistryErstellen`: trimmed names, `authorityName: null` for a licensed provider, and sorted unique domains. Raw SQL does not trim. A raw licensed authority or an official source without an authority raises `22023` and writes nothing.
- Parent and child hostnames on one new source are stored. `quellenRegistryErstellen` allows that pair. The same pair across two sources is rejected. A single-label host such as `example` is `invalid_domain` in the canonical normalizer, so it is not a parent domain.
- `register_source` inserts the source, then each domain. Overlap with another source raises `23505`, `overlapping official source domain`, after earlier inserts in the same function. There is no exception handler. The local proof showed `ok.example` absent and the new source absent after `border.gov.example` overlapped a stored `gov.example`.
- A catalog that already violates `quellenRegistryErstellen` — the schema itself still allows a cross-source parent/child written outside this gateway — makes both read and further registration return `catalog_failed`. This function does not repair or remove those rows.
- `register_source` takes `SHARE ROW EXCLUSIVE` on both catalog tables before the existence check. The local proof is one session.

## Security posture

- One `SECURITY DEFINER` function. Empty `search_path`. Body references are schema-qualified, except the SQL-standard `coalesce` keyword, for the same PostgreSQL 16.15 reason recorded on the accepted-store writer.
- `REVOKE EXECUTE` from `public`, `anon`, `authenticated`, and `service_role`, then `GRANT EXECUTE` only to `service_role`.
- No table grant. No policy. The private catalog tables stay as migration `20261001121258` left them.
- `anon` and `authenticated` cannot execute the function. `service_role` cannot insert into `private.official_sources` and cannot select `private.official_source_domains`.
- `information_schema.routine_privileges` also shows `EXECUTE` for the function owner. That is the owner default. The only Data-API grant in this migration is `service_role`.
- The server module imports `server-only`, disables session persistence, token refresh, and URL session detection, and reads `SUPABASE_SERVICE_ROLE_KEY`. A `NEXT_PUBLIC_` service key is not used. Missing credentials return `catalog_not_configured` and do not call the RPC. Failures return `catalog_failed` without the database message or the key.
- The runtime call is the literal `.rpc('official_truth_source_catalog_v1', ...)` in `lib/readiness/official-truth-source-catalog-server.ts`. `LOCAL_UNAPPLIED_RPCS` pins that name to this file and to `supabase/migrations/20261001182728_official_truth_source_catalog_gateway_1.sql`. This is not a generic dynamic-RPC exemption. `types/supabase.ts` is unchanged.

## Migration identity

Supabase CLI `2.48.3`, downloaded outside the repository, created `supabase/migrations/20261001182728_official_truth_source_catalog_gateway_1.sql` via `supabase migration new official_truth_source_catalog_gateway_1`. The timestamp was not typed by hand. The CLI reported that `2.119.0` exists. This slice did not upgrade it and did not recreate the file. SHA-256 of the SQL file is `78e17e41f987fbedb8d56d15021730eef76af0b3477bc03061165745f4fc2124`. Gitignored `supabase/.temp/cli-latest` was removed and is not part of the commit.

The migration inserts zero catalog rows. It does not change `supabase/config.toml`.

## What was not done

- Cursor did not run a remote `supabase` push, repair, reset, or apply.
- Development and Production were not queried and were not modified.
- No real government or provider row, and no CH Candidate Evidence import.
- No OpenAI, web, Sherpa, Timatic, or other provider call.
- No change to `source-registry.ts`, `requirementsProviderAus()`, UI, routes, `types/supabase.ts`, or `.jetnity/operating-mode.json`.
- No edit to global continuity files. Parallel lane ownership stays with the lane-local report, handoff, and self-review.
- No Ready, no merge, and no follow-up slice.

## Local proof

Throwaway PostgreSQL 16.15 at `/usr/lib/postgresql/16/bin`. The cluster listened only on a private Unix socket, used local trust, and was dropped in `finally`. Prior Official Truth tasks state that Development is PostgreSQL 17.6. This session did not query Development. The versions are not the same.

Sources in the proof are synthetic `*.example` hosts only.

- Focused catalog tests: 4 pass / 0 fail, including the throwaway cluster.
- Schema-reference tests: 4 pass / 0 fail. The allowlist is exactly `admin_account_counts_v1`, `official_truth_store_accepted_v1`, and `official_truth_source_catalog_v1`.
- `npm test`: 4182 pass / 0 fail.
- `npm run typecheck`: pass.
- `npm run lint`: 0 errors, 148 warnings. None are in this lane's files.
- `npm run build`: pass. Next.js 16.3.8. 25 static pages. `check:setup` warned that no `.env` file is present in this checkout. The build still exited 0.
- `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, and the operating-mode guard passed. `git diff --check` passed.

`check:schema-bezug` reads `git ls-files`. After the new server file was indexed it printed LOCAL/UNAPPLIED for `admin_account_counts_v1`, `official_truth_source_catalog_v1` from `lib/readiness/official-truth-source-catalog-server.ts` to `supabase/migrations/20261001182728_official_truth_source_catalog_gateway_1.sql`, and `official_truth_store_accepted_v1`. Exact-head CI is not claimed in this file.

## Recommendation

Keep this migration free of real catalog rows. A real source still needs its own evidence-backed slice and a Technical Lead decision. Do not add `UPDATE` or `DELETE` here to repair a catalog that was written around the gateway. Fail closed is the current behavior.

Traveller context does not apply. This gateway stores a reusable source catalog. It does not choose a citizenship, a travel document, or a residence.
