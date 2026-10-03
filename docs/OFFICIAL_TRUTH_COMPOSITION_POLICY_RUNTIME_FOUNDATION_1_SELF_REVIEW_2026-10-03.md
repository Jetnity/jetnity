# Official Truth Composition Policy Runtime Foundation 1 — Self-Review

Date: 3 October 2026
Issue: #802
Draft PR: #803
Runtime commit: `afa673d43d1bdbacf02f7054c3c6796dab604570`
Correction commit: `0c5ed000`
Session: https://cursor.com/agents/bc-7a7df0ce-96f0-4949-99b6-0674046a2ce6
`originalModelName` of the first delivery: `grok-4.7-high-fast`
`originalModelName` of this correction: `claude-opus-5-thinking-high` — **Claude Opus 5 High**

This file attacks bypasses. It is not a Technical-Lead PASS.

Attacks 1 to 8 were written against head `70b0bb37`, which the Technical Lead rejected. Attacks 9 to 14 cover the three corrections and supersede attacks 4 and 5 where they conflict.

## Attack 1 — empty registry treated as permission to fetch

`officialTruthCompositionRegistriesPruefen([], [])` succeeds. An empty load is not itself `composition_policy_unavailable`. The block is phase A's zero-candidate result. The same-request function calls phase A before the retrieval loop, and the production test records retrieval length 0. A future caller that loads the empty registry and then retrieves without phase A would bypass the gate. No such caller was added.

## Attack 2 — duplicate extractors resolved by content type

Load rejects two `current` extractors that share `(factKind, sourceIds)` as `duplicate_extractor_match`. Content type is not part of that key, so two definitions that differ only by content type never reach HTTP. Phase A does not consult content type. If a test injects both definitions into phase A without the load check, the result is `ambiguous_policy`, not a first match. The same-request path runs the load check first.

The legacy extractor entry `ausfuehren` still filters by observed content type for explicit-primary and direct extractor tests. Composed same-request quality does not use that filter to choose a policy. Copying it into phase A would reopen the architecture hole. It was not copied.

## Attack 3 — caller policy smuggled as authority

Proof intake walks the request before `loadAuthority` and before the catalog read. Keys `policy`, `policyId`, `policyVersion`, and `assignments` return `caller_authority_forbidden`. The extractor entry rejects a non-null `policy` on the composed input and reads assignments only from the separate server-held argument. Phase A has no parameter for a caller policy id.

Residual: `compositionPolicies` on the same-request dependency object is server-owned injection. The live loader leaves it unset. A route that forwards the body into that slot would become caller authority. This slice adds no route.

## Attack 4 — phase B reselection

Content-type and schema failures return the frozen policy id and version. The function does not scan the registry again. Same-source composition and a repeated source id fail after retrieval binding and before `match` / `extract`, so those failures do not run the frozen extractor. The citation checker repeats the source-count check.

Residual: a proof that passes the source-count check can still run the frozen extractor and then fail a later citation rule. The extractor contract is a pure function. The type system does not forbid a side effect inside a future real extractor. No real extractor exists in this slice.

## Attack 5 — forged seal

The seal class is not exported. `isOfficialTruthCompositionSeal` requires `instanceof` that class. JSON serialization drops the class and the private brand. A plain object with the same fields fails. The seal is minted only on the phase B success path and is not passed to `regelKandidatAkzeptieren`.

Residual: code inside the same module can call the constructor. That is the module boundary. A later composer must import `isOfficialTruthCompositionSeal` and must not accept a structural lookalike. That composer is not in this pull request. The seal does not authorize acceptance by itself.

## Attack 6 — support ids moving locators

The structural key drops `supportVersionIds` and sorts compound children by that key, so the support-inclusive normalizer order cannot renumber a locator. Swapping support ids on structurally different atoms keeps the locators. Identical atoms use tie locators and a one-to-one support projection. A tie with a missing embedded support is `condition_provenance_ambiguous`. A tie of non-atomic expressions is `atom_locator_duplicate`. An extra policy locator is `atom_locator_missing`. A walk locator without an assignment is `atom_locator_unassigned`.

Residual: the walker returns `atom_locator_duplicate` for several distinct structural defects, including a non-atomic tie and an internal walk failure. Reviewers should not read that one reason as only "the same locator string was emitted twice".

## Attack 7 — explicit primary regression

The composed branch returns before retrieval only when quality is composed. Explicit primary still binds scope, retrieves, and extracts with `policy: null`. The success object for that path was not given the seal status.

## Attack 8 — legal or production scope creep

The new module imports `server-only`. Its source does not call `fetch`, read `process.env`, import Supabase, import the store, or import `regelKandidatAkzeptieren`. Policies in tests use synthetic source ids and example hosts. No country rule, visa outcome, or government page was registered.

## Attack 9 — a second extractor pipeline reappears (CR-1)

The composition module imports `officialTruthExtractorEingefroreneAusfuehrung` and nothing else that can execute a definition. It no longer imports `OfficialTruthExtractorKontext`, `officialTruthExtractorMedienTyp`, or `regelFaktKanonischLesen`. A structural test reads the file and fails on `.match(`, `.extract(`, `regelFaktKanonischLesen`, `officialTruthExtractorMedienTyp`, or `OfficialTruthExtractorKontext`. Inside the framework, `ausfuehren` and the seam both delegate to the one private `definitionAusfuehren`; neither contains its own matcher or parser call.

