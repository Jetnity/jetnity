# Official Truth First Deterministic Source-Family Selection 1

Date: 3 October 2026
Status: **docs-only source-family audit / Draft PR #785 / no extractor / no acceptance**
Issue: #784
Draft PR: #785
Branch: `docs/official-truth-first-source-family-selection-1`
Baseline: `main@d91be5af020c41b935ea0eb0c90e5ec19b57babe`
Task: `docs/OFFICIAL_TRUTH_FIRST_SOURCE_FAMILY_SELECTION_1_TASK_2026-10-03.md`
Logical agent: **Jetnity Official Truth first deterministic source-family selection 1**, Generation 1
Session: https://cursor.com/agents/bc-54a267e6-4407-4557-83d9-6fbcb8814f25
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

Selection result: **`NO_SOURCE_FAMILY_PROVEN_YET`**

That result means no source family is proven compatible with Jetnity's current deterministic fact and retrieval contract. It does not mean the government pages are unreliable.

No source family id, extractor id, source id, schema family, URL allowlist, or Rule fact is proposed. The production extractor registry stays empty. This audit does not make Candidate Evidence into Official Truth.

Technical-Lead review of `42c74252cb0fe21f25fca0e5800b98db9bea6fb7` is CHANGES REQUIRED, findings R1 and R2. This correction adds the live retrieval-size ceiling and the live extractor input contract. The task file stays unchanged. The selection result stays `NO_SOURCE_FAMILY_PROVEN_YET`. This correction still implements no fetch and does not raise the ceiling.

## 1. What was tested

The question is whether one current official government source family can feed a later single-source deterministic extractor. The extractor would have to emit one complete `RegelFakt` from server-owned response bytes, with every field explicit in that response.

Live code on this baseline wins over older architecture wording:

- `OFFICIAL_TRUTH_TRUSTED_FACT_EXTRACTOR_REGISTRY` in `lib/readiness/official-truth-trusted-fact-extractor-registry.ts` is `Object.freeze([])`.
- `loadOfficialTruthSameRequestTrustedFactExtraction` accepts only `explicit_primary_statement`. `composed_from_multiple_primary_sources` stops as `composition_policy_unavailable` before HTTP.
- A non-visa `requirement_effect` must carry `visaMode: null` (`wirkungLesen` in `lib/readiness/rule-claims.ts`).
- On a visa cell, `visaResultUndModusWidersprechen` in `lib/readiness/official.ts` rejects `required` with `visa_exempt`, and rejects `not_required` with `visa_on_arrival`, `electronic_visa`, or `visa_before_travel`.
- A path allowlist matches only a queryless exact host and path. A query-bearing URL needs an exact canonical URL rule.
- `medientyp` compares the media type without parameters. `text/html; charset=utf-8` is the type `text/html`.
- `BODY_MAX` in `lib/readiness/official-truth-server-owned-retrieval.ts` is `65_536`. A `Content-Length` above that, or a streamed body that passes that size, fails closed as `response_too_large`. Those bytes never become extractor input. This audit does not propose raising that ceiling.
- The extractor input keys are exactly `factKind`, `requirementType`, `scopeKey`, `evidenceQuality`, `supports`, `policy`, and `registry`. `scopeKey` must match `rule-scope:v1:` plus 64 hex characters. The same-request binding passes `beweis.ruleScopeKey` and does not pass the decoded scope or a `travelDate`. `OfficialTruthExtractorKontext` has the same `scopeKey` string and no decoded scope.

The CH cell under test is the closed research scope from Issue #294 comments `5935531376` and `5935581800`: citizenship `CH`, document type `ordinary_passport`. NZ is a CH-02 destination. GB and SG are CH-01 destinations. Those batches remain `RESEARCH_ONLY` and `NOT_APPROVED_FOR_DATABASE_IMPORT`.

## 2. Retrieval

Checked 2026-10-03T08:58:45Z through 2026-10-03T08:58:53Z. Each request used HTTPS, followed redirects, and ended on HTTP 200 with zero redirects. The effective URL equalled the requested URL. None of the effective URLs had a query, a fragment, or a tracking parameter.

