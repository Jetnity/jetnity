# M04 — current Root handoff V1

**10 November 2026 — R12 source correction reviewed; new-head native/full CI acceptance OPEN. Draft; no Ready, merge or activation.**

## Mandatory reading and next step

Read JETNITY_START_HERE.md, [Operating Standard](../JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md), [ACTIVE_WORK_STATUS](../ACTIVE_WORK_STATUS.md), **[latest Root Review / Continuity V3](M04_RECOVERY_ROOT_REVIEW_V3.md)** and [Recovery TASK V3](M04_RECOVERY_TASK_V3.md), then the preceding [V2 review](M04_RECOVERY_ROOT_REVIEW_V2.md), immutable [saved interruption](M04_CHAT_TRANSITION_2026-11-10.md), [Phase-A freeze](M04_PHASE_A_FREEZE_V1.md), [TASK V1](M04_TASK_V1.md), [plan](M04_PLAN_V1.md), [T01–T03](M04_PHASE_B_TECHNICAL_ALLOCATIONS_V1.md), and live #1178/#751/#1162.

**First unfinished gate in this snapshot:** complete unchanged CI on the corrected candidate, including actual installation, all 31 native groups/N01–N15, both R9 witnesses, process exit and complete owned-resource cleanup, core/hygiene/build, exact Preview, reviews, protection and live main. Current commit/run/merge facts are in read-back PR receipts. Every new head invalidates prior exact-head gates. Actual failure returns CHANGES REQUIRED to the same Generation 2 session; no unchanged-known-bad retry or hidden skip/timeout change.

## What actually happened

The interrupted chat saved d9d62c690658444e06d04becf93f21ffb9112165. Root verified all 64 changed blobs and preserved that checkpoint. Its actual CI failed; the earlier green 05b document head was no runtime acceptance.

Root published the full R9/R10/R11 recovery as `7ac9c4bc3f284775e5236d5d862e90fabbf2822b`, tree `155189bf6a71f9f56909bea2a976b56b97def43c`, integrated with current main 890. All 71 compare blobs and the CI synthetic merge tree matched exactly. [Publication receipt](https://github.com/Jetnity/jetnity/pull/1178#issuecomment-6756777462).

Actual [CI 42739327115](https://github.com/Jetnity/jetnity/actions/runs/42739327115) failed in `jobs_candidate` with SQLSTATE `42601`. Native groups and R9 witnesses were empty, nativePass false. Root independently read the non-Auth log: core 8658/8655 pass/1 fail/2 skip/0 cancel; lifetime22/22 settled,0pending,2/2connectionsclosed,1clusterstopped,0cleanupfailures. Typecheck/Lint and six other jobs passed; hygiene/build skipped. [Safe negative excerpt](M04_RECOVERY_R12_NATIVE_FAILURE_V3.txt). READY Preview on exact 7ac did not clear the failed gate.

Same-session R12 adds parentheses around exactly two CASE expressions in PL/pgSQL IF conditions. Root and an independent reviewer confirmed the grammar cause from PostgreSQL16 source. Only four ASCII bytes in one SQL file change; seventeen other source files remain identical. New candidate SHA256 `ed8cf918bb595b6933d4517575d0b8bb6a583277302f5dcc83a6ccee150c123c`, aggregate `c8062e47c23e11b1d7bfb1da66331ab779a11952c45651f492962d4ea6c9479a`. This is accepted for CI, not a native/full Technical Lead PASS.

## Evidence and capability boundaries

[Current source manifest](M04_PHASE_B_SOURCE_MANIFEST_V1.json), [assertion matrix](M04_PHASE_B_NATIVE_EVIDENCE_V1.json), [author status](M04_PHASE_B_STATUS_V1.md), [self-review](M04_PHASE_B_SELF_REVIEW_V1.md), [Root R12 receipt](M04_RECOVERY_R12_EVIDENCE_V3.json).

Root's previous 64/64 nonnative tests, focused TypeScript16 roots and ESLint zero errors/warnings were run on stable prior pins. They are preserved as historical results; no new local execution happened for R12. The local execution environment became unavailable after the full 7ac source/checkpoint publication and clean-tree readback. GitHub/Vercel connector access survives. Root verifies source and Git trees in orchestration JS only; no PostgreSQL/parser/runtime execution or alternate environment. Native proof remains restricted to the existing unchanged CI.

R9's real blocked-backend witness, backend absence after close, retained executor drain and four-lane custody are different assertions. The fixed protocol bridge in the raw-composition unit does not prove private authorityCore, a separately observed worker promise or natural30s timeout. Neither native R9 case ran on failed7ac.

## Sessions and baseline

Sole author: **Jetnity Official Truth V3 Durable Jobs 1 — Codex Generation 2**, actual session `/root/m04_durable_jobs_writer_g2`. R12 returned to that same session. Original Generation1 was proven unavailable after context loss; no invented Cursor continuity. Independent reviewers `/root/m04_r9_review_g2` and `/root/m04_live_audit_g2`; only Root publishes/PASS/Ready/merges.

Current main remains `890dfe9323b4b6d3644c372d81cb8893b6548d11`, tree `8c611ec31d518cce88a3a5abb75aecf6620d794c`; main CI42736015143 all8SUCCESS. Root rechecked both Production aliases: READY `dpl_7K4gHmn2d2HBqCq1CHBThRjAXHw7`, exactmain890, aliasError null. PR1180/atlas and PR1179/booking work remain preserved. MI1#1177 stays historically post-merge accepted. D1#1169 is separate Draft/unfinished. None of this accepts M04 production or hosted database truth.

## Unchanged gates

Method **NOT_APPROVED**. #1139 **NOT_RELEASE_READY**, pre-Owner gaps E01, E04, E06, E07, E09, E10, E11, E13, E15, E16, E17, E18, E21, E22, E24, E25, E28. #917 specifically refused independent readback remains pending, ledger UNKNOWN, Stage2 NOT_ATTEMPTED: no retry, rephrasing, delegation, rerouting, transport switch, human SQL substitute or renewed old Owner evidence request. #1131 Ready STOP; both #1135 holds; #968 preview isolation and #911/#913 privacy remain.

No hosted DB/Auth/RLS/ACL/migration/credential action or Auth-log access, real source/provider/research call, scheduler, notification, new cost or public V3 activation. No local PostgreSQL/native/socket execution, installation/download, missing binary retrieval, local full build or alternate execution environment. Native proof only in the unchanged existing GitHub CI. No git fetch/push; if local git becomes available, reads require GIT_NO_LAZY_FETCH=1. Preserve all 22 omitted binary IDs. No automatic follow-up product slice.
