# Official Truth same-request request provenance capture 1 — Report

Date: 6 October 2026. Issue #887 / Draft PR #891.

Technical commit: `71020a5418d42fb6f4dfc982ec746656d11333e0`.
Classification: **OFFICIAL_TRUTH_SAME_REQUEST_REQUEST_PROVENANCE_CAPTURE_1_READY** for the bounded technical slice, subject to independent exact-head review. This is not GitHub Ready or merge approval.
This is **#863 section 12 step 2A only**, not completion of step 2.

## Baseline and scope

- Live remote main and merge-base: `fc2734ca60ae3c578fbcd414055fe983773d74d2`; mode `NORMAL`.
- Branch: `feat/official-truth-same-request-request-provenance-capture-1`.
- Technical commit is 2 ahead / 0 behind that main (TASK seed plus implementation).
- Immutable TASK: `docs/OFFICIAL_TRUTH_SAME_REQUEST_REQUEST_PROVENANCE_CAPTURE_1_TASK_2026-10-06.md`, blob `b55a922a200d067041d4472b7ed40e0d8257acb0`, unchanged.
- Live #751/#741/#887 and PR #891 read; #855/#861/#863/#880 confirmed merged. Their integrated contracts, retrieval, proof/extraction, R2 tests and import fences were inspected. #855's `freshRetrieval.requestUrl` requires the actual initial request, never reconstruction.
- Parallel #888/#889/#890 paths remain untouched. No global continuity document changed.

## Implementation

The successful server-owned retrieval now has a readonly `requestUrl`. It is captured from `erstesZiel.canonicalUrl` after fragment removal, source/registry checks and content routing. The first HTTP hop uses that same captured string. Redirects mutate only the separate current URL; the final verified `canonicalUrl` remains independent. The existing copied/deep-frozen result includes the initial URL.

Same-request extraction reads the returned string, checks it against the selected approved request and binds it per support. Missing/non-string values fail with `invalid_source_snapshot`; a different string fails with `support_binding_mismatch`, before extraction. `OfficialTruthSameRequestRetrievalProvenienz` projects that captured value in proof-support order. It never reconstructs a URL after retrieval.

The deterministic extractor has a closed retrieval schema. Its existing sanitized projection deliberately remains unchanged: request provenance stays beside that projection in `Gebunden`, then flows into the material's retrieval provenance. This avoids widening the extractor or composition-policy contracts outside the TASK allowlist. The composition result remains exactly `{status, seal}`; complete phase-A/B context capture is not implemented.

## Contract evidence

| Requirement | Evidence |
| --- | --- |
| Ordinary request | HTTP trace, initial requestUrl and final canonicalUrl agree. |
| Final-only support | Direct final URL is ineligible for initial routing; actual selected start redirects to final support; returned provenance equals the first HTTP trace entry. |
| Selector priority | When canonical support URL is allowed but is not requestUrls[0], it wins and is preserved. |
| Query fidelity | Repeated parameters, order, lowercase percent escapes, plus, empty value and encoded tilde remain exact. |
| Canonicalization/fragment | Uppercase scheme/host, default port and dot segments canonicalize; initial and redirect fragments are absent from HTTP/provenance. |
| Tracking/redirect | Initial tracking and redirected fbclid remain blocked; two permitted redirects never overwrite initial provenance. |
| Multiple supports | Two final-only supports run through real synthetic composition in proof order. Separately, injected proof/extractor seams exercise the material array's per-support URL/order mapping in both incoming orders. This does not claim production multi-support primary extraction. |
| Content Identity | Exact bindings, accepted Evidence values, support IDs, review-packet v3 key and extracted fact remain equal across ordinary/final-only runs. R2 suite unchanged and green. |
| Narrow projection | Exact keys exclude sourceSnapshot/body/headers/cookies/DNS/IP/redirect chain/secrets. Injected transport sentinels and body text do not escape. |
| Immutability | Recursive frozen checks and mutation attempts cover material, nested arrays/objects and requestUrl. |
| Caller/history | Injected requestUrl blocks at ingress; replayed provenance blocks; a historical URL with revoked current request permission fails before DNS/HTTP. |
| Dormancy | Production extractor and policy registries remain empty; strict importer checks and #880 root remain unchanged. |

## Local verification

Node `22.23.3`; dependency installation: `npm ci --offline --ignore-scripts --no-audit --no-fund` succeeded (530 packages, no dependency edits). Remote CI runs the ordinary `npm ci`.

