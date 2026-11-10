# M04 R35 / Recovery V26 v2 — Root source review and publication contract

Snapshot: 2026-11-10 23:45 UTC. This is a pre-publication record. Later exact-head live receipts take precedence.

## Decision and first unfinished action

Published R34 is **CHANGES REQUIRED**, terminal failed observation 27. Root selects the exact V26 v2 source correction for one new publication on existing Draft PR [#1183](https://github.com/Jetnity/jetnity/pull/1183). Author, independent source reviewer and Root agree on the complete source bytes. This is **source review only**: R35 has not executed, there is no runtime PASS or Technical-Lead-PASS, and Ready/merge remain forbidden until all gates succeed.

First finish the immutable ten-file package, read back its complete contents/tree/diffs and 18-source aggregate independently, and recheck fresh main/head/ref/reviews/rules/mode/Owner/deployment gates. Only Root may then update the branch non-forcibly with the expected old head. The resulting new head requires the full existing CI and Preview gates. A genuine PR PASS must be followed by actual merged-main CI/native/Production acceptance; the separate finite eight-path documentation completion remains HELD until that actual-main PASS.

## Binding task and actual sessions

- [V26 v1 / complete failure 27 and investigation](https://github.com/Jetnity/jetnity/pull/1183#issuecomment-6781871324).
- [V26 v2 / selected exact implementation](https://github.com/Jetnity/jetnity/pull/1183#issuecomment-6782348018), published 2026-11-10T23:38:14Z: 23,065 UTF-8 bytes, SHA256 `d7dafe580ab5036c077d52a0b612639b61d5066111b6dd14816c87d07efb5b75`.
- Actual author: **Jetnity Official Truth V3 Durable Jobs1 — Codex Generation3**, same session `/root/m04_durable_jobs_writer_g3`.
- Independent source reviewer: `/root/m04_recovery_source_review_g3`.
- Current independent CI/live/cost auditor: `/root/m04_recovery_live_audit_g3`.
- Historical `/root/m04_recovery_ci_audit_g3` is not represented as a resumed current session.

The author read the full binding amendment twice, reconstructed its four literal old/new blocks, confirmed exact inversion, and delivered the same complete source and 18-source aggregate. The independent reviewer separately read the full amendment and reconstructed the same bytes. Root separately performed the complete text, invariant and source-mechanism review. Author self-review is not TL-PASS. Any immediate review fix returns to the same actual author/session under an explicit versioned instruction; a changed head invalidates earlier exact-head gates.

## Baseline and immutable source identity

Main and merge-base: `e7aae86c18238033c2186722e24c84dc7a5f69b9`, tree `8918d48841c19ddaf16c128973a0f03eed481f43`.

Expected sole parent: `212e4260a417f795720f050b9d7b4e0bbf74593e`, tree `8999dbc7267ccc579ca4fb0812a1b809fd3cfc76`, branch `fix/official-truth-v3-m04-postmerge-r30-20261110`. Baseline is 5 ahead, 0 behind, 23 cumulative paths. R35 must add exactly ten paths relative to this parent, seven modifications and three new records, producing 6 ahead/0 behind and 26 cumulative PR paths if main remains stable.

Selected `scripts/db/official-truth-v3-durable-jobs-1/jobs-candidate.sql`:

| Identity | Exact value |
|---|---|
| UTF-8 bytes | 158670 |
| SHA256 | `0221d673c11c8206c56037f8cddeeae5b6eb765c1c9ed44a9bebf548f7ab429b` |
| Git blob | `f7d2e523f940a2f2101400c7cab13b59d258f473` |
| Growth from R34 | 4097 bytes |
| 18-source aggregate | `797462a57f2ae4d720e11ccdcb46b50bdc779808481a80176c6784ecbfdaee8a` |

Only two exact spans inside `canonical_v1` change. The declaration span grows from 211 to 773 bytes. The OBJECT branch grows from 2525 to 6060 bytes. The task and JSON preserve all four literal blocks and their independent pins. Applying the inverse restores the entire R34 file exactly.

All 29 function declarations/attributes, the other 28 complete function chunks, all bytes outside `canonical_v1`, and its original 1695-byte ARRAY/root-scalar suffix remain identical. All other 17 M04 sources are frozen. Native remains 191098 bytes/SHA256 `f5d849c643ff22d264bc9adc1a7cd65f12caaac80a804647604851f22effbde0`; rollback remains 6175 bytes/SHA256 `9b9089d74242a802455cc7e3fb8a0a8515c17b61b45ae730b9bbba1adb650a66`. No fixture, workflow, test, dependency, protected manifest or budget is changed.

## Correctness of the selected traversal

Recursive OBJECT calls become local traversal using typed text/jsonb/integer arrays. ARRAY recursion and scalar handling remain unchanged. The original aggregate expression is retained at the root and child sites; after only indentation and depth/output-variable normalization, each exactly reproduces the same 802-byte original expression, SHA256 `e9de89e1e641218b2e7b4e22d3e269891fcdebdee7b536bf151b4a6167b9be3b`.

At each object, the original one-shot `array_positions(parts,NULL::text)` preserves pending positions in the same order. The original key check runs before the depth check and before reuse. The same-parent retained-object comparison remains raw text under C collation; no global or cross-request memo is introduced.

An uncached object child first receives the original entry guard and aggregate once. If it has no pending positions, its canonical text completes immediately and updates the parent's retained child/result. Otherwise the code saves the parent's four typed payload arrays and three integer descriptors, adopts the already prepared child arrays, resets that child's memo and traverses it. It does not aggregate the child again.

On completion, the code restores exactly one active parent frame, restores its original pending cursor, decrements current depth once, records the successful child/result in the parent's memo, fills the original pending slot and advances once. A parent's older memo need not be saved: the successful uncached object return replaces it, while a failure exits the invocation. ARRAY child calls leave the parent memo intact.

Root checked these invariants:

1. Current depth equals entry depth plus active object frames; the original general depth-24 guard remains authoritative.
2. Each payload stack consists of exactly the active parent segments. Frame lengths/cursors are written before incrementing stack level.
3. The pending cursor always identifies the next original deferred slot. A flat child never changes parent depth or stack payloads.
4. Inactive descriptor tails cannot be read; every subsequent push writes all three descriptors at its active index.
5. Typed slices and concatenation preserve JSONB raw numeric representation and SQL NULL positions; JSON null is the text `null`, not a pending SQL NULL.
6. Scratch `e`, string and number values are not needed after a child returns until reassigned. No code consumes `FOUND`, and caller-local `FOUND` is not altered by this function's local bookkeeping.
7. Original key sorting, regex collation, numeric/string/depth refusal branches and successful output order remain.

The conclusion concerns ordinary values, refusals and order. Diagnostic exception context/source positions, allocation-failure order and peak RSS are **not** claimed identical.

## Why this addresses a different cost

Root read the pinned PostgreSQL sources at commit `c372fbbd8e911f2412b80a8c39d7079366565d67`. The JSON records exact source blobs.

- [fmgr.c](https://github.com/postgres/postgres/blob/c372fbbd8e911f2412b80a8c39d7079366565d67/src/backend/utils/fmgr/fmgr.c): non-null function configuration routes calls through the configuration wrapper even for SECURITY INVOKER. Per-call GUC setup/restore remains distinct from query-cached metadata lookup. Function attributes/search_path are preserved.
- [pl_exec.c](https://github.com/postgres/postgres/blob/c372fbbd8e911f2412b80a8c39d7079366565d67/src/pl/plpgsql/src/pl_exec.c): an already-in-use cached simple expression cannot take the ordinary simple-expression path. This is a mechanism, not a measured claim that every removed call incurs the fallback.
- [array_userfuncs.c](https://github.com/postgres/postgres/blob/c372fbbd8e911f2412b80a8c39d7079366565d67/src/backend/utils/adt/array_userfuncs.c), [arrayfuncs.c](https://github.com/postgres/postgres/blob/c372fbbd8e911f2412b80a8c39d7079366565d67/src/backend/utils/adt/arrayfuncs.c), and [arraysubs.c](https://github.com/postgres/postgres/blob/c372fbbd8e911f2412b80a8c39d7079366565d67/src/backend/utils/adt/arraysubs.c): typed slices preserve datum/null-bitmap representation; nonempty slice lower bounds are one, empty slices are non-null empty arrays. Concatenation/slicing have real copying costs. Repeated `array_position` with a start index still traverses the prefix internally; that variant was discarded.

The selected code retains the original single `array_positions` call per visited object. The two earlier in-memory stack variants were never published or executed and their hashes are not the selected source.

## Complete quota model and countercosts

Root independently reconstructed abstract object shapes and multiplicities from the immutable native quota traces and SQL call sites, using only in-session data arithmetic. No project function, parser or SQL was executed.

| Scope | R34 canonical entries | R35 external entries | Removed recursive entries |
|---|---:|---:|---:|
| Ledger history | 603788 | 202283 | 401505 |
| Ledger outside history | 18394 | 6974 | 11420 |
| Cycles history | 1094436 | 332816 | 761620 |
| Cycles outside history | 21016 | 6520 | 14496 |
| Total | 1737634 | 548593 | 1189041 |

This is a 68.4287% reduction in counted function entries for those two complete quota traces, not measured elapsed time. All 116351 queue rows, 16517 starts rows, current-job/authority checks, 1682930 object aggregates and 9243141 member slots remain. Counts include the full 64/65 cycle proof and expected refusals, not only R34's incomplete prefix.

Flat completion avoids 646694 suspensions; 542347 nonflat suspensions remain. Added costs include 2169388 payload-concatenation sites, 4338776 payload restore/truncate slice sites and 1627041 indexed descriptor writes: 8135205 array-operation sites in total. The nominal four-payload output accounting is 43218116 element slots. Seven empty-stack declarations per 548593 entries add 3840151 initializations. These are logical counts, not physical allocation, traffic, memory or timing measurements.

Prepared child arrays can retain one completed/prepared snapshot until another uncached child preparation overwrites them. Current, stacked, prepared and transient old/new representations all matter. Quota stack maxima are four active frames, 30 saved member slots and nine saved pending positions; those do not bound active/prepared/transient memory and do not change the generic depth guard. Integer descriptors can retain inactive tails up to the reached depth.

All 520 quota API catalog checks and 20800 definition hashes remain. The 4097-byte source growth adds 2130440 definition-input bytes to those checks. This is not a whole-native API count. The unchanged R34 history-map accounting still includes 3232985 prefix-entry units and nominal raw-key upper accounting of 2822395905 bytes; it is not measured traffic.

History remains quadratic. There are now two aggregate statement-plan sites, although each visited object executes exactly one aggregate. Saved R34 validations are not counted again. No measured net gain, memory improvement or 240-second PASS is promised. Other 29 native groups, ARRAY-bearing inputs, transport, scheduling, locks, MA1 time, installation and cleanup are outside these quota arithmetic totals.

## Complete R34 failure 27 remains

[CI42918105407 / run4095 / attempt1](https://github.com/Jetnity/jetnity/actions/runs/42918105407) is terminal FAILURE, updated 2026-11-10T23:06:27Z. Its synthetic checkout `b8bf0b6571d820d83e4b46ceddbf5a88f5aa1275` has ordered parents [e7,212e] and exactly the R34 tree.

Root personally read all eight terminal job metadata records before the seven permitted non-Auth logs. Auth was metadata-only. Native completed 24/31 groups: first 23 totaled 98455 ms and the full 254/255/256 ledger passed in 65453 ms. N05 exceeded the unchanged 240-second effect limit during cycle_enqueue, with zero-based step52 started/51 completed, 52 START reservations, 156 ACK, 157/156 command calls and 210/209 fixed calls. The next unacknowledged ENQUEUE outcome is UNKNOWN. Full 64/65, pointer refusal, inherited 761/minOwned4182 and groups26–31 were NOT_REACHED.

Native elapsed 240400 ms including 42 ms cleanup; 27298/27298 operations settled, 4242/4242 connections closed, 1/1 cluster stopped and zero pending work/children/cleanup failures. Both actual R9 drain/backend-departure witnesses passed. Native JSON is 3818 bytes/SHA256 `362133f70daa42a8d4462cfbe23f9aa8eab06c8853a05ed5b0ff9b1a8e606691`.

All six companion jobs passed: persisted1/1/95 events; store4/4/39 events; lifecycle4/4/29 events with actual mounted13 proofs and61/61 observer cleanup; atomic1/1/151 events and30 complete negative rollbacks; UI50/50 with12 layouts,11 interactions and10 screenshot assertions; Auth metadata PASS. Complete matrices, seven full-log pins and all eight job IDs are retained in the JSON. UI artifact13808959725 has15 files/3740086 bytes and the exact recorded digest; metadata was checked, no archive download or independent image-inspection claim.

Core:8697 tests,8693 PASS,2 FAIL,2 inherited skips,971 suites,0 cancelled. Typecheck and Lint passed; five hygiene checks and Build were skipped. These are failed acceptance gates, not a partial PASS. All 27 failed observations and genuine R21/R29 PR successes remain preserved. e7-main attempts1/2 share a run ID; attempts are distinct observations, not distinct run IDs.

## Coverage, risks and fresh live state

Native stays frozen. Existing fixed-byte, SQL NULL, depth, numeric/escape, C-order, mixed ARRAY/OBJECT, retained-object, invalid-key-before-reuse and maximum-valid N02/U04 oracles remain mandatory. No new exhaustive 24-frame, stale-descriptor or fanout oracle is added. Prior cache-cap, alternating-subject and malformed-persisted-envelope coverage gaps remain explicit. Source review cannot substitute for the full runtime gate.

P0: no new P0 identified in this bounded review; no global clearance.
P1: published R34 and actual e7 main remain failed; all new-head and actual-main gates are open.
P2: quadratic history, stack/map/temporary-array countercosts, copied aggregate maintenance, unmeasured resource behavior and stated coverage gaps.
P3: two inherited skips and dated prepublication snapshots.

Root's document-preparation checks and the independent 23:40–23:43 UTC audit agree: main e7/head212e/ref match,5 ahead/0 behind/23 paths,14 open Draft PRs,48 non-PR issues,other13 heads unchanged,zero formal/inline/Toolbar unresolved threads. Ruleset21875372 remains active/strict, required thread resolution, no bypass actors and current-user bypass never. Mode NORMAL remains blob1912bf56751a940acc56fad84e2bf9e6a174e0fa. The bounded Owner/Guardian comment audit found no new instructions. A fresh pre-ref reread is still required.

R34 Preview dpl_6Kx16pU3q3ATHhgrX2Gvnoyvd5Lx is READY exact212e. Production dpl_2QAy8s3qEWtinWYUwBeQTeFjtUwf is READY exacte7, target production; both jetnity.com and jetnity-app.vercel.app were individually checked to the same project/deployment with null redirects and no alias error. The old Preview is not an R35 gate. PR current prose still describing V26v1 is to be refreshed with the publication receipt.

## Frozen acceptance and special gates

Acceptance still requires all eight jobs/all31 groups/both realR9/full254/255/256/full64/65/inherited761/minOwned4182/final rollback/late writer/full drain/actual mounted lifecycle/Core/five hygiene checks/Build/Exact Preview, then fresh Root review/Ready/expected-head merge and independent actual-main full CI/native/Production through both aliases. Effect/cleanup/total budgets stay240000/60000/300000ms; all lane, connection, child, callback, native-operation and reservation limits remain unchanged.

No local project/parser/SQL/native/socket/build execution, installation, binary download, clone/replacement environment, git fetch/push, Auth-log access, or hosted DB/Auth/RLS/ACL/migration/credential operation is allowed. Existing CI is the only project execution route. No unchanged-head rerun, relaxed proof, reduced fixture/quota, added budget or hidden SQL helper.

SQL remains UNAPPLIED; Method NOT_APPROVED; #1139 NOT_RELEASE_READY with17 pre-Owner gaps; #1131 Ready STOP; both #1135 holds; #968 target isolation; #911/#913 privacy; D1 #1169 separately unfinished. Concrete client/SSR/Auth binding remains unproved. #917 UNKNOWN/Stage2 NOT_ATTEMPTED: no retry, rephrase, delegation, reroute, transport switch or human SQL substitute. No provider/research/scheduler/notification/new-cost/public activation.

The separate eight-path completion consists of six existing entry/handoff files and two new completion records named only after genuine corrected actual-main PASS. It requires its own Draft/full PR/main/native/Production gates and final receipts on the existing PR/#751, followed by STOP. No self-attestation loop or automatic next product slice.

## Package custody

The ten-path delta is one SQL source plus nine Root continuity paths: five central entry files, M04 handoff, new Task V26, this Root review, and new R35 evidence JSON. Current blocks in the five central files replace only the prior current marker; all outside text is retained. The previous complete M04 handoff is retained verbatim as historical evidence. The task preserves both complete published V26 comments, with v2 binding. The JSON retains all prior historical objects plus full failure27, all18 source pins, exact replacement blocks, the complete abstract model and countercosts.

Expected candidate tree:9422 leaves/838 directories/10259 total entries,9412 unchanged prior leaves,three additions,no deletions. All36 parallel #1181 leaves remain identical. The exact commit SHA and full immutable readback belong to the subsequent publication receipt, avoiding a self-referential commit assertion.
