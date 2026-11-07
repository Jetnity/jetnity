# Official Truth Atomic Version Refresh 1 — TASK V1

Date: 2026-11-07. Explicit Technical-Lead selection, issue #1152; parents #917 / #741.
Baseline main: `a2a3f175670dd7744dbb56ed81fee70c38bbdf38`.
Baseline tree: `2e8c1e12ffe3bfa794ec9f8a41089f901bff6098`.
Author: **Jetnity Official Truth Atomic Version Refresh 1 — Codex Generation 1**.
Actual intended session: `/root/atomic_version_refresh_writer`.
Branch: `feat/official-truth-atomic-version-refresh-1-20261107`.
Status: selected, implementation not yet accepted. Root alone decides PASS/Ready/Merge.

## 1. Proven gap and one coherent outcome

The existing durable original/provenance store, protected separate review, publication/binding, lifecycle log, full unique-current lookup and #1151 canonical reader already exist. The refresh comparator only compares source content. Supersession is exercised separately by native tests; there is no functional atomic version-advance coordinator.

Implement one dormant native-local refresh operation: a fully re-proved, separately reviewed successor replaces the exact expected predecessor atomically, keeps immutable historical material, and is read after acknowledged COMMIT and producer closure by the existing fresh canonical Requirements reader. This completes the missing update transition of the current local versioned database chain. It is not a new store, rules engine, source parser, production capability, app adapter or prerequisite for the first current-request-only CH→DE pilot.

The app already has current trip loading, explicit linked-passport selection, request/Save/Reserve/Recheck, Requirements and UI invalidation. Do not rebuild those.

## 2. Binding precheck and preserved authority

Root independently refreshed main, former branch (0 ahead / 1 behind, merge base 0412daafb94f608fbeeb040d4bdc774bc2b2253c, zero files), 12 open Draft PRs, 47 open actual issues, no new #748/#1139 messages, no #1151 review threads/reviews, active Ruleset21875372 without bypass. Main CI42391511234 attempt1 SUCCESS; Production dpl_uf3K6E2ZN4hreV1FRBS54Ar3WrAR READY on this main; both deployment URL and jetnity.com again HTTP200 with exactly that embedded deployment ID. Latest full checkpoint: #751/6710201036; feature checkpoint: #917/6710219234; #1151 post-merge PASS6710150533.

Operating mode NORMAL. The read-only finite scope assignment is #751/6710457677. Independent app-path review confirms that using the #1151 synthetic reader as an app provider would cross an authority boundary, not fix missing wiring.

Read AGENTS, START_HERE, operating standard, named handoff, ACTIVE_WORK_STATUS, current checkpoints and relevant Vision/Architecture/Roadmap/Decisions/Design/Quality/Logic/Review/Continuity standards. Historical dated snapshots do not override current Root evidence. Follow the autonomy directive and #294; full durable/updatable rules and the whole entry checklist remain the product goal.

Development yfvbxvijcorffwxbxahl: Stage1 APPLY_RESPONSE_SUCCESS / INDEPENDENT_READBACK_PENDING; actual new ledger ID UNKNOWN. Stage2 NOT_ATTEMPTED. No platform clearance exists. No retry/rephrase/alternate agent/tool/operator/access route for the refused readback. Owner comment6709672161 is recorded with scope audit6709716827: existing rls/repro scripts mutate in rollback transactions, rechte overlaps refused catalog work, and all are public-only. None were executed.

#1131 remains held after platform refusal of Ready (6673392103); no retry, direct merge, copied code or alternate PR integration. #985/#937/#913 and special PO gates remain. Cursor quota-paused. No hosted SQL, Auth probes, secrets, government/network retrieval, production apply, provider/pilot/accepted-reader activation, settings or paid-service changes.

## 3. Frozen foundations

