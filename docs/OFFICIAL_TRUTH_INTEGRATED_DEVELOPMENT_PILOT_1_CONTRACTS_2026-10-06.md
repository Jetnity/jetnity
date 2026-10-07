# Integrated pilot internal contracts

R1 implements a controlled local engineering pilot. These contracts confer no production issuer authority or independent TL approval. The immutable TASK remains unchanged; TL amendment 6027081169 governs the explicit local successor profile.

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

Implementation bundle decoded bytes are C({schema:implementation-source-bundle-v1,files:[{path,utf8}]}), sorted by safe relative path. The captured application/dependency inputs, build metadata, exact emitted CommonJS bytes and worker bootstrap are retained and actually executed as described below. No function stringification or guessed Git pin is used. Host loader, compiler, Node and finite builtins remain the explicit trusted computing base; no production or hardware attestation follows.

Validity basis is exactly {kind:no_bound_asserted} for null, or {kind:qualified_locator,locator:{kind:json_pointer,pointer},value} for a bounded value. The primary positive derives validFrom=2026-10-01 from its strictly qualified response locator; the composed positive exercises null/unasserted. A qualified expired-response variant derives validUntil and is refused by freshness checks. Arbitrary external locator grammars are outside this fixed corpus.

## Execution and membership

Primary retains selected executable, complete extractor registry, exact successful fact and provenance in a WeakMap before outward cloning. Consumption requires the original extraction result/input and is one-shot. Composition consumes the shared #898 map with original phase A/B, genuine seal/fact and complete registry references; legacy and new consumers spend the same entry. Fixed invocations hold private predecessor tokens, exact origin membership and immutable values; clones, foreign/reused/post-close values fail. No public token factory is exported.

The pure `proveOfficialTruthCustodiedMaterial` seam accepts exactly authority, registry, evidenceVersions, review, scope, serverReferenceTime. It verifies actual prior canonical acceptance, proposal-null constructed review, exact scope/identity and freshness. It does not issue an origin or grant real authorization. Only the isolated engine supplies the synthetic external bootstrap. Production auth/AAL2 wiring remains unchanged.

The original source path executes canonical controlled retrieval, redirect/URL/DNS checks, strict whole-body synthetic profile, hash, canonical Evidence candidate/acceptance and only then original custody membership. Fresh extraction invokes the real primary/composition code. Private projections are staged and verified before any publication. Failure diagnostics contain finite stage names, counters, reasons and graph-bound measurements, never receipt/fact/body/origin bytes.

## Closed local graph profiles

Legacy v1 retains longest path8. The explicit `ot-integrated-pilot-local-closure-v2` envelope permits16 under the same counting: K is depth1; receipt, binding and artifact role edges are retained. Both actual required closures have longest path11. Calling the legacy verifier on exactly those bytes still refuses11>8. There is no automatic fallback, arbitrary budget or old-row relabelling. Unknown or mismatched profile/storage version fails closed. Profile metadata stays outside frozen Receipt/C/H/Pin/K bytes.

Unchanged bounds: receipt262144 bytes; typed roots11; union256 nodes including K; 1024 role edges; artifact1048576 bytes; K4096 bytes; union8388608 bytes excluding receipt and including K; canonical JSON depth32; encoded transport10485760 bytes; all stricter type bounds. Exact pins, types, collisions, declared and independently derived role edges, complete reachability and longest shared paths are mandatory.

Historical verifier failures remain receipt_corrupt, binding_corrupt, dependency_missing, dependency_corrupt, unsupported_version, closure_bound_exceeded or semantic_mismatch. Historical success grants no live handle, accepted Evidence/Rule, HTTP authority or F8 access.

## Local SQL and complete reader

All SQL lives under `scripts/db/official-truth-integrated-pilot-1/`; no migration is added. The runner owns a disposable private Unix-socket cluster with no TCP listener, rejects inherited connection targets and removes only its own resources. The v2 semantic schema is installed after the separately retained structural fixture schema.

SQL independently decodes canonical bytes, validates each closed typed object and derives its role edges. It checks all original/validity/accepted custody joins, full registries and selected definition eligibility, receipt/candidate/proof/K identities, exact scopes and validity/freshness semantics. SQL does not trust a TypeScript success flag or submitted edge list. Canonical date-only boundaries are UTC independently of the caller timezone.

Publication owns a byte copy before the first asynchronous boundary and rechecks the complete bundle. One atomic transaction serializes conflicting writers, validates retained shared closure before inserting anything, and enforces permanent name/type metadata, immutable byte identities and independent deferred completeness constraints. Existing missing/corrupt blobs, names or links cannot be repaired by either an identical retry or a different receipt sharing the damaged closure. Exact repeat and verify-existing leave all eight table counts unchanged. An uncertain COMMIT remains commit_outcome_unknown until verify-existing resolves it from retained data.

Success requires acknowledged COMMIT followed by a new REPEATABLE READ, READ ONLY transaction, complete closed #866 23-column response validation, full semantic revalidation and equality with the owned producer bytes. Every row has the requested record fingerprint and exact storage version. Row kind/order, null discipline, canonical integer/byte encoding, exact dependency/root sets and terminal status are checked. Missing, surplus or contradictory rows fail closed. Reader success grants historical audit data only.

