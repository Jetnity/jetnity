# Official Truth Composition Provenance Policy Architecture 1

Date: 3 October 2026
Status: **docs-only architecture / Draft PR #801 / no runtime / no acceptance change / no migration**
Issue: #800
Draft PR: #801
Branch: `docs/official-truth-composition-provenance-policy-architecture-1`
Baseline: `main@aca8f811b2c9820fadc4df6c4756c424a983324c`
Task: `docs/OFFICIAL_TRUTH_COMPOSITION_PROVENANCE_POLICY_ARCHITECTURE_1_TASK_2026-10-03.md`
Logical agent: **Jetnity Official Truth composition provenance policy architecture 1**, Generation 1
Required model: Grok 4.7 High Fast (`grok-4.7-high-fast`), not Auto
Session: https://cursor.com/agents/bc-bebba19d-e9c1-49fd-8ef5-504f8449cfd0
`originalModelName`: `grok-4.7-high-fast`

This file is the binding architecture for a later code-owned composition-policy foundation. It does not implement that foundation, does not register a policy or an extractor, does not change `regelKandidatAkzeptieren`, and does not authorize F8, a route, a store write, or a Production apply. The task file stays unchanged.

## CR correction — 3 October 2026

Technical-Lead review of `5a5245eccb6b7f7c5f7f57ccda21e4112c84c58b` is CHANGES REQUIRED. That head is not the review head. Comment `#5971822658`, continued by `#5972072800`.

- CR-1. Policy selection is two-phase. The pre-HTTP selector uses only the frozen proof and code-owned definitions. Content type and the parsed fact are not inputs. After retrieval, the frozen pair is verified and is not replaced.
- CR-2. An atom is bound by a locator derived from the normalized schema-1 tree. The fact gains no atom id. The policy stores no predicate body. Tie groups of structurally identical atoms match by a support-id bijection.
- CR-3. `regelKandidatAkzeptieren` stays the only claim constructor and does not prove that a policy ran. A code-owned policy is mandatory on the autonomous composed path through a non-JSON seal. Authorized human fact entry stays a direct call and is a separate authority.

The classification remains `COMPOSITION_POLICY_FOUNDATION_READY_FOR_RUNTIME_SLICE`. This correction still implements no runtime.

Live code on this baseline wins where an older sentence disagrees. The reads for this design are the task's required set, re-fetched `origin/main` at `aca8f811b2c9820fadc4df6c4756c424a983324c`, machine mode `NORMAL`, Issue #751, and #748 comments after marker `5971622750`. No MATERIAL comment is newer than that marker. #751 names this branch as the single active writer.

## 1. What the live chain already proves

| Claim | Live result |
| --- | --- |
| Production extractor registry is empty | `OFFICIAL_TRUTH_TRUSTED_FACT_EXTRACTOR_REGISTRY` is `Object.freeze([])` in `lib/readiness/official-truth-trusted-fact-extractor-registry.ts`. |
| Composed quality stops before HTTP | `decideOfficialTruthSameRequestTrustedFactExtraction` returns `composition_policy_unavailable` when `evidenceQuality` is `composed_from_multiple_primary_sources`, before retrieval. The success type hard-codes `explicit_primary_statement` and `policyId: null`. |
| The extractor framework has a policy shape | `OfficialTruthExtractorPolitik` is `{ policyId, policyVersion, assignments }`. An assignment is `{ fieldPath, sourceId }`. A composed definition stores `policyId`, `policyVersion`, and a non-empty `requiredFieldPaths`. `policyId` matches `^otp_[a-z][a-z0-9_]{0,40}$`. `policyVersion` is a positive integer. |
| Those assignments are read from the caller input | `ausfuehren` parses `satz.policy` for composed quality. The definition does not store the source assignments. Matching id and version checks that the caller named the pinned pair. The caller still chooses which `sourceId` fills which `fieldPath`. |
| Duplicate field paths fail | Equal `fieldPath` values on one policy object are `conflicting_value`. One path cannot cite two sources. |
| Field paths cannot name schema-1 branch slots | `FELD_PFAD` is `^[a-z][A-Za-z0-9]{0,40}(?:\.[a-z][A-Za-z0-9]{0,40}){0,4}$`. Underscore is outside the segment alphabet. Branch ids and visa modes use underscores. Five segments is the maximum, so an atom under `applicability.branches.<id>.when` does not fit. |
| Same-source composition is forbidden | Two supports with one `sourceId` fail `same_source_composition` in the extractor and in `regelKandidatAkzeptieren`. Composed quality also requires `supports.length === distinct source ids`, or the extractor returns `ambiguous_structure`. |
| Schema-1 branched composed acceptance fail-closes | `bedingungsHerkunftPruefen` returns `condition_provenance_ambiguous` as soon as a branched fact has composed quality, before it reads the citations. `lib/readiness/rule-claims.test.ts` locks a complementary two-branch citation under that quality to the same reason, with no claim. |
| Schema-1 without branches is a different acceptance path | `verzweigteZitate` returns null when a requirement effect is unconditional and when every visa option is unconditional. The provenance check then returns null. A composed unconditional schema-1 fact can pass `regelKandidatAkzeptieren`. The store still refuses it. |
| Legacy composed facts can pass acceptance | A legacy requirement effect has no branch citations. The same test file accepts a composed legacy fact. That success has no per-field provenance. |
| Every schema-1 fact is non-persistable | `persistierbarenClaim` returns null when a requirement effect has `schema` or `applicability`, and when a visa-options fact has `schema` or any option has `applicability`. `akzeptierteRegelClaimSpeichern` returns `applicability_not_persistable` before transport, client, payload, and RPC. |
| Explicit-primary schema-1 citations are already enforced | One claim support. Every branch cites that id. An atom may omit ids. An atom that cites an id cites only that id. A foreign id, an empty branch citation, an incomplete union, or an atom id outside its branch is `support_mismatch`. |
| F8 is open | #751. No function in this architecture calls `regelKandidatAkzeptieren`. |
| Production Official Truth apply is a Product-Owner gate | #751. This document does not apply a catalog, a store, or a provenance table. |

