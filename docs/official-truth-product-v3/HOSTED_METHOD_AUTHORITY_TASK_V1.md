# Hosted Method Authority 1 — persisted Root TASK V1

Source: https://github.com/Jetnity/jetnity/issues/1139#issuecomment-6816388805

Retrieved task text below is preserved without alteration. The original source-only stack parent remains authoritative for this candidate; Root alone binds the final accepted PG1 before publication.

---

## V3-HOSTED-METHOD-AUTHORITY-1 — TASK V1 / source-only implementation

Root selects this necessary bounded CH→DE prerequisite under the existing PO authorization, target15November. Current main dfd692440762b50183fdebbfd6bf8dabde4662d0 is accepted; operating mode just reread NORMAL. This task addresses the first hosted-role incompatibility, MA1 only. S1/M04 hosted ownership remains a later separately selected task; do not expand into it.

### Actual reason and evidence

Actual Dev receipts https://github.com/Jetnity/jetnity/issues/1139#issuecomment-6816048537 and https://github.com/Jetnity/jetnity/issues/1139#issuecomment-6816258415:
develop/yfvbxvijcorffwxbxahl under parentqscbgcdmivbbnzrcyegn; session/currentpostgresOID16388, NOSUPERUSER/BYPASSRLS/LOGIN/INHERIT/CREATEDB/CREATEROLE/REPLICATION, no incoming and10outgoing membership edges; roleconfig1/dbrolesetting1. PostgreSQL170006, existing empty createrole_self_grant, bootstrapOID10supabase_adminSUPERUSER, databasepostgresOID5ownerpostgres with CREATE and CREATE WITH GRANT OPTION. No new role was created by those SELECTs.

Root independently read MA1 source6af3e5a76d1eaa4343ee0b1fb812454cce9f7f3e, its creator/final membership checks and M04/S1 owner dependencies, and reconciled independent /root/ch_de_method_readiness architecture assessment. PostgreSQL17 documents that non-superuser CREATEROLE automatically produces an ADMIN-true/SET-false/INHERIT-false edge from the new role to the creator, granted by bootstrapOID10. The original MA1 script's two zero-membership checks would reject that necessary edge. Primary source: https://www.postgresql.org/docs/17/role-attributes.html. Do not alter postgres or delete that platform-generated edge to imitate the old superuser fixture.

### Author, scope and dependency

Exact new author: **Jetnity Official Truth V3 Hosted Method Authority 1 — Codex Generation1**; actual requested new session /root/hosted_method_authority_writer_g1. Root alone may publish, Ready or merge. No Cursor UI/session claim.

Exactly eight NEW paths:
- scripts/db/official-truth-v3-hosted-method-authority-1/install-candidate.sql
- scripts/db/official-truth-v3-hosted-method-authority-1/recovery-candidate.sql
- scripts/db/official-truth-v3-hosted-method-authority-1/native.ts
- lib/readiness/official-truth-v3-hosted-method-authority-1.test.ts
- docs/official-truth-product-v3/HOSTED_METHOD_AUTHORITY_TASK_V1.md
- docs/official-truth-product-v3/HOSTED_METHOD_AUTHORITY_HANDOFF_V1.md
- docs/official-truth-product-v3/HOSTED_METHOD_AUTHORITY_MANIFEST_V1.json
- docs/official-truth-product-v3/HOSTED_METHOD_AUTHORITY_RECOVERY_V1.md

Prepare a stacked immutable source-only candidate with soleparent PG1candidate28ee04afcd74123cea8803f67d379184353e231d/tree8e60897fd154ef410752c392f0e657f21e62352e. Exactly eight additions relative to that tree; every existing leaf remains identical. PG1 code source is independently reviewed but its current Handoff has a pending docs-only correction and no CI/runtime acceptance. Stacking source preparation grants no acceptance/publication; Root must incorporate the final accepted PG1 base before any HMA1 CI/PR. Do not modify PG1 or any old source.

Reuse exact PG1 install9a8144e27405f93b9c0e5d003923efe8883bb4b4/SHA3e21495ff40f66337b004fadc98599cd336c19c31bb4f6e4f9013c2c01f02bd2 as native prerequisite. Never load the old full #1142 public-capability installer. Existing MA1/S1/M04/native/rollback/workflow/package files remain unchanged.

### Hosted MA1 installation contract

Deliver one explicit BEGIN/COMMIT unapplied artifact for the new MA1 namespaces, tables/functions and ot_v3_method_reader. Preserve ALL original MA1 runtime function declarations and bodies, signatures, return types, security/configuration, tables/constraints/indexes/triggers/RLS/owner policies and ordinary final privileges byte-exact wherever not part of the explicitly described creator boundary. In particular preserve current Owner/AAL2/session checking, method history, epoch/expiry/CAS/operation semantics and bodies require_current_locked7e98f2a32a2388efde95d729d425581bf9443e4397eb8311d82e6a46eb88ca8c and tuple_valid15741698f4f66adb08e23694b15c6bb9d071b8c01e1123ba7087c4c3d50c6662.

Allowed changes are explicit new prerequisite/creator guards, exactly the two membership assumptions, package-identifying metadata and documented installation/recovery checks. Enumerate every changed span against full original MA1. No regex-based broad rewriting at apply time, general dispatcher or new runtime authority surface.

