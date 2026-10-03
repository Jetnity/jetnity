# Official Truth Regulatory Eligibility Predicate Architecture 1

Date: 3 October 2026
Status: **docs-only architecture / Draft PR #793 / no runtime / no acceptance change / no migration**
Issue: #792
Draft PR: #793
Branch: `docs/official-truth-regulatory-eligibility-predicate-architecture-1`
Baseline: `main@cb6b32dd34075a47eb220454ea46fc8371752b15`
Task: `docs/OFFICIAL_TRUTH_REGULATORY_ELIGIBILITY_PREDICATE_ARCHITECTURE_1_TASK_2026-10-03.md`
Logical agent: **Jetnity Official Truth regulatory eligibility predicate architecture 1**, Generation 1
Required model: Grok 4.7 High Fast (`grok-4.7-high-fast`), not Auto
Session: https://cursor.com/agents/bc-1e56bb1a-bd9c-41d6-9243-ea23429e4ddd
`originalModelName`: `grok-4.7-high-fast`

This file is the binding architecture for a later pure predicate foundation. It does not implement that foundation, does not change `regelKandidatAkzeptieren`, and does not authorize F8, an extractor, a route, or a store write. The task file stays unchanged.

## R1 correction — 3 October 2026

Technical-Lead review of `3eee6bb8c7476748d1c495de0fedea564d859a5b` is CHANGES REQUIRED.

- R1. A decided `otherwise` result depends on the facts that proved every exemption false, including user-asserted negative facts. Binding follows that whole dependency trace, not only atoms that evaluated `true`.
- R2. The later acceptance parser has exact legacy and schema-1 `requirement_effect` and `visa_options` shapes. The field name is `applicability`. Mixed top-level outcomes and branch outcomes are rejected.
- R3. `reg-eval-ctx:v1` is personal derived metadata. The first runtime slice does not compute or return it. `rule-applicability:v1` stays non-personal rule metadata.

The classification remains `PREDICATE_FOUNDATION_READY_FOR_RUNTIME_SLICE`. This correction still implements no runtime.

Live code wins where an older note disagrees. The reads for this design are `lib/readiness/rule-claims.ts`, `lib/readiness/evidence.ts`, `lib/readiness/traveller-kontext.ts`, `lib/readiness/provider.ts`, `lib/readiness/official.ts`, `lib/readiness/official-truth-trusted-fact-extractor-registry.ts`, `lib/readiness/official-truth-same-request-extraction-server.ts`, `types/trips.ts`, `docs/OFFICIAL_TRUTH_GOVUK_ETA_SOURCE_FAMILY_AUDIT_2026-10-03.md`, and `docs/OFFICIAL_TRUTH_SOURCE_FAMILY_SELECTION_2_2026-10-03.md`.

## 1. Three truth layers

These layers stay separate. A value that belongs in one layer is invalid in the others.

### A. Global regulatory truth

Non-personal official rule definition. Today this is an `AkzeptierteRegelClaim`: a `RegelScope`, a `rule-scope:v1:` key, one fact kind, evidence quality, support version ids, and one `RegelFakt`. The future applicability payload is part of this layer. It states the official condition. It never contains a traveller's age, permission, school, or document class.

`EvidenceAtom` / `RegelScope` stays the static cell: `destinationCountryCode`, `transitCountryCode`, the full citizenship set, one credential option, residence country, `requirementType`, and validity. `regelScopeAusEvidenceScope` still strips `sourceId`. `evidence-key:v2:` stays the evidence lookup key.

### B. Traveller regulatory context

Facts about one traveller and one trip, used only to evaluate a rule that was already found. This object is `RegulierungsKontext`. It is not Official Truth, not an evidence row, and not reusable across travellers. The same global rule is evaluated once per traveller and once per credential option the caller supplies. This module does not compare options and does not choose a passport.

### C. Evaluation result

`RegulierungsAuswertung` is derived. It is `decided` with `required` or `not_required`, or `insufficient_context`. An absent traveller fact is `unknown`. `unknown` is never stored as `false`, never stored as `not_required`, and never used to select the `otherwise` branch.

`OfficialResult` already contains a flat `conditional`. This architecture does not add another use of that flat value. A missing predicate answer is `insufficient_context`.

## 2. Canonical decision

The current fact is exactly `{ kind:'requirement_effect', effect, visaMode }`. `wirkungLesen` rejects any other key. `effect: 'conditional'` has no payload. `private.official_rule_claim_requirement_effect` stores `effect` and `visa_mode` and nothing else. That shape cannot carry the Appendix exemptions or the India document-class exclusion.

Four options were compared.

| Option | Result |
| --- | --- |
| 1. Add an expression inside `requirement_effect` and keep `effect: 'conditional'` | The expression belongs on the fact, because acceptance reads `trustedRuleFact` and the store already splits fact bodies by kind. Keeping flat `conditional` as a legal effect still allows a writer to name uncertainty and drop the sentence. |
| 2. A `RegelApplicability` object beside the claim, outside the fact | A claim could be accepted while its fact omits the condition the evidence supports. The condition would not travel through `regelFaktLesen`. |
| 3. A new fact kind for applicability | `official_rule_claims` is unique on `(rule_scope_key, fact_kind)`. A second kind for the same sentence is a second rule, and the current engine has no join that evaluates them together. |
| 4. Chosen. One versioned applicability object inside the trusted fact, with branch outcomes of `required` or `not_required` only | One fact, one constructor, unconditional facts stay small, exceptions are explicit, and `unknown` cannot become `otherwise`. |

Chosen architecture: **applicability is a schema-1 payload on the trusted fact. `regelKandidatAkzeptieren` remains the only acceptance constructor. A later slice extends `regelFaktLesen` / `wirkungLesen` inside that function. There is no second acceptance function and no second rule engine.**

`effect: 'conditional'` is not a branch outcome. A legacy three-key fact `{ kind, effect:'required'|'not_required', visaMode }` remains an unconditional fact. A legacy `effect: 'conditional'` evaluates as `insufficient_context` with reason `legacy_conditional_without_payload`. It is not rewritten to `not_required`.

Unconditional facts do not carry empty branches. The payload is `{ schema: 1, kind: 'unconditional' }`. A missing applicability key is accepted only on that legacy three-key object.

## 3. Proposed TypeScript contract

The first runtime slice owns this contract in new files. This document does not add those files.

Bounds, shared by the parser before and after normalization:

- `REGULIERUNGS_SCHEMA = 1`
- `REGULIERUNGS_TIEFE_MAX = 4`
- `REGULIERUNGS_KNOTEN_MAX = 16`
- `REGULIERUNGS_OPERANDE_MAX = 8`
- `REGULIERUNGS_ZWEIGE_MAX = 8`
- `REGULIERUNGS_ALTER_MAX = 120`
- `REGULIERUNGS_GRUPPE_SCHWELLE_MAX = 50`
- `REGULIERUNGS_GRUPPE_KONTEXT_MAX = 500`
- branch id: `^[a-z][a-z0-9_]{0,31}$`, unique inside the fact
- country codes: `landescodeLesen`, two ASCII letters
- support ids: existing `^ev1_[a-f0-9]{32}$`, at most `REGEL_SUPPORT_MAX` (8), sorted, deduped

```ts
export const REGULIERUNGS_SCHEMA = 1 as const

export const ZIEL_ERLAUBNIS_KLASSEN = [
  'entry_clearance',
  'permission_to_enter_or_stay',
  'electronic_travel_authorization',
  'visa',
  'residence_permit',
] as const
export type ZielErlaubnisKlasse = (typeof ZIEL_ERLAUBNIS_KLASSEN)[number]

export const REISEZWECKE = [
  'visitor',
  'business',
  'study',
  'medical',
  'transit',
  'work',
  'creative_worker',
  'other',
] as const
export type Reisezweck = (typeof REISEZWECKE)[number]

export const DOKUMENT_KLASSEN = [
  'ordinary',
  'diplomatic',
  'official',
  'emergency',
  'refugee_travel_document',
  'laissez_passer',
] as const
export type DokumentKlasse = (typeof DOKUMENT_KLASSEN)[number]

export const NATIONALITAETS_STATUS_KLASSEN = [
  'british_overseas_territory_citizen',
  'british_national_overseas',
] as const
export type NationalitaetsStatusKlasse = (typeof NATIONALITAETS_STATUS_KLASSEN)[number]

export const INSTITUTIONS_STATUS = [
  'french_ministry_of_education_school',
  'confirmed_german_school',
] as const
export type InstitutionsStatus = (typeof INSTITUTIONS_STATUS)[number]

export const REGULIERUNGS_REGIONEN = ['common_travel_area'] as const
export type RegulierungsRegion = (typeof REGULIERUNGS_REGIONEN)[number]

export const REGULIERUNGS_FEHLENDE_FAKTEN = [
  'destination_permission_status',
  'lawful_residence_status',
  'journey_origin',
  'age_on_travel_date',
  'travel_purpose',
  'document_class',
  'nationality_status',
  'school_party_context',
  'credential_citizenship_link',
] as const

export type RegulierungsFehlenderFakt =
  | (typeof REGULIERUNGS_FEHLENDE_FAKTEN)[number]
  | 'nationality'
  | 'document_type'
  | 'document_issuing_country'

export type RegulierungsPraedikat =
  | {
      kind: 'destination_permission'
      destinationCountryCode: string
      permissionClass: ZielErlaubnisKlasse
      validity: 'valid_on_travel_date'
    }
  | {
      kind: 'lawful_residence'
      countryCode: string
      entitlement: 'entitled_to_reside'
      departure: 'unrestricted' | 'unspecified'
    }
  | {
      kind: 'journey_origin'
      place:
        | { kind: 'country'; countryCode: string }
        | { kind: 'region'; regionCode: RegulierungsRegion }
    }
  | { kind: 'age_on_travel_date'; comparison: 'at_most' | 'at_least'; years: number }
  | { kind: 'travel_purpose'; purpose: Reisezweck }
  | { kind: 'document_class'; documentClass: DokumentKlasse }
  | { kind: 'issuing_country'; countryCode: string }
  | { kind: 'citizenship_includes'; countryCode: string }
  | { kind: 'credential_citizenship_link'; countryCode: string }
  | { kind: 'nationality_status'; status: NationalitaetsStatusKlasse }
  | { kind: 'institution_status'; status: InstitutionsStatus }
  | { kind: 'group_size_at_least'; count: number }
  | { kind: 'group_membership'; role: 'traveller_included' }
  | { kind: 'authority_confirmation'; subject: 'institution_status' }

export type RegulierungsAusdruck =
  | { op: 'atomic'; predicate: RegulierungsPraedikat; supportVersionIds?: readonly string[] }
  | { op: 'all'; operands: readonly RegulierungsAusdruck[] }
  | { op: 'any'; operands: readonly RegulierungsAusdruck[] }
  | { op: 'not'; operand: RegulierungsAusdruck }

export type RegulierungsWenn =
  | { kind: 'expression'; expression: RegulierungsAusdruck }
  | { kind: 'otherwise' }

export type RegulierungsZweig<TAusgang> = {
  id: string
  when: RegulierungsWenn
  outcome: TAusgang
  supportVersionIds: readonly string[]
}

export type WirkungsAusgang = {
  effect: 'required' | 'not_required'
  visaMode: OfficialVisaMode | null
}

export type VisaOptionsAusgang = {
  eligibility: 'allowed' | 'not_allowed'
  mandate: 'mandatory' | 'not_mandatory' | 'unknown'
}

export type RegulierungsAnwendbarkeit<TAusgang> =
  | { schema: 1; kind: 'unconditional' }
  | { schema: 1; kind: 'branches'; branches: readonly RegulierungsZweig<TAusgang>[] }

export type RegulierungsHerkunft = 'user_asserted' | 'account_profile' | 'trip_context'

export type RegulierungsFakt<T> = {
  value: T
  provenance: RegulierungsHerkunft
}

export type RegulierungsKontext = {
  schema: 1
  /** Provenance of the citizenship set, the credential option, and residence country. */
  recordedContextProvenance: 'account_profile' | 'trip_context'
  citizenshipCountryCodes: readonly string[]
  credential: {
    documentType: 'passport' | 'national_id' | 'unknown' | null
    issuingCountryCode: string | null
    relatedCitizenshipCountryCode: string | null
  }
  residenceCountryCode: string | null
  journeyOriginCountryCode: RegulierungsFakt<string> | null
  ageOnTravelDate: RegulierungsFakt<number> | null
  travelPurpose: RegulierungsFakt<Reisezweck> | null
  documentClass: RegulierungsFakt<DokumentKlasse> | null
  destinationPermissions: readonly RegulierungsFakt<{
    destinationCountryCode: string
    permissionClass: ZielErlaubnisKlasse
    validity: 'valid_on_travel_date' | 'not_valid'
  }>[]
  lawfulResidence: readonly RegulierungsFakt<{
    countryCode: string
    entitlement: 'entitled_to_reside' | 'not_entitled'
    departure: 'unrestricted' | 'restricted' | 'unknown'
  }>[]
  nationalityStatuses: readonly RegulierungsFakt<{
    status: NationalitaetsStatusKlasse
    holding: 'held' | 'not_held'
  }>[]
  schoolParty: {
    institutionStatus: RegulierungsFakt<InstitutionsStatus> | null
    groupSize: RegulierungsFakt<number> | null
    travellerIncluded: RegulierungsFakt<boolean> | null
    authorityConfirmed: RegulierungsFakt<boolean> | null
  } | null
}

export type RegulierungsPraedikatArt = RegulierungsPraedikat['kind']

/** No personal value. Kind, provenance, and the atom polarity only. */
export type RegulierungsAbhaengigkeit = {
  predicateKind: RegulierungsPraedikatArt
  provenance: RegulierungsHerkunft
  polarity: 'true' | 'false'
}

export type RegulierungsEntscheidspur = {
  schema: 1
  dependencies: readonly RegulierungsAbhaengigkeit[]
}

export type RegulierungsAuswertung<TAusgang> =
  | {
      status: 'decided'
      outcome: TAusgang
      binding: 'context_recorded' | 'context_asserted' | null
      decisionTrace: RegulierungsEntscheidspur
      missingFacts: readonly []
      reason: 'unconditional' | 'branch_matched'
    }
  | {
      status: 'insufficient_context'
      outcome: null
      binding: null
      missingFacts: readonly RegulierungsFehlenderFakt[]
      reason:
        | 'predicate_unknown'
        | 'no_applicable_branch'
        | 'branch_conflict'
        | 'legacy_conditional_without_payload'
        | 'region_membership_unpinned'
    }
```