Reusable from the extractor architecture, section 3.5: a policy assigns already re-proved fields, contains no legal fallback value, and may later pin one exact integer conversion inside one immutable version. That conversion is not required here and is not added.

Reusable from predicate architecture section 12, now partially live: claim `supportVersionIds` are the only citable evidence versions; a composed branch citation is a non-empty subset; the union equals the claim supports when every support jointly makes the fact; an atom cites only a subset of its branch; omission across two or more sources fails closed. The live function implements the explicit-primary half and replaces the composed half with the blanket `condition_provenance_ambiguous`. This architecture keeps that blanket. Section 8 says which later checks may replace it, and that those checks still do not prove policy execution.

## 2. Authority and versioning

The only composition-policy authority is a pure code-owned immutable registry in a later server module. The production value of that registry is an empty frozen array until a later reviewed source-family slice registers one policy. This document registers none.

`policyId` is the stable family name, grammar `^otp_[a-z][a-z0-9_]{0,40}$`, already enforced by the extractor framework. `policyVersion` is a positive integer. The pair `(policyId, policyVersion)` is the identity. A published pair is not edited. The next semantic change allocates the next version and leaves the old object byte-for-byte in the registry with `current: false`.

A new version is required for any change to the pre-HTTP key, the citation targets, the assigned source-id sets, the relation, the role, `completeness`, `applicabilitySchema`, or `schemaFamily`. A content hash, a support version id, a retrieval time, and a `reviewPacketKey` are execution bindings. They do not select a version and they do not mutate one.

`current: true` is required for selection. A historical version stays addressable so an old provenance row can still name its pair. Selecting a non-current pair fails `policy_version_mismatch`.

The registry checker, run before any request, fails the module closed on:

- two entries with the same `(policyId, policyVersion)` — `duplicate_policy_version`;
- two `current` policies with the same pre-HTTP key from section 3 — `duplicate_policy_match`;
- two `current` extractor definitions with the same `(factKind, sourceIds)` — `duplicate_extractor_match`;
- a `current` composed extractor pin whose pair is absent, or whose pre-HTTP key disagrees with the policy — `invalid_policy_definition`.

Content type is not part of `duplicate_extractor_match`. Two current definitions that differ only by `contentTypes` are a load failure. Observed content type cannot choose between them later.

`applicabilitySchema` is not part of the pre-HTTP key. Two `current` policies that share that key and differ only by the schema pin are `duplicate_policy_match`. Phase A cannot see the parsed schema, so it does not choose between those pins.

Zero, one, and many are decided by the section 3 preflight, before HTTP. They are not decided by scanning policies with `sourceFamilyId`, `schemaFamily`, or `applicabilitySchema` taken from a response or a parsed fact.

A caller, a model, a plugin, a request body, a stored review packet, and a research note cannot select the pair, supply assignments, or mark a version current. The same-request proof guard does not currently list `policy`, `policyId`, `policyVersion`, or `assignments` in `ZEUGEN_VERBOTEN`. Those keys pass the proof shape check and are then ignored, because extraction hard-codes `policy: null` on the explicit-primary path and never reaches extraction for composed quality. The later runtime slice adds those keys to the proof guard so they fail as `caller_authority_forbidden` before the catalog read. On the extractor entry, a non-null `policy` input fails `unexpected_fields`. Assignments are read from the registry inside the server.

The existing `OfficialTruthExtractorPolitik` object is the caller-shaped input the framework parses today. It is not the authority. It cannot represent a branch that cites two sources, and it cannot name an atom.

## 3. Two-phase selection

The pre-HTTP key is the only selector. It contains no country, no citizenship, no effect, no visa mode, no predicate body, no content type, and no applicability schema. Those last two are not known before retrieval and extraction. Live extractor selection uses observed content types, so this protocol does not call that selector to choose the policy.

```ts
type OfficialTruthCompositionPreHttpKey = {
  factKind: RegelFaktArt
  requirementType: OfficialRequirementType
  sourceIds: readonly string[]
  sourceFamilyId: string
  schemaFamily: string
}
```

`sourceIds` is the exact sorted set from the proof supports, length 2 through `REGEL_SUPPORT_MAX` (8). Order in the request does not change the key. `sourceFamilyId` and `schemaFamily` are fields of the code-owned extractor definition, read before any socket. They are not read from the response. `applicabilitySchema: 1 | null` stays on the policy as a pin. It is not part of the pre-HTTP key. `null` means the fact must have no `schema` and no `applicability`. `1` means `schema` is 1. The pin is checked only in phase B.

URL and path constraints stay on that extractor definition's `urlAllowlist`. The policy does not grow a second URL language. The proof already carries each support's canonical URL, so phase A can test `urlErlaubt` before HTTP. A URL that stays inside the allowlist does not select a different policy.

The regulatory cell stays on the proof's `rule-scope:v1:` key. The selector does not read destination, transit, citizenship, credential option, residence, or travel date. One invocation remains one cell. A second citizenship set or a second credential option is a different scope and a different invocation.

### 3.1 Phase A — pre-retrieval preflight

Inputs are the frozen proof and the two code-owned registries. The proof supplies `factKind`, `requirementType`, the support source ids, and the support canonical URLs. It does not supply content type, `sourceFamilyId`, `schemaFamily`, or a fact.

