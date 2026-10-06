# Official Truth provenance retention and lifecycle decision packet 1 — Task

Date: 6 October 2026
Issue: #865
Repository: Jetnity/jetnity
Baseline: `main@9adfc04ffe90693dedc059f07a396751a0625157`
Branch: `docs/official-truth-provenance-retention-decision-packet-1`
Execution lane: Codex Desktop
Parallel-safe with #862/#863 and #864 when this scope is respected.

## Objective

Prepare the bounded Product-Owner + Security + Privacy decision packet required by merged #859 before real provenance persistence can be implemented/operated.

This slice does not make the retention/lifecycle decision. It makes the decision precise enough for the Product Owner to choose later without hidden technical consequences.

## Binding inputs

Read live state first: START_HERE, operating standard, mode, #751, #741, #865 and actual current main.
Read merged #855, #859 and #861, especially privacy/data-classification, historical-integrity and reserved lifecycle sections.
Inspect current Jetnity retention/security/privacy standards and relevant existing database-retention patterns only as evidence; do not copy unrelated retention values as defaults.

## Required packet

Define separately for:
- canonical receipt bytes;
- immutable typed artifacts/code/catalog/schema snapshots;
- receipt/artifact dependency links;
- #861 custody dependency bindings;
- optional operational insertion metadata if retained at all;
- any future Rule-to-receipt relationship (relationship only; do not design F8).

For each data class document:
1. purpose and whether it is semantic truth, historical integrity evidence, or operational metadata;
2. privacy classification and forbidden personal/model/secret preimages;
3. integrity consequence if deleted while a receipt/Rule reference remains;
4. whether reference-counted sharing makes per-receipt deletion unsafe;
5. backup/WAL/PITR/log distinctions — live deletion is not instant backup erasure;
6. legal/compliance unknowns that require competent advice rather than invented conclusions;
7. security risk of indefinite retention;
8. product/audit risk of early deletion;
9. restore/recovery behavior and post-restore expiry/revalidation requirements;
10. operational failure handling, overdue cleanup visibility and kill/stop behavior.

## Options

Prepare a small number of clearly distinct lifecycle policy options. Each option must state:
- trigger for deletion/eligibility;
- how active Rule/receipt references are protected;
- artifact sharing/reference-count semantics;
- minimum integrity guarantees while retained;
- what historical verification becomes impossible after deletion;
- operational complexity and failure modes;
- privacy/security advantages and disadvantages;
- migration/rollback implications;
- whether it blocks later persistence implementation until chosen.

Do not silently select an option as approved. You may provide a Technical-Lead recommendation with assumptions clearly labeled, but final approval remains Product Owner + Security + Privacy.

## Required decision questions

End with a minimal explicit Product-Owner decision form covering at least:
- retention basis/trigger;
- whether active Rule-referenced provenance may ever expire;
- whether shared immutable artifacts may outlive receipts that reference them;
- handling of operational insertion metadata;
- cleanup cadence/health fail-closed expectations;
- backup/PITR acknowledgement;
- public/admin historical provenance visibility separately from storage retention.

## Parallel boundary

Do not depend on unpublished #863 or #864 output. Use only merged contracts. Do not define table names/schema/RPC mechanics owned by #864 and do not define producer internals owned by #863.

## Non-scope

No final retention approval. No runtime code. No SQL/migration. No Supabase mutation/apply. No personal data collection. No Evidence/Rule/F8. No Production. No public provenance UI. No provider/model calls. No legal conclusion presented as fact. No global continuity edits. No follow-up slice.

## Allowed files

TASK is immutable:
- `docs/OFFICIAL_TRUTH_PROVENANCE_RETENTION_LIFECYCLE_DECISION_PACKET_1_TASK_2026-10-06.md`

Create only:
- `docs/OFFICIAL_TRUTH_PROVENANCE_RETENTION_LIFECYCLE_DECISION_PACKET_1_2026-10-06.md`
- `docs/OFFICIAL_TRUTH_PROVENANCE_RETENTION_LIFECYCLE_DECISION_PACKET_1_REPORT_2026-10-06.md`
- `docs/OFFICIAL_TRUTH_PROVENANCE_RETENTION_LIFECYCLE_DECISION_PACKET_1_HANDOFF_2026-10-06.md`
- `docs/OFFICIAL_TRUTH_PROVENANCE_RETENTION_LIFECYCLE_DECISION_PACKET_1_SELF_REVIEW_2026-10-06.md`

## Delivery

Re-read remote main before STOP. Report exact head, merge-base/ahead/behind, changed files, immutable TASK blob, checks, risks, and exact Codex session/model evidence.

Classification:
- `PROVENANCE_RETENTION_LIFECYCLE_DECISION_PACKET_READY`
or
- `PROVENANCE_RETENTION_LIFECYCLE_DECISION_PACKET_NOT_READY`

Commit and push authorized branch. Stay Draft. Do not Ready. Do not merge. Do not start follow-up.

STOP for independent Technical-Lead exact-head review.
