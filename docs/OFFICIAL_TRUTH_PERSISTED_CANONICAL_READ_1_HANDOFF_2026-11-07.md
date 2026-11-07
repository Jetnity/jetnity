# Official Truth Persisted Canonical Read 1 — author handoff

Date: 2026-11-07. Tracking #1150; Draft PR #1151; parents #917 / #751.
Author: **Jetnity Official Truth Persisted Canonical Read 1 — Codex Generation 1**.
Actual session: `/root/persisted_canonical_read_writer`.
Status: **returned / STOP — implementation delivered for independent TL review; NOT Ready, NOT merged, NOT accepted or live**.

## 1. Immutable scope and delivery

- Code baseline: `main@a5be31e0798cf1d03aae70cdf3b68cddd115ff3a`, tree `bc295cf45b3bfcd6c7dfcc696e613409eea9e6f1`.
- Branch: `feat/official-truth-persisted-canonical-read-1-20261107`.
- Immutable TASK: [TASK V1](OFFICIAL_TRUTH_PERSISTED_CANONICAL_READ_1_TASK_2026-11-07.md), seed head `41d30fe1521cd31fac2b2d8ef14b9ca9089a437f`, blob `101be0875126d0e79a65636c1f7f49facea2d0d8`.
- Binding [TL amendment R1](OFFICIAL_TRUTH_PERSISTED_CANONICAL_READ_1_TL_AMENDMENT_R1_2026-11-07.md): blob `2baa526d48a9c370abcfd86b3e35a2c9547159e8`, remote docs-only head `c7cbc2d0d682a8a0e5bf46729531815048b810e1`. Receipt: https://github.com/Jetnity/jetnity/pull/1151#issuecomment-6707215131.
- Binding [TL amendment R2](OFFICIAL_TRUTH_PERSISTED_CANONICAL_READ_1_TL_AMENDMENT_R2_2026-11-07.md): final blob `4c30954be0e3d5cb1c845a40c223fb65a83afee0`, remote docs head `5fa90fb4c2e3a5feb1f4361c0903584a6443c8ce`. Root selected the strict last-await deadline correction in the same author session; no weaker checked-instant exception.
- Isolated author workspace: `/workspace/scratch/c4c9898f6d19/persisted-canonical-read-work`. This is a partial exact-source mirror, not a full checkout. Root publishes the complete changed-file manifest on the remote branch. No remote ref mutation or GitHub post by this author. A local mirror commit is not presented as a repository head.

All three immutable scope documents were read. The TASK mirror's one accidental extra final newline was removed after exact seed readback; its local blob now equals `101be087…`. None of the three scope documents is part of the author change manifest. Root already persisted them; final author publication target is docs head `5fa90fb4c2e3a5feb1f4361c0903584a6443c8ce`.

## 2. Implemented behavior

`readPersistedCanonicalRequirements` is the owned script-local entry. It accepts only an existing owned local proof cluster, finite `primary`/`composed` mode, ephemeral decryption key, exact external lifecycle witness and optional AbortSignal. Mode, witness shape and argument count are checked synchronously; the witness is copied before the first await. Definition, exact pin, scope, fact kind and requirement type come independently from fixed `PILOT_CORPUS` code.

The existing whole-current-set lookup was narrowly split into selection metadata and its original custody-verifying wrapper. The existing `lookupCurrentVersion` and `readCandidate` outputs retain their prior metadata contract, including zero positive cells and Production `NOT_AUTHORIZED`. The new path does not select a caller fingerprint, ignore invalid competitors, use latest/first matching rows, or cache a positive result.

The new entry owns a fresh READ COMMITTED reader. It holds the existing lifecycle SHARE lock while the separate REPEATABLE READ READ ONLY archive fetches the original 23-column full provenance closure. A private material helper retains verified originals only within the fixed operation; ordinary readers do not receive bytes, closure objects or a callback. Full original order/digests/identity and complete historical artifacts remain checked by the existing shared verifiers.

The historical projection reconstructs accepted Evidence from those actual bytes and the verified original observation/validity artifacts. It executes the unchanged fixed identity profile and validity decoder, compares the complete newly accepted identity to both historical origin and custody, and requires a stored null proposal. It reconstructs the existing historical Review with complete custodies, manifest order and accepted versions, then compares the full stored value and full review key.

R1's exact historical seam is used: fixed current corpus `match`/`extract`, the existing canonical fact parser, and composed Phase A, actual observation citation validation and fact citation coverage. Registry/profile/extractor/policy descriptors are compared to current fixed code. The result fact, support order, policy assignments and citations must equal the historical receipt. Stored implementation capsules remain fully verified evidence, never executable input to the reader. No new retrieval envelope, redirect count, current HTTP assertion, Same-Request capability or composition seal is manufactured.

