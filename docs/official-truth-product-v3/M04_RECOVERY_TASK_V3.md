# M04 Recovery — TASK V3 / R12 SQL syntax correction

**2026-11-10 02:23:09 UTC. Root continuation of Draft PR #1178.** Supplements TASK V1, the Phase-A freeze, plan, T01–T03 and [Recovery TASK V2](M04_RECOVERY_TASK_V2.md). This is the immediate review fix in the same Generation 2 session.

## Actual failed baseline

- Head `7ac9c4bc3f284775e5236d5d862e90fabbf2822b`; tree `155189bf6a71f9f56909bea2a976b56b97def43c`.
- Branch `feat/official-truth-v3-durable-jobs-1-20261109`.
- Current main / merge-base `890dfe9323b4b6d3644c372d81cb8893b6548d11`; baseline ahead 4 / behind 0.
- [CI 42739327115](https://github.com/Jetnity/jetnity/actions/runs/42739327115), attempt 1, failed [Repository verification 129576216777](https://github.com/Jetnity/jetnity/actions/runs/42739327115/job/129576216777).
- Root independently read the non-Auth log. Receipt: failure phase `jobs_candidate`, SQLSTATE `42601`, `nativePass=false`, zero native groups and zero R9 witnesses. Cleanup 22/22 settled, 0 pending, connections 2/2 closed, one cluster stopped, no cleanup failures.
- [Root R12 CHANGES REQUIRED / same-session dispatch](https://github.com/Jetnity/jetnity/pull/1178#issuecomment-6757102845).

## Finite author assignment

Sole writer remains **Jetnity Official Truth V3 Durable Jobs 1 — Codex Generation 2**, actual session `/root/m04_durable_jobs_writer_g2`. Root dispatched the immediate fix to that existing session. No new author generation or Cursor-session claim.

Make exactly two parenthesizations in the new `jobs-candidate.sql`:

1. In the predecessor-pins DO block, surround the CASE operand of `IS DISTINCT FROM` with parentheses.
2. In `tx_queue_cas_v1`, surround the CASE summand of the quota IF condition with parentheses.

The source delta is four added ASCII parentheses, two lines, one source file. No values, predicates, quotas, roles, grants, schemas, RLS, transaction boundaries, method decisions or runtime budgets change. No unrelated cleanup. A preliminary reviewer allegation about a fourth parenthesis on line 72 was disproved by the exact published source and withdrawn; that valid line stays unchanged.

Root and an independent reviewer inspected the [PostgreSQL 16 grammar](https://github.com/postgres/postgres/blob/REL_16_STABLE/src/pl/plpgsql/src/pl_gram.y), retrieved blob `cd172ef2f8d6c792b0ee26f5162ced0c90694277`: the PL/pgSQL IF reader terminates at THEN at parenthesis depth zero and tracks parentheses/brackets, not CASE nesting. Both bare CASEs terminate early; enclosing parentheses prevent that. Other CASE occurrences in IF conditions were inspected and already have enclosing call/subquery/group parentheses. This is source analysis, not a parser/native execution result.

Update only the four author evidence files within the existing frozen 18-source plus 4-evidence inventory. Preserve the old failed CI and historical 64/64 nonnative results as historical facts. Record the new SQL and 18-source aggregate and the still-pending actual native gate truthfully. Root owns this task, independent review, continuity pointers, remote publication and all PASS/Ready/merge decisions.

## Capability and publication

The local execution environment became unavailable after the complete 7ac candidate and checkpoint were published, read back and matched to the clean local tree. No unpublished source was lost. GitHub/Vercel connector reads remain available. The author delivers exact source replacements and evidence transforms in memory; Root independently materializes, hashes, reviews and publishes through the existing GitData connector with the expected branch head. No local tests, parser, database or build are claimed for this correction.

Root verifies SHA256 and Git blob hashes in the orchestration JS runtime, checks them against known hash vectors and prior published hashes, reconstructs the full baseline Git tree from its returned entries, then reconstructs the expected updated tree. This is content-integrity verification only. No repository or PostgreSQL code runs there.

After publication, run and inspect the **unchanged complete CI on the new exact head**, including all 31 native groups, both R9 witnesses, full process/resource cleanup, core tests, hygiene and production build. Recheck synthetic merge tree, exact Preview, required checks, reviews, live main and Guardian current evidence. Every changed head invalidates prior exact-head gates. No unchanged-known-bad rerun. If another actual failure occurs, return CHANGES REQUIRED to the same G2 session.

Author STOP after coherent delivery. PR remains Draft until Root independently clears all applicable gates.

## Unchanged special gates

Method **NOT_APPROVED**. #1139 **NOT_RELEASE_READY**, pre-Owner gaps E01, E04, E06, E07, E09, E10, E11, E13, E15, E16, E17, E18, E21, E22, E24, E25, E28. #917 specifically refused independent readback remains pending, ledger UNKNOWN, Stage2 NOT_ATTEMPTED: no retry, rephrasing, delegation, rerouting, transport switch, human SQL substitute or renewed old Owner evidence request. #1131 Ready STOP; both #1135 holds; #968 preview isolation and #911/#913 privacy remain.

No hosted DB/Auth/RLS/ACL/migration/credential action or Auth-log access, real source/provider/research call, scheduler, notification, new cost or public V3 activation. No local PostgreSQL/native/socket execution, installation/download, missing binary retrieval, local full build or alternate execution environment. Native proof only in the unchanged existing GitHub CI. No git fetch/push; if local git becomes available, reads require GIT_NO_LAZY_FETCH=1. Preserve all 22 omitted binary IDs. No automatic follow-up product slice.
