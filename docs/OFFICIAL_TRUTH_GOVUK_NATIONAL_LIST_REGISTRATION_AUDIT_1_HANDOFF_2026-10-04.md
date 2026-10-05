# GOV.UK ETA National List Registration Audit 1 — Handoff

Date: 4 October 2026. Issue [#820](https://github.com/Jetnity/jetnity/issues/820), Draft PR [#821](https://github.com/Jetnity/jetnity/pull/821). Model **GPT-6 Astra — Sehr hoch**. Baseline `93ad2e447353af6bf380c2df1be190baeeb39888`; immutable dispatch `90dc6e57a4c0c380ee83a1cd24e14e0f1f5497e5`. Exact published audit SHA is in the PR delivery receipt.

**`GOVUK_NATIONAL_LIST_REGISTRATION_PLAN_READY`** is the audit classification. The current writer stops here. This handoff proposes subsequent bounded work for TL selection; it does not launch it, approve database writes or move this PR out of Draft.

## Decisions to preserve

- Source: `govuk` / `official_authority` / `GOV.UK` / `UK Government` / only `www.gov.uk`. The domain resolver also matches descendants of the registered host; exact content URL authorization is a separate gate.
- Item: `eta-national-list`; external namespace `govuk-content-id`; external UUID `2b25b3d4-4eaa-4859-a34e-c7869c114c15`; item version 1/current.
- Representation: `content-api-en`, version 1/current; only the exact National List Content API request/final URL; JSON, locale `en`, schema `manual_section`.
- Home Office `06056197-bc69-4147-aa28-070bca132178` is the singleton publisher and authority pin at item level. It is not the shared host source id.
- Profile: exactly existing `GOVUK_ETA_NATIONAL_LIST_CONTENT_API_IDENTITY_PROFILE`, id `govuk-eta-national-list-content-api-en`, version 1. Current production registry is frozen empty.
- Order A only, with dormant gateway prerequisite. Source-only is readable; item rows before profile activation make normal graph reconstruction fail. Public gateway returns `catalog_failed` for underlying `profile_unavailable`.
- SQL validates structure/ownership but does not know that the external UUID/path must be National List. Generic R1 graph acceptance also does not establish that semantic match. Use independently reviewed exact payloads and the fixed verifier.
- No casual rollback. Never suggest DELETE/TRUNCATE or profile removal after representations exist as routine recovery.

The [main audit](OFFICIAL_TRUTH_GOVUK_NATIONAL_LIST_REGISTRATION_AUDIT_1_2026-10-04.md) is the canonical complete payload/field/20-case plan. Source payload SHA-256 `035d65efb97d8dd82a8bc4e232854230fa6aacbf71197442a9555d4865e50750`; item payload SHA-256 `dc8898417b5082e23db64d968ba7ef2846714d9f7e67410f777e9c1a78f6b813`. Hash UTF-8 `JSON.stringify(JSON.parse(displayed payload))` with displayed key order, without newline. Do not recopy shortened examples into an executor.

## Immediate gate: independent audit review

Technical Lead reviews the exact final five-file head, including task seed equality and all evidence/limits. Re-fetch main, mode, #751, #748 after marker `5978621253`, open PRs and overlapping writers. If baseline, state or dispatch drifted, stop and reconcile. The current writer neither declares TL PASS nor performs Ready/merge.

After accepted audit, choose **one next bounded slice**, not simultaneous overlapping workers. Use live main at dispatch, not this historical baseline blindly.

## Next slice 1: dormant typed content-registration gateway

Ownership: `lib/readiness/official-truth-source-catalog-server.ts`, `lib/readiness/official-truth-source-catalog-server.test.ts`, and new bounded task/report docs as assigned by TL. There is no exported content-item helper today. Keep source `quelleRegistrieren` as the existing source path. No raw ad-hoc RPC from UI/chat becomes the normal content path.

Deliver one typed server-only `contentItemRegistrieren` or equivalent helper:

1. Exact input shape and bounded canonical values. Representation RPC entries inherit item tuple; do not serialize extra source/item/version keys into each representation.
2. Read the live schema-2 catalog using the existing transport. Fail closed on read error, unavailable code-owned profile or unknown source.
3. Reuse R1 graph construction for proposed state/ownership validation. Its descriptor parsers are private. Handle exact existing replay separately so a duplicated proposed node does not reject legitimate idempotence. Reject changed duplicate content before write. Retain SQL transaction/uniqueness checks against concurrent changes.
4. Serialize only `register_content_item` to the literal v2 RPC through the existing server transport. Never accept a browser-supplied registry, arbitrary profile implementation or Production target selection.
5. Parse an exact success shape: `ok`, `identity_schema`, `operation`, `outcome`, `source_id`, `content_item_id`; enforce schema 2, correct operation/tuple and inserted/idempotent outcomes. Reject missing/unknown keys. Sanitize errors; preserve empty-success versus failure.

Use existing test injection seams for deterministic transport and profile scenarios. Required tests: canonical payload, all malformed/extra-key/current/version/pin/URL cases, no write after missing source/profile, duplicate identity/URL conflict, exact/changed replay, correct inserted/idempotent response, wrong tuple/schema/operation/outcome, missing/extra response keys, transport exception and absent configuration. Prove production defaults stay dormant and no import triggers network. Add no schema/migration, seed, route, extractor or activation. Complete the slice's applicable full validation and independent exact-head TL review before merge.

## Next slice 2: single-profile registry activation

Only after slice 1 is reviewed and merged. Production-code change is real even though Production DB is absent; it requires its own review and deployment verification.

Ownership starts at `lib/readiness/official-truth-content-identity.ts` and the existing tests affected by activation:

| Existing file | Required review/update |
| --- | --- |
| `official-truth-content-identity.ts` | Import the existing GOV.UK profile and place exactly that object in the frozen profile registry. No caller-owned registration API. |
| `official-truth-content-identity.test.ts` | Replace the profile-empty assertion with exact singleton/id/version/current assertions; retain authority/content separation and negative graph cases. |
| `official-truth-content-identity-r2.test.ts` | Split the current all-empty-registry assertion: this profile alone active; extractor/composition/pins still empty. Retain absent-v2/failure semantics. |
| `official-truth-govuk-content-api-identity-profile.test.ts` | Update default-registry and zero-runtime-import assertions to allow the sole intended content-identity importer; retain finite importer controls and all semantic negative cases. |
| Source gateway / retrieval tests as needed | Exercise the normal default registry, no injected profile for acceptance proof; Production missing-v2 still fails and cannot return empty success or v1 fallback. |

Paths in this table are relative to `lib/readiness/`. No additional runtime consumer is automatically allowed. The profile already has a type-only dependency on content identity; review the one activation import for runtime-cycle behavior. Do not alter the fixed profile's scope, add Appendix ETA/HTML or activate other trust registries.

Record exact merge and deployed/executor code SHAs. Re-run normal gateway construction, missing-config/missing-RPC negative checks, importer bounds, relevant tests and the normal code-slice build/type/lint/hygiene gates. No live registration belongs in this PR. Production absence is read-only verified; activation does not authorize Production schema/apply.

## Later action: gated Development-only registration

Require new Product-Owner authorization for these exact writes. The historical `Development S1 Apply freigegeben` approval recorded in #748 refers to the earlier migration and is not reusable registration permission. Executor is the Technical Lead. Assign a separate read-only verifier for each step before executing; record any exceptional verification arrangement for explicit review first.

Before source write, require:

- NORMAL, no writer collision, known exact current main plus reviewed gateway/profile and executor/deployment SHAs;
- Development project `yfvbxvijcorffwxbxahl`, 77-entry migration-history fingerprint `d4ccafe8951fcb198c130443a10f5d61` under the report query, exact S1 definitions/security and relevant constraints;
- S1 `20261004010705` present, older `20261002154952` intentionally absent, temporary `20261004091341` absent; no plain `db push` or history repair;
- all 19 Official Truth tables zero and schema-2 catalog seven arrays empty;
- Production `qscbgcdmivbbnzrcyegn` still has zero Official Truth tables and no catalog/store v2 RPC signatures;
- fresh official identity evidence, independently reviewed full JSON/hashes, specific Product-Owner approval and named executor/verifier.

Any changed migration count/fingerprint/state requires review and an updated exact preflight, not automatic application. The audit's timestamps are not current authorization.

Execute source helper once. Independent verifier must see exactly source/domain counts 1/1, all content/blocked/Evidence/Rule tables zero, readable normal catalog, National List authority `govuk` and content `not_registered`. Log and sign this checkpoint before the item helper runs.

Execute item helper once. Independent verifier must see exactly one item, one item-version, one representation, one URL reservation and one representation URL, both versions 1/current, exact Home Office pins and exact selected fields. URL row ordinal 1 and `is_final=true`; blocked domains zero. Normal non-injected graph/profile reconstruction succeeds. Exact National List resolves one current representation; sibling Appendix ETA remains content-unregistered. All Evidence/Rule/fact tables remain zero. Fresh identity-only retrieval smoke passes the exact National List profile and fails sibling substitutions. Production absence and Development history/security remain unchanged.

Publish a GitHub apply/registration log with executor/verifier identities, approval reference, exact code SHAs, timestamps/project ids, complete safe payloads/hashes, RPC outcomes, complete catalog/count readbacks and smoke results. No secrets. Ambiguous response: stop, independently inspect state, only consider an approved identical replay after comparison. Wrong row/state: stop for separately designed forward correction; do not edit tables directly.

## What remains out of scope

No extractor, composition policy, region pin, legal-rule interpretation, accepted Evidence/Rule fact or F8 closure. No Production write, Ready, merge or follow-up slice begins from this handoff. No recurring cost was added. Current audit validation is documented in the [report](OFFICIAL_TRUTH_GOVUK_NATIONAL_LIST_REGISTRATION_AUDIT_1_REPORT_2026-10-04.md); future code/build/apply tests are requirements, not claimed results.
