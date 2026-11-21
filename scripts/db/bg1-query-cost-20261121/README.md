# BG1 query-cost package — 21 November 2026

This is an explicitly applied, PostgreSQL-17-only SQL package. A Git merge does
not install it. The Technical Lead owns Production application and rollback.
The package is still a candidate until its native proof, exact-head CI and
independent review are recorded in the [task/status](../../../docs/JETNITY_BG1_QUERY_COST_2026-11-21.md).

## What changes

Only `catalog_status_v1()` and `assert_catalog_v1()` are replaced. The catalog
keeps every namespace, object, privilege and dependency predicate. It removes
the final sort of wide JSONB values by using PG17 `jsonb_object_agg_unique`.
The two dependency branches first deduplicate their seven scalar catalog
columns, which are exactly the complete rows represented by their keys.
Identical legitimate dependency duplicates therefore produce the same JSONB;
any conflicting key, including a corrupted inheritance entry, now rejects.
Array ordering and all historical digest inputs remain unchanged.

The existing full immutable-baseline pattern appends
`official_v3_guard_private.query_cost_baseline_v1`. It retains the entire old
assertion chain and binds both the complete prior catalog and the complete
epoch-normalized v3 predecessor row. It never rewrites an old baseline. The
new baseline is private, RLS-protected and immutable after its single insert.

The successor describes a semantics-preserving implementation change. It adds
no freshness/generation fields or authorizer. `audit_v1`, its two complete
catalog checks, its five-minute cadence and deadline, incident latches, state,
`require_open_v1`, all cron definitions, Login/2FA, roles and settings stay
unchanged. An existing unresolved incident is not cleared by this package.

## Safety boundaries

- The old exact definitions, ownership and private ACLs must match the captured
  Production metadata. The old full assertion must pass before any DDL.
- A fixed Production acknowledgement, `postgres` Creator/database, PostgreSQL
  17 and READ COMMITTED are required. The package obtains the existing guard
  advisory lock, locks its state row and shares locks on every old baseline.
- Every existing catalog entry remains identical except the **definition**
  field of the two replaced functions. New entries must belong to the newly
  created table, its own types/indexes/constraints/triggers/policy/defaults or
  dependencies whose dependent endpoint is one of those new objects. Existing
  objects gaining a new dependency are not silently adopted.
- All old baseline rows and guard state are compared before and after. Final
  full assertion is mandatory. Any failure aborts the provider transaction.
- Rollback requires the current exact candidate and a passing full assertion;
  it restores the exact old definitions, drops only the successor with
  `RESTRICT`, then proves the complete old catalog and unchanged old rows.
  Unexpected drift or a new dependent object is a refusal, never a `CASCADE`.

## Files and execution

`build.mjs` deterministically generates installation, rollback and readback.
`observed-production-functions.json` contains the reviewed exact predecessor
definitions, metadata and source digests. A changed predecessor is a new
review, not a regenerated pin accepted automatically.

For a reviewed Production application, prepend this statement to the exact
`provider-migration-body.sql` inside the provider-owned migration transaction:

```sql
SET LOCAL jetnity.bg1_query_cost_target='production:qscbgcdmivbbnzrcyegn:BG1-QUERY-COST1';
```

Use Supabase `apply_migration`, not ad-hoc DDL through `execute_sql`.
Bind the tool's project ID explicitly to Production `qscbgcdmivbbnzrcyegn`
and independently verify the selected project before application. The custom
acknowledgement is an operator-intent guard, not proof of project identity.
The provider body has no `BEGIN`, `COMMIT` or `ROLLBACK` wrapper.
`install.sql` supplies its own outer transaction for an already acknowledged
SQL session; do not nest it inside a provider transaction.

After application run `readback.sql` and observe the next normal five-minute
guard run's **internal outcome**, rather than equating successful cron SQL with
a healthy guard. Inspect the existing state/incident status without changing
it. The public CMS-v2 release is independent and is not reinstalled here.

For rollback, use the same acknowledgement plus
`rollback-provider-body.sql` in a separate provider migration. Alternatively,
`rollback.sql` owns its transaction in an already acknowledged SQL session.
The fixed 25-second statement and 3-second lock bounds apply only locally to
the package transaction, not to server or role configuration.

## Proof and interpretation

`dev-readonly-proof.sql` is pinned to the observed Dev catalog definition. It
evaluates the original and candidate query in a READ ONLY transaction and
requires identical JSONB and identical canonical SHA-256. It creates no
function, table, baseline or fixture row. Dev and Production have different
immutable lineages; the Production installer must never pretend the Dev
lineage is the same.

Dev's measured query had 8,289 input rows / 8,268 keys. All 21 duplicate keys
were dependencies with identical complete values. An ordered wide aggregate
wrote 436 temporary blocks; the unique aggregate with narrow dependency
deduplication wrote zero. Query execution was 203.009 versus 196.207 ms. This
is one Dev pair, not a Production latency guarantee or an OOM diagnosis.

The **full assertion**, including the added predecessor hashes, was measured
separately: final-source pairs were 739.620→732.884 ms and 681.428→728.831 ms;
temporary blocks read/written fell from 387/388 to 0/0 in both. Earlier variable
results, including a slower first candidate, are retained in the task/status.
Full latency remains inconclusive and peak RAM was not measured. A faster
catalog subquery does not prove a faster complete guard. The final native proof
passed 14/14 without skips, using real PostgreSQL 17 and
the actual captured assertion/catalog definitions. Its synthetic lineage and
catalog fixtures are explicitly not a hosted Production or Auth proof. No
native test may skip when PostgreSQL is unavailable.

Run the same required focused group with:

```sh
node --import ./scripts/server-only-test-register.mjs --import tsx --test --test-reporter=tap --test-concurrency=1 scripts/db/bg1-query-cost-20261121/native.test.ts
```

The existing owned PostgreSQL `--single` harness avoids sockets and never
accepts hosted credentials. Installation/rollback are tested as non-superuser
`postgres` with BYPASSRLS; bootstrap superuser authority is used only to inject
local corruption. CI also typechecks both new TypeScript proof roots and runs
this group without changing the existing native suites or their gates.

PostgreSQL references:
- <https://www.postgresql.org/docs/17/functions-aggregate.html>
- <https://www.postgresql.org/docs/17/catalog-pg-depend.html>
- <https://www.postgresql.org/docs/17/catalog-pg-shdepend.html>
- <https://www.postgresql.org/docs/17/catalog-pg-inherits.html>

No application API, customer content, trip record, source rule, provider key,
paid access or infrastructure tier is changed by this package.
