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

Reusable from predicate architecture section 12, now partially live: claim `supportVersionIds` are the only citable evidence versions; a composed branch citation is a non-empty subset; the union equals the claim supports when every support jointly makes the fact; an atom cites only a subset of its branch; omission across two or more sources fails closed. The live function implements the explicit-primary half and replaces the composed half with the blanket `condition_provenance_ambiguous`. This architecture keeps the blanket until a later acceptance slice. It specifies the checks that replace it.

## 2. Authority and versioning

The only composition-policy authority is a pure code-owned immutable registry in a later server module. The production value of that registry is an empty frozen array until a later reviewed source-family slice registers one policy. This document registers none.

`policyId` is the stable family name, grammar `^otp_[a-z][a-z0-9_]{0,40}$`, already enforced by the extractor framework. `policyVersion` is a positive integer. The pair `(policyId, policyVersion)` is the identity. A published pair is not edited. The next semantic change allocates the next version and leaves the old object byte-for-byte in the registry with `current: false`.

A new version is required for any change to the match key, the citation targets, the assigned source-id sets, the relation, the role, `completeness`, `applicabilitySchema`, or `schemaFamily`. A content hash, a support version id, a retrieval time, and a `reviewPacketKey` are execution bindings. They do not select a version and they do not mutate one.

`current: true` is required for selection. A historical version stays addressable so an old provenance row can still name its pair. Selecting a non-current pair fails `policy_version_mismatch`.

The registry checker, run before any request, fails the module closed on:

- two entries with the same `(policyId, policyVersion)` — `duplicate_policy_version`;
- two `current` entries with the same match key — `duplicate_policy_match`;
- a `current` composed extractor pin whose pair is absent, or whose match key disagrees with the policy — `invalid_policy_definition`.

Zero, one, and many at execution time:

| Observed current matches for the match key | Result |
| --- | --- |
| 0 | The policy module returns `policy_not_registered`. The same-request boundary maps that to `composition_policy_unavailable` and does not open HTTP. |
| 1 | That entry is the selected policy. Execution still waits for the gates in section 6. |
| 2 or more | `ambiguous_policy`. No first-match. No HTTP. |

A caller, a model, a plugin, a request body, a stored review packet, and a research note cannot select the pair, supply assignments, or mark a version current. The same-request proof guard does not currently list `policy`, `policyId`, `policyVersion`, or `assignments` in `ZEUGEN_VERBOTEN`. Those keys pass the proof shape check and are then ignored, because extraction hard-codes `policy: null` on the explicit-primary path and never reaches extraction for composed quality. The later runtime slice adds those keys to the proof guard so they fail as `caller_authority_forbidden` before the catalog read. On the extractor entry, a non-null `policy` input fails `unexpected_fields`. Assignments are read from the registry inside the server.

The existing `OfficialTruthExtractorPolitik` object is the caller-shaped input the framework parses today. It is not the authority. It cannot represent a branch that cites two sources, and it cannot name an atom.

## 3. Match key

The match key is structural. It contains no country, no citizenship, no effect, no visa mode, and no predicate body.

```ts
type OfficialTruthCompositionMatchKey = {
  factKind: RegelFaktArt
  requirementType: OfficialRequirementType
  sourceIds: readonly string[]
  sourceFamilyId: string
  schemaFamily: string
  applicabilitySchema: 1 | null
}
```

`sourceIds` is the exact sorted set, length 2 through `REGEL_SUPPORT_MAX` (8), each id matching the existing source-id grammar. Order in the request does not change the key.

`applicabilitySchema: null` binds a legacy fact with no `schema` and no `applicability`. `applicabilitySchema: 1` binds a fact whose `schema` is 1. A policy for one of those does not match the other. `schema_mismatch` is the execution result when a selected policy's schema and the parsed fact disagree. A miss at selection time is `policy_not_registered`, mapped at the boundary as in section 2.

`sourceFamilyId` and `schemaFamily` use the existing `otf_` and `ots_` grammars. They come from the code-owned extractor definition that pins this policy, not from the request.

URL and path constraints stay on that extractor definition's `urlAllowlist`. The policy does not grow a second URL language. Before execution, every support's canonical URL must already have passed `urlErlaubt` for that definition. A URL outside the allowlist is `domain_or_path_not_allowlisted` and never becomes a fact. A URL that stays inside the allowlist does not select a different policy.

The regulatory cell stays on the proof's `rule-scope:v1:` key. The policy match does not read destination, transit, citizenship, credential option, residence, or travel date. One invocation remains one cell. A second citizenship set or a second credential option is a different scope and a different invocation.

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
  | { kind: 'atom'; branchId: string; atomKey: string }
  | { kind: 'otherwise'; branchId: string }
  | { kind: 'visa_option_field'; visaMode: Exclude<OfficialVisaMode, 'unknown'>; field: 'eligibility' | 'mandate' }
  | { kind: 'visa_option_branch'; visaMode: Exclude<OfficialVisaMode, 'unknown'>; branchId: string }
  | { kind: 'visa_option_outcome'; visaMode: Exclude<OfficialVisaMode, 'unknown'>; branchId: string; field: 'eligibility' | 'mandate' }
  | { kind: 'visa_option_atom'; visaMode: Exclude<OfficialVisaMode, 'unknown'>; branchId: string; atomKey: string }
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

