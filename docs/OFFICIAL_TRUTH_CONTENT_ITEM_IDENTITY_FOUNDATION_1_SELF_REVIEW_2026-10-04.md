# Official Truth content-item identity foundation 1 — author self-review

Date: 4 October 2026 (Europe/Zurich)
Issue #808 / Draft PR #809 / Generation 1
Baseline: `6f3215860c5f84f77d3139128a90663be7e257d8`
Model: GPT-6 Astra — Sehr hoch (`gpt-6-astra`, `xhigh`)
Status: **AUTHOR ADVERSARIAL EVIDENCE / NOT INDEPENDENT TECHNICAL-LEAD PASS**

## Mandatory task coverage

The numbered rows map the task's 30 mandatory cases to executable coverage in `official-truth-content-identity.test.ts`. Assertions use synthetic `.example` fixtures. The 45 tests pass; no source is contacted or real profile defined.

| Task cases | Executed attack / result |
| --- | --- |
| 1, 2, 19 | Two items under one source and the same local id under two sources retain three distinct keys/supports. Complete graph validates corresponding URLs. |
| 3 | Duplicate external namespace/id under different local ids fails in either order, including a historical row. Changing namespace/id across versions of one item fails. |
| 4, 5 | Same exact URL in two items or representation streams fails regardless of order. Final-only targets also collide. |
| 6, 18 | HTML/API produce two valid representations but equal ContentItemRefs. A support list containing both fails as duplicate; keys for their representation streams differ. |
| 7 | Domain resolver approves an unregistered sibling, while content resolver returns `not_registered`. Query reordering/removal/value changes also remain unregistered. |
| 8, 9 | Wrong-authority request/final URLs, unknown source, unregistered domain, blocked child and licensed-provider ownership fail. Same-authority mirror explicitly pinned in descriptor succeeds. |
| 10 | Current representation pointing at a historical item version fails. Missing exact item version fails. Explicit historical/current versions with matching links succeed. |
| 11, 12 | Duplicate version rows and multiple current versions fail separately for items and representation streams. |
| 13, 14 | Missing profile, wrong id/version, historical-only profile and omitted production-empty registry fail. Historical representation also needs a current profile. |
| 15 | Mixed-case, parameterized, malformed, newline and wildcard media types fail; normalized structured suffix succeeds. |
| 16 | HTTP, credentials, localhost/sub.localhost/.local, nondefault port, wildcard, fragment, whitespace and noncanonical URLs fail at descriptor boundary. Resolver strips fragments from request identity only. |
| 17 | Duplicate support refs fail; no sorting/deduplication hides them. |
| 20 | Pair ordering and complete graph serialization are unchanged by reversal of items, representations, request URLs, publisher ids and profiles. |
| 21 | Top-level and nested `defineProperty` mutations throw; input mutations cannot change graph snapshot. Recursively checks all graph data and every structured success output for freezing. No verifier closure escapes. |
| 22 | v3 equals the existing semantic projection and full legacy canonical regulatory-cell serialization. Lowercase/reordered/duplicate citizenship input follows existing parser normalization. Unknown scope fields, personal identifiers, ninth citizenship, invalid date and foreign credential relation fail through existing parser. |
| 23 | source/item/representation and each regulatory cell dimension alter v3. HTML/API have different streams but one pair. Source-bearing scope cannot silently switch authority. |
| 24 | ev2 canonical field order is fixed and independently hashed with Node crypto; input property order cannot change it. |
| 25 | Every bound identity field changes ev2, including validity start/end, item/representation/profile versions and representation id. |
| 26 | Bad ids/versions/key/hash/type/URL/time, rollover calendar date, 24-hour timestamp, missing/nullability errors, inverted validity and extra lifecycle/annotation/predecessor fields fail. |
| 27 | Production registry equals empty array, is frozen, and rejects push. |
| 28, 29 | Source inspection allows exactly five existing pure imports; no real authority identifiers, effect modules, fetch, env, clock, filesystem, SQL or acceptance/store code. Only canonical scope/serialization helpers are imported from Evidence/Rule modules. |
| 30 | Repository source scan finds zero non-test production importers. Independent terminal `rg` returns only the new test's import and source assertions. |

## Additional adversarial review

- A historical URL cannot be reused by another item or stream, even if no historical descriptor is current. A retired URL no longer resolves; a later version of the same stream can retain its reservation.
- Representation media type/locale drift fails rather than silently relabeling one stream. Schema/profile changes are descriptor revisions; profile tuple must be supported/current.
- Empty complete graph succeeds but authorizes no URL. Unknown/incomplete item/version links fail before lookup use.
- Invalid authority registry with overlapping domains is revalidated through the existing constructor and fails. Missing blocked-domain collection fails; denies are preserved/copied/frozen.
- All descriptor properties must be known own enumerable data. Getter attacks are rejected without invocation; functions, prototypes, symbols, traveller/decision extras, sparse/augmented arrays and excess bounds fail.
- Profile callbacks are never invoked by graph construction. A throwing callback confirms zero invocations. Profiles copied into the graph contain only id/version/current metadata.
- Resolver checks exact match cardinality before using a representation. A deliberately forged graph with duplicate bindings returns ambiguity. No order-based tie-break exists.
- Deterministic SHA-256 uses the existing digest implementation; tests independently verify v3 and ev2 against Node crypto. Only input timestamps are parsed; no current-time authority exists.

The graph is deliberately a pure data contract, not a sealed server attestation. TypeScript cannot prove arbitrary callback purity or prevent a caller from constructing a structurally similar object. No live path imports it. Future retrieval/acceptance must enforce server ownership and exact identity reproof; adding this module does not close F8 or authorize registration.

## Verification limits and findings

Initial test-helper type narrowing and an unused type import were fixed; final new files pass typecheck/lint. Final targeted + directly affected run: 88/88 tests. Full local suite: 4,673/4,675 pass, two unchanged PostgreSQL integration tests fail before startup because `/usr/lib/postgresql/16/bin/initdb` is absent on macOS. The complete gate is now verified on existing Linux CI run `37164635562`, implementation head `8875c03d054d7763a1814f85583e598996204893`: 4,675/4,675 pass, zero failures/cancelled/skipped, all type/lint/hygiene/build jobs successful. The local failure is retained as evidence, not waived or relabeled. No local database or substitute system binaries were installed; CI used its existing disposable fixtures. Local canonical Production build succeeds after a sandbox IPC restriction was cleared through approved execution. Lint has 149 existing warnings, zero errors and no warnings in new files. The final docs-only update retains the tested code/test blobs; final-head CI is separately read back at delivery.

No material scope expansion was needed. No runtime issue found in this author review remains knowingly unresolved. That statement does not replace independent exact-head review. Conservative URL/history/profile restrictions are documented in the report and handoff; they are not implied transition machinery.

The immutable task remains byte-identical. Exactly the module, test and three required reports are authored after dispatch. No existing runtime/config/test/schema file is edited. Remain Draft and STOP; the Technical Lead owns exact-head acceptance, Ready and merge.
