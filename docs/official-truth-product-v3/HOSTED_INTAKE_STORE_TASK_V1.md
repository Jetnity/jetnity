# HS1 source author task and bounded review amendments

Persisted TASK V1: https://github.com/Jetnity/jetnity/issues/1139#issuecomment-6822245339

The following TASK V1 is preserved verbatim.

## Technical Lead — HS1 / Hosted Intake Store 1 / TASK V1

**12 November 2026. Selected explicitly by Root for the authorized CH→DE release path.** This is source preparation for the actual hosted S1 prerequisite, not a new travel feature, hosted apply, public activation or automatic author follow-on.

### Author, baseline and why this is needed

Logical author: **Jetnity Official Truth V3 Hosted Intake Store 1 — Codex Generation1**; new task/session to be recorded on dispatch. Sole immutable parent: `dfd692440762b50183fdebbfd6bf8dabde4662d0`, tree `cbc79e627161d4ace132b84cf057c18adc86586c`, mode NORMAL. All current existing leaves remain byte exact.

Independent read-only architecture review by /root/ch_de_release_gate_audit and Root's own source/primary-document review found that the original S1 installer creates schemas/objects under a new isolated owner without an executable non-superuser ownership path. It also uses owner default-ACL edits. Actual Dev postgres is a managed NOSUPERUSER/LOGIN/INHERIT/CREATEROLE/BYPASSRLS database owner on PostgreSQL17.6, not the disposable superuser. Changing that managed role to make old SQL pass is prohibited.

Original immutable S1: `scripts/db/official-truth-v3-intake-store-1/intake-candidate.sql`, blob `8ef08c3131e2aeee61a16a565e51b2fb322c8572`, 88,575 UTF-8 bytes / SHA256 `db3256889195ce4f68daa847b55f23a7e7433d4f4c8bb5e49cfda3be54484719`.
Original native `49c06a696154dfbb871fd7c23e35488f43198c07`; rollback `ae39ae3b6296c7800668f14cfe8c7d61601ce0fa`. These remain unchanged. The rollback is explicitly disposable-only and cannot be repurposed.

Root read primary PostgreSQL17 role/GRANT/REVOKE/CREATE SCHEMA documentation:
- https://www.postgresql.org/docs/17/role-attributes.html
- https://www.postgresql.org/docs/17/sql-grant.html
- https://www.postgresql.org/docs/17/sql-revoke.html
- https://www.postgresql.org/docs/17/sql-createschema.html

Actual non-superuser execution of the selected ownership sequence remains a mandatory new native gate; documentation or a source review is not its proof.

### Exactly eight new paths

1. scripts/db/official-truth-v3-hosted-intake-store-1/install-candidate.sql
2. scripts/db/official-truth-v3-hosted-intake-store-1/recovery-candidate.sql
3. scripts/db/official-truth-v3-hosted-intake-store-1/native.ts
4. lib/readiness/official-truth-v3-hosted-intake-store-1.test.ts
5. docs/official-truth-product-v3/HOSTED_INTAKE_STORE_TASK_V1.md
6. docs/official-truth-product-v3/HOSTED_INTAKE_STORE_HANDOFF_V1.md
7. docs/official-truth-product-v3/HOSTED_INTAKE_STORE_RECOVERY_V1.md
8. docs/official-truth-product-v3/HOSTED_INTAKE_STORE_MANIFEST_V1.json

No existing file, shared infrastructure, workflow, dependency, Auth object, MA1, PG1, S1 or M04 artifact changes. HMA1's separate PostgreSQL17 CI preparation is pending; Root will explicitly integrate the reviewed CI prerequisite before publishing executable HS1 CI.

### Installation contract

Use one explicit transaction, catalog-qualified checks, bounded lock/statement timeouts and a private installation/recovery advisory lock `(771103,1)`. Refuse collisions or unfamiliar prerequisite state; no IF NOT EXISTS/adoption/repair. Require actual session_user=current_user=postgres, database postgres owned by that role, NOSUPERUSER, CREATEROLE, required CREATE rights, UTF8 and actual server major17; empty createrole_self_grant and fixed bootstrap-superuser OID10. Use the observed profile only for relevant prerequisites; do not print or indiscriminately pin managed configuration values.

