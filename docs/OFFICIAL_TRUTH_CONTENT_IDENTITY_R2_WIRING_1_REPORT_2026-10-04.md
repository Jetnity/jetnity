# Official Truth content identity R2 wiring 1 — Report

Date: 4 October 2026. Issue #814 / Draft PR #815 / Generation 1.
Logical writer: **Jetnity Official Truth coordinated content identity wiring R2**.
Branch: `feat/official-truth-content-identity-r2-wiring-1`.
Baseline main: `30aa083dc752bf499dfc5a09448d06bd36d3ba64`.
Immutable dispatch: `7185c60dd78604a5105b207a855fc74620195fc0`.
Resume parent (Scope Amendment 2): `dc5d96d44984cb340569bcd98f74f1ab4acafcc7`.
Model: **GPT-6 Astra — Sehr hoch**, `gpt-6-astra` / `xhigh`.
Same Codex session: `01a1064d-7e3c-72a0-b257-387193918f67`. One writer, no subagents.

Classification: **CONTENT_IDENTITY_R2_READY_FOR_REAL_IDENTITY_PROFILE_AUDIT**.
This classification requests independent Technical-Lead review; it does not start the audit or grant registration/F8/DB authority. PR remains Draft.

The exact final published commit SHA is recorded in the PR #815 delivery receipt and the accompanying final-head validation manifest. This document belongs to that commit; it does not attempt to embed its own Git hash. Resolve it with `git rev-parse HEAD` at that delivered checkout. All gates are rerun after publication, with no subsequent repository edit.

## Result

The live trusted runtime now uses catalog v2 / store v2, `evidence-key:v3:` and `ev2_`. Authority identity remains `sourceId`; composition support identity is exactly `(sourceId, contentItemId)`. Item and representation versions and the profile id/version remain separate pinned provenance.

One catalog RPC parses all ten response fields, including identity schema 2 and every S1 collection. Duplicate sources/versions, orphan rows, mismatched reservations/URLs, invalid request ordinals and incompatible code profiles fail closed. The authority registry and R1 graph are deeply frozen together. Explicit empty v2 is valid. Missing or malformed v2 is unavailable, never empty success. Replay serializes this complete snapshot, including blocked domains, without another external catalog read.

Authority routing and research planning remain discovery. Exact registered request URL routing gates retrieval; same-host siblings and caller-invented item/profile fields do not acquire authority. Fresh retrieval retains DNS/SSRF/redirect/body defenses, pins the request set and final URL/media type, and verifies response identity with a code-owned profile before any legal extractor runs. Final-only redirect targets remain observation identity: replay starts from an explicitly registered request URL in the same exact representation.

The canonical R1 serializers are reused. The only pure extensions are a source-neutral regulatory parser seam, a strict versioned binding reader/projection/equality, and coherent registry/graph resolution. Evidence, accepted Evidence, store payloads, frozen proof, replay, extraction provenance, composition citations, refresh and review all carry/reprove the exact tuple. Old ev1/lookup-v2 identities fail acceptance/reproof. Review keys use `review-packet:v3:` and bind the new provenance; old keys/intents cannot authorize a v2 packet.

Extractor definitions pin ContentItemRefs and exact representation/profile versions. Composition policies and item-attributed observations count publications. Two renderings/versions of one item reject explicitly; duplicate items hidden in larger sets reject. Two items under one authority pass through proof, fresh retrieval, policy-bound extraction and the private composition seal. Rule acceptance still uses only `regelKandidatAkzeptieren`; supports remain ev2 Evidence version ids. Schema-1 persistence still blocks before client/transport/RPC. The autonomous witness projection remains unchanged and cannot authorize F8.

Refresh remains within one exact item/representation stream; item, representation, profile, descriptor version, final URL and media drift cannot silently become a predecessor. Equal content hashes do not merge identities.

## Runtime constants and empty registries

- `OFFICIAL_TRUTH_SOURCE_CATALOG_V2 = 'official_truth_source_catalog_v2'`.
- `OFFICIAL_TRUTH_STORE_ACCEPTED_V2 = 'official_truth_store_accepted_v2'`.
- Each runtime `.rpc()` keeps its one literal v2 name; no fallback.
- Identity profiles: **0**, frozen.
- Trusted extractors: **0**, frozen.
- Composition policies: **0**, frozen.
- Region pins: **0**, frozen.

The scanner amendment changes only the two exact gateway entries to those v2 names, retains the exact runtime source paths and points both to `supabase/migrations/20261004010705_official_truth_content_identity_2.sql`. The schema-reference test retains exact-list expectations. No generic unknown-RPC exception or scanner weakening.

