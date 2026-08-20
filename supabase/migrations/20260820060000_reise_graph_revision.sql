-- Jetnity V2 – Phase 2.2 Nachtrag: Graph-Revision und ungeplante Gastpunkte
--
-- 1. Jede fachliche Änderung an trip_stages, trip_days oder trip_items erhöht
--    trips.revision und setzt trips.updated_at. Direkte Schreibwege
--    (planpunktAnlegen, planpunktEntfernen, PostgREST) zählen damit mit.
-- 2. reise_anlegen() und reise_aendern() setzen jetnity.graph_mutation, damit
--    ihre Kindzeilen die Fassung nicht ein zweites Mal erhöhen.
-- 3. reise_anlegen() übernimmt ungeplante Planpunkte (day_id null), damit die
--    Gastübernahme ohneTag erhält.
--
-- Auslöser statt eigener RPCs: Jeder Schreibweg zählt, ohne die Anwendung
-- umbauen zu müssen. SECURITY INVOKER: RLS bleibt die Eigentumsprüfung.


create or replace function public.reise_graph_geaendert()
returns trigger
language plpgsql
volatile
security invoker
set search_path = public, pg_temp
as $$
begin
  if current_setting('jetnity.graph_mutation', true) = '1' then
    return null;
  end if;

  update public.trips
     set revision = revision + 1
   where id in (select distinct trip_id from geaendert);

  return null;
end
$$;

comment on function public.reise_graph_geaendert() is
  'AFTER STATEMENT auf trip_stages, trip_days und trip_items: erhöht trips.revision der betroffenen Reisen und damit updated_at. Übersprungen, wenn jetnity.graph_mutation in derselben Transaktion gesetzt ist (reise_anlegen, reise_aendern).';

revoke all on function public.reise_graph_geaendert() from public, anon, authenticated;

create trigger trip_stages_graph_ins
  after insert on public.trip_stages
  referencing new table as geaendert
  for each statement
  execute function public.reise_graph_geaendert();

create trigger trip_stages_graph_upd
  after update on public.trip_stages
  referencing new table as geaendert
  for each statement
  execute function public.reise_graph_geaendert();

create trigger trip_stages_graph_del
  after delete on public.trip_stages
  referencing old table as geaendert
  for each statement
  execute function public.reise_graph_geaendert();

create trigger trip_days_graph_ins
  after insert on public.trip_days
  referencing new table as geaendert
  for each statement
  execute function public.reise_graph_geaendert();

create trigger trip_days_graph_upd
  after update on public.trip_days
  referencing new table as geaendert
  for each statement
  execute function public.reise_graph_geaendert();

create trigger trip_days_graph_del
  after delete on public.trip_days
  referencing old table as geaendert
  for each statement
  execute function public.reise_graph_geaendert();

create trigger trip_items_graph_ins
  after insert on public.trip_items
  referencing new table as geaendert
  for each statement
  execute function public.reise_graph_geaendert();

create trigger trip_items_graph_upd
  after update on public.trip_items
  referencing new table as geaendert
  for each statement
  execute function public.reise_graph_geaendert();

create trigger trip_items_graph_del
  after delete on public.trip_items
  referencing old table as geaendert
  for each statement
  execute function public.reise_graph_geaendert();

comment on column public.trips.revision is
  'Technische Fassung des Reisegraphen. Steigt bei jeder fachlichen Änderung an der Reise oder ihren Kindzeilen. Ein Änderungsvorschlag nennt die Fassung, auf der er beruht.';


create or replace function public.reise_anlegen(_reise jsonb)
returns uuid
language plpgsql
volatile
security invoker
set search_path = public, pg_temp
as $$
declare
  _uid uuid := (select auth.uid());
  _client_ref text;
  _trip_id uuid;
  _etappen jsonb;
  _tage jsonb;
  _ungeplante jsonb;
  _punkte integer;
