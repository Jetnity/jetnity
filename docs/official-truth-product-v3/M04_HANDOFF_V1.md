# M04 — current Technical-Lead handoff

**2026-11-10 06:49:34 UTC. R20 / Recovery Task V11; bounded source reviewed, new exact-head acceptance pending.** Explicitly pre-publication: later head-bound PR receipts and live state govern.

## Mandatory entry order

JETNITY_START_HERE.md → docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md → this Handoff → docs/ACTIVE_WORK_STATUS.md → [Root Review V11](M04_RECOVERY_ROOT_REVIEW_V11.md) → [Task V11](M04_RECOVERY_TASK_V11.md), [evidence](M04_RECOVERY_R20_EVIDENCE_V11.json), [failure excerpt](M04_RECOVERY_R20_NATIVE_FAILURE_V11.txt) → live PR #1178/issues #751/#1162, current task/status/review threads, CI, Preview/Production and special gates. Preserve original [Task V1](M04_TASK_V1.md) and [Phase-A freeze](M04_PHASE_A_FREEZE_V1.md). Live evidence always wins.

## Actual latest published state

Published baseline **72868a287280a6c1d96222268a1413110ec95039**, tree **06ac3e6d4eedbb3e42795bff942b19364a45a848**, main/merge-base **890dfe9323b4b6d3644c372d81cb8893b6548d11**; ahead **12** / behind **0**, **103 PR files**. PR #1178 is OPEN/Draft. The R19 full 10192-entry tree and all 14 changed blobs were independently read back. Later exact-head PR receipts and live evidence supersede this pre-publication snapshot.

