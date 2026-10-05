# Official Truth applicability schema 2 — activity/stay qualification architecture 1

Date: 5 October 2026 · Issue [#850](https://github.com/Jetnity/jetnity/issues/850) · Draft PR [#851](https://github.com/Jetnity/jetnity/pull/851) · Generation 1

Status: **PROPOSAL / NOT IMPLEMENTED — DOCS ONLY**

## 1. Decision and exact boundary

**APPLICABILITY_SCHEMA2_ACTIVITY_STAY_ARCHITECTURE_READY**

Applicability schema **2 is necessary** for this bounded contract. Schema 1 has neither activity-characteristic nor planned-duration atoms, and its passport/citizenship link does not establish national-passport character. Adding these meanings under `schema: 1` would change strict parsing, the context contract, supported vocabulary and fingerprints without a version boundary. Changing a purpose label to mean “unpaid”, treating an issuer as citizenship, or adding conditions to free text would lose information.

The smallest selected delta is three new predicate kinds: `activity_characteristic`, `planned_stay_duration`, and `national_passport_for_citizenship`. Existing boolean expression operators and branch resolution remain. A small separately versioned temporal event-deadline form is necessary because current minute offsets cannot preserve strict “before actual permission expiry”. Bounded v2 carriers for qualified stay and temporal facts prevent those qualifications from being discarded at the fact boundary. No general legal-expression language, generic attribute path, arbitrary event selector, country-specific atom or executable condition is introduced.

All new identifiers, types, enum values, domains and illustrative shapes in this document are **PROPOSAL / NOT IMPLEMENTED**, including references to a future v2 reader. Existing symbols are explicitly called “current” or “v1”. Type notation is a reviewable specification, not a source-code change or an implemented schema.

READY means only that a later, separately versioned Technical-Lead dormant implementation slice **may be considered**. It is not a source-family readiness result, legal-rule acceptance, implementation dispatch, PR Ready state or permission to activate anything. The wider UK audit remains incomplete; the Japanese audit's source identity, document scope and extension conflicts remain open.

Baseline read: `main@2f27956cc9fd4289d30f258a5ee8eeaaa60aafec`. Immutable task seed: `63c961520235a11d359486a4d49d6e94f99ba5a2`; TASK blob: `03dd34fa70e7f04640b2d33b0d6656a91c06a556`. [Binding task](OFFICIAL_TRUTH_APPLICABILITY_SCHEMA2_ACTIVITY_STAY_ARCHITECTURE_1_TASK_2026-10-05.md) and [TL dispatch](https://github.com/Jetnity/jetnity/pull/851#issuecomment-6001156311) control scope.

## 2. Live implementation and evidence basis

| Read at baseline | Observation that constrains the design |
| --- | --- |
| `lib/readiness/regulierungs-anwendbarkeit.ts` and its tests | `REGULIERUNGS_SCHEMA=1`; strict exact keys; depth 4, nodes 16, operands 8, branches 8; explicit unknown; provenance-aware negative facts; conflict rejection; `otherwise` requires all expression branches false. No activity, planned duration or national-passport atom. |
| `lib/readiness/traveller-kontext.ts`, `provider.ts` | One credential option per document; explicit `citizenshipClientRef` resolves to related citizenship. Issuer is separate. Legacy import supplies no link. Request start/end are whole-Trip dates. No new activity, duration, class or national-passport producer exists here; `requirementsProviderAus()` still returns null. |
| `lib/readiness/temporal.ts` | Only four travel anchors: departure, destination arrival, transit arrival, border crossing. `before` requires positive minutes; `at` requires zero. No actual permission-expiry anchor or strict zero-offset-before relation. |
| `lib/readiness/rule-claims.ts` | Canonical fact parser; v1 applicability only on effects/visa options. `stay_limit` retains days/months/years but cannot carry applicability, grant-event identity or extension deadline. `regelKandidatAkzeptieren` remains the sole acceptance constructor. Composed branch claims are blocked as `condition_provenance_ambiguous`. |
| `official-truth-trusted-fact-extractor-registry.ts` | Code-owned `schemaFamily`, extractor id/version, representation and policy pins; canonical fact reader reused. Registry is empty. It does not currently expose an explicit applicability-schema property on extractor definitions. |
| `official-truth-composition-policy-registry.ts` | Explicit `applicabilitySchema: 1 \| null`, support-free expression structure keys, field/branch/atom citations and `joint_complete_fact`; registry empty. `schemaPin()` only recognises effects/visa options with schema 1. |
| `official-truth-store-server.ts` | Current flat store rejects every schema-1 effect/visa-option fact, even unconditional. Other fact kinds presently pass that type guard because they have no versioned qualification. Any future v2 stay/temporal fact must therefore be rejected explicitly before transport, not admitted through the catch-all. |
| [#845 audit](OFFICIAL_TRUTH_GOVUK_ETA_CLAUSE_COMPLETE_PRIMARY_SOURCE_AUDIT_1_2026-10-05.md), §§2–6 | Application versus requirement versus use are distinct. Irish never-applicant reference time is unresolved law; school relations and complete residual exemption coverage are not closed. A generic clock field cannot solve either gap. |
| [#849 audit](OFFICIAL_TRUTH_JP_FIRST_PILOT_SOURCE_AUDIT_1_2026-10-05.md), JP-A02–A08/A13 and §5 | Activity terms are not purpose synonyms; intended duration, initial landing grant, extension total, expiry and visa-entry validity differ. National-passport linkage is material. Six months and a further 90 days must not be equated. |
| [#294](https://github.com/Jetnity/jetnity/issues/294), target architecture, [#741](https://github.com/Jetnity/jetnity/issues/741) | Full checklist per traveller/credential/route/date; no default passport or citizenship; minimal PII; deterministic truth gates. #741 supplies gate context, not authority for F8 or this implementation. |

Current code wins over older architecture summaries. In particular, v1 citizenship linkage already exists; this design does not invent a replacement relationship. The existing context parser accepts only user assertions for several legal/status fields, even if account data could eventually record them. Persistence does not upgrade assertion provenance.

A bounded source spot-check on 5 October 2026 reconfirmed the relevant text: [MOFA FAQ, before-application Q1](https://www.mofa.go.jp/j_info/visit/visa/faq.html) couples an income-activity restriction with a duration threshold; [MOFA short-stay list, stay paragraph and Note 8](https://www.mofa.go.jp/j_info/visit/visa/short/novisa.html) distinguishes landing duration, extension total and expiry; [Japanese VISA page, short-stay section](https://www.mofa.go.jp/mofaj/toko/visa/index.html) separates business operation and remuneration. These reads are research corroboration, not body-hash receipts, accepted Evidence or proof of Jetnity server retrieval. The prior audits remain the clause-level evidence inventory; no new legal interpretation or source registration is claimed.

## 3. Version domains, outer binding and wire contract

Version domains are independent:

| Domain | Selected proposal | Compatibility rule |
| --- | --- | --- |
| Applicability / fact carrier | integer `schema: 2` | Inner applicability must also be 2; no mixed v1/v2 tree. |
| Personal regulatory context | integer `schema: 2` | Required for v2 evaluation. No automatic cast from v1. |
| Decision trace | integer `schema: 2` | New predicate kinds and reason codes; remains non-personal. |
| Temporal rule | integer `schema: 2`, `kind: 'event_deadline'` | Separate from current unversioned `relative_duration`. |
| Content identity | existing `identitySchema: 2` | Unchanged; this is **not** applicability schema 2. |
| Rule scope / source identity / Evidence | current domains | Unchanged by this architecture; no data conversion. |

Each evaluation binds exactly one traveller, selected credential option and one actual jurisdiction visit. Those process-local references live in the trusted caller envelope, not in global Rule facts. A destination visit and a transit entry are different cells; repeated entries are different visits. No full-Trip aggregate, first document, last permission or best-looking result may be silently selected. An unresolved selection is a binding failure, not a context with invented values.

The new context retains every current `RegulierungsKontext` field with its current meaning, except the explicit schema discriminator, and adds exactly:

```text
RegulierungsKontextV2 = existing v1 fields with schema = 2, plus:
  visitCountryCode: CountryCode | null
  activityCharacteristics: ActivityAssertionV2[]
  plannedStay: PlannedStayV2 | null
  nationalPassport: { value: boolean, provenance: 'user_asserted' } | null

ActivityAssertionV2 = {
  characteristic: ActivityCharacteristicV2,
  value: boolean,
  provenance: 'user_asserted'
}
ActivityCharacteristicV2 =
  'remunerative_activity' | 'income_earning_activity' |
  'profit_making_business_operation' | 'business_contacts'

NewPredicateV2 =
  { kind: 'activity_characteristic', characteristic: ActivityCharacteristicV2 }
  | { kind: 'planned_stay_duration', comparison: 'at_most' | 'more_than',
      duration: StayQuantityV2, counting: StayCountingV2 }
  | { kind: 'national_passport_for_citizenship', countryCode: CountryCode }

StayQuantityV2 = { value: integer, unit: 'days' | 'months' }
StayCountingV2 =
  'unspecified' | 'calendar_dates_inclusive' | 'calendar_dates_exit_exclusive'
```

All new keys are mandatory, using explicit `null`/empty arrays for unknown, never omission. `visitCountryCode` is a canonical recorded route fact; the future binder must match it to the exact RuleScope jurisdiction before any v2 evaluation, including unconditional facts. Null yields `insufficient_context / visit_scope_missing`; mismatch yields `blocked / scope_mismatch`. It is never derived from residence, citizenship or issuer. A pure parser can validate the value but cannot confer route/ownership authority.

The v1 predicate union remains available unchanged inside v2, including its existing country-specific legacy values; no new source-specific vocabulary is added. Those old atoms do not become clause-complete UK semantics through inclusion in v2. Expression wire shapes remain `atomic`, `all`, `any`, `not`; `atomic.supportVersionIds` remains optional structural citation data with the existing strict ID format. New atom semantics follow §§4–6.

For `requirement_effect` and `visa_options`, the v2 wire form is exactly the current schema-1 discriminated form with **both** schema literals changed to 2 and the predicate union extended. Effect outcomes still contain exactly `effect` and `visaMode`; visa-option outcomes still contain exactly `eligibility` and `mandate`. A branched effect has no top-level effect/visaMode; a branched option has no top-level eligibility/mandate. Existing visa-mode/requirement-type consistency rules remain. Empty or mixed shapes are invalid. At most four visa options; no duplicate mode.

## 4. Activity: separate characteristics, explicit negation

An activity assertion refers to the intended activities of this traveller over the **entire selected jurisdiction visit**, including mixed activities. `true` means at least one planned activity has the named characteristic; `false` is an explicit assertion that none does. The collection is not an exhaustive catalogue by default: an absent characteristic is unknown, even if every other characteristic is false.

| Characteristic | Preserved proposition | Forbidden shortcut |
| --- | --- | --- |
| `remunerative_activity` | Activity involving receipt of remuneration | Not equivalent to employment, local employer, salary destination or a `work` tag. |
| `income_earning_activity` | Activity earning income | Do not automatically equate with remuneration or actual profit. |
| `profit_making_business_operation` | Operation of a business for profit/income-generating business operation, where the exact source mapping is established | Actual accounting loss is not a negative; a business meeting alone is not a positive. Translation/mapping ambiguity blocks extraction. |
| `business_contacts` | Planned business contacts | Implies neither payment nor absence of payment; does not by itself establish permitted activity. |

These are intentionally independent propositions. No implication table is claimed between the first three terms. Each source-to-atom mapping must be proven by a later deterministic, source-specific contract; incompatible legal senses remain unsupported. The atom is not an algorithm for deciding whether a particular foreign salary, remote work, honorarium, expense reimbursement, unpaid internship or mixed activity is legally remunerative. Such a classification cannot be invented from a job title or financial data.

The atomic predicate asks whether its named characteristic is present. Prohibition is expressed with the existing `not` operator. Thus `not(remunerative_activity)` evaluates true only on explicit false, false on explicit true, and unknown on no declaration. There is no separate `unpaid`, `no_work`, `is_tourist` or free-text predicate. `travelPurpose=business` and `business_contacts=true` with all three economic characteristics false is coherent; so is a visitor purpose with remunerative activity true. The latter may fail a rule, but is not an internally contradictory context.

Only fresh, explicit, visit-bound `user_asserted` provenance is admitted initially for all four characteristics. An account occupation/profile, commercial itinerary label, booking, model suggestion or silence is not a producer. If an assertion is later recorded, it remains `user_asserted`; copying it into Trip/account storage cannot relabel it `trip_context`/`account_profile`. Current code has no authorized producer; missing fields stay unknown until a separate producer/binding slice is approved.

Duplicate same-characteristic/same-value/provenance entries canonicalize to one after raw bounds checking. Both true and false for one characteristic are `context_conflict`, detected before short-circuit evaluation. No most-recent-wins arbitration inside the evaluator; the future authorized producer must supply one current revision. Conflicts in any supplied context field block the context, even if an unrelated branch would be true.

## 5. Planned stay: quantity and calendar facts without conversion

Planned duration belongs in applicability **only when the official clause qualifies applicability by intended duration**. It is not obtained from a legal maximum, intended visa validity or the eventual permission grant. The new context describes a single continuous visit, not accommodation nights, all destinations combined, a rolling allowance or a count of past trips.

```text
PlannedStayV2 = {
  dates: {
    arrival: { value: CivilDate, provenance: 'user_asserted' | 'trip_context' } | null,
    departure:
      { kind: 'date', value: CivilDate, provenance: 'user_asserted' | 'trip_context' }
      | { kind: 'unknown' }
      | { kind: 'open_ended', provenance: 'user_asserted' }
  },
  declaredDuration: {
    value: StayQuantityV2,
    counting: StayCountingV2,
    provenance: 'user_asserted'
  } | null
}
CivilDate = valid proleptic-Gregorian YYYY-MM-DD, years 0001..9999
```

`plannedStay=null` means no stay context. Within a context, arrival null means unknown arrival. `departure.kind=unknown` means no known departure date; `open_ended` is an explicit plan with no finite end, **not infinity and not a missing field**. Unknown dates can coexist with an explicit finite declared duration. Open-ended intent plus any finite declared duration is `context_conflict`; closing the plan requires an explicit new revision.

`declaredDuration` is an assertion of the intended jurisdiction-stay quantity **in the rule's unit and counting convention**. It is not an asserted legal eligibility answer. `counting=unspecified` retains the source's unelaborated day/month quantity and permits only a matching direct quantity assertion. It never licenses date arithmetic. With a named counting convention, the declaration must use that exact convention. Units/conventions cannot be relabelled merely to make a comparison succeed.

For `planned_stay_duration`, `at_most` means `<=` and `more_than` means `>` on the same known unit and counting convention. No fuzzy equality, rounding, tolerance or inferred inclusive legal limit. These two comparisons suffice for the observed thresholds; general arithmetic, arbitrary formulae and ranges are excluded.

Evaluation algorithm, in order:

1. Validate the complete context and its selected-visit binding. A known departure before known arrival is `context_conflict`. If a declared day quantity has a named counting convention and both dates exist, compute under **that declaration's convention** and reject a mismatch before evaluating any rule, even one using a different convention. Invalid dates, negative/non-integer values and unknown enum values are parse failures. No rollover correction.
2. Open-ended departure yields unknown for either comparison. Do not conclude `more_than=true`; a traveller can still change an open plan.
3. A declared duration is a candidate only when **both** unit and counting convention match the predicate. Unknown arrival/departure do not invalidate that direct asserted candidate.
4. Derive a second candidate only from two actual local civil dates for the selected jurisdiction visit, for a `days` predicate with an explicit named counting convention. Let `D` be the Gregorian ordinal departure minus arrival. `calendar_dates_inclusive` gives `D+1`; `calendar_dates_exit_exclusive` gives `D`. No timestamps, UTC conversion, DST or machine clock participate. The source must explicitly support that convention before a rule can use it.
5. No month calculation from dates in this version. No day/month or year/month conversion. A months predicate can use only a matching declared months quantity with `counting=unspecified`. Neither Jan 31 + one month nor six months = 180 days is defined here.
6. If both candidates exist and differ, block with `context_conflict`. If equal, both remain dependencies (assertion provenance is not hidden). If neither exists, return unknown with the exact gap below; otherwise compare the sole/equal quantity.

An unelaborated source threshold remains representable while date-only evaluation remains unknown. This separates lossless storage of a legal quantity from an unsupported legal counting algorithm. A user's matching declared quantity yields at most an assertion-bound result, never official verification of how dates count.

| Available input | Permitted use |
| --- | --- |
| Whole-Trip `startDate/endDate` | Calendar facts only. Must not be treated as destination entry/exit. Return flight date may differ from local exit date. |
| Single-country Trip | Still no automatic mapping; exact entry/exit and completeness must be established by the later binder. |
| Local entry/exit tied to one complete jurisdiction visit | Named day-count convention may derive a quantity; retain input provenance. |
| Hotel check-in/out or nights | Not proof of the full visit, landing grant or permitted stay. |
| Month quantity | Retain months exactly. No whole-month rounding or UTC-minute conversion. |
| Partial dates, open-ended plan, date-line ambiguity, re-entry ambiguity | Unknown or binding failure; never a guessed small duration. |

Bounds are technical, not immigration limits: thresholds 1..3660 days or 1..120 months (matching the current quantity maxima); context quantities 0..3660 days or 1..120 months. Zero days is useful only for an explicitly exit-exclusive same-date visit or a direct assertion under that convention; zero under other conventions is invalid. A known ordinal date difference D greater than 3660 fails the context bound. A derived candidate greater than 3660 also fails with `bound_exceeded`, so D=3660 is representable exit-exclusive but not as a 3661-day inclusive candidate. Never clamp. Days counting conventions require `unit=days`; months require `unspecified`.

Gap precedence after context validation: `planned_stay` if absent; `planned_stay_open_ended` if open; `stay_unit_mismatch` if a declaration exists only in a different unit and no candidate can be derived; `stay_counting_convention` for incompatible/unspecified counting with no matching direct declaration; otherwise `planned_stay_dates` for incomplete date facts. All produce unknown; none produces a legal negative.

## 6. Citizenship, presented document and national passport

The existing resolved relationship is retained:

`TripTravellerDocument.citizenshipClientRef` → one recorded citizenship → credential `relatedCitizenshipCountryCode`.

That relationship is sufficient to identify **which recorded citizenship is associated with the selected document**. It is not sufficient to say the document is a national passport issued on that citizenship basis. Accordingly, the one additional personal fact `nationalPassport` means: “this selected document is a national passport based on its explicitly related citizenship”. It is not document authenticity, legal validity, passport possession, or permission to use it. With no related citizenship the assertion may remain true as an incomplete assertion, but the country-specific predicate stays unknown; no country is supplied implicitly.

`national_passport_for_citizenship(C)` is the three-valued conjunction of:

1. known `credential.documentType=passport`;
2. known inclusion of C in the traveller's recorded citizenship set;
3. known `credential.relatedCitizenshipCountryCode=C`;
4. explicit `nationalPassport.value=true`.

Known non-passport type, explicit false national-passport assertion, or a known different link makes that limb false. Missing type, citizenship inclusion not positively recorded, absent link or absent national-passport assertion makes that limb unknown. The new composite does not derive citizenship absence from a partial list. Apply the same strong three-valued conjunction as §8; e.g. known national ID is false even if other limbs are missing. The inherited v1 `citizenship_includes` atom retains its original nonmembership behavior when used explicitly, but that behavior is **not** proof that every legal nationality/status alternative has been excluded. No residual legal rule is created from it.

`ordinary national passport of C` is `all(national_passport_for_citizenship(C), document_class(ordinary))`. Issuing country is a separate conjunct **only if the source requires it**. A source requiring a valid passport also needs the separately supported validity condition/fact; national-passport character alone never supplies validity. A same-passport-at-application-and-travel rule needs application/document-instance binding outside this slice; citizenship linkage cannot substitute.

| Fact | Meaning and non-default rule |
| --- | --- |
| Citizenship | Traveller's citizenship set, not residence or issuer. Preserve multiple citizenships. |
| Issuing country | Issuing jurisdiction; cannot infer citizenship or national character. Issuer/link inequality alone is not an invented universal contradiction. |
| Related citizenship | Existing explicit selected-document relationship; unlinked second passport remains unlinked. |
| Document type | Current `passport / national_id / unknown / null`; `passport` alone says no class. |
| Document class | Current `ordinary / diplomatic / official / emergency / refugee_travel_document / laissez_passer`; missing remains null. No ordinary default. |
| National passport | New explicit assertion of national character on the linked citizenship; no passport number or scan required/proposed. |

Emergency passports can be national passports without being ordinary. Diplomatic/official national passports must not match `ordinary`. Refugee travel documents and laissez-passers must not be asserted as national passports: that combination is `context_conflict`. A known `national_id` with nationalPassport true is also a conflict. These are categorical consistency checks, not a global recognition table. The current enum does not losslessly represent overlapping class taxonomies, all service/special passport classes or every territory/nationality status; such cases remain unsupported, not coerced to `official`/`ordinary`.

All new national-passport assertions initially retain `user_asserted` provenance. The current recorder's country/link values retain `recordedContextProvenance`. Neither assertion nor account storage is an `official_document_verified` claim. Later typed intake and same-option binding remain separate gates; the existing provider/Traveller/Workspace contracts are not modified here.

## 7. Permission expiry, reference time and qualified fact carriers

### 7.1 Separate event deadline

The current `OfficialTemporalAnchor` is insufficient. Adding `permission_expiry` to its enum alone would still force a positive minute offset for “before” or an inclusive “at” deadline. Neither preserves a strict deadline with no stated lead time. The minimal new temporal form is:

```text
EventDeadlineV2 = {
  schema: 2,
  kind: 'event_deadline',
  action: 'stay_extension_application',
  reference: { event: 'current_stay_permission_expiry', countryCode: CountryCode },
  relation: 'before',
  semantics: 'mandatory' | 'recommended'
}

PermissionExpiryContextV2 = {
  schema: 2,
  visitCountryCode: CountryCode,
  permissionState: 'unknown' | 'not_yet_granted' | 'recorded',
  expiry: {
    value: { kind: 'instant', at: UtcInstant }
      | { kind: 'civil_date', on: CivilDate },
    provenance: 'user_asserted'
  } | null
}
UtcInstant = valid YYYY-MM-DDTHH:mm:ss.sssZ, years 0001..9999
TemporalObservationV2 = { referenceTime: UtcInstant }
```

The exact event is expiry of the **actual permission governing this same current stay**, not visa expiration, intended exit, maximum possible extension, initial grant duration, a past permit or the first permission record. The future binder must establish an unambiguous permission instance and current revision in process before exposing this normalized context. Multiple unresolved grants, supersession, revocation, a foreign jurisdiction or unrelated visit block binding. This specification does not infer that an expired permit is still valid: it may supply the historical expiry of the permission governing the selected stay for deadline assessment only.

`unknown` or `not_yet_granted` requires expiry null; a supplied expiry in those states is a context conflict. `recorded` allows null when the expiry is missing. User-recorded permission data remains assertion provenance; no official-document verification mechanism or persistent permit identifier is added. `destinationPermissions.validity=valid_on_travel_date` is not an expiry producer.

`TemporalObservationV2.referenceTime` is captured once by the future trusted server caller for the request. The pure evaluator accepts an explicit instant and reads no clock; untrusted API callers cannot appoint an authoritative clock by naming this field. It is an observation time used to assess the deadline window, not the legal application time, travel date, evidence retrieval time, publication date or law-effective date.

Exact semantics:

- Matching jurisdiction + bound actual permission + known instant expiry E + known observation instant T: window is `open` iff T < E; `closed` iff T >= E. Equality is closed. This reports the remaining window, not completion/noncompletion of an application and not lawful/unlawful stay.
- Date-only expiry is retained without conversion. No midnight, end-of-day, timezone, one-minute safety margin or “one day before” is invented. Window projection is `insufficient_context / permission_expiry_precision`; this version does not resolve date-only cutoffs.
- Missing/ungranted permission yields `permission_event_missing`; recorded permission with null expiry yields `permission_expiry`; missing trusted observation yields `reference_time_missing`. These are unknown/projection gaps, not a pre-travel visa obligation or exemption failure.
- A future application event is not required merely to evaluate whether a window is still open. Whether an application was timely actually filed is deliberately unsupported; it would require the separately bound filing event and the source's definition of filing/receipt.

There is no arbitrary `eventName`, free-text selector, offset, inferred permission grant or reference-time substitution. Existing `relative_duration` facts retain their old parser/meaning. The new event form neither rewrites them nor changes the current temporal projection/UI. The UK no-application question in #845 stays legally unresolved: a syntactically available observation time cannot supply a missing official reference event or decide what the qualifier time-binds.

### 7.2 Lossless qualification of stay and temporal facts

Applicability cannot live only on the visa-effect fact while related stay output quietly becomes unconditional. Two additional **fact carriers**, not additional predicates, are specified:

```text
StayOutcomeV2 = {
  perVisit: StayQuantityV2 | null,
  initialGrant: {
    quantity: StayQuantityV2,
    event: 'permission_to_enter_granted'
  } | null,
  extension: {
    requiresApplication: boolean,
    maximumTotal: StayQuantityV2,
    applicationDeadline: EventDeadlineV2 | null,
    authority: { countryCode: CountryCode, role: 'immigration_authority' } | null
  } | null,
  borderDiscretion: 'fixed' | 'may_be_shorter' | 'determined_at_border'
}

QualifiedStayFactV2 =
  { kind: 'stay_limit', schema: 2,
    applicability: { schema: 2, kind: 'unconditional' }, outcome: StayOutcomeV2 }
  | { kind: 'stay_limit', schema: 2,
      applicability: { schema: 2, kind: 'branches', branches: BranchV2<StayOutcomeV2>[] } }

QualifiedTemporalFactV2 =
  { kind: 'temporal_rule', schema: 2,
    applicability: { schema: 2, kind: 'unconditional' }, outcome: EventDeadlineV2 }
  | { kind: 'temporal_rule', schema: 2,
      applicability: { schema: 2, kind: 'branches', branches: BranchV2<EventDeadlineV2>[] } }

BranchV2<T> = { id: BranchId, when: ExpressionWhenV2 | { kind: 'otherwise' },
  outcome: T, supportVersionIds: EvidenceVersionId[] }
ExpressionWhenV2 = { kind: 'expression', expression: ExpressionV2 }
```

`ExpressionV2` has the v1 operator shapes with v2 predicate union; `BranchId` and `EvidenceVersionId` use the current regexes and bounds. Unconditional versus branches is an exclusive union; nested or top-level duplicate outcomes are invalid. At least one stay quantity slot is non-null. All quantities use the positive threshold bounds, never zero. If initialGrant/perVisit/maximumTotal can be compared in the same unit, a stated maximum smaller than its corresponding initial/per-visit quantity is an invalid outcome; mixed units remain unconverted. A deadline requires `requiresApplication=true`. Country on a deadline/authority must equal the bound claim jurisdiction. Authority null means unrepresented/unknown, not that no authority is involved; it prevents a complete fact whenever the source makes that authority material. No named office/location is invented from the role.

This is intentionally limited to single-visit day/month statements. Existing legacy rolling-window/year facts remain readable as legacy facts; they cannot be copied into this v2 stay shape. Unsupported mandatory rolling, class, filing method or authority qualifiers block a complete v2 fact instead of disappearing into null. No generic payload escape hatch is allowed.

The event attached to an initial-grant quantity records **what legal grant the published quantity describes**. It does not assert that this traveller received that quantity or that grant and arrival are the same timestamp. Border discretion remains independent. `maximumTotal` is a total under the extension arrangement, not additional duration, automatic entitlement or already granted permission. A deadline embedded in an extension describes that procedure; to decide whether this traveller must apply, the source's planned-duration condition must also be present in a qualified temporal branch. A future parser must not project every embedded deadline as a currently due obligation.

For the observed shape, one can retain an initial 90-day grant and a six-month extension total as distinct quantities and attach a before-expiry application deadline. A `planned_stay_duration(more_than, 90 days)` branch can qualify the application duty. This shows representability, **not** that the entire Japanese extension rule is source-closed: the general ISA caveat and further-90-day wording still block a complete accepted fact. No `otherwise required` or automatic six-month permission follows.

## 8. Parsing, three-valued evaluation and conflicts

### 8.1 Bounded strict parsing

V2 accepts plain JSON data only. Reject functions, expressions-as-strings, regexes, cyclic objects, accessors, symbols, prototype keys and unknown keys before evaluation. No unbounded recursive pre-scan: walk at most 8,192 values and 16 container levels, with at most 65,536 UTF-8 bytes at a future serialized ingress. These total caps include context and fact; a limit failure is `bound_exceeded`, never truncation. Serialized ingress must reject duplicate object keys before ordinary JSON object construction can overwrite them. The in-memory reader cannot detect a value that a caller already overwrote and makes no such claim.

The existing tighter expression bounds still apply **both before and after normalization**: depth 4 (atomic root depth 1), 16 nodes per expression, 8 operands, 8 branches, 4 visa options, at most 8 support IDs per set and per claim. No bound is raised to fit a source; an oversized conjunction is unsupported. Activity assertion array: at most 8 raw entries and 4 distinct characteristics; no truncation. One stay object, one selected credential, one expiry context per evaluation. Current citizenship/permission/residence/status/school limits remain unchanged. Country values use current canonical country-code validation. Date syntax alone is insufficient: validate month/day/leap year and range. Finite exact integers only; no coercion from numeric strings, negative zero, NaN or Infinity.

Required fields must exist. Null is accepted only at the nullable slots defined here and in the preserved v1 contract. Empty arrays mean no known records, not negative evidence. Unknown schema/version/kind/value fails closed as `unsupported_version` or `invalid_fact` with no fallback to legacy/unconditional. V2-only keys under v1 are rejected; unsupported raw data must never be “cleaned” by dropping keys into a valid v1 fact.

Normalization retains v1's sort/dedup, same-operator flattening and double-negation removal. No distributive expansion, implication inference, De Morgan rewrite, unit conversion or replacement of activity concepts. Branch IDs sort lexicographically; IDs are not evaluation priority. Identical support rows dedup only after raw bounds checks. Any unknown required source condition remains a fact-production block, not a nullable hole accepted as a complete rule.

### 8.2 Truth algebra and branch result

| A | NOT A | ALL(A, unknown) | ANY(A, unknown) |
| --- | --- | --- | --- |
| true | false | unknown | true |
| false | true | false | unknown |
| unknown | unknown | unknown | unknown |

`all` is false if any valid operand is false, true if all are true, otherwise unknown. `any` is true if any valid operand is true, false if all are false, otherwise unknown. Decisive short-circuit dependencies are retained; irrelevant missing facts do not override a decisive logical result. **Context validation/conflict detection occurs first**, so short circuit cannot hide contradictory assertions.

Retain the current branch algorithm:

1. Evaluate all expression branches against the same validated context.
2. Two true branches with unequal complete outcomes yield `insufficient_context / branch_conflict`. No priority winner.
3. One or more true branches with equal outcomes can decide only if no unknown branch has a different possible outcome. Equality includes every quantity unit, event/deadline and discretion field, not just an effect label.
4. If no branch is true and any branch is unknown, the result is insufficient context.
5. `otherwise` is eligible only when **every** expression branch is explicitly false. Without an otherwise branch, all false means `no_applicable_branch`, never the opposite legal result.

The parser can check syntactic branches, not legal exhaustiveness. A future extractor/policy must prove the source supports every outcome and any otherwise branch. No negative is inferred from a missing country row, an incomplete exemption list, an expired individual permit or unsupported alternative route. Neither #845 nor #849 establishes a residual `required` branch.

Parser errors (`context_conflict`, invalid/unsupported versions, bounds, provenance violations) and binding errors (`scope_mismatch`, missing option/visit selection) return a blocked result with `outcome=null`. Evaluator unknowns return `insufficient_context`, also with null outcome. Contradictory source rules return a source/branch conflict; do not ask the traveller to fix inconsistent law. Missing personal facts and unresolved law remain distinct failure classes.

The exact result envelope is the current `RegulierungsAuswertung<T>` union with trace schema 2, expanded missing codes and one additional insufficient-context reason `visit_scope_missing`, plus `{status:'blocked', outcome:null, binding:null, missingFacts:[], reason: V2BlockReason}`. `V2BlockReason` is the current `RegulierungsLesefehler` union plus `unsupported_version`, `bound_exceeded`, `scope_mismatch`, `binding_missing`. A missing country on an otherwise bound visit is `insufficient_context` with reason `visit_scope_missing` and missingFacts `[visit_scope_missing]`; an unselected/ambiguous visit or credential is blocked/binding_missing. New parse results remain `{ok:true, wert:T}` or `{ok:false, reason:V2BlockReason}`. Successful branched results use reason `branch_matched`; other current reasons keep their meaning.

Temporal observation has a separate result union: `{status:'window_evaluated', window:'open'|'closed', binding:'context_asserted', missingFacts:[]}`; `{status:'insufficient_context', window:null, binding:null, missingFacts:TemporalGap[]}`; or `{status:'blocked', window:null, binding:null, missingFacts:[], reason:V2BlockReason}`. `TemporalGap` is exactly the four permission/reference codes in §8.3. The observation argument may be null to represent a missing trusted observation; a non-null malformed observation is rejected. The future boundary checks fact/context schemas and jurisdiction first, then permission state/expiry, then precision, then trusted observation time. It never returns `required`, `not_required`, application-complete or lawful-stay status. Raw source production/review failures are upstream gates and are not new personal-context statuses.

### 8.3 Missing-fact and provenance contract

The new missing codes are the following closed vocabulary, in addition to current v1 codes:

```text
visit_scope_missing
activity_remunerative_activity
activity_income_earning_activity
activity_profit_making_business_operation
activity_business_contacts
planned_stay
planned_stay_dates
planned_stay_open_ended
stay_unit_mismatch
stay_counting_convention
national_passport_status
permission_event_missing
permission_expiry
permission_expiry_precision
reference_time_missing
```

For a national-passport predicate, collect the missing codes of its non-decisive unknown limbs: existing `nationality`, `document_type`, `credential_citizenship_link`, plus `national_passport_status`. Activity gaps identify the exact characteristic. All code arrays are unique and lexicographically sorted. Parser/binding conflicts are not mislabeled as missing facts. Temporal gap codes belong to the event projection result; they cannot contaminate a decided pre-entry exemption result that does not depend on that event.

The v2 trace retains current dependency fields `predicateKind`, `provenance`, `polarity`, with the new kinds and schema 2. `polarity` is the value of the underlying evaluated atom **before NOT**, matching v1. A true `not(activity_characteristic)` therefore records an asserted false atom. Duration derived from two date facts retains both dependency provenances; a matching declaration cannot be dropped to claim a fully recorded result. National-passport evaluation retains both recorded link/citizenship and asserted national-character/class dependencies when decisive.

Any decisive `user_asserted` dependency makes binding `context_asserted`; otherwise recorded dependencies make `context_recorded`; an unconditional rule may have binding null after successful outer scope binding. No `official_document_verified`, `licensed_provider_confirmed` or model-authority provenance is introduced. The current v1 trace's minimal non-personal vocabulary is preserved: no actual dates, passport/citizenship values, permit numbers, traveller/Trip IDs, user names, activity answers or derived personal duration enters a global Rule or public trace.

## 9. Fingerprints, compatibility and pins

### 9.1 Versioned canonical identities

Keep all v1 bytes and fingerprints unchanged. The existing `rule-applicability:v1:` domain is never used for v2, even for a structurally equivalent unconditional rule.

Proposed v2 domains:

- `rule-applicability:v2:` + lowercase SHA-256 of normalized applicability JSON, including schema, branch IDs, predicates, full outcomes and all support sets.
- `official-temporal:v2:` + lowercase SHA-256 of the exact normalized `EventDeadlineV2` JSON.
- `official-rule-fact:v2:` + lowercase SHA-256 of the complete normalized v2 fact carrier. This is necessary because an unconditional applicability fingerprint alone does not cover its top-level outcome. It is not an acceptance capability or a replacement for scope/Evidence identity.

For v2 canonical JSON, object keys sort by ASCII code point at every level; arrays retain semantic order except explicitly set-like collections. Branches sort by ID; support IDs sort/dedup; all/any operands normalize and sort by their canonical serialized subtree; visa options sort by visaMode. Required nulls remain null. Integers use JSON decimal notation after validation. No whitespace, Unicode normalization, locale collation, timezone conversion or day/month conversion is applied. Hash UTF-8 bytes. The support-free v2 structure key uses the same normalization with support IDs removed at every depth and an explicit schema-2 domain marker; it must never collide with a v1 structural locator through implicit reuse.

Mutation of a characteristic, NOT, threshold comparison, unit, counting convention, national-passport country, outcome, grant event, deadline action/reference/relation, authority, discretion or support identity must change the relevant complete fingerprint. Equivalent operand/support permutations must not. Quantity `{value:90,unit:days}` and `{value:3,unit:months}` are unequal. Null unknown and a known value are unequal. A reused v1 fingerprint cannot validate v2.

No personal context fingerprint or personal assertion is stored in global Official Truth. Context changes require fresh same-request evaluation. An implementation must not cache results under rule fingerprint alone or reuse a decision trace across credentials/visits/reference times. Persistent evaluation caching is outside the proposed implementation boundary.

### 9.2 Compatibility matrix

| Reader / material | Required behavior |
| --- | --- |
| Existing legacy/v1 reader + unchanged old fact/context | Identical read/evaluation/fingerprint behavior. No retroactive semantics. |
| Existing reader + schema 2 | Reject; no stripping version/keys. |
| Future v2-capable dispatcher + legacy/v1 | Dispatch to frozen old semantics. No v1-to-v2 automatic upgrade. |
| Future v2 fact + v1 context | `unsupported_version`; caller must explicitly produce a bound v2 context. |
| Future v1 fact + v2 context | Reject cross-version evaluation; an explicit independently validated v1 context is required. No silent projection. |
| Fact schema 2 + applicability schema 1, or vice versa | Reject mixed version. |
| Unknown future version / enum / required field | Block whole fact; not unconditional, unknown outcome or legacy fallback. |
| Already accepted/dormant v1 material | Remains readable in its original domain, with its original citations and gates. This does not claim v1 persistence is currently supported. |
| V2 equivalent of an old claim | Requires fresh canonical parsing and complete source/support proof under new pins; never relabel an old acceptance. |

No data migration is part of this slice or required for the dormant pure contract. A later persistent schema would need its own versioned design, review, round-trip tests and explicit apply authority. Content identity schema 2, applicability schema 2 and the existing store RPC's v2 name are unrelated version numbers.

### 9.3 Extractor, policy, acceptance and store boundaries

For any later v2 schema family, a **code-owned exact output contract pin** must be defined:

```text
RuleContractPinV2 = {
  factSchema: 2,
  applicabilitySchema: 2,
  contextSchema: 2,
  temporalSchema: 2 | null
}
```

This pin is resolved from the exact existing `(schemaFamily, extractorId, extractorVersion)` definition, not caller input. The minimal registry design is a code-owned descriptor for that tuple; no `latest`, range or optional fallback for v2. `temporalSchema=2` is required for temporal facts and stay outcomes containing event deadlines, null otherwise. The future policy's exact id/version must select the same descriptor and its `applicabilitySchema` must equal 2. Source/item/representation/profile pins remain as currently defined. Old descriptors retain their old exact contracts and require no synthetic v2 pin.

Pin validation must happen before HTTP where selection is possible, be frozen through same-request extraction, and be checked again against canonical output. The current composition `schemaPin()` catch-all-null must be extended deliberately for every allowed v2 carrier; v2 stay/temporal must never masquerade as legacy. Change to contract meaning requires a new code-owned schema family and extractor/policy version; old pins cannot acquire new semantics. Both production registries remain empty during any merely dormant foundation slice.

Field/branch/atom citations must include the activity exclusions, duration unit/convention, national-passport qualification, grant event, maximum-total meaning and deadline. Existing single-item versus multi-item identity and support-count limits remain. Translation is not an independent vote; two pages under one source may still be distinct items. A support-free atom locator is not accepted Evidence. Reusing a source UUID or a source-content hash does not establish legal equivalence.

The canonical `regelFaktKanonischLesen` must remain the sole fact parser. `regelKandidatAkzeptieren` remains the sole acceptance constructor. No F8 call, caller fact, caller clock, model suggestion or composition token bypass is added. Existing refusal of composed branch acceptance remains until a separately authorized acceptance-provenance slice; this architecture does not close it. Pure v2 parse/evaluate success must not mean accepted Evidence or accepted Rule.

The current flat store must fail closed for **every v2 carrier before client/transport/RPC**, including unconditional, stay and temporal facts. It must continue to reject v1 applicability facts. Dropping applicability, shortening a fact to its numeric fields, serializing opaque JSON into an unrelated column or retrying via a legacy RPC is forbidden. Future store capability must explicitly pin a supported fact/applicability/temporal tuple and prove lossless round-trip before any separate apply gate. This document designs no database schema and performs no database read or mutation.

## 10. Synthetic conformance and adversarial matrix

These are required cases for a later authorized implementation, **not tests added or run by this slice**. `T/F/U` mean atom truth values, not a visa decision. Every example is synthetic, not a traveller record or a Japanese/UK rule. Use explicit fake support fixtures only in a later isolated test suite, never manufacture accepted Evidence now.

| ID | Inputs / challenge | Required result |
| --- | --- | --- |
| A01 | business purpose; all activity assertions absent | All four new atoms U; purpose supplies no answer. |
| A02 | business contacts T; remuneration F | contacts T; NOT remuneration T; income/profit remain U. |
| A03 | contacts T; remuneration T | Coherent context; a no-remuneration condition F. |
| A04 | visitor purpose; remunerative T | Coherent context; no purpose-based override. |
| A05 | remuneration F only | NOT income and NOT profit both U. |
| A06 | characteristic T and F in duplicate rows; unrelated OR branch T | Entire context conflicts before evaluation. |
| A07 | missing characteristic under NOT / otherwise | U; otherwise cannot fire. |
| A08 | employer abroad, expenses, job label, model prose offered as substitutes | No derived activity assertion; unsupported input rejected. |
| A09 | same characteristic/value repeated within raw bound | One canonical assertion; exceeding raw bound rejects before dedup. |
| D01 | declared 89, 90, 91 days, matching unspecified convention; at-most 90 | T, T, F; greater-than 90 gives F, F, T. |
| D02 | declared 3 months versus 90-day predicate | U/unit mismatch, not equal; no conversion. |
| D03 | unknown dates but declared 90 days matching rule | Can compare with `context_asserted`; no exact deadline generated. |
| D04 | only arrival; missing departure; no quantity | U/planned dates for a named day convention. |
| D05 | open-ended departure; no quantity; either comparison | U/open-ended, never infinity or automatic over-limit. |
| D06 | open-ended plus finite quantity | Context conflict. |
| D07 | same-date entry/exit, named inclusive versus exit-exclusive convention | Derived 1 versus 0; fingerprints/conventions stay distinct. |
| D08 | 2028-02-28 through 2028-03-01; inclusive / exit-exclusive | 3 / 2 days; 2027-02-29 is invalid. |
| D09 | reversed dates, DST transition, international date line | Reversed local visit dates conflict; civil arithmetic unaffected by DST; unresolved cross-zone visit mapping blocks before derivation. |
| D10 | complete dates; source counting unspecified; no declaration | U/counting convention, even far below apparent limit; no guessed law. |
| D11 | months predicate; Jan 31–Feb 28 or leap-year Feb 29 | U without matching month declaration; no end-of-month clamp. |
| D12 | matching declared days differ from date-derived days | Context conflict, not preferred source. |
| D13 | differing declaration units/conventions; valid derived candidate | Use only comparable candidate; uncomparable declaration supplies no numeric inference and cannot hide a separately detectable conflict. |
| D14 | Trip duration, hotel nights or maximum grant offered as actual visit duration | Binder rejects the unsupported derivation. |
| D15 | threshold 0/3661 days, 121 months, float, string, negative zero | Invalid; 3660 days / 120 months accepted as technical bounds only. |
| D16 | ordinal date difference 3660, inclusive versus exit-exclusive derivation | Inclusive candidate 3661 blocks/bound_exceeded; exit-exclusive candidate 3660 remains within bound. |
| P01 | CH citizenship; CH issuer; link null; ordinary class | National-passport predicate U/link (and status if missing). |
| P02 | citizenships CH+DE; selected passport linked DE; national true; predicate CH | F; do not borrow CH link/class from a different credential. |
| P03 | passport + link CH + national true; class null | National predicate T, ordinary-national conjunction U/class. |
| P04 | emergency national passport, all other CH facts present | National predicate T; ordinary-national condition F. |
| P05 | diplomatic/official national passport | No ordinary default; class mismatch F. |
| P06 | refugee/laissez-passer with national true; national ID with national true | Context conflict. |
| P07 | unknown type with link/status; citizenship/link mismatch | Unknown type produces U unless another limb decisively F; link to absent recorded citizenship is invalid as in v1. |
| P08 | issuer differs from citizenship; no source issuer conjunct | No invented issuer-equality law; national character still needs its own assertion. |
| P09 | passport expired but national predicate true | National character does not decide validity; separate validity requirement remains. |
| T01 | mandatory before-expiry at E, observation E−1 ms / E / E+1 ms | Open / closed / closed; no one-minute approximation. |
| T02 | permission not yet granted before travel | Deadline unresolved; pre-entry requirement not changed. |
| T03 | civil-date expiry only | Preserve date; U/precision; no UTC midnight conversion. |
| T04 | visa expiry, Trip end, nominal 90-day grant or six-month maximum substituted | Binding fails; not the actual current-stay expiry. |
| T05 | two unresolved permissions, wrong visit/country, superseded permission | Block before evaluating a deadline. |
| T06 | changed actual grant/revision/expiry or reference time | Fresh evaluation required; old projection cannot be reused. |
| T07 | unknown/no-application legal reference in Irish clause | No fabricated event; remains unresolved law. |
| T08 | open window without application-completion evidence | No claim of filing/compliance; only window state. |
| S01 | initial grant days and extension total months | Both preserved, no sum/conversion or automatic grant. |
| S02 | qualified stay or temporal carrier with unknown activity/duration | Outcome unresolved, never flatten to unconditional output. |
| S03 | extension deadline present but requiresApplication false | Invalid contradictory outcome. |
| S04 | source requires unsupported rolling/window/form/filing qualifier | Complete fact production blocked; do not drop qualifier. |
| L01 | NOT U; F AND U; T OR U | U; F; T after validation. |
| L02 | true branches with differing full outcomes | branch_conflict, null outcome. |
| L03 | true branch plus unknown branch with different outcome | insufficient_context, null outcome. |
| L04 | true branch plus unknown branch with identical full outcome | Decided as current v1 algorithm; decisive trace retained. |
| L05 | all false, no otherwise; unknown exemption alternatives | no_applicable_branch / unknown; no residual legal complement. |
| L06 | unsupported version, extra key, free-text condition, mixed top-level outcome | Whole payload rejected; no fallback. |
| L07 | depth 5, 17 nodes, 9 operands/branches/supports, 5 visa options, oversized raw tree | Reject at bound; no truncation. Test each exact permitted boundary too. |
| F01 | reorder operands, branches, supports or visa options | Same canonical v2 fingerprint. |
| F02 | mutate any activity name, NOT, unit/convention, event/relation, support or outcome field | Different relevant v2 fingerprint; full-fact hash covers unconditional outcomes. |
| F03 | v1/v2 identical-looking expression or unconditional fact | Different domains; every old v1 golden hash unchanged. |
| F04 | two personal contexts under same rule fingerprint | No cross-context result reuse; trace contains no personal values. |
| G01 | caller chooses schema/policy/extractor, stale pin or registry drift | Block; frozen code-owned tuple required. |
| G02 | v2 stay/temporal given policy applicabilitySchema null or 1 | schema mismatch; no catch-all legacy path. |
| G03 | any v2 carrier to current flat store, including unconditional | Reject before transport; zero RPC calls. Preserve v1 rejection. |
| G04 | v2 parse success with unapproved source/profile/acceptance/composition | No promotion; existing downstream gates remain closed. |
| G05 | source disagreement: six months versus additional 90 days; different activity senses | Conflict/unresolved mapping; never majority vote, rounding or silent preferred-language choice. |
| G06 | source says business contacts permitted, but no independent no-payment declaration | No implicit economic F values and no complete exemption. |
| G07 | inherited UK institution flag reused as authenticated-form proof | Unsupported semantics; no v1/v2 reinterpretation. |

The conformance envelope is source-neutral: replacing the country parameter with another valid country code changes only scope/data, never parser branches. No implementation may branch on JP/GB or official host names in the applicability/temporal semantic evaluator. Source-specific recognition belongs only in separately approved extractors/profiles.

## 11. Exact later implementation candidate boundary

This is a proposed upper path boundary for TL consideration, **not an authorization or a started follow-up**. A later task must select a bounded subset or explicitly re-scope; all paths must be rechecked live for other writers. The smallest useful first implementation would keep everything dormant, with strict parse/evaluation and unconditional store refusal, and add no producer, UI, persistence or real extractor.

| Exact candidate paths | Reason if included in a later binding task |
| --- | --- |
| `lib/readiness/regulierungs-anwendbarkeit.ts` | Version dispatch, v2 context/atoms, pure evaluation and canonical fingerprints. |
| `lib/readiness/regulierungs-anwendbarkeit.test.ts` | V1 golden compatibility and A/D/P/L/F conformance cases. |
| `lib/readiness/temporal.ts` | Separate event-deadline parser and pure observation evaluation; old relative behavior unchanged. |
| `lib/readiness/e4-temporal-rules.test.ts` | Temporal v1 compatibility and T/S/F cases. |
| `lib/readiness/rule-claims.ts` | Canonical v2 carriers only; preserve blocked acceptance paths and complete support checks. |
| `lib/readiness/rule-claims.test.ts` | Strict fact shape, unit preservation, qualified outcomes, no new acceptance authority. |
| `lib/readiness/official-truth-trusted-fact-extractor-registry.ts` | Code-owned output contract descriptor and exact-pin refusal; registry remains empty. |
| `lib/readiness/official-truth-trusted-fact-extractor-registry.test.ts` | Contract mismatch and no caller schema selection. |
| `lib/readiness/official-truth-composition-policy-registry.ts` | Exact v2 applicability pin and canonical citation locators; no real policy. |
| `lib/readiness/official-truth-composition-policy-registry.test.ts` | V1 locators unchanged; v2 carriers cannot fall through to null schema pin. |
| `lib/readiness/official-truth-same-request-extraction-server.ts` | Only if required to bind the new exact output descriptor in the existing frozen request path. |
| `lib/readiness/official-truth-same-request-extraction-server.test.ts` | Descriptor drift and request/proof identity rejection. |
| `lib/readiness/official-truth-store-server.ts` | Explicit refusal of every v2 carrier before transport, never persistence implementation. |
| `lib/readiness/official-truth-store-server.test.ts` | Zero transport/RPC for all v1 applicability and v2 carrier variants. |

No other runtime/test path is implicitly permitted by this proposal. If import-inventory/hygiene constraints require another path, the later TL task must name it; do not silently broaden. Documentation filenames for that future task are intentionally not created here. This writer does not choose its issue, generation, branch or timing.

Explicitly excluded from this candidate boundary: `provider.ts`, `traveller-kontext.ts`, Trip/account persistence/types/producer APIs, `temporal-projection.ts`, UI/B01/Workspace, routes, DB/migrations/Supabase, real source/profile/catalog registration, accepted Evidence/Rule writes, activation and F8. They require separate work, if ever selected. Merely listing a future test file here is not a test modification in #851.

## 12. Deliberately unsupported and remaining evidence gates

| Area | Exact remaining boundary |
| --- | --- |
| Source mapping of activity terms | A deterministic family-specific mapping must show the relevant legal sense and every exclusion. No generic model classification of remuneration, foreign income, expenses or remote work. |
| Date-only legal duration | Official counting rule needed before deriving a threshold quantity from dates. A direct unit assertion remains assertion-bound; the architecture does not invent Japanese inclusive counting. |
| Months / rolling windows | No calendar-month arithmetic, day↔month conversion, repeated-entry aggregation or historical rolling calculation. |
| Actual permission events | A future authorized same-visit, same-credential binder must select the actual permission; date-only cutoff, filing/receipt/completion and notification projection are unsupported. |
| Japanese complete exemption/extension | #849's current national-passport/class bridge, ISA exception relationship, six-month/further-90-day reconciliation and content identity/retrieval remain unclosed. #853 independently owns identity/retrieval only; its success could not close these semantic issues. |
| UK full ETA contract | Irish reference-event scope, school study/organiser/form/adult relationships, special status/crew coverage and residual exclusion proof remain outside this bounded delta. Do not reinterpret generic v1 group size or authority confirmation. |
| Passport/application/use | No document-instance matching across applications and travel, authenticity checks, ePassport/MRP assertions, special-status classification or proof of passport validity from national character. |
| Other checklist axes | No new facing-page adjacency, funds, transit, health, arrival-form, insurance or document-admissibility semantics. #294 target remains; no invented completion. |
| Runtime/trust | No context producer, accepted Evidence, real extractor/policy, schema persistence, F8 or Production result. Pure representation capability does not close any of these gates. |

These are explicit capability limits and source/integration prerequisites, not unresolved choices about how the selected v2 atoms evaluate. Any attempt to represent a rule that requires one of these unsupported conditions must stop with an incomplete/unsupported fact; a positive partial atom is not a lossless complete rule. The future TL must narrow its implementation and source-family claims accordingly.

## 13. Delivery and STOP

Only the immutable TASK and the four documents with this slice's prefix belong to #851. PR #853's entire five-path namespace is reserved, whether or not all paths appear in its current Changed Files. No shared status/governance file is edited. The [report](OFFICIAL_TRUTH_APPLICABILITY_SCHEMA2_ACTIVITY_STAY_ARCHITECTURE_1_REPORT_2026-10-05.md), [handoff](OFFICIAL_TRUTH_APPLICABILITY_SCHEMA2_ACTIVITY_STAY_ARCHITECTURE_1_HANDOFF_2026-10-05.md) and [self-review](OFFICIAL_TRUTH_APPLICABILITY_SCHEMA2_ACTIVITY_STAY_ARCHITECTURE_1_SELF_REVIEW_2026-10-05.md) record validation and delivery limits.

No implementation, runtime/test modification, DB/Supabase/migration, registration, extractor/policy activation, accepted Evidence, Rule acceptance, F8, Production, CH import/CH-11 or Trip Workspace/B01 change is included. CH-01..CH-10 remain `RESEARCH_ONLY / NOT_APPROVED_FOR_DATABASE_IMPORT`. No Ready, merge or follow-up is performed.

Final classification: **APPLICABILITY_SCHEMA2_ACTIVITY_STAY_ARCHITECTURE_READY**.

**STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD EXACT-HEAD REVIEW.**
