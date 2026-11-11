# M04 R34 — Technical Lead source review V25

**2026-11-10 22:42:00 UTC.** Exact input head **8dbc0cf669a60701a4f028027343587da7ce6da3**, Draft#1183; main/merge-base **e7aae86c18238033c2186722e24c84dc7a5f69b9**. This is an independent pre-publication source review. **No new-head runtime PASS, TL-PASS, Ready or merge.** Immutable candidate readback and fresh live gates are still required before branch publication.

## Failure and selected repair

R33 finished24/31 groups and the full ledger boundary but exhausted the unchanged240s limit during zero-based cycle20/cycle_claim. Root personally read all8final job metadata records before all7permitted non-Auth logs; independent CI audit matched them. Failure26, full3809-byte native receipt, outstanding-command UNKNOWN, fullcleanup, all companion structured proofs and eight terminal statuses are preserved in the accompanying V25JSON and [V25v1](https://github.com/Jetnity/jetnity/pull/1183#issuecomment-6780703035). Earlier failed observations and genuineR21/R29successes remain distinct.

[Binding V25v2](https://github.com/Jetnity/jetnity/pull/1183#issuecomment-6781201377) selects exactly six replacements inside assert_history_v1. Author **Jetnity Official Truth V3 Durable Jobs1 — Codex Generation3**, actual session **/root/m04_durable_jobs_writer_g3**, read the complete amendment and reconfirmed its exact delivery from the published twelve literal code blocks. Independent source reviewer **/root/m04_recovery_source_review_g3** independently read the full21330-byte amendment, reconstructed the same candidate, reversed it and rehashed18sources. No source blocker was found. Author self-review is not Technical-Lead-PASS.

## Exact source and bounded scope

| Source | UTF-8 bytes | SHA256 |
|---|---:|---|
| R33 baseline SQL |147856|e0bb8eded96ad53737228e1d4e824057abc2cadf73ee08267c3a9011aee02ae8|
| R34 selected SQL |154573|714d766795a2cd9362f0fe243948b628e84cab307ec34306c15573b5c1ac64c8|
| Unchanged native |191098|f5d849c643ff22d264bc9adc1a7cd65f12caaac80a804647604851f22effbde0|
| Unchanged rollback |6175|9b9089d74242a802455cc7e3fb8a0a8515c17b61b45ae730b9bbba1adb650a66|

Candidate Git blob **f1ec4f9fba367df695646e9817a5e567cf4fe63d**; eighteen-source aggregate **5bdd3fd5e92194b0936fc3f25e4e27eeeb9141578270b6419ae90ab8194342e1**. All17other source pins unchanged. The history function grows10621→17338bytes, net6717. Root, author and reviewer separately confirm six unique spans, full inverse to baseline, all29declaration/attribute pairs, all28other complete function blocks and every byte outside history unchanged.

The command copy has40statement lines. Undoing its exact subject-call replacement and RETURN-to-assignment recovers all40original lines. Four original text locals explicitly retain default collation. Older copied-transition proofs remain historical; this review does not claim the entire transition copy is byte-identical to its pre-R33 form.

## Successful job reuse

The invocation-local map begins as a JSONB object and retains only complete raw job JSONB text keys with booleantrue values, after actual successful original job_v1 validation. Current-job validation runs unconditionally before serialization. The two later validation sites treat SQLNULL and absent keys as misses. JSONnull cannot enter through successful job validation.

The map uses neither hashes nor JSONB semantic equality. Complete key length and bytes define identity. Different raw numeric representations cannot hit merely because JSONB numeric equality would consider them equal. job_v1 returns its input unchanged; therefore a hit reuses the current input value, not an assumed canonical or stored surrogate.

Admission allows at most256entries and1048576retained raw-key bytes. A full cache declines admission while performing original validation normally. This adds no acceptance/refusal limit. Per-invocation lifetime prevents any trust crossing authority calls or transactions. No chronological queue order is assumed.

## Subject reuse and copied command semantics

The subject singleton compares the full kind and full raw subject input, including researchReason, under explicit C collation. NULL/uninitialized memo state misses. Its stored result is the actual successful subject_v1 result. Admission requires the combined byte lengths of kind, raw input text and actual result text to fit1MiB. When admission is declined, the current successful result remains usable.

command_identity is reset on every queue row before entering the copied command block. All original command locals initialize in their original order. Non-enqueue commands leave that identity NULL. New-enqueue transition construction consumes only the same row's actual validated subject identity, for exactly the same kind and stripped subject input; no stale-row path exists.

Default collation is explicit on the original copied text locals, and the original cold subject helper retains its default call context. C collation is confined to memo identity comparison. Command parsing, original logical checks and messages, shape, canonicalization, identifiers, bounds and return-object construction remain. No later FOUND dependence is introduced.

Every journal row, actual envelope, timestamp, prior/next relationship, disposition, credit, starts/slot and transition check remains. Pre-/post-effect history validation and supported-call catalog, MA1, locks, waits, transaction and cleanup checks remain. No acceptance is based on a stored digest or claimed canonical text.

Diagnostic exception stack context and allocation-failure timing may differ. Equivalent arbitrary OOM order or measured peakRSS is not claimed.

## Immutable PostgreSQL source review

Root read the relevant pinned [PostgreSQL source at c372fbbd8e911f2412b80a8c39d7079366565d67](https://github.com/postgres/postgres/tree/c372fbbd8e911f2412b80a8c39d7079366565d67), in addition to the actual repository source. Exact blobs appear in V25JSON.

- jsonb_op.c passes a full text key and its byte length into top-level JSONB lookup.
- jsonb_util.c performs object-key binary search using length then memcmp. It also establishes string-key payload, two JEntries per entry and true-valued map layout.
- jsonfuncs.c jsonb_concat/IteratorConcat reconstruct the combined object; this is an explicit copy/sort countercost, not a free hash-table insertion.
- varlena.c texteq uses byte comparison for deterministic/C collation. charset.sgml, pg_type.c and previously read pl_comp.c/parse_collate.c establish the local/default-collation distinctions.
- Previously read pl_gram.y/pl_exec.c establish nested block declarations and ordered block-local initialization. No SQL/parser/native/project code was executed locally.

## Complete successful-trace model

This model includes both complete quota proofs and expected refusals, not just the reached failed R33 prefix. It is source arithmetic independently matched by Root, author, source reviewer and current live/cost auditor.

| History work | Ledger | Cycles | Combined |
|---|---:|---:|---:|
| Completed bodies |515|514|1029|
| Queue rows retained |66557|49794|116351|
| Starts rows retained |5|16512|16517|
| Original job validations |67081|99588|166669|
| Proposed job validations |524|49794|50318|
| Original canonical entries |1202781|1508918|2711699|
| Proposed canonical entries |603788|1094436|1698224|

The pointer-invariant negative adds a1030th invocation that fails before current-job and loop work. Job-body reuse removes116351validations,714753canonical entries and365700nodes visits. Additional subject reuse removes99574subject calls and298722canonical entries. Including subject calls within removed job bodies gives215925subject calls removed. Total exact-key calls removed681199; nodes533301→167601.

Remaining history canonical entries:332406command,762655envelope,116351audit,167601distinct-job own,154041subject,165170starts. Every queue/start row remains examined. Complete history remains quadratic.

Outside history, the same520fixed SQLAPI calls include452queueCAS,65executionSTART,3queueREAD. They retain1871command validations,903standalone transitions,1425job validations,3357subjects,514positive raw-reply canonical checks and449inserted-envelope checks. Their39410canonical entries remain. Thus **complete-quota canonical work2751109→1737634**, a reduction1013475.

Client452commandRequest operations and520fixed request serializations, SQLJSON parsing, nodes, keys, locks, deadlines, catalog/MA1, setup and other29native groups are additional. These totals are not whole-native CPU, measured speedup or a240-second guarantee.

Every520quotaAPI call reaches one unchanged catalog check, fingerprinting11predecessor+29companion definitions:20800hashes. The history definition is hashed520times; +6717source bytes add3492840definition-input bytes plus retrieval/conversion/copy/JSON. No exact whole-native API/catalog count is available; owned-operation counts are not a substitute. No authority check is omitted.

## Memory and countercosts

The native full histories need at most3retained ledger jobs or193cycle jobs per invocation, independent of row order. Immutable fixture shapes give a conservative873raw-text bytes per job:16root fields+5identity+2method+4lease. The Discovery key is93characters (29prefix+64digest). The looser4096-byte bound also fits193×4096=790528raw-key bytes under1MiB.

Final bounded true-map storage is at most1048576+8×256+8=1050632bytes, from full string keys, two4-byte JEntries per key and headers. It is **not peak memory**. Concatenation rebuilds/sorts the accumulated map. Summed materialized-prefix entry counts are535ledger+3232450cycles=3232985; at873bytes each, their cumulative raw-key payload is at most2822395905bytes. Descriptors, sorting and other temporary copies are extra. This is not measured traffic or total allocations.

Subject admission1MiB covers kind/input/result text, not all transient representations or peakRAM. Cold, distinct, oversized or cap-exhausted inputs may receive little benefit or added serialization/lookup cost; original validation remains fallback. Nonquota accepted helper inputs are not bounded by the native fixture estimate.

The unchanged larger N02/U04 valid-vector coverage includes16nodes/14atoms/2compounds,112supportIDs,22528Bjob,21504Bcommand,46592Benvelope allowances,110082BqueueCAS and160772Blargest queue-confirm reply below262144. Existing canonical array/sort/copy costs from R33 also remain. No cap or proof was relaxed.

## Coverage and decision

There is no dedicated new cache-cap/exhaustion, alternating-subject-cache or malformed-persisted-envelope negative oracle. These gaps remain explicit. The unchanged fixed canonical/type/numeric/calendar/time/ordering/depth cases, both-kind mixed histories, standalone negatives, full quota proofs, races, rollback and all31native groups remain required. No tamper/trigger/replication-role mechanism is authorized.

**Source-only suitable for bounded publication**, subject to immutable10file/18source/fulltree/diff readback and fresh Root gates. This commit may change one source and nine continuity paths only: five current entry blocks, M04handoff and threeV25records. All outside-marker bytes, entire previous handoff, immutable prior records,26failure observations, genuine successes and36parallel#1181leaves stay intact.

Every new head needs all8jobs/31groups,254/255/256,64/65,inherited761/minOwned4182,bothrealR9,rollback/late-writer,drainedcleanup,mountedLifecycle,Core,fivehygiene,Build and exactPreview. Only Root may TL-PASS/Ready/expected-headmerge after complete independent acceptance. Actual new main separately needs fullCI/native/Production and bothaliases.

SQLUNAPPLIED;MethodNOT_APPROVED;#1139NOT_RELEASE_READY/17gaps;#1131ReadySTOP;both#1135holds;target#968isolation;#911/#913privacy;#917UNKNOWN/Stage2NOT_ATTEMPTED without retry/substitute;D1#1169separately unfinished. All execution restrictions remain. The separate8-path documentation completion isHELD until genuine corrected actual-mainPASS, then requires its own fullgates. Final receipts on existingPR/#751; finite STOP and no automatic next slice.
