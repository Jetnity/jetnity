-- UNAPPLIED candidate. Synthetic native proof only; no hosted apply/activation.
-- Dependencies: the unchanged canonical Evidence/Claim/catalog migrations,
-- #1142 owner-session candidate and provenance Layout 2. No admission is seeded.
begin;
create role ot_accepted_trip_exec nologin noinherit nosuperuser nobypassrls nocreatedb nocreaterole noreplication;
create schema official_accepted_trip_private authorization postgres;
revoke all on schema official_accepted_trip_private from public, anon, authenticated, service_role;
grant usage on schema official_accepted_trip_private to ot_accepted_trip_exec, ot_provenance_read_exec;

create table official_accepted_trip_private.admissions (
  cell text primary key check (cell ~ '^[a-z][a-z0-9._-]{0,127}$'),
  contract_digest text not null check (contract_digest ~ '^[a-f0-9]{64}$'),
  code_digest text not null check (code_digest ~ '^[a-f0-9]{64}$'),
  profile text not null check (profile = 'ot-accepted-store-trip-closure-v1'),
  scope_key text not null unique check (scope_key ~ '^rule-scope:v1:[a-f0-9]{64}$'),
  scope jsonb not null check (jsonb_typeof(scope) = 'object'),
  source_binding jsonb not null check (jsonb_typeof(source_binding) = 'object'),
  key_id text not null check (key_id ~ '^[a-z][a-z0-9._-]{0,127}$'),
  key_policy_digest text not null check (key_policy_digest ~ '^[a-f0-9]{64}$'),
  witness_domain text not null check (witness_domain ~ '^[a-z][a-z0-9._-]{0,127}$'),
  seed_hash text not null check (seed_hash ~ '^[a-f0-9]{64}$'),
  source_max_age_seconds integer not null check (source_max_age_seconds between 1 and 300),
  retention_seconds integer not null check (retention_seconds between 1 and 3600),
  display_seconds integer not null check (display_seconds between 1 and 15)
);
create table official_accepted_trip_private.heads (
  cell text primary key references official_accepted_trip_private.admissions,
  sequence bigint not null check (sequence between 0 and 256),
  hash text not null check (hash ~ '^[a-f0-9]{64}$'),
  witnessed_sequence bigint not null check (witnessed_sequence between 0 and sequence),
  witnessed_hash text not null check (witnessed_hash ~ '^[a-f0-9]{64}$'),
  check(sequence-witnessed_sequence between 0 and 1)
);
create table official_accepted_trip_private.reservations (
  token uuid primary key default gen_random_uuid(), operation_id uuid not null unique default gen_random_uuid(),
  cell text not null references official_accepted_trip_private.admissions,
  purpose text not null check (purpose in ('publish','read')),
  user_id uuid not null, session_id uuid not null, original_expiry timestamptz not null,
  created_at timestamptz not null, expires_at timestamptz not null,
  state text not null check (state in ('reserved','prepared','snapshotted','finalized')),
  prior_sequence bigint not null, prior_hash text not null, prior_version text,
  trip_id uuid, trip_revision bigint, graph_digest text,
  prepared_digest text, catalog_digest text,
  result jsonb,
  check ((purpose='read') = (trip_id is not null and trip_revision is not null and graph_digest is not null)),
  check (created_at < expires_at and expires_at <= original_expiry and expires_at <= created_at + interval '45 seconds')
);
create table official_accepted_trip_private.stages (
  operation_id uuid primary key references official_accepted_trip_private.reservations(operation_id) on delete cascade,
  kind text not null check (kind in ('accept','withdraw','conflict')),
  manifest jsonb not null check (jsonb_typeof(manifest)='object' and octet_length(manifest::text) <= 12582912),
  digest text not null check (digest ~ '^[a-f0-9]{64}$')
);
create table official_accepted_trip_private.versions (
  receipt text primary key references official_provenance_private.receipts(record_fingerprint),
  cell text not null references official_accepted_trip_private.admissions,
  previous_receipt text references official_accepted_trip_private.versions(receipt),
  operation_id uuid not null unique,
  profile text not null check (profile='ot-accepted-store-trip-closure-v1'),
  contract_digest text not null, code_digest text not null,
  claim_id bigint not null references private.official_rule_claims,
  accepted_at timestamptz not null,
  manifest jsonb not null check (jsonb_typeof(manifest)='object'),
  legacy_projection jsonb not null check (jsonb_typeof(legacy_projection)='object'),
  legacy_evidence jsonb not null check (jsonb_typeof(legacy_evidence)='object')
);
create table official_accepted_trip_private.version_supports (
  receipt text not null references official_accepted_trip_private.versions,
  position integer not null check (position=0),
  evidence_version text not null references private.official_evidence_versions(version_id),
  original_pin jsonb not null,
  primary key(receipt,position), unique(receipt,evidence_version)
);
create table official_accepted_trip_private.originals (
  receipt text primary key references official_accepted_trip_private.versions,
  metadata jsonb not null check (jsonb_typeof(metadata)='object'),
  expires_at timestamptz not null
);
create table official_accepted_trip_private.ciphertexts (
  receipt text primary key references official_accepted_trip_private.originals,
  envelope jsonb not null check (jsonb_typeof(envelope)='object' and octet_length(envelope::text) <= 90000)
);
create table official_accepted_trip_private.current_versions (
  cell text primary key references official_accepted_trip_private.admissions,
  receipt text not null references official_accepted_trip_private.versions,
  status text not null check (status in ('accepted','withdrawn','conflicted'))
);
-- Nonpersonal committed journal survives reservation/stage cleanup. No user,
-- session, Trip, raw original or key is retained here or in accepted history.
create table official_accepted_trip_private.operations (
  operation_id uuid primary key, cell text not null references official_accepted_trip_private.admissions,
  kind text not null check(kind in ('accept','withdraw','conflict')),
  receipt text not null references official_accepted_trip_private.versions,
  prior_sequence bigint not null, prior_hash text not null,
  sequence bigint not null, hash text not null,
  contract_digest text not null, profile text not null check(profile='ot-accepted-store-trip-closure-v1'),
  stage_digest text not null, publication_digest text not null, decision_manifest jsonb, committed_at timestamptz not null,
  unique(cell,sequence), unique(cell,hash), check(sequence=prior_sequence+1)
);
create table official_accepted_trip_private.witness_acknowledgements (
  operation_id uuid primary key references official_accepted_trip_private.operations,
  sequence bigint not null, hash text not null, observed_at timestamptz not null
);

create function official_accepted_trip_private.require_v1(ok boolean) returns void
language plpgsql immutable set search_path='' as $$ begin
  if ok is distinct from true then raise exception 'accepted store unavailable' using errcode='22023'; end if;
end $$;
create function official_accepted_trip_private.object_v1(v jsonb, fields text[]) returns void
language plpgsql immutable set search_path='' as $$ begin
  perform official_accepted_trip_private.require_v1(jsonb_typeof(v)='object'
    and (select array_agg(k order by k) from jsonb_object_keys(v) k) = (select array_agg(k order by k) from unnest(fields) k));
end $$;
create function official_accepted_trip_private.hash_v1(v jsonb) returns text
language sql immutable strict set search_path='' as $$ select encode(sha256(convert_to(v::text,'UTF8')),'hex') $$;
create function official_accepted_trip_private.principal_v1(expected text) returns void
language plpgsql volatile set search_path='' as $$ declare claims jsonb; begin
  claims:=current_setting('request.jwt.claims',true)::jsonb;
  if current_setting('role',true) is distinct from expected or claims->>'role' is distinct from expected
    or current_setting('transaction_isolation') <> 'read committed' then
    raise exception 'accepted store authority unavailable' using errcode='42501';
  end if;
end $$;
create function official_accepted_trip_private.immutable_v1() returns trigger
language plpgsql set search_path='' as $$ begin raise exception 'accepted history immutable' using errcode='55000'; end $$;

create function official_accepted_trip_private.require_owner_v1() returns jsonb
language plpgsql volatile parallel unsafe security definer set search_path='' as $$
declare claims jsonb; uid uuid; sid uuid; expires timestamptz;
begin
  perform jetnity_ot_auth.require_current_owner_session_v1();
  claims:=auth.jwt(); uid:=auth.uid(); sid:=(claims->>'session_id')::uuid;
  select least(to_timestamp((claims->>'exp')::double precision),coalesce(s.not_after,'infinity'::timestamptz))
    into strict expires from auth.sessions s where s.id=sid and s.user_id=uid;
  return jsonb_build_object('uid',uid,'session',sid,'expiresAt',expires,'now',clock_timestamp());
end $$;
alter function official_accepted_trip_private.require_owner_v1() owner to postgres;

