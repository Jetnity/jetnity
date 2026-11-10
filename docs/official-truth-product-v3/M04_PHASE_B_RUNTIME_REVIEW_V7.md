# M04 Phase B — final bounded native ownership delta review V7

## Disposition

**No open blocking source finding established within this bounded runtime/lifetime delta review. The earlier R7/R8 source traces and the requested native test designs are corrected in V7. Actual native/CI execution remains pending.**

This is specialist source evidence, not a Technical-Lead PASS, native PASS, Phase-B acceptance, Ready or merge authorization. Root alone makes those decisions. Reviewer: `/root/m04_uncertainty_advisory`, same session. Same Generation1 author owns all implementation.

Immutable input: `recovery/m04-root-review/phase-b-final-candidate-v7/`.

| Binding | Exact value |
|---|---|
| Receipt status | `COHERENT_SOURCE_FREEZE_FINAL_REVIEW_CANDIDATE_NOT_RUNTIME_PASS` |
| Native file |125,663 bytes; SHA256 `a69f41cf8126c419c60ee174f746588e8841884e40362de79f3ce871bd0eb5a6` |
| Source manifest |21,710 bytes; SHA256 `d8034825c45e3e5899e95ee402e6e297a623078b82993c4b5c1c2a031856c48f` |
| Source set |18 files; all byte counts and hashes independently reproduced against receipt and manifest |
| Recomputed source digest |`def1398352cf6ff7bbfbbe2043bf826f5f971870c7c376de39afec06efab2bdd`, matches the manifest's defined sorted format |
| Executed by this reviewer |No tests, runtime, SQL/native/socket, Git, network or hosted actions |

Coverage is the requested finite delta from V6: failure propagation, worker finalizers, closing-rejection regression, real START contention, T03 connection/observer accounting, actual backend terminal checks, underlying four-lane refusal, and the small authority implementation delta. Root reviews the broader business scenarios and new nonnative tests; the SQL specialist reviews catalog/parity/dependency/SQL matrices. Their work is not represented as independently repeated here. Unchanged protected source was not re-reviewed. Adapter/worker and relevant runtime hashes match the prior reviewed snapshots.

## Resolution of prior bounded findings

| Prior item | V7 source disposition | Acceptance limit |
|---|---|---|
| W6-01 / R8: failed subtest could emit positive receipt |Corrected: the owner captures the actual callback error, requires explicit successful callback completion and propagates error to outer `primary` |Source correction only; actual failing/passing runner output is not manufactured by this review |
| W6-02 / R8: global finally bypassed child close |Corrected: every wrapper registers a full finalizer before returning; finalizers are awaited before adapter observers/lifetime disposal |Actual process/native/listener cleanup assertions remain for CI to execute |
| W5-01 / R7-03: closing swallowed native rejection |Local preservation remains, plus a real child-close/native-acquisition regression fixture now exercises it |No native regression run has been performed here |
| R6-01: cancellation rejection skipped actual drain |Corrected adapter unchanged from V5; direct real-backend drain fixture retained |Not a native-run PASS |
| W5-02 / M04-T03: omitted inherited COMMIT pair |Finite aggregate work/observer inventory and actual per-case backend comparison added |Bounds are source-derived; no measured peak or elapsed time is asserted |
| V6 N04/N06 coverage qualification |New scenario creates two actual START contenders after preflight and proves both native lock waits |Satisfies the frozen `/start` allocation; no extra Claim-CAS race is demanded |

## R8: truthful group evidence and full child-owner cleanup

### Group outcome

`native.ts:467–480` no longer infers success from `t.test()` promise fulfillment. The callback explicitly sets `passed = true` only after its actual `lifetime.run(run)` completes. Its catch retains `assertionFailure` and rethrows for the real test runner. Outside the subtest, that captured error is thrown to the outer suite; a callback that did not run/succeed also fails the `passed` assertion.

The proof group is appended only after successful callback completion, successful exact backend-inventory reconciliation and a final lifetime check. A failure in any of those steps sets the outer primary failure and stops subsequent proof orchestration. This removes the V6 trace that could emit `nativePass: true` after a failing subtest while keeping the real Node failure result intact.

### Worker owner

`native.ts:300–417` now registers each worker's `finalize = () => handle.close(true)` in `unfinishedChildren` before `childWorker()` returns, hence before the caller's first command/await. A complete normal or error close removes that registration after actual exit/close and task joins, timer/stop-hook removal, listener removal and registry assertions. A retained native error is thrown only after cleanup and registration retirement.

