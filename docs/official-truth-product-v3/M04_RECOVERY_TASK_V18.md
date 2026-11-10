# M04 Recovery Task V18 — R27

**2026-11-10 15:41:16 UTC: CHANGES REQUIRED R27 / Recovery Task V18, implementation v2.** Independently source/document-reviewed pre-publication snapshot. The prepared R27 correction has not executed. PR #1182 remains Draft; no current native/TL PASS, Ready, merge or actual-main acceptance. Later exact-head live evidence supersedes this snapshot.

[Draft #1182](https://github.com/Jetnity/jetnity/pull/1182) · [Root R26 failure / R27 investigation v1](https://github.com/Jetnity/jetnity/pull/1182#issuecomment-6771031785) · [binding implementation v2](https://github.com/Jetnity/jetnity/pull/1182#issuecomment-6771362923) · [actual R26 lifecycle success](https://github.com/Jetnity/jetnity/pull/1182#issuecomment-6770954619)

Published blocked baseline head **b8415a5f349a258f99109435ac174c9ed5b7a259**, tree **bf5f7c0e826fcfcb1218178c31b7b28336c9189a**, sole parent **45be21e57988d91dca3ee0758712f3ef5f39d744**; ahead **5**, behind **0** of actual main/merge-base **4bfa8b466ebc0af761fc5050bb4c51d7e73400c7**, tree **793026a2c26725da06ff281924aaa561d43ee32f**. #1178 is historically MERGED after genuine R21 PR acceptance; the later actual-main failure remains independently true and unresolved. #1182 is the same immediate dormant post-merge repair.

## Actual R26 execution and preserved history

[CI 42839339313](https://github.com/Jetnity/jetnity/actions/runs/42839339313), attempt 1 / pull_request, completed FAILURE, updated **2026-11-10T15:11:27Z**. Root independently observed Repository job **129910026311** terminal FAILURE at **2026-11-10 15:10:43 UTC** before reading its completed non-Auth log; the complete eight-job terminal state was observed at **15:13:42 UTC**. Six jobs succeeded; Repository verification and aggregate **129918492076** failed. Typecheck/Lint passed; Tests failed; later hygiene/build skipped.

**24/31 groups passed**. N02 old and new fixed oracles, both actual R9 race/drain witnesses and the complete 254/255/256 ledger boundary passed. First 23 groups total **81958 ms**; ledger receipt **89735 ms**, test duration **89732.148034 ms**. Ledger lastStarted/lastCompleted **253/253**, requests **258/258**, fixed calls **260/260**, command calls **258/258**, **256 ACKs**, **1 START**.

Group 25 N05 failed after **67874.463317 ms** with **M04 240s effect budget exceeded**. Cycle started/completed indexes **50/49**, requests **152/152**, fixed **203/202**, command calls **152/151**, **151 ACKs**, **50 START/reservations**. The following unacknowledged fixture-database outcome remains **UNKNOWN**.

Complete cleanup: **27438/27438** settled, **4242/4242** connections closed, **0** pending/children/cleanup errors, one cluster stopped; **240348 ms** total, **16 ms** cleanup. Core **8683 tests / 8679 pass / 2 fail / 2 inherited skips / 0 cancelled**, **646060.30101 ms**. Log **4251751 bytes**, SHA256 **067633a068fcf83d5a9c9e7216ab177b7cb114a69a289ec4e8ff3ec56c033024**. Compact receipt **3814 bytes**, SHA256 **88acd57cdfde50baaeaea4957c6506a017dece854f928ba1c8bfa2028d555b8e**.

The unchanged separate R26 lifecycle job **129910026216** passed all **4** tests and all **13** actual mounted stages; **61/61** observations settled, **0** pending/retained bytes/errors, **22** actual current native results, **0** source fetches during reads. Root read its completed non-Auth log only after terminal SUCCESS at **15:07:23 UTC**. Log **177393 bytes**, SHA256 **f488d548c2353cab2c77bf0f21c1b13e9ea8718cdf19acab7879257309c48b9e**. The earlier R25 lifecycle failure cause remains UNKNOWN; no runner/flakiness inference or unchanged rerun is asserted.

R26 is the **17th actual failed run**. All **16** prior failure objects, the genuine full R21 success, the original R22 in-progress observation plus separate corrected terminal observation, and prior V13–V17 source/review/receipt records remain unchanged. [Pinned complete prior evidence](https://github.com/Jetnity/jetnity/blob/b8415a5f349a258f99109435ac174c9ed5b7a259/docs/official-truth-product-v3/M04_RECOVERY_R26_EVIDENCE_V17.json). Complete current failure, all group/race/quota/cleanup fields and lifecycle receipt are in the V18 JSON and sanitized excerpt.

## Selected bounded implementation

Exactly one body changes: `official_v3_jobs_private.nodes_v1` DECLARE through END. The original entry guard, function declaration and all attributes stay exact. A bigint count forms the immediate minimum: objects `1 + 2*K`, arrays `1 + N`. Every actual container child is still recursively checked with the same d+1/max_d/max_n and contributes m−1. Every scalar value and object key is counted. Nonempty depth-boundary containers refuse before the child filter; empty ones remain valid. The count is capped before integer assignment; later sums stay at most131071 before the existing cap refusal. Every caller, canonical, history, command, transition and authority statement remains exact. No lease/expiry staging or cross-call state is included.

Queued Discovery child-loop iterations change23→2 and leased27→3 while recursive container calls remain. Object counting adds a key-list scan/allocation and aggregate query; SQL child filters still receive fully materialized jsonb_each/jsonb_array_elements values. These countercosts are retained in the review, not treated as free. No aggregate history-invocation estimate is asserted.

## Additive fixed native oracles

One1818-byte additive N02 block named `r27NodeCases`, directly before the existing R20 timestamp comment. Exactly12 awaited owner SELECTs use the existing four-parameter NULLIF/text transport and fixed literal expectations. Cases: scalar object33/cap32, scalar array17/cap16, early and late mixed-container objects11/cap10, nested mixed array8/cap7, later depth failure and counted empty/control/Unicode keys7. Existing R19 SQLNULL/scalar/depth/cap matrix and all R20–R26 oracles remain byte-exact. No new helper, connection, group, fixture or bound.

Source-derived operation counts are not runtime measurements. No reliable speedup, budget margin, general latency or Production SLO is claimed.


## Frozen boundaries and Owner gates

240 s effects + 60 s cleanup / 300 s total; four outer lanes and four native operations per family; eight active native / 256 total with 16 terminal admissions reserved; eight callbacks / 128 total; 30 s outer / 5 s child; three clusters / two children / 40 aggregate work connections / two M04 observers / one method observer / 16 fixture connections per cluster.

Method **NOT_APPROVED**. #1139 **NOT_RELEASE_READY**, pre-Owner gaps E01, E04, E06, E07, E09, E10, E11, E13, E15, E16, E17, E18, E21, E22, E24, E25, E28. #917 specifically refused independent readback remains pending, ledger UNKNOWN, Stage2 NOT_ATTEMPTED: no retry, rephrasing, delegation, rerouting, transport switch, human SQL substitute or renewed old Owner evidence request. #1131 Ready STOP; both #1135 holds; #968 preview isolation and #911/#913 privacy remain.

No hosted DB/Auth/RLS/ACL/migration/credential action or Auth-log access, real source/provider/research call, scheduler, notification, new cost or public V3 activation. No local PostgreSQL/native/socket/parser/project/build execution, installation/download, missing binary retrieval, clone/reconstruction or replacement environment. Native proof only in the unchanged existing GitHub CI. No git fetch/push; any local git reads require GIT_NO_LAZY_FETCH=1 and GIT_OPTIONAL_LOCKS=0. Preserve all 22 omitted binary IDs. No automatic next product slice.

SQL remains **UNAPPLIED**. Deployment READY proves neither hosted schema nor native acceptance. No signature/LANGUAGE/attribute/search_path/ACL/role/predecessor/rollback change; no history omission, seed, reduced quota/group, raised budget, workflow/package change, cross-call cache, trust marker or broad command/history/transition rewrite. All older direct oracles remain. D1 #1169 and unrelated PRs remain separate.

## First unfinished step and acceptance sequence

1. Root alone publishes the reviewed source/document set to the existing branch with expected-head **b8415a5f349a258f99109435ac174c9ed5b7a259**, no force, then reads back the complete commit/parents/tree and every changed file. Preserve all unchanged leaves and all 22 binary IDs.
2. Complete unchanged new exact-head CI: all eight jobs, 31 named M04 groups, both R9 witnesses, complete ledger and 64/65-cycle boundaries, exact inherited 761 pairs/minimumOwned4182, final rollback/late-writer, full cleanup, Core with only two inherited skips, hygiene/build, and unchanged lifecycle. No unfinished or old-head result counts.
3. Independently recheck actual main/merge-base/ahead/behind/diff, exact Preview, reviews/threads, strict rules, NORMAL mode, Guardian and existing permitted Owner gates. Only Root can record TL PASS, set Ready and merge the expected exact head.
4. After merge, actual new main must independently pass full CI/native and both Production aliases must resolve to its exact READY deployment. PR success cannot substitute.
5. Only then prepare the finite docs closure; gate its own exact head and its resulting actual main, record final receipts on existing PR/status without another source commit, and STOP. No automatic next product slice.

If any gate fails: CHANGES REQUIRED, same author/session immediate fix, new head and full re-gating. No unchanged known-bad rerun.

## Actual authorship and continuity

Author **Jetnity Official Truth V3 Durable Jobs1 — Codex Generation2**, actual session `/root/m04_durable_jobs_writer_g2`; independent reviewer `/root/m04_r9_review_g2`; metadata auditor `/root/m04_live_audit_g2`. These are actual Codex G2 sessions, not an invented Cursor session. Author/reviewer self-review never grants TL PASS. Only Root publishes/sets Ready/merges. Author delivery STOP is preserved after the named task.

Original checkout `/workspace/scratch/01cbe1264212/jetnity-v3-durable-jobs` remains unrecovered; no replacement project environment, local execution or reconstruction was used. Live GitHub immutable source and pure text/data checks establish source pins; runtime evidence comes only from unchanged CI.