begin
  if _uid is null then
    raise exception 'Um eine Reise zu speichern, ist eine Anmeldung erforderlich.'
      using errcode = '42501';
  end if;

  if _reise is null or jsonb_typeof(_reise) <> 'object' then
    raise exception 'Die Reise muss ein JSON-Objekt sein.' using errcode = '22023';
  end if;

  if pg_column_size(_reise) > 262144 then
    raise exception 'Die Reise ist zu gross.' using errcode = '22023';
  end if;

  _client_ref := _reise ->> 'client_ref';
  if _client_ref is null or char_length(_client_ref) not between 1 and 64 then
    raise exception 'Die Reise trägt keine brauchbare Kennung.' using errcode = '22023';
  end if;

  _etappen := coalesce(_reise -> 'stages', '[]'::jsonb);
  _tage := coalesce(_reise -> 'days', '[]'::jsonb);
  _ungeplante := coalesce(_reise -> 'ungeplante', '[]'::jsonb);

  if jsonb_typeof(_etappen) <> 'array'
     or jsonb_typeof(_tage) <> 'array'
     or jsonb_typeof(_ungeplante) <> 'array' then
    raise exception 'stages, days und ungeplante müssen Listen sein.' using errcode = '22023';
  end if;

  if jsonb_array_length(_etappen) > 50 then
    raise exception 'Eine Reise trägt höchstens 50 Etappen.' using errcode = '22023';
  end if;

  if jsonb_array_length(_tage) > 366 then
    raise exception 'Eine Reise trägt höchstens 366 Tage.' using errcode = '22023';
  end if;

  select coalesce(sum(jsonb_array_length(coalesce(t.wert -> 'items', '[]'::jsonb))), 0)
         + jsonb_array_length(_ungeplante)
    into _punkte
    from jsonb_array_elements(_tage) as t(wert);

  if _punkte > 1000 then
    raise exception 'Eine Reise trägt höchstens 1000 Planpunkte.' using errcode = '22023';
  end if;

  insert into public.trips (
    user_id, client_ref, title, origin, start_date, end_date, travellers,
    currency, budget_amount, status, pace, interests, travel_wish
  )
  values (
    _uid,
    _client_ref,
    btrim(coalesce(_reise ->> 'title', '')),
    nullif(btrim(coalesce(_reise ->> 'origin', '')), ''),
    (_reise ->> 'start_date')::date,
    (_reise ->> 'end_date')::date,
    coalesce((_reise ->> 'travellers')::smallint, 1),
    coalesce(nullif(_reise ->> 'currency', ''), 'CHF'),
    (_reise ->> 'budget_amount')::numeric,
    'draft',
    coalesce(nullif(_reise ->> 'pace', ''), 'balanced'),
    coalesce(
      (select array_agg(distinct w)
         from jsonb_array_elements_text(coalesce(_reise -> 'interests', '[]'::jsonb)) as w),
      '{}'::text[]
    ),
    nullif(btrim(coalesce(_reise ->> 'travel_wish', '')), '')
  )
  on conflict (user_id, client_ref) do nothing
  returning id into _trip_id;

  if _trip_id is null then
    select id into _trip_id
      from public.trips
      where user_id = _uid and client_ref = _client_ref;
    return _trip_id;
  end if;

  -- Kindzeilen dürfen die Fassung der neuen Reise nicht hochzählen.
  perform set_config('jetnity.graph_mutation', '1', true);

  insert into public.trip_stages (
    trip_id, user_id, position, name, country_code, arrival_date, departure_date
  )
  select
    _trip_id,
    _uid,
    coalesce((e.wert ->> 'position')::smallint, e.nr::smallint),
    btrim(coalesce(e.wert ->> 'name', '')),
    nullif(upper(btrim(coalesce(e.wert ->> 'country_code', ''))), ''),
    (e.wert ->> 'arrival_date')::date,
    (e.wert ->> 'departure_date')::date
  from jsonb_array_elements(_etappen) with ordinality as e(wert, nr);

  insert into public.trip_days (trip_id, user_id, day_index, day_date, title, stage_id)
  select
    _trip_id,
    _uid,
    coalesce((t.wert ->> 'day_index')::smallint, t.nr::smallint),
    (t.wert ->> 'day_date')::date,
    nullif(btrim(coalesce(t.wert ->> 'title', '')), ''),
    s.id
  from jsonb_array_elements(_tage) with ordinality as t(wert, nr)
  left join lateral (
    select st.id
      from public.trip_stages st
     where st.trip_id = _trip_id
       and st.position = coalesce(
             (t.wert ->> 'stage_position')::smallint,
             case
               when (select count(*) from public.trip_stages x where x.trip_id = _trip_id) = 1
                 then 1
               else null
             end
           )
     order by st.created_at, st.id
     limit 1
  ) as s on true;

  -- Tage ohne stage_position und ohne einzige Etappe: Datum, sonst Anteil.
  update public.trip_days d
     set stage_id = s.id
    from public.trip_stages s
   where d.trip_id = _trip_id
     and d.stage_id is null
     and s.trip_id = _trip_id
     and d.day_date is not null
     and s.arrival_date is not null
     and s.departure_date is not null
     and d.day_date >= s.arrival_date
     and d.day_date <= s.departure_date
     and not exists (
           select 1
             from public.trip_stages s2
            where s2.trip_id = _trip_id
              and s2.id <> s.id
              and s2.arrival_date is not null
              and s2.departure_date is not null
              and d.day_date >= s2.arrival_date
              and d.day_date <= s2.departure_date
              and (s2.position < s.position or (s2.position = s.position and s2.id < s.id))
         );

  with etappen as (
    select
      st.id,
      row_number() over (order by st.position, st.id) as nr,
      count(*) over () as anzahl
    from public.trip_stages st
    where st.trip_id = _trip_id
  ),
  tage as (
    select
      d.id,
      row_number() over (order by d.day_index, d.id) as nr,
      count(*) over () as anzahl
    from public.trip_days d
    where d.trip_id = _trip_id
      and d.stage_id is null
  )
  update public.trip_days d
     set stage_id = e.id
    from tage t
    join etappen e
      on e.nr = least(
           e.anzahl,
           greatest(1, ceil(t.nr::numeric * e.anzahl / greatest(t.anzahl, 1)))
         )
   where d.id = t.id
     and e.anzahl > 0;

  insert into public.trip_items (
    trip_id, user_id, day_id, stage_id, kind, title, note, position, starts_at
  )
  select
    _trip_id,
    _uid,
    d.id,
    d.stage_id,
    coalesce(nullif(p.wert ->> 'kind', ''), 'note'),
    btrim(coalesce(p.wert ->> 'title', '')),
    nullif(btrim(coalesce(p.wert ->> 'note', '')), ''),
    coalesce((p.wert ->> 'position')::smallint, p.pos::smallint),
    (nullif(p.wert ->> 'starts_at', ''))::time
  from jsonb_array_elements(_tage) with ordinality as t(wert, nr)
  cross join lateral jsonb_array_elements(coalesce(t.wert -> 'items', '[]'::jsonb))
    with ordinality as p(wert, pos)
  join public.trip_days d
    on d.trip_id = _trip_id
   and d.day_index = coalesce((t.wert ->> 'day_index')::smallint, t.nr::smallint);

  insert into public.trip_items (
    trip_id, user_id, day_id, stage_id, kind, title, note, position, starts_at
  )
  select
    _trip_id,
    _uid,
    null,
    null,
    coalesce(nullif(p.wert ->> 'kind', ''), 'note'),
    btrim(coalesce(p.wert ->> 'title', '')),
    nullif(btrim(coalesce(p.wert ->> 'note', '')), ''),
    coalesce((p.wert ->> 'position')::smallint, p.pos::smallint),
    (nullif(p.wert ->> 'starts_at', ''))::time
  from jsonb_array_elements(_ungeplante) with ordinality as p(wert, pos);

  return _trip_id;
