# M04 Recovery Task V28 — failure 29 and bounded R37 diagnostic

This dated record retains the complete binding tasks once each. V28 v2 selects temporary measurement after V28 v1 analysis. The instrumented diagnostic head must never be marked Ready or merged, including if CI is green. A later separately selected correction must restore native.ts exactly before final acceptance.

## V28 v1 — complete original CHANGES REQUIRED and analysis task

Source: https://github.com/Jetnity/jetnity/pull/1184#issuecomment-6784742126

## Technical-Lead Review — CHANGES REQUIRED / R36 observation29

Observed 2026-11-11 01:57:57 UTC. Exact reviewed head **d1f134a698ddd63c147191b34f24f529a28f5605**, tree **2fb7e4c82b4fb8a71e08fc0347bac016086c5b73**, Draft #1184, branch **fix/official-truth-v3-m04-postmerge-r36-20261111**. Current main/merge-base remains **fbcb72e7c65a5e7c7e4f2e20105ab6f4b2201a54**, ahead1/behind0. Main's earlier failed acceptance remains unresolved. No Ready, TL-PASS or merge.

### Actual terminal failure

[CI42939990089/#4098/attempt1](https://github.com/Jetnity/jetnity/actions/runs/42939990089) is now COMPLETED/FAILURE. Repository130259240528 ended01:52:11Z; Root personally verified terminal metadata01:52:45UTC before its complete log. Independent source reviewer checked metadata01:53:18UTC and independently read the complete log. **Only the N05 child25 and M04 parent1700 fail, due to `M04 240s effect budget exceeded`.** No install/parser failure is present.

Native24/31 groups complete. First23=106383ms; full254/255/256 ledger80449ms PASS. The cycle proof stopped at **cycle_start**, zero-based index42 begun/41 completed; 128/128 command requests/command calls,128 commits;43 START calls begun/42 completed/42 reservations;172/171 fixed calls. The unacknowledged **START** outcome is UNKNOWN. Full64/65, final pointer-refusal proof, inherited761/minOwned4182 and final six rollback/latewriter groups are NOT_REACHED, not zero-count PASS. Effect+cleanup240270ms, cleanup23ms. All27253 operations settled,4242/4242 connections closed,1/1 cluster stopped,zero pending/child processes/cleanup failures. Both real nested R9 ownership witnesses are retained.

Core8697 tests/8693 passed/2 failed/2 inherited skips/971 suites;844438.477229ms. Typecheck and lint succeeded; five hygiene checks and Production build were skipped after Core failure. Aggregate130266109803 ended01:53:04Z with only CORE_RESULT=failure; all other four job families success. No second independent aggregate defect.

Repository full log4259277bytes/SHA256 **b306193ee62f154baa45aba3294ec646939396e4c1507486d0f695b5f8a4449d**. Native JSON3816bytes/SHA256 **233320ae18ad173a2c22e54bd3b4b842e851138c222c4a39ed8165a8771167ff** (with finalLF3817/2300244565c50c8e16b101cdf9e272c5b2c6c2e3d6b09cff618fe2ac6b7ba488).

All six companion jobs are terminal SUCCESS. Root and independent reviewer fully audited UI50/50, Persisted1/1 with95events, Store4/4 with39events, Lifecycle4/4 with29events. Root read complete Atomic1/1 with151 ordinary JSON events plus the separately retained360-byte TAP-escaped edge-order22P02 line; independent Atomic audit is finishing. Auth metadata only; Auth logs unread. Exact checkout is **7eec430e0e27a40737edaec76378143c28760cb7**, whose tree equals this head and whose parents are [fbcb,d1].

Preview **dpl_7iHhQQafcRghRm1Gk48dzVxKboR5** READY/exactd1. Production **dpl_HV5HcshbAcnBem14oPJpDGANb1pX** READY/exactfbcb; both production aliases individually point there. These deployment facts do not cure the failed native acceptance. Fresh live check01:53:23–01:53:59 found no external Owner/Guardian instruction or source drift; mode re-read NORMAL.

### Recovery Task V28 v1 — analysis and measurement design only

Same author: **Jetnity Official Truth V3 Durable Jobs1 — Codex Generation3**, actual session **/root/m04_durable_jobs_writer_g3**. Same independent source reviewer **/root/m04_recovery_source_review_g3** and CI/live reviewer **/root/m04_recovery_live_audit_g3**. No replacement generation or pretend Cursor UI rename.

Goal: choose a bounded correction grounded in the full-history algorithm and actual available measurements. The R36 query-count reduction is NOT a demonstrated runtime improvement. Observed ledger durations are R35 PR40534ms, R35 actualmain65545ms, R36 PR80449ms; these are separate whole-run observations, not a controlled CPU/runner attribution or server-function profile.

Authorized now: read-only source/contract/primary-documentation analysis; distinguish fresh integrity/authority obligations from repeated pure work; evaluate bounded invocation-local reuse and whether the R36 CTE should be reverted; design the smallest possible owned-disposable-CI diagnostic if existing logs cannot locate the cost. A diagnostic proposal must identify enable/read/restore points, bounded ownership/cleanup, overhead and the provenance of any scope restriction. **No native/test/fixture/SQL/workflow edit is authorized by v1. No implementation or execution until Root selects a concrete versioned amendment.** Existing V27 selected-source authorization is exhausted by this failed exact candidate.

Deliver exact proposed source spans/pins or diagnostic design, semantic obligations, countercosts, remaining unknowns and recommended bounded next step. Source counts alone must not be represented as performance proof. Keep all31 groups, full quotas and effect240000/cleanup60000/total300000ms, authority, tamper detection, uncertainty, rollback and cleanup intact. No unchanged-head rerun. No local/replacement project/parser/SQL/native/socket/build/test execution, downloads/installations/clone/gitfetch/push. Existing reviewed CI remains the sole project execution surface. No Auth logs or hosted DB/Auth/RLS/ACL/migration/credentials/provider/research/scheduler/notification/newcost/public activation.

Root will persist the complete R36 observation29 and full companion evidence in the next selected same-PR correction package, while preserving all prior28 failures and the genuine R35 PR success. Current proof and log evidence is pinned above and remains live. Do not mark Ready. Do not merge. Do not start a follow-up slice. STOP after the bounded analysis delivery for independent Root selection.

First unfinished step: finish independent terminal log review and select a concrete V28 correction/measurement amendment. Finite8path documentation completion stays HELD until a genuine corrected actual-main PASS, followed by its own contracted gates and STOP.

SQL_UNAPPLIED; METHOD_NOT_APPROVED; #1139NOT_RELEASE_READY/17preOwnerGaps; #917UNKNOWN/Stage2NOT_ATTEMPTED/no individual access/retry/rephrase/delegation/reroute/transport switch/humanSQLsubstitute; #1131ReadySTOP; both#1135holds; #968isolation; #911/#913privacy; D1#1169unfinished. Concreteclient/SSR/Authbindingunproved. All specialOwnergates remain.

Risks: P1 actual-main and newDraft M04 acceptance failed; P2 repeated quadratic validation and unprofiled runtime costs; P3 two inherited skips/finite closure held. No new concrete P0 identified in this bounded review; not global clearance.

### Complete current native receipt

```json
{"schema":"jetnity.m04.native.v1","candidateSha256":"92ca2bf0c45c9e3702b2de63bf984d6a1f30b6fe4c9c3ee83de35ae470ab2d16","rollbackSha256":"9b9089d74242a802455cc7e3fb8a0a8515c17b61b45ae730b9bbba1adb650a66","executed":true,"effectAndCleanupMilliseconds":240270,"cleanupMilliseconds":23,"clusters":1,"childProcesses":0,"lifetime":{"started":27253,"settled":27253,"pending":0,"connections":4242,"closed":4242,"stoppedClusters":1},"groups":[{"id":"N01","milliseconds":40},{"id":"N02","milliseconds":2734},{"id":"N03","milliseconds":2821},{"id":"N07","milliseconds":11519},{"id":"N07/R4","milliseconds":934},{"id":"N08","milliseconds":13523},{"id":"N08/U04","milliseconds":4625},{"id":"N02/U04","milliseconds":1851},{"id":"N04/N06","milliseconds":3624},{"id":"N04/N06/N10","milliseconds":3946},{"id":"N05/N09","milliseconds":3571},{"id":"N09","milliseconds":20767},{"id":"N10/U06","milliseconds":6997},{"id":"N11","milliseconds":2154},{"id":"N11","milliseconds":216},{"id":"N12","milliseconds":152},{"id":"N04/N10/N12","milliseconds":4149},{"id":"N12/U06/R9","milliseconds":14514},{"id":"N12/R7-03","milliseconds":538},{"id":"N11","milliseconds":3246},{"id":"N11","milliseconds":372},{"id":"N11","milliseconds":378},{"id":"N13","milliseconds":3712},{"id":"N05/A03","milliseconds":80449}],"nestedRaceWitnesses":[{"boundary":"i1_timeout","operation":"reserve_v1","target":{"pid":"25870","birth":"2026-11-11 01:47:20.759216+00"},"control":{"pid":"25869","birth":"2026-11-11 01:47:20.753892+00"},"holder":{"pid":"25503","birth":"2026-11-11 01:47:16.447755+00"},"realSqlWaitObserved":true,"abortDelivered":true,"retainedExecutorDrained":true,"backendAbsentWhileExecutorHeld":true,"failConfirmObserved":true,"terminalEffects":0,"beforeDrainSlot":"unavailable","afterDrainSlot":"invalid","heldMethods":3,"completedMethods":0,"outwardStatus":"worker_only","nativeAdmissionsAfterDrain":45},{"boundary":"worker_caller_abort","operation":"reserve_v1","target":{"pid":"26512","birth":"2026-11-11 01:47:30.285904+00"},"control":{"pid":"26511","birth":"2026-11-11 01:47:30.279172+00"},"holder":{"pid":"26118","birth":"2026-11-11 01:47:25.868516+00"},"realSqlWaitObserved":true,"abortDelivered":true,"retainedExecutorDrained":true,"backendAbsentWhileExecutorHeld":true,"failConfirmObserved":false,"terminalEffects":0,"beforeDrainSlot":"unavailable","afterDrainSlot":"invalid","heldMethods":3,"completedMethods":0,"outwardStatus":"unconfirmed","nativeAdmissionsAfterDrain":44}],"quotaProgress":{"currentGroup":"N05","boundary":"cycle_start","indexBase":0,"millisecondsCap":300000,"timingMeaning":"client await durations including construction/transport; not server statement profiling","ledger":{"lastStartedIndex":253,"lastCompletedIndex":253,"commandRequestsStarted":258,"commandRequestsCompleted":258,"commandRequestMilliseconds":533,"fixedCallsStarted":260,"fixedCallsCompleted":260,"fixedCallMilliseconds":80072,"commandCallsStarted":258,"commandCallsCompleted":258,"commandCommits":256,"startCallsStarted":1,"startCallsCompleted":1,"startReservations":1},"cycles":{"lastStartedIndex":42,"lastCompletedIndex":41,"commandRequestsStarted":128,"commandRequestsCompleted":128,"commandRequestMilliseconds":272,"fixedCallsStarted":172,"fixedCallsCompleted":171,"fixedCallMilliseconds":52291,"commandCallsStarted":128,"commandCallsCompleted":128,"commandCommits":128,"startCallsStarted":43,"startCallsCompleted":42,"startReservations":42}},"connections":{"aggregateWorkConnectionBound":40,"maximumJobs":4,"maximumIntake":1,"maximumMethod":2,"m04ObserverLimit":2,"maximumM04Observers":2,"methodObserverLimit":1,"fixturePerClusterLimit":16,"inheritedCommitGuardPairs":0,"minimumOwned":0},"failure":{"phase":"proof_25:N05","error":{"kind":"fixture","code":"unclassified_failure"}},"cleanupFailures":[],"cleanupFailureCount":0,"nativePass":false}
```


## V28 v2 — complete selected diagnostic implementation amendment

Source: https://github.com/Jetnity/jetnity/pull/1184#issuecomment-6784909084

## M04 Recovery Task V28 v2 — R37 bounded diagnostic implementation selected

2026-11-11 02:08:45 UTC. Binding amendment to [V28v1 / CHANGES REQUIRED](https://github.com/Jetnity/jetnity/pull/1184#issuecomment-6784742126). Root selects **measurement first** on the SAME Draft #1184 and SAME author session. This is an intentionally instrumented diagnostic head, **NOT mergeable even if CI happens to be green**. It does not claim to fix R36 or actual main. After obtaining evidence, restore the native file exactly before the final source correction is gated for merge.

### Baseline, scope authority and ownership

Current head/sole expected parent **d1f134a698ddd63c147191b34f24f529a28f5605**, tree **2fb7e4c82b4fb8a71e08fc0347bac016086c5b73**. Main/mergebase **fbcb72e7c65a5e7c7e4f2e20105ab6f4b2201a54**, currentahead1/behind0. Branch **fix/official-truth-v3-m04-postmerge-r36-20261111**. Root verified NORMAL and unchanged refs; no new Owner/Guardian instruction. This is a bounded continuation of the failed M04 recovery, not a following product slice.

The V27 native freeze was Root's selected two-SQL-span scope. Operating Standard sections2/3/4B/4C permit Root to select ordinary bounded technical scope; the independent reviewer found no separate Owner reservation against additive instrumentation in the already-owned disposable CI fixture. This amendment changes that narrow file allowance explicitly. All actual acceptance requirements, Production/sensitive gates and execution restrictions remain unchanged. No rule or approval control is weakened.

Author **Jetnity Official Truth V3 Durable Jobs1 — Codex Generation3**, SAME actual session **/root/m04_durable_jobs_writer_g3**. Independent source reviewer **/root/m04_recovery_source_review_g3**; CI/live reviewer **/root/m04_recovery_live_audit_g3**. Root owns continuity, publication and all Ready/merge authority. Author must read this full published task before implementation. Do not mark Ready. Do not merge. Do not start a follow-up slice.

### Why a diagnostic is selected

Full R36 run42939990089/#4098/attempt1 failed at the frozen240s effect timer:24/31groups, first23=106383ms, ledger80449ms, then43rd START unacknowledged (index42started/41completed),240270ms including23mscleanup. Native/log/full six-companion and aggregate audits are now complete; all six companions passed and only Core/M04 failed. Exact complete receipt and failure29 remain in V28v1; genuine R35 PR success and failed actual-main28 are not rewritten.

R36's smaller source query counts were not a measured runtime improvement. Existing quota telemetry measures client-await durations, not individual server functions. A large inline history refactor or another serializer change is not selected without more evidence. The current R36 SQL **92ca2bf0c45c9e3702b2de63bf984d6a1f30b6fe4c9c3ee83de35ae470ab2d16** remains byte-for-byte unchanged in R37.

### Exactly one implementation file

**scripts/db/official-truth-v3-durable-jobs-1/native.ts** only.
Baseline191098UTF8bytes/SHA256 **f5d849c643ff22d264bc9adc1a7cd65f12caaac80a804647604851f22effbde0**. All17 other protected sources, including SQL, rollback, fixtures, adapters and application code, stay exact. No shared helper edits, new files of executable code, extension, dependency, workflow or manifest changes.

Implement additive instrumentation only, with literal spans and exact inverse restoring every baseline byte. Keep original31 proof invocations, assertions, command inputs, fixed SQL, roles/privileges, transaction boundaries, full256/64 quotas, native receipt and effect240000/cleanup60000/outer300000ms unchanged. No omitted/sampled test, warmup bypass, retry, changed timeout or alternative target. New observations add overhead inside those same bounds.

### Scoped setup on the existing connection

At the existing persistent runtime connection setup (original native.ts line561), after both executor-family setup awaits have completed:

1. Use the existing fixture owner to inspect ONLY the fixed newly-created jobs test login's IN DATABASE current_database() configuration record. Require the expected absent record; never inspect passwords or broad auth records.
2. Temporarily set **track_functions=all** for that exact jobs test login **IN DATABASE postgres**, using the existing owner. This changes a session default only; no grant, membership, role attribute, password, ownership, ACL or RLS change is allowed.
3. Create exactly the already-existing runtime connection through the original f.connect(M04_TEST_LOGIN.jobs,'ot_v3_jobs_caller') call. Keep its genuine restricted session_user/current_user and all existing security witnesses.
4. Immediately RESET only that role/database track_functions default and verify the configuration record equals its exact prior state before any later jobs connection may open. Verify the runtime's effective setting is all. Other existing/later connections must remain at their previous setting.
5. Use a bounded try/finally restoration path while the parent lifetime is alive. If parent abort already stopped transports and destroyed the owned cluster, issue NO further SQL and record SQL-restoration as unconfirmed, with cluster teardown the terminal disposal evidence. Never fabricate reset acknowledgement or mask an original error. Any unexpected setup/read/restoration error fails the test; no silent diagnostics skip.

No new connection, backend, cluster, global server/database setting, ALTER SYSTEM, shared helper override, impersonation or new privilege. Existing LocalPgConnection/OwnedTestLifetime ownership wraps every added query. Readback must prove no connection inventory/limit increase.

### Finite completed-prefix snapshots

Retain at most **12** snapshots in a local JS array:
- before ledger; after its completed64/128/192/254-loop prefixes; after the complete ledger proof;
- before cycles; after its completed16/32/48/64 cycles; after the complete cycle proof.

Insert only at completed existing anchors after the original ACK and current-state/counter updates. No new background timer, polling, sampling of assertions, sleep or per-iteration query. Preserve the exact original quotaFixed/commandRequest/fixed implementations. Each snapshot serially:

1. check the unchanged owned lifetime;
2. await `SELECT pg_catalog.pg_stat_force_next_flush()` on the existing runtime connection through ReadyForQuery;
3. clear the existing observer's statistics snapshot using pg_stat_clear_snapshot, then read a fixed **29-function M04 inventory** from pg_proc/pg_namespace LEFT JOIN pg_stat_user_functions, stable C ordering; retain NULL/unobserved separately from genuine zero;
4. validate exact unique inventory, finite nonnegative safe counts/times and bounded field sizes; retain the actual complete rows and a copy of completed quota counters plus phase/elapsed/diagnostic-overhead timing. Do not clamp, truncate, infer missing values or reset statistics.

Only fixed M04 function names/schema/identity, calls, total_time/self_time and finite phase/counter metadata may be retained. No SQL text, parameters, proposal/credential bytes or query plans. Existing observer statement/lock bounds apply. At most12×29 function rows and a maximum131072-byte serialized diagnostic. Failure of the diagnostic's integrity/bound checks remains an actual test failure, not a skip.

Emit the cached record as a separate **M04_FUNCTION_PROFILE_RECEIPT / jetnity.m04.function-profile.v1** diagnostic in finally, without any SQL or new acquisition there. Preserve the original M04_NATIVE_RECEIPT payload/meaning. At abort, only the last genuinely captured completed prefix exists; later or interrupted calls are unknown. No stale snapshot is relabeled final.

### Primary-source proof and limitations

Root and independent reviewer checked PostgreSQL source at **c372fbbd8e911f2412b80a8c39d7079366565d67**. pg_stat_force_next_flush exists (pg_proc oid2137), sets the backend flush flag without a superuser check, and is not among initdb PUBLIC EXECUTE revocations. pgstat_report_stat absorbs the flag, forces pending statistics to shared memory and runs before ReadyForQuery outside a transaction. Existing pg-wire.result returns ordinary SELECT results only at tagZ. A separate observer snapshot clear/read therefore sees the completed runtime prefix, without sleep or polling. Public EXECUTE is not expanded by this task.

PostgreSQL16 documentation: track_functions=all includes non-inlined user SQL/procedural/C functions; untracked/absent entries are not zero evidence. Current SET search_path wrappers are not SQL-inlined. Built-in functions are not separately tracked. Statistics are DB-wide; attribution to this lane relies on only the selected existing runtime connection receiving tracking and immediate role-default restoration. Verify this setup, do not assume it.

Source fmgr.c places tracking after a function's own SET/security setup and before its restoration; that own wrapper overhead is excluded from its time but may appear in the tracked parent's self time. Error paths can bypass function-usage completion; failed/interrupted function calls are not complete timing/call evidence. Do not sum overlapping total_time values. Profiling overhead is real and consumes the same240s budget. This is an instrumented, completed-prefix function-cost observation, not CPU profiling, a controlled before/after benchmark, full-server accounting or a guaranteed fix.

### Handoff and finite publication package

Author delivers only the exact native.ts proposal, literal edits/inverse, UTF8/SHA256/blob pins, explicit all-original-source preservation proof, exact12 snapshot plan, setup/abort/restore state reasoning, expected extra query bounds, self-review and open limits; STOP for independent source/Root review. No runtime execution or Git mutation by author.

Root then owns the same six current entry/handoff files plus three NEW records:
- docs/official-truth-product-v3/M04_RECOVERY_TASK_V28.md
- docs/official-truth-product-v3/M04_RECOVERY_ROOT_REVIEW_V28.md
- docs/official-truth-product-v3/M04_RECOVERY_R37_PROFILE_EVIDENCE_V28.json

Task retains complete V28v1 and v2 once. New evidence retains complete actual R36 failure29 native/TAP/terminal/log/full companion objects, separate Atomic raw line, current live/Owner evidence, exact diagnostic source review/pins and profiling limitations. Earlier28 failures and genuine success remain reachable through immutable V27/V26 records; do not rewrite or duplicate those historical files. Preserve all bytes outside the five current markers and the entire preceding M04 handoff. Preserve all parallel1181 work.

Expected mutation from d1:10paths (native+6current+3new),7modified+3added,zero deletions,9418old leaves unchanged;9428total leaves/838directories/10265entries if no drift. Cumulative PR14paths against main (8modified+6added). Verify exact tree/diff, do not merely assert these expectations.

### Gates and STOP

Full Root+independent immutable readback before same-branch expected-parent publication. Existing complete8-job CI executes once for this changed head; no unchanged-head rerun. Root personally verifies terminal metadata before allowed non-Auth logs and authorizes independent review. Retain full native/profile receipts, all acceptance failures and companion results honestly. Validate profiling data quality separately from runtime acceptance. Exact Preview/main/diff/NORMAL/rules/Owner/review-thread gates continue.

**R37 diagnostic head must never be marked Ready or merged.** After evidence: Root selects a separately versioned bounded source correction, restores native.ts exactly to191098/f5d849c6…, independently verifies inverse, then full newhead/actualmain/Production gates. A diagnostic green is not final repair acceptance. Finite8path completion remains HELD until a genuine corrected actual-main PASS, then its already-contracted gates/finalreceipts/STOP. No automatic product slice.

No local/replacement project/parser/SQL/native/socket/build/test execution, downloads/installations/clone/gitfetch/push. Existing reviewed CI is the only project execution surface. No Auth logs; no hosted DB/Auth/RLS/ACL/migration/credentials/provider/research/scheduler/notification/newcost/publicactivation. SQL_UNAPPLIED;METHOD_NOT_APPROVED;#1139NOT_RELEASE_READY/17preOwnerGaps;#917UNKNOWN/Stage2NOT_ATTEMPTED/noindividualaccess/retry/rephrase/delegation/reroute/transportswitch/humanSQLsubstitute;#1131ReadySTOP;both#1135holds;#968isolation;#911/#913privacy;D1#1169unfinished;concreteclient/SSR/Authbindingunproved. All special Owner gates remain.
