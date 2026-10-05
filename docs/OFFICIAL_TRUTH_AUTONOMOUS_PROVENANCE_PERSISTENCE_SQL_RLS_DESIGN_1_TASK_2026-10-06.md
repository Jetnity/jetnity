# Official Truth autonomous provenance persistence SQL/RLS design 1 — Task

Date: 6 October 2026
Issue: #864
Repository: Jetnity/jetnity
Baseline: `main@9adfc04ffe90693dedc059f07a396751a0625157`
Branch: `docs/official-truth-provenance-persistence-sql-design-1`
Execution lane: Codex Desktop
Parallel-safe with #862/#863 and #865 when this scope is respected.

## Objective

Produce one docs-only implementation/SQL design that translates merged #859 into an exact future PostgreSQL/Supabase persistence contract for immutable Official Truth provenance receipts, typed immutable artifacts, receipt/artifact dependency links, and a bounded historical integrity reader.

This slice designs storage. It does not implement or apply it.

## Binding inputs

Read live state first: START_HERE, operating standard, mode, #751, #741, #864, and actual current main.
Then read merged #855, #859 and #861 architectures and relevant current Supabase migration patterns/RLS/RPC conventions.

## Parallel boundary

Do not depend on unpublished #863 output. Treat the producer as an abstract private server caller that supplies an already-qualified receipt + immutable closure + custody dependency binding conforming to merged #855/#859/#861.
Do not invent producer selection/custody logic owned by #863.

## Required design

Define:
1. private schema/table layout and exact semantic keys;
2. canonical receipt bytes storage (authoritative byte-preserving representation; JSONB may only be secondary/untrusted projection);
3. typed immutable artifact storage and complete Pin identity;
4. receipt-root and artifact dependency-link tables/invariants;
5. separate custody dependency binding representation compatible with #861 without changing #855 receipt bytes;
6. exact uniqueness, conflict, idempotency and concurrent-insert semantics;
7. transaction ordering and complete-closure atomic visibility;
8. immutability enforcement: ordinary UPDATE/DELETE/TRUNCATE/conflict-update unavailable;
9. private grants/RLS/FORCE-RLS posture and explicit anon/authenticated/browser denial;
10. RPC/function boundary options, privilege ownership, search_path and EXECUTE revocation/grants;
11. historical read-only exact-fingerprint loader/validator boundary, operational-read-failure vs integrity verdict separation;
12. schema/codec/version handling and fail-closed unknown-version behavior;
13. bounds from #859 (receipt bytes, closure size/count/depth, dependency counts) and where each bound is enforced;
14. race/concurrency cases, identical retries, conflicting bytes under same key, missing/corrupt existing closure;
15. migration/apply/rollback plan structure for a later slice, with no actual migration created;
16. Development verification checklist and security-advisor/RLS checks for a later apply;
17. interface contract exposed to the future producer and future F8 layer, explicitly stating that persistence grants no acceptance authority.

Use symbolic lifecycle policy placeholders only. Do not choose a retention duration or deletion policy; #865 owns the decision packet.

## Required adversarial matrix

Cover at least:
- same fingerprint/different bytes;
- same id+version/different artifact bytes;
- same digest/different bytes;
- missing root/dependency;
- cyclic graph;
- oversized/deep closure;
- concurrent identical insert;
- concurrent conflicting insert;
- partial transaction failure;
- retry after corruption/disappearance;
- projection/JSONB disagreement;
- unknown codec/schema version;
- browser/authenticated caller attempting write/read;
- service/RPC privilege misuse;
- current/latest catalog substitution attempt;
- receipt exists but custody binding missing;
- valid persisted receipt presented as Rule/F8 authority.

## Non-scope

No runtime code. No .sql migration file. No SQL execution. No Supabase mutation/apply. No retention decision. No Evidence acceptance. No Rule acceptance/F8. No source/profile/extractor/policy activation. No Auth/AAL/capability changes. No Production. No provider/model call. No global continuity edits. No follow-up slice.

## Allowed files

TASK is immutable:
- `docs/OFFICIAL_TRUTH_AUTONOMOUS_PROVENANCE_PERSISTENCE_SQL_RLS_DESIGN_1_TASK_2026-10-06.md`

Create only:
- `docs/OFFICIAL_TRUTH_AUTONOMOUS_PROVENANCE_PERSISTENCE_SQL_RLS_DESIGN_1_2026-10-06.md`
- `docs/OFFICIAL_TRUTH_AUTONOMOUS_PROVENANCE_PERSISTENCE_SQL_RLS_DESIGN_1_REPORT_2026-10-06.md`
- `docs/OFFICIAL_TRUTH_AUTONOMOUS_PROVENANCE_PERSISTENCE_SQL_RLS_DESIGN_1_HANDOFF_2026-10-06.md`
- `docs/OFFICIAL_TRUTH_AUTONOMOUS_PROVENANCE_PERSISTENCE_SQL_RLS_DESIGN_1_SELF_REVIEW_2026-10-06.md`

## Delivery

Re-read remote main before STOP. Report exact head, merge-base/ahead/behind, changed files, immutable TASK blob, checks, risks, and exact Codex session/model evidence.

Classification:
- `AUTONOMOUS_PROVENANCE_PERSISTENCE_SQL_RLS_DESIGN_READY`
or
- `AUTONOMOUS_PROVENANCE_PERSISTENCE_SQL_RLS_DESIGN_NOT_READY`

Commit and push authorized branch. Stay Draft. Do not Ready. Do not merge. Do not start follow-up.

STOP for independent Technical-Lead exact-head review.
