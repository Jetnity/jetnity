# Official Truth Trusted Accepted-Store Writer 1 — Binding Task v1.0

Date: 1 October 2026  
Issue: #682  
Branch: `feat/official-truth-trusted-store-writer-1`  
Baseline: `main@7c3dc2835622355d3dd8f5fb9efa4b3e63899b9e`

Cursor-Agent: **Jetnity Official Truth trusted accepted-store writer 1**  
Generation: **1**  
Required model: **Grok 4.7 High Fast** — not Auto.

## 0. Authority and current live baseline

Product-Owner authority already exists:

- Issue #294 comment `5928669189`: first-party Official Truth source strategy APPROVED.
- Issue #294 comment `5935531376`, finalized by `5935581800`: manual CH-01..CH-10 seeding is closed; no CH-11; preferred next engineering sequence starts with a trusted server-only private-store writer/adapter.
- Production remains a Product-Owner gate.

Technical-Lead live precheck on 1 October 2026:

- `main` = `7c3dc2835622355d3dd8f5fb9efa4b3e63899b9e`, 0 ahead / 0 behind itself.
- Post-merge CI `36890244234`: SUCCESS.
- Auth `110463741250`: SUCCESS.
- Typecheck/Lint/Tests/Build `110463741009`: SUCCESS.
- Vercel Production `dpl_BuM8xqdKzr6sCpeu5vuUoJKsBdFM`: READY on exact main.
- Operating mode: NORMAL.
- No active current writer exists before this slice. Historical drafts #52, #50, #40, #39 and #28 are not current writers.
- Last completed Cursor writer: **Jetnity Official Truth Rule Claim migration identity reconciliation**, Generation 1, session `bc-bc20dace-fb33-491e-9117-5dc18f453ac7`. It is closed and must not be reused.

Supabase Development `develop / yfvbxvijcorffwxbxahl`:

- PostgreSQL 17.6 branch of Production `qscbgcdmivbbnzrcyegn`.
- Applied Official-Truth migrations exactly once:
  - `20261001121258_official_truth_private_evidence_store_schema_1`
  - `20261001151048_official_truth_accepted_rule_claim_persistence_schema_1`
- 13 `private.official_*` tables exist.
- all Official-Truth source/domain/evidence/claim/fact/support tables currently contain 0 rows.
- RLS is enabled **and forced** on every Official-Truth table.
- there are 0 RLS policies on those tables.
- `anon`, `authenticated` and `service_role` have no direct table privileges on those tables.
- the current security advisor reports the expected INFO `rls_enabled_no_policy`; no new Official-Truth exposure warning.
- unindexed Official-Truth FKs are current zero-row performance INFO only and are not part of this slice.

Supabase Production `qscbgcdmivbbnzrcyegn`:

- has neither Official-Truth migration;
- has no `private.official_*` tables;
- must remain unchanged.

## 1. Read first

1. `JETNITY_START_HERE.md`
2. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
3. `docs/OFFICIAL_TRUTH_SOURCE_EVIDENCE_ARCHITECTURE_2026-10-01.md`
4. `docs/OFFICIAL_TRUTH_PRIVATE_EVIDENCE_STORE_SCHEMA_1_HANDOFF_2026-10-01.md`
5. `docs/OFFICIAL_TRUTH_RULE_CLAIMS_FOUNDATION_1_HANDOFF_2026-10-01.md`
6. `docs/OFFICIAL_TRUTH_RULE_CLAIM_PERSISTENCE_SCHEMA_1_HANDOFF_2026-10-01.md`
7. `lib/readiness/evidence.ts`
8. `lib/readiness/rule-claims.ts`
9. the two canonical Official-Truth migrations named above
10. ADR-0216 through ADR-0219 in `DECISIONS.md`

Live evidence wins over stale current-pointer text in old continuity files.

## 2. Goal

Implement the first **trusted server-only accepted-store writer/adapter**.

This slice creates a dormant persistence path for:

1. an `EvidenceVersion` that became `accepted / valid` only through the existing canonical server-side acceptance function; and
2. an `AkzeptierteRegelClaim` returned only by `regelKandidatAkzeptieren()`.

It must not create a second evaluator or a second acceptance constructor.

The path is not wired into `requirementsProviderAus()`, user queries, Source Router, Copilot, cron, queues or any runtime orchestration in this slice.

## 3. Non-negotiable truth boundary

### Accepted Evidence

The TypeScript writer must call the existing `evidenceKandidatAkzeptieren(...)` path. It must not accept an arbitrary object merely because it looks like `accepted / valid`.

