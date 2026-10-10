-- Official Truth fingerprint protocol v2. Additive repository definition;
-- apply only to an explicitly approved environment after the local PG16 proof.
begin;

lock table private.official_sources, private.official_source_domains,
  private.official_evidence_versions, private.official_content_items,
  private.official_content_item_versions, private.official_content_representations
  in access exclusive mode;

alter table private.official_evidence_versions
  add column source_fingerprint_protocol smallint not null default 1
    check (source_fingerprint_protocol in (1, 2));

-- There is deliberately no registration RPC or service-role write grant.
-- A future separately approved profile must be installed by an owner-gated
-- migration and pin the exact current representation tuple.
create table private.official_source_fingerprint_protocols (
  source_id text not null,
  content_item_id text not null,
  content_item_version integer not null check (content_item_version > 0),
  representation_id text not null,
  representation_version integer not null check (representation_version > 0),
  identity_profile_id text not null,
  identity_profile_version integer not null check (identity_profile_version > 0),
  canonical_url text not null,
  content_type text not null,
  max_bytes integer not null check (max_bytes = 131072),
  primary key (
    source_id, content_item_id, content_item_version, representation_id,
    representation_version, identity_profile_id, identity_profile_version
  ),
  foreign key (
    source_id, content_item_id, content_item_version, representation_id,
    representation_version, identity_profile_id, identity_profile_version,
    content_type, canonical_url
  ) references private.official_content_representations (
    source_id, content_item_id, content_item_version, representation_id,
    representation_version, identity_profile_id, identity_profile_version,
    expected_media_type, expected_final_url
  )
);
alter table private.official_source_fingerprint_protocols enable row level security;
alter table private.official_source_fingerprint_protocols force row level security;
revoke all on private.official_source_fingerprint_protocols from public, anon, authenticated, service_role;

create function private.official_truth_fingerprint_profile_immutable_v2()
returns trigger language plpgsql set search_path = '' as $fn$
begin
  raise exception 'fingerprint profile is append-only' using errcode = '0A000';
end;
$fn$;
create trigger official_truth_fingerprint_profile_immutable_v2
  before update or delete on private.official_source_fingerprint_protocols
  for each row execute function private.official_truth_fingerprint_profile_immutable_v2();

-- The body is supplied transiently so SQL can independently verify the full
-- source hash. It is never stored in the evidence table or receipt table.
create table private.official_truth_v2_fingerprint_receipts (
  backend_pid integer not null,
  transaction_id xid8 not null,
  version_id text not null check (version_id ~ '^ev2_[a-f0-9]{32}$'),
  primary key (backend_pid, transaction_id, version_id)
);
alter table private.official_truth_v2_fingerprint_receipts enable row level security;
alter table private.official_truth_v2_fingerprint_receipts force row level security;
revoke all on private.official_truth_v2_fingerprint_receipts from public, anon, authenticated, service_role;

create function private.official_truth_source_fingerprint_v2(
  source_id_ text,
  content_item_id_ text,
  content_item_version_ integer,
  representation_id_ text,
  representation_version_ integer,
  identity_profile_id_ text,
  identity_profile_version_ integer,
  canonical_url_ text,
  content_type_ text,
  source_snapshot_ text
) returns text
language plpgsql immutable strict set search_path = '' as $fn$
declare
  normalized text;
  preimage text;
begin
  if pg_catalog.octet_length(pg_catalog.convert_to(source_snapshot_, 'UTF8')) not between 1 and 131072
    or pg_catalog.left(source_snapshot_, 1) = pg_catalog.chr(65279) then
    return null;
  end if;
  normalized := pg_catalog.replace(pg_catalog.replace(source_snapshot_, E'\r\n', E'\n'), E'\r', E'\n');
  preimage := '[2,{"sourceId":' || pg_catalog.to_json(source_id_)::text
    || ',"contentItemId":' || pg_catalog.to_json(content_item_id_)::text
    || ',"contentItemVersion":' || content_item_version_::text
    || ',"representationId":' || pg_catalog.to_json(representation_id_)::text
    || ',"representationVersion":' || representation_version_::text
    || ',"identityProfileId":' || pg_catalog.to_json(identity_profile_id_)::text
    || ',"identityProfileVersion":' || identity_profile_version_::text
    || ',"canonicalUrl":' || pg_catalog.to_json(canonical_url_)::text
    || ',"contentType":' || pg_catalog.to_json(content_type_)::text
    || '},' || pg_catalog.to_json(normalized)::text || ']';
  return pg_catalog.encode(extensions.digest(
    pg_catalog.convert_to('jetnity:official-truth:source-fingerprint:v2', 'UTF8')
      || pg_catalog.decode('00', 'hex')
      || pg_catalog.convert_to(preimage, 'UTF8'),
    'sha256'
  ), 'hex');
