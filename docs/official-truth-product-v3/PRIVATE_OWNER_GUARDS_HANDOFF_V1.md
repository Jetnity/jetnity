# PG1 — Private Owner Guards handoff V1

## Status and actual session

**SOURCE_PREPARED; SQL_UNAPPLIED; ALL EXECUTION NOT_RUN; ROOT REVIEW REQUIRED.**

Author: **Jetnity Official Truth V3 Private Owner Guards 1 — Codex Generation1**.

Actual new session: `/root/v3_private_owner_guards_writer_g1`. This is a real delegated Codex session, not a claimed Cursor UI session. Source corrections remained in this same session.

Binding task: https://github.com/Jetnity/jetnity/issues/1139#issuecomment-6815884525

Binding review amendment R1: https://github.com/Jetnity/jetnity/issues/1139#issuecomment-6816224733

Immutable sole-parent base: `dfd692440762b50183fdebbfd6bf8dabde4662d0`; base tree: `cbc79e627161d4ace132b84cf057c18adc86586c`. Seven new paths only, no old leaf changed. The containing immutable commit/tree and final seven-blob readback are supplied separately in the author delivery so this file has no circular self-identity claim.

Root alone publishes, performs independent review, sets PASS/Ready or merges. This author did not publish a branch/ref/PR, run any CI/project/compiler/parser/native/test/SQL, contact Supabase, change a hosted project, invoke a provider, retrieve an official source, schedule a job or enable a public route. All preparation used immutable Git source objects and pure in-memory source/metadata comparisons. Hash equality and written assertions are not runtime proof.

## What this package provides

This is a separate private V3 prerequisite. It creates one `postgres`-owned `jetnity_ot_auth` namespace and exactly two original guard functions, with both complete original declarations and bodies preserved. Both functions and the namespace remain owner-only. It does not install the full public-capability #1142 package, repair the historical capability/Pilot/ledger path, or close the remaining #1139 evidence rows.

MA1's unchanged Definer functions call `require_current_owner_session_v1()`; that guard calls `own_active_session_v1()` under `postgres`. The new proof exercises this chain through unchanged MA1 staging, approval, reading and revocation using disposable synthetic subjects. No direct application-role access to either private guard is needed.

The original #917 rejected action, E25 and original capability/ledger/Pilot/Grant objects are neither queried nor mutated by these artifacts. No denied fact is reconstructed or rerouted. #1131 stays NOT_REQUIRED and untouched.

### Original authority bindings

Original source: `scripts/db/official-truth-owner-session-candidate-1/authority-candidate.sql`, Git blob `407c28bc7623f659e49c3f408bee28302ef717e1`, UTF-8 5873 bytes, SHA256 `169c6b02c2776ac163590b1cd6ffb6d43133621c9dc9e31b687f083d2ab4aa50`.

| Guard | Complete declaration bytes / SHA256 | Body bytes / SHA256 |
| --- | --- | --- |
| `own_active_session_v1()` | 1545 / `1600e77651e4f571d2d281c1900488ce1e372a9a8fca3c904792a93eb9d6ebf0` | 1379 / `1bf7498146d4827371087a926327db1348ce2a4cc55693427ee154eb81082354` |
| `require_current_owner_session_v1()` | 2111 / `204b7f7e102222b9cb070f9d6998959664de8e4827ac0bc0e87d9483ec0c630b` | 1911 / `ba3667edd483f0a0abcf53f70f4dc71906f0ffdbc192ee569232c78dd359635b` |

The first guard remains STABLE and the locking guard VOLATILE, both PL/pgSQL SECURITY DEFINER and PARALLEL UNSAFE with exact original search_path and the locking guard's 2-second lock_timeout. There is no rewritten authority algorithm or positive legacy substitute.

## Installation boundary

`install-candidate.sql` is an unapplied explicit transaction, not a canonical migration. It requires current_user/database `postgres`, a present NOSUPERUSER/BYPASSRLS owner, the three named application roles, no incoming membership into the owner role, and no application-role SET/inheritance into it. These SQL predicates do not identify a hosted project. Root must bind the real target independently.

