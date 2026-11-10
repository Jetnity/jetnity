# M04 — current Root handoff V1

**2026-11-10 04:10:13 UTC. R16 raw-S1 native fixture correction source-reviewed; complete new-head CI/native acceptance OPEN. Draft, no Ready/merge/activation.**

## Read and continue

Read JETNITY_START_HERE.md, [Operating Standard](../JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md), [ACTIVE_WORK_STATUS](../ACTIVE_WORK_STATUS.md), **[latest Root Review / Continuity V7](M04_RECOVERY_ROOT_REVIEW_V7.md)**, [Task V7](M04_RECOVERY_TASK_V7.md), V6/V5/V4/V3/V2 and the saved interrupted-chat checkpoint. Live state and later exact read-back PR receipts supersede this pre-publication snapshot.

## Current baseline and actual result

Head`07367f7ce4f811dabb43ba340650fab3f77585e5`, tree`4c552ee182feb1da2234fa342012bf4b534ec6f3`, main/merge-base`890dfe9323b4b6d3644c372d81cb8893b6548d11`; ahead 8 / behind 0, 87 files. Branch feat/official-truth-v3-durable-jobs-1-20261109, Draft PR #1178. [Prior publication](https://github.com/Jetnity/jetnity/pull/1178#issuecomment-6758379922). Root [diagnosis dispatch](https://github.com/Jetnity/jetnity/pull/1178#issuecomment-6758625887) and [exact patch authorization](https://github.com/Jetnity/jetnity/pull/1178#issuecomment-6758675083).

