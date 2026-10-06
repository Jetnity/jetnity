# Integrated pilot internal contracts

This implementation is PARTIAL and dormant. These are review candidates, not an issuer registration or TL approval. The immutable TASK is unchanged.

## Preserved historical identities

The implementation reuses the existing strict C/H, Evidence, Rule fact, review-v3, support-selection, safe review and citation traversal readers. Receipt payload is #855 `official-truth-autonomous-provenance`, schemaVersion 1, canonicalization `ot-provenance-json-v1`; recordFingerprint is H(`ot-provenance-v1`, payload). The receipt has exactly schema, schemaVersion, canonicalization, outcome, globalCell, candidate, evidenceQuality, extractor, policy, supports, citations and proof. No actor, session, custody flag or origin is added to that payload.

Global cell bytes are C({id,version,scope}); existing #861 artifacts remain C({kind,schemaVersion:1,value}). Separate K is the unchanged CustodyDependencyBindingV1 envelope with receiptFingerprint, globalAdmission, selectedSupportManifest and autonomousReviewConstruction. K is not repinned as a generic artifact. Source Content Identity schema 2 is distinct from supported legacy/v1 Rule facts; applicability-v2 cannot be cast into this producer.

New manifests have exactly artifactType, artifactContractVersion:1, id, version, content, dependencies. The digest covers all canonical envelope bytes. Dependencies are sorted exact {slot,pin} role entries derived from content; the reader additionally derives each expected type. Unknown keys, noncanonical bytes, duplicate members, versions, accessors and non-data arrays fail before normalization or getters.

## Closed manifest content

The Zod schemas and independently derived edges in `lib/readiness/official-truth-integrated-pilot-bundle.ts` are the executable specification. All objects are exact; arrays have finite bounds and canonical ordering where set-valued.

| Type | Exact content fields |
| --- | --- |
| implementation_bundle | encoding=base64; mediaType=application/vnd.jetnity.implementation-source-bundle+json; bundleBase64 |
| identity_profile | identityProfileId, identityProfileVersion, implementation, implementationDependencies |
| catalog_snapshot | registry (complete canonical source/content graph), profiles [{identityProfileId,identityProfileVersion,definition}] |
| extractor_registry / policy_registry | definitions [{id,version,current,definition}] |
| extractor_definition | descriptor (canonical definition without current/match/extract), implementation, implementationDependencies, outputContract, factSchema, applicabilitySchema |
| policy_definition | descriptor (complete canonical policy without current), implementation, implementationDependencies |
| semantic_contract / fact_schema / applicability_schema / output_contract / proof_contract / freshness_contract | contract (closed enum), implementation, implementationDependencies |
| content_item_definition / representation_definition | descriptor (complete canonical item/representation) |
| original_observation | binding, requestUrl, canonicalFinalUrl, contentType, sourceContentHash, startedAt, completedAt, qualification, transportContract, identityProfile, catalogSnapshot, hashContract |
| validity_origin | observation, evidenceScope, validFrom, validUntil, validFromBasis, validUntilBasis, derivationContract |
| accepted_origin | observation, validityOrigin, cell, globalAdmission, evidenceIdentity, evidenceScope, acceptanceContract |
| eligible_version_snapshot | entries [{versionId,custody,eligible}] |

Implementation bundle decoded bytes are C({schema:implementation-source-bundle-v1,files:[{path,utf8}]}), sorted by safe relative path. Actual fixed-run source files and local semantic dependencies are archived; no function stringification or guessed Git pin. This is a DISK SOURCE ARCHIVE, not loaded-executable attestation: import-to-read races, runtime/transpiler attestation and omitted external auth/network package code are not solved. No production release-custody claim follows.

Validity basis is exactly {kind:no_bound_asserted} for null, or {kind:qualified_locator,locator:{kind:json_pointer,pointer},value} for a bounded value. The fixed synthetic corpus only exercises null/unasserted bounds. Non-null basis/value equality is parsed; semantic source derivation for all possible locators is not a completed issuer.

## Execution and membership

