# Official Truth Trusted Accepted-Store Writer 1 — Self-Review

Date: 1 October 2026
Issue: #682
Draft PR: #683
Branch: `feat/official-truth-trusted-store-writer-1`

This is the author self-review. It is not an independent Technical-Lead PASS. Cursor does not Ready and does not merge.

## Scope check

Changed paths are the original task allowlist plus the two files Technical-Lead R1 explicitly added:

- `lib/readiness/official-truth-store-server.ts`
- `lib/readiness/official-truth-store-server.test.ts`
- `supabase/migrations/20261001180549_official_truth_trusted_store_writer_1.sql` (`git mv` from the original CLI filename `20261001171111_official_truth_trusted_store_writer_1.sql`; SQL bytes unchanged, SHA-256 `8b9a47f42ac9d2fcef62775a8a824c2e79abc86f583ebeea5a5ece56f7a93df4`)
- `scripts/db/verwendung.mjs` (R1-F1 only)
- `lib/admin/account-counts-delivery/schema-reference.test.ts` (R1-F1 only)
- `docs/OFFICIAL_TRUTH_TRUSTED_STORE_WRITER_1_REPORT_2026-10-01.md`
- `docs/OFFICIAL_TRUTH_TRUSTED_STORE_WRITER_1_HANDOFF_2026-10-01.md`
- `docs/OFFICIAL_TRUTH_TRUSTED_STORE_WRITER_1_SELF_REVIEW_2026-10-01.md`
- `ARCHITECTURE.md`
- `DECISIONS.md` (ADR-0220 and the ADR-0219 writer Nachtrag, plus the R1 Nachtrag)
- `docs/OFFICIAL_TRUTH_SOURCE_EVIDENCE_ARCHITECTURE_2026-10-01.md`
- `JETNITY_START_HERE.md` current pointer only
- `docs/ACTIVE_WORK_STATUS.md` current pointer only

`docs/OFFICIAL_TRUTH_TRUSTED_STORE_WRITER_1_TASK_2026-10-01.md` was not rewritten.

`evidence.ts`, `rule-claims.ts`, `engine.ts`, `official.ts`, provider code, UI, `types/supabase.ts` and `.jetnity/operating-mode.json` are unchanged.

## Contract

- The public functions are `akzeptierteEvidenceSpeichern` and `akzeptierteRegelClaimSpeichern`. Payload builders are not exported.
- A raw accepted-shaped object does not reach the RPC. The static test counts `transport.aufrufen(` twice, once per success path. The transport type and the default client wrapper also contain the method name. Those are not extra persistence calls.
- `research_gap`, `unresolved_conflict`, `stale_primary_evidence` and same-source composition stop before the RPC.
- Every fact kind used by the claim contract is mapped. Seventeen synthetic airports `AAA`–`AAQ` are stored without a new maximum.
- The full citizenship list `CH` and `RS` is copied. Issuing country `CH` stays on the credential option and is also the explicit related citizenship. It is not promoted to a primary citizenship.

## Gateway

- One function, one `SECURITY DEFINER`, empty `search_path`, no `CREATE OR REPLACE`, no catalog insert, no `UPDATE`/`DELETE`, no table grant, no policy.
- `accepted_evidence` raises `22023` before duplicate handling when `lifecycle` is not `accepted` or `validation_state` is not `valid`. A direct `service_role` payload of `candidate` / `pending` changes no row count. The stored row remains `accepted` / `valid`. SQL still does not recompute `rule_scope_key` or support-count truth.
- The runtime call is the literal `.rpc('official_truth_store_accepted_v1', ...)`. `LOCAL_UNAPPLIED_RPCS` lists exactly `admin_account_counts_v1` and this function. The schema-reference tests still fail unknown names, a wrong source path, and missing SQL.
- Idempotent exact duplicate and fail-closed conflict are both proven on the throwaway cluster, including a later `accepted_at` that does not overwrite the first.
- Licensed evidence can be stored. A claim that cites it fails `official_rule_claim_support_source_class` even when the fact JSON contains `source_class: official_authority`. The decoy is ignored. No licensed support row remains.
- Empty visa options hit the existing fact-payload trigger through `SET CONSTRAINTS … IMMEDIATE`. Counts do not change.
- A support id that is not stored raises the gateway's own `23503` and leaves counts unchanged.
- Composed primary evidence from two official sources on a separate destination stores two support rows, both `official_authority`.

## Disclosed limits

1. Generated types. `types/supabase.ts` is still unchanged, so `official_truth_store_accepted_v1` is LOCAL/UNAPPLIED until a later apply. `check:schema-bezug` names it from `lib/readiness/official-truth-store-server.ts` and the writer migration. The first head hid the call behind a constant. Review `5383176732` rejected that. The registration is this one RPC, not a dynamic-name exemption.
2. `COALESCE` keyword. Schema-qualified `pg_catalog.coalesce` does not resolve the jsonb and text-array overloads used here on PostgreSQL 16.15. The keyword form is used only for jsonb aggregates. It does not depend on `search_path`.
3. Owner `EXECUTE`. `information_schema.routine_privileges` includes the function owner. The migration's only Data-API `GRANT EXECUTE` is `service_role`. `anon`, `authenticated` and `public` are revoked and proven denied.
4. Version gap. Local proof is PostgreSQL 16.15. The task states Development is 17.6. This session did not re-query Development. A Development apply is not done and is not authorized for Cursor.
5. Empty support list. SQL still allows it, as ADR-0219 left that rule in TypeScript. The public writer does not emit it.
6. `rule_scope_key` is still not recomputed from the typed columns inside SQL.
7. `SET CONSTRAINTS IMMEDIATE` was proven on the local superuser-owned function. It was not proven on Supabase's migration owner. If a later Development apply shows the deferred trigger firing again as `service_role`, the fix has to stay inside this one function. Do not convert the existing trigger to `SECURITY DEFINER`.

## Identity

Technical-Lead R3 review `5383450871` is a repository filename reconciliation only. Development already contains `public.official_truth_store_accepted_v1` once under history version `20261001180549`. The canonical repository path is that version. The original CLI filename `20261001171111` is historical. This self-review does not apply the migration again.

## Not claimed

No Ready. No merge. No second Development apply. No Production mutation. No import. No provider activation. No follow-up slice. Exact-head CI and Vercel Preview are properties of the pushed tip, not of this self-review text.