Require real session/current creator postgres under PostgreSQL17/UTF8, NOSUPERUSER/BYPASSRLS/CREATEROLE and the documented empty createrole_self_grant. Do not treat current postgres as NOLOGIN/NOINHERIT or forbid its unrelated existing outgoing edges/configuration. Do not read secret configurations or change managed roles, Auth rows/rights/helpers, existing memberships or global defaults. Reject unexpected incoming authority to postgres and direct anon/authenticated/service_role SET/INHERIT reachability.

Before any mutation, verify the independently installed NEW PG1 namespace/two exact complete guards, owners/configuration/ACLs, both body hashes1bf7498146d4827371087a926327db1348ce2a4cc55693427ee154eb81082354 and ba3667edd483f0a0abcf53f70f4dc71906f0ffdbc192ee569232c78dd359635b. No legacy public-capability/Pilot/Grant/history query. Reject all destination collisions; never adopt IF NOT EXISTS objects.

For newly created ot_v3_method_reader accept ONLY its exact PostgreSQL17 automatic edge: roleid=new readerOID, member=current postgresOID, grantor=bootstrapOID10 with that role SUPERUSER, admin_option=true, inherit_option=false, set_option=false. Exactly one such incident edge, zero outgoing reader edges or additional grants. Bound the new reader's complete restricted attributes, absent settings/defaults and expected owner-only/private object ACLs. Do not turn this into a broad exception for postgres or arbitrary admin edges. Role-name/OID resolution must bind actual principals, not assume fixture OIDs16388 or synthetic names.

This module needs no runtime-owner transfer: MA1 remains postgres-owned and the new reader owns no objects. Do not grant postgres a new SET/INHERIT edge merely to reproduce a superuser fixture. Retain rejection of unexpected creator ACLs before removing only documented baseline PUBLIC EXECUTE; do not normalize foreign grants. Final bounded inventory validates the whole authorized MA1 structure and exact new role graph.

### Recovery

Author a NEW recovery; existing disposable-only MA1 rollback2b6f0e0007fb03587347ac56ae9c8d5f374642cb remains untouched and unused. Before commit the install is atomic. After uncertain commit STOP for separately reviewed readback of ONLY these new objects, never blind retry.

Pre-use removal may act only with exact package/object/body/owner/ACL/new-role identity, truly empty NEW MA1 revision/head/operation history, no consumers and Root's separately verified exact-target/current-inventory/quiescence evidence. Reject if M04/known new consumers have appeared; pg_depend/DROP RESTRICT or acknowledgment GUCs alone cannot prove absence of textual PL/pgSQL consumers. No CASCADE, drop of PG1/platform/foreign objects, role-membership cleanup of unrelated rows, or normalization of drift. DROP ROLE must be ordinary permitted removal of this exact unused new reader; do not revoke the bootstrap grant as a workaround.

After any method history/use, preserve it. Recovery must refuse and the plan must use existing supported method revocation or a later independently reviewed forward repair. Do not invent signed-owner authority or an operational kill-switch not implemented.

### Focused native proof — author source, do not execute

Use the existing disposable PostgreSQL and OwnedTestLifetime infrastructure. Install through an actual non-superuser LOGIN postgres connection with CREATEROLE and hosted-relevant attributes; bootstrap superuser may only prepare the owned synthetic fixture. The candidate itself must execute unchanged under the non-superuser. Observe the actual PostgreSQL17 generated ADMIN edge, and verify final no SET/INHERIT access for postgres through it and none for application callers. Bootstrap native name may differ but fixed bootstrapOID10/SUPERUSER semantics must be explicit, not claimed as actual Dev.

Install exact PG1, then the new full HMA1 artifact; do not substitute old MA1 or #1142 as the subject. Reuse exact tuple/adapter/owned infrastructure where appropriate. Test positive stage→approve→read→revoke through real synthetic Owner+AAL2 guards, negative role/owner/claims/session states, and required live lock/epoch/expiry invariants affected by this composition. Establish complete preservation of unchanged function declarations/bodies against original MA1 so existing golden logic proof is not silently changed.

Meaningful negatives must cover wrong creator/version/self-grant, missing/drifted private guard, role/schema collision, unexpected creator ACL, additional/changed ADMIN/SET/INHERIT/grantor edges, foreign objects and recovery pre-use versus history/consumer/drift refusal. Do not weaken a failing guard or optional-skip PostgreSQL. Prove connections/queries/clusters settle and stop on pass/failure/timeout, finite explicit budgets and unconditional owned disposal. No need to duplicate unrelated M04 suites or change existing CI budgets.

Wrapper is discovered by existing test:core. All local parser/compiler/test/native/SQL/build execution remains prohibited for the author; actual execution happens only in Root-selected existing GitHub CI after independent source review and final accepted dependency binding.

### Delivery and STOP

Task preserves this entire text and persisted URL. Handoff/manifest distinguish source preparation, synthetic NOT_RUN, hosted target/install unproven, actual signed Owner request absent and public launch false. Pin all reused sources, both PG1 bodies and every preserved MA1 function; deliver explicit finite source delta and complete eight-path tree proof. Current AA4120 failed before Tests; A4 is UNARMED. This task neither rearms nor calls AA.

No branch/ref/PR, Ready, merge, Supabase query/apply, credential/Auth interaction, original #917 fact reconstruction, #1131 action, network source call, scheduler/provider activation or follow-on by the author. If the eight paths cannot safely satisfy the contract, report the concrete dependency before expanding scope. Root selects the next task only after independent review.

