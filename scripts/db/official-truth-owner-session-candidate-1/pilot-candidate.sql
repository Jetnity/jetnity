-- OFFLINE CANDIDATE ONLY. Requires authority-candidate.sql and the unchanged
-- source Stage2 schema in an owned disposable fixture; no hosted apply path.
-- Body is the canonical pilot function plus the explicitly tested post-lock
-- trip/authority checks and bounded lock_timeout. No grant is created here.
begin;
create or replace function public.official_truth_application_pilot_run_v1(payload jsonb)
returns jsonb language plpgsql volatile security definer set search_path='' set lock_timeout='3s' as $$
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
  if not found then return null; end if;
  -- Source ownership/revision check occurred before a possible grant wait.
  -- Revalidate and hold that trip row; contention is a fail-closed error.
  perform t.id from public.trips t where t.id=(payload->>'tripId')::uuid
    and t.user_id=uid and t.revision=(payload->>'revision')::integer for share nowait;
  if not found then return null; end if;
  perform jetnity_ot_auth.require_current_owner_session_v1();
  if not g.enabled or clock_timestamp()>=g.expires_at then return null; end if;
  if payload->>'operation'='reserve' then
    if g.consumed_at is not null or payload->>'grantId' is not null then return null; end if;
    update private.official_truth_application_pilot_grants set consumed_at=clock_timestamp() where id=g.id;
  elsif g.consumed_at is null or g.id::text is distinct from payload->>'grantId' then return null;
  end if;
  return jsonb_build_object('id',g.id,'contractId',g.contract_id,'contractDigest',g.contract_digest,'expiresAt',g.expires_at);
end $$;
alter function public.official_truth_application_pilot_run_v1(jsonb) owner to postgres;
revoke all on function public.official_truth_application_pilot_run_v1(jsonb) from public,anon,service_role;
grant execute on function public.official_truth_application_pilot_run_v1(jsonb) to authenticated;
commit;