Existing Rule construction/acceptance feeds a local one-cell provider into the unchanged Requirements engine. A fixed fictional traveller and explicitly linked CH passport produce exactly one Visa requirement for GB (`required / electronic_visa`); unsupported requirements remain unknown. This is the existing conformance corpus, not a statement of actual entry law. The provider cannot leave the operation and has no application import edge.

The output is deeply immutable and explicitly synthetic: `syntheticVisaCells=1`, `positiveRealVisaCells=0`, `productionAcceptedRead='NOT_AUTHORIZED'`, no reusable cache. It contains selected version/fingerprint, full review key, exact sources, original retrieval times, current read/recheck times and copied external witness. The 81-character Review key is retained only in proof metadata; the unchanged engine's shorter `ruleReference` is `null`. Composed metadata contains both source URLs, while the engine's single `sourceUrl` is `null`.

## 3. Lifecycle, timing and cleanup decisions

Selection and current original/lifecycle checks run before projection and again after awaited Requirements. The last await is a fresh actual `read_candidate` query, following another complete current-set selection. Both initial and final material reads require the new R2 local candidate. Its nine fields carry actual persisted expiry/freshness deadlines, actual head checked-at plus 60 seconds, and server observation. Ordered original five byte/material columns must still equal the initial read; stable deadline tuples are compared separately from naturally changing observation times. Source `checkedAt` remains the original source retrieval time; a database read does not refresh it. The canonical one-hour freshness ceiling remains unchanged, with additional explicit rejection of future original timestamps.

For each row, the earliest actual deadline minus server observation is anchored to the code-owned monotonic query-start instant, with a two-millisecond truncation margin. The request conserves the minimum initial/final bound and never extends it on recheck. Invalid/missing/expired/inconsistent bounds fail closed. The carried bound is checked after archive/Requirements awaits, after final SQL, after output freezing and immediately before return; the guard remains held through final construction. There is no fallback to the old metadata-only reader.

The operation also owns a 60-second monotonic deadline (`performance.now`) and an aborting timer. It explicitly checks elapsed time at owned awaited boundaries and after final output freezing, so timer delivery delay cannot permit a late positive. Abort, deadline, selection refusal, material refusal and operational failure all yield closed nonpositive results without SQL/body/key/error-stack disclosure.

Root approved synchronously terminating the read-only guard connection immediately after final SQL/time/abort verification. This ends its transaction without an additional awaited COMMIT after the final freshness check. No write acknowledgement is claimed. The archive retains its existing acknowledged READ ONLY COMMIT. **Producer publication still requires acknowledged COMMIT and actual closed backend before the fresh reader.** The native suite checks actual backend disappearance and released head locks for owned reads; the result describes the checked instant, not an ongoing lease.

The two R2 SQL candidates remain outside canonical migrations/apply paths. The new SECURITY DEFINER wrapper delegates the unchanged original reader, strictly binds pin/version/digest to original bounds, preserves order/count and rejects expired/null/nonfinite metadata. Installation is atomic, requires the same verified original-reader definer as CURRENT_USER, refuses any pre-existing signature, uses empty search_path/UTC, revokes PUBLIC and grants only existing ot_original_reader. No tables/roles/old functions are changed. Exact rollback revokes/drops only the new signature. This code is not an installed hosted object.

## 4. Fresh execution allowance

`runFreshControlledSyntheticPilot(mode)` accepts exactly one finite mode and no injected time, fault, material, snapshot or handle. The private worker entry carries only the additional finite `clockMode` selector. Fresh execution allows only `fault='none'`.

Inside the captured worker, the base is whole-second `Date.now() - 120 seconds`; original retrieval uses that base, reference uses base + 60 seconds, and completion uses base + 61 seconds. All are already in the past. The original optional second observation derives from the same base (+500ms), although its fault paths remain unavailable in fresh mode. Static/default historical behavior and fault cases are unchanged. The public existing prepared-handle argument surface and one-shot burn behavior remain intact.

The positive fixtures use the real captured source/dependency/emitted implementation bundles. No producer clock/review/version is rewritten afterward and no capsule is replaced with a conformance stub. Only the pre-existing alternate-version helper and the new deliberate fact contradiction are explicitly labelled historical test fixtures; neither is described as a separate actual execution.

## 5. Complete author file list

