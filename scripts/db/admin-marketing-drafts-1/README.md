# Admin marketing drafts — native candidate

**UNAPPLIED.** This package adds a durable draft contract in isolated PostgreSQL
proof. No hosted database, app RPC, editor Save control, campaign publication,
attribution, customer tracking or outgoing message is connected by this change.

The approved Task is
`docs/ADMIN_MARKETING_DRAFT_STORE_1_TASK_2026-11-15.md`, committed before code.
It is based on the green #1207 local link generator. That existing URL builder
remains the only application source for public links.

## Stored model

`jetnity_marketing_private` owns three private, RLS-enabled and forced tables:

- `drafts_v1` stores the stable UUID and current positive bigint version.
- `revisions_v1` stores each complete immutable configuration, state, verified
  actor, exact timestamp, command identity and optional restore source.
- `operations_v1` stores the complete immutable input and actor binding, linked
  one-to-one to its resulting revision. That revision is the durable receipt;
  its response is reconstructed without duplicating a mutable JSON result.

The only states are `draft` and `archived`. Create/save/archive/restore each add
one version. Restore copies a selected historical configuration into a new
draft version. No hard delete, publish/send state or customer identifier exists.
Labels remain internal. Campaign markers are `cmp-<draft UUID>`; the optional
content marker retains the existing `cnt-<UUIDv4>` contract. No arbitrary URL,
origin, path, query, source or medium is stored or accepted.

## Candidate API

The exact TypeScript boundary is `lib/admin/marketing/drafts/contract.ts`.
Version values are canonical decimal strings through PostgreSQL bigint's full
positive range. UTC timestamps retain all six fractional digits. Its parsers
take detached own-data snapshots, never call input accessors/coercions and
contain throwing/revoked proxies. Unknown fields fail closed.

`public.admin_marketing_drafts_apply_v1(jsonb)` accepts the closed versioned
command envelope and returns `{schemaVersion:1,action:"apply",receipt,replayed}`.
The immutable receipt remains historical on replay; callers must separately
reload current state. Request IDs bind the complete input plus verified actor.
Namespaced advisory locks serialize request identity and new/existing draft
identity, then an existing draft row is locked. Hashes grant no identity: exact
stored JSON/actor equality is still mandatory. A conflicting reuse returns
`P4092`, a stale version `P4091`, and a disallowed state/exhausted version `P4093`.

`public.admin_marketing_drafts_read_v1(jsonb)` accepts `get`, `list` or `history`.
Lists/history default to20 and cap at50 records. Lists use descending exact
timestamp/UUID keyset cursors; history uses descending version cursors. A
concurrent edit may move an entry between list pages; this is a live keyset,
not a frozen multi-request export. Empty data is represented explicitly;
database/permission errors are never converted to empty success.

## Authority and atomicity

Both wrappers require the unchanged persisted `inhalte-moderieren` capability,
current AAL2, authenticated JWT role, a present non-deleted/non-anonymous account
and active persisted profile. Writers recheck after resource waits, then hold
account/profile SHARE locks until transaction end. UI break-glass, user
metadata and a historic receipt do not confer database authority.

Tables and internal functions have no direct PUBLIC/anon/authenticated/service
grants. Only the two guarded public wrappers allow authenticated EXECUTE.
Existing `postgres` is the trusted non-superuser BYPASSRLS owner; this candidate
does not grant role attributes or claim resistance to a database owner that
disables its own triggers. All functions fix `search_path` to
`pg_catalog, pg_temp`; ordinary private helpers are invokers and the two public
wrappers are definers. The sole private definer is the non-callable deferred
chain trigger, which validates its own schema/table/event context. PostgreSQL17
otherwise runs that deferred trigger under the COMMIT caller after the writer
returns; granting clients private-table access would break the intended boundary.
This trigger has no PUBLIC/client EXECUTE grant. PostgreSQL's primary change
record documents why the newer trigger behavior was not back-patched:
https://www.postgresql.org/message-id/E1tb0y4-0037sb-1e@gemulon.postgresql.org .

Current entry, revision and receipt are one transaction with deferred cyclic
foreign keys and deferred full-chain checks. Inserts/advances that leave missing,
extra, mismatched or invalid history cannot commit. Immutable triggers reject
updates/deletes/truncation of history and receipts. The normal wrapper contract
uses the declared initially-deferred mode. A caller forcing those cross-table
constraints immediate may get an atomic rejection during intermediate inserts;
the wrapper does not change another caller's constraint mode. A returned row
inside an open transaction is tentative until COMMIT acknowledgement.

## Native proof

The new workflow reuses the existing signed official PostgreSQL17 package
provisioning and owned socket-only temporary-cluster transport. It starts no
system database and accepts no hosted connection URL or credentials. Canonical
role/capability functions are extracted byte-for-byte from pinned existing
migrations; only Auth claim primitives and test accounts are synthetic.

`native.test.ts` uses fresh actual clusters for independent groups and collects
all group failures. It covers storage/reload, exact privileges and RLS, active
role/account/AAL2 denial, stale role after observed locks, concurrent CAS and
duplicate requests, complete idempotency binding, discarded application ACK
recovery, rollback/deferred integrity, immutable history, restore, bounded
microsecond pagination and fresh-backend temporary-type interference. The
discarded-ACK case models application uncertainty after a real commit; it does
not claim to inject packet loss into a hosted connection.

Local PostgreSQL/browser/socket execution is excluded in this workspace.
Native evidence must come from the mandatory CI job, never an optional skip.
The current execution status is recorded in the owned handoff. The readback
file is read-only and contains aggregate integrity/catalog information.

## Activation boundary

Do not run these SQL files against hosted Dev yet. BG1 protects the global role
dependency catalog; new wrapper/grant dependencies require coordinated
integration. `types/supabase.ts` and `scripts/db/verwendung.mjs` remain owned by
the entry lane. No runtime caller, dynamic RPC, raw HTTP, generated-type cast,
Auth/profile metadata or existing customer/content table bypasses that gate.

The later coordinated activation must install both SQL files in one transaction
as the verified existing postgres owner, confirm its existing account/profile
lock privileges, regenerate types, extend the literal scanner contract and
mount the authenticated editor. Then verify one signed-in Dev
create/save/reload/history flow. Green native CI alone is not that acceptance.

Production, merges, costs, login/2FA and genuine refunds remain Sasa's decisions.
No entry-database file or #1196–#1198 work is modified by this package.
