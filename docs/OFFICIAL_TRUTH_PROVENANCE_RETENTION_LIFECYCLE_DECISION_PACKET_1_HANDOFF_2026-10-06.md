# Official Truth provenance retention and lifecycle decision packet 1 — Handoff

Date: 6 October 2026 · Issue [#865](https://github.com/Jetnity/jetnity/issues/865) · Draft PR [#867](https://github.com/Jetnity/jetnity/pull/867)
Logical writer: **Jetnity Official Truth provenance retention and lifecycle decision packet 1**
Branch: `docs/official-truth-provenance-retention-decision-packet-1`
Session: `01a10e82-eb43-7e02-b329-875b3c8472be` · local `turn_context`: **`gpt-6-astra` / `xhigh`**

## Delivered and deliberately undecided

**PROVENANCE_RETENTION_LIFECYCLE_DECISION_PACKET_READY** is the author's packet classification. It does not select a lifecycle option, authorize storage, mark GitHub Ready or replace independent review.

Read the [packet](OFFICIAL_TRUTH_PROVENANCE_RETENTION_LIFECYCLE_DECISION_PACKET_1_2026-10-06.md), [report](OFFICIAL_TRUTH_PROVENANCE_RETENTION_LIFECYCLE_DECISION_PACKET_1_REPORT_2026-10-06.md) and [self-review](OFFICIAL_TRUTH_PROVENANCE_RETENTION_LIFECYCLE_DECISION_PACKET_1_SELF_REVIEW_2026-10-06.md). The packet covers six data classes and all ten TASK questions, three distinct policy alternatives, historical proof limits, backups/restore, failure/stop behavior and an unsigned PO + Security + Privacy decision form. Recommendation B is explicitly conditional and unapproved.

No retention duration, legal conclusion, tombstone/log contract, Rule-lifecycle implementation, producer internal or SQL/RLS mechanism is decided. Existing merged contracts are inputs; unpublished #863/#866 work is not.

## Exact review entry

- Verified baseline/merge-base: `9adfc04ffe90693dedc059f07a396751a0625157`, re-fetched before publication preparation; mode `NORMAL`.
- Verified initial head/TASK seed: `099a598434735127a3290eafdab211bd4137e522`, initially 1 ahead / 0 behind main.
- Binding TASK: `docs/OFFICIAL_TRUTH_PROVENANCE_RETENTION_LIFECYCLE_DECISION_PACKET_1_TASK_2026-10-06.md`; immutable blob `88b5a3c8123f2014db2ecdea891c7274dde02554`.
- Final delivery head: resolve the live PR head and compare it to the final STOP response. A file cannot contain the hash of its own final commit; no old seed is presented as the delivered head. A single docs commit gives 2 ahead / 0 behind if main remains unchanged.
- Full PR path allowlist is the TASK plus exactly the four files named in the report. Relative to the seed, only those four deliverables may be added.
- Parallel branches: #863 producer/custody and #866 storage SQL/RLS design; prepublication changed-path inventories were TASK-only and disjoint. Recheck paths after either branch changes; do not infer contracts from their drafts.

## First uncompleted action: independent exact-head review

The Technical Lead should freshly read remote main, operating mode, #751, #741, #865/#867 and relevant new MATERIAL identified by #751, then inspect the complete five-file diff and TASK blob on the exact pushed head. Confirm Draft/unmerged state, merge-base/ahead/behind, no path collision, no unresolved review thread and final-head CI/Preview observations. Do not reuse seed or prior-architecture gates for this delivery.

Review the following substantive boundaries independently:

1. No wording treats the recommendation, receipt immutability, #859 storage Option 1 or packet READY as lifecycle approval.
2. Active and retained historical Rule references protect the correct complete closure; shared artifacts cannot be deleted by per-receipt cascade or a failed/stale zero count.
3. Missing #861 bindings are not hidden by successful receipt-only integrity; no payload widening or caller-provided reconstruction.
4. Live absence does not prove physical disposal, backup expiry or the cause of missing history; restoring old data cannot reset clocks or resurrect forbidden content.
5. Option C requires a separately approved end-of-reliance before expiry and exposes the conflict when that cannot happen; no F8/Rule mutation is designed.
6. Minimal operational evidence, identity reservation and restore reconciliation are explicit decision needs, not silently created data stores.
7. No invented law or hosted backup/region configuration; independent competent advice and copy inventory remain required.

Local mechanical hygiene and prepublication allowlist/link/structure/coverage checks passed; exact counts and limits are in the report. Final committed whitespace and remote CI results are to be read from STOP evidence. No local runtime test/build or database operation is claimed. P0: none identified; P1: no open packet defect identified, but actual lifecycle/persistence activation remains gated; P2: the deliberate PO/Privacy/copy/reference trade-offs in the packet; P3: none identified. Self-review is not independent PASS.

## Authority after review

If revisions are required, bind them to the actual head and continue this same writer/session where available. A new head invalidates earlier checks. The later policy decision belongs to Product Owner + Security + Privacy, with competent Legal input. It must include class purposes/periods/clocks, reference treatment, metadata, cleanup/stop parameters, residual copies, recovery/disposal evidence, incident exceptions and visibility, with recorded approvals.

The lifecycle decision is a prerequisite, not permission for producer/runtime/SQL/migration, Supabase apply, Evidence/Rule acceptance, F8, provider/model calls, public provenance UI or Production. Neither this handoff nor a future TL docs PASS starts another slice. No global continuity file was changed.

**Keep PR #867 Draft. Do not Ready. Do not merge.**

**STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD EXACT-HEAD REVIEW.**
