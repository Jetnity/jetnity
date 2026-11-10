# M04 — current Technical-Lead handoff

**2026-11-10T05:38:00Z. R18 / Recovery Task V9; bounded correction prepared, full new-head acceptance pending.** This is the source checkpoint before publication. Read the latest exact-head PR receipts and live evidence after this file.

## Mandatory entry order

JETNITY_START_HERE.md → docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md → this Handoff → docs/ACTIVE_WORK_STATUS.md → [Root Review V9](M04_RECOVERY_ROOT_REVIEW_V9.md) → [Task V9](M04_RECOVERY_TASK_V9.md), [evidence](M04_RECOVERY_R18_EVIDENCE_V9.json), [failure excerpt](M04_RECOVERY_R18_NATIVE_FAILURE_V9.txt) → live PR #1178/issues 751/1162, review threads, CI, Preview/Production and Owner gates. No automatic next slice.

## Exact state and actual evidence

Published baseline **1d8eeddd8e2da9341f659f2b024e653c5ba5d310**, tree **224d89c68fbc665c39298b9c16bede277f87596f**, main/merge-base **890dfe9323b4b6d3644c372d81cb8893b6548d11**; ahead 10 / behind 0, 95 files. Mode NORMAL before the R18 dispatch. PR #1178 remains Draft.

