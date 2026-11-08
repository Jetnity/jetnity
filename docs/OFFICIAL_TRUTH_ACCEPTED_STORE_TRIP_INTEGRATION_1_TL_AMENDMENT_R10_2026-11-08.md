# Official Truth Accepted Store Trip Integration 1 — TL Amendment R10

Date: 2026-11-08 UTC  
Disposition: **AUTHORIZED TEST-CONTRACT PARTITION / NO IMPLEMENTATION OR RUNTIME PASS**  
Work: #1155 / Draft PR #1156  
Exact reviewed parent: `a75e709f074576d3f1ad1d4ac8fec54956fcb02a`  
Main/merge-base: `e1fe0c696ade9f39b417772b5c065f87530204d6`  
Author: **Jetnity Official Truth Accepted Store Trip Integration 1 — Codex Generation 1**  
Same implementation session: `/root/accepted_store_trip_integration_writer`  
Authority: Root / Technical Lead; TASK and R1–R9 remain in force except the explicit native-suite test-contract change below.

## 1. Evidence and decision

The a75 Core original log (job128668274935; SHA256 `e6f56550a9aa490a69dc41959badcbd8821be4e525350f3a4513ffd75572ae56`) records the existing native entry cancelled at its240000ms limit. Only two new native family completion markers occur. Three real SSR cleanup cases alone took25439/25427/25424ms (76290ms total). No retained-integrity, after-wait, failedStage, completedFamilies or final-cleanup marker exists. The exact timeout stage is **unknown**. Earlier e51 completion markers are not current-head evidence.

Root and independent backend reviewer read the partition proposal (SHA256 `0a9533be515605b4569d168779ace8e8e18be74cc55f041230c3357dca8a034d`) and actual source dependencies. A single240s entry combines independent infrastructure, publication, integrity and lifecycle scenarios. Root authorizes four separately owned240s entries while preserving each complete stateful scenario and every existing case/assertion/protocol/time bound. This explicitly changes the aggregate native test contract; it is not a performance fix or an unchanged gate. The a75 run remains failed.

No CI job limit changes under R10: Core remains30min; no concurrency flag, command, runner, dependency or required-check change. R9 separately authorizes only Atomic parent1200000ms / refresh job25min. Extra fixture setup has a real cost; no new suite or Core completion is promised before execution.

## 2. Four mandatory suites and state dependencies

1. **Boundaries:** new `lib/readiness/official-truth-accepted-store-trip-integration-1.boundaries.test.ts`. Own real cluster/schema/catalog/Auth/witness/runtime/declared Trip. Keep all three SSR cases, eight outgoing cases and remaining unsafe/pre-abort/legacy/incoming/key-late-wipe boundary cases. It need not publish an accepted version.
2. **Native publication:** existing `.native.test.ts`. Keep closed request gate, actual A publication and fresh reader, R8 genuine real-client/saved-Trip positive and malformed-reference regressions, semantic re-proof, all four stage-mismatch refusals, actual B Finalize COMMIT with lost ACK, reconciliation/witness and full15-field support identity comparison, then partial restore/recovery together.
3. **Integrity/RLS:** new `.integrity.test.ts`. Independently publish/confirm/witness actual A then B through the real producer and read current B. Keep all seven retained-integrity cases, old-A competing-current23505 probe, owned/foreign/missing Trip and context re-attestation checks. No seeded/copy-generated accepted row or witness substitutes for the two publications.
4. **Wait/lifecycle:** new `.wait-lifecycle.test.ts`. Independently create genuine A→B/current B. Keep four actual SQL-wait refusals and positive controls (auth revocation, auth expiry, child change, ABA), then conflict→withdraw/no-reactivation, exact2versions/4operations and ACL assertions. Existing15s ready and1s actual waiter observer bounds and expected42501/22023 remain unchanged.

Every old assertion/family must map to a named suite in the updated matrix. Bootstrap prerequisites are not duplicate successful scenario claims. No mutable cluster/witness/accepted row is shared between suites. No copied global completedFamilies array: phase/family elapsed markers describe only actual completed work in their own suite. Failed/cancelled work cannot emit a completed-suite or cleanup-PASS marker.

## 3. Parent ownership and bounded failure drain are mandatory

Use the existing Atomic `OwnedTestLifetime` unchanged except its separately authorized R9 comment. It already tracks actual cluster-specific LocalPgConnection acquisitions, queries, COMMIT guard/control peers, closes transports/clusters before bounded drain and preserves cleanup errors. Do not introduce a replacement product factory or proof authority.

