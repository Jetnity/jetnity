# Official Truth Private Evidence Store Schema 1 — Report

Date: 1 October 2026
Issue: #674
Pull request: Draft #675
Branch: `feat/official-truth-private-evidence-store-schema-1`
Baseline: `main@0d6ff1846fe49ba614174c62b542373fc5454667`
Task: `docs/OFFICIAL_TRUTH_PRIVATE_EVIDENCE_STORE_SCHEMA_1_TASK_2026-10-01.md`
Task seed: `b974d0599c01053544982d603e4734941541b1c1` — not the review head

Logical agent: **Jetnity Official Truth private evidence store schema 1**, Generation 1
Session: https://cursor.com/agents/bc-7ddd81cb-1513-4ecc-9745-08a611b1b06b
`originalModelName`: `grok-4.7-high-fast` (Grok 4.7 High Fast). Not Auto. Recorded from this run before editing.

Status: **REPOSITORY SCHEMA DELIVERED / NOT APPLIED / DRAFT / NO TL PASS / NO READY / NO MERGE**

## 1. Baseline reconstruction

Re-verified in this session before editing:

| Fact | Result |
| --- | --- |
| Machine mode | `NORMAL` in `.jetnity/operating-mode.json`. This slice does not edit that file. |
| `git fetch origin main` | `origin/main` = `0d6ff1846fe49ba614174c62b542373fc5454667` |
| Merge-base of this branch and `origin/main` | the same SHA |
| Ahead / behind before this delivery | 0 behind, 1 ahead. The ahead commit is the task seed `b974d0599c01053544982d603e4734941541b1c1`. |
| Latest ADR on that main | ADR-0216. ADR-0217 was free and is used here. |
| Open pull requests | Draft #675 is this writer. Historical drafts #52, #50, #40, #39 and #28 are not current writers. |
| Supabase CLI on PATH | not present. Official binary `2.48.3` was downloaded outside the repository. `supabase migration new official_truth_private_evidence_store_schema_1` created `supabase/migrations/20261001111642_official_truth_private_evidence_store_schema_1.sql`. The timestamp was not typed by hand. The CLI also reported that `2.119.0` exists. This slice did not upgrade it after the file existed. |

Stated by the binding task and **not re-proven in this session**:

- Production project `qscbgcdmivbbnzrcyegn`
- Development branch `develop` being `ACTIVE_HEALTHY` with no Official Evidence tables and an empty `private` schema
- `pg_cron` installed and `pgmq` not installed
- provider waiting states for KAYAK, IATA and Sherpa
- #626 remains open and blocked

This session did not query Supabase, did not open a mailbox, and did not change #626, indexing or launch.

## 2. What the migration stores

Three tables in the unexposed schema `private`:

- `official_sources`
- `official_source_domains`
- `official_evidence_versions`

`private.official_evidence_validity_instant(text)` compares a date-only `YYYY-MM-DD` or a UTC instant. It is `IMMUTABLE`, `SECURITY INVOKER`, `search_path = pg_catalog`, and revoked from `PUBLIC`, `anon`, `authenticated` and `service_role`. It does not rewrite the stored text.

`valid_from` and `valid_until` are `text`. A date-only value stays date-only. `retrieved_at` is the TypeScript UTC instant string, not a date-only value. `version_id` is stored as `ev1_` plus 32 hex characters and is not recomputed from a reformatted clock.

Scope columns are typed. Issuing country and related citizenship are separate. A null relation stays unlinked. A non-null relation must belong to the sorted citizenship set. At least one of destination or transit is required. Requirement type is not null. There is no result column, so absence is not stored as `not_required`.

No seed row is in the migration. `requirementsProviderAus()` still returns `null`.

## 3. Security boundary

`supabase/config.toml` still exposes only `public` and `graphql_public`. This slice does not edit that file.

RLS is enabled and forced on all three tables. There is no policy, because these rows have no user owner. On Supabase, `service_role` bypasses RLS, so the migration also revokes that role. The revoke is the control for `service_role`. RLS without a policy is the control for roles that do not bypass RLS.

There is no `SECURITY DEFINER` function, no public RPC, no trigger, no cron, no queue and no HTTP call.

## 4. Changed-file manifest

Allowlist only:

- `supabase/migrations/20261001111642_official_truth_private_evidence_store_schema_1.sql`
- `lib/readiness/evidence-store-schema.test.ts`
- `ARCHITECTURE.md`
- `DECISIONS.md`
- `docs/OFFICIAL_TRUTH_SOURCE_EVIDENCE_ARCHITECTURE_2026-10-01.md`
- `docs/OFFICIAL_TRUTH_PRIVATE_EVIDENCE_STORE_SCHEMA_1_REPORT_2026-10-01.md`
- `docs/OFFICIAL_TRUTH_PRIVATE_EVIDENCE_STORE_SCHEMA_1_HANDOFF_2026-10-01.md`
- `docs/OFFICIAL_TRUTH_PRIVATE_EVIDENCE_STORE_SCHEMA_1_SELF_REVIEW_2026-10-01.md`

`docs/OFFICIAL_TRUTH_PRIVATE_EVIDENCE_STORE_SCHEMA_1_TASK_2026-10-01.md` is the unchanged binding task from the seed commit.
`docs/ACTIVE_WORK_STATUS.md` is outside the allowlist and was not edited. This report and the handoff are the continuity record for the slice.