Eight FORCE RLS tables, separate finite writer/reader and non-login execution roles, fixed empty search paths, revoked PUBLIC function privileges and no caller table DML are preserved. Local installation ownership is test infrastructure, not an application role. The separate old16-group structural proof does not substitute for the new actual full-domain roundtrip.

## Consumers and opt-in commands

New pure lib consumers and fixed script imports are exact finite entries in matching guards; app/components/lib remain scanned. Unknown/dynamic/default/namespace additions fail. Shipped producer remains custody_missing, extractors/policies empty, requirementsProviderAus() null. No application imports the isolated scripts.

`npm run official-truth:pilot-1` runs both captured canonical positive paths, actual full semantic SQL publication/readback, all declared negative variants, and the separately labelled historical structural proof. `npm run official-truth:pilot-1 -- --run-official-source` additionally runs only the fixed GOV.UK source attempt. Report JSON is checked by a closed schema, then written with a readable text report to the task evidence directory. Exit0 requires complete engineering success; exit1 reports missing or failed mandatory proof and overwrites any stale success report. Missing PostgreSQL fails the CI-discovered mandatory positive test; no skip or emulator is allowed. Live research time is distinct from fixed synthetic clocks.

## R1 local successor decision
The explicit TL amendment 6027081169 authorizes `ot-integrated-pilot-local-closure-v2` in a closed local transport/storage/reader envelope. Its longest path maximum is16 under unchanged K/root/role counting; v1 remains8. Unknown or mismatched profiles fail closed without retry. This does not version or modify Receipt, applicability, C/H, Pin or K bytes. The required full path is11, motivating the finite successor budget.

Unchanged limits: B262144; typed roots11; union256 nodes including K; all role edges1024; artifact1048576; K4096; union8388608 excluding B including K; nesting32; encoded transport10485760; stricter domain limits. The same static dispatch is required at local admission, SQL and reader. Historical rows cannot be relabelled. Mandatory tests: v1 8/9 and full11 refusal; v2 16/17; longest shared DAG; profile confusion; all other bounds.

Full publication means acknowledged atomic commit followed by a fresh complete independently verified semantic readback of the actual producer bundle. Structural fixture tests remain labelled as such. Uncertain commit is unresolved until verify-existing verifies full retained data. A captured immutable module/build snapshot must be the bytes actually loaded; runtime disk hashing alone is insufficient. These guarantees are local controlled-software guarantees only. Future hosted use requires a separate reviewed contract/migration/apply gate; none is performed here.

### R1 captured execution contract
`prepareControlledSyntheticPilot()` captures each actual esbuild-loaded application/dependency input once, records package/lock/resolution metadata, retains exact emitted CommonJS bytes and the literal worker bootstrap, and returns only a WeakMap-owned one-shot handle. The worker reconstructs and verifies captured input/output segments, loads the retained emitted bytes, and privately exposes the snapshot once to the engine. No application source is reopened at execution. Deleting/changing a disposable copied dependency after capture does not change that execution; a new capture sees the changed bytes. Original selected executable references, primary fact and genuine composition seal-bound fact remain inside this execution realm. The worker emits only a completely verified historical envelope. Clone/foreign/replay/accessor/extra-input tests deny context access.

The host loader, esbuild compiler, Node interpreter and finite Node builtins are the trusted computing base. Builder version/options are recorded metadata, not proof of the compiler executable. The claim binds the captured application/dependency inputs and exact emitted application/bootstrap bytes actually executed; it does not attest the host or hardware. Implementation parts are losslessly reconstructed at UTF-8 boundaries; no dependency graph edges are dropped to fit a budget.

### R1 bounded passport qualification result
The isolated profile is for GOV.UK guide content ID `435fb04f-2b9f-4f44-8b41-2a962e8c46a8`, published by Government Digital Service with its exact listed government authorities. It is unrelated to the National List profile. Initial API URL `/api/content/uk-border-control/before-you-leave-for-the-uk` redirects to `/api/content/uk-border-control`; both are fixed in the local representation. Production registries stay unchanged. A narrow semantic helper derives only `passport_validity / valid_through_stay` from the exact Swiss section and passport sentence, never complete entry/ETA eligibility.

The canonical real HTTPS attempt on 2026-10-06T23:25:35Z reached `response_too_large`: the whole guide exceeds the existing 65536-byte retrieval limit. No body truncation or limit relaxation is permitted. The proposed larger bounded identity parser is therefore not reached by this actual canonical run. Its separate whole-response qualification is a closed list of individually reviewed public components; the opaque publishing job/context field must be null. The observed research response also has non-null opaque publishing metadata, which would independently block that proposed qualification. Those values, raw page bodies and an unqualified full-response hash are not published. This is an evidenced source/representation incompatibility, not a government access refusal. Real origin, extraction, receipt and PostgreSQL stages remain unissued/unrun; no synthetic predecessor is substituted.

### Local transport liveness
The30-second inactivity bound applies to connection startup and each active query. A ready connection may remain idle while another owned connection works. Explicit close disables its timer. Real31-second idle reuse preserves the same backend; an active pg_sleep query still loses its connection at30 seconds. This correction addresses Linux CI evidence without changing graph, byte or semantic budgets.
