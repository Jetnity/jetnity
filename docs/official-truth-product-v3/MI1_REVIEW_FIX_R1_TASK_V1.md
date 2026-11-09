# MI1 review fix R1 — TASK V1

**ISSUED by Root / Technical Lead, 9 November 2026, 21:33 Europe/Zurich.** This is a finite compatibility correction to MI1 #1177 after an actual failed full CI. It is not a product follow-on, dependency update, source qualification, or activation.

## Exact finding and immutable inputs

- Current main: `d7e27f59b3e3cbc96bb63f5d37a33fa029c0e74a`, tree `c417811ff67248c4910bb2c5154bb51885d787eb`.
- Rejected MI1 head: `33e5f4eed79fdbc0a4bb5d8052142325febd8ee2`, tree `0351e84ef3242dc972d557cb54d33b2a4b5058d5`; branch `feat/official-truth-v3-main-integration-1-20261109`.
- CI42671681106 attempt3, actual checkout `fc7a6e969cccf308cf35baa508d747faa1b851bd`, same tree; Core job129413233452 failed. Actual Core8631 tests /8628 pass /1 fail /0 cancelled /2 inherited skips. Typecheck/Lint succeeded; five hygiene checks and Production build were skipped after failure.
- The actual failure is test1613, `protected old canonical, AA, catalog, transport, authority and workflow files stay byte-identical`, at `global-conditions/pilot-context.test.ts:92`.
- Exact raw Core log: 4,225,501 UTF-8 bytes including original BOM/final newline; SHA256 `ed5c6aca0c4b5d8c0e8f3c02a211c26c467ca32da15ee7d7ca6baca1734a833f`.
- Root independently checked all40 `unchanged` rows of `C1_PROTECTED_SOURCES_V1.json`. Two current-main dependency files differ; the first assertion hides the second. All other38 rows remain byte-identical. Historical C1 manifest SHA256 `76a35e4f0b533462c3e3dfde0116f900b71bf253c41665a96bc3889df6b83650` must remain unchanged.

| Path | Historical C1 SHA256 | Exact current-main SHA256 | Current bytes / Git blob |
| --- | --- | --- | --- |
| `package-lock.json` | `a1745501dcd33c931ee4bb21d3c73aca7d1ea92bd7d5213df69fd3105a1f898e` | `71f4f32185dc9acd56b5dcfaec8162f317f7e370f32bdefe9264adbb7fd05b1e` | 320689 / `7b5394006458d34c833cdb5438b06f9f6af28353` |
| `package.json` | `08dfb5ef390cae6fb5a9d5d1f980cebe2ce77f660a66e4c4c73d6c9a08f1730a` | `5ce795c22de79e205f6528e8ae3329d4a7863e11178e0b3fe32a1425e54af4df` | 6467 / `3e8a2b7a40007af29320919401369f17ee53672a` |

Both are mode100644 and literal d7 main inputs already included in MI1. The actual delta is the existing Omio archive script entry, Leaflet1.9.4, @types/leaflet1.9.21 and its @types/geojson lock entry. This task neither changes those inputs nor independently accepts the external product implementations. No current-main hash is selected from the working directory at test execution time.

## Author recovery and responsibility

Original logical MI1 author: **Jetnity Official Truth V3 Main Integration1 — Codex Generation1**, prior actual session `/root/v3_method_authority_writer`, frozen/STOP and unavailable in the current live agent tree. The original C1 writer is also not an available current session. Root explicitly assigns the bounded recovery to **Jetnity Official Truth V3 Main Integration1 — Codex Generation2**, actual new session `/root/mi1_guard_compatibility_writer`. This is a disclosed recovery, not a claim that the old session or a Cursor session resumed. No programmable Cursor/rename capability is exposed; the exact name is repository/task evidence, not a claimed UI rename.

All immediate fixes to this R1 delivery return to this same Generation2 session. Root alone publishes Git objects, decides PASS/Ready/merge and owns release gating.

## Finite implementation scope

