# Official Truth Deterministic Trusted-Fact Extractor Architecture 1

Date: 3 October 2026
Status: **docs-only architecture / Draft PR #775 / no extractor runtime / no acceptance / no migration**
Issue: #773
Draft PR: #775
Branch: `docs/official-truth-deterministic-trusted-fact-extractor-architecture-1`
Baseline: `main@a7ad77743327c01821cf2532ca253a3220c857e8`
Task: `docs/OFFICIAL_TRUTH_DETERMINISTIC_TRUSTED_FACT_EXTRACTOR_ARCHITECTURE_1_TASK_2026-10-03.md`
Logical agent: **Jetnity Official Truth deterministic trusted-fact extractor architecture 1**, Generation 1
Required model: Grok 4.7 High Fast (`grok-4.7-high-fast`), not Auto

This file is the binding architecture for a future deterministic, non-model `trustedRuleFact` extractor. It does not implement an extractor, does not call `regelKandidatAkzeptieren`, and does not authorize F8. The task file stays unchanged. `DECISIONS.md` and `docs/ACTIVE_WORK_STATUS.md` stay unchanged because the task forbids global continuity edits. A later Technical-Lead promotion into `DECISIONS.md` is a separate edit.

Live evidence for this design is the merged F8 fact-source audit on this baseline, the merged F8 composition audit, the current parsers, and Issue #294 comments `5935531376` and `5935581800`. Where an older note and the code disagree, the code and those merged audits win.

## 1. Binding principle

Permanent invariant, already binding in `docs/OFFICIAL_TRUTH_RULE_ACCEPTANCE_TRUST_BOUNDARY_1_ARCHITECTURE_2026-10-02.md` and `docs/JETNITY_ENTRY_REQUIREMENTS_OFFICIAL_TRUTH_AUTONOMY_DIRECTIVE_2026-10-02.md`:

> **Model, plugin, suggestion, or research output alone may never become `trustedRuleFact` or Official Truth.**

This architecture adds the missing source contract for a later autonomous path:

> **Every field of a complete `RegelFakt` is derived from server-reproved official material, or from an explicitly versioned deterministic composition policy that only assigns already reproved fields. A missing, ambiguous, conflicting, or drifted structure blocks. It never becomes `not_required`.**

`regelKandidatAkzeptieren` in `lib/readiness/rule-claims.ts` remains the only canonical Rule acceptance function. Extractor output is an input candidate for that function on a later slice. It is not acceptance, not a claim, and not Official Truth.

The current V1 human fact-entry path stays the only authorized way to supply `trustedRuleFact` until a later slice implements this contract and an independent Technical-Lead review authorizes that slice. This document does not authorize that slice.

These substitutes are not an extractor:

- copying `RegelKandidat.proposal` into `trustedRuleFact`;
- treating equality between a proposal and a fact as confirmation;
- a review suggestion assessment;
- `evidenceKandidatAusModell`;
- `visaModeLesen` filling `unknown` when the mode argument is null (`lib/readiness/official.ts`);
- `officialAktionAusQuelle` assigning purpose `information` to a bare URL;
- the evidence validity window used as a stay duration or a temporal anchor;
- `extractionNote`;
- the public F7 witness;
- a page snapshot that no allowlisted extractor has parsed.

`unknown`, `unavailable`, and `stale` stay distinct from `not_required`. `research_gap`, `unresolved_conflict`, and `stale_primary_evidence` stay review states. They are not facts.

## 2. Place in the chain

Merged order, with the future extractor inserted only as a design and not as code:

1. Accepted Evidence is re-proved from original retrieval input. `EvidenceVersion` carries provenance and scope. It carries no `RegelFakt` body (`lib/readiness/evidence.ts`).
2. The review packet keeps each support's `sourceSnapshot` in memory (`lib/readiness/official-truth-rule-review-packet.ts`). The public re-proof drops that snapshot and returns only version id, retrieval time, content hash, and the validity window (`reproofStuetze` in `lib/readiness/official-truth-server-held-source-registry.ts`).
3. The `review-packet:v2:` fingerprint identifies the review material, including the candidate proposal. It is an equality check. It is not the fact.
4. The F7 witness proves authority, freshness, scope, fact kind, and support ids. Its success object has no registry, no snapshot, and no fact.
5. **This contract.** A future pure extractor reads one server-built proof object and returns one complete `RegelFakt` or a fail-closed reason.
6. A later F8 composition, still unauthorized, would place that fact in `trustedRuleFact` and call `regelKandidatAkzeptieren`. The composition audit's same-request proof graph is the required holder of the snapshot. This architecture does not build that graph.
7. `akzeptierteRegelClaimSpeichern` stays a dormant store writer. It is not the acceptance boundary and not the extractor.

