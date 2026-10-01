# Official Truth Candidate Evidence Batch Validator 1 — Report

Date: 1 October 2026
Issue: #701
Draft PR: #703
Branch: `feat/official-truth-candidate-batch-validator-1`
Baseline: `main@a3af1fea1e2cdcb461c9d65a913d653dfe467ce8`

Logical agent: **Jetnity Official Truth candidate batch validator 1**, Generation 1
Session: https://cursor.com/agents/bc-9f53581b-e94b-4ac0-a637-ae6198e26a1a
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

This report is the author record. It is not a Technical-Lead PASS, not Ready, and not a merge.

## Result

`kandidatenChargeValidieren` in `lib/readiness/official-truth-candidate-batch.ts` answers one question: is this research package structurally and provenance-valid enough for a later human or system review?

A successful result keeps exactly:

- `researchStatus: RESEARCH_ONLY`
- `databaseImportStatus: NOT_APPROVED_FOR_DATABASE_IMPORT`
- `promotion: not_performed` on every destination

There is no `importReady` field. Explicit and composed entries are `review_only`. Gap, conflict and stale entries are `not_importable_truth`. Neither disposition accepts Evidence or declares Official Truth.

## What landed

- Envelope keys are `researchStatus`, `databaseImportStatus`, `citizenshipCountryCode`, `documentType` and `destinations`. The task required the two status values and did not name the keys. No operational batch file exists in this repository, so these names are the contract for this slice.
- One batch carries one explicit citizenship and one explicit document type. A second citizenship or document is another batch. The validator does not choose a passport and does not copy residence or issuing country into citizenship.
- `documentType` is a research-layer literal. `ordinary_passport` is preserved and is not rewritten to the trip value `passport`. `passport` and `national_id` stay explicit research values, not a default and not a read of `TRAVELLER_DOCUMENT_TYPES`. `unknown` and a missing document type fail.
- Country codes reuse `landescodeLesen`. Trim and uppercase are the only representation change, and they are tested. Citizenship is never derived.
- Destination provenance uses `officialSourceUrl`, `additionalOfficialSourceUrl`, `officialActionLink`, `retrievedAt`, `validFrom` and `validUntil`.
- Supporting URLs are the primary URL plus the additional list. The action link is stored separately and is not support.
- Evidence quality reuses `REGEL_EVIDENCE_QUALITAETEN`. No second quality taxonomy was added.
- `explicit_primary_statement`, `composed_from_multiple_primary_sources` and `stale_primary_evidence` require a non-null valid `officialSourceUrl`. An additional URL is not moved into that field.
- `composed_from_multiple_primary_sources` also needs at least one additional official URL that is distinct from the primary URL. Duplicates fail instead of being dropped.
- `research_gap` may still have no primary URL. `unresolved_conflict` is not given a new cardinality rule. `officialActionLink` is never support.
- `retrievedAt` is required except for a `research_gap` that cites no supporting URL. The form is the existing `checkedAtLesen` instant, it must already end in `Z`, and a calendar rollover fails. Comparison uses the injected clock only. A later instant fails. The same instant is allowed. There is no skew.
- `validFrom` and `validUntil` are `null` or an ISO date. An instant is not accepted there. If both are present, `validUntil >= validFrom`. Dates are not invented.
- URLs must already be absolute `https://`. They are not passed through `quelleUrlLesen`, because that rewrites the string with `URL.toString()`. A query name that begins with `utm_` fails, as do the pure tracking names `gclid`, `dclid`, `fbclid`, `msclkid`, `gbraid`, `wbraid`, `mc_cid` and `mc_eid`, case-insensitively. They are not stripped. `lang` and `ref` stay. The parameter value is not copied into the finding.
- Sensitive personal keys are rejected recursively. Findings carry the path and a stable code. They do not carry the value.
- Packages that claim approved, import-ready, Official Truth, database-import authorization or accepted evidence fail with `forbidden_claim`.

## Traveller context

The batch is one legal credential scope: one citizenship, one document type, one or more destinations. Residence and issuer keys cannot fill a missing citizenship. Route Truth is untouched. This file does not rank credential options and does not store a traveller identity.