`decisionTrace` is in-process metadata for the caller that just ran the evaluator. It is not Official Truth and it is not a log line. A later HTTP response may return `binding`, `outcome`, and `missingFacts`. It omits `decisionTrace`. Section 5.1 defines which facts enter the trace. Section 3.1 defines the trusted-fact objects the later parser accepts.

## 3.1 Exact trusted-fact shapes

The field name is exactly `applicability`. A branched fact has no top-level outcome. A fact that carries both a top-level outcome and branch outcomes is rejected, including when every branch outcome happens to equal the top-level outcome. The later acceptance slice does not reconcile those copies.

`regelFaktLesen` chooses a shape by exact key set. An absent key and a null key are not the same. Extra keys are `invalid_fact`. `schema` without `applicability`, or `applicability` without `schema`, is `invalid_fact`. Legacy objects are the objects that have neither key.

### `requirement_effect`

```ts
/** Exactly the keys kind, effect, visaMode. effect is required or not_required. */
export type LegacyAnforderungswirkung = {
  kind: 'requirement_effect'
  effect: 'required' | 'not_required'
  visaMode: OfficialVisaMode | null
}

/**
 * Exactly the keys kind, effect, visaMode, with effect conditional.
 * Not a member of the successful fact union.
 * The parser returns legacy_conditional_without_payload.
 * It does not add branches and it does not invent schema 1.
 */
export type LegacyFlachesConditional = {
  kind: 'requirement_effect'
  effect: 'conditional'
  visaMode: OfficialVisaMode | null
}

/** Exactly the keys kind, schema, applicability, effect, visaMode. */
export type Schema1UnbedingteAnforderungswirkung = {
  kind: 'requirement_effect'
  schema: 1
  applicability: { schema: 1; kind: 'unconditional' }
  effect: 'required' | 'not_required'
  visaMode: OfficialVisaMode | null
}

/**
 * Exactly the keys kind, schema, applicability.
 * effect and visaMode exist only on branch outcomes.
 */
export type Schema1VerzweigteAnforderungswirkung = {
  kind: 'requirement_effect'
  schema: 1
  applicability: {
    schema: 1
    kind: 'branches'
    branches: readonly RegulierungsZweig<WirkungsAusgang>[]
  }
}

export type AnforderungswirkungFakt =
  | LegacyAnforderungswirkung
  | Schema1UnbedingteAnforderungswirkung
  | Schema1VerzweigteAnforderungswirkung
```

`wirkungLesen` inside the later `regelFaktLesen` extension:

| Exact keys | Result |
| --- | --- |
| `kind`, `effect`, `visaMode`, and `effect` is `required` or `not_required` | Legacy unconditional. Same visa rules as today. |
| `kind`, `effect`, `visaMode`, and `effect` is `conditional` | `legacy_conditional_without_payload`. Not upgraded. Not stored as a new branched rule. |
| `kind`, `schema`, `applicability`, `effect`, `visaMode`, `schema` is 1, `applicability` is exactly `{ schema: 1, kind: 'unconditional' }`, `effect` is `required` or `not_required` | Schema-1 unconditional. |
| `kind`, `schema`, `applicability`, `schema` is 1, `applicability.kind` is `branches` | Schema-1 branched. No top-level `effect`. No top-level `visaMode`. |
| `effect` or `visaMode` present together with `applicability.kind: 'branches'` | `mixed_outcome`. |
| `applicability.kind: 'unconditional'` together with `branches` | `invalid_fact`. |
| Any other key set, including a legacy object plus `applicability` or `schema` | `invalid_fact`. |

`mixed_outcome` and `legacy_conditional_without_payload` are new `RegelClaimFehler` members on the later acceptance slice only. This pull request does not add them to code. Schema-1 branched facts are not persistable by `akzeptierteRegelClaimSpeichern` until a separate migration exists. The writer returns `applicability_not_persistable`. Today's effect table would keep `effect` and `visa_mode` and drop the branches.

### `visa_options`

Applicability sits on each option. The fact itself is legacy or schema 1 as a whole. A schema-1 fact cannot contain a legacy option, and a legacy fact cannot contain an option with `applicability`.

