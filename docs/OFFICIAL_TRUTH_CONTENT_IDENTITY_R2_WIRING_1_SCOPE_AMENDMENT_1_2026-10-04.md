# Official Truth Content Identity R2 Wiring 1 — Scope Amendment 1

Date: 4 October 2026
Issue: #814
Draft PR: #815
Baseline main: `30aa083dc752bf499dfc5a09448d06bd36d3ba64`
Original immutable task: `docs/OFFICIAL_TRUTH_CONTENT_IDENTITY_R2_WIRING_1_TASK_2026-10-04.md`
Original task-seed / dispatch head: `7185c60dd78604a5105b207a855fc74620195fc0`
Blocked documentation head: `b3505bbf6fb389951f5f27c9b9b77fd4b93274fe`
Logical writer: **same Jetnity Official Truth coordinated content identity wiring R2**
Generation: **1**
Execution environment: **same Codex Desktop session**
Required model: **GPT-6 Astra — Sehr hoch**

## Reason for amendment

The original R2 task correctly required the runtime source-catalog and store gateways to move from literal RPC calls:

- `official_truth_source_catalog_v1`
- `official_truth_store_accepted_v1`

to:

- `official_truth_source_catalog_v2`
- `official_truth_store_accepted_v2`

It also correctly required the repository schema-reference/hygiene gate to remain green.

Codex reproduced that the current repository guard permits only the v1 literals through:

- `scripts/db/verwendung.mjs` → `LOCAL_UNAPPLIED_RPCS`;
- `lib/admin/account-counts-delivery/schema-reference.test.ts` → exact allowlist assertion.

A simulated v1→v2 gateway change yields exactly two unknown-RPC findings. Hiding the v2 literals from the scanner is forbidden.

This is a narrow schema-hygiene ownership dependency discovered by the writer. It is not a runtime-importer expansion.

## Binding scope amendment

The Technical Lead authorizes exactly these two additional existing files in PR #815:

1. `scripts/db/verwendung.mjs`
2. `lib/admin/account-counts-delivery/schema-reference.test.ts`

No other file outside the original finite R2 ownership/test closure is authorized by this amendment.

## Required change in `scripts/db/verwendung.mjs`

Perform the smallest exact reconciliation needed for R2:

- replace the reviewed Official Truth v1 runtime gateway allowlist entries with:
  - `official_truth_store_accepted_v2`
  - `official_truth_source_catalog_v2`
- keep their exact source paths:
  - `lib/readiness/official-truth-store-server.ts`
  - `lib/readiness/official-truth-source-catalog-server.ts`
- point both to the already merged S1 migration:
  `supabase/migrations/20261004010705_official_truth_content_identity_2.sql`

Do not add a generic unknown-RPC exemption.
Do not hide literal RPC calls.
Do not widen scanning semantics.
Do not add runtime-generated schema assumptions.
Do not remove or alter the separate `darf_official_truth_freigeben` entry.
Do not make any decision about the unapplied `20261002154952` migration here.

The existing constant name `LOCAL_UNAPPLIED_RPCS` may remain unchanged in this slice; do not rename/refactor the scanner merely for wording. Its current comment already states that it is not a live generated-schema claim.

## Required exact-list test reconciliation

Update only the exact expected Official Truth entries in:

`lib/admin/account-counts-delivery/schema-reference.test.ts`

so the test reflects the two v2 RPC names and the S1 migration path above.

Do not broaden the test.
Do not add wildcard matching.
Do not weaken exact source-path or SQL-path assertions.

## Original task remains binding

All original R2 requirements and hard boundaries remain binding except for the two newly authorized files above.

In particular:

- no Supabase migration edit/create;
- no live Development or Production mutation;
- no generated `types/supabase.ts` edit;
- no package/config change;
- no route/app/component/provider/traveller change;
- no real source/content/profile/GOV.UK/CTA registration;
- no real extractor/policy;
- no region pin;
- no schema-1 persistence;
- no F8;
- production identity-profile/extractor/composition registries remain empty;
- region-pin registry remains empty.

## Inbox / governance note

New MATERIAL `COS-20261004-1140-004` was processed by the Technical Lead. Receipt: #748 comment `5978881653`.

The Development S1 apply authorization is now recorded on GitHub with the Product Owner's exact direct-chat wording. This does not change R2 scope and grants no Production or registration authority.

## Resume protocol

Same Codex session / same logical writer / same Generation 1 must:

1. fetch the branch and confirm this amendment commit exists;
2. re-read original immutable task plus this amendment;
3. re-read live main/mode/#751/#748;
4. confirm no overlapping writer;
5. resume R2 from the beginning of the semantic implementation audit;
6. perform the two allowed hygiene changes only when the v2 gateway literals are actually introduced;
7. finish the complete R2 implementation/test matrix;
8. keep Draft;
9. never Ready/merge;
10. report exact final head and STOP for independent Technical-Lead review.

If another outside-closure production/test/schema-hygiene file becomes required, STOP again. This amendment does not grant recursive scope expansion.
