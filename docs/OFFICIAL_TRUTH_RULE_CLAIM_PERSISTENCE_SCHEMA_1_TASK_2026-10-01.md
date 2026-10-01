# Official Truth Accepted Rule Claim Persistence Schema 1 — Binding Task v1.0

Date: 1 October 2026
Issue: #678
Branch: `feat/official-truth-rule-claim-persistence-schema-1`
Baseline: `main@f4ed316714687ca597c59ce47bfb69f5a290440b`

Cursor-Agent: **Jetnity Official Truth accepted Rule Claim persistence schema 1**
Generation: **1**
Required model: **Grok 4.7 High Fast** — not Auto.

## 0. Technical-Lead R1 override

Technical-Lead review R1 (`5380789875`) is accepted. R2 (`5381107826`) requires this override to live in this binding task. It supersedes every conflicting sentence below, including the historical `1..16` airport bullet in section 8.6. Do not restore the obsolete cap.

This file is inside the section 14 allowlist. It is one of the four named task, report, handoff and self-review docs. It is not outside the allowlist. `docs/ACTIVE_WORK_STATUS.md` remains outside the allowlist.

### Airport lists

The original section 8.6 rule “if non-null, 1..16 codes” is superseded.

A present `transit_airport_codes` list has **no finite maximum**. Persistence must accept the canonical list:

- non-empty;
- IATA-shaped `A-Z{3}`;
- sorted;
- unique.

`NULL` remains valid when the path is not scoped to explicit airports. The database does not prove that an airport exists. `lib/readiness/rule-claims.ts` stays unchanged. `flughaefenLesen` still canonicalizes a valid list and still rejects a malformed code. Persistence stores that canonical list and rejects an unsorted, duplicate or malformed array.

### Matching fact payload

Every persisted accepted claim must have at least one matching typed fact row for its own `fact_kind` when the transaction commits. This is the deferred constraint-trigger requirement accepted in R1.

- A claim with no matching fact row fails at `COMMIT`.
- Deleting the last matching fact row while the claim remains fails at `COMMIT`.
- Scalar fact kinds keep their one-row primary key.
- `visa_options`, `transit_conditions` and `official_actions` require at least one row. Their ordinal maximums stay.
- The claim and its fact may be inserted in either order inside one transaction, because the completeness check and the fact-table foreign keys are deferred.
- The trigger does not count supports and does not enforce distinct-source acceptance. Those stay with the later trusted writer. It is not a second truth engine.

The section 9 sentence “no triggers unless absolutely required” still stands for support-count and acceptance logic. The deferred fact-payload trigger is the accepted exception, because the completeness rule is cross-table.

## 1. Authority / parents

Product-Owner Official-Truth strategy:
- Issue #294 comment `5928669189`.

Canonical parents:
- #673 / ADR-0216 — source registry/router + EvidenceVersion contract.
- #675 / ADR-0217 — private Evidence Store schema.
- #677 / ADR-0218 — source-neutral structured Rule Claim contract.

#677 is MERGED / POST-MERGE VERIFIED:
- new main `f4ed316714687ca597c59ce47bfb69f5a290440b`
- post-merge CI `36871328542` SUCCESS
- Auth `110399550274` SUCCESS
- Typecheck/Lint/Tests/Build `110399550508` SUCCESS
- Vercel Production `dpl_5j9XiZKvGR7Hf5Q9TSbgKcLanoyA` READY.

## 2. Live state before editing

Re-fetch main, open PRs/issues and relevant schema/contracts before editing.

At task creation:
- main = `f4ed316714687ca597c59ce47bfb69f5a290440b`
- no current product writer besides this new slice
- historical drafts #52/#50/#40/#39/#28 are not current writers
- #626 remains OPEN/BLOCKED; do not touch it.

Supabase Development:
- branch `develop`
- ref `yfvbxvijcorffwxbxahl`
- PostgreSQL 17.6 / UTC
- migration `20261001121258_official_truth_private_evidence_store_schema_1`
- tables:
  - `private.official_sources`
  - `private.official_source_domains`
  - `private.official_evidence_versions`
- row counts 0 / 0 / 0
- no Rule Claim table.

Supabase Production `qscbgcdmivbbnzrcyegn`:
- no Official-Evidence / Rule-Claim migration
- no private Official-Truth tables.

Cursor MUST NOT mutate either remote database.

## 3. Goal

Create the **repository persistence schema for already accepted Rule Claims**.

The database stores only output equivalent to:
`AkzeptierteRegelClaim`

It must never persist:
- `RegelKandidat`
- candidate/model `proposal`
- `research_gap`
- `unresolved_conflict`
- stale candidate facts
as accepted truth.

