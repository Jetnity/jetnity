# C1 — global application conditions, PLAN V1

9 November 2026, review revision R1. **Plan only; awaiting Root acceptance and the IN1 base gate.**

Writer: **Jetnity Official Truth V3 Global Conditions 1 — Codex Generation 1**, actual session `/root/v3_global_conditions_writer`. Task: [C1_TASK_V1.md](C1_TASK_V1.md). Draft PR #1173; branch `feat/official-truth-v3-global-conditions-1-20261109`; assigned worktree `/workspace/scratch/01cbe1264212/jetnity-v3-global-conditions`.

## 1. Start state and explicit stop

- Local taskseed HEAD `772397b9b83480b640f4b18bf5cc34c2338b5046`, tree `f1ae09c3500abf5d176bdc6d0bc45a35994a7f8b`; clean before this document.
- Bound IN1 input `0b704d0fa5d90031ca3ee80aabf2d8578d4cd2d5`, tree `f03b04bd43c4a0fe6cedd742e309957222efdf44`. Root source review 6740039565 is not a complete native/CI PASS.
- Root reports the original CI 42616948893 run is complete: six substantive jobs succeeded; the inherited Accepted Store lifecycle browser proof failed before product assertions with `spawnSync /usr/bin/google-chrome ETIMEDOUT` during its unchanged 5-second version probe, and the dependent aggregate failed. Root has started exactly one unchanged-head failed-job rerun; it is not yet PASS. C1 does not modify that test, its browser, driver, timeout or CI.
- S1 `bb5ce4d69f9e479867581ecf0262e549bfc20e6c` has the separate Root PASS 6739931009. N1 `10d3e4f44460513e6425714af2c8c0b3ab4678a6` is an actual IN1 ancestor. Their evidence does not substitute for the pending IN1 or C1 gates.
- D1 is read-only external input at `300946991376b8969b383a087d47b49a7636f722` in `/workspace/scratch/e03d2839d4e5/jetnity-v3-d1`. Its package/manifest describe M02 as open; this work addresses its carrier/identity/transport portion, not current global source qualification.

**No implementation begins until Root explicitly accepts this plan and confirms the exact IN1 base gate.** If Root changes that base, Root repins/rebases first and invalidates the downstream evidence. The writer will stop after delivering this plan hash. No commit, ref or remote mutation is performed by the writer without a separate Root instruction.

## 2. Actual source findings supporting the design

The startup, operating, program, current status/checkpoint and C1 task were read, together with the relevant product vision, logic/continuity/quality rules and architecture/design decisions. The old checkpoint and roadmap summaries are historical; the task and Root's current exact-head evidence control this work.

The current V3 `contract.ts` has one strict untagged context with `scope`, `route`, `conditions`. Its identity canonicalizes the existing rule scope and normalized expression, then hashes exactly those three members. The scope requires global `validity.mode = not_applicable`. Existing canonical Schema1/2 expressions already represent an ordinary document and a CH journey origin. `tourism` is absent from the existing `REISEZWECKE`; using `visitor` would broaden the pilot's explicit declaration.

The existing AA mapping is a dormant, server-only candidate whose contract digest already binds the reviewed source, application metadata, full-body Protocol2 fingerprint, identity/profile, extractor and recognition pins. It expects a `travel_date` evidence scope. Its extractor remains `current: false`; the application catalog is empty and `applicationPilotEnabled()` is false. The new context mapping therefore cannot be an adapter that relabels an old AA receipt.

S1's closed descriptor has one shared `context` definition used by proposal, observation, decision and version structures. It is serialized into the marked SQL descriptor by the existing generator. `quarantine-codec.ts` uses canonical readers for complete outcomes; the audit binds by `contextKey` and does not carry a second raw context. Reusing these seams should retain the full new context without touching SQL custody, leases, transaction code or the codec.

