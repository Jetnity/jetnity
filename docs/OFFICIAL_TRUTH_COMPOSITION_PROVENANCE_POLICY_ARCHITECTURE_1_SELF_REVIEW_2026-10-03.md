# Official Truth Composition Provenance Policy Architecture 1 — Self-Review

Date: 3 October 2026
Issue: #800
Draft PR: #801
Branch: `docs/official-truth-composition-provenance-policy-architecture-1`
Baseline: `main@aca8f811b2c9820fadc4df6c4756c424a983324c`
Session: https://cursor.com/agents/bc-bebba19d-e9c1-49fd-8ef5-504f8449cfd0
`originalModelName`: `grok-4.7-high-fast`

This file is the author's adversarial pass. It is not a Technical-Lead PASS, not Ready, and not a merge.

## Scope check

| Boundary | Result |
| --- | --- |
| Docs only, four outputs | The session adds the architecture, this report's siblings, and this file. The task seed is pre-existing and unmodified. |
| Runtime, tests, migration, Supabase, Auth, RLS | Not edited. |
| Extractor registration | None. Production registry remains `Object.freeze([])`. |
| F8 or `regelKandidatAkzeptieren` | Not called and not changed. The composed blanket stays. |
| Store or acceptance call | Not added. Schema-1 remains `applicability_not_persistable`. |
| Provider, model, network, secrets, cost | None. |
| Legal source semantics | No ETA effect, no country rule, no predicate body in the policy contract. The National List and Appendix appear only as source variables N and A. |
| Product-Owner gate | Not crossed. Provenance retention and Production apply stay gated. |
| Follow-up slice | Not started. The runtime file list is a recommendation for a later task. |
| Ready / merge | Not taken. |

## Adversarial questions

### Can a caller still supply the assignment map?

On this baseline, yes, at the extractor test seam: `ausfuehren` parses `satz.policy` and the definition does not store assignments. Production cannot succeed, because the extractor registry is empty and composed same-request returns before extraction. The architecture refuses that input on the later slice and moves assignments into the code-owned registry. Until that slice lands, the hole is real and unreachable from `loadOfficialTruthSameRequestTrustedFactExtraction` for composed quality. The proof envelope does not currently reject a `policy` key. It ignores it. The later slice must fail it before the catalog read. Leaving it as a silent ignore would be a failed review of that slice.

### Can zero or several policies become a silent default?

No. Zero stays the existing pre-HTTP `composition_policy_unavailable`. Several current matches are `ambiguous_policy` with no first-match and no HTTP. A generic policy that matches every source set is not in the contract. The match key includes the exact source-id set.

### Does section 12 get implemented by renaming the blanket?

No. The blanket remains the live acceptance behavior. The architecture separates `support_mismatch` for empty, foreign, and incomplete citations from `condition_provenance_ambiguous` for omitted atom citations on a multi-source branch. A later acceptance slice may apply that split only while the same stack holds the registry policy. This pull request does not change `rule-claims.ts`. The current test that expects `condition_provenance_ambiguous` for a complementary composed fixture remains true.

### Can a legacy composed fact bypass the policy?

The pure acceptance function can still accept a legacy composed fact with no per-field provenance. That is live, and the architecture records it. The autonomous path cannot reach it: same-request composed quality returns before HTTP and before acceptance. The foundation slice does not weaken that return and does not call acceptance. Human fact entry stays the current constructor.

### Can the policy smuggle an effect or a nationality?

The registry object has no field for an effect, a visa mode value, a country, or a predicate body. `visaMode` appears only as an option slot key taken from the fact the extractor emitted. `atomKey` is an extractor-version key, not a sentence. Roles constrain target kind. They do not map to `required` or `not_required`. A later source-family extractor that binds an atom key to a predicate is outside this registry and outside this pull request.

### Does `equal_values` fill a missing page from the other page?

No. A missing side is `fact_incomplete`. Equality is a comparison of two present parses. Complementary assignment is disjoint `single_source` slots. A second source speaking on a single-source slot is `duplicate_value`.

### Does order or a policy-version bump change identity quietly?

Support ids, source ids, and citation rows are sorted. Operand trees already canonicalize inside the applicability module. A new `policyVersion` is a new provenance identity even when the citation rows are copied, because provenance identity includes the pair and the applicability fingerprint does not.

### Does the explicit-primary path move?

The success type stays `explicit_primary_statement` with null policy ids. Atoms may still omit ids when the single branch support is that one version. The policy registry is not consulted. The later slice's extractor change is limited to rejecting a non-null caller policy; explicit-primary already requires a null policy and returns `unexpected_fields` when one is present.

### Can this slice persist a schema-1 fact or start F8?

No store writer is called. `persistierbarenClaim` is unchanged. The recommended runtime module must not import `regelKandidatAkzeptieren`. F8 remains the open blocker on #751. A policy registry does not authenticate a source and does not create `trustedRuleFact` by itself.

### Is the classification too early?

The contract does not depend on an unproven source family. The GOV.UK pair is used only to show that two single-source branches with union `{N, A}` fit section 4. Blocking the foundation on a legal mapping would invent the mapping. Blocking it on a Product-Owner gate would be right for a migration or a Production apply; the named slice has neither. The residual that must stay visible is the caller-policy seam on the current extractor entry, closed by that slice before any non-empty registry is allowed.

## Residuals the reviewer should weigh

- `OfficialTruthExtractorPolitik` remains caller-parsed until the named runtime slice. Empty registries make it non-productive. They do not make the types safe.
- Schema-1 unconditional composed acceptance can succeed in the pure function. The store then refuses the claim. Same-request never gets there while the policy registry is empty.
- `ambiguous_policy` and `policy_not_registered` are new reason names. The boundary reason for zero policies stays `composition_policy_unavailable`, so existing callers of the live entry keep that reason.
- Atom identity depends on a later extractor version emitting `atomKey`. This architecture deliberately does not put the predicate in the policy. A source-family slice that skips the key and cites by prose would be outside this contract.
- No runtime test was run. The failure matrix is specified, not executed.
- `docs/ACTIVE_WORK_STATUS.md` was left untouched because the task reserves global current-state edits for the Technical Lead. This handoff is the continuity record for the slice.

## Author conclusion

The four documents stay inside the task. The classification is ready for a later empty-registry runtime slice, not for F8, not for a real extractor, and not for merge. Independent exact-head review decides.
