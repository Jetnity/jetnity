# Official Truth Development S1 Apply Log — 4 October 2026

Issue: #812  
Repository baseline: `main@8e5245bca7d00215f1921446624434ae90d30c0f`  
Target: Supabase Development `yfvbxvijcorffwxbxahl`  
Production `qscbgcdmivbbnzrcyegn`: **NOT TOUCHED / NOT AUTHORIZED**

## Authorization

Product Owner explicitly authorized **Development S1 Apply** on 4 October 2026.

This authorization did not include Production, R2, a real source/content/profile registration, GOV.UK/CTA registration, F8, or any additional migration.

## Applied repository migration

Exact reviewed file:

`supabase/migrations/20261004010705_official_truth_content_identity_2.sql`

Repository provenance:

- PR #811
- accepted head `89467e9877250be9a6506029fd80b6d6c2dcdf2e`
- Technical-Lead FINAL PASS comment `5978320344`
- merge/main `8e5245bca7d00215f1921446624434ae90d30c0f`
- post-merge CI `37190711959` SUCCESS
- Production web deployment `dpl_ESHMLzCb4UG9Eme8xjEaEyJgFdrh` READY

The Development database apply used the exact bytes from the migration on that main SHA.

## Pre-apply readback

Immediately before the action:

- machine mode: `NORMAL`
- no coding writer active
- open PRs only historical #28/#39/#40/#50/#52
- Development applied migration history ended at:
  `20261001193748_official_truth_source_catalog_gateway_1`
- repo migration
  `20261002154952_official_truth_owner_reviewer_capability_1.sql`
  was **not applied** in Development
- all current private Official Truth source/domain/Evidence/Rule/support/fact tables had exact row count 0
- current v1 source-catalog/store RPC owner: `postgres`
- owner role: `rolbypassrls=true`

A plain `supabase db push` was therefore prohibited.

## Controlled apply mechanism

The available Supabase MCP `apply_migration` endpoint cannot accept a caller-supplied migration version. It generates a remote timestamp.

Protocol executed:

1. fetched the exact reviewed S1 SQL from `main@8e5245bc...`;
2. applied only that SQL to Development using Supabase `apply_migration` with name:
   `official_truth_content_identity_2`;
3. apply returned `success=true`;
4. immediate migration-history readback showed exactly one new row:
   `20261004091341 / official_truth_content_identity_2`;
5. verified:
   - target repo version `20261004010705` was absent;
   - unapproved `20261002154952` remained absent;
   - exactly one new S1 row existed;
6. repaired only that new S1 history row's `version` field from
   `20261004091341` to repository version `20261004010705`
   in a guarded operation that aborted on ambiguity;
7. final migration-history readback requires and confirms:
   `20261004010705 / official_truth_content_identity_2`;
8. generated MCP-only version `20261004091341` is no longer present;
9. `20261002154952` remains unapplied.

No other migration-history row was intentionally changed.

## Post-apply schema and data readback

Exact row-count readback after S1:

- `private.official_sources`: 0
- `private.official_source_domains`: 0
- `private.official_source_blocked_domains`: 0
- `private.official_content_items`: 0
- `private.official_content_item_versions`: 0
- `private.official_content_representations`: 0
- `private.official_content_url_reservations`: 0
- `private.official_content_representation_urls`: 0
- `private.official_evidence_versions`: 0
- `private.official_rule_claims`: 0
- `private.official_rule_claim_support`: 0
- all eight current `private.official_rule_claim_*` fact tables: 0

No source, content item, representation, profile, Evidence or Rule row was seeded.

## RPC readback

Development now exposes:

- `public.official_truth_source_catalog_v1(jsonb)`
- `public.official_truth_store_accepted_v1(jsonb)`
- `public.official_truth_source_catalog_v2(jsonb)`
- `public.official_truth_store_accepted_v2(jsonb)`

For all four:

- SECURITY DEFINER = true
- owner = `postgres`
- owner `rolbypassrls=true`
- `search_path=""`
- PUBLIC execute = false
- anon execute = false
- authenticated execute = false
- service_role execute = true

The two v1 RPCs were executed under `service_role` inside guarded proof blocks and each produced the required SQLSTATE `0A000`. The proof blocks succeeded only by catching that exact SQLSTATE.

The v2 catalog was executed under `service_role` and returned:

- `ok=true`
- `operation=read_registry`
- `identity_schema=2`
- explicit empty arrays for sources, blocked domains, content items, item versions, representations, representation URLs and URL reservations.

## Private table security readback

All six new S1 private tables have:

- RLS enabled = true
- FORCE RLS = true
- policy count = 0
- anon direct INSERT/UPDATE/DELETE = false
- authenticated direct INSERT/UPDATE/DELETE = false
- service_role direct INSERT/UPDATE/DELETE = false

The Supabase security advisor reports `rls_enabled_no_policy` INFO findings for these private tables. This is expected by the S1 design: the private tables intentionally have no permissive RLS policies and are accessible for writes only through the reviewed SECURITY DEFINER RPCs.

Other advisor findings shown for unrelated existing public tables/functions are pre-existing and are not changed by this apply.

## Production proof

Read-only Production check after Development apply:

- `private.official_content_items`: absent
- `private.official_evidence_versions`: absent
- `public.official_truth_source_catalog_v2(jsonb)`: absent
- `public.official_truth_store_accepted_v2(jsonb)`: absent

Production Official Truth remains unapplied.

## Result

**DEVELOPMENT_S1_APPLY_PASS**

Development now has the reviewed content-identity private schema/RPC v2 cutover and remains data-empty.

The older repo migration `20261002154952` remains intentionally unapplied.

This result does **not** authorize:

- Production apply;
- R2 automatically;
- real source/content/profile rows;
- GOV.UK/CTA registration;
- extractor/composition-policy activation;
- F8;
- schema-1 applicability persistence.

Next work requires a fresh Technical-Lead Binding Slice Precheck and must treat this apply log plus live Development readback as the new database baseline.
