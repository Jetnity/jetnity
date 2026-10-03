# Official Truth Regulatory Applicability Runtime Foundation 1 — Report

Date: 3 October 2026
Issue: #794
Draft PR: #795
Branch: `feat/official-truth-regulatory-applicability-foundation-1`
Baseline: `main@50c1c799feb20adfafa563a3862b1cda70719cb4`
Task: `docs/OFFICIAL_TRUTH_REGULATORY_APPLICABILITY_FOUNDATION_1_TASK_2026-10-03.md`
Task seed: `cea5d57bd36b616bd45ec184d57cf71011f1e75c` is not the review head.
Logical agent: **Jetnity Official Truth regulatory applicability runtime foundation 1**
Generation: **1**
Session: https://cursor.com/agents/bc-925f9127-f08a-44ff-84b2-c2d8406633f2
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

This report is the author record. A Technical-Lead PASS requires an independent exact-head review of the branch tip. This report is not Ready and not a merge. The module is dormant. It does not accept a rule, does not store a fact, and does not start F8.

## What was implemented

`lib/readiness/regulierungs-anwendbarkeit.ts` is a pure schema-1 evaluator for the merged #793 contract.

It owns the closed vocabularies, the bounds, the empty `REGULIERUNGS_REGION_PINS` list, the context parser, expression normalization, the three-valued walker, the decision trace, the requirement-effect adapter, the visa-option adapter, and `rule-applicability:v1`. It does not compute or return a context fingerprint.

The task names are exported as specified:

- `regulierungsKontextLesen`
- `regulierungsAnwendbarkeitWirkungLesen`
- `regulierungsAnwendbarkeitVisaOptionLesen`

Additional exports, used by the tests and by the same module:

- `regulierungsAusdruckLesen` and `regulierungsAusdruckAuswerten` for the truth table and the trace
- `regulierungsWirkungAuswerten` and `regulierungsVisaOptionAuswerten`
- `regelAnwendbarkeitFingerprint`

`regulierungsAnwendbarkeitVisaOptionLesen` reads a whole `visa_options` fact, legacy or schema 1. It does not read one bare option.

Invalid input is rejected. It is not stored as `unknown`.

## Decision trace

A decided branch carries an in-process `decisionTrace`. Each dependency is `predicateKind`, `provenance`, and `polarity` only.

- `all` false keeps the first canonical false operand and stops.
- `any` true keeps the first canonical true operand and stops.
- `all` true and `any` false keep every operand.
- `not` keeps the inner dependencies. A user-asserted false atom stays `polarity: 'false'` after `not`.
- `otherwise` unions the false-establishing dependencies of every expression branch, in branch-id order.
- Any `user_asserted` dependency binds `context_asserted`.
- A non-empty trace whose dependencies are all `account_profile` or `trip_context` binds `context_recorded`.
- `binding: null` is only the unconditional fact.
- A branched decision with an empty trace returns `predicate_unknown`. It does not become an unbound rule.

The mandatory case is covered: `not_valid` and `not_held`, both `user_asserted`, make both exemptions false, `otherwise` is `required`, the binding is `context_asserted`, and the trace holds both predicate kinds with `polarity: 'false'` and no personal value.

## Fact shapes

Requirement effect:

- legacy `kind` / `effect` / `visaMode` with `required` or `not_required` is unconditional
- legacy `effect: 'conditional'` returns `legacy_conditional_without_payload` and is not upgraded
- schema-1 unconditional is exactly `kind` / `schema` / `applicability` / `effect` / `visaMode`
- schema-1 branched is exactly `kind` / `schema` / `applicability`
- top-level `effect` or `visaMode` together with branched applicability is `mixed_outcome`

Visa options:

- legacy fact is exactly `kind` / `options`; each option is exactly `visaMode` / `eligibility` / `mandate`
- schema-1 fact is exactly `kind` / `schema` / `options`; every option has `applicability`
- a branched option has no top-level eligibility or mandate
- a diplomatic-class exclusion is option `not_allowed`, not requirement `not_required`

`visaResultUndModusWidersprechen` rejects a contradictory requirement outcome as `visa_contradiction`. A non-visa fact with a non-null `visaMode` is `visa_mode_forbidden`. Invalid visa strings are rejected. They are not coerced to `unknown`.

An unconditional visa option whose eligibility is the official value `unknown` evaluates as `official_unknown`. `VisaOptionsAusgang` cannot carry that value, and the evaluator does not coerce it to `not_allowed`.

## Normalization and fingerprint

Raw trees are bounded before normalization. The normalized tree is bounded again. Depth is counted from 1 at the root. A node is one expression node.

Normalization collapses double `not`, flattens nested `all` into `all` and nested `any` into `any`, does not distribute `not`, sorts operands by canonical JSON, drops duplicate operands, and unwraps a single remaining operand. Canonical JSON uses the key order in architecture section 3.

