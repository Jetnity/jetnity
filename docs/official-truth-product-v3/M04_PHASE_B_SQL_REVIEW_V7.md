# M04 Phase B — V7 final SQL specialist source review

## Disposition

**No new open static blocker was found within this specialist's assigned V6 → V7 delta. Native execution and exact-head CI remain pending. This is not runtime PASS, Technical-Lead PASS, Ready, merge, database installation, method approval or production activation.**

Reviewer: `/root/m04_sql_phase_a_review`, same review session. Sole implementation author remains `/root/m04_durable_jobs_writer`. Root alone decides the overall disposition. Root's separate R9 coverage question is not closed by this report. The user requested a saved handoff while this report was being completed; the reviewer stops after saving these already-completed findings.

Review input is the immutable directory `/workspace/scratch/01cbe1264212/recovery/m04-root-review/phase-b-final-candidate-v7/`. The manifest SHA256 is `d8034825c45e3e5899e95ee402e6e297a623078b82993c4b5c1c2a031856c48f`. All eighteen receipt file sizes and hashes were independently reproduced, the manifest file list equals the receipt list, and its sorted source digest was reproduced as `def1398352cf6ff7bbfbbe2043bf826f5f971870c7c376de39afec06efab2bdd`.

| Principal input | Bytes | SHA256 |
| --- | ---: | --- |
| `native.ts` | 125663 | `a69f41cf8126c419c60ee174f746588e8841884e40362de79f3ce871bd0eb5a6` |
| `jobs-candidate.sql` | 135856 | `e44904fd6c4451308e327ef5f3e416a466f27084d3f5389077d0dbe7e2cb1cb0` |
| `jobs-candidate.rollback.sql` | 6175 | `9b9089d74242a802455cc7e3fb8a0a8515c17b61b45ae730b9bbba1adb650a66` |
| `generate-identity-vectors.ts` | 6324 | `aae453a17142947ab83de25fca7160c316277574f3d0941e5318f6ed6e0957e7` |

These filenames are under the snapshot's `scripts/db/official-truth-v3-durable-jobs-1/`. Line references below refer to those immutable V7 bytes, not moving author files.

## Scope and carried-forward evidence

This was a bounded final delta review, not another whole-source review. SQL and rollback are byte-identical to V6. The complete earlier SQL review, R4/R5 corrections, T01 fixture argument handling, T02 search-path change, strict methodId correction, prerequisite source/body comparisons, and real dependency/rollback design remain covered by the earlier pinned reports. Their unchanged source conclusions are carried forward; their native execution was not inferred.

The current read covered the new independent catalog inventory and protected before/after comparison; proof-wrapper correction; strict direct-entry additions; actual archived/prior-method S1 data; new S1/FK/global-unique/deferred-trigger witnesses; source-derived wire bounds; and complete N14/N15/T02 paths. Root covers overall business/native semantics and the runtime peer covers process/IPC/terminal-lifecycle deltas. The new family accounting in the harness is not independently certified by this SQL report.

Relevant existing S1 and MA1 candidate/rollback files, Auth fixture, S0 contract, intake contract, and applicability source were rehashed without executing or changing them. The eight of those paths included in the author's protected-source manifest match their recorded dispatch hashes. The protected lifetime file matches its previously reviewed V6 pin. Additional S1 fixture and synthetic-store source reads are pinned as supporting sources, without inventing a dispatch comparison for files absent from that manifest.

## R8 findings: source corrections verified

### V6-S01 — false-positive child proof receipt

V7 `native.ts:467–480` now records a callback assertion failure, rethrows it after `t.test`, and independently requires `passed === true` before appending a proof group. It checks the owned lifetime again after the scenario and after native-backend reconciliation. A child assertion captured by Node's test harness can therefore no longer fall through the previous unconditional `proofs.push` path. A callback that never ran also fails the explicit passed assertion.

The parent catch and terminal error aggregation remain at `1352–1376`. The final receipt is emitted only after the cleanup assertions; the ordinary child failure propagates into the parent error. This closes the concrete R8 child-wrapper defect on source inspection. It does not assert a successful actual suite or replace its process exit/CI result.

### V6-S02 — safe ambient search path masked the header test

