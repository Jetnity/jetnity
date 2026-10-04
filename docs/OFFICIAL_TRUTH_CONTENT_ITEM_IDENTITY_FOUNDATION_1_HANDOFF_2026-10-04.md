# Official Truth content-item identity foundation 1 — handoff

Date: 4 October 2026 (Europe/Zurich)
Issue #808 / Draft PR #809 / Generation 1
Logical writer: Jetnity Official Truth content-item identity foundation 1
Branch: `feat/official-truth-content-item-identity-foundation-1`
Baseline: `6f3215860c5f84f77d3139128a90663be7e257d8`
Dispatch: `1a23710bfd64a2f0e809d553843a99b678263c51`
Model: GPT-6 Astra — Sehr hoch (`gpt-6-astra`, `xhigh`)
Session: `01a1042c-4edd-7f21-bb60-f3d54231ed31`

## First unfinished action

Verify the full `npm test` on the existing PR CI Linux runner, then independently review the exact final pushed #809 head. Local macOS full-suite execution has two failures because unchanged disposable PostgreSQL tests require `/usr/lib/postgresql/16/bin/initdb`; 4,673 other tests pass. No local full-suite PASS or independent Technical-Lead PASS is claimed. The [report](OFFICIAL_TRUTH_CONTENT_ITEM_IDENTITY_FOUNDATION_1_REPORT_2026-10-04.md) records all gates and classification. Any new material head invalidates older review evidence.

The final completion delivery records the exact final SHA, which must match live PR head and the checkout used for review. The containing commit cannot embed its own SHA. Read the complete unchanged [task](OFFICIAL_TRUTH_CONTENT_ITEM_IDENTITY_FOUNDATION_1_TASK_2026-10-04.md), the report and the [author self-review](OFFICIAL_TRUTH_CONTENT_ITEM_IDENTITY_FOUNDATION_1_SELF_REVIEW_2026-10-04.md). Self-review is evidence, not independent acceptance.

Re-fetch live main, require the baseline unless the TL explicitly reconciles drift, read live mode/#751 and only #748 MATERIAL newer than `5971622750`, then check writers. At pre-publication recheck: main unchanged, NORMAL, #751 current writer #808/#809, no newer #748 entries; open PRs #809 and historical #28/#39/#40/#50/#52 only. Lower stale #801 sections in #751 do not override the current top/live evidence.

## What is ready for review

One pure module plus its new 45-test suite. No existing runtime/test/config file changed. Exact pair support identity, immutable versioned descriptors, code-owned profile type, empty frozen production profile registry, complete fail-closed graph, exact URL resolution, canonical tuple helpers, v3 lookup and ev2 observation serialization. New + directly affected suites pass 88/88; typecheck, lint, local Production build, mode and all hygiene checks pass.

Review especially:

- two publications under one source versus two renderings of one item;
- immutable external namespace/id across item versions, unique per authority;
- historical URL reservations to the exact representation stream, including final-only targets;
- current representation → current item version and current exact profile version;
- strict own-data-property descriptors, bounded arrays and nested immutability;
- existing `regelScopeAusEvidenceScope` parser plus `evidenceSuchschluessel` serializer reuse; no new regulatory semantic parser;
- fixed-order ev2 includes validity and all descriptor/profile versions; it is not accepted Evidence or transport proof;
- searches prove production registry zero/frozen and no non-test importer.

Graph profiles are copied pins only. Verifier code is never executed or retained. The future code-owned verifier must inspect its own response metadata; this foundation cannot prove identity from real bytes. Null schema/locale are explicit absence of those pins and do not grant a wildcard source profile. No profile is registered to use them.

## Narrow future boundary

R1 introduces no source registration, source catalog/RPC, retrieval, runtime Evidence v2, Rule acceptance, composer, extractor or store call. The current live paths remain untouched. Existing sourceId still means authority. A v3/ev2 string from these pure functions grants no trust; a future live server must derive/reprove its catalog, response identity, regulatory scope, hash and version bindings.

All-version reservation and current-profile requirements are conservative R1 restrictions. Retire/rebind, historical-profile loading, reviewed path moves and source-specific metadata interpretation need separately bound future contracts. Changing rendering media type/locale creates a new representation stream. A replacement external id creates a new content item. There is no fallback identity from hostname, path, bytes or caller assertion.

S1, R2 and all real profiles/registrations are unstarted. The TL may select later work only after independent review, merge/closure and post-merge continuity under the existing gates. This writer starts none. No SQL, migration, database provisioning, Supabase access or Production mutation was performed.

Exactly six changed files, including the immutable task (blob `47d6383075d14e4cc70018a52a04691c93e3acbd`, SHA-256 `be21ddcb5c771f5ecf85395cb24cd3e8583f53062b1f0dc158fb6191e4143dcb`). Scratch tooling/logs remain outside the repository. Return any correction to this same writer/session; do not create a concurrent replacement.

Remain Draft. Do not Ready, merge or start a follow-up. STOP for independent Technical-Lead exact-head review after the final validation readback.