The visitor presenter currently emits a blanket `Keine weiteren Bedingungen im geprüften Regelkontext` for the unconditional expression branch. Revision2 must qualify that wording and display its independent application restriction. The visitor fixture's reproof uses its own fixed `originals` map. A new projection inserted only into `cache` would fail that proof; the new synthetic context must be explicitly seeded into the fixed-original map before the query runs. The UI proof must continue through the real query, reproof, presenter and existing component.

## 3. Finite file ownership

Only the following files are planned. Any necessary change outside them is a concrete scope finding to send to Root before editing.

| Path | Bounded purpose |
| --- | --- |
| `lib/readiness/official-truth-product-v3/contract.ts` | Strict revision2 carrier, shared refinements, version-sensitive context identity and a narrow safe context-identity constructor; legacy branch unchanged. |
| `lib/readiness/official-truth-product-v3/contract.test.ts` | Runtime shape, date, privacy and nested canonical reader tests. |
| `lib/readiness/official-truth-product-v3/global-conditions/pilot-context.ts` (new) | Pure server-only fixed AA pilot metadata to global context candidate mapping and mapping digest. |
| `lib/readiness/official-truth-product-v3/global-conditions/pilot-context.test.ts` (new) | Exact dormant mapping, metadata/digest pins, no authority or inferred fact. |
| `lib/readiness/official-truth-product-v3/global-conditions/legacy-identity.test.ts` (new) | Six independent pre-change identity goldens with literal expected keys. |
| `lib/readiness/official-truth-product-v3/global-conditions/transport.test.ts` (new) | Actual I1 and canonical full-context propagation, identity separation, replay and visitor cross-context refusal. |
| `lib/readiness/official-truth-product-v3/global-conditions/test-support/fixture.ts` (new) | Explicitly synthetic revision2 proposal/binding fixture reusing the existing E1 originals/store, without changing them. |
| `lib/readiness/official-truth-product-v3/visitor/presentation.ts` | Separate application restriction text; retain route, pass, origin and legal-validity text. |
| `lib/readiness/official-truth-product-v3/visitor/presentation.test.ts` | Exact restriction wording and unconditional-expression regression. |
| `lib/readiness/official-truth-product-v3/visitor/test-fixtures.ts` | Explicit synthetic revision2 context and independently fixed originals for the query/UI proof; existing fixture cases preserved. |
| `lib/readiness/official-truth-product-v3/storage/retention-shape.ts` | Revision2 context union and descriptor revision 2; no widened fact/authority shapes. |
| `lib/readiness/official-truth-product-v3/storage/retention-shape.test.ts` | New subtree closure/parity tests; update only the `contract.ts` canonical-source hash after review. |
| `scripts/db/official-truth-v3-intake-store-1/intake-candidate.sql` | Regenerate only the `S1_RETENTION_SHAPE_BEGIN` / `S1_RETENTION_SHAPE_END` block. |
| `scripts/db/official-truth-v3-global-conditions-1/native.ts` (new) | Mandatory real File → N1 → S1 SQL → fresh read → actual I1 proofs for separate synthetic unapproved and approved method cases, full SQL completion/reopen, and direct SQL descriptor negatives in CI. |
| `lib/readiness/official-truth-product-v3/integration/global-conditions-native.test.ts` (new) | Mandatory import wrapper so the existing `test:core` discovery runs the new native proof in CI. |
| `scripts/official-truth-product-v3-ui/synthetic-server.ts` | New isolated revision2 scenario using the real query and fixed-original reproof. |
| `scripts/official-truth-product-v3-ui/mount.tsx` | One clearly synthetic scenario option; no application route or visitor field. |
| `scripts/official-truth-product-v3-ui/run.mjs` | Preserve current audits; add full restriction text/layout/screenshots at 320 px and 320 px with 200% text. |
| `scripts/official-truth-product-v3-ui/ci-contract.test.mjs` | Guard the additional required scenario/checks while retaining all existing CI/browser boundaries. |
| `docs/official-truth-product-v3/C1_PLAN_V1.md` | This plan and, if needed, explicit Root acceptance addendum. |
| `docs/official-truth-product-v3/C1_LEGACY_IDENTITIES_V1.json` (new after acceptance) | Byte-exact copy of Root's independent pre-change identity fixture. |
| `docs/official-truth-product-v3/C1_PROTECTED_SOURCES_V1.json` (new after acceptance) | Before/after source manifest, including masked-SQL equality and unchanged dormant authority pins. |
| `docs/official-truth-product-v3/C1_EVIDENCE_V1.md` (new after implementation) | Actual commands/results/log digests and precise offline/native/UI distinction. |
| `docs/official-truth-product-v3/C1_HANDOFF_V1.md` (new after implementation) | Writer self-review, compatibility/rollback limits, remaining risks and Root review entry point. |

