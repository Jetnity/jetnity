# M04 Recovery — Root Review / Continuity V5, R14

**2026-11-10 03:16:37 UTC. Test-only strict-input fixture correction independently reviewed; new-head native/full-CI acceptance OPEN. Draft, no Ready/merge/activation.**

Read [Task V5](M04_RECOVERY_TASK_V5.md), [current Handoff](M04_HANDOFF_V1.md), [V4](M04_RECOVERY_ROOT_REVIEW_V4.md), [V3](M04_RECOVERY_ROOT_REVIEW_V3.md), [V2](M04_RECOVERY_ROOT_REVIEW_V2.md). Current exact head/tree/run/merge are determined by live GitHub and later read-back PR receipts, not this pre-publication snapshot.

## Actual R13 publication and terminal CI

Root published313c1db0d96d62f94f22c5db94c74bb75779f542 on expected82b with no force. Independently reconstructed treefdc1b62d266aba6f28a04c85ba358966f915dd36 and all14delta blobs matched GitHub. Synthetic merge2391f8925581f036a6d088d69f238887c7e706a8 had the same tree and parents main890 plus313c. [Publication receipt](https://github.com/Jetnity/jetnity/pull/1178#issuecomment-6757725206).

[CI42746442139](https://github.com/Jetnity/jetnity/actions/runs/42746442139), attempt1, is terminal FAILURE03:13:22UTC. Root independently fetched the full non-Auth Repository verification log129599589985. The independent live auditor and author reproduced its exact hash.

| Item | Actual observation |
|---|---|
| SQLcandidate | a22e6a015c8fc5a268500659ace31a938d2ce3614625e9df1982308b73199a59 |
| Installation / N01 | succeeds; N01 receipt28ms |
| N02 | ERR_ASSERTION: assert.ok(alternate), native.ts617:14 |
| Receipt failure | proof_2:N02 / assertion_failed; nativePassfalse |
| Later groups / R9 |29 later groups not reached; neither native R9 witness present |
| Core |8660total /8656pass /2fail /2skip /0cancel |
| Lifetime |587started /587settled /0pending |
| Connections / clusters |90/90cumulativeclosed;1/1clusterstopped;0children |
| Total / cleanup |2569ms /162ms;0cleanupfailures |
| Other six jobs |SUCCESS |
| Aggregate129604596107 |FAILURE |
| Typecheck / lint / hygiene / build |success /success /skipped /skipped |

The two core failures are N02 and its mandatory parent case. Unit R9 successes do not replace the missing actual native witnesses. Cleanup counts cover only executed work, not later concurrency scenarios.

[Safe failure excerpt](M04_RECOVERY_R14_NATIVE_FAILURE_V5.txt). Full decoded log4,229,248characters /4,238,466UTF8bytes /63,017lines, SHA256`cd8fe512ca2409cdaa4a48019a6f6a15b466fa54bc7d39659c78b388884f8a33`. Safe excerpt SHA256`5dc170068b3ebf79a67b63837be7a6d499159ea02b10dc06969b6feebed1b029`. No Auth log was accessed.

## Confirmed cause and meaningful bounded correction

Root read native.ts616–627, the fixture's complete ruleInput construction and the strict reader at contract.ts200. The alternate receives three enqueue-only fields and is correctly rejected. The independent reviewer /root/m04_r9_review_g2 reached the same diagnosis.

The unique patch keeps that strict rejection as an explicit assertion. It passes only the four identity fields to the positive alternate and requires a distinct job locator and canonical subject before exercising the unchanged actual SQL forgery rejection. The full source suffix from the original wrong-subject assertion onward is byte-identical. The other existing identity helper call already projects exactly four Rule or three Discovery fields; no duplicate shape defect was found there.

No runtime/SQL/contract/permission or protected-file change is proposed. Root and independent reviewer reconstructed the same final source:

- native.ts:139506bytes, SHA256`5cf0852b7ad101d6fa0a1d792c88657df9bb1d35a32d2bf7e2b4bd3765219921`, Git blob`e4af98beb00ff4780dde454f2e3343b8affed539`.
- All18sourceaggregate:`23f9a54835534afe9a8ca9be5a1aa51c37c5e7ae1e90b15f9b5e014b0cc51e5f`.
- Other17sourcefiles unchanged, including candidate/rollback.
- Native group count remains31; only existing N02 is corrected.

**Disposition: source accepted for publication and new CI only. No native or overall Technical-Lead PASS.**

## What R13 actually reached

The failure line617 follows the restricted-runtime empty probe, four negative schema-USAGE checks, same-OID predecessor rename rejection, finally restoration, exact catalog equality, restored probe and other strict-input checks. Completion of those preceding statements is inferred from the recorded later assertion and the sequential source path. There is no dedicated per-assertion receipt. This narrows the prior42501 blocker; it does not accept N02 overall or any unexecuted N03–N15/R9 scenario.

The earlier original d9 setup failure,7ac42601,82b42501 and this313c assertion failure all remain historical negative evidence. They are not overwritten by successful source review or by a READY Preview.

## Live baseline, sessions and continuation

At the latest read, main/merge-base remains890dfe9323b4b6d3644c372d81cb8893b6548d11, tree8c611ec31d518cce88a3a5abb75aecf6620d794c. Failed313c is ahead6/behind0,79files. Its exact Preview dpl_GWpDrbgsbiZRk9b7sLpsZZQdDdsL is READY, aliasErrornull. GitHub formal reviews/threads and unresolved Vercel branch threads are zero; Root issue-comment findings still bind. ModeNORMAL; bounded #748/#751 comment reads since02:20UTC found no new Guardian report. Strict ruleset21875372 remains mandatory and must be refreshed before any merge.

Last verified mainCI42736015143 all8SUCCESS and both Production aliases READY on dpl_7K4gHmn2d2HBqCq1CHBThRjAXHw7/exact890. These are baseline release metadata, no M04 hosted/Production proof. Preserve #1180atlas, #1179booking and all22 omitted binary IDs. D1#1169 remains separate Draft/unfinished.

Sole writer is **Jetnity Official Truth V3 Durable Jobs1 — Codex Generation2**, /root/m04_durable_jobs_writer_g2; immediate fix in same actual session. Review /root/m04_r9_review_g2; live audit /root/m04_live_audit_g2. Original G1 session was proven unavailable; no invented Cursor continuity. Only Root publishes/PASS/Ready/merges.

Local execution has been unavailable since the secured7ac publication. Previous64/64localnonnative checks are historical, not new R14 execution. In-session JS performs text/integrity hashing only.

**First unfinished step:** publish the finite R14 correction/evidence on expected313c, verify exact returned commit/tree/blobs and ancestry, then inspect the complete unchanged new CI, all31groups, both R9 witnesses, whole-process/cleanup, complete core/hygiene/build and companion jobs, exact Preview and refreshed live gates. Any failure returns CHANGES REQUIRED to the same author; no known-bad unchanged rerun.

## Risks and unchanged gates

- P0: no new verified production incident; no hosted-state inference.
- P1: actual N02 fixture failure plus unexecuted native/R9/full-CI obligations block Ready/merge.
- P2: later runtime paths remain unexecuted; dormant adapter is not an approved method or operational service.
- P3: local environment unavailable; exact remote checkpoints preserve continuity.

Method **NOT_APPROVED**. #1139 **NOT_RELEASE_READY**, pre-Owner gaps E01, E04, E06, E07, E09, E10, E11, E13, E15, E16, E17, E18, E21, E22, E24, E25, E28. #917 specifically refused independent readback remains pending, ledger UNKNOWN, Stage2 NOT_ATTEMPTED: no retry, rephrasing, delegation, rerouting, transport switch, human SQL substitute or renewed old Owner evidence request. #1131 Ready STOP; both #1135 holds; #968 preview isolation and #911/#913 privacy remain.

No hosted DB/Auth/RLS/ACL/migration/credential action or Auth-log access, real source/provider/research call, scheduler, notification, new cost or public V3 activation. No local PostgreSQL/native/socket execution, installation/download, missing binary retrieval, local full build or alternate execution environment. Native proof only in the unchanged existing GitHub CI. No git fetch/push; if local git becomes available, reads require GIT_NO_LAZY_FETCH=1. Preserve all 22 omitted binary IDs. No automatic follow-up product slice.