The extractor module must not import `regelKandidatAkzeptieren`, either store writer, the review suggestion, or a model client. A route must not import the extractor. `app/` stays untouched by the later framework slice as well, until a separate reviewed entry exists. `requirementsProviderAus()` stays `null`.

One extractor invocation is one regulatory cell: one destination or transit country, one citizenship set, one credential option, one residence mode, one requirement type, one validity mode. A second citizenship or a second travel document is a second scope key and a second invocation. The extractor does not rank credential options and does not copy an issuing country into citizenship.

## 3. Extractor registry contract

The future registry is pure data plus pure functions. It performs no network call, no catalog read, and no clock read. The same-request composition, on a later slice, selects the registry row. A request body that names an extractor, a policy, a source, or a fact is an unexpected field and fails before selection.

### 3.1 Identity

| Field | Rule |
| --- | --- |
| `extractorId` | Stable identifier matching `^otx_[a-z][a-z0-9_]{0,40}$`. One id is one source family and one `RegelFaktArt`. A second fact kind or a second source family is a second id. |
| `extractorVersion` | Positive integer. The pair `(extractorId, extractorVersion)` is immutable. A changed key, selector, heading, unit map, allowlist, or bound is a new version. Old versions stay addressable for provenance and are not selected for a new acceptance. |
| `factKind` | Exactly one member of `REGEL_FAKT_ARTEN`. |
| `sourceFamilyId` | Stable family id chosen when that source is registered. It is not a hostname discovered at parse time. |
| `sourceIds` | The closed set of official `sourceId` values this version may read. Each id must resolve as `official_authority` in the same-request registry. A licensed-provider id is `source_not_allowlisted`. |
| `urlAllowlist` | Exact canonical URL or an explicit path pattern on an already registered official host. A moved domain or an unlisted path is `domain_or_path_not_allowlisted`. |
| `contentType` | The retrieval-declared media type this version accepts, for example `application/json` or `text/html`. The extractor does not sniff a type out of prose. A missing or different type is `content_type_not_allowlisted`. |
| `schemaFamily` | The versioned structure name this parser recognizes. A missing or different family is `schema_family_not_allowlisted`. |
| `policyId` | Null when this version reads one support and every fact field comes from that support. Otherwise an id matching `^otp_[a-z][a-z0-9_]{0,40}$`. |
| `policyVersion` | Null with a null policy id. Otherwise a positive integer. The pair is immutable. |

Selection rule: the server matches `factKind`, the support `sourceId` set, the declared content type, and the declared schema family to exactly one **current** registry row. Zero matches yield `extractor_not_registered`. Two matches yield `ambiguous_structure`. Both are fail-closed. The server then pins that row's id and version into the proof object. The pure function re-checks the pin and refuses a different row.

### 3.2 Input

The only input is a frozen object built on the server stack from the same-request proof graph. It is not a route payload and not the public re-proof result.

Exact keys:

- `extractorId`
- `extractorVersion`
- `factKind`
- `requirementType` — from the re-proved scope
- `scopeKey` — the `rule-scope:v1:` key
- `evidenceQuality` — `explicit_primary_statement` or `composed_from_multiple_primary_sources`
- `supports` — one to `REGEL_SUPPORT_MAX` (8) supports, already accepted and already `current`
- `policy` — `null`, or `{ policyId, policyVersion, assignments }`
- `registry` — the single catalog snapshot, present so an `official_actions` extractor can call the existing `quellenUrlAufloesen` check. Other fact kinds may receive it and must not use it to invent fields.

Each support's exact keys:

- `versionId`
- `sourceId`
- `canonicalUrl`
- `retrievedAt`
- `sourceContentHash`
- `sourceSnapshot` — the string whose newline-normalized SHA-256 is `sourceContentHash`
- `contentType`
- `schemaFamily`

The current `EvidenceVersion` and the public re-proof support do not carry `contentType` or `schemaFamily`. A later retrieval record has to declare both before any extractor can match. Until that declaration exists, selection fails closed with `content_type_not_allowlisted` or `schema_family_not_allowlisted`. This architecture does not add that retrieval field.

Forbidden anywhere in the input, including nested values: `proposal`, suggestion output, model or plugin output, a caller `trustedRuleFact`, `extractionNote`, a witness object, and any personal key already rejected by `regelFaktLesen` (`passportNumber`, `mrz`, `biometric`, `healthRecord`, `email`, names, and the rest of that set). Presence is `personal_identifier_forbidden` or `unexpected_fields`. The reason string does not echo the value.

`validFrom` and `validUntil` stay on the freshness proof. They are omitted from the extractor input so they cannot be read as a duration, a page count, or a temporal anchor.

Before parsing, the extractor recomputes `evidenceQuellenFingerprint(sourceSnapshot)` and requires equality with `sourceContentHash`. The existing helper already returns null for an empty string and for a string longer than `INHALT_MAX` (65,536) in `lib/readiness/evidence.ts`. A mismatch, a null fingerprint, or an over-long snapshot is `snapshot_hash_mismatch` or `snapshot_bound_exceeded`. The extractor does not raise that bound. A node or depth cap, once the runtime names it inside the extractor version, fails as `snapshot_bound_exceeded` before any field is emitted.

`explicit_primary_statement` requires exactly one support and a null policy. Every fact field is read from that support. `composed_from_multiple_primary_sources` requires at least two supports, at least two distinct `sourceId` values, and a policy. The extractor does not relax the acceptance predicates already enforced by `regelKandidatAkzeptieren`.

### 3.3 Output

Success is `{ ok: true, fact }` where `fact` is one complete `RegelFakt` of the pinned `factKind`. A later caller must pass that object through `regelFaktLesen` unchanged. The extractor does not call acceptance.

Failure is `{ ok: false, reason }` with an optional field path. There is no partial fact. The reason is one of:

`personal_identifier_forbidden`, `unexpected_fields`, `fact_kind_mismatch`, `requirement_type_mismatch`, `extractor_not_registered`, `source_not_allowlisted`, `domain_or_path_not_allowlisted`, `content_type_not_allowlisted`, `schema_family_not_allowlisted`, `schema_mismatch`, `structure_not_recognized`, `required_key_missing`, `selector_missing`, `heading_meaning_changed`, `duplicate_value`, `conflicting_value`, `unknown_unit`, `unknown_qualifier`, `ambiguous_structure`, `snapshot_hash_mismatch`, `snapshot_bound_exceeded`, `source_epoch_unreadable`, `policy_required`, `policy_version_mismatch`, `policy_field_unassigned`, `fact_incomplete`, `representation_not_eligible`.

A failure is a research or review block. It is not a `RegelFakt`, not `not_required`, and not `unknown` stuffed into a fact field.

### 3.4 Purity and bounds

The function is deterministic: the same input bytes produce the same fact or the same reason. It does not fetch, does not read the clock, and does not consult a model. Parsing stops at the first closed failure. Duplicate official values that are not byte-identical after the version's canonicalization are `conflicting_value` or `duplicate_value`.

### 3.5 Composition policy

A composition policy assigns fact-field paths to supports. It does not contain legal values.

Each assignment has a field path, one `sourceId`, and the `extractorId` plus `extractorVersion` allowed to read that support. A field with no assignment is `policy_field_unassigned`. A field assigned to two sources is `conflicting_value` unless that same policy version says the two values must be equal and the parsed values are equal. Equality is not a license to fill a missing side from the present side. A missing side is `fact_incomplete`.

A policy version may name one exact integer conversion that the source field already states, for example an allowlisted integer hour count multiplied by 60 into minutes. The conversion is part of that immutable version. A word, a float, a qualifier, or a second unit fails `unknown_unit` or `unknown_qualifier`. There is no global unit converter and no converter applied to research notes.