The frozen intake contract, quarantine codec/postgres adapter, N1 service/file reader, I1 service/interface, visitor query/controller/component, E1 test-support modules, legacy canonical readers, AA code, local cluster/native adapter/wire driver, migrations, workflows, dependencies, authority and operating-mode files remain outside ownership. Existing callers must be proved through composition rather than edited to accommodate a weaker contract.

## 4. Legacy compatibility first

Root independently captured six real pre-change contexts at the IN1 input: `ch-visitor`, `ch-business`, `rs-visitor`, `ch-unconditional`, `ch-unresolved`, and `ch-transit`. The full input and expected `ruleScopeKey`, `contextKey`, research object and V3 `jobKey` are in:

`/workspace/scratch/01cbe1264212/recovery/c1-root-legacy-goldens.json`

Verified SHA256: `97b40395e44b8bc0608aff9262de022aa34ae18f7b1559f1c6762874336e6c4b`.

The fixture records base `0b704d0fa5d90031ca3ee80aabf2d8578d4cd2d5` and old `contract.ts` SHA256 `871b7eb7f4863fda0777593677b9bc265a0b6d22df99cc3caa2e1f0e59c672c4`.

First implementation step after both gates: copy these bytes unchanged into `C1_LEGACY_IDENTITIES_V1.json`, assert its digest, and run the literal expected identities against the unchanged reader. The same assertions remain after the contract edit. Expectations will not be recalculated from the modified implementation. Capture source hashes before any implementation changes.

The untagged reader remains a strict three-member form. There is no `contextRevision: 1` stamping, migration, optional application field, coercive recovery, or data down-conversion. A revisionless object carrying `application`, a tagged object missing `application`, or a tagged object with unsupported revision is rejected. Removing a revision2 restriction while retaining its old `contextKey` must fail nested reader binding.

Preserve the full existing rule-scope/research-key definitions. The six old contexts keep every old identity byte. Revision2 still uses `official-truth-context:v3:`; the version discriminator and full application subtree enter its canonical hash input. Normalized expression ordering retains the existing semantics.

## 5. Revision2 carrier and identity

Build a strict union of:

1. legacy `{ scope, route, conditions }`;
2. `{ contextRevision: 2, scope, route, conditions, application }`, where application is exactly `{ purpose: 'tourism', tripStartAndEndWindow: { from, through } }`.

Share the existing scope/route/condition schemas and route consistency refinement without changing their accepted legacy values. Validate each window bound through the existing civil-date reader; require `from <= through`. Equal bounds are a valid one-day window. Date-only ordering uses the canonical civil-date semantics, not `Date` time-zone conversion.

Meaning: **from ≤ trip start ≤ trip end ≤ through**, with both boundaries inclusive. The generic carrier may describe any valid finite window. The concrete pilot mapper remains pinned to 7–13 November 2026. These fields describe the rule's application, not a stored visitor trip, legal validity, a time-to-live or a derived number of permitted stay days.

Reject missing/null/wrong-type endpoints, impossible civil dates, reversed ranges, unsupported purpose/revision, unknown nested properties, exotic objects/accessors and privacy payloads through the existing safe reader before schema access. Preserve detached/deep-frozen output. Test accessor refusal without invocation, null prototypes/exotic descriptors as supported by existing policy, and unknown members at the context/application/window levels.

Identity inputs are precisely:

- legacy: `{ scope: canonicalScope, route, conditions: canonicalConditions }`;
- revision2: `{ contextRevision: 2, scope: canonicalScope, route, conditions: canonicalConditions, application }`.

Changing only `from`, only `through`, the expression, or removing the application form changes the complete context identity. The V3 job identity already includes `contextKey`; it must distinguish these variants automatically. The same base scope/research key is expected for date-window variants, and is explicitly insufficient proof that their global contexts match.

Expose a narrow `createV3ContextIdentity(value: unknown)` constructor returning the existing safe-reader result containing only `contextKey` and `ruleScopeKey`. It invokes the canonical context reader and the same internal identity function used by work identities. The mapper can then obtain the full context identity without inventing a method/job reference or duplicating the hashing algorithm. This constructor grants no authority and does not change existing work-identity fields.

Test arbitrary valid windows separately from the fixed pilot. No source or method qualification is inferred from the success of this reader.

## 6. Fixed dormant pilot mapper

`pilot-context.ts` imports `server-only` and reads only the existing code-owned reviewed source/application candidate constants. It exposes one fixed mapping function with no caller-selected context argument. It has no I/O, time access, registry mutation or activation path.

The returned candidate binds:

- mapping revision 1 and a canonical mapping digest;
- the existing candidate/application version, contract ID/digest and reviewed source/extractor/profile/Protocol2 pins;
- the full newly parsed revision2 context and its computed context identity.

The context is DE visa; exactly CH citizenship; explicitly linked CH passport; residence not applicable; global scope validity not applicable; direct entry and null transit; an `all` expression with ordinary document class and CH `journey_origin`; application purpose exactly `tourism`; exact inclusive start-and-end window `2026-11-07` through `2026-11-13`.

The digest is calculated from an explicit stable projection of the mapping revision, exact existing candidate/application metadata and complete new context identity. It must bind every restriction and the source pins used by the mapping, while excluding executable callbacks. An exact expected digest is pinned after independent source review; changed source metadata cannot silently acquire the old digest. Tests pin the old AA reviewed-source/mapping/read-request/trip-binding/catalog code as unchanged.

Return a **context candidate** only. Do not return or synthesize an accepted rule, Evidence/Qualification receipt, legal-validity record, method grant or runtime registry entry. Do not call the old travel-date extractor with relabelled global scope or translate its old receipt. Do not derive `stay_limit`, replace `tourism` with `visitor`, extend the pilot dates according to the clock, or copy the application window into evidence validity. No actual AA data is used as synthetic global source proof.

## 7. Propagation and retention

All affected records continue to share the canonical context reader. Positive tests create clearly fictional revision2 data and carry the exact context through proposal/upload, research job, observation/decision, rule version, projection/public response, full prepared outcome and replay. Audit binds to the same `contextKey`; it does not gain a duplicate context field. The generic synthetic context uses a fabricated blank-page fact and `.example` authority, never a claimed live AA fact.

Use the actual I1 coordinator with the existing E1 test originals/store for an offline synthetic positive preparation. Inspect the full returned decision/version/transition and reparse/replay it through the unchanged quarantine codec. Verify `acceptance: not_committed`, unchanged evidence `legalValidity`, and absent publication/Accepted writes. Offline codec coverage does not prove actual SQL retention of the new nested decision/version fields: a separate mandatory native positive preparation/completion/reopen scenario below proves those fields through the real database. An independent unapproved method case must return its honest unavailable result before extraction. Neither synthetic test demonstrates real source qualification or approves a production method.

For proposals, jobs, source decisions/observations, versions, projections and stored outcome reads, attach an old key to changed or stripped application conditions and require rejection. Mutate a cached projection's complete context while retaining its old reference/key/hash and demonstrate the existing real visitor reproof cannot return an accepted answer. Distinguish failure from legitimate pending/discovery states according to the actual query contract; never assert a fabricated research ACK.