```
candidates = current extractors whose factKind equals the proof
             and whose sourceIds set equals the proof source-id set
if candidates.length == 0:
  return composition_policy_unavailable    // before HTTP
urlOk = candidates where every proof support URL passes urlErlaubt
if urlOk.length == 0:
  return domain_or_path_not_allowlisted    // before HTTP
if urlOk.length > 1:
  return ambiguous_policy                  // before HTTP; content type is not a tie-break
extractor = urlOk[0]
policy = the current registry entry with extractor.policyId and extractor.policyVersion
if that entry is missing:
  return composition_policy_unavailable    // before HTTP
if policy.factKind, requirementType, sourceIds, sourceFamilyId, or schemaFamily
   disagrees with the proof or with the extractor:
  return policy_version_mismatch           // before HTTP
freeze (extractorId, extractorVersion, policyId, policyVersion)
```

Load-time `duplicate_extractor_match` makes `urlOk.length > 1` a registry defect. A test that injects two current extractors anyway still returns `ambiguous_policy` before HTTP. There is no first-match and no fetch used to see which content type arrives.

The frozen pair is the policy identity for the rest of the invocation. Phase B does not search the registries again.

### 3.2 Phase B — post-retrieval verification

Retrieval runs only after a freeze. It uses the proof URLs and the frozen extractor's allowlist. Then, in order, without choosing another extractor or another policy:

| Check | Failure |
| --- | --- |
| Every observed content type is in the frozen extractor's `contentTypes` | `content_type_not_allowlisted` |
| Source id, final URL, and content hash still match the proof support | The existing drift reasons |
| `match` and `extract` run only on the frozen definition | The matcher's own reason |
| `fact.kind` equals the frozen `factKind` | `fact_kind_mismatch` |
| The fact's applicability schema equals the frozen policy pin: `1` when `schema` is 1, otherwise `null` | `schema_mismatch` |

A schema mismatch does not select the other pin. A content type outside the frozen list does not select the extractor that would have allowed it. Both results keep the frozen `(policyId, policyVersion)` in the block record and return no fact.

## 4. Citation contract

### 4.1 Two layers

Generic invariants are enforced for every policy this contract can load. Policy-specific assignments say which source ids fill which slots. The policy object contains source ids and slot keys. It does not contain `required`, `not_required`, a visa mode as a fallback, a page count, a duration, a boolean, a purpose, an anchor, a country code, or a predicate body.

The only completeness value the registry accepts is `joint_complete_fact`. Under that value the union rule in section 4.3 is mandatory. A policy that names another completeness value fails `invalid_policy_definition` at load. That is how section 12's phrase "when the policy says all supports jointly make the complete fact" becomes a closed contract: every loadable policy says it, and the checker enforces it.

### 4.2 Targets

`requiredFieldPaths` and `FELD_PFAD` stay the scalar path language for top-level legal fields of legacy facts and of schema-1 facts that still have top-level outcomes (`effect`, `visaMode`, and the existing top-level fields of the other six fact kinds). They are not extended to encode branch ids.

Schema-1 branch, atom, otherwise, and per-option slots use a citation target. The target is data on the policy entry and on the composed provenance row. It is not a key of `RegelFakt`. `regelFaktLesen` would reject it on the fact.

```ts
type OfficialTruthCompositionCitationTarget =
  | { kind: 'fact_field'; fieldPath: string }
  | { kind: 'branch'; branchId: string }
  | { kind: 'branch_outcome'; branchId: string; field: 'effect' | 'visaMode' | 'eligibility' | 'mandate' }
  | { kind: 'atom'; branchId: string; atomLocator: string }
  | { kind: 'otherwise'; branchId: string }
  | { kind: 'visa_option_field'; visaMode: Exclude<OfficialVisaMode, 'unknown'>; field: 'eligibility' | 'mandate' }
  | { kind: 'visa_option_branch'; visaMode: Exclude<OfficialVisaMode, 'unknown'>; branchId: string }
  | { kind: 'visa_option_outcome'; visaMode: Exclude<OfficialVisaMode, 'unknown'>; branchId: string; field: 'eligibility' | 'mandate' }
  | { kind: 'visa_option_atom'; visaMode: Exclude<OfficialVisaMode, 'unknown'>; branchId: string; atomLocator: string }
  | { kind: 'visa_option_otherwise'; visaMode: Exclude<OfficialVisaMode, 'unknown'>; branchId: string }

type OfficialTruthCompositionAssignment = {
  target: OfficialTruthCompositionCitationTarget
  sourceIds: readonly string[]
  relation: 'single_source' | 'equal_values'
  role:
    | 'complementary_part'
    | 'equal_values'
    | 'general_rule'
    | 'exception'
    | 'applicability_list'
    | 'exemption_set'
}
```

`branchId` matches `^[a-z][a-z0-9_]{0,40}$`. `atomLocator` is the string from section 4.6, not a free name and not a predicate. `sourceIds` is a sorted unique non-empty subset of the policy's `sourceIds`. `single_source` requires exactly one id. `equal_values` requires two or more, and its role is `equal_values`.

The schema-1 atom on the fact stays `{ op: 'atomic', predicate, supportVersionIds? }` as `regulierungs-anwendbarkeit.ts` already parses it. `extract` still returns only `{ ok: true, fact }`. A field named `atomKey`, `atomLocator`, or `atomId` on the fact or beside it is `unexpected_fields`. The checker derives the locator from the normalized tree. The policy stores that locator and the source ids. It does not store the predicate.

`kind` and `schema` are structural. They are not assignments. A schema-1 branched requirement effect has no top-level `effect` or `visaMode`. Its legal outcomes sit on `branch_outcome` and `otherwise`. A schema-1 unconditional requirement effect assigns `fact_field` paths `effect` and `visaMode` when `visaMode` is part of that fact shape. A legacy fact assigns its existing legal fields the same way.