The policy must not contain `required`, `not_required`, a visa mode, a page count, a duration, a boolean, a purpose, or an anchor as a fallback.

### 3.6 Field provenance

On success, the in-memory result may carry a provenance map from each fact-field path to `{ extractorId, extractorVersion, sourceId, versionId, policyId, policyVersion }`. `policyId` and `policyVersion` are null for a single-source extractor. That map is not a `RegelFakt` field. `regelFaktLesen` would reject it as an unexpected key if it were copied onto the fact. The map exists so the later provenance record in section 9 can be built without reading the proposal.

## 4. Eligible official material

A representation is eligible only when a registry row names it in advance.

| Representation | Eligible when |
| --- | --- |
| Official JSON or API fields | The source publishes a stable object. The extractor version allowlists each key, its type, and the fact field it fills. Extra keys that the version has not allowlisted fail `schema_mismatch`. |
| Other official machine-readable structured data | The schema family and version are explicit in the retrieval record and in the registry row. |
| Source-specific HTML tables or labelled fields | One allowlisted parser for one source family. Selectors or labels are pinned in that extractor version. The heading text that gives a column its meaning is part of the pin. |
| Another versioned source-specific structure | Same rules: closed shape, pinned version, fail closed on drift. |

A general-purpose regular expression or a model reading arbitrary government prose is `representation_not_eligible`. It is not a deterministic trusted-fact extractor.

Narrow source-specific prose may be registered only when all of the following hold, and only as its own extractor version:

- one source family, one URL allowlist, one fact kind;
- the parser matches an allowlisted sequence of labels, not a search across the page;
- every required fact field has an explicit label in that allowlist;
- the label skeleton is part of the extractor version;
- a missing, extra, or reordered label fails closed;
- a unit or qualifier outside the allowlist fails closed;
- absence of a label does not become a null field, a false boolean, or `not_required`;
- no synonym list is applied unless the synonym is an exact string pinned in that version;
- the parse stays inside the snapshot bound.

If those conditions cannot be met, the source stays on the human fact-entry path. Human fact entry remains the V1 path described in the trust-boundary architecture. This document does not convert prose research into that path's fact.

The repository today has no content type, schema family, or official JSON body on `EvidenceVersion`. Merged audit #771 classified all eight fact kinds as `REQUIRES_SEPARATE_DETERMINISTIC_EXTRACTOR`. This architecture agrees. No representation in the repository is eligible yet.

## 5. Source drift

Drift is a failed extraction. The parser does not repair it.

| Condition | Reason | What the caller does |
| --- | --- | --- |
| Expected key, selector, or label is absent | `required_key_missing` or `selector_missing` | Research or human review |
| Heading or label text differs from the pinned meaning | `heading_meaning_changed` | Research or human review |
| Two values occupy one field | `duplicate_value` or `conflicting_value` | Research or human review |
| Unit or qualifier is outside the version allowlist | `unknown_unit` or `unknown_qualifier` | Research or human review |
| Host or path leaves the allowlist | `domain_or_path_not_allowlisted` | Research or human review |
| The snapshot's own epoch cannot be read when the version requires one | `source_epoch_unreadable` | Research or human review |
| Hash no longer matches, or the structure no longer matches the pinned schema | `snapshot_hash_mismatch` or `structure_not_recognized` or `schema_mismatch` | Research or human review |
| Freshness is anything other than `current` | Not an extractor reason. The composition stops before the extractor, under the existing `officialFrische` rule | No fact |

An elapsed validity window is staleness on the evidence row. The extractor never rewrites it into `not_required`. A changed hash with a parser that no longer recognizes the body is a block even when the URL is unchanged.

## 6. The eight fact kinds

Technical bounds already in `lib/readiness/rule-claims.ts` and `lib/readiness/temporal.ts` remain safety bounds. `AUFENTHALT_WERT_MAX`, `REGEL_TRANSIT_MINUTEN_MAX`, the blank-page range 1–10, and `OFFICIAL_TEMPORAL_OFFSET_MAX_MINUTES` are not legal values and are not defaults. This section names fields and block rules only. It chooses no visa mode, duration, page count, path, purpose, or anchor for any country.