`branchId` and `atomKey` match `^[a-z][a-z0-9_]{0,40}$`. `sourceIds` is a sorted unique non-empty subset of the policy's `sourceIds`. `single_source` requires exactly one id. `equal_values` requires two or more, and its role is `equal_values`.

`atomKey` is emitted by the extractor version onto the provenance row only. The schema-1 atom on the fact stays `{ op: 'atomic', predicate, supportVersionIds? }` as `regulierungs-anwendbarkeit.ts` already parses it. This architecture does not add `atomKey` to the fact. The extractor version owns the binding from `atomKey` to the predicate it emits. The generic registry stores the key, not the predicate. A later source-family slice is the first place that binding may exist, and only inside that extractor version.

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
| `applicability_list` | A `fact_field`, an `otherwise`, or an `atom` that the extractor version binds to the list side |
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

Agreement fails closed, with no fact returned, when any of these differ: the embedded branch ids and the projected policy version ids; an atom's ids and the policy atom assignment; a provenance version id and the embedded citation for that target. `support_mismatch` is the reason, except omission across two or more sources, which remains `condition_provenance_ambiguous`.

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

Policy execution runs only after all of the following are already true inside one server invocation:

1. `decideOfficialTruthSameRequestProof` returned `same_request_proof` from one catalog read, one server instant, the frozen source registry, the re-proved accepted Evidence, the rebuilt candidate, and freshness `current` on every support.
2. The grant is the role grant for `official-truth-freigeben`.
3. Fresh server-owned retrieval has run for every support, only if a current policy already matched the pre-HTTP key.
4. Each retrieval kept the proof's source id, final URL, and content hash. A drift is `support_binding_mismatch`, `source_url_changed_since_evidence`, or `source_changed_since_evidence`.
5. The code-owned extractor registry selected exactly one `current` definition for the fact kind, the exact source-id set, and the observed content types. Zero is `extractor_not_registered`. Two is `ambiguous_structure`.
6. That definition's pinned `(policyId, policyVersion)` is the one current policy from section 2, and the match keys agree.

The pre-HTTP absence check is not execution. Composed quality consults the policy registry before any socket. Zero current matches return `composition_policy_unavailable` with no retrieval. Several current matches return `ambiguous_policy` with no retrieval. Execution, which reads bytes and applies assignments, starts only after the retrieval and the extractor selection above.

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
| `policy_version_mismatch` | Pinned pair, `current` flag, or match key disagrees with the registry entry. |
| `policy_field_unassigned` | A required target or scalar path has no assignment, or the stated branch union disagrees with the recomputed union. |
| `conflicting_value` | Parsed values of one target disagree. |
| `ambiguous_structure` | Two current extractors, or a repeated source id inside an otherwise valid multi-source set. |
| `same_source_composition` | Fewer than two distinct source ids. |
| `ambiguous_policy` | New. Two current policies for one match key. |
| `policy_not_registered` | New. The policy module's name for zero matches. The same-request boundary maps it to `composition_policy_unavailable`. |
| `duplicate_value` | A source outside the assignment also produced a value for that target. |

The framework stays source-neutral. Country-specific predicates, URL pins, and atom-key-to-predicate bindings belong to a later extractor version, which this slice does not register. The generic module's tests use synthetic source ids and synthetic atom keys.

Existing reasons are reused wherever the table names them. The new names are limited to policy identity and registry cardinality, which the current enum cannot distinguish from an extractor miss or a null caller object.

## 8. Acceptance

A later composed fact still enters only through `regelKandidatAkzeptieren`. The policy module does not call it. The policy module is not a second constructor. Acceptance continues to parse `trustedRuleFact` itself, ignore `proposal`, rebuild the candidate, and bind Evidence versions to the claim support ids.

Defense in depth that stays inside `regelKandidatAkzeptieren` after a later acceptance slice replaces the composed blanket:

- quality is one of the two acceptable values;
- composed quality has at least two Evidence versions and at least two `sourceId` values, all `official_authority`, all on the same scope key;
- the fact parses only through `regelFaktLesen`;
- every embedded version id is in the claim supports;
- every branch citation is non-empty;
- every atom citation is inside its branch;
- an omitted atom citation is legal only for a one-id branch;
- the branch union equals the claim supports.

Those checks do not read the policy registry. They re-prove the generic invariants on the object they were given. A fact that skipped the policy still cannot pass with a foreign id, an empty branch, or a union that drops a support. The policy's success is not a bypass flag on the acceptance input. Adding such a flag would be `unexpected_fields`.

