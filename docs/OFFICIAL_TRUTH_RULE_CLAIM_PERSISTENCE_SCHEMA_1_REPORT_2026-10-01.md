# Official Truth Accepted Rule Claim Persistence Schema 1 — Report

Date: 1 October 2026
Issue: #678
Pull request: Draft #679
Branch: `feat/official-truth-rule-claim-persistence-schema-1`
Baseline: `main@f4ed316714687ca597c59ce47bfb69f5a290440b`
Task: `docs/OFFICIAL_TRUTH_RULE_CLAIM_PERSISTENCE_SCHEMA_1_TASK_2026-10-01.md`
Task seed: `92e7bdac36ca96cc7af293eaaf65f1ee4c6ba784` — not the review head

Logical agent: **Jetnity Official Truth accepted Rule Claim persistence schema 1**, Generation 1
Session: https://cursor.com/agents/bc-2a2f9c56-970f-4445-a26b-191272ae7dd4
`originalModelName`: `grok-4.7-high-fast` (Grok 4.7 High Fast). Not Auto. Recorded from this run before editing.

Status: **REPOSITORY SCHEMA DELIVERED / NOT APPLIED / DRAFT / NO TL PASS / NO READY / NO MERGE**

## 1. Baseline reconstruction

Re-verified in this session before editing:

| Fact | Result |
| --- | --- |
| Machine mode | `NORMAL` in `.jetnity/operating-mode.json`. This slice does not edit that file. |
| `git fetch origin main` | `origin/main` = `f4ed316714687ca597c59ce47bfb69f5a290440b` |
| Merge-base of this branch and `origin/main` | the same SHA |
| Ahead / behind before this delivery | 0 behind, 1 ahead. The ahead commit is the task seed `92e7bdac36ca96cc7af293eaaf65f1ee4c6ba784`. |
| Latest ADR on that main | ADR-0218. ADR-0219 was free and is used here. |
| Open pull requests | Draft #679 is this writer. Historical drafts #52, #50, #40, #39 and #28 are not current writers. |
| Issue #678 | OPEN |
| Supabase CLI on PATH | not present. Official binary `2.48.3` was downloaded outside the repository. `supabase migration new official_truth_accepted_rule_claim_persistence_schema_1` created `supabase/migrations/20261001140356_official_truth_accepted_rule_claim_persistence_schema_1.sql`. The timestamp was not typed by hand. The CLI also reported that `2.119.0` exists. This slice did not upgrade it after the file existed. |

Stated by the binding task and **not re-proven by a remote query in this session**:

- Supabase Development branch `develop`, PostgreSQL 17.6, migration `20261001121258_official_truth_private_evidence_store_schema_1`, three private tables, row counts 0 / 0 / 0, no Rule Claim table
- Supabase Production `qscbgcdmivbbnzrcyegn` has no Official-Evidence migration and no Official-Truth private tables
- #626 remains OPEN / BLOCKED

This session did not query Supabase, did not apply a remote migration, did not open a mailbox, and did not change #626, indexing or launch.

## 2. What the migration stores

One new repository migration. It alters two existing private tables and creates ten new ones.

`private.official_sources` gains a unique key on `(source_id, source_class)` so later foreign keys can prove the class. `source_id` was already the primary key. The extra key does not change which source rows are valid.

`private.official_evidence_versions` gains `rule_scope_key text not null` with the check `^rule-scope:v1:[a-f0-9]{64}$`, plus a unique key on `(version_id, rule_scope_key, lifecycle, validation_state, source_id)`. SQL does not compute the key. `lookup_key` and `evidence-key:v2:` are not modified. Existing lifecycle values stay `candidate`, `accepted`, `conflicted` and `superseded`.

`private.official_rule_claims` stores one current accepted claim. `claim_id` is `bigint generated always as identity`. It is persistence identity, not Product Truth and not the rule scope key. `lifecycle` is fixed to `accepted`. `validation_state` is fixed to `valid`. `evidence_quality` allows only `explicit_primary_statement` and `composed_from_multiple_primary_sources`. `accepted_at` is required and has no default. Scope columns repeat the evidence-store fail-closed checks, including `IS NOT NULL` before a required child value. The issuer is not copied into citizenship. A null related citizenship stays unlinked. `unique (rule_scope_key, fact_kind)` allows one current accepted fact per scope and kind. There is no candidate history.

`private.official_rule_claim_support` has primary key `(claim_id, version_id)`. Composite foreign keys prove:

- the support row belongs to the claim's `rule_scope_key`
- the evidence row is that exact version
- the evidence lifecycle stored on the support row is `accepted` and matches the evidence row
- the evidence validation stored on the support row is `valid` and matches the evidence row
- the source id matches the evidence row
- the source class is `official_authority` and matches `official_sources`

A licensed provider cannot be inserted as `source_class` on a support row. The check rejects that value, and the source foreign key also rejects a licensed source id presented as `official_authority`.

Eight typed fact tables replace an unrestricted JSONB blob:

- `official_rule_claim_requirement_effect`
- `official_rule_claim_visa_options`
- `official_rule_claim_stay_limit`
- `official_rule_claim_passport_validity`
- `official_rule_claim_blank_pages`
- `official_rule_claim_transit_paths`
- `official_rule_claim_actions`
- `official_rule_claim_temporal_rule`

Each fact row references `(claim_id, fact_kind, requirement_type)`, so it cannot attach to the wrong kind. `visa_options`, `passport_validity`, `blank_passport_pages` and `transit_conditions` are also bound to their requirement type on the claim. The other four kinds are not, matching ADR-0218.

No seed row is in the migration. No Candidate Evidence is imported. No CH batch is imported. `requirementsProviderAus()` still returns `null`. There is no runtime writer.

## 3. What SQL deliberately does not decide

These stay with the later trusted writer, which must call `regelKandidatAkzeptieren()`:

- minimum support count
- distinct official `source_id` count for composed quality
- equality between `rule_scope_key` and the typed scope columns
- host-to-source resolution of an official-action href

There is no trigger and no counting function for support count or distinct sources. The href check is a canonical HTTPS shape only.

`unique (rule_scope_key, fact_kind)` means this table is the current accepted fact, not a history of replacements. A later supersession model would be a new decision.

Technical-Lead review R1 corrected two earlier residuals. A present airport list has no finite maximum. `private.official_rule_claim_transit_airports_ok` requires it to be non-empty, IATA-shaped, strictly sorted and unique. The database does not prove that an airport exists. `lib/readiness/rule-claims.ts` was not edited. `flughaefenLesen` still canonicalizes duplicates and unsorted input and still rejects a malformed code. Persistence stores the canonical list.

Every accepted claim must have at least one matching fact row at commit. A deferred constraint trigger enforces that. Scalar kinds keep their one-row primary key. `visa_options`, `transit_conditions` and `official_actions` require at least one row. Deleting the last matching fact row while the claim remains fails at commit. The fact-table foreign keys to the claim are deferred, so claim and fact can be inserted in either order in one transaction. The trigger does not reimplement acceptance.

## 4. Security boundary

`supabase/config.toml` still exposes only `public` and `graphql_public`. This slice does not edit that file and does not change default privileges.

RLS is enabled and forced on all ten new tables. There is no policy. On Supabase, `service_role` bypasses RLS, so the migration also revokes that role on every new table. The revoke is the control for `service_role`. RLS without a policy is the control for roles that do not bypass RLS.

There is no `SECURITY DEFINER` function, no public RPC, no cron, no queue and no HTTP call. Three private `security invoker` functions exist: the immutable airport helper, the stable fact-payload predicate, and the deferred constraint-trigger function. Each sets `search_path = pg_catalog`. `EXECUTE` is revoked from `PUBLIC`, `anon`, `authenticated` and `service_role`. Nine constraint triggers are `deferrable initially deferred`. No new column stores a user, account, trip, traveller, passport number, MRZ, biometric, date of birth, name, email, phone or health record. Health and vaccination requirement types remain regulatory metadata.

## 5. Local proof

Throwaway PostgreSQL 16.15 accepted both the existing evidence migration and this migration. The proof then accepted a valid official support link, an unlinked credential relation, a related citizenship inside the set, a different-unit rolling window, an ordered same-anchor temporal rule, and one row of each fact kind that was exercised.

It rejected, with the expected SQLSTATE: candidate lifecycle, `research_gap`, a second accepted fact for the same scope and kind, visa options on `passport_validity`, a null document type, a required residence without a country, a travel-date mode without a date, a related citizenship outside the set, effect `unknown`, `required` plus `visa_exempt`, `not_required` plus `visa_on_arrival`, a non-visa effect with a visa mode, visa option `unknown`, ordinal 5, a duplicate visa mode, a stay row with no duration, 3661 days, a same-unit rolling window that is not greater, a duration on `valid_on_entry`, blank pages 0 and 11, 20161 transit minutes, a transit path with no condition, unsorted airport codes, support of candidate evidence, a licensed support class, a licensed source forced to `official_authority`, a licensed action source, an empty temporal rule, a non-zero `at` offset, an impossible same-anchor window, an evidence lifecycle change while a support row exists, and a fact row whose kind does not match the claim.

