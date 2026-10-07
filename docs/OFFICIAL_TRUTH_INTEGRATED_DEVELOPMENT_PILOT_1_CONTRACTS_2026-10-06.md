# Integrated pilot internal contracts

R1 and its binding R2/R3 corrections implement a controlled local engineering pilot. These contracts confer no production issuer authority or independent TL approval. The immutable TASK remains unchanged; TL amendment 6027081169 governs the explicit local successor profile.

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

Unchanged bounds: receipt262144 bytes; typed roots11; union256 nodes including K; 1024 role edges; artifact1048576 bytes; K4096 bytes; union8388608 bytes excluding receipt and including K; canonical JSON depth32; encoded parameter transport10485760 bytes; all stricter type bounds. Exact pins, types, collisions, declared and independently derived role edges, complete reachability and longest shared paths are mandatory.

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

Unchanged limits: B262144; typed roots11; union256 nodes including K; all role edges1024; artifact1048576; K4096; union8388608 excluding B including K; nesting32; encoded parameter transport10485760; stricter domain limits. The same static dispatch is required at local admission, SQL and reader. Historical rows cannot be relabelled. Mandatory tests: v1 8/9 and full11 refusal; v2 16/17; longest shared DAG; profile confusion; all other bounds.

Full publication means acknowledged atomic commit followed by a fresh complete independently verified semantic readback of the actual producer bundle. Structural fixture tests remain labelled as such. Uncertain commit is unresolved until verify-existing verifies full retained data. A captured immutable module/build snapshot must be the bytes actually loaded; runtime disk hashing alone is insufficient. These guarantees are local controlled-software guarantees only. Future hosted use requires a separate reviewed contract/migration/apply gate; none is performed here.

### R1 captured execution contract
`prepareControlledSyntheticPilot()` captures each actual esbuild-loaded application/dependency input once, records package/lock/resolution metadata, retains exact emitted CommonJS bytes and the literal worker bootstrap, and returns only a WeakMap-owned one-shot handle. The worker reconstructs and verifies captured input/output segments, loads the retained emitted bytes, and privately exposes the snapshot once to the engine. No application source is reopened at execution. Deleting/changing a disposable copied dependency after capture does not change that execution; a new capture sees the changed bytes. Original selected executable references, primary fact and genuine composition seal-bound fact remain inside this execution realm. The worker emits only a completely verified historical envelope. Clone/foreign/replay/accessor/extra-input tests deny context access.

The host loader, esbuild compiler, Node interpreter and finite Node builtins are the trusted computing base. Builder version/options are recorded metadata, not proof of the compiler executable. The claim binds the captured application/dependency inputs and exact emitted application/bootstrap bytes actually executed; it does not attest the host or hardware. Implementation parts are losslessly reconstructed at UTF-8 boundaries; no dependency graph edges are dropped to fit a budget.

### R1 bounded passport qualification result
The isolated profile is for GOV.UK guide content ID `435fb04f-2b9f-4f44-8b41-2a962e8c46a8`, published by Government Digital Service with its exact listed government authorities. It is unrelated to the National List profile. Initial API URL `/api/content/uk-border-control/before-you-leave-for-the-uk` redirects to `/api/content/uk-border-control`; both are fixed in the local representation. Production registries stay unchanged. A narrow semantic helper derives only `passport_validity / valid_through_stay` from the exact Swiss section and passport sentence, never complete entry/ETA eligibility.

The canonical real HTTPS attempt on 2026-10-06T23:25:35Z reached `response_too_large`: the whole guide exceeds the existing 65536-byte retrieval limit. No body truncation or limit relaxation is permitted. The proposed larger bounded identity parser is therefore not reached by this actual canonical run. Its separate whole-response qualification is a closed list of individually reviewed public components; the opaque publishing job/context field must be null. The observed research response also has non-null opaque publishing metadata, which would independently block that proposed qualification. Those values, raw page bodies and an unqualified full-response hash are not published. This is an evidenced source/representation incompatibility, not a government access refusal. Real origin, extraction, receipt and PostgreSQL stages remain unissued/unrun; no synthetic predecessor is substituted.

### Local transport liveness
R1 separated the30-second startup/active-operation transport fallback from ordinary ready-session lifetime. R2 preserves that fallback and31-second idle reuse, while adding the effective native backend deadlines detailed below. An active pg_sleep now receives native statement-timeout57014 at25 seconds; it is no longer claimed to run until the client fallback. Deferred COMMIT has the separate armed20-second native guard. Graph, byte and semantic budgets remain unchanged.