| File | Change |
| --- | --- |
| `scripts/db/official-truth-persisted-canonical-read-1/contract.ts` | New independently fixed finite cell identity/pin |
| `scripts/db/official-truth-persisted-canonical-read-1/projection.ts` | New historical reproof through canonical Evidence/Review/Rule/Requirements |
| `scripts/db/official-truth-persisted-canonical-read-1/reader.ts` | Narrow public script-local entry/type re-export |
| `scripts/db/official-truth-persisted-canonical-read-1/read-projection-candidate.sql` | R2-only atomic local bounded-reader wrapper and narrow grant |
| `scripts/db/official-truth-persisted-canonical-read-1/read-projection-candidate.rollback.sql` | R2-only exact new-function rollback |
| `scripts/db/official-truth-persisted-canonical-read-1/fixtures.ts` | Actual fresh fixture, fixed original ordering, fully rehashed contradiction fixture |
| `scripts/db/official-truth-original-custody-1/storage.ts` | Private material handoff and owned guarded operation; original public reader retained |
| `scripts/db/official-truth-current-version-lookup-1/lookup.ts` | Reused exact whole-set selection; original public result retained |
| `scripts/official-truth-integrated-pilot-1/controlled-runtime.ts` | Finite fresh execution wrapper and worker selector |
| `scripts/official-truth-integrated-pilot-1/engine.ts` | Code-owned consistent past fresh clock only |
| `lib/readiness/official-truth-content-identity.test.ts` | R1-approved exact projection importer plus specific positive/negative guard assertions |
| `lib/readiness/official-truth-persisted-canonical-read-1.test.ts` | New focused projection/clock/context/isolation tests |
| `lib/readiness/official-truth-persisted-canonical-read-1-native.test.ts` | One new native PG16 suite; closed producer and actual persisted bridge plus negative families |
| `ARCHITECTURE.md` | Bounded dormant data flow, cleanup and authority limits |
| `DECISIONS.md` | Historical seam and preserved canonical engine decision |
| `ROADMAP.md` | Author-return state and unchanged hosted critical path |
| This HANDOFF | Exact author delivery, proof map and outstanding gates |

No other file is an author change. Additional local files fetched to resolve imports are exact baseline bytes; task config/tool evidence and the read-only dependency symlink are not deliverables. A comparison of 207 available baseline files against the exact main tree found only the eight existing-file changes listed above. New files are separately enumerated in the delivery manifest.

## 6. Acceptance mapping — implementation versus observed execution

The following describes executable tests delivered for Root CI. It **does not assert that native or positive fresh tests passed locally**.

