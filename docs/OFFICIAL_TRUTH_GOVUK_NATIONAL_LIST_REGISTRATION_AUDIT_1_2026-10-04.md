# GOV.UK ETA National List Registration Audit 1

Date: 4 October 2026. Issue [#820](https://github.com/Jetnity/jetnity/issues/820), Draft PR [#821](https://github.com/Jetnity/jetnity/pull/821). Single writer: **Jetnity GOV.UK ETA National List registration audit 1**, generation 1. Model: **GPT-6 Astra — Sehr hoch** (`gpt-6-astra`, `xhigh`).

Baseline: `main@93ad2e447353af6bf380c2df1be190baeeb39888`. Dispatch: `90dc6e57a4c0c380ee83a1cd24e14e0f1f5497e5`. Branch: `docs/govuk-national-list-registration-audit-1`. The final publication SHA belongs in the PR delivery receipt; a commit cannot contain its own SHA. Review all five files at that exact head.

**Classification: `GOVUK_NATIONAL_LIST_REGISTRATION_PLAN_READY`.** This classifies the plan only. No registration, profile activation, DB mutation, Ready or merge occurred. Implementation, exact-head review and the separate Product-Owner Development-write gate remain required. F8 remains OPEN.

## Decision and evidence boundary

Select source `govuk`, class `official_authority`, publisher label `GOV.UK`, authority label `UK Government`, domain list exactly `["www.gov.uk"]`. Select item `eta-national-list`, representation `content-api-en`, profile `govuk-eta-national-list-content-api-en` version 1. Retain Home Office UUID `06056197-bc69-4147-aa28-070bca132178` in both item-level publisher/authority pin arrays.

Choose **Order A**, preceded by a separate dormant typed content-registration gateway slice. Then activate exactly the existing profile in code, merge and verify that code, register the source in Development, independently read it back, register the item/representation in Development, and independently read back and smoke-verify identity. No combined code activation and DB apply. Order B and Order C are rejected below.

The accepted source is a Jetnity authority/domain grouping for the shared government publishing platform. Its `publisher_name` is not a claim that the Content API's department-level publisher UUID is GOV.UK. Home Office remains the particular item's issuer. This distinction lets later reviewed publications from other departments share the same domain source without sharing content identity.

## Official primary evidence

Fresh unauthenticated HTTPS GETs were captured on 4 October 2026 between 15:34:24 and 15:34:26 UTC (17:34 in Europe/Zurich). All returned HTTP 200 and a final URL equal to the requested URL. The capture client followed redirects; this records the final URL, not a zero-redirect proof. [Report](OFFICIAL_TRUTH_GOVUK_NATIONAL_LIST_REGISTRATION_AUDIT_1_REPORT_2026-10-04.md) records bytes, hashes and timestamps. These are research observations, not accepted Evidence or frozen legal content.

| Official source | Observation and consequence |
| --- | --- |
| [About GOV.UK](https://www.gov.uk/help/about-govuk) | GOV.UK describes itself as the UK government's website and describes GDS working across departments. This supports the platform label GOV.UK and the deliberately chosen authority-level label UK Government. |
| [Government organisations](https://www.gov.uk/government/organisations) | Multiple departments publish under the same `www.gov.uk` host. A departmental source cannot exclusively claim this host without obstructing other departmental sources. |
| [Home Office about](https://www.gov.uk/government/organisations/home-office/about) and [organisation Content API](https://www.gov.uk/api/content/government/organisations/home-office) | Home Office is the relevant department; its API identity is `06056197-bc69-4147-aa28-070bca132178`. Its departmental role does not turn the whole shared host into Home Office. |
| [National List Content API](https://www.gov.uk/api/content/guidance/immigration-rules/immigration-rules-appendix-eta-national-list) | Root `content_id` is `2b25b3d4-4eaa-4859-a34e-c7869c114c15`; locale `en`, schema/document type `manual_section`, `publishing_app=manuals-publisher`, `rendering_app=frontend`, phase `live`. Root organisation and primary-publishing-organisation links both contain exactly the Home Office UUID. |
| [Appendix ETA Content API](https://www.gov.uk/api/content/guidance/immigration-rules/immigration-rules-appendix-electronic-travel-authorisation) | Different root `content_id`, `2620750b-5453-44f1-98af-414037c833be`, and different exact path, despite the same department and manual. It is a sibling publication, not this content item. |
| [GOV.UK domain eligibility](https://www.gov.uk/guidance/check-if-your-organisation-can-get-a-govuk-domain-name) | `.gov.uk` includes central government and other eligible public-sector bodies, plus distinct service/publishing namespaces. Registering `gov.uk` would claim a much wider host family than the reviewed URL needs. |
| [Publishing API model](https://docs.publishing.service.gov.uk/repos/publishing-api/model.html) and [Content API reference](https://content-api.publishing.service.gov.uk/reference.html) | Content identity and locale are distinct from iteration/title. A GOV.UK content UUID plus locale supports stable external identity, with independent Jetnity local ids and versions. |

Both National List and Appendix ETA link to manual `87e2748f-2e9b-4681-8baa-778b6d326a8a`. Sharing this manual and publisher is insufficient to equate them. No citizenship list, legal effect or entry permission is extracted here.

### Domain decision, including the suffix-matching caveat

`source-registry.ts` accepts canonical domain strings and resolves a hostname when `host === domain` **or** `host.endsWith('.' + domain)`. Consequently “exact domain `www.gov.uk`” describes the single registered domain string; it does not mean the authority resolver is strict host equality. It also covers descendants of `www.gov.uk`. The separate content graph authorizes only exact registered URLs. The proposed source does not cover `gov.uk`, `service.gov.uk` or sibling publishing hosts.

`home-office` plus `www.gov.uk` is structurally valid if first, but rejected for this plan on source semantics. With the existing equal/parent/child overlap rule, a later separate department source could not claim the host. `govuk` plus `www.gov.uk` is structurally and semantically suitable; later reviewed Home Office and other-department items can share it while carrying their own UUID pins. `gov.uk` is structurally valid but rejected as unnecessarily broad. No additional host is needed: request and expected-final URLs are both on `www.gov.uk`. Documentation/API research hosts are not runtime domain grants.

## Local identifiers

| Field | Selected value | Rationale |
| --- | --- | --- |
| `sourceId` | `govuk` | Shared authority/domain identity, not a department monopoly. |
| `contentItemId` | `eta-national-list` | Stable local publication identity, separate from title, timestamp, hash and legal outcome. |
| `representationId` | `content-api-en` | English JSON delivery channel of this item. A future reviewed HTML representation gets a different representation id. |
| `identityProfileId` / version | `govuk-eta-national-list-content-api-en` / `1` | Exact already-implemented verifier; availability must precede registration. |
| `externalIdNamespace` / value | `govuk-content-id` / `2b25b3d4-4eaa-4859-a34e-c7869c114c15` | The external UUID is a distinct field, not a substitute local key. |

Every local id/namespace satisfies `^[a-z][a-z0-9_-]{1,63}$`; the UUID satisfies the external-id grammar. No selected id contains nationality, a legal outcome, a mutable title/date or a content hash. Future Appendix ETA may use another reviewed local item under `govuk`; it needs its own profile scope and exact URLs. That future registration is not granted here.

## Exact future source payload

This is the value of the v2 RPC's `payload` parameter. The existing server transport wraps it as `{payload: ...}`. Do not double-wrap the operation value or call it from UI/chat. Execute through `quelleRegistrieren` using the corresponding canonical TypeScript source object.

```json
{
  "operation": "register_source",
  "source": {
    "source_id": "govuk",
    "source_class": "official_authority",
    "publisher_name": "GOV.UK",
    "authority_name": "UK Government",
    "domains": [
      "www.gov.uk"
    ]
  }
}
```

SHA-256: `035d65efb97d8dd82a8bc4e232854230fa6aacbf71197442a9555d4865e50750` over UTF-8 `JSON.stringify(JSON.parse(the displayed object))`, with displayed property order and no terminal newline. This explicitly defined hash is an audit receipt, not the SQL equality rule.

Source review against `source-registry.ts`, `quelleRegistrieren` and S1:

- Exact allowed object keys; valid local id/class; trimmed names of 2–80 characters, without control characters or `://`; nonempty authority name for `official_authority`.
- One canonical lower-case host, no scheme/path/port/wildcard; domain normalization and equal/parent/child overlap validation apply before a write. The selected singleton has no blocked-domain intersection.
- `quelleRegistrieren` reads the current v2 graph, detects conflicting source metadata or overlapping domains, then serializes this payload. It is the supported source path; no concrete blocker requires bypassing it.
- Same source and metadata/domain set is idempotent. Different metadata on `govuk` yields TypeScript `conflicting_duplicate`; another source claiming the same/parent/child domain yields `overlapping_domains`. SQL independently rejects conflicts (`23505`), under its registration lock. No overwrite or widening.
- SQL's success response has `ok=true`, `identity_schema=2`, `operation=register_source`, `outcome=inserted|idempotent`, `source_id=govuk`. The current source helper validates required response values but does **not** reject every unknown extra response key. Do not claim it already has the proposed content helper's exact-key response parser.

## Exact future content-item payload

Initial registration only; one item version and one representation version, both current and exactly 1. The representation objects deliberately omit `source_id`, `content_item_id` and `content_item_version`: S1 inherits them from `item` and rejects unlisted keys.

```json
{
  "operation": "register_content_item",
  "item": {
    "source_id": "govuk",
    "content_item_id": "eta-national-list",
    "external_id_namespace": "govuk-content-id",
    "external_content_id": "2b25b3d4-4eaa-4859-a34e-c7869c114c15",
    "content_item_version": 1,
    "current": true,
    "expected_publisher_ids": [
      "06056197-bc69-4147-aa28-070bca132178"
    ],
    "expected_authority_ids": [
      "06056197-bc69-4147-aa28-070bca132178"
    ]
  },
  "representations": [
    {
      "representation_id": "content-api-en",
      "representation_version": 1,
      "current": true,
      "request_urls": [
        "https://www.gov.uk/api/content/guidance/immigration-rules/immigration-rules-appendix-eta-national-list"
      ],
      "expected_final_url": "https://www.gov.uk/api/content/guidance/immigration-rules/immigration-rules-appendix-eta-national-list",
      "expected_media_type": "application/json",
      "identity_profile_id": "govuk-eta-national-list-content-api-en",
      "identity_profile_version": 1,
      "expected_locale": "en",
      "expected_schema": "manual_section"
    }
  ]
}
```

SHA-256: `dc8898417b5082e23db64d968ba7ef2846714d9f7e67410f777e9c1a78f6b813`, using the same serialization convention as the source payload. Both displayed JSON blocks were compared to independently prepared payload objects.

### Field-by-field contract audit

| Field(s) | R1 / S1 requirement and selected result |
| --- | --- |
| Top-level `operation`, `item`, `representations` | Exact operation and allowed key sets. Nonempty representation array, maximum 16. Here exactly one. |
| `source_id`, `content_item_id` | Canonical local grammar. Source must already exist as an official authority. `govuk`/`eta-national-list` passes after the source gate. |
| `external_id_namespace`, `external_content_id` | Namespace uses local-id grammar; external value uses `^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$`. The UUID is exact. Within one source, an external namespace/id cannot be assigned to a second local item, including historical ownership. |
| `content_item_version`, item `current` | Initial registration requires integer `1` and literal `true`. Current-version uniqueness and FK relationships remain enforced. No update-by-replay. |
| `expected_publisher_ids`, `expected_authority_ids` | Each is 1–8 canonical, sorted, unique external IDs. The selected singleton Home Office arrays satisfy both parsers and match fresh API links. SQL stores/checks shape; it does not prove departmental identity. |
| `representation_id` | Canonical local grammar; unique stream id in the submitted array. Here `content-api-en`. |
| `representation_version`, representation `current` | Initial integer `1`, literal `true`; current representation constraints and item linkage apply. |
| `request_urls` | 1–16 sorted unique canonical absolute HTTPS URLs; no credentials, explicit port, fragment, wildcard or whitespace. S1 length bound 500. This singleton exact URL has no query and is authorized under the selected source. |
| `expected_final_url` | Exact canonical HTTPS URL authorized under the same source. Here identical to the sole request URL. No inferred redirect alias or HTML URL. |
| `expected_media_type` | Normalized lower-case media type, `application/json`; no `charset` suffix in the descriptor. HTTP's actual `application/json; charset=utf-8` is normalized by retrieval. |
| `identity_profile_id`, `identity_profile_version` | Canonical id and positive int32 version; graph requires matching current code-owned profile. Selected version 1 exists but is not active in the default registry today. SQL cannot validate executable profile availability. |
| `expected_locale`, `expected_schema` | Canonical `en` and `manual_section`, matching the fixed profile and fresh root metadata. Neither a title nor a translated HTML heading substitutes for these fields. |

An exact request/final URL shared within the **same** representation produces **one** permanent URL reservation and **one** representation-URL row, with ordinal 1 and `is_final=true`. It does not create two reservations. URL ownership is global across representation streams, including historical reservations; a second item or representation cannot borrow it.

S1 compares JSONB item data and canonically ordered representation descriptors for duplicate detection. Key order/JSON whitespace is immaterial to SQL equality; the payload hash convention is separate. Exact identical registration returns `idempotent`; changed values return `23505`. Malformed shape uses `22023`; a missing source uses `23503`. TypeScript transport failures remain sanitized `catalog_failed`, not raw SQL detail. Do not mistake these future SQL expectations from inspected implementation for writes tested against Development today.

SQL performs each registration atomically, including all domains or all item/version/representation/URL rows, under its required READ COMMITTED transaction and locks. The source and item are two separate transactions. The source does not roll back if the later item fails.

## Gateway gap and smallest implementation sequence

Repository search found **no exported typed `register_content_item` helper** in production TypeScript. The generic transport can carry arbitrary operation data, but that is not an approved normal registration API. No raw ad-hoc RPC recommendation closes this gap.

**Slice 1: dormant typed content gateway.** Own `lib/readiness/official-truth-source-catalog-server.ts`, its existing test file and bounded slice docs. Add `contentItemRegistrieren` or a single equivalently named server-only helper with typed input/result, runtime exact-key validation, existing v2 transport, and injected-transport tests. Reuse the R1 graph validation after reading the authoritative catalog; do not build a divergent descriptor parser. Cheap shape checks precede transport; full source/profile/URL/uniqueness validation precedes the registration RPC. The existing descriptor parsers are private, so reuse the public graph construction contract rather than assuming an exported parser exists.

Validate the proposed union with current catalog state and the production code-owned registry. Detect an exact existing item for idempotent replay without adding duplicate graph nodes; reject a changed item before writing. SQL remains authoritative against races. Return only an exact validated response: `ok=true`, schema 2, operation `register_content_item`, `outcome=inserted|idempotent`, exact `source_id` and exact `content_item_id`; reject missing/extra keys and mismatched tuple. Tests may inject registries/transports, but a live caller must not supply a registry or arbitrary profile. No browser route, service-role disclosure, migration, registration or activation belongs in this slice.

Tests must cover valid serialization (including inherited representation keys), malformed/unknown input, bounds/current/version checks, missing source/profile, conflicting external identity/URL ownership, source-catalog error, exact replay versus changed replay, wrong schema/operation/ids/outcome, missing/extra result fields and transport error sanitization. Unavailable production profiles must prevent the write; injected test profiles only permit deterministic transport tests.

**Slice 2: one-profile activation.** After Slice 1 is reviewed/merged, add exactly `GOVUK_ETA_NATIONAL_LIST_CONTENT_API_IDENTITY_PROFILE` to the frozen registry in `lib/readiness/official-truth-content-identity.ts`. Keep the profile implementation unchanged unless a separately reviewed defect requires otherwise. Update existing R1/R2/profile tests that currently assert registry emptiness or zero runtime imports. Assert precisely one current profile with exact id/version, permit only the intended registry importer, and retain all other importer guards. Gateway/retrieval tests must exercise the default registry, not only injected seams. Keep extractor/composition/region-pin registries empty. Missing Production v2 schema/RPC must still fail closed. No migration or DB registration in this slice.

Separating the dormant helper from activation makes each change independently reviewable. It adds no third deployment mechanism and no alternate order. The immediate next slice is the dormant helper, not a database write.

## Selected Order A and rejected alternatives

1. Complete the dormant gateway prerequisite and its independent exact-head review/merge.
2. Activate exactly the proven profile in a separate code slice; independent exact-head review, merge and post-merge verification. Record merge SHA and the actual runtime/deployment code revision the executor will use. Confirm the default profile registry has exactly this entry; other trust registries remain empty.
3. Re-run all Development/Production/governance gates below and obtain specific Product-Owner approval of the two Development registration payloads and their execution plan. Prior S1 migration approval does not authorize them.
4. Technical Lead executes `quelleRegistrieren` against Development only. Stop for independent source-step verification before any item call.
5. Technical Lead executes the new typed content helper against Development only. Stop for independent item-step readback and live identity smoke. Publish the immutable registration receipt/readbacks in GitHub.

Order A minimizes the period in which a forward-only domain claim exists without usable content identity and ensures normal graph reads never depend on an unavailable profile. Source-only is a short, deliberate checkpoint, not a usable publication.

**Order B rejected:** source-only is technically readable with the empty registry, but it reserves authority trust before the required code is ready, lengthens the intermediate state and leaves a persistent source if code activation fails. No benefit here outweighs Order A.

**Order C rejected:** SQL can structurally accept profile-reference rows before code activation. R1 then rejects reconstruction with `profile_unavailable`; exported `quellenKatalogLesen` returns `catalog_failed`. This can block the whole live graph and even the source helper's prerequisite read, not merely retrieval of one publication. It must not be used as a shortcut.

The default registry is currently `Object.freeze([])`. A source-only injected snapshot reconstructs successfully. The proposed item snapshot fails under that default; it succeeds with an explicitly injected existing profile. Wrong/absent profile versions fail. These were read-only in-memory observations. No production registry was edited.

Production has no Official Truth tables/v2 RPCs. R2 does not infer an empty successful catalog or fall back to v1: a configured transport failure remains `catalog_failed`, absent configuration remains `catalog_not_configured`. An injected missing-RPC transport still failed with the existing profile injected as active. Code inspection shows adding a profile causes no import-time fetch or DB creation. This supports Order A but is not a deployed activation test; Slice 2 must verify the real activation head and Production absence again.

## Future Development gates and exact readbacks

These are future execution requirements. Today's observations are in the report; they expire when underlying state changes.

### Before either write

- Record mode NORMAL, fresh main SHA, reviewed gateway/profile merge SHAs, exact executor runtime SHA and no overlapping writer from #751/#748/open PRs. Any drift requires review, not automatic continuation.
- Identify Development `yfvbxvijcorffwxbxahl` and Production `qscbgcdmivbbnzrcyegn` independently. Use Development-only server credentials for both write calls; never copy secrets into GitHub.
- Read full ordered Development migration version/name history and compare to this audit: 77 entries, fingerprint `d4ccafe8951fcb198c130443a10f5d61` under the report's exact query. Also verify S1 function definitions/security against the reviewed repository bytes; a history name alone is insufficient. Any unrelated migration drift is a re-review gate, not permission to repair history.
- Require S1 `20261004010705` present, intentionally unapplied `20261002154952` absent, temporary MCP version `20261004091341` absent. No plain `db push`, migration replay or reconciliation.
- Before source registration: all 19 private Official Truth tables exactly zero; successful schema-2 catalog with all seven arrays empty. Before item registration: exactly the independently verified source-only state below, with all other rows still zero.
- Require Production Official Truth table inventory empty and both v2 RPC signatures absent. Any Production presence is STOP. Use metadata reads only there.
- Re-fetch official National List and sibling identities through bounded reviewed retrieval; compare exact UUID, locale, schema, issuer, manual and URL/profile constraints. A source update may be harmless content change, but identity drift is STOP. Capture time, status, final URL, normalized media type and body hash; do not pin this audit's body hash as permanent identity.
- Independently review the complete displayed payloads and freshly computed hashes. Require explicit Product-Owner Development-write approval naming scope/payloads, Technical Lead executor, and a separate read-only verifier after **each** write. Record approval and planned verifier before apply. If separate personnel/session is impractical, escalate the verification arrangement before execution; no self-signoff substitution by silence.

### After source registration, before item registration

- Record exact RPC/helper outcome `inserted` or exact `idempotent`, schema 2, operation and source id; unknown/ambiguous transport outcome means STOP and inspect state before an approved replay.
- Independent read-only verifier runs `read_registry` as `service_role`, reconstructs through the normal non-injected gateway at the activation head, and checks `govuk` with exact class/names/domain.
- Exact SQL counts: sources 1; source domains 1; blocked domains 0; all five content tables 0; Evidence/Rule/fact tables 0. Catalog arrays: sources 1, all six remaining arrays 0.
- Exact National List API URL resolves authority `govuk`, but content resolution is `not_registered`; no representation is eligible. Do not confuse authority resolution with trusted content.
- Production absence unchanged. Publish this step's independent receipt; only then permit the item call.

### After item registration

- Record exact response tuple/outcome; independently read the v2 snapshot and reconstruct it through normal production-registry code, without an injected profile seam.
- Counts: sources 1, domains 1, blocked domains 0; `official_content_items` 1; `official_content_item_versions` 1; `official_content_representations` 1; `official_content_url_reservations` 1; `official_content_representation_urls` 1. Each item/representation version is exactly 1/current. All Evidence/Rule/fact tables remain 0.
- Catalog arrays contain exactly one source, item, item-version, representation, reservation and representation-URL row; blocked domains is empty. Compare every field/pin with the reviewed payload; verify the inherited item tuple, ordinal 1 and `is_final=true` on the single exact URL binding.
- National List exact URL resolves one current representation and exact current code profile. Sibling Appendix ETA URL still resolves authority `govuk` but **content `not_registered`**. No HTML or speculative aliases appear.
- Fresh bounded registry-free identity retrieval/verifier smoke passes for the National List through the normal activated profile. Sibling URL and sibling bytes must fail the appropriate content/identity boundary. Do not invoke Evidence acceptance/store or manufacture a legal fact.
- Re-read Production absence, unchanged migration history/security and zero Evidence/Rule counts. Record independent verifier identity, runtime SHA, timestamps, safe raw response, exact payload hashes, complete normalized catalog, counts and smoke result in the GitHub registration log. Any unexpected row/value/error is STOP.

## Forward-only registration and failure recovery

The v2 contract exposes no casual unregister/delete/update. Treat both writes as forward-only authoritative catalog changes. Their SQL transaction protects a single operation, not the two-step procedure. A source-only intermediate state remains if item validation, transport or insertion fails.

After an ambiguous response, read back independently; do not assume absence or automatically retry with a changed descriptor. Only an exact identical replay, under the approved plan and after comparison, may be idempotent. A conflicting registration requires a separately designed, reviewed, Product-Owner-gated forward correction/retirement operation or migration. Direct DELETE/TRUNCATE, grant bypass, history repair and domain reassignment are not rollback plans.

Before any content row exists, a reviewed code revert of activation can leave source-only reads valid. After representation rows exist, removing their profile makes graph reads fail, including historical representation references: R1 requires a matching current code profile for every reconstructed descriptor. Keep required profiles available until an explicitly designed compatibility/retirement path is reviewed. A generic “revert activation” is therefore unsafe after content registration.

## Twenty adversarial plan cases

Observed means in-memory probe/current code inspection, not a Development write test. SQL outcomes are inspected implementation expectations. Departmental semantics and scope exclusions are deliberate plan decisions.

| # | Case | Expected boundary / decision |
| --- | --- | --- |
| 1 | `home-office` + `www.gov.uk` | Structurally accepted when first (observed); semantically rejected because it monopolizes the shared platform host. |
| 2 | `govuk` + `www.gov.uk` | Accepted candidate; observed source graph/authority resolution; selected exact payload. |
| 3 | Domain `gov.uk` | Structurally accepted (observed), rejected as overbroad official-domain scope. |
| 4 | Extra publishing domains | Reject from plan; research docs hosts are not required request/final hosts. A syntactically valid extra host is not self-authorizing. |
| 5 | Same source id, changed metadata | Helper `conflicting_duplicate` observed before write; SQL `23505`; no overwrite. |
| 6 | Second source claims `www.gov.uk` | Registry `overlapping_domains` observed, including parent/child conflicts; SQL overlap rejection independently applies. |
| 7 | Same external UUID under second local item | R1 duplicate-external rejection observed; S1 unique source/namespace/id ownership rejects, including history. |
| 8 | Same exact API URL under second item | R1 duplicate-URL rejection observed; S1 permanent reservation prevents reassignment. |
| 9 | Appendix ETA UUID with National List local id | Shape alone can pass R1/S1 (observed graph); fixed National List profile rejects descriptor mismatch. Independent prewrite review must reject; do not claim SQL knows the publication. |
| 10 | Appendix ETA URL as National List representation | Source authorization/shape alone can pass (observed graph); profile rejects wrong descriptor URL. Prewrite payload review rejects. Sibling returned bytes also fail the National List verifier. |
| 11 | Profile absent | R1 `profile_unavailable` observed; normal gateway `catalog_failed`. No item write allowed. |
| 12 | Wrong profile version | Matching id is insufficient; exact current id/version required. `profile_unavailable` observed. |
| 13 | Source only | Normal graph/read succeeds with empty profile registry; National List content `not_registered` (observed). Deliberate checkpoint, no publication identity. |
| 14 | Item before source | R1 `unknown_source` observed; SQL `23503`; helper must stop before registration RPC. |
| 15 | Item before activation | SQL profile existence is unchecked; normal graph fails as in case 11. Reject Order C. |
| 16 | Exact source replay | Existing helper serialization with injected `idempotent` response observed; SQL exact metadata/domain comparison inspected. No duplicate row. |
| 17 | Exact item replay | S1 exact item/canonical-representation comparison inspected; future helper must validate `idempotent` response/tuple and tests. Not executed against live DB. |
| 18 | Changed replay | Reject conflict, no upsert. Source helper conflict observed; item SQL `23505` inspected; malformed changes may fail shape earlier. |
| 19 | Production DB absent during activation | Live absence observed; R2 missing-transport simulation with active profile remains `catalog_failed`, missing env `catalog_not_configured`; no v1/empty-success fallback. Actual activation verification remains a gate. |
| 20 | Future second reviewed Home Office/GOV.UK item | Can share `govuk`; needs distinct local item/external UUID/URLs and suitable reviewed profile. It cannot inherit National List identity merely from issuer/host. |

## Completion boundary

This audit resolves the source semantics, exact payload shape, missing helper, ordering and forward-only ambiguity sufficiently for PLAN_READY. It does not assert that the missing helper exists or that future write gates have passed. [Report](OFFICIAL_TRUTH_GOVUK_NATIONAL_LIST_REGISTRATION_AUDIT_1_REPORT_2026-10-04.md), [handoff](OFFICIAL_TRUTH_GOVUK_NATIONAL_LIST_REGISTRATION_AUDIT_1_HANDOFF_2026-10-04.md) and [self-review](OFFICIAL_TRUTH_GOVUK_NATIONAL_LIST_REGISTRATION_AUDIT_1_SELF_REVIEW_2026-10-04.md) retain the observed evidence and remaining gates.

The extractor registry, composition policy and region pins remain empty. No trusted legal fact exists; identity registration would not create one. No user-facing eligibility behavior, engine, credentials, costs or schema changed. Remain Draft and STOP for independent Technical-Lead review of the exact published head.
