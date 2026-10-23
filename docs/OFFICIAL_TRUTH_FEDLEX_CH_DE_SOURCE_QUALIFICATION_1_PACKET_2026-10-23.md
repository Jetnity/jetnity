# Fedlex CH–DE source qualification 1 — evidence packet

Date: 23 October 2026
Issue: #977 / Draft PR #978
Writer: **Jetnity Official Truth Fedlex CH-DE Source Qualification 1 — Cursor Generation 1**
Session: https://cursor.com/agents/bc-9b199fb1-5a2e-4e18-b939-632fd811b7e4
`originalModelName=grok-4.7-high-fast`
Immutable TASK blob: `8488a556a73cbdd5367da226170899ac7c2cb74e`

Review-fix V1, same session, against delivery head `e1bb544f518949f17491202047b18432e871f850`. Review-fix V2, same session, corrects D5 continuity only, against `c8fae045c0ddf58264280853de35fdd873109b9b`. Technical Lead evidence decisions D1–D4 in comment `6369439433` stand. This packet is technical source mapping for Technical-Lead review. It is not legal advice, not a traveller result, not source activation, not an accepted Rule, and not Production approval.

## Honest decision

**The corrected evidence is sufficient for Technical-Lead review of the conditional reuse basis and of the enactment status at 23 October 2026.**

Annex I Article 1 was read from the named official German manifestation. A Swiss national who produces a valid passport is inside that rule. The cell’s ordinary-passport, tourism, direct-route, and dated-stay facts are a narrower subset of that rule. The canonical software still cannot encode those four distinctions. That encoding gap is separate from legal coverage.

Platform reuse has a conditional official basis: Copyright Act Article 5, Publications Act Articles 19 and 19a, Publications Ordinance Articles 47 and 49 as read from the 1 July 2022 consolidation, and a directly read Fedlex data-introduction asset that authorises commercial and other reuse under the third-party-user conditions. The generic admin.ch website paragraph is not that basis and is not a request for a permission letter. No letter, contact, terms acceptance, or contract is proposed.

The newest evidenced Fedlex consolidation remains 15 December 2020. A provisional amending protocol was signed on 2 March 2026 and is not in force. Its Article 1 item 14 would replace Annex I only on entry into force. `validFrom` and `validUntil` stay unaccepted. None of this is a positive visa cell.

The immediate next action is Technical-Lead review of D1–D6 below. A second identical treaty GET is dormant. Running it would not finish qualification.

## Existing cell this packet binds

From `chDeVisaResearch` on this branch, the only permitted research declaration is:

- one citizenship, `CH`
- one credential: `passport` / `ordinary_passport`, issuing country `CH`, related citizenship `CH`
- origin `CH`, destination `DE`, no transit, `directJourney: true`
- purpose `tourism`, ordered `travelDate` and `endDate`, residence `CH`

The canonical output is `RESEARCH_GAP` / `requirement_effect` / `visa`, with `accepted: false` and null `validFrom`, `validUntil`, and `sourceCheckedAt`. Predicates the canonical scope still cannot encode: `ordinary_document_subclass`, `purpose`, `direct_route`, `stay_end`. Swiss residence is not Swiss citizenship. Departure country is not citizenship. Application contracts are an empty frozen list. `applicationPilotAvailable()` returns false. `requirementsProviderAus()` returns null. Prior repository research already pointed at CELEX `22002A0430(01)` and left the current consolidated text a research gap. This packet does not reuse that EUR-Lex page.

## What was read

Two windows, both on 23 October 2026. User-Agent `JetnityOfficialTruthFedlexQualification1/1.0`. No login, no API key, no terms acceptance, no challenge bypass.

The first window, 2026-10-23T15:36:22Z to 2026-10-23T15:40:34Z, read the treaty manifestation and the Copyright Act. During this review the Technical Lead’s retrieval tool could not open those two HTML URLs. This correction did not re-fetch them through any tool, mirror, proxy, other representation, or operator. Those two receipts stay historical author evidence.

The second window, about 2026-10-23T16:00:50Z to 2026-10-23T16:02:51Z, read the publication-law consolidations, the static introduction asset, the EDA package page, the provisional protocol PDF, and the Parliament page. WebSearch the same afternoon returned index text only. An index snippet is not a current-body hash.

