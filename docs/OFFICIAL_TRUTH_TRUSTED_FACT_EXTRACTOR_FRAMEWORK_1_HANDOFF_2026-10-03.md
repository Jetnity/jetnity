# Official Truth Deterministic Trusted-Fact Extractor Framework 1 — Handoff

Date: 3 October 2026
Issue: #780
Draft PR: #781
Branch: `feat/official-truth-trusted-fact-extractor-framework-1`
Baseline at task dispatch: `main@ed5e249e375fd849895dafcc5c9b72cec4b377e1`
Integrated main at first delivery: `4c373442b2261de270e50e203f87ed06efc303cc` (Merge #778)
First-delivery merge commit on this branch: `d32427359671cd42090e160c3dfae017ced7b321`
Implementation commit: `71ad09c63f420a7643a97d1ca9be979a1f7507b1`
Reviewed head that received CHANGES REQUIRED: `6ffad6aeebfbde95d6624a1b9c5dfb8d1c85fc89`
Integrated main at this correction: `1e48b59b2950457909cb8ad02bbf7fcfd353ee12` (Merge #779)
Task: `docs/OFFICIAL_TRUTH_TRUSTED_FACT_EXTRACTOR_FRAMEWORK_1_TASK_2026-10-03.md`
Logical agent: **Jetnity Official Truth deterministic trusted-fact extractor framework 1**
Generation: **1**
Session: https://cursor.com/agents/bc-6431efb5-d76e-4580-9c99-4eae65caa60d
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

Read `docs/OFFICIAL_TRUTH_TRUSTED_FACT_EXTRACTOR_FRAMEWORK_1_REPORT_2026-10-03.md` and then this handoff. The task file was not rewritten. `docs/ACTIVE_WORK_STATUS.md` was not edited because the task forbids global current-state files. This handoff is the continuity record.

## Current state

`6ffad6ae` is the CHANGES REQUIRED head. It is not the correction review head. Re-fetch `origin/feat/official-truth-trusted-fact-extractor-framework-1` and review the tip that contains the R1/R2 correction.

At the correction fetch, `origin/main` was `1e48b59b2950457909cb8ad02bbf7fcfd353ee12`. This branch contains that SHA through `6ffad6ae` and was 0 behind it. `ed5e249e` is the task baseline. `4c373442` is the first-delivery main, not current main after Merge #779. Re-fetch main before review and do not treat a later SHA as already integrated.

Machine mode is `NORMAL`. This slice does not edit `.jetnity/operating-mode.json`.

Draft PR #781 stays Draft. Cursor does not Ready or merge.

## Contract the next reader must keep

`officialTruthTrustedFactExtrahieren` is the only production entry. Its extractor registry is the empty frozen constant. Do not register GOV.UK, Singapore ICA, IATA, Sherpa, a CH batch source, or a synthetic source in that constant. A fixture belongs in the test file or in `officialTruthTrustedFactExtrahierenMitDefinitionen`. A route that calls the seam, or that passes extractor id, version, or schema family, reopens the boundary.

The only bytes eligible for a matcher are `sourceSnapshot` on an object whose status is exactly `server_owned_official_retrieval`. `officialTruthAbgerufenMaterialPruefen` remains the historical submitted-material receipt. Its status `retrieved_material` is `representation_not_eligible` here. Do not point this framework at caller page text.

Recompute `evidenceQuellenFingerprint` before the matcher. Do not trust the supplied hash, content type, clock, or URL as authority until the checks in the report have passed. Selection is the code's current definition for that fact kind, source-id set, and observed content types. Two current matches fail closed. A non-current version stays addressable for provenance and is not selected.

Success is one complete fact that has already passed `regelFaktKanonischLesen`. Do not copy `proposal`, a suggestion, or a model object into that fact. Do not call `regelKandidatAkzeptieren` from this module. Provenance sits beside the fact. It is not a fact field.

One call is one `rule-scope:v1:` key. Do not rank citizenships or documents inside the extractor. Do not collect passport numbers, MRZ, biometrics, or health records. A personal key fails closed and the reason does not echo it.

The MIME pattern and the redirect cap of 5 mirror the server-owned retrieval boundary. This file does not import that module, because that module opens sockets. `import 'server-only'` is present and is only the server-stack marker. Do not raise either bound here. Do not treat the marker as permission to call the test seam from a route.

A path allowlist rule is queryless exact host plus exact pathname. `URL.search !== ''` does not match that rule. Do not strip a functional query from the retrieval result. A query-bearing canonical URL is allowed only by an exact URL rule that names that full string. Do not add a general query-policy type in this framework correction.

## Files

- `lib/readiness/official-truth-trusted-fact-extractor-registry.ts`
- `lib/readiness/official-truth-trusted-fact-extractor-registry.test.ts`
- `lib/readiness/rule-claims.ts`
- `lib/readiness/rule-claims.test.ts`
- `docs/OFFICIAL_TRUTH_TRUSTED_FACT_EXTRACTOR_FRAMEWORK_1_REPORT_2026-10-03.md`
- `docs/OFFICIAL_TRUTH_TRUSTED_FACT_EXTRACTOR_FRAMEWORK_1_HANDOFF_2026-10-03.md`
- `docs/OFFICIAL_TRUTH_TRUSTED_FACT_EXTRACTOR_FRAMEWORK_1_SELF_REVIEW_2026-10-03.md`

`rule-claims.ts` exports `regelFaktKanonischLesen` only as a wrapper around the existing private reader. The task file stays as assigned.

## What is not authorized

No Ready. No merge. No follow-up slice. Do not start a source-specific extractor or F8. Do not call `regelKandidatAkzeptieren`. Do not call either store writer. Do not add an endpoint. Do not apply a migration. Do not touch #626. Do not import a CH batch. Do not select a provider. Do not treat a frozen success object as Official Truth.

## Validation already recorded

First delivery, recorded on the CHANGES REQUIRED head `6ffad6ae`: focused extractor tests 28/28, rule-claim file 19/19, `npm test` 4546 pass / 0 fail / 766 suites after merging `4c373442`. Typecheck, lint, build, and hygiene passed there.

Correction gates on the R1/R2 tree, 0 behind `1e48b59b`: focused extractor tests 29/29. `npm test` 4554 pass / 0 fail / 766 suites. Typecheck pass. Lint 0 errors and 148 pre-existing warnings. Production build pass on Next.js 16.3.8 with 25 static pages. `check:operating-mode` PASS. `check:dead` 0 unreached (644 start points, 1296 reachable). `check:exports` 0. `check:deps` pass. `check:api-schutz` pass, 12 admin routes. `check:schema-bezug` pass with the same four LOCAL/UNAPPLIED RPCs. `git diff --check` pass. Local PostgreSQL proofs, when the full suite runs them, use temporary clusters. No remote database. Nothing was applied.

Exact-head CI and Vercel belong to the pushed tip, not to this text.

## Next step

Independent main-chat Technical-Lead re-review of the exact branch tip after this correction. Cursor does not Ready or merge. Do not start a source-specific follow-up.