For visa options, `visaMode` is the option's identity on the fact, used as a slot key so two options are not merged. The policy does not invent an option that the extractor did not emit. `unknown` is not a slot key.

### 4.3 Generic invariants

These hold for every `joint_complete_fact` policy. They are not chosen per source family.

1. Every cited version id belongs to the re-proved accepted Evidence set of this request. Any other id is `support_mismatch`.
2. The request has one support version per source id. A second version of the same source is `same_source_composition` when the source set has size 1, and `ambiguous_structure` when a source id is repeated inside a larger set.
3. Each branch, including `otherwise`, has a non-empty `supportVersionIds` subset of the claim supports. An empty branch citation is `support_mismatch`.
4. The union of those branch citations equals the claim supports. A missing support is `support_mismatch`.
5. An atom's `supportVersionIds`, when present, are a non-empty subset of its branch. An id on the claim but outside the branch is `support_mismatch`.
6. An atom may omit `supportVersionIds` only when its branch cites exactly one version id. The provenance row still records that id. Omission when the branch cites two or more version ids is `condition_provenance_ambiguous`. There is no inheritance across two or more source ids.
7. A value with no assignment fails `policy_field_unassigned`. The checker does not copy a neighboring source into the hole.
8. An outcome field's sources are a subset of its branch's sources.
9. `otherwise` cites only the sources assigned to that residual branch. It does not inherit exception sources.
10. Projection from source id to version id uses the frozen proof supports. A source id in the policy that is absent from the proof is `support_mismatch`.

Explicit-primary facts stay on the live rule: one support, every branch cites it, atoms may omit. The policy registry is not consulted. `policyId` and `policyVersion` on that provenance stay null.

### 4.4 Policy-specific assignments

The policy decides, and only the policy decides:

- which targets exist;
- which source-id subset each target cites;
- whether that subset is `single_source` or `equal_values`;
- which role label is attached to the target.

Role labels constrain target kind. They do not select an effect.

| Role | Allowed targets |
| --- | --- |
| `complementary_part` | Any target with `relation: 'single_source'` |
| `equal_values` | Any target with `relation: 'equal_values'` |
| `general_rule` | `otherwise`, `visa_option_otherwise`, or a top-level `fact_field` on an unconditional or legacy fact |
| `exception` | An expression `branch`, `branch_outcome`, or `atom`, and the visa-option equivalents |
| `applicability_list` | A `fact_field`, an `otherwise`, or an `atom` whose locator the policy names |
| `exemption_set` | An expression `branch` or `atom`, and the visa-option equivalents |

A role on the wrong target kind fails `invalid_policy_definition` at load.

The branch's `sourceIds` equal the union of its outcome assignments and its atom assignments. The policy states the branch citation explicitly. The checker recomputes the union and fails `policy_field_unassigned` when they differ. An explicit branch citation is required so a dropped atom cannot shrink the branch quietly.

### 4.5 Agreement before a later acceptance call

Extractor provenance and the fact's embedded citations describe the same version ids.

For a composed success the provenance row is:

```ts
type OfficialTruthCompositionHerkunft = {
  citationKey: string
  target: OfficialTruthCompositionCitationTarget
  extractorId: string
  extractorVersion: number
  sourceId: string
  versionId: string
  policyId: string
  policyVersion: number
}
```

`citationKey` is the canonical JSON of `target` with keys in the order written in section 4.2. Rows sort by `(citationKey, versionId)`. A multi-source target emits one row per source. Explicit-primary `OfficialTruthExtractorHerkunft` stays the current object, with null policy fields. Composed provenance does not reuse that one-source `herkunftFuer` map.

Agreement fails closed, with no fact returned, when any of these differ: the embedded branch ids and the projected policy version ids; an atom's ids and the assignment resolved by section 4.6; a provenance version id and the embedded citation for that target. `support_mismatch` is the reason, except omission across two or more sources, which remains `condition_provenance_ambiguous`. Locator failures use the section 4.6 reasons and are decided before this comparison.

### 4.6 Atom locators

The parsed branch expression is already the output of `normalisieren` in `lib/readiness/regulierungs-anwendbarkeit.ts`: double `not` is removed, nested `all` and nested `any` are flattened, operands are sorted by canonical JSON, and operands with identical canonical JSON are one node. The checker walks that stored tree. It does not implement a second normalizer. A locator that existed only before that normalization, including a path through two `not` nodes, is `atom_locator_missing`.

The structural key is `regulierungsAusdruckStrukturSchluessel`, exported by the later slice from `lib/readiness/regulierungs-anwendbarkeit.ts`. The policy module calls that function. It does not stringify a predicate on its own, and it does not reimplement `ausdruckObjekt`. The key is a comparison input. It is not stored on the policy.

Live `normalisieren` sorts operands by `JSON.stringify(ausdruckObjekt(...))`, and that string includes `supportVersionIds`. Stored array order can therefore change when only support ids change. The structural key must not inherit that order. The export builds it as follows, using the private `ausdruckObjekt` / `praedikatObjekt` helpers already in that file:

```
atomic: { op: 'atomic', predicate } from ausdruckObjekt, with supportVersionIds absent
not:    { op: 'not', operand: strukturObjekt(operand) }
all/any: { op, operands: child strukturObjekt values sorted by JSON.stringify ascending }
key:    JSON.stringify of that object
```

`supportVersionIds` is omitted at every depth. Sorting is by the support-free child key, not by the stored array and not by the support-inclusive canonical JSON. Two containers that differ only by inner support ids therefore have the same key. The walk below then treats them as one structural group and fails closed. It does not order them by those ids.

Locator grammar, with indexes written in decimal and no leading zeros:

```
atomLocator = ["option:" visaMode "/"] "branch:" branchId "/" step* "atom"
step        = ("all" | "any" | "not") ":" index "/"
            | ("all" | "any") ":tie:" base ":" tieIndex "/"
```