| Evidence | Exact identity | What it supports | Status |
| --- | --- | --- | --- |
| Cell | `chDeVisaResearch` declaration above | Product scope only. Declarations are not legal facts. | Bound, still `RESEARCH_GAP` |
| Work | `https://fedlex.data.admin.ch/eli/cc/2002/243` | `jolux:Work` / `ConsolidationAbstract`. `historicalLegalId` `0.142.112.681`. `dateDocument` 1999-06-21. `dateEntryInForce` and `firstPublicationDate` 2002-06-01. `basicAct` `eli/oc/2002/243`. Dossier `19994648`. `inForceStatus` `enforcement-status/0`. | Metadata read. In-force label is on this abstract work, not on the consolidation version resource. |
| In-force label | `vocabulary/enforcement-status/0` `skos:prefLabel` | `In Kraft`, `In force`, `En vigueur`, `In vigore`, `En vigur`. | Label read. It does not date the Annex I sentence. |
| Document-type label | `vocabulary/resource-type/31` | “Bilateral international treaty” and the DE/FR/IT/RM labels. | Vocabulary label only. The read title is the Community and its Member States, not a two-state treaty. Germany is named in the preamble of the read text. |
| Publisher | `vocabulary/legal-institution/2` | Federal Chancellery / Bundeskanzlei. `rightsHolder` of the HTML manifestation. No `jolux:rights` value returned. | Publisher identified. The use basis is section C, not this missing predicate. |
| Consolidations | 18 `isMemberOf` members, count query returned 18, zero members lacked `dateApplicability` | Newest `dateApplicability` is 2020-12-15: `eli/cc/2002/243/20201215`. Older dates run back to 2002-06-01. | Set complete under `LIMIT 20`. This set’s newest date is a provenance fact, not a defect. |
| RDF date resource | `eli/cc/2002/243/20260101` | SPARQL returned 0 triples. | That exact RDF version resource was not evidenced. The result does not say what the UI parameter `version=20260101` does. It may select the law as of a date. No further UI experiment. |
| Indexed shell | `https://www.fedlex.admin.ch/eli/cc/2002/243/de?version=20260101` | HTTP 200, 77,151 bytes, ETag `4143594003`, `Last-Modified` Thu, 15 Oct 2026 18:13:58 GMT. Byte-identical to the other Fedlex application shells read the same day. Visible text is the JavaScript-required notice. | Shell read. The shell does not show how the UI applies the parameter. Shell date is not legal status. |
| German expression | `eli/cc/2002/243/20201215/de` | Language DEU. Embodied by `html`, `xml`, `pdf-a`, `doc`, `docx`. | Expression identified. |
| Current HTML manifestation | `jolux:isExemplifiedBy` → data-host `.../de/html/...-html-9.html` | Historical public read on `www.fedlex.admin.ch` (robots allow `/`). HTTP 200, `text/html`, 371,444 bytes, `Last-Modified` Fri, 31 Jul 2026 11:26:59 GMT, `Date` Fri, 23 Oct 2026 15:39:41 GMT. SHA-256 `a2d6b9f1a10d7633e49a9d111c7b1a89815d25673d99032e7c430ee460367d25`. Zero `script`, `img`, and `iframe` tags. 163 URLs, all host `fedlex.data.admin.ch`; those links were not followed. | **Historical text receipt. Not re-fetched in this correction.** File time and hash are retrieval identity, not legal force. Data-host `/filestore/*` was not requested. Intranet exemplar URLs were not requested. |
| Consolidation metadata | `eli/cc/2002/243/20201215` | `dateApplicability` 2020-12-15. `publicationDate` 2021-01-20. `dcterms:created` and `modified` 2023-01-18T03:44:19.920281. Family `cc`. Nine non-type predicates; no end-applicability and no in-force property on this version resource. | Dates kept separate below. |
| In-file status | same HTML | Header: SR `0.142.112.681`; `AS 2002 1529`; `BBl 1999 6128`; original text; signed 21 June 1999; in force 1 June 2002; **Stand am 15. Dezember 2020**. The string `2026` does not occur. `Stand am` occurs once. | Text status agrees with `dateApplicability`. A later signed instrument is accounted for in section B. |
| Annex I Art. 1 | HTML id `annex_I/lvl_u1/lvl_I/art_1` | Entry and exit. Quoted below. The named graph has only two subdivisions (`text` and `annex_II`). Annex I exists in the HTML and not as a subdivision resource. | Provision read from the historical manifestation, not from the graph. |
| Agreement Art. 3 | HTML id `art_3` | Entry right exists according to Annex I. | Annex I Art. 1 is the operative entry provision the agreement points at. |
| Annex I Art. 5 | HTML id `annex_I/lvl_u1/lvl_I/art_5` | Public order, security, and health may restrict rights under the agreement. | A limit on the rights. The sentence is not an entry guarantee. |
| Annex I Art. 24 | HTML id `annex_I/lvl_u1/lvl_V/art_24` | Residence permit of at least five years for a non-economically active person who has no other residence right, with means and health-insurance proof. | A different regime. Not applied to this cell. |
| Service 90-day wording | services chapter of the same HTML | “90 Tagen” appears for service providers’ residence-permit exemption. `Touris` does not occur. `Einreisevisum` and `Ausreisevisum` occur only in Annex I Art. 1. | No 90/180 tourist rule is taken from this file. |
| Copyright Act | consolidation `eli/cc/1993/1798_1798_1798/20250701`, HTML `...-html-7.html` on `www.fedlex.admin.ch` | Historical HTTP 200, 194,640 bytes, `Date` Fri, 23 Oct 2026 15:40:34 GMT, `Last-Modified` Mon, 10 Aug 2026 11:38:25 GMT. SHA-256 `6094431ebd06812c9ce1d97711e63b4d8ea041514c5cc22e514be306d1e2cfa5`. In-file SR `231.1`, **Stand am 1. Juli 2025**. Version query was `ORDER BY DESC LIMIT 5`; 2025-07-01 was first. A full URG consolidation count was not taken. | Art. 5 read. **Not re-fetched in this correction.** History of the Act is not fully listed. |
| Publications Act | in-force work `eli/cc/2004/745`, SR `170.512`, `enforcement-status/0`. Newest of 8 consolidations: `.../20230901`. Zero newer. HTML on `www.fedlex.admin.ch`: `...-html-9.html` | HTTP 200, 47,470 bytes, SHA-256 `adf458e030a657b82b132072c6053a86bc36e6f724a595bfba6cd45074974960`, `Last-Modified` Sat, 25 Jan 2025 04:49:32 GMT, `Date` Fri, 23 Oct 2026 16:02:51 GMT. In-file **Stand am 1. September 2023**, act of 18 June 2004. Predecessor `eli/cc/1987/600_600_600`, same SR number, is `enforcement-status/3` (`Nicht mehr in Kraft`). | Arts. 15, 19, and 19a read from this consolidation. |
| Publications Ordinance | in-force work `eli/cc/2015/670`, SR `170.512.1`, `enforcement-status/0`. 5 consolidations. Newest `.../20220701`. Zero newer. HTML `...-html-5.html` | HTTP 200, 73,401 bytes, SHA-256 `43ffc824696d774e3fc9cee4bd5c45b20c080f420f53fc5de671c14676127284`, `Last-Modified` Mon, 27 Jan 2025 04:38:26 GMT, `Date` Fri, 23 Oct 2026 16:02:50 GMT. In-file **Stand am 1. Juli 2022**. | Arts. 47, 48, 49, and 51 read. Art. 48 is repealed in this consolidation. |
| Fedlex data introduction asset | `https://fedlex.data.admin.ch/assets/home/en-CH/01.html` | HTTP 200, `text/html`, 5,484 bytes, SHA-256 `9404d08f1805780221531f53ea0df4026e2d25e381b1499b966a68508792f9c3`, `Last-Modified` Tue, 13 Oct 2026 18:22:45 GMT, `Date` Fri, 23 Oct 2026 16:02:27 GMT. Not under `/filestore/`. | **Direct body.** Commercial-reuse sentence quoted in section C. This is not a hash of the SPA route. |
| Fedlex SPA routes | `https://www.fedlex.admin.ch/en/legal-information`, `https://www.fedlex.admin.ch/de/broadcasters`, `https://fedlex.data.admin.ch/`, and the intro/convention routes | Legal-information and broadcasters: HTTP 200, 77,151 bytes, SHA-256 `39d0c4d52bf6c1140a7d5b1848e1a625375891aecc22869089e1361f1fd8b3be`, ETag `4143594003`, `Last-Modified` Thu, 15 Oct 2026 18:13:58 GMT. Data root and intro: 9,148 bytes, SHA-256 `67ef6948509ab1827f885d4e4890d72fdd864e8d0e7ea1c41de2deffdd6dc8b6`, visible text “Casemates”. | Shells read. An empty shell is not a licence prohibition. |
| Search index, same day | `https://www.fedlex.admin.ch/de/legal-information` and `https://www.fedlex.admin.ch/de/broadcasters` | WebSearch returned indexed sections quoted in section C. English `/en/legal-information` search returned the JavaScript notice. `lawbrary.ch` appeared and is not used. | **Index text only. No body hash. No claim that the live SPA was extracted.** |
| EDA package page | `https://www.europa.eda.admin.ch/de/botschaft-paket-schweiz-eu` | HTTP 200, 326,653 bytes, SHA-256 `f2b30dcf280a90392df60c0d2b1e12020f51cd2d41b4474b90d3a757e6cb46e0`, `Date` Fri, 23 Oct 2026 16:01:08 GMT. Published 13 March 2026. | Direct page read. The 7.20 MB Botschaft PDF was not downloaded. |
| Amending protocol | `https://www.europa.eda.admin.ch/dam/de/sd-web/csfQfQLq3dj9/01.%20%C3%84P-FZA%20(DE).pdf` | HTTP 200, `application/pdf`, 1,005,200 bytes, SHA-256 `4654b0b2de35f515e2d0e79611bac063cd377b0b0332f5c8d7cfde54b1e7b3f2`, `Last-Modified` Tue, 10 Mar 2026 14:19:57 GMT. Text extracted locally with `pdftotext`. That tool is not a repository dependency. | Direct PDF read. Provisional. Not a Fedlex consolidation. |
| Fedlex lookup for the protocol | SPARQL select of subject and title filtered by `dateDocument` `2026-03-02` | Zero bindings. Result body 121 bytes. | This query found no work with that document date. It is not a certificate that no Fedlex record exists under another identifier. |
| Parliament page | `https://www.parlament.ch/de/services/suche-news/das_parlament_und_das_verhandlungsmandat_mit_der_eu` | HTTP 200, 199,702 bytes, SHA-256 `8c72294cce4a94b1df7fdb3ca2daa81726f535a7a4a534e6582cf6306e030272`, `Date` Fri, 23 Oct 2026 16:01:10 GMT. | Direct page read. Media headlines on the page were not opened as separate releases. |
| LINDAS description | `https://ld.admin.ch/data-usage/fedlex/` | HTTP 200, 28,495 bytes, `text/html`, `x-robots-tag: noindex`. Visible text: Fedlex publishes the Official Compilation, the Classified Compilation including international texts, and documents SPARQL `https://fedlex.data.admin.ch/sparqlendpoint` for GET and POST. Links the intro page as “Introduction and licence”. | Description read in the first window. `robots.txt` for this host is `Disallow: /`. This one TASK-named URL was retrieved before that body was inspected. No further `ld.admin.ch` request. |
| Admin website notice | `https://www.admin.ch/en/terms-and-conditions` | HTTP 200. Page title “Privacy Policy”. Copyright paragraph quoted below. | Generic federal-website notice. Not the Fedlex-specific basis. |
| Cellar guide | `https://op.europa.eu/documents/d/cellar/cellar_ml_dataset_guide` | HTTP 200, `application/pdf`, 202,510 bytes, `Last-Modified` Wed, 29 Jan 2025 06:48:39 GMT. | Bytes retrieved in the first window. Text not extracted. Unused. |

