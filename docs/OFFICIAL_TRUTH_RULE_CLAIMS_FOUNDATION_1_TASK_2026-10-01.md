# Official Truth Structured Rule Claims Foundation 1 — Binding Task v1.0

Date: 1 October 2026
Issue: #676
Branch: `feat/official-truth-rule-claims-foundation-1`
Baseline: `main@140fdfb9fb066ca9d23c295719cb2e770ae63fd7`

Cursor-Agent: **Jetnity Official Truth structured rule claims foundation 1**
Generation: **1**
Required model: **Grok 4.7 High Fast** — not Auto.

## 1. Authority and parent state

Product-Owner Official-Truth source strategy:
- Issue #294 comment `5928669189`.

Completed:
- #672 / PR #673 — Source Registry / Router / source-specific EvidenceVersion foundation.
- #674 / PR #675 — private Official Evidence Store schema.
- #675 merged as `main@140fdfb9fb066ca9d23c295719cb2e770ae63fd7`.
- #675 post-merge CI `36863027070` SUCCESS.
- Vercel Production `dpl_7SHeLCv859uh87pzquJ13q3wn2Cy` READY on exact main.
- Supabase Development has migration `20261001121258_official_truth_private_evidence_store_schema_1`; three private tables; zero rows.
- Supabase Production has no Official-Evidence migration/table.

## 2. Goal

Define the **pure, source-neutral Rule Claim / structured Rule Fact contract** that sits between:

source-specific `EvidenceVersion`
→ validated Rule Claim
→ later existing Requirements/Official-Truth engine adapter.

This slice does **not** wire that adapter.

The source-specific evidence layer proves:
- source identity
- retrieval URL/time
- source-content hash
- reusable regulatory scope
- lifecycle / validation state.

The Rule Claim layer will represent:
- what normalized regulatory fact is being asserted,
- which accepted source-specific EvidenceVersions support it,
- whether the support is explicit/composed/stale/conflicted/gap,
- a source-neutral scope key so multiple official sources can support the same rule without inventing a second engine.

## 3. Critical truth boundary

Research/model output is **Candidate Evidence only**.

A model/research proposal must never automatically become an accepted Rule Fact.

Implement a hard two-channel boundary:

1. candidate/research channel may contain a **proposal**;
2. acceptance receives a **separate validation-side trusted fact input**;
3. accepted output must be built only from the separate trusted fact input;
4. candidate proposal must never be copied into accepted output merely because it passed shape validation.

Required regression:
- candidate proposal says one rule;
- trusted validation-side fact says a different rule;
- accepted claim contains only the trusted fact.

This is analogous to the trusted retrieval/material boundary established in #673.

No OpenAI call exists in this slice.

## 4. One engine / no new requirement taxonomy

The canonical `OFFICIAL_REQUIREMENT_TYPES` remain unchanged.

Do **not** add:
- `visa_exemption`
- `electronic_visa`
- `arrival_form`
- `stay_duration`
- `transit_240h`
- `transit_airside`
- `transit_program`
- or any research label

to the Jetnity requirement-type taxonomy.

Normalization principles:
- visa exemption = requirementType `visa` + structured visa semantics;
- eVisa = requirementType `visa` + structured visa semantics;
- ETA/ESTA/NZeTA/K-ETA = `electronic_travel_authorization`;
- arrival card/form = `entry_form`;
- transit variants = `transit` plus structured conditions;
- onward ticket = `onward_or_return_ticket`;
- financial means = `financial_means`.

Research-only labels are not Product Truth and are not persisted as new requirement types in this slice.

## 5. New file / main contract

Expected implementation:
- `lib/readiness/rule-claims.ts`
- `lib/readiness/rule-claims.test.ts`

Naming may be German internally if consistent with existing readiness code.

### 5.1 Source-neutral Rule Scope

Derive a source-neutral scope from an existing validated `EvidenceScope` by excluding only `sourceId`.

It must retain:
- destinationCountryCode
- transitCountryCode
- citizenship mode + full citizenship set
- one credential option
- explicit related citizenship or unlinked
- residence
- requirementType
- validity / travel date

