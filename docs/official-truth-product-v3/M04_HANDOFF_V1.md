# M04 — current Technical-Lead handoff

**2026-11-10 14:05:59 UTC. CHANGES REQUIRED R25 / Recovery Task V16, implementation v2.** This is the independently source/document-reviewed pre-publication snapshot. The new correction has not executed; later exact-head receipts and live evidence govern. Existing #1182 remains Draft and unfinished. No TL PASS, Ready or merge.

## Mandatory entry order

JETNITY_START_HERE.md → docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md → this Handoff → docs/ACTIVE_WORK_STATUS.md → [Root Review V16](M04_RECOVERY_ROOT_REVIEW_V16.md) → [Task V16](M04_RECOVERY_TASK_V16.md), [Evidence V16](M04_RECOVERY_R25_EVIDENCE_V16.json), [actual failure excerpt](M04_RECOVERY_R25_NATIVE_FAILURE_V16.txt) → live #1182/origin#1178/#751/#1162, exact source/status/reviews/CI/Preview/Production and reserved gates. Preserve TaskV1, Phase-A freeze and all older evidence. Live evidence wins.

[Draft #1182](https://github.com/Jetnity/jetnity/pull/1182) · [actual R24 failure / investigation v1](https://github.com/Jetnity/jetnity/pull/1182#issuecomment-6768973326) · [binding implementation v2](https://github.com/Jetnity/jetnity/pull/1182#issuecomment-6769130908) · [R24 publication/readback](https://github.com/Jetnity/jetnity/pull/1182#issuecomment-6768355772)

Published blocked head **1aecc862c4b2710bb12c900195259ee25eb6f70d**, tree **bc79a7bc2bf09fcea57ab1f4e7ca4c773ce5b9f3**, is ahead3/behind0 of actual main/merge-base **4bfa8b466ebc0af761fc5050bb4c51d7e73400c7**, tree **793026a2c26725da06ff281924aaa561d43ee32f**. Origin #1178 remains MERGED after genuine R21 PR acceptance; later actual-main failure remains separately true and blocking. #1182 is the immediate dormant post-merge correction, not a follow-up product slice.

## Actual R24 failure, independently observed by Root

[CI42822302417](https://github.com/Jetnity/jetnity/actions/runs/42822302417), attempt1/pull_request, completed **FAILURE** on exact1aecc. Root observed completed run and Repository-verification metadata at **2026-11-10 13:35:33 UTC** before reading the complete non-Auth job log. Repository verification **129850630615** and aggregate **129859432419** failed; all six companion jobs succeeded. Typecheck/Lint succeeded, Tests failed, subsequent hygiene/build were skipped. Auth metadata only.

**23/31 native groups passed**, including the R24 **36 fixed cases / 72 default+C observations** and both real R9 race/drain witnesses. Group24 **N05/A03** hit the unchanged240-second effect budget during ledger fill: lastStarted228/lastCompleted227, **228 acknowledged commands**, 229 command requests completed, fixed calls230started/229completed, command calls229started/228completed, no START/reservation. Cycles and groups25–31/inherited boundary/final late writer were not reached. The following fixture-database outcome is **UNKNOWN**.

First23groups **102637ms**; failed ledger test **136768.07127ms**. Complete cleanup: **26776/26776 effects settled, 4242/4242 connections closed, zero pending/children/cleanup errors, one cluster stopped; 240422ms total/38ms cleanup**. Core **8682 tests/8678 pass/2 fail/2 inherited skips/0 cancelled**,841782.545609ms. These are client/test measurements, not a server profile, measured plan, causal runner attribution or proof that one helper regressed.

Full log **4252208 UTF-8 bytes**, SHA256 **d551f43143f1b712bf072256f4949f81a09594b805c5d6c479ae0c2086d5e3e5**. Complete compact receipt **3767bytes**, SHA256 **7676783e6c3abd4cbf8499c4568c53f0176dd9473f3e7a91646ff93f9aaea67d**. [Original-line excerpt](M04_RECOVERY_R25_NATIVE_FAILURE_V16.txt): **5391bytes/7ff00463ce28764756dcf0ce8ff3d1e2817e6928c5735219fdcf9dcdd1ce433c**. The complete actual receipt is in [Root Evidence V16](M04_RECOVERY_R25_EVIDENCE_V16.json).

Exact R24 Preview **dpl_6JpTt5vYStzuznEgmLfPYgfsJwAa** was READY on1aecc. That does not accept native failure and is not a Preview gate for a future changed head.

## Exact selected correction and independent review

Only the SELECT body of `official_v3_jobs_private.exact_keys_v1` changes:

```sql
  SELECT v IS NOT NULL AND expected IS NOT NULL AND jsonb_typeof(v)='object' AND
    ARRAY(SELECT k FROM jsonb_object_keys(CASE WHEN jsonb_typeof(v)='object' THEN v ELSE '{}'::jsonb END) k ORDER BY k COLLATE "C")
    = ARRAY(SELECT k FROM unnest(expected) k ORDER BY k COLLATE "C")
```

The R24 nested fast/fallback path, membership/deletion and count are removed. The original NULL/type guards and safe object CASE remain. Both same element sequences are C-sorted, duplicates and NULLs retained, and unchanged unnest flattens all dimensions/lower bounds. Both construction methods produce one-dimensional nonempty arrays with lower bound1; an empty constructor equals the old COALESCE empty array. The selected k remains **uncollated**, with explicit C only in ORDER BY, preserving result/equality collation. No new acceptance limit, normalization or validation omission.

Primary PostgreSQL16 source independently read by Root and reviewer confirms array construction/aggregate results, NULL retention, collation derivation and executor initialization. SQL-function execution starts/ends the executor and initializes its planned subplans; unused InitPlans can still avoid evaluation. R24 has three source subqueries; this body has two. Aggregate/COALESCE frameworks and the extra R24 operations are removed, but valid inputs again execute sorting and array construction. This is a concrete structural rationale, **not a measured speedup or explanation of the observed timeout**. No actual CI-server plan/profile, runtime margin, full-cap Rule latency or Production SLO is claimed. History remains quadratic.

All **29 declarations/LANGUAGE/attributes/search_path**, ending delimiters and every other SQL byte remain exact. Native changes only the selected explanatory comment and two case labels removing the obsolete word fallback. All query values, wanted booleans, original-expression differentials, assertions, connection/query counts, **36 cases/72 default+C observations**, prior queries and **31 group names/order** remain. Default and C are two selected modes and need not represent different collations in CI. No new test/query/collation object, any/suppression/domain cast, helper or fixture seed.

SQL **138695bytes/4861f083bffcc5fb662128bff01e687662d62f5e8e5bf6af3512efbaad8616aa**, blob **67f073a0d19b31309f8276bba62770a4f36f8fb9**. Native **175150bytes/ae583470991dd991e1775af845cd8dfe71c878770339adca00545e5e248b922a**, blob **89f8026cf0b96971f529d6ab59fe14a2fbfe6150**. All18aggregate **7617013b8a5f8fd83e59d8ec577cd2e9aacfb51849850944fae1e3e6744b0d6d**. Other16pins including rollback **9b9089d74242a802455cc7e3fb8a0a8515c17b61b45ae730b9bbba1adb650a66** remain exact.

Root and same reviewer independently reconstructed the final files; inverse transformations recover exact1aecc source. Their conclusion is **source-only suitable for full new CI**, not compiler/runtime/TL acceptance.

## Ownership, history and continuity

Same actual author **Jetnity Official Truth V3 Durable Jobs1 — Codex Generation2**, session **/root/m04_durable_jobs_writer_g2**; reviewer **/root/m04_r9_review_g2**; auditor **/root/m04_live_audit_g2**. No new generation or invented Cursor session. Author STOP after finite delivery. Original G1/checkout has not been recovered/reconstructed; the new scratch context has not been used for project execution.

Root independently reconstructed the four author documents. All **14 prior failure objects**, genuine R21 PR success, corrected separate R22 terminal observation and old Markdown tails remain exact. The actual R24 failure is appended as the **15th**, while all current new-head execution/PASS/Ready/merge flags remain false. Older N02/R9 passes are historical evidence, not current per-row acceptance.

Author owns exactly two source files and four existing M04_PHASE_B records. Root owns four new V16 Task/Review/Evidence/Excerpt files and six current entries: M04_HANDOFF_V1 plus only unique current markers in START/ACTIVE/ROADMAP/JETNITY_HANDOFF/ARCHITECTURE. All outside-marker bytes and earlier V13/V14/V15 records remain unchanged. Expected publication delta **16paths:2sources+14docs**, cumulative PR **28paths:2sources+26docs**. Preserve/read back the complete tree, all leaf modes and all **22 omitted binary IDs**, without retrieving binary content.

## First unfinished step and complete acceptance gates

Root must verify the complete finite source/document delivery, refresh expected head **1aecc862c4b2710bb12c900195259ee25eb6f70d** and main4bfa, publish on **fix/official-truth-v3-m04-postmerge-r22-20261110** with expected-head lease/no force, then independently read back every changed blob, full tree and ancestry. Existing #1182 remains Draft. Every changed head invalidates earlier exact-head gates.

Require complete unchanged new CI: all8jobs, Typecheck/Lint/Core/Hygiene/Build, all31nativegroups in exact order, both realR9 races, full254/255/256ledger and64/65cycles, **761inherited guard pairs/minOwned4182**, final rollback/latewriter and complete terminal cleanup. Independently verify exact Preview, main/base/ahead/behind/full diff, all reviews/threads, strict rules, Mode/Guardian and reserved gates. Only Root may issue TL PASS, Ready and expected-head merge. Any failure returns to the same author/session with a concrete versioned correction and full new gating. No unchanged-known-bad rerun.

After any permitted merge, actual new main must independently pass full CI/native and Production must match through both jetnity.com and jetnity-app.vercel.app. Earlier PR success cannot substitute. Finite docs closure remains held: only after genuine product/main acceptance may two new Root completion records and these six current entries proceed with their own PR and actual docs-main CI/Production gates, then a final existing-PR/#751 receipt without an endless self-attestation chain. No issue closure or automatic next slice.

Frozen limits: **240 s effects + 60 s cleanup / 300 s total; four outer lanes and four native operations per family; eight active native / 256 total with 16 terminal admissions reserved; eight callbacks / 128 total; 30 s outer / 5 s child; three clusters / two children / 40 aggregate work connections / two M04 observers / one method observer / 16 fixture connections per cluster.**

## Live evidence and risks

- P0: no newly verified Production incident in permitted evidence.
- P1: actual R24 budget failure and earlier actual-main failure block M04 completion; the new source is unexecuted.
- P2: quadratic history work, unknown following fixture-database outcome and unproved general latency/margin remain.
- P3: two inherited layout skips and original G1/checkout discontinuity remain explicit.

Root's latest full safe gate snapshot **13:35:19UTC** confirmed unchanged main4bfa, Mode NORMAL, active strict ruleset21875372 without bypass, no review/inline/Vercel threads, no new permitted Owner/Guardian changes,15openPRs/48nonPRissues. Later head/main refreshes are recorded in evidence. Production **dpl_99pQXe4BdoDExkYqxkL5eNdTJZrD** was READY on main4bfa with both aliases independently matched. SQL remains UNAPPLIED. D1#1169 and separate#1181 remain unfinished/outside scope.

## Reserved gates and boundaries

Method **NOT_APPROVED**. #1139 **NOT_RELEASE_READY**, pre-Owner gaps E01, E04, E06, E07, E09, E10, E11, E13, E15, E16, E17, E18, E21, E22, E24, E25, E28. #917 specifically refused independent readback remains pending, ledger UNKNOWN, Stage2 NOT_ATTEMPTED: no retry, rephrasing, delegation, rerouting, transport switch, human SQL substitute or renewed old Owner evidence request. #1131 Ready STOP; both #1135 holds; #968 preview isolation and #911/#913 privacy remain.

No hosted DB/Auth/RLS/ACL/migration/credential action or Auth-log access, real source/provider/research call, scheduler, notification, new cost or public V3 activation. No local PostgreSQL/native/socket/parser/project/build execution, installation/download, missing binary retrieval, clone/reconstruction or replacement environment. Native proof only in the unchanged existing GitHub CI. No git fetch/push; any local git reads require GIT_NO_LAZY_FETCH=1 and GIT_OPTIONAL_LOCKS=0. Preserve all 22 omitted binary IDs. No automatic next product slice.

No Auth or Vercel build logs were read. Root alone may read completed non-Auth Repository-verification logs after independently observing terminal job metadata. Primary PostgreSQL source reads and pure in-session text/data transformations/hashing are source analysis, not project/SQL execution. No hosted database truth is inferred from deployment metadata.