Named-graph `dcterms:modified` on `eli/cc/2002/243/graph` was `2021-01-19T14:50:43.611533` inside the content-negotiation Turtle (4,589 bytes). That Turtle is a partial serialization: it stops inside the text subdivision and does not list Annex I. It is not the legal text.

## A. Fact and scope

German text read from Annex I Art. 1 of the historical manifestation above. This is an excerpt for review, not a republication of the agreement.

> Art. 1 Einreise und Ausreise
>
> (1) Die Vertragsparteien gestatten den Staatsangehörigen der anderen Vertragsparteien, deren Familienangehörigen im Sinne des Artikels 3 dieses Anhangs und den entsandten Arbeitnehmern im Sinne des Artikels 17 dieses Anhangs die Einreise in ihr Hoheitsgebiet gegen Vorlage eines gültigen Personalausweises oder Reisepasses.
> Ein Einreisevisum oder ein gleichwertiger Nachweis darf nicht verlangt werden, ausser im Fall von Familienangehörigen und entsandten Arbeitnehmern im Sinne des Artikels 17 dieses Anhangs, die nicht die Staatsangehörigkeit einer Vertragspartei besitzen. Die betreffende Vertragspartei gewährt diesen Personen alle Erleichterungen für die Beschaffung der gegebenenfalls benötigten Visa.
>
> (2) Die Vertragsparteien erkennen den Staatsangehörigen der Vertragsparteien, ihren Familienangehörigen im Sinne des Artikels 3 dieses Anhangs und den entsandten Arbeitnehmern im Sinne des Artikels 17 dieses Anhangs das Recht zu, ihr Hoheitsgebiet gegen Vorlage eines gültigen Personalausweises oder Reisepasses zu verlassen. Sie dürfen von den Staatsangehörigen der anderen Vertragsparteien kein Ausreisevisum und keinen gleichwertigen Nachweis verlangen.
> Die Vertragsparteien stellen ihren Staatsangehörigen gemäss ihren Rechtsvorschriften einen Personalausweis oder einen Reisepass aus, der insbesondere ihre Staatsangehörigkeit angibt, oder verlängern diese Dokumente.
> Der Reisepass muss zumindest für alle Vertragsparteien und für die unmittelbar zwischen den Vertragsparteien liegenden Durchreiseländer gültig sein. Ist die Ausreise nur mit dem Reisepass statthaft, so muss dieser mindestens fünf Jahre gültig sein.