The SHA-256 values below are hashes of the raw response bodies saved in this session. They are not `evidenceQuellenFingerprint` values, not Evidence rows, and not a server-owned retrieval attestation. This session's direct research fetch is not Jetnity's production retrieval boundary. A body this session could save can still be `response_too_large` on that boundary.

| Source | Effective URL | Media type | Bytes | SHA-256 |
| --- | --- | --- | --- | --- |
| INZ visa-waiver page | `https://www.immigration.govt.nz/visit/what-you-need-to-visit-new-zealand/visa-waiver-countries-and-territories/` | `text/html; charset=utf-8` | 681132 | `15ccf1906feca02bce73bc5e6aed9e4c3d0e6c77e6990ab69c1492b1809306df` |
| INZ ops manual E2.1 | `https://www.immigration.govt.nz/opsmanual/88262.htm` | `text/html` | 12725 | `a5328ef10c72728eb58de1f0cacdb2b6e9d72fbb0f14e425c105254d0cc5238c` |
| INZ NZeTA page | `https://www.immigration.govt.nz/visas/new-zealand-electronic-travel-authority-nzeta/` | `text/html; charset=utf-8` | 881465 | `b1663a07494ef9090be70927fbff88429384696a3831136a7faee9dc54f604f3` |
| GOV.UK ETA National List | `https://www.gov.uk/guidance/immigration-rules/immigration-rules-appendix-eta-national-list` | `text/html; charset=utf-8` | 62422 | `9dafb6634edccf6bff3fb888cc950929faa4e10af0836d2288a5e4eee295b406` |
| GOV.UK Swiss/EU visit guidance | `https://www.gov.uk/guidance/visiting-the-uk-as-an-eu-eea-or-swiss-citizen` | `text/html; charset=utf-8` | 123275 | `622029dd2cb0d0b27e69db99cfa82a78da329b36d67bed52c58ef6ab33f69561` |
| GOV.UK Content API docs | `https://content-api.publishing.service.gov.uk/` | `text/html; charset=utf-8` | 22024 | `f40b4494fd36ab02869c4e15ea4c88a00c089ac16186d1f2ef1c8672987c9cf4` |
| GOV.UK Content API, ETA list | `https://www.gov.uk/api/content/guidance/immigration-rules/immigration-rules-appendix-eta-national-list` | `application/json; charset=utf-8` | 7788 | `59a7fd6e7416f989ace351bc5ab4f562c52b3c5cab64fcbe861ea4a57ced1854` |
| GOV.UK Content API, visit guidance | `https://www.gov.uk/api/content/guidance/visiting-the-uk-as-an-eu-eea-or-swiss-citizen` | `application/json; charset=utf-8` | 43447 | `7d53e8fa3f0c2bd82555d9956e25d3baa54e393139d94b2a270a2fa1b1157b8a` |
| ICA visa requirements | `https://www.ica.gov.sg/enter-transit-depart/entering-singapore/visa_requirements` | `text/html; charset=utf-8` | 37258 | `b7745038af5891904541f5ca6ab5bfdb41014a0b70b2b88ffa71ca81dcbe304b` |
| ICA entering Singapore | `https://www.ica.gov.sg/enter-transit-depart/entering-singapore` | `text/html; charset=utf-8` | 36861 | `55d033340ffabe6b19e32900a5da3bf1b01ac3d1f0904c03387a6ac9010ecfda` |

The current trusted ceiling is 65,536 bytes. Measured raw sizes against that ceiling:

| Source | Raw bytes | Against `BODY_MAX` 65,536 |
| --- | --- | --- |
| INZ visa-waiver page | 681,132 | Over the ceiling. Not eligible for the current trusted retrieval path. |
| INZ NZeTA page | 881,465 | Over the ceiling. Not eligible for the current trusted retrieval path. |
| GOV.UK Swiss/EU visit guidance | 123,275 | Over the ceiling. |
| INZ ops manual E2.1 | 12,725 | Within the ceiling. Still not current. |
| GOV.UK ETA National List HTML | 62,422 | Within the ceiling. Still blocked by the date contract in section 5. |
| GOV.UK Content API, ETA list | 7,788 | Within the ceiling. The body is still the same HTML rule. |
| GOV.UK Content API, visit guidance | 43,447 | Within the ceiling. Still multi-topic prose. |
| ICA visa requirements | 37,258 | Within the ceiling. Still no positive Swiss fact. |
| ICA entering Singapore | 36,861 | Within the ceiling. Still no positive Swiss fact. |
| Content API documentation | 22,024 | Within the ceiling. Documentation, not a rule. |

