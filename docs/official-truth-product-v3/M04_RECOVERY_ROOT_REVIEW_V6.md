# M04 Recovery — Root Review / Continuity V6, R15

**2026-11-10 03:37:14 UTC. Coherent N07 fixture correction independently source-reviewed; new-head native/full CI acceptance OPEN. Draft, no Ready/merge/activation.**

Read [Task V6](M04_RECOVERY_TASK_V6.md), [current Handoff](M04_HANDOFF_V1.md), then [V5](M04_RECOVERY_ROOT_REVIEW_V5.md), V4/V3/V2 and the saved interrupted-chat checkpoint. Later read-back PR receipts and live state determine exact current head/tree/run/merge; this is a pre-publication source/evidence snapshot.

## Actual R14 publication and CI

Root published30c6299a76fda7b50493a46596a57af3777a7372 on expected313c with no force. All13 changed blobs and independently reconstructed tree7746a6e6fe802262a94018005c4722c483142c82 matched GitHub; synthetic mergeeb39861e148753d48c987e85e76ef0af17cb4278 had the same tree and parents main890 plus30c. [Publication receipt](https://github.com/Jetnity/jetnity/pull/1178#issuecomment-6758032330).

[CI42748744481](https://github.com/Jetnity/jetnity/actions/runs/42748744481), attempt1, is terminal FAILURE, updated03:33:58UTC. Root independently retrieved the full non-Auth Repository verification129607034059 log and terminal run/jobs. Author and independent auditor matched the full log hash.

| Evidence | Actual result |
|---|---|
| Candidate SQL |a22e6a015c8fc5a268500659ace31a938d2ce3614625e9df1982308b73199a59 |
| N01 |PASS,23ms |
| N02 |PASS,1134ms, including R13/R14 assertions |
| N03 |PASS,1532ms, actual durable command/replay/independent-subject paths |
| N07 |FAIL: assert.ok(parsed.ok), native.ts662:61, ERR_ASSERTION |
| Later groups / R9 |27 groups not reached; neither native R9 witness present |
| Receipt |proof_4:N07 / assertion_failed; nativePassfalse |
| Core |8662 total /8658 pass /2 fail /2 skip /0 cancelled |
| Lifetime |2297 started /2297 settled /0 pending |
| Connections / clusters |426/426 cumulative connections closed;1/1 cluster stopped;0 children |
| Total / cleanup |5954ms /155ms;0 cleanup failures |
| Six sibling jobs |SUCCESS |
| Aggregate129611926295 |FAILURE |
| Typecheck / lint / hygiene / build |success /success /skipped /skipped |

The two core failures are N07 and its mandatory parent. Cleanup covers only executed work, not later concurrency bounds. Both R9 native cases remain unexecuted despite separate successful unit cases.

[Safe exact failure excerpt](M04_RECOVERY_R15_NATIVE_FAILURE_V6.txt). Full log4,229,678characters /4,238,896UTF8bytes /63,024lines, SHA256`ee6012947a9e9faf770af914c21847274609d25ee588a8ebc12e12a612d65e0f`; excerptSHA256`a2ee42f676bc220b4d31b50346ebd7f52d1d89376ce3213fe7d833390373771f`. No Auth logs were accessed.

## Source-confirmed cause and review

Root read the complete failing N07 block, protected S0 context schema and protected original fixture builder at exact30c. The old block changes only citizenship.countryCodes to CH/DE/FR; passport relatedCitizenshipCountryCode remains CH. S0 explicitly requires a non-null related citizenship to equal the sole scope citizenship. Rejecting the DE/FR variants is therefore correct. The log itself reports the assertion and false parser result, not this explanation or a loop-index receipt.

The same author now uses the existing coherent builder with explicit original destination and common age18 conditions. The former invalid DE/FR objects remain explicit negative checks. Bounded sets require all three actual context keys and job keys to differ, with final cardinality3.

Root and independent reviewer /root/m04_r9_review_g2 reconstructed both unique replacements and matched:

- native.ts140353bytes, SHA256`a1e16286e9114b9a07271ddf4b9879f0714ad15295212dfe7016c157c2685dea`, Gitblob`36e8ebe0989980538470e6f794108d1c923bce6c`.
- All18sourceaggregate`a21b19390e4e1b3d49022cb7a86848568c4439eff3c39e4963131331e93d1da0`.
- All17 other source files unchanged, including SQL/rollback.
- Entire producer and downstream native assertion body byte-identical: three original number spellings, actual S1/I1 processing, exact stored original bytes, prepared outcome, completed disposition and succeeded job.
-31 native groups remain required; no skipped/collapsed variant.
- Same-family scan found no second positive direct country/passport mutation defect; the other mutations are intentional negative fixtures.

Protected fixture, schema, reader, runtime and SQL are unchanged. This is a fixture correction with retained meaningful negative/positive checks.

**Disposition: corrected source accepted for publication and complete new CI only. No native or overall Technical-Lead PASS.**

## Actual progress and first unfinished step

N02 now has a complete actual passing group receipt on30c, including R13 denied-USAGE/restricted-runtime/same-OID drift/restoration and R14 strict alternate/real forgery cases. N03 also passed actual durable command, replay, independent subject and dedup checks. This supersedes the earlier limited sequential-prefix inference as evidence for historical30c only.

M04 is still unfinished: N07 failed and27 later groups were not reached. All five failure histories—d9 setup,7ac42601,82b42501,313c alternate fixture and30c context fixture—remain intact. New R15 source has not executed.

**First unfinished step:** publish finite R15 on expected30c, verify exact tree/blobs/ancestry, then inspect complete unchanged new CI: all31 groups, both native R9 witnesses, actual resource/process completion, whole core/hygiene/build/companion jobs, exact Preview and refreshed main/Guardian/rules/reviews/gates. Failure returns to the same author; no unchanged-known-bad rerun.

## Live baseline, capability and sessions

Main/merge-base remained890dfe9323b4b6d3644c372d81cb8893b6548d11, tree8c611ec31d518cce88a3a5abb75aecf6620d794c. Failed30c ahead7/behind0,83files. Exact Preview dpl_H6TUpumpHG5Esa5QGLa8VWUbKjA4 READY, aliasErrornull. Root freshly re-read both Production aliases at03:23UTC: READY dpl_7K4gHmn2d2HBqCq1CHBThRjAXHw7/exactmain890. MainCI42736015143 had all8jobs successful. No M04 Production/hosted acceptance follows from these baseline metadata.

Root re-read14openPRs/allDraft and48open non-PRissues, strict active ruleset21875372 with no bypass, zero formal/inline GitHub reviews/threads and zero unresolved Vercel branch threads. #1139/#917 gate issue timestamps remained unchanged. Root findings still bind even when review-thread lists are empty. [Auxiliary gate receipt](https://github.com/Jetnity/jetnity/pull/1178#issuecomment-6758081204).

Sole writer **Jetnity Official Truth V3 Durable Jobs1 — Codex Generation2**, /root/m04_durable_jobs_writer_g2, same actual session. Reviewer /root/m04_r9_review_g2 and CI auditor /root/m04_live_audit_g2. Original G1 unavailable; no invented Cursor continuity. Root alone publishes/PASS/Ready/merges.

Shell access returned03:21UTC, but the original checkout is absent. Only pwd and read-only git status were attempted; no recreation/clone/fetch or local project execution. In-session JS performs text/hashing only. Previous64/64local checks remain historical. Native only unchanged existing CI.

Preserve #1180atlas/#1179booking and all22 omitted binary IDs. D1#1169 remains separate Draft/unfinished; no automatic next slice.

## Risks and unchanged gates

- P0: no new verified production incident; no hosted state inferred.
- P1: failed N07 plus unexecuted native/R9/full-CI obligations still block Ready/merge.
- P2: later runtime paths and rollback/race matrices remain unexecuted; dormant code is not method approval or operational release.
- P3: original local checkout absent; exact remote checkpoints preserve continuity.

Method **NOT_APPROVED**. #1139 **NOT_RELEASE_READY**, pre-Owner gaps E01, E04, E06, E07, E09, E10, E11, E13, E15, E16, E17, E18, E21, E22, E24, E25, E28. #917 specifically refused independent readback remains pending, ledger UNKNOWN, Stage2 NOT_ATTEMPTED: no retry, rephrasing, delegation, rerouting, transport switch, human SQL substitute or renewed old Owner evidence request. #1131 Ready STOP; both #1135 holds; #968 preview isolation and #911/#913 privacy remain.

No hosted DB/Auth/RLS/ACL/migration/credential action or Auth-log access, real source/provider/research call, scheduler, notification, new cost or public V3 activation. No local PostgreSQL/native/socket execution, installation/download, missing binary retrieval, local full build or alternate execution environment. Native proof only in the unchanged existing GitHub CI. No git fetch/push; if local git becomes available, reads require GIT_NO_LAZY_FETCH=1. Preserve all 22 omitted binary IDs. No automatic follow-up product slice.