Reading aid, not an official translation: paragraph (1) allows nationals of the other contracting parties to enter on a valid identity card or passport, and says an entry visa or equivalent requirement may not be imposed except for family members and posted workers who are not nationals of a contracting party.

Agreement Art. 3, same file: “Den Staatsangehörigen einer Vertragspartei wird das Recht auf Einreise in das Hoheitsgebiet der anderen Vertragspartei gemäss den in Anhang I festgelegten Bestimmungen eingeräumt.”

The preamble of this same consolidation names the Swiss Confederation and, among the other parties, the Federal Republic of Germany (`die Bundesrepublik Deutschland`). The same list still names the United Kingdom. That list is the 15 December 2020 text. It is not a 2026 membership statement. Germany’s presence in the list is what this cell uses.

What this supports for the existing cell:

- A person who is a national of Switzerland, entering Germany, on production of a valid passport, is in the class for whom paragraph (1) says an entry visa may not be required.
- The ordinary-passport, tourism, direct CH→DE, and ordered-date subset is narrower than that class. Those words do not have to appear in the general rule for the subset to fall inside it. The cell’s Swiss national with a valid passport is inside the rule that was read.
- The stated exception is family members and posted workers who lack a contracting-party nationality. The cell is the Swiss national.
- Annex I Art. 5 says rights under the agreement may be restricted for public order, security, and health.

Separate software gap, unchanged by this correction:

- The canonical scope still cannot encode `ordinary_document_subclass`, `purpose`, `direct_route`, or `stay_end`. That is an encoding limit in Jetnity’s current contract. It is not a finding that the legal rule excludes those facts. No scope codec and no runtime change is made here.

Limits that stay in force for any later acceptance:

- Annex I Art. 5 remains the public-order, security, and health limit.
- This packet makes no 90/180 claim, no residency claim, no working-rights claim, and no general entry guarantee.
- Art. 1(2)’s last two sentences concern the passport’s territorial validity and a five-year validity when exit is permitted only with a passport. They are not a German entry-document rule for this cell.
- Residence in Switzerland is not the legal key. The article uses nationality. Swiss residence remains distinct from Swiss citizenship.
- The cell’s travel dates are not adopted as `validFrom` or `validUntil`. Those fields stay null.
- Art. 24 and the service-provider “90 Tagen” wording were seen and are not applied.

Mapped candidate, still not an accepted fact: for a Swiss national entering Germany on a valid passport, the read sentence supports “entry visa not required”, subject to Annex I Art. 5. The narrower product predicates sit inside that broader rule and remain unencoded in the canonical scope.

## B. Version and provenance

| Layer | Observed value | What it is not |
| --- | --- | --- |
| Work | `eli/cc/2002/243`, SR `0.142.112.681`, dossier `19994648` | Not a file hash |
| Instrument date | 1999-06-21 | Not retrieval time |
| Entry into force of the agreement | 2002-06-01 | Not the consolidation status |
| Language / expression | German, `.../20201215/de` | FR and IT expressions were identified and not read |
| Consolidation version | `.../20201215`, applicability 2020-12-15, in-file “Stand am 15. Dezember 2020” | Newest of the 18 evidenced consolidations. An older date is not invalidity. |
| RDF resource `.../20260101` | 0 triples | Not a finding about the UI parameter `version=20260101` |
| Publication date of that consolidation | 2021-01-20 | Not legal force |
| Metadata created/modified | 2023-01-18T03:44:19.920281 | Not legal force |
| Manifestation | current HTML exemplar `...-html-9.html` | Historical `wasExemplifiedBy` files were not fetched. The file was not re-fetched in this correction. |
| File server time | `Last-Modified` Fri, 31 Jul 2026 11:26:59 GMT | Not legal force |
| Retrieval | HTTP `Date` Fri, 23 Oct 2026 15:39:41 GMT | Historical receipt |
| Byte pin of that retrieval | SHA-256 `a2d6b9f1a10d7633e49a9d111c7b1a89815d25673d99032e7c430ee460367d25` of the 371,444 bytes | Not a production registry seal and not stored as a body |
| Work enforcement label | `In Kraft` / `In force` on the abstract work | Not a property found on the version resource |
| Later instrument | Provisional amending protocol, signed 2 March 2026, PDF above | Not in force. Not a Fedlex consolidation. Not a displacement of the 2020 text. |