## 5. Validations

| Check | Result |
| --- | --- |
| `git diff --check` | pass |
| `node scripts/operating-mode-guard.mjs` | pass |
| Targeted `lib/readiness/evidence-store-schema.test.ts` | **7/7 pass** |
| `npm test` | **4140 pass / 0 fail** after removing the CLI temp file described below |
| `npm run typecheck` | pass |
| `npm run lint` | pass, 0 errors. 148 existing warnings, none in the new schema test. |
| `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug` | pass. Schema check still notes the pre-existing LOCAL/UNAPPLIED RPC `admin_account_counts_v1`. |
| `npm run check:setup:ci` | pass, with the existing warning that no `.env` / `.env.local` is present |
| `npm run build` | pass. Next.js 16.3.8 compiled and generated 25 static pages. |
| Local PostgreSQL | PostgreSQL 16.15, throwaway database only. Final migration file applied. Database dropped afterward. Not Development. Not Production. |
| `db:rechte`, `db:rls`, `db:sicherheit`, `auth:pruefen` | not run. They target the live Development database. This slice must not apply or exercise the migration there. |
| Exact-head GitHub CI on `5a537ddb7107eef49779273b4556c38c25cfe679` | **SUCCESS**. Run `36855719623`, event `pull_request`, https://github.com/Jetnity/jetnity/actions/runs/36855719623. Typecheck, Lint & Build job `110347618104` **SUCCESS**. Auth-Konfiguration gegen config.toml job `110347617833` **SUCCESS**. |
| Vercel Preview on that same SHA | GitHub commit status context `Vercel` **success** at `2026-10-01T11:30:18Z`. Inspector `https://vercel.com/jetnity-e1b93c82/jetnity-app/BKSExJ7Cp1i3zPPeHwRR2SVySfGF`. GitHub deployment `6783105853`, environment **Preview**, state **success**, target `https://jetnity-nyhb0pcnx-jetnity-e1b93c82.vercel.app`. A direct GET of that host returned HTTP 302 to Vercel SSO, so this session did not read public HTML or `data-dpl-id`. |

These remote gates belong only to `5a537ddb7107eef49779273b4556c38c25cfe679`. The commit that records them is a new head. It does not inherit this CI, Auth job or Preview. Parent and `main` gates do not apply.

The first `npm test` in this session was 4139 pass / 1 fail. The failure was `supabase/.temp/cli-latest`, created by the Supabase CLI and already listed as a removed sanitation candidate. The path is gitignored. It was deleted. The rerun was 4140 pass / 0 fail. The temp file is not part of the commit.

Local PostgreSQL proof, with `TimeZone = Europe/Zurich`:

- date-only `2026-10-01` compares equal to `2026-10-01T00:00:00Z`
- `.1Z` compares equal to `.100Z` and later than `.099Z`
- invalid `2026-02-31` and hour 24 return null
- the migration itself inserted zero rows
- a stored `valid_from` of `2026-10-01` was read back unchanged
- a licensed provider with an authority name was rejected
- an official authority without an authority name was rejected
- scheme, port, path, userinfo, uppercase, numeric, wildcard, `localhost`, `.local` and `.localhost` domains were rejected
- a duplicate domain was rejected
- a related citizenship outside the set was rejected
- an unsorted citizenship array was rejected
- an explicit related citizenship equal to the issuing country was accepted
- a row with neither destination nor transit was rejected
- an inverted validity window was rejected
- `anon` reads and writes failed with insufficient privilege
- a non-bypass role with a temporary select grant saw zero rows under forced RLS
- `prosecdef` was false and `provolatile` was immutable

Those inserts existed only in the throwaway database and were dropped with it.

## 6. Things not touched

- Development and Production database data
- `requirementsProviderAus()`, the Official Truth engine, and `lib/readiness/official.ts`
- API routes and UI
- OpenAI, web, fetch, scraper, browser automation
- a real government-domain catalog
- Sherpa/Timatic adapter, contact, terms, credentials, spend
- Production env, indexing, launch, #626, PrivacyBee
- personal passport, MRZ, scan, biometric, date of birth, health record, user/trip/traveller ids

## 7. Residuals

- SQL does not prove DNS ownership or that `example.com` and `www.example.com` collide.
- The canonical URL check rejects obvious non-HTTPS, userinfo, localhost and `.local` forms. It is not a second implementation of `quelleUrlLesen`.
- ISO-2 checks are shape checks.
- A source row can exist before its first domain row. No trigger was added to close that.
- A self-FK blocks a missing or self parent. It does not prove the chain is acyclic if a later privileged writer updates two rows.
- Source class and authority live only on `official_sources`. A later privileged update of that row would change the identity seen by existing versions. This slice does not copy those fields onto the version, because a second writable copy would drift without a trigger.
- Local PostgreSQL 16.15 is not evidence of the Development major version.

## 8. Exact next step — proposal only

Do not dispatch from this slice.

Independent Technical-Lead review of this Draft is the next action. After an exact-head PASS, the Technical Lead may apply this one migration to Development and run readback plus security and performance advisors. Production remains a Product-Owner gate. A server-only store adapter is a separate slice. Cursor does not Ready, merge, apply the migration, or start that slice.
