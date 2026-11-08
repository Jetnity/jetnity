# Official Truth Accepted Store Trip Integration 1 — TL amendment R7

Date: 2026-11-08. Work #1155 / Draft #1156.
Decision owner: ChatGPT / Technical Lead.
Same author: **Jetnity Official Truth Accepted Store Trip Integration 1 — Codex Generation 1**.
Same session: `/root/accepted_store_trip_integration_writer`.
Current remote head `f8017c63ddf5c2f5f93bc53cc3b406a35d7acc5d`; immutable main `e1fe0c696ade9f39b417772b5c065f87530204d6`.

TASK V1 and R1–R6 remain frozen. This is a same-session correction of two independently confirmed successor-publication defects in the new UNAPPLIED candidate. It changes no legacy migration, role, ACL or Product-Owner gate. No execution PASS is asserted.

## Independent findings

The release reviewer found both defects while tracing the complete original migration and bridge call chain. Root and the author independently read the original declarations and the new candidate successor branch.

1. The pinned original content-identity migration `20261004010705_official_truth_content_identity_2.sql`, blob `2ce0dd5fcc2438fef0cb99e5487f1a0e1b90528e`, adds eight NOT NULL/no-default identity fields to `private.official_rule_claim_support`. The new successor branch currently inserts only the seven legacy fields. There is no filling BEFORE trigger. Its replacement support row cannot satisfy the actual schema.
2. The same successor branch updates the canonical claim/fact and deletes/reinserts support inside the postgres-owned bridge, then leaves its deferred invoker checks to the outer executor-owned Finalize. On PostgreSQL 16, these triggers run as the principal active when fired. The new executor intentionally has no old private-schema/table privileges. The first-insert old writer already flushes its exact legacy constraints internally, which does not fix the separate successor branch.

Primary PostgreSQL reference for the changed queued-role behavior in version 18: https://www.postgresql.org/docs/18/release-18.html, Migration to Version 18. The actual required target remains the observed PostgreSQL 16 native environment; no upgrade or runtime result is implied by this source analysis.

## Narrow required correction

Only in the already approved new `official_accepted_trip_private.publish_legacy_v1(uuid)` bridge:

- Replace the incomplete successor support INSERT with INSERT…SELECT of all 15 actual columns from the retained `private.official_evidence_versions` row joined to `private.official_sources`. Use actual retained identity/content/lifecycle/validation/source-class values. Constrain exact staged evidence version, scope, source and identity; require exactly one inserted row. No fabricated default, null, broad match, weakened foreign key or extra support.
- Preserve the current approved claim accepted_at and requirement-effect/visa-mode update and all immutable prior accepted-version payloads.
- After the full successor claim/fact/support replacement, while still executing the existing postgres-owned bridge, flush exactly these four existing constraints IMMEDIATE:
  1. `private.official_rule_claims_fact_payload`
  2. `private.official_rule_claim_requirement_effect_fact_payload`
  3. `private.official_rule_claims_support_count_v2`
  4. `private.official_rule_support_count_v2`
- Preserve outer Finalize SET CONSTRAINTS ALL IMMEDIATE and the final fresh Owner/session/expiry/currentness guard after it. No deferred integrity work may be moved after that guard.
- Preserve all existing function owners, empty search paths, RLS and client/RPC grants. No executor access to legacy private tables, trigger SECURITY DEFINER rewrite, disabled constraint, new privilege bridge or old-source edit.

The existing actual native successor publication must execute this branch, assert that its retained support identity equals the actual Evidence/source row, and still prove atomic COMMIT, prior-version retention, witness advancement and current reader result. Negative/rollback and final authority-after-wait obligations remain. An earlier unrelated failure cannot satisfy those tests.

## Publication and gates

R6's first frozen two-file snapshot remains unchanged and is retained as history. The author supplies a new immutable corrected manifest based on the same current remote parent. Root independently reviews and publishes the coherent corrected snapshot with these decisions; no intermediate broken snapshot is treated as accepted.

Full exact-head Core/native/SSR/Workspace/Auth/hygiene/build/Preview/base/thread gates remain mandatory. All #917/#1131/#985 and hosted/source/Owner/key/retention/privacy/ownerMac/activation/launch holds remain unchanged. No Ready, merge, hosted operation, refused-action retry, automatic following slice or new Owner approval is implied.