### Independent deferred work
Every artifact and artifact-link deferred event still validates its retained parent. Expected typed edges are materialized once per event, compared with stored edges in both directions, and checked against exact target/type/family/name/blob metadata. There is no validation cache or skipped event. This removes repeated per-edge SQL work without weakening completeness or changing bounds.


## Binding R2 semantic and operational correction

R2 review5442544139 and checkpoint6038338666 govern this correction of the same Generation1 writer. The accepted integrated namespace remains legacy requirement_effect / visa with null applicability. Real-source qualification stays separately BLOCKED and is not rerun by R2.

### Independent finite SQL codec audit

The audit compared the complete finite dispatch in `semantic-v2.sql` with `official-truth-integrated-pilot-bundle.ts`, the unchanged `official-truth-autonomous-provenance-record.ts`, content-identity, source-registry, rule-claims, extractor-registry and composition-policy readers. SQL supports the disclosed local namespace; it does not claim to implement every future canonical fact variant.

| Canonical reader family | Native SQL enforcement and R2 comparison |
| --- | --- |
| Receipt, candidate, proof and citations | Closed fields, support order/cardinality, exact fact/candidate/proof/selection hashes and finite legal-slot coverage remain. R2 adds the missing candidate.requirementType = global cell scope.requirementType relation. A passport cell with otherwise valid visa candidate artifacts is independently refused. |
| Admission, scope and custody | All seven categories equal the canonical cell scope, contracts have exact roles, accepted identities/lookup keys/original/validity joins are independently recomputed. R2 adds evaluationDatePlan non-null iff validity.mode is travel_date, before any selected/unselected artifact can be admitted. |
| Extractor and policy descriptors | Existing ref order/uniqueness, representation coverage, URL membership, policy pairing, assignment roles/cardinalities and registry identity/currentness remain. Every extractor MIME is checked against its canonical MIME grammar, including unselected definitions. Identity/representation MIME uses the separate canonical Content Identity grammar, including its 64-character token limits. |
| Representation cardinality | Canonical extractor representations are 1–16. Only the new local TypeScript descriptor's erroneous maximum8 becomes16. Actual full bundles with9/16 pass;17 fails at TS and native SQL. Other R1 limits are unchanged. |
| URL, path and validity locator | Existing conservative canonical HTTPS/domain checks remain. R2 adds canonical path alphabet, no double dots and length<=200. JSON-pointer grammar is retained and its missing maximum256 is enforced in UTF-16 units, matching the TypeScript reader. |
| Catalog and implementation strings | Existing source/profile/item/currentness/URL uniqueness joins remain. Related audit fixes apply canonical UTF-16 length counting to display names and implementation source text; source names also require exact canonical whitespace trimming. Positive80/256/524288 and contradictory81/257/524289 vectors include supplementary Unicode. |
| Manifest, graph, K and bytes | Exact envelope metadata, roles/types, implementation dependency order, full reachability, pins/digests, no-heal, collisions and frozen Receipt/C/H/Pin/K remain. No graph, byte, node, edge or transport maximum changes. |

The direct SQL regressions rebuild all ancestor Pins and receipt/K fingerprints. Scope variants also rebuild Evidence-v2, lookup/scope keys, review-v3 and candidate/selection/proof identities. Each negative goes through the public native publisher without TypeScript preflight in an empty cluster; attempted COMMIT leaves all eight tables empty and a new reader reports absent. Positive controls precede refusal claims. The16-representation positive is also committed and independently read back in full. These historical vectors do not mint live execution custody.

### Fixed native backend deadlines, including COMMIT

Owned cluster configuration and protocol startup options establish statement_timeout=25000ms, lock_timeout=15000ms, idle_in_transaction_session_timeout=20000ms and idle_session_timeout=0 before application commands. There is no caller timeout parameter or environment override. The30-second active transport fallback remains. Normal idle connections outside transactions retain their lifetime.