`not` always uses index `0`. `visaMode` is present only for an atom under a visa option, and it is the mode already on that option.

Walk of an `all` or `any` node:

1. Take the stored operands. Discard their array positions.
2. Compute each operand's structural key.
3. Group equal keys. Order the groups by that key ascending.
4. `cursor` starts at 0. For a group of one operand, the step is `op:cursor` and the walk continues into that operand. `cursor` then increases by 1.
5. For a group of two or more operands, the group occupies indexes `cursor` through `cursor + length - 1`. `base` is `cursor`. `cursor` then increases by the group length. The walk does not assign array order inside the group.

A group whose members are all `atomic` is a tie group. Any other group of two or more is `atom_locator_duplicate`. Nested `all`, `any`, and `not` are addressed only when each container is the sole member of its structural group. Two containers that differ only by support ids inside them fail closed instead of being ordered by those ids.

A unique atom's locator is the path of those steps plus `atom`. That path is the only node at that position, so the locator resolves to that atom. Example: an `all` whose only operand is `not` of one atom is `branch:exemption/all:0/not:0/atom`. Swapping support ids on structurally different atoms does not change this locator. The index comes from the support-free group cursor, not from the stored array index.

A group of two or more containers returns `atom_locator_duplicate` during the walk, before a child locator is emitted and before provenance. Nested `all`, `any`, and `not` are addressed only as singleton groups.

At load, an atom locator must match the grammar above. Its `branch:` segment equals the target's `branchId`. Its `option:` segment is present only on a visa-option target and equals that target's `visaMode`. Any other shape is `invalid_policy_definition`. The walk prefixes each computed locator with the branch, and the visa mode, that it is actually walking. A stored locator for a different branch or mode is not among those computed locators.

A tie group of `n` atoms has required locators `op:tie:base:0/atom` through `op:tie:base:(n-1)/atom`, each `tieIndex` once. The checker does not sort the atoms onto those indexes. A unique atom resolves by path. A tied atom resolves only when the bijection below matches it to exactly one of those assignments. The policy still stores no predicate.

```
required = the walk's computed locators for this branch
if a non-atomic structural group has size > 1:
  return atom_locator_duplicate
if the walk emits one locator twice:
  return atom_locator_duplicate
if any locator in required has no policy assignment:
  return atom_locator_unassigned
if any policy atom locator for this branch is not in required:
  return atom_locator_missing
for each atomic tie group:
  if any tied atom omits supportVersionIds or cites an empty list:
    return condition_provenance_ambiguous
  for each atom:
    matches = the group's assignments whose projected version ids
              equal the atom's sorted supportVersionIds
    if matches.length == 0: return support_mismatch
    if matches.length > 1: return atom_locator_duplicate
  if the matched assignments are not all distinct:
    return atom_locator_duplicate
```

The matched assignment's locator is that atom's locator. Two structurally identical atoms stay distinct because their support-id sets differ, and each set matches one assignment. Two assignments with the same projected version ids make the match ambiguous and fail `atom_locator_duplicate`. Identical atoms that also share support ids do not both exist: `normalisieren` already collapsed them, because its canonical JSON includes those ids.

For an atom outside a tie group, omission and comparison run after the locator set agrees:

| Condition | Reason |
| --- | --- |
| The atom omits ids and its branch cites two or more version ids | `condition_provenance_ambiguous` |
| The atom omits ids and its branch cites one version id, and that id is not the projected assignment | `support_mismatch` |
| The atom cites ids and they differ from the projected assignment | `support_mismatch` |

Omission on a one-id branch records that one version id on the provenance row. It does not skip the comparison. A tree drift that moves an atom fails `atom_locator_unassigned` for the new locator or `atom_locator_missing` for the old one, unassigned first. The checker does not retarget the policy to the new tree.

## 5. Completeness classes

The checker classifies the frozen supports and the parsed values. It does not repair them.

| Class | What the bytes show | Result |
| --- | --- | --- |
| Complementary sources | `single_source` assignments, disjoint source subsets, every required target present, union equals the claim supports | The fact may proceed to the agreement check |
| Duplicate corroboration | `equal_values` on one target, every named source parsed, canonical values equal | That target cites every participating version id |
| Conflicting sources | Two parses of one target differ, or `equal_values` parses differ | `conflicting_value` |
| Duplicate, not complementary | A second source produces a value for a target assigned to one other source, and the policy did not declare `equal_values` | `duplicate_value` |
| Stale or mixed epoch | Any support is not `current` at the one server instant, the fresh hash differs from accepted Evidence, or the extractor required an epoch and could not read it | `freshness_not_current`, `source_changed_since_evidence`, or `source_epoch_unreadable`. Policy execution does not start |
| Exception beside a general rule | `general_rule` on `otherwise`, `exception` on the expression branches, each with its own source subset | Representable. The role check does not read the sentence |
| List beside exemptions | `applicability_list` on the list side, `exemption_set` on the exemption branches | Representable as a shape. No list entry and no exemption sentence is stored in this contract |

The epoch relation this contract loads is `each_support_current`. Every support is `current` under `officialFrische` at the proof's `serverReferenceTime`, and the fresh retrieval hash equals that support's accepted Evidence hash. Equal `validFrom` is not required. Two documents can both be current and still be different content items. A support that fails freshness never reaches a policy. The extractor's existing `source_epoch_unreadable` still applies when that extractor version requires an epoch token. The policy does not invent the token.

`equal_values` does not fill a missing side from the present side. A missing side is `fact_incomplete`.

Same publisher is not the same `sourceId`. Two content items are two source ids and can be one match key. Two renderings of one content item are one source. They are not a composition. The GOV.UK audit recorded that split for the National List and Appendix ETA content items, and for the HTML page versus the Content API of one base path. This contract can represent two content items. It does not register those URLs, those content ids, or an ETA effect.