Create only the existing two restricted role names, `ot_v3_intake_owner` and `ot_v3_intake_caller`, with NOLOGIN/NOINHERIT/NOSUPERUSER/NOCREATEDB/NOCREATEROLE/NOREPLICATION/NOBYPASSRLS and no settings. For each, validate the exact automatic PG17 bootstrap-granted creator membership: member actual postgres, grantor10, ADMIN true, INHERIT false, SET false. No other membership involving either new role is admissible. Pre-existing managed postgres memberships remain untouched.

For the owner only, use a separate **creator-issued, grantor-specific temporary SET-only membership** to actual postgres, with INHERIT false and ADMIN false. Verify the exact two membership rows and effective SET ability before ownership use. Do not alter the bootstrap edge or global createrole_self_grant. Use postgres's existing database CREATE right to create the two new schemas under the isolated owner; no database ACL grant to the owner. Switch explicitly to that owner for new tables/functions so they are created with the correct final owner. Return to the original installer and remove only its own temporary membership with grantor-specific RESTRICT. Verify absence of effective SET/USAGE from that edge and exact original bootstrap-only final membership. Transaction failure must roll back all new objects and temporary grants.

Retain all three original tables, constraints, FORCE RLS/owner policies, immutable triggers, API signatures and **all fourteen complete function bodies byte exact**. In particular, preserve strict original byte custody, full retention shape, PII/free-text restrictions, generations/leases, collision handling and finish atomicity. This remains private UNTRUSTED proposal custody; it confers no Rule, method or public authority.

Do not ALTER DEFAULT PRIVILEGES. Validate actual initial ACLs and deny foreign/extra grants. Remove only the documented baseline PUBLIC EXECUTE from each newly created function inside the same uncommitted transaction; grant the existing caller only USAGE on API schema and EXECUTE on the existing four API functions. No direct private schema/table/function privilege for anon, authenticated, service_role, caller or PUBLIC. Explicitly validate final owners, schema/table/function/type/column ACLs, types, signatures, function properties/config/body pins, constraints, policies and triggers. Exact baseline row-type PUBLIC USAGE, if PostgreSQL supplies it, must be explicitly classified and must confer no schema/table access; do not silently normalize unknown grants. Preserve unrelated/default/managed objects byte-for-byte/catalog-equivalent.

Any required departure from this finite contract is CHANGES REQUIRED to Root before expansion. In particular, do not silently replace the SET-only plan with broader permanent membership, new role attributes, owner database CREATE, security disablement or managed/default-ACL edits.

### New recovery contract

Separate pre-use removal, never the old local rollback. Require Root's independently persisted current target/new-object OID identities, consumer assessment and controlled quiescence through COMMIT; acknowledgement settings are not proof. Require exact installed new package and bootstrap-only memberships, no foreign object/grant/default/dependency or known M04/new V3 consumer, and all three custody tables empty under real bounded locks. Any original, reservation or completion/history means refusal. Acquire and fully remove the same narrow temporary owner SET grant, with exact checks, solely for the new owned teardown; no persistent owner credential or privilege.

Drop only the finite exact new objects using RESTRICT and ordinary DROP ROLE. No CASCADE, DROP OWNED, TRUNCATE, history deletion, managed role change or global default-ACL restoration. Preserve PG1/MA1/other S1/M04/legacy history and all unrelated objects. Unknown COMMIT requires a separate supported readback of only this new allowed scope; never blind repeat. Unknown consumers or missing external proof mean no recovery. After use, preserve history and use a separately reviewed forward repair.

### Native proof to author, not execute here

Use existing owned Unix-socket PostgreSQL cluster, wire client and OwnedTestLifetime infrastructure. Original S1 fixtures, adapters and process worker may be reused only after complete source inspection and exact pinning; never load original installer/rollback as the alleged HS1 proof. Bootstrap may create the **synthetic fixture only**. Execute the actual new installer/recovery through a real LOGIN postgres connection with matching NOSUPERUSER hosted attributes and actual PG17; prove current_user/session_user and final membership grantors. No SET ROLE from a retained superuser as a substitute for the installer login.