A PostgreSQL-specific caveat is material: `finish_xact_command()` disables the statement timer before deferred COMMIT work. See the [upstream PostgreSQL implementation](https://github.com/postgres/postgres/blob/REL_17_6/src/backend/tcop/postgres.c) and [client timeout definitions](https://www.postgresql.org/docs/16/runtime-config-client.html). Merely moving SET outside the function does not bound that phase.

Before COMMIT, the wire adapter therefore starts a separate backend in the same owned local cluster and verifies its active PgSleep state. A fixed20-second server-side sleep precedes a fresh backend lookup and termination signal. PID, backend birth and transaction-start identity must all still match, so a later transaction or reused PID cannot be targeted. Failure to arm refuses COMMIT. The local installation owner is used only for this disposable proof infrastructure; no application/hosted role gains privileges. On completion or error, the guard is canceled and joined, with its control and guard connections closed. No PostgreSQL extension or PGlite is introduced.

Native regressions prove statement57014, lock55P03, idle-open-transaction termination, and COMMIT/deferred-work57P01. Each interrupted publication leaves all eight tables empty, releases its live advisory lock and permits a subsequent independent writer with full verified readback. The existing genuine committed-but-lost-ACK test still requires explicit verify-existing. Transport loss or COMMIT errors never prove whether a commit happened: the adapter conservatively returns commit_outcome_unknown. PostgreSQL interrupt processing and operating-system I/O remain infrastructure limits; no hardware-level real-time guarantee is claimed.

These are operating deadlines, not data TTL, retention, launch, hosted migration or cost decisions.

The closed Content Identity importer guard gains exactly `scripts/db/official-truth-integrated-pilot-1/r2-fixtures.ts`: it recomputes historical Evidence-v2 identities for the native counterexamples. No wildcard is added. Unknown siblings and filename lookalikes remain negative guard tests; the canonical production reader is unchanged.

## Binding R3: role-specific URL compatibility and armed-guard loss

The current [Issue #899 body](https://github.com/Jetnity/jetnity/issues/899) is the binding R3 report; checkpoint `JETNITY-HANDOFF-2026-10-07-PR900-TL-R3` is in [index #751](https://github.com/Jetnity/jetnity/issues/751). No formal R3 review was created. Existing R2 threads remain TL-owned. This section supersedes the earlier generic SQL URL/healthy-guard completeness claims, while preserving all R2 corrections.

| URL role | Frozen reader / SQL admission |
| --- | --- |
| Extractor exact allowlist, selected and unselected | `quelleUrlLesen(value) === value`; canonical HTTPS, inherited12–500 characters, no credentials, exact localhost or .local; canonical non-default ports, IP hosts, sub.localhost, wildcard characters and fragments remain possible in this historical descriptor role. |
| Representation request/final URL, Evidence identity, original/fresh observations and receipt support | Content Identity exact URL: same serialization, plus no non-default port, .localhost, wildcard or fragment (including empty #). Source ownership remains an additional independent catalog check. |
| Path allowlist / source-domain fields | Existing canonical domain/path codecs remain separate; do not impose their DNS grammar on an extractor exact URL. |

`url-codec.sql` checks components independently: literal quote/braces/backtick and backslash in paths; literal quote/angles/apostrophe in queries; literal quote/angles/backtick in fragments; exact literal/encoded dot segments; canonical authority, port, IPv4 and IPv6 spelling. Percent-encoded quotes/braces/apostrophes, empty query markers and encoded slashes remain unchanged valid bytes where the canonical reader accepts them. Neither normalization nor a TypeScript preflight repairs submitted bytes.

A-label validation independently decodes bounded RFC3492 Punycode, verifies unchanged mapping/NFC, and reproduces the actual reader's mark/joiner/bidi behavior. Node22's URL engine is **Ada2.9.2**, whose mapping table is15.0.0; the runtime's ICU78.3/Unicode17 tables are not its URL tables. The local SQL data is pinned to [Ada2.9.2 source](https://raw.githubusercontent.com/ada-url/ada/v2.9.2/src/ada_idna.cpp), SHA256 `1b9af936cdb63fb295c61e9444fee89e0b565205f8002fb40425fcaae5d544b7`. The offline generator verifies that digest; generated SQL regenerates byte-identically. Ada/Unicode notices accompany the data. This is compatibility with the frozen reader, including historical first-joiner and bidi-loop behavior, not a new IDNA policy or authority-domain allowlist. No runtime dependency, compiler, PGlite or Node call enters SQL. Reader changes require a new differential audit; finite vectors are not a universal equivalence theorem.

Native public-publisher regression packages fully rebuild ancestor Pins, B and K. Ten contradictory packages attempt publication and COMMIT; all eight storage tables stay empty and fresh independent reads report receipt_absent. Three matching encoded/role/boundary positives commit and compare the entire fresh canonical B/K/artifact readback. Separate per-role vectors include component ASCII, ports/IPs, IDNA, percent encodings,500/501 and preserved encoded positives.

### Commit guard state and truth

The existing25s statement/15s lock/20s idle-transaction/20s native COMMIT deadlines and30s active transport fallback stay fixed. Ordinary idle sessions remain unlimited. A control connection is established before guard arming; its2s backend statement limit is active before control commands. After observed arming, unexpected rejection of the guard operation while the target COMMIT is pending is recorded as `commit_guard_lost` and starts a single recovery operation through that already-owned control connection.

Recovery acts only on the original PID **and backend birth and transaction start**, using a fresh transaction lookup. The original transaction may still be idle while COMMIT is queued for dispatch; sampled query text/state cannot gate recovery. Native termination waits at most1s; the control command is bounded by2s; an independent5s recovery fallback closes unusable control/target transports and records `commit_control_failed`. No replacement connection or bare target PID is used. Intentional disarm is marked separately before cancel-and-join; cleanup also checks the guard backend birth. The target stays busy until recovery/disarm completes, preventing a later command from racing stale control work.

Only a received PostgreSQL `CommandComplete(COMMIT)` establishes ACK. Losing ReadyForQuery after that ACK does not erase it. Guard/disarm failure is separate fixed-field diagnostic evidence, also surfaced as `commitProtectionFailure` by the local persistence adapter. An acknowledged commit still requires fresh complete semantic and byte-exact readback. Without ACK the adapter returns `commit_outcome_unknown`; neither a signal nor empty activity is rollback evidence. An ACK winning the recovery race remains a verified commit with a disclosed protection failure. A failed surviving control path cannot promise server rollback; uncertainty remains explicit.

The mandatory native failure tests independently observe target `COMMIT/PgSleep` and guard activity before canceling or terminating only the guard. Both prove interruption, eight empty tables, zero deferred-probe rows, fresh absent readback, released advisory lock and a successful independent writer with full readback. A third native case holds only the real COMMIT frame after arming, observes the original idle transaction, cancels the guard, and requires real backend termination/rollback/independent-writer recovery without any fabricated result. A fourth native race holds a deferred advisory-lock barrier until guard loss is observed, releases it, and delays only the owned recovery call by1.5s within its5s bound: actual COMMIT ACK wins, reuse during cleanup is refused, full readback verifies the commit and an independent retry is idempotent. The fixture never fabricates ACK, SQL result or target identity. Existing healthy-deadline,31s idle reuse and lost-ACK tests remain mandatory. These are operating limits, not retention decisions or hard real-time guarantees under arbitrary OS/server/control failures.


The native observation budget spans the fixed25s publication statement and20s COMMIT plus5s observation margin; it is not a larger operation deadline. Cancel/terminate tests still independently observe actual target COMMIT/PgSleep before guard loss; the ACK race observes actual COMMIT waiting on its owned advisory barrier. Its barrier release is causally after the guard-loss observer, avoiding a timing-sensitive short-sleep assumption. Bounded failure diagnostics identify scenario/phase without SQL, PIDs, paths or parameters.

## Binding R5: shared checked SQL envelope and bounded evidence

Current correction authority is the immutable TL-R5.0 amendment and live#751 / Draft#906, superseding historical delivery-state prose above. Frozen canonical contracts, all R1 limits and R2/R3 URL/guard rules remain unchanged.

`artifact_envelope(artifact_input_v1)` performs the same lexical/hash/header/family/version and declared-edge checks previously inside `artifact_edges`. It returns that already checked JSONB value. Legacy `artifact_edges` retains its edge projection and generic custody-pin traversal. Typed `artifact_v2` consumes the shared envelope, then applies every existing typed-content, codec invariant, semantic and derived-edge equality rule. It does not repeat canonical decoding or compute unused legacy custody edges. No cache or constraint-event suppression is permitted; every deferred parent verification remains. The new helper is pure, private-schema, immutable/strict, empty search_path and explicitly granted only to the existing local execution roles. No hosted schema or auth change.

Diagnostics are bounded to32 operations per connection and16 captured connection records plus the target writer. Fixed fields identify scenario, phase, safe code, elapsed time, actual ACK, protection failure, result, independent readback and completed-check count. The connector remains a pass-through for successor tracking after injection is disabled. Failure readback is independently performed and full submitted B/K/artifact bytes compared; neither termination nor a readback exception is relabelled rollback or success. Arming refusal retains `commit_deadline_not_armed` as a diagnostic.

The separately opt-in native contention fixture changes only owned CPU contention during genuine COMMIT. It does not alter SQL, ACK, target identity or adapter budgets. It requires Linux/one CPU, starts five owned workers with5s startup limits and a35s cleanup fallback, then verifies lock release, absent/all-eight-empty or complete652-row readback and a fresh inserted/idempotent writer. These fixture bounds are not new operating limits or retention policy. Normal mandatory full-suite tests retain all R2/R3 scenarios and add native envelope admission checks.

The historical main log lacks exact failure cause. The measured contention RED/GREEN is a distinct causal experiment; normal full-suite runs and historical CI are not relabelled as its reproduction. Under arbitrary starvation the unchanged20s native COMMIT guard can still legitimately refuse work.
