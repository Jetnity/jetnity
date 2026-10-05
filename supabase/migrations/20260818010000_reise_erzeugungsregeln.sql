-- Erzeugungsregeln einer Reise – unabhängig davon, wer sie anlegt
--
-- Phase 1.5 hat `public.reise_anlegen()` als den Weg gebaut, auf dem eine Reise
-- entsteht: Kennung für die Idempotenz, Status immer `draft`, höchstens 60 neue
-- Reisen je Konto und Stunde. Nur war das eine Aussage über die Anwendung und
-- nicht über die Datenbank. `authenticated` hat `INSERT` auf `public.trips`, und
-- PostgREST macht dieses Recht öffentlich erreichbar. Ein angemeldeter Client
-- konnte damit
--
--   · beliebig viele Reisen direkt anlegen und die Schranke übergehen,
--   · die Kennung weglassen und die Idempotenz aushebeln, weil NULL in
--     PostgreSQL nicht mit NULL kollidiert und `unique (user_id, client_ref)`
--     eine Reise ohne Kennung deshalb gar nicht prüft,
--   · `status = 'booked'` behaupten, ohne je gebucht zu haben,
--   · `created_at` in die Vergangenheit legen – und selbst eine Schranke, die
--     direkte Einfügungen mitzählt, wäre damit wieder offen.
--
-- Zwei Wege standen zur Wahl:
--
--   a) `INSERT` auf `public.trips` entziehen und `reise_anlegen()` auf
--      `SECURITY DEFINER` umstellen. Dann gibt es genau einen Weg – aber RLS
--      gilt für vier Tabellen nur noch, weil der Funktionsrumpf es so meint.
--      Das Eigentum hinge an Code statt an Policies.
--
--   b) Die Regeln dort verankern, wo jeder Weg vorbeikommt: als Bedingung und
--      als Auslöser auf der Tabelle. RLS bleibt die Stelle, die über Eigentum
--      entscheidet; die Erzeugungsregeln gelten zusätzlich und für alle.
--
-- Diese Migration nimmt b) (ADR-0045). Ein direkter `INSERT` bleibt möglich,
-- ergibt aber dasselbe wie ein Aufruf von `reise_anlegen()` ohne Etappen: eine
-- eigene Reise mit Kennung, als Entwurf, innerhalb der Schranke.

-- ---------------------------------------------------------------------------
-- 1. Jede Reise trägt eine Kennung
-- ---------------------------------------------------------------------------
--
-- Die Kennung ist der Träger der Idempotenz. Solange sie NULL sein darf, ist
-- `trips_client_ref_eindeutig` für genau die Zeilen wirkungslos, bei denen es
-- darauf ankommt.
--
-- Der Nachtrag für bestehende Zeilen ist bewusst kein `delete`: Er gibt jeder
-- Reise ohne Kennung eine aus ihrer eigenen Kennung. Sie ist damit eindeutig,
-- verweist auf keinen Browserentwurf und löscht nichts.

update public.trips
   set client_ref = 'nachtrag-' || id::text
 where client_ref is null;

alter table public.trips
  alter column client_ref set not null;

alter table public.trips
  drop constraint trips_client_ref_laenge;

alter table public.trips
  add constraint trips_client_ref_laenge
    check (char_length(client_ref) between 1 and 64);

comment on column public.trips.client_ref is
  'Vom Client vergebene Kennung, verpflichtend. Trägt die Idempotenz: unique (user_id, client_ref) ergibt pro Konto eine Reise je Kennung – auf jedem Schreibweg (ADR-0045).';