Required evidence includes:
- Full original-to-new span/body mapping and all fourteen body/declaration pins, exact tables/constraints/policies and original retention JSON.
- Successful real ownership sequence plus collision/role-attribute/default/foreign-ACL/wrong-grantor/extra-member/temporary-edge cleanup negatives, with atomic rollback and unrelated-catalog preservation.
- Exact finite final objects, FORCE RLS, least rights, no extra PUBLIC/application-role/caller direct access; actual allowed caller invokes four Definer APIs.
- All original S1 semantic coverage against HS1: canonical and complete retained shapes, PII/null/free-text refusal before INSERT, exact bytes after reconnect, whitespace/binding collision, real concurrent clients, expiry/generation/old-ticket refusal, all I1 terminal outcomes and archived history, finish shape refusal, committed-but-lost ACK readback without duplicates, precommit/lease-lapse rollback, real blocked-call cancellation/drain and process interruption/reconnect.
- Unused exact recovery succeeds; missing context/OID, foreign rights/objects, drift, known consumer and each nonempty history category refuse without removal; late-writer locking/transaction behavior is covered.
- Every owned operation settles, all connections/children close/join and only owned clusters stop on success, failure and timeout. No cleanup preemption, unowned promise or optional skipped native gate. Use distinct SELECT result names; keep pg-wire's duplicate-column refusal intact.

Keep existing S1 tests and their original budgets unchanged. New HS1 proof has a fixed 150,000ms effect budget, 35,000ms independent owned drain and 210,000ms wrapper ceiling, finite connections/children and waits. An actual later budget failure must be investigated rather than weakening coverage or silently widening limits. No arbitrary network/service connection or real source retrieval. Full exact-head Core/companion/type/lint/hygiene/build/Preview gates remain Root's later decision.

### Delivery / STOP

Preserve this entire task verbatim and its persisted URL. Deliver immutable sole-parent commit/tree, exact eight additions and full unchanged-base-tree proof, UTF8 byte/SHA256/Git blob manifest, complete source span inverse mapping, independent-review-ready risks and honest NOT_RUN status. Handoff separates source preparation, actual native proof, target validation/install, real backend/Owner binding and public activation. No signed Owner or current source revision is invented.

The actual Dev receipts are #1139/6816048537 and6816258415 (profile/PG17 prerequisites), and6821829506 (Data API configuration only). They are not all fourteen remaining full Dev rows closed. PG1 R3 and HMA1 R2 are source fixes in progress; no acceptance assumed. D1, pilot extension, source observation and public ports remain unfinished. #917 human evidence remains scoped; never repeat its denied original readback. #1131 is NOT_REQUIRED and untouched.

**Source-only immutable Git authoring. No project/parser/compiler/native/SQL/test/build execution, local package installation, hosted query/apply, credentials, external source GET, ref/PR publication, Ready or merge. Do not start HM04 or any follow-on. Stop after delivery for Root and independent review.**

---

Persisted R1: https://github.com/Jetnity/jetnity/issues/1139#issuecomment-6822676157

The following R1 is preserved verbatim.

## Technical Lead — HS1 review amendment R1 / exact nonconsumer role identity

