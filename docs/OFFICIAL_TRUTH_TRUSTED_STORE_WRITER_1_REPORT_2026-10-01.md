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
- `accepted_evidence` rejects before duplicate handling and before insert unless `lifecycle` is `accepted` and `validation_state` is `valid`. The error is `22023`, `official truth store evidence is not accepted`. A direct `service_role` call with `candidate` / `pending` leaves every Official Truth row count unchanged. The already stored accepted row stays `accepted` / `valid`. This is a transport invariant of the operation named `accepted_evidence`. SQL does not recompute `rule_scope_key` and does not decide support-count truth.
- The nine existing deferred fact-payload constraint triggers are set `IMMEDIATE` before the function returns. The existing trigger stays `SECURITY INVOKER`. It is not altered to `SECURITY DEFINER` and it is not disabled. The local proof showed an empty `visa_options` payload raise `accepted rule claim … has no persisted visa_options fact payload`, with claim, fact and support counts unchanged. Successful `service_role` calls committed, so that local cluster did not re-run the trigger as `service_role` after the function returned.

## Security posture

- One `SECURITY DEFINER` function. Empty `search_path`. Body references are schema-qualified, except the SQL-standard `coalesce` keyword explained below.
- `REVOKE EXECUTE` from `public`, `anon`, `authenticated` and `service_role`, then `GRANT EXECUTE` only to `service_role`.
- No `GRANT` of table privileges. No policy. RLS stays enabled and forced with zero policies on every `private.official_*` table.
- `anon` and `authenticated` cannot execute the function. `service_role` cannot insert into `private.official_sources` and cannot select `private.official_evidence_versions`.
- PostgreSQL also shows `EXECUTE` for the function owner in `information_schema.routine_privileges`. That is the owner default. The local proof allows that owner row and rejects `anon`, `authenticated` and `public`. The only explicit Data-API grant in the migration is `service_role`.
- The server module imports `server-only`, disables session persistence, token refresh and URL session detection, and reads `SUPABASE_SERVICE_ROLE_KEY`. A `NEXT_PUBLIC_` service key is not used. Missing credentials return `store_not_configured` and do not call the RPC. Failures return `store_failed` without the database message or the key.

## `coalesce`

`pg_catalog.coalesce(jsonb, jsonb)` and `pg_catalog.coalesce(text[], text[])` do not resolve in PostgreSQL 16.15 when the call is schema-qualified inside this function. JSONB aggregates use the SQL keyword `coalesce`, which is parsed as `COALESCE` and does not consult `search_path`. Text arrays use `array_agg(...)::text[]` and assign `'{}'` when the aggregate is null.

## Technical-Lead R1

Review `5383176732` on exact head `7eff82b7bc3fee950dc85f4525e6f57b152f1c13` is **CHANGES REQUIRED**. That head's CI, Auth and Vercel Preview are historical for the corrected tip.

R1-F1. The first head called `client.rpc(OFFICIAL_TRUTH_STORE_ACCEPTED_V1, ...)`. `check:schema-bezug` only sees a string-literal `.rpc('name')`, so the new function was invisible. The correction calls `.rpc('official_truth_store_accepted_v1', ...)` from `lib/readiness/official-truth-store-server.ts`. `LOCAL_UNAPPLIED_RPCS` in `scripts/db/verwendung.mjs` now contains exactly two reviewed entries: the existing `admin_account_counts_v1` wrapper, and `official_truth_store_accepted_v1` with source `lib/readiness/official-truth-store-server.ts` and SQL `supabase/migrations/20261001180549_official_truth_trusted_store_writer_1.sql`. The path at the R1 head was the original CLI filename `20261001171111_official_truth_trusted_store_writer_1.sql`. `check:schema-bezug` classifies this RPC as LOCAL/UNAPPLIED. An unknown name, a call from another file, and a missing SQL file still fail. This is not a generic dynamic-RPC exemption. `types/supabase.ts` is unchanged. The constant `OFFICIAL_TRUTH_STORE_ACCEPTED_V1` remains the same string. It is not the call.

R1-F2. The evidence table still allows `candidate | accepted | conflicted | superseded` and `pending | valid | rejected`. The accepted-store operation now rejects any other pair before duplicate handling, as described above. The claim path is unchanged. The claim table already stores only accepted claims.

The Technical Lead expanded the allowlist only for `scripts/db/verwendung.mjs` and `lib/admin/account-counts-delivery/schema-reference.test.ts`.

## Technical-Lead R3 — migration identity only

Review `5383450871`. Exact head `0f4490ab2335ac1142d7ba683fe91764bcdd6d99` had already passed code and schema review. The Technical Lead applied that SQL exactly once to Development on PostgreSQL 17.6. Supabase recorded the history version `20261001180549_official_truth_trusted_store_writer_1`.

The repository file created by `supabase migration new` was `20261001171111_official_truth_trusted_store_writer_1.sql`. `git mv` renamed it to `supabase/migrations/20261001180549_official_truth_trusted_store_writer_1.sql`. SHA-256 before and after the rename is `8b9a47f42ac9d2fcef62775a8a824c2e79abc86f583ebeea5a5ece56f7a93df4`. The SQL bytes did not change. This correction does not apply, repair, reset, rebase, or push Supabase, and it writes no Official Truth rows.

## What was not done

- Cursor did not run a remote `supabase` push, repair, reset, or second apply.
- Production `qscbgcdmivbbnzrcyegn` was not touched.
- No Candidate Evidence import, no CH batch, no real source-catalog row.
- No OpenAI, web, Sherpa, Timatic or KAYAK call.
- No change to `evidence.ts`, `rule-claims.ts`, `engine.ts`, `official.ts`, provider code, UI, `types/supabase.ts` or `.jetnity/operating-mode.json`.

## Local proof

Throwaway PostgreSQL 16.15 at `/usr/lib/postgresql/16/bin`. The cluster listened only on a private Unix socket, used local trust, and was dropped in `finally`. Development is PostgreSQL 17.6 according to the task. This session did not query Development. The versions are not the same.

Sources in the proof are synthetic `*.example` hosts only. The migration inserts zero rows. The proof inserts four synthetic sources as the cluster superuser, then drives the gateway as `service_role`.

The focused writer test file passed, 7/7, including the `candidate` / `pending` rejection with unchanged counts, visa-option and 17-airport idempotent replay, a composed claim on a separate destination, empty-option rollback, missing-support rollback, and rejection of a licensed support whose fact carried a decoy `source_class`. The schema-reference tests passed, 4/4, and require exactly those two LOCAL/UNAPPLIED registrations.

Corrected-tip local validation: `npm test` 4178/4178, typecheck pass, lint 0 errors and 148 pre-existing warnings, production build pass on Next.js 16.3.8 with 25 static pages, and `check:schema-bezug` printing LOCAL/UNAPPLIED for `official_truth_store_accepted_v1`. Exact-head CI is not claimed in this file. The numbers on `7eff82b7` belong to the reviewed head and are not this tip.