V7 `1285–1298` creates real temporary `pg_roles`, `pg_namespace` and `pg_temp.jsonb` shadows, explicitly sets **`search_path=pg_temp,public` before installing the candidate**, invokes the real fixed probe, then reads actual `pg_catalog` metadata and requires all 29 function configurations plus builtin jsonb return OID 3802. `1319–1328` independently reinstates the same unsafe ambient path before the actual rollback. Result checks use qualified real catalogs.

The candidate and rollback themselves retain transaction-local `pg_catalog,pg_temp`; all new functions retain that order. The test no longer receives accidental protection from the fixture's normally safe session path. Old predecessor function configurations remain unchanged and no retrospective predecessor shadow-safety PASS is claimed.

## Independent finite catalog / ACL matrix

`native.ts:74–172` uses an explicit expected inventory, not `catalog_binding_v1` as its oracle. Its source agrees with the actual unchanged declarations at SQL `523–641` and ownership/grants at `1226–1238`.

| Boundary | Actual source assertion |
| --- | --- |
| 29 routines | Exact names, argument types and return types; private/API placement; expected owner, language, volatility, definer flag, parallel safety, strictness, kind, default/variadic/mode absence and T02 configuration. |
| Function ACLs | Exact owner-only execute set except two S1-owned bridge grants to postgres and the API grant to the new caller; owner grantor, no grant option. |
| Seven tables | N01 separately requires seven ordinary tables, postgres ownership, ENABLE/FORCE RLS and 1,024 unoccupied initial slots. |
| 41 constraints | Seven PKs, six UNIQUEs, seven exact source-column/target-table FKs with RESTRICT update/delete and immediate validated constraints; per-table CHECK counts 1/6/6/3/2/2/1. |
| 16 indexes | Explicit expected names; valid, ready, immediate; fourteen unique. The result-reference expression must use closed CASE branches for both result kinds and cannot use COALESCE. |
| Triggers / policies | Fourteen named enabled row/truncate guards with exact event masks and immutable function; twenty-eight immediate internal FK triggers; seven postgres-only permissive owner policies with true USING/WITH CHECK. |
| Table access | No table ACL entry for PUBLIC, anon, authenticated, service_role, new caller, or S1 owner. Actual runtime uses the designated non-owner login/role and tests denial of tables, helpers, old S1/MA1 entrypoints and owner SET ROLE. |

This describes the actual granularity: CHECK expressions are counted by table in the native matrix, and index definitions are not all compared as complete independent strings. Their actual SQL definitions were also reviewed statically. This is not a claim that the native assertions independently compare every byte of every catalog expression.

`native.ts:47–72,215–216` captures actual qualified predecessor catalog rows before installation and compares retained predecessor schemas, relations, attributes, constraints, indexes, functions, triggers, policies, roles and outgoing dependency rows afterward. Defaults and memberships are compared as complete sets. New-object rows are deliberately excluded by their identifiers, while new bridge-to-old dependencies remain separately verified by N14. This is a real before/after query path, not an author-generated expected snapshot.

## Added data and wait witnesses

### Strict inputs and archived previous methods

N02 `553–577` now exercises null/boolean methodId in both native subject and reference helpers, null research status, forged full subject, forged command key, wrong actual epoch and a settled-failure row with a null reason. The helpers' strict type checks remain present in the unchanged SQL. The test requires concrete error codes and unchanged subject state.

N07/R4 `625–686` obtains real structured outcomes from the unchanged I1/S0 fixtures, including a resolved-conflict archive and a decision at method revision 2 linked to a previous revision-1 decision. It uses the actual S1 capture/reserve/finish/open adapter before passing the complete opened record to native `consume_s1_v1`. Positive calls therefore exercise the actual archived/previous-method shapes, including the absence of an invented archive.method field. Missing outcome/audit, audit mismatch, broken predecessor link and added archive.method are rejected with P7604. The retained original/completion is reopened and compared afterward.

This is a native helper/full-retained-data witness. It does not by itself demonstrate a complete current-MA1 revision-2 activation workflow, and no such wider claim is made.

### Wait ordering and rollback