S1 descriptor revision becomes 2. Its context definition is a closed union preserving the old branch and adding the exact application subtree. Do not widen fact families, including the existing URL-bearing `official_actions` exclusion. Run the existing `generate-retention-shape.ts --write-s1-shape` generator; compare everything outside the marked block byte-for-byte to taskseed. No table, role, ACL, RLS, RPC signature, lease, transaction or transport changes.

Keep all 10 other canonical-source hashes in `retention-shape.test.ts` exact. Only the reviewed `contract.ts` pin is updated. Test descriptor/SQL generated-block equality and all legacy fact families plus the revision2 subtree.

**Validation distinction:** the SQL descriptor/TypeScript shape matcher checks closed data shape, member types, finite enums and civil-date syntax. The canonical reader enforces ordering and recomputed identity/semantic binding. A shape-valid reversed window can therefore be shape-admissible but canonically invalid; tests must expose that distinction rather than claiming SQL verifies the entire meaning. Normal N1/S1 intake still requires the canonical parser before retaining originals.

## 8. Mandatory native proof — existing CI only

The new wrapper is included by existing `lib/**/*.test.ts` discovery. It has no skip, optional database URL, emulated driver or alternate transport. The test imports the unchanged cluster/wire/native-executor helpers; the candidate SQL runs only in the existing mandatory isolated CI environment. No local PostgreSQL launch is attempted because the known local EPERM is a closed boundary.

Finite scenarios:

1. Write an actual mode-0600 temporary file below an inode/device-pinned test directory, containing pretty-printed fictional revision2 proposal bytes. Deliver through actual N1 and S1 SQL capture. Verify exact original bytes, digest, complete binding and one retained operation; there is no extraction or Accepted/cache write.
2. Remove the source directory, create fresh custody/ingress instances and fresh owned database connections, then confirm/open by the retained reference. Assert the full revision2 context survives and the original whitespace bytes are identical. Feed **only reopened SQL bytes** into actual I1 with the test method set unapproved. Assert complete `unavailable / method_not_approved` outcome and matching audit are durably retained, then reread/replay from fresh custody. The outcome is deliberately not a prepared/accepted claim.
3. Independently repeat the real file → N1 → S1 capture → fresh reopened original → actual I1 chain using **explicitly synthetic approved-method ports**, fictional `.example` originals and the existing test-only E1 verifier. Require a full `prepared` outcome with `acceptance: not_committed` and `reproof: required_before_commit`. Complete the import through the real S1 reservation/completion RPC and COMMIT acknowledgment; inspect the actual persisted completion/outcome/audit, then discard the in-process custody/importer and reread through fresh connections and fresh custody. Assert deep equality to the full original outcome/audit; independently require revision2, exact tourism and both window bounds at every nested context present, including decision context, primary observation context and version subject context. Require every associated context key and transition/audit binding to equal the independently calculated complete-context identity; verify unchanged evidence legal validity, original byte digest and exact proposal binding. Replay through the actual fresh I1/custody seam and prove one retained completion, not a newly fabricated result. Assert zero Accepted heads/versions, publication/cache/outbox writes throughout. The test ports' synthetic approval remains local to this fixture: no real AA receipt, source qualification, runtime method authority or source call is introduced.
4. Exercise the actual SQL shape guard for a valid revision2 proposal and new-subtree negatives: unknown/private members, null application/window/bounds, wrong primitive types, unsupported purpose/revision and malformed civil dates. Inspect counts to show rejected calls do not retain rows. Treat reversed date ordering/old-key semantic rejection as canonical-layer tests, documenting SQL's narrower guarantee.
5. Put duplicate `purpose`, `from` and escaped-name equivalents into actual source-file bytes, where a normal JSON parse would hide the earlier value. N1/S1 must reject before dispatch/retention; assert zero original rows and zero import/accepted/cache effects.

R1 acceptance strengthening adds scenario 3 within the already owned native proof/fixture/wrapper paths. It does not expand implementation ownership, change the candidate SQL beyond its descriptor block, replace scenario 2, or authorize database execution outside the existing CI. The same synthetic method control has separate fixture instances so the positive preparation cannot accidentally enable the unapproved-method case.

