# MA1 implementation plan V1 — Phase A, awaiting Root acceptance

9 November 2026. Author: **Jetnity Official Truth V3 Method Authority 1 — Codex Generation 1**, actual session `/root/v3_method_authority_writer`. Assignment: PR #1175, comment 6742826954. This is a source-read plan, not implementation, test execution or TL PASS.

Exact seed `b8b8737bcb0e225616829d870c0773b6c766a9f8`, tree `d2574147dbf1396c0967920859cdb59c2954b7cb`; code base C1 `5558367eb0bff97162c369bbb8963123839f4b0e`, accepted by Root in comment 6742734870. Issued `MA1_TASK_V1.md` SHA256 `0368cbcd82220f043249427fe68fcf7a2ddb7976c509624d31213d77ae500fd4` controls this plan. Root's three synthetic vectors and all seed receipts remain unchanged.

## 1. Result and limits

MA1 will implement the existing `V3MethodAuthorityPort` using an unapplied private PostgreSQL candidate. It separates immutable method/package registration, a current approval head, and historical operation acknowledgement. Only fresh current human Owner authority may stage, approve, reapprove, revoke or confirm a human operation. The machine role may only observe current state. No returned historical acknowledgement, parsed document, hash or receipt clone becomes authority.

The candidate does not qualify sources, publish Accepted/cache data, integrate a public route or approve the actual D1 method. The private locked checker is a prerequisite for a later jointly verified transaction, not that transaction itself. Method remains **NOT_APPROVED**, Dev **NOT_RELEASE_READY**, SQL **UNAPPLIED**.

## 2. Ownership and reuse

| File | Planned responsibility |
| --- | --- |
| `lib/readiness/official-truth-product-v3/method/contract.ts` | Server-only finite binding/request/result validation; existing draft reader, canonicalizer and civil-date validation; exact method/package checksums; immutable detached scalar tuple. |
| `lib/readiness/official-truth-product-v3/method/authority-postgres.ts` | Existing port implementation, one fixed reader statement, four owned read slots, deadline/abort/join, same-instance WeakMap receipt custody. |
| `lib/readiness/official-truth-product-v3/method/authority.test.ts` | Offline canonical vectors, strict inputs/results, lifetime/custody/capacity and source-boundary adversarial tests. |
| `lib/readiness/official-truth-product-v3/method/native.test.ts` | Unconditional import of the new native proof. No optional skip. |
| `scripts/db/official-truth-v3-method-authority-1/method-candidate.sql` | One atomic unapplied install of two schemas, three tables, one restricted role, exact functions/triggers/RLS/ACL checks. |
| `scripts/db/official-truth-v3-method-authority-1/method-candidate.rollback.sql` | Locked, empty, owned disposable-fixture removal only. |
| `scripts/db/official-truth-v3-method-authority-1/native.ts` | Actual candidate/adapter/Auth/concurrency/restart/rollback acceptance and resource evidence. |
| `scripts/db/official-truth-v3-method-authority-1/native-adapter.ts` | Test-only parent-owned fixed read executor and exact-backend cleanup. |
| `scripts/db/official-truth-v3-method-authority-1/auth-fixture.ts` | Minimal source-pinned synthetic prerequisites and unchanged #1142 candidate installer. |
| `scripts/db/official-truth-v3-method-authority-1/fixtures.ts` | Literal synthetic method/package/operation inputs; no real D1 approval. |
| `scripts/db/official-truth-v3-method-authority-1/process-worker.ts` | Finite child protocol running actual adapter instances; no Pg connection or cluster transfer. |
| `lib/readiness/regulierungs-anwendbarkeit.test.ts` | Only the authorized exact `method/contract.ts` entry in both inventories and focused raw-path negatives; preserve C1 and every existing assertion. |
| `docs/official-truth-product-v3/MA1_*` | Plan, actual source pins, attempt logs/manifests, evidence and frozen handoff. Root's task/reference/receipts are not author-owned. |

Reuse unchanged `local-cluster.ts`, `pg-wire.ts`, `OwnedTestLifetime`, the shared V3 contract/draft reader, `schema2DatenPruefen`, `schema2Kanonisch`, `civilDateOrdinalLesen`, existing SHA256 method utility, and the exact #1142 Owner helper. No shared driver, dependency, workflow, catalog, existing helper, global/default privilege or runtime binding change.

## 3. Closed code-owned binding and runtime seam

`method/contract.ts` will expose a finite validated binding reader and small request/result readers used by the actual adapter/tests. The binding reader receives a code-owned draft, exact package bytes and expected package checksum; it does not read files, discover a directory, resolve a provider, inspect environment variables or accept a product-selected database client/role/target. Package bytes are bounded to 65,536 bytes, copied while hashing, and not retained in the final binding. A package checksum pins externally reviewed manifest bytes; it is not a manifest-completeness or policy-approval parser.

Method digest is exactly `sha256Hex(schema2Kanonisch(successfulSharedDraftReader.value))`. `DRAFT` and `NOT_APPROVED` remain distinct. The existing method reader supplies detached, frozen validated data; no raw-property-order hash, `jsonb::text` hash, status normalization or copied canonicalizer is introduced. Package SHA256 covers exact raw bytes, including a trailing newline, using the built-in crypto byte API. Final binding retains only `{methodId, revision, methodDigest, packageDigest}` as frozen scalars. Method IDs follow the unchanged `^[a-z][a-z0-9_-]{1,63}$` rule; revision is integer 1..2147483647; digests are exactly 64 lowercase hex characters.

Factory shape: `createV3PostgresMethodAuthority(binding, executor)` returns the unchanged `V3MethodAuthorityPort<Ma1MethodReceipt>`. `executor` is a code-owned seam or null, not chosen from product input. A null/invalid executor has no positive path. Runtime exports are limited to the finite factory, fixed statement/limits where actually imported, readers and types used by tests/adapter; no broad forwarding exports.

The executor contract is a single `readCurrent(request, signal)` call, where request is the validated fixed tuple plus canonical `checkedAt`. It resolves only after its acquisition, actual SQL, cancellation and drain settle, returning `{status:'rows', rows}` or `{status:'unavailable'}`. It does not accept arbitrary SQL. Rows are untrusted `unknown` until strict decoding. A compliant executor owns and joins all initiated operations; the adapter cannot make a noncompliant promise terminate.

The actual SQL is fixed:

```sql
SELECT status, method_id, revision, method_digest, package_digest,
       epoch, approval_mode, approval_until, observed_at, remaining_ms
FROM official_v3_method_api.read_current_v1(
  $1::text,$2::integer,$3::text,$4::text,$5::text)
```

Result validation requires exactly one plain row, exactly those ten own data keys, no getters/exotic prototypes, string-or-null driver cells only, bounded cell lengths, canonical integer spellings and all status-dependent invariants below. No raw JSON parsing is needed for the machine read. Unknown fields, extra/missing rows, malformed cells, impossible combinations or mismatched fixed method identity return unavailable. Raw SQL/errors/claims/package bytes are not reflected to callers.

## 4. SQL objects and finite signatures

All candidate names are fixed. Schemas are `official_v3_method_private` and `official_v3_method_api`; neither is a Data API schema or added to an exposed schema configuration. Existing `postgres` owns state/functions. Candidate creates only `ot_v3_method_reader` with NOLOGIN, NOINHERIT, NOSUPERUSER, NOCREATEDB, NOCREATEROLE, NOREPLICATION, NOBYPASSRLS.

### Tables

- `revisions_v1`: `(method_id, revision)` primary key; method/package digests; nullable predecessor revision; DB staging time and DB-derived actor UUID. A composite unique tuple supports the head FK. Predecessor is null exactly for revision 1, otherwise revision minus one, with same-method predecessor FK. No update/delete path; immutable trigger rejects both. No Auth FK.
- `heads_v1`: method primary key; exact selected immutable tuple; epoch; stored state `approved|revoked`; approval mode/until; DB change time, actor UUID and operation ID. Composite FK to the immutable tuple. Epoch 1..2147483647; approved may never have terminal epoch. Approved mode is exactly `until_revoked` with null until or `until` with a nonnull canonical-millisecond timestamp. Revoked clears mode/until. No table privilege outside postgres.
- `operations_v1`: `maop1_` plus 32 lowercase hex operation ID primary key; action, method/revision identifiers, complete closed command JSONB, complete before/after head snapshots, DB-derived actor UUID and full-precision DB operation time. Command <=4,096 serialized bytes; each head snapshot <=1,024 bytes. Commands are built internally from validated scalar parameters, not accepted as arbitrary JSON. Identifier/action/tuple/nullability consistency checks are explicit. History is append-only with immutable update/delete trigger; no Auth/session FK, token/claim/session-ID/free-text/source-byte retention. History persists across later Auth deletion.

These are bounded row formats and finite indexed identities. No new operational quota or fixed total database-capacity guarantee is claimed; that remains later operating-package work.

### Public-to-approved-role API signatures

Every listed function is non-STRICT so null input is explicitly rejected where required. Human APIs return one bounded JSONB result as described below; no overload/default argument is installed.

```sql
stage_draft_v1(
  operation_id text, method_id text, revision integer,
  method_digest text, package_digest text, predecessor_revision integer
) RETURNS jsonb

approve_v1(
  operation_id text, method_id text, revision integer,
  method_digest text, package_digest text,
  expected_revision integer, expected_method_digest text,
  expected_package_digest text, expected_epoch integer, expected_status text,
  approval_mode text, approval_until text
) RETURNS jsonb

revoke_v1(
  operation_id text, method_id text, revision integer,
  method_digest text, package_digest text, expected_epoch integer
) RETURNS jsonb

confirm_operation_v1(
  operation_id text, action text, method_id text, revision integer,
  method_digest text, package_digest text, predecessor_revision integer,
  expected_revision integer, expected_method_digest text,
  expected_package_digest text, expected_epoch integer, expected_status text,
  approval_mode text, approval_until text
) RETURNS jsonb

read_current_v1(
  method_id text, revision integer, method_digest text,
  package_digest text, checked_at text
) RETURNS TABLE (
  status text, method_id text, revision integer, method_digest text,
  package_digest text, epoch integer, approval_mode text,
  approval_until text, observed_at text, remaining_ms integer
)
```

Implementation parameter names will use a uniform `p_` prefix to avoid output-column ambiguity; identity signatures above specify exact types/order. Human API functions are VOLATILE, PARALLEL UNSAFE, SECURITY DEFINER, fixed `search_path=pg_catalog`; all object references are schema-qualified. Read is also VOLATILE/UNSAFE/DEFINER so its post-lock clock and observation are actual. Native backend deadlines remain unchanged.

Private fixed functions:

- `tuple_valid_v1(text,integer,text,text) RETURNS boolean`: finite scalar shape predicate.
- `timestamp_v1(text) RETURNS timestamptz`: strict canonical timestamp reader; immutable/invoker, no network or clock.
- `command_v1(text,text,text,integer,text,text,integer,integer,text,text,integer,text,text,text) RETURNS jsonb`: pure closed scalar-command validator/builder, matching confirm's argument order. It performs no current-state, future-expiry or authority decision.
- `immutable_v1() RETURNS trigger`: rejects UPDATE/DELETE of revisions/history with fixed SQLSTATE/message.
- `require_current_locked_v1(text,integer,text,text,integer) RETURNS void`: owner-only locked final-current check. VOLATILE/UNSAFE/DEFINER; no human or machine grant.

All private helpers are owner-only. No extra generic mutation dispatcher, grant broker, schema selector, caller-configurable procedure or dynamic SQL is introduced. The human mutators reuse `confirm_operation_v1` inside the same transaction for the common strict parse/serialization/fresh-human/history step; locks acquired there remain held by the enclosing transaction. Only an absent result lets a mutation proceed to its NEW-state checks.

### Closed command and historical results

Command keys are exactly `schema:1`, `action`, `operationId`, `methodId`, `revision`, `methodDigest`, `packageDigest`, `predecessorRevision`, `expected`, `approval`. Expected is null for stage, otherwise `{revision,methodDigest,packageDigest,epoch,status}`. Epoch 0 is permitted only for approval expecting no head, with all other expected fields null. Existing-head CAS has positive epoch, complete exact tuple and stored status approved/revoked. Revoke constructs expected tuple from its selected tuple, positive epoch and status approved. Approval is null except approve, where it is `{mode,until}`. Stage alone has predecessor; unused scalar arguments to confirm must be null, not ignored. Revoke confirm must repeat the same selected expected tuple. Complete structured command and actor equality, not a hash, decides replay identity.

An existing exact operation returns a fixed historical record: `{status:'recorded', operationId, action, command, actorId, recordedAt, before, after}`. Before/after are either null or fixed selected tuple/epoch/stored-status/approval-mode/until snapshots. The acknowledgement is provisional until actual COMMIT or serialized confirmation. A new mutation returns this same record shape; a replay does not pretend to be a new action. Confirm-only absence is exactly `{status:'absent', operationId}`. Neither shape is a current-authority receipt.

## 5. Locks, human checks and state transitions

All human operations use one order:

1. Strict scalar/command shape validation, including optional-until syntax but **not** future-expiry or current CAS.
2. Transaction advisory operation mutex: fixed two-int namespace 750101 and `hashtext(operation_id)`. Then method mutex namespace 750102 and `hashtext(method_id)`. Hash collisions may serialize unrelated work; complete stored strings/command still decide identity.
3. Acquire the three named tables in fixed order heads, revisions, operations with ROW EXCLUSIVE table locks. These locks do not write data; they prevent a later DDL/table-lock acquisition from becoming an unaccounted wait after human authorization. Confirm has no data/history mutation even though it holds serialization locks.
4. Existing head FOR UPDATE. Existing immutable revision rows needed for current/selected/predecessor FKs FOR SHARE, ordered by revision. Missing rows are not yet a NEW-state rejection; immutable predecessor/target existence checks come later. Same-method serialization prevents a competing API insert while absent rows are examined.
5. Invoke exact unchanged `jetnity_ot_auth.require_current_owner_session_v1()` and obtain actor via `auth.uid()` after it succeeds. The helper locks own user -> session -> profile FOR SHARE NOWAIT and checks a fresh post-lock clock. No statement-Boolean substitute and no Auth-before-method wait.
6. Read immutable operation history. Exact command+actor returns its original record immediately, before current CAS, predecessor, future-until or exhaustion checks. Any mismatch raises collision. Confirm-only absent returns absence immediately without NEW checks, writes or a receipt.
7. Only a NEW mutation validates actual current head/tuple/epoch/status, immutable revision chain, approval future-until and exhaustion. All known conflicting table/row/advisory locks have already been acquired. Apply its finite transition, append the historical operation atomically and return its provisional record. No catch-and-allow around authorization, serialization, lock or constraint errors.

The exact helper source file is SHA256 `169c6b02c2776ac163590b1cd6ffb6d43133621c9dc9e31b687f083d2ab4aa50`; its `require_current_owner_session_v1` body bytes are SHA256 `ba3667edd483f0a0abcf53f70f4dc71906f0ffdbc192ee569232c78dd359635b`. Native fixture installs the unchanged source; candidate preflight verifies the expected signature, owner, security/volatility/parallel settings, fixed search path/lock timeout, owner-only ACL and body checksum. This checks the prerequisite of this candidate; it is not proof of any current hosted installation.

| New action | Required state | Effect |
| --- | --- | --- |
| Stage revision 1 | No different tuple for `(method,1)`; predecessor null | Append immutable revision and operation; no authority head. |
| Stage successor | Immediate previous registered revision exists; same-method predecessor | Append revision/operation only; current approval/epoch/until unchanged. |
| Stage same immutable tuple under a new operation | Exact existing revision/predecessor bytes | Append truthful no-head-change stage operation; never overwrite revision. A differing tuple collides. |
| First approval | Selected registered revision 1; expected no head/epoch0 | Create approved head epoch1 with explicitly selected mode. |
| Reapproval | Exact current tuple/epoch/status CAS, same selected immutable revision | New human operation; epoch+1; explicitly selected new mode/until. |
| Successor approval | Exact current CAS; selected revision exactly current+1 and immediate registered predecessor | Replace selected head at epoch+1; lower superseded revisions can never be reselected. |
| Revoke | Exact selected approved tuple/epoch; expired-but-still-stored-approved is revocable | Epoch+1; stored revoked; clear mode/until; preserve history. New revoke of already revoked fails state conflict; exact original replay still acknowledges. |

Approval/reapproval results are limited to epoch 2147483646. Epoch 2147483647 is reserved only for terminal revocation. No approval after terminal revoke, rollover/reset/reuse, or implicit new-method-ID escape. Registration may remain historical, but creates no authority. Exhaustion rejects before state/history change. A later logout/expiry of the human who approved does not retroactively erase approval; subsequent human mutations/confirmations need a fresh valid current session.

After lost COMMIT acknowledgement the caller retains the same operation ID and exact command. Confirmation serializes with any dispatched in-flight command. An absence is only that DB observation; terminal reconciliation must first join the original owned invocation so a not-yet-dispatched original cannot arrive after the caller treats absence as final. Historical replay across until expiry, revoke, supersession or terminal epoch remains valid acknowledgement and never renews authority.

## 6. Canonical clocks and machine observation

`timestamp_v1` accepts only years 0001..9999 and exact `YYYY-MM-DDTHH:mm:ss.SSSZ`. It rejects year0000, offsets, omitted/further fractional digits, infinity, whitespace, 24:00, leap-second aliases and invalid civil dates. Regex/range validation precedes a guarded cast; an exact UTC millisecond round-trip must equal the input. Cast/normalization errors map to the fixed invalid-command error; no rounding into approval. Runtime validation uses the unchanged civil-date helper plus the same exact shape and Date ISO round-trip.

`read_current_v1` validates its fixed tuple/checkedAt, then obtains the selected head FOR SHARE when present. It computes `clock_timestamp()` **after the row-lock wait**. Its autocommit observation releases that lock before returning to a later application transaction; it is not the private final check. Absent/draft checks use immutable registered rows. Repeatable-read/serializable errors propagate and map to unavailable.

Status-dependent fixed rows:

| Status | Tuple/epoch | Mode/until/remaining |
| --- | --- | --- |
| `absent` | Requested method ID; revision/digests null, epoch0 | All mode/until null; remaining0. |
| `draft` | Matching registered requested tuple; epoch0, no head | Mode/until null; remaining0. |
| `binding_mismatch` | Actual registered/current same-revision tuple, shape-valid | Remaining0; maps unavailable, never positive. |
| `different_revision` | Actual selected head tuple and positive epoch | Actual stored mode/until or revoked nulls; remaining0. Resolve maps not_approved; valid-receipt reproof maps revoked. |
| `revoked` | Exact requested selected tuple; positive epoch | Mode/until null; remaining0. |
| `expired` | Exact requested selected approved tuple; positive epoch | Mode until, canonical until; remaining0. |
| `approved` | Exact requested selected tuple; epoch1..2147483646 | Mode until_revoked + null until + remaining5000, or mode until + canonical until + remaining1..5000. |

All rows contain actual canonical `observed_at` for diagnostic binding. For finite approval use full-precision DB `now` and `greatest(now, checkedAt)` to evaluate expiry, then `floor(extract(epoch from(until-effectiveNow))*1000)`, clamped conservatively to 0..5000. A submillisecond remainder is nonpositive. The formatted observation timestamp is never used to calculate remaining lifetime. A stale caller clock cannot extend DB validity; a future caller clock can only reduce it. Wrong tuple/digest shapes or impossible return combinations fail unavailable.

The private `require_current_locked_v1` validates tuple+epoch, obtains the actual head FOR SHARE, then checks exact current tuple/epoch, approved status and finite expiry against fresh full-precision `clock_timestamp()` after waiting. It returns void only for current authority, otherwise throws. No receipt or historical ACK input is accepted. It is owner-only and does not check source, original bytes, history or Accepted/cache grants. Its caller must finish **all other relevant waits** and revalidate all proofs/time before a later durable write; a row lock does not stop time. A later wait requires rechecking.

## 7. Receipt lifetime, capacity and executor settlement

An adapter instance owns a WeakMap keyed by frozen opaque empty receipt objects. Value contains only fixed tuple/epoch, bounded observation metadata and original monotonic deadline. No strong receipt Set, payload/package body, persistent token, per-receipt timer or serialization-based custody exists. Clones/serialized objects, foreign instances, wrong method input and absent WeakMap entries fail unavailable. Caller retention of WeakMap keys can retain their fixed metadata; no absolute heap-size claim is made.

Each eligible read reserves one of **four** slots. There is no wait queue; the fifth eligible call returns unavailable immediately. Validation/custody failures and already-expired receipts can return a nonpositive result before SQL; every possible positive resolve or reproof requires the actual restricted SQL read. No cache-only positive reproof exists.

Resolve records `start=performance.now()`, creates an AbortController and requests abort at start+5000ms. The call awaits executor terminal settlement without detached `Promise.race`. On a positive finite result its deadline is `min(start+5000, start+remaining_ms)`; for until_revoked it is start+5000. It is never arrival+remaining. After executor return/cleanup it rechecks signal, original monotonic deadline and all row invariants before minting the receipt. A late observation cannot create a fresh five-second window.

Reproof keeps the receipt's original deadline. Its per-call abort threshold is `min(callStart+5000, originalReceiptDeadline)`. It does not replace the receipt or renew that deadline. Invalid custody is unavailable; known local expiry is expired; actual selected tuple/epoch change or revoke is revoked; actual until expiry is expired; errors/malformed/unknown outcome are unavailable. The original deadline is checked again after every awaited executor settlement before any current result. A terminal negative may be returned after more than five seconds while cleanup completes; no authority remains during that cleanup. The slot is released only in final settlement cleanup.

The five-second receipt cap is conservative technical validity, separate from durable method approval and the unapproved D1 operating proposals. It can reject an import that takes longer even while durable authority remains approved. D1's proposed primary fetch up to10s, optional aggregate8s and I1 bound up to30s are not silently widened or declared operationally composed by MA1. There is no receipt renewal to fit them; actual later composition must respect the shorter applicable proof lifetime. This plan claims no complete D1 timing-path or public performance acceptance.

### Native read executor: exact owned sequence

Only the parent owns the cluster and real connections. Reuse `OwnedTestLifetime.installConnectOwnership()` so even not-yet-completed acquisitions are tracked. Per call:

1. Reject an already-aborted request. Acquire one bootstrap control connection, then one genuine restricted reader login connection. Check abort after each joined acquisition; a late acquisition is closed/drained without authority dispatch.
2. Control uses a fixed 1000ms statement/lock timeout for its finite cancellation/inspection statements. Read target identity `(pid, backend_start)` from its actual connection. Register abort before dispatch and check again.
3. Execute the one fixed autocommit reader SELECT. No BEGIN/mutation/COMMIT guard is used for this read-only observation. Runtime authority is provisional until the executor completes cleanup.
4. Abort sends one exact-identity `pg_terminate_backend(pid,1000)` through the owned control connection. Match both PID and backend_start; never terminate by bare PID. Immediately attach rejection handling, then actually await the cancellation operation in finally.
5. Close target, then at most **20** exact-identity disappearance observations with **10ms** owned waits between them, each under control's 1000ms statement cap. Stop as soon as absent. Failure to prove disappearance is an executor/native failure, never a positive result or early slot release.
6. Close control, join all initiated work and report bounded diagnostics/counters. Parent lifetime final cleanup independently proves no owned connections/backends remain. Cleanup failure aborts that test lifetime/cluster and remains a visible failure; it is not swallowed into a passing native test.

The unchanged wire has no acquisition AbortSignal. Its 30,000ms socket timer is an **inactivity fallback**, not a fixed absolute startup/whole-call bound. Sequential control+target acquisition, identity query, one read, possible cancellation and up to20 inspection queries are separately accounted for. Backend defaults remain25s statement/15s lock/20s idle transaction. `close()` is only Terminate/end, not disappearance proof. The finite counts and control caps bound our work but do not turn socket inactivity into an absolute wall-clock promise. The native scenario watchdog owns failure/cluster stop, then the unchanged lifetime has its separate35s drain. No5/15/30/35-second whole-call SLA, caller-cancellation signature or public p95 is claimed.

## 8. IPC and actual process restart

Child runs actual adapter and retains opaque receipts locally; parent retains cluster WeakSet custody, Pg connections, operation promises, abort controllers and backend identities. No cluster object, DSN, socket, port, role, arbitrary SQL, package body or raw credential crosses IPC.

Protocol is version1 with a parent-generated fixed 16-lowercase-hex generation, separate command/read IDs 1..65535, no reuse within a generation, maximum4096 UTF8 bytes per serialized frame, exact own keys/plain values, at most4 pending reads and at most1 scenario command. Parent validates the full fixed tuple against its own binding before mapping a read to the fixed statement.

- Parent scenario commands: `resolve`, `reprove_retained`, `try_serialized_clone`, `stop`; each carries version/generation/commandId, and only resolve/reprove carry canonical checkedAt. Binding is fixed at worker creation from one named literal fixture mode, not caller JSON discovery.
- Child read request: version/generation/readId/kind=`read`, complete fixed tuple and checkedAt. Child abort: version/generation/readId/kind=`abort`, accepted only for its existing pending request.
- Parent reply: version/generation/readId/kind=`settled`, closed executor result. It is sent only after real SQL/cancel/drain settlement. Late/duplicate/wrong-generation/unknown-ID or malformed frames fail the scenario; they never settle a positive pending call.
- Child command result: version/generation/commandId/kind=`result`, one port status and a Boolean `retainedReceipt` indicator. No opaque receipt itself is transferred. Clone test serializes locally and reuses only the resulting non-authoritative empty object.

Each scenario has a finite60s watchdog. Expiry/error/malformed frame/disconnect/actual child exit aborts every pending parent read, sends SIGKILL if the child is still alive, awaits actual child exit and joins every owned parent operation. The watchdog starts cleanup; it is not an immediate return/whole-call guarantee. Explicit shutdown removes listeners/timers only after joining. Restart proof actually kills a child that has retained a successful receipt, confirms its exit, then starts a different generation with a new actual adapter and a new real SQL resolve. Previous receipt memory cannot be revived. S1's worker pattern is not copied verbatim because it drops the request AbortSignal.

## 9. Installation, ACL proof and minimal Auth fixture

The install is one transaction. It first checks prerequisite roles/helper identity and absence of the two schemas/new reader role; all collisions fail, no `IF NOT EXISTS` adoption. No approved row is seeded. New object creation runs as the actual installer; ownership transfer to postgres does not erase creator-default grants.

Before revoking or granting anything on each group of new objects, inspect effective ACLs using `aclexplode` with correct object default handling, including column ACLs. Permit only actual owner privileges and the built-in PUBLIC EXECUTE default on new functions at this pre-normalization point. Any custom creator grant, including to an eventually intended role, fails the whole transaction before its provenance can be erased. Then assign exact postgres ownership, revoke the built-in PUBLIC function execute atomically, and apply only the exact final ACL map. Do not modify the installer's or postgres's global/schema default privileges. Verify no unexpected memberships of the newly created machine role.

Final map:

| Object | postgres | authenticated | ot_v3_method_reader | PUBLIC / anon / service_role |
| --- | --- | --- | --- | --- |
| Private schema/tables/helpers/locked checker | Owner only | None | None | None |
| API schema | Owner | USAGE only | USAGE only | None |
| stage/approve/revoke/confirm exact signatures | Owner EXECUTE | EXECUTE only, no grant option | None | None |
| read_current exact signature | Owner EXECUTE | None | EXECUTE only, no grant option | None |

Validation enumerates signature-to-role grants, not S1's single-caller-for-all-API pattern. Tables enable and force RLS with exactly one owner policy; no claim that RLS restrains a BYPASSRLS owner. Security-definer search paths are fixed to trusted pg_catalog and object names fully qualified. Validate exact object counts, owners, ACLs/grant options, role attributes/memberships, function security/volatility/config and RLS policy before COMMIT.

Primary PostgreSQL16 references supporting the plan: [default privileges apply to the actual creating role and schema grants add to global defaults](https://www.postgresql.org/docs/16/sql-alterdefaultprivileges.html); [SET ROLE authorization is tied to session_user](https://www.postgresql.org/docs/16/sql-set-role.html); [security-definer search path and atomic PUBLIC EXECUTE revocation](https://www.postgresql.org/docs/16/sql-createfunction.html); [row-lock behavior](https://www.postgresql.org/docs/16/explicit-locking.html); [READ COMMITTED and stronger-isolation behavior](https://www.postgresql.org/docs/16/transaction-iso.html). These technical references confer no live target evidence.

Minimal `auth-fixture.ts` creates only synthetic native prerequisites: anon/authenticated/service_role roles, a NOSUPERUSER/NOLOGIN/BYPASSRLS postgres fixture owner, Auth AAL enum/users/sessions, profiles, exact source-derived role/AAL/capability helpers and finite own-profile fixture policies as needed. Preserve exact source pins for role/profile/AAL/capability migrations; extract each named function once with exact marker/end delimiters, never import the old optional-skipping/full-trip test. Apply unchanged #1142 `authority-candidate.sql` bytes as an explicit separate prerequisite. Do not install trips, pilot grants, source/Accepted infrastructure or #1142's pilot candidate.

Fixture-only postgres rights are explicit: Auth/public schema usage, SELECT on users/sessions/profiles and UPDATE(id) on users/sessions plus UPDATE(user_id) on profiles for actual row locks; exact required function EXECUTE. BYPASSRLS alone is not a table privilege. These grants are outside MA1 candidate SQL, synthetic only, and not evidence of hosted Auth semantics or signed JWT verification.

Use a genuine NOSUPERUSER/NOINHERIT/NOBYPASSRLS human test login with only authenticated membership, and a different genuine restricted reader login with only reader membership. Assert actual session_user/current_user before negative SET ROLE postgres/Auth/table/helper tests; bootstrap-superuser SET ROLE would be vacuous. Separate new disposable test-only creator roles can carry poisoned default grants for atomic-install refusal cases. Never change existing postgres/default ACLs to make the candidate pass.

## 10. Disposable rollback and error contract

Rollback requires the exact native marker, database postgres, bootstrap local owner, Unix-socket-only owned-cluster shape, and exact MA1 schema marker/owners. It acquires ACCESS EXCLUSIVE locks on **heads, revisions, operations in that order**, then checks all three are empty **after all waits**. A concurrent committed revision/operation therefore prevents removal. Lock timeout/deadlock/error aborts the entire rollback. Nonempty state/history is not purged for convenience.

Drop only the named API functions, named triggers, private functions, referencing tables before referenced tables, two schemas and new reader role in finite RESTRICT order. Unknown functions, views, FKs, memberships, grants or external dependencies cause refusal and rollback. No CASCADE, DROP OWNED, Auth/helper/default-ACL removal, postgres drop or #1139 recovery claim. #1142 remains installed in the disposable fixture until ordinary whole-cluster teardown.

Fixed candidate errors use no input interpolation:

| SQLSTATE | Meaning |
| --- | --- |
| P7501 | Invalid closed input or noncanonical timestamp. |
| P7502 | Operation/actor/command or immutable revision collision. |
| P7503 | New-state CAS, predecessor, ordering, expiry or exhaustion refusal. |
| P7504 | Locked current authority unavailable/revoked/expired. |
| P7505 | Prerequisite/object/privilege boundary invalid. |
| P7506 | Owned disposable rollback guard invalid. |
| P7507 | Nonempty state/history prevents rollback. |
| P7508 | Immutable revision/history update/delete refused. |

Existing helper42501, lock55P03, cancellation57014, serialization40001, transaction/deadlock/connection and typed argument cast errors remain nonpositive. Runtime reader never surfaces raw errors as authority. Human API errors abort the operation; no catch-and-append-success. SQL shape errors that occur before function entry remain ordinary typed-cast SQL errors.

## 11. Native acceptance and actual evidence

One mandatory native parent suite uses the actual `t.signal` with `OwnedTestLifetime`, a finite420s parent watchdog and explicit finally disposal. The watchdog is a failure/cleanup reserve, not permission for late positive authority. Child commands have their own60s watchdog. Every connection/acquisition/query, holder/observer, child and hook is registered and joined; diagnostics count initiated/settled/pending operations and exact closed/disappeared backends. No local run is permitted in this workspace; Root executes native proof through existing mandatory CI only.

Planned distinct acceptance groups:

1. **Real composition and strict direct SQL:** unchanged minimal Auth + candidate + restricted adapter; three literal Root vectors; active own Owner stage/approve; absent/draft/approved rows; digest/status/newline distinctions; malformed/null/extra action fields and canonical clock negatives cause no new state/history.
2. **ACL/installation:** exact object metadata/role grants; real non-superuser machine cannot stage/approve/revoke/confirm/Auth/table/internal helper/SET ROLE postgres; human cannot read private state or machine RPC. Poisoned creator function/table/schema/column default privileges fail before normalization; all new objects roll back and unrelated fixture state remains.
3. **Human authority:** missing/wrong/foreign user-session, role/AAL, expired claim/session, deleted/banned/anonymous account, inactive/non-Owner/missing profile all refuse. Synthetic claims are explicitly not signed JWT evidence. Existing helper bytes/ACL/owner remain unchanged.
4. **Immutable revisions and staging:** same-byte duplicate versus collision, immediate predecessor, staged successor leaves old head/epoch/until and its current receipt unchanged; forbidden direct revision/history updates fail.
5. **Operation identity and actual COMMIT:** exact duplicate, mismatched action/command/actor/method, stale CAS, two concurrent same-ID commands, two different new approvals sharing one expected epoch; one truthful effect and immutable history. Actual COMMIT acknowledgement is recorded separately from function rows.
6. **Lost ACK and serialized confirm:** deliberately drop a committed human result only after actual backend completion, join the original, then confirm the same command; cross until expiry, later revoke and supersession. Unknown serialized ID produces absence with no state/history append even when its unused NEW-state CAS/expiry is stale. No fresh-ID blind replay.
7. **Current revisions/epochs:** first approval, same-revision reapproval, immediate successor, no skipped/backward reapproval; actual test-owned boundary fixture at2147483645 -> last approval2147483646 -> terminal revoke2147483647; new approval/revoke exhaustion has unchanged snapshots/history. Boundary setup is explicitly synthetic owner setup, not billions of claimed historical actions.
8. **Receipt and current read:** actual restricted resolve/reprove, until and until_revoked, finite full-precision expiry/submillisecond refusal, caller-clock conservatism, changed epoch/revision, foreign/clone/serialized receipt, no renewal and restart via actual child death/new generation.
9. **Real locked races:** revoke-first makes private checker refuse; protected-step-first holds SHARE until its synthetic-marker transaction commits and revoke follows; expiry during a proved head wait refuses after wait. Actual marker only, no Accepted/publication surrogate claim. Stronger-isolation serialization failure propagates closed.
10. **Post-wait human invalidation:** hold actual method/head lock, observe real caller waiting before Auth helper, concurrently invalidate session or profile, release holder, and require refusal with no head/history change. Helper's own NOWAIT is not falsely described as a waiting lock.
11. **Capacity/cancellation/drain:** four real blocked restricted reads consume all four slots, fifth returns unavailable; use actual relation/head lock blocker and recorded backend identities. Five-second abort joins exact cancellation and disappearance. Delayed acquisition and late results retain slots and never create positive/renewed receipts. Offline controlled promises complement, not replace, actual SQL evidence.
12. **Rollback:** empty owned fixture removes only candidate; wrong marker/owner/connection shape, nonempty revision/history, unknown dependency/grant/membership refuse atomically. Concurrent mutator holds a table lock, rollback waits, mutator commits history, rollback's post-wait emptiness check refuses. Inspect surviving rows/objects on a fresh connection.

Every lock-wait proof uses an independent autocommit observer matching actual PID+backend_start, active state, Lock wait, exact dispatched SQL and actual holder in pg_blocking_pids; verify relevant relation/advisory identity where applicable and confirm the invocation is still pending. Only then mutate/release/abort. Fixed sleeps, promise scheduling or a callback entry are not evidence. Fresh connections read final head/history/marker; finally joins all actors and checks exact backend absence.

## 12. Import preflight and verification sequence

Source inspection confirms the strict applicability guard scans literal references to its module in all discovered sources and separately pins non-test consumers. Therefore **only method/contract.ts** imports its preflight/canonical/date functions; authority/native/fixtures/tests import the new method contract instead. Add only that exact path to both inventories and negative raw variants (suffix, sibling, test-file, traversal, alias, app/API/scripts paths). Preserve C1's exact mapper entry and every old assertion. Avoid direct content-identity, rule-claim, source/Accepted imports entirely, so their exact inventories need no new exception.

Existing test:core discovers `lib/**/*.test.ts`; the native wrapper imports the new suite unconditionally. Existing reachability treats scripts as entrypoints; no worker exemption is required. Export hygiene counts only named actual imports; keep exports finite and used. Schema hygiene observes Supabase `.from/.rpc` usage, absent from this fixed executor seam. No CI/package change is needed.

After Root accepts this exact plan, implementation verification is:

1. Run only explicitly named offline files: new `method/authority.test.ts`, existing V3 `contract.test.ts`, `import/service.test.ts`, `integration/coordinator.test.ts`, `storage/intake-contract.test.ts`, `storage/quarantine-codec.test.ts`, `storage/retention-shape.test.ts`, and existing `regulierungs-anwendbarkeit.test.ts` plus `official-truth-content-identity.test.ts`. Native wrappers are deliberately excluded locally. If another concrete changed risk requires a file, record the reason rather than silently broadening execution.
2. Whole TypeScript, scoped lint, existing five hygiene checks with actual logs; no broad local core run because it discovers mandatory native wrappers. Fix any concrete new guard issue only within authorized ownership or request a precise Root amendment.
3. Record every command/exit/log hash including failures, all owned source hashes, preserved baseline pins and exact seed. Freeze author evidence/handoff. No self-review is TL PASS and no author commit/ref/remote mutation.
4. Root independently reads source/diff/evidence and performs meaningful own offline verification, publishes the exact head, then reads full CI/native/UI/build/Preview and fresh PR/thread/base/Production gates. Each changed head invalidates earlier gates. Immediate fixes return to this exact author/session.

## 13. Phase A record and STOP

This phase read files and hashes only; no runtime module, test, SQL, local Pg/socket, browser/server or hosted service was executed. A child source-only audit `/root/v3_method_authority_writer/ma1_executor_plan_audit` checked unchanged transport/lifetime/IPC patterns and returned notes; Root's independent SQL reviewer supplied the post-lock rollback/real session_user requirements. Source searches that produced bounded/truncated discovery output were followed by exact slices; no product execution is inferred from those reads.

Only this plan and `MA1_SOURCE_PINS_V1.json` are authored now. Root task, reference vectors, prior acceptance receipts, runtime sources, Git HEAD/index/refs and remote state remain unchanged. #917's specific refused readback is never retried/rephrased/delegated/rerouted/human-substituted. #1139's17 pre-Owner gaps and #1131/#1135/#968/#911/#913 plus method/database/Production Owner gates persist.

**STOP for Root and independent review of Phase A. No Phase B implementation before explicit Root acceptance.**
