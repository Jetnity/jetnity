# Official Truth GOV.UK ETA Deterministic Source-Family Audit

Date: 3 October 2026
Status: **docs-only source-family audit / Draft PR #791 / no extractor / no acceptance**
Issue: #790
Draft PR: #791
Branch: `docs/official-truth-govuk-eta-source-family-audit`
Baseline: `main@32a0d6d85bc9f5591eeebb50a27ae71fac44b73f`
Task: `docs/OFFICIAL_TRUTH_GOVUK_ETA_SOURCE_FAMILY_AUDIT_TASK_2026-10-03.md`
Logical agent: **Jetnity Official Truth GOV.UK ETA source-family audit**, Generation 1
Session: https://cursor.com/agents/bc-5ef68db6-34e5-49e9-b6e4-cacf373730c8
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

Selection result: **`NO_SOURCE_FAMILY_PROVEN_YET`**

That result means the current GOV.UK ETA National List is not proven compatible with Jetnity's deterministic fact and retrieval contract for one complete `electronic_travel_authorization` + `requirement_effect` fact. It does not mean the Home Office pages are unreliable.

No source family id, extractor id, extractor version, source id, schema family, URL allowlist, or Rule fact is proposed. The production extractor registry stays empty. This audit does not make Candidate Evidence into Official Truth.

The smallest missing capability is named in section 8. This slice does not add it.

## 1. What was re-checked

