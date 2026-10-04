# Official Truth Content Registration Gateway 1 — Task

Date: 4 October 2026
Issue: #822
Status: **BINDING / IMPLEMENTATION / DORMANT SERVER-ONLY / NO LIVE REGISTRATION / NO DB MUTATION / NO PROFILE ACTIVATION / NO F8**

## 1. Authority and live baseline

Technical Lead selected this slice after a fresh live reconstruction.

- baseline main: `de1335d4c749a53aa9a3966c46af4c9c1e1f76a9` (Merge #821)
- machine mode: `NORMAL`
- canonical current-state index: #751
- latest processed Guardian / Chief-of-Staff MATERIAL at dispatch: #748 comment `5982622080`
- prerequisite audit: #820 / merged PR #821
- accepted audit classification: `GOVUK_NATIONAL_LIST_REGISTRATION_PLAN_READY`
- current Development Official Truth data: empty
- current Production Official Truth v2: absent

Live evidence wins over this baseline if anything changes before material edits. If main, mode, #751, #748, an overlapping writer, or the relevant trust boundary has materially changed, STOP and report the drift before implementation.

## 2. Writer

Logical writer: **Jetnity Official Truth content registration gateway 1**, Generation 1.

Execution environment: **Codex Desktop**.

Required model for this dispatch: **GPT-6 Astra — Sehr hoch** (`gpt-6-astra`, `xhigh`). Do not silently substitute a different model. Report the exact model / reasoning-effort evidence available at delivery.

Codex is the implementation writer only. Codex:
- does not mark Ready;
- does not merge;
- does not start a follow-up slice;
- does not perform a hosted database write.

Technical Lead remains the independent reviewer and sole Ready/Merge authority.

## 3. Goal

Add one strict, typed, server-only content-item registration gateway for the already-existing schema-2 RPC operation `register_content_item`.

The helper must make the future registration path use Jetnity's canonical source registry + R1 content-identity graph validation before the write RPC. It must remain dormant until explicitly called by trusted server code and must not itself activate a source, profile, route, extractor, Rule acceptance path or database registration.

Preferred exported name: `contentItemRegistrieren` unless a materially safer equivalent is demonstrated in the report.

## 4. Allowed production/test scope

Only these production/test files may change:

1. `lib/readiness/official-truth-source-catalog-server.ts`
2. `lib/readiness/official-truth-source-catalog-server.test.ts`

Required slice docs:

3. this immutable task file — **must remain byte-identical after dispatch**
4. `docs/OFFICIAL_TRUTH_CONTENT_REGISTRATION_GATEWAY_1_REPORT_2026-10-04.md`
5. `docs/OFFICIAL_TRUTH_CONTENT_REGISTRATION_GATEWAY_1_HANDOFF_2026-10-04.md`
6. `docs/OFFICIAL_TRUTH_CONTENT_REGISTRATION_GATEWAY_1_SELF_REVIEW_2026-10-04.md`

If safe implementation genuinely requires another production/runtime/test file, STOP and explain the dependency. Do not broaden scope autonomously.

## 5. Canonical contracts to preserve

Read and preserve at minimum:

- `JETNITY_START_HERE.md`
- `.jetnity/operating-mode.json`
- `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
- live #751 and new #748 MATERIAL after marker `5982622080`
- `docs/OFFICIAL_TRUTH_GOVUK_NATIONAL_LIST_REGISTRATION_AUDIT_1_2026-10-04.md`
- `docs/OFFICIAL_TRUTH_GOVUK_NATIONAL_LIST_REGISTRATION_AUDIT_1_HANDOFF_2026-10-04.md`
- `docs/OFFICIAL_TRUTH_GOVUK_NATIONAL_LIST_REGISTRATION_AUDIT_1_REPORT_2026-10-04.md`
- `lib/readiness/official-truth-source-catalog-server.ts`
- `lib/readiness/official-truth-source-catalog-server.test.ts`
- `lib/readiness/official-truth-content-identity.ts`
- `supabase/migrations/20261004010705_official_truth_content_identity_2.sql`

Do not invent a second source registry, content-identity parser, URL-authority model, transport, or RPC contract.

## 6. Required typed input contract

The helper accepts one initial content item plus 1..16 representations using canonical TypeScript-side fields equivalent to the existing R1 descriptor contract:

Item:
- `sourceId`
- `contentItemId`
- `externalIdNamespace`
- `externalContentId`
- `contentItemVersion`
- `current`
- `expectedPublisherIds`
- `expectedAuthorityIds`
- `representations`

Each representation:
- `representationId`
- `representationVersion`
- `current`
- `requestUrls`
- `expectedFinalUrl`
- `expectedMediaType`
- `identityProfileId`
- `identityProfileVersion`
- `expectedLocale`
- `expectedSchema`

This is the **initial registration** operation only:
- item version must be exactly 1 and current=true;
- each representation version must be exactly 1 and current=true;
- representations inherit the item source/item/version tuple;
- no update/retire/rebind semantics are introduced.

Do not accept raw RPC-shaped arbitrary JSON as the normal helper contract.

## 7. Read-before-write and fail-closed validation

Before any `register_content_item` write RPC:

1. resolve the same existing server transport used by the catalog gateway;
2. read the live schema-2 catalog through the existing `read_registry` operation;
3. fail closed on absent configuration, transport failure, malformed catalog, unknown source, invalid source authority, unavailable code-owned identity profile, malformed descriptor, duplicate identity, external identity conflict, URL ownership conflict, domain/source mismatch, or any other R1 graph failure;
4. use the existing canonical `createContentIdentityGraph` contract for proposed-state validation; do not duplicate its private descriptor parsers or weaken them;
5. use only the existing test-only profile/transport injection seam in deterministic tests. A route/browser/request must never be able to provide an arbitrary profile implementation or registry.

Production defaults must remain dormant. The production profile registry is still intentionally empty during this slice, so a real content registration requiring a profile cannot pass until the separately reviewed profile-activation slice is merged later.

## 8. Exact replay versus changed duplicate

Do not validate an exact replay by blindly appending a duplicate node to the proposed graph, because the canonical graph correctly rejects duplicate versions.

Handle an existing item tuple separately:

- **exact replay**: the stored item identity/version/current/pins and the complete stored representation set must exactly equal the proposed canonical registration; after that exact comparison, the helper may call the RPC and must accept only an exact `idempotent` or `inserted` response contract as applicable;
- **changed duplicate / partial drift / additional or missing representation / changed pin / changed URL / changed profile / changed external identity**: fail closed before the write RPC with a stable sanitized failure reason;
- never silently upsert, merge, replace, delete or retire an existing registration.

The database remains the final race/uniqueness authority for concurrent changes.

## 9. Exact RPC serialization

The only write operation emitted by this helper is the literal schema-2 operation:

`register_content_item`

Use the existing `official_truth_source_catalog_v2` transport. Do not create a second Supabase client or generic arbitrary-operation export.

Serialize the current S1 RPC contract exactly.

Top-level payload:
- `operation: "register_content_item"`
- `item: { ... }`

Item RPC fields must match the S1 migration exactly.

Each representation RPC entry **inherits** `source_id`, `content_item_id` and `content_item_version` from the item. Do **not** serialize those inherited tuple fields again inside representation entries.

No extra keys. No browser-selected environment. No target/project selector.

## 10. Exact success-response parser

Accept only a plain exact-key success object containing exactly:

- `ok`
- `identity_schema`
- `operation`
- `outcome`
- `source_id`
- `content_item_id`

Required values:
- `ok === true`
- `identity_schema === 2`
- `operation === "register_content_item"`
- `outcome === "inserted"` or `"idempotent"`
- returned source/content tuple exactly matches the requested tuple.

Reject:
- missing keys;
- unknown/extra keys;
- wrong schema;
- wrong operation;
- wrong source or item tuple;
- unknown outcome;
- malformed or non-plain objects.

Transport/database error details must not be exposed. Return stable sanitized gateway reasons and distinguish success from failure without fabricating empty success.

## 11. Required tests

Add deterministic adversarial coverage for at least:

1. canonical serialization with the exact S1 payload shape;
2. representation entries do not redundantly serialize source/item/item-version;
3. invalid item current/version;
4. invalid representation current/version;
5. malformed/extra input keys where applicable;
6. malformed/empty/duplicate publisher or authority pins;
7. malformed request/final URLs and unauthorized source-domain URL;
8. unknown source;
9. missing/unavailable profile;
10. duplicate external identity;
11. URL reservation/ownership conflict;
12. exact replay;
13. changed replay;
14. partial representation-set drift;
15. inserted success;
16. idempotent success;
17. wrong response schema;
18. wrong response operation;
19. wrong response source/item tuple;
20. wrong response outcome;
21. missing response key;
22. extra response key;
23. transport returns failure;
24. transport throws;
25. absent environment/configuration;
26. no write RPC after any pre-write validation failure;
27. production/default registry remains dormant and cannot register a profile-backed item while the production profile registry is empty;
28. importing the module does not trigger network or database access;
29. existing `quelleRegistrieren` and catalog read behavior remains unchanged;
30. existing R1/R2 content identity and source-registry negative guarantees remain intact.

Use injected transports and code-owned test profile definitions only. Do not contact hosted Supabase or GOV.UK from tests.

## 12. Non-scope / hard STOP boundaries

Absolutely no:
- hosted Development registration or DML;
- Production database access beyond optional read-only TL evidence;
- migration/schema/RLS/grant/Auth change;
- profile-registry activation;
- GOV.UK source or National List registration;
- route/API/UI/browser registration endpoint;
- service-role exposure;
- source extractor registration or parser semantics;
- composition-policy activation;
- region pin;
- Evidence/Rule fact creation or acceptance;
- `regelKandidatAkzeptieren` change;
- F8;
- provider/model live call;
- secret creation/rotation;
- payment;
- public launch/indexing;
- follow-up slice.

If implementation exposes a need for any of these, STOP and report it.

## 13. Validation before delivery

Run the applicable repository gates on the final tree:

- `git diff --check`
- `npm run check:operating-mode`
- focused source-catalog/content-identity tests
- full `npm test`
- `npm run typecheck`
- `npm run lint`
- `npm run check:api-schutz`
- `npm run check:schema-bezug`
- `npm run check:dead`
- `npm run check:exports`
- `npm run check:deps`
- `npm run build`

If a command is unavailable or environment-blocked, report that honestly; do not invent PASS.

Before STOP:
- re-fetch live main/mode/#751/#748;
- prove the task seed is byte-identical;
- prove exact changed-file scope;
- prove merge-base/ahead/behind;
- report exact final head;
- report exact Codex model / effort evidence;
- report tests/build results and any warnings/failures;
- report whether any network/DB access occurred;
- adversarially self-review replay logic, exact-key response parsing, no-write-on-failure, profile fail-closed behavior and import dormancy.

## 14. Deliverables

Create:
- implementation + tests only in the two allowed code/test files;
- REPORT;
- HANDOFF;
- SELF_REVIEW.

Keep the pull request Draft.

**STOP for independent ChatGPT / Technical-Lead exact-head review.**

Do not mark Ready.
Do not merge.
Do not start profile activation.
Do not perform Development registration.
Do not start F8.