No user/account/trip/traveller/document client IDs.

Define a deterministic source-neutral key, e.g.:

`rule-scope:v1:<sha256>`

Exact prefix may be chosen once and documented, but it must be versioned and tested.

Input order must not change the key.

Two EvidenceVersions from different sources with otherwise identical regulatory scope must produce the same source-neutral rule-scope key.

Do not change the existing source-specific `evidence-key:v2:` contract.

### 5.2 Evidence support

A Rule Claim must reference source-specific EvidenceVersions by `versionId`.

Support IDs:
- sorted
- unique
- bounded (max 8)
- no hidden source text or personal data.

All supporting EvidenceVersions for one claim must resolve to the same source-neutral scope.

A scope mismatch fails closed.

### 5.3 Evidence quality

Define exactly:

- `explicit_primary_statement`
- `composed_from_multiple_primary_sources`
- `stale_primary_evidence`
- `unresolved_conflict`
- `research_gap`

Acceptance rules:

- `explicit_primary_statement`
  - at least 1 accepted/valid EvidenceVersion.
- `composed_from_multiple_primary_sources`
  - at least 2 accepted/valid EvidenceVersions
  - at least 2 distinct `sourceId` values.
- `stale_primary_evidence`
  - cannot become accepted Rule Claim.
- `unresolved_conflict`
  - cannot become accepted Rule Claim.
- `research_gap`
  - cannot become accepted Rule Claim
  - candidate proposal must be `null`
  - it must never produce `not_required` or any other negative/positive Official Truth.

No equal-evidence false equivalence is created; quality is provenance metadata.

### 5.4 Claim lifecycle

Keep claim state distinct from EvidenceVersion lifecycle.

A minimal closed contract is expected:
- candidate / pending
- accepted / valid

Rejected states may be represented only if useful, but do not invent workflow complexity.

Accepted claim output must have:
- source-neutral scope/key
- accepted structured fact
- evidence quality restricted to explicit/composed
- exact supporting accepted EvidenceVersion IDs.

No DB persistence yet.

## 6. Structured Rule Fact kinds

Define a closed `RULE_FACT_KINDS` list. It must cover these first-party needs without expanding `OfficialRequirementType`:

1. `requirement_effect`
2. `visa_options`
3. `stay_limit`
4. `passport_validity`
5. `blank_passport_pages`
6. `transit_conditions`
7. `official_actions`
8. `temporal_rule`

Exact internal constant name is yours.

### 6.1 requirement_effect

Trusted accepted shape:

- `effect`: `required | not_required | conditional`
- `visaMode`: existing `OfficialVisaMode | null`

Rules:
- only requirementType `visa` may carry non-null visaMode;
- non-visa requirement → visaMode must be null;
- reuse existing `visaResultUndModusWidersprechen()` consistency;
- contradictory result/visaMode fails closed;
- no `unknown` accepted effect; uncertainty is represented by no accepted claim / candidate quality.

Examples of valid semantics:
- visa exempt → effect `not_required`, visaMode `visa_exempt`;
- eVisa required → effect `required`, visaMode `electronic_visa`;
- ETA required → requirementType `electronic_travel_authorization`, effect `required`, visaMode null;
- positive official proof no landing card → requirementType `entry_form`, effect `not_required`.

### 6.2 visa_options

Only valid when source-neutral scope requirementType is `visa`.

Array, bounded max 4, unique by visaMode, deterministic order.

Each option:
- `visaMode`: existing modes except `unknown`
- `eligibility`: `allowed | not_allowed | unknown`
- `mandate`: `mandatory | not_mandatory | unknown`

Purpose:
Represent optional alternative legal paths without replacing the canonical visa requirement result.

Example:
visa exemption may be the requirement effect while an eVisa remains an allowed/not-mandatory alternative.

### 6.3 stay_limit

Use explicit structured semantics. Do not store a naked number.

Duration:
- positive integer value
- unit `days | months | years`
- bounded to a sensible technical safety maximum, documented as a safety bound, not legal truth.

