# M04 — current Technical-Lead handoff

**2026-11-10 10:20:27 UTC. R21 / Recovery Task V12; bounded source reviewed, full new-head acceptance pending.** This snapshot precedes its own publication. Later head-bound PR receipts and live evidence supersede it. No runtime/TL-PASS, Ready or merge.

## Mandatory entry order

JETNITY_START_HERE.md → docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md → this Handoff → docs/ACTIVE_WORK_STATUS.md → [Root Review V12](M04_RECOVERY_ROOT_REVIEW_V12.md) → [Task V12](M04_RECOVERY_TASK_V12.md), [evidence](M04_RECOVERY_R21_EVIDENCE_V12.json), [failure excerpt](M04_RECOVERY_R21_NATIVE_FAILURE_V12.txt) → live PR#1178, #751/#1162, current source/status/threads/CI/Preview/Production and permitted special-gate evidence. Preserve TaskV1/Phase-A freeze. Live evidence wins.

## Latest actual published execution

Published baseline **d51d420a0ba83c56c7cf72166b5d328491fe54a5**, tree **dd75f8b57600f3dd588efbf4049b8642d77ca714**, main/merge-base **890dfe9323b4b6d3644c372d81cb8893b6548d11**; ahead **13** / behind **0**, **107 PR paths** (18 sources + 89 documentation paths). PR #1178 is OPEN/Draft. Root freshly read all 18 source files and independently recomputed their pins, the complete 10196-entry / 9359-leaf baseline tree and the two exact R21 candidate contents after the interruption.

