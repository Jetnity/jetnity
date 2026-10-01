# Official Truth Private Evidence Store Schema 1 — Handoff

Date: 1 October 2026
Issue: #674
Draft PR: #675
Branch: `feat/official-truth-private-evidence-store-schema-1`
Baseline: `main@0d6ff1846fe49ba614174c62b542373fc5454667`

Logical agent: **Jetnity Official Truth private evidence store schema 1**, Generation 1
Session: https://cursor.com/agents/bc-7ddd81cb-1513-4ecc-9745-08a611b1b06b
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

## Current state

Technical-Lead review `5378817724` on `55c7956301c692ee52b8f47be0964fc9ab046c53` is **CHANGES REQUIRED**, finding R1-F1.

R1-F1 is corrected in the same migration file. PostgreSQL lets a `CHECK` pass when the expression is `NULL`. The option, required-residence and `travel_date` branches now test the required child with `IS NOT NULL` before the value check. `related_citizenship_country_code = NULL` stays the unlinked state. `not_applicable` still requires its child fields to be null.

Technical-Lead review `5379062494` is **CHANGES REQUIRED** for migration identity only. The Technical Lead already applied the accepted SQL to Development. Supabase recorded that apply as `20261001121258_official_truth_private_evidence_store_schema_1`. That version was not invented in this session. The repository file was renamed with `git mv` from `20261001111642_official_truth_private_evidence_store_schema_1.sql`. SHA-256 is unchanged: `2e4a715c7270e90e936e753232d191b0bcb2ce3ad455099ef9e812b182d50524`. Cursor did not apply the migration again and did not touch Production. There are no seed rows, no store adapter and no provider activation.

Migration file:

`supabase/migrations/20261001121258_official_truth_private_evidence_store_schema_1.sql`

Read first:

1. `docs/OFFICIAL_TRUTH_PRIVATE_EVIDENCE_STORE_SCHEMA_1_TASK_2026-10-01.md`
2. `docs/OFFICIAL_TRUTH_PRIVATE_EVIDENCE_STORE_SCHEMA_1_REPORT_2026-10-01.md`
3. `docs/OFFICIAL_TRUTH_SOURCE_EVIDENCE_ARCHITECTURE_2026-10-01.md`
4. ADR-0217 in `DECISIONS.md`

`docs/ACTIVE_WORK_STATUS.md` was not updated. It is outside the task allowlist. This handoff is the continuity pointer for the slice.

## Session facts

- Machine mode: `NORMAL`
- `git fetch origin main` in this session: `0d6ff1846fe49ba614174c62b542373fc5454667`
- Merge-base was that SHA. The branch was 0 behind and 1 ahead. The ahead commit is the task seed `b974d0599c01053544982d603e4734941541b1c1`.
- Open drafts besides #675 are historical #52, #50, #40, #39 and #28. They are not current writers.
- The Supabase CLI was not on PATH. The official `2.48.3` binary was used only to create the empty migration file. It was not used to push, repair or apply a remote migration.
- Local proof used throwaway PostgreSQL 16.15 and was dropped. Development and Production were not contacted.
- `npm test` after removing gitignored `supabase/.temp/cli-latest`: **4140 pass / 0 fail**
- Implementation head `5a537ddb7107eef49779273b4556c38c25cfe679`: GitHub CI run `36855719623` **SUCCESS**. Typecheck, Lint & Build job `110347618104` **SUCCESS**. Auth job `110347617833` **SUCCESS**. Vercel commit status **success**, inspector `https://vercel.com/jetnity-e1b93c82/jetnity-app/BKSExJ7Cp1i3zPPeHwRR2SVySfGF`. GitHub Preview deployment `6783105853` **success**, target `https://jetnity-nyhb0pcnx-jetnity-e1b93c82.vercel.app`. That host returned HTTP 302 to Vercel SSO, so public HTML was not read.
- The commit that records those gates is a newer head. It does not inherit run `36855719623`, Auth job `110347617833`, Typecheck job `110347618104`, or Preview deployment `6783105853`. Do not treat `main` or a parent PR as this head's gate.
- R1 review head `55c7956301c692ee52b8f47be0964fc9ab046c53` had its own green CI. That CI does not cover the R1 correction.
- Correction head `3b99d57581f362076dcbdf618f62d451c87f2067`: GitHub CI run `36858435155` **SUCCESS**. Typecheck, Lint & Build job `110356426704` **SUCCESS**. Auth job `110356425778` **SUCCESS**. Vercel commit status **success**, inspector `https://vercel.com/jetnity-e1b93c82/jetnity-app/De1DAXtqgL8oG5BJjMFpg5zj2sKD`. GitHub Preview deployment `6783588278` **success**, target `https://jetnity-pdmt06zdx-jetnity-e1b93c82.vercel.app`. That host returned HTTP 302 to Vercel SSO, so public HTML was not read.
- The commit that records those correction gates is a newer head. It does not inherit run `36858435155`, Auth job `110356425778`, Typecheck job `110356426704`, or Preview deployment `6783588278`.
- R2 renames the repository migration to the Development history version `20261001121258`. SQL bytes are unchanged. No second remote apply.
- Identity head `fab9d9d16522dc03f5fa86a21ef2962c71748463`: GitHub CI run `36860729134` **SUCCESS**. Typecheck, Lint & Build job `110363992056` **SUCCESS**. Auth job `110363991796` **SUCCESS**. Vercel commit status **success**, inspector `https://vercel.com/jetnity-e1b93c82/jetnity-app/G4AgvpUSApyf7wn9BUUCZCDo9vFr`. GitHub Preview deployment `6784006355` **success**, target `https://jetnity-2ou63d0wz-jetnity-e1b93c82.vercel.app`. That host returned HTTP 302 to Vercel SSO, so public HTML was not read.
- The commit that records those identity gates is a newer head. It does not inherit run `36860729134`, Auth job `110363991796`, Typecheck job `110363992056`, or Preview deployment `6784006355`. Gates for `6952d6e44a1a73fee7e0ad07d33811059b7686ee` do not cover `fab9d9d16522dc03f5fa86a21ef2962c71748463`.
- R1 local proof: static schema test **8/8**. Throwaway PostgreSQL 16.15 rejected option-null document type, option-null issuing country, required-residence-null country, and travel-date-null date, each with `23514` on the matching check. Unlinked related citizenship and not_applicable-with-null-children were accepted. The throwaway database was dropped.

## Stop

Stay Draft.

Cursor does not Ready, merge, apply this migration to Development or Production, call OpenAI or the web, activate a provider, contact Sherpa/IATA/KAYAK, continue #626, change indexing or launch, or start a follow-up slice.

**STOP for independent Technical-Lead review of the R2 identity head.**

## Proposal only — not selected

Development already has this schema under `20261001121258`. Accepting the R2 head does not authorize a second apply, a remote history repair, a server adapter, a source-identity freeze, or Production DDL.
