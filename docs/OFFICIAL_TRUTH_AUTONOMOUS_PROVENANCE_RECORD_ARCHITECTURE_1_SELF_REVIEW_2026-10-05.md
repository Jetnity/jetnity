# Official Truth autonomous provenance record architecture 1 — Self-review

Date: 5 October 2026
Logical writer: **Jetnity Official Truth autonomous provenance record architecture 1**, Generation **1**
Issue #854 · Draft PR #855
Session: `01a10ddb-bb39-7540-8b3d-72d87605ea5a` · **`gpt-6-astra` / `xhigh`**

This is the author's review of the proposed semantic contract against the binding task and live code. It is not independent Technical-Lead PASS and does not claim executed runtime tests.

## Task coverage

| Requirement | Architecture location / result |
| --- | --- |
| Record identity, schema version, canonical serialization, deterministic fingerprint | Sections 4–5; explicit schema, full digest, exact serialization and no self-reference. |
| Local UUID decision | Section 4; no semantic UUID; identical payload intentionally has identical identity. |
| Exact candidate fact, RuleScope, kind, schema pins | Sections 3–5 and 11; retain canonical fact and exact admitted global scope, never proposal. |
| Same-object/value invariant until acceptance | Section 11; actual private `F` reference, seal reference for composition, canonical hash/value equality before any separately authorized constructor call and on its result. |
| Extractor ID/version/source family/schema family/exact selector/output contract | Section 7; distinguish explicit post-retrieval selection and composed pre-HTTP selection; no MIME tie-break in composition. |
| Git SHA semantics | Section 7; operations metadata outside the receipt; exact implementation is pinned by immutable semantic artifacts. |
| Composition policy/registry/assignment/support/result identity | Section 8; actual phase-A/B context, exact versions, required targets, support union/subsets, source-attributed equal-values checks. |
| No composition | Required `policy:null`; missing/empty/null-ID object rejected. |
| Source/content/representation/profile/verifier identity | Sections 4, 6, 9; all live versioned bindings retained, verifier bound by immutable profile artifact, no invented existing separate verifier field. |
| Accepted Evidence duplication versus auditability | Section 6; version ID plus compact preimage, derive repeated scope/lookup/ID sets, no blind current joins. |
| Fresh same-request hash, initial/final URL, quality, times | Sections 6, 7, 10; both original and fresh times, common values only after equality; quality is candidate-level. |
| ReviewPacketKey/F7/proof/catalog snapshot/scope rebind | Sections 5, 9–11; historical identity only, no raw packet, no second registry read, no auth identity. |
| Caller/model authority forbidden | Sections 1, 3, 11–14; includes original metadata custody, not only forbidden key names. |
| Privacy per field and hash preimage | Sections 3 and 12; RuleScope not assumed globally safe; partial projection; personal/model/body/token preimages rejected. |
| Failure/blocked attempts | Section 14; no receipt, no durable errors/security/traveller logs; separate observability gate. |
| Replay and correction history | Sections 14–15; historical receipts cannot prove current freshness, corrections create new immutable records. |
| Retention split | Sections 15–16; semantic contract, persistence schema, PO/Security/Privacy lifecycle and Production apply remain four different decisions. |
| Explicit and composed examples | Section 13; hypothetical symbolic complete-production traces, not real source registrations or executed vectors. |
| Downstream interfaces/candidate paths/exact remaining gates | Sections 15–16; proposal only, no schema/SQL/activation/F8 implementation. |
| Single classification | One architecture verdict: READY_FOR_PERSISTENCE_DESIGN in the precise bounded sense below. |

## Adversarial author review

**Attack: a valid fingerprint becomes an approval token.** The integrity reader has no authority or side effects, no receipt-to-execution restoration interface exists, and historical audit success cannot reach extraction/acceptance/store. Even an authentic record cannot replace the current trusted chain. A checksum also cannot prove server authorship by itself.

**Attack: replace the fact while retaining the review packet.** The current review packet identifies review material, including proposal. It does not identify the newly extracted fact. Separate fact and candidate digests bind canonical output, schema, cell, quality and support set; later acceptance must consume the actual private fact reference and verify canonical equality. Candidate proposal is never a truth source.

