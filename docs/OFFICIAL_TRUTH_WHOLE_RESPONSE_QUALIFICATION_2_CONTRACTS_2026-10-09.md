# Whole-Response Qualification 2 — Proposed contracts and source research

Issue #912 / Draft #914. `govuk-national-list-whole-response-v2-proposed` is a **local structural proposal**, not an approved privacy admission rule. Report v2 names that proposal explicitly. All real responses still fail privacy qualification. No new registered source, identity, extractor, custody issuer or accepted Rule exists.

## Independently retrieved primary documentation

Research window: 2026-10-09T17:27:00Z–17:37:44Z. These are documentation retrievals, not source-response evidence or legal acceptance. The exact schema fetched from moving main was independently compared byte-for-byte with the commit-pinned copy below; they matched.

| Reference | Established technical meaning and limitation |
| --- | --- |
| [Content API reference](https://content-api.publishing.service.gov.uk/reference.html) | Identifies content by public content ID, path, locale and schema; explains publishing/update times and linked items. Its generic analytics type differs from the frontend JSON Schema. No inference of non-personal content or legal effectiveness. |
| [manual_section frontend schema, pinned commit 43e9fb32](https://github.com/alphagov/publishing-api/blob/43e9fb32ef4ee0c85cef22c0c8b71082c0a4c2d4/content_schemas/dist/formats/manual_section/frontend/schema.json) | Covers the observed root/details/change-history/manual/organisation families. Publishing request ID permits string or null. Expanded linked objects permit additional fields upstream; this proposal deliberately refuses unknown fields. Schema validity is not a privacy certificate. |
| [Rendered manual_section schema](https://docs.publishing.service.gov.uk/content-schemas/manual_section.html) | Human-readable corroboration of frontend vs publisher contracts. The local proposal targets the frontend representation only. |
| [Request tracing](https://docs.publishing.service.gov.uk/manual/request-tracing.html) | Describes a request identifier propagated through services and searchable in logs, including publishing requests originating from users. Page warns it may be outdated (last update 25 June 2021). It supplies no non-linkability, anonymisation, lawful-retention or republication guarantee. |
| [Link expansion](https://docs.publishing.service.gov.uk/repos/publishing-api/link-expansion.html) | Linked objects contain selected metadata of related content. Expansion and dependency updates explain why linked/public update times are not law-effective dates. Page carries an outdated-document warning (26 February 2026). |
| [GDS API adapters](https://docs.publishing.service.gov.uk/repos/gds-api-adapters.html) | Distinguishes request tracing headers from authenticated-user headers. This distinction does not prove a particular request identifier cannot be correlated with a person. No private logs were queried. |

The attempted obsolete `manual/govuk-request-id.html` documentation URL was unavailable; the actual request-tracing document above was found instead. An attempted National Archives licence-page read was unavailable and is **not** relied upon for a legal conclusion. No terms or licence acceptance occurred.

**Privacy finding:** the real `publishing_request_id` remains OPAQUE. The documentation establishes a tracing purpose, not safe storage/republication of this specific value. This is a missing-proof determination, not a declaration that a particular person was identified or that an incident occurred. Neither public availability, string/UUID-like shape, the public content ID's different semantics, nor a null identifier supplies the missing whole-response privacy authorization. No value, partial value or hash of that identifier is retained. A change to real privacy admission needs independent TL/Owner/Privacy review under the TASK.

## Complete local structural proposal

Every root field is required, matching the existing exact-source profile. Optionality exists only where explicitly listed below. Absent optional fields and present values are checked independently; unknown fields are refused at every accepted object depth. Required/optional choices are conservative local restrictions, not claims that GOV.UK guarantees those fields forever. Any upstream expansion blocks this proposal.

| Family | Closed local contract | Privacy classification |
| --- | --- | --- |
| Root identity | `base_path`, `content_id`, `document_type`, `schema_name`, `locale`, `phase`, `publishing_app`, `rendering_app` fixed to existing National List profile; identity verifier independently re-used | Public technical identity; never regulatory truth |
| Root display | `title`, `description`: nonempty bounded strings without control/bidi/zero-width ambiguity | Content semantics remain unreviewed; string type does not prove privacy |
| Root publishing times | `first_published_at`, `public_updated_at`, `updated_at`: valid calendar instants with explicit zone; first ≤ public update ≤ update ≤ retrieval | Publishing chronology only; no validFrom/validUntil |
| Root analytics | `analytics_identifier` must remain null for this observed source | Any newly populated analytics value requires review |
| Root publishing request | `publishing_request_id`: string or null structurally; every non-null string, including empty, blocks as opaque; other types fail the schema | OPAQUE, never exported; null still blocks live admission |
| Scheduling | `publishing_scheduled_at`, `scheduled_publishing_delay_seconds`: null only | Any new scheduling material requires review |
| Withdrawal | `withdrawn_notice`: empty object only | Any withdrawal material blocks; no ignored explanation/date |
| Details body | String, full finite fragment grammar: root paragraphs/wrappers; ordered legislative list/items; item-only br; balanced nesting; no attributes beyond literal reviewed wrapper/list class, entities, comments, scripts or ignored tail | Syntax only. No locator is retained by this stage; no legal/body admission |
| Details attachments | Exact empty array | Every member requires a new review; no attachment URL is followed |
| Details history | `change_history`: array, each strict object has `public_timestamp` and `note`; each time lies between first publication and update; note is bounded text | No chronology-to-law or free-text privacy inference; array order is not authority |
| Details manual | Strict `{base_path}` pinned to existing Immigration Rules manual | Structural parent relation |
| Details organisations | Empty or singleton strict `{title, abbreviation, web_url}` with fixed Home Office URL | Display metadata only; changed cardinality/unknown field refused |
| Details presentation | `visually_expanded`: boolean | No authority or applicability effect |
| Root links | Exactly four singleton arrays: `available_translations`, `manual`, `organisations`, `primary_publishing_organisation` | Independent identity/authority relations, no inferred alias or sibling admission |
| Every linked item | Required `api_path`, `api_url`, `base_path`, `content_id`, `document_type`, `links`, `locale`, `schema_name`, `web_url`, `withdrawn`; exact source-specific identity/URLs, empty nested links, false withdrawal; optional bounded `title` | Public technical relation only; never follow embedded URL |
| Translation/manual extras | Optional valid `public_updated_at`, no later than retrieval | Linked publishing time, not legal time; not required equal to root edition time |
| Organisation extras | Optional bounded `analytics_identifier`; required `details` | Analytics purpose does not prove value safe to republish |
| Organisation details | Required `organisation_govuk_status`; optional `acronym`, `brand`, `default_news_image`, `logo`; strict objects throughout | Display metadata still needs semantic/privacy review |
| Status object | Required literal live `status`; optional null or valid `updated_at` ≤ retrieval; optional null or exact Home Office `url` | Does not grant legal authority by itself |
| Image object | Required `high_resolution_url`, `url`: explicit HTTPS assets.publishing.service.gov.uk path, image extension, no query/fragment/credential/port/encoding/dot segment; never fetched | Validated syntax only, not a rights/retention decision |
| Logo object | Required bounded `crest`, `formatted_title` strings, never rendered | No HTML execution or privacy admission |

The existing duplicate-aware scanner runs before any JSON interpretation: full bytes, decoded duplicate keys, prototype keys, invalid Unicode, trailing/truncated JSON, depth/member/array/number bounds. The original transport keeps 65,536 UTF-8 bytes inclusive, fatal UTF-8, 10-second timeout, fixed HTTPS URL, checked DNS/connection address, port/media/redirect limits. No raising, stripping, canonical-reserializing to evade bounds, or accepting a parsed prefix. No new dependencies.

The structure checker returns only `STRUCTURE_ONLY` plus contract version, or a finite reason. It never returns a Zod error/path/key/value, body, digest or locator. The complete syntax check is followed by existing identity verification and publishing-time consistency checks. A structure PASS is necessary but never sufficient. The qualifier then refuses opaque metadata, refuses **all live data** without whole-response review, and admits only the pre-existing exact synthetic fixture in synthetic mode. The expanded synthetic fixture is structural coverage only and cannot become a qualified observation.

New finite refusals: `unexpected_response_fields`, `invalid_response_field`, `unreviewed_attachment`, `unreviewed_scheduling`, `unreviewed_withdrawal`, `source_time_conflict`, `unsafe_source_fragment`. Existing identity/parser/refusal reasons remain. First failing checks determine the reason; a reason does not claim that all later predicates were assessed. Unknown keys take precedence over any data-bearing diagnostic.

## Dataflow and report boundary

Fixed protected retrieval → full scanner/identity → proposed complete structure/time/fragment check → **privacy qualification** → exact synthetic locator → canonical research-gap construction. An upstream BLOCKED stage exits before research construction. Report serialization independently refuses research on a blocked, live, unqualified or unlocated result. Report v2 adds `wholeResponseContract`; historical v1 evidence is unchanged.

Real source text exists only in volatile process memory. Existing internal hashing by retrieval is not published. Persisted source reports contain only fixed descriptors/URLs, UTC execution times, bytes, redirect count, finite stage/reason/gaps and explicit null observation/research. They are reports, not replayable custody or admission credentials. Live mode never upgrades a stored/synthetic input to trusted origin. Only synthetic qualified output may contain its synthetic digest and locator.

## Commands and result semantics

Run from repository root with Node 22 and the unchanged lockfile:

```sh
node --import ./scripts/server-only-test-register.mjs --import tsx scripts/official-truth-real-primary-source-bridge-1/run.ts
node --import ./scripts/server-only-test-register.mjs --import tsx scripts/official-truth-real-primary-source-bridge-1/run.ts --offline-fixture
node --import ./scripts/server-only-test-register.mjs --import tsx scripts/official-truth-real-primary-source-bridge-1/run.ts --live-official
node --import ./scripts/server-only-test-register.mjs --import tsx --test lib/readiness/official-truth-real-primary-source-bridge-1.test.ts
```

Default is NOT_RUN, with no network. Offline is labeled synthetic. Live is explicit, one exact source through the existing adapter, with no file/URL/provider input. Safe BLOCKED is exit 0 for successful engineering execution, **not** source/Official Truth PASS. Invalid arguments return 2, unexpected internal failure 1; neither echoes supplied values. No automatic next source campaign.

## Future legal-evidence sequence — design only, not dispatched

1. Independently resolve provenance/privacy/retention and full-response content review for this representation; approve a versioned admission rule only if justified. No sanitised excerpt can substitute for the original whole-response proof.
2. In a separately scoped task, establish authoritative rule text, amendments, commencement and effective intervals from approved primary sources; distinguish publication from legal effect and detect conflict/staleness.
3. Prove National List cross-reference semantics together with the actual ETA rules and exceptions. A listed nationality alone proves no obligation or exemption, including for Swiss passports.
4. Independently bind citizenship, residence, issuer, credential subclass/status, travel date, entry purpose and route/transit; missing dimensions remain unknown.
5. Separately verify any official action endpoint/purpose, expiry/validity, scope coverage and conflicts. Only then consider reviewed research/Evidence construction and existing same-request custody protocols.
6. Accepted Evidence/Rule, registry/F8/hosted adoption and traveller-facing activation require their independent existing gates. This package executes none of these steps and supplies no legal result.
