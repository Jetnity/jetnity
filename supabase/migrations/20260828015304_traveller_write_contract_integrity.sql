-- P2-TA-04 C1: Traveller write-contract integrity
--
-- Schliesst die drei Gate-0-Integritätslücken, ohne Privilegien oder
-- SECURITY-DEFINER-Semantik zu ändern:
--   1) kanonischer SECURITY-INVOKER-Delete-RPC `party_loeschen`
--   2) max. 20 Traveller je (user_id, trip_id), concurrency-safe
--   3) Child-Limits 8/12 auch bei UPDATE/Reparenting
--
-- Nur Development. Production nicht ohne separates Product-Owner-Apply-Gate.
-- Kein GRANT/REVOKE an Tabellen. Keine RLS-Änderung. Kein SECURITY DEFINER.

create or replace function public.trip_traveller_party_limit_pruefen()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  -- FOR NO KEY UPDATE serialisiert Writes derselben Reise, ohne mit dem
  -- Composite-FK KEY SHARE auf trips zu deadlocken (gleiche Begründung
  -- wie ADR-0121 für Child-Limits). Ein nacktes count(*) ohne diese
  -- Sperre wäre unter parallelen INSERTs/Reparents ein MVCC-Fenster.
  perform 1
  from public.trips
  where id = new.trip_id
    and user_id = new.user_id
  for no key update;

  if (
    select count(*) from public.trip_travellers
    where trip_id = new.trip_id
      and user_id = new.user_id
  ) > 20 then
    raise exception 'Eine Reise trägt höchstens 20 Reisendenprofile.'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

comment on function public.trip_traveller_party_limit_pruefen() is
  'AFTER INSERT oder UPDATE von trip_id/user_id auf trip_travellers: höchstens 20 Reisende je (user_id, trip_id). Serialisiert über FOR NO KEY UPDATE auf der Reise. SECURITY INVOKER.';

drop trigger if exists trip_travellers_party_limit on public.trip_travellers;

create trigger trip_travellers_party_limit
  after insert or update of trip_id, user_id on public.trip_travellers
  for each row
  execute function public.trip_traveller_party_limit_pruefen();

create or replace function public.trip_traveller_kinder_limit_pruefen()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  perform 1
  from public.trip_travellers
  where id = new.traveller_id
    and trip_id = new.trip_id
    and user_id = new.user_id
  for no key update;

  if tg_table_name = 'trip_traveller_citizenships' then
    if (
      select count(*) from public.trip_traveller_citizenships
      where traveller_id = new.traveller_id
    ) > 8 then
      raise exception 'Ein Reisender trägt höchstens 8 Staatsbürgerschaften.'
        using errcode = 'check_violation';
    end if;
  elsif tg_table_name = 'trip_traveller_documents' then
    if (
      select count(*) from public.trip_traveller_documents
      where traveller_id = new.traveller_id
    ) > 12 then
      raise exception 'Ein Reisender trägt höchstens 12 Reisedokumente.'
        using errcode = 'check_violation';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trip_traveller_citizenships_limit on public.trip_traveller_citizenships;
create trigger trip_traveller_citizenships_limit
  after insert or update on public.trip_traveller_citizenships
  for each row
  execute function public.trip_traveller_kinder_limit_pruefen();

drop trigger if exists trip_traveller_documents_limit on public.trip_traveller_documents;
create trigger trip_traveller_documents_limit
  after insert or update on public.trip_traveller_documents
  for each row
  execute function public.trip_traveller_kinder_limit_pruefen();

create or replace function public.party_loeschen(_payload jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  _uid uuid := auth.uid();
  _trip uuid;
  _client_ref text;
  _deleted int := 0;
begin
  if _uid is null then
    raise exception 'NOT_AUTHENTICATED' using errcode = '42501';
  end if;

  if _payload is null or jsonb_typeof(_payload) <> 'object' then
    raise exception 'INVALID_PAYLOAD' using errcode = '22023';
  end if;

  begin
    _trip := (_payload ->> 'tripId')::uuid;
  exception
    when others then
      raise exception 'INVALID_TRIP' using errcode = '22023';
  end;

  if _trip is null then
    raise exception 'INVALID_TRIP' using errcode = '22023';
  end if;

  _client_ref := nullif(btrim(coalesce(_payload ->> 'clientRef', '')), '');
  if _client_ref is null or char_length(_client_ref) > 64 then
    raise exception 'INVALID_CLIENT_REF' using errcode = '22023';
  end if;

  if not exists (
    select 1 from public.trips t
    where t.id = _trip and t.user_id = _uid
  ) then
    raise exception 'TRIP_NOT_FOUND' using errcode = '42501';
  end if;

  delete from public.trip_travellers
  where trip_id = _trip
    and user_id = _uid
    and client_ref = _client_ref;

  get diagnostics _deleted = row_count;

  return jsonb_build_object('ok', true, 'deleted', _deleted);
end;
$$;

revoke all on function public.party_loeschen(jsonb) from public;
revoke all on function public.party_loeschen(jsonb) from anon;
grant execute on function public.party_loeschen(jsonb) to authenticated;

comment on function public.party_loeschen(jsonb) is
  'Kanonisches Traveller-Delete: tripId + clientRef, nur eigene Reise. SECURITY INVOKER. Idempotent bei fehlender Ref. Children/Readiness folgen bestehenden CASCADE-FKs.';