```ts
/** Exactly the keys visaMode, eligibility, mandate. */
export type LegacyVisaOption = {
  visaMode: Exclude<OfficialVisaMode, 'unknown'>
  eligibility: 'allowed' | 'not_allowed' | 'unknown'
  mandate: 'mandatory' | 'not_mandatory' | 'unknown'
}

/** Exactly the keys kind, options. Every option is a LegacyVisaOption. */
export type LegacyVisaOptionen = {
  kind: 'visa_options'
  options: readonly LegacyVisaOption[]
}

/** Exactly the keys visaMode, eligibility, mandate, applicability. */
export type Schema1UnbedingteVisaOption = {
  visaMode: Exclude<OfficialVisaMode, 'unknown'>
  eligibility: 'allowed' | 'not_allowed' | 'unknown'
  mandate: 'mandatory' | 'not_mandatory' | 'unknown'
  applicability: { schema: 1; kind: 'unconditional' }
}

/**
 * Exactly the keys visaMode, applicability.
 * eligibility and mandate exist only on branch outcomes.
 */
export type Schema1VerzweigteVisaOption = {
  visaMode: Exclude<OfficialVisaMode, 'unknown'>
  applicability: {
    schema: 1
    kind: 'branches'
    branches: readonly RegulierungsZweig<VisaOptionsAusgang>[]
  }
}

/** Exactly the keys kind, schema, options. Every option has applicability. */
export type Schema1VisaOptionen = {
  kind: 'visa_options'
  schema: 1
  options: readonly (Schema1UnbedingteVisaOption | Schema1VerzweigteVisaOption)[]
}
```

`visaOptionenLesen` uses the same discipline. An option with top-level `eligibility` or `mandate` and `applicability.kind: 'branches'` is `mixed_outcome`. A schema-1 branched option is not persistable by the current visa-option table, which stores eligibility and mandate and has no branch rows. The writer returns `applicability_not_persistable` for the whole fact if any option is branched. Other `RegelFakt` kinds keep their current exact shapes until a later wrapper adds `schema` and `applicability` in this same style. They do not receive a generic side payload in this contract.

`licensed_provider_confirmed` and `official_document_verified` are reserved names. The context parser rejects them with `provenance_not_authorized`. They are not aliases of `user_asserted`. No slice in this architecture reads a passport scan, an MRZ, a biometric, a permit number, or a health record to mint those provenances.

Closed vocabularies are versioned by `REGULIERUNGS_SCHEMA`. A new purpose, document class, status, institution authority, region, or permission class is a new schema, not a string field.

## 4. Predicate vocabulary

Every atomic predicate is one of the kinds above. There is no source-specific boolean (`govukEta13`, `indiaDiplomatic`) and no free-text condition. Unexpected keys fail the parse. Keys in the existing `PERSONEN_SCHLUESSEL` set, plus `schoolName`, `institutionName`, `permitNumber`, `visaNumber`, and `documentNumber`, fail as `personal_identifier_forbidden`.

### Destination permission

`destination_permission` binds a destination country, a permission class, and `validity: 'valid_on_travel_date'`. The intro sentence of the Appendix is one `any` of `entry_clearance` and `permission_to_enter_or_stay` for `GB`. An already-valid ETA, visa, or residence permit uses the matching class when a later official sentence names that class.

The context list stores class and validity only. An empty list is `unknown`, not "holds nothing". `not_valid` is `false`. A matching `valid_on_travel_date` is `true`. A second entry for the same destination and class with a different validity is `context_conflict` at parse time.

The predicate destination must equal the cell `destinationCountryCode` when that cell value is non-null. A mismatch is `invalid_fact` at the later acceptance read, not a silent retarget.

### Lawful residence

`residenceCountryCode` and `WohnsitzAtom` stay a country of residence. They do not prove entitlement. ETA 1.4 is `lawful_residence` for `IE` with `entitlement: 'entitled_to_reside'` and `departure: 'unrestricted'`. `unspecified` means the official sentence requires entitlement and does not mention a departure restriction. `unrestricted` is false when the context says `restricted`, and `unknown` when departure is `unknown` or the country is absent. Absence of a row is `unknown`, not `not_entitled`.

The Irish Minister's consent test is this departure axis. It is not a separate GOV.UK flag and it is not inferred from `residence.countryCode === 'IE'`.

### Journey origin

`journey_origin` is either a country or a code-owned region. The evaluator reads `journeyOriginCountryCode` and nothing else. Residence, destination, and transit are not an origin.

`common_travel_area` is the only region code. Its member list is a versioned pin:

```ts
export type RegulierungsRegionPin = {
  regionCode: 'common_travel_area'
  version: number
  memberCountryCodes: readonly string[]
  sourceId: string
  sourceContentHash: string
}
export const REGULIERUNGS_REGION_PINS: readonly RegulierungsRegionPin[] = []
```

This architecture does not pin members. The audited Appendix names the Common Travel Area and does not quote a member list in the repository record. Guessing members would invent a legal set. Until a later slice adds a pin copied from a server-reproved official source, a region predicate evaluates as `insufficient_context` with reason `region_membership_unpinned`. If the traveller origin country is already present, `journey_origin` is not added to `missingFacts`. The user is not asked again for a fact the code cannot interpret. If the origin country is absent, the missing fact is `journey_origin` and the region pin is not presented as a user question.

ETA 1.3 is `all` of lawful residence in Ireland, origin in the region, and `not` origin country `IE`. "Elsewhere" is that composition. It is not a hidden reading of residence.

### Age

The stored predicate is an inclusive integer comparison on the travel date: `at_most` or `at_least`, `years` from 0 through 120. ETA 1.9 is `at_most` 18. ETA 1.10 is `at_most` 19. ETA 1.6 is `at_least` 16. ETA 1.6 qualifies the Ireland exemption. It is not itself an exemption branch.

No date of birth is accepted. An age band is not a second stored form. `ageOnTravelDate` is the context integer. Null is `unknown` and emits `age_on_travel_date`.

### Travel purpose

The context value is one enum value. It is not a sentence, and it is not derived from trip interests. Missing purpose is `unknown`, not `other`. `other` is true only when the traveller or the rule explicitly uses the residual class.

The India e-Visa page names recreation, short courses, voluntary work, medical treatment, business, and conferences. Schema 1 does not record a mapping from those phrases to enum values. Medical treatment is a different phrase from `medical`. The word business on that page is not pre-approved as `business` by this document, because this slice does not re-read the page bytes and does not authorize an extractor. An extractor that needs an unmapped phrase fails closed. It does not emit `other`.

