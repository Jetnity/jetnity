# M04 R31 — Root source review V22

**2026-11-10 19:26:20 UTC. SOURCE REVIEW COMPLETE FOR PUBLICATION ONLY. No corrected-head runtime or Technical-Lead PASS.**

## Decision

Publish the independently reviewed two-byte syntax correction on existing Draft#1183, followed by full new-head gating. The complete native proof and every frozen budget remain required. [Binding task](https://github.com/Jetnity/jetnity/pull/1183#issuecomment-6777004330) · [V22 task](M04_RECOVERY_TASK_V22.md) · [full history and evidence](M04_RECOVERY_R31_EVIDENCE_V22.json).

## Observed failure and review correction

On exact dfd0fcf0ca70a955ae568e19f0d4b633cb0d7066, CI42881395864/attempt1 is terminal FAILURE. Root read Repository130058297808 only after terminal observation at19:19:28UTC. M04 failed in jobs_candidate with42601 before every native group. The full original1762-byte receipt and4244931-byte log pin are retained in V22 JSON. Core8669PASS/1FAIL/2inherited skips; no hygiene/build acceptance. All six companions succeeded, including actual-mounted Lifecycle.

The previous author, Root and independent source reviews missed the PL/pgSQL IF-condition delimiter. This is a review defect; source agreement did not prove successful compilation. The1106ms setup failure does not measure the proposed validation optimization.

Root independently read immutable PostgreSQL16 grammar at commitc372fbbd8e911f2412b80a8c39d7079366565d67, blob6a09bfdd67508d237309c1e703c52c12e070a4b4. expr_until_then selects K_THEN as terminator; read_sql_construct stops at that token when parenthesis depth is zero. It tracks only parentheses/brackets. An unparenthesized CASE in the IF predicate therefore submits an incomplete CASE expression. The observed log exposes no inner source position; this exact causal identification is independently derived from grammar and source.

## Exact minimum delta

Only civil_date_v1 gains an opening parenthesis before its month-length CASE and a closing parenthesis after its matching END. Both nested THEN tokens stay inside the parenthesized SQL expression. SQL expression meaning, valid-date operations, fallback exception handling and context-dependent to_char behavior remain the same.

| Identity | Published R30 | Corrected R31 |
|---|---|---|
| UTF8 bytes |140539|140541|
| SHA256 |a61011a2bfd0d11c451302e8e434c25fec37f47415f34f3f25da785d1aea7174|fa111694fb535b867bbb16e3d7b334d48d4e4092bf1f312dd2838a7eed2c37aa|
| Gitblob |36ce89a5bf9a3b4eae096701c3e33af3d85ad029|90d9f0466869cf19654aac63245916c5bda16066|

The unique span is217bytes before/219after. Exact inverse reproduces every byte of dfd SQL. All29 declaration/attribute pairs and other28 function bodies remain identical. exact_keys_v1 remains unchanged. All17 other M04 source files remain unchanged. Aggregate **c7361e9411c218ed98f94715a8eb3c852f71c2f8a67720dbb3048807b17d1664** uses UTF8 concatenation of SHA256, SPACE, decimal byte length, SPACE, repository path, LF, sorted by path.

Root, the same author session /root/m04_durable_jobs_writer_g3 and independent reviewer /root/m04_recovery_source_review_g3 independently computed identical corrected pins. Author self-review is not TL-PASS.

## Whole added native block inspected

Native remains191098bytes/SHA256f5d849c643ff22d264bc9adc1a7cd65f12caaac80a804647604851f22effbde0/blob0b3f7d9906687ec42171de5af60fed009d07b39f. Its12120-byte R30 addition remainsSHA2569e84c778c03b3c94b59dc0836bf1ff51b22ee689eb817145eb98897ed6f9b5d8.

Both DO-block CASE assignments are read until semicolon by the pinned assignment grammar. IF/ELSIF predicates have no CASE. The three FOR SELECT/VALUES forms have no internal LOOP terminator. The key-oracle CASE expressions use ordinary SQL. No other delimiter hazard was found. No parser, project or SQL execution occurred in this review. Actual N02 execution remains necessary.

## Preserved integration and evidence

Current main e7aae86c18238033c2186722e24c84dc7a5f69b9 and parent dfd remain exact. R31 changes one source plus nine finite Root continuity paths; cumulative PR scope14paths. Root will derive from the existing tree and preserve all36 parallel#1181 leaves, every binary and every unlisted leaf. Five central files retain all bytes outside their current markers.

V21 and older task/review/evidence records remain immutable historical snapshots. V22 embeds complete additional e7 attempt1, R30 and external e7 attempt2 native receipts and identifies each final job/log. Attempt2's five carried-forward companion statuses are not newly executed proof. The outstanding e7 START outcome remains UNKNOWN. R30's new date/key tests have not run successfully.

## Remaining gates and risk

Corrected-head execution, all31 native groups, realR9, full quotas, inherited guards, rollback/late-writer, complete cleanup, all8CI jobs, Lifecycle/Core/five hygiene/Build, exact Preview and fresh live/Owner gates remain unfinished. The successful dfd companion runs do not pass the new head.

No new P0 established; P1 acceptance and target/authority holds remain. Existing P2 privacy holds remain. P3 timing/public-operation claims remain unproved; history traversal remains quadratic. SQL UNAPPLIED, Method NOT_APPROVED, #1139 NOT_RELEASE_READY/17gaps, #1131 ReadySTOP, both#1135 holds, target-specific#968 isolation, #911/#913 privacy and #917 UNKNOWN/Stage2 NOT_ATTEMPTED/no retry or substitute remain unchanged.

No local or hosted/Auth/credential/provider execution, rerun, Ready or merge occurred. Only Root may decide after full independent gating. Then actual-main full acceptance, the held separate8-path documentation closure with its own PR/main gates, final existing-thread receipts and STOP. No automatic next slice.
