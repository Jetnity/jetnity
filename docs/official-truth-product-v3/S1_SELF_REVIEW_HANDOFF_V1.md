# S1 self-review and handoff V1

9 November 2026. **Implementation candidate; independent TL PASS and native execution are pending.** Self-review is not Ready or merge authority.

## Identity and exact baseline

- Author: **Jetnity Official Truth V3 Intake Store 1 — Codex Generation 1**; actual session `/root/v3_s1_storage_writer`. No Cursor identity or Cursor evidence is claimed.
- Own branch: `feat/official-truth-v3-intake-store-1-20261109`; local author HEAD deliberately remains TASK seed `0bd187324c1d050bda19b44fd7cec0b53e8f0fcf` as Root instructed. Candidate files are in this worktree for Root reconciliation/publication after author STOP.
- PR #1168 is stacked on E1 #1167, base `97629e9130a907b8b9b8072d06bda1956758aa6e`; task main baseline `ce3366e26de73961d4682236af92347bfc3a4ca8`.
- Root published the frozen shared contract R2 at `78ae1691cb9e8e75a3c353d2be0f83a2e2f82b81`; SHA256 `49c4c4f5c2fd0b163be4f387af47032ed8c030fd75e7bfecd875af775bf6f69b`. N1 may consume this exact API. No author remote write, Ready, merge or follow-up action occurred.

## What is implemented

`createV3ProposalIntakeStore` exposes the frozen capture/confirm intake, explicit original open, an I1 quarantine port, and same-operation completion confirmation. Its only external seam is a code-owned injected SQL executor. Production remains unbound and unavailable: no environment connection, credentials, scheduler, public route, registry fallback or Accepted/cache write exists here.

Capture preserves original UTF-8 bytes including whitespace in PostgreSQL BYTEA. Size, UTF-16 loss, duplicate object members (including escaped-equivalent keys), bounded closed retention shape, canonical S0 proposal, and operation/job/context/method binding are checked before SQL. The independently exported low-level backend performs the same preflight. SQL also rejects duplicate original members and invalid nested shapes before its INSERT. Bytes/digest and immutable runner/delivery/input-revision binding are compared under the operation lock. Same operation with different bytes or binding is a collision. `inputRevision` is a runner-selected immutable identifier, not a self-authenticating Git proof.

Reserve uses an actual PostgreSQL operation-row lock, actual DB clock, monotonically increasing generation, random token and bounded lease. Active reservations remain busy; expired reservations can be reclaimed. Local opaque ticket identity plus durable generation/token/binding checks prevent ticket copying and old workers finishing a new reservation. Finish stores the complete outcome, immutable audit and optional escalation key atomically. A second actual DB-clock check after the INSERT raises and rolls back if the lease elapsed during the write. The linearization point is under the held row lock; this is not a claim that an end-of-statement trigger certifies arbitrary later commit work. The executor must observe an actual transaction ACK. Unknown responses are confirmed against the same operation/reference, without replacing the operation ID.

Full replay reuses canonical S0 decision, predecessor, archive, version and transition readers. It checks deterministic decision/version/escalation identifiers and the entire upload/operation/job/context/method/audit relationship. Prepared still means `acceptance: not_committed` and `reproof: required_before_commit`. A stored escalation is neither public suppression nor a delivered owner notification.

The SQL candidate has two dedicated NOLOGIN/NOINHERIT/NOBYPASSRLS roles, private/API schemas, owner-only policies with ENABLE/FORCE RLS, four narrow fixed-search-path definers and no caller direct table/private-function access. A final real ACL assertion rejects installer-default foreign grants inside the same installation transaction. Existing installer defaults are never changed. New-owner global function defaults revoke PUBLIC EXECUTE; explicit installed-object ACLs and schema rights are checked separately.

## Closed retention boundary and deliberate exception