Use existing same-session test transport and signal cleanup, with bounded test time comparable to the current IN1 proof. Do not add retries, relax timeout budgets or broaden permitted connection mechanisms. Existing S1/IN1 and inherited native suites stay mandatory and unmodified. CI logs, actual subtest counts, zero skips and exact source head are required before Root can claim native PASS.

## 9. Conditional display and actual UI proof

Presenter output adds `Reisezweck: Tourismus` and a sentence explicitly naming **Reisebeginn und Reiseende**, both ISO date boundaries and their inclusive meaning. For example: `Reisebeginn und Reiseende müssen zwischen 2026-11-07 und 2026-11-13 liegen (beide Grenzen eingeschlossen).` This is a condition, not an assertion that the visitor has those dates or is eligible to enter.

Retain existing pass, direct-entry and origin statements and unchanged separate legal-validity display. For revision2 with an unconditional expression, replace the blanket no-further-conditions line with a precise expression-only statement, or omit it while showing the explicit application restriction. Legacy output remains unchanged. Tests must distinguish application dates from source `legalValidity` and require all restriction text.

The fixture exposes one explicitly named synthetic application context. It uses the real context reader with the new fields and existing predicates, `.example` source metadata and the fabricated nine-page fact. Seed its immutable original projection before constructing the query; do not grant proof by echoing requested bindings or adding a wildcard. The new scenario overrides coverage for only its declared fictional DE/CH cell and seeds the exact corresponding cache projection.

The scenario is reachable only in the isolated harness selector. The real public component and visitor input still accept only destination plus one to five citizenships. Do not add a public route, date/purpose/passport fields or navigation.

The existing UI runner gains these mandatory checks, preserving every old case:

- select the new scenario through the real component, submit DE/CH, require its synthetic notice, actual accepted fixture result and complete pass/origin/route/tourism/start-and-end text;
- layout and full-page screenshot `application-320` at 320 px;
- set the existing 200%-text mechanism, recheck the full restriction text and no-overflow geometry, screenshot `application-320-text200`, then restore text size;
- retain source/time/version evidence, input-envelope privacy, external-request denial, focus and all existing error/pending/completion cases.

`ci-contract.test.mjs` will require the added scenario and runner checks while retaining the current all-family aggregate, single sandboxed launch, no-download/no-fallback rules and always-uploaded artifacts. Root must inspect the actual resulting screenshot artifacts. A source assertion alone is not UI evidence.

## 10. Planned verification and evidence

No implementation test run is claimed by this plan. Use Node22 at `/workspace/scratch/e03d2839d4e5/v3-toolchain/node_modules/node/bin/node` and the existing dependency symlink. No install or lockfile edit is needed.

After both start gates, the local verification sequence is:

1. Verify exact input SHA, six immutable identity fixtures, clean ownership boundary and protected-source manifest.
2. Run explicit offline Node tests via `--import ./scripts/server-only-test-register.mjs --import tsx --test`: `contract.test.ts`, the new `global-conditions/*.test.ts`, existing visitor controller/query/presentation tests, retention-shape tests, existing AA `mapping.test.ts`, existing I1/ingress/storage offline tests, and `scripts/official-truth-product-v3-ui/ci-contract.test.mjs`. Resolve the actual explicit offline file list before execution; never launch any `*-native.test.ts` or other native wrapper locally. This is a selected offline run, not a claim that full `test:core` passed.
3. Whole TypeScript check through the existing `npm run typecheck` (`next typegen && tsc -p tsconfig.json --noEmit`), and ESLint on the concrete changed code paths.
4. Existing five hygiene scripts: `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug`; inspect every actual result. No DB inventory/apply command is part of this sequence.
5. Verify regenerated descriptor equality and unchanged bytes outside its marked SQL block; rehash protected modules and the untouched canonical-source pins. Inspect the complete actual diff against taskseed and the exact IN1 ancestor.
6. Record actual command, exit status, counts, duration and raw-log SHA256 in `C1_EVIDENCE_V1.md`; record failures honestly. Full exact-head CI/native/build/Preview and actual browser artifacts remain separate Root-owned gates after publication.

