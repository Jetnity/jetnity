# Official Truth GOV.UK ETA Semantic Reconciliation 2

Date: 5 October 2026
Issue: #838 · Draft PR: #839
Baseline: `main@58d2781d4b48cfdc8f9131f374f90d9b96a10787`
Writer: **Jetnity Official Truth GOV.UK ETA semantic reconciliation 2**, Generation 1
Execution: Codex Desktop, `gpt-6-astra` / `xhigh`
Binding task: [TASK](OFFICIAL_TRUTH_GOVUK_ETA_SEMANTIC_RECONCILIATION_2_TASK_2026-10-05.md)

## 1. Decision and evidence boundary

**`GOVUK_ETA_SEMANTIC_CHAIN_NOT_READY`**

No real GOV.UK ETA extractor is selectable. The source-family selection remains `NO_SOURCE_FAMILY_PROVEN_YET`, but several reasons in #791 are obsolete. The current code has a bounded applicability language, canonical parsing, an evaluator, content-item identity, and a composition execution foundation. It does not yet have a complete approved ETA semantic mapping, the Appendix identity, an active CTA pin, an ETA composition policy/extractor, composed-branch acceptance, lossless applicability persistence, or a traveller-context consumer.

This is a repository reconciliation, not a new observation of current immigration law. Legal statements below refer to the Appendix snapshot audited in #791 and the identity observations already recorded on 4 October. No government response was fetched in this slice. The repository evidence is sufficient to reject readiness. A future positive source-family selection must explicitly commission any necessary freshness check; this audit does not silently certify today's government bytes.

The immutable task seed is `60b58d0d54ca9c23ac8d799b0589e16d61904a20`. Current code citations below resolve against the baseline above. Historical delivery reports describe their own heads; the code and live receipts resolve subsequent changes.

Evidence anchors:

| Ref | Repository evidence / symbols |
| --- | --- |
| E1 | [#791 source audit](OFFICIAL_TRUTH_GOVUK_ETA_SOURCE_FAMILY_AUDIT_2026-10-03.md), especially §§3–9, plus its task, report and self-review |
| E2 | [#793 predicate architecture](OFFICIAL_TRUTH_REGULATORY_ELIGIBILITY_PREDICATE_ARCHITECTURE_1_2026-10-03.md); #795 foundation report/handoff; current `lib/readiness/regulierungs-anwendbarkeit.ts`: predicate/context types, `zielErlaubnisAuswerten`, `wohnsitzAuswerten`, `herkunftAuswerten`, `regulierungsKontextLesen`, `zweigeEntscheiden` |
| E3 | [#797 canonical audit](OFFICIAL_TRUTH_APPLICABILITY_CANONICAL_WIRING_AUDIT_1_2026-10-03.md), #799 report/handoff; `lib/readiness/rule-claims.ts`: `regelFaktLesen`, `regelFaktKanonischLesen`, `bedingungsHerkunftPruefen`, `regelKandidatAkzeptieren` |
| E4 | [#801 composition architecture](OFFICIAL_TRUTH_COMPOSITION_PROVENANCE_POLICY_ARCHITECTURE_1_2026-10-03.md), #803 report/handoff; current `official-truth-composition-policy-registry.ts`, `official-truth-same-request-extraction-server.ts`, `official-truth-trusted-fact-extractor-registry.ts` under `lib/readiness/` |
| E5 | [source-identity reconciliation](OFFICIAL_TRUTH_SOURCE_IDENTITY_GRANULARITY_RECONCILIATION_1_2026-10-04.md), [R2 report](OFFICIAL_TRUTH_CONTENT_IDENTITY_R2_WIRING_1_REPORT_2026-10-04.md); current `official-truth-content-identity.ts` and `official-truth-govuk-content-api-identity-profile.ts` |
| E6 | [Content API identity audit](OFFICIAL_TRUTH_GOVUK_CONTENT_API_IDENTITY_PROFILE_AUDIT_1_2026-10-04.md), [National List registration audit](OFFICIAL_TRUTH_GOVUK_NATIONAL_LIST_REGISTRATION_AUDIT_1_2026-10-04.md), [hardening report](OFFICIAL_TRUTH_V2_CATALOG_PROFILE_EXACT_HOST_HARDENING_1_REPORT_2026-10-04.md) |
| E7 | [CTA source audit](OFFICIAL_TRUTH_CTA_REGION_PIN_SOURCE_AUDIT_1_2026-10-04.md); `REGULIERUNGS_REGION_PINS` and current `RegulierungsRegionPin` |
| E8 | `lib/readiness/official-truth-store-server.ts`: `PersistierbarerRegelFakt`, `persistierbarenClaim`, `faktSpalten`, `akzeptierteRegelClaimSpeichern`; migrations `20261001151048_official_truth_accepted_rule_claim_persistence_schema_1.sql`, `20261004010705_official_truth_content_identity_2.sql`, `20261004223959_official_truth_v2_catalog_hardening_1.sql` |
| E9 | `types/trips.ts`: `TripTraveller`; `lib/traveller/account-registry.ts`; `lib/readiness/traveller-kontext.ts`, `kontext.ts`, `provider.ts`; `lib/route/ableitung.ts`: `routeFactsAusItineraries` |

At the live gate read on 5 October, [#751](https://github.com/Jetnity/jetnity/issues/751) still pins this baseline and `NORMAL`. [#748 receipt 5985858310](https://github.com/Jetnity/jetnity/issues/748#issuecomment-5985858310) supersedes receipt 5985807662's earlier hosted-apply hold: Development hardening was approved, applied, and independently read-only verified as `DEV-OT-HARDENING-RO-VERIFY-20261005-01`. Repository SQL blob `8dcd7d77a0b8698f49101a241611bf419309df45` was recorded by Supabase under execution version `20261005000230`, name `official_truth_v2_catalog_hardening_1`.

That receipt reports exactly the National List identity, zero Evidence/Rule payload rows, and Production v2 absent. These are Technical-Lead receipt facts, not a database read performed by this writer. Hardening closure did not close the semantic gate. The deliberately unapplied `20261002154952` remains outside this task.

## 2. Decision matrix: what changed since #791

| Original blocker / question | Current finding | Disposition |
| --- | --- | --- |
| No UK permission, lawful-residence, status or school predicates | Named predicates and structured context now exist, including explicit negative values and three-valued evaluation. | Basic representational absence resolved by #793/#795; complete ETA semantics and context proof are not. |
| No condition payload; `conditional` cannot express exemptions | Schema-1 requirement effects have typed expression branches, outcomes and citations. #799 connects them to the sole canonical parser. Flat legacy `conditional` is rejected. | In-memory shape resolved; legal mapping, acceptance and persistence remain separate. |
| A decoded scope cannot check the Swiss date threshold | Already resolved before #791 by decoded scope. Full citizenship set and `scope.validity.travelDate` are available. | Do not reopen this resolved issue or use publication/retrieval dates instead. |
| Two GOV.UK pages cannot be treated as one statement | Still true: two content IDs are two supports. R2 now permits distinct `ContentItemRef`s under the same `sourceId`. | Identity granularity resolved; no need to invent two authorities. |
| No composed execution mechanism | #803 plus R2 implement two-phase policy/extractor binding and fresh retrieval of distinct proof-bound items. | Foundation resolved. Both production policy/extractor registries remain empty. |
| CTA has no auditable membership source | #805 established `CTA_REGION_PIN_SOURCE_PROVEN`. | Source research resolved. No active pin or registered CTA identity follows from that verdict. |
| Appendix can be fetched within the transport ceiling | Historical API response is 22,965 bytes; HTML was 88,426 bytes. | API is a feasible representation; neither size nor identity proves a complete legal fact. |
| National passport qualification | Passport type, class, issuer and explicit citizenship link are separate. No class/predicate proves national-passport status. | P1 semantic gap remains; `ordinary` is not a substitute. |
| Complete branches can reach accepted storage | Composed branches first fail `condition_provenance_ambiguous`; otherwise accepted schema-1 facts fail `applicability_not_persistable`. SQL remains flat. | P1 acceptance and persistence gaps remain. |
| Workspace can present complete ETA truth | No production context-reader/evaluator consumer, no live requirements provider and no accepted ETA rule. | Unavailable/unknown is truthful; a complete per-traveller decision is not available. |

## 3. Every audited Swiss-relevant exemption and qualification

The legal mapping here is deliberately more precise than saying that a predicate name exists. In the following table, “representable” means the current type can express the specified test; it does not mean the fact is supplied, officially verified, accepted or stored.

| Audited provision | Current predicate/context mapping | Remaining limit / safe behavior |
| --- | --- | --- |
| Intro: valid UK entry clearance OR permission to enter/stay | `any` of two `destination_permission` atoms, destination `GB`, classes `entry_clearance` and `permission_to_enter_or_stay`, `validity: valid_on_travel_date`. Context rows use those exact classes and either `valid_on_travel_date` or `not_valid`. | Both classes exist. Other enum classes (`visa`, `residence_permit`, ETA) are not automatic aliases. No current producer supplies these rows. No temporal evidence validates an assertion merely because its enum says “valid”. |
| ETA 1.3 / 1.4: lawful Irish residence and UK journey from elsewhere in CTA | `lawful_residence` for `IE`, entitlement `entitled_to_reside`, departure `unrestricted`; `journey_origin` region `common_travel_area`; an explicitly reviewed exclusion of the UK origin for “elsewhere”. | Entitlement/departure axes exist. `wohnsitzAuswerten` does not check actual residence or the application-time condition. No application-date binding exists. A residence country alone does not prove entitlement; entitlement alone must not silently stand for the full legal definition. CTA membership is unpinned. |
| ETA 1.6: evidence of lawful residence, if required, for people aged 16+ relying on 1.3 | `age_on_travel_date` can compare `at_least: 16`. | This is an evidence-production duty, not an age restriction on the exemption. Do not put `age >= 16` in the exemption's `all`, or claim younger people need ETA for that reason. The present boolean evaluator does not prove possession/production of requested evidence. |
| ETA 1.7: BOTC | `nationality_status: british_overseas_territory_citizen`; context `holding: held / not_held`. | Typed status exists; `user_asserted` only. No ISO country code or issuer implies it. Missing row is unknown. |
| ETA 1.7: BNO | `nationality_status: british_national_overseas`; same holding semantics. | Same limits; a complete negative of the disjunction needs both statuses false, not an empty list. |
| ETA 1.9: French school party | `all`: age `at_most: 18`, `institution_status: french_ministry_of_education_school`, `group_size_at_least: 5`, `group_membership: traveller_included`, `travel_purpose: visitor`. Listed nationality is established by the complete decoded cell/list match. | All named tests exist. No stored traveller school-party context supplies them. The snapshot does not justify adding a separate authority-confirmation conjunct to this provision. |
| ETA 1.10: German school party | Same five-part shape, age `at_most: 19`, institution `confirmed_german_school`. | The enum itself says confirmed. `authority_confirmation` exists, but an extra conjunct is allowed only if the reviewed source mapping needs a separate confirmation fact. Its user assertion is not an official document check. |
| ETA 1.1(d), 1.2: national passport establishing identity and listed nationality | Credential type `passport`; explicit `credential_citizenship_link: CH`; full `citizenship_includes: CH`; issuer remains a separate field. `document_class` can describe ordinary/diplomatic/etc. | No national-passport qualification exists. The type/link establish recorded context, not official identity proof. Null link remains unknown. `ordinary` is neither necessary nor sufficient on this evidence; the audited Swiss row contains no diplomatic/official exclusion. |
| ETA 1.1(f): application categories | `travel_purpose` includes visitor and creative_worker. | No complete mapping for visitor duration up to six months, Marriage/Civil Partnership exclusions, CRV 3.2 qualifications, defined Irish local journey or S2 Healthcare exclusion. `medical` is not S2 Healthcare and `other` is not a safe catch-all. Decide explicit supported scope/qualification semantics before selecting a family. |
| ETA 4.3: use the passport specified in the ETA application | Existing document/citizenship relationship is unrelated to the application-passport relationship. | No application-credential binding. Do not infer it from issuer, nationality or a passport selection. This governs use of an ETA, not whether an ETA is required. |
| ETA 1.8 and suitability/cancellation | Closed Jordan transition; ETA 2.1–2.9 and cancellation grounds. | The transition does not add a Swiss exemption. Refusal/cancellation criteria are not `not_required` branches. No criminal, health or other sensitive suitability data is needed for this requirement-effect audit. |

This accounts for all exemptions and qualifications recorded in E1. It does not invent an airside-transit exemption or another rule from memory. Application validity and permission to use an ETA must remain distinct from requirement effect: an invalid application is not proof that no ETA is needed. A narrowed first extractor may exclude unsupported cells with no fact; it cannot manufacture a negative outcome. That boundary needs a reviewed semantic contract before implementation.

### Specific correction to the previous architecture

E2's “Journey origin” paragraph and illustrative ETA branch say `not journey_origin IE`. E1 quotes travel **to the UK from elsewhere in the CTA**. Excluding Ireland would remove the very Irish-departure case being considered. That earlier mapping is not an authority to implement it. The bounded correction is to review “elsewhere” relative to the UK destination (`GB`), with a known exact inbound origin and an approved CTA pin. This record identifies the contradiction; it neither edits E2 nor activates a new predicate/pin. E2's treatment of age 16 must also preserve the evidence duty described above, not turn it into exemption eligibility.

### In-memory form is possible; a complete trusted ETA fact is not yet proved

For the currently named exemption axes, an illustrative decomposition uses seven branches: one UK-permission disjunction, Irish/CTA, BOTC, BNO, French party, German party, and `otherwise`. Six exemption outcomes would be `not_required`, with the reviewed positive general requirement in `otherwise`; all use `visaMode: null`. This is a shape/count demonstration, not an emitted or approved ETA fact. Passport/application-scope gaps are not solved by that sketch.

The existing bounds allow eight branches, depth four, eight operands, and sixteen nodes **per expression**. The above individual expressions fit; no bound increase is justified. Schema-1 branches live under `applicability: { schema: 1, kind: branches, branches: ... }` on a `requirement_effect` with `schema: 1`; no mixed top-level effect is permitted. Branch IDs are sorted, not first-match priority.

Evaluation is three-valued. `not unknown` stays unknown. A false operand can disprove an `all`; a true operand can prove an `any`. `otherwise` requires all expression branches false. An unresolved branch with an outcome different from the deciding outcome blocks a decision; an unresolved same-outcome branch need not block an already established outcome. Contradictory true outcomes fail closed. Do not describe every unknown as necessarily blocking every exemption, or allow unknown to fall through to required.

## 4. Context provenance, availability and negative knowledge

`regulierungsKontextLesen` accepts the following provenance contract. Provenance is a constrained input label, not verification of a document or a government register. No production caller currently feeds this context reader/evaluator. E9 can supply some ingredients to a later adapter, but that adapter is absent.

| Needed context | Permitted provenance | Existing account/trip ingredient | Explicit assertion and unknown/false boundary |
| --- | --- | --- | --- |
| Full citizenship set | `account_profile` or `trip_context` through `recordedContextProvenance` | Citizenship children exist. Preserve full sorted set, limit eight, and one explicit credential option at a time. | Recorded user data, not official verification. Empty set is unknown. Never retain CH while dropping another citizenship. |
| Credential type, issuer, explicit linked citizenship | Same recorded provenance | Trip/account documents and `citizenshipClientRef`; `documentCitizenshipCode` resolves the explicit link. | No separate `user_asserted` field on these base fields. Null link is unknown; link must belong to the full set. Issuer cannot create it. Do not pick a preferred passport. |
| Residence country | Same recorded provenance | `residenceCountryCode` exists. | A country value is not lawful entitlement, departure permission or origin. |
| Exact journey origin country | `trip_context` or `user_asserted` | Proven route itineraries can produce an origin country; no bridge to this context exists. | Missing origin is unknown. The inbound UK journey must be identified, not guessed from the first array item, residence, a transit country, names or raw IATA. |
| Age on travel date | `user_asserted` only | No age field in current traveller contract. | Null is unknown. Integer 0–120; no DOB. Future producer must bind/reconfirm against the relevant travel date. |
| Travel purpose | `user_asserted` only | No typed legal-purpose fact in traveller contract. | Missing is unknown; trip interests/title do not prove purpose. Unmapped legal categories cannot be collapsed into an enum. |
| Document class | `user_asserted` only | Passport type is available, class is not. | Missing is unknown. Passport does not imply ordinary, and ordinary does not imply national passport. |
| UK permission, each exact class | `user_asserted` only | No permission fact collection. | One matching row decides true/false; no row is unknown. `not_valid` is not inferred from an empty list or one expired document. |
| Irish lawful residence / departure | `user_asserted` only | Residence country alone is available. | Missing row is unknown; `not_entitled` or restricted departure can make the atom false. Actual residence/application time need the semantic closure above. |
| BOTC / BNO, independently | `user_asserted` only | No typed nationality-status fact. | `not_held` is explicit negative assertion; omitted status is unknown. |
| School status, group size, included, authority confirmation | `user_asserted` only for each fact | No school-party fact collection. | Null facts are unknown; explicit false inclusion/confirmation is false. Group context allows 1–500; predicate threshold 2–50, so five fits. No names or documents. |
| National-passport qualification; relevant application-time/passport relationship | No current dedicated contract | None proved by current fields | Cannot invent an allowed provenance or silently repurpose document class. A bounded contract decision is required. |

**A user assertion can support a conditional negative decision, not an official proof of absence.** To disprove the UK-permission exemption, the input must explicitly address absence of any valid permission in **each** of the two exact classes for the relevant date. One expired entry-clearance document does not prove there is no other valid one. The current evaluator mechanically interprets a class row marked `not_valid` as false; a future assertion surface must make the class-wide meaning explicit or retain unknown. For BOTC/BNO, explicit `not_held` has the analogous assertion boundary.

The evaluator preserves false deciding dependencies. An outcome depending on any `user_asserted` fact, including these negatives, is `context_asserted`; recorded-only deciding dependencies yield `context_recorded`. Neither label means independently verified. The reserved `official_document_verified` and `licensed_provider_confirmed` labels are not currently authorized. Other invalid field/provenance combinations also fail parsing; this record does not claim they all share one error code.

The context has no application date or travel-date binding of its own. `ageOnTravelDate` and permission validity names do not automatically refresh an assertion after the trip changes. Later runtime work must bind/invalidate relevant facts when date, journey, traveller or credential changes. The account registry can seed recorded facts; it must not silently overwrite the trip snapshot used for the current journey.

`routeFactsAusItineraries` uses validated itinerary truth and emits the first primary origin only when proved. That is potentially useful evidence. For a multi-leg, return or multiple-entry trip, a global origin is not necessarily the origin of the relevant UK inbound journey. Exact event selection plus traveller applicability is missing. #837 is an independent pending writer; its intended manual-route improvements are not evidence on this baseline.

Privacy boundary: global Official Truth contains source/rule/provenance data only. Compute traveller evaluation on read. Do not store passport/permit numbers, school names, DOB, MRZ, scans, biometrics, health data, context snapshots or a traveller-context fingerprint in global claims, provenance, logs, analytics or caches. The non-personal `rule-applicability:v1:` fingerprint is not permission to create `reg-eval-ctx:v1`.

## 5. Content identity prerequisites

E5 allows `sourceId: govuk` to remain the authority registry entry. `ContentItemRef = { sourceId, contentItemId }` distinguishes support units; representation/version/profile bindings distinguish a rendering and its verification. Two renderings of one item are not two independent supports. The legacy quality name `composed_from_multiple_primary_sources` now means composition across distinct content items, including two under one authority, with every support still `official_authority`.

| Property | Existing National List | Appendix proposal, not registered |
| --- | --- | --- |
| Source | `govuk` | `govuk` |
| Content item ID | `eta-national-list` | `eta-appendix` |
| External identity kind | `govuk-content-id` | `govuk-content-id` |
| GOV.UK content ID | `2b25b3d4-4eaa-4859-a34e-c7869c114c15` | `2620750b-5453-44f1-98af-414037c833be` |
| Representation ID | `content-api-en` | `content-api-en`, scoped to its different item |
| Exact request/final URL | `https://www.gov.uk/api/content/guidance/immigration-rules/immigration-rules-appendix-eta-national-list` | `https://www.gov.uk/api/content/guidance/immigration-rules/immigration-rules-appendix-electronic-travel-authorisation` |
| Schema / locale / media | `manual_section` / `en` / `application/json` | Same values, per E6's Appendix observation |
| Identity profile | `govuk-eta-national-list-content-api-en` v1 | `govuk-eta-appendix-content-api-en` v1, proposal only |
| Item/representation initial versions | Existing registered v1 bindings | Proposed v1 bindings; exact registration tuple needs its own audit |
| Expected publisher / authority | Home Office UUID, each exact singleton | `06056197-bc69-4147-aa28-070bca132178`, each exact singleton |
| Parent manual | Immigration Rules `87e2748f-2e9b-4681-8baa-778b6d326a8a`, `/guidance/immigration-rules` | Same recorded manual; not an extra ETA support |

E6 re-observed the Appendix on 4 October at `12:34:38.271Z`–`12:34:38.350Z`, 22,965 bytes, complete response SHA-256 `6859cfcacb44cc1287daa8daeedaf05a8b7f18e4ee638cfa7253e09f5d170037`. The National List was 7,788 bytes, hash `59a7fd6e7416f989ace351bc5ab4f562c52b3c5cab64fcbe861ea4a57ced1854`. These historical hashes are not new retrievals or permanent legal freshness guarantees.

E1's bounded Swiss candidate used the exact full citizenship set `['CH']`, UK destination and a canonical travel date on or after **2 April 2025**. An additional citizenship is a different cell, not permission to select CH silently. Missing or earlier dates must yield no positive fact, not `not_required`. The National List's `details.body` is HTML inside JSON: 83 list items, Switzerland once at index 81, with group (d)'s date in the mixed Uruguay item at index 48 after the Taiwan footnote. A future deterministic parser must bind that group structure and reject drift; JSON envelope parsing alone does not do so. Publication, update and retrieval timestamps cannot replace the travel threshold. These already-audited facts make a parser feasible, not selected.

The existing executable profile cannot safely verify the Appendix. It hard-pins the National List root/self-translation ID, path, exact URL, descriptor and profile ID. The Appendix was deliberately used as a real same-publisher **negative control**. The duplicate-aware bounded JSON parser can be reused as a helper; the National List verifier must retain its rejection of this sibling. A separate reviewed Appendix profile must pin its own root and self-translation, the Home Office publisher/authority relations, manual, locale, schema/type, phase and URL relationships. Registration is not authorized by copying a descriptor with a different ID.

The hardening migration also pins available profile tuples in private SQL. Code availability alone is insufficient for raw-RPC registration. A new Appendix registration audit, code-owned verifier and immutable database profile-pin addition must precede any separately approved Development registration and server reproof. Preserve exact `www.gov.uk` host checks; no descendant-host widening. No `db push` across the intentionally unapplied owner/reviewer migration.

For CTA, E7 selected the GOV.UK Content API guidance item `f841223e-d1ae-4a25-9783-bfa7b727ee11` at `https://www.gov.uk/api/content/government/publications/common-travel-area-guidance/common-travel-area-guidance`. It recorded `html_publication`, English, Cabinet Office publishing identity `96ae61d6-c2a1-48cb-8e67-da9d105ae381` and the five-member set `GB`, `GG`, `IE`, `IM`, `JE`. That is a source-audit result, not the National List identity profile and not an active pin. R2 now requires a full `ContentIdentityBinding` on a region pin. CTA therefore needs its own bounded identity qualification/profile/catalog path and server-reproved source binding before code-owned pin activation. Do not paste the five codes into runtime from this document. CTA membership evidence belongs to the region pin; it is not silently a third ETA rule support.

## 6. Composition: available mechanism, absent authorization

`OFFICIAL_TRUTH_COMPOSITION_POLICY_REGISTRY` is `Object.freeze([])`. The trusted-fact extractor registry is also empty. There is no ETA policy identity/version, no approved pair/fact/schema selection and no real extractor. The live composed path stops with `composition_policy_unavailable` before HTTP.

The current machinery can support the eventual pair:

1. Phase A selects exactly one current policy/extractor against the sorted distinct content-item set, fact kind, requirement type, source family and schema family. It pins the exact representations/URLs and freezes the pair before HTTP. The applicability schema is checked with the returned fact in Phase B.
2. The same-request server replays the v2 catalog/proof bindings and can fetch both distinct content items under `govuk`. Each fresh result must match its proof-bound identity, URL, media and source content hash. It is not allowed to look up an arbitrary sibling after a mismatch.
3. Phase B executes the frozen extractor through the canonical fact pipeline and validates every citation target and code-owned observation. Observations identify both `sourceId` and `contentItemId`; source-only observations are obsolete after R2.
4. Every branch has non-empty accepted `ev2_...` support IDs, the union covers all claim supports, and atom IDs stay inside their branch. A missing atom citation is inheritable only where unambiguous. Canonical atom locators, branch outcomes and `otherwise` all require exact reviewed assignments and coverage.
5. Observations must cover every assigned content item for each target exactly once with its canonical value. Missing, duplicate, unassigned or conflicting values fail closed. The module issues a private-class execution seal around the deeply frozen fact; a JSON object that looks like a seal is not one.

An eventual policy must assign the National List's positive nationality/date contribution and the Appendix's exemption/qualification contributions explicitly. A plausible division is Appendix support on exemption predicates/outcomes and National List support on the general positive requirement, with the complete branch set providing joint completeness. This is not a final assignment table: the semantic closure must establish which source actually states each canonical target. There is no fact-field slot on a branched requirement effect to hide missing scope provenance.

In particular, `relation: single_content_item` assigns one item; a multi-item assignment uses `equal_values` and must prove equal values for that target. The two bodies are complementary and cannot be globally labelled equal. “Same publisher”, a common manual link, or a copied citation ID is not the missing target observation. Do not stamp both IDs on every branch as a substitute for the legal mapping.

There is a further independent acceptance gap. `bedingungsHerkunftPruefen` still rejects **every branched composed fact** as `condition_provenance_ambiguous`, even though R2 permits distinct same-authority items elsewhere. #803 did not remove that blanket. E4 explicitly reserves two later bounded tasks: the pure acceptance citation checks and a server-only composer consuming the authentic seal. The former cannot prove policy execution; the latter must use the seal's exact fact reference and same-request proof-bound supports. Neither creates a second acceptance constructor, reads `kandidat.proposal`, or accepts a caller-supplied policy witness.

The seal view currently contains fact, policy ID/version and support IDs. Phase B returns richer citation provenance separately; the same-request result returns only its seal. Lossless downstream provenance therefore needs an explicit trusted handoff of the verified extractor/review-packet/citation identity. It must not be reconstructed from caller assignments or confused with the applicability fingerprint.

## 7. Persistence: the exact failing stages and minimum slice

Canonical schema-1 parsing and evaluation work in memory. That demonstrates the grammar, not a source-backed complete ETA rule. A valid explicit-primary schema-1 fact can also pass the sole acceptance function. A composed branched fact cannot: acceptance rejects it before the store's persistence guard is reached.

`akzeptierteRegelClaimSpeichern` calls acceptance first, then `persistierbarenClaim`. Every accepted schema-1 shape, including unconditional schema-1 facts, returns `applicability_not_persistable` **before** transport, service-client construction, payload construction and RPC. The focused existing store test confirms that order. It would be inaccurate to say that a complete two-item ETA input currently reaches that error: it first hits the composed-branch rejection.

SQL evidence is independent of the TypeScript guard. The requirement-effect table has flat `effect`/`visa_mode`; visa options have flat ordinal/mode/eligibility/mandate. The v2 RPC's exact-key validation, idempotent reconstruction and inserts preserve that flat form. Content identity and hardening add identity/support protections, not an expression tree, branch outcomes, atom citations or composition execution provenance. Flattening loses information and would alias different rules during replay.

The minimum later persistence contract is an applicability-aware extension to the existing accepted-claim store, not a second engine:

- Preserve the schema discriminator and canonical full `requirement_effect` payload: unconditional/branches, IDs, operators/predicates, outcomes and every branch/atom support reference. No flattening, even for schema-1 unconditional payloads.
- Use a private versioned companion payload with validated structure and constrained citation relations to the existing claim/support/Evidence keys, or an equivalent lossless typed layout. Reject foreign supports, wrong scope, illegal bounds and malformed shapes atomically. Keep legacy rows and their exact replay behavior intact. A free unchecked JSON column is insufficient.
- Carry immutable non-personal execution provenance from the trusted handoff: extractor pair, policy pair, review-packet key, content identity bindings, support IDs and canonical citation rows. Source hashes remain tied to accepted Evidence; do not add raw bodies or traveller context. A policy-version change must remain distinguishable even when the emitted fact is identical.
- Extend the existing store serializer, SQL validation/replay and a canonical reconstruction reader together. Round-trip through the existing semantic parser and compare the complete payload/provenance, including nested negation, explicit false-dependent branches and reordered canonical inputs. Preserve exact duplicate versus conflict behavior and transaction rollback.
- Retain the current guard for every unsupported fact/schema. The first slice can support only the requirement-effect shapes needed here; it need not widen visa-option persistence or other fact kinds. Remove the guard for that subset only with matching schema/runtime support and local disposable SQL proofs.

This is repository schema/runtime work followed by a separately authorized hosted apply. It is not performed here. Any provenance-retention decision beyond the already approved global non-personal source/evidence boundary requires Product-Owner review. Existing private-schema, RLS/FORCE RLS, ACL, immutability and service gateway protections must remain intact.

## 8. Blockers and the smallest ordered path

| Priority / ID | Blocker | What closes it |
| --- | --- | --- |
| P1-S | Incomplete ETA semantic contract: national passport, Irish actual-residence/application-time meaning, contradictory IE-origin mapping, application-category boundary | Reviewed source-to-predicate/scope map with unsupported cells failing closed; only the strictly necessary applicability contract delta |
| P1-I | Appendix identity/profile/catalog absent | Separate Appendix identity approval, verifier/profile pin, gated registration and reproof |
| P1-R | CTA membership source is proven but runtime pin/identity are absent | Reviewed CTA identity path and server-bound code-owned pin |
| P1-C | No ETA policy/extractor; generic composed-branch acceptance and seal consumer absent | Complete target assignment/observation contract, real deterministic family only after semantic prerequisites, existing acceptance/composer extensions |
| P1-P | No lossless applicability/provenance persistence | Bounded requirement-effect persistence slice and separately approved apply/readback |
| P1-T | No regulatory context producer/evaluation consumer | Exact traveller/journey/date/credential binding, truthful assertion semantics and invalidation; then read-only evaluation integration |
| P2-D | Historical audits are snapshots; source markup/date structure may drift | Explicit refreshed source-family selection before positive implementation selection; future deterministic drift tests, unchanged byte ceiling |
| P2-U | Assertion wording and unknown reasons could imply government verification or ask users to fix a missing region pin | Product review of assertions/labels; preserve `context_asserted`, unknown and machine-side pin errors |

The ordered sequence below is a dependency plan, not a dispatch. “Code/docs” means no new hosted/product permission is needed merely to prepare a reviewable dormant change; every row still needs its own bounded task and independent review. No fresh blanket foundation, authority split, provider integration or retrieval-limit increase is needed.

| Order | One bounded purpose and completion evidence | Authority / dependency |
| --- | --- | --- |
| 1 | **ETA semantic contract closure.** Correct the CTA reference country and age-duty mapping; define the smallest national-passport and Irish residence/time qualification contract; explicitly separate requirement from application/use eligibility and unsupported cells. Include the exact scope and complete source-to-target plan. | Docs; next recommended task only. Any new assertion collection/meaning is a separate PO product decision before its surface is enabled. |
| 2 | **Minimal applicability contract delta.** Implement only the unresolved qualifications in the existing parser/evaluator, with version/compatibility treatment decided in 1 and synthetic unknown/negative/date-change proofs. Keep runtime collection dormant. | Code/docs after 1. If the schema version changes, update the composition schema pin contract in this same bounded compatibility change; do not silently reinterpret schema 1. |
| 3 | **Appendix identity qualification.** Complete a registration/profile audit for the proposed tuple in §5, using explicitly authorized fresh observations if needed. | Docs after 1; current historical evidence is not automatic registration approval. |
| 4 | **Appendix verifier availability.** Implement its narrow code-owned profile and inert SQL profile pin with same-publisher negative controls; preserve National List v1. | Code/local tests after 3; no hosted registration. |
| 5 | **CTA identity qualification.** Reconcile #805's selected guidance with R2 and specify its exact profile/registration tuple, including the distinct publisher relations. | Docs; reuse existing source proof rather than repeat source discovery. |
| 6 | **CTA verifier availability.** Implement that bounded profile and inert SQL pin with identity negative controls. | Code/local tests after 5; no hosted registration. |
| 7 | **Development catalog expansion.** Apply only the reviewed new profile-pin SQL and register only the reviewed Appendix/CTA tuples; exact readback and independently named verifier; zero Evidence/Rule writes. | Explicit PO approval of the exact apply/registration packet after 4/6. Profile pins precede registrations. Existing hardening approval does not cover these writes. |
| 8 | **CTA region-pin activation.** Bind the reviewed member set to its server-reproved content identity/hash in the existing region registry, with missing/changed-identity negatives. | Code task after 7; activation must be expressly in that task. No ETA policy activation. |
| 9 | **Positive ETA source-family selection.** Check fresh, explicitly scoped source snapshots, the resolved semantic map, exact pair, target observations and complete fact against current code. Name the policy/extractor/schema identities only if that proof passes. | Audit after 1–8. Failure remains no selectable family. This is the earliest gate for a real extractor implementation; traveller assertions need not already be collected to implement a dormant parser. |
| 10 | **One deterministic ETA family.** Implement the reviewed pair parser and its inseparable code-owned composition assignments with adversarial fixtures and drift guards. Both sources must contribute exactly as approved; keep acceptance/store/Workspace disconnected. | Separate code task after positive 9; explicit policy/extractor activation scope required, no automatic activation from this audit. |
| 11 | **Composed-branch acceptance checks.** Replace only the blanket rejection inside `regelKandidatAkzeptieren` with generic complete citation checks using distinct content items, preserving the one canonical parser and human authority boundary. | Dormant code/local tests; E4's reserved acceptance slice. No policy witness parameter and no autonomous execution yet. |
| 12 | **Sealed composition consumer.** Add the server-only consumer of the authentic execution seal, same fact reference and bound supports, including a trusted lossless provenance handoff. | Code after 10/11; E4's separate composer task, not F8 and not a store write. |
| 13 | **Applicability-aware requirement-effect persistence.** Implement only the lossless contract in §7, including provenance handoff storage/reader and disposable SQL round-trip proofs. | Code/local migration after 12; retention decision, if needed, goes to PO. No hosted apply. |
| 14 | **Development persistence rollout.** Apply exactly the approved schema/runtime-compatible migration; verify privileges, lossless round-trip and legacy behavior without importing real ETA data. | Explicit PO apply approval after 13; independent readback. |
| 15 | **Ephemeral regulatory context adapter.** Feed the existing evaluator with recorded base facts, explicit assertions and the exact inbound journey/date binding; preserve unknown and re-confirmation rules. | Code after semantic closure; PO approval before new legal assertion collection or retention. No global personal context storage. |

Steps 11–15 describe what still separates an implemented dormant extractor from F8 and a truthful traveller result. They are not excuses to repeat the completed foundation or prerequisites for merely writing a parser in step 10. Their order is a safe serial delivery order; independent identity/acceptance preparation can be scheduled separately by the Technical Lead without widening any one writer's files.

Before F8, independently review the exact heads and all relevant identities, policy execution, sole acceptance, provenance, persistence and authorization boundaries. The intentionally unapplied owner/reviewer capability and any required human/autonomous authority must be resolved by its own approved gate, never by a broad migration push. A future F8 task must authorize its actual Evidence/Rule operations explicitly. Workspace integration is another task after an available, correctly contextualized result; Production apply, provider/model spending and launch remain separate PO gates. None follows automatically from a positive source-family verdict.

## 9. Explicit answers to the ten hard questions

1. **Are all #791 missing predicates present?** The named permission, residence, origin, status, age and school axes now exist. No, the full legal semantics are not all represented: national passport and residence/application-time meaning remain gaps, with application/use qualifications separately unresolved.
2. **Does a predicate prove today's traveller fact?** No. Most facts lack a producer; the permitted legal facts are user assertions, and the evaluator is not connected to production context.
3. **Can an assertion safely prove not holding UK permission/status?** It can explicitly supply a negative for conditional evaluation and must remain `context_asserted`. It cannot prove objective absence. No missing row or single expired credential justifies the class-wide negative.
4. **Can route context prove CTA journey origin without inference?** It can supply a proved origin for an identified itinerary. The current global projection is not a complete binding to the relevant UK inbound journey; that bridge is absent. Region interpretation additionally requires the pin.
5. **Is a CTA pin active?** No. The source audit succeeded, but `REGULIERUNGS_REGION_PINS` is empty. Known origin plus missing pin yields `region_membership_unpinned`, not a request to re-enter origin.
6. **Is Appendix identity registered?** No. Current code/Development receipt cover only National List; Appendix remains a proposed separate item/profile.
7. **Is the relevant composition registry non-empty?** No. There is no ETA policy, and no real extractor. Same-authority composition is structurally supported but unauthorized for this pair today.
8. **Does persistence preserve branches?** No. Composed branches fail acceptance first; accepted schema-1 facts fail the store guard; SQL cannot round-trip them.
9. **Can Workspace show a complete ETA rule today without lying?** It can show an honest unavailable/unknown state or clearly attributed research. It cannot show a complete trusted per-traveller required/not-required decision from this pipeline. `requirementsProviderAus()` remains null.
10. **What must happen before F8?** The bounded semantic/identity/region/selection/policy/acceptance/composer/persistence and authority prerequisites above, with context readiness before a traveller-facing outcome and separate PO gates for hosted writes/product activation. This audit grants none of them.

## 10. Review boundary

No runtime, test, migration, registry, profile, region pin, source catalog, Evidence, Rule, provider or Workspace behavior changed. No hosted database was accessed. The companion [REPORT](OFFICIAL_TRUTH_GOVUK_ETA_SEMANTIC_RECONCILIATION_2_REPORT_2026-10-05.md), [HANDOFF](OFFICIAL_TRUTH_GOVUK_ETA_SEMANTIC_RECONCILIATION_2_HANDOFF_2026-10-05.md), and [SELF_REVIEW](OFFICIAL_TRUTH_GOVUK_ETA_SEMANTIC_RECONCILIATION_2_SELF_REVIEW_2026-10-05.md) record local validation and delivery. Keep #839 Draft and stop for independent ChatGPT / Technical-Lead review of the exact delivered head. No follow-up implementation is started.
