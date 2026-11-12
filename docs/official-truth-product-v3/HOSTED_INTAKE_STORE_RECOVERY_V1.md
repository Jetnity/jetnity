# HS1 V1 — unused-only recovery contract

Status: **SOURCE PREPARED / NOT_RUN / UNAPPLIED**. Logical author: **Jetnity Official Truth V3 Hosted Intake Store 1 — Codex Generation1**, session `/root/hosted_intake_writer_g1`. Root is the sole reviewer/Ready/merge authority. This document is part of the eight-path source package against parent `dfd692440762b50183fdebbfd6bf8dabde4662d0`.

## Scope and prerequisite evidence

This is removal of a positively identified, exact, unused HS1 installation. It is not the old disposable S1 rollback. Neither acknowledgement settings nor a matching name establish that the target is safe to remove.

Before selecting execution, Root must independently persist the exact target/project/database identity, the current new-object OID inventory below, the exact installed source/package identity, absence of consumers, and a controlled quiescence arrangement that lasts through confirmed COMMIT. The reviewer must assess callers, producers, in-flight work and external consumers; SQL cannot discover every external consumer. Missing or uncertain evidence is a stop. No new PO approval is requested by this document; these are evidence and platform gates.

The current recovery source SHA256 is `539d6014fbe75129fa528f7214e69658f0fc0ff9ad7c8879efaf18f183ebcdf8`; the installation source is `7197138e3d2be969cbc0b5c76f89143b9268035287aa84647b2a9747c7c6ecd9`. The manifest contains byte sizes and Git blob pins. Runtime/native verification is pending. Actual Dev receipts in TASK V1 are prerequisite observations, not execution of these files and not all remaining Dev rows completed.

## Supported OID readback, restricted to the new package

The following catalog-only statement describes the database identity plus the two new roles and the finite new scope: schemas, tables/indexes/automatic TOAST relations, row/array types, all fourteen functions, constraints, triggers, owner policies and two column defaults. It reads no custody payload, Auth object, provider credential or legacy history. Its result must be independently witnessed and persisted by Root while the exact package is known. Query acknowledgement or copy/pasting its JSON into a GUC does not establish the external no-consumer/quiescence proof.

```sql
WITH scope_schemas AS (
  SELECT n.oid,n.nspname FROM pg_catalog.pg_namespace n
  WHERE n.nspname IN ('official_v3_intake_private','official_v3_intake_api')
), scope_tables AS (
  SELECT c.oid,c.reltoastrelid FROM pg_catalog.pg_class c JOIN scope_schemas n ON n.oid=c.relnamespace WHERE c.relkind='r'
), scope_classes AS (
  SELECT c.oid FROM pg_catalog.pg_class c JOIN scope_schemas n ON n.oid=c.relnamespace
  UNION SELECT t.reltoastrelid FROM scope_tables t WHERE t.reltoastrelid<>0
  UNION SELECT i.indexrelid FROM pg_catalog.pg_index i JOIN scope_tables t ON i.indrelid=t.reltoastrelid WHERE t.reltoastrelid<>0
), scope_objects AS (
  SELECT 'pg_catalog.pg_namespace'::pg_catalog.regclass::oid AS classid,n.oid AS objid FROM scope_schemas n
  UNION SELECT 'pg_catalog.pg_class'::pg_catalog.regclass,c.oid FROM scope_classes c
  UNION SELECT 'pg_catalog.pg_type'::pg_catalog.regclass,t.oid FROM pg_catalog.pg_type t JOIN scope_schemas n ON n.oid=t.typnamespace
  UNION SELECT 'pg_catalog.pg_proc'::pg_catalog.regclass,p.oid FROM pg_catalog.pg_proc p JOIN scope_schemas n ON n.oid=p.pronamespace
  UNION SELECT 'pg_catalog.pg_constraint'::pg_catalog.regclass,c.oid FROM pg_catalog.pg_constraint c JOIN scope_tables t ON t.oid=c.conrelid
  UNION SELECT 'pg_catalog.pg_trigger'::pg_catalog.regclass,g.oid FROM pg_catalog.pg_trigger g JOIN scope_tables t ON t.oid=g.tgrelid
  UNION SELECT 'pg_catalog.pg_policy'::pg_catalog.regclass,p.oid FROM pg_catalog.pg_policy p JOIN scope_tables t ON t.oid=p.polrelid
  UNION SELECT 'pg_catalog.pg_attrdef'::pg_catalog.regclass,d.oid FROM pg_catalog.pg_attrdef d JOIN scope_tables t ON t.oid=d.adrelid
)
SELECT pg_catalog.jsonb_build_object(
  'package','HS1-v1',
  'database',pg_catalog.jsonb_build_object('name',d.datname,'oid',d.oid),
  'roles',(SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('name',r.rolname,'oid',r.oid) ORDER BY r.rolname)
    FROM pg_catalog.pg_roles r WHERE r.rolname IN ('ot_v3_intake_owner','ot_v3_intake_caller')),
  'objects',(SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('catalog',o.classid::pg_catalog.regclass::text,
      'identity',pg_catalog.pg_describe_object(o.classid,o.objid,0),'oid',o.objid) ORDER BY o.classid,o.objid)
    FROM scope_objects o)
) AS hs1_identity
FROM pg_catalog.pg_database d WHERE d.datname=current_database();
```

