# Official Truth Deterministic Source-Family Selection 2

Date: 3 October 2026
Status: **docs-only source-family audit / Draft PR #789 / no extractor / no acceptance**
Issue: #788
Draft PR: #789
Branch: `docs/official-truth-source-family-selection-2`
Baseline: `main@e5723eac239a0227148e250c97eb6be20f44b36d`
Task: `docs/OFFICIAL_TRUTH_SOURCE_FAMILY_SELECTION_2_TASK_2026-10-03.md`
Logical agent: **Jetnity Official Truth deterministic source-family selection 2**, Generation 1
Session: https://cursor.com/agents/bc-a0a5897c-bffa-41bd-8886-3b80b85f1673
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

Selection result: **`NO_SOURCE_FAMILY_PROVEN_YET`**

That result means no source family is proven compatible with Jetnity's current deterministic fact and retrieval contract for `passport_validity` or `blank_passport_pages`. It does not mean the government pages are unreliable.

No source family id, extractor id, source id, schema family, URL allowlist, or Rule fact is proposed. The production extractor registry stays empty. This audit does not make Candidate Evidence into Official Truth.

## 1. What was tested

The question is whether one current official government source family can feed a later single-source deterministic extractor for one complete passport-validity fact or one complete blank-page fact. The extractor would have to emit one complete `RegelFakt` from server-owned response bytes, with every applicability condition explicit in that response and representable on the decoded regulatory scope.

Live code on this baseline wins over older architecture wording, including the selection-1 note that the extractor received only an opaque `scopeKey`:

- `OFFICIAL_TRUTH_TRUSTED_FACT_EXTRACTOR_REGISTRY` in `lib/readiness/official-truth-trusted-fact-extractor-registry.ts` is `Object.freeze([])`.
- `OfficialTruthExtractorKontext` carries `factKind`, `requirementType`, `scopeKey`, and `scope`. `scope` is the source-neutral `RegelScope`.
- `loadOfficialTruthSameRequestTrustedFactExtraction` accepts only `explicit_primary_statement`. `composed_from_multiple_primary_sources` stops as `composition_policy_unavailable` before HTTP.
- The same-request path re-reads the proof cell with `regelScopeAusEvidenceScope`, requires the recomputed key to equal `proof.ruleScopeKey`, and passes that canonical cell into the extractor. It does not read a caller `scope` on the research envelope.
- `passport_validity` must use `requirementType: 'passport_validity'`. `blank_passport_pages` must use `requirementType: 'blank_passport_pages'`.
- `PASS_SEMANTIK` is `valid_on_entry`, `valid_through_stay`, `minimum_remaining_from_entry`, `minimum_remaining_from_planned_departure`, `minimum_remaining_at_application`, and `expired_document_exception`. `valid_on_entry` and `valid_through_stay` require `duration: null`. The other semantics require `{ value, unit }` with unit `days`, `months`, or `years`.
- `blank_passport_pages` stores only `minimumPages`, an integer from 1 to 10.
- `credentialOption.documentType` on the decoded scope is `passport`, `national_id`, or `unknown`. The research literal `ordinary_passport` is not a member of that enum. A cell that sends `ordinary_passport` fails as `invalid_scope` before a matcher runs.
- A path allowlist matches only a queryless exact host and path. A query-bearing URL needs an exact canonical URL rule.
- `medientyp` compares the media type without parameters. `text/html; charset=utf-8` and `text/html;charset=ISO-8859-1` are both the type `text/html`.
- `BODY_MAX` in `lib/readiness/official-truth-server-owned-retrieval.ts` is `65_536`. A `Content-Length` above that, or a streamed body that passes that size, fails closed as `response_too_large`. A status outside 200–299 fails as `http_status`. Those bytes never become extractor input. This audit does not propose raising that ceiling.

The CH cell under test is the closed research scope from Issue #294 comments `5935531376` and `5935581800`: citizenship `CH`, document type `ordinary_passport`. India is a CH-02 destination. Saudi Arabia is a CH-04 destination. The United Arab Emirates is a CH-01 destination. Those batches remain `RESEARCH_ONLY` and `NOT_APPROVED_FOR_DATABASE_IMPORT`.

## 2. Retrieval

Checked 2026-10-03T10:00:28Z through 2026-10-03T10:03:24Z. Each request used HTTPS. The first pass sent `Accept-Encoding: identity`, `Cache-Control: no-cache`, and a research user agent. The later Saudi and UAE reads that the tables mark as node-like sent only the two fixed headers the live retrieval client sends: `accept-encoding: identity` and `cache-control: no-cache`. A browser-like Saudi retry is recorded separately. None of these calls is Jetnity production retrieval. There was no source catalog, no DNS pin, no Evidence row, and no `evidenceQuellenFingerprint`.

