# Official Truth GOV.UK ETA Semantic Contract Closure 1

Date: 5 October 2026 (Europe/Zurich)
Issue: #842 · Draft PR: #843
Baseline: `main@3ba69f15907e0652cfe83478dabcf91904ca9a00`
Immutable seed: `a5cee48648e776ca417db2d9cf2c7908b7acb059`
Writer: **Jetnity Official Truth GOV.UK ETA semantic contract closure 1**, Generation 1
Execution: Codex Desktop, `gpt-6-astra` / `xhigh`
Binding [TASK](OFFICIAL_TRUTH_GOVUK_ETA_SEMANTIC_CONTRACT_CLOSURE_1_TASK_2026-10-05.md)

## 1. Decision and evidence limit

**`GOVUK_ETA_SEMANTIC_CONTRACT_NOT_READY`**

The existing predicate engine is substantially sufficient. This verdict does not repeat #791's historical claim that permission, residence, origin, age, status and school predicates do not exist. They exist. The remaining issue is assigning exact legal meanings, including negative knowledge and time, without promoting a compressed audit summary into a complete legal specification.

This document closes the distinctions that repository evidence supports and identifies the cells it cannot close. It does not select an extractor, activate a policy or authorize step 2. No government page, Content API response or external legal source was refreshed. All legal statements below describe the repository's audited snapshots, not law verified as current on 5 October.

The material evidence limit is explicit in #791 §6: its table contains sentences **“compressed to the operative words”**. The tracked repository contains that audit, its report and derivative architecture, but no complete Appendix response fixture establishing the omitted detail. A recorded response hash identifies bytes; it does not let this writer recover their missing text. #793's enum names and #839's reconciliation are representability evidence, not additional primary-source observations.

In particular, the record does not close the exact German school confirmation requirement or the precise school-party count/relationship, and it supplies no replacement for the Irish application-time reference when there is no ETA application. These are the bounded questions in §12. External research would be necessary to resolve them if the original audited bytes cannot first be recovered into an authorized evidence record. Research stops at that boundary; this delivery records it instead of fetching anything.

## 2. Evidence anchors and content identities

All code references below refer to the baseline above. Historical reports retain their own dated baselines.

