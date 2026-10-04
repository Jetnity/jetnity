# Official Truth GOV.UK Content API Identity Verifier 1 — Task

Date: 4 October 2026
Issue: #818
Baseline: `main@f0430bb62b12d5f7e523db88cb5d2dcc92754bd3`
Branch: `feat/official-truth-profile-verifier-1`
Logical writer: **Jetnity GOV.UK Content API identity verifier 1**
Generation: **1**
Execution environment: **Codex Desktop**
Required model: **GPT-6 Astra — Sehr hoch**
Status: **PURE PROFILE IMPLEMENTATION / REGISTRY EMPTY / NO REGISTRATION / NO DB MUTATION / NO EXTRACTOR / NO F8**

## Purpose

Implement the narrow code-owned identity verifier proven by:

- `docs/OFFICIAL_TRUTH_GOVUK_CONTENT_API_IDENTITY_PROFILE_AUDIT_1_2026-10-04.md`
- classification: `GOVUK_CONTENT_API_IDENTITY_PROFILE_PROVEN`

The implementation must authenticate only the English GOV.UK Content API representation of the ETA National List as the exact reviewed content item/representation before legal extraction.

This slice does **not** register that profile, source, content item or representation anywhere.

Live repository evidence overrides this task if anything changed after the baseline.

## Startup gate

Before material work:

1. fetch live `origin/main`;
2. require exact baseline `f0430bb62b12d5f7e523db88cb5d2dcc92754bd3`, otherwise STOP;
3. require machine mode `NORMAL`;
4. read Issue #751;
5. read #748 MATERIAL newer than marker `5978621253`;
6. inspect open PRs/writers;
7. confirm #818 is the only overlapping Official Truth writer;
8. read this complete task;
9. read the complete merged #816 audit/report/handoff/self-review;
10. inspect all importers of `official-truth-content-identity.ts` and the new module path before editing.

## Allowed material files

Exactly **6 changed files** versus main:

1. this immutable task seed;
2. new `lib/readiness/official-truth-govuk-content-api-identity-profile.ts`;
3. new `lib/readiness/official-truth-govuk-content-api-identity-profile.test.ts`;
4. `docs/OFFICIAL_TRUTH_GOVUK_CONTENT_API_IDENTITY_VERIFIER_1_REPORT_2026-10-04.md`;
5. `docs/OFFICIAL_TRUTH_GOVUK_CONTENT_API_IDENTITY_VERIFIER_1_HANDOFF_2026-10-04.md`;
6. `docs/OFFICIAL_TRUTH_GOVUK_CONTENT_API_IDENTITY_VERIFIER_1_SELF_REVIEW_2026-10-04.md`.

Do not edit `official-truth-content-identity.ts` unless a missing pure seam is proven. If that happens, STOP and report the exact missing seam rather than widening automatically.

No fixture file is required. Use deterministic inline fixture builders in the test.

## Production registry must remain empty

Do not edit:

`OFFICIAL_TRUTH_CONTENT_IDENTITY_PROFILE_REGISTRY`

It must remain exactly an empty frozen array.

The new module may export one narrow code-owned `ContentIdentityProfileDefinition` and parser helpers, but no production registry or runtime gateway may import/register it in this slice.

Repository search must prove zero non-test production importers of the new profile module.

## Narrow profile identity

Implement one code-owned profile equivalent in meaning to:

- profile id: one stable bounded lower-case id chosen for this exact National List Content API profile;
- profile version: 1;
- current: true;
- verifier input/output exactly matches existing `ContentIdentityProfileDefinition`.

The verifier must not mint identity. On success it returns only the expected `ContentIdentityBinding` copied from the already trusted item/representation descriptor tuple.

### Exact audited machine constants

Use the accepted #816 audit values:

National List content id:
`2b25b3d4-4eaa-4859-a34e-c7869c114c15`

Home Office organisation content id:
`06056197-bc69-4147-aa28-070bca132178`

