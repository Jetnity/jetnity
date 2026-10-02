# Official Truth F8 Deterministic Trusted-Fact Source Audit 1 — Report

Date: 3 October 2026
Issue: #769
Draft PR: #771
Branch: `docs/official-truth-f8-trusted-fact-source-audit-1`
Baseline: `main@6a12cd7abac92ba0356d7da0d3f8ec2d32df15fa`
Task: `docs/OFFICIAL_TRUTH_F8_TRUSTED_FACT_SOURCE_AUDIT_1_TASK_2026-10-03.md`
Logical agent: **Jetnity Official Truth F8 deterministic trusted-fact source audit 1**, Generation 1
Required model: Grok 4.7 High Fast (`grok-4.7-high-fast`), not Auto
Session: https://cursor.com/agents/bc-9de46031-8655-4c4a-93c4-2cdef9a4f27c
`originalModelName`: `grok-4.7-high-fast`

This report is a read-only truth-source audit. It does not implement F8, does not invent legal truth, and does not decide the composition or API owned by Issue #768.

## Question

For each current `RegelFaktArt`, does merged Jetnity possess a deterministic, server-reproved, non-model source from which a later autonomous path could construct `trustedRuleFact` without copying or trusting the Rule Candidate `proposal`?

Answer: **no fact kind has that source today.** All eight are `REQUIRES_SEPARATE_DETERMINISTIC_EXTRACTOR`. None is `CURRENTLY_DETERMINISTIC`.

## Baseline

`git fetch origin main` in this session resolved `origin/main` to `6a12cd7abac92ba0356d7da0d3f8ec2d32df15fa` (`Merge #767: add autonomous Official Truth freshness authority witness`). The branch tip before the audit documents was the task seed `7fdc076712f832e6c0b2d5d285ad673892981a66`, one commit ahead of that SHA and zero behind. Machine mode in `.jetnity/operating-mode.json` is `NORMAL`. This audit does not edit that file.

Live code wins over the older F8 paragraph in `docs/OFFICIAL_TRUTH_ACCEPTANCE_PRECONDITIONS_ADVERSARIAL_AUDIT_1_REPORT_2026-10-02.md`. That paragraph remains true about the acceptance function: it is necessary and not sufficient. F7 has since merged as PR #767. The witness does not close this fact-source gap.

## Method

Read the binding directive, the F8 section of the acceptance-preconditions audit, the trust-boundary architecture, and the freshness-witness report. Then read the current parsers and the evidence, retrieval, candidate, review-packet, fingerprint, server-held reproof, witness, suggestion, and dormant store modules. A local reproduction imported those functions. It was not added to the branch. The probe snapshot was a fixture string. This audit does not treat that string as a visa, stay, passport, transit, or action rule.

## Invariants

