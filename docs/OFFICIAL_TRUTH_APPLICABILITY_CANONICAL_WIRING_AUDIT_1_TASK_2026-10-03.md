# Official Truth Applicability Canonical Wiring Audit 1 — Task

Date: 3 October 2026
Issue: #796
Branch: `docs/official-truth-applicability-canonical-wiring-audit-1`
Baseline: `main@ac36175d4c64aaab6be7c83f2731a83473feba85`
Logical agent: **Jetnity Official Truth applicability canonical wiring audit 1**
Generation: **1**
Required model: **Grok 4.7 High Fast** (`grok-4.7-high-fast`), not Auto

## 1. Purpose

Design the smallest safe integration order for the merged pure regulatory applicability foundation (#795) into Jetnity's existing canonical Official Truth path.

This is a **docs-only architecture / call-graph audit**.

Do not edit runtime.
Do not edit SQL.
Do not apply DB changes.
Do not register a real extractor.
Do not start F8.

The core safety problem:

- `regulierungs-anwendbarkeit.ts` can now parse schema-1 applicability facts;
- `rule-claims.ts` still accepts only today's flat facts;
- the current accepted-claim store serializes only the flat typed fact columns;
- if canonical Rule parsing is widened before persistence is guarded, a branched fact could lose its conditions when the store serializes it.

No wiring may begin until this audit fixes the exact order.

## 2. Binding reads

Read live main first, then at minimum:

1. `docs/OFFICIAL_TRUTH_REGULATORY_ELIGIBILITY_PREDICATE_ARCHITECTURE_1_2026-10-03.md`
2. `docs/OFFICIAL_TRUTH_REGULATORY_APPLICABILITY_FOUNDATION_1_REPORT_2026-10-03.md`
3. `lib/readiness/regulierungs-anwendbarkeit.ts`
4. `lib/readiness/rule-claims.ts`
5. `lib/readiness/official-truth-trusted-fact-extractor-registry.ts`
6. `lib/readiness/official-truth-same-request-extraction-server.ts`
7. `lib/readiness/official-truth-store-server.ts`
8. `lib/readiness/official-truth-fact-entry-server.ts` if present
9. every non-test caller/importer of:
   - `regelKandidatAkzeptieren`
   - `regelFaktKanonischLesen`
   - `akzeptierteRegelClaimSpeichern`
10. accepted-Rule persistence migration(s) and `official_truth_store_accepted_v1` RPC SQL
11. current tests for Rule acceptance, extractor registry, same-request extraction and store.

Live code wins.

## 3. Canonical parser invariant

Jetnity must continue to have exactly one canonical Rule-fact semantic parser.

The audit must decide the safe way to reuse the new applicability readers without creating:

- one parser for extractor output and another for acceptance;
- a schema-1 fact accepted by `regelFaktKanonischLesen` but rejected or interpreted differently by `regelKandidatAkzeptieren`;
- a flat acceptance path that silently drops applicability.

Strong preference:
`regelFaktLesen` remains the one internal semantic parser, and both
`regelFaktKanonischLesen` and `regelKandidatAkzeptieren`
continue to depend on that same parser.

If a different design is chosen, prove it does not create a second Rule-fact truth path.

## 4. Type integration

Audit exact current types:

- `RegelFakt`;
- `RegelAnforderungswirkung`;
- `RegelVisaOptionen`;
- `FaktErgebnis`;
- `RegelClaimFehler`;
- `AkzeptierteRegelClaim`;
- extractor success material types;
- same-request trusted-fact material types;
- store payload types.

Specify the exact minimal TypeScript changes needed later.

The audit must decide whether `RegelFakt` should directly use/import the already-defined applicability fact unions from `regulierungs-anwendbarkeit.ts`, or whether a smaller shared domain type extraction is needed first.

Avoid circular imports.

No duplicated schema-1 interfaces in two runtime modules.

## 5. Legacy compatibility

Must preserve all existing accepted facts.

Document exact compatibility:

- legacy requirement-effect `required/not_required` remains valid;
- legacy flat `conditional` must fail closed and must not be silently upgraded;
- legacy visa options remain valid;
- every other existing fact kind stays byte/semantic compatible;
- no existing accepted Rule Claim should change its meaning or key merely because the parser can read schema 1;
- `factKind` values remain unchanged.

No migration just to keep legacy facts working.

## 6. Store loss-prevention gate — mandatory

Inspect `official-truth-store-server.ts` and its SQL payload.

Current known behavior:
- `faktSpalten()` serializes flat requirement effect as `effect` + `visa_mode`;
- visa options serialize flat `eligibility` + `mandate`;
- current SQL schema has no applicability branch tables.

The audit must define an **explicit fail-closed store guard** before any canonical parser widening can merge.

At minimum determine:

1. how a schema-1 branched `requirement_effect` is identified after canonical acceptance;
2. how a schema-1 branched visa option is identified;
3. exact store error code, proposed:
   `applicability_not_persistable`;
4. guard location;
5. proof that the RPC is not called for a non-persistable claim;
6. proof that `faktSpalten()` never sees a branched fact that it cannot represent;
7. whether schema-1 **unconditional** facts may safely persist through the current flat schema or should also fail closed until an applicability-aware schema exists.

Prefer the safer answer if exact identity/provenance would otherwise be lost.

No migration in this audit.

## 7. Persistence identity question

The audit must explicitly answer:

If a schema-1 unconditional fact has
`applicability: { schema:1, kind:'unconditional' }`
but the current DB stores only its flat outcome, is that acceptable canonical persistence or silent schema loss?

Evaluate:
- semantic equivalence;
- exact accepted-fact identity;
- future round-trip/reconstruction;
- `rule-applicability:v1` metadata;
- idempotency behavior;
- future branch migration.

Conclude one of:
- schema-1 unconditional is safe to flatten now;
- or all schema-1 facts are non-persistable until an applicability-aware schema exists.

Do not leave this ambiguous.

## 8. Extractor interaction

Current deterministic extractor framework calls `regelFaktKanonischLesen`.

The audit must show what happens after canonical parser integration:

- legacy extracted facts still parse;
- schema-1 applicability facts can be structurally parsed only if the source-specific extractor emits them;
- production extractor registry remains EMPTY in the wiring slice;
- no caller chooses applicability;
- the extractor framework does not evaluate traveller predicates;
- it extracts global regulatory truth only;
- traveller context remains separate from Official Truth.

No source-specific extractor in the wiring slice.

## 9. Same-request material

Audit `official-truth-same-request-extraction-server.ts`.

Decide whether its types/material can carry the widened `RegelFakt` union without further authority changes.

Requirements:
- same-request proof/retrieval invariants unchanged;
- no traveller-specific exception answers are added to Official Truth material;
- decoded static regulatory scope remains separate from dynamic `RegulierungsKontext`;
- no context hash;
- no persistence.

## 10. Human/manual acceptance path

Audit all existing callers of `regelKandidatAkzeptieren` and any fact-entry server.

The schema-1 parser extension must not accidentally turn:
- model output;
- proposal;
- review suggestion;
- caller JSON;
into new authority.

Document which current path may supply `trustedRuleFact` and why its authority gate remains unchanged.

No new endpoint.

## 11. Pure module use

The new `regulierungs-anwendbarkeit.ts` currently has no non-test importer.

The audit must decide the first safe importer.

Candidate:
- `rule-claims.ts` for fact-shape parsing only.

Do not wire evaluation of traveller context into `rule-claims.ts`.
Acceptance stores global rule semantics; it does not decide a traveller's result.

The audit should keep:
- fact parsing;
- global rule acceptance;
- traveller evaluation;
as separate stages.

## 12. Error vocabulary

Propose exact additions to `RegelClaimFehler` if required:

- `legacy_conditional_without_payload`
- `mixed_outcome`
- `applicability_not_persistable`

Decide which layer owns each error:
- fact parser;
- acceptance;
- store writer.

Do not overload `invalid_fact` if the specific failure matters to trust/debugging.

## 13. Canonical fingerprints

`rule-applicability:v1` is non-personal metadata.

The audit must decide:
- whether it belongs on `AkzeptierteRegelClaim` in memory now;
- whether it must wait for persistence schema;
- whether F8/provenance later needs it;
- whether the first wiring slice should compute/retain it.

Do not add `reg-eval-ctx:v1`.

If adding the rule fingerprint to accepted material would create a persistence mismatch, keep it out until a separate schema gate.

## 14. Test matrix for later wiring slice

Specify mandatory tests for the first runtime wiring slice.

At minimum:

1. all legacy Rule-fact tests remain green;
2. legacy `conditional` fails closed;
3. schema-1 unconditional requirement effect parses;
4. schema-1 branched requirement effect parses;
5. mixed top-level + branched outcome fails;
6. schema-1 unconditional visa option parses;
7. schema-1 branched visa option parses;
8. canonical wrapper and `regelKandidatAkzeptieren` return identical semantic fact shape for the same trusted input;
9. no second parser path;
10. extractor framework accepts a synthetic schema-1 fact through the canonical parser test seam;
11. production extractor registry stays empty;
12. same-request material can retain the widened fact without traveller context;
13. current store rejects every non-persistable applicability shape before RPC;
14. store payload for legacy facts stays byte-equivalent;
15. no existing flat accepted claim changes persistence shape;
16. no route/UI/provider/model call added;
17. no DB/migration;
18. no F8.

## 15. Safe implementation order

The audit must output an exact sequence.

Example shape to verify or correct:

A. store loss-prevention guard
B. canonical Rule-fact type/parser integration
C. canonical wrapper/acceptance compatibility
D. extractor/same-request type compatibility
E. tests proving no persistence loss
F. STOP — still no real extractor / no F8

If these must be one atomic PR to avoid an unsafe intermediate main state, say so.

## 16. Required output

Create exactly:

- `docs/OFFICIAL_TRUTH_APPLICABILITY_CANONICAL_WIRING_AUDIT_1_2026-10-03.md`
- `docs/OFFICIAL_TRUTH_APPLICABILITY_CANONICAL_WIRING_AUDIT_1_REPORT_2026-10-03.md`
- `docs/OFFICIAL_TRUTH_APPLICABILITY_CANONICAL_WIRING_AUDIT_1_SELF_REVIEW_2026-10-03.md`

Conclude with exactly one classification:

- `CANONICAL_WIRING_READY_FOR_RUNTIME_SLICE`
- `WIRING_ARCHITECTURE_GAP_REMAINS`

If ready, state:
- exact files the runtime slice may edit;
- whether one atomic PR is required;
- exact error additions;
- exact persistence guard;
- exact type import direction;
- exact non-goals.

## 17. Forbidden

No edits to:
- `lib/**`
- `app/**`
- `components/**`
- `types/**`
- `supabase/**`

No:
- runtime wiring;
- DB/migration/apply;
- extractor registration;
- source-specific parser;
- UI/route;
- provider/model/plugin;
- CH import;
- F8;
- Production change.

## 18. Validation / STOP

Before STOP:
- verify current live call graph, not stale docs;
- `git diff --check`;
- operating-mode guard;
- fetch current main and finish 0 behind;
- keep Draft;
- report exact head/files + session id + `originalModelName`;
- STOP.

No Ready. No merge. No runtime follow-up.