The 15 December 2020 consolidation is the newest member of the complete 18-member set, and the in-file Stand date matches it. Zero triples at `eli/cc/2002/243/20260101` show only that this RDF version resource was not evidenced. The non-script GET of the ELI URL carrying `version=20260101` returned the shared JavaScript shell, which does not reveal how the UI applies that parameter. No second UI experiment was run.

Concrete later instrument, read in this correction:

- The EDA page, published 13 March 2026, says the Federal Council adopted the message on the Switzerland–EU package on 13 March 2026, approved the negotiated texts on 13 June 2025, and that the Federal President and the President of the European Commission signed them on 2 March 2026. The page links the amending protocol to the free-movement agreement.
- The linked PDF is headed “Dieser Text ist eine provisorische Fassung. Massgebend ist die definitive Fassung, welche unter www.fedlex.admin.ch veröffentlicht werden wird.” Title: amending protocol to the free-movement agreement, concluded on 2 March 2026. Signature block: Brussels, 2 March 2026.
- Article 1 item 14: “14. Anhang I des Abkommens erhält die Fassung des Texts in Anhang I dieses Protokolls.”
- Article 2(1): the Union and Switzerland ratify or approve the protocol under their own procedures and notify each other when the internal procedures required for its entry into force are complete.
- Article 2(2): the protocol enters into force on the first day of the second month following the last notification concerning a listed package. That list includes the institutional protocol to the free-movement agreement and the air, land, agriculture, conformity, cohesion, programme, and space-agency instruments. The footnotes are still `AS …` / `BBl …` placeholders. Signature is not that notification.
- The PDF then contains a replacement Annex I, starting at its page 20. That replacement was not applied to this cell and was not read as the operative visa sentence.
- The Parliament page says the stabilisation agreements can enter into force only together, and that the development agreements are possible only on the basis of the stabilisation part. The same page lists, as media headlines and not as the bodies of those releases: WBK-N starts consideration (23 October 2026); hearings on free movement and dynamic adoption of EU law (23 October 2026); clear entry into debate and start of detail deliberation (21 October 2026). The ordinary procedure is aimed at the end of the legislature.

Consequence at this review date: the 15 December 2020 text is the current evidenced Fedlex consolidation. The 2026 protocol has not displaced it. No indefinite future legal interval is published. `validFrom` and `validUntil` stay unaccepted. A later refresh is due when the protocol enters into force, or when Fedlex publishes the definitive text or a later consolidation. This packet does not require a certificate that nothing anywhere else has changed. The 7.20 MB message PDF on the EDA page was left unread because it is above the 2 MiB research ceiling.

Future pin, using existing Jetnity concepts only. Not registered. Not approved.

- Source, content item, representation, and identity profile keep separate version integers, as `RepresentationDescriptor` already does.
- Proposed unqualified local names, for a later task to accept or refuse: source `fedlex-federal-chancellery-unqualified-research`; item `eli-cc-2002-243`; representation `cc-20201215-de-html-9`; profile checks the conjunction SR `0.142.112.681`, in-file `Stand am 15. Dezember 2020`, and HTML id `annex_I/lvl_u1/lvl_I/art_1`.
- The fingerprint is the SHA-256 of the complete manifestation bytes, recomputed at a later authorized acquisition. This packet’s digest is the historical observation from 23 October 2026. A changed body must refuse.
- `validFrom` and `validUntil` stay null until a separate legal acceptance. Publication time, file `Last-Modified`, retrieval time, signature date, and the protocol’s future entry-into-force formula are not those fields.
- BP1’s URL-specific observer is not retargeted.

## C. Source-specific use

Five layers stay separate. Evidence for one layer does not decide the others.

### 1. Statutory text and copyright

Copyright Act Art. 5, historical consolidation status 1 July 2025, SR 231.1, excerpt. Not re-fetched in this correction:

> Art. 5 Nicht geschützte Werke
>
> 1 Durch das Urheberrecht nicht geschützt sind:
> a. Gesetze, Verordnungen, völkerrechtliche Verträge und andere amtliche Erlasse;
> b. Zahlungsmittel;
> c. Entscheidungen, Protokolle und Berichte von Behörden und öffentlichen Verwaltungen;
> d. Patentschriften und veröffentlichte Patentgesuche.
>
> 2 Ebenfalls nicht geschützt sind amtliche oder gesetzlich geforderte Sammlungen und Übersetzungen der Werke nach Absatz 1.

Publications Act, consolidation status 1 September 2023, SR 170.512, excerpts:

> Art. 15 Massgebende Fassung
>
> 3 Welche Fassung von völkerrechtlichen Verträgen und von Beschlüssen des internationalen Rechts massgebend ist, richtet sich nach deren Bestimmungen.

> Art. 19 Gebühren
>
> 1 Die Konsultation der Publikationsplattform sowie die Einsichtnahme im Sinne von Artikel 18 sind unentgeltlich.
>
> 2 Der Bundesrat regelt die Gebühren für die Abgabe von gedruckten Texten und von elektronischen Daten nach diesem Gesetz.

> Art. 19a Drittanbieter
>
> Der Bundesrat kann für Drittanbieter besondere Bedingungen vorsehen, insbesondere Auflagen für die Verwertung von Daten.

Publications Ordinance, consolidation status 1 July 2022, SR 170.512.1:

> Art. 47 Bezug von Daten zum Eigengebrauch
>
> Die unentgeltliche Konsultation der Publikationsplattform nach Artikel 19 Absatz 1 PublG umfasst auch das Herunterladen der Texte zum Eigengebrauch. Als Eigengebrauch gilt auch die Zitierung oder Kommentierung der Texte in wissenschaftlichen Arbeiten oder Veröffentlichungen.