A null inside a parsed fact is legal only when the pinned structure contains an explicit null for that allowlisted key. A missing key is `required_key_missing`, not a null. A boolean must be an explicit boolean. Absence is not `false`.

### 6.1 `requirement_effect`

Target: `kind`, `effect` (`required`, `not_required`, or `conditional`), `visaMode`.

Parser: `wirkungLesen`. Non-visa cells require `visaMode: null`. Visa cells allow null or an `OFFICIAL_VISA_MODES` value, and `visaResultUndModusWidersprechen` still rejects the known contradictory pairs.

One official structure can prove this kind when that structure contains an explicit effect and, for a visa cell, an explicit mode or an explicit null. Effect and mode from two sources require a composition policy.

Block when the effect token is absent, when a visa mode is present on a non-visa cell, when the pair contradicts, or when the structure only implies an effect by omitting a sentence.

Never default `effect` to `not_required`. Never call `visaModeLesen` to fill `unknown`. Emit `unknown` only when the pinned structure contains that exact token. Absence of a mode on a visa cell is `fact_incomplete`, not `unknown`.

### 6.2 `visa_options`

Target: `kind`, `options` (one to four). Each option is `visaMode`, `eligibility` (`allowed`, `not_allowed`, `unknown`), `mandate` (`mandatory`, `not_mandatory`, `unknown`). `visaMode` is a concrete mode. The parser rejects `unknown` as a mode and rejects duplicate modes. `requirementType` must already be `visa`.

One structure can prove the kind when it enumerates each option with all three fields. Options split across sources require a composition policy. A mode that appears in only one of two sources is not completed from the other source.

Block on an empty list, a fifth option, a duplicate mode, a missing eligibility, or a missing mandate.

Never treat an unlisted mode as `not_allowed`. Never default `mandate` to `not_mandatory` or `eligibility` to `allowed`. Emit `unknown` for eligibility or mandate only from an explicit pinned token.

### 6.3 `stay_limit`

Target: `kind`, `perVisit`, `rollingWindow`, `initialGrant`, `extension`, `borderDiscretion`.

`borderDiscretion` is `fixed`, `may_be_shorter`, or `determined_at_border`. Duration slots use `{ value, unit }` with `days`, `months`, or `years`, inside `AUFENTHALT_WERT_MAX`. At least one of the four duration slots must be non-null. The parser does not consult `requirementType`.

One structure can prove the kind when the discretion and every non-null slot are explicit in that structure, and every null slot is an explicit null. Slots split across sources require a composition policy.

Block when discretion is absent, when every slot is null, when a same-unit rolling window is shorter than or equal to its maximum, when a qualifier such as "less than", "up to", or "maximum" is not an allowlisted token in that extractor version, or when the evidence validity window is the only date present.

Never default `borderDiscretion` to `fixed`. Never convert units unless that extractor version names the exact integer conversion. Never read `validFrom` or `validUntil` as a stay.

### 6.4 `passport_validity`

Target: `kind`, `semantics`, `duration`. `requirementType` must already be `passport_validity`.

`valid_on_entry` and `valid_through_stay` require a null duration. `minimum_remaining_from_entry`, `minimum_remaining_from_planned_departure`, `minimum_remaining_at_application`, and `expired_document_exception` require a duration in the stay-duration shape.

One structure can prove the kind when the semantics label is explicit and the duration rule for that semantics is explicit. Semantics and duration from two sources require a composition policy.

Block when the cell type is the only signal, when the label is a paraphrase outside the pin, or when a remaining-validity semantics has no duration.

Never default semantics to `valid_on_entry`. Never invent a remaining duration from a document expiry date. The cell is regulatory. It is not a traveller's passport.

### 6.5 `blank_passport_pages`

Target: `kind`, `minimumPages`. `requirementType` must already be `blank_passport_pages`. `minimumPages` is an integer from 1 through 10.

One structure can prove the kind when it contains that integer explicitly. A second source requires a composition policy and then only an equality rule or a single assigned source. Two different integers are `conflicting_value`.

Block when the count is absent, zero, outside 1–10, or written as a word the version has not pinned to an integer.

Never use the 1–10 bound as the count. Never default to 1 or 2. This is the smallest fact schema. Section 8 explains why that does not choose it as the first extractor.

