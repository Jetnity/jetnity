# Fix15 TASK V1.2 — preserve TypeScript coverage after R11 moves

Frozen 2026-11-08 14:06:49 UTC, before this added implementation change. Full V1.1 and V1 remain unchanged below.

Root's direct preflight found that current `tsconfig.json`, blob `187583dcb17aed1abef60ebddf9b9be01a013641`, includes app/components/lib/types and generated Next types, but not scripts. Moving the eight existing lib wrappers would otherwise remove their explicit TypeScript roots and could lose transitive checking of the same native helpers, while tsx runtime transpilation alone would not restore that coverage.

Additionally authorized: add exactly `scripts/db/official-truth-accepted-store-trip-integration-1/required-tests/*.test.ts` to `tsconfig.json` include. Preserve every compiler option, previous include and exclusion. This recreates the eight moved TypeScript roots and their existing transitive imports; it does not broaden to unrelated scripts or change production code.

The existing CI coverage guard adaptation also verifies this scoped include and the eight-entry exact set. All source/runtime/CI gates in V1.1 remain mandatory. The author may continue already-authorized fixture work; this additional TypeScript-root edit is authorized only from this version. No product scope, SQL, timeout or Owner gate changes.

---

# Fix15 TASK V1.1 — Root clarification before implementation

Frozen 2026-11-08 14:02:41 UTC. This version adds only the concrete active CI-guard adaptation and npm alias composition identified by independent source review. The full V1 follows unchanged below.

- Additionally authorized file: `lib/readiness/official-truth-atomic-version-refresh-1.test.ts`, exact baseline blob `0969ef271969c262ff41ab137691dbe0fbcd7851`. Root read its current mandatory-CI test at lines94–104. Adapt that existing test for the fourth job family; retain its old Atomic/always/strict-success protections and explicitly guard the two matrix groups, exact union of eight unchanged wrappers, Core identity entry and no optional execution. Do not modify the Atomic implementation or native matrix.
- Use a composed local alias `test:accepted-store-native` = `npm run test:accepted-store-native:store && npm run test:accepted-store-native:lifecycle`. Each of the two underlying commands keeps its four explicit files and concurrency1 from V1. No wildcard or custom discovery is necessary.
- Exact npm `test` composition becomes `npm run test:core && npm run test:accepted-store-native && npm run test:persisted-native && npm run test:refresh-native`. CI still runs the two accepted-store groups independently with matrix fail-fast:false, so one group failure does not cancel the other.
- Required wrapper destination remains V1's `required-tests/` folder; adapt imports to `../<actual existing implementation>`. Preserve all8 names/callbacks/timeouts and the pure implementation wrapper bytes.
- Independent source mapping found595 original Core test files; the intended partition is587 Core +8 required runtime files, still595 unique files. This is a source-discovery count, not a runtime PASS.
- Refined actual comparable setup measurement: checkout/setup-node/npm-ci/setup-check/operating-mode took63.316s on114 and48.289s on4fbe. Import, test and teardown time must still fit the fresh20min group execution; observed timing is not a hard guarantee.

This is still the same immediate Fix15/R11 correction of #1155, not a new product slice. Author, scope, source evidence limits, ownership, all existing test/product bounds and special gates remain as V1.

---

# Official Truth Accepted Store Trip Integration 1 — Review Fix15 TASK V1

Status: ROOT-AUTHORIZED bounded corrective work for open #1155 after merged #1156. Frozen 2026-11-08 14:01:13 UTC.
Authority: ChatGPT / Technical Lead. Only Root may issue independent PASS, Ready or merge.
Author: **Jetnity Official Truth Accepted Store Trip Integration 1 — Codex Generation 1**.
Exact continuing session: `/root/accepted_store_trip_integration_writer`.
Corrective branch: `fix/official-truth-accepted-store-trip-integration-1-postmerge-20261108`.
Immutable starting main: `11423774b2c2c5e84af040b546ad564c2e3850e8`; tree `41bf3b0f29ab961d72789d119fdedc1d6e696b91`.
Original TASK V1 and all existing R1–R10 apply. This document adds **R11 only for mandatory test orchestration** and the bounded Fix15 fixture correction; it does not start another product slice.

## Why this correction is necessary