**Attack: launder traveller information through a hash.** The safe cell projection checks independent global origin before retaining any key. Evidence lookup/version and review-key preimages are in scope, including proposal and dates. An actual itinerary date cannot be relabelled a public regulatory date. Public page bodies are also subject to non-personal qualification; raw hashes are not anonymization.

**Attack: caller-controlled original Evidence metadata acquires authority merely because the server re-parses it.** The live review code was followed through `officialTruthAkzeptierteEvidenceAusAbruf`: accepted values can be reconstructed in memory from submitted envelopes. The architecture explicitly requires independent trusted server custody of original observation/validity/scope/metadata/support selection before receipt production. Fresh content equality does not supply that missing origin. Current shape checks do not implement this gate.

**Attack: drop a scope qualifier for privacy.** The projection rejects the entire unsuitable execution. It never changes a meaningful value to `not_applicable`, drops a second citizenship, chooses a default document, replaces a travel date with reference time or creates a broader key. A later separate global research execution cannot retain the old personal Evidence/review IDs.

**Attack: composition appears proven from a plain object or citations alone.** The private seal's object identity and actual phase-B result must be in custody. Assignments come from the executed frozen policy; all observations must have been checked. The proposed result hash binds fact, pair, manifests, support set and citations, but cannot recreate execution or a seal. The missing outer-result metadata is named as a future implementation prerequisite.

**Attack: same-source or same-content confusion.** Current live v2 item-pair semantics override historical distinct-source prose. Two items under one source may be distinct supports; duplicate item pairs are rejected even when representation IDs differ. The examples preserve this distinction.

**Attack: mutable ID joins change the past.** Compact support preimages are in the receipt. Larger dependencies resolve only by exact immutable triples and bytes; a missing manifest is incomplete audit. Neither a current catalog query nor `main` nor latest extractor code is historical evidence.

**Attack: time fields appear to assert more than the chain proves.** The design preserves Evidence time, proof reference and fresh completion separately. It refuses backwards completion clocks. It does not compare normal post-reference completion against the earlier reference as if it were old Evidence, and does not claim freshness at later acceptance. No retention period or new freshness TTL is chosen.

**Attack: a producer-success record implies accepted Rule or successful store.** Outcome is only `trusted_fact_produced`. No accepted flag, Rule ID, write timestamp or mutable lifecycle field exists. Failure logs and later supersession relations are separate designs. Current constructor/store restrictions remain untouched.

## Corrections made during this self-review

- Added the explicit upstream metadata-custody requirement after tracing the pure accepted-Evidence reconstruction. A server-shaped graph alone is not sufficient provenance for originally submitted times/validity/metadata.
- Corrected the primary example to cite both `semantics` and `duration`, including the canonical null, consistent with complete field coverage.
- Explicitly separated immutable semantic definitions from snapshot `current` eligibility so retiring a version does not require changing historical definition bytes.
- Kept actual initial request URL distinct from final URL; the future producer must capture it during the loop, rather than infer it later from an ordered request set.
- Made symbolic examples and unimplemented pins explicit; no illustrative hashes/versions are represented as real accepted evidence or verified conformance vectors.

## Limits of the verdict

The semantic contract is complete for its admitted domain. Implemented global-origin/privacy qualification, original-metadata custody, executable/schema artifact pins, immutable manifest resolution and internal composition/retrieval metadata retention are still absent as a complete receipt-producing path. No real extractor/policy has been registered. These are explicit future prerequisites, not permission to emit partial receipts now.

The proposed v1 does not cover every possible traveller-triggered execution. Unsafe or unprovable inputs produce no receipt. That bounded rejection is intentional; widening the domain requires a separate reviewed contract rather than weakening the privacy or no-caller-authority rules. Future persistence must also resolve lifecycle/access/dependency questions through its own gates.

No database, migration, Supabase, runtime, tests, retention decision, registration, Evidence/Rule/F8, provider, Production or CH work was performed. No local application tests/build were run. Mechanical docs checks and the final live gates are recorded in the [report](OFFICIAL_TRUTH_AUTONOMOUS_PROVENANCE_RECORD_ARCHITECTURE_1_REPORT_2026-10-05.md); remote checks belong to the final pushed head.

**AUTONOMOUS_PROVENANCE_RECORD_ARCHITECTURE_READY_FOR_PERSISTENCE_DESIGN**

PR remains **Draft**. **STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD EXACT-HEAD REVIEW.**