After acceptance it must derive the source-neutral `rule_scope_key` using the existing canonical `regelScopeAusEvidenceScope(...)` logic. Do not reimplement the hash.

The persistence DTO is built only from the returned accepted Evidence object plus that derived key.

### Accepted Rule Claim

The TypeScript writer must call the existing `regelKandidatAkzeptieren(...)` path.

Persist only the returned `AkzeptierteRegelClaim`.

Do not persist:
- `RegelKandidat`;
- `proposal`;
- `research_gap`;
- `unresolved_conflict`;
- `stale_primary_evidence`;
- model output that did not pass canonical acceptance.

`rule_scope_key` must be the claim's canonical `key`; do not accept a caller-supplied alternative.

Support rows must be derived from the accepted claim's `supportVersionIds`, not from arbitrary caller-provided source identities.

The matching typed fact rows must be derived from the accepted claim's `fact`.

## 4. Database gateway

Direct grants on `private.official_*` remain forbidden.

Because the current Supabase Data API cannot directly write these private tables through `service_role`, add **one narrowly scoped database gateway** for this writer.

Required shape:

- one uniquely named RPC function: `public.official_truth_store_accepted_v1`;
- no overload;
- `SECURITY DEFINER`;
- fixed empty `search_path` (or an equally strict fixed path justified in the report);
- every relation/function reference in the body schema-qualified;
- `REVOKE EXECUTE` from `PUBLIC`, `anon`, and `authenticated`;
- `GRANT EXECUTE` only to `service_role` among Data-API roles;
- no direct table grant to `service_role`;
- no browser/authenticated/anon write path;
- no public read function;
- no UPDATE/DELETE/supersession path in this first writer;
- no seed data.

The gateway is a **transaction transport**, not a truth engine. It may validate the transport/persistence shape and rely on existing table constraints, but it must not independently decide whether research evidence is true.

It must support exactly two operation kinds:

- `accepted_evidence`
- `accepted_rule_claim`

Reject every other operation.

### Evidence operation

Persist one already accepted Evidence version into `private.official_evidence_versions`.

The referenced `official_sources` row must already exist. This slice does not create or seed a Source Registry catalog.

No silent overwrite. A conflicting duplicate fails closed. An exact duplicate may either fail closed or be treated as an exact idempotent no-op, but it must never UPDATE stored truth. Document the chosen behavior.

### Rule-claim operation

Persist one accepted Rule Claim as a single atomic transaction:

- one `private.official_rule_claims` row;
- exactly the matching typed fact row(s) for its `factKind`;
- support rows in `private.official_rule_claim_support`.

Source identity/class for each support must be resolved from the already stored Evidence version, not trusted from an arbitrary caller field.

The existing deferred fact-payload constraint must still be meaningful. Do not disable or bypass it.

Do not add SQL acceptance rules that compete with `regelKandidatAkzeptieren()`.

No partial claim/fact/support state may survive an error.

## 5. Server-only adapter

Create a dedicated server-only module under `lib/readiness/`.

Requirements:

- use the repository's supported server-only boundary;
- no browser import path;
- the service-role secret is read only server-side and never from a `NEXT_PUBLIC_*` variable;
- no secret value in source, tests, docs, logs or GitHub;
- construct/use a Supabase client only inside this server boundary;
- session persistence and URL session detection disabled;
- no direct `.schema('private').from(...)` writes;
- call only `official_truth_store_accepted_v1`;
- fail closed when server credentials are missing;
- expose acceptance+store operations, not a public “store arbitrary accepted shape” bypass;
- no automatic retries that could hide a partial-write bug;
- no external HTTP call except the normal Supabase RPC made only when the dormant writer is explicitly invoked.

Prefer dependency injection around the tiny RPC boundary so unit tests do not need real credentials or network access.

## 6. Migration identity

If a new migration is needed:

- create it with the Supabase CLI command `supabase migration new official_truth_trusted_store_writer_1`;
- do not invent the timestamp by hand;
- exactly one new migration file for this slice;
- Cursor must **not** apply, push, repair, rebase or reset any remote Supabase migration.

Development application, if accepted later, is Technical-Lead work after exact-head PASS.

Production application is not authorized.

## 7. Required tests

At minimum prove:

### Canonical acceptance
- candidate Evidence that has not passed `evidenceKandidatAkzeptieren` cannot reach the RPC;
- accepted Evidence reaches the RPC with canonical `rule_scope_key`;
- a raw accepted-shaped object is not an alternate public writer API;
- Rule Claim persistence invokes/uses the canonical `regelKandidatAkzeptieren` result;
- `research_gap`, `unresolved_conflict`, stale candidate quality and a model proposal cannot be stored as a claim;
- composed primary-source acceptance still requires the existing canonical support/source rules.