-- ---------------------------------------------------------------------------
-- 2. Zeitstempel, Status und Schranke im Auslöser
-- ---------------------------------------------------------------------------
--
-- Ein `BEFORE INSERT`-Auslöser läuft vor jeder Einfügung, gleich ob sie aus
-- `reise_anlegen()`, aus PostgREST oder aus einer Konsole kommt. Er ist damit
-- die Stelle, an der die drei Regeln für alle gelten.
--
-- `SECURITY DEFINER`, damit die Zählung vollständig ist: Als `SECURITY INVOKER`
-- würde sie durch die Lesepolicy laufen und wäre nur so lange richtig, wie diese
-- Policy jede eigene Reise zeigt. Eine Schranke, die von einer Lesepolicy
-- abhängt, ist keine. Aufrufbar ist die Funktion trotzdem für niemanden – das
-- `revoke` unten entzieht das Ausführungsrecht, für einen Auslöser genügt das
-- Recht des Tabelleneigentümers.
--
-- Kein zusätzlicher Index: Die Zählung läuft über
-- `trips_user_id_updated_at_idx`, dessen führende Spalte `user_id` ist.

create or replace function public.reise_erzeugung_pruefen()
returns trigger
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
begin
  -- Die Zeitstempel gehören der Datenbank. Sie sind kein Feld der Oberfläche,
  -- und ein rückdatiertes `created_at` wäre der bequemste Weg an der Schranke
  -- vorbei: Zeilen ausserhalb des Fensters zählen nicht mit.
  new.created_at := now();
  new.updated_at := now();

  -- Eine neue Reise ist ein Entwurf. `planned`, `booked` oder `archived`
  -- entstehen aus einem Vorgang und nicht aus einer Behauptung beim Anlegen.
  if new.status <> 'draft' then
    raise exception 'Eine neue Reise beginnt als Entwurf.'
      using errcode = '22023';
  end if;

  -- Missbrauchsschranke: 60 neue Reisen je Konto und Stunde. Die Schranke ist
  -- bewusst eine Rate und keine Gesamtzahl – wie viele Reisen ein Konto besitzen
  -- darf, ist eine Produktentscheidung; wie schnell es sie anlegen kann, ist
  -- eine technische Frage.
  --
  -- `53400` ist `configuration_limit_exceeded` und damit für
  -- `lib/api/datenbank-lesen.ts` ein vorübergehendes Problem: „später erneut
  -- versuchen" ist hier die richtige Auskunft.
  if (select count(*) from public.trips
       where user_id = new.user_id
         and created_at >= now() - interval '1 hour') >= 60 then
    raise exception 'Zu viele neue Reisen in kurzer Zeit. Bitte versuche es später erneut.'
      using errcode = '53400';
  end if;

  return new;
end
$$;

comment on function public.reise_erzeugung_pruefen() is
  'Auslöser vor jeder Einfügung in public.trips: setzt created_at und updated_at, verlangt status = draft und begrenzt auf 60 neue Reisen je Konto und Stunde. Gilt für jeden Schreibweg, nicht nur für public.reise_anlegen() (ADR-0045).';

revoke all on function public.reise_erzeugung_pruefen() from public, anon, authenticated;

create trigger trips_erzeugung_pruefen
  before insert on public.trips
  for each row execute function public.reise_erzeugung_pruefen();

-- ---------------------------------------------------------------------------
-- 3. reise_anlegen() ohne eigene Schranke
-- ---------------------------------------------------------------------------
--
-- Die Schranke stand bis hier im Funktionsrumpf. Zwei Stellen mit derselben
-- Zahl driften auseinander, und die im Auslöser ist die vollständige: Sie
-- erfasst auch den direkten Weg. Der Rumpf ist ansonsten unverändert.

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

  -- 1. Die Reise selbst. Alles Weitere hängt daran. Über die Schranke und die
  -- Zeitstempel entscheidet der Auslöser `trips_erzeugung_pruefen`.
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
  'Legt eine Reise samt Etappen, Tagen und Planpunkten für das aufrufende Konto an. Idempotent über trips.client_ref: derselbe Aufruf ergibt dieselbe Reise. Trägt die Übernahme einer Gastreise und das Formular unter /planen. SECURITY INVOKER: RLS gilt, die Eigentümerkennung kommt aus auth.uid(), status ist immer draft. Über Kennung, Status, Zeitstempel und die Schranke von 60 neuen Reisen je Stunde entscheidet public.reise_erzeugung_pruefen() – auf jedem Schreibweg (ADR-0045).';
