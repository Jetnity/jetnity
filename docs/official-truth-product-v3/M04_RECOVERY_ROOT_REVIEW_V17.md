# M04 R26 — independent Root review and continuity V17

**2026-11-10 14:56:02 UTC. CHANGES REQUIRED R26 / Recovery Task V17, implementation v2.** This is the independently source/document-reviewed pre-publication snapshot. The prepared correction has not executed. Existing #1182 remains Draft and unfinished; no runtime/TL PASS, Ready or merge. Later exact-head receipts and live evidence govern.

[Draft #1182](https://github.com/Jetnity/jetnity/pull/1182) · [complete actual R25 failure / investigation v1](https://github.com/Jetnity/jetnity/pull/1182#issuecomment-6769908832) · [binding implementation v2](https://github.com/Jetnity/jetnity/pull/1182#issuecomment-6770330334) · [R25 publication/readback](https://github.com/Jetnity/jetnity/pull/1182#issuecomment-6769470447) · [separate lifecycle diagnosis](https://github.com/Jetnity/jetnity/pull/1182#issuecomment-6769782473)

Published blocked head **45be21e57988d91dca3ee0758712f3ef5f39d744**, tree **95046b7d80b9d7e44d01c9a8a15b187577303c76**, is ahead **4**, behind **0** of actual main/merge-base **4bfa8b466ebc0af761fc5050bb4c51d7e73400c7**, tree **793026a2c26725da06ff281924aaa561d43ee32f**. Origin #1178 remains historically MERGED after genuine R21 PR acceptance. Its later actual-main failure is separately true and blocking. #1182 is the immediate dormant post-merge fix, not a new product slice.

## Actual R25 failure

[CI 42830921607](https://github.com/Jetnity/jetnity/actions/runs/42830921607), attempt 1 / pull_request, completed **FAILURE**, updated 2026-11-10T14:25:57Z. Root observed completed Repository metadata at **2026-11-10 14:24:33 UTC** before reading its complete non-Auth log, then confirmed the terminal full run at **2026-11-10 14:27:12 UTC**. All eight jobs completed: **five SUCCESS; Repository verification 129880385645, lifecycle 129880386234 and aggregate 129891193431 FAILURE**. Typecheck/Lint passed; Tests failed; later hygiene/build skipped. Auth was metadata only.

**23/31 M04 groups passed**, including all existing 36 key cases / 72 default+C observations and both real R9 race/drain witnesses. Group 24, N05/A03, reached the unchanged **240-second effects budget** in ledger fill: last started index **237**, completed **236**, **237 acknowledged commands**. Command requests 238/238; fixed calls 239/238; command calls 238/237. No START/reservation or cycles. Groups 25–31, inherited boundary and final rollback were not reached. The following fixture-database outcome remains **UNKNOWN**.

First 23 groups: **100393 ms**; failed ledger: **138860.852048 ms**. Complete cleanup: **27068/27068 effects settled, 4242/4242 connections closed, one cluster stopped, zero pending effects/children/cleanup errors; 240365 ms total / 29 ms cleanup**. Core: **8682 tests / 8678 pass / 2 fail / 2 inherited skips / 0 cancelled**, 834133.467501 ms. These are observed client/test results, not server profiling or a causal comparison with earlier timings.

Complete Repository log: **4251944 UTF-8 bytes**, SHA256 **2ce8011a95f02a1821e202d9dd067c97bc0ba41e019ba9df2f26863aeffd6102**. Compact receipt: **3767 bytes**, SHA256 **71fd08178097253737823af68d19fa887b973ccd126c50d45950ad50b39d5299**. [Original-line excerpt](M04_RECOVERY_R26_NATIVE_FAILURE_V17.txt): **10385 bytes / 6ab2683e2c19a5f586ae8b6cdf0a56debbe6be14808efe6918778d752d6df0f9**. The complete receipt and job metadata are in [Root Evidence V17](M04_RECOVERY_R26_EVIDENCE_V17.json).

### Separate lifecycle preflight failure

The lifecycle test stopped after **5011.436339 ms** at browser.ts:55:23: a separate synchronous `google-chrome --version` call hit its existing 5000 ms limit. This occurred **before** bundle/cluster construction, fixture setup, browser launch or mounted lifecycle assertions. Actual lifecycle proof was not reached. The full log is **163043 bytes**, SHA256 **41d1323fb876ac1686e9c933364b7f6f426217cb126138a989c5f15c3413e6c6**; totals 4 tests / 3 pass / 1 fail / 0 cancelled / 0 skipped, 382904.746 ms.

Root and the same reviewer independently read browser.ts, blob **b79caba69dc741a818367b501dd33df51ce24901**. The CLI/runtime-version comparison is an additional consistency assertion; replacing it with a comparison of a value with itself would not preserve it. The underlying timeout cause is **UNKNOWN**. No runner/flakiness attribution, skip, timeout increase or browser-source change is selected. The complete unchanged lifecycle job must pass on the genuinely corrected next head.

Exact R25 Preview **dpl_FYabP6BhqvwWfSTodkrccuMuXAAN** was READY on 45be. It does not close these failures or gate a changed head.

## Selected correction and independent source reasoning

Only two hunks inside `canonical_v1` change: two invocation-local variables are added, and only the **object-parent/object-child** branch may reuse the last successfully computed object's canonical result. Existing key and depth guards execute first. The first object always follows the original recursive path. A later object may reuse only after **complete JSONB text equality under explicit C collation**. A miss performs the original call and replaces both retained fields only after success.

The retained canonical result is separate from child_text, so intervening scalar or array work cannot corrupt it. Same parent invocation means the same child depth. Object-parent array children, root-array logic, scalar validation, key ordering/encoding and every other function remain exact. There is no cross-call cache, trust marker, table, prefilter, caller assertion or history omission. Additional state is one object and one canonical string per active invocation; no new universal byte cap for arbitrary private-helper input is claimed.

Root and reviewer independently examined immutable PostgreSQL 16 source at **c372fbbd8e911f2412b80a8c39d7079366565d67**. JSONB text output, blob **cf43c3f2ded19aabd2a913ab914f84d6c70d3afc**, uses an iterator loop and explicit type/string/number rendering. Full text comparison preserves distinctions; every reused result already passed the original canonical validation at that same depth. Allocation and serialization add work and remain a cost caveat.

For a representative deduplicated Discovery history row, its two existing envelope traversals may avoid **6 recursive canonical entries and 46 key visits**. Root independently confirmed the 254-command loop and pre/post history visits: **64009** deduplicated historical-row validations, giving **384054** avoided entries / **2944414** key visits in that static model. The proposed comparisons add **eight JSONB text serializations per representative row**; singleton-object parents add none. These are source-operation counts, **not a measured speedup, timing margin or Production SLO**. History remains quadratic. All outer command, journal, transition, job/node, hash, time and authority checks remain.

Native adds only **18 direct calls** through existing canonicalAt and the existing owner connection inside N02: seven fixed successful canonical strings and eleven original P7601 refusals. These cover interleaving, A/B/A and A/B/B replacement, distinct strings/numbers, ordering, invalid first/second objects, key/depth guards and true SQL NULL. The exact literal matrix is in Evidence V17. No internal cache-hit receipt is invented. All older oracles, 36 key cases / 72 mode observations, 31 group names/order and all budgets remain.

SQL **139163 bytes / 81bb875daa205d087b1f9faba7f3a41fd445bec14cbbe6b7a0aea628818ef820**, blob **ba65ca6be73f529bcf1a5e9dcd10985e3f8c0763**. Native **177160 bytes / d413d4de82548af38cbd7f54f226c2a72c582b4fd3e913b557793d8a3e12548c**, blob **ac42eb501c68fa3f47e57175504d055e11d764b8**. All-18 aggregate **aae92c558a32210c6f86d3140e00798fd6a36c5f942a9b4a8d9322ddc8a407ba**. Other 16 pins, including rollback **9b9089d74242a802455cc7e3fb8a0a8515c17b61b45ae730b9bbba1adb650a66**, remain exact.

Root and same reviewer independently reconstructed final sources; inverse deltas recover exact 45be. All **29 function declarations/signatures/attributes/LANGUAGE/search_path** remain exact. Their conclusion is source-only suitable for full new CI, not compiler/runtime/TL acceptance.

## Ownership and retained history

Same actual author **Jetnity Official Truth V3 Durable Jobs1 — Codex Generation2**, session **/root/m04_durable_jobs_writer_g2**; reviewer **/root/m04_r9_review_g2**; auditor **/root/m04_live_audit_g2**. No new generation or invented Cursor session. Author STOP after finite delivery. The original G1/checkout remains unrecovered; new scratch context has not been used for project execution or reconstruction.

Root independently reconstructed the four author documents. All **15 prior failure objects**, genuine R21 success, corrected separate R22 terminal observation and old Markdown tails remain exact. Actual R25 is appended as the **16th distinct failed run**, with its separate lifecycle failure retained. All current new-head execution/PASS/Ready/merge flags and 22 coverage-row execution flags remain false.

Author owns exactly two sources and four existing M04_PHASE_B documents. Root owns four new V17 Task/Review/Evidence/Excerpt files and six current entries: M04_HANDOFF_V1 plus only unique markers in START/ACTIVE/ROADMAP/JETNITY_HANDOFF/ARCHITECTURE. Outside-marker bytes and older V13/V14/V15/V16 records remain unchanged. Expected publication delta **16 paths: 2 sources + 14 docs**; cumulative PR **32 paths: 2 sources + 30 docs**. Preserve full tree/modes and all **22 omitted binary IDs**, without reading binaries.

## Risk and live baseline

- P0: no newly verified Production incident in permitted evidence.
- P1: current native budget failure, separate uncompleted lifecycle proof and earlier actual-main failure block completion.
- P2: quadratic history cost, new comparison/allocation overhead, unknown following fixture-database outcome and unproved general latency remain.
- P3: two inherited layout skips and original G1/checkout discontinuity remain explicit.

The last Root safe gate snapshot confirmed unchanged main 4bfa, Mode NORMAL, active strict ruleset 21875372 without bypass, no review/inline/Vercel threads and no new permitted Owner/Guardian changes. Inventory: 15 open Draft PRs / 48 non-PR issues. Production **dpl_99pQXe4BdoDExkYqxkL5eNdTJZrD** was READY on 4bfa with both aliases matched. Fresh refresh timestamps and observations are retained in Evidence V17. D1 #1169 and #1181 remain separate unfinished work.

## First unfinished step and mandatory gates

Root must refresh expected head **45be21e57988d91dca3ee0758712f3ef5f39d744** and main 4bfa, publish on **fix/official-truth-v3-m04-postmerge-r22-20261110** with expected-head lease/no force, then independently read back all changed blobs, complete tree and ancestry. #1182 remains Draft. Every changed head invalidates previous exact-head gates.

Require the complete unchanged CI: all eight jobs, Typecheck/Lint/Core/hygiene/build, all 31 native groups in exact order, both R9 witnesses, full 254/255/256 ledger and 64/65 cycle proofs, **761 inherited guard pairs / minOwned 4182**, final rollback/late writer, complete cleanup and the full actual mounted lifecycle proof. Independently verify exact Preview, current main/base/ahead/behind/diff, reviews/threads, strict rules, Mode/Guardian and reserved gates.

Only Root may issue TL PASS, Ready and expected-head merge. Any failure returns to the same author/session for a concrete versioned correction and full new gating. No unchanged-known-bad rerun. After a permitted merge, actual new main must separately pass full CI/native and Production must match through both **jetnity.com** and **jetnity-app.vercel.app**.

Finite docs closure is held until genuine product/main acceptance. It then changes exactly two new Root completion records and these six current entries, with its own full PR and actual docs-main CI/native/Production gates. A final resulting-head receipt goes on the existing PR/#751 without another self-attestation commit. No issue closure or automatic next slice.

Frozen limits: **240 s effects + 60 s cleanup / 300 s total; four outer lanes and four native operations per family; eight active native / 256 total with 16 terminal admissions reserved; eight callbacks / 128 total; 30 s outer / 5 s child; three clusters / two children / 40 aggregate work connections / two M04 observers / one method observer / 16 fixture connections per cluster.**

## Reserved gates and access boundaries

Method **NOT_APPROVED**. #1139 **NOT_RELEASE_READY**, pre-Owner gaps E01, E04, E06, E07, E09, E10, E11, E13, E15, E16, E17, E18, E21, E22, E24, E25, E28. #917 specifically refused independent readback remains pending, ledger UNKNOWN, Stage2 NOT_ATTEMPTED: no retry, rephrasing, delegation, rerouting, transport switch, human SQL substitute or renewed old Owner evidence request. #1131 Ready STOP; both #1135 holds; #968 preview isolation and #911/#913 privacy remain.

No hosted DB/Auth/RLS/ACL/migration/credential action or Auth-log access, real source/provider/research call, scheduler, notification, new cost or public V3 activation. No local PostgreSQL/native/socket/parser/project/build execution, installation/download, missing binary retrieval, clone/reconstruction or replacement environment. Native proof only in the unchanged existing GitHub CI. No git fetch/push; any local git reads require GIT_NO_LAZY_FETCH=1 and GIT_OPTIONAL_LOCKS=0. Preserve all 22 omitted binary IDs. No automatic next product slice.

Root alone read completed non-Auth Repository and lifecycle job logs after independently observing terminal metadata. No Auth-job or Vercel build logs were read. Pure in-session text/data transformations and hashing are source/evidence analysis, not project/SQL execution. Deployment READY does not establish hosted database, migration or RLS truth.
