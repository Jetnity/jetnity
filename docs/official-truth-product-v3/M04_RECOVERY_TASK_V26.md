# M04 Recovery Task V26 — binding v2 and complete failure27

Current authority is V26 v2 below. V26 v1 is retained verbatim as its terminal-failure receipt and bounded investigation predecessor. Published comment readbacks, exact source pins and later live receipts govern. This file is a pre-publication record, not a runtime or merge receipt.

## V26 v1 — complete published failure27 and investigation contract

# CHANGES REQUIRED — M04 R35 / Recovery Task V26 v1

**Root terminal R34 receipt and binding same-session source investigation. 2026-11-10 23:10:51 UTC (11 November, Europe/Zurich).** Root independently read all8terminal job metadata records before all7permitted non-Auth logs. Independent auditor /root/m04_recovery_live_audit_g3 separately confirms identical pins and full receipts.

R34 [CI42918105407 / #4095 / attempt1](https://github.com/Jetnity/jetnity/actions/runs/42918105407) is fully **completed / FAILURE**, updated2026-11-10T23:06:27Z. **Failure observation27**, not a new success. Draft#1183 remains unmerged; no TL-PASS or Ready. The Source V25 review remains genuine source review, but it did not establish sufficient runtime margin.

## Exact published source and checkout

Published head **212e4260a417f795720f050b9d7b4e0bbf74593e**, tree **8999dbc7267ccc579ca4fb0812a1b809fd3cfc76**. Branch fix/official-truth-v3-m04-postmerge-r30-20261110. Main/merge-base **e7aae86c18238033c2186722e24c84dc7a5f69b9**,5ahead/0behind/23cumulative paths. Root just reread same main/head,Draft/unmerged,NORMAL.

Synthetic CI checkout **b8bf0b6571d820d83e4b46ceddbf5a88f5aa1275**, ordered parents[e7,212e], has the exact same tree8999dbc7. Root and independent auditor verified ancestry/tree, actual checkout logs and UI binding.

Actual SQL154573bytes/SHA256 **714d766795a2cd9362f0fe243948b628e84cab307ec34306c15573b5c1ac64c8**/blobf1ec4f9fba367df695646e9817a5e567cf4fe63d. Native remains191098bytes/SHA256f5d849c643ff22d264bc9adc1a7cd65f12caaac80a804647604851f22effbde0/blob0b3f7d9906687ec42171de5af60fed009d07b39f. Rollback6175bytes/SHA2569b9089d74242a802455cc7e3fb8a0a8515c17b61b45ae730b9bbba1adb650a66/blobbb371a26f018107439d0031f5f72c23675aaf97c. Current18source aggregate **5bdd3fd5e92194b0936fc3f25e4e27eeeb9141578270b6419ae90ab8194342e1**.

## Complete failure27

**24/31 groups completed.** First23 total98455ms; full N05/A03 ledger65453ms. N05 full64/65 cycle proof then failed after75422.50649ms with **M04 240s effect budget exceeded**, proof_25:N05, current boundary **cycle_enqueue**.

Zero-based lastStartedIndex52/lastCompletedIndex51.52START reservations;156acknowledged command commits;157/156command calls;210/209fixed calls. **Next unacknowledged ENQUEUE outcome UNKNOWN**; no committed/rolled-back outcome is inferred. Full64/65,pointerrefusal,inherited761/minOwned4182 and groups26–31 were NOT_REACHED. Final accounting0/0 is unexecuted, not a successful zero proof.

Complete ledger:253/253indexes,258/258requests andcommandcalls,260/260fixedcalls,256ACKs,oneSTART/reservation; actual254/255/256 and expected quota/blocked refusals passed. Both realR9 witnesses passed with actual SQL wait, abort, retained executor drain, backend departure while held and0terminaleffects. I1timeout remains worker_only/failConfirmtrue/45admissions; caller-abort remains unconfirmed/failConfirmfalse/44admissions. Held-method snapshots are followed by actual drain/release checks.

Native240400ms including42mscleanup;27298/27298operations settled,4242/4242connections closed,1/1cluster stopped,0children/pending/cleanupfailures;nativePassfalse. Errorstack: native.ts457:52 deadline, native.ts2184:41 parent aggregation.

Complete compact native receipt **3818bytes / SHA256362133f70daa42a8d4462cfbe23f9aa8eab06c8853a05ed5b0ff9b1a8e606691**, no trailingLF. WithLF3819bytes/SHAb12dbccfce9c59eff05766ff73daca10d046456118ba99f539d704fb0afb901d.

Core **8697tests/8693PASS/2FAIL/2inheritedskips/0cancelled/971suites**,828123.474288ms. The2failures are N05 and its M04parent. Typecheck/LintPASS; **all5hygiene checks andProductionBuildSKIPPED**. Skips remain T09sharedWorkspacebrowser and optionalSHARED_LAYOUT_AUDIT_BASE layout; no M04skip. Aggregator correctly fails the failed Core family.

### All8terminal jobs

| Job | ID | Result |
|---|---:|---|
| Repository verification | 130185660459 | FAILURE |
| Accepted store trip integration — native (store) | 130185660801 | SUCCESS |
| Atomic version refresh — native | 130185660924 | SUCCESS |
| Accepted store trip integration — native (lifecycle) | 130185660926 | SUCCESS |
| Official truth V3 — isolated UI | 130185660950 | SUCCESS |
| Auth-Konfiguration gegen config.toml | 130185661123 | SUCCESS (metadata only) |
| Persisted canonical read — native | 130185661139 | SUCCESS |
| Typecheck, Lint & Build | 130193829538 | FAILURE |

### Complete permitted logs

| Log | Job | UTF8 bytes | SHA256 |
|---|---:|---:|---|
| repository | 130185660459 | 4258652 | 611bdac27461f5b76a7479eb3a3768097789781fe3e68eeb7c9ad05a0d297bcd |
| persisted | 130185661139 | 156461 | a3a0fdec8dcc23278b82ff69f71c43047190407505aa675283dd0ccf464bdfe8 |
| store | 130185660801 | 136129 | 6a85d67b1551dedbb897aca2ec6f438a18c2a02aee83897e6f14df6ca9b4a890 |
| lifecycle | 130185660926 | 177307 | 305aa3e03e133dcd955006297b473a30e692b800bb7654a06c098b596ec3be15 |
| atomic | 130185660924 | 184228 | 602fba45dca8134a48bcc61ccda3a40d06b17e1cea00d1dbc9a5400306bbda9d |
| ui | 130185660950 | 141844 | cc75d9adfa055f9654b8927ae382579b781b397eb7f9f18166ab07ccd15d9676 |
| aggregate | 130193829538 | 3985 | 7b1b1165e3cd0a4c5c40231c41dab6582858fa2b6f8f2216af33e8181cc2d0bb |

### Independently verified companions

Persisted1/1,95structured events/45readerresults,172880.615049ms. Full guard/deadline/cancellation/composed/rehashed-original/rollback phases and finalcomplete event.

Store4/4,39events,391352.631091ms. Integrity2266/2266settled444/444closed; publication1574/1574settled296/296closed; each1cluster,0activeSQL/backends/provisional/pending,keys wiped,teardowntrue. All native saved-Trip,integrity,semantic-refusal,staged-mismatch,lostACK/reconciliation/restore families retained.

Lifecycle4/4,29events,511108.359889ms. Actual mounted13proofs,61/61observers,0pending/retained/errors;22nativecurrentresults,0sourcefetchesduringreads. Bundle76f5a82c5beb4f8b607c9ff1b074b830f1b4fc188a389d2922cc33fbb6b33cb9,113bundle/85repomodules. Boundaries581/581ops90/90connections; wait-lifecycle5075/5075ops476/476connections; completezero-pendingteardown. All SSR/outgoing/32orphan/R4contention/finalizeauthority+Trip/refusal families retained.

Atomic1/1,151events,771827.933598ms.30complete negative rollbacks,10coordinatoroutcomes,allbackendclosures.10034/10034settled,248/248closed,11clusters,0pending,parentAbortedfalse,reserve428886ms. Actual canonical-negative/guard/wait/race/unknownACK/readback matrices retained.

UI50/50,6suites,2166.210077ms;6HTTPcases,12layouts,11interactions,10screenshots. Exactclean212e/source,b8bf/synthetic,run42918105407/attempt1 binding. Artifact13808959725,15files,3740086bytes,ZIP digest e3a4fa40542e441e4642a1996578fc5487c994421ada172546e47a83d2112869,expiry2026-11-24T22:51:34Z. Log andartifactmetadata match. Archive not downloaded/no independent image inspection. All companions remain isolated/synthetic, not hosted client/SSR/Auth target proof or ProductionSLO. Authmetadataonly.

Preview **dpl_6Kx16pU3q3ATHhgrX2Gvnoyvd5Lx** READY/exact212e/aliasErrornull, Vercelstatussuccess. Production remains last verified **dpl_2QAy8s3qEWtinWYUwBeQTeFjtUwf** READY/exacte7 via bothaliases. Deployment metadata does not close failed native acceptance.

<details><summary>Complete actual R34 native receipt</summary>

```json
{
  "schema": "jetnity.m04.native.v1",
  "candidateSha256": "714d766795a2cd9362f0fe243948b628e84cab307ec34306c15573b5c1ac64c8",
  "rollbackSha256": "9b9089d74242a802455cc7e3fb8a0a8515c17b61b45ae730b9bbba1adb650a66",
  "executed": true,
  "effectAndCleanupMilliseconds": 240400,
  "cleanupMilliseconds": 42,
  "clusters": 1,
  "childProcesses": 0,
  "lifetime": {
    "started": 27298,
    "settled": 27298,
    "pending": 0,
    "connections": 4242,
    "closed": 4242,
    "stoppedClusters": 1
  },
  "groups": [
    {
      "id": "N01",
      "milliseconds": 59
    },
    {
      "id": "N02",
      "milliseconds": 2370
    },
    {
      "id": "N03",
      "milliseconds": 2407
    },
    {
      "id": "N07",
      "milliseconds": 9872
    },
    {
      "id": "N07/R4",
      "milliseconds": 1063
    },
    {
      "id": "N08",
      "milliseconds": 13189
    },
    {
      "id": "N08/U04",
      "milliseconds": 4706
    },
    {
      "id": "N02/U04",
      "milliseconds": 1378
    },
    {
      "id": "N04/N06",
      "milliseconds": 2843
    },
    {
      "id": "N04/N06/N10",
      "milliseconds": 2732
    },
    {
      "id": "N05/N09",
      "milliseconds": 2868
    },
    {
      "id": "N09",
      "milliseconds": 18964
    },
    {
      "id": "N10/U06",
      "milliseconds": 6871
    },
    {
      "id": "N11",
      "milliseconds": 2235
    },
    {
      "id": "N11",
      "milliseconds": 176
    },
    {
      "id": "N12",
      "milliseconds": 164
    },
    {
      "id": "N04/N10/N12",
      "milliseconds": 4666
    },
    {
      "id": "N12/U06/R9",
      "milliseconds": 14427
    },
    {
      "id": "N12/R7-03",
      "milliseconds": 592
    },
    {
      "id": "N11",
      "milliseconds": 3094
    },
    {
      "id": "N11",
      "milliseconds": 310
    },
    {
      "id": "N11",
      "milliseconds": 314
    },
    {
      "id": "N13",
      "milliseconds": 3155
    },
    {
      "id": "N05/A03",
      "milliseconds": 65453
    }
  ],
  "nestedRaceWitnesses": [
    {
      "boundary": "i1_timeout",
      "operation": "reserve_v1",
      "target": {
        "pid": "25485",
        "birth": "2026-11-10 23:01:34.632884+00"
      },
      "control": {
        "pid": "25484",
        "birth": "2026-11-10 23:01:34.629293+00"
      },
      "holder": {
        "pid": "25160",
        "birth": "2026-11-10 23:01:30.306157+00"
      },
      "realSqlWaitObserved": true,
      "abortDelivered": true,
      "retainedExecutorDrained": true,
      "backendAbsentWhileExecutorHeld": true,
      "failConfirmObserved": true,
      "terminalEffects": 0,
      "beforeDrainSlot": "unavailable",
      "afterDrainSlot": "invalid",
      "heldMethods": 3,
      "completedMethods": 0,
      "outwardStatus": "worker_only",
      "nativeAdmissionsAfterDrain": 45
    },
    {
      "boundary": "worker_caller_abort",
      "operation": "reserve_v1",
      "target": {
        "pid": "26266",
        "birth": "2026-11-10 23:01:43.922354+00"
      },
      "control": {
        "pid": "26265",
        "birth": "2026-11-10 23:01:43.916649+00"
      },
      "holder": {
        "pid": "25901",
        "birth": "2026-11-10 23:01:39.734723+00"
      },
      "realSqlWaitObserved": true,
      "abortDelivered": true,
      "retainedExecutorDrained": true,
      "backendAbsentWhileExecutorHeld": true,
      "failConfirmObserved": false,
      "terminalEffects": 0,
      "beforeDrainSlot": "unavailable",
      "afterDrainSlot": "invalid",
      "heldMethods": 3,
      "completedMethods": 0,
      "outwardStatus": "unconfirmed",
      "nativeAdmissionsAfterDrain": 44
    }
  ],
  "quotaProgress": {
    "currentGroup": "N05",
    "boundary": "cycle_enqueue",
    "indexBase": 0,
    "millisecondsCap": 300000,
    "timingMeaning": "client await durations including construction/transport; not server statement profiling",
    "ledger": {
      "lastStartedIndex": 253,
      "lastCompletedIndex": 253,
      "commandRequestsStarted": 258,
      "commandRequestsCompleted": 258,
      "commandRequestMilliseconds": 487,
      "fixedCallsStarted": 260,
      "fixedCallsCompleted": 260,
      "fixedCallMilliseconds": 65127,
      "commandCallsStarted": 258,
      "commandCallsCompleted": 258,
      "commandCommits": 256,
      "startCallsStarted": 1,
      "startCallsCompleted": 1,
      "startReservations": 1
    },
    "cycles": {
      "lastStartedIndex": 52,
      "lastCompletedIndex": 51,
      "commandRequestsStarted": 157,
      "commandRequestsCompleted": 157,
      "commandRequestMilliseconds": 307,
      "fixedCallsStarted": 210,
      "fixedCallsCompleted": 209,
      "fixedCallMilliseconds": 75284,
      "commandCallsStarted": 157,
      "commandCallsCompleted": 156,
      "commandCommits": 156,
      "startCallsStarted": 52,
      "startCallsCompleted": 52,
      "startReservations": 52
    }
  },
  "connections": {
    "aggregateWorkConnectionBound": 40,
    "maximumJobs": 4,
    "maximumIntake": 1,
    "maximumMethod": 2,
    "m04ObserverLimit": 2,
    "maximumM04Observers": 2,
    "methodObserverLimit": 1,
    "fixturePerClusterLimit": 16,
    "inheritedCommitGuardPairs": 0,
    "minimumOwned": 0
  },
  "failure": {
    "phase": "proof_25:N05",
    "error": {
      "kind": "fixture",
      "code": "unclassified_failure"
    }
  },
  "cleanupFailures": [],
  "cleanupFailureCount": 0,
  "nativePass": false
}
```

</details>

## Same author, bounded V26 source investigation only

Sole immediate correction author: **Jetnity Official Truth V3 Durable Jobs1 — Codex Generation3**, SAME actual session **/root/m04_durable_jobs_writer_g3**. Independent source reviewer **/root/m04_recovery_source_review_g3**; current independent CI/live/cost auditor **/root/m04_recovery_live_audit_g3**. Historical CI/G1/G2 sessions are not represented as resumed. Root alone selects concrete implementation, publishes, setsTL-PASS/Ready ormerges.

The known source issue is substantial repeated validation work across complete history. These elapsed observations do not identify exclusive function-level CPU cost, prove runner/flakiness causality or constitute a controlled speedup. R34's source savings remain real algebraically; its runtime acceptance still failed.

Read-only immutable-source analysis and exact in-session proposal only. Investigate a materially sufficient further reduction **within existing jobs-candidate.sql**, preserving all31proof groups and fullhistory/authority/error semantics. Focus the remaining work across BOTH complete quota traces, including all current jobs, queue rows, starts rows and outside-history calls. Do not submit an unquantified small speculative adjustment or treat reached52starts as full64/65acceptance.

Current complete-quota model retains1737634canonical entries, including1698224history and39410outside-history. History breakdown332406command,762655envelope,116351audit,167601distinct-job own,154041subject,165170starts. All116351queue and16517starts rows remain. The job map already removes repeated full job validations; do not count those savings again. Include existing map-copy/catalog cost and all new countercosts.

Deliver concrete named-function/literal-span alternatives with:
- exact baseline/proposed fullSQL bytes/SHA256/Gitblob and updated18source aggregate;
- full-path source-derived work reduction over complete quota proofs, bounds/countercosts and honest timing uncertainty;
- preservation of SQLNULL/JSONnull,rawnumeric representations,collation,depth/key/order/calendar/time behavior,logicalrefusals and original evaluation context;
- no omitted row, existing guard, transition, authority check, transaction/wait/cleanup boundary or test;
- primary PostgreSQL source support for any new mechanism, without executing a parser or SQL;
- explicit existing-oracle coverage and remaining gaps under the frozen native/fixture contract.

Root and reviewer must independently assess the actual proposal. **No implementation publication until a concrete versioned V26 amendment selects exact source.** Do not broaden to schema/signature/role/ACL/state-machine changes, cross-invocation trust, persisted markers, protected predecessor changes or a new product slice.

## Frozen gates and STOP

All29declarations/attributes remain; native,fixtures,workflows,dependencies,protectedmanifests,guards,rollback and other17sources frozen. No unchanged-head rerun or new speculative head. No higher budget, shorter quotas, skipped rows/groups, reduced concurrency or acceptance weakening.

240s effects+60s cleanup/300s total;4outerlanes/4nativeperfamily;8activeNative/256total/16terminalreserved;8callbacks/128total;30souter/5schild;3clusters/2children/40aggregateworkconnections/2M04observers/1methodobserver/16fixtureconnectionspercluster. Complete254/255/256and64/65,inherited761/minOwned4182,bothrealR9,finalrollback/latewriter/full drain remain required on every new head and actualmain.

No local checkout/project/parser/SQL/native/socket/build/test execution, installation/download/binaries/clone/replacementenvironment/gitfetch/push. Only permitted immutable connector reads and puretext/data analysis; actual project execution stays in existing CI after reviewed new-source publication. No Authlogs,hostedDB/Auth/RLS/ACL/migration/credentials,provider/research/scheduler/notification/newcost/publicactivation. #917UNKNOWN/Stage2NOT_ATTEMPTED: no retry/rephrase/delegation/reroute/transportswitch/humanSQLsubstitute.

Preserve all27failed observations and genuineR21/R29PRsuccesses. Full R34source/evidence remain immutable historical records. Source proposals are not runtimePASS. Same-session review fixes; onlyRootReady/merge after all8jobs/full31/actualmountedLifecycle/Core/hygiene/Build/Preview/freshmain/diff/review/rules/mode/Owner gates, then separateactualmainCI/native/Production/bothaliases.

Mandatory separate8pathdocumentationclosure stays **HELD until genuine corrected actual-mainPASS**, then ownDraft/fullPR/main/Productiongates and finalexistingPR/#751receipts; finiteSTOP,noautomaticnextproduct slice. D1#1169separatelyunfinished.

SQLUNAPPLIED;MethodNOT_APPROVED;#1139NOT_RELEASE_READY with17preOwnergaps;#1131ReadySTOP,both#1135holds,#968targetisolation,#911/#913privacy. Concreteclient/SSR/Authbinding unproved. **AuthorSTOPafterexactsourceproposal;noReady,merge or follow-up slice.**


## V26 v2 — concrete selected implementation amendment

# M04 R35 — binding Recovery Task V26 v2

**Concrete implementation selection by Root / Technical Lead. Selected 2026-11-10 23:38:14 UTC.** This amendment selects the exact flat-child object traversal below under [V26 v1 and complete terminal failure27](https://github.com/Jetnity/jetnity/pull/1183#issuecomment-6781871324). It is an authorization to deliver this bounded source correction for independent new-head acceptance, not TL-FINAL-PASS, Ready, merge or runtime acceptance.

## Immutable baseline and same actual author

PR #1183 remains OPEN / DRAFT / UNMERGED. Branch `fix/official-truth-v3-m04-postmerge-r30-20261110`; expected parent **212e4260a417f795720f050b9d7b4e0bbf74593e**, tree **8999dbc7267ccc579ca4fb0812a1b809fd3cfc76**. Main/merge-base **e7aae86c18238033c2186722e24c84dc7a5f69b9**, tree **8918d48841c19ddaf16c128973a0f03eed481f43**; 5 ahead / 0 behind / 23 cumulative paths before this correction. Root's latest read confirmed unchanged main/head and all14 open PRs Draft.

Sole immediate author **Jetnity Official Truth V3 Durable Jobs1 — Codex Generation3**, SAME actual session **/root/m04_durable_jobs_writer_g3**. Independent source reviewer **/root/m04_recovery_source_review_g3**; independent CI/live/cost auditor **/root/m04_recovery_live_audit_g3**. Root alone selects source, publishes, sets TL-PASS/Ready or merges. Self-review is not TL-PASS. Historical unavailable sessions are not represented as resumed.

Baseline SQL: **154573 bytes / SHA256 714d766795a2cd9362f0fe243948b628e84cab307ec34306c15573b5c1ac64c8 / blob f1ec4f9fba367df695646e9817a5e567cf4fe63d**.

Selected complete SQL: **158670 bytes / SHA256 0221d673c11c8206c56037f8cddeeae5b6eb765c1c9ed44a9bebf548f7ab429b / blob f7d2e523f940a2f2101400c7cab13b59d258f473**. Net growth **4097 bytes**. Selected18-source aggregate **797462a57f2ae4d720e11ccdcb46b50bdc779808481a80176c6784ecbfdaee8a**, using SHA256 SPACE decimalBytes SPACE repositoryPath LF sorted by path.

Only `scripts/db/official-truth-v3-durable-jobs-1/jobs-candidate.sql` changes as source, and only these two spans in `canonical_v1`. All29 declaration/attribute pairs, the other28 complete function blocks, every byte outside canonical, and the original1695-byte ARRAY/root-scalar suffix remain unchanged. All17 other M04 sources remain frozen. Native stays191098 bytes / f5d849c643ff22d264bc9adc1a7cd65f12caaac80a804647604851f22effbde0; rollback6175 bytes / 9b9089d74242a802455cc7e3fb8a0a8515c17b61b45ae730b9bbba1adb650a66. The two-span inverse restores the full R34 SQL exactly.

## Exact selected replacements

Each old/new span is unique. Declaration spans exclude the final LF; the line break before their closing Markdown fence is a delimiter. Object spans include their final LF. Byte counts and hashes bind the exact span boundaries.

### 1. canonical declarations

Old: 211 bytes / SHA256 119549c9c39f6ed8f871e90a1d6e20e0c1b6a79d13844595feac84734bcb7e5f / blob eb16b291a6a2561e0c2a8f5bc87eba9003336402.

```sql
DECLARE x record; e jsonb; s text; parts text[]:='{}'; child_text text; number_value numeric; retained_object jsonb; retained_object_canonical text; object_keys text[]; object_values jsonb[]; part_index integer;
```

New: 773 bytes / SHA256 44a2890f4ab1fbbc19a1d5646edbe84503af868980d943aae05fd1bbd096267b / blob 29ca59d5295834ab2843b7fb36cdbb7b48bac21e.

```sql
DECLARE x record; e jsonb; s text; parts text[]:='{}'; child_text text; number_value numeric; retained_object jsonb; retained_object_canonical text; object_keys text[]; object_values jsonb[]; part_index integer;
  current_depth integer; child_depth integer; descend_object boolean; pending_positions integer[]; pending_cursor integer;
  child_keys text[]; child_values jsonb[]; child_parts text[]; child_pending_positions integer[];
  stack_parts text[]:='{}'; stack_keys text[]:='{}'; stack_values jsonb[]:='{}'; stack_pending integer[]:='{}';
  frame_lengths integer[]:='{}'; frame_pending_lengths integer[]:='{}'; frame_cursors integer[]:='{}'; stack_level integer:=0;
  frame_length integer; pending_length integer; parent_length integer; parent_pending_length integer;
```

### 2. canonical root-object traversal

Old: 2525 bytes / SHA256 824f032c28a3f6e485de519500eb3675c14eaa5d7bf5aa5706e82e22adc403f6 / blob 6ce0183436b4ba117b11e4ad9469a56c3b2a8672.

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

New: 6060 bytes / SHA256 fa20b5b26a732f20898a49ddbf7559d10b292fadb423e960e97cfe494814fcf4 / blob bbed512ce7a8bd1a547faa229f2c011a50d1d1c4.

```sql
  WHEN 'object' THEN
    current_depth:=d;
    SELECT array_agg(j.key ORDER BY j.key COLLATE "C"),
      array_agg(j.value ORDER BY j.key COLLATE "C"),
      COALESCE(array_agg(
        CASE WHEN j.key ~ '[^ -~]' OR current_depth+1>24 THEN NULL
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
    pending_positions:=array_positions(parts,NULL::text); pending_cursor:=1;
    LOOP
      IF pending_cursor<=cardinality(pending_positions) THEN
        part_index:=pending_positions[pending_cursor];
        IF object_keys[part_index] ~ '[^ -~]' THEN RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601'; END IF;
        e:=object_values[part_index];
        IF current_depth+1>24 THEN RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601'; END IF;
        CASE jsonb_typeof(e)
        WHEN 'object' THEN
          IF retained_object IS NULL THEN descend_object:=true;
          ELSIF (e::text) COLLATE "C" = (retained_object::text) COLLATE "C" THEN
            child_text:=retained_object_canonical; descend_object:=false;
          ELSE descend_object:=true;
          END IF;
          IF descend_object THEN
            child_depth:=current_depth+1;
            IF e IS NULL OR child_depth IS NULL OR child_depth<0 OR child_depth>24 THEN RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601'; END IF;
            SELECT array_agg(j.key ORDER BY j.key COLLATE "C"),
              array_agg(j.value ORDER BY j.key COLLATE "C"),
              COALESCE(array_agg(
                CASE WHEN j.key ~ '[^ -~]' OR child_depth+1>24 THEN NULL
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
              INTO child_keys,child_values,child_parts FROM jsonb_each(e) j;
            child_pending_positions:=array_positions(child_parts,NULL::text);
            IF cardinality(child_pending_positions)=0 THEN
              child_text:='{'||array_to_string(child_parts,',')||'}';
              retained_object:=e; retained_object_canonical:=child_text;
            ELSE
              frame_lengths[stack_level+1]:=cardinality(parts);
              frame_pending_lengths[stack_level+1]:=cardinality(pending_positions);
              frame_cursors[stack_level+1]:=pending_cursor;
              stack_parts:=stack_parts||parts; stack_keys:=stack_keys||object_keys; stack_values:=stack_values||object_values;
              stack_pending:=stack_pending||pending_positions;
              object_keys:=child_keys; object_values:=child_values; parts:=child_parts;
              pending_positions:=child_pending_positions; pending_cursor:=1;
              retained_object:=NULL; retained_object_canonical:=NULL;
              stack_level:=stack_level+1; current_depth:=child_depth;
              CONTINUE;
            END IF;
          END IF;
        WHEN 'array' THEN child_text:=official_v3_jobs_private.canonical_v1(e,current_depth+1);
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
        parts[part_index]:=to_jsonb(object_keys[part_index])::text||':'||child_text; pending_cursor:=pending_cursor+1;
      ELSE
        child_text:='{'||array_to_string(parts,',')||'}';
        IF stack_level=0 THEN RETURN child_text; END IF;
        frame_length:=frame_lengths[stack_level]; pending_length:=frame_pending_lengths[stack_level];
        parent_length:=cardinality(stack_parts)-frame_length; parent_pending_length:=cardinality(stack_pending)-pending_length;
        parts:=stack_parts[parent_length+1:parent_length+frame_length];
        object_keys:=stack_keys[parent_length+1:parent_length+frame_length];
        object_values:=stack_values[parent_length+1:parent_length+frame_length];
        pending_positions:=stack_pending[parent_pending_length+1:parent_pending_length+pending_length];
        pending_cursor:=frame_cursors[stack_level];
        stack_parts:=stack_parts[1:parent_length]; stack_keys:=stack_keys[1:parent_length]; stack_values:=stack_values[1:parent_length];
        stack_pending:=stack_pending[1:parent_pending_length];
        stack_level:=stack_level-1; current_depth:=current_depth-1;
        part_index:=pending_positions[pending_cursor];
        retained_object:=object_values[part_index]; retained_object_canonical:=child_text;
        parts[part_index]:=to_jsonb(object_keys[part_index])::text||':'||child_text; pending_cursor:=pending_cursor+1;
      END IF;
    END LOOP;
```

## Required semantics and source review

Root, same author and independent reviewer have independently reconstructed the full selected file, inverse replacements, aggregate and complete unchanged source boundary. No concrete normal semantic/source blocker remains in their source review; runtime acceptance is still pending. Author must read this complete published amendment and reconfirm the same delivery, without additional adjustment.

The existing root guard and sorted scalar aggregate remain. The root aggregate and new child aggregate are exact original expressions after indentation and variable renaming only. Key-before-depth checks, SQL NULL deferred markers, JSON null text, numeric integrality/range/truncation, escaping, C key ordering, default regex/evaluation collation, raw-text C equality for retained objects, timestamp/calendar callers and all logical refusals remain.

For every uncached object child, perform its original entry guard and aggregate first, then compute pending positions once. Empty pending positions prove the child's successful completion, including empty objects; join its actual parts and update the parent retained pair without suspension. Nonflat children adopt the already-computed typed arrays, reset their retained pair and continue. **No second aggregate on nonflat adoption.** Existing same-parent successful byte-equal reuse is unchanged. Arrays retain their original recursive call and parent memo behavior.

Four typed payload stacks preserve text/JSONB/integer datums and NULL bitmaps, with no JSON frame packing/reparse. The three integer descriptor arrays are written at active level+1 before increasing the level. Only active-level entries are read, so inactive tails are overwritten before reuse and bounded by24 integer slots per array. Payload stacks continue to truncate on pop. Slices restore one-based arrays and exact parent cursor; successful return fills that child's original position, updates the actual retained pair and advances once. Errors do not resume a parent.

The unchanged depth limit bounds suspended object parents to at most24; no new acceptance/admission/refusal cap is introduced. Temporary child arrays add representation/assignment custody and are overwritten by the next uncached preparation. Logical SQLSTATEs, explicit messages and validation order are preserved. **Diagnostic exception context, source locations, peak RSS and resource-failure timing are not asserted identical.** No universal arbitrary-private-input OOM equivalence is claimed.

Pinned PostgreSQL16 source commit **c372fbbd8e911f2412b80a8c39d7079366565d67** supports the mechanism:
- `array_userfuncs.c`, blob **5c4fdcfba4693dcf6d83047806bd62cbe3adfd1d**: typed concatenation, NULL bitmap, once-per-object positions. Repeated forward array_position was rejected because it still iterates skipped prefixes.
- `arrayfuncs.c`, blob **9000f83a8366d5c8943e71e10bad540fefdcfcef**, and `arraysubs.c`, blob **66666fea98ee8f30ac4ceda42b4d3e42e4d587ae**: raw typed copies, one-based nonempty slices and non-NULL empty slices.
- `fmgr.c`, blob **9208c31fe06ad7ee5e1cadfa7eceec32a4f965cf**: non-NULL proconfig adds per-call GUC nesting/application/restoration even for INVOKER; lookup/config metadata is cached.
- `pl_exec.c`, blob **4b76f7699a609dbf071ca711891ebcb34761a4f4**: busy recursive simple expressions can fall back to SPI. No count of such fallbacks or CPU attribution is claimed.

## Complete-path work model and countercosts

This starts after R34's existing savings; those savings are not counted again. It includes both COMPLETE quota traces, expected refusals, current jobs, queue/starts rows and outside-history callers.

| Scope | R34 canonical function entries | Selected entries | Recursive entries removed |
|---|---:|---:|---:|
| Ledger history | 603788 | 202283 | 401505 |
| Ledger outside history | 18394 | 6974 | 11420 |
| Cycles history | 1094436 | 332816 | 761620 |
| Cycles outside history | 21016 | 6520 | 14496 |
| TOTAL | 1737634 | 548593 | 1189041 |

The68.4287% reduction concerns function entries only, not total work or elapsed time. All counted quota documents are object trees/scalars; other array-bearing native groups remain separately required. All previously visited **1682930 object aggregates / 9243141 object-member slots**,54704 scalar roots,116351 queue-history rows and16517 starts-history rows remain. There are493889 external object roots plus1189041 uncached child preparations; no extra child aggregate.

Of1189041 former object descents,646694 complete flat and542347 suspend a parent. New nominal operation sites:2169388 payload concatenations,4338776 payload restore/truncate slices,1627041 indexed descriptor writes — **8135205 array-operation sites**. Four-stack nominal result-element volume **43218116 slots**, not physical allocations/traffic/time. Seven empty stack declarations contribute3840151 declaration initializations over these quota entries. Child-array assignments/retention, guards, joins, second statement-plan site, aggregate states/sorts and temporary copies are additional unmeasured costs. Quota-specific maxima4 suspended frames/30 parent member slots/9 pending slots do not replace the general24-depth contract.

Original job-map work remains:3232985 cumulative prefix entry units and the prior2822395905-byte raw-key payload upper accounting; neither is measured traffic or total allocation. Catalog checks stay520×(11 predecessor+29 companion definitions)=20800 hashes. The4097-byte definition growth adds **2130440 input bytes** across those520 calls. Whole-native catalog count is not established.

History remains quadratic. The strongest compared alternative is this object traversal; outside-only work has just39410 existing entries, and further history subject reuse could remove150954 entries with broader validation-context changes. The two earlier in-memory candidates (b5fca4fb… and bf49e5a…) were unselected, never published or executed. The exact selected158670-byte source contains both descriptor refinement and flat-child completion.

**No parser/project/SQL/native execution or measured speedup has occurred for this correction. Runtime margin remains unverified.**

## Coverage, publication and unchanged gates

Native/fixtures are frozen. Existing R19 scalar/key/order/depth/NULL, R20 numeric/time, R21 escaping, R26 retained-object, N02/U04 maximum-valid wire/node, mixed-history, fullquota, race and rollback witnesses remain mandatory. There is no new dedicated exhaustive24-frame/stale-descriptor/fanout oracle. Prior cache-cap/alternating-subject/malformed-persisted-envelope coverage limitations remain. No proof omission or weakened requirement is authorized.

Root may prepare exactly10 paths: this SQL, the existing current marker blocks in START/ACTIVE/ROADMAP/JETNITY_HANDOFF/ARCHITECTURE, existing M04_HANDOFF_V1, and three new records **M04_RECOVERY_TASK_V26.md**, **M04_RECOVERY_ROOT_REVIEW_V26.md**, **M04_RECOVERY_R35_EVIDENCE_V26.json** under docs/official-truth-product-v3. Preserve all central bytes outside their existing markers, full historical handoff/evidence, all27 failure observations and genuine R21/R29 PR successes. The complete terminal R34 failure27 and all companion receipts/log pins must be included. No other source changes.

After immutable file/tree/full-diff/source readback and fresh live main/head/merge-base/review/rules/mode/Owner gates, Root may publish the reviewed new-source child of exact212e with an expected-head, nonforce ref update. This triggers the existing CI. Any changed head invalidates prior acceptance. No unchanged-head rerun or speculative source head.

R34 remains terminal FAILURE27: CI42918105407/#4095/attempt1;24/31 groups completed, full ledgerPASS,52STARTs, cycle_enqueue240s timeout. Next unacknowledged ENQUEUE outcome UNKNOWN;64/65, inherited761/minOwned4182 and later groups NOT_REACHED. Its actual complete result, cleanup and all companions remain in V26v1. A READY Preview does not close this failure.

Every new head requires all8jobs,31nativegroups,both real R9 waits,254/255/256,64/65,inherited761/minOwned4182,finalrollback/latewriter,complete drain,actual mountedLifecycle,Core,5hygienechecks,Build andExactPreview. Only full independent Root acceptance permits TL-PASS/Ready/expected-head merge. Actual merged main then requires its OWN fullCI/native and exactREADYProduction through bothjetnity.com andjetnity-app.vercel.app.

All V26v1 execution stops and bounds remain binding:240s effects+60s cleanup/300s total;4outerlanes/4nativeperfamily;8activeNative/256total/16terminalreserved;8callbacks/128total;30souter/5schild;3clusters/2children/40aggregateworkconnections/2M04observers/1methodobserver/16fixtureconnectionspercluster. No local checkout/project/parser/SQL/native/socket/build/test execution, installation/download/binaries/clone/replacementenvironment/gitfetch/push. Only immutable connector reads and pure in-session text/data analysis, plus Root GitData publication. Before every permitted non-Auth CI log read, Root personally reads terminal job metadata; Auth logs remain forbidden.

No hosted DB/Auth/RLS/ACL/migration/credential/provider/research/scheduler/notification/newcost/public activation. SQLUNAPPLIED;MethodNOT_APPROVED;#1139NOT_RELEASE_READY with17preOwnergaps;#1131ReadySTOP,both#1135holds,#968targetisolation,#911/#913privacy. Concreteclient/SSR/Authbinding unproved. #917UNKNOWN/Stage2NOT_ATTEMPTED: no retry/rephrase/delegation/reroute/transportswitch/humanSQLsubstitute.

Mandatory separate8-path documentation closure remains HELD until genuine corrected actual-mainPASS; then ownDraft/fullPR/main/native/Productiongates and finalreceipts onexistingPR/#751, finiteSTOP, noautomaticnextproduct slice. D1#1169 remains separately unfinished.

**Author STOP after reading this binding amendment and confirming the exact delivery.** Immediate review fixes remain with this same author/session; no author publication, Ready, merge or follow-up slice.

