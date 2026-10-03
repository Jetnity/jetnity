# Official Truth Deterministic Trusted-Fact Extractor Framework 1 — Task

Date: 3 October 2026
Issue: #780
Branch: `feat/official-truth-trusted-fact-extractor-framework-1`
Baseline: `main@ed5e249e375fd849895dafcc5c9b72cec4b377e1`
Logical agent: **Jetnity Official Truth deterministic trusted-fact extractor framework 1**
Generation: **1**
Required model: **Grok 4.7 High Fast** (`grok-4.7-high-fast`), not Auto

## 1. Purpose

Implement only the deterministic extractor registry/framework defined by the merged architecture.

This framework is the mechanism by which a later, separately reviewed source-specific extractor can turn **server-owned official retrieval material** into exactly one complete structured `RegelFakt` or a fail-closed reason.

This slice registers **no real source family** and therefore must not make any real autonomous fact derivable yet.

Production/runtime registry is intentionally empty after this slice.

## 2. Binding reads

Read live main first, then at minimum:

1. `docs/OFFICIAL_TRUTH_DETERMINISTIC_TRUSTED_FACT_EXTRACTOR_ARCHITECTURE_1_2026-10-03.md`
2. `docs/OFFICIAL_TRUTH_SERVER_OWNED_RETRIEVAL_1_REPORT_2026-10-03.md`
3. `lib/readiness/official-truth-server-owned-retrieval.ts`
4. `lib/readiness/official-truth-same-request-proof-server.ts`
5. `lib/readiness/rule-claims.ts`
6. `lib/readiness/evidence.ts`
7. `lib/readiness/source-registry.ts`
8. `lib/readiness/official.ts`
9. `lib/readiness/temporal.ts`

Live code wins.

## 3. Non-negotiable trust boundary

The framework may parse only material that is shaped as a successful server-owned retrieval result.

It must never treat these as content authority:
- caller `sourceSnapshot`;
- caller hash;
- caller retrievedAt;
- caller contentType;
- caller redirect result;
- caller attestation;
- candidate `proposal`;
- suggestion/model/plugin output;
- caller `trustedRuleFact`.

No route/UI calls this framework in this slice.

No real extractor definition is active in the production registry.

## 4. Files

Primary new files:

- `lib/readiness/official-truth-trusted-fact-extractor-registry.ts`
- `lib/readiness/official-truth-trusted-fact-extractor-registry.test.ts`

Narrow supporting edit allowed if necessary:

- `lib/readiness/rule-claims.ts`
- `lib/readiness/rule-claims.test.ts`

Only if needed to expose one canonical pure Rule-fact validation helper that reuses the existing `regelFaktLesen` logic. Do not create a second fact parser.

Delivery docs:

- `docs/OFFICIAL_TRUTH_TRUSTED_FACT_EXTRACTOR_FRAMEWORK_1_REPORT_2026-10-03.md`
- `docs/OFFICIAL_TRUTH_TRUSTED_FACT_EXTRACTOR_FRAMEWORK_1_HANDOFF_2026-10-03.md`
- `docs/OFFICIAL_TRUTH_TRUSTED_FACT_EXTRACTOR_FRAMEWORK_1_SELF_REVIEW_2026-10-03.md`

Do not edit this task file or global current-state files.

Any additional file requires an explicit necessity note before editing.

## 5. Runtime registry contract

Implement a versioned extractor definition contract.

At minimum a definition contains:

- stable `extractorId`, matching `^otx_[a-z][a-z0-9_]{0,40}$`;
- positive integer `extractorVersion`;
- `current` flag or equivalent unambiguous current-version mechanism;
- exactly one `factKind`;
- explicit allowed official `sourceId` set / source family;
- explicit normalized allowed MIME type set;
- pinned `schemaFamily` identifier;
- policy id/version metadata:
  - both null for single-source extraction;
  - otherwise valid versioned policy ids;
