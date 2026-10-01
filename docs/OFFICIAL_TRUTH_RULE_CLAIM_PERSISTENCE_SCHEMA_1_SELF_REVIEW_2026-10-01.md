# Official Truth Accepted Rule Claim Persistence Schema 1 — Self-Review

Date: 1 October 2026
Issue: #678
Draft PR: #679
Branch: `feat/official-truth-rule-claim-persistence-schema-1`

Logical agent: **Jetnity Official Truth accepted Rule Claim persistence schema 1**, Generation 1
Session: https://cursor.com/agents/bc-2a2f9c56-970f-4445-a26b-191272ae7dd4
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

This is the author self-review. It is not a Technical-Lead PASS.

## Scope check

The diff stays inside the task allowlist. The binding task file is unchanged. `docs/ACTIVE_WORK_STATUS.md` was not edited, because the allowlist forbids it. Continuity for this slice is the report and this handoff pair.

No remote Supabase command was run. `supabase migration new` only created the empty local file. The migration was applied only to a local throwaway PostgreSQL 16.15 database, which was then dropped.

`lib/readiness/rule-claims.ts`, `lib/readiness/evidence.ts` and `lib/readiness/official.ts` were not edited.

## What I checked

- The migration filename came from `supabase migration new`, CLI `2.48.3`, after the binary was downloaded outside the repo. I did not invent the timestamp `20261001140356`.
- The CLI warned that `2.119.0` is newer. I did not recreate the file with a newer CLI, because that would mint a second timestamp.
- The same CLI wrote gitignored `supabase/.temp/cli-latest`. I deleted it. The sanitation test expects that path to be absent.
- Static test `lib/readiness/rule-claim-store-schema.test.ts`: 9/9. It reads constraint bodies after comments are stripped. It imports `REGEL_FAKT_ARTEN`, `AUFENTHALT_WERT_MAX`, `REGEL_TRANSIT_MINUTEN_MAX`, the temporal constants, visa modes, action purposes, requirement types and document types.
- `npm test`: 4168 pass / 0 fail.
- Typecheck passed. Lint passed with 0 errors and 148 pre-existing warnings, none in the new test.
- Hygiene checks passed. `check:schema-bezug` still reports the pre-existing LOCAL/UNAPPLIED RPC `admin_account_counts_v1`.
- Setup check passed with the existing missing-`.env` warning.
- Production build passed on Next.js 16.3.8 and generated 25 static pages.
- `git diff --check` and the operating-mode guard passed.
- Throwaway PostgreSQL 16.15 applied the parent evidence migration and this migration, then rejected the fail-closed cases named in the report. Forced RLS, zero policies and the role revokes were read back from the catalog.
- `rule_scope_key` is stored and not computed. `evidence-key:v2:` is not mentioned by the new migration and remains in the existing evidence migration and in `lib/readiness/evidence.ts`.

## Findings I am not calling done

1. `service_role` bypasses RLS. The migration revokes it on the new tables. A later grant to that role would expose the tables to a bypass role even with no policy. The next adapter must treat that grant as a security decision, not as a convenience.
2. SQL does not prove that `rule_scope_key` matches the typed scope columns. A privileged writer can store a key for a different scope. The later writer has to derive the key through `regelScopeAusEvidenceScope`.
3. SQL does not enforce support count or distinct official sources. A claim row can exist with zero support rows, and a composed-quality claim can exist with one source. `regelKandidatAkzeptieren` still rejects those cases. The database is not a second acceptance engine.
4. SQL does not require the matching fact table to contain a row, and it does not require visa options, transit paths or official actions to be non-empty. Ordinal bounds cap the maximum only. The writer must persist the full accepted fact.
5. `unique (rule_scope_key, fact_kind)` blocks a second accepted row of the same kind. That is the current accepted fact, not a history. Supersession needs a later decision.
6. Airport codes are capped at 16 in SQL because the task requires it. `flughaefenLesen` does not currently cap the count. I did not change the TypeScript contract. A fact the current reader accepts with 17 codes would be rejected by this table. The writer slice needs to know that, or a later slice needs to align the reader.
7. The official-action href check is narrower than `quellenUrlAufloesen`. It does not prove the host belongs to `action_source_id`.
8. Local PostgreSQL 16.15 does not prove Development PostgreSQL 17.6. This session did not re-query Development row counts. If evidence rows exist before the Technical Lead applies this file, `rule_scope_key text not null` fails closed instead of inventing a key. That failure is preferable to a fabricated key. Development application and the advisor readback remain Technical-Lead work after PASS.
9. `db:rechte`, `db:rls`, `db:sicherheit` and `auth:pruefen` were not run here. Running them would talk to the live Development project. GitHub CI still runs `auth:pruefen` for the pull request. That job reads Auth configuration. It is not this slice applying SQL.
10. Adding `rule_scope_key` does not re-grant `official_evidence_versions`. Table privileges from ADR-0217 remain the control for that table. This migration revokes the ten new tables only.

## Exact-head gates

The pushed tip is the review head. GitHub CI, Auth and Vercel Preview must be read on that SHA after the push. This self-review does not copy a run id into git, because that copy would be a newer head. A parent SHA or `main` is not this head's gate.