[CI 42767273189](https://github.com/Jetnity/jetnity/actions/runs/42767273189), attempt 1, is terminal **FAILURE**, updated **2026-11-10T06:27:41Z**. Repository verification **129666585217** and aggregate **129670976070** failed; all six companion jobs passed. Typecheck/lint passed; Tests failed; hygiene/build skipped. Root independently read the full terminal non-Auth log; Auth metadata only.

**30 of 31 native groups passed.** Both R9 witnesses, new R19 N02 regressions, both actual quota families, nonempty rollback, catalog/dependency defenses and empty companion-first teardown passed. The final group **31 / N15 — rollback waits for actual late writer then rechecks nonempty history atomically** failed after **174.23375 ms**, at the unchanged global **240 s effect deadline**. The log does not establish which statement of that last group had completed or that the group would otherwise pass.

First 23 groups sum to **75116 ms**; group 24 **78506 ms**; group 25 **83847 ms**; groups 26–30 **798 ms**. Sum of completed group durations **238267 ms**. These are observed fixture group durations, not backend-function profiling.

Quota receipt reached **currentGroup none / boundary done**. Ledger: last started/completed index **253/253**, **256 acknowledged command commits / one START**; 258 successful command preparations / **463 ms**, 260 started and successful fixed calls / **78236 ms**. Cycles: last index **63/63**, **193 acknowledged command commits / 64 STARTs**; 194 successful preparations / **355 ms**, 260 fixed calls started / 259 fulfilled / **83650 ms**. The unfulfilled cycle pointer probe is an expected rejection. These rounded client-await sums include transport/waiting; successful-return counters are not lifetime-drain counters.

Cleanup: **27554/27554 settled, 0 pending; 4245/4245 connections closed; two stopped clusters; zero children and cleanup errors; 240184 ms total / 16 ms cleanup**. Inherited boundary evidence reached **761 commit-guard pairs / minimumOwned 4182**. Core: **8689 total / 8685 pass / 2 fail / 2 inherited layout skips / 0 cancelled**, **557126.408018 ms**. The failures are final N15 and its enclosing mandatory test; M04 itself has no native skip.

Full log: **4253591 UTF-8 bytes / 63178 lines**, SHA256 **ef023cffe525fbaed3491199a8292dcb6cf92a30d62aad74f7ae4f5adebca2f8**. [Finite historical excerpt](M04_RECOVERY_R20_NATIVE_FAILURE_V11.txt): **6473 bytes / SHA256 b348bd6662645332f566422c8936931165f0c3985dfb08e363163a80bc517ef1**. The complete actual receipt, named group inventory and source pins are in [V11 evidence](M04_RECOVERY_R20_EVIDENCE_V11.json).

Both historical R19 R9 witnesses observe actual nested reserve_v1 SQL wait, abort delivery, distinct target/control/holder PID+birth identities, target backend absence while executor custody remains held, terminal executor drain, unavailable admission before drain and invalid admission afterward, with zero terminal effects. I1 timeout observes fail-confirm; explicit caller-abort remains unconfirmed. completedMethods=0 is the deliberately held pre-finally snapshot; unchanged finally releases/joins all three helpers and the group verifies empty contexts, admitted=drained and restored backend inventory. This is not an elapsed-30-second timer proof or R20 execution.

## Current finite correction

Only **canonical_v1(jsonb,integer)** and **job_v1(jsonb)** bodies change. The three existing numeric branches replace the existing text assignment with one unconstrained numeric assignment and use that local at four existing conversion sites. Both trunc calls, condition structure, safe integer bounds, original errors, output, all other scalar/container processing and depth checks remain.

job_v1 retains the mandatory created timestamp parse first. Only the following updated assignment reuses that successfully validated value when the original extracted texts compare equal under explicit **C collation**. NULL, malformed or different updated input follows the original timestamp parser. Different textual representations of the same instant never qualify. Every later lifecycle, lease, backoff and time predicate remains byte-identical.

The single **2417-byte N02 insertion** adds **24 direct SQL queries**: ten timestamp cases for each of Rule and Discovery plus four fixed raw-numeric cases. Prospective queued jobs come from the unchanged real coordinator helper without journal writes. Valid equal/later times return the exact job; equal-invalid creation, malformed/NULL/wrong-type update, earlier updated time and noncanonical same-instant text refuse. Time keys remain present so closed-key rejection cannot mask the changed path. Raw numeric literals preserve exact fractional/endpoint precision and test mixed reassignment/recursion, signed zero and rejection after a valid number. The private JSONB signed-zero oracle does not weaken the unchanged raw-wire negative-zero refusal.

Every byte outside those two SQL bodies and that native insertion is unchanged. All 29 signatures/attributes, object inventory, role/ACL contracts, nodes_v1, history/command/transition/subject/catalog/authority/audit/fence checks, transaction/API flow and rollback remain. So do the 31 proof names/order, R9, final N15, quota fixtures, diagnostics, timers, ownership and cleanup. No cross-call cache, trust flag, history seed, skipped row, new object/signature or loosened guard.

Source model only: 254 successful ledger fills perform 254² = **64516** historical row validations. Their unchanged queued jobs have identical createdAt/updatedAt text; each transition job validation can avoid one repeated timestamp_v1 and its civil_date_v1 invocation. The representative Discovery dedup row has 39 numeric canonical leaf visits, removing 117 written repeated conversions. These counts are not a server profile, measured speedup or guarantee. Complete history work remains quadratic; full-cap Rule latency and Production capacity/SLO remain unproved.

SQL **138254 bytes / SHA256 18c5d6c7f724e9c90c2f6e2aa96b429afb397d405db355057071d195b1c5417e / Git blob 779f45640fa80d1f64282191d94ed365e7fdb31a**.

Native **159763 bytes / SHA256 7c1770792308989ee09dd460d97cc7df0c1193f45326612c842147abd3020810 / Git blob 810ed62e7c19e7f3d88d2ce9e88e767dcacaa39d**.

All-18 source aggregate **cd76347b518c7c8cecd5661e73886712a8597164c8f98b3c8acebc84be9ae87e**. Only these two source files change from R19; the other 16 source pins and rollback **9b9089d74242a802455cc7e3fb8a0a8515c17b61b45ae730b9bbba1adb650a66** remain. All four author files retain ten historical failures, 18 source pins, 22 current-unexecuted matrix rows, the unchanged 31-group inventory and exact previous Markdown tails. Current R20 execution/native/runtime/TL-PASS fields remain false.

## First unfinished step

At this explicitly pre-publication snapshot, finish Root expected-head publication of the independently reviewed finite R20 files, then read back every changed blob and the complete tree/ancestry. The automatic unchanged CI on the resulting exact head must complete all 31 native groups, both actual R9 witnesses, real 254/255/256 and 64/65 boundaries, inherited-boundary evidence, complete cleanup, Core/Hygiene/Build and all companion jobs. Refresh main/merge-base/diff, exact Preview/Production, reviews, mode/Guardian/rules and Owner gates before deciding Ready/merge. Any changed head invalidates older exact-head acceptance. A concrete failure returns to the same author; no unchanged-known-bad rerun. Later PR publication/CI receipts and live evidence supersede this snapshot.

Frozen budgets: 240 s effects + 60 s cleanup / 300 s total; four outer lanes and four native operations per family; eight active native / 256 total with 16 terminal admissions reserved; eight callbacks / 128 total; 30 s outer / 5 s child; three clusters / two children / 40 aggregate work connections / two M04 observers / one method observer / 16 fixture connections per cluster.

## Current scope and sessions

Last permitted live audit **2026-11-10T06:37:27Z**: main **890dfe9323b4b6d3644c372d81cb8893b6548d11**, exact CI **42736015143 SUCCESS/all 8**; exact R19 Preview **dpl_5yof3odPk8BsriaxhhbXQoqmLMck READY / 72868a287280a6c1d96222268a1413110ec95039 / aliasError null**. Both Production aliases were independently resolved to **dpl_7K4gHmn2d2HBqCq1CHBThRjAXHw7**, READY/exact main 890/aliasError null. These metadata do not prove hosted state or M04 installation.

14 open PRs/all Draft, 48 non-PR issues; zero formal/inline GitHub and unresolved Vercel threads; active strict ruleset 21875372 without bypass. Existing mode NORMAL, no newer mode/Owner instruction or Guardian comments in the inspected interval. D1 #1169 remains separately unfinished Draft at **300946991376b8969b383a087d47b49a7636f722**. Atlas #1180, Booking #1179 and all 22 omitted binary IDs remain preserved. Root independently rechecks the main/PR lease before publication.

Sole implementation author: **Jetnity Official Truth V3 Durable Jobs1 — Codex Generation2**, /root/m04_durable_jobs_writer_g2, AUTHOR STOP after finite delivery; immediate review corrections use this same real session. Independent reviewer /root/m04_r9_review_g2; live auditor /root/m04_live_audit_g2. Original Generation1 is unavailable; no Cursor/session continuity is invented. Author self-review never supplies TL PASS. Root alone publishes, grants PASS/Ready and merges.

Original checkout /workspace/scratch/01cbe1264212/jetnity-v3-durable-jobs is absent. No repository reconstruction, installation, local project/parser/SQL/native/build execution or prohibited replacement environment occurred. In-session JavaScript is limited to text/data inspection, reconstruction and hashing. Earlier local 64/64 checks remain historical; new native execution only through existing CI.

The original interrupted chat did save checkpoint d9d62c69; its work was incomplete. Ten historical failed heads and subsequent exact source/task/review receipts remain in the repository. Current Source acceptance is bounded and unexecuted, never a migration/apply, public release or product-readiness statement. After any eligible merge verify actual-main CI/Production and persist the finite post-merge continuity checkpoint. No automatic follow-on slice.

## Risks and Owner gates

P1: final N15 and complete new-head CI remain unverified. P2: full history costs remain quadratic and Production/full-cap Rule SLO remains unproved. P3: absent original checkout/Generation1 is recorded; do not recreate it or invent session continuity. No verified new P0 incident in permitted evidence; forbidden hosted truth remains uninferred.

Method **NOT_APPROVED**. #1139 **NOT_RELEASE_READY**, pre-Owner gaps E01, E04, E06, E07, E09, E10, E11, E13, E15, E16, E17, E18, E21, E22, E24, E25, E28. #917 specifically refused independent readback remains pending, ledger UNKNOWN, Stage2 NOT_ATTEMPTED: no retry, rephrasing, delegation, rerouting, transport switch, human SQL substitute or renewed old Owner evidence request. #1131 Ready STOP; both #1135 holds; #968 preview isolation and #911/#913 privacy remain.

No hosted DB/Auth/RLS/ACL/migration/credential action or Auth-log access, real source/provider/research call, scheduler, notification, new cost or public V3 activation. No local PostgreSQL/native/socket/parser/project/build execution, installation/download, missing binary retrieval, clone/reconstruction or replacement environment. Native proof only in the unchanged existing GitHub CI. No git fetch/push; any local git reads require GIT_NO_LAZY_FETCH=1 and GIT_OPTIONAL_LOCKS=0. Preserve all 22 omitted binary IDs. No automatic next product slice.
