# GOV.UK ETA clause-complete primary-source audit 1

Date: 5 October 2026 · Issue #844 · Draft PR #845 · Generation 1

**ETA_SEMANTIC_CONTRACT_STILL_NOT_READY**

This is a documentation/evidence audit, not accepted Evidence or an executable rule contract. It does not authorise implementation. The public primary sources close many individual clauses but do not close the Irish no-application reference-time question or prove complete residual exemption coverage. No general `required` branch is safe for this cell.

## 1. Binding scope and live authority

Logical writer: **Jetnity Official Truth GOV.UK ETA clause-complete audit 1**. Repository: `Jetnity/jetnity`. Branch: `audit/official-truth-govuk-eta-clause-complete-audit-1`. Baseline/main: `225878a9a7cd7f07a9167b502b8c688fa1613be1`. Immutable task seed: `a97e2e632a460070bcd2a50802c6aec997825101`. Immutable task blob: `173d1ae4d12f20a2f9e2bb601e83c0f710a980da`.

The full binding task was read. Before research, current origin/main, `.jetnity/operating-mode.json` (`NORMAL`), #751, relevant MATERIAL and triage in #748, #844 and Draft #845 were read live, including Technical-Lead dispatch comment5993593800. #751 names this one active writer. The latest processed #748 MATERIAL was5988971332, triaged by5989855107; the41-comment snapshot contained no later MATERIAL. The report records the repeat delivery check. Live evidence takes precedence over historical notes.

Exact session: `01a10be5-a09c-7373-a5ea-f8251b04328b`. Local Codex session metadata and turn context record `gpt-6-astra`, effort `xhigh`; session start `2026-10-05T11:49:20.671Z`, Codex Desktop. This is independent of the earlier #843 session, but this writer’s self-review is not independent Technical-Lead review.

Only the immutable task and four delivery documents belong in this PR. No runtime, schema, tests, UI, traveller fields, database, Supabase, registration, extractor, activation, accepted Evidence, Rule acceptance, F8, production, provider integration or paid external API work is performed. CH-01..CH-10 remain `RESEARCH_ONLY` and `NOT_APPROVED_FOR_DATABASE_IMPORT`. CH-11 and global source research are not started.

### Exact audited cell

| Dimension | Audited fact / limit |
|---|---|
| Fact and result layer | `electronic_travel_authorization`, `requirement_effect` (A) |
| Journey | One identified inbound UK destination journey, destination `GB`; genuinely no transit claim and no domestic UK journey; `transitCountryCode: null` is insufficient without that journey fact |
| Citizenship | Complete sorted set exactly `[CH]`, not merely selected passport nationality |
| Selected credential | Passport, ordinary class, Swiss citizenship linkage; issuer is a separate recorded concept, not a citizenship inference |
| Date | Travel on/after2April2025 for CH rollout; this snapshot does not establish every past/future rule version. German scheme described from1August2026; no retroactive application |
| Not fixed | Residence, Irish entitlement/restrictions, origin, age, Visitor capacity, pupil/school/party relationship, permission/status, service/crew roles and form facts are not defaulted |
| Meaning of audit closure | Source-complete semantics and coverage, not merely that a hypothetical ordinary tourist probably needs an ETA |

The missing historical22,965-byte Content API body was not recovered. Its old hash is not evidence for this audit. Current complete HTML/PDF bodies were freshly fetched, independently inspected and hashed. HTML and Content API representations have different bytes; their hashes are not compared as if they were the same representation.

## 2. Main determinations and unresolved cells

| Task cell | Fresh result | Evidence IDs / consequence |
|---|---|---|
| Actual Irish residence | Required separately from entitlement | I02; an address or residence country alone is insufficient |
| Entitlement under Irish law | Separate required limb | I03; no derivation from Swiss citizenship alone |
| Minister consent | Restriction on leaving OR attempting to leave defeats this lawful-residence definition | I04; consent obtained is not shown to cure being subject to restriction |
| Origin / CTA | Elsewhere in CTA relative to UK entry; IE/GG/JE/IM in guidance | I01,I07,I12; UK itself not an inbound origin for this exemption |
| Age/evidence duty | Age16+ if required; under16 not general exclusion from residence test | I08-I11; evidence absence not categorical false |
| Application-time phrase | Grammar points to legislation/rules, but legal temporal reach and non-applicant reference event remain unresolved | I05-I06,I13; no substitution of travel/check/hypothetical application time |
| French core school semantics | Age<=18; studies at qualifying registered institution; party>=5 pupils; same institution organises; Visitor | F01-F04 |
| French form / extra authority | Completed/authenticated listing, supervising adult custody, prefecture process and stamp, school declaration, required supporting material | F03,F05-F09; authority action exists in addition to Ministry registration |
| German core school semantics | Age<=19; studies at qualifying institution; existence confirmation; same organiser; Visitor; pupils are count unit | G01-G05; ETA1.10 itself omits unit, explicit cross-references resolve it |
| German two confirmations | Institution existence confirmation AND completed-form authentication are distinct objects/actions | G03,G05-G08; one boolean cannot encode both |
| School edge boundaries | Mixed-group counting with British pupils omitted from German form, origin wording on form, and non-CH document differences are preserved without invented exclusions | G07-G08; source text is documented, automatic treatment beyond clearly described path remains unresolved |
| Residual no-ETA coverage | More routes than Appendix1.3/1.7/1.9/1.10 exist; status/permission/crew and case-specific public guidance not closed-world complete | C01-C36 and coverage ledger; no residual `required` |
| A versus B | Application and use conditions stay separate; CD ETA recognition is use/satisfaction, not no-ETA | B01-B04,C32,U01 |

### The application-time gap, precisely

ETA1.4 attaches a relative clause about legislation/rules applying in Ireland to the time of an ETA application. That syntactic observation does not establish an authoritative legal interpretation of whether the temporal qualifier governs the legal framework only, personal residence/entitlement facts as well, or a different assessment convention. ETA1.3 exempts the qualifying person, and the Irish-resident guidance expressly considers arrival without an ETA. Neither that guidance nor current CTA guidance supplies a reference event for a traveller who never files an application. Filing an otherwise unnecessary ETA application is not a lawful workaround established by these texts.

The minimum needed is an official Home Office/GOV.UK clarification or amended operative clause that explicitly identifies (1) what the qualifier time-binds and (2) the reference event for a person relying on the exemption who has never applied. A current document’s validity at travel is a different proposition. Until clarified, this semantic cell is `unresolved`, even if all personal facts were known. The official phrase search was bounded discovery, not proof of universal absence of clarification.

### School clauses as a reviewable conjunction

For either country, retain separate facts for the traveller, institution, party and journey. The traveller studies at the SAME institution whose country/status qualifies and which organises the SAME party the traveller joins for the Visitor entry. The party threshold is five pupils, not five humans including escorts. The traveller must be listed in the correct completed/authenticated form held at the border by the adult responsible for supervising that party’s travel. The form declarations, supporting material and authentication process are recorded below rather than replaced with a generic “school trip” flag.

French institution registration is with the Ministry of Education; prefecture checking/stamping is a second action on the form. German institution existence confirmation is by the relevant municipal OR competent authority; authentication of the completed form is a separate action, even if performed by the same authority. The guide’s German parent-consent carrying recommendation is distinct from mandatory submission with the form. For mixed groups, the form’s listed total is not silently treated as the entire party’s pupil total when an explicit listing exception exists.

## 3. Coverage ledger: no residual required

Class labels below are the task’s dispositions. “Modelled” denotes existing vocabulary for a narrowly defined atom, not activated production truth or complete route support. For every in-scope route, absent context is `unknown`. No negative is derived from failure to observe a record, passport class, nationality stereotypes, or a non-exhaustive official list.

| Route | Fresh evidence | Disposition for exact cell | What prevents a sound residual exclusion |
|---|---|---|---|
| British / Irish citizenship, including dual | C01,U02 | Excluded by explicit audited scope fact | Complete `[CH]` excludes either citizenship; selected CH passport alone would not |
| Valid UK entry clearance | A01,C02 | In scope and modelled for a positive validity atom | Need journey-valid class-wide evidence; no row/expired item is not universal absence |
| UK permission enter/stay; visa, settled/pre-settled | A01,C02 | In scope and modelled for positive permission atom; context gap | Status validity, persistence and absence across alternatives not established |
| Right of abode | C03 | In scope but semantic/context gap | Not equivalent to passport type or ordinary leave; source-backed exclusion absent |
| Jersey/Guernsey/Isle-of-Man permission | C04 | In scope but semantic/context gap | Recognition, jurisdiction/type and current validity cannot be collapsed into generic residence country |
| Pending EUSS, saved admission, unresolved appeal, island pending schemes | C05-C06,C33 | Still unresolved | Broad no-ETA summary versus valid application/certificate/saved-right/ID-specific conditions; joining/late/appeal boundaries not all resolved |
| Airside UK airport transit | C08 | Excluded by explicit audited scope fact | Actual inbound destination/non-transit fact, not null alone |
| Landside transit | C08 | Unrelated to exact destination-only cell | No broad exemption inferred; a different journey cell would need review |
| BOTC status / passport | C07 | Still unresolved | Person-status rule vs passport-use guidance for selected CH credential; status cannot be inferred absent from ISO citizenship set |
| BNO status / passport | C07 | Still unresolved | Same distinct status/credential issue |
| Lawfully resident Ireland + elsewhere CTA | I01-I12 | In scope but semantic/context gap; reference time unresolved | Actual residence, entitlement, restriction, origin AND no-application time remain necessary |
| French school party | F01-F09 | In scope but context/schema gap | Core predicates source-closed; relationship, organiser, listed/authenticated form and adult custody not exactly represented |
| German school party | G01-G09 | In scope but semantic/context gap | Separate confirmations; form relations; mixed-party/origin boundaries not defaulted |
| Diplomatic mission agent | C10 | In scope but context gap | Current qualifying UK posting/function unknown |
| Diplomatic admin/technical or service staff | C10 | In scope but context gap | Overseas residence and absence at offer; continuous membership; mission vs private service |
| Locally engaged diplomatic staff | C11 | In scope but context gap | Legitimate function and overseas recruitment; not UK-recruited |
| Taipei representative office qualifying role | C11 | In scope but context gap | Full-time covered level, overseas residence/presence at offer; no citizenship shortcut |
| Consular officers / employees / overseas-recruited local staff | C16 | In scope but context gap | Covered role and employee/history conditions; consular service/honorary exclusions only route-local |
| Qualifying household spouse/civil partner/child | C12 | In scope but context gap | Actual exempt principal/category, household and dependency |
| Overage student dependants | C13 | In scope but context gap | All age/study/financial/household/end-date conditions |
| Exceptional older dependants / reciprocal unmarried partners | C14 | Still unresolved | Case-specific official confirmation/reciprocal terms not enumerated in public guidance |
| Role/relationship cessation and continuing leave | C15 | In scope but context gap |31-day departure boundary;90-day leave; prior permissions and CTA departure |
| Sovereign/head of state; household; private servants; ex-reigning house | C17 | In scope but context gap / case-specific unresolved | Recognition, direction, household/function and case determination; ordinary passport is not exclusion |
| Serving government minister and accompanying household | C18 | In scope but context gap | Own ministerial office, official business, direction, accompanying family |
| International conference | C19 | Still unresolved | Particular prior agreement/order and covered people, not conference label |
| International organisation staff/representatives/contractors/interns/family | C20-C22 | Still unresolved | Each agreement/legislation and role; public list expressly non-exhaustive, footnotes restrict roles |
| Three named EU offices and qualifying household | C23 | In scope but context gap | Office/household unrecorded; do not research present officeholders or invent citizenship disqualification |
| HM regular forces | C24 | In scope but context gap | Current service-law status |
| HM reserves | C24 | In scope but context gap | Deployment/due-deployment and service-law timing; application-route exclusions differ |
| Commonwealth/colonial force training | C25 | In scope but context gap | Actual force, training with home forces; no nationality heuristic |
| Visiting force / Orders / PfP / NATO SOFA | C25 | Still unresolved | Covered force/role/order and status evidence; not all civilians/dependants inherit exemption |
| International HQ/defence organisation service | C25 | In scope but context/agreement gap | Designated organisation and current posting |
| Operating ship/air/train crew with departure engagement | C26-C28 | Still unresolved | Role/conveyance/schedule and all statutory exceptions; differing current guidance restriction not harmonised |
| Seafarer joining / repatriating / ILO-book route | C28-C29 | In scope but context gap | Actual role, document issuer vs nationality, contract and ship leavingUK waters |
| Ferry operating or joining crew | C29 | In scope but context gap | Working journey and vessel leavingUK waters; visitor activity differs |
| Aircrew deadheading/positioning | C30 | In scope but context gap | Working capacity and leavingUK; separate from operating-crew route |
| International rail crew | C31 | In scope but context gap | Through/shuttle crew, control-area OR7-day departure test; no airport-transit shortcut |
| Crown Dependency ETA recognition | C32 | Application/use-only and not a requirement exemption | A valid recognised ETA may satisfy travel authorisation; it does not make ETA not required |
| Ordinary CTA deemed leave on entry | C33 | Not established as an A exemption; do not infer one | Permission acquired at entry differs from exemption before travel; ETA CTA guidance still applies |
| Frontier-worker protected entry | C34 | Still unresolved | Actual right/permit plus exact ETA mapping needed; generic work/residence flag insufficient |
| S2 healthcare patient/supporter incl viaIreland | C35,C33,B01 | Still unresolved | Visa-free/on-entry permission and B exclusion do not themselves prove A effect for each mode |
| Diplomatic transit to/from third-country posting | C36 | Excluded by explicit audited scope fact | Actual non-transit destination journey |
| Visa/biometric/fee waiver; delegation or passport label | C36 | Unrelated as standalone A exemption | Does not establish exempt status; some other route could still apply |
| Jordan2024 transition | U01 | Unrelated to exact cell | Nationality and dates explicitly differ |
| ETA application validity/suitability, refusal, duration, passport matching, cancellation | B01-B04 | Application/use-only and not a requirement exemption | Do not contaminate A with B |

This is an explicit inventory of routes surfaced by the current bounded official source graph. It is **not** proof that every possible legal agreement or case-specific admission right has been exhausted. That missing proof is itself material to task§6D. The residual-safe set is empty in this audit: no exact traveller in the cell has all alternatives soundly excluded by a complete, source-backed context contract. One sufficient proven exemption could decide A negatively in a separately reviewed design, but failure/unknown of one route cannot decide A positively.

## 4. Clause-to-layer inventory

| Clause / section | Layer | Reason |
|---|---|---|
| Appendix introduction, ETANL1.1(d) | A requirement boundary | Specified nationalities and commencement, subject to all exemptions |
| Appendix introduction existing valid permission | A exemption | Explicit no-ETA effect |
| ETA1.1(a)-(f),1.2 | B application | Channel/email/fee/passport/photo/categories; ETANL is also an independently sourced A cohort |
| ETA1.3 | A exemption | Ireland/CTA conjunction |
| ETA1.4 | A definition/exception plus unresolved time | Residence, entitlement, legal framework, Minister restriction |
| ETA1.5 | B application | Invalid application rejection |
| ETA1.6 | Evidence duty | Age16+ and if-required proof |
| ETA1.7 | A exemption | Status wording; passport guidance reconciliation unresolved |
| ETA1.8 | Unrelated; historic B use | Jordan2024 transition |
| ETA1.9 /1.10 | A exemption | School/age/party/organiser/Visitor |
| Part1 11/11A/11B | Document/entry rules; relevant cross-reference | National ID scope and explicit pupil count; not general ETA application passport matching |
| Part1 11C/11D | A incorporated form condition | Expressly applies to ETA1.9/1.10, including listing/authentication/adult custody |
| School forms pp1-3, guidance preparation | A incorporated form content and procedural/evidence duties | Neither omit nor promote every recommendation to independent A predicate |
| ETA2.1,2.2,2.3,2.4,2.5,2.7,2.8,2.9 | B suitability | Refusal grounds, not exemptions;2.6 deleted |
| ETA3.1 | B decision | Grant/refusal based on validity/suitability |
| ETA4.1/4.2/4.3 | B use | Duration, journey categories and same application passport |
| ETA5.1-5.7 | B cancellation | Mandatory grounds;5.6 still present despite2.6 deletion |
| ETA5.8 | B cancellation | Discretionary validity failure at application or subsequently |
| S4/S5 no-ETA lists; S8 exemptions/other arrangements | A routes plus evidence/context | Public summaries do not erase omitted German school rule or other live primary text |
| S24 CD ETA recognition | B use/satisfaction | Recognised authorisation already held, not permission to enter or no-ETA status |

B cross-references such as digital-photo requirements, Creative Worker CRV3.2, criminality adjudication guidance and historical VN2.2(o) are identified rather than re-researched. Their internal adjudication criteria are outside task§6. B records below are a layer-boundary inventory, not a claim of clause-complete suitability adjudication. Every A clause/qualifier used in the scoped determinations is expanded in the records; unresolved cross-references remain identified gaps.

## 5. Current Jetnity representability after source review

Read-only code basis at the immutable baseline: `lib/readiness/regulierungs-anwendbarkeit.ts` (`REGULIERUNGS_SCHEMA=1`, context/type definitions, parsers and atom evaluators), `lib/readiness/official-truth-composition-policy-registry.ts` and `lib/readiness/official-truth-store-server.ts`. Current strict keys and versions are a contract, not an invitation to reinterpret existing facts. No code changed.

Dispositions: **E** = already exactly representable at the named atom level; **C** = clarified meaning with no code change, but only with honest upstream evidence; **D** = bounded future schema/context delta needed; **U** = must stay unsupported pending official semantics or comprehensive context. These are architecture findings, not new enum names.

| Required semantic atom | Existing surface | Disposition and limitation |
|---|---|---|
| Complete citizenship set exactlyCH | citizenshipCountryCodes, source/request scope | E for exact set; `citizenship_includes` alone proves inclusion, not completeness |
| Credential passport + CH link + issuer distinct | credential.documentType / relatedCitizenshipCountryCode / issuingCountryCode; credential link predicate | E/C for recorded linked passport; cannot infer status absence or A solely from issuer |
| Ordinary document class | documentClass / document_class | E; scope fact only, does not exclude diplomatic/crew exemption |
| Destination, identified leg, non-transit, rollout date | outer request/source scope | C; must bind one journey and actual purpose of entry, not generic profile or null transit field alone |
| Valid entry clearance; valid permission enter/stay; visa | destination_permission, destinationPermissions validity | E for a valid bound positive class fact; C for a truly class-wide negative; one expired item or empty list insufficient |
| Island permission recognised inUK | destinationPermission classes can express some resulting UK permission | D for jurisdiction/legal-effect distinction; U if actual recognition/validity unresolved |
| Right of abode / EUSS pending or appeal / statutory entry right | no exact dedicated distinction | D for context; U for unresolved route boundaries; do not relabel all as residence_permit |
| Residence country | residenceCountryCode | E only for recorded country; insufficient for actual residence/entitlement |
| Actual Irish residence in legal conjunction | lawfulResidence has entitlement/departure only | D: independently bound actual-residence fact missing |
| Entitled to reside inIreland | lawfulResidence.entitlement | C for exact known legal entitlement; no inference from CH citizenship/address |
| Minister-consent restriction on leave/attempt | lawfulResidence.departure unrestricted/restricted | C only if evidence defines precisely this legal restriction, not generic freedom to travel; D for reference-time/source binding |
| Irish legal-framework time, personal-fact time, missing application event | no field | U until official interpretation; D only after source closure, no travel-date substitution |
| ElsewhereCTA origin | journey_origin country/region | E country comparison; CTA enum exists but `REGULIERUNGS_REGION_PINS` is empty. Region evaluation intentionally unsupported without separately authorised pin; also excludeUK explicitly |
| Age<=18/19, evidence threshold16 | ageOnTravelDate / age predicate | E age atom for journey-bound age; C for rule situation; evidence duty must not become exemption prerequisite |
| Visitor capacity | travelPurpose / travel_purpose | C only if it denotes the legal Visitor journey of school rule; business/study profile tags are not synonyms; no ETA1.1 duration import |
| Studies-at relationship | travellerIncluded only says inclusion | D: traveller-to-institution study relationship missing |
| Qualifying French institution | french_ministry_of_education_school | C for actual institution meeting registration condition; D for identity binding to traveller and organiser |
| Qualifying German institution/existence confirmation | confirmed_german_school; authority_confirmation subject institution_status | C for institution object only; D for authority/action/object/time binding; not form authentication |
| Same institution organises same party | no exact relation | D |
| >=5 pupils, not escorts | group_size_at_least / groupSize generic | D for pupil-specific unit/cohort/party and listing-exception semantics; cannot silently change legacy generic count meaning |
| Traveller enters as part of party | group_membership / travellerIncluded | C for actual bound party inclusion; D for study and form-listing relations, which are separate |
| Named correct form/version, complete fields | no exact field | D |
| Traveller listed in that form | travellerIncluded is not form listing | D |
| Prefecture form checking/stamp vs Ministry registration | authorityConfirmed only institution subject | D; two distinct objects/actions |
| German institution existence confirmation vs form authentication | one institution-only authorityConfirmed | D; distinct acts even if same authority |
| Relevant municipal OR competent authority | no exact actor validation | D; no invented authority enum |
| Headteacher signature, declarations, pupil consent, supporting submission and deadlines | no exact context | D; requirements vs recommendations must remain separate |
| Supervising adult at border holds same form and is responsible for same party | no exact relation | D |
| Form original/copy and border retention | no exact evidence-duty context | D if later product exposes proof duties; not itself an independent no-ETA rule |
| BOTC/BNO held/not_held | nationalityStatuses / nationality_status | E for explicit status fact; U for status-vs-selected-passport unresolved semantics |
| Exempt-control category, principal/household, role/history, official purpose, treaty/order, contrary direction, cessation | no exact predicates | U for complete route/negative coverage; bounded future contexts only after authoritative scope established |
| Operating/joining/deadheading/repatriating crew; conveyance; schedule; control-area; statutory exceptions | no exact predicates | D for facts; U for unresolved exceptions/complete route semantics |
| Frontier/S2/saved admission and mode-specific rights | no exact predicates | U now; D after official clarification |
| Evidence request, alternatives and official assessment of Irish proof | no exact border-evidence evaluator | U as automated legal proof determination; absence of a document must not become false |
| ETA application national-passport qualification, exact matching passport, suitability, validity/use | existing credential link is only citizenship linkage | U in A; B design separate, not a reason to distort A or create new traveller fields here |
| All exemption alternatives proven false / excluded with complete coverage | no completeness witness | U; negating sparse facts cannot certify this |

For the full newly audited A contract, a versioned delta is genuinely necessary: schema1 lacks independent study/organiser/form/adult relations and reference-time distinctions. Existing generic `groupSize` and institution-only authority confirmation cannot be made clause-complete merely by renaming their labels. An honest future change would require a separately reviewed version (potential schema2), not an unversioned semantic rewrite. **No schema2 names or implementation are proposed here.** A limited positive existing-permission atom does not in itself require schema2; neither does an unrelated B passport condition justify an A schema change.

Schema1 is strictly parsed; policy registry currently pins applicability schema1 or null; runtime/store acceptance gates remain unchanged. Bounds (depth4, nodes16, operands8, branches8) are additional design constraints, not justification to drop conjuncts. No branch expression, new enum, composition policy, source registration or CTA pin is created.

## 6. Remaining evidence needed and exact stop condition

| Gap | Smallest official evidence needed | Status until obtained |
|---|---|---|
| R1 Irish time / no application | Operative amendment or explicit HO/GOV.UK interpretation specifying qualifier target and reference event for never-applicant | Unresolved; independently sufficient for NOT_READY |
| R2 BOTC/BNO status on Swiss ordinary passport | Official reconciliation of ETA1.7 person-status rule with passport-use summaries | Do not exclude merely from selected credential or ISO set |
| R3 Pending/saved admission including late/appeal/joining and island cases | Current explicit official ETA treatment for passport traveller in each remaining case | Unknown routes cannot be false |
| R4 Exempt-control/crew complete coverage | Applicable official agreement/order and scope/exception evidence for candidate categories; authoritative reconciliation of crew statutory restriction, seven-day/departure/airport and prior-refusal-cure wording; or explicitly approved narrower scope with source-backed exclusions | No exhaustive residual coverage claimed; no global treaty sweep or contact initiated |
| R5 Frontier/S2 precise ETA effect | Current explicit HO/GOV.UK mapping from protected status/arrival mode to ETA requirement, distinct from visa/permission/B eligibility | Unresolved, not automatically no-ETA or required |
| R6 German form edges | Official clarification where needed on pupil party total versus British listing exception, departure outsideGermany, and guide/form document alternatives for counted mixed parties | Core criteria preserved; unsupported edge not defaulted |

Even closure of R1 alone would not close the residual ledger. Unknown traveller facts are a separate context problem from unresolved law. A reviewer can accept the completeness of this audit’s disclosure without accepting any legal rule, evidence record or implementation. Next action is independent exact-head review of this docs-only PR; any further clarification/research or dormant design requires separately scoped Technical-Lead authority. This writer stops after delivery.

## 7. Retrieval method and review instructions

All legal evidence is from direct GOV.UK pages or GOV.UK-linked assets.publishing.service.gov.uk PDFs. Additional pages follow the official navigation/search graph recorded per source. Preliminary connectivity/discovery output and search snippets are not legal evidence. D1-D7 are retained only to document discovery; S12 is a redirect/navigation record. No tracking parameters were used; official search `keywords` parameters are functional queries, not tracking. No account cookies, authorisation headers, secrets or traveller data are persisted.

Each retrieval used HTTPS, followed only HTTPS redirects, requested identity content encoding and recorded UTC start/finish surrounding the complete transfer. Byte count and SHA-256 refer to the entire received final response body as saved, not extracted clauses, reformatted text or response headers. All body lengths/hashes were independently recomputed from scratch files before document generation. S12 redirects301 to its200 landing; all other requests have zero redirects. All final statuses200. No claim of freshness extends beyond each finish timestamp.

HTML titles/content IDs/publication metadata and visible version dates are separate fields. Headers, raw bodies, local text-reading helpers and PDF renders remain outside the repository in temporary audit scratch; they are not part of the durable PR. A future fresh request can differ in dynamic bytes even without legal changes. The durable review evidence is the structured paraphrase and exact locator joined to its recorded response identity. Do not claim the raw bytes are in Git.

Both school PDFs were text-read across all11 pages. Pages2 and3 of each were rendered and visually inspected to verify declarations, authority stamp areas, section counts and accompanying-adult distinction. Blank pupil/escort tables and Border Force page11 were inspected as form structure; no form was completed. No PDF creation, application, upload or registration was performed.

Record conventions: each `evidenceId` is audit-local, never an accepted `ev2_` ID. `conditions[]` and `exceptions[]` retain labelled ALL/ANY and scope relationships. Empty arrays mean no additional exception asserted in that row, not proof none exist anywhere. `sourceLocator` is a named heading/clause or printed PDF page, stable enough to locate the paraphrase without relying on dynamic generated IDs. `retrievedAt` is the full UTC finish of the joined source; the ledger also supplies start. `crossReferences[]` explicitly names inspected and uninspected references; uninspected references cannot close a semantic cell. Unresolved/conflicting interpretations are marked as such rather than silently normalised.

## 8. Complete retrieval ledger