Adversarial shape, variables only:

| Slot | Role | Source variable |
| --- | --- | --- |
| `otherwise` branch `residual` | `general_rule` | N, the list document |
| Expression branch `exemption` and its atoms | `exception` or `exemption_set` | A, the exemption document |
| Atom or otherwise that carries list membership, when the extractor version emits one | `applicability_list` | N |

N and A are distinct source ids. The branch union is `{N, A}`. If each branch cites exactly one source, atoms on that branch may omit embedded ids and the provenance row still records the one version id. If a branch cites both N and A, every atom on it carries an explicit subset. That is the shape a National-List-plus-Appendix composition would have to satisfy. The outcome values are whatever the later extractor reads from those bytes. This document does not choose them. `BODY_MAX` stays 65,536. The Appendix HTML size recorded by the audit is not changed here.

## 6. Same-request execution

Phase A runs only after these are already true, and before any retrieval socket:

1. `decideOfficialTruthSameRequestProof` returned `same_request_proof` from one catalog read, one server instant, the frozen source registry, the re-proved accepted Evidence, the rebuilt candidate, and freshness `current` on every support.
2. The grant is the role grant for `official-truth-freigeben`.
3. Section 3.1 freezes one extractor/policy pair, or returns before HTTP.

Retrieval runs only after that freeze. Each retrieval must keep the proof's source id, final URL, and content hash. A drift is `support_binding_mismatch`, `source_url_changed_since_evidence`, or `source_changed_since_evidence`. Phase B then verifies content type, the frozen matcher, fact kind, and the applicability-schema pin. Citation checks in section 4 run on that same fact. They do not open a second registry search.

No second catalog read occurs. The policy module does not call `quellenKatalogLesen`. Caller registry, caller Evidence, caller retrieval, caller support ids, caller fact, caller policy, and a witness object are not inputs. The proof guard rejects the witness and evidence keys it already lists. The later slice adds the policy keys to that guard.

The candidate `proposal` stays untrusted review material. It is not an assignment and not `trustedRuleFact`.

## 7. Extractor seam

`OfficialTruthExtractorPolitik` is not sufficient. The later slice extends the framework at the points below and does not add a second extractor pipeline.

| Seam | Later behavior |
| --- | --- |
| Input `policy` | Must be null. A non-null object is `unexpected_fields`. |
| Assignment source | The selected registry entry. |
| `requiredFieldPaths` | Still the scalar legal fields. For a branched schema-1 policy, an empty list is valid only when the pinned policy's citation targets cover every legal slot. Today's `definitionLesen` rejects that empty list. The later slice allows it only under that pin. The production extractor registry stays empty, so production still has nothing to select. |
| Scalar provenance | Unchanged for explicit-primary. |
| Composed provenance | Section 4.5 rows, produced with the policy module. `herkunftFuer` is not used to collapse a multi-source target onto one `sourceId`. |
| `policy_required` | Remains the reason when composed quality reaches the extractor with no selected registry entry. The same-request boundary normally returns earlier with `composition_policy_unavailable`. |
| `policy_version_mismatch` | The pinned pair is missing `current: true`, or `factKind`, `requirementType`, `sourceIds`, `sourceFamilyId`, or `schemaFamily` disagrees with the frozen proof or the frozen extractor. An applicability-schema disagreement is `schema_mismatch` in phase B, not this reason. |
| `policy_field_unassigned` | A required target or scalar path has no assignment, or the stated branch union disagrees with the recomputed union. |
| `conflicting_value` | Parsed values of one target disagree. |
| `ambiguous_structure` | A repeated source id inside an otherwise valid multi-source set. Two current extractors are not this reason. They are `duplicate_extractor_match` at load and `ambiguous_policy` if they still reach preflight. |
| `same_source_composition` | Fewer than two distinct source ids. |
| `ambiguous_policy` | Phase A saw more than one URL-eligible current extractor for the pre-HTTP key. No HTTP. |
| `policy_not_registered` | The policy module's name when the pinned pair is absent. The same-request boundary maps that absence to `composition_policy_unavailable`. |
| `duplicate_extractor_match` | Load-time. Two `current` extractors share `(factKind, sourceIds)`. |
| `duplicate_policy_match` | Load-time. Two `current` policies share the pre-HTTP key, including a pair that differs only by `applicabilitySchema`. |
| `atom_locator_missing` | A policy atom locator is not in the walked tree. |
| `atom_locator_unassigned` | A walked atom locator has no policy assignment. |
| `atom_locator_duplicate` | One locator emitted twice, a non-atomic structural tie, or a tie-group match that is not one-to-one. |
| `duplicate_value` | A source outside the assignment also produced a value for that target. |

The framework stays source-neutral. Country-specific predicates and URL pins belong to a later extractor version, which this slice does not register. The generic module's tests use synthetic source ids and synthetic trees. The policy objects in those tests contain locators and source ids, not predicate bodies.

Existing reasons are reused wherever the table names them. The new names are policy cardinality, extractor cardinality before HTTP, and locator failures. Content-type selection is not one of those names.

## 8. Acceptance and the autonomous boundary

`regelKandidatAkzeptieren` remains the only function that returns an accepted rule claim. The policy module does not call it. A seal is not a second constructor. The pure function's `ok: true` proves the checks inside that function. It does not prove that a code-owned policy ran.

Two authorities stay separate.

**Authorized human fact entry** calls `regelKandidatAkzeptieren` directly with the operator-supplied `trustedRuleFact`. That call is the existing human authority. It does not pass through the policy registry and it does not require a seal. This correction does not widen it and does not route it through phase A. On this baseline a branched composed fact still returns `condition_provenance_ambiguous` with no claim, including the complementary citation the current test already builds. A legacy composed fact can still be accepted, as that test also locks. Those results are human-path results. They are not policy execution.

