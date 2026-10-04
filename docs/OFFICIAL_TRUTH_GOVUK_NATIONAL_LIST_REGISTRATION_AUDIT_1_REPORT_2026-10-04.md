# GOV.UK ETA National List Registration Audit 1 — Report

Date: 4 October 2026. Issue [#820](https://github.com/Jetnity/jetnity/issues/820), Draft PR [#821](https://github.com/Jetnity/jetnity/pull/821). Model: **GPT-6 Astra — Sehr hoch** (`gpt-6-astra`, `xhigh`). Writer generation 1; docs/audit only.

**`GOVUK_NATIONAL_LIST_REGISTRATION_PLAN_READY`**. The plan is complete; implementation and Development-write authorization are outstanding gates. No source/content registration, profile activation, DB mutation, extractor/policy/pin change or F8 completion occurred.

## Repository and governance evidence

Fresh `origin/main` was exactly `93ad2e447353af6bf380c2df1be190baeeb39888`; the assigned branch started at `90dc6e57a4c0c380ee83a1cd24e14e0f1f5497e5`. Machine mode was NORMAL. Live #751's current dispatch names this single writer, #820/#821 and the required branch/model/baseline. Lower historical #801 material in that issue is not a second live assignment; the newer dispatch and live PR evidence govern. Open PR inspection found #821 plus historical #28/#39/#40/#50/#52, with no second overlapping Official Truth writer. Relevant prior Codex chats were idle/not loaded; no agent delegation was started.

[#748 after marker 5978621253](https://github.com/Jetnity/jetnity/issues/748#issuecomment-5978621253) contained only the later [TL processing receipt 5978881653](https://github.com/Jetnity/jetnity/issues/748#issuecomment-5978881653), and no new external MATERIAL. That receipt records the previous Development S1 approval, the independent-verifier governance finding and the intentionally unapplied older migration. It is not authorization for new registration writes. The live #821 dispatch comment is [5981556817](https://github.com/Jetnity/jetnity/pull/821#issuecomment-5981556817).

Read the complete binding task and the required merged source-identity reconciliation, R1 report, S1 report/apply log, R2 report, #816 audit and #818 verifier report. Inspected the relevant project/governance standards, current source registry, R1 graph, source gateway, fixed GOV.UK profile, S1 SQL constraints/RPC/security and existing tests. Historical design descriptions were checked against current code and live state, not copied as present-tense claims.

The immutable task seed has Git blob `8946bb45fddd2edadb08200fbc82bb3815d440e9` and file SHA-256 `89410bb9ab6238cc3aa5f54297383cdbd1b0e7412a7fa0f1bd0f5a07a54422c3`. It is unchanged from dispatch. The final head is recorded externally in the PR delivery receipt to avoid a self-referential commit hash. This report is valid only as part of that reviewed five-file head.

## Live read-only database observations

Every SQL request used `BEGIN READ ONLY` and `ROLLBACK`. No `register_source`, `register_content_item`, store operation, migration, DDL or table DML was sent to Supabase. The only live RPC execution was Development `read_registry`, under `SET LOCAL ROLE service_role`. Metadata and count queries are distinct from registration permission.

| Environment / observed UTC time | Result |
| --- | --- |
| Production `qscbgcdmivbbnzrcyegn`, 15:31:46.236703 | Zero `private.official_%` tables; `to_regprocedure` returned null for `public.official_truth_source_catalog_v2(jsonb)` and `public.official_truth_store_accepted_v2(jsonb)`. Content-item and Evidence table probes were null. No Production RPC invoked. |
| Development `yfvbxvijcorffwxbxahl`, 15:32:40.716984 | Exact count queries returned zero in all 19 Official Truth tables listed below. Development branch identity was confirmed against its Production parent. |
| Development, 15:32:45.531507 | `service_role` v2 `read_registry` returned successful identity schema 2 and seven empty catalog arrays. This is a real database read, unlike the later injected in-memory gateway probes. |
| Development, 15:36:18.869055 | Both v2 functions are `SECURITY DEFINER`, owner `postgres` with BYPASSRLS, empty `search_path`; `anon`/`authenticated` execute false, `service_role` execute true. Function bodies match the repository S1 bodies under the MD5 comparisons below. |
| Development, 15:38:55.692626 | All 19 tables have RLS enabled and forced, zero policies, and no direct INSERT/UPDATE/DELETE grants for `anon`, `authenticated` or `service_role`. This observation does not claim a separate live SELECT-grant audit. |
| Development, 15:43:52.897997 | Full migration history contains 77 entries. Ordered version/name MD5 is `d4ccafe8951fcb198c130443a10f5d61`; S1 present, `20261002154952` absent, temporary MCP version `20261004091341` absent. |

UTC +02:00 gives the Europe/Zurich times. Observations are timestamped snapshots, not a lease on future database state.

The 19 exact zero-count tables, all in `private`:

| Category | Tables |
| --- | --- |
| Authority | `official_sources`, `official_source_domains`, `official_source_blocked_domains` |
| Content | `official_content_items`, `official_content_item_versions`, `official_content_representations`, `official_content_url_reservations`, `official_content_representation_urls` |
| Evidence/claims | `official_evidence_versions`, `official_rule_claims`, `official_rule_claim_support` |
| Typed facts | `official_rule_claim_actions`, `official_rule_claim_blank_pages`, `official_rule_claim_passport_validity`, `official_rule_claim_requirement_effect`, `official_rule_claim_stay_limit`, `official_rule_claim_temporal_rule`, `official_rule_claim_transit_paths`, `official_rule_claim_visa_options` |

Relevant Development history tail (the full-history fingerprint also covers earlier entries):

| Version | Name |
| --- | --- |
| `20261001121258` | `official_truth_private_evidence_store_schema_1` |
| `20261001151048` | `official_truth_accepted_rule_claim_persistence_schema_1` |
| `20261001180549` | `official_truth_trusted_store_writer_1` |
| `20261001193748` | `official_truth_source_catalog_gateway_1` |
| `20261004010705` | `official_truth_content_identity_2` |

The history fingerprint was computed with the following read-only query; preserve its JSONB serialization when comparing. MD5 here is a reproducible equality check, not a cryptographic security guarantee or substitute for reviewing migration/function bytes.

```sql
BEGIN READ ONLY;
SELECT count(*) AS migration_count,
       md5(coalesce(jsonb_agg(jsonb_build_object('version',version,'name',name)
           ORDER BY version)::text,'[]')) AS ordered_version_name_md5
FROM supabase_migrations.schema_migrations;
ROLLBACK;
```

`md5(pg_proc.prosrc)` for catalog v2: `9f39e93a4caaa3acdc6e11f729828347`; store v2: `dc7aa2d3e7ca0f5dacc0bc461d1dda17`. Each matches the corresponding exact `$fn$` body extracted from `20261004010705_official_truth_content_identity_2.sql`. This is a targeted body/security check, not a fresh whole-schema equivalence proof. The historical S1 apply log remains relevant; future apply preflight must independently recheck schema constraints and permissions needed for registration.

## Official HTTP capture ledger

All seven fresh captures returned status 200 with final URL equal to the linked request, and decoded as UTF-8 successfully. Response-byte hashes identify research captures; they do not authorize content or assert an unchanged legal rule. The organisation response is larger than the runtime retrieval body cap and was used only as official research evidence, never registered for runtime retrieval.

| URL | UTC start → finish (2026-10-04) | Bytes | SHA-256 |
| --- | --- | --- | --- |
| [National List API](https://www.gov.uk/api/content/guidance/immigration-rules/immigration-rules-appendix-eta-national-list) | 15:34:24.175679 → 15:34:24.352305 | 7,788 | `59a7fd6e7416f989ace351bc5ab4f562c52b3c5cab64fcbe861ea4a57ced1854` |
| [Appendix ETA API](https://www.gov.uk/api/content/guidance/immigration-rules/immigration-rules-appendix-electronic-travel-authorisation) | 15:34:24.352828 → 15:34:24.482992 | 22,965 | `6859cfcacb44cc1287daa8daeedaf05a8b7f18e4ee638cfa7253e09f5d170037` |
| [Home Office API](https://www.gov.uk/api/content/government/organisations/home-office) | 15:34:24.484157 → 15:34:24.850505 | 302,033 | `ee2357be212aae4d6f81b9e673f04c99f2a7d6b23179ebdf02d3d44237cab35c` |
| [About GOV.UK](https://www.gov.uk/help/about-govuk) | 15:34:24.854095 → 15:34:25.102207 | 66,203 | `9ebdf79051a302ce841432914d7436cc5165605f5635bc1c08847d40978bf8a0` |
| [Domain eligibility](https://www.gov.uk/guidance/check-if-your-organisation-can-get-a-govuk-domain-name) | 15:34:25.103402 → 15:34:25.284157 | 102,493 | `27bf0c9457c7935d7c5e7ebe7a440c2421b1f7ab14fa7504f7b9d07acb7ca889` |
| [Publishing API model](https://docs.publishing.service.gov.uk/repos/publishing-api/model.html) | 15:34:25.284414 → 15:34:25.588015 | 35,986 | `a3c0a7ca64a3d4f59732c4bbfd09b04a84aa9f2cc5ab80ed6ce6aabfb8c60b51` |
| [Content API reference](https://content-api.publishing.service.gov.uk/reference.html) | 15:34:25.588867 → 15:34:25.878712 | 29,934 | `66cbeda411840ed8cea0f76771b347a40a1b7319c22eb5c1922ce6c85cd42445` |

Supporting official browser reads: [government organisations](https://www.gov.uk/government/organisations), [Home Office about](https://www.gov.uk/government/organisations/home-office/about), [government domain-name list](https://www.gov.uk/government/publications/list-of-gov-uk-domain-names). These supporting reads have no independently recorded byte hash in this ledger. No blog or general web assumption supplies the source identity.

## Reproducible code observations and validation

An external-to-repository scratch runner imported the unchanged TypeScript modules using the existing server-only test hook/tsx loader. It disabled ambient fetch, used injected in-memory transports for source/gateway calls and verified saved public HTTP bytes with the existing profile. No new repository tests or production helpers were added. At 15:38:25.793 UTC, **38 assertions passed**:

- frozen empty production profile registry before/after; selected source passes; department source passes shape but conflicts with a later shared-host source; broad-domain shape acceptance and exact/suffix authority behavior;
- source-only graph/read succeeds; National List content remains unregistered; item before source fails; item graph without/wrong profile fails; explicit profile injection reconstructs it;
- duplicate external identity and exact URL ownership reject; sibling URL remains unregistered;
- normal gateway maps unavailable-profile graph to `catalog_failed`; simulated missing RPC remains failed with an active injected profile; missing config remains `catalog_not_configured`;
- existing profile accepts fresh National List capture, rejects Appendix bytes and rejects wrong external-id/URL descriptors even though those descriptor shapes can pass the generic graph;
- source helper serializes the exact selected payload for injected inserted/idempotent responses; changed source metadata rejects before the registration call;
- identical request/final URL produces one URL row/reservation with ordinal 1 and `is_final=true`.

The unmodified focused suites also ran:

```sh
node --import ./scripts/server-only-test-register.mjs --import tsx --test \
  lib/readiness/official-truth-content-identity.test.ts \
  lib/readiness/official-truth-govuk-content-api-identity-profile.test.ts \
  lib/readiness/official-truth-content-identity-r2.test.ts
```

Result: **400 tests passed, 9 suites, 0 failed, 0 cancelled, 0 skipped**. These tests and probes establish current pure/injected behavior; they are not a deployed activation test, a new content-helper test or a live registration rehearsal.

Required delivery checks: exact five-file docs diff, immutable-seed equality, payload JSON/hash comparison, `git diff --check`, operating-mode guard, fresh main/mode/#751/#748/collision check and remote exact-head readback. Their final result/SHA is recorded in the PR receipt after publication. No Production build, full test run, lint, typecheck or DB mutation test was run for this docs-only audit. No skipped command is represented as passed.

## Outcome and remaining gates

[Main audit](OFFICIAL_TRUTH_GOVUK_NATIONAL_LIST_REGISTRATION_AUDIT_1_2026-10-04.md) contains the exact two JSON payloads, field audit, all 20 adversarial cases and future pre/post counts. [Handoff](OFFICIAL_TRUTH_GOVUK_NATIONAL_LIST_REGISTRATION_AUDIT_1_HANDOFF_2026-10-04.md) defines bounded ownership and independent review/apply gates.

No architecture/runtime behavior or recurring infrastructure cost changed. The security-relevant risks are explicit: SQL is not publication authentication; profile availability is not semantic verification; writes are forward-only; code-profile rollback can invalidate stored descriptors; Production absence must stay a failure. These risks are assigned gates, not erased by PLAN_READY.

Remain Draft. No Ready, merge, follow-up implementation or registration started. STOP for independent Technical-Lead exact-head review. F8 remains OPEN.
