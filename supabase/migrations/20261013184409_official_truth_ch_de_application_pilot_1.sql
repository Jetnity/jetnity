-- CODE-ONLY / LOCAL-UNAPPLIED. No Source/Rule admission or enablement is inserted.
-- Existing trip storage, RLS, Auth capability and revision remain authoritative.
begin;
create or replace function public.trip_regulatory_context_save_v1(payload jsonb)
returns jsonb language plpgsql volatile security invoker set search_path = '' as $$
declare
  t public.trips%rowtype; c jsonb; d jsonb; selected_count integer;
  tid uuid; rev integer; mutation text;
begin
  if auth.uid() is null then raise exception 'authentication required' using errcode='42501'; end if;
  if payload is null or jsonb_typeof(payload) is distinct from 'object' or octet_length(payload::text)>8192
    or (select count(*) from jsonb_object_keys(payload))<>4
    or not payload ?& array['tripId','revision','mutationId','context']
    or jsonb_typeof(payload->'tripId') is distinct from 'string'
    or jsonb_typeof(payload->'revision') is distinct from 'number'
    or jsonb_typeof(payload->'mutationId') is distinct from 'string' then
    raise exception 'invalid request' using errcode='22023'; end if;
  tid := (payload->>'tripId')::uuid; rev := (payload->>'revision')::integer;
  mutation := payload->>'mutationId'; c := payload->'context';
  if mutation is null or mutation !~ '^[a-zA-Z0-9:_-]{1,64}$' or rev is null or rev<1 or rev>=1000000000 then
    raise exception 'invalid request' using errcode='22023'; end if;
  select * into t from public.trips where id=tid and user_id=auth.uid() for update;
  if not found then raise exception 'trip unavailable' using errcode='P0002'; end if;
  if jsonb_typeof(c) is distinct from 'object' or (select count(*) from jsonb_object_keys(c))<>8
    or not c ?& array['version','evidenceClass','tripId','tripRevision','startDate','endDate','declaration','graphFingerprint']
    or c->'version' is distinct from '1'::jsonb or c->>'evidenceClass' is distinct from 'user_attestation'
    or c->>'tripId' is distinct from tid::text or c->'tripRevision' is distinct from to_jsonb(rev+1)
    or jsonb_typeof(c->'graphFingerprint') is distinct from 'string'
    or c->>'graphFingerprint' is null or (c->>'graphFingerprint') !~ '^[a-f0-9]{64}$' then
    raise exception 'invalid context' using errcode='22023'; end if;
  d := c->'declaration';
  if jsonb_typeof(d) is distinct from 'object' or (select count(*) from jsonb_object_keys(d))<>8
    or not d ?& array['travellerClientRef','documentClientRef','citizenshipClientRef','credentialOptionRef','passportClass','purpose','originCountryCode','route']
    or exists(select 1 from jsonb_each(d) v where jsonb_typeof(v.value) not in ('null','string'))
    or coalesce(d->>'passportClass','unknown') not in ('ordinary','other','unknown')
    or coalesce(d->>'purpose','unknown') not in ('tourism','other','unknown')
    or coalesce(d->>'originCountryCode','unknown') not in ('CH','other','unknown')
    or coalesce(d->>'route','unknown') not in ('complete_direct_ch_de','other','unknown') then
    raise exception 'invalid declaration' using errcode='22023'; end if;
  -- Exact retries are idempotent; reusing a mutation for different data is not.
  if t.last_mutation_id=mutation and t.revision=rev+1
    and t.metadata->'official_truth_ch_de_application_v1'=c then
    return jsonb_build_object('revision',t.revision); end if;
  if t.revision<>rev then raise exception 'stale revision' using errcode='40001'; end if;
  if c->>'startDate' is distinct from t.start_date::text or c->>'endDate' is distinct from t.end_date::text then
    raise exception 'dates changed' using errcode='40001'; end if;
  if exists(select 1 from jsonb_each_text(d) v where v.key in ('travellerClientRef','documentClientRef','citizenshipClientRef')
    and v.value is not null and v.value !~ '^[a-zA-Z0-9:_-]{1,64}$') then
    raise exception 'invalid reference' using errcode='22023'; end if;
  if d->>'travellerClientRef' is not null or d->>'documentClientRef' is not null
    or d->>'citizenshipClientRef' is not null or d->>'credentialOptionRef' is not null then
    select count(*) into selected_count from public.trip_travellers p
      join public.trip_traveller_documents doc on doc.traveller_id=p.id and doc.trip_id=p.trip_id and doc.user_id=p.user_id
      join public.trip_traveller_citizenships citizen on citizen.id=doc.citizenship_id and citizen.traveller_id=p.id
        and citizen.trip_id=p.trip_id and citizen.user_id=p.user_id
      where p.trip_id=tid and p.user_id=auth.uid() and p.client_ref=d->>'travellerClientRef'
        and doc.client_ref=d->>'documentClientRef' and citizen.client_ref=d->>'citizenshipClientRef'
        and d->>'credentialOptionRef'=p.client_ref || ':' || doc.client_ref;
    if selected_count<>1 then raise exception 'invalid selection' using errcode='22023'; end if;
  end if;
  update public.trips set metadata=coalesce(metadata,'{}'::jsonb) || jsonb_build_object('official_truth_ch_de_application_v1',c),
    revision=revision+1,last_mutation_id=mutation where id=tid and revision=rev;
  return jsonb_build_object('revision',rev+1);