Appendix ETA 1.9 and ETA 1.10 say Visitor. That recorded category is `visitor`. Creative Worker, named in ETA 1.1(f), is `creative_worker`. Marriage/Civil Partnership Visitor and S2 Healthcare Visitor are not `visitor` and not `medical`. They are outside schema 1. An extractor must not fold them in.

### Document class

`documentType` stays `passport | national_id | unknown`. Class is a second axis: ordinary, diplomatic, official, emergency, refugee travel document, laissez-passer. `passport` does not mean ordinary. The research literal `ordinary_passport` stays outside `RegelScope`. The predicate `document_class: 'ordinary'` is how a later fact says ordinary without widening the scope type.

India's exclusion is `any` of diplomatic, official, and laissez-passer. That exclusion is not `effect: 'not_required'`. "Not available" means this visa option's eligibility is `not_allowed`. Section 6 binds that outcome on `visa_options`. A requirement-effect branch must not use document class to mean the person needs no permission.

Null class is `unknown` and emits `document_class`. It is not ordinary and not diplomatic.

### Issuing country, citizenship, credential link

`issuing_country` is true only when the selected option's `issuingCountryCode` equals the predicate code. Null issuer is `unknown` and emits the existing code `document_issuing_country`. A different explicit issuer is `false`.

`citizenship_includes` tests membership in the full set. A non-empty set that lacks the code is `false`. An empty set is `unknown` and emits `nationality`. The predicate does not drop the other codes and does not rank them.

`credential_citizenship_link` is true only when `relatedCitizenshipCountryCode` is explicitly that code. Null is `unknown` and emits `credential_citizenship_link`. An explicit different code is `false`. Copying the issuer into the link is still forbidden. The India modal ("passport from") and FAQ ("nationals of") stay two different predicates. A cell that knows only citizenship `CH` does not satisfy `issuing_country: 'CH'`.

`documentType: 'unknown'` makes `document_class` and a passport-specific issuer test `unknown` and emits `document_type` when the rule's predicate requires a passport class or an issuing country and the option has no type.

### Nationality status

`british_overseas_territory_citizen` and `british_national_overseas` are status classes. They are not ISO codes and they are not written into `citizenship.countryCodes`. A missing row is `unknown`, not `not_held`. Explicit `not_held` is `false`. Explicit `held` is `true`. ETA 1.7 is two branches, or one `any`, over these two statuses.

### School and group

Four atomics, one missing-fact code `school_party_context`:

- `institution_status` is an authority class. The audited classes are a French Ministry of Education school and a confirmed German school. The status is not a school name. No school name exists on the global rule or in the context.
- `group_size_at_least` is an integer threshold from 2 through 50. The audited party size is 5. The context size is an integer from 1 through 500. Null size is `unknown`.
- `group_membership` with `traveller_included` reads `schoolParty.travellerIncluded`.
- `authority_confirmation` with `institution_status` reads `schoolParty.authorityConfirmed`. The German "confirmed" class already includes confirmation in the status value. A rule that only needs that status does not also require the confirmation atomic. A rule that states a separate authority confirmation uses the atomic.

ETA 1.9 is `all` of age at most 18, the French institution status, group size at least 5, traveller included, and purpose `visitor`. ETA 1.10 is the same with age at most 19 and the German institution status. Any null component used by that expression yields `unknown` and one `school_party_context` code, plus `age_on_travel_date` or `travel_purpose` when those are the nulls. The UI later asks the missing code once.

## 5. Expression model

The grammar is `atomic`, `all`, `any`, and `not`. The parser walks a JSON tree with an explicit depth counter. It does not call a function supplied by the caller. Rejected inputs: a function, a regular expression, a string condition, a node above the bounds, an empty `all` or `any`, a predicate kind outside the vocabulary, a non-integer age, a country code `landescodeLesen` rejects.

Normalization, applied only after the raw tree is inside the bounds:

1. `not(not(x))` becomes `x`.
2. Nested `all` flattens into one `all`. Nested `any` flattens into one `any`. `not` is not distributed.
3. Operands of `all` and `any` are sorted by their canonical JSON byte string.
4. Duplicate operands inside one `all` or one `any` are removed.
5. A single remaining operand unwraps to that operand.
6. The normalized tree is rejected if it exceeds the same bounds.

Normalization does not change three-valued meaning. `all` and `any` are associative under the truth table below. The fingerprint is the hash of the normalized tree, so operand order and duplicate copies do not fork identity.

### Truth table

`unknown` is a third value. It is not false.

| Expression | Result |
| --- | --- |
| `not true` | `false` |
| `not false` | `true` |
| `not unknown` | `unknown` |
| `all` where any operand is `false` | `false`, including when another operand is `unknown` |
| `all` where none is `false` and any is `unknown` | `unknown` |
| `all` where every operand is `true` | `true` |
| `any` where any operand is `true` | `true`, including when another operand is `unknown` |
| `any` where none is `true` and any is `unknown` | `unknown` |
| `any` where every operand is `false` | `false` |
| atomic, required context absent | `unknown` |
| atomic, context explicitly opposite | `false` |
| atomic, context explicitly matching | `true` |

Missing-fact collection follows the same short decision:

- A decided `false` on `all`, or a decided `true` on `any`, does not ask for the remaining unknown operands.
- An `unknown` result asks only for the unknown operands that the table still needs.
- Codes are emitted in canonical operand order and deduped.
- `region_membership_unpinned` does not ask a traveller question when the origin country is already known.

### 5.1 Decision dependency trace

Every `decided` result carries a `decisionTrace`. A dependency is a context fact whose evaluated polarity was necessary for the chosen outcome. `true` and `false` both count. An absent fact is `unknown` and is not a dependency. The trace stores `predicateKind`, `provenance`, and `polarity` only. It does not store age, country, permission class, status, purpose, school, group size, or any other value.

Visit order is fixed before any short-circuit:

1. `all` and `any` operands are visited in canonical JSON sort order.
2. Expression branches are visited in branch `id` sort order.
3. `not` visits its one operand. The dependencies of that operand stay dependencies, with the operand's own polarity. The flip does not rewrite `false` into `true` inside the trace.

Short-circuit keeps only the necessary operands:

| Expression result | Dependencies |
| --- | --- |
| `all` is `false` | The first `false` operand in canonical order. Stop there. Earlier `true` or `unknown` operands are not dependencies. |
| `any` is `true` | The first `true` operand in canonical order. Stop there. |
| `all` is `true`, or `any` is `false` | Every operand. Each one can change the result. |
| `all` or `any` is `unknown` | Every `unknown` operand that remains after the scan confirms there is no deciding `false` (`all`) or deciding `true` (`any`). Decided operands that do not produce that `unknown` are not dependencies. There is no decided binding. |
| `not` | The dependencies of the inner expression, unchanged. |
| atomic `true` or `false` | That one context fact. Citizenship, issuer, credential link, and document type use `recordedContextProvenance`. Every other atomic uses the provenance on its `RegulierungsFakt`. |
| atomic `unknown` | No dependency. |

Branch selection for a decided result:

| Decided by | Trace |
| --- | --- |
| Unconditional fact | Empty dependency list. `binding` is `null`. |
| One or more expression branches `true` with the same outcome, and no `unknown` branch has a different outcome | Dependencies of the first `true` branch in `id` order only. Later `true` branches with the same outcome are not required. `false` branches are not required. |
| `otherwise`, and every expression branch is `false` | The union of the false-establishing dependencies of every expression branch. |

Binding from that trace:

- `context_asserted` when any dependency has `provenance: 'user_asserted'`.
- `context_recorded` when the trace is non-empty and every dependency is `account_profile` or `trip_context`.
- `null` only when the fact is unconditional and the trace is empty.

A branched decision with an empty trace does not get `binding: null`. The evaluator returns `insufficient_context` with reason `predicate_unknown`. An `otherwise` `required` that was reached because the caller asserted `not_valid` or `not_held` is `context_asserted`. It is not an unbound base rule.

`insufficient_context` has no decision trace. `branch_conflict` has no binding.

## 6. Outcomes

Branch evaluation is not first-match. Branches are sorted by `id` for the fingerprint. The decision uses the multiset of results.

Let expression branches be evaluated to `true`, `false`, or `unknown`. At most one branch has `when.kind: 'otherwise'`. A fact that contains only `otherwise` is invalid; that fact is unconditional. Zero branches is invalid. More than eight branches is invalid.

| Situation | Auswertung |
| --- | --- |
| Unconditional payload | `decided`, reason `unconditional`, binding `null` |
| Two or more expression branches `true` with different outcomes | `insufficient_context`, reason `branch_conflict`, no missing facts |
| One or more `true` branches, all with the same outcome T, and every `unknown` branch also has outcome T | `decided` T, reason `branch_matched` |
| One or more `true` branches with outcome T, and some `unknown` branch has a different outcome | `insufficient_context`, reason `predicate_unknown`, missing facts from those differing unknown branches only |
| No `true` branch, at least one `unknown` | `otherwise` does not apply. `insufficient_context`, reason `predicate_unknown` |
| Every expression branch `false`, and `otherwise` exists | `decided` with the otherwise outcome. Binding comes from section 5.1, including every false exemption that was necessary. |
| Every expression branch `false`, and no `otherwise` | `insufficient_context`, reason `no_applicable_branch`, no missing facts |

`otherwise` runs only when every expression branch is `false`. An unknown exemption must not fall through to a base `required`. That is the fail-closed reading of the Appendix: a cell that cannot prove the traveller lacks entry clearance cannot become unconditional `required`.

Each `required` or `not_required` outcome still passes `visaResultUndModusWidersprechen`. Non-visa facts keep `visaMode: null`. A violating branch is `invalid_fact` at parse time, not a runtime guess.

`visa_options` uses the same branch walker. The outcome is eligibility `allowed` or `not_allowed`, plus a mandate that is `unknown` only when the official sentence does not state a mandate. The India diplomatic / official / laissez-passer sentence is a `true` exclusion branch whose eligibility is `not_allowed` and whose mandate stays `unknown`. It does not create a `not_required` requirement effect. When the exclusion is `unknown`, the option stays `insufficient_context`. When the exclusion is `false`, later branches or `otherwise` can carry the eligibility the page gives the remaining class.

Other fact kinds, including `passport_validity` and `blank_passport_pages`, use this same walker when a later wrapper is added. A false purpose branch means that validity fact does not apply (`no_applicable_branch` or another branch). It does not become a zero duration or a dropped qualifier. Schema 1 already allows that wrapper. The first runtime file implements the generic walker plus the requirement-effect adapter and the visa-option adapter. Further adapters are the same function with a different outcome type.

Illustrative Appendix shape for one `electronic_travel_authorization` cell, not an accepted fact and not an extractor:

- `held_permission`: `any` of GB entry clearance and GB permission to enter or stay, outcome `not_required`
- `ireland_cta`: `all` of Ireland lawful residence with unrestricted departure, CTA origin, and not origin `IE`, outcome `not_required`
- `botc` and `bno`: the two status predicates, outcome `not_required`
- `french_school` and `german_school`: the age, institution, size, membership, and `visitor` conjunctions, outcome `not_required`
- `base`: `otherwise` `required`

That is seven branches. The cap is eight. A later author who needs an eighth branch raises `REGULIERUNGS_SCHEMA` rather than overflowing the tree. ETA 1.6 says a person aged 16 or over who relies on ETA 1.3 must provide evidence of lawful residence if required. That is an evidence-production sentence. It does not narrow who is exempt, so `at_least` 16 is not a conjunct on `ireland_cta` and it is not an extra `not_required` branch. This schema does not model an upload of that evidence.

The CTA branch stays in the rule even while the region pin is empty. Dropping it so `otherwise` can return `required` is a false fact. While the pin is empty, a context that has not already falsified every other exemption evaluates `ireland_cta` as `unknown`, so `otherwise` does not run.

## 7. Context provenance

Provenance is a label on the context fact. It is not Official Truth authority and it does not accept a rule.

| Predicate | May decide from |
| --- | --- |
| `citizenship_includes` | The citizenship set already on the profile or trip. Not a fresh typed assertion in this module. |
| `credential_citizenship_link`, `issuing_country`, `document_type` | The selected credential option already on the profile or trip. Null stays unknown. |
| `journey_origin` country | `trip_context` when `RequirementsAnfrage.originCountryCode` is set. `user_asserted` only when the trip has no origin. If both exist and differ, `context_conflict`. |
| `age_on_travel_date` | `user_asserted` integer. No profile date of birth. |
| `travel_purpose` | `user_asserted` enum. Trip interests are not a purpose. |
| `document_class` | `user_asserted`. `documentType: 'passport'` is not a class. |
| `destination_permission` | `user_asserted` class and validity, with no number. |
| `lawful_residence` | `user_asserted` entitlement and departure. Residence country is not this fact. |
| `nationality_status` | `user_asserted` held or not held. |
| school-party atomics | `user_asserted` status, size, membership, and confirmation. No institution name. |