**The autonomous composed path** may treat a branched composed fact as policy-backed only when a server-only composer, in one invocation, holds a seal created by the policy module after phase A, phase B, and section 4 all succeeded, and then passes that seal's fact reference to `regelKandidatAkzeptieren`. This document does not add that composer. It is not F8. The foundation slice must not import `regelKandidatAkzeptieren`.

The seal is a class constructed only inside the policy module. The constructor is not exported. `sealOfficialTruthCompositionExecution` returns an instance only after the frozen policy, the frozen extractor, and the locator checks agree. The instance holds the fact object reference, `(policyId, policyVersion)`, and the sorted support version ids. `JSON.parse` of a request body cannot construct it. A plain object with the same fields fails `isOfficialTruthCompositionSeal`. The symbol or the class identity stays module-private. Exporting a forgeable boolean flag is not this seal.

The composer, when a later task adds it, is the only production module that may import both the seal factory and `regelKandidatAkzeptieren`. A route must not import it. No same-request server module calls `regelKandidatAkzeptieren`. After a later registry is non-empty, the autonomous path still reaches acceptance only through that composer. It calls acceptance only when `isOfficialTruthCompositionSeal` is true and `trustedRuleFact` is the seal's fact reference. Otherwise it returns `policy_binding_missing` and does not call acceptance. It does not read `kandidat.proposal`. It does not accept a caller fact, a caller policy, or a witness. A direct call stays the human fact-entry authority. It is not reclassified as autonomous success.

`regelKandidatAkzeptieren` keeps the input keys `kandidat`, `trustedRuleFact`, `evidenceVersions`, and `registry`. A key named `policy`, `seal`, `policyExecuted`, or `compositionSeal` is `unexpected_fields`. The pure function never reads a seal, so a caller cannot hand it a forged policy witness. Adding that key would be a bypass, and this contract forbids it.

Defense in depth that stays inside `regelKandidatAkzeptieren` if a later acceptance slice replaces the composed blanket:

- quality is one of the two acceptable values;
- composed quality has at least two Evidence versions and at least two `sourceId` values, all `official_authority`, all on the same scope key;
- the fact parses only through `regelFaktLesen`;
- every embedded version id is in the claim supports;
- every branch citation is non-empty;
- every atom citation is inside its branch;
- an omitted atom citation is legal only for a one-id branch;
- the branch union equals the claim supports.

Those checks do not read the policy registry. A fact that skipped the policy still cannot pass with a foreign id, an empty branch, or a union that drops a support. Passing them is still not proof of policy execution. The autonomous composer remains responsible for refusing an unsealed fact before the call. While the blanket remains, the composer also does not call acceptance for a branched composed fact, because the pure function would reject it and because F8 is not authorized.

Schema-1 unconditional and legacy composed acceptance stay as they are. The same-request path still refuses every composed quality before HTTP while the policy registry is empty, so the autonomous path cannot use the legacy acceptance success. The human fact-entry path is unchanged.

The store guard stays. A schema-1 claim that a later acceptance slice might return still fails `applicability_not_persistable` before transport. This architecture does not widen `persistierbarenClaim`.

## 9. Later provenance record

A provenance record is a separate slice. This contract names the minimum non-personal identifiers that record would copy from a successful policy execution. It does not choose a retention duration, add a column, or add a migration.

- `extractorId`
- `extractorVersion`
- `policyId`
- `policyVersion`
- `reviewPacketKey` from the same proof
- sorted support version ids
- the sorted citation rows of section 4.5: citation key, source id, version id
- source content hashes only as the hashes already stored on the accepted Evidence rows, linked by version id
- `rule-applicability:v1:` from `regelAnwendbarkeitFingerprint` when the fact has schema-1 applicability

Provenance identity is the extractor pair, the policy pair, the sorted support version ids, and the citation rows. The applicability fingerprint includes the embedded support ids and does not include `policyVersion`. Two policy versions that emit the same citations share that fingerprint and still differ in provenance identity. A policy-version change therefore changes provenance identity, which is the required test.

The record does not contain raw page text, a review-packet body, `proposal`, model output, or traveller context. `reg-eval-ctx:v1` stays out. The current claim payload still has no extractor, policy, or review-packet column. Adding one is a later schema slice and a Product-Owner gate before any Production apply.

## 10. Failure matrix

These tests belong to the later runtime slice. This pull request adds none.

