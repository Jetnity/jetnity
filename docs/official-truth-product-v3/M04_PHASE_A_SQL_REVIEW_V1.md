# M04 final Phase-A SQL / authority design review V1

**Disposition: DESIGN REVIEW COMPLETE — NO OPEN DESIGN BLOCKER in the reviewed SQL, ACL, dependency, transaction, authority and recovery-dataflow scope.**

This is an independent design-review recommendation to Root. It is **not runtime PASS, Technical-Lead PASS, a design-freeze decision, implementation permission, Ready, merge or database/production approval**. Root alone decides and publishes the freeze/dispatch.

Reviewer: `/root/m04_sql_phase_a_review`, same read-only session as the earlier SQL advisories and R1/R2 checkpoint reviews. Author: Jetnity Official Truth V3 Durable Jobs1 — Codex Generation1, `/root/m04_durable_jobs_writer`.

## Exact reviewed delivery

Delivery directory: `/workspace/scratch/01cbe1264212/recovery/m04-root-review/author-delivery-v1/`.

The receipt binds the unchanged task seed `14889b050bc6e8b814bc778730c80f70d20c0d47`, `STOP_FOR_ROOT_FREEZE` and `runtimePermission:false`. I independently verified every delivered file's byte count and SHA-256 against that receipt:

| File | Bytes | SHA-256 |
| --- | ---: | --- |
| M04_PLAN_V1.md | 120,753 | `1952dc9c930021d32620f769595bb6f1641743574265f918cad6d36cfefdb88e` |
| M04_PHASE_A_SOURCE_PINS_V1.json | 28,544 | `fe70d74f42638c1fb9b40304818fb6b278232752be038734a5ba5277a8001c11` |
| M04_PHASE_A_SELF_REVIEW_V1.md | 11,029 | `9eb56ec078c4a00dc76f0f2416e7379bfcd34b4fd8502d4ec02fc2d1daf4fb9d` |
| M04_PHASE_A_STATUS_V1.md | 6,602 | `54e5df45041a849d969653e07c6c9d20557cae033577e06676ad6f627b1c903a` |

Review coverage is the completely read 102,615-byte working snapshot V2 plus the **complete exact final delta**, all receipt/self-review/status contents, and the full source-pins document including its forty-nine source rows. Self-review claims were treated as author evidence, not accepted as an independent verdict. The accompanying `final-phase-a-review-v1-pins.json` records independent local-source checks and their reading limits.

The accepted source parent 7ae1394 and seed 14889b0 are not relabelled current main. Root's separately verified be79ea2 main drift and protected-input equality remain Root live evidence; this review performed no Git or network attestation.

## Closure of the previous findings

| Finding | Final design evidence | Design disposition |
| --- | --- | --- |
| A01: unbound absence oracle | Probe/authorized phases, NULL epoch only for non-positive probes, no MA1 observation before a genuine negative, serialized all-history checks, and a fresh authorized transaction for positive data. | Closed at design level. |
| A01: missing new ID hiding older unknown | A missing claim/command/attempt does not bypass older unresolved execution. A different PREPARED or unresolved START blocks; no new producer permission arises from absence. | Closed at design level. |
| A01: legitimate original terminal flow | Explicit original PREPARED and privately owned failure continuation permits the matching command-ledger lookup without confusing command absence with execution absence. Positive current data and final CAS still require actual MA1/full binding. | Closed at design level. |
| A02: late/reset receipt budget | Terminal sample b and latest Held produce the conservative database cap; statement-start anchors the native deadline before waits; acquisition and query setup share the unchanged monotonic deadline. | Closed at design level. |
| A02: in-flight local Held shrink | The new joint factory excludes same-receipt observation/effect overlap through actual native terminal drain; standalone old overlapping-reproof behavior stays unchanged. | Closed at design level. |
| A03: terminal operation capacity | Current original claim reserves one terminal credit; count plus credit stays <=256; START rechecks; dedup/reclaim/replay/settlement cases are explicit. | Closed at design level. |
| SQL-01: S1 hardened default ACL | The final preflight explicitly accepts/pins S1 owner's existing global PUBLIC function EXECUTE removal and rejects unexpected defaults without normalizing protected state. | Closed at design level. |
| SQL-02: runtime lock matrix | Exact seven-relation ROW EXCLUSIVE order, subject FOR UPDATE, immutable-history reads, request-derived complete advisory sets, staged immediate waits and final S1/MA1 sequence. | Closed at design level. |
| SQL-03: finite teardown | Twenty-nine functions are accounted for; fourteen triggers and table dependencies are removed before immutable/pure helpers; FK-safe table order and RESTRICT are explicit. | Closed at design level. |

No finding above is represented as tested implementation. A changed plan or later code that violates these conditions must be reviewed against its own exact bytes/head.

## 1. SQL and privilege boundary

