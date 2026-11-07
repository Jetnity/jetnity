# Atomic Version Refresh 1 — TL amendment R1: exact support and transaction phases

Date: 2026-11-07. Issue #1152 / Draft #1153.
Baseline TASK V1 blob `b2a3fdb6c1f79cb187b22a7cc9d1a890b8d067d7`, published seed `4229e2b52cd0a4961dbf10dbb8b8885bb6458026`.
Root-owned binding clarification before implementation review. Same author/session; no additional source, role, hosted or activation scope. TASK V1 remains immutable.

## 1. Ordered supports

“Exact same ordered support bindings” means exact same semantic support positions and admitted source/content-item/representation/profile identities, canonical URLs/media/protocol and unchanged source/raw-original content/digests. It does **not** require equality of the old and new `versionId`. The new execution must provide genuinely later observations and new evidence/version/receipt/review identities. Every old and every new version ID still must match its own complete receipt, ordered review and exact retained body. Reject partial mixtures, duplicate supports or reordered semantic slots.

## 2. Atomic phases and witness provenance

Preserve existing provenance-publication locks before the original lifecycle head lock; all provisional publication remains inside the one owned READ COMMITTED transaction.

1. After the head UPDATE lock is actually obtained, validate the original externally supplied witness against the actual unchanged head, full accepted-corpus lookup and exact unique expected predecessor. Fully re-prove Old and the new separately reviewed same-content/same-fact candidate. A foreign change, stale witness or lost validity refuses and rolls back provisional publication.
2. The wrapper's own successful bind appends its own `accepted(New)` event. While this same transaction holds the head lock, Old and New temporarily both exist internally. That is not an externally committed state and is not a reason to weaken lookup semantics.
3. Immediately before supersession, fully re-prove Old including all actual source/freshness/retention/date/currentness bounds under the held head lock. Use only the exact internal witness resulting from this wrapper's own verified event. Do not rerun an impossible unique-Old selection after creating the temporary second version, and do not require the pre-bind external sequence to equal the post-bind sequence.
4. Supersede exactly Old using that own-derived witness, then run the complete final lookup using the exactly resulting next witness. Require unique New and all currentness/identity invariants before COMMIT.
5. Positive completion still requires acknowledged COMMIT, closed producer and a new independent unchanged #1151 canonical reader through its final bounds.

An internal witness may advance only through the wrapper's own validated ordered events. Reading the current DB cursor to forgive a foreign conflict, wait, restore or stale external authority remains forbidden. An event receipt is audit, never an independent authority grant. Preserve the original chain, limits, locked interval and all negative cases.

## 3. Capability stays narrow

The new refresh role receives only the new paired wrapper's EXECUTE capability. Do not recreate broad authority through a test/production login that inherits standalone original producer plus lifecycle privileges. The wrapper may delegate the unchanged existing typed `publish_local_integrated_v2` operation and existing protected bind/lifecycle helpers; it does not copy their implementation or expose arbitrary operations. Existing typed PG parameter encoders may encode the wrapper request. No generic query/client proxy or injected successful proof.

The SQL wrapper itself must restrict the exact supported synthetic cell/fact/definition/source/profile/Primary-or-Composed binding; TypeScript checking alone does not prove the directly callable SQL grant is narrow.

## 4. Review disposition

Independent finite TASK review identified these phase/identity ambiguities, not a new permission to weaken the contract. Every TASK V1 acceptance criterion, frozen file, reserved gate and stale-predecessor refusal remains binding. Root will review actual code, direct SQL calls and native concurrency/rollback evidence. This amendment is no implementation PASS.