| Claim | Result | Evidence |
| --- | --- | --- |
| `regelKandidatAkzeptieren` ignores `proposal` when building the accepted fact | **Proven** | `lib/readiness/rule-claims.ts` lines 825–888. The function body after `export function regelKandidatAkzeptieren` does not contain `proposal`. It rebuilds the candidate with `regelKandidatErstellen`, then parses only `satz.trustedRuleFact`. The existing test `der Kandidatenvorschlag wird nicht zur akzeptierten Regel` in `lib/readiness/rule-claims.test.ts` lines 406–428 locks a conflicting proposal out of the claim. |
| `trustedRuleFact` is a separate value and the only fact source at acceptance | **Proven for the function, not for the caller** | The accepted `fact` is `fakt.fact` from `regelFaktLesen(..., satz.trustedRuleFact, registry)` at line 876. The reproduction also showed the hole: passing the proposal object itself as `trustedRuleFact` is accepted, because the function trusts that argument and does not compare it with `proposal`. A byte-inequality check would not be a source. A human fact may match a proposal by coincidence. Agreement is not proof. |
| Accepted Evidence proves provenance, scope, retrieval, and validity, not the structured Rule fact | **Proven** | `EvidenceVersion` in `lib/readiness/evidence.ts` lines 134–152 has no `effect`, `options`, `fact`, `proposal`, or `sourceSnapshot`. The reproduction listed those keys and rejected the accepted Evidence object as `trustedRuleFact` with `invalid_fact_kind`. |
| `validFrom`, `validUntil`, and `extractionNote` are not a Rule fact | **Proven** | Candidate extraction allows only those three fields (`lib/readiness/official-truth-retrieved-candidate-evidence.ts` line 25). `extractionNote` is a trimmed note of at most 240 characters (`lib/readiness/evidence.ts` lines 29 and 584–590). The review support copies the validity window and drops the note (`lib/readiness/official-truth-rule-review-packet.ts` lines 80–93 and 161–171). `temporalRuleLesen` documents that it does not read `validFrom` or `validUntil` (`lib/readiness/temporal.ts` lines 108–114). The reproduction passed the evidence window into that parser and received `null`. |
| A source snapshot is official evidence text, not a structured fact | **Proven** | `evidenceQuellenFingerprint` normalizes newlines and hashes the text (`lib/readiness/evidence.ts` lines 470–479). It does not read words. The review packet carries `sourceSnapshot` as a string (lines 85–94). The v2 fingerprint provenance is only `versionId`, `sourceId`, `canonicalUrl`, `retrievedAt`, `sourceContentHash`, `validFrom`, and `validUntil` (`lib/readiness/official-truth-rule-review-fingerprint.ts` lines 26–34 and 185–194). Server-held reproof drops the snapshot again (`lib/readiness/official-truth-server-held-source-registry.ts` lines 305–314). Passing the snapshot string as `trustedRuleFact` returned `invalid_fact_kind`. |
| Model, plugin, or suggestion agreement cannot replace an extractor | **Proven** | `evidenceKandidatAusModell` rejects decision fields and does not translate them into Official Truth (`lib/readiness/evidence.ts` lines 60–68 and 623–636). `officialTruthRegelReviewVorschlag` returns `assessment`, citations, and reason codes only (`lib/readiness/official-truth-review-suggestion.ts` lines 17 and 288–295). The witness forbids `trustedRuleFact`, `suggestion`, and `modelAuthority` (`lib/readiness/official-truth-autonomous-preacceptance-witness-server.ts` lines 74–82). Its success object is proof metadata, not a fact (lines 102–113 and 265–275). `requirementsProviderAus()` returns `null` (`lib/readiness/provider.ts` lines 99–101). |

The v2 fingerprint canonical form includes `proposal` (`lib/readiness/official-truth-rule-review-fingerprint.ts` lines 160–168). That binds review-material identity. It does not mint the proposal as truth. The file header says the key is not acceptance and not Official Truth.

`akzeptierteRegelClaimSpeichern` still calls `regelKandidatAkzeptieren` and then the dormant store (`lib/readiness/official-truth-store-server.ts` lines 336–345). No `app/` route calls that function. This audit did not query a database.

## What is server-reproved today

These values can be rebuilt without trusting a model decision:

- regulatory cell: destination, transit country, citizenship set, one credential option, residence, `requirementType`, validity mode and travel date;
- provenance: `sourceId`, `official_authority`, authority and publisher names, canonical URL, `retrievedAt`, `sourceContentHash`;
- evidence window: `validFrom`, `validUntil`;
- candidate labels already on the packet: `factKind`, `evidenceQuality`, sorted support version ids;
- witness success: recomputed `reviewPacketKey`, `ruleScopeKey`, `factKind`, support ids, server reference time, freshness `current`, and the role-grant echo.

`factKind` is the caller label that survived structural checks. It selects a parser. It does not fill that parser's fields.

`requirementType` constrains some parsers. It is not the fact body. For a non-visa cell, `visaMode` must be null. The effect, the page count, the duration, the path, the action purpose, and the temporal anchor remain absent.

The only production code that returns a `RegelFakt` is `regelFaktLesen` and its helpers in `lib/readiness/rule-claims.ts` lines 441–758. Each helper copies fields from the object it was given. A repository search found no other `lib/` constructor that turns a snapshot or an `EvidenceVersion` into one of the eight fact kinds.

## Fact kinds

Technical maxima below are safety bounds. `AUFENTHALT_WERT_MAX`, `REGEL_TRANSIT_MINUTEN_MAX`, the blank-page range 1–10, and `OFFICIAL_TEMPORAL_OFFSET_MAX_MINUTES` are not legal defaults and are not facts.