**12 November 2026.** Same original HS1 author/session, **Jetnity Official Truth V3 Hosted Intake Store 1 — Codex Generation1**, `/root/hosted_intake_writer_g1`. This bounded source correction supplements [TASK V1](https://github.com/Jetnity/jetnity/issues/1139#issuecomment-6822245339) while the original native/docs preparation continues; no execution or publication is selected.

Independent reviewer `/root/ch_de_release_gate_audit` identified **HS1-RECOVERY-01 / P2** in initial recovery blob `94bc4a32d65285a4592893398804007ecf295b4a`. Root independently fetched that complete source and confirmed the exact context at the V3-consumer guard: the two MA1 schemas are permitted, but the role exception is incorrectly named **ot_v3_method_caller**. Actual reviewed MA1/HMA1 uses **ot_v3_method_reader**. As written, otherwise-independent MA1 presence would block unused HS1 recovery, while the unrelated caller name would be exempted.

Replace **only that wrong role exception** with the actual **ot_v3_method_reader**. Do not broaden the known-role/schema allowlist or infer absence of external consumers from a name. Preserve exact package/OID/role/ACL/default/state checks, empty-history locks, external independent no-consumer/quiescence prerequisite, RESTRICT behavior and all original function/table/body pins. Other V3 roles remain rejected.

Include the actual exact known-reader and rejected unrelated-caller distinction in the existing authored recovery/coexistence proof coverage, using only the existing owned synthetic fixtures and fixed budgets. It is source for the later native execution, not a claim of actual HMA1/HS1 hosted composition. If an additional scope is needed, report it before editing.

Append this R1 and URL verbatim to the preserved Task; update Handoff/Manifest current recovery identity and record the initial finding as history. Final sole parent and overall eight-path scope stay exactly TASK V1. Final candidate is still pending Root's full independent review.

No parser/project/native/SQL/build/test/CI/hosted/source-GET execution, ref/PR publication, Ready, merge or follow-on. #917/#1131 boundaries unchanged.

---

Persisted R2: https://github.com/Jetnity/jetnity/issues/1139#issuecomment-6822764045

The following R2 is preserved verbatim.

## Technical Lead — HS1 review amendment R2 / preserve late committed history

**12 November 2026. CHANGES REQUIRED on source.** Same original author/session **Jetnity Official Truth V3 Hosted Intake Store 1 — Codex Generation1**, `/root/hosted_intake_writer_g1`. Supplements TASK V1 and [R1](https://github.com/Jetnity/jetnity/issues/1139#issuecomment-6822676157); same eight paths and sole parent dfd692440762b50183fdebbfd6bf8dabde4662d0.

Independent reviewer `/root/ch_de_release_gate_audit` identified **HS1-RECOVERY-02 / P1**. Root independently read the initial recovery's opening transaction, earlier catalog reads and final table-lock/emptiness/drop sequence. Plain BEGIN inherits the session isolation. With REPEATABLE READ, a late writer committed after that first snapshot but before the existing ACCESS EXCLUSIVE locks can be invisible to the later SELECTs, so the unused-only guard is insufficient. This is a source finding, not executed data loss or an actual hosted condition.

Root read PostgreSQL17 primary documentation:
- https://www.postgresql.org/docs/17/transaction-iso.html
- https://www.postgresql.org/docs/17/sql-begin.html
- https://www.postgresql.org/docs/17/sql-set-transaction.html

**Bounded correction:** add **SET TRANSACTION ISOLATION LEVEL READ COMMITTED;** immediately after the opening BEGIN and before any query in recovery-candidate.sql. Preserve all existing locks, timeout settings, exact package/role/OID/ACL/default checks, independent no-consumer and controlled-quiescence prerequisites, history refusal and RESTRICT teardown. A stale inherited snapshot must not be accepted.

Extend the already-required native late-writer recovery proof to start from a session with repeatable-read default, establish the actual recovery prefix before locks, commit a real allowed synthetic capture on a separate owned connection, then continue the exact suffix. Prove the selected READ COMMITTED isolation, history refusal and complete retained original bytes/history/catalog after rollback. Keep every candidate statement, all original coverage, owned lifetime cleanup and fixed budgets. No test-only history clearing, bypassed RLS, manufactured success or widened deadline.

Update source/recovery pins, Task/Handoff/Recovery/Manifest accordingly; preserve all original task/history and append this full R2 with its URL. Installer's fourteen original functions, three tables and all original semantics remain exact. No other scope or package integration is selected.

All execution remains NOT_RUN. Source-only immutable Git objects; no project/parser/native/SQL/test/build/CI/hosted/source-GET action, refs, Ready, merge or follow-on. Root independently reviews final candidate. #917/#1131 boundaries unchanged.

---

# HS1 SOURCE-V2 / LABEL1 — appended same-session task

Persisted task: https://github.com/Jetnity/jetnity/issues/1139#issuecomment-6826971069

The following task is preserved verbatim. The complete preceding Task V1/R1/R2 document remains byte exact.

## HS1 SOURCE-V2 / LABEL1 — bounded same-session review correction

Root selects the nonblocking P3 **HS1-NATIVE-LABEL-01** correction recorded in independent SOURCE PASS6823221683. Same original reachable implementer: **Jetnity Official Truth V3 Hosted Intake Store1 — Codex Generation1**, /root/hosted_intake_writer_g1.

Exact sole parent: **4278696db179cd1b1d056bb64237e3bfff12ef8a**. Parent tree: **d3bdd862efb7799bca5d03873b84d139dac7ce5b**. This task does not integrate another main or package.

### Exactly one code-text replacement
In scripts/db/official-truth-v3-hosted-intake-store-1/native.ts, current blob **a71ca9a0168bea7c49a54a6affd4d310794337dd**,64,710 bytes, SHA256 **d373c6aaac7d61006fcbc56d95151907bf34a2415e40fa943f2a1e086568cd02**, replace only this group name:

`HS1 late writer is blocked by recovery locks; each nonempty history stage refuses removal`

with:

`HS1 recovery waits for an active writer and then refuses committed history; each nonempty history stage refuses removal`

Root already reviewed the actual interleaving: recovery waits for the active writer, then observes and refuses its committed history. This corrects the label to match the proof; no assertion, query, order, budget or behavior changes.

### Finite file scope
Only these four existing files may change:
- scripts/db/official-truth-v3-hosted-intake-store-1/native.ts
- docs/official-truth-product-v3/HOSTED_INTAKE_STORE_TASK_V1.md
- docs/official-truth-product-v3/HOSTED_INTAKE_STORE_HANDOFF_V1.md
- docs/official-truth-product-v3/HOSTED_INTAKE_STORE_MANIFEST_V1.json

Keep the complete previous Task/Handoff/history verbatim, append this complete task, and update the current Native byte/Gitblob/SHA256 and inverse mapping for the one literal change. Preserve the old manifest history and its exact pins without circular self-hashes. All installer, recovery SQL, wrapper, Recovery document, prerequisite sources and every other tree leaf remain exact. All18 groups, original semantic cases, 150/35/210s limits and ownership/cleanup remain unchanged.

### Delivery boundary
Only immutable Git objects and inert text/hash/tree comparisons; no parser/compiler/SQL/native/tests/build/APT execution, CI/ref/PR publication, Ready, merge, hosted action or official source GET. Full actual tree/sole-parent and raw file readback; give exact pins, complete complement equality and a full Native inverse restoring a71ca9a…. STOP for independent Root review. Same session remains available. #917/#1131 remain untouched. Actual joint PG17/main integration will be a separate explicit Root task; do not begin it automatically.


---

## Current review fix HS1/HM04-FIX1 — 12 November 2026

New replacement session /root/hs1_hm04_fix under the Product Owner’s permanent approval for unreachable original sessions; this is not the original HS1 Generation1 or HM04 Generation4 session.

Sole source parent: a686e608f597ffa82d44fc9d3992b9b566b89688; parent tree: b4f54fad7d9981f8b7676b42b271bf6740a17f48; 9538 leaves. Earlier author/session and NOT_RUN paragraphs above are dated historical evidence.

Root task: implement the specific HS1 type/SQL syntax and copied HM04 syntax corrections on the failed HDP parent; keep every guard, scenario, quota and resource boundary; bind complete current installer/dependency pins; deliver only immutable source objects for independent review. Root additionally selected HM04 recovery-candidate.sql solely for the corrected HS1 dependency-context digest and directly affected exact body identities, preserving unused/history refusal rules. COMPOSED and HDP pin reconciliation belongs to Root.

Actual HDP CI4139 / run43258240430: Typecheck failed at HS1 native.ts(683,40), and HS1 encountered SQLSTATE42601. Both installer and recovery have two top-level IF comparisons with CASE expressions whose inner THEN must be protected by parentheses. Only those CASE operands are parenthesized, with every value, guard and clause retained. Native explicitly selects drain<unknown> for the original [closed, output, ...jobs] promises; the same objects are registered and awaited with unchanged failure/cleanup behavior. All 18 groups and 150/35/210-second limits remain mandatory.

Historical actual failure remains FAILURE: Core typecheck stopped later Core gates; Hosted PG17 had 19 tests, 10 PASS, 9 FAIL, 0 skip. Sources: https://github.com/Jetnity/jetnity/pull/1196#issuecomment-6829449466 and https://github.com/Jetnity/jetnity/pull/1196#issuecomment-6829611816.

SOURCE ONLY / NOT_RUN / UNAPPLIED. No project/parser/compiler/SQL/native/test/build/APT/CI or hosted execution, source GET, ref/PR publication, Ready or merge. Root alone reviews and selects a coherent integration and new complete gates; #917’s denied action and #1131 remain untouched.
