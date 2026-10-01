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
- Only explicit and composed quality can be accepted. Composed quality needs two versions and two `sourceId` values. A research gap has a null proposal and cannot become `not_required`.
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

Local checks before the implementation push, on this working tree:

| Check | Result |
| --- | --- |
| `git diff --check` | pass |
| operating-mode guard | PASS |
| `lib/readiness/rule-claims.test.ts` | 17/17 pass |
| `npm test` | 4158 pass / 0 fail |
| `npm run typecheck` | pass |
| `npm run lint` | pass, 0 errors, 148 pre-existing warnings, none in the new files |
| `npm run check:setup:ci` | pass, existing missing-`.env` warning |
| `npm run build` | pass, Next.js 16.3.8, 25 static pages |
| hygiene | `check:dead`, `check:exports`, `check:deps`, `check:api-schutz` pass. `check:schema-bezug` pass and still notes LOCAL/UNAPPLIED `admin_account_counts_v1` |

Exact-head GitHub CI, Auth and Vercel Preview are recorded in the self-review only after they are read for a pushed SHA. They are not claimed here in advance.

## Stop

Draft only. Cursor does not Ready or merge. Cursor does not apply anything to Supabase, does not import Candidate Evidence, and does not start the next slice.

**STOP for independent main-chat Technical-Lead exact-head review.**
