# BG1 query cost — bounded implementation task, 21 November 2026

> **Actual release status, 21 November 2026, 21:55 UTC:** #1273 is merged and
> the exact SQL package is installed in Production. The first strictly later
> normal BG1 run passed internally with the existing incident state unchanged.
> The final section records the actual release; earlier preparation and author
> STOP statements are historical. This documentation closure has separate gates.

## Authority, ownership and baseline

The current owner instruction authorizes the prepared CMS release, targeted
BG1/CMS/Cron query optimization, a reviewed PR with green CI, merge and live
verification. The separately authorized Micro-to-Small upgrade belongs to the
Technical Lead. This task does not authorize any other configuration, Auth,
2FA, provider or cost change.

Writer: `query_optimization_author` (ChatGPT delegated agent, same session).
Branch: `fix/bg1-query-cost-20261121`. Initial base: merged CMS release #1270,
`5bb0d5909e675de09eb6c7659c3132187e66abf9`; rebased before implementation onto
current main after #1269, `276fe3c4e066ea433cc6bea1c16b7ee90da103a0`.
One writer owns this worktree. The Technical Lead owns PR-slot allocation,
independent review, Ready, merge, Production apply and release verification.
No Cursor dispatch is permitted by the current owner instruction.

## Goal and bounded plan

Reduce measured temporary I/O from the full protected-catalog query while
preserving its complete object/privilege/dependency coverage and canonical
JSONB result. Do not trade the five-minute guard cadence or either full audit
boundary for performance. Public CMS latency is addressed by the separate,
already merged public-v2 release; this task must not duplicate that work.

1. Read the actual deployed routine definitions and the complete immutable
   baseline lineage. Never derive the current chain from historical docs alone.
2. Prove exact JSONB and canonical-text SHA equality for a bounded catalog
   algorithm change, including identical dependency duplicates and conflicting
   duplicate inputs. Preserve all array order and ordered digest inputs.
3. If the proof supports an implementation, build an append-only successor that
   retains every previous digest link. Do not edit historical baseline rows or
   silently adopt unrelated catalog drift. Keep audit, incident, freshness,
   authorization, cron definitions and timing unchanged.
4. Add exact preflight, provider transaction body, readback and restrictive
   rollback. Validate in disposable native PostgreSQL 17 and hosted Dev before
   proposing Production application.

Expected files are a dedicated `scripts/db/bg1-query-cost-20261121/` package,
native proof and this record. Any CI wiring and architecture/decision updates
must be explicit in the final diff. No application API or trip-graph contract
changes are planned. There are no new dependencies or service costs.

## Evidence obtained before Production application

The author's Dev verification before installation used only bounded, read-only
queries. The final catalog aggregate
contains 8,289 input rows / 8,268 distinct keys. Its 21 duplicate dependency keys
each have one distinct complete JSONB value. Removing only the final
`jsonb_object_agg` object-key `ORDER BY` produced equal JSONB and canonical SHA.
On the same Dev catalog, separate `EXPLAIN (ANALYZE, BUFFERS)` measurements were
203.009 ms with 436 temporary blocks written versus 195.922 ms with zero
temporary blocks for that first diagnostic. The accepted candidate additionally
deduplicates narrow dependency rows and uses `jsonb_object_agg_unique` to reject
conflicting keys: 196.207 ms / zero temporary blocks, again equal JSONB and
canonical SHA. The committed Dev READ ONLY proof also passed. This demonstrates
avoided sort I/O, not an OOM diagnosis or a promised Production latency reduction.

After the Technical Lead confirmed the Small upgrade, one metadata-only
Production read captured the current exact definitions. No guard was called:

| Routine | SHA-256 of `pg_get_functiondef` |
| --- | --- |
| `catalog_status_v1()` | `037ca263eeeed28c4c6402f7fca4a751db56f73ff8ada7e71656576f27b22f3f` |
| `assert_catalog_v1()` | `392ea8733d60115b7e2c0135e21c76116f9f4d066988dda860e5129d427553fa` |
| `audit_v1()` | `b6f56232b998dea7868bf9767f8e9012282a43512a1e5fd622c9824e62fd2fff` |