[CI 42771272293](https://github.com/Jetnity/jetnity/actions/runs/42771272293), attempt 1, is terminal **FAILURE**, updated **2026-11-10T07:08:39Z**. Root independently observed completed Repository verification job **129679380018** before re-reading its complete non-Auth log. Aggregate **129685618326** also failed; all six companion jobs passed. Typecheck/lint passed; Tests failed; five hygiene checks and Production build were skipped. Auth metadata only.

**23/31 native groups passed**, including all new R20 N02 cases and both actual R9 witnesses. Their times sum to **102604 ms**. Group **24 / N05/A03** failed after **136801.231224 ms** at the unchanged global **240 s effect deadline**. Groups 25–31 were not reached. Earlier R19's 30/31 result and completed quotas are historical, not current R20 or R21 acceptance.

Ledger progress: zero-based last started/completed **215/214**, **215 acknowledged commits**. The next outward call did not return successfully; its final database outcome remains **UNKNOWN**. 216 command preparations completed / 480 ms; 217 fixed calls started / 216 fulfilled, including the initial absent probe / 136518 ms. 216 command calls started / 215 completed. No STARTs or cycle work occurred. Client-await durations are not server profiling; no causal timing attribution to the code or runner is established.

Cleanup completed: **26644/26644 settled, zero pending; 4242/4242 connections closed; one cluster stopped; zero children/errors; 240376 ms total / 26 ms cleanup**. Later inherited-boundary counters were not reached. Core: **8682 total / 8678 pass / 2 fail / 2 inherited layout skips / 0 cancelled**, **844519.303993 ms**. M04 has no native skip.

Full log **4251668 UTF-8 bytes / 63148 lines**, SHA256 **457e33fe7739810de9ae0b21f6b5206d976953120decddd61e44545054cc2470**. The new bounded [original-line excerpt](M04_RECOVERY_R21_NATIVE_FAILURE_V12.txt) is **6417 bytes**, SHA256 **e2ace2b4101afc9b63f0bbcb636f003c33aaa9766f4950f27299155d2b9b0da9**. The previously prepared, unpublished excerpt was lost during interruption; its old f92a pin is not reused. Complete actual receipt and named group observations are in [V12 evidence](M04_RECOVERY_R21_EVIDENCE_V12.json).

Both R9 witnesses observed real nested reserve_v1 wait, abort delivery, distinct PID+birth target/control/holder identities, backend absence while executor custody remained held, terminal executor drain, unavailable-before/invalid-after admission and zero terminal effects. I1 timeout observed fail-confirm; explicit caller-abort remained unconfirmed. completedMethods=0 is the deliberately held pre-finally snapshot: unchanged finally releases/joins all three helpers and the group checks complete drain and backend inventory. This is not an elapsed-30-second worker-timer proof.

## Current finite correction and pins

Only three output expressions inside **canonical_v1(jsonb,integer)** change: two child string assignments reuse **e::text**, and the scalar-root return reuses **v::text**, instead of rebuilding the same JSONB string from decoded text through to_jsonb(s). Each unchanged branch first establishes string type, extracts decoded text and enforces the original printable-ASCII guard. The retained JSONB scalar is identical to the reconstructed scalar, and the same JSONB text serialization supplies quoting/escaping. All extractions, guards, object-key encoding, depth/order, numeric/boolean/null paths and every other SQL byte stay identical.

The single **1555-byte N02 insertion** adds **nine direct SQL queries**: seven fixed scalars each observed through root/object/array outputs, plus two fixed mixed nested vectors, totaling 23 fixed output oracles. It covers empty string, alternate ASCII Unicode escapes, escaped slash, quote, backslash, literal backslash-u and string-null. Expected canonical literals are fixed. The existing canonicalAt helper is in scope; raw empty JSON string is nonempty text and does not become SQL NULL. Existing R19 rejection/depth/key matrix and all R20 cases remain byte-identical.

Every native byte outside that insertion is unchanged. The other 16 sources, all 29 SQL declarations/attributes, object/role/ACL inventory, rollback, S0/I1/S1/MA1, generic coordinator, native wire/lifetime, actual quotas, all 31 groups/order/R9/final N15, diagnostics, clocks, authority/fence/audit checks and cleanup remain. No cache across calls, trust flag, omitted history row, seed, new signature, workflow/package modification or increased limit.

The proposed broader history/command refactor remains outside authorization: command P7601 → journal P7603 → transition P7601 error precedence must remain; parsing an envelope first or moving transition first changes mixed-invalid input behavior. R21 does not attempt that refactor.

Source-derived work model only: a representative Discovery dedup row reconstructs 106 string scalars through existing command, envelope, job and audit traversals. The complete modeled 254-enqueue flow contains 253² = 64009 dedup-row validations, removing 6784954 explicit to_jsonb(s) evaluations for string values. This is not an observed execution count of the failed R20 run. All scalar/history validation remains. No backend profile, measured speedup, guaranteed timing margin or Production/full-cap Rule SLO is claimed. Full history work remains quadratic across the sequence.

- scripts/db/official-truth-v3-durable-jobs-1/jobs-candidate.sql: **138224 bytes / SHA256 063180813b9a4fac6df1493202c3e45c1b6d711de92cf9edcb2c7910b44e2080 / Git blob eef54d2e51a16987f9b77049fdf6efc8a3229df5**.
- scripts/db/official-truth-v3-durable-jobs-1/native.ts: **161318 bytes / SHA256 c4001fd857386f2b789852f346086cb0167ffd627959802d65baf6d11bd86104 / Git blob abbbd77b0896876877e8aa1dd0dd786d6d39c03f**.

All-18 source aggregate **11183e770f0c39dc51878e38b0a92a76a7b05a974f681bea13b87857daae60c6**. Rollback remains **9b9089d74242a802455cc7e3fb8a0a8515c17b61b45ae730b9bbba1adb650a66**.

## Ownership and continuity

Sole author remains **Jetnity Official Truth V3 Durable Jobs1 — Codex Generation2**, actual session **/root/m04_durable_jobs_writer_g2**. Independent reviewer **/root/m04_r9_review_g2**, live auditor **/root/m04_live_audit_g2**. All three real sessions resumed after the interruption; functions stores were lost. The author confirmed four R21 documents were still unfinished, then completed only that pending delivery. No session generation or Cursor title is invented. G1 and original checkout remain unavailable. Author STOP after finite delivery; immediate corrections return to the same author/session. Root alone publishes/PASS/Ready/merges.

Root reconstructed the exact candidate bytes and all 18 pins from fresh GitHub reads after reset. The independent reviewer retained its own pre-reset reconstruction/hash results in its same-session history and rechecked the full native oracle text after reset. Root's fresh independent hashes agree. The four author documents retain all ten prior historical objects and exact Markdown tails, add the eleventh actual failure, keep 18 source pins / 22 current-unexecuted rows / 31 unchanged groups, and mark all current execution/PASS/Ready/merge fields false. Author self-review is not TL PASS.

Original checkout /workspace/scratch/01cbe1264212/jetnity-v3-durable-jobs is absent and was not recreated. Only permitted GitHub reads and in-session text/data/hashing were used. No local project/parser/SQL/native/build execution, installation or replacement environment. The initial interrupted chat did save checkpoint d9d62c69; the implementation and acceptance were unfinished.

## Live baseline

Live auditor snapshot **2026-11-10 10:09:36–10:10:52 UTC** and subsequent Root read **2026-11-10 10:14:16 UTC** confirm unchanged main/head/merge-base. Exact main CI **42736015143** is SUCCESS, all eight jobs passed. Exact d51 Preview **dpl_BHqNWekXCTqrm9EytGNq258oAFf2** is READY, aliasError null. Both jetnity.com and jetnity-app.vercel.app separately resolve to Production **dpl_7K4gHmn2d2HBqCq1CHBThRjAXHw7**, READY/exact main890/aliasError null.

14 open PRs/all Draft and 48 non-PR issues; zero formal/inline GitHub or unresolved Vercel threads. Ruleset 21875372 remains active/strict with no bypass, resolved threads required and merge-only integration. Required contexts: Typecheck, Lint & Build; Auth-Konfiguration gegen config.toml; Vercel. Machine mode freshly read from exact main is NORMAL. No newer #748/#751 comments since 07:07 UTC, no changed inspected Owner-gate state. D1 #1169 remains separately unfinished Draft on 300946991376b8969b383a087d47b49a7636f722. Atlas #1180, Booking #1179 and all 22 omitted binary IDs remain preserved. No aggregate line-count reconciliation is claimed because PR and per-file statistics disagree. Deployment metadata proves neither hosted schema state nor M04 installation.

## Exact next action

At this pre-publication snapshot the first unfinished step is Root expected-head/no-force GitData publication against d51, followed by complete changed-blob/tree/ancestry readback. Then the existing unchanged CI must pass on the new exact head: all 31 native groups, both actual R9 witnesses, real 254/255/256 and 64/65 boundaries, inherited-boundary evidence, full cleanup, Core/Hygiene/Build and all companion jobs. Refresh exact Preview, main/merge-base/diff, reviews/threads, mode/Guardian/rules and special gates before a decision. Every changed head invalidates prior exact-head gates. Concrete failure returns to the same author; no unchanged-known-bad rerun.

Budgets remain **240 s effects + 60 s cleanup / 300 s total; four outer lanes and four native operations per family; eight active native / 256 total with 16 terminal admissions reserved; eight callbacks / 128 total; 30 s outer / 5 s child; three clusters / two children / 40 aggregate work connections / two M04 observers / one method observer / 16 fixture connections per cluster.** No shortened proof, raised budget or inferred pass. If eligible, only Root may give exact-head TL PASS, Ready and expected-head merge. Verify actual-main CI/Production after merge and persist one finite docs-only closure with its own gates; its final actual-main receipt can live in the existing PR/#751 to avoid a self-referential commit loop. No automatic next product slice.

## Risks and boundaries

- P0: no new verified Production incident in permitted evidence; forbidden hosted truth remains uninferred.
- P1: five actual budget failures and missing complete new-head native/CI acceptance block Ready/merge. R21 is not yet executed.
- P2: all historical validation remains quadratic; full-cap Rule/Production latency and operational uncertainty resolution remain unproved/outside this dormant slice. No measured R21 speed guarantee.
- P3: original checkout/G1 discontinuity and this store reset are explicit; durable source/PR evidence supports recovery. Inherited presentation limits remain outside this non-UI slice.

Method **NOT_APPROVED**. #1139 **NOT_RELEASE_READY**, pre-Owner gaps E01, E04, E06, E07, E09, E10, E11, E13, E15, E16, E17, E18, E21, E22, E24, E25, E28. #917 specifically refused independent readback remains pending, ledger UNKNOWN, Stage2 NOT_ATTEMPTED: no retry, rephrasing, delegation, rerouting, transport switch, human SQL substitute or renewed old Owner evidence request. #1131 Ready STOP; both #1135 holds; #968 preview isolation and #911/#913 privacy remain.

No hosted DB/Auth/RLS/ACL/migration/credential action or Auth-log access, real source/provider/research call, scheduler, notification, new cost or public V3 activation. No local PostgreSQL/native/socket/parser/project/build execution, installation/download, missing binary retrieval, clone/reconstruction or replacement environment. Native proof only in the unchanged existing GitHub CI. No git fetch/push; any local git reads require GIT_NO_LAZY_FETCH=1 and GIT_OPTIONAL_LOCKS=0. Preserve all 22 omitted binary IDs. No automatic next product slice.
