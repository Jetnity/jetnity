# Official Truth Trusted Accepted-Store Writer 1 — Self-Review

Date: 1 October 2026
Issue: #682
Draft PR: #683
Branch: `feat/official-truth-trusted-store-writer-1`

This is the author self-review. It is not an independent Technical-Lead PASS. Cursor does not Ready and does not merge.

## Scope check

Changed paths are the task allowlist only:

- `lib/readiness/official-truth-store-server.ts`
- `lib/readiness/official-truth-store-server.test.ts`
- `supabase/migrations/20261001171111_official_truth_trusted_store_writer_1.sql`
- `docs/OFFICIAL_TRUTH_TRUSTED_STORE_WRITER_1_REPORT_2026-10-01.md`
- `docs/OFFICIAL_TRUTH_TRUSTED_STORE_WRITER_1_HANDOFF_2026-10-01.md`
- `docs/OFFICIAL_TRUTH_TRUSTED_STORE_WRITER_1_SELF_REVIEW_2026-10-01.md`
- `ARCHITECTURE.md`
- `DECISIONS.md` (ADR-0220 and the ADR-0219 writer Nachtrag)
- `docs/OFFICIAL_TRUTH_SOURCE_EVIDENCE_ARCHITECTURE_2026-10-01.md`
- `JETNITY_START_HERE.md` current pointer only
- `docs/ACTIVE_WORK_STATUS.md` current pointer only

`docs/OFFICIAL_TRUTH_TRUSTED_STORE_WRITER_1_TASK_2026-10-01.md` was not rewritten. `next-env.d.ts` is a dirty checkout file and is not part of this slice.

`evidence.ts`, `rule-claims.ts`, `engine.ts`, `official.ts`, provider code, UI, `types/supabase.ts`, `scripts/db/verwendung.mjs` and `.jetnity/operating-mode.json` are unchanged.

## Contract

- The public functions are `akzeptierteEvidenceSpeichern` and `akzeptierteRegelClaimSpeichern`. Payload builders are not exported.
- A raw accepted-shaped object does not reach the RPC. The static test counts `transport.aufrufen(` twice, once per success path. The transport type and the default client wrapper also contain the method name. Those are not extra persistence calls.
- `research_gap`, `unresolved_conflict`, `stale_primary_evidence` and same-source composition stop before the RPC.
- Every fact kind used by the claim contract is mapped. Seventeen synthetic airports `AAA`–`AAQ` are stored without a new maximum.
- The full citizenship list `CH` and `RS` is copied. Issuing country `CH` stays on the credential option and is also the explicit related citizenship. It is not promoted to a primary citizenship.

## Gateway

- One function, one `SECURITY DEFINER`, empty `search_path`, no `CREATE OR REPLACE`, no catalog insert, no `UPDATE`/`DELETE`, no table grant, no policy.
- Idempotent exact duplicate and fail-closed conflict are both proven on the throwaway cluster, including a later `accepted_at` that does not overwrite the first.
- Licensed evidence can be stored. A claim that cites it fails `official_rule_claim_support_source_class` even when the fact JSON contains `source_class: official_authority`. The decoy is ignored. No licensed support row remains.
- Empty visa options hit the existing fact-payload trigger through `SET CONSTRAINTS … IMMEDIATE`. Counts do not change.
- A support id that is not stored raises the gateway's own `23503` and leaves counts unchanged.
- Composed primary evidence from two official sources on a separate destination stores two support rows, both `official_authority`.

## Disclosed limits

1. Schema scanner gap. The RPC name is a constant because `types/supabase.ts` and `scripts/db/verwendung.mjs` are outside the allowlist. `check:schema-bezug` does not list `official_truth_store_accepted_v1`. This does not add a string-literal bypass and does not change the scanner. Generated types will not know the function until a later apply.
2. `COALESCE` keyword. Schema-qualified `pg_catalog.coalesce` does not resolve the jsonb and text-array overloads used here on PostgreSQL 16.15. The keyword form is used only for jsonb aggregates. It does not depend on `search_path`.
3. Owner `EXECUTE`. `information_schema.routine_privileges` includes the function owner. The migration's only Data-API `GRANT EXECUTE` is `service_role`. `anon`, `authenticated` and `public` are revoked and proven denied.
4. Version gap. Local proof is PostgreSQL 16.15. The task states Development is 17.6. This session did not re-query Development. A Development apply is not done and is not authorized for Cursor.
5. Empty support list. SQL still allows it, as ADR-0219 left that rule in TypeScript. The public writer does not emit it.
6. `rule_scope_key` is still not recomputed from the typed columns inside SQL.
7. `SET CONSTRAINTS IMMEDIATE` was proven on the local superuser-owned function. It was not proven on Supabase's migration owner. If a later Development apply shows the deferred trigger firing again as `service_role`, the fix has to stay inside this one function. Do not convert the existing trigger to `SECURITY DEFINER`.

## Not claimed

No Ready. No merge. No Development write. No Production mutation. No import. No provider activation. No follow-up slice. Exact-head CI and Vercel Preview are properties of the pushed tip, not of this self-review text.