end;
$fn$;

create function private.official_truth_evidence_version_v2(body jsonb)
returns text language plpgsql immutable set search_path = '' as $fn$
declare preimage text;
begin
  preimage := '{"identitySchema":2'
    || ',"sourceId":' || pg_catalog.to_json(body ->> 'source_id')::text
    || ',"contentItemId":' || pg_catalog.to_json(body ->> 'content_item_id')::text
    || ',"contentItemVersion":' || (body ->> 'content_item_version')
    || ',"representationId":' || pg_catalog.to_json(body ->> 'representation_id')::text
    || ',"representationVersion":' || (body ->> 'representation_version')
    || ',"identityProfileId":' || pg_catalog.to_json(body ->> 'identity_profile_id')::text
    || ',"identityProfileVersion":' || (body ->> 'identity_profile_version')
    || ',"lookupKey":' || pg_catalog.to_json(body ->> 'lookup_key')::text
    || ',"canonicalUrl":' || pg_catalog.to_json(body ->> 'canonical_url')::text
    || ',"contentType":' || pg_catalog.to_json(body ->> 'content_type')::text
    || ',"sourceContentHash":' || pg_catalog.to_json(body ->> 'source_content_hash')::text
    || ',"retrievedAt":' || pg_catalog.to_json(body ->> 'retrieved_at')::text
    || ',"validFrom":' || case when pg_catalog.jsonb_typeof(body -> 'valid_from') = 'null'
      then 'null' else pg_catalog.to_json(body ->> 'valid_from')::text end
    || ',"validUntil":' || case when pg_catalog.jsonb_typeof(body -> 'valid_until') = 'null'
      then 'null' else pg_catalog.to_json(body ->> 'valid_until')::text end
    || ',"sourceFingerprintProtocol":2}';
  return 'ev2_' || pg_catalog.substr(pg_catalog.encode(
    extensions.digest(pg_catalog.convert_to(preimage, 'UTF8'), 'sha256'), 'hex'
  ), 1, 32);
end;
$fn$;

create function private.official_truth_v2_fingerprint_receipt_before_insert()
returns trigger language plpgsql set search_path = '' as $fn$
begin
  if exists (
    select 1 from private.official_truth_v2_fingerprint_receipts r
    where (r.backend_pid, r.transaction_id, r.version_id)
      = (pg_catalog.pg_backend_pid(), pg_catalog.pg_current_xact_id(), new.version_id)
    for update
  ) then
    delete from private.official_truth_v2_fingerprint_receipts r
    where (r.backend_pid, r.transaction_id, r.version_id)
      = (pg_catalog.pg_backend_pid(), pg_catalog.pg_current_xact_id(), new.version_id);
    new.source_fingerprint_protocol := 2;
  else
    new.source_fingerprint_protocol := 1;
  end if;
  return new;
end;
$fn$;
create trigger official_truth_v2_fingerprint_receipt
  before insert on private.official_evidence_versions
  for each row execute function private.official_truth_v2_fingerprint_receipt_before_insert();

