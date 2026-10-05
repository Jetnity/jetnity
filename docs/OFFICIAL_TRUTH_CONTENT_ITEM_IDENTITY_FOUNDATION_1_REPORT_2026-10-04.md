# Official Truth content-item identity foundation 1 — report

Date: 4 October 2026 (Europe/Zurich)
Issue #808 / Draft PR #809 / Generation 1
Writer: Jetnity Official Truth content-item identity foundation 1
Branch: `feat/official-truth-content-item-identity-foundation-1`
Baseline: `6f3215860c5f84f77d3139128a90663be7e257d8`
Immutable dispatch: `1a23710bfd64a2f0e809d553843a99b678263c51`
Execution: **GPT-6 Astra — Sehr hoch**, `gpt-6-astra`, `xhigh`, Codex Desktop
Session: `01a1042c-4edd-7f21-bb60-f3d54231ed31`
Status: **AUTHOR DELIVERY / DORMANT R1 / REMAIN DRAFT / NOT TECHNICAL-LEAD PASS**

## Result and scope

The new pure module implements the selected Option-A contracts. `sourceId` stays the authority/domain identity. The ordered `(sourceId, contentItemId)` pair identifies a composition support. A representation stream adds `representationId`; its descriptor version and observation identity remain separate. Two publications under one authority remain distinct. HTML/API of one publication remain one support and have separate lookup streams.

Exactly six added paths versus the baseline:

1. `lib/readiness/official-truth-content-identity.ts`
2. `lib/readiness/official-truth-content-identity.test.ts`
3. `docs/OFFICIAL_TRUTH_CONTENT_ITEM_IDENTITY_FOUNDATION_1_TASK_2026-10-04.md` — immutable TL seed.
4. `docs/OFFICIAL_TRUTH_CONTENT_ITEM_IDENTITY_FOUNDATION_1_REPORT_2026-10-04.md`
5. `docs/OFFICIAL_TRUTH_CONTENT_ITEM_IDENTITY_FOUNDATION_1_HANDOFF_2026-10-04.md`
6. `docs/OFFICIAL_TRUTH_CONTENT_ITEM_IDENTITY_FOUNDATION_1_SELF_REVIEW_2026-10-04.md`

No existing runtime, test, configuration, migration or global continuity file is modified. The scope plan was one dormant module, adversarial tests and these three reports, with no API/database/trip-graph integration, traveller-data surface or recurring service cost. Main risks are identity inflation, ambiguous URL ownership, descriptor drift, partial graph acceptance, scope divergence and mutable authority; the tests attack those boundaries.

## Exported API and bounded choices

All public functions return a frozen `{ok:true,value}` or `{ok:false,reason}` result. Success values are deeply frozen. Errors use a finite reason union; no raw exception/details are retained.

| API | Contract |
| --- | --- |
| `ContentItemRef`, `RepresentationRef` | Immutable pair/triple. Lowercase ASCII id grammar `[a-z][a-z0-9_-]{1,63}`; noncanonical whitespace is rejected. |
| `readContentItemRef`, `contentItemRefKey`, `contentItemRefsEqual` | Exact shape, both fields participate; key is a JSON tuple, never delimiter concatenation. Invalid equality operands fail, rather than returning equal/unequal. |
| `readDistinctContentItemRefs` | Nonempty maximum-eight support list; sorts source then item with code-unit comparison. Any duplicate fails; no dedupe-and-continue. |
| `readRepresentationRef`, `representationRefKey` | Exact triple validation and JSON tuple key. Descriptor versions are not stream identity. |
| `ContentItemDescriptor` | Positive int32 descriptor version/current flag, immutable external namespace/id, nonempty bounded expected publisher/authority identifier sets. One current version per pair. |
| `RepresentationDescriptor` | Exact item version, representation version/current flag, finite exact request URLs, exact final URL, normalized media type, profile version and explicit nullable locale/schema pins. |
| `createContentIdentityGraph` | Validates the complete graph, copies/revalidates the supplied authority registry using the existing constructor, validates cross-links/uniqueness and returns deterministic frozen arrays. No function runs or partial result escapes. |
| `resolveCurrentContentRepresentation` | Exact canonical request/final URL resolution: zero is `not_registered`, one succeeds, multiple fail `ambiguous_url` even on a forged test graph. No first match. |
| `ContentIdentityProfileDefinition`, `ContentIdentityBinding` | Code-owned deterministic verifier type, returning only a bound identity tuple or identity failure. No legal outcome. This slice has no executor. Graph holds copied profile pins only, never a verifier closure. |
| `OFFICIAL_TRUTH_CONTENT_IDENTITY_PROFILE_REGISTRY` | Exactly `[]`, frozen, no real definitions. Explicit fixture registry injection is only used by tests. |
| `contentEvidenceLookupV3` | Existing `regelScopeAusEvidenceScope` semantic projection, then existing `evidenceSuchschluessel` canonical serialization. Replaces the format marker with `v:3`, adds item/representation, and hashes full canonical material as `evidence-key:v3:<64 hex>`. Source-bearing scope must agree with the supplied authority. No second regulatory parser. |
| `contentEvidenceVersionV2` | Fixed-order 16-field identity material and `ev2_<32 lowercase hex>` from SHA-256. Includes all item/representation/profile versions, lookup, URL, type, hash, retrieval and validity. Rejects annotations/state/lineage fields. Does not create accepted Evidence or live-origin proof. |
| `CONTENT_IDENTITY_LIMITS` | 1,024 item versions, 4,096 representation versions, 128 profiles, 16 request URLs per representation, eight publisher/authority ids and eight support refs; versions 1..2,147,483,647. |

