# Official Truth Coordinated Content Identity Wiring R2 — Task

Date: 4 October 2026
Issue: #814
Baseline: `main@30aa083dc752bf499dfc5a09448d06bd36d3ba64`
Branch: `feat/official-truth-content-identity-r2-wiring-1`
Logical writer: **Jetnity Official Truth coordinated content identity wiring R2**
Generation: **1**
Execution environment: **Codex Desktop**
Preferred model: **GPT-6 Astra — Sehr hoch**
Status: **COORDINATED DORMANT RUNTIME WIRING / NO REAL REGISTRATION / NO F8 / NO DB APPLY**

## Purpose

Atomically move the existing Official Truth runtime from source-only / ev1 / catalog-v1 assumptions to the accepted Option-A identity model already implemented by R1 and applied as S1 in Development:

- `sourceId` = authority/domain trust identity;
- `ContentItemRef=(sourceId,contentItemId)` = official publication / composition-support identity;
- representation identity = exact rendering stream of one item;
- Evidence live identity = lookup v3 + ev2;
- catalog/store live RPC contract = v2.

This slice must leave the runtime coherent but dormant/fail-closed. It must not register a real source, item, representation, profile, extractor, composition policy or CTA pin. It must not implement F8.

Live repository/database evidence overrides this task if anything changes after the baseline.

## Binding startup / collision gate

Before material work:

1. fetch live `origin/main`;
2. require exact baseline `30aa083dc752bf499dfc5a09448d06bd36d3ba64`; otherwise STOP and report;
3. read `.jetnity/operating-mode.json`, require `NORMAL`;
4. read Issue #751;
5. read #748 MATERIAL newer than marker `5977264413`; ignore Technical-Lead receipts as new external MATERIAL;
6. inspect open PRs/writers;
7. confirm #814 / this branch is the only overlapping Official Truth writer;
8. read this whole task;
9. inspect importers of every production file in the finite closure before editing;
10. if correctness requires changing a non-test production importer outside the finite closure below, STOP and report the exact importer instead of widening silently.

Read at minimum:

- `JETNITY_START_HERE.md`
- `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
- `docs/JETNITY_BINDING_SLICE_PRECHECK_AND_CONTINUITY_GATE_2026-08-29.md`
- `docs/OFFICIAL_TRUTH_SOURCE_IDENTITY_GRANULARITY_RECONCILIATION_1_2026-10-04.md`
- its REPORT / HANDOFF / SELF_REVIEW
- `docs/OFFICIAL_TRUTH_CONTENT_ITEM_IDENTITY_FOUNDATION_1_REPORT_2026-10-04.md`
- `docs/OFFICIAL_TRUTH_CONTENT_IDENTITY_SCHEMA_RPC_V2_1_REPORT_2026-10-04.md`
- `docs/OFFICIAL_TRUTH_DEVELOPMENT_S1_APPLY_LOG_2026-10-04.md`
- `lib/readiness/official-truth-content-identity.ts`
- all files in the ownership closure below and their tests.

## Live database baseline to preserve

Development `yfvbxvijcorffwxbxahl` has S1 applied and verified:

- exact migration history contains `20261004010705 / official_truth_content_identity_2`;
- `20261002154952_official_truth_owner_reviewer_capability_1` remains unapplied;
- v2 catalog exists and returns `identity_schema=2` with explicit empty arrays;
- all source/content/Evidence/Rule tables are empty;
- v1 catalog/store RPCs return `0A000`;
- v2 catalog/store are service-role-only.

Production `qscbgcdmivbbnzrcyegn` has no Official Truth v2 schema/RPCs.

R2 must not mutate either database.

## Finite production ownership closure

Core existing production files under `lib/readiness/`:

- `source-registry.ts`
- `source-router.ts`
- `evidence.ts`
- `official-truth-source-catalog-server.ts`
- `official-truth-server-held-source-registry.ts`
- `official-truth-server-owned-retrieval.ts`
- `official-truth-same-request-proof-server.ts`
- `official-truth-same-request-extraction-server.ts`
- `official-truth-trusted-fact-extractor-registry.ts`
- `official-truth-composition-policy-registry.ts`
- `official-truth-refresh-diff.ts`
- `official-truth-store-server.ts`
- `rule-claims.ts`
- `regulierungs-anwendbarkeit.ts`

Finite identity-sensitive bridge/serialization closure:

- `official-truth-research-request.ts`
- `official-truth-research-source-routing.ts`
- `official-truth-research-execution-plan.ts`
- `official-truth-discovered-url-candidates.ts`
- `official-truth-retrieved-material.ts`
- `official-truth-retrieved-candidate-evidence.ts`
- `official-truth-accepted-evidence.ts`
- `official-truth-rule-candidate.ts`
- `official-truth-rule-review-packet.ts`
- `official-truth-rule-review-fingerprint.ts`
- `official-truth-rule-review-decision-intent.ts`
- `official-truth-coverage.ts`
- `official-truth-autonomous-preacceptance-witness-server.ts`

R1 helper:
- `official-truth-content-identity.ts` may be narrowly extended only when a missing pure seam is proved. Its production profile registry must remain exactly empty/frozen.

Tests corresponding to the above files are in scope. One new focused coordination test under `lib/readiness/` is allowed if needed.

Do not edit routes, app/components, providers, traveller/account code, Supabase migrations, generated DB types, package/config, scripts/db, public assets, or unrelated readiness modules.

## A. One server-held v2 catalog snapshot

Update `official-truth-source-catalog-server.ts` to use only:

`official_truth_source_catalog_v2`

No v1 fallback.

A successful `read_registry` must strictly parse one response with:

- `identity_schema=2`;
- sources/domains;
- blocked domains;
- content items;
- item versions;
- representations;
- representation URL bindings;
- URL reservations.

From that one response build and deeply freeze one server-held snapshot containing:

1. the existing validated authority `QuellenRegistry`;
2. the validated R1 content identity graph.

Rules:

- empty v2 catalog is valid and explicit;
- missing/malformed v2 schema is `catalog_failed` / unavailable, never an empty success;
- duplicate/mismatched graph material fails closed;
- blocked domains must round-trip into the authority/content planning boundary;
- no second catalog read to obtain item identity;
- injected transport and synthetic profile-registry seam are allowed in tests;
- default production profile registry remains empty.

Source registration helpers may move to v2 RPC semantics, but R2 itself must not invoke a real registration.

## B. Authority routing is not content permission

Update `source-router.ts` and the research routing/planning bridge so that:

- authority-domain coverage is only the first gate;
- a URL becomes content-eligible only if it resolves to exactly one current registered representation in the same server-held content graph;
- discovered URLs remain suggestions;
- an allowed government hostname with zero item binding is not eligible;
- caller/model supplied `contentItemId`, representation id or profile id cannot mint authority;
- exact server-held binding wins; no first match or path-prefix publication permission.

Research request/execution planning may still represent discovery, but any transition toward trusted retrieval must carry or resolve the server-held identity rather than source-only authority.

## C. Fresh retrieval binds exact representation identity

Coordinate `official-truth-server-owned-retrieval.ts`, retrieved-material bridge and server-held source entry so that trusted retrieval is initiated from one validated current representation binding.

Before/through retrieval, bind at minimum:

- sourceId;
- contentItemId;
- contentItemVersion;
- representationId;
- representationVersion;
- identityProfileId;
- identityProfileVersion;
- exact allowed request URL set;
- exact expected final URL;
- expected normalized media type.

Keep existing SSRF/DNS/redirect defenses.

Additional rules:

- request URL must be one exact registered URL for the selected representation;
- every redirect remains within the allowed authority and preapproved identity constraints;
- final URL must equal the representation's expected final URL;
- content type must match expected media type;
- response identity must be verified through the code-owned identity profile definition;
- profile absence/version mismatch/identity mismatch blocks **before legal extractor selection**;
- production profile registry is empty, therefore no real content becomes eligible in R2;
- synthetic profiles are test-only;
- a response/body/model-discovered content id cannot replace the expected server-held id.

Do not broaden HTTP body limits or content types.

## D. Evidence live identity becomes v2

Coordinate `evidence.ts` and all listed Evidence bridge consumers.

The trusted/live `EvidenceVersion` contract must carry the R1/S1 identity tuple:

- identitySchema = 2;
- sourceId;
- contentItemId;
- contentItemVersion;
- representationId;
- representationVersion;
- identityProfileId;
- identityProfileVersion;
- normalized contentType;
- canonicalUrl;
- lookupKey v3;
- versionId ev2;
- existing source class / publisher / authority / retrieval/hash/validity/lifecycle/scope fields.

Use the merged R1 helpers rather than creating a second canonical serializer:

- v3 lookup serialization must use existing canonical regulatory-scope parsing;
- ev2 serialization must bind exact identity versions/profile/url/content type/hash/time/validity.

No ev1 or lookup-v2 Evidence may be accepted/reproved/stored through the v2 trusted path.

Legacy fixture shapes may be:
- upgraded deliberately; or
- retained only in tests that assert fail-closed rejection.

Do not infer a content item from old URL/hash/source-only Evidence.

## E. Accepted Evidence and store v2 only

Update accepted-Evidence rebuilding, store server and relevant bridges so that:

- accepted Evidence is re-proved against the same server-held v2 snapshot and exact item/representation;
- current descriptor/profile/URL binding must still match;
- `official-truth-store-server.ts` calls only `official_truth_store_accepted_v2`;
- no v1 fallback;
- Evidence store payload includes the complete S1 identity tuple;
- Rule support remains Evidence version ids while the persisted identity is derived/reproved;
- schema-1 facts continue to return `applicability_not_persistable` before transport/RPC;
- SQL is structural storage only; it is never treated as HTTP or legal authority.

Missing Production v2 RPC must yield the existing fail-closed store/catalog-unavailable behavior. It must not become a runtime crash at import time.

## F. Same-request proof / replay / extraction

Upgrade frozen same-request support/proof/replay identity so each support retains at minimum:

- Evidence version id;
- ContentItemRef;
- item version;
- representation id/version;
- profile id/version;
- exact accepted URL/content type/hash;
- authority sourceId;
- existing regulatory cell/freshness bindings.

Requirements:

- proof snapshot and replay must use one coherent v2 catalog snapshot;
- changed item/representation/profile/current-version/URL binding blocks;
- fresh server retrieval re-verifies identity profile before extractor;
- no caller-supplied item/profile witness;
- fake/frozen JSON lookalikes remain invalid;
- exact immutable proof/seal semantics remain;
- replay equality includes the new canonical identity;
- multiple renderings of one item cannot become multiple supports.

## G. Extractor registry identity semantics

The production extractor registry remains exactly EMPTY.

Update definition/selector semantics so a future real extractor is pinned to exact content-item / representation identity rather than using authority sourceId as the publication identity.

Preserve:

- sourceFamilyId and schemaFamily where still useful;
- code-owned definition selection;
- zero/ambiguous/duplicate fail-closed behavior;
- content type and URL/profile checks.

A future definition may cover multiple reviewed representations of one item only if explicitly represented without turning them into distinct composition supports.

No GOV.UK definition is added.

## H. Composition policy identity semantics

The production composition-policy registry remains exactly EMPTY.

Update composition support-set and policy matching from authority-source distinctness to ContentItemRef distinctness.

Requirements:

- same ContentItemRef repeated via two representations/versions => `same_content_item_composition` or an equivalently explicit fail-closed reason;
- two distinct ContentItemRefs under one sourceId may compose;
- duplicates hidden among larger sets => ambiguous/duplicate structure failure;
- policy preflight and post-retrieval binding include exact item identities;
- sourceId may still appear as authority metadata but cannot be the distinct-support key;
- source-attributed observations become item-attributed where needed without losing authority provenance;
- code-owned composition policy remains mandatory for autonomous composed path;
- no real policy is added.

## I. Refresh identity boundary

Update `official-truth-refresh-diff.ts`:

- refresh may continue only within the same sourceId + contentItemId + representation stream;
- descriptor/profile/version/URL drift blocks until separately reviewed;
- a new content item cannot become predecessor/refresh of an old item;
- HTML/API representation streams do not silently cross;
- same content hash across items does not merge identity.

## J. Rule Claim support and review bridge

Keep `regelKandidatAkzeptieren` the sole canonical Rule acceptance constructor.

Coordinate rule candidate/review packet/fingerprint/decision intent/coverage so that:

- exact accepted ev2 supports retain ContentItemRef + representation/version internally;
- explicit-primary requires one distinct ContentItemRef;
- composed requires 2..8 distinct ContentItemRefs;
- two representations/versions of one item cannot inflate support count;
- two items under one authority may satisfy the identity-distinctness prerequisite;
- supportVersionIds remain ev2 Evidence ids;
- new identity changes review fingerprint format/version;
- old review fingerprints/intents cannot authorize a new v2 identity;
- no advisory model output becomes authority;
- existing evidence-id grammar/coverage lookup recognizes ev2/v3 only on the new trusted path.

Do not broaden raw-page retention.

## K. Regulatory region pin contract remains empty

Update only the type/validation contract if required so a future `RegulierungsRegionPin` can bind one exact reviewed content provenance, including enough of:

- sourceId;
- contentItemId;
- item version;
- representation id/version;
- identity profile id/version;
- sourceContentHash.

`REGULIERUNGS_REGION_PINS` must remain exactly EMPTY.

Do not add CTA members or source ids in R2.

## L. Autonomous witness remains narrow; F8 stays closed

`official-truth-autonomous-preacceptance-witness-server.ts` may consume the new internal v2 proof identity, but:

- preserve the existing narrow public projection;
- do not turn identity data into a bearer token/witness;
- do not add an acceptance route;
- do not authorize autonomous Rule acceptance;
- F8 remains OPEN.

## M. Production absence / dormancy

Production has no v2 DB schema.

R2 must therefore prove:

- importing/building runtime code performs no DB call;
- no app route becomes newly live;
- absent catalog/store v2 at invocation fails closed;
- no automatic schema migration;
- no v1 fallback;
- no source registration;
- Production web build/deploy remains safe.

Development v2 may be exercised only through injected/synthetic transport tests unless the Technical Lead later separately authorizes a bounded live smoke. Codex must not mutate Development.

## N. Required synthetic test model

Use deterministic synthetic fixtures only:

- one `.example` official authority;
- at least two distinct content items under that authority;
- two representations of one item;
- fixed descriptor/profile versions;
- fixed server clock;
- injected DNS/HTTP/catalog/store transports;
- synthetic test-only identity profiles;
- no live government network;
- no Supabase live mutation.

At minimum cover:

1. one authority + two items remain two supports;
2. one item + HTML/API remain one support;
3. exact URL resolves one representation;
4. sibling URL on same allowed host fails item eligibility;
5. caller-invented item/profile id fails;
6. profile missing/mismatch fails before legal extraction;
7. redirect to another item/sibling URL fails;
8. v2 catalog empty is valid but yields no eligible item;
9. missing/malformed v2 catalog is unavailable, not empty;
10. one catalog read per server-held operation;
11. ev1/lookup-v2 trusted Evidence rejected;
12. v3/ev2 deterministic and identity-sensitive;
13. store uses v2 RPC only;
14. Production-missing-v2 transport failure is fail-closed;
15. same item two renderings cannot compose;
16. two items same authority can satisfy identity distinctness;
17. replay item/profile drift blocks;
18. refresh cross-item/representation blocks;
19. old review fingerprint/intent rejected;
20. fake seal/proof remains invalid;
21. region-pin registry length remains 0;
22. extractor/profile/composition production registries remain 0;
23. schema-1 persistence block unchanged;
24. autonomous witness public projection unchanged;
25. repository search proves no route/app/provider change and no unexpected external importer.

Preserve all existing SSRF, replay, composition-observation, source-routing and acceptance tests.

## O. Hard boundaries

Do not:

- create/edit Supabase migration;
- call Supabase apply/push/reset;
- mutate Development or Production;
- add generated DB types merely to expose v2;
- register source/content/profile rows;
- add GOV.UK/CTA identifiers or official facts;
- add a real identity profile;
- add a real extractor;
- add a real composition policy;
- register a region pin;
- enable schema-1 persistence;
- implement F8;
- create/change app routes, components, provider code or traveller logic;
- work on #626;
- change launch/indexing;
- add recurring cost.

If the existing finite closure cannot be made coherent without one of those actions, STOP as BLOCKED.

## Required docs

Create:

- `docs/OFFICIAL_TRUTH_CONTENT_IDENTITY_R2_WIRING_1_REPORT_2026-10-04.md`
- `docs/OFFICIAL_TRUTH_CONTENT_IDENTITY_R2_WIRING_1_HANDOFF_2026-10-04.md`
- `docs/OFFICIAL_TRUTH_CONTENT_IDENTITY_R2_WIRING_1_SELF_REVIEW_2026-10-04.md`

Task seed remains byte-identical.

Report:
- exact final head;
- exact changed production files and tests;
- importer closure result;
- v2 catalog/store constants;
- production registry lengths;
- targeted/full test results;
- typecheck/lint/build/hygiene;
- confirmation no live DB/network registration;
- classification exactly:
  - `CONTENT_IDENTITY_R2_READY_FOR_REAL_IDENTITY_PROFILE_AUDIT`
  - or `CONTENT_IDENTITY_R2_BLOCKED`.

## Required validation before STOP

- re-fetch live main/mode/#751/#748;
- confirm no writer collision;
- `git diff --check`;
- task seed unchanged;
- inspect every changed production importer;
- targeted identity/catalog/retrieval/Evidence/store/replay/extractor/composition/refresh/review tests;
- full `npm test`;
- `npm run typecheck`;
- `npm run lint`;
- canonical Production build;
- operating-mode guard;
- schema-reference / API protection / dead export / deps hygiene checks;
- repository search for v1 RPC literals in production trusted path;
- repository search for ev1/lookup-v2 assumptions in the coordinated closure;
- repository search for non-test real GOV.UK/CTA/profile/extractor/policy/region-pin additions;
- exact final head.

If a head changes after any gate, re-run exact-head gates.

## Delivery

Remain Draft.
Do not mark Ready.
Do not merge.
Do not start a real identity-profile audit/registration.
Do not start F8.

Report exact head/model/changed files/gates/classification and STOP for independent Technical-Lead exact-head review.