The artifact rejects a pre-existing namespace, unexpected selected creator defaults, additional grantees/grantors, and unexpected actual creator ACLs. It permits removal of the documented default non-grantable PUBLIC EXECUTE on functions only. It does not silently repair extra rights or mutate role attributes, Auth data, RLS, global helpers or default ACLs. A final bounded catalog check verifies the two names, owners, declarations' semantics, exact body hashes, configuration, package comments, namespace dependencies and owner-only effective rights. The package advisory lock serializes this install and its own removal; it is not a universal DDL barrier.

## Recovery boundary

`recovery-candidate.sql` is a new pre-use removal artifact for the two guards and their namespace. It is not MA1 recovery. The existing disposable-only MA1 rollback remains unchanged and is never repurposed for a hosted target.

Before removal Root must independently persist the exact current target and namespace OID, establish that no allowed new consumer exists, and hold a controlled quiescent interval through COMMIT. The two caller settings acknowledge that external work:

- `jetnity.pg1_recovery_context = root-verified-unbound-quiescent-v1`
- `jetnity.pg1_recovery_namespace_oid = <the exact namespace OID>`

The settings are not proof of quiescence or target identity. Missing or stale external evidence means do not set them and do not run removal. PL/pgSQL textual callers are not completely represented by pg_depend; DROP RESTRICT alone is insufficient.

The candidate refuses a missing/mismatched acknowledgement or OID, any known V3 namespace/role prefix, owner/body/config/ACL/comment drift, extra objects or foreign dependencies. Both drops and the schema drop use RESTRICT, without CASCADE. If MA1 is bound, approved methods/history exist, or other known V3 consumers have appeared, it must refuse. Preserve history and use a separately reviewed forward repair or supported method revocation; this file never deletes method history.

An unknown COMMIT outcome requires a separately reviewed readback of only the newly allowed objects. It never authorizes blind replay or querying the stopped historical objects.

## Auth reference and actual target limitations

The binding task cited Root's prior partial new-scope observations at #1139 comments 6815106311 (namespace absence) and 6815636025 (selected Auth rights/FKs/aal enum). The author additionally read Root's actual bounded Dev receipt:

https://github.com/Jetnity/jetnity/issues/1139#issuecomment-6816048537

That receipt records, for its bound Dev target, postgres OID 16388 as NOSUPERUSER/BYPASSRLS with LOGIN, INHERIT, CREATEDB, CREATEROLE and REPLICATION; incoming memberships 0, outgoing memberships 10, one roleconfig entry and one database-role setting. The named application roles could not SET/inherit postgres. Selected custom postgres global/new-private function and schema default-ACL rows were empty with overflow=false. This last result is not a proof of PostgreSQL built-in ACL defaults.

Root observed both managed helper bodies and metadata. This proof copies only their exact BODY bytes into its synthetic fixture:

| Managed helper body | UTF-8 bytes | SHA256 |
| --- | --- | --- |
| `auth.jwt()` | 166 | `fed2a8ac0349ffaba807c1b574698bfb1348825b8ef5163ad72d8408386f5e3e` |
| `auth.uid()` | 176 | `9ab5ea099e74ec09e83b1505c51a3647791195aed7c742dcc3f257dfc7d2f300` |

The actual bodies were observed on 2026-11-12 at 06:02:26 UTC. The fixture explicitly preserves claim/claims/sub precedence and adds two uid/sub mismatch refusals. Its helper owner/configuration and its subjects, claims, privileges, role profile and Auth/Profile rows remain synthetic. It does not claim complete hosted helper equivalence, JWT validation, a real signed Owner request, or actual target rights.

The fixture's minimal postgres role is deliberately not the actual hosted profile. The actual hosted role attributes conflict with M04's separate strict role-profile assumption. This slice does not change M04 or managed postgres to hide that mismatch. Root must resolve the production composition separately.

Actual Data API exposure settings and the signed-request route remain separate gates. A browser sign-in wall or synthetic local fixture cannot establish them. No secret, signed token or real account state was obtained or used here.