Ten claim tables had forced RLS, zero policies, and no grant to `anon`, `authenticated`, `service_role` or `PUBLIC`. The database was dropped. Development and Production were not contacted.

The R1 correction was proved again on throwaway PostgreSQL 16.15 and then dropped. The same canonical 17-code list accepted by `regelKandidatAkzeptieren` was stored as a transit path. A 40-code sorted list was also accepted. Unsorted, duplicate, malformed and empty airport arrays were rejected. A claim with no fact row failed at the deferred check for `requirement_effect`, `visa_options`, `transit_conditions` and `official_actions`. Each of the eight fact kinds committed with a matching payload. A second scalar fact row still failed the primary key. Deleting one of two visa options committed. Deleting the last visa option, and deleting the only scalar fact row, failed while the claim remained. Inserting the claim and then the fact succeeded. Inserting the fact and then the claim, with the foreign key deferred, also succeeded. Catalog readback showed the airport helper `immutable`, the payload predicate `stable`, the trigger function `volatile`, all three `security invoker` with `search_path=pg_catalog`, and all nine fact triggers `deferrable` and `initially deferred`. `PUBLIC`, `anon`, `authenticated` and `service_role` had no `EXECUTE` on the three functions.

This is not the Development server. The task states Development is PostgreSQL 17.6. Local 16.15 does not replace the Technical-Lead apply or the advisor readback.

## 6. Changed-file manifest

Allowlist only:

- `supabase/migrations/20261001140356_official_truth_accepted_rule_claim_persistence_schema_1.sql`
- `lib/readiness/rule-claim-store-schema.test.ts`
- `ARCHITECTURE.md`
- `DECISIONS.md`
- `docs/OFFICIAL_TRUTH_SOURCE_EVIDENCE_ARCHITECTURE_2026-10-01.md`
- `docs/OFFICIAL_TRUTH_RULE_CLAIM_PERSISTENCE_SCHEMA_1_REPORT_2026-10-01.md`
- `docs/OFFICIAL_TRUTH_RULE_CLAIM_PERSISTENCE_SCHEMA_1_HANDOFF_2026-10-01.md`
- `docs/OFFICIAL_TRUTH_RULE_CLAIM_PERSISTENCE_SCHEMA_1_SELF_REVIEW_2026-10-01.md`

`docs/OFFICIAL_TRUTH_RULE_CLAIM_PERSISTENCE_SCHEMA_1_TASK_2026-10-01.md` is the unchanged binding task from the seed commit.
`docs/ACTIVE_WORK_STATUS.md` is outside the allowlist and was not edited. This report and the handoff are the continuity record for the slice.

`lib/readiness/rule-claims.ts`, `lib/readiness/evidence.ts` and `lib/readiness/official.ts` were not edited.

## 7. Validation

Recorded in this session before the push:

| Check | Result |
| --- | --- |
| `lib/readiness/rule-claim-store-schema.test.ts` | 12/12 pass |
| `npm test` | 4171 pass / 0 fail |
| `npm run typecheck` | pass (`next typegen` and `tsc --noEmit`) |
| `npm run lint` | 0 errors, 148 warnings. The warnings are pre-existing. The new schema test is not among them. |
| `npm run check:operating-mode` | PASS |
| `npm run check:api-schutz` | 12 admin routes checked |
| `npm run check:schema-bezug` | pass. The pre-existing LOCAL/UNAPPLIED RPC `admin_account_counts_v1` is still reported. |
| `npm run check:dead` | 0 unwarranted orphans |
| `npm run check:exports` | 0 unwarranted unused exports |
| `npm run check:deps` | 0 unused packages |
| `git diff --check` | pass |
| `npm run check:setup:ci` | pass, with the existing missing-`.env` warning |
| `npm run build` | pass. Next.js 16.3.8. 25 static pages. |

`db:rechte`, `db:rls`, `db:sicherheit` and `auth:pruefen` were not run locally. Those commands talk to the live Development project. This slice does not do that. GitHub CI runs `auth:pruefen` for the pull request. That job is not an apply of this migration.

## 8. Boundaries held

- No remote Supabase push, apply, repair, rebase or reset.
- No Development or Production mutation.
- No source, evidence or claim seed.
- No CH-01/02/03/04 import.
- No runtime writer or adapter.
- No OpenAI, web or provider call.
- No RequirementsProvider or engine wiring.
- No UI, cron, queue, indexing, launch or #626 work.
- Draft only. Cursor does not Ready or merge.
