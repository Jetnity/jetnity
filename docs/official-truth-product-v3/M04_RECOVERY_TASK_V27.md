# M04 Recovery Task V27 — actual-main failure28 and selected R36

Dated source/publication contract. Full original GitHub task text and binding amendment are retained below; later immutable-candidate/runtime receipts do not change their historical meaning.

## V27 v1 — complete original task and terminal appendix

Source: https://github.com/Jetnity/jetnity/pull/1183#issuecomment-6783534708

## M04 Recovery Task V27 v1 — CHANGES REQUIRED after actual-main failure 28; source analysis only

**2026-11-11T00:46:00Z.** This continues the same M04 recovery after #1183 was genuinely reviewed and merged. The R35 PR PASS remains a real historical success; **actual main has failed and the correction is not accepted as complete**. A merged PR cannot receive another unmerged fix, so a later bounded correction will require a new Draft from the actual main baseline, with the same author/session. No new correction source, branch or implementation is selected in this v1.

### Exact baseline and actual failure

- Main: **fbcb72e7c65a5e7c7e4f2e20105ab6f4b2201a54**, tree **2d5413d86c3200ce05863d1f09062a3a5a142c32**, ordered merge parents [e7aae86c18238033c2186722e24c84dc7a5f69b9,9981a4aba1995d0951b7f001bb46b9a6cf1d71ed].
- Same SQL as successful R35 PR:158670 bytes / SHA2560221d673c11c8206c56037f8cddeeae5b6eb765c1c9ed44a9bebf548f7ab429b / blobf7d2e523f940a2f2101400c7cab13b59d258f473.
- Same protected 18-source aggregate:797462a57f2ae4d720e11ccdcb46b50bdc779808481a80176c6784ecbfdaee8a. Native191098/f5d849c643ff22d264bc9adc1a7cd65f12caaac80a804647604851f22effbde0 and rollback6175/9b9089d74242a802455cc7e3fb8a0a8515c17b61b45ae730b9bbba1adb650a66 remain frozen.
- [Actual-main CI42931400600 / #4097 / attempt1](https://github.com/Jetnity/jetnity/actions/runs/42931400600), push/main/exactfbcb. [Repository130230760496](https://github.com/Jetnity/jetnity/actions/runs/42931400600/job/130230760496) is terminal FAILURE; Root personally read metadata at00:44:39UTC before its full log. The overall run/Atomic/final aggregate have not all terminated at this receipt.
- Raw Repository log4257659UTF8 bytes/SHA256ca7619c275846bd50046250cd880e934a4af3fe11ac541034fb6e0af745dbff4.
- **Failure observation28. Only24/31 M04 groups completed.** First23 sum100660ms; complete254/255/256 ledgerPASS65545ms. N05 failed on the unchanged240s effect budget at **cycle_fail**, zero-based50started/49completed,51START reservations,152acknowledged commits,153/152commandCalls and205/204fixedCalls. **The next unacknowledged FAIL outcome is UNKNOWN.**
- Full64/65, expectedpointer-refusal, inherited761/minOwned4182 andgroups26–31 including finalrollback/latewriter are **NOT_REACHED**, not passed. Later0/0 fields do not prove their execution.
- Native240287ms including24ms cleanup;27296/27296 operations,4242/4242 connections,1/1 cluster stopped,0pending/children/cleanupfailures. Both actualR9 witnesses retain waits/abort/drain/backendabsence/zeroeffects and their distinct outward statuses.
- Core8697tests/8693PASS/2FAIL/2sameinheritedskips/971suites,829567.029951ms. The only failures are N05 and its parent M04. Typecheck/LintSUCCESS; five hygienechecks andbuild skipped after failure.
- Independent source reviewer has confirmed this exact error and is completing the full Repository proof review. UI/Persisted/Store/Lifecycle passed and their complete log arrays/pins were independently reviewed; Auth metadataSUCCESS only. Atomic andaggregate still need final terminal review.
- R35 PR CI42927749592/#4096/attempt1 remains full8jobPASS/all31nativePASS197851ms. Actual-main ledger65545ms versus PR40534ms demonstrates that the accepted PR timing margin was insufficient on this execution. **No CPU, runner contention, measured function-profile or other environmental cause is claimed.** Identical source/tree is established.

Full failure28 native JSON (3816 bytes, SHA256028d2e8dc6e655efd1f193714563bfcb8c5a1f80a6fc04c181909745acd62999):

```json
{"schema":"jetnity.m04.native.v1","candidateSha256":"0221d673c11c8206c56037f8cddeeae5b6eb765c1c9ed44a9bebf548f7ab429b","rollbackSha256":"9b9089d74242a802455cc7e3fb8a0a8515c17b61b45ae730b9bbba1adb650a66","executed":true,"effectAndCleanupMilliseconds":240287,"cleanupMilliseconds":24,"clusters":1,"childProcesses":0,"lifetime":{"started":27296,"settled":27296,"pending":0,"connections":4242,"closed":4242,"stoppedClusters":1},"groups":[{"id":"N01","milliseconds":50},{"id":"N02","milliseconds":2265},{"id":"N03","milliseconds":2426},{"id":"N07","milliseconds":10147},{"id":"N07/R4","milliseconds":1018},{"id":"N08","milliseconds":13950},{"id":"N08/U04","milliseconds":4641},{"id":"N02/U04","milliseconds":1278},{"id":"N04/N06","milliseconds":2864},{"id":"N04/N06/N10","milliseconds":2830},{"id":"N05/N09","milliseconds":3029},{"id":"N09","milliseconds":19323},{"id":"N10/U06","milliseconds":6900},{"id":"N11","milliseconds":2252},{"id":"N11","milliseconds":180},{"id":"N12","milliseconds":173},{"id":"N04/N10/N12","milliseconds":5531},{"id":"N12/U06/R9","milliseconds":14316},{"id":"N12/R7-03","milliseconds":569},{"id":"N11","milliseconds":3009},{"id":"N11","milliseconds":329},{"id":"N11","milliseconds":350},{"id":"N13","milliseconds":3230},{"id":"N05/A03","milliseconds":65545}],"nestedRaceWitnesses":[{"boundary":"i1_timeout","operation":"reserve_v1","target":{"pid":"25595","birth":"2026-11-11 00:38:36.066633+00"},"control":{"pid":"25594","birth":"2026-11-11 00:38:36.061106+00"},"holder":{"pid":"25183","birth":"2026-11-11 00:38:32.125254+00"},"realSqlWaitObserved":true,"abortDelivered":true,"retainedExecutorDrained":true,"backendAbsentWhileExecutorHeld":true,"failConfirmObserved":true,"terminalEffects":0,"beforeDrainSlot":"unavailable","afterDrainSlot":"invalid","heldMethods":3,"completedMethods":0,"outwardStatus":"worker_only","nativeAdmissionsAfterDrain":45},{"boundary":"worker_caller_abort","operation":"reserve_v1","target":{"pid":"26297","birth":"2026-11-11 00:38:45.786225+00"},"control":{"pid":"26296","birth":"2026-11-11 00:38:45.778701+00"},"holder":{"pid":"25954","birth":"2026-11-11 00:38:41.191172+00"},"realSqlWaitObserved":true,"abortDelivered":true,"retainedExecutorDrained":true,"backendAbsentWhileExecutorHeld":true,"failConfirmObserved":false,"terminalEffects":0,"beforeDrainSlot":"unavailable","afterDrainSlot":"invalid","heldMethods":3,"completedMethods":0,"outwardStatus":"unconfirmed","nativeAdmissionsAfterDrain":44}],"quotaProgress":{"currentGroup":"N05","boundary":"cycle_fail","indexBase":0,"millisecondsCap":300000,"timingMeaning":"client await durations including construction/transport; not server statement profiling","ledger":{"lastStartedIndex":253,"lastCompletedIndex":253,"commandRequestsStarted":258,"commandRequestsCompleted":258,"commandRequestMilliseconds":520,"fixedCallsStarted":260,"fixedCallsCompleted":260,"fixedCallMilliseconds":65188,"commandCallsStarted":258,"commandCallsCompleted":258,"commandCommits":256,"startCallsStarted":1,"startCallsCompleted":1,"startReservations":1},"cycles":{"lastStartedIndex":50,"lastCompletedIndex":49,"commandRequestsStarted":153,"commandRequestsCompleted":153,"commandRequestMilliseconds":298,"fixedCallsStarted":205,"fixedCallsCompleted":204,"fixedCallMilliseconds":72794,"commandCallsStarted":153,"commandCallsCompleted":152,"commandCommits":152,"startCallsStarted":51,"startCallsCompleted":51,"startReservations":51}},"connections":{"aggregateWorkConnectionBound":40,"maximumJobs":4,"maximumIntake":1,"maximumMethod":2,"m04ObserverLimit":2,"maximumM04Observers":2,"methodObserverLimit":1,"fixturePerClusterLimit":16,"inheritedCommitGuardPairs":0,"minimumOwned":0},"failure":{"phase":"proof_25:N05","error":{"kind":"fixture","code":"unclassified_failure"}},"cleanupFailures":[],"cleanupFailureCount":0,"nativePass":false}
```

### V27 v1 authorization — analysis only

Author remains **Jetnity Official Truth V3 Durable Jobs 1 — Codex Generation 3**, SAME session **/root/m04_durable_jobs_writer_g3**. Root keeps orchestration and selection; independent source reviewer **/root/m04_recovery_source_review_g3**, CI/live auditor **/root/m04_recovery_live_audit_g3**. No author Ready, merge, publication or self-review-as-PASS.

Analyze the remaining repeated validation cost in the exact existing SQL and provide a concrete, bounded source proposal that preserves the complete original validation and refusal semantics. The aim is substantially less repeated work in both full quota histories while preserving every history row, authority/current-state check, object/array/key/depth check, full support, unknown outcome, error ordering, transaction/rollback guarantee and all ownership/drain requirements.

Do not treat a small theoretical saving as sufficient. For any proposal, provide exact old/new spans, source-derived call/work counts over BOTH complete254/255/256 and64/65 histories, all allocation/copy/lookup/catalog-hash countercosts, worst-valid depth/cardinality bounds, semantic counterexamples considered, unchanged-byte inventory, and honest coverage limits. Source counts are not runtime measurements or guarantees. Do not pre-assert a future PASS or required timing margin.

**Only SQL source analysis is authorized now.** Do not change or publish implementation until Root selects a concrete reviewed proposal in V27 v2. All17 other M04 sources, native.ts, fixtures, 31groups, quotas,240000ms effect budget, workflow/job budgets, manifests, dependencies and existing gates remain frozen. The existing29 function declarations/attributes and schema/ACL/RLS authority remain unchanged. No new validation omission, sampled/truncated history, changed quota, skip, exception masking, warmup bypass, broad cache, global/session state, persistent cache or relaxed check.

Candidate choices are not predetermined. Evaluate whether remaining repeated function-entry/canonicalization/semantic reconstruction can be avoided using only already validated exact values or equivalent bounded local traversal, with full local state and failure equivalence. Root will reject unsafe scope or an unsupported benefit claim. This is the same recovery scope, not a product or method-release slice.

### Required continuation and unchanged constraints

1. Finish failure28's complete actual-main CI/companion/aggregate evidence without changing its failed result. Preserve all28 failed observations and genuine prior R21/R29/R35 PR successes separately.
2. Author delivers source-analysis proposal; independent reviewer and Root review all exact source and countercosts. A concrete V27 v2 must bind selected spans/path and unchanged-source pins before any implementation/publication.
3. Root may then create a new bounded Draft from exact current main, persist task/review/evidence/continuity, review immutable commit/tree/full diff and run the complete new-head gates. Root alone may TL-PASS/Ready/expected-head merge after full acceptance.
4. Actual new merge-main must independently pass the full eight jobs/31native groups/allquotas/R9/rollback/latewriter/drain/companions/Core/hygiene/build and exactProduction with bothaliases. **No unchanged-head rerun.**
5. The contracted finite eight-path documentation completion remains **HELD** until genuine corrected actual-main PASS, then its own full PR/main/native/Production gates, final existing PR/#751 receipts and STOP. Its two new filenames are still unselected. No automatic follow-on slice.

No local or replacement project/parser/SQL/native/socket/build execution, downloads/installations/clone/gitfetch/push. Only existing reviewed CI from a new bounded source/ref may execute project code. Root must personally read terminal metadata before each permitted non-Auth log and explicitly authorize independent reviewers. **No Auth logs.**

SQL_UNAPPLIED; METHOD_NOT_APPROVED; #1139 NOT_RELEASE_READY/17preOwnerGaps; #917 UNKNOWN/Stage2 NOT_ATTEMPTED with no retry/rephrase/delegation/reroute/transport switch or humanSQLsubstitute; #1131 Ready STOP; both#1135 holds; #968 target isolation; #911/#913 privacy; D1#1169 separately unfinished. Concrete client/SSR/Auth binding remains unproved. No hosted SQL/Auth/RLS/ACL/migration/credentials, provider/research/scheduler/notification/newcost/public activation. No special Owner gate is removed.

P0:no new P0 shown by this bounded failure. P1:actual-main acceptance failed and remains blocked. P2:quadratic repeated history work and runtime variability; no measured resource profile. P3:finite continuity closure remains held. The earlier Root PR-PASS is not rewritten into an actual-main PASS.

### Failure28 full terminal evidence supplement — 2026-11-11T00:56:00Z

The actual-main run is now **COMPLETED / FAILURE**, updated00:45:26Z. Root and the assigned independent reviewer have finished every permitted full log. Repository130230760496 FAILURE00:43:23; final aggregate130238825722 FAILURE00:45:25. Atomic130230760474 SUCCESS00:45:20; Persisted130230760595 SUCCESS00:31:43; Store130230760165 SUCCESS00:32:46; Lifecycle130230760380 SUCCESS00:36:48; UI130230760518 SUCCESS00:29:03; Auth130230760568 SUCCESS00:27:32 by metadata only. All8 bind exactfbcb/attempt1. The aggregate correctly records Corefailure and the otherfour familiesSUCCESS; it is not another independent M04 defect or a build execution.

| Complete permitted raw log | UTF-8 bytes | SHA-256 |
|---|---:|---|
| repository | 4257659 | `ca7619c275846bd50046250cd880e934a4af3fe11ac541034fb6e0af745dbff4` |
| ui | 140987 | `e8bba5d0a73900d17859b282b37035cb9d541b0f876c1d2497cc79b9a3649979` |
| persisted | 155835 | `fea34608da0f952e64d1cd11bc103372d1a8b2188a93bd31e95722e9282ec902` |
| store | 134845 | `00a52a895c4c22b335432ca91a4e03aca4983597fa3232720978166d919c746c` |
| lifecycle | 176123 | `3db1c4edacae58ffd8e9d1bd5975287938895925a19c2f3dabbd24d97554ef42` |
| atomic | 183570 | `ee5120fdf99ce80f1b37fe1678f24b6b9b102815312d766956be741bcf70b994` |
| aggregate | 3985 | `b547df99a8272090bce8042d646aa5f5a1643a18c71b3182dbf1598d23a3436c` |

Full companion objects remain retained for the next bounded evidence record: Persisted95events/45results (5synthetic positives/29refused/7no_match/3unavailable/1ambiguous), Store39events, Lifecycle29events with actual13-proof mounted bundle and61settled observers, Atomic151ordinary JSON events/30negative SQL rollback pairs/10coordinator outcomes/49closed backend rows, UI6HTTP cases/12layouts/11interactions/10screenshots. Full arrays were independently matched by hash and complete semantic matrices, including negatives and cleanup.

Atomic full151-event array:52191bytes/SHA3e4e9e939dc84cdb3ecff3a24bd7e27415ae2f3359b516a3268432958293c5a9. Final11012/11012 operations,248/248 connections,11clusters,0pending,parentAbortedfalse,parentReserve161095ms. The real count differs from PR10934/10934 and remains recorded as observed. Store publication1574/1574 (PR1575), Lifecycle wait5111/5111 (PR4243); every final counter is settled/closed with zero residual work. No causal attribution for counter/timing differences.

**Raw-log encoding qualification retained:** in addition to151 ordinary parsed Atomic records, one TAP-escaped R9 structural-negative line reports `edge order: invalid bigint before missing target`, expected SQLSTATE22P02, bothimplementations checked. Its escaped error-message quotes prevent ordinary JSON.parse of that single line; this is not a failed assertion. Root and auditor inspected and retained it verbatim, including in the earlier successful R35PRlog. Actual-main complete timestamped line360bytes/SHAa31305c334d3d63eb4568a7d2cca7f965345c5497cb6bb3666960ef4aed9de32; corresponding PRline360bytes/SHA cda06c8a263785822c10c886f30d773d2cd730ae0c9c38e21d24c7b21764c089. It will be stored alongside, not silently omitted from, the parsed arrays.

Root and source reviewer independently confirm only the two M04 TAP failures, both from the same240s timer, with allother mandatory nativeCorefamiliesPASS and the same two inherited skips. Failure28's native3816byteJSON above and all unexecuted later groups remain unchanged. No Auth/Repository log is attributed to the companion auditor: Auth was never read; Repository was independently read by the source reviewer.

V27 v1 remains **analysis only**. No new source selected/published and no new PR/branch created. The finite8pathcompletion remains HELD. The independent review of prospective source/cost counterexamples is ongoing under this same contract; no next-slice activation.


## V27 v2 — complete selected implementation amendment

Source: https://github.com/Jetnity/jetnity/pull/1183#issuecomment-6784040002

## M04 Recovery Task V27 v2 — exact R36 implementation selected; runtime acceptance PENDING

**2026-11-11T01:13:00Z.** Binding amendment to [V27 v1](https://github.com/Jetnity/jetnity/pull/1183#issuecomment-6783534708). Root selects the independently reviewed **revision4 bounded nested-object serialization proposal**. This authorizes only the exact source change and finite publication package below. This is continuation of the failed actual-main M04 recovery, not a new product/method slice. Source review is not runtime PASS or Technical-Lead PASS.

### Baseline and ownership

Actual main/sole parent: **fbcb72e7c65a5e7c7e4f2e20105ab6f4b2201a54**; tree **2d5413d86c3200ce05863d1f09062a3a5a142c32**. R35 PR #1183 is merged and cannot receive an unmerged follow-up. Root will use fresh branch **fix/official-truth-v3-m04-postmerge-r36-20261111**, then a new Draft PR from this exact main (ahead1/behind0 only if main remains unchanged). No branch/ref/PR is published by this amendment itself.

Author: **Jetnity Official Truth V3 Durable Jobs 1 — Codex Generation 3**, same actual session **/root/m04_durable_jobs_writer_g3**. Independent source reviewer **/root/m04_recovery_source_review_g3**; independent CI/live/cost reviewer **/root/m04_recovery_live_audit_g3**. Root independently reviewed source, inverse, cost arithmetic and primary PostgreSQL code. Root alone publishes Git objects/refs, records TL-PASS, sets Ready and merges. Author self-review is not TL-PASS. Any changed head invalidates all exact-head gates.

### Actual failure retained without rewriting the earlier success

R35 PR CI **42927749592/#4096/attempt1** genuinely passed all8 jobs/all31 native groups in197851ms; its complete accepted evidence and Root [TL-PASS6783190693](https://github.com/Jetnity/jetnity/pull/1183#issuecomment-6783190693) remain historical facts. The exact same tree/source on actual main **42931400600/#4097/attempt1** failed: first23 groups100660ms, full254/255/256 ledger65545ms PASS, then cycle_fail at zero-based50 begun/49 completed,51 START reservations/152 ACK;240287ms including24ms cleanup. The next unacknowledged FAIL outcome remains UNKNOWN. Full64/65, pointer refusal, inherited761/minOwned4182 and groups26–31 including final rollback/late writer are NOT_REACHED, not zero-count PASS.

All6 companion jobs passed; Repository failed only its child/parent M04 timeout and final aggregate propagated Core failure. Core8697/8693PASS/2FAIL/2inheritedSkips. All27296 operations settled/4242 connections closed/1 cluster stopped/zero pending, children or cleanup failures. Complete native JSON3816bytes/SHA256028d2e8dc6e655efd1f193714563bfcb8c5a1f80a6fc04c181909745acd62999 and all terminal/log/companion receipts are retained. Production dpl_HV5HcshbAcnBem14oPJpDGANb1pX READY/fbcb with both aliases does not cure this failed acceptance. No runner/CPU cause is asserted.

### Exactly one implementation path; two literal source spans

Path: **scripts/db/official-truth-v3-durable-jobs-1/jobs-candidate.sql**.

Before:158670bytes / SHA2560221d673c11c8206c56037f8cddeeae5b6eb765c1c9ed44a9bebf548f7ab429b / blobf7d2e523f940a2f2101400c7cab13b59d258f473.

After: **161125bytes / SHA25692ca2bf0c45c9e3702b2de63bf984d6a1f30b6fe4c9c3ee83de35ae470ab2d16 / blob9d15e032dea6dd9a5ab6cbb8537220f6fa23529e**.

Only canonical_v1 body changes. The first span adds one local fast_text declaration; the second inserts the2439-byte bounded positive probe after the original root guard and before the unchanged original CASE. Total growth2455bytes. Exact inverse restores every original byte. All29 declarations/attributes,28 other function blocks, schema/tables/ACL/RLS, native, fixtures and17 other protected sources remain exact.

**Span1 BEFORE (including trailing LF):**

```sql
  frame_length integer; pending_length integer; parent_length integer; parent_pending_length integer;
```

**Span1 AFTER (including trailing LF):**

```sql
  frame_length integer; pending_length integer; parent_length integer; parent_pending_length integer; fast_text text;
```

**Span2 BEFORE (including trailing LF):**

```sql
  IF v IS NULL OR d IS NULL OR d<0 OR d>24 THEN RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601'; END IF;
  CASE jsonb_typeof(v)
```

**Span2 AFTER (including trailing LF):**

```sql
  IF v IS NULL OR d IS NULL OR d<0 OR d>24 THEN RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601'; END IF;
  IF jsonb_typeof(v)='object' THEN
    fast_text:=v::text;
    IF octet_length(fast_text)<=8192 THEN
      IF strpos(substring(fast_text,2) COLLATE "C",'{')>0 THEN
        WITH RECURSIVE walk_nodes(node,member_key,node_path,node_depth,node_type) AS (
          SELECT v,NULL::text,ARRAY[]::text[],d,'object'::text
          UNION ALL
          SELECT j.value,j.key,array_append(w.node_path,j.key),w.node_depth+1,jsonb_typeof(j.value)
            FROM walk_nodes w CROSS JOIN LATERAL jsonb_each(
              CASE WHEN w.node_type='object' AND w.node_depth<24 THEN w.node ELSE '{}'::jsonb END) j
            WHERE w.node_type='object' AND w.node_depth<24
        ), encoded_nodes AS MATERIALIZED (
          SELECT w.node_path,w.member_key,w.node_type='object' AS is_object,
            CASE WHEN w.node_depth>24 OR (w.member_key IS NOT NULL AND w.member_key ~ '[^ -~]') THEN NULL
            ELSE CASE w.node_type
              WHEN 'object' THEN CASE WHEN w.node_depth=24 AND w.node<>'{}'::jsonb THEN NULL ELSE '{' END
              WHEN 'string' THEN CASE WHEN (w.node#>>'{}') ~ '[^ -~]' THEN NULL ELSE w.node::text END
              WHEN 'number' THEN CASE WHEN w.node::numeric=trunc(w.node::numeric)
                AND w.node::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc(w.node::numeric)::text END
              WHEN 'boolean' THEN w.node::text
              WHEN 'null' THEN 'null'
              ELSE NULL
              END
            END AS piece
            FROM walk_nodes w
        ), token_rows AS (
          SELECT e.node_path AS token_path,e.member_key,CASE WHEN e.is_object THEN 1 ELSE 2 END AS token_kind,e.piece FROM encoded_nodes e
          UNION ALL
          SELECT array_append(e.node_path,NULL::text),NULL::text,3,'}' FROM encoded_nodes e WHERE e.is_object
        ), ordered_tokens AS (
          SELECT t.token_path,t.member_key,t.piece,lag(t.token_kind) OVER (ORDER BY t.token_path COLLATE "C") AS previous_kind FROM token_rows t
        )
        SELECT CASE WHEN bool_and(o.piece IS NOT NULL) IS TRUE THEN string_agg(
          (CASE WHEN o.member_key IS NOT NULL THEN CASE WHEN o.previous_kind=1 THEN '' ELSE ',' END||to_jsonb(o.member_key)::text||':' ELSE '' END)||o.piece,
          '' ORDER BY o.token_path COLLATE "C") END INTO fast_text FROM ordered_tokens o;
        IF fast_text IS NOT NULL THEN RETURN fast_text; END IF;
      END IF;
    END IF;
    fast_text:=NULL;
  END IF;
  CASE jsonb_typeof(v)
```

No other source change, nodes_v1 rewrite, helper function, metadata shortcut, cache widening, global/session state or history omission is authorized.

### Semantic contract and source proof

The unchanged initial guard runs first. Only object input with raw JSONB text<=8192bytes and another literal opening brace after the root opener enters the new query. Flat objects without that brace retain the original aggregate; braces inside strings/keys are safe false positives. Oversize objects fall back after raw text materialization. Scalars and arrays use the original path.

A recursive walk carries value, key, typed text[] path, depth and one immutable type tag per node. Root tag object is proved by the outer guard; each child tag is exactly jsonb_typeof(j.value). Only object nodes below depth24 expand. The explicit WHERE filters before the parameterized expansion; the CASE still makes every function input safe. C-order key paths plus explicit NULL closing sentinels place open/child/close tokens correctly. Both LAG and final aggregate use explicit C collation. Do not claim only one physical sort.

All key/string ASCII checks, safe integral numeric range/representation, scalar rendering and depth semantics match the original expressions. Every token must be nonNULL via bool_and IS TRUE before a positive RETURN. Arrays, invalid key/value, or invalid depth cause full original fallback with fast_text cleared; the existing error ordering, acceptance, current authority, transaction and rollback logic remains intact. JSON null is distinct from SQL NULL. Empty objects/keys, close/sibling punctuation, exact24-depth boundaries and original fallback state were reviewed.

Root and independent reviewer checked primary PostgreSQL source at **c372fbbd8e911f2412b80a8c39d7079366565d67**: arrayfuncs.c NULL/element/collation/prefix comparator; jsonb.c literal object renderer; planner WorkTableScan qualifiers and executor/NestLoop order; pl_funcs.c/pl_comp.c alias versus scalar PL variable resolution. This is pinned source reasoning, not a runtime EXPLAIN or parser execution.

Logical generic admitted shape: raw R>=5N−3, hence N<=1639, tokens<=3278, key path<=24/closing<=25. Loose repeated key-path bound3278×8192=26853376bytes excludes tuple headers/materialization/sort copies and is NOT peakRSS. Full raw v::text occurs before the8192cap. Arbitrary resource-failure timing/exception context/peak memory equivalence is not claimed.

### Complete two-quota work model, including countercosts

These are independently recomputed source counts for BOTH complete254/255/256 and64/65 traces, not runtime profiling. All548593 external canonical calls remain:493889 object roots and54704 scalar roots.133836 flat object roots keep the old aggregate;360053 nested roots enter the CTE. Their conservative raw root maximum3519bytes is below8192 (job994, envelope2559, fullCAS3519, START1582, attempt1800, reply1467). Only embedded subjectText needs quote expansion; commandText is not embedded in these canonical roots.

| Scope | CTE roots | Raw objects | Members | Walk rows | Tokens | Member path slots | Closing path slots |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| ledgerHistory | 134682 | 734286 | 4598092 | 4732774 | 5467060 | 9846756 | 1798795 |
| cyclesHistory | 216202 | 977822 | 5679390 | 5895592 | 6873414 | 11350294 | 2235196 |
| ledgerOutside | 4651 | 19115 | 103514 | 108165 | 127280 | 241264 | 47769 |
| cyclesOutside | 4518 | 19014 | 103398 | 107916 | 126930 | 232469 | 46521 |
| Total |360053|1750237|10484394|10844447|12594684|21670783|4128281|

The new360053 CTE queries replace1549094 nested-root object aggregate SELECTs. Total object query sites become493889 versus1682930. Aggregate invocations become1121614 versus5048790, not measured CPU. All8135205 old PL frame-array loop sites are bypassed for admitted trees, while declaration initializations remain (including3840151 seven-frame-array initializations over counted roots).

Real countercosts:12234631 typed path appends and25799064 logical text-path result slots, versus43218116 old mixed-payload stack slots; these are different types/widths, not a byte or allocation equivalence. Losing same-parent memo adds201143 object visits/1542089 members. Recursive walk and explicit encoded materialization each process10844447 logical rows. Two ordering source sites/query=720106 sites;12594684 token rows/site, not a physical-sort count. Each raw object root pays serialization/length/brace admission. Invalid or array-containing admitted objects pay a bounded failed probe plus the complete old fallback. Scalar roots add the object-type check.

Revision4 type reuse computes10484394 member types instead of34283578 repeated type expressions in the unselected revision3 query. The carried tag adds up to7 logical characters per walk row (cumulative75911129, largest native call602), excluding physical tuple/storage overhead. Largest native shape has16objects/85members/86walkrows/102tokens/405path slots; maximum native path6. Existing nodes_v1, all history/current-state checks, map work, transport, setup, locks and cleanup remain.2455bytes function growth adds1276600 definition-hash input bytes over520 modeled API checks; whole-native API total is unproved.

The history algorithm remains quadratic. Other29 native groups and general invalid/array inputs are outside the quota cost model. There is **no measured time saving or guaranteed240-second margin** before execution.

### Frozen coverage and limits

All18 protected source pins are in the new evidence record; sorted digest format remains SHA256 SPACE decimalUTF8Bytes SPACE repositoryPath LF, including finalLF. Baseline aggregate797462a57f2ae4d720e11ccdcb46b50bdc779808481a80176c6784ecbfdaee8a; selected aggregate **01977b08156ecf0d77a068a29d3874b7944d0e272f71345e0ac3c3e42e42af7a**. Native191098/f5d849c643ff22d264bc9adc1a7cd65f12caaac80a804647604851f22effbde0 and rollback6175/9b9089d74242a802455cc7e3fb8a0a8515c17b61b45ae730b9bbba1adb650a66 stay frozen.

R26 non-array nested positives exercise the new query including ordering, max safe integers, siblings/empty children/depth24. Some earlier decimal/escaping tests are flat/array-bearing and exercise fallback, not dedicated positive-probe coverage. There is no new8192-edge, exhaustiveNULL-path, alternate-collation or resource-error oracle. These limits must remain explicit; no test/fixture changes are authorized.

All31 native groups, full quotas, real two nested R9 abort/drain/backend-departure witnesses, inherited761/minOwned4182, all final rollback/latewriter cases, cleanup and complete companions remain mandatory. Effect240000ms/cleanup60000ms/total300000ms, all owner/generation/work/connection/callback bounds, outer/job budgets, manifests, dependencies and CI workflows remain unchanged. No skips, sampling, truncation, warmup bypass, exception masking or relaxed checks.

### Finite publication package and preserved history

Authorize exactly10 paths: the one SQL file; six current entry/handoff files (JETNITY_START_HERE.md, docs/ACTIVE_WORK_STATUS.md, ROADMAP.md, JETNITY_HANDOFF.md, ARCHITECTURE.md, docs/official-truth-product-v3/M04_HANDOFF_V1.md); and three NEW records:
- docs/official-truth-product-v3/M04_RECOVERY_TASK_V27.md
- docs/official-truth-product-v3/M04_RECOVERY_ROOT_REVIEW_V27.md
- docs/official-truth-product-v3/M04_RECOVERY_R36_EVIDENCE_V27.json

Root owns all9 continuity paths. Preserve exact bytes outside the five existing current-block markers; prepend the full new handoff while retaining every byte of the old45494-byte M04 handoff. Taskfile contains full V27v1 (including terminal appendix) and this v2 once. Review/evidence distinguish source review, future candidate verification, pending runtime and later acceptance. No obsolete self-attestation is edited into a PASS.

Preserve all27 earlier failures and genuine R21/R29 evidence by immutable reference to existing **M04_RECOVERY_R35_EVIDENCE_V26.json** at fbcb:892608bytes/SHA25697eb8349018d8279a823c28e4cadd102a5290d6f956e3fc74077311ffa821fb1/blobd3c97f89fc5ba900a10e87670a0356d4c47a4bfe, unchanged. Do not duplicate or truncate that file. The new V27 record additionally retains the COMPLETE R35 PR acceptance and actual-main failure28/companion proof objects, full native receipts, terminal/log pins, Production proof and the separate raw Atomic edge-order lines (151 ordinary JSON events plus one TAP-escaped proof line each). Raw escaped-line parsing limits are disclosed; neither earlier151 count nor an invalid partial decode becomes a PASS claim. All28 failures stay reachable and accurately labeled.

Preserve all9415 existing leaves not changed in this10-path package, including all36 parallel #1181 leaves and every previous recovery record. Three new leaves; zero deletions; expected9425 leaves/10262 recursive entries/838directories if the baseline is unchanged.

### Required exact-head gates, actual-main gates and STOP

1. Same author and independent reviewer read this complete published amendment, reconstruct the two literals and report exact pins/inverse/18-source digest. Root verifies full immutable commit/tree, all10 prepared files and all18 protected sources with independent full readback before exposing the new branch/Draft.
2. Run complete existing8-job CI for the actual new head, full31-group M04 native proof and all6 companion jobs. Root personally sees terminal metadata before each permitted non-Auth log, then explicitly authorizes independent complete-log audit. **No Auth logs.** Exact Vercel Preview READY/SHA/project and fresh main/merge-base/ahead/behind/full diff/strict rules/NORMAL/Owner/review-thread/otherhead gates required.
3. Root may TL-PASS/Ready/expected-head merge only after complete independent acceptance. On failure: CHANGES REQUIRED to SAME author/session, versioned bounded fix, newhead/full re-gating. No unchanged-head rerun.
4. Actual merged main requires independent full8-job/31-group/quotas/R9/rollback/latewriter/companions/Core/hygiene/build acceptance and exact Production READY with both jetnity.com and jetnity-app.vercel.app individually bound. PR green is not actual-main PASS.
5. Only then the already contracted finite8-path documentation completion may proceed through its own Draft/completePR/main/Production gates and final existing PR/#751 receipts, then STOP. That closure is still HELD now; its two filenames remain unselected. No automatic following slice.

No local/replacement project, parser, SQL, native, socket, build or test execution; no downloads/installations/clone/gitfetch/push. Existing reviewed CI only executes project code. No hostedDB/Auth/RLS/ACL/migration/credentials/provider/research/scheduler/notification/newcost/public activation.

SQL_UNAPPLIED; METHOD_NOT_APPROVED; #1139 NOT_RELEASE_READY/17preOwnerGaps; #917 UNKNOWN/Stage2 NOT_ATTEMPTED with no individual read/retry/rephrase/delegation/reroute/transport switch or humanSQLsubstitute; #1131 Ready STOP; both#1135 holds; #968 target isolation; #911/#913 privacy; D1#1169 separately unfinished. Concrete client/SSR/Auth binding remains unproved. No special Owner gate removed.

P0:no new concrete issue identified in this bounded source review, not global clearance. P1:actualmain M04 acceptance remains FAILED. P2:quadratic work/runtime variation, unmeasured ordering/materialization/memory overhead and limited dedicated positive-probe edge coverage. P3:two inherited skips and finite closure pending. No prospective PASS, Ready or merge is claimed.

