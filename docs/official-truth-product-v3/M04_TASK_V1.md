# M04 — Durable research jobs and recovery, TASK V1

Root Technical Lead selected this bounded slice on 9 November 2026 after the actual-main MI1 POST-MERGE-PASS. This is the versioned assignment, not a runtime acceptance or installation instruction.

## 1. Authority, baseline and present phase

- Repository: `Jetnity/jetnity`; programme [#1162](https://github.com/Jetnity/jetnity/issues/1162); live continuity [#751](https://github.com/Jetnity/jetnity/issues/751).
- Verified main/base: `7ae1394a00e2b23a60da98d2a029fd6a10c8189d`; tree `2062a975b200d908a59e0c58c5ce5be6001615b6`. [MI1 actual-main PASS](https://github.com/Jetnity/jetnity/pull/1177#issuecomment-6751913752), [closure checkpoint](MI1_POST_MERGE_CLOSURE_V1.md).
- Branch: `feat/official-truth-v3-durable-jobs-1-20261109`. The seed is documentation only. Its exact published commit and new Draft PR must be read from the live index; no future SHA or PR number is invented here.
- Mode was freshly verified `NORMAL`; special Owner gates remain enabled. Operating Standard §3a permits Root to select the next normal bounded slice. It does not let an author start a further slice.
- Logical implementation author reserved for this new slice: **Jetnity Official Truth V3 Durable Jobs1 — Codex Generation1**. The actual new session must be recorded in the dispatch before work. No author has started at this seed. This is not a resumed MI1 session. Cursor capabilities are unavailable in the current tool inventory; no Cursor UI title/session/dispatch is claimed.
- Root is exclusive publisher, integrator, PASS/Ready/merge authority. The author must **do not mark Ready; do not merge; do not start a follow-up slice**. Immediate review corrections return to the same actual author session.

**Authorisation now: Phase A, documentation and source pins only.** Runtime, SQL and tests require Root's explicit versioned Phase-A freeze and finite Phase-B file/API inventory. Propose a needed shared-contract change instead of making it. A complete self-review is input, never TL PASS.

## 2. Product outcome and bounded architecture

Missing entry-requirement research must survive process restarts, concurrent workers and lost acknowledgements without launching duplicate uncertain work or inventing a verified answer. M04 supplies dormant PostgreSQL-backed Rule/Discovery queue state, immutable command/audit history, execution reservations and bounded result metadata. It reopens actual S1 originals/quarantine and consumes actual MA1 authority at the final native transaction boundary.

Reuse the existing S0 contracts, M1 queue/worker, E1 integration, I1 import, S1 intake and MA1 method authority. There is one authoritative original store (S1), one method authority (MA1), and the existing Accepted/version/cache chain. M04 is neither a second Accepted registry nor another copy of proposal bytes, import decision bodies or provider-derived authority.

Delivered code remains unbound to application routes, hosted databases, schedulers and real producers. Completion of a research queue item is not accepted-rule publication. The separate D1 method packet (#1169) remains Draft and NOT_APPROVED.

## 3. Planning topology and ownership

**SINGLE_AGENT_IMPLEMENTATION with parallel read-only specialist review.** SQL ownership, the MA1 private receipt, execution reservations and outer invocation lifetime form one tightly coupled contract. Parallel implementation writers would introduce unsafe intermediate semantics. Root therefore assigns one new implementation author on this branch, with separate SQL/security and runtime/recovery reviewers. Root actively reviews throughout. Reviewers cannot edit implementation or dispatch work.

Phase-A author may create only:

1. `docs/official-truth-product-v3/M04_PLAN_V1.md`
2. `docs/official-truth-product-v3/M04_PHASE_A_SOURCE_PINS_V1.json`
3. `docs/official-truth-product-v3/M04_PHASE_A_SELF_REVIEW_V1.md`
4. `docs/official-truth-product-v3/M04_PHASE_A_STATUS_V1.md`

Root owns this task, current pointers, the input advisories, acceptance/finding records, publication and continuity. Do not edit them. No Git mutation/push, package installation, dependency download, native SQL/socket execution or hosted operation by the author.

Provisional Phase-B paths, **not yet permission to edit**:

- A finite new module under `lib/readiness/official-truth-product-v3/jobs/`, including its named tests.
- A finite new SQL candidate, guarded rollback and native fixtures under `scripts/db/official-truth-v3-durable-jobs-1/`, outside `supabase/migrations/`.
- Only the necessary private code-owned factory bridge in `lib/readiness/official-truth-product-v3/method/authority-postgres.ts` and its `authority.test.ts`. Exact proposed exports, internal custody and tests must be frozen first.
- M04-specific documentation/evidence named in the freeze.

Existing S0 DTOs, method contract, generic queue/worker/integration ports, `monitor/internal.ts`, `monitor/runtime.ts`, S1 code/SQL/codecs, MA1 SQL/rollback and existing grants/roles are protected. No package/lockfile, workflow, global test timeout, build configuration, assets, source registries, UI or unrelated product change. If the plan cannot satisfy the boundary, identify the concrete incompatibility for Root; do not quietly extend the scope.

## 4. Required Phase-A deliverable

Read START_HERE, Operating Standard, current handoff, ACTIVE_WORK_STATUS, this task, actual source and the pinned advisory inputs. Do not turn historical planning hypotheses into current evidence. The later uncertainty advisory corrects the earlier internal-role privilege assumption.

The plan must contain executable-level specifications rather than aspirations:

- Exact new/changed files and exported/private TypeScript APIs; closed operation/response unions; runtime defensive-copy and validation rules; full source SHA256/Git-blob pins.
- Every physical SQL schema, role, table, constraint, index, function/signature, owner, caller grant, default-ACL precondition, installer precondition and dependency edge. Include the complete finite command inventory and canonical preimages.
- Transaction-by-transaction lock acquisition, lock order, CAS/readback/audit writes, post-wait wall-clock checks, real MA1 check, commit and ambiguous-response reconciliation. Include every operation that may wait and where its remaining budget is sampled.
- The stable work subject, queue cycle and exact execution attempt identities; state machine and full old-history blocking rules; the atomic successful and known-failure dispositions described below.
- Actual Rule and Discovery producer/S1/result/queue chronology, including crash points. No synthetic Map fixture as native persistence proof.
- Ownership map for each actual native promise, slot, abort listener and terminal cleanup, including nested I1/S1 operations and late callbacks. Separate terminal native work from an uncooperative external producer promise.
- Exact bounded sizes/capacities, collision behavior, fail-closed quota policy, database codec parity and no sensitive raw/error persistence.
- A finite unit/native proof matrix tied to named existing CI entry points, with realistic cleanup and total CI budget. New native tests must be mandatory through the existing `test:core` discovery, not skip on missing dependencies.
- Known limitations, P0/P1/P2/P3 risk table, rollback and all still-closed Owner gates.

Stop after the four Phase-A files. Root and independent specialists must accept and freeze the design before Phase B. A contradictory or incomplete plan receives CHANGES REQUIRED in the same session.

## 5. Identity and immutable command truth

Distinguish three levels:

1. **Work subject:** kind plus the existing semantic normalisation of the complete context/fact/method reference; Discovery uses its complete pair/method identity. Reuse the actual S0 context normalisation, which strips support metadata and normalises expression structure. Retain original full context as evidence as well.
2. **Queue cycle:** the exact job key, job ID, enqueue operation, full job and full command. Existing valid re-enqueue after terminal work is a new cycle, not evidence that earlier execution became safe.
3. **Execution attempt:** exact original canonical claim, operation, fence/lease, method and package binding, actual MA1 approval epoch and immutable execution journal.

`jobKey` and other hashes are locators, never sufficient identity proof. Compare and retain full canonical semantic preimages. Same semantic context with different support metadata, normalised condition representation or missing/recheck reason must not create an uncertainty escape namespace. A genuine hash/full-identity mismatch refuses; it must not create an alternative bucket.

The generic commit DTO does not carry the original claim input. The private per-invocation composition must defensively copy and retain the exact closed `{ operationId, jobKey, leaseId, leaseMilliseconds }` before entering the generic coordinator. Recompute the existing `queue-command` identity for `action: claim`, compare all fields and the original leased record. No inferred claim duration, mutable caller object, unknown keys/getter side effects, global last-claim slot, caller-supplied epoch or exported custody. Specify equivalent complete command inventories for other actions.

Command replays must match the original immutable command/envelope and its stored full expected/new records and audit; do not recompute time-dependent CAS bytes using a later `now` and then confuse that reconstruction with the original command. Current revision/fence and actual current authority still govern positive effects. A later record that happens to share a digest is not the original committed readback. Phase A must distinguish immutable replay identity from fresh permission for any new effect.

## 6. Uncertain execution, retries and result custody

All older unresolved attempts for the stable work subject block a new producer start, including after fresh job/enqueue/claim/lease IDs, terminal queue status, backoff/exhaustion, restart, lease expiry, new MA1 epoch, renewed receipt or missing/recheck/support variants. A different method revision has its existing different work identity; cross-revision external exactly-once behavior is not claimed.

The private durable state model must provide these meanings (physical naming may be proposed):

- `ABSENT`: authoritative, serialised proof of no current or historical unresolved attempt. Only this may support a fresh start.
- `START_RESERVED`: reservation committed before producer invocation. Until terminal durable proof, it is unknown. Only the actual reservation winner with a confirmed acknowledgement receives a one-time instance-private start permit. Reconstructed readback or process restart does not mint one.
- `PREPARED`: complete bounded result metadata indexed against actual durable S1 evidence. Original bytes alone are insufficient. Only the still-current original claim/fence may finish it; expired/new fences cannot transfer the result or re-execute the producer.
- `SETTLED_FAILURE`: selected by Root for known retryable failures, but only when the exact privately owned producer invocation ended, all its already-owned native children actually settled and no commit remains ambiguous. Then admit the one owned failure-disposition transaction and persist the release **atomically with the matching Queue-Fail disposition**. The prerequisite drain must not self-join that subsequent transaction; its own terminal completion remains part of the outer drain. Caller failure strings/DTOs cannot establish it. Crash or ambiguity before that joint disposition preserves the unknown blocker.
- Successful settlement: exact original prepared result and corresponding Queue-Complete disposition must be durably tied together before the blocker can be cleared. Lost completion acknowledgement reconciles the original immutable command; it cannot start new work. Afterwards an explicitly valid new cycle follows existing policy.

A crash between reservation and producer start may remain conservatively blocked. Do not claim provider cancellation or external exactly-once. A human- or automated uncertainty-resolution workflow is outside M04; never silently release unknown work on time, count or convenience.

A read-only preflight avoids futile claim attempts, but is only an optimisation. Claim/reclaim/re-enqueue CAS must repeat the blocker predicate under the same stable-subject serialisation after real waits. Refusal changes no attempt/revision, records no successful command acknowledgement and does not disturb an active producer through generic `fail(commit_unconfirmed)` or `verification_unavailable`. A generic fail cannot redefine unknown as settled.

Use bounded, transactionally maintained blocker/index state with auditable full history; do not examine only the latest row, cap away older unresolved attempts, expire them by TTL or delete them under quota pressure. Quota failure is closed. Define the proof that the materialised blocker and immutable history cannot diverge.

## 7. Actual import and original-store chronology

Rule execution uses actual I1 submission into actual S1 quarantine. Its prepared/escalated import decision reference is retained in the bounded execution index. Queue completion then allows the actual integration path to reopen S1 originals and repeat actual I1 verification with the same decision reference. Do not invent a new decision-reference meaning or persist a second decision body.

Discovery captures actual S1 originals, indexes a bounded unique digest set, completes the original queue claim and permits the existing later I1 path. Include full readback, missing/incomplete/quarantined mismatches, ordering and stale-fence cases. Prepared result and recovered original bytes must remain bound to the full request, method and original claim. The permissive worker unit fixture is not authority to transfer results; the existing integration fence check remains binding.

Only a definite owned terminal failure can use the private known-failure path. Import or native acknowledgement uncertainty remains non-positive and blocks redispatch. Public result envelopes must not leak native handles, raw exceptions, identity/security information or unvalidated proposal data.

## 8. Real MA1 check and private factory

The existing two-operation MA1 authority has private WeakMap custody of binding, epoch, observation and monotonically shrinking deadline. It has bounded active reads, drains actual work and does not expose an epoch inspector. Preserve those semantics and the S0 method contract.

Propose one private code-owned composition that creates the method authority and fixed M04 operations together. It may consume the opaque receipt internally; it must not export `Held`, epoch extraction, serialisable permit, arbitrary SQL callback, raw connection, role switch or general executor escape.

The final native transaction invokes actual `require_current_locked_v1(text, integer, text, text, integer)` on the exact method/package/epoch after all other known job/S1 waits. Lock and revalidate the exact tuple with fresh database clock/remaining budget through the final writes. Keep the authority lock through commit. Test real revoke/reapprove/expiry/contender waits. A JavaScript boolean, fake callback or matching digest is never the actual authority check.

Do not claim that an early wall-clock check proves a future commit time. If the deadline expires after dispatch or commit acknowledgement is lost, the public result is non-positive/unconfirmed; only the exact operation can reconcile the persisted outcome. No second mutation under a new operation ID as an acknowledgement repair.

## 9. Owned native lifetime and capacity

Do not change the generic `invocationBudget`/`Promise.race` contract globally. Supply a private owned outer entry scope that registers actual terminal native promises **before** acquisition/dispatch, including nested MA1, I1, S1 and M04 calls. Inner generic timeout may return non-positive; the outward adapter promise must seal admission, abort and join all already-owned native children before settling.

After sealing, even a late producer callback cannot admit SQL. Distinguish finite native work from an uncooperative external producer promise; do not detach native cleanup or claim a provider has stopped. Specify how failure custody becomes available only after actual owned terminal evidence.

Use finite preallocated/fail-immediate capacity and bounded registries. A slot remains occupied through actual native drain, not only until a raced JavaScript result. Test acquisition, query, lock, commit, lost-reply, abort, post-timeout child callback and capacity exhaustion with exact counters and zero pending handles. Existing MA1 read concurrency/deadline must not be widened.

## 10. SQL ownership, grants, dependency and rollback

The MA1 native fixture's internal `postgres` role is `NOLOGIN NOINHERIT NOSUPERUSER BYPASSRLS`; BYPASSRLS does **not** grant schema USAGE or function EXECUTE. Existing S1 objects are owned by `ot_v3_intake_owner` and exposed only through their specific caller contract. Do not assume internal superuser or silently widen existing privileges.

Preferred new-object-only bridge, to specify completely in Phase A:

1. A fixed SQL-standard-body helper in the new M04 schema, owned by `ot_v3_intake_owner`, explicitly `SECURITY DEFINER`, fixed safe search path, which calls actual S1 `read_v1(jsonb,text,integer)`. Grant only this new helper's needed execution to the internal role. Validate/consume the actual complete reply; a dead dependency expression is not the readback.
2. A fixed internal-role-owned helper/final wrapper that consumes the real MA1 checker and S1 helper. SQL-standard parsed bodies (`BEGIN ATOMIC`/appropriate SQL body) establish actual OID dependencies. String-body PL/pgSQL alone and dead reference tokens are insufficient. Prove execution/lock ordering, not expression order assumptions.
3. A new narrow `NOLOGIN NOINHERIT` caller receives only fixed M04 operations. No direct tables, helper/checker access, MA1 oracle, SET ROLE, ownership or arbitrary SQL. Enumerate schema USAGE/CREATE, owners and all effective ACLs explicitly.
4. Pin installer preconditions, creator role/default ACL state and allowed role changes. Reject foreign/unexpected inherited creator grants before any normalisation. Create objects, revoke default PUBLIC access and grant only intended access in the same candidate transaction. Do not modify existing role definitions, grants/default grants, candidates or rollbacks.
5. No STRICT/NULL short-circuit that skips a required check; closed NULL/error/result handling, correct volatility and parallel safety. Codec and direct-RPC validation must remain fail-closed.
6. Existing S1 and MA1 `RESTRICT` rollbacks must atomically refuse while this companion exists. Test MA1 dependency with empty authority history so its independent history guard cannot mask the dependency. S1 owner-object dependencies are deliberate, not permission to change its rollback.
7. Remove the new companion first, then use unchanged predecessor rollbacks. M04 rollback must itself preserve non-empty durable/audit/unknown history with a guarded refusal. No CASCADE, DROP OWNED, REASSIGN OWNED, privilege normalisation or destructive history purge as teardown.

Native CI installer may use its existing fictional admin fixture to install these candidates; runtime callers must prove the narrow non-superuser identity. This does not establish hosted installer capability or authorise any hosted installation.

Primary reference basis (software docs only): [PostgreSQL 16 privileges](https://www.postgresql.org/docs/16/ddl-priv.html), [dependencies](https://www.postgresql.org/docs/16/ddl-depend.html), [CREATE FUNCTION](https://www.postgresql.org/docs/16/sql-createfunction.html), [ALTER FUNCTION](https://www.postgresql.org/docs/16/sql-alterfunction.html), [explicit locking](https://www.postgresql.org/docs/16/explicit-locking.html). These links do not authorise real entry-rule source or provider requests.

## 11. Mandatory proof families

Plan named assertions, actual database observations and cleanup evidence for:

1. Same work after fresh queue cycle, exhaustion/backoff, missing/recheck, support/condition normalisation, method reapproval/epoch, restart/expiry: old unknown still blocks; no new producer/native attempt side effect.
2. Genuine full-identity/hash collision and malformed/cross-method command: fail closed without a second bucket or authority grant.
3. Concurrent start reservation, response loss, kill/restart before/after producer start: at most the confirmed original winner may execute; no reconstructed start permit.
4. Preflight/CAS race, claim/reclaim/re-enqueue transaction waits, immutable command/audit consistency, no attempt consumption when blocked, unrelated subjects remain independent.
5. Replay exact original canonical claim versus forged duration, fence, operation, mutated object/getter/extra key; no generic fail that disturbs an active producer.
6. PREPARED resume on original valid fence, expired/new fence refusal, missing or mismatched S1 evidence, no result transfer/producer rerun.
7. Queue-Complete commit/lost acknowledgement and readback, successful settlement/history preservation, valid later new cycle without resurrecting old results.
8. Known failure with all native work drained, atomic Queue-Fail plus SETTLED_FAILURE; crashes/ambiguity/forged failure strings leave unknown blocked.
9. Older unknown beyond recent histories/caps, quota rejection, index-history divergence defense; no TTL/scan-window amnesty.
10. Actual Rule and Discovery integration through S1/I1, original bytes/decision references, restart and privacy boundaries, unique bounded digest metadata.
11. Actual current MA1 approval, package/epoch mismatch, revoke/reapproval and expiry during waits; whole native transaction fails atomically with no authority replacement.
12. Direct SQL/role/ACL/NULL/default-grant/forged-body attacks, consumed OID dependencies, exact candidate inventory, safe apply/rollback refusal and companion-first clean empty teardown.
13. Outer ownership before dispatch, actual acquisition/query/lock/commit/abort/late-callback drain, capacity, monotonic deadlines and zero leaked native processes/connections; no global timeout weakening.
14. Existing source pins and all prior protected guard/affected tests remain enforced; no environment-dependent native skip. Positive paths and negative/crash/recovery paths run against actual existing contracts, not an alternate adapter-only model.

Local named offline tests may later reuse the already present dependency cache, documenting local Node24 versus CI Node22. Sixteen binary contents are absent; preserve their Git IDs/skip-worktree state. Do not fetch/reconstruct binaries, install packages, claim a local full build or run local PostgreSQL/native/socket probes. Real native evidence comes from the existing GitHub CI fixture only. Auth CI is metadata only; never inspect its logs or infer hosted state from it.

Root final gating requires complete independent source/SQL review, exact-head full CI and mandatory native diagnostics/cleanup, exact Vercel Preview, review threads, live main/merge-base/ahead/behind, mode/Guardian/rules and special gates. Every new head invalidates prior exact-head acceptance. A normal later merge needs actual-main CI/Production verification; neither CI nor Vercel READY is product activation or database installation.

## 12. Non-scope, risks and hard STOP boundaries

No Accepted/version/history/cache publisher, real source qualification/research provider, scheduler, outbox/escalation delivery, upload route, hosted credentials/install/migration/Auth/RLS/ACL inspection or mutation, notification/new cost, public entry feature or method approval. No change to the six product goals/source rule: one clear qualified destination primary source is sufficient, optional independent official counter-source absence alone does not block; real contradictions remain blocked.

- **P0/P1 prevention:** no false Accepted/public answer, authority/custody escape, privilege widening, duplicate uncertain producer start, stale-fence result transfer, acknowledgement fiction, dropped history, sensitive original/error leakage or detached native write.
- **P2 residuals:** bounded dormant adapter is not operational service; unknown execution may conservatively block until a later separately authorised resolution workflow. Public p95 target remains unproven. Existing dependency findings are unclassified, not cleared by M04.
- **P3 residuals:** inherited narrow-screen/text-zoom presentation limitations remain outside this non-UI slice.

Method **NOT_APPROVED**. #1139 **NOT_RELEASE_READY**, 17 pre-Owner gaps. #917 **APPLY_RESPONSE_SUCCESS / INDEPENDENT_READBACK_PENDING**, ledger **UNKNOWN**, Stage2 **NOT_ATTEMPTED**. Never retry, rephrase, delegate, reroute, change transport or human-substitute the specifically refused readback; never ask for the unavailable old Owner evidence again. #1131 Ready STOP, #1135 Research Hold plus independent platform Ready STOP, #968 Preview isolation and #911/#913 Privacy remain.

At any scope/authority conflict stop the affected action and report the exact incompatibility to Root while preserving already useful evidence. Do not invent an approval, weaken a proof or perform a prohibited alternative. Phase-A completion ends at **STOP FOR ROOT FREEZE**; Phase-B delivery ends at **STOP FOR INDEPENDENT ROOT REVIEW**. No automatic next slice.
