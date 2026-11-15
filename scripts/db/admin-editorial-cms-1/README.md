# Editorial inspiration CMS — native, UNAPPLIED candidate

This package prepares a real persistence/transaction contract for the existing
four inspiration cards. It is not a deployed CMS, migration, hosted installation
or runtime feature. Existing Admin/public pages and planning links are unchanged.

Task: `docs/ADMIN_EDITORIAL_CMS_NATIVE_1_TASK_2026-11-15.md`, immutable task commit
`56037fb4d1c45f9419d3ef720b2b5a52cfda4532`, based on #1200
`ac10784a3bc9f0440cdf0e2a45d8391b1034b0dc`.

## Files and installation boundary

`schema-candidate.sql` and `functions-candidate.sql` belong to one explicit
outer transaction in the owned synthetic native fixture. They deliberately do
not begin or commit independently. Installation fails on an already existing
candidate; there is no silent `IF NOT EXISTS`/overwrite upgrade path.
`readback.sql` reads catalog metadata only, and does not turn absence into PASS.

No file belongs in `supabase/migrations/`. There is no hosted installer, DSN,
environment flag, service-role client or dynamic RPC/runtime workaround.
No new role or change to existing auth helpers/default privileges is required
by the candidate. Eventual public function grants are part of the unapplied SQL
and are executed only in the isolated synthetic fixture during native CI.

Dev activation is presently blocked by the shared Official Truth BG1 catalog:
new dependencies on authenticated/anon/service_role change its exact baseline,
including inherited public defaults. The latest REFRESH-RETIREMENT1 does not
relax that comparison. Runtime generated types and the schema scanner are also
reserved. Coordinated guard/type/scanner integration and a reviewed Dev rollout
are required before any real installation or application wiring.

## Content and state

Only `beschreibung` (1–800 Unicode scalar values/3200 UTF-8 bytes), `idea`
(1–300/1200) and 1–4 canonically ordered distinct themes are editable. Text has
no leading/trailing whitespace, C0/C1 controls or angle brackets; malformed
Unicode and unknown keys/types are refused. Nothing is silently corrected.
The fixed theme order is Stadt/Kultur, Natur, Strand, Erholung; `alle` is a
search filter, not content.

The four reference tuples are the actual existing GeoNames IDs, German names,
countries and image paths from `lib/places/inspiration.ts`. These are reference
identity, not verification of place authority, image rights or travel facts.
The three private tables hold stable entries, immutable full revision snapshots
and immutable successful operation receipts. New entries begin at version 0,
with no draft and no publication. There is no automatic publication or static
fallback. Native example copy is saved through the normal command boundary.

`save_draft` appends a revision and leaves the old publication intact.
`publish` selects exactly the current draft. `archive` removes the publication
while retaining all history. `restore_draft` creates a new revision copied from
an own historical revision and removes archive state; it does not publish.
Restoring an archived entry therefore remains unpublished. A still-active
publication is retained when restoring a different draft.

State versions advance once per successful new command. Revisions advance only
on save/restore. Composite deferred FKs bind draft/public pointers and the latest
operation receipt to the same entry/state. Exact publication time is stored
separately; draft creation time is never relabelled as publication time.

## Commands, reads and confirmation

All four public SQL signatures are fixed in the task. They are not registered
in generated Supabase types and have no application caller in this package.

The command request takes a v4 UUID, known entry ID, expected bigint state
version, action and closed action payload. It accepts no actor/role/AAL/status
or timestamp input. JSON versions/revision numbers are canonical decimal text;
timestamps are finite UTC with six fractional digits.

A recorded receipt has `schema`, `status`, `requestId`, `entryId`, `action`,
`beforeVersion`, `version`, `draftRevision`, `publishedRevision`, `archived`,
`createdRevision`, `recordedAt`. A SQL return value inside an open transaction
is not proof of COMMIT. The native harness must commit and independently read
before claiming a durable positive result.