PR #1156 passed complete independent exact-head review and run42482559504 on4fbe, then Root merged it at2026-11-08 13:20:54UTC. The new actual-main push run42484533024 attempt1 failed Core128743397622 and required aggregate128748464612. Work #1155 remains open.
[Complete Root failed-main checkpoint, including all58 actual package proof objects](https://github.com/Jetnity/jetnity/pull/1156#issuecomment-6722301930).

Actual Core:8208 tests/935 suites,8205 PASS/1 FAIL/0 cancelled/2 inherited skips; TAP560 native-publication failed43198.408941ms. Core original4048820 bytes/BOM/60999LF, SHA256 `e0d423d684279b5e9c92228f0ec44c601a1df097cd4a94efe95457c106455731`.
Actual-main Auth, complete Persisted and complete Atomic each independently pass; Production/domain/robots pass for the closed landing only. No prior or unrelated PASS closes the failed gate.

The semantic helper's `snapshotTokenMatched:true` proves progress past the actual untouched reproof, currentness/receipt checks and fresh exact reservation SQL assertion. Its step marker remained `untouched_reproof` across later cleanup. The ordinary `entries` counter measures the beforeRpc hook AFTER HTTP entry/Auth/body parsing, not raw HTTP entry. Those earlier ordinary request phases are unobserved. Disposalunknown/0 intervalrequests follows owner.stop and need not indicate a second error. The own45s lifetime began only after phase32416ms and the failure was43193ms; no45s timeout is established. The true inner error/transport cause remains unknown; `store_cleanup_unavailable` is a source candidate absent from the diagnostic tag list.

## A. Local HTTP fixture ownership and precise failure evidence

Allowed implementation files:
1. `scripts/db/official-truth-accepted-store-trip-integration-1/native-http.ts` (baseline208b5a3366fbfa072722a78aaf23546050bfd58f).
2. `scripts/db/official-truth-accepted-store-trip-integration-1/native-semantic-reproof.ts` (baseline0cda7dc989018ba1388529044ebab1595d6bdd5c).
3. `scripts/db/official-truth-accepted-store-trip-integration-1/native-suite.ts` (baselined40c0cb2fba4dc33e1cd4694fdc01aa22a658525).

Requirements:

- Set an explicit `Connection: close` policy centrally for every response accepted by this local fixture, before its actual handler. Preserve the actual pinned SDK/Auth/SQL, response body/status, held-header/body scenarios and true completion/EOF. Do not set keepAliveTimeout=0; no global dispatcher or global fetch replacement.
- This deliberately removes unnecessary idle connection reuse between separate local HTTP transactions. It is **not** a retrospective claim that a keep-alive race caused114. Exact Node22.23.4 contains idle-socket validation already.
- Extend the existing request evidence with bounded actual server-side stages/status/headers-sent/finish/close metadata. Distinguish raw HTTP entry, authenticated/body parsed, beforeRpc, COMMIT and acknowledgement. Do not serialize tokens, headers, payloads, keys, SQL data, free errors/stacks or personal data. Existing fault hooks and the original thrown errors must retain behavior.
- Add fixed semantic steps before the own-reservation SQL check, before normal cleanup and after its returned acknowledgement. Capture the ordinary request interval independently of the existing beforeRpc counter; preserve a factual snapshot before owner.stop as well as eventual settled observations. Disposal remains separately identified and honestly unknown when unacknowledged.
- Add the exact existing `store_cleanup_unavailable` domain tag; preserve all bounds and redaction of the existing error graph.
- A transparent observer of ONLY this concrete `life.fetch` instance during ordinary cleanup is authorized to identify the client boundary. It must return the identical original Promise, Response and rejection, add no read/clone/tee/retry/fetch, immediately own its nonthrowing observation branch and restore the original method before disposal. Only fixed allowlisted error names/codes/cause codes or numeric HTTP status may survive; no free messages. Record actual started/settled/pending observation counters.
- Preserve all25 existing semantic assertion lines and their meaning, including exact false-fact refusal, original control before/after, exact own-token SQL, removed=1, token-matched actual COMMIT, durable-state equality, unchanged CAS and final zero reservations. New evidence is additional. No unknown outcome may become an acknowledged deletion.

Primary exact-release source pins independently read by Root/author/backend reviewer:
Node `v22.23.4` `lib/_http_server.js`4ff976d02ca441e030c84232592be5463144d958; `lib/_http_outgoing.js`f3abf217787063875f172e56c3369cf7b5910d5b; Undici client-h1.js7d1fdbdf6e7b811f3e399b6fbe46b94d57bb5d56; actual bundled `deps/undici/undici.js`fbabc70fe2a5534fd2adf25de06710138cf7fdfc. The bundle was fetched by Root at the actual release ref. Explicit close ends after response completion; current idle validation is acknowledged, not omitted.

## R11. Isolate all eight mandatory runtime entries without changing their tests

Evidence: current package test:core uses Node --test across595 discovered files with no explicit file concurrency. The actual Node default depends on availableParallelism. Main Browser233404.076541ms and Recovery230507.965547ms pass but retain only6595.923459ms/9492.034453ms under240000ms.
Independent original-log top-level sums (2568 entries, no nested double counting) are1700706.631ms on green4fbe and2899990.509ms on114. The green sum plus observed105.804s before TAP and37.356s after TAP is30.731min, already beyond the current30min job. These are observations, not a prediction of serial speed. Global core concurrency=1 is therefore NOT this correction.

Move exactly these eight tiny wrapper entries from `lib/readiness/official-truth-accepted-store-trip-integration-1.<name>.test.ts` to `scripts/db/official-truth-accepted-store-trip-integration-1/required-tests/<name>.test.ts`:

| Mandatory group | Exact wrapper names |
| --- | --- |
| store | acceptance, context, integrity, native |
| lifecycle | boundaries, browser, recovery, wait-lifecycle |

Only adjust the relative implementation import in each moved wrapper. Preserve the full test name, actual callback and `{timeout:240_000}`. Do not duplicate execution or create skips. The pure `implementation.test.ts` remains at its existing Core location unchanged.

- Preserve the existing three test:core glob arguments and Node imports unchanged.
- Add two explicit npm commands `test:accepted-store-native:store` and `test:accepted-store-native:lifecycle`, each invoking the same Node22/server-only-register/tsx setup, `--test --test-concurrency=1`, and exactly its four explicit wrapper paths. No new custom discovery runner or environment opt-in.
- `npm test` must still execute Core, both mandatory groups, full Persisted native and full Atomic native. No dependency/version/lock changes are needed for scripts alone.
- Add a mandatory CI matrix job `accepted_store_native`, group [store,lifecycle], `fail-fast:false`, separate standard ubuntu-latest runners, Node22.x,20min per group. Each has full checkout, npm ci, setup and the existing exact-ref operating-mode guard, then its exact npm command. No new hosted credentials. Four unchanged240s entries give a maximum16min of test budgets, with4min for setup/finish; this does not lengthen any test or product lifetime.
- Core remains30min; Persisted20min; Atomic25min with its existing1200000ms aggregate; Auth10min.
- The existing required `Typecheck, Lint & Build` aggregate must depend on Core, Persisted, Atomic AND the entire matrix family, run with always(), and fail unless all four families actually succeed. No continue-on-error, skipped group, changed ruleset or optional gate.
- Retain all nine package entries across Core+matrix and all existing repository tests. Root verifies the old/new entry-set mapping and complete execution evidence, including both matrix originals. Any existing active source guard that needs path/command adaptation must be identified with exact parent pin and reviewed before changing it. Historical evidence/docs keep their old paths and claims as history.

## Documentation and source publication

Update current Handoff and Acceptance Matrix to V11 with honest114 failure, Fix15 and R11, preserving complete historical V10 suffixes. Update ACTIVE with the current corrective-task/PR/latest-TL-evidence pointers and explicit unfinished status; do not invent a CI PASS. Produce a full immutable Fix15 author manifest containing exact baseline/candidate blobs, forward/reverse replacements, entry moves, retained assertions, scope and actual test limits.

Root supplies the complete actual114 checkpoint at:
`docs/evidence/official-truth-accepted-store-trip-integration-1/11423774-ci-checkpoint.json`
blob `8c87413277a698b7bd1dac3976edf2d796e8653e`,
205936 bytes, SHA256 `c516cea38d77cdf1c0e990e72572c9ab589e73bcca172c0ac31e5306971a7e4a`.
Do not rewrite it or the historical failed557 checkpoint. It distinguishes beforeRpc counts from unknown ordinary HTTP entry.

Deliver frozen source blobs/full diffs to Root for independent review. No author Ready, merge, direct main mutation, arbitrary rerun or new slice. Root publishes the bounded corrective draft PR, reviews exact head, waits for the complete originals/Preview/reviews and rechecks actual main+Production after any merge. Every changed head invalidates earlier gates. A source-reviewed observer or healthy fixture is not a runtime PASS.

## Unchanged product and Owner gates

All R1–R10 remain: own-Trip/RLS/currentOwnerAAL2/immutable history, six separate RPCs, actualCOMMIT→Confirm→externalCAS, current retained semantic re-extraction, cryptographic custody and key wipe,45s business lifetime/15s display/300s source, originalexpiry, one bounded R4 disposal≤5000ms/2KiB and truthful unknown. No business retry, lease extension, positive DTO substitution, product/SQL/authority/canonical-verifier change.

**SQL_UNAPPLIED / FEATURE_NOT_LIVE.** #917 remains APPLY_RESPONSE_SUCCESS / INDEPENDENT_READBACK_PENDING, ledgerUNKNOWN, Stage2NOT_ATTEMPTED. No refused-readback retry, alternate agent/tool/operator route or bypass script. #1131 original held transport, #1139 effective hosted authority, #968 full future target credential binding, source-rights/retention/key/witness/Owner/privacy and other special gates remain independent. No hosted migration/Auth/RLS action, actual source fetch/HTML retention, paid call or launch/indexing.

First unfinished step after this freeze: same-session implementation of this exact review correction, independent source review and complete fresh gates. #1155 closes only after actual-main verification succeeds.