1. Add `MI1_PROTECTED_SOURCE_AMENDMENT_V1.json` under this documentation directory. It records the exact failed head, historical manifest identity, current-main commit/tree and precisely the two old-to-new file identities above, with explicit reasons. No generic override, wildcard, inferred baseline or other changed path.
2. Amend only the final protected-source test in `lib/readiness/official-truth-product-v3/global-conditions/pilot-context.test.ts` so all40 protected rows remain strictly checked. The historical manifest must be pinned and preserved. The new reviewed amendment must itself have a closed/pinned identity. Validate exactly the two expected paths and their historical identities before using the exact reviewed main identities; every other row retains its original pin. An absent/malformed/expanded amendment, arbitrary new file identity or mutated protected file must fail. No skipped row, fallback to actual bytes, automatic repinning, test disabling or permissive success. Rename the test accurately if needed; retain the other four tests unchanged.
3. Update only the existing current `OFFICIAL_TRUTH_PRODUCT_V3_CURRENT` blocks in `JETNITY_START_HERE.md` and `docs/ACTIVE_WORK_STATUS.md`, first preserving their complete preceding blocks verbatim in new `MI1_R1_PREVIOUS_START_STATUS_BLOCKS_V1.md`. Add a clearly delimited current R1 section at the top of `MI1_HANDOFF_V1.md`, preserving prior history. Record CHANGES REQUIRED on33e, actual recovery author, pending publication/new-head full gates, and no new product dispatch. Never invent a future SHA/run/result.
4. Deliver new `MI1_R1_AUTHOR_HANDOFF_V1.md` and `MI1_R1_SOURCE_MANIFEST_V1.json` with all changed author-owned file hashes, exact local commands/results and limits. Self-review is input, not Root PASS.

Root owns this TASK and independent finding/review/publication receipts. Do not modify Root evidence, historical C1/MA1/MI1 acceptance records, indexes/refs, other worktrees, or any path outside the finite scope. In particular both package files, every runtime/SQL/authority/source/country/UI module, workflows, tests outside the named final test, dependencies, lockfile, config and all existing assets retain literal33e bytes. No new migration, public route, native executor or API is allowed.

## Validation and acceptance

- Reproduce the existing guard failure and run its five existing non-native tests after correction; independently enumerate all40 protected rows and confirm exactly two reviewed main identities plus38 unchanged historical identities. Do not create implementation-mirroring test suites.
- Root and an independent reader review the full final diff, exact package identities, fixed amendment identity, closed path set, history preservation and author manifest. Any unauthorized delta is CHANGES REQUIRED.
- No local PostgreSQL/native/socket attempt, no alternate connection, no full local build against the incomplete checkout. Sixteen binary contents remain absent/skip-worktree; preserve their existing Git blob IDs and disclose the limitation. Use `GIT_NO_LAZY_FETCH=1` for every Git read; no fetch or push.
- Do not publish while Root is still retaining the actual terminal evidence of attempt3. Root publishes a new exact head only after independent review, then requires the complete unchanged CI: Typecheck/Lint/Core, five hygiene checks, Production build, all actual native families and UI artifacts. All prior exact-head gates become historical when the head changes. No favorable rerun of failed33e, no timeout or check weakening.
- Fresh main/merge-base/ahead/behind, actual full diff, required checks, exact Preview, review threads, mode/rules/Guardian and special gates precede any Root decision. Any eventual merge additionally requires actual-main CI/Production verification.

## Continuing boundaries and STOP

Method **NOT_APPROVED**; #1139 **NOT_RELEASE_READY**,17 pre-Owner gaps. #917 remains APPLY_RESPONSE_SUCCESS / INDEPENDENT_READBACK_PENDING, ledger UNKNOWN, Stage2 NOT_ATTEMPTED. Never retry, rephrase, delegate, reroute, switch transport or human-substitute the specifically refused readback. No renewed request for old Owner evidence. #1131 Ready STOP; #1135 Research Hold and independent platform Ready STOP; #968 exact Preview isolation; #911/#913 Privacy remain.

No Hosted DB/Auth/RLS/ACL/migration/credential query or mutation, real source/provider/research call, scheduler, notification, new cost, method grant, public V3 or Production feature activation. Existing unchanged Auth CI is metadata only. Dependency audit notices and narrow-screen presentation limits remain explicitly unaccepted for public launch.

**STOP after the bounded frozen handoff. Do not mark Ready. Do not merge. Do not start a follow-up slice. Do not commit or push.** Root's independent acceptance and complete new-head gates are mandatory.
