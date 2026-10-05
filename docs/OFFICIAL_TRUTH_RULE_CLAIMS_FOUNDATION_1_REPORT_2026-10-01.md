# Official Truth Structured Rule Claims Foundation 1 — Report

Date: 1 October 2026
Issue: #676
Draft PR: #677
Branch: `feat/official-truth-rule-claims-foundation-1`
Baseline: `main@140fdfb9fb066ca9d23c295719cb2e770ae63fd7`

Logical agent: **Jetnity Official Truth structured rule claims foundation 1**, Generation 1
Session: https://cursor.com/agents/bc-755b4481-4bc0-4b4d-8047-75ae8a0d5da4
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

This report is the author record. It is not a Technical-Lead PASS, not Ready, and not a merge.

## Result

The pure rule-claim contract is in `lib/readiness/rule-claims.ts`. A candidate proposal is not accepted truth. `regelKandidatAkzeptieren` does not read that proposal. The accepted fact is built only from the separate `trustedRuleFact` and from EvidenceVersions that pass `akzeptierteEvidenceLesen`.

`OFFICIAL_REQUIREMENT_TYPES` is unchanged. Research labels are not requirement types.

## What landed

- Source-neutral scope and key `rule-scope:v1:` plus SHA-256. `sourceId` is the only excluded evidence-scope field. `evidence-key:v2:` is unchanged.
- Support is a sorted unique list of at most eight `ev1_` version ids. Scope mismatch fails closed.
- Qualities: `explicit_primary_statement`, `composed_from_multiple_primary_sources`, `stale_primary_evidence`, `unresolved_conflict`, `research_gap`.
- Only explicit and composed quality can be accepted, and only from `official_authority` evidence. Explicit needs one such version. Composed needs two such versions and two distinct official `sourceId` values. A licensed provider or a mixed set fails with `primary_source_required`. No provider quality is added. A research gap has a null proposal and cannot become `not_required`.
- Fact kinds: `requirement_effect`, `visa_options`, `stay_limit`, `passport_validity`, `blank_passport_pages`, `transit_conditions`, `official_actions`, `temporal_rule`.
- Visa consistency reuses `visaResultUndModusWidersprechen`. Temporal rules reuse `temporalRuleLesen`. Official actions resolve through the Source Registry and require `official_authority`.
- Duration safety bounds are technical, not legal truth: days 3660, months 120, years 10. Units are not converted. Transit duration is capped at 20160 minutes. Blank pages are integers 1..10.
- No database migration, no import, no provider call, no engine change, no UI.

## Parents

- #673 source/evidence contract, merged.
- #675 private evidence schema, merged as `main@140fdfb9fb066ca9d23c295719cb2e770ae63fd7`.
- Development has `20261001121258_official_truth_private_evidence_store_schema_1` and three private tables. The binding task records zero rows. This session did not query Supabase and did not change that.
- Production has no Official-Evidence migration or table. This session did not touch Production.

## Boundaries kept

- No SQL or Supabase mutation.
- No Candidate-Evidence import and no CH research batch.
- No OpenAI, web, fetch or provider call.
- `requirementsProviderAus()` stays `null`.
- No cron, queue, worker, UI, public API, indexing, launch or #626 work.
- `docs/ACTIVE_WORK_STATUS.md` was not edited. It is outside the allowlist. This report and the handoff are the continuity for the slice.

## Validation

Re-read on the R1-F1 correction working tree before this commit. `origin/main` remains `140fdfb9fb066ca9d23c295719cb2e770ae63fd7`. The branch is 0 behind.

| Check | Result |
| --- | --- |
| `git diff --check` | pass |
| operating-mode guard | PASS |
| `lib/readiness/rule-claims.test.ts` | 18/18 pass, including the R1-F1 authority regressions |
| `npm test` | 4159 pass / 0 fail, 729 suites |
| `npm run typecheck` | pass |
| eslint on the two rule-claim files | pass, no warnings |
| full-repo lint and production build | exact-head GitHub CI for this tip, not copied from `3d774ebd` or `09b9692b` |

## R1-F1

Technical-Lead review `5379808338` on `09b9692b9afbf619b552459008c080cf3ef52920` is CHANGES REQUIRED. Primary qualities accepted licensed providers as Official Truth. The correction requires `sourceClass === 'official_authority'` on every support for `explicit_primary_statement` and `composed_from_multiple_primary_sources`. Licensed-only and mixed support fail closed with `primary_source_required`. Same-source composed failure and the proposal-versus-trusted-fact regression stay. No new provider quality.

Parent CI `36866487394` belongs to `3d774ebd` and is not the gate for this correction. `09b9692b` had no exact-head GitHub CI run. The gate is CI, Auth and Vercel on the correction tip after this push.

## Stop

Draft only. Cursor does not Ready or merge. Cursor does not apply anything to Supabase, does not import Candidate Evidence, and does not start the next slice.

**STOP for independent main-chat Technical-Lead exact-head review.**
