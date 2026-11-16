# ADMIN EDITORIAL CMS NATIVE 1 — versioned task

Status: AUTHORIZED IMPLEMENTATION OF AN UNAPPLIED CANDIDATE. This is not a
working Admin CMS, a migration, hosted acceptance or permission to activate it.

## Authority, baseline and ownership

- Product Owner: Sasa; Technical Lead/integrator/publisher: `/root`.
- SQL/domain/documentation writer: `/root/product_audit`.
- Independent native-fixture/test/workflow writer: `/root/journey_audit`, only
  after the task and SQL signatures are handed over. The TL expressly assigns
  disjoint files in the same worktree; neither writer edits the other's files.
- Branch: `feat/admin-editorial-cms-native-20261115`.
- Base: reviewed #1200 `ac10784a3bc9f0440cdf0e2a45d8391b1034b0dc`, including
  the Admin content inventory and the reviewed Dev Auth correction.
- Operating mode read before work: NORMAL.
- Reserved #1196/#1197/#1198 paths are excluded. Current #1197 is
  `5af8f1d018555605005732e4eba44f98334a2f26` with 415 changed paths; the latest
  reviewed #1196/#1198 lists contain 102/98 paths. Recheck before publication.
- This task is secured as an immutable GitHub tree/commit before implementation.
  Creating that object does not publish a branch/ref or PR. Only Root publishes.

## Product purpose and explicit limit

Prepare the real persistence and transaction boundary for editing the four
existing travel inspirations, including drafts, immutable revisions, exact
preview reads, publish, archive and restore-as-draft. This supports useful
planning suggestions without rebuilding the removed blog/creator platform.
The existing public pages, Admin inventory and trip graph remain untouched.

The current Dev schema has no suitable editorial store. Legacy blog/edit
tables were explicitly removed. Official Truth content tables must not be
repurposed. In #1197 the BG1 catalog globally captures dependencies on protected
roles. New client grants/policies and even inherited public service-role grants
change its baseline; REFRESH-RETIREMENT1 preserves the complete comparison.
`types/supabase.ts`, the schema scanner and existing CI selectors are also
reserved. Therefore hosted activation and runtime wiring are BLOCKED pending a
separate coordinated guard/type/scanner integration. No workaround is authorized.

## Allowed files

SQL/domain writer owns:

- this task and a later same-package handoff;
- `scripts/db/admin-editorial-cms-1/README.md`;
- `scripts/db/admin-editorial-cms-1/schema-candidate.sql`;
- `scripts/db/admin-editorial-cms-1/functions-candidate.sql`;
- `scripts/db/admin-editorial-cms-1/readback.sql`;
- `lib/admin/content/cms/contract.ts`;
- `lib/admin/content/cms/contract.test.ts`.

Native writer owns newly added fixture/native-test helpers solely within
`scripts/db/admin-editorial-cms-1/`, a new isolated
`.github/workflows/admin-editorial-cms-native.yml`, and its own native evidence
handoff. No existing harness, selector, package, workflow, type, auth, guard or
migration file may be changed. Any necessary scope amendment is recorded by Root.

## Store and content contract

New namespace `jetnity_cms_private`, exactly three persistent tables:

1. `inspiration_entries_v1`: stable `entry_id` equal to one of the four existing
   GeoNames IDs, locale `de`, immutable name/country/image/sort order, state
   version, draft pointer, published pointer and archive state. Initial state
   version is 0; both revision pointers are NULL; no content is published.
2. `inspiration_revisions_v1`: immutable full snapshots, composite primary key
   `(entry_id, revision)`, DB actor/time and optional same-entry restore source.
3. `inspiration_operations_v1`: immutable successful operation receipts with
   globally unique UUID request ID, full canonical request binding, DB actor,
   before/after state version and exact result.

Composite FKs bind all revision pointers to the same entry. No hard deletion or
automatic history cascade. Revision and operation UPDATE/DELETE/TRUNCATE are
rejected. All tables have RLS enabled and forced, with no direct client grants.
The existing `postgres` execution owner is documented; no new role is created.

The four reference tuples are copied exactly from `lib/places/inspiration.ts`.
The SQL installation contains reference identity only, no automatically
published content. Native positive tests save the actual existing example
copy through the command contract.

Editable payload has exactly `beschreibung`, `idea`, `themen`:

- description: 1–800 Unicode scalar values, at most 3200 UTF-8 bytes;
- planning idea: 1–300 Unicode scalar values, at most 1200 UTF-8 bytes;
- both must contain a non-whitespace character, have no leading/trailing
  whitespace, C0/C1 control characters, unpaired surrogate, `<` or `>`;
- themes: 1–4 distinct values in canonical order
  `stadt-kultur`, `natur`, `strand`, `erholung`; `alle` is not content;
- unknown/missing keys and wrong types are rejected; nothing is silently
  truncated, trimmed, defaulted or normalized into acceptance.

Reference names, countries, place IDs, image paths and locale are not supplied
by the caller. Planning hrefs remain derived by the existing application.
No arbitrary HTML, URL, upload, provider action or new source is introduced.
Publication is editorial visibility, never evidence that travel facts, image
rights, source authority, provider availability or entry rules were verified.

## SQL signatures and wire contract

Public candidate functions, not registered in runtime/types in this task:

```sql
public.admin_cms_inspiration_command_v1(
  p_request_id uuid, p_entry_id text, p_expected_version bigint,
  p_action text, p_payload jsonb
) returns jsonb
public.admin_cms_inspiration_read_v1(
  p_entry_id text, p_revision bigint default null,
  p_before_revision bigint default null, p_limit integer default 20
) returns jsonb
public.admin_cms_inspiration_confirm_v1(p_request_id uuid) returns jsonb
public.cms_inspiration_published_v1() returns jsonb
```

