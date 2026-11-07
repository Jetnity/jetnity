# Atomic Version Refresh 1 — R7 bounded membership-copy correction

2026-11-07. Same issue #1152 / Draft PR #1153. Technical Lead selection: Root. Same implementation author **Jetnity Official Truth Atomic Version Refresh 1 — Codex Generation 1**, same session `/root/atomic_version_refresh_writer`. Immediate CHANGES REQUIRED correction of this package; no successor slice and no authorization to widen it.

## Exact baseline and observed failure

Published Final9 head: `0669c02b00b886817b1a4cc32754aa664b9717d7`.
Tree: `6a2269fee4689c9c6b3ac9ce4ae05847c93282a7`.
Parent: `94c93fe0feef07a0b63b8d582fabdc8e3b6ee6f2`.
Main remains `a2a3f175670dd7744dbb56ed81fee70c38bbdf38`.

Fresh CI [42418502652, attempt 1](https://github.com/Jetnity/jetnity/actions/runs/42418502652) completed FAILURE. Its actual checkout `e2ba6d18f6611c746617a34e8d88e99ffdb24fe8` has the exact Final9 tree and parents Main + Final9.

[Refresh Native 128541674858](https://github.com/Jetnity/jetnity/actions/runs/42418502652/job/128541674858) failed at the Composed complete positive, native.test.ts line 804 through positive() line 89: actual refresh roundtrip 25,004 ms, SQLSTATE 57014, unavailable/precommit_refused, no COMMIT or ACK, producer closed. No SQL phase object returned; the precise interrupted inner phase is UNKNOWN. Parent 681,333.524297 ms, total 682,253.158461 ms, 0 pass / 1 fail / 0 cancelled / 0 skipped, 91 diagnostics. The 900-s parent did not expire.

Actual preceding evidence on this exact head: all eight original/current Oracle probes; 99 real ACL denials per mode; all 14 Primary negative pairs; both Primary Count256 calls reaching SQL P0001; Primary NoCache/restoration and structurally valid canonical FalseFact refusal; actual fault rollbacks P7701 at 17,843 ms and P7702 at 23,854 ms; complete Primary success with 22,983.979 ms SQL / 23,017 ms roundtrip, actual ACK, producer absence, fresh canonical readback and rollback. Primary server reserve was only 2,016.021 ms.

The corrupt-Old matrix, three COMMIT guards, all three R6 blocked cases, race and four terminal cases were NOT REACHED in Final9. R6/R6A therefore remain source-reviewed but not yet natively accepted. Do not infer their native correctness from the earlier partial run.

Core 128541674591 completed SUCCESS (8,194 tests / 8,192 pass / 0 fail / 2 unchanged browser layout skips); Persisted 128541674853 completed SUCCESS (95 diagnostics, all 45 reads); Auth 128541674967 completed SUCCESS. Required aggregate 128546353227 correctly failed on actual success/success/failure. Exact-head Preview was READY with HTTP 200; none of these separate successes overrides the Refresh failure.

## Measured and source-supported cause to address

Current Composed Oracle probes: retained 2,138 ms, raw 4,770 ms, each 72 actual artifact_v2 calls. validate_inspected_graph_v2 consumed retained 929.622582 total / 915.524379 self ms versus raw 3,705.869128 total / 3,691.046563 self ms. Raw artifact_v2 consumed 743.017719 ms; raw semantic checking 241.036787 ms; all raw content getters 21.931060 ms. These are nested timings, not additive components. The actual graph worker is the remaining large measured cost.

The existing worker repeats `unnest(artifacts)` inside every edge-membership and root-membership EXISTS. Both predicates compare only artifact_id, artifact_version, digest and artifact_type, while each composite also carries canonical_bytes.

Official PostgreSQL 16 sources demonstrate the concrete materialization/copy path:
- [nodeFunctionscan.c](https://github.com/postgres/postgres/blob/REL_16_STABLE/src/backend/executor/nodeFunctionscan.c): FunctionNext materializes the full function result via ExecMakeTableFunctionResult.
- [execSRF.c](https://github.com/postgres/postgres/blob/REL_16_STABLE/src/backend/executor/execSRF.c): composite results retain the whole HeapTuple length and pass that tuple to tuplestore_puttuple.
- [tuplestore.c](https://github.com/postgres/postgres/blob/REL_16_STABLE/src/backend/utils/sort/tuplestore.c): COPYTUP / minimal_tuple_from_heap_tuple copies the tuple.
- [heaptuple.c](https://github.com/postgres/postgres/blob/REL_16_STABLE/src/backend/access/common/heaptuple.c): the tuple copy uses the full tuple length.

SELECT 1 in the later predicate does not itself make that prior FunctionScan materialization a metadata-only projection. This identifies avoidable repeated payload copying. The precise byte/TOAST representation of retained inputs and the per-membership share of total time have not been measured. No numerical speedup or sufficient final reserve is promised before fresh native evidence.

## Exact permitted implementation

Only these two author files may differ from Final9:

1. `scripts/db/official-truth-integrated-pilot-1/semantic-v2.sql`, current blob `e937aef17a6ecc2e0be5443f58fabe35940b1150`, SHA-256 `0a0df28a9bffa2d210159af5947eba22f39ed01e1228f1b94c0381091da23175`, 125,108 bytes.
2. `docs/OFFICIAL_TRUTH_ATOMIC_VERSION_REFRESH_1_HANDOFF_2026-11-07.md`, current blob `502a17868942d8fb4565767f674753d272047bc8`.

Inside SQL, change **only the body/local declaration of the existing R5 private function validate_inspected_graph_v2**:

- Declare one invocation-local variable of the existing `official_provenance_api.artifact_input_v1[]` type.
- After all existing input, duplicate/family and inspected-edge prechecks, and before the first membership scan, construct this compact array once from the complete original input.
- Preserve input element cardinality and ordinal order. Copy all six metadata fields identically: artifact_id, artifact_version, digest, artifact_type, byte_contract_family, artifact_contract_version. Set only canonical_bytes to typed `NULL::bytea`. Use an explicitly typed ROW and an order-preserving construction (for example WITH ORDINALITY with explicit ordering).
- Replace **only the two membership FROM/unnest sources** for edges and roots with that local compact array.
- Keep their complete EXISTS predicates byte-identical: same comparisons, bigint casts, expected-type handling, errors and SQL NULL behavior. No deduplication, filtering, key-map reinterpretation or implicit authority input.
- Use the original complete array everywhere else, including initial count/duplicate/family checks, FOREACH, full byte count, original decoding/hashing/capsule verification, semantics and the final cardinality check.
- Keep all graph construction after membership, starts/depth, longest-path relaxation, queue, cycle/path checks, work-count logic and limits byte-identical.

This local value contains only copied metadata for two lookups. It is not a proof cache, stored acceptance, caller-supplied authority or cross-invocation/session cache.

No other SQL function, signature, owner, grant, type, schema, search_path, timezone, volatility or security mode may change. No canonical migration/apply path, runtime driver/coordinator/producer/reader, reference fixture, workflow, dependency or package change.

**Native test remains byte-identical to Final9**: `scripts/db/official-truth-atomic-version-refresh-1/native.test.ts`, blob `12b5531e3986561320f9a2a3f41cff2da95f13ba`, SHA-256 `4d36e1b0ced5136ca076d68303d6053ab80abfb9677fcd45f18e8ab2bf0cdfe4`. No optional projection diagnostic, new timing assertion, new failure injection, runner change, JIT change, longer timeout, skipped scenario or favorable unchanged CI retry is selected.

## Preservation and acceptance criteria

1. Mechanically remove the added local declaration/construction and restore the two source names: the complete worker definition must recover the exact Final9 bytes. All SQL outside that definition must remain byte-identical. All other 15 author files remain unchanged; the Handoff truthfully records the narrow change and unknown native result.
2. Independently review the projection's existing-type field order, ordinal/cardinality preservation, complete-array construction before any forward reference, and unchanged EXISTS/cast/NULL semantics. Recheck the full immutable graph suffix and original byte/semantic inputs.
3. Retain R5's actual N calls per artifact_v2 invocation, all six private helpers and original ownership/ACL isolation. Keep all nine outer retained reproof stages, real fresh reads, grant/lifecycle checks, locks, CAS/currentness and post-wait checks.
4. Unchanged limits: 255 nodes, 1,024 edges, 8 MiB, depth 16, work 16,384; SQL statement 25 s, lock 15 s, idle transaction 20 s, COMMIT 20 s, reader 60 s, coordinator 120 s, existing recovery 2/5 s, Native parent 900 s, job 20 min.
5. Fresh complete exact-head CI must execute the existing eight Oracle probes with actual counters, all 14 Primary negative pairs, both Count256 SQL refusals, 99 actual ACL denials per mode, NoCache/full-table restoration, canonical FalseFact rejection, both injected rollback points and both full Primary/Composed positives. No success inferred from a structural-only fixture or partial run.
6. Freshly reach and pass corrupt-Old, all three COMMIT guards, actual R6 expiry55000/abort/lock-timeout55P03 with distinct owned backends and real blocking, all 17-table equality, actual PID/lock cleanup and original fixture restoration; real separate-reader/two-writer race; all four terminal cases. Full Native completion remains required.
7. Read actual original logs and probe/phase metrics, not only badges. Record actual SQL and total durations/reserves without claiming a numeric performance guarantee. A new failure requires evidence and return/STOP, not an unversioned scope expansion.
8. Complete fresh Core/Owner/Integrated/Persisted/Auth/Hygiene/Build/Preview/Aggregate, current Main/diff/review-thread checks, then Root-only PASS/Ready/Merge. New head resets every exact-head gate. After merge, fresh Main CI and actual Production/alias/both-host checks are required.

## Delivery and unchanged gates

Create one frozen Final10 snapshot with complete 17-file manifest, old/new Git blobs and SHA-256, sizes, changed flags, exact two-file delta and reconstructable patch. Include all nine immutable Root task documents as excluded fixed pins. Local/scratch analysis is not a published implementation. Root alone publishes the reviewed tree/ref and decides acceptance.

Existing TASK/R1/R2/R3/R4/R5/R6/R6A remain immutable. No agent-created successor slice, Ready, merge, deployment promotion or unilateral task edit. Return/STOP after delivery.

Hosted Development remains **APPLY_RESPONSE_SUCCESS / INDEPENDENT_READBACK_PENDING**, ledger UNKNOWN; Stage 2 NOT_ATTEMPTED. No original refused definition/ACL/ledger readback may be retried, rephrased or routed through another agent/tool/CLI/UI/manual path without an evidenced permissible platform clearance. Stage 1 is never blindly reapplied; the existing #1142 candidate must later bind to the actual authorized target under #1139. Separate Auth metadata success is not that baseline proof.

#1131 remains held; no held source code copying, Ready retry or integration through this PR. Application contracts/registration/activation remain closed. No actual AA source or owner-trip E2E claim, no Production DB apply and no Cursor/settings/cost change. Full persistent/versioned/refreshable entry-data product and the documented A–F remainder stay in scope of the overall project.