The seam performs no registry read. It re-validates the definition handed to it and refuses one that is not `current` or has no `(policyId, policyVersion)` pin. It never chooses a definition by content type; it only verifies the observed type against the frozen allowlist.

Residual: the seam is exported, so any server module could call it with its own definition object. That is the same trust boundary the framework already has for `officialTruthTrustedFactExtrahierenMitDefinitionen`. Both are test seams, both are `server-only`, and no route calls either. A later route that forwards a request body into the `definition` argument would be caller authority. This slice adds no route.

Residual: the structural test is a text assertion. It would not catch an alias such as `const f = def.extract; f(ctx)`. A reviewer must still read the diff, not only the test.

## Attack 10 — observations supplied or omitted by a caller (CR-2)

There is no observation parameter on any exported composition function, on the same-request dependency object, or in the request schema. The only producer is `extract()` on the code-owned definition. `beobachtungenLesen` rejects any `sourceId` that was not bound fresh from a `server_owned_official_retrieval` record in this same execution, so an extractor cannot attribute a value to a source it did not read.

Residual: a *definition* is still injectable through `compositionExtractors`, and a malicious definition could fabricate observations for the two sources it legitimately read. That is not a caller-authority hole — it is the extractor trust boundary, which is why the production registry is empty and why a real extractor needs a reviewed slice of its own. The seam narrows the blast radius to sources actually retrieved in this request.

## Attack 11 — a success path that skips the observation checks (CR-2)

`zitatePruefen` has no `if (observations)` guard. The first observation rule runs on every call, and the per-assignment loop iterates `freeze.policy.assignments`, which `policyLesen` guarantees is non-empty. An extractor that returns `{ ok: true, fact }` without the key fails earlier, in `schrittGrund`, because the required success key set is `['ok','fact','observations']` when observations are mandatory. An empty array fails in `beobachtungenLesen`. Both were proven in the same-request integration test, including the assertion that the extractor really ran.

Residual: `conflicting_value` compares canonical strings for exact equality. Two sources that state the same rule in different canonical forms would block rather than agree. That is deliberately fail-closed; a real extractor must canonicalize before emitting.

Residual: the reason for an out-of-assignment source is `duplicate_value`, which reads oddly for a single stray value. It is kept because the Technical Lead named that reason and because the architecture already uses it for "this target got a value from a source the policy did not assign to it".

## Attack 12 — mutating the fact after sealing (CR-3)

Three independent layers make the bound fact immutable. The seam deep-freezes its whole result. Phase B calls `tiefEinfrieren` on the fact and then refuses to seal unless `tiefGefroren` confirms every reachable object is frozen. The constructor freezes once more and stores the fact inside a frozen view object. Freezing an already frozen object returns the same reference, so the seal binds the exact object Phase B verified, and `view()` returns the identical structure on every call.

The adversarial tests mutate the top level, an array, and a nested branch object; all three throw under ES-module strict mode, and the sealed fact is unchanged afterwards.

Residual: `Object.freeze` is shallow per object, which is why the recursive helpers exist; they use a visited set rather than a depth cap, so a deep or cyclic structure cannot silently escape the check. A frozen object can still be shadowed by a `Proxy` held elsewhere, but the seal returns the real object, not a proxy.

Residual: immutability is not authentication. The seal still proves only "this module produced this fact under this policy and these supports". It is not an acceptance, not a capability, and not a bearer.

## Attack 13 — a framework block reason silently downgraded

`OfficialTruthCompositionSperrgrund` is now a union that *includes* `OfficialTruthTrustedFactExtractorSperrgrund`, so Phase B returns the framework reason verbatim. The earlier head had a local allowlist that could have mapped an unexpected reason onto a vaguer one. That allowlist is deleted, and so is the local `schritt` helper that duplicated `schrittGrund`.

Residual: the same-request result type now surfaces more framework reasons to its caller than before. All of them are block reasons; none of them carries source text, a snapshot, or a URL.

## Attack 14 — explicit-primary drift from the shared pipeline (CR-1)

`ausfuehren` passes `beobachtungenPflicht: false` and `faktMarkerVerboten: false`, so the explicit-primary contract is byte-for-byte the old one: the same success key set, the same reasons, the same provenance. A regression test proves that an explicit-primary extractor returning an `observations` key is still rejected. The full extractor suite (42 tests) passes unchanged except for the new seam describe block.

Residual: the two paths now share code, so a future edit to `definitionAusfuehren` can affect explicit primary. That is the intended trade — one pipeline — and it is why the flags are explicit at both call sites rather than inferred.

## Residuals the next slice must not treat as closed

- F8 stays open.
- Branched composed acceptance in `regelKandidatAkzeptieren` stays `condition_provenance_ambiguous`.
- Schema-1 facts stay non-persistable.
- The autonomous composer and `policy_binding_missing` are not implemented.
- Production registries stay empty until a later slice registers a real, reviewed source family.
- This self-review does not replace an independent exact-head Technical-Lead review.