Entry IDs are closed to the four references. Request IDs are non-nil RFC4122
version-4 UUIDs. Expected versions are nonnegative bigint values. Versions and
revision numbers in JSON are canonical decimal TEXT, not JSON numbers.
Returned times are finite UTC values with six fractional digits. Public reads
are deterministic in the fixed reference order and expose published content
only. Admin revision history is capped at 50, keyset-paginated by revision
descending; a requested preview revision must belong to the requested entry.
The read response distinguishes missing revision, no draft and no publication.
Confirm returns only the current caller's bound receipt or `unknown`.

Actions and payloads:

- `save_draft`: the complete three-field editable payload. Append revision and
  advance draft/state version; retain a previous published pointer. Refuse an
  archived entry until restore.
- `publish`: exactly `{revision: "N"}`; it must be the current draft. Advance
  state and published pointer atomically; do not allow a stale revision.
- `archive`: exactly `{}`; clear the public pointer, set archived, preserve all
  revisions. A repeated new command on an already archived state is a conflict.
- `restore_draft`: exactly `{revision: "N"}` for an existing same-entry
  revision. Copy into a new immutable revision, clear archived and advance
  draft/state. Do not automatically publish; retain any still-active previous
  publication. Restoring an archived entry therefore remains unpublished.

No-op publishes and illegal transitions are conflicts. Each successful new
command increments the state version exactly once. History revisions increment
only for save/restore. A command cannot overflow bigint counters.

## Authorization, concurrency and idempotency

No caller-supplied actor, role, assurance, status or time is authoritative.
Every Admin SQL entry point requires the current `auth.uid()`, the unchanged
`public.darf_inhalte_moderieren()` capability, and an exact persisted active
profile for that same user. The account must exist, not be soft-deleted and not
be anonymous. `darf_inhalte_moderieren()` supplies role + current AAL2; it does
not itself establish active profile status. No helper definition is rewritten.

Write sequence: strict request/preliminary authorization; lock the entry;
perform fresh caller validation and hold share locks on the caller records;
look for an existing receipt; then enforce CAS/state transition; write revision,
entry and final receipt in one transaction. Native tests prove denial after
status/role revocation while the command was waiting for its entry lock.

The canonical request binds contract version, server actor, entry, action,
original expected state version and complete validated payload. Full JSONB
equality determines replay identity; a hash is not the sole equality check.
An identical replay returns the original receipt before applying current CAS,
even if subsequent commands advanced the entry. Same ID with any other binding
is a generic conflict, with no foreign receipt disclosure. Cross-entry same-ID
races must roll back the losing transaction completely. Receipt replay and
confirmation always recheck current authority; historical success is not a grant.

Failure categories: `42501` authorization, `22023` invalid request,
`P4091` stale state, `P4092` request identity conflict, `P4093` illegal transition,
`P4041` missing selected revision. Errors contain no content, actor or raw SQL.

The private tables/functions are not exposed as a PostgREST schema. Fixed
public wrappers are the only eventual Data API boundary. Admin EXECUTE is
granted only to authenticated; PUBLIC/anon/service_role are explicitly revoked.
Only the published reader is callable by anon/authenticated. Fixed search_path,
qualified names and no dynamic SQL are required. Later HTTP routing must retain
the existing verified-user, AAL2 and break-glass write guards; none is changed now.

## Native proof and reuse

Use unchanged local-cluster.ts and pg-wire.ts from
`scripts/db/official-truth-integrated-pilot-1/`, and OwnedTestLifetime from
`scripts/db/official-truth-atomic-version-refresh-1/test-lifetime.ts`.
The proof owns a new temporary socket-only cluster, never accepts a DSN/remote
target and rejects connection overrides before startup. Require actual server
major 17; missing/wrong version is failure, not a skip. No local cluster/browser
start is permitted in this workspace; native execution belongs to GitHub CI.

Fixture role/AAL2 functions are extracted unchanged from current canonical
migrations. Synthetic auth/profile rows are explicitly test data. The fixture
does not prove hosted Auth, JWT verification, real MFA or live CMS activation.

Mandatory groups: complete state lifecycle; same-entry competing writers;
publish/save and publish/archive races; identical/different/cross-entry ID
replays; committed result discarded before retry and actual pre-commit abort;
role/AAL2/all inactive status/nonexistent/deleted/anonymous caller negatives;
revocation while blocked; strict payload and foreign-revision refusal; rollback
and immutable history; public draft/archive exclusion and direct table denial;
finite error/timeout cleanup with all connections and cluster removed.

New workflow is necessary because the existing PG17 selector is explicit and
reserved. It must run the candidate proof with no credentials/hosted access and
must not weaken existing CI. Contract tests remain automatically discovered by
the existing core family. Typecheck, lint, static gates and full CI are Root's
integrated gates. Collect the whole failed group before correcting together.

## Deliverables, stop and truthful status

Record source identity, task commit, changed paths, exact checks, native results,
remaining blockers and installation order in handoff. Do not update shared
architecture/roadmap/decision files in this reserved parallel slice; this task
and README record the bounded design, and Root owns later integration.

No hosted query/DDL, service-role credential, provider request, runtime wiring,
automatic migration discovery, new subscription/cost, login/2FA, Production or
reserved-lane edit. Do not mark Ready. Do not merge. Do not publish a ref/PR.
Do not start a follow-up slice. Stop after the candidate and review handoff.
Root must independently review and publish. Guard compatibility, generated
types/scanner registration, Dev installation and real UI acceptance remain
separate, unfulfilled prerequisites.
