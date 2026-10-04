# GOV.UK Content API Identity Profile Audit 1 — Task

Date: 4 October 2026
Issue: #816
Baseline: `main@601379f2f2138a49fbf85fa8b44856fb71079d45`
Branch: `docs/govuk-content-api-identity-profile-audit-1`
Logical writer: **Jetnity GOV.UK Content API identity profile audit 1**
Generation: **1**
Execution environment: **Codex Desktop**
Required model: **GPT-6 Astra — Sehr hoch**
Status: **DOCS/RESEARCH AUDIT ONLY / NO REGISTRATION / NO DB MUTATION / NO EXTRACTOR / NO F8**

## Purpose

Audit whether Jetnity can deterministically authenticate one real official GOV.UK Content API response as the exact reviewed content item and representation **before any legal extraction**.

Primary positive item:

- human page:
  `https://www.gov.uk/guidance/immigration-rules/immigration-rules-appendix-eta-national-list`
- machine representation:
  `https://www.gov.uk/api/content/guidance/immigration-rules/immigration-rules-appendix-eta-national-list`
- previously observed GOV.UK `content_id`:
  `2b25b3d4-4eaa-4859-a34e-c7869c114c15`

Adversarial sibling item:

- machine representation:
  `https://www.gov.uk/api/content/guidance/immigration-rules/immigration-rules-appendix-electronic-travel-authorisation`
- previously observed distinct `content_id`:
  `2620750b-5453-44f1-98af-414037c833be`

The sibling is not a second positive registration candidate in this slice. It exists to prove that a profile cannot confuse two official documents from the same publisher/domain/schema family.

This audit authenticates **identity only**. It does not decide ETA eligibility, legal effect, composition completeness or traveller outcome.

## Binding startup / collision gate

Before research:

1. fetch live `origin/main`;
2. require exact baseline `601379f2f2138a49fbf85fa8b44856fb71079d45`, otherwise STOP;
3. require machine mode `NORMAL`;
4. read Issue #751;
5. read #748 MATERIAL newer than marker `5978621253`;
6. inspect open PRs/writers and require no overlapping Official Truth writer;
7. read this complete task;
8. re-read the merged R1/R2 identity contracts and the prior GOV.UK ETA/source-identity audits;
9. do not edit this immutable task seed.

Read at minimum:

- `JETNITY_START_HERE.md`
- `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
- `docs/JETNITY_BINDING_SLICE_PRECHECK_AND_CONTINUITY_GATE_2026-08-29.md`
- `docs/OFFICIAL_TRUTH_CONTENT_ITEM_IDENTITY_FOUNDATION_1_REPORT_2026-10-04.md`
- `docs/OFFICIAL_TRUTH_CONTENT_IDENTITY_R2_WIRING_1_REPORT_2026-10-04.md`
- `docs/OFFICIAL_TRUTH_SOURCE_IDENTITY_GRANULARITY_RECONCILIATION_1_2026-10-04.md`
- `docs/OFFICIAL_TRUTH_GOVUK_ETA_SOURCE_FAMILY_AUDIT_2026-10-03.md`
- `lib/readiness/official-truth-content-identity.ts`
- `lib/readiness/official-truth-server-owned-retrieval.ts`
- `lib/readiness/source-registry.ts`

## Allowed material files

Exactly these 5 files may differ from main:

1. this immutable task seed;
2. `docs/OFFICIAL_TRUTH_GOVUK_CONTENT_API_IDENTITY_PROFILE_AUDIT_1_2026-10-04.md`
3. `docs/OFFICIAL_TRUTH_GOVUK_CONTENT_API_IDENTITY_PROFILE_AUDIT_1_REPORT_2026-10-04.md`
4. `docs/OFFICIAL_TRUTH_GOVUK_CONTENT_API_IDENTITY_PROFILE_AUDIT_1_HANDOFF_2026-10-04.md`
5. `docs/OFFICIAL_TRUTH_GOVUK_CONTENT_API_IDENTITY_PROFILE_AUDIT_1_SELF_REVIEW_2026-10-04.md`

No production code or tests.

## Official-source research boundary

Use only official UK government / GOV.UK publishing infrastructure as primary evidence:

- the two exact `www.gov.uk/api/content/...` endpoints above;
- the corresponding human GOV.UK pages where useful;
- official GOV.UK Content API documentation under the GOV.UK publishing service;
- official GOV.UK Content Schema / developer documentation where needed.

Do not use blogs, Stack Overflow, commercial API docs, mirrors, search snippets or model memory as evidence.

Search engines may be used only to locate an official URL. The audit must fetch the official URL directly before relying on it.

## Production-like retrieval observations

For the National List Content API and Appendix ETA Content API:

- perform fresh direct HTTPS GETs;
- record exact requested URL, effective/final URL, status, redirect count, media type, Content-Length if present, actual UTF-8 byte count and SHA-256 of the complete response bytes/text representation used by the audit;
- use `accept-encoding: identity` and `cache-control: no-cache` where the client allows;
- require fatal UTF-8 decoding;
- record retrieval UTC timestamps;
- do not call Jetnity Development/Production DB;
- do not use Jetnity service-role credentials;
- no government write/action request.

At least two separate reads of the National List Content API within the audit session are required. The identity verdict must distinguish:
- fields that remain stable and identify the item;
- edition/update fields or full-body bytes that may legitimately change and therefore must not be identity pins.

A changing full JSON hash is **not** an automatic identity failure if the identity metadata remains the exact reviewed item and all structural invariants hold.

## GOV.UK Content API semantics to verify from official docs

Independently confirm the meaning and availability of at least:

- `content_id`;
- `base_path`;
- `locale`;
- `schema_name`;
- `document_type`;
- `phase`;
- `publishing_app`;
- `rendering_app` where present;
- `links` organisation/publisher metadata relevant to Home Office;
- `public_updated_at`;
- `updated_at`;
- redirects / 303 behavior for non-base paths.

Do not infer semantics from field names alone.

## Candidate identity mapping to audit

Do not allocate a real Jetnity `sourceId`, `contentItemId`, `representationId` or profile id in the database or code.

The audit must nevertheless determine whether a later registration could safely map the current machine response as follows in principle:

### External item identity

Candidate namespace meaning:
- GOV.UK Content API public content identity.

Candidate external value:
- exact GOV.UK `content_id`.

The audit must answer whether `content_id + locale` is needed as the external identity or whether locale is safely representation metadata under the current Jetnity descriptor model.

### Publisher / authority metadata

R1 requires non-empty:
- `expectedPublisherIds`;
- `expectedAuthorityIds`.

The audit must identify **stable machine identifiers actually present in the live official response** that can satisfy these fields without relying only on display names.

Inspect the current Content API `links` structure and any primary-publishing-organisation / organisations relation.

Explicitly decide:
- which linked identifier represents the Home Office publisher;
- which identifier, if any, is suitable as the authority identity;
- whether the same exact organisation id may validly fill both arrays;
- or whether current R1 metadata is insufficient for GOV.UK and the audit must be NOT_PROVEN.

Do not invent organisation ids.

`publishing_app` is a technical publishing application and must not silently be treated as the legal publisher unless official documentation proves that meaning.

### Representation

Audit the Content API JSON representation with:

- exact request URL;
- exact expected final URL;
- expected media type `application/json` if currently proven;
- expected locale;
- expected schema;
- exact content item version/profile version mechanics only as future Jetnity version numbers, not GOV.UK edition numbers.

The audit must decide whether the human HTML page:
- should be another representation of the same future ContentItemRef;
- needs a distinct identity profile;
- or should be excluded from first registration.

Do not propose counting HTML + API as two composition supports.

## Required deterministic profile decision

Define the exact future code-owned verifier contract **in prose/pseudocode only**.

A positive profile must be able to return only the already expected Jetnity `ContentIdentityBinding`.

It must never:
- produce legal facts;
- inspect traveller data;
- choose citizenship;
- register an item;
- trust caller-provided ids;
- infer an item from hostname/path/body alone.

The audit must decide exact behavior for:

1. invalid JSON;
2. top-level non-object / duplicate-key concern;
3. unexpected/missing required identity fields;
4. wrong `content_id`;
5. wrong `base_path`;
6. wrong locale;
7. wrong schema_name;
8. wrong document_type;
9. phase not `live`;
10. publisher/authority relation missing;
11. publisher/authority relation has wrong id;
12. extra organisations;
13. wrong final URL;
14. wrong media type;
15. sibling Appendix ETA response presented under National List descriptor;
16. same National List content with changed `updated_at`;
17. same National List content with changed `public_updated_at`;
18. changed `details.body` but stable exact identity metadata;
19. redirect to another content item;
20. API response whose `base_path` and request path disagree.

For mutable fields, state whether they are:
- ignored for identity;
- observed/logged;
- or require a descriptor/profile version review.

## Canonical JSON / duplicate-key question

The runtime profile receives `responseText: string`, not a pre-trusted parsed object.

The audit must explicitly decide how a future verifier parses JSON fail-closed.

At minimum consider:
- invalid UTF-8 already blocked by retrieval;
- valid JSON only;
- top-level object required;
- arrays/scalars rejected;
- duplicate JSON object keys: standard `JSON.parse` silently keeps the last value, so decide whether a deterministic duplicate-key detector is required before parsing identity fields;
- maximum recursion/field-count/body-size assumptions already bounded by retrieval.

If duplicate-key ambiguity cannot be safely ruled out or detected with a bounded deterministic parser, classify NOT_PROVEN rather than hand-wave it.

## Stable vs mutable field matrix

Produce a table for every relevant field with columns:

- field/path;
- observed current value;
- official documented meaning;
- identity role;
- expected stability;
- verifier action;
- drift action.

The matrix must explicitly include:
- content_id
- base_path
- locale
- schema_name
- document_type
- phase
- publishing_app
- rendering_app
- title
- description
- public_updated_at
- updated_at
- links organisation/publisher identifiers
- details.body
- full response SHA-256.

## Cross-item and representation adversarial matrix

Use the Appendix ETA Content API response to prove the proposed profile fails closed when:

- same gov.uk host;
- same Home Office publisher;
- same `manual_section` family;
- same locale/phase;
- but different `content_id` and base_path.

Also reason about a copied National List JSON served from the wrong registered final URL: exact transport binding must still fail before or together with profile verification.

## No legal-source-family conclusion in this audit

Even if identity is proven:

- do not claim the National List alone proves ETA requirement;
- do not create a trusted extractor;
- do not create a composition policy;
- do not claim F8 unblocked;
- do not import CH evidence.

This audit answers only:
**Can Jetnity prove that these received bytes are the reviewed official content item/representation?**

## Required classification

Exactly one:

### `GOVUK_CONTENT_API_IDENTITY_PROFILE_PROVEN`

Only if the audit can specify a deterministic bounded fail-closed profile from official current machine evidence and the current Jetnity R1/R2 contracts, including publisher/authority identifiers and JSON ambiguity handling.

The report must then name the **smallest next slice**:
- code-owned profile implementation + synthetic/captured fixture tests only;
- production registry may still remain empty until separately reviewed registration if safer.

### `GOVUK_CONTENT_API_IDENTITY_PROFILE_NOT_PROVEN`

If any required identity element is missing/ambiguous/unstable.

The report must name the exact missing evidence/capability and the smallest next audit. Do not weaken Jetnity identity standards to force a pass.

## Required outputs

Create the four docs listed above.

Report:
- exact final head;
- exact model;
- all official URLs fetched;
- retrieval observations/hashes;
- stable-vs-mutable matrix;
- exact proposed verifier algorithm;
- publisher/authority metadata decision;
- HTML/API representation decision;
- duplicate-key decision;
- adversarial results;
- classification;
- smallest next step.

## Required validation before STOP

- re-fetch live main/mode/#751/#748;
- confirm no overlapping writer;
- exactly 5 changed files;
- task seed byte-identical;
- no code/test/migration/config change;
- `git diff --check`;
- operating-mode guard;
- no secrets;
- no DB/Supabase mutation;
- no real registration;
- no source/profile/extractor/policy/pin addition;
- no F8;
- exact final head.

Remain Draft.
Do not Ready.
Do not merge.
Do not start the profile implementation/registration.

Then STOP for independent Technical-Lead exact-head review.