Shape must support:
- per-visit maximum
- rolling-window maximum (e.g. 90 in 180)
- initial grant
- extension to a maximum total
- whether extension requires application
- border discretion:
  - `fixed`
  - `may_be_shorter`
  - `determined_at_border`

It must be possible to represent:
- 45 days per visit
- 90 days in 180
- 3 months per visit + max 6 months in 12 months
- initial 90 days + application-based extension to max 6 months
- “normally up to 6 months, officer may grant less”.

No conversion between months and days.

### 6.4 passport_validity

Closed discriminated semantics, not a naked “6”.

Must support:

- `valid_on_entry`
- `valid_through_stay`
- `minimum_remaining_from_entry`
- `minimum_remaining_from_planned_departure`
- `minimum_remaining_at_application`
- `expired_document_exception`

Duration required only where relevant.

It must represent:
- valid passport only;
- 6 months from entry;
- 3 months after planned departure;
- valid for entire stay;
- up to 5-year expired-document exception.

Do not infer “0 months” from a valid-passport-only rule.

### 6.5 blank_passport_pages

- minimumPages integer
- allowed technical range 1..10
- only valid when requirementType = `blank_passport_pages`.

### 6.6 transit_conditions

Only valid when requirementType = `transit`.

Represent one or more alternative transit paths, bounded max 8.

Each path may include nullable/explicit fields:
- `crossesBorderControl`
- `leavesTransitArea`
- `transitAirportCodes` (IATA-shape only; do not prove airport existence)
- `maxTransitDurationMinutes`
- `arrivalMode`: `air | land | sea | null`
- `departureMode`: `air | land | sea | null`
- `thirdCountryRequired`
- `sameFlightRequired`
- `onwardTicketRequired`

Unknown = null. Never guess.

At least one condition in each path must be non-null/non-empty.

Deterministic sort/dedupe.

### 6.7 official_actions

Array, bounded max 4.

Each action:
- `actionSourceId`
- existing `OfficialActionPurpose`
- HTTPS `href`
- optional visaMode context, only for requirementType `visa`.

Validation:
- resolve `href` with the existing Source Registry;
- resolved source must equal `actionSourceId`;
- source class must be `official_authority`;
- commercial/licensed provider must not become an “official application/form” action;
- no unregistered/insecure/credential URL;
- canonical resolved URL stored in accepted fact.

One evidence article and a different government action portal may be separate registered official sources. Do not assume source URL equals action URL.

### 6.8 temporal_rule

Reuse existing `OfficialTemporalRule` and parser/validator from `lib/readiness/temporal.ts`.

Do not duplicate temporal parsing.

## 7. Candidate proposal vs trusted accepted fact

Candidate type should carry:
- source-neutral scope/key
- fact kind
- evidence quality
- support version IDs
- proposal: structured Rule Fact or null.

Acceptance should take:
- candidate
- **separate trustedRuleFact input**
- exact supporting EvidenceVersions
- Source Registry.

Acceptance must:
1. reject stale/conflict/gap quality;
2. verify support versions match candidate IDs;
3. verify every support version is accepted/valid through existing evidence trust checks;
4. verify source-neutral scope equality;
5. enforce explicit/composed support-count/source-count rules;
6. validate trustedRuleFact for the fact kind and scope;
7. ignore candidate proposal as truth;
8. output accepted claim using only normalized trustedRuleFact.

No direct accepted-object constructor exported that bypasses these checks unless it performs identical validation.

## 8. Personal/sensitive-data boundary

No:
- userId/accountId/tripId/travellerClientRef
- passport/document numbers
- MRZ/scans/biometrics
- DOB
- health records
- names/emails

Rule Fact parsers should reject unexpected keys rather than silently carry arbitrary model payloads.

Health requirement metadata may exist as requirementType `health` / `health_document`, but no traveller health values.

## 9. Tests — mandatory

At minimum prove:

### Scope/key
- two EvidenceVersions, different sourceId, same regulatory scope → same rule-scope key;
- differing citizenship/document relation/destination/transit/residence/travel date → different rule-scope key;
- order stability.

### Quality/support
- explicit + one accepted source passes;
- composed + two distinct accepted official sources passes;
- composed with two versions from same source fails;
- stale cannot accept;
- unresolved conflict cannot accept;
- research gap cannot accept;
- research gap with non-null proposal fails.