External ids and publisher/authority pins use `[A-Za-z0-9][A-Za-z0-9._:-]{0,127}`. They are bounded opaque identifiers, not display names, legal statements or executable selectors. Multiple expected departments are retained without changing the platform-level authority semantics. Locale permits a bounded language/subtag form; schema is a bounded id or explicit null. These contracts cannot authenticate metadata; a later reviewed profile must do that.

Only official-authority sources can own these official items. External namespace/id is unique per authority across all descriptor history and cannot change for an existing item. Representation format/locale is stable across versions of one stream; a new format/locale requires a new stream. Historical data may have no current row, but every current representation must reference a current item descriptor. Every representation, including historical rows, requires its exact code profile version to be current; this is intentionally conservative complete-graph eligibility.

URLs reuse `quelleUrlLesen` and `quellenUrlAufloesen`. Descriptors require canonical HTTPS, default port, no credentials, whitespace, wildcard, local hostname or fragment. The resolver removes fragments before request identity. Queries remain exact and ordered. The final URL participates in both lookup and reservation even when absent from request URLs. An identical final/request URL inside one descriptor is one binding; duplicate request entries fail. R1 reserves URLs across **all versions to the same representation stream**, stricter than item-only reservation. Historical-only URLs are not current permission. There is no retire/rebind or redirect execution. Domain approval never grants a sibling publication.

Data records require exact own enumerable data properties; accessors, symbols, inherited shapes, extra fields, functions and sparse/augmented arrays fail. Graph inputs are copied, not frozen in place. Authority metadata/domains/denies, item expectations, representation URL arrays, profile pins, refs and helper outputs are frozen recursively. Internal Maps/Sets never escape. Code profile callbacks are neither executed nor retained in the graph; runtime purity of arbitrary JavaScript is not inferred from its type.

Timestamp validation delegates to existing time readers, with calendar/range hardening against rollover dates and 24-hour timestamps. `Date.parse` processes supplied values only; there is no wall-clock read or freshness decision. Null validity bounds are explicit; reversed bounds fail. Source-content hash is shape-checked, not recomputed from bytes: the future identity helper is serialization only.

## Startup and coordination evidence

Fetched origin/main and verified the exact baseline and NORMAL mode before material work. #751's current top section names #808/#809, this branch, Generation 1 and Codex Desktop. #748 was filtered to ids newer than `5971622750`; none existed. Open PRs were #809 and historical #28/#39/#40/#50/#52. Available prior Codex writers were idle; the isolated clone avoids shared working-copy writes. Remote branch was the exact task-seed head. The entire 409-line task was read before implementation.

The session's `turn_context` reports `model: gpt-6-astra`, `effort: xhigh`, with matching collaboration settings. No subagent or different model performed material work. #751's lower sections still contain historical #801/main text; its current top section plus live branch/PR evidence control this task. The pre-publication recheck again matched main/NORMAL/#751, with no newer #748 entry, no overlapping writer and unchanged remote dispatch head.

## Validation

Node v22.23.3 / npm 10.9.9; clean lockfile installation (`npm ci`) succeeded, 530 packages. No lockfile/package edit.