Parent manual content id:
`87e2748f-2e9b-4681-8baa-778b6d326a8a`

National List base path:
`/guidance/immigration-rules/immigration-rules-appendix-eta-national-list`

Parent manual base path:
`/guidance/immigration-rules`

Home Office base path:
`/government/organisations/home-office`

Exact Content API request/final URL:
`https://www.gov.uk/api/content/guidance/immigration-rules/immigration-rules-appendix-eta-national-list`

Expected normalized media type:
`application/json`

Expected locale:
`en`

Expected schema:
`manual_section`

Expected document type:
`manual_section`

Expected phase:
`live`

Expected publishing app:
`manuals-publisher`

Expected rendering app:
`frontend`

External item namespace:
`govuk-content-id`

Do not allocate or hard-code a real Jetnity sourceId/contentItemId/representationId. Those remain descriptor-owned local ids supplied by the validated graph.

## Descriptor preflight

Before parsing response identity, require the trusted item/representation descriptors to be exactly coherent with this narrow profile:

Item:
- current=true;
- externalIdNamespace exactly `govuk-content-id`;
- externalContentId exactly National List content id;
- expectedPublisherIds exactly singleton Home Office UUID;
- expectedAuthorityIds exactly singleton Home Office UUID.

Representation:
- same sourceId/contentItemId and same contentItemVersion as item;
- current=true;
- identityProfileId/version exactly this profile definition;
- requestUrls exactly singleton National List Content API URL;
- expectedFinalUrl exactly same URL;
- expectedMediaType exactly `application/json`;
- expectedLocale exactly `en`;
- expectedSchema exactly `manual_section`.

Any mismatch is `identity_mismatch`.

Do not accept an Appendix descriptor even if its response matches itself.

## Bounded duplicate-aware JSON parser

Implement a pure deterministic whole-string scanner before any identity field is read.

A standard last-key-wins `JSON.parse` alone is forbidden.

The parser must enforce the accepted #816 bounds:

- UTF-8 byte length <= 65,536;
- non-empty input;
- top-level object only;
- max container depth 16;
- max total object members 2,048;
- max object members per object 256;
- max array elements per array 1,024;
- max total values including containers 4,096;
- max decoded object-key length 128 UTF-16 code units;
- max number token length 64 code units.

### Required syntax behavior

Accept only RFC-compatible JSON grammar:
- objects/arrays;
- strings with valid escapes;
- finite JSON numbers;
- true/false/null;
- JSON whitespace.

Reject:
- comments;
- NaN/Infinity;
- leading-zero invalid numbers;
- malformed exponent/fraction;
- trailing commas;
- trailing tokens;
- truncated input;
- invalid escapes;
- raw control chars in strings;
- unpaired surrogate escapes;
- bound overflow;
- root scalar/array/null.

### Duplicate-key behavior

Every object gets an independent Set of **decoded** key names.

Reject duplicates:
- same literal key twice;
- equal duplicate values too;
- `content_id` plus `content\u005fid`;
- duplicate nested keys anywhere.

The same key name in separate objects is allowed.

Reject decoded keys:
- `__proto__`
- `prototype`
- `constructor`

No regex-only duplicate detection.
No `eval`.
No reviver.
No prototype-merging.

After the complete scan succeeds, standard `JSON.parse` may construct the object.

Any syntax/bound/duplicate failure returns `invalid_response`.

## Root identity envelope

After safe parsing, require a plain top-level object.

Require the exact 20-key root envelope from the accepted audit:

- analytics_identifier
- base_path
- content_id
- description
- details
- document_type
- first_published_at
- links
- locale
- phase
- public_updated_at
- publishing_app
- publishing_request_id
- publishing_scheduled_at
- rendering_app
- scheduled_publishing_delay_seconds
- schema_name
- title
- updated_at
- withdrawn_notice

Unknown/missing root keys fail closed.

