# GOV.UK Content API identity profile audit 1

Date: 4 October 2026. Issue #816 / Draft PR #817 / Generation 1.
Writer: **Jetnity GOV.UK Content API identity profile audit 1**.
Baseline: `601379f2f2138a49fbf85fa8b44856fb71079d45`.
Dispatch: `9b44292be537408a61e05a994651a497fc98b8fa`.
Model: **GPT-6 Astra — Sehr hoch**, `gpt-6-astra` / `xhigh`, Codex Desktop.

Classification: **GOVUK_CONTENT_API_IDENTITY_PROFILE_PROVEN**.

This is an author audit verdict about the feasibility of a precisely specified identity verifier under the merged R1/R2 contracts. It is not an implemented or registered profile, a Technical-Lead PASS, an accepted Evidence version, or a legal-source-family verdict. All real registries remain unchanged. The proposed first profile is restricted to the English Home Office Immigration Rules National List Content API representation. The Appendix ETA is a negative control, never a second positive candidate.

## 1. Evidence boundary and source catalogue

Only direct official GOV.UK responses, official publishing documentation, and the `alphagov` publishing source linked by that documentation support the conclusions. Searches located official documentation only; snippets are not evidence. All URLs actually fetched for this audit, including exploratory official-source reads, are listed in section 10 with response hashes and UTC times. An embedded asset/link was not fetched merely because it appears in a response.

Source references used below:

- **API reference**: [GOV.UK Content API reference](https://content-api.publishing.service.gov.uk/reference.html).
- **Guide**: [Content API getting started](https://content-api.publishing.service.gov.uk/getting-started.html), including links, HTML, and non-base-path 303 behavior.
- **Model**: [Publishing API model](https://docs.publishing.service.gov.uk/repos/publishing-api/model.html), especially content_id, Document, Edition, and Linking.
- **Publishing API**: [Official API documentation](https://docs.publishing.service.gov.uk/repos/publishing-api/api.html), including content_id/locale edition selection and link arrays of content ids. No publishing API operation was invoked.
- **Schema**: [manual_section schema](https://docs.publishing.service.gov.uk/content-schemas/manual_section.html), with [official machine schema](https://raw.githubusercontent.com/alphagov/publishing-api/main/content_schemas/dist/formats/manual_section/frontend/schema.json).
- **Format**: [manual_section document type](https://docs.publishing.service.gov.uk/document-types/manual_section.html). This format can use more than one schema; document_type alone is not a schema proof.
- **Publisher implementation**: [manuals-publisher documentation](https://docs.publishing.service.gov.uk/repos/manuals-publisher.html) identifies the official repository; its [DraftAdapter at observed commit 151ae8d](https://raw.githubusercontent.com/alphagov/manuals-publisher/151ae8dbc04b83129e15305492e7c14224c367ff/app/adapters/publishing/draft_adapter.rb) supplies concrete organisation-link semantics.
- **Organisation identity**: [Home Office Content API](https://www.gov.uk/api/content/government/organisations/home-office).
- **Authority context**: [Home Office responsibilities](https://www.gov.uk/government/organisations/home-office/about).

The documentation/source files are research inputs. Some exceed Jetnity's 65,536-byte transport ceiling; they are not proposed runtime supports or additional runtime fetches. Source-repository code explains the metadata and agrees with the observed public responses; it is not claimed to identify the exact deployed GOV.UK revision.

## 2. Fresh response observations

Define these exact strings for the rest of this document:

| Symbol | Value |
| --- | --- |
| `N` | `2b25b3d4-4eaa-4859-a34e-c7869c114c15` |
| `A` | `2620750b-5453-44f1-98af-414037c833be` |
| `H` | `06056197-bc69-4147-aa28-070bca132178` |
| `M` | `87e2748f-2e9b-4681-8baa-778b6d326a8a` |
| `NP` | `/guidance/immigration-rules/immigration-rules-appendix-eta-national-list` |
| `AP` | `/guidance/immigration-rules/immigration-rules-appendix-electronic-travel-authorisation` |
| `MP` | `/guidance/immigration-rules` |
| `HP` | `/government/organisations/home-office` |
| `NJ` | `https://www.gov.uk/api/content/guidance/immigration-rules/immigration-rules-appendix-eta-national-list` |
| `AJ` | `https://www.gov.uk/api/content/guidance/immigration-rules/immigration-rules-appendix-electronic-travel-authorisation` |
| `NH` | `https://www.gov.uk/guidance/immigration-rules/immigration-rules-appendix-eta-national-list` |

Three separate National List GETs succeeded, including a third more than six minutes after the first. One Appendix GET and one National List human-page GET also succeeded. Each returned HTTP 200, zero redirects, and its exact requested URL as the effective URL. Both API items were `application/json; charset=utf-8`; the human page was `text/html; charset=utf-8`. Fatal UTF-8 decoding succeeded. Requests sent `accept-encoding: identity` and `cache-control: no-cache`; no conditional request, query cache-buster, credentials or government write was used. These are fresh client requests, not a claim that GOV.UK's cache was bypassed or that publication occurred during the audit.

| Observation | UTC start → completion on 2026-10-04 | Content-Length / actual UTF-8 bytes | Complete raw-response SHA-256 |
| --- | --- | --- | --- |
| National List 1, `NJ` | `12:34:38.180Z` → `12:34:38.270Z` | 7,788 / 7,788 | `59a7fd6e7416f989ace351bc5ab4f562c52b3c5cab64fcbe861ea4a57ced1854` |
| National List 2, `NJ` | `12:34:38.351Z` → `12:34:38.395Z` | 7,788 / 7,788 | `59a7fd6e7416f989ace351bc5ab4f562c52b3c5cab64fcbe861ea4a57ced1854` |
| National List 3, `NJ` | `12:41:12.807Z` → `12:41:12.970Z` | 7,788 / 7,788 | `59a7fd6e7416f989ace351bc5ab4f562c52b3c5cab64fcbe861ea4a57ced1854` |
| Appendix ETA, `AJ` | `12:34:38.271Z` → `12:34:38.350Z` | 22,965 / 22,965 | `6859cfcacb44cc1287daa8daeedaf05a8b7f18e4ee638cfa7253e09f5d170037` |
| National List HTML, `NH` | `12:34:38.395Z` → `12:34:38.572Z` | 62,422 / 62,422 | `1a03525fbf63794a0d8e950002e09a4e15f7deeda95dce2b9058d09784fd60e0` |

Both API responses are inside the existing byte ceiling. The three National List responses are byte-identical. Repetition is observation, not proof of immutability; official semantics, not repeated hash equality, determine the stable/mutable split.

The live National List has root `content_id=N`, `base_path=NP`, `locale=en`, `schema_name=manual_section`, `document_type=manual_section`, `phase=live`, `publishing_app=manuals-publisher`, and `rendering_app=frontend`. Its four root link relations are `available_translations`, `manual`, `organisations`, and `primary_publishing_organisation`. Each currently has one entry. Both organisation relations contain `H`, organisation schema/type, locale `en`, and base path `HP`. The manual relation contains `M`, type/schema `manual`, locale `en`, and `MP`. The translation entry is this same English item `N` at `NP`.

The Appendix has all those broad family/organisation values, but root id `A` and path `AP`. Its id/path are also used by its self-translation entry. This is a real official sibling with the same host and competent publisher, not an invented hostname attack.

Research inspection using a JSON decoder's object-pairs callback found zero duplicate keys anywhere in each API response. This inspection does not implement or test the future bounded runtime parser. For the National List, the observed whole response has 29 objects, 122 object members, 135 values including containers, maximum container depth 6, maximum 20 members in one object, maximum array length 7, and maximum decoded key length 34. Appendix: 32 objects, 128 members, 144 values, depth 6, maximum 20 members, maximum array length 10, and maximum key length 34. The third National List is byte-equal to the inspected first response.

`details.body` is a string containing HTML, not a parsed legal record. National List: 2,703 UTF-8 bytes, fragment SHA-256 `b38812df1e81fc69951de54da03a6311de89631b9ffbac351d4b972db2f17777`. Appendix: 17,329 UTF-8 bytes / 17,304 characters, fragment SHA-256 `9f71122dd3383cd8cb5c879048df51bfb430277d0693826a1ec101ec485c7695`. Fragment hashes are research diagnostics only; they cannot replace the complete response fingerprint.

## 3. Publisher and authority machine identifiers

**Decision: both expected arrays can contain exactly `H`, with distinct documented roles.**

| Jetnity expectation | Exact proposed value | Response evidence and interpretation |
| --- | --- | --- |
| `expectedPublisherIds` | `["06056197-bc69-4147-aa28-070bca132178"]` | Exact singleton `links.primary_publishing_organisation[*].content_id`. |
| `expectedAuthorityIds` | `["06056197-bc69-4147-aa28-070bca132178"]` | Exact singleton `links.organisations[*].content_id`, corroborated by the primary-publisher relation, the official organisation resource and the department's documented responsibilities. |

The Home Office resource independently returns root `content_id=H`, `locale=en`, `base_path=HP`, `schema_name=document_type=organisation`. The responsibilities page identifies Home Office's immigration/passport remit. Treating `H` as the competent publisher/authority identity for this narrow publication is the audit's explicit mapping from those official facts to R1. It is not an assertion that any `organisations` link universally confers legal authority, nor that the Content API has a generic `legal_authority` field. The authority expectation is selected during reviewed registration, never inferred afresh by a runtime search.

`H` is an opaque UUID present in the target bytes and accepted by R1's bounded metadata-id grammar. Organisation names, branding, logos and analytics id `D16` are not the required machine identity. `details.organisations` contains display information and a URL but no content_id; it is not a substitute for either root link relation. The technical application name `manuals-publisher` is not the publisher/authority id.

**Documentation discrepancy resolved explicitly:** the generated schema description calls `primary_publishing_organisation` the publishing organisation but also says it is empty outside Whitehall. That latter availability statement conflicts with both observed `manuals-publisher` responses. At official source commit `151ae8dbc04b83129e15305492e7c14224c367ff`, `Publishing::DraftAdapter.patch_links_for_section` resolves the parent manual's organisation and sets **both** `organisations` and `primary_publishing_organisation` to its `content_id`; `manual` is set to the parent manual id. The equivalent manual method uses the same two organisation links. This concrete source plus live bytes resolves availability for this family. It does not justify a generic all-GOV.UK publisher rule. The stale schema qualifier is not silently adopted or concealed.

Each relation must be an array of exactly one correctly typed organisation object with id `H`; enforce `locale=en`, schema/type `organisation`, `base_path=HP`, exact `api_path=/api/content` + `HP`, exact `api_url=https://www.gov.uk/api/content` + `HP`, exact `web_url=https://www.gov.uk` + `HP`, and `withdrawn=false`. Require its `details.organisation_govuk_status.status=live`. No network dereference occurs inside the future profile. The top-level organisation API was fetched for this audit only; its 302,033 bytes do not need to fit the item verifier's byte ceiling.

Missing either relation, substituting a different UUID, duplicating an entry, or adding a second organisation rejects. A publisher transfer, department reorganisation or co-publisher needs a reviewed descriptor/profile change. Do not silently deduplicate or accept an expected-id subset. Additional root organisational relation types also require review under the closed root-link shape below.

## 4. Item, locale, representation and version mapping

**Select external namespace meaning “GOV.UK language-independent content_id”, with proposed namespace token `govuk-content-id` and external value `N`. Locale remains mandatory representation metadata.** No real Jetnity ids or profile ids are allocated by this choice.

The API reference's unique individual content resource is `(content_id, locale)`. The official Model explains the other level: one content_id persists across translations and iterations, while a Document groups editions in one locale. There is no contradiction. Jetnity's `(sourceId, contentItemId)` is the publication/support identity; its representation stream already includes a stable format/locale pin. Therefore:

- `N` alone is sufficient as this publication's **external item id**, not sufficient to authenticate a received representation.
- The verifier must compare both root `content_id=N` and root `locale=en` against the trusted descriptor/profile. A missing or wrong locale always rejects.
- Do not concatenate `:en` into externalContentId merely to duplicate the existing representation dimension and allow future translations to inflate support count.
- The first profile accepts English only. Other languages require separate reviewed representation handling; no translated legal equivalence or extra support is inferred.
- `A` is another content item even under the same platform authority. It cannot acquire the National List's local item id.

| Future R1/R2 field | Audit mapping; no registration |
| --- | --- |
| `sourceId` | Unallocated server-owned official platform/domain trust identity; retain existing source-registry semantics. No per-page sourceId or Home-Office-only ownership of the whole GOV.UK host is introduced. |
| `contentItemId` | Unallocated local publication id; external namespace/value are the reviewed `govuk-content-id` / `N`. |
| `contentItemVersion`, `current` | Future reviewed positive int32 descriptor version / true; no numeric allocation here. |
| expected publisher/authority arrays | Exact singleton `[H]` in each role, as section 3. |
| `representationId` | Unallocated English Content API JSON stream for that item. |
| `representationVersion`, `current` | Future reviewed descriptor version / true; not an upstream edition number. |
| `requestUrls` | Exactly `[NJ]`. No wildcard, query, alias, slash variant, HTML URL or sibling. |
| `expectedFinalUrl` | Exactly `NJ`. |
| `expectedMediaType` | Exactly normalized `application/json`; observed header includes UTF-8 parameter. |
| `expectedLocale`, `expectedSchema` | Exactly `en`, `manual_section`; neither nullable in this profile. |
| `identityProfileId`, `identityProfileVersion` | Unallocated code-owned narrow National List profile and its reviewed positive version. Database metadata never creates verifier code. |

Code-owned constants additionally pin `document_type=manual_section`, `phase=live`, `publishing_app=manuals-publisher`, `rendering_app=frontend`, parent manual `M/MP`, and the relation rules. R1 need not acquire a free-form executable expectation object. The fixed profile checks the trusted descriptors themselves against this scope before it examines response identity; an arbitrary descriptor with another external id cannot turn this profile into a generic family verifier.

The current human HTML page has `lang=en`, `govuk:content-id=N`, schema/format `manual_section`, and the exact API `details.body` fragment. The Guide explains the API's rendering relationship. **HTML and API are two representations of one future ContentItemRef.** Their response bytes and observation hashes differ. They must never count as two composition supports.

**Exclude HTML from first registration.** The HTML publisher meta value is a display name; matching it is not the machine-relation proof above. Any later HTML representation needs a distinct reviewed identity profile and independent transport/body-limit checks. The present 62,422-byte size is an observation, not a permanent capacity guarantee. No HTML profile or legal extractor is specified here.

The generic `manual_section` family is too broad: official format documentation permits multiple schemas; departments and manual parents differ; the real sibling has the same broad family. Select a profile scoped to the exact National List item, English API representation, this manual parent and Home Office relation shape. A later reusable family abstraction needs its own evidence/review, not automatic admission of the sibling.

## 5. Stable versus mutable identity matrix

All observed values below are National List values shared by the three reads. “Pin” means a reviewed representation/compatibility constraint, not a claim of permanent upstream immutability. Meaning references point to the directly fetched official sources in section 1. Equal bytes over this short interval cannot prove permanent stability.

| Field/path | Observed current value | Official documented meaning | Identity role | Expected stability | Verifier action | Drift action |
| --- | --- | --- | --- | --- | --- | --- |
| `content_id` | `N` | Model: publication UUID across iterations/translations. | External item anchor. | Stable publication id. | Required own string, exact canonical UUID and exact `N`. | Reject; never automatically replace the item. |
| `base_path` | `NP` | Guide: root human path for the content. | Exact transport/path cross-check. | May move; not an eternal id. | Require `https://www.gov.uk/api/content` + value = `NJ` and exact `NP`. | Reject; reviewed URL/descriptor transition. |
| `locale` | `en` | API reference/Model: language; part of localized resource identity. | Mandatory representation discriminator. | Stable within this stream. | Exact own string `en`. | Reject; another locale requires reviewed representation handling. |
| `schema_name` | `manual_section` | Guide: schema governing content structure. | Structural compatibility pin. | May migrate. | Exact string equals descriptor and profile. | Reject; profile/descriptor review. |
| `document_type` | `manual_section` | Guide/Format: content format, possibly sharing schemas. | Independent format pin. | May migrate. | Exact own string; no schema-only shortcut. | Reject; profile review. |
| `phase` | `live` | Schema: service-design phase, not publishing workflow state. | Conservative eligibility constraint. | Can change. | Exact `live`; separately inspect withdrawal shape. | Reject alpha/beta/missing; not proof of legal freshness. |
| `publishing_app` | `manuals-publisher` | API reference/Schema: publishing software. | Technical family compatibility only. | Can migrate. | Exact technical pin; never used in publisher arrays. | Reject pending profile review, not an inferred new authority. |
| `rendering_app` | `frontend` | API reference/Schema: rendering software. | Technical compatibility only. | Can migrate. | Exact technical pin for this profile. | Reject pending profile review. |
| `links.primary_publishing_organisation[*].content_id` | `[H]` | Schema + concrete publisher code: owning publishing organisation. | Publisher machine pin. | Stable unless ownership changes. | Exact singleton, typed link and URL/locale checks. | Missing/different/additional/duplicate rejects; descriptor review. |
| `links.organisations[*].content_id` | `[H]` | Publisher code supplies manual's owning organisation; authority context is independently reviewed. | Authority machine pin for this narrow family. | Stable unless ownership changes. | Exact singleton, same organisation checks; no subset matching. | Reject and review authority expectation. |
| Organisation names/logo/`analytics_identifier` | `Home Office`, logo metadata, `D16` | Schema: presentation/analytics metadata. | No machine identity authority. | Mutable. | No value equality pin; validate only any explicitly required containers. | Value-only changes do not change item identity. |
| `links.manual` and `details.manual.base_path` | `M`, `MP` | Publisher code binds section to its manual. | Narrow profile scope guard. | Usually stable; parent can change. | One manual link, exact id/path/locale/type/schema and matching details path. | Reject; family/profile review. |
| `links.available_translations` | One self-entry `N`, `en`, `NP` | Model/Schema: related localized content; same publication id. | Current narrow envelope consistency. | May expand. | Require current singleton self shape; no support counting. | Addition or contradictory self entry needs profile review. |
| `title` | `Immigration Rules Appendix ETA National List` | API reference: displayed edition title. | Observation, not id. | Mutable. | String required; ignore exact value. | Valid text change passes identity. |
| `description` | `List of nationalities requiring an Electronic Travel Authorisation (ETA) prior to travel to the UK pursuant to Appendix Electronic Travel Authorisation.` | API reference: display description. | Observation, not id or legal conclusion. | Mutable. | String required; ignore exact value. | Valid text change passes identity. |
| `first_published_at` | `2024-10-08T10:43:48+01:00` | API reference: initial publication timestamp, publisher-set or assigned. | Observation only. | Normally stable, correctable. | No equality pin; no identity decision from its date. | Value-only change is observation change. |
| `public_updated_at` | `2026-03-05T15:03:24+00:00` | API reference: major public update timestamp; publisher override possible. | Observation/freshness input elsewhere, not identity. | Mutable. | Require timestamp string shape; no equality or legal-date inference. | Valid timestamp change passes identity; new observation. |
| `updated_at` | `2026-08-03T11:12:11+01:00` | API reference: content-store change time, including dependent links. | Observation only. | Mutable even without legal text change. | Require timestamp string shape; no equality pin. | Valid timestamp change passes identity; new observation. |
| `details.body` | HTML string, 2,703 UTF-8 bytes; fragment hash in section 2. | Schema/Guide: HTML content field. | Required string container; no semantic extraction. | Mutable. | Require string; neither parse HTML nor compare body/hash to this audit. | Content-only change passes identity but cannot reuse accepted Evidence. |
| `withdrawn_notice` | `{}` | API reference/Model: withdrawal information; withdrawn content can remain readable. | Separate conservative eligibility guard. | Can change. | Require empty object for this profile. | Nonempty/malformed rejects; `phase=live` is not sufficient. |
| Full response SHA-256 | `59a7fd6e7416f989ace351bc5ab4f562c52b3c5cab64fcbe861ea4a57ced1854` | Audit-calculated whole-response digest, not a publisher identifier. | Observation integrity only. | Mutable for any byte change. | Record for research/provenance; never fixed profile equality. | Recompute fingerprint/observation; do not silently reuse Evidence. |

The SHA-256 above covers raw received entity bytes after HTTP transfer framing, without JSON reserialization or trimming. R2's `evidenceQuellenFingerprint` hashes complete decoded text after CRLF/CR normalization. Those contracts are not generally interchangeable. These API bodies have no UTF-8 BOM or CR bytes, so their raw-byte SHA-256 equals the SHA-256 of the full decoded/line-ending-normalized UTF-8 text in this observation. No hash was computed from only identity fields or `details.body` to stand in for the full response.

“Observe” here means research reporting or existing bounded ephemeral provenance. It introduces no logging, raw response retention, timestamp authority or database field. Runtime wall-clock/freshness authority remains the existing server-owned path.

## 6. Bounded duplicate-aware JSON parsing decision

**A duplicate-key detector is mandatory before any identity field is read. Standard whole-document `JSON.parse` alone is insufficient.** Zero duplicates in the sampled documents cannot prove that future responses lack them. Reject ambiguity even when duplicate values are equal and even when duplication is outside an identity subtree.

The following is the required future algorithm specification, not code added by this audit:

1. Receive only R2's frozen trusted descriptors, fatal-UTF-8-decoded `responseText`, verified final URL and normalized media type. Independently cap the text's UTF-8 encoding at 65,536 bytes; do not raise retrieval's raw-byte cap. Reject empty input. An initial BOM surviving into the string is invalid JSON; retrieval's decoder may already have removed a byte-order mark, so the profile does not claim to observe original wire BOM bytes.
2. Perform a deterministic JSON grammar scan of the **entire string**, from offset zero to its end, before selecting values. Use an explicit stack or bounded descent; root container depth is 1, maximum depth **16**. Maximum total object members **2,048**, maximum members per object **256**, maximum array elements per array **1,024**, maximum total values including containers **4,096**, and maximum decoded object-key length **128 UTF-16 code units**. Each counter is checked before growth. Key token/string storage is also bounded by the input byte cap. The current observations fit with substantial room.
3. Each object has its own Set of decoded key strings. Decode JSON escapes before insertion; `content_id` and `content\u005fid` are the same key. Duplicate in that object rejects immediately, including equal values, first-correct/last-wrong and first-wrong/last-correct. The same key in two different objects is allowed. A Map/Set must not use property assignment on a normal object as its duplicate test.
4. Strings must obey JSON escapes and control-character rules. Correctly distinguish escaped quotes/backslashes and braces/key-looking text inside strings. Reject unpaired surrogate escapes; combine valid pairs consistently. Compare decoded keys exactly, without case folding or Unicode normalization. Also reject decoded keys `__proto__`, `prototype`, and `constructor` throughout this conservative profile. Read later values as own data properties; do not merge untrusted objects into descriptors.
5. Scan standard JSON arrays/objects, true/false/null and JSON number syntax only. Bound numeric tokens to **64 code units** and require a finite numeric result. Reject comments, NaN/Infinity, invalid escapes, leading-zero numbers, trailing commas, trailing tokens, truncated input, and every bound overflow. The only whitespace accepted outside tokens is JSON whitespace. Require exactly one top-level object, never an array/null/scalar.
6. Only after the complete duplicate/grammar/bounds scan succeeds may a standard `JSON.parse` construct the object, with no reviver. Catch every scanner/parse failure as `invalid_response`. The scanner and decoder must use the same escape semantics; the later implementation slice must prove this with adversarial fixtures. Alternatively, one reviewed bounded duplicate-rejecting parser may construct the object directly with identical behavior. This audit selects the scan-then-parse contract; it does not claim an available third-party library already provides it.

Termination follows from strictly advancing the input cursor or returning failure, a bounded input, a capped stack and counters, and bounded key sets. There is no regular-expression-only search for keys, recursive search for an id, `eval`, HTML parsing, network access or fallback parser. This is a deterministic, finite capability that can be implemented and tested within the existing `verify(responseText)` seam.

**Current-code distinction:** retrieval already bounds response bytes and performs fatal UTF-8 decoding, but it does not impose these JSON response depth/member limits. Its `TIEFE_MAX=8` belongs to hostile **request input** inspection, not the fetched JSON body. The new limits and duplicate detector belong to the proposed future profile, not a claimed existing R2 protection. A detector that cannot demonstrate the specified grammar/escape equivalence must fail its future implementation review; do not enable the profile with last-key-wins parsing.

## 7. Exact proposed verifier and transport contract

The success value contains exactly the seven existing `ContentIdentityBinding` fields copied from the already trusted item/representation tuple: `sourceId`, `contentItemId`, `contentItemVersion`, `representationId`, `representationVersion`, `identityProfileId`, `identityProfileVersion`. It does not mint an id, claim Evidence acceptance or return parsed legal text.

### 7.1 Existing R2 preconditions

One server-held coherent catalog read supplies the authority registry and identity graph. `quellenInhaltRouten` requires exact registered request URL membership. DNS/IP checks bind the connection; HTTPS/default port, domain ownership, denies, timeouts, raw-byte limits and fatal UTF-8 remain in force. The server selects exactly one current code-owned profile. The profile receives no caller registry, retrieval clock, redirect history, raw status/header authority, traveller data or scope.

`requestUrls=[NJ]` and `expectedFinalUrl=NJ` make the allowed redirect target set a singleton. Any different target, including `AJ`, fails `representation_url_mismatch` before that target is fetched; a redirect back to `NJ` fails the existing visited-URL loop check. Thus this descriptor has no successful redirect path without adding a new redirect-count argument. GOV.UK's documented 303 behavior for non-base paths is real, but those aliases are excluded from first registration.

Existing retrieval accepts successful 2xx statuses, not only 200; every audit observation was 200. The verifier contract contains no status field, so this proposal does not invent an exact-200 check inside it. Wrong final URL and normalized media type are already rejected before profile execution; the profile rechecks its supplied values. A future requirement for a stricter status/header policy would be a separately reviewed transport change, not secretly implemented here.

### 7.2 Profile sequence

1. Confirm trusted descriptor coherence: same source/item/version across item and representation, current flags, exact expected namespace/id `govuk-content-id/N`, singleton publisher/authority arrays `[H]`, exact `[NJ]` request set, `NJ` final URL, `application/json`, `en`, and `manual_section`; select the reviewed code profile/version. Reject an arbitrary descriptor for `A` even if its response would otherwise match itself.
2. Require supplied final URL `NJ` and normalized media type `application/json`, both equal to the representation's expectations. Strip no query/slash/path segment inside the verifier, and do not infer origin from response fields. R2 has already applied its canonical fragment handling; fragments never identify another resource.
3. Apply section 6 to the whole raw responseText before any identity read.
4. Require own root identity strings `content_id=N`, `base_path=NP`, `locale=en`, `schema_name=document_type=manual_section`, `phase=live`, `publishing_app=manuals-publisher`, `rendering_app=frontend`. Require the exact API prefix + base_path to equal `NJ`, not a prefix match. No embedded linked id can substitute for the root id.
5. Require own object `details`, string `details.body`, own object `links`, and empty-object `withdrawn_notice`. Required mutable `title` and `description` remain strings. Required `public_updated_at` and `updated_at` remain timestamp strings in RFC3339 date-time form with timezone and real calendar values; valid changed values are accepted without freshness/equality comparison.
6. For a bounded first envelope, allow only the 20 currently observed root keys: `analytics_identifier`, `base_path`, `content_id`, `description`, `details`, `document_type`, `first_published_at`, `links`, `locale`, `phase`, `public_updated_at`, `publishing_app`, `publishing_request_id`, `publishing_scheduled_at`, `rendering_app`, `scheduled_publishing_delay_seconds`, `schema_name`, `title`, `updated_at`, `withdrawn_notice`. The keys required by steps 4–5 must exist. The other five are optional, non-authoritative observations. Unknown root keys require profile review. Require the current six-key details shape (`attachments`, `body`, `change_history`, `manual`, `organisations`, `visually_expanded`) with array/string/array/object/array/boolean types respectively. Do not match legal body text, attachment values, change-history values or display organisations to identify the item.
7. Require exactly the four current root link keys. Each value is a one-element array of objects. Validate both organisation entries exactly as section 3; require no nested links in those entries. The `manual` entry must bind `M`, `MP`, `en`, schema/type `manual`, correct api_path/api_url/web_url derived from `MP`, `withdrawn=false`, and empty nested links. `details.manual.base_path` must be `MP`. The self-translation entry must bind `N`, `NP`, `en`, schema/type `manual_section`, its exact api_path/api_url/web_url, `withdrawn=false`, and empty nested links. These checks do not recursively collect identifiers from other paths. Optional display/analytics fields in linked objects are not equality pins; duplicate keys anywhere were already rejected. A new root relation, extra organisation entry or new parent/translation shape fails closed for review.
8. Return only the expected binding, frozen, with no extra fields. Malformed grammar, shape, types or bounds return `invalid_response`; a well-formed but contradictory descriptor/identity/transport pin returns `identity_mismatch`. Neither failure has partial success or a inferred replacement binding. R2 catches a thrown verifier, rejects failure, and compares the returned full tuple to its expected tuple before making server-owned retrieval material.

This accepts changed valid dates, titles, descriptions, body strings and irrelevant metadata within the specified structure. It rejects structural drift; a new valid upstream schema feature is not automatically a Jetnity identity permission. The limited availability cost is intentional and visible.

Full-body hash change remains material downstream: R2 recomputes the complete source fingerprint and observation identity. Same-request extraction bound to an older accepted Evidence hash must reject changed bytes. Passing this identity profile alone never refreshes or accepts Evidence, chooses an extractor, supplies a trusted fact or bypasses those later checks.

## 8. Adversarial audit matrix

These are exact contract traces and comparisons against captured public responses, **not executed tests of a profile that this task forbids implementing**. “Reject” below names required future behavior. The positive/real-sibling rows use observed bytes; the other rows are reasoned mutations of the specified input contract. The next implementation slice must turn them into executable synthetic/captured-fixture tests before any registration.

| Case | Expected decision and responsible check |
| --- | --- |
| Three captured National List responses | All satisfy the enumerated live identity/transport pins and fit proposed bounds; same expected binding. No accepted Evidence is created by this observation. |
| Invalid JSON, truncated input, comments, trailing value | `invalid_response` during whole-string grammar scan; no identity read. |
| Root array/null/scalar | `invalid_response`; exact root-object requirement. |
| Missing/wrongly typed required identity field | `invalid_response`; no fallback to URL/title/body/linked metadata. |
| Wrong root `content_id` | `identity_mismatch`, even if a nested self link or title says National List. |
| Wrong `base_path` | `identity_mismatch`, even with `N`; exact registered path cross-check. |
| Wrong/missing locale | Wrong `cy`, `EN` or other string mismatches; missing/null is invalid; no default to English. |
| Wrong/missing schema | Reject independently of document_type. |
| Wrong/missing document_type | Reject independently of schema_name. |
| Phase alpha/beta or absent | Reject. `live` is an eligibility pin, not a freshness certificate. |
| Missing primary publisher or organisations relation | Reject, including empty array; display names and technical app cannot substitute. |
| Wrong publisher id with name Home Office | Reject exact UUID mismatch. |
| Correct primary publisher, wrong authority relation | Reject; check both roles separately. |
| Extra organisation relationship | Two entries, even duplicate `H`, reject; new lead/emphasised/root relation also rejects the closed shape. No subset match or deduplication. |
| Organisation UUID correct but wrong locale/type/path/URL | Reject inconsistent linked-resource identity; no title-based rescue. |
| Wrong final URL with copied correct National List JSON | R2 `representation_url_mismatch`; profile also mismatches if called directly. Identical bytes are not origin proof. |
| Wrong media type, such as text/html with JSON body | R2 `content_type_mismatch`; profile rechecks normalized application/json. |
| Captured Appendix JSON presented with National List descriptor | Reject root `A != N` and `AP != NP`; shared host, Home Office id, locale, live phase and schema cannot rescue it. |
| Caller supplies an Appendix descriptor to the National List profile | Descriptor-scope step rejects; do not return the caller's requested binding. |
| Changed valid `updated_at` alone | Identity remains valid; different full bytes produce a new observation/fingerprint. No claim of changed law. |
| Changed valid `public_updated_at` alone | Identity remains valid; no conversion into a travel/effective date. Freshness and old-Evidence equality remain separate. |
| Changed `details.body` string with stable identity | Identity remains valid within shape/size bounds; new full hash cannot reuse older accepted Evidence. No fact is extracted. |
| Changed title/description or organisation display name | Value-only change passes; required types and machine ids still checked. |
| Redirect from `NJ` to sibling `AJ` | Existing allowed-set check rejects before sibling fetch, even within one authority. |
| Redirect from `NJ` back to `NJ` | Existing loop check rejects; no successful redirect is allowed by the singleton descriptor. |
| Request path and response base_path disagree | Request must first be exactly registered; root path must reconstruct `NJ` exactly. Either routing or profile rejects. |
| Non-base-path alias returns documented 303 | Alias is not in requestUrls; do not follow opportunistically or register automatically. |
| Technical app changes | Reject pending profile review; do not reinterpret app string as a new legal publisher. |
| Nonempty withdrawal notice while phase remains live | Reject withdrawal eligibility independently of service-design phase. |
| Same identity, JSON field order/whitespace change | Valid unique-key JSON may pass; observation hash can change. No serialization-order identity pin. |
| Duplicate root content_id, in either order or with equal values | Reject before JSON.parse identity access. |
| Escaped duplicate `content_id` / `content\u005fid` | Decoded-key Set finds equality; reject. |
| Duplicate root links, nested organisation content_id, or duplicate details.body key | Reject anywhere in the response, even if chosen identity fields appear unaffected. |
| Key-looking text/braces inside body string | Proper string scanner does not invent keys; body remains opaque. |
| Same key in separate objects | Allowed; needed for repeated linked content_id fields. |
| Unpaired surrogate, dangerous decoded key, excessive nesting/members/numeric token | Reject deterministically at the specified scanner boundary. |
| Unknown root field/link type or new translation/parent shape | Reject and require profile review; never infer compatible authority. |
| HTML and JSON submitted as two supports | Same future ContentItemRef; composition distinctness fails. HTML is not eligible under this JSON profile. |

## 9. Conclusion and smallest next slice

**GOVUK_CONTENT_API_IDENTITY_PROFILE_PROVEN** for the narrowly specified English National List JSON representation, subject to independent Technical-Lead exact-head review of this audit. Stable machine ids, exact item/path/locale/transport binding, bounded duplicate-aware parsing and the required return-only-expected-binding behavior all fit the current R1/R2 contract. No missing contract field forces an implementation change outside that future profile.

Smallest next slice: implement **only** the code-owned narrow identity verifier and its bounded duplicate-aware parser, plus synthetic/captured-fixture tests of every matrix row and required handoff documents. Keep the production identity-profile registry empty; use the existing explicit test seams. No real source/content/representation registration or database operation belongs in that slice. The implementation review must verify parser bounds, escape equivalence and exact tuple rebinding rather than accepting this prose as tested code.

Identity proof is distinct from legal sufficiency. This audit does not decide ETA eligibility, nationality inclusion, exemptions, legal dates, composition completeness, traveller outcome or trusted facts. It does not supersede the prior source-family audit's legal/composition gaps. No extractor, composition policy, region pin, Rule fact, CH import, F8, #626 or launch/indexing work is started. Independent Technical Lead owns the next decision. Remain Draft and STOP.

## 10. Complete official retrieval ledger

The following ledger is generated from the recorded direct-response metadata. Each entry has the requested and effective URL, HTTP status, redirect count, observed media type, Content-Length if supplied, actual UTF-8 byte length, complete response SHA-256 and UTC retrieval interval. `absent` means no Content-Length header was supplied, not zero bytes. Every response decoded as UTF-8 with errors fatal; actual raw byte count equalled re-encoded UTF-8 byte count. These are read-only research GETs, not Jetnity live-origin attestations.

| Read | Exact requested URL = exact final URL | UTC start → completion (2026-10-04) | HTTP / redirects | Observed Content-Type | Content-Length | UTF-8 bytes | Full response SHA-256 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| national-1 | [national-1](https://www.gov.uk/api/content/guidance/immigration-rules/immigration-rules-appendix-eta-national-list) | `12:34:38.180Z` → `12:34:38.270Z` | 200 / 0 | `application/json; charset=utf-8` | 7788 | 7788 | `59a7fd6e7416f989ace351bc5ab4f562c52b3c5cab64fcbe861ea4a57ced1854` |
| appendix-1 | [appendix-1](https://www.gov.uk/api/content/guidance/immigration-rules/immigration-rules-appendix-electronic-travel-authorisation) | `12:34:38.271Z` → `12:34:38.350Z` | 200 / 0 | `application/json; charset=utf-8` | 22965 | 22965 | `6859cfcacb44cc1287daa8daeedaf05a8b7f18e4ee638cfa7253e09f5d170037` |
| national-2 | [national-2](https://www.gov.uk/api/content/guidance/immigration-rules/immigration-rules-appendix-eta-national-list) | `12:34:38.351Z` → `12:34:38.395Z` | 200 / 0 | `application/json; charset=utf-8` | 7788 | 7788 | `59a7fd6e7416f989ace351bc5ab4f562c52b3c5cab64fcbe861ea4a57ced1854` |
| national-html | [national-html](https://www.gov.uk/guidance/immigration-rules/immigration-rules-appendix-eta-national-list) | `12:34:38.395Z` → `12:34:38.572Z` | 200 / 0 | `text/html; charset=utf-8` | 62422 | 62422 | `1a03525fbf63794a0d8e950002e09a4e15f7deeda95dce2b9058d09784fd60e0` |
| reference | [reference](https://content-api.publishing.service.gov.uk/reference.html) | `12:34:38.573Z` → `12:34:38.777Z` | 200 / 0 | `text/html; charset=utf-8` | 29934 | 29934 | `66cbeda411840ed8cea0f76771b347a40a1b7319c22eb5c1922ce6c85cd42445` |
| getting-started | [getting-started](https://content-api.publishing.service.gov.uk/getting-started.html) | `12:34:38.779Z` → `12:34:38.963Z` | 200 / 0 | `text/html; charset=utf-8` | 37700 | 37700 | `f8c7cc4984418a4328c4a3a94c55270b39616c4b9e676410bf3953354d78edd2` |
| manual-schema | [manual-schema](https://docs.publishing.service.gov.uk/content-schemas/manual_section.html) | `12:34:38.964Z` → `12:34:39.271Z` | 200 / 0 | `text/html; charset=utf-8` | 276765 | 276765 | `67b9032896bc745debb33a045691d6f39f58bb3407dc17661c686470ba7f2587` |
| manual-document-type | [manual-document-type](https://docs.publishing.service.gov.uk/document-types/manual_section.html) | `12:34:39.273Z` → `12:34:39.481Z` | 200 / 0 | `text/html; charset=utf-8` | 39391 | 39391 | `a24e7a5c34449dfde2eb44b30e82fb5bc512ecdedcbc99d6c5cbdf5cbd5d358c` |
| home-office-api | [home-office-api](https://www.gov.uk/api/content/government/organisations/home-office) | `12:36:05.568Z` → `12:36:05.909Z` | 200 / 0 | `application/json; charset=utf-8` | 302033 | 302033 | `ee2357be212aae4d6f81b9e673f04c99f2a7d6b23179ebdf02d3d44237cab35c` |
| home-office-about | [home-office-about](https://www.gov.uk/government/organisations/home-office/about) | `12:36:05.911Z` → `12:36:06.050Z` | 200 / 0 | `text/html; charset=utf-8` | 69609 | 69609 | `e95b5fec7eb306ea3f17047a9dbad6b497aaef8075edd2b6d8cdfb4ec6f93a1d` |
| manuals-repo-docs | [manuals-repo-docs](https://docs.publishing.service.gov.uk/repos/manuals-publisher.html) | `12:36:06.051Z` → `12:36:06.228Z` | 200 / 0 | `text/html; charset=utf-8` | 26361 | 26361 | `e809aae7f47f256fae4d8178ecd075340dc189435d8cb42ce3486bd7e69f664e` |
| manuals-tree | [manuals-tree](https://api.github.com/repos/alphagov/manuals-publisher/git/trees/main?recursive=1) | `12:36:06.230Z` → `12:36:06.548Z` | 200 / 0 | `application/json; charset=utf-8` | absent | 144666 | `c66a59ae75e1812a1788f458d53a1962a5726ba8a767c8c03f88fc757e6e9c79` |
| manual-schema-json | [manual-schema-json](https://raw.githubusercontent.com/alphagov/publishing-api/main/content_schemas/dist/formats/manual_section/frontend/schema.json) | `12:36:06.550Z` → `12:36:06.837Z` | 200 / 0 | `text/plain; charset=utf-8` | 20965 | 20965 | `cc3888db677731855b24d97e17eff3bc85a7a415764f8d7b4ddee97a7db0affe` |
| publishing-api-docs | [publishing-api-docs](https://docs.publishing.service.gov.uk/repos/publishing-api/api.html) | `12:36:06.839Z` → `12:36:07.017Z` | 200 / 0 | `text/html; charset=utf-8` | 72293 | 72293 | `4164e9c8af613aa17668ea5aa3b85539c70cfe7d26b406119a527ff7275f2334` |
| section-presenter | [section-presenter](https://raw.githubusercontent.com/alphagov/manuals-publisher/main/app/presenters/section_presenter.rb) | `12:37:07.800Z` → `12:37:08.055Z` | 200 / 0 | `text/plain; charset=utf-8` | 882 | 882 | `0a15883fe675ff2bc8155e3dbc4e4d3ff564495b87a03244a843ab04f534900c` |
| manual-presenter | [manual-presenter](https://raw.githubusercontent.com/alphagov/manuals-publisher/main/app/presenters/manual_presenter.rb) | `12:37:08.056Z` → `12:37:08.318Z` | 200 / 0 | `text/plain; charset=utf-8` | 278 | 278 | `b48ac5c959f11c06bac3e3bda38a814f27a0c91eb256d97bf1af384bc399ea17` |
| manuals-commit | [manuals-commit](https://api.github.com/repos/alphagov/manuals-publisher/commits/main) | `12:37:08.320Z` → `12:37:08.909Z` | 200 / 0 | `application/json; charset=utf-8` | absent | 12300 | `15c216992549e1047b53140abbe67a4422759c01805119a7896d72f6bc841bac` |
| linkset-adr | [linkset-adr](https://docs.publishing.service.gov.uk/repos/publishing-api/arch/adr-009-change-linksets-primary-key-to-content-id.html) | `12:37:56.412Z` → `12:37:56.585Z` | 200 / 0 | `text/html; charset=utf-8` | 38465 | 38465 | `52b4038475a204940878039ab43b1763c2c9ae0c4ba0392c4a05f8189948c3d8` |
| manual-draft-adapter | [manual-draft-adapter](https://raw.githubusercontent.com/alphagov/manuals-publisher/151ae8dbc04b83129e15305492e7c14224c367ff/app/adapters/publishing/draft_adapter.rb) | `12:38:29.232Z` → `12:38:29.496Z` | 200 / 0 | `text/plain; charset=utf-8` | 7926 | 7926 | `eb67fcd3368844b6ba7d1c953d617884ea571d815ef2d7df37dae41b8f303a7a` |
| manual-organisation | [manual-organisation](https://raw.githubusercontent.com/alphagov/manuals-publisher/151ae8dbc04b83129e15305492e7c14224c367ff/app/models/organisation.rb) | `12:38:29.497Z` → `12:38:29.732Z` | 200 / 0 | `text/plain; charset=utf-8` | 281 | 281 | `c0514084bdbf6011212cc51cfa73edc26e1c662c6c1a2c73b321e54e8ae22e5b` |
| publishing-model | [publishing-model](https://docs.publishing.service.gov.uk/repos/publishing-api/model.html) | `12:39:04.371Z` → `12:39:04.539Z` | 200 / 0 | `text/html; charset=utf-8` | 35986 | 35986 | `a3c0a7ca64a3d4f59732c4bbfd09b04a84aa9f2cc5ab80ed6ce6aabfb8c60b51` |
| national-3 | [national-3](https://www.gov.uk/api/content/guidance/immigration-rules/immigration-rules-appendix-eta-national-list) | `12:41:12.807Z` → `12:41:12.970Z` | 200 / 0 | `application/json; charset=utf-8` | 7788 | 7788 | `59a7fd6e7416f989ace351bc5ab4f562c52b3c5cab64fcbe861ea4a57ced1854` |
