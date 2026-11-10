# M04 Phase B — Technical-Lead implementation allocations V1

**10 November 2026 — approved finite corrections, not native acceptance.** These allocations were explicitly decided by Root during the same Phase-B author session. They supplement only the named implementation details in the immutable [Phase-A freeze](M04_PHASE_A_FREEZE_V1.md) and [plan](M04_PLAN_V1.md). The original documents and their hashes remain historical evidence. There is no additional file scope, runtime permission, method approval, hosted installation or public activation.

Author remains **Jetnity Official Truth V3 Durable Jobs1 — Codex Generation1**, actual session `/root/m04_durable_jobs_writer`. Root alone adjudicates independent PASS, publication, Ready and merge. Every code change requires its own source review and exact-head CI. Author self-review is not Technical-Lead acceptance.

## T01 — SQL NULL through the existing fixed test transport

Decision: [6754518445](https://github.com/Jetnity/jetnity/pull/1178#issuecomment-6754518445).

The protected `PgParameter` contract contains non-null byte data. Its current encoder does not represent a SQL NULL parameter. The private negative-probe epoch nevertheless must reach PostgreSQL as actual NULL. Only the new M04 adapter's one fixed statement is allocated this exact expression:

```sql
SELECT official_v3_jobs_api.execute_v1(
  $1::text,$2::text,$3::integer,$4::text,
  $5::text,NULLIF($6::text,'')::integer,$7::integer,$8::text) AS result
```

The builder supplies an empty text sentinel only for the private null epoch; otherwise it supplies the validated integer's decimal text. The actual SQL signature remains `execute_v1(text,text,integer,text,text,integer,integer,text)`. No other cast, argument, operation, port, S1 literal or protected wire/MA1 helper changes.

Actual CI must prove a non-authorizing null-epoch probe, authorized integer epoch, refused authorized-null epoch and refused invalid integer text, including terminal cleanup. The sentinel is transport metadata, never a stored value or authorization. This allocation does not retry, replace or relate to the specifically refused #917 readback.

## T02 — explicit order of built-in and temporary schemas

Decision: [6754713898](https://github.com/Jetnity/jetnity/pull/1178#issuecomment-6754713898). Proof-sensitivity correction: [6755046698](https://github.com/Jetnity/jetnity/pull/1178#issuecomment-6755046698).

PostgreSQL searches the implicit temporary schema ahead of `pg_catalog` for relation and type names when the temporary schema is omitted from the path. Therefore an explicit `search_path=pg_catalog` alone does not protect the new unqualified catalog/type lookups. Root verified this against [PostgreSQL16 search-path documentation](https://www.postgresql.org/docs/16/runtime-config-client.html) and [security-definer guidance](https://www.postgresql.org/docs/16/sql-createfunction.html#SQL-CREATEFUNCTION-SECURITY).

The two new install/rollback scripts use transaction-local `search_path=pg_catalog,pg_temp`. All twenty-nine new M04 functions use exactly that fixed function setting. New inventory checks must expect that exact configuration. The eleven existing S1/MA1 prerequisites keep their existing source, owner, ACL and `search_path=pg_catalog` checks; this is not permission to normalize or modify predecessor objects.

Native proof must create genuine temporary catalog/type shadows and exercise install, runtime and rollback. Before each new script is called, the fixture must deliberately use an unsafe ambient path; otherwise a previously hardened session could conceal a missing script header. Independent evidence reads remain explicitly qualified to the true `pg_catalog`. Source inspection alone is not a passed PostgreSQL test.

## T03 — complete physical connection accounting

Decision: [6754943624](https://github.com/Jetnity/jetnity/pull/1178#issuecomment-6754943624). Family/transient-observer clarification: [6755046698](https://github.com/Jetnity/jetnity/pull/1178#issuecomment-6755046698).

The protected `LocalPgConnection.commitBefore` opens its own guard and control while the committing adapter still owns target and cancellation-control connections. The Phase-A shorthand of two physical connections per committing lane omitted these inherited connections.

| Existing lane family | Unchanged lane count | Maximum physical work connections per active lane | Source-derived work bound |
| --- | ---: | ---: | ---: |
| M04 fixed transaction | 4 | 4 | 16 |
| S1 fixed transaction | 4 | 4 | 16 |
| MA1 current read | 4 | 2 | 8 |
| Total for one configured family | — | — | 40 |

Two fixed adapter observers are additional. Raw fixture owner/human/waiter connections and each transient fault-adapter observer must be counted separately. The forty-work-connection calculation is per configured family; multiple coexisting factories do not inherit one global physical limit without an explicit fixture-wide admission bound. Record actual fixture overlap and its bound honestly.

Native lifetime evidence must include inherited COMMIT guard/control ownership and closure. Actual backend absence is separately required; a method call requesting close does not prove disappearance. No logical lane, invocation/call quota, timer, cluster configuration, workflow, protected helper or public API is increased by this allocation.

The test process bridge also has a precise qualification: the parent translates a child-supplied remaining duration into a parent-local timer without subtracting IPC transit. The original absolute `notAfter` and the child's private post-drain Held checks still constrain effects/positive results. No unsafe authorization escape was established. Do not describe the parent-local timer itself as the unchanged original monotonic deadline.

## Required evidence integrity and unchanged boundaries

The [R8 review](https://github.com/Jetnity/jetnity/pull/1178#issuecomment-6755046698) also requires failure-aware native receipts, complete registered child-wrapper cleanup on exceptional exits, and separate statements when a parameterized PostgreSQL extended-protocol Parse cannot accept a multi-command query. An awaited Node subtest completion is not alone a success proof; retain and propagate the actual scenario error. The [Node22 primary reference](https://nodejs.org/download/release/latest-jod/docs/api/test.html) supports that control-flow distinction. CI's own nonzero exit remains an independent gate.

No local PostgreSQL, native SQL or socket execution is authorized. Mandatory native proof runs only in the unchanged existing GitHub CI. There is no skip for unavailable PostgreSQL and no broader timeout, dependency, missing-binary retrieval or protected fixture change.

Method **NOT_APPROVED**; #1139 **NOT_RELEASE_READY /17 pre-Owner gaps**. #917's specific readback refusal remains absolute: no retry, rephrase, delegation, reroute, transport switch or human SQL substitute, and no renewed old-evidence request. #1131 Ready STOP; #1135 Research Hold and separate platform Ready STOP; #968; #911/#913 remain. No hosted DB/Auth/RLS/ACL/migration/credential action, real source/provider/research, scheduler, notification, new cost or public V3 activation. No automatic next slice.