Historical v1 migration assertions stay historical. Current runtime tests assert ev2/v3. Positive runtime fixtures use canonical synthetic R1/R2 identities; licensed/source-only fixtures are rejection cases. Review suggestion remains advisory and its production module is unchanged.

## Validation

The complete suite ran with **Node 22 and PostgreSQL 16** in a disposable local Docker container, `--network none`, with a read-only repository mount and a copied test checkout. It has no Supabase credentials or live database connection. The existing SQL proofs create/drop only their synthetic temporary clusters. Repository migrations were read as fixture inputs, never edited or applied to Development/Production. The previously reported macOS `initdb ENOENT` limitation is resolved by this isolated test environment; no test was skipped.

| Gate | Result |
| --- | --- |
| Targeted identity/catalog/routing/retrieval/Evidence/store/proof/replay/extractor/composition/refresh/review matrix, including S1 PostgreSQL | **566/566 PASS**, 0 fail, 0 skip |
| New coordination suite (one `.example` authority, two items, HTML/API for one item) | **24/24 PASS** |
| Full `npm test` | **4,752/4,752 PASS**, 0 fail, 0 skip |
| Explicit amended schema-reference/review-suggestion/Evidence-schema/Rule-schema tests | **35/35 PASS**, schema-reference **4/4** |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS, 0 errors / 149 existing warnings |
| Canonical Production `npm run build` (including prebuild) | PASS; local build only |
| Operating-mode guard | PASS / NORMAL |
| API protection | PASS, 12 admin routes |
| Schema references | PASS, exact v2 gateway allowlist only |
| Dead modules / exports / dependencies | PASS, 0 unjustified orphan modules, 0 unused exports, 0 unused checked dependencies |
| `git diff --check` | PASS |
| Immutable seed / amendments | Byte-identical |
| Production v1 RPC / ev1 / lookup-v2 / review-v2 search in coordinated runtime | 0 matches |
| New real source/GOV.UK/CTA/profile/extractor/policy/pin registration search | 0 additions |
| Forbidden path / outside-closure change search | 0 unauthorized paths |

Import-time regression installs throwing network hooks in a fresh Node process with synthetic configured service credentials and imports all server entries: **0 network/DB calls**. Missing-v2 invocation transport tests fail closed after one attempt, without v1 fallback. Production build completes with empty registries and no new route activation.

The full command is `npm test`. The targeted command is:

```sh
node --import ./scripts/server-only-test-register.mjs --import tsx --test \
  lib/readiness/official-truth-*.test.ts \
  lib/readiness/source-foundation.test.ts lib/readiness/rule-claims.test.ts \
  lib/readiness/regulierungs-anwendbarkeit.test.ts \
  lib/readiness/evidence-store-schema.test.ts lib/readiness/rule-claim-store-schema.test.ts \
  lib/admin/account-counts-delivery/schema-reference.test.ts
```

Initial validation found and corrected exact fixture/expectation issues exposed by the cutover, unused test exports/imports, and final-only replay selection. Earlier incomplete runs are superseded by the full passing matrix. Linux Git and the tracked `.env.example` are included so unrelated existing full-suite tests run unchanged.

## Importer and scope audit

The finite original closure has **28 production modules**. Current repository search finds **314 import references**, **116 non-test references across 30 production importer files**. Every production importer was inspected before material edits and rechecked at delivery. The only outside-closure production importers are:

- `lib/readiness/official-truth-candidate-batch.ts`: uses the unchanged quality enum; research-only, no accepted identity construction.
- `lib/readiness/official-truth-review-suggestion.ts`: delegates packet/fingerprint reconstruction; no hard-coded old identity. Its authorized test is upgraded while all advisory/privacy/citation assertions remain.

Neither requires a production edit. No route/app/component/provider/traveller importer or change was introduced. Research source routing/execution-plan and autonomous witness production files remain unchanged because discovery and the narrow delegated witness projection are already compatible.

The five outside-original-closure changes are exactly those granted by Amendments 1 and 2. No sixth path is used. Task seed and both amendments remain byte-identical. The PR also contains the TL-authored task/amendment documents already present at the resume parent; those are not writer edits.

## Exact writer-changed files

Production/runtime plus the authorized scanner (26):

