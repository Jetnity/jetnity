# Official Truth Same-Request Retrieval-to-Extractor Binding 1 — Task

Date: 3 October 2026
Issue: #782
Branch: `feat/official-truth-same-request-extraction-binding-1`
Baseline: `main@5a7634d01fd4941a390b8844699c24813d114f6f`
Logical agent: **Jetnity Official Truth same-request retrieval-to-extractor binding 1**
Generation: **1**
Required model: **Grok 4.7 High Fast** (`grok-4.7-high-fast`), not Auto

## 1. Purpose

Implement only the server-held composition boundary required before any real source-specific extractor may be registered.

The new path must prove, in one controlled request:

1. the existing live same-request proof graph succeeded;
2. the proof graph's server-held source-registry snapshot is the only catalog authority;
3. each accepted support URL is re-fetched by Jetnity through the server-owned retrieval boundary;
4. each fresh retrieval still matches the accepted support's source id, canonical URL and source-content hash;
5. only then may the deterministic extractor framework receive the retrieval bytes;
6. the resulting structured Rule fact remains internal proof material, not acceptance.

No real extractor definition is registered in this slice. The production extractor registry remains empty.

## 2. Binding reads

Read live main first, then at minimum:

1. `lib/readiness/official-truth-same-request-proof-server.ts`
2. `lib/readiness/official-truth-server-held-source-registry.ts`
3. `lib/readiness/official-truth-server-owned-retrieval.ts`
4. `lib/readiness/official-truth-trusted-fact-extractor-registry.ts`
5. `lib/readiness/official-truth-source-catalog-server.ts`
6. `lib/readiness/rule-claims.ts`
7. `lib/readiness/evidence.ts`
8. merged #774/#777/#781 reports
9. #770/#771 F8 audit reports

Live code wins.

## 3. Central invariant

A successful result must come from one live server invocation.

The caller must never supply:
- a proof graph;
- registry;
- EvidenceVersion(s);
- support/version ids as authority;
- retrieval receipt/result;
- page bytes;
- content hash;
- retrievedAt;
- content type;
- trusted Rule fact;
- extractor id/version/schema family;
- composition policy;
- authority/grant/capability;
- clock;
- model/plugin/suggestion output.

The only caller input is the existing research/review envelope already consumed by `loadOfficialTruthSameRequestProof`.

The composition derives all retrieval source ids/URLs/version ids from the newly built proof graph, never from parallel free input.

## 4. Preferred new module

Primary files:

- `lib/readiness/official-truth-same-request-extraction-server.ts`
- `lib/readiness/official-truth-same-request-extraction-server.test.ts`

Suggested live entry:

`loadOfficialTruthSameRequestTrustedFactExtraction(eingabe)`

Suggested deterministic/test seam:

`decideOfficialTruthSameRequestTrustedFactExtraction(eingabe, deps)`

The live entry must supply all trusted dependencies itself.

No `app/` import.

## 5. Reuse the existing live proof graph

Do not build a second proof graph.

The composition must call the canonical same-request proof path and require:

- `status === 'same_request_proof'`
- role grant + `official-truth-freigeben`
- freshness `current`
- acceptable evidence quality;
- immutable registry;
- accepted EvidenceVersions;
- rebuilt candidate;
- review packet key;
- scope key;
- support identity.

Do not accept a caller-provided object that merely has this shape.

Tests may inject a proof loader seam, but the live entry must call the real proof path.

## 6. One real catalog snapshot only

The proof path performs the one real source-catalog read.

After proof success, no second Supabase/catalog RPC may occur in the same composition.

For retrieval, reuse the exact frozen `proof.registry` snapshot through an in-memory read-only catalog transport that returns the same normalized source rows.

Requirements:

- it accepts only `{ operation: 'read_registry' }`;
- no registration/write operation;
- it must not consult env/Supabase/network;
- current catalog-generated registries have no blocked-domain payload in the RPC. If a proof registry contains a blocked-domain state that cannot be faithfully replayed by the current catalog contract, fail closed instead of dropping it;
- tests must prove the external/source catalog transport is invoked exactly once for the whole composition, regardless of support count;
- repeated internal replay of the already frozen snapshot is not an external catalog read.

Do not add a second persistent catalog mechanism.

## 7. Narrow retrieval helper allowed

A narrow edit to:

- `lib/readiness/official-truth-server-owned-retrieval.ts`
- its test

is allowed only if required to let the same-request server composition perform the existing live DNS/HTTPS retrieval while using a supplied **server-code-owned catalog transport**.

If added:

- keep the current public live entry unchanged;
- the new helper must be `server-only`;
- it may accept an `OfficialTruthSourceCatalogTransport` from server code, never a raw registry from route input;
- only the new same-request extraction module may import it outside its own tests;
- add repository source assertions for that importer restriction;
- it must still use the existing live server clock, DNS resolver and HTTPS client;
- no caller override for DNS/HTTP/clock through the live composition.

Do not weaken #777 SSRF, redirect, port, fragment, timeout or body limits.

## 8. Support binding

Process supports in the canonical proof order (already deterministic).

For every proof support:

1. derive `versionId`, `sourceId`, and `canonicalUrl` only from the proof;
2. perform fresh server-owned retrieval for that source/url using the replayed exact catalog snapshot;
3. require retrieval success;
4. require exact `sourceId` equality;
5. require exact final `canonicalUrl` equality;
6. require exact `sourceContentHash` equality with the accepted proof support;
7. require the corresponding accepted EvidenceVersion exists exactly once and matches the same version id/source id/url/hash/scope;
8. on mismatch, fail closed before extraction.

A current page-content change is not automatically accepted.

Use explicit reasons such as:
- `source_changed_since_evidence`
- `source_url_changed_since_evidence`
- `support_binding_mismatch`
- existing retrieval reasons where appropriate.

Do not convert a mismatch into stale=false, not_required, a refreshed Evidence row or a new Candidate Evidence automatically in this slice.

## 9. Retrieval time

The proof's `serverReferenceTime` remains the review/freshness instant.

Each fresh HTTP retrieval gets its own server-owned completion timestamp from the existing retrieval boundary.

Do not require it to equal the stored Evidence `retrievedAt`.

Do not accept caller time.

## 10. Extractor input

Only after every support is freshly retrieved and bound may the composition build the extractor-framework input.

Derive:

- `factKind` from proof;
- `requirementType` from the proof candidate/scope;
- `scopeKey` from proof;
- `evidenceQuality` from proof;
- `versionId` and `sourceId` from proof supports;
- retrieval object from the fresh server-owned retrieval result;
- registry from the same proof snapshot.

No caller extractor fields.

### Composition policy

For this first binding slice:

- `explicit_primary_statement` may pass `policy: null`.
- `composed_from_multiple_primary_sources` must fail closed before HTTP/extraction with a clear server-held policy-unavailable reason unless a fully code-owned composition-policy source already exists on live main. Do not accept caller policy and do not invent one.

This does not remove composed support from the framework; it only keeps the live composition closed until a deterministic server-held policy exists.

## 11. Extractor invocation

Live composition must call only the production extractor entry:

`officialTruthTrustedFactExtrahieren(...)`

Because the production registry is empty in this slice, live extraction will currently end with `extractor_not_registered` after all preceding trust bindings if invoked.

Tests may inject an extraction function or call the synthetic-definition test seam to prove end-to-end composition, but no synthetic definition may enter production code.

## 12. Success output

A test-success shape may be:

`status: 'same_request_trusted_fact_material'`

and retain, server-only and deeply frozen:

- the trusted registry;
- accepted EvidenceVersions;
- rebuilt candidate;
- reviewPacketKey;
- ruleScopeKey;
- factKind;
- evidenceQuality;
- supportVersionIds;
- serverReferenceTime;
- freshness/current authority metadata;
- validated extracted `trustedRuleFact`;
- extractor id/version/schema family/policy metadata;
- retrieval provenance metadata per support:
  - versionId
  - sourceId
  - final canonicalUrl
  - fresh retrievedAt
  - contentType
  - sourceContentHash

