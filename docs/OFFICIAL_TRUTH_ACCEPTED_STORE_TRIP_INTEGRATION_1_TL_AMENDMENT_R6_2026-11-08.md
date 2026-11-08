# Official Truth Accepted Store Trip Integration 1 — TL amendment R6

Date: 2026-11-08. Work #1155 / Draft #1156.
Decision owner: ChatGPT / Technical Lead.
Same author: **Jetnity Official Truth Accepted Store Trip Integration 1 — Codex Generation 1**.
Same session: `/root/accepted_store_trip_integration_writer`.
Reviewed remote head: `f8017c63ddf5c2f5f93bc53cc3b406a35d7acc5d`.
Immutable main baseline: `e1fe0c696ade9f39b417772b5c065f87530204d6`.

TASK V1, design/addendum and R1–R5 remain frozen. This precise engineering amendment resolves independently identified installer dependencies and candidate-local helper ACLs. It grants no implementation PASS, Ready, merge, hosted action or Product-Owner exception.

## 1. Evidence and disposition

Actual [CI 42449017089](https://github.com/Jetnity/jetnity/actions/runs/42449017089), Core job 128634031447, passed typecheck/lint and reported 8200 tests, 8197 pass, one failure, zero cancellations and two existing skips. The new native proof still stopped at schema setup: PostgreSQL 42501, permission denied to create role, zero completed families. Exact CHANGES REQUIRED: https://github.com/Jetnity/jetnity/pull/1156#issuecomment-6717596052.

Root read the exact installer, original source references and candidate call graph. The separate release reviewer checked all 81 original source pins. The same author independently confirmed the findings before broader edits.

Installer baseline `native-schema.ts`: Git blob `74de317f98623d8eaec9734bb5872a2842c3ce1b`.
Candidate baseline `accepted-store-candidate.sql`: Git blob `09ae1e6013985e6fb665c7f8dd8bf66377ebdcd6`, SHA-256 `41e68fea4da2a9af56c037bc1048849d0ab4daaaefd53cc1fdae39d63793a3c1`.

## 2. Exact disposable installation capability

Within this package's native installer only, extend R5 section 3 as follows:

- Keep all original migration bytes, order and object ownership unchanged. The only original role-creating migration in the loaded Trip/Evidence set is `20261011111839_official_truth_original_custody_lifecycle_1.sql`, pinned blob `36b525580509069039ca6787c25a0a5b94155986`.
- Immediately around that one migration only, the owned cluster bootstrap connection may temporarily set the synthetic `postgres` role to CREATEROLE. Beforeward assert its expected runtime attributes and absence of memberships. It remains NOSUPERUSER, NOLOGIN and NOINHERIT throughout; preserve its already declared synthetic BYPASSRLS and all other attributes.
- Run the entire unchanged original migration with SET ROLE postgres, preserving its original transaction. Its exact four created roles are `ot_original_producer`, `ot_original_reviewer`, `ot_original_reader`, and `ot_original_lifecycle`.
- In a finally path using the actual owned bootstrap principal, restore NOCREATEROLE and remove only any automatically created memberships in those four roles FROM postgres, conditionally when their roles exist. Do not change any pre-existing membership or application-role grant. Then assert the expected role attributes and no remaining postgres membership.
- The existing outer R5 database-CREATE cleanup must run even if this inner installation or role cleanup fails. Preserve every original and cleanup failure, using AggregateError for multiple failures. No failed cleanup may be swallowed or treated as a successful fixture.
- Install the missing `pgcrypto` extension in the already owned `extensions` schema alongside `pg_trgm`, using the owned bootstrap connection. The pinned Protocol2 migration calls `extensions.digest`; pinned original custody calls `extensions.pgp_sym_encrypt_bytea` and `extensions.pgp_sym_decrypt_bytea`. This establishes the declared original fixture prerequisite, without claiming these legacy custody functions have been exercised by the new AES path.

PostgreSQL 16 documents an automatic ADMIN membership when a non-superuser CREATEROLE principal creates a role, and removal of that automatic grant by a superuser. Merely restoring NOCREATEROLE would leave that grant behind. Primary source: https://www.postgresql.org/docs/16/role-attributes.html.

No SUPERUSER grant to postgres, permanent CREATEROLE, new runtime membership, modified old migration, product RPC privilege shortcut or hosted operation is authorized. The fixture remains synthetic; it proves no managed-target installation or ACL state.

## 3. Exact new helper permissions for the already approved bridges

The candidate's final ownership loop moves ordinary private helpers to `ot_accepted_trip_exec` and revokes PUBLIC execute. The approved postgres-owned SECURITY DEFINER bridges run with postgres NOSUPERUSER/NOINHERIT, so schema ownership does not supply EXECUTE on these differently owned functions.

Permit only an explicit candidate-local EXECUTE grant to postgres on this finite complete invoker-helper set:

1. `official_accepted_trip_private.require_v1(boolean)`
2. `official_accepted_trip_private.object_v1(jsonb,text[])`
3. `official_accepted_trip_private.hash_v1(jsonb)`
4. `official_accepted_trip_private.scope_columns_v1(jsonb)`
5. `official_accepted_trip_private.accept_binding_v1(jsonb,official_accepted_trip_private.admissions)`

Exact call graph: lock_legacy uses require; own_graph uses require/hash; publish_legacy uses scope_columns/accept_binding/object/require; accept_binding uses object/require and object uses require. These helpers validate or transform supplied values and do not themselves confer live authority or perform table writes. The separate read_archive bridge requires no new helper grant.

Keep all five as ordinary invoker functions owned by the new executor, with the existing empty search_path. Preserve the four postgres bridge owners, old provenance bridge owner, all old function/table ACLs, RLS, Auth/Owner/session guards, and the six exact public RPC grants. No new SECURITY DEFINER wrapper, wildcard grant, executor-role membership, service/Auth private access or broad privilege workaround.

The native proof must assert this exact privilege set for postgres, preserve denied private function/table access for application roles, and actually run the approved bridges through positive and negative producer/reader paths. Source analysis alone is not runtime acceptance.

## 4. Atomic gate diagnosis and unchanged acceptance

The independent four-run diagnosis is retained as SHA-256 `e8ac62449047e76b883800848f1230cb82310e751dee1e5bdff8722678407425`. Root inspected the current full log and comparison.

The existing Atomic job 128634031633 on f8017c63 completes all 152 markers at 561240ms, with 338760ms parent reserve, 9354/9354 settled operations, zero pending, 248/248 connections closed and 11 stopped clusters. The earlier docs-only and 94b6 runs remain genuine 900-second cancellations. Identical SQL invocation counts and the ordered scenario prefix are observed; median comparable timings were 2.215x and 1.941x main in those runs, while f8017 is 0.966x. The latter two implementation runs have identical measured corpus sizes. Exact host cause is unproved.

Decision: preserve the explicit R8/R9 900-second parent, 20-minute job, all old native code, cases and runtime deadlines. No timeout, workflow, reference-corpus or performance rewrite is authorized. Record runtime variability as an operational P2; complete final-head and actual-main gates remain mandatory.

The same author continues the coherent R5 Traveller/retained-draft display, strict SDK/body/key ownership, complete native integrity/wait/disposal/recovery and actual mounted browser tranche. Every new head invalidates old exact-head gates. Root alone may issue independent PASS, Ready or merge after complete review and all actual gates; actual-main CI and Production/domain verification follow any regular merge.

All #917/#1131/#985 and hosted/source/Owner/key/retention/privacy/ownerMac/activation/launch holds remain unchanged. No refused-action retry, hosted SQL, real-source activation, paid call or automatic following slice.