Reuse byte-for-byte unless a later explicit versioned TL amendment says otherwise:
- Original lifecycle SQL 20261011111839: blob36b525580509069039ca6787c25a0a5b94155986.
- Current lookup SQL 20261023153726: blob609d10b9727e5fa4f91896d64086798e989ae50b.
- Original custody storage.ts e770e0c39ec44698372ba9518017cebb572bde4f.
- Current lookup.ts 466482c09cf5c75cc81c87e77c2b36eb5d9de1bf.
- #1151 projection.ts 2e09db2b6aaee16d7e4faa09170559acb5d40748, contract.ts 3a0097c3f9e5b7fc931bb5c6bd1003f275cf7d04, reader.ts 38ba8e8d7de0774db97155cd3903f20234fcc9d4, SQL wrapper e047210de9ea6f6799dc919db4a41182064acc65.
- Controlled Runtime 1b2d2cef10db9aa75c870c737e6cc76326c2cda2; engine4e0d948c915cd60295d2a8d876db983c5df5301f; entire existing corpus/profile/extractor/policy and content-identity import boundary.
- Existing integrated semantic/storage/full closure verifier, pg-wire/LocalProofCluster, sources/identity/acceptance/review/rule/Requirements implementations and all existing tests.
- Existing migrations and migration/apply paths, lockfile and dependencies.

The only source scope is the existing fictional CH→GB primary/composed corpus, synthetic-pilot-authority, Protocol1, fixed exact JSON grammar. No actual immigration claim. Real positive visa cells remain zero.

## 4. Refresh contract and explicit limited capability

### 4.1 Closed scope and fresh evidence

The new script-local coordinator owns fresh local connections and uses the existing unforgeable LocalProofCluster context. Copy/validate all caller material before the first await. No arbitrary client, callback, clock, connection, current-version list, source registry, authority flag or fabricated successful result may be injected as an approval shortcut.

The positive successor must carry the complete verified implementation/provenance bundle and exact original bytes, with a separate existing review bound to its fingerprint, packet and ordered support digests. Reuse prepareOriginals, verifyLocalIntegratedPilotBundle and projectHistoricalCanonicalRequirements for actual precommit canonical re-proof; a hash-consistent false fact is insufficient. Do not create a second extractor or silently rewrite proposal/evidence/review fields.

This first refresh contract is explicitly **unchanged qualified source content and unchanged canonical fact**, with strictly later new source observations/evidence versions. Require exact same cell definition/scope/fact kind, source/content/representation/profile/Extractor/Policy identities and ordered support bindings. Require new accepted retrieval/reference times to move forward and new review/support/receipt identities; reject a downgrade, mixed/new-old support set, reused observation, unrelated cell, changed/unsupported bytes or changed fact. Re-observation is not a legal change. Do not bypass the full chain merely because hashes match.

Two independent actual runFreshControlledSyntheticPilot executions generate positive before/after fixtures. Its clock is second-granular: execute at genuinely different observation times; if identities coincide, refuse rather than synthesizing a later timestamp. Keep all returned implementation capsules. Do not use alternateSameIdentityReceipt or hand-rehashed time/fingerprint mutations as positive fresh execution evidence. Explicit corruption fixtures remain valid negative tests.

### 4.2 Exact atomic transition

Expected predecessor fingerprint and an externally supplied current lifecycle witness are mandatory preconditions, never caller choices of whichever record is convenient. Preserve the established lock order: existing provenance publication locks FIRST, original lifecycle head UPDATE lock SECOND, exactly as the existing writer. Do not acquire the head and then wait for provenance locks. After the head lock and AFTER every relevant wait, re-check the witness and require the complete existing lookup to select exactly that predecessor; preserve all accepted-corpus closure checks and ambiguity refusals. Provisional publication before this CAS is part of the same transaction and must fully roll back on refusal.

In one owned READ COMMITTED transaction: publish the full successor through the existing publication path, bind/re-prove its separately reviewed originals, append the predecessor supersession, and prove the successor is now the sole current matching version. No transaction boundary between these steps. A failure rolls back the newly published receipt, original/binding/event/transition changes together. A separate preexisting review is merely preauthorization and may remain; it is never an accepted rule.

