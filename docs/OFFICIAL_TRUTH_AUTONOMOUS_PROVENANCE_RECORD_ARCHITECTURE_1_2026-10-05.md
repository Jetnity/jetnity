# Official Truth autonomous provenance record architecture 1

Date: 5 October 2026
Issue: [#854](https://github.com/Jetnity/jetnity/issues/854) · Draft PR: [#855](https://github.com/Jetnity/jetnity/pull/855)
Baseline: `2f27956cc9fd4289d30f258a5ee8eeaaa60aafec`
Status: **PROPOSAL / NOT IMPLEMENTED / SEMANTIC CONTRACT ONLY / PRE-F8**

## 1. Decision and boundary

Specify a success-only, immutable receipt of one complete, deterministic, globally scoped trusted-fact production. The receipt binds the canonical fact value, regulatory cell, exact accepted support versions, fresh retrieval observations, selected executable versions and, where applicable, composition citations. It is not an accepted Rule, an Evidence-acceptance event, a permission, or proof of a database write.

The semantic contract is bounded enough for a separate persistence design to be considered. Its admission domain is deliberately **partial**: a traveller-derived scope, unsafe hash preimage, incomplete execution binding or unavailable immutable dependency produces **no receipt**. It must not be repaired by dropping a qualifier, hashing personal data, inventing a pin, or using a current mutable row as historical evidence.

Every new type, field, pin, digest domain, projection and candidate path in this document is **PROPOSAL / NOT IMPLEMENTED**. Existing names are identified as existing below. This document neither exposes a constructor nor authorizes implementing one. The [immutable task](OFFICIAL_TRUTH_AUTONOMOUS_PROVENANCE_RECORD_ARCHITECTURE_1_TASK_2026-10-05.md) controls the five-file boundary.

The receipt, its fingerprint, an authentic historical copy, an F7 witness, a composition-result digest and even byte-for-byte equality with a new computation authorize none of: extraction, Evidence acceptance, Rule acceptance, F8, store writes, or provider activation. A checksum provides identity, not origin or authority. A malicious party can compute a perfectly valid checksum of invented data. Trusted production is established by server custody of the actual live execution, never by parsing the receipt.

## 2. Live evidence and corrections to historical prose

All code observations refer to the baseline above. Hosted database statements in #751 are reported continuity, not independently queried here.

| Existing boundary | Observed behavior / implication |
| --- | --- |
| `official-truth-same-request-proof-server.ts` | The live loader performs authority, server reference time and one catalog read. The graph holds frozen accepted Evidence, candidate, scope, review identity and narrow supports. It retains an untrusted candidate proposal. Proof success alone is not fresh server-origin extraction. |
| `official-truth-server-held-source-registry.ts` and `official-truth-rule-review-packet.ts` | The review chain reconstructs accepted Evidence in memory from submitted review material against a server registry and clock. These are accepted semantic values, not evidence that rows were written or fetched from an accepted-Evidence store. |
| `official-truth-same-request-extraction-server.ts` | Rebinds candidate/Evidence scopes, reuses the exact frozen catalog, fetches through the server-owned retrieval boundary and requires the fresh identity, MIME, final URL and content hash to equal each proof support before extraction. No second external catalog read. |
| `official-truth-trusted-fact-extractor-registry.ts` | One canonical extraction pipeline calls `regelFaktKanonischLesen`. Explicit-primary selection uses current definitions, fact kind, exact content-item pairs, null policy and observed MIME; representation and URL checks follow. Production registry is empty. |
| `official-truth-composition-policy-registry.ts` | Current equivalent of a composition server: phase A freezes the extractor/policy before HTTP; phase B validates that pair, source-attributed observations, assignments and citations. A private class seal retains the exact frozen fact reference. Production policy registry is empty. |
| Composition integration | The outer success is only `{status: 'same_request_composition_bound', seal}`. Phase B's provenance and the retained proof/retrieval context are not exposed by that outer result. `officialTruthCompositionSealView` exposes fact, policy pair and support IDs, not the whole missing execution context. A receipt cannot reconstruct those fields from the seal or a mutable registry later. |
| `official-truth-content-identity.ts` | Current Evidence identity is schema 2, lookup `evidence-key:v3:`, version `ev2_` plus 32 hex digits. Review identity is `review-packet:v3:`. A profile ID/version names the code-owned verifier; there is no separate live verifier-ID field. |
| `rule-claims.ts` | `RegelScope` is source-neutral but includes the full citizenship set, one document option, residence and possibly a travel date. The scope key binds all of them. The canonical fact reader and sole acceptance constructor remain distinct. Acceptance ignores `kandidat.proposal` and parses separate `trustedRuleFact`. |
| `official-truth-store-server.ts` | Every schema-1 applicability fact remains non-persistable. Composed branched facts also remain blocked by current acceptance provenance rules. A successful receipt would remove neither restriction. |

Historical #772/#774/#777/#781/#787/#799/#801/#803 reports and the [acceptance trust-boundary architecture](OFFICIAL_TRUTH_RULE_ACCEPTANCE_TRUST_BOUNDARY_1_ARCHITECTURE_2026-10-02.md) explain the stages. Their older v1/v2 identifiers and distinct-`sourceId` composition wording are not current v2 content-identity rules: the live support unit is `(sourceId, contentItemId)`. Two pages under the same authority can be distinct items; two representations of one item do not become two composition supports. #294 supplies the product truth boundary; #741 supplies future F8 context only.

## 3. Global scope and privacy admission

A parsed `RegelScope` is **not automatically safe global data**. For example, a cell containing a particular person's dual citizenship, selected passport, residence and actual departure date is a traveller projection even without their name. Its `rule-scope:v1:` key, Evidence version IDs and review key can inherit that association. Hashing it does not anonymize it.

Define the partial projection `globalCellProjectionV1`:

1. Start from a reviewed, immutable, server-held **global cell definition**, not a request body or a traveller/account/trip lookup. Its non-personal definition is exactly `{id, version, scope}`. `scope` is the canonical existing `RegelScope`; `id` is a public regulatory-corpus identifier, not an execution, user or session identifier. The definition is independently selected/authorized server material, not a definition minted from a caller value. Its digest covers exactly those three fields with the serialization in section 5.
2. Compare the exact canonical scope from that definition with the scope rebound from every accepted Evidence version and the proof candidate. Require equality of values and the existing `regelScopeAusEvidenceScope` key. No field is removed, generalized, replaced or defaulted after extraction.
3. Every retained scope field must describe a public legal category: destination/transit country; a legally relevant citizenship set; one document-type/issuing-country/explicit citizenship-link category; an independently applicable residence-country category; requirement type; and, if present, a **globally defined regulatory evaluation date**. A `travel_date` value may only be such a predeclared global cell date, never an individual's itinerary date. The receipt attests only that exact dated cell, not an inferred validity interval. Missing/not-applicable is never substituted for a relevant date or residence.
4. If the origin of any value is traveller-specific, or its independence cannot be established, the projection is undefined and there is no receipt. The caller cannot turn a copied personal cell into global data by attaching an existing public definition ID. Any later global research must start a separate trusted global chain with independently sourced Evidence; the old scope key, review key and Evidence IDs cannot be relabelled.

Thus the safe projection is identity-preserving on independently defined global cells and rejects the rest. It is not a lossy anonymization function. No new RuleScope key algorithm or parallel legal model is introduced. #787's exact citizenship/credential/date invariants are preserved. A second credential option is still another cell, not a guessed default or a generated cross product.

**Transitive privacy admission** applies before computing any receipt digest. Check the preimages of the scope key, Evidence lookup/version IDs, review key, fact hash, source-content hash and every referenced artifact. The receipt path requires `kandidat.proposal === null` in the already built proof and server-constructed autonomous metadata; it does not strip a non-null proposal from an existing packet and keep its key. `review-packet:v3:` includes the proposal, so merely omitting it from JSON would be insufficient. Model/plugin output must not enter this chain even as a hidden review-hash preimage.

Only a qualified public, non-personal regulatory representation can supply a retained source-content hash. Public availability alone is insufficient: a personal case response, named traveller record, tokenized URL or body whose non-personal nature is unproven is ineligible, including when only its hash would be kept. A future source qualification must establish that property for the complete hashed representation. It cannot hash a sanitized excerpt while claiming the existing full-response identity. Any independently qualified alternative representation requires its own reviewed identity, outside this slice.

**Server custody is an origin requirement, not an object-shape test.** The current review graph reconstructs accepted values from submitted envelopes; that alone does not establish trusted origin of the original `retrievedAt`, validity metadata, requested scope, fact kind or quality. Fresh byte/hash equality does not retroactively authenticate those submitted metadata. Before receipt production, those values and the exact accepted version set must already come from an independently trusted server-held global chain, with the original observation/validity provenance verified there. Reconstructing a caller-chosen version ID on the server is insufficient. The receipt producer performs no Evidence acceptance and cannot upgrade that reconstruction into authority. The absence of this upstream custody is a hard no-receipt condition, not an invitation to add a flag. This stricter autonomous origin requirement is not claimed as implemented in the current review loader.

No user/traveller/trip/document/passport number, MRZ, birth date, personal residence history, IP, Cookie, Session ID, prompt, conversation, traveller free text, raw government body, screenshot, secret, token or hash of those values is admitted. No traveller-context or `reg-eval-ctx:v1` fingerprint. No correlation key to personal logs. This does not decide the privacy/retention policy for any later system.

## 4. Exact proposed semantic type

All properties shown are required. Only explicit `| null` alternatives are nullable. Unknown properties, absent required properties and unresolved pins fail closed. This is a semantic type, **not a persistence schema**, SQL design, JSONB payload or implemented TypeScript export.

```ts
type Pin = { id: string; version: number; digest: string }
// Positive safe-integer version; registered non-personal identifier;
// digest = full lowercase SHA-256 of the immutable artifact bytes.
// Each artifact declares its byte/semantic contract; no "latest" alias.

type SupportReceipt = {
  versionId: string                         // existing ev2_ identity
  identitySchema: 2
  binding: ContentIdentityBinding           // exact seven-field live tuple
  canonicalFinalUrl: string                 // accepted AND freshly observed
  contentType: string                       // accepted AND freshly observed MIME
  sourceContentHash: string                 // accepted AND freshly recomputed
  acceptedRetrievedAt: string               // original Evidence observation time
  validFrom: string | null                  // accepted validity, not retrieval time
  validUntil: string | null
  freshRetrieval: {
    requestUrl: string                      // actual initial request, not a guess
    completedAt: string                     // server retrieval completion time
  }
}

type CitationReceipt = {
  target: OfficialTruthCompositionCitationTarget
  supportVersionIds: readonly string[]      // exact nonempty support subset
}

type CompositionReceipt = {
  policyId: string
  policyVersion: number
  definition: Pin
  registrySnapshot: Pin
  preHttpSelectionKey: string               // definition in section 7
  assignments: readonly OfficialTruthCompositionAssignment[]
  resultIdentity: string                    // section 8; NOT the private seal
}

type AutonomousProvenancePayloadV1 = {
  schema: 'official-truth-autonomous-provenance'
  schemaVersion: 1
  canonicalization: 'ot-provenance-json-v1'
  outcome: 'trusted_fact_produced'
  globalCell: {
    definition: Pin                         // section 3's global definition
    scope: RegelScope                       // exact non-personal canonical cell
    ruleScopeKey: string                    // existing rule-scope:v1: algorithm
  }
  candidate: {
    factKind: RegelFaktArt
    requirementType: OfficialRequirementType
    factSchema: Pin                         // canonical parser/shape contract
    applicabilitySchema: Pin | null         // null only for legacy fact shape
    fact: RegelFakt                         // canonical output, never proposal
    factHash: string
    candidateBinding: string
  }
  evidenceQuality:
    | 'explicit_primary_statement'
    | 'composed_from_multiple_primary_sources'
  extractor: {
    extractorId: string
    extractorVersion: number
    sourceFamilyId: string
    schemaFamily: string
    definition: Pin
    registrySnapshot: Pin
    outputContract: Pin
    selectionKey: string                    // explicit or composed path, section 7
  }
  policy: CompositionReceipt | null
  supports: readonly SupportReceipt[]
  citations: readonly CitationReceipt[]
  proof: {
    contract: Pin                          // actual proof/retrieval chain contract
    reviewPacketKey: string                // existing review-packet:v3:
    proofIdentity: string
    catalogSnapshot: Pin                   // same frozen graph, not a second read
    serverReferenceTime: string
    freshnessContract: Pin                  // versioned existing freshness semantics
    evidenceFreshnessAtReference: 'current'
  }
}

type AutonomousProvenanceReceiptV1 = {
  payload: AutonomousProvenancePayloadV1
  recordFingerprint: string
}
```

`ContentIdentityBinding` means exactly `sourceId`, `contentItemId`, `contentItemVersion`, `representationId`, `representationVersion`, `identityProfileId`, `identityProfileVersion`. It does not carry an independently caller-selectable verifier. The immutable profile artifact binds the executable verifier for that pair. If a future implementation introduces distinct verifier identity, it must version this contract; it cannot silently default the new identity to a mutable function.

There is no separate top-level support-ID list: derive it from `supports[].versionId` in canonical order. Source IDs, content-item pairs, representation pins and observed MIME sets are likewise derived. `schemaFamily` belongs to the selected extractor and applies to the entire candidate. `factSchema` pins both legal fact shape and canonical parser semantics; `applicabilitySchema` pins the version actually parsed, never a value chosen from incoming JSON. Applicability-bearing schema 1, including unconditional facts, requires a non-null schema-1 pin. Legacy shape requires null. Schema 2 from #851 is not implemented or imported by this document and is not an implicit alias.

No local UUID is needed. The deterministic fingerprint is sufficient for semantic record identity. Two identical payloads intentionally identify the same receipt; this contract does not count executions. A future storage locator, if needed, is an external opaque storage concern and cannot change meaning, prove freshness, or introduce a session/request ID. No receipt `createdAt` substitutes for the bound server times.

Existing ID, URL, MIME, timestamp, scope, fact, tree and support bounds remain mandatory. New `Pin.id` values use registered ASCII `[a-z][a-z0-9._-]{0,127}` names; versions are positive safe integers; pin digests are exactly 64 lowercase hex digits. A pin resolves by the complete triple, never by ID alone. New producer schemas must reject oversized or cyclic artifact closure and enforce the finite bounds of each pinned artifact contract; no unbounded free-text/map extension is allowed. This contract does not raise any retrieval or legal-fact limits.

## 5. Canonical serialization and fingerprints

`C(value)` is UTF-8 of the following closed serialization, named `ot-provenance-json-v1`:

- Validate the exact schema first. Plain own enumerable data properties only; no prototypes with behavior, accessors, symbols, functions, cycles, sparse arrays, undefined, NaN, infinity or BigInt. Reject duplicate JSON object member names at decoding, before a normal JSON parser can discard them.
- Keys are emitted in ascending ECMAScript UTF-16 code-unit order with no locale collation. Emit the JSON tokens directly in that order, rather than relying on object insertion order for numeric-looking keys.
- Strings use ECMAScript JSON string escaping, with no whitespace outside strings, BOM, trailing newline or slash escaping. Reject unpaired UTF-16 surrogates. Do not trim, case-fold, normalize Unicode or reinterpret URLs/text after canonical domain parsing.
- Numbers are finite safe integers, decimal, no exponent, no plus sign or leading zero. Negative zero is rejected. Existing fact/temporal domains inspected here use bounded integer quantities; a future fractional fact requires an explicitly versioned contract, not rounding.
- Null and booleans are literal JSON. Every nullable field is emitted even when null. Optional fields inside an existing fact are kept exactly as the pinned canonical fact parser emits them; no second fact normalizer invents nulls.
- Normalize only the sets listed below. Other arrays, including canonical fact arrays, preserve their parser-emitted order. Do not use a receipt serializer to rewrite predicate trees or to replace the current atom-locator algorithm.

Set ordering and rejection:

| Collection | Canonical order / duplicate rule |
| --- | --- |
| Supports | Ascending `versionId`; 1 for explicit-primary, 2–8 for composition. Duplicate version or duplicate `(sourceId, contentItemId)` is invalid, including two representations of one item. |
| Derived support-ID sets and citation support sets | Ascending ID, no duplicates, nonempty. Foreign IDs fail. |
| Content-item and representation sets used in keys | Lexicographic tuple order by source/item, then versioned representation tuple; exact duplicate fails. |
| Assignments | Ascending `C(target)`; unique target. Sort each `contentItemRefs` by source/item; no duplicate item. Preserve relation and role. |
| Citations | Ascending `C(target)`; one row per target with a sorted exact support subset. Duplicate target is invalid, not merged. |
| Scope citizenship | Use the existing canonical scope parser/key rules; no receipt-specific citizenship choice. |
| Registry artifacts | Exact immutable artifact contract declares ordering; snapshot digests never hash functions or a mutable object graph using `toString`. |

Define `H(domain, value) = domain + ':' + lowercaseHex(SHA256(UTF8(domain + '\n') || C(value)))`. The domain string is ASCII, and the separator is exactly one LF byte, not the two characters backslash and n. Full 256-bit digests are retained. These new digests do not replace existing `ev2_`, scope or review-key algorithms.

Let `S` be the ordered support version IDs. Then:

```text
factHash = H('ot-fact-v1', {
  factSchema, applicabilitySchema, factKind, requirementType, fact
})

candidateBinding = H('ot-candidate-v1', {
  scope: globalCell.scope, ruleScopeKey: globalCell.ruleScopeKey,
  factKind, requirementType, schemaFamily: extractor.schemaFamily,
  factSchema, applicabilitySchema, factHash, evidenceQuality,
  supportVersionIds: S
})

proofIdentity = H('ot-proof-v1', {
  contract: proof.contract, reviewPacketKey: proof.reviewPacketKey,
  ruleScopeKey: globalCell.ruleScopeKey, factKind,
  supportVersionIds: S, serverReferenceTime: proof.serverReferenceTime,
  catalogSnapshot: proof.catalogSnapshot,
  freshnessContract: proof.freshnessContract,
  evidenceFreshnessAtReference: 'current'
})

recordFingerprint = H('ot-provenance-v1', payload)
```

The formulas use the corresponding qualified payload fields, not independent variables supplied by a caller. Validate every stored derived digest by recomputation. `recordFingerprint` is outside the hashed payload; no self-reference. `factHash` deliberately does not include an untrusted candidate proposal. The candidate binding adds scope and exact supports, since equal fact bytes can belong to different cells or executions. Different keys with unequal retained bytes are always corruption, never deduplication; a digest collision or version-ID collision fails closed.

Compatibility is exact-version only. New field meaning, null semantics, canonicalization, key preimage, locator meaning, hash algorithm or number domain requires a new receipt schema/canonicalization version. Unknown versions are unreadable, not interpreted using the newest parser. Historical fingerprints never get silently recomputed under a new version.

## 6. Accepted Evidence and fresh retrieval: minimum duplication

The existing `contentEvidenceVersionV2` binds: the seven identity fields, `identitySchema=2`, the lookup key, final canonical URL, MIME, content hash, original `retrievedAt`, `validFrom` and `validUntil`. Its version ID is a truncated digest. The lookup key binds the regulatory cell and source/item/representation reference. It does **not** prove that the Evidence was stored, independently retrieve the page, identify an extractor, carry claim-level evidence quality, or bind the later fresh retrieval completion time. It does not bind display names, extraction notes or acceptance lifecycle flags.

Keep the compact scalar preimage in each support despite the version ID: it enables historical audit without trusting mutable joins, including an independently checkable full receipt digest rather than only a truncated Evidence ID. Reconstruct the source-bearing Evidence scope as `{...globalCell.scope, sourceId: binding.sourceId}`; derive the existing lookup key from it and the representation reference. Reconstruct the identity above from that lookup and the retained values and require the existing version ID to match. Do not persist a second copy of the scope or lookup key per support.

`sourceContentHash`, final URL, identity and MIME are stored once because receipt eligibility requires exact equality between accepted support and newly observed retrieval. Their common value is not an assertion that old retrieval time equals new retrieval time. Store **both** `acceptedRetrievedAt` and `freshRetrieval.completedAt`. If any common value differs, no receipt exists; do not overwrite the accepted value with the fresh one. The changed content must be handled in a separate Evidence lifecycle before a new successful chain.

Use the existing `evidenceQuellenFingerprint`: complete bounded decoded UTF-8 snapshot, CRLF/CR normalized to LF, SHA-256. This is not a compressed-wire hash, not a DOM/excerpt hash, not an HTTP ETag and not a legal meaning hash. Preserve its exact algorithm through the proof contract pin. No raw body is retained in the receipt.

`freshRetrieval.requestUrl` is the actual initial URL chosen in the same-request loop from the exact representation's approved request set. A final-only URL is not automatically request permission. The current outer retrieval projection omits that initial URL: a future internal receipt hook must capture it at selection, not reconstruct it later using `requestUrls[0]`. `canonicalFinalUrl` is the final server-observed URL already equal to the accepted URL. Preserve approved query strings exactly; reject sensitive or token-bearing URLs instead of removing the query and changing identity. URL fragments, raw redirect chains, headers, DNS/IP addresses and HTTP bodies are excluded.

Omit Evidence `previousVersionId`, display publisher/authority names, extraction note, duplicate source lists and lifecycle strings. Lifecycle acceptance is a prerequisite of the trusted producer, not a caller-controlled receipt field. Read-only historical audit of the required catalog/definition closure is addressed in section 9. Quality is kept **once at candidate/receipt level**; current `EvidenceVersion` has no `evidenceQuality` field to copy.

## 7. Extractor and registry binding

The exact `extractorId`, `extractorVersion`, `sourceFamilyId` and `schemaFamily` come from the definition that actually executed. The output contract and fact/applicability pins are immutable code-owned contracts for that version, checked against actual canonical output. They are currently missing as explicit first-class output fields; a future slice must supply the pins from executable authority, not infer them from a label, successful parse or latest Git commit.

`extractor.definition` identifies the exact selected immutable semantic descriptor and executable implementation closure, including matcher/extractor behavior and dependencies. Its ID/version must equal the explicit extractor pair. `extractor.registrySnapshot` identifies the immutable eligible-definition manifest used for this execution, including which entries were current. `current` is snapshot eligibility, not a mutable field of an old semantic definition. Changed behavior under an existing pair is invalid; allocate a new version. Snapshot changes can mark an older definition inactive without editing its historical definition bytes.

A repository Git commit SHA is **operations metadata**, excluded from the receipt. A repository commit includes unrelated work and is neither a schema version nor an extractor identity. The immutable implementation artifact behind a semantic pin may record reviewed source/dependency digests to recover exact behavior. A deployment/build/commit label is never an alternative to those semantic pins. Do not hash JavaScript function stringification as implementation identity.

The proposed selection digest has an exact preimage derived from trusted values:

```text
explicitSelection = {
  path: 'explicit_post_retrieval', selectorContract: proof.contract,
  registrySnapshot: extractor.registrySnapshot,
  factKind, requirementType, evidenceQuality: 'explicit_primary_statement',
  contentItemRefs: exact sorted support item pairs,
  representations: exact sorted support identity bindings,
  canonicalFinalUrls: final URLs ordered by support versionId,
  observedContentTypes: sorted distinct support MIME values,
  policy: null
}
extractor.selectionKey = H('ot-extractor-selection-v1', explicitSelection)

composedSelection = {
  path: 'composed_pre_http', selectorContract: proof.contract,
  extractorRegistrySnapshot: extractor.registrySnapshot,
  policyRegistrySnapshot: policy.registrySnapshot,
  factKind, requirementType,
  contentItemRefs: exact sorted support item pairs,
  representations: exact sorted support identity bindings,
  canonicalFinalUrls: proof-support final URLs ordered by support versionId,
  sourceFamilyId: extractor.sourceFamilyId,
  schemaFamily: extractor.schemaFamily
}
policy.preHttpSelectionKey = H('ot-composition-selection-v1', composedSelection)
extractor.selectionKey = policy.preHttpSelectionKey  // composed case only
```

These are proposed audit keys, not newly claimed existing selectors. They bind the full selector/check context: primary selection observes MIME; composed phase A does not. Source/schema families in the composed tuple are read from the unique code-owned definition, not from a response or candidate. Neither applicability schema, output value nor MIME can break a pre-HTTP policy tie. The policy pair in that selected extractor must identify the exact selected policy. Phase B cannot reselect after a mismatch. The registry snapshot retains the evidence needed to audit uniqueness; a digest of only the winning ID would not do that.

## 8. Composition and field/branch/atom provenance

Explicit-primary means exactly one support, `policy: null`, and the actual extractor's null policy pair. A policy object with null IDs, an omitted policy field, empty object or invented implicit policy is invalid. Use `citations` also for explicit-primary: cover every required legal slot in the canonical fact using the same target vocabulary, all to the one support. Canonical branch citations and explicit/legally permitted inherited atomic citations must agree. This is a future structural receipt projection, not a second semantic parser or evidence that a composition policy ran.

For composition, require 2–8 distinct content-item pairs, one accepted version per item, exact support set equality throughout proof/extraction/policy/citations, a unique frozen phase-A pair, successful phase-B observation and citation checks, and the actual internal seal for the exact fact object. Two items under one source may participate; one item in two locales may not satisfy cardinality. No caller `policyExecuted` flag can substitute for execution.

Copy assignments from the frozen policy, never from incoming JSON. Reuse the live `OfficialTruthCompositionAssignment` shapes, `single_content_item | equal_values` relations and role vocabulary. The assignments' exact item sets must project one-to-one to retained support versions. Policy definition ID/version, source/schema family, requirement/fact kind, applicability pin and `joint_complete_fact` must agree with the executed pair and output.

`citations` uses the current closed target union: fact field; branch; branch outcome; atom; otherwise; visa-option field/branch/outcome/atom/otherwise. It contains no raw prose, source snippet, predicate replacement or model rationale. For each target, retain exactly the version IDs emitted by the verified provenance rows. Source/content/representation/profile identity is obtained from the retained support entries, never by a mutable Source-ID join. Recompute the existing citation key from the target for comparison; do not duplicate it as another authoritative input.

Every required legal field, branch outcome and atom must be covered; every assignment and citation must name an actual required target. Nonempty branch citations must union to the claim support set. Atomic citations must be within their branch; omitted citations may inherit only where the existing contract allows a single unambiguous support. `otherwise` requires its own explicit citation and does not synthesize the negation of omitted law. Locator traversal stays on the live support-free structural keys, including `all/any/not` and the tie-group bijection. No locator is inserted into the fact; arbitrary array index or a support-ID sort cannot stand in for the live locator rules.

For `equal_values`, phase B's source-attributed observations must actually include all assigned items and equal canonical values. Receipt construction may consume that checked result in memory, but does not retain raw observation strings or repeat the parser. A citations-only JSON payload does not prove that equality was checked.

```text
policy.resultIdentity = H('ot-composition-result-v1', {
  candidateBinding, factHash,
  extractorDefinition: extractor.definition,
  extractorRegistrySnapshot: extractor.registrySnapshot,
  outputContract: extractor.outputContract,
  policyDefinition: policy.definition,
  policyRegistrySnapshot: policy.registrySnapshot,
  preHttpSelectionKey: policy.preHttpSelectionKey,
  assignments: policy.assignments,
  supportVersionIds: S, citations
})
```

This durable **value identity** is not serialization of the private seal or an execution capability. An imported receipt cannot recreate `instanceof` identity. The existing `officialTruthCompositionProvenanceIdentity` binds extractor/policy/citations but not all this context or the fact itself; it is therefore insufficient as the proposed result identity. Its output is not silently treated as this new digest. The complete canonical fact already binds schema-1 applicability and embedded support IDs; no traveller-evaluation fingerprint is needed. A separately useful `rule-applicability:v1` audit value can be derived under its pinned historical algorithm, not used instead of the fact/policy binding.

## 9. Immutable dependency closure and audit limits

The receipt copies the compact execution-specific support scalars and candidate value. It references larger **non-personal immutable artifacts** by `Pin` to avoid copying whole registries and executable definitions into every receipt. This is an interface requirement, not permission to persist those artifacts now.

| Artifact | Required immutable content |
| --- | --- |
| Global cell definition | Exactly the public `{id, version, scope}` definition from section 3; provenance of its server-owned global selection must be established by the producer. |
| Proof/catalog snapshot | The one actual frozen authority/content catalog: sources, source classes and exact host/domain restrictions, blocked domains, complete item descriptors with external-content/publisher/authority pins, complete representation descriptors with ordered request URLs/final URL/media/locale/schema, and profile availability pins. No user session or executable function. Preserve the actual request-URL order because it affects initial selection. |
| Identity profile artifacts | Exact ID/version and immutable verifier implementation contract/closure, reachable from the catalog pins. Profile availability and inert catalog pins are distinct from executable verifier authority. |
| Extractor/policy registry snapshots | Complete validated selection manifests, current eligibility at execution, exact immutable definition references, not just successful match. Exclude function objects and operational secrets. |
| Selected extractor / policy / output / fact / applicability / proof / freshness artifacts | Immutable semantic and executable contracts, their canonical byte contracts and transitive dependency pins. No reassignment of an existing ID/version to new bytes. |

A pin digest alone cannot reconstruct its artifact. A future persistence design must make this closed dependency set resolvable by digest without following current rows, `main`, `latest`, current registry state or display names. How and for how long is **not decided here**. If an artifact is missing or its bytes mismatch, historical audit reports `dependency_unavailable` or integrity failure; it must not report a proven deterministic path from the receipt alone. Artifact unavailability cannot authorize a fallback, and no raw review/page retention is implied.

The catalog snapshot has no existing durable ID. The future producer must derive its immutable manifest from the graph it actually used, under a defined artifact contract, while it still holds it. It may not perform a second catalog read and label the result as the first. The same rule applies to phase-A selection manifests. Snapshot identities are checksums of global regulatory data only, not request identifiers.

## 10. Same-request proof and clocks

Retain the existing `reviewPacketKey` only after section 3's preimage checks and same-request reproof. Its v3 shape binds review material, not the newly produced trusted fact; `candidateBinding` supplies the missing fact binding. It is possible for two different trusted extractor versions to start with the same proposal-null review packet. Their resulting receipts must still differ through extractor/output/fact bindings.

F7's existing nine-field witness is an ephemeral projection. Do not add a raw witness object or auth/session identity to this receipt. The receipt already contains its review key, rule scope key, fact kind, support IDs and reference time. `evidenceFreshnessAtReference` records the historical `current` verdict. Successful construction requires the actual live proof's existing authorized role/capability checks; their constant echoes are not additional receipt authority and are not stored as a permission. `proofIdentity` binds the retained historical projection and snapshot, not a bearer.

Time meanings must remain separate:

- `acceptedRetrievedAt` is the original observation whose Evidence ID is re-proven. The existing review chain rejects an observation from the future relative to `serverReferenceTime`; its accepted validity window and the existing `officialFrische` result must be current at that reference.
- `serverReferenceTime` is the existing proof's one server clock capture before catalog/retrieval, not a caller clock, legal effective date or build time.
- `freshRetrieval.completedAt` is the server time after the full fresh response and identity verification. It will normally be **later than** the proof reference. Do not require it to be earlier than the reference or substitute it into the historical Evidence ID. Require it to come from the actual invocation and not precede the reference; clock reversal or missing completion time means no receipt.
- The receipt records completed fetches and equality to the accepted content. It does **not** claim that the accepted validity/freshness verdict was re-evaluated at completion or at a later acceptance time. A long-running request, validity expiry during retrieval, clock skew and time-of-acceptance eligibility remain concerns for a separately designed F8 boundary. A stored `current` is never current-time authority.

The existing freshness ceiling is bound by `freshnessContract`; this slice introduces no TTL or numeric lifetime. Freshness and retention are different concepts. Timestamp ordering alone cannot prove same-request execution; only the retained private execution chain can supply the observations to the producer. A historical receipt with recent-looking times is still not reusable proof.

## 11. Same-object/value invariant through a later acceptance boundary

Define `K` as the deep-frozen proof candidate (candidate/pending, proposal null), `F` as the exact canonical trusted extractor output, `E` as the exact accepted Evidence set and `R` as the frozen proof registry. These are server-held values of the same execution. The receipt's fact is a detached immutable **value projection** of `F`; receipt bytes never become the source of `F`.

For primary production, retain the actual successful material's canonical `trustedRuleFact` reference. For composition, retain the actual private seal and use precisely `officialTruthCompositionSealView(seal).fact`; do not clone/reparse it and claim the clone is the sealed object. A future authorized consumer would have to prove these necessary invariants:

1. Its candidate remains `K` or a canonical value exactly equal to K's scope/key/kind/quality/support set with proposal null. It must not substitute a caller candidate or a newer same-scope candidate.
2. Its `trustedRuleFact === F` in the private execution; for composition also strict identity with the seal view's fact. Recompute `factHash` and `candidateBinding` from those live values and require equality with the receipt. Hash equality supplements custody and byte equality; it never replaces them.
3. Every support remains the exact version in `E`, with the global scope rebind equal to `globalCell.ruleScopeKey`; registry custody remains `R`. Re-reading current rows is not equal custody.
4. If a separately authorized call ever happens, the only canonical constructor remains `regelKandidatAkzeptieren({kandidat: K, trustedRuleFact: F, evidenceVersions: E, registry: R})`. Its returned claim's fact can be a newly parsed object, but its canonical value/hash, scope, quality and support set must equal the bound candidate. No receipt, seal or policy field is added to that constructor's input.

These are **data identity requirements**, not the design of an automatic approval policy or authorization to make the call. The current composed-branch and schema-1 store guards remain in place. No accepted output, Rule ID, write status or acceptance timestamp is included in a pre-acceptance receipt. No later process may append `accepted=true` to the existing receipt.

## 12. Field trust source and privacy classification

G = public global regulatory semantics; C = non-personal immutable code/catalog identity; O = minimal global execution observation. All are allowed only after transitive admission; none denotes an individual. A hash inherits the classification of its entire preimage. No unclassified extension fields are allowed.

| Exact field group | Trusted source | Class / minimization |
| --- | --- | --- |
| `schema`, `schemaVersion`, `canonicalization`, `outcome` | Fixed producer contract | C; constants, not caller status. |
| `globalCell.definition` (`id/version/digest`) | Reviewed immutable global definition | G/C; public corpus identity, no request-derived ID. |
| `globalCell.scope`, `ruleScopeKey` | Existing canonical parser over independently global proof/Evidence cell, rebound exactly | G; reject personal origin before retaining value or key. |
| `candidate.factKind`, `requirementType` | Proof and canonical output, checked against selected definition | G; existing closed taxonomy. |
| `candidate.factSchema`, `applicabilitySchema` | Executed code-owned parser/schema contracts | C; explicit null only for legacy. |
| `candidate.fact`, `factHash`, `candidateBinding` | Canonical deterministic `F`, not proposal; specified hash functions | G/C; no extra legal prose or traveller evaluation. |
| `evidenceQuality` | Proof/candidate quality rechecked against actual primary/composed execution | G; not a model confidence or Evidence-row field. |
| All `extractor` fields and its pins | The selected executed definition and frozen selection manifest | C; exact versions; no caller registry, build label or function serialization. |
| `policy` and all its pins/keys | Null on primary; actual frozen phase-A/B pair on composition | C; no implicit policy or capability. |
| `policy.assignments`, `citations[].target`, `citations[].supportVersionIds` | Frozen policy plus checked canonical output and verified provenance | G/C; bounded structural targets only, exact referenced supports. |
| `policy.resultIdentity` | Specified digest over actual checked result context | C/G; value checksum, never a serialized seal. |
| `supports[].versionId`, `identitySchema`, `binding.*` | Re-proven accepted Evidence plus same-request identity verifier equality | G/C; no hashed personal Evidence keys. |
| `supports[].canonicalFinalUrl`, `contentType`, `sourceContentHash` | Accepted identity and full fresh server retrieval, exact equality | G/O; qualified non-personal representation only; no bodies/headers/tokens. |
| `supports[].acceptedRetrievedAt`, `validFrom`, `validUntil` | Exact accepted version preimage | O/G; original observation and legal windows kept distinct. |
| `supports[].freshRetrieval.requestUrl`, `completedAt` | Actual server request selection and completion clock | G/O; no caller URL/time, redirect chain or client metadata. |
| `proof.contract`, `catalogSnapshot`, `freshnessContract` | Actual trusted invocation and its exact frozen immutable manifests | C; no second read, user identity or auth token. |
| `proof.reviewPacketKey` | Rebuilt v3 fingerprint with already-null proposal and globally safe preimages | G/C; raw packet and model output excluded. |
| `proof.serverReferenceTime`, `evidenceFreshnessAtReference` | Existing proof clock and freshness decision | O; historical statement, no future authority. |
| `proof.proofIdentity`, `recordFingerprint` | Specified deterministic functions of admitted data | C/G/O; checksums only, no secret signing key or bearer. |

The author session/model/effort in delivery documents are workflow evidence for this documentation slice. They are **not fields of a regulatory receipt**.

## 13. Worked semantic examples

These are hypothetical complete-production traces to explain bindings, not fixture registrations, real Evidence, legal advice, computed digest test vectors or executed code. Symbols such as `E_A`, `H_A`, `P_A` denote valid exact server-held IDs/hashes/pins satisfying the contracts above; they are not literal accepted serialized values. Common receipt constants are exactly those in section 4. Every pin must resolve to immutable bytes before an implementation could construct either receipt.

### Explicit-primary

A pre-reviewed global corpus definition `G1` has one canonical passport-validity cell, no personal provenance and a public legal category. Its exact canonical scope is:

```json
{
  "destinationCountryCode": "NZ",
  "transitCountryCode": null,
  "citizenship": {"mode": "required", "countryCodes": ["CH"]},
  "credentialOption": {
    "mode": "option", "documentType": "passport",
    "issuingCountryCode": "CH", "relatedCitizenshipCountryCode": "CH"
  },
  "residence": {"mode": "not_applicable"},
  "requirementType": "passport_validity",
  "validity": {"mode": "not_applicable"}
}
```

This illustrative scope makes no assertion about actual New Zealand law or an ordinary-passport class absent from that scope type. Assume one qualified synthetic official content item `example-authority / example-passport-rule`, item v1, representation `text` v1, profile `example-public-rule` v1. All its URLs are fixed non-personal public document URLs under `https://authority.example/`; they are placeholders and were not fetched. Accepted version `E_A` has original retrieval `2026-10-05T10:00:00.000Z`, null validity bounds and full content hash `H_A`. The trusted reference is `10:01:00.000Z`; actual request completion is `10:01:00.100Z` on that date, with the same identity/MIME/final URL/hash.

Assume a hypothetical reviewed `otx_example_passport` v1 / `otf_example_rules` / `ots_example_text` produces the canonical value `{"kind":"passport_validity","semantics":"valid_on_entry","duration":null}`. Its fact-schema/output/definition/registry pins are exact immutable artifacts. `applicabilitySchema=null`, `policy=null`, quality is `explicit_primary_statement`. Targets `{kind:'fact_field', fieldPath:'semantics'}` and `{kind:'fact_field', fieldPath:'duration'}` each cite `[E_A]`, covering both fields including the canonical null. The selected definition's required legal slots must agree with that coverage; the null does not invent a numeric duration.

The global key is the existing scope parser's key. `factHash` binds this fact and its parser pins; `candidateBinding` adds that key, quality and `[E_A]`. The proposal-null review key and exact frozen catalog/ref time produce `proofIdentity`. The final fingerprint binds every field including `policy:null` and the fresh completion time. The example stops at trusted fact production; it creates no accepted Rule and does not register any source or extractor.

### Composed

A second independently reviewed global cell `G2` has the same public category fields but `requirementType:'visa'`; all Evidence scopes and the proof bind that exact changed cell. Two distinct synthetic items A and B may share `sourceId:'example-authority'`. They have different `contentItemId`s and accepted versions `E_A`, `E_B`, each with exact item/representation/profile pins, request/final URL, MIME, fresh hash equality and distinct completion times after the common reference. Neither item is merely another representation of the other.

A hypothetical versioned extractor and `otp_example_joint` v3 policy share `otf_example_rules`, `ots_example_text`, `factKind:'requirement_effect'`, the exact item set and a null applicability pin. Phase A selects that single pair before HTTP. Assume the complete canonical legacy fact is `{"kind":"requirement_effect","effect":"not_required","visaMode":"visa_exempt"}`. Both items explicitly supply each value; absence of a requirement is not inferred.

The exact assignments are `{target:{kind:'fact_field',fieldPath:'effect'},contentItemRefs:[A,B],relation:'equal_values',role:'equal_values'}` and the same shape for `visaMode`. Every assignment has source-attributed observations from **both** A and B, with equal canonical values per target. Citations for each target are exactly `[E_A,E_B]`, sorted. Policy IDs/pins, complete assignments, seal-bound fact value, citations and both supports enter `resultIdentity`; `policy` is not null. The current outer extraction result would have to retain the internal phase-B context in a separately authorized implementation before it could supply this receipt.

For a schema-1 branch variant, each branch, outcome and each atom uses the live target/locator vocabulary and exact support subset, in addition to the non-null applicability pin. For example a branch citing `[E_A,E_B]` with an atom supported by `[E_B]` needs that exact atom assignment; it cannot inherit both by default. An unassigned `otherwise`, missing atom observation or duplicate locator blocks production. Even a fully covered variant remains blocked from current composed-branch acceptance and schema-1 storage.

## 14. Adversarial and failure semantics

Only complete successful trusted-fact production eligible under this contract produces a receipt. Blocked/failed attempts produce no partial receipt, no success-shaped fingerprint and no persistent failure record. A transient closed reason may return within the existing internal failure path; it must not echo offending values. This architecture does not create security logging, traveller logging, error retention or an observability store. Those require a separate gate.

| Attempt | Required result |
| --- | --- |
| Caller submits a receipt, perfect fingerprint, F7 witness or hash-equal candidate | Never authority; no resume-from-receipt path. Re-run a separately authorized trusted request. |
| Caller supplies snapshot/hash/time/IDs/scope/extractor/policy/review ID/provenance/model output | No authority is adopted. No producer call from a deserialized structural lookalike. |
| Historical record replayed while source now changed | Historical audit only; new retrieval/Evidence reproof required. No extraction or acceptance based on record possession. |
| Traveller-derived date/citizenship/residence hidden behind scope, Evidence or review hash | Privacy admission fails, including when top-level personal fields are absent. |
| Non-null model proposal omitted from output but left in review-key preimage | No receipt. Do not reuse the old key after stripping proposal. |
| Token in URL; personal body stored only as hash | No receipt; do not sanitize into a false identity. |
| Same hash but different source/item/representation/profile version | Identity binding mismatch; hash equality alone never establishes publisher/content identity. |
| Mutable catalog lookup or second catalog read after extraction | Not the execution snapshot; receipt construction fails. |
| Fresh final URL differs from accepted final URL, or fresh hash differs | No receipt for those accepted versions; no silent Evidence update. |
| Same extractor label/version with changed implementation; unknown schema pin | Artifact/version violation; no fallback to latest. |
| Explicit-primary record omits `policy`, or supplies an empty policy object | Invalid schema; exact null is required. |
| Composition uses two representations of one item | Duplicate support-item rejection. Two items under one source remain distinct. |
| Policy or extractor selected after seeing composition MIME/fact schema | Violates phase-A binding; cannot emit an eligible receipt. |
| Missing support, unused assignment, foreign atom support, empty branch, conflicting equal-values observations | No complete trusted result and no receipt. |
| Forged/JSON-round-tripped seal, or different fact object with equal values | Cannot establish private same-request seal custody; digest is not a replacement. |
| `minimumPages` changes between receipt and later acceptance candidate | Live fact/candidate rebind fails even if scope/review keys are unchanged. |
| Fresh retrieval completes after reference time | Expected sequence; retain both. Do not fabricate a freshness-at-acceptance verdict. |
| Clock goes backward; server times unavailable | No receipt; no caller-time substitution. |
| Historical manifest unavailable | Audit explicitly incomplete; no mutable join, new fetch or current manifest presented as old evidence. |
| Production succeeds but later acceptance is refused | Original success-only production receipt stays immutable; it never implied acceptance. No acceptance-error log is added by this contract. |

## 15. Immutability, replay and downstream interfaces

The producer makes an owned, deeply immutable projection after successful production; no shallow freeze of nested arrays and no mutation of caller objects. If ever persisted, records have append-only semantic history: corrected fact, support, version, time or pin creates a new payload/fingerprint. A later accepted Rule version may reference its own new receipt and the old Rule/receipt through separately designed immutable supersession relations. Do not update the old receipt, add a mutable `superseded` flag, copy old freshness or overwrite its fact. No lineage field is needed in this minimal production receipt because the producer does not own later Rule lifecycle decisions.

Immutability is not a decision to retain forever. Retention, deletion, legal obligations, access control, backup behavior, dependency availability and deletion/tombstone policy are reserved for the later lifecycle design. This slice chooses no days, retention period, erasure policy or persistence location.

Three distinct future interfaces, all unimplemented:

1. A private **producer** consumes only the existing trusted same-request chain and actual executed definitions, seal/provenance where applicable, globally safe preimages and clock observations. It projects a receipt or no receipt. It does not take a caller provenance DTO or re-run extraction solely to fill missing metadata.
2. A read-only **historical integrity reader** checks closed shape, canonical bytes, recomputed keys/digests, exact support/citation relationships and immutable artifact closure. Its success means historical consistency only. It has no acceptance/store side effect or capability return.
3. A separately authorized future acceptance design consumes the live deterministic fact/support/proof values, while using the receipt only as an identity/audit output. Its necessary inputs are the exact trusted deterministic path, extractor/policy versions, accepted supports, fresh same-request retrieval and source/content identity, canonical candidate binding and absence of caller/model authority. This document does not define approval predicates, routes, retries, kill switches or F8.

Future candidate paths, **non-authoritative / not created or edited here**:

- `lib/readiness/official-truth-autonomous-provenance-record.ts` — semantic DTO/canonical integrity reader, if separately commissioned.
- `lib/readiness/official-truth-autonomous-provenance-record-server.ts` — private same-request projection only, if separately commissioned.
- Existing `official-truth-same-request-extraction-server.ts`, extractor registry and composition registry — later minimal internal metadata retention/pins, preserving current canonical execution and seal custody.
- `docs/OFFICIAL_TRUTH_AUTONOMOUS_PROVENANCE_PERSISTENCE_ARCHITECTURE_1.md` — candidate separate persistence design; no SQL/table/RPC/migration path is allocated here.
- `docs/OFFICIAL_TRUTH_AUTONOMOUS_PROVENANCE_RETENTION_LIFECYCLE_1.md` — candidate separate Product-Owner/Security/Privacy decision record.
- `lib/readiness/official-truth-autonomous-provenance-store-server.ts` — only a possible later adapter after persistence and lifecycle gates; no interface, payload, access policy or implementation is specified now.

No candidate path authorizes creating the file or starting that slice.

## 16. Explicit remaining gates

| Gate | Remaining requirement; no implied permission |
| --- | --- |
| Independent TL review | Review the exact delivered #855 head and its CI/Preview evidence. Author self-review is not PASS. |
| Global admission implementation | A separately reviewed producer must enforce the partial global-cell projection and transitive hash-preimage privacy, including proposal-null and non-personal representation qualification. Current shape checks alone do not do so. |
| Upstream trusted metadata custody | Independently establish server origin of original Evidence observations/validity, global scope, metadata and exact accepted support selection. The current submitted-material reproof is not by itself that origin proof. The receipt must fail closed until this precondition holds; it cannot accept Evidence or fix origin by hashing. |
| Semantic metadata implementation | Add and verify immutable artifact/schema/output pins, preserve actual initial request URL, and keep phase-A/B provenance with the actual execution. Current public return shapes do not contain every required field. No receipt can be emitted by assuming these fields exist. |
| Immutable dependency availability | A later persistence architecture must define historical resolution/integrity of the exact artifact closure without mutable joins; retention/lifecycle remains separately decided. |
| Persistence schema | Separate TL-selected and reviewed architecture/implementation; no tables, SQL, migrations or storage writes here. |
| Retention/lifecycle | Explicit separate Product-Owner/Security/Privacy gate. Semantic immutability is not a retention duration. |
| Source/profile/extractor/policy qualification and activation | Separate exact source-family tasks. This receipt design qualifies none; #851/#853 stay independent. |
| Acceptance / F8 | Separate design and authority. Sole constructor unchanged; composed-branch and schema-1 store restrictions remain. |
| Production apply / provider activation | Separate Product-Owner gates. No DB, Supabase, provider or Production operation in this slice. |

These are implementation and downstream authorization gates, not unspecified fields to fill opportunistically. The proposed record's domain, fields, null semantics, serialization, identity, privacy rejection and historical limits are defined here. READY allows only later TL consideration of a separate persistence/retention architecture slice; it authorizes no DB, migration, retention decision, F8, Rule acceptance or Production.

**AUTONOMOUS_PROVENANCE_RECORD_ARCHITECTURE_READY_FOR_PERSISTENCE_DESIGN**
