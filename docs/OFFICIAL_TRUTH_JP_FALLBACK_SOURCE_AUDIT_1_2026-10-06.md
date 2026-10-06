# Official Truth JP alternate official source retrieval fallback audit 1

Date: 6 October 2026. Issue: [#868](https://github.com/Jetnity/jetnity/issues/868). Draft PR: [#870](https://github.com/Jetnity/jetnity/pull/870).

## 1. Decision

**JP_FALLBACK_SOURCE_NOT_READY**

No tested alternate Japanese state source currently proves both compatible credentialless server retrieval and complete support for the bounded `citizenship=CH`, `documentType=ordinary_passport`, `destination=JP` pilot. All **32 direct GETs across 21 exact URLs returned HTTP 403** on 6 October 2026. This is an observed local-egress result, not a claim that every deployment or every Japanese official website fails.

The Embassy of Japan in Switzerland's Swiss-passport page, B01, is a useful newly inspected candidate: it carries a positive exemption, specified purposes, two activity exclusions and an extension procedure in one short HTML page. It remains unqualified: two direct requests failed; a normal browser returned 200. Its dated guidance and passport-class/initial-landing interpretation also need explicit review. It is not selected as a READY source, and its browser bytes are not server-owned Evidence.

ISA's country list is another concrete lead, but the old URL navigates in the browser to a different path. Both old and new paths fail direct retrieval, and the list has a Trusted Traveler Program context and explicit passport exceptions. It cannot silently become a complete ordinary-passport waiver rule.

Unknown stays unknown. No missing country, passport condition, activity, transit statement or arrival-form statement creates a negative rule. No Rule or Evidence is accepted.

## 2. Binding reconstruction

- Baseline and freshly fetched `origin/main`: `9adfc04ffe90693dedc059f07a396751a0625157`; machine mode `NORMAL`.
- Authorized branch: `docs/official-truth-jp-fallback-source-audit-1`; remote task seed `67b34ef43b5db3b561fdf2f7f25b74c0c16aaa5e`.
- [Immutable TASK](OFFICIAL_TRUTH_JP_FALLBACK_SOURCE_AUDIT_1_TASK_2026-10-06.md) blob: `be6767c7ce6c39c2f156fef6d876d93ad28079fe`.
- Fresh GitHub reads: [#751](https://github.com/Jetnity/jetnity/issues/751), [#741](https://github.com/Jetnity/jetnity/issues/741) and its priority comment, #868 and Draft #870; closed #848/#852 and merged #849/#853 including their review/closure records. #751's Codex execution and autonomous commit/push directives apply. Its historical task-seed status does not override live PR file lists.
- [#849 source audit](OFFICIAL_TRUTH_JP_FIRST_PILOT_SOURCE_AUDIT_1_2026-10-05.md) established positive CH evidence but not a complete qualified family. [#853 identity/retrieval audit](OFFICIAL_TRUTH_JP_CONTENT_IDENTITY_RETRIEVAL_QUALIFICATION_1_2026-10-05.md) accepted the R01/R04 browser-200/direct-403 blocker. Those receipts remain historical.
- Current code includes merged #851/#857: schema-2 activity, stay and national-passport predicates now exist as dormant pure contracts. The earlier audit's schema-1 limitations must not be restated as absence of all current representation support.
- Parallel PR Changed Files for #863/#866/#867/#871 were freshly read; none intersects this TASK's five-file family. No unmerged contract from those writers is used as implemented truth.
- Codex Desktop session `01a10e90-2e64-7be3-b409-5058846bc6ef`; local session metadata identifies `gpt-6-astra`, effort `xhigh`, CLI `0.160.0`, provider `openai`. This is local metadata evidence, not independent model attestation.

Repository governance and relevant product/architecture/decision/quality/continuity material were read without edits. The slice changes only the four permitted delivery documents. Exact post-push Git/PR evidence is reported in the delivery readback; a document cannot contain its own final commit hash without changing that hash.

## 3. Source inventory and exact URLs

IDs here are research labels, not registered source or item IDs. URLs are exact audited addresses. “Canonical” below means the official candidate address selected for examination, not an approved Jetnity canonical binding. The direct response final URL equals its request for every receipt because all failed without an HTTP redirect. Browser navigation differences are recorded separately.

| ID | Exact official URL | Authority and publication identity | Role and media |
| --- | --- | --- | --- |
| R01 | https://www.mofa.go.jp/j_info/visit/visa/short/novisa.html | MOFA, Exemption of Visa (Short-Term Stay) | Existing blocked baseline; HTML |
| R04 | https://www.mofa.go.jp/j_info/visit/visa/faq.html | MOFA, Frequently Asked Questions | Existing blocked baseline; HTML |
| B01 | https://www.ch.emb-japan.go.jp/itpr_de/shortterm-swissliechtenstein.html | Embassy of Japan in Switzerland, Short-term Stay for Swiss Passport Holders / Passport Holders of the Principality of Liechtenstein | Directly state-carried candidate rule; HTML, English substantive text within German site |
| B02 | https://www.ch.emb-japan.go.jp/itpr_de/temporary_visitor_visa.html | Same embassy, Temporary Visitor Visa | Category and activity context; HTML |
| B03 | https://www.ch.emb-japan.go.jp/itpr_de/visa_faq.html | Same embassy, FAQ | Link-only fallback check; HTML |
| B04 | https://www.ch.emb-japan.go.jp/itpr_de/11_000001_01489.html | Same embassy, Consular office online reservation system | Application guidance, weaker exemption wording; HTML |
| G01 | https://www.geneve.ch.emb-japan.go.jp/itpr_fr/visa.html | Consulate of Japan in Geneva, Visas | Application-scope check; HTML, English text within French site |
| G02 | https://www.geneve.ch.emb-japan.go.jp/itpr_fr/visa_00001.html | Same consulate, Visa Category | Passport validity and landing distinction; HTML |
| U01 | https://www.uk.emb-japan.go.jp/itpr_en/index_000070.html | Embassy of Japan in the UK, Visa: Temporary Visitor Visa | State-carried CH initial-period corroboration; HTML |
| U02 | https://www.uk.emb-japan.go.jp/itpr_en/index_000025.html | Same embassy, Visa: General Information | Category/purpose and passport-context check; HTML |
| I01 | https://www.moj.go.jp/isa/applications/status/temporaryvisitor.html | Immigration Services Agency, MOJ, 在留資格「短期滞在」 | Competent status authority; HTML, Japanese |
| I02 | https://www.moj.go.jp/isa/publications/materials/ttp2_pre-check_pre-check_document03.html | ISA, old 特定国一覧 path | Browser move/navigation check; HTML |
| I03 | https://www.moj.go.jp/isa/immigration/procedures/ttp2_pre-check_pre-check_document03.html | ISA, current observed 特定国一覧 path | Country-list candidate; HTML, Japanese |
| I04 | https://www.moj.go.jp/isa/immigration/procedures/ttp2_pre-check_pre-check_document03.html?lang=de | ISA, browser-observed query variant | Separate exact-URL diagnostic; response text remained Japanese; not an approved German representation |
| L01 | https://www.la.us.emb-japan.go.jp/e_web/e_m02_06_03.htm | Consulate-General of Japan in Los Angeles, Visa Exemptions | Legacy ordinary-passport wording; HTML |
| J01 | https://www.japan.go.jp/japan/visit/ | Government of Japan, Cabinet Office Public Relations Office, Visiting Japan | Government portal discovery check; HTML |
| J02 | https://www.japan.go.jp/japan/visit/index.html | Same publisher/item candidate, web-reader final path | Separate exact-URL diagnostic; HTML |
| R02 | https://www.mofa.go.jp/mofaj/toko/visa/tanki/novisa.html | MOFA, Japanese short-stay exemption representation | Direct alternative-locale transport check only; no new legal claim from its denied body |
| M01 | https://www.mofa.go.jp/j_info/visit/visa/system/index.html | MOFA, Visas and Landing Permission | Legal-effect distinction; HTML |
| D01 | https://www.do.emb-japan.go.jp/visita/List_of_Countries_and_Regions_That_Have_Visa_Exemption_Arrangements_with_Japan.pdf | Embassy of Japan in the Dominican Republic, visa-exemption list | Official-hosted historical list; PDF, two pages |
| T01 | https://www.mofa.go.jp/mofaj/gaiko/treaty/pdfs/A-S38%282%29-157.pdf | MOFA treaty archive, Japan/Switzerland notes | Historical #849 source, fresh transport test only; intended PDF |

All publishers above are Japanese state bodies. Embassy pages carrying their own guidance are primary official communications, but a state's link directory is not itself the linked visa rule. Neither a familiar host nor a primary-source label supplies currentness or semantic completeness. Search snippets were used only to discover candidates; relied-upon semantics were read on full official pages through the web reader or normal browser. Non-Japanese search hits and commercial links were not used to fill any gap.

Other official addresses opened during discovery, without direct Node qualification or reliance as supporting rule items: `https://www.mofa.go.jp/j_info/visit/visa/index.html` (MOFA index shown by the web reader); `https://www.ch.emb-japan.go.jp/itpr_en/visa.html` (failed exploratory web open). These are not substitutes for the inventory. Search results alone, including query-decorated MOFA URLs, were not promoted into source evidence.

## 4. Semantic qualification and currentness

The following are bounded research paraphrases, not machine facts or legal advice for an actual traveller. The three supplied scope fields do not establish trip purpose, activity declarations, intended duration, passport validity or national-passport linkage.

| Candidate | Explicit support and locator | Necessary support not established / conflict | Freshness observation |
| --- | --- | --- | --- |
| B01 | Opening paragraph positively exempts Swiss passport holders for the listed visits within six months. Purpose bullets include tourism, relatives/acquaintances and short business affairs. The note excludes remuneration and revenue-generating business operations. Next paragraph requires an extension application for over 90 days before permitted stay expires. | No literal ordinary-passport category, emergency-document normalization, independent initial landing-grant statement or day-counting convention. Swiss-passport wording suggests the national-passport relationship but no reviewed machine class mapping follows automatically. Return/onward ticket and purpose documents are expressed as “should”; funds may be requested. Do not convert these into unconditional entry requirements. | Displayed 8 April 2020; still linked from B02 (5 May 2025). Browser Last-Modified 30 April 2026 is technical metadata, not a new legal effective date. Currentness cannot be inferred from that alone. |
| B02 | Temporary Visitor category is up to 90 days for named visit purposes and excludes profit-making operations and paid activities. Its exemption section links B01. | Link text is not a complete CH exemption or passport-class statement. Its absent-country wording is not used for negative inference. It cannot replace B01's content. | Displayed 5 May 2025; freshly readable official page. |
| B03 | Official FAQ index points to central MOFA FAQ answers. | Does not reproduce the answer; therefore does not bypass R04's retrieval dependency. | Displayed 4 September 2023. |
| B04 | Visa Application section links exemption guidance and qualifies short stays with a profit-related limitation. | No self-contained CH enumeration, ordinary-passport mapping or complete activity/duration clauses. Do not treat its company-in-Japan formulation as a legal narrowing of B01's broader exclusions. No appointment was booked. | Displayed 6 November 2025. |
| G01 | General Information links MOFA for nationality eligibility; carries local visa-application instructions. | No self-contained positive CH exemption. Local residence/jurisdiction and two facing blank pages concern applications, not a universal condition on exempt visitors. | Displayed 22 July 2025. |
| G02 | “Did you know that?” specifies passport validity throughout the stay and distinguishes visa validity from landing permission. | Does not enumerate CH exemption or ordinary-passport eligibility. Arrival convenience information supplies no mandatory/no-form conclusion. | Displayed 22 July 2025. |
| U01 | General section excludes profit-making and paid activity; positive waiver statement links exempt countries. Note 2 explicitly names Switzerland and gives a maximum of 90 days on arrival, then extension application. Note 1 preserves border discretion. | Its “further 90 days” wording must not be converted to or substituted for R01/B01's six months. Emergency/temporary passports are referred for enquiry; ordinary-class mapping remains unqualified. The narrow initial visit does not need a resolved extension outcome, but the broader arrangement does. | Displayed 30 June 2026. |
| U02 | Visa requirement table separates passport-based waiver from UK residence and gives non-British exempt nationals a purpose-conditioned short-stay route. | CH membership is delegated to MOFA. Its “less than 90 days” wording is not silently normalized to inclusive “90 days or less.” UK application jurisdiction is not CH eligibility. | Displayed 4 September 2026. |
| I01 | Activity/status table defines Temporary Visitor visits and general periods of 90, 30, 15 or an individually designated period within 90 days. Extension section states the general humanitarian/equivalent-special-circumstances limitation. | No CH-specific exemption or ordinary-passport rule. The general extension text does not settle its relationship to the Swiss bilateral arrangement. Generic status duration is not a CH landing guarantee. | No visible editorial update established; browser Last-Modified 31 August 2026. New direct failures supersede #849's historical successful direct receipt. |
| I02/I03/I04 | Current browser page's 特定国 table includes スイス連邦; opening text defines countries covered by visa-exemption measures, excluding suspended/advised-visa cases, and warns that some passports are excluded. | TTP-related country list, not a standalone complete waiver grant. Does not supply purpose, stay period or specific ordinary-passport qualification. Old web-reader version and current browser content differ; only the current browser text is used for this observation. No TTP enrolment condition is imposed on ordinary visitors. | Browser I04 Last-Modified 7 July 2026. Old path is not silently a stable alias; see navigation trace below. No displayed legal effective date established. |
| L01 | Opening explicitly links valid ordinary passports of exempt-country nationals to applying for short-stay landing without a visa, for unpaid visit activities. CH row and closing notes address six months with an initial 90-day grant and extension application. | Currentness fails qualification: table/notes contain Brunei 14/15-day wording and Peru visa-advice wording unlike current R01's 30-day/conditional-exemption entries. These non-CH contradictions flag a stale overall rendering; the CH sentence cannot be selectively treated as refreshed. | No reliable displayed update established. Legacy official page is still readable but is not current operational authority for this audit. |
| J01/J02 | Cabinet Office visitor portal links to MOFA visa guidance. | No CH/passport/exemption rule carried in its own text. A government directory link cannot become the downstream rule or bypass the target's transport. | No displayed regulatory update established; live navigation does not prove legal freshness. |
| D01 | List explicitly includes CH; notes distinguish initial permission from extension. | As-of-April-2006 list, no current class/activity completeness, and binary PDF outside the present UTF-8 retrieval path. Not current legal support. | Document explicitly dated April 2006. Web-reader PDF text inspected as historical discovery material; page-render calls returned references, not a verified local rendering. No new server PDF bytes obtained. |
| M01 | Separate Visas/Landing Permission headings distinguish the visa from the permission that forms the basis of stay; immigration checks purpose, duration and passport. | General explanation, not a CH waiver source. Its general visa premise must not erase the exemption. | Displayed 22 July 2015. |
| R01/R04 | Current full-page reads preserve the baseline: CH positively listed with Note 8; 90-day landing period; six-month arrangement with extension application; FAQ Q1 qualifies exemption by short duration and no income-earning activity. | Neither successful compatible transport nor complete ordinary-passport mapping is supplied by these reads. No new legal claim is drawn from R02/T01's 403 bytes; T01's prior treaty interpretation stays historical. | R01 displayed 1 September 2025; R04 31 March 2023. Fresh reading is distinct from legal effective date. |

No consulted current source establishes a complete transit rule for this cell. No missing transit or entry-form text is read as “not required.” No inference makes every business trip non-remunerative, six months equal 180 days, or an extension application a guaranteed grant. No blanket legal conclusion is made about the totality of Japanese entry rules.

## 5. Retrieval method and observed limits

The external scratch probe used Node **22.23.3**, `node:https` GET, a fresh non-keepalive agent per request, port 443, verified TLS/SNI, `accept-encoding: identity`, `cache-control: no-cache`, no custom User-Agent, no Cookie/Authorization, and no browser state. It copied the public-address predicate verbatim from the inspected baseline, used `dns.lookup({all:true,verbatim:true})`, rejected any non-public answer and passed the vetted answer set to the connection's lookup callback. Every actual socket was public and TLS-authorized.

The deadline was 10,000 ms, including lookup through complete response; declared and streamed body ceilings were 65,536 bytes. All error bodies completed in 25–824 ms. The probe recorded Location rather than following it. None occurred, so **zero redirect handling was exercised**. It completed and hashed short denial bodies diagnostically; Jetnity itself would reject the HTTP status before treating them as source text. This is not a test of the live catalog/app entry point.

### Per-candidate transport result

| IDs | Direct behavior | Actual response type / size | Successful-content size and admission |
| --- | --- | --- | --- |
| R01, R04 | Two 403s each, no redirect, Akamai denial | `text/html`; R01 431/429 B, R04 418/416 B | Legal-body size not newly proven by Node; blocked status |
| B01, B02, B03 | Two 403s each, no redirect, Akamai denial | `text/html`; 443, 441, 423 B respectively | B01 browser decoded body 14,070 B; within cap numerically, but compressed browser success proves no compatible server body. B02/B03 legal sizes unmeasured here |
| B04 | One 403, no redirect | `text/html`, 434 B | Legal size unmeasured; denied |
| G01, G02 | Two 403s each, no redirect | `text/html`, 426/436 B respectively | Legal sizes unmeasured; denied |
| U01, U02 | Two 403s each, no redirect | `text/html`, 427 B each | Legal sizes unmeasured; denied |
| I01, I02 | Two 403s each, no redirect, CloudFront error | `text/html`, 919 B each | I01 browser decoded body 29,205 B; I02's moving representation not a qualified pin |
| I03, I04 | One 403 each, no redirect, CloudFront error | `text/html`, 919 B each | I04 browser decoded body 23,912 B; under cap numerically only |
| L01 | One 403, no redirect | `text/html`, 438 B | Legal size unmeasured; also stale |
| J01, J02 | One 403 each, no redirect; server header AmazonS3 | `text/html; charset=utf-8`, 113 B each | Denied; no source-body cap proof |
| R02, M01 | One 403 each, no redirect | `text/html`, 425/431 B | Legal size unmeasured here |
| D01, T01 | One 403 each, no redirect | Actual response is HTML, 529/452 B, **not PDF** | Fresh PDF size unknown. #849's T01 size 385,852 B is historical. Binary PDF also needs a separate reviewed transport contract; an excerpt/OCR/browser wrapper is not an admissible replacement |

All direct responses had no Content-Encoding, no Set-Cookie, no WWW-Authenticate and no observed redirect. This proves only that the denied requests carried no credentials and did not obtain content. It does **not** prove that cookies, JS, a browser challenge, geolocation or session state are necessary or sufficient to obtain a successful response. No challenge was solved, browser headers spoofed, TLS weakened or private/origin endpoint tried.

### Normal-browser controls and navigation

Normal in-app Chrome 154 controls are research observations only. No login or challenge interaction occurred. Existing browser state was not exhaustively audited, so credentialless production compatibility is not claimed. CDP response bodies are browser-decoded bytes, not compressed wire-byte measurements or reserialized DOM. No accepted content hash/pin was minted from them.

| Exact browser representation | UTC request start | HTTP / complete | Encoding; decoded UTF-8 bytes | Response metadata |
| --- | --- | --- | --- | --- |
| B01 | 2026-10-06T08:21:18.184Z | 200 / yes | gzip; 14,070 | HTTP/2, AmazonS3; encoded Content-Length 4,127; Last-Modified 2026-04-30T06:13:16Z; ETag `"938b197792fb03930ef17e7811eb008b"`; no disk-cache/service-worker flag |
| I04 | 2026-10-06T08:22:06.114Z | 200 / yes | br; 23,912 | Apache through CloudFront; Last-Modified 2026-07-07T11:06:40Z; ETag `W/"5d68-6560362a2f000"`; cache/SW flags not persisted for this receipt |
| I01 | 2026-10-06T08:22:48.173Z | 200 / yes | gzip; 29,205 | Apache through CloudFront, `RefreshHit`; Last-Modified 2026-08-31T15:15:35Z; ETag `W/"7215-65a59461a93c0"`; no disk-cache/service-worker flag |

An initial cross-origin CDP body capture was incomplete and was not counted as a complete body receipt; the table contains subsequent complete captures. For I02, the browser document trace showed: old path 200 at 08:21:50.314 UTC, new I03 path 200 at 08:21:50.611 UTC, then the observed I04 query variant at 08:22:06.114 UTC. No `redirectResponse`/3xx appeared in that captured trace. This is browser navigation, not proof that Node follows an HTTP redirect to a valid representation. The exact trigger for the `lang=de` variant was not established. The query did not yield German substantive text and is not an identity shortcut.

The web reader separately reported J01 resolving to J02; no HTTP hop/status trace was exposed. Direct J01/J02 both returned 403 at the requested URL. Other full-page web reads establish readable text only, not Node headers, byte counts, cookies or reliable transport. No new headless-browser test or deployed Jetnity/Vercel-egress probe was performed. #853's headless result is historical.

The detailed direct receipt ledger is in the [report](OFFICIAL_TRUTH_JP_FALLBACK_SOURCE_AUDIT_1_REPORT_2026-10-06.md). It records timestamps, body hashes, socket and response class. The 32 responses are denial documents, not official regulatory Evidence.

## 6. Current identity and retrieval contract fit

Read-only anchors on the stated baseline: `official-truth-server-owned-retrieval.ts`, `official-truth-content-identity.ts`, `official-truth-govuk-content-api-identity-profile.ts`, `official-truth-source-catalog-server.ts`, `official-truth-server-held-source-registry.ts`, `source-registry.ts`, `source-router.ts`, relevant tests, and the merged [source-identity reconciliation](OFFICIAL_TRUTH_SOURCE_IDENTITY_GRANULARITY_RECONCILIATION_1_2026-10-04.md).

| Contract | Audit consequence |
| --- | --- |
| Only caller sourceId/URL proposals; coherent server-owned catalog-v2 graph before network | A research URL is not authority, registration or eligibility. No live database catalog inventory was requested. |
| HTTPS 443, public-only connection-bound DNS, exact registered request/final URLs and source, at most five redirects | Keep these controls. A whole MOFA/embassy domain or a newly observed path is not an implicit allowlist. I02/I03 require deliberate continuity review; do not automatically adopt browser navigation. |
| Full bounded nonempty UTF-8; successful HTTP status; exact media/profile binding | HTML denial with a correct host/type never qualifies. PDF is not repaired by a larger byte cap or extracted text. Browser compression is not silently decompressed by Node's current text path. |
| Seven-field source/item/representation/profile binding and immutable versions | Each distinct page needs reviewed item/representation identity. Translations/mirrors must not inflate independent support. A shared authority domain does not collapse all publications to one item. |
| Only GOV.UK ETA Content API profile in the code-owned identity registry | No inspected Japanese HTML/PDF qualifies using that verifier. Its publication/publisher IDs cannot be invented for Japan. |
| Merged no-external-ID fallback: `jetnity-reviewed-item`, server-allocated opaque key and full-content fingerprint profile | The schema can accommodate a reviewed Japanese HTML rendering without a new catalog schema. A **new JP identity profile** and reviewed descriptors would still be needed. This is conditional architecture, not a verified profile or automatic READY classification. |
| Complete newline-normalized `sourceContentHash` | Pin all response text after CRLF/CR-to-LF normalization, not a legal excerpt, parsed DOM or search text. Raw receipt SHA-256 is separately labelled. Any drift requires review; do not learn new pins automatically. |

No stable publisher-issued immutable item identifier was established for B01/B02/G01/G02/U01/U02/I01/I03/L01 or the other HTML candidates. Titles, `itpr` filenames, authority footer, corporate number, ETag and Last-Modified are not such an identifier. The state publisher and main clause must be reviewed in complete successful server bytes before any exact-content pin could be proposed. For link-only J01/B03, identity verification would still not manufacture the linked rule. For PDF candidates, identity work alone cannot resolve the transport format barrier.

Thus “representable by the merged identity architecture” is different from “already verified by an existing profile.” No ready classification is earned merely because an opaque reviewed-item key could be allocated later.

## 7. Gap matrix and F8 boundary

| Dimension | Current finding | Required closure before a later positive path |
| --- | --- | --- |
| Source authority | Competent Japanese state publications exist; B01 carries its own positive Swiss guidance | Pin publisher/competence per actual item; do not borrow authority from a directory or third party |
| Retrieval | 32/32 direct requests denied; browser availability differs | At least one semantically sufficient exact source set must be repeatedly obtained as complete compatible bodies from intended server egress within unchanged limits |
| Content identity | Merged graph/fingerprint architecture could represent reviewed HTML; no Japanese verifier proven | Review successful server bytes, external-ID absence, item boundaries, locale/media/final URL and drift; separately design a narrowly pinned profile |
| Semantic completeness | B01 is useful but not fully qualified; ordinary-class mapping/currentness/initial-period interpretation remain open; L01 supplies explicit ordinary wording in an outdated rendering | Complete traceable positive CH ordinary-national-passport support with purpose/activity/initial-duration qualifiers; do not use stale L01 to fill B01 |
| Applicability representation | Current `regulierungs-anwendbarkeit.ts` schema 2 has explicit activity characteristics, planned-stay quantities/counting and national-passport predicates; #857 keeps it dormant | Missing user/trip facts remain unknown. Unspecified counting remains unresolved. Do not convert `business` into activity assertions, invent date arithmetic or flatten to unconditional exemption |
| Extractor feasibility | Trusted extractor and composition production registries are empty. Strict canonical field readers and exact source/item/representation bindings remain | Feasibility is conditional; no registered JP family, selector/parser or composition policy exists. A set of pages is not an executable family |
| Provenance/freshness | Fresh fetch times and visible/HTTP dates are separated; no successful direct regulatory snapshot | Review exact successful bytes and current official scope; define freshness separately. No fixed refresh SLA or legal effective date invented |
| Conflict/gap | Old LA/PDF renderings; UK “further 90 days” versus six months; UK “less than” boundary; ISA general extension versus bilateral guidance; browser-only path move | Keep unresolved broader branches blocked. Extension ambiguity is not invented as a mandatory condition on an otherwise fully supported initial visit, but cannot be silently erased from a six-month claim |
| Smallest next slice if READY | **Not applicable: this audit is NOT_READY** | No profile implementation/design dispatch is selected or started. TL may first consider a separately bounded intended-egress retrieval qualification of B01 and its required official support, with explicit semantic review, if independently warranted |
| Why F8 stays closed | No qualified source retrieval, JP identity profile, accepted support family, trusted extraction, accepted Evidence/Rule or persistence route | Research and browser text cannot mint authority. `official-truth-store-server.ts` rejects every schema-2 carrier before side effects; this audit cannot activate it |

Scope guards retain the distinction between document issuer, citizenship, ordinary class and the verified national-passport link. Transit, blank-page applicability and arrival forms remain unestablished where not explicitly supported. No `otherwise required` complement is introduced.

## 8. Findings and delivery boundary

- **P0: none found in this docs-only delivery.** This is not a platform-wide security review.
- **P1 JP-F01 — retrieval blocker remains:** no tested alternate yields a complete compatible successful server body. This blocks source readiness.
- **P1 JP-F02 — complete current semantic support not established:** promising state wording cannot yet supply a reviewed current ordinary-passport family with all needed qualifications. This blocks a deterministic accepted pilot claim independently of a future transport fix.
- **P2 JP-F03 — profile and path continuity remain unqualified:** existing schema headroom is not a JP verifier; browser moves/localization and full-response drift must fail closed.
- **P2 JP-F04 — currentness and cross-source boundaries:** legacy content and extension/unit/scope differences must remain visible. No silent freshest-date winner or unrelated-country condition is adopted.
- **P3: no additional distinct finding.** Receipt limitations are stated with the affected claims.

No runtime/test source, registration, profile/extractor/policy activation, SQL/migration, Supabase/Production, provider, Evidence/Rule acceptance, F8, CH-11 or global continuity change. No follow-up started. Research helpers and raw response bodies stay outside the repository. No full application test/build, live DB action or deployment probe is claimed. Draft status and exact post-push head are independently read back before STOP.

**STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD EXACT-HEAD REVIEW.**