### 6.6 `transit_conditions`

Target: `kind`, `paths` (one to eight). Each path's keys are `crossesBorderControl`, `leavesTransitArea`, `thirdCountryRequired`, `sameFlightRequired`, `onwardTicketRequired` (boolean or null), `transitAirportCodes` (null or a non-empty sorted list of unique `AAA` codes), `maxTransitDurationMinutes` (null or an integer from 1 through `REGEL_TRANSIT_MINUTEN_MAX`), and `arrivalMode` and `departureMode` (null or `air`, `land`, `sea`). A path of only nulls fails. `requirementType` must already be `transit`.

One structure can prove a path when every non-null field is explicit and every null is explicit. Fields split across sources require a composition policy. `transitCountryCode` on the scope is the cell, not a path.

Block on an empty path list, a ninth path, an empty airport array, a non-IATA code, a duration outside the technical bound, two arrival modes in one field, or a unit the version has not converted by an explicit integer rule.

Never default a boolean to `false`. `false` is a claim that the condition does not apply. Never default a mode. Never turn the transit country code into an airport list.

### 6.7 `official_actions`

Target: `kind`, `actions` (one to four). Each action is `actionSourceId`, `purpose` (`application`, `form`, `appointment`, `information`), `href`, and `visaMode` (null, or a concrete mode on a visa cell).

The href must resolve through `quellenUrlAufloesen` on the same-request registry to `official_authority`, and that source id must equal `actionSourceId`. A licensed host is `provider_action_forbidden` at acceptance. The extractor fails `source_not_allowlisted` before it emits the action.

One structure can prove an action when purpose and href are both explicit and the href resolves. A purpose from one official source and a href from another require a composition policy.

Block when the only URL is the evidence canonical URL, when purpose is absent, when `visaMode` is `unknown`, or when a non-visa cell carries a mode.

Never call `officialAktionAusQuelle`. That helper returns a different shape and would assign `information`. Never default `purpose` to `information`. Never default `visaMode`.

### 6.8 `temporal_rule`

Target: `kind`, `rule`. The rule's keys are `kind` (`relative_duration`), `availableFrom`, and `dueBy`. A point is `anchor` (`trip_departure`, `destination_arrival`, `transit_arrival`, `border_crossing`), `relation` (`before`, `at`, `after`), and `offsetMinutes`. `at` requires offset 0. The other relations require an integer from 1 through `OFFICIAL_TEMPORAL_OFFSET_MAX_MINUTES`. `dueBy` also requires `semantics` of `mandatory` or `recommended`. At least one of `availableFrom` and `dueBy` must parse. `temporalRuleLesen` does not read the validity window.

One structure can prove the kind when the anchor, relation, offset, and any due semantics are explicit. Split fields require a composition policy.

Block when the only dates are `validFrom` and `validUntil`, when the anchor is inferred from `requirementType`, when two anchors cannot be ordered, or when a word such as "before travel" is not a pinned label in that version.

Never default `semantics` to `recommended` or `mandatory`. Never invent an offset from the evidence window.

## 7. What must never be defaulted

Across all eight kinds the extractor must not supply:

- `not_required` for a missing effect;
- `unknown` for a missing visa mode, eligibility, or mandate;
- `false` for a missing transit boolean;
- `fixed` for missing border discretion;
- `valid_on_entry` for missing passport semantics;
- `information` for a missing action purpose;
- a page count, duration, airport, or minute offset taken from a technical maximum or from another cell;
- a fact copied from `proposal`, a suggestion, a model, a plugin, or a research-chat conclusion;
- a provider payload presented as `official_authority`.

## 8. First implementation sequence

Repository evidence does not prove a deterministic source family.

- Merged audit #771 found no function that builds a `RegelFakt` from a snapshot or an `EvidenceVersion`.
- `EvidenceVersion` has no content type and no schema family.
- No operational CH batch file exists in the repository. The candidate-batch validator report states that. The batches live as research continuity on Issue #294, classified `RESEARCH_ONLY` and `NOT_APPROVED_FOR_DATABASE_IMPORT`.
- Issue #294 comment `5889155160` records public diligence about the GOV.UK Content API. That note says the API returns page content, not a multi-nationality compliance engine, and it records a British-citizen scope on one example page. It is not a registered Jetnity source family. This architecture does not select it.
- `blank_passport_pages` has the smallest schema. Official page counts are not present as a pinned structure in the repository. Smallness is not a source.