This slice is:
- one repository migration
- one focused static schema test
- architecture/ADR/report/handoff/self-review.

There is still NO runtime writer/adapter in this slice.

After independent TL exact-head PASS, TL may apply this exact migration to **Development only** and run readback/advisors.
Production remains a Product-Owner gate.

## 4. Canonical trust model

Do not duplicate or replace `regelKandidatAkzeptieren()`.

Canonical acceptance remains in:
`lib/readiness/rule-claims.ts`

Persistence receives only already accepted output.

Database constraints should prove structural invariants and relational support integrity where practical, but SQL must not become a second Official-Truth engine.

The database must preserve:
- source-neutral `rule-scope:v1:<sha256>`
- accepted fact kind
- accepted evidence quality
- source-neutral regulatory scope
- structured accepted fact
- links to exact supporting accepted EvidenceVersions.

## 5. Existing Evidence Store extension

Because a Rule Claim is source-neutral while EvidenceVersion is source-specific, add a persisted source-neutral key to Evidence rows.

### `private.official_evidence_versions`

Add:
- `rule_scope_key text NOT NULL`

Format:
`^rule-scope:v1:[a-f0-9]{64}$`

Development currently has zero evidence rows, so no data backfill or fabricated key is needed.

Do NOT compute the key in SQL.
A later trusted server writer derives it through the canonical TypeScript rule-scope contract.

Add only the uniqueness/composite keys needed so claim-support FKs can prove:
- exact Evidence version
- same rule_scope_key
- accepted lifecycle
- valid validation state
- same source_id.

Also add only the composite source key needed for an FK to prove source class.

Do not change existing Evidence semantics.

## 6. Base accepted-claim table

Create:

### `private.official_rule_claims`

Use a DB-local surrogate primary key such as generated bigint identity.
It is persistence identity, not Product Truth.

Store at minimum:

- `claim_id`
- `rule_scope_key`
- `fact_kind`
- `evidence_quality`
- `lifecycle` fixed to `accepted`
- `validation_state` fixed to `valid`
- `accepted_at` audit timestamp

Persist source-neutral scope as typed columns, matching `RegelScope` / EvidenceAtom without `sourceId`:

- destination_country_code
- transit_country_code
- citizenship_mode
- citizenship_country_codes
- credential_option_mode
- document_type
- issuing_country_code
- related_citizenship_country_code
- residence_mode
- residence_country_code
- requirement_type
- validity_mode
- travel_date

Carry forward the existing fail-closed constraints from Evidence Store:
- destination/transit: at least one
- ISO-2 shape only
- citizenship set sorted/unique/bounded
- explicit credential option needs document type + issuer
- issuer is never citizenship
- related citizenship nullable = unlinked
- non-null relation belongs to citizenship set
- required residence needs country
- travel_date mode needs a real date
- no Primary/Default/Preferred citizenship/passport.

### Accepted-only values

`fact_kind` must stay synchronized with `REGEL_FAKT_ARTEN`:
- requirement_effect
- visa_options
- stay_limit
- passport_validity
- blank_passport_pages
- transit_conditions
- official_actions
- temporal_rule

`evidence_quality` may persist ONLY:
- explicit_primary_statement
- composed_from_multiple_primary_sources

Do not persist the three non-acceptable qualities as accepted rows.

## 7. Exact Evidence support table

Create:

### `private.official_rule_claim_support`

Each row links one accepted claim to one exact EvidenceVersion.

Persist enough redundant FK fields to let PostgreSQL prove:
- support belongs to the same claim `rule_scope_key`;
- Evidence lifecycle is exactly `accepted`;
- Evidence validation state is exactly `valid`;
- source id matches the Evidence row;
- source class is exactly `official_authority`.

Recommended fields:
- claim_id
- rule_scope_key
- version_id
- source_id
- evidence_lifecycle fixed `accepted`
- evidence_validation_state fixed `valid`
- source_class fixed `official_authority`

Use composite FKs/unique constraints rather than a trigger if practical.

Primary key:
- claim_id + version_id

No support may reference a licensed provider as primary Official Truth.

The DB does not need to reimplement the candidate acceptance algorithm.
Support count / distinct-source-count remains a trusted-writer responsibility unless it can be enforced cleanly without creating a second engine.

Document this boundary explicitly.

## 8. Structured fact persistence

Do NOT put all accepted truth into one unrestricted opaque JSONB column.

Persist the eight closed fact kinds using typed subtype tables.

Expected logical tables:

1. `private.official_rule_claim_requirement_effect`
2. `private.official_rule_claim_visa_options`
3. `private.official_rule_claim_stay_limit`
4. `private.official_rule_claim_passport_validity`
5. `private.official_rule_claim_blank_pages`
6. `private.official_rule_claim_transit_paths`
7. `private.official_rule_claim_actions`
8. `private.official_rule_claim_temporal_rule`