| Gate | Result |
| --- | --- |
| New focused suite | 45/45 pass, four suites, no skip. |
| New + directly affected pure suites | 88/88 pass, eight suites: new suite, `source-foundation`, `rule-claims`, `digest`, `regulierungs-anwendbarkeit`. |
| Full local `npm test` | **Not green:** 4,675 tests, 4,673 pass, two fail, no skip. Both existing disposable PostgreSQL tests fail at `spawnSync /usr/lib/postgresql/16/bin/initdb ENOENT` before database startup. |
| `npm run typecheck` | PASS. Initial test-helper narrowing error was fixed before the successful run. |
| `npm run lint` | PASS, zero errors, 149 warnings in unchanged existing files; neither new file has a warning. Initial unused test type import was removed. |
| Canonical `NEXT_TELEMETRY_DISABLED=1 npm run build` | PASS, Next 16.3.8 Production build, 25 static pages. Initial sandbox run failed on the setup tool's local IPC pipe; approved local rerun succeeded. One setup warning: no `.env`/`.env.local`, intentionally no credentials. |
| Operating-mode guard | PASS, NORMAL. |
| Hygiene | `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug` all PASS. Schema-reference check is a local source/type scan, not a database connection. |
| Import/dependency/action searches | Only the new test imports the new module. Module imports exactly digest, Evidence serializer, official URL/time helpers, Rule-scope parser/type and source-registry helpers/type. No forbidden effects or real-source identifiers. |
| Full PR CI on implementation head `8875c03d054d7763a1814f85583e598996204893` | **SUCCESS**, run [37164635562](https://github.com/Jetnity/jetnity/actions/runs/37164635562), verification job `111324943384`, Auth job `111324943491`. Full `npm test`: **4,675/4,675 pass**, 774 suites, zero failures/cancelled/skipped. Setup, mode, typecheck, lint, all hygiene and canonical Production build also succeed. |

The local full-suite failure is environmental: both unchanged tests hard-code a Linux PostgreSQL 16 path absent on this macOS host. No test is skipped or altered, no local database is provisioned, and no system path is replaced to manufacture green. The existing PR CI's Linux runner supplies the complete successful run, including its two pre-existing disposable PostgreSQL fixtures. The log shows the PR merge of exact implementation head `8875c03d054d7763a1814f85583e598996204893` into exact baseline `6f3215860c5f84f77d3139128a90663be7e257d8`. It records 4,675 pass and zero fail/skip, followed by successful Production build. This closes the validation gap without claiming the failed macOS run passed.

The final report-only commit preserves both implementation/test blobs (`d2e708d7c2e53a1d010958dde8fe68ec65312172` / `6d5ae1f680844d437fb403d37616265872dad5b1`). Final-head CI is re-read in the completion delivery; the run linked above is explicitly bound to the implementation head, not silently relabeled as the later documentation head.

## Seed, final head and boundaries

Immutable task Git blob: `47d6383075d14e4cc70018a52a04691c93e3acbd`.
Exact-byte SHA-256: `be21ddcb5c771f5ecf85395cb24cd3e8583f53062b1f0dc158fb6191e4143dcb`.
The final completion report records the exact final commit and remote PR readback. A tracked report cannot embed its own containing commit's SHA; neither the dispatch nor the implementation SHA above is presented as the final review head. Published implementation tree `878ff5da18de3835207004834e2b2ef783328d06` was verified equal to the locally tested tree. Terminal push had no credentials; publication used the connected GitHub blob/tree/commit API with byte-for-byte blob checks and a non-forced branch update. No Ready/merge action was performed.

Final scope/seed/whitespace/live checks remain mandatory before STOP. At the implementation publication, all six paths matched the task allowlist, seed bytes matched dispatch, working tree was clean, `git diff --check` passed, and the explicit PR-base/head operating-mode guard passed. Main had zero commits ahead of the branch merge-base.

No source/catalog/RPC/retrieval/extractor/composition/acceptance/store/F8 wiring, S1, R2, real identity, new SQL/migration, direct Supabase connection, Development/Production mutation, registration, UI or traveller-data change. The new module/tests perform no live network calls. Repository fetch/publication, dependency installation and existing CI are tooling, not an Official Truth runtime capability. The existing workflow also ran its unchanged Auth configuration check; this writer made no direct Auth/DB call or configuration change. No production deployment is initiated by this writer. Profile registry is exactly empty/frozen; there is no non-test production importer. Existing ev1, v2 lookup and Rule-scope behavior remain unchanged.

Classification: **CONTENT_ITEM_IDENTITY_FOUNDATION_READY_FOR_SCHEMA_SLICE**

Remain Draft. No Ready, merge or follow-up. The classification is foundation readiness only; independent Technical-Lead exact-final-head review remains required before any next slice.