Do **not** retain raw page snapshots in the final result once extraction has completed.

This object is internal same-request material, not a bearer token and not an API payload.

No acceptance or persistence.

## 13. Production behavior today

Since the production extractor registry remains empty:

- the live entry must not claim success today;
- it should fail closed with `extractor_not_registered` after the trust chain reaches extraction;
- no route calls the entry, so no live government fetch/cost is triggered by this merge.

Tests may prove the success path only with synthetic test definitions/injected extractor seam.

## 14. Mandatory tests

At minimum prove:

1. proof block -> zero retrieval/extractor calls;
2. caller-provided proof/registry/Evidence/retrieval/fact/extractor/policy authority fails via existing proof input guards;
3. exactly one external catalog transport read for whole composition;
4. two or more support retrievals reuse only the same proof registry snapshot;
5. no catalog registration/write operation;
6. retrieval source id mismatch blocks;
7. final URL mismatch blocks;
8. content hash changed since accepted Evidence blocks;
9. version/support Evidence binding mismatch blocks;
10. old submitted `retrieved_material` cannot be injected;
11. retrieval failure propagates fail-closed;
12. explicit-primary support passes null policy only;
13. composed quality blocks before HTTP because no server-held policy exists;
14. synthetic extractor success returns a complete deeply frozen same-request trusted-fact material object;
15. final success omits raw `sourceSnapshot`;
16. extractor fact/provenance corresponds to the exact proof support ids;
17. input/support order cannot alter canonical support binding;
18. mutation of proof/retrieval test inputs after composition cannot alter success;
19. live path uses production extractor registry only;
20. live path cannot inject test definitions;
21. only same-request composition module imports any new catalog-transport retrieval helper;
22. no `app/` import;
23. no `regelKandidatAkzeptieren`;
24. no Evidence/store write;
25. no migration/DB apply;
26. no model/provider/plugin call;
27. no route;
28. no F8.

Use fake DNS/HTTP and fake catalog transport in tests. No live internet.

## 15. Allowed files

Primary:
- new same-request extraction server module + test.

Narrow supporting edits only if required:
- server-owned retrieval module + test for catalog-transport live helper.

Delivery docs:
- `docs/OFFICIAL_TRUTH_SAME_REQUEST_EXTRACTION_BINDING_1_REPORT_2026-10-03.md`
- `docs/OFFICIAL_TRUTH_SAME_REQUEST_EXTRACTION_BINDING_1_HANDOFF_2026-10-03.md`
- `docs/OFFICIAL_TRUTH_SAME_REQUEST_EXTRACTION_BINDING_1_SELF_REVIEW_2026-10-03.md`

Do not edit:
- source catalog schema/migration;
- extractor production registry entries;
- global continuity files;
- this task file.

Any additional edit requires a necessity note before modification.

## 16. Forbidden

No:
- real extractor definition registration;
- GOV.UK/ICA/IATA/Sherpa parser;
- CH import;
- `regelKandidatAkzeptieren`;
- accepted Rule Claim;
- Evidence/store write;
- migration/apply;
- Production DB/catalog change;
- route/UI;
- Auth/AAL/RLS;
- provider/model/plugin;
- secrets/paid call;
- #626;
- F8;
- follow-up slice.

## 17. Validation / STOP

Before STOP:

- focused tests;
- full `npm test`;
- typecheck;
- lint;
- production build;
- operating-mode/hygiene gates;
- `git diff --check`;
- source assertions for no route/acceptance/store/real extractor;
- fetch current main and finish 0 behind;
- push exact review head;
- remain Draft;
- report session id + `originalModelName` + exact head/files/gates;
- STOP for independent TL review.

No Ready. No merge. No source-specific extractor follow-up.