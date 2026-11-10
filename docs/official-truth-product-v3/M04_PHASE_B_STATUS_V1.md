# M04 Phase-B author delivery status V1

**R12 SAME-SESSION CORRECTION PREPARED — INDEPENDENT ROOT REVIEW AND NEW NATIVE CI REQUIRED.**

Author: **Jetnity Official Truth V3 Durable Jobs1 — Codex Generation2**, actual session `/root/m04_durable_jobs_writer_g2`. [R12 CHANGES REQUIRED](https://github.com/Jetnity/jetnity/pull/1178#issuecomment-6757102845) resumes the same Generation2 session against published head `7ac9c4bc3f284775e5236d5d862e90fabbf2822b`, tree `155189bf6a71f9f56909bea2a976b56b97def43c`. Root owns the Task V3 supplement, review and publication.

## Current correction and source identity

Only two CASE expressions in `jobs-candidate.sql` gain enclosing parentheses: the predecessor-default comparison and the final queue-CAS quota condition. These are two line edits adding **four ASCII bytes**. Values, comparisons, branches, quotas and all other source bytes are unchanged. The valid ACL expression at line 72 is unchanged.

PostgreSQL 16's [PL/pgSQL grammar](https://github.com/postgres/postgres/blob/REL_16_STABLE/src/pl/plpgsql/src/pl_gram.y), fetched blob `cd172ef2f8d6c792b0ee26f5162ced0c90694277`, reads an IF condition until the first THEN outside parentheses/brackets. An unparenthesized SQL CASE therefore terminates that condition at its inner THEN, leaving an incomplete expression. The first occurrence is in the predecessor-pins DO block; the same defect also exists in the queue-CAS function. Parentheses preserve the full CASE expression for SQL parsing.

The bounded source inspection found those two occurrences among 262 IF/ELSIF sites and no remaining occurrence after correction. This is **source inspection, not PostgreSQL parsing or execution**.

- Corrected SQL: **135,966 bytes**, SHA256 `ed8cf918bb595b6933d4517575d0b8bb6a583277302f5dcc83a6ccee150c123c`.
- Eighteen-source aggregate: **`c8062e47c23e11b1d7bfb1da66331ab779a11952c45651f492962d4ea6c9479a`**.
- The other seventeen source pins are retained unchanged from 7ac9c4. Rollback and all TypeScript sources are unchanged.
- The complete U01–U07/N01–N15 map remains in the author evidence JSON, with historical unit results and current native-pending status explicitly separated.

## Actual failed CI and verification limit

[CI 42739327115](https://github.com/Jetnity/jetnity/actions/runs/42739327115), Repository verification job 129576216777, executed 7ac9c4 and failed at **jobs_candidate / PostgreSQL 42601**. Its pinned candidate hash is the prior `3f17aebe…`. The receipt contains **no native groups and no R9 witnesses**, nativePass:false, 22/22 operations settled, 2/2 connections closed, one stopped cluster and no cleanup errors. Core totals are **8,658 tests: 8,655 passed, one failed, two skipped**. The complete safe receipt is preserved in the updated evidence.

The execution environment is now **unavailable**. No new local tests, typecheck, lint, SQL/parser/native execution, installation, build or replacement environment was attempted. The earlier **64/64 unit PASS**, TypeScript 0 diagnostics and lint 0 warnings/errors apply to unchanged TypeScript bytes and were **not rerun**; they do not validate the SQL correction. Corrected native execution remains a new-head CI gate.

## STOP and unchanged gates

**AUTHOR STOP FOR ROOT REVIEW.** Root must review and publish the two-line correction, then independently inspect new exact-head unchanged CI/native receipts and live deployment/thread gates. No unchanged-code CI retry, Ready, merge, database installation or automatic follow-up slice was performed.

Method **NOT_APPROVED**; #1139 **NOT_RELEASE_READY / 17 gaps**. #917's specific readback refusal remains binding; no retry or substitute. #1131, both #1135 holds, #968 and #911/#913 remain. No hosted DB/Auth/RLS/ACL/migration/credential/Auth-log operation, real source/provider call, scheduler, notification, cost or activation.

## Previous Generation2 delivery — historical snapshot before R12

The following record describes the earlier source cut published in 7ac9c4. Its old source digest, “current” wording and executed checks are historical; the R12 status and pins above take precedence.

**GENERATION2 CORRECTIONS DELIVERED FOR INDEPENDENT ROOT REVIEW — CURRENT NATIVE CI PENDING.** This is an author delivery, not a Technical-Lead PASS, Ready, merge, database installation or activation.

Author: **Jetnity Official Truth V3 Durable Jobs1 — Codex Generation2**, actual new session `/root/m04_durable_jobs_writer_g2`. [Recovery dispatch](https://github.com/Jetnity/jetnity/pull/1178#issuecomment-6756274057) on exact HEAD `d9d62c690658444e06d04becf93f21ffb9112165`; binding supplement [M04_RECOVERY_TASK_V2.md](M04_RECOVERY_TASK_V2.md). Generation1 `/root/m04_durable_jobs_writer` is unavailable after context loss. No same-session continuity with Generation1 or Cursor session is claimed. Immediate corrections return to this actual Generation2 session.

## What this continuation changes

| Finding | Finite correction and evidence limit |
|---|---|
| R9 | Three added composition unit witnesses and one native proof group with two cases: natural unchanged5s I1 timeout and explicit worker/integration caller abort. The same nested S1 `reserve_v1` executor remains held; no fail/complete CAS or early lane release. Direct raw-composition unit observes integration return separately from actual drain. Native PID/birth/SQL wait, backend absence during held cleanup and exact S1 state assertions await CI. |
| R10 | Four double `set_config` SELECTs now have distinct output aliases, preserving query counts and the protected duplicate-column decoder. Finite fixture/proof phase and bounded sanitized error-code diagnostics expose setup/assertion/cleanup failure without raw SQL, errors or parameters. |
| R11 | New candidate `assert_catalog_v1` loop record is `binding_row`; installer ownership loop is `function_row`. This removes PL/pgSQL record/catalog alias collisions without changing protected SQL or `variable_conflict`. Actual installation still requires CI. |

No runtime defect in the existing nested ownership design was established by R9. This delivery supplies the missing combined proof. The initial extra raw-composition TypeScript check reported its nominal request brand; the explicitly labelled test-only protocol bridge was typed accordingly and the final focused check is clean.

## Exact source cut

All eighteen sources are pinned in [M04_PHASE_B_SOURCE_MANIFEST_V1.json](M04_PHASE_B_SOURCE_MANIFEST_V1.json). Aggregate SHA256 **`cc2e47f1afcec38ea749b1d3f88372a18ed01e14b2005501585e96dee4df1c3f`** uses sorted `SHA256 SPACE decimalBytes SPACE repositoryPath LF`. Evidence files are excluded from their own source digest. Four source paths changed from d9; fourteen are byte-identical.

| Changed source | Bytes | SHA256 |
|---|---:|---|
| `lib/readiness/official-truth-product-v3/jobs/composition.test.ts` | 27466 | `4b8cc4d40cda71d07a4a99c38a103634d194d24bf288fd6a73cfe0f87014820c` |
| `scripts/db/official-truth-v3-durable-jobs-1/jobs-candidate.sql` | 135962 | `3f17aebedfb69891a1ad5ccea7a7f1326d2431ba6a73c9d790254c581fe65fdb` |
| `scripts/db/official-truth-v3-durable-jobs-1/native-adapter.ts` | 13389 | `5c34ce52023d7840e09d004d9c577a2bd4dc78efb3171e7e7b8aff07b0cf7b57` |
| `scripts/db/official-truth-v3-durable-jobs-1/native.ts` | 136951 | `670f4a62b0f7b8964de8f2df4fd3ef99044067c9c92484e1d7c1fd53374deaac` |

The unchanged rollback is SHA256 `9b9089d74242a802455cc7e3fb8a0a8515c17b61b45ae730b9bbba1adb650a66`. Frozen plan remains120753 bytes, SHA256 `1952dc9c930021d32620f769595bb6f1641743574265f918cad6d36cfefdb88e`. All49 protected input paths were independently compared with d9 and are byte-identical in this Generation2 cut; the two authority paths changed earlier by Generation1 are unchanged here. Historical Phase-A/V7 documents and sixteen omitted binary/skip-worktree paths remain untouched by this author.

Root reports concurrent main `890dfe9323b4b6d3644c372d81cb8893b6548d11` after PR#1180. It does not overlap these eighteen sources. Root owns current-main integration and the shared ROADMAP addition. This source cut is relative to d9 and does not assert that integration/publication has already happened.

## Checks actually completed on this cut

| Check | Result | Practical limit |
|---|---|---|
| Five named nonnative contract/scope/postgres/composition/MA1 files | **64/64 PASS**,0 failed/cancelled/skipped;8102.282633ms | Protocol doubles and actual existing coordinator control flow; no native persistence evidence |
| Focused TypeScript with repository options and sixteen allowed roots | **PASS,0 diagnostics**; TypeScript5.9.3 | Static noEmit program, not full repository build/typecheck |
| ESLint over sixteen allowed TS sources | **PASS,0 errors/warnings**, empty output | Static only |
| Source and protected input comparison |18 pinned sources;49/49 protected inputs equal d9 | Before Root integration/pointer updates; no live deployment assertion |

Node was24.22.1; CI uses22. Exact commands, results and log hashes are stored in the manifest. No package installation or missing binary retrieval occurred. The full U01–U07/N01–N15 map is in [M04_PHASE_B_NATIVE_EVIDENCE_V1.json](M04_PHASE_B_NATIVE_EVIDENCE_V1.json) and the companion self-review. A map records concrete assertions and limits; it is not native acceptance.

## Actual historical CI and required next gate

[Run42732722870](https://github.com/Jetnity/jetnity/actions/runs/42732722870) did execute d9 and failed. Core8661/8658pass/1fail/2inherited skips; M04 failed setup before every N01–N15 group. Its truthful receipt reports18/18 operations settled,2/2 connections closed, one cluster stopped and nativePass:false. The old AggregateError masked the inner error. Distinct-alias R10 is a source-derived correction of a concrete decoder incompatibility; corrected CI must confirm progression. R11 installer fixes likewise remain source-verified only.

**This new source cut has not run native CI.** Its `nativeExecuted:false` is separate from the recorded failed historical run. The unchanged mandatory `jobs/native.test.ts` entry has no availability skip. Existing budget remains240s effect work plus60s whole cleanup, at most three sequential clusters, two children, sixteen fixture sessions per cluster, aggregate4+4+4 native lanes/40 work connections, two M04 observers and one MA1 observer. T01–T03 remain unchanged.

Root must independently review the exact sources/map, reconcile current main, publish a new exact head and inspect actual unchanged CI/native receipts plus exact-head Preview/Production and remaining gates. Changed heads invalidate previous gates.

## STOP and unchanged Owner boundaries

**AUTHOR STOP FOR ROOT REVIEW.** No Ready, merge or automatic follow-up slice. R9/R10/R11 are source-addressed for independent review; native acceptance remains open. No local PostgreSQL/native SQL/socket, full core/build, Git mutation/fetch/push, hosted DB/Auth/RLS/ACL/migration/credential operation, Auth-log access or real provider/source call occurred.

Method **NOT_APPROVED**; #1139 **NOT_RELEASE_READY /17 gaps**. #917 specific readback refusal remains binding: no retry, reformulation, delegation, alternate transport or human substitute. #1131 Ready STOP, both #1135 holds, #968 and #911/#913 remain. No production activation, scheduler, public route, notification or cost is authorized by this delivery.
