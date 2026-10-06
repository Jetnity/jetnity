# Official Truth same-request request provenance capture 1 — Self-review

Date: 6 October 2026. Issue #887 / Draft PR #891. Reviewed technical head `71020a5418d42fb6f4dfc982ec746656d11333e0` against `fc2734ca60ae3c578fbcd414055fe983773d74d2`. This is builder self-review, not independent Technical-Lead approval.

## P0–P3

- **P0:** none identified. No Production action, live database mutation, secret exposure or new public entry point.
- **P1:** none identified in the bounded implementation. Initial request provenance is captured after validation and before HTTP, copied into a frozen success, checked against same-request selection and preserved independently of final URL. Current registry routing remains mandatory for future calls.
- **P2:** four local PostgreSQL tests cannot run because initdb is absent. Remote full CI `37506903392` passed all 5,548 tests without skips and resolves this delivery-gate limitation; none is falsely reported as a local pass. Initial IPC build restriction was resolved by an authorized outside-sandbox build. Repository lint has 145 pre-existing warnings, with zero warnings/errors in changed TS files.
- **P3:** no additional defect found. Complete #863 step 2, phase-A/B artifact retention and receipt emission remain intentionally unimplemented and must not be inferred from this field addition.

## Adversarial checks

1. Raw input differs by host/scheme case, default port, path normalization and fragment: requestUrl equals the validated first HTTP URL, never the raw string.
2. Multi-hop redirect with a different final URL and query: captured initial string survives; final identity still verifies against the representation.
3. Final-only canonical support plus more than one allowed start: selected actual start survives. Conversely, an allowed canonical support wins even when it is not requestUrls[0].
4. Missing, non-string, foreign, fragment-bearing or tracking-bearing returned requestUrl fails before the extractor. Caller requestUrl injection and provenance replay are rejected.
5. Historical successful requestUrl reused after its permission is removed fails current content routing before DNS/HTTP. Redirected tracking is still rejected before the next connection.
6. Synthetic transport/body/header/cookie/DNS/IP/chain/secret fields do not appear in the exact provenance projection. Deep freezing and mutation attempts cover nested values.
7. Multiple support URLs follow proof order through real synthetic composition. The separate array-projection test deliberately injects primary-shaped proof/extractor results to reach an otherwise single-support primary output; it is projection coverage, not permission to widen production primary extraction or composed output.
8. Accepted Evidence, Content Identity, review v3 and fact remain unchanged across ordinary/final-only runs. R2/import fences and dormant foundation tests pass; registries/root remain byte-identical to baseline.

No production seam receives new callbacks or authority. No sources/profiles/corpus/extractors/policies were registered. No receipt/custody-binding emission, full graph closure, persistence, DB/Supabase, store writes, new Evidence/Rule acceptance or F8 was implemented. No provider/model calls or new costs.

Classification: **OFFICIAL_TRUTH_SAME_REQUEST_REQUEST_PROVENANCE_CAPTURE_1_READY**, bounded to Step 2A. Technical-head CI (both jobs) and Vercel Preview are successful on the exact reviewed SHA; there is no unresolved P0–P2 implementation finding. Full test details, scope, publication method and known infrastructure limits are in [REPORT](OFFICIAL_TRUTH_SAME_REQUEST_REQUEST_PROVENANCE_CAPTURE_1_REPORT_2026-10-06.md). The documentation commit must be checked independently of its technical parent.

Session `01a1124e-b4a5-7cf3-be82-0747c1e2bdab`; `gpt-6-astra` / `xhigh`. Keep Draft, do not mark Ready, do not merge, do not start follow-up work.

**STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD EXACT-HEAD REVIEW.**