| Criterion | Concrete proof and scope |
| --- | --- |
| Actual primary/composed code capsules and fresh internally owned times | Unit tests `primary/composed: actual fresh full captured bundle re-extracts canonical historical requirements`; inspect real worker/build/source/dependency capsules and source/reference/completion ordering. Existing `official-truth-integrated-pilot-controlled-runtime.test.ts` remains unchanged for captured-byte execution, disk deletion/edit, foreign handles, one-shot authority, bounds and exact result keys. |
| Real persistence and independent fresh read | New native `persisted canonical bridge: closed committed producer, fresh native reader, final lifecycle proof`: actual publish/review/bind, COMMIT diagnostic acknowledgement, producer close and `pg_stat_activity` disappearance, distinct new guard/archive backends and one canonical synthetic Visa cell in both modes. |
| Original attribution and independent timestamps | Unit and native compare exact full review key/support order/source URLs/retrieval times. Composed has both proof URLs and explicit null single engine URL. Non-Visa rows remain unknown. |
| Wrong public context cannot grant authority | Unit `finite public read and fresh clock reject caller context, material, clocks and invalid modes`; native external witness detachment. Existing current-version lookup native tests retain wrong pin, scope, fact kind, requirement type and unrelated cell checks. |
| Missing original/digest/order/review/rule binding | New native local-owner corruption cases delete ciphertext, alter raw digest/order, remove binding or mismatch review key; owned entry must return no projection. Existing M1–M4 native suite remains normative for ciphertext substitution, version binding, quotas, event/support completeness and exact SQL ACL/constraint matrix. |
| Fully self-consistent historical fact contradicts bytes | `contradictingFactFixture` changes the Visa mode and recomputes fact hash, candidate binding, composed result identity when applicable, receipt fingerprint and custody binding. Full shared closure verification must pass. Unit projection rejects both modes; native primary is actually published, reviewed and bound, then rejected during re-extraction from original bytes. |
| Complete set / ambiguity / version selection | New native alternate receipt causes ambiguity; a malformed accepted rival refuses the whole set; lifecycle supersession makes exactly the remaining alternate version selectable with unchanged fact/support/review. The alternate helper is explicitly a historical version-selection fixture. Existing current-version suite retains count/byte budgets, invalid full-set rivals, restore/foreign-head and no-LIMIT checks. |
| Withdrawal/conflict/supersession/source/profile/expiry/disposal | New owned-entry native cases cover every listed family; real expire procedure removes ciphertext and emits disposal events. Shared frozen SQL remains unchanged. The tiny synthetic table snapshots only isolate owner-tamper test cases inside the disposable cluster. |
| Guard lifetime and final SQL recheck | New native NOWAIT counterchecks prove the head SHARE lock after archive COMMIT and after awaited canonical Requirements. A retention deadline crossed after initial material read must be rejected by the final actual original query. |
| Cancellation, deadline, operational failure and cleanup | New native abort after archive COMMIT, abort after final original query, final transport failure, cancellation during head-lock wait, and monotonic-budget overrun before timer delivery. Owned reader backends disappear and the head lock is reacquirable; no successful cached projection escapes. |
| R2 last-await actual DB deadline | Native retention, freshness and independent lifecycle-head counterexamples deliberately delay an actually successful final candidate reply beyond its returned actual bound and require freshness_lost, not the whole-operation deadline. Missing/invalid/expired/inconsistent/changed metadata and swapped composed rows also refuse. Earliest initial/final monotonic bounds are preserved. |
| R2 exact local SQL surface and rollback | Native owner equality, SECURITY DEFINER, fixed empty search_path/UTC, denied application roles/PUBLIC, reader grant and private-table denial. Existing object definitions/owners/ACLs and role properties are compared; reapply refuses overwrite. Rollback restores the exact prior object inventory, old metadata behavior survives and the new positive path becomes unavailable. |
| Uncommitted or unacknowledged producer outcome | New native acknowledged-commit proof, explicit rollback and disconnect without COMMIT. The existing `official-truth-original-custody.test.ts` commit-outcome-unknown case remains the specific reused proof for an unacknowledged COMMIT; it is not relabelled as newly implemented. |
| Unchanged privileges and no real activation | New native existing-role EXECUTE denials, old metadata-contract read and local-only cluster boundary. Existing application hardoff and all SQL/security tests remain required. Only the R2 new local function and its explicitly authorized reader EXECUTE grant are delivered; no existing SQL or grant changes. |
| No HTTP/app edge/material leaks | Unit scans actual new files **and real existing storage/lookup entries**, recursively follows static runtime imports from all app/components/lib roots and rejects reaching the retained path. Local PG Unix-socket transport remains allowed. Unit/native reader phases replace fetch with a failure; output checks reject raw/escaped/base64 originals, keys and internal byte/seal fields. |

The new native suite has a 360-second test limit because it retains full code capsules and shares one real cluster for all bridge cases, including three R2 real-time deadline-delay counterexamples. Each deliberately delayed successful final response waits less than 18 seconds (below the unchanged 20-second idle-transaction bound); no timer/SQL budget is increased to make a delayed test pass. No existing timeout, transport/SQL bound, workflow setting, retry or skip was changed. Phase diagnostics contain only fixed names and elapsed time, never source bodies, SQL parameter bytes or keys.

## 7. Tests actually attempted locally

Environment: Node `v24.22.1`, TypeScript `5.9.3`; existing read-only dependencies under `/workspace/scratch/fca0aa91f0dd/aa-application-protocol2-tools/node_modules`. Repository files were fetched at the immutable baseline. No package install, stub, lockfile change or replacement runtime was introduced.

