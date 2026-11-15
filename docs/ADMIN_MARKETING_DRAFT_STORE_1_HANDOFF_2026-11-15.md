# Admin Marketing Draft Store 1 — author handoff

Status: **IMPLEMENTED CANDIDATE / UNAPPLIED. Local source gates passed; Root's
single review and final-source normal/native CI are pending.** No hosted saved
campaign, editor UI or authenticated campaign acceptance is claimed.

## Identity and ownership

- Approved immutable Task: `e40eb5c603365954058062e67e09742b3b1ccbdb`.
- Base: green #1207 `bf93a20efd486712a8fb38b123a01cb20f11cac9`.
- Branch/worktree: `feat/admin-marketing-draft-store-20261115`,
  `jetnity-campaigns-2`.
- Actual author: `/root/campaigns_2`. Root alone publishes source/Draft PRs and
  performs the independent review. This author performed no remote write.
- Scope is the Task's ten implementation/handoff files; the published Task is
  unchanged. No existing application, migration, type, scanner, workflow or
  entry-lane file changed. `node_modules` is a local untracked dependency symlink,
  not part of the source deliverable.

## Implemented

The new strict TypeScript contract accepts create/save/archive/restore plus
bounded list/get/history reads. It reuses the existing closed link parser and
builder: three targets, four channels, opaque campaign/content markers. Labels
are internal. URL/PII/query fields and publication/sending actions are excluded.
Detached result parsing validates full revisions, exact bigint strings,
microsecond timestamps, coherent cursor endpoints and ordered unique results.

The SQL candidate creates one private schema and three RLS-enabled/forced
tables. A stable draft ID points to its current immutable revision. The complete
operation request and actor bind to that revision as its durable receipt. Every
mutation advances one version, atomically with its full history/receipt.
Replaying an identical request returns the original historical receipt without
overwriting the current version. Conflicting identity/payload/actor reuse and
stale CAS versions reject. Archive/restore preserve prior history.

Two guarded public function candidates expose only the closed read/write
contract. They use the unchanged persisted moderation capability, current AAL2,
present non-deleted/non-anonymous account and active profile. Resource waits
precede a fresh authority check and account/profile SHARE locks. Private ACLs
remain closed even to service_role. No live authority or role attribute changes.

### PostgreSQL17-specific constraint decision

Deferred custom triggers on PostgreSQL17 run under the COMMIT-time caller, which
can differ from the writer's definer context. The new private full-chain
constraint trigger therefore uses a fixed-owner SECURITY DEFINER frame and
checks its exact schema/table/row/event context. It has no client EXECUTE grant
and cannot be called as an ordinary SQL function. Other private helpers remain
invokers; the two API wrappers are the only public definers. Granting clients
private-table reads to make commit work was explicitly avoided.

This was resolved from primary PostgreSQL17 documentation and the upstream
change record before native publication; the changed behavior in newer
PostgreSQL versions was not back-patched:
https://www.postgresql.org/docs/17/trigger-definition.html
https://www.postgresql.org/message-id/E1tb0y4-0037sb-1e@gemulon.postgresql.org

The normal transaction contract retains initially-deferred cyclic constraints.
A caller forcing them immediate may receive an atomic rejection during the
intermediate inserts; the function never changes the caller's constraint mode.
No tentative response inside an open transaction establishes durable success.

## Native proof package

The own new workflow reuses the known-green #1206 official signed PostgreSQL17
provisioning, existing package dependencies and isolated socket-only cluster
transport. Existing CI stays byte-for-byte unchanged. The fixture uses the real
unchanged role/capability source, a non-superuser BYPASSRLS postgres owner, denied
client roles and explicitly synthetic Auth claim primitives/test accounts.
No hosted connection configuration is accepted and there is no optional skip.

Independent fresh-cluster scenarios cover catalog/ACL/RLS, fresh role/AAL2/account
authority, create/reload/history/restore, closed JSON parity, observed concurrent
CAS/replay waits, global request-ID binding, authority withdrawn during a real
database wait, SHARE-lock revocation serialization, transaction rollback/deferred
integrity, immutable history, bounded microsecond pagination and fresh-backend
temporary-type interference. The discarded-ACK case models application
uncertainty after a committed operation; it does not claim hosted packet-loss
injection. Owned lifetimes close all connections and remove each test cluster.

## Local execution results

The first complete local batch passed without a failed check:

- New domain contract: 18 executed tests,18 passed,0 failed,0 skipped.
- Full app TypeScript: passed (`tsc --noEmit --incremental false`).
- Native fixture/test TypeScript program: passed with the repository config.
- Scoped ESLint: passed,0 errors/warnings.
- All five hygiene gates: API protection, schema-use, reachability, exports and
  dependency checks passed. No scanner exception or dynamic RPC call was added.

These local checks used available Node24.22.1; the own native workflow and normal
CI use the repository's Node22 target. Root is provisioning that local version.
No full CI, build or native PostgreSQL result is asserted here. No local
PostgreSQL, socket or browser was started. The existing green #1207 browser
matrix was not rerun or reviewed again.

The subsequent narrow source refinement made the PostgreSQL17 private constraint
trigger owner explicit and aligned SQL numeric limit validation with JS integers;
the new native assertions/readback verify that exception. Root's final-source CI
must execute these changes before this package can be called green.
A trailing blank line in the copied workflow was removed after the whitespace
check reported it; the final staged diff passes `git diff --cached --check`.

## Remaining gate

This is an unapplied schema/domain candidate. BG1's global protected-role
dependency catalog and reserved generated-types/scanner integration still block
hosted installation and application RPC wiring. No metadata/customer/event/
Official Truth table or browser-storage substitute was introduced. #1197's merge
alone does not clear the #1198 type ownership or the BG1 coordination gate.

After coordination: verify the exact live prerequisites, install both SQL files
in one transaction, regenerate types/extend the literal scanner contract, wire
the editor with existing unavailable-versus-empty conventions and perform one
authenticated Dev create/save/reload/history flow. Production, merges, costs,
login/2FA, real refunds and sending remain separate. Root retains final protected
path comparison before source publication and records CI links on GitHub.

## Root publication review — 15 November 2026

The independent once-only review of this new contract, SQL, fixture and workflow found no concrete defect. The PostgreSQL 17 deferred-trigger owner decision was checked against the primary upstream record. Root executed the final contract on the repository target Node 22.23.5: 18 cases passed, none failed or skipped. This narrow run resolves the author's Node 24 runtime difference and covers the final contract source; the native SQL still requires the mandatory PostgreSQL 17 workflow.

The fresh excluded-path union contains 517 files. The ten implementation files do not overlap it; the immutable Task and all existing repository files remain unchanged. The new branch's Preview gets only the existing public Dev configuration, no new key or Production/global setting. Full normal and native CI remain pending source publication. Hosted installation/application wiring and signed-in Dev acceptance remain explicitly open.