## Native proof authored, not run

The new required wrapper uses existing test:core discovery and has no environment skip. The existing owned local cluster, wire transport and OwnedTestLifetime remain byte-for-byte unchanged. The proof imports only MA1's finite tuple/operation helpers, not the old Auth fixture or full #1142 installer. The unchanged MA1 SQL, runtime helpers, fixture helper and method contract have explicit source pins.

| Group | Authored behavior | Execution status |
| --- | --- | --- |
| PG1-01 | Wrong installer, collision, function/schema default extra grants, incoming owner membership and extra post-create grant refuse atomically; unrelated marker preserved. | NOT_RUN |
| PG1-02 | Exact namespace, two function declarations/bodies, owner/configuration/shape/ACLs and helper body hashes; native anon/authenticated/service-role connections cannot directly invoke either guard, including isolated EXECUTE denial after a temporary fixture-only schema right. | NOT_RUN |
| PG1-03 | Missing acknowledgement, wrong/reused OID, extra function/schema rights, foreign object, body drift and new consumer namespace/role refuse; exact unused removal succeeds; unrelated data retained. | NOT_RUN |
| PG1-04 | Actual unchanged MA1 Definer chain stages, approves, reads and revokes a synthetic binding; consumed recovery refuses before and after method history; revision/head/operation history retained. | NOT_RUN |
| PG1-05 | Fifteen claim refusals: twelve missing/malformed/foreign/expired inputs, two real-helper precedence mismatches and invalid JSON; method history unchanged. | NOT_RUN |
| PG1-06 | Eleven current user/session/profile invalidations and a synthetic legacy-boolean counterexample refuse without writing method history. | NOT_RUN |
| PG1-07 | Actual row-lock holders for user, session and profile cause NOWAIT refusal; real history preserved. | NOT_RUN |
| PG1-08 | Observed method-lock waits bind PID, backend birth, query and blocker; expiry committed after query start and profile disablement refuse on release with fresh checks. | NOT_RUN |
| PG1-09 | Failure and timeout witnesses each own an actual blocked query and child cluster; interrupted query joins, connections settle/close, clusters stop and directories disappear. | NOT_RUN |

The main effect limit is 180000 ms, the wrapper timeout 240000 ms, with unchanged existing bounded disposal and query/transport limits. There are three owned clusters in total: the main proof and two sequential cleanup witnesses. Connection inventory and waits are finite. No unowned worker or new runner was added.

The eventual bounded native receipt distinguishes synthetic method approvals from hosted authority and records completed groups, source pins, resource settlement, cluster stops and elapsed effect/cleanup time. No such PASS receipt exists at this source-only delivery.

## Review amendment R1 and same-session disposition

Root and the independent reviewer identified that the intermediate `daf49f23c9254dd3f29181de42b0d507dc5c4a68` Native source could skip owned disposal if the redundant fixture close preamble threw. The revised source removes both the helper and that preamble. Main-finally calls OwnedTestLifetime.dispose() directly; existing owned cleanup captures individual close/stop errors while continuing and preserves failures.

The complete binding R1 is preserved below verbatim.

## Technical Lead — PG1 source CHANGES REQUIRED / TASK V1 amendment R1

Exact intermediate native source: daf49f23c9254dd3f29181de42b0d507dc5c4a68. No complete candidate, execution or publication has occurred. Same actual author/session: Jetnity Official Truth V3 Private Owner Guards 1 — Codex Generation1 /root/v3_private_owner_guards_writer_g1.

Independent reviewer /root/ch_de_release_gate_audit identified cleanup preemption; Root read the complete native source and complete existing OwnedTestLifetime b1a81a0f63fb0debaffa4db739adbb483ac1efc5 and independently confirms it. In the main finally, f?.close() precedes await lifetime.dispose() inside one try. A throwing close skips owned disposal/drain/cluster stop after the effect timer has been cleared.