create function official_accepted_trip_private.lock_legacy_v1(publish boolean) returns jsonb
language plpgsql volatile parallel unsafe security definer set search_path='' as $$
declare catalog jsonb; projections jsonb; evidence_rows jsonb;
begin
  lock table private.official_sources, private.official_source_domains, private.official_source_blocked_domains,
    private.official_content_items, private.official_content_item_versions, private.official_content_representations,
    private.official_content_url_reservations, private.official_content_representation_urls,
    private.official_content_identity_profile_pins in share mode;
  if publish then
    lock table private.official_evidence_versions, private.official_rule_claims, private.official_rule_claim_support,
      private.official_rule_claim_requirement_effect in share row exclusive mode;
  else
    lock table private.official_evidence_versions, private.official_rule_claims, private.official_rule_claim_support,
      private.official_rule_claim_requirement_effect in share mode;
  end if;
  perform official_accepted_trip_private.require_v1((select count(*) from private.official_sources)<=128
    and (select count(*) from private.official_content_representations)<=512
    and (select count(*) from private.official_content_representation_urls)<=1024);
  catalog:=public.official_truth_source_catalog_v2('{"operation":"read_registry"}'::jsonb);
  catalog:=catalog||jsonb_build_object('acceptedStoreProfilePins',(select coalesce(jsonb_agg(to_jsonb(p) order by p.identity_profile_id,p.identity_profile_version),'[]') from private.official_content_identity_profile_pins p));
  select coalesce(jsonb_object_agg(c.claim_id::text,jsonb_build_object('claim',to_jsonb(c),'fact',to_jsonb(f),'supports',
    (select coalesce(jsonb_agg(to_jsonb(s) order by s.version_id),'[]') from private.official_rule_claim_support s where s.claim_id=c.claim_id))),'{}')
    into projections from private.official_rule_claims c join private.official_rule_claim_requirement_effect f using(claim_id)
    where exists(select 1 from official_accepted_trip_private.current_versions cv join official_accepted_trip_private.versions v on v.receipt=cv.receipt where v.claim_id=c.claim_id);
  perform official_accepted_trip_private.require_v1(octet_length(catalog::text)<=1048576 and octet_length(projections::text)<=1048576);
  select coalesce(jsonb_object_agg(e.version_id,to_jsonb(e)),'{}') into evidence_rows from private.official_evidence_versions e
    where exists(select 1 from official_accepted_trip_private.version_supports s where s.evidence_version=e.version_id);
  perform official_accepted_trip_private.require_v1(octet_length(evidence_rows::text)<=2097152);
  return jsonb_build_object('catalog',catalog,'projections',projections,'evidence',evidence_rows);
end $$;
alter function official_accepted_trip_private.lock_legacy_v1(boolean) owner to postgres;

create function official_accepted_trip_private.own_graph_v1(trip uuid) returns jsonb
language plpgsql volatile parallel unsafe security definer set search_path='' as $$
declare uid uuid; root public.trips%rowtype; graph jsonb; versions jsonb; n bigint;
begin
  uid:=auth.uid();
  if uid is null or auth.jwt()->>'role' is distinct from 'authenticated' then raise exception 'own trip unavailable' using errcode='42501'; end if;
  lock table public.trips, public.trip_stages, public.trip_days, public.trip_items, public.trip_readiness_items,
    public.trip_travellers, public.trip_traveller_citizenships, public.trip_traveller_documents in share mode;
  select * into root from public.trips t where t.id=trip and t.user_id=uid;
  if not found then raise exception 'own trip unavailable' using errcode='42501'; end if;
  select sum(c) into n from (
    select count(*) c from public.trip_stages t where t.trip_id=trip
    union all select count(*) from public.trip_days t where t.trip_id=trip
    union all select count(*) from public.trip_items t where t.trip_id=trip
    union all select count(*) from public.trip_readiness_items t where t.trip_id=trip
    union all select count(*) from public.trip_travellers t where t.trip_id=trip
    union all select count(*) from public.trip_traveller_citizenships t where t.trip_id=trip
    union all select count(*) from public.trip_traveller_documents t where t.trip_id=trip) q;
  perform official_accepted_trip_private.require_v1(n<=5999);
  -- Do not let mapper normalization hide foreign/missing nested membership.
  perform official_accepted_trip_private.require_v1(not exists(
    select 1 from public.trip_items i where i.trip_id=trip and (i.user_id<>uid or i.day_id is not null and not exists(select 1 from public.trip_days d where d.id=i.day_id and d.trip_id=trip and d.user_id=uid)))
    and not exists(select 1 from public.trip_traveller_citizenships c where c.trip_id=trip and (c.user_id<>uid or not exists(select 1 from public.trip_travellers t where t.id=c.traveller_id and t.trip_id=trip and t.user_id=uid)))
    and not exists(select 1 from public.trip_traveller_documents d where d.trip_id=trip and (d.user_id<>uid or not exists(select 1 from public.trip_travellers t where t.id=d.traveller_id and t.trip_id=trip and t.user_id=uid)
      or d.citizenship_id is not null and not exists(select 1 from public.trip_traveller_citizenships c where c.id=d.citizenship_id and c.traveller_id=d.traveller_id and c.trip_id=trip and c.user_id=uid))));
  graph:=to_jsonb(root)||jsonb_build_object(
    'trip_stages',(select coalesce(jsonb_agg(to_jsonb(t) order by t.id),'[]') from public.trip_stages t where t.trip_id=trip and t.user_id=uid),
    'trip_days',(select coalesce(jsonb_agg(to_jsonb(t) order by t.id),'[]') from public.trip_days t where t.trip_id=trip and t.user_id=uid),
    'trip_items',(select coalesce(jsonb_agg(to_jsonb(t) order by t.id),'[]') from public.trip_items t where t.trip_id=trip and t.user_id=uid),
    'trip_readiness_items',(select coalesce(jsonb_agg(to_jsonb(t) order by t.id),'[]') from public.trip_readiness_items t where t.trip_id=trip and t.user_id=uid),
    'trip_travellers',(select coalesce(jsonb_agg(to_jsonb(t)||jsonb_build_object(
      'trip_traveller_citizenships',(select coalesce(jsonb_agg(to_jsonb(c) order by c.id),'[]') from public.trip_traveller_citizenships c where c.traveller_id=t.id and c.trip_id=trip and c.user_id=uid),
      'trip_traveller_documents',(select coalesce(jsonb_agg(to_jsonb(d) order by d.id),'[]') from public.trip_traveller_documents d where d.traveller_id=t.id and d.trip_id=trip and d.user_id=uid)) order by t.id),'[]')
      from public.trip_travellers t where t.trip_id=trip and t.user_id=uid));
  select jsonb_agg(jsonb_build_array(kind,id,mvcc) order by kind,id) into versions from (
    select 'trips' kind,t.id::text id,t.xmin::text mvcc from public.trips t where t.id=trip and t.user_id=uid
    union all select 'stages',t.id::text,t.xmin::text from public.trip_stages t where t.trip_id=trip and t.user_id=uid
    union all select 'days',t.id::text,t.xmin::text from public.trip_days t where t.trip_id=trip and t.user_id=uid
    union all select 'items',t.id::text,t.xmin::text from public.trip_items t where t.trip_id=trip and t.user_id=uid
    union all select 'readiness',t.id::text,t.xmin::text from public.trip_readiness_items t where t.trip_id=trip and t.user_id=uid
    union all select 'travellers',t.id::text,t.xmin::text from public.trip_travellers t where t.trip_id=trip and t.user_id=uid
    union all select 'citizenships',t.id::text,t.xmin::text from public.trip_traveller_citizenships t where t.trip_id=trip and t.user_id=uid
    union all select 'documents',t.id::text,t.xmin::text from public.trip_traveller_documents t where t.trip_id=trip and t.user_id=uid) q;
  perform official_accepted_trip_private.require_v1(octet_length(graph::text)<=2097152 and jsonb_array_length(versions)=n+1);
  return jsonb_build_object('graph',graph,'revision',root.revision,'digest',official_accepted_trip_private.hash_v1(jsonb_build_array(graph,versions)));
end $$;
alter function official_accepted_trip_private.own_graph_v1(uuid) owner to postgres;

create function official_accepted_trip_private.read_archive_v1(fingerprint text) returns jsonb
language plpgsql volatile parallel unsafe security definer set search_path='' as $$
declare closure official_provenance_api.artifact_input_v1[]; result jsonb; receipt bytea; binding bytea;
begin
  if fingerprint !~ '^ot-provenance-v1:[a-f0-9]{64}$' then raise exception 'archive unavailable'; end if;
  perform official_provenance_private.verify_retained_v2(fingerprint);
  closure:=official_provenance_private.closure_v2(fingerprint);
  select r.canonical_payload_bytes,b.canonical_bytes into strict receipt,binding
    from official_provenance_private.receipts r join official_provenance_private.custody_bindings k using(record_fingerprint)
    join official_provenance_private.artifact_blobs b on b.digest=k.binding_digest
    where r.record_fingerprint=fingerprint and r.storage_contract_version=2;
  result:=jsonb_build_object('recordFingerprint',fingerprint,'receiptBase64',replace(encode(receipt,'base64'),E'\n',''),
    'custodyBindingBase64',replace(encode(binding,'base64'),E'\n',''),'artifacts',
    (select jsonb_agg(jsonb_build_object('pin',jsonb_build_object('id',a.artifact_id,'version',a.artifact_version,'digest',a.digest),
      'artifactType',a.artifact_type,'artifactContractVersion',a.artifact_contract_version,'canonicalBase64',replace(encode(a.canonical_bytes,'base64'),E'\n','')) order by a.artifact_id,a.artifact_version) from unnest(closure) a),
    'edges',jsonb_build_object('receipt',(select jsonb_agg(to_jsonb(d) order by d.root_slot) from official_provenance_private.receipt_dependencies d where d.record_fingerprint=fingerprint),
      'binding',(select jsonb_agg(to_jsonb(d) order by d.binding_slot) from official_provenance_private.custody_dependencies d where d.record_fingerprint=fingerprint),
      'artifacts',(select coalesce(jsonb_agg(to_jsonb(d) order by d.parent_id,d.parent_version,d.slot),'[]') from official_provenance_private.artifact_dependencies d join unnest(closure) a on (a.artifact_id,a.artifact_version,a.digest)=(d.parent_id,d.parent_version,d.parent_digest))));
  if octet_length(result::text)>12582912 then raise exception 'archive bound'; end if;
  return result;