The local full `npm test` / `test:core` commands include mandatory native wrappers and therefore are **not** executed locally. The unchanged CI workflow runs them in its permitted environment. Likewise no browser/network-listening workaround is attempted after a concrete local refusal; the normal UI CI provides the mandatory proof.

Protected manifest captures at least the legacy Schema1/2/rule-claim/temporal/content-identity code and all 10 retained descriptor pins; AA `reviewed-source.ts` and `mapping.ts`; pilot `read-request.ts`, `trip-binding-server.ts`, extractor registry and application `contract-server.ts`; S1 `intake-contract.ts`, codec/postgres adapter and original-bytes parser; N1 service/file-reader files; I1 service/interface; visitor query/controller/component; existing E1 test support; CI/package/lock/operating-mode files; local cluster/wire/native adapter; and SQL bytes with the marked descriptor block removed. The manifest records actual paths/hashes found on the checked-out source, not invented filenames.

## 11. Review, compatibility and rollback

| Risk | Planned evidence / boundary |
| --- | --- |
| P0: accepting source truth, authorizing hosted changes or bypassing a refused readback | No authority-grant/registry/activation/hosted access path; dormant source pins and disabled pilot unchanged. Root alone controls approval/merge. |
| P1: silent broadening of tourism, dates, route or passport conditions | Strict separate carrier, exact fixed mapper, complete context/job hashes, adversarial key/condition tests and full visible conditions. |
| P1: interpreting old AA receipts as global qualification | No receipt conversion, source call or extractor admission; explicit candidate-only return and protected old mapping/catalog files. |
| P1: private/duplicate fields surviving only in retained bytes | Closed TS/generated SQL descriptor, actual pre-retention duplicate-key refusal and native zero-row checks. |
| P2: old context identities or callers change | Root's six fixed pre-change goldens, existing source hashes and unchanged service composition. |
| P2: UI hides a restriction or reproof is synthetic echo | Fixed-original fixture proof; actual 320 px / 200% screenshots and complete text/overflow checks. |
| P2: SQL shape mistaken for full validity or qualification | Explicit layer distinction, reversed-window/key negatives at canonical layer and shape-only SQL evidence. |
| P3: evidence becomes stale after a head change | Final exact head/tree/source/log manifest; any changed head restarts Root gates. |

Rollback is ordinary code reversal of this dormant slice. Current SQL is **UNAPPLIED**; no hosted migration or deletion is performed. A pre-C1 reader must reject stored revision2 records because their fields are unknown. Never strip application/revision or rewrite their keys to make them legacy-readable. If revision2 data is later activated, rollback planning must preserve those originals and treat them as unreadable pending compatible code; that future activation plan is outside C1.

The handoff will state what actually passed, what remains unrun, and all limits. Writer self-review does not set Ready/PASS. Immediate CHANGES REQUIRED returns to this same session; Root independently reviews the new exact head and all gates. No automatic next slice.

## 12. Reserved Owner and platform gates

Method remains **NOT_APPROVED** and Dev package **NOT_RELEASE_READY**. Broader D1 M02 qualification remains open alongside M01/M03–M07. C1 alone does not complete global AA source qualification, revocable method authority, durable service/Accepted/cache operation, measured public p95, escalation delivery or target-bound activation.

No hosted DB/Auth/ACL/RLS/migration/credential read or write, real source/provider/researcher call, paid operation, new recurring cost, scheduler/notification activation, environment/secret change, Ready or merge is authorized here. The specific refused #917 readback is not retried, redirected, rephrased, delegated or replaced by human SQL. #1139/17 pre-Owner gaps, #1131 Ready-STOP, #1135, #968, #911/#913 and the concrete method/database/Production Owner gates persist.

**Next action is Root's plan decision and explicit IN1 base-gate confirmation. This document does not imply either has occurred.**