Root independently confirmed all eight terminal jobs and read the complete non-Auth Repository log. [CI 42758402735](https://github.com/Jetnity/jetnity/actions/runs/42758402735), attempt 1, ended **FAILURE at 05:08:54 UTC** on exact 1d8. Repository **129638063982** and aggregate **129644016381** failed; all six companions passed. Typecheck/lint passed; Tests failed; hygiene/build skipped.

The first **23 ordered native groups and both actual R9 witnesses passed again**. Their group times sum to **84770 ms**. Group 24 **N05/A03** failed at the unchanged global **240 s effect budget**, after **154781.596676 ms** in that group. The failed iteration and per-statement costs were not logged. Seven later groups were not reached. Compact Discovery metadata alone did not make the full quota proof fit.

Core: **8682 total / 8678 passed / 2 failed / 2 skipped / 0 cancelled**, 642911.28969 ms. Executed-part cleanup: **26975/26975 settled, 0 pending, 4242/4242 cumulative connections closed, one cluster stopped, 0 children/errors; 240354 ms total / 35 ms cleanup**. NativePass false; the later inherited-boundary proof remains absent. The two failed tests are N05/A03 and its enclosing mandatory native test.

Full log: **4249970 UTF-8 bytes / 63142 lines**, SHA256 **c1fb0d06b046fd1658caedb0a1d3f132c714bbf5d319cb7a9586e1f7a02f2247**. [Exact bounded excerpt](M04_RECOVERY_R18_NATIVE_FAILURE_V9.txt), 4296 bytes, SHA256 **cb69ae47a170621fe5aa4f643bedf2e3ac7ffe60c2795fc5f17f0e3f7ce0992e**. The live auditor independently verified terminal job/Preview metadata and did not read logs; runtime findings above are Root's independent evaluation.

Historical exact 1d8 R9 has two real nested reserve_v1 witnesses, natural I1 timeout and explicit worker caller-abort. Each records distinct target/control/holder identities and backend births, actual SQL wait, abort delivery, backend absence while executor custody remains held, actual executor drain, admission unavailable before drain and invalid only after drain with three method helpers held, and no terminal effects. Natural I1 additionally observes fail-confirm; caller-abort remains unconfirmed. The held-method snapshot completedMethods=0 is taken before the unchanged finally releases/joins all three; completed group evidence also requires empty contexts, admitted=drained and restored backend inventory. This is actual historical proof for 1d8 only, not an elapsed 30-second worker timer or new R18 acceptance.

## Finite current correction

The Root-authorized [R18 / Task V9 dispatch](https://github.com/Jetnity/jetnity/pull/1178#issuecomment-6759595208) permits only two local SQL computation reuses plus meaningful native regressions and bounded quota-progress diagnostics.

1. **command_v1:** explicit SQL NULL retains the original invalid-command/P7601 rejection before canonicalization. Every non-NULL input still passes the same canonical depth, ASCII-key/string and numeric validation; wire_v1 separately retains its node-count guard. Its canonical text is computed once and reused for the unchanged 65536-byte check and exact commandText/hash preimage. Input v is not mutated between those uses; no cross-call or shared cache exists.
2. **transition_v1:** only the internally selected deduplicated enqueue branch assigns n := expected after full job_v1(current_record) validation. That identical already validated value is reused. The IS DISTINCT FROM 'deduplicated' condition keeps derived-job validation on every other branch, including NULL. Supplied commit.next must still equal n; prior validation, command, identity, fence, audit and deadline guards remain unchanged.

Every historical row is still parsed and checked in both pre-effect and post-effect history scans. All 29 function signatures, inventory, table/role/ACL/dependency contracts, other SQL functions and rollback are unchanged. This preserves validation outcomes and bounded authority semantics; completing less duplicate work does not extend any deadline. No measured speedup is claimed.

Native regressions cover both Rule and Discovery. Valid canonical command/dedup paths remain positive. The malformed-prior case places the same invalid job in current/expected/next to isolate required prior validation. The forged-next case retains valid prior/current and changes next to a distinct structurally valid record, isolating the required equality guard. SQL NULL and canonical-size guards receive focused negatives. New actual test subjects remain separate from existing Rule, Discovery and quota subjects. Independent review caught a provisional Rule-age-61 collision with an existing R9 helper before publication; the same author changed only the new persisted Rule fixture to unused age 68, leaving R9 unchanged.

Quota progress uses only two fixed records, finite phase names, started/completed indices and actual call/commit/reservation counts with bounded aggregate command-construction and fixed-call await times (including client transport, not server statement profiling). It carries no source, credential, token or unbounded row payload. Completed diagnostic counters mean successfully resolved promises. The expected rejected pointer probe increments started only; these counters do not replace lifetime settled/drained accounting. Diagnostics preserve calls, propagated errors, ownership/cleanup and all budgets; they never convert an incomplete group into a pass.

All actual 254/255/256 ledger boundaries and 64/65 start boundaries, full immutable histories, original terminal credit/token/fence, all 31 groups and both R9 cases remain mandatory. Full Rule histories remain quadratic and unbenchmarked at the full cap; there is no Production capacity/SLO approval.

Candidate SQL: **136035 bytes**, SHA256 **520e9b3435676ce38eb8312b22a2935f8449afbf4c9d31d36a7bf7d92382d984**, Git blob **8202f4a667f0953e01364cfffcc4507747bc24f4**.
Native: **151886 bytes**, SHA256 **9eb7de5270d0beffbfa2da1f38ef0478aca4858b98268f010eb65054f69643a5**, Git blob **55c4e57472efefd87d09065495e137e08fb88a24**.
All-18 source aggregate: **166f8b79e2a4b564b17a835e44cd0f5294ea80ce7ca005d8c3bfda32775d6859**. Exactly these two source files change; the other **16** source pins and rollback 9b9089d74242a802455cc7e3fb8a0a8515c17b61b45ae730b9bbba1adb650a66 remain unchanged. Four author documents preserve all eight failed histories, 18 pins, 22 matrix rows and the unchanged 31-group inventory. Current R18 execution/runtime/PASS fields remain false.

## First unfinished step

At this pre-publication snapshot, the first unfinished step is Root's expected-head publication of the independently reviewed finite R18 delta on 1d8eeddd, followed by complete tree/blob/ancestry readback and the automatically triggered unchanged exact-head CI. Inspect every one of the 31 native groups, both actual R9 witnesses, complete resource/process cleanup, bounded progress data, core/hygiene/build/companions and refreshed main/Preview/Production/Guardian/review/rules/Owner gates. A concrete failure returns to the same author/session; any changed head requires full re-gating. No unchanged-known-bad rerun. Later exact-head PR receipts/live evidence supersede this snapshot.

Sole author **Jetnity Official Truth V3 Durable Jobs1 — Codex Generation2**, /root/m04_durable_jobs_writer_g2; independent reviewer /root/m04_r9_review_g2; live auditor /root/m04_live_audit_g2. Same-session correction; original G1 is unavailable and no Cursor continuity is invented. Author self-review is never TL PASS. Root alone publishes and decides PASS, Ready and merge. Author STOP after finite delivery.

The original checkout /workspace/scratch/01cbe1264212/jetnity-v3-durable-jobs is absent. No reconstruction/clone, installation or local project/parser/test/SQL/native/socket/build execution occurred. In-session JavaScript performs text and independent hashing only. Earlier local 64/64 checks are historical; actual current native execution is solely in the unchanged existing CI.

Last independently verified main remains 890dfe9323b4b6d3644c372d81cb8893b6548d11, tree 8c611ec31d518cce88a3a5abb75aecf6620d794c, exact main CI 42736015143 SUCCESS/all 8 jobs. Current baseline Preview dpl_GSoKVbbTz8YuBMLf4eLbSoSmgt28 is READY, matching 1d8/branch and aliasError null. Both Production aliases freshly re-read by the independent auditor at 05:32–05:35 UTC remain on READY dpl_7K4gHmn2d2HBqCq1CHBThRjAXHw7, exact main 890. These metadata are timestamped in the evidence JSON and are not M04 hosted/runtime acceptance.

The independent 05:32–05:35 UTC refresh found 14 open PRs/all Draft, 48 non-PR open issues, ruleset 21875372 active/no bypass, 0 formal/inline GitHub or unresolved Vercel reviews, and no new Guardian 748/751 comments since 04:52:00 UTC. No Guardian run was created. Root independently re-read main/PR and exact issue/PR bodies before publication; the existing Owner-gate issues had no later update. Later live evidence takes precedence.

Atlas #1180/Booking #1179 and all 22 omitted binary IDs remain preserved. D1 #1169 is separate Draft/unfinished at 300946991376b8969b383a087d47b49a7636f722. Only M04 current-pointer regions are updated; all outside-marker content is retained. No automatic next product slice.

## Limits and gates

Frozen limits remain 240 s effects + 60 s cleanup / 300 s overall; four outer lanes and four native operations per family, eight active native / 256 total with 16 terminal admissions reserved, eight callbacks / 128 total, 30 s outer / 5 s child, three clusters / two child processes / 40 aggregate work connections / two M04 observers / one method observer / 16 fixture connections per cluster.

Method **NOT_APPROVED**. #1139 **NOT_RELEASE_READY**, pre-Owner gaps E01, E04, E06, E07, E09, E10, E11, E13, E15, E16, E17, E18, E21, E22, E24, E25, E28. #917 specifically refused independent readback remains pending, ledger UNKNOWN, Stage2 NOT_ATTEMPTED: no retry, rephrasing, delegation, rerouting, transport switch, human SQL substitute or renewed old Owner evidence request. #1131 Ready STOP; both #1135 holds; #968 preview isolation and #911/#913 privacy remain.

No hosted DB/Auth/RLS/ACL/migration/credential action or Auth-log access, real source/provider/research call, scheduler, notification, new cost or public V3 activation. No local PostgreSQL/native/socket/parser/project/build execution, installation/download, missing binary retrieval, clone/reconstruction or replacement environment. Native proof only in unchanged existing GitHub CI. No git fetch/push; any local git reads require GIT_NO_LAZY_FETCH=1 and GIT_OPTIONAL_LOCKS=0. Preserve all 22 omitted binary IDs. No automatic next product slice.