The recovery requires the exact witnessed JSON value in `jetnity.hs1_recovery_identity`, and `jetnity.hs1_recovery_context` equal to `root_independent_identity_no_consumers_controlled_quiescence_v1`. The script compares the supplied JSON with current catalog OIDs before mutation. Wrong database or object identities, stale reinstall OIDs, added in-scope objects and missing context refuse. Do not discover an unfamiliar package and acknowledge its current state as if that were independent validation.

## Atomic removal and history protection

The script opens its own explicit transaction and immediately selects **READ COMMITTED**, before any query. This overrides an inherited repeatable-read default for that transaction only. Bounded statement/lock/idle-transaction settings and the same private advisory lock `(771103,1)` are active. Root must use a fresh, correctly scoped actual LOGIN postgres session and avoid wrapping this script in an already-started transaction.

The actual installer must still be the database-owning, CREATEROLE, NOSUPERUSER postgres on PostgreSQL17, with empty createrole_self_grant and bootstrap superuser OID10. The two HS1 roles must have their exact restricted attributes and exactly their bootstrap-issued ADMIN/NOINHERIT/NOSET memberships. Existing managed attributes, configuration and outgoing platform memberships are never changed.

Recovery validates every original function identity/property/full body, all three tables and their columns/constraints/indexes, FORCE RLS owner policies, immutable and intrinsic FK triggers, finite ACLs, baseline row/array type privileges, package comments, role/default state and dependency boundaries. Existing `official_v3_method_private` / `official_v3_method_api` plus the exact `ot_v3_method_reader` name are not treated as an HS1 consumer merely by their presence. The unrelated `ot_v3_method_caller` name is not exempt. All other new V3 names remain refused, and Root's external consumer review is still mandatory.

A creator-issued temporary owner membership is ADMIN false, INHERIT false, SET true, with the actual postgres as both member and grantor. The independent bootstrap ADMIN-only edge is retained. After verifying the two grantor-distinct owner rows, recovery switches to the isolated owner and acquires ACCESS EXCLUSIVE locks on operations, reservations and completions in that fixed order. These locks remain held through COMMIT. The subsequent READ COMMITTED emptiness read sees writers committed before those locks are obtained. A queued writer cannot enter after the emptiness read while the locks remain held.

**Any original, reservation, completion or stored history means P7314 and no removal.** Reservations/completions necessarily have original/FK ancestors; separate native stages cover each valid history category without manufacturing orphan rows or deleting previous history.

Only the finite original functions, immutable triggers, three tables, two schemas and two roles are dropped, using RESTRICT and ordinary DROP ROLE. Automatic children already bound to those exact objects follow their parent removals. There is no CASCADE, DROP OWNED, TRUNCATE, history deletion, global default-ACL edit, managed-role edit or persistent owner credential. Before dropping the roles, the script returns to postgres, revokes only its own temporary grant using GRANTED BY postgres RESTRICT and verifies bootstrap-only state again. Foreign dependencies or any late failure roll the entire transaction back.

## Outcomes and uncertain COMMIT

A confirmed successful COMMIT still requires an independent supported readback of only the new package names/OIDs, plus preservation evidence for the previously witnessed unrelated objects. Absence must not be inferred from an application error or a connection close.

If COMMIT acknowledgement is uncertain, stop. Do not replay installation or recovery. Root selects a separate supported readback limited to this new allowed scope and compares it with the pre-action OID record. The database may be fully installed, fully removed, or otherwise unfamiliar; an unfamiliar result requires investigation. This does not authorize the denied #917 readback, its rerouting or any #1131 action.

If the package has ever been used, keep its history and prepare a separately reviewed forward repair. Neither this script nor the old disposable rollback is an after-use cleanup path. MA1, PG1, other S1/M04 and legacy histories are outside the removable scope.

## Authored native coverage, still NOT_RUN

