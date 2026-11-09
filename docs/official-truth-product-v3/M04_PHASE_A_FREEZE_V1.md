# M04 Phase-A Technical-Lead freeze V1

**9 November 2026, 23:04 UTC — ROOT DESIGN ACCEPTED FOR FINITE IMPLEMENTATION.**

Root independently accepts the exact Phase-A design below and freezes the specified Phase-B scope. This is design acceptance, not runtime acceptance, Ready, merge, method approval, a database installation or production activation. Phase B starts only when Root has published this freeze with the current-main integration, verified the resulting head, and sent the explicit same-session dispatch. The exact publication/dispatch head is recorded in [PR #1178](https://github.com/Jetnity/jetnity/pull/1178), [#751](https://github.com/Jetnity/jetnity/issues/751) and [#1162](https://github.com/Jetnity/jetnity/issues/1162); do not infer it from this pre-publication document.

## Evidence and decision

The binding task is [M04_TASK_V1.md](M04_TASK_V1.md), SHA256 `2b35db258b7e45cb71962592a3af602f38243d86fb3fa48f091565816edc1af2`. The frozen [plan](M04_PLAN_V1.md) is exactly 120753 bytes, SHA256 `1952dc9c930021d32620f769595bb6f1641743574265f918cad6d36cfefdb88e`. Its companion pins, self-review and status are frozen by [author delivery](M04_PHASE_A_AUTHOR_DELIVERY_V1.json) and [Root manifest](M04_PHASE_A_ROOT_REVIEW_V1.json). Their STOP-for-freeze wording is the historical author delivery, superseded only by this Root decision and later dispatch.

Root read the earlier complete V2 plan and complete final delta, full final evidence documents, relevant protected source control flow, and both complete final independent reports. Root independently rehashed all four delivered files and all 49 source inputs against exact seed blobs; every source-existing input is unchanged between accepted source main `7ae1394a00e2b23a60da98d2a029fd6a10c8189d` and current main `be79ea2591e990111bfabea7ddf500023c20a188`. [Source validation](M04_PHASE_A_ROOT_SOURCE_VALIDATION_V1.json) records identity rather than overstating full substantive coverage or execution.

The same independent sessions delivered [SQL/authority review](M04_PHASE_A_SQL_REVIEW_V1.md) and [runtime/identity/lifetime review](M04_PHASE_A_RUNTIME_REVIEW_V1.md), each with no open design blocker. Their exact reports and JSON pins are copied verbatim into this repository; original scratch locators inside them are provenance, not required external evidence. Author self-review was not used as independent PASS. R1/R2 findings were returned to the original author and the changed final delivery re-reviewed. Root agrees that their corrections close the design defects. All implementation proof remains open.

## One writer and the finite write inventory

Author: **Jetnity Official Truth V3 Durable Jobs1 — Codex Generation1**, actual unchanged session `/root/m04_durable_jobs_writer`. Cursor capabilities are unavailable; this is the recorded Codex fallback, not a claimed Cursor session, title or generation. Read-only reviewers remain `/root/m04_sql_phase_a_review` and `/root/m04_uncertainty_advisory`. Root alone controls Git publication, PASS, Ready and merge. Immediate findings return to this same author/session.

The author may create/edit only these eighteen runtime/test/candidate files and four evidence files after dispatch:

- `lib/readiness/official-truth-product-v3/jobs/contract.ts`
- `lib/readiness/official-truth-product-v3/jobs/owned-scope.ts`
- `lib/readiness/official-truth-product-v3/jobs/postgres.ts`
- `lib/readiness/official-truth-product-v3/jobs/composition.ts`
- `lib/readiness/official-truth-product-v3/jobs/contract.test.ts`
- `lib/readiness/official-truth-product-v3/jobs/owned-scope.test.ts`
- `lib/readiness/official-truth-product-v3/jobs/postgres.test.ts`
- `lib/readiness/official-truth-product-v3/jobs/composition.test.ts`
- `lib/readiness/official-truth-product-v3/jobs/native.test.ts`
- `lib/readiness/official-truth-product-v3/method/authority-postgres.ts`
- `lib/readiness/official-truth-product-v3/method/authority.test.ts`
- `scripts/db/official-truth-v3-durable-jobs-1/jobs-candidate.sql`
- `scripts/db/official-truth-v3-durable-jobs-1/jobs-candidate.rollback.sql`
- `scripts/db/official-truth-v3-durable-jobs-1/fixtures.ts`
- `scripts/db/official-truth-v3-durable-jobs-1/native-adapter.ts`
- `scripts/db/official-truth-v3-durable-jobs-1/process-worker.ts`
- `scripts/db/official-truth-v3-durable-jobs-1/native.ts`
- `scripts/db/official-truth-v3-durable-jobs-1/generate-identity-vectors.ts`
- `docs/official-truth-product-v3/M04_PHASE_B_STATUS_V1.md`
- `docs/official-truth-product-v3/M04_PHASE_B_SELF_REVIEW_V1.md`
- `docs/official-truth-product-v3/M04_PHASE_B_SOURCE_MANIFEST_V1.json`
- `docs/official-truth-product-v3/M04_PHASE_B_NATIVE_EVIDENCE_V1.json`

The frozen plan gives each file its exact responsibilities, finite types/exports, six-operation API, seven-table/29-function inventory and U01–U07/N01–N15 proof matrix. Only the old `method/authority-postgres.ts` and `method/authority.test.ts` are existing runtime/test files within write scope; retain their existing behavior and assertions. No unlisted file/export/dependency, package/lockfile/workflow/timeout, generic queue/worker/E1 port, I1/S1/S0/MA1 SQL or rollback, UI, route, Supabase migration, grant on predecessor objects, or existing fixture change is authorized. Report a concrete incompatibility to Root; do not silently broaden scope. Root may make separately reviewed continuity/evidence edits.

## Binding design selections

The full frozen plan is binding, including these decisions whose failure modes drove independent review:

1. **Actual authorities and immutable originals.** M04 stores queue commands/audit and execution metadata only. Actual S1 preserves and reopens full originals and outcomes; actual MA1 is the final current-epoch gate. No second original/decision store, public Accepted/version/cache publisher or approved-method shortcut.
2. **M04-D01 original admission.** Validate the complete Rule original or whole Discovery batch before any S1/I1 effect. Parsed original context/research must already equal their unchanged S0-normalized values; do not rewrite original bytes or impose whole-document whitespace/key-order canonicalization. Existing S1/N1 acceptance stays unchanged. Preserve full conditions, all seventeen predicates, second normalization after support stripping, and the legacy insertion-order identities.
3. **Unknown execution remains unknown.** Every older start without its atomic disposition, including PREPARED, blocks new work for the stable full semantic subject. New IDs, reason/support variants, cycles, epochs, restarts, quotas or elapsed time cannot erase it. Only the actually acknowledged original START winner may call the pure producer. Original same-epoch/live-fence PREPARED continuation never dispatches a new producer. Privately proved known failure requires actual terminal delivery, processing callbacks and native children, no ambiguous effect, and atomic exact Queue-Fail/disposition.
4. **A01 fixed negative probes.** Before potential positive authority observation, serialize and inspect the whole original history. Missing new IDs cannot hide older unknown. Only the original private prepared/owned-failure continuation may traverse its own unresolved terminal path. Recovery `attemptKey` is validated data held privately; it is not a returned start token or epoch inspector.
5. **A02 time and receipt custody.** At terminal MA1 decode after the latest original Held calculation, sample b and derive `r=floor(Held.deadline-b)`; reject nonpositive r and shrink the database cap to observedAt+r, finite approval expiry and prior caps. New joint-factory same-Held observation/effect admission is exclusive through actual acquisition, query, commit/ACK, cleanup, decode and final check. Preserve the standalone factory's old concurrency contract. Native deadline is anchored before any waits and never reset. Staged immediate effects and actual S1 checks precede actual MA1 and fresh final clock. Ambiguous or late ACK remains unconfirmed after drain, never a claimed rollback.
6. **A03 terminal capacity.** A new claim reserves its exact terminal ledger credit; interstitial commands cannot consume it. Claim/start/admission/result/disposition caps refuse before losing the ability to finish. Prove the specified 254/255/256 command and 64-start boundaries, including the sixteen reserved final native admissions.
7. **Owned lifetime.** Four outer lanes, bounded native pools and callback ledger remain finite. Delivery ending does not end S1/I1/preparation. All actual evidence/history callbacks are admitted and counted before dispatch. Sealed/expired scope admits no late SQL. Uncooperative nonnative work retires its lane until actual termination; no TTL/reset. A final failure transaction belongs to the outer scope and cannot wait on itself.
8. **Finite SQL privilege/dependency/lock boundary.** Preserve S1's hardened existing default ACL. New-only fixed owner bridges consume the actual nine S1 and two MA1 predecessor functions with direct parsed dependencies and exact source/catalog checks. New caller gets only its new API. All six operations use the frozen ROW EXCLUSIVE relation order, request-derived sorted signed advisory tokens and subject serialization. No late lower token, runtime global exclusive mutex, deferred application effect after authority, CASCADE, history purge or protected grant/default normalization. Empty companion-first rollback accounts for all29 functions; native 2BP01 predecessor-dependency proof must have empty history and clean known fixture memberships.

### Two explicit control-flow allocations from the final runtime review

These are implementation allocations within the existing design, now expressly frozen by Root:

- After validated actual COMMIT acknowledgement, terminal cleanup and decoded Complete/Fail CAS result, retire the private unresolved-only continuation **before** the unchanged generic `confirmed()` calls its post-CAS `storage.read()`. The ordinary null-continuation read then proves the settled history/current state under authority. Query rows, partial/ambiguous acknowledgement or outward timeout never suffice to clear custody. Exact committed-command reconciliation is observation only.
- Sealing after PREPARED seals the original delivery/capture/I1/preparation subtree. Queue Complete and subsequent E1 artifact reopen/repeated I1 are separately classified outer-owned work; do not reopen the original subtree. Every later evidence/history callback still counts in the same per-invocation eight-active/128-cumulative ledger and lane retirement. Successful original recovery/Complete/E1 and known-failure tests must include the post-CAS read and later ownership path.

## Proof and delivery gate

Implement the complete finite plan, then deliver exact byte/source manifests, status and self-review. Do not mark runtime complete from structural tests or fake storage. Named offline TypeScript/unit checks may use the existing dependency cache and must exclude all native entry files; no installation/network or missing-binary retrieval. Local Node24.22.1 differs from CI22 and sixteen absent binary blobs forbid a local full-checkout/full-build claim.

**No local PostgreSQL, native SQL or socket execution.** The new unconditional `jobs/native.test.ts` must be discovered by unchanged existing `test:core` in GitHub CI. PostgreSQL unavailable/startup failure is failure, not skip. Existing workflow/package/30-minute cap remain unchanged. The plan's new suite budget is240 seconds effect work plus60 seconds cleanup, three owned clusters and at most two child processes. Actual budget, worst-valid262144-byte wire, complete16-original Discovery path, parity, RLS/ACL/dependencies/rollback, lock waits, independent-process restart, ACK loss and drain are future native evidence. No fabricated or availability-dependent PASS.

Root reviews exact source before publication, submits concrete findings to the same author, publishes only finite checked work, and independently reviews actual CI/native logs, exact-head Preview, current main/diff/ancestry, open threads and special gates. Any changed head invalidates previous exact-head gates. Auth CI is metadata only. Phase B ends at author delivery/STOP for Root review; no automatic next slice.

## Live release baseline and integration

PR#1178 seed `14889b050bc6e8b814bc778730c80f70d20c0d47` was independently observed OPEN/DRAFT at23:01UTC. Live main is `be79ea2591e990111bfabea7ddf500023c20a188`, tree `60c349e3fdbe3c31a28d7af1282f9f242cc94cf4`, after unrelated Booking PR#1179 merged22:32:16UTC. Exact local Git-object reconstruction confirms old7ae merge base, M04seed ahead1/behind2; its six upstream changed paths do not touch M04/protected inputs. Root will preserve their exact bytes through a two-parent freeze commit, not overwrite or silently rebase them.

Current-main CI42712761377 attempt1 finished SUCCESS22:48:01UTC, all8jobs successful. Both `jetnity.com` and `jetnity-app.vercel.app` were READY on deployment `dpl_3EJhkpbtraFP3yYAxDNuAkJt3z9v`, exactbe79, with aliasError null. This is live release metadata, not a new whole-release acceptance or an M04 test result. Seed CI42704979011 and previewdpl_9wqQMP77fupvKCxFmtxFTQMff2q4 refer only to14889; the freeze publication requires its own new-head metadata and later runtime its own full gates.

## Unchanged Owner boundaries and risks

Method **NOT_APPROVED**. #1139 **NOT_RELEASE_READY**,17 pre-Owner gaps. D1#1169 remains separate OPEN/DRAFT. #917 remains APPLY_RESPONSE_SUCCESS / INDEPENDENT_READBACK_PENDING, ledger UNKNOWN, Stage2 NOT_ATTEMPTED; its specifically refused readback must never be retried, rephrased, delegated, rerouted, transport-switched or replaced by human SQL. No renewed old-evidence request. #1131 Ready STOP; #1135 Research Hold plus independent platform Ready STOP; #968 Preview isolation; #911/#913 privacy remain.

No Hosted DB/Auth/RLS/ACL/migration/credential read or change, real entry-source/provider/research, scheduler, notifications, new cost or public V3 feature activation. All Git reads use GIT_NO_LAZY_FETCH=1. No fetch/push or missing-binary retrieval. Root alone uses finite GitData publication; author no Git mutation/Ready/merge.

P0/P1 prevention is design-reviewed and still needs actual code/native acceptance: authority, privacy/full identity, original uncertainty, concurrency/atomicity and terminal lifetime. P2 limits include deliberate unknown/lane/quota unavailability, missing operational source/provider/scheduler bindings, missing publicp95 proof and inherited unclassified dependency findings. P3 inherited narrow-screen presentation limits are outside this slice. Design acceptance does not close these implementation or operational risks.