### Trust boundary
- candidate proposal says “required/eVisa”;
- trusted validation-side fact says “not_required/visa_exempt”;
- accepted claim contains only trusted fact.

### Requirement taxonomy
- no new OfficialRequirementType values;
- entry form uses `entry_form`;
- transit subtypes stay `transit`;
- visa modes stay structured and do not become requirement types.

### Rule facts
- visa consistency;
- optional eVisa option alongside visa-exempt effect;
- stay examples above normalize and remain unit-preserving;
- passport-validity examples above;
- blank pages bounds;
- transit unknown fields remain null;
- deterministic transit path order/dedupe;
- official action resolves only to registered `official_authority`;
- licensed provider action rejected;
- temporal rule reuses current parser.

### Existing invariants
- issuer country is not citizenship;
- multiple citizenships remain peers;
- no preferred/default passport;
- no research gap → not_required path.

## 10. Docs / ADR

Update:
- `ARCHITECTURE.md`
- `DECISIONS.md` with ADR-0218 if still free after live re-fetch
- `docs/OFFICIAL_TRUTH_SOURCE_EVIDENCE_ARCHITECTURE_2026-10-01.md`

Create:
- `docs/OFFICIAL_TRUTH_RULE_CLAIMS_FOUNDATION_1_TASK_2026-10-01.md`
- `docs/OFFICIAL_TRUTH_RULE_CLAIMS_FOUNDATION_1_REPORT_2026-10-01.md`
- `docs/OFFICIAL_TRUTH_RULE_CLAIMS_FOUNDATION_1_HANDOFF_2026-10-01.md`
- `docs/OFFICIAL_TRUTH_RULE_CLAIMS_FOUNDATION_1_SELF_REVIEW_2026-10-01.md`

Docs must say:
- no DB migration in this slice;
- Development evidence tables remain empty;
- no CH research batch imported;
- no runtime provider/engine integration yet;
- next persistence change, if selected, is a separate Development-only slice.

## 11. Exact allowlist

Only:
- `lib/readiness/rule-claims.ts`
- `lib/readiness/rule-claims.test.ts`
- `ARCHITECTURE.md`
- `DECISIONS.md`
- `docs/OFFICIAL_TRUTH_SOURCE_EVIDENCE_ARCHITECTURE_2026-10-01.md`
- `docs/OFFICIAL_TRUTH_RULE_CLAIMS_FOUNDATION_1_TASK_2026-10-01.md`
- `docs/OFFICIAL_TRUTH_RULE_CLAIMS_FOUNDATION_1_REPORT_2026-10-01.md`
- `docs/OFFICIAL_TRUTH_RULE_CLAIMS_FOUNDATION_1_HANDOFF_2026-10-01.md`
- `docs/OFFICIAL_TRUTH_RULE_CLAIMS_FOUNDATION_1_SELF_REVIEW_2026-10-01.md`

If another file is required, STOP and report. Do not widen the allowlist.

## 12. Hard non-scope

No:
- SQL/migration/schema change
- Supabase remote mutation
- evidence/source data import
- CH-01/CH-02/CH-03 normalization into DB
- OpenAI/web/fetch/browser/provider call
- Sherpa/Timatic adapter
- RequirementsProvider activation
- engine/official behavior change
- public API/UI
- cron/queue/worker
- Production/indexing/launch
- #626 work
- follow-up slice.

## 13. Validation before handoff

- re-fetch main; prove branch 0 behind
- changed files exactly in allowlist
- `git diff --check`
- operating-mode guard
- targeted Rule Claim tests
- full `npm test`
- typecheck / lint / build
- standard hygiene checks
- prove no Supabase migration/data mutation
- exact-head GitHub CI/Auth + Vercel Preview
- record session URL + actual `originalModelName`
- STOP.

## 14. Stop

Stay Draft.

Do not Ready.
Do not merge.
Do not apply anything to Supabase.
Do not import Candidate Evidence.
Do not start the next slice.

**STOP for independent main-chat Technical-Lead exact-head review.**