| Command/check | Actual result |
| --- | --- |
| `node --import ./scripts/server-only-test-register.mjs --import tsx --test --test-name-pattern 'finite public read' lib/readiness/official-truth-persisted-canonical-read-1.test.ts` | **1 test, 1 passed, 0 failed, 0 skipped**. Covers input/mode/witness/extra-argument rejection, pre-abort and fabricated local cluster refusal plus finite fresh wrapper arguments. |
| Load `scripts/db/official-truth-persisted-canonical-read-1/projection.ts` via Node/tsx and existing server-only test loader | Successful module load; this alone is not a positive projection proof. |
| `node node_modules/typescript/bin/tsc -p tsconfig.reader-local.json` (temporary non-delivered config extending repository paths, focused entry/tests) | **Not a passing typecheck.** Missing existing `react`, `next/navigation`, `next/server`, `next/headers`, `@supabase/ssr` and resulting pre-existing guard/server type diagnostics. After fixing author fixture/test typings, no diagnostics remained in any author-changed/new file. Exact full typecheck remains required in CI. |
| Focused positive unit run with `--test-name-pattern 'actual fresh'` | **2 tests failed before controlled execution**: esbuild cannot resolve the five existing Framework/SSR imports listed above. No positive capsule/Requirements result is claimed. |
| Full new native test invocation | **1 test failed during fresh capsule preparation**, before PostgreSQL startup, for the same missing dependencies. No native command succeeded and no PG result is claimed. |
| `findLocalPgBins()` from the unchanged harness | `null`: no local PostgreSQL/initdb available. |
| Static-isolation test invocation | Fails on missing `app/` in this partial mirror. The test was not weakened or made conditional; complete-repository CI is required. |
| Existing Node test mock API for `performance.now` | Supported; only checks the concrete API used in the native delayed-timer counterexample. |
| `git diff --check` | Passed. |
| Baseline file / immutable scope hashing | 207 present baseline files checked; only eight intentional existing-file edits. TASK/R1/R2 and both frozen original/lookup SQL blobs verified as above. |

An initial command-line `tsc` invocation without the repository alias config also failed to resolve `@/` imports and was replaced by the explicit inherited-config check. That setup failure is not a project typecheck result. No lint, full suite, five hygiene checks, Production build, actual native PG16, fresh Auth, Preview or Production gate ran successfully in this partial environment. Root must run all exact-head gates; no local result substitutes for them.

## 8. Security, database, cost and preserved blocks

- **No canonical migrations, new roles, existing grants, RLS/Auth changes or hosted read/write/apply.** R2 permits only the two listed local candidate SQL files and the new function’s reader EXECUTE grant, installed solely by the future disposable native test. Every existing SQL file, source/corpus/canonical module and existing function contract remains frozen.
- Development `yfvbxvijcorffwxbxahl`: Stage 1 **APPLY_RESPONSE_SUCCESS / INDEPENDENT_READBACK_PENDING**; actual new ledger ID **UNKNOWN**; Stage 2 **NOT_ATTEMPTED**. The originally refused readback was not retried or redirected; no new platform clearance exists. #1139 target truth and #1142 effective installation remain open.
- #1131 held HTTP completion was not copied or integrated; #985 Protocol-3/current-request marker/getter hold was not investigated or changed. #937/#936 paused App/Signer/Owner-Mac/Time-Machine/Bern and #913 privacy remain closed. Cursor remains quota-paused; no resumption/settings/cost change.
- No real AA/GB source fetch, source-rights or retention approval, secret/key hosting or Owner/AAL/session assertion. Original SQL admission remains Source Protocol 1, 65,536 bytes and maximum 30-day retention/freshness. The new canonical source freshness still uses the existing one-hour ceiling.
- Actual production provider remains null; application contracts empty and pilot flags false. No routes, UI, API, browser target, environment, dependency or workflow change. The retained reader is not a new prerequisite of the first current-request-only CH→DE pilot.
- No new service, dependency, paid call, or ongoing cost. Existing USD 100 ceiling unchanged.

## 9. Risks and next gate

| Priority | Current state |
| --- | --- |
| P0 | No known newly introduced open authority path, but author inspection is not independent acceptance. Any new authority/custody issue found by TL blocks the PR. |
| P1 | Positive canonical and native tests, full dependency/runtime behavior, native query duration, exact-head full CI and independent diff/import/security review remain **unverified** in the local environment. A test/code failure requires this same author/session to fix and a complete new-head re-gate. |
| P2 | The operation intentionally permits only the existing fictional finite cell, no future reuse lease, and historical unsealed extraction. Wall/source/head freshness can legitimately turn a later read negative. Actual hosted Owner/session/migration/source/target/Production gates remain open and outside this delivery. |
| P3 | This mirror cannot demonstrate full repository hygiene/build or deployment; Root publication and exact-head/actual-main evidence must be persisted in #751/#917/#1150/PR #1151. Historical roadmap entries remain snapshots. |

**Next step:** Root independently reviews this complete package, publishes only the listed manifest files atop the exact remote docs head, obtains genuine full CI/native PG16 plus fresh Auth and Preview evidence, then alone decides Ready/Merge. After any merge, actual-main push CI and exact Production/jetnity.com identity remain required before closing #1150. No claim that #917, the own entry-rule database product, a real CH→DE pilot or the user's actual jetnity.com flow is complete.

Author **returned / STOP**. No next slice, Ready, Merge, held target operation or Product-Owner gate is inferred.