## Boundaries kept

- No edit to existing Official Truth types, `rule-claims.ts`, `evidence.ts`, `official.ts`, `provider.ts`, `engine.ts`, the store writer or the source catalog.
- No database, network, provider, OpenAI, SQL, RPC or public API.
- `requirementsProviderAus()` stays `null`.
- No Candidate Evidence import and no real CH batch content.
- `docs/ACTIVE_WORK_STATUS.md` and `DECISIONS.md` were not edited. They are outside the task allowlist. This report and the handoff are the continuity for the slice.
- Research Request lane files were not edited.

## Validation

Re-read on this working tree before the commit. `git fetch origin main` moved the stale local pin `a659bd9080c66908a69fb3602214ee395a3e85e8` to `a3af1fea1e2cdcb461c9d65a913d653dfe467ce8`. That SHA is the merge-base. `git merge --ff-only origin/main` reported already up to date. The branch was 0 behind and 1 ahead (the task seed) before this commit.

| Check | Result |
| --- | --- |
| `git diff --check` | pass |
| operating-mode guard | PASS |
| `lib/readiness/official-truth-candidate-batch.test.ts` | 13/13 pass |
| `npm test` | 4258 pass / 0 fail, 745 suites |
| `npm run typecheck` | pass |
| eslint on the two new files | pass, no warnings |
| `npm run lint` | pass, 0 errors, 148 pre-existing warnings, none in the new files |
| `npm run build` | pass |
| `check:dead` | 0 orphans |
| `check:exports` | 0 unused exports |
| `check:deps` | pass |
| `check:api-schutz` | pass |
| `check:schema-bezug` | pass. It still lists the already known LOCAL/UNAPPLIED RPCs `admin_account_counts_v1`, `official_truth_source_catalog_v1` and `official_truth_store_accepted_v1`. This slice did not add an RPC. |

PostgreSQL 16 was installed in this VM so the existing store proof could find `/usr/lib/postgresql/16/bin/initdb`. That file was not edited. No database outside that throwaway cluster was contacted. `next-env.d.ts` typegen drift was restored and is not part of this change.

## R1 re-gate

Technical-Lead review `5386065012` on `cfab04d805213ec37c7c1eaf776d307a288584cf` required three fixes. This section is the current contract.

- R1-F1: `ordinary_passport` is accepted and returned unchanged. It is not a member of `TRAVELLER_DOCUMENT_TYPES`, and that enum was not edited.
- R1-F2: explicit, composed and stale entries fail closed when `officialSourceUrl` is null, even if an additional URL or an action link is present. Composed entries still need a distinct additional URL.
- R1-F3: `utm_*` plus `gclid`, `dclid`, `fbclid`, `msclkid`, `gbraid`, `wbraid`, `mc_cid` and `mc_eid` fail. `lang` and `ref` do not.

`git fetch origin main` moved main from `a3af1fea1e2cdcb461c9d65a913d653dfe467ce8` to `12d0e24b4268b878695f5b67c04cf34588166c51` (#702). The merge brought those six research-request files in unchanged. `git diff origin/main` on those files was empty. The branch was 0 behind after the merge.

| Check | Result |
| --- | --- |
| `lib/readiness/official-truth-candidate-batch.test.ts` | 13/13 pass |
| `npm test` | 4272 pass / 0 fail, 746 suites |
| `npm run typecheck` | pass |
| eslint on the two validator files | pass, no warnings |
| `npm run lint` | pass, 0 errors, 148 pre-existing warnings, none in the validator files |
| `npm run build` | pass |
| `git diff --check`, operating-mode guard, `check:dead`, `check:exports`, `check:deps`, `check:api-schutz` | pass |
| `check:schema-bezug` | pass, same three existing LOCAL/UNAPPLIED RPCs. No new RPC. |

## Exact-head gates

GitHub CI, the Auth job and Vercel Preview for the pushed tip are not properties of this prose. They are read after the push. Do not copy a baseline run from `a3af1fea` or from `cfab04d8`.
