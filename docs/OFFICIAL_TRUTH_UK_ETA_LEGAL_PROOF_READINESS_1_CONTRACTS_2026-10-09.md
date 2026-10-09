# UK ETA Legal-Proof Readiness 1 — Contracts

Date: 9 October 2026. Author: **Jetnity Official Truth UK ETA legal proof readiness 1 — Generation 1**. Issue #915 / Draft #916. Developer diagnostics only.

## Boundary and canonical reuse

`scripts/official-truth-uk-eta-legal-proof-readiness-1/packet.ts` exports `createLegalProofPacket(unknown)` and `serializeLegalProofIntent(unknown)`. Both consume a non-personal developer research intent. They do not consume people, documents, source bodies, official assertions, accepted evidence or a caller-created packet. No database, application consumer, source fetch, clock, legal evaluator, registry write or acceptance call exists.

`regelScopeAusEvidenceScope` remains the single scope parser. Public #857 `schema2DatenPruefen`, `schema2Kanonisch`, `civilDateOrdinalLesen` and permission-class vocabulary are reused. There is no second parser/evaluator for regulatory rules. The existing research-request/source-routing pipeline remains canonical; R1–R6 questions here are review planning, not authenticated requests, evidence supports or new source routes. #914's technical identity/whole-response qualification implementation is unchanged.

## Closed version-1 input

| Field | Contract |
| --- | --- |
| `schemaVersion`, `intent` | Exactly `1`, `UK_ETA_LEGAL_PROOF_GAPS` |
| `observedAt` | Explicit 24-character UTC instant with milliseconds; real Gregorian date and exact ISO round trip; no default clock |
| `scope` | Required field; null means SCOPE_MISSING. Otherwise the existing canonical, source-neutral `RegelScope`, with no sourceId. For supported input, its canonical serialization must match the canonical reader's output; inactive-union fields are not silently discarded |
| supported scope | Destination GB, exact full citizenship set CH, electronic travel authorization, no transit scope. Supplied selected option must explicitly be a CH-issued passport; citizenship/link must be independently supplied. Missing selection/link remain specific gaps. Issuer cannot create citizenship. Other destinations, citizenship sets, requirements or document types are NOT_READY |
| `journey` | INBOUND_DESTINATION, UNKNOWN, AIRSIDE_TRANSIT, LANDSIDE_TRANSIT or DOMESTIC; latter three are outside this slice. Null transit alone does not prove destination-only travel |
| `applicationScenario` | NEVER_APPLIED, APPLICATION_ASSERTED or UNKNOWN; hypothetical diagnostic selector, not a recorded application event |
| `contextCoverage` | At most 14 distinct fixed fact labels with MISSING / USER_ASSERTED / UNREVIEWED_RECORD. No actual residence, age, pupil/school name, document, status or personal evidence values |
| `permissionCoverage` | At most five distinct existing canonical permission classes with those same diagnostic coverage states. Even all asserted classes cannot prove class-wide absence. The ETA class concerns use/satisfaction, not exemption |
| `observations` | At most three distinct source labels: ETA_APPENDIX / NATIONAL_LIST / IRISH_GUIDANCE. Label must match its exact fixed HTTPS URL, with no query, fragment, alternative host, encoding or path. Origin is HISTORICAL_AUDIT / RESEARCH_READ / SYNTHETIC. Nullable retrievedAt/publishedAt use the strict UTC format. Interpretation is UNRESOLVED / AMBIGUOUS / CONFLICTING / CLARIFICATION_LOCATED |

All objects are strict; unknown extra keys are rejected. Duplicate fact/source/class entries are rejected before normalization. The canonical plain-data preflight runs before field access/parsing: bounded JSON data, 65,536 serialized UTF-8 bytes, 8,192 nodes/members, nesting at most 16, no prototypes/accessors/cycles/symbols/non-JSON values/PII. `structuredClone` after preflight rejects proxies and isolates caller mutation. Zod then imposes the smaller task bounds above. No free-text intent, file input or raw JSON ingestion endpoint exists. Duplicate textual JSON keys must be rejected by any future byte boundary before object construction; this package introduces no such boundary.

## Output and precedence

The closed `packetSchema` describes every output object. Malformed/unserializable input returns a finite INVALID_INPUT/BLOCKED refusal with no original data or thrown error. Missing, invalid or out-of-scope regulatory scope returns NOT_READY with a finite reason. Structurally valid in-scope diagnostics return `ok: true`, **BLOCKED / OPAQUE_PUBLISHING_METADATA**, `legalProofReadiness: NOT_READY` and `authority: DEVELOPER_RESEARCH_ONLY`. `ok` describes only construction of the diagnostic packet. The permitted RESEARCH_REVIEW_ONLY terminal class is not emitted by this version because no in-scope input can remove the known #914 source block.

Every valid packet retains all applicable source reasons in stable source order, all six unresolved questions, 20 coverage cases and separate official-source, legal-semantics, personal-context and platform/PO layers. A stale and conflicting historical observation retains all three classifications. Observation age greater than 24 hours is RESEARCH_STALE; the boundary is diagnostic bookkeeping, not a legal-freshness policy. Future retrieval or publication chronology conflict is explicit. Missing retrieval is never filled from publishing/observation time. Newer assertions do not clear an older ambiguity. A located clarification remains unreviewed.

Source revision, legal validFrom and validUntil always remain null. No retrieval/publication/travel date is converted into commencement, an effective interval or an ETA application event. No output contains an ETA/visa outcome, requirement boolean, visaMode, accepted object, Evidence version ID, Rule Fact or source attestation.

## R1–R6 required proof and coverage