- deterministic structure matcher;
- deterministic extractor function.

Changed structure, selectors, keys, labels, units, allowlists or assignments must require a new extractor version. Do not auto-mutate an existing version.

Definitions are code-owned immutable trust policy, not caller data.

## 6. Production registry must remain empty

This slice must not register:
- GOV.UK;
- Singapore ICA;
- IATA;
- Sherpa;
- any CH-01..CH-10 source;
- any synthetic source in runtime code.

A synthetic/test extractor may exist **only inside the test file or through a clearly test-only dependency seam**.

The production entry with the real registry must return `extractor_not_registered` for every input after this slice.

This is intentional.

## 7. Selection

Selection must be deterministic and fail closed.

Use, at minimum:

- `factKind`;
- exact support source-id set;
- content type observed on the server-owned retrieval result(s);
- current extractor version only.

Zero matches:
- `extractor_not_registered`.

More than one match:
- `ambiguous_structure` or a more exact architecture-defined ambiguity reason.

The caller must not choose:
- extractor id;
- extractor version;
- schema family;
- policy version.

If those appear on caller-like input, fail `unexpected_fields` / caller-authority equivalent.

After selection, the framework pins the chosen extractor id/version internally.

## 8. Input contract

The production-facing framework entry is internal/pure, not an app endpoint.

Build/validate an exact internal extraction input containing:

- `factKind`;
- `requirementType`;
- `scopeKey`;
- `evidenceQuality`;
- `supports`;
- `policy` (null for single-source);
- `registry`.

Each support must bind:

- a support/version id;
- one server-owned retrieval success result or an exact immutable projection of it;
- source id;
- final canonical URL;
- server-owned retrievedAt;
- server-owned content type;
- source snapshot from that retrieval;
- source content hash.

Do not accept a support whose retrieval status is anything other than `server_owned_official_retrieval`.

Recompute `evidenceQuellenFingerprint` from the retrieval snapshot before parsing and require equality with the retrieval hash.

Use exact-key / fail-closed validation.

No personal identifiers.

No `proposal`, suggestion/model/plugin output, `trustedRuleFact`, witness, review decision, caller schemaFamily, caller extractor id/version, caller response metadata overrides or caller provenance overrides.

## 9. Scope and support rules

- `explicit_primary_statement`:
  - exactly one support for extractor execution in this framework;
  - policy must be null;
  - definition must be a single-source extractor.

- `composed_from_multiple_primary_sources`:
  - at least two supports;
  - at least two distinct source ids;
  - explicit versioned composition policy required;
  - no field may be filled by an unstated default.

- reject research_gap, stale_primary_evidence and unresolved_conflict.

- support count <= `REGEL_SUPPORT_MAX`.

- duplicate support ids fail.

- source IDs must resolve in the supplied trusted registry as `official_authority`.

For `official_actions`, any emitted href must still resolve through `quellenUrlAufloesen` to an official authority and match the action source id.

## 10. Server-owned retrieval binding

For every support:

- retrieval source id must equal support source id;
- final URL must resolve through the same registry to that source id and `official_authority`;
- content type used for selection is only the retrieval's observed content type;
- caller-declared content type is forbidden;
- source snapshot and hash must be exactly the retrieval result;
- recomputed fingerprint must match;
- no old `retrieved_material` receipt is eligible;
- no caller-supplied page text is eligible.

The framework itself performs no network call and no clock read.

## 11. Schema family

`schemaFamily` belongs only to the selected extractor definition.

It is never read from input.

The selected definition's matcher must prove the expected structure before extraction.

Mismatch:
- fail closed;
- no partial fact.

A general regex or generic prose/LLM parser is not an eligible extractor definition.

## 12. Extractor output

An extractor returns either:
- one complete candidate `RegelFakt`, or
- one fail-closed reason.

The framework must pass successful output through the **canonical existing Rule-fact validation logic** before returning it.