`condition_provenance_ambiguous` remains the live blanket for every branched composed fact. A later acceptance slice may return a successful composed claim only when the embedded citations satisfy section 4.3 and the same-request stack is holding the registry policy that assigned them. That slice is not this foundation and it is not F8. Until it exists, the direct function keeps failing branched composed facts, including the complementary citation the current test already builds.

Schema-1 unconditional and legacy composed acceptance stay as they are in this foundation. The same-request path still refuses every composed quality before HTTP, so the autonomous path cannot use the legacy acceptance success. The human fact-entry path is unchanged.

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
| Wrong policy id or version | `policy_version_mismatch`. A non-current version is the same reason. |
| Zero matching policies | Policy module `policy_not_registered`. Same-request boundary `composition_policy_unavailable` before HTTP. |
| Several matching current policies | `ambiguous_policy` before HTTP. |
| Same-source composition | `same_source_composition`. |
| Support id outside accepted Evidence | `support_mismatch`. |
| Branch with an empty citation | `support_mismatch`. |
| Branch union omits a claim support | `support_mismatch`. |
| Atom cites a support outside its branch | `support_mismatch`. |
| Atom omits a citation on a multi-source branch | `condition_provenance_ambiguous`. |
| Source bytes change after Evidence | `source_changed_since_evidence` before policy execution. |
| Mixed freshness or a stale support | `freshness_not_current` before policy execution. |
| Conflicting parsed values | `conflicting_value`. |
| Duplicate value without `equal_values` | `duplicate_value`. |
| Missing field or target assignment | `policy_field_unassigned`. |
| Source family or schema family disagrees | No match, so `policy_not_registered` at selection. An internal pin that disagrees at load is `invalid_policy_definition`. |
| Permuted support order | The same canonical match key, the same sorted citations, the same reason or the same fact. |
| Policy version change | A new pair. Provenance identity changes even when citations are copied. |
| Explicit-primary schema-1 path | Unchanged. Null policy. One support. Atoms may omit. Acceptance behavior unchanged. |
| Composed schema-1 output at the store | `applicability_not_persistable` before transport, including a future in-memory success. |
| F8 | The new module does not import `regelKandidatAkzeptieren` or either store writer. No acceptance call and no store call in the tests. |

## 11. First runtime slice

Classification: `COMPOSITION_POLICY_FOUNDATION_READY_FOR_RUNTIME_SLICE`.

The missing piece is the code-owned registry and the citation checker, not a legal sentence. No source family is proven. The production registries stay empty, so the slice cannot extract a government page and cannot accept a branched composed fact.

File ownership for that one later slice:

- `lib/readiness/official-truth-composition-policy-registry.ts`
- `lib/readiness/official-truth-composition-policy-registry.test.ts`
- `lib/readiness/official-truth-same-request-proof-server.ts` and its test, limited to rejecting caller policy keys
- `lib/readiness/official-truth-same-request-extraction-server.ts` and its test, limited to the empty-registry pre-HTTP gate
- `lib/readiness/official-truth-trusted-fact-extractor-registry.ts` and its test, limited to rejecting a caller `policy` object and to reading assignments from the code-owned registry argument that only the server passes

The production policy registry is `Object.freeze([])`. The production extractor registry stays `Object.freeze([])`. Composed same-request input still returns `composition_policy_unavailable` before `retrieve`. Explicit-primary behavior stays on the current path.

That slice does not edit `regelKandidatAkzeptieren`, `persistierbarenClaim`, `supabase/`, `app/`, or `regulierungs-anwendbarkeit.ts`. It does not register a source, raise `BODY_MAX`, call a provider or a model, or open a network socket from the policy module. It does not cross a Product-Owner gate. Production catalog apply, provenance retention, and F8 stay outside it.

The acceptance slice that replaces the composed blanket is a separate later task. It waits until this foundation is reviewed and a real policy exists. It is still not F8.

## 12. Traveller context

The policy is traveller-neutral. It sees the cell the proof already bound: the full citizenship set, one credential option, residence, destination, transit, requirement type, and validity. It does not choose a citizenship, an issuing country, a document, or a residence. It does not read a passport number, an MRZ, a biometric, or a health record. A second credential option stays a second scope key. Predicate evaluation against a traveller remains the existing applicability evaluator, which this policy does not call. An unknown traveller fact stays unknown. The policy does not turn it into `not_required`.

## 13. Non-goals

This architecture does not register an extractor or a policy, encode a GOV.UK ETA outcome, pin a Common Travel Area member, import CH-01..CH-10, start CH-11, implement F8, persist a claim, add a provenance table, change Auth, RLS, or AAL, call a provider, or start the runtime slice from this pull request.

## 14. Classification

`COMPOSITION_POLICY_FOUNDATION_READY_FOR_RUNTIME_SLICE`
