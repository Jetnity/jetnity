# Official Truth autonomous provenance persistence SQL/RLS design 1

Date: 6 October 2026 · Issue [#864](https://github.com/Jetnity/jetnity/issues/864) · Draft PR [#866](https://github.com/Jetnity/jetnity/pull/866)
Baseline: `main@9adfc04ffe90693dedc059f07a396751a0625157`
Status: **DOCS-ONLY FUTURE DESIGN / NOT IMPLEMENTED / NOT APPLIED / PRE-F8**

## 1. Decision, inputs and scope

Translate the merged [#859 persistence architecture](OFFICIAL_TRUTH_AUTONOMOUS_PROVENANCE_PERSISTENCE_ARCHITECTURE_1_2026-10-06.md) into a single PostgreSQL transaction over private immutable records. Preserve the exact [#855 receipt contract](OFFICIAL_TRUTH_AUTONOMOUS_PROVENANCE_RECORD_ARCHITECTURE_1_2026-10-05.md), including its canonical bytes and fingerprints. Store the [#861 custody dependency binding](OFFICIAL_TRUTH_GLOBAL_ADMISSION_METADATA_CUSTODY_ARCHITECTURE_1_2026-10-06.md) separately, but require it for publication and historical validation of every receipt admitted by this storage contract.

Every new database name, signature, role, constraint, codec dispatch and algorithm below is a **future proposal**, not an existing database object or executable migration. The immutable [TASK](OFFICIAL_TRUTH_AUTONOMOUS_PROVENANCE_PERSISTENCE_SQL_RLS_DESIGN_1_TASK_2026-10-06.md) has blob `cd38da2954601cd2de73203920a808e6a09b658f`. Only the four TASK-authorized deliverables are authored.

The producer is an **abstract independently authorized private server caller supplying already-qualified receipt/artifact/custody objects**. Its selection, issuance, original-metadata loaders, actual fact/seal custody and successful execution are prerequisites, not mechanisms designed here. No unpublished #863 content is used. Storage validates retained values and relationships; it cannot establish origin by parsing a DTO, accepting a boolean or hashing it. No serialized authorization field is admitted.

There is no Evidence or Rule acceptance operation, F8 integration, runtime change, SQL file, SQL execution, Supabase access/apply, activation, Auth/AAL/capability change, Production action or follow-up. All lifecycle settings remain symbolic and unresolved. The database stores historical non-personal global regulatory material only after separate authorization; it does not become a second truth engine or a traveller store.

## 2. Live reconstruction and repository patterns

Initial live reads on 6 October 2026: `origin/main` is `9adfc04ffe90693dedc059f07a396751a0625157`; `.jetnity/operating-mode.json` is `NORMAL`; PR #866 is open/Draft at TASK-seed `d5953001bc8d94d05b7423f6f97fb9f509d7bb7f`. Main is its ancestor. [#751](https://github.com/Jetnity/jetnity/issues/751) explicitly permits the three disjoint Codex slices and retains TL-only Ready/merge. Its old lower “unstarted/no active writer” passages are historical. [#741](https://github.com/Jetnity/jetnity/issues/741) requires deterministic proof independently of model decisions and reserves persistent retention and Production gates. [#864](https://github.com/Jetnity/jetnity/issues/864) narrows this work to storage design.

| Merged input | Live merge commit | Used contract |
| --- | --- | --- |
| #855 | `e00f5f98775b0271749d955df5b493c8ae8589c8` | Exact receipt v1, canonicalization C, Pin grammar, semantic hashes and trust/privacy limits |
| #859 | `9adfc04ffe90693dedc059f07a396751a0625157` | Byte store, generic typed artifacts, immutable links, bounds, retry and five historical verdicts |
| #861 | `75251131fa91020e5b5a46e484c92028ca9739ae` | Existing logical custody objects, their exact byte envelopes, additional binding and equality obligations |

Repository evidence is pinned to this main, not to a live database query:

| Path / observation | Application to this design |
| --- | --- |
| `supabase/config.toml`: PostgreSQL major 17, exposed schemas `public`, `graphql_public` | Use PostgreSQL 17 semantics; new storage/API schemas must remain unexposed. A future apply must inspect actual hosted version/configuration. |
| `supabase/migrations/20261004010705_official_truth_content_identity_2.sql` | Private tables, ENABLE/FORCE RLS, explicit revocations, closed payload checks, immutable UPDATE/DELETE triggers, deferred relationship checks and narrow service RPCs are useful patterns. |
| Same migration: `public.official_truth_store_accepted_v2(jsonb)`, empty `search_path`, explicit service EXECUTE | Existing accepted-store transport is not a provenance or custody API. Do not reuse its JSONB input as canonical bytes, its current-eligibility joins or its acceptance operations. |
| `supabase/migrations/20261004223959_official_truth_v2_catalog_hardening_1.sql` | Exact catalog/profile/host validation is a live eligibility pattern; historical loading cannot join this current catalog. |
| `lib/readiness/official-truth-store-server.ts` and corresponding tests | Dormant service transport; schema-1 and schema-2 refusal before side effects. This design removes neither refusal. Tests include PostgreSQL execution, so the suite is not run in this no-SQL slice. |
| `official-truth-source-catalog-server.ts`, `official-truth-content-identity.ts`, `official-truth-rule-review-fingerprint.ts` in `lib/readiness/` | Catalog transport, seven-field content binding, existing Evidence v3/ev2 and review v3 algorithms remain distinct from storage serialization. |
| `AGENTS.md`, START_HERE, operating standards, vision, architecture, roadmap, ADR-0216–0220, quality/continuity standards | One writer; truthful failure reporting; no unknown-to-not-required conversion; current live evidence supersedes old active-work pointers. Global documents remain untouched under the TASK. |

Read official PostgreSQL and Supabase documentation as corroboration, not as a replacement for merged contracts. Supabase's 25 September 2026 minor-upgrade notice was inspected: the chosen design uses none of the affected ltree/GiST/custom-operator/legacy-cipher facilities. No hosted patch level or upgrade is asserted. See [the notice](https://supabase.com/changelog/postgres-15-19-17-11-breaking-changes). No database, credential or provider was accessed.

## 3. Exact representations and identity domains

### 3.1 Receipt

`B` is precisely `C(receipt.payload)` from #855, stored as PostgreSQL `bytea`. The authoritative key is the complete ASCII `ot-provenance-v1:` followed by 64 lowercase hexadecimal characters. Recompute SHA-256 over ASCII `ot-provenance-v1`, one LF byte `0x0a`, then B, and prefix the lowercase hex digest with `ot-provenance-v1:`. The external fingerprint is not inside B. No custody field, closure hash, database ID or acceptance flag is added to the receipt payload.

Validate UTF-8, duplicate JSON members before ordinary parsing, exact keys/nulls, safe integers, canonical strings/sets and UTF-16 key ordering. Require byte-for-byte equality between B and the exact C reserialization. Reject BOM, trailing newline, layout whitespace, negative zero, exponent/alternate number spelling, unpaired surrogates and noncanonical order. Do not normalize Unicode or reorder request URLs. Domain parsers retain their original behavior; C does not replace the existing Evidence/review/scope hash algorithms.

No full JSONB projection is selected for version 1. Required schema/version/codec columns are checked projections only. A later optional search projection could identify a candidate fingerprint, but must be independently versioned and read back against B. A corrupt optional projection is isolated and ignored; required discriminator disagreement fails integrity. JSONB-to-text never reconstructs authoritative bytes. [PostgreSQL JSON types](https://www.postgresql.org/docs/17/datatype-json.html) documents why JSONB normalization cannot preserve the byte contract.

### 3.2 Complete Pins and byte-contract families

Every artifact lookup uses `(id, version, digest)`. `id` is registered ASCII `[a-z][a-z0-9._-]{0,127}`; `version` is an integer in `1..9007199254740991` and must also satisfy any narrower domain bound; `digest` is full lowercase 64-hex SHA-256 of the exact canonical artifact bytes. Database versions use `bigint`, never floating point. Transport must preserve safe-integer values exactly. Evidence `ev2_` IDs are not artifact digests.

One id has one semantic type and byte-contract family across versions. `(id,version)` cannot be rebound, including across types. A digest has exactly one byte sequence in the artifact blob store. Same digest with different bytes is a collision/integrity failure, even if an injected test hash says both are valid. Equal digest never bypasses byte or type comparison.

The static codec dispatch distinguishes these **existing merged byte contracts**:

| Family | Authoritative bytes and identity checks | Dependency extraction |
| --- | --- | --- |
| `global_definition_v1` | Exactly `C({id,version,scope})`, #855 §3; embedded id/version equal Pin; semantic type `global_cell` | Leaf. No manifest wrapper added. |
| `manifest_v1` | Exact #859 §5 `C({artifactType,artifactContractVersion,id,version,content,dependencies})`; every scalar agrees with stored type/contract/Pin | Closed typed content and canonical `{slot,pin}` list must describe exactly the same references. |
| `custody_v1` | Exact #861 §3 `C({kind,schemaVersion:1,value})`; kind is the named logical object, value is its closed merged signature | Derive references from that exact kind's typed Pin fields, including bounded list members. Do not insert a `dependencies`, id or version field into these hashed bytes. |

For `custody_v1`, external id/version is the producer-qualified immutable name/version from the Pin; it is not invented from a missing field in the envelope. The database binds it once in its identity ledger and verifies type, digest, bytes and expected role. Byte identity alone does not certify who assigned the external name. Identical bytes may have multiple separately qualified Pins only where the applicable contract permits it; each semantic binding is immutable. Global and manifest families require their embedded identity and therefore cannot be aliased inconsistently.

`manifest_v1` types are the #859 closed categories: `catalog_snapshot`, `identity_profile`, `extractor_registry`, `policy_registry`, `extractor_definition`, `policy_definition`, `fact_schema`, `applicability_schema`, `output_contract`, `proof_contract`, `freshness_contract`, `implementation_bundle`. Each has its own closed content codec, not a generic JSON content allowance. `implementation_bundle` holds qualified bounded code bytes, never executable database instructions; readers do not run them.

The named #861 custody kinds are `GlobalCellAdmissionV1`, `AcceptedEvidenceCustodyV1`, `SupportSelectionDefinitionV1`, `SelectedSupportManifestV1`, `GlobalRepresentationQualificationV1`, `AutonomousReviewConstructionV1`. `CustodyDependencyBindingV1` is stored separately as specified below. Their scope/admission/observation/validity/accepted-origin/qualification/selection contracts may refer to further typed artifacts. #861 explicitly leaves those issuing contracts to separate designs: **an unavailable, unrecognized or not yet reviewed concrete codec is rejected**, never stored as arbitrary `content`, guessed by this slice or supplied as executable parser code by the caller. This is an implementation prerequisite, not a storage fallback or dependency on #863.

The future reviewed static codec catalog maps `(family,type,contract_version)` and the relevant exact semantic contract Pins to strict parsers/validators. It is code, not a writable SQL registry, a current extractor registry or a runtime plugin loader. Receipt schema, content identity schema 2, applicability schema, artifact contract and storage contract versions are separate axes. No implication from one version number to another is allowed.

### 3.3 Separate custody binding

Store K exactly as `C({kind:'CustodyDependencyBindingV1',schemaVersion:1,value:{receiptFingerprint,globalAdmission,selectedSupportManifest,autonomousReviewConstruction}})`, following #861's reference-form rule. Its digest is the full SHA-256 of K, with no receipt H-domain and no invented domain or fields. It has no independent generated semantic id/version and cannot be loaded as a #855 receipt. Storage key is the exact receipt fingerprint; one binding per receipt.

Require the value's fingerprint to equal the receipt key; the three complete Pins resolve to the matching custody types. Validate the equality obligations in #861 §§3, 5–7, 9 and 14: exact cell definition and canonical scope, global admission, manifest, support set/versions/complete Evidence preimages, catalog/extractor/policy snapshot Pins, requirement type/kind/quality, review preimage with literal null proposal and recomputed existing v3 review key. `AutonomousReviewConstructionV1` refers to the same selected manifest. Its safe preimage can support the additional historical v3 recomputation; a raw packet/body is still absent. Qualification/original-observation equality is checked only under recognized pinned contracts. Origin and actual execution remain unprovable from archived values alone.

A second valid-looking K for the same receipt is a conflict, even if B is equal. Binding absence never means legacy compatibility or permission to attach one later. No receipt-v1 bytes are widened and no authority is gained from this association.

## 4. Future private relational layout

Use two new unexposed schemas, `official_provenance_private` for data/helpers and `official_provenance_api` for the two entry functions. Dedicated schemas confine owner/default-grant changes to this subsystem; do not revoke or broaden existing shared `private` schema rights. Do not add either schema to REST/GraphQL exposed lists or API extra search paths, publications, views, Realtime, Storage, FDWs or exports.

All columns below are `NOT NULL`. There are no nullable FKs, identity/serial sequences, mutable status flags, wall-clock columns or default semantic values. Text identities/slots/discriminators use deterministic `COLLATE "C"`; canonical JSON ordering remains UTF-16 in the codec, not SQL collation. Hash syntax and limits use checks that must evaluate true; null is separately rejected. All proposed constraint/index names are local to the later migration and must be fully qualified there.

| Table (all in `official_provenance_private`) | Exact columns / PostgreSQL types | Keys, references and constraints |
| --- | --- | --- |
| `artifact_names` | `artifact_id text`, `artifact_type text`, `byte_contract_family text` | PK id; UNIQUE `(id,type,family)` for composite reference; closed static type/family mapping; id grammar. This ledger binds type across versions. |
| `artifact_blobs` | `digest text`, `canonical_bytes bytea` | PK digest; lowercase full digest; 1..1,048,576 bytes; recomputed SHA-256 equals digest. Stores artifact and K bytes, not receipt B. Full bytes are never a B-tree key. |
| `artifacts` | `artifact_id text`, `artifact_version bigint`, `digest text`, `artifact_type text`, `byte_contract_family text`, `artifact_contract_version integer` | PK `(id,version)`; UNIQUE `(id,version,digest)` for full-Pin FKs; FK `(id,type,family)` to names; FK digest to blobs; positive versions, family/type/contract verified against bytes/codec. |
| `receipts` | `record_fingerprint text`, `canonical_payload_bytes bytea`, `storage_contract_version smallint`, `receipt_schema text`, `receipt_schema_version integer`, `canonicalization text` | PK fingerprint; bytes 1..262,144; storage version exactly 1; schema `official-truth-autonomous-provenance`, receipt version 1, canonicalization `ot-provenance-json-v1`; all checked against B. Deferred FK fingerprint to `custody_bindings.record_fingerprint`. |
| `receipt_dependencies` | `record_fingerprint text`, `root_slot text`, `target_id text`, `target_version bigint`, `target_digest text` | PK `(fingerprint,root_slot)`; FK parent receipt; full-Pin FK target artifacts; exact closed root-slot set in §5. |
| `artifact_dependencies` | `parent_id text`, `parent_version bigint`, `parent_digest text`, `slot text`, `target_id text`, `target_version bigint`, `target_digest text` | PK `(parent_id,parent_version,slot)`; full-Pin parent and target FKs; no self-Pin edge; exact derived slot/link set and DAG checks. |
| `custody_bindings` | `record_fingerprint text`, `binding_digest text`, `binding_schema_version smallint` | PK fingerprint; UNIQUE binding digest; FK fingerprint to receipts; FK digest to blobs; binding version exactly 1; K ≤4,096 bytes and exact §3.3 envelope. Reciprocal FK with receipts guarantees one binding per receipt at commit. |
| `custody_dependencies` | `record_fingerprint text`, `binding_slot text`, `target_id text`, `target_version bigint`, `target_digest text` | PK `(fingerprint,binding_slot)`; FK binding; full-Pin target FK; exactly `globalAdmission`, `selectedSupportManifest`, `autonomousReviewConstruction`, derived from K. |

In the table, `id/type/family/version` abbreviations in key descriptions refer to the corresponding full column names. All FKs have **ON UPDATE NO ACTION / ON DELETE NO ACTION**, `DEFERRABLE INITIALLY DEFERRED`; never CASCADE, SET NULL or SET DEFAULT. Uniqueness/PKs are immediate/nondeferrable so competing keys cannot commit. The circular receipt/binding references are intentional and only the deferred transaction can populate them. No FK points to mutable source/Evidence/Rule/catalog/auth/traveller tables. Later Rule references are outside this schema.

Indexes: the listed PK/unique indexes plus `artifacts(digest)` and target-Pin indexes on each of the three dependency tables. Root/parent PK indexes serve bounded outgoing traversal; target indexes support FK maintenance analysis without creating a garbage-collection policy. The binding digest unique index supports its blob FK. No JSONB GIN, full text, `current` selector or index on canonical byte payloads.

Checks on blobs establish byte length and digest only. Static type/codec validation, embedded identity, parent/link equality, transitive bounds and cross-object relationships require the function/constraint validator (§6), not impossible cross-table CHECK expressions. Names/blobs/artifacts are inserted only from the exact submitted closure; no standalone registration, free blob upload or orphan staging endpoint exists.

## 5. Root and dependency graph semantics

Receipt roots are exactly those derivable from B:

| Slot | Required target type / cardinality |
| --- | --- |
| `globalCell.definition` | `global_cell`, 1 |
| `candidate.factSchema` | `fact_schema`, 1 |
| `candidate.applicabilitySchema` | `applicability_schema`, 0 for explicit legacy null, otherwise 1 |
| `extractor.definition` | `extractor_definition`, 1 |
| `extractor.registrySnapshot` | `extractor_registry`, 1 |
| `extractor.outputContract` | `output_contract`, 1 |
| `policy.definition` | `policy_definition`, 0 for primary/null policy, otherwise 1 |
| `policy.registrySnapshot` | `policy_registry`, 0 for primary/null policy, otherwise 1 |
| `proof.contract` | `proof_contract`, 1 |
| `proof.catalogSnapshot` | `catalog_snapshot`, 1 |
| `proof.freshnessContract` | `freshness_contract`, 1 |

These remain **8–11 receipt root links**, including shared targets counted by role. Identity profiles remain transitive catalog dependencies. K is an external association, not a twelfth receipt root slot. The full publication graph is the union of these roots and `receipt → K → its three exact Pins`, recursively following the typed artifact references.

Frozen eligibility values such as `current:true/false` inside the original catalog/registry snapshots, and the receipt's historical `evidenceFreshnessAtReference:'current'`, remain unchanged historical data. The forbidden operation is selecting from today's mutable current pointer; a historical eligibility field is neither removed nor re-evaluated at the present time.

For #859 manifests, stored slots equal their hashed manifest slots. For #861 objects, derive slots as schema-relative JSON Pointer paths from the exact `value` (for example `/globalAdmission`, `/supports/0/custody`, `/dimensionBasis/citizenship/basis`). Use RFC 6901 escaping, zero-based decimal array indices without leading zeroes and the source contract's canonical array order. This is an index encoding outside hashed bytes, not a producer field. A codec enumerates only actual Pin fields; an object merely looking like a Pin is not an edge. Slot UTF-8 length ≤1,024 bytes, with stricter fixed-kind paths; no arbitrary caller slot. Manifest slots also obey this storage cap but retain their original spelling/order and meaning.

Require exact equality of each complete stored edge set with the one derived from its authoritative parent. No missing, extra, duplicate, foreign or repointed link; the same target in two distinct legitimate slots remains two edges. The function derives all links itself, with no submitted link list to trust. Complete closure is the least reachable set, no unsolicited artifact. Shared nodes are deduplicated by **complete Pin** for node/byte accounting, not only digest; this conservatively counts repeated bytes under multiple allowed identities.

Reject cycles with active-path detection, including self-edges and mixed custody/manifest cycles. Compute longest path in the resulting DAG after cycle detection; a node first visited along a short route must not hide a longer route. Receipt depth is 0; direct receipt artifact depth 1; K depth 1 and its targets depth 2. Leaf depth must be ≤8. K counts as one additional closure object; the union's total counts must fit #859's existing ceilings (§8). No cap is raised for custody.

## 6. Validation, publication and mutation enforcement

There are three distinct enforcement layers:

1. **Server caller:** independent operation authorization and producer-origin/privacy qualification; strict bounded input admission; no external DTO can certify these predicates. The storage adapter never manufactures or refreshes them. Its codec preflight is duplicated by the database's structural validation, not used as a `validated=true` bypass.
2. **Database entry function:** byte/hash/canonical/type/relationship validation; exact preexisting-state comparison; bounds and DAG traversal; entire transaction ordering. Pure reviewed codec helpers operate on retained bytes only. They never access network, current registries, Evidence acceptance, auth metadata or archived executable code.
3. **Database constraints and guards:** PK/unique/FK/null/check limits; before-INSERT strict validation of each row's own bytes/columns; deferred AFTER INSERT constraint checks of artifact edge-set completeness and receipt + binding + union closure; immutable mutation triggers. A future implementation must prove these checks run even when constraints are explicitly made IMMEDIATE before commit. Aggregate invariants are not represented by CHECK functions that assume stable cross-table reads.

The strict byte decoder must reject duplicate names before any cast to JSON/JSONB; validate lexical grammar and C equality separately. PostgreSQL's default JSONB representation and database key ordering are insufficient. Later implementation must provide bounded deterministic codec helpers and cross-language golden vectors against #855 C and existing algorithms; installation of a new language/extension or executable artifact loader is not assumed. Unsupported codec means refusal, not accepting a server verdict as proof. No such helper is implemented here.

Every table has row-level BEFORE UPDATE OR DELETE rejection, and statement-level BEFORE TRUNCATE rejection, with fixed sanitized errors. Ordinary principals have no UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, schema CREATE, ownership, role-switch-to-owner or replication privileges. Guard coverage includes unchanged-value UPDATE, conflict-update, MERGE update/delete, FK cascades, TRUNCATE CASCADE, COPY-based direct access, disabled triggers and `session_replication_role`. Ownership/DDL remains exclusively outside the application boundary.

Inserting extra links into an existing parent is also unavailable: entry logic compares preexisting objects and their **complete existing** edge sets before any new insert; deferred validators reject extra edges. Missing old edges cannot be filled from the new request. No `ON CONFLICT DO UPDATE`, `DO NOTHING`-as-success, repair endpoint, acceptance flag or mutable completeness marker. Only complete immutable new parents and their complete new links can be appended.

A database owner/superuser can defeat triggers, ACLs and RLS; no claim of tamper-proof storage is made. Byte hashes detect disagreement with trusted roots, not an adversary replacing every root and reference consistently. Maintenance/restore is a separately authorized lifecycle/security operation, not a runtime grant.

## 7. Exact transaction, concurrency and retry algorithm

### 7.1 Chosen serialization mechanism

Select one transaction-scoped PostgreSQL **advisory writer lock for this entire store**, shared by every authorized publication call. The proposed two-int key is `(1869901924, 1)`; a later repository-wide lock-key audit must reserve it before implementation. A collision with an unrelated cooperating lock would affect availability, not permit conflicting publication. No caller supplies the key and no stored mutex row, timestamp or execution identifier is needed. PostgreSQL releases transaction advisory locks at transaction end. See [explicit locking](https://www.postgresql.org/docs/17/explicit-locking.html).

Writes use **READ COMMITTED**, primary connection, one top-level transaction, and a VOLATILE entry function. Acquire the lock before any store-state reads; after acquisition each PL/pgSQL command gets the current READ COMMITTED snapshot. A waiting writer must load the committed winner in a subsequent command, not reuse a pre-lock snapshot or a single-statement CTE. Reject another transaction isolation level for the write API. No table-lock privilege escalation is needed. Immediate uniqueness is a second barrier; advisory locking is cooperative and only safe because ordinary DML is unavailable outside this entry function. [Transaction isolation](https://www.postgresql.org/docs/17/transaction-iso.html) supplies the snapshot/conflict semantics.

This intentionally serializes writes even for disjoint receipts and permits normal concurrent historical readers. It is the smallest reviewable bounded design; any finer-grained locking is a future versioned performance change with race proofs. Configure fixed finite lock/statement/idle-transaction deadlines and bounded server concurrency in the later implementation; no infinite wait or caller timeout override. Operational timeouts are not retention/freshness periods.

### 7.2 Ordered procedure

| Step | Required action |
| --- | --- |
| W0 | Authorize server operation independently; hold the exact qualified input. Enforce wire/decoded/raw-count limits before allocation; strict closed byte/Pin decoding and type/version checks. Derive and validate the requested exact union closure and K equality. No SQL side effect or external fetch during this step. |
| W1 | Begin the top-level READ COMMITTED transaction. Database function verifies fixed storage contract/mode, enforces its independent bounded byte/closure validation and acquires the store advisory lock before state lookup. No source/model/provider/producer callback. |
| W2 | Read exact receipt key and binding key, and all relevant existing names, blobs, artifacts and links. If only receipt or only binding exists, abort as existing integrity failure. In retry-only mode, absence is failure. |
| W3 | If receipt exists, compare B, required discriminators, K/digest, full root/binding links and **existing retained closure** before inserting anything. Missing or corrupt rows/links fail; new request bytes cannot heal them. Equal complete valid state returns provisional `idempotent`, with no writes. Unequal key/bytes/type/binding returns conflict. |
| W4 | For a new receipt, compare every existing artifact/name/digest encountered, including all existing outgoing edges and their retained descendants, using existing data first. A preexisting artifact with missing descendants/links cannot be repaired by this new receipt. Same digest/different bytes or same id/version/different binding aborts. Collect only genuinely absent new objects in memory. |
| W5 | Insert new names in ASCII id order; new blobs in digest order; new artifact rows in `(id,version,digest)` order; then complete new artifact links in parent/slot order. Reused parents get no insert/update. All descendants already exist or are in the validated new set; deferred FKs resolve within this transaction. |
| W6 | Insert new receipt B and required projections, its exact roots, K association and its three links. Every new blob/name must be used by the admitted new/reused exact closure; no extras. The reciprocal FKs permit this temporary ordering only inside the transaction. |
| W7 | Force all **new provenance subsystem** deferred constraints immediate; validate persisted bytes, root/link sets, K equality and bounded union closure using the transaction's state. Do not toggle constraints belonging to another subsystem. No success-shaped result after a caught integrity exception. |
| W8 | Return only a provisional result to the adapter; commit the transaction. Only after successful COMMIT/confirmed autocommit completion may the adapter report `inserted` or `idempotent`. Rollback/cancellation/commit failure returns no storage success. No partial transaction is retained. |

If immediate uniqueness raises unexpectedly despite the lock, abort; do not catch it and infer equality. After operational contention a separately bounded retry may restart the whole transaction with the identical immutable request, appropriate mode and fresh state; never reselect producer inputs. Errors do not create persistent failure receipts or payload logs.

The server-facing publication failure union is separate from successful output: `invalid_input`, `unsupported_version`, `conflicting_identity`, `existing_integrity_failure`, `existing_receipt_absent`, `access_denied`, `storage_failed`, `commit_outcome_unknown`. Details are closed codes, never database error text. Invalid/unsupported input, identity conflicts and existing integrity failures abort the transaction and are non-retryable by automatic create mode. Permission failures have no existence detail. Lock timeout, cancellation, deadlock or unexpected serialization error abort and map to `storage_failed`; only a definite rollback permits a bounded new create attempt. Lost commit acknowledgment maps to the last code. PostgreSQL constraint/permission errors must be mapped and sanitized, not parsed for offending values or exposed to callers.

### 7.3 Defined outcomes and ambiguous commit

| Situation | Result |
| --- | --- |
| Two simultaneous identical initial publications | First commits once; second acquires lock, reads and validates winner's whole retained graph and returns `idempotent`. |
| Concurrent same fingerprint/different B or K | Loser aborts conflict, no alteration; no second alias/version allocated by storage. |
| Different receipts sharing identical complete artifact Pins | Reuse after full existing validation; no second artifact record or mutation. |
| Different receipts racing on same id/version with different digest/bytes/type | One can commit; loser aborts entire receipt. |
| Same digest/different artifact or binding bytes | Conflict at explicit byte comparison/unique blob identity; never hash-only dedup. |
| Failure after any insert, before or at commit | Entire transaction rolls back; existing shared rows unchanged. Reader sees only old or fully committed new state. |
| Existing receipt, missing K / dependency / link / corrupt bytes | Integrity refusal; never idempotent and never repair. |
| A known prior success is retried | `verify_existing` mode, read/compare under lock, no INSERT path even if root is absent. |
| Connection lost around COMMIT | Operational `commit_outcome_unknown`, no success claim. Resolve with `verify_existing` in a fresh authorized transaction. If all bytes/closure match, acknowledge stored identical object; if absent/unavailable/corrupt, keep failure/indeterminate, never blindly replay insertion. |

Two closed modes exist: `create_or_verify` for a new authorized publication and `verify_existing` for a known/ambiguous previous publication. Mode is server adapter control, not a browser DTO or persisted receipt field. A definitively rolled-back initial call can be resubmitted as a new attempt with the same qualified input; uncertainty alone cannot authorize that mode.

The store has no tombstone/ever-seen ledger in this design. If a privileged actor removes **all** traces, a genuinely new call cannot distinguish historical absence from first insertion. Do not claim otherwise or invent a lifecycle record to solve it. Known/ambiguous retries fail closed on absence; any restoration/republication after disappearance remains gated by `LIFECYCLE_RECOVERY_POLICY`. Ordinary-role deletion is prohibited. This limitation preserves #865's decision boundary.

## 8. Resource bounds and transport

All #859 ceilings are preserved. Custody consumes the existing budget; it does not create a second unlimited graph. If a valid future producer output exceeds a bound, refuse storage without trimming snapshots, omitting bindings or rewriting receipts.

| Resource | Version-1 bound | Enforcement sites |
| --- | --- | --- |
| B | 262,144 bytes | Server before decode; database octet length/check; reader before payload allocation |
| Receipt roots | Exactly 8–11 as derived; ≤11 | Strict receipt decoder, link-set constraint, reader |
| Union objects | ≤256, counting K once plus all distinct complete artifact Pins | Raw submitted artifact array ≤255 with no duplicates; writer/constraint closure validation; reader visited set |
| Transitive count | ≤256 minus distinct direct union roots (including K) | Same union accounting; shared roots cannot increase allowance |
| Edges | ≤1,024 total, counting receipt roots, receipt→K, three K links and every artifact role edge | Derived raw edge count before graph dedup; database closure validator; reader budget before next child |
| Outgoing artifact dependencies | ≤256 and stricter typed cardinalities | Codec, parent completeness constraint, reader |
| One artifact | ≤1,048,576 canonical bytes | Binary argument/row length check and pre-decode reader check |
| K | ≤4,096 canonical bytes, stricter storage limit for the four-field binding | Transport, blob-role validator, reader |
| Sum of union bytes | ≤8,388,608 excluding B, **including K** | Sum per distinct complete Pin plus K, even if equal digests physically deduplicate; writer and reader |
| Longest path | ≤8 from receipt, including custody association edges | Bounded DAG algorithm, not first-visit depth |
| JSON structural nesting | ≤32 for each B/K/artifact | Strict streaming/bounded decoder; independent of graph depth |
| Slot encoding | ≤1,024 UTF-8 bytes; fixed/typed paths narrower | Decoder/derived edges, table checks, reader; no caller extensions |

Stricter #855/domain limits continue: primary 1 support, composition 2–8 unique items, assignments ≤64, extractor observations ≤256, applicability depth 4/nodes 16/operands 8/branches 8/visa options 4; catalog ≤1,024 item versions/4,096 representations/128 profiles/16 request URLs. These maxima need not all fit the smaller storage envelope. No schema-2 alias changes historical bounds.

Selected transport is a private server-to-database binary protocol call: B/K/artifact bytes are binary `bytea` parameters, not JavaScript objects reserialized by a JSONB RPC. Artifacts use a closed composite-array argument (§10); raw array entries and dimensionality are bounded **before unnesting**, require one dimension with lower bound 1, reject null elements and repeated complete Pins or repeated id/version pairs. No client-submitted links. Zero artifact entries cannot satisfy the mandatory roots.

The adapter enforces total encoded parameter bytes ≤10,485,760 (10 MiB), including tuple metadata and framing, with no HTTP request decompression or base64 layer on the selected path. The driver must support bounded binary writes/reads; no unbounded driver buffering followed by a post-allocation check is claimed safe. Reader row-length metadata is inspected before fetching each blob, per-row cap first and total budget second, inside the same snapshot; no `SELECT *`/unbounded aggregate of large blobs. Driver/database memory and finite work/time settings require later load verification.

An optional future PostgREST wrapper would require separately reviewed exact hex/base64 transport, encoded limits, byte round-trip vectors and server caller isolation. It is not selected or opened here. Ordinary code cannot bypass admission by sending compressed payloads, arbitrary large arrays or a mutable URL where bytes are required. Database-side size checks remain defense in depth; they cannot prevent all network allocation by a compromised database credential.

## 9. Principals, ACLs, RLS and ownership

The following names designate future least-privilege database roles, not changes to existing Jetnity Auth roles/capabilities. Creating/connecting any of them requires the later approved implementation/apply and credential plan. No role/credential is created now.

| Principal | Schema/function rights | Tables / effective RLS |
| --- | --- | --- |
| `PUBLIC`, `anon`, `authenticated`, browser, anonymous signed-in user | No USAGE/CREATE on either new schema; no EXECUTE on any new entry/helper function or usage of API composite types | All rights revoked on every new table; no policies; no read/write via REST, GraphQL, Realtime or a view |
| Existing `service_role`, `authenticator` and unrelated server/admin roles | Same denial for this subsystem; do not grant new RPC execution merely because existing RPCs use service role | No table grants; BYPASSRLS does not grant SQL privileges; no allowed role membership or SET ROLE path |
| `ot_provenance_ddl` | NOLOGIN, non-superuser, NOBYPASSRLS, NOCREATEDB/NOCREATEROLE/NOREPLICATION; owns only new schemas/tables/types/guard helpers | DDL authority reserved to migration operator; FORCE RLS applies to its normal DML; no application membership |
| `ot_provenance_write_exec` | Same non-login/non-bypass attributes, owns only publication entry function; USAGE schemas/types, EXECUTE only required validation helpers | SELECT+INSERT on new tables only; no ownership; role-specific SELECT USING true and INSERT WITH CHECK true on each table; integrity validators remain mandatory |
| `ot_provenance_read_exec` | Non-login/non-bypass, owns only exact-read entry function; schema/type usage and read-only helpers only | SELECT only; role-specific SELECT USING true; no INSERT/UPDATE/DELETE/TRUNCATE or write-helper execution |
| Future `ot_provenance_writer` server connection | Private authenticated DB principal, no membership in exec/DDL/read roles; USAGE API schema and necessary types, EXECUTE only exact publication signature | No private schema usage/table DML; cannot call raw read function or internal helpers |
| Future `ot_provenance_reader` server connection | Separate credential/principal; USAGE API schema/types, EXECUTE only exact historical-read signature | No DML, no writer execution/membership; read-only transaction; only bounded exact fingerprint requests |

Enable **and FORCE ROW LEVEL SECURITY on all eight tables**. Grant no ALL-command policy, no PUBLIC policy and no JWT/user-id ownership predicate: these are global non-personal records, and no user owns a row. The two executor policies are the only positive policies, role-specific with no application role inheritance. Writer policy permits insertion only in its constrained definer execution; it is not proof of trusted origin. Scope/schema grants and function validation narrow the operation. All helper functions stay INVOKER unless a separately justified privilege boundary is explicitly reviewed; no helper owns tables or bypasses RLS.

FORCE RLS subjects ordinary table owners to policies but does **not** defeat superuser or BYPASSRLS. RLS also does not govern TRUNCATE/REFERENCES; ACLs and triggers must cover them. Referential-integrity checks can bypass row filtering, so deny untrusted function/table access and sanitize constraint errors before any response. These are PostgreSQL properties, not assumptions that “private” alone is secure. [Row security](https://www.postgresql.org/docs/17/ddl-rowsecurity.html).

Revoke default PUBLIC EXECUTE on every new function in the same DDL transaction before exposure; revoke explicit/inherited grants from API/service roles; grant only the signatures above. Scope future default privileges to the dedicated creating role(s) in these new schemas; do not change global defaults or another role's defaults. Check grants after ownership changes, including overloaded functions, composite types, schemas, default ACLs, role membership/SET options and privileges inherited from PUBLIC. No sequences exist to grant. Newly added functions remain inaccessible until exact review/grant.

Inspect transitive function-call privileges, including existing PUBLIC-callable functions outside these schemas: neither executor/caller may obtain an ownership switch, DDL, out-of-scope mutation or bypass through another definer. An unsafe inherited route is a failed deployment prerequisite, not permission in this slice to alter shared Auth/RLS. The definer read call chain must contain only pure decoding and SELECT operations.

Do not solve privilege errors by transferring functions to `postgres`, granting BYPASSRLS, adding a public wrapper, or disabling FORCE RLS. Schema exposure and grants are separate from policies; changing default Supabase exposure behavior does not authorize access. [Supabase securing the API](https://supabase.com/docs/guides/api/securing-your-api).

## 10. Function boundaries and options

Selected conceptual signatures (notation only, no SQL statements):

| Function / type | Contract |
| --- | --- |
| `official_provenance_api.artifact_input_v1` | Composite fields in this order: `artifact_id text`, `artifact_version bigint`, `digest text`, `artifact_type text`, `byte_contract_family text`, `artifact_contract_version integer`, `canonical_bytes bytea`. Exact closed array element; all non-null after explicit function checks. |
| `official_provenance_api.publish_v1(storage_contract_version smallint, mode text, record_fingerprint text, receipt_bytes bytea, custody_binding_bytes bytea, artifacts artifact_input_v1[])` | One SECURITY DEFINER, VOLATILE, PARALLEL UNSAFE function; owner write executor; only version 1 and the two closed modes. No default args, overloads, arbitrary operation field, arbitrary SQL, relation/path parameter, callback, authorization DTO or retention selector. Output fixed `(record_fingerprint text, outcome text)` with outcome `inserted`/`idempotent`, provisional until commit. |
| `official_provenance_api.read_exact_v1(storage_contract_version smallint, record_fingerprint text)` | One SECURITY DEFINER, STABLE, PARALLEL UNSAFE bounded read function; owner read executor; no lock on publication and no side effects. Returns a bounded raw snapshot envelope (below), not an acceptance result. |

`read_exact_v1` returns fixed typed result rows with closed tags `receipt`, `binding`, `artifact`, `receipt_link`, `binding_link`, `artifact_link`, `read_status`. Payload bytes appear once per exact object; unused tagged-union fields must be null, used fields must have the specified scalar/Pin/byte types. At most 1 receipt + 1 binding + 255 artifacts + 1,023 stored edge rows + 1 status row = 1,281 rows; the synthetic receipt→K edge consumes the remaining edge budget but is not stored twice. For a genuinely absent root the envelope is just status `receipt_absent`. It must be distinguishable from an incomplete/truncated transport or failed query.

The proposed return composite `official_provenance_api.history_row_v1` has exactly these columns in order: `row_kind text`, `record_fingerprint text`, `storage_contract_version smallint`, `receipt_schema text`, `receipt_schema_version integer`, `canonicalization text`, `binding_schema_version smallint`, `object_id text`, `object_version bigint`, `object_digest text`, `artifact_type text`, `byte_contract_family text`, `artifact_contract_version integer`, `canonical_bytes bytea`, `parent_id text`, `parent_version bigint`, `parent_digest text`, `slot text`, `target_id text`, `target_version bigint`, `target_digest text`, `status text`, `detail_code text`. The first three fields are always non-null and equal the row tag, requested fingerprint and 1; this is an external transport record, not a stored receipt expansion.

| Row tag | Other non-null fields (all unlisted fields must be null) |
| --- | --- |
| `receipt` | `receipt_schema`, `receipt_schema_version`, `canonicalization`, `canonical_bytes` (B) |
| `binding` | `binding_schema_version`, `object_digest`, `canonical_bytes` (K) |
| `artifact` | `object_id`, `object_version`, `object_digest`, `artifact_type`, `byte_contract_family`, `artifact_contract_version`, `canonical_bytes` |
| `receipt_link`, `binding_link` | `slot`, `target_id`, `target_version`, `target_digest`; parent is the requested receipt or its one K association respectively |
| `artifact_link` | `parent_id`, `parent_version`, `parent_digest`, `slot`, `target_id`, `target_version`, `target_digest` |
| `read_status` | `status`; `detail_code` is null for complete, otherwise a closed reason from §11 |

Exactly one terminal status row is required. Scalar grammars/lengths match §4/§8 and codecs; duplicate tags for the receipt/binding/status or duplicate semantic object/edge keys fail response validation. Output ordering is receipt, binding, artifacts in Pin order, receipt links in slot order, binding links in slot order, artifact links in parent/slot order, then status. An incomplete diagnostic response is never a complete/valid closure; transport interruption before status is operational failure.

Both entry functions reject SQL NULL in any required input, invalid scalar grammar and unknown storage versions. The read function verifies the transaction is REPEATABLE READ and READ ONLY; the write function verifies READ COMMITTED and writable state. These built-in transaction settings constrain execution semantics, not caller authority. The adapter cannot silently downgrade either mode.

The reader function follows only roots/links derived from canonical bytes with its bounded decoder, checks stored edges and reports a fixed structural failure if inconsistent. It may return the bounded encountered graph plus one fixed diagnostic status to the trusted validator; it never follows unexpected stored links or silently discards them. Status is one of `complete`, `receipt_absent`, `receipt_corrupt`, `dependency_missing`, `dependency_corrupt`, `unsupported_version`. These are storage envelope diagnostics, not public verification assertions. The adapter independently validates the complete response framing/counts/bytes and performs §11 before emitting the five semantic verdicts. Unsupported structural dispatch stops without executing archived code. An error has no successful envelope. No arbitrary artifact enumeration/read-by-id interface is exposed.

Both functions have fixed empty `search_path`; every schema object/type/operator/function reference is explicitly qualified, including hash and parser helpers. No dynamic SQL, dynamic EXECUTE, overloaded default dispatch, caller-installed operator, temp-table lookup, configurable function name or unqualified extension reference. Implicit `pg_temp` resolution must be excluded by using qualified references and no temp relations. Use the effective definer principal only for SQL privilege checks; JWT claims, caller-set GUCs, `application_name` and a `trusted` field confer no authority. Do not use `current_user` inside a definer as proof of the original caller. The ACL/connection identity fixes caller eligibility, and the separate server authorization boundary establishes the operation.

Use parameterized calls, never SQL literals containing input. All function errors use closed codes/messages without input interpolation. The later credential/observability review must verify driver/APM/database error and bind-parameter logging cannot retain B, K, artifacts or rejected preimages; suppress parameter logging and sanitize exception details at the trusted adapter. No new persistent diagnostic archive is proposed. A database administrator's independent logging/inspection privileges remain outside the ordinary-role guarantee and under the unresolved access/lifecycle policy.

PostgreSQL defaults new functions to PUBLIC EXECUTE and requires care with definer search paths; creation and revocation must be atomic. [CREATE FUNCTION](https://www.postgresql.org/docs/17/sql-createfunction.html). The selected definer owner has narrowly scoped rights and no RLS bypass. Definer execution does not itself imply RLS bypass; owner attributes, table ownership, FORCE RLS and policies together determine it.

| Option | Assessment |
| --- | --- |
| **Selected: private direct-DB call, separate writer/reader credentials, non-bypass definers** | Function-only caller permissions, binary transport, explicit commit/snapshot semantics and no exposed HTTP RPC. Future private connection/provisioning must be separately approved and verified; no current credentials assumed. |
| INVOKER function with table INSERT/SELECT grants to caller | Avoids definer, but gives ordinary caller direct DML/read paths and broadens validation bypass. Not selected. |
| Existing public PostgREST + shared `service_role` definer pattern | Familiar repository transport, but shared execution credential and exposure surface defeat the selected writer/reader isolation; service possession cannot prove custody. Not selected; cannot silently replace the private path. |
| Definer owned by table owner/postgres, no positive RLS policies | Depends on privilege bypass, contradicts the selected least-privilege posture. Rejected. |

The future writer and reader entry points must remain server-only, absent from browser bundles/routes/console form actions and from freely injectable live dependencies. Connection pools must not leak role/transaction state; end each transaction, reset session state, and discard uncertain connections. No auth.uid/AAL change or new Jetnity capability is designed here.

## 11. Historical exact-fingerprint reader

The separately authorized historical server reader uses the primary database and one **REPEATABLE READ READ ONLY** transaction spanning read and response acquisition. It calls only `read_exact_v1`, with finite server-controlled budgets. Database policies expose all permitted history to this internal executor, so a legitimate zero-row result is not accidentally a filtered subset. Unexpected ACL/RLS/schema failures are operational failures. No replica lag is converted into missing evidence. No writes, repair, projection rebuild or acceptance function are accessible.

Reader steps, deterministic first failure:

1. Validate request fingerprint/transport contract, receive complete bounded envelope in the same snapshot. Malformed request is rejected before a lookup. Timeout, denied permission, network/driver error, connection reset, absent result framing, truncated response or snapshot failure is **operational read failure**, outside the integrity verdict. Never turn one into an empty result.
2. If successful authorized lookup has no receipt, return `receipt_corrupt` with detail `receipt_absent`. Otherwise validate B bytes/fingerprint and strict syntax; dispatch known receipt schema/codec only. A well-identified unknown receipt version yields `unsupported_version`; malformed known bytes or required projection mismatch yields `receipt_corrupt`.
3. Derive receipt roots. Require K and its correct fingerprint/digest/closed envelope; validate its three links and both directions of association. Missing K is `dependency_missing` with `custody_binding_missing`; mismatch is `dependency_corrupt`. Do not return a reduced receipt-only `valid` result.
4. Traverse the union under §8, in sorted receipt slots, then the K association, then each codec's canonical edge order. Verify every Pin, byte digest, canonical byte contract, semantic name/type/version and exact link set. Completed shared nodes may be cached inside this snapshot; longest-depth calculation remains separate. Successful lookup without a required artifact is `dependency_missing`; wrong digest/bytes/name/type/link, cycle or exceeded bound is `dependency_corrupt`.
5. Use only shipped, explicitly supported historical semantic codecs matching the exact referenced contracts/Pins. Recompute #855 fact/scope/Evidence/candidate/proof/selection/composition bindings and citations, plus §3.3 custody equality and safe v3 preimage where its reviewed codec exists. Check historical freshness at recorded reference time, never now. Preserve original vs fresh retrieval timestamps. Known malformed semantic values produce `receipt_corrupt` (receipt binding) or `dependency_corrupt` (artifact). Unknown pinned interpretation produces `unsupported_version`.
6. Only after every retained relationship passes, return `valid`. Do not persist this verdict, cache it as an accepted/fresh flag, call the producer or run archived implementation bundles. No HTTP/catalog/registry/latest/main/Evidence lifecycle read can supplement the retained closure.

| Exactly five integrity verdicts from #859 | Meaning / fixed detail examples |
| --- | --- |
| `valid` | Supported retained identities/bytes/relationships consistent historically; no origin, current freshness or acceptance assertion |
| `receipt_corrupt` | Missing/invalid root or receipt binding; `receipt_absent`, `canonical_bytes`, `fingerprint`, `receipt_binding` |
| `dependency_missing` | Successful exact read lacks required object; `artifact_missing`, `custody_binding_missing` |
| `dependency_corrupt` | Artifact/K/required link/graph/bound inconsistency; `binding_mismatch`, `link_set`, `cycle`, `bound_exceeded` |
| `unsupported_version` | Well-identified unsupported schema, byte codec, storage envelope or exact historical semantic contract; no newest-code fallback |

Unsupported details are exactly `unsupported_schema`, `unsupported_codec`, `unsupported_storage`, `unsupported_semantic_contract`; no dynamic version label is echoed. Missing-object and corruption details use the fixed codes in the table; local failures not needing finer distinction omit a detail. These codes do not expand the five-verdict union.

Result contains only verdict, requested fingerprint, optional closed detail code and optional closed root/binding slot code. Dynamic dependency paths/indices/ids, raw database errors, invalid values, source text, URLs or user material are never echoed. Transport/authorization failures return a separate fixed operational envelope with no integrity verdict; a write conflict similarly is not a historical verdict. A storage-envelope version unknown to the adapter is unsupported only if a complete well-identified response is received; undecodable/truncated transport is operational failure.

`valid` cannot prove original observation authenticity, non-personal origin, actual same-request object/seal possession, raw body hashing, historical authorization or legal completeness. #861's retained safe preimage permits additional checksum checks but does not restore omitted raw review/body/seal material. Current eligibility remains a different live operation. No stored hash, FK or valid result is a bearer capability.

## 12. Interface to producer and later F8

Producer-to-storage interface consists only of already-qualified B/fingerprint, K and the exact bounded immutable union artifact set. Producer custody is supplied through the private authorized invocation, not serialized credentials/flags. Storage returns committed `inserted`/`idempotent` or fixed refusal/operational failure. No new semantic id/version, timestamp, support selection, repair or evidence upgrade is returned. Byte-for-byte retained data is the only acceptable retry input.

TL must later reconcile the producer adapter against this interface; that reconciliation cannot change #855 bytes or accept unknown #861 issuer artifacts. If independent designs disagree, stop before implementation and explicitly version/review the affected storage interface. Nothing in this document predicts #863's implementation internals.

Future F8 may, only under a separate authorization/design, relate an independently accepted immutable Rule version to the exact receipt fingerprint. Its own relation must compare canonical fact, cell and exact supports. No Rule table, FK, acceptance timestamp or backfill is added here. The live candidate, fact object (actual composition seal if applicable), Evidence, registry, current authorization and freshness remain independently required; `regelKandidatAkzeptieren` remains the sole canonical constructor. An old receipt cannot recreate those objects, select a policy, clear a current store refusal or authorize any write/activation.

## 13. Fail-closed adversarial matrix

This is a future implementation acceptance matrix, **not executed tests**. W = whole publication rejected/rolled back; R = historical result; O = operational failure without integrity verdict. No case writes a failure receipt or auto-repairs state.

| ID | Attack / controlled fixture | Expected enforcement and result |
| --- | --- | --- |
| A01 | Same receipt fingerprint, different B, including forced hash collision fixture | W conflict; exact B comparison after key lookup; original unchanged |
| A02 | Same artifact id/version, different bytes/digest/type/codec | W conflict even if new hash is valid; semantic pair immutable |
| A03 | Same digest, different artifact or K bytes | W collision/refusal before reuse; no hash-only dedup |
| A04 | Root absent versus database timeout | Successful absence R `receipt_corrupt/receipt_absent`; timeout O; neither valid |
| A05 | Missing exact root artifact or transitive dependency with newer version present | W; R `dependency_missing`; no current/latest fallback |
| A06 | Self-cycle, multi-node cycle or custody↔manifest cycle | W; R `dependency_corrupt/cycle` before unbounded recursion |
| A07 | Shared node reached first shallowly, later at depth 9 | W; R `dependency_corrupt/bound_exceeded`; longest path checked |
| A08 | Each byte/node/edge/nesting bound at maximum and maximum+1 | Exact valid maximum may pass if all other limits pass; +1 W / R corrupt; no trim |
| A09 | Unbounded duplicate raw artifact list that deduplicates small | W before dedup/allocation; array cardinality and duplicates checked |
| A10 | Two concurrent identical initial inserts | One publication, second complete stored verification then idempotent; no UPDATE |
| A11 | Concurrent same fingerprint/different B or K | Lock serialization plus unique keys; losing whole transaction W |
| A12 | Different receipts race on a conflicting shared artifact pair | At most one wins; loser W and no new orphan receipt |
| A13 | Fail at each W5/W6 insert, W7 constraint, and COMMIT | Full rollback; old/new atomic reader visibility, no partial success |
| A14 | Retry existing receipt after artifact/link disappearance or corruption | W/R missing or corrupt; incoming closure cannot heal it |
| A15 | Known/ambiguous retry after receipt and K disappear | `verify_existing` fails absent; no INSERT; no invented tombstone/lifecycle policy |
| A16 | Lose connection after commit sent but before acknowledgment | O indeterminate; verify-only resolution; no success inferred from timeout |
| A17 | JSONB search projection disagrees with B | Optional projection isolated, never authority; required discriminator mismatch R corrupt; no repair |
| A18 | Unknown receipt codec/schema, artifact kind/contract or exact semantic contract Pin | W; R `unsupported_version` when identity is well formed, no current parser alias |
| A19 | anon/authenticated/browser tries direct read/write or guessed RPC | Denied schema/function/table access; no row existence or raw error disclosure |
| A20 | `service_role`/authenticator tries new RPC or DML; forged trusted JWT/GUC | Denied ACL/membership; BYPASSRLS alone insufficient; no custody from service possession |
| A21 | Writer caller tries SELECT/COPY/INSERT directly or executes reader/helper | Denied; exact function grant only; no private schema access |
| A22 | Reader calls writer, sets role to executor, writes during verification | Denied grant/membership plus read-only transaction; no verify-and-repair seam |
| A23 | Ordinary UPDATE/DELETE/TRUNCATE/CASCADE/MERGE/ON CONFLICT UPDATE | ACL denial; immutable row/statement triggers as defense in depth; no mutation policy |
| A24 | Public/temp schema object shadows a function/operator/table; overload added | Fully qualified static resolution; no CREATE rights; signature/default-grant audit blocks exposure |
| A25 | Current catalog/registry/main/source URL supplied as missing history | W/R unavailable or unsupported; no outbound/current-state path exists |
| A26 | Receipt exists, K missing; K attached to another fingerprint | Missing: W/R dependency_missing; wrong binding: W/R dependency_corrupt; no receipt-only valid |
| A27 | B identical but alternate valid-looking admission/manifest/review K | W conflict; K cannot be replaced or appended later |
| A28 | Custody safe preimage uses non-null/model-derived proposal or different support metadata | W from qualification/closed semantic checks; R inconsistent values corrupt; origin cannot be inferred from a null alone |
| A29 | #861 bytes wrapped into #859 manifest and old digest retained | W/R digest/codec mismatch; preserve exact original envelope |
| A30 | Duplicate JSON member, invalid UTF-8, BOM, newline, -0, exponent, omitted null or Unicode normalization | W; R known receipt corrupt or artifact corrupt; check before lossy JSONB parse |
| A31 | Hidden extra edge, changed target digest, absent edge, swapped profile or incomplete registry snapshot | Exact derived edge set/type/complete snapshot validation fails W/R corrupt |
| A32 | Foreign/duplicate support, two representations of one item, wrong fact/citation/atom/branch | W/R semantic inconsistency; canonical #855/domain rules retained |
| A33 | Equal scope hash but unequal full scope, original time replaced by fresh time | W/R binding mismatch; check preimages, values and existing algorithms |
| A34 | Well-hashed forged receipt from unauthorized caller | Access denied before publication; consistency never proves origin |
| A35 | PII/model/session/raw body/secret hidden in artifact/code bundle/hash preimage | Qualified producer admission required; unknown/unqualified bytes W; no sanitize-and-keep-digest |
| A36 | Historical valid receipt presented as accepted Rule/F8 permission or fresh source proof | No corresponding API/authority; sole live acceptance path remains separately gated |
| A37 | Preexisting artifact lacks a child, but new receipt supplies that child | Existing closure check W before insert; no incidental repair |
| A38 | No-op DO NOTHING on conflict followed by success | Forbidden design; reread and full equality required or W |
| A39 | Reader mixes pages/snapshots, read replica lag or truncated response | Primary single snapshot/framing checks; O rather than fabricated missing/valid |
| A40 | Root valid but malformed unsupported dependency envelope/hash | Corrupt identity/bytes first; unsupported only for a well-identified contract; no permissive dispatch |
| A41 | Shared blobs/count aliases bypass budget; add unsolicited artifact | Count per complete Pin and K, exact union equality; W/R corrupt |
| A42 | Attempt to defer constraints past acknowledged success or reuse a failed connection | W7 forces checks; W8 waits for commit; O on uncertainty; discard connection |
| A43 | DDL owner disables RLS/triggers or full-root adversary replaces history | Outside ordinary-role guarantee; fail future security verification/incident boundary, no claim hashes prevent privileged rewriting |
| A44 | Privilege drift via PUBLIC default EXECUTE, inherited role or newly exposed schema | Development catalog/negative-role checks fail; no apply/activation acceptance until corrected |
| A45 | Unknown issuer artifact accepted as opaque generic JSON or archive code invoked as validator | W/unsupported; static reviewed codecs only; never eval/import/run archive |
| A46 | Writer holds lock beyond bound or deadlocks with maintenance | Timeout/cancel O and rollback; no automatic policy change or privilege widening |

## 14. Later migration, apply, rollback and verification plan

This section is a plan structure only. It creates no migration, emits no SQL and authorizes no execution. Do not run `db push`, existing tests that launch PostgreSQL, advisors or any Supabase tool in this slice.

### Preconditions before a separately dispatched implementation

- Independent exact-head TL review of this design; interface reconciliation using then-merged contracts, without guessing #863 output now.
- Concrete bounded codecs and golden vectors for every admitted artifact/issuer contract; no unknown-codec storage. Prove database C/driver round trips, digest parity, complete graphs and original-scope/review/Evidence algorithms.
- Product Owner + Security + Privacy decisions represented by **`RETENTION_POLICY`, `LIFECYCLE_POLICY`, `LIFECYCLE_RECOVERY_POLICY`, `BACKUP_RESTORE_POLICY`, `INCIDENT_DATA_POLICY`**. They currently have no values, durations, deletion behavior, tombstone design or enforcement job. #865 prepares the decision packet. Resolve/reconcile before actual persistence implementation/operation where required and before apply.
- Approved private connection/credential provisioning and role model, hosted PostgreSQL/runtime/configuration inspection, reserved advisory key, finite operation budgets, independent access authorization and no exposed-browser path.

### Migration/apply packet structure

1. Pin live main, exact reviewed implementation head and immutable migration blob; enumerate only the new schemas/roles/types/tables/indexes/helpers/triggers/policies/functions/ACLs. Inventory existing grants/exposure/extension versions and check names do not collide. No modification to accepted Evidence/Rule tables or shared Auth roles.
2. Produce a future migration through the repository workflow only in that authorized slice. One DDL transaction creates inaccessible objects, ownership, ENABLE/FORCE RLS, constraints/guards and scoped defaults; revokes PUBLIC execution before exact grants. No seed real receipts/cells/artifacts and no callable partially installed state.
3. Execute deterministic local disposable-PostgreSQL tests and security checks in that future slice; include all A01–A46 schedules and error paths. Separate local schema creation from hosted apply authority.
4. Request/obtain the separate exact Development Apply authorization, inspect drift and migration history, apply only the approved migration using the reviewed method, and perform the named read-only catalog/ACL verification phase. The existing intentionally unapplied migrations are not pulled in by a blanket push.
5. Reader/writer activation and real data remain gated by lifecycle, producer, authorization and qualification readiness. Production requires a separate explicit Product-Owner approval and exact plan; Development success is not permission.

### Rollback / containment structure

Pre-commit DDL failure rolls back the transaction. For a deployed but unused schema, a reviewed rollback packet can disable entry execution and demonstrate emptiness before any separately authorized object removal. For a schema containing data, first revoke/disable entry access under a reviewed containment operation; preserve exact bytes and inventory for authorized assessment. No automatic DROP, DELETE, truncation, cascading rollback, down-migration data loss, garbage collection or replay-from-current-catalog. A correction changes code/schema under explicit review and must not rewrite semantic bytes. Backup restoration and absent-key replay depend on the unresolved policies, not a hidden default here.

### Development verification checklist (future, not run)

| Verification | Required evidence |
| --- | --- |
| Exact DDL/catalog parity | Actual server major/minor and migration blob/history, eight relations, columns/nullability/checks, PK/unique/FK/index definitions, deferred reciprocal binding and complete-link constraints |
| Principal closure | Owners, non-login/non-bypass attributes, transitive memberships and SET ROLE options, schema/type/table/function/default privileges; no ownership escalation or PUBLIC/service grant |
| RLS | ENABLE+FORCE flags on every table; exactly role/command-scoped executor policies; negative tests as anon/authenticated/service/authenticator/unrelated role and caller, positive internal executor tests |
| Immutability | UPDATE/DELETE/no-op UPDATE/TRUNCATE CASCADE/MERGE/conflict-update/COPY/direct INSERT/trigger-disable/replication-role tests, existing-link insertion refusal |
| Function attack surface | Exact signatures/no overloads/default args, owner, empty search_path, qualified objects, no public wrapper/dynamic SQL/archived execution; unauthorized EXECUTE and shadowing tests |
| Byte/codec proof | Cross-driver binary round trip incl Unicode and escapes, duplicate-member and lexical rejection before JSONB, full-hash collisions simulated in isolated fixtures, all supported/unknown versions |
| Transactions | Barrier-controlled A10–A16/A37/A42/A46 multi-connection schedules; commit failure and lost acknowledgment; existing bad graph never repaired; reader old-or-complete snapshot |
| Bounds | At-limit/+1 tests for raw/decoded/union/depth/nesting/slots/response framing and duplicate lists; budget before over-limit fetch, driver buffering review |
| Historical semantics | Zero current/source/network reads; independent writer/reader credentials, read-only transaction, exact K equality, no mutation/acceptance on any verdict |
| Privacy/lifecycle | Actual authorized policy decisions and admission evidence; no personal/raw/model/secret preimages, diagnostics or unsupported incident archive |
| Advisors and repo gates | Security advisor + `db:rechte`, `db:rls`, `db:sicherheit`, schema/type parity and applicable auth checks in approved Development phase; missing secret/skipped tool is NOT RUN, not PASS |
| Exposure | REST/GraphQL schema settings, Realtime publications, all views/functions, exports/backup permissions and server/client bundles/routes; no direct browser path |

## 15. Classification and remaining authority

**AUTONOMOUS_PROVENANCE_PERSISTENCE_SQL_RLS_DESIGN_READY** — author assessment of this bounded documentation design only. No migration, runtime codec, private credentials, producer implementation, retention/lifecycle decision or database verification is delivered or implied.

The [report](OFFICIAL_TRUTH_AUTONOMOUS_PROVENANCE_PERSISTENCE_SQL_RLS_DESIGN_1_REPORT_2026-10-06.md), [handoff](OFFICIAL_TRUTH_AUTONOMOUS_PROVENANCE_PERSISTENCE_SQL_RLS_DESIGN_1_HANDOFF_2026-10-06.md) and [self-review](OFFICIAL_TRUTH_AUTONOMOUS_PROVENANCE_PERSISTENCE_SQL_RLS_DESIGN_1_SELF_REVIEW_2026-10-06.md) record delivery evidence and limits. Independent TL exact-head review remains required. PR stays Draft; no Ready, merge or follow-up.

**STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD EXACT-HEAD REVIEW.**