The suite finally at `1353–1359` kills any still-live process, then awaits all registered full finalizers **before** closing adapter observers and disposing the lifetime. Errors are collected so another owner is not skipped. Child RPC tasks remain terminal-executor-owned; a resolved child-close event alone is not their completion. The existing `close()` waits both actual process close and all registered RPC tasks and checks that active/controller counts are zero.

The original missing-finalizer trace is therefore corrected. These are bounded wrappers for at most two child processes; no generalized process runner or new runtime capability was introduced.

### Residual diagnostic limitation, not a reopened blocking finding

The final cleanup assertions at `1360–1367` still execute outside the collected `errors` array. If cleanup itself violates one of those assertions, that assertion can replace the eventual final `AggregateError` and prevent its structured receipt from being emitted. It cannot emit a false positive: every such assertion precedes the `nativePass` diagnostic, and the earlier subtest failure remains in the test runner's result. This is a remaining diagnostic-quality limit, not the V6 false-PASS trace.

Raw SIGKILL before the full finalizer loop likewise does not bypass those finalizers now. With two unfinished workers, one may record an additional unexpected-exit error while the other finalizer is awaited; that is additional cleanup failure evidence on an exceptional path, not successful cleanup fabricated from a raw set-size check. No material hidden-positive or skipped-native-join trace was established from this order, so no further change is demanded by this review.

## R7/R6: actual native failure survives intentional child closing

The new `N12/R7-03` at `1050–1074` uses the actual controlled child and actual test-only PostgreSQL executor. After real target/control acquisition, the fixture injects a specific rejection for the control's cancellation-query call and holds the acquisition hook on a latch.

The test starts `worker.close(true)`, waits until the process has actually closed, then asserts that the close promise is **still not terminal** while the native hook remains held. Only after releasing the hook does it join close and require the retained `child cancellation cleanup failure`. It also requires the pending command to fail, confirms injection occurred, and checks zero native contexts plus one drained call. The per-case backend inventory then requires the complete live-backend identity set to return to its exact pre-case state.

This directly reaches the old `closing === true` catch path; replacing the preservation with the V5 suppressing catch would make the required close error absent. It does not substitute the direct-adapter R6 test for a process-owner regression. The injection is a controlled promise rejection on an actually acquired local control object, not a claimed genuine SQL error. Actual acquisition, abort/drain ownership, PID/birth disappearance, process exit/close and native task joins remain real when the suite executes.

The unchanged repaired adapter retains the control error, still closes target/control, still proves absence, and throws only afterward. No cleanup error is treated as a COMMIT acknowledgement.

## N04/N06: real two-target START race, one producer, no losing queue mutation

`native.ts:741–798` now provides the missing race design rather than repeating the old already-unknown check:

1. The fixture commits one valid enqueue and original claim through the actual fixed SQL path. Two separate durable-job facades then replay that exact claim and run their independent preflights.
2. The native `beforeQuery` hook captures **two different actual execution-start target identities** and holds both before their fixed API statement is dispatched. No producer has started, and the retained database snapshot still equals the original claim state.
3. The test acquires the lowest actual signed advisory token for the same subject/operation/attempt, then releases both hooks. It requires **each exact PID/birth** to show an advisory wait blocked by that actual holder.
4. After holder commit, it requires exactly one producer and one terminal losing worker while the winning producer is still held. Persistent state contains one start, the original two queue commands, no disposition and unchanged attempt count. An independent subject can progress.
5. Only then is the winner's definitive failure released. Both worker promises must terminate without thrown errors, producer count remains one, and final state contains exactly three commands, one start and one settled-failure disposition. The fixture finally releases its gates, rolls back any remaining holder transaction, joins both observed workers, closes the holder and disposes the fault family.

This is within the frozen N06 wording, “between preflight and claim CAS/start”: it uses the **start** allocation, with the original claim already retained. There is no need to invent an additional separate Claim-CAS race gate. The losing worker's generic failure cannot acquire private earned failure custody in the unchanged composition; the persisted two-command/no-disposition checks are the real assertion that it did not append a failure/audit transition while the winner was active.

The older `799–821` scenario remains useful and is now accurately named as an older-active-start/new-claim refusal. It is complementary to the new simultaneous START case.

## T03: finite physical accounting and actual terminal inventory

### Work and observer admission

`native.ts:439–463,487–494` introduces fixture-only aggregate counters shared across the base and transient fault adapter instances. Each jobs/intake/method call increments synchronously before invoking its underlying executor, refuses a fifth aggregate call, and releases only in its actual promise's finally. Native runtime lane counts were not increased.

