# Official Truth Deterministic Trusted-Fact Extractor Framework 1 — Report

Date: 3 October 2026
Issue: #780
Draft PR: #781
Branch: `feat/official-truth-trusted-fact-extractor-framework-1`
Baseline at task dispatch: `main@ed5e249e375fd849895dafcc5c9b72cec4b377e1`
Integrated main at delivery: `4c373442b2261de270e50e203f87ed06efc303cc` (Merge #778)
Merge commit on this branch: `d32427359671cd42090e160c3dfae017ced7b321`
Implementation commit: `71ad09c63f420a7643a97d1ca9be979a1f7507b1`
Task: `docs/OFFICIAL_TRUTH_TRUSTED_FACT_EXTRACTOR_FRAMEWORK_1_TASK_2026-10-03.md`
Logical agent: **Jetnity Official Truth deterministic trusted-fact extractor framework 1**
Generation: **1**
Session: https://cursor.com/agents/bc-6431efb5-d76e-4580-9c99-4eae65caa60d
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

This report is the author record. A Technical-Lead PASS requires an independent exact-head review of the branch tip. This report is not Ready and not a merge. The review head is the branch tip after the documentation commit that adds this file. `71ad09c6` is the implementation commit. It is not the review head once that documentation commit is on the tip. Re-fetch before review.

The task file was not rewritten. `docs/ACTIVE_WORK_STATUS.md`, `DECISIONS.md`, and `ROADMAP.md` were not edited. The task forbids global current-state files. This report, the handoff, and the self-review are the continuity record.

## Result

`lib/readiness/official-truth-trusted-fact-extractor-registry.ts` is the pure framework. It registers no real source family.

`OFFICIAL_TRUTH_TRUSTED_FACT_EXTRACTOR_REGISTRY` is `Object.freeze([])`. The production entry `officialTruthTrustedFactExtrahieren(eingabe)` takes one argument. It does not accept an extractor id, an extractor version, a schema family, or a caller-supplied extractor registry. A well-formed input returns `extractor_not_registered`. That is intentional. No autonomous Rule fact is derivable from this slice.

`officialTruthTrustedFactExtrahierenMitDefinitionen(eingabe, definitionen)` is the test seam. Synthetic definitions stay in the test file. A route must not call the seam.

`officialTruthExtractorDefinitionenPruefen` rejects a definition whose id, version, source family, schema family, policy pair, source set, MIME set, or URL allowlist is not the pinned shape. The pair `(extractorId, extractorVersion)` may occur once. A changed structure is a new version. This module has no function that mutates an existing version.

`regelFaktKanonischLesen` in `lib/readiness/rule-claims.ts` returns the existing private `regelFaktLesen` result. It does not call `regelKandidatAkzeptieren` and it does not add a second fact parser.

## What the framework checks

1. Personal keys fail as `personal_identifier_forbidden`. Caller authority keys fail as `unexpected_fields`. Those keys include `proposal`, suggestion, model, plugin, `trustedRuleFact`, witness, `extractionNote`, `schemaFamily`, and extractor id or version. The scan is nested. The reason does not echo the value.
2. The input keys are exactly `factKind`, `requirementType`, `scopeKey`, `evidenceQuality`, `supports`, `policy`, and `registry`. `registry` is the trusted source catalog snapshot, not the extractor registry.
3. `research_gap`, `stale_primary_evidence`, and `unresolved_conflict` fail as `quality_not_acceptable`. They do not become a fact.
4. Each support binds `versionId`, `sourceId`, and one retrieval object. The only eligible retrieval status is `server_owned_official_retrieval`, with the live success keys: `sourceId`, `canonicalUrl`, `retrievedAt`, `contentType`, `sourceSnapshot`, `sourceContentHash`, and `redirectCount`. `retrieved_material` fails as `representation_not_eligible`. Any other status fails as `unexpected_fields`.
5. `evidenceQuellenFingerprint` is recomputed on `sourceSnapshot` before a matcher or extractor runs. A null fingerprint is `snapshot_bound_exceeded`. An unequal hash is `snapshot_hash_mismatch`.
6. The retrieval source id must equal the support source id. `quellenUrlAufloesen` must resolve the final URL to that same source with `sourceClass === 'official_authority'`. A licensed provider fails as `source_not_allowlisted`.
7. The observed content type is the retrieval value, already in the normalized MIME form. A caller-declared type is not an input key. A missing or different observed type is `content_type_not_allowlisted`.
8. Selection uses `factKind`, the exact support source-id set, the observed content types, and `current === true`. Zero current matches yield `extractor_not_registered`. Two current matches yield `ambiguous_structure`. A historical version is not selected. Support order does not change the set.
9. `explicit_primary_statement` requires exactly one support, a null policy, and a single-source definition. `composed_from_multiple_primary_sources` requires at least two supports, at least two distinct source ids, and a versioned policy whose id and version equal the selected definition. A same-source composition fails as `same_source_composition`. A missing policy fails as `policy_required`. A version or id mismatch fails as `policy_version_mismatch`. A missing required field path fails as `policy_field_unassigned` and does not call the extractor.
10. The selected definition's matcher must accept the pinned `schemaFamily` structure. A mismatch does not call the extractor and does not return a partial fact. There is no general regex or prose parser in this module.
11. A successful extractor object is passed through `regelFaktKanonischLesen`. Only that canonical fact is returned. For `official_actions`, the existing reader still resolves each href through `quellenUrlAufloesen`.
12. Success is `status: 'trusted_fact_extracted'` plus the validated fact, extractor id and version, schema family, policy id and version, source ids, support version ids, and a provenance list. Policy id and version are null for a single-source extractor. The result is deeply frozen. It is not acceptance and not Official Truth.

The framework performs no network call and no clock read. It does not import the retrieval module, because that module opens sockets. The eligible object is the live success shape, checked here as data.

## Traveller context

This slice does not read citizenship, travel documents, issuing country, residence, or route, and it does not rank credential options. The input carries one `rule-scope:v1:` key. A second citizenship or a second document remains a second scope key and a later invocation. Personal keys fail before selection. No shadow identity model is created.

## Out of scope, unchanged

Not implemented, and not claimed as done:

- a GOV.UK, Singapore ICA, IATA, Sherpa, or CH-01..CH-10 parser
- any real source family in the production registry
- `regelKandidatAkzeptieren` and F8
- Evidence or store writes
- a route, UI, Auth, AAL, RLS, or capability change
- a migration, a Development apply, or a Production apply
- #626 and CH import
- a provider, model, plugin, secret, or paid call

`requirementsProviderAus()` is not called. No `app/` file imports this module.

`check:schema-bezug` still lists four pre-existing LOCAL/UNAPPLIED RPCs: `admin_account_counts_v1`, `darf_official_truth_freigeben`, `official_truth_source_catalog_v1`, and `official_truth_store_accepted_v1`. This slice adds none.

## Validation

Gates below were re-run after merging `4c373442`. That merge is admin mission-control polish only. It does not change this extractor. The branch was 0 behind that main. Re-fetch before treating a later main SHA as current. `ed5e249e` remains the task baseline and is not current main after #778.

- Focused extractor file: 28 tests, 28 pass, 0 fail.
- `lib/readiness/rule-claims.test.ts`: 19 tests, 19 pass, including the new canonical-reader wrapper.
- `npm test`: 4546 tests, 4546 pass, 0 fail, 766 suites. The count includes the merged admin polish tests. The two existing throwaway PostgreSQL proofs ran against local PostgreSQL 16.15 `initdb`. They did not contact a remote database. Nothing was applied.
- `npm run typecheck`: pass.
- `npm run lint`: 0 errors, 148 pre-existing warnings. None are in the extractor or rule-claim files.
- `npm run build`: pass. Next.js 16.3.8. Compiled successfully. 25 static pages.
- `git diff --check`: pass on the implementation commit.
- `check:operating-mode`: PASS.
- `check:dead`: 0 unreached files.
- `check:exports`: 0 uncalled exports.
- `check:deps`: pass.
- `check:api-schutz`: pass. 12 admin routes still use `requireAdminApi()`.
- `check:schema-bezug`: pass, with the same four pre-existing LOCAL/UNAPPLIED RPCs.

Exact-head GitHub CI and Vercel belong to the pushed tip, not to this text.

## Stop

Cursor does not Ready or merge and does not start a source-specific extractor, F8, or another slice.