The finite inventory remains consistent: two new schemas, one new narrow caller role, seven new tables, fourteen explicit guards and twenty-nine functions. The internal fixture postgres role is not assumed to gain schema/function permissions from BYPASSRLS.

The two S1-owned SECURITY DEFINER helpers in the new private schema provide the required bridge without granting postgres or the new caller access to old S1 objects. The installer temporarily grants the S1 owner CREATE only in the new schema for ownership transfer, revokes CREATE in the same transaction, and leaves only intended schema USAGE and helper ownership. Postgres obtains EXECUTE on those new helpers. The narrow caller receives only new API USAGE and the exact execute_v1 function privilege. It receives no helper, private-schema, table, old S1 or MA1 checker/reader grant.

I rechecked the relevant unchanged S1 default/owner/API source: the owner's global function default PUBLIC EXECUTE removal is real, and the corrected final preflight preserves it. Actual installer defaults and eventual-owner defaults are considered separately. Effective new-object ACL checks occur before accepting the candidate; unexpected foreign grants are refused rather than erased.

The fictional LOGIN runner described at the end is confined to native tests. Its grant is only the new caller membership, removed exactly before empty teardown; unexpected memberships remain a refusal. It is not a candidate-created production login or credential.

## 2. Actual consumed dependency graph

The stated **eleven-function closure of the new SQL bridges** matches the unchanged predecessor source. This is a source call graph; it is not a claim that old string-body PL/pgSQL automatically supplies every pg_depend edge.

| Branch | Distinct existing functions |
| --- | --- |
| S1 read | official_v3_intake_api.read_v1(jsonb,text,integer); private binding_valid_v1(jsonb); exact_keys_v1(jsonb,text[]); record_v1(text) |
| S1 shape | private proposal_retainable_v1(jsonb); data_nodes_v1(jsonb,integer,integer,integer); proposal_shape_v1(); shape_matches_v1(jsonb,jsonb,jsonb,jsonb,integer); safe_data_v1(jsonb,integer) |
| MA1 check | official_v3_method_private.require_current_locked_v1(text,integer,text,text,integer); tuple_valid_v1(text,integer,text,text) |

S1 read validates the closed binding/digest/byte length, locks the operations row FOR SHARE and returns the full actual record. Shape, node and safe-data self-recursion adds no extra identity. MA1's actual checker validates the tuple/epoch, locks the actual method head FOR SHARE, samples clock after the wait and refuses mismatched, revoked or expired authority.

The new SQL-standard bodies must create the direct parsed OID edges to their actual consumed old functions. Exact predecessor body/catalog fingerprints protect the reviewed transitive source. The existing fixed MA1 read and S1 capture/reserve/finish transports remain separately protected source/ownership obligations; the eleven-function figure is not a claim that those whole external adapter compositions have only eleven functions.

The mandatory native dependency proof remains precise: empty MA1 history **and clean known fixture reader membership** must reach **2BP01** and preserve the exact catalog. P7506/P7507 is not a substitute. Actual S1 read/shape dependency must be demonstrated; S1 owner shared dependencies are additional protection.

## 3. Locks, staged writes and final authority

All six operations take ROW EXCLUSIVE in the exact order slots, subjects, queue_operations, execution_starts, execution_results, execution_dispositions, catalog_binding. This mode is self-compatible, so the plan does not add a runtime global SHARE/ACCESS EXCLUSIVE mutex. A probe is not falsely declared a READ ONLY transaction while taking these locks.

Every present subject is locked FOR UPDATE. Its capped immutable histories are then read under that serialization; collisions with a different subject return without locking or modifying that foreign subject. New-subject slot allocation uses the subject advisory lock and one free slot FOR UPDATE SKIP LOCKED, with the complete insert/update sequence in the same transaction.

The final advisory matrix derives every token from the already validated request, sorts the actual signed bigint values and deduplicates those values before acquisition. Start can compute its prospective attempt locator from submitted full subject/claim/leased job plus the fixed native tuple, then verifies those constituents against retained state after locking. Read paths need no late attempt/result token because they do not mutate those immutable rows under their subject lock. No row-discovered lower advisory token is added after the sorted set has been acquired.

Global operation/audit/new-cycle/result uniqueness and FK KEY SHARE waits remain accounted for. They occur in the staged write phase before actual S1 reads and last MA1. Immediate constraints/guards and the whole-history assertion complete before that authority check. The planned write order and no deferred cross-subject/S1/MA1 triggers prevent an unlisted application effect after the final gate.

The exact final sequence remains: stage all M04 state/command/audit/index/disposition changes; finish immediate validation/waits; consume sorted actual S1 reads; invoke the real locked MA1 checker; compare fresh database clock to the unchanged deadline and applicable original lease; return the already constructed bounded response; COMMIT. Any failure after staging aborts the **entire transaction**. The authority share lock is retained through COMMIT. No assertion certifies future WAL/transport time from an earlier timestamp.

