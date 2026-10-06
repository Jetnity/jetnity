# Official Truth provenance retention and lifecycle decision packet 1 — Report

Date: 6 October 2026
Logical writer: **Jetnity Official Truth provenance retention and lifecycle decision packet 1**
Issue [#865](https://github.com/Jetnity/jetnity/issues/865) · Draft PR [#867](https://github.com/Jetnity/jetnity/pull/867)
Branch: `docs/official-truth-provenance-retention-decision-packet-1`
Status: **DOCS DELIVERY / AUTHOR ASSESSMENT / INDEPENDENT EXACT-HEAD REVIEW REQUIRED**

## Outcome

**PROVENANCE_RETENTION_LIFECYCLE_DECISION_PACKET_READY**

The [decision packet](OFFICIAL_TRUTH_PROVENANCE_RETENTION_LIFECYCLE_DECISION_PACKET_1_2026-10-06.md) is ready for independent Technical-Lead review and a later Product-Owner + Security + Privacy decision. No lifecycle option, duration, legal basis, deletion operation or retention exception has been approved. READY describes this decision-preparation deliverable; it is not GitHub Ready, TL PASS or permission to implement/operate provenance persistence.

The packet separately assesses all six required classes against all ten TASK dimensions. It compares three policies: retention for an explicitly declared corpus purpose; reference protection with expiry after release; and a maximum receipt age requiring prior resolution of active references. It conditionally recommends the second for consideration, with no default period, and ends with an unsigned twelve-question decision form.

Key consequences are explicit: active versus historical Rule references; shared transitive artifacts; separate #861 custody bindings; deletion versus backup/WAL/PITR/export/log residuals; restore isolation and reapplication of expiry; failed/overdue cleanup; irreversible loss of proof; and identity non-reuse after disposal. Complete retained history still does not establish present freshness, acceptance or execution authority.

## Live reconstruction

| Item | Verified evidence |
| --- | --- |
| Remote main / evidence baseline | `9adfc04ffe90693dedc059f07a396751a0625157`, re-fetched before publication preparation. Final STOP must report a fresh remote reread. |
| Machine mode | `NORMAL`, `.jetnity/operating-mode.json`; no mode/continuity changes. |
| Initial exact PR head / TASK seed | `099a598434735127a3290eafdab211bd4137e522`; open, Draft, unmerged; one TASK file. |
| Merge-base | `9adfc04ffe90693dedc059f07a396751a0625157`. Initial relation: 1 ahead / 0 behind. A single delivery commit adds one ahead if main stays unchanged. |
| Immutable TASK | `docs/OFFICIAL_TRUTH_PROVENANCE_RETENTION_LIFECYCLE_DECISION_PACKET_1_TASK_2026-10-06.md`; blob `88b5a3c8123f2014db2ecdea891c7274dde02554`, confirmed from GitHub blob and local Git object. |
| Current issue authority | #751 body/comments, #741 body/comment `5956471880`, #865 body/comments, #867 metadata/discussion read live. #751's current top section supersedes older lower snapshots. |
| Merged dependencies | #855 merge `e00f5f98775b0271749d955df5b493c8ae8589c8`; #859 merge `9adfc04ffe90693dedc059f07a396751a0625157`; #861 merge `75251131fa91020e5b5a46e484c92028ca9739ae`. Merged state and TL review/closure evidence were read from GitHub. |
| Parallel observations | #863 branch `docs/official-truth-autonomous-producer-custody-design-1`; #866 branch `docs/official-truth-provenance-persistence-sql-design-1`. At the prepublication read both still had TASK-only path diffs; zero overlap with these five PR paths. Only their changed-path inventories were used, not unpublished design internals. |
| Review threads | #867 returned zero inline review threads at the prepublication read; this is not an independent content review. |

The final commit hash cannot be embedded in the file that determines that hash. This report records its verified parent and baseline rather than inventing a self-referential SHA. Resolve the delivered exact head from PR #867 and the final STOP response; that response must report remote main, local/remote head equality, merge-base, ahead/behind and check observations after commit/push. Any later head change invalidates earlier head-specific evidence.

## Exact changed-file contract

New files authored by this slice, and the complete diff from the TASK seed:

1. `docs/OFFICIAL_TRUTH_PROVENANCE_RETENTION_LIFECYCLE_DECISION_PACKET_1_2026-10-06.md`
2. `docs/OFFICIAL_TRUTH_PROVENANCE_RETENTION_LIFECYCLE_DECISION_PACKET_1_REPORT_2026-10-06.md`
3. `docs/OFFICIAL_TRUTH_PROVENANCE_RETENTION_LIFECYCLE_DECISION_PACKET_1_HANDOFF_2026-10-06.md`
4. `docs/OFFICIAL_TRUTH_PROVENANCE_RETENTION_LIFECYCLE_DECISION_PACKET_1_SELF_REVIEW_2026-10-06.md`

The complete PR diff from main additionally includes the pre-existing TASK path above, unchanged. Thus **four new deliverables, five PR changed files**; no other repository file is authorized to change.

## Validation and its limits

Mechanical commands run successfully during preparation:

| Check | Observed result |
| --- | --- |
| `node scripts/operating-mode-guard.mjs` | PASS; mode NORMAL. |
| `node scripts/erreichbarkeit.mjs` | PASS; 658 entry points, 1,317 reachable modules, zero unjustified orphan modules. |
| `node scripts/exporte.mjs` | PASS; 1,059 files checked, zero unused exports. |
| `node scripts/pakete.mjs` | PASS; 11 dependencies and 2 devDependencies checked, zero unused; configuration-driven exclusions disclosed by the tool. |
| `node scripts/api-schutz.mjs` | PASS; 12 admin routes protected by `requireAdminApi()`. |
| `node scripts/db/verwendung.mjs --pruefen` | PASS against generated types: 22 tables/views and 25 functions. Existing LOCAL/UNAPPLIED RPC notices remain; no live DB validation claimed. |
| TASK blob / remote baseline / branch-path comparison | Match; seed unchanged; zero observed overlap with parallel branches. |

Prepublication mechanical validation also passed the exact four-new/five-total path allowlist, unchanged TASK identity, all 35 document links, table-column/fence/whitespace structure, all 60 class-assessment dimensions, all 12 unsigned decision questions and unchanged tracked runtime/continuity files. Final staged/committed whitespace and remote CI observations belong in the STOP evidence. The [self-review](OFFICIAL_TRUTH_PROVENANCE_RETENTION_LIFECYCLE_DECISION_PACKET_1_SELF_REVIEW_2026-10-06.md) maps content and adversarial cases to the TASK.

No runtime tests, TypeScript, lint or Production build were run locally: only Markdown changed and the TASK asks for mechanical checks. This is an explicit docs-only validation limitation, not a claim those gates passed. The existing PR CI performs its configured tests/typecheck/lint/hygiene/build and Auth check; inspect results on the final pushed SHA before a TL integration decision. No lifecycle mechanism is implemented or behaviorally tested by these documents. No migration, DB/RLS test, Supabase query/apply, provider/model call, source retrieval, UI test or Production action was performed.

External documentation was read only for general backup semantics: [Supabase backups](https://supabase.com/docs/guides/platform/backups), [PostgreSQL vacuuming](https://www.postgresql.org/docs/18/routine-vacuuming.html) and [PITR](https://www.postgresql.org/docs/18/continuous-archiving.html). The Supabase skill's Markdown changelog URL was unsupported by the web reader; its HTML [changelog](https://supabase.com/changelog) was used instead. No platform change was implemented; no account configuration or backup horizon was inferred from those pages. No legal conclusion was researched or asserted.

## Security, scope, cost and findings

| Severity | Author assessment and remaining boundary |
| --- | --- |
| P0 | No identified P0 defect in this docs delivery. No runtime or production exposure introduced. |
| P1 | No identified unaddressed P1 packet defect. **Future activation remains blocked** by the unsigned lifecycle decision and unresolved implementation/Rule/copy-recovery obligations. Attempting persistence or expiry without resolving those gates would be a material integrity/privacy risk; packet READY does not close them. |
| P2 | Decision risks remain explicit: active references can prolong B indefinitely; C can force unavailable Rule reliance; shared artifacts can outlive receipts; exact hosted residual-copy windows and competent legal/privacy assessments are unknown. They must be answered before dependent implementation, not silently assumed. |
| P3 | No additional P3 finding. Minor future documentation refinements remain subject to exact-head review, not an automatic follow-up. |

No producer internals, table names, RPC signatures, SQL/schema mechanics or migration were introduced. The only graph/health requirements are policy outcomes and dependencies needed for a reviewable decision. #855 receipt bytes, #859 integrity vocabulary and #861 separate bindings remain unchanged. No global continuity files, public provenance UI, Evidence/Rule acceptance, F8, provider activation or Production change. No new service, contract or ongoing cost is selected; the alternatives disclose storage/operational trade-offs without invented estimates.

## Codex session and model evidence

Read only the allowlisted metadata fields from the current local rollout, without copying conversation content or credentials:

- Session ID: `01a10e82-eb43-7e02-b329-875b3c8472be`.
- `session_meta.timestamp`: `2026-10-06T00:00:23.363Z` (02:00:23 Europe/Zurich).
- `session_meta.originator`: `Codex Desktop`; `source`: `vscode`; `cli_version`: `0.160.0`; `model_provider`: `openai`.
- Current `turn_context.model`: **`gpt-6-astra`**; `turn_context.effort`: **`xhigh`**.
- Evidence file: `rollout-2026-10-06T02-00-23-01a10e82-eb43-7e02-b329-875b3c8472be.jsonl`, under the local Codex session directory. It is not committed or exported as a deliverable.
- One writer in this session; no subagents, Cursor dispatch or independent reviewer impersonation.

These are available local session fields, not a claim about hidden backend routing. They belong to delivery authorship, never to receipt data.

**PR remains Draft. Do not Ready. Do not merge. Do not start a follow-up.**

**STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD EXACT-HEAD REVIEW.**