A follow-up read in the same session opened the URL named by the NZeTA page's canonical link, `https://www.immigration.govt.nz/visas/`. That response is a different document titled as the visas index. It is not the NZeTA rule page. No additional CH destination family was opened. The task allows that only when one family is clearly superior, and it forbids redoing the 64 destinations.

## 3. Comparison

| Criterion | INZ visa-waiver page | GOV.UK ETA National List | ICA visa requirements |
| --- | --- | --- | --- |
| Publisher | Immigration New Zealand | Home Office, on GOV.UK. Content API `schema_name` is `manual_section`. Public update meta `2026-03-05T15:03:24+00:00`. Machine update meta `2026-08-03T11:12:11+01:00`. | Immigration & Checkpoints Authority |
| Canonical identity | `rel=canonical` matches the fetched URL | No `rel=canonical` in the HTML. Content API `base_path` is the same path. | `og:url` is empty. Identity is the fetched URL, which returned the titled visa page. |
| Representation | HTML. One `h2` and one `ul` of 60 `li` names, plus summary and later prose sections. No JSON-LD. | HTML legislative list, and the same HTML inside Content API `details.body`. The JSON object has no nationality array. | HTML. A link list under a countries-and-places heading, plus separate document bullets. No visa JSON API in the body. |
| Current trusted retrieval size | 681,132 bytes. Over `BODY_MAX` 65,536. The current server-owned retrieval fails this page as `response_too_large` before an extractor runs. | HTML page 62,422 bytes, within the ceiling. Content API JSON 7,788 bytes, within the ceiling. Size does not repair the date contract. | 37,258 bytes, within the ceiling. Size does not create a Swiss fact. |
| Positive assertion for the CH cell | Switzerland is one `li` whose text is `Switzerland`. The same page also states a visa consequence and an NZeTA consequence. | Switzerland is one `li` whose text is `Switzerland`, inside the nationality list that the introductory sentence subjects to an ETA. | Switzerland does not appear. The page states the visa consequence only for travel documents issued by the listed places. |
| Target requirement type | The page speaks about a visitor visa and about an NZeTA. Those are `visa` and `electronic_travel_authorization`. One extractor id can carry only one fact kind and one requirement type. | `electronic_travel_authorization` | `visa`, and only for listed issuers |
| Target fact kind | `requirement_effect` is the only kind the page could aim at. Duration and character conditions are separate kinds and are not complete here. | `requirement_effect` | `requirement_effect` |
| Complete fact, no legal default | No. See section 4. | No. See section 5. | No complete CH fact. See section 6. |
| One source enough | The waiver page contains both the list and the consequence sentences. The ops manual and the NZeTA page were not composed with it. | The Content API repeats the HTML. It is the same source rendered two ways, not a second legal source. The visit-guidance page was not composed with the list. | The entering-Singapore page repeats the visa-required rule and does not add a Swiss exemption. It was not composed with the list. |
| CH ordinary-passport cell | The summary predicate is a passport from a listed country. The cell is citizenship `CH` plus `ordinary_passport`. The `li` text does not state either of those two fields. The page also cannot reach the extractor: 681,132 bytes. | The rule predicate is nationality. The cell's document type is not stated for Switzerland. The 2 April 2025 travel-date group cannot be checked: the extractor receives only an opaque `scopeKey`, not a decoded travel date. | No positive Swiss statement. The page is within the byte ceiling. |
| Drift a parser would have to pin | Exact `h1`, exact summary sentence, exact `h2`, exact `li` text, and the later on-arrival sentence. Any one of those moving changes the legal reading. | Exact introductory sentence, exact `li` text, and the group date that is currently inside a different `li`. | Exact lead sentence and exact link text. A missing Swiss link is not a field. |
| Allowlist shape if it were eligible | Queryless path rule for host `www.immigration.govt.nz` and the waiver path. | Exact URL, or queryless path, for the guidance path. The API path would be a second URL rule and a second media type. | Queryless path for host `www.ica.gov.sg` and the visa-requirements path. |
| MIME a registry row would name | `text/html` | `text/html` for the guidance page. `application/json` only wraps HTML. | `text/html` |
| Rule content only | No. The body also covers study, medical treatment, ship crew, character, and NZeTA exemptions for Australians. | The article is the rule. The page chrome is separate. The list markup is not one record per nationality. | The article mixes the country list, non-country travel documents, transit facility prose, and visa-agent instructions. |
| Fail closed when structure changes | A strict parser can reject a changed `li`. It cannot turn the two visa sentences into one schema-valid mode. | A strict parser can reject a changed `li`. It cannot attach the date group without splitting a neighbouring `li` on `br`. | A strict parser can reject a changed link. Absence of Switzerland has no success output. |
| Reusable by positive membership | The country `ul` could be reused for an unqualified `li` whose text is exactly one pinned name. Qualifier text such as `citizens only` is a different record and must fail closed. That reuse still needs one explicit effect and one explicit mode. | The clean country `li` values could be reused for nationalities. The three `li` values that also contain a group heading or a footnote must fail closed. The date qualifier still blocks a complete effect. | Positive membership means visa required for that listed issuer. It does not cover an unlisted issuer. Several links are documents rather than countries. |