Actual [CI 42751380067](https://github.com/Jetnity/jetnity/actions/runs/42751380067), attempt 1 on 07367f7, ended **FAILURE at04:00:17 UTC**. [Repository verification 129615553280](https://github.com/Jetnity/jetnity/actions/runs/42751380067/job/129615553280) and aggregate 129620812719 failed; all six companion jobs succeeded. Typecheck/lint passed; hygiene/build skipped.

First N01/N02/N03/N07 passed in **42 / 2227 / 2728 / 12322 ms**. Fifth group **N07/R4** failed **P7604/local_pg_P7604**, phase proof_5:N07/R4. 26 later groups and both native R9 witnesses were not reached. Core: 8663 total / 8659 passed / 2 failed / 2 skipped / 0 cancelled. Cleanup4576/4576 settled,0 pending,870/870 cumulative connections closed,1/1 cluster stopped,0 children / cleanup failures;18928 ms total / 169 ms cleanup. nativePass false. The wrapped pg-wire/test-lifetime stack names neither a SQL statement nor a revision case/predicate.

## Correction and first unfinished step

Root, sole author and independent reviewer traced the exact source. Protected quarantine-postgres.ts 24–25, 33–45 converts the actual raw S1 record **reference/text/outcome/audit** into application record **reference/text/upload/completion**. intake-server exposes open:backend.read. Native 733–734 serialized that decoded application DTO into consume_s1_v1, whose SQL 649 requires exactly the raw four fields. That source-level mismatch necessarily rejects at the entry-shape gate before archive checks. The log itself does not serialize that predicate or case index.

Root fetched and Git-blob-verified protected quarantine-postgres.ts **3746b98623bc93d72abfe1cba8c8ebef42d0f34e** and intake-server.ts **0605decae43995be0fd0a5183a501067e8a03685**. The SQL guard is correct and remains unchanged. Adding archive.method remains an intentional strict unknown-field negative.

Only N07/R4 in native.ts changes. Both real revision cases retain actual S1 capture/reserve/finish/open and original text. The test requires a non-null decoded completion, reads the **actual raw persisted envelope** through the existing s1_read_v1 bridge with retained binding/digest/byte count, and compares it exactly with the decoded reference/text/completion.outcome/audit counterpart. It does not fabricate a successful SQL reply.

The former application DTO is an explicit P7604 negative per case. The actual raw envelope is consumed positively with a bounded case/revision assertion label. All four existing missing/audit/link/archive negatives operate on copies of actual raw data and still require P7604. Final unchanged store.open equality remains. No SQL/helper/schema/reader/role/grant/workflow/package/deadline/capacity change; all 31 proof groups and both R9 obligations remain.

native.ts: **141437 bytes**, SHA256 `1e25514e6baecf7e0c38d0cdbdbbaaa14f38a11b9693149b76a97bc0b56932a5`, Git blob `732ec5389e26cc1f09c32626117588d23384e0d3`. All 18-source aggregate `fd829dbf93171d8bc2d352cd02aa92126e8ee8ab64ac2fc0392d4863f63fb19e`. All 17 other sources, including candidate SQL a22e6a015c8fc5a268500659ace31a938d2ce3614625e9df1982308b73199a59 and rollback9b9089d74242a802455cc7e3fb8a0a8515c17b61b45ae730b9bbba1adb650a66, are unchanged.

**First unfinished step:** Publish the finite R16 on expected 07367f7, verify all changed blobs/full tree/ancestry, then inspect the complete unchanged new exact-head CI:31 ordered native groups, both actual R9 witnesses, resource/process completion, full core/hygiene/build/companions, exact Preview and refreshed main/Production/Guardian/review/rules/gates. Failure returns to the same author; no unchanged-known-bad rerun. No Ready/merge until Root's full exact-head acceptance.

All six failure histories,18 pins,22rows and31 native obligations remain in author evidence. Current R16 source is unexecuted; older64/64 checks do not gate it. Preserve actual R9 custody/race/drain requirements and frozen budgets. A successful partial group or READY Preview is never overall acceptance.

## Session and scope

Sole writer **Jetnity Official Truth V3 Durable Jobs1 — Codex Generation2**, /root/m04_durable_jobs_writer_g2, AUTHOR STOP after delivery. Same session for immediate fixes. Reviewer /root/m04_r9_review_g2; auditor /root/m04_live_audit_g2. Original G1 unavailable, no invented Cursor continuity. Only Root publishes/PASS/Ready/merges.

The shell is reachable but the original checkout is absent. No clone/reconstruction/fetch, replacement environment, installation or local project/test/parser/SQL/native/socket/build execution occurred. In-session JavaScript is used only for text and independent hashes. Historical 64/64 checks remain historical. Actual native execution is only in existing unchanged CI.

Main CI 42736015143 has 8 successful jobs; both Production aliases most recently READY on exact890/dpl_7K4gHmn2d2HBqCq1CHBThRjAXHw7. This is baseline metadata, not M04 Production acceptance. Keep #1180 Atlas / #1179 Booking and 22 binary IDs. D1 #1169 remains independent Draft/unfinished; no automatic next product slice.

## Hard gates

Method **NOT_APPROVED**. #1139 **NOT_RELEASE_READY**, pre-Owner gaps E01, E04, E06, E07, E09, E10, E11, E13, E15, E16, E17, E18, E21, E22, E24, E25, E28. #917 specifically refused independent readback remains pending, ledger UNKNOWN, Stage2 NOT_ATTEMPTED: no retry, rephrasing, delegation, rerouting, transport switch, human SQL substitute or renewed old Owner evidence request. #1131 Ready STOP; both #1135 holds; #968 preview isolation and #911/#913 privacy remain.

No hosted DB/Auth/RLS/ACL/migration/credential action or Auth-log access, real source/provider/research call, scheduler, notification, new cost or public V3 activation. No local PostgreSQL/native/socket execution, installation/download, missing binary retrieval, local full build or alternate execution environment. Native proof only in the unchanged existing GitHub CI. No git fetch/push; if local git becomes available, reads require GIT_NO_LAZY_FETCH=1. Preserve all 22 omitted binary IDs. No automatic follow-up product slice.

