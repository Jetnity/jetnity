# Official Truth Decoded Regulatory Scope Binding 1 — Handoff

Date: 3 October 2026
Issue: #786
Draft PR: #787
Branch: `feat/official-truth-decoded-regulatory-scope-binding-1`
Baseline: `main@4b3f7d932750d4c6f8a44234b4d7ba8c80f26b56`
Logical agent: **Jetnity Official Truth decoded regulatory scope binding 1**
Generation: **1**
Session: https://cursor.com/agents/bc-fb543348-7c62-40c6-b551-7ad6deb8ee6b
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

Read `docs/OFFICIAL_TRUTH_DECODED_REGULATORY_SCOPE_BINDING_1_REPORT_2026-10-03.md` and then this handoff. The task file was not rewritten. `docs/ACTIVE_WORK_STATUS.md` was not edited because the task forbids global current-state files. This handoff is the continuity record.

## Current state

The review head is the branch tip after the documentation commit. Re-fetch before review. The implementation commits are `fceef6407c881f8abdad6242c9925d18d82bff9d` and `1e3e0d226fc0dec1e15b1fa4f6413b0459b6e27e`. Those SHAs do not contain this handoff.

At delivery, `origin/main` is `4b3f7d932750d4c6f8a44234b4d7ba8c80f26b56`. This branch is 0 behind it. Machine mode is `NORMAL`. This slice does not edit `.jetnity/operating-mode.json`.

## Contract the next reader must keep

`officialTruthTrustedFactExtrahieren` now requires a decoded `scope` beside `scopeKey`. The scope is the canonical source-neutral `RegelScope` produced by `regelScopeAusEvidenceScope`. Do not add a second parser or a second key algorithm. Do not accept `sourceId` inside that object. Do not let the caller override the cell.

The same-request composition is the only non-test importer of the production entry. It must keep deriving the cell from `proof.kandidat.scope` and the accepted Evidence versions, then freeze that cell before retrieval and extraction. A mismatched key or a different Evidence cell is `scope_mismatch` before HTTP. The research envelope is not a second scope authority.

The matcher receives the frozen canonical copy. It must keep the full citizenship set, the stated credential option, residence, destination, and transit as separate fields. It must not invent a travel date when validity is `not_applicable`. It must not select one citizenship or treat the issuing country as citizenship.

`OFFICIAL_TRUTH_TRUSTED_FACT_EXTRACTOR_REGISTRY` stays empty. The live path still ends `extractor_not_registered` after a well-formed explicit-primary retrieval. `officialTruthTrustedFactExtrahierenMitDefinitionen` stays test-only. No route imports either function.

## Files

- `lib/readiness/official-truth-trusted-fact-extractor-registry.ts`
- `lib/readiness/official-truth-trusted-fact-extractor-registry.test.ts`
- `lib/readiness/official-truth-same-request-extraction-server.ts`
- `lib/readiness/official-truth-same-request-extraction-server.test.ts`
- `docs/OFFICIAL_TRUTH_DECODED_REGULATORY_SCOPE_BINDING_1_REPORT_2026-10-03.md`
- `docs/OFFICIAL_TRUTH_DECODED_REGULATORY_SCOPE_BINDING_1_HANDOFF_2026-10-03.md`
- `docs/OFFICIAL_TRUTH_DECODED_REGULATORY_SCOPE_BINDING_1_SELF_REVIEW_2026-10-03.md`

## Not done

No real source parser, no `BODY_MAX` change, no Rule acceptance, no Evidence or store write, no migration or apply, no provider or model path, no CH import, no #626, and no F8. No follow-up slice was opened.

## Next step

Independent Technical-Lead review of the exact branch tip. Cursor does not Ready or merge. Do not register a source-specific extractor from this handoff.