Companion pages, same standard:

| Page | What the bytes say | Why it does not become the family |
| --- | --- | --- |
| INZ ops manual `88262.htm` | The title date is 03/02/2025. The body says the instructions are archived and no longer current. Switzerland appears in a citizen list with visit-purpose and duration conditions. | A page that declares itself not current is not the current family. It was not composed with the public waiver page. |
| INZ NZeTA page | The visitor condition is a glossary component, not the 60-name list. The page's `rel=canonical` is `https://www.immigration.govt.nz/visas/`, and that URL is the visas index. The raw body is 881,465 bytes. | The country set is not on this page. Following the canonical link would select a different document. NZeTA stays `electronic_travel_authorization`. The body is over the 65,536-byte trusted retrieval ceiling. |
| GOV.UK visit guidance | Swiss citizens are named in visit prose that also names an ETA and a visa alternative for holidays or short trips. The page also covers identity cards, settlement status, work, pets, healthcare, and driving. Public update on the page: 15 May 2026. The HTML body is 123,275 bytes. | This is multi-topic prose. The Content API body is that prose in HTML. It was not used to invent a visa mode from the ETA list. The HTML body is over the 65,536-byte trusted retrieval ceiling. The smaller Content API JSON does not change the prose. |
| Content API documentation | Official description of the GOV.UK Content API. It returns JSON for GOV.UK HTML pages. | Documentation is not a rule source. |
| ICA entering Singapore | States that a traveller from a visa-required country or region must apply for a visa. Switzerland is not named. | Same positive rule as the visa page. No Swiss exemption sentence. |

## 4. New Zealand special check

Target fact under test:

`requirementType: 'visa'`

`{ kind: 'requirement_effect', effect: 'not_required', visaMode: 'visa_exempt' }`

Source semantics on the current waiver page, read as statements rather than as a Jetnity fact:

- The `h2` "List of visa waiver countries and territories" introduces one `ul`.
- One item is exactly `Switzerland`. Other items carry parenthetical conditions. Switzerland's item does not.
- The summary says that a passport from a country or territory on that list can be used to travel to New Zealand without a visa, and that an NZeTA is needed first.
- A later section says people from visa-waiver countries do not need a visitor visa for a period of less than 3 months, or 6 months if from the United Kingdom.
- The same section says that a person travelling on a passport from a visa-waiver country or territory can visit for a short time without applying for a visa first, and that Immigration New Zealand gives that person a visitor visa on arrival. It also says an NZeTA is required before travel unless the person is exempt.
- A glossary tooltip on the page defines a visa-waiver country as one whose citizens do not have to apply for a visa before travel, and then truncates the visit condition. The tooltip is not the 60-name list.
- Australia is handled in its own sentence, outside the Swiss `li`.

Architecture conclusion:

The page does positively place Switzerland in the visa-waiver list. It does not positively establish the complete pair `not_required` plus `visa_exempt`.

