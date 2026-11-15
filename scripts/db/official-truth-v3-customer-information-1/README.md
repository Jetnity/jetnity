# CUSTOMER-INFORMATION1 — additive canonical Dev successor

**Prepared, UNAPPLIED.** This package updates six existing canonical validators
for the customer-information data slice, including context revision3 with a fixed
`informationTopic` and a stable `informationItem`. Different forms, fees or
customs items therefore retain different canonical identities. All previously
valid context revisions keep their original canonical bytes and keys.

The same still-unapplied transaction also includes one separately pinned
`assert_history_v1` performance definition. Its invocation-local validation memo
keeps the existing 256-entry/1MiB bounds but admits newly validated exact bytes
after saturation. It does not freeze the memo at the first 256 historical jobs.
Every retained operation, transition, attempt and original invariant is still
checked. Runtime deadlines, quota limits and original installed SQL are exact.

This is a fixed successor of the existing Dev ROLLING-QUOTA1 installation. It
does not reinstall the stack or amend any historical installer, table binding,
BG1 proof, quota, method approval, retired attempt, sender cycle or source result.
The 206 researched destinations retain their existing RESEARCH_ONLY boundary.

## Exact change boundary

The reviewed `definitions.sql` belongs to the customer-data slice. `pins.json`
binds that complete file, each old/new validator body, and every unchanged
predecessor file. `build.mjs --check` reproduces the complete provider body and
lost-acknowledgement readback byte for byte.
`history-build.mjs --check` separately reproduces `history-definition.sql` from
the exact installed predecessor by changing only its two successful-validation
memo-admission blocks. The baseline binds that file with its own digest.

| Existing function | Additive change |
| --- | --- |
| `official_v3_intake_private.proposal_shape_v1()` | Closed proposal/outcome/audit shape for the added customer details. |
| `official_v3_result_private.proposal_shape_v1()` | The same complete closed shape for retained result validation. |
| `official_v3_jobs_private.context_v1(jsonb)` | Revision3 topic/item context identity; unchanged legacy branches. |
| `official_v3_result_private.context_v1(jsonb)` | The identical context rule at the result boundary. |
| `official_v3_jobs_private.subject_v1(text,jsonb)` | The new `entry_information` subject and topic-bound identity. |
| `official_v3_result_private.subject_v1(text,jsonb)` | The same subject contract for retained result checks. |
| `official_v3_jobs_private.assert_history_v1(text)` | Bounded invocation-local memo reset after successful validation; all full-history checks remain. |
| BG1 `jobs_catalog_v1()` and `hrs_catalog_v1()` | Read the complete new immutable subcatalog snapshots. |
| BG1 `assert_catalog_v1()` | Retain the whole old baseline chain and verify the exact new successor. |
| BG1 `require_open_v1()` and public `official_v3_guard_alarm_status_v1()` | Require a new full proof begun after this installation. |

One new table, `official_v3_guard_private.customer_information_baseline_v1`, is
private, forced-RLS and immutable against UPDATE, DELETE and TRUNCATE. It binds
the complete rolling predecessor row/catalog, the reviewed definitions, actual
new catalogs, required next generation and actual installation time. No existing
table definition, row, object owner, signature, function OID or ACL may change.

The actual three existing owner roles require temporary SET-only authority for
the trusted `postgres` installer. The migration creates separate postgres-grantor
edges, uses each owner only to replace its own functions, then revokes precisely
those new edges. Original bootstrap ADMIN-only membership rows and their OIDs
remain exact. No runtime role gains a grant, schema right or entry point.

Before capturing any successor, the migration checks all twelve expected
function bodies/options, the complete original catalog graph, every original
membership/role and every existing private/sender table. Unknown catalog edges,
extra privileges or changed historical content abort the entire transaction.
The complete existing HMA/S1/HM04/HRS/certificate/retirement checks run before and
after installation. Existing component checks hold their owner-authorized SHARE
locks; additional SELECT-authorized ACCESS SHARE locks prevent old-table DDL.

## Important publication boundary

The new canonical shape does **not** qualify an official source or grant another
publication binding. The existing HRS `binding_valid_v1`/selected binding remains
the reviewed CH→DE visa/`requirement_effect` path. These six validators support
safe typed retention and distinct identities; additional official topic sources
still need normal method/qualification/binding work. Unknown visitor information
must stay “derzeit nicht verfügbar”. No synthetic fixture is a country rule or
proof of a hosted source/publication.

## Controlled Dev installation

The Technical Lead performs these steps after integration and the complete CI:

1. Independently select Dev `yfvbxvijcorffwxbxahl`. The fixed acknowledgement in
   the body does not select a remote project. Use the actual trusted `postgres`
   creator, PostgreSQL17 and read-committed provider transaction.
2. Disable the existing sender through its normal mechanism and retain the
   before-state. Let genuine in-flight work drain. The installer refuses enabled
   sending, active cycles, unprocessed import/preview dispatches, leased claims,
   open attempts and reachable runtime sessions. Historical blocked Cycle2/3
   records remain valid and unchanged. The normal BG1 cron stays enabled.
3. Apply the exact generated `provider-migration-body.sql` as **one transaction**.
   It contains no BEGIN/COMMIT, connection, API call, source request, tick, audit,
   quota reset, proof write or automatic sender activation. A refusal rolls back.
4. Reconcile acknowledgement with the readback procedure below. Immediately after
   a successful commit the old positive proof is deliberately insufficient and
   business admission remains unavailable.
5. Observe the next normal scheduled complete BG1 generation. It must be at
   least the stored `required_generation`, with `last_proof_started` at or after
   `proof_not_before`; the normal current alarm/readback must agree. Do not reset
   a due slot, backdate a proof or call a manual audit to manufacture hosted proof.
6. Complete the separate exact Cycle3 review and restore normal sender control
   only after its other gates are satisfied. Observe real source execution,
   publication and visitor readback separately.

Production, merge, new costs and external publication are not actions of this
package. A fresh Production package is a separately reviewed, still unapplied
artifact; it must not claim this Dev history was installed there.

## Lost acknowledgement

First read only:

```sql
SELECT to_regclass('official_v3_guard_private.customer_information_baseline_v1');
```

NULL means there is no committed successor. If the relation exists, execute the
complete generated `readback.sql`. It invokes only the existing read/check paths
and reports the exact provider/definition identity, twelve body hashes, baseline
digest, proof boundary and current admission. Every `*_verified` value must be
true. An exception or mismatch is not a successful installation. Re-running the
installer is deliberately refused; it is not a way to reconcile a lost ACK.

## Local verification

Use Node22 and the repository's existing local PostgreSQL17 toolchain:

```sh
node scripts/db/official-truth-v3-customer-information-1/build.mjs --check
node scripts/db/official-truth-v3-customer-information-1/history-build.mjs --check
node --experimental-test-module-mocks --import ./scripts/server-only-test-register.mjs --import tsx --test --test-concurrency=1 lib/readiness/official-truth-customer-information-migration.test.ts
```

The mandatory hosted-PG17 selector must include the new migration test in its
main partition. The compiler itself is offline and cannot apply anything.

The native proof installs every unmodified predecessor, four coherent synthetic
historical failure cycles, the real sender schema and explicit local copies of
blocked Cycle2/3 metadata. It checks rollback on wrong target/catalog/authority,
extra runtime privileges, enabled or un-drained sender; exact old rows and
function OIDs/ACLs; legacy identity equality; collision-free new item identities;
immutable/private baseline; lost ACK and refused duplicate install. A genuine
positive predecessor audit is rehearsed and rolled back with the candidate.
The committed local successor remains closed until a genuine new full audit.
No clock or due slot is edited. This is serial owned-local SQL evidence, not a
new contention, hosted cron, source HTTP or publication claim.

The short history diagnostic uses an explicitly fictional 64-cycle predecessor
and coherent extension to 86 STARTs/447 retained operations. It compares the
actual complete old/new validators with PostgreSQL function-call statistics and
SQL-only timings, verifies each temporary A/B replacement rolls back to the
installed body, and rejects a changed invalid job beyond memo saturation. A
separate exact-block probe covers count/byte saturation and oversized misses.
The long rolling-quota native test explicitly installs this successor before
its unchanged real API proof of all 64-START/256-operation/terminal-credit
boundaries and the genuine 5-second deadlines.

This memo correction is not an unlimited lifetime-capacity claim. The validator
still scans the complete lifetime journal. Rolling quotas limit new daily work,
not retained history or its validation CPU cost. Hosted measurements and a
separate retained-history scaling decision remain required for sustained growth.

`shape-fixtures.json` contains seventeen wholly fictional prepared outcomes from
the canonical customer-data pipeline, covering all thirteen detail forms. The
native proof checks complete proposal/outcome/audit shapes in real S1 and HRS,
agreement with canonical context identity, and rejection of mismatched topics.
After the data slice is present, reproduce those vectors with:

```sh
node --import ./scripts/server-only-test-register.mjs --import tsx scripts/db/official-truth-v3-customer-information-1/generate-fixtures.mjs --check
```