end $$;
alter function official_accepted_trip_private.read_archive_v1(text) owner to ot_provenance_read_exec;

create function official_accepted_trip_private.scope_columns_v1(s jsonb) returns jsonb
language sql immutable set search_path='' as $$ select jsonb_build_object(
  'destination_country_code',s->'destinationCountryCode','transit_country_code',s->'transitCountryCode',
  'citizenship_mode',s#>'{citizenship,mode}','citizenship_country_codes',s#>'{citizenship,countryCodes}',
  'credential_option_mode',s#>'{credentialOption,mode}','document_type',s#>'{credentialOption,documentType}',
  'issuing_country_code',s#>'{credentialOption,issuingCountryCode}','related_citizenship_country_code',s#>'{credentialOption,relatedCitizenshipCountryCode}',
  'residence_mode',s#>'{residence,mode}','residence_country_code',null,'requirement_type',s->'requirementType',
  'validity_mode',s#>'{validity,mode}','travel_date',s#>'{validity,travelDate}') $$;

create function official_accepted_trip_private.accept_binding_v1(m jsonb, a official_accepted_trip_private.admissions) returns void
language plpgsql immutable set search_path='' as $$
declare p jsonb; e jsonb:=m->'evidence'; c jsonb:=m->'claim'; custody jsonb; observation jsonb; v jsonb; item jsonb; n integer;
begin
  perform official_accepted_trip_private.object_v1(e,array['sourceId','contentItemId','contentItemVersion','representationId','representationVersion',
    'identityProfileId','identityProfileVersion','identitySchema','lookupKey','canonicalUrl','contentType','sourceContentHash','retrievedAt','validFrom','validUntil',
    'versionId','previousVersionId','lifecycle','validationState','sourceClass','authorityName','publisherName','scope','extractionNote']);
  perform official_accepted_trip_private.object_v1(c,array['lifecycle','validationState','scope','key','factKind','evidenceQuality','supportVersionIds','fact']);
  p:=convert_from(decode(m#>>'{archive,receiptBase64}','base64'),'UTF8')::jsonb;
  perform official_accepted_trip_private.require_v1(p#>'{globalCell,scope}'=a.scope and p#>>'{globalCell,ruleScopeKey}'=a.scope_key
    and c->>'key'=a.scope_key and c->'scope'=a.scope and (e->'scope')-'sourceId'=a.scope
    and e#>>'{scope,sourceId}'=e->>'sourceId' and e->>'sourceId'=a.source_binding->>'sourceId'
    and c->>'factKind'='requirement_effect' and p#>>'{candidate,factKind}'='requirement_effect'
    and p#>>'{candidate,requirementType}'='visa' and p#>'{candidate,fact}'=c->'fact'
    and p->>'evidenceQuality'='explicit_primary_statement' and c->>'evidenceQuality'=p->>'evidenceQuality'
    and p#>>'{proof,reviewPacketKey}'=m->>'reviewPacketKey' and c->'supportVersionIds'=jsonb_build_array(e->>'versionId')
    and jsonb_array_length(p->'supports')=1 and p#>'{supports,0}'=jsonb_build_object('versionId',e->>'versionId','identitySchema',2,
      'binding',a.source_binding,'canonicalFinalUrl',e->>'canonicalUrl','contentType',e->>'contentType','sourceContentHash',e->>'sourceContentHash',
      'acceptedRetrievedAt',e->>'retrievedAt','validFrom',e->'validFrom','validUntil',e->'validUntil',
      'freshRetrieval',jsonb_build_object('requestUrl',p#>>'{supports,0,freshRetrieval,requestUrl}','completedAt',e->>'retrievedAt')));
  n:=0;
  for item in select value from jsonb_array_elements(m#>'{archive,artifacts}') loop
    perform official_accepted_trip_private.object_v1(item,array['pin','artifactType','artifactContractVersion','canonicalBase64']);
    perform official_accepted_trip_private.object_v1(item->'pin',array['id','version','digest']);
    perform official_accepted_trip_private.require_v1(item#>>'{pin,id}' ~ '^[a-z][a-z0-9._-]{0,127}$'
      and jsonb_typeof(item#>'{pin,version}')='number' and (item#>>'{pin,version}')::bigint between 1 and 9007199254740991
      and item#>>'{pin,digest}' ~ '^[a-f0-9]{64}$' and item->'artifactContractVersion'='1'::jsonb
      and octet_length(decode(item->>'canonicalBase64','base64')) between 1 and 1048576
      and replace(encode(decode(item->>'canonicalBase64','base64'),'base64'),E'\n','')=item->>'canonicalBase64');
    if item->'pin'=m#>'{metadata,originalPin}' then
      perform official_accepted_trip_private.require_v1(item->>'artifactType'='AcceptedEvidenceCustodyV1');
      custody:=convert_from(decode(item->>'canonicalBase64','base64'),'UTF8')::jsonb; n:=n+1;
    end if;
  end loop;
  perform official_accepted_trip_private.require_v1(n=1 and custody->>'kind'='AcceptedEvidenceCustodyV1'
    and custody#>'{value,evidenceScope}'=e->'scope' and custody#>'{value,evidenceIdentity}'=
      e-array['previousVersionId','lifecycle','validationState','sourceClass','authorityName','publisherName','scope','extractionNote']);
  n:=0;
  for item in select value from jsonb_array_elements(m#>'{archive,artifacts}') loop
    if item->'pin'=custody#>'{value,observation}' then
      perform official_accepted_trip_private.require_v1(item->>'artifactType'='original_observation');
      observation:=convert_from(decode(item->>'canonicalBase64','base64'),'UTF8')::jsonb; n:=n+1;
    end if;
  end loop;
  v:=observation->'content';
  perform official_accepted_trip_private.require_v1(n=1 and v->'binding'=a.source_binding
    and v->>'startedAt'=m->>'originalStartedAt' and v->>'completedAt'=e->>'retrievedAt'
    and v->>'canonicalFinalUrl'=e->>'canonicalUrl' and v->>'contentType'=e->>'contentType'
    and v->>'sourceContentHash'=e->>'sourceContentHash' and v->>'requestUrl'=p#>>'{supports,0,freshRetrieval,requestUrl}');
end $$;

create function official_accepted_trip_private.publish_legacy_v1(operation uuid) returns jsonb
language plpgsql volatile parallel unsafe security definer set search_path='' as $$
declare r official_accepted_trip_private.reservations%rowtype; a official_accepted_trip_private.admissions%rowtype;
  m jsonb; e jsonb; c jsonb; f jsonb; sc jsonb; p jsonb; prior official_accepted_trip_private.versions%rowtype;
  claim bigint; accepted timestamptz:=date_trunc('milliseconds',clock_timestamp()); ignored jsonb; support_written bigint;
begin
  select * into strict r from official_accepted_trip_private.reservations where operation_id=operation and purpose='publish' and state='prepared';
  select * into strict a from official_accepted_trip_private.admissions where cell=r.cell;
  select manifest into strict m from official_accepted_trip_private.stages where operation_id=operation and kind='accept';
  e:=m->'evidence'; c:=m->'claim'; f:=c->'fact'; sc:=official_accepted_trip_private.scope_columns_v1(a.scope);
  perform official_accepted_trip_private.accept_binding_v1(m,a);
  perform official_accepted_trip_private.require_v1(c->>'key'=a.scope_key and c->'scope'=a.scope and (e->'scope')-'sourceId'=a.scope and e#>>'{scope,sourceId}'=e->>'sourceId'
    and c->>'factKind'='requirement_effect' and c->>'evidenceQuality'='explicit_primary_statement'
    and c->>'lifecycle'='accepted' and c->>'validationState'='valid'
    and c->'supportVersionIds'=jsonb_build_array(e->>'versionId'));
  perform official_accepted_trip_private.object_v1(f,array['kind','effect','visaMode']);
  perform official_accepted_trip_private.require_v1(f->>'kind'='requirement_effect' and f->>'effect' in ('required','not_required')
    and f->>'visaMode' in ('visa_exempt','visa_on_arrival','electronic_visa','visa_before_travel','unknown'));
  select claim_id into claim from private.official_rule_claims where rule_scope_key=a.scope_key and fact_kind='requirement_effect';
  if r.prior_version is null then
    -- An unrelated older/unbound canonical row is never adopted.
    perform official_accepted_trip_private.require_v1(claim is null);
  else
    select * into strict prior from official_accepted_trip_private.versions where receipt=r.prior_version and cell=r.cell;
    select jsonb_build_object('claim',to_jsonb(cc),'fact',to_jsonb(ff),'supports',
      (select coalesce(jsonb_agg(to_jsonb(ss) order by ss.version_id),'[]') from private.official_rule_claim_support ss where ss.claim_id=cc.claim_id))
      into p from private.official_rule_claims cc join private.official_rule_claim_requirement_effect ff using(claim_id) where cc.claim_id=prior.claim_id;
    perform official_accepted_trip_private.require_v1(claim=prior.claim_id and p=prior.legacy_projection);
  end if;
  ignored:=public.official_truth_store_accepted_v2(jsonb_build_object('operation','accepted_evidence','evidence',sc||jsonb_build_object(
    'identity_schema',e->'identitySchema','content_item_id',e->'contentItemId','content_item_version',e->'contentItemVersion',
    'representation_id',e->'representationId','representation_version',e->'representationVersion','identity_profile_id',e->'identityProfileId',
    'identity_profile_version',e->'identityProfileVersion','content_type',e->'contentType','version_id',e->'versionId',
    'previous_version_id',e->'previousVersionId','lifecycle',e->'lifecycle','validation_state',e->'validationState','source_id',e->'sourceId',
    'canonical_url',e->'canonicalUrl','retrieved_at',e->'retrievedAt','source_content_hash',e->'sourceContentHash',
    'valid_from',e->'validFrom','valid_until',e->'validUntil','lookup_key',e->'lookupKey','extraction_note',e->'extractionNote','rule_scope_key',a.scope_key)));
  perform official_accepted_trip_private.require_v1(ignored->>'ok'='true');
  if r.prior_version is null then
    ignored:=public.official_truth_store_accepted_v2(jsonb_build_object('operation','accepted_rule_claim','accepted_at',to_char(accepted at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
      'claim',sc||jsonb_build_object('rule_scope_key',a.scope_key,'fact_kind','requirement_effect','evidence_quality','explicit_primary_statement',
        'lifecycle','accepted','validation_state','valid','support_version_ids',c->'supportVersionIds',
        'fact',jsonb_build_object('effect',f->>'effect','visa_mode',f->>'visaMode'))));
    perform official_accepted_trip_private.require_v1(ignored->>'ok'='true');
    select claim_id into strict claim from private.official_rule_claims where rule_scope_key=a.scope_key and fact_kind='requirement_effect';
  else
    -- The complete prior payload is already immutable in prior.manifest and
    -- prior.legacy_projection. Only these approved current columns change.
    set constraints private.official_rule_claims_fact_payload,
      private.official_rule_claim_requirement_effect_fact_payload,
      private.official_rule_claims_support_count_v2,
      private.official_rule_support_count_v2 deferred;
    update private.official_rule_claims set accepted_at=accepted where claim_id=claim;
    update private.official_rule_claim_requirement_effect set effect=f->>'effect',visa_mode=f->>'visaMode' where claim_id=claim;
    delete from private.official_rule_claim_support where claim_id=claim;
    insert into private.official_rule_claim_support(identity_schema,content_item_id,content_item_version,
      representation_id,representation_version,identity_profile_id,identity_profile_version,content_type,
      claim_id,rule_scope_key,version_id,source_id,evidence_lifecycle,evidence_validation_state,source_class)
    select ev.identity_schema,ev.content_item_id,ev.content_item_version,ev.representation_id,ev.representation_version,
      ev.identity_profile_id,ev.identity_profile_version,ev.content_type,
      claim,a.scope_key,ev.version_id,ev.source_id,ev.lifecycle,ev.validation_state,src.source_class
    from private.official_evidence_versions ev join private.official_sources src on src.source_id=ev.source_id
    where ev.version_id=e->>'versionId' and ev.rule_scope_key=a.scope_key and ev.source_id=e->>'sourceId'
      and ev.identity_schema=(e->>'identitySchema')::integer and ev.content_item_id=e->>'contentItemId'
      and ev.content_item_version=(e->>'contentItemVersion')::integer and ev.representation_id=e->>'representationId'
      and ev.representation_version=(e->>'representationVersion')::integer and ev.identity_profile_id=e->>'identityProfileId'
      and ev.identity_profile_version=(e->>'identityProfileVersion')::integer and ev.content_type=e->>'contentType'
      and ev.lifecycle=e->>'lifecycle' and ev.validation_state=e->>'validationState' and src.source_class='official_authority';
    get diagnostics support_written=row_count;
    perform official_accepted_trip_private.require_v1(support_written=1);
    -- PG16 fires deferred invoker checks as the currently active principal.
    -- Complete these four legacy checks here; the outer final guard still
    -- follows its unchanged ALL IMMEDIATE validation of the full publication.
    set constraints private.official_rule_claims_fact_payload,
      private.official_rule_claim_requirement_effect_fact_payload,
      private.official_rule_claims_support_count_v2,
      private.official_rule_support_count_v2 immediate;
  end if;
  select jsonb_build_object('claim',to_jsonb(cc),'fact',to_jsonb(ff),'supports',
    (select jsonb_agg(to_jsonb(ss) order by ss.version_id) from private.official_rule_claim_support ss where ss.claim_id=cc.claim_id))
    into strict p from private.official_rule_claims cc join private.official_rule_claim_requirement_effect ff using(claim_id) where cc.claim_id=claim;
  return jsonb_build_object('claimId',claim,'acceptedAt',accepted,'projection',p,'evidence',
    (select to_jsonb(ev) from private.official_evidence_versions ev where ev.version_id=e->>'versionId'));
end $$;
alter function official_accepted_trip_private.publish_legacy_v1(uuid) owner to postgres;

create function official_accepted_trip_private.reservation_v1(token_ uuid) returns official_accepted_trip_private.reservations
language plpgsql volatile set search_path='' as $$ declare r official_accepted_trip_private.reservations%rowtype; begin
  select * into strict r from official_accepted_trip_private.reservations where token=token_ for update;
  perform official_accepted_trip_private.require_v1(clock_timestamp()<r.expires_at and clock_timestamp()<r.original_expiry and r.state<>'finalized');
  return r;
end $$;

create function official_accepted_trip_private.publication_v1(receipt_ text) returns jsonb
language plpgsql volatile set search_path='' as $$ declare v official_accepted_trip_private.versions%rowtype; a official_accepted_trip_private.admissions%rowtype;
  archive jsonb; original jsonb; envelope jsonb; reconstructed jsonb; staged text; publication text;
begin
  select * into strict v from official_accepted_trip_private.versions where receipt=receipt_;
  select * into strict a from official_accepted_trip_private.admissions where cell=v.cell;
  archive:=official_accepted_trip_private.read_archive_v1(receipt_)-'edges';
  select metadata into strict original from official_accepted_trip_private.originals where receipt=receipt_;
  select c.envelope into strict envelope from official_accepted_trip_private.ciphertexts c where receipt=receipt_;
  perform official_accepted_trip_private.require_v1(v.manifest->'metadata'=original and original->>'receiptFingerprint'=receipt_
    and original->>'operationId'=v.operation_id::text and v.manifest->>'profile'=v.profile
    and v.manifest->>'contractDigest'=v.contract_digest and v.manifest->>'codeDigest'=v.code_digest
    and (v.legacy_projection#>>'{claim,accepted_at}')::timestamptz=v.accepted_at
    and (v.legacy_projection#>>'{claim,claim_id}')::bigint=v.claim_id
    and v.legacy_evidence->>'version_id'=v.manifest#>>'{evidence,versionId}'
    and (select expires_at from official_accepted_trip_private.originals where receipt=receipt_)=(original->>'retainUntil')::timestamptz
    and (select jsonb_agg(jsonb_build_object('version',s.evidence_version,'pin',s.original_pin) order by s.position)
      from official_accepted_trip_private.version_supports s where s.receipt=receipt_)
      =jsonb_build_array(jsonb_build_object('version',v.manifest#>>'{evidence,versionId}','pin',original->'originalPin')));
  reconstructed:=v.manifest||jsonb_build_object('archive',archive,'ciphertext',envelope);
  perform official_accepted_trip_private.accept_binding_v1(reconstructed,a);
  staged:=official_accepted_trip_private.hash_v1(jsonb_build_object('kind','accept','manifest',reconstructed));
  publication:=official_accepted_trip_private.hash_v1(jsonb_build_object('stageDigest',staged,'acceptedAt',v.accepted_at,
    'projection',v.legacy_projection,'evidenceRow',v.legacy_evidence,'previousReceipt',v.previous_receipt,'profile',v.profile,'contractDigest',v.contract_digest,'codeDigest',v.code_digest));
  return jsonb_build_object('stageDigest',staged,'publicationDigest',publication);
end $$;

create function official_accepted_trip_private.journal_v1(cell_ text, legacy jsonb) returns void
language plpgsql volatile set search_path='' as $$
declare a official_accepted_trip_private.admissions%rowtype; h official_accepted_trip_private.heads%rowtype;
  op official_accepted_trip_private.operations%rowtype; v official_accepted_trip_private.versions%rowtype;
  sequence_ bigint:=0; hash_ text; receipt_ text; status_ text; publication jsonb; expected text;
  publications jsonb:='{}'; cv official_accepted_trip_private.current_versions%rowtype;
begin
  select * into strict a from official_accepted_trip_private.admissions where cell=cell_;
  select * into strict h from official_accepted_trip_private.heads where cell=cell_;
  hash_:=a.seed_hash;
  perform official_accepted_trip_private.require_v1(h.sequence-h.witnessed_sequence between 0 and 1);
  perform official_accepted_trip_private.require_v1((select count(*) from official_accepted_trip_private.operations where cell=cell_)<=256);
  for op in select * from official_accepted_trip_private.operations where cell=cell_ order by sequence loop
    perform official_accepted_trip_private.require_v1(op.prior_sequence=sequence_ and op.prior_hash=hash_ and op.sequence=sequence_+1
      and op.contract_digest=a.contract_digest and op.profile=a.profile);
    if op.kind='accept' then
      perform official_accepted_trip_private.require_v1(status_ is null or status_='accepted');
      select * into strict v from official_accepted_trip_private.versions where receipt=op.receipt and cell=cell_;
      perform official_accepted_trip_private.require_v1(v.operation_id=op.operation_id and v.previous_receipt is not distinct from receipt_
        and op.decision_manifest is null and v.profile=op.profile and v.contract_digest=op.contract_digest
        and legacy#>array['evidence',v.manifest#>>'{evidence,versionId}']=v.legacy_evidence);
      publication:=official_accepted_trip_private.publication_v1(op.receipt);
      perform official_accepted_trip_private.require_v1(publication->>'stageDigest'=op.stage_digest and publication->>'publicationDigest'=op.publication_digest);
      publications:=publications||jsonb_build_object(op.receipt,op.publication_digest);
      receipt_:=op.receipt; status_:='accepted';
    else
      perform official_accepted_trip_private.require_v1(receipt_=op.receipt and (status_='accepted' or status_='conflicted' and op.kind='withdraw')
        and op.decision_manifest->>'observedVersion'=receipt_
        and official_accepted_trip_private.hash_v1(jsonb_build_object('kind',op.kind,'manifest',op.decision_manifest))=op.stage_digest);
      expected:=official_accepted_trip_private.hash_v1(jsonb_build_object('kind',op.kind,'stageDigest',op.stage_digest,'versionPublicationDigest',publications->>receipt_));
      perform official_accepted_trip_private.require_v1(expected=op.publication_digest);
      status_:=case op.kind when 'withdraw' then 'withdrawn' else 'conflicted' end;
    end if;
    expected:=official_accepted_trip_private.hash_v1(jsonb_build_object('operationId',op.operation_id,'cell',cell_,'kind',op.kind,
      'receipt',op.receipt,'priorSequence',op.prior_sequence,'priorHash',op.prior_hash,'sequence',op.sequence,
      'contractDigest',op.contract_digest,'profile',op.profile,'stageDigest',op.stage_digest,'publicationDigest',op.publication_digest,'committedAt',op.committed_at));
    perform official_accepted_trip_private.require_v1(expected=op.hash);
    sequence_:=op.sequence; hash_:=op.hash;
    if sequence_=h.witnessed_sequence then perform official_accepted_trip_private.require_v1(hash_=h.witnessed_hash); end if;
  end loop;
  select * into cv from official_accepted_trip_private.current_versions where cell=cell_;
  if cv.receipt is not null then
    select * into strict v from official_accepted_trip_private.versions where receipt=cv.receipt;
    perform official_accepted_trip_private.require_v1(legacy#>array['projections',v.claim_id::text]=v.legacy_projection);
  end if;
  perform official_accepted_trip_private.require_v1(h.sequence=sequence_ and h.hash=hash_ and cv.receipt is not distinct from receipt_
    and cv.status is not distinct from status_ and (h.witnessed_sequence<>0 or h.witnessed_hash=a.seed_hash)
    and (select count(*) from official_accepted_trip_private.versions where cell=cell_)=(select count(*) from official_accepted_trip_private.operations where cell=cell_ and kind='accept'));
  perform official_accepted_trip_private.require_v1((select count(*) from official_accepted_trip_private.witness_acknowledgements w
    join official_accepted_trip_private.operations o using(operation_id) where o.cell=cell_)=h.witnessed_sequence
    and not exists(select 1 from official_accepted_trip_private.witness_acknowledgements w join official_accepted_trip_private.operations o using(operation_id)
      where o.cell=cell_ and (w.sequence<>o.sequence or w.hash<>o.hash or w.sequence>h.witnessed_sequence)));
end $$;

create function official_accepted_trip_private.assert_head_v1(r official_accepted_trip_private.reservations, legacy jsonb) returns void
language plpgsql volatile set search_path='' as $$ declare h official_accepted_trip_private.heads%rowtype; cv official_accepted_trip_private.current_versions%rowtype; begin
  select * into strict h from official_accepted_trip_private.heads where cell=r.cell for update;
  select * into cv from official_accepted_trip_private.current_versions where cell=r.cell;
  perform official_accepted_trip_private.journal_v1(r.cell,legacy);
  perform official_accepted_trip_private.require_v1(h.sequence=r.prior_sequence and h.hash=r.prior_hash
    and h.sequence=h.witnessed_sequence and h.hash=h.witnessed_hash and cv.receipt is not distinct from r.prior_version);
  if r.purpose='read' then perform official_accepted_trip_private.require_v1(cv.status='accepted'); end if;
end $$;

create function official_accepted_trip_private.read_snapshot_v1(r official_accepted_trip_private.reservations, legacy jsonb) returns jsonb
language plpgsql volatile set search_path='' as $$ declare a official_accepted_trip_private.admissions%rowtype;
  v official_accepted_trip_private.versions%rowtype; m jsonb; envelope jsonb; archive jsonb; result jsonb; until_ timestamptz;
begin
  select * into strict a from official_accepted_trip_private.admissions where cell=r.cell;
  select * into strict v from official_accepted_trip_private.versions where receipt=r.prior_version and cell=r.cell;
  select metadata,expires_at into strict m,until_ from official_accepted_trip_private.originals where receipt=v.receipt;
  select c.envelope into strict envelope from official_accepted_trip_private.ciphertexts c where receipt=v.receipt;
  perform official_accepted_trip_private.require_v1(v.profile=a.profile and v.contract_digest=a.contract_digest and v.code_digest=a.code_digest
    and legacy#>array['projections',v.claim_id::text]=v.legacy_projection
    and clock_timestamp()<until_ and clock_timestamp()<(m->>'originalRetrievedAt')::timestamptz+make_interval(secs=>a.source_max_age_seconds)
    and m->>'keyId'=a.key_id and m->>'keyPolicyDigest'=a.key_policy_digest);
  archive:=official_accepted_trip_private.read_archive_v1(v.receipt);
  result:=jsonb_build_object('profile',a.profile,'contractDigest',a.contract_digest,'codeDigest',a.code_digest,
    'receipt',v.receipt,'acceptedAt',v.accepted_at,'manifest',v.manifest,'archive',archive,
    'metadata',m,'ciphertext',envelope,'catalog',legacy->'catalog','projection',v.legacy_projection,
    'head',jsonb_build_object('sequence',r.prior_sequence,'hash',r.prior_hash));
  perform official_accepted_trip_private.require_v1(octet_length(result::text)<=14680064);
  return result;
end $$;

create function public.official_truth_trip_store_reserve_v1(payload jsonb) returns jsonb
language plpgsql volatile parallel unsafe security definer set search_path='' set statement_timeout='20s' set lock_timeout='2s' as $$
declare a official_accepted_trip_private.admissions%rowtype; h official_accepted_trip_private.heads%rowtype;
  cv official_accepted_trip_private.current_versions%rowtype; authority jsonb; graph jsonb; legacy jsonb; r official_accepted_trip_private.reservations%rowtype; now_ timestamptz;
begin
  perform official_accepted_trip_private.principal_v1('authenticated');
  perform official_accepted_trip_private.object_v1(payload,array['cell','contractDigest','profile','purpose','tripId','revision']);
  perform official_accepted_trip_private.require_v1(payload->>'purpose' in ('read','publish')
    and (payload->>'purpose'='read' or payload->'tripId'='null'::jsonb and payload->'revision'='null'::jsonb));
  -- One package lock orders all token/head/graph/auth transactions consistently.
  perform pg_advisory_xact_lock(1869901924,2);
  select * into strict a from official_accepted_trip_private.admissions where cell=payload->>'cell';
  perform official_accepted_trip_private.require_v1(payload->>'contractDigest'=a.contract_digest and payload->>'profile'=a.profile);
  select * into strict h from official_accepted_trip_private.heads where cell=a.cell for update;
  select * into cv from official_accepted_trip_private.current_versions where cell=a.cell;
  perform pg_catalog.pg_advisory_xact_lock_shared(1869901924,1);
  legacy:=official_accepted_trip_private.lock_legacy_v1(false);
  perform official_accepted_trip_private.journal_v1(a.cell,legacy);
  perform official_accepted_trip_private.require_v1(h.sequence=h.witnessed_sequence and h.hash=h.witnessed_hash
    and (select count(*) from official_accepted_trip_private.reservations)<32);
  if payload->>'purpose'='read' then
    perform official_accepted_trip_private.require_v1(cv.status='accepted' and jsonb_typeof(payload->'revision')='number');
    graph:=official_accepted_trip_private.own_graph_v1((payload->>'tripId')::uuid);
    if graph->'revision' is distinct from payload->'revision' then raise exception 'trip revision changed' using errcode='40001'; end if;
  end if;
  authority:=official_accepted_trip_private.require_owner_v1();
  -- One fresh post-authority instant anchors BOTH sides of the unchanged 45s
  -- CHECK. Two volatile clock reads can differ by even one microsecond.
  now_:=clock_timestamp();
  insert into official_accepted_trip_private.reservations(cell,purpose,user_id,session_id,original_expiry,created_at,expires_at,state,
    prior_sequence,prior_hash,prior_version,trip_id,trip_revision,graph_digest)
  values(a.cell,payload->>'purpose',(authority->>'uid')::uuid,(authority->>'session')::uuid,(authority->>'expiresAt')::timestamptz,
    now_,least(now_+interval '45 seconds',(authority->>'expiresAt')::timestamptz),'reserved',h.sequence,h.hash,cv.receipt,
    (payload->>'tripId')::uuid,(payload->>'revision')::bigint,graph->>'digest') returning * into r;
  return jsonb_build_object('token',r.token,'operationId',r.operation_id,'now',clock_timestamp(),'expiresAt',r.expires_at,
    'head',jsonb_build_object('sequence',h.sequence,'hash',h.hash),'priorVersion',cv.receipt,
    'graph',graph->'graph','graphDigest',graph->'digest','authorityUid',r.user_id,
    'binding',jsonb_build_object('codeDigest',a.code_digest,'keyId',a.key_id,'keyPolicyDigest',a.key_policy_digest,'witnessDomain',a.witness_domain,
      'sourceMaxAgeSeconds',a.source_max_age_seconds,'retentionSeconds',a.retention_seconds,'displaySeconds',a.display_seconds));
end $$;

create function public.official_truth_trip_store_prepare_v1(payload jsonb) returns jsonb
language plpgsql volatile parallel unsafe security definer set search_path='' set statement_timeout='20s' set lock_timeout='2s' as $$
declare r official_accepted_trip_private.reservations%rowtype; a official_accepted_trip_private.admissions%rowtype;
  legacy jsonb; m jsonb; dig text; cv official_accepted_trip_private.current_versions%rowtype;
begin
  perform official_accepted_trip_private.principal_v1('service_role');
  perform official_accepted_trip_private.object_v1(payload,array['token','phase','kind','manifest']);
  perform official_accepted_trip_private.require_v1(payload->>'phase' in ('inspect','stage'));
  perform pg_advisory_xact_lock(1869901924,2);
  r:=official_accepted_trip_private.reservation_v1((payload->>'token')::uuid);
  perform official_accepted_trip_private.require_v1(r.purpose='publish' and r.state='reserved');
  select * into strict a from official_accepted_trip_private.admissions where cell=r.cell;
  perform pg_advisory_xact_lock_shared(1869901924,1);
  legacy:=official_accepted_trip_private.lock_legacy_v1(false);
  perform official_accepted_trip_private.assert_head_v1(r,legacy);
  dig:=official_accepted_trip_private.hash_v1(legacy->'catalog');
  if payload->>'phase'='inspect' then
    perform official_accepted_trip_private.require_v1(payload->'kind'='null'::jsonb and payload->'manifest'='null'::jsonb);
    return jsonb_build_object('catalog',legacy->'catalog','catalogDigest',dig,'now',clock_timestamp(),'expiresAt',r.expires_at);
  end if;
  m:=payload->'manifest';
  perform official_accepted_trip_private.require_v1(payload->>'kind' in ('accept','withdraw','conflict') and octet_length(m::text)<=12582912);
  if payload->>'kind'='accept' then
    perform official_accepted_trip_private.object_v1(m,array['profile','contractDigest','codeDigest','scopeKey','catalogDigest','archive',
      'evidence','claim','reviewPacketKey','originalStartedAt','metadata','ciphertext']);
    perform official_accepted_trip_private.object_v1(m->'archive',array['recordFingerprint','receiptBase64','custodyBindingBase64','artifacts']);
    perform official_accepted_trip_private.require_v1(jsonb_typeof(m#>'{archive,artifacts}')='array'
      and jsonb_array_length(m#>'{archive,artifacts}') between 1 and 255
      and octet_length(decode(m#>>'{archive,receiptBase64}','base64')) between 1 and 262144
      and octet_length(decode(m#>>'{archive,custodyBindingBase64}','base64')) between 1 and 4096
      and (select coalesce(sum(octet_length(decode(x->>'canonicalBase64','base64'))),0) from jsonb_array_elements(m#>'{archive,artifacts}') x)+octet_length(decode(m#>>'{archive,custodyBindingBase64}','base64'))<=8388608
      and replace(encode(decode(m#>>'{archive,receiptBase64}','base64'),'base64'),E'\n','')=m#>>'{archive,receiptBase64}'
      and replace(encode(decode(m#>>'{archive,custodyBindingBase64}','base64'),'base64'),E'\n','')=m#>>'{archive,custodyBindingBase64}');
    perform official_accepted_trip_private.object_v1(m->'metadata',array['schema','operationId','receiptFingerprint','originalPin','evidenceVersionId',
      'identity','canonicalUrl','contentType','contentHash','contentBytes','originalRetrievedAt','retainUntil','keyId','keyPolicyDigest']);
    perform official_accepted_trip_private.object_v1(m#>'{metadata,originalPin}',array['id','version','digest']);
    perform official_accepted_trip_private.object_v1(m#>'{metadata,identity}',array['sourceId','contentItemId','contentItemVersion','representationId',
      'representationVersion','identityProfileId','identityProfileVersion']);
    perform official_accepted_trip_private.object_v1(m->'ciphertext',array['version','algorithm','nonce','tag','ciphertext']);
    perform official_accepted_trip_private.require_v1(m#>>'{metadata,schema}'='accepted-store-original-v1'
      and m#>>'{metadata,contentHash}' ~ '^[a-f0-9]{64}$' and m#>>'{metadata,contentHash}'=m#>>'{evidence,sourceContentHash}'
      and jsonb_typeof(m#>'{metadata,contentBytes}')='number' and (m#>>'{metadata,contentBytes}')::integer between 1 and 65536
      and m#>>'{metadata,canonicalUrl}'=m#>>'{evidence,canonicalUrl}' and m#>>'{metadata,contentType}'=m#>>'{evidence,contentType}'
      and m#>'{ciphertext,version}'='1'::jsonb and m#>>'{ciphertext,algorithm}'='aes-256-gcm'
      and length(m#>>'{ciphertext,nonce}')=16 and octet_length(decode(m#>>'{ciphertext,nonce}','base64'))=12
      and length(m#>>'{ciphertext,tag}')=24 and octet_length(decode(m#>>'{ciphertext,tag}','base64'))=16
      and length(m#>>'{ciphertext,ciphertext}')<=87384
      and octet_length(decode(m#>>'{ciphertext,ciphertext}','base64'))=(m#>>'{metadata,contentBytes}')::integer
      and replace(encode(decode(m#>>'{ciphertext,ciphertext}','base64'),'base64'),E'\n','')=m#>>'{ciphertext,ciphertext}'
      and replace(encode(decode(m#>>'{ciphertext,nonce}','base64'),'base64'),E'\n','')=m#>>'{ciphertext,nonce}'
      and replace(encode(decode(m#>>'{ciphertext,tag}','base64'),'base64'),E'\n','')=m#>>'{ciphertext,tag}');
    perform official_accepted_trip_private.require_v1(m#>>'{archive,recordFingerprint}' ~ '^ot-provenance-v1:[a-f0-9]{64}$'
      and m#>>'{metadata,receiptFingerprint}'=m#>>'{archive,recordFingerprint}' and m#>>'{metadata,operationId}'=r.operation_id::text
      and m#>>'{metadata,evidenceVersionId}'=m#>>'{evidence,versionId}' and m#>'{metadata,identity}'=a.source_binding
      and m#>>'{metadata,keyId}'=a.key_id and m#>>'{metadata,keyPolicyDigest}'=a.key_policy_digest
      and m#>>'{metadata,originalRetrievedAt}'=m#>>'{evidence,retrievedAt}'
      and (m->>'originalStartedAt')::timestamptz>=r.created_at
      and (m#>>'{metadata,originalRetrievedAt}')::timestamptz>=(m->>'originalStartedAt')::timestamptz
      and (m#>>'{metadata,originalRetrievedAt}')::timestamptz<=clock_timestamp()
      and (m#>>'{metadata,retainUntil}')::timestamptz<=(m#>>'{metadata,originalRetrievedAt}')::timestamptz+make_interval(secs=>a.retention_seconds)
      and clock_timestamp()<(m#>>'{metadata,retainUntil}')::timestamptz
      and clock_timestamp()<(m#>>'{metadata,originalRetrievedAt}')::timestamptz+make_interval(secs=>a.source_max_age_seconds));
    select * into cv from official_accepted_trip_private.current_versions where cell=r.cell;
    perform official_accepted_trip_private.require_v1(cv.status is null or cv.status='accepted');
    perform official_accepted_trip_private.accept_binding_v1(m,a);
  else
    perform official_accepted_trip_private.object_v1(m,array['profile','contractDigest','codeDigest','scopeKey','catalogDigest','observedVersion']);
    select * into strict cv from official_accepted_trip_private.current_versions where cell=r.cell;
    perform official_accepted_trip_private.require_v1(m->>'observedVersion'=r.prior_version
      and (cv.status='accepted' or cv.status='conflicted' and payload->>'kind'='withdraw'));
  end if;
  perform official_accepted_trip_private.require_v1(m->>'profile'=a.profile and m->>'contractDigest'=a.contract_digest
    and m->>'codeDigest'=a.code_digest and m->>'scopeKey'=a.scope_key and m->>'catalogDigest'=dig);
  dig:=official_accepted_trip_private.hash_v1(jsonb_build_object('kind',payload->>'kind','manifest',m));
  perform official_accepted_trip_private.require_v1((select coalesce(sum(octet_length(manifest::text)),0) from official_accepted_trip_private.stages)+octet_length(m::text)<=33554432);
  insert into official_accepted_trip_private.stages values(r.operation_id,payload->>'kind',m,dig);
  update official_accepted_trip_private.reservations set state='prepared',prepared_digest=dig,catalog_digest=m->>'catalogDigest' where token=r.token;
  perform official_accepted_trip_private.require_v1(clock_timestamp()<r.expires_at);
  return jsonb_build_object('digest',dig,'now',clock_timestamp(),'expiresAt',r.expires_at);
end $$;

create function public.official_truth_trip_store_snapshot_v1(payload jsonb) returns jsonb
language plpgsql volatile parallel unsafe security definer set search_path='' set statement_timeout='20s' set lock_timeout='2s' as $$
declare r official_accepted_trip_private.reservations%rowtype; snapshot jsonb; legacy jsonb; dig text;
begin
  perform official_accepted_trip_private.principal_v1('service_role');
  perform official_accepted_trip_private.object_v1(payload,array['token']);
  perform pg_advisory_xact_lock(1869901924,2);
  r:=official_accepted_trip_private.reservation_v1((payload->>'token')::uuid);
  perform official_accepted_trip_private.require_v1(r.purpose='read' and r.state='reserved');
  perform pg_advisory_xact_lock_shared(1869901924,1);
  legacy:=official_accepted_trip_private.lock_legacy_v1(false);
  perform official_accepted_trip_private.assert_head_v1(r,legacy);
  snapshot:=official_accepted_trip_private.read_snapshot_v1(r,legacy);
  dig:=official_accepted_trip_private.hash_v1(snapshot);
  update official_accepted_trip_private.reservations set state='snapshotted',prepared_digest=dig,
    catalog_digest=official_accepted_trip_private.hash_v1(legacy->'catalog') where token=r.token;
  perform official_accepted_trip_private.require_v1(clock_timestamp()<r.expires_at);
  return jsonb_build_object('snapshot',snapshot,'digest',dig,'now',clock_timestamp(),'expiresAt',r.expires_at);
end $$;

create function public.official_truth_trip_store_finalize_v1(payload jsonb) returns jsonb
language plpgsql volatile parallel unsafe security definer set search_path='' set statement_timeout='30s' set lock_timeout='2s' as $$
declare r official_accepted_trip_private.reservations%rowtype; a official_accepted_trip_private.admissions%rowtype;
  stage official_accepted_trip_private.stages%rowtype; authority jsonb; graph jsonb; legacy jsonb; snapshot jsonb;
  archive jsonb; artifacts official_provenance_api.artifact_input_v1[]; projected jsonb; receipt_ text; archive_outcome text; new_hash text;
  next_sequence bigint; result_ jsonb; until_ timestamptz; now_ timestamptz; expected_status text;
  publication jsonb; publication_digest_ text; decision jsonb; committed_ timestamptz;
begin
  perform official_accepted_trip_private.principal_v1('authenticated');
  perform official_accepted_trip_private.object_v1(payload,array['token','digest']);
  perform pg_advisory_xact_lock(1869901924,2);
  r:=official_accepted_trip_private.reservation_v1((payload->>'token')::uuid);
  perform official_accepted_trip_private.require_v1(r.state in ('prepared','snapshotted') and payload->>'digest'=r.prepared_digest);
  select * into strict a from official_accepted_trip_private.admissions where cell=r.cell;
  if r.purpose='publish' then perform pg_advisory_xact_lock(1869901924,1);
  else perform pg_advisory_xact_lock_shared(1869901924,1); end if;
  legacy:=official_accepted_trip_private.lock_legacy_v1(r.purpose='publish');
  perform official_accepted_trip_private.assert_head_v1(r,legacy);
  if r.purpose='read' then
    graph:=official_accepted_trip_private.own_graph_v1(r.trip_id);
    perform official_accepted_trip_private.require_v1(graph->>'digest'=r.graph_digest and (graph->>'revision')::bigint=r.trip_revision);
  end if;
  -- Fresh unchanged #1142 guard AFTER all package/legacy/Trip lock waits.
  authority:=official_accepted_trip_private.require_owner_v1();
  perform official_accepted_trip_private.require_v1((authority->>'uid')::uuid=r.user_id and (authority->>'session')::uuid=r.session_id
    and clock_timestamp()<r.expires_at and clock_timestamp()<r.original_expiry
    and official_accepted_trip_private.hash_v1(legacy->'catalog')=r.catalog_digest);
  if r.purpose='read' then
    snapshot:=official_accepted_trip_private.read_snapshot_v1(r,legacy);
    perform official_accepted_trip_private.require_v1(official_accepted_trip_private.hash_v1(snapshot)=r.prepared_digest);
    receipt_:=r.prior_version;
    until_:=least(r.expires_at,r.original_expiry,(authority->>'expiresAt')::timestamptz,
      (snapshot#>>'{metadata,retainUntil}')::timestamptz,
      (snapshot#>>'{metadata,originalRetrievedAt}')::timestamptz+make_interval(secs=>a.source_max_age_seconds),
      clock_timestamp()+make_interval(secs=>a.display_seconds));
    result_:=jsonb_build_object('kind','read','operationId',r.operation_id,'receipt',receipt_,'digest',r.prepared_digest,
      'head',jsonb_build_object('sequence',r.prior_sequence,'hash',r.prior_hash),'readAt',clock_timestamp(),'expiresAt',until_);
  else
    select * into strict stage from official_accepted_trip_private.stages where operation_id=r.operation_id;
    perform official_accepted_trip_private.require_v1(stage.digest=r.prepared_digest and stage.manifest->>'profile'=a.profile
      and stage.manifest->>'contractDigest'=a.contract_digest and stage.manifest->>'codeDigest'=a.code_digest);
    if stage.kind='accept' then
      archive:=stage.manifest->'archive'; receipt_:=archive->>'recordFingerprint';
      perform official_accepted_trip_private.object_v1(archive,array['recordFingerprint','receiptBase64','custodyBindingBase64','artifacts']);
      perform official_accepted_trip_private.require_v1(jsonb_array_length(archive->'artifacts') between 1 and 255
        and clock_timestamp()<(stage.manifest#>>'{metadata,retainUntil}')::timestamptz
        and clock_timestamp()<(stage.manifest#>>'{metadata,originalRetrievedAt}')::timestamptz+make_interval(secs=>a.source_max_age_seconds)
        and not exists(select 1 from official_accepted_trip_private.versions v where v.receipt=receipt_));
      select array_agg(row(x#>>'{pin,id}',(x#>>'{pin,version}')::bigint,x#>>'{pin,digest}',x->>'artifactType',
        case when x->>'artifactType'='global_cell' then 'global_definition_v1' when right(x->>'artifactType',2)='V1' then 'custody_v1' else 'manifest_v1' end,
        (x->>'artifactContractVersion')::integer,decode(x->>'canonicalBase64','base64'))::official_provenance_api.artifact_input_v1 order by x#>>'{pin,id}')
        into artifacts from jsonb_array_elements(archive->'artifacts') x;
      -- Layout 2 is physical historical storage only. The NEW accepted profile
      -- is separately bound above/below and never inferred from old API success.
      archive_outcome:=official_provenance_api.publish_local_integrated_v2('ot-integrated-pilot-local-closure-v2',2::smallint,'create_or_verify',receipt_,
        decode(archive->>'receiptBase64','base64'),decode(archive->>'custodyBindingBase64','base64'),artifacts);
      perform official_accepted_trip_private.require_v1(archive_outcome='inserted');
      projected:=official_accepted_trip_private.publish_legacy_v1(r.operation_id);
      insert into official_accepted_trip_private.versions values(receipt_,r.cell,r.prior_version,r.operation_id,a.profile,a.contract_digest,a.code_digest,
        (projected->>'claimId')::bigint,(projected->>'acceptedAt')::timestamptz,stage.manifest-array['archive','ciphertext'],projected->'projection',projected->'evidence');
      insert into official_accepted_trip_private.version_supports values(receipt_,0,stage.manifest#>>'{evidence,versionId}',stage.manifest#>'{metadata,originalPin}');
      insert into official_accepted_trip_private.originals values(receipt_,stage.manifest->'metadata',(stage.manifest#>>'{metadata,retainUntil}')::timestamptz);
      insert into official_accepted_trip_private.ciphertexts values(receipt_,stage.manifest->'ciphertext');
      publication:=official_accepted_trip_private.publication_v1(receipt_);
      perform official_accepted_trip_private.require_v1(publication->>'stageDigest'=stage.digest);
      publication_digest_:=publication->>'publicationDigest'; decision:=null;
      until_:=least((stage.manifest#>>'{metadata,retainUntil}')::timestamptz,
        (stage.manifest#>>'{metadata,originalRetrievedAt}')::timestamptz+make_interval(secs=>a.source_max_age_seconds));
      expected_status:='accepted';
    else
      receipt_:=r.prior_version;
      perform official_accepted_trip_private.require_v1(stage.manifest->>'observedVersion'=receipt_);
      publication:=official_accepted_trip_private.publication_v1(receipt_);
      publication_digest_:=official_accepted_trip_private.hash_v1(jsonb_build_object('kind',stage.kind,'stageDigest',stage.digest,'versionPublicationDigest',publication->>'publicationDigest'));
      decision:=stage.manifest;
      expected_status:=case stage.kind when 'withdraw' then 'withdrawn' else 'conflicted' end;
    end if;
    insert into official_accepted_trip_private.current_versions values(r.cell,receipt_,expected_status)
      on conflict(cell) do update set receipt=excluded.receipt,status=excluded.status;
    next_sequence:=r.prior_sequence+1;
    committed_:=clock_timestamp();
    new_hash:=official_accepted_trip_private.hash_v1(jsonb_build_object('operationId',r.operation_id,'cell',r.cell,'kind',stage.kind,
      'receipt',receipt_,'priorSequence',r.prior_sequence,'priorHash',r.prior_hash,'sequence',next_sequence,
      'contractDigest',a.contract_digest,'profile',a.profile,'stageDigest',stage.digest,'publicationDigest',publication_digest_,'committedAt',committed_));
    insert into official_accepted_trip_private.operations values(r.operation_id,r.cell,stage.kind,receipt_,r.prior_sequence,r.prior_hash,
      next_sequence,new_hash,a.contract_digest,a.profile,stage.digest,publication_digest_,decision,committed_);
    update official_accepted_trip_private.heads set sequence=next_sequence,hash=new_hash where cell=r.cell and sequence=r.prior_sequence and hash=r.prior_hash;
    perform official_accepted_trip_private.require_v1(found);
    result_:=jsonb_build_object('kind',stage.kind,'operationId',r.operation_id,'receipt',receipt_,
      'head',jsonb_build_object('sequence',next_sequence,'hash',new_hash));
  end if;
  update official_accepted_trip_private.reservations set state='finalized',result=result_ where token=r.token;
  -- Deferred legacy/provenance integrity work cannot run after the last guard.
  set constraints all immediate;
  authority:=official_accepted_trip_private.require_owner_v1(); now_:=clock_timestamp();
  perform official_accepted_trip_private.require_v1((authority->>'uid')::uuid=r.user_id and (authority->>'session')::uuid=r.session_id
    and now_<r.expires_at and now_<r.original_expiry and now_<(authority->>'expiresAt')::timestamptz
    and (until_ is null or now_<until_));
  return result_||jsonb_build_object('now',now_);
end $$;

create function public.official_truth_trip_store_confirm_v1(payload jsonb) returns jsonb
language plpgsql volatile parallel unsafe security definer set search_path='' set statement_timeout='10s' set lock_timeout='2s' as $$
declare op official_accepted_trip_private.operations%rowtype; h official_accepted_trip_private.heads%rowtype;
  a official_accepted_trip_private.admissions%rowtype; r official_accepted_trip_private.reservations%rowtype; ack jsonb; legacy jsonb;
begin
  perform official_accepted_trip_private.principal_v1('service_role');
  perform official_accepted_trip_private.object_v1(payload,array['cell','operationId','ack']);
  perform pg_advisory_xact_lock(1869901924,2);
  select * into strict a from official_accepted_trip_private.admissions where cell=payload->>'cell';
  select * into strict h from official_accepted_trip_private.heads where cell=a.cell for update;
  perform pg_catalog.pg_advisory_xact_lock_shared(1869901924,1);
  legacy:=official_accepted_trip_private.lock_legacy_v1(false);
  perform official_accepted_trip_private.journal_v1(a.cell,legacy);
  if payload->'operationId'='null'::jsonb then
    perform official_accepted_trip_private.require_v1(payload->'ack'='null'::jsonb);
    select * into op from official_accepted_trip_private.operations where cell=a.cell and sequence=h.sequence and sequence>h.witnessed_sequence;
    if not found then return jsonb_build_object('kind','none','head',jsonb_build_object('sequence',h.sequence,'hash',h.hash),'now',clock_timestamp()); end if;
  else
    select * into op from official_accepted_trip_private.operations where operation_id=(payload->>'operationId')::uuid and cell=a.cell;
    if not found then
      select * into strict r from official_accepted_trip_private.reservations where operation_id=(payload->>'operationId')::uuid and cell=a.cell and purpose='read' and state='finalized';
      perform official_accepted_trip_private.require_v1(payload->'ack'='null'::jsonb and clock_timestamp()<r.expires_at
        and clock_timestamp()<(r.result->>'expiresAt')::timestamptz and h.sequence=r.prior_sequence and h.hash=r.prior_hash
        and h.sequence=h.witnessed_sequence and h.hash=h.witnessed_hash);
      return r.result||jsonb_build_object('now',clock_timestamp());
    end if;
  end if;
  perform official_accepted_trip_private.require_v1(op.sequence=h.sequence and op.hash=h.hash and op.profile=a.profile and op.contract_digest=a.contract_digest);
  ack:=payload->'ack';
  if ack<>'null'::jsonb then
    perform official_accepted_trip_private.object_v1(ack,array['sequence','hash']);
    perform official_accepted_trip_private.require_v1((ack->>'sequence')::bigint=op.sequence and ack->>'hash'=op.hash
      and (h.witnessed_sequence=op.prior_sequence and h.witnessed_hash=op.prior_hash or h.witnessed_sequence=op.sequence and h.witnessed_hash=op.hash));
    insert into official_accepted_trip_private.witness_acknowledgements values(op.operation_id,op.sequence,op.hash,clock_timestamp()) on conflict(operation_id) do nothing;
    update official_accepted_trip_private.heads set witnessed_sequence=op.sequence,witnessed_hash=op.hash where cell=a.cell;
  end if;
  return jsonb_build_object('kind',op.kind,'operationId',op.operation_id,'receipt',op.receipt,'stageDigest',op.stage_digest,
    'contractDigest',op.contract_digest,'profile',op.profile,'committedAt',op.committed_at,
    'prior',jsonb_build_object('sequence',op.prior_sequence,'hash',op.prior_hash),
    'head',jsonb_build_object('sequence',op.sequence,'hash',op.hash),'witnessed',exists(select 1 from official_accepted_trip_private.witness_acknowledgements w where w.operation_id=op.operation_id),
    'now',clock_timestamp());
end $$;

create function public.official_truth_trip_store_cleanup_v1(payload jsonb) returns jsonb
language plpgsql volatile parallel unsafe security definer set search_path='' set statement_timeout='5s' set lock_timeout='1s' as $$
declare n integer;
begin
  perform official_accepted_trip_private.principal_v1('service_role');
  perform official_accepted_trip_private.object_v1(payload,array['token']);
  perform pg_advisory_xact_lock(1869901924,2);
  -- Hard bounded quota (32); cascade erases provisional manifest/ciphertext.
  -- Durable operations/versions/originals have no cleanup FK and remain intact.
  with doomed as (select token from official_accepted_trip_private.reservations
    where expires_at<=clock_timestamp() or token=(payload->>'token')::uuid order by created_at limit 32)
    delete from official_accepted_trip_private.reservations r using doomed d where r.token=d.token;
  get diagnostics n=row_count;
  return jsonb_build_object('removed',n);
end $$;

-- Finite installation-only ownership/RLS declarations. No runtime DDL helper.
do $$ declare t text; f record; begin
  foreach t in array array['admissions','heads','reservations','stages','versions','version_supports','originals','ciphertexts','current_versions','operations','witness_acknowledgements'] loop
    execute format('alter table official_accepted_trip_private.%I owner to postgres',t);
    execute format('alter table official_accepted_trip_private.%I enable row level security',t);
    execute format('alter table official_accepted_trip_private.%I force row level security',t);
    execute format('revoke all on table official_accepted_trip_private.%I from public, anon, authenticated, service_role',t);
    execute format('grant select,insert,update,delete on table official_accepted_trip_private.%I to ot_accepted_trip_exec',t);
    execute format('create policy accepted_executor on official_accepted_trip_private.%I to ot_accepted_trip_exec using (true) with check (true)',t);
    if t=any(array['admissions','versions','version_supports','originals','ciphertexts','operations','witness_acknowledgements']) then
      execute format('create trigger immutable before update or delete on official_accepted_trip_private.%I for each row execute function official_accepted_trip_private.immutable_v1()',t);
      execute format('create trigger no_truncate before truncate on official_accepted_trip_private.%I for each statement execute function official_accepted_trip_private.immutable_v1()',t);
    end if;
  end loop;
  for f in select p.oid::regprocedure signature,p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='official_accepted_trip_private' loop
    if f.proname<>all(array['require_owner_v1','lock_legacy_v1','own_graph_v1','publish_legacy_v1','read_archive_v1']) then
      execute format('alter function %s owner to ot_accepted_trip_exec',f.signature);
    end if;
    execute format('revoke all on function %s from public,anon,authenticated,service_role',f.signature);
    execute format('grant execute on function %s to ot_accepted_trip_exec',f.signature);
  end loop;
end $$;
-- R6: complete pure invoker-helper dependency set of the four postgres-owned
-- bridges. Schema ownership alone grants no EXECUTE on executor-owned helpers.
grant execute on function official_accepted_trip_private.require_v1(boolean),
  official_accepted_trip_private.object_v1(jsonb,text[]),
  official_accepted_trip_private.hash_v1(jsonb),
  official_accepted_trip_private.scope_columns_v1(jsonb),
  official_accepted_trip_private.accept_binding_v1(jsonb,official_accepted_trip_private.admissions) to postgres;
create trigger stage_immutable before update on official_accepted_trip_private.stages for each row execute function official_accepted_trip_private.immutable_v1();
grant usage on schema official_provenance_api to ot_accepted_trip_exec;
grant usage on type official_provenance_api.artifact_input_v1 to ot_accepted_trip_exec;
grant execute on function official_provenance_api.publish_local_integrated_v2(text,smallint,text,text,bytea,bytea,official_provenance_api.artifact_input_v1[]) to ot_accepted_trip_exec;
alter function public.official_truth_trip_store_reserve_v1(jsonb) owner to ot_accepted_trip_exec;
alter function public.official_truth_trip_store_prepare_v1(jsonb) owner to ot_accepted_trip_exec;
alter function public.official_truth_trip_store_snapshot_v1(jsonb) owner to ot_accepted_trip_exec;
alter function public.official_truth_trip_store_finalize_v1(jsonb) owner to ot_accepted_trip_exec;
alter function public.official_truth_trip_store_confirm_v1(jsonb) owner to ot_accepted_trip_exec;
alter function public.official_truth_trip_store_cleanup_v1(jsonb) owner to ot_accepted_trip_exec;
revoke all on function public.official_truth_trip_store_reserve_v1(jsonb),public.official_truth_trip_store_prepare_v1(jsonb),
  public.official_truth_trip_store_snapshot_v1(jsonb),public.official_truth_trip_store_finalize_v1(jsonb),
  public.official_truth_trip_store_confirm_v1(jsonb),public.official_truth_trip_store_cleanup_v1(jsonb) from public,anon,authenticated,service_role;
grant execute on function public.official_truth_trip_store_reserve_v1(jsonb),public.official_truth_trip_store_finalize_v1(jsonb) to authenticated;
grant execute on function public.official_truth_trip_store_prepare_v1(jsonb),public.official_truth_trip_store_snapshot_v1(jsonb),
  public.official_truth_trip_store_confirm_v1(jsonb),public.official_truth_trip_store_cleanup_v1(jsonb) to service_role;
commit;