- `lib/readiness/evidence.ts`
- `lib/readiness/official-truth-accepted-evidence.ts`
- `lib/readiness/official-truth-composition-policy-registry.ts`
- `lib/readiness/official-truth-content-identity.ts`
- `lib/readiness/official-truth-coverage.ts`
- `lib/readiness/official-truth-discovered-url-candidates.ts`
- `lib/readiness/official-truth-refresh-diff.ts`
- `lib/readiness/official-truth-research-request.ts`
- `lib/readiness/official-truth-retrieved-candidate-evidence.ts`
- `lib/readiness/official-truth-retrieved-material.ts`
- `lib/readiness/official-truth-rule-candidate.ts`
- `lib/readiness/official-truth-rule-review-decision-intent.ts`
- `lib/readiness/official-truth-rule-review-fingerprint.ts`
- `lib/readiness/official-truth-rule-review-packet.ts`
- `lib/readiness/official-truth-same-request-extraction-server.ts`
- `lib/readiness/official-truth-same-request-proof-server.ts`
- `lib/readiness/official-truth-server-held-source-registry.ts`
- `lib/readiness/official-truth-server-owned-retrieval.ts`
- `lib/readiness/official-truth-source-catalog-server.ts`
- `lib/readiness/official-truth-store-server.ts`
- `lib/readiness/official-truth-trusted-fact-extractor-registry.ts`
- `lib/readiness/regulierungs-anwendbarkeit.ts`
- `lib/readiness/rule-claims.ts`
- `lib/readiness/source-registry.ts`
- `lib/readiness/source-router.ts`
- `scripts/db/verwendung.mjs`

Tests (29, including one new coordination test):

- `lib/admin/account-counts-delivery/schema-reference.test.ts`
- `lib/readiness/evidence-store-schema.test.ts`
- `lib/readiness/official-truth-accepted-evidence.test.ts`
- `lib/readiness/official-truth-autonomous-preacceptance-witness-server.test.ts`
- `lib/readiness/official-truth-composition-policy-registry.test.ts`
- `lib/readiness/official-truth-content-identity-r2.test.ts`
- `lib/readiness/official-truth-content-identity.test.ts`
- `lib/readiness/official-truth-coverage.test.ts`
- `lib/readiness/official-truth-discovered-url-candidates.test.ts`
- `lib/readiness/official-truth-refresh-diff.test.ts`
- `lib/readiness/official-truth-research-request.test.ts`
- `lib/readiness/official-truth-retrieved-candidate-evidence.test.ts`
- `lib/readiness/official-truth-retrieved-material.test.ts`
- `lib/readiness/official-truth-review-suggestion.test.ts`
- `lib/readiness/official-truth-rule-candidate.test.ts`
- `lib/readiness/official-truth-rule-review-decision-intent.test.ts`
- `lib/readiness/official-truth-rule-review-fingerprint.test.ts`
- `lib/readiness/official-truth-rule-review-packet.test.ts`
- `lib/readiness/official-truth-same-request-extraction-server.test.ts`
- `lib/readiness/official-truth-same-request-proof-server.test.ts`
- `lib/readiness/official-truth-server-held-source-registry.test.ts`
- `lib/readiness/official-truth-server-owned-retrieval.test.ts`
- `lib/readiness/official-truth-source-catalog-server.test.ts`
- `lib/readiness/official-truth-store-server.test.ts`
- `lib/readiness/official-truth-trusted-fact-extractor-registry.test.ts`
- `lib/readiness/regulierungs-anwendbarkeit.test.ts`
- `lib/readiness/rule-claim-store-schema.test.ts`
- `lib/readiness/rule-claims.test.ts`
- `lib/readiness/source-foundation.test.ts`

Documentation (3 existing delivery documents rewritten to the final implementation):

- `docs/OFFICIAL_TRUTH_CONTENT_IDENTITY_R2_WIRING_1_REPORT_2026-10-04.md`
- `docs/OFFICIAL_TRUTH_CONTENT_IDENTITY_R2_WIRING_1_HANDOFF_2026-10-04.md`
- `docs/OFFICIAL_TRUTH_CONTENT_IDENTITY_R2_WIRING_1_SELF_REVIEW_2026-10-04.md`

## Live state and boundaries

Main was re-fetched at the exact baseline; machine mode remains NORMAL. #751 still names this same Generation 1 writer. #748 has 32 comments; newest external MATERIAL is `5978621253`, already processed by TL receipt `5978881653`; no later external MATERIAL was found. Open PRs are #815 and the five historical drafts #28/#39/#40/#50/#52. Other local Jetnity writers are idle/not loaded. No overlapping writer was found.

**No live DB call or mutation occurred.** No Development or Production operation, Supabase apply/push/reset, migration edit/create, generated-type edit, real source/content/profile registration, government network request, GOV.UK/CTA registration, real extractor/policy, region pin, schema-1 persistence, F8, route/app/component/provider/traveller change, #626, launch/indexing change, Ready or merge occurred.

Development S1 applied/empty and Production v2 absent remain the supplied/TL-recorded baseline; this writer did not contact either database to re-audit them. Production absence is covered with injected unavailable transports and import/build dormancy tests. A future real profile still requires its separately authorized audit and deterministic response identity rules.

STOP for independent Technical-Lead exact-head review. Do not start the real profile audit, registration or F8.