end
$$;

comment on function public.reise_anlegen(jsonb) is
  'Legt eine Reise samt Etappen, Tagen und Planpunkten für das aufrufende Konto an. Idempotent über trips.client_ref. SECURITY INVOKER. Tage erhalten stage_id über stage_position, die einzige Etappe, den Datumsvergleich oder eine proportionale Aufteilung. Ungeplante Planpunkte kommen aus ungeplante. Kindzeilen zählen die Fassung nicht hoch. Die Missbrauchsschranke liegt im Auslöser trips_erzeugung_pruefen, nicht in dieser Funktion (ADR-0045, ADR-0048).';

create or replace function public.reise_aendern(_aenderung jsonb)
returns jsonb
language plpgsql
volatile
security invoker
set search_path = public, pg_temp
as $$
declare
  _uid uuid := (select auth.uid());
  _trip_id uuid;
  _basis integer;
  _mutation text;
  _rev integer;
  _last text;
  _etappen jsonb;
  _tage jsonb;
  _ungeplante jsonb;
  _punkte integer;
  _stage_ids uuid[];
  _day_ids uuid[];
  _item_ids uuid[];
begin
  if _uid is null then
    raise exception 'Um eine Reise zu speichern, ist eine Anmeldung erforderlich.'
      using errcode = '42501';
  end if;

  if _aenderung is null or jsonb_typeof(_aenderung) <> 'object' then
    raise exception 'Die Änderung muss ein JSON-Objekt sein.' using errcode = '22023';
  end if;

  if pg_column_size(_aenderung) > 262144 then
    raise exception 'Die Reise ist zu gross.' using errcode = '22023';
  end if;

  begin
    _trip_id := (_aenderung ->> 'trip_id')::uuid;
  exception when invalid_text_representation then
    raise exception 'Diese Reise ist unbekannt.' using errcode = '22023';
  end;

  if _trip_id is null then
    raise exception 'Diese Reise ist unbekannt.' using errcode = '22023';
  end if;

  _mutation := nullif(btrim(coalesce(_aenderung ->> 'mutation_id', '')), '');
  if _mutation is null or char_length(_mutation) not between 1 and 64 then
    raise exception 'Die Änderung trägt keine brauchbare Kennung.' using errcode = '22023';
  end if;

  begin
    _basis := (_aenderung ->> 'basis_revision')::integer;
  exception when invalid_text_representation then
    _basis := null;
  end;

  if _basis is null or _basis < 1 then
    raise exception 'Die Änderung bezieht sich auf keine gültige Fassung der Reise.'
      using errcode = '22023';
  end if;

  _etappen := coalesce(_aenderung -> 'stages', '[]'::jsonb);
  _tage := coalesce(_aenderung -> 'days', '[]'::jsonb);
  _ungeplante := coalesce(_aenderung -> 'ungeplante', '[]'::jsonb);

  if jsonb_typeof(_etappen) <> 'array'
     or jsonb_typeof(_tage) <> 'array'
     or jsonb_typeof(_ungeplante) <> 'array' then
    raise exception 'stages, days und ungeplante müssen Listen sein.' using errcode = '22023';
  end if;

  if jsonb_array_length(_etappen) > 50 then
    raise exception 'Eine Reise trägt höchstens 50 Etappen.' using errcode = '22023';
  end if;

  if jsonb_array_length(_tage) > 366 then
    raise exception 'Eine Reise trägt höchstens 366 Tage.' using errcode = '22023';
  end if;

  select coalesce(sum(jsonb_array_length(coalesce(t.wert -> 'items', '[]'::jsonb))), 0)
         + jsonb_array_length(_ungeplante)
    into _punkte
    from jsonb_array_elements(_tage) as t(wert);

  if _punkte > 1000 then
    raise exception 'Eine Reise trägt höchstens 1000 Planpunkte.' using errcode = '22023';
  end if;

  select t.revision, t.last_mutation_id
    into _rev, _last
    from public.trips t
   where t.id = _trip_id
   for update;

  if not found then
    raise exception 'Diese Reise ist unbekannt.' using errcode = 'P0001';
  end if;

  -- Retry derselben bereits übernommenen Änderung: Erfolg, nichts tun.
  if _last is not null and _last = _mutation then
    return jsonb_build_object('id', _trip_id, 'revision', _rev);
  end if;

  if _rev is distinct from _basis then
    raise exception 'Diese Reise hat sich inzwischen geändert. Bitte lade sie neu und versuche die Änderung erneut.'
      using errcode = 'P0001';
  end if;

  update public.trips
     set title = btrim(coalesce(_aenderung ->> 'title', '')),
         origin = nullif(btrim(coalesce(_aenderung ->> 'origin', '')), ''),
         start_date = (_aenderung ->> 'start_date')::date,
         end_date = (_aenderung ->> 'end_date')::date,
         travellers = coalesce((_aenderung ->> 'travellers')::smallint, travellers),
         currency = coalesce(nullif(_aenderung ->> 'currency', ''), currency),
         budget_amount = (_aenderung ->> 'budget_amount')::numeric,
         pace = coalesce(nullif(_aenderung ->> 'pace', ''), pace),
         interests = coalesce(
           (select array_agg(distinct w)
              from jsonb_array_elements_text(coalesce(_aenderung -> 'interests', '[]'::jsonb)) as w),
           '{}'::text[]
         ),
         travel_wish = nullif(btrim(coalesce(_aenderung ->> 'travel_wish', '')), ''),
         revision = revision + 1,
         last_mutation_id = _mutation
   where id = _trip_id
     and revision = _basis;

  if not found then
    raise exception 'Diese Reise hat sich inzwischen geändert. Bitte lade sie neu und versuche die Änderung erneut.'
      using errcode = 'P0001';
  end if;

  -- Die Kindzeilen dieser Transaktion dürfen revision nicht noch einmal erhöhen.
  perform set_config('jetnity.graph_mutation', '1', true);

  -- Etappen: neue zuerst, dann bestehende, dann überzählige entfernen.
  insert into public.trip_stages (
    id, trip_id, user_id, position, name, country_code, arrival_date, departure_date,
    latitude, longitude
  )
  select
    (e.wert ->> 'id')::uuid,
    _trip_id,
    _uid,
    coalesce((e.wert ->> 'position')::smallint, e.nr::smallint),
    btrim(coalesce(e.wert ->> 'name', '')),
    nullif(upper(btrim(coalesce(e.wert ->> 'country_code', ''))), ''),
    (e.wert ->> 'arrival_date')::date,
    (e.wert ->> 'departure_date')::date,
    (e.wert ->> 'latitude')::numeric,
    (e.wert ->> 'longitude')::numeric
  from jsonb_array_elements(_etappen) with ordinality as e(wert, nr)
  where not exists (
    select 1 from public.trip_stages s
     where s.id = (e.wert ->> 'id')::uuid
  );

  update public.trip_stages s
     set position = coalesce((e.wert ->> 'position')::smallint, s.position),
         name = btrim(coalesce(e.wert ->> 'name', s.name)),
         country_code = nullif(upper(btrim(coalesce(e.wert ->> 'country_code', ''))), ''),
         arrival_date = (e.wert ->> 'arrival_date')::date,
         departure_date = (e.wert ->> 'departure_date')::date,
         latitude = coalesce((e.wert ->> 'latitude')::numeric, s.latitude),
         longitude = coalesce((e.wert ->> 'longitude')::numeric, s.longitude)
    from jsonb_array_elements(_etappen) as e(wert)
   where s.trip_id = _trip_id
     and s.id = (e.wert ->> 'id')::uuid;

  insert into public.trip_days (
    id, trip_id, user_id, day_index, day_date, title, stage_id
  )
  select
    (t.wert ->> 'id')::uuid,
    _trip_id,
    _uid,
    coalesce((t.wert ->> 'day_index')::smallint, t.nr::smallint),
    (t.wert ->> 'day_date')::date,
    nullif(btrim(coalesce(t.wert ->> 'title', '')), ''),
    nullif(t.wert ->> 'stage_id', '')::uuid
  from jsonb_array_elements(_tage) with ordinality as t(wert, nr)
  where not exists (
    select 1 from public.trip_days d
     where d.id = (t.wert ->> 'id')::uuid
  );

  update public.trip_days d
     set day_index = coalesce((t.wert ->> 'day_index')::smallint, d.day_index),
         day_date = (t.wert ->> 'day_date')::date,
         title = nullif(btrim(coalesce(t.wert ->> 'title', '')), ''),
         stage_id = nullif(t.wert ->> 'stage_id', '')::uuid
    from jsonb_array_elements(_tage) as t(wert)
   where d.trip_id = _trip_id
     and d.id = (t.wert ->> 'id')::uuid;

  -- Planpunkte aus Tagen und aus der ungeplanten Liste.
  with punkte as (
    select p.wert, (t.wert ->> 'id') as day_id
      from jsonb_array_elements(_tage) as t(wert)
      cross join lateral jsonb_array_elements(coalesce(t.wert -> 'items', '[]'::jsonb)) as p(wert)
    union all
    select u.wert, null
      from jsonb_array_elements(_ungeplante) as u(wert)
  )
  insert into public.trip_items (
    id, trip_id, user_id, day_id, stage_id, kind, title, note, position,
    starts_on, starts_at, ends_on, ends_at
  )
  select
    (p.wert ->> 'id')::uuid,
    _trip_id,
    _uid,
    coalesce(nullif(p.wert ->> 'day_id', ''), p.day_id)::uuid,
    nullif(p.wert ->> 'stage_id', '')::uuid,
    coalesce(nullif(p.wert ->> 'kind', ''), 'note'),
    btrim(coalesce(p.wert ->> 'title', '')),
    nullif(btrim(coalesce(p.wert ->> 'note', '')), ''),
    coalesce((p.wert ->> 'position')::smallint, 1),
    (p.wert ->> 'starts_on')::date,
    (nullif(p.wert ->> 'starts_at', ''))::time,
    (p.wert ->> 'ends_on')::date,
    (nullif(p.wert ->> 'ends_at', ''))::time
  from punkte p
  where not exists (
    select 1 from public.trip_items i
     where i.id = (p.wert ->> 'id')::uuid
  );

  with punkte as (
    select p.wert, (t.wert ->> 'id') as day_id
      from jsonb_array_elements(_tage) as t(wert)
      cross join lateral jsonb_array_elements(coalesce(t.wert -> 'items', '[]'::jsonb)) as p(wert)
    union all
    select u.wert, null
      from jsonb_array_elements(_ungeplante) as u(wert)
  )
  update public.trip_items i
     set day_id = coalesce(nullif(p.wert ->> 'day_id', ''), p.day_id)::uuid,
         stage_id = nullif(p.wert ->> 'stage_id', '')::uuid,
         kind = coalesce(nullif(p.wert ->> 'kind', ''), i.kind),
         title = btrim(coalesce(p.wert ->> 'title', i.title)),
         note = nullif(btrim(coalesce(p.wert ->> 'note', '')), ''),
         position = coalesce((p.wert ->> 'position')::smallint, i.position),
         starts_on = (p.wert ->> 'starts_on')::date,
         starts_at = (nullif(p.wert ->> 'starts_at', ''))::time,
         ends_on = (p.wert ->> 'ends_on')::date,
         ends_at = (nullif(p.wert ->> 'ends_at', ''))::time
    from punkte p
   where i.trip_id = _trip_id
     and i.id = (p.wert ->> 'id')::uuid;

  select coalesce(array_agg((e.wert ->> 'id')::uuid), '{}')
    into _stage_ids
    from jsonb_array_elements(_etappen) as e(wert);

  select coalesce(array_agg((t.wert ->> 'id')::uuid), '{}')
    into _day_ids
    from jsonb_array_elements(_tage) as t(wert);

  select coalesce(array_agg((p.wert ->> 'id')::uuid), '{}')
    into _item_ids
    from (
      select p.wert
        from jsonb_array_elements(_tage) as t(wert)
        cross join lateral jsonb_array_elements(coalesce(t.wert -> 'items', '[]'::jsonb)) as p(wert)
      union all
      select u.wert
        from jsonb_array_elements(_ungeplante) as u(wert)
    ) as p;

  delete from public.trip_items i
   where i.trip_id = _trip_id
     and not (i.id = any (_item_ids));

  delete from public.trip_days d
   where d.trip_id = _trip_id
     and not (d.id = any (_day_ids));

  delete from public.trip_stages s
   where s.trip_id = _trip_id
     and not (s.id = any (_stage_ids));

  return jsonb_build_object(
    'id', _trip_id,
    'revision', _basis + 1
  );
end
$$;

comment on function public.reise_aendern(jsonb) is
  'Übernimmt eine geprüfte Änderung an einer bestehenden Reise des aufrufenden Kontos. SECURITY INVOKER, atomisch, prüft trips.revision, ist über last_mutation_id idempotent und überschreibt keine kommerziellen Felder. Bestehende Kennungen unveränderter Zeilen bleiben. Kindzeilen zählen die Fassung in dieser Transaktion nicht ein zweites Mal.';

revoke all on function public.reise_aendern(jsonb) from public, anon;
grant execute on function public.reise_aendern(jsonb) to authenticated;
