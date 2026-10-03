# Official Truth Composition Provenance Policy Architecture 1 — Self-Review

Date: 3 October 2026
Issue: #800
Draft PR: #801
Branch: `docs/official-truth-composition-provenance-policy-architecture-1`
Baseline: `main@aca8f811b2c9820fadc4df6c4756c424a983324c`
Session: https://cursor.com/agents/bc-bebba19d-e9c1-49fd-8ef5-504f8449cfd0
`originalModelName`: `grok-4.7-high-fast`

This file is the author's adversarial pass over the CR correction. It is not a Technical-Lead PASS, not Ready, and not a merge. Head `5a5245eccb6b7f7c5f7f57ccda21e4112c84c58b` stays CHANGES REQUIRED. The review head is the tip that contains this file.

## Scope check

| Boundary | Result |
| --- | --- |
| Docs only, four outputs | The correction edits the architecture, the report, the handoff, and this file. The task seed is pre-existing and unmodified. |
| Runtime, tests, migration, Supabase, Auth, RLS | Not edited. |
| Extractor registration | None. Production registry remains `Object.freeze([])`. |
| F8 or `regelKandidatAkzeptieren` | Not called and not changed. The composed blanket stays. The composer is not added. |
| Store or acceptance call | Not added. Schema-1 remains `applicability_not_persistable`. |
| Provider, model, network, secrets, cost | None. |
| Legal source semantics | No ETA effect, no country rule, no predicate body in the policy contract. The National List and Appendix appear only as source variables N and A. |
| Product-Owner gate | Not crossed. Provenance retention and Production apply stay gated. |
| Follow-up slice | Not started. The runtime file list is a recommendation for a later task. |
| Ready / merge | Not taken. |

## CR-1 — can phase A still depend on content type or the parsed fact?

Attack. The rejected head put `sourceFamilyId`, `schemaFamily`, and `applicabilitySchema` in one key and claimed that key was evaluated before HTTP. Live selection uses observed content types, and the schema exists only on the parsed fact. Multiple current extractors can share fact kind and source ids and differ by `contentTypes`.

The corrected protocol does not evaluate that full key before HTTP.

- Phase A reads `factKind`, `requirementType`, source ids, and canonical URLs from the frozen proof. It reads `sourceFamilyId`, `schemaFamily`, and `urlAllowlist` from the code-owned extractor definition. Those three fields already exist on `OfficialTruthExtractorDefinition`. They are not taken from the response.
- `applicabilitySchema` is absent from the pre-HTTP key. Phase B compares the parsed fact with the frozen pin and returns `schema_mismatch` without selecting the other pin.
- A content type outside the frozen extractor's list returns `content_type_not_allowlisted` with the same frozen `(policyId, policyVersion)`. It does not open a second registry search.
- Two current extractors that share `(factKind, sourceIds)` fail load as `duplicate_extractor_match` even when their content types differ. A test that injects both anyway gets `ambiguous_policy` before HTTP. There is no first-match and no fetch used as a tie-break.
- Two current policies that share the pre-HTTP key, including a pair that differs only by the schema pin, fail load as `duplicate_policy_match`. Phase A cannot see the schema, so it must not choose.
- Live `ausfuehren` still filters by observed content type and uses `ambiguous_structure` for several content-type matches. The later slice must not copy that filter into phase A. This pull request does not change that function.

Residual. Until the runtime slice lands, production composed input still returns `composition_policy_unavailable` before retrieval because both registries are empty. The content-type selector remains in the current extractor entry for tests that call it directly. That hole is named. It is not closed by these documents.

## CR-2 — can the checker still fail to name one schema-1 atom?

Attack. The rejected head stored `atomKey` on the policy and said the extractor version owned the binding. Live schema 1 has no atom id. `extract` returns only `{ ok: true, fact }`. Nested `all` / `any` / `not`, repeated predicates, and the live operand sort (canonical JSON that includes `supportVersionIds`) made that key unverifiable.

The corrected seam rejects a sidecar.

- A field named `atomKey`, `atomLocator`, or `atomId` on the fact or beside it is `unexpected_fields`. The policy stores the locator and the source ids. It does not store the predicate or the structural key.
- The checker walks the tree `normalisieren` already stored. It does not run a second normalizer. A path that existed only before that pass, including two `not` nodes, is `atom_locator_missing`.
- `regulierungsAusdruckStrukturSchluessel` omits `supportVersionIds` at every depth and sorts `all` / `any` operands by the support-free child key. Stored array order is discarded. Swapping support ids on structurally different atoms does not change their locators.
- A unique locator is one path, `branch:<id>/` plus `op:index/` steps plus `atom`, and it resolves to the only node at that position. `not` is always index `0`.
- Structurally identical atoms are a tie group. The checker does not sort them onto indexes. Each atom matches the assignment whose projected version ids equal its sorted `supportVersionIds`. Zero matches are `support_mismatch`. More than one, or two atoms matching one assignment, are `atom_locator_duplicate`. Omitted ids inside a tie are `condition_provenance_ambiguous`. Identical predicate and identical support ids cannot both exist: `normalisieren` already collapsed that canonical JSON.
- Two containers that differ only by inner support ids share a structural key and return `atom_locator_duplicate`. They are not ordered by those ids.
- Before provenance, a computed locator with no assignment is `atom_locator_unassigned`, a policy locator the walk did not compute is `atom_locator_missing`, and unassigned is reported first. The checker does not retarget the policy onto the drifted tree.
- A unique atom that omits ids is compared with the one version id of its branch. Omission does not skip that comparison. Omission when the branch cites two or more version ids stays `condition_provenance_ambiguous`.