| Source | Official title | Semantic records |
|---|---|---|
| S1 | [Immigration Rules - Immigration Rules Appendix Electronic Travel Authorisation - Guidance](https://www.gov.uk/guidance/immigration-rules/immigration-rules-appendix-electronic-travel-authorisation) | A00, A01, I01, I02, I03, I04, I05, I08, F01, F02, G01, G02, C07, B01, B02, B03, B04, U01 |
| S2 | [Immigration Rules - Immigration Rules part 1: leave to enter or stay in the UK - Guidance](https://www.gov.uk/guidance/immigration-rules/immigration-rules-part-1-leave-to-enter-or-stay-in-the-uk) | I07, F03, F04, G03, G04 |
| S3 | [Electronic travel authorisation: Irish resident exemption (accessible)](https://www.gov.uk/government/publications/electronic-travel-authorisation-irish-resident-exemption-caseworker-guidance/electronic-travel-authorisation-irish-resident-exemption-accessible) | I06, I09, I10 |
| S4 | [Get an electronic travel authorisation (ETA) to visit the UK: When you do not need an ETA](https://www.gov.uk/eta/when-not-need-eta) | I11, C01, C02, C05 |
| S5 | [Electronic travel authorisation: caseworker guidance (accessible)](https://www.gov.uk/government/publications/electronic-travel-authorisation-caseworker-guidance/electronic-travel-authorisation-caseworker-guidance-accessible) | C08, I13 |
| S6 | [Visit the UK as part of a French school trip](https://www.gov.uk/guidance/visit-the-uk-as-part-of-a-french-school-trip) | F05, F06, F09 |
| S7 | [Visit the UK as part of a German school trip](https://www.gov.uk/guidance/visit-the-uk-as-part-of-a-german-school-trip) | G05, G06, G09 |
| S8 | [Entering the UK: exemptions to controls](https://www.gov.uk/guidance/entering-the-uk-exemptions-to-controls) | C09, C26, C29, C30, C31 |
| S9 | [Immigration Rules - Immigration Rules Appendix ETA National List - Guidance](https://www.gov.uk/guidance/immigration-rules/immigration-rules-appendix-eta-national-list) | A02 |
| S10 | [France-UK School Trip Travel Information Form](https://assets.publishing.service.gov.uk/media/679a182bdc6d75ae3ddc7b6e/France-UK_school_trip_travel_information_form.pdf) | F07, F08 |
| S11 | [Germany-UK School Trip Travel Information Form](https://assets.publishing.service.gov.uk/media/6a918e82df4246cf45e466b2/German-UK_school_trip_form_reader_extended_-_09-26.pdf) | G07, G08 |
| S12 | [Exemptions for visa applications: caseworker guidance](https://www.gov.uk/government/publications/exempt-exm) | Official navigation/search result links only; no legal proposition derived |
| S13 | [Apply to the EU Settlement Scheme (settled and pre-settled status): After you've applied](https://www.gov.uk/settled-status-eu-citizens-families/after-youve-applied) | C06 |
| S14 | [Prove you have right of abode in the UK: Overview](https://www.gov.uk/right-of-abode) | C03 |
| S15 | [Exemption from immigration control (Non armed forces) (accessible)](https://www.gov.uk/government/publications/exempt-exm/exemption-from-immigration-control-non-armed-forces-accessible) | C10, C11, C12, C13, C14, C15, C16, C17, C18, C19, C20, C21, C23, C36 |
| S16 | [Aircrew: CRM02](https://www.gov.uk/government/publications/aircrew-crm02/aircrew-crm02) | C27 |
| S17 | [Seafarers](https://www.gov.uk/government/publications/seafarers-crm01/seafarers-crm01) | C28 |
| S18 | [Entering the UK: Before you leave for the UK](https://www.gov.uk/uk-border-control/before-you-leave-for-the-uk) | Corroborating sections explicitly named in evidence crossReferences and coverage ledger; not an independent exemption |
| S19 | [List of international organisations whose employees qualify for exempt entry clearances (accessible version)](https://www.gov.uk/government/publications/exempt-exm/list-of-international-organisations-whose-employees-qualify-for-exempt-entry-clearances-accessible-version) | C22 |
| S20 | [Travelling to the UK from Ireland, Isle of Man, Guernsey or Jersey](https://www.gov.uk/guidance/travelling-between-the-uk-and-ireland-isle-of-man-guernsey-or-jersey) | Corroborating sections explicitly named in evidence crossReferences and coverage ledger; not an independent exemption |
| S21 | [Appendix HM Armed Forces: caseworker guidance (accessible)](https://www.gov.uk/government/publications/appendix-hm-armed-forces-caseworker-guidance/appendix-hm-armed-forces-caseworker-guidance-accessible) | C24 |
| S22 | [Appendix International Forces: caseworker guidance (accessible)](https://www.gov.uk/government/publications/appendix-international-forces-caseworker-guidance/appendix-international-forces-caseworker-guidance-accessible--2) | C25 |
| S23 | [Common Travel Area guidance](https://www.gov.uk/government/publications/common-travel-area-guidance/common-travel-area-guidance) | U02 |
| S24 | [Common travel area (accessible)](https://www.gov.uk/government/publications/common-travel-area/common-travel-area-accessible) | I12, C04, C32, C33 |
| S25 | [Frontier Worker permit: Overview](https://www.gov.uk/frontier-worker-permit) | C34 |
| S26 | [Enter the UK as an S2 Healthcare Visitor](https://www.gov.uk/guidance/enter-the-uk-as-an-s2-healthcare-visitor) | C35 |
| D1 | [electronic travel authorisation - Search](https://www.gov.uk/search/all?keywords=electronic%20travel%20authorisation) | Official navigation/search result links only; no legal proposition derived |
| D2 | [German school trip - Search](https://www.gov.uk/search/all?keywords=German%20school%20trip) | Official navigation/search result links only; no legal proposition derived |
| D3 | ["time of the ETA application" - Search](https://www.gov.uk/search/all?keywords=%22time%20of%20the%20ETA%20application%22) | Official navigation/search result links only; no legal proposition derived |
| D4 | [Appendix HM Armed Forces: caseworker guidance](https://www.gov.uk/government/publications/appendix-hm-armed-forces-caseworker-guidance) | Official navigation/search result links only; no legal proposition derived |
| D5 | [Appendix International Forces: caseworker guidance](https://www.gov.uk/government/publications/appendix-international-forces-caseworker-guidance) | Official navigation/search result links only; no legal proposition derived |
| D6 | [Common Travel Area: rights of UK and Irish citizens](https://www.gov.uk/government/publications/common-travel-area-guidance) | Official navigation/search result links only; no legal proposition derived |
| D7 | [Common travel area (immigration staff guidance)](https://www.gov.uk/government/publications/common-travel-area) | Official navigation/search result links only; no legal proposition derived |

### S1 — Immigration Rules - Immigration Rules Appendix Electronic Travel Authorisation - Guidance - GOV.UK

```json
{
  "sourceId": "S1",
  "canonicalRequestUrl": "https://www.gov.uk/guidance/immigration-rules/immigration-rules-appendix-electronic-travel-authorisation",
  "finalUrl": "https://www.gov.uk/guidance/immigration-rules/immigration-rules-appendix-electronic-travel-authorisation",
  "httpStatus": 200,
  "contentType": "text/html; charset=utf-8",
  "retrievalStart": "2026-10-05T11:53:29.001519Z",
  "retrievalFinish": "2026-10-05T11:53:29.336756Z",
  "byteCount": 88426,
  "responseSha256": "66128a951666671435796dcb682c0d1eda4cc8be1b5ae429b6943fcfe9c9614c",
  "redirectCount": 0,
  "contentEncodingRequest": "identity",
  "curlExit": 0,
  "redirectOccurred": false,
  "responseByteDefinition": "Full received final HTTP response entity body; identity encoding requested; no text normalization. Transport headers are not included in body hash.",
  "officialTitle": "Immigration Rules - Immigration Rules Appendix Electronic Travel Authorisation - Guidance - GOV.UK",
  "officialMetadata": {
    "govuk:format": "manual_section",
    "govuk:content-id": "2620750b-5453-44f1-98af-414037c833be",
    "govuk:first-published-at": "2023-04-12T08:39:02+01:00",
    "govuk:updated-at": "2026-08-03T11:12:11+01:00",
    "govuk:public-updated-at": "2026-08-03T08:55:43+01:00",
    "govuk:primary-publishing-organisation": "Home Office"
  },
  "visibleMetadataNotes": "Visible manual header: published25February2016, updated3August2026. HTML content-item dates below are section metadata, not the same field.",
  "discoveryAndNeed": "Mandatory binding-task start source; current HTML read independently.",
  "semanticEvidenceIds": [
    "A00",
    "A01",
    "I01",
    "I02",
    "I03",
    "I04",
    "I05",
    "I08",
    "F01",
    "F02",
    "G01",
    "G02",
    "C07",
    "B01",
    "B02",
    "B03",
    "B04",
    "U01"
  ],
  "corroboratingEvidenceIds": [
    "A02",
    "I06",
    "I12",
    "F03",
    "F04",
    "G03",
    "G04",
    "C33",
    "C35",
    "I13"
  ],
  "corroboratingLocators": [
    "S1 introduction; ETA 1.2; ETA 1.9; ETA 1.10",
    "S1 ETA 1.3-1.6",
    "S1 ETA 1.3-1.6",
    "S1 ETA 1.9",
    "S1 ETA 1.9",
    "S1 ETA 1.10",
    "S1 ETA 1.10",
    "S1 ETA1.1(f)(iii)",
    "S1 ETA1.1(f)(iii)",
    "S1 ETA1.3-1.4"
  ],
  "locatorScope": "Evidence-row sourceLocator fields below"
}
```

### S2 — Immigration Rules - Immigration Rules part 1: leave to enter or stay in the UK - Guidance - GOV.UK

```json
{
  "sourceId": "S2",
  "canonicalRequestUrl": "https://www.gov.uk/guidance/immigration-rules/immigration-rules-part-1-leave-to-enter-or-stay-in-the-uk",
  "finalUrl": "https://www.gov.uk/guidance/immigration-rules/immigration-rules-part-1-leave-to-enter-or-stay-in-the-uk",
  "httpStatus": 200,
  "contentType": "text/html; charset=utf-8",
  "retrievalStart": "2026-10-05T11:54:09.677704Z",
  "retrievalFinish": "2026-10-05T11:54:09.887205Z",
  "byteCount": 133188,
  "responseSha256": "061561100e7eead12d7290e02421270eee19ed5970186d89e76d44c249e44674",
  "redirectCount": 0,
  "contentEncodingRequest": "identity",
  "curlExit": 0,
  "redirectOccurred": false,
  "responseByteDefinition": "Full received final HTTP response entity body; identity encoding requested; no text normalization. Transport headers are not included in body hash.",
  "officialTitle": "Immigration Rules - Immigration Rules part 1: leave to enter or stay in the UK - Guidance - GOV.UK",
  "officialMetadata": {
    "govuk:format": "manual_section",
    "govuk:content-id": "36091118-41f7-47b2-932d-2ffd1dc51719",
    "govuk:first-published-at": "2016-02-25T09:18:53+00:00",
    "govuk:updated-at": "2026-08-03T11:12:11+01:00",
    "govuk:public-updated-at": "2026-08-03T08:05:02+01:00",
    "govuk:primary-publishing-organisation": "Home Office"
  },
  "visibleMetadataNotes": "Visible manual header: published25February2016, updated3August2026; section metadata kept separately.",
  "discoveryAndNeed": "Mandatory binding-task start source; operative11A-11D and CTA paragraph15.",
  "semanticEvidenceIds": [
    "I07",
    "F03",
    "F04",
    "G03",
    "G04"
  ],
  "corroboratingEvidenceIds": [
    "I01",
    "F01",
    "F02",
    "G01",
    "G02",
    "G06",
    "C03"
  ],
  "corroboratingLocators": [
    "S2 paragraph 15",
    "S2 11C",
    "S2 11A(h)",
    "S2 11D",
    "S2 11A(i)",
    "S2 11D",
    "S2 paragraphs12-14"
  ],
  "locatorScope": "Evidence-row sourceLocator fields below"
}
```

### S3 — Electronic travel authorisation: Irish resident exemption (accessible) - GOV.UK

```json
{
  "sourceId": "S3",
  "canonicalRequestUrl": "https://www.gov.uk/government/publications/electronic-travel-authorisation-irish-resident-exemption-caseworker-guidance/electronic-travel-authorisation-irish-resident-exemption-accessible",
  "finalUrl": "https://www.gov.uk/government/publications/electronic-travel-authorisation-irish-resident-exemption-caseworker-guidance/electronic-travel-authorisation-irish-resident-exemption-accessible",
  "httpStatus": 200,
  "contentType": "text/html; charset=utf-8",
  "retrievalStart": "2026-10-05T11:54:16.567391Z",
  "retrievalFinish": "2026-10-05T11:54:16.744506Z",
  "byteCount": 101988,
  "responseSha256": "9da39fc0eae6fe32b996dfd6ecddbe586d07f7bba9add08f1555e00a31b93ed8",
  "redirectCount": 0,
  "contentEncodingRequest": "identity",
  "curlExit": 0,
  "redirectOccurred": false,
  "responseByteDefinition": "Full received final HTTP response entity body; identity encoding requested; no text normalization. Transport headers are not included in body hash.",
  "officialTitle": "Electronic travel authorisation: Irish resident exemption (accessible) - GOV.UK",
  "officialMetadata": {
    "govuk:format": "html_publication",
    "govuk:content-id": "aea5bf30-ae34-42ca-9efa-cd64964a9bff",
    "govuk:first-published-at": "2023-07-25T16:30:10+01:00",
    "govuk:updated-at": "2026-07-23T19:40:26+01:00",
    "govuk:public-updated-at": "2023-07-25T16:30:09+01:00",
    "govuk:primary-publishing-organisation": "Home Office"
  },
  "visibleMetadataNotes": "Visible updated25July2023; v1.0 published to staff20July2023. Old rollout wording is not treated as current nationality list.",
  "discoveryAndNeed": "Mandatory binding-task start source; Ireland interpretation and proof.",
  "semanticEvidenceIds": [
    "I06",
    "I09",
    "I10"
  ],
  "corroboratingEvidenceIds": [
    "I01",
    "I05",
    "I07",
    "I08",
    "I12",
    "I13"
  ],
  "corroboratingLocators": [
    "S3 ETA rules: Exemption for Irish residents",
    "S3 repeated definition",
    "S3 Common Travel Area",
    "S3 #children",
    "S3",
    "S3 Irish exemption definition"
  ],
  "locatorScope": "Evidence-row sourceLocator fields below"
}
```

### S4 — Get an electronic travel authorisation (ETA) to visit the UK: When you do not need an ETA - GOV.UK

```json
{
  "sourceId": "S4",
  "canonicalRequestUrl": "https://www.gov.uk/eta/when-not-need-eta",
  "finalUrl": "https://www.gov.uk/eta/when-not-need-eta",
  "httpStatus": 200,
  "contentType": "text/html; charset=utf-8",
  "retrievalStart": "2026-10-05T11:55:34.959789Z",
  "retrievalFinish": "2026-10-05T11:55:35.103904Z",
  "byteCount": 79849,
  "responseSha256": "1b5ac298f60973aa0d4310806e4a16040c17ca63877c643d497566b185627df9",
  "redirectCount": 0,
  "contentEncodingRequest": "identity",
  "curlExit": 0,
  "redirectOccurred": false,
  "responseByteDefinition": "Full received final HTTP response entity body; identity encoding requested; no text normalization. Transport headers are not included in body hash.",
  "officialTitle": "Get an electronic travel authorisation (ETA) to visit the UK: When you do not need an ETA - GOV.UK",
  "officialMetadata": {
    "govuk:format": "guide",
    "govuk:content-id": "5e32d6a3-8aff-4dd0-b7e1-fe2f9fe8b4ec",
    "govuk:first-published-at": "2025-05-28T11:00:06+01:00",
    "govuk:updated-at": "2026-09-18T15:20:42+01:00",
    "govuk:public-updated-at": "2025-05-28T11:00:06+01:00",
    "govuk:primary-publishing-organisation": "Government Digital Service"
  },
  "visibleMetadataNotes": "Exposed HTML content identity and date metadata recorded above. No additional effective date inferred.",
  "discoveryAndNeed": "Official discoverability verified by GOV.UK search D1 /eta navigation; no-ETA route inventory.",
  "semanticEvidenceIds": [
    "I11",
    "C01",
    "C02",
    "C05"
  ],
  "corroboratingEvidenceIds": [
    "A01",
    "I10",
    "C04",
    "C07",
    "C08",
    "C34"
  ],
  "corroboratingLocators": [
    "S4 no-ETA list",
    "S4 #what-documents-youll-need-to-bring",
    "S4 no-ETA list item4",
    "S4 BOTC/BNO passport items",
    "S4 no-ETA list airport item",
    "S4 permission-to-work item"
  ],
  "locatorScope": "Evidence-row sourceLocator fields below"
}
```

### S5 — Electronic travel authorisation: caseworker guidance (accessible) - GOV.UK

```json
{
  "sourceId": "S5",
  "canonicalRequestUrl": "https://www.gov.uk/government/publications/electronic-travel-authorisation-caseworker-guidance/electronic-travel-authorisation-caseworker-guidance-accessible",
  "finalUrl": "https://www.gov.uk/government/publications/electronic-travel-authorisation-caseworker-guidance/electronic-travel-authorisation-caseworker-guidance-accessible",
  "httpStatus": 200,
  "contentType": "text/html; charset=utf-8",
  "retrievalStart": "2026-10-05T11:55:30.199032Z",
  "retrievalFinish": "2026-10-05T11:55:30.393369Z",
  "byteCount": 141755,
  "responseSha256": "ecac20f1215924130fa49e3954b7e9de93b3c3c90fd45dd59c56c7f008d2b5a1",
  "redirectCount": 0,
  "contentEncodingRequest": "identity",
  "curlExit": 0,
  "redirectOccurred": false,
  "responseByteDefinition": "Full received final HTTP response entity body; identity encoding requested; no text normalization. Transport headers are not included in body hash.",
  "officialTitle": "Electronic travel authorisation: caseworker guidance (accessible) - GOV.UK",
  "officialMetadata": {
    "govuk:format": "html_publication",
    "govuk:content-id": "f2524523-5e17-4a3a-801e-3938f0b41f66",
    "govuk:first-published-at": "2023-09-22T00:01:10+01:00",
    "govuk:updated-at": "2026-08-24T14:11:39+01:00",
    "govuk:public-updated-at": "2026-08-03T02:00:00+01:00",
    "govuk:primary-publishing-organisation": "Home Office"
  },
  "visibleMetadataNotes": "Visible updated3August2026; v9.0 published to staff3August2026.",
  "discoveryAndNeed": "Official discoverability verified by GOV.UK search D1; caseworker no-ETA summary and A/B cross-check.",
  "semanticEvidenceIds": [
    "C08",
    "I13"
  ],
  "corroboratingEvidenceIds": [
    "A01",
    "C01",
    "C02",
    "C07",
    "B01",
    "B02"
  ],
  "corroboratingLocators": [
    "S5 4.2",
    "S5 4.2 Irish entry restrictions",
    "S5 4.2",
    "S5 4.2 BOTC passport wording",
    "S5 sections5-6",
    "S5 suitability sections"
  ],
  "locatorScope": "Evidence-row sourceLocator fields below"
}
```

### S6 — Visit the UK as part of a French school trip - GOV.UK

```json
{
  "sourceId": "S6",
  "canonicalRequestUrl": "https://www.gov.uk/guidance/visit-the-uk-as-part-of-a-french-school-trip",
  "finalUrl": "https://www.gov.uk/guidance/visit-the-uk-as-part-of-a-french-school-trip",
  "httpStatus": 200,
  "contentType": "text/html; charset=utf-8",
  "retrievalStart": "2026-10-05T11:55:53.824753Z",
  "retrievalFinish": "2026-10-05T11:55:54.009444Z",
  "byteCount": 84650,
  "responseSha256": "7182495fb2ee3e1187fb083acdbacec3e6dbed2145256fb6edf16c68d3d1b68f",
  "redirectCount": 0,
  "contentEncodingRequest": "identity",
  "curlExit": 0,
  "redirectOccurred": false,
  "responseByteDefinition": "Full received final HTTP response entity body; identity encoding requested; no text normalization. Transport headers are not included in body hash.",
  "officialTitle": "Visit the UK as part of a French school trip - GOV.UK",
  "officialMetadata": {
    "govuk:format": "detailed_guide",
    "govuk:content-id": "b3c3217a-bf6e-4c3f-9e3f-9f95dda1ab89",
    "govuk:first-published-at": "2023-12-28T00:00:00+00:00",
    "govuk:updated-at": "2026-09-10T17:05:14+01:00",
    "govuk:public-updated-at": "2026-06-05T15:58:11+01:00",
    "govuk:primary-publishing-organisation": "UK Visas and Immigration"
  },
  "visibleMetadataNotes": "UKVI; published28December2023, updated5June2026; form update in history29January2025.",
  "discoveryAndNeed": "S4 official link to French school guidance; Part1 named form context.",
  "semanticEvidenceIds": [
    "F05",
    "F06",
    "F09"
  ],
  "corroboratingEvidenceIds": [
    "F02",
    "F08"
  ],
  "corroboratingLocators": [
    "S6 opening",
    "S6 #bringing-the-form-to-the-uk"
  ],
  "locatorScope": "Evidence-row sourceLocator fields below"
}
```

### S7 — Visit the UK as part of a German school trip - GOV.UK

```json
{
  "sourceId": "S7",
  "canonicalRequestUrl": "https://www.gov.uk/guidance/visit-the-uk-as-part-of-a-german-school-trip",
  "finalUrl": "https://www.gov.uk/guidance/visit-the-uk-as-part-of-a-german-school-trip",
  "httpStatus": 200,
  "contentType": "text/html; charset=utf-8",
  "retrievalStart": "2026-10-05T11:55:28.162864Z",
  "retrievalFinish": "2026-10-05T11:55:28.424922Z",
  "byteCount": 85364,
  "responseSha256": "ed58fe851a095da2cc197757ec1ae322d763a7db0e1a5afe5c6681959cab73ce",
  "redirectCount": 0,
  "contentEncodingRequest": "identity",
  "curlExit": 0,
  "redirectOccurred": false,
  "responseByteDefinition": "Full received final HTTP response entity body; identity encoding requested; no text normalization. Transport headers are not included in body hash.",
  "officialTitle": "Visit the UK as part of a German school trip - GOV.UK",
  "officialMetadata": {
    "govuk:format": "detailed_guide",
    "govuk:content-id": "d5bcd27a-93a1-4a7a-b03a-3de078e96d8c",
    "govuk:first-published-at": "2026-02-10T10:31:00+00:00",
    "govuk:updated-at": "2026-09-04T00:01:01+01:00",
    "govuk:public-updated-at": "2026-09-04T00:01:00+01:00",
    "govuk:primary-publishing-organisation": "UK Visas and Immigration"
  },
  "visibleMetadataNotes": "UKVI; published10February2026, updated4September2026; scheme/form live1August2026. Latest PDF marked09/2026.",
  "discoveryAndNeed": "Official discoverability verified by GOV.UK search D2; German school guidance forETA1.10/11D.",
  "semanticEvidenceIds": [
    "G05",
    "G06",
    "G09"
  ],
  "corroboratingEvidenceIds": [
    "G02"
  ],
  "corroboratingLocators": [
    "S7 opening"
  ],
  "locatorScope": "Evidence-row sourceLocator fields below"
}
```

### S8 — Entering the UK: exemptions to controls - GOV.UK

```json
{
  "sourceId": "S8",
  "canonicalRequestUrl": "https://www.gov.uk/guidance/entering-the-uk-exemptions-to-controls",
  "finalUrl": "https://www.gov.uk/guidance/entering-the-uk-exemptions-to-controls",
  "httpStatus": 200,
  "contentType": "text/html; charset=utf-8",
  "retrievalStart": "2026-10-05T11:55:23.262124Z",
  "retrievalFinish": "2026-10-05T11:55:23.385565Z",
  "byteCount": 92996,
  "responseSha256": "67369528d32248823cc522a447c88a82774e1cdb2bafe7cb509de93782240666",
  "redirectCount": 0,
  "contentEncodingRequest": "identity",
  "curlExit": 0,
  "redirectOccurred": false,
  "responseByteDefinition": "Full received final HTTP response entity body; identity encoding requested; no text normalization. Transport headers are not included in body hash.",
  "officialTitle": "Entering the UK: exemptions to controls - GOV.UK",
  "officialMetadata": {
    "govuk:format": "detailed_guide",
    "govuk:content-id": "84639159-5754-425b-be47-b014546e1ffb",
    "govuk:first-published-at": "2025-04-02T00:00:00+01:00",
    "govuk:updated-at": "2026-07-23T19:37:29+01:00",
    "govuk:public-updated-at": "2026-02-25T13:58:45+00:00",
    "govuk:primary-publishing-organisation": "Home Office"
  },
  "visibleMetadataNotes": "Home Office; published2April2025, updated25February2026.",
  "discoveryAndNeed": "S4 official exemptions-to-controls link; additional non-ETA status/crew routes.",
  "semanticEvidenceIds": [
    "C09",
    "C26",
    "C29",
    "C30",
    "C31"
  ],
  "corroboratingEvidenceIds": [
    "C24",
    "C25",
    "C28"
  ],
  "corroboratingLocators": [
    "S8 armed forces bullets1-2",
    "S8 armed forces bullets3-5",
    "S8"
  ],
  "locatorScope": "Evidence-row sourceLocator fields below"
}
```

### S9 — Immigration Rules - Immigration Rules Appendix ETA National List - Guidance - GOV.UK

```json
{
  "sourceId": "S9",
  "canonicalRequestUrl": "https://www.gov.uk/guidance/immigration-rules/immigration-rules-appendix-eta-national-list",
  "finalUrl": "https://www.gov.uk/guidance/immigration-rules/immigration-rules-appendix-eta-national-list",
  "httpStatus": 200,
  "contentType": "text/html; charset=utf-8",
  "retrievalStart": "2026-10-05T11:55:52.412200Z",
  "retrievalFinish": "2026-10-05T11:55:52.585129Z",
  "byteCount": 62422,
  "responseSha256": "2d132dc30ecb698290ed330cffad6f68fb8566bd37cd18825e36ab241d3d1075",
  "redirectCount": 0,
  "contentEncodingRequest": "identity",
  "curlExit": 0,
  "redirectOccurred": false,
  "responseByteDefinition": "Full received final HTTP response entity body; identity encoding requested; no text normalization. Transport headers are not included in body hash.",
  "officialTitle": "Immigration Rules - Immigration Rules Appendix ETA National List - Guidance - GOV.UK",
  "officialMetadata": {
    "govuk:format": "manual_section",
    "govuk:content-id": "2b25b3d4-4eaa-4859-a34e-c7869c114c15",
    "govuk:first-published-at": "2024-10-08T10:43:48+01:00",
    "govuk:updated-at": "2026-08-03T11:12:11+01:00",
    "govuk:public-updated-at": "2026-03-05T15:03:24+00:00",
    "govuk:primary-publishing-organisation": "Home Office"
  },
  "visibleMetadataNotes": "Exposed HTML content identity and date metadata recorded above. No additional effective date inferred.",
  "discoveryAndNeed": "S5 ETANL link and S1 named cross-reference; CH commencement.",
  "semanticEvidenceIds": [
    "A02"
  ],
  "corroboratingEvidenceIds": [
    "A00",
    "B01"
  ],
  "corroboratingLocators": [
    "S9 ETANL 1.1(d)",
    "S9"
  ],
  "locatorScope": "Evidence-row sourceLocator fields below"
}
```

### S10 — France-UK School Trip Travel Information Form

```json
{
  "sourceId": "S10",
  "canonicalRequestUrl": "https://assets.publishing.service.gov.uk/media/679a182bdc6d75ae3ddc7b6e/France-UK_school_trip_travel_information_form.pdf",
  "finalUrl": "https://assets.publishing.service.gov.uk/media/679a182bdc6d75ae3ddc7b6e/France-UK_school_trip_travel_information_form.pdf",
  "httpStatus": 200,
  "contentType": "application/pdf",
  "retrievalStart": "2026-10-05T11:56:40.951550Z",
  "retrievalFinish": "2026-10-05T11:56:41.460124Z",
  "byteCount": 1192429,
  "responseSha256": "cb49fc367d88afa5dcc7cee6cf7c940fb609dfaeaa6ac8eb1ab00616a8dae98a",
  "redirectCount": 0,
  "contentEncodingRequest": "identity",
  "curlExit": 0,
  "redirectOccurred": false,
  "responseByteDefinition": "Full received final HTTP response entity body; identity encoding requested; no text normalization. Transport headers are not included in body hash.",
  "officialTitle": "France-UK School Trip Travel Information Form",
  "officialMetadata": {
    "printedVersion": "01/2025",
    "pages": 11,
    "contentId": "Not exposed in PDF; asset URL identifies object"
  },
  "visibleMetadataNotes": "Printed title France-UK School Trip Travel Information Form;11pages; version01/2025. PDF creation20250129105708Z, modification20250129112159Z. PDF metadata is not legal commencement.",
  "discoveryAndNeed": "Official PDF linked by S6; mandatory form declarations, count and authentication.",
  "semanticEvidenceIds": [
    "F07",
    "F08"
  ],
  "corroboratingEvidenceIds": [
    "F02",
    "F05",
    "F06",
    "F09"
  ],
  "corroboratingLocators": [
    "S10 page3",
    "S10 pp1-3",
    "S10 p2 Prefecture stamp",
    "S10 pp2-3"
  ],
  "locatorScope": "Evidence-row sourceLocator fields below"
}
```

### S11 — Germany-UK School Trip Travel Information Form

```json
{
  "sourceId": "S11",
  "canonicalRequestUrl": "https://assets.publishing.service.gov.uk/media/6a918e82df4246cf45e466b2/German-UK_school_trip_form_reader_extended_-_09-26.pdf",
  "finalUrl": "https://assets.publishing.service.gov.uk/media/6a918e82df4246cf45e466b2/German-UK_school_trip_form_reader_extended_-_09-26.pdf",
  "httpStatus": 200,
  "contentType": "application/pdf",
  "retrievalStart": "2026-10-05T11:56:40.953731Z",
  "retrievalFinish": "2026-10-05T11:56:41.474293Z",
  "byteCount": 1260884,
  "responseSha256": "fd4d85b4d2846e2110835c6857596e01807e386e01eb4016bc94d8a6a4f0898e",
  "redirectCount": 0,
  "contentEncodingRequest": "identity",
  "curlExit": 0,
  "redirectOccurred": false,
  "responseByteDefinition": "Full received final HTTP response entity body; identity encoding requested; no text normalization. Transport headers are not included in body hash.",
  "officialTitle": "Germany-UK School Trip Travel Information Form",
  "officialMetadata": {
    "printedVersion": "09/2026",
    "pages": 11,
    "contentId": "Not exposed in PDF; asset URL identifies object"
  },
  "visibleMetadataNotes": "Printed title Germany-UK School Trip Travel Information Form;11pages; version09/2026. PDF metadata title German-UK school trip form; creation20260827095045+01, modification20260828143119+01. Not a commencement rule.",
  "discoveryAndNeed": "Official PDF linked by S7; mandatory form declarations, count and authentication.",
  "semanticEvidenceIds": [
    "G07",
    "G08"
  ],
  "corroboratingEvidenceIds": [
    "G02",
    "G05"
  ],
  "corroboratingLocators": [
    "S11 page3",
    "S11 pp1-3"
  ],
  "locatorScope": "Evidence-row sourceLocator fields below"
}
```

### S12 — Exemptions for visa applications: caseworker guidance - GOV.UK

```json
{
  "sourceId": "S12",
  "canonicalRequestUrl": "https://www.gov.uk/government/publications/exempt-exm/exempt-exm",
  "finalUrl": "https://www.gov.uk/government/publications/exempt-exm",
  "httpStatus": 200,
  "contentType": "text/html; charset=utf-8",
  "retrievalStart": "2026-10-05T11:56:40.950162Z",
  "retrievalFinish": "2026-10-05T11:56:41.288431Z",
  "byteCount": 83603,
  "responseSha256": "7f0900a8f76d48ab4cb7d96b699c08b2bd17c97741239a9c39ae862c30373283",
  "redirectCount": 1,
  "contentEncodingRequest": "identity",
  "curlExit": 0,
  "redirectOccurred": true,
  "responseByteDefinition": "Full received final HTTP response entity body; identity encoding requested; no text normalization. Transport headers are not included in body hash.",
  "officialTitle": "Exemptions for visa applications: caseworker guidance - GOV.UK",
  "officialMetadata": {
    "govuk:format": "guidance",
    "govuk:content-id": "5ef1c0b2-7631-11e4-a3cb-005056011aef",
    "govuk:first-published-at": "2013-11-14T00:00:00+00:00",
    "govuk:updated-at": "2026-08-04T09:00:27+01:00",
    "govuk:public-updated-at": "2026-06-30T14:16:19+01:00",
    "govuk:primary-publishing-organisation": "UK Visas and Immigration"
  },
  "visibleMetadataNotes": "Publication landing: first published14November2013, updated30June2026. No substantive EXM clause at legacy bookmarks after redirect.",
  "discoveryAndNeed": "S8 legacy EXM deep links, fragment removed for request; redirects to current publication landing.",
  "semanticEvidenceIds": [],
  "corroboratingEvidenceIds": [],
  "corroboratingLocators": [],
  "locatorScope": "Official navigation/search result links only; no legal proposition derived",
  "redirectChain": "HTTP301 /government/publications/exempt-exm/exempt-exm -> HTTP200 /government/publications/exempt-exm; one redirect; obsolete fragments not sent in HTTP request."
}
```

### S13 — Apply to the EU Settlement Scheme (settled and pre-settled status): After you've applied - GOV.UK

```json
{
  "sourceId": "S13",
  "canonicalRequestUrl": "https://www.gov.uk/settled-status-eu-citizens-families/after-youve-applied",
  "finalUrl": "https://www.gov.uk/settled-status-eu-citizens-families/after-youve-applied",
  "httpStatus": 200,
  "contentType": "text/html; charset=utf-8",
  "retrievalStart": "2026-10-05T11:56:40.950268Z",
  "retrievalFinish": "2026-10-05T11:56:41.092232Z",
  "byteCount": 94141,
  "responseSha256": "b27cb917b0b1bcbc853492be641771af1d1af622618a03a6fbfcdfd91793db33",
  "redirectCount": 0,
  "contentEncodingRequest": "identity",
  "curlExit": 0,
  "redirectOccurred": false,
  "responseByteDefinition": "Full received final HTTP response entity body; identity encoding requested; no text normalization. Transport headers are not included in body hash.",
  "officialTitle": "Apply to the EU Settlement Scheme (settled and pre-settled status): After you've applied - GOV.UK",
  "officialMetadata": {
    "govuk:format": "guide",
    "govuk:content-id": "91504a10-f697-42a3-a779-f238b4955ea9",
    "govuk:first-published-at": "2018-06-21T13:15:03+01:00",
    "govuk:updated-at": "2026-09-14T10:11:12+01:00",
    "govuk:public-updated-at": "2024-10-31T17:00:11+00:00",
    "govuk:primary-publishing-organisation": "Government Digital Service"
  },
  "visibleMetadataNotes": "Exposed HTML content identity and date metadata recorded above. No additional effective date inferred.",
  "discoveryAndNeed": "S4 waiting-EUSS link; validation and certificate/travel qualifications.",
  "semanticEvidenceIds": [
    "C06"
  ],
  "corroboratingEvidenceIds": [
    "C05"
  ],
  "corroboratingLocators": [
    "S13 after applying"
  ],
  "locatorScope": "Evidence-row sourceLocator fields below"
}
```

### S14 — Prove you have right of abode in the UK: Overview - GOV.UK

```json
{
  "sourceId": "S14",
  "canonicalRequestUrl": "https://www.gov.uk/right-of-abode",
  "finalUrl": "https://www.gov.uk/right-of-abode",
  "httpStatus": 200,
  "contentType": "text/html; charset=utf-8",
  "retrievalStart": "2026-10-05T11:56:40.951663Z",
  "retrievalFinish": "2026-10-05T11:56:41.123412Z",
  "byteCount": 79831,
  "responseSha256": "d3768c7195ed73bb18d8091356db25f687272a18e64642be12a691c8abb3d070",
  "redirectCount": 0,
  "contentEncodingRequest": "identity",
  "curlExit": 0,
  "redirectOccurred": false,
  "responseByteDefinition": "Full received final HTTP response entity body; identity encoding requested; no text normalization. Transport headers are not included in body hash.",
  "officialTitle": "Prove you have right of abode in the UK: Overview - GOV.UK",
  "officialMetadata": {
    "govuk:format": "guide",
    "govuk:content-id": "4816fa06-9e6c-4414-96b6-aa7ec7f24968",
    "govuk:first-published-at": "2014-01-22T14:38:46+00:00",
    "govuk:updated-at": "2026-09-24T15:39:38+01:00",
    "govuk:public-updated-at": "2024-11-13T10:34:56+00:00",
    "govuk:primary-publishing-organisation": "Government Digital Service"
  },
  "visibleMetadataNotes": "Exposed HTML content identity and date metadata recorded above. No additional effective date inferred.",
  "discoveryAndNeed": "S4 right-of-abode link; status route distinct from nationality/passport.",
  "semanticEvidenceIds": [
    "C03"
  ],
  "corroboratingEvidenceIds": [],
  "corroboratingLocators": [],
  "locatorScope": "Evidence-row sourceLocator fields below"
}
```

### S15 — Exemption from immigration control (Non armed forces) (accessible) - GOV.UK

```json
{
  "sourceId": "S15",
  "canonicalRequestUrl": "https://www.gov.uk/government/publications/exempt-exm/exemption-from-immigration-control-non-armed-forces-accessible",
  "finalUrl": "https://www.gov.uk/government/publications/exempt-exm/exemption-from-immigration-control-non-armed-forces-accessible",
  "httpStatus": 200,
  "contentType": "text/html; charset=utf-8",
  "retrievalStart": "2026-10-05T11:57:38.053024Z",
  "retrievalFinish": "2026-10-05T11:57:38.253524Z",
  "byteCount": 291248,
  "responseSha256": "fe89084f988e0bdcc8638d9383a58564f4649fb83ac9039b6aa9b5cce2e0b6fc",
  "redirectCount": 0,
  "contentEncodingRequest": "identity",
  "curlExit": 0,
  "redirectOccurred": false,
  "responseByteDefinition": "Full received final HTTP response entity body; identity encoding requested; no text normalization. Transport headers are not included in body hash.",
  "officialTitle": "Exemption from immigration control (Non armed forces) (accessible) - GOV.UK",
  "officialMetadata": {
    "govuk:format": "html_publication",
    "govuk:content-id": "151b69e8-5702-45f1-9562-5fbd9e4ad47c",
    "govuk:first-published-at": "2026-06-30T14:16:20+01:00",
    "govuk:updated-at": "2026-08-04T09:00:27+01:00",
    "govuk:public-updated-at": "2026-06-30T14:16:19+01:00",
    "govuk:primary-publishing-organisation": "UK Visas and Immigration"
  },
  "visibleMetadataNotes": "Visible updated30June2026; v6.0 published to staff29June2026.",
  "discoveryAndNeed": "Current accessible guidance linked by S12; EXM eligibility and non-exhaustive routes.",
  "semanticEvidenceIds": [
    "C10",
    "C11",
    "C12",
    "C13",
    "C14",
    "C15",
    "C16",
    "C17",
    "C18",
    "C19",
    "C20",
    "C21",
    "C23",
    "C36"
  ],
  "corroboratingEvidenceIds": [
    "C09",
    "C22"
  ],
  "corroboratingLocators": [
    "S15 #proof-of-exemption",
    "S15 non-exhaustive list warning"
  ],
  "locatorScope": "Evidence-row sourceLocator fields below"
}
```

### S16 — Aircrew: CRM02 - GOV.UK

```json
{
  "sourceId": "S16",
  "canonicalRequestUrl": "https://www.gov.uk/government/publications/aircrew-crm02/aircrew-crm02",
  "finalUrl": "https://www.gov.uk/government/publications/aircrew-crm02/aircrew-crm02",
  "httpStatus": 200,
  "contentType": "text/html; charset=utf-8",
  "retrievalStart": "2026-10-05T11:57:38.053018Z",
  "retrievalFinish": "2026-10-05T11:57:38.183794Z",
  "byteCount": 70550,
  "responseSha256": "4e9de6b8c6efbc0d4a3a870ad5fa9f192aaaf20ea091c1992b563d1cdf54a9c0",
  "redirectCount": 0,
  "contentEncodingRequest": "identity",
  "curlExit": 0,
  "redirectOccurred": false,
  "responseByteDefinition": "Full received final HTTP response entity body; identity encoding requested; no text normalization. Transport headers are not included in body hash.",
  "officialTitle": "Aircrew: CRM02 - GOV.UK",
  "officialMetadata": {
    "govuk:format": "html_publication",
    "govuk:content-id": "2a6b73dd-5c89-4529-a099-fa4aac5b596d",
    "govuk:first-published-at": "2016-10-20T16:14:08+01:00",
    "govuk:updated-at": "2026-04-29T15:29:15+01:00",
    "govuk:public-updated-at": "2021-04-19T12:31:35+01:00",
    "govuk:primary-publishing-organisation": "UK Visas and Immigration"
  },
  "visibleMetadataNotes": "Visible updated19April2021; historical aircrew guidance used only with modern S8 ETA route.",
  "discoveryAndNeed": "S8 aircrew cross-reference; role/evidence limits, not standalone modern ETA law.",
  "semanticEvidenceIds": [
    "C27"
  ],
  "corroboratingEvidenceIds": [
    "C26"
  ],
  "corroboratingLocators": [
    "S16 CRM02"
  ],
  "locatorScope": "Evidence-row sourceLocator fields below"
}
```

### S17 — Seafarers - GOV.UK

```json
{
  "sourceId": "S17",
  "canonicalRequestUrl": "https://www.gov.uk/government/publications/seafarers-crm01/seafarers-crm01",
  "finalUrl": "https://www.gov.uk/government/publications/seafarers-crm01/seafarers-crm01",
  "httpStatus": 200,
  "contentType": "text/html; charset=utf-8",
  "retrievalStart": "2026-10-05T11:57:38.053002Z",
  "retrievalFinish": "2026-10-05T11:57:38.210269Z",
  "byteCount": 96797,
  "responseSha256": "394f47c6857e710d35bfa899ce859c8686295f9b11f220666390f7303b7903e9",
  "redirectCount": 0,
  "contentEncodingRequest": "identity",
  "curlExit": 0,
  "redirectOccurred": false,
  "responseByteDefinition": "Full received final HTTP response entity body; identity encoding requested; no text normalization. Transport headers are not included in body hash.",
  "officialTitle": "Seafarers - GOV.UK",
  "officialMetadata": {
    "govuk:format": "html_publication",
    "govuk:content-id": "a79b35a5-a6f4-4329-802c-a96a112df0b6",
    "govuk:first-published-at": "2016-10-20T16:14:05+01:00",
    "govuk:updated-at": "2026-04-29T15:31:02+01:00",
    "govuk:public-updated-at": "2025-11-11T00:01:06+00:00",
    "govuk:primary-publishing-organisation": "UK Visas and Immigration"
  },
  "visibleMetadataNotes": "Visible updated11November2025; live guidance, not proof every statute referenced remains operative.",
  "discoveryAndNeed": "S8 seafarer cross-reference; crew exceptions and ILO distinctions.",
  "semanticEvidenceIds": [
    "C28"
  ],
  "corroboratingEvidenceIds": [
    "C26"
  ],
  "corroboratingLocators": [
    "S17 CRM01"
  ],
  "locatorScope": "Evidence-row sourceLocator fields below"
}
```

### S18 — Entering the UK: Before you leave for the UK - GOV.UK

```json
{
  "sourceId": "S18",
  "canonicalRequestUrl": "https://www.gov.uk/uk-border-control/before-you-leave-for-the-uk",
  "finalUrl": "https://www.gov.uk/uk-border-control/before-you-leave-for-the-uk",
  "httpStatus": 200,
  "contentType": "text/html; charset=utf-8",
  "retrievalStart": "2026-10-05T11:58:09.224319Z",
  "retrievalFinish": "2026-10-05T11:58:09.440646Z",
  "byteCount": 104514,
  "responseSha256": "8ca904879915c6d2259e65f1e6273d714ff3f863dff41b4804cc781ffafde8d3",
  "redirectCount": 0,
  "contentEncodingRequest": "identity",
  "curlExit": 0,
  "redirectOccurred": false,
  "responseByteDefinition": "Full received final HTTP response entity body; identity encoding requested; no text normalization. Transport headers are not included in body hash.",
  "officialTitle": "Entering the UK: Before you leave for the UK - GOV.UK",
  "officialMetadata": {
    "govuk:format": "guide",
    "govuk:content-id": "435fb04f-2b9f-4f44-8b41-2a962e8c46a8",
    "govuk:first-published-at": "2013-03-28T12:28:54+00:00",
    "govuk:updated-at": "2026-09-30T10:00:25+01:00",
    "govuk:public-updated-at": "2024-10-31T17:00:08+00:00",
    "govuk:primary-publishing-organisation": "Government Digital Service"
  },
  "visibleMetadataNotes": "Exposed HTML content identity and date metadata recorded above. No additional effective date inferred.",
  "discoveryAndNeed": "S13 return-to-UK/border-control link; EUSS and entry-status cross-check.",
  "semanticEvidenceIds": [],
  "corroboratingEvidenceIds": [
    "C03",
    "C05",
    "C06"
  ],
  "corroboratingLocators": [
    "S18 right-of-abode paragraph",
    "S18 pending-EUSS paragraph",
    "S18 #if-youre-waiting-for-a-decision-on-your-application-for-settled-or-pre-settled-status"
  ],
  "locatorScope": "Corroborating sections explicitly named in evidence crossReferences and coverage ledger; not an independent exemption"
}
```

### S19 — List of international organisations whose employees qualify for exempt entry clearances (accessible version) - GOV.UK

```json
{
  "sourceId": "S19",
  "canonicalRequestUrl": "https://www.gov.uk/government/publications/exempt-exm/list-of-international-organisations-whose-employees-qualify-for-exempt-entry-clearances-accessible-version",
  "finalUrl": "https://www.gov.uk/government/publications/exempt-exm/list-of-international-organisations-whose-employees-qualify-for-exempt-entry-clearances-accessible-version",
  "httpStatus": 200,
  "contentType": "text/html; charset=utf-8",
  "retrievalStart": "2026-10-05T12:00:04.598388Z",
  "retrievalFinish": "2026-10-05T12:00:04.738201Z",
  "byteCount": 84251,
  "responseSha256": "217bb6244a39a871ab446f1e3ad18ea62604567796df749fc72de0eb41b40c2e",
  "redirectCount": 0,
  "contentEncodingRequest": "identity",
  "curlExit": 0,
  "redirectOccurred": false,
  "responseByteDefinition": "Full received final HTTP response entity body; identity encoding requested; no text normalization. Transport headers are not included in body hash.",
  "officialTitle": "List of international organisations whose employees qualify for exempt entry clearances (accessible version) - GOV.UK",
  "officialMetadata": {
    "govuk:format": "html_publication",
    "govuk:content-id": "f7dc6ad2-e010-4605-8f41-28b39194b4bb",
    "govuk:first-published-at": "2023-08-03T15:18:27+01:00",
    "govuk:updated-at": "2026-08-04T09:00:27+01:00",
    "govuk:public-updated-at": "2026-06-30T14:16:19+01:00",
    "govuk:primary-publishing-organisation": "UK Visas and Immigration"
  },
  "visibleMetadataNotes": "Visible updated30June2026; list body as of7January2026. Distinct dates retained.",
  "discoveryAndNeed": "S15 IO-list link; footnotes and list limitations.",
  "semanticEvidenceIds": [
    "C22"
  ],
  "corroboratingEvidenceIds": [
    "C20",
    "C21"
  ],
  "corroboratingLocators": [
    "S19 list+footnotes",
    "S19"
  ],
  "locatorScope": "Evidence-row sourceLocator fields below"
}
```

### S20 — Travelling to the UK from Ireland, Isle of Man, Guernsey or Jersey - GOV.UK

```json
{
  "sourceId": "S20",
  "canonicalRequestUrl": "https://www.gov.uk/guidance/travelling-between-the-uk-and-ireland-isle-of-man-guernsey-or-jersey",
  "finalUrl": "https://www.gov.uk/guidance/travelling-between-the-uk-and-ireland-isle-of-man-guernsey-or-jersey",
  "httpStatus": 200,
  "contentType": "text/html; charset=utf-8",
  "retrievalStart": "2026-10-05T12:00:24.660485Z",
  "retrievalFinish": "2026-10-05T12:00:24.813516Z",
  "byteCount": 111290,
  "responseSha256": "4f9d318af1e4509857322392948e374509c3a267dafa88fb8890e3dccc819689",
  "redirectCount": 0,
  "contentEncodingRequest": "identity",
  "curlExit": 0,
  "redirectOccurred": false,
  "responseByteDefinition": "Full received final HTTP response entity body; identity encoding requested; no text normalization. Transport headers are not included in body hash.",
  "officialTitle": "Travelling to the UK from Ireland, Isle of Man, Guernsey or Jersey - GOV.UK",
  "officialMetadata": {
    "govuk:format": "detailed_guide",
    "govuk:content-id": "a584ee02-15a9-423e-b632-675379d60fbc",
    "govuk:first-published-at": "2021-08-13T00:00:00+01:00",
    "govuk:updated-at": "2026-07-02T10:53:34+01:00",
    "govuk:public-updated-at": "2026-01-01T00:01:08+00:00",
    "govuk:primary-publishing-organisation": "UK Visas and Immigration"
  },
  "visibleMetadataNotes": "Exposed HTML content identity and date metadata recorded above. No additional effective date inferred.",
  "discoveryAndNeed": "S18 CTA travel link; current permission/deemed-leave distinctions.",
  "semanticEvidenceIds": [],
  "corroboratingEvidenceIds": [
    "I07",
    "C04",
    "C33"
  ],
  "corroboratingLocators": [
    "S20 #the-common-travel-area",
    "S20 #crown-dependencies",
    "S20 permission-to-enter sections"
  ],
  "locatorScope": "Corroborating sections explicitly named in evidence crossReferences and coverage ledger; not an independent exemption"
}
```

### S21 — Appendix HM Armed Forces: caseworker guidance (accessible) - GOV.UK

```json
{
  "sourceId": "S21",
  "canonicalRequestUrl": "https://www.gov.uk/government/publications/appendix-hm-armed-forces-caseworker-guidance/appendix-hm-armed-forces-caseworker-guidance-accessible",
  "finalUrl": "https://www.gov.uk/government/publications/appendix-hm-armed-forces-caseworker-guidance/appendix-hm-armed-forces-caseworker-guidance-accessible",
  "httpStatus": 200,
  "contentType": "text/html; charset=utf-8",
  "retrievalStart": "2026-10-05T12:05:43.449468Z",
  "retrievalFinish": "2026-10-05T12:05:43.684969Z",
  "byteCount": 170274,
  "responseSha256": "c66b36cbeaa33a1057462257a7ab2a051efb1feb635a5e15971c5d94c537856f",
  "redirectCount": 0,
  "contentEncodingRequest": "identity",
  "curlExit": 0,
  "redirectOccurred": false,
  "responseByteDefinition": "Full received final HTTP response entity body; identity encoding requested; no text normalization. Transport headers are not included in body hash.",
  "officialTitle": "Appendix HM Armed Forces: caseworker guidance (accessible) - GOV.UK",
  "officialMetadata": {
    "govuk:format": "html_publication",
    "govuk:content-id": "4ff822ef-56c1-4c5e-a318-fedba623107d",
    "govuk:first-published-at": "2024-04-12T12:41:10+01:00",
    "govuk:updated-at": "2026-08-03T00:01:03+01:00",
    "govuk:public-updated-at": "2026-08-03T00:01:00+01:00",
    "govuk:primary-publishing-organisation": "UK Visas and Immigration"
  },
  "visibleMetadataNotes": "Visible version6.0; published for Home Office staff3August2026.",
  "discoveryAndNeed": "S8 HM Armed Forces eligibility link via D4; exemption sections only.",
  "semanticEvidenceIds": [
    "C24"
  ],
  "corroboratingEvidenceIds": [],
  "corroboratingLocators": [],
  "locatorScope": "Evidence-row sourceLocator fields below"
}
```

### S22 — Appendix International Forces: caseworker guidance (accessible) - GOV.UK

```json
{
  "sourceId": "S22",
  "canonicalRequestUrl": "https://www.gov.uk/government/publications/appendix-international-forces-caseworker-guidance/appendix-international-forces-caseworker-guidance-accessible--2",
  "finalUrl": "https://www.gov.uk/government/publications/appendix-international-forces-caseworker-guidance/appendix-international-forces-caseworker-guidance-accessible--2",
  "httpStatus": 200,
  "contentType": "text/html; charset=utf-8",
  "retrievalStart": "2026-10-05T12:05:43.725956Z",
  "retrievalFinish": "2026-10-05T12:05:44.072592Z",
  "byteCount": 212617,
  "responseSha256": "2edac4f91118d3026aa8bffc272cc873a99b7919aa8092086e17e106304459db",
  "redirectCount": 0,
  "contentEncodingRequest": "identity",
  "curlExit": 0,
  "redirectOccurred": false,
  "responseByteDefinition": "Full received final HTTP response entity body; identity encoding requested; no text normalization. Transport headers are not included in body hash.",
  "officialTitle": "Appendix International Forces: caseworker guidance (accessible) - GOV.UK",
  "officialMetadata": {
    "govuk:format": "html_publication",
    "govuk:content-id": "1f2ac3ce-9633-400e-b53f-a7ff36bb69b2",
    "govuk:first-published-at": "2024-11-08T12:47:36+00:00",
    "govuk:updated-at": "2026-08-17T10:31:46+01:00",
    "govuk:public-updated-at": "2026-08-17T10:31:45+01:00",
    "govuk:primary-publishing-organisation": "UK Visas and Immigration"
  },
  "visibleMetadataNotes": "Visible version10.0; published for Home Office staff14August2026.",
  "discoveryAndNeed": "S8 International Forces eligibility link via D5; exemption sections only.",
  "semanticEvidenceIds": [
    "C25"
  ],
  "corroboratingEvidenceIds": [],
  "corroboratingLocators": [],
  "locatorScope": "Evidence-row sourceLocator fields below"
}
```

### S23 — Common Travel Area guidance - GOV.UK

```json
{
  "sourceId": "S23",
  "canonicalRequestUrl": "https://www.gov.uk/government/publications/common-travel-area-guidance/common-travel-area-guidance",
  "finalUrl": "https://www.gov.uk/government/publications/common-travel-area-guidance/common-travel-area-guidance",
  "httpStatus": 200,
  "contentType": "text/html; charset=utf-8",
  "retrievalStart": "2026-10-05T12:06:44.576436Z",
  "retrievalFinish": "2026-10-05T12:06:44.763660Z",
  "byteCount": 99582,
  "responseSha256": "e1278c9a68e9cb4e32b87625c22c1d5f1eb54abbc414901c4eb59556ae4105b1",
  "redirectCount": 0,
  "contentEncodingRequest": "identity",
  "curlExit": 0,
  "redirectOccurred": false,
  "responseByteDefinition": "Full received final HTTP response entity body; identity encoding requested; no text normalization. Transport headers are not included in body hash.",
  "officialTitle": "Common Travel Area guidance - GOV.UK",
  "officialMetadata": {
    "govuk:format": "html_publication",
    "govuk:content-id": "f841223e-d1ae-4a25-9783-bfa7b727ee11",
    "govuk:first-published-at": "2019-02-22T10:42:13+00:00",
    "govuk:updated-at": "2026-09-09T14:59:34+01:00",
    "govuk:public-updated-at": "2026-01-01T00:01:08+00:00",
    "govuk:primary-publishing-organisation": "Cabinet Office"
  },
  "visibleMetadataNotes": "Exposed HTML content identity and date metadata recorded above. No additional effective date inferred.",
  "discoveryAndNeed": "S20 CTA-arrangements link via D6; citizen/family boundary, not ETA1.4 interpretation.",
  "semanticEvidenceIds": [
    "U02"
  ],
  "corroboratingEvidenceIds": [
    "C01"
  ],
  "corroboratingLocators": [
    "S23 #travelling-and-residing-in-the-cta"
  ],
  "locatorScope": "Evidence-row sourceLocator fields below"
}
```

### S24 — Common travel area (accessible) - GOV.UK

```json
{
  "sourceId": "S24",
  "canonicalRequestUrl": "https://www.gov.uk/government/publications/common-travel-area/common-travel-area-accessible",
  "finalUrl": "https://www.gov.uk/government/publications/common-travel-area/common-travel-area-accessible",
  "httpStatus": 200,
  "contentType": "text/html; charset=utf-8",
  "retrievalStart": "2026-10-05T12:06:54.932688Z",
  "retrievalFinish": "2026-10-05T12:06:55.109156Z",
  "byteCount": 441937,
  "responseSha256": "838efd989b1e061f1ef3b6e725f8a048ef68cd62ff4ac0b9ccd71f159b57ed46",
  "redirectCount": 0,
  "contentEncodingRequest": "identity",
  "curlExit": 0,
  "redirectOccurred": false,
  "responseByteDefinition": "Full received final HTTP response entity body; identity encoding requested; no text normalization. Transport headers are not included in body hash.",
  "officialTitle": "Common travel area (accessible) - GOV.UK",
  "officialMetadata": {
    "govuk:format": "html_publication",
    "govuk:content-id": "37cb84f5-6394-4459-9d16-32351d03d32c",
    "govuk:first-published-at": "2025-11-11T08:00:02+00:00",
    "govuk:updated-at": "2026-04-29T15:29:19+01:00",
    "govuk:public-updated-at": "2026-04-09T01:00:00+01:00",
    "govuk:primary-publishing-organisation": "UK Visas and Immigration"
  },
  "visibleMetadataNotes": "Visible updated9April2026; v16.0 published to staff9April2026. Contains explicit internal-only removed sections.",
  "discoveryAndNeed": "S20 arriving-within-CTA caseworker link via D7;6.8/6.9 and8.5.",
  "semanticEvidenceIds": [
    "I12",
    "C04",
    "C32",
    "C33"
  ],
  "corroboratingEvidenceIds": [
    "I01",
    "I06",
    "I07",
    "C06",
    "C34",
    "C35",
    "U02"
  ],
  "corroboratingLocators": [
    "S24 6.9",
    "S24 6.9",
    "S24 section 2",
    "S24 8.5 saved admission rights",
    "S24 8.5 frontier-worker saved status",
    "S24 Article5",
    "S24 6.9"
  ],
  "locatorScope": "Evidence-row sourceLocator fields below"
}
```

### S25 — Frontier Worker permit: Overview - GOV.UK

```json
{
  "sourceId": "S25",
  "canonicalRequestUrl": "https://www.gov.uk/frontier-worker-permit",
  "finalUrl": "https://www.gov.uk/frontier-worker-permit",
  "httpStatus": 200,
  "contentType": "text/html; charset=utf-8",
  "retrievalStart": "2026-10-05T12:07:25.379260Z",
  "retrievalFinish": "2026-10-05T12:07:25.507784Z",
  "byteCount": 90818,
  "responseSha256": "0f6b9da9a1f6dd27e5c5b55b732ebcaa2a78fdce3a99866870f56ab363e2e540",
  "redirectCount": 0,
  "contentEncodingRequest": "identity",
  "curlExit": 0,
  "redirectOccurred": false,
  "responseByteDefinition": "Full received final HTTP response entity body; identity encoding requested; no text normalization. Transport headers are not included in body hash.",
  "officialTitle": "Frontier Worker permit: Overview - GOV.UK",
  "officialMetadata": {
    "govuk:format": "guide",
    "govuk:content-id": "62f42cd9-c318-4931-93e6-ae653d11aaec",
    "govuk:first-published-at": "2020-12-10T09:00:05+00:00",
    "govuk:updated-at": "2026-09-09T14:57:17+01:00",
    "govuk:public-updated-at": "2021-03-15T15:56:35+00:00",
    "govuk:primary-publishing-organisation": "Government Digital Service"
  },
  "visibleMetadataNotes": "Exposed HTML content identity and date metadata recorded above. No additional effective date inferred.",
  "discoveryAndNeed": "S24 frontier-worker link; protected-entry-status coverage question.",
  "semanticEvidenceIds": [
    "C34"
  ],
  "corroboratingEvidenceIds": [],
  "corroboratingLocators": [],
  "locatorScope": "Evidence-row sourceLocator fields below"
}
```

### S26 — Enter the UK as an S2 Healthcare Visitor - GOV.UK

```json
{
  "sourceId": "S26",
  "canonicalRequestUrl": "https://www.gov.uk/guidance/enter-the-uk-as-an-s2-healthcare-visitor",
  "finalUrl": "https://www.gov.uk/guidance/enter-the-uk-as-an-s2-healthcare-visitor",
  "httpStatus": 200,
  "contentType": "text/html; charset=utf-8",
  "retrievalStart": "2026-10-05T12:07:25.552186Z",
  "retrievalFinish": "2026-10-05T12:07:25.801317Z",
  "byteCount": 96836,
  "responseSha256": "3c7b38558358356fa8eb1052ca8c8b8dc612d1d5b05a1ec3c7858d83331e98fa",
  "redirectCount": 0,
  "contentEncodingRequest": "identity",
  "curlExit": 0,
  "redirectOccurred": false,
  "responseByteDefinition": "Full received final HTTP response entity body; identity encoding requested; no text normalization. Transport headers are not included in body hash.",
  "officialTitle": "Enter the UK as an S2 Healthcare Visitor - GOV.UK",
  "officialMetadata": {
    "govuk:format": "detailed_guide",
    "govuk:content-id": "f1180166-85d1-44b7-a596-85303046e061",
    "govuk:first-published-at": "2020-12-01T09:00:00+00:00",
    "govuk:updated-at": "2026-04-29T15:31:33+01:00",
    "govuk:public-updated-at": "2021-06-06T09:00:00+01:00",
    "govuk:primary-publishing-organisation": "UK Visas and Immigration"
  },
  "visibleMetadataNotes": "UKVI; published1December2020, updated6June2021. Does not mention ETA; no ETA-negative inference from omission.",
  "discoveryAndNeed": "S20/S24 S2 healthcare link; purpose-specific protected route and A/B limit.",
  "semanticEvidenceIds": [
    "C35"
  ],
  "corroboratingEvidenceIds": [],
  "corroboratingLocators": [],
  "locatorScope": "Evidence-row sourceLocator fields below"
}
```

### D1 — electronic travel authorisation - Search - GOV.UK

```json
{
  "sourceId": "D1",
  "canonicalRequestUrl": "https://www.gov.uk/search/all?keywords=electronic%20travel%20authorisation",
  "finalUrl": "https://www.gov.uk/search/all?keywords=electronic%20travel%20authorisation",
  "httpStatus": 200,
  "contentType": "text/html; charset=utf-8",
  "retrievalStart": "2026-10-05T11:58:09.224607Z",
  "retrievalFinish": "2026-10-05T11:58:09.692733Z",
  "byteCount": 114522,
  "responseSha256": "ea581cf5e70076b18374663e942e7f3af5c4f86302d6c0b37555f15ee2e01fb4",
  "redirectCount": 0,
  "contentEncodingRequest": "identity",
  "curlExit": 0,
  "redirectOccurred": false,
  "responseByteDefinition": "Full received final HTTP response entity body; identity encoding requested; no text normalization. Transport headers are not included in body hash.",
  "officialTitle": "electronic travel authorisation - Search - GOV.UK",
  "officialMetadata": {
    "govuk:format": "finder",
    "govuk:content-id": "dd395436-9b40-41f3-8157-740a453ac972",
    "govuk:first-published-at": "2019-02-14T14:57:43+00:00",
    "govuk:updated-at": "2025-01-28T14:31:09+00:00",
    "govuk:public-updated-at": "2024-10-24T12:19:57+01:00"
  },
  "visibleMetadataNotes": "Exposed HTML content identity and date metadata recorded above. No additional effective date inferred.",
  "discoveryAndNeed": "Official search: electronic travel authorisation; discovery only, verified by full source fetches.",
  "semanticEvidenceIds": [],
  "corroboratingEvidenceIds": [],
  "corroboratingLocators": [],
  "locatorScope": "Official navigation/search result links only; no legal proposition derived"
}
```

### D2 — German school trip - Search - GOV.UK

```json
{
  "sourceId": "D2",
  "canonicalRequestUrl": "https://www.gov.uk/search/all?keywords=German%20school%20trip",
  "finalUrl": "https://www.gov.uk/search/all?keywords=German%20school%20trip",
  "httpStatus": 200,
  "contentType": "text/html; charset=utf-8",
  "retrievalStart": "2026-10-05T11:58:09.224519Z",
  "retrievalFinish": "2026-10-05T11:58:09.823617Z",
  "byteCount": 111613,
  "responseSha256": "1c642ba698da62ec0fd53e75419a64dd3ced749b4ef47ff7ff2e7befef1f8a5d",
  "redirectCount": 0,
  "contentEncodingRequest": "identity",
  "curlExit": 0,
  "redirectOccurred": false,
  "responseByteDefinition": "Full received final HTTP response entity body; identity encoding requested; no text normalization. Transport headers are not included in body hash.",
  "officialTitle": "German school trip - Search - GOV.UK",
  "officialMetadata": {
    "govuk:format": "finder",
    "govuk:content-id": "dd395436-9b40-41f3-8157-740a453ac972",
    "govuk:first-published-at": "2019-02-14T14:57:43+00:00",
    "govuk:updated-at": "2025-01-28T14:31:09+00:00",
    "govuk:public-updated-at": "2024-10-24T12:19:57+01:00"
  },
  "visibleMetadataNotes": "Exposed HTML content identity and date metadata recorded above. No additional effective date inferred.",
  "discoveryAndNeed": "Official search: German school trip; discovery only, S7 full fetch is evidence.",
  "semanticEvidenceIds": [],
  "corroboratingEvidenceIds": [],
  "corroboratingLocators": [],
  "locatorScope": "Official navigation/search result links only; no legal proposition derived"
}
```

### D3 — "time of the ETA application" - Search - GOV.UK

```json
{
  "sourceId": "D3",
  "canonicalRequestUrl": "https://www.gov.uk/search/all?keywords=%22time%20of%20the%20ETA%20application%22",
  "finalUrl": "https://www.gov.uk/search/all?keywords=%22time%20of%20the%20ETA%20application%22",
  "httpStatus": 200,
  "contentType": "text/html; charset=utf-8",
  "retrievalStart": "2026-10-05T11:59:16.353899Z",
  "retrievalFinish": "2026-10-05T11:59:16.673939Z",
  "byteCount": 109673,
  "responseSha256": "e40802e98785457f8d04f4bd6ddc8d91d40f98dcf0ce019b110b6e0642e664b6",
  "redirectCount": 0,
  "contentEncodingRequest": "identity",
  "curlExit": 0,
  "redirectOccurred": false,
  "responseByteDefinition": "Full received final HTTP response entity body; identity encoding requested; no text normalization. Transport headers are not included in body hash.",
  "officialTitle": "\"time of the ETA application\" - Search - GOV.UK",
  "officialMetadata": {
    "govuk:format": "finder",
    "govuk:content-id": "dd395436-9b40-41f3-8157-740a453ac972",
    "govuk:first-published-at": "2019-02-14T14:57:43+00:00",
    "govuk:updated-at": "2025-01-28T14:31:09+00:00",
    "govuk:public-updated-at": "2024-10-24T12:19:57+01:00"
  },
  "visibleMetadataNotes": "Exposed HTML content identity and date metadata recorded above. No additional effective date inferred.",
  "discoveryAndNeed": "Official exact-phrase search for ETA application-time; discovery only, no global absence claim.",
  "semanticEvidenceIds": [],
  "corroboratingEvidenceIds": [
    "I06"
  ],
  "corroboratingLocators": [
    "D3 official search"
  ],
  "locatorScope": "Official navigation/search result links only; no legal proposition derived"
}
```

### D4 — Appendix HM Armed Forces: caseworker guidance - GOV.UK

```json
{
  "sourceId": "D4",
  "canonicalRequestUrl": "https://www.gov.uk/government/publications/appendix-hm-armed-forces-caseworker-guidance",
  "finalUrl": "https://www.gov.uk/government/publications/appendix-hm-armed-forces-caseworker-guidance",
  "httpStatus": 200,
  "contentType": "text/html; charset=utf-8",
  "retrievalStart": "2026-10-05T12:00:04.598451Z",
  "retrievalFinish": "2026-10-05T12:00:04.836799Z",
  "byteCount": 74057,
  "responseSha256": "eefdec3b8b25f3a2e4c983bdf4dcd0672675dcb634613cb2af14f95e2fd87b87",
  "redirectCount": 0,
  "contentEncodingRequest": "identity",
  "curlExit": 0,
  "redirectOccurred": false,
  "responseByteDefinition": "Full received final HTTP response entity body; identity encoding requested; no text normalization. Transport headers are not included in body hash.",
  "officialTitle": "Appendix HM Armed Forces: caseworker guidance - GOV.UK",
  "officialMetadata": {
    "govuk:format": "guidance",
    "govuk:content-id": "6d989672-c06d-4754-b2de-d39e0b0ca49e",
    "govuk:first-published-at": "2024-04-11T00:00:00+01:00",
    "govuk:updated-at": "2026-08-03T00:01:04+01:00",
    "govuk:public-updated-at": "2026-08-03T00:01:00+01:00",
    "govuk:primary-publishing-organisation": "UK Visas and Immigration"
  },
  "visibleMetadataNotes": "Exposed HTML content identity and date metadata recorded above. No additional effective date inferred.",
  "discoveryAndNeed": "Official HM Armed Forces publication landing linked by S8; selected accessible HTML.",
  "semanticEvidenceIds": [],
  "corroboratingEvidenceIds": [],
  "corroboratingLocators": [],
  "locatorScope": "Official navigation/search result links only; no legal proposition derived"
}
```

### D5 — Appendix International Forces: caseworker guidance - GOV.UK

```json
{
  "sourceId": "D5",
  "canonicalRequestUrl": "https://www.gov.uk/government/publications/appendix-international-forces-caseworker-guidance",
  "finalUrl": "https://www.gov.uk/government/publications/appendix-international-forces-caseworker-guidance",
  "httpStatus": 200,
  "contentType": "text/html; charset=utf-8",
  "retrievalStart": "2026-10-05T12:00:04.598430Z",
  "retrievalFinish": "2026-10-05T12:00:04.719558Z",
  "byteCount": 74519,
  "responseSha256": "91a30ca3430452e1699b515eae7c5de590b6c43bda18340978b884a95e1809cd",
  "redirectCount": 0,
  "contentEncodingRequest": "identity",
  "curlExit": 0,
  "redirectOccurred": false,
  "responseByteDefinition": "Full received final HTTP response entity body; identity encoding requested; no text normalization. Transport headers are not included in body hash.",
  "officialTitle": "Appendix International Forces: caseworker guidance - GOV.UK",
  "officialMetadata": {
    "govuk:format": "guidance",
    "govuk:content-id": "f838b604-3ac2-4663-a74f-69d9beb0675f",
    "govuk:first-published-at": "2024-04-12T00:00:00+01:00",
    "govuk:updated-at": "2026-08-17T10:31:46+01:00",
    "govuk:public-updated-at": "2026-08-17T10:31:45+01:00",
    "govuk:primary-publishing-organisation": "UK Visas and Immigration"
  },
  "visibleMetadataNotes": "Exposed HTML content identity and date metadata recorded above. No additional effective date inferred.",
  "discoveryAndNeed": "Official International Forces publication landing linked by S8; selected accessible HTML.",
  "semanticEvidenceIds": [],
  "corroboratingEvidenceIds": [],
  "corroboratingLocators": [],
  "locatorScope": "Official navigation/search result links only; no legal proposition derived"
}
```

### D6 — Common Travel Area: rights of UK and Irish citizens - GOV.UK

```json
{
  "sourceId": "D6",
  "canonicalRequestUrl": "https://www.gov.uk/government/publications/common-travel-area-guidance",
  "finalUrl": "https://www.gov.uk/government/publications/common-travel-area-guidance",
  "httpStatus": 200,
  "contentType": "text/html; charset=utf-8",
  "retrievalStart": "2026-10-05T12:06:34.663327Z",
  "retrievalFinish": "2026-10-05T12:06:34.806188Z",
  "byteCount": 73416,
  "responseSha256": "ea0db50833f8a2f53043d037a31943ce70bab165252c5f4842c2f25bb25aa417",
  "redirectCount": 0,
  "contentEncodingRequest": "identity",
  "curlExit": 0,
  "redirectOccurred": false,
  "responseByteDefinition": "Full received final HTTP response entity body; identity encoding requested; no text normalization. Transport headers are not included in body hash.",
  "officialTitle": "Common Travel Area: rights of UK and Irish citizens - GOV.UK",
  "officialMetadata": {
    "govuk:format": "guidance",
    "govuk:content-id": "434e8e12-f562-4bb8-9320-64eeebcffed5",
    "govuk:first-published-at": "2019-02-22T00:00:00+00:00",
    "govuk:updated-at": "2026-09-09T14:54:16+01:00",
    "govuk:public-updated-at": "2026-01-01T00:01:08+00:00",
    "govuk:primary-publishing-organisation": "Cabinet Office"
  },
  "visibleMetadataNotes": "Exposed HTML content identity and date metadata recorded above. No additional effective date inferred.",
  "discoveryAndNeed": "Official CTA-guidance landing linked by S20; selected S23.",
  "semanticEvidenceIds": [],
  "corroboratingEvidenceIds": [],
  "corroboratingLocators": [],
  "locatorScope": "Official navigation/search result links only; no legal proposition derived"
}
```

### D7 — Common travel area (immigration staff guidance) - GOV.UK

```json
{
  "sourceId": "D7",
  "canonicalRequestUrl": "https://www.gov.uk/government/publications/common-travel-area",
  "finalUrl": "https://www.gov.uk/government/publications/common-travel-area",
  "httpStatus": 200,
  "contentType": "text/html; charset=utf-8",
  "retrievalStart": "2026-10-05T12:06:44.414888Z",
  "retrievalFinish": "2026-10-05T12:06:44.531082Z",
  "byteCount": 79337,
  "responseSha256": "c05026ef96a53f94d3c173df4cfce11697aac3af185ce97313aec7c3bd2f67f4",
  "redirectCount": 0,
  "contentEncodingRequest": "identity",
  "curlExit": 0,
  "redirectOccurred": false,
  "responseByteDefinition": "Full received final HTTP response entity body; identity encoding requested; no text normalization. Transport headers are not included in body hash.",
  "officialTitle": "Common travel area (immigration staff guidance) - GOV.UK",
  "officialMetadata": {
    "govuk:format": "guidance",
    "govuk:content-id": "a81a896a-c9a1-4607-af34-4f4593af81be",
    "govuk:first-published-at": "2018-07-16T00:00:00+01:00",
    "govuk:updated-at": "2026-04-29T15:31:02+01:00",
    "govuk:public-updated-at": "2026-04-09T01:00:00+01:00",
    "govuk:primary-publishing-organisation": "UK Visas and Immigration"
  },
  "visibleMetadataNotes": "Exposed HTML content identity and date metadata recorded above. No additional effective date inferred.",
  "discoveryAndNeed": "Official CTA-caseworker publication landing linked by S20; selected S24.",
  "semanticEvidenceIds": [],
  "corroboratingEvidenceIds": [],
  "corroboratingLocators": [],
  "locatorScope": "Official navigation/search result links only; no legal proposition derived"
}
```

## 9. Complete structured evidence records

The fields are intentionally repeated per row so a reviewer can examine a single clause without guessing its source/time/hash. Read related rows together where a conjunct is split across them.

### A00 — Appendix introduction

```json
{
  "evidenceId": "A00",
  "sourceId": "S1",
  "officialSourceUrl": "https://www.gov.uk/guidance/immigration-rules/immigration-rules-appendix-electronic-travel-authorisation",
  "clauseId": "Appendix introduction",
  "sourceLocator": "Opening paragraphs before Validity requirements",
  "semanticSubject": "Specified nationals travelling to UK",
  "semanticRelation": "require in advance",
  "semanticObject": "ETA",
  "conditions": [
    "Nationality and commencement determined by ETANL 1.1",
    "All independently applicable exemptions must be accounted for"
  ],
  "exceptions": [],
  "crossReferences": [
    "S9 ETANL 1.1(d)",
    "A01",
    "coverage ledger"
  ],
  "effectOnEtaRequirement": "A requirement baseline, not a safe residual branch",
  "referenceTime": "Before travel",
  "evidenceQuality": "Direct official primary text; paraphrase, not accepted Evidence",
  "retrievedAt": "2026-10-05T11:53:29.336756Z",
  "responseSha256": "66128a951666671435796dcb682c0d1eda4cc8be1b5ae429b6943fcfe9c9614c",
  "notes": "An ETA is travel authorisation, not permission to enter. Refusal of ETA is not refusal of permission to enter; the introduction directs a refused applicant wishing to travel to apply for a visa."
}
```

### A01 — Appendix introduction: existing permission

```json
{
  "evidenceId": "A01",
  "sourceId": "S1",
  "officialSourceUrl": "https://www.gov.uk/guidance/immigration-rules/immigration-rules-appendix-electronic-travel-authorisation",
  "clauseId": "Appendix introduction: existing permission",
  "sourceLocator": "Opening paragraph beginning A person who has",
  "semanticSubject": "Person",
  "semanticRelation": "does not need ETA if ANY",
  "semanticObject": "Existing valid entry clearance OR permission to enter OR permission to stay in the UK",
  "conditions": [
    "The permission/entry-clearance must be valid for the relevant travel"
  ],
  "exceptions": [],
  "crossReferences": [
    "S4 no-ETA list",
    "S5 4.2",
    "C02-C04"
  ],
  "effectOnEtaRequirement": "A exemption",
  "referenceTime": "Current validity in relation to journey; no residence-country inference",
  "evidenceQuality": "Direct official primary text; paraphrase, not accepted Evidence",
  "retrievedAt": "2026-10-05T11:53:29.336756Z",
  "responseSha256": "66128a951666671435796dcb682c0d1eda4cc8be1b5ae429b6943fcfe9c9614c",
  "notes": "These are alternative sufficient routes, not a requirement to hold all three. A previously granted or expired item alone cannot establish current validity; a negative item does not establish absence of all permissions."
}
```

### A02 — ETANL 1.1(d): Switzerland

```json
{
  "evidenceId": "A02",
  "sourceId": "S9",
  "officialSourceUrl": "https://www.gov.uk/guidance/immigration-rules/immigration-rules-appendix-eta-national-list",
  "clauseId": "ETANL 1.1(d): Switzerland",
  "sourceLocator": "ETANL 1.1(d), country list entry Switzerland",
  "semanticSubject": "Swiss national",
  "semanticRelation": "falls within rollout",
  "semanticObject": "ETA national cohort",
  "conditions": [
    "Travel on or after 2 April 2025"
  ],
  "exceptions": [],
  "crossReferences": [
    "S1 introduction; ETA 1.2; ETA 1.9; ETA 1.10"
  ],
  "effectOnEtaRequirement": "A nationality/date boundary; also B eligible nationality",
  "referenceTime": "Travel commencement 2025-04-02",
  "evidenceQuality": "Direct official primary text; paraphrase, not accepted Evidence",
  "retrievedAt": "2026-10-05T11:55:52.585129Z",
  "responseSha256": "2d132dc30ecb698290ed330cffad6f68fb8566bd37cd18825e36ab241d3d1075",
  "notes": "Fresh page does not prove unchanged historic or future law for every date after commencement."
}
```

### I01 — ETA 1.3

```json
{
  "evidenceId": "I01",
  "sourceId": "S1",
  "officialSourceUrl": "https://www.gov.uk/guidance/immigration-rules/immigration-rules-appendix-electronic-travel-authorisation",
  "clauseId": "ETA 1.3",
  "sourceLocator": "Validity requirements / ETA 1.3",
  "semanticSubject": "Applicant lawfully resident in Ireland",
  "semanticRelation": "is exempt for ALL",
  "semanticObject": "Travel to UK from elsewhere in CTA",
  "conditions": [
    "Lawful residence as defined by ETA 1.4",
    "Inbound travel to UK",
    "Origin elsewhere in CTA, not a domestic UK journey"
  ],
  "exceptions": [],
  "crossReferences": [
    "I02-I06",
    "S2 paragraph 15",
    "S3 ETA rules: Exemption for Irish residents",
    "S24 6.9"
  ],
  "effectOnEtaRequirement": "A exemption conditional on entire Ireland conjunction",
  "referenceTime": "Travel direction explicit; application-time problem in I05/I06",
  "evidenceQuality": "Direct official primary text; paraphrase, not accepted Evidence",
  "retrievedAt": "2026-10-05T11:53:29.336756Z",
  "responseSha256": "66128a951666671435796dcb682c0d1eda4cc8be1b5ae429b6943fcfe9c9614c",
  "notes": "The word applicant is present in the rule; it does not by itself impose an ETA application on someone the same rule exempts."
}
```

### I02 — ETA 1.4: residence limb

```json
{
  "evidenceId": "I02",
  "sourceId": "S1",
  "officialSourceUrl": "https://www.gov.uk/guidance/immigration-rules/immigration-rules-appendix-electronic-travel-authorisation",
  "clauseId": "ETA 1.4: residence limb",
  "sourceLocator": "ETA 1.4, words resident in",
  "semanticSubject": "Same person relying on ETA 1.3",
  "semanticRelation": "must actually reside in",
  "semanticObject": "Republic of Ireland",
  "conditions": [
    "Actual residence required in addition to entitlement"
  ],
  "exceptions": [],
  "crossReferences": [
    "I03",
    "I04",
    "I05"
  ],
  "effectOnEtaRequirement": "A exemption conjunct",
  "referenceTime": "Personal-fact reference time not separately resolved by the sentence",
  "evidenceQuality": "Direct official primary text; paraphrase, not accepted Evidence",
  "retrievedAt": "2026-10-05T11:53:29.336756Z",
  "responseSha256": "66128a951666671435796dcb682c0d1eda4cc8be1b5ae429b6943fcfe9c9614c",
  "notes": "A recorded residence-country field is not a finding of actual lawful residence."
}
```

### I03 — ETA 1.4: entitlement limb

```json
{
  "evidenceId": "I03",
  "sourceId": "S1",
  "officialSourceUrl": "https://www.gov.uk/guidance/immigration-rules/immigration-rules-appendix-electronic-travel-authorisation",
  "clauseId": "ETA 1.4: entitlement limb",
  "sourceLocator": "ETA 1.4, entitled to reside under legislation or rules",
  "semanticSubject": "Same person",
  "semanticRelation": "must be entitled to reside under",
  "semanticObject": "Relevant Irish legislation OR rules",
  "conditions": [
    "Entitlement in Republic of Ireland",
    "Legal basis is relevant legislation or rules applying there",
    "Actual residence limb I02 also true"
  ],
  "exceptions": [],
  "crossReferences": [
    "I02",
    "I05"
  ],
  "effectOnEtaRequirement": "A exemption conjunct",
  "referenceTime": "Legal-framework application-time wording retained",
  "evidenceQuality": "Direct official primary text; paraphrase, not accepted Evidence",
  "retrievedAt": "2026-10-05T11:53:29.336756Z",
  "responseSha256": "66128a951666671435796dcb682c0d1eda4cc8be1b5ae429b6943fcfe9c9614c",
  "notes": "Do not infer entitlement from Swiss nationality, an address, or a document title alone; Irish entitlement law was not independently re-created in this slice."
}
```

### I04 — ETA 1.4: Minister restriction

```json
{
  "evidenceId": "I04",
  "sourceId": "S1",
  "officialSourceUrl": "https://www.gov.uk/guidance/immigration-rules/immigration-rules-appendix-electronic-travel-authorisation",
  "clauseId": "ETA 1.4: Minister restriction",
  "sourceLocator": "ETA 1.4, final but clause",
  "semanticSubject": "Person otherwise satisfying residence and entitlement",
  "semanticRelation": "is excluded from this definition when",
  "semanticObject": "May not leave OR attempt to leave Ireland without consent of an Irish Minister",
  "conditions": [],
  "exceptions": [
    "Restriction requiring Minister consent defeats lawful-residence definition for ETA 1.3"
  ],
  "crossReferences": [
    "I01-I03"
  ],
  "effectOnEtaRequirement": "A exception to Ireland exemption",
  "referenceTime": "Reference-time link unresolved as in I05",
  "evidenceQuality": "Direct official primary text; paraphrase, not accepted Evidence",
  "retrievedAt": "2026-10-05T11:53:29.336756Z",
  "responseSha256": "66128a951666671435796dcb682c0d1eda4cc8be1b5ae429b6943fcfe9c9614c",
  "notes": "The predicate concerns being subject to a consent restriction, not merely whether consent was requested or granted. No text says obtaining consent cures this exclusion."
}
```

### I05 — ETA 1.4: temporal qualifier

```json
{
  "evidenceId": "I05",
  "sourceId": "S1",
  "officialSourceUrl": "https://www.gov.uk/guidance/immigration-rules/immigration-rules-appendix-electronic-travel-authorisation",
  "clauseId": "ETA 1.4: temporal qualifier",
  "sourceLocator": "ETA 1.4, relative clause which apply ... at the time of the ETA application",
  "semanticSubject": "Relevant legislation or rules",
  "semanticRelation": "are qualified by",
  "semanticObject": "Application-time phrase",
  "conditions": [
    "Explicit reference to an ETA application event"
  ],
  "exceptions": [],
  "crossReferences": [
    "I02-I04",
    "I06",
    "S3 repeated definition"
  ],
  "effectOnEtaRequirement": "A semantic contract unresolved",
  "referenceTime": "at the time of the ETA application",
  "evidenceQuality": "Direct official wording; interpretive scope UNRESOLVED",
  "retrievedAt": "2026-10-05T11:53:29.336756Z",
  "responseSha256": "66128a951666671435796dcb682c0d1eda4cc8be1b5ae429b6943fcfe9c9614c",
  "notes": "Grammar links which apply to legislation/rules. That is evidence for a framework-time reading, not official resolution that ONLY the framework, ONLY personal facts, or BOTH are time-qualified. The clause does not supply an alternative event for a non-applicant. Travel date, check date and hypothetical application date must not be substituted."
}
```

### I06 — ETA rules: Exemption for Irish residents

```json
{
  "evidenceId": "I06",
  "sourceId": "S3",
  "officialSourceUrl": "https://www.gov.uk/government/publications/electronic-travel-authorisation-irish-resident-exemption-caseworker-guidance/electronic-travel-authorisation-irish-resident-exemption-accessible",
  "clauseId": "ETA rules: Exemption for Irish residents",
  "sourceLocator": "Heading #eta-rules-exemption-for-irish-residents, definition and following arrival paragraph",
  "semanticSubject": "ETA-national Irish resident arriving from CTA without ETA",
  "semanticRelation": "can rely on exemption and be examined for",
  "semanticObject": "Evidence of lawful residence",
  "conditions": [
    "Arrival without ETA is expressly contemplated",
    "If examined and relying on residence exemption, evidence may be required"
  ],
  "exceptions": [],
  "crossReferences": [
    "S1 ETA 1.3-1.6",
    "S24 6.9",
    "D3 official search"
  ],
  "effectOnEtaRequirement": "A no-application case exists; temporal rule remains unresolved",
  "referenceTime": "No alternative application event or reference time specified",
  "evidenceQuality": "Direct guidance; no-application temporal semantics UNRESOLVED",
  "retrievedAt": "2026-10-05T11:54:16.744506Z",
  "responseSha256": "9da39fc0eae6fe32b996dfd6ecddbe586d07f7bba9add08f1555e00a31b93ed8",
  "notes": "The guidance repeats the application-time phrase rather than interpreting it. It contemplates a traveller without an ETA but does not explicitly say that every such traveller has never applied. No application prerequisite or proxy event is established. Bounded official search D3 is discovery only, not proof no clarification exists anywhere."
}
```

### I07 — Part 1 paragraph 15

```json
{
  "evidenceId": "I07",
  "sourceId": "S2",
  "officialSourceUrl": "https://www.gov.uk/guidance/immigration-rules/immigration-rules-part-1-leave-to-enter-or-stay-in-the-uk",
  "clauseId": "Part 1 paragraph 15",
  "sourceLocator": "Common Travel Area / paragraph 15",
  "semanticSubject": "CTA",
  "semanticRelation": "contains",
  "semanticObject": "UK, Channel Islands, Isle of Man and Republic of Ireland",
  "conditions": [
    "Read with ETA 1.3: origin elsewhere relative to UK destination"
  ],
  "exceptions": [],
  "crossReferences": [
    "S3 Common Travel Area",
    "S20 #the-common-travel-area",
    "S24 section 2"
  ],
  "effectOnEtaRequirement": "A origin-domain cross-reference",
  "referenceTime": "Inbound journey",
  "evidenceQuality": "Direct official primary text; paraphrase, not accepted Evidence",
  "retrievedAt": "2026-10-05T11:54:09.887205Z",
  "responseSha256": "061561100e7eead12d7290e02421270eee19ed5970186d89e76d44c249e44674",
  "notes": "Jersey and Bailiwick of Guernsey are named in current guidance. CTA membership alone is not an ETA exemption; lack of routine border controls does not remove the requirement."
}
```

### I08 — ETA 1.6

```json
{
  "evidenceId": "I08",
  "sourceId": "S1",
  "officialSourceUrl": "https://www.gov.uk/guidance/immigration-rules/immigration-rules-appendix-electronic-travel-authorisation",
  "clauseId": "ETA 1.6",
  "sourceLocator": "ETA 1.6",
  "semanticSubject": "Person relying on ETA 1.3 aged 16 or over",
  "semanticRelation": "must provide if required",
  "semanticObject": "Evidence demonstrating lawful residence",
  "conditions": [
    "Age >=16",
    "Reliance on ETA 1.3",
    "Evidence requested"
  ],
  "exceptions": [],
  "crossReferences": [
    "S3 #children",
    "I09-I11"
  ],
  "effectOnEtaRequirement": "Evidence duty, not age threshold for exemption",
  "referenceTime": "When relying on exemption / evidence requested",
  "evidenceQuality": "Direct official primary text; paraphrase, not accepted Evidence",
  "retrievedAt": "2026-10-05T11:53:29.336756Z",
  "responseSha256": "66128a951666671435796dcb682c0d1eda4cc8be1b5ae429b6943fcfe9c9614c",
  "notes": "Age 15 does not make lawful residence unnecessary; age 16 does not create the exemption."
}
```

### I09 — Children; absence of documentary evidence

```json
{
  "evidenceId": "I09",
  "sourceId": "S3",
  "officialSourceUrl": "https://www.gov.uk/government/publications/electronic-travel-authorisation-irish-resident-exemption-caseworker-guidance/electronic-travel-authorisation-irish-resident-exemption-accessible",
  "clauseId": "Children; absence of documentary evidence",
  "sourceLocator": "Headings #children and #absence-of-documentary-evidence",
  "semanticSubject": "Irish-residence exemption claimant",
  "semanticRelation": "is assessed using",
  "semanticObject": "All relevant information",
  "conditions": [
    "16/17-year-olds must provide evidence if required",
    "Under-16s normally not asked for documents",
    "Under-16 traveller or accompanying adult may be questioned when appropriate",
    "Officials must consider all relevant information before deciding"
  ],
  "exceptions": [
    "Absence of listed documents makes proof unlikely, not an automatic legal false"
  ],
  "crossReferences": [
    "I08",
    "I10",
    "I11"
  ],
  "effectOnEtaRequirement": "Evidence duty / assessment",
  "referenceTime": "Examination",
  "evidenceQuality": "Direct official primary text; paraphrase, not accepted Evidence",
  "retrievedAt": "2026-10-05T11:54:16.744506Z",
  "responseSha256": "9da39fc0eae6fe32b996dfd6ecddbe586d07f7bba9add08f1555e00a31b93ed8",
  "notes": "The closing ETA-required sentence is scoped to failure of this residence route; it cannot negate another independently applicable exemption."
}
```

### I10 — Documents that show lawful residence; document-specific sections

```json
{
  "evidenceId": "I10",
  "sourceId": "S3",
  "officialSourceUrl": "https://www.gov.uk/government/publications/electronic-travel-authorisation-irish-resident-exemption-caseworker-guidance/electronic-travel-authorisation-irish-resident-exemption-accessible",
  "clauseId": "Documents that show lawful residence; document-specific sections",
  "sourceLocator": "From #documents-that-show-lawful-residence-in-ireland through #irish-residence-permit",
  "semanticSubject": "Claimant",
  "semanticRelation": "may prove residence with ANY listed example",
  "semanticObject": "PRC, IE EHIC, Irish driving licence, learner permit, medical card, GP visit card, National Age Card, IRP",
  "conditions": [
    "Original checked where possible",
    "Valid and unexpired",
    "Issued by Irish authority",
    "PRC: Irish Justice government certificate, stamp; guidance describes EEA resident age16+ continuous-residence route",
    "EHIC: IE issuer, not other state; no photo, additional photo ID may be required above18; supplemental photo ID need not be Irish",
    "Driving/learner card: NDLS; IRL marking; other-state document not accepted for this purpose",
    "Medical/GP: HSE; no photo; additional photo ID may be needed above18 for Medical Card",
    "National Age Card: Garda, age18+; IRP: Irish government, third-country residents age16+"
  ],
  "exceptions": [
    "Damaged information that cannot be verified may not be accepted"
  ],
  "crossReferences": [
    "I09",
    "S4 #what-documents-youll-need-to-bring"
  ],
  "effectOnEtaRequirement": "Evidence duty, not an exhaustive definition of lawful residence",
  "referenceTime": "Document validity on inspection; no replacement for I05",
  "evidenceQuality": "Direct official primary text; paraphrase, not accepted Evidence",
  "retrievedAt": "2026-10-05T11:54:16.744506Z",
  "responseSha256": "9da39fc0eae6fe32b996dfd6ecddbe586d07f7bba9add08f1555e00a31b93ed8",
  "notes": "Document acquisition descriptions do not create ETA entitlement predicates. This audit does not validate a traveller document or implement document checking."
}
```

### I11 — If you live in Ireland; What documents you will need

```json
{
  "evidenceId": "I11",
  "sourceId": "S4",
  "officialSourceUrl": "https://www.gov.uk/eta/when-not-need-eta",
  "clauseId": "If you live in Ireland; What documents you will need",
  "sourceLocator": "Headings #if-you-live-in-ireland and #what-documents-youll-need-to-bring",
  "semanticSubject": "ETA-national resident of Ireland entering from IE/GG/JE/IM",
  "semanticRelation": "is told to bring",
  "semanticObject": "One listed Irish-issued original document if age16+",
  "conditions": [
    "ETA-national cohort",
    "Irish residence",
    "Entry from named non-UK CTA territory",
    "Document original",
    "Irish government issuer",
    "Valid at travel",
    "Nine listed types: same eight as S3 plus diplomatic identity card"
  ],
  "exceptions": [
    "Under16 need not bring proof",
    "Visa-national visa instruction is outside exact CH cell"
  ],
  "crossReferences": [
    "I01-I10"
  ],
  "effectOnEtaRequirement": "A public summary plus evidence duty",
  "referenceTime": "Document valid at time of travel, explicitly",
  "evidenceQuality": "Direct official primary text; paraphrase, not accepted Evidence",
  "retrievedAt": "2026-10-05T11:55:35.103904Z",
  "responseSha256": "1b5ac298f60973aa0d4310806e4a16040c17ca63877c643d497566b185627df9",
  "notes": "Public wording is more categorical than S3 if-required/alternative-evidence guidance; preserve both. Its travel-time qualifier is about documentary validity, not an explicit amendment to ETA 1.4."
}
```

### I12 — 6.8 and 6.9

```json
{
  "evidenceId": "I12",
  "sourceId": "S24",
  "officialSourceUrl": "https://www.gov.uk/government/publications/common-travel-area/common-travel-area-accessible",
  "clauseId": "6.8 and 6.9",
  "sourceLocator": "Headings #electronic-travel-authorisation-eta and #eta-requirements-for-travel-from-ireland-to-the-uk",
  "semanticSubject": "ETA requirement on CTA routes",
  "semanticRelation": "continues except qualifying",
  "semanticObject": "Legally resident Irish third-country nationals travelling within CTA",
  "conditions": [
    "All routes/modes including CTA are within ETA framework",
    "Irish resident relies on physical evidence under referenced Irish-resident guidance"
  ],
  "exceptions": [
    "This Ireland exemption does not extend to travel from outside CTA"
  ],
  "crossReferences": [
    "S1 ETA 1.3-1.6",
    "S3",
    "I05-I06"
  ],
  "effectOnEtaRequirement": "A corroboration, not temporal closure",
  "referenceTime": "Travel within CTA; no substitute application event",
  "evidenceQuality": "Direct official primary text; paraphrase, not accepted Evidence",
  "retrievedAt": "2026-10-05T12:06:55.109156Z",
  "responseSha256": "838efd989b1e061f1ef3b6e725f8a048ef68cd62ff4ac0b9ccd71f159b57ed46",
  "notes": "Version16.0 does not resolve the ETA1.4 grammar or no-application time. Internal-only removed sections supply no usable evidence."
}
```

### F01 — ETA 1.9: traveller

```json
{
  "evidenceId": "F01",
  "sourceId": "S1",
  "officialSourceUrl": "https://www.gov.uk/guidance/immigration-rules/immigration-rules-appendix-electronic-travel-authorisation",
  "clauseId": "ETA 1.9: traveller",
  "sourceLocator": "Validity requirements / ETA 1.9",
  "semanticSubject": "Same ETA-national traveller",
  "semanticRelation": "must satisfy ALL",
  "semanticObject": "Age, study relationship and inbound school-party Visitor journey",
  "conditions": [
    "ETA national",
    "Age <= 18",
    "Studying at the school OR educational institution in France",
    "That institution is registered with French Ministry of Education",
    "Entering as part of the school party",
    "Party organised by THAT same school/institution",
    "Travel to UK as a Visitor"
  ],
  "exceptions": [],
  "crossReferences": [
    "S2 11C",
    "F02",
    "F03",
    "F04"
  ],
  "effectOnEtaRequirement": "A exemption only with all rule and form conjuncts",
  "referenceTime": "Age/status in described pre-travel entry situation; no application-time phrase in this clause",
  "evidenceQuality": "Direct official primary text; paraphrase, not accepted Evidence",
  "retrievedAt": "2026-10-05T11:53:29.336756Z",
  "responseSha256": "66128a951666671435796dcb682c0d1eda4cc8be1b5ae429b6943fcfe9c9614c",
  "notes": "No generic group membership, school-trip label, French/German residence, escort status, or study-purpose tag substitutes for studying AT the same organising institution. No visitor six-month/Marriage exclusion imported here from ETA1.1(f)."
}
```

### F02 — ETA 1.9: party size

```json
{
  "evidenceId": "F02",
  "sourceId": "S1",
  "officialSourceUrl": "https://www.gov.uk/guidance/immigration-rules/immigration-rules-appendix-electronic-travel-authorisation",
  "clauseId": "ETA 1.9: party size",
  "sourceLocator": "Validity requirements / ETA 1.9",
  "semanticSubject": "School party",
  "semanticRelation": "must have at least",
  "semanticObject": "Five pupils",
  "conditions": [
    "Minimum 5",
    "Same party as traveller participation and school organisation"
  ],
  "exceptions": [],
  "crossReferences": [
    "S2 11A(h)",
    "S6 opening",
    "S10 page3",
    "F04"
  ],
  "effectOnEtaRequirement": "A count conjunct",
  "referenceTime": "School party for this journey",
  "evidenceQuality": "Direct official primary text; paraphrase, not accepted Evidence",
  "retrievedAt": "2026-10-05T11:53:29.336756Z",
  "responseSha256": "66128a951666671435796dcb682c0d1eda4cc8be1b5ae429b6943fcfe9c9614c",
  "notes": "French ETA1.9 says pupils. German ETA1.10 omits the word pupils after 5 or more; do not silently quote it as present. Part1 11A(i), German guidance and page3 of the required form explicitly resolve the unit to pupils, excluding accompanying adults from the count."
}
```

### F03 — 11C

```json
{
  "evidenceId": "F03",
  "sourceId": "S2",
  "officialSourceUrl": "https://www.gov.uk/guidance/immigration-rules/immigration-rules-part-1-leave-to-enter-or-stay-in-the-uk",
  "clauseId": "11C",
  "sourceLocator": "Part1 paragraph 11C",
  "semanticSubject": "Same traveller",
  "semanticRelation": "must be listed in ALL qualifying",
  "semanticObject": "Named Home Office France-UK School Trip Travel Information Form",
  "conditions": [
    "Form published on GOV.UK",
    "Form completed",
    "Traveller listed",
    "Form authenticated",
    "Form in possession of an adult",
    "That adult arrives at border",
    "That adult is responsible for supervising that party’s travel"
  ],
  "exceptions": [],
  "crossReferences": [
    "S1 ETA 1.9",
    "S2 11A(h)",
    "VN 7.0 (visa route outside CH audit)",
    "F05-F09"
  ],
  "effectOnEtaRequirement": "A incorporated form condition, not optional border proof",
  "referenceTime": "Completed/authenticated before border presentation; possession on arrival",
  "evidenceQuality": "Direct official primary text; paraphrase, not accepted Evidence",
  "retrievedAt": "2026-10-05T11:54:09.887205Z",
  "responseSha256": "061561100e7eead12d7290e02421270eee19ed5970186d89e76d44c249e44674",
  "notes": "Part1 expressly applies this condition to ETA 1.9. A school confirmation alone cannot establish listing, authenticated form or adult custody. Visa cross-reference recorded, not used to infer ETA exemption."
}
```

### F04 — 11A(h) and 11B

```json
{
  "evidenceId": "F04",
  "sourceId": "S2",
  "officialSourceUrl": "https://www.gov.uk/guidance/immigration-rules/immigration-rules-part-1-leave-to-enter-or-stay-in-the-uk",
  "clauseId": "11A(h) and 11B",
  "sourceLocator": "Part1 paragraphs 11A/11B",
  "semanticSubject": "Person using national ID exception",
  "semanticRelation": "must meet ALL within ID-card route",
  "semanticObject": "Age/study/institution/party conditions and nationality list",
  "conditions": [
    "Age <= 18",
    "Studies at school/institution in France",
    "Institution registered with French Ministry of Education",
    "Party >=5 PUPILS",
    "Party organised by that institution",
    "11B list includes Switzerland"
  ],
  "exceptions": [],
  "crossReferences": [
    "S1 ETA 1.9",
    "S2 11C"
  ],
  "effectOnEtaRequirement": "ID/document rule plus count corroboration; not a new A passport restriction",
  "referenceTime": "Entry",
  "evidenceQuality": "Direct official primary text; paraphrase, not accepted Evidence",
  "retrievedAt": "2026-10-05T11:54:09.887205Z",
  "responseSha256": "061561100e7eead12d7290e02421270eee19ed5970186d89e76d44c249e44674",
  "notes": "11B is limited to 11A(c)-(i). Do not convert a nationality condition on ID use into a narrower ETA exemption or require a Swiss passport traveller to use an ID card."
}
```

### G01 — ETA 1.10: traveller

```json
{
  "evidenceId": "G01",
  "sourceId": "S1",
  "officialSourceUrl": "https://www.gov.uk/guidance/immigration-rules/immigration-rules-appendix-electronic-travel-authorisation",
  "clauseId": "ETA 1.10: traveller",
  "sourceLocator": "Validity requirements / ETA 1.10",
  "semanticSubject": "Same ETA-national traveller",
  "semanticRelation": "must satisfy ALL",
  "semanticObject": "Age, study relationship and inbound school-party Visitor journey",
  "conditions": [
    "ETA national",
    "Age <= 19",
    "Studying at the school OR educational institution in Germany",
    "That institution is existence confirmed by relevant German municipal OR competent authority",
    "Entering as part of the school party",
    "Party organised by THAT same school/institution",
    "Travel to UK as a Visitor"
  ],
  "exceptions": [],
  "crossReferences": [
    "S2 11D",
    "G02",
    "G03",
    "G04"
  ],
  "effectOnEtaRequirement": "A exemption only with all rule and form conjuncts",
  "referenceTime": "Age/status in described pre-travel entry situation; no application-time phrase in this clause",
  "evidenceQuality": "Direct official primary text; paraphrase, not accepted Evidence",
  "retrievedAt": "2026-10-05T11:53:29.336756Z",
  "responseSha256": "66128a951666671435796dcb682c0d1eda4cc8be1b5ae429b6943fcfe9c9614c",
  "notes": "No generic group membership, school-trip label, French/German residence, escort status, or study-purpose tag substitutes for studying AT the same organising institution. No visitor six-month/Marriage exclusion imported here from ETA1.1(f)."
}
```

### G02 — ETA 1.10: party size

```json
{
  "evidenceId": "G02",
  "sourceId": "S1",
  "officialSourceUrl": "https://www.gov.uk/guidance/immigration-rules/immigration-rules-appendix-electronic-travel-authorisation",
  "clauseId": "ETA 1.10: party size",
  "sourceLocator": "Validity requirements / ETA 1.10",
  "semanticSubject": "School party",
  "semanticRelation": "must have at least",
  "semanticObject": "Five members; unit supplied explicitly by Part1 and official form guidance",
  "conditions": [
    "Minimum 5",
    "Same party as traveller participation and school organisation"
  ],
  "exceptions": [],
  "crossReferences": [
    "S2 11A(i)",
    "S7 opening",
    "S11 page3",
    "G04"
  ],
  "effectOnEtaRequirement": "A count conjunct",
  "referenceTime": "School party for this journey",
  "evidenceQuality": "Direct official primary text; paraphrase, not accepted Evidence",
  "retrievedAt": "2026-10-05T11:53:29.336756Z",
  "responseSha256": "66128a951666671435796dcb682c0d1eda4cc8be1b5ae429b6943fcfe9c9614c",
  "notes": "French ETA1.9 says pupils. German ETA1.10 omits the word pupils after 5 or more; do not silently quote it as present. Part1 11A(i), German guidance and page3 of the required form explicitly resolve the unit to pupils, excluding accompanying adults from the count."
}
```

### G03 — 11D

```json
{
  "evidenceId": "G03",
  "sourceId": "S2",
  "officialSourceUrl": "https://www.gov.uk/guidance/immigration-rules/immigration-rules-part-1-leave-to-enter-or-stay-in-the-uk",
  "clauseId": "11D",
  "sourceLocator": "Part1 paragraph 11D",
  "semanticSubject": "Same traveller",
  "semanticRelation": "must be listed in ALL qualifying",
  "semanticObject": "Named Home Office Germany-UK School Trip Travel Information Form",
  "conditions": [
    "Form published on GOV.UK",
    "Form completed",
    "Traveller listed",
    "Form authenticated by relevant German municipal OR competent authority",
    "Form in possession of an adult",
    "That adult arrives at border",
    "That adult is responsible for supervising that party’s travel"
  ],
  "exceptions": [],
  "crossReferences": [
    "S1 ETA 1.10",
    "S2 11A(i)",
    "VN 8.0 (visa route outside CH audit)",
    "G05-G09"
  ],
  "effectOnEtaRequirement": "A incorporated form condition, not optional border proof",
  "referenceTime": "Completed/authenticated before border presentation; possession on arrival",
  "evidenceQuality": "Direct official primary text; paraphrase, not accepted Evidence",
  "retrievedAt": "2026-10-05T11:54:09.887205Z",
  "responseSha256": "061561100e7eead12d7290e02421270eee19ed5970186d89e76d44c249e44674",
  "notes": "Part1 expressly applies this condition to ETA 1.10. A school confirmation alone cannot establish listing, authenticated form or adult custody. Visa cross-reference recorded, not used to infer ETA exemption."
}
```

### G04 — 11A(i) and 11B

```json
{
  "evidenceId": "G04",
  "sourceId": "S2",
  "officialSourceUrl": "https://www.gov.uk/guidance/immigration-rules/immigration-rules-part-1-leave-to-enter-or-stay-in-the-uk",
  "clauseId": "11A(i) and 11B",
  "sourceLocator": "Part1 paragraphs 11A/11B",
  "semanticSubject": "Person using national ID exception",
  "semanticRelation": "must meet ALL within ID-card route",
  "semanticObject": "Age/study/institution/party conditions and nationality list",
  "conditions": [
    "Age <= 19",
    "Studies at school/institution in Germany",
    "Institution existence confirmed by relevant German municipal OR competent authority",
    "Party >=5 PUPILS",
    "Party organised by that institution",
    "11B list includes Switzerland"
  ],
  "exceptions": [],
  "crossReferences": [
    "S1 ETA 1.10",
    "S2 11D"
  ],
  "effectOnEtaRequirement": "ID/document rule plus count corroboration; not a new A passport restriction",
  "referenceTime": "Entry",
  "evidenceQuality": "Direct official primary text; paraphrase, not accepted Evidence",
  "retrievedAt": "2026-10-05T11:54:09.887205Z",
  "responseSha256": "061561100e7eead12d7290e02421270eee19ed5970186d89e76d44c249e44674",
  "notes": "11B is limited to 11A(c)-(i). Do not convert a nationality condition on ID use into a narrower ETA exemption or require a Swiss passport traveller to use an ID card."
}
```

### F05 — Opening; filling in the form

```json
{
  "evidenceId": "F05",
  "sourceId": "S6",
  "officialSourceUrl": "https://www.gov.uk/guidance/visit-the-uk-as-part-of-a-french-school-trip",
  "clauseId": "Opening; filling in the form",
  "sourceLocator": "Opening below Contents; #filling-in-the-form",
  "semanticSubject": "French school party",
  "semanticRelation": "uses form only with",
  "semanticObject": "Registered school, qualifying pupils and headteacher preparation",
  "conditions": [
    "5+ children age<=18",
    "School registered with French Ministry of Education",
    "Every child and adult in group included",
    "Headteacher completes form",
    "Use another form if insufficient rows"
  ],
  "exceptions": [],
  "crossReferences": [
    "F01-F04",
    "S10 pp1-3"
  ],
  "effectOnEtaRequirement": "A form-route implementation conditions",
  "referenceTime": "Prior to trip",
  "evidenceQuality": "Direct official primary text; paraphrase, not accepted Evidence",
  "retrievedAt": "2026-10-05T11:55:54.009444Z",
  "responseSha256": "7182495fb2ee3e1187fb083acdbacec3e6dbed2145256fb6edf16c68d3d1b68f",
  "notes": "Adult passport and individual visa/ETA requirements are separately assessed; listing an adult does not exempt the adult. No payer/fee inference: form is free, not an ETA application."
}
```

### F06 — Filling in the form: prefecture

```json
{
  "evidenceId": "F06",
  "sourceId": "S6",
  "officialSourceUrl": "https://www.gov.uk/guidance/visit-the-uk-as-part-of-a-french-school-trip",
  "clauseId": "Filling in the form: prefecture",
  "sourceLocator": "Heading #filling-in-the-form, after PDF link",
  "semanticSubject": "Headteacher",
  "semanticRelation": "must submit to",
  "semanticObject": "Prefecture for document check and return",
  "conditions": [
    "At least15 days before departure",
    "Completed form",
    "Children’s AST authorisations signed by parent/guardian",
    "Copies of parents’ identity documents"
  ],
  "exceptions": [],
  "crossReferences": [
    "S10 p2 Prefecture stamp",
    "F03"
  ],
  "effectOnEtaRequirement": "A incorporated authentication process / ancillary form duties",
  "referenceTime": ">=15 days before departure; validated form before border",
  "evidenceQuality": "Direct official primary text; paraphrase, not accepted Evidence",
  "retrievedAt": "2026-10-05T11:55:54.009444Z",
  "responseSha256": "7182495fb2ee3e1187fb083acdbacec3e6dbed2145256fb6edf16c68d3d1b68f",
  "notes": "This is the additional French authority action. The prefecture’s checking/stamping of the form is distinct from Ministry registration of the institution."
}
```

### F07 — Form p2: school certification

```json
{
  "evidenceId": "F07",
  "sourceId": "S10",
  "officialSourceUrl": "https://assets.publishing.service.gov.uk/media/679a182bdc6d75ae3ddc7b6e/France-UK_school_trip_travel_information_form.pdf",
  "clauseId": "Form p2: school certification",
  "sourceLocator": "PDF printed page2, headteacher declaration and signature fields",
  "semanticSubject": "Headteacher of named school",
  "semanticRelation": "certifies ALL",
  "semanticObject": "Completed party details and declarations",
  "conditions": [
    "School name/address and travel dates/destination contact/address completed",
    "Information accurate",
    "All pupils <=18",
    "EU/EEA/Swiss pupils valid passport OR valid national ID",
    "Other pupils valid passport OR refugee/stateless document described under1951/1954 Conventions",
    "Consent of parents/legal guardians of EACH pupil",
    "Total pupil count declared",
    "School responsibility for accommodation and maintenance during trip",
    "All pupils return to France at end of trip",
    "Headteacher signature and date"
  ],
  "exceptions": [],
  "crossReferences": [
    "F03",
    "F06",
    "S10 p2 Prefecture official stamp/date"
  ],
  "effectOnEtaRequirement": "A form-completion content; ancillary travel/document undertakings retained",
  "referenceTime": "Trip dates and declaration date",
  "evidenceQuality": "Direct official primary text; paraphrase, not accepted Evidence",
  "retrievedAt": "2026-10-05T11:56:41.460124Z",
  "responseSha256": "cb49fc367d88afa5dcc7cee6cf7c940fb609dfaeaa6ac8eb1ab00616a8dae98a",
  "notes": "This documents the form, not personal data. The non-Swiss travel-document alternative is recorded because it affects counted fellow pupils; it is not an extension of the selected Swiss ordinary-passport cell."
}
```

### F08 — Form pp1-3, p11: authentication and count

```json
{
  "evidenceId": "F08",
  "sourceId": "S10",
  "officialSourceUrl": "https://assets.publishing.service.gov.uk/media/679a182bdc6d75ae3ddc7b6e/France-UK_school_trip_travel_information_form.pdf",
  "clauseId": "Form pp1-3, p11: authentication and count",
  "sourceLocator": "PDF p2 prefecture stamp/date; p3 instructions; p11 Border Force only",
  "semanticSubject": "French completed form",
  "semanticRelation": "requires",
  "semanticObject": "Prefecture authentication and pupil-only counting",
  "conditions": [
    "Dated official prefecture stamp on p2",
    "Count pupils in sections A+B+C",
    "SectionD contains accompanying adults and does not enter pupil total",
    "A lists EU/EEA/Swiss passports; B their IDs; C other nationals",
    "List documents matching carried documents",
    "Dual-national listing uses nationality of travel document",
    "Additional sheets if needed",
    "Two copies: original plus copy"
  ],
  "exceptions": [],
  "crossReferences": [
    "F01-F07",
    "S6 #bringing-the-form-to-the-uk"
  ],
  "effectOnEtaRequirement": "A form/authentication/count plus evidence mechanics",
  "referenceTime": "Before travel/authentication; border copy retained later",
  "evidenceQuality": "Direct official primary text; paraphrase, not accepted Evidence",
  "retrievedAt": "2026-10-05T11:56:41.460124Z",
  "responseSha256": "cb49fc367d88afa5dcc7cee6cf7c940fb609dfaeaa6ac8eb1ab00616a8dae98a",
  "notes": "Page11 Border Force stamp is not the pre-travel prefecture authentication. Document-nationality listing does not replace Jetnity’s complete citizenship set. Form p1 describes mandatory use when party includes qualifying ID users OR pupils ordinarily requiring ETA/visa but without it."
}
```

### F09 — Documents the children need; Bringing the form

```json
{
  "evidenceId": "F09",
  "sourceId": "S6",
  "officialSourceUrl": "https://www.gov.uk/guidance/visit-the-uk-as-part-of-a-french-school-trip",
  "clauseId": "Documents the children need; Bringing the form",
  "sourceLocator": "#nationals-of-the-eu-switzerland-norway-iceland-and-liechtenstein; #bringing-the-form-to-the-uk",
  "semanticSubject": "Swiss pupil and supervising party",
  "semanticRelation": "must carry/present",
  "semanticObject": "AST, parent ID copy, passport or ID and form copies",
  "conditions": [
    "AST signed by parent/guardian",
    "Copy of parent/guardian identity document",
    "Passport OR national ID",
    "Bring2 copies of form to UK border",
    "Border Force checks form and each traveller’s documents",
    "Border Force retains1 copy"
  ],
  "exceptions": [],
  "crossReferences": [
    "F03",
    "S10 pp2-3"
  ],
  "effectOnEtaRequirement": "Evidence/travel duties supporting incorporated form; not independent ETA exemption",
  "referenceTime": "Travel and border",
  "evidenceQuality": "Direct official primary text; paraphrase, not accepted Evidence",
  "retrievedAt": "2026-10-05T11:55:54.009444Z",
  "responseSha256": "7182495fb2ee3e1187fb083acdbacec3e6dbed2145256fb6edf16c68d3d1b68f",
  "notes": "Children of all nationalities are described as no-ETA/no-visa within qualifying form route. This does not exempt escorts. Passport preference is for quicker crossing, not a condition requiring passport instead of permitted ID."
}
```

### G05 — Opening; documents the adults need

```json
{
  "evidenceId": "G05",
  "sourceId": "S7",
  "officialSourceUrl": "https://www.gov.uk/guidance/visit-the-uk-as-part-of-a-german-school-trip",
  "clauseId": "Opening; documents the adults need",
  "sourceLocator": "Opening below Contents; #documents-the-adults-need",
  "semanticSubject": "German school party",
  "semanticRelation": "uses form for",
  "semanticObject": "5+ pupils <=19 at qualifying school",
  "conditions": [
    "School registered with relevant local municipal OR competent authority",
    "Everyone travelling as group listed",
    "Headteacher completes form",
    "Further copy if rows insufficient",
    "Teachers/responsible accompanying adults are assessed separately; pupils18-19 not treated as accompanying adults"
  ],
  "exceptions": [],
  "crossReferences": [
    "G01-G04",
    "S11 pp1-3"
  ],
  "effectOnEtaRequirement": "A qualifying institution/form route; escorts not exempt by membership",
  "referenceTime": "Trip; scheme launched1 August2026 as page history states",
  "evidenceQuality": "Direct official primary text; paraphrase, not accepted Evidence",
  "retrievedAt": "2026-10-05T11:55:28.424922Z",
  "responseSha256": "ed58fe851a095da2cc197757ec1ae322d763a7db0e1a5afe5c6681959cab73ce",
  "notes": "Guidance registration and rule existence confirmation are preserved distinctly. No named local office or exclusive nationwide German authority is invented. Do not apply the2026 scheme retroactively to2025 travel."
}
```

### G06 — Filling in the form

```json
{
  "evidenceId": "G06",
  "sourceId": "S7",
  "officialSourceUrl": "https://www.gov.uk/guidance/visit-the-uk-as-part-of-a-german-school-trip",
  "clauseId": "Filling in the form",
  "sourceLocator": "Heading #filling-in-the-form after PDF link",
  "semanticSubject": "Headteacher",
  "semanticRelation": "must send to",
  "semanticObject": "German municipal OR other competent authority",
  "conditions": [
    "At least15 days before departure",
    "Completed form",
    "Pupil authorisations signed by parents/guardians",
    "Copies of parents’ identity documents",
    "Authority checks AND validates documents",
    "Authority sends them back to headteacher"
  ],
  "exceptions": [],
  "crossReferences": [
    "S2 11D",
    "G07",
    "G08"
  ],
  "effectOnEtaRequirement": "A form-authentication process distinct from institution confirmation",
  "referenceTime": ">=15 days before departure; authentication before border",
  "evidenceQuality": "Direct official primary text; paraphrase, not accepted Evidence",
  "retrievedAt": "2026-10-05T11:55:28.424922Z",
  "responseSha256": "ed58fe851a095da2cc197757ec1ae322d763a7db0e1a5afe5c6681959cab73ce",
  "notes": "Actor is relevant municipal or competent authority; action2 authenticates completed/listed form, action1 in ETA1.10 confirms institution existence. Neither proves the other automatically."
}
```

### G07 — Form p2: headteacher certification

```json
{
  "evidenceId": "G07",
  "sourceId": "S11",
  "officialSourceUrl": "https://assets.publishing.service.gov.uk/media/6a918e82df4246cf45e466b2/German-UK_school_trip_form_reader_extended_-_09-26.pdf",
  "clauseId": "Form p2: headteacher certification",
  "sourceLocator": "PDF printed p2, declaration and signature",
  "semanticSubject": "Headteacher of named German school",
  "semanticRelation": "certifies ALL",
  "semanticObject": "Trip information, pupils and school undertakings",
  "conditions": [
    "School name/address and UK destination/travel details",
    "Information accurate",
    "All pupils <=19",
    "EU/EEA/Swiss pupils valid passport OR national ID",
    "Other pupils: valid passport OR1951/1954 Convention refugee/stateless document OR valid German travel document for foreigners (Reiseausweis für Ausländer)",
    "Consent of parents/legal guardians of EACH pupil",
    "Total pupils declared",
    "School responsibility for accommodation and maintenance",
    "All pupils return to Germany at end",
    "Headteacher signature/date"
  ],
  "exceptions": [],
  "crossReferences": [
    "G03",
    "G06",
    "G08"
  ],
  "effectOnEtaRequirement": "A form-completion content; ancillary undertakings",
  "referenceTime": "Trip dates and declaration date",
  "evidenceQuality": "Direct official primary text; paraphrase, not accepted Evidence",
  "retrievedAt": "2026-10-05T11:56:41.474293Z",
  "responseSha256": "fd4d85b4d2846e2110835c6857596e01807e386e01eb4016bc94d8a6a4f0898e",
  "notes": "The form does not state an adult-pupil carveout to its parental-consent declaration. Preserve that text even though18/19-year-old pupils are included. S7 non-EU document wording is narrower than the form; outside the selected CH credential, do not declare all mixed-party documents validated."
}
```

### G08 — Form pp1-3 and p11

```json
{
  "evidenceId": "G08",
  "sourceId": "S11",
  "officialSourceUrl": "https://assets.publishing.service.gov.uk/media/6a918e82df4246cf45e466b2/German-UK_school_trip_form_reader_extended_-_09-26.pdf",
  "clauseId": "Form pp1-3 and p11",
  "sourceLocator": "PDF p2 municipal/competent official stamp/date; p3 instructions",
  "semanticSubject": "Completed German form",
  "semanticRelation": "is authenticated and counted by",
  "semanticObject": "Authority stamp/date; sections A+B+C pupils",
  "conditions": [
    "Relevant municipal OR competent authority official stamp and date",
    "A+B+C pupil count only",
    "D accompanying adult section excluded",
    "All document entries correspond to carried documents",
    "Additional sheets for overflow",
    "Two copies: original plus copy"
  ],
  "exceptions": [
    "Page1 explicitly does not require listing British citizens; S7 general everyone wording not used to erase that exception"
  ],
  "crossReferences": [
    "G03",
    "G05-G07"
  ],
  "effectOnEtaRequirement": "A form/authentication/count; border stamp distinct",
  "referenceTime": "Authentication prior to travel; presentation on arrival",
  "evidenceQuality": "Direct official primary text; paraphrase, not accepted Evidence",
  "retrievedAt": "2026-10-05T11:56:41.474293Z",
  "responseSha256": "fd4d85b4d2846e2110835c6857596e01807e386e01eb4016bc94d8a6a4f0898e",
  "notes": "German form p1 triggers for eligible ID users OR pupils needing ETA/visa but not holding it. Page11 Border Force stamp is not municipal authentication. British-citizen listing exception is outside exact traveller citizenship cell, retained for party context. Page1 describes groups travelling FROM Germany; the rule itself does not expressly add an origin-country predicate. Outside that described route, this audit does not resolve the applicability of the same form; no negative origin rule is invented. The British listing exception does not prove British pupils never count toward the rule’s five-pupil party threshold; listed totals and total party size must remain distinct in mixed parties."
}
```

### G09 — Documents the pupils need; Bringing the form

```json
{
  "evidenceId": "G09",
  "sourceId": "S7",
  "officialSourceUrl": "https://www.gov.uk/guidance/visit-the-uk-as-part-of-a-german-school-trip",
  "clauseId": "Documents the pupils need; Bringing the form",
  "sourceLocator": "#nationals-of-the-eu-switzerland-norway-iceland-and-liechtenstein; #bringing-the-form-to-the-uk",
  "semanticSubject": "Swiss pupil and supervising party",
  "semanticRelation": "bring",
  "semanticObject": "Passport or ID and2 form copies",
  "conditions": [
    "Swiss pupil passport OR national ID",
    "Two copies shown to Border Force",
    "Officer checks documents/form and retains one"
  ],
  "exceptions": [],
  "crossReferences": [
    "G03",
    "G06-G08"
  ],
  "effectOnEtaRequirement": "Evidence duty; Bundespolizei recommendation separate from mandatory submission",
  "referenceTime": "Travel and border",
  "evidenceQuality": "Direct official primary text; paraphrase, not accepted Evidence",
  "retrievedAt": "2026-10-05T11:55:28.424922Z",
  "responseSha256": "ed58fe851a095da2cc197757ec1ae322d763a7db0e1a5afe5c6681959cab73ce",
  "notes": "Bundespolizei RECOMMENDS carrying signed parental/guardian consent and parent ID copy to avoid delays. G06 requires submission for validation: different stages, not a contradiction. Do not upgrade recommendation into a new standalone ETA conjunct or delete required submission."
}
```

### C01 — No-ETA list: citizenship

```json
{
  "evidenceId": "C01",
  "sourceId": "S4",
  "officialSourceUrl": "https://www.gov.uk/eta/when-not-need-eta",
  "clauseId": "No-ETA list: citizenship",
  "sourceLocator": "When you do not need an ETA, first item and #dual-citizens",
  "semanticSubject": "British OR Irish citizen",
  "semanticRelation": "does not need",
  "semanticObject": "ETA",
  "conditions": [
    "Either citizenship, including dual citizenship"
  ],
  "exceptions": [],
  "crossReferences": [
    "S5 4.2 Irish entry restrictions",
    "S23 #travelling-and-residing-in-the-cta"
  ],
  "effectOnEtaRequirement": "A exemption excluded by exact complete citizenship set [CH]",
  "referenceTime": "Citizenship for journey",
  "evidenceQuality": "Direct official primary text; paraphrase, not accepted Evidence",
  "retrievedAt": "2026-10-05T11:55:35.103904Z",
  "responseSha256": "1b5ac298f60973aa0d4310806e4a16040c17ca63877c643d497566b185627df9",
  "notes": "Only the explicit complete citizenship-set scope excludes this route. A CH passport alone would not. Inability of British/Irish citizens to apply is a separate B statement; Irish deportation/exclusion/travel-ban exceptions in guidance are outside this CH cell."
}
```

### C02 — No-ETA list: UK visa and permission

```json
{
  "evidenceId": "C02",
  "sourceId": "S4",
  "officialSourceUrl": "https://www.gov.uk/eta/when-not-need-eta",
  "clauseId": "No-ETA list: UK visa and permission",
  "sourceLocator": "When you do not need an ETA, items2-3",
  "semanticSubject": "Traveller",
  "semanticRelation": "does not need ETA with ANY",
  "semanticObject": "UK visa; UK permission live/work/study; settled/pre-settled; right of abode",
  "conditions": [
    "Applicable valid permission/status for this travel"
  ],
  "exceptions": [],
  "crossReferences": [
    "A01",
    "C03",
    "C05",
    "S5 4.2"
  ],
  "effectOnEtaRequirement": "A exemption family",
  "referenceTime": "Current permission for journey",
  "evidenceQuality": "Direct official primary text; paraphrase, not accepted Evidence",
  "retrievedAt": "2026-10-05T11:55:35.103904Z",
  "responseSha256": "1b5ac298f60973aa0d4310806e4a16040c17ca63877c643d497566b185627df9",
  "notes": "Do not equate visa-free nationality, residence in UK, or a refusal/expired visa with a class-wide valid/invalid determination. Right of abode is status, not a normal permission grant."
}
```

### C03 — Overview

```json
{
  "evidenceId": "C03",
  "sourceId": "S14",
  "officialSourceUrl": "https://www.gov.uk/right-of-abode",
  "clauseId": "Overview",
  "sourceLocator": "Right of abode / Overview",
  "semanticSubject": "Person with right of abode",
  "semanticRelation": "may live/work without immigration restriction",
  "semanticObject": "No visa or permission needed",
  "conditions": [
    "Right of abode legally held",
    "British citizens automatically hold it; some Commonwealth citizens may"
  ],
  "exceptions": [],
  "crossReferences": [
    "C02",
    "S18 right-of-abode paragraph",
    "S2 paragraphs12-14"
  ],
  "effectOnEtaRequirement": "A status route, not assumed absent for CH",
  "referenceTime": "Current status",
  "evidenceQuality": "Direct official primary text; paraphrase, not accepted Evidence",
  "retrievedAt": "2026-10-05T11:56:41.123412Z",
  "responseSha256": "d3768c7195ed73bb18d8091356db25f687272a18e64642be12a691c8abb3d070",
  "notes": "Proof: UK passport describing British citizen or British subject with right of abode, OR certificate of entitlement. This audit does not prove that the complete CH set rules out every retained/derived historic status. Treat as unknown unless source-backed exclusion or valid status facts exist."
}
```

### C04 — 6.8;7.2; Crown Dependency EUSS discussion

```json
{
  "evidenceId": "C04",
  "sourceId": "S24",
  "officialSourceUrl": "https://www.gov.uk/government/publications/common-travel-area/common-travel-area-accessible",
  "clauseId": "6.8;7.2; Crown Dependency EUSS discussion",
  "sourceLocator": "ETA requirements for travel from the Crown Dependencies to the UK; #people-transiting-the-uk-for-onward-travel-to-the-crown-dependencies",
  "semanticSubject": "Holder of Crown Dependency permission",
  "semanticRelation": "benefits from",
  "semanticObject": "Recognition of permission in UK",
  "conditions": [
    "Valid permission enter/remain in UK OR a Crown Dependency",
    "For6.8 explicit journey from a Crown Dependency",
    "Schedule4 recognition described for Islands grants"
  ],
  "exceptions": [],
  "crossReferences": [
    "S4 no-ETA list item4",
    "S20 #crown-dependencies",
    "C06"
  ],
  "effectOnEtaRequirement": "A permission route, jurisdiction/type/validity context required",
  "referenceTime": "Valid permission at journey",
  "evidenceQuality": "Direct official primary text; paraphrase, not accepted Evidence",
  "retrievedAt": "2026-10-05T12:06:55.109156Z",
  "responseSha256": "838efd989b1e061f1ef3b6e725f8a048ef68cd62ff4ac0b9ccd71f159b57ed46",
  "notes": "Jersey/Guernsey EUSS applications before1July2021 pending are described as deemed leave recognised in UK. Isle-of-Man saved rights are separately discussed; do not generalise all pending island applications or accept a CD ETA as entry permission."
}
```

### C05 — No-ETA list: pending EUSS

```json
{
  "evidenceId": "C05",
  "sourceId": "S4",
  "officialSourceUrl": "https://www.gov.uk/eta/when-not-need-eta",
  "clauseId": "No-ETA list: pending EUSS",
  "sourceLocator": "When you do not need an ETA, final item",
  "semanticSubject": "Person awaiting EUSS decision",
  "semanticRelation": "does not need ETA according to summary",
  "semanticObject": "Pending EUSS application",
  "conditions": [
    "Waiting for decision"
  ],
  "exceptions": [],
  "crossReferences": [
    "S13 after applying",
    "S18 pending-EUSS paragraph",
    "C06"
  ],
  "effectOnEtaRequirement": "A public status route; precise boundary not fully closed",
  "referenceTime": "Pending decision at journey",
  "evidenceQuality": "Direct official primary text; paraphrase, not accepted Evidence",
  "retrievedAt": "2026-10-05T11:55:35.103904Z",
  "responseSha256": "1b5ac298f60973aa0d4310806e4a16040c17ca63877c643d497566b185627df9",
  "notes": "Summary does not specify validation/late applications/appeals or joining-family branches. Missing qualifiers here are not proof they never apply."
}
```

### C06 — After you have applied: valid application and travel

```json
{
  "evidenceId": "C06",
  "sourceId": "S13",
  "officialSourceUrl": "https://www.gov.uk/settled-status-eu-citizens-families/after-youve-applied",
  "clauseId": "After you have applied: valid application and travel",
  "sourceLocator": "Opening validation paragraphs under #guide-contents; #returning-to-the-uk; S18 pending-EUSS heading",
  "semanticSubject": "EUSS applicant",
  "semanticRelation": "receives certificate after",
  "semanticObject": "Validation checks",
  "conditions": [
    "Identity proved",
    "Required biometrics provided",
    "Entitled to apply from abroad if applicable",
    "Legal entry as joining family member if applicable",
    "Reasonable grounds for late application if applicable",
    "Valid application produces certificate of application",
    "S18 ID-card branch: may also be asked for evidence of living inUK by31December2020"
  ],
  "exceptions": [],
  "crossReferences": [
    "C05",
    "S18 #if-youre-waiting-for-a-decision-on-your-application-for-settled-or-pre-settled-status",
    "S24 8.5 saved admission rights"
  ],
  "effectOnEtaRequirement": "A status/evidence qualifier; not a general pending=>permission conversion",
  "referenceTime": "Application validated and decision pending at travel",
  "evidenceQuality": "Direct official primary text; paraphrase, not accepted Evidence",
  "retrievedAt": "2026-10-05T11:56:41.092232Z",
  "responseSha256": "b27cb917b0b1bcbc853492be641771af1d1af622618a03a6fbfcdfd91793db33",
  "notes": "S18 says valid certificate and not joining-family in its ID-card paragraph then no ETA. For selected Swiss passport, do not import ID-card conditions as an exhaustive A rule. S24 includes saved rights for in-time pending applications or appeals not finally determined. Exact passport-travel coverage of late/appeal/joining cases remains unresolved, not false. S13 certificate itself explains permitted uses while pending; successful decision letter alone is not proof of status. S18 separately says a person only planning an EUSS application needs family permit, visa or eligible ETA, and cannot use ETA where sole entry purpose is to apply for EUSS; that is a B use restriction, not an exemption."
}
```

### C07 — ETA1.7

```json
{
  "evidenceId": "C07",
  "sourceId": "S1",
  "officialSourceUrl": "https://www.gov.uk/guidance/immigration-rules/immigration-rules-appendix-electronic-travel-authorisation",
  "clauseId": "ETA1.7",
  "sourceLocator": "Validity requirements / ETA1.7",
  "semanticSubject": "Person with BOTC OR BNO status",
  "semanticRelation": "does not require",
  "semanticObject": "ETA",
  "conditions": [
    "Person is British Overseas Territory Citizen OR British National (Overseas)"
  ],
  "exceptions": [],
  "crossReferences": [
    "S4 BOTC/BNO passport items",
    "S5 4.2 BOTC passport wording"
  ],
  "effectOnEtaRequirement": "A status exemption; passport/status reconciliation unresolved",
  "referenceTime": "Status at relevant travel",
  "evidenceQuality": "Primary rule direct; guidance breadth differs; UNRESOLVED for status holder on selected CH credential",
  "retrievedAt": "2026-10-05T11:53:29.336756Z",
  "responseSha256": "66128a951666671435796dcb682c0d1eda4cc8be1b5ae429b6943fcfe9c9614c",
  "notes": "S1 attaches effect to the PERSON/status; S4/S5 specify travelling on corresponding passport. Ordinary CH selected passport excludes that specific passport-use description, not logically the person-status rule. Current Jetnity keeps these statuses separately from ISO citizenship; [CH] alone is not a documented exclusion."
}
```

### C08 — 4.2: airside/landside

```json
{
  "evidenceId": "C08",
  "sourceId": "S5",
  "officialSourceUrl": "https://www.gov.uk/government/publications/electronic-travel-authorisation-caseworker-guidance/electronic-travel-authorisation-caseworker-guidance-accessible",
  "clauseId": "4.2: airside/landside",
  "sourceLocator": "Heading #who-does-not-need-an-eta",
  "semanticSubject": "ETA-eligible airside transit passenger",
  "semanticRelation": "temporarily exempt when",
  "semanticObject": "No UK border-control passage",
  "conditions": [
    "Airside transit"
  ],
  "exceptions": [
    "Landside border passage not within airside carveout"
  ],
  "crossReferences": [
    "S4 no-ETA list airport item"
  ],
  "effectOnEtaRequirement": "A exemption excluded by explicit destination-entry/non-transit scope",
  "referenceTime": "Transit at journey; temporary and reviewable",
  "evidenceQuality": "Direct official primary text; paraphrase, not accepted Evidence",
  "retrievedAt": "2026-10-05T11:55:30.393369Z",
  "responseSha256": "ecac20f1215924130fa49e3954b7e9de93b3c3c90fd45dd59c56c7f008d2b5a1",
  "notes": "Null transitCountryCode alone must not stand in for a positively established destination journey. A landside statement does not negate other exemptions."
}
```

### C09 — Exemption overview and digital records

```json
{
  "evidenceId": "C09",
  "sourceId": "S8",
  "officialSourceUrl": "https://www.gov.uk/guidance/entering-the-uk-exemptions-to-controls",
  "clauseId": "Exemption overview and digital records",
  "sourceLocator": "Opening; #apply-for-a-digital-record-of-exemption",
  "semanticSubject": "Person legally exempt from control OR qualifying exemption from entry permission",
  "semanticRelation": "does not need",
  "semanticObject": "ETA",
  "conditions": [
    "Actual qualifying legal status/activity",
    "Exemption continues for journey"
  ],
  "exceptions": [],
  "crossReferences": [
    "C10-C31",
    "S15 #proof-of-exemption"
  ],
  "effectOnEtaRequirement": "A umbrella route; ordinary passport does not exclude it",
  "referenceTime": "Current activity/status and journey",
  "evidenceQuality": "Direct official primary text; paraphrase, not accepted Evidence",
  "retrievedAt": "2026-10-05T11:55:23.385565Z",
  "responseSha256": "67369528d32248823cc522a447c88a82774e1cdb2bafe7cb509de93782240666",
  "notes": "Digital record optional, not a visa; physical record only usable while actual exempt status remains. Document type alone does not establish or defeat exemption. No record is not proof of no exemption."
}
```

### C10 — Persons posted to diplomatic missions

```json
{
  "evidenceId": "C10",
  "sourceId": "S15",
  "officialSourceUrl": "https://www.gov.uk/government/publications/exempt-exm/exemption-from-immigration-control-non-armed-forces-accessible",
  "clauseId": "Persons posted to diplomatic missions",
  "sourceLocator": "Headings #persons-posted-to-diplomatic-missions-in-the-uk through #members-of-service-staff-at-a-diplomatic-mission",
  "semanticSubject": "Person posted to UK diplomatic mission",
  "semanticRelation": "may be totally exempt under ANY",
  "semanticObject": "Diplomatic agent OR administrative/technical staff OR service staff",
  "conditions": [
    "Diplomatic agent performs diplomatic functions for government",
    "For admin/technical staff: duties support mission; resident outsideUK when offered; not physically inUK when offered; not ceased membership after taking post",
    "For service staff: same residence/presence/continuity conditions; domestic service of mission; employed/paid/posted by sending MFA"
  ],
  "exceptions": [
    "Private domestic employee of diplomat is not mission service staff",
    "Hairdressers not included in service-staff description"
  ],
  "crossReferences": [
    "C12-C15",
    "C09",
    "S15 private servants"
  ],
  "effectOnEtaRequirement": "A possible exemption; unsupported context",
  "referenceTime": "Role/posting now; location/residence at offer; continuous membership",
  "evidenceQuality": "Direct official primary text; paraphrase, not accepted Evidence",
  "retrievedAt": "2026-10-05T11:57:38.253524Z",
  "responseSha256": "fe89084f988e0bdcc8638d9383a58564f4649fb83ac9039b6aa9b5cce2e0b6fc",
  "notes": "Titles are examples, not closed qualifying enum; legitimacy doubts require DMIOU. Passport class does not resolve these conditions."
}
```

### C11 — Locally engaged staff; Representative offices

```json
{
  "evidenceId": "C11",
  "sourceId": "S15",
  "officialSourceUrl": "https://www.gov.uk/government/publications/exempt-exm/exemption-from-immigration-control-non-armed-forces-accessible",
  "clauseId": "Locally engaged staff; Representative offices",
  "sourceLocator": "#locally-engaged-staff-of-a-diplomatic-mission; #representative-offices; #what-is-a-representative-function",
  "semanticSubject": "Locally engaged mission staff OR qualifying Taipei office staff",
  "semanticRelation": "may be exempt under separate alternatives",
  "semanticObject": "Overseas recruitment / representative-function exemption",
  "conditions": [
    "Mission local staff: legitimate mission function AND recruited outsideUK without pre-existing UK immigration status; if recentUK non-visit time, establish overseas residence at recruitment",
    "Taipei: full-time representative role AND resident outsideUK AND not inUK when employment offered",
    "Taipei levels: Representative, Deputy Representative, Director General, Deputy Director General, Director, Deputy Director, Senior Assistant Director, Assistant Director"
  ],
  "exceptions": [
    "Mission staff recruited inUK not exempt by this route",
    "Taipei administrative/transport/maintenance/service/ancillary functions excluded"
  ],
  "crossReferences": [
    "C12-C15",
    "C09"
  ],
  "effectOnEtaRequirement": "A possible exemption; unsupported context",
  "referenceTime": "Recruitment/offer history and current role",
  "evidenceQuality": "Direct official primary text; paraphrase, not accepted Evidence",
  "retrievedAt": "2026-10-05T11:57:38.253524Z",
  "responseSha256": "fe89084f988e0bdcc8638d9383a58564f4649fb83ac9039b6aa9b5cce2e0b6fc",
  "notes": "Qualifying household family also potentially exempt. Neither Swiss nationality nor ordinary passport excludes these employment relationships."
}
```

### C12 — General definition of family members

```json
{
  "evidenceId": "C12",
  "sourceId": "S15",
  "officialSourceUrl": "https://www.gov.uk/government/publications/exempt-exm/exemption-from-immigration-control-non-armed-forces-accessible",
  "clauseId": "General definition of family members",
  "sourceLocator": "Headings #general-definition-of-family-members; #proof-of-exemption",
  "semanticSubject": "Qualifying relative of exempt principal",
  "semanticRelation": "may derive exemption if ALL",
  "semanticObject": "Qualifying relationship AND household membership",
  "conditions": [
    "Spouse OR civil partner OR dependent child under18",
    "Member of principal’s household",
    "Genuine dependent relationship, not independent life",
    "Principal/category itself qualifies"
  ],
  "exceptions": [],
  "crossReferences": [
    "C13-C15",
    "C10-C11",
    "C16-C19"
  ],
  "effectOnEtaRequirement": "A derivative exemption; not generic family membership",
  "referenceTime": "Current relationship/dependency/household; age as relevant",
  "evidenceQuality": "Direct official primary text; paraphrase, not accepted Evidence",
  "retrievedAt": "2026-10-05T11:57:38.253524Z",
  "responseSha256": "fe89084f988e0bdcc8638d9383a58564f4649fb83ac9039b6aa9b5cce2e0b6fc",
  "notes": "Guidance explicitly says general list not exhaustive. Additional branches below retain their own tests, not automatic inclusion or exclusion of everyone else."
}
```

### C13 — Overage dependants: children in education

```json
{
  "evidenceId": "C13",
  "sourceId": "S15",
  "officialSourceUrl": "https://www.gov.uk/government/publications/exempt-exm/exemption-from-immigration-control-non-armed-forces-accessible",
  "clauseId": "Overage dependants: children in education",
  "sourceLocator": "#overage-dependants-oads--children-in-education",
  "semanticSubject": "Dependent child of diplomat (also referenced consular/IO family)",
  "semanticRelation": "may qualify with ALL",
  "semanticObject": "Full-time UK education and dependency",
  "conditions": [
    "Over18 and before25th birthday",
    "Intend full-time study at licensed OR validly accredited UK institution",
    "Confirmed studies evidenced",
    "Not full-time employed",
    "Financially dependent on exempt parent",
    "Household member/resident with principal",
    "Adequate funds",
    "Intend complete studies before25"
  ],
  "exceptions": [],
  "crossReferences": [
    "C12",
    "S15 #other-family-members",
    "S15 #family-members-4"
  ],
  "effectOnEtaRequirement": "A derivative exemption; unsupported context",
  "referenceTime": "Current age/education/dependency; study end before25",
  "evidenceQuality": "Direct official primary text; paraphrase, not accepted Evidence",
  "retrievedAt": "2026-10-05T11:57:38.253524Z",
  "responseSha256": "fe89084f988e0bdcc8638d9383a58564f4649fb83ac9039b6aa9b5cce2e0b6fc",
  "notes": "Record duration is earliest of studies, principal posting, day before25; under18 record normally ends day before18 absent extended qualification. Record validity is not a substitute for actual status."
}
```

### C14 — Other OADs; unmarried partners

```json
{
  "evidenceId": "C14",
  "sourceId": "S15",
  "officialSourceUrl": "https://www.gov.uk/government/publications/exempt-exm/exemption-from-immigration-control-non-armed-forces-accessible",
  "clauseId": "Other OADs; unmarried partners",
  "sourceLocator": "#other-overage-dependants-oads; #unmarried-partners",
  "semanticSubject": "Other older dependant or unmarried partner",
  "semanticRelation": "may qualify only under",
  "semanticObject": "Exceptional case or reciprocal agreement",
  "conditions": [
    "OAD non-student, studies beyond25, or age>=25: exceptional/compassionate circumstances and referral to DMIOU",
    "OAD parent: exceptional/compassionate case required",
    "Unmarried partner exemption: applicable reciprocal agreement; sending state reciprocally recognises UK diplomatic partners"
  ],
  "exceptions": [
    "Other siblings/nephews/nieces/grandchildren do not qualify under stated general branch",
    "Non-reciprocal unmarried-partner concession grants leave, not exempt status"
  ],
  "crossReferences": [
    "C12-C13",
    "S15 #other-family-members",
    "S15 #family-members-4",
    "C02"
  ],
  "effectOnEtaRequirement": "A possible exemption OR alternative valid permission; unresolved closed-world coverage",
  "referenceTime": "Case determination; continuing relationship and posting",
  "evidenceQuality": "Direct official primary text; paraphrase, not accepted Evidence",
  "retrievedAt": "2026-10-05T11:57:38.253524Z",
  "responseSha256": "fe89084f988e0bdcc8638d9383a58564f4649fb83ac9039b6aa9b5cce2e0b6fc",
  "notes": "Non-reciprocal leave concession requires sending state recognise durability, akin-to-marriage relationship, intended UK cohabitation during posting; no usual2-year cohabitation prerequisite. Marriage/civil partnership during posting can change status. Reciprocal list/internal information not exposed; no absence inference."
}
```

### C15 — Polygamous marriages; Divorce; cessation

```json
{
  "evidenceId": "C15",
  "sourceId": "S15",
  "officialSourceUrl": "https://www.gov.uk/government/publications/exempt-exm/exemption-from-immigration-control-non-armed-forces-accessible",
  "clauseId": "Polygamous marriages; Divorce; cessation",
  "sourceLocator": "#polygamous-marriages; #divorce; #persons-who-cease-to-be-exempt",
  "semanticSubject": "Derivative exempt person",
  "semanticRelation": "loses/limits exemption by",
  "semanticObject": "Selected spouse, relationship end or role end",
  "conditions": [
    "Polygamy referred to DMIOU; only one selected spouse obtains this exemption",
    "Divorce ends household-family exemption",
    "Cessation of qualifying role ends exemption subject stated31-day period",
    "After cessation regime,90-day deemed leave may apply",
    "If continuing prior limited leave expires within90days after exemption ends, guidance treats expiry and conditions at end of90-day period",
    "If continuing prior limited leave lasts more than90days, ordinary leave procedures apply"
  ],
  "exceptions": [
    "31-day continuation ceases on departure fromUK during that period",
    "Subsequent deemed leave lapses on leavingCTA",
    "Other spouses need their own qualifying immigration route"
  ],
  "crossReferences": [
    "C09",
    "C12-C14",
    "S15 #cancelling-a-digital-record-of-exemption-or-exempt-vignette-where-an-individual-is-no-longer-exempt"
  ],
  "effectOnEtaRequirement": "A continuing status/permission route with temporal context gap",
  "referenceTime": "Relationship/role end;31-day and90-day events; departureUK/CTA",
  "evidenceQuality": "Direct official primary text; paraphrase, not accepted Evidence",
  "retrievedAt": "2026-10-05T11:57:38.253524Z",
  "responseSha256": "fe89084f988e0bdcc8638d9383a58564f4649fb83ac9039b6aa9b5cce2e0b6fc",
  "notes": "Do not reuse an unexpired record after underlying exemption ceases. Independent valid leave may still activate C02; loss of this exemption is not universal ETA-required proof."
}
```

### C16 — Consular officers and employees; local employees

```json
{
  "evidenceId": "C16",
  "sourceId": "S15",
  "officialSourceUrl": "https://www.gov.uk/government/publications/exempt-exm/exemption-from-immigration-control-non-armed-forces-accessible",
  "clauseId": "Consular officers and employees; local employees",
  "sourceLocator": "#consular-officers-and-employees-based-in-the-uk through #other-family-members; #locally-employed-staff-of-a-consulate",
  "semanticSubject": "UK-posted consular officer OR employee",
  "semanticRelation": "may be exempt under",
  "semanticObject": "Consular role category",
  "conditions": [
    "Officer performs consular functions",
    "Employee: administrative/technical duties AND full-time service of state AND no private UK occupation for gain",
    "Employee resident outsideUK AND not inUK when offered AND not ceased mission membership",
    "Local staff: legitimate consular function and not recruited inUK; where recent time inUK exists, establish overseas residence at recruitment (this paragraph does not repeat the diplomatic paragraph’s visitor exception)",
    "Qualifying household relatives and C13-C15 extensions considered"
  ],
  "exceptions": [
    "Honorary consuls not exempt by role",
    "Consular service staff not exempt by role",
    "UK-recruited local staff not exempt by this route"
  ],
  "crossReferences": [
    "C09",
    "C12-C15"
  ],
  "effectOnEtaRequirement": "A possible exemption; unsupported context",
  "referenceTime": "Role/continuity and recruitment/offer history",
  "evidenceQuality": "Direct official primary text; paraphrase, not accepted Evidence",
  "retrievedAt": "2026-10-05T11:57:38.253524Z",
  "responseSha256": "fe89084f988e0bdcc8638d9383a58564f4649fb83ac9039b6aa9b5cce2e0b6fc",
  "notes": "No collapse with diplomatic mission service staff: consular service staff expressly differ."
}
```

### C17 — Sovereigns and Heads of State; private servants

```json
{
  "evidenceId": "C17",
  "sourceId": "S15",
  "officialSourceUrl": "https://www.gov.uk/government/publications/exempt-exm/exemption-from-immigration-control-non-armed-forces-accessible",
  "clauseId": "Sovereigns and Heads of State; private servants",
  "sourceLocator": "#sovereigns-and-heads-of-state; #official-state-visits; #family-members-3; #former-heads-of-state; #heads-of-ex-reigning-houses",
  "semanticSubject": "UK-recognised sovereign/head of state, qualifying household family or private servant",
  "semanticRelation": "may be totally exempt",
  "semanticObject": "Status/household or domestic service",
  "conditions": [
    "UK-recognised sovereign/head of state",
    "Family: qualifying dependent household, not independent life",
    "Private servant: not employed by sending state AND personal domestic duties necessary for principal welfare/household duringUK visit",
    "Ex-reigning house head: personae gratae may qualify, refer DMIOU"
  ],
  "exceptions": [
    "Secretary of State contrary direction",
    "Former head/family/servant not exempt unless another category qualifies",
    "Journalist/businessperson delegation membership not exempt",
    "Protection officers not exempt by that role",
    "Other private employees without required welfare/household function excluded"
  ],
  "crossReferences": [
    "C09",
    "C12",
    "S15 State Immunity Act1978 s20(3) reference"
  ],
  "effectOnEtaRequirement": "A possible exemption; context/official determination gap",
  "referenceTime": "Current recognised office, visit duties and applicable direction",
  "evidenceQuality": "Direct official primary text; paraphrase, not accepted Evidence",
  "retrievedAt": "2026-10-05T11:57:38.253524Z",
  "responseSha256": "fe89084f988e0bdcc8638d9383a58564f4649fb83ac9039b6aa9b5cce2e0b6fc",
  "notes": "Qualifying family official visit without principal requires case discussion; do not assume head-of-state category impossible from ordinary CH passport. Non-exempt official delegations have separate visa routes, not inherited exemption."
}
```

### C18 — Members of governments

```json
{
  "evidenceId": "C18",
  "sourceId": "S15",
  "officialSourceUrl": "https://www.gov.uk/government/publications/exempt-exm/exemption-from-immigration-control-non-armed-forces-accessible",
  "clauseId": "Members of governments",
  "sourceLocator": "#members-of-governments",
  "semanticSubject": "Serving government minister of UK-recognised state",
  "semanticRelation": "partially exempt with ALL",
  "semanticObject": "Official government business inUK",
  "conditions": [
    "Currently holds ministerial office",
    "UK-recognised state",
    "Travel on official business of own government",
    "Deputy/vice qualifies only if minister in own right",
    "Family: qualifying household AND accompanies minister on official visit"
  ],
  "exceptions": [
    "Secretary of State contrary direction",
    "Private travel of minister/family not exempt by route",
    "Deputising non-minister, official/businessperson not exempt by role"
  ],
  "crossReferences": [
    "C09",
    "C12",
    "Immigration (Exemption from Control) Order1972 Art4(a) cited by source"
  ],
  "effectOnEtaRequirement": "A possible exemption; unsupported context",
  "referenceTime": "Ministerial role at travel; official visit",
  "evidenceQuality": "Direct official primary text; paraphrase, not accepted Evidence",
  "retrievedAt": "2026-10-05T11:57:38.253524Z",
  "responseSha256": "fe89084f988e0bdcc8638d9383a58564f4649fb83ac9039b6aa9b5cce2e0b6fc",
  "notes": "Partial exemption retains deportation provisions. No name/office-holder research or traveller assessment done."
}
```

### C19 — International conferences

```json
{
  "evidenceId": "C19",
  "sourceId": "S15",
  "officialSourceUrl": "https://www.gov.uk/government/publications/exempt-exm/exemption-from-immigration-control-non-armed-forces-accessible",
  "clauseId": "International conferences",
  "sourceLocator": "#persons-attending-an-international-conference",
  "semanticSubject": "Government representative including expert/adviser OR official staff",
  "semanticRelation": "may be partially exempt if ALL",
  "semanticObject": "Conference-specific agreement/legislation",
  "conditions": [
    "Particular conference inUK",
    "UK representatives AND representatives of sovereign power attend",
    "Exemption agreed AND legislated before conference begins",
    "Individual within covered representative/official category"
  ],
  "exceptions": [],
  "crossReferences": [
    "C09",
    "Conference order or existing IO arrangements referenced by S15"
  ],
  "effectOnEtaRequirement": "A possible exemption; exact coverage unresolved",
  "referenceTime": "Agreement/legislation before conference; covered attendance",
  "evidenceQuality": "Direct official primary text; paraphrase, not accepted Evidence",
  "retrievedAt": "2026-10-05T11:57:38.253524Z",
  "responseSha256": "fe89084f988e0bdcc8638d9383a58564f4649fb83ac9039b6aa9b5cce2e0b6fc",
  "notes": "Separate order may be needed; some IO conferences use existing arrangements. Public overview does not enumerate all orders/cases; conference label alone cannot be true or false for exemption."
}
```

### C20 — Employees of international organisations; documentation

```json
{
  "evidenceId": "C20",
  "sourceId": "S15",
  "officialSourceUrl": "https://www.gov.uk/government/publications/exempt-exm/exemption-from-immigration-control-non-armed-forces-accessible",
  "clauseId": "Employees of international organisations; documentation",
  "sourceLocator": "#employees-of-international-organisations; #documentation",
  "semanticSubject": "IO-associated person and possibly family",
  "semanticRelation": "qualify only to extent covered by",
  "semanticObject": "Specific UK agreement/implementing legislation",
  "conditions": [
    "Actual agreement determines covered persons, privileges and scope",
    "Individual meets that agreement",
    "IO documentation explains legal basis; subject to official challenge/DMIOU input",
    "Organisation list expressly may not be exhaustive"
  ],
  "exceptions": [],
  "crossReferences": [
    "S19 list+footnotes",
    "C21",
    "C22",
    "C09"
  ],
  "effectOnEtaRequirement": "A possible exemption; finite complete coverage NOT proved",
  "referenceTime": "Applicable agreement and role at travel",
  "evidenceQuality": "Direct official primary text; paraphrase, not accepted Evidence",
  "retrievedAt": "2026-10-05T11:57:38.253524Z",
  "responseSha256": "fe89084f988e0bdcc8638d9383a58564f4649fb83ac9039b6aa9b5cce2e0b6fc",
  "notes": "An organisation absent from the list is referred to DMIOU, not treated as ineligible. The audit did not retrieve each treaty/order or obtain case-specific confirmation, and does not turn those gaps into false."
}
```

### C21 — Long-term postings; short-term visits; short-term employment

```json
{
  "evidenceId": "C21",
  "sourceId": "S15",
  "officialSourceUrl": "https://www.gov.uk/government/publications/exempt-exm/exemption-from-immigration-control-non-armed-forces-accessible",
  "clauseId": "Long-term postings; short-term visits; short-term employment",
  "sourceLocator": "#long-term-postings through #short-term-employment",
  "semanticSubject": "Covered IO staff/intern/contractor/representative or family",
  "semanticRelation": "requires route-specific",
  "semanticObject": "Agreement and capacity",
  "conditions": [
    "Long-term UK posting: recruited overseas and qualifies under agreement",
    "Short-term overseas-based officials: official capacity and official IO business",
    "Sending-state government representative: possible IO-derived status, DMIOU confirmation",
    "EBRD/Commonwealth Secretariat internships expressly capable of exemption if qualified",
    "Other IO interns or expert/specialist contractors referred for agreement check",
    "Long-term household family generally C12-C15 subject agreement",
    "Short-term family not usually exempt, check exact agreement"
  ],
  "exceptions": [
    "Private capacity outside covered official role not exempt by this route"
  ],
  "crossReferences": [
    "C20",
    "S19"
  ],
  "effectOnEtaRequirement": "A possible exemption; agreement/context gap",
  "referenceTime": "Posting or official visit, contract period",
  "evidenceQuality": "Direct official primary text; paraphrase, not accepted Evidence",
  "retrievedAt": "2026-10-05T11:57:38.253524Z",
  "responseSha256": "fe89084f988e0bdcc8638d9383a58564f4649fb83ac9039b6aa9b5cce2e0b6fc",
  "notes": "Recommendations about digital-record duration (posting/5years; visit; repeated visits up to2years) do not define universal status duration. Do not translate usually not into never."
}
```

### C22 — Organisation groups and footnotes

```json
{
  "evidenceId": "C22",
  "sourceId": "S19",
  "officialSourceUrl": "https://www.gov.uk/government/publications/exempt-exm/list-of-international-organisations-whose-employees-qualify-for-exempt-entry-clearances-accessible-version",
  "clauseId": "Organisation groups and footnotes",
  "sourceLocator": "List as of7January2026; UK-based/non-UK lists; #fn:1 and #fn:2",
  "semanticSubject": "Employees/representatives of listed organisations",
  "semanticRelation": "are limited by",
  "semanticObject": "Role-specific eligibility and underlying agreements",
  "conditions": [
    "UN specialised-agency footnote: only certain senior officials",
    "NATO footnote: only member-state representatives OR certain NATO officials; no blanket employee exemption",
    "Follow actual agreement for exact covered classes"
  ],
  "exceptions": [],
  "crossReferences": [
    "C20-C21",
    "S15 non-exhaustive list warning"
  ],
  "effectOnEtaRequirement": "A coverage cross-reference; list not standalone closed exemption enum",
  "referenceTime": "List body as of2026-01-07; page updated2026-06-30",
  "evidenceQuality": "Direct official primary text; paraphrase, not accepted Evidence",
  "retrievedAt": "2026-10-05T12:00:04.738201Z",
  "responseSha256": "217bb6244a39a871ab446f1e3ad18ea62604567796df749fc72de0eb41b40c2e",
  "notes": "Do not equate any employment at a listed IO with exemption. The complete list bytes were fetched; organisation-by-organisation legal terms remain unverified, so no residual-safe claim."
}
```

### C23 — The European Union

```json
{
  "evidenceId": "C23",
  "sourceId": "S15",
  "officialSourceUrl": "https://www.gov.uk/government/publications/exempt-exm/exemption-from-immigration-control-non-armed-forces-accessible",
  "clauseId": "The European Union",
  "sourceLocator": "#the-european-union",
  "semanticSubject": "Specified EU officeholder and household family",
  "semanticRelation": "have exemption described for",
  "semanticObject": "Commission President; European Council President; High Representative for Foreign Affairs and Security Policy",
  "conditions": [
    "Holder of one of the three specified offices",
    "Qualifying family forms part of household"
  ],
  "exceptions": [],
  "crossReferences": [
    "C12",
    "C20",
    "C09"
  ],
  "effectOnEtaRequirement": "A possible narrow office route; not all EU personnel",
  "referenceTime": "Official or private capacity as source states",
  "evidenceQuality": "Direct official primary text; paraphrase, not accepted Evidence",
  "retrievedAt": "2026-10-05T11:57:38.253524Z",
  "responseSha256": "fe89084f988e0bdcc8638d9383a58564f4649fb83ac9039b6aa9b5cce2e0b6fc",
  "notes": "No assumption about a Swiss citizen’s eligibility for offices; complete cell does not carry audited exclusion facts. All other EU/IO personnel need their applicable agreement/role analysis."
}
```

### C24 — Who is exempt; verification of status

```json
{
  "evidenceId": "C24",
  "sourceId": "S21",
  "officialSourceUrl": "https://www.gov.uk/government/publications/appendix-hm-armed-forces-caseworker-guidance/appendix-hm-armed-forces-caseworker-guidance-accessible",
  "clauseId": "Who is exempt; verification of status",
  "sourceLocator": "#who-is-exempt-from-immigration-control; #verification-of-status",
  "semanticSubject": "HM Forces regular OR reserve member",
  "semanticRelation": "is exempt during",
  "semanticObject": "Service-law condition",
  "conditions": [
    "Full-time regular member subject to service law; regulars always subject while enlisted",
    "OR reserve member deployed/due deployed, only while subject to service law"
  ],
  "exceptions": [
    "Reservist not eligible under Appendix HM Armed Forces is an application-route statement, not revocation of service-law exemption"
  ],
  "crossReferences": [
    "S8 armed forces bullets1-2",
    "C09"
  ],
  "effectOnEtaRequirement": "A possible exemption; unsupported role/time context",
  "referenceTime": "Enlistment/deployment and service-law period",
  "evidenceQuality": "Direct official primary text; paraphrase, not accepted Evidence",
  "retrievedAt": "2026-10-05T12:05:43.684969Z",
  "responseSha256": "c66b36cbeaa33a1057462257a7ab2a051efb1feb635a5e15971c5d94c537856f",
  "notes": "HM service ID, exempt vignette or digital record proves status; record optional. Border refusal exception for deportation retained. Family members are described as seeking permission, not automatically exempt."
}
```

### C25 — Who is exempt from immigration control

```json
{
  "evidenceId": "C25",
  "sourceId": "S22",
  "officialSourceUrl": "https://www.gov.uk/government/publications/appendix-international-forces-caseworker-guidance/appendix-international-forces-caseworker-guidance-accessible--2",
  "clauseId": "Who is exempt from immigration control",
  "sourceLocator": "#who-is-exempt-from-immigration-control; #visiting-forces-act-vfa",
  "semanticSubject": "International force member",
  "semanticRelation": "may be exempt under ANY",
  "semanticObject": "Training, visiting force, international headquarters/defence organisation",
  "conditions": [
    "Commonwealth/colony/protectorate/protected-state force AND undergoing/about to undergo UK training WITH home-force body/contingent/detachment incl relevant NATO forces",
    "OR serving/posted inUK with force covered by Visiting Forces Act or added Order in Council",
    "OR serving/posted member of international headquarters/defence organisation designated by Order in Council incl relevant NATO forces",
    "Partnership for Peace/NATO SOFA arrangements also referenced"
  ],
  "exceptions": [
    "VFA group civilian personnel not exempt merely by travelling with force",
    "Dependants not automatically covered; need entry clearance where applicable"
  ],
  "crossReferences": [
    "S8 armed forces bullets3-5",
    "C09",
    "S22 VFA/Orders/PfP lists"
  ],
  "effectOnEtaRequirement": "A possible exemption; agreement and context gap",
  "referenceTime": "Current service/posting; entitlement continues during covered role incl foreign holiday travel, ends with role",
  "evidenceQuality": "Direct official primary text; paraphrase, not accepted Evidence",
  "retrievedAt": "2026-10-05T12:05:44.072592Z",
  "responseSha256": "2edac4f91118d3026aa8bffc272cc873a99b7919aa8092086e17e106304459db",
  "notes": "Swiss passport/citizenship is not evidence of force membership or non-membership. Lists of countries concern forces/agreements; no nationality shortcut. Public guidance and underlying Orders are not a fully validated status engine."
}
```

### C26 — Exempt from obtaining permission to enter

```json
{
  "evidenceId": "C26",
  "sourceId": "S8",
  "officialSourceUrl": "https://www.gov.uk/guidance/entering-the-uk-exemptions-to-controls",
  "clauseId": "Exempt from obtaining permission to enter",
  "sourceLocator": "#check-if-youre-exempt-from-obtaining-permission-to-enter",
  "semanticSubject": "Operating crew member",
  "semanticRelation": "does not need entry permission or ETA if ALL",
  "semanticObject": "Arrival as crew AND engaged departure as crew",
  "conditions": [
    "Ship OR through/shuttle train OR aircraft",
    "Actually employed working/service of conveyance incl captain",
    "Arrives as crew",
    "Engaged to leave as crew on same conveyance; air/train may use another if scheduled leave<=7days"
  ],
  "exceptions": [
    "Deportation order",
    "Previous refusal of UK entry with no subsequent entry permission",
    "Required examination under Schedule2 Immigration Act1971",
    "Offshore worker"
  ],
  "crossReferences": [
    "C27-C31",
    "S16 CRM02",
    "S17 CRM01"
  ],
  "effectOnEtaRequirement": "A no-ETA route; role/journey/exception context needed",
  "referenceTime": "Arrival engagement and scheduled departure interval",
  "evidenceQuality": "Direct official primary text; paraphrase, not accepted Evidence",
  "retrievedAt": "2026-10-05T11:55:23.385565Z",
  "responseSha256": "67369528d32248823cc522a447c88a82774e1cdb2bafe7cb509de93782240666",
  "notes": "No documents or occupation assumed from passport. S17 additional statutory restriction not reconciled in C28, so this row is not a complete permission-exemption engine."
}
```

### C27 — CRM2.1-CRM2.4

```json
{
  "evidenceId": "C27",
  "sourceId": "S16",
  "officialSourceUrl": "https://www.gov.uk/government/publications/aircrew-crm02/aircrew-crm02",
  "clauseId": "CRM2.1-CRM2.4",
  "sourceLocator": "#crm21-legislation-and-aircrew; #crm22-identity-documents-and-aircrew; #crm23-aircrew-arriving-as-a-crew-member-of-an-aircraft; #crm24-when-do-aircrew-need-entry-clearance",
  "semanticSubject": "Aircrew invoking crew permission exemption",
  "semanticRelation": "must satisfy role/document/journey tests",
  "semanticObject": "Operating/service crew and departure within7days",
  "conditions": [
    "CRM2.2: valid passport AND (pilot licence OR crew-member certificate)",
    "All documents contain holder description, nationality and photograph",
    "CRM2.3: arrives as aircraft crew; engaged to leave within7days on same OR another aircraft; source additionally says or until the aircraft departs",
    "CRM2.4 prior-entry-clearance branch: operating crew including stewards/stewardesses; licences OR valid crew certificates AND passports",
    "CRM2.4: departs as crew on same aircraft FROM SAME ARRIVAL AIRPORT OR within7days on another aircraft"
  ],
  "exceptions": [
    "Deportation order in force",
    "Prior leave-to-enter refusal without subsequent leave to enter OR remain",
    "Officer requires examination under Schedule2 paragraph13(1)",
    "Security guards, training crew, loadmasters, engineers and other non-operating crew not accepted under operating-crew branch",
    "Crew intending stay>7days need entry clearance; extending after entry requires application for leave"
  ],
  "crossReferences": [
    "C26",
    "C30"
  ],
  "effectOnEtaRequirement": "Evidence and crew context; current ETA effect supplied by S8",
  "referenceTime": "Crew arrival/departure; document validity",
  "evidenceQuality": "Direct older primary guidance with modern S8; temporal and exception wording differences UNRESOLVED",
  "retrievedAt": "2026-10-05T11:57:38.183794Z",
  "responseSha256": "4e9de6b8c6efbc0d4a3a870ad5fa9f192aaaf20ea091c1992b563d1cdf54a9c0",
  "notes": "Older aircrew guidance is not treated as standalone modern ETA authority. Deadheading carveout C30 is distinct from operating-crew definition. Retain CRM2.3 parenthetical until-aircraft-departs and CRM2.4 same-airport qualifier separately; do not compress to a universal seven-day rule or harmonise with S8 silently. Prior refusal cure also says enter OR remain in S16/S17, versus enter in S8. Ground-staff employment/visa rules are not separate ETA exemptions."
}
```

### C28 — CRM1: crew exemptions and exceptions

```json
{
  "evidenceId": "C28",
  "sourceId": "S17",
  "officialSourceUrl": "https://www.gov.uk/government/publications/seafarers-crm01/seafarers-crm01",
  "clauseId": "CRM1: crew exemptions and exceptions",
  "sourceLocator": "#seafarers; #ilo-identity-documents; #seafarers-joining-ships-in-the-uk-where-the-ilo-1958-convention-applies; #seafarers-arriving-by-ships-in-the-united-kingdom",
  "semanticSubject": "Seafarer",
  "semanticRelation": "requires statutory and documentary distinctions",
  "semanticObject": "Crew route / ILO route",
  "conditions": [
    "Arrival as member of ship crew atUK port AND intention to leave under engagement WITH THAT SHIP",
    "Ship includes hovercraft; port includes hoverport; crew means actually employed onship; security guards excluded",
    "Join/change-ship identity branch: valid passport OR SID with photograph, signature OR fingerprints, holder description and nationality",
    "ILO108 joining-entry-clearance branch: travelling under contract, qualifying convention-issued document states convention; document holder need not have issuing-country nationality and may be stateless",
    "S17 describes UK not ratifyingILO185 but continuing to waive joining-ship entry clearance for listed formerILO108/ILO185 issuing-country documents; this is visa/entry-clearance wording, not standalone ETA effect"
  ],
  "exceptions": [
    "Deportation order in force",
    "Previously refused leave to enter without subsequent leave to enter OR remain",
    "Has EVER met all four IMA2023 section2 conditions, reading subsection3 as UK entry/arrival described in subsection2 on/after7March2023",
    "Officer requires examination under Schedule2 paragraph13(1)(a) of1971 Act",
    "Offshore worker within1971 Act11A(1)"
  ],
  "crossReferences": [
    "C26",
    "C29",
    "S8",
    "IMA2023 section2(2)-(3): uninspected operative statutory cross-reference, explicit unresolved coverage gap",
    "Immigration Act1971 s8(1),s11A(1),Schedule2 paragraph13(1)(a) as cited by guidance"
  ],
  "effectOnEtaRequirement": "A crew coverage unresolved; no inferred harmonisation",
  "referenceTime": "Journey and statutory dates",
  "evidenceQuality": "Direct official guidance; current restriction reconciliation UNRESOLVED",
  "retrievedAt": "2026-10-05T11:57:38.210269Z",
  "responseSha256": "394f47c6857e710d35bfa899ce859c8686295f9b11f220666390f7303b7903e9",
  "notes": "The added restriction is recorded as an unreconciled guidance difference, not a conclusion about commencement, repeal or current legal effect. Official current operative legislation/guidance reconciliation needed. A CH traveller may carry another state’s ILO book; CH omission from issuer list is not exclusion. The four statutory tests are referred to, not reproduced by S17; their unverified current operative content is explicitly an open cross-reference, not claimed clause-complete law. Refusal cure also differs in scope from S8. No closure of this route is claimed."
}
```

### C29 — Other arrangements: Seafarers; Ferry crew

```json
{
  "evidenceId": "C29",
  "sourceId": "S8",
  "officialSourceUrl": "https://www.gov.uk/guidance/entering-the-uk-exemptions-to-controls",
  "clauseId": "Other arrangements: Seafarers; Ferry crew",
  "sourceLocator": "#seafarers; #ferry-crew",
  "semanticSubject": "ETA-national working seafarer/ferry crew",
  "semanticRelation": "does not need ETA in ANY listed branch",
  "semanticObject": "Crew arrival/departure, joining or repatriation",
  "conditions": [
    "Seafarer arriving AND leaving as crew",
    "OR ILO book holder arriving as crew to join ship leavingUK waters",
    "OR seafarer repatriating",
    "Joining ship via air/sea: documented contract to join as crew of vessel inUK waters leavingUK waters; normally employment contract",
    "Ferry: arriving by ship and operating crew in AND out",
    "OR arriving to join ferry leavingUK waters"
  ],
  "exceptions": [
    "Coming for permitted Visitor activity does not obtain this occupational exemption"
  ],
  "crossReferences": [
    "C26",
    "C28"
  ],
  "effectOnEtaRequirement": "A separate express practical no-ETA routes; unsupported context",
  "referenceTime": "Working journey and departure/repatriation",
  "evidenceQuality": "Direct official primary text; paraphrase, not accepted Evidence",
  "retrievedAt": "2026-10-05T11:55:23.385565Z",
  "responseSha256": "67369528d32248823cc522a447c88a82774e1cdb2bafe7cb509de93782240666",
  "notes": "These are alternatives, not one merged AND condition. Failure of a crew branch does not negate unrelated permissions/residence/school/status exemptions."
}
```

### C30 — Other arrangements: Airline crew

```json
{
  "evidenceId": "C30",
  "sourceId": "S8",
  "officialSourceUrl": "https://www.gov.uk/guidance/entering-the-uk-exemptions-to-controls",
  "clauseId": "Other arrangements: Airline crew",
  "sourceLocator": "#airline-crew",
  "semanticSubject": "ETA-national working aircrew",
  "semanticRelation": "does not need ETA when ALL",
  "semanticObject": "Deadheading OR positioning AND leavingUK",
  "conditions": [
    "Working aircrew",
    "Deadheading OR positioning",
    "LeavingUK"
  ],
  "exceptions": [
    "Visitor permitted-activity trip does not obtain this occupational exemption"
  ],
  "crossReferences": [
    "C26",
    "C27"
  ],
  "effectOnEtaRequirement": "A practical no-ETA route; unsupported context",
  "referenceTime": "Purpose and journey",
  "evidenceQuality": "Direct official primary text; paraphrase, not accepted Evidence",
  "retrievedAt": "2026-10-05T11:55:23.385565Z",
  "responseSha256": "67369528d32248823cc522a447c88a82774e1cdb2bafe7cb509de93782240666",
  "notes": "Do not impose the operating-crew arrival test of C26 on this separately named positioning route without source support."
}
```

### C31 — Other arrangements: International rail crew

```json
{
  "evidenceId": "C31",
  "sourceId": "S8",
  "officialSourceUrl": "https://www.gov.uk/guidance/entering-the-uk-exemptions-to-controls",
  "clauseId": "Other arrangements: International rail crew",
  "sourceLocator": "#international-rail-crew",
  "semanticSubject": "ETA-national through/shuttle train crew",
  "semanticRelation": "does not need ETA if ANY",
  "semanticObject": "Control-area-only OR scheduled departure<=7days",
  "conditions": [
    "Crew of through OR shuttle train",
    "Either does not leave embarking/disembarking passenger control area",
    "OR scheduled to leaveUK within7days"
  ],
  "exceptions": [
    "Visitor permitted-activity trip does not obtain this occupational exemption"
  ],
  "crossReferences": [
    "C26"
  ],
  "effectOnEtaRequirement": "A practical no-ETA route; unsupported context",
  "referenceTime": "Location of crew activity and departure schedule",
  "evidenceQuality": "Direct official primary text; paraphrase, not accepted Evidence",
  "retrievedAt": "2026-10-05T11:55:23.385565Z",
  "responseSha256": "67369528d32248823cc522a447c88a82774e1cdb2bafe7cb509de93782240666",
  "notes": "An airport-airside exclusion does not automatically exclude a rail-control-area route; actual destination-entry scope must be checked against each factual branch."
}
```

### C32 — Recognition of Crown Dependency ETA

```json
{
  "evidenceId": "C32",
  "sourceId": "S24",
  "officialSourceUrl": "https://www.gov.uk/government/publications/common-travel-area/common-travel-area-accessible",
  "clauseId": "Recognition of Crown Dependency ETA",
  "sourceLocator": "#recognition-of-crown-dependency-issued-eta-for-travel-to-the-uk",
  "semanticSubject": "Holder of valid Jersey/Guernsey/Isle-of-Man ETA",
  "semanticRelation": "may use it to travel toUK",
  "semanticObject": "Mutual ETA recognition",
  "conditions": [
    "Valid Crown Dependency ETA",
    "UK travel",
    "CD schemes opened9April2026; required for CD travel from23April2026"
  ],
  "exceptions": [],
  "crossReferences": [
    "Immigration (Electronic Travel Authorisations and the Islands) Regulations2026 cited by S24",
    "B04"
  ],
  "effectOnEtaRequirement": "B use/satisfaction, not an A no-ETA exemption",
  "referenceTime": "Validity at travel; source scheme dates retained",
  "evidenceQuality": "Direct official primary text; paraphrase, not accepted Evidence",
  "retrievedAt": "2026-10-05T12:06:55.109156Z",
  "responseSha256": "838efd989b1e061f1ef3b6e725f8a048ef68cd62ff4ac0b9ccd71f159b57ed46",
  "notes": "Distinct CD schemes. Advice apply where spending majority time does not imply an ETA is unnecessary. No implementation or separate UK application demanded by this audit."
}
```

### C33 — Deemed leave and saved admission rights

```json
{
  "evidenceId": "C33",
  "sourceId": "S24",
  "officialSourceUrl": "https://www.gov.uk/government/publications/common-travel-area/common-travel-area-accessible",
  "clauseId": "Deemed leave and saved admission rights",
  "sourceLocator": "8.5 #exemptions-from-deemed-leave-on-the-basis-of-specific-status; #deemed-leave-under-article-4; #deemed-leave-under-article-5-for-s2-healthcare",
  "semanticSubject": "Person arriving via Ireland",
  "semanticRelation": "may possess admission rights or acquire",
  "semanticObject": "Deemed leave / protected-status admission",
  "conditions": [
    "Ordinary deemed leave: arrives Ireland from outsideCTA then directUK OR limited UK leave valid when departed toIreland but expired there then directUK",
    "Separate status routes: right of abode; existing permission; entry clearance; exemptcontrol; EUSS status; saved admission for in-time pending EUSS/appeal; frontier worker",
    "S2 Article5: valid S2 certificate at UK entry, authorisation requested before23:00GMT31Dec2020; accompanying/support person evidence;6months prohibition of employment for reward"
  ],
  "exceptions": [],
  "crossReferences": [
    "I12",
    "S20 permission-to-enter sections",
    "S1 ETA1.1(f)(iii)",
    "C34-C35"
  ],
  "effectOnEtaRequirement": "Coverage distinction; general deemed leave is NOT established as no-ETA",
  "referenceTime": "Permission may arise at entry; not assumed valid before travel",
  "evidenceQuality": "Direct official primary text; paraphrase, not accepted Evidence",
  "retrievedAt": "2026-10-05T12:06:55.109156Z",
  "responseSha256": "838efd989b1e061f1ef3b6e725f8a048ef68cd62ff4ac0b9ccd71f159b57ed46",
  "notes": "S24 explicitly retains ETA on CTA routes. Do not derive an A exemption from generic automatic permission at entry or application-category failure; frontier/S2 protected rights need their own ETA mapping."
}
```

### C34 — Overview; What permit allows; Family members

```json
{
  "evidenceId": "C34",
  "sourceId": "S25",
  "officialSourceUrl": "https://www.gov.uk/frontier-worker-permit",
  "clauseId": "Overview; What permit allows; Family members",
  "sourceLocator": "#guide-contents; #what-the-permit-allows-you-to-do; #family-members",
  "semanticSubject": "Qualifying frontier worker",
  "semanticRelation": "may enter as frontier worker with",
  "semanticObject": "Frontier Worker permit",
  "conditions": [
    "EU/EEA/Swiss cohort",
    "Lives outsideUK",
    "Began UK work by31Dec2020",
    "Usually worked at least once every12months; unemployment/inability exceptions referenced",
    "Permit permits entry in frontier-worker capacity"
  ],
  "exceptions": [
    "Family not covered by principal permit"
  ],
  "crossReferences": [
    "S24 8.5 frontier-worker saved status",
    "S4 permission-to-work item"
  ],
  "effectOnEtaRequirement": "A candidate statutory-status route; exact ETA/context mapping unresolved",
  "referenceTime": "Current permit/status and historic work criteria",
  "evidenceQuality": "Direct official primary text; paraphrase, not accepted Evidence",
  "retrievedAt": "2026-10-05T12:07:25.507784Z",
  "responseSha256": "0f6b9da9a1f6dd27e5c5b55b732ebcaa2a78fdce3a99866870f56ab363e2e540",
  "notes": "This overview is not a complete retained-worker eligibility audit and does not expressly define ETA effect. Do not force this statutory right into generic residencePermit or conclude required from absent explicit ETA wording."
}
```

### C35 — Overview; eligibility; information

```json
{
  "evidenceId": "C35",
  "sourceId": "S26",
  "officialSourceUrl": "https://www.gov.uk/guidance/enter-the-uk-as-an-s2-healthcare-visitor",
  "clauseId": "Overview; eligibility; information",
  "sourceLocator": "Sections #overview, #patient, #accompanying-or-joining-a-patient, #children, #information",
  "semanticSubject": "S2 patient OR accompanying/joining supporter",
  "semanticRelation": "may enter as S2 Healthcare Visitor if",
  "semanticObject": "Pre-transition-authorised treatment route",
  "conditions": [
    "Patient: requested by31Dec2020; home-state approved; UK facility agreed; S2 certificate",
    "OR accompanying/joining care/support person residentEEA/CH with qualifying patient",
    "Under18: suitable travel/stay arrangements, parent/guardian consent, sufficient support funds",
    "Swiss/nonvisa nationals:6month permission on each arrival if eligible",
    "Evidence: current passport/travel document; funds for stay/return; patient certificate OR supporter patient-status/certificate+biopage and residence proof",
    "Child travelling without parent/guardian: consent and living/care arrangements"
  ],
  "exceptions": [],
  "crossReferences": [
    "C33",
    "S1 ETA1.1(f)(iii)",
    "S24 Article5"
  ],
  "effectOnEtaRequirement": "A coverage question unresolved; visa-free and B exclusions are not automatically no-ETA",
  "referenceTime": "Authorisation cutoff; current certificate/eligibility; permission at entry",
  "evidenceQuality": "Direct official primary text; paraphrase, not accepted Evidence",
  "retrievedAt": "2026-10-05T12:07:25.801317Z",
  "responseSha256": "3c7b38558358356fa8eb1052ca8c8b8dc612d1d5b05a1ec3c7858d83331e98fa",
  "notes": "Fresh page states no visa and permission on arrival but not an explicit exhaustive ETA rule. Exact ETA treatment for each S2 arrival mode requires official clarification; no unsupported no-ETA or required result assigned."
}
```

### C36 — Negative-role boundaries; dual postings

```json
{
  "evidenceId": "C36",
  "sourceId": "S15",
  "officialSourceUrl": "https://www.gov.uk/government/publications/exempt-exm/exemption-from-immigration-control-non-armed-forces-accessible",
  "clauseId": "Negative-role boundaries; dual postings",
  "sourceLocator": "#members-of-diplomatic-missions-or-consulates-based-overseas-not-in-the-uk; #diplomatic-couriers; #officials-of-foreign-governments; #domestic-servants-of-exempt-employers; #international-protection-officers",
  "semanticSubject": "Other official-role visitor",
  "semanticRelation": "does not acquire exemption merely from",
  "semanticObject": "Overseas diplomatic role, courier, delegation, protection or private employment",
  "conditions": [
    "Overseas diplomat/consular official ordinary official visit is not ordinarily exempt",
    "Possible dualUK/overseas posting requires DMIOU confirmation",
    "Couriers/officials/delegations/private servants/protection officers must use appropriate route unless independently qualifying"
  ],
  "exceptions": [],
  "crossReferences": [
    "C10-C23",
    "C02"
  ],
  "effectOnEtaRequirement": "Route-local exclusions; no residual required inference",
  "referenceTime": "Actual role/purpose at travel",
  "evidenceQuality": "Direct official primary text; paraphrase, not accepted Evidence",
  "retrievedAt": "2026-10-05T11:57:38.253524Z",
  "responseSha256": "fe89084f988e0bdcc8638d9383a58564f4649fb83ac9039b6aa9b5cce2e0b6fc",
  "notes": "A visa waiver, biometric exemption, fee waiver or valid-looking diplomatic passport is not exemption from control. International diplomatic transit under Vienna Convention Art40 is separately described by S15 but excluded by actual non-transit destination scope; it is not silently omitted."
}
```

### B01 — ETA1.1(a)-(f),1.2,1.5

```json
{
  "evidenceId": "B01",
  "sourceId": "S1",
  "officialSourceUrl": "https://www.gov.uk/guidance/immigration-rules/immigration-rules-appendix-electronic-travel-authorisation",
  "clauseId": "ETA1.1(a)-(f),1.2,1.5",
  "sourceLocator": "Validity requirements / ETA1.1 through1.5",
  "semanticSubject": "ETA application",
  "semanticRelation": "must satisfy ALL for validity",
  "semanticObject": "Application process and eligibility",
  "conditions": [
    "(a) specified GOV.UK app OR online form",
    "(b) contactable email",
    "(c) required fee paid",
    "(d) national passport satisfactorily establishes identity AND ETANL1.1 nationality",
    "(e) facial image follows process AND digital passport-photo rules",
    "(f) ANY: Visitor except Marriage/CivilPartnership <=6months; OR CreativeWorker underCRV3.2; OR local journey fromIreland after enteringIreland from outsideCTA OR after leavingUK with limited leave which expired, AND not S2HealthcareVisitor",
    "1.2 applicant nationality inETANL1.1"
  ],
  "exceptions": [
    "1.5 failure means invalid application, rejected and not considered"
  ],
  "crossReferences": [
    "S9",
    "S5 sections5-6",
    "Digital passport photo guidance (not needed to decide A)",
    "CreativeWorker CRV3.2 (B-only cross-reference; not re-audited)"
  ],
  "effectOnEtaRequirement": "B application; not A exemption or hidden universal A premise",
  "referenceTime": "Application; local-journey history as clause states",
  "evidenceQuality": "Direct official primary text; paraphrase, not accepted Evidence",
  "retrievedAt": "2026-10-05T11:53:29.336756Z",
  "responseSha256": "66128a951666671435796dcb682c0d1eda4cc8be1b5ae429b6943fcfe9c9614c",
  "notes": "The parenthetical OR inside local-journey history remains separate from the OR among three application categories. Neither ordinary-passport label nor inability to apply establishes A no-ETA/required. Cross-references are recorded but no B eligibility engine or photo/CreativeWorker audit is attempted."
}
```

### B02 — ETA2.1-2.9 and3.1

```json
{
  "evidenceId": "B02",
  "sourceId": "S1",
  "officialSourceUrl": "https://www.gov.uk/guidance/immigration-rules/immigration-rules-appendix-electronic-travel-authorisation",
  "clauseId": "ETA2.1-2.9 and3.1",
  "sourceLocator": "Suitability requirements; Decision on an ETA application",
  "semanticSubject": "Application",
  "semanticRelation": "may/must be refused by B rules",
  "semanticObject": "Suitability and grant decision",
  "conditions": [
    "2.1 exclusion/deportation grounds",
    "2.2 criminality",
    "2.3 non-conducive grounds",
    "2.4 previous immigration breaches with age18/history/exceptions specified in source",
    "2.5 false representations/documents/information OR nondisclosure",
    "2.6 DELETED",
    "2.7 unpaid litigation costs",
    "2.8 previous ETA5.8 cancellation subject subsequent known grant exception",
    "2.9 previous Visitor refusal subject held-not-cancelled OR later-known-grant exceptions",
    "3.1 Secretary satisfied validity AND not refused suitability => grant; otherwise refuse"
  ],
  "exceptions": [],
  "crossReferences": [
    "B01",
    "B04",
    "S5 suitability sections"
  ],
  "effectOnEtaRequirement": "B only, no standalone A requirement or exemption",
  "referenceTime": "Decision and relevant history",
  "evidenceQuality": "Direct official primary text; paraphrase, not accepted Evidence",
  "retrievedAt": "2026-10-05T11:53:29.336756Z",
  "responseSha256": "66128a951666671435796dcb682c0d1eda4cc8be1b5ae429b6943fcfe9c9614c",
  "notes": "This is a boundary inventory, not a re-audit of suitability subtests. Those criminality/immigration adjudication subtests do not answer task§6 and are not modelled. No suitability refusal implies not_required."
}
```

### B03 — ETA4.1-4.3

```json
{
  "evidenceId": "B03",
  "sourceId": "S1",
  "officialSourceUrl": "https://www.gov.uk/guidance/immigration-rules/immigration-rules-appendix-electronic-travel-authorisation",
  "clauseId": "ETA4.1-4.3",
  "sourceLocator": "Period of grant of an ETA",
  "semanticSubject": "Granted ETA",
  "semanticRelation": "has validity/use conditions ALL",
  "semanticObject": "Duration, purpose and passport binding",
  "conditions": [
    "4.1 expires at EARLIER of2years fromgrant OR application-passport expiry",
    "4.2 multiple journeys: Visitor<=6months EACH occasion OR CreativeWorker CRV3.2",
    "4.3 valid/permission-to-travel only when using passport specified inETA application"
  ],
  "exceptions": [],
  "crossReferences": [
    "B01",
    "C32"
  ],
  "effectOnEtaRequirement": "B use; ETA is not entry permission",
  "referenceTime": "Grant date; passport expiry; each journey",
  "evidenceQuality": "Direct official primary text; paraphrase, not accepted Evidence",
  "retrievedAt": "2026-10-05T11:53:29.336756Z",
  "responseSha256": "66128a951666671435796dcb682c0d1eda4cc8be1b5ae429b6943fcfe9c9614c",
  "notes": "Holding an ETA is satisfaction of a requirement, not a statutory no-ETA exemption. The selected passport-nationality link in Jetnity does not prove an ETA was issued for this exact passport."
}
```

### B04 — ETA5.1-5.8

```json
{
  "evidenceId": "B04",
  "sourceId": "S1",
  "officialSourceUrl": "https://www.gov.uk/guidance/immigration-rules/immigration-rules-appendix-electronic-travel-authorisation",
  "clauseId": "ETA5.1-5.8",
  "sourceLocator": "Cancellation of an ETA",
  "semanticSubject": "Held ETA",
  "semanticRelation": "must or may be cancelled",
  "semanticObject": "Specified cancellation grounds",
  "conditions": [
    "5.1 exclusion/deportation",
    "5.2 criminality",
    "5.3 non-conducive",
    "5.4 immigration breaches with prescribed exceptions",
    "5.5 false representations OR nondisclosure",
    "5.6 relevant NHS notification and outstanding qualifying charges>=£500",
    "5.7 unpaid litigation costs",
    "5.8 MAY cancel if ETA1.1/1.2 not met at application OR subsequently"
  ],
  "exceptions": [],
  "crossReferences": [
    "B01-B03"
  ],
  "effectOnEtaRequirement": "B cancellation; no A exemption",
  "referenceTime": "Grounds as prescribed;5.8 application or subsequent",
  "evidenceQuality": "Direct official primary text; paraphrase, not accepted Evidence",
  "retrievedAt": "2026-10-05T11:53:29.336756Z",
  "responseSha256": "66128a951666671435796dcb682c0d1eda4cc8be1b5ae429b6943fcfe9c9614c",
  "notes": "ETA2.6 deletion does not delete ETA5.6, which remains visible in this fresh response. No cancellation adjudication implemented or inferred from this inventory."
}
```

### U01 — ETA1.8

```json
{
  "evidenceId": "U01",
  "sourceId": "S1",
  "officialSourceUrl": "https://www.gov.uk/guidance/immigration-rules/immigration-rules-appendix-electronic-travel-authorisation",
  "clauseId": "ETA1.8",
  "sourceLocator": "Validity requirements / ETA1.8",
  "semanticSubject": "Jordan national",
  "semanticRelation": "could use historic ETA subject to",
  "semanticObject": "VN2.2(o) transitional conditions",
  "conditions": [
    "ETA granted before15:00BST10Sept2024",
    "UK arrival no later than15:00BST8Oct2024",
    "VN2.2(o) conditions"
  ],
  "exceptions": [],
  "crossReferences": [
    "VN2.2(o) recorded only"
  ],
  "effectOnEtaRequirement": "Unrelated to exact CH/date cell",
  "referenceTime": "Historic2024 cutoffs",
  "evidenceQuality": "Direct official primary text; paraphrase, not accepted Evidence",
  "retrievedAt": "2026-10-05T11:53:29.336756Z",
  "responseSha256": "66128a951666671435796dcb682c0d1eda4cc8be1b5ae429b6943fcfe9c9614c",
  "notes": "Full citizenship set[CH] and travel>=2Apr2025 explicitly exclude this branch. No need to re-audit Jordan visa history."
}
```

### U02 — CTA citizens and family members

```json
{
  "evidenceId": "U02",
  "sourceId": "S23",
  "officialSourceUrl": "https://www.gov.uk/government/publications/common-travel-area-guidance/common-travel-area-guidance",
  "clauseId": "CTA citizens and family members",
  "sourceLocator": "#travelling-and-residing-in-the-cta; #family-members",
  "semanticSubject": "British/Irish citizens",
  "semanticRelation": "have CTA arrangements that do not automatically cover",
  "semanticObject": "Other-nationality family members",
  "conditions": [
    "CTA citizen rights tied to British/Irish citizenship"
  ],
  "exceptions": [],
  "crossReferences": [
    "C01",
    "I07",
    "S24 6.9"
  ],
  "effectOnEtaRequirement": "Unrelated citizens route; rejects generic family/CTA shortcut",
  "referenceTime": "Travel/status",
  "evidenceQuality": "Direct official primary text; paraphrase, not accepted Evidence",
  "retrievedAt": "2026-10-05T12:06:44.763660Z",
  "responseSha256": "e1278c9a68e9cb4e32b87625c22c1d5f1eb54abbc414901c4eb59556ae4105b1",
  "notes": "Family members with other nationality remain subject to their own immigration requirements. Employment/health/social-security chapters are unrelated; not imported as no-ETA rules."
}
```

### I13 — 4.2: Ireland summary

```json
{
  "evidenceId": "I13",
  "sourceId": "S5",
  "officialSourceUrl": "https://www.gov.uk/government/publications/electronic-travel-authorisation-caseworker-guidance/electronic-travel-authorisation-caseworker-guidance-accessible",
  "clauseId": "4.2: Ireland summary",
  "sourceLocator": "#who-does-not-need-an-eta, final Ireland paragraph",
  "semanticSubject": "Third-country non-visa national lawfully resident inIreland",
  "semanticRelation": "is described as no-ETA when",
  "semanticObject": "Travelling toUK to visit from elsewhereCTA",
  "conditions": [
    "Lawful Irish residence",
    "Origin elsewhereCTA",
    "Guidance uses to visit wording"
  ],
  "exceptions": [],
  "crossReferences": [
    "S1 ETA1.3-1.4",
    "S3 Irish exemption definition",
    "I05-I06"
  ],
  "effectOnEtaRequirement": "A guidance summary; no extra universal Visitor conjunct inferred",
  "referenceTime": "Journey",
  "evidenceQuality": "Direct primary guidance; scope relation to rule preserved, not resolved by assumption",
  "retrievedAt": "2026-10-05T11:55:30.393369Z",
  "responseSha256": "ecac20f1215924130fa49e3954b7e9de93b3c3c90fd45dd59c56c7f008d2b5a1",
  "notes": "ETA1.3 does not expressly add to visit. The guidance may be describing its visitor context; this audit does not silently narrow the rule to a new purpose test or use application eligibility to resolve the difference."
}
```

## 10. Final audit decision

**ETA_SEMANTIC_CONTRACT_STILL_NOT_READY**

No residual `required`, implementation, acceptance or activation is authorised. PR remains Draft. STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD EXACT-HEAD REVIEW.
