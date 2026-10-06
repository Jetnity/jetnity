# Official Truth same-request composition context capture 1 — Report

Date: 6 October 2026 · Issue #896 · Draft PR #898.
Logical writer: **Official Truth same-request composition context capture 1 — Generation 1**.
Branch: `feat/official-truth-composition-context-capture-1`.
Baseline/main/merge-base at delivery preparation: `bbc48401176611af3e736a10f2973e92147aef29`; mode `NORMAL`.
Technical implementation head: `1f081f1dc1ff551c068c1f4740f2f680b8593530`, 2 ahead / 0 behind main.
Immutable TASK: `docs/OFFICIAL_TRUTH_SAME_REQUEST_COMPOSITION_CONTEXT_CAPTURE_1_TASK_2026-10-06.md`, blob `b0612a23761b5ce84088d7abf3863f18c874ffc0`.
Codex Desktop session `01a112f6-54bc-7872-bf2a-15e559b31ba7`, actual model `gpt-6-astra`, reasoning `xhigh`, verified from this session's local metadata. One writer; no subagents. Authorship metadata is not runtime provenance.

Classification: **OFFICIAL_TRUTH_SAME_REQUEST_COMPOSITION_CONTEXT_CAPTURE_1_READY**.

## Delivered behavior

The existing extraction orchestrator now retains the exact successful Phase A input, full validated extractor/policy snapshots, unique selected pair and complete assignments before its first support retrieval. It deeply freezes those typed data objects while retaining the actual validated `match`/`extract` references privately; no callback is copied, stringified, hashed or reselected. The same `freeze` object and proof registry reference enter actual Phase B. The retained pre-HTTP binding projects only parsed structural scope, scope/review keys, ordered compact supports, support IDs and the single proof reference time. It excludes the proof candidate/proposal, accepted rows with notes, research envelopes and authority payloads.

After every existing support, identity, URL, MIME, hash, extraction and citation check succeeds, the orchestrator associates the exact frozen outward `{status, seal}` object with an invocation-owned entry in a module-private WeakMap. The entry retains the actual Phase B seal, **exactly** `officialTruthCompositionSealView(seal).fact`, complete checked provenance (including targets and all identity fields), selected scalar identities and ordered narrow retrieval provenance. Initial `requestUrl` remains separately bound to the real selected request; `canonicalUrl` remains final identity. No retrieval algorithm or registry runtime changed.

`consumeOfficialTruthSameRequestCompositionContext(unknown)` is a narrow internal, one-shot identity lookup. Unknown/copied/prototypal/proxied/serialized/reloaded/cross-attached results fail without reading their properties. A known result is removed before seal/fact/policy/support agreement is checked. The returned immutable data contains no executable references; private references are released on consumption. Unconsumed entries have weak result ownership and can be collected with dropped results. There is no string-key cache, timer, cleanup job, TTL or persistent retention. No generic setter, attach API, constructor from DTOs, new live dependency injection or route consumer exists. A failure publishes no partial entry. Missing capture agreement preserves legacy outward semantics while leaving capture unavailable.

The capture is **internal in-process execution evidence only**. Test seams can produce it through real synthetic algorithms but grant no live authority. It is not `CapturedGlobalExecution`, global admission, an original/validity/accepted-origin issuer, a complete trusted producer, executable release pin, receipt or custody-binding emission. Neither proposal-null origin nor global non-personal qualification follows from keeping structural values. This slice does not complete all #863 section 12 step 2.

## Scope and exact changed-file inventory

Against baseline/main the final PR contains exactly seven allowlisted paths:

1. Immutable TASK above, added by the existing task-seed commit; bytes unchanged.
2. `lib/readiness/official-truth-same-request-extraction-server.ts` — private capture/consume and actual Phase A/B association.
3. `lib/readiness/official-truth-same-request-extraction-server.test.ts` — test-only reusable offline fixture, optional test-harness runner and direct-entry guard; all 35 original tests preserved and executed.
4. `lib/readiness/official-truth-same-request-composition-context-capture.test.ts` — 21 new adversarial tests plus finite import/export and no-consumer fences.
5. This REPORT.
6. `docs/OFFICIAL_TRUTH_SAME_REQUEST_COMPOSITION_CONTEXT_CAPTURE_1_HANDOFF_2026-10-06.md`.
7. `docs/OFFICIAL_TRUTH_SAME_REQUEST_COMPOSITION_CONTEXT_CAPTURE_1_SELF_REVIEW_2026-10-06.md`.