Classification of the next runtime step: **`EXTRACTOR_FRAMEWORK_FIRST`**.

1. A later runtime slice may add the pure registry and the input/output contract, with fixture snapshots only. Proposed files, not created here: `lib/readiness/official-truth-trusted-fact-extractor-registry.ts` and `lib/readiness/official-truth-trusted-fact-extractor-registry.test.ts`. That slice must not call `regelKandidatAkzeptieren`, must not add a route, and must not register a real source family.
2. After that, one source-specific extractor may be written only when a separate review has re-fetched the official material and shown a pinned structure for one fact kind. That extractor is its own slice. The fact kind is chosen from the proved structure, not from schema size.
3. The same-request proof graph specified by the merged composition audit remains a separate prerequisite for any live call. The public re-proof drops `sourceSnapshot`, so an extractor cannot run on that public object. This architecture does not dispatch that graph.
4. F8 acceptance composition stays blocked until the framework, one passing source-specific extractor, the same-request graph, and the provenance record in section 9 all exist. This session does not open a follow-up.

No source family is invented here to create a first implementation.

## 9. Accepted-claim provenance

Autonomous accepted claims need a durable binding that the current claim row does not have.

What exists today:

- `private.official_rule_claims` stores the scope, fact kind, evidence quality, and the typed fact (`supabase/migrations/20261001151048_official_truth_accepted_rule_claim_persistence_schema_1.sql`).
- `private.official_rule_claim_support` stores support version ids. Those ids are derived from source id, canonical URL, content hash, retrieval time, and lookup key (`versionIdFuer` in `lib/readiness/evidence.ts`).
- The store payload in `claimPayload` (`lib/readiness/official-truth-store-server.ts`) sends the claim, the support ids, and the fact columns. It does not send an extractor id, an extractor version, a policy id, a policy version, or a `reviewPacketKey`.
- The evidence payload stores `source_content_hash` and does not store `sourceSnapshot`.
- The migration comment states that the claim table does not store a candidate or a model proposal. A repository search of that migration finds no `review_packet`, `extractor`, or `policy_version` column.

What that is sufficient for:

- Support version ids are necessary and already stored. They bind the claim to accepted official Evidence, and through that row to the content hash, URL, and retrieval time. For the current human path, the trusted fact is the authorized human entry, and the supports are its provenance.

What that is not sufficient for:

- An autonomous fact's origin. The claim cannot say which `extractorId` and `extractorVersion` produced it. A later deploy can change the parser while the stored fact looks the same. A git SHA of the deploy is not a substitute: one deploy contains many modules, and the registry version is the unit that changed the parse.
- The composition policy version, which is null only for a single-source extractor and required otherwise.
- `reviewPacketKey`. The v2 canonical form includes `candidate.proposal` (`lib/readiness/official-truth-rule-review-fingerprint.ts`). The accepted claim deliberately does not store the proposal, so the key cannot be recomputed from the claim row. The key remains an equality witness of the packet that was on the stack. It is not authority and it is not the fact. Recording the key does not require recording the proposal text.

Conclusion:

- Existing support ids plus an unstored code version are **not sufficient** for autonomous acceptance.
- A later audit/provenance record **is required** before any autonomous path persists a claim. The minimum record, beside the accepted claim and not inside the fact body, is `extractorId`, `extractorVersion`, `policyId`, `policyVersion` (both null only when the registry row says the extractor is single-source), the `reviewPacketKey` from that same request, and the support version ids. Content hashes stay on the evidence rows when those rows are retained immutably. The record does not copy `proposal` and does not copy the page snapshot if the evidence row already retains the hash.
- Adding columns or a private provenance table is a separate schema slice. This document does not add it and does not require a Production schema change. Applying any such migration to Production remains a Product-Owner gate. The pure extractor framework can be tested with fixtures before that schema exists. Autonomous persistence must not start until the record is designed, reviewed, and present in the repository. The dormant store writer is not extended here.