The same page says both that a visitor visa is not needed and that a visitor visa is given on arrival. In the live fact schema those readings cannot be one fact. `not_required` together with `visa_on_arrival` is a contradiction. `required` together with `visa_exempt` is a contradiction. Choosing `visa_exempt` would drop the on-arrival grant. Choosing `visa_on_arrival` would drop the "do not need a visitor visa" sentence. Choosing either mode is a legal default this audit is not allowed to make.

The NZeTA clause is a separate requirement type. It is not a visa mode. This audit does not encode it as `visa_exempt` and does not emit an ETA fact from a sentence that also carries the unresolved visa mode.

The CH cell is also not explicit. The list predicate in the summary is the country of the passport. The research cell is citizenship `CH` and document type `ordinary_passport`. The Swiss `li` does not say "citizen" and does not say "ordinary passport". Copying the passport-country name into citizenship would infer citizenship from the issuer. The truncated glossary uses "citizens" and is not an explicit ordinary-passport field.

The duration "less than 3 months" is a qualifier on the visitor-visa sentence. `requirement_effect` cannot store it. Dropping it would make `not_required` apply beyond the stated period. That is `fact_incomplete` for this kind. A `stay_limit` extractor is a different id and is not proved by this page, because the qualifier "less than" is not a pinned duration unit.

The ops manual is archived, so it cannot repair the public page. The NZeTA page does not contain the Switzerland `li`. Composing them would need a code-owned composition policy. None exists, and the live binding refuses composition before HTTP.

R1, current retrieval ceiling. The waiver page's measured raw body is 681,132 bytes. The NZeTA page's measured raw body is 881,465 bytes. Both are over `BODY_MAX` of 65,536 in the merged server-owned retrieval. A `Content-Length` above that limit, or a stream that crosses it, is `response_too_large`. The body is discarded. No extractor, including a future INZ parser, can read those pages through the current trusted path. The direct research fetch in this session is not that path. It saved bytes the production boundary would refuse.

This slice does not propose a larger ceiling. A later selection of either INZ page would need a separately reviewed smaller official representation or endpoint, or a separate reviewed change to the bounded retrieval policy. The archived ops manual is inside the ceiling and remains not current.

Result of the special check: the waiver page cannot support that complete visa fact, and the current retrieval contract cannot deliver the page to an extractor. New Zealand is not the first extractor family.

## 5. United Kingdom special check

Source semantics:

- The ETA National List introductory sentence says that nationalities of the listed locations are subject to the requirement to obtain an ETA for travel to the UK.
- Switzerland is an `li` whose text is exactly `Switzerland`.
- The list is grouped by travel date. The group that contains Switzerland is the text "travelling to the UK on or after 2 April 2025". In the HTML, that group label is not its own node. It sits inside the preceding `li`, together with a Taiwan passport footnote, separated by `br`. Two earlier group labels are embedded the same way. Three of 83 `li` nodes are mixed. Switzerland's own `li` is clean.
- The Content API returns `application/json` with `details.body` equal to that HTML string. There is no nationality field, no date field, and no effect field outside the HTML.
- The visit-guidance page, in prose, says citizens of Switzerland can travel to the UK for holidays or short trips with an ETA instead of a visa. The same page states other entry documents and other purposes.

Architecture conclusion:

JSON around an HTML string does not make the rule deterministic. The positive ETA consequence is real, and Switzerland's membership is real, but the structure does not give one record with a nationality field and a date field. A parser that splits a mixed `li` on `br` is repairing prose. A parser that ignores the date emits `required` for a travel-date condition the fact cannot store. `conditional` would also drop the date. Either choice is a legal default.

R2, current extractor input. The merged extractor context receives `scopeKey` and does not receive the decoded regulatory scope or a `travelDate`. `scopeKey` is an opaque `rule-scope:v1:` digest. An extractor must not reverse it or treat it as a date. The same-request binding copies that digest into the extractor input. It does not pass `beweis.kandidat.scope` except for `requirementType`. A source-specific extractor therefore cannot prove that the caller's travel date is on or after 2 April 2025. Dropping the date, assuming every future trip qualifies, or reading the caller's research envelope in the extractor would be a second authority path. A later date-qualified family needs a separately reviewed binding of the decoded server-held scope into the extractor context, or a different complete fact representation. This slice does not add that binding.

