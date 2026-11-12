# Hosted Method Authority 1 — source-only handoff V1

## Status and exact author

Prepared 2026-11-12 under [Root TASK V1](https://github.com/Jetnity/jetnity/issues/1139#issuecomment-6816388805).

Exact author: **Jetnity Official Truth V3 Hosted Method Authority 1 — Codex Generation1**.
Actual new author session: `/root/hosted_method_authority_writer_g1`. This was a Codex source-authoring session; no Cursor UI session or continuation is claimed.

Status: **SOURCE CANDIDATE / ALL EXECUTION NOT_RUN / STOP**. Immutable Git blobs, one tree and one commit are the only intended repository mutations. Root alone publishes, selects existing CI, marks Ready or merges. Author self-review and the bounded author-side helper review are not independent Technical Lead PASS.

No parser, compiler, project test, native PostgreSQL, SQL candidate, build, hosted query/apply, Auth interaction, credentials, scheduler, provider or AA execution occurred. No branch/ref/PR was created or modified. The original #917 and #1131 restrictions remain unchanged.

## Dependency and exact tree boundary

The immutable candidate is stacked on sole parent `28ee04afcd74123cea8803f67d379184353e231d`, tree `8e60897fd154ef410752c392f0e657f21e62352e`, exactly as TASK V1 requires. That PG1 candidate has **not** been represented here as accepted main or a runtime-proven install.

At task assignment accepted main was `dfd692440762b50183fdebbfd6bf8dabde4662d0`, operating mode NORMAL. PG1's later docs-only R2 successor `9ed5b60d7ca77974864a32a03ed029fc51234e22` / tree `7921abb6dc8dfd9110ada61ab5af62469c28008f` is dependency history, not this candidate's parent. Root must incorporate the **final accepted PG1** and invalidate/re-run all changed-head gates before any HMA1 publication or CI. No author-side reparenting is authorized.

The recursive source tree contains 9,483 existing leaves. Delivery must prove all remain identical and add exactly the eight TASK V1 paths, giving 9,491 leaves. The manifest pins seven sibling artifacts and all reused sources; its own blob and the final immutable tree/head are delivered outside the manifest to avoid self-reference. The commit/tree and final retrieval comparison are recorded in Root's delivery evidence. No old MA1/S1/M04/native/rollback/workflow/package leaf is changed.

## Why this module exists

Root's actual Dev receipts [6816048537](https://github.com/Jetnity/jetnity/issues/1139#issuecomment-6816048537) and [6816258415](https://github.com/Jetnity/jetnity/issues/1139#issuecomment-6816258415) bind develop `yfvbxvijcorffwxbxahl` under parent `qscbgcdmivbbnzrcyegn`. They report real current/session postgres, OID16388, PostgreSQL170006, NOSUPERUSER/BYPASSRLS/CREATEROLE plus LOGIN/INHERIT/CREATEDB/REPLICATION, zero incoming and ten outgoing memberships, one role configuration and one database-role setting, existing empty `createrole_self_grant`, bootstrap OID10 `supabase_admin` SUPERUSER and postgres-owned databasepostgres. These are **Root-provided live receipts**, not author-performed database observations. The SELECTs did not create any new role.

The [PostgreSQL17 primary description](https://www.postgresql.org/docs/17/role-attributes.html) explains the required automatic membership created by a non-superuser CREATEROLE principal. Original MA1 assumes zero reader memberships in two places; those assumptions reject the expected bootstrap-granted ADMIN=true/SET=false/INHERIT=false edge. HMA1 admits exactly that edge without modifying the managed postgres role or deleting its bootstrap grant.

## Installation and preserved runtime authority

The new unapplied SQL is one explicit BEGIN/COMMIT. It requires actual session/current postgres, NOSUPERUSER/BYPASSRLS/CREATEROLE, PostgreSQL17, UTF8, empty self-grant, owner database, bootstrap OID10 SUPERUSER and no incoming/direct application SET or INHERIT authority to postgres. It deliberately permits postgres's existing LOGIN/INHERIT, unrelated outgoing memberships and unrelated settings.

Before creating anything it checks the complete exact NEW private PG1 namespace, two functions, body hashes, metadata, owners, ACLs and effective application privilege exclusion. It never loads the legacy #1142 full public-capability artifact. PG1 body hashes:

- `own_active_session_v1`: `1bf7498146d4827371087a926327db1348ce2a4cc55693427ee154eb81082354`.
- `require_current_owner_session_v1`: `ba3667edd483f0a0abcf53f70f4dc71906f0ffdbc192ee569232c78dd359635b`.

Every destination collision is refused. The two replaced membership predicates require exactly one incident edge for the new reader, member equal to the resolved postgres OID, grantor10, ADMIN=true, INHERIT=false, SET=false; effective postgres SET/USAGE of that reader must remain false. The reader has no settings/defaults/owned objects, and no extra incoming or outgoing edge is accepted.

The additional creator ACL-origin guard runs **before** the original foreign-grantee check and baseline PUBLIC EXECUTE revocation. Foreign rights are never normalized. The old full structure validator remains, with a supplementary exact identity validator for bodies, language/return/argument metadata, role ownership, namespace dependency inventory, six table row/array types and extension exclusion.

The transaction takes cooperating locks in the order PG1 `(771101,1)`, then HMA1 `(771102,1)`, with lock timeout2s and statement timeout30s. This prevents this package racing PG1's cooperating unused-removal transaction; it does not prove freedom from arbitrary external DDL.

MA1 remains postgres-owned. All ten complete runtime function declarations are byte-identical to original MA1. The original tables, constraints, indexes, triggers, RLS, owner policies and ordinary final privileges remain unchanged. Current Owner/AAL2/session checks, method history, operation replay, epoch/CAS and expiry semantics are retained.

## Finite source delta against complete original MA1

Original source `scripts/db/official-truth-v3-method-authority-1/method-candidate.sql`: Git blob `6af3e5a76d1eaa4343ee0b1fb812454cce9f7f3e`, 52,631 UTF8 bytes, SHA256 `269c8567da63014c3aa80905aa0773afa4203778985b44ad84fea48d0f24eee6`.

Exactly seven change groups are fully enumerated in the manifest with occurrence counts, exact before/after strings, byte lengths and SHA256 values:

1. Replace the two-line original candidate header with the HMA1 prerequisite description.
2. Replace the original SET LOCAL search_path line with the new finite creator and complete PG1 prerequisite prelude.
3. Replace only the creator-check zero-incident-reader-membership predicate with the exact automatic-edge predicate.
4. Replace only the final-boundary zero-incident-reader-membership predicate with the same automatic-edge boundary.
5. Replace exactly three package-marker literals with `jetnity:hma1:hosted-creator-v1:unused`.
6. Insert the additional exact identity validator before COMMIT.
7. Insert the new creator ACL-origin validator at the original ACL-check boundary.

Reversing those exact replacements in reverse order reconstructs the entire original MA1 string, byte-for-byte. The author's pure source check and the author-side helper's separate textual comparison both confirmed this. This is source identity evidence, not SQL execution or TL PASS. No rewriting logic is used at apply time: the SQL artifact is complete and explicit.

## Exact authored code pins

| Artifact | UTF8 bytes | Git blob | SHA256 |
| --- | ---: | --- | --- |
| `scripts/db/official-truth-v3-hosted-method-authority-1/install-candidate.sql` | 69705 | `9c17260c202e430e4c779e47fee0a62c047c4d87` | `edbaf9d56b3da115b12bf1c8cfd5c76d8bc9483f7fc1658ee648b380a16fe2c0` |
| `scripts/db/official-truth-v3-hosted-method-authority-1/recovery-candidate.sql` | 37179 | `ea8e9fb7008808819dc1b3d85719c5af96c2f708` | `c445fb4eff4a76e75162f5698fc3a7a6942e2775f82929e42639e25308843f1a` |
| `scripts/db/official-truth-v3-hosted-method-authority-1/native.ts` | 54395 | `01118d016863dbc11d42931720131beca51bcd53` | `d347427f7810719e2330d70096c8a3efb74b2d3c43ac3db4a6c969807c5d3992` |
| `lib/readiness/official-truth-v3-hosted-method-authority-1.test.ts` | 346 | `a29be615b12018567415131cc4331ca1071f577e` | `0cfcc4ce2b72d961d142fad5933ba860eac33fe5f5719409712b9a26b3999d41` |

### Preserved runtime declaration and body pins

| Function | Declaration bytes | Declaration SHA256 | Body bytes | Body SHA256 |
| --- | ---: | --- | ---: | --- |
| `official_v3_method_private.tuple_valid_v1` | 440 | `30a147ddffeec98fdd573804962e9692de08e5c11ce9fbf96def1776542a7990` | 193 | `15741698f4f66adb08e23694b15c6bb9d071b8c01e1123ba7087c4c3d50c6662` |
| `official_v3_method_private.timestamp_v1` | 958 | `cf0b10a86d6ecf27fdc44dcf06eac984bea97b1d8e5a0487732000daa168e240` | 775 | `35e5ada766b2b82bc585d403725c2232ffb4c28b3395d9623797a873413cefb1` |
| `official_v3_method_private.command_v1` | 3970 | `790f7f2d893f7b118e6b32cbe75997f4b7bf41271a649ea76d03c71d59619fa0` | 3471 | `ef0a7fe89cd5bc2d15a40f8ec01ab1dd2bc2f7d6f64498409e9485761597561b` |
| `official_v3_method_private.immutable_v1` | 242 | `f7fd73d27f9da70c76e3e96530c8ef67357144bc71021ac05d5e33e91c8e4c59` | 74 | `2a4782a3ca5e568a170743800ad36ea5c8c0a6b926c7524acfe9718c74ffe3a4` |
| `official_v3_method_api.confirm_operation_v1` | 2599 | `08388ed8d6375c1a6f97374ca16647d002b7245ded117e491fd1d751f6e272fa` | 2093 | `232cdcfb8c10161336d2755a83c2a941dd3a582b235515b01f7d6c167579078b` |
| `official_v3_method_api.stage_draft_v1` | 2758 | `249f59a5fc066d0ac79a4e99de020e082cfa984c0d8f47d7aac5928d0dc4a4c9` | 2461 | `947d017cbc27e70a1df22ecbd19214e295d5162f371e00c8d040076e5a168c90` |
| `official_v3_method_api.approve_v1` | 4559 | `8b62c0285e86cb5aba3162ee6c48f38b1d41fbef910cc4855d49ccaa925bbfbd` | 4111 | `df1a49cd377c135460f3e3691303bbe527c4b3fc4e293b486a85ea5b8b1a3f49` |
| `official_v3_method_api.revoke_v1` | 2871 | `cd388f9d65356fc265e3b07a42048af6aa14a0efbaae52d33db428d3f3a49e37` | 2585 | `c6296c4a05ee52b32cdcf6145007dc5b8c3fd6867cf155e500b8bc27f738772f` |
| `official_v3_method_api.read_current_v1` | 2484 | `28b35822204af378a1c0cb8a4bc86b6ca08849be66d7bb3f4f301fa16dc0a24a` | 2041 | `e5688f6912d6ac5098d3826001386e19e163bf3df16ae3d7503a0ab18bb48de2` |
| `official_v3_method_private.require_current_locked_v1` | 1270 | `d79042c67e670ea0716ab63dca57278042d89d43fbf72d516f5e0141b7b9b5a2` | 994 | `7e98f2a32a2388efde95d729d425581bf9443e4397eb8311d82e6a46eb88ca8c` |

## Native proof authored, not run

The mandatory `test:core` wrapper imports only the new HMA1 native file. The native subject executes exact PG1 then the complete **new HMA1** SQL through a separately authenticated actual non-superuser LOGIN postgres connection. Bootstrap SUPERUSER is limited to preparing/mutating the owned disposable synthetic fixture. It is not substituted for the candidate creator and does not run old MA1 as the candidate.

The native startup demands actual PostgreSQL17; there is no optional skip. Existing CI binary availability was **not observed by the author**. Its local cluster helper rejects external connection environment variables/arguments and owns a private Unix-socket-only cluster. No CI workflow or budget is changed.

Eight concrete source-authored proof groups cover:

1. Wrong real creator, finite wrong-version guard-expression injections, self-grant, incoming managed-role authority and missing private PG1 refusal.
2. Exact PG1/Auth-helper body pins; private-guard drift, role/schema collisions, foreign default grants and an inserted additional role edge all refuse without normalization.
3. Exact complete installation through actual LOGIN postgres; observe generated grantor10/admin-only edge, owner/app SET/INHERIT exclusion, declaration/body identity, final catalog inventory and direct app denial.
4. Recovery context/OID binding, foreign rights/functions/objects, each changed ADMIN/SET/INHERIT option, an actual extra grantor edge, consumers and re-created OID refusal. Exact unused removal leaves PG1 and unrelated fixture data intact.
5. Current synthetic Owner+AAL2 stage→approve→read→revoke. History refusal is tested while the exact one-edge installation graph is intact, so another role-edge failure cannot mask history retention.
6. Malformed, mismatched, expired and foreign claims; current user/session/profile invalidations; actual row NOWAIT conflicts; real identified method waits followed by current session expiry/profile invalidation. All deny without history writes.
7. Epoch/CAS refusal and an actual PID/backend-start/query/blocker-identified head wait that begins before approval expiry and checks fresh expiry after the holder releases.
8. An actual long-running query is observed before an intentional failure or timed abort. Immediate outcome handlers and unconditional OwnedTestLifetime disposal require all connections/queries to settle and the owned cluster directory to disappear.

Wrong-version negatives are explicitly **synthetic expression injections into the exact creator guard**, not a PostgreSQL16 or18 runtime. Auth helper bodies are pinned to Root's actual readback, but helper owner/configuration, JWT claims, Auth/Profile rows, role names/OIDs and method approvals are synthetic. Native bootstrap name `ot_pilot_owner` differs from Dev `supabase_admin`; fixed OID10/SUPERUSER semantics are the tested condition. The temporary read-consumer role grant exists only in the native fixture, is restored and is never part of install privileges.

Budgets: effect180s, wrapper240s, existing owned drain35s. The final finally block calls lifetime.dispose directly before any fixture-specific cleanup assertion. Early fixture failure still leaves the cluster registered; close exceptions cannot bypass disposal. Receipt is bounded below8192 bytes and labels synthetic-only, hostedInstall=false and signedOwnerRequest=false.

All eight groups, cleanup receipts, lint, compiler and native outcomes are **NOT_RUN**. The source-authored tests are not reported as passed. Existing MA1 golden proof remains unchanged, and its declarations are source-pinned; Root must select actual exact-head existing CI after independent review and final accepted dependency binding.

## Recovery boundaries and residual gates

The new recovery artifact is separate from untouched old disposable MA1 rollback `2b6f0e0007fb03587347ac56ae9c8d5f374642cb`. See the companion recovery document for exact atomicity, commit-uncertainty, identity/quiescence and used-history limits.

P0: no concrete P0 defect established by these source comparisons; absence of execution is not a safety certification.

P1 unresolved: no actual candidate execution; no accepted final dependency binding; no actual Dev install/readback; no signed Owner request; Root's current exact-target, Auth semantics, API exclusion, effective privilege and quiescence gates remain. Actual hosted PostgreSQL create/drop edge behavior must be proven, never inferred from the fixture. A changed head invalidates earlier gates.

P2 residual: PostgreSQL17 availability and the mandatory native budget await existing CI; unsupported minor/version/profile drift must fail closed. Additional S1/M04 hosted owner compatibility is explicitly out of this eight-path module and remains a separately selected prerequisite.

P3 residual: candidate package comments remain identifying metadata and are not a live-state ledger; exact live objects and Root evidence win over this document.

AA selected4120 failed before Tests; A4 is RUN0/UNARMED in the task's evidence. This author does not rearm/call AA. No current source revision, pilot validity, public cache/refresh, D1 operational signed approval, scheduler or production enablement is accomplished by these files. **Hosted install unproven; signed Owner request absent; public CH→DE launch false.**

The author stops after immutable delivery. Only Root chooses any correction, publication, existing CI, acceptance or follow-on.