`account_profile` may supply the citizenship set, the credential option, and residence country, because those fields already exist on `TripTraveller`. It may not supply permission, lawful entitlement, age, purpose, document class, nationality status, or school party. Those fields do not exist on the profile.

Binding is the section 5.1 rule. A user-asserted `not_valid` permission or `not_held` status that makes an exemption `false`, and therefore lets `otherwise` return `required`, is a deciding dependency. The result is `context_asserted`. The UI later shows an asserted answer, including an asserted negative answer, as the traveller's answer. It does not show it as an official verification of the person. The global rule is unchanged either way.

`official_document_verified` is not proposed. This architecture has no scan, MRZ, or chip-read path.

## 8. Privacy and persistence

Global applicability JSON may later be stored as non-personal Official Truth. That storage is not the first runtime slice. Traveller context is ephemeral, or it reuses facts the trip already stores. It is not copied into `official_rule_claims`, evidence, or a global cache key.

| Fact | Class | Posture |
| --- | --- | --- |
| Citizenship set, issuer, explicit citizenship link, residence country, trip origin country | Basic context already on the trip or profile | Keep the existing store. Do not copy it into Official Truth. |
| Destination permission class and validity | Personal legal status | Ephemeral. A later persist needs a separate Product-Owner privacy gate. No permit number. |
| Lawful residence entitlement and departure | Personal legal status | Ephemeral. Same gate. |
| Age integer on the travel date | Personal | Ephemeral. No date of birth. |
| Travel purpose enum | Legal purpose, not an interest | Ephemeral until a separate product decision. Not inferred. |
| Document class | Personal document attribute | Ephemeral. Do not extend `TripTravellerDocument` in the first slice. |
| Nationality status class | Personal legal status | Ephemeral. Same gate. |
| School authority class, group size, membership, confirmation | Personal or group context | Ephemeral. No school name. |

Forbidden in the rule, the context, the decision trace, and the logs of this evaluator: passport or document numbers, MRZ, scans, biometrics, health records, permit numbers, school names, dates of birth, traveller names, and the personal values behind a dependency. The context type has no `clientRef`. The caller correlates the result outside the module. `reg-eval-ctx:v1` is classified in section 10. Hashing it does not move it out of this table.

`personenkennung` in `rule-claims.ts` already rejects `dateOfBirth`, `mrz`, `biometric`, `passportNumber`, and health keys on a claim. The new context parser uses that set plus the name keys in section 4. A rejected context does not evaluate as `false`.

## 9. Missing facts

The evaluator returns the codes in section 3. Existing codes `nationality`, `document_type`, and `document_issuing_country` are reused when the static option is incomplete. The new codes are not added to `MISSING_FACTS` in `lib/readiness/official.ts` by the first slice. A later UI slice can map them. Until then they live on `RegulierungsAuswertung` only.

The product asks a code only after a matched rule's expression needs it. No traveller is asked for permission, age, purpose, document class, status, or school party before a rule returns that code. A decided result has an empty missing-fact list. `branch_conflict` and `no_applicable_branch` do not invent a question. `region_membership_unpinned` does not ask the traveller to name the Common Travel Area.

Stale and recheck behaviour for a later runtime: a changed context fact re-evaluates rules whose normalized applicability mentions a predicate of that fact. It does not change `rule-scope:v1:` and it does not invalidate evidence rows for unrelated fact kinds.

## 10. Scope and fingerprints

Volatile and uncommon facts stay off the evidence lookup key. The static key remains the current canonical JSON inside `kanonisch`: destination, transit, citizenship mode and sorted codes, credential mode, document type, issuer, related citizenship, relation, residence mode and country, requirement type, validity mode, and travel date.

`destination_permission`, lawful entitlement, journey origin, age, purpose, document class, nationality status, and school party are evaluation context. They are often unknown, they change without the official page changing, and putting them on `EvidenceAtom` would multiply evidence rows and would freeze personal facts into a reusable cell. Residence country stays on the cell because it is already there. It is still not lawful entitlement. Trip origin already exists on `RequirementsAnfrage.originCountryCode` and is still not a `RegelScope` field.

Two fingerprints exist as concepts. They are not the same class of data.

`rule-applicability:v1:` is non-personal global rule metadata. It is the SHA-256 hex of the canonical JSON of the normalized applicability, including sorted branch ids and sorted support ids. It may be compared in memory and, on a later persistence slice, stored with the non-personal rule. It is not appended to `evidence-key:v2:` or `rule-scope:v1:`. Canonical JSON emits object keys in the order defined in section 3, arrays in their sorted order, and no insignificant whitespace.

`reg-eval-ctx:v1:` would be the SHA-256 hex of the canonical traveller context. That context includes low-entropy personal and legal-status facts: age, permission status, nationality status, lawful residence, purpose, and school-party context. An unsalted hash of that small space is linkable and can be recovered by trying the vocabulary. The hash is still personal. It is classified as **personal/derived sensitive context metadata**.

The first pure runtime slice does not compute `reg-eval-ctx:v1` and does not return it. The in-process decision trace in section 5.1 is the binding record that slice needs. A later function may compute the hash only inside the same process, and only if a reviewed task still needs it. That function's return type, if it is ever added, is:

```ts
export type EphemererKontextFingerprint = {
  readonly classification: 'personal_derived_sensitive_context'
  readonly persistence: 'ephemeral_in_process_only'
  readonly value: `reg-eval-ctx:v1:${string}`
}
```

That value must not be logged, sent to analytics or telemetry, persisted, used as a global or cache key, written into Evidence or Official Truth, or returned through a public API. It is not a substitute for the privacy rules in section 8. Storing it later requires the same Product-Owner privacy gate as storing the underlying personal regulatory context. The first slice's public return is `RegulierungsAuswertung`. That object has no context hash.

## 11. Multi-citizenship

The full citizenship set stays on the scope and is copied onto the context. Rules test membership with `citizenship_includes`. There is no best-passport ranking and no first-match across credential options. A later comparator, if a separate task defines one, calls this evaluator once per option and compares the returned evaluations under the traveller-context policy: legal duty first, then route coverage, then evidenced friction. This module does not implement that comparison.