Residual. The walk is specified, not implemented. A later export that stringifies `ausdruckObjekt` and only deletes the top-level `supportVersionIds` key would keep support-driven operand order inside containers and would fail this contract. The section 10 row for containers is the test that must reject that export.

## CR-3 — can a direct caller obtain branched composed success without a policy?

Attack. If a later acceptance slice replaced `condition_provenance_ambiguous` with the generic citation checks, and if `ok: true` were treated as proof of policy execution, any caller with `trustedRuleFact` plus accepted Evidence and syntactically valid branch citations would pass. The pure function does not read the policy registry.

The corrected boundary removes that claim.

- `regelKandidatAkzeptieren` stays the only constructor. Its input keys stay `kandidat`, `trustedRuleFact`, `evidenceVersions`, and `registry`. `policy`, `seal`, `policyExecuted`, and `compositionSeal` are `unexpected_fields`. The pure function never reads a seal. `ok: true` proves the checks inside that function. It does not prove that a policy ran.
- Authorized human fact entry calls that function directly. It is not routed through phase A and it does not require a seal. This correction does not widen it. On this baseline a branched composed fact still returns `condition_provenance_ambiguous`. A legacy composed success remains a human-path result and is not recorded as policy execution.
- Autonomous policy-backed success for a branched composed fact exists only when a later server-only composer, in one invocation, holds a seal created after phase A, phase B, and section 4 succeeded, and passes that seal's fact object reference to acceptance. The seal is a class. Its constructor is not exported. `JSON.parse` cannot construct it. A plain object fails `isOfficialTruthCompositionSeal`. Otherwise the composer returns `policy_binding_missing` and does not call acceptance.
- No same-request server module calls `regelKandidatAkzeptieren`. The foundation slice must not import it. A route must not import the composer. After a later registry is non-empty, the autonomous path still cannot bypass the composer.
- While the blanket remains, the composer also does not call acceptance for a branched composed fact. Replacing the blanket later still does not make the pure function a policy proof. The generic citation checks stay defense in depth.
- F8 is not implemented. The store still returns `applicability_not_persistable` for schema 1.

Residual. The seal is an in-process class identity and an object reference, not a signature over serialized bytes. It binds one invocation. A later factory that seals a caller-supplied fact, or a same-request module that imports `regelKandidatAkzeptieren` beside the seal factory, would violate this contract. Those modules are not in this pull request. The human path can still accept a legacy composed fact without a policy. That is the separate authority the correction names. It is not an autonomous success.

## Other attacks

### Can a caller still supply the assignment map?

On this baseline, yes, at the extractor test seam: `ausfuehren` parses `satz.policy`. Production cannot succeed, because the extractor registry is empty and composed same-request returns before extraction. The later slice refuses that input and reads assignments from the code-owned registry. The proof guard does not currently reject `policy`, `policyId`, `policyVersion`, or `assignments`. It ignores them. The later slice fails those keys as `caller_authority_forbidden` before the catalog read.

### Does `equal_values` fill a missing page from the other page?

No. A missing side is `fact_incomplete`. Equality compares two present parses. A second source speaking on a single-source slot is `duplicate_value`.

### Does a policy-version bump change provenance identity?

Provenance identity includes `(policyId, policyVersion)`. The applicability fingerprint does not include `policyVersion`. Two versions that emit the same citations still differ in provenance identity.

### Does the explicit-primary path move?

The success type stays `explicit_primary_statement` with null policy ids. Atoms may still omit ids when the single branch support is that one version. Phase A is not used. The policy registry is not consulted.

### Is the classification too early?

The contract does not depend on an unproven source family. The GOV.UK pair is only the shape of two single-source branches with union `{N, A}`. Blocking the foundation on a legal mapping would invent the mapping. Blocking it on a Product-Owner gate would be right for a migration or a Production apply. The named slice has neither. The residuals above stay visible: the live content-type selector, the unimplemented locator export, and the unimplemented seal.

## Residuals the reviewer should weigh

- `OfficialTruthExtractorPolitik` remains caller-parsed until the named runtime slice. Empty registries make it non-productive. They do not make the types safe.
- Schema-1 unconditional composed acceptance can succeed in the pure function. The store then refuses the claim. That success is human-path. Same-request does not call acceptance.
- `ambiguous_policy`, `duplicate_policy_match`, `duplicate_extractor_match`, `atom_locator_missing`, `atom_locator_unassigned`, `atom_locator_duplicate`, and `policy_binding_missing` are new reason names. `policy_binding_missing` belongs to the later composer, not to the pure function and not to the foundation slice's acceptance path. The boundary reason for zero policies stays `composition_policy_unavailable`.
- No runtime test was run. The failure matrix is specified, not executed.
- `docs/ACTIVE_WORK_STATUS.md` was left untouched because the task reserves global current-state edits for the Technical Lead. This handoff is the continuity record for the slice.

## Author conclusion

The four documents implement CR-1, CR-2, and CR-3 as contract text. They do not implement the runtime. The classification is ready for a later empty-registry runtime slice, not for F8, not for a real extractor, and not for merge. Independent exact-head review of the new tip decides.