The global request ID binds the full canonical request and server actor.
Table CHECKs require closed request/receipt key sets, exact JSON types and
bound identities, state counters, action-specific pointers and DB receipt time.
Every predicate must be TRUE; SQL NULL never accepts a partial receipt.
Identical authorized replay returns the original receipt before applying CAS
again, including after later edits. A changed actor, entry, action, expected
version or payload conflicts. Cross-entry ID races are resolved by the global
operation primary key; the losing function subtransaction rolls back its entire
tentative revision/state. No payload hash is treated as sufficient equality.

Confirmation returns only the currently authorized caller's own receipt, or
`{schema:1,status:"unknown",requestId}`. Unknown does not mean the original
request failed. After an ambiguous transport result, retry the same exact
request/ID; never fabricate success or generate a new ID for the same intent.

Admin reads return the current entry, exact selected/default draft preview and
descending revision history, limited to 1–50 records. `nextBeforeRevision` is
an entry-scoped exclusive cursor. Public reads return only explicitly published,
non-archived snapshots in the fixed reference order. They expose neither draft
history, actor IDs nor operation receipts.

## Authority and locking

All Admin functions require the unchanged `darf_inhalte_moderieren()` capability
(persisted role and current AAL2), a present non-deleted/non-anonymous auth user,
and that exact user's persisted `profiles.status = 'active'`. The existing
capability does not itself establish active status. No request metadata can
grant authority. Missing/unknown/inactive states deny with 42501.

Writers precheck authority, lock the entry, then hold SHARE locks on the account
and profile and perform a fresh authority check after any wait. Ordering is
entry -> account -> profile. KEY SHARE would not protect non-key status updates.
Replays still pass current authority. Reads use a statement snapshot; no earlier
permission cache is introduced.

The existing trusted `postgres` execution owner is explicit. It has BYPASSRLS
in the synthetic fixture, without granting this to application callers. Tables
are RLS-on/FORCE/default-deny with no direct client rights. Private schema usage
and all private function rights are denied to client roles. Admin public
wrappers grant only authenticated EXECUTE; service_role is explicitly revoked
as well. Only the narrow published reader permits anon/authenticated.
All object names are qualified and search_path is explicitly `pg_catalog,
pg_temp`, with the temporary schema last. Merely specifying pg_catalog would
still implicitly search pg_temp first for PL/pgSQL body type names. The command
checks authority before traversing untrusted payloads. There is no dynamic SQL.

These checks are feature-local and do not rewrite auth.uid/auth.jwt, roles,
profiles, Auth sessions or any guard. Later HTTP wiring must retain the existing
verified-user/AAL2 and break-glass write guards. Native claims are explicitly
synthetic; the proof is not real JWT/MFA/hosted Auth acceptance.

## Verification and ownership

`lib/admin/content/cms/contract.test.ts` covers actual reference copy, all
commands, closed input, bigint text, Unicode boundaries, themes and detached
values. Accessors are refused without invocation; data descriptors are detached
before validation, and throwing/revoked proxies cannot escape the parser.
Independent `fixture.ts`/`native.test.ts` and the separate PG17 workflow
belong to `/root/journey_audit`. They reuse the unchanged owned cluster, bounded
wire transport and lifetime cleanup. Actual PostgreSQL 17 is mandatory; absence
or another major is a failure, not a skip. Existing CI selectors remain intact.

Native proof must cover CAS/concurrent state changes, duplicate/changed global
request IDs, discarded committed responses and real pre-commit abort, exact
role/AAL/status boundaries, revocation during proven waiting, rollback/history
immutability, direct ACL refusal, public draft/archive exclusion and finite
cleanup. Collect all failures before the next correction batch.

No local PostgreSQL/socket/browser execution is authorized in this workspace.
Root owns the integrated check run, independent review and later publication.
No Ready, merge, Production, new costs or login action is part of this package.
Until real guard/type/scanner integration, Dev installation and eventual mounted
UI acceptance, the status stays **UNAPPLIED candidate**, not finished CMS.