Art. 48 is repealed by the ordinance of 10 November 2021 with effect from 1 July 2022 (AS 2021 692). Art. 49(1)(d) and Art. 49(2) and (3) are repealed by the same instrument. Art. 51(2) says no fee is charged for retrieval of electronic data.

Art. 49(1), same consolidation, operative letters:

> a. Die Daten dürfen inhaltlich nicht verändert werden.
> b. Sie sind so darzustellen, dass sie sich optisch deutlich von Kommentaren oder weiteren Zusätzen unterscheiden.
> c. Sie sind mit folgendem Hinweis zu versehen: «Dies ist keine amtliche Veröffentlichung. Massgebend ist allein die Veröffentlichung durch die Bundeskanzlei.»
> e. Weder in der Werbung noch auf der Verpackung, dem Datenträger oder dem elektronischen Medium darf der Eindruck erweckt werden, es handle sich um eine amtliche Veröffentlichung.
> f. Besonders schützenswerte Personendaten in Texten der AS und der SR, einschliesslich in Texten, die nach Artikel 5 Absatz 1 PublG durch Verweis veröffentlicht werden, müssen entfernt werden, sobald die BK diese nicht mehr oder nur noch in einer anonymisierten Fassung veröffentlicht.
> g. Besonders schützenswerte Personendaten in anderen Texten als jenen nach Buchstabe f dürfen nicht verwertet oder weiterverbreitet werden.
> h. Sie dürfen nur in veredelter Form gegen Entgelt weiterverbreitet oder zugänglich gemacht werden.

PublG Art. 15(1) and (2), which make the Official Compilation text controlling for federal enactments and intercantonal agreements, are a different class from this treaty. Art. 15(3) leaves the controlling version of an international treaty to that treaty’s own provisions. The index liability text that cites an AS PDF as controlling is read in that light and is not applied to Annex I.

### 2. Direct Fedlex reuse sentence and index attribution

Direct body of `https://fedlex.data.admin.ch/assets/home/en-CH/01.html`, hashed above. The same asset describes machine and SPARQL use of the texts and metadata. Its licence sentence:

> The text and the metadata are made available for now in accordance with the technical and legal information for third-party users https://www.fedlex.admin.ch/de/broadcasters, which authorises their re-use for commercial and other purposes.

“For now” is the wording of that sentence. The sentence gives no end date.

Search-index text, not a hashed body, for `https://www.fedlex.admin.ch/de/legal-information`, returned to this writer on 23 October 2026. The direct GET of the English route was the JavaScript shell. The indexed Copyright section says the contents of the publication platform are not protected works under Copyright Act Art. 5, that consultation and download for exploitation are free of charge under Publications Act Art. 19(1) and Publications Ordinance Art. 48(2), and that exploitation is subject to Art. 49, with a link to the third-party-user page. The indexed liability section discusses the controlling AS PDF for federal enactments and intercantonal agreements.

That Art. 48(2) citation is not the text of the 1 July 2022 consolidation read above. Art. 48 is repealed there. Art. 47 is the current personal-use download rule, and Art. 49 is the exploitation rule. The unread SPA might still display the repealed citation. The consolidation that was hashed controls for the ordinance. The index citation is recorded as a discrepancy, not as current ordinance text.

Search-index text, not a hashed body, for `https://www.fedlex.admin.ch/de/broadcasters`. The direct GET was the same JavaScript shell. The returned index excerpt quotes the Federal Act on Data Protection, SR 235.1, Art. 5(c), on sensitive personal data, then quotes Publications Ordinance Art. 49(1)(a)–(h) with letter (d) shown as an ellipsis, and notes that texts are offered as PDF, Word, HTML, and XML, with XML described as intended for machine processing. Those points match the hashed ordinance on Art. 49. The index excerpt contained no access-frequency rule, no authentication requirement, and no refresh interval. None is invented. Any technical condition that exists only in the unread SPA body remains unverified.

The generic admin.ch notice, first window, remains on record and is not the Fedlex basis:

> Copyright, Swiss federal authorities. Information on the federal authorities' websites is accessible to the public. Downloading or copying of texts, illustrations, photos or any other data does not entail any transfer of rights on the content. Copyright and any other rights relating to texts, illustrations, photos or any other data available on the Federal authorities' websites are the exclusive property of the federal authorities or of any other expressly mentioned owners. Any reproduction requires the prior written consent of the copyright holder.

### 3. What each use is, and what is still unverified

| Layer | Evidenced basis | Still unverified, and not treated as a prohibition |
| --- | --- | --- |
| Statutory text / copyright | URG Art. 5(1)(a) and (2): international treaties and official collections and translations are not copyright-protected. The legal-information index says the same for platform contents and cites URG Art. 5. | Full URG consolidation count. The Act was not re-fetched. |
| Extraction and derived claims | The hashed introduction asset describes machine use and authorises commercial and other reuse under the broadcasters conditions. PublV Art. 49 applies to exploitation of platform data, including unchanged content, visual separation, the mandatory notice, and letter (h) for paid redistribution. | Whether a future Jetnity display is “paid redistribution of platform data” under letter (h). This packet does not classify it. No extractor was built. Compliance with Art. 49 is not asserted. |
| Reproduction of the original publication | Art. 49(c) and (e) require the non-official notice and forbid the impression of an official publication. The excerpts in this packet are review excerpts. PublG Art. 15(3) leaves the controlling treaty text to the treaty. | The broadcasters SPA body. Technical conditions present only there. |
| Access and refresh | Public HTTPS reads succeeded for the pages in the table. `www.fedlex.admin.ch` robots allow `/`. `fedlex.data.admin.ch` robots disallow `/filestore/*`. The static asset is outside that path. No rate limit was stated in the read statute or in the index excerpt. | A refresh cadence. The treaty HTML was not fetched again. |
| Jetnity internal storage | This packet keeps links, identifiers, HTTP metadata, hashes, and the excerpts. The bodies are not in the repository. | No real Fedlex original is retained. The storage direction is already decided. D5 records why this representation is still unapproved. That question is independent of copyright and is not the unsigned global D01–D12 packet. |