The SHA-256 values are hashes of the raw response bodies saved in this session. A body this session could save can still be `response_too_large` or `http_status` on the production boundary.

| Source | Requested URL | Effective URL | Status | Media type | Bytes | SHA-256 |
| --- | --- | --- | --- | --- | --- | --- |
| India e-Visa, research UA | `https://indianvisaonline.gov.in/evisa/tvoa.html` | same, 0 redirects | 200 | `text/html;charset=ISO-8859-1` | 192454 | `135158d346aaef7ad6cbbc5c6cd7828ebbca419b05a8122fa067c791b0079523` |
| India visa stub, research UA | `https://indianvisaonline.gov.in/visa/tvoa.html` | same, 0 HTTP redirects | 200 | `text/html;charset=ISO-8859-1` | 325 | `eb9a30a07e5e9430aea430753e284593baac07fcf7e36b0e909ea2240955ccbd` |
| Saudi terms, research UA | `https://visa.visitsaudi.com/Home/TermsConditions` | same | 403 | `text/html; charset=UTF-8` | 257009 | `eb5b1b6ebca2ef375950f90ce53b53ee170aee02c9e6e08460a6feafb032bf60` |
| Saudi terms, node-like | same | same | 403 | `text/html; charset=UTF-8` | 257009 | `f1e9ac018ca7d8bc02f4bc94d4b04c2351a516309d73fb69e4eb7b440ef6dad7` |
| Saudi terms, browser-like | same | same | 403 | `text/html; charset=UTF-8` | 257009 | `4336a27d278148d6462d19000aedff55905077459b1dedcd33a04a7db7b083c5` |
| Saudi home, node-like | `https://visa.visitsaudi.com/` | same | 403 | `text/html; charset=UTF-8` | 257009 | `aa56dc65ba70ee35a6847211342a537ad663e7227bd14188506a0b1425540e15` |
| ICP home, research UA | `https://icp.gov.ae/` | same | 200 | `text/html; charset=UTF-8` | 684872 | `56f3b51ed2bed95d8302314299858f8540980e2f33326191b79c90bf021bc255` |
| ICP English home, node-like | `https://icp.gov.ae/en/` | same | 200 | `text/html; charset=UTF-8` | 671486 | `e1a0c792642e7451f0e29bb46fe3d3a3e83b51c62af852d4fc63bc5c43406978` |
| ICP visa service, node-like | `https://icp.gov.ae/services-details?serviceid=64afe3c1035448005bd52e60` | `https://icp.gov.ae/services-details/?serviceid=64afe3c1035448005bd52e60` after one 301 | 200 | `text/html; charset=UTF-8` | 627025 | `90a54923ba2e9c4d7dd33a93601765482fea93908ab0226dee3e4035a69e1836` |
| ICP English visa service, node-like | `https://icp.gov.ae/en/services-details?serviceid=64afe3c1035448005bd52e60` | `https://icp.gov.ae/en/services-details/?serviceid=64afe3c1035448005bd52e60` after one 301 | 200 | `text/html; charset=UTF-8` | 616726 | `7818fa1ea08086252dd4a4ab1f9a224b5af7bfc895e793a397f960e0d03da265` |

Every saved body decoded as fatal UTF-8. The India bodies are ASCII: zero bytes above 127. The HTTP charset `ISO-8859-1` does not change that byte check. The live media-type comparison would still see `text/html`.

No effective URL carried `utm_*`, `gclid`, `dclid`, `fbclid`, `msclkid`, `gbraid`, `wbraid`, `mc_cid`, or `mc_eid`. The ICP `serviceid` query is an application identifier. It is not a tracking parameter. A path allowlist would still reject it because the query is non-empty.

Measured raw sizes against `BODY_MAX` 65,536:

| Source | Raw bytes | Against the current ceiling |
| --- | --- | --- |
| India e-Visa page | 192,454 | Over the ceiling. `Content-Length` was absent, so a stream fails as `response_too_large`. |
| India visa stub | 325 | Within the ceiling. The body is a script location assignment, not the rule. |
| Saudi terms and home, every attempt | 257,009 | HTTP 403, so the live path fails as `http_status`. The interstitial is also over the ceiling. |
| ICP home | 684,872 | `Content-Length` is over the ceiling. Fails as `response_too_large` before the body is kept. |
| ICP English home | 671,486 | Same header failure. |
| ICP visa service | 627,025 | Over the ceiling. The 301 hop is 3 bytes. The 200 body has no `Content-Length` and fails while streaming. |
| ICP English visa service | 616,726 | Same streaming failure. |