| Ref | Repository anchor | Use in this contract |
| --- | --- | --- |
| E1 | [#791 audit](OFFICIAL_TRUTH_GOVUK_ETA_SOURCE_FAMILY_AUDIT_2026-10-03.md) §§2–7; its [TASK](OFFICIAL_TRUTH_GOVUK_ETA_SOURCE_FAMILY_AUDIT_TASK_2026-10-03.md), [REPORT](OFFICIAL_TRUTH_GOVUK_ETA_SOURCE_FAMILY_AUDIT_REPORT_2026-10-03.md), [SELF_REVIEW](OFFICIAL_TRUTH_GOVUK_ETA_SOURCE_FAMILY_AUDIT_SELF_REVIEW_2026-10-03.md) | Audited National List inclusion/date and compressed Appendix provisions; limits of the original record |
| E2 | [#839 reconciliation](OFFICIAL_TRUTH_GOVUK_ETA_SEMANTIC_RECONCILIATION_2_2026-10-05.md) §§3–6, 8 | Corrected CTA relation, age evidence duty, current context limits, ordered step 1 |
| E3 | [#793 architecture](OFFICIAL_TRUTH_REGULATORY_ELIGIBILITY_PREDICATE_ARCHITECTURE_1_2026-10-03.md) §§3–5; #795 [REPORT](OFFICIAL_TRUTH_REGULATORY_APPLICABILITY_FOUNDATION_1_REPORT_2026-10-03.md) and [HANDOFF](OFFICIAL_TRUTH_REGULATORY_APPLICABILITY_FOUNDATION_1_HANDOFF_2026-10-03.md) | Typed vocabulary, provenance, three-valued logic; closed vocabularies are schema-versioned |
| E4 | [#797 canonical audit](OFFICIAL_TRUTH_APPLICABILITY_CANONICAL_WIRING_AUDIT_1_2026-10-03.md); #799 [REPORT](OFFICIAL_TRUTH_APPLICABILITY_CANONICAL_WIRING_1_REPORT_2026-10-03.md) and [HANDOFF](OFFICIAL_TRUTH_APPLICABILITY_CANONICAL_WIRING_1_HANDOFF_2026-10-03.md) | Sole canonical parser, citation checks and persistence refusal |
| E5 | [#801 composition architecture](OFFICIAL_TRUTH_COMPOSITION_PROVENANCE_POLICY_ARCHITECTURE_1_2026-10-03.md); #803 [REPORT](OFFICIAL_TRUTH_COMPOSITION_POLICY_RUNTIME_FOUNDATION_1_REPORT_2026-10-03.md) and [HANDOFF](OFFICIAL_TRUTH_COMPOSITION_POLICY_RUNTIME_FOUNDATION_1_HANDOFF_2026-10-03.md) | Two-phase schema pin, target coverage and genuine execution seal; current R2 code supersedes historical source-only identities |
| E6 | [#805 CTA audit](OFFICIAL_TRUTH_CTA_REGION_PIN_SOURCE_AUDIT_1_2026-10-04.md) §§3–6 | Explicit territorial membership source; no active pin |
| C1 | `lib/readiness/regulierungs-anwendbarkeit.ts`: `RegulierungsPraedikat`, `RegulierungsKontext`, `regulierungsKontextLesen`, `zielErlaubnisAuswerten`, `wohnsitzAuswerten`, `herkunftAuswerten`, `zweigeEntscheiden`; matching test file | Actual representability and false/unknown behavior |
| C2 | `types/trips.ts`: `TripTraveller`, `TripTravellerDocument`; `lib/readiness/traveller-kontext.ts`: `documentCitizenshipCode`, `credentialOptionsAus`; `lib/traveller/account-registry.ts`: `accountRegistryTravellerAlsTripSnapshot` | Full citizenship set and explicit credential link; account facts do not replace the trip snapshot |
| C3 | `lib/route/ableitung.ts`: `routeFactsAusItineraries`, `routeFactsFuerPunkt` | Canonical route evidence; global first origin is not an arbitrary UK entry's origin |
| C4 | `lib/readiness/rule-claims.ts`: `regelFaktLesen`, `bedingungsHerkunftPruefen`; `official-truth-store-server.ts`: `istPersistierbarerRegelFakt` | Canonical fact read; composed branches rejected; schema-bearing requirement effects refused before RPC |
| C5 | `lib/readiness/official-truth-composition-policy-registry.ts`: `OfficialTruthCompositionPolicy`, `schemaPin`, `faktSlots`, `zitatePruefen`; `official-truth-trusted-fact-extractor-registry.ts`; `official-truth-content-identity.ts` | Actual `ContentItemRef` assignments, `applicabilitySchema: 1 \| null`, identity schema 2 |

Content aliases used in every matrix row:

| Alias | Exact audited content item | Audited representation and status |
| --- | --- | --- |
| N | GOV.UK `2b25b3d4-4eaa-4859-a34e-c7869c114c15`, National List | `govuk / eta-national-list / content-api-en`; API response 7,788 bytes, SHA-256 `59a7fd6e7416f989ace351bc5ab4f562c52b3c5cab64fcbe861ea4a57ced1854`; E1 §2 |
| A | GOV.UK `2620750b-5453-44f1-98af-414037c833be`, Appendix ETA | Proposed `govuk / eta-appendix / content-api-en`; API response 22,965 bytes, SHA-256 `6859cfcacb44cc1287daa8daeedaf05a8b7f18e4ee638cfa7253e09f5d170037`; E1 §2; Appendix identity remains unregistered per E2 §5 |
| R | GOV.UK `f841223e-d1ae-4a25-9783-bfa7b727ee11`, Common Travel Area guidance | E6 selected API response, 21,474 bytes, SHA-256 `b0fcb783c5183d527dfe2615a8a3a13cd8b96f4fa6225b5051508ceffde4f1a8`; no active runtime pin or registration granted here |

N and A are distinct content items under one authority. Their HTML and JSON renderings are not independent legal supports. R supports region membership only; it is not a third source silently contributing an ETA exemption. No historical hash is a fresh server attestation.

## 3. Rule identity and scope boundary

Proposed semantic name, not a registered family/policy/extractor ID: **GOV.UK ETA requirement for the audited Swiss destination cell**.

| Dimension | Exact proposed boundary | Unsupported / unknown |
| --- | --- | --- |
| Fact | `requirementType: electronic_travel_authorization`, `kind: requirement_effect`; outcomes `required` or `not_required`, always `visaMode: null` | Flat `conditional`, visa eligibility or permission-to-travel conclusions |
| Destination | `destinationCountryCode: GB`; one identified inbound UK destination journey | Destination absent, domestic GB journey, unrelated stage or unbound entry event |
| Citizenship | `citizenship.mode: required`, exact full sorted set `['CH']` for this first candidate | Empty/unknown set, any additional citizenship or another set; preserve the full set and decline the cell, never silently select CH |
| Credential | One explicitly selected cell option with `documentType: passport`, `relatedCitizenshipCountryCode: CH`; the link must resolve into the full set | Null/invalid link, missing credential, another document type; issuer never creates citizenship or the link |
| Document qualification | National-passport qualification belongs to application validity, §4. It is not a legal exemption or a legal premise manufactured for requirement A | Ordinary class neither proves qualification nor disproves it; this contract does not decide A from that qualifier |
| Date | `validity.mode: travel_date`, canonical `travelDate >= 2025-04-02`, for that entry/journey | Earlier/missing/invalid date gives no rule from this source selection; never `not_required` from non-inclusion |
| Residence | Preserve the supplied canonical residence dimension in the existing scope/key; `not_applicable` says nothing about Irish entitlement | Neither residence IE nor residence elsewhere establishes the legal residence test or origin |
| Transit | `transitCountryCode: null`, destination evaluation only | Airside/landside transit and connecting-journey legal interpretation remain outside this first contract; no exemption inferred from memory |

The passport/link restriction is a conservative selection boundary inherited from E1's candidate cell, not a claim that every other traveller is exempt. Issuer remains a distinct recorded field; no issuer equality is needed to invent Swiss nationality. Evaluate each credential option separately; there is no default passport, primary citizenship or ranking.

The global rule scope contains no traveller identity, age, permission assertion, school context or application date. A later in-process evaluation must bind the exact traveller, selected credential, full set, trip snapshot and inbound journey to that rule cell. This task adds neither an adapter nor new stored fields.

## 4. Requirement A versus application/use B

**A asks whether ETA is required. B asks whether an application/document/use is eligible. B is excluded from the first requirement rule.**

E1 §6 places ETA 1.1(d), 1.1(f), 1.2 and 4.3 in application/use semantics. Failing national-passport qualification, a purpose limitation, suitability or application-passport matching cannot produce `not_required`. It also cannot independently produce `required`. A valid ETA is not inferred from permission to apply, and permission to travel is not permission to enter.

### National passport: alternatives and recommendation

| Alternative | Assessment |
| --- | --- |
| Add `national` to `document_class` | Reject. Current classes ordinary/diplomatic/official describe a different axis. E1 records no Swiss diplomatic/official exclusion. A mutually exclusive class would incorrectly replace the ordinary/diplomatic axis, while a class combination would expand scope unnecessarily. |
| Separate bounded credential qualification | **Recommended representational direction**, if a later application contract needs it. A qualifier for the selected credential, separate from class, can express national-passport qualification without inferring it from issuer or class. |
| Leave unsupported indefinitely | Safe fallback but does not identify the missing axis. Keep unsupported operationally now; do not substitute `ordinary`. |

Candidate semantic atom: `document_qualification`, qualification `national_passport`, with per-credential state `qualified / not_qualified / unknown`. True means an explicit assertion that this credential is a national passport; false means an explicit assertion it is not; null/omission/uncertainty remains unknown. A second independent existing `credential_citizenship_link: CH` is still required to address the nationality connection. Neither assertion verifies the traveller's identity. Identity verification or eligibility to use a specific ETA application is not claimed by this atom.

Allowed proposed provenance is only `user_asserted`, producing `context_asserted`; this is a proposal for dormant types, not authorization to collect it. Passport number, MRZ, scan, biometrics and free-text legal classification are excluded. Changing selected credential or link invalidates the assertion. A source audit must settle any finer necessary meaning before application B is modeled. Because B is excluded, this qualifier is **not** a justified dependency for implementing requirement A alone.

## 5. Source-to-target matrix

The two matrices form one keyed source-to-target map. Each row in 5.1 gives the source, content item, statement, target and current representability. The same ID in 5.2 supplies provenance, true, false, unknown, delta and unsupported conditions. No target is authorized merely because its type exists.

`P` means current predicate exists; `C` means current ephemeral context shape exists. Neither implies a production producer exists. `U` is unknown, not false. `UA` means `user_asserted`; `REC` means the existing `account_profile` or `trip_context` recorded base provenance; `ROUTE` means `trip_context` from a canonically bound route, or the already permitted explicit `user_asserted` origin.

### 5.1 Statements, targets and representability

| ID | Repo anchor / item | Audited semantic statement | Target predicate, outcome or scope | P / C |
| --- | --- | --- | --- | --- |
| N1 | E1 §§3–4 / N | Switzerland belongs to the list, pursuant to Appendix ETA | Full CH scope match; `citizenship_includes: CH`; general requirement contribution | Yes / yes; exact singleton is a scope-selection check, not membership alone |
| N2 | E1 §4 / N | Group (d): UK travel on/after 2 April 2025 | `scope.validity.travelDate >= 2025-04-02` | Scope comparison / yes |
| N3 | E1 §§4–5 / N | Taiwan footnote is not a Swiss qualifier; application-opening/publication dates are not this travel threshold | Source parser/scope rejection constraints | Not a traveller predicate / not needed |
| U1 | E1 §6 Intro / A | Already holds valid UK entry clearance | `destination_permission(GB, entry_clearance, valid_on_travel_date)`; sufficient `not_required` branch | Yes / yes; no explicit class-wide-negative discriminator or date binding |
| U2 | E1 §6 Intro / A | Already holds permission to enter or stay | `destination_permission(GB, permission_to_enter_or_stay, valid_on_travel_date)`; same outcome | Yes / yes; same limit |
| I1 | E1 §6 ETA 1.4 / A | Resident in Ireland | Actual-residence atom, distinct from entitlement and recorded country | No exact atom / no date-qualified actual-residence context |
| I2 | E1 §6 ETA 1.4 / A | Entitled to reside under Irish law | `lawful_residence(IE, entitled_to_reside, ...)` entitlement component | Partial / yes without legal-time binding |
| I3 | E1 §6 ETA 1.4 / A | Excludes a person who cannot leave Ireland without the Minister's consent | Departure-condition component of `lawful_residence` | Partial / generic `unrestricted / restricted / unknown` exists |
| I4 | E1 §6 ETA 1.4 / A | Residence and entitlement at the time of ETA application | Explicit application-time reference for I1/I2; do not replace with travel date | No / no |
| I5 | E1 §6 ETA 1.3; E2 §3 / A | Travel to UK from elsewhere in CTA | `all(journey_origin(region CTA), not journey_origin(country GB))` for the exact UK inbound journey | Yes / yes; region pin and event binding absent |
| I6 | E1 §6 ETA 1.6; E2 §3 / A | Aged 16+ and relying on Irish exemption: produce residence evidence if required | `age_on_travel_date(at_least,16)` describes age; evidence duty is outside requirement effect | Age yes / yes; request/production duty no |
| I7 | E1 §6 ETA 1.4 / A | No separate permission-to-remain clause is reproduced beyond entitlement to reside | No independent alias or extra conjunct justified by this record | No separately established source target |
| S1 | E1 §6 ETA 1.7 / A | BOTC does not require ETA | `nationality_status: british_overseas_territory_citizen` | Yes / yes |
| S2 | E1 §6 ETA 1.7 / A | BNO does not require ETA | `nationality_status: british_national_overseas` | Yes / yes |
| F1 | E1 §6 ETA 1.9 / A | Age 18 or under | `age_on_travel_date(at_most,18)` | Yes / yes; date bound by future caller |
| F2 | E1 §6 ETA 1.9 / A | At a French Ministry of Education school | `institution_status: french_ministry_of_education_school`; traveller's school relationship must separately be justified | Institution yes / yes; exact personal relationship not separately modeled |
| F3 | E1 §6 ETA 1.9 / A | School party of at least five | `group_size_at_least: 5` | Yes / yes; legal counting unit not explicit in compressed record |
| F4 | E1 §6; E3 §4 / A | Traveller is part of the qualifying school party | `group_membership: traveller_included` | Yes / yes; inclusion is not itself proof of being a pupil |
| F5 | E1 §6 ETA 1.9 / A | Entering as a Visitor | `travel_purpose: visitor` for the UK entry | Yes / yes; free-text holiday/business labels do not classify legal purpose |
| F6 | E1 §6; E2 §3 / A | No separate French confirmation condition is established by this evidence | Do not add `authority_confirmation` to the French exemption | Predicate exists / context exists; no source mapping for an additional conjunct |
| G1 | E1 §6 ETA 1.10 / A | Age 19 or under | `age_on_travel_date(at_most,19)` | Yes / yes |
| G2 | E1 §6 ETA 1.10 / A | At a confirmed German school | `institution_status: confirmed_german_school`; exact confirmation semantics unresolved | Enum exists / yes; source definition incomplete |
| G3 | E1 §6 ETA 1.10 / A | School party of at least five | `group_size_at_least: 5` | Yes / yes; same counting-unit question as F3 |
| G4 | E1 §6; E3 §4 / A | Traveller included in that qualifying party | `group_membership: traveller_included` | Yes / yes; same relationship limit as F4 |
| G5 | E1 §6 ETA 1.10 / A | Entering as a Visitor | `travel_purpose: visitor` | Yes / yes |
| G6 | E1 §6; E3 §4 / A | German school is “confirmed” | Candidate `authority_confirmation(subject institution_status)` only if a separate source atom is recovered | Predicate yes / boolean yes; no bounded confirming-authority/act definition |
| Q1 | E1 §6 ETA 1.1(d) / A | National passport establishes identity and listed nationality | Separate document qualification plus explicit credential/citizenship link, in application B only | Qualification no, link yes / corresponding context no, yes |
| Q2 | E1 §6 ETA 1.2 / A | Applicant is a listed national | Listed-nationality application gate; does not replace N's actual list | Yes / yes; application model excluded |
| Q3 | E1 §6 ETA 1.1(f) / A | Visitor up to six months; excludes Marriage/Civil Partnership Visitor | Application-category/duration qualification | Purpose partial / no complete duration/exclusion context |
| Q4 | E1 §6 ETA 1.1(f) / A | Creative Worker under CRV 3.2 | Application qualification, not merely enum `creative_worker` | Purpose partial / no CRV 3.2 qualification |
| Q5 | E1 §6 ETA 1.1(f) / A | Defined local journey from Ireland, not S2 Healthcare Visitor | Separate application qualification | No complete predicate / no complete context; `medical` is not S2 |
| Q6 | E1 §6 ETA 4.3 / A | Use the passport specified in the ETA application | Application-to-credential relation in B | No / no; citizenship link is a different relation |
| Q7 | E1 §§4,6 / A | Application process opening date, Jordan transition, suitability/refusal/cancellation | Out of this Swiss requirement rule; no negative requirement outcome | No new target needed |
| R1 | E6 §§3–6 / R | CTA membership explicitly enumerates five jurisdictions | Code-owned, versioned `RegulierungsRegionPin` with full content identity | Region predicate/type yes / registry empty |

### 5.2 Truth conditions, provenance, deltas and unsupported cells

All personal facts below are ephemeral. None is an official document check. A contradiction is rejected/blocked, not resolved by taking the first row. `false` describes the particular atom, never the final requirement by itself.

| ID | Allowed provenance | True condition | False condition | Unknown condition | Minimal delta / unsupported condition |
| --- | --- | --- | --- | --- | --- |
| N1 | REC for traveller; N for law | Full candidate set exactly CH and positive audited N inclusion | Known full set fails candidate selection | Missing full set | Reuse; mismatch is unsupported, not `not_required`; issuer/residence substitution prohibited |
| N2 | Recorded scope date; N for threshold | Valid relevant date at/after threshold | Known earlier date fails candidate selection | Missing/invalid/unbound date | Reuse scope; no negative law from pre-threshold non-selection |
| N3 | N parser observation | Exact audited Swiss/group structure | Structure differs | No trusted observation | No context delta; reject footnote leakage, source drift and wrong date provenance |
| U1 | UA only | Explicit class-wide statement: at least one valid entry clearance for GB at bound journey time | Explicit class-wide statement: none valid in this class at that time | No row, omitted class, one expired/not-valid item, date mismatch | Add versioned class-level quantifier and time binding (§6); legacy `not_valid` cannot be auto-upgraded |
| U2 | UA only | At least one qualifying permission to enter/stay for GB at bound journey time | Explicit none valid across this exact class at that time | Same limits as U1 | Same delta; `visa`, `residence_permit`, existing ETA are not automatic class aliases |
| I1 | Proposed UA only | Explicit actual residence in IE at the source-required reference time | Explicit not resident in IE at that same reference | Country alone, another recorded country, no reference, uncertainty | New bounded actual-residence axis; reject defining residence from address, nationality or entitlement |
| I2 | UA only | Explicit Irish-law entitlement at exact source reference | Explicit no such entitlement at same reference | Omitted row, undated entitlement, unresolved reference | Extend bounded temporal semantics, not a free-text legal status; current predicate alone is insufficient |
| I3 | UA only | Explicit not subject to the quoted Minister-consent restriction | Explicit subject to that restriction | Generic travel restrictions or unclear meaning of `unrestricted` | Pin departure axis to source meaning before use; possession of consent must not be treated as absence of a consent requirement |
| I4 | Proposed explicit time binding | Source-relevant actual application reference is identified and I1/I2 refer to it | Inconsistent references invalidate context | No application, hypothetical application date, substitution of today/travel/record time | Unresolved; do not invent a legal fallback or collect an invented date |
| I5 | ROUTE | Exact UK inbound origin is a member of pinned CTA and differs from GB | Exact origin is GB or demonstrably outside valid CTA pin | Missing/ambiguous origin, unproved journey boundary, absent pin when needed | Reuse predicates unchanged; later adapter binds journey. No `not IE`, residence or IATA inference |
| I6 | UA age; A for duty | Age at least 16 identifies the age limb of the evidence duty | Known age below 16 makes only this age limb false | Missing age/date or request status | No exemption delta. Do not require age 16+ for I1–I5 or certify evidence production |
| I7 | A only | No independent truth test established | No independent negative established | Whether a distinct permission-to-remain clause exists beyond the compressed summary | Unsupported; do not double-count entitlement or import UK permission taxonomy into Irish law |
| S1 | UA only | Explicit BOTC `held` | Explicit BOTC `not_held` | Omitted BOTC row | Reuse unchanged; ISO code, passport issuer or a BNO row cannot fill it |
| S2 | UA only | Explicit BNO `held` | Explicit BNO `not_held` | Omitted BNO row | Reuse unchanged; independent of S1 |
| F1 | UA only | Integer age 0–18 on bound travel date | Integer age 19–120 on that date | No age, obsolete date binding | Reuse comparison; no DOB; changed date requires re-confirmation |
| F2 | UA only | Exact institution qualification and relevant traveller-school relationship established | Explicitly disproved qualification/relationship, not another enum by assumption | Null, unclassified school, ambiguous relationship | Positive exemption unsupported pending source detail; current single enum does not provide a general explicit-negative state |
| F3 | UA only | Qualifying count >=5 after the source counting unit is established | Qualifying count 1–4 after same definition | Generic party count, count includes an unreviewed category, null | Threshold reusable; counting semantics unresolved; no extrapolation outside current 1–500 bound |
| F4 | UA only | Traveller explicitly included in this exact party | Explicitly not included | Null, another party/journey | Reuse boolean; does not discharge pupil/school affiliation |
| F5 | UA only | Explicit reviewed legal `visitor` purpose for this entry | Explicit different, unambiguously mapped legal purpose | Null, mixed/unclear purpose or unsupported application-category alias | Reuse for requirement school limb; purpose alone does not close application B |
| F6 | No additional source-backed input | Not applicable as an extra conjunct | Not applicable | Source detail absent | Leave unused; absence of a confirmation row must not make the French exemption false |
| G1 | UA only | Integer age 0–19 on bound travel date | Integer age 20–120 on that date | Same as F1 | Reuse comparison; no age-band rounding |
| G2 | UA only | Exact audited German confirmation and school relationship established | Explicit disproof under that exact definition | Enum label alone, unspecified confirming actor/act, null | Positive exemption unsupported; no extra enum meaning invented from the word “confirmed” |
| G3 | UA only | Same as F3 under German provision's recovered count definition | Same as F3 | Same as F3 | Reuse numeric operator; unresolved counting semantics |
| G4 | UA only | Same as F4 for this German party | Same as F4 | Same as F4 | Reuse membership; personal school relationship unresolved |
| G5 | UA only | Same as F5 for this entry | Same as F5 | Same as F5 | Reuse purpose |
| G6 | UA only if eventually source-mapped | Precisely specified confirmation act is asserted | Explicit absence of that same required act | Generic `authorityConfirmed`, unknown actor/subject, null | Do not add a redundant conjunct to `confirmed_german_school`; exact split cannot be approved from E1's compression |
| Q1 | Proposed UA qualifier; REC link | Qualified selected national passport plus explicit link to listed citizenship, within B | Explicit failed qualifier/link test within B | Unknown qualifier/link/identity meaning | Recommend separate qualifier; no A outcome from failure; ordinary/diplomatic/official class is orthogonal |
| Q2 | REC plus N/A | Full supported nationality cell is positively listed | Application scope not supported | Missing/extra nationality context | Exclude B; no additional requirement predicate |
| Q3 | Unsupported B context | Only a separately complete category/duration contract could prove it | Only an explicit failure of that contract could disprove eligibility | Present repository mapping incomplete | Exclude from first rule; never encode as `not_required` or use failure as `required` |
| Q4 | Unsupported B context | CRV 3.2 qualification, not purpose label alone | Explicit failure of fully defined qualification | `creative_worker` without that evidence | Exclude B; no CRV meaning invented |
| Q5 | Unsupported B context | Exact local-journey and S2 exclusion proven under separate contract | Explicit failure under that contract | Residence/origin alone or generic `medical` | Exclude B; do not equate application local journey to I5 |
| Q6 | Unsupported B context | Same credential explicitly bound to the ETA application | Explicit different credential for that application | No application-credential relation | Exclude B; no number, scan or implicit relation from citizenship |
| Q7 | A; no new traveller fields | No A branch | No A branch | Application/refusal/cancellation assessment not modeled | Closed Jordan transition does not affect CH; no suitability/health/criminal data collection |
| R1 | Official audited R for future code pin | Exact known origin in verified pinned set | Exact known origin outside verified pinned set | No pin, changed binding, missing origin | Existing type sufficient; later identity/registration/freshness gate, no runtime member list installed here |

## 6. UK permission and negative knowledge

The source says an existential OR: valid entry clearance **or** permission to enter/stay. Current C1 matches one row per `(destinationCountryCode, permissionClass)` and mechanically maps `not_valid` to false. Its tests prove that mechanics; they do not prove that an expired personal document is a class-wide negative.

The minimum proposed replacement context meaning is a **class assessment**, keyed by destination, exact class and explicit evaluation time, with `some_valid / none_valid / unknown` (or omission for unknown). `some_valid` means at least one item qualifies; `none_valid` expressly quantifies over every item in that class for this traveller at that time. Two classes require two independently answered assessments to make their OR false. A not-valid item is not a class assessment. No list length, inventory completeness, one expiry date or rejected application supplies `none_valid`.

This can extend the existing bounded destination-permission context in a new schema; it does not need a second permission engine or document inventory. `destination_permission` still tests the same positive proposition. Preserve `not_valid` semantics in schema 1 and never migrate it automatically into schema-2 `none_valid`. The later adapter must reject mixing an item assertion into the class-assessment slot. Valid and none-valid assertions for the same class/time conflict; do not let either silently win.

The relevant assertion is for the actual UK journey being evaluated, under the existing `valid_on_travel_date` contract. A calendar date cannot resolve a permission expiring during that date. Such cases remain unknown until a separately reviewed finer time contract exists. The compressed Intro itself does not specify a clock/tz/expiry rule: no midnight default or “currently valid therefore valid next month” inference is allowed.

All these assertions remain UA/context-asserted, including the false dependencies that decide a residual required branch. Do not call them Official Proof. UI collection wording and retention are separate PO gates.

## 7. Ireland, time and exact CTA origin

Irish exemption candidate: **actual Irish residence AND entitlement under Irish law at the required reference time AND absence of the quoted departure restriction AND travel from elsewhere in CTA to the UK**. These are distinct conditions, not `isIrishResidentExempt`.

I1/I2 are explicitly conjunctive in E1. C1's `wohnsitzAuswerten` tests entitlement and departure, not actual residence. A person can have an entitlement without the record proving actual residence. Conversely a recorded IE residence does not prove legal entitlement. Another residence country is not a safe class-wide negative for actual Irish residence.

The quoted reference is **time of the ETA application**. This record cannot authorize replacing it with travel, checking, profile-update or assertion time, or creating a hypothetical application date for an exempt person. A known source-relevant application reference can anchor an assertion; a no-application case remains unresolved. The generic context has no such reference. Permission/entitlement to remain is not silently introduced as a separate obligation or treated as an alias without the exact source clause.

The departure wording tests being subject to a Minister-consent restriction. It must not be weakened to “has permission for this departure” or expanded to all possible travel restrictions. Whether the full provision contains additional alternatives/qualifications must be established from source text before approving a new bounded value.

CTA relation, now resolved as a semantic expression:

`origin in pinned common_travel_area AND origin != destination GB`.

Thus IE is **included** in the eligible origins. E6's historical set is GB/GG/IE/IM/JE; relative to GB the historical candidate origins are GG/IE/IM/JE. This is an explanation of audited evidence, not a code-owned pin installation. GB is excluded because the source says elsewhere relative to the UK destination, not because Ireland is excluded. A known origin outside the valid pin makes this condition false. Missing origin remains unknown even if residence is IE. A missing pin makes a needed membership test unknown, never “outside CTA”. If origin is GB, the country inequality can already disprove the conjunction without consulting the pin.

**Current `journey_origin` plus the region predicate and `not` suffice unchanged.** The missing part is a later context binding to the exact inbound journey and the separately authorized pin. No new legal origin predicate is warranted. Restrict initial binding to a single unambiguous direct inbound journey. For transfers, multiple entries, through journeys or route fragments where “from” might refer to more than one boundary, decline the inference. Do not assume last segment departure or global first origin is legally sufficient. `routeFactsAusItineraries`' global origin and a raw IATA code cannot settle that ambiguity.

Time data stays ephemeral. Each later assertion must be bound to the traveller/credential/journey it describes. A changed traveller, relevant legal status, trip date, origin, credential or school party invalidates the affected assertions. Use explicit supplied references, not current wall-clock access in the pure evaluator, and no personal context fingerprint in claims/logs/caches.

## 8. School parties and age duty

The five-part shapes in E3/E2 are useful decompositions, not proof that the source has no additional qualifier. The safe known thresholds are inclusive: French age <=18, German age <=19, party threshold >=5. Known age 20 disproves both age limbs; 19 disproves only the French limb. Age 0 is not automatically invalid, and no DOB or broad child/adult band replaces the integer.

School status, the traveller's qualifying relationship to that school, party membership, qualifying group size, authority confirmation and Visitor purpose are not interchangeable. A staff member can be included in a party without that alone establishing the source's required relationship; this is a counterexample to the encoding, not a new legal eligibility claim. The record does not say clearly enough which persons count toward five or fully specify the German confirmation. Those questions stay unresolved rather than receiving guessed values.

`institutionStatus` currently holds one of two positive enums. Another enum is not, without proof, an exhaustive assertion that the traveller lacks the first qualification. A school could require a more precise status representation; omission is certainly not false. For this slice leave positive school-exemption selection unsupported instead of inventing a generic negative school category. A later recovered source may justify a bounded per-status yes/no/unknown assessment and a separate traveller-school relationship. Do not preselect those deltas now.

French authority confirmation: no extra conjunct is supported by the reproduced record. German confirmation: do not require both a “confirmed” institution enum and an unrelated boolean, and do not treat `authorityConfirmed: true` as government verification. The exact actor, subject and confirmation act need evidence before either encoding is approved.

ETA 1.6's age 16 threshold concerns **production of residence evidence if required**. It does not change the Irish exemption's age eligibility. An Irish exemption must not become false at age 15. Likewise an unresolved request/evidence-production duty is not evidence that ETA is required. This requirement contract does not certify compliance with that duty and adds no document upload.

## 9. Semantic decision tree and first safe subset

This tree specifies fail-closed semantics for a future reviewed requirement contract. It is not an extractable fact, source selection or runtime authorization. A deployment today still has no selected ETA rule and must not manufacture a result from this document.

Before traveller evaluation, source scope/identity/coverage must be established by the eventual authorized source-family gate; before user-facing current truth, freshness and the remaining E2 chain gates must pass. This is a source-availability boundary, not an opaque traveller-exemption boolean.

Within an eligible scope from §3, define only these decomposed branches:

| Branch | Exact condition and source support | Result if proved | Deciding atoms / fail-closed boundary |
| --- | --- | --- | --- |
| `uk_permission` | U1 OR U2, Appendix Intro | `not_required` | One exact class proven `some_valid` suffices. Both unknown or one false/one unknown leave the branch unknown. False requires `none_valid` independently for both classes at the same bound reference. |
| `botc` | S1, ETA 1.7 | `not_required` | BOTC held; omitted row is unknown. BNO cannot answer BOTC. |
| `bno` | S2, ETA 1.7 | `not_required` | BNO held; omitted row is unknown. BOTC cannot answer BNO. |
| `ireland_cta` | I1 AND I2 AND I3 AND I5, with I4's legal-time binding; ETA 1.3/1.4 | `not_required` only after all meanings and facts are proved | With this record positive selection is unsupported. A demonstrably false origin limb can disprove it; otherwise unresolved residence/time stays unknown. I6 is not a conjunct. |
| `french_school` | F1 AND F2 AND F3 AND F4 AND F5, plus only additional conditions actually established by a completed source audit; ETA 1.9 | `not_required` only after the exact provision is closed | Positive selection unsupported now. Age >18 disproves the known necessary age limb; a missing school answer cannot. Do not add F6. |
| `german_school` | G1 AND G2 AND G3 AND G4 AND G5; confirmation split only after G6 is resolved; ETA 1.10 | `not_required` only after the exact provision is closed | Positive selection unsupported now. Age >19 disproves the known necessary age limb; enum/boolean shorthand cannot prove the branch. |
| `general` | N1/N2 positive candidate plus every legally relevant exemption branch explicitly false, after exact exemption coverage is established from A | `required` | Full false dependency trace; any unresolved possibly applicable exemption blocks. No `otherwise` built from an incomplete exemption list. |
| Scope/source/context failure | Outside §3, invalid/conflicting context, unavailable source, missing relevant fact or unresolved necessary semantic cell | `unknown/unsupported`, no requirement fact/result | No default from absence. A malformed context is rejected before tree evaluation. |

Order is explanatory, not first-match priority. Reuse the existing three-valued semantics: `not U = U`; any true operand proves OR; any soundly false necessary operand disproves AND. Same-outcome unknown exemptions need not block a proven sufficient exemption. Contradictory outcomes fail closed. Unknown exemptions do block residual `required`.

**First safe subset from this evidence:** sufficient UK-permission or BOTC/BNO exemptions can be described exactly, with valid bound positive assertions and the source/selection prerequisites above. This subset does not claim complete ETA requirement coverage. School-positive and Irish-positive cases remain unsupported. All remaining unresolved cases return unknown.

A useful prospective required-case fixture is an adult aged >=20, exact direct origin demonstrably outside the pinned CTA, both UK classes explicitly none-valid, both statuses explicitly not-held, plus the exact CH/date/credential scope. It disproves every exemption recorded by E1 without guessing the unresolved positive school/Irish definitions. **It is not yet approved as an emitted `required` case:** the compressed record is insufficient for this task's exact source-to-target/complete-exemption-coverage gate. After a narrowly scoped source audit closes that coverage, this is a conservative candidate for first required support. Until then the allowed `required` set of this proposed first implementation is empty.

An exemption-only subset requires no national-passport predicate and does not establish that the outstanding legal-contract delta is ready. Marking the whole closure ready merely because this subset can return `not_required` would leave the task's mandatory semantic cells unresolved. Step 2 therefore remains blocked.

## 10. Source-to-composition target and scope plan

This is an assignment plan with explicit unresolved rows, not a policy object. No fake `ev2_...` support IDs, atom locators or registered IDs are minted. Let support N/A mean the eventual accepted, same-request-proved version of the corresponding content item in §2.

| Target | Exact source contribution | Relation / completeness boundary |
| --- | --- | --- |
| Candidate citizenship and travel-date scope | N ETANL 1.1/group (d), E1 §4 | Source-specific matcher checks decoded scope and rejects mismatches. These are not extra fields on a branched requirement effect. |
| UK destination and overall relationship to Appendix | N introduction plus A's referenced provisions | Complementary scope obligations, not equal values for a fabricated merged sentence. No issuer/residence-derived scope. |
| `uk_permission` branch, each permission atom, effect | A Intro only | One item, `single_content_item`; each atom has the exact class/time meaning in §6. `not_required` is stated by Intro. |
| `botc` and `bno` branch/atom/effect | A ETA 1.7 only | Separate atoms and branches, each `single_content_item`; no ISO-status conversion. |
| `ireland_cta` branch and lawful-residence/origin atoms | A ETA 1.3/1.4 | Assignment blocked until I1–I4 exact semantics are closed. R supplies the external code-owned region pin, not an inherited third branch citation. |
| French school branch and each qualifying atom | A ETA 1.9 | Known age, institution, count, membership, purpose obligations separately mapped; missing source detail prevents final atom/locator assignment. |
| German school branch and each qualifying atom | A ETA 1.10 | Same, including exact confirmation target pending evidence; do not stamp A on a guessed atom. |
| Residual `general` / `otherwise` effect | N's positive requirement pursuant to A; A supplies the complete exclusion set | N is the proposed general-rule target contribution; completeness also depends on all A exemptions being represented and cited. No joint `equal_values` observation may pretend N contains A's exemptions or A contains Switzerland. Final residual branch observation must be reviewed after coverage closes. |
| Branch `visaMode: null` | Type invariant for this non-visa requirement, grounded in the branch's A or N contribution | Structural normalization, not a GOV.UK assertion about visa status; canonical observation must explicitly preserve null. |
| Application Q1–Q7 | No target in the first A fact | Excluded entirely; not a top-level effect, residual branch or hidden condition. |

Each actual future branch and atom must meet C5's canonical target coverage and C4's eventual acceptance contract. Multi-item assignments currently require `equal_values`; complementary legal values cannot be forced into that relation. Use separate targets for separate contributions, or keep selection blocked if the resolved rule cannot be represented honestly. Do not propose a policy delta here to hide unresolved source observations.

The final canonical normalized tree is needed to derive support-stable atom locators. Because several atoms are unresolved, this record deliberately cannot supply a final executable locator/observation map. That is a material reason for NOT_READY, not license for a later extractor to improvise. Current composition and extractor registries remain empty; composed-branch acceptance and applicability persistence remain independent later gates.

## 11. Minimal delta candidates and version treatment

No implementable delta package is approved by this verdict. The following separates justified representational directions from facts needing source resolution.

| Concept | One chosen disposition | Boundary |
| --- | --- | --- |
| CTA origin | Reuse existing predicates unchanged | Correct expression relative to GB; later journey binding and region activation remain separate |
| BOTC/BNO | Reuse unchanged | Independent held/not-held rows; omission unknown |
| Age/purpose/party membership operators | Reuse unchanged | No DOB; exact date/journey binding still necessary; legal counting/relationship not inferred |
| UK permission negative knowledge | Extend existing bounded context assessment | Exact class-wide quantifier and reference binding, not a new engine; no migration of item-level `not_valid` to `none_valid` |
| Actual Irish residence | Add a separate bounded contextual residence-at-reference atom if source closure confirms this exact split | Distinct from recorded country and entitlement; reference unresolved in no-application case |
| Irish entitlement/departure/time | Extend existing bounded residence context only after exact clause/reference is recovered | No additional free-text status/permit and no unsupported alias for permission to remain |
| National passport | Recommend separate bounded document qualification for application B | Excluded from requirement-only delta; operationally unsupported until a B contract exists |
| Positive school qualification and confirmation | Unsupported in first subset | Do not extend enums or introduce personal pupil/confirmation fields before resolving the source cells |
| Other application/use eligibility | Unsupported in first rule | No stay-duration, CRV, S2, application-passport or suitability implementation |

**Version decision: a delta adopting these new meanings requires schema 2.** E3 explicitly versions closed vocabularies by `REGULIERUNGS_SCHEMA`; C1 also requires exact key sets and `schema: 1`. A class-wide quantified negative and newly time-qualified facts cannot silently reinterpret existing schema-1 rows. A new qualification/actual-residence atom likewise cannot be claimed as compatible schema-1 vocabulary. Reusing CTA/status/age operators alone does not require a bump.

A later code slice must preserve explicit schema-1 parsing/evaluation and legacy fact behavior, introduce a separately discriminated schema-2 path through the **same** canonical parser, reject mixed versions, and keep schema-1 `not_valid` out of the ETA class-assessment adapter. The schema-2 non-personal applicability fingerprint needs a separate versioned domain; do not repurpose `rule-applicability:v1` or create a personal evaluation fingerprint. Existing old-version objects must not be auto-upgraded.

Compatibility surfaces to enumerate in that future bounded task:

- `lib/readiness/regulierungs-anwendbarkeit.ts` and tests: versioned fact/context readers, vocabulary, normalization, structure keys, evaluator and missing-fact reasons.
- `lib/readiness/rule-claims.ts` and tests: sole parser delegation and version-aware provenance traversal; keep composed acceptance blocked until its own later authorized change.
- `lib/readiness/official-truth-composition-policy-registry.ts` and tests: `applicabilitySchema` type/reader, `schemaPin`, normalized branch/atom traversal, Phase B equality. A schema-2 pin must never fall through as legacy/null. No pre-HTTP selection by response schema, no real policy registration.
- `lib/readiness/official-truth-trusted-fact-extractor-registry.ts` and `official-truth-same-request-extraction-server.ts` test seams: canonical schema output and frozen-pair mismatch regressions. Preserve the empty production registries.
- `lib/readiness/official-truth-store-server.ts` and tests: prove every unsupported schema-bearing effect still stops before client/RPC; current type narrowing names schema 1 and must remain sound when the union grows. Do not unlock persistence.

Content identity schema 2, N's existing identity-profile v1 and `rule-scope:v1` are different version domains. No content identity/profile version changes merely because applicability becomes schema 2. Future policy/extractor `schemaFamily` and `applicabilitySchema` must pin the reviewed version; any existing immutable policy pair changing that pin requires a new policy version, not an edited historical entry. Appendix/CTA identity registration remains separately gated. No composition/content pin is edited here.

## 12. Unresolved cells and exact evidence needed

| Cell | Why repository evidence does not close it | Bounded evidence needed before step 2 |
| --- | --- | --- |
| I1–I4/I7: Irish definition/time | E1 reproduces residence, entitlement, application-time and Minister-consent wording only in compressed form; C1 omits actual residence/time. The record does not establish a no-application reference or a separate permission-to-remain relationship. | Full operative ETA 1.3–1.6 from the audited Appendix, including any definition/cross-reference affecting entitlement, reference time, departure restriction and evidence duty. Explicitly determine whether no-application cases can remain unsupported or have a source-backed reference. |
| F2–F4: French party | E1 compresses the institution and school-party relation/count. `institution_status` plus generic included/groupSize cannot demonstrate that all personal/party qualifiers are captured. | Complete ETA 1.9 sentence and subconditions: exact qualifying traveller-school relationship, count unit, institution condition, travel condition and any additional qualification. No guessed pupil/escort counting rule. |
| G2–G4/G6: German party | “Confirmed German school” is not an exact actor/act/subject definition. The enum and boolean can accept assertions without describing what was confirmed. | Complete ETA 1.10 sentence/subconditions, especially confirmation authority/act/subject and party count/relationship; decide one representation without duplicate confirmation. |
| General residual/coverage | A `required` otherwise branch is safe only when every applicable exemption has been accounted for. The exact target matrix requested here cannot be verified against missing full operative text. | Clause-complete audited coverage receipt for the Swiss destination cell, with each included/excluded provision and exact source anchor. Then re-review the residual source observation and atom map. |

This does not allege that an unrecorded condition definitely exists. It records inability to prove that a lossy summary preserves every condition. Existing positive UK-permission/status propositions and negative tests of clearly stated necessary age/origin limbs remain useful; they do not certify the full map.

**Fresh Official Source Audit needed?** If the exact previously audited Appendix bytes can be recovered with their recorded hash and an authorized, clause-complete repository evidence record, a semantic re-audit of that fixed snapshot could answer these questions without claiming freshness. No such complete tracked snapshot was found in this read. Otherwise **yes**: commission a narrowly bounded official-source audit of the named Appendix clauses and their necessary cross-references. Do not reopen a worldwide source search or re-research CH-01..CH-10. This writer performs neither recovery from unapproved external stores nor fresh retrieval. A later positive source-family selection still needs its own current freshness gate even if historical semantic closure succeeds.

## 13. Synthetic review cases for a later step 2

These are proposed acceptance obligations, not tests written/run and not permission to dispatch code. Resolve §12 and independently approve the exact versioned delta first.

| Case | Required result / invariant |
| --- | --- |
| Empty permission list; one expired clearance; negative in only one of two UK classes | Unknown exemption; never class-wide none-valid or residual required |
| Explicit none-valid for both classes at same reference | Permission OR false, UA dependencies retained; cannot alone decide requirement |
| some-valid plus none-valid for same class/reference | Context conflict, no arbitrary winner |
| Different date, expiry within date, re-used traveller/credential/journey assertion | Unknown/reconfirmation or parser rejection; no stale negative reuse |
| BOTC omitted, BNO not-held | BOTC unknown; not a complete negative |
| BOTC held, BNO and school unknown | Sufficient `not_required` may decide once source/scope gates pass; same-outcome unknown exemptions do not invalidate it |
| Ordinary passport, explicit CH link, no national qualification | Application qualification unknown; A is neither required nor exempt for that reason |
| National qualification asserted, link missing or outside full set | No invented link; unknown or invalid context; issuer CH cannot repair it |
| CH plus another citizenship; same set reordered | First candidate unsupported for both orders; no CH extraction from full set |
| IE residence only; entitlement only; actual residence only | Irish exemption unknown; components remain separate |
| No ETA application reference; travel date substituted | Unknown; do not choose a fabricated reference |
| Subject to Minister-consent restriction but consent reportedly granted | Not silently `unrestricted`; source-defined restriction test governs |
| Origin IE/GG/IM/JE with future valid pin; origin GB; known nonmember | Relative-origin limb respectively true/false/false; never `not origin IE` |
| Origin missing; pin missing; CH–IE–GB ambiguous through journey | Unknown; no residence/global-origin/last-segment substitution |
| Ages 15/16 relying on Irish exemption | No age-based change to exemption; only evidence-duty limb differs |
| Ages 18/19/20; group counts 4/5; missing traveller relationship | Exact inclusive age/count tests; no positive school exemption before relationship/count semantics closed |
| Generic authorityConfirmed true, unknown German confirmation definition | Unsupported positive school branch, not proof |
| Application category fails; application passport differs; suitability unknown | No A effect is created or flipped |
| All documented exemption branches false but coverage gate unresolved | Unknown/unsupported; incomplete otherwise forbidden |
| Schema-1 `not_valid` fed to schema-2 class assessment | Rejected or kept unknown by explicit adapter; no automatic upgrade |
| Schema-2 fact with schema-1/null policy pin; mixed fact/context versions | Fail closed before sealed success; no parser/registry reselection |
| Unsupported schema-2 requirement effect reaches store boundary | Zero client/RPC calls; no flattening, even unconditional |
| Missing/foreign/duplicate branch or atom support; fabricated equal-values observations | Fail closed; each item contributes only its documented target |

## 14. Authority, privacy and stop

No PO gate is needed merely for this docs contract or a later separately scoped dormant parser/evaluator that collects no new personal data and performs no hosted write. No approval is requested here.

PO review remains necessary before enabling new legal-assertion collection/meaning in UI, new personal retention/provenance, hosted migration/apply, Appendix/CTA registration, reserved policy/extractor activation, Production or F8. User assertions stay context-asserted. No passport/permit number, school name, student ID, DOB, MRZ, scan, biometric or free-text legal status is proposed. No personal context is stored in global Official Truth, logs, analytics or a new context hash.

The companion [REPORT](OFFICIAL_TRUTH_GOVUK_ETA_SEMANTIC_CONTRACT_CLOSURE_1_REPORT_2026-10-05.md), [HANDOFF](OFFICIAL_TRUTH_GOVUK_ETA_SEMANTIC_CONTRACT_CLOSURE_1_HANDOFF_2026-10-05.md) and [SELF_REVIEW](OFFICIAL_TRUTH_GOVUK_ETA_SEMANTIC_CONTRACT_CLOSURE_1_SELF_REVIEW_2026-10-05.md) carry delivery evidence. Task remains byte-identical. Workspace #841 is disjoint. No runtime, tests, migration, DB, traveller UI, registration, policy, extractor, Evidence/Rule, F8 or Production change.

**STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD EXACT-HEAD REVIEW.** Keep #843 Draft. No Ready, merge or step 2. The immediate review question is whether the identified source-detail gaps can be closed from recoverable audited evidence; only a separately authorized audit may obtain new official bytes.