| V7 witness | Concrete source path and asserted outcome |
| --- | --- |
| `1075–1098`, S1 row wait | After actual I1/S1 completion, hold the corresponding S1 operation FOR UPDATE; the real execution_prepare target must be observed blocked. Revoke actual MA1, release, require P7504 in native evidence and identical subject journals/results/dispositions. |
| `1100–1114`, immediate FK wait | Persist real enqueue/claim, hold its actual command row FOR UPDATE, and call execution_start through a restricted connection. Observe the wait, revoke, release and require P7504 plus unchanged subject state. |
| `1115–1135`, global unique-operation wait | A privileged fixture transaction stages an exact second command for subject A without its usual advisory token and never commits it. Subject B uses the same operation ID through the actual fixed entry. The observed wait is resolved by holder rollback after MA1 revocation; B must receive P7504 and retain no subject state. This isolates the real unique wait beyond a single subject lock. |
| `1136–1140`, deferred drift | Add an actual deferred constraint trigger, require catalog refusal P7603 before accepting a queue mutation, remove only that test trigger and require identical real catalog. |

The common observer at `420–427` checks waiter PID and backend birth, actual active Lock state, blocking holder PID and relation/transaction-lock evidence while the native promise is pending. These are not sleep-only witnesses. `state()` compares subjects, command journals, starts, results and dispositions; it does not serialize every database table, so this report does not misdescribe it as a seven-table snapshot. The direct single-statement errors and unchanged uncaught final SQL failure path supply the transaction rollback boundary. Final S1/MA1/clock ordering and pre-final response sizing remain the already-reviewed unchanged SQL implementation.

## Wire bounds

The complete new `generate-identity-vectors.ts:38–79` was read. It uses the actual protected S0 reader for a sixteen-node context with fourteen distinct atoms and eight support IDs each. Its arithmetic is a conservative bound on the closed ASCII metadata domain, not a latency or production measurement. Protected source confirms the sixteen-node/eight-support limits, one context citizenship, fixed predicates/enums, bounded method ID and fixed reference token formats. The 20,480-byte context and semantic-subject allowances dominate these forms, including embedded expression quoting.

| Fixed operation | Request allowance B | Reply allowance B |
| --- | ---: | ---: |
| queue_read | 2048 | 23040 |
| queue_confirm | 23552 | 160772 |
| queue_cas | 110082 | 23040 |
| execution_read | 1024 | 65024 |
| execution_start | 65026 | 24064 |
| execution_prepare | 19968 | 19456 |

Maximum derived allowance is **160,772 bytes**, below the unchanged 262,144-byte wire limit. N02/U04 `726–739` sends the high-cardinality context through actual fixed enqueue and command confirmation, checks the exact persisted envelope and invokes the strict reply decoder. The separate sixteen-original discovery path remains at `688–703`; batch duplicate/missing-last-member negatives were added at `704–724`. The mathematical bound and these source test paths are present. Their actual successful execution is still pending.

## N14 / N15 dependency and rollback status

The complete final sections `1250–1350` were read. Pristine dependency tests retain empty MA1 operations/heads/revisions and explicitly remove the known reader membership before invoking the **unchanged real** S1 and MA1 rollbacks. They require exactly SQLSTATE 2BP01 and identical actual catalog afterward; P7506/P7507 cannot masquerade as passing dependency evidence. The graph requires one direct MA1 edge, one S1 read edge and five S1 shape-helper edges. Existing role/default/function owner/body/ACL drift tests still require atomic candidate refusal and restoration of the actual catalog baseline.

Nonempty real history still blocks M04 rollback with P7606. The empty fixture performs companion-first removal under unsafe ambient T02 conditions, preserves default ACL rows and then runs the actual predecessor teardowns. The late-writer test observes rollback waiting on a real slots relation lock, commits a real queue command while the writer owns that lock, then requires the post-wait rollback check to refuse and leave the command/subject retained. No CASCADE or history purge is used. SQL and rollback hashes are unchanged from V6; no new rollback regression was identified in this delta.

## Remaining gates and stop

The exact published candidate still needs the mandatory genuine PostgreSQL CI suite, its truthful proof/cleanup receipt, whole-suite process result and all other Technical-Lead gates. This report cannot close Root's separate R9 issue or replace the runtime peer's review. A changed head or changed reviewed bytes invalidates any broader exact-head acceptance.

No project code, author files, Git state, database, socket, runtime/native test, network or hosted service was changed or executed by this review. Only reviewer report/pin artifacts were written. The #917 refusal and all existing method/Owner/production gates remain intact. No new work slice was started.

**STOP: saved for Root's requested handoff.**