At that pre-install observation, Production ended at `bg1_transient_baseline_v3`, retaining the chain
through status, rolling quota, admin runtime, saved offers, weather, AT source
monitor and AT batch switch. Dev has a different lineage and catalog scope;
an installer may not pretend they are interchangeable.

The Technical Lead's separate, bounded Production observation at 20:40:29 UTC
passed the original full `assert_catalog_v1()` in 845.93 ms after the Small
upgrade. This is a point-in-time baseline, not a paired candidate benchmark.
The implementation uses the established full successor pattern; a proposed
delta-only optimization was not adopted. Full assertion cost, including the
extra complete predecessor hashes, remains part of native review.

PostgreSQL 17 documents JSONB object-key normalization and last-value handling
of duplicate keys. Therefore equality must include the actual key/value
invariants; simply assuming unique keys is insufficient:
<https://www.postgresql.org/docs/17/datatype-json.html>
<https://www.postgresql.org/docs/17/functions-aggregate.html>

## Historical acceptance criteria and author STOP before #1273

- Exact catalog equality and canonical digest are proved with real PG17.
- Catalog mutations to bodies, privileges, roles, dependencies and protected
  tables remain detected; stale predecessor rows and unknown drift fail closed.
- No historical baseline rewrite, stale-proof refresh, fake healthy guard,
  weakened authorizer, changed cron or automatic incident clearing.
- Installation and rollback are atomic and refuse unexpected state.
- Native proof is mandatory, never silently skipped. Complete exact-head CI
  and independent Technical-Lead review remain outstanding.
- Hosted writes require coordination with the Technical Lead; none performed.
- **Do not mark Ready. Do not merge. Do not open a fourth PR. Do not apply to
  Production. Do not start a follow-up slice.** Stop at the reviewable package.

## Completed local proof and review handoff

The final generated package passed **14/14** real PostgreSQL 17.12 tests, with
zero skipped cases, in 57.615 seconds. The installer and rollback execute as
`postgres NOSUPERUSER BYPASSRLS`; the owned fixture's bootstrap superuser is used
only for explicit corruption injection. Missing/wrong target and non-Creator
contexts fail before DDL. Four runtime roles cannot select the new baseline or
execute either private routine. The new table additionally requires the exact
owner-only effective ACL and both RLS flags, so unexpected default grants fail
closed. CI's focused six-root native TypeScript check and diff hygiene pass.

The proof runs the exact captured full predecessor assertion over a synthetic,
internally valid nine-table lineage. Every historical catalog and digest edge
is exercised; no guard is replaced with a no-op. It is not the complete
Production installer stack and does not claim an executed full audit or hosted
Auth end-to-end test. Existing full native suites remain in CI unchanged.

Faults cover duplicate identical dependencies, conflicting inheritance keys,
every predecessor digest edge, old catalog/rolling policy/generation changes,
function bodies/ACL/configuration, table shape and unexpected dependencies.
An injected last-step installer error restores all DDL/data atomically.
Clean installation and rollback restore the exact old catalog/definitions and
every protected row. Nonempty state with generation 7, incident generation 1
and resumed generation 0, plus stored incident/run evidence, remains unchanged.
The audit definition remains byte-identical and retains both full assertions.

### Measured full assertion, not only the catalog subquery

The final owner-permission fixture contains 8,474 catalog keys and 2,920,943
canonical JSON bytes, with `work_mem=3500kB` and `jit=off`:

| Final-source pair | Original full assertion | Candidate full assertion | Temporary blocks read/written |
| --- | ---: | ---: | --- |
| First measured pair after fixture setup | 739.620 ms | 732.884 ms | 387/388 → 0/0 |
| Repeat after a complete rollback/reinstall | 681.428 ms | 728.831 ms | 387/388 → 0/0 |

