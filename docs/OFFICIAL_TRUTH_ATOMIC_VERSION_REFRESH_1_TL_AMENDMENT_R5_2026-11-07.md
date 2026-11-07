# Official Truth Atomic Version Refresh 1 — TL Amendment R5

Date: 2026-11-07. Same explicitly selected #1152 / Draft PR#1153; no successor slice.
Author: **Jetnity Official Truth Atomic Version Refresh 1 — Codex Generation 1**, actual session `/root/atomic_version_refresh_writer`.
Implementation baseline head: `3ac5d6759d91e6977ed095f08d5f0eaf7ef8286b`.
Implementation baseline tree: `a722f68cfabc71746417d3e3e25642afd296a81e`.
Main remains `a2a3f175670dd7744dbb56ed81fee70c38bbdf38`.
Root alone PASS/Ready/Merge. This amendment permits the bounded structural correction below; all other TASK/R1–R4 restrictions remain.

## 1. Actual failure and causal evidence

[Root CHANGES REQUIRED](https://github.com/Jetnity/jetnity/pull/1153#issuecomment-6712405681): actual CI42408955148 attempt1, Refresh128512693520, checkout0459518c12797933f5c0a0be4634e40298b4dc59/treea722f68c. Parent225479.482950ms; first actual Bind-before-Supersede fault expectsP7701 but SQL returns57014 after25011ms. Positives/secondfault/guard/race/terminalcriteria are not reached. Earlier heads' passes do not transfer.

Fixed actual probe: JITavailabletrue, on4170ms/off4151ms, both completed/restored. This does not show a material JIT benefit. No unchanged rerun, guessed flag, or timeout relaxation is authorized.

Root and independent source analysis find nine retained full verifier calls in the simple successful Old→New path (Old4/New5), six before the first P7701 fault, plus publication bundle validation and explicit closure traversals. Each retained verifier invokes the pure artifact validation through closure traversal, graph validation and twice in retained-edge checking. Semantic content lookups repeatedly canonical-decode identical immutable bytes within one invocation. Counts are structural source evidence; they do not identify the exact interrupted inner phase or constitute an additive wall-time prediction.

This is a demonstrated implementation cost problem in the composed local operation. Preserve every outer authority/currentness/lookup/bind/read/recheck. Correct the repeated pure computation beneath them.

## 2. Explicit frozen-file exception and exact scope

The prior freeze is lifted ONLY for `scripts/db/official-truth-integrated-pilot-1/semantic-v2.sql`, baseline blob`4474216661c54b762c53be415c81bef4a25a10e0`, SHA256`23239ade2a90059a3dafa83ea1262e174c4d16faa1eb1b1f486f2b4532a5fa7c`,115072bytes, and only these four existing function definitions: `validate_graph_v2`, `validate_semantics_v2`, `closure_v2`, `verify_retained_v2`; plus exactly the six private helpers listed below and their minimal internal grants. Existing `validate_bundle_v2`, `content_v2` and `semantic_contract_v2` remain byte-identical. No new SQL types, schemas in the runtime installation, tables or columns.

Additional allowed author changes:
- `scripts/db/official-truth-atomic-version-refresh-1/native.test.ts`: bounded actual original/new equivalence and phase/call-cost evidence; retain all current tests and fault/race/terminal assertions.
- `scripts/db/official-truth-atomic-version-refresh-1/semantic-reference-r5.fixture.sql`: one immutable native-only reference fixture containing the five pinned original definitions `closure_v2`, `verify_retained_v2`, `validate_graph_v2`, `validate_semantics_v2`, `validate_bundle_v2`, as specified in section4.
- The existing HANDOFF, plus narrowly factual updates to existing ARCHITECTURE/DECISIONS/ROADMAP sections for this original task.

No other original file change is authorized. In particular **storage.sql, canonical, decode, typed, artifact_v2, derived edge rules, domain hashes, source grammar, publication/lifecycle/read APIs and SQL bodies, canonical migrations, Driver, Coordinator, Producer, #1151 reader and SQL, all old tests, workflow, package/lockfile/dependencies remain byte-identical**. `refresh-candidate.sql` remains exactlyR4. No changing the supplied currentness witness, fixture observation times or runtime boundaries.

This is a refactor of the existing full verifier, not another acceptance implementation. Existing external entrypoint signatures and semantic contract remain. It is not a migration for prior hosted or retained installations.

## 3. Required implementation invariants

### 3.0 Closed private helper inventory

Exactly these six helpers may be added under `official_provenance_private`, with SECURITY INVOKER, empty search_path and UTC:
1. `artifact_edges_once_v2(a artifact_input_v1) RETURNS jsonb`, IMMUTABLE: exactly one unchanged full artifact_v2 invocation and its complete ordered Slot/Pin/ExpectedType result, including empty sets.
2. `inspected_closure_v2(fingerprint text) RETURNS TABLE(artifacts artifact_input_v1[], inspected_edges jsonb)`, STABLE: actual retained root/typed-edge walk and full bounded raw closure plus its actually derived edges.
3. `validate_inspected_graph_v2(profile text,fingerprint text,receipt_bytes bytea,binding_bytes bytea,artifacts artifact_input_v1[],inspected_edges jsonb) RETURNS void`, IMMUTABLE: the single complete common graph algorithm, called only with locally derived inspection by existing raw/retained entrypoints.
4. `semantic_content_index_v2(artifacts artifact_input_v1[]) RETURNS jsonb`, IMMUTABLE: index derived from actual raw-aa bytes after explicit duplicate rejection. It may exclude `implementation_bundle` from this additional semantic-getter decode because full unchanged artifact_v2 still validates every complete capsule. No metadata type actually read by existing semantics may be excluded.
5. `content_from_index_v2(content_index jsonb,pin jsonb,expected_type text) RETURNS jsonb`, IMMUTABLE: same pin validation, exact identity/type binding and missing-dependency refusal.
6. `semantic_contract_from_index_v2(content_index jsonb,pin jsonb,name text) RETURNS void`, IMMUTABLE: the existing contract predicate over helper5.

All artifact_input_v1 type references use the existing fully qualified `official_provenance_api.artifact_input_v1`. Existing install assigns owner `ot_provenance_ddl`, revokes PUBLIC and grants only required existing NOLOGIN `ot_provenance_write_exec` / `ot_provenance_read_exec`. No login/refresh or generic role receives new access. Verify actual ACLs and denied calls. All data arguments to internal workers remain solely implementation-local; they are not added to outer API signatures.

### 3.1 One invocation, actual bytes, one derived typed edge set

Introduce private internal inspection of the actual retained closure. It traverses the existing roots and actual stored artefact metadata/bytes, invokes unchanged `artifact_v2` once per visited artefact and retains those derived edges only in local function variables. `closure_v2` keeps its existing external signature and actual closure behaviour. `verify_retained_v2` consumes the same invocation's inspected closure/derived edges for graph and exact persisted-link verification.

The raw-submission validation path must derive its own inspection from its actual raw input array. It cannot accept caller-supplied checked data, approval flags, cache keys or inspection arguments through any existing public API. No GUC, session, temporary table, persisted table, process or cross-invocation cache. Each of the nine outer verifier calls rebuilds fresh local inspection from its own actual database snapshot.

Use a single common graph-validation implementation for raw and retained paths. Every old graph assertion remains effective:
- Complete actual root and artifact identities, hashes, byte families, contract versions, typed content and declared/derived edges.
- Every incoming edge and every root checks its full pin and expected target type, including a later edge reaching an already visited node with another expected type. First-visit validation alone is insufficient.
- Duplicate raw (id,version) refusal occurs BEFORE any keyed JSON/index construction. No last-write-wins, silently collapsed duplicates, missing/extra/unsolicited artifacts or identity/type ambiguity.
- Original root starting depths1/2, longest-path relaxation, explicit cycle/path check,255artifacts,1024edges,8MiB,depth16 and16384work entries remain unchanged. All existing byte/depth/count errors remain refusals.
- Exact receipt/custody/artifact stored links are compared in both directions, including counts and exact slot/fullpin. Retain multiplicity semantics and target metadata checks; a set-only comparison must not hide duplicate/missing entries.
- Full graph/semantic proof remains for every accepted receipt before scope matching, including unselected and terminal/superseded records. No filter-before-proof optimization.

### 3.2 Invocation-local content lookup

Within the unchanged raw-array boundary of `validate_semantics_v2`, construct a bounded decoded-content lookup from the actual input bytes using unchanged canonical decode. Bind every value to the full artifact identity/type/family/contract metadata, and enforce duplicate identity checks before indexing. Repeated semantic content/contract references may use those same locally decoded values.

Preserve every existing semantic comparison, support ordering, unselected-origin audit, registry/qualification/validity/source/Review/citation/manifest/hash check. No source parser, extractor, canonicalizer, contract alternative or caller-provided validated map. No cached successful verification may bypass a subsequent verifier invocation or changed byte sequence.

Original public/raw helper entrypoints continue to validate raw bytes. New worker helpers remain private pure implementation details. Grant only the minimal use required to the existing NOLOGIN executor/DDL roles; no PUBLIC/anon/authenticated/service_role/writer-login/reader-login/refresh-role grants, new role membership or SECURITY DEFINER expansion.

### 3.3 Transaction and authority remain unchanged

Preserve STABLE/IMMUTABLE/VOLATILE boundaries, empty search_path/UTC, function ownership and private exposure. No rearrangement/removal of publication locks, lifecycle head locks, external CAS witness, post-wait checks, bind, full Old reproof, supersede, complete New lookup/read or final cutoffs. All nine full outer checks remain.

All limits unchanged: statement25s,lock15s,idleTx20s,commit20s,reader/currentness60s,coordinator120s,recovery2/5s,nativeparent900s,job20minutes. No assertion relaxation, skipped criteria, favourable retry, synthetic timestamps, discarded capsules or hidden cleanup claim.

## 4. Bounded genuine equivalence and actual performance evidence

Provide a frozen original reference for the changed algorithms, extracted verbatim from pinned semantic-v2 blob4474216661c54b762c53be415c81bef4a25a10e0. The exact original definitions and their SHA256 must be reviewable. Native-only installation may perform only enumerated deterministic function-name substitutions so reference calls reach reference counterparts. No body edits, mutable import of new algorithms into the reference, swapping the active runtime functions, replacement canonicalizers or weakened expected results. The fixed native-only reference schema is `official_refresh_reference_r5`; only the five enumerated fully qualified algorithm names may be redirected there. Reverse substitution must recover the exact pinned definition bytes. The reference schema/functions are owner-only with PUBLIC USAGE/EXECUTE revoked and no runtime imports or grants.

Use original canonical/decode/typed/artifact_v2 functions unchanged for both implementations. The reference is isolated to native-only functions, inaccessible to production/runtime imports, without additional caller grants or authority. No real external source or hosted database.

Required bounded actual comparisons:
1. Primary and Composed actual full retained and raw-bundle validation against original/new implementations, same actual bytes, with sanitized call counts/timings. Keep full capsules, all snapshots equal, rollback-only, settings restored, concrete backend closure, and explicit denied-role calls for every newly introduced internal helper/type. No fixed speedup threshold or choosing the faster run; actual full refresh completion under unchanged25s is mandatory.
2. Meaningful corruptions cover missing/extra/wrong stored links, malformed or canonically invalid raw bytes, duplicate identities, a second wrong incoming target type to an already visited pin, later deeper shared paths, graph boundaries/cycles/unsolicited nodes, and rehashed false canonical facts. Original/new must both refuse the same invalid proof class within their actual contract. A fully rehashed false fact may deliberately remain structurally valid in both reference and new SQL verifier; compare that result truthfully, then require its rejection by the unchanged canonical Old-reader/New-wrapper proof. Do not invent a stronger reference predicate or turn this optimization into a new extractor. No invalid canonical result may publish accepted data through the full refresh path. Reuse the complete unchanged legacy native matrix honestly rather than duplicating every existing case.
3. Verify changed bytes and stored link corruption are caught on later invocations, including on the same connection, to demonstrate absence of cache reuse. Restore all actual rows after each corruption; verify cleanup.
4. Retain actual R4 JIT/profile/restoration diagnostics truthfully. The new optimization's measured effect must be distinguished from the prior failed JIT hypothesis.
5. Full new Native matrix must reach both Primary/Composed positives, both real faults, all guard/lock/race proofs and all four terminal outcomes, with complete diagnostics and total below900s. All old Core/Integrated/Persisted/Auth and Preview gates must pass freshly.

If measurement is needed, only a fixed, native-local, per-transaction function-statistics probe on the owned disposable cluster is allowed. No global tracing/logging extension or changes to ordinary execution/settings. Restore settings and close the actual backend. Do not log raw bodies, caller parameters, keys, credential/session data or unsanitized errors.

The reference and tests are evidence, not a new production proof path. No unverified performance guarantee. If the complete unchanged limits still cannot be met, return the exact measured bottleneck to Root without widening scope.

## 5. Delivery and governance

Same author/session only. Freeze a complete final snapshot with every old/new blob/SHA256/size, a strict delta against the versionedR5parent, exact new private type/function/grant list, mechanical preservation audit for all unaffected definitions and every semantic comparison, reference extraction/name-substitution evidence, actual local checks and honestly pending native gates. HANDOFF must retain the complete prior CI failures and the scoped unproven claims. Return/STOP.

Root publishes the R5 task as an immutable commit based on3ac5d675 and links/readbacks it before implementation. The explicit new helper/type name list and complete grants must be delivered before final code review; internal naming is an implementation choice within the closed functions/scope above. Do not move the branch or cancel the current remaining CI just for a task seed; final author publication will include the R5 parent with an expected-head fast-forward. Root checks the entire tree and all fresh gates on the final head. No automatic follow-up.

Hosted/source/product holds remain unchanged: Stage1APPLY_RESPONSE_SUCCESS/INDEPENDENT_READBACK_PENDING,LedgerUNKNOWN,Stage2NOT_ATTEMPTED. No retry/rephrase/alternate route for refused readback; no #1131 Ready/copy/merge workaround. No Cursor/cost/settings/secret changes. The first target critical path remains #1139 and its legitimate platform clearance. This scoped local product-engineering correction is not a real entry pilot, source admission or Production activation.
