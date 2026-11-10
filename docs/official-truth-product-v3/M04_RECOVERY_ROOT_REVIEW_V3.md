# M04 Recovery — Root Review / Continuity V3, R12

**2026-11-10 02:23:09 UTC. Finite SQL correction independently source-reviewed; actual new-head native/full CI acceptance remains OPEN. No Ready, merge or activation.**

This checkpoint supersedes [Root Review V2](M04_RECOVERY_ROOT_REVIEW_V2.md) only for the newer CI result, correction and next step. V2, its local receipts and the original interrupted-chat checkpoint remain unchanged historical evidence.

## Actual continuation and failure

The previous chat really saved checkpoint `d9d62c690658444e06d04becf93f21ffb9112165`. Root reconstructed it, preserved separate main work through PR #1180, reviewed R9/R10/R11, and published `7ac9c4bc3f284775e5236d5d862e90fabbf2822b`, tree `155189bf6a71f9f56909bea2a976b56b97def43c`, with parents d9 and current main 890. Root independently matched all 71 changed blobs and synthetic merge tree e32c9526f18ff79942e8596b437c8275e2e4f2a6 to that exact tree. [Publication receipt](https://github.com/Jetnity/jetnity/pull/1178#issuecomment-6756777462).

The actual [CI run 42739327115](https://github.com/Jetnity/jetnity/actions/runs/42739327115) then failed. Root separately retrieved [Repository verification job 129576216777](https://github.com/Jetnity/jetnity/actions/runs/42739327115/job/129576216777), without Auth logs:

| Observed item | Actual result |
|---|---|
| M04 failure | `jobs_candidate`, PostgreSQL `42601` |
| Candidate SHA256 | `3f17aebedfb69891a1ad5ccea7a7f1326d2431ba6a73c9d790254c581fe65fdb` |
| Native groups / R9 witnesses | 0 / 0; neither executed |
| Native pass | false |
| Owned lifetime | 22 started / 22 settled / 0 pending |
| Cleanup | 2/2 connections closed; one cluster stopped; 0 failures |
| Effect plus cleanup / cleanup | 975 ms / 154 ms |
| Core tests | 8,658 total; 8,655 pass; 1 fail; 2 skip; 0 cancel |
| Typecheck / Lint | success |
| Hygiene / Production build | skipped after the test failure |
| Other six jobs | success |
| Required aggregate | failed |

The safe diagnostic contains no SQL position or raw server message. It identifies the installation phase, not an exact server-reported offending line. The two source defects below independently explain invalid PL/pgSQL grammar and must be corrected before rerunning native proof.

[Exact safe excerpt](M04_RECOVERY_R12_NATIVE_FAILURE_V3.txt). Full non-Auth log: 4,227,867 characters / 62,994 lines; Root computed SHA256 `61e849c769bc9078a5b20a9ccf1a12b8a5b847f014a1ea5c2976c1a24bf319c4`. Excerpt SHA256 `fa9502da8b34be6223ecfb4eb0175d5ddf02c67e272ab2e070ab298fedddef48`.

## R12 source finding and independent review

The same Generation 2 writer diagnosed bare CASE expressions in two PL/pgSQL IF conditions: predecessor-pins line 75 and queue quota line 1020. Root and `/root/m04_r9_review_g2` independently checked the exact source and the PostgreSQL 16 parser implementation. `expr_until_then` calls `read_sql_expression(K_THEN)`; `read_sql_construct` stops at that token at parenthesis depth zero, tracking parentheses/brackets. Enclose each CASE in parentheses so its internal THEN is not the IF terminator. [Primary source](https://github.com/postgres/postgres/blob/REL_16_STABLE/src/pl/plpgsql/src/pl_gram.y), retrieved Git blob `cd172ef2f8d6c792b0ee26f5162ced0c90694277`.

Root independently applied only the author's two exact, unique replacements. Result: 135,966 UTF-8 bytes, exactly four added parentheses on two lines; line count unchanged, valid line 72 unchanged. The new source hash matches the author's independent hash.

| Pin | Corrected value |
|---|---|
| Candidate SHA256 | `ed8cf918bb595b6933d4517575d0b8bb6a583277302f5dcc83a6ccee150c123c` |
| Candidate Git blob | `935c21d0008eed09ed0843490ce254d178808aab` |
| All 18 source aggregate | `c8062e47c23e11b1d7bfb1da66331ab779a11952c45651f492962d4ea6c9479a` |
| Previous aggregate | `cc2e47f1afcec38ea749b1d3f88372a18ed01e14b2005501585e96dee4df1c3f` |
| Other source files | 17 byte-identical to 7ac |
| Rollback SHA256 | `9b9089d74242a802455cc7e3fb8a0a8515c17b61b45ae730b9bbba1adb650a66`, unchanged |

Both independent reviewers, `/root/m04_r9_review_g2` and `/root/m04_live_audit_g2`, confirmed the same two defects and found no additional concrete compile-time blocker in their bounded reviews. Other CASE-in-IF occurrences already have enclosing call/subquery/group parentheses; no third instance of this defect was found. A preliminary reviewer claim about line 72 was checked against the pinned source, disproved and withdrawn. It did not produce a source change.

**Disposition of this bounded delta: source correction accepted for publication and CI, not overall Technical Lead PASS.** Static inspection cannot establish successful installation, catalog invariants, all runtime paths or native races. Further CI findings must be handled honestly.

## Execution limits and preserved evidence

The local execution environment became unavailable after the 7ac publication and clean-tree readback. No local tests/SQL/parser/build were run for R12. Root's earlier 64/64 nonnative tests, focused TypeScript and lint remain valid historical results on unchanged TS source, but are not new-head/full-CI evidence.

Root used pure orchestration JS only for source string differences, SHA256/Git object hashing and tree reconstruction, validating the helper with known hash vectors and previous published candidate hashes. The complete 10,160-entry returned tree reconstructed exactly to `155189bf6a71f9f56909bea2a976b56b97def43c`. Every unchanged tree entry, including binary IDs, will be preserved in the publication. No local execution environment was replaced and no native code ran through this mechanism.

R9's actual nested S1 reserve proof remains mandatory. Its native backend-active wait witness, backend absence after close, retained executor/context drain and four-lane slot custody are distinct claims. The raw-composition unit's fixed protocol bridge is explicitly limited; it does not claim private authorityCore, a separately observed raw worker promise or natural 30-second timeout. Existing source and assertion matrix details remain in V2 and current author evidence.

## Live main, deployments and other work

Main is still `890dfe9323b4b6d3644c372d81cb8893b6548d11`, tree `8c611ec31d518cce88a3a5abb75aecf6620d794c`. Main CI 42736015143 had all eight jobs successful. Root re-read both Production aliases during R12: `jetnity.com` and `jetnity-app.vercel.app` point to READY `dpl_7K4gHmn2d2HBqCq1CHBThRjAXHw7`, exact main 890, aliasError null. This is baseline production evidence, not M04 acceptance.

The failed 7ac head has READY Preview `dpl_Eg2ZZiZoYd3pQAWe43w1kw7frDrS`, exact 7ac, aliasError null. The new correction requires its own Preview and CI gates. No hosted database truth was read or changed.

Live operating mode is NORMAL. Bounded new-material reads of #748 since 00:00 UTC and #751 since 02:00 UTC returned no comments. D1 #1169 remains a separate unfinished Draft; no automatic follow-up slice. Separate #1180 travel/atlas and #1179 booking work remains preserved.

## Sessions, next step and risks

Sole author: **Jetnity Official Truth V3 Durable Jobs 1 — Codex Generation 2**, actual `/root/m04_durable_jobs_writer_g2`. Immediate R12 returned to that same session. Original Generation 1 was proven unavailable after context loss; no fictional Cursor continuity. Root alone publishes, marks PASS/Ready or merges.

**First unfinished step:** publish the reviewed two-line SQL correction plus truthful author/Root evidence on expected head 7ac, verify returned content/tree/branch, then independently inspect actual complete unchanged CI on that resulting head. Require 31 native groups, both R9 witnesses, clean process/owned-resource completion, all core/hygiene/build gates, exact Preview, current reviews/main/protection. A further failure returns to the same writer with CHANGES REQUIRED. The new SHA/tree/run are recorded in read-back PR receipts because a commit cannot contain its own hash.

| Priority | Current risk/disposition |
|---|---|
| P0 | No newly verified production incident. Hosted truth remains unverified under explicit gates; do not infer authorization or safe activation from CI. |
| P1 | Mandatory M04 native installation/proofs and full new-head CI still unaccepted; R9 remains pending. Blocks Ready/merge. |
| P2 | Existing method/Dev-package/Owner gaps remain held. Static review may leave further runtime failures; unchanged CI must exercise them. |
| P3 | Local execution environment unavailable. Durable GitHub source/checkpoints and exact connector/tree readbacks preserve continuity; no new local claims. |

## Unchanged gates

Method **NOT_APPROVED**. #1139 **NOT_RELEASE_READY**, pre-Owner gaps E01, E04, E06, E07, E09, E10, E11, E13, E15, E16, E17, E18, E21, E22, E24, E25, E28. #917 specifically refused independent readback remains pending, ledger UNKNOWN, Stage2 NOT_ATTEMPTED: no retry, rephrasing, delegation, rerouting, transport switch, human SQL substitute or renewed old Owner evidence request. #1131 Ready STOP; both #1135 holds; #968 preview isolation and #911/#913 privacy remain.

No hosted DB/Auth/RLS/ACL/migration/credential action or Auth-log access, real source/provider/research call, scheduler, notification, new cost or public V3 activation. No local PostgreSQL/native/socket execution, installation/download, missing binary retrieval, local full build or alternate execution environment. Native proof only in the unchanged existing GitHub CI. No git fetch/push; if local git becomes available, reads require GIT_NO_LAZY_FETCH=1. Preserve all 22 omitted binary IDs. No automatic follow-up product slice.
