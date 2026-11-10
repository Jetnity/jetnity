# M04 Recovery — TASK V7 / R16 actual raw S1 proof

**2026-11-10 04:10:13 UTC.** Immediate CHANGES REQUIRED in the same Generation 2 session, within Draft PR #1178. Task V1, Phase-A freeze/plan/T01–T03 and Recovery Tasks V2–V6 remain binding. Root [diagnosis dispatch](https://github.com/Jetnity/jetnity/pull/1178#issuecomment-6758625887) and [exact patch authorization](https://github.com/Jetnity/jetnity/pull/1178#issuecomment-6758675083).

## Exact baseline and actual failure

Head`07367f7ce4f811dabb43ba340650fab3f77585e5`, tree`4c552ee182feb1da2234fa342012bf4b534ec6f3`, main/merge-base`890dfe9323b4b6d3644c372d81cb8893b6548d11`; ahead 8 / behind 0; 87 files. Mode freshly NORMAL before diagnosis and patch authorization.

Actual [CI 42751380067](https://github.com/Jetnity/jetnity/actions/runs/42751380067), attempt 1 on 07367f7, ended **FAILURE at04:00:17 UTC**. [Repository verification 129615553280](https://github.com/Jetnity/jetnity/actions/runs/42751380067/job/129615553280) and aggregate 129620812719 failed; all six companion jobs succeeded. Typecheck/lint passed; hygiene/build skipped.

First N01/N02/N03/N07 passed in **42 / 2227 / 2728 / 12322 ms**. Fifth group **N07/R4** failed **P7604/local_pg_P7604**, phase proof_5:N07/R4. 26 later groups and both native R9 witnesses were not reached. Core: 8663 total / 8659 passed / 2 failed / 2 skipped / 0 cancelled. Cleanup4576/4576 settled,0 pending,870/870 cumulative connections closed,1/1 cluster stopped,0 children / cleanup failures;18928 ms total / 169 ms cleanup. nativePass false. The wrapped pg-wire/test-lifetime stack names neither a SQL statement nor a revision case/predicate.

## Diagnosis-first outcome and finite authorized correction

Root, sole author and independent reviewer traced the exact source. Protected quarantine-postgres.ts 24–25, 33–45 converts the actual raw S1 record **reference/text/outcome/audit** into application record **reference/text/upload/completion**. intake-server exposes open:backend.read. Native 733–734 serialized that decoded application DTO into consume_s1_v1, whose SQL 649 requires exactly the raw four fields. That source-level mismatch necessarily rejects at the entry-shape gate before archive checks. The log itself does not serialize that predicate or case index.

Root fetched and Git-blob-verified protected quarantine-postgres.ts **3746b98623bc93d72abfe1cba8c8ebef42d0f34e** and intake-server.ts **0605decae43995be0fd0a5183a501067e8a03685**. The SQL guard is correct and remains unchanged. Adding archive.method remains an intentional strict unknown-field negative.

Only N07/R4 in native.ts changes. Both real revision cases retain actual S1 capture/reserve/finish/open and original text. The test requires a non-null decoded completion, reads the **actual raw persisted envelope** through the existing s1_read_v1 bridge with retained binding/digest/byte count, and compares it exactly with the decoded reference/text/completion.outcome/audit counterpart. It does not fabricate a successful SQL reply.

The former application DTO is an explicit P7604 negative per case. The actual raw envelope is consumed positively with a bounded case/revision assertion label. All four existing missing/audit/link/archive negatives operate on copies of actual raw data and still require P7604. Final unchanged store.open equality remains. No SQL/helper/schema/reader/role/grant/workflow/package/deadline/capacity change; all 31 proof groups and both R9 obligations remain.

Sole author **Jetnity Official Truth V3 Durable Jobs1 — Codex Generation2**, /root/m04_durable_jobs_writer_g2. Authorized source change is only the existing N07/R4 block; author also updates the four named evidence files with18 pins,22 matrix rows,31 group obligations and all six failed histories. Deliver unique exact replacements and full pinned content transformations, then **AUTHOR STOP**. No author Ready, merge, publication or follow-up slice. Root owns Task V7/review/current pointers/publication/acceptance.

## Required verification and capability

Publish the finite R16 on expected 07367f7, verify all changed blobs/full tree/ancestry, then inspect the complete unchanged new exact-head CI:31 ordered native groups, both actual R9 witnesses, resource/process completion, full core/hygiene/build/companions, exact Preview and refreshed main/Production/Guardian/review/rules/gates. Failure returns to the same author; no unchanged-known-bad rerun. No Ready/merge until Root's full exact-head acceptance.

The shell is reachable but the original checkout is absent. No clone/reconstruction/fetch, replacement environment, installation or local project/test/parser/SQL/native/socket/build execution occurred. In-session JavaScript is used only for text and independent hashes. Historical 64/64 checks remain historical. Actual native execution is only in existing unchanged CI.

## Unchanged gates

Method **NOT_APPROVED**. #1139 **NOT_RELEASE_READY**, pre-Owner gaps E01, E04, E06, E07, E09, E10, E11, E13, E15, E16, E17, E18, E21, E22, E24, E25, E28. #917 specifically refused independent readback remains pending, ledger UNKNOWN, Stage2 NOT_ATTEMPTED: no retry, rephrasing, delegation, rerouting, transport switch, human SQL substitute or renewed old Owner evidence request. #1131 Ready STOP; both #1135 holds; #968 preview isolation and #911/#913 privacy remain.

No hosted DB/Auth/RLS/ACL/migration/credential action or Auth-log access, real source/provider/research call, scheduler, notification, new cost or public V3 activation. No local PostgreSQL/native/socket execution, installation/download, missing binary retrieval, local full build or alternate execution environment. Native proof only in the unchanged existing GitHub CI. No git fetch/push; if local git becomes available, reads require GIT_NO_LAZY_FETCH=1. Preserve all 22 omitted binary IDs. No automatic follow-up product slice.