Fix this bounded failure path before final delivery: use the existing owned lifetime as the authoritative cleanup, removing the redundant fixture-close preamble/helper, or unconditionally attempt disposal independently while retaining both primary and cleanup failures. No early exception may bypass disposal. Do not weaken negative cases, counters, deadlines or existing ownership infrastructure. Existing owned disposal already captures each individual close/stop error and continues through the remaining resources. Preserve truthful receipts when disposal itself fails.

The reported Auth helper-fidelity improvement (exact two bodies from actual Dev receipt6816048537 plus claim/claims/sub mismatch negatives) is within V1 and remains synthetic. Deliver the final new native/source pins and full seven-path candidate only after both corrections, with this R1 and URL preserved in Task/Handoff. All previous seven-path/source-only/no-Ready/no-merge/no-follow-on/STOP boundaries remain. No project/native/SQL execution, branch/ref/PR or external call is authorized for the author.

## New code identities

| Path | Git blob | UTF-8 bytes | SHA256 |
| --- | --- | ---: | --- |
| `scripts/db/official-truth-v3-private-owner-guards-1/install-candidate.sql` | `9a8144e27405f93b9c0e5d003923efe8883bb4b4` | 10945 | `3e21495ff40f66337b004fadc98599cd336c19c31bb4f6e4f9013c2c01f02bd2` |
| `scripts/db/official-truth-v3-private-owner-guards-1/recovery-candidate.sql` | `cd5a53120d4eb77adb31d1cf63b467454f7ccd61` | 6452 | `869ed584a9f1aeb4d56a198ec2c94d20569f5cead3f99532753e9d2ab3edb78b` |
| `scripts/db/official-truth-v3-private-owner-guards-1/native.ts` | `d607f819d4094833efba01f2f198bf8f2cbf9209` | 42162 | `62a4a718b3d6d84cbe78ceda6ab7c09b18798d203353aa78fb91261d663c8f89` |
| `lib/readiness/official-truth-v3-private-owner-guards-1.test.ts` | `f18e5aebc4ea6725f631e5ec7316da9f659de024` | 397 | `601629591fadf5cb5ee600ae3f75efbc3db6e22bd341a4e4589f8b02dea28a13` |

The manifest additionally records the task/handoff blob identities, both guard declaration/body pins, unchanged reused source pins, managed helper-body references, intended proof coverage and all unexecuted gates. Its own identity and the containing commit/tree are external Git identities supplied in the final author receipt.

## Author self-review and first unfinished work

Source review checked the exact copied guard declarations and bodies against original immutable Git source, source-pin consistency, the sole new-object SQL scope, default/extra-ACL refusal, conservative pre-use recovery, real synthetic MA1 API calls, claim/state/lock refusal coverage and failure/timeout ownership. The R1 cleanup defect and an intermediate literal-dollar quoting defect found during author source review were corrected before any execution. Author self-review is not an independent Technical Lead PASS.

Risk disposition at handoff:

- P0: no production execution or public authority was attempted; #917/#1131 STOPs are unchanged.
- P1: source correctness and cleanup are still unexecuted; independent Root review and exact-head CI are required. Hosted project identity/Auth/API/effective rights/recovery/quiescence and a real trusted signed Owner request remain unproven for this package. M04's managed-role mismatch remains unresolved.
- P2: the deliberately conservative recovery refuses any known V3 namespace/role and cannot serve a bound environment; a supported revocation or separately reviewed forward repair is needed there. The fixture proves no production-role parity.
- P3: no product feature/UI/public activation or follow-up work is included. The final author receipt must be attached to subsequent review for immutable provenance.

The first unfinished step is Root's independent review of the complete immutable candidate, including R1, then exact-head required type/lint/core/native/hygiene/build and GitHub CI after Root selects publication without consuming AA CI4120 prematurely. Every changed head invalidates prior exact-head gates. Any review fix returns to this same reachable author session.

Actual Dev validation/installation and bounded recovery evidence follow only as separately reviewed Root work. Real signed Owner method approval, actual source binding, cache/publication/visitor wiring and public CH→DE activation remain subsequent explicit Root steps under the Product Owner's existing authorization. No automatic follow-on is started by this author.

**STOP — no Ready, merge, branch/ref/PR, hosted installation or activation by the author.**