create function public.official_truth_store_accepted_fingerprint_v2(payload jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $fn$
declare
  body jsonb;
  legacy_payload jsonb;
  source_snapshot text;
  fingerprint text;
  version_id_ text;
  stored_protocol smallint;
  response jsonb;
begin
  if pg_catalog.jsonb_typeof(payload) is distinct from 'object'
    or (select pg_catalog.count(*) from pg_catalog.jsonb_object_keys(payload)) <> 3
    or not (payload ?& array['operation', 'evidence', 'source_snapshot'])
    or payload ->> 'operation' is distinct from 'accepted_evidence'
    or pg_catalog.jsonb_typeof(payload -> 'evidence') is distinct from 'object'
    or pg_catalog.jsonb_typeof(payload -> 'source_snapshot') is distinct from 'string' then
    raise exception 'invalid fingerprint v2 payload' using errcode = '22023';
  end if;
  body := payload -> 'evidence';
  source_snapshot := payload ->> 'source_snapshot';
  if pg_catalog.jsonb_typeof(body -> 'source_fingerprint_protocol') is distinct from 'number'
    or body -> 'source_fingerprint_protocol' <> '2'::jsonb then
    raise exception 'unsupported fingerprint protocol' using errcode = '22023';
  end if;
  legacy_payload := pg_catalog.jsonb_build_object(
    'operation', 'accepted_evidence',
    'evidence', body - 'source_fingerprint_protocol'
  );
  if (select pg_catalog.count(*) from pg_catalog.jsonb_object_keys(body))
    <> (select pg_catalog.count(*) from pg_catalog.jsonb_object_keys(legacy_payload -> 'evidence')) + 1 then
    raise exception 'invalid fingerprint evidence shape' using errcode = '22023';
  end if;
  perform private.official_store_payload_check_v2(legacy_payload);

  -- Preserve the existing lock order used by the V1-compatible writer.
  lock table private.official_sources, private.official_source_domains,
    private.official_source_blocked_domains, private.official_content_items,
    private.official_content_item_versions, private.official_content_representations,
    private.official_content_url_reservations, private.official_content_representation_urls in share mode;
  lock table private.official_evidence_versions, private.official_rule_claims,
    private.official_rule_claim_support in share row exclusive mode;
  lock table private.official_source_fingerprint_protocols in share mode;
  perform private.official_store_eligibility_v2(legacy_payload);

  if not exists (
    select 1 from private.official_source_fingerprint_protocols p
    join private.official_content_representations r using (
      source_id, content_item_id, content_item_version, representation_id,
      representation_version, identity_profile_id, identity_profile_version
    )
    join private.official_content_item_versions i using (source_id, content_item_id, content_item_version)
    where (p.source_id, p.content_item_id, p.content_item_version, p.representation_id,
      p.representation_version, p.identity_profile_id, p.identity_profile_version,
      p.canonical_url, p.content_type, p.max_bytes)
      = (body ->> 'source_id', body ->> 'content_item_id', (body ->> 'content_item_version')::integer,
        body ->> 'representation_id', (body ->> 'representation_version')::integer,
        body ->> 'identity_profile_id', (body ->> 'identity_profile_version')::integer,
        body ->> 'canonical_url', body ->> 'content_type', 131072)
      and r.current and i.current
  ) then
    raise exception 'fingerprint profile is not approved' using errcode = '23514';
  end if;

  fingerprint := private.official_truth_source_fingerprint_v2(
    body ->> 'source_id', body ->> 'content_item_id', (body ->> 'content_item_version')::integer,
    body ->> 'representation_id', (body ->> 'representation_version')::integer,
    body ->> 'identity_profile_id', (body ->> 'identity_profile_version')::integer,
    body ->> 'canonical_url', body ->> 'content_type', source_snapshot
  );
  if fingerprint is null or fingerprint is distinct from body ->> 'source_content_hash' then
    raise exception 'source fingerprint verification failed' using errcode = '23514';
  end if;
  version_id_ := private.official_truth_evidence_version_v2(body);
  if version_id_ is distinct from body ->> 'version_id' then
    raise exception 'fingerprint Evidence identity verification failed' using errcode = '23514';
  end if;

  select source_fingerprint_protocol into stored_protocol
  from private.official_evidence_versions
  where version_id = body ->> 'version_id'
  for update;
  if found and stored_protocol <> 2 then
    raise exception 'fingerprint protocol identity collision' using errcode = '23505';
  end if;

  insert into private.official_truth_v2_fingerprint_receipts(backend_pid, transaction_id, version_id)
  values (pg_catalog.pg_backend_pid(), pg_catalog.pg_current_xact_id(), version_id_);
  response := public.official_truth_store_accepted_v2(legacy_payload);
  delete from private.official_truth_v2_fingerprint_receipts
  where (backend_pid, transaction_id, version_id)
    = (pg_catalog.pg_backend_pid(), pg_catalog.pg_current_xact_id(), version_id_);
  return response || pg_catalog.jsonb_build_object('source_fingerprint_protocol', 2);
end;
$fn$;

revoke all on function private.official_truth_source_fingerprint_v2(text,text,integer,text,integer,text,integer,text,text,text)
  from public, anon, authenticated, service_role;
revoke all on function private.official_truth_evidence_version_v2(jsonb)
  from public, anon, authenticated, service_role;
revoke all on function private.official_truth_v2_fingerprint_receipt_before_insert()
  from public, anon, authenticated, service_role;
revoke all on function private.official_truth_fingerprint_profile_immutable_v2()
  from public, anon, authenticated, service_role;
revoke all on function public.official_truth_store_accepted_fingerprint_v2(jsonb)
  from public, anon, authenticated, service_role;
grant execute on function public.official_truth_store_accepted_fingerprint_v2(jsonb) to service_role;

comment on column private.official_evidence_versions.source_fingerprint_protocol is
  'Immutable source fingerprint protocol discriminator; existing rows default to legacy v1.';
comment on table private.official_source_fingerprint_protocols is
  'Owner-gated exact protocol-v2 source profile pins. Empty until separately approved; no runtime registration RPC.';
comment on function public.official_truth_store_accepted_fingerprint_v2(jsonb) is
  'Verifies complete source-bound v2 fingerprint and Evidence identity before invoking the existing immutable accepted-Evidence writer. No HTTP/legal source truth claim.';

commit;
