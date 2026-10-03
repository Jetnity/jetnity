# Official Truth Composition Policy Runtime Foundation 1 — Self-Review

Date: 3 October 2026
Issue: #802
Draft PR: #803
Runtime commit: `afa673d43d1bdbacf02f7054c3c6796dab604570`
Session: https://cursor.com/agents/bc-7a7df0ce-96f0-4949-99b6-0674046a2ce6
`originalModelName`: `grok-4.7-high-fast`

This file attacks bypasses. It is not a Technical-Lead PASS.

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

## Residuals the next slice must not treat as closed

- F8 stays open.
- Branched composed acceptance in `regelKandidatAkzeptieren` stays `condition_provenance_ambiguous`.
- Schema-1 facts stay non-persistable.
- The autonomous composer and `policy_binding_missing` are not implemented.
- Production registries stay empty until a later slice registers a real, reviewed source family.
- This self-review does not replace an independent exact-head Technical-Lead review.
