# M04 Recovery — Root Review / Continuity V7, R16

**2026-11-10 04:10:13 UTC. Native raw-S1 fixture correction independently source-reviewed; complete new-head native/full-CI acceptance OPEN. Draft, no Ready/merge/activation.**

Read [Task V7](M04_RECOVERY_TASK_V7.md), [current Handoff](M04_HANDOFF_V1.md), [V6](M04_RECOVERY_ROOT_REVIEW_V6.md), V5/V4/V3/V2 and the saved interrupted-chat checkpoint. Later read-back PR receipts and live state determine exact current head/tree/run/merge. This is a pre-publication source/evidence snapshot.

## Actual R15 publication and CI

Root published`07367f7ce4f811dabb43ba340650fab3f77585e5` on expected30c without force. All13 changed blobs and independently reconstructed tree`4c552ee182feb1da2234fa342012bf4b534ec6f3` matched GitHub. Synthetic merge2ed5de1792c89a8567da185b11aebd8a224942c0 has the same tree and parents main 890 + 07367f7. [Publication receipt](https://github.com/Jetnity/jetnity/pull/1178#issuecomment-6758379922).

Actual [CI 42751380067](https://github.com/Jetnity/jetnity/actions/runs/42751380067), attempt 1 on 07367f7, ended **FAILURE at04:00:17 UTC**. [Repository verification 129615553280](https://github.com/Jetnity/jetnity/actions/runs/42751380067/job/129615553280) and aggregate 129620812719 failed; all six companion jobs succeeded. Typecheck/lint passed; hygiene/build skipped.

First N01/N02/N03/N07 passed in **42 / 2227 / 2728 / 12322 ms**. Fifth group **N07/R4** failed **P7604/local_pg_P7604**, phase proof_5:N07/R4. 26 later groups and both native R9 witnesses were not reached. Core: 8663 total / 8659 passed / 2 failed / 2 skipped / 0 cancelled. Cleanup4576/4576 settled,0 pending,870/870 cumulative connections closed,1/1 cluster stopped,0 children / cleanup failures;18928 ms total / 169 ms cleanup. nativePass false. The wrapped pg-wire/test-lifetime stack names neither a SQL statement nor a revision case/predicate.

The two core failures are N07/R4 and its enclosing mandatory test. The executed-part cleanup is complete; unexecuted concurrency/R9/resource proofs remain open. Root and the independent auditor fetched the same full non-Auth log:4,231,168 characters / 4,240,386 UTF8 bytes / 63,032 lines, SHA256`0b9d3b2907e8f32c5e5f80c5a4562b25ad4187d29eea1965a309caa362ae7f6b`. [Exact safe excerpt](M04_RECOVERY_R16_NATIVE_FAILURE_V7.txt), SHA256`9e0e69ced132d1cd2dcb93b8a7bd2b7b0b8a5f7dd67593c8fd664452a8ecbdb6`.

## Root source diagnosis and approved correction

Root, sole author and independent reviewer traced the exact source. Protected quarantine-postgres.ts 24–25, 33–45 converts the actual raw S1 record **reference/text/outcome/audit** into application record **reference/text/upload/completion**. intake-server exposes open:backend.read. Native 733–734 serialized that decoded application DTO into consume_s1_v1, whose SQL 649 requires exactly the raw four fields. That source-level mismatch necessarily rejects at the entry-shape gate before archive checks. The log itself does not serialize that predicate or case index.

Root fetched and Git-blob-verified protected quarantine-postgres.ts **3746b98623bc93d72abfe1cba8c8ebef42d0f34e** and intake-server.ts **0605decae43995be0fd0a5183a501067e8a03685**. The SQL guard is correct and remains unchanged. Adding archive.method remains an intentional strict unknown-field negative.

Only N07/R4 in native.ts changes. Both real revision cases retain actual S1 capture/reserve/finish/open and original text. The test requires a non-null decoded completion, reads the **actual raw persisted envelope** through the existing s1_read_v1 bridge with retained binding/digest/byte count, and compares it exactly with the decoded reference/text/completion.outcome/audit counterpart. It does not fabricate a successful SQL reply.

The former application DTO is an explicit P7604 negative per case. The actual raw envelope is consumed positively with a bounded case/revision assertion label. All four existing missing/audit/link/archive negatives operate on copies of actual raw data and still require P7604. Final unchanged store.open equality remains. No SQL/helper/schema/reader/role/grant/workflow/package/deadline/capacity change; all 31 proof groups and both R9 obligations remain.

Root [diagnosis dispatch](https://github.com/Jetnity/jetnity/pull/1178#issuecomment-6758625887) and [exact patch authorization](https://github.com/Jetnity/jetnity/pull/1178#issuecomment-6758675083). Root and independent reviewer reconstruct the exact author replacements and match frozen source pins before publication.

native.ts: **141437 bytes**, SHA256 `1e25514e6baecf7e0c38d0cdbdbbaaa14f38a11b9693149b76a97bc0b56932a5`, Git blob `732ec5389e26cc1f09c32626117588d23384e0d3`. All 18-source aggregate `fd829dbf93171d8bc2d352cd02aa92126e8ee8ab64ac2fc0392d4863f63fb19e`. All 17 other sources, including candidate SQL a22e6a015c8fc5a268500659ace31a938d2ce3614625e9df1982308b73199a59 and rollback9b9089d74242a802455cc7e3fb8a0a8515c17b61b45ae730b9bbba1adb650a66, are unchanged.

**Disposition: source accepted for publication and complete new CI only; no native or overall Technical-Lead PASS.** All six failure histories remain: d9 setup,7ac SQL syntax,82b restricted runtime,313c strict identity fixture,30c context fixture,07367f7 raw/application DTO mismatch. Four successful groups are historical evidence for07367f7 only. The new R16 source has not executed.31 groups remain mandatory;27 still lack a passing historical receipt (one failed, 26 not reached), and both native R9 witnesses remain absent.

## First unfinished step

Publish the finite R16 on expected 07367f7, verify all changed blobs/full tree/ancestry, then inspect the complete unchanged new exact-head CI:31 ordered native groups, both actual R9 witnesses, resource/process completion, full core/hygiene/build/companions, exact Preview and refreshed main/Production/Guardian/review/rules/gates. Failure returns to the same author; no unchanged-known-bad rerun. No Ready/merge until Root's full exact-head acceptance.

R9 still requires two actual nested reserve witnesses (natural I1 timeout and explicit worker caller abort), real SQL wait and target/backend identity, backend absence while executor context remains held, admission unavailable before original drain and invalid only afterward with three helper methods still held, no terminal effects, unchanged durable/S1 state and complete final cleanup. Unit/scripted evidence is not a substitute.

## Live scope, sessions and limits

Main/merge-base remained`890dfe9323b4b6d3644c372d81cb8893b6548d11`, tree8c611ec31d518cce88a3a5abb75aecf6620d794c. Failed07367f7 ahead 8 / behind 0, 87 files. Root verified exact Preview dpl_8JSP23ZHJuhYLcJSrt3FRePG5RTX READY / aliasError null. Both Production aliases freshly at 03:47 UTC resolved to READY dpl_7K4gHmn2d2HBqCq1CHBThRjAXHw7/exact main 890. Main CI 42736015143 had 8 successful jobs. None of these metadata establishes M04 hosted/runtime acceptance.

Root refreshed14 open PRs / all Draft, 48 open non-PR issues, mode NORMAL, strict ruleset 21875372 active with no bypass, zero formal/inline GitHub and unresolved Vercel review threads. Guardian#748/#751 had no new comments since 02:20 UTC; no Guardian run was created. #1139/#917 gate issue timestamps unchanged. [Auxiliary receipt](https://github.com/Jetnity/jetnity/pull/1178#issuecomment-6758431482). Later live evidence supersedes this timestamped snapshot.

Sole writer **Jetnity Official Truth V3 Durable Jobs1 — Codex Generation2**, /root/m04_durable_jobs_writer_g2; reviewer /root/m04_r9_review_g2; auditor /root/m04_live_audit_g2. Original G1 unavailable; no invented Cursor continuity. Root alone publishes/PASS/Ready/merges.

The shell is reachable but the original checkout is absent. No clone/reconstruction/fetch, replacement environment, installation or local project/test/parser/SQL/native/socket/build execution occurred. In-session JavaScript is used only for text and independent hashes. Historical 64/64 checks remain historical. Actual native execution is only in existing unchanged CI.

Preserve #1180 Atlas / #1179 Booking and 22 omitted binary IDs. D1 #1169 remains separate Draft/unfinished; no automatic next product slice. Current-pointer edits retain all content outside the M04 markers.

## Risks and unchanged Owner gates

- P0: no newly verified Production incident; hosted state is not inferred.
- P1: actual N07/R4 failure and remaining native/full-CI/R9 proofs block Ready/merge.
- P2: later recovery, lock, quota, permission, dependency and rollback paths remain unexecuted; dormant code is not method approval or operational release.
- P3: original local checkout absent; exact remote checkpoints preserve continuity.

Method **NOT_APPROVED**. #1139 **NOT_RELEASE_READY**, pre-Owner gaps E01, E04, E06, E07, E09, E10, E11, E13, E15, E16, E17, E18, E21, E22, E24, E25, E28. #917 specifically refused independent readback remains pending, ledger UNKNOWN, Stage2 NOT_ATTEMPTED: no retry, rephrasing, delegation, rerouting, transport switch, human SQL substitute or renewed old Owner evidence request. #1131 Ready STOP; both #1135 holds; #968 preview isolation and #911/#913 privacy remain.

No hosted DB/Auth/RLS/ACL/migration/credential action or Auth-log access, real source/provider/research call, scheduler, notification, new cost or public V3 activation. No local PostgreSQL/native/socket execution, installation/download, missing binary retrieval, local full build or alternate execution environment. Native proof only in the unchanged existing GitHub CI. No git fetch/push; if local git becomes available, reads require GIT_NO_LAZY_FETCH=1. Preserve all 22 omitted binary IDs. No automatic follow-up product slice.

