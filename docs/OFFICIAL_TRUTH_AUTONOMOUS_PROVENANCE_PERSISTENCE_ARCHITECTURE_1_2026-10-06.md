# Official Truth autonomous provenance persistence architecture 1

Date: 6 October 2026 · Issue [#858](https://github.com/Jetnity/jetnity/issues/858) · Draft PR [#859](https://github.com/Jetnity/jetnity/pull/859)
Baseline: `main@7fb95414db6b7e4de12bea0df29b2c771081b9d4`
Status: **PROPOSAL / NOT IMPLEMENTED / DOCS ONLY / PRE-F8**

## 1. Decision and unchanged semantic boundary

Choose **Option 1: one immutable receipt object containing canonical UTF-8 payload bytes, one generic content-addressed immutable artifact store, and immutable dependency links checked against their canonical parents**. Prefer a single transactional private persistence boundary for these logical objects. Do not add an object-storage service or an application event store merely for this architecture.

The [merged #855 semantic contract](OFFICIAL_TRUTH_AUTONOMOUS_PROVENANCE_RECORD_ARCHITECTURE_1_2026-10-05.md), especially sections 3–12 and 15, is binding. Persist exactly its `AutonomousProvenanceReceiptV1`. This design adds no field to its payload, no new receipt hash, no accepted state and no replacement constructor. Artifact storage contracts below specify the immutable resolution interface explicitly reserved by #855. They do not supply missing execution facts or change receipt semantics. Every proposed entity, contract name, field outside that receipt, path and operation in this document is **PROPOSAL / NOT IMPLEMENTED**.

Receipt production remains success-only, globally scoped, immutable and conditional on trusted server custody. Traveller-derived scopes, personal preimages, non-null model proposals and unavailable immutable dependencies are rejected **before receipt creation**, not redacted by persistence. A later failed write does not turn the receipt into a failure record. A storage validator cannot certify origin by recognizing a shape or recalculating a digest.

Receipt existence, a correct fingerprint, verified historical integrity and a Rule reference authorize none of: extraction, Evidence acceptance, Rule acceptance, F8, DB writes or provider activation. They are not bearer capabilities. Historical observations do not establish current freshness. `regelKandidatAkzeptieren` remains the sole canonical Rule acceptance constructor. Retention/lifecycle remains a separate Product-Owner + Security + Privacy gate.

## 2. Evidence and current implementation limits

Repository observations are pinned to the baseline above. Hosted Development/Production statements below are reported by the live [#751 index](https://github.com/Jetnity/jetnity/issues/751), not independently queried databases.

| Read source | Consequence for this architecture |
| --- | --- |
| #855 architecture, report and handoff | Proposed receipt and pins are not implemented. Original Evidence metadata custody, global admission, executable pins, exact initial request URL and phase-A/B context remain producer prerequisites. Storage must not fabricate them. |
| `lib/readiness/official-truth-store-server.ts` | Existing dormant writer consumes separately accepted values and calls `official_truth_store_accepted_v2`. Applicability schema-1 facts are refused before persistence. This RPC is not a provenance store. |
| `lib/readiness/official-truth-content-identity.ts` | Support identity has seven fields; Evidence lookup is `evidence-key:v3:` and version is `ev2_` plus 32 hex digits. Catalog includes items, representations and profile availability. A profile availability pin is not executable verifier authority. |
| `official-truth-source-catalog-server.ts` | One response supplies the catalog. Current item/representation/profile eligibility and blocked domains affect live validation; historical receipt resolution cannot call this current-state gateway. |
| Extractor and composition registries | Production registries remain empty. Selection uses complete manifests and the actual executed definitions. Composition assignments are bounded at 64; support count at 8. A receipt cannot be reconstructed later from the outer seal alone. |
| Content identity v2 migration and catalog hardening migration | Existing private tables, restricted service RPCs, exact version constraints, immutable triggers and RLS/FORCE RLS provide patterns, not reusable provenance semantics. Current catalog checks include current eligibility; copying their lookup path would not make an independent historical archive. |
| Live #751 top section | Main/mode match baseline/NORMAL; #857 and #859 were authorized at startup. Prepublication #751 additionally names the disjoint docs-only trust-architecture writer #861. Development hardening has been applied; Production Official Truth v2 remains absent. Older lower index paragraphs contain stale next-step/writer text. |
| [#294](https://github.com/Jetnity/jetnity/issues/294), [#741](https://github.com/Jetnity/jetnity/issues/741) | Unknown/stale is not not-required; source/model boundaries and separate F8 authority remain. Neither issue grants this slice an apply or acceptance operation. |

Relevant schema evidence: `supabase/migrations/20261004010705_official_truth_content_identity_2.sql` and `20261004223959_official_truth_v2_catalog_hardening_1.sql`; continuity: [v2 report](OFFICIAL_TRUTH_CONTENT_IDENTITY_SCHEMA_RPC_V2_1_REPORT_2026-10-04.md) and [hardening report](OFFICIAL_TRUTH_V2_CATALOG_PROFILE_EXACT_HOST_HARDENING_1_REPORT_2026-10-04.md). No existing schema, RPC, RLS policy or row is changed.

## 3. Logical entities, keys and authority

The following are logical records, not SQL/table declarations.

| Entity | Required conceptual fields / key | Authority and invariants |
| --- | --- | --- |
| Receipt object | `recordFingerprint`: exact `ot-provenance-v1:` + 64 lowercase hex; `canonicalPayloadBytes`: bounded byte sequence; external `storageContractVersion: 1` | Primary/unique semantic key is the complete fingerprint. Canonical bytes are exactly `C(receipt.payload)` from #855. The fingerprint is stored outside those bytes. Storage version fixes byte transport/limits only, cannot select different receipt semantics, and is immutable for this object. No UUID or execution counter is needed. |
| Receipt discriminator projection | `schema`, `schemaVersion`, `canonicalization`, extracted from canonical bytes | Required for bounded dispatch/indexing, but compared to bytes before use. A conflicting column never changes the reader or repairs the payload. |
| Optional receipt search projection | Parsed JSON and only necessary extracted indexes, tagged with projection version and exact receipt fingerprint | Secondary, untrusted for integrity/authority. Default minimum omits full JSONB. A projection may be rebuilt in a separately authorized maintenance operation from verified bytes; never the reverse. |
| Immutable artifact | `id`, `version`, `digest` (the complete #855 Pin); `artifactType`, `artifactContractVersion`; `canonicalArtifactBytes` | Lookup by the complete Pin; byte identity by full digest. Unique semantic `(id, version)` binding across the store, and unique digest-to-byte-sequence binding. Type/contract columns are validated against canonical content/expected role, never independent interpretation switches. |
| Receipt dependency link | Parent exact receipt fingerprint, closed root-slot name, target complete Pin | Unique `(parent, slot)`. Mandatory stored link set equals the pins derivable from receipt bytes; cannot add authority or a new dependency. |
| Artifact dependency link | Parent complete Pin, contract-defined slot, target complete Pin | Unique `(parent, slot)`. Mandatory link set equals the references in the parent's hashed canonical manifest. A link cannot be added/removed/repointed while retaining its parent. |
| Optional operational insertion metadata | At most server insertion time and storage-format version if implementation demonstrates need | Outside semantic payload/digests; no request/session/user/actor/network identifiers or free text. No last-seen counter or retry history. Insertion time does not establish production time, acceptance or freshness. Privacy/lifecycle gate must assess even this correlation risk. Minimum design can omit it. |

An artifact `id` is a registered semantic name in #855's ASCII grammar, not a path, URL, user key or request ID. Versions are positive safe integers; existing narrower domain bounds still apply. Names have one contract/type meaning. Reuse of a name/version under a different type is an integrity violation, not a second namespace permitting replacement. Extractor/policy/profile semantic pairs remain their exact executed pairs. A snapshot gets a reviewed immutable identity/version from its producer's artifact contract; a build SHA or arbitrary execution ID is not an alternative. Persistence receives the already bound Pin and never allocates a new semantic version to rescue a conflict.

Complete Pins remain unique even though a storage engine could internally deduplicate equal blobs. `digest` is exactly 64 lowercase hex digits for the defined SHA-256 preimage; a truncated Evidence `versionId` is **not** an artifact digest. Hash collision checks compare bytes and identities; equality of a digest alone is insufficient.

## 4. Canonical receipt bytes

Let `B = C(payload)` using #855's `ot-provenance-json-v1`. Store **B exactly**, preferably as binary bytes. A text storage implementation is acceptable only if UTF-8 round-trip equality is proved across every driver/transport/backup path; binary storage avoids depending on text collation or re-serialization. Physical compression is permissible only as an exact reversible storage encoding, with bounds on decompressed bytes; it never changes B or its hash preimage.

Recompute exactly:

```text
recordFingerprint = 'ot-provenance-v1:' + lowercaseHex(
  SHA256(UTF8('ot-provenance-v1' + LF) || B)
)
```

`LF` is one byte `0x0a`. B has no BOM, layout whitespace, trailing newline or alternate serialization. It excludes the outer `recordFingerprint`. Preserve #855's UTF-16 key ordering, ECMAScript string escaping, safe-integer grammar, null semantics and specified set orders. Reject duplicate member names before normal JSON parsing loses them; reject invalid UTF-8/unpaired surrogates, negative zero, exponent spelling, unknown keys and noncanonical array order. Do not normalize Unicode, sort ordered request URLs, trim strings or round values on read. Parse, validate with the pinned contract, compute C, and require byte equality with B. A legacy receipt is never rewritten into a newer schema.

**JSONB alone is insufficient as the authoritative stored representation.** PostgreSQL documents that JSONB does not preserve key order, whitespace or duplicate keys and can change number output. These properties prevent it from attesting the original canonical bytes or detecting all malformed input after normalization. See [PostgreSQL JSON types](https://www.postgresql.org/docs/18/datatype-json.html). JSONB indexes may help find a candidate fingerprint; the reader then loads and validates the original bytes. Casting JSONB back to text is never the canonical source. Even a correct projection cannot overwrite or substitute for missing B.

All derived digests in #855 remain checked: `factHash`, `candidateBinding`, `proofIdentity`, extractor selection key, composed pre-HTTP/result identity and existing scope/Evidence keys. Their algorithms are the exact pinned historical algorithms, including the existing `JSON.stringify`-based v3/ev2 algorithms; do not apply C as a replacement for those preimages. `reviewPacketKey` is retained as a bound opaque historical key: no raw review packet, proposal or omitted preimage is recreated to claim an independent full reproof of that key.

## 5. Generic immutable artifact store and byte contracts

Choose **one generic store with a closed, versioned set of typed codecs**. All artifact kinds need the same exact-byte, uniqueness, transactional-insert, privacy and dependency checks; splitting them into many stores would duplicate those rules and complicate atomic closure publication. Generic storage does not mean arbitrary JSON, dynamic plugins, opaque unbounded payloads or one generic semantic parser.

The Pin digest is SHA-256 over the complete canonical immutable artifact representation, using C for the JSON representations here, with full lowercase hex output. It is not the receipt H-domain. This supplies the artifact-byte interface reserved by #855; existing source-content, Evidence, scope and review digests are unchanged. The following proposed codecs must be separately implemented/reviewed before any receipt producer can use their artifacts.

1. **Global definition is the binding exception:** its entire representation is exactly `C({id, version, scope})` as required by #855 section 3. Do not wrap it or append a manifest field and change its digest. It is a leaf. Its type/contract is fixed by the receipt root role and the version-1 artifact codec, not a mutable catalog entry. The scope algorithm is already supplied by the separate proof/fact contracts.
2. **Other artifacts use a versioned canonical manifest:** the closed outer shape is conceptually `{artifactType, artifactContractVersion, id, version, content, dependencies}`. Type is from the closed categories below; contract version is explicit; id/version must match the Pin. `content` is validated by that exact type/contract, not an arbitrary map. `dependencies` is an ordered list of `{slot, pin}` with exact-key parsing; slots are defined by that contract and resolve to the same references used in its content. Hash every byte of the complete manifest, including dependency Pins. A dependency list may be empty only for a contract-defined leaf. No digest of itself is inside the manifest.
3. **Executable implementation leaves:** a closed implementation artifact retains an exact bounded immutable release bundle as canonical base64 plus its fixed encoding/media contract; referenced external implementation dependencies must be separate exact Pins in a parent manifest. The bytes must cover the reviewed behavior and dependencies, not function `toString`, a Git URL, package range or installation instruction. A cyclic module group can be captured as one bounded immutable bundle, not a cycle in the artifact graph. A larger bundle is refused, not silently replaced by a code label. Historical integrity verifies these bytes but never executes them.

All manifest fields are artifact/storage representation, not new receipt payload fields. No authentication grant, acceptance flag, traveller metadata or fresh-source observation may be added through `content`. If a concrete artifact cannot be fully represented without such a new receipt semantic field or a reinterpretation of #855, STOP and report the gap; do not extend the payload.

| Artifact category | Complete immutable content and outgoing references |
| --- | --- |
| `global_cell` | Exactly the three-field global definition; no dependency list added. |
| `catalog_snapshot` | The actual frozen graph used by proof: complete sources/classes/exact domain restrictions and blocked domains, item/external/publisher/authority descriptors, every versioned representation with ordered request URLs/final URL/media/locale/schema, and profile availability. Bind each included profile pair to its exact `identity_profile` Pin. Retain historical eligibility as snapshot data, not mutable current authority. No second catalog read and no selected-items-only truncation. |
| `identity_profile` | Exact profile pair, verifier contract and exact implementation/dependency Pins. Database availability pins alone cannot supply this artifact. |
| `extractor_registry` / `policy_registry` | Complete validated selection manifest, historical eligibility, and exact definition Pins for all included definitions needed to assess selection. Never keep only the winner. Definition behavior and eligibility snapshots are distinct: eligibility changes create another snapshot, not edited definition bytes. |
| `extractor_definition` / `policy_definition` | Complete executed semantic descriptor, exact matcher/extractor or policy behavior/dependencies; source/schema families, item constraints, schema/output pins and policy relationship as applicable. Selected pairs must equal receipt scalars. No live function object. |
| `fact_schema` / `applicability_schema` / `output_contract` | Exact parsing, normalization, shape, target/locator and citation rules for the version used, plus exact implementation references where required. A schema-2 implementation in #857 is not automatic support for a historical schema-1 pin. |
| `proof_contract` / `freshness_contract` | Historical proof/retrieval/identity, scope, key and freshness algorithms with executable dependency Pins. These specify interpretation, not live authority state or a permission snapshot. |
| `implementation_bundle` | Qualified non-personal exact code/dependency bytes with closed encoding contract; no source response, credential, build environment or runtime log. No outgoing edge for a self-contained leaf. |

A manifest dependency is part of the parent's digest preimage. Therefore a separately stored edge list cannot be rebound without detection. A new outgoing edge or changed implementation produces new artifact bytes/digest and requires a new semantic version for that id; a receipt referencing changed pins receives a new fingerprint. Already accepted existing artifact byte contracts, if any are introduced before implementation, must be checked explicitly against this proposal; there is no silent envelope migration.

No signing/HMAC is required for this minimal integrity design. Integrity hashes detect inconsistent content against pinned identities; they cannot establish server origin or defeat an attacker able to replace every root and trusted reference. Server custody, separate authorization and restricted storage access remain necessary. A later authenticity/signing requirement needs its own threat model and key-management design.

## 6. Exact roots, transitive closure and link integrity

Derive direct dependencies **only** from these existing payload slots; there is no new root-manifest field in the receipt:

| Root slot | Count |
| --- | --- |
| `globalCell.definition` | 1 |
| `candidate.factSchema` | 1 |
| `candidate.applicabilitySchema` | 0 for null legacy, otherwise 1 |
| `extractor.definition`, `extractor.registrySnapshot`, `extractor.outputContract` | 3 |
| `policy.definition`, `policy.registrySnapshot` | 0 for primary/null policy, otherwise 2 |
| `proof.contract`, `proof.catalogSnapshot`, `proof.freshnessContract` | 3 |

There are 8–11 root references. An identity-profile artifact is a **transitive** dependency through the exact catalog snapshot, not an unbound lookup of `supports[].binding.identityProfileVersion` in today's registry. Receipt support bindings must match the matching exact item/representation/profile descriptors in that snapshot. Full source bodies and raw Evidence rows are not dependencies: the compact Evidence identity preimage already exists in the receipt; no Evidence lifecycle row or model review packet is fetched to supplement it.

The complete graph consists of receipt root links followed by every dependency in every reachable canonical artifact. A receipt closure is the least fixed set reachable from these roots; no extra unsolicited artifact belongs to it. The receipt's root Pins plus recursively hashed manifests already commit to the full closure. No additional independent closure digest/manifest is needed on the receipt, avoiding two competing authorities.

Rules:

- Sort root links by their closed slot names and artifact edges by the contract's canonical slot order (UTF-16 code-unit order for named slots). Set-valued descriptor collections use exact immutable identity order; intrinsically ordered data such as request URLs retains its original order. A codec specifies ordering and cannot sort away meaningful differences.
- A slot is unique within its parent. Duplicate link rows, duplicate manifest slots or conflicting Pins for one semantic id/version are invalid before deduplication. Duplicate support/target rules remain #855's stricter rejection rules.
- Sharing the same complete Pin through different legitimate slots/parents is allowed and counts one stored artifact. Keep all distinct role edges. A shared artifact must satisfy every referring slot's expected type; sharing is not a type-coercion escape.
- Validate artifact bytes, id/version, digest, contract and outgoing references before using them. Compare the exact expected edge set with stored links in both directions; missing, extra or repointed links are integrity failures. Do not trust edge tables to define what should have been referenced.
- Reject cycles, including self-edges. Use bounded traversal with active-path cycle detection; a previously completed shared node is not a cycle. Enforce the **longest** root-to-leaf depth in the DAG, not merely the first path encountered. Dedup/visited caching must not conceal a deeper path or bypass resource accounting.
- Receipt is depth 0; each direct artifact is depth 1. All graph/node/edge/byte limits in section 7 apply. Resolve by exact immutable Pin only, using a consistent committed read snapshot. No query to `current`, `latest`, current main, current executable registry, current Catalog Rows, display names or a remote source URL is permitted.

Frozen `current:true/false` inside an original catalog/selection manifest and #855's `evidenceFreshnessAtReference:'current'` are historical values already required by #855. They are never updated or interpreted relative to the present. This differs from a mutable current pointer used to select historical content.

## 7. Technical bounds and failure before publication

These are proposed version-1 **storage admission** limits, not increased runtime or legal-fact limits. They intentionally allow a smaller persistable subset if a valid future runtime graph is too large. Reject an oversized receipt/closure without trimming, replacing roots or altering its semantic bytes. They are not retention durations or source-fetch budgets.

| Resource | Maximum | Basis / enforcement |
| --- | --- | --- |
| Receipt canonical B | 262,144 bytes (256 KiB) | Compact fact, at most 8 supports, Pins and structured citations; no bodies. Several times the existing 65,536 source-text bound, without admitting that text into storage. Measure UTF-8 bytes, not JS string length. |
| Direct references | 11 | Exact root-slot derivation above; no extension bag. |
| Unique artifacts in complete closure | 256 including direct artifacts | Leaves space for existing maximum 128 profile definitions plus selected/registry/schema/implementation dependencies. This is a cap, not proof every possible runtime registry fits. |
| Transitive artifacts beyond roots | `256 - N`, where N is distinct root-artifact count | Enforce the same total cap even with shared roots/paths. |
| Dependency edges | 1,024 including receipt links | At most 256 per artifact, also subject to stricter typed slot/cardinality bounds; all role edges count. |
| One canonical artifact | 1,048,576 bytes (1 MiB) | Bounds complete manifests and qualified implementation bundles. Oversized full catalogs cannot be replaced by winner-only snapshots. |
| Sum of unique closure artifact bytes | 8,388,608 bytes (8 MiB), excluding B | Bounds one verification/atomic insert. Count canonical bytes including manifests, not compressed size. Separate at-most-256-KiB B bound still applies. |
| Longest closure depth | 8 edges from receipt | Enough for receipt → registry/catalog → definition/profile → implementation/dependencies; no unbounded package import traversal. |
| Decoder structural nesting | 32 per receipt/artifact JSON value | Independent of graph depth; existing scope/fact expression bounds remain stricter. Byte limits bound token work as well. |

Existing #855/runtime limits remain: primary has exactly 1 support; composition 2–8 unique items; composition assignments ≤64; extractor observations ≤256; applicability depth 4, nodes 16, operands 8, branches 8 and visa options 4. Catalog ceilings are 1,024 item versions, 4,096 representations, 128 profiles and 16 request URLs per representation. Storage caps do not assert that those theoretical maxima all fit in 1 MiB/256 nodes; an actual complete snapshot must fit **all** applicable limits or be refused. Changing storage bounds later requires an explicitly reviewed reader/storage-contract version; it never retroactively rewrites a receipt.

Preflight bounds before allocation, parsing or recursion, and count raw input artifacts/links before dedup. For one insert accept at most 256 unique artifact objects, no duplicate submitted artifact entries, at most 1,024 submitted links and at most 8 MiB of artifact bytes. Do not accept an unbounded duplicate list that later shrinks to a valid set. Future transport encoding (including base64) needs matching bounded wire-size enforcement; unbounded streaming/auto-pagination/decompression is forbidden. The reader stops before fetching the first over-limit child and never follows arbitrary locations.

## 8. Append-only insertion, conflicts and atomic visibility

Conceptual private operation: insert an already eligible server-produced receipt plus its complete exact immutable closure. This is not an implemented method/RPC and accepts no browser-submitted provenance as authority.

1. Independently authorize the server write operation. Require producer custody and all #855 origin/privacy preconditions; validate bounded closed bytes, derived digests, exact closure and links. Never infer write permission from a fingerprint. Do not make Evidence or Rule acceptance a side effect.
2. Within one atomic persistence boundary compare/insert artifacts and links in deterministic key order, then compare/insert the receipt and root links. Protect uniqueness and complete-closure invariants under concurrent writers, not just a preflight read. No semantic upsert/update is available. A receipt becomes visible only with its complete verified closure; readers see the old or new committed state, never a pending half-receipt.
3. Equal keys are compared byte-for-byte, including canonical manifests and derived link sets. Concurrent identical insertion may return `idempotent` only after the committed winner and complete closure verify. A conflict aborts the operation, not a partial receipt with a mutable failure/complete flag.
4. For exact receipt retry, also verify existing closure integrity. A present receipt with a missing/corrupt dependency is not an idempotent success. Do not overwrite/repair it or reload current artifacts during retry. Any authorized recovery/restoration policy is a later lifecycle decision.

| Comparison | Required outcome |
| --- | --- |
| Same receipt fingerprint + same canonical bytes + same complete verified closure | `idempotent`; same immutable receipt, not a second recorded execution. |
| Same fingerprint + different B | Integrity violation; do not overwrite either object or mint a storage alias. |
| Same artifact id + version + digest + bytes + contract | Idempotent identical object; shared references allowed. |
| Same artifact id + version + different bytes or digest/contract | Integrity violation, even if new bytes have a valid different digest. Requires a new artifact version in a separately trusted production. |
| Same digest + different bytes | Integrity violation/collision; no hash-only deduplication. |
| Manifest/link mismatch, cycle, unsupported contract or bound violation | Reject before any committed receipt; no fallback or partial success. |
| Same bytes presented under inconsistent embedded identity/type columns | Integrity violation. Storage labels cannot reinterpret a blob. |

Logical guarantees must cover UPDATE, DELETE, TRUNCATE, conflict-update, cascading deletion and privileged bypass within ordinary application capabilities. Append-only means **append-only while retained**; a privileged database owner remains outside the claimed application enforcement boundary. No lifecycle-delete route or policy is invented here. If artifact insertion is ever moved to another physical service, an independently reviewed publication protocol would be needed; a best-effort cross-service write is not this selected minimal design.

There are no mutable `accepted`, `superseded`, `current`, `active`, `fresh`, verification-result or acceptance-error fields on the receipt. A corrected fact/support/time/pin changes the payload and therefore requires a new receipt/fingerprint. Old bytes remain unchanged while retained. Storage retries do not change insertion metadata or freshness. A failure does not create a persistent failure receipt, log payload or error archive.

## 9. Historical integrity reader

The proposed reader has read-only credentials/capabilities, bounded exact-key retrieval and a versioned codec catalog independent of current executable/source registries. Supported historical codec implementations are explicitly mapped to their exact contracts/Pins; an artifact archive alone does not make an unknown decoder executable. No archived code is dynamically imported, fetched, installed or run as an extractor/verifier.

Algorithm:

1. Validate the exact fingerprint format and load that exact receipt. Read bounded B and discriminator columns without trusting search projections. A genuine missing root is distinguished internally from transport/access failure; never turn a failed query into an empty or successful audit.
2. Strictly decode B, detect duplicate keys and check receipt schema/canonicalization/version. A structurally readable but unknown version is `unsupported_version`; known-version malformed shape/bytes is `receipt_corrupt`. Compare discriminator columns with B. Never select a different parser merely because a secondary column says so.
3. Apply #855's exact canonical serialization and require `C(parsed payload) == B`; recompute `recordFingerprint` from B and require equality with both lookup and stored key. Check local closed shapes and support/target duplicate rules before traversal.
4. Derive the 8–11 root links. Validate the stored link set against that derivation. Traverse the immutable closure within all limits, loading by exact id/version/digest. Recompute each artifact hash, validate canonical form, embedded identity, expected type/contract, typed content and manifested edges. Verify profile/descriptor tuples against the historical catalog, not current rows. Missing artifact means `dependency_missing`; incorrect bytes/digest/identity/edge/cycle/closure bounds mean `dependency_corrupt`. A recognized envelope with an unknown contract/version means `unsupported_version` after its byte/hash identity is checked.
5. With the verified exact historical codecs, recompute #855's fact/scope, support Evidence version, candidate, proof, selection and composition-result bindings. Validate assignment/citation/branch/atom relationships, exact support set, global-definition equality, schema pins, policy/null semantics and recorded time ordering. Reproduce only the **historical** freshness predicate at `serverReferenceTime` where its pinned contract supports that check. Do not reevaluate at now or fetch a page. A mismatch of the receipt's derived semantics is `receipt_corrupt`; a malformed artifact contract instance is `dependency_corrupt`.
6. Return one bounded result. No callback to producer, source retrieval, Evidence acceptance, Rule acceptance, F8, store writer, projection repair or current registry exists on this path. A `valid` result is not cached into a mutable `verified`/`fresh` receipt flag.

The integrity-result vocabulary is exactly:

| Result | Meaning |
| --- | --- |
| `valid` | Known-version retained bytes, all expected immutable dependencies and independently checkable relationships are historically consistent. No origin/acceptance/current-freshness assertion. |
| `receipt_corrupt` | Root unavailable or invalid, or its checkable bindings/canonical bytes/fingerprint disagree. For absent receipt use fixed detail `receipt_absent`; this means no root to verify, not proof of malicious modification. |
| `dependency_missing` | An exact required artifact cannot be found in a successful authorized storage read. No inference about why it is absent. |
| `dependency_corrupt` | Artifact bytes/identity/hash/typed content or required link/closure invariants disagree. Includes missing/extra link rows when the canonical parent establishes the expected set. |
| `unsupported_version` | Well-identified but unsupported receipt canonicalization/schema or artifact/codec version. No current-code fallback. |

A denied/timed-out storage call is an **operational read failure outside the integrity verdict**, not a sixth integrity classification and not `dependency_missing`. It produces no successful verification result. All five verdicts use only a fixed reason code, the requested fingerprint and optionally one closed root/edge-slot code; no raw corrupt value, PII, arbitrary path, body or unbounded error list. Deterministic traversal uses sorted roots/edges and reports its first failing invariant; success requires every invariant. If the receipt itself cannot be parsed, do not continue to artifact errors. No signing/key possession is inferred from any verdict.

Audit limits are deliberate: no raw government bodies, phase-B raw observations, complete review packet or original private seal is retained. Thus `valid` cannot re-prove source authenticity, originally trusted metadata selection, original same-object execution, raw body hashing, the omitted review-key preimage or historical operator authorization. It verifies retained identities/relationships, and does not replay extraction or promote a internally consistent invented receipt to truth.

## 10. Rule reference and access boundaries

A later separately accepted immutable Rule version may have a provenance relationship consisting of its exact Rule-version identity and this exact `recordFingerprint`. It belongs to the later Rule/acceptance storage contract, outside the receipt. The relation must bind the Rule's canonical fact, regulatory cell and exact supports to the corresponding receipt, never just a same-scope match. It does not create/accept a Rule or authorize a write. No `accepted=true` field, claim ID or acceptance timestamp is backfilled into an existing receipt. Rule supersession belongs to that later lifecycle.

Receipt existence != Rule accepted. Receipt validity != Rule accepted. Historical integrity != current freshness. A later F8/acceptance operation must independently consume the live trusted candidate, exact fact/seal, Evidence, registry and separately authorized fresh execution. `regelKandidatAkzeptieren` remains the only constructor. Nothing here changes its inputs or schema-1/composed-branch restrictions. A foreign key or checked hash is a relationship constraint, not an approval predicate. No browser can submit a receipt to resume trusted execution.

| Principal/surface | Proposed minimum boundary |
| --- | --- |
| `anon`, normal authenticated traveller, browser/client | No direct receipt/artifact/link writes, updates or deletes; no direct historical reads by default. Logged-in status is not authority. No public receipt-upload/validate-and-promote route. |
| Private authorized producer/writer | Server-only; separate write authorization, origin/privacy validation and narrow insert operation. No arbitrary table DML or retry-repair API. Credentials remain server-held. |
| Historical server/admin reader | Explicit read authorization and exact-key bounded reads; distinct read-only capability from writer. No acceptance or mutation capability returned. |
| Service RPC, if later selected | Minimized execution grant, fixed/qualified object resolution, explicit privilege checks, atomic bounds and validation. Service-role possession/RPC execution alone does not certify producer custody. Avoid broad grants and default-public execution. |
| Storage maintenance/migration operator | Separate reviewed authority; must preserve canonical bytes and existing semantic identities. No implicit lifecycle-delete permission in application roles. |
| Future public provenance display | Separate Product/Privacy gate, minimization and deliberate API/UI design. Not opened by this architecture. |

Use private unexposed storage, minimal grants and RLS as defense in depth; consider the existing FORCE RLS pattern in the separate SQL design. An RLS policy alone does not constrain every privileged role. Supabase documents that service keys can bypass RLS and must not be exposed to clients: [RLS documentation](https://supabase.com/docs/guides/database/postgres/row-level-security). The implementation review must examine effective grants, function ownership, bypass roles and mutation paths together. No RLS policy, role, view, trigger or RPC is created here, and no shared Supabase credential is read.

## 11. Privacy and reserved lifecycle questions

The only admissible content classes are #855's public global regulatory semantics, non-personal immutable code/catalog identity and minimal global execution observations. Apply admission transitively to every manifest, bundle, scope key, Evidence/review key and source-content hash preimage. A content-addressed store is not a way to archive rejected data. Publicly accessible source material is not automatically non-personal. Code bundles must exclude author/user metadata, environment/config secrets and source maps or dependencies carrying personal data unless an independently qualified non-personal representation already exists; do not sanitize after pinning and keep the old digest.

Forbidden in receipts, artifacts, links and insertion metadata: `userId`, `travellerId`, `tripId`, `sessionId`, `requestId`, IP, Cookie, passport/document numbers, MRZ, birth date, prompts, model conversations, raw government bodies, screenshots, secrets, tokens, personal correlation keys and hashes of any PII. Workflow session/model/effort in this docs delivery are not receipt fields. Reader failure output and diagnostics cannot echo rejected bytes.

This slice chooses no retention duration, deletion deadline, legal basis, backup period, archival tier, erasure behavior or tombstone policy. **Append-only while retained** is a content-integrity rule, not a decision about how long to retain anything.

The separate Product-Owner + Security + Privacy Retention/Lifecycle Gate must decide, before implementing real persistence/operating it:

- Purpose and lawful/privacy basis of each retained class, including global execution timestamps and optional insertion metadata; whether each is necessary.
- Which receipt/artifact/link/Rule-reference classes are retained and for what approved periods, without assuming their lifetimes coincide.
- How shared artifacts and all referencing receipts/Rules are handled when availability changes; no automatic reference-count garbage collection or cascading deletion is authorized here.
- Who may perform lifecycle transitions, under which approval and access controls, and how recovery/restoration interacts with immutable identity and idempotency.
- Whether/how deletion, erasure, tombstones or proof of prior existence should be represented, and what unavailable historical verification means to users. No representation is preselected here.
- Backup/replica/export/restore behavior, access and location; how a restored system avoids silently reintroducing content contrary to the eventual lifecycle decision.
- Handling accidental PII/secret admission, including access restriction and authorized remediation; this docs slice invents no incident retention log.
- Private audit access, any later public display, and whether operational metadata belongs in another separately governed facility at all.

If lifecycle choices make any implementation proposal incompatible, revise that proposal before apply; do not mutate #855 semantics as a workaround. Missing retained evidence always remains unavailable to this reader; neither the reason nor a policy-compliant absence creates freshness or acceptance.

## 12. Alternatives assessed

| Criterion | Option 1: bytes + generic immutable artifact store + links | Option 2: fully denormalized receipt with all artifact bytes | Option 3: receipt points only to current catalog/application rows |
| --- | --- | --- | --- |
| Auditability | Exact root and recursively committed manifests; complete local historical audit while available. | A separate immutable storage package could be self-contained. Adding those bytes into #855's payload would change its schema/hash and is forbidden. | Cannot recover original eligibility, definitions, blocked domains or verifier behavior from a mutable current selection. |
| Integrity | Full byte/hash/id/version/link checks; one atomic publication boundary. | Same checks still required; duplication does not replace hash verification. Envelope manifest must bind the original receipt without changing it. | Current row FKs/IDs do not commit to historical byte closure; even immutable item rows alone omit full execution snapshots. |
| Duplication / size | Share identical artifacts; at most 256 KiB receipt and bounded 8 MiB artifact closure. | Repeats entire catalog/implementation closures per receipt; storage/transfer growth without added authority. | Small references, but only by losing the required historical evidence. |
| Versioning | Closed codecs and immutable pins; new version never rewrites old bytes. | Requires the same historical codecs plus package versioning; receipt expansion itself invalid. | Application migrations/current registry changes alter interpretation. |
| Historical independence | No current joins or main dependency. | Possible for a separate package with a complete closure, but no advantage for the minimal shared store. | Fails #855 and no-fallback requirement. |
| Privacy | Minimal scalar receipt; only qualified non-personal shared artifacts. | Multiplies copies/access surface; still cannot store raw bodies or PII. | Joining broader live rows can expose unrelated fields or personal context. |
| Failure behavior | Explicit missing/corrupt/unsupported; rejects partial publication. | One incomplete/corrupt package still fails; embedded bytes do not establish origin. | May silently report present-day data as historical truth; unacceptable. |

Option 1 is selected for the smallest uniform integrity model. Multiple artifact-specific stores have no demonstrated need here; typed contracts give validation without multiplying physical stores. Option 2 is rejected as a receipt-schema extension and unnecessary duplication even when interpreted as an external package. Option 3 is rejected after inspecting live catalog/current checks: it cannot meet historical independence. A future immutable snapshot implementation would effectively become Option 1 or 2, not rescue a current-row-only model.

## 13. Adversarial conformance matrix for a later implementation

These are design obligations, not tests added or executed by this slice.

| Case | Required result/invariant |
| --- | --- |
| Same receipt and complete closure inserted twice/concurrently | One immutable receipt; exact retry `idempotent`; no duplicate execution/last-seen count. |
| Same fingerprint, different bytes; simulated full-digest collision | Integrity violation, whole write rejected. |
| Same artifact id/version, changed bytes with a freshly recomputed digest | Integrity violation; new digest cannot overwrite a semantic version. |
| Same artifact digest, different bytes; type column relabelled | Integrity violation; no hash-only dedup or reinterpretation. |
| Key order/whitespace/newline/BOM/Unicode normalization/number spelling changed | Exact canonical byte check fails; never repaired from JSONB. |
| Duplicate JSON key, extra receipt field, omitted required null, malformed UTF-8 | `receipt_corrupt`; reject before ordinary parser loses information. |
| JSONB/search index disagrees but B is available | Projection never replaces B or grants authority; isolate defective optional projection. Required discriminator/link mismatch fails verification. |
| New schema/applicability/profile/codec version is unknown | `unsupported_version`; no current implementation or schema-1/schema-2 cast. |
| Root missing; storage unavailable | Fixed root-absent failure vs operational failure distinguished; neither produces `valid`. |
| Dependency absent; old version unavailable while newer exists | `dependency_missing`; no latest/main/registry/source fetch. |
| Artifact modified/truncated or required manifest edge removed/repointed/added | `dependency_corrupt`; no lazy repair. |
| Corrupt unused definition inside the actually used complete selection snapshot | Closure fails; retaining only the winning definition is not allowed. |
| Cycle/self-edge, deep shared DAG path, duplicated raw submissions | Reject cycles/duplicates; enforce longest depth and raw bounds before dedup. |
| One byte/node/edge over any storage bound, compressed expansion over bound | Refuse before publication; never trim the graph or store partial success. |
| New receipt insert crashes after artifact staging / concurrent conflicting writer | No partial committed receipt; complete atomic visibility and uniqueness required. |
| Retry existing receipt after dependency disappearance | Not idempotent success and not repair permission. |
| Two representations of one item; duplicate/foreign support; citation drift | Preserve #855 support/target rules; fail receipt consistency. |
| Change minimumPages/fact but reuse scope/review hash | Derived fact/candidate/record bindings differ; no same-scope substitution. |
| Latest catalog changes current eligibility/blocked domains | Historical bytes do not change; historical audit uses only pinned snapshots. Live eligibility remains separate. |
| Perfect forged receipt/browser replay/service RPC caller without custody | No write/extraction/acceptance authority. Historical consistency cannot prove server origin. |
| Traveller date/dual-citizenship cell or model proposal hidden only in a hash | Pre-producer privacy/custody admission fails; no receipt or artifact. |
| Personal code-bundle metadata, URL token, raw government body | No archive admission; no sanitize-and-keep-old-digest workaround. |
| Source now changed; historical verdict says current | Historical result only; no fresh-source or accepted Rule conclusion. |
| Rule reference exists / receipt later unavailable | Reference is not acceptance and cannot supply missing evidence; no receipt mutation. |
| SQL update/delete/truncate/cascade/conflict-update via ordinary role | Must be unavailable/rejected; privileged maintenance/lifecycle is separately gated. |
| Read verification detects corrupt projection/artifact | No repair/write side effect, no raw-value error or persistent failure receipt. |

## 14. Candidate implementation surfaces and separate gates

**PROPOSAL / NOT IMPLEMENTED** candidates only:

- `lib/readiness/official-truth-autonomous-provenance-record.ts`: exact #855 parser/canonicalization/historical semantics, if separately commissioned.
- `lib/readiness/official-truth-autonomous-provenance-artifact.ts`: closed codecs, immutable Pins and bounded graph validation.
- `lib/readiness/official-truth-autonomous-provenance-store-server.ts`: private byte-preserving transactional adapter, no acceptance constructor.
- `lib/readiness/official-truth-autonomous-provenance-history-server.ts`: read-only exact-fingerprint loader/validator.
- Logical private storage names: `official_provenance_receipts`, `official_provenance_artifacts`, `official_provenance_receipt_dependencies`, `official_provenance_artifact_dependencies`; optional secondary index projection only if justified. No table is created or schema name allocated by this document.
- Conceptual narrow operations: insert complete receipt+closure and read exact historical receipt+closure. No RPC signature or migration file is created; no update/delete/accept-from-receipt operation is proposed.

| Separate gate | Requirement |
| --- | --- |
| Independent exact-head review | TL verifies this docs delivery and its CI/Preview. Author classification/self-review is not PASS or Ready. |
| 1. Persistence implementation / SQL design | New bounded TL dispatch for exact codecs, uniqueness, transactions/races, privilege/RLS and byte-preserving transport design; validate the conformance matrix. No authority from this READY alone. Re-evaluate the lifecycle dependency before implementing actual storage. |
| 2. Retention / Lifecycle decision | Explicit Product Owner + Security + Privacy decisions on section 11. May be prepared separately from implementation design, but must be resolved before actual persistence implementation/operation where its choices matter and before apply. No implementation default consumes this gate. |
| 3. Development Apply + Verification | Explicit Product-Owner approval for the exact independently reviewed migration/apply scope and a named read-only verification phase; live environment precheck. Design approval or an unrelated earlier Development apply is insufficient. No plain db push. |
| 4. F8 / Acceptance integration | Separately versioned design/authorization and live trusted custody/freshness checks; sole canonical acceptance constructor. Storage success does not start this gate or satisfy it. |
| 5. Production Product-Owner Approval | Separate explicit approval and exact reviewed Production plan after prerequisite evidence; Development success is not Production permission. No Production activation plan is implemented here. |

Upstream global admission, trusted original metadata custody, producer implementation, immutable artifact/schema pin generation, qualified source/profile/extractor/policy activation and provider activation remain their own unresolved gates. No receipt can actually be produced by the current runtime merely because persistence architecture is specified. #857 retains all its runtime/test/docs ownership and does not implicitly extend this receipt contract.

## 15. Final classification

**AUTONOMOUS_PROVENANCE_PERSISTENCE_ARCHITECTURE_READY_FOR_IMPLEMENTATION_DESIGN**

Canonical storage identity, typed artifact closure, integrity, idempotency, mutation/access/privacy boundaries and historical failure behavior are specified without adding receipt semantics. READY means only that the Technical Lead may consider a separately dispatched persistence implementation/SQL-design slice, with the lifecycle relationship re-evaluated. It authorizes no SQL, migration, DB/Supabase operation, Development/Production apply, retention decision, Rule acceptance or F8.

PR remains Draft. No Ready, merge or follow-up.

**STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD EXACT-HEAD REVIEW.**
