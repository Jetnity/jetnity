# Official Truth Trusted Accepted-Store Writer 1 — Report

Date: 1 October 2026
Issue: #682
Draft PR: #683
Branch: `feat/official-truth-trusted-store-writer-1`
Baseline: `main@7c3dc2835622355d3dd8f5fb9efa4b3e63899b9e`

Logical agent: **Jetnity Official Truth trusted accepted-store writer 1**, Generation 1
Session: https://cursor.com/agents/bc-9f6575c9-7aa3-4b97-b0a4-4ff4db26f877
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

## What this slice does

A dormant server-only writer stores one canonically accepted Evidence version or one canonically accepted Rule Claim. The acceptance functions stay `evidenceKandidatAkzeptieren` and `regelKandidatAkzeptieren`. The database path is one transactional gateway, `public.official_truth_store_accepted_v1(jsonb)`.

The writer is not connected to `requirementsProviderAus()`, the Source Router, Copilot, a cron, a queue, or a user request. `requirementsProviderAus()` stays `null`.

## Chosen transport behavior

- Operations are only `accepted_evidence` and `accepted_rule_claim`. Any other operation raises `22023`.
- An exact duplicate is an idempotent no-op. There is no `UPDATE` and no `DELETE`.
- A conflicting duplicate of the same evidence version, or of the same `(rule_scope_key, fact_kind)`, raises `23505` and writes nothing.
- `accepted_at` is audit only. It is excluded from claim equality. A later identical claim keeps the first `accepted_at`. The local proof stored `2026-10-01T12:05:00Z` after a replay stamped `2026-10-01T13:00:00.000Z`.
- Support `source_id` and `source_class` are resolved by joining the stored evidence version on `version_id` and `rule_scope_key` to `official_sources`. A caller-supplied `source_class` on the fact is ignored.
- An official action looks up `source_class` from `official_sources` by `action_source_id`. A missing source raises `23503`. A licensed class then fails the existing check.
- If the number of inserted support rows differs from the number of requested support ids, the function raises `23503` with `support evidence version is not stored for this rule scope`.
- SQL does not add a support-count or distinct-source acceptance rule. Those stay in `regelKandidatAkzeptieren`. An empty support list remains possible for a hand-built RPC payload. The public TypeScript functions do not produce one.
- The nine existing deferred fact-payload constraint triggers are set `IMMEDIATE` before the function returns. The existing trigger stays `SECURITY INVOKER`. It is not altered to `SECURITY DEFINER` and it is not disabled. The local proof showed an empty `visa_options` payload raise `accepted rule claim … has no persisted visa_options fact payload`, with claim, fact and support counts unchanged. Successful `service_role` calls committed, so that local cluster did not re-run the trigger as `service_role` after the function returned.

## Security posture

- One `SECURITY DEFINER` function. Empty `search_path`. Body references are schema-qualified, except the SQL-standard `coalesce` keyword explained below.
- `REVOKE EXECUTE` from `public`, `anon`, `authenticated` and `service_role`, then `GRANT EXECUTE` only to `service_role`.
- No `GRANT` of table privileges. No policy. RLS stays enabled and forced with zero policies on every `private.official_*` table.
- `anon` and `authenticated` cannot execute the function. `service_role` cannot insert into `private.official_sources` and cannot select `private.official_evidence_versions`.
- PostgreSQL also shows `EXECUTE` for the function owner in `information_schema.routine_privileges`. That is the owner default. The local proof allows that owner row and rejects `anon`, `authenticated` and `public`. The only explicit Data-API grant in the migration is `service_role`.
- The server module imports `server-only`, disables session persistence, token refresh and URL session detection, and reads `SUPABASE_SERVICE_ROLE_KEY`. A `NEXT_PUBLIC_` service key is not used. Missing credentials return `store_not_configured` and do not call the RPC. Failures return `store_failed` without the database message or the key.

## `coalesce` and the schema scanner

`pg_catalog.coalesce(jsonb, jsonb)` and `pg_catalog.coalesce(text[], text[])` do not resolve in PostgreSQL 16.15 when the call is schema-qualified inside this function. JSONB aggregates use the SQL keyword `coalesce`, which is parsed as `COALESCE` and does not consult `search_path`. Text arrays use `array_agg(...)::text[]` and assign `'{}'` when the aggregate is null.

`scripts/db/verwendung.mjs` flags a string-literal `.rpc('name')` unless that name is in `types/supabase.ts` or `LOCAL_UNAPPLIED_RPCS`. Both files are outside this allowlist. The writer calls `client.rpc(OFFICIAL_TRUTH_STORE_ACCEPTED_V1, { payload })`. The scanner therefore does not see this new function. That is recorded here. The scanner is unchanged for every other RPC. No string-literal `.rpc('official_truth_store_accepted_v1')` was added.

## What was not done

- No remote `supabase` push, repair, reset or apply.
- Development was not written. Production `qscbgcdmivbbnzrcyegn` was not touched.
- No Candidate Evidence import, no CH batch, no real source-catalog row.
- No OpenAI, web, Sherpa, Timatic or KAYAK call.
- No change to `evidence.ts`, `rule-claims.ts`, `engine.ts`, `official.ts`, provider code, UI, `types/supabase.ts` or `.jetnity/operating-mode.json`.

## Local proof

Throwaway PostgreSQL 16.15 at `/usr/lib/postgresql/16/bin`. The cluster listened only on a private Unix socket, used local trust, and was dropped in `finally`. Development is PostgreSQL 17.6 according to the task. This session did not query Development. The versions are not the same.

Sources in the proof are synthetic `*.example` hosts only. The migration inserts zero rows. The proof inserts four synthetic sources as the cluster superuser, then drives the gateway as `service_role`.

The focused writer test file passed, 7/7, including visa-option and 17-airport idempotent replay, a composed claim on a separate destination, empty-option rollback, missing-support rollback, and rejection of a licensed support whose fact carried a decoy `source_class`.

`npm test` passed 4178/4178. Typecheck passed. Lint reported 0 errors and 148 pre-existing warnings. The production build passed on Next.js 16.3.8 with 25 static pages. Exact-head CI is not claimed in this file.