Earlier preparatory runs used the same 8,474-key scale with a superuser Creator
fixture and 2,920,859 canonical bytes. All observations are retained, including
the first slower candidate: **841.071→1072.149**, **837.068→708.443**,
**885.938→764.968**, **750.576→846.789**, **987.414→784.839** and
**740.188→725.006 ms**. Every pair removed the 387/388 temporary blocks. These
are exploratory runs, not interchangeable samples for a statistical SLA.
No run is asserted to be a guaranteed cold-cache measurement.

The demonstrated benefit is reduced temporary sort I/O. Full assertion latency
is variable/inconclusive, and peak RAM was not measured. No guaranteed latency
speedup, OOM root cause or full-audit resource reduction is claimed.

### Frozen application artifact

- `provider-migration-body.sql` SHA-256:
  `dccf4eb097e4f6a4ffd040df6edb6933912a1a61e53dca06e14e6dc6d4a0fd67`.
- `rollback-provider-body.sql` SHA-256:
  `bf59e0001e8c3cb51ed630432cf0663fa14abbc05b2b3580ae7dfd23102c51b1`.
- The pre-publication main checked at the author handoff was
  `276fe3c4e066ea433cc6bea1c16b7ee90da103a0`.
- Independent static/native review of the full pattern reported no blocking
  finding; final exact-head CI, Technical-Lead verdict and live readback remain
  separate gates. The final table-ACL check is included in the 14/14 run.

**Historical author handoff before #1273:** package and focused native proof complete; no PR opened by
this writer and no hosted optimized routine installed. Only read-only Dev and
the single coordinated Production metadata call were performed by this writer.
Next actor: Technical Lead publishes the frozen package in the available PR
slot, obtains exact-head green CI/review, then controls the separately authorized
Production application and bounded rollback. Do not deploy a new app build for
this SQL-only change. The completed CMS/Small receipt is included separately.

## Actual Production closeout — 21 November 2026