The ETA HTML page and the ETA Content API object are both within the 65,536-byte ceiling. Size is not the UK block. The date contract is.

The visit-guidance sentence is not a visa extractor. It is prose, it is purpose-limited, and it names the ETA and the visa in one sentence. This audit does not derive `visa_exempt` from ETA membership. Its HTML body is also over the retrieval ceiling.

The CH ordinary-passport cell is not fully stated. The list speaks of nationalities. It does not say `ordinary_passport` for Switzerland.

Result of the special check: GOV.UK is not the first extractor family.

## 6. Singapore special check

Source semantics:

- The visa-requirements page says that a person who holds a travel document issued by one of the listed countries or places will require a valid Singapore entry visa to travel to and seek entry into Singapore.
- The list is a set of links in three columns. This session counted 39 link labels. None is Switzerland or Swiss. Some labels are travel documents rather than countries, including a Hong Kong document of identity, a Macao travel permit, and a PRC travel document.
- Further bullets require a visa for a refugee travel document, an alien's passport, and a Palestinian Authority passport. Those bullets are assessment or document rules, not a Swiss rule.
- "Visa-free" on this page names a transit facility for listed nationalities and selected PRC document holders. It is not a statement that an unlisted country is visa exempt.
- The entering-Singapore page tells short-term travellers from a visa-required country or region to apply for a visa. It does not name Switzerland.

Architecture conclusion:

Absence of Switzerland is not `not_required`. The positive rule is reusable only for an issuer the list actually names, and only after a parser can tell a country link from a document link. That positive rule does not cover the seeded CH ordinary-passport cell, because the CH cell is the unlisted side. No CH-01..CH-10 batch uses a non-CH citizenship, so this list cannot confirm a seeded CH case.

Both ICA pages are within the 65,536-byte ceiling. The size check does not make the missing Swiss statement into a fact. The government page can still be a sound visa-required list for the issuers it names. It is not a complete fact for this cell under the current contract.

Result of the special check: Singapore is not the first extractor family.

## 7. Selection

**`NO_SOURCE_FAMILY_PROVEN_YET`**

No source family is proven compatible with Jetnity's current deterministic fact and retrieval contract. The government sources were readable in this research fetch. That fetch is not the trusted retrieval path, and readability is not a Rule fact.

No family met a fail-closed structure, a positive complete `RegelFakt` for the CH ordinary-passport cell, and the current retrieval and extractor input limits together. The INZ waiver and NZeTA pages are over the 65,536-byte ceiling. The GOV.UK ETA date cannot be checked from the opaque `scopeKey`. The ICA list has no positive Swiss fact. The fields required on a selection are therefore not filled: source family id, extractor id, extractor version, source id, URL allowlist, schema family, evidence quality, and expected fact shape.

CH-01..CH-10 stay `RESEARCH_ONLY` and `NOT_APPROVED_FOR_DATABASE_IMPORT`. No batch was imported. CH-11 was not started. The 64 destinations were not re-researched.

## 8. Traveller context

This audit uses one regulatory cell: citizenship `CH`, document type `ordinary_passport`, and the destination named by each source. A second citizenship or a second travel document is another cell. The audit does not rank credential options, does not copy an issuing country into citizenship, and does not collect a passport number, MRZ, or any other personal identifier.

Where a page uses "passport from", "nationality", or "travel document issued by", that phrase stays the page's phrase. It is not rewritten into the cell.

## 9. What remains true after this audit

The human fact-entry path remains the only authorized way to supply `trustedRuleFact`. A later source family still has to arrive as server-owned bytes, match one registry row, and return one complete fact or a fail-closed reason. `regelKandidatAkzeptieren` remains the acceptance function. F8, a route, a store write, and a real extractor registration are not authorized by this result.

A later candidate is worth opening only when one official response already contains a uniform record whose fields are the effect, the visa mode or an explicit null, and the citizenship or document condition, when that record covers one seeded CH cell by positive membership, and when the response fits the current 65,536-byte retrieval ceiling. A date-qualified record also needs a reviewed way to see the decoded server-held scope. Selecting the current INZ HTML pages later would require a smaller official representation or a separate retrieval-policy review. This document does not name that source, does not raise `BODY_MAX`, and does not start that slice.
