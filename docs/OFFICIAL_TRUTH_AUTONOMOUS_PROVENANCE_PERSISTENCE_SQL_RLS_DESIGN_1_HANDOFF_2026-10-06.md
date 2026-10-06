# Official Truth provenance persistence SQL/RLS design 1 — handoff

Date: 6 October 2026 · Issue [#864](https://github.com/Jetnity/jetnity/issues/864) · Draft PR [#866](https://github.com/Jetnity/jetnity/pull/866)
Branch: `docs/official-truth-provenance-persistence-sql-design-1`
Author classification: **AUTONOMOUS_PROVENANCE_PERSISTENCE_SQL_RLS_DESIGN_READY**

## Review target

Review the exact pushed head named in the post-push STOP receipt and read it back from GitHub. A later head invalidates this handoff's gates; TASK-seed `d5953001bc8d94d05b7423f6f97fb9f509d7bb7f` is not the delivery head. Re-read remote main, mode, #751 and #741 before any TL integration action. Initial main/merge-base is `9adfc04ffe90693dedc059f07a396751a0625157`; all three allowed input PRs are merged into it.

TASK: `docs/OFFICIAL_TRUTH_AUTONOMOUS_PROVENANCE_PERSISTENCE_SQL_RLS_DESIGN_1_TASK_2026-10-06.md`.
Immutable blob: `cd38da2954601cd2de73203920a808e6a09b658f`.

Read the [design](OFFICIAL_TRUTH_AUTONOMOUS_PROVENANCE_PERSISTENCE_SQL_RLS_DESIGN_1_2026-10-06.md), [report](OFFICIAL_TRUTH_AUTONOMOUS_PROVENANCE_PERSISTENCE_SQL_RLS_DESIGN_1_REPORT_2026-10-06.md) and [self-review](OFFICIAL_TRUTH_AUTONOMOUS_PROVENANCE_PERSISTENCE_SQL_RLS_DESIGN_1_SELF_REVIEW_2026-10-06.md). Expect exactly four new deliverables plus the unchanged preexisting TASK in the whole PR diff. Global continuity is intentionally not updated; it is outside this writer's allowed paths.

## Highest-value independent checks

1. **Byte compatibility (§3):** B stays exactly #855 C(payload). #861 custody envelopes retain their separate exact `{kind,schemaVersion,value}` bytes and SHA-256 Pins; no #859 wrapper is retrofitted. Binding K remains separate from the receipt.
2. **Complete publication (§§4–8):** reciprocal receipt/K association, exact full-Pin FKs, typed edge derivation, no partial commit, no preexisting graph repair, one-to-one binding conflict behavior. K consumes the original object/byte/edge/depth budgets.
3. **Concurrency (§7):** READ COMMITTED, advisory lock before store reads, fresh subsequent snapshot after a wait, explicit byte comparisons and final constraint checks, commit acknowledgment. `verify_existing` refuses disappearance and uncertain commit cannot trigger blind insertion.
4. **Privileges (§§9–10):** private direct database functions, distinct credentials/executor owners, no table DML for callers, no `service_role` grant, ENABLE/FORCE RLS, no bypass/owner membership, default EXECUTE closure, fixed qualified search paths, row mutation and statement TRUNCATE guards. Actual hosting/provisioning is not assumed.
5. **Historical integrity (§11):** read-only repeatable snapshot, raw-byte/complete-closure checks, five verdicts, operational failure outside that union, safe v3 recomputation without raw packet, no live lookup or archived-code execution.
6. **Boundaries (§§12–14):** abstract qualified producer only, no #863 internals; #865 retains lifecycle decision ownership; future F8 and canonical Rule acceptance are not implemented or authorized. Unknown issuer codecs block rather than becoming arbitrary JSON.

## Validation state

Operating-mode guard PASS; standalone guard tests 16/16 PASS, no skips. Mechanical allowlist/TASK/upstream-blob/links/matrix/whitespace checks cover only documentation. Bundled guard runtime is Node v24.19.0, not the app's specified Node 22. Full app tests/build/typecheck/lint and all DB/RLS/advisor/race tests are NOT RUN locally; the no-SQL boundary is binding. Consult delivery-head CI/Preview independently; no old seed gate is promoted to delivery evidence.

Author risk assessment: P0 none, P1 none identified in the docs design; P2 future concrete codecs, private access provisioning, lifecycle decision, implementation tests and TL interface reconciliation; P3 serialized-write throughput and disclosed guard toolchain difference. Future DB behavior is not proved by the documentation or its self-review.

## Authorship and continuation

Codex Desktop session `01a10e82-70d2-7072-ae46-95e075b9ed72`; local `turn_context` model `gpt-6-astra`, effort `xhigh`; `session_meta` originator Codex Desktop, CLI 0.160.0. Single author, no subagents or independent PASS. Detailed evidence is in report §6.

The next authorized action is **independent ChatGPT / Technical-Lead exact-head review**, not implementation, migration, retention choice or a new slice. Corrections, if requested, should remain on this branch and session with a new exact-head review afterward. TL alone owns CHANGES REQUIRED/PASS/Ready/merge. Separate Product-Owner/security/privacy/apply gates remain.

**PR stays Draft. Do not mark Ready. Do not merge. Do not start a follow-up.**

**STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD EXACT-HEAD REVIEW.**
