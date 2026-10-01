# Official Truth Candidate Evidence Batch Validator 1 — Binding Task

Date: 1 October 2026
Issue: #701
Baseline: `main@a3af1fea1e2cdcb461c9d65a913d653dfe467ce8`
Logical agent: **Jetnity Official Truth candidate batch validator 1**
Generation: **1**
Required model: **Grok 4.7 High Fast** — not Auto.

## Why this slice exists

Jetnity now has manual Candidate-Evidence research batches (for example CH research) but they are explicitly:

- `RESEARCH_ONLY`
- `NOT_APPROVED_FOR_DATABASE_IMPORT`

We need a deterministic **validation boundary** before any future normalization/review/import preparation.

This validator must make research packages safer and more consistent without promoting them.

## A. This is NOT an importer

The validator must be structurally incapable of:

- writing Supabase;
- calling a trusted-store/source-catalog RPC;
- generating SQL;
- calling `evidenceKandidatAkzeptieren`;
- calling `regelKandidatAkzeptieren`;
- converting a batch to accepted Evidence;
- declaring Official Truth;
- seeding sources;
- activating `requirementsProviderAus()`.

Do not create an “import ready = true” success output.

A successful validation means only:

> “This research-only package is structurally/provenance-valid enough for later human/system review.”

## B. Batch envelope

Required top-level status must be exactly:

- `RESEARCH_ONLY`
- `NOT_APPROVED_FOR_DATABASE_IMPORT`

The contract must reject any package that claims:
- approved;
- import-ready;
- Official Truth;
- database-import authorization.

Reuse existing country/document types where possible, but do not edit them.

Required explicit scope:
- citizenshipCountryCode;
- documentType;
- one or more destination entries.

Citizenship must never be derived from residence or issuer.

## C. Entry provenance fields

Support the research field names already used operationally:

- `officialSourceUrl`
- `additionalOfficialSourceUrl` as zero/more URLs
- `officialActionLink` separately
- `retrievedAt`
- `validFrom`
- `validUntil`

Do not count `officialActionLink` as supporting evidence.

URLs:
- must be absolute HTTPS unless an existing canonical contract explicitly permits otherwise;
- tracking parameters must fail validation;
- reject any query parameter beginning with `utm_`;
- reject clearly tracking-only parameters already documented in current research conventions;
- do not silently replace/swap authorities or URLs.

Do not fetch URLs.

## D. Evidence-quality states

Use current canonical evidence-quality naming where available. Do not create a second truth-quality system.

At minimum validate these research states consistently:

- `explicit_primary_statement`
- `composed_from_multiple_primary_sources`
- `research_gap`
- `unresolved_conflict`
- `stale_primary_evidence`

Rules:
- explicit primary statement: at least one supporting official source URL;
- composed primary sources: at least two distinct supporting official source URLs;
- `research_gap` must never encode/infer `not_required`;
- unresolved conflict cannot be represented as resolved;
- stale primary evidence cannot be represented as current;
- gap/conflict/stale cannot become accepted/importable truth.

If existing canonical names differ, reuse them and document the mapping. Do not mutate existing canonical evidence acceptance semantics.

## E. Time fields

`retrievedAt`:
- required for an evidence-bearing entry;
- complete UTC instant;
- must end in `Z` after canonical validation;
- invalid/future timestamps fail validation using an explicitly supplied validation clock, never ambient hidden time.

`validFrom` / `validUntil`:
- unknown = `null`;
- ISO date-only if present;
- if both are present, `validUntil >= validFrom`;
- do not invent dates.

## F. Privacy / sensitive-key guard

Recursively inspect input object keys and reject representative sensitive personal fields, including variants of:
- passportNumber / documentNumber;
- MRZ;
- passportScan / documentScan / image;
- biometric / face / fingerprint;
- health / vaccination record;
- birthDate / dateOfBirth;
- travellerName / fullName;
- email;
- accountId / userId.

This is a research-batch contract for global non-personal facts.

Do not store/log rejected sensitive values in error messages.

## G. Result contract

Return deterministic validation findings:
- stable error codes;
- path/location of the field, without echoing secrets/sensitive values;
- no automatic repair that changes source/provenance meaning.

Optional safe normalization may only cover representation that cannot change meaning (for example trimming surrounding whitespace) if clearly tested. Prefer fail-closed for URLs/times.

## H. Synthetic fixtures only

Tests must not contain:
- real CH batch data;
- real traveller data;
- real passport data;
- real government URLs if avoidable.

Use reserved/example domains and synthetic country combinations.

## I. Tests

Prove at minimum:
- exact research-only statuses accepted;
- import/Official-Truth statuses rejected;
- explicit/composed URL cardinality rules;
- action link is not evidence support;
- `utm_*` rejected;
- UTC retrievedAt validation with injected clock;
- null validity accepted;
- validity ordering;
- gap cannot become `not_required`;
- conflict/stale remain non-promotable;
- sensitive keys rejected without value echo;
- no network/model/DB/RPC/SQL path exists.

Run:
- focused tests;
- full `npm test`;
- typecheck;
- lint;
- build;
- hygiene checks;
- `git diff --check`.

## J. Strict ownership

Allowed:
- `lib/readiness/official-truth-candidate-batch.ts`
- `lib/readiness/official-truth-candidate-batch.test.ts`
- lane docs:
  - `docs/OFFICIAL_TRUTH_CANDIDATE_BATCH_VALIDATOR_1_*`

Read-only:
- existing Official Truth types/contracts.

Forbidden:
- Research Request lane files;
- Supabase/migrations;
- app/components;
- global continuity files;
- package/lockfile;
- Auth/RLS;
- providers;
- Production configuration;
- any real Candidate Evidence data file.

If an existing canonical type must be edited, STOP and report first.

## K. Main drift

Before final push:
- fetch then-current main;
- integrate it into the same branch/session;
- remain 0 behind;
- rerun gates.

## L. Stop

Push one exact validated head.
Record session/model/head/base/ahead-behind/changed files/gates.
Stay Draft.
Do not Ready.
Do not merge.
Do not create SQL/import output.
Do not start a promotion/import slice.
STOP for independent Technical-Lead review.