The enclosing documentation commit changes only the three deliverables after the named technical head. Runtime, tests and TASK blobs are identical to that technical head. Its own hash is deliberately not embedded in its contents; the final delivery supplies the independently re-read enclosing PR head, merge-base/ahead/behind and its own remote gates. Technical-head CI below is identified separately and never relabelled as a later-head run.

No Trip files or unpublished #895/#897 input; no global continuity edits. No database/SQL/migrations/RLS/Auth edits, persistent storage, retention policy, provider/model calls, real source retrieval, registration/activation, Evidence/Rule acceptance path, F8 or Production mutation. Existing proof fixture semantic reconstruction remains existing offline behavior; this is not a claim that the pre-existing proof algorithm never invokes its in-memory semantic validators. The live global root and empty production registries are byte-unchanged. No new recurring costs.

## Executed local checks

All commands run under Node `22.23.3` in the isolated checkout; logs are local work artifacts, not committed data.

| Check | Actual result |
| --- | --- |
| `npm ci --offline --no-audit --no-fund` | PASS; 530 packages, lockfile unchanged. |
| New capture suite | **21/21 PASS**, zero skipped/cancelled. |
| Capture + same-request extraction + composition registry + server-owned retrieval + content-identity R2 + dormant foundation + review fingerprint suites | **199/199 PASS**, 6 suites, zero skipped/cancelled. Includes the 35 unchanged extraction cases. |
| `node --import ./scripts/server-only-test-register.mjs --import tsx --test 'lib/readiness/official-truth*.test.ts'` | **984 PASS / 4 FAIL**, 988 tests, 43 suites, zero skips. Exactly four local PostgreSQL integration tests cannot start `/usr/lib/postgresql/16/bin/initdb` (`ENOENT`). No runtime/capture/import/identity/foundation/v3 regression failed. |
| `npm run typecheck` | PASS after final code/test edits. |
| `npm run lint` | PASS, 0 errors / 145 existing warnings. |
| `npm run build` | PASS on the permitted run outside the IPC-restricted sandbox. Initial sandbox run failed before compilation at the existing tsx IPC listener (`EPERM`); not hidden as a first-run pass. |
| `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug`, `check:operating-mode` | All PASS. Schema reference check is static; no DB call. |
| `git diff --check`; allowlist; immutable TASK blob; origin/main drift | PASS at delivery preparation. |

The four local PostgreSQL failures belong to `official-truth-catalog-hardening-schema.test.ts`, `official-truth-content-identity-schema-v2.test.ts`, `official-truth-source-catalog-server.test.ts`, and `official-truth-store-server.test.ts`. PostgreSQL was not installed and no hosted DB was contacted as a workaround. The first new concurrency fixture initially failed because its citizenship set excluded its linked CH credential; the fixture was corrected to a valid distinct CH/DE scope, then the full targeted suite passed. No production invariant was relaxed.

## Remote technical-head gates

