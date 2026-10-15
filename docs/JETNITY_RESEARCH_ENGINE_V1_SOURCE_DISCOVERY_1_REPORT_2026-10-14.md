# Source Discovery 1 — implementation report

Author: **Jetnity Research Engine V1 Source Discovery 1 — Codex Generation 1**.
Session `01a13c62-4e98-7902-9f90-8ab134a98fb7`; existing Draft [#949](https://github.com/Jetnity/jetnity/pull/949), issue #948.

**Offline implementation delivered for independent TL review. Local full tests and build are not green. No live research or qualified source is delivered.** The exact published HEAD/tree and its subsequent external CI/Auth/Preview receipt are recorded in the final PR author handoff. This report describes that commit's implementation and original local checks, not later CI outcomes.

## Scope and provenance

Immutable TASK blob `0ab1d067d45a84b51c9f4acfcf3539ad2a0b94cf` unchanged. Main baseline `10fdee40c3e4fcc7dffb6515dda5acf1db391aed`, actual tree `e5c899c3a5465fc5dc02b4738184c9cb8eff6bb3`. The differing tree value in one #751 historical comment is not used as Git identity. Material implementation parent `dfcc58f576b5ae3f7b73e2396206e4f3be2639c5`, tree `c56ef2dac0a8c5caf703b87a07f987e57197f740`; mode NORMAL.

The [exact TL amendment](https://github.com/Jetnity/jetnity/pull/949#issuecomment-6179537467) permits only one existing file in addition to the original TASK allowlist. Its change is nine added lines: the literal coordinator importer with explanatory comment and five finite negative lookalike paths. Every original importer, scan root/filter/regex and strict equality assertion remains unchanged. All other runtime/test/config/package/workflow files remain unchanged.

## Executable path and outcomes

`discoverOfficialTruthSourcesOffline` in `lib/readiness/official-truth-source-discovery-v1/coordinator.ts` consumes exactly `{coverage, scope, factKind, registry, descriptors, candidates}` as bounded data. It composes the existing research decision, complete identity graph constructor, execution plan/source router, deterministic query helper, and existing discovered-URL validator. There is no second source registry, URL policy or research engine.

1. Data-shape preflight refuses functions, callbacks, proxies (including revoked proxies before any trap), getters, custom prototypes, symbols, hidden/extra fields, sparse arrays, cycles and oversized data. It performs no source/URL validation. Limits: 8,192 nodes, depth 16, 4,096 code units per string, 65,536 charged UTF-8 bytes, at most 128 array entries / 129 object properties across this small offline envelope.
2. Canonical research decision validates coverage/scope; explicit fact kind must equal that canonical coverage cell. Invalid input returns no identities or caller text. `current` produces `no_research` after the dependency/data boundary succeeds.
3. The unchanged `createContentIdentityGraph` rebuilds the entire graph, including unused historical/representation rows. Both supplied authority copies must equal the rebuilt canonical registry. Missing, conflicting, forged or noncanonical snapshots fail before intents. The rebuilt registry/graph is supplied to all subsequent routing and URL validation.
4. Synthetic profile pins receive only a locally owned always-refusing verifier to satisfy the existing constructor's data-only contract. The constructor never calls or retains a verifier; the coordinator accepts no injected function. This validates graph relations, **not** the availability of a real content verifier, provenance, publisher rights or any body. It registers no runtime profile. Eventual live catalog custody must come from the existing server-held boundary.
5. `query-intents.ts` projects only canonical fact/requirement/country/document classes and registered source/domain pairs. At most six intents, stable canonical order, no ranking or silent truncation; overflow returns `query_budget_exceeded`. No arbitrary search/query string is accepted.
6. Passing `candidates: []` returns `gap_unqualified/no_candidate_hits` with prepared intents. Replay the same envelope with at most sixteen strict synthetic `{sourceId,url}` pairs. The existing URL validator re-routes the canonical request and checks source, host, blocklist, URL, tracking, duplicates and registered content representation. Any bad hit rejects the whole batch, without rejected URL echo or partially retained candidates.
7. Results are `ready_candidate_urls/candidate_only`, `gap_unqualified/no_eligible_official_source`, `gap_unqualified/no_candidate_hits`, `no_research/current`, or `blocked_invalid` with a sanitized finite code. Every variant retains `officialResult: unknown`, `sourceQualified: false`. Candidate outputs contain only the existing exact URL/identity tuple, never accepted Evidence/Rule or visa advice.

There is no transport or callback to execute prepared queries. No UI, route, job, cache, storage, retrieval or acceptance entrypoint imports this seam. The optional audit script was unnecessary: the tests execute the complete scenario and cold import.

## Acceptance evidence

All new executable evidence lives in `lib/readiness/official-truth-source-discovery-v1/coordinator.test.ts` (30 tests).

| Requirement | Observed proof |
| --- | --- |
| D1 / T01 | Canonical current produces no search; missing and all three canonical recheck reasons produce stable bounded intents with distinct request keys. Invalid coverage/scope refuses. |
| D2 / T02 | Actual scope constructor and coverage evaluator produce CH citizenship / CH passport / VN visa cell; exact query verified. Country, citizenship, document, coverage-key and explicit fact mismatch refuse that cell. A separately valid fact yields a different canonical request key. Six domains pass, seventh refuses. No nationality inference from issuer. |
| D3 / T03 | Synthetic registered `.example` URLs return exact canonical identity tuples in stable order; sixteen pass, seventeenth refuses; aliases/duplicates reject atomically. No body, legal fact or accepted truth. |
| T04 / D5 | Empty canonical registry and licensed-only registry produce no-eligible-source gap with no intents/candidates. Null or incomplete registry is blocked. Valid synthetic VN fixture and fake-domain cases are executable tests. |
| T05 | Unknown/spoofed government-like domains, ineligible source IDs, licensed providers, cross-source URLs, blocked/private hosts, credentials/fragments, tracking, non-HTTPS, extra flags/rank/snippets/prompt text and mixed bad batches refuse without echo. |
| D4 / T06 | Missing/duplicate items/profiles/representations, conflicts in unused rows, unavailable profiles, invalid authorities and inconsistent registry copies refuse before intents. Cycles/accessors/proxies/methods/oversize/extra dependency fields refuse; trap counter remains zero. Repeated calls produce identical frozen outputs and do not mutate inputs. |
| D6 / T07 | Fresh child arms fetch, WebSocket/XHR and Node HTTP/HTTPS/HTTP2/TCP/TLS/DNS traps before dynamic import, then executes positive/gap/fake-hit scenarios: zero attempts. Runtime import-closure inspection and repository scan exclude server/provider/storage/acceptance entrypoints and hosted importers. No env or credential access in new runtime. |
| T08 | Focused existing coverage/request/routing/execution/URL/identity/server-held/engine suites plus new tests: 205 pass, 0 fail/skip. Full suite also exercises unchanged source-foundation, Trust and public provider-off contracts. |
| T09 | Original unchanged local gates below; exact material-head external CI/Auth/Preview belong to the final PR handoff receipt. |

**Scenario limit:** ordinary-passport subtype, tourism/purpose and 21 days are scenario notes only. The current canonical scope cannot prove their legal applicability. No parallel scope, invented Vietnamese visa exemption, inferred rule or `not_required` result was introduced.

## Original local checks

Original outputs are retained privately; only counts/digests are published in `docs/evidence/jetnity-research-engine-v1-source-discovery-1/author-evidence.json`.

| Original command/check | Result |
| --- | --- |
| Existing installed dependency tree from unchanged `npm ci` | Prior install PASS; packages/lock unchanged; 19 reported advisories (2 moderate / 17 high) remain historical install counts. |
| Focused Node test command (new suite + eight existing suites) | **205 tests / 205 pass / 0 fail / 0 skip**. |
| `npm run typecheck` | PASS. |
| `npm run lint` | PASS, 0 errors / 145 existing warnings. |
| `npm run test` | **6,786 tests / 6,775 pass / 10 fail / 1 skip**, 50.39 seconds. All ten failures require absent native PostgreSQL binaries; not green. No hosted fallback, installation, altered test/limit or retry. |
| `npm run check:setup:ci` | FAIL: sandbox tsx IPC EPERM. |
| `npm run build` | FAIL at the unchanged prebuild setup IPC step; Next compilation not reached. No production-build PASS claimed locally. |
| `npm run check:api-schutz`, `check:schema-bezug`, `check:dead`, `check:exports`, `check:deps` | All PASS. |
| `npm run check:operating-mode` | PASS with baseline/parent context; exact published-head readback guard is separately recorded in final handoff. |
| Author diff whitespace check | PASS. Immutable TASK's existing Markdown hard-break spaces are retained. |

Development evidence is not hidden: initial new test run was 24/26 (a regex accidentally matched `21` inside a hash; a test used nonexistent document class `identity_card`). Corrected to a semantic assertion and existing `national_id`; two initial TypeScript errors in new code/tests were also corrected. Subsequent changed-code focused run passed 75/75; after completing additional adversarial tests the final focused run passed 205/205. These are ordinary development fixes, not changes to existing gates or native-PG tests.

## Retained blocker history and new risks

The [original author handoff](https://github.com/Jetnity/jetnity/pull/949#issuecomment-6179477789) remains historical evidence. The original URL-only reproduction admitted missing items, duplicate item versions and missing profiles; the canonical constructor rejected them. The import-only probe failed one exact-inventory test, was removed, and no runtime was delivered in that commit. The TL independently confirmed the cause and authorized the narrow amendment. The JSON retains the original evidence object and digests. The new negative tests now reject those cases through the actual coordinator. This was never proof of a live catalog exploit.

A newer [#748 report COS-20261015-0757-014](https://github.com/Jetnity/jetnity/issues/748#issuecomment-6185540871) reports P1 Next.js advisory exposure on current main (Next 16.3.8; reported sharp 0.35.4) and requests TL/Owner upgrade/runtime review. This author read the report, confirmed the unchanged local Next pin, and performed no live advisory reproduction or package upgrade. The risk remains open; CI success would not resolve it. Prior compressed-log privacy exposure COS-20261014-1105-012 also remains open. No original logs/archives/private identifiers are published here.

All protected states persist: #917 SOURCE_NOT_QUALIFIED, application/source gate false, contracts empty, provider OFF; BP1 real GET unauthorized; BMDS contact declined; DEV-PREP-1 first apply response SUCCESS / readback PLATFORM-SAFETY-BLOCKED / second NOT ATTEMPTED; #913 privacy stop; #937 paused / #934 hard-blocked / #626 reserved. No Supabase call/replay/alternate access, source request, OpenAI, provider activation, Rule/Evidence write, secret/cost change, manual deployment or Production action.

**STOP after final exact-head author handoff. Independent TL review remains required; DO NOT MARK READY / MERGE / DEPLOY / START A FOLLOW-UP.**
