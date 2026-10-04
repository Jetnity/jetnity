# Official Truth Content-Item Identity Foundation 1 — Task

Date: 4 October 2026
Issue: #808
Baseline: `main@6f3215860c5f84f77d3139128a90663be7e257d8`
Branch: `feat/official-truth-content-item-identity-foundation-1`
Logical writer: **Jetnity Official Truth content-item identity foundation 1**
Generation: **1**
Execution environment: **Codex Desktop**
Preferred model: **GPT-6 Astra — Sehr hoch**
Status: **PURE DORMANT RUNTIME FOUNDATION / NO IMPORTER / NO DB / NO SOURCE REGISTRATION / NO F8**

## Purpose

Implement only the smallest pure runtime foundation selected by
`docs/OFFICIAL_TRUTH_SOURCE_IDENTITY_GRANULARITY_RECONCILIATION_1_2026-10-04.md`.

The result must make the accepted Option-A identity model executable and testable without wiring it into any existing Official Truth runtime path.

This slice defines identity. It does **not** authenticate a real source, retrieve HTTP, create Evidence, write a database row, register GOV.UK, register CTA, or authorize F8.

Live repository evidence overrides this task if anything changed after the baseline.

## Binding startup / collision gate

Before material edits:

1. fetch live `origin/main`;
2. require exact baseline `6f3215860c5f84f77d3139128a90663be7e257d8`; otherwise STOP and report;
3. read `.jetnity/operating-mode.json`, require `NORMAL`;
4. read Issue #751;
5. read only #748 MATERIAL newer than marker `5971622750`;
6. inspect open PRs/writers;
7. confirm #808 / this branch is the only overlapping Official Truth writer;
8. read this entire task;
9. do not edit the immutable task seed after dispatch.

Read at minimum:

- `JETNITY_START_HERE.md`
- `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
- `docs/JETNITY_BINDING_SLICE_PRECHECK_AND_CONTINUITY_GATE_2026-08-29.md`
- `docs/OFFICIAL_TRUTH_SOURCE_IDENTITY_GRANULARITY_RECONCILIATION_1_2026-10-04.md`
- `docs/OFFICIAL_TRUTH_SOURCE_IDENTITY_GRANULARITY_RECONCILIATION_1_REPORT_2026-10-04.md`
- `docs/OFFICIAL_TRUTH_SOURCE_IDENTITY_GRANULARITY_RECONCILIATION_1_HANDOFF_2026-10-04.md`
- `lib/readiness/source-registry.ts`
- `lib/readiness/evidence.ts`
- `lib/readiness/rule-claims.ts`
- `lib/readiness/digest.ts`
- `lib/readiness/official.ts`

Re-prove exported helpers and current parser behavior before choosing imports.

## Allowed material files

Exactly these material code/test files:

- new `lib/readiness/official-truth-content-identity.ts`
- new `lib/readiness/official-truth-content-identity.test.ts`

Required docs:

- this immutable task;
- `docs/OFFICIAL_TRUTH_CONTENT_ITEM_IDENTITY_FOUNDATION_1_REPORT_2026-10-04.md`
- `docs/OFFICIAL_TRUTH_CONTENT_ITEM_IDENTITY_FOUNDATION_1_HANDOFF_2026-10-04.md`
- `docs/OFFICIAL_TRUTH_CONTENT_ITEM_IDENTITY_FOUNDATION_1_SELF_REVIEW_2026-10-04.md`

Total changed files versus main must be exactly **6**.

Do not edit an existing runtime/test/config/schema file.

## Canonical Option-A semantics

### Authority

`sourceId` keeps its existing meaning:
- authority / publisher trust boundary;
- domain ownership/allowlist scope;
- existing `QuellenRegistry` authority semantics.

This module must never reinterpret sourceId as a page/publication id.

### Content item

Define a bounded immutable authority-scoped content item reference equivalent to:

```ts
type ContentItemRef = {
  sourceId: string
  contentItemId: string
}
```

The ordered pair is the composition-support identity.

Requirements:
- contentItemId uses a bounded deterministic grammar compatible with future private-schema storage;
- equality includes both fields;
- canonical sort is sourceId, then contentItemId;
- duplicate refs fail closed rather than dedupe-and-continue;
- two refs may share sourceId and remain distinct;
- two representations of one pair remain one support.

### Content-item descriptor version

Define a pure immutable descriptor/version contract that can represent:

- sourceId;
- contentItemId;
- positive contentItemVersion;
- current flag;
- external-id namespace;
- external content id;
- bounded expected publisher/authority identity metadata required by the accepted architecture;
- no executable data;
- no free-form legal effect;
- no traveller data.

At most one current descriptor version per ContentItemRef.

Within one authority, `(externalIdNamespace, externalContentId)` must not map to two different content item refs.

### Representation descriptor/version

Define a pure immutable representation contract that can represent:

- ContentItemRef;
- contentItemVersion;
- representationId;
- positive representationVersion;
- current flag;
- finite exact canonical request URLs;
- one exact expected final URL;
- normalized expected media type;
- identityProfileId;
- positive identityProfileVersion;
- any minimal bounded locale/schema pins the architecture requires.

Rules:
- no path prefix/wildcard/regex permission;
- URLs must be canonical HTTPS according to existing Jetnity URL rules;
- every URL must resolve through the provided existing `QuellenRegistry` to the same sourceId;
- no credentials, localhost or non-HTTPS;
- no exact active URL may map to more than one current representation;
- no first-match resolution;
- one current representation version per `(ContentItemRef, representationId)`;
- a current representation must point to the current content-item descriptor version;
- representationId is not a composition-support identity.

A conservative all-version URL reservation is acceptable in R1 if explicitly documented; do not invent a retire/rebind transition in this slice.

## Pure content graph

Provide one pure fail-closed constructor/validator for a complete in-memory identity graph.

It receives:
- an already validated existing `QuellenRegistry`;
- content-item descriptor versions;
- representation descriptor versions;
- an explicit identity-profile registry argument for pure tests, or uses the production empty registry when omitted.

It returns either:
- a deeply frozen validated graph with deterministic ordering and indexes/helpers;
- or one bounded failure reason.

Mandatory validation:
- every item sourceId exists in the authority registry;
- every representation item/version exists;
- external item identity uniqueness;
- current-version uniqueness;
- representation-version uniqueness;
- URL uniqueness/reservation;
- exact authority resolution for every request/final URL;
- media type grammar;
- profile id/version exists and is current in supplied profile registry;
- no duplicate refs hidden by sorting;
- no executable functions in data descriptors.

The graph must not perform network, database, filesystem, clock or environment reads.

## Identity-profile contract

Define a code-owned identity-profile definition contract.

Requirements:
- stable bounded `identityProfileId`;
- positive version;
- current flag;
- deterministic verifier function/type contract only for code-owned definitions;
- verifier outcome can only establish item/representation identity or fail closed;
- it must not return legal facts, requirement effects, visa results, predicates or traveller decisions;
- it cannot mutate the graph;
- production registry is exactly an empty frozen array.

Export a production constant equivalent in meaning to:

```ts
export const OFFICIAL_TRUTH_CONTENT_IDENTITY_PROFILE_REGISTRY = Object.freeze([])
```

Synthetic fixture profiles are allowed only in tests via an explicit pure seam.

Do not register GOV.UK, CTA, Home Office, Cabinet Office or any real authority/profile.

## Canonical identity helpers

Implement deterministic pure helpers for at least:

1. ContentItemRef validation/read;
2. canonical ContentItemRef serialization/key;
3. sorted distinct ContentItemRef list validation;
4. representation ref/key validation;
5. exact URL-to-current-representation resolution from a validated graph:
   - zero => not registered;
   - exactly one => success;
   - ambiguity must be impossible after graph validation and must still fail defensively if encountered.

No helper may use array order as an authority tie-break.

## Identity-aware lookup serialization helper

Implement a **future v3 serialization helper only**, without changing `evidence.ts`.

It must:
- take an existing Evidence/Rule scope as unknown;
- delegate semantic validation/canonical projection to the existing canonical scope parser (`regelScopeAusEvidenceScope` or another already-canonical exported helper proven equivalent);
- never create a second regulatory scope parser;
- combine the canonical regulatory cell with:
  - sourceId;
  - contentItemId;
  - representationId;
- deterministically serialize with explicit version `v: 3`;
- return canonical material and `evidence-key:v3:<sha256>`-shape key.

This is a dormant helper. No existing Evidence path may import or use it in this slice.

Test that:
- same regulatory cell + same item/representation => same key;
- citizenship/input ordering differences normalized by the existing parser do not fork key;
- changing sourceId, contentItemId or representationId changes key;
- HTML/API representations of same item have different lookup streams while the ContentItemRef remains equal;
- invalid scope fails through the existing parser.

## Evidence-version v2 serialization helper

Implement a **future ev2 identity serialization helper only**, without modifying `EvidenceVersion`.

It must deterministically bind at least:
- identitySchema = 2;
- sourceId;
- contentItemId;
- contentItemVersion;
- representationId;
- representationVersion;
- identityProfileId;
- identityProfileVersion;
- lookupKey;
- canonicalUrl;
- normalized contentType;
- sourceContentHash;
- retrievedAt;
- validFrom;
- validUntil.

Output:
- canonical fixed-order material;
- `ev2_<32 lowercase hex>` based on SHA-256 of that canonical material.

Rules:
- extraction note, lifecycle, validation state and previousVersionId are not part of this identity;
- malformed ids/hash/url/time/key/version fail closed;
- changing validity bounds changes ev2;
- changing descriptor/profile versions changes ev2;
- changing representation changes ev2;
- no current ev1 code is modified or silently upgraded.

Do not claim this helper is accepted Evidence or live-origin proof.

## Deep immutability

Validated graph, descriptors, refs, arrays, maps exposed as arrays/records, and helper success outputs must not permit mutation of authority/content identity.

Tests must attempt top-level and nested mutation.

Do not export mutable production registries.

## Required adversarial tests

At minimum:

1. two content items under one sourceId validate and remain distinct;
2. same contentItemId under different sourceIds remains distinct;
3. same external id within one source mapped to two local ids fails;
4. same exact active URL claimed by two items fails;
5. same exact active URL claimed by two representation streams of one item fails;
6. HTML/API of one item validate as two representations but one ContentItemRef;
7. unregistered sibling URL on same allowed government-like domain is not content-authorized;
8. representation URL resolves to wrong sourceId => fail;
9. unknown sourceId => fail;
10. current representation points to historical item version => fail;
11. duplicate current item version => fail;
12. duplicate current representation version => fail;
13. missing identity profile => fail;
14. historical-only profile when current required => fail;
15. malformed media type => fail;
16. non-HTTPS / credentials / localhost URL fails using existing URL rules;
17. duplicate ContentItemRef in a support list fails, not dedupes;
18. two representations of one item cannot produce two distinct ContentItemRefs;
19. two different items on one source can produce two distinct refs;
20. deterministic sorting independent of input order;
21. mutation attempts cannot alter validated graph;
22. v3 lookup key normalization uses existing scope parser;
23. v3 changes on source/item/representation;
24. ev2 deterministic;
25. ev2 changes on validity/descriptor/profile/representation;
26. malformed ev2 material fails;
27. production identity-profile registry length is 0 and frozen;
28. module source contains no GOV.UK/CTA/real-source identifier;
29. module has no `fetch`, Supabase, filesystem, env, Date.now/new Date clock authority, acceptance/store/F8 import;
30. repository search proves no non-test production importer of this new module in this slice.

## Explicit non-scope

Do not edit or wire:
- `source-registry.ts`;
- `source-router.ts`;
- `evidence.ts`;
- source catalog server/RPC;
- server-held source registry;
- retrieval;
- same-request proof/extraction;
- extractor/composition registries;
- refresh;
- store;
- rule claims;
- region pin;
- app/routes/UI;
- Supabase/migrations/types;
- scripts/db;
- package config.

Do not:
- register a real identity profile;
- allocate real GOV.UK sourceId/contentItemId/representationId;
- register CTA;
- create/apply SQL;
- mutate Development or Production;
- perform live network calls in tests;
- change Auth/RLS;
- implement acceptance/composer/F8;
- start S1/R2.

## Required outputs

Create:
- `docs/OFFICIAL_TRUTH_CONTENT_ITEM_IDENTITY_FOUNDATION_1_REPORT_2026-10-04.md`
- `docs/OFFICIAL_TRUTH_CONTENT_ITEM_IDENTITY_FOUNDATION_1_HANDOFF_2026-10-04.md`
- `docs/OFFICIAL_TRUTH_CONTENT_ITEM_IDENTITY_FOUNDATION_1_SELF_REVIEW_2026-10-04.md`

The task seed remains byte-identical.

The report must state:
- exact final head;
- exact baseline;
- exact changed files;
- exported API summary;
- profile registry state;
- proof there is no production importer;
- test results;
- no DB/network/source registration;
- classification exactly one of:
  - `CONTENT_ITEM_IDENTITY_FOUNDATION_READY_FOR_SCHEMA_SLICE`
  - `CONTENT_ITEM_IDENTITY_FOUNDATION_BLOCKED`

## Required validation before STOP

- re-fetch live main;
- re-read mode/#751/#748;
- confirm no writer collision;
- `git diff --check`;
- targeted new module tests;
- all directly affected existing pure tests;
- full `npm test`;
- `npm run typecheck`;
- `npm run lint`;
- canonical Production build;
- operating-mode guard;
- repository search for non-test importers and forbidden dependencies/actions;
- exactly 6 changed files;
- immutable task seed;
- exact final head.

If any gate fails, do not claim PASS.

## Delivery

Remain Draft.
Do not mark Ready.
Do not merge.
Do not start S1, R2 or any real registration.

Report:
- exact final head SHA;
- exact model used;
- tests/build results;
- changed files;
- classification.

Then STOP for independent Technical-Lead exact-head review.