Commercial and other reuse is evidenced on the conditional basis above. That evidence does not authorize Production activation, a live provider, or an accepted Rule. It does not assert that a later product already satisfies Art. 49. No individual permission letter is requested. The empty introduction shell is not a licence prohibition.

## D. Later adapter — dormant

This correction does not authorize a retrieval. A second identical GET of `...-html-9.html` would refresh the HTTP status, media type, byte count, and SHA-256, and could re-check SR `0.142.112.681`, `Stand am 15. Dezember 2020`, the Annex I Art. 1 id, and the `Einreisevisum` sentence. It would not read the broadcasters page, would not decide entry into force of the 2026 protocol, and would not accept `validFrom` or `validUntil`. Deciding to run that GET is not completed qualification.

The Technical Lead’s review tool could not open that URL. This correction did not re-fetch it.

If a later versioned task separately authorizes one proof read, the dormant shape is:

- One HTTPS GET of `https://www.fedlex.admin.ch/filestore/fedlex.data.admin.ch/eli/cc/2002/243/20201215/de/html/fedlex-data-admin-ch-eli-cc-2002-243-20201215-de-html-9.html`
- Not the `version=20260101` ELI URL, not `fedlex.data.admin.ch/filestore/...`, not any `intranet.fedlex.admin.ch` URL, not a PDF/XML/DOC sibling, not a second language.
- One request, no redirect follow, no retry, timeout 15 seconds. The observed size was 371,444 bytes. That is above the existing 65,536-byte default and above the conditional 131,072-byte pin. A later adapter may carry its own ceiling for this URL, large enough for the observed body. Do not raise the global caps.
- A non-production environment named in that later task. Not the application pilot, not Production, not a hosted database. This packet names no operator and no calendar window. The expired 15 October 2026 BP1 window is not reused.
- Output of that later run: HTTP status, final URL, media type, byte count, SHA-256, and the boolean checks above. No raw body in git. `sourceQualified` stays false until a separate acceptance. No Evidence and no Rule.
- No real Fedlex original bytes are retained. D5 is the already decided source-original direction plus the still-open representation and hosting reviews. It is not a new preference question.
- Refusal: any other URL, redirect, non-HTML, size above that task’s own ceiling, digest change without a pre-accepted new digest, missing SR or Stand date, missing article id, missing visa sentence, JavaScript shell, intranet host, or data-host filestore path.

Later versioned implementation, change list only, no code in this PR:

- New observer/probe files. Do not point `scripts/official-truth-bundesportal-bp1-observation-1/` or its `--observe-bp1-once` flag at Fedlex.
- Do not change the global cap in `official-truth-server-owned-retrieval`.
- Registry, representation, and identity-profile rows only under a fresh Technical-Lead scope. The names above are unqualified proposals.
- Leave `contract-server.ts` empty, `applicationPilotAvailable` false, and `requirementsProviderAus` null.
- Leave `chDeVisaResearch` on `RESEARCH_GAP` until a separate acceptance. Do not fill the canonical encoding gap by side effect.
- No migration and no original-body column.

The 371,444-byte size is a bounded implementation dependency for that later adapter. It is not a source-legitimacy defect and not a security defect.

## E. Decisions and findings

### D5 continuity

The broad source-original direction is already binding. `docs/OFFICIAL_TRUTH_SOURCE_ORIGINAL_RETENTION_TL_OWNER_DELEGATED_DIRECTION_2026-10-11.md`, blob `db9b62a0d2637e40eefe25ee49c0e7a08be3b420`, is the Owner-delegated decision: a separate private, encrypted, expiring full original when an exact representation’s eligibility permits, and otherwise ephemeral verification with no historical-original reproof. The opening of `docs/OFFICIAL_TRUTH_CH_DE_SOURCE_TO_WORKSPACE_V2_1_OWNER_PACKET_2026-10-11.md`, blob `de4b95c6ef521f040b44c3ed51e6e74172a890ec`, says not to ask that choice again. Older G2 text below that opening is historical. This packet does not ask it again, does not design a new store, and does not grant blanket retention.

This Fedlex HTML representation is not approved for real retention. Still open for this representation are its content and privacy eligibility, purpose and duration, concrete secure hosting, key and access arrangements, residual-copy expiry across backup, PITR, WAL, replica and export, a disposal operation, and a durable independent lifecycle and restore witness. Those are the existing finite source and hosting reviews. Their absence does not mean the direction is unchosen.

The existing implementation, `supabase/migrations/20261011111839_official_truth_original_custody_lifecycle_1.sql`, blob `36b525580509069039ca6787c25a0a5b94155986`, is local, code-only and synthetic. The header says it is an unapplied code-only candidate and stores no fact. `expires_at` and `freshness_until` must fall within 30 days after `captured_at` for every original. Update or delete of an original row raises `immutable_history`. An idempotent retry verifies the stored original and does not write a new expiry. That 30-day maximum, including originals that are still referenced, is the implemented default. The direction document’s 180-day absolute ceiling is a design ceiling, not this default. No hosted key management, deletion SLA or storage-cost approval follows from the migration. The M1–M4 contract records the same 30-day choice and leaves the durable production witness and backup inventory unimplemented.