On technical head `1f081f1dc1ff551c068c1f4740f2f680b8593530`, [CI run 37530366433](https://github.com/Jetnity/jetnity/actions/runs/37530366433) is **SUCCESS**. [Verify job 112497877276](https://github.com/Jetnity/jetnity/actions/runs/37530366433/job/112497877276) completed typecheck, lint, **5,579/5,579 full tests, zero failures/skips/cancellations**, all hygiene/mode gates and Production build. [Auth job 112497877520](https://github.com/Jetnity/jetnity/actions/runs/37530366433/job/112497877520) is **SUCCESS**, including the actual `Abgleich` step, not a skipped-secret success. CI provides the full PostgreSQL integration gate; local `initdb` remains unavailable.

[Vercel Preview dpl_7Bqn3ZLY4JTaV2kUbhp5CHTdoAaL](https://vercel.com/jetnity-e1b93c82/jetnity-app/7Bqn3ZLY4JTaV2kUbhp5CHTdoAaL) is **READY**, exact technical SHA, feature branch, `target=null` (Preview), `aliasError=null`. PR #898 is **Draft/open**, mergeable, with no review threads at this read. No independent TL PASS is asserted.

Terminal `git push` had no HTTPS credentials. The authenticated GitHub connector published a commit and performed a fast-forward ref update with expected seed head `fbfcdb8821ad0480cde96b0456c323009d9ff376`. Its tree `664fe066c2ccea8b34d5891377e71f055c1b734c` exactly equals the locally tested tree. A fresh Git fetch confirmed the remote commit and the local branch was aligned without changing any file. This is an authenticated transport fallback, not a new writer or altered implementation.

## Required test matrix and coverage limits

| TASK obligation | Evidence |
| --- | --- |
| Phase A before every HTTP; complete registry; no second selection/catalog | Test-only observer of exact local orchestrator source; actual registry/A/B functions run unchanged. Both HTTP calls see immutable start; winner plus inactive entries remain. One registry validation, A, B and external catalog call. |
| Same selected pair/references and assignments in B | Strict `phaseBInput.freeze === start.freeze`, registry reference equality, exact original function references. Caller arrays, original callbacks/scalars and nested assignments changed after A cannot replace execution. |
| Request/final URL separation and order | Real synthetic retrieval algorithm with final-only URLs, redirects and different language queries; captured IDs/URLs equal actual proof and HTTP order. |
| Fact/seal identity, full checked citations | Strict identity against actual B and seal view; three equal-values rows and five schema-1 branch/outcome/atom/otherwise rows retained. Missing atom/otherwise/outcome, conflicting/missing/duplicate/foreign observations fail. |
| Forgery/reuse/cross-execution | Equal-value new execution yields different real seal/fact. Spread, JSON, structuredClone, Object.create, Proxy, getter, fabricated ID and wrong result/seal association cannot resolve. One-shot deletion and deep mutation rejection. |
| Interleaving | One execution pauses inside retrieval while another completes and consumes; distinct scope, review key, IDs, initial URLs, fact, seal and citations remain separated. |
| Failure/partial/abort | Failure on second support after first success for throw/timeout/hash/request/MIME/identity; B extractor throw; missing capture scalar agreement. No accessible entry. Missing/duplicate/foreign support fails before HTTP. |
| Privacy/outward compatibility | Exact composed own keys/JSON, existing primary key/byte regressions and blocked forms; no raw snapshots, transport/auth/user/session/secret payload, proposal or functions in context. |
| Dormancy/no side effects/imports | Existing guards plus exact finite runtime import/export/consumer lists; empty production registers; global production root `blocked/custody_missing`; no new effectful import/call or test fixture production importer. |

No deterministic garbage-collector scheduling test is claimed; weak ownership and removal are verified structurally and by membership after consume. No browser/device or production-source E2E was run or needed for this internal dormant slice. Local PostgreSQL remains an explicit environment coverage gap even if remote CI supplies the full integration gate. Synthetic fixture identity profiles and injected proof/retrieval seams do not prove real government content, global qualification, original custody or executable release identity. Remote build/Preview success is not a live producer or autonomous-approval proof.

## Findings and remaining producer prerequisites

- **P0:** none identified in this bounded implementation; no Production incident/change asserted.
- **P1:** none identified within capture scope. The broader producer remains blocked by missing original-observation, validity and accepted-origin issuance/resolution; independent global-cell/support admission; full response/transport non-personal qualification; real immutable executable/output/profile/proof/freshness artifact pins and complete closure. These are unmet prerequisites, not closed by capture.
- **P2:** local PostgreSQL coverage limitation disclosed above; the named technical-head CI supplies the full integration gate and resolves that delivery blocker. Enclosing-head gates are checked separately. No guard was skipped or weakened to make local output green.
- **P3:** no blocking in-scope finding. Deterministic GC timing and any live source/browser proof remain unclaimed. Primary selected-definition/fact capture, complete primary citations, remaining #863 step 2, receipt/custody emission, persistence/lifecycle decisions and F8 each require their own reviewed work.

PR remains Draft. Self-review is not independent TL PASS. No Ready, merge or follow-up.

**STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD EXACT-HEAD REVIEW.**
