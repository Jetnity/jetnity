# Official Truth global admission and trusted metadata custody architecture 1

Date: 6 October 2026
Issue: [#860](https://github.com/Jetnity/jetnity/issues/860) · Draft PR: [#861](https://github.com/Jetnity/jetnity/pull/861)
Baseline: `main@7fb95414db6b7e4de12bea0df29b2c771081b9d4`
Status: **PROPOSAL / NOT IMPLEMENTED / DOCS-ONLY / PRE-F8**

## 1. Decision and limits

Require an independently admitted global cell, original accepted-Evidence custody, exact server-owned support selection and a proposal-null review construction before a future private producer can consume a successful same-request extraction. Require qualified non-personal representations at both the original observation and fresh retrieval. These are additional origin preconditions of the [merged #855 receipt](OFFICIAL_TRUTH_AUTONOMOUS_PROVENANCE_RECORD_ARCHITECTURE_1_2026-10-05.md), not replacements for its proof, extraction, canonical fact or receipt bindings.

The design is deliberately partial. An unavailable origin, ambiguous selection, unrepresentable qualifier or unsafe representation yields **no receipt**. No fresh hash equality, server parsing, database row, `accepted` label or valid identifier upgrades untrusted metadata. A trusted historical version does not replace a fresh fetch either.

All new objects, fields, names, digest domains and candidate paths below are **PROPOSAL / NOT IMPLEMENTED**. Existing identifiers and behavior are explicitly distinguished. The [binding TASK](OFFICIAL_TRUTH_GLOBAL_ADMISSION_METADATA_CUSTODY_ARCHITECTURE_1_TASK_2026-10-06.md) is immutable. This slice specifies neither an Evidence-acceptance policy nor a write path. It creates no runtime, tests, storage architecture, tables, SQL, migration, retention decision, registration, Rule acceptance or F8.

READY here means only that the Technical Lead may consider a separate bounded private producer/metadata-custody implementation **design**. It does not mean that current code can emit a receipt. #857's unmerged Schema-2 runtime is not a dependency; #859 owns persistence architecture.

## 2. Baseline evidence: shape is not custody

The following observations are from the baseline code, not assumptions about live hosted rows.

| Existing boundary | Observation and consequence |
| --- | --- |
| `evidence.ts`: `evidenceKandidatAkzeptieren`, `akzeptierteEvidenceLesen` | Validate lifecycle/state, registered source, URL, timestamps, scope, lookup and version identities. The latter explicitly reads structurally accepted Evidence. Neither establishes where the original metadata came from. |
| `official-truth-accepted-evidence.ts` | Rebuilds a candidate from an envelope, clock and extraction; passes it through the existing acceptance function; keeps the same version and metadata. This is in-memory semantic acceptance, not a historical custody read. |
| `official-truth-server-held-source-registry.ts` | Owns the catalog and overrides the reproof clock. `officialTruthServerHeldSameRequestMaterial` still reconstructs supports from submitted envelopes/extraction and uses submitted metadata. Freezing those values does not establish original custody. |
| `official-truth-rule-review-packet.ts` | Reconstructs all accepted supports and candidate, with sorted exact support IDs. The request determines which support bundles and metadata arrive. Server registry authority is narrower than server selection of the original support set. |
| `official-truth-rule-review-fingerprint.ts` | `review-packet:v3:` hashes scope/key, fact kind, quality, support IDs, **proposal**, and the compact support provenance. Raw snapshot/note are excluded, but their exclusion does not make the source hash's preimage safe. |
| `official-truth-same-request-proof-server.ts` | Live authority read, one server reference time, one catalog read, freshness at that reference, frozen candidate/Evidence/provenance. Its candidate proposal remains untrusted review material. No global-corpus or original-custody authority is implemented here. |
| `official-truth-same-request-extraction-server.ts` | Rebinds decoded scope and accepted supports, replays the exact frozen catalog, fetches server-side and checks identity/MIME/final URL/hash before extraction. The current decoded-scope checks primarily compare recomputed keys; this design additionally requires canonical parsed value equality. |
| `official-truth-content-identity.ts` | Existing identity schema **2** is content identity, distinct from applicability schema versions. Seven-field binding; `evidence-key:v3:` and `ev2_` plus 32 hex characters. IDs are checksums. The profile verifier proves item/representation identity, not the proposed global/non-personal qualification. |
| Extractor/composition registries | Production extractor and composition-policy registries remain empty. Primary selection uses observed MIME after retrieval. Composition freezes the unique pair in phase A before HTTP; phase B cannot reselect it. Distinct support unit is `(sourceId, contentItemId)`. |
| `official-truth-store-server.ts` | Existing v2 accepted-store writer reconstructs Evidence via `officialTruthServerHeldEvidenceAnnehmen`. It exposes no original-custody loader for this design. A stored row from that path alone is not proof of the stronger origin contract. Schema-1 facts remain non-persistable. |

Relevant tests were read as specification evidence, not executed here: forged-authority and clock rejection in proof/registry tests; scope mismatch before HTTP, source drift, frozen composition pair and private seal behavior in extraction tests; v3 review preimages; content-identity and profile boundaries. Historical comments/test labels mentioning review v2, two distinct source IDs or an absent composition framework do not override live v3/item-pair/phase-A/B code.

#751 records Development catalog/store availability and no accepted Evidence at the cited checkpoint; Production Official Truth remains absent/unapplied. Those are reported continuity facts, not DB reads in this slice. #294's no-default-credential and unknown-not-required invariants remain binding. #741 is future F8 context only. Lower stale active-writer text in #751 is superseded by its live top section and the #861 dispatch.

## 3. Contract vocabulary and origin roots

Reuse #855's `Pin = {id, version, digest}`, closed `ot-provenance-json-v1` canonical serialization `C`, and full SHA-256 digest of immutable artifact bytes. A pin resolves by its full triple and byte contract, never `id`, `current`, `latest`, a Git branch or display name alone. Existing scope, Evidence and review algorithms remain unchanged. Where a new fingerprint is specified, use #855's `H(domain,value)` with the exact LF separator and canonical bytes. Digest comparison is accompanied by exact validated content comparison; any collision/conflicting bytes under one identity fail closed.

These are logical objects, not database schemas:

| Object | Minimum contents / purpose | Origin root |
| --- | --- | --- |
| **GlobalCellDefinitionV1** | Exactly `{id, version, scope}`; `id` is the logical `globalCellId`, `scope` is canonical `RegelScope`. Its pin digest covers exactly these bytes, preserving #855. | Independently reviewed server-owned global corpus definition. |
| **GlobalCellAdmissionV1** | Exact cell pin, scope-contract pin and corpus-admission-contract pin; structured public-category basis for each scope dimension; a regulatory-evaluation-date-plan pin or explicit null. | Corpus release/admission process separated from traveller research, requests and models. |
| **AcceptedEvidenceCustodyV1** | Exact admitted cell pin, complete compact Evidence identity preimage and source-bearing scope, original observation binding, validity derivation binding, exact accepted-version origin binding and relevant contract pins; section 5. | An authorized server original-observation/metadata path followed by an independently authorized Evidence-acceptance boundary. No new acceptance policy here. |
| **SupportSelectionDefinitionV1** | Exact cell pin, fact kind, requirement type, primary/composed quality, required item pairs, selection-contract pin and immutable definition references; section 6. | Reviewed code-owned global selection definition, independent of incoming support bundles. |
| **SelectedSupportManifestV1** | Exact selected custody pins/versions, selection definition, eligibility snapshot, frozen catalog and extractor/policy registry references; section 6. | One server selection execution over those independently trusted objects. |
| **GlobalRepresentationQualificationV1** | Exact content identity binding, descriptor/profile and qualification-contract pins, complete request and response eligibility contract; section 8. | Code-owned qualification associated with the exact source representation, never a caller assertion. |
| **AutonomousReviewConstructionV1** | Safe v3 preimage bound to the cell and selected support manifest, existing recomputed review key, and construction-contract pin; `proposal:null` from inception. | Private server constructor consuming only the trusted objects above. |

The structured dimension basis in admission has exactly the eight `RegelScope` field names. Each maps to a public-corpus rule reference and its permitted category value, or an explicit not-applicable basis allowed by that rule. The date-plan reference is non-null exactly for `validity.mode='travel_date'`. The references resolve to immutable bounded public legal-category definitions/code-owned evaluation plans; they are not free-text explanations, model responses or person records. No admission object can approve a scope its corpus contract cannot express exactly.

Origin roots must be real controlled data flows. A field named `trusted`, a signature without a qualified issuer, a private TypeScript brand, an `Object.freeze` or a stored copy is not such a root. A future implementation must have a closed issuance path and a trusted loader that verifies exact origin binding and content. Pure parsers validate data; they cannot issue authority. Test dependency injection stays outside live ingress.

All schemas are closed and bounded: reject unknown keys, omitted required values, duplicate members before decoding loses them, cycles, executable properties and unsupported versions. Reuse existing scope/identity/fact/retrieval bounds and #855 pin/serialization bounds. Lists here do not raise the existing eight-support limit. Larger manifests use explicitly bounded pinned contracts; no unbounded generic metadata map or opaque serialized caller object is admitted.

### Exact logical reference forms

The following are closed semantic signatures, not TypeScript exports or storage payloads. All listed fields are required. `Pin` resolves an exact immutable artifact; `null` is permitted only where explicitly stated. The definition pin of each new versioned artifact hashes `C({kind, schemaVersion:1, value})`, with `kind` exactly its object name below. Its own pin is outside that preimage. `GlobalCellDefinitionV1` is the deliberate exception: preserve #855's exact `{id,version,scope}` bytes. New artifact fingerprint means that full pin digest, not a second algorithm or an authority token.

| Object name (`kind`) | Exact `value` fields |
| --- | --- |
| `GlobalCellAdmissionV1` | `cell: Pin`, `scopeContract: Pin`, `corpusAdmissionContract: Pin`, `dimensionBasis`, `evaluationDatePlan: Pin or null`. `dimensionBasis` has exactly the eight scope keys; each value is `{category: exact canonical value of that scope field, basis: Pin}`. |
| `AcceptedEvidenceCustodyV1` | `cell: Pin`, `globalAdmission: Pin`, `scopeContract: Pin`, `evidenceScope: canonical source-bearing EvidenceScope`, `evidenceIdentity`, `observation: Pin`, `validityOrigin: Pin`, `acceptedOrigin: Pin`, `identityContract: Pin`, `hashContract: Pin`. `evidenceIdentity` has exactly the existing `ContentEvidenceIdentity` fields plus `versionId`; it excludes notes/display names. |
| `SupportSelectionDefinitionV1` | `cell: Pin`, `requirementType`, `factKind`, `evidenceQuality`, `requiredContentItemRefs`, `selectionContract: Pin`. Required refs are the nonempty sorted unique source/item pairs; the contract pins the reviewed complete source-family requirements and compatible executable/output definitions. |
| `SelectedSupportManifestV1` | `selectionDefinition: Pin`, `cell: Pin`, `globalAdmission: Pin`, `requirementType`, `factKind`, `evidenceQuality`, `eligibleVersionSnapshot: Pin`, `catalogSnapshot: Pin`, `extractorRegistrySnapshot: Pin`, `policyRegistrySnapshot: Pin or null`, `supports`. Each support is exactly `{versionId, custody: Pin}` in version-ID order. Policy registry is null exactly for primary. Actual primary winner/composed phase-A pair is retained separately in #855's execution binding, not invented as an incoming manifest field. |
| `GlobalRepresentationQualificationV1` | `binding: ContentIdentityBinding`, `itemDefinition: Pin`, `representationDefinition: Pin`, `identityProfileDefinition: Pin`, `qualificationContract: Pin`. The contract must prove all four section-8 properties and defines the bounded response/transport verifier; a boolean flag is not a substitute. |
| `AutonomousReviewConstructionV1` | `cell: Pin`, `selectedSupportManifest: Pin`, `constructionContract: Pin`, `safePreimage: exact existing v3 fingerprint preimage`, `reviewPacketKey: recomputed existing v3 key`. |
| `CustodyDependencyBindingV1` | `receiptFingerprint`, `globalAdmission: Pin`, `selectedSupportManifest: Pin`, `autonomousReviewConstruction: Pin`; section 14's immutable logical association. |

For the reference form selected here, `observation`, `validityOrigin` and `acceptedOrigin` resolve the exact immutable bounded original-source records specified in section 5. Their issuing contracts must declare closed fields and byte semantics, including the stated equality bindings. Unknown issuer contracts are not admitted. This design fixes the consumer's origin obligations; the separately gated original-metadata/acceptance designs own their issuance implementation and acceptance criteria. Current code exposes none of these new references as origin authority.

## 4. Global cell admission

### 4.1 Definition and independent origin

The cell definition is immutable, server-held, versioned, non-personal and source-neutral. Its logical ID is a public corpus identifier. It contains no source/profile, support IDs, user, execution or request identity. Multiple sources may later support the same exact cell without changing that cell.

Admission is an independently reviewed finite corpus release, or a code-owned bounded generation from public legal categories and a predeclared global date plan. The definition and admission basis exist independently **before** the traveller request that might hint at it. That request may identify an already admitted cell for scheduling consideration; it cannot create a cell, choose its version as authority, change a category/date, expand the corpus, or cause acceptance/extraction merely by naming it.

No on-demand `RegelScope`→global-cell upsert. No nightly aggregation of traveller combinations. No popularity-derived population of rare combinations/dates. Removing identifiers, waiting, hashing, rounding dates or deduplicating repeated personal combinations does not change their origin. A separate global corpus change must derive its categories independently from public regulatory material; it cannot relabel or carry forward the old personal Evidence/review hashes. There is no backlink from a global definition/admission to personal requests or logs.

The authorized global operation selects a cell under its own current eligibility and bounded work definition. Caller hints affect neither the retained definition nor any hash preimage; unsuccessful hints cannot mint a fallback cell. If no independent exact cell exists, stop this autonomous receipt path. The product's traveller-specific evaluation remains a separate compute-on-read concern.

### 4.2 Exact dimensions

- Destination and transit remain separate, including their explicit nulls.
- Citizenship is the complete canonically ordered set required by the public category, within existing bounds; no first-citizenship or intersection shortcut.
- Exactly one credential option is bound, including document type, issuer and explicit citizenship link or null. Issuer is never citizenship. Another option is another independently admitted cell, not a generated traveller cross product.
- Residence can be a public legally relevant country category, never personal residence history or a substitute citizenship. `not_applicable` requires a justified global category basis, not a privacy redaction.
- Requirement type remains the existing closed taxonomy.
- `travelDate` is admitted only as the exact **globally defined regulatory evaluation date** in the independent plan. It retains the existing field meaning and spelling for scope equality; it is not a person's departure-date copy and is never replaced by `serverReferenceTime`. A receipt covers that exact dated cell; it does not assert an interval or coverage for another date.

Canonical parsing proves representability, not lawful completeness or privacy. If an ordinary-passport qualifier, status category or other relevant legal distinction cannot be expressed losslessly by the pinned current contracts, the cell/use is ineligible. Do not broaden to generic passport or drop qualifiers. No unmerged #857 shape is assumed.

### 4.3 Definition versus eligibility

Keep `current`, enabled/retired status and scheduling eligibility in a **separate immutable eligibility snapshot** of the trusted global corpus. It references exact definition/admission pins. Historical `{id,version,scope}` bytes never change when eligibility changes. New semantics, category basis, parser meaning or date plan requires a new version/pin and re-admission; no version reuse.

For a new execution, the trusted selector requires one eligible exact definition/admission pair. Missing, retired, ambiguous or incompatible entries fail closed. A historical definition remains interpretable under its historical artifacts, but its existence never grants present eligibility. A coherent snapshot is pinned through the execution; detected revocation/invalidation aborts it rather than splicing in a newer cell. This defines use eligibility, not retention or deletion policy.

## 5. Original accepted-Evidence custody

### 5.1 Semantic validity and origin are separate predicates

Require **A AND B**:

**A — Semantic Evidence validity:** the current canonical validators accept the version under the exact trusted catalog; lifecycle/validation are accepted/valid, source is official, scope/lookup/version identities bind, and the original times/validity meet the applicable validation/freshness rules. These checks remain necessary and unchanged.

**B — Original metadata custody:** the historical identity and every relevant value came from the qualified server path **when that original observation/version was made**. Replaying an envelope, computing the same version ID, inserting it into a private store or seeing equal bytes today cannot prove B.

The minimum new immutable object is one `AcceptedEvidenceCustodyV1` per exact accepted observation/version and global-cell admission. It binds this closed logical payload:

| Field group | Bound value and required origin |
| --- | --- |
| `globalCell`, `globalAdmission`, `scopeContract` | Exact immutable pins and the source-bearing Evidence scope. Parse its source-neutral projection and require exact cell equality. |
| `evidenceIdentity` | Existing `identitySchema`, `versionId`, `lookupKey`, seven-field content binding, canonical final URL, MIME, complete `sourceContentHash`, original `retrievedAt`, `validFrom`, `validUntil`. Preserve explicit nulls and date-only versus instant forms. |
| `observation` | Immutable original server observation: chosen initial URL, final URL, observed MIME, source/content/representation/profile tuple, full-response hash, original completion time, catalog/profile/hash/retrieval-contract pins and exact representation-qualification pin/result binding. No raw response, header, request/session ID or caller timestamp. |
| `validityOrigin` | Exact two accepted validity values plus immutable deterministic metadata-derivation contract and original observation binding. Each non-null bound is traceable to a supported structured regulatory field/locator under that contract. An explicit null has a contract-defined `no_bound_asserted` basis; missing/unknown/failed derivation cannot be turned into null. |
| `acceptedOrigin` | Immutable binding produced by the separately authorized acceptance boundary, identifying this exact version **and full identity preimage**, scope and observation/validity dependencies under its pinned contract. It attests an actual authorized accepted-version result; no caller `accepted:true`, no mere recomputation and no claim of a database write. |
| `identityContract`, `hashContract` | Exact historical algorithms, including the current full-response normalization and Evidence-version preimage rules. |

The observation and validity/acceptance bindings may be embedded immutable values or exact pins to identical qualified immutable artifacts. A loader must resolve their complete closure before use; an opaque ID with no resolvable origin is insufficient. This choice of representation changes no storage architecture. No signature scheme, table or issuer service is implemented here.

The original observation must be minted from the actual server-controlled response and completion clock before caller substitution can occur. Metadata derivation consumes that observation and global definition, not model extraction JSON. A published page's `lastUpdatedAt` is not `retrievedAt`, and neither is automatically `validFrom`. Validity interpretation must be covered by its separately reviewed deterministic contract; if none exists, custody is unavailable. This is a dependency requirement, not an Evidence-acceptance policy or a design for inferring legal dates.

The acceptance binding must be issued only after the separately authorized acceptance operation has succeeded on those exact values. It is not minted by this receipt producer and cannot be produced just because `akzeptierteEvidenceLesen` succeeds. No new criteria for Evidence acceptance are defined here. There is no rule that existing accepted rows automatically satisfy this stronger input contract.

Recompute the existing `evidence-key:v3:` and `contentEvidenceVersionV2` identities and compare the full canonical preimage, not only the truncated `ev2_` ID. Same ID with different contents is corruption and blocks. A custody fingerprint covers the whole payload including its origin/dependency bindings; it remains a checksum, not proof of issuance. Proof of issuance comes from the authorized controlled path and trusted resolution, not possession of the fingerprint.

### 5.2 Claim-level metadata and historical versions

`EvidenceVersion` currently has **no `evidenceQuality` field** and does not by itself select a fact kind. Do not invent fields in that runtime type. Custody of fact kind and quality lives in the independently issued support-selection definition/manifest, which binds the exact custody objects used for that particular candidate. The union of version custody and manifest custody proves all required metadata.

Changing original `retrievedAt`, validity, scope, content/profile identity or response hash creates a different version/custody object. A new fetch may start a separately authorized new observation/version process; it cannot repair old metadata in place, backdate a custody assertion or silently replace the version in a running manifest. Legacy rows missing B remain ineligible even when today's body is identical. Existing notes/display fields do not supply origin and cannot enter the new artifact closure; no hash of an entire legacy row containing such fields is retained.

## 6. Exact server-owned support selection

### 6.1 Selection definition before caller material

`SupportSelectionDefinitionV1` declares the exact cell, requirement type, fact kind, intended quality and complete required `(sourceId,contentItemId)` set under a reviewed code-owned contract. This is a manifest of the supported global research case, not an automatic Evidence-acceptance policy. Requirements must be established from the independent source-family contract; they cannot be inferred from whatever items the caller happens to send or whichever subset passes an extractor.

A server-held immutable eligible-version snapshot references exact custody objects for this definition. Select **exactly one** eligible accepted version/representation per required item. The minimal design refuses zero or multiple eligible versions for an item; it has no “newest timestamp wins” or caller tie-break. Separate authorized server maintenance must resolve ambiguity before a new invocation. Preserve the snapshot used, including unavailable/ineligible candidates relevant to completeness; never derive it from incoming IDs. A stored row's visibility is not selection authority.

`SelectedSupportManifestV1` contains the selection-definition pin, admitted cell/admission pins, fact kind, requirement type, quality, eligible-version-snapshot pin, frozen catalog and selection-registry pins, and a sorted list of `{versionId, custodyPin}`. Each custody resolves to one complete identity/scope/origin object. Sort by exact ascending version ID without locale collation; reject duplicate version IDs, duplicate custody entries and duplicate item pairs before normalization. Required item set and selected item set must be equal. No unreviewed extra item, missing required support, best-effort subset or fallback representation is permitted.

Quality is not a caller flag or a consequence of counting pages. The trusted selection definition supplies the intended mode; the actual eligible extraction/policy must prove the mode and complete fact. Conflict, stale evidence and research gaps block rather than converting quality or producing `not_required`.

### 6.2 Preserve current primary and composition rules

**Explicit primary:** exactly one accepted support, one item and one selected representation; `policy:null`. The current extractor rules still select a unique current null-policy definition after fresh observed MIME is known, then enforce representation/URL, matching and complete canonical fact requirements. Freeze the eligible extractor registry before retrieval, but do not invent a new pre-HTTP primary winner. The selected definition and output/schema pins are retained after selection. Multiple matching definitions fail; neither a manifest nor a hint may force a winner. Existing explicit-primary branch/atom provenance rules continue to require the sole support.

**Composition:** 2–8 distinct item pairs; two pages of one authority can be separate items, two representations of the same item cannot. Run existing phase A against the already server-selected exact support bindings and frozen extractor/policy registries before HTTP. Its unique pair must agree with fact kind, requirement type, exact items, representations, URLs, source family, schema family and the selection definition. Any incompatible predeclared contract is a refusal, not a replacement selector. Observed MIME, output shape or an applicability-schema guess cannot resolve a phase-A ambiguity.

Phase B must execute that same frozen pair, verify source-attributed values and complete field/branch/atom/otherwise assignments/citations against the exact selected versions. `equal_values` requires all assigned items' matching observations. Citation subsets and their required unions remain the existing contracts; completeness is not merely equal top-level support counts. Preserve the actual private seal and fact reference. The current outer composed return omits context needed for #855; a future internal seam must retain the actual phase-A/B context, never reconstruct it from a seal or current registry.

### 6.3 No substitution

The manifest is fixed before fresh retrieval. For every later stage require equality of both ordered IDs **and resolved full custody/identity values**. Newer version, same hash under a different item/profile, extra successful fetch or a failed support cannot be swapped into the running set. Fail the entire attempt; a separately authorized new execution must select a new manifest. No automatic retry with a smaller set or primary downgrade. Final candidate kind, quality and supports must agree with the manifest and actual deterministic output.

## 7. Exact scope-rebind algorithm

The required chain is:

```text
independently admitted GlobalCellDefinition
  -> each AcceptedEvidenceCustody / accepted Evidence scope
  -> server-created Review / Proof candidate scope
  -> Same-Request Extraction decoded scope
  -> canonical fact's candidate binding
  -> #855 receipt's Global Cell definition / scope
```

1. Load the eligible cell definition/admission from trusted custody. Parse with the pinned existing `regelScopeAusEvidenceScope`. Require the stored cell to be exactly its canonical output, with no unknown qualifier dropped during parsing. Derive the existing `rule-scope:v1:` key.
2. Resolve every manifest custody object and semantic accepted Evidence. Check `scope.sourceId` against its exact source binding before projecting source-neutral scope. Parse each with the same scope contract. Require canonical parsed **value equality for every field/nested value** with the cell, plus equality of recomputed keys. Stripping only the Evidence namespace field `sourceId` under the existing canonical projection removes no legal qualifier.
3. Construct candidate metadata server-side from the manifest with `proposal:null`. Its full canonical scope, key, requirement type, fact kind, quality and exact support versions must agree. Rebind the actual proof candidate to the same values. No packet supplied by a caller becomes this candidate.
4. Rebind the extraction input's decoded scope to that exact proof/cell/Evidence value before HTTP/extraction, and retain the frozen scope in the trusted invocation. Every support must resolve uniquely; missing/ambiguous versions block even if a key happens to match.
5. Parse actual deterministic output through the existing canonical Rule-fact parser for the bound kind/requirement and pinned fact/applicability contracts. The fact does not itself carry the whole scope. Bind it using #855's `candidateBinding`, which includes the exact canonical cell/key, kind, requirement, schema family/pins, fact hash, quality and support set. Never infer scope from fact bytes.
6. Build #855's receipt with that exact global definition pin and scope. Recompute key, fact hash and candidate binding; compare exact values to the retained execution. The returned receipt is a value projection, never the origin of the live fact/candidate. For composition retain strict seal/fact object identity as well.

**Decision:** `rule-scope:v1` alone is insufficient. It is an equality checksum/witness, not an origin proof, privacy classification or substitute for canonical parsed equality. Malformed raw scopes, different parser versions or a collision cannot be excused by matching keys. Allowed canonical ordering/normalization comes solely from the pinned parser; there is no second normalizer that generalizes law.

No broadening or narrowing after selection. Do not remove privacy-sensitive qualifiers; reject the chain instead. No `travelDate`→reference-time substitution, issuer→citizenship, residence→citizenship, default traveller/passport/citizenship, hidden citizenship truncation, date rounding or `not_applicable` fallback. Full citizenship and explicit credential-link/null semantics survive every edge.

## 8. Global/non-personal source-representation qualification

### 8.1 Positive proof, not a public-URL heuristic

An official host, public HTTP 200, identity-profile success, TLS, credentialless fetch or a known content ID alone is insufficient. The qualification must cover the **complete representation used by the existing full-response hash**, including fields/markup not used for legal extraction.

`GlobalRepresentationQualificationV1` binds an exact seven-field content identity, immutable item/representation/profile definitions and a code-owned qualification contract with these independently verified properties:

- `public_global_regulatory`: the resource is a global regulatory publication, not a person/case/account response. The contract has reviewed evidence of this resource class and a deterministic closed admissible response envelope.
- `non_personal_request`: only the exact approved initial URLs, redirects and final URL can be used, with bounded query semantics and no personal/body parameters. Source descriptors alone cannot authorize a hidden token or personal query.
- `context_free_transport`: fixed server request configuration with no traveller input, cookies, authentication, session, account or personal referer/header context. No browser-session copying or cookie fallback. The observed invocation must satisfy the contract.
- `non_personal_full_response`: all returned content contributing to the hash falls inside that qualified envelope. Any unexpected person/case field, personalization, unbounded extension or uncertain text/content fails. A generic PII regex, a model judgement or a single sample response is not positive proof for arbitrary future bodies.

The profile-associated qualification must be code-owned and versioned, with executable semantic dependencies pinned. A caller cannot set these properties. Existing `ContentIdentityProfileDefinition.verify` proves content identity only; this design does **not** assert that its currently registered GOV.UK verifier implements all four properties. A separate source/profile qualification and implementation review must establish the stronger contract. No profile is added, re-registered or activated here.

Both original observation and fresh reproof must execute qualification over their actual full response and exact transport/URL context. Historical observation binds the qualification version/result to its full hash. Current use must have an eligible qualification compatible with that historical origin; a new current declaration cannot retroactively certify an unobserved old body. Missing original qualification is custody failure. Definition changes require new versions; unknown nature fails closed.

### 8.2 Mandatory rejection cases

| Representation/input | Result |
| --- | --- |
| Personal case response or named traveller record, including publicly accessible records | `representation_not_global`; do not retain its hash in global provenance. |
| Tokenized, signed, private or credential-bearing URL | Reject the whole URL/representation; stripping tokens or queries cannot preserve identity. |
| Session-bound page, account portal, cookie/auth-dependent response | Reject; no browser-cookie or account fallback. |
| URL path/query or request body with personal data | Reject before retrieval/retention; hash or percent-encoding is not anonymization. |
| Generic public page with unproven non-personal response extensions | Reject until a separately reviewed exact qualification exists. |
| Valid global outer envelope with personal nested content | Reject the whole response; do not hash only the safe projection. |
| Public source returning a login, CAPTCHA, personalized interstitial or unexpected response class | Refuse identity/qualification; do not treat its HTTP status/hash as regulatory evidence. |
| Sanitized excerpt/DOM hash submitted as accepted full-response identity | Reject; an alternative representation needs its own separately qualified identity. |

Use the existing `evidenceQuellenFingerprint` semantics: the complete bounded decoded UTF-8 response text, CRLF/CR normalized to LF, SHA-256. This is not a wire/compressed-body hash, excerpt, ETag or semantic hash. No unreviewed redaction, truncation or DOM transformation. Raw body remains ephemeral and is not stored in the receipt or these custody artifacts. Qualification must happen before its hash/IDs enter any retained global dependency; transient processing does not create permission to log rejected content.

## 9. Proposal-null and model-free review construction

**Decision: construct autonomous review material server-side with `proposal:null` from inception.** Select fact kind/quality/supports from the trusted manifest and scope from the admitted cell. Do not accept incoming metadata, packet, candidate, witness, proposal, prompt or extracted model value as the source of any field, including indirectly as an ID, hash, name or selection decision.

An existing packet with non-null proposal is ineligible. Clearing the property and reusing its key is inconsistent; clearing it and recomputing a key still does not prove safe origin of its supports/scope/metadata. There is no “sanitize and promote packet” route. A wholly new server construction may use **independently loaded** safe custody objects that also happen to have appeared in an old packet, but consumes no value/identifier from that packet as authority and keeps no old packet key or model linkage. Equality of values never substitutes for that independent construction.

**Decision: retain existing `review-packet:v3:` as a checksum of the unchanged safe preimage.** Its domain can identify both human and autonomous review material; possession of the key conveys neither class nor authority. A new autonomous review-key domain would not fix custody and is not required just for an origin restriction. Autonomous eligibility resides in the controlled construction, immutable custody/selection artifacts and same-request proof. Do not add new fields to v3's preimage or silently change its canonicalization. Any future change to identity semantics requires a separately versioned domain/contract.

The safe preimage is exactly the existing v3 form: version 3; canonical candidate scope/key, kind, quality, exact sorted support IDs, literal null proposal; and existing compact support provenance with original times/validity/identity/MIME/hash. Its data dependencies are only the admitted cell and manifest-resolved custody objects. `AutonomousReviewConstructionV1` binds the cell pin, manifest pin, construction-contract pin, exact safe preimage and recomputed existing key. No raw review packet/page text or note is retained.

The current exported fingerprint function reconstructs the packet from original envelopes and can require a snapshot during that reconstruction. A future implementation must provide an internal safe-material seam using already custodied values while preserving the exact v3 preimage algorithm. It cannot fabricate an old envelope/body or overwrite the original time with a fresh one to satisfy the current API. This is a named implementation prerequisite; no new acceptance call or second canonical fact parser is authorized here.

Check transitive preimages **before** constructing fingerprints: global scope/admission bases, source URLs and full response identity, Evidence lookup/version inputs, manifests, profile/extractor/policy/schema pins and actual candidate fact. Do not hash arbitrary source descriptions, review comments, prompts, model rationales, proposals, conversation IDs or whole legacy objects. Code/schema descriptors contain only admitted semantic data and reviewed implementation dependencies; operational model/prompt/session data never becomes artifact identity. Caller candidate proposals remain untrusted outside this chain.

## 10. Original custody and fresh same-request reproof

These prove different things:

| Dimension | What it proves | What it cannot prove |
| --- | --- | --- |
| Original custody | Exact historical observation time, validity derivation, scope/identity origin and accepted version, plus trusted metadata/support selection. | Present availability, unchanged content, present eligibility or current freshness. |
| Fresh reproof | Current server-owned retrieval in this invocation, exact identity/MIME/final URL/full-hash equality to all selected accepted supports, under frozen trusted selection. | Authenticity of untrusted original `retrievedAt`, legal validity or support-selection authority. |

Required future ordering, with no implementation in this slice:

1. Establish existing live operation authority through the server boundary. Do not use a witness/ID as permission. Capture its one server-owned reference time and acquire the coherent trusted global admission/eligibility inputs and one frozen source catalog. No caller clock/catalog override.
2. Resolve admitted cell, support-selection definition, eligible versions and complete original custody/qualification closure. Validate semantic accepted Evidence, exact source-neutral scopes, kind/quality, item completeness and full version identity. Refuse unknown origin before fresh fetch or extraction.
3. Freeze the exact selected manifest and all relevant catalog/selection/executable contracts. For composition freeze the actual phase-A pair before HTTP. No second external source catalog read; replay the one frozen catalog as the existing extraction path does.
4. Construct the safe proposal-null review identity and proof candidate from those objects. Reprove the current proof invariants and original Evidence freshness at the server reference. Retain actual same-request object custody. This must not route caller envelopes through the old parser and claim they acquired origin.
5. Retrieve every exact selected support using server-owned requests and the frozen catalog/profile definitions. Capture actual initial request URL and completion time inside the loop. Requalify its full representation. Require the exact accepted seven-field identity, MIME, final URL and full hash; rebind original Evidence and scope. Any failure ends the whole attempt.
6. Run primary selection with observed MIME or the frozen composition pair as specified above. Require complete canonical fact/provenance and exact manifest equality, no substitutions. Retain actual fact/seal and complete phase-A/B context.
7. Rebind scope/candidate/selection and project the #855 receipt only when all its additional pins, privacy checks and execution metadata are available. Preserve original `retrievedAt`, legal validity, reference time and fresh completion as distinct values. Do not perform Evidence acceptance, Rule acceptance or persistence here.

`original retrievedAt <= serverReferenceTime`; original validity/freshness must be current at that reference under the pinned existing contract. Fresh completion normally occurs **after** reference time; require authentic invocation custody and non-reversed completion clocks, not `completion <= reference`. Do not write completion time into the old Evidence version or treat it as a new historical observation. A missing/invalid/backwards clock or a lost/cross-request observation is a `freshness_gap`.

This preserves #855's precise time claim: Evidence freshness **at reference**, plus completed fresh retrievals. It does not claim re-evaluation at receipt time or later acceptance. A validity boundary crossed during a long request cannot be claimed current at completion; a future consumer requiring that assertion must perform its separately designed time gate. There is no new TTL, legal-time substitution or acceptance-time approval here. If the selected production contract requires a time assertion the available clocks/proof cannot establish, refuse with `freshness_gap`; never invent the assertion. Historical timestamps, however recent, cannot rehydrate a same-request proof.

## 11. Failure semantics and adversarial cases

All failures below produce **no receipt, no success-shaped custody upgrade and no automatic acceptance/write**. A transient internal closed reason must not echo URLs, offending values, bodies or personal/model data. Durable failure logging and retention are outside scope. Exact reason strings below are **PROPOSAL** except `scope_mismatch`, which already exists; mappings describe meaning, not new runtime enums.

| Reason | Condition / required action | Existing nearby reasons, where applicable |
| --- | --- | --- |
| `custody_missing` | Missing original observation, validity basis, accepted-origin binding, global admission or immutable dependency; refuse before fresh work. | No equivalent complete origin gate exists. |
| `scope_mismatch` | Any unequal canonical cell/Evidence/candidate/extraction scope or key; refuse without broadening/narrowing. | Existing exact name; stronger value/origin requirement proposed. |
| `support_set_mismatch` | Missing/extra/duplicate required item or version, ambiguous eligible version, changed manifest, foreign citations; refuse entire set. | `support_mismatch`, `support_binding_mismatch`, `insufficient_support`, `same_content_item_composition`. |
| `proposal_not_null` | Non-null proposal, or indirect model/prompt-dependent review preimage/construction; discard this autonomous attempt. | No complete autonomous preimage gate exists. |
| `representation_not_global` | Any mandatory rejection or unproven complete-response/URL/transport qualification; never sanitize into a different identity. | Current URL/privacy/identity rejections are necessary but not sufficient. |
| `fresh_reproof_failed` | Fetch/identity-verifier failure, non-qualifying response, final-URL/MIME/hash mismatch; no support swap or Evidence update. | `http_failed`, `content_identity_mismatch`, `source_changed_since_evidence`, `source_url_changed_since_evidence`. |
| `identity_drift` | Same ID/version/pin resolves to changed bytes; source/content/representation/profile/schema contract differs from frozen binding; stop. | Existing content-identity and representation/policy mismatch reasons cover portions. |
| `freshness_gap` | Original freshness/validity not proven at reference, invalid/missing/reversed time, lost same-request custody or required later-time assertion unavailable. | `freshness_not_current`, `invalid_reference_time`, `invalid_retrieval_time`. |

When several conditions fail, stop at the earliest failed ordered gate; do not fetch just to produce a more specific diagnosis. Existing authorization, catalog, conflict and canonical-parser failures remain refusals; this table does not collapse them into success or add permissive fallbacks.

| Adversarial attempt | Why it cannot pass |
| --- | --- |
| Submit correct cell ID and exact canonical scope copied from a trip | ID possession cannot select authority or admit a new cell. Independent corpus objects and lineage must be loaded; submitted values never establish origin. |
| Generate many “anonymous” cells from traveller combinations | Corpus admission excludes all request-derived enumeration and retains no personal linkage; no on-demand or aggregate upsert. |
| Fresh page hash equals a caller's hash with a fabricated old time | B remains false; `custody_missing`, regardless of fresh fetch success. |
| Private stored row has accepted/valid flags but no original observation | Semantic A may pass; B still fails. Storage location is not origin. |
| Correct IDs plus attacker-selected subset of a complete source family | Required set is code-owned before incoming bundles; missing support blocks. |
| Extra page supplies a convenient fact or newer version | Exact manifest cannot grow or swap after selection; restart needs a new authorized selection. |
| Two languages/representations of one item masquerade as composition | Duplicate item pair; not two supports. Two distinct items of one source are allowed only under the complete policy contract. |
| Swap profile or item with identical text/hash | Seven-field binding and full identity preimage disagree; no hash-only equivalence. |
| Strip second citizenship/residence/date to pass privacy | Exact parsed equality fails; privacy rejection never changes scope. |
| Use matching scope hash with mismatched parsed values | Both value and key are checked under exact parser pin; fail closed. |
| Null the visible proposal but retain a model-dependent review key/ID | Transitive dependency and construction check fails; old packet cannot be sanitized/reused. |
| Introduce a new review domain and assert it proves server origin | Domain provides separation, not custody. Same controlled issuance requirements still apply. |
| Public case page, signed URL or personally varying unused JSON field | Full representation qualification fails even if legal extracted text is identical. |
| Fresh fetch fails, then fall back to cached body or another representation | Every required fresh retrieval is mandatory; no subset/cached-success fallback. |
| Retire a cell/profile while replaying a historical receipt | Historical interpretation is separate from current eligibility; receipt cannot start a new execution. Detected invalidation aborts an in-flight chain. |
| Clone a composition seal/fact or restore it from JSON | Exact private seal/object custody is missing; matching bytes/fingerprint is insufficient. |
| Custody says “validity null” because parsing failed | No bound asserted is an explicit trusted derivation result; parse failure/unknown stays blocked. |
| Reuse an old “current” verdict as freshness at later acceptance | Historical proof states only its reference time; F8 remains separate. |

## 12. Trust-source matrix

“Hint” means an optional external scheduling/research suggestion outside the trusted input graph. It is discarded as an authority source; a correct hint does not excuse independent server selection. Hints are not retained in these artifacts. The private producer itself accepts no hint DTO.

| Field/value | Trusted source | Caller hint permitted? | Caller authority? | Necessary immutable server artifact | Failure if unavailable |
| --- | --- | --- | --- | --- | --- |
| Global cell / ID / version / scope | Independently admitted global corpus and its eligible selection | Existing public cell locator only; no new scope admission | **Never** | Cell definition + admission + eligibility snapshot | `custody_missing` / `scope_mismatch` |
| Evidence version IDs | Exact eligible-version selection resolving accepted custody | External research hint only; cannot select versions | **Never** | AcceptedEvidenceCustody + selected manifest + full preimage | `custody_missing` / `identity_drift` |
| Original retrieval/validity times | Original server completion and qualified deterministic validity derivation | No authority-path hint | **Never** | Original observation + validityOrigin + acceptance binding | `custody_missing` / `freshness_gap` |
| Source/content/representation/profile IDs and versions | Original bound identity and current frozen catalog/qualification | External discovery hint only | **Never** | Exact item/representation/profile definitions, catalog snapshot and custody | `identity_drift` / `custody_missing` |
| Source content hash | Full original server response under pinned algorithm, then exact fresh equality | No | **Never** | Qualified original observation and hash contract; fresh ephemeral result | `representation_not_global` / `fresh_reproof_failed` |
| Exact support set | Code-owned selection definition and eligible-version snapshot | No authoritative list; external suggestions ignored for membership | **Never** | SelectedSupportManifest and every required custody pin | `support_set_mismatch` |
| Fact kind / requirement type | Global selection definition; checked against scope and actual extractor output | External requested topic only | **Never** | Selection definition + actual output/fact-schema contract | `custody_missing` / kind/type mismatch |
| Evidence quality | Selection definition, checked against actual primary/composed provenance | No quality-authority hint | **Never** | Manifest + eligible executed extractor/policy contracts | `custody_missing` / quality rejection |
| Extractor selection | Frozen code-owned registry and existing unique selector; primary after MIME, composition before HTTP | No | **Never** | Registry snapshot + selected definition/output/schema pins | Existing missing/ambiguous selector failure |
| Policy selection | Existing phase A's unique code-owned pair; explicit null for primary | No | **Never** | Policy registry/definition + actual frozen selection + checked phase-B result | Existing missing/ambiguous policy failure |
| `reviewPacketKey` | New server proposal-null construction, exact existing v3 algorithm | No | **Never** | AutonomousReviewConstruction + its safe dependency closure | `proposal_not_null` / `custody_missing` |
| `serverReferenceTime` | One trusted live proof clock capture | No | **Never** | Pinned clock/freshness contract; value in immutable proof/receipt projection | `freshness_gap` |
| Fresh retrieval completion data | Actual server-owned retrieval in this invocation | No | **Never** | Qualified frozen transport/profile contracts; immutable observation projection at success | `fresh_reproof_failed` / `freshness_gap` |
| Candidate fact / fact hash / candidate binding | Actual deterministic canonical output, with exact scope and manifest; actual seal for composition | Proposal allowed only in separate untrusted research path | **Never** | Executed definitions, canonical fact/schema/output pins and #855 bindings | Incomplete/invalid fact, scope/support mismatch |

Fresh retrieval objects and the live authority result are ephemeral invocation inputs, not reusable historical artifacts. Their safe value projections can be immutable historical dependencies without preserving their live authority. Nothing here calls for storing an auth identity or raw body.

## 13. Authority/capability matrix

Every **No** below applies even to a genuine server-issued historical object with a valid fingerprint.

| Possessed value | Evidence acceptance | Extraction | Rule acceptance / F8 | Persistence | Provider activation | Permitted role |
| --- | --- | --- | --- | --- | --- | --- |
| `globalCellId` / definition pin | No | No | No | No | No | Locate/compare an independently selected public definition. |
| Evidence `versionId` | No | No | No | No | No | Identify exact historical content after independent custody resolution. |
| Custody object ID / pin | No | No | No | No | No | Historical origin dependency, never a resume token. |
| `reviewPacketKey` | No | No | No | No | No | Checksum of exact safe or unsafe review material; key alone does not distinguish them. |
| Support manifest ID / pin | No | No | No | No | No | Identify selection history; live execution must establish its own authorized selection. |
| Hash / fingerprint / receipt | No | No | No | No | No | Integrity/value identity and historical audit only. |
| F7 proof witness / serialized proof / private-seal lookalike | No | No | No | No | No | No executable authority; public witness remains its existing narrow projection. |

The future private producer must receive the **actual trusted objects** in the controlled server invocation: independently selected cell/admission, resolved custody versions, frozen manifest/catalog, safe review/proof, actual retrievals and actual deterministic fact/seal. An exported DTO parser, an arbitrary ID lookup or a matching object shape cannot manufacture this context. A trusted loader's exact-ID resolution is allowed only *after* independently authorized server selection established that exact binding; the incoming ID is never the grant or selection source.

Existing role/capability checks are still necessary, but an authorized caller's submitted metadata is still untrusted. Separate operation authorization, origin custody, semantic validity, freshness and completeness are all required. `regelKandidatAkzeptieren` remains the sole canonical Rule acceptance constructor; this slice does not call it, authorize F8, add a constructor or relax store restrictions.

## 14. Privacy classification and historical dependency interface

G = independently global public regulatory categories; C = non-personal code/definition/selection identity; O = minimal global server observation. The cell/scope/category basis is G. Source definitions, qualification, selection/executable/schema contracts are C/G. Qualified original/fresh times and full-response hashes are O/G. Fact values are canonical G output. Every hash inherits **all** of its preimage's classification.

Exclude user/traveller/trip IDs; passport/document numbers; MRZ; birth date; personal residence history; request/session IDs; IP; cookies; prompts; model conversations; traveller free text; secrets; tokens; raw responses and **hashes of PII or model/prompt material**. Do not hide these in corpus IDs, artifact names, URLs, query strings, validity locators, comments or opaque payload digests. Work-session/model/effort evidence in delivery documents is operational authorship evidence, never a proposed runtime provenance field.

Later historical resolution must be able to retrieve the exact immutable cell definition/admission, original observation/validity/accepted-origin custody, selection definition/eligible-version snapshot/selected manifest, safe review construction and representation qualification, together with #855's existing catalog/executable/schema/proof/freshness closure. Each edge is an exact pin or validated immutable embedded value. Missing bytes mean incomplete historical audit; no live fetch or `current` join can fabricate the historical dependency.

The minimal **logical dependency binding** from a production result to these additional artifacts is `{receiptFingerprint, globalAdmission, selectedSupportManifest, autonomousReviewConstruction}`. All three artifact references are exact pins; the manifest resolves every custody and qualification dependency and exact cell. This immutable binding is issued only by the trusted producer alongside that particular receipt after success, not attached later from caller IDs. Verify that its receipt cell, support preimages, metadata and review key equal the referenced artifacts. Its own canonical digest binds those fields; it is historical linkage, never an additional permission or a second accepted Rule.

This specifies only what must remain historically referenceable. It chooses no location, table, access policy, transaction, transport, lifetime or retention mechanism. **#859 owns those choices.** #855 receipt v1 bytes/preimages are not silently changed to insert new fields; the dependency binding is a separate logical artifact. If a later producer or persistence design instead needs new payload fields, it must explicitly version the receipt contract and undergo independent review. Neither slice may treat an absent origin edge as implied trust.

Version drift changes definitions/pins and forces a new admission/selection/execution as appropriate. It never rewrites historical metadata, maps an unknown schema to a newer implementation, or recalculates old fingerprints under new algorithms. Present eligibility and historical interpretation remain separate. Semantic immutability is not a decision to retain forever.

## 15. Implementation candidate seams and remaining gates

The following exact candidate paths are **PROPOSAL / NOT IMPLEMENTED / NOT AUTHORIZED TO CREATE HERE**:

| Candidate path | Bounded responsibility if separately commissioned |
| --- | --- |
| `lib/readiness/official-truth-global-cell-admission-server.ts` | Independently admitted global definitions, current eligibility selection and exact canonical scope/origin checks. |
| `lib/readiness/official-truth-evidence-metadata-custody-server.ts` | Resolve exact historical custody and validate complete original observation/validity/accepted-origin closure; no opportunistic Evidence acceptance. |
| `lib/readiness/official-truth-support-selection-server.ts` | Code-owned exact required-support selection and immutable manifest; no caller list authority. |
| `lib/readiness/official-truth-global-representation-qualification.ts` | Closed versioned qualification contracts associated with profiles; no actual source/profile qualification or registration in this slice. |
| `lib/readiness/official-truth-autonomous-review-material-server.ts` | Construct safe proposal-null material/identity from custody; no raw caller envelope promotion. |
| Existing `lib/readiness/official-truth-same-request-proof-server.ts` and `lib/readiness/official-truth-same-request-extraction-server.ts` | Future minimal internal integration retaining original custody, actual request URLs and composed execution context without a second catalog read or authority parser. |
| #855's proposed `lib/readiness/official-truth-autonomous-provenance-record-server.ts` | Consume actual admitted same-request objects and project the existing receipt plus exact historical dependency bindings; no F8/store action. |

No test, SQL, migration or store path is allocated by this task. Fact/applicability schemas are exact versioned code artifacts. This document neither imports #857 nor assumes its outcome. If #857 changes relevant contracts after merge, a future design rebinds compatible versions explicitly; existing scope semantics are not silently widened.

Remaining gates:

1. Independent ChatGPT / Technical-Lead review of #861's exact delivered head, CI/Preview and zero-overlap proof. Author classification is not independent PASS.
2. Separate TL consideration/dispatch of private producer and metadata-custody implementation design; it must close actual issuance/loader encapsulation, safe v3 seam, complete internal execution metadata and conformance cases before implementation is considered.
3. Separately reviewed original observation/validity and accepted-origin producer integrations. No preexisting submitted or stored material is assumed to have this origin; absence blocks production. Evidence-acceptance policy stays outside this design.
4. Separate global-corpus and source/profile/representation qualification, and extractor/policy registration/activation. No real cell, source family or accepted version is admitted by these documents.
5. #859's independently reviewed persistence architecture, exact immutable dependency resolution and any later authorized implementation. Separate Product-Owner/Security/Privacy retention/lifecycle decision; no duration selected here.
6. Separate Rule acceptance/F8 design and authority, preserving the one canonical constructor and current applicability/composed-branch guards; separate DB/Development/Production apply and provider gates.

The architecture closes the specified origin contracts for the bounded admitted domain: no traveller-derived cells, no untrusted original metadata, no caller support selection, no proposal/model preimages and no unqualified response hashes. The runtime mechanisms and downstream permissions remain unimplemented and gated, as required.

**GLOBAL_ADMISSION_METADATA_CUSTODY_ARCHITECTURE_READY_FOR_PRODUCER_DESIGN**