The new test-only helper must add the following concrete ownership:

- Attach actual entry `t.signal` from the beginning, and check a monotonic240000ms suite boundary before every phase, loop iteration and new SQL/product/fixture start. A synchronous nativeSql execFileSync may delay Node timers; it may finish within its existing transport bound, but cannot authorize the next start after monotonic expiry.
- Bind independent scenario controllers to the outer parent without conflating request/init/query/owner semantics inside a healthy scenario. Preserve genuine legacy factory calls without a signal; do not turn those into the opt-in API. Ordinary setup and positive-control Trip loads use an explicitly owned option.
- Register every begun product, HTTP-handler, observer, gate and setup acquisition promise. For a resource that arrives after parent abort, register ownership before the post-await parent check and close it; no resource may disappear because a generic run() rejects after acquisition.
- Stop synchronously prevents HTTP acceptance and later starts, aborts test controllers, releases known HTTP/body/key/lock holds and lets the existing lifetime close its real transports/clusters. Handler/SDK drain follows blocker release and transport stop. Use unchanged35s ownership drain, with actual settlement and preserved primary plus cleanup errors. No unowned Promise.race loser, no fabricated pending=0, no passing result on drain failure.
- No new pg_cancel_backend or product/SQL cancellation semantics. Already started operations remain owned; their healthy operation and SQL time bounds are unchanged. Failure-stop uses existing connection.close / cluster.stop ownership.
- nativeBinding setup must be exception-safe before returning: wipe its own key and remove an acquired witness directory if writing/fsync/admission/head setup fails. Late-acquired HTTP/witness resources are registered even after abort. Setup cleanup is hygiene and never counts as a product key-wipe proof.

Every healthy suite must, before its final successful marker and before witness.close(), verify unchanged ACLs, reservations=0, stages=0, finished HTTP work, actual absence of all its PostgreSQL client backends including idle guard/control peers, and product-owned key copies already wiped. Teardown must then prove all registered work settled, pending=0, all actual owned connections closed and cluster stopped. Witness close itself wipes copies, so a check made only afterwards cannot prove product wiping. Failure cleanup reports only observed results.

## 4. Exact permitted implementation surface

- Existing native entry, the three named new test entries, `scripts/db/official-truth-accepted-store-trip-integration-1/native.ts`, and new test-only `native-suite.ts`.
- Narrow parent-signal / gate-release / owned-start / drain plumbing in existing `native-boundaries.ts`, `native-fetch-boundaries.ts`, `native-semantic-reproof.ts`, `native-waits.ts`, `native-http.ts`, and `native-fixture.ts`; optional owner parameters preserve other existing callers. A nativeSql ownership guard may be supplied by the new helper; no SQL statement or timeout changes.
- Preserve retained-integrity case logic and assertions; its supplied reader callback can carry ownership. If another file requires more than this explicitly listed surface, return the concrete need to Root before editing it.
- Update HANDOFF and Acceptance Matrix with exact per-suite coverage, new parent/failure ownership, genuine extra setup and honest local/CI boundaries. Freeze all coherent Fix9 bytes with parent/base identities, SHA256/size/Git blobs and full manifest.

R8 product reference mapping and R4 null-observer correction remain separately authorized. R9 Atomic budget changes remain explicit. R10 does not authorize changes to product policy, SQL candidate, admission/auth/RLS checks, old Engine80-character normalization, existing business/display/source/authority/retention/reservation limits, assertion weakening, removed cases, synthetic accepted positives, or hosted actions.

## 5. Independent review and release gates

Root reads the complete frozen delta; separate backend and UI/source reviewers contribute evidence only. Same author/session fixes any finding. No self-review PASS, no author Ready or merge. Any published new head resets all exact-head gates: all mandatory suites and existing tests, original completed CI logs including terminal cleanup, type/lint/hygiene/build/Auth, exact Preview, main/base, ruleset and threads must be freshly reviewed.

Normal merge may happen only after full independent Root PASS. Actual-main CI and Production/domain verification precede #1155 closure. No automatic next slice.

SQL remains **UNAPPLIED** and bindings/contracts/provider inactive, **FEATURE_NOT_LIVE**. #917 remains APPLY_RESPONSE_SUCCESS / INDEPENDENT_READBACK_PENDING, ledgerUNKNOWN, Stage2NOT_ATTEMPTED; automatic refusal is not cleared and no retry, rephrase, alternate agent/tool/operator or bypass is authorized. #1131 remains independently held. All real-source/key/retention/witness/privacy/Owner/hosted activation gates persist.