The native source executes actual HS1 bytes through a real LOGIN NOSUPER postgres in an owned Unix-socket PG17 cluster. It exercises exact unused recovery, stale OIDs, missing context, foreign object/grant/default/owner dependency, function drift, a foreign view, M04 presence, the R1 exact-reader/caller distinction, nonempty history and real lock contention. R2 explicitly starts from inherited REPEATABLE READ, executes the complete recovery prefix before table locks, reads the selected READ COMMITTED isolation, commits an allowed capture on a separate owned connection and continues the unchanged suffix. P7314, exact retained original bytes, complete history counts, OIDs and unrelated catalog preservation are required after rollback.

The original S1 semantic coverage also remains: full retained shapes, before-insert data refusal, exact bytes, collision handling, concurrency, expiry/generations, all I1 outcomes/archive, finish validation, lost ACK, precommit and lease-lapse rollback, cancellation/drain and process interruption/reconnect. All operations, connections and children are owned by the existing lifetime infrastructure. Budgets remain 150000ms effects, 35000ms owned drain and 210000ms wrapper. No execution occurred during source preparation.

## Review history

- TASK V1: https://github.com/Jetnity/jetnity/issues/1139#issuecomment-6822245339
- R1 / HS1-RECOVERY-01 / P2: https://github.com/Jetnity/jetnity/issues/1139#issuecomment-6822676157 — corrected only the wrong MA1 role exception; added the exact known-reader/unrelated-caller distinction.
- R2 / HS1-RECOVERY-02 / P1: https://github.com/Jetnity/jetnity/issues/1139#issuecomment-6822764045 — explicit READ COMMITTED before queries; meaningful inherited-repeatable-read late-writer source proof.

Those findings are source fixes awaiting full independent review and runtime gates. They are not proof of a hosted installation or public CH→DE activation.


---

## Current review fix HS1/HM04-FIX1 — 12 November 2026

New replacement session /root/hs1_hm04_fix under the Product Owner’s permanent approval for unreachable original sessions; this is not the original HS1 Generation1 or HM04 Generation4 session.

Sole source parent: a686e608f597ffa82d44fc9d3992b9b566b89688; parent tree: b4f54fad7d9981f8b7676b42b271bf6740a17f48; 9538 leaves. Earlier author/session and NOT_RUN paragraphs above are dated historical evidence.

Recovery changes only the same two CASE parentheses as installation; READ COMMITTED selection, exact identity, locks, no-consumer/quiescence checks, used-history refusal and all RESTRICT teardown statements remain exact.

SOURCE ONLY / NOT_RUN / UNAPPLIED. No project/parser/compiler/SQL/native/test/build/APT/CI or hosted execution, source GET, ref/PR publication, Ready or merge. Root alone reviews and selects a coherent integration and new complete gates; #917’s denied action and #1131 remain untouched.


## HS1/HM04 FIX2 — SQL alias binding (source only)

Continuation of the documented replacement session `/root/hs1_hm04_fix`; selected by [Root comment6830207449](https://github.com/Jetnity/jetnity/pull/1196#issuecomment-6830207449) on immutable parent `e932aa20d6f2f834c13e3541c5eb25b13deef6d1`.

The `hs1_function_pins` SQL alias `p` and the `hs1_structure` SQL aliases `c`/`a` collided with declared PL/pgSQL records. Only those query aliases and their qualified references now use `function_inventory`, `class_inventory`, and `attribute_inventory`; installer and recovery retain every predicate, expected value and all 14 original runtime function bodies. HS1 Native is unchanged.

CI4140 on the parent exposed `42702`; this candidate has not been executed. Current pins and inverse mappings are in the package manifest; earlier task/evidence text remains historical. Root must integrate COMPOSED/HDP pins and independently run the complete new-head gates before Dev installation. Unused-only recovery, #917 and #1131 boundaries remain unchanged.

## PG17.12 column metadata correction — SOURCE ONLY

CI4148 on a4731c2fbbddccab15c641dd8154426d59c68121 identified C0109: the engine's new internal pg_attver option, not a user ACL or runtime failure. Only NULL or, on PG17.12+, one one-dimensional, lower-bound-1 pg_attver value in canonical uint64 decimal form is admitted; all user options remain forbidden. PG17's default attstattarget is explicitly NULL. No engine safety setting changes.

The selected correction preserves original S1/MA1 execution bodies and all proof groups/budgets. Four real ALTER-column negatives are added inside existing HS1 installer/recovery groups; temporary diagnostics are removed. This source has not been executed, installed or accepted as a runtime pass.

Unused recovery retains exact OIDs, original catalog/role/ACL checks and history refusal. The same finite engine-option predicate applies on recovery; HM04's recorded catalog fingerprints continue to compare the entire actual attribute metadata, including pg_attver, so post-install metadata changes are not silently recaptured. n_distinct and explicit statistics-target drift must still refuse before removal.