The catalog joins the historical #845 audit's 76 clause records and 33 retrieval entries. It does not copy or re-hash that corpus. Exact canonical URLs, concrete locators and historical row references are in `catalog.ts`; their labels grant no source registration. All remain historical research targets unless one of the three fresh observations below explicitly records a read.

| Question | Unsatisfied authoritative proof | Direct historical anchors |
| --- | --- | --- |
| R1 | ETA1.4 qualifier target AND reference event for a never-applicant | I01–I06 / Appendix ETA1.3–1.4 and Irish guidance's exemption heading |
| R2 | BOTC/BNO person status versus selected Swiss passport | C07 / ETA1.7, passport-use guidance |
| R3 | Pending/saved/late/appeal/joining/island admission treatment | C05–C06, C04/C33 / EUSS and CTA headings |
| R4 | Complete exempt-control agreement coverage and crew restriction reconciliation | C09–C31 / EXM, international-organisation list, forces and crew guidance |
| R5 | Frontier/S2 ETA effect by arrival mode, distinct from visa or on-arrival permission | C34–C35, C33 / frontier-worker, S2 and CTA headings |
| R6 | German mixed-party pupil counting and form origin/document edges | G05–G09 / German guidance, original linked form pages 2–3 and Part1 11A–11D |

R1 is unsatisfied even when residence, entitlement and an application are asserted. NEVER_APPLIED explicitly produces NEVER_APPLIED_EVENT_UNRESOLVED; neither trip date nor observation time supplies an event. Both R1 predicates remain in the question even for other scenarios.

Coverage explicitly includes valid UK entry clearance, UK permission/settled status, right of abode, island permission, pending/saved/appeal/joining status, Irish residence/CTA, BOTC/BNO, French and German schools, diplomatic roles/families/agreements, forces, ship/air/rail crews, frontier worker, S2 and unenumerated exemptions. No branch defaults to “all other exemptions false.” British/Irish citizenship is excluded only within the explicit complete CH research scope; BOTC/BNO is not an ISO-citizenship inference. Airside/landside are excluded only from an explicitly selected inbound destination research case. UNKNOWN journey leaves them unresolved. ETA application/use and Crown Dependency ETA recognition stay APPLICATION_USE_ONLY, not exemption.

Context labels retain actual Irish residence, separate entitlement, Minister restriction, origin, age/proof duty, Visitor purpose, nationality status, school study/organiser relation, pupil count, form listing, form authority and supervising-adult custody as separate missing proofs. User assertions and unreviewed records cannot settle law or produce negative knowledge. No context/evidence collection is enabled.

## Narrow fresh public research

Three public GOV.UK text views were opened, with completion observed at `2026-10-09T19:25:28.000Z`. This timestamp records the research-tool observation, not a same-request HTTP-byte receipt. Irish guidance was additionally expanded in the tool to read its exemption section. Only the summaries below are retained; no raw body, trace identifier, live body hash or custody object is exported. No global search, school form download/submission or contact was performed.

| Canonical primary source and locator | Narrow paraphrase and remaining ambiguity |
| --- | --- |
| [Appendix ETA](https://www.gov.uk/guidance/immigration-rules/immigration-rules-appendix-electronic-travel-authorisation), introduction and ETA1.3–1.4, 1.7, 1.9–1.10 | Existing permission and named exceptions remain relevant. ETA1.4 still connects its wording to application time. This read supplies no explicit interpretation settling both qualifier target and a never-applicant reference event. That is the author's bounded research assessment, not a legal adjudication. The manual header shows 8 October 2026; it is not proof of a particular clause revision or commencement. |
| [ETA National List](https://www.gov.uk/guidance/immigration-rules/immigration-rules-appendix-eta-national-list), ETANL1.1(d), Switzerland | Switzerland appears in a date-delimited cohort, expressly subject to Appendix ETA. Membership alone does not prove a traveller obligation. The manual header date is not legal validity. |
| [Irish-resident guidance](https://www.gov.uk/government/publications/electronic-travel-authorisation-irish-resident-exemption-caseworker-guidance/electronic-travel-authorisation-irish-resident-exemption-accessible), “ETA rules: Exemption for Irish residents,” “Children,” “Documents that show lawful residence in Ireland” | Separates residence/entitlement, CTA travel and evidence duties. It repeats application-time wording and discusses people arriving without an ETA, but does not expressly supply the missing never-applicant event. Its 2023 publication information also prevents treating every background rollout statement as a new current rule. |

No newly discovered clarification is claimed. Unread amendments/agreements and search absence supply no legal negative. R2–R6 remain precisely targeted historical questions; they were not re-audited globally. A whole public text read does not qualify the Content API response or overturn #914's privacy refusal.

## Developer commands and stop

From repository root with the unchanged Node22 lockfile:

```sh
node --import ./scripts/server-only-test-register.mjs --import tsx scripts/official-truth-uk-eta-legal-proof-readiness-1/run.ts
node --import ./scripts/server-only-test-register.mjs --import tsx scripts/official-truth-uk-eta-legal-proof-readiness-1/run.ts --synthetic
node --import ./scripts/server-only-test-register.mjs --import tsx --test lib/readiness/official-truth-uk-eta-legal-proof-readiness-1.test.ts
```

Default: NOT_RUN, null packet, exit 0. Explicit synthetic: SYNTHETIC_ONLY, blocked diagnostic, exit 0. Any other arguments: INVALID_ARGUMENTS, null packet, exit 2, no argument echo. The serializer reconstructs from intent; a replayed output is refused as input. No network mode exists.

**DEVELOPER_ONLY / LEGAL_PROOF_READINESS_NOT_READY / NO_ACCEPTED_OFFICIAL_TRUTH / NOT_APPROVED_FOR_HOSTED_IMPORT_OR_F8**