Preferred narrow implementation if needed:
- export a pure wrapper around the current private `regelFaktLesen` from `rule-claims.ts`;
- do not duplicate any fact parsing semantics;
- do not involve acceptance.

Framework success shape should include at least:
- `status: 'trusted_fact_extracted'`;
- validated `fact`;
- `extractorId`;
- `extractorVersion`;
- `policyId`;
- `policyVersion`;
- source/support ids needed for later provenance.

This is still **not acceptance** and not Official Truth.

## 13. Fail-closed reasons

Support at least the architecture's relevant categories, e.g.:

- `personal_identifier_forbidden`
- `unexpected_fields`
- `fact_kind_mismatch`
- `requirement_type_mismatch`
- `extractor_not_registered`
- `source_not_allowlisted`
- `content_type_not_allowlisted`
- `schema_mismatch`
- `structure_not_recognized`
- `duplicate_value`
- `conflicting_value`
- `unknown_unit`
- `unknown_qualifier`
- `ambiguous_structure`
- `snapshot_hash_mismatch`
- `snapshot_bound_exceeded`
- `policy_required`
- `policy_version_mismatch`
- `policy_field_unassigned`
- `fact_incomplete`
- `representation_not_eligible`
- plus bounded existing Rule fact validation reasons where needed.

Do not turn failure into `not_required`, `unknown` or a partial fact.

## 14. Test-only fixture registry

Tests may inject one or more synthetic definitions to prove framework behavior.

Synthetic definitions:
- must use `*.example` or synthetic ids;
- live only in tests or a test seam;
- must not be present in the production registry constant.

Test at least:
1. production registry has zero definitions;
2. production entry returns `extractor_not_registered`;
3. caller-selected extractor id/version/schemaFamily rejected;
4. old submitted-material receipt rejected;
5. forged retrieval-like object with wrong status rejected;
6. hash mismatch rejected before matcher/extractor;
7. content type mismatch rejected;
8. source id mismatch rejected;
9. registry source class licensed provider rejected;
10. zero match -> not registered;
11. two matching current definitions -> ambiguity;
12. non-current historical definition not selected;
13. invalid extractor id/version/schema registry definition rejected;
14. duplicate id/version rejected;
15. single-source explicit primary fixture success;
16. matcher failure -> no extractor call / no fact;
17. malformed extractor fact -> canonical Rule fact validator rejects it;
18. candidate proposal/suggestion/model fields cannot influence fact;
19. support order does not change deterministic source-set selection;
20. composed quality requires >=2 sources + policy;
21. same-source composition fails;
22. policy version mismatch fails;
23. policy field gap yields no partial fact;
24. no network/clock/model/store imports or calls;
25. no `app/` import;
26. result/provenance metadata is deeply immutable.

## 15. No real source parser yet

Do not implement:
- HTML selector logic for any real authority;
- GOV.UK Content API parser;
- Singapore ICA parser;
- visa/passport/transit rule extraction for a real country;
- CH batch conversion.

A later task will select one source family only after structure evidence is independently reviewed.

## 16. Forbidden

No:
- live HTTP;
- route/UI;
- `regelKandidatAkzeptieren`;
- accepted claim;
- Evidence/store write;
- database migration/apply;
- provenance table;
- Auth/AAL/RLS change;
- provider/model/plugin call;
- secrets/cost;
- #626;
- CH import;
- F8;
- follow-up slice.

## 17. Validation / STOP

Before STOP:
- focused tests;
- full `npm test`;
- typecheck;
- lint;
- production build;
- normal hygiene/operating-mode gates;
- `git diff --check`;
- verify production registry is empty;
- verify no app route imports framework;
- fetch live main and finish 0 behind;
- push exact review head;
- keep Draft;
- report session id, `originalModelName`, exact head/files/gates;
- STOP for independent TL review.

No Ready. No merge. No source-specific follow-up.