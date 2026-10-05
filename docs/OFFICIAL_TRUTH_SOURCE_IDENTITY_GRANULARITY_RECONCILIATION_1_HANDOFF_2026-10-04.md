# Source identity granularity reconciliation 1 — handoff

Date: 4 October 2026 (Europe/Zurich)
Issue #806 / Draft PR #807 / Generation 1
Writer: **Jetnity Official Truth source identity granularity reconciliation 1**
Branch: `docs/official-truth-source-identity-granularity-reconciliation-1`
Baseline: `dd001c7b1267792056f1d3cbd743aead716777fb`
Immutable dispatch: `21eccd3b54f8b6f2eda86312271e909e269422dc`
Codex Desktop session: `01a103ff-e516-70e0-a075-33a1d7854b0d`
Verified execution: `gpt-6-astra` / `xhigh` — GPT-6 Astra — Sehr hoch
Status: **STOP FOR INDEPENDENT EXACT-HEAD REVIEW / REMAIN DRAFT**

## First unfinished action

The Technical Lead must independently review the **current pushed head of #807**, not its dispatch commit and not the author self-review. The final delivery reports the SHA; fetch the branch and require that SHA to equal the live PR head. A new material commit invalidates any older exact-head verdict. This document's containing commit cannot quote its own SHA.

Re-fetch main and mode, read live #751 and only #748 MATERIAL after marker `5971622750`, and check writers before review. At delivery the required main is `dd001c7b1267792056f1d3cbd743aead716777fb`, NORMAL. The #751 lower historical #801/current-main text must not override its active-writer section and live Git evidence. Do not start another Official Truth writer while #807 is under review.

Review all four outputs against the unchanged [task](OFFICIAL_TRUTH_SOURCE_IDENTITY_GRANULARITY_RECONCILIATION_1_TASK_2026-10-04.md). The [primary decision](OFFICIAL_TRUTH_SOURCE_IDENTITY_GRANULARITY_RECONCILIATION_1_2026-10-04.md) owns architecture; the [report](OFFICIAL_TRUTH_SOURCE_IDENTITY_GRANULARITY_RECONCILIATION_1_REPORT_2026-10-04.md) owns executed checks/limitations and the [self-review](OFFICIAL_TRUTH_SOURCE_IDENTITY_GRANULARITY_RECONCILIATION_1_SELF_REVIEW_2026-10-04.md) owns adversarial traces. Author delivery is not PASS.

## Decision to review

**Option A only:** sourceId = authority/domain; `(sourceId, contentItemId)` = official item and composition support; a separate representation id/version pins a rendering; ev2 Evidence binds exact tuple/URL/type/hash/time/validity/cell. No real ids are allocated. National List and Appendix can share sourceId and still be distinct supports. HTML/API cannot satisfy two-support composition. A host allowlist never grants arbitrary publication permission.

The item and representation registry is server-held and read once with authorities/denies. A separate code-owned identity profile verifies the response's own identity before legal extraction. Unknown/mismatched/ambiguous content fails closed. The identity layer does not implement the source-specific legal extractor or legal policy. No first-match or cross-item redirect learning exists.

The proposed `sourceIds` support sets, assignments and observations become explicit content-item pairs; authority lists are informational only. All branch/atom/field projections bind one accepted Evidence version per item. Real extractor, policy, identity-profile and region-pin registries remain empty until separately reviewed registration. Composed schema-1 acceptance and all schema-1 persistence retain their existing block reasons. F8 is separate, and `regelKandidatAkzeptieren` is the only Rule acceptance constructor.

## Evidence for independent review

- Source/domain proof: `source-registry.ts`, the source-catalog server and migrations `20261001121258...` / `20261001193748...`; current registry execution reproduced cross-source overlap and shared-host path behavior.
- Composition proof: both runtime registries, their selector/assignment/observation logic and `rule-claims.ts`. Do not substitute the older #801 architecture's implementation snapshot for #803 code.
- Current Evidence reader is structural, not HTTP authentication, and does not recompute ev1 id. New v2 reproof must close that identity boundary; a changed TypeScript field alone cannot do so.
- Current replay cannot represent blockedDomains. V2 must round-trip them or preserve the existing hard failure, never omit them.
- Source registry/catalog/Evidence inspector reports 0 Development rows; Production private list is empty. Exact future data emptiness and live RPC/grant state must be checked in the schema task. No live SQL was used in #807.
- Fresh National List/Appendix API content ids differ on the same host; CTA is a third id. API hashes and human rendering sizes are in the primary ledger. Research observations grant no registration or runtime attestation.
- 87 existing tests passed, eight direct baseline assertions passed, operating-mode guard passed. Full build/type/lint/full CI not claimed for this docs slice. Final diff/seed/live gate is in the report.

## Future ownership, only after #807 closure and fresh dispatch

The selected order is **R1 pure identity foundation → S1 forward schema/RPC definition → separately authorized Development apply → R2 coordinated dormant wiring → separately audited real identity profile/registration**. Production application is a separate explicit Product-Owner gate. This writer starts none of these.

R1 owns only proposed `lib/readiness/official-truth-content-identity.ts`, its test and assigned docs. Use the existing canonical regulatory-cell parser/serialization, no second parser. This new pure module defines immutable identity/representation contracts, graph/uniqueness checks, canonical tuple/version helpers and an empty profile registry. No non-test importer, network, database, real-source ids, acceptance or store.

S1 owns one CLI-generated new `supabase/migrations/*_official_truth_content_identity_2.sql`, disposable schema/RPC tests and assigned docs. If necessary, explicitly include generated RPC typings and the precise `scripts/db/verwendung.mjs` allowlist entry, with no generalized scanner exception. It keeps source/domain tables, adds the item/version/representation/URL/deny layer, upgrades ev2/v3 Evidence and dependent Rule-support constraints and supplies strict v2 catalog/store RPCs. Historical migrations are not edited or re-applied. The migration aborts on newly present data rather than deleting/backfilling guessed identity. No source seed, no schema-1 fact storage or provenance-retention table.

R2's core existing-file ownership is specified in primary section 10. The discovered finite bridge/serialization closure also includes these existing `lib/readiness/` files and their corresponding tests, limited to identity propagation/reproof or explicit v1 rejection:

| File | Required identity-sensitive concern |
| --- | --- |
| `official-truth-research-request.ts` | Existing ev1 grammar in request validation; distinguish untrusted discovery from v2 registered item eligibility. |
| `official-truth-research-source-routing.ts` | Authority coverage is necessary but not content permission. |
| `official-truth-research-execution-plan.ts` | Planned URL/source must be intersected with exact server-held item/representation bindings. |
| `official-truth-discovered-url-candidates.ts` | Discovered government URL is a suggestion, cannot mint an item. |
| `official-truth-retrieved-material.ts` | Submitted source material remains untrusted; cannot fabricate server item identity or skip fresh retrieval. |
| `official-truth-retrieved-candidate-evidence.ts` | Bind candidate identity only through the trusted catalog/material seam; no model content id. |
| `official-truth-accepted-evidence.ts` | Accepted Evidence rebuild and v2 version integrity; do not imply submitted content is HTTP attestation. |
| `official-truth-rule-candidate.ts` | Exact accepted v2 support set and one item/version mapping. |
| `official-truth-rule-review-packet.ts` | Retain item/representation/version in internal support projections; raw page handling/retention is not broadened. |
| `official-truth-rule-review-fingerprint.ts` | New explicit review fingerprint format for changed canonical identity; old review cannot authorize new identity. |
| `official-truth-rule-review-decision-intent.ts` | Reject old fingerprints/intents under the v2 path; no advisory model authority. |
| `official-truth-coverage.ts` | Existing evidence-id grammar/lookup handling must recognize the canonical new contract without cross-item reuse. |
| `official-truth-autonomous-preacceptance-witness-server.ts` | Preserve the narrow nine-field public projection and consume the updated internal proof; do not turn it into a bearer or extend F8. |

No route, app component, provider, traveller engine, launch/indexing or #626 ownership is implied. The TL must bind this closure in the later task and inspect importers freshly. A new dependency outside it is a scope finding for that task, not permission for a broad refactor. R1 does not need this closure because it has no non-test production importer.

## Development and Production order

Development apply is a separate TL-controlled action after R1/S1 independent review. Exact locked zero-row checks, transactional conflict tests, private-schema grants/RLS verification and migration-history readback precede runtime cutover. Apply before R2's v2 client integration/Development verification; old clients fail unsupported during this deliberate dormant cutover. Missing v2 schema is never an empty successful response. R2 must round-trip item identity through catalog/replay/retrieval/Evidence/store with only synthetic or disposable fixtures; no real row is an implicit smoke-test prerequisite.

Production stays unapplied. Dormant app deployment cannot auto-apply schema or populate a catalog. PO approval must cover exact migration sequence, privileges, rollback/disable strategy and separately approved real catalog rows. No approval is inferred from Development, successful CI, readiness classification or the ability to call a service-role RPC. Persistent autonomous provenance and F8 remain separate later gates.

First real GOV.UK registration requires a separately dispatched identity profile plus fresh server verification of exact item/representation/publisher data and reviewed uniqueness. No content-specific sourceId naming workaround. Registering an authority does not approve every publication. Registering an item does not register its legal extractor, composition policy or CTA pin.

## Review cautions and stop

Pay particular attention to authority versus competent-department metadata on a shared publishing platform, repeated representations, source-only policy maps, old version grammars, exact URL reuse, source refresh drift, complete replay, duplicate JSON keys, one coherent catalog read, and data arriving between an empty observation and migration. These are the concrete places where a superficially small identity change would be unsafe.

Exactly five changed docs paths versus baseline; four authored outputs versus dispatch; task SHA-256 `ad52dd83440ed0ea2b25b23260fe23cf5d30ed261bef6d4c36f806413a161c9d`. No implementation or database mutation. Remain Draft, no Ready, no merge, no follow-up. Return any immediate correction to this same writer/session; no concurrent replacement writer.