No fourth CH-01..CH-10 family was opened. None of these three was close enough, on size and on a complete fact together, that another destination was clearly stronger.

## 3. Comparison

| Criterion | India e-Visa page | Saudi terms URL | ICP visa issuance page |
| --- | --- | --- | --- |
| Publisher on the bytes received | Masthead states Government of India. Footer links name Ministry of Home Affairs, Ministry of External Affairs, Ministry of Tourism, and the Bureau of Immigration. | The 403 interstitial shows a Ministry of Tourism logo and says the page is not accessible from an external network. The terms document was not served. | English home title names the Federal Authority for Identity, Citizenship, Customs & Port Security. The service page is that authority's "Issuance of a Visa" service. |
| Canonical identity | No `rel=canonical`. Identity is the fetched e-Visa URL. | No terms document, so no canonical rule URL was established. | Arabic final URL matches its `rel=canonical`. The English page's `rel=canonical` is the Arabic URL, a different path. |
| Representation | One HTML document. Eligibility is a modal of repeated `div.country-item` records. The validity and blank-page sentences are later prose and an FAQ text run. | Access interstitial. Title `MT :: Attention`. Three fetches, three hashes, same size. | One HTML service page. Category chooser, then one Terms heading whose text concatenates conditions for more than one category. |
| Current trusted retrieval | 192,454 bytes. Over `BODY_MAX`. | HTTP 403 and 257,009 bytes. | 627,025 bytes on the Arabic final URL. Over `BODY_MAX`. |
| Positive CH membership | Switzerland is record 153. The record text is `Switzerland`. | Switzerland does not appear in the interstitial. | Switzerland does not appear. |
| Passport-validity anchor in the bytes | One prose sentence says at least six months validity at the time of making the e-Visa application. FAQ Q1 says the same application anchor and adds a re-entry permit when the nationality's law requires one. | No six-month sentence and no entry anchor. | English terms say "Passport valid for no less than 6 months." No entry, application, departure, or stay-through anchor. |
| Blank pages | One FAQ sentence says at least two blank pages for stamping. | Absent. | Absent. |
| Complete fact | No. See section 4. | No. See section 5. | No. See section 6. |
| Same-response membership and value | The country record and the two validity wordings are in one HTML body. They are not one record. | Neither membership nor the value was served. | The duration sentence is in the terms block. The CH cell is not a field on that block. |
| CH ordinary-passport cell | The modal predicate is a passport from a listed country or region. FAQ Q1's predicate is nationals of the listed countries. Diplomatic and official passport holders are excluded in prose. The decoded scope cannot store that passport class. | Unproven. The research cell was not positively named. | The service describes entry permits for tourism, visit, treatment, work residence, and family residence. It does not name a Swiss ordinary passport. |

## 4. India

Target facts under test, checked separately:

`requirementType: 'passport_validity'`

`{ kind: 'passport_validity', semantics: 'minimum_remaining_at_application', duration: { value: 6, unit: 'months' } }`

`requirementType: 'blank_passport_pages'`

`{ kind: 'blank_passport_pages', minimumPages: 2 }`

Source semantics on the current e-Visa page, read as statements rather than as a Jetnity fact:

- The eligibility modal heading says that a person who holds a valid passport from any of the listed countries or regions is eligible for eVisa.
- The list is 175 `div.country-item` nodes. Each visible record is `div.country-name` with `span.number` and a name. Switzerland is `153.` and `Switzerland`. The record has no parenthetical qualifier.
- A later prose paragraph lists visit purposes, including recreation, short courses, voluntary work, medical treatment, business, and conferences, and then says the applicant's passport should have at least six months validity at the time of making the application for grant of e-Visa.
- The same prose says the e-Visa is not available to diplomatic or official passport holders, or to laissez-passer travel document holders.
- FAQ Q1 states eligibility as one text run. Clause i says nationals of the countries listed on the e-Visa website. Clause ii limits the sole objective of the visit to a purpose list. Clause iii says the passport should have at least six months validity at the time of making the application and a re-entry permit if the law of the country of nationality requires one. The next sentence says the passport should have at least two blank pages for stamping by the Immigration Officer. Clause vi repeats the diplomatic and official exclusion.
- `https://indianvisaonline.gov.in/visa/tvoa.html` is 325 bytes. Its script sets `window.location` to the e-Visa URL. The live retrieval client does not execute that script. The stub contains neither Switzerland nor a validity sentence.
- Same-host links on the e-Visa page point at stylesheets, application flows, fee PDFs, and a sample form. None is a smaller HTML document of this rule. The page also names `https://boi.gov.in`. That host was not fetched. It would be a second source.