Exact names may differ slightly if clearly documented.

Use claim_id + fact_kind + requirement_type composite linkage where useful so a row cannot attach to the wrong claim kind/type.

### 8.1 requirement_effect

Persist:
- effect: required | not_required | conditional
- visa_mode: existing OfficialVisaMode or null

Constraints:
- non-visa requirement => visa_mode null
- visa contradictions prohibited consistently with current contract:
  - required + visa_exempt invalid
  - not_required + visa_on_arrival/electronic_visa/visa_before_travel invalid
- no accepted effect `unknown`.

### 8.2 visa_options

Only requirement_type = visa.

Multiple rows, max 4 by ordinal/constraint.

Each:
- visa_mode concrete, not `unknown`
- eligibility: allowed | not_allowed | unknown
- mandate: mandatory | not_mandatory | unknown

Unique visa_mode per claim.

### 8.3 stay_limit

Typed columns matching `RegelAufenthalt`:

- perVisit duration pair nullable
- rollingWindow maximum + within duration pairs nullable
- initialGrant duration pair nullable
- extension requiresApplication + maximumTotal nullable group
- borderDiscretion:
  fixed | may_be_shorter | determined_at_border

Duration units:
- days | months | years

Technical safety bounds MUST match `AUFENTHALT_WERT_MAX`:
- days <= 3660
- months <= 120
- years <= 10

Do not convert units.

At least one duration structure must be present.

If rolling maximum and within use the same unit, within must be greater than maximum, matching the TypeScript contract.

### 8.4 passport_validity

Only requirement_type = passport_validity.

Semantics:
- valid_on_entry
- valid_through_stay
- minimum_remaining_from_entry
- minimum_remaining_from_planned_departure
- minimum_remaining_at_application
- expired_document_exception

For valid_on_entry / valid_through_stay:
- duration must be null.

For the other semantics:
- duration is required and uses the same duration-unit safety bounds.

Never encode “valid passport” as 0 months.

### 8.5 blank_passport_pages

Only requirement_type = blank_passport_pages.

- minimum_pages integer 1..10.

### 8.6 transit_paths

Only requirement_type = transit.

Multiple rows, max 8 via ordinal bound.

Fields matching accepted `RegelTransitPfad`:
- crosses_border_control
- leaves_transit_area
- transit_airport_codes
- max_transit_duration_minutes
- arrival_mode
- departure_mode
- third_country_required
- same_flight_required
- onward_ticket_required

Modes:
- air | land | sea

Unknown = NULL.

`transit_airport_codes`:
- NULL when not scoped to explicit airports;
- historical original wording, superseded by section 0: if non-null, 1..16 codes;
- current rule, section 0: if non-null, non-empty, IATA-shaped, sorted and unique, with no finite maximum;
- each code IATA-shape A-Z{3};
- do not prove airport existence.

max duration:
- 1..20160 minutes, matching `REGEL_TRANSIT_MINUTEN_MAX`.

At least one path condition must be non-null/non-empty.

Research `arrivalModes: [air, sea]` is not stored as a free combined string; a later normalizer must create separate accepted paths if/when validated.

### 8.7 official_actions

Multiple rows, max 4 via ordinal bound.

Persist:
- action_source_id
- source_class fixed `official_authority`
- purpose: application | form | appointment | information
- canonical HTTPS href
- visa_mode optional only for requirement_type = visa.

FK action source to the registry and structurally require official authority.

Do not allow licensed provider as official action source.

Do not attempt to duplicate the full Source Registry URL resolver in SQL.

### 8.8 temporal_rule

Persist the existing `OfficialTemporalRule` structure.

Reuse constants from `lib/readiness/temporal.ts` in static synchronization tests.

Store nullable availableFrom group:
- anchor
- relation
- offset_minutes

Store nullable dueBy group:
- anchor
- relation
- offset_minutes
- semantics

At least one group must exist.

Offset technical max:
`OFFICIAL_TEMPORAL_OFFSET_MAX_MINUTES`

Do not implement notifications/scheduler.

## 9. Security boundary

Everything remains in unexposed `private`.

Requirements:
- RLS enabled + forced on all new claim tables
- no policies
- revoke all from PUBLIC, anon, authenticated, service_role
- no direct browser read/write
- no public views
- no public RPC
- no SECURITY DEFINER
- no triggers unless absolutely required; prefer relational FKs/checks
- section 0 exception: one deferred constraint trigger requires the matching fact payload at commit and does not count supports
- no default-privilege/global-grant changes.

This persistence store is global non-personal infrastructure.