The fixed descriptor in `storage/retention-shape.ts` is embedded verbatim into the SQL candidate by `generate-retention-shape.ts`. Callers cannot provide a schema. It describes all permitted nested object keys, primitive types, enums, identifiers, date/timestamp formats, integer/array bounds and bounded recursive conditions. It covers full proposal, prepared/escalation/negative outcome, decision, evidence reference, predecessor, conflict/archive, version/transition and audit structures. The descriptor protects retention; it does not replace canonical registry membership, context/research digests, source qualification, legal comparison or canonical cross-record semantic checks. A well-shaped untrusted direct-RPC payload never becomes source authority. The canonical TS replay reader still refuses semantically inconsistent stored data.

Supported proposal families are schema1 `requirement_effect` (legacy and applicability variants), `visa_options` (legacy and applicability variants), `stay_limit`, `passport_validity`, `blank_passport_pages`, `transit_conditions`, `temporal_rule`; and all four canonical schema2 families `requirement_effect`, `visa_options`, `stay_limit`, `temporal_rule`. The visa path is included. Context conditions retain canonical V1/V2 predicate/expression forms.

**`official_actions` is the sole deliberately excluded fact family.** Its free URL strings require exact canonical registered publication admission, which this isolated candidate cannot independently check. Root approved fail-closed refusal instead of a soft URL pattern or a second registry. Both TS and SQL enforce the exclusion. `rejected.invalid_proposal` includes proposals that are valid S0 data but outside this candidate's retention subset. An actual S0-valid official-action fixture proves this distinction. A real registry read connection is a separate future code task; no current production admission is implied.

Raw originals are never compacted, normalized, sanitized or reserialized to conceal invalid bytes. The 21-case compatibility corpus is checked against the real S0 reader, not just the new descriptor. Source hashes pin S0/I1 plus the underlying country, rule, condition, temporal and identity readers so a future source change requires explicit shape review.

## Actual verification

This table preserves the Generation 1 report. The recovery addendum and V2 receipt below state the current Generation 2 results and the later R4 changes.

All local commands used Node22 from the explicitly supplied toolchain. The local dependency symlink is not part of the deliverable.

| Check | Actual result |
| --- | --- |
| All V3 unit suites, explicitly excluding only the blocked native wrapper locally | **265 passed, 0 failed, 0 skipped** |
| Foundation, Regulierungs and unchanged Content-Identity architecture suites | **147 passed, 0 failed, 0 skipped** |
| Entire repository `tsc --noEmit --incremental false --pretty false` | **exit0**, empty diagnostics, including native transport/process sources |
| Scoped ESLint on all S1 code and the two approved guard edits | **exit0**, no lint findings |
| PostgreSQL offline SQL parser | **64 candidate statements, 8 rollback statements parsed** |
| PostgreSQL offline PL/pgSQL parser | **15 candidate bodies, 1 rollback body parsed** |
| `check:dead`, `check:deps`, `check:schema-bezug`, `check:api-schutz` | **exit0** |
| `check:exports` | Recorded in the final verification receipt before author STOP |
| Native PostgreSQL in this local environment | **BLOCKED_BY_ENVIRONMENT**; no S1 native run or pass claimed |
| Published candidate exact-head CI/build/preview | **PENDING Root publication and independent verification** |

The known local block is Root's diagnosed UNIX socket creation denial after verified PostgreSQL16.15 build/initdb. The author did not retry the blocked launch, change transport/socket paths, use TCP, disable controls, invoke an alternative operator or modify the owned-cluster/wire guards. Offline SQL parsing is syntax evidence only and does not qualify roles, transactions or durability.

The **mandatory native wrapper** `storage/intake-native.test.ts` is discovered by the unchanged existing `test:core` command. It has no skip branch. The intended next supported execution environment is the normal existing GitHub CI runner, with unchanged run-owned disposable PostgreSQL controls.

## Native scenarios written, awaiting actual CI execution

The suite installs only in a freshly run-owned socket cluster, reuses the unchanged native wire driver and explicitly owns every transaction/control connection. Actual COMMIT acknowledgements are checked separately from result rows. Abort terminates the exact target backend using PID plus birth time, joins cancellation and proves target disappearance; it does not return from a detached Promise.race while a write continues.

The native matrix includes foreign installer default grants with full install rollback; role attributes, schema/table/function ACLs and fixed definers; RLS and immutable originals; direct caller malformed/PII/null/unknown-member rejection before either INSERT; exact original whitespace roundtrip and reconnect; binding/byte collisions; competing clients with busy/reclaim/old-ticket rejection; all terminal outcome variants and full predecessor/archive replay; complete I1 with durable quarantine; actual successful commit whose ACK is withheld from the runtime; same-operation confirmation without duplicate completion; failure before commit; disconnected open transaction; post-write DB-clock expiry rollback; an actually lock-blocked call cancelled and drained; real importer child-process SIGKILL and a new child process confirming durable state; guarded rollback refusal, unexpected outside-owner-object refusal and clean reinstall.

The child-process test uses actual separate Node processes. The parent owns the freshly created cluster and all database transports, handing fixed bounded SQL requests over test-only IPC. The worker's WeakMap/ticket memory genuinely disappears on SIGKILL. This is process-interruption evidence when executed; it is not described as an in-process Map restart or an independent hosted connection.

## Rollback and risk assessment

The candidate remains under `scripts/db/`, never canonical migrations, and is UNAPPLIED to hosted databases. Source changes can be reverted normally. The SQL rollback is **only disposable native fixture removal**, guarded by the fixed local owner/database, UNIX-only owned path, explicit fixture setting and candidate marker. It has no `DROP OWNED`: unexpected outside objects/grants make role removal fail and roll back atomically. It is not a reviewed Dev data-retention/recovery plan.

No known P0 production mutation is introduced: no production binding exists. **P1 unresolved:** actual mandatory native execution and independent Root exact-head review are still required; no durable behavior is called passed until that evidence exists. **P2 boundaries:** the URL-action exclusion and the lack of a production SQL adapter/job/registry admission are explicit; retention is not source acceptance or current freshness. **P3:** operational hosting, retention lifecycle and later method/notification/cache integration remain outside S1. These are scope/status statements, not a request to start another slice.

The #917/#1139 gates remain unchanged: #917 APPLY_RESPONSE_SUCCESS / INDEPENDENT_READBACK_PENDING, Ledger UNKNOWN, Stage2 NOT_ATTEMPTED; #1139 NOT_ACCEPTED and Dev package NOT_RELEASE_READY. The specifically refused readback was not repeated, rephrased, delegated or handed to a human substitute. #1131 Ready-STOP, #1135, #968 and all existing privacy/owner gates remain. No human needs to execute an S1 script at this handoff.

## Handoff and next exact step

Root should reconcile the reviewed author files with the already published frozen contract, publish the complete candidate to Draft #1168, then inspect the **actual standard CI native/Core evidence on that exact head**. A native failure or further review finding returns as CHANGES REQUIRED to this same author/session. Every changed head invalidates prior exact-head gates. Only Root may decide PASS, Ready or merge after full independent review.

Author STOP after the final verification receipt and manifest; do not mark Ready, merge, or start a follow-up slice.

## Recovery addendum — 9 November 2026, Generation 2

The original Generation 1 session did not complete its final receipt before the chat interruption. Root attempted to resume `/root/v3_s1_storage_writer` and received `live agent path not found`. This recovery is therefore explicitly a successor session: **Jetnity Official Truth V3 Intake Store 1 — Codex Generation 2**, `/root/v3_s1_storage_writer_g2`, authorized by [S1_RECOVERY_TASK_V2.md](S1_RECOVERY_TASK_V2.md) and PR #1168 comment `6739217916`. No continuity with an available Generation 1 session or Cursor execution is claimed.

The preserved implementation, local taskseed HEAD and frozen contract were retained. Recovery first removed the unused `export` from `V3_QUARANTINE_OUTCOME_BYTES` in `storage/quarantine-codec.ts`. Its value remains `524_288`; all consumers are internal to that module. Root then returned **CHANGES REQUIRED R4**, with two P2 findings, to this same Generation 2 session; [the independent review evidence is PR #1168 comment 6739317869](https://github.com/Jetnity/jetnity/pull/1168#issuecomment-6739317869).

- **R4a:** the fixture rollback used schema `CASCADE`, which could erase an installer-owned dependent view outside the candidate schemas. The rollback now enumerates the four API functions, three known triggers, ten private helpers, three tables in dependency order and both schemas using `RESTRICT`. Any external view/FK or unknown schema object that prevents teardown rolls back the entire transaction. The native scenario creates a `public` view owned by the installer, requires rollback refusal with both the view and candidate preserved (including an API function dropped earlier in the attempted transaction), then removes the view and requires normal removal and clean reinstall.
- **R4b:** a fixed 150 ms abort could occur before the target query was dispatched. The native scenario now captures the owned target PID and backend birth, then uses a separate autocommit owner connection to observe the exact active `read_v1` statement in a real lock wait blocked by the known lock-owner PID. It requires `dispatched === 1` and a bounded successful observation before abort. The target must be absent after cancellation/drain while the blocking transaction is still held. Missing lock evidence fails the test. This changes the proof scenario, not the native adapter or production runtime.

The two inherited finite guard amendments remain exactly those described in S1G1/R1. The Content-Identity guard, owned-cluster driver, wire driver, dependencies and central CI remain unchanged. Native execution of the R4 scenarios remains pending; source changes alone do not establish runtime PASS.

Fresh verification used the supplied **Node v22.23.4** executable. All **265** offline V3 unit tests and **147** architecture/guard tests passed, with zero failures and zero skips. Entire-repository TypeScript, scoped ESLint and all five hygiene checks exited zero. In particular, `check:exports` now reports **zero unused exports**, closing the unfinished item in the historical table above. These results are author evidence against the manifested uncommitted files, not an exact published-head TL PASS.

The exact commands, timestamps, exit codes, counts and local log hashes are recorded in [S1_VERIFICATION_RECEIPT_V2.json](S1_VERIFICATION_RECEIPT_V2.json). [S1_SOURCE_MANIFEST_V1.json](S1_SOURCE_MANIFEST_V1.json) binds the complete S1 source, SQL, tests, documentation, receipt and approved guard files by SHA256. The manifest excludes only its own bytes from its deliverable inventory; its protected-input section separately records unchanged guard/runner/workflow/dependency inputs. The receipt identifies the manifest by filename without embedding its digest, avoiding a circular hash claim.

No local native PostgreSQL launch was attempted during this recovery. The known socket-creation block remains in force; the offline command explicitly selects unit files and excludes `storage/intake-native.test.ts`. That exclusion is local verification scope, not a native skip or native PASS. The unchanged standard CI still discovers the mandatory native wrapper. After R4, the preserved offline `pglast v8.7` parser accepted **64 candidate statements and 28 current rollback statements**. This is syntax evidence only. The historical PL/pgSQL parsing was not rerun or promoted to native execution evidence. Full published-head CI, native/Core tests, production build and Preview remain pending Root publication and verification.

Root's two confirmed R4 findings supersede the provisional author assessment. Both fixes are returned for independent re-review; neither is self-declared TL PASS. All production/Owner/#917/#1139 boundaries in the historical handoff remain unchanged. Generation 2 made no commit, ref update, remote write, database call, Ready change, merge or activation.

**Generation 2 author STOP:** return the manifested candidate to Root for independent review and reconciliation with remote contract HEAD `78ae1691cb9e8e75a3c353d2be0f83a2e2f82b81`. After publication, actual CI/native findings return as CHANGES REQUIRED to this Generation 2 session while it is available. No follow-up slice is started.