| Case | Required result |
| --- | --- |
| Caller policy injection on the proof envelope | `caller_authority_forbidden` before the catalog read. Keys: `policy`, `policyId`, `policyVersion`, `assignments`. |
| Model or plugin policy injection | Existing forbidden model, plugin, suggestion, and `trustedRuleFact` keys still fail before selection. A policy object nested there fails the same way. |
| Wrong policy id or version | `policy_version_mismatch` before HTTP when it is the only URL-eligible extractor. A non-current version is the same reason. |
| Zero pre-HTTP candidates | `composition_policy_unavailable` before HTTP. `retrieve` is not called. |
| Proof URL outside the only candidate allowlist | `domain_or_path_not_allowlisted` before HTTP. |
| Two current extractors, same fact kind and source-id set, different content types | Load-time `duplicate_extractor_match`. Injected past that check: `ambiguous_policy` before HTTP. Content type is not consulted. |
| Two current policies, same pre-HTTP key, different applicability-schema pins | Load-time `duplicate_policy_match`. Phase A does not choose a pin. |
| Frozen pair, observed content type not allowlisted | `content_type_not_allowlisted`. The frozen policy id is unchanged. No second extractor lookup. |
| Parsed applicability schema disagrees with the frozen pin | `schema_mismatch`. The frozen policy id is unchanged. No other pin is selected. |
| Same-source composition | `same_source_composition`. |
| Support id outside accepted Evidence | `support_mismatch`. |
| Branch with an empty citation | `support_mismatch`. |
| Branch union omits a claim support | `support_mismatch`. |
| Atom cites a support outside its branch | `support_mismatch`. |
| Atom omits a citation on a multi-source branch | `condition_provenance_ambiguous`. |
| Nested `all` / `not` | The locator `branch:<id>/all:0/not:0/atom` resolves to that one atom. |
| Two structurally different atoms | Indexes follow the support-free structural key. Swapping their support ids does not swap the locators. Stored array order is not the index. |
| Two containers that differ only by inner support ids | `atom_locator_duplicate`. They are not ordered by those ids. |
| Two structurally identical atoms with different support ids | Bijection matches each atom to one assignment. |
| Tie group with omitted support ids | `condition_provenance_ambiguous`. |
| Policy locator absent from the walked tree | `atom_locator_missing`. |
| Walked atom absent from the policy | `atom_locator_unassigned`. |
| Duplicate locator, or a non-atomic structural tie | `atom_locator_duplicate`. |
| `atomKey` or `atomLocator` on the fact | `unexpected_fields`. The policy object contains no predicate body. |
| Source bytes change after Evidence | `source_changed_since_evidence` before citation checks. |
| Mixed freshness or a stale support | `freshness_not_current` before phase A completes into retrieval. |
| Conflicting parsed values | `conflicting_value`. |
| Duplicate value without `equal_values` | `duplicate_value`. |
| Missing field or target assignment | `policy_field_unassigned`. |
| Source family or schema family disagrees with the frozen extractor | `policy_version_mismatch` before HTTP. A load-time pin disagreement is `invalid_policy_definition`. |
| Permuted support order | The same pre-HTTP key, the same locators for structurally different atoms, the same reason or the same fact. |
| Policy version change | A new pair. Provenance identity changes even when citations are copied. |
| Plain object imitating a seal | `isOfficialTruthCompositionSeal` is false. The composer returns `policy_binding_missing` and does not call acceptance. |
| `policyExecuted` or `seal` on the acceptance input | `unexpected_fields`. The pure function does not read it. |
| Human direct call | No seal required. Branched composed quality remains `condition_provenance_ambiguous`. A legacy composed success is not recorded as policy execution. |
| Explicit-primary schema-1 path | Unchanged. Null policy. One support. Atoms may omit. Acceptance behavior unchanged. Phase A is not used. |
| Composed schema-1 output at the store | `applicability_not_persistable` before transport, including a future in-memory success. |
| F8 | The foundation module does not import `regelKandidatAkzeptieren` or either store writer. No acceptance call and no store call in the tests. |

## 11. First runtime slice

Classification: `COMPOSITION_POLICY_FOUNDATION_READY_FOR_RUNTIME_SLICE`.

The missing piece is the code-owned registry and the citation checker, not a legal sentence. No source family is proven. The production registries stay empty, so the slice cannot extract a government page and cannot accept a branched composed fact.

File ownership for that one later slice:

- `lib/readiness/official-truth-composition-policy-registry.ts` — preflight, locator walk, private seal class
- `lib/readiness/official-truth-composition-policy-registry.test.ts` — the section 10 cases that do not call acceptance
- `lib/readiness/regulierungs-anwendbarkeit.ts` — export `regulierungsAusdruckStrukturSchluessel` only. The export omits `supportVersionIds` at every depth and sorts `all` / `any` operands by that support-free key. It does not return the stored array order.
- `lib/readiness/official-truth-same-request-proof-server.ts` and its test, limited to rejecting caller policy keys
- `lib/readiness/official-truth-same-request-extraction-server.ts` and its test, limited to phase A before `retrieve` and phase B without a second lookup
- `lib/readiness/official-truth-trusted-fact-extractor-registry.ts` and its test, limited to rejecting a caller `policy` object, `duplicate_extractor_match`, and reading assignments from the server-held registry

The production policy registry is `Object.freeze([])`. The production extractor registry stays `Object.freeze([])`. Composed same-request input still returns `composition_policy_unavailable` before `retrieve`. Explicit-primary behavior stays on the current path. Tests that would need two content types to disambiguate a pair must instead show that phase A returns `ambiguous_policy` without calling `retrieve`.

That slice does not edit `regelKandidatAkzeptieren`, `persistierbarenClaim`, `supabase/`, or `app/`. It does not add the autonomous composer. It does not register a source, raise `BODY_MAX`, call a provider or a model, or open a network socket from the policy module. It does not cross a Product-Owner gate. Production catalog apply, provenance retention, and F8 stay outside it.

The acceptance slice that replaces the composed blanket is a separate later task. Replacing the blanket still does not make the pure function prove policy execution. The composer that consumes the seal is a separate later task and is still not F8. Neither task is dispatched from this pull request.

## 12. Traveller context

The policy is traveller-neutral. It sees the cell the proof already bound: the full citizenship set, one credential option, residence, destination, transit, requirement type, and validity. It does not choose a citizenship, an issuing country, a document, or a residence. It does not read a passport number, an MRZ, a biometric, or a health record. A second credential option stays a second scope key. Predicate evaluation against a traveller remains the existing applicability evaluator, which this policy does not call. An unknown traveller fact stays unknown. The policy does not turn it into `not_required`.

## 13. Non-goals

This architecture does not register an extractor or a policy, encode a GOV.UK ETA outcome, pin a Common Travel Area member, import CH-01..CH-10, start CH-11, implement F8, persist a claim, add a provenance table, change Auth, RLS, or AAL, call a provider, or start the runtime slice from this pull request.

## 14. Classification

`COMPOSITION_POLICY_FOUNDATION_READY_FOR_RUNTIME_SLICE`
