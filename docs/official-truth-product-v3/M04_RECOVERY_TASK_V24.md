# M04 R33 — Recovery Task V24

The binding implementation scope is **V24 v2** below. The complete original V24 v1 investigation and terminal R32 failure receipt are retained verbatim afterward. Later exact-head live receipts take precedence over these dated pre-publication statements. No runtime PASS, Ready or merge is asserted.

## Current binding V24 v2 — original comment retained

## Binding implementation amendment — R33 / Recovery Task V24 v2

**2026-11-10 21:42:19 UTC.** Root selected the following concrete pair after independent source analysis of the exact proposal. This supersedes the source-proposal-only stopping point in [V24 v1](https://github.com/Jetnity/jetnity/pull/1183#issuecomment-6779635862); all other constraints and preserved failure observations remain binding.

Fresh read immediately before this amendment: **NORMAL**, same main **e7aae86c18238033c2186722e24c84dc7a5f69b9**, same **OPEN/DRAFT/unmerged #1183** head **b1265b2bf8b8822d035bdf68023383242b670fba**. **No TL-PASS, Ready or merge.**

### Selected bounded correction and reason

Source work across the complete ledger and64cycle proofs repeatedly visits66557+49794=**116351 queue-history rows**. The full cycle proof additionally traverses16512 start-history rows. Actual-envelope reuse reaches both queue histories but alone leaves substantial repeated work. The selected pair combines that exact reuse with object-only scalar batching in the common canonicalizer, which also reaches command/job/subject/start-history serialization. These are source-derived operation counts, not measured timing savings or a guaranteed240s PASS.

Only **two existing function bodies in scripts/db/official-truth-v3-durable-jobs-1/jobs-candidate.sql** may change:
1. **canonical_v1:** encode valid immediate object scalar values together in one ordered SQL aggregate statement. Maintain three arrays aligned by identical unique-key C ordering. SQLNULL marks every container or invalid/depth-refused entry. Revisit only those slots through the original ordered guard/recursive/fallback statements and retained-successful-object logic. Leave the entire array branch and all root scalar branches unchanged.
2. **assert_history_v1:** retain the actual result of its first envelope canonicalization for that history row and use its byte length at the former second canonical call. Split the journal comparisons only at the existing first-four-comparison boundary. The new text local explicitly retains default collation. **Never use stored envelope_text as a substitute for the computed canonical result.**

Every history row, prior/next job check, transaction/wait/authority boundary, pre-/post-effect history call, standalone transition and all29 declarations/attributes remain. No trust crosses rows or function invocations.

### Exact five-span delivery selected

Baseline SQL **146813bytes / SHA256 b4774a30188443162caec517543b7a6c8d6c90009882e5180c54b8c06384326a / blob9dea993d3a84611869a6553eff209813b6dd2506**.

Selected final SQL **147856bytes / SHA256 e0bb8eded96ad53737228e1d4e824057abc2cadf73ee08267c3a9011aee02ae8 / Git blob 6465147678a3024748f98ad151b63bc412ccc6c4**. Net **+1043bytes**. Root and independent reviewer separately reconstructed the same five unique replacements and exact whole-file inverse. The author's final delivery under this amendment must confirm those identities.

Expected18-source aggregate **d70a20d3b3881b56fb7274d3b30089e56e33081f2cb95deb7528b585540f4c76**, using unchanged sorted-path SHA256 SPACE decimalBytes SPACE path LF format. All other17 source files remain unchanged. Native **191098bytes / f5d849c643ff22d264bc9adc1a7cd65f12caaac80a804647604851f22effbde0 / blob0b3f7d9906687ec42171de5af60fed009d07b39f**; rollback remains9b9089d… .

The selected edits, each unique in the exact baseline:

**1. Canonical local declaration only:**
```sql
DECLARE x record; e jsonb; s text; parts text[]:='{}'; child_text text; number_value numeric; retained_object jsonb; retained_object_canonical text; object_keys text[]; object_values jsonb[]; part_index integer;
```

**2. Replace only the root object branch, up to the next root array branch, with:**
```sql
  WHEN 'object' THEN
    SELECT array_agg(j.key ORDER BY j.key COLLATE "C"),
      array_agg(j.value ORDER BY j.key COLLATE "C"),
      COALESCE(array_agg(
        CASE WHEN j.key ~ '[^ -~]' OR d+1>24 THEN NULL
        ELSE to_jsonb(j.key)::text||':'||
          CASE jsonb_typeof(j.value)
          WHEN 'string' THEN CASE WHEN (j.value#>>'{}') ~ '[^ -~]' THEN NULL ELSE j.value::text END
          WHEN 'number' THEN CASE WHEN j.value::numeric=trunc(j.value::numeric)
            AND j.value::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc(j.value::numeric)::text END
          WHEN 'boolean' THEN j.value::text
          WHEN 'null' THEN 'null'
          ELSE NULL
          END
        END ORDER BY j.key COLLATE "C"),ARRAY[]::text[])
      INTO object_keys,object_values,parts FROM jsonb_each(v) j;
    FOREACH part_index IN ARRAY array_positions(parts,NULL::text) LOOP
      IF object_keys[part_index] ~ '[^ -~]' THEN RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601'; END IF;
      e:=object_values[part_index];
      IF d+1>24 THEN RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601'; END IF;
      CASE jsonb_typeof(e)
      WHEN 'object' THEN
        IF retained_object IS NULL THEN
          child_text:=official_v3_jobs_private.canonical_v1(e,d+1);
          retained_object:=e; retained_object_canonical:=child_text;
        ELSIF (e::text) COLLATE "C" = (retained_object::text) COLLATE "C" THEN
          child_text:=retained_object_canonical;
        ELSE
          child_text:=official_v3_jobs_private.canonical_v1(e,d+1);
          retained_object:=e; retained_object_canonical:=child_text;
        END IF;
      WHEN 'array' THEN child_text:=official_v3_jobs_private.canonical_v1(e,d+1);
      WHEN 'string' THEN
        s:=e#>>'{}'; IF s ~ '[^ -~]' THEN RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601'; END IF;
        child_text:=e::text;
      WHEN 'number' THEN
        number_value:=e::text::numeric; IF number_value<>trunc(number_value) OR number_value NOT BETWEEN -9007199254740991 AND 9007199254740991 THEN
          RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601'; END IF; child_text:=trunc(number_value)::text;
      WHEN 'boolean' THEN child_text:=e::text;
      WHEN 'null' THEN child_text:='null';
      ELSE RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601';
      END CASE;
      parts[part_index]:=to_jsonb(object_keys[part_index])::text||':'||child_text;
    END LOOP; RETURN '{'||array_to_string(parts,',')||'}';
```

**3. History local declaration only:**
```sql
DECLARE s official_v3_jobs_private.subjects_v1%ROWTYPE; x record; c jsonb; e jsonb; unresolved text[]; ops integer; starts integer; credit jsonb; envelope_canonical text COLLATE "default";
```

**4. Replace the existing journal IF with:**
```sql
    IF c->>'commandText'<>x.command_text OR c->>'commandKey'<>x.command_key OR c->>'operationId'<>x.operation_id OR c->>'jobKey'<>k THEN RAISE EXCEPTION 'm04 journal invariant' USING ERRCODE='P7603'; END IF;
    envelope_canonical:=official_v3_jobs_private.canonical_v1(e,0);
    IF envelope_canonical<>x.envelope_text OR e#>>'{audit,reference}'<>x.audit_reference THEN RAISE EXCEPTION 'm04 journal invariant' USING ERRCODE='P7603'; END IF;
```

**5. In the inlined history transition only, replace the eight-space-indented canonical byte-length clause with:**
```sql
OR octet_length(envelope_canonical)>196608
```
The standalone transition's original canonical call remains unchanged.

### Independent reasoning, countercosts and verification

The sentinel preserves logical refusal order: array_agg retains SQLNULL entries; array_positions(parts,NULL::text) returns their ascending positions without text-equality comparison. JSONnull is the non-NULL string null; an empty object produces empty parts and returns {} without indexing NULL key/value arrays. Three identical ordered aggregates retain slot alignment. Invalid scalars are not raised eagerly by the batch; the original fallback raises at their original key position. Direct jsonb::numeric occurs only in the number CASE and copies the already stored exact Numeric; original truncation/integrality/safe-integer semantics and fallback remain.

Root independently read pinned PostgreSQL16 source at **c372fbbd8e911f2412b80a8c39d7079366565d67**: array_userfuncs.c(blob5c4fdcfba4693dcf6d83047806bd62cbe3adfd1d),jsonb.c(blobcf43c3f2ded19aabd2a913ab914f84d6c70d3afc),parse_collate.c,pl_comp.c,optimizer/util/clauses.c,executor/execExpr.c andexecExprInterp.c. The journal's scalar OR expression retains left-to-right nonconstant evaluation and TRUE/NULL behavior; the first comparison group still raises P7603 before canonical evaluation. The computed envelope text retains the original default collation.

Countercosts remain explicit: three materialized arrays, aggregate state/sorting and copies, array_positions traversal and numeric copies/truncations. Existing wire/node/accepted-text bounds constrain supported values; **no peak-memory/RSS measurement or unrestricted private-helper/OOM-order equivalence is claimed**. No new input rejection or cap is authorized. Diagnostic SQL exception context can change with the batching statement; SQLSTATE and explicit logical refusal messages remain.

Native remains byte-identical. Existing fixed **R19 scalar/key/order/depth/NULL**, **R20 exact numeric**, **R21 string/escape**, **R26 successful-object reuse/refusal**, later complete N02 oracles, maximum-node/worst-valid wire groups and all31groups are mandatory. There is still no new dedicated malformed-persisted-envelope tamper oracle; no fixture/native change, trigger bypass or replication-role change is authorized.

### Same author, final delivery and Root publication

Author remains **Jetnity Official Truth V3 Durable Jobs1 — Codex Generation3**, actual session **/root/m04_durable_jobs_writer_g3**. Same independent reviewer **/root/m04_recovery_source_review_g3**. Deliver this exact final source text/pins and final source-derived full-work model, semantic/coverage/countercost statement, then STOP for independent review and Root publication. No author repository mutation, Ready or merge.

Root may publish the reviewed single SQL file plus exactly **nine continuity paths**: new M04_RECOVERY_TASK_V24.md,M04_RECOVERY_R33_EVIDENCE_V24.json,M04_RECOVERY_ROOT_REVIEW_V24.md; the existing M04_HANDOFF_V1.md and five existing central current-marker entry files. Ten delta paths total; preserve all outside marker bytes, previous full handoff and immutableV23/V22/older evidence. All25failed execution observations and genuineR21/R29successes remain distinct, with the completeR32failure25 receipt and final eight jobs/logpins. Source-only review is not runtime acceptance.

Before updating the branch, independently read back all10 candidate files,18sources,complete tree/diff,source pins,unchanged parallel#1181 leaves and fresh main/head/mode/rules/reviews/Preview/Production/Owner metadata. Nonforce expected-head update only. Every new head invalidates prior runtime gates. All8jobs/31groups/fullquotas/inherited761/minOwned4182/cleanup/mountedLifecycle/Core/fivehygiene/Build/Preview remain mandatory. Then only Root may Ready/expected-headmerge; **actual merged main must independently pass allCI/native and both Production aliases**.

All V24v1 execution/Owner stops remain: SQLUNAPPLIED,MethodNOT_APPROVED,#1139NOT_RELEASE_READY/17gaps,#1131ReadySTOP,both#1135holds,target-specific#968isolation,#911/#913privacy,D1#1169separate,#917UNKNOWN/Stage2NOT_ATTEMPTED without retry/substitute. No local project/parser/SQL/native/socket/build execution, download/install/clone/replacement environment/gitfetch/push; no hostedDB/Auth/RLS/ACL/migration/credential or Authlogs/provider/scheduler/paid/public activation. Actual project execution only in existingCI after reviewed publication.

The separate mandatory8-path completion documentation remains **HELD until genuine corrected actual-main PASS**, then its own completePR/main/Production gates. Final receipts on existingPR/#751; no self-attestation commit loop. **No automatic follow-up slice.**


## Earlier V24 v1 investigation and failure25 — original comment retained

## Technical-Lead Review — CHANGES REQUIRED R33 / Recovery Task V24 v1

**2026-11-10 21:23:56 UTC.** Root independently re-read current main **e7aae86c18238033c2186722e24c84dc7a5f69b9** and Draft #1183 at exact head **b1265b2bf8b8822d035bdf68023383242b670fba**, tree **9200108258d9165b9d7e943e81565c8a2bc3ce20**. Branch **fix/official-truth-v3-m04-postmerge-r30-20261110**, last independently verified merge-base e7/ahead3/behind0. **CHANGES REQUIRED; no TL-PASS, no Ready, no merge.**

### Failure observation 25: R32 is fully terminal

[CI42900344809 / #4093 / attempt1](https://github.com/Jetnity/jetnity/actions/runs/42900344809) completed FAILURE at21:16:24UTC. Root has now independently read all eight terminal job records and all seven permitted non-Auth logs; the independent CI reviewer separately obtained identical complete-log pins. Auth remains metadata-only.

CI checkout **8703fe398a2f5bd873e950139a9bdd4db5971710** has ordered parents **[e7aae86c18238033c2186722e24c84dc7a5f69b9,b1265b2bf8b8822d035bdf68023383242b670fba]** and the exact R32 tree. Executed candidate **b4774a30188443162caec517543b7a6c8d6c90009882e5180c54b8c06384326a**, unchanged rollback **9b9089d74242a802455cc7e3fb8a0a8515c17b61b45ae730b9bbba1adb650a66**.

R32 compiles and completes **24/31 native groups**, including the complete N02 oracles, both real R9 witnesses and the full N05/A03 ledger254/255/256 group. The first23 groups sum99752ms; ledger125674ms. Group25 N05 then fails at the unchanged **M04 240s effect budget exceeded**, native.ts457:52; parent AggregateError2184:41.

Ledger: lastStarted253/lastCompleted253;258/258 command requests,260/260 fixed calls,258/258 command calls,256 acknowledged commits,1/1 START reservation. Cycles: boundary **cycle_fail**, lastStarted17/lastCompleted16,54/54 command requests,73/72 fixed calls,54/53 command calls,**53 acknowledged commits**,18/18 START reservations. The next unacknowledged command's database outcome is **UNKNOWN**. Complete64/65cycles, inherited761/minOwned4182 and later rollback/drift/shadow/dependency/late-writer groups are **not established**. Zero inherited/minOwned counters are unreached calculations, not a successful zero-result witness.

Native duration240307ms,cleanup13ms;26686/26686 operations settled,4242/4242 connections closed,1cluster stopped,0pending/children/cleanup failures. Both R9 records retain real SQL wait, abort, drained retained executor, backend absent while held,0terminal effects,3held/0completed methods,before unavailable/after invalid; timeout has worker_only/failConfirm true,caller abort unconfirmed/failConfirm false. **Complete cleanup does not replace missing acceptance groups.**

Core **8697tests/8693PASS/2FAIL/2inherited skips/0cancelled,971suites,827888.314266ms**. Typecheck/Lint succeeded; all five hygiene checks and Build were SKIPPED. Both existing UI skips remain explicit.

| Job | ID | Final result |
|---|---:|---|
| Auth-Konfiguration gegen config.toml | 130124339339 | SUCCESS — metadata only |
| Repository verification | 130124339522 | FAILURE |
| Persisted canonical read — native | 130124339721 | SUCCESS |
| Accepted store trip integration — native (lifecycle) | 130124339747 | SUCCESS |
| Accepted store trip integration — native (store) | 130124339877 | SUCCESS |
| Atomic version refresh — native | 130124339886 | SUCCESS |
| Official truth V3 — isolated UI | 130124340025 | SUCCESS |
| Typecheck, Lint & Build | 130134974881 | FAILURE |

All six companions succeeded. Persisted1/1 with95events/45reader results; Store4/4 with39events and complete2267/1574operation and444/296connection cleanup; Lifecycle4/4 with29events,13 actual mounted proofs,61/61observers and0retained bytes/pending/errors; Atomic1/1 with151events,30 negative complete-rollback cases,10950/10950settled,248/248closed,11clusters,170224msparent reserve; isolatedUI50/50,12layouts11interactions10screenshots. UI artifact13802333274:15files/3733482bytes/zipSHA256183472e18c553abf0fa41ee9f2640a4cc94f4da44da4e4150b45edf40ced1db8. Artifact images were not downloaded or visually inspected. Native fixtures, mounted lifecycle and isolated UI do not establish hosted Production/Auth binding or Production SLO.

| Complete non-Auth log | UTF-8 bytes | SHA256 |
|---|---:|---|
| repository | 4258662 | 135a03643bbb82106d4d75ca93d831c70d28391d2a24aa27ba49008bac4f2b88 |
| persisted | 156682 | e61ebb0f9edd4d5f46299febc77da07b16968eec39938fd33a5fb3c7f8f4b304 |
| lifecycle | 177490 | ab70ebf3e51f35d4f1f90d88566282d516986c4adb43ac6f22dbb956c8af77e7 |
| store | 136039 | 4291d0999a2c93643294bebe502125882edc1209b45fe88f3da9bda18357cbcd |
| atomic | 184433 | 5c2905f46dc2a03ea3c5e174dc93cad5e2f7d249fad16844d8c53b37c5b773ec |
| ui | 142082 | 61ecefc6645eca2a585e5d8052d995f4979d9ac78c53c01c8c7d6577df7a7222 |
| aggregate | 3989 | 39f074593d3218d1e52dfc5eb0e91fdd5e72f3e5b559f92784d2b42ace233efe |

Complete compact native receipt:3809bytes/SHA256**0a362dc1421b6e17048620e3f5720a051eb1927636f97f9271d031fb66950c80**, no finalLF. All previous observations/successes remain separate; this is failure observation25, not an invented extra run for e7 attempt2.

```json
{"schema":"jetnity.m04.native.v1","candidateSha256":"b4774a30188443162caec517543b7a6c8d6c90009882e5180c54b8c06384326a","rollbackSha256":"9b9089d74242a802455cc7e3fb8a0a8515c17b61b45ae730b9bbba1adb650a66","executed":true,"effectAndCleanupMilliseconds":240307,"cleanupMilliseconds":13,"clusters":1,"childProcesses":0,"lifetime":{"started":26686,"settled":26686,"pending":0,"connections":4242,"closed":4242,"stoppedClusters":1},"groups":[{"id":"N01","milliseconds":50},{"id":"N02","milliseconds":2400},{"id":"N03","milliseconds":2478},{"id":"N07","milliseconds":10862},{"id":"N07/R4","milliseconds":910},{"id":"N08","milliseconds":11588},{"id":"N08/U04","milliseconds":3554},{"id":"N02/U04","milliseconds":1342},{"id":"N04/N06","milliseconds":2916},{"id":"N04/N06/N10","milliseconds":2818},{"id":"N05/N09","milliseconds":3108},{"id":"N09","milliseconds":20639},{"id":"N10/U06","milliseconds":7529},{"id":"N11","milliseconds":2379},{"id":"N11","milliseconds":169},{"id":"N12","milliseconds":188},{"id":"N04/N10/N12","milliseconds":4874},{"id":"N12/U06/R9","milliseconds":14305},{"id":"N12/R7-03","milliseconds":656},{"id":"N11","milliseconds":2989},{"id":"N11","milliseconds":295},{"id":"N11","milliseconds":355},{"id":"N13","milliseconds":3348},{"id":"N05/A03","milliseconds":125674}],"nestedRaceWitnesses":[{"boundary":"i1_timeout","operation":"reserve_v1","target":{"pid":"25511","birth":"2026-11-10 21:09:43.975015+00"},"control":{"pid":"25510","birth":"2026-11-10 21:09:43.969744+00"},"holder":{"pid":"25187","birth":"2026-11-10 21:09:39.640551+00"},"realSqlWaitObserved":true,"abortDelivered":true,"retainedExecutorDrained":true,"backendAbsentWhileExecutorHeld":true,"failConfirmObserved":true,"terminalEffects":0,"beforeDrainSlot":"unavailable","afterDrainSlot":"invalid","heldMethods":3,"completedMethods":0,"outwardStatus":"worker_only","nativeAdmissionsAfterDrain":45},{"boundary":"worker_caller_abort","operation":"reserve_v1","target":{"pid":"26284","birth":"2026-11-10 21:09:53.303211+00"},"control":{"pid":"26283","birth":"2026-11-10 21:09:53.297313+00"},"holder":{"pid":"25907","birth":"2026-11-10 21:09:49.10517+00"},"realSqlWaitObserved":true,"abortDelivered":true,"retainedExecutorDrained":true,"backendAbsentWhileExecutorHeld":true,"failConfirmObserved":false,"terminalEffects":0,"beforeDrainSlot":"unavailable","afterDrainSlot":"invalid","heldMethods":3,"completedMethods":0,"outwardStatus":"unconfirmed","nativeAdmissionsAfterDrain":44}],"quotaProgress":{"currentGroup":"N05","boundary":"cycle_fail","indexBase":0,"millisecondsCap":300000,"timingMeaning":"client await durations including construction/transport; not server statement profiling","ledger":{"lastStartedIndex":253,"lastCompletedIndex":253,"commandRequestsStarted":258,"commandRequestsCompleted":258,"commandRequestMilliseconds":519,"fixedCallsStarted":260,"fixedCallsCompleted":260,"fixedCallMilliseconds":125312,"commandCallsStarted":258,"commandCallsCompleted":258,"commandCommits":256,"startCallsStarted":1,"startCallsCompleted":1,"startReservations":1},"cycles":{"lastStartedIndex":17,"lastCompletedIndex":16,"commandRequestsStarted":54,"commandRequestsCompleted":54,"commandRequestMilliseconds":104,"fixedCallsStarted":73,"fixedCallsCompleted":72,"fixedCallMilliseconds":13743,"commandCallsStarted":54,"commandCallsCompleted":53,"commandCommits":53,"startCallsStarted":18,"startCallsCompleted":18,"startReservations":18}},"connections":{"aggregateWorkConnectionBound":40,"maximumJobs":4,"maximumIntake":1,"maximumMethod":2,"m04ObserverLimit":2,"maximumM04Observers":2,"methodObserverLimit":1,"fixturePerClusterLimit":16,"inheritedCommitGuardPairs":0,"minimumOwned":0},"failure":{"phase":"proof_25:N05","error":{"kind":"fixture","code":"unclassified_failure"}},"cleanupFailures":[],"cleanupFailureCount":0,"nativePass":false}
```

### Binding R33 / V24 v1: source-only investigation before implementation

**Author remains Jetnity Official Truth V3 Durable Jobs1 — Codex Generation3**, actual session **/root/m04_durable_jobs_writer_g3**. Independent source reviewer **/root/m04_recovery_source_review_g3**. Same-session immediate correction. Root alone selects/publishes, reviews, sets Ready and merges. Live machine mode was independently re-read NORMAL; it grants no special-gate override.

Start from the actual R32 source, **146813bytes / b4774a30188443162caec517543b7a6c8d6c90009882e5180c54b8c06384326a / blob9dea993d3a84611869a6553eff209813b6dd2506**. Native remains **191098bytes / f5d849c643ff22d264bc9adc1a7cd65f12caaac80a804647604851f22effbde0 / blob0b3f7d9906687ec42171de5af60fed009d07b39f**. All18source aggregate **afc52b76596a7f5d6416a5412a5706deec3208ba32a69bf9ac0cd5ad02408507**.

The next proposal must address the **complete remaining work**, including full254/255/256ledger and64/65cycle history, earlier groups and later mandatory checks. A ledger-only improvement that leaves the cycle cost essentially unchanged is insufficient justification. Current client elapsed times are not SQL profiles and do not establish causal speedup or a runner root cause.

Investigation is bounded to existing validation bodies and repeated call/data flow in **scripts/db/official-truth-v3-durable-jobs-1/jobs-candidate.sql**, with read-only inspection of native.ts and directly relevant contracts/immutable primary software source as necessary. Compare materially useful options such as removing demonstrably identical validation within one invocation or reducing repeated scalar/structure work, while retaining full historical validation and exactly the supported accepted/refused language. No optimization is preselected.

Deliver:
1. A source-derived cost model spanning the full ledger AND full64cycles, identifying repeated validations, traversals, PL/pgSQL entries, allocations and SQL executor transitions. Count operations and countercosts; do not fabricate timing measurements or promise a budget PASS.
2. A concrete bounded candidate and exact old/new text proposal. Explain why its removed work applies to both large histories; explicitly reject a proposal if it is unlikely to be materially sufficient.
3. Semantic review: canonical bytes/key order/numeric/date/depth/string limits, collations, NULL/empty/malformed inputs, exception SQLSTATE/message/order/context, volatility/snapshots, authority/ACL and every historical row, quota and transaction/wait boundary. Preserve public behavior or surface any proposed behavior change before implementation.
4. Existing witnesses and precise coverage gaps. Native remains frozen in this investigation. **No tamper mechanism, replication-role change or trigger bypass**; the earlier malformed-persisted-envelope limitation remains explicit. Do not resurrect the rejected V23v3 proposal.
5. Candidate pins if complete; stop for Root's concrete implementation amendment and independent review.

Pure in-session text/data analysis is authorized; **no repository mutation or project execution** by author/reviewer. No workflow/package/guard/manifest/fixture/runtime declaration/role/ACL/authority/rollback changes, new helper/public API, transaction/authority/wait reorder, omitted history, cross-call cache/trust marker, reduced proof, budget increase or unchanged-head rerun. If a wider change is necessary, describe it and STOP before implementation.

### Acceptance, access and Owner gates remain unchanged

All31groups and8CIjobs on every new head; complete N02 oracle block, both actualR9 witnesses,254/255/256ledger,64/65cycles,inherited761/minOwned4182,rollback/late-writer,fully drained cleanup,actual-mountedLifecycle,Core,fivehygiene,Build,exactPreview and freshlive/review/Owner gates. Only Root may grant independent TL-PASS/Ready/expected-headmerge. Then **actual merged main fullCI/native and Production through both aliases** must pass; prior PR PASS never substitutes for this.

Frozen limits:240s effects+60s cleanup/300s total;4outer lanes/4native per family;8activeNative/256total/16terminal reserve;8callbacks/128total;30s outer/5s child;3clusters/2children/40aggregate workconnections/2M04observers/1methodobserver/16fixtureconnections per cluster.

No local project/parser/SQL/native/socket/build execution, installs/downloads/clones/reconstruction/replacementenvironment or gitfetch/push. No hostedDB/Auth/RLS/ACL/migration/credential action or Authlogs; no real source/provider/research calls,scheduler/notification/publicV3/paidactivation/new recurringcost. Immutable primary software-source/docs reads and pure text/data analysis allowed; actual project execution only by existing CI after reviewed publication.

SQLUNAPPLIED;MethodNOT_APPROVED;#1139NOT_RELEASE_READY/17preOwnergaps;#1131ReadySTOP,both#1135holds,target-specific#968isolation,#911/#913privacy;D1#1169separately unfinished. **#917UNKNOWN/Stage2NOT_ATTEMPTED: no retry,rephrasing,delegation,reroute,transport switch or humanSQL substitute.** No premature Owner-approval question.

Mandatory separate8-path documentation closure remains **HELD** until genuine corrected actual-main PASS, then its own fullPR/main/Production gates and final existing-thread receipts. P1current acceptance failure;P2unmeasured cost sufficiency and existing implicit malformed-history coverage;P3inherited skips and heldclosure. No newly establishedP0 in this bounded review, not a global clearance. **No Ready, no merge, no automatic next slice. STOP after the bounded source proposal.**


## Final delivery and independent source disposition

The same author read V24 v2 and reconstructed its exact five spans afresh from immutable b1265b2bf8b8822d035bdf68023383242b670fba. Author, Root and independent reviewer agree on147856bytes/SHA256e0bb8eded96ad53737228e1d4e824057abc2cadf73ee08267c3a9011aee02ae8/blob6465147678a3024748f98ad151b63bc412ccc6c4. All18source aggregate d70a20d3b3881b56fb7274d3b30089e56e33081f2cb95deb7528b585540f4c76. Native and the other16 source files remain unchanged.

No further code amendment, native oracle, fixture manipulation or new execution permission was selected. The complete work model, memory qualifications, existing oracle coverage and source-only review are in the accompanying V24 evidence and Root review. Root publication/readback and all new-head runtime gates remain outstanding at this snapshot.

## Root model-scope clarification

The quoted canonical/key/container totals describe every assert_history_v1 queue/current-job/start-history validation across both complete quota proofs. They do not include wire/front-door, execute_v1 pre-lock command/standalone transition, raw_reply or other per-call work. Such excluded work remains required; no whole-proof timing or total-call claim follows. This clarification does not alter the five selected source spans or acceptance gates. The original V24 comments above remain verbatim historical task records.