### Persistence compilation
For every `factKind`, prove the accepted claim maps to the correct table payload:
- `requirement_effect`
- `visa_options`
- `stay_limit`
- `passport_validity`
- `blank_passport_pages`
- `transit_conditions`
- `official_actions`
- `temporal_rule`

Airport arrays remain canonical and have no invented finite maximum.

### Transaction / security
Using a throwaway local PostgreSQL proof or an equally strong isolated proof:
- prior two Official-Truth migrations + the new migration apply cleanly;
- `anon` cannot execute the new function;
- `authenticated` cannot execute the new function;
- `service_role` can execute only the gateway, not directly write the private tables;
- an invalid fact/support causes the whole Rule Claim operation to roll back;
- no partial claim/fact/support rows remain after failure;
- the function does not create source catalog rows;
- the migration itself inserts zero rows;
- no Official-Truth table grant was widened;
- RLS enabled+forced/no-policy posture remains unchanged;
- no `SECURITY DEFINER` function other than the one explicit gateway is introduced by this slice.

Use synthetic `*.example` sources and synthetic IDs only. Drop the throwaway database after proof.

## 8. Exact allowlist

Only these paths may change:

- `lib/readiness/official-truth-store-server.ts`
- `lib/readiness/official-truth-store-server.test.ts`
- exactly one new `supabase/migrations/*_official_truth_trusted_store_writer_1.sql`
- `docs/OFFICIAL_TRUTH_TRUSTED_STORE_WRITER_1_TASK_2026-10-01.md`
- `docs/OFFICIAL_TRUTH_TRUSTED_STORE_WRITER_1_REPORT_2026-10-01.md`
- `docs/OFFICIAL_TRUTH_TRUSTED_STORE_WRITER_1_HANDOFF_2026-10-01.md`
- `docs/OFFICIAL_TRUTH_TRUSTED_STORE_WRITER_1_SELF_REVIEW_2026-10-01.md`
- `ARCHITECTURE.md`
- `DECISIONS.md`
- `docs/OFFICIAL_TRUTH_SOURCE_EVIDENCE_ARCHITECTURE_2026-10-01.md`
- `JETNITY_START_HERE.md` only to correct the current pointer
- `docs/ACTIVE_WORK_STATUS.md` only to correct the current writer/status pointer

Do **not** modify `lib/readiness/evidence.ts`, `lib/readiness/rule-claims.ts`, `lib/readiness/engine.ts`, `lib/readiness/official.ts`, provider code or UI code.

If the implementation cannot be completed within this allowlist without weakening an existing contract, STOP and report the blocker. Do not widen scope yourself.

## 9. Hard non-scope

Absolutely no:

- Candidate-Evidence import;
- CH-01..CH-10 import;
- CH-11 research;
- real government/source catalog rows;
- real authority/provider data;
- OpenAI call;
- web crawl/fetch;
- Sherpa/Timatic/KAYAK call or contact;
- provider signup/terms/DPA/credentials/spend;
- `requirementsProviderAus()` activation;
- traveller-specific OfficialEvaluation persistence;
- user/account/trip/traveller identity in global truth;
- passport/document number, MRZ, scan, biometric or health-record persistence;
- UI;
- cron;
- queue;
- monitor;
- source refresh orchestration;
- demand-driven orchestration;
- #626 work;
- indexing/public-launch change;
- Production database mutation.

## 10. Validation before push

- fetch `origin/main`;
- prove merge-base remains the baseline or report drift before editing further;
- prove branch is 0 behind at final push;
- `git diff --check`;
- focused writer tests;
- focused migration/static tests;
- full `npm test`;
- `npm run typecheck`;
- `npm run lint`;
- `npm run build`;
- `npm run check:operating-mode`;
- standard repository hygiene checks;
- prove changed paths are exactly within the allowlist;
- prove no real source rows, import fixture or secret exists in diff.

After push:

- exact-head GitHub CI/Auth;
- exact-head Vercel Preview;
- unresolved review threads = 0 before claiming handoff-ready;
- record actual Cursor session URL and `originalModelName`.

Stay Draft.

## 11. STOP

Cursor must not:

- mark Ready;
- merge;
- apply any remote migration;
- write Development data;
- touch Production;
- start Source Registry catalog work;
- start Candidate Evidence import;
- start any follow-up slice.

**STOP for independent Technical-Lead exact-head review.**
