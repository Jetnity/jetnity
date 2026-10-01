# Official Truth Candidate Evidence Batch Validator 1 — Handoff

Date: 1 October 2026
Issue: #701
Draft PR: #703
Branch: `feat/official-truth-candidate-batch-validator-1`
Baseline: `main@a3af1fea1e2cdcb461c9d65a913d653dfe467ce8`

Logical agent: **Jetnity Official Truth candidate batch validator 1**, Generation 1
Session: https://cursor.com/agents/bc-9f53581b-e94b-4ac0-a637-ae6198e26a1a
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

## Current state

The branch adds a pure research-batch validator. It is a Draft. It is not Ready and not merged.

Read first:

1. `docs/OFFICIAL_TRUTH_CANDIDATE_BATCH_VALIDATOR_1_TASK_2026-10-01.md`
2. `docs/OFFICIAL_TRUTH_CANDIDATE_BATCH_VALIDATOR_1_REPORT_2026-10-01.md`
3. `docs/OFFICIAL_TRUTH_CANDIDATE_BATCH_VALIDATOR_1_SELF_REVIEW_2026-10-01.md`
4. `lib/readiness/official-truth-candidate-batch.ts`

`docs/ACTIVE_WORK_STATUS.md` was not updated. It is outside the task allowlist. This handoff is the continuity pointer for the slice.

## Session facts

- Machine mode: `NORMAL`. This slice does not edit `.jetnity/operating-mode.json`.
- The first delivery was 0 behind `a3af1fea1e2cdcb461c9d65a913d653dfe467ce8`.
- R1 integrates `main@12d0e24b4268b878695f5b67c04cf34588166c51` (#702). Those research-request files were not edited. Re-fetch before treating any later SHA as current.
- `documentType: ordinary_passport` is preserved. Explicit, composed and stale entries need a non-null `officialSourceUrl`. Composed entries also need a distinct additional URL. `utm_*` and `gclid`, `dclid`, `fbclid`, `msclkid`, `gbraid`, `wbraid`, `mc_cid`, `mc_eid` fail closed.
- Parallel lane B. Do not edit the Research Request lane, the store writer, the source catalog, schema, global continuity or Supabase files from this slice.

## Trust rule for the next reader

A passing validation means the package is structurally and provenance-valid for later review. It does not mean the package may be imported, accepted or shown as Official Truth.

`promotion` is always `not_performed`. Gap, conflict and stale entries stay `not_importable_truth`. A research gap must not be read as `not_required`. An unresolved conflict must not be read as resolved. Stale primary evidence must not be read as current.

One batch is one citizenship and one document type. Do not fill citizenship from residence or from the issuing country. Another legal credential option is another batch. This function does not rank passports.

The function does not call `evidenceKandidatAkzeptieren` or `regelKandidatAkzeptieren`. It does not generate SQL and it does not call a store or catalog RPC. `requirementsProviderAus()` stays `null`.

## Do not start from here

- Do not import or promote a Candidate Evidence batch.
- Do not seed a real CH research file or a real government URL.
- Do not add an `importReady: true` result.
- Do not Ready or merge this PR. That remains the Technical Lead after an independent exact-head review.
- Do not treat this handoff as merge approval or as a Production gate.

## Next step

Independent Technical-Lead review of the exact pushed head. Cursor stops.