Selection 1 left the ETA National List inside the 65,536-byte ceiling and blocked it because the extractor then received only an opaque `scopeKey`. Decoded regulatory scope binding (#787, on this baseline) now passes a source-neutral `RegelScope` whose `validity.mode` can be `travel_date` with `validity.travelDate`. This audit re-reads the current Home Office bytes against that contract.

Live code on `main@32a0d6d85bc9f5591eeebb50a27ae71fac44b73f` wins over older architecture wording:

- `OFFICIAL_TRUTH_TRUSTED_FACT_EXTRACTOR_REGISTRY` in `lib/readiness/official-truth-trusted-fact-extractor-registry.ts` is `Object.freeze([])`.
- `OfficialTruthExtractorKontext` carries `factKind`, `requirementType`, `scopeKey`, and `scope`. `scope` is the source-neutral `RegelScope`: destination, transit, the full citizenship set, one credential option, residence, requirement type, and validity. It has no `sourceId`.
- A caller field named `travelDate` outside `scope.validity` is `unexpected_fields`. The travel date is present only when `validity.mode` is `travel_date`. `validity.mode: 'not_applicable'` has no date. A malformed date is `invalid_scope` before a matcher runs.
- `loadOfficialTruthSameRequestTrustedFactExtraction` accepts only `evidenceQuality: 'explicit_primary_statement'`. `composed_from_multiple_primary_sources` stops as `composition_policy_unavailable` before HTTP.
- Inside the extractor framework, `explicit_primary_statement` requires exactly one support. A second support is `ambiguous_structure`. The composed path requires two supports from two source ids and a policy. Two supports that share one source id are `same_source_composition`.
- `requirement_effect` stores only `kind`, `effect`, and `visaMode`. `effect` is `required`, `not_required`, or `conditional`. For every requirement type other than `visa`, `visaMode` must be null. There is no condition object.
- `credentialOption.documentType` is `passport`, `national_id`, or `unknown`. The research literal `ordinary_passport` is `invalid_scope`.
- `relatedCitizenshipCountryCode` is null unless the cell supplies it, and the supplied code must already be in `citizenship.countryCodes`. Issuing country is not copied into citizenship.
- The framework does not choose a citizenship, an issuing country, a document, a residence, or a travel date. Reordered citizenship codes canonicalize to the same sorted set and the same `rule-scope:v1:` key. The set maximum is 8.
- `BODY_MAX` in `lib/readiness/official-truth-server-owned-retrieval.ts` is `65_536`. A `Content-Length` above that fails as `response_too_large` before the body is kept. `medientyp` compares the media type without parameters. This audit does not raise the ceiling.

Candidate fact under test, not assumed:

```
requirementType: 'electronic_travel_authorization'
{ kind: 'requirement_effect', effect: 'required', visaMode: null }
```

The positive nationality cell is Switzerland. The destination named by the rule is the UK. CH-01..CH-10 stay research-only and are not the fact being accepted.

## 2. Retrieval

These calls are direct research fetches. They are not Jetnity production retrieval. There was no source catalog, no DNS pin, no Evidence row, and no `evidenceQuellenFingerprint`.

Research-header window: 2026-10-03T10:35:23.088Z through 2026-10-03T10:35:24.949Z. Headers were `accept-encoding: identity`, `cache-control: no-cache`, `accept: */*`, and a research user agent.

Node-like window, using only the two fixed headers the live client sends: 2026-10-03T10:37:57.581Z through 2026-10-03T10:37:57.938Z for the National List HTML, the National List Content API, and the Appendix Content API. The Appendix HTML node-like read was 2026-10-03T10:38:41.353Z through 2026-10-03T10:38:41.478Z.

Every requested URL returned HTTP 200 on itself. Redirect count was 0. No effective URL carried `utm_*`, `gclid`, `dclid`, `fbclid`, `msclkid`, `gbraid`, `wbraid`, `mc_cid`, or `mc_eid`. The node-like body hash matched the research-header body hash for each URL.

| Source | Requested and effective URL | Status | Media type | Content-Length | Bytes | SHA-256 |
| --- | --- | --- | --- | --- | --- | --- |
| National List HTML | `https://www.gov.uk/guidance/immigration-rules/immigration-rules-appendix-eta-national-list` | 200 | `text/html; charset=utf-8` | 62422 | 62422 | `21c6a83cbf60cceac5bba5f41f03ddc79b28c5457365c10a45c3b3fd710b4382` |
| National List Content API | `https://www.gov.uk/api/content/guidance/immigration-rules/immigration-rules-appendix-eta-national-list` | 200 | `application/json; charset=utf-8` | 7788 | 7788 | `59a7fd6e7416f989ace351bc5ab4f562c52b3c5cab64fcbe861ea4a57ced1854` |
| Appendix ETA HTML | `https://www.gov.uk/guidance/immigration-rules/immigration-rules-appendix-electronic-travel-authorisation` | 200 | `text/html; charset=utf-8` | 88426 | 88426 | `fdabb99e8c1440d1358dd60bfefd087de4398f6d370c8252489fc373f2e9610b` |
| Appendix ETA Content API | `https://www.gov.uk/api/content/guidance/immigration-rules/immigration-rules-appendix-electronic-travel-authorisation` | 200 | `application/json; charset=utf-8` | 22965 | 22965 | `6859cfcacb44cc1287daa8daeedaf05a8b7f18e4ee638cfa7253e09f5d170037` |

The Appendix Content API is an extra official read of the same Appendix document. The task required the Appendix HTML. The API read answers whether one official response contains both the nationality list and the exemptions. It does not.

Every saved body decoded as fatal UTF-8. The National List `details.body` is ASCII, 2,703 bytes, and is the only HTML-like string in that JSON document. It occurs verbatim inside the National List HTML. The Appendix `details.body` is 17,304 characters of HTML inside that JSON document.

Measured raw sizes against `BODY_MAX` 65,536:

| Response | Raw bytes | Against the current ceiling |
| --- | --- | --- |
| National List HTML | 62,422 | Within the ceiling. `Content-Length` matches the body. |
| National List Content API | 7,788 | Within the ceiling. `Content-Length` matches the body. |
| Appendix ETA HTML | 88,426 | Over the ceiling. The live path fails as `response_too_large` on the header, before the body is kept. |
| Appendix ETA Content API | 22,965 | Within the ceiling. The body does not name Switzerland. |

Selection 1 recorded the National List HTML at the same 62,422 bytes with SHA-256 `9dafb6634edccf6bff3fb888cc950929faa4e10af0836d2288a5e4eee295b406`. This session's HTML hash is different. The National List Content API hash is the same value selection 1 recorded. The rule fragment is stable inside a full HTML document whose bytes moved. A later parser that pinned a byte offset in the full HTML page would be pinning chrome. The legal fragment to pin is `details.body`, and even that fragment is HTML, not a record.

Publishing metadata on the current JSON, not used as the travel threshold:

| Document | content_id | schema_name | public_updated_at | updated_at | Publisher |
| --- | --- | --- | --- | --- | --- |
| National List | `2b25b3d4-4eaa-4859-a34e-c7869c114c15` | `manual_section` | `2026-03-05T15:03:24+00:00` | `2026-08-03T11:12:11+01:00` | Home Office |
| Appendix ETA | `2620750b-5453-44f1-98af-414037c833be` | `manual_section` | `2026-08-03T08:55:43+01:00` | `2026-08-03T11:12:11+01:00` | Home Office |

Both are `document_type: manual_section`, `locale: en`, `phase: live`, under manual base path `/guidance/immigration-rules`. They are two content items. The National List HTML has no `rel=canonical` link. Identity for that page is the fetched URL. The machine `updated_at` is not the Switzerland travel-date threshold.

## 3. Hard questions

| # | Question | Result |
| --- | --- | --- |
| 1 | Switzerland is positively and explicitly on the current National List. | Proven. One `<li>` whose text is exactly `Switzerland`. The string appears once in `details.body`. |
| 2 | The Switzerland travel-date threshold is explicit and can be evaluated only from `scope.validity.travelDate`. | Proven as a comparison. The threshold text is `(d) travelling to the UK on or after 2 April 2025`. The only cell date a matcher may read is `scope.validity.travelDate`, and only when `validity.mode` is `travel_date`. The threshold is not a field on the Switzerland `<li>`. |
| 3 | The response used for extraction is at most 65,536 bytes and valid UTF-8. | Proven for both National List responses. The Appendix HTML is 88,426 bytes and would not be kept. No in-ceiling response contains both Switzerland and the exemptions. |
| 4 | The nationality/date structure can fail closed on drift. | A versioned parser can pin the current markup and reject a changed node. The markup is not one record with a nationality field and a date field. |
| 5 | Citizenship comes from `scope.citizenship`, never `issuingCountryCode`. | Required by the source wording and by the live scope. The list says nationalities. |
| 6 | Multiple citizenships: no silent choice. | Exact sorted set `['CH']` can be the positive cell. Any other required set fails closed, with no fact. |
| 7 | `relatedCitizenshipCountryCode` only when explicit. | Null stays unlinked. The issuer is not turned into the relationship. |
| 8 | `documentType: 'passport'` is enough for the rule. | It is not enough for Appendix ETA 1.1(d) and ETA 4.3. `ordinary_passport` is not a scope value. The Switzerland row itself has no document qualifier. |
| 9 | Exemptions in Appendix ETA, including entry clearance and Ireland/CTA. | Inspected in section 6 from the current Appendix bytes. |
| 10 | `RegelScope` can prove each exemption does not apply. | It cannot prove the entry-clearance exemption, and it cannot prove ETA 1.3. |
| 11 | One unproven exemption makes unconditional `required` incomplete. | The entry-clearance sentence alone does that. |
| 12 | `conditional` is not a placeholder. | `requirement_effect` has no condition payload. `conditional` is not used. |
| 13 | The list and the Appendix are not one explicit primary statement. | One support cannot see both documents. Composition stops before HTTP. |
| 14 | Same publisher is not the same representation. | Two `content_id` values, two base paths, two responses. |
| 15 | JSON that wraps HTML is not a structured nationality record. | `details.body` is an HTML string. Section 5 pins it. |

## 4. National List bytes

`details.body` is this shape, and the same fragment sits inside the HTML page:

- One `<p>`: `ETANL 1.1. Nationalities of the following locations (including countries and associated territories) are subject to the requirement to obtain an ETA for travel to the UK, pursuant to Appendix Electronic Travel Authorisation:`
- One `<div class="legislative-list-wrapper">` containing one `<ol class="legislative-list">`.
- 83 `<li>` nodes. No headings. The Switzerland node is index 81, between `Sweden` and `Vatican City`, and its inner text is exactly `Switzerland`.
- Three `<li>` nodes contain `<br>`. The other 80 are plain text.

The three mixed nodes are:

| Index | What the node contains |
| --- | --- |
| 0 | `(a) for travel to the UK on or after 15 November 2023`, then `Qatar`, then `(b) for travel to the UK on or after 22 February 2024` |
| 5 | `Saudi Arabia`, then `(c) for travel to the UK on or after 8 January 2025` |
| 48 | `Uruguay`, then the Taiwan passport footnote, then `(d) travelling to the UK on or after 2 April 2025` |

Group (d)'s label uses "travelling", not the "for travel" wording of groups (a), (b), and (c). Switzerland's clean `<li>` is one of the plain nodes that follow that mixed node, through `Vatican City`. The Taiwan footnote is in the same mixed node as the (d) label. It is a passport condition for Taiwan. It is not a condition on the Switzerland node. A parser that attached the footnote to every following nationality would be misreading the node.

The introductory sentence subjects listed nationalities to an ETA **pursuant to Appendix Electronic Travel Authorisation**. The list does not itself contain the words "entry clearance", "permission to enter", or "Ireland".

The date comparison the decoded scope can now perform:

- Read the threshold only from the pinned (d) text: on or after 2 April 2025.
- Compare it only with `scope.validity.travelDate` when `scope.validity.mode` is `travel_date`.
- When `validity.mode` is `not_applicable`, do not invent a date and do not emit `required`.
- A travel date before 2 April 2025 is not a positive Switzerland inclusion. The bytes do not say `not_required` for that earlier date. The safe output is no fact.
- Do not use `public_updated_at`, `updated_at`, `retrievedAt`, or the Appendix's separate sentence that the application process opens on 5 March 2025. That opening date is a different sentence on a different content item.

This removes the selection-1 block that said the date could not be checked because the extractor saw only `scopeKey`. It does not make the Switzerland row a self-contained record, and it does not make `required` complete.

A fail-closed pin for this fragment, if a later slice ever had a complete fact to extract, would reject the snapshot unless all of the following still hold: `schema_name` is `manual_section`; `base_path` is the National List path; `details.body` is a string; the paragraph text is exact; the list has 83 items; the only mixed items are the three pinned nodes; the Switzerland item is exactly `Switzerland`; the (d) label remains the exact "travelling … 2 April 2025" sentence inside the Uruguay node and after the Taiwan footnote. A new `<br>` inside the Switzerland node, a moved (d) label, or a second Switzerland node is drift. Whole-document HTML equality is the wrong guard: this session already saw the HTML hash change at a constant 62,422 bytes while `details.body` stayed inside an API document whose hash did not change.

## 5. JSON wrapping HTML

The Content API document is a publishing envelope. The rule is `details.body`. Sibling fields are content identity, change history, manual pointer, organisation, and links, including logo and brand objects. Those fields are not nationality records and are not the travel-date threshold.

`details.body` is HTML inside a JSON string. Parsing the JSON does not yield `{ nationality, travelDate }`. The nationality is the text of one `<li>`. The date that applies to it is text inside a different `<li>`, separated by `<br>`. A parser that splits those nodes on `<br>` is a versioned source-specific reading of known markup. It can fail closed. It is not evidence that the publisher issued a structured row.

The same description applies to the Appendix API. Its `details.body` is 17,304 characters of HTML: 28 `<p>`, 14 `<h2>`, 8 `<h3>`, and 54 `<li>` in this snapshot. The exemptions are sentences in that HTML. They are not fields.

## 6. Appendix exemptions and the decoded scope

The Appendix does not contain the string `Switzerland`. It cites `ETANL 1.1` and groups (a) through (d). A citation is not a copy of the list.

Requirement-level sentences in the current Appendix body:

| Id | Current sentence, compressed to the operative words | Can the current `RegelScope` prove it does not apply? |
| --- | --- | --- |
| Intro | A person who already holds a valid entry clearance, or permission to enter or stay, is not required to obtain an ETA. | No. There is no permission or entry-clearance predicate. |
| ETA 1.3 | An applicant who is lawfully resident in the Republic of Ireland and is travelling to the UK from elsewhere in the Common Travel Area does not need to obtain an ETA. | No. `residence.countryCode` `IE` is not ETA 1.4 lawful residence. `residence.mode: 'not_applicable'` does not prove the person is not lawfully resident in Ireland. `transitCountryCode` is one country, not a journey from the rest of the Common Travel Area. There is no origin field. |
| ETA 1.4 | Lawfully resident means resident and entitled to reside under Irish law at the time of the ETA application, and not a person who cannot leave Ireland without an Irish Minister's consent. | Same gap as ETA 1.3. The scope cannot store that entitlement test. |
| ETA 1.6 | A person aged 16 or over who relies on ETA 1.3 must provide evidence of lawful residence if required. | No age field. This qualifies ETA 1.3. It does not remove ETA 1.3. |
| ETA 1.7 | A person who is a British Overseas Territory Citizen or a British National (Overseas) does not require an ETA. | No. Those are not ISO country codes on `citizenship.countryCodes`. The scope cannot say the person lacks that status. |
| ETA 1.9 | ETA nationals aged 18 or under, at a French Ministry of Education school, in a school party of 5 or more, entering as a Visitor, do not require an ETA. | No age, school, party size, or visit-purpose field. Switzerland is an ETA-list nationality, so this sentence can cover a Swiss pupil. |
| ETA 1.10 | ETA nationals aged 19 or under, at a confirmed German school, in a school party of 5 or more, entering as a Visitor, do not require an ETA. | Same gap as ETA 1.9. |

Further sentences that qualify who an ETA application is for, still inside the same Appendix body:

- ETA 1.1(d) requires a national passport which establishes identity and nationality as a national included at ETANL 1.1.
- ETA 1.1(f) limits a valid application to a Visitor stay of up to 6 months other than a Marriage/Civil Partnership Visitor, a Creative Worker under Appendix Temporary Work - Creative Worker CRV 3.2, or a defined local journey from the Republic of Ireland who is not an S2 Healthcare Visitor.
- ETA 1.2 repeats that the applicant must be a national included at ETANL 1.1.
- ETA 4.3 says an ETA confers permission to travel only where the holder uses the passport specified in the application.

`documentType: 'passport'` does not say "national passport", and it does not say that the passport establishes the listed nationality. That link exists on the scope only when `relatedCitizenshipCountryCode` is explicitly set. For a Switzerland cell the explicit value would be `CH`, and only if the cell already contains `CH`. Null means unlinked. Copying `issuingCountryCode` into that field would invent the relationship.

The Switzerland `<li>` has no diplomatic, official, or ordinary qualifier. The Appendix bytes inspected here do not exclude diplomatic or official passports for Switzerland. The gap is the "national passport that establishes listed nationality" sentence, not a silent diplomatic exclusion. `ordinary_passport` remains the research literal. It is not rewritten to `passport`.

ETA 1.8 is a closed Jordan transition. It is not a Swiss exemption. Suitability rules ETA 2.1 through ETA 2.9, and the cancellation rules, are grounds to refuse or cancel an application. They are not sentences that say the person does not need an ETA. They were not used to turn `required` into `not_required`.

The introductory entry-clearance sentence is enough. A cell with citizenship exactly `['CH']`, destination `GB`, a passport explicitly related to `CH`, residence `not_applicable`, and a travel date on or after 2 April 2025 still cannot prove that the person does not already hold UK entry clearance or permission. Unconditional `effect: 'required'` would be false for a person that sentence exempts. `effect: 'conditional'` would name uncertainty and would drop the sentence, because the fact cannot store it. `effect: 'not_required'` would drop the positive list membership. None of the three effects is the complete rule.

## 7. One publisher, two representations

The Home Office publishes both pages on GOV.UK. That shared publisher does not make one support.

- National List `content_id` `2b25b3d4-4eaa-4859-a34e-c7869c114c15`.
- Appendix `content_id` `2620750b-5453-44f1-98af-414037c833be`.
- The National List body does not contain the exemption sentences.
- The Appendix body does not contain `Switzerland`.
- `explicit_primary_statement` carries one support into the extractor.
- Joining the two responses is `composed_from_multiple_primary_sources`. The same-request path blocks that quality as `composition_policy_unavailable` before HTTP.
- The Appendix HTML cannot be the single support on the current retrieval path: 88,426 bytes.
- The Appendix API can pass the byte ceiling and still cannot show that Switzerland is listed.
- The National List API can pass the byte ceiling and still cannot show that the entry-clearance exemption is absent.

The HTML page and the Content API for the **same** base path are two renderings of one content item. The API body is the HTML fragment. They are not two legal sources. They are also not a structured schema. Choosing the API as the single response still leaves the exemptions on the other content item.

## 8. Selection

**`NO_SOURCE_FAMILY_PROVEN_YET`**

No family id, extractor id, extractor version, source id, schema family, URL allowlist, or fact shape is proposed.

Switzerland's membership is explicit. The 2 April 2025 threshold is explicit and can be compared with decoded `scope.validity.travelDate`. Both National List responses are inside 65,536 bytes and are valid UTF-8. Those three points are no longer the block.

The block is that the list states the requirement pursuant to the Appendix, and the Appendix states exemptions the current scope cannot prove aside. The smallest missing capability is a decoded-scope predicate that can prove the traveller does not already hold a valid UK entry clearance or permission to enter or stay. ETA 1.3 is the same class of gap: lawful residence in Ireland and a journey from the rest of the Common Travel Area. `requirement_effect` cannot store either condition. `conditional` does not fill the hole.

A schema predicate alone would still not authorize an extractor for these two pages. The exemption sentences are not in the National List response, and `explicit_primary_statement` cannot combine the two content items. Multi-source composition remains blocked and is the larger runtime gap. Closing composition without the predicate would still not yield unconditional `required`. This audit does not add the predicate and does not write a composition policy.

CH-01..CH-10 stay `RESEARCH_ONLY` and `NOT_APPROVED_FOR_DATABASE_IMPORT`. No batch was imported. CH-11 was not started.

## 9. Traveller context

The positive cell is one citizenship, `CH`. A second citizenship is a different cell. The matcher must see the whole sorted set. It must not keep `CH` and drop another code. Issuing country stays on the credential option. Related citizenship stays null unless the cell states it. Residence was not treated as a substitute for ETA 1.4. Document type was not rewritten from `ordinary_passport` to `passport`. No passport number, MRZ, scan, biometric, or health record was collected. Route Truth stays traveller-neutral because this audit writes no route.

The result can differ by citizenship set, by an explicit passport-to-citizenship link, by residence, and by travel date. It can also differ by UK permission, Ireland lawful residence, CTA journey, British Overseas Territory Citizen or British National (Overseas) status, age, and school party. Those last facts are legally relevant on the current Appendix page and are absent from `RegelScope`. The audit preserves that absence as unknown. It does not invent a single-nationality default to hide it.

## 10. What remains true

The human fact-entry path remains the only authorized way to supply `trustedRuleFact`. A later family still has to arrive as one server-owned response, match one registry row, and return one complete fact or a fail-closed reason. `regelKandidatAkzeptieren` remains the acceptance function. F8, a route, a store write, a `BODY_MAX` change, and a real extractor registration are not authorized by this result.

This document does not name the next source and does not start the schema change.
