# M04 Recovery Task V29

## Current binding version: v2

# M04 Recovery V29 v2 — exact noninstrumented R38 repair and publication contract

Root Technical Lead instruction, 2026-11-11 03:27 UTC. This completes the concrete selection required by [V29 v1](https://github.com/Jetnity/jetnity/pull/1184#issuecomment-6785712854). Same active M04 recovery, same author/session and Draft #1184; no new product slice.

## Selection and live predecessor

Root selects the exact two-span canonical_v1 correction independently reconstructed by author, Root and source reviewer. This is source acceptance for publication and full CI, **not runtime PASS, TL-PASS, Ready or merge**.

Expected parent/head: **994eed7511d612db5158a2af77b5ad3d35f4b6c6**, tree **ffe3d243f16b49c7e7fabe49623ae31253ce3180**, same branch **fix/official-truth-v3-m04-postmerge-r36-20261111**. Main **fbcb72e7c65a5e7c7e4f2e20105ab6f4b2201a54**, tree **2d5413d86c3200ce05863d1f09062a3a5a142c32**. Root reread all three refs/PR snapshots at03:25UTC: main and M04 unchanged. Parallel #1185 is still open/non-Draft/unmerged, now head **af1b4297d0da01aa422f8c0099c6c1d8b61276d9**; inventoried only, not reviewed/approved/changed. Recheck before branch advance; do not overwrite parallel work.

[R37 terminal checkpoint](https://github.com/Jetnity/jetnity/pull/1184#issuecomment-6785455767) preserves full failure observation30, six successful companions and aggregate propagation. Run42947481167/#4099/a1:24/31 native,240343ms effect+cleanup,29ms cleanup, ledger81460ms,39 complete cycles with the next ENQUEUE UNKNOWN. Full64/65, inherited761/min4182 and last six groups not reached. Instrumented R37 itself must never Ready/merge.

Complete profile64418B/SHA256245134583bb9334a5ee10c8d37625d0c21ae93c63861f40ed6ec86fd460a5d2d: canonical_v1 is the largest measured self-time contributor,209257calls/54443.940ms in ledger and85785calls/17583.291ms in first32cycles. All261 rows read independently. Function profiling does not identify a single CTE operator, CPU/IO/runner cause or guaranteed speedup; inclusive times overlap, completed-prefix/wrapper/error/overhead qualifications remain.

## Exact implementation

SQL **scripts/db/official-truth-v3-durable-jobs-1/jobs-candidate.sql**:
- New161095B / SHA256 **868778c647464bf51ff179e39b86c2f4d6771cad07998165898f2f222e5fa84a** / Git blob **1bb764344f22569dec9d3320667e0125d64c1cbf**.
- Exactly two unique edits within canonical_v1: local fast_residue declaration and replacement of its existing positive object probe.
- Declaration old118B/c7fd81ba6006610d7158f3f7a6a244c1d88258e95bbbe82fc823634e68775bee → new137B/424c10c5651e385a23449df3403fb95aa1d20d1c36f9e1ebd4bf718fac6745e0.
- Probe old2439B/ab7d7505269bc1b3a481ce275245c3a03b63416304c555fbe64b3847fed21157 → new2390B/c45dc2dded64400243cf1f19f86cac9dfc354da1e5bff24e479e9b58585ebbfd.
- Unique inverse exactly recovers baseline161125B/SHA25692ca2bf0c45c9e3702b2de63bf984d6a1f30b6fe4c9c3ee83de35ae470ab2d16/blob9d15e032dea6dd9a5ab6cbb8537220f6fa23529e.

Selected behavior: valid empty objects return directly after original root NULL/depth guard. A bounded <=8192-byte nonempty object probe refuses any raw backslash, retains the original default-collation printable predicate once, strips complete quoted tokens using C collation only for eligibility, and conservatively declines arrays, decimal scale,16-digit runs,-0 and raw'{,'. Admitted flat objects use one ordered string_agg; nested objects retain the bounded recursive walk and depth predicate, remove the encoded materialization/LAG source stages and per-leaf validation work, and use one ordered string_agg plus bool_and and protected C first-member comma cleanup. Every declined input reaches the **byte-exact original validating fallback**. Original31-proof inputs/oracles remain frozen.

All29 function declaration/modifier headers, the other28 complete function bodies, all source outside canonical_v1 and its original7778-byte CASE fallback are exact. No authority/history/cache/transaction/lock/ACL/RLS/role/catalog/quota/rollback change. Source-only manual SQL syntax and NULL/depth/escaping/numeric/C-order/comma proof independently reviewed; PG16 sources pinned to c372fbbd8e911f2412b80a8c39d7079366565d67.

Native **scripts/db/official-truth-v3-durable-jobs-1/native.ts**:
- Restore EXACT original **191098B / SHA256 f5d849c643ff22d264bc9adc1a7cd65f12caaac80a804647604851f22effbde0 / blob0b3f7d9906687ec42171de5af60fed009d07b39f**.
- All8 actual R37 edits invert uniquely; no profiling code remains. All31 proof calls/inputs/assertions/order, receipt, limits and original fallback untouched.
- Other16 protected source files remain exact.18-source aggregate is **77f86edfbac0bbcf277913f1225f044fbbb11c22ac6f0ce0c65332d552864b13**, established UTF8 SHA256 SPACE decimalBytes SPACE path LF format.

Independent source receipt7147B/SHA256af8027d74f01cc53b97c0380d26a7fadd86ccdd94de24b2da179dae7fd96b72c. Root exact source and native inverse independently matched. The bounded eligibility/source-cost account must retain added scans/copies and fallback cost; no physical-sort count, RSS or elapsed-time promise. Existing tests do not establish every8KiB/raw'{,' lexical edge; sound positive guard and exact fallback are required, then actual full existing CI.

## Exact finite publication package

Exactly11 paths against994eed:8 modified,3 added,0 removed. Only these paths:

- JETNITY_START_HERE.md
- docs/ACTIVE_WORK_STATUS.md
- ROADMAP.md
- JETNITY_HANDOFF.md
- ARCHITECTURE.md
- docs/official-truth-product-v3/M04_HANDOFF_V1.md
- scripts/db/official-truth-v3-durable-jobs-1/jobs-candidate.sql
- scripts/db/official-truth-v3-durable-jobs-1/native.ts
- docs/official-truth-product-v3/M04_RECOVERY_TASK_V29.md
- docs/official-truth-product-v3/M04_RECOVERY_ROOT_REVIEW_V29.md
- docs/official-truth-product-v3/M04_RECOVERY_R38_EVIDENCE_V29.json

Five current-entry documents change only their existing official-truth/M04 marker interiors. M04_HANDOFF_V1.md prepends the new dated current handoff and retains the **entire** previous60493-character/60587-byte handoff exactly. No unrelated paragraph changes. Three new V29 records persist this full task, Root/independent/author source review and complete R37 native/profile/companion evidence, source pins, inverse spans, live continuity and all unknown outcomes. Prior V28/V27/V26 and older failed/genuine successful observations remain immutable; no historical self-review becomes TL-PASS.

Expected9420 prior unchanged leaves;9431 total leaves;838 directories including root;10268 recursive entries. Cumulative vs unchanged main:16 paths=7modified/9added, because restored native equals main. Preserve all parallel #1181 leaves and any newer work; fail closed on unexpected ref/tree/path drift.

Root may create blobs/tree/one immutable commit on exact parent994eed after the completed source/evidence package checks. **Do not advance the branch** until Root independently rereads every new file, full tree/parent/diff/source inverse/markers and independent exact-commit source and package reviews. Publish only expected-parent fast-forward, force=false. Recheck main/head/PR/Owner/threads/rules/mode immediately before publication. Same-session author never Ready/merges.

## Runtime, merge and closure gates

Only existing reviewed CI executes project code. No local/replacement parser/project/SQL/native/socket/build/test execution, installs/downloads/clones/alternate runners or unchanged-head rerun.

After publication, all previous exact-head gates are invalid. Require fresh full8-job CI: all31 M04 groups/full254–256/full64–65/pointer refusal/realR9/inherited761/minOwned4182/finalrollback and late writer; full repository and five non-Auth companion proof matrices; Auth metadata only; complete aggregate; fresh Preview exact head. Root confirms terminal metadata before each authorized log read; no Auth log reads. Independent reviewer evidence is mandatory but not itself TL-PASS.

Only Root may set Ready/merge after a fully verified noninstrumented exact head, fresh main/merge-base/ahead/behind/diff, all checks, threads, rules and Owner gates. Actual merged-main full CI and Production deployment plus **both independently resolved aliases jetnity.com and jetnity-app.vercel.app** must then pass. PR green alone cannot close this recovery. If actual main fails, record it honestly and return CHANGES REQUIRED to the same author/session with new version; no automatic unchanged rerun.

Only after genuine corrected actual-main PASS, perform the already-contracted separate finite8path documentation closure: six current-entry files plus exactly two new completion records; its own Draft/fullPR/fullactualmain/Production gates; final existing PR/#751 receipts; then STOP. No automatic follow-up product slice or extra self-attestation commit loop.

## Existing authority boundaries

SQL_UNAPPLIED/METHOD_NOT_APPROVED remain. #917 UNKNOWN/Stage2NOT_ATTEMPTED: no individual access/retry/rephrase/delegation/reroute/transport switch/human SQL substitute. #1139NOT_RELEASE_READY with unchanged17 pre-Owner gaps [E01,E04,E06,E07,E09,E10,E11,E13,E15,E16,E17,E18,E21,E22,E24,E25,E28]. #1131ReadySTOP; both#1135holds; #968 target isolation/client SSRAuth unproved; #911/#913privacy; D1#1169 separately unfinished. No hosted DB/Auth/RLS/ACL/migration/apply, credentials/provider/research/scheduler/notification/newcost/publicactivation action.

P1: actual-main acceptance remains failed. P2: selected correction's performance and coverage are unproven until fresh full gates; added lexical scans can cost rejected inputs. P3: two inherited skips and held finite closure. No new concrete P0 found within this review; no global clearance.

**First unfinished step:** finish the bounded source-cost/evidence record, construct and independently verify this exact11-path immutable package, then publish the same Draft branch and review its fresh full noninstrumented CI. No further Product Owner decision is required for this already-authorized ordinary recovery.


---

## Full preceding v1 retained

# M04 Recovery V29 v1 — measured canonicalization correction proposal (R38)
Root Technical Lead instruction, 2026-11-11 03:02 UTC. Same active M04 recovery, no new product slice.

## Live predecessor and disposition
Draft #1184 remains at 994eed7511d612db5158a2af77b5ad3d35f4b6c6 (tree ffe3d243f16b49c7e7fabe49623ae31253ce3180; parent d1f134a698ddd63c147191b34f24f529a28f5605). Main remains fbcb72e7c65a5e7c7e4f2e20105ab6f4b2201a54. Diagnostic R37 run42947481167/#4099/attempt1 is completed FAILURE. Repository130283651127 failed solely at native child25 and its aggregate parent on the unchanged 240s effect budget; six companion jobs SUCCESS, aggregate130289803986 propagates Core failure. R37 is never Ready/mergeable.

Native24/31; full ledger group81460ms; cycles stop at cycle_enqueue, index39 started/38 completed:39 completed cycles,39 acknowledged START reservations,117 acknowledged commands,118 command calls begun. The next ENQUEUE outcome is UNKNOWN. Effect+cleanup240343ms, cleanup29ms;26902/26902 operations,4242/4242 connections,one stopped cluster,zero pending/children/cleanup failures. Full64/65, inherited761/minimumOwned4182, and final six groups remain NOT_REACHED, not waived.

Raw Repository log4323362B/SHA256 e5475397704bc67a3a59893aa1a09381cf87daefdc15920d7726830f94d49bc8.
Native receipt3819B/SHA256 afdeb52ccd36153ff55dea0385b80479143862a0b19a88f40beea4946b5fcb12.
Profile64418B/SHA256 245134583bb9334a5ee10c8d37625d0c21ae93c63861f40ed6ec86fd460a5d2d; prefix+JSON64447B/a78a095f0e10a56e1b4f70ef8f3d58bc2a0d8f214cb801e3cf232f06dcdce662.

## Measurement accepted for bounded source investigation
Root and /root/m04_recovery_source_review_g3 independently read all261 function rows:29 exact stable identities at9 completed-prefix checkpoints through cycles_32. Setup/identity/default RESET and unchanged owner/observer settings succeeded;36/36 added queries, no profile failure, absent stats remain NULL rather than zero. Setup9ms and capture59ms are only collection intervals, not total instrumentation overhead.

Complete ledger anchors: elapsed81471ms; execute_v1 inclusive80658.067ms; canonical_v1 self54443.940ms over209257 calls; assert_history inclusive75427.253/self11305.129ms over515 calls; exact_keys self8891.105ms.
First32 complete cycle anchors: elapsed31137ms; execute_v1 inclusive30740.613ms; canonical_v1 self17583.291ms over85785 calls; assert_history inclusive28135.639/self3930.975ms over255 calls; exact_keys self3687.222ms.
Canonical is the largest measured self-time component in both observed intervals. Inclusive totals overlap; do not sum them. These are not CPU, IO, whole-server, full SET-wrapper, error-path or counterfactual uninstrumented measurements. Do not extrapolate to the unobserved final cycles or promise a speedup.

## Selected bounded author task
Same exact author and actual session ONLY: Jetnity Official Truth V3 Durable Jobs1 — Codex Generation3, /root/m04_durable_jobs_writer_g3. Root selects canonical_v1 as the measured target. Deliver a source-only R38 candidate/proposal addressing the repeated canonicalization cost, with a concrete rationale that explains which SQL scans/sorts/materializations/function calls it removes. Examine whether the R36 recursive CTE actually saves work for the common command/envelope shapes; do not retain an optimization merely because its source is smaller. Replacing or removing that probe within this one function is permitted if the complete semantic proof is preserved.

Allowed implementation proposal scope: body/local declarations of official_v3_jobs_private.canonical_v1 in scripts/db/official-truth-v3-durable-jobs-1/jobs-candidate.sql, plus the mandatory exact inverse of all R37 diagnostic edits in native.ts. The other28 SQL functions, all29 function headers, ACL/RLS/role/catalog/transaction controls, canonical protocol and all source/test/budget limits remain byte-exact. No changes to assert_history, authority, locks, fresh historical checks, field bounds, quotas, command effects, unknown-ACK semantics, tests, workflows, dependencies or configuration. No cross-invocation/session/transaction cache, persistent/global state, unbounded memo or new SQL function. If a useful correction cannot be justified inside this scope, return the specific limitation and source-only alternative for Root selection; do not expand scope autonomously.

Canonical equivalence must include SQL NULL and JSON null, all primitive kinds, numeric scale/integer/safe-integer limits, ASCII/escaped/control/non-ASCII strings and keys, C ordering and collation behavior, empty/nested/mixed objects and arrays, original depth semantics including boundary24, repeated objects, and invalid fallthrough/error behavior. Existing safe fallback may be retained. Any positive shortcut must be independently sound and leave invalid inputs on the original validating path.

Deliver full exact candidate text and unique literal old/new edit spans; UTF-8 bytes/SHA256/Git blob; inverse proof; source cost analysis and edge-case proof. Native must restore EXACTLY191098B/SHA256 f5d849c643ff22d264bc9adc1a7cd65f12caaac80a804647604851f22effbde0/blob0b3f7d9906687ec42171de5af60fed009d07b39f. No profiling addition may remain in the final repair.

This v1 authorizes source-only implementation/proposal and independent review, not branch publication. Root will select the concrete candidate and record V29 v2 publication/evidence scope before Git writes. No local/replacement project/parser/SQL/native/socket/build/test execution, downloads/installs/clones or alternate runners; only the existing reviewed CI executes project code. No new CI run until exact source and immutable package gates; never rerun unchanged head.

## Evidence, acceptance and existing gates
All prior failures and genuine R21/R29/R35 successes remain intact via their full immutable records; preserve R37 as diagnostic runtime-failure observation30, its complete native/profile receipts and all current companion arrays, including Atomic's separate360B TAP-escaped22P02 receipt. V28 evidence at994eed remains immutable. No rewriting a historical self-review into TL-PASS.

Any selected noninstrumented repair must pass Root and independent exact-source review, complete changed-head8-jobCI with31 native groups/full64/65/256/inherited761/minOwned4182, all complete companion matrices, fresh Preview/main/heads/threads/Owner/rules/operating-mode gates. Only Root may Ready/merge after actual exact-head PASS. Actual merged-main fullCI and both Production aliases are then mandatory; PR success alone is insufficient. A changed head invalidates prior exact-head gates.

All special Product Owner gates remain: SQL_UNAPPLIED/METHOD_NOT_APPROVED; #917 UNKNOWN/Stage2NOT_ATTEMPTED with no individual access, retry, reroute, transport switch, delegation or human-SQL substitute; #1139NOT_RELEASE_READY/17 pre-Owner gaps; #1131 ReadySTOP; both #1135 holds; #968 target isolation/client SSR Auth unproved; #911/#913 privacy; D1#1169 separately unfinished. No hosted DB/Auth/RLS/migration/apply, credentials, provider/research/scheduler/notification/cost or public activation work.

The already-contracted finite8path documentation closure stays held until genuine corrected actual-main PASS, then gets its own full gates/main/Production verification, final existing PR/#751 receipts and STOP. No automatic follow-up product slice.

First unfinished step: same author returns the bounded measured-source R38 proposal; Root and independent reviewer assess it before any publication.

