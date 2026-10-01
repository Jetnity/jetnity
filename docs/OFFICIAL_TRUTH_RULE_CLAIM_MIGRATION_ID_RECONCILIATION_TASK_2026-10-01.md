# Official Truth Rule Claim Migration Identity Reconciliation — Binding Task v1.0

Date: 1 October 2026
Issue: #680
Branch: `chore/official-truth-rule-claim-migration-id-reconcile`
Baseline: `main@0fa5f7f0255ade1d7a9e9307cd275019ac9e8506`

Cursor-Agent: **Jetnity Official Truth Rule Claim migration identity reconciliation**
Generation: **1**
Required model: **Grok 4.7 High Fast** — not Auto.

## 1. Why this slice exists

PR #679 is merged and independently verified.

Canonical repository migration currently:
`supabase/migrations/20261001140356_official_truth_accepted_rule_claim_persistence_schema_1.sql`

That exact reviewed SQL was applied **once** to Supabase Development.

The Supabase apply operation recorded migration history as:
`20261001151048_official_truth_accepted_rule_claim_persistence_schema_1`

The Development schema is correct. This slice exists only to reconcile the repository migration identity with the already-applied Development history.

## 2. Binding facts

Current main:
`0fa5f7f0255ade1d7a9e9307cd275019ac9e8506`

#679 post-merge:
- CI `36881773928`: SUCCESS
- Auth `110435053119`: SUCCESS
- Typecheck/Lint/Tests/Build `110435052744`: SUCCESS
- Vercel Production `dpl_3wZ9YLWruNE5iYvdWP1LcaMLuQaV`: READY

Development:
- branch `develop`
- ref `yfvbxvijcorffwxbxahl`
- remote history contains `20261001151048_official_truth_accepted_rule_claim_persistence_schema_1`
- original Evidence migration `20261001121258` remains
- all Official Truth source/domain/evidence/claim/fact/support tables are still zero rows
- Rule Claim tables are private, forced RLS, zero policies, browser/service roles revoked
- the migration must NOT be applied again.

Production:
- project `qscbgcdmivbbnzrcyegn`
- no Official-Evidence / Rule-Claim private tables
- no Official-Truth migration
- must remain unchanged.

## 3. Required change

Perform a pure git move:

FROM:
`supabase/migrations/20261001140356_official_truth_accepted_rule_claim_persistence_schema_1.sql`

TO:
`supabase/migrations/20261001151048_official_truth_accepted_rule_claim_persistence_schema_1.sql`

The SQL file contents must remain **byte-identical**.

Before and after the move:
- compute SHA-256 of the SQL bytes;
- record the hash in the report/self-review;
- hashes must be identical.

There must be exactly one migration with suffix:
`_official_truth_accepted_rule_claim_persistence_schema_1.sql`

After the move:
- old path must not exist;
- new path must exist;
- no SQL statement, whitespace, comment or newline may change.

## 4. Continuity references

Search the entire repository for:
- `20261001140356`
- the old full migration filename/path.

Update only legitimate continuity/documentation references so they distinguish:

- **original local CLI-created filename/version:** `20261001140356`
- **canonical reconciled repository + Development migration-history version:** `20261001151048`
- migration was applied exactly once;
- no migration-history repair or second apply occurred.

Do not rewrite historical facts inaccurately. If a document is specifically describing what Cursor originally created before Development apply, it may retain the original version as historical context but must also clearly state the canonical reconciled identity.

At minimum inspect:
- `docs/OFFICIAL_TRUTH_RULE_CLAIM_PERSISTENCE_SCHEMA_1_TASK_2026-10-01.md`
- `docs/OFFICIAL_TRUTH_RULE_CLAIM_PERSISTENCE_SCHEMA_1_REPORT_2026-10-01.md`
- `docs/OFFICIAL_TRUTH_RULE_CLAIM_PERSISTENCE_SCHEMA_1_HANDOFF_2026-10-01.md`
- `docs/OFFICIAL_TRUTH_RULE_CLAIM_PERSISTENCE_SCHEMA_1_SELF_REVIEW_2026-10-01.md`
- `ARCHITECTURE.md`
- `DECISIONS.md`
- `docs/OFFICIAL_TRUTH_SOURCE_EVIDENCE_ARCHITECTURE_2026-10-01.md`

Only change files that actually require reconciliation.

## 5. Create bounded reconciliation records

Create:
- `docs/OFFICIAL_TRUTH_RULE_CLAIM_MIGRATION_ID_RECONCILIATION_REPORT_2026-10-01.md`
- `docs/OFFICIAL_TRUTH_RULE_CLAIM_MIGRATION_ID_RECONCILIATION_HANDOFF_2026-10-01.md`

They must record:
- issue #680
- baseline/main
- old repository version
- Development-recorded version
- canonical new repository version
- SQL SHA-256 before/after, identical
- no remote Supabase mutation
- no second apply
- Production untouched
- no data import
- exact head/gates to be read after push.

## 6. Exact allowlist

Allowed paths only:

- delete/rename:
  `supabase/migrations/20261001140356_official_truth_accepted_rule_claim_persistence_schema_1.sql`
- add/rename target:
  `supabase/migrations/20261001151048_official_truth_accepted_rule_claim_persistence_schema_1.sql`
- `docs/OFFICIAL_TRUTH_RULE_CLAIM_MIGRATION_ID_RECONCILIATION_TASK_2026-10-01.md`
- `docs/OFFICIAL_TRUTH_RULE_CLAIM_MIGRATION_ID_RECONCILIATION_REPORT_2026-10-01.md`
- `docs/OFFICIAL_TRUTH_RULE_CLAIM_MIGRATION_ID_RECONCILIATION_HANDOFF_2026-10-01.md`
- existing #679 task/report/handoff/self-review docs listed above
- `ARCHITECTURE.md`
- `DECISIONS.md`
- `docs/OFFICIAL_TRUTH_SOURCE_EVIDENCE_ARCHITECTURE_2026-10-01.md`
- `lib/readiness/rule-claim-store-schema.test.ts` ONLY if a filename/version assertion genuinely requires reconciliation; no behavioral test weakening.

No other path may change.

## 7. Hard non-scope

Absolutely no:
- Supabase apply/push/repair/rebase/reset
- execute_sql mutation
- Development schema/data mutation
- Production mutation
- new SQL migration
- SQL semantic edit
- source/evidence/claim seed/import
- CH research import
- runtime writer/adapter
- RequirementsProvider activation
- engine behavior change
- provider/OpenAI/web call
- UI
- cron/queue
- indexing/launch
- #626 work.

This is identity reconciliation only.

## 8. Validation

Before push:
- re-fetch main and verify 0 behind
- exactly one migration with the canonical suffix
- old migration path absent
- new migration path present
- SQL SHA-256 before = after
- `git diff --check`
- operating-mode guard PASS
- focused schema test PASS
- full `npm test`
- typecheck
- lint
- build
- standard hygiene
- repository search proves no misleading unresolved old-version reference.

Remote verification is READ-ONLY:
- Development history still exactly one applied Rule Claim persistence migration, version `20261001151048`
- Development Official Truth row counts still zero
- Production unchanged.

After push:
- exact-head GitHub CI/Auth
- exact-head Vercel Preview
- stay Draft
- do not Ready
- do not merge

Record actual Cursor session URL and `originalModelName`.

**STOP for independent Technical-Lead exact-head review.**
