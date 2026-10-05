# Official Truth JP first pilot source audit 1

Date: 5 October 2026
Issue: [#848](https://github.com/Jetnity/jetnity/issues/848) · Draft PR: [#849](https://github.com/Jetnity/jetnity/pull/849)
Status: **SOURCE AUDIT ONLY / NO ACCEPTANCE / NO IMPLEMENTATION**

## 1. Decision and research boundary

**JP_FIRST_PILOT_SOURCE_FAMILY_NOT_READY**

Switzerland and the visa-exemption consequence are positively explicit in current Japanese state publications. The requested three-field cell is not an unconditional rule: permitted purpose, activity restrictions, duration and the relationship between citizenship and the presented passport remain material. The complete fact cannot be represented losslessly in the current contracts. No Japanese content-identity profile or bounded already-approved retrieval path was found in the inspected baseline. These are independently sufficient reasons for this decision; it does not mean that Swiss visitors generally need a visa.

The audited input is exactly `citizenshipCountryCode=CH`, task vocabulary `documentType=ordinary_passport`, `destinationCountryCode=JP`. The current applicability model uses `documentType=passport` plus `documentClass=ordinary`; this is a vocabulary mapping, not permission to default either input. Swiss residence, Swiss issuance and Swiss citizenship are independent facts. A Swiss citizen presenting an unspecified ordinary passport must not silently become a holder of a valid Swiss national passport linked to that citizenship.

All normative evidence below was read on the actual official Japanese state page/document. Search results were discovery only. No commercial source, provider, model output, other country's government, or previous CH research supplied regulatory truth. The PDF was inspected visually on all eight pages; its text layer is empty. All paraphrases below are audit notes, not accepted Evidence, Rule claims, an extractor specification, or an approved composition policy.

Baseline inspected: `bb42e261771245b1675d2886cec96b60674dd608`. The immutable [binding task](OFFICIAL_TRUTH_JP_FIRST_PILOT_SOURCE_AUDIT_1_TASK_2026-10-05.md) and its five-path boundary control this work.

## 2. Official source inventory and semantic locators

The receipt IDs below are local audit labels only. They are **not** registered Jetnity source/content/representation IDs. HTML line numbers, table positions and search snippets are not the authoritative locators. A heading, named country row and its associated footnote are used together.

| ID | Official source and displayed update | Locator and reason for reading |
| --- | --- | --- |
| R01 | [MOFA — Exemption of Visa (Short-Term Stay)](https://www.mofa.go.jp/j_info/visit/visa/short/novisa.html), 1 September 2025 | Opening exemption statement; stay-period paragraph; Europe → Switzerland → Note 8. Central positive country and duration evidence. |
| R02 | [MOFA — 査証免除国・地域（短期滞在）](https://www.mofa.go.jp/mofaj/toko/visa/tanki/novisa.html), 1 September 2025 | Opening statement; Europe → スイス → 注8; corresponding landing-period paragraph. Japanese-language cross-check, not an independent authority vote. |
| R03 | [MOFA — VISA](https://www.mofa.go.jp/j_info/visit/visa/), 24 June 2026 | Short-Term Stay; countries not requiring visas; introductory visa/entry distinction. Purpose boundary and positive link to R01. |
| R04 | [MOFA — Frequently Asked Questions](https://www.mofa.go.jp/j_info/visit/visa/faq.html), 31 March 2023 | Before Application, Q1/A1, linked exemption list. Explicit consequence qualified by duration and income-earning activity. |
| R05 | [Consulate of Japan in Geneva — Visas](https://www.geneve.ch.emb-japan.go.jp/itpr_fr/visa.html), 22 July 2025 | General Information and short-stay application instructions. Distinguishes visa-application paperwork from exempt-entry conditions. |
| R06 | [Consulate of Japan in Geneva — Visa Category](https://www.geneve.ch.emb-japan.go.jp/itpr_fr/visa_00001.html), 22 July 2025 | “Did you know that?” passport/landing/visa-validity bullets; Visit Japan Web information. State-carried passport validity and distinct time anchors. |
| R07 | [MOFA treaty archive — Japan/Switzerland reciprocal partial visa abolition exchange of notes](https://www.mofa.go.jp/mofaj/gaiko/treaty/pdfs/A-S38%282%29-157.pdf) | PDF pages 2 and 5, clause 2; pages 2–3 and 5–6, clauses 3–7; pages 7–8 notice. Notes dated 25 March 1957, effective 15 April 1957; notice 8 April 1957. Positive Swiss national-passport wording and separate diplomatic/service/special branch. Archival text, not a newly issued 2026 operational instruction. |
| S08 | [Immigration Services Agency — 在留資格「短期滞在」](https://www.moj.go.jp/isa/applications/status/temporaryvisitor.html) | Activity definition; period of stay; extension application heading and caveat. General Temporary Visitor status and extension caveat. No displayed page update identified; HTTP Last-Modified is recorded separately. |
| R09 | [MOFA — other-nationality short-stay visa application guide](https://www.mofa.go.jp/j_info/visit/visa/short/other_visa.html), 9 February 2026 | Application procedures/document lists. Checked to prevent inferring a Swiss visa obligation from an application page or omission. Not used to establish the positive exemption. |
| R10 | [MOFA — ビザ（査証）](https://www.mofa.go.jp/mofaj/toko/visa/index.html), 24 June 2026 | 短期滞在; explicit exclusion of operating an income-generating business and receiving remuneration. Japanese boundary cross-check. |
| R11 | [MOFA — Exemption of Visa for Diplomatic and Official Passport Holders](https://www.mofa.go.jp/ca/fna/page22e_000692.html), 2 September 2026 | First country table, Switzerland; separate passport-class headings. Demonstrates why diplomatic/official arrangements cannot substitute for the ordinary-passport cell. |
| R12 | [Embassy of Japan in the UK — Visa: Temporary Visitor Visa](https://www.uk.emb-japan.go.jp/itpr_en/index_000070.html), 30 June 2026 | General; Note 1; Note 2 naming Switzerland; Period of Stay. The embassy itself carries the relevant state rule. Used for corroboration and to expose the 90-day-extension versus six-calendar-month wording difference. UK residence/application jurisdiction is not imported into the Swiss cell. |

Displayed update dates, HTTP modification dates, retrieval times and legal effective dates are different fields. None is substituted for another. A recent successful fetch proves availability of those bytes, not the absence of every possible suspension or later legal instrument.

## 3. Structured source findings

| Atom | Positive paraphrase and precise support | Boundary, gap or prohibited inference |
| --- | --- | --- |
| JP-A01: nationality and consequence | R01 opening statement + Switzerland row explicitly place Switzerland in the short-stay visa-exemption arrangements. R02 gives the matching Japanese row. R04 Q1/A1 positively says qualifying nationals do not need a visa. | This is not the complement of a visa-required list. Missing countries must not become `required`. |
| JP-A02: initial duration and anchor | R01 stay paragraph gives 90 days for listed countries outside its named exceptions, **upon landing permission**. Switzerland carries Note 8. | Preserve 90 **days**; not three months, not visa validity from issuance, not a pre-travel permission guarantee. Exact midnight/inclusive-day arithmetic is not supplied here. |
| JP-A03: extension | R01 Note 8 gives the bilateral arrangement up to six months; a stay over 90 days requires application to the regional immigration authority before the permitted stay expires. | Preserve six **months** and the expiry deadline. No automatic six-month landing grant, guaranteed extension, rolling window, or conversion to 180 days. |
| JP-A04: purpose and activity | R03 Short-Term Stay includes tourism, business and visiting friends/relatives within 90 days, excluding remunerative activity. R04 Q1/A1 separately qualifies the exemption by no income-earning activity. R10 excludes both revenue-generating business operations and remuneration. | `visitor` or `business` alone does not prove that activities are non-remunerative. `not work` is not an equivalent predicate. No broad permission to work remotely, study, perform or earn money is established. |
| JP-A05: passport and citizenship binding | R07 clause 2 positively binds Swiss nationality to a valid Swiss national passport; it separately treats diplomatic/service/special passports and excludes specified profit-making performances/competitions from that waiver. | The current CH row does not itself label its class “ordinary”. The archival national-passport clause supports the ordinary national-passport reading, but is not a current class-normalization contract. An arbitrary ordinary document, emergency document or unlinked second-country passport is not established by this evidence. |
| JP-A06: preserved state powers | R07 clauses 3–4 preserve immigration/residence/gainful-activity law and the power to refuse entry/stay. Clauses 6–7 allow suspension/termination. | The archive alone cannot prove present operational completeness. Reverse-direction Japan→Switzerland clauses and Liechtenstein provisions are outside this cell. |
| JP-A07: Temporary Visitor | S08 activity definition lists short visits for tourism, recreation, sports, relatives, inspections, courses/meetings, business contacts and analogous activities. Its general periods are 90, 30 or 15 days, or an individually specified period up to 90 days. | This general status catalogue is not a country-specific promise that every Swiss traveller receives 90 days. Course participation is not an unrestricted study authorization. |
| JP-A08: extension reconciliation | S08 extension section generally requires compelling humanitarian or equivalent special circumstances. R12 Note 2 names Switzerland for 90 days on arrival and application for a further 90 days. | Neither removes R01's Swiss bilateral exception. The relationship of the general ISA condition to that exception, and “further 90 days” to “six months”, is not resolved by unit conversion or a model-selected winner. Full extension semantics remain unclosed. |
| JP-A09: passport validity | R06 “Did you know that?” requires passport validity throughout the stay and expressly says six months' remaining validity on entry is unnecessary. | A candidate `valid_through_stay` atom has positive embassy support. It does not by itself establish the complete exemption, passport-class mapping or every document-admissibility condition. |
| JP-A10: blank pages | R05 asks visa applicants for two completely blank facing pages. | Application scope cannot become a blanket visa-exempt border-entry requirement. `minimumPages=2` would also drop the facing-page condition. No accepted blank-page fact results. |
| JP-A11: arrival form | R06 describes Visit Japan Web as saving arrival time. | This does not prove either a mandatory electronic authorization/form or “no arrival form required”. No positive regulatory fact is extracted from this wording. |
| JP-A12: transit | No relied-upon clause establishes the complete airside/landside transit conditions for the requested cell. | `transit_conditions` remains unestablished. Silence cannot become “no transit visa” or an airport/connection rule. |
| JP-A13: visa validity versus stay | R06 distinguishes the single-entry visa's three-month entry window from issue from the landing permission granted on entry. | These visa-application facts are not the exempt visitor's permitted stay. Never attach the issuance anchor to JP-A02. |
| JP-A14: border decision and supporting documents | R12 Note 1 retains entry discretion and advises evidence such as onward/return arrangements, host details and funds. | Advice and potential scrutiny are not automatically universal, individually mandatory document requirements. Visa exemption is not permission to enter or guaranteed landing duration. |

The positive core is therefore stronger than an absence-based inference, but narrower than an unconditional `CH + ordinary_passport + JP → not_required`. The original cell contains no purpose, activity declaration, stay length or verified passport-to-citizenship link. Those values remain missing; they are not silently supplied by the auditor.

## 4. One item or composition

R01 can support an `explicit_primary_statement` for the listed-country waiver and its own period/footnote statements. It cannot alone carry the complete document-class and purpose/activity semantics. R04 alone lacks the country enumeration and passport detail. R07 alone omits the current initial-landing/extension procedure and is archival. R12 carries several relevant conditions but does not close document identity, all current extension semantics or the technical profile gap. No inspected single item satisfies the complete-cell question.

A complete claim would need separately traceable support for inclusion/consequence, eligibility/activity, document scope and duration. This is a **composition need**, not an approved composition policy. Current content identity identifies support by the ordered pair `(sourceId, contentItemId)`: two MOFA pages may be different items under one authority. Conversely, English/Japanese pages cannot automatically be counted as independent supporting items or collapsed into one item; their representation relationship first needs a verified descriptor/profile. Audit receipt IDs do not solve that question.

The inventory has twelve successful sources for research and contradiction checks. It is not a proposed twelve-support claim. The eight-support limit is not proven to be the blocker: a smaller qualified support set may fit numerically, while semantic and identity gaps still prevent acceptance.

## 5. Existing fact/schema fit, read-only at the baseline

| Current contract | What it can express | Material loss or boundary |
| --- | --- | --- |
| [Applicability predicates](../lib/readiness/regulierungs-anwendbarkeit.ts), `RegulierungsPraedikat` and `RegulierungsKontext` | Explicit citizenship, document class, issuing country, credential/citizenship link, enumerated purpose, missing facts. | No stay-duration predicate or remuneration/profit-making-activity predicate. `business`, `visitor` and `not work` do not encode JP-A04. No residence assumption is justified. |
| [Requirement-effect contract](../lib/readiness/regulierungs-anwendbarkeit.ts), `AnforderungswirkungFakt`, and [rule claims](../lib/readiness/rule-claims.ts) | Positive `not_required` / `visa_exempt` in the applicable effect vocabulary; schema-1 branches for supported predicates. | The full eligibility condition is not expressible. Flattening to a bare exemption loses restrictions; an `otherwise required` branch would invent a negative rule. |
| [Stay fact](../lib/readiness/rule-claims.ts), `RegelAufenthalt` and strict `stay_limit` reader | `initialGrant` and `maximumTotal` retain different day/month units; application-required boolean; border discretion. | No explicit landing-permission event anchor, extension filing deadline/authority, activity qualification or applicability field on this fact. Two numerical fields cannot preserve the entire statement. Strict extra-key rejection prevents hiding qualifiers in ad hoc fields. |
| [Temporal contract](../lib/readiness/temporal.ts), `OfficialTemporalAnchor` | Departure, destination arrival, transit arrival and border crossing, with minute offsets. | No expiry of the actually granted stay. “Before current permission expires” cannot become arrival+90×24 hours or a known landing-grant timestamp without unsupported assumptions. |
| [Passport/pages facts](../lib/readiness/rule-claims.ts) | `passport_validity` can express `valid_through_stay`; `blank_passport_pages` holds a minimum number. | Page adjacency and visa-application-only applicability are not preserved by a number. JP-A10 is not an exempt-entry rule in the first place. |
| [Official actions](../lib/readiness/rule-claims.ts) | Source-bound official action URLs/purposes. | A link alone cannot supply the extension's deadline, eligibility or outcome, or make optional arrival convenience mandatory. |
| [Store gate](../lib/readiness/official-truth-store-server.ts), `istPersistierbarerRegelFakt` | Rejects schema-1 applicability-bearing requirement/visa-option facts from existing persistence. | Dormant in-memory expressibility is not existing accepted persistence. This is a read-only code observation; no DB was accessed or schema change proposed. |

The distinction between a useful partial atom and a lossless complete fact is decisive. There is no approved route in this audit to discard qualifiers, manufacture unknown values, redefine a purpose enum, or join facts through free text.

## 6. Retrieval, content identity and current admission limits

Baseline code references: [server-owned retrieval](../lib/readiness/official-truth-server-owned-retrieval.ts), [content identity](../lib/readiness/official-truth-content-identity.ts), [evidence hashing](../lib/readiness/evidence.ts), [extractor registry](../lib/readiness/official-truth-trusted-fact-extractor-registry.ts), [composition registry](../lib/readiness/official-truth-composition-policy-registry.ts).

| Boundary | Observed result and consequence |
| --- | --- |
| Full body ceiling | Retrieval limits the declared/streamed body to 65,536 bytes, with 10,000 ms timeout and at most five redirects. Successful audited HTML bodies are 15,260–43,440 decoded bytes; S08 is 29,205 unencoded bytes. Size alone does not reject those snapshots. |
| PDF | R07 is **385,852 bytes**, eight scanned pages, `application/pdf`. It exceeds the body ceiling and cannot satisfy the current fatal UTF-8 text path. No clipping, OCR excerpt, browser viewer HTML, lossy summary or limit increase is an approved replacement representation. |
| Transport | Direct public HTTP probes returned 403 for the MOFA/Geneva resources and 200 for S08. Normal browser loads yielded complete official pages. This is an observed client/environment discrepancy, not proof of a permanent global block. No production Jetnity retrieval was run. The browser result does not establish compatibility with the server's fixed headers, public-address pinning and exact-authority checks. |
| Body hash versus wire hash | R-series HTML hashes cover the entire browser-provided content-decoded body, encoded as UTF-8, not a selected DOM, excerpt or compressed gzip wire stream. Complete compressed-wire bytes were unavailable from that interface. S08 and R07 hashes cover the complete unencoded bytes. This limitation is explicit; no transport-level byte identity is claimed for gzip responses. |
| Existing content hash | Jetnity's `sourceContentHash` normalizes CRLF/CR to LF before hashing the full snapshot. Ledger hashes retain the complete captured bytes. They are not interchangeable, and no ledger hash is represented as accepted Evidence identity. |
| Identity | Descriptors require source/item/representation/version bindings, expected publisher/authority IDs, exact request/final URLs, media, locale/schema and a code-owned profile verification. The only registered profile inspected is the GOV.UK ETA Content API profile; it is not applicable to MOFA/ISA HTML/PDF. |
| Observed HTML metadata | R01/R02 contain titles and `og:url`; embassy pages expose title/index links. These are useful drift observations, not a verified publisher-issued immutable item/version binding. A URL, state-looking hostname, title or response hash alone is insufficient. No JP profile or already-approved substitute was found. |
| Registry and bounds | Extractor and composition production registries remain empty. Item/representation/profile limits are 1,024/4,096/128; request URLs 16, publisher IDs 8, support refs 8. Their numerical headroom does not authorize registration or prove identity. |

The source family therefore does not currently pass the technical admission question. Even if a future official HTML item replaced the treaty, missing JP identity verification and exact semantic representation would remain. These are audit findings only; no source registration, profile activation, extractor, composition policy, test fixture, runtime edit or acceptance operation is performed.

## 7. Minimum unresolved gaps and evidence needed

| Gap | Smallest exact missing evidence or contract capability |
| --- | --- |
| Eligibility is not lossless | Preserve an explicit permitted-purpose condition together with the independently explicit no-remuneration/no-profit-operation restriction, and a duration eligibility bound. The official restrictions are already present in R04/R10. More copies of the nationality list cannot repair the current predicate vocabulary. Any contract decision requires separate TL authorization. |
| Document-class/currentness binding | A current Japanese state statement directly tying this waiver to valid ordinary Swiss national passports, or an authoritative current linkage and class mapping to R07, would close the weak bridge between a current untyped country row and the archived national-passport clause. No issuer/citizenship substitution is acceptable. |
| Exact extension semantics | A current MOFA/ISA Swiss-specific explanation reconciling the general humanitarian extension caveat, the six-month bilateral maximum and R12's further-90-day wording, while retaining application-before-expiry. The model also needs the actual permitted-period-expiry anchor to preserve that deadline. |
| Approved full-body retrieval and identity | A bounded, current official representation carrying the needed document-scope clauses and verifiable content identity, plus evidence that the approved server path can retrieve its whole body under the existing media/byte rules. R07 cannot pass by truncation. A successful human/browser read does not fill this gap. No approved Japanese identity path exists in the inspected code. |
| Optional axes | A blank-page entry rule, arrival-form obligation or transit rule would each need an explicit, applicable official statement. Their absence here must remain unknown/unestablished, not a negative rule. They are not invented prerequisites for the narrow positive visa atom. |

Even a deliberately narrower initial-visit atom would still need the activity/duration qualifications and JP identity path. This audit neither selects that as a follow-up nor begins its design.

## 8. Drift guards required before any later deterministic extractor

These are audit acceptance requirements, not parser code, a schema proposal or a future test suite.

1. Bind the approved source/item/representation/profile versions and exact official request/final URLs; reject unexpected redirects, media, locales, identity metadata, error pages and PDF-viewer wrappers. Require full-body completion under the current byte/time bounds; never truncate or turn 403 into a source snapshot.
2. Require one unambiguous Switzerland/スイス country entry in the intended exemption table and its positive governing exemption clause. A missing/duplicate/moved entry or changed consequence is a fail-closed review event, never proof of visa-required status.
3. Follow the row's actual footnote association, not a hard-coded ordinal divorced from the row. Guard country-specific passport exceptions and the nonordinary class boundary; another country's ePassport/MRP condition cannot silently migrate to CH or disappear through defaulting.
4. Retain every needed purpose and activity exclusion. Additions, deletions, negation changes, mixed permissions, exceptions or contradiction between official representations must prevent a complete fact from being emitted.
5. Keep units and events intact: 90 days, six months, landing permission, application before permitted-period expiry. Distinguish visa issuance/entry validity from stay, and central maximum from embassy wording. No rounding, day/month conversion or guessed end-of-day arithmetic.
6. Pin clause-level support to each fact/condition/branch. Revalidate the exact same-content-item or multi-item relationship under the identity contract; a shared MOFA domain or translated page is not sufficient. New cross-item support requires separately authorized review.
7. Watch official suspension/termination notices and passport/purpose changes; an old archive or unchanged page title is insufficient freshness evidence. Preserve retrieval time, official displayed update and any actual effective date separately. Use no invented refresh SLA or automatic acceptance rule.
8. Treat unresolved official-source conflicts and unsupported schema fields as review/block outcomes. Do not silently privilege a translation, flatten to a less qualified assertion, infer the complementary rule, or promote research into accepted truth.

## 9. Retrieval ledger

The following entries persist metadata and structured paraphrase only. No raw government response, PDF, screenshot, HTML fixture or local retrieval helper is committed. Request URLs are tracking-free. For every successful receipt, `finalUrl` equals its explicitly recorded request URL; there were zero redirects. Start/finish refer to the document request through response completion, in UTC. Browser finish timestamps use the request wall clock plus the network monotonic elapsed interval. The full captured bodies were hashed locally and their length/SHA rechecked before committing.

`hashScope` is deliberately explicit. A browser-decoded HTML receipt does not assert the unavailable compressed-wire SHA-256 or prove that the current Jetnity retrieval client would receive identical bytes. This open transport-provenance limitation contributes to the technical NOT_READY finding. HTTP Last-Modified/ETag are observations, not legal effective dates or sufficient identity verification.

### Successful official-source receipts

```json
[
  {
    "sourceId": "R01",
    "requestUrl": "https://www.mofa.go.jp/j_info/visit/visa/short/novisa.html",
    "finalUrl": "https://www.mofa.go.jp/j_info/visit/visa/short/novisa.html",
    "httpStatus": 200,
    "contentType": "text/html",
    "contentEncoding": "gzip",
    "retrievalStartedAt": "2026-10-05T18:00:36.132Z",
    "retrievalFinishedAt": "2026-10-05T18:00:36.149Z",
    "byteCount": 26479,
    "responseSha256": "3608ea8671f93f924239cb4a49b0e8a686bc751f55511187362162ed961ce462",
    "hashScope": "complete CDP response body after browser content-decoding; not compressed wire bytes",
    "redirectCount": 0,
    "redirectChain": [],
    "lastModified": "Sun, 21 Jun 2026 16:57:24 GMT",
    "etag": "\"01c2822e4142a1022ea14a8384d1393c\"",
    "fromDiskCache": false,
    "fromServiceWorker": false
  },
  {
    "sourceId": "R02",
    "requestUrl": "https://www.mofa.go.jp/mofaj/toko/visa/tanki/novisa.html",
    "finalUrl": "https://www.mofa.go.jp/mofaj/toko/visa/tanki/novisa.html",
    "httpStatus": 200,
    "contentType": "text/html",
    "contentEncoding": "gzip",
    "retrievalStartedAt": "2026-10-05T18:01:44.501Z",
    "retrievalFinishedAt": "2026-10-05T18:01:44.755Z",
    "byteCount": 31857,
    "responseSha256": "c82354d1b211d7e6844a724db6fb6b92523668e0a9958da12ef216912c9b07e3",
    "hashScope": "complete CDP response body after browser content-decoding; not compressed wire bytes",
    "redirectCount": 0,
    "redirectChain": [],
    "lastModified": "Tue, 30 Sep 2025 08:28:31 GMT",
    "etag": "\"b95d7b7dad10d95b0e57c34b2445c77f\"",
    "fromDiskCache": false,
    "fromServiceWorker": false
  },
  {
    "sourceId": "R03",
    "requestUrl": "https://www.mofa.go.jp/j_info/visit/visa/",
    "finalUrl": "https://www.mofa.go.jp/j_info/visit/visa/",
    "httpStatus": 200,
    "contentType": "text/html",
    "contentEncoding": "gzip",
    "retrievalStartedAt": "2026-10-05T18:01:45.400Z",
    "retrievalFinishedAt": "2026-10-05T18:01:45.638Z",
    "byteCount": 33823,
    "responseSha256": "c7662cabf3f0dcb3ce05700260e73a8ca4d169a00c710ae2e1f72f79ccfe6875",
    "hashScope": "complete CDP response body after browser content-decoding; not compressed wire bytes",
    "redirectCount": 0,
    "redirectChain": [],
    "lastModified": "Wed, 24 Jun 2026 07:01:35 GMT",
    "etag": "\"571ab35d714dae02b9a073e01d96233f\"",
    "fromDiskCache": false,
    "fromServiceWorker": false
  },
  {
    "sourceId": "R04",
    "requestUrl": "https://www.mofa.go.jp/j_info/visit/visa/faq.html",
    "finalUrl": "https://www.mofa.go.jp/j_info/visit/visa/faq.html",
    "httpStatus": 200,
    "contentType": "text/html",
    "contentEncoding": "gzip",
    "retrievalStartedAt": "2026-10-05T18:02:16.557Z",
    "retrievalFinishedAt": "2026-10-05T18:02:16.573Z",
    "byteCount": 34132,
    "responseSha256": "dbfb355367f62924402fe3682c064f60d40aaf2b2480d96e1aa84b2399194dff",
    "hashScope": "complete CDP response body after browser content-decoding; not compressed wire bytes",
    "redirectCount": 0,
    "redirectChain": [],
    "lastModified": "Sun, 21 Jun 2026 17:26:27 GMT",
    "etag": "\"856b2c326fa211aa7aa07eb9275a011c\"",
    "fromDiskCache": false,
    "fromServiceWorker": false
  },
  {
    "sourceId": "R05",
    "requestUrl": "https://www.geneve.ch.emb-japan.go.jp/itpr_fr/visa.html",
    "finalUrl": "https://www.geneve.ch.emb-japan.go.jp/itpr_fr/visa.html",
    "httpStatus": 200,
    "contentType": "text/html",
    "contentEncoding": "gzip",
    "retrievalStartedAt": "2026-10-05T18:03:05.675Z",
    "retrievalFinishedAt": "2026-10-05T18:03:05.690Z",
    "byteCount": 15260,
    "responseSha256": "bf5abdd16d82c70cbd29020c15bfb73c2c003af051b3e828659d275868eaea32",
    "hashScope": "complete CDP response body after browser content-decoding; not compressed wire bytes",
    "redirectCount": 0,
    "redirectChain": [],
    "lastModified": "Tue, 22 Jul 2025 10:14:12 GMT",
    "etag": "\"0f29f423d81dd1b9f43f42d0f613f02b\"",
    "fromDiskCache": false,
    "fromServiceWorker": false
  },
  {
    "sourceId": "R06",
    "requestUrl": "https://www.geneve.ch.emb-japan.go.jp/itpr_fr/visa_00001.html",
    "finalUrl": "https://www.geneve.ch.emb-japan.go.jp/itpr_fr/visa_00001.html",
    "httpStatus": 200,
    "contentType": "text/html",
    "contentEncoding": "gzip",
    "retrievalStartedAt": "2026-10-05T18:02:42.656Z",
    "retrievalFinishedAt": "2026-10-05T18:02:42.964Z",
    "byteCount": 27132,
    "responseSha256": "4b49f4035d93cd01116116164bad961a8b4e035f586435da15932ad02457b7cb",
    "hashScope": "complete CDP response body after browser content-decoding; not compressed wire bytes",
    "redirectCount": 0,
    "redirectChain": [],
    "lastModified": "Mon, 18 Aug 2025 09:11:04 GMT",
    "etag": "\"05f66f0599c63bdb2ef1aad4feda044f\"",
    "fromDiskCache": false,
    "fromServiceWorker": false
  },
  {
    "sourceId": "R07",
    "requestUrl": "https://www.mofa.go.jp/mofaj/gaiko/treaty/pdfs/A-S38%282%29-157.pdf",
    "finalUrl": "https://www.mofa.go.jp/mofaj/gaiko/treaty/pdfs/A-S38%282%29-157.pdf",
    "httpStatus": 200,
    "contentType": "application/pdf",
    "contentEncoding": null,
    "retrievalStartedAt": "2026-10-05T18:03:16.014Z",
    "retrievalFinishedAt": "2026-10-05T18:03:16.440Z",
    "byteCount": 385852,
    "responseSha256": "9b08a2b2d18efbe82d9ea79c3792e5d60d3f05349eb0728571c02627f118a75a",
    "hashScope": "complete original PDF resource bytes via Page.getResourceContent; HTTP Content-Encoding absent; viewer HTML rejected",
    "redirectCount": 0,
    "redirectChain": [],
    "lastModified": "Thu, 30 Jan 2020 12:44:25 GMT",
    "etag": "\"fda8dd491011cf1ff72e1dfaea8eb0e2\"",
    "fromDiskCache": false,
    "fromServiceWorker": false
  },
  {
    "sourceId": "S08",
    "requestUrl": "https://www.moj.go.jp/isa/applications/status/temporaryvisitor.html",
    "finalUrl": "https://www.moj.go.jp/isa/applications/status/temporaryvisitor.html",
    "httpStatus": 200,
    "contentType": "text/html",
    "contentEncoding": null,
    "retrievalStartedAt": "2026-10-05T17:58:19.428997Z",
    "retrievalFinishedAt": "2026-10-05T17:58:19.764970Z",
    "byteCount": 29205,
    "responseSha256": "2b516a4ce2a4b808232a53245d61d444ddc30b93082334f52c3ab571c8278ba2",
    "redirectCount": 0,
    "redirectChain": [],
    "lastModified": "Mon, 31 Aug 2026 15:15:35 GMT",
    "etag": "\"7215-65a59461a93c0\"",
    "hashScope": "complete received unencoded response body; byte-exact"
  },
  {
    "sourceId": "R09",
    "requestUrl": "https://www.mofa.go.jp/j_info/visit/visa/short/other_visa.html",
    "finalUrl": "https://www.mofa.go.jp/j_info/visit/visa/short/other_visa.html",
    "httpStatus": 200,
    "contentType": "text/html",
    "contentEncoding": "gzip",
    "retrievalStartedAt": "2026-10-05T18:03:15.546Z",
    "retrievalFinishedAt": "2026-10-05T18:03:15.562Z",
    "byteCount": 20697,
    "responseSha256": "07e5ec40cda8006bab6ea6d1f4eacb85079f7c98865a2a3e5777d3c76c4ba00e",
    "hashScope": "complete CDP response body after browser content-decoding; not compressed wire bytes",
    "redirectCount": 0,
    "redirectChain": [],
    "lastModified": "Sun, 21 Jun 2026 15:50:34 GMT",
    "etag": "\"cfeda28aec1d7845bfd2489c005d915b\"",
    "fromDiskCache": false,
    "fromServiceWorker": false
  },
  {
    "sourceId": "R10",
    "requestUrl": "https://www.mofa.go.jp/mofaj/toko/visa/index.html",
    "finalUrl": "https://www.mofa.go.jp/mofaj/toko/visa/index.html",
    "httpStatus": 200,
    "contentType": "text/html",
    "contentEncoding": "gzip",
    "retrievalStartedAt": "2026-10-05T18:03:06.084Z",
    "retrievalFinishedAt": "2026-10-05T18:03:06.326Z",
    "byteCount": 43440,
    "responseSha256": "53e7f5dae29614fd5efb77240e6abb7fed366a6ac4a6f2cb663a421aa0b2a202",
    "hashScope": "complete CDP response body after browser content-decoding; not compressed wire bytes",
    "redirectCount": 0,
    "redirectChain": [],
    "lastModified": "Wed, 24 Jun 2026 07:12:58 GMT",
    "etag": "\"4a02d49910aa4dc24fd5ec34a6c8f8cb\"",
    "fromDiskCache": false,
    "fromServiceWorker": false
  },
  {
    "sourceId": "R11",
    "requestUrl": "https://www.mofa.go.jp/ca/fna/page22e_000692.html",
    "finalUrl": "https://www.mofa.go.jp/ca/fna/page22e_000692.html",
    "httpStatus": 200,
    "contentType": "text/html",
    "contentEncoding": "gzip",
    "retrievalStartedAt": "2026-10-05T18:03:15.702Z",
    "retrievalFinishedAt": "2026-10-05T18:03:15.942Z",
    "byteCount": 25069,
    "responseSha256": "332bbfd2909c964ce9779c46def1e3c6aacd4586f5f38aaeac51901d5b404677",
    "hashScope": "complete CDP response body after browser content-decoding; not compressed wire bytes",
    "redirectCount": 0,
    "redirectChain": [],
    "lastModified": "Tue, 01 Sep 2026 15:00:29 GMT",
    "etag": "\"f0aa92f967ff7e1adc1a158a7ea08f6f\"",
    "fromDiskCache": false,
    "fromServiceWorker": false
  },
  {
    "sourceId": "R12",
    "requestUrl": "https://www.uk.emb-japan.go.jp/itpr_en/index_000070.html",
    "finalUrl": "https://www.uk.emb-japan.go.jp/itpr_en/index_000070.html",
    "httpStatus": 200,
    "contentType": "text/html",
    "contentEncoding": "gzip",
    "retrievalStartedAt": "2026-10-05T18:09:25.040Z",
    "retrievalFinishedAt": "2026-10-05T18:09:25.087Z",
    "byteCount": 16155,
    "responseSha256": "0343f45472bcf5dcc16035aed5a9c90863095e00a57a243e20c4c57dcd217e7a",
    "hashScope": "complete CDP response body after browser content-decoding; not compressed wire bytes",
    "redirectCount": 0,
    "redirectChain": [],
    "lastModified": "Tue, 30 Jun 2026 17:04:55 GMT",
    "etag": "\"cedd87964238a7a35bd4f8a303ba5546\"",
    "fromDiskCache": false,
    "fromServiceWorker": false
  }
]
```

### Direct-client failure receipts

These nine initial full-body responses are retained as failed-retrieval metadata, not as normative sources. They demonstrate why browser success was not treated as server admission. S01–S07/S09/S10 correspond to R01–R07/R09/R10. Additional curl diagnostics also returned 403 and supplied no regulatory evidence.

```json
[
  {
    "sourceId": "S01",
    "requestUrl": "https://www.mofa.go.jp/j_info/visit/visa/short/novisa.html",
    "finalUrl": "https://www.mofa.go.jp/j_info/visit/visa/short/novisa.html",
    "httpStatus": 403,
    "contentType": "text/html",
    "contentEncoding": null,
    "retrievalStartedAt": "2026-10-05T17:58:19.347727Z",
    "retrievalFinishedAt": "2026-10-05T17:58:19.421204Z",
    "byteCount": 431,
    "responseSha256": "e5833bf090a59b18316957591433366b29803d3ecea44b9a03b7bdf793818eb3",
    "redirectCount": 0,
    "redirectChain": [],
    "lastModified": null,
    "etag": null,
    "hashScope": "complete received HTTP error body; not official rule content"
  },
  {
    "sourceId": "S02",
    "requestUrl": "https://www.mofa.go.jp/mofaj/toko/visa/tanki/novisa.html",
    "finalUrl": "https://www.mofa.go.jp/mofaj/toko/visa/tanki/novisa.html",
    "httpStatus": 403,
    "contentType": "text/html",
    "contentEncoding": null,
    "retrievalStartedAt": "2026-10-05T17:58:19.346632Z",
    "retrievalFinishedAt": "2026-10-05T17:58:19.422460Z",
    "byteCount": 425,
    "responseSha256": "e8a34011f39b3100de1c93a2030576ed1b8ace90da0472baf84866599dfeb5ee",
    "redirectCount": 0,
    "redirectChain": [],
    "lastModified": null,
    "etag": null,
    "hashScope": "complete received HTTP error body; not official rule content"
  },
  {
    "sourceId": "S03",
    "requestUrl": "https://www.mofa.go.jp/j_info/visit/visa/",
    "finalUrl": "https://www.mofa.go.jp/j_info/visit/visa/",
    "httpStatus": 403,
    "contentType": "text/html",
    "contentEncoding": null,
    "retrievalStartedAt": "2026-10-05T17:58:19.347470Z",
    "retrievalFinishedAt": "2026-10-05T17:58:19.421937Z",
    "byteCount": 406,
    "responseSha256": "3855a4be88ac98d64089b8f811f36e5ee59201c408721979cc3f33cfc867656d",
    "redirectCount": 0,
    "redirectChain": [],
    "lastModified": null,
    "etag": null,
    "hashScope": "complete received HTTP error body; not official rule content"
  },
  {
    "sourceId": "S04",
    "requestUrl": "https://www.mofa.go.jp/j_info/visit/visa/faq.html",
    "finalUrl": "https://www.mofa.go.jp/j_info/visit/visa/faq.html",
    "httpStatus": 403,
    "contentType": "text/html",
    "contentEncoding": null,
    "retrievalStartedAt": "2026-10-05T17:58:19.347618Z",
    "retrievalFinishedAt": "2026-10-05T17:58:19.422979Z",
    "byteCount": 418,
    "responseSha256": "8a9162430d20e7405c554181790893ec25219976a1a435ad970eee34511709f7",
    "redirectCount": 0,
    "redirectChain": [],
    "lastModified": null,
    "etag": null,
    "hashScope": "complete received HTTP error body; not official rule content"
  },
  {
    "sourceId": "S05",
    "requestUrl": "https://www.geneve.ch.emb-japan.go.jp/itpr_fr/visa.html",
    "finalUrl": "https://www.geneve.ch.emb-japan.go.jp/itpr_fr/visa.html",
    "httpStatus": 403,
    "contentType": "text/html",
    "contentEncoding": null,
    "retrievalStartedAt": "2026-10-05T17:58:19.424333Z",
    "retrievalFinishedAt": "2026-10-05T17:58:19.531606Z",
    "byteCount": 426,
    "responseSha256": "6a231d790d4ae134b0126db19fbdb8b129ba679a6fd463fafc08586040825be3",
    "redirectCount": 0,
    "redirectChain": [],
    "lastModified": null,
    "etag": null,
    "hashScope": "complete received HTTP error body; not official rule content"
  },
  {
    "sourceId": "S06",
    "requestUrl": "https://www.geneve.ch.emb-japan.go.jp/itpr_fr/visa_00001.html",
    "finalUrl": "https://www.geneve.ch.emb-japan.go.jp/itpr_fr/visa_00001.html",
    "httpStatus": 403,
    "contentType": "text/html",
    "contentEncoding": null,
    "retrievalStartedAt": "2026-10-05T17:58:19.424973Z",
    "retrievalFinishedAt": "2026-10-05T17:58:19.531011Z",
    "byteCount": 436,
    "responseSha256": "49c5bd4e59439325ab1ac9cf7d9f4c4df620d19478dbc58ea5eda58694c17928",
    "redirectCount": 0,
    "redirectChain": [],
    "lastModified": null,
    "etag": null,
    "hashScope": "complete received HTTP error body; not official rule content"
  },
  {
    "sourceId": "S07",
    "requestUrl": "https://www.mofa.go.jp/mofaj/gaiko/treaty/pdfs/A-S38%282%29-157.pdf",
    "finalUrl": "https://www.mofa.go.jp/mofaj/gaiko/treaty/pdfs/A-S38%282%29-157.pdf",
    "httpStatus": 403,
    "contentType": "text/html",
    "contentEncoding": null,
    "retrievalStartedAt": "2026-10-05T17:58:19.428693Z",
    "retrievalFinishedAt": "2026-10-05T17:58:19.469795Z",
    "byteCount": 452,
    "responseSha256": "bd58f44fc3808cd45e6dfa924bfd42b3d5b48ca20b39d150ab59e3a92ea7094f",
    "redirectCount": 0,
    "redirectChain": [],
    "lastModified": null,
    "etag": null,
    "hashScope": "complete received HTTP error body; not official rule content"
  },
  {
    "sourceId": "S09",
    "requestUrl": "https://www.mofa.go.jp/j_info/visit/visa/short/other_visa.html",
    "finalUrl": "https://www.mofa.go.jp/j_info/visit/visa/short/other_visa.html",
    "httpStatus": 403,
    "contentType": "text/html",
    "contentEncoding": null,
    "retrievalStartedAt": "2026-10-05T17:58:19.470993Z",
    "retrievalFinishedAt": "2026-10-05T17:58:19.508826Z",
    "byteCount": 439,
    "responseSha256": "6ddf459b096c5a1cd6460f1469b7fae98ff13659d5a9f0d87c12e616799252dc",
    "redirectCount": 0,
    "redirectChain": [],
    "lastModified": null,
    "etag": null,
    "hashScope": "complete received HTTP error body; not official rule content"
  },
  {
    "sourceId": "S10",
    "requestUrl": "https://www.mofa.go.jp/mofaj/toko/visa/index.html",
    "finalUrl": "https://www.mofa.go.jp/mofaj/toko/visa/index.html",
    "httpStatus": 403,
    "contentType": "text/html",
    "contentEncoding": null,
    "retrievalStartedAt": "2026-10-05T17:58:19.511503Z",
    "retrievalFinishedAt": "2026-10-05T17:58:19.548385Z",
    "byteCount": 414,
    "responseSha256": "796c7776a86a2b41897eed0082c9f187319565acac094f371a172b1db7eec120",
    "redirectCount": 0,
    "redirectChain": [],
    "lastModified": null,
    "etag": null,
    "hashScope": "complete received HTTP error body; not official rule content"
  }
]
```

## 10. Continuity and STOP

CH-01..CH-10 remain **RESEARCH_ONLY** and **NOT_APPROVED_FOR_DATABASE_IMPORT**. No CH-11 or follow-up is opened. No DB/Supabase, migration, runtime, source registration, profile activation, extractor, composition policy, accepted Evidence, Rule acceptance, F8, B01/Trip Workspace or Production work is included.

Final classification: **JP_FIRST_PILOT_SOURCE_FAMILY_NOT_READY**.

**STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD EXACT-HEAD REVIEW.**