Architecture conclusion:

The application-time wording is real, and the number two is real. Neither sentence is a complete fact for the seeded cell under the current contract.

The page is 192,454 bytes. The current server-owned retrieval fails it as `response_too_large` before an extractor runs. The 325-byte stub is inside the ceiling and is not the rule. This slice does not raise `BODY_MAX` and does not treat the script location as an HTTP redirect to a registered source.

The two validity sentences are not the same statement. The FAQ sentence adds a re-entry-permit condition. Emitting only the six-month application duration would drop that condition. A parser that searches the page for "six months" would be a generic prose regex. The task forbids that.

The blank-page sentence states the number two. It sits in the same FAQ answer as the purpose list, the re-entry-permit clause, and the return-ticket clause. Those conditions are roman numerals inside one text run, not separate elements. `blank_passport_pages` can store `minimumPages` and cannot store the e-Visa purpose list. Dropping that list would make the page requirement apply to a trip whose purpose the page does not cover. Trip purpose is not a decoded-scope field. The rule is therefore not independent of a condition the scope cannot represent.

The modal and the FAQ also use different predicates. The modal speaks of passports from listed countries. The FAQ speaks of nationals. Switzerland's record does not say which one it is. Matching `issuingCountryCode` would ignore the nationality sentence. Matching `citizenship.countryCodes` would ignore the passport-from sentence and would infer citizenship from the issuer record. The research seed states citizenship `CH` and `ordinary_passport`. It does not state an issuing country. Copying `CH` into `issuingCountryCode` would infer the issuer from citizenship.

The decoded document type cannot carry the diplomatic exclusion. `ordinary_passport` is the research literal and is rejected by `regelScopeAusEvidenceScope`. `passport` is the decoded value and includes diplomatic and official passports, which this page excludes. Selecting `passport` would broaden the page. Selecting `ordinary_passport` would invent a scope value the live parser refuses.

The country list is a stable repeated record and could be pinned by element, class, and exact name. The validity value and the blank-page value are not fields on that record. Joining record 153 to the FAQ sentence is heuristic grouping across two regions of the page. A change to the number span, the name text, either validity sentence, or the diplomatic sentence would change the legal reading. A fail-closed parser can reject those changes. It cannot emit one complete fact from the current bytes without dropping a qualifier.

Result of the India check: neither fact is the first extractor fact.

## 5. Saudi Arabia

Target fact under test, only if the current bytes state an entry anchor:

`{ kind: 'passport_validity', semantics: 'minimum_remaining_from_entry', duration: { value: 6, unit: 'months' } }`

What the current responses contain:

- Node-like, research, and browser-like GET requests to `https://visa.visitsaudi.com/Home/TermsConditions` each returned HTTP 403 and 257,009 bytes of an interstitial titled `MT :: Attention`.
- The same interstitial, at the same size and a different hash, was returned for `https://visa.visitsaudi.com/`.
- The interstitial includes a Ministry of Tourism logo and says the page is not accessible from an external network and must be opened from the internal ministry network.
- The interstitial does not contain Switzerland, a passport-validity sentence, a month duration, or the terms.

Architecture conclusion:

State authority for a tourist eVisa rule was not established from a terms document. A logo on an access block is not the permitted-passport list and is not a six-month entry sentence. This audit does not fill those statements from memory.

The live retrieval path would stop at `http_status` for 403. The interstitial is also larger than 65,536 bytes, and its hash changed across three reads in the same window, so it is not a stable snapshot. No Switzerland membership and no entry anchor can be read from these bytes. `minimum_remaining_from_entry` is not assigned.

Result of the Saudi check: the terms family is not currently retrievable as a public official response, and it is not the first extractor family.

## 6. United Arab Emirates

Pages read:

- `https://icp.gov.ae/` and `https://icp.gov.ae/en/` are the authority home pages. They do not name Switzerland and they do not state a visitor passport-validity rule. The English home uses "six months" for Emirates ID expiry of non-UAE nationals, and "6 months" for a permit to stay outside the country. Those are different services.
- The home page links "Issuance of a Visa" to service id `64afe3c1035448005bd52e60`. That is the visitor/tourist/visa service page evaluated here. The Arabic and English finals differ by the `/en/` prefix. The English `rel=canonical` points at the Arabic URL.

Target fact under test, only if an existing semantics matches the sentence:

`{ kind: 'passport_validity', semantics: <existing anchor only>, duration: { value: 6, unit: 'months' } }`

Source semantics on the current service page:

- The about-this-service text says the service issues an entry permit for a specific period, for tourism, a visit, treatment, or to complete work residence or family residence.
- A category instruction tells the reader to choose a category. The categories include a visitor seeing relatives or friends, a visitor residence visa without employment, tourism establishments issuing tourism visit visas, licensed healthcare facilities, employers, and educational institutions.
- The terms heading then presents one text block. Its English wording includes "Passport valid for no less than 6 months" beside health insurance, a return ticket, a financial guarantee, a labour-approval condition, and a sixty-day stay for completing residence. The Arabic canonical page has the corresponding passport sentence in the same terms block.
- The service metadata says the service requires sign-in with UAE Pass.
- Switzerland is absent. Ordinary, diplomatic, and official passport classes are not named on this rule.

Architecture conclusion:

The duration value six months is explicit. The anchor is not. `valid_on_entry` and `valid_through_stay` cannot carry a duration. `minimum_remaining_from_entry`, `minimum_remaining_from_planned_departure`, and `minimum_remaining_at_application` each require the page to name that moment. This sentence does not. Assigning one of them would invent the anchor.

The page does not positively place a Swiss ordinary passport inside the service. The service is a generic issuance flow whose categories include sponsor and residence paths. Absence of an exclusion for Switzerland is not membership. A CH ordinary-passport visitor is not shown to be on this path.

The terms block is concatenated prose for more than one category. There is no element that binds the six-month sentence to one category and to Switzerland. Splitting that block by category would be heuristic grouping.

Both finals are over 65,536 bytes. The query requires an exact URL rule if a later page of this shape were eligible. This page is not eligible. The home pages are larger and are not the rule.

Result of the UAE check: the ICP visa service page is not the first extractor family.

## 7. Selection

**`NO_SOURCE_FAMILY_PROVEN_YET`**

No source family is proven compatible with Jetnity's current deterministic fact and retrieval contract. The India and ICP pages were readable in this research fetch. That fetch is not the trusted retrieval path. The Saudi terms were not readable from an external network.

No family met a fail-closed structure, a positive complete `RegelFakt` for the CH ordinary-passport cell, and the current retrieval limit together. India is over the ceiling, splits issuer and nationality, excludes diplomatic and official passports, and ties the six-month and two-page sentences to e-Visa purpose prose. Saudi did not serve the terms. The ICP sentence has no anchor the live semantics can store, and it does not name Switzerland. The fields required on a selection are therefore not filled: source family id, extractor id, extractor version, source id, URL allowlist, schema family, evidence quality, and expected fact shape.

CH-01..CH-10 stay `RESEARCH_ONLY` and `NOT_APPROVED_FOR_DATABASE_IMPORT`. No batch was imported. CH-11 was not started. The 64 destinations were not re-researched.

## 8. Traveller context

This audit uses one research cell: citizenship `CH`, document type `ordinary_passport`, and the destination named by each source. India, Saudi Arabia, and the United Arab Emirates are the destinations those batches already seeded. A second citizenship or a second travel document is another cell. The full citizenship set would have to match together. This audit does not choose one code from a multi-citizenship set.

The decoded scope keeps issuing country on the credential option. This audit does not copy the country name Switzerland into citizenship, and it does not copy citizenship `CH` into the issuing country. `ordinary_passport` stays the research literal. It is not rewritten to `passport`. Residence was not used to narrow a rule the pages did not state. No passport number, MRZ, scan, or health record was collected. Route Truth stays traveller-neutral because this audit writes no route.

## 9. What remains true after this audit

The human fact-entry path remains the only authorized way to supply `trustedRuleFact`. A later source family still has to arrive as server-owned bytes, match one registry row, and return one complete fact or a fail-closed reason. `regelKandidatAkzeptieren` remains the acceptance function. F8, a route, a store write, and a real extractor registration are not authorized by this result.

Three contract gaps are visible and are not fixed here:

- A page that excludes diplomatic or official passports cannot be matched with decoded `documentType: 'passport'`, and it cannot be matched with the research literal `ordinary_passport`, because that literal is not a `RegelScope` document type. A later credential-class decision has to come before an extractor for that kind of page. This audit does not add the class.
- A sentence that says a passport is valid for six months, without naming entry, application, planned departure, or the stay, has no current `passport_validity` semantics. This audit does not add a semantics.
- India and the ICP service page need a smaller official representation, or a separate reviewed retrieval-policy change, before either body can reach an extractor. This audit does not raise `BODY_MAX`. The Saudi terms URL, as served to an external network in this window, is an access interstitial rather than the rule.

This document does not name the next source and does not start that slice.