Identity pins must match exactly:
- content_id = National List id;
- base_path = National List base path;
- locale = en;
- schema_name = manual_section;
- document_type = manual_section;
- phase = live;
- publishing_app = manuals-publisher;
- rendering_app = frontend.

Require:
- title string;
- description string;
- public_updated_at valid RFC3339 date-time string with timezone;
- updated_at valid RFC3339 date-time string with timezone;
- withdrawn_notice exact empty plain object.

Do not equality-pin title, description or dates.

## Details envelope

Require exact six keys:
- attachments
- body
- change_history
- manual
- organisations
- visually_expanded

Require types:
- attachments array;
- body string;
- change_history array;
- manual plain object;
- organisations array;
- visually_expanded boolean.

Do not parse legal meaning from `details.body`.
Do not equality-pin body or its hash.

Require `details.manual.base_path` equals the parent manual base path, plus the exact audited minimal shape needed to prove it refers to the same parent manual. Do not use display text as authority.

## Root links envelope

Require exactly four root link relations:

- available_translations
- manual
- organisations
- primary_publishing_organisation

Each must be a one-element array.

### available_translations

Require the self English item:
- content_id = National List id;
- base_path = National List base path;
- locale=en;
- schema_name=document_type=manual_section;
- withdrawn=false;
- exact api_path/api_url/web_url derived from base_path;
- no nested links.

### manual

Require:
- content_id = parent manual id;
- base_path = parent manual path;
- locale=en;
- schema_name=document_type=manual;
- withdrawn=false;
- exact api_path/api_url/web_url;
- no nested links.

### organisations

Require exactly one Home Office organisation object:
- content_id = Home Office UUID;
- base_path = Home Office path;
- locale=en;
- schema_name=document_type=organisation;
- withdrawn=false;
- exact api_path/api_url/web_url;
- no nested links;
- details.organisation_govuk_status.status=live.

### primary_publishing_organisation

Require exactly the same Home Office UUID and same reviewed organisation identity constraints independently.

Do not silently dedupe the two relation arrays into one check.
Both relations must independently exist and pass.

Optional display fields in linked objects may vary only where the accepted audit explicitly treats them as non-authoritative; structural unknowns remain fail-closed.

## Transport recheck

The verifier receives finalUrl and mediaType.

Require:
- finalUrl exactly National List Content API URL;
- mediaType exactly `application/json`.

This is a defense-in-depth recheck. Existing R2 retrieval still owns DNS/SSRF/status/redirect enforcement.

No HTTP call occurs in the profile.

## Success/failure

On success return exactly:

`{ ok: true, identity: expected ContentIdentityBinding }`

copied/frozen from trusted descriptors.

Use:
- `invalid_response` for malformed/ambiguous/bounded-JSON or malformed required envelope/types;
- `identity_mismatch` for a well-formed response/descriptor/transport that contradicts expected identity pins.

No partial success.
No inferred replacement id.
No legal facts.

## Required tests

Use deterministic inline synthetic fixture builders based on the accepted #816 audited envelope.

Do not copy the full legal `details.body`; use small opaque sentinel strings.

At minimum prove:

### Positive
1. canonical National List envelope passes;
2. changed title passes;
3. changed description passes;
4. changed valid updated_at passes;
5. changed valid public_updated_at passes;
6. changed body string passes;
7. key ordering/whitespace change passes;
8. output identity is exactly the trusted descriptor binding and frozen.

### Descriptor/transport negatives
9. wrong externalContentId descriptor;
10. wrong publisher id descriptor;
11. wrong authority id descriptor;
12. Appendix-like descriptor rejected;
13. wrong profile id/version;
14. wrong requestUrls/final URL;
15. wrong media type;
16. wrong expected locale/schema.

### Response identity negatives
17. Appendix sibling root content_id/base_path;
18. wrong locale;
19. wrong schema_name;
20. wrong document_type;
21. phase not live;
22. wrong publishing/rendering app;
23. missing/wrong organisation relation;
24. wrong Home Office UUID;
25. extra organisation entry;
26. wrong manual parent;
27. wrong self-translation;
28. nonempty withdrawal_notice;
29. unknown root key;
30. missing root key.

