# Hosted Result Store 1 — contract

**SOURCE_ONLY / NOT_RUN / UNAPPLIED.** This package supplies durable CH→DE visa result ports; it does not activate production or approve an official source.

## Source and method authority

The binding fixes one CH-passport/DE direct-entry visa context, method and package digests, selected original sources and qualification/extractor digests, a legal time zone, real validity bounds and bounded freshness/monitor settings. A serialized record is never source authority. Evidence uses the private two-stage inspect/finalize custody of actual originals and rebuilds the real I1 decision at its advancing clock; observed facts and genuine no-fact ambiguities remain distinct. Counter ambiguity matches the actual three-field representation reference and exact attempted/qualified time while the complete selected source identity remains validated.

The production issuer selector remains explicitly closed in this source package. Synthetic fixtures are owned by the Native test and use only new `.example` originals. Root's separately reviewed real AA/Bern issuer and activation composition are required for production.

Method authority comes only from the original private MA1 receipt and actual locked approved epoch. The new HRS factory shares that receipt's existing deadline, ownership and admission state. It returns no epoch getter or connection. MA1's optional third and S1's optional fourth budget parameter carry the minimum original absolute deadline, effect cap and existing receipt cap; no call restarts a deadline.

## Database boundary

The real restricted Creator installs after PAI/PG1/HMA1/HS1/HMT and before HM04. HRS creates four previously absent roles: NOLOGIN ResultOwner and three NOINHERIT LOGINs (writer, reader, verifier), each LOGIN with connection limit 2. There is no role adoption. Only those three LOGINs receive explicit CONNECT; inherited PUBLIC ACL is preserved. Schema/default/role/object/ACL/dependency inventories are exact, with 55 functions, 12 tables, 17 indexes, 52 constraints, 24 immutable triggers and 12 owner policies; tables use FORCE RLS. PG17 internal `pg_attver` is accepted only in its exact validated reserved form; user column options and explicit statistics drift still refuse.

| Caller | Allowed fixed API |
| --- | --- |
| Verifier | attest_v1 only |
| Writer | execute_v1 and required private read_v1 operations |
| Reader | read_v1 coverage, projection, projection_current, projection_batch only |

The three SQL APIs have ten typed parameters: command, binding hash, method ID/revision/digest, package digest, actual epoch, remaining milliseconds, absolute not-after and legal day. Command shape, operation, size and channel are finite; callers cannot select SQL, roles or targets. The parsed MA1 bridge is Creator-owned; the sole parsed S1 bridge is IntakeOwner-owned. Both expose only their fixed existing operation to ResultOwner. HRS grants no direct MA1 or S1 table access.

The twelve private tables store binding, originals, extractions, qualifications, decisions, archive pages, versions, projections, heads, operations, outbox and monitor schedule. Original records and history are immutable. Full current metadata is bound, including both directions of dependency and exact ownership. HM04 A3 adds only the validated HRS-to-S1 bridge incidence and its original HRS catalog fingerprint; the standalone topology remains valid only when HRS is completely absent.

## Atomic effects and current reads

Every mutating call owns a READ COMMITTED transaction, deterministic operation/head locks and the actual completed S1 lock. It checks complete matching original binding/digest/bytes/outcome/audit and all linked history. Current head, suppression, method epoch, source expiry, legal day and shrinking deadline are rechecked after waits and before actual COMMIT. Publication atomically records projection, coverage, operation and audit; escalation records sticky evidence, suppression and a deduplicated local outbox without sending a message. A failed late write rolls the entire call back.

An acknowledged result requires an actual COMMIT acknowledgement. Lost acknowledgement yields unconfirmed; operation confirmation cannot turn historical success into current authority after expiry, revoke or head change. The executor-only `blocked_remote_unknown` means local children have joined but remote completion is unproved. It remains unavailable/unconfirmed publicly, poisons its physical pair and permanently blocks the new factory without reconnect or replay; it is not a successful terminal or domain reply.

Public reads check one committed current snapshot; normal expiry or suppression is a miss, while errors/unconfirmed calls are unavailable. The original public business deadline remains 750 ms; the implementation makes no measured latency or arbitrary-network terminal-completion claim. Root must measure total latency including real drain.

## Automatic update and recovery

Monitor claim/finish records use actual generations, leases, finite intervals and replay checks. An unchanged source never renews its original retrieval or expiry. `source_changed` requires genuine primary observed custody, the same valid fingerprint protocol and different bytes; it suppresses the old projection while retaining coverage and history, then enqueues ordinary Research. A protocol mismatch or unchanged hash cannot authorize it. No clear original is relabelled as conflict.

Before any accepted version exists, a separately marked initialResearch claim reproves the actual same missing head and generation, then enqueues the same existing canonical M04 rule job with bounded attempts. No fake version, second queue or listing is introduced. The fixed worker selects only the code-owned canonical rule/discovery key and performs the ordinary claim.

Recovery requires independently supplied original identity and controlled quiescence. Pure catalog and exact identity checks precede one temporary Creator-to-ResultOwner SET edge. Used history refuses with P7807 before live HM04 dependency P7808 and active caller P7809. After lifecycle/runtime and table locks, all checks repeat; removal is finite RESTRICT only. It removes exactly the HRS package and its three original explicit CONNECT grants while preserving predecessor metadata. Reverse order is HM04, HRS, HMT, HS1, HMA1; PG1/PAI remain.