**Explicit TL delegation:** a new minimal LOCAL-ONLY NOLOGIN/NOSUPERUSER/NOBYPASSRLS/NOINHERIT refresh role may receive EXECUTE solely on a new narrowly paired refresh function. That function may exercise the existing protected bind/supersede operations only for this exact reviewed same-content/same-fact Old→New transition under the fresh CAS witness. This is a deliberate limited combined transaction capability, not broad producer↔reviewer↔lifecycle membership. The separate reviewer remains separate. No arbitrary withdrawal, profile/source change, delete, owner identity, AAL2 assertion, table grants or app/service-role capability.

A new SQL wrapper must use the verified existing definer owner, empty search_path, UTC, PUBLIC revoke and exact restricted grants. Install refuses incompatible/preexisting objects instead of replacing silently. It lives outside supabase/migrations and canonical apply paths. One small immutable transition-receipt table is allowed only if necessary to prove Old→New/idempotency; it is audit, not another rule store or lifecycle authority. Bind its predecessor/successor and before/after witness to the actual transaction; apply forced RLS/no direct public/anon/authenticated/service-role access and immutable history. A protected rollback removes only this package's exact objects with RESTRICT and preserves all prior objects/data/grants.

V1 refresh requires a still-usable predecessor at selection, after waits and immediately before supersession. Re-prove its complete originals/provenance, source/profile validity and actual time bounds. Stale/expired/withdrawn/conflicted/superseded/disposed predecessors are refused, never resurrected. Requalifying an already unusable baseline is outside this mode and remains explicit remaining work. Do not renew a checkpoint, invent historical freshness, extend retention or weaken this boundary.

### 4.3 Idempotency, concurrency and outcomes

Repeated operations cannot duplicate acceptance/supersession or silently replace a newer winner. A stale witness is never an idempotency shortcut. An already-completed same Old→New transition may be recognized only under a fresh current witness and full exact transition/current-state proof, without writes. If safe recognition is unavailable, explicit refusal plus zero mutation is required; do not pretend success.

Two competing successors must produce at most one winner. Late lock acquisition must recheck witness, expected predecessor, source/currentness and limits. Existing check_head/checkpoint trust boundary remains; never bootstrap/renew authority by reading the current DB cursor after conflict/restore. No hidden retries.

Bound every operation, SQL/lock wait and commit. Preserve every existing query/lock/idle/commit/reader deadline and all existing tests. New refresh limits are finite named constants, justified from the operation; they do not extend source/lifecycle bounds. Abort before commit rolls back/terminates. Lost COMMIT acknowledgement is commit_outcome_unknown, not success or claimed rollback. Post-commit read failure is separately recorded as committed but unverified; do not auto-retry, undo or expose the old positive value.

### 4.4 Fresh post-commit read

A positive completion requires acknowledged COMMIT, closed producer, then the unchanged #1151 reader on genuinely fresh independent reader backends. It must select the successor from the entire store and perform original/provenance/historical Review/canonical Rule/Requirements re-proof, never accept producer-memory evidence as readback. Preserve all reader lifecycle/time/cancellation checks through return.

Return bounded immutable sanitized metadata, real commit/readback status, Old→New identity and current witness, source-content comparison explicitly unchanged and ruleChange not_asserted. No raw originals, keys, personal data, reusable capability or positive cache. productionAcceptedRead NOT_AUTHORIZED; positiveRealVisaCells0; synthetic-local status explicit.

## 5. Allowed files

New package only:
- scripts/db/official-truth-atomic-version-refresh-1/{contract.ts,refresh.ts,refresh-candidate.sql,refresh-candidate.rollback.sql,fixtures.ts,native.test.ts} as needed.
- lib/readiness/official-truth-atomic-version-refresh-1.test.ts: focused contract/import-isolation regression tests, not production import.
- This immutable TASK and docs/OFFICIAL_TRUTH_ATOMIC_VERSION_REFRESH_1_HANDOFF_2026-11-07.md.
- Additive scoped sections in ARCHITECTURE.md, ROADMAP.md and DECISIONS.md.
- package.json and .github/workflows/ci.yml only for the explicit test integration below.

