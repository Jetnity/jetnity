-- Jetnity V2 – Phase 1.5: eine Reise anlegen, genau einmal
--
-- Eine Reise entsteht auf zwei Wegen, und beide brauchen dasselbe:
--
--   · Ein Gast plant unter /planen. Seine Reise liegt im `localStorage` – ein
--     Gast hat serverseitig bewusst keine Identität, weil ein Gastkonto in
--     `auth.users` Konten erzeugt, die niemand bestätigt, niemand löscht und
--     niemand verantwortet (DECISIONS.md ADR-0042). Bei Login oder
--     Registrierung muss diese Reise vollständig ins Konto wandern.
--   · Ein angemeldetes Konto plant unter /planen. Die Reise entsteht sofort in
--     der Datenbank.
--
-- Beides ist dieselbe Anweisung: „Lege diesen Reisegraphen für mich an, und
-- zwar genau einmal." Eine zweite Funktion dafür wäre eine zweite Stelle, an
-- der `status`, `user_id` und die Grenzen der Nutzlast geprüft werden – und
-- damit eine zweite Stelle, an der eine davon fehlen kann.
--
-- ---------------------------------------------------------------------------
-- Warum Idempotenz nur auf der Reise sitzt, nicht auf jedem Kind
-- ---------------------------------------------------------------------------
--
-- Ein Aufruf über PostgREST ist eine Anweisung und damit eine Transaktion.
-- Entweder die Reise **und** ihre Etappen, Tage und Planpunkte entstehen, oder
-- nichts entsteht. Ein halber Stand ist nicht erreichbar. Damit genügt eine
-- eindeutige Kennung auf der Reise: `unique (user_id, client_ref)`.
--
--   · Erster Aufruf   → Reise entsteht, Kinder entstehen, Kennung wird geliefert.
--   · Zweiter Aufruf  → `on conflict do nothing`, keine Zeile entsteht, dieselbe
--                       Kennung wird geliefert.
--   · Zwei parallele Aufrufe → der zweite wartet an der Eindeutigkeit, sieht
--                       danach die festgeschriebene Zeile und liefert sie.
--
-- Das deckt Reload, Retry, doppelten Request, mehrfachen Login und einen
-- Doppelklick auf „Reise erstellen" mit einer Bedingung ab.
--
-- Kindtabellen tragen deshalb bewusst keine `client_ref` und keinen eigenen
-- Eindeutigkeitsindex. Vier zusätzliche Indizes für einen Zustand, der nicht
-- eintreten kann, wären Aufwand ohne Nutzen.
--
-- ---------------------------------------------------------------------------
-- Warum SECURITY INVOKER
-- ---------------------------------------------------------------------------
--
-- Die Funktion braucht keine erhöhten Rechte. Sie schreibt ausschliesslich in
-- die Reisen des aufrufenden Kontos, und genau das erlauben die Policies
-- ohnehin. Als `SECURITY DEFINER` würde sie RLS umgehen – ein Weg, auf dem ein
-- Fehler in der Funktion sofort fremde Daten erreicht. Die Eigentümerkennung
-- kommt aus `auth.uid()` und nicht aus der Nutzlast; eine mitgeschickte
-- `user_id` wird nicht gelesen.

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
  _punkte integer;
begin
  if _uid is null then
    raise exception 'Um eine Reise zu speichern, ist eine Anmeldung erforderlich.'
      using errcode = '42501';
  end if;

  if _reise is null or jsonb_typeof(_reise) <> 'object' then
    raise exception 'Die Reise muss ein JSON-Objekt sein.' using errcode = '22023';
  end if;

  -- Obergrenze gegen einen aufgeblähten Aufruf. 256 KB sind ein Vielfaches
  -- dessen, was eine Reise mit 366 Tagen belegt.
  if pg_column_size(_reise) > 262144 then
    raise exception 'Die Reise ist zu gross.' using errcode = '22023';
  end if;

  _client_ref := _reise ->> 'client_ref';
  if _client_ref is null or char_length(_client_ref) not between 1 and 64 then
    raise exception 'Die Reise trägt keine brauchbare Kennung.' using errcode = '22023';
  end if;

  _etappen := coalesce(_reise -> 'stages', '[]'::jsonb);
  _tage := coalesce(_reise -> 'days', '[]'::jsonb);

  if jsonb_typeof(_etappen) <> 'array' or jsonb_typeof(_tage) <> 'array' then
    raise exception 'stages und days müssen Listen sein.' using errcode = '22023';
  end if;

  if jsonb_array_length(_etappen) > 50 then
    raise exception 'Eine Reise trägt höchstens 50 Etappen.' using errcode = '22023';
  end if;

  if jsonb_array_length(_tage) > 366 then
    raise exception 'Eine Reise trägt höchstens 366 Tage.' using errcode = '22023';
  end if;

  select coalesce(sum(jsonb_array_length(coalesce(t.wert -> 'items', '[]'::jsonb))), 0)
    into _punkte
    from jsonb_array_elements(_tage) as t(wert);

  if _punkte > 1000 then
    raise exception 'Eine Reise trägt höchstens 1000 Planpunkte.' using errcode = '22023';
  end if;

  -- 1. Die Reise selbst. Alles Weitere hängt daran.
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
    -- Status kommt nicht aus der Nutzlast: Eine neue Reise ist ein Entwurf, und
    -- `booked` darf niemand über diesen Weg behaupten.
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
    -- Schon angelegt. Weil Reise und Kinder in derselben Transaktion entstanden
    -- sind, ist der Stand vollständig; es gibt nichts nachzutragen.
    select id into _trip_id
      from public.trips
      where user_id = _uid and client_ref = _client_ref;
    return _trip_id;
  end if;

  -- 2. Etappen. `with ordinality` liefert die Reihenfolge der Liste, falls die
  -- Nutzlast keine `position` mitbringt.
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

  -- 3. Tage.
  insert into public.trip_days (trip_id, user_id, day_index, day_date, title)
  select
    _trip_id,
    _uid,
    coalesce((t.wert ->> 'day_index')::smallint, t.nr::smallint),
    (t.wert ->> 'day_date')::date,
    nullif(btrim(coalesce(t.wert ->> 'title', '')), '')
  from jsonb_array_elements(_tage) with ordinality as t(wert, nr);

  -- 4. Planpunkte. Die Zuordnung zum Tag läuft über `day_index`: Die lokalen
  -- Kennungen des Browsers werden nicht übernommen, sie sind in der Datenbank
  -- ohne Bedeutung.
  insert into public.trip_items (
    trip_id, user_id, day_id, kind, title, note, position, starts_at
  )
  select
    _trip_id,
    _uid,
    d.id,
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

  return _trip_id;