## 4. Receipt-time arithmetic and unchanged old factory behavior

The actual authority source anchors Held.deadline to the original observation start and applies the post-drain minimum to the same mutable Held. The final design now samples b after actual observation cleanup and after the latest existing Held calculation, computes r=floor(Held.deadline-b), rejects nonpositive r, and sets the candidate database cap to observedAt+r, further bounded by finite approval expiry and prior smaller cap.

Because observation preceded b, this is conservative for a normally advancing database wall clock without assuming a common host/server clock offset. The plan expressly disclaims arbitrary clock jumps as a monotonic guarantee. The original monotonic deadline, abort/drain accounting and late-ack refusal remain independent requirements.

The private joint factory's exclusive same-Held observation/effect admission makes the dispatched cap immutable for the actual effect lifetime. Prior observers must already be terminal; competing same-receipt reproof is refused before observation. It is retained through acquisition, SQL, ACK, cleanup, decode and the final post-drain check. No public inspector, mutable permit or arbitrary callback is exported. The old standalone authority's two-method contract, active-read/receipt limits, overlapping-reproof tests and behavior are preserved explicitly.

The counterexample that previously failed is now a named required fixture: start0 / observation2 / terminal3 / original deadline5 derives r2, rather than a fresh five seconds from observation. Delayed transit cannot expand that cap. This closes the design defect; it is not an executed timing result.

## 5. Original continuation and recovery attemptKey

The unchanged queue source confirms why continuation is necessary: perform calls confirm first, then loads current state, before constructing a new CAS. A blanket unknown block there would strand an otherwise lawful original terminal command.

The final design resolves this with private, closed continuation data. Own PREPARED custody and owned terminal-failure custody are distinct. SQL compares the complete original claim/current fence and the sole unresolved attempt; PREPARED evidence or the valid original winner token/no-PREPARED condition is required as appropriate. Other older unknown work still blocks. A missing terminal command can yield command-ledger not_attempted only after that exact check; this never means execution is absent or a producer may start again.

Authorized execution_read now returns a validated **data-only attemptKey** with full original claim, leased job, result and references. This resolves the previously implicit recovery dataflow without exporting an epoch inspector or reconstructing a start token. Only private result/artifact custody retains it; a changed key or constituent is refused. Exact original live PREPARED may complete; expired/different fence or changed approval epoch may not transfer it. A committed direct-successor continuation remains observation/reconciliation, not a fresh queue effect.

SQL still cannot prove that arbitrary external work terminated. The private known-failure assertion remains confined to reviewed code-owned callback/native ownership and the documented narrow credential trust boundary. The final execution-processing scope now includes delivery and subsequent S1/I1/evidence/history work, so settlement of the delivery promise alone is not treated as termination of the whole execution.

## 6. Teardown and remaining implementation evidence

The final teardown accounts for all functions: 1 API + 6 transaction helpers + 4 assertion/consumption/transition helpers + 1 immutable trigger helper + 14 pure helpers + 3 bridges = 29. Fourteen guards and seven policies are explicitly removed; tables are dropped in FK-safe order before immutable/pure helpers whose table dependencies would otherwise block deletion. All operations are finite named RESTRICT steps in one transaction. Retained history and occupied slots cause refusal after actual rollback locks. No history purge, CASCADE or protected-role/default normalization is introduced.

No further design decision is needed from this reviewer before Root considers the finite Phase-A freeze. The following remain **implementation acceptance requirements already present in the plan**, not newly imposed design blockers:

- Actual candidate/ACL/catalog/parsed-OID/RESTRICT behavior, including clean 2BP01 fixtures and complete atomic rollback.
- Native contention at relation, advisory, row, global unique/FK, S1 and MA1 boundaries, with exact identity and zero staged effects on refusal.
- Real acquisition/query/commit/ACK-loss/drain ownership, latest Held protection and unchanged standalone tests.
- Canonical/full-command/S1 parity, worst-valid wire and call-budget cases, original continuation and quota boundary proofs.
- Mandatory existing Core CI/native discovery and budget, independent exact-head code review and all Root live gates before any later acceptance.

## Authority and activity limits

This review used local source/document reads, exact byte hashing and writes solely to its recovery review artifacts. No source or Git change, runtime/SQL mutation, tests, native/socket execution, network, Hosted/Auth/RLS/ACL/credential operation, real entry source/provider/research, Ready or merge occurred.

All method and Product-Owner gates remain unchanged, including the specifically refused #917 readback. Method approval, #1139 Dev-package release and production/database activation are not outcomes of this review.

**Final recommendation to Root: no open design blocker in this specialist scope for the exact four-file delivery above. Root may combine this with the independent runtime review and decide the finite design freeze. STOP.**