Primary retains selected executable, complete extractor registry, exact successful fact and provenance in a WeakMap before outward cloning. Consumption requires the original extraction result/input and is one-shot. Composition consumes the shared #898 map with original phase A/B, genuine seal/fact and complete registry references; legacy and new consumers spend the same entry. Fixed invocations hold private predecessor tokens, exact origin membership and immutable values; clones, foreign/reused/post-close values fail. No public token factory is exported.

The pure `proveOfficialTruthCustodiedMaterial` seam accepts exactly authority, registry, evidenceVersions, review, scope, serverReferenceTime. It verifies actual prior canonical acceptance, proposal-null constructed review, exact scope/identity and freshness. It does not issue an origin or grant real authorization. Only the isolated engine supplies the synthetic external bootstrap. Production auth/AAL2 wiring remains unchanged.

The original source path executes canonical controlled retrieval, redirect/URL/DNS checks, strict whole-body synthetic profile, hash, canonical Evidence candidate/acceptance and only then original custody membership. Fresh extraction invokes the real primary/composition code. Private projections are staged and verified before any publication. Failure diagnostics contain finite stage names, counters, reasons and graph-bound measurements, never receipt/fact/body/origin bytes.

## Graph constraints and blocking contradiction

Limits: receipt 262144 B; K 4096 B; each artifact 1048576 B; union total 8388608 B including K; 256 nodes including K; 1024 role edges; longest depth 8 including K at depth 1. Strict canonical structural depth remains the existing C contract. Full pin/type uniqueness, closure, collisions and all role edges are checked, without truncation or repair.

The actual required path is K(1) -> AutonomousReviewConstruction(2) -> SelectedSupportManifest(3) -> eligible_version_snapshot(4) -> AcceptedEvidenceCustody(5) -> accepted_origin(6) -> validity_origin(7) -> original_observation(8) -> GlobalRepresentationQualification(9) -> identity_profile(10) -> implementation_bundle(11). Removing eligibility still exceeds 8. Both modes deterministically return closure_bound_exceeded, observed=11, maximum=8. No edge is dropped and no accepted bound is increased. This prevents complete C25 publication and integrated DB roundtrip. Contract reconciliation is required from independent TL review before further implementation.

Historical verifier failures are receipt_corrupt, binding_corrupt, dependency_missing, dependency_corrupt, unsupported_version, closure_bound_exceeded or semantic_mismatch. Even a historical verifier success cannot mint a live handle, HTTP authority, accepted Evidence/Rule or F8.

## Local SQL scope

SQL lives only under `scripts/db/official-truth-integrated-pilot-1/`; no migration is added. Runner owns a new private Unix-socket cluster, listens on no TCP address, rejects inherited connection/PG/Supabase targets and removes only its own resources. Five script files implement cluster lifecycle, bounded binary PostgreSQL transport, schema/adapter and proof.

Eight FORCE RLS tables, separate writer/reader/NOLOGIN definer roles, fixed search paths/ACL, canonical bytes/pins, immutable collision checks, exact retries, no-repair readback and advisory-lock serialized publication are executable STRUCTURAL fixtures. Public local function names explicitly say structural_fixture. This is not complete #866 semantic SQL verification or its 23-column production reader envelope. `persistVerifiedIntegratedBundleLocally` checks the shared full verifier before SQL; full pipeline inputs cannot currently pass. Transaction/security checks cannot be substituted for missing semantic conformance.

## Consumers and opt-in commands

New pure lib consumers and fixed script imports are exact finite entries in matching guards; app/components/lib remain scanned. Unknown/dynamic/default/namespace additions fail. Shipped producer remains custody_missing, extractors/policies empty, requirementsProviderAus() null. No application imports the isolated scripts.

`npm run official-truth:pilot-1` runs both deterministic paths, 20 negative variants and real local SQL structural proof. `npm run official-truth:pilot-1 -- --run-official-source` additionally runs only the fixed GOV.UK source attempt. Report JSON is checked by a closed schema, then written with a readable text report to the task evidence directory. Exit 2 is expected PARTIAL; exit 1 is unexpected conformance failure. Missing PostgreSQL makes the proof NOT_VERIFIED; the CI-discovered SQL test fails rather than skips. Live research time is distinct from fixed synthetic clocks.