end
$$;

comment on function public.reise_anlegen(jsonb) is
  'Legt eine Reise samt Etappen, Tagen und Planpunkten für das aufrufende Konto an. Idempotent über trips.client_ref: derselbe Aufruf ergibt dieselbe Reise. Trägt die Übernahme einer Gastreise und das Formular unter /planen. SECURITY INVOKER: RLS gilt, die Eigentümerkennung kommt aus auth.uid(), status ist immer draft.';

revoke all on function public.reise_anlegen(jsonb) from public, anon;
grant execute on function public.reise_anlegen(jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- Kennzahlen für den Administrationsbereich
-- ---------------------------------------------------------------------------
--
-- Die Startseite der Administration zog ihre Zahlen bis hierher aus
-- `creator_sessions` – der Tabelle der alten Produktidee. Sie soll Reisen
-- zählen.
--
-- Reisen sind privat: Keine Policy öffnet `public.trips` für ein fremdes Konto
-- (ADR-0041). Für eine Zählung ist das kein Widerspruch, wohl aber für eine
-- Abfrage über die Tabelle – RLS würde jede Zeile wegfiltern und die
-- Administration bekäme still eine Null. Genau diese Verwechslung von „nicht
-- berechtigt“ mit „nichts vorhanden“ hat Phase 1.4 aufgeräumt.
--
-- Deshalb zwei `SECURITY DEFINER`-Funktionen, die ausschliesslich Aggregate
-- liefern: Anzahlen, keine Titel, keine Ziele, keine Kennungen. Beide prüfen
-- die Fähigkeit `betrieb-lesen` selbst, wie `admin_payments_summary_30d` es
-- schon tut, und liefern ohne sie keine Zeile.

create or replace function public.admin_reisen_kennzahlen()
returns table (
  reisen_30d bigint,
  reisen_gesamt bigint,
  konten_mit_reise_30d bigint
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    coalesce((select count(*) from public.trips
              where created_at >= now() - interval '30 days'), 0),
    coalesce((select count(*) from public.trips), 0),
    coalesce((select count(distinct user_id) from public.trips
              where created_at >= now() - interval '30 days'), 0)
  where public.darf_betrieb_lesen();
$$;

comment on function public.admin_reisen_kennzahlen() is
  'Anzahl Reisen der letzten 30 Tage, insgesamt und Anzahl Konten mit Reise. Nur Aggregate, keine Reiseinhalte. Liefert ohne die Fähigkeit betrieb-lesen keine Zeile.';

create or replace function public.admin_reisen_zeitreihe(_tage integer default 14)
returns table (
  tag date,
  anzahl bigint
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  -- `generate_series` links, damit ein Tag ohne Reise als 0 erscheint und nicht
  -- fehlt. Ein fehlender Tag wäre in der Kurve eine Lücke, keine Null.
  select reihe.tag::date,
         count(t.id)
  from generate_series(
         current_date - (least(greatest(coalesce(_tage, 14), 1), 90) - 1),
         current_date,
         interval '1 day'
       ) as reihe(tag)
  left join public.trips t
    on t.created_at >= reihe.tag
   and t.created_at < reihe.tag + interval '1 day'
  where public.darf_betrieb_lesen()
  group by reihe.tag
  order by reihe.tag;
$$;

comment on function public.admin_reisen_zeitreihe(integer) is
  'Neue Reisen je Tag über die letzten _tage Tage, höchstens 90. Nur Anzahlen. Liefert ohne die Fähigkeit betrieb-lesen keine Zeile.';

revoke all on function public.admin_reisen_kennzahlen() from public, anon;
revoke all on function public.admin_reisen_zeitreihe(integer) from public, anon;
grant execute on function public.admin_reisen_kennzahlen() to authenticated;
grant execute on function public.admin_reisen_zeitreihe(integer) to authenticated;
