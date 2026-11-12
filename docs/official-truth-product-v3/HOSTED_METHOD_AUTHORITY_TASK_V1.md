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



---

## Amendment R1 — 12 November 2026

Source: https://github.com/Jetnity/jetnity/issues/1139#issuecomment-6822033975

## Technical Lead — HMA1 source review / CHANGES REQUIRED / amendment R1

**12 November 2026.** Reviewed immutable HMA1 candidate `2f412904edc188bebcc7287e8e3cdae5bf1a9c5a`, tree `1fc41142fe2339f99c8f0dddb4325e6ab6b85701`; current main `dfd692440762b50183fdebbfd6bf8dabde4662d0`, mode NORMAL.

### Independent source findings

Root read the new installer deltas, complete native proof, recovery-specific text and shared full validators, handoff/recovery plan and exact manifest. Root independently checked the full nontruncated eight-addition tree, all package identities, complete task preservation, all ten byte-exact MA1 declarations/bodies and the exact seven-change forward/inverse reconstruction of original MA1. Independent reviewer `/root/ch_de_method_readiness` separately confirmed the safety and preservation invariants. The author-side helper is not a TL review.

No concrete new P0 or admission/recovery defect was found in that source scope. All execution remains NOT_RUN. Two concrete prerequisites prevent publication as currently prepared:

1. **HMA1-CI-01 / P1:** the actual existing verify run #4121 uses PostgreSQL **16.15**. The unchanged shared helper picks fixed roots (sibling toolchain first, then installed17,16,15); HMA1 correctly requires an actual server major17. Current workflow blob `22f6e50aaff600749814bf7e77e24c728b1cd5d5` does not provision17. PATH changes or weakening the version guard would not solve this.
2. **HMA1-BASE-01 / P2:** bind the final source-reviewed PG1 R2 `9ed5b60d7ca77974864a32a03ed029fc51234e22`, tree `7921abb6dc8dfd9110ada61ab5af62469c28008f`, not its earlier docs-only predecessor. [PG1 Root source review](https://github.com/Jetnity/jetnity/issues/1139#issuecomment-6821858548), Draft #1193. Its actual CI is pending; no merge/install acceptance is inferred.

Root independently read current primary documentation:
- https://github.com/actions/runner-images/blob/main/images/ubuntu/Ubuntu2404-Readme.md — image documentation lists PostgreSQL16.15.
- https://www.postgresql.org/download/linux/ubuntu/ — official signed PGDG APT supports Ubuntu noble24.04 and version-specific server/client packages.
- Official repository key fingerprint: `B97B0AFCAA1A47F044F244A07FCC7D46ACCC4CF8`.

### Versioned R1 scope — same original HMA1 author/session

**Jetnity Official Truth V3 Hosted Method Authority 1 — Codex Generation1**, actual original session `/root/hosted_method_authority_writer_g1`.

Prepare an immutable integration successor with **first parent 2f412904edc188bebcc7287e8e3cdae5bf1a9c5a and second parent 9ed5b60d7ca77974864a32a03ed029fc51234e22**. The Git create-commit connector supports additional_parent_shas. Both histories are retained; no existing ref is rewritten. Copy the two final PG1 documentation blobs exactly, with all seven PG1 paths identical to R2.

The permitted overall scope against PG1 R2 is the same eight new HMA1 paths plus **one modified existing path: .github/workflows/ci.yml**. No other existing leaf may change.

1. Preserve the four HMA1 code blobs exactly: install `9c17260c202e430e4c779e47fee0a62c047c4d87`, recovery `ea8e9fb7008808819dc1b3d85719c5af96c2f708`, native `01118d016863dbc11d42931720131beca51bcd53`, wrapper `a29be615b12018567415131cc4331ca1071f577e`. Keep all guards, function bodies, proof cases, budgets and shared modules exact. The HMA1 recovery document remains exact.
2. Add a narrowly scoped PostgreSQL17 provisioning step **only to the existing verify job**, after Operating mode and before Tests. Do not alter job permissions, triggers, concurrency, timeouts, existing commands, companion jobs or required aggregation. No optional skip, continue-on-error, retry loop or fallback to a different major.
3. Use only official signed PGDG `postgresql-17` and `postgresql-client-17` packages for Ubuntu24.04. Keep APT signature/TLS checks. The existing official configured repository may be used; if repository setup is needed, use the documented HTTPS PGDG source and verify the exact published key fingerprint before installing. No curl-pipe-shell, third-party setup action, unsigned package or arbitrary binary download. Record package version and origin. Package unavailability or failed verification is a failed mandatory gate, not permission to switch sources.
4. Use standard ephemeral runner package configuration to avoid starting or adopting a system database service. Tests must continue using only the existing owned Unix-socket clusters. No hosted connection, credentials, secret input, Dev or Production change.
5. After provisioning, use the **unchanged existing findLocalPgBins** to identify the actually selected initdb, pg_ctl, postgres and psql. Require all four resolved paths to be the official installed `/usr/lib/postgresql/17/bin/` programs and each reported major to be17; record their finite paths/versions and package identities. If the higher-priority sibling toolchain wins, fail closed; do not delete/replace it or alter helper selection. The native proof still independently verifies server_version_num.
6. This moves the verify job's Core proofs onto PostgreSQL17; every existing Core test remains mandatory. The separate companion jobs remain unchanged and are not relabeled as17. Full new-head Core, native, type/lint/hygiene/build/companion/Preview gates remain required. No old PG16 pass is transferred to17; an actual incompatibility returns to Root for a concrete same-session review fix.
7. Preserve the complete original Task and append this R1 verbatim with URL. Preserve the full earlier Handoff as dated history and add accurate current parent/dependency/CI preparation status. Update the manifest with exact two-parent ancestry, PG1 R2 identities, the new CI file identity and bounded scope; preserve all original source/inverse/function pins.
8. Deliver the full nine-path manifest versus PG1 R2, complete tree comparison, exact CI insertion/diff, package/provisioning source references and truthful NOT_RUN state. Root must independently review the final new head.

Root may select a stacked source-reviewed Draft PR for ordinary CI after this correction while PG1's own Draft remains open. This authorizes no Ready, merge or install: actual PG1 acceptance/main integration and complete final-base exact-head gates remain required before HMA1 merge or any target use. Any later base change is explicitly incorporated with a new head and full re-gating.

Latest external context: AA A5 is now published at `bb3b22d7ce6f60b2226e7d069287f99960de093f`, Run0 / UNARMED, fresh CI pending. No positive source selection. [E18 6821829506](https://github.com/Jetnity/jetnity/issues/1139#issuecomment-6821829506) now records actual Dev Data API settings, with effective caller proof still separate. These facts update the handoff; they do not change HMA1 runtime authority.

**Author boundary remains source-only:** no parser/compiler/project/native/SQL/build/CI execution, no actual APT installation, no external source observation, no live database query, no ref/PR publication, Ready or merge. Source-authoring and immutable Git objects only. No S1/M04 expansion, managed-role/Auth/global-default change, #917/#1131 retry or workaround. Stop after delivery; no automatic follow-on.

---

## Amendment R2 — 12 November 2026

Source: https://github.com/Jetnity/jetnity/issues/1139#issuecomment-6822152461

## Technical Lead — HMA1 amendment R2 / distinct native result-column names

**12 November 2026.** This bounded amendment supplements [R1](https://github.com/Jetnity/jetnity/issues/1139#issuecomment-6822033975) in the same original author/session, **Jetnity Official Truth V3 Hosted Method Authority 1 — Codex Generation1**, `/root/hosted_method_authority_writer_g1`.

After the actual PG1 #4122 native failure, the author correctly reported three analogous HMA1 source defects outside R1's initial byte-preservation scope. Root independently read all three sites in exact native blob `01118d016863dbc11d42931720131beca51bcd53`: recovery binding at lines341–342 has four unaliased set_config result columns; claim precedence at685 and malformed-JSON preparation at688 each have two. Root also read the unchanged LocalPgConnection RowDescription decoder: duplicate names intentionally throw `duplicate_column`. This is a source finding; HMA1 has not executed.

**Additional permitted edit:** add a distinct explicit output alias to every set_config expression within these three SELECTs only. Keep each argument, order, parameter list, query count, claim/context value, expected error and proof case unchanged. Keep the shared wire protocol duplicate-name guard unchanged. No suppression, catch/ignore, skip, widened budget or changed assertion. Scan the remainder of this native module for the same actual defect and report any additional scope before changing it.

The installer, recovery SQL and wrapper remain byte exact V1; the recovery document remains byte exact. Native.ts may now differ only by those eight aliases. All R1 CI/provisioning and two-parent integration requirements remain binding. Overall scope remains nine paths versus PG1 R2. Append complete R1 then this R2 verbatim with their URLs to the preserved original Task; preserve historical Handoff and accurately update native pins/manifest and NOT_RUN state. If R1 has not yet been committed, include R2 in the same selected two-parent integration; if R1 has already been committed, use a successor retaining that commit and report exact ancestry. No ref rewrites.

PG1's separate R3 task is [6822141580](https://github.com/Jetnity/jetnity/pull/1193#issuecomment-6822141580); it is not permission to silently substitute a new dependency. Root will explicitly select the final PG1 integration before final acceptance. The new independent Auth configuration CI blocker remains outside HMA1 scope.

Source-only immutable Git objects; no project/parser/compiler/native/SQL/APT/test/build/CI execution, hosted mutation, ref/PR publication, Ready or merge. Deliver exact narrow delta and complete manifest/tree evidence, then STOP. All original platform boundaries and final exact-head re-gating remain.