## 10. Personal / sensitive boundary

No columns or JSON payloads for:
- user/account/trip/traveller IDs
- travellerClientRef
- passport/document number
- MRZ
- scans
- biometrics
- DOB
- names/emails/phone
- health records.

Health/vaccination requirement facts are regulatory metadata only.

## 11. Migration creation

Before creating:
- inspect migration conventions.

Use:
`supabase migration new official_truth_accepted_rule_claim_persistence_schema_1`

if CLI is available.

Do not invent the repository timestamp manually.

If the CLI cannot create the migration, STOP and report rather than guessing.

Cursor MUST NOT:
- push/apply/repair/rebase/reset remote Supabase history
- apply this migration to Development
- apply anything to Production.

## 12. Focused static tests

Create:
`lib/readiness/rule-claim-store-schema.test.ts`

It must inspect the migration and import canonical TypeScript constants where useful.

Prove at minimum:

- exactly one matching new migration file;
- no INSERT/seed data;
- no cron/pgmq/net/http;
- no SECURITY DEFINER/public RPC;
- no public claim tables;
- no grants to anon/authenticated/service_role;
- no personal/sensitive columns;
- fact-kind list matches `REGEL_FAKT_ARTEN`;
- accepted quality list contains exactly explicit/composed;
- requirement taxonomy matches current OfficialRequirementType;
- support FK contract requires accepted + valid + same scope + official_authority;
- no licensed provider support path;
- `rule_scope_key` format is v1;
- evidence-key v2 contract is not modified;
- visa modes/contradictions represented;
- stay duration units/bounds represented without conversion;
- passport semantic/duration rules represented;
- blank-page 1..10;
- transit mode/minutes/path bounds represented;
- official actions require official-authority source;
- temporal constants stay synchronized;
- RLS forced/no policies on new tables;
- no unrestricted fact JSONB truth blob.

Do not make tests pass from comments alone.

## 13. Docs / ADR

Update:
- `ARCHITECTURE.md`
- `DECISIONS.md` with ADR-0219 if still free after re-fetch
- `docs/OFFICIAL_TRUTH_SOURCE_EVIDENCE_ARCHITECTURE_2026-10-01.md`

Create:
- `docs/OFFICIAL_TRUTH_RULE_CLAIM_PERSISTENCE_SCHEMA_1_TASK_2026-10-01.md`
- `docs/OFFICIAL_TRUTH_RULE_CLAIM_PERSISTENCE_SCHEMA_1_REPORT_2026-10-01.md`
- `docs/OFFICIAL_TRUTH_RULE_CLAIM_PERSISTENCE_SCHEMA_1_HANDOFF_2026-10-01.md`
- `docs/OFFICIAL_TRUTH_RULE_CLAIM_PERSISTENCE_SCHEMA_1_SELF_REVIEW_2026-10-01.md`

Docs must state:
- repository schema only until TL applies to Development;
- no runtime writer yet;
- no Candidate Evidence imported;
- no CH batch imported;
- Production untouched/not authorized.

## 14. Exact allowlist

Only:
- exactly one `supabase/migrations/*_official_truth_accepted_rule_claim_persistence_schema_1.sql`
- `lib/readiness/rule-claim-store-schema.test.ts`
- `ARCHITECTURE.md`
- `DECISIONS.md`
- `docs/OFFICIAL_TRUTH_SOURCE_EVIDENCE_ARCHITECTURE_2026-10-01.md`
- the four new task/report/handoff/self-review docs named above.

Do NOT edit:
- `lib/readiness/rule-claims.ts`
- `lib/readiness/evidence.ts`
- `lib/readiness/official.ts`
- provider/engine/runtime/UI code.

If implementation truly requires changing the TypeScript contract, STOP and report instead of widening scope.

## 15. Hard non-scope

No:
- remote Supabase mutation by Cursor
- Production DB mutation
- research/Candidate import
- source seed rows
- accepted claim seed rows
- runtime writer/store adapter
- RequirementsProvider activation
- engine behavior change
- OpenAI/web/provider calls
- Sherpa/Timatic integration
- cron/queue/refresh worker
- public API/UI
- indexing/launch
- #626 work
- follow-up slice.

## 16. Validation / stop

Before handoff:
- re-fetch main; branch 0 behind
- allowlist exact
- git diff --check
- operating-mode guard
- focused schema test
- full npm test
- typecheck/lint/build
- standard hygiene
- prove no remote Supabase command/mutation
- exact-head GitHub CI/Auth + Vercel Preview
- record session URL + actual originalModelName

Stay Draft.
Do not Ready.
Do not merge.
Do not apply migration remotely.
Do not import any research.

**STOP for independent Technical-Lead exact-head review.**