### 1. `requirement_effect` — `REQUIRES_SEPARATE_DETERMINISTIC_EXTRACTOR`

Parser: `wirkungLesen`, `lib/readiness/rule-claims.ts` lines 441–459. Exact keys: `kind`, `effect`, `visaMode`.

- `kind` must be `requirement_effect`.
- `effect` must be `required`, `not_required`, or `conditional`.
- When `requirementType` is not `visa`, `visaMode` must be null.
- When `requirementType` is `visa`, `visaMode` must be null or one of `visa_exempt`, `visa_on_arrival`, `electronic_visa`, `visa_before_travel`, `unknown`.
- `visaResultUndModusWidersprechen` rejects `required` plus `visa_exempt`, and `not_required` plus `visa_on_arrival`, `electronic_visa`, or `visa_before_travel`.

Accepted Evidence has `requirementType` on the scope and none of `effect` or `visaMode`. Those names are decision fields. `evidenceKandidatAusModell` rejects them with `model_decision_forbidden`. They exist on the untrusted `proposal` and on a separately supplied `trustedRuleFact`.

`visaModeLesen('visa', null)` returns `unknown` (`lib/readiness/official.ts` lines 135–143). That is a display normalizer. It does not supply `effect`, and this audit does not adopt `unknown` as a legal outcome.

The snapshot may be prose. Nothing parses it into `effect` or `visaMode`. Forcing `visaMode: null` on a non-visa cell still leaves `effect` empty, so the fact is incomplete.

### 2. `visa_options` — `REQUIRES_SEPARATE_DETERMINISTIC_EXTRACTOR`

Parser: `visaOptionenLesen`, lines 462–483. Exact keys: `kind`, `options`. `requirementType` must be `visa`.

Each option's exact keys are `visaMode`, `eligibility`, and `mandate`.

- `visaMode` must be a concrete mode. `unknown` is rejected.
- `eligibility` is `allowed`, `not_allowed`, or `unknown`.
- `mandate` is `mandatory`, `not_mandatory`, or `unknown`.
- One to four options. Duplicate modes fail.
- Options are sorted by `OFFICIAL_VISA_MODES`.

`optionEligibility` and `optionMandate` are decision fields and cannot ride in on Evidence. The scope's single `credentialOption` is the traveller document cell, not a visa-mode list. No deterministic function builds `options`.

### 3. `stay_limit` — `REQUIRES_SEPARATE_DETERMINISTIC_EXTRACTOR`

Parser: `aufenthaltLesen`, lines 486–532. Exact keys: `kind`, `perVisit`, `rollingWindow`, `initialGrant`, `extension`, `borderDiscretion`. The parser does not check `requirementType`.

- `borderDiscretion` is `fixed`, `may_be_shorter`, or `determined_at_border`.
- `perVisit` and `initialGrant` are null or `{ value, unit }` with unit `days`, `months`, or `years`, integer value from 1 through `AUFENTHALT_WERT_MAX`.
- `rollingWindow` is null or `{ maximum, within }`. Same-unit windows with `within <= maximum` fail.
- `extension` is null or `{ requiresApplication, maximumTotal }`.
- At least one of the four duration slots must be non-null.

None of these fields exist on accepted Evidence, provenance, scope, or the validity window. The validity window is a calendar bound on the evidence row, not a stay duration. No extractor fills the six keys.

### 4. `passport_validity` — `REQUIRES_SEPARATE_DETERMINISTIC_EXTRACTOR`

Parser: `passLesen`, lines 535–549. `requirementType` must be `passport_validity`. Allowed keys: `kind`, `semantics`, and optional `duration`. `kind` and `semantics` are required.

Semantics:

- `valid_on_entry` and `valid_through_stay` require a missing or null `duration`.
- `minimum_remaining_from_entry`, `minimum_remaining_from_planned_departure`, `minimum_remaining_at_application`, and `expired_document_exception` require a duration in the same shape as a stay duration.

The scope can already say the cell is `passport_validity`. That does not choose a semantics value or a remaining duration. No parser reads the snapshot for either field.

### 5. `blank_passport_pages` — `REQUIRES_SEPARATE_DETERMINISTIC_EXTRACTOR`

Parser: `leereSeitenLesen`, lines 552–563. `requirementType` must be `blank_passport_pages`. Exact keys: `kind`, `minimumPages`.

