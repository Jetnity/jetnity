# Official Truth GOV.UK Development Registration Receipt 1

Date: 4 October 2026  
Issue: #826

Status: **DEVELOPMENT REGISTRATION COMPLETE / READBACK VERIFIED / PRODUCTION UNCHANGED / F8 NOT AUTHORIZED**

## Product-Owner approval

Exact approval received in chat:

`Development GOV.UK Source + ETA National List Registration freigegeben`

This approval applied only to the exact first Development registration sequence selected by the accepted #821 audit after #823 and #825 were independently merged and post-merge verified.

## Baseline and gates

Execution baseline:

- GitHub main: `aa70f88a43bf66ed81de6cc41868d3320c0ae116` (Merge #825)
- mode: `NORMAL`
- #825 post-merge CI: `37228915540` SUCCESS
- Production deployment: `dpl_BMMzfJ8UdK4RW5NJde9Y3E296U9t` READY / `jetnity.com` / `aliasError=null`
- Development Supabase project: `yfvbxvijcorffwxbxahl`
- Production Supabase project: `qscbgcdmivbbnzrcyegn`
- Development catalog before registration: all seven schema-2 arrays empty
- Production Official Truth v2 before registration: absent
- no new blocking #748 MATERIAL after processed marker `5982622080`

## Execution transport note

The accepted #821 plan names the typed server helpers `quelleRegistrieren` and `contentItemRegistrieren` as the normal execution paths.

In this Technical-Lead chat execution environment, the available authenticated mutation surface was the Supabase connector. The Technical Lead therefore invoked **the exact reviewed schema-2 RPC payloads directly against `public.official_truth_source_catalog_v2(jsonb)` under `service_role`**, after independently re-reading the merged helper/runtime code and the accepted #821 payload audit.

This did **not** write private tables directly and did not bypass the database's canonical validation/locking/atomicity contract. The same literal v2 RPC and exact payload shapes serialized by the merged helpers were used. The TypeScript-side preflight guarantees were independently reproduced by:
- live empty-catalog preflight;
- exact accepted payload comparison;
- already merged/default-active GOV.UK profile v1;
- source-only readback before content registration;
- full read-only catalog/row verification after registration.

No rollback/delete/truncate is proposed or performed. This transport note is preserved so later reviewers do not incorrectly claim the helper function itself was executed by this chat runtime.

## Step 1 — Development source registration

Exact reviewed source payload SHA-256 from #821:

`035d65efb97d8dd82a8bc4e232854230fa6aacbf71197442a9555d4865e50750`

Payload identity:

- operation: `register_source`
- source_id: `govuk`
- source_class: `official_authority`
- publisher_name: `GOV.UK`
- authority_name: `UK Government`
- domains: exactly `["www.gov.uk"]`

RPC result:

```json
{
  "ok": true,
  "outcome": "inserted",
  "operation": "register_source",
  "source_id": "govuk",
  "identity_schema": 2
}
```

Database `registered_at` readback:

`2026-10-04T19:44:21.203985+00:00`

### Mandatory source-only checkpoint

Read-only schema-2 catalog immediately after source registration contained:

- exactly one source: `govuk`
- exact domain: `www.gov.uk`
- source class: `official_authority`
- publisher: `GOV.UK`
- authority: `UK Government`
- content_items: empty
- item_versions: empty
- representations: empty
- url_reservations: empty
- representation_urls: empty
- blocked_domains: empty

Administrative read-only row counts at this checkpoint:

- `private.official_sources`: 1
- `private.official_source_domains`: 1
- every content/Evidence/Rule table: 0

A direct private-table COUNT under `service_role` was denied by the intended private-schema grant boundary. The checkpoint therefore used the supported `read_registry` RPC plus administrative read-only table metadata. No permission was widened.

## Step 2 — Development content registration

Exact reviewed content payload SHA-256 from #821:

`dc8898417b5082e23db64d968ba7ef2846714d9f7e67410f777e9c1a78f6b813`

Registered identity:

- source: `govuk`
- content item: `eta-national-list`
- external namespace: `govuk-content-id`
- external content id: `2b25b3d4-4eaa-4859-a34e-c7869c114c15`
- item version: 1 / current
- publisher pin: `06056197-bc69-4147-aa28-070bca132178`
- authority pin: `06056197-bc69-4147-aa28-070bca132178`
- representation: `content-api-en`
- representation version: 1 / current
- request/final URL: `https://www.gov.uk/api/content/guidance/immigration-rules/immigration-rules-appendix-eta-national-list`
- media type: `application/json`
- identity profile: `govuk-eta-national-list-content-api-en` v1
- locale: `en`
- schema: `manual_section`

RPC result:

```json
{
  "ok": true,
  "outcome": "inserted",
  "operation": "register_content_item",
  "source_id": "govuk",
  "content_item_id": "eta-national-list",
  "identity_schema": 2
}
```

## Final Development readback

The supported schema-2 `read_registry` RPC returned exactly:

- 1 source
- 1 content item
- 1 item version
- 1 representation
- 1 URL reservation
- 1 representation URL
- 0 blocked domains

Exact source:
- `govuk`
- `official_authority`
- `GOV.UK`
- `UK Government`
- `www.gov.uk`

Exact item:
- `govuk / eta-national-list`
- external identity `govuk-content-id / 2b25b3d4-4eaa-4859-a34e-c7869c114c15`

Exact item version:
- version 1
- `current=true`
- publisher/authority pins both exactly Home Office UUID `06056197-bc69-4147-aa28-070bca132178`

Exact representation:
- `content-api-en` v1/current
- final URL exactly the reviewed National List Content API URL
- `application/json`
- profile `govuk-eta-national-list-content-api-en` v1
- locale `en`
- schema `manual_section`

Exact URL ownership:
- one permanent reservation for the reviewed URL
- owner stream: `govuk / eta-national-list / content-api-en`
- one representation URL row
- `request_ordinal=1`
- `is_final=true`

Administrative read-only final row counts:

- `private.official_sources`: 1
- `private.official_source_domains`: 1
- `private.official_content_items`: 1
- `private.official_content_item_versions`: 1
- `private.official_content_representations`: 1
- `private.official_content_url_reservations`: 1
- `private.official_content_representation_urls`: 1
- `private.official_source_blocked_domains`: 0
- `private.official_evidence_versions`: 0
- all Rule claim/fact/support tables: 0

No Evidence and no Rule fact were created by this registration.

## Production recheck

Production `qscbgcdmivbbnzrcyegn` remains unchanged:

- no Official Truth private tables
- no `official_truth_source_catalog_v2(jsonb)`
- no `official_truth_store_accepted_v2(jsonb)`
- no v2 content item table
- no v2 Evidence table

## Security and scope result

PASS for the exact approved Development registration scope:

- Development only
- exact reviewed payloads only
- no direct private table mutation
- no migration
- no schema/RLS/Auth/grant change
- no Production DB write
- no extractor activation
- no composition-policy activation
- no region-pin activation
- no Evidence acceptance
- no Rule acceptance
- no F8
- no delete/truncate/rebind
- no recurring cost change

## Next gate

**STOP.**

This receipt does not authorize the next Official Truth stage.

The newly registered source/content identity is catalog metadata and identity authority only. It is **not yet an accepted travel rule** and does not by itself mean the Trip Workspace may display a legal/entry requirement.

Any next stage involving live server-owned retrieval, trusted-fact extraction, accepted Evidence, Rule acceptance, autonomous F8, or Production Official Truth remains separately governed.