Re-running an extractor later is a refresh path. It needs a new or retained snapshot. The provenance record does not become a second copy of the page.

## 10. CH-01..CH-10 reuse

Issue #294 comment `5935531376`, finalized by comment `5935581800`, is the continuity for the manual Swiss-passport research phase. Both comments were read in this session. At that checkpoint, main was `7c3dc2835622355d3dd8f5fb9efa4b3e63899b9e`. Live main for this architecture is `a7ad77743327c01821cf2532ca253a3220c857e8`. The newer main does not import the batches. Development row counts and Production state in those comments are historical. This session did not query Supabase.

Preserved scope, for every batch: citizenship `CH`, document type `ordinary_passport`.

| Batch | Destinations named in `5935531376` |
| --- | --- |
| CH-01 | VN, TH, JP, US, ID, GB, CA, AU, SG, AE |
| CH-02 | NZ, KR, CN, IN, MY, TR |
| CH-03 | PH, MX, BR, ZA, EG, LK |
| CH-04 | SA, QA, OM, JO, IL, MA |
| CH-05 | KW, BH, TN, KE, TZ, MU |
| CH-06 | GR, HR, CY, MT, RS, AL |
| CH-07 | GE, AM, AZ, KZ, UZ, KG |
| CH-08 | DO, CR, PA, CO, PE, AR |
| CH-09 | CL, UY, EC, CU, JM, BS |
| CH-10 | MV, NP, KH, LA, MM, BD |

That is 64 destinations. They remain `RESEARCH_ONLY`, `NOT_APPROVED_FOR_DATABASE_IMPORT`, and Candidate Evidence. No batch is Official Truth. CH-11 is not planned and is not started here.

Reuse path:

1. Keep the batches. Do not re-research the 64 destinations from scratch.
2. Normalize them with the existing `kandidatenChargeValidieren` contract when a later slice is authorized to touch batch files. `ordinary_passport` stays `ordinary_passport`. It is not rewritten to the trip document type `passport`. A second citizenship or a second document is another batch and another regulatory cell.
3. Retain official URLs, scopes, `research_gap`, `unresolved_conflict`, and `stale_primary_evidence`. Those flags stay flags.
4. Re-fetch and re-prove the official URL when a later extractor needs the current snapshot and its structure. A stored research URL is not a `sourceSnapshot` and not a content hash.
5. When a source-specific extractor exists for that source family and fact kind, a deterministic structure may pass through it. The extractor still returns a fact or a fail-closed reason. It does not promote the batch.
6. Prose-only material, and any structure this contract classifies as ineligible, stays on the human fact-entry path.
7. Only accepted Evidence and accepted Rule Claims become reusable Official Truth, and only through `regelKandidatAkzeptieren` and a later reviewed store path.
8. A research-chat conclusion is never an autonomous trusted fact. Comment `5932615323` is an example of the boundary, not an import. It records research YAML whose qualifiers (`less_than`, `maximum`), hour units, empty airport arrays, and plural arrival modes are not a `RegelFakt`. An empty airport array fails the current path parser. A qualifier the extractor version has not pinned fails `unknown_qualifier`. This architecture does not convert those notes into minutes, booleans, or page counts.

No CH batch is imported in this slice.

## 11. Security and privacy

Global Official Truth remains non-personal regulatory knowledge. The extractor input rejects the personal-key set and does not copy the rejected value into the reason. Passport numbers, MRZ, scans, biometrics, and health records stay out of the proof object and out of the fact.

One credential option is one cell. Swiss ordinary-passport research is not applied to another citizenship or another document.

Provider truth stays separate. Sherpa and IATA Timatic are not `official_authority` under the current contracts. A licensed host cannot satisfy an action extractor. No source-licensing shortcut is created here. No provider call, secret, or spend is authorized.

The snapshot bound already enforced by `evidenceQuellenFingerprint` is the parse ceiling. The extractor does not pull a larger page.

## 12. What this document does not do

No runtime, test, migration, Auth, RLS, route, UI, or store change. No F8 implementation. No #626 implementation. No model call. No CH import. No follow-up slice. No Ready and no merge. Production apply of the existing dormant store remains a separate Product-Owner gate, and this document does not ask for it.