### Duplicate/syntax parser
31. duplicate root content_id;
32. duplicate equal-value content_id;
33. escaped duplicate `content\u005fid`;
34. duplicate nested organisation content_id;
35. duplicate details.body;
36. key-looking text/braces inside body string does not trigger duplicate;
37. same content_id key across different link objects is allowed;
38. comments rejected;
39. trailing comma rejected;
40. trailing token rejected;
41. invalid escape rejected;
42. unpaired surrogate rejected;
43. dangerous key rejected;
44. root array/null/scalar rejected;
45. invalid number forms rejected;
46. valid escaped surrogate pair handled consistently.

### Bounds
47. >65,536 UTF-8 bytes rejected;
48. depth >16 rejected;
49. >2,048 members rejected;
50. >256 members in one object rejected;
51. >1,024 elements in one array rejected;
52. >4,096 total values rejected;
53. decoded key >128 code units rejected;
54. numeric token >64 rejected.

### Registry / dormancy
55. production `OFFICIAL_TRUTH_CONTENT_IDENTITY_PROFILE_REGISTRY` remains length 0 and frozen;
56. repository search proves no non-test production importer/registers the new profile module;
57. no source/content/profile/GOV.UK database row or registry activation is added.

The test may include additional adversarial cases.

## No captured legal body retention

Do not add the full live National List or Appendix legal body as a repository fixture.

Fixture builders may use:
- the audited machine ids/paths/structural envelope;
- small sentinel mutable text/body values.

This tests the identity contract without storing unnecessary legal-page content.

## Hard boundaries

Do not:
- edit the production profile registry;
- edit source/catalog/store/retrieval runtime;
- create a migration;
- mutate Development/Production;
- register a real source/content item/representation/profile;
- add extractor/composition policy/region pin;
- parse legal rules;
- create Rule facts;
- enable schema-1 persistence;
- implement F8;
- change routes/app/components/providers/traveller logic;
- add dependencies;
- perform live network calls in tests;
- work on #626 or launch/indexing.

If correctness requires an existing runtime seam change outside the two new files, STOP as BLOCKED.

## Required docs

Create:
- `docs/OFFICIAL_TRUTH_GOVUK_CONTENT_API_IDENTITY_VERIFIER_1_REPORT_2026-10-04.md`
- `docs/OFFICIAL_TRUTH_GOVUK_CONTENT_API_IDENTITY_VERIFIER_1_HANDOFF_2026-10-04.md`
- `docs/OFFICIAL_TRUTH_GOVUK_CONTENT_API_IDENTITY_VERIFIER_1_SELF_REVIEW_2026-10-04.md`

Report:
- exact final head;
- exact model;
- exact six changed files;
- exported API;
- profile id/version;
- parser limits;
- targeted/full test results;
- typecheck/lint/build/hygiene;
- proof registry remains empty;
- proof zero production importers;
- no DB/network/registration;
- classification exactly:
  - `GOVUK_CONTENT_API_IDENTITY_VERIFIER_READY_FOR_REGISTRATION_AUDIT`
  - or `GOVUK_CONTENT_API_IDENTITY_VERIFIER_BLOCKED`.

## Required validation before STOP

- re-fetch live main/mode/#751/#748;
- confirm no writer collision;
- exactly 6 changed files;
- task seed byte-identical;
- `git diff --check`;
- targeted new tests;
- directly affected R1/R2 content identity/retrieval tests;
- full `npm test`;
- `npm run typecheck`;
- `npm run lint`;
- canonical Production build;
- operating-mode guard;
- API/schema/dead/export/dependency hygiene;
- repository search for non-test importers;
- repository search proving production profile registry remains empty;
- no real registration/DB/network action;
- exact final head.

Remain Draft.
Do not Ready.
Do not merge.
Do not start registration audit.

STOP for independent Technical-Lead exact-head review.
