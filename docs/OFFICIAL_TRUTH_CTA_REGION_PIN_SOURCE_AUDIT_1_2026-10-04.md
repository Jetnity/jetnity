# Common Travel Area region-pin source audit 1

Date: 4 October 2026 (Europe/Zurich)
Issue: #804 / Draft PR: #805
Branch: `docs/official-truth-cta-region-pin-source-audit-1`
Baseline: `main@ec798ab3b7738b3adc76d85ac8b5223e07e970d9`
Immutable task-seed / dispatch head: `db1f5bfac8689aae314e016a7e6c2beaedde0eab`
Logical writer: **Jetnity Official Truth CTA region-pin source audit 1**, Generation **1**
Execution: Codex Desktop, **GPT-6 Astra — Sehr hoch** (`gpt-6-astra`, `xhigh`)
Status: **DOCS-ONLY / AUTHOR DELIVERY / INDEPENDENT EXACT-HEAD REVIEW REQUIRED**

## Decision and exact source

**CTA_REGION_PIN_SOURCE_PROVEN** for the existing one-source `RegulierungsRegionPin` content contract.

Selected response: [GOV.UK Content API — Common Travel Area guidance](https://www.gov.uk/api/content/government/publications/common-travel-area-guidance/common-travel-area-guidance), evidence id **cta-json** below. Its first content paragraph defines the arrangement and individually names the UK, Ireland, both Bailiwicks and the Isle of Man. The same paragraph supplies the full membership; no second content item supplies a missing member. It supports the exact sorted candidate set `['GB', 'GG', 'IE', 'IM', 'JE']`.

This is source-audit proof, not a live Jetnity retrieval attestation or an active region pin. No source identifier, catalogue entry, extractor, composition policy, Rule claim or region pin was registered. `REGULIERUNGS_REGION_PINS` remains empty. The result does not decide any person's ETA or immigration outcome.

## 1. Baseline and current contract

Startup live fetch matched the baseline above. Machine mode was `NORMAL`. Issue #751's current writer section named #804/#805, this branch, this generation and seed. There were no #748 comments newer than `5971622750`, hence no newer MATERIAL. Open PRs were #805 plus historical #28/#39/#40/#50/#52. The desktop chat inventory showed this as the active Codex writer; no overlapping writer was found. #751's lower #801/current-main paragraphs are historical and conflict with its current top section; live main and the open-PR result resolve them. No global continuity document was edited.

Code, not earlier architecture prose, was checked on the exact baseline:

| Live property | Evidence in repository |
| --- | --- |
| One region vocabulary, `common_travel_area`; one `sourceId` and one `sourceContentHash` per pin | `lib/readiness/regulierungs-anwendbarkeit.ts`, `REGULIERUNGS_REGIONEN` and `RegulierungsRegionPin` |
| Region registry is frozen and empty | Same file, `REGULIERUNGS_REGION_PINS = Object.freeze([])` |
| Known journey origin with no pin fails closed | Same file, `herkunftAuswerten`; existing applicability test asserts `region_membership_unpinned` and no redundant origin question |
| Country-code parser | `landescodeLesen` in `lib/readiness/domain.ts`; applicability imports that exact function |
| Response limit | `BODY_MAX = 65_536`, `REDIRECT_MAX = 5`, `TIMEOUT_MS = 10_000` in `official-truth-server-owned-retrieval.ts` |
| Production policy and extractor registries remain empty | `official-truth-composition-policy-registry.ts` and `official-truth-trusted-fact-extractor-registry.ts` |
| Every schema-1 fact remains non-persistable | `persistierbarenClaim` / `akzeptierteRegelClaimSpeichern` in `official-truth-store-server.ts`; `applicability_not_persistable` before transport/client/payload/RPC |
| F8 remains open | Live #751; no acceptance or store function called by this audit |

The predicate architecture's journey-origin section explains the region dependency. This audit proves membership only; it does not re-audit the separate ETA sources or implement their conditions. Earlier audit sizes, hashes and membership prose were not used as current source evidence.

## 2. Direct retrieval method and endpoint existence

All evidence below came from direct Node `https.get` requests to official HTTPS hosts with normal certificate verification. The only supplied headers were the live client's `accept-encoding: identity` and `cache-control: no-cache`. No browser cookies, credentials, provider, paid API or model API was used. Each research request had a 10-second deadline, a 1,048,576-byte research ceiling and at most five manual redirects; every URL was restricted to the explicit official-host list, standard HTTPS port and no credentials/query/fragment. No redirect occurred.

The larger research ceiling was solely for measuring rejected candidates. It does not change production `BODY_MAX`, nor make an oversized response eligible. These research requests do not reproduce the server-held catalogue/DNS-to-connection proof chain and must not be submitted as trusted retrieval authority.

The three task-listed HTML endpoints all returned 200. A search located official GOV.UK developer documentation; no search snippet was used as evidence. **api-doc** was then fetched directly. Its section on reading content documents the public `/api/content/<path>` interface. Each of the three exact API endpoints below subsequently returned HTTP 200 and matching `base_path`/content identity. Existence is established by those real responses, not by constructing a URL or interpreting an error.

### Exact URLs actually fetched

Every requested URL below was also its final/effective and tracking-clean canonical request URL. HTML responses advertised the same human-facing canonical URL. The API request identity stays the API URL; `base_path` identifies its content item, not a redirect.

- **staff-json** — [https://www.gov.uk/api/content/government/publications/common-travel-area/common-travel-area-accessible](https://www.gov.uk/api/content/government/publications/common-travel-area/common-travel-area-accessible)
- **cta-html** — [https://www.gov.uk/government/publications/common-travel-area-guidance/common-travel-area-guidance](https://www.gov.uk/government/publications/common-travel-area-guidance/common-travel-area-guidance)
- **travel-html** — [https://www.gov.uk/guidance/travelling-between-the-uk-and-ireland-isle-of-man-guernsey-or-jersey](https://www.gov.uk/guidance/travelling-between-the-uk-and-ireland-isle-of-man-guernsey-or-jersey)
- **api-doc** — [https://docs.publishing.service.gov.uk/repos/content-store/content-store-api.html](https://docs.publishing.service.gov.uk/repos/content-store/content-store-api.html)
- **travel-json** — [https://www.gov.uk/api/content/guidance/travelling-between-the-uk-and-ireland-isle-of-man-guernsey-or-jersey](https://www.gov.uk/api/content/guidance/travelling-between-the-uk-and-ireland-isle-of-man-guernsey-or-jersey)
- **cta-json** — [https://www.gov.uk/api/content/government/publications/common-travel-area-guidance/common-travel-area-guidance](https://www.gov.uk/api/content/government/publications/common-travel-area-guidance/common-travel-area-guidance)
- **staff-html** — [https://www.gov.uk/government/publications/common-travel-area/common-travel-area-accessible](https://www.gov.uk/government/publications/common-travel-area/common-travel-area-accessible)

**cta-json-recheck** requested the identical cta-json URL once more. Seven unique official URLs, eight direct responses. The developer documentation establishes API mechanics only; it contributes no CTA membership.

### Exact response measurements

For every row: HTTP **200**, redirect count **0**, `Content-Encoding` absent, nonempty body, fatal UTF-8 **PASS**, UTF-8 decode/re-encode byte identity **PASS**, and received bytes equal `Content-Length`. Raw Content-Type for `*-html` and `api-doc`: `text/html; charset=utf-8`; normalized media type: `text/html`. Raw Content-Type for `*-json` and `cta-json-recheck`: `application/json; charset=utf-8`; normalized: `application/json`.

SHA-256 values below are over exact received entity-body bytes before text decoding, JSON parsing, newline normalization or reserialization. HTTP/TLS framing is not part of the entity body. Identity encoding was requested and no compressed Content-Encoding was returned.

| Response | Content-Length | Actual bytes | vs. 65,536 | Exact-byte SHA-256 |
| --- | ---: | ---: | --- | --- |
| cta-json-recheck | 21474 | 21,474 | Within | `b0fcb783c5183d527dfe2615a8a3a13cd8b96f4fa6225b5051508ceffde4f1a8` |
| staff-json | 191386 | 191,386 | OVER | `83f3fb82d927aca56b1c39815cb1cd76c25c0264c793b5142c9e3c3992a506f6` |
| cta-html | 99582 | 99,582 | OVER | `a8a90f84773771537bcff59a111aa0daa9d2ff8782d30d8a03274c8a1b428403` |
| travel-html | 111290 | 111,290 | OVER | `2178ca4d26682e62170113c66ab28283e5f6abb651af3c634f7daeac55345db2` |
| api-doc | 21994 | 21,994 | Within | `c7fdf3c33398aa4c8a9c44f417d5e16c8dbb84157267a720490cd22b535191ef` |
| travel-json | 27034 | 27,034 | Within | `b3573c7ec4cc6e087bb5f94b0cb6b7cfbe256b1fe7fa534621a39a1a1d4324c3` |
| cta-json | 21474 | 21,474 | Within | `b0fcb783c5183d527dfe2615a8a3a13cd8b96f4fa6225b5051508ceffde4f1a8` |
| staff-html | 441937 | 441,937 | OVER | `240be64797162b2fa8ed5ff9d098e5dbd470a58c9b816cd2772417048f775d43` |

| Response | Request start UTC | Body complete UTC |
| --- | --- | --- |
| cta-json-recheck | `2026-10-03T22:28:45.107Z` | `2026-10-03T22:28:45.204Z` |
| staff-json | `2026-10-03T22:25:35.487Z` | `2026-10-03T22:25:35.778Z` |
| cta-html | `2026-10-03T22:24:43.873Z` | `2026-10-03T22:24:43.980Z` |
| travel-html | `2026-10-03T22:24:43.730Z` | `2026-10-03T22:24:43.871Z` |
| api-doc | `2026-10-03T22:25:13.403Z` | `2026-10-03T22:25:13.614Z` |
| travel-json | `2026-10-03T22:25:35.780Z` | `2026-10-03T22:25:35.859Z` |
| cta-json | `2026-10-03T22:25:35.860Z` | `2026-10-03T22:25:35.910Z` |
| staff-html | `2026-10-03T22:24:43.450Z` | `2026-10-03T22:24:43.727Z` |

These UTC windows fall on **4 October 2026 in Europe/Zurich**. They are retrieval times, not legislative effective dates. The selected repeat was byte-identical to the first read, including its full response hash; this is a within-session observation, not a promise of future immutability.

All three HTML candidates and staff-json would fail production retrieval's size guard on their Content-Length before a body could be retained. Both smaller API candidates fit with no limit change. cta-json has 44,062 bytes of headroom. A later content-type allowlist must explicitly allow `application/json`; successful research is not proof that such a registered runtime allowlist already exists.

### Runtime fingerprint caveat, tested

The live retrieval computes `evidenceQuellenFingerprint(decodedText)`. That function normalizes CRLF and CR to LF; it is not unconditionally a raw-byte hash. Both in-ceiling API responses have no raw CR byte, no UTF-8 BOM, and a lossless fatal-UTF-8 round trip. Executing the actual function on both saved responses produced exactly their raw SHA-256 values. Thus the selected hash is compatible for these audited bytes. Future CR/BOM/normalization differences must fail closed or receive a separately reviewed contract decision; this audit does not change that code. Pretty-printing the selected JSON changed its hash and was explicitly rejected as a substitute for the recorded bytes.

## 3. Candidate comparison and one-source test

| Candidate content item | Explicit membership evidence in its own response | Eligibility and decision |
| --- | --- | --- |
| Staff guidance, `37cb84f5-6394-4459-9d16-32351d03d32c` | Section 2 names the UK, Ireland and the three dependencies; it also resolves the Channel Islands into the two Bailiwicks in that same body. | Both representations exceed the ceiling. Useful corroboration only; not selected and not needed to complete the selected set. |
| Public travel guidance, `a584ee02-15a9-423e-b632-675379d60fbc` | First paragraph after heading `the-common-travel-area` explicitly enumerates the UK, Ireland and the three individually named dependencies. | HTML too large; JSON 27,034 bytes fits. An independently sufficient alternate membership response, but not an extra support or an automatic fallback. |
| CTA guidance, `f841223e-d1ae-4a25-9783-bfa7b727ee11` | First paragraph directly names all five jurisdictions and explicitly uses the Bailiwick names for Jersey and Guernsey. | HTML too large; JSON 21,474 bytes fits. **Selected**, the smaller eligible response with the clearest territorial wording. |

For the selected response, deleting every other fetched document from the reasoning still leaves: the complete membership paragraph, publisher metadata, identity, exact bytes, and all three dependency names. It does not require a linked memorandum, another government's page, the staff guidance's explanation of smaller islands, or a general-knowledge expansion of a collective name. None of the linked documents was fetched for membership. No Irish or Crown Dependency site was needed.

The first paragraph's membership enumeration is complete as written; the following text concerns rights and personal eligibility. Reading the remainder of the selected body found no second, conflicting territorial enumeration. Those rights/eligibility statements are not outputs of this audit and are not converted into a country-based travel entitlement. Membership in this region does not imply that any traveller is exempt from an entry requirement.

## 4. Selected content identity and machine representation

Identity observed in the selected exact JSON:

| Field | Observed value |
| --- | --- |
| `content_id` | `f841223e-d1ae-4a25-9783-bfa7b727ee11` |
| `base_path` | `/government/publications/common-travel-area-guidance/common-travel-area-guidance` |
| `schema_name` / `document_type` | `html_publication` / `html_publication` |
| `title` | `Common Travel Area guidance` |
| `locale` / `phase` | `en` / `live` |
| `publishing_app` / `rendering_app` | `whitehall` / `frontend` |
| `withdrawn_notice` | Empty object |
| `public_updated_at` | `2026-01-01T00:01:08+00:00` |
| `updated_at` | `2026-09-09T14:59:34+01:00` |
| Primary publishing organisation | Cabinet Office, `96ae61d6-c2a1-48cb-8e67-da9d105ae381` |
| `links.organisations` | Cabinet Office and Home Office; Home Office id `06056197-bc69-4147-aa28-070bca132178` |

Official first-party evidence is the live response from `www.gov.uk` under its documented content endpoint, with government publishing metadata and the same membership paragraph in its official human rendering. The metadata is part of the fetched response; merely labelling an arbitrary URL official would not prove this. The full-response SHA identifies bytes, not authority by itself.

The machine envelope is **JSON containing HTML in `details.body`**. There is no structured membership array, ISO code field or publisher-supplied region record. JSON parsing alone cannot produce members. The observed HTML string starts with one `div.govspeak`, whose first direct `p` contains the entire operative enumeration. Its only inline element is the CTA abbreviation. That paragraph contains no link or external-content reference.

Measured fragments, deliberately separate from the full response hash:

| Fragment after JSON decoding, with no HTML/text normalization | UTF-8 bytes | SHA-256 |
| --- | ---: | --- |
| Exact `details.body` string | 14,567 | `6a9369620db00b670e035baf60b8023f399ef5a2720f25bc3694638bb37544fb` |
| First paragraph, including `<p>` and `</p>` | 309 | `b7c7ed572bf3c978da912cf002b80ec33fec1041e4cbb0b81f5a25f72e72f74f` |

The body contains one div, 46 paragraphs, 10 h2, two h3, two unordered lists, five list items and 22 abbreviations. Counts are diagnostic, not a membership proof. The selected first paragraph occurs exactly in the separately fetched HTML rendering. The full JSON, not either fragment, supplies the proposed `sourceContentHash`.

## 5. Exact code compatibility without membership inference

The mapping is a code-label mapping of five **explicit source names**, not a deduction that unnamed territories belong to the CTA. The source spells the UK abbreviation rather than the full United Kingdom name. Jetnity's existing country catalogue contains `GB`; its English display gives United Kingdom, and the same runtime's short English region display gives UK. No code named UK is substituted for GB.

Executed from this branch using the actual `landescodeLesen`, `istKatalogLand` and `landName` imports, with Node `v22.23.3`, ICU `78.3`, CLDR `48.0`:

| Exact source member token in the first paragraph | Proposed code | Actual parser result | Catalogue membership | Existing English display |
| --- | --- | --- | --- | --- |
| UK | `GB` | `GB` | true | United Kingdom; short display UK |
| Bailiwick of Guernsey | `GG` | `GG` | true | Guernsey |
| Ireland | `IE` | `IE` | true | Ireland |
| Isle of Man | `IM` | `IM` | true | Isle of Man |
| Bailiwick of Jersey | `JE` | `JE` | true | Jersey |

Every name above occurs once in the selected membership paragraph. The jurisdictional qualifier Bailiwick is retained in evidence; Jersey and Guernsey remain distinct catalogue entries. No constituent nation is added under GB, no smaller island is invented as a separate member, and no collective Channel Islands value is used. The exact sorted set has length five and no duplicates.

Important limitation: `landescodeLesen` trims, uppercases and checks `/^[A-Z]{2}$/`; it does **not** validate ISO assignment or establish legal membership. Executed controls showed `UK` and `XX` both pass its syntax while failing the country catalogue. `GB-ENG`, `GB-SCT`, `GB-WLS`, and `GB-NIR` return null and are absent from the catalogue. `CI` passes both syntax and catalogue, but Jetnity's English display identifies Côte d’Ivoire; it must never be invented as Channel Islands. These controls prevent overstating what parser success proves. No parser or catalogue change is required for the selected five codes.

The country catalogue/display are Jetnity encoding evidence, not a second legal membership source. A future version pins the explicit name-to-code mapping; it must not derive membership dynamically from localized labels or accept arbitrary two-letter strings.

## 6. One-source provenance and proposed drift rules

The current one-`sourceId`/one-`sourceContentHash` type is sufficient for this set: one selected response proves every member. No multi-source provenance extension is needed. The two other content ids are not folded into that source id. The human HTML view, API mechanism documentation and local code-label checks are not extra legal supports.

**Candidate naming pattern only:** `govuk_cta_<content_key>` (choose a reviewed lowercase content key within the existing 2–64-character source-id grammar). This is a placeholder pattern, not a concrete registered id. A future source identity must bind the selected content id, exact API URL and publisher. No source row exists because of this report.

A later implementation must freshly prove the source through the trusted boundary; research bytes cannot be its attestation. For a reviewed version of the pin, use these deterministic conditions:

1. Exact requested and final API URL; HTTPS port 443; no query, fragment or credentials. Require zero redirects for this pinned version. A redirect, even to another official path, stops for identity review rather than silently retargeting the pin. The generic five-redirect ceiling remains unchanged.
2. HTTP 200, observed normalized type `application/json`, no unhandled content encoding, nonempty bytes at most 65,536, fatal UTF-8 success and byte-preserving hash compatibility as described above. Never trim, pretty-print or hash parsed JSON in place of the response bytes.
3. Reject duplicate JSON keys; require the exact content id, base path, title, schema/document type, live phase, English locale and publisher identities above. Reject a withdrawal notice. Another content item, schema, language or publisher requires review.
4. Require `details.body` to be one HTML string. Pin its exact 14,567-byte UTF-8 fragment digest above, plus the first-paragraph structure, digest and explicit five-token mapping. Reject an array, a linked replacement, missing/duplicate paragraph or changed inline structure. Do not take text from search, metadata descriptions or a linked page.
5. Pinning all of `details.body`, rather than only its first paragraph, also rejects a contradictory/additional membership statement appended elsewhere. It is a conservative content-fragment pin: unrelated rights-text edits may force review, but response-envelope metadata/chrome is not made semantic membership authority. The whole HTTP response is not required to stay byte-identical for semantic review. A changed full-response hash still requires an explicit re-proven provenance refresh; it must never be silently ignored or overwritten in an existing approved pin.
6. Exact member cardinality five; exact unique sorted codes as above. No inferred additions/removals, no UK subdivision, no Channel Islands expansion, no first-match or deduplication that masks duplicate member text. Rename, ambiguity, removal, addition or moved content fails closed.
7. Source identity or operative-content drift leaves the current version unapproved for new registration/refresh. A reviewed new pin version must be selected explicitly. The existing evaluator only reads its code-owned list; it does not currently re-fetch or enforce these future verification rules. This audit supplies the requirements, not an implemented freshness service or automatic drift monitor.

Eight offline mutations of the body changed the proposed fragment digest: removal, addition, collective shorthand, replacing membership with a link, a repeated member, a repeated membership paragraph, a contradictory addition outside the introduction, and a structure change. These are sensitivity checks of the proposed guard, not tests of a new production parser or extractor.

## 7. Smallest next bounded implementation, conditional on Technical-Lead review

The next candidate is **Common Travel Area code-owned region-pin registration 1**. Its exact functional goal would be a single reviewed version-1 `common_travel_area` pin with `['GB', 'GG', 'IE', 'IM', 'JE']`, one approved source identity and the freshly server-reproved response hash, with focused region-evaluator and source-pin drift checks. Ownership should be limited to `regulierungs-anwendbarkeit.ts`, its tests, and a narrowly owned source-pin verification fixture/helper only if the Technical Lead explicitly includes it. There is no need to widen the region vocabulary or multi-source type.

Before registration, that separately dispatched task must establish the selected item's real server-held source identity and retrieval authority. If no appropriate approved source identity exists, it must stop at that prerequisite; a placeholder cannot be registered as if it were a real catalogue identity. A database/catalogue apply is not implicitly part of this proposal and Production apply retains its own gate. The present source proof does not attest catalogue availability.

That later slice must retain absent-origin handling and test membership for all five codes plus a nonmember without calling Rule acceptance. It must implement or explicitly satisfy the proposed verification boundary before claiming drift protection. It must not bundle an ETA outcome, fact extractor, composition policy, acceptance/store/F8, schema-1 persistence, provider activation or Production apply. The Technical Lead must freshly precheck and dispatch it; this writer does not start it.

## 8. Audit boundary and classification

No `lib`, runtime, test, package/config, source catalogue or database file changed. No real sourceId, region pin, extractor or composition policy was registered. No `regelKandidatAkzeptieren` call, accepted Evidence/Rule store, F8, Supabase/Auth/RLS, paid API/provider, Production Official Truth apply, CH import/CH-11, #626 or launch/indexing work occurred. Raw official responses and audit scripts remain local research scratch outside the repository; no raw-page retention/store policy is created by these four documents.

Independent exact-head review remains necessary. The author self-review is not Technical-Lead PASS. Draft remains Draft; no Ready, merge or follow-up slice.

CTA_REGION_PIN_SOURCE_PROVEN