The approved source-derived bound remains:

| Native work kind | Maximum active lanes | Physical connections per lane | Bound |
|---|---:|---:|---:|
| M04 jobs |4|4: target/control plus inherited COMMIT guard/control|16|
| S1 intake |4|4: target/control plus inherited COMMIT guard/control|16|
| MA1 observation |4|2: target/control|8|
| Total native work |12| |40|

Observers are now explicit: at most **two M04 observers** (base plus one transient fault family) and **one MA1 observer**. The transient observer is no longer hidden inside a two-base-observer statement. Fault families are created/disposed sequentially in the actual scenarios. Fixture-created owner/human/holder/waiter/observer connections have a separate finite inventory limit16; their close wrappers remove them from the local active set. These are fixture counts, not production capacity/SLO claims.

The fixture's aggregate guard is not allowed to manufacture the underlying capacity-test result: the fifth-call witness deliberately invokes the retained raw adapter while its actual four lanes are occupied, as described below.

### Actual terminal backend proof

Each successful proof group now records the complete actual client-backend `(pid, backend_start)` set for its database before the scenario and polls until the identical set returns after it. A leftover target, cancellation control, inherited COMMIT guard/control, transient observer or other newly retained connection therefore prevents the proof group from being recorded as successful. This is stronger than merely recording calls to `close()`.

The final lifetime receipt also accounts for all inherited helper acquisitions. For every acknowledged committing S1/M04 call it adds the four owned connections; for every admitted MA1 call it adds two, and requires total lifetime-owned connections to be at least that lower bound. Final checks require every registered connection closed, pending0, started==settled, all allocated clusters stopped and all aggregate call/observer counters zero. Per-case native snapshots and exact target/control absence checks remain.

This is coherent **source-level bounded admission plus actual terminal-absence test design**. It is not a claim that40 concurrent physical work connections were observed, nor a claim that the declared timing budget has been measured. The actual CI receipt is still required. No protected wire helper, runtime cap, cluster configuration or timeout change is introduced by this delta.

## Four actual live lanes and the refused fifth call

N12 `983–1010` starts four real jobs calls, holds all four after target/control acquisition, and waits for four hook entries. It invokes the **underlying** adapter directly for the fifth call, asserts that refusal is already terminal without releasing a lane, requires `{status:'unavailable'}`, and checks no additional admission/acquisition occurred.

It then aborts all four original calls but asserts they remain nonterminal with all four lane slots occupied while their hook is held. After release it joins every actual call, requires nonpositive results without cleanup errors, no fixed effect query dispatch and exactly four drains, then requires zero jobs lanes. Finally releases the gate and joins all observed promises even on assertion failure. This is a real finite adapter-capacity/terminal-custody fixture rather than a wrapper-only denial.

## Deadlines, IPC and authority delta

The native adapter and process-worker are byte-identical to the reviewed V6/V5 versions. Child IPC still transmits remaining duration; the parent still reconstructs a local monotonic deadline without subtracting IPC transit. The explicit limitation remains. The immutable absolute database `notAfter`, protected bounded COMMIT cap, and child's original post-drain Held/scope checks remain intact. No unsafe authorization escape was established, and no exact common monotonic clock origin is claimed.

The authority implementation delta is exactly:

```diff
- return async (request, signal, providedReceipt, _terminal = false): Promise<M04NativeReply> => {
+ return async (request, signal, providedReceipt): Promise<M04NativeReply> => {
```

This removes an unused parameter. Actual terminal admission still comes from the private scope's `terminalOperation(request)` and `terminalObservation()` custody, not a caller boolean. Shared Held exclusivity, immutable command/epoch binding, native ownership, deadlines and post-drain checks are unchanged. Current authority hash: `c06a222cdebbfa74f10bf222bf9a8df32fb488fab8939b3ea56f194c657eca3d`.

## Final boundary

The requested earlier source findings are resolved in this immutable candidate within this specialist scope. The new fixtures contain the required concrete control-flow/assertion witnesses; their successful execution is **not** asserted. No author self-review, manifest claim or Root-reported nonnative/static result is converted into independent native evidence here. Full native CI, exact-head integration/release gates and the other reviewers' scopes remain Root's separate acceptance work.

All Method/#1139/#917 and Product-Owner holds remain unchanged. No Ready/merge/next-slice action follows from this report. **STOP after this finite review.**