Do not fabricate live retrieval envelopes from retained metadata to call the higher-level refresh-diff helper. Reuse lower-level comparison over fully re-proved source values if needed.

No other source/fixture/migration change without a versioned TL amendment. Existing exported seams are sufficient for initial implementation; escalate a proven gap instead of altering frozen code. No global startup/status rewrites. Root owns issue/PR/current-state records.

## 6. Meaningful acceptance

Native PG16, actual data and independent backends; keep complete phase diagnostics:
1. Primary and Composed: two actually executed fresh observations, separate full successor review, actual atomic publication/supersession, acknowledged COMMIT, producer gone, fresh #1151 read returns exactly successor and one synthetic visa evaluation; old version is no longer usable. Retained old audit/originals unchanged.
2. Same-content new retrieval/version is shown truthfully; no asserted rule change. Unsupported/changed content, forged rehashed fact, changed identities/scope, out-of-order/mixed supports, reused/older timestamps and missing/mismatched review cannot retire the predecessor or leak partial changes.
3. Injected failure after real new binding and before supersession, and after actual supersession before COMMIT, produces complete rollback. No helper merely returns a mock failure.
4. Duplicate attempt under stale witness refuses without mutation; under fresh witness either exact proved no-op or explicit safe refusal. No second event/receipt. A later competing winner remains current.
5. Real concurrent competing refreshes and reader/writer lock-wait barrier. Verify at most one commit, loser rechecks after waiting, and readers see either a valid prior snapshot before the transition or the new unique current state, never partially committed/ambiguous positive state. Cancellation/timeout leaves no leaked lock.
6. Currentness loss while waiting; source/profile withdrawal, ambiguous/damaged corpus, expired/disposed originals, and relevant bounds fail closed. Prove that an already stale predecessor and one expiring during the operation are refused without a partial transition; stale requalification remains outside V1. Reuse unchanged tests for unchanged controls and identify reuse honestly.
7. Restricted role/ACL/direct-call bypass attempts, package-only rollback, no hosted/App import path, preserved synthetic/activation gates.
8. Distinct unknown-COMMIT and acknowledged-commit/readback-failure outcomes with no false positive or automatic replay.

No skipped intended native criteria or time-rehashed positive fixtures. Runtime limits cannot be loosened automatically to get green.

## 7. CI organization, cost and release

Use existing standard runners/dependencies, no paid/new infrastructure or settings. Preserve test:core and test:persisted-native exactly. Add one complete test:refresh-native command and include it in npm test. The new native file is outside the core glob. Add one isolated fresh standard-runner refresh-native job (20-minute job, maximum900-second native parent), same existing setup/operating guards. Preserve existing jobs, trigger, concurrency, Auth, timeouts and steps. The unique required Typecheck, Lint & Build aggregate must actually run with always(), depend on all three test jobs, and strictly require all three result strings to equal success. No skipped/neutral/failure masking or Ruleset changes.

Root requires complete new exact-head core/native/refresh/Auth/hygiene/build/Preview checks, independent adversarial SQL/TS review, fresh drift/review checks, expected-head normal merge and actual post-merge main CI/Production/alias proof. Agent self-review is not PASS. If the new test phase exceeds its bound, report actual cause to Root; no silent timeout/retry/fixture/gate modification.

## 8. Multi-agent suitability and handoff

Decision SINGLE_AGENT_IMPLEMENTATION plus independent parallel read-only review. Shared SQL/role/transaction/witness contracts make multiple writers unsafe. Root has two disjoint reviewers for gap/contract analysis and release evidence; only the named author writes implementation. No automatic successor.

Return exact changed-file manifest with old/new Git blobs and SHA256, implemented semantics, actual tests and missing checks, native diagnostics/timings, security/retention/concurrency/deployment limitations, rollback, no costs, and the still-open hosted A–F product path. Then returned/STOP. Immediate CHANGES REQUIRED goes to the same session; every changed head re-gated. Report larger functional progress accurately without claiming a real entry pilot or a finished database product.
