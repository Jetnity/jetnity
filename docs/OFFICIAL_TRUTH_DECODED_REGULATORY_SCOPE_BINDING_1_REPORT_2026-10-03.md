# Official Truth Decoded Regulatory Scope Binding 1 — Report

Date: 3 October 2026
Issue: #786
Draft PR: #787
Branch: `feat/official-truth-decoded-regulatory-scope-binding-1`
Baseline: `main@4b3f7d932750d4c6f8a44234b4d7ba8c80f26b56`
Implementation commits: `fceef6407c881f8abdad6242c9925d18d82bff9d`, `1e3e0d226fc0dec1e15b1fa4f6413b0459b6e27e`
Task: `docs/OFFICIAL_TRUTH_DECODED_REGULATORY_SCOPE_BINDING_1_TASK_2026-10-03.md`
Logical agent: **Jetnity Official Truth decoded regulatory scope binding 1**
Generation: **1**
Session: https://cursor.com/agents/bc-fb543348-7c62-40c6-b551-7ad6deb8ee6b
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

This report is the author record. It is not a Technical-Lead PASS, not Ready, and not a merge. The review head is the tip of this branch after the documentation commit that adds this file. Re-fetch that tip before review. Do not review `fceef640` or `1e3e0d22` as the final head. Those SHAs do not contain this report.

The task file was not rewritten. `docs/ACTIVE_WORK_STATUS.md`, `DECISIONS.md`, and `ROADMAP.md` were not edited. The task forbids those global current-state files. `lib/readiness/rule-claims.ts` was not edited. `regelScopeAusEvidenceScope` was already the canonical parser and key derivation.

## Result

The extractor input and matcher context now carry `scopeKey` and a decoded `scope`. The scope is the source-neutral `RegelScope`: destination, transit, the full citizenship set, one credential option, residence, requirement type, and validity. It has no `sourceId` and no personal identifier.

`regelScopeAusEvidenceScope` remains the only parser and the only scope-key algorithm. The framework:

1. rejects `sourceId` and any other unexpected top-level scope key as `unexpected_fields`;
2. re-parses the cell through `regelScopeAusEvidenceScope`;
3. requires the recomputed key to equal the input `scopeKey`, or returns the existing `scope_mismatch` reason;
4. requires the top-level `requirementType` to equal `scope.requirementType`;
5. rejects a personal-identifier key as `personal_identifier_forbidden` before the matcher;
6. freezes a `structuredClone` of the canonical cell and passes that copy to `match` and `extract`.

A malformed country, document, or date fails as `invalid_scope` before the matcher. The framework does not choose a citizenship, an issuing country, a document, a residence, or a travel date. `not_applicable` stays distinct from a missing field. A travel date is present only when `validity.mode` is `travel_date`.

The same-request path derives that cell only from the proof. It re-reads `proof.kandidat.scope` with `regelScopeAusEvidenceScope`, requires the recomputed key to equal `proof.ruleScopeKey`, requires the candidate requirement type to equal the canonical requirement type, and requires every accepted Evidence version to canonicalize to the same source-neutral key. A support whose already-present Evidence version belongs to another cell fails the same way. Those failures return `scope_mismatch` before HTTP. A caller field named `scope` on the research envelope is not read. The research envelope is not parsed a second time.

After that check the composition freezes its own copy of the proof. A later mutation of the caller's proof object cannot change the extractor input or the returned material. The extractor then freezes its own canonical copy again.

`OFFICIAL_TRUTH_TRUSTED_FACT_EXTRACTOR_REGISTRY` remains `Object.freeze([])`. No synthetic definition is registered at runtime. The live entry still calls only `officialTruthTrustedFactExtrahieren`. A well-formed explicit-primary proof still ends `extractor_not_registered` after the trust checks, including the fresh retrieval. Outside tests, that production function is imported only by `lib/readiness/official-truth-same-request-extraction-server.ts`. `officialTruthTrustedFactExtrahierenMitDefinitionen` remains defined only in the registry module and is used only by tests. No `app/` file imports either entry.

## Traveller context

This slice is traveller-specific. The result can differ by citizenship set, credential option, issuing country, related citizenship, residence, destination, transit, requirement type, and travel date. The framework keeps the full citizenship set and does not rank or drop a code. Reordered input canonicalizes to the same sorted set and the same key. Issuing country stays on the credential option and does not replace citizenship. Related citizenship stays null unless the cell states it. Residence stays a separate field. Document type stays the stated type. No personal traveller id, passport number, MRZ, scan, biometrics, or health record is accepted. No shadow identity model was added. Route Truth stays traveller-neutral because this slice does not write a route.

## Tests

Synthetic fixtures only. The date-qualified proof uses a synthetic snapshot marker `EXAMPLE-POSITIVE-RULE` and a fixed effective date inside that snapshot. One travel date on that boundary extracts the complete synthetic fact. An earlier travel date fails closed as `source_epoch_unreadable`. The comparison reads `scope.validity.travelDate` and the snapshot. A caller `travelDate` field is `unexpected_fields` and does not reach the matcher. No GOV.UK, ICA, CH, or other real source parser is encoded. Country codes in the cell are the same ISO values the existing readiness fixtures already use.

## Out of scope, unchanged

Not implemented, and not claimed as done:

- a real extractor definition, or any GOV.UK, Immigration New Zealand, Singapore ICA, or CH parser
- a retrieval `BODY_MAX` change
- `regelKandidatAkzeptieren`, an accepted Rule Claim, or F8
- an Evidence or store write
- provenance persistence or a schema change
- a migration, a Development apply, or a Production apply
- a route, UI, Auth, AAL, or RLS change
- a provider, model, plugin, secret, or paid call
- #626 and CH import
- a follow-up slice

`requirementsProviderAus()` stays null. The four pre-existing LOCAL/UNAPPLIED RPCs are unchanged: `admin_account_counts_v1`, `darf_official_truth_freigeben`, `official_truth_source_catalog_v1`, and `official_truth_store_accepted_v1`.

## Validation

Focused extractor tests: 35/35. Focused same-request extraction tests: 19/19. Both are inside the full suite.

`npm test`: 4580 pass, 0 fail, 767 suites. PostgreSQL 16.15 was installed locally because `initdb` was absent. The package postinst initialized a local `16/main` cluster and `policy-rc.d` denied the service start. The two pre-existing throwaway proofs then used their own temporary clusters. No remote database was contacted. Nothing was applied.

Typecheck pass. Lint: 0 errors and 148 pre-existing warnings. None are in the files this slice edited. Production build pass on Next.js 16.3.8 with 25 static pages. `check:operating-mode` PASS. `check:dead` 0 orphans. `check:exports` 0. `check:deps` pass. `check:api-schutz` pass. `check:schema-bezug` pass, with the four pre-existing LOCAL/UNAPPLIED RPCs above. `git diff --check` pass on the implementation commits. This documentation commit is checked again before push.

`origin/main` at delivery is `4b3f7d932750d4c6f8a44234b4d7ba8c80f26b56`. This branch is 0 behind that commit. Machine mode is `NORMAL`. `.jetnity/operating-mode.json` was not edited.

## Recommendation

Stop for independent Technical-Lead review of the exact branch tip. Do not register a source extractor in this PR. The production registry is still empty, so a date-qualified official page still cannot become a trusted fact on the live path. Cursor does not Ready or merge.