`regelAnwendbarkeitFingerprint` returns `rule-applicability:v1:` plus the SHA-256 hex of that normalized applicability, including branch ids and support ids. The module source does not contain `reg-eval-ctx:v1`. Unconditional `effect` and `visaMode` sit outside the applicability object, so they do not change this fingerprint. A branch outcome, a predicate, or a support id does.

## Context

Country codes go through `landescodeLesen`. Citizenship codes are uppercased, deduped, and sorted. The full set is tested. Issuer country does not satisfy citizenship. A null credential link is `credential_citizenship_link`, not a copy of the issuer.

`documentType: 'passport'` does not satisfy `document_class: 'ordinary'`. `documentType` `null` or `unknown` makes `document_class` and `issuing_country` unknown and asks `document_type`.

Residence country does not satisfy lawful residence and is not used as journey origin. Explicit `not_valid`, `not_entitled`, `not_held`, and a differing origin country are false. Absence is unknown.

`REGULIERUNGS_REGION_PINS` is frozen and empty. A known origin plus `common_travel_area` is `region_membership_unpinned` and does not ask for the origin again. An absent origin asks `journey_origin`.

`user_asserted` is the only provenance accepted for age, purpose, document class, destination permission, lawful residence, nationality status, and school party. Journey origin accepts `user_asserted` or `trip_context`. `recordedContextProvenance` accepts `account_profile` or `trip_context`. `licensed_provider_confirmed` and `official_document_verified` are `provenance_not_authorized`.

Personal-identifier keys, including the existing claim denylist plus school, institution, permit, and visa number names, fail closed anywhere in the payload.

## Necessity notes

`@/types/trips` is imported because `OfficialRequirementType` is not re-exported from `lib/readiness/official.ts`. `OFFICIAL_VISA_MODES` is imported so visa-mode checks reject invalid strings. `visaModeLesen` would coerce those strings to `unknown`, which this slice must not do.

The personal-key set is copied, not imported from `rule-claims.ts`. That file stays unread by this module. A later shared denylist would be a different slice. Until then the two lists can drift.

Visa-option facts keep the live reader bounds: 1 to 4 options, unique `visaMode`, sorted by `OFFICIAL_VISA_MODES`. That is compatibility with `visaOptionenLesen`, not a new product rule.

`docs/ACTIVE_WORK_STATUS.md` is not edited. The task requires the owned module, its test, and these three delivery docs. This report and the handoff carry the continuity fields. The same choice was recorded on merged architecture #793.

A dirty `next-env.d.ts` was present at session start and was restored. It is not part of this slice.

## Boundary

No change to `rule-claims.ts`, acceptance, the store writer, the extractor registry, the same-request server, routes, UI, database, migrations, RLS, or provider selection. No non-test runtime file imports this module. `requirementsProviderAus()` is untouched. No F8. No follow-up slice is started.

Personal and legal traveller context is returned only to the in-process caller. There is no log, cache, analytics, telemetry, or `clientRef` on the context type.

## Gates

Delivery run on this working tree, 3 October 2026, before the delivery commit. Exact-head GitHub CI and Vercel belong to the pushed tip, not to this text.

- Focused `node --import ./scripts/server-only-test-register.mjs --import tsx --test lib/readiness/regulierungs-anwendbarkeit.test.ts`: 11 pass / 0 fail.
- `npm test`: 4591 pass / 0 fail.
- `npm run typecheck` (`next typegen && tsc -p tsconfig.json --noEmit`): exit 0.
- `npm run lint`: exit 0, 148 problems (0 errors, 148 warnings). Those warnings are pre-existing and outside this slice.
- `npm run build` (Next.js 16.3.8): exit 0.
- `npm run check:operating-mode`: PASS.
- `npm run check:dead`: exit 0.
- `npm run check:exports`: 0 exports without a caller.
- `npm run check:deps`: 11 dependencies, 0 unused.
- `npm run check:api-schutz`: 12 admin routes, all use `requireAdminApi()`.
- `npm run check:schema-bezug`: exit 0. Unchanged LOCAL/UNAPPLIED RPCs: `admin_account_counts_v1`, `darf_official_truth_freigeben`, `official_truth_source_catalog_v1`, `official_truth_store_accepted_v1`. This slice added none.
- `git diff --check`: exit 0.

No remote database was contacted. Nothing was applied. The agent VM has local PostgreSQL 16 binaries so existing throwaway `initdb` proofs in the full suite can run. `policy-rc.d` denied starting the system cluster. No SQL from this slice was applied.

## Security, database, cost

No new route, no service role, no secret, no persistence, no production migration. Personal keys and unauthorized provenances fail closed. No new running cost. No provider and no paid call.

## Risks

The Common Travel Area pin is empty on purpose. While it is empty, an unknown CTA exemption blocks `otherwise`. Guessing members would invent a legal set.

Branched facts are not persistable. This slice does not call the writer and does not add a migration.

The duplicated personal-key list can drift from `rule-claims.ts`.

`official_unknown` is an evaluator status for an official visa eligibility of `unknown`. It is not a new requirement effect.

## Next step

Independent Technical-Lead review of the exact branch tip. Cursor does not Ready or merge and does not start a follow-up slice.