[PR #1273](https://github.com/Jetnity/jetnity/pull/1273) passed independent review
and all 12 jobs in [CI run 44951372448, attempt 1](https://github.com/Jetnity/jetnity/actions/runs/44951372448)
on `bb795ef1540a173d87d2a1884e4ccc1ab705ce56`. The separate Vercel check also passed.
It merged at **21:52:02 UTC** as `bce92099b4bcb785573d80df24fb5588060574d3`.
The CI contract corrections preserved every historical source pin and required
gate, adding the finite workflow successor for the new mandatory proof.

The exact native CI proof passed **14/14**, zero failures or skips, in 40.37 s.
Both pairs removed temporary reads/writes **387/388 → 0/0**, while full-assertion
times were **531.375→586.913 ms** and **539.303→598.574 ms**: both candidate
measurements were slower. The supported benefit remains avoided temporary sort
I/O. Peak RAM, an OOM cause, a guaranteed speedup and full-audit resource savings
were not established.

The fresh Production preflight at **21:52:29.414261 UTC** confirmed the exact old
functions, no query-cost baseline, four CMS publications and a current guard.
The Technical Lead requested `bg1_query_cost_release_20261121` for
`qscbgcdmivbbnzrcyegn` at **21:53:29 UTC**, using the frozen provider SHA above.
The provider reported success; the first database marker after confirmed commit
was **21:53:59.250755 UTC**. That marker is an observation after commit, not a
claimed exact commit timestamp. The packaged read-only full assertion and
definition/owner/ACL readback passed. The two changed routine fingerprints are:

| Routine | Installed SHA-256 of `pg_get_functiondef` |
| --- | --- |
| `catalog_status_v1()` | `7831174f514c657fcae44d8125e517f810e6271cbc128642cdcbc1df27b2a402` |
| `assert_catalog_v1()` | `6b71c91f8498c4001f1f81fa01ba4c440681ec6166fbb2bccaae760602c59d39` |

Both remain postgres-owned `SECURITY DEFINER` functions with exactly
`{postgres=X/postgres}` execution ACLs. `audit_v1()` retains its original
fingerprint and both complete catalog assertions. The installed immutable
`query_cost_baseline_v1` uses `jsonb_unique_narrow_dependency_distinct_v1`:

| Baseline field | SHA-256 |
| --- | --- |
| `predecessor_catalog_digest` | `7b9418dfeec3bb21d0c23f8689c8e19c2151a1a4d11901c727980373e30eab9e` |
| `predecessor_baseline_digest` | `a7266c41fc77ab63b8ce2878d10890c7d5b395a3a33d8fe6c5331bf68f7e2bd0` |
| `catalog_digest` | `ef4dcbe4d5c17bcdc339ef159a8fe26f352dbc8057943bc035ed3b79340e2a24` |

The separate **21:54:36.800600 UTC** metadata readback matched the preflight
fingerprints for roles, memberships, settings, all six cron definitions and all
three CMS tables. The complete guard state was still identical before the next
normal tick. The postmaster start remained **20:25:51.211541 UTC**, from the
earlier Small upgrade. Security-advisor findings were identical after excluding
only their observation timestamps; existing findings remain. The inspected
post-install runtime Error/Fatal query returned no entries.

The first normal due slot strictly after the commit marker was **21:55:00 UTC**.
It entered at **21:55:00.026007**, began its proof at **21:55:00.029581** and
finished at **21:55:04.549996 UTC**. At **21:55:44.570209 UTC**, its internal
`runs_v1.outcome` was **`complete`**, the public alarm was **`current`**, and proof
generation had advanced from **1607 to 1608**. Incident/resume generations stayed
**108/108**; `incident_at` stayed **2026-11-20 22:50:00.060246 UTC**. All four
acceptance booleans passed: a full proof after installation, unchanged sticky
head, no new incident and current public status. The audit ran on its existing
schedule; no manual audit or incident release was performed. This establishes
the internal result, not merely a successful cron invocation.

The independent public readback at **21:54:38–21:54:46 UTC** made one anonymous,
queryless GET per API, home and Entdecken route. All returned **200**. The API
was `no-store` and returned exactly the same four published snapshots/revisions;
both pages contained the four approved destinations and expected image
references, with complete approved descriptions on Entdecken and no empty or
fallback message. This was an HTML/data check, not a new browser interaction
or image-download test. Client wall times include network/TLS and are not SQL
timings or an SLA measurement.

The public app deployment remained unchanged; this SQL release required no
app promotion. No rollback was needed. The completed Small/CMS release, its
**5.15 USD/month estimated compute increase before taxes**, and the earlier
existing-session Login/Meine Reisen checks remain in the
[separate release receipt](JETNITY_CMS_PUBLIC_READER_RELEASE_2026-11-21.md).
There was no fresh credential/2FA login test or additional configuration,
Auth, provider, restart or cost change in this SQL release. The static catalog
fallback and under-eight supplement remain present.

Two pre-existing cron failures remain separate: `sync_profile_emails_hourly`
(21:00 UTC, 0.47 ms) and `jetnity-at-production-source-enqueue-v1`
(21:50 UTC, 14.97 ms). These recorded runs preceded the SQL installation;
this release does not declare those jobs repaired. The separate AT HTTP-ID
step remains gated and was not authorized or executed by this task. Production
now ends at `query_cost_baseline_v1`; any unapplied HTTP-ID or other protected
catalog package prepared against the former v3 head requires a fresh predecessor
and source comparison plus independent review. Its old pins must not be silently
reused. This amendment records the completed runtime release only. Its own
documentation PR, CI and review status must be read from GitHub; it grants no
additional runtime or configuration activation. #1240 and #1272 remain
independent work.