| Check | Result |
| --- | --- |
| Pre-change focused baseline | 86/86, no skips |
| Server-owned retrieval | 34/34 (28 core + 6 default-profile tests) |
| Same-request extraction | 35/35 |
| Content Identity R2 | 24/24; file unchanged |
| Focused total | 93/93, no skips; seven added test cases plus strengthened assertions |
| #880 foundation + review fingerprint/v3 | 69/69, no skips |
| Broad `official-truth*.test.ts` | 967 total: 963 pass, 4 environment failures, 0 skips |
| Typecheck | PASS |
| Repository lint | PASS: 0 errors, 145 existing warnings; all four changed TS files lint clean |
| Production build | PASS: ordinary `CI=true NEXT_TELEMETRY_DISABLED=1 npm run build` outside the sandbox, Next 16.3.8/Turbopack, 25 static pages |
| Setup | PASS via `node --import tsx check-jetnity-setup.ts --ci`; absent local env warning only |
| Hygiene/mode | dead, exports, deps, api-schutz, schema-bezug and operating-mode all PASS |
| `git diff --check` | PASS |

The initial sandbox build/setup attempts failed opening tsx IPC (`EPERM`); the authorized outside-sandbox build resolved this. Four broad-suite tests require `/usr/lib/postgresql/16/bin/initdb`, unavailable on this macOS host: catalog hardening, content-identity schema v2, source-catalog gateway and store gateway. They are reported as failures, not skipped/passed. No database was installed or contacted to replace them. The full remote CI passed all 5,548 tests without skips, resolving the delivery gate while the local PostgreSQL limitation remains recorded.

Exact commands for the focused/foundation/broad runs use `node --import ./scripts/server-only-test-register.mjs --import tsx --test` with respectively the three focused files, `official-truth-autonomous-producer-custody-foundation.test.ts` plus `official-truth-rule-review-fingerprint.test.ts`, and `lib/readiness/official-truth*.test.ts`.

## Remote evidence

Technical-head [CI run 37506903392](https://github.com/Jetnity/jetnity/actions/runs/37506903392) is **SUCCESS**. Verification job `112417754074` passed typecheck, lint, **5,548/5,548 tests (0 failed, 0 skipped)**, hygiene/mode and Production build. Auth job `112417754487` is **SUCCESS**. [Vercel Preview](https://vercel.com/jetnity-e1b93c82/jetnity-app/6EWgTAba3P5j3zN7oxRzZ8p1FsKn) `dpl_6EWgTAba3P5j3zN7oxRzZ8p1FsKn` is **READY**, target null/Preview, exact technical SHA above, `aliasError=null`; GitHub Vercel status is success. The enclosing documentation commit also needs its own exact-head CI/Vercel readback; final delivery records that SHA rather than inventing a self-referential SHA inside this document.

The native HTTPS push had no configured login. The authenticated GitHub connector published blobs/tree/commit and updated only the authorized branch with expected-head protection and `force=false`. All four blob hashes and tree `81ca7f892820f4c323cc07e899c7ee530451494b` matched the locally tested commit exactly; local Git was synchronized only after an empty tree diff.

## Security and zero-side-effect boundary

SSRF, DNS lookup-to-connection binding, same-source/domain/representation redirect checks, TLS/default-port, body/timeout limits, tracking policy and profile verification were not changed. Existing negative tests remain active. New request provenance is historical data, not a bearer, issuer or future request permission.

No new acceptance constructor, network entry point, provider/model call, DB/Supabase action, store write, schema/migration, Auth/AAL change, registration or activation was introduced or executed by this slice. Retrieval tests use injected synthetic DNS/HTTP/catalogs. Existing semantic proof rebuilding and test-only acceptance fixtures are unchanged; they are not a new live acceptance path. Existing remote CI's Auth job is independently reported, not represented as an agent-initiated database action.

The complete Content Identity contracts/R2 tests/import guards, extractor and composition registries and #880 production root are byte-identical to main. Foundation zero-I/O and closed-issuer guards pass. No F8, receipt/custody-binding emission, graph closure or persistence was started. No new running costs.

## Changed files and remaining work

Exactly eight PR paths, all on the TASK allowlist: immutable TASK; this REPORT; matching HANDOFF and SELF_REVIEW; `lib/readiness/official-truth-server-owned-retrieval.ts` and its test; `lib/readiness/official-truth-same-request-extraction-server.ts` and its test. The optional new test file and R2 test edit were unnecessary.

Remaining #863 step-2/3 prerequisites: executable release pins; trusted original-observation, validity-origin and accepted-origin issuers/resolution; qualification and full immutable phase-A/B artifact context; receipt and custody-binding emission; complete graph closure. Persistence and F8 remain separately gated. This delivery authorizes none of them.

Authorship: Codex Desktop session `01a1124e-b4a5-7cf3-be82-0747c1e2bdab`; local turn-context evidence reports `gpt-6-astra`, effort `xhigh`. No subagents used. PR remains Draft; no Ready/merge.

**STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD EXACT-HEAD REVIEW.**
