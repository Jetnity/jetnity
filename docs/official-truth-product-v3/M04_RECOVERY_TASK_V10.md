# M04 Recovery — Task V10 / R19 scalar-leaf processing

**2026-11-10 06:14:35 UTC. Finite same-session implementation correction; Draft #1178.** Original Task V1, frozen Plan/Phase-A/T01–T03 and Tasks V2–V9 remain binding except this precise local correction.

[Diagnosis](https://github.com/Jetnity/jetnity/pull/1178#issuecomment-6760204443) · [finite implementation authorization](https://github.com/Jetnity/jetnity/pull/1178#issuecomment-6760293239) · [prior publication](https://github.com/Jetnity/jetnity/pull/1178#issuecomment-6760005909)

## Baseline and actual failure

Published baseline **f29ff3914f6731789f03970e1263a82b93844e3c**, tree **98a8b38b1f7d95fb2cd788dd347490d36f33a772**. Main/merge-base **890dfe9323b4b6d3644c372d81cb8893b6548d11**; ahead **11** / behind **0**, **99 PR files**. PR #1178 remains Draft; current mode NORMAL. Later live state takes precedence.

Root independently confirmed terminal [CI 42763390608](https://github.com/Jetnity/jetnity/actions/runs/42763390608), attempt 1, **FAILURE**, last updated 05:51:36 UTC. Repository job **129654116009** and aggregate **129658414629** failed; all six companion jobs passed. Typecheck/lint passed; Tests failed; hygiene/build were skipped.

The first **23 ordered native groups**, new R18 N02/N03 regressions and both actual R9 witnesses passed. Their group times sum to **85796 ms**. Group 24 **N05/A03** again reached the unchanged global **240 s effect deadline**, after **153758.244793 ms** in that group. Seven later groups were not reached. NativePass false; the later inherited-boundary witness is absent.

Actual quota progress: zero-based last started index **240**, last completed **239**; **241** command constructions resolved, aggregate rounded client-await time **427 ms**. **242** fixed calls started / **241** resolved including the initial absent probe, aggregate **153556 ms**. **240 command calls returned committed**; the next call did not return a successful result. Its final database outcome is not inferred. No START reservation and no 64/65 cycle occurred. These elapsed sums include client transport, waiting and rounding; they are not per-function profiling, exact additive CPU costs or a measured speedup.

Core: **8682 total / 8678 pass / 2 fail / 2 skip / 0 cancelled**, **649469.896049 ms**. Cleanup: **27042/27042 settled, 0 pending, 4242/4242 cumulative connections closed, one stopped cluster, 0 child processes/errors; 240339 ms total / 22 ms cleanup**. The two failures are N05/A03 and its enclosing mandatory native test. The two inherited layout skips are not M04 proof skips.

Complete terminal non-Auth log: **4250826 UTF-8 bytes / 63142 lines**, SHA256 **63cdb80bd138389acb0fe6efbe52b5b54e0db6c502245dc252f687d726d59b91**. [Bounded exact excerpt](M04_RECOVERY_R19_NATIVE_FAILURE_V10.txt): **5243 bytes**, SHA256 **9cd7474ff7eeb6094663fc3b7bc5c2ad573b3eec7877f6d6a43f86dbc457055e**. Root read the complete log independently; the live auditor's terminal monitor read metadata only.

## Finite authorized scope and equivalence

Only the bodies of **canonical_v1(jsonb,integer)** and **nodes_v1(jsonb,integer,integer,integer)** change. Within their existing object/array loops, simple scalar children are processed with the identical original rules in the current invocation; nested containers still recurse. Root guards and scalar root behavior remain unchanged.

Canonicalization retains child depth validation, key validation before child processing, C key order, array order, ASCII restrictions, exact to_jsonb string escaping, integral/safe-number checks with trunc(numeric)::text, Boolean/JSON-null formatting and the original P7601/message. Node counting retains SQL-NULL/invalid-argument rejection, JSON-null as one node, the separate object-key weight, array weights, depth and node-cap checks, and -1 propagation. Empty containers at the maximum depth remain valid; scalar children beyond that depth remain invalid. Nodes does not acquire new ASCII/numeric-domain rules.

The original full-history scans, command/transition checks, catalog checks, API/transaction flow, locks and final S1/MA1/deadline authority remain byte-identical. R18's command/dedup reuse remains unchanged. All **29 signatures**, function attributes, roles/grants/inventory, other SQL function bodies and rollback remain unchanged. No cache, trust flag, new helper/object/index or skipped history row is introduced.

Existing N02 contains finite direct tests of the actual installed helpers with independent expected bytes/counts, including root and both object/array child paths, SQL NULL versus JSON null, invalid/NULL parameters, exact depth and node limits, empty-container boundaries, C ordering, escaping, control/non-ASCII rejection and raw-text numeric normalization/safe endpoints/fractions. Existing R18 N02/N03, corrected age 68 fixture, all **31 groups**, both R9 cases, real quota histories/credit/token/fences, bounded progress records, ownership/cleanup and time/resource limits remain unchanged outside that insertion.

Source-derived cost model: each new successful command checks n-1 history rows before its effect and n afterward. From an initially absent subject, N successful fills require N² historical row visits; the first 240 acknowledged fills imply 57600 completed row validations before the interrupted next call. Each row repeatedly reaches recursive canonical/node helpers through commands, envelopes, jobs and identity. Scalar-leaf inlining reduces function entries throughout those paths while still processing every scalar and history row.

The relevant existing subject/operation/attempt indexes cover the lookup keys structurally. There is no observed query plan or established missing index. Function-entry reduction is not a measured time reduction. Whole-history work remains quadratic; full-cap Rule latency, Production capacity/SLO and success within 240 s remain unproved until their applicable evidence exists.

Only the two named SQL bodies, the finite native N02 insertion and four author evidence files are author scope. Root owns Task V10, review/evidence, current pointers/Handoff and publication.

Sole implementation author: **Jetnity Official Truth V3 Durable Jobs1 — Codex Generation2**, /root/m04_durable_jobs_writer_g2. Immediate fixes stay in that same actual session. Independent source reviewer /root/m04_r9_review_g2; independent source/live auditor /root/m04_live_audit_g2. Original Generation1 is unavailable; no Cursor/session continuity is invented. Author self-review is never TL PASS. Root alone publishes and grants PASS/Ready/merge; author STOP after finite delivery.

## Acceptance and environment

At this explicitly pre-publication snapshot, first finish Root expected-head publication of the independently reviewed finite R19 files, then read back every changed blob and the complete tree/ancestry. The automatic unchanged CI on the resulting exact head must complete all **31 native groups**, both actual R9 witnesses, the real **254/255/256 and 64/65 boundaries**, inherited-boundary witnesses, complete resources/process cleanup, Core/Hygiene/Build and every companion job. Refresh main/merge-base/diff, exact Preview/Production, reviews, mode/Guardian/rules and Owner gates before deciding Ready/merge. Any new head invalidates older exact-head acceptance. A concrete failure returns to the same author; no unchanged-known-bad rerun. Later PR publication/CI receipts and live evidence supersede this snapshot.

Unchanged budgets: **240 s effects + 60 s cleanup / 300 s total**; four outer lanes and four native operations per family, eight active native / 256 total with 16 terminal admissions reserved, eight callbacks / 128 total, 30 s outer / 5 s child, three clusters / two children / 40 aggregate work connections / two M04 observers / one method observer / 16 fixture connections per cluster.

Original checkout /workspace/scratch/01cbe1264212/jetnity-v3-durable-jobs is absent. No checkout reconstruction/clone, installation, missing-binary retrieval or local project/parser/SQL/native/socket/build execution occurred. In-session JavaScript performs text/data inspection and independent hashing only. Earlier local 64/64 checks remain historical. Native execution is confined to the unchanged existing GitHub CI.

## Gates

Method **NOT_APPROVED**. #1139 **NOT_RELEASE_READY**, pre-Owner gaps E01, E04, E06, E07, E09, E10, E11, E13, E15, E16, E17, E18, E21, E22, E24, E25, E28. #917 specifically refused independent readback remains pending, ledger UNKNOWN, Stage2 NOT_ATTEMPTED: no retry, rephrasing, delegation, rerouting, transport switch, human SQL substitute or renewed old Owner evidence request. #1131 Ready STOP; both #1135 holds; #968 preview isolation and #911/#913 privacy remain.

No hosted DB/Auth/RLS/ACL/migration/credential action or Auth-log access, real source/provider/research call, scheduler, notification, new cost or public V3 activation. No local PostgreSQL/native/socket/parser/project/build execution, installation/download, missing binary retrieval, clone/reconstruction or replacement environment. Native proof only in unchanged existing GitHub CI. No git fetch/push; any local git reads require GIT_NO_LAZY_FETCH=1 and GIT_OPTIONAL_LOCKS=0. Preserve all 22 omitted binary IDs. No automatic next product slice.