end $$;
revoke all on function public.trip_regulatory_context_save_v1(jsonb) from public, anon;
grant execute on function public.trip_regulatory_context_save_v1(jsonb) to authenticated;

-- One protected grant = one explicit attempt, including failed/timeout attempts.
-- No original bytes, result, Evidence, passport data or client authority here.
create table private.official_truth_application_pilot_grants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trip_id uuid not null references public.trips(id) on delete cascade,
  trip_revision integer not null check(trip_revision>0),
  context_fingerprint text not null check(context_fingerprint ~ '^[a-f0-9]{64}$'),
  contract_id text not null check(contract_id ~ '^[a-z0-9._-]{1,128}$'),
  contract_digest text not null check(contract_digest ~ '^[a-f0-9]{64}$'),
  approval_reference text not null check(length(approval_reference) between 1 and 256),
  enabled boolean not null default false,
  created_at timestamptz not null default clock_timestamp(),
  expires_at timestamptz not null,
  consumed_at timestamptz,
  check(expires_at>created_at and expires_at<=created_at+interval '30 minutes'),
  unique(user_id,trip_id,trip_revision,context_fingerprint)
);
alter table private.official_truth_application_pilot_grants enable row level security;
revoke all on private.official_truth_application_pilot_grants from public,anon,authenticated,service_role;
-- Definer can see only this protected grant; it independently rechecks trip owner
-- and the EXISTING Owner/role/current-AAL2 capability. No client grant creation.
create or replace function public.official_truth_application_pilot_run_v1(payload jsonb)
returns jsonb language plpgsql volatile security definer set search_path='' as $$
declare g private.official_truth_application_pilot_grants%rowtype; uid uuid:=auth.uid();
begin
  if uid is null or not coalesce(public.darf_official_truth_freigeben(),false) then
    raise exception 'forbidden' using errcode='42501'; end if;
  if payload is null or jsonb_typeof(payload) is distinct from 'object' or octet_length(payload::text)>2048
    or (select count(*) from jsonb_object_keys(payload))<>5
    or not payload ?& array['operation','tripId','revision','contextFingerprint','grantId']
    or payload->>'operation' is null or payload->>'operation' not in ('reserve','recheck') then raise exception 'invalid request' using errcode='22023'; end if;
  -- The same non-disclosing empty result for foreign/missing trips.
  if not exists(select 1 from public.trips where id=(payload->>'tripId')::uuid and user_id=uid and revision=(payload->>'revision')::integer) then return null; end if;
  select * into g from private.official_truth_application_pilot_grants where user_id=uid
    and trip_id=(payload->>'tripId')::uuid and trip_revision=(payload->>'revision')::integer
    and context_fingerprint=payload->>'contextFingerprint' for update;
  if not found or not g.enabled or clock_timestamp()>=g.expires_at then return null; end if;
  if payload->>'operation'='reserve' then
    if g.consumed_at is not null or payload->>'grantId' is not null then return null; end if;
    update private.official_truth_application_pilot_grants set consumed_at=clock_timestamp() where id=g.id;
  elsif g.consumed_at is null or g.id::text is distinct from payload->>'grantId' then return null;
  end if;
  return jsonb_build_object('id',g.id,'contractId',g.contract_id,'contractDigest',g.contract_digest,'expiresAt',g.expires_at);
end $$;
revoke all on function public.official_truth_application_pilot_run_v1(jsonb) from public,anon,service_role;
grant execute on function public.official_truth_application_pilot_run_v1(jsonb) to authenticated;
commit;
