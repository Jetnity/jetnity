# M04 R34 — Recovery Task V25

The binding implementation scope is **V25 v2** below. The complete initial V25 v1 investigation and R33 failure26 receipt follow verbatim. Later exact-head live receipts take precedence over these dated pre-publication statements. No runtime PASS, Ready or merge is asserted.

## Current binding V25 v2 — original comment retained

# Binding R34 / Recovery Task V25 v2 — selected exact implementation

**Technical Lead selection, 2026-11-10 22:37:22 UTC.** This amendment follows the complete [R33 FAILURE26 receipt and V25 v1 investigation](https://github.com/Jetnity/jetnity/pull/1183#issuecomment-6780703035). R33 remains failed. This source selection is **not runtime PASS, TL-PASS, Ready or merge**.

Root and the independent source reviewer **/root/m04_recovery_source_review_g3** have reconstructed and reviewed the exact same six-span proposal. Neither finds a concrete source blocker. The actual author remains **Jetnity Official Truth V3 Durable Jobs1 — Codex Generation3**, same session **/root/m04_durable_jobs_writer_g3**. The author must read this complete amendment and reconfirm this exact delivery in the same session. Root alone publishes, sets Ready or merges.

## Exact scope and identities

Baseline [SQL at R33](https://github.com/Jetnity/jetnity/blob/8dbc0cf669a60701a4f028027343587da7ce6da3/scripts/db/official-truth-v3-durable-jobs-1/jobs-candidate.sql):

- Head **8dbc0cf669a60701a4f028027343587da7ce6da3**, tree **6273933154bb6ceb705110573ed53626c254b828**.
- SQL **147856 bytes / SHA256 e0bb8eded96ad53737228e1d4e824057abc2cadf73ee08267c3a9011aee02ae8 / blob 6465147678a3024748f98ad151b63bc412ccc6c4**.
- Main and merge-base **e7aae86c18238033c2186722e24c84dc7a5f69b9**; current PR#1183 Draft/unmerged,4ahead/0behind,20cumulative paths. Root reread these and NORMAL at22:35:23UTC.

**Selected final SQL: 154573 bytes / SHA256 714d766795a2cd9362f0fe243948b628e84cab307ec34306c15573b5c1ac64c8 / blob f1ec4f9fba367df695646e9817a5e567cf4fe63d. Net +6717 bytes.**

Only the body of **assert_history_v1** changes. All29 declaration/attribute pairs, the other28 complete function blocks and all bytes outside this function remain identical. The standalone command, job, subject, transition and canonical helpers are unchanged.

All other17 M04 source files stay frozen. Native191098bytes/SHA256f5d849c643ff22d264bc9adc1a7cd65f12caaac80a804647604851f22effbde0; rollback6175bytes/SHA2569b9089d74242a802455cc7e3fb8a0a8515c17b61b45ae730b9bbba1adb650a66.

Selected 18-source aggregate: **5bdd3fd5e92194b0936fc3f25e4e27eeeb9141578270b6419ae90ab8194342e1**. Format remains sorted-path concatenation of SHA256 SPACE decimalBytes SPACE repositoryPath LF. Baseline aggregate d70a20d3b3881b56fb7274d3b30089e56e33081f2cb95deb7528b585540f4c76.

## Exact six-span implementation

Use literal-safe callback replacement, preserving all other bytes. Reverse replacement of the six new spans restores the complete baseline. No additional source adjustment is selected.

### Replacement 1: history declarations

Original span: 188 UTF-8 bytes, SHA256 `02c07bff6f300a7d8b63885f961a0602876de93e2c7370c4fa7af3e21b696bcd`. Replacement: 460 bytes, SHA256 `8596ed0260f4ce194859dfa890ff0487b294ba72f1b26a3033ac109b6d06eec9`. Both spans exclude their following LF and are unique in the complete file.

Original:

```sql
DECLARE s official_v3_jobs_private.subjects_v1%ROWTYPE; x record; c jsonb; e jsonb; unresolved text[]; ops integer; starts integer; credit jsonb; envelope_canonical text COLLATE "default";
```

Exact replacement:

```sql
DECLARE s official_v3_jobs_private.subjects_v1%ROWTYPE; x record; c jsonb; e jsonb; unresolved text[]; ops integer; starts integer; credit jsonb; envelope_canonical text COLLATE "default";
  validated_jobs jsonb:='{}'::jsonb; validated_job_count integer:=0; validated_job_bytes integer:=0; job_text text COLLATE "C"; job_bytes integer;
  memo_subject_kind text COLLATE "C"; memo_subject_text text COLLATE "C"; memo_subject_result jsonb; command_identity jsonb;
```

### Replacement 2: validated current-job seed

Original span: 57 UTF-8 bytes, SHA256 `02297574b4f81fa76039d77e7d729c9a252c8ef0580a7d85b596de5e658491de`. Replacement: 275 bytes, SHA256 `b4c5765ec05db9d7030ddba2e65246e33f1ed2701966c07d61068a9862f3cbf7`. Both spans exclude their following LF and are unique in the complete file.

Original:

```sql
  PERFORM official_v3_jobs_private.job_v1(s.current_job);
```

Exact replacement:

```sql
  PERFORM official_v3_jobs_private.job_v1(s.current_job);
  job_text:=s.current_job::text; job_bytes:=octet_length(job_text);
  IF job_bytes<=1048576 THEN
    validated_jobs:=jsonb_build_object(job_text,true); validated_job_count:=1; validated_job_bytes:=job_bytes;
  END IF;
```

### Replacement 3: command body and subject memo

Original span: 93 UTF-8 bytes, SHA256 `10706aa8e1e1dd9472aa55c6b0bce9bd06e4bb1f5f9bf7958d9a01944abaeb33`. Replacement: 5418 bytes, SHA256 `40c430f70db21ab33c14f3ce07e618b26cda81b35e343dbb4355df364b590f45`. Both spans exclude their following LF and are unique in the complete file.

Original:

```sql
    c:=official_v3_jobs_private.command_v1(x.command_text::jsonb); e:=x.envelope_text::jsonb;
```

Exact replacement:

```sql
    command_identity:=NULL;
    DECLARE v jsonb:=x.command_text::jsonb;
      a text COLLATE "default":=v->>'action'; k text COLLATE "default":=v->>'kind'; i jsonb:=v->'input'; identity jsonb; jkey text COLLATE "default"; f jsonb; t text COLLATE "default";
      subject_input jsonb; subject_input_text text COLLATE "C"; subject_bytes integer;
    BEGIN
      IF v IS NULL THEN RAISE EXCEPTION 'm04 invalid command' USING ERRCODE='P7601'; END IF;
      t:=official_v3_jobs_private.canonical_v1(v,0);
      IF octet_length(t)>65536
        OR official_v3_jobs_private.exact_keys_v1(v,CASE WHEN a IN ('enqueue','complete') THEN ARRAY['action','kind','input'] ELSE ARRAY['action','input'] END) IS NOT TRUE
        OR (a IN ('enqueue','claim','complete','fail')) IS NOT TRUE OR (i->>'operationId' ~ '^op3_[a-f0-9]{32}$') IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid command' USING ERRCODE='P7601'; END IF;
      IF a='enqueue' THEN
        IF k='rule_research' THEN
          IF official_v3_jobs_private.exact_keys_v1(i,ARRAY['context','method','factKind','researchReason','operationId','jobId','attemptLimit']) IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid enqueue' USING ERRCODE='P7601'; END IF;
        ELSIF k='combination_discovery' THEN
          IF official_v3_jobs_private.exact_keys_v1(i,ARRAY['destinationCountryCode','citizenshipCountryCode','method','operationId','jobId','attemptLimit']) IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid enqueue' USING ERRCODE='P7601'; END IF;
        ELSE RAISE EXCEPTION 'm04 invalid enqueue' USING ERRCODE='P7601'; END IF;
        IF (i->>'jobId' ~ '^job3_[a-f0-9]{32}$') IS NOT TRUE OR jsonb_typeof(i->'attemptLimit') IS DISTINCT FROM 'number'
          OR (i->>'attemptLimit' ~ '^[1-9][0-9]?$') IS NOT TRUE OR (i->>'attemptLimit')::integer NOT BETWEEN 1 AND 16 THEN RAISE EXCEPTION 'm04 invalid enqueue' USING ERRCODE='P7601'; END IF;
        subject_input:=i-'operationId'-'jobId'-'attemptLimit'; subject_input_text:=subject_input::text;
        IF memo_subject_kind COLLATE "C" = k COLLATE "C" AND memo_subject_text COLLATE "C" = subject_input_text COLLATE "C" THEN
          identity:=memo_subject_result;
        ELSE
          identity:=official_v3_jobs_private.subject_v1(k,subject_input);
          subject_bytes:=octet_length(k)+octet_length(subject_input_text);
          IF subject_bytes<=1048576 AND octet_length(identity::text)<=1048576-subject_bytes THEN
            memo_subject_kind:=k; memo_subject_text:=subject_input_text; memo_subject_result:=identity;
          END IF;
        END IF;
        jkey:=identity->>'jobKey';
      ELSE
        jkey:=i->>'jobKey';
        IF (jkey ~ '^(research-job|combination-discovery-job):v3:[a-f0-9]{64}$') IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid locator' USING ERRCODE='P7601'; END IF;
        IF a='claim' THEN
          IF official_v3_jobs_private.exact_keys_v1(i,ARRAY['operationId','jobKey','leaseId','leaseMilliseconds']) IS NOT TRUE
            OR (i->>'leaseId' ~ '^lease3_[a-f0-9]{32}$') IS NOT TRUE OR jsonb_typeof(i->'leaseMilliseconds') IS DISTINCT FROM 'number'
            OR (i->>'leaseMilliseconds' ~ '^[1-9][0-9]{0,5}$') IS NOT TRUE OR (i->>'leaseMilliseconds')::integer>900000 THEN RAISE EXCEPTION 'm04 invalid claim' USING ERRCODE='P7601'; END IF;
        ELSE
          f:=i->'fence';
          IF official_v3_jobs_private.exact_keys_v1(f,ARRAY['jobId','revision','leaseId','generation']) IS NOT TRUE
            OR (f->>'jobId' ~ '^job3_[a-f0-9]{32}$') IS NOT TRUE OR (f->>'leaseId' ~ '^lease3_[a-f0-9]{32}$') IS NOT TRUE
            OR jsonb_typeof(f->'revision') IS DISTINCT FROM 'number' OR (f->>'revision' ~ '^[1-9][0-9]{0,9}$') IS NOT TRUE OR (f->>'revision')::numeric>2147483647
            OR jsonb_typeof(f->'generation') IS DISTINCT FROM 'number' OR (f->>'generation' ~ '^[1-9][0-9]{0,9}$') IS NOT TRUE OR (f->>'generation')::numeric>2147483647 THEN RAISE EXCEPTION 'm04 invalid fence' USING ERRCODE='P7601'; END IF;
          IF a='complete' THEN
            IF (k IN ('rule_research','combination_discovery')) IS NOT TRUE OR (k='rule_research')<>(jkey LIKE 'research-job:%')
              OR official_v3_jobs_private.exact_keys_v1(i,CASE WHEN k='rule_research' THEN ARRAY['operationId','jobKey','fence','decisionRef'] ELSE ARRAY['operationId','jobKey','fence','discoveryRef'] END) IS NOT TRUE
              OR (COALESCE(i->>'decisionRef',i->>'discoveryRef') ~ CASE WHEN k='rule_research' THEN '^source-decision:v3:[a-f0-9]{64}$' ELSE '^combination-discovery-result:v3:[a-f0-9]{64}$' END) IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid completion' USING ERRCODE='P7601'; END IF;
          ELSE
            IF official_v3_jobs_private.exact_keys_v1(i,ARRAY['operationId','jobKey','fence','reason']) IS NOT TRUE
              OR (i->>'reason' IN ('unreachable','invalid_proposal','verification_unavailable','commit_unconfirmed')) IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid failure' USING ERRCODE='P7601'; END IF;
          END IF;
        END IF;
        k:=CASE WHEN jkey LIKE 'research-job:%' THEN 'rule_research' ELSE 'combination_discovery' END;
      END IF;
      c:=jsonb_build_object('value',v,'commandText',t,'commandKey','queue-command:v3:'||encode(sha256(convert_to(t,'UTF8')),'hex'),
        'operationId',i->'operationId','jobKey',jkey,'subjectText',identity->'subjectText','action',a,'kind',k);
      command_identity:=identity;
    END;
    e:=x.envelope_text::jsonb;
```

### Replacement 4: expected-job successful reuse

Original span: 66 UTF-8 bytes, SHA256 `fb424392c5d3cd1f728f79f89a5100c50aa8a407b22f4c1e73bc460b60de4608`. Replacement: 574 bytes, SHA256 `caba063623baf2e609f068fb4ac7cedf4919f0b93a8daefae7037d700044ff90`. Both spans exclude their following LF and are unique in the complete file.

Original:

```sql
        expected:=official_v3_jobs_private.job_v1(current_record);
```

Exact replacement:

```sql
        job_text:=current_record::text;
        IF job_text IS NULL OR (validated_jobs ? job_text) IS NOT TRUE THEN
          expected:=official_v3_jobs_private.job_v1(current_record);
          job_bytes:=octet_length(job_text);
          IF validated_job_count<256 AND job_bytes<=1048576-validated_job_bytes THEN
            validated_jobs:=validated_jobs||jsonb_build_object(job_text,true);
            validated_job_count:=validated_job_count+1; validated_job_bytes:=validated_job_bytes+job_bytes;
          END IF;
        ELSE expected:=current_record;
        END IF;
```

### Replacement 5: same-row transition subject result

Original span: 113 UTF-8 bytes, SHA256 `ed2c459e851be57ee36a0b5360c0a33fb3940fa2da74675e8c81f675ca1cee81`. Replacement: 37 bytes, SHA256 `4bd601c1002a85f7de1003294a6e501d97eadc3942ee24f2fdf2ea6b4520e741`. Both spans exclude their following LF and are unique in the complete file.

Original:

```sql
          identity:=official_v3_jobs_private.subject_v1(command->>'kind',i-'operationId'-'jobId'-'attemptLimit');
```

Exact replacement:

```sql
          identity:=command_identity;
```

### Replacement 6: next-job successful reuse

Original span: 97 UTF-8 bytes, SHA256 `4c88b40f81fcc63aa7e951aab139f516cb00b165aca006cc6b90ac13c4efe3a0`. Replacement: 567 bytes, SHA256 `fa1df8b50bb45cf222823b5e65f2951ed8601498da128bcd512cc3aa71712b78`. Both spans exclude their following LF and are unique in the complete file.

Original:

```sql
      IF kind IS DISTINCT FROM 'deduplicated' THEN n:=official_v3_jobs_private.job_v1(n); END IF;
```

Exact replacement:

```sql
      IF kind IS DISTINCT FROM 'deduplicated' THEN
        job_text:=n::text;
        IF job_text IS NULL OR (validated_jobs ? job_text) IS NOT TRUE THEN
          n:=official_v3_jobs_private.job_v1(n);
          job_bytes:=octet_length(job_text);
          IF validated_job_count<256 AND job_bytes<=1048576-validated_job_bytes THEN
            validated_jobs:=validated_jobs||jsonb_build_object(job_text,true);
            validated_job_count:=validated_job_count+1; validated_job_bytes:=validated_job_bytes+job_bytes;
          END IF;
        END IF;
      END IF;
```

## Semantic obligations independently checked

The job map is a local JSONB object whose keys are the **complete raw job JSONB text** and whose values are true. Entries are admitted only after the original job_v1 successfully validates that input. Current-job validation remains unconditional and precedes serialization. NULL and absent keys explicitly miss; JSON null cannot be a successfully admitted job. Hits reuse the present input because job_v1 returns that input unchanged. No stored digest, canonical assertion or JSONB numeric equality is substituted for byte identity.

PostgreSQL's pinned [jsonb_op.c](https://github.com/postgres/postgres/blob/c372fbbd8e911f2412b80a8c39d7079366565d67/src/backend/utils/adt/jsonb_op.c) and [jsonb_util.c](https://github.com/postgres/postgres/blob/c372fbbd8e911f2412b80a8c39d7079366565d67/src/backend/utils/adt/jsonb_util.c) establish top-level object lookup by full key length and memcmp. Root and reviewer read these primary sources independently.

Admission caps of256entries and1048576raw-key bytes affect reuse only. Misses still run the original validator; exhausted admission never adds an input refusal. No cache survives the current assert_history invocation and no ordering assumption is made about its SQL row iteration.

Subject reuse compares the complete actual kind and full raw subject input, including researchReason, under explicit C equality. An uninitialized/NULL memo misses. The retained result is the actual successful subject_v1 result. The singleton admits only when kind+input-text+result-text bytes fit1MiB; a cold successful result remains usable even when not admitted.

The copied command block initializes all original locals in their original order. Its four text locals a/k/jkey/t explicitly retain the original default collation. Only the subject-call span and RETURN→c assignment differ; reversing them restores all40 original command statement lines exactly. command_identity resets on every row, then retains that row's actual identity. The new-enqueue transition consumes the same kind and same stripped input already validated by this command. Non-enqueue rows cannot leak a prior identity.

Original search path and supported-call security context, all per-row journal/timestamp/envelope/transition checks, full starts/disposition/credit/slot checks, catalog/authority reads and transaction/effect/rollback boundaries remain. No later FOUND dependency is introduced. SQL diagnostic context and allocation-failure timing may differ; arbitrary OOM-order or peak-RSS equivalence is not claimed.

## Full successful-trace work and countercost model

The model covers both **complete** quota proofs, including expected refusals, not merely R33's reached prefix. It is static source arithmetic, not server profiling, measured speedup or a240-second guarantee.

| History work | Ledger | Cycles | Combined |
|---|---:|---:|---:|
| Completed history bodies |515|514|1029|
| Queue history rows still examined |66557|49794|116351|
| Starts history rows still examined |5|16512|16517|
| Full job validations before |67081|99588|166669|
| Full job validations after |524|49794|50318|
| Full job validations removed |66557|49794|116351|
| HISTORY canonical entries before |1202781|1508918|2711699|
| HISTORY canonical entries after |603788|1094436|1698224|

The separate pointer-invariant refusal adds one history invocation that fails before current-job and loop validation. Thus1030 invocations,1029 completed bodies.

Additional subject calls removed outside skipped job bodies:99574. Including subjects inside skipped jobs:215925 subject bodies removed. Exact-key calls removed:681199. HISTORY nodes_v1 visits:533301→167601. HISTORY canonical reduction:1013475. Remaining HISTORY canonical work includes332406 command,762655 envelope,116351 audit,167601 distinct-job own,154041 subject and165170 starts entries.

**Unchanged outside-history work:**520 fixed API calls =452queueCAS +65executionSTART +3queueREAD;1871command_v1 calls,903standalone transition calls,1425job_v1 calls,3357subject_v1 calls and39410 expanded canonical entries. Including these entries, the complete-quota canonical model is **2751109→1737634**. JSON parsing, duplicate-key/node checks, client serialization, locks, deadlines, MA1 and other noncanonical work remain additional. Installation and the other29 native groups are not part of this quota model.

Every one of the520 quota API calls reaches the unchanged catalog checker. Its11 predecessor+29companion definition fingerprints produce20800 definition hashes. The changed history body is hashed520times, so +6717source bytes add **3492840 definition-input bytes**, plus retrieval/conversion/copy/JSON work. This is not a full-native catalog-call count; other groups and setup add work, and drift failures may exit early. No authority work is cached or omitted.

The native full histories have at most3 distinct successful jobs per ledger invocation and193 per cycle invocation, independent of row order. Immutable fixture and SQL shape give a conservative873-byte raw quota-job bound; the simpler4096-byte bound also suffices. The Discovery key is **93 characters:29prefix+64digest**, not91. Thus193×4096=790528raw-key bytes fits both admission caps. This is a fixture-specific bound; larger nonquota inputs still use full fallback validation.

A final true-valued job-map datum is bounded by **1048576 +8×256 +8 =1050632 bytes** from raw string keys, two4-byte JEntries per key and headers. This is not peak memory: concatenation rebuilds/sorts maps and creates transient representations. Across the full histories, resulting-map entry-prefix totals are535ledger+3232450cycles=3232985. With the873-byte fixture bound, the sum of raw-key payloads in those result prefixes is at most2822395905bytes; descriptors, sorting and other copies are extra. This is not measured traffic, total allocations or RSS. Subject1MiB text admission likewise is not a total memory bound. Cold/distinct/oversized values may gain little or incur extra serialization/lookup cost.

## Coverage, execution and completion

No new dedicated cache-cap/exhaustion, alternating-subject-cache or malformed-persisted-envelope oracle is introduced. These coverage limits are explicit; existing fixed canonical/type/numeric/ordering/depth cases, both-kind mixed histories, full quotas, negative transitions, races, rollback and **all31 native groups** remain mandatory. No fixture-tampering mechanism is authorized.

This selects exactly the SQL body above. Root may add the same bounded nine continuity/evidence files: five current entry blocks, the M04 handoff, and new V25 task/review/R34-evidence records. Preserve all outside-marker bytes, all prior evidence and the complete previous handoff. No second product change.

No local checkout/parser/SQL/native/socket/build/test execution, installs/downloads/binaries/clone/replacement environment. Only permitted immutable source reads, pure text analysis and Root Git Data publication; actual project execution remains the existing CI triggered by the reviewed new head. No Auth logs, hosted DB/Auth/RLS/ACL/migration/credential/provider actions, real research, scheduler/public/paid activation, unchanged-head rerun, native/fixture/workflow/budget change or proof reduction.

All31 groups,254/255/256ledger,64/65cycles,inherited761/minOwned4182,both real R9 waits,final rollback/latewriter and full drain remain required within original240s effect+60s cleanup/300s total and all existing resource limits. All8jobs,actual mounted Lifecycle,Core,five hygiene checks,Build,Preview and fresh main/head/diff/review/rules/mode/Owner gates are required before any Root TL-PASS/Ready/expected-head merge. Actual new main then needs its own full CI/native/Production and both aliases.

Mandatory separate8-path documentation completion remains **HELD until genuine corrected actual-main PASS**, then its own complete PR/main/Production gates and final existingPR/#751receipts. Finite STOP; no automatic following product slice. D1#1169 remains separately unfinished.

SQL UNAPPLIED; Method NOT_APPROVED; #1139 NOT_RELEASE_READY with17preOwnergaps. #1131ReadySTOP,both#1135holds,#968target isolation,#911/#913privacy remain. Concrete client/SSR/Auth target binding remains unproved. #917 UNKNOWN / Stage2NOT_ATTEMPTED; no retry/rephrase/delegation/reroute/transport switch/humanSQL substitute.


## Initial V25 v1 and full terminal failure26 — original comment retained

# CHANGES REQUIRED — M04 R34 / Recovery Task V25 v1

**Root terminal R33 receipt and binding same-session source investigation. 2026-11-10 22:13:20 UTC.**

R33's [CI42909298535 / #4094 / attempt1](https://github.com/Jetnity/jetnity/actions/runs/42909298535) is completed **FAILURE**, updated **2026-11-10T22:09:49Z**. All eight jobs are terminal. Root personally read terminal job metadata before each of the seven permitted complete non-Auth logs. Independent CI reviewer **/root/m04_recovery_live_audit_g3** confirms every full-log pin and the full native receipt. **No Auth logs were read.**

PR#1183 stays **OPEN / DRAFT / UNMERGED** at **8dbc0cf669a60701a4f028027343587da7ce6da3**, tree **6273933154bb6ceb705110573ed53626c254b828**. Main/merge-base **e7aae86c18238033c2186722e24c84dc7a5f69b9**, 4ahead/0behind,20cumulativepaths. Synthetic checkout **4870031c1892c96fa8850ac375dd7cef80badd2d** has ordered parents [e7aae86…,8dbc0cf…] and exactly the source tree. Root reread main/head/Draft and mode **NORMAL** immediately before this instruction. No Ready, merge or unchanged-head rerun.

## 1. Failure observation 26 — complete evidence, no green substitution

Exact error: **M04 240s effect budget exceeded**, native.ts457:52, parent AggregateError2184:41. **24/31 groups**. First23 including N02, maximum-node/worst-valid-wire and both real R9 waits total **104224ms**. Full254/255/256ledger group **PASS118316ms**,258/258 command calls,256 acknowledged commits,260/260 fixed calls,oneSTART.

Group25/N05 fails at **cycle_claim**: zero-based lastStartedIndex20/lastCompletedIndex19,62/61 command calls,**61 acknowledged command commits**,20STARTreservations,83/82fixedcalls. The next unacknowledged CLAIM's database outcome stays **UNKNOWN**. Complete64/65cycles, inherited761/minOwned4182 and groups26–31 are **NOT_REACHED**.

Native240417ms including43mscleanup;27153/27153operationssettled,4242/4242connectionsclosed,oneclusterstopped,zerochildren/pending/cleanupfailures. Cleanup cannot replace missing proofs. Both real R9 waits preserve observed SQL blockage, delivered abort, drained retained executor, backend absence while executor held, zero terminal effects,3held/0completed methods and unavailable→invalid slot transition; timeoutworker_only/failConfirmtrue and callerabortunconfirmed/failConfirmfalse,45/44nativeadmissions.

Core **8697 tests /8693PASS /2FAIL /2existing skips /0cancelled /971suites**,838963.100689ms. Typecheck/LintPASS; allfivehygienechecks andProductionBuildSKIPPED. Skips remain unrelated T09/sharedWorkspace browser and optional SHARED_LAYOUT_AUDIT_BASE. The two failures are N05 and its parentM04test.

| Job | ID | Terminal result |
|---|---:|---|
| Persisted canonical read — native | 130155402003 | SUCCESS |
| Accepted store trip integration — native (store) | 130155402339 | SUCCESS |
| Atomic version refresh — native | 130155402403 | SUCCESS |
| Auth-Konfiguration gegen config.toml | 130155402457 | SUCCESS — metadata only |
| Repository verification | 130155402603 | FAILURE |
| Official truth V3 — isolated UI | 130155402607 | SUCCESS |
| Accepted store trip integration — native (lifecycle) | 130155402629 | SUCCESS |
| Typecheck, Lint & Build | 130164513703 | FAILURE |

All six companions succeed. Persisted1/1,95events/45readerresults,320947.399096ms. Store4/4,39events,365096.423622ms,2266/2266and1574/1574settled,444/444and296/296closed. Lifecycle4/4,29events,632800.902095ms; actualmountedWorkspace13proofs,61/61observerssettled,0pending/retained/errors; bundle76f5a82c5beb4f8b607c9ff1b074b830f1b4fc188a389d2922cc33fbb6b33cb9; finalclosures581/581and6209/6209operations,90/90and476/476connections. Atomic1/1,151events,30negativecompleterollbacks,10coordinatoroutcomes,767956.253614ms;9991/9991settled,248/248closed,11clusters,0pending,parentAbortedfalse,reserve432797ms. UI50/50,sixHTTPcases,12layouts/11interactions/10screenshots; artifact13807060744,15files,3740083bytes,digest42e844a586fe72ec6523e47ce257c555c092f1eb1677598f2e7397737d825603. Exactsource/synthetic/run/attemptbinding,dirtyfalse. Archive not downloaded/visually inspected. Synthetic/isolated boundaries remain; no hosted/ProductionSLO claim.

| Complete non-Auth log | UTF-8 bytes | SHA256 |
|---|---:|---|
| repository | 4258576 | `9306c70037ed8a779bb6f8d04f06dfda6cb44d74471fa9f9066b750af8bd5f55` |
| persisted | 157288 | `25b610cae137fb4e4b2145c081ad5780a22c44782ef714006548b536178d3f10` |
| lifecycle | 177393 | `036564f1e98635262b6a60fb27ec50c790ad87e3aa95f184b84d6ae3cca4896e` |
| store | 136041 | `5944f9c87bef846a56f0e9425e4dd9a8939456446a18b44631534fbf78cef405` |
| atomic | 184218 | `002857f1aebfc38a7d915c986bf892dd8be8640dc088ceda60ecbbd500b0cfce` |
| ui | 141945 | `3b265c327a841225b7e2c51b2ebde89ddde4e0c31575e879c3462c553959992a` |
| aggregate | 3983 | `ebb95312959826e53924e26dd4eacf9650dd093a260aff04061de77f77c34a0a` |

Full compact native receipt: **3809bytes / SHA256d6d0a342be5327f847545d65aa796d487f24e7db8e396d90f49719c39d6303a0**, without finalLF.

```json
{"schema":"jetnity.m04.native.v1","candidateSha256":"e0bb8eded96ad53737228e1d4e824057abc2cadf73ee08267c3a9011aee02ae8","rollbackSha256":"9b9089d74242a802455cc7e3fb8a0a8515c17b61b45ae730b9bbba1adb650a66","executed":true,"effectAndCleanupMilliseconds":240417,"cleanupMilliseconds":43,"clusters":1,"childProcesses":0,"lifetime":{"started":27153,"settled":27153,"pending":0,"connections":4242,"closed":4242,"stoppedClusters":1},"groups":[{"id":"N01","milliseconds":30},{"id":"N02","milliseconds":2175},{"id":"N03","milliseconds":3171},{"id":"N07","milliseconds":10858},{"id":"N07/R4","milliseconds":909},{"id":"N08","milliseconds":13230},{"id":"N08/U04","milliseconds":4440},{"id":"N02/U04","milliseconds":1593},{"id":"N04/N06","milliseconds":3858},{"id":"N04/N06/N10","milliseconds":3895},{"id":"N05/N09","milliseconds":3147},{"id":"N09","milliseconds":19584},{"id":"N10/U06","milliseconds":6996},{"id":"N11","milliseconds":2182},{"id":"N11","milliseconds":180},{"id":"N12","milliseconds":192},{"id":"N04/N10/N12","milliseconds":5783},{"id":"N12/U06/R9","milliseconds":14282},{"id":"N12/R7-03","milliseconds":522},{"id":"N11","milliseconds":3102},{"id":"N11","milliseconds":325},{"id":"N11","milliseconds":330},{"id":"N13","milliseconds":3440},{"id":"N05/A03","milliseconds":118316}],"nestedRaceWitnesses":[{"boundary":"i1_timeout","operation":"reserve_v1","target":{"pid":"25719","birth":"2026-11-10 22:04:56.719256+00"},"control":{"pid":"25717","birth":"2026-11-10 22:04:56.714139+00"},"holder":{"pid":"25236","birth":"2026-11-10 22:04:52.582907+00"},"realSqlWaitObserved":true,"abortDelivered":true,"retainedExecutorDrained":true,"backendAbsentWhileExecutorHeld":true,"failConfirmObserved":true,"terminalEffects":0,"beforeDrainSlot":"unavailable","afterDrainSlot":"invalid","heldMethods":3,"completedMethods":0,"outwardStatus":"worker_only","nativeAdmissionsAfterDrain":45},{"boundary":"worker_caller_abort","operation":"reserve_v1","target":{"pid":"26347","birth":"2026-11-10 22:05:06.194395+00"},"control":{"pid":"26346","birth":"2026-11-10 22:05:06.1821+00"},"holder":{"pid":"26024","birth":"2026-11-10 22:05:01.808668+00"},"realSqlWaitObserved":true,"abortDelivered":true,"retainedExecutorDrained":true,"backendAbsentWhileExecutorHeld":true,"failConfirmObserved":false,"terminalEffects":0,"beforeDrainSlot":"unavailable","afterDrainSlot":"invalid","heldMethods":3,"completedMethods":0,"outwardStatus":"unconfirmed","nativeAdmissionsAfterDrain":44}],"quotaProgress":{"currentGroup":"N05","boundary":"cycle_claim","indexBase":0,"millisecondsCap":300000,"timingMeaning":"client await durations including construction/transport; not server statement profiling","ledger":{"lastStartedIndex":253,"lastCompletedIndex":253,"commandRequestsStarted":258,"commandRequestsCompleted":258,"commandRequestMilliseconds":525,"fixedCallsStarted":260,"fixedCallsCompleted":260,"fixedCallMilliseconds":117943,"commandCallsStarted":258,"commandCallsCompleted":258,"commandCommits":256,"startCallsStarted":1,"startCallsCompleted":1,"startReservations":1},"cycles":{"lastStartedIndex":20,"lastCompletedIndex":19,"commandRequestsStarted":62,"commandRequestsCompleted":62,"commandRequestMilliseconds":122,"fixedCallsStarted":83,"fixedCallsCompleted":82,"fixedCallMilliseconds":16929,"commandCallsStarted":62,"commandCallsCompleted":61,"commandCommits":61,"startCallsStarted":20,"startCallsCompleted":20,"startReservations":20}},"connections":{"aggregateWorkConnectionBound":40,"maximumJobs":4,"maximumIntake":1,"maximumMethod":2,"m04ObserverLimit":2,"maximumM04Observers":2,"methodObserverLimit":1,"fixturePerClusterLimit":16,"inheritedCommitGuardPairs":0,"minimumOwned":0},"failure":{"phase":"proof_25:N05","error":{"kind":"fixture","code":"unclassified_failure"}},"cleanupFailures":[],"cleanupFailureCount":0,"nativePass":false}
```

All25previous failed observations and genuine R21/R29PRsuccesses remain preserved. Differences in runner durations and reached cycle indices are **not a causal speedup measurement**. R33's source work model remains a HISTORY-only operation count, not server profiling or a whole-native time estimate.

## 2. Binding V25 v1 source-investigation scope

**Same author:** Jetnity Official Truth V3 Durable Jobs1 — Codex Generation3, actual session **/root/m04_durable_jobs_writer_g3**. **Independent reviewer:** **/root/m04_recovery_source_review_g3**. Root alone selects and publishes a subsequent concrete implementation, sets TL-PASS/Ready or merges.

The source-bound R33 pair was insufficient in actual CI. Investigate a **materially sufficient, bounded SQL-body correction** that addresses the remaining cost of **both complete ledger and64/65cycle histories**, including current-job and starts-history traversal. Do not select another small helper adjustment solely because its local operation count decreases.

This version authorizes **read-only source investigation and exact in-memory proposals only**. No publication or project execution. A subsequent explicit V25 implementation selection must identify exact spans/functions after Root and independent semantic review.

Required delivery:

1. Identify the remaining repeated work from exact R33 source, with call sites and complete successful-history counts. Distinguish queue/start/currentjob history, per-call/frontdoor/standalone work and the fixed earlier/later native groups. Client elapsed durations are not server profiles.
2. Evaluate bounded invocation-local reuse of successfully validated byte-identical values or a substantially cheaper equivalent validation implementation, if supportable. No cross-invocation/persistent cache, no trust in stored assertions/digests/canonical text, no skipped history row or authority read. Any alternative requires the same full validation obligations.
3. Provide an exact candidate delta on147856byte R33SQL and a full independent semantic argument: JSONB/text/numeric/NULL/collation/key ordering/depth/node/size/error order, invalid-data refusals and resource bounds. Preserve all29functiondeclarations/attributes and all outer transaction/authority/effect/rollback contracts. Explain aggregate/copy/cache/memory countercosts and cold paths.
4. Model the **complete**, not truncated, ledger and64cycle work before/after. Explicitly include work left unchanged and workloads where costs increase. Do not claim measured speedup, CPU allocation or guaranteed240sPASS.
5. Preserve all existing oracles and identify coverage gaps honestly. Native and fixtures are frozen. No new fixture-tampering, trigger bypass, replicationrole change or private-input cap/refusal.
6. If no materially adequate correction can be justified within these contracts, report that concrete technical limit; do not weaken tests, budgets or guards or launch a speculative head.

## 3. Frozen scope and execution boundary

Only a later Root-selected body change within **scripts/db/official-truth-v3-durable-jobs-1/jobs-candidate.sql** can be proposed. CurrentSQL147856bytes/SHA256e0bb8eded96ad53737228e1d4e824057abc2cadf73ee08267c3a9011aee02ae8/blob6465147678a3024748f98ad151b63bc412ccc6c4. All other17M04sources remain frozen. Native191098bytes/SHA256f5d849c643ff22d264bc9adc1a7cd65f12caaac80a804647604851f22effbde0; rollback6175bytes/SHA2569b9089d74242a802455cc7e3fb8a0a8515c17b61b45ae730b9bbba1adb650a66. Baseline18-sourceaggregate **d70a20d3b3881b56fb7274d3b30089e56e33081f2cb95deb7528b585540f4c76**.

No local checkout/parser/SQL/native/socket/build/test execution, installs, downloads/binaries, clone or replacement environment. Immutable GitHub source/primary software documentation reads and pure in-session text analysis are allowed. No Auth logs, hostedDB/Auth/RLS/ACL/migration/credential actions, provider/research calls or scheduler/public/paid activation. Existing CI executes only after a separately selected, reviewed new source head.

All31groups, originaloracles,254/255/256ledger,64/65cycles,inherited761/minOwned4182,bothrealR9waits,finalrollback/latewriter,fullhistory/authority/cleanup remain mandatory. Limits unchanged240000effect+60000cleanup/300000totalms; allnative/callback/connection/observer/cluster/lane budgets unchanged. No unchanged-head rerun, test split/skip/parallelism change, workflow/dependency/native change or budget increase.

## 4. Live context and completion gates

Independent context read22:10:14–22:10:57UTC: unchangedmain/head/20paths,NORMAL,strictRuleset21875372/no bypass/mergeonly/threadresolution;0formalreviews/inline/Toolbarthreads;14openDraftPRs/48nonPRissues; no newGuardian/Ownerinstruction since21:50:42UTC. Preview **dpl_6xjrQ8Hp69pCYE1H4KCFnu5vMbAq** READY/exact8dbc/aliasErrornull. Production **dpl_2QAy8s3qEWtinWYUwBeQTeFjtUwf** READY/exacte7; bothjetnity.comandjetnity-app.vercel.appboundtocorrectdeployment/project/redirectnull. These cannot override failedCI.

Every changed head requires complete fresh independent31-group/8-job/CI/native/Preview/livegating. After a genuine PRPASS and expected-headmerge, actualnewmain needs its own fullCI/native/Production and bothaliases. **Mandatory separate8-pathdocumentationcompletion remainsHELD until genuine corrected actual-mainPASS**, then its ownfullPR/main/Production gates, finalexistingPR/#751receipts,finiteSTOP. No automaticproductslice;D1#1169separatelyunfinished.

SQL **UNAPPLIED**,Method **NOT_APPROVED**,#1139 **NOT_RELEASE_READY**/17preOwnergaps;#1131ReadySTOP,both#1135holds,#968targetisolation,#911/#913privacy unchanged. GenericPreview/Productionoverlap removed, concreteclient/SSR/Authbindingunproved. #917 **UNKNOWN / Stage2NOT_ATTEMPTED**:no retry/rephrase/delegation/reroute/transport switch/humanSQL substitute.

**First unfinished step: same-session V25 source investigation and independent semantic review of a materially sufficient proposal.** No new source candidate is yet selected.
