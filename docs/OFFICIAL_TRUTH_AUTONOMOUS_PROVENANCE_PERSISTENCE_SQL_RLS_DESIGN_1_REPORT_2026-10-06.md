# Official Truth provenance persistence SQL/RLS design 1 — report

Date: 6 October 2026 · Issue [#864](https://github.com/Jetnity/jetnity/issues/864) · Draft PR [#866](https://github.com/Jetnity/jetnity/pull/866)
Classification: **AUTONOMOUS_PROVENANCE_PERSISTENCE_SQL_RLS_DESIGN_READY**
Meaning: author-assessed docs-only design completion; **not independent PASS, PR Ready, implementation readiness, database verification or apply authority**.

## 1. Delivered

The [design](OFFICIAL_TRUTH_AUTONOMOUS_PROVENANCE_PERSISTENCE_SQL_RLS_DESIGN_1_2026-10-06.md) defines authoritative binary receipt bytes, a typed content-addressed artifact store, complete-Pin/name/digest uniqueness, three kinds of immutable dependency links, separate canonical custody binding and atomic publication. It specifies eight future private tables, two unexposed schemas, narrowly owned definer entry functions, independent writer/reader principals, ENABLE/FORCE RLS, explicit ACL/default-grant closure and UPDATE/DELETE/TRUNCATE denial.

The transaction design serializes ordinary publishers with one transaction advisory lock, reads winning state after acquisition, validates existing complete graphs before any insertion and acknowledges success only after commit. Known/ambiguous retries are verify-only. The historical reader is exact-fingerprint, bounded, single-snapshot and read-only; transport/authorization failures do not masquerade as absent data or integrity verdicts. A01–A46 specify future negative/concurrency/security tests. Future migration/apply/rollback and Development verification are checklists, not actions taken.

Important compatibility decisions:

- #855 payload bytes and digest domains are unchanged.
- #859 generic manifests and #861 exact custody envelopes are separate static byte-codec families; no rewrapping or extra hash field.
- K's one-to-one association, three links, object/byte/depth costs are included in the same bounded publication graph. Existing #859 ceilings are not raised.
- Unknown concrete custody issuer/semantic codecs fail closed. They are prerequisites for future implementation, not guessed producer definitions.
- No receipt, valid historical result, stored relation or private service credential supplies F8/Rule/Evidence authority.

## 2. Fresh evidence and Git identity

| Item | Observed value |
| --- | --- |
| Remote main at reconstruction | `9adfc04ffe90693dedc059f07a396751a0625157` |
| Branch | `docs/official-truth-provenance-persistence-sql-design-1` |
| Initial remote/local PR head | `d5953001bc8d94d05b7423f6f97fb9f509d7bb7f` (TASK seed) |
| Initial merge-base | `9adfc04ffe90693dedc059f07a396751a0625157` |
| Initial ahead / behind main | 1 / 0 |
| Mode | `NORMAL`, read from fetched repository |
| TASK blob | `cd38da2954601cd2de73203920a808e6a09b658f`, unchanged |
| Merged #855 | `e00f5f98775b0271749d955df5b493c8ae8589c8` |
| Merged #859 | `9adfc04ffe90693dedc059f07a396751a0625157` |
| Merged #861 | `75251131fa91020e5b5a46e484c92028ca9739ae` |
| PR state at reconstruction | OPEN / Draft / unmerged; one TASK file before delivery |

Read #751, #741, #864 and PR #866 live, including their issue comments, and live merged metadata for #855/#859/#861. Read current operating/START_HERE standards, relevant vision/architecture/roadmap/decision/quality/continuity material, merged contracts and current migration/RLS/RPC/server/test patterns. Repository database configuration is PostgreSQL 17; **actual hosted configuration was not queried**. Live #751's top section supersedes its old lower unstarted/writer pointers and supersedes historical Cursor dispatch instructions with the current Codex lane.

Pre-commit re-read: remote main and PR seed remained the exact SHAs above; PR remained Draft. #751 was updated at `2026-10-06T00:13:25Z` to list five parallel bounded slices, adding #868/#870 and #869/#871. This does not widen #864's scope or its three allowed merged contract inputs. No added slice's unpublished deliverables were consumed.

Final delivery head is the Git commit containing the final four deliverable blobs on this authorized branch, verified against the remote after push. Its full numeric SHA, final fetched main, merge-base and ahead/behind are emitted in the post-push STOP receipt; they cannot be embedded as a self-referential hash in this commit. The initial TASK seed above must not be mistaken for delivery Exact Head. Review the full PR diff from merge-base, including its preexisting immutable TASK.

## 3. Exact changed-file boundary

New author changes, exactly:

1. `docs/OFFICIAL_TRUTH_AUTONOMOUS_PROVENANCE_PERSISTENCE_SQL_RLS_DESIGN_1_2026-10-06.md`
2. `docs/OFFICIAL_TRUTH_AUTONOMOUS_PROVENANCE_PERSISTENCE_SQL_RLS_DESIGN_1_REPORT_2026-10-06.md`
3. `docs/OFFICIAL_TRUTH_AUTONOMOUS_PROVENANCE_PERSISTENCE_SQL_RLS_DESIGN_1_HANDOFF_2026-10-06.md`
4. `docs/OFFICIAL_TRUTH_AUTONOMOUS_PROVENANCE_PERSISTENCE_SQL_RLS_DESIGN_1_SELF_REVIEW_2026-10-06.md`

The complete PR diff against main additionally contains the preexisting seed:

5. `docs/OFFICIAL_TRUTH_AUTONOMOUS_PROVENANCE_PERSISTENCE_SQL_RLS_DESIGN_1_TASK_2026-10-06.md`

The TASK is not edited. No `.sql`, runtime, tests, package/lock/config, generated types or global continuity file changes. No producer or retention-slice deliverable is read as an input or changed. Scratch verification/evidence remains outside the repository checkout.

## 4. Validation and honest limits

| Check | Result / scope |
| --- | --- |
| Fresh git fetch + branch/ancestry/TASK blob | PASS at reconstruction; repeated before STOP, exact numeric delivery receipt emitted after push |
| Operating-mode guard | PASS |
| `node --test scripts/operating-mode-guard.test.mjs` | PASS, 16/16, 0 skipped, 0 failed |
| Guard toolchain | Bundled Node `v24.19.0`; guards are standalone JS. Repository app engine is `22.x`; this is **not** an application-runtime compatibility claim |
| Four-file author allowlist / five-file whole-PR diff, no SQL/runtime/global edits | Mechanically checked before commit; exact scope included in STOP receipt |
| TASK object hash and upstream contract/operating-mode blob equality | Mechanically checked before commit; no semantic baseline files changed |
| UTF-8, local Markdown links, unique A01–A46 coverage, TASK requirement mapping, whitespace | Mechanically checked on the final document set before commit; see self-review |
| Security/concurrency/byte-contract self-review | Manual author review against #855/#859/#861 and official PostgreSQL/Supabase docs; not independent TL review |
| Full app tests / typecheck / lint / Production build | NOT RUN locally: docs-only scope; full tests include SQL execution, explicitly prohibited here. No application result claimed |
| PostgreSQL/RLS/DB/auth/advisor/integration/race execution | NOT RUN; no local or hosted SQL, Supabase query, migration, DB server or advisor call |
| GitHub CI / Preview on delivery Exact Head | Not asserted by this committed report; inspect live after push. TASK-seed CI/Preview is historical and cannot validate the new head |
| Production / DB row state | Not independently read or changed; #751 continuity is not this session's verification |

Mechanical checks cannot prove future PostgreSQL behavior, correctness of unimplemented codecs, actual role topology, driver bounds, DB logging configuration or producer origin. These remain mandatory future implementation/Development verification obligations. The TASK's no-SQL rule controls over generic repository/skill instructions to run DB tests or generate migrations.

## 5. P0/P1/P2/P3 and reserved gates

| Severity | Author finding at delivery |
| --- | --- |
| P0 | None identified in this docs-only diff. No Production or runtime mutation. |
| P1 | None identified as an unresolved design contradiction. Independent exact-head TL review remains mandatory and may find issues. |
| P2 | Future implementation blockers remain explicit: concrete static codecs including issuer contracts; actual private credential/role provisioning; lifecycle/retention decisions; byte/constraint/race/RLS/advisor proofs; qualified producer integration and TL interface reconciliation. No such readiness is claimed. |
| P3 | Global writer serialization intentionally limits throughput; measure later before proposing finer locks. Guard Node differs from app engine. Both are disclosed, with no runtime performance/compatibility claim. |

No final retention period, lifecycle, deletion, tombstone, restore, backup period or incident-data policy is chosen. The append-only rule applies while retained. Total privileged disappearance cannot be diagnosed as past existence without a separately approved lifecycle record; known/ambiguous retries refuse absent history. Database owners/full-root compromise remain outside ordinary-role immutability and hash-origin guarantees.

No new operating cost, paid service, provider/model call, UI flow or travel-graph behavior is introduced. Historical trust integrity is a future internal foundation only. Auth/AAL/capabilities, source/profile/extractor/policy activation, Evidence/Rule acceptance, F8, Development/Production apply and launch remain unchanged/gated.

## 6. Exact Codex authorship evidence

Logical slice: **Official Truth autonomous provenance persistence SQL/RLS design 1**. Execution: **Codex Desktop**.

- Session: `01a10e82-70d2-7072-ae46-95e075b9ed72`.
- Model: `gpt-6-astra`; reasoning effort: `xhigh`; provider: `openai`.
- Local runtime evidence: session JSONL `session_meta` reports that id, originator `Codex Desktop`, CLI `0.160.0`, source `vscode`, timestamp `2026-10-05T23:59:52.019Z`; its `turn_context` reports exact model/effort above.
- Evidence filename: `rollout-2026-10-06T01-59-52-01a10e82-70d2-7072-ae46-95e075b9ed72.jsonl` under the local Codex session directory; only those targeted metadata fields were inspected. No raw session contents, credentials or unrelated chat data are committed.
- No subagent/second writer was launched; no Cursor session/model or independent reviewer is claimed.

These are documentation authorship facts, **not runtime receipt/artifact fields**.

## 7. STOP

Commit/push only the authorized branch. PR remains Draft; author classification does not set Ready. No merge, review-approval claim, issue closure or follow-up slice.

**STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD EXACT-HEAD REVIEW.**