`minimumPages` must be an integer from 1 through 10. That range is a technical bound at lines 66–67, not a legal page count.

This is the smallest complete fact schema. It is still not derivable. Accepted Evidence has no page count. The snapshot is not parsed. There is no non-model function that returns `{ kind: 'blank_passport_pages', minimumPages }`.

### 6. `transit_conditions` — `REQUIRES_SEPARATE_DETERMINISTIC_EXTRACTOR`

Parser: `transitLesen` and `transitPfadLesen`, lines 566–654. `requirementType` must be `transit`. Exact fact keys: `kind`, `paths`. One to eight paths. Duplicate paths collapse. Paths are sorted by their JSON text.

Each path's exact keys:

- `crossesBorderControl`, `leavesTransitArea`, `thirdCountryRequired`, `sameFlightRequired`, `onwardTicketRequired`: boolean or null;
- `transitAirportCodes`: null or a non-empty list of unique `AAA` codes, sorted;
- `maxTransitDurationMinutes`: null or an integer from 1 through `REGEL_TRANSIT_MINUTEN_MAX`;
- `arrivalMode` and `departureMode`: null or `air`, `land`, or `sea`.

A path of only nulls is rejected. The scope field `transitCountryCode` is a country code on the cell. It is not a path, an airport list, a mode, or a duration. No function builds `paths` from the snapshot or from that country code.

### 7. `official_actions` — `REQUIRES_SEPARATE_DETERMINISTIC_EXTRACTOR`

Parser: `amtshandlungenLesen` and `amtsaktionLesen`, lines 657–716. Exact fact keys: `kind`, `actions`. One to four actions. Duplicates collapse. Actions are sorted by source, purpose, href, and visa mode.

Each action's exact keys: `actionSourceId`, `purpose`, `href`, `visaMode`.

- `actionSourceId` matches `^[a-z][a-z0-9_-]{1,63}$` and the registry source of the resolved href.
- `purpose` is `application`, `form`, `appointment`, or `information`.
- `href` must resolve through `quellenUrlAufloesen` to `official_authority`. A licensed host is `provider_action_forbidden`. A different source id is `action_source_mismatch`.
- For a non-visa cell, `visaMode` must be null. For `visa`, it must be null or a concrete mode. `unknown` is rejected.

`officialAktionAusQuelle` (`lib/readiness/official.ts` lines 213–218) returns `{ kind: 'open_official_action', purpose: 'information', href }` for a usable URL. The comment above it says a source URL is never an application, form, or appointment. The reproduction passed that object as an `official_actions` proposal and `regelKandidatErstellen` returned `invalid_fact_kind`. The helper also omits `actionSourceId` and `visaMode`, and it does not perform the registry source-class check inside `amtsaktionLesen`.

Using it as `trustedRuleFact` would both fail the parser and, if reshaped by a later writer, assign `information` by default. That assignment is a product-policy choice. This audit does not make it. The evidence canonical URL and `sourceId` are provenance. They are not an action list.

### 8. `temporal_rule` — `REQUIRES_SEPARATE_DETERMINISTIC_EXTRACTOR`

Parser: `zeitregelLesen` plus `temporalRuleLesen`, `lib/readiness/rule-claims.ts` lines 719–738 and `lib/readiness/temporal.ts` lines 108–136. Exact outer keys: `kind`, `rule`.

The rule's allowed keys are `kind`, `availableFrom`, and `dueBy`. `kind` must be `relative_duration`. At least one of `availableFrom` and `dueBy` must parse. Extra keys on the rule fail before the temporal parser.

A point is `anchor`, `relation`, and `offsetMinutes`.

- Anchors: `trip_departure`, `destination_arrival`, `transit_arrival`, `border_crossing`.
- Relations: `before`, `at`, `after`. `at` requires offset 0. The other relations require an integer from 1 through `OFFICIAL_TEMPORAL_OFFSET_MAX_MINUTES`.
- `dueBy` also requires `semantics` of `mandatory` or `recommended`.
- A same-anchor window with `availableFrom` after `dueBy` fails.

The parser does not read requirement type, URL, `validFrom`, `validUntil`, or free text. Mapping the evidence window onto an anchor would invent a relative rule. The reproduction confirmed that a `relative_duration` object carrying only the evidence window returns `null`. No other deterministic transform builds this object.