Global D01–D12, clarified in #865 comment `6108417968`, stays separately unsigned. That packet excludes raw government response bodies. It is not a substitute for the source-original direction, and this direction does not sign D01–D12. The 30-day diagnostic-report proposal in #944 is a different object. It is not original-body retention.

Default for this packet: no real Fedlex original bytes are retained. Copyright evidence does not change that default. D1–D4 and the stops on the treaty HTML and the Copyright Act HTML are unchanged.

| Id | Owner | Decision now before the Technical Lead |
| --- | --- | --- |
| D1 | Technical Lead, with legal-source review | The conditional reuse basis in section C is the decision record: URG Art. 5; PublG Arts. 19 and 19a; PublV Arts. 47 and 49 as read from the 1 July 2022 consolidation; and the hashed introduction asset authorising commercial and other reuse under the broadcasters conditions. Accepting D1 accepts that record. It does not mean Art. 49 has already been performed, and it does not activate a source. |
| D2 | Technical Lead | The generic admin.ch prior-consent paragraph stays in the record and is not the Fedlex-specific basis. No permission letter, contact, terms acceptance, or contract is requested. |
| D3 | Technical Lead, with legal-source review | At 23 October 2026 the newest evidenced Fedlex consolidation of this agreement is 15 December 2020. The provisional protocol signed 2 March 2026 is not in force. Art. 1 item 14 would replace Annex I only on entry into force under Art. 2. `validFrom` and `validUntil` stay unaccepted. The later refresh point is entry into force, or a definitive Fedlex publication or later consolidation. |
| D4 | Technical Lead | No operator and no calendar window are named. The section D GET stays dormant. |
| D5 | Direction already decided; this representation still unapproved | See “D5 continuity” above. No new broad preference question. No real Fedlex original bytes are retained. Global D01–D12 stays a separate unsigned provenance decision. |
| D6 | Technical Lead and Product Owner, separate from ordinary research | The commercial-reuse evidence does not authorize Production activation, a live provider, or an accepted Rule. No new blanket Owner gate is added for ordinary bounded research. |

| Priority | Finding |
| --- | --- |
| P0 | None. Do not activate a source, accept a visa cell, or retain the body because this packet exists. |
| P1 | None in this correction. The earlier P1 rows are withdrawn: an unread shell is not the absence of a licence; the admin.ch paragraph is not a waiver conflict; the 15 December 2020 date is not invalidity; the file size is not a legitimacy or security defect. |
| P2 | The legal-information and broadcasters SPA bodies were JavaScript shells. Index text is labelled as index text. Technical conditions that exist only in the unread SPA body are unverified. No rate limit was evidenced. |
| P2 | The legal-information index cites PublV Art. 48(2). The hashed 1 July 2022 consolidation repeals Art. 48. The consolidation controls for that ordinance. |
| P2 | The 2 March 2026 protocol is provisional and not in force. A `dateDocument` `2026-03-02` query returned zero bindings. That is not a certificate of total absence. The definitive Fedlex text was not evidenced. |
| P2 | Parliament evidence is the page that was read, including its media headlines. The bodies of those releases were not opened. |
| P2 | `fedlex.data.admin.ch` robots disallow `/filestore/*`. The historical public read used `www.fedlex.admin.ch`, which allows `/`. Intranet URLs were not opened. |
| P2 | `ld.admin.ch` robots say `Disallow: /`. One TASK-named data-usage page was retrieved before that body was inspected. No repeat. |
| P2 | The unfiltered HTML-manifestation SPARQL page hit `LIMIT 20` before `isExemplifiedBy`. A second filtered query returned the current file. Historical exemplars were not fetched. URG version history was `LIMIT 5`, not a count. |
| P2 | This consolidation’s party list still names the United Kingdom. Out of cell. It is the 15 December 2020 list. |
| P2 | Annex I Art. 1(2)’s five-year passport sentence is not a German entry rule. |
| P2 | The Cellar guide PDF was retrieved and not text-extracted. Unused. The 7.20 MB EDA message PDF was not downloaded. |
| P2 | `validFrom` and `validUntil` stay unaccepted. This Fedlex representation is not approved for real original retention; the storage direction itself is already decided. Production activation stays unauthorized. |
| Implementation dependency | 371,444 bytes is above the current 65,536 and 131,072 retrieval ceilings. A later scoped adapter can carry its own ceiling. Global caps stay unchanged. |
| P3 | The metadata graph does not contain an Annex I subdivision resource. The HTML does. The graph is not the provision. |
| P3 | Shell `Last-Modified` 15 October 2026, file `Last-Modified` 31 July 2026, metadata timestamps, and the protocol signature date are different dates and are not `validFrom` or `validUntil`. |
| P3 | The narrower ordinary, tourism, direct-route, and stay-end facts sit inside the broader nationality-plus-valid-passport rule. The canonical scope still does not encode them. Residence is not the legal key. |

Finite gaps that remain after this correction: the unread SPA bodies; any technical condition present only there; the index citation of repealed Art. 48(2); the provisional protocol and the absent definitive Fedlex publication; unaccepted `validFrom` / `validUntil`; this Fedlex representation’s still-open eligibility, hosting, key, residual-copy and witness reviews; and no Production authorization. The source-original direction is not one of those gaps. The historical treaty and Copyright Act receipts were not repeated.

#748 newest material report `6268214902` (`COS-20261019-1521-016`) records the existing #968 Preview credential exposure. It is outside this slice. No credential was read or rotated. #751 comment `6368724786` records live main `8f64d5fdb819065791235879822b1074205899c0` after the #972 merge. Main was re-read immediately before this correction and was still that commit, mode NORMAL. This branch was not rebased.

Next responsible actor: Technical Lead, independent exact-head review of the commit that adds this correction. This writer stops. No Ready, no merge, no acquisition, no follow-up slice.