A second citizenship is a different static cell when the scope's citizenship set differs. The evaluator must see the whole set of the cell it was given. Status classes never enter `countryCodes`. An explicit credential link is required before a passport is treated as establishing one of those citizenships. Issuer country remains issuer country.

## 12. Composition provenance

`decideOfficialTruthSameRequestTrustedFactExtraction` returns `composition_policy_unavailable` when `evidenceQuality` is `composed_from_multiple_primary_sources`. This architecture does not remove that block and does not write a composition policy.

When a later policy exists, provenance is assigned as follows. Acceptance still goes through `regelKandidatAkzeptieren`.

- The claim's `supportVersionIds` remain the only evidence versions a branch or atom may cite.
- `explicit_primary_statement` has one support. Every branch `supportVersionIds` equals that one id. Atoms may omit ids and inherit the branch.
- Composed quality still requires two supports from two `sourceId` values, which the current constructor already checks.
- Each branch cites a non-empty subset of the claim supports. The union of the branch citations equals the claim supports.
- An atom may cite a subset of its branch. If a composed branch cites two sources and an atom omits its ids, acceptance fails `condition_provenance_ambiguous`. Inheritance across two sources is not allowed.
- Outcome, exception branch, and atom therefore each have a support citation before a composed claim can be accepted.
- The applicability fingerprint includes those ids, so swapping sources changes the fingerprint.

The GOV.UK National List and the Appendix are two content items. A predicate payload does not join them. Composition remains the larger blocker for that pair. A predicate without composition still cannot turn the National List into a complete fact. Composition without the predicate still cannot represent the exemptions. Neither gap is closed here.

## 13. Acceptance and F8

F8, if a later task authorizes it, accepts a complete deterministic `trustedRuleFact` by calling `regelKandidatAkzeptieren` and nothing else. The fact includes schema-1 applicability. For a source that states an exception, a flat `{ effect: 'required' }` is an incomplete fact and must be refused by the extractor before F8. Flat `{ effect: 'conditional' }` is the same refusal. F8 does not accept an evaluation result, a context object, or a missing-fact list as the rule.

The later change inside `regelKandidatAkzeptieren` is an extension of `wirkungLesen` and of the visa-option reader. It implements section 3.1 and no other shape:

- legacy three-key `required` or `not_required` loads as unconditional;
- legacy flat `conditional` returns `legacy_conditional_without_payload` and is never rewritten into branches;
- schema-1 unconditional and schema-1 branched objects are the only new successes;
- a top-level outcome together with branched `applicability` returns `mixed_outcome`;
- `akzeptierteRegelClaimSpeichern` rejects a branched fact with `applicability_not_persistable` until a separate migration stores the branches.

That rejection is required because the current effect table has only `effect` and `visa_mode`. Writing a branched fact through today's writer would drop the condition. The first runtime slice does not call the writer. This document does not add the migration. Production apply of any later migration stays a Product-Owner gate.

No new acceptance function is created. Extractor output remains an input candidate. The human fact-entry path remains the only authorized `trustedRuleFact` supply until a reviewed implementation of the extractor contract and of this payload exists.

## 14. First runtime slice

Migration impact: **NONE**. The slice is pure TypeScript. It does not alter `supabase/`, the effect table, RLS, or the evidence key.

Files it should own:

- `lib/readiness/regulierungs-anwendbarkeit.ts`
- `lib/readiness/regulierungs-anwendbarkeit.test.ts`

That module owns the vocabularies, the bounds, the context parser, normalization, the `rule-applicability:v1` fingerprint, the three-valued walker, the decision trace, the requirement-effect adapter, the visa-option adapter, and the empty region-pin constant. It does not export a `reg-eval-ctx:v1` function. It imports existing country-code and visa-contradiction helpers. It does not import the extractor registry, the same-request server, or the store writer.

Tests for that later slice, not written here, cover the truth table, the `otherwise` block while any exemption is unknown, explicit false versus absent, the personal-identifier rejection, the node and depth caps, the non-personal rule fingerprint, multi-citizenship membership, document class distinct from `documentType`, an unpinned region, and the section 3.1 key-set rejections including `mixed_outcome` and legacy `conditional`.

One test is mandatory. Build a branched `requirement_effect` with an exemption branch `destination_permission` outcome `not_required`, a second exemption branch `nationality_status` outcome `not_required`, and `otherwise` outcome `required`. The context asserts `validity: 'not_valid'` for that permission and `holding: 'not_held'` for that status, both with `provenance: 'user_asserted'`. Every expression branch is `false`. The evaluation is `decided`, outcome `required`, `binding: 'context_asserted'`. The trace contains those two predicate kinds with `polarity: 'false'` and `provenance: 'user_asserted'`, and it contains no country code, age, permission class, or status value.

A second test covers short-circuit. An `all` whose first canonical operand is already `false` from recorded context does not list a later `user_asserted` operand as a dependency. A `not` of a user-asserted false atom keeps that atom's `polarity: 'false'` in the trace.

The slice does not edit `lib/readiness/rule-claims.ts`, `types/trips.ts`, `lib/readiness/official.ts`, or `MISSING_FACTS`. Wiring the parser into `wirkungLesen` is a later acceptance slice. UI questions are a later UI slice. Extractor registration, CH import, `BODY_MAX`, and F8 are not part of it.

## 15. Non-goals

This architecture does not:

- register a GOV.UK or India extractor;
- pin Common Travel Area members;
- map India purpose prose onto the enum;
- enable multi-source composition;
- implement F8 or change `regelKandidatAkzeptieren`;
- persist traveller context or `reg-eval-ctx:v1`;
- add passport numbers, MRZ, scans, biometrics, health records, or school names;
- expand `RegelScope` or `EvidenceAtom`;
- choose a best passport;
- treat `residenceCountryCode` as lawful residence;
- treat `documentType: 'passport'` as ordinary;
- start a runtime follow-up from this pull request.

## 16. Classification

The predicate vocabulary, the three-valued walker, the branch outcomes, the context boundary, and a no-migration first file pair are specified. The remaining GOV.UK composition block, the empty region pin, and the unmapped India phrases are explicit limits on later extraction. They do not leave the predicate contract itself unspecified.

PREDICATE_FOUNDATION_READY_FOR_RUNTIME_SLICE