## Initial autonomy recommendation

1. **No fact kind is safe for autonomous acceptance today** without a new deterministic fact extractor. A policy that copies `proposal`, a suggestion assessment, `visaModeLesen`'s `unknown`, or `officialAktionAusQuelle`'s `information` purpose is not that extractor.
2. There is no existing function with full-field coverage. `regelFaktLesen` validates a supplied object. It does not discover one.
3. The smallest next prerequisite class is one deterministic, non-model extractor for a named fact kind. It would read a server-reproved source snapshot, or a future structured official record that is itself non-model and re-proved, plus the already re-proved `requirementType` and, for actions, the server-held registry. It would return a complete object that `regelFaktLesen` accepts. It would not read `proposal`, suggestion output, model output, `extractionNote`, or the evidence validity window as the fact. It would fail closed when any required field is unproven. This audit does not design or implement that extractor.
4. No subset is safe to accept now. If a later authorized writer specifies an extractor, the smallest schema to specify it against is `blank_passport_pages`: `kind` plus one integer `minimumPages`, and only when the re-proved cell is already `requirementType: 'blank_passport_pages'`. That integer is still a legal count. The 1–10 bound must not be used as the count. The other seven kinds stay blocked because they need an effect, a visa mode, eligibility, a mandate, a duration, a border discretion, a passport semantics value, a transit path, an action purpose, or a relative temporal anchor. Those values are not in the re-proved evidence row.
5. This audit chooses none of those legal values.

A shallow guard that only rejects `trustedRuleFact === proposal` is not the prerequisite. The acceptance function will store whatever object parses. The missing piece is an independent source for that object.

Issue #768 owns composition and API shape. This audit does not choose how an extractor would be called, stored, or composed with the witness. The Technical Lead synthesizes #768 and #769 before any F8 runtime writer.

## Reproduction

Command, from the repository root, with no network and no Supabase client:

`node --import ./scripts/server-only-test-register.mjs --import tsx /tmp/f8-fact-source-repro.ts`

Exit 0. The script is not in the branch. Relevant stdout:

- `acceptanceBodyMentionsProposal`: false
- `evidenceHasNoFactBody`: true
- accepted Evidence keys do not include `sourceSnapshot`, `effect`, `fact`, or `proposal`
- a conflicting proposal stayed out of the accepted fact
- the same proposal object passed as `trustedRuleFact` was accepted
- the accepted Evidence object as `trustedRuleFact`: `invalid_fact_kind`
- the snapshot string as `trustedRuleFact`: `invalid_fact_kind`
- the evidence window passed to `temporalRuleLesen`: null
- `officialAktionAusQuelle` shape `open_official_action` / `information` rejected as an `official_actions` proposal with `invalid_fact_kind`
- `requirementsProviderAus()`: null

The fixture host `gov.example` and the probe sentence are not official law.

## Traveller context

One accepted scope remains one regulatory cell. A second citizenship set or a second credential option is a different rule-scope key, as `regelScopeAusEvidenceScope` already defines. This audit does not collect a passport, MRZ, or other credential, and it does not invent a visa, transit, health, carrier, eligibility, or document rule for any cell. `unknown` stays unknown where a parser allows that token. This audit does not write that token into a fact.

## Boundaries

No runtime, test, migration, Auth, route, store, provider, model, secret, or cost change. No #626 work. No F8 implementation. No follow-up slice. `docs/ACTIVE_WORK_STATUS.md` and the task file were not edited. The task forbids global current-state edits; the handoff in this trio is the continuity record.

## Validation

| Check | Result |
| --- | --- |
| `git fetch origin main` | `6a12cd7abac92ba0356d7da0d3f8ec2d32df15fa` |
| behind `origin/main` at that fetch | 0 |
| reproduction script | exit 0 |
| `git diff --check` | recorded in the self-review for the docs commit |
| operating-mode guard | recorded in the self-review for the docs commit |
| runtime, tests, migrations | not edited |
| `npm test`, typecheck, lint, production build | not run. This slice does not change runtime. They are not certified |

## Stop

Stay Draft. Stop for independent Technical-Lead exact-head review. Do not Ready, merge, or open a follow-up from this session.
