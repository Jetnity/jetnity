# Official Truth Applicability Canonical Wiring Audit 1

Date: 3 October 2026
Issue: #796
Draft PR: #797
Branch: `docs/official-truth-applicability-canonical-wiring-audit-1`
Baseline: `main@ac36175d4c64aaab6be7c83f2731a83473feba85`
Task: `docs/OFFICIAL_TRUTH_APPLICABILITY_CANONICAL_WIRING_AUDIT_1_TASK_2026-10-03.md`
Logical agent: **Jetnity Official Truth applicability canonical wiring audit 1**
Generation: **1**
Required model: **Grok 4.7 High Fast** (`grok-4.7-high-fast`), not Auto

This audit reads live code on that baseline. It does not wire the parser, does not change SQL, and does not start a runtime slice.

Classification:

`CANONICAL_WIRING_READY_FOR_RUNTIME_SLICE`

Persistence decision, binding for that later slice:

**All schema-1 facts are non-persistable until an applicability-aware schema exists.**

Schema-1 unconditional facts must not be flattened into today's effect or visa-option columns. The identity proof is in section 6.

## 1. Live call graph

Read on `ac36175d4c64aaab6be7c83f2731a83473feba85`. No non-test file imports `regulierungs-anwendbarkeit.ts`. The lock is `lib/readiness/regulierungs-anwendbarkeit.test.ts` lines 883–905: a repository walk of `ts` / `tsx` / `js` / `mjs` / `cjs` must find the module name only in that file and its test.

```text
regulierungs-anwendbarkeit.ts          pure schema-1 readers and evaluator
        no production importer

rule-claims.ts
  regelFaktLesen                         private, lines 741–758
    wirkungLesen                         flat kind/effect/visaMode only, lines 441–460
    visaOptionenLesen                    flat kind/options only, lines 462–484
    stay / passport / pages / transit / actions / temporal
  regelFaktKanonischLesen                lines 765–771, returns regelFaktLesen
  regelKandidatErstellen                 lines 786–832, parses proposal shape only
  regelKandidatAkzeptieren               lines 843–902
    rebuilds the candidate, then
    regelFaktLesen(..., trustedRuleFact) at line 890
    does not read proposal

official-truth-trusted-fact-extractor-registry.ts
  OFFICIAL_TRUTH_TRUSTED_FACT_EXTRACTOR_REGISTRY = Object.freeze([])  lines 333–334
  officialTruthTrustedFactExtrahieren            lines 857–861, empty registry only
  officialTruthTrustedFactExtrahierenMitDefinitionen  lines 867–885, test seam
  ausfuehren -> definition.extract -> regelFaktKanonischLesen  line 833
  does not call regelKandidatAkzeptieren

official-truth-same-request-extraction-server.ts
  decideOfficialTruthSameRequestTrustedFactExtraction  line 440
    proof, then retrieval, then officialTruthTrustedFactExtrahieren
    material.trustedRuleFact = erfolg.fact  line 424
  does not call acceptance, the store, or the applicability module

official-truth-store-server.ts
  akzeptierteRegelClaimSpeichern  lines 341–358
    regelKandidatAkzeptieren
    transport.aufrufen(claimPayload)  line 352
      faktSpalten  lines 101–179
      rpc literal 'official_truth_store_accepted_v1'  line 243

official-truth-fact-entry-authority-server.ts
  loadOfficialTruthFactEntryAuthority
  returns a role grant or a denial
  does not parse a fact, accept a claim, or call the store
```

`akzeptierteRegelClaimSpeichern` is the only production caller of `regelKandidatAkzeptieren`. Its other references are tests. No `app/` or `components/` file calls the store writer, the acceptance function, or the extractor. `requirementsProviderAus()` is not selected by these modules.

The SQL the writer targets is `supabase/migrations/20261001180549_official_truth_trusted_store_writer_1.sql`. The table shape is `supabase/migrations/20261001151048_official_truth_accepted_rule_claim_persistence_schema_1.sql`. This audit did not query a database and did not apply either file.

## 2. One canonical Rule-fact parser

`regelFaktLesen` stays the only internal semantic parser.

The later wiring slice makes the two applicability readers the implementation of two arms inside that function:

- `requirement_effect` calls `regulierungsAnwendbarkeitWirkungLesen`;
- `visa_options` keeps the existing `requirementType !== 'visa'` gate in `rule-claims.ts`, then calls `regulierungsAnwendbarkeitVisaOptionLesen`.

The other six fact kinds stay on the readers already inside `regelFaktLesen`. They do not grow a schema or an applicability field.

`regelFaktKanonischLesen` continues to return `regelFaktLesen` and nothing else. `regelKandidatErstellen` and `regelKandidatAkzeptieren` continue to call `regelFaktLesen`. There is no extractor-only parser and no second acceptance function.

The wiring slice must not call these from `rule-claims.ts`:

- `regulierungsKontextLesen`
- `regulierungsWirkungAuswerten`
- `regulierungsVisaOptionAuswerten`
- `regulierungsAusdruckAuswerten`
- `regelAnwendbarkeitFingerprint`

Acceptance stores a global rule fact. It does not evaluate a traveller.

`legacy_conditional_without_payload` carries an in-module `auswertung` on `WirkungsLesergebnis`. `regelFaktLesen` drops that object and returns only the reason. The evaluation object is not a claim field.

## 3. Type integration

Import direction is one way:

`rule-claims.ts` imports from `regulierungs-anwendbarkeit.ts`.

`regulierungs-anwendbarkeit.ts` does not import `rule-claims.ts`. Its current imports are `domain`, `digest`, `official`, and `@/types/trips` (test lines 887–893). None of those import `rule-claims.ts`. Adding the one-way import does not create a cycle.

Use the existing unions. Do not copy them.

| Current `rule-claims.ts` type | Later meaning |
| --- | --- |
| `RegelAnforderungswirkung` | alias of `AnforderungswirkungFakt` |
| `RegelVisaOptionen` | alias of `VisaOptionenFakt` |
| `RegelVisaOption` | remains the legacy three-key option; schema-1 options stay the applicability types |
| `RegelFakt` | same eight `kind` arms; the first two arms are the unions above |
| `FaktErgebnis` | unchanged shape; new reasons come from `RegelClaimFehler` |
| `AkzeptierteRegelClaim` | unchanged fields; `fact` is the widened `RegelFakt`; no fingerprint field |
| `RegelKandidat.proposal` | widened `RegelFakt \| null`; still not the accepted fact |
| `OfficialTruthTrustedFactExtractorErfolg.fact` | already `RegelFakt`; widens with the union |
| `OfficialTruthSameRequestExtractionErgebnis` success `trustedRuleFact` | already `RegelFakt`; widens with the union |
| store `faktSpalten` argument | narrow type that excludes every schema-1 fact |

`RegelFaktArt` and `REGEL_FAKT_ARTEN` stay the eight current strings. `factKind` values do not change.

`RegelAnforderungswirkung` and `RegelVisaOption` are constructed only inside `rule-claims.ts`. Widening them does not force edits across the other Official Truth modules. `faktSpalten` is the production site that reads `fact.effect` and `option.eligibility` without a narrowing (`official-truth-store-server.ts` lines 102–112). That site must narrow before it reads those fields.

The applicability module is not edited. Both readers are already exported.

The importer lock must be updated in the same slice. `regulierungs-anwendbarkeit.test.ts` lines 900–905 currently require zero foreign importers. After wiring, the only additional allowed file is `lib/readiness/rule-claims.ts`. The store, the extractor, the same-request server, and fact-entry must still fail that test if they import the applicability module.

## 4. Legacy compatibility

Successful legacy objects keep their keys and their meaning.

| Input | Later parser result |
| --- | --- |
| `requirement_effect` with exactly `kind`, `effect`, `visaMode`, and `effect` `required` or `not_required` | same three-key object as today; visa contradiction and `visa_mode_forbidden` stay |
| `requirement_effect` with `effect: 'conditional'` | `legacy_conditional_without_payload`; not rewritten into branches; not given `schema: 1` |
| `visa_options` with exactly `kind` and `options`; each option exactly `visaMode`, `eligibility`, `mandate` | same fact, including eligibility `unknown`; 1–4 options; unique modes; sorted by `OFFICIAL_VISA_MODES` |
| `stay_limit`, `passport_validity`, `blank_passport_pages`, `transit_conditions`, `official_actions`, `temporal_rule` | current readers, current key sets |

`regelScopeAusEvidenceScope` hashes the scope only (`rule-claims.ts` lines 350–378). The claim key is `rule-scope:v1:` plus that hash. It does not include the fact. Parser widening does not change an existing claim key.

`conditional` is a successful effect today (`WIRKUNGEN` at `rule-claims.ts` line 94, and `wirkungLesen` lines 443–459). One store proof writes it and expects success: `official-truth-store-server.test.ts` lines 1799–1809. The wiring slice changes that proof to a parser rejection before RPC. That is the required fail-closed change, not a silent upgrade. The SQL check still allows the word `conditional` (`official_rule_claim_requirement_effect_effect` in the schema migration). This audit does not migrate those rows and does not edit that check. No new conditional claim is inserted, because acceptance fails before `faktSpalten`.

`lib/readiness/official.ts` result `conditional` is a different vocabulary. The wiring slice does not edit the requirements engine.

A legacy success object has no `schema` and no `applicability`. `anfang()` in the applicability reader also rejects a forbidden provenance string anywhere in the payload before the key check. Flat legacy successes do not contain that string. An already-invalid object that embeds `licensed_provider_confirmed` can change from `invalid_fact` to `provenance_not_authorized`. That object was never an accepted fact.

## 5. Store loss-prevention guard

### How a branched fact is identified after acceptance

Requirement effect, after `regulierungsAnwendbarkeitWirkungLesen` succeeds:

- schema-1 branched: `kind === 'requirement_effect'`, `schema === 1`, `applicability.kind === 'branches'`, and no top-level `effect` or `visaMode`;
- schema-1 unconditional: `schema === 1`, `applicability` exactly `{ schema: 1, kind: 'unconditional' }`, plus top-level `effect` and `visaMode`.

Visa options, after `regulierungsAnwendbarkeitVisaOptionLesen` succeeds:

- schema-1 fact: `kind === 'visa_options'` and `schema === 1`;
- a branched option: `applicability.kind === 'branches'` and no top-level `eligibility` or `mandate`;
- an unconditional schema-1 option: `applicability.kind === 'unconditional'` plus `eligibility` and `mandate`.

The parent `schema` discriminates the whole visa fact. A schema-1 fact cannot mix in a legacy option. The reader already enforces that.

### Guard

Location: `akzeptierteRegelClaimSpeichern`, immediately after `regelKandidatAkzeptieren` returns `ok: true`, and before `transportAus`, before `claimPayload`, before `faktSpalten`, and before the `try` that calls `transport.aufrufen`.

The predicate is private to the store module. A fact is non-persistable when any of these is true:

1. `requirement_effect` has `schema` or `applicability`, or lacks `effect`;
2. `visa_options` has `schema`, or any option has `applicability`.

Every other current fact kind is persistable. It has no schema-1 arm.

On a non-persistable fact the function returns `{ ok: false, reason: 'applicability_not_persistable' }`.

`faktSpalten` takes only the narrowed persistable type. A `RegelFakt` that still includes schema-1 does not type-check as its argument. `claimPayload` is called only with that narrowed fact. The existing source lock expects exactly two `transport.aufrufen(` occurrences in the file (`official-truth-store-server.test.ts` line 429) and exactly one `regelKandidatAkzeptieren(` (line 412). The guard must not add a call to either.

### No-RPC proof

1. The return sits textually before `transport.aufrufen` inside `akzeptierteRegelClaimSpeichern`.
2. A test supplies a transport whose `aufrufen` records a call. For each non-persistable shape the result reason is `applicability_not_persistable` and the call count stays 0.
3. The `try/catch` around `transport.aufrufen` maps thrown errors to `store_failed` (`official-truth-store-server.ts` lines 350–354). The applicability return must stay outside that `try`. A throw inside `faktSpalten` would hide the reason and is not the guard.
4. The RPC body still builds `incoming_fact` from `effect` and `visa_mode` only (writer migration lines 329–332) and from `ordinal`, `visa_mode`, `eligibility`, and `mandate` for options (lines 339–355). It has no applicability column to read. The TypeScript guard is what keeps a branched fact out of that body. This slice does not change the SQL.

`transportAus` can construct a service-role client. The guard returns before that call, so a non-persistable claim does not open a client and does not depend on store configuration. `store_not_configured` must not mask `applicability_not_persistable`.

## 6. Persistence identity

Question: if a schema-1 unconditional fact has `applicability: { schema: 1, kind: 'unconditional' }` and the database stores only the flat outcome, is that canonical persistence or silent schema loss?

**It is silent schema loss. All schema-1 facts are non-persistable until an applicability-aware schema exists.**

This is stricter than architecture section 13, which names the writer rejection for a branched fact and does not prove the unconditional case. The task assigns that proof to this audit. The later wiring slice follows this decision.

### Semantic equivalence of the outcome

For a requirement effect, `regulierungsWirkungAuswerten` treats both a legacy `required` / `not_required` object and a schema-1 unconditional object as unconditional (`'effect' in fakt`, `regulierungs-anwendbarkeit.ts` lines 1765–1770). A visa option with `eligibility` is likewise unconditional (lines 1773–1782). The traveller-facing outcome can match. The stored identity does not.

### Exact accepted-fact identity

The in-memory schema-1 object has `schema` and `applicability`. The legacy object does not. `JSON.stringify` of `claim.fact` differs.

`regelAnwendbarkeitFingerprint` hashes the applicability object only (`regulierungs-anwendbarkeit.ts` lines 638–641 and 1787–1790). Unconditional `effect` and `visaMode` sit outside that object, so every unconditional applicability value shares one fingerprint, and a legacy fact has none. Flattening deletes the only marker that the accepted object was schema 1.

The claim key does not repair this. It is the scope hash, not a fact hash.

### Round-trip

There is no reader that rebuilds `RegelFakt` from the effect or visa-option tables. `faktSpalten` emits flat columns. The RPC compares and stores those columns (writer migration lines 462–470 and 666–674). A later reconstruction from those columns can only build the legacy three-key effect or the legacy option. It cannot restore `schema: 1`.

### Idempotency

`official_rule_claims_one_accepted_fact` is unique on `(rule_scope_key, fact_kind)` (schema migration line 74). The RPC treats an existing row as idempotent only when the rebuilt flat `stored_fact` matches `incoming_fact` (writer migration lines 584–616). A schema-1 unconditional fact flattened to the same `effect` and `visa_mode` matches a legacy row and returns `idempotent`. The schema marker is discarded. A different flat outcome raises `23505` rather than storing a second representation. The two in-memory facts collapse into one row.

### Future migration

A later applicability column can backfill today's rows as legacy only if no schema-1 fact was ever written through the flat columns. Flattening unconditional schema-1 facts makes that backfill ambiguous. Refusing every schema-1 write keeps the existing rows, including any historical `conditional` effect, unambiguously pre-schema-1.

### What the current columns would drop

| Shape | If `faktSpalten` ran |
| --- | --- |
| Schema-1 branched requirement effect | no top-level `effect`; the branch tree is absent from the payload |
| Schema-1 unconditional requirement effect | `effect` and `visa_mode` survive; `schema` and `applicability` do not |
| Schema-1 visa fact with any branched option | that option has no `eligibility` or `mandate` |
| Schema-1 visa fact whose options are all unconditional | eligibility and mandate survive; parent `schema` and each option's `applicability` do not |

The guard rejects all four before `faktSpalten`.

## 7. Extractor

After the parser change, `regelFaktKanonischLesen` accepts a legacy fact and a schema-1 fact with the same function. A schema-1 fact is parsed only when a code-owned `extract()` returns that object. The caller input is still rejected when it carries `proposal`, `suggestion`, `model`, `trustedRuleFact`, or the other keys in `VERBOTEN` (`official-truth-trusted-fact-extractor-registry.ts` lines 142–167 and 723). Those checks walk the caller input, not the extracted fact. The wiring slice must not remove them.

`OFFICIAL_TRUTH_TRUSTED_FACT_EXTRACTOR_REGISTRY` stays `Object.freeze([])`. `officialTruthTrustedFactExtrahieren` keeps using that constant. The production function does not gain a source family. The mandatory schema-1 extractor proof uses `officialTruthTrustedFactExtrahierenMitDefinitionen` only.

The framework does not import the applicability evaluator and does not read `RegulierungsKontext`. `herkunftFuer` lists `Object.keys(fact)` when no composition policy is present (lines 684–695). For a schema-1 fact those keys include `schema` and `applicability`. That is provenance of the fact fields, not a second parse. Legacy facts keep their current keys, so their provenance stays the same. The wiring slice does not edit this function unless a type error forces a narrowing that preserves every fact key.

The extractor still does not call `regelKandidatAkzeptieren` or either store writer.

## 8. Same-request material

`OfficialTruthSameRequestExtractionErgebnis` already stores `trustedRuleFact: RegelFakt` (line 122). The widened union fits that field. No new authority field is required.

The success object has registry, evidence versions, candidate, scope key, fact kind, explicit-primary quality, support ids, server time, freshness, role grant, the fact, extractor identity, provenance, and retrieval hashes. It has no `RegulierungsKontext`, no context hash, and no `reg-eval-ctx:v1`. The decoded scope is the static `RegelScope` from `regelScopeAusEvidenceScope`. The wiring slice must not import the applicability module into this file and must not persist the material.

The live function calls `officialTruthTrustedFactExtrahieren`, not the test seam. With an empty production registry, a production same-request run still cannot emit a schema-1 fact. The retention test injects `extract` through `OfficialTruthSameRequestExtractionAbhaengigkeiten`.

The field name `trustedRuleFact` on this material is not a call to `regelKandidatAkzeptieren`. The same-request file does not contain that call. The wiring slice must keep it that way.

## 9. Authority

`trustedRuleFact` is an argument of `regelKandidatAkzeptieren`. The function trusts that argument and parses it with `regelFaktLesen`. It does not read `kandidat.proposal` (the body after line 843 does not use `proposal`; the existing test locks a conflicting proposal out of the claim).

Current suppliers:

| Path | Supplies `trustedRuleFact`? | Why the gate stays |
| --- | --- | --- |
| `akzeptierteRegelClaimSpeichern` | Passes its `eingabe` through to acceptance | Still the only production caller. Schema-1 acceptance in memory is then refused by the store guard. No new endpoint. |
| Fact-entry authority | No | Returns grant or denial only. |
| Extractor framework | No | Returns a parsed fact. Does not accept it. |
| Same-request material | Holds the extracted fact on an internal object | Does not call acceptance or the store. |
| Review packet, suggestion, decision intent, fingerprint | No | Existing tests forbid the acceptance call and the `trustedRuleFact` field. |

Schema-1 parsing does not make model output, a proposal, a review suggestion, or caller JSON into a new authority. A caller who can already pass an object as `trustedRuleFact` can pass a schema-1 object into the dormant writer. Acceptance may then succeed in memory, and the store returns `applicability_not_persistable`. That is the same trust boundary as today, plus the loss-prevention return. The wiring slice must not compare the proposal with the trusted fact and must not treat agreement as proof.

Passing the proposal object itself as `trustedRuleFact` remains possible, because the function trusts its argument. Closing that hole is not this wiring slice. The slice must not widen it.

## 10. Stages

First production importer: `rule-claims.ts`, for fact-shape parsing only.

Three stages stay separate:

1. Fact parsing, inside `regelFaktLesen`, using the two readers.
2. Global rule acceptance, inside `regelKandidatAkzeptieren`, with no traveller context.
3. Traveller evaluation, inside `regulierungsWirkungAuswerten` and `regulierungsVisaOptionAuswerten`, called only by a later evaluation slice.

The store is a fourth stage. It may persist a legacy fact. It refuses every schema-1 fact. It does not evaluate branches.

## 11. Errors

Add these to `RegelClaimFehler`. The fact parser owns them. Acceptance returns them unchanged. The store passes them through when acceptance fails, and does not call the RPC.

| Code | Owner | When |
| --- | --- | --- |
| `legacy_conditional_without_payload` | fact parser | flat `effect: 'conditional'` |
| `mixed_outcome` | fact parser | top-level outcome together with branched applicability |
| `provenance_not_authorized` | fact parser, passthrough | the applicability reader already returns this from `anfang()` |
| `depth_exceeded` | fact parser, passthrough | branch expression |
| `node_bound_exceeded` | fact parser, passthrough | branch expression |
| `operand_bound_exceeded` | fact parser, passthrough | branch expression |
| `branch_bound_exceeded` | fact parser, passthrough | branch list |

`invalid_fact`, `invalid_fact_kind`, `visa_contradiction`, `visa_mode_forbidden`, `invalid_support`, and `support_bound_exceeded` stay as they are and are passed through when the reader returns them.

`applicability_not_persistable` is not a `RegelClaimFehler`. Acceptance of a schema-1 fact is valid in memory. Only `akzeptierteRegelClaimSpeichern` returns that string, and only from the guard in section 5. Do not overload `invalid_fact` or `store_failed` for this case.

`context_conflict` stays on the context reader. Fact parsing does not call `regulierungsKontextLesen`, so acceptance does not return it.

## 12. Fingerprints

`rule-applicability:v1` is non-personal metadata. It is not placed on `AkzeptierteRegelClaim` in the wiring slice.

The current store cannot persist it. Putting it on the in-memory claim would make the accepted object and the stored row disagree. Section 6 shows that the unconditional fingerprint also does not identify the outcome, because `effect` and `visaMode` are outside the hashed applicability object.

F8, or a later provenance slice, may retain the fingerprint only after an applicability-aware schema can store it with the fact. The wiring slice does not compute it and does not import `regelAnwendbarkeitFingerprint`.

`reg-eval-ctx:v1` is not added. The applicability module source does not contain that string, and the wiring slice must not introduce it.

## 13. Tests the wiring slice must add or keep

1. Existing legacy successes for `required`, `not_required`, visa options, and the other six fact kinds stay green, including claim keys.
2. Legacy `conditional` returns `legacy_conditional_without_payload` from both `regelFaktKanonischLesen` and `regelKandidatAkzeptieren`. The store test at lines 1799–1809 expects that reason and zero `aufrufen` calls.
3. Schema-1 unconditional requirement effect parses to the five-key object.
4. Schema-1 branched requirement effect parses, with outcomes only on branches.
5. Top-level outcome plus branched applicability returns `mixed_outcome`.
6. Schema-1 unconditional visa options parse, including eligibility `unknown` as a fact value, not as an evaluation.
7. Schema-1 branched visa options parse.
8. For one shared trusted input, `regelFaktKanonischLesen(...).fact` and `regelKandidatAkzeptieren(...).claim.fact` are deep-equal. The wrapper body still only returns `regelFaktLesen`.
9. `rule-claims.ts` does not contain `regulierungsWirkungAuswerten`, `regulierungsVisaOptionAuswerten`, `regulierungsKontextLesen`, or `regelAnwendbarkeitFingerprint`.
10. A synthetic definition through `officialTruthTrustedFactExtrahierenMitDefinitionen` can return a schema-1 fact. The production registry constant is still an empty frozen array. `officialTruthTrustedFactExtrahieren` does not receive a definition argument.
11. The importer lock allows `rule-claims.ts` and no other new file.
12. A same-request test seam can place the widened fact on `trustedRuleFact` with no context object and no context hash. The live function still calls the empty-registry entry.
13. The store returns `applicability_not_persistable` for all four schema-1 shapes in section 6, with zero RPC calls, before `transportAus`.
14. A legacy requirement-effect payload is exactly `{ effect, visa_mode }` and a legacy visa payload is exactly ordinal, `visa_mode`, `eligibility`, and `mandate`. No `schema`, `applicability`, or fingerprint key is present.
15. The other flat fact payloads and the schema-migration assertions stay unchanged. `rule-claim-store-schema.test.ts` still sees `conditional` in the SQL check, because this slice does not edit SQL.
16. No new route, UI, provider, or model call. `app/` still does not mention the store module.
17. No new migration file. `check:schema-bezug` still lists the same LOCAL/UNAPPLIED RPCs and does not gain one.
18. No F8 module, no source extractor, and no CH import.

## 14. Atomic implementation order

One pull request. One head. Do not merge the parser widening without the store guard on that same head.

Inside that pull request:

1. Add the `RegelClaimFehler` members from section 11 and the store guard from section 5, including the narrowed `faktSpalten` argument. At this moment schema-1 input still fails as `invalid_fact` inside the old flat readers, so the guard is not yet reachable through acceptance. That intermediate edit is safe because nothing new is persisted.
2. Point `wirkungLesen` and `visaOptionenLesen` at the two existing readers. Keep the visa `requirement_type_mismatch` gate in `rule-claims.ts`. Alias the two fact types. Do not edit `regulierungs-anwendbarkeit.ts`.
3. Update the importer lock so only `rule-claims.ts` is the new importer.
4. Add the parser, wrapper, extractor-seam, same-request, and store tests in section 13.
5. Stop. The production registry is empty. No F8. No migration.

Steps 1 and 2 may be separate commits on that branch only if step 1 is first. They must not be separate pull requests. A head that accepts schema-1 and still calls `faktSpalten` on the un-narrowed `RegelFakt` is not mergeable.

The guard-before-parser commit is safe and not useful alone. The review head is the tip that contains both.

## 15. Files the runtime slice may edit

Must edit:

- `lib/readiness/rule-claims.ts`
- `lib/readiness/rule-claims.test.ts`
- `lib/readiness/official-truth-store-server.ts`
- `lib/readiness/official-truth-store-server.test.ts`
- `lib/readiness/regulierungs-anwendbarkeit.test.ts` for the importer allowlist only

May edit only to add the section 13 tests:

- `lib/readiness/official-truth-trusted-fact-extractor-registry.test.ts`
- `lib/readiness/official-truth-same-request-extraction-server.test.ts`

Must not edit, unless a type error in the widened `RegelFakt` forces a narrowing that preserves every fact key and does not call the evaluator:

- `lib/readiness/official-truth-trusted-fact-extractor-registry.ts`
- `lib/readiness/official-truth-same-request-extraction-server.ts`

Expected result: those two source files need no edit. `herkunftFuer` and the same-request result type already tolerate the widened union.

Must not edit:

- `lib/readiness/regulierungs-anwendbarkeit.ts`
- `lib/readiness/official-truth-fact-entry-authority-server.ts`
- `lib/readiness/official.ts`
- `app/**`, `components/**`, `types/**`, `supabase/**`
- provider selection, routes, and F8

`rule-claim-store-schema.test.ts` should stay green without an edit.

## 16. Non-goals

The wiring slice does not:

- register a source extractor or fill the production registry;
- import a CH batch or write a source parser;
- call traveller evaluation from acceptance or the store;
- put `rule-applicability:v1` on the accepted claim;
- add `reg-eval-ctx:v1` or any context fingerprint;
- add a route, a UI, a provider, a model, or a plugin;
- add or apply a migration;
- change RLS, the effect table, or the RPC body;
- unify the duplicated personal-key lists;
- start F8;
- close the existing hole where a caller can pass a proposal object as `trustedRuleFact`.

An applicability-aware persistence schema is a later slice. It is a database and Production gate. This audit does not design its tables.

## 17. Residual notes

The personal-key set in `regulierungs-anwendbarkeit.ts` is a copy of the claim denylist plus school, institution, permit, and visa-number names. Requirement-effect and visa-option parsing will use that copy once they delegate to the reader. The other six fact kinds keep the `rule-claims.ts` set. Unifying them is a separate slice. Until then the lists can drift. That drift does not block wiring. It does not authorize copying traveller context into acceptance.

`official_unknown` remains an evaluator status for visa eligibility `unknown`. The fact parser may accept that eligibility. The store may persist it only on a legacy option, as it does today. The wiring slice must not coerce it to `not_allowed` and must not evaluate it.

`CANONICAL_WIRING_READY_FOR_RUNTIME_SLICE`
