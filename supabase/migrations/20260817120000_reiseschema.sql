-- Jetnity V2 – Phase 1.5: das reale Reisedatenmodell
--
-- Bis hierher existierte eine Reise ausschliesslich im `localStorage` des
-- Browsers (`lib/trips/guest-store.ts`). Damit lässt sich der Produktkern nicht
-- bauen: Ohne Persistenz gibt es keine „Meine Reisen“, ohne Struktur keine
-- Preisübersicht, kein Budget über die ganze Reise und keine Übergabe an einen
-- Anbieter. Der Trip Builder aus Phase 2 wäre eine Demo.
--
-- Diese Migration legt vier Tabellen an. Sie sind aus den Produktanforderungen
-- abgeleitet, nicht aus der bestehenden Datenstruktur:
--
--   trips        eine Reise: Titel, Zeitraum, Reisende, Währung, Budget, Status
--   trip_stages  Etappen und Orte einer Reise, in Reihenfolge
--   trip_days    Reisetage, mit oder ohne festes Datum
--   trip_items   Planpunkte: Flug, Unterkunft, Aktivität, Transfer, freie Notiz
--
-- ---------------------------------------------------------------------------
-- Getroffene Entscheidungen und ihre Begründung
-- ---------------------------------------------------------------------------
--
-- **CHECK statt Enum.** Jeder Wertebereich – Status, Tempo, Art eines
-- Planpunkts, Interessen – steht in einem CHECK, nicht in einem Enum-Typ. Das
-- Schema führt diese Entscheidung bereits für `creator_profiles.role` und
-- `.status`. Ein Enum lässt sich nur erweitern, nie kürzen; einen Wert
-- zurückzunehmen erfordert einen neuen Typ samt Umschreiben aller Spalten. Ein
-- CHECK ist eine Zeile in der nächsten Migration. Für ein Produkt, dessen
-- Wertebereiche in Phase 2 und 3 noch wachsen, ist das der belastbarere Weg.
--
-- **Eigentum ist nicht vom Client setzbar.** `user_id` trägt
-- `default auth.uid()`, und jede Policy verlangt in `using` **und**
-- `with check`, dass `user_id = auth.uid()` gilt. Eine mitgeschickte fremde
-- `user_id` scheitert am `with check` der INSERT-Policy; ein `update … set
-- user_id = <fremd>` scheitert am `with check` der UPDATE-Policy. Die Spalte
-- ist damit faktisch unveränderlich, ohne dass ein Auslöser nötig wäre.
--
-- **`user_id` steht auch auf den Kindtabellen.** Der übliche Weg wäre eine
-- Policy mit `exists (select 1 from trips …)`. Diese Unterabfrage läuft je
-- Zeile und je Operation. Stattdessen tragen die Kindtabellen die
-- Eigentümerkennung selbst, und ein zusammengesetzter Fremdschlüssel
-- `(trip_id, user_id) → trips (id, user_id)` macht ein Auseinanderlaufen
-- unmöglich: Ein Kind kann nur auf eine Reise zeigen, die derselben Person
-- gehört. Die Policy ist damit ein Spaltenvergleich.
--
-- **Adminrechte öffnen private Reiseinhalte nicht.** Auf keiner der vier
-- Tabellen gibt es eine Policy, die eine Fähigkeit prüft. Wer
-- `/admin` erreicht, sieht keine Reise. Für die Kennzahlen des
-- Administrationsbereichs entsteht in der Folgemigration eine
-- Aggregatfunktion, die Zahlen liefert und keine Inhalte. Begründung:
-- DECISIONS.md ADR-0041.
--
-- **JSONB nur für das, wonach nicht gefragt wird.** Jede Tabelle hat
-- `metadata jsonb`. Die Spalte ist bewusst kein Ersatz für Struktur: Sie ist
-- auf ein JSON-Objekt und auf 8192 Zeichen serialisierter Länge begrenzt, und
-- nichts in der Anwendung filtert oder sortiert darüber. Was abgefragt wird,
-- bekommt eine Spalte. Die Grenze zählt Zeichen und nicht `pg_column_size`:
-- Letzteres ist nur `stable` und misst die möglicherweise komprimierte Ablage,
-- taugt also nicht als Prüfbedingung.
--
-- **Keine Provider-Abstraktion.** Für die späteren Anbieter tragen Planpunkte
-- drei Spalten: `provider`, `external_ref`, `booking_url`. Das genügt, um ein
-- Amadeus-Angebot oder einen GetYourGuide-Deeplink an einem Planpunkt zu
-- halten. Eine eigene Angebots-, Anbieter- oder Buchungstabelle entsteht erst,
-- wenn ein echter Anbieter angebunden ist (AGENTS.md Regel 19).

-- ---------------------------------------------------------------------------
-- 1. Gemeinsamer Auslöser für `updated_at`
-- ---------------------------------------------------------------------------
--
-- Ohne Auslöser müsste jede schreibende Stelle der Anwendung daran denken. Die
-- Liste „Meine Reisen“ sortiert nach `updated_at`; ein vergessenes Feld wäre
-- dort direkt sichtbar.

create or replace function public.setze_aktualisiert_am()
returns trigger language plpgsql
set search_path = pg_catalog
as $$
begin
  new.updated_at := now();
  return new;
end
$$;

comment on function public.setze_aktualisiert_am() is
  'Auslöserfunktion: setzt updated_at bei jedem UPDATE auf now(). Verwendet von trips, trip_stages, trip_days und trip_items.';

revoke all on function public.setze_aktualisiert_am() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 1b. Hilfsbedingung: eine Liste ohne Doppelte
-- ---------------------------------------------------------------------------
--
-- `interests` ist fachlich eine Menge. Der naheliegende CHECK dafür braucht
-- `unnest`, und eine Unterabfrage ist in einer Prüfbedingung nicht erlaubt
-- (SQLSTATE 0A000). Eine `immutable` Funktion ist es – und sie hält die
-- Bedingung an einer Stelle, statt sie je Spalte zu wiederholen.
--
-- Das EXECUTE-Recht ist nötig, weil PostgreSQL Funktionen in Prüfbedingungen
-- mit den Rechten der schreibenden Rolle auswertet.

create or replace function public.liste_ohne_doppelte(_werte text[])
returns boolean language sql immutable parallel safe
set search_path = pg_catalog
as $$
  select coalesce(array_length(_werte, 1), 0) = (select count(distinct w) from unnest(_werte) as w)
$$;

comment on function public.liste_ohne_doppelte(text[]) is
  'True, wenn die Liste keinen Wert doppelt enthält. Für Prüfbedingungen auf Mengenspalten wie trips.interests.';

revoke all on function public.liste_ohne_doppelte(text[]) from public, anon;
grant execute on function public.liste_ohne_doppelte(text[]) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 2. trips
-- ---------------------------------------------------------------------------

create table public.trips (
  id uuid primary key default gen_random_uuid(),

  -- Kein `references auth.users` mit `on delete cascade` über einen Umweg:
  -- Wird ein Konto gelöscht, verschwinden seine Reisen mit ihm. Das ist die
  -- Erwartung an private Reisedaten, nicht eine Aufbewahrungspflicht.
  user_id uuid not null default auth.uid()
    references auth.users (id) on delete cascade,

  -- Kennung, die der Client vergibt, und der Träger der Idempotenz:
  -- `unique (user_id, client_ref)` lässt dieselbe Kennung pro Konto genau eine
  -- Reise ergeben. Zwei Wege benutzen das:
  --
  --   · Die Übernahme einer Gastreise schickt die Kennung des Entwurfs aus dem
  --     `localStorage`. Reload, Retry und mehrfacher Login ergeben eine Reise.
  --   · Das Formular unter /planen schickt eine je Formular erzeugte Kennung.
  --     Ein Doppelklick auf „Reise erstellen" ergibt eine Reise.
  --
  -- NULL kollidiert in PostgreSQL nicht mit NULL. Eine Reise ohne Kennung
  -- bleibt deshalb möglich, ohne die Eindeutigkeit zu verletzen.
  client_ref text
    constraint trips_client_ref_laenge check (client_ref is null or char_length(client_ref) between 1 and 64),

  title text not null
    constraint trips_title_laenge check (char_length(btrim(title)) between 1 and 120),

  -- Abreiseort. Für die Flugsuche ist er ein eigenes Feld und keine Etappe:
  -- Eine Etappe ist ein Aufenthalt, der Abreiseort ist keiner.
  origin text
    constraint trips_origin_laenge check (origin is null or char_length(btrim(origin)) between 1 and 120),

  -- Beide Daten sind optional. Eine Reiseidee entsteht oft ohne festen
  -- Zeitraum („irgendwann im Herbst nach Japan“), und Phase 2 soll sie
  -- speichern können, bevor die Daten stehen.
  start_date date,
  end_date date,
  constraint trips_zeitraum check (
    start_date is null or end_date is null or end_date >= start_date
  ),
  constraint trips_zeitraum_laenge check (
    start_date is null or end_date is null or end_date - start_date <= 365
  ),

  travellers smallint not null default 1
    constraint trips_travellers_bereich check (travellers between 1 and 20),

  -- ISO 4217 als Muster statt als Liste: Eine Liste aller Währungen müsste bei
  -- jeder Ergänzung migriert werden, und das Muster schliesst alles aus, was
  -- keine Währung ist.
  currency text not null default 'CHF'
    constraint trips_currency_format check (currency ~ '^[A-Z]{3}$'),

  budget_amount numeric(12, 2)
    constraint trips_budget_bereich check (budget_amount is null or budget_amount >= 0),

  status text not null default 'draft'
    constraint trips_status_werte check (status in ('draft', 'planned', 'booked', 'archived')),

  pace text not null default 'balanced'
    constraint trips_pace_werte check (pace in ('calm', 'balanced', 'intense')),

  -- Ein kleiner, fester Wertebereich. Eine eigene Tabelle plus Zuordnung wäre
  -- zwei Joins für sechs Wörter, die nie einzeln verwaltet werden.
  interests text[] not null default '{}'::text[]
    constraint trips_interests_werte check (
      interests <@ array['culture', 'nature', 'food', 'beach', 'adventure', 'wellness']::text[]
    )
    constraint trips_interests_eindeutig check (public.liste_ohne_doppelte(interests)),

  travel_wish text
    constraint trips_travel_wish_laenge check (travel_wish is null or char_length(travel_wish) <= 1000),

  metadata jsonb not null default '{}'::jsonb
    constraint trips_metadata_objekt check (jsonb_typeof(metadata) = 'object')
    constraint trips_metadata_groesse check (char_length(metadata::text) <= 8192),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Ziel des zusammengesetzten Fremdschlüssels der Kindtabellen. `id` allein
  -- ist bereits eindeutig; PostgreSQL verlangt für den Verweis auf
  -- `(id, user_id)` aber eine Eindeutigkeit über genau diese beiden Spalten.
  constraint trips_id_user_id_eindeutig unique (id, user_id),

  -- Idempotenz beim Anlegen, siehe oben.
  constraint trips_client_ref_eindeutig unique (user_id, client_ref)
);

comment on table public.trips is
  'Eine Reise eines Kontos. Privat: keine Policy öffnet sie für fremde Konten, auch nicht für die Administration (ADR-0041).';
comment on column public.trips.user_id is
  'Eigentümerin. Nicht vom Client setzbar: default auth.uid() plus with check in jeder Policy.';
comment on column public.trips.client_ref is
  'Vom Client vergebene Kennung. Macht public.reise_anlegen() idempotent: dieselbe Kennung ergibt pro Konto eine Reise.';
comment on column public.trips.origin is
  'Abreiseort für die späteren Flugangebote. Bewusst keine Etappe – eine Etappe ist ein Aufenthalt.';
comment on column public.trips.currency is
  'Währung der Reise nach ISO 4217. Ein Planpunkt darf davon abweichen, wenn ein Anbieter anders abrechnet.';
comment on column public.trips.interests is
  'Interessen in englischen Schlüsseln. Die deutschen Bezeichnungen stehen in lib/trips/bezeichnungen.ts.';
comment on column public.trips.metadata is
  'Nur Beiwerk, nach dem nicht gefiltert wird. Objekt, maximal 8 KB. Was abgefragt wird, bekommt eine Spalte.';

-- Zugriffspfade, die es wirklich gibt:
--
--   · „Meine Reisen“: alle Reisen des Kontos, neueste Änderung zuerst.
--   · Idempotenz beim Anlegen: eine Reise über (user_id, client_ref). Die
--     Eindeutigkeitsbedingung liefert diesen Index mit und deckt gleichzeitig
--     den Fremdschlüssel auf auth.users ab, weil `user_id` die führende Spalte
--     ist.
create index trips_user_id_updated_at_idx on public.trips (user_id, updated_at desc);

create trigger trips_aktualisiert_am
  before update on public.trips
  for each row execute function public.setze_aktualisiert_am();

-- ---------------------------------------------------------------------------
-- 3. trip_stages
-- ---------------------------------------------------------------------------
--
-- Eine Etappe ist ein Aufenthalt an einem Ort. „Mehrere Ziele“ aus der
-- Anforderung ist genau das: mehrere Etappen in Reihenfolge.

create table public.trip_stages (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null,
  user_id uuid not null default auth.uid(),

  -- Reihenfolge ohne Eindeutigkeit. Eine eindeutige `position` klingt
  -- richtiger, macht aber jedes Umsortieren zu einem mehrschrittigen Vorgang
  -- (zuerst auf negative Werte ausweichen, dann zurückschreiben) – und
  -- PostgREST kann eine Bedingung nicht auf das Ende der Transaktion
  -- verschieben. Gelesen wird deterministisch nach `position, created_at, id`.
  position smallint not null default 1
    constraint trip_stages_position_bereich check (position between 1 and 200),

  name text not null
    constraint trip_stages_name_laenge check (char_length(btrim(name)) between 1 and 120),

  -- ISO 3166-1 alpha-2. Optional: Zu einer Reiseidee steht das Land oft noch
  -- nicht fest, und niemand soll es erfinden müssen.
  country_code text
    constraint trip_stages_country_format check (country_code is null or country_code ~ '^[A-Z]{2}$'),

  arrival_date date,
  departure_date date,
  constraint trip_stages_zeitraum check (
    arrival_date is null or departure_date is null or departure_date >= arrival_date
  ),

  -- Koordinaten, damit die späteren Hotel- und Aktivitätssuchen einen Ort
  -- haben, der nicht erst geokodiert werden muss. numeric(9,6) trägt
  -- -180.000000 bis 180.000000.
  latitude numeric(9, 6)
    constraint trip_stages_latitude_bereich check (latitude is null or latitude between -90 and 90),
  longitude numeric(9, 6)
    constraint trip_stages_longitude_bereich check (longitude is null or longitude between -180 and 180),

  metadata jsonb not null default '{}'::jsonb
    constraint trip_stages_metadata_objekt check (jsonb_typeof(metadata) = 'object')
    constraint trip_stages_metadata_groesse check (char_length(metadata::text) <= 8192),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint trip_stages_reise_fk foreign key (trip_id, user_id)
    references public.trips (id, user_id) on delete cascade,

  -- Ziel des Verweises aus trip_items. Bindet die Etappe an ihre Reise: ein
  -- Planpunkt kann keine Etappe einer anderen Reise benennen.
  constraint trip_stages_id_trip_id_eindeutig unique (id, trip_id)
);

comment on table public.trip_stages is
  'Etappen einer Reise in Reihenfolge. `position` ist absichtlich nicht eindeutig, damit Umsortieren einschrittig bleibt.';

-- Deckt den Fremdschlüssel (trip_id, user_id) ab und liefert gleichzeitig die
-- Leseordnung innerhalb einer Reise.
create index trip_stages_reise_position_idx
  on public.trip_stages (trip_id, user_id, position);

create trigger trip_stages_aktualisiert_am
  before update on public.trip_stages
  for each row execute function public.setze_aktualisiert_am();

-- ---------------------------------------------------------------------------
-- 4. trip_days
-- ---------------------------------------------------------------------------
--
-- Zwei Ordnungen, absichtlich: `day_index` ist die verbindliche Reihenfolge,
-- `day_date` das optionale Kalenderdatum. Nur mit dem Datum allein liesse sich
-- „Tag 1 Anreise, Tag 2 Tempel“ ohne festen Zeitraum nicht abbilden – und
-- genau das ist der Zustand, in dem eine Reiseidee entsteht. Nur mit dem Index
-- allein wäre jede Datumsanzeige eine Rechnung über den Reisebeginn und würde
-- beim Verschieben eines Tages falsch.
--
-- Eine Verknüpfung von Tag zu Etappe gibt es bewusst nicht. Sie wäre eine
-- zweite Quelle für dieselbe Aussage: Welche Etappe ein Tag betrifft, folgt
-- aus `arrival_date`/`departure_date` der Etappe, sobald Daten existieren. Was
-- wirklich an einer Etappe hängt – eine Unterkunft über mehrere Nächte –,
-- hängt an `trip_items.stage_id`.

create table public.trip_days (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null,
  user_id uuid not null default auth.uid(),

  day_index smallint not null
    constraint trip_days_index_bereich check (day_index between 1 and 366),

  day_date date,

  -- Ein Tag darf einen eigenen Titel tragen („Anreise“, „Ruhetag“). Optional,
  -- weil die Nummer für die meisten Tage genügt.
  title text
    constraint trip_days_title_laenge check (title is null or char_length(btrim(title)) between 1 and 120),

  metadata jsonb not null default '{}'::jsonb
    constraint trip_days_metadata_objekt check (jsonb_typeof(metadata) = 'object')
    constraint trip_days_metadata_groesse check (char_length(metadata::text) <= 8192),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint trip_days_reise_fk foreign key (trip_id, user_id)
    references public.trips (id, user_id) on delete cascade,

  -- `user_id` steht in der Eindeutigkeit mit, damit derselbe Index den
  -- Fremdschlüssel abdeckt. Fachlich ändert das nichts: `trip_id` bestimmt
  -- `user_id` über denselben Fremdschlüssel eindeutig.
  constraint trip_days_index_eindeutig unique (trip_id, user_id, day_index),

  constraint trip_days_id_trip_id_eindeutig unique (id, trip_id)
);

comment on table public.trip_days is
  'Reisetage. day_index ist die verbindliche Reihenfolge, day_date das optionale Kalenderdatum.';
comment on column public.trip_days.day_date is
  'Optional. Eine Reiseidee ohne festen Zeitraum hat Tage, aber keine Daten.';

-- Zwei Tage einer Reise dürfen nicht dasselbe Datum tragen. Als Teilindex,
-- weil `day_date` fehlen darf und NULL hier kein Wert ist.
create unique index trip_days_datum_eindeutig
  on public.trip_days (trip_id, day_date)
  where day_date is not null;

create trigger trip_days_aktualisiert_am
  before update on public.trip_days
  for each row execute function public.setze_aktualisiert_am();

-- ---------------------------------------------------------------------------
-- 5. trip_items
-- ---------------------------------------------------------------------------
--
-- Ein Planpunkt hängt an einem Tag, an einer Etappe, an beidem oder an
-- keinem von beiden:
--
--   · Aktivität, Transfer, Notiz  → Tag
--   · Unterkunft über drei Nächte → Etappe, nicht ein einzelner Tag
--   · Flug mit Ankunft am Folgetag → Tag der Abreise, Zeitfenster über
--     starts_on/ends_on
--   · noch nicht eingeplanter Fund → keines von beidem
--
-- Deshalb sind beide Verweise optional. `on delete set null` auf der jeweils
-- verweisenden Spalte statt `cascade`: Wird ein Tag entfernt, weil die Reise
-- kürzer wird, soll der Planpunkt nicht verschwinden, sondern unzugeordnet
-- bleiben und neu eingeplant werden können. Die spaltenweise Form von
-- `set null` gibt es seit PostgreSQL 15; ohne sie würde der Verweis auch
-- `trip_id` auf NULL setzen wollen und an `not null` scheitern.

create table public.trip_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null,
  user_id uuid not null default auth.uid(),

  day_id uuid,
  stage_id uuid,

  kind text not null
    constraint trip_items_kind_werte check (
      kind in ('flight', 'stay', 'activity', 'transfer', 'note')
    ),

  title text not null
    constraint trip_items_title_laenge check (char_length(btrim(title)) between 1 and 120),

  note text
    constraint trip_items_note_laenge check (note is null or char_length(note) <= 500),

  position smallint not null default 1
    constraint trip_items_position_bereich check (position between 1 and 500),

  -- Zeitfenster in vier Teilen statt zwei `timestamptz`. Grund: Eine Reise
  -- findet in fremden Zeitzonen statt. „Check-in 15:00“ ist eine Ortszeit und
  -- soll sich nicht ändern, wenn die Zeitzone des Browsers wechselt. Die
  -- Zeitzone steht daneben und bleibt leer, solange sie unbekannt ist.
  starts_on date,
  starts_at time,
  ends_on date,
  ends_at time,
  time_zone text
    constraint trip_items_time_zone_format check (
      time_zone is null or time_zone ~ '^[A-Za-z][A-Za-z0-9_+/-]{0,63}$'
    ),
  constraint trip_items_ende_braucht_anfang check (ends_on is null or starts_on is not null),
  constraint trip_items_endzeit_braucht_anfangszeit check (ends_at is null or starts_at is not null),
  constraint trip_items_reihenfolge check (
    ends_on is null
    or ends_on > starts_on
    or (ends_on = starts_on and (ends_at is null or starts_at is null or ends_at >= starts_at))
  ),

  price_amount numeric(12, 2)
    constraint trip_items_price_bereich check (price_amount is null or price_amount >= 0),
  price_currency text
    constraint trip_items_price_currency_format check (
      price_currency is null or price_currency ~ '^[A-Z]{3}$'
    ),
  -- Ein Betrag ohne Währung ist keine Angabe, eine Währung ohne Betrag auch
  -- nicht. Beides oder nichts.
  constraint trip_items_preis_vollstaendig check (
    (price_amount is null) = (price_currency is null)
  ),

  -- Die drei Spalten für spätere Anbieter. Mehr braucht es dafür jetzt nicht.
  provider text
    constraint trip_items_provider_laenge check (provider is null or char_length(provider) between 1 and 40),
  external_ref text
    constraint trip_items_external_ref_laenge check (
      external_ref is null or char_length(external_ref) between 1 and 200
    ),
  -- Nur HTTPS: Ein Deeplink führt aus der Anwendung hinaus, und ein
  -- `javascript:`- oder `data:`-Ziel in einem Feld, das später als Link
  -- gerendert wird, ist eine offene Tür.
  booking_url text
    constraint trip_items_booking_url_format check (
      booking_url is null
      or (booking_url ~ '^https://[^\s]+$' and char_length(booking_url) <= 2048)
    ),

  metadata jsonb not null default '{}'::jsonb
    constraint trip_items_metadata_objekt check (jsonb_typeof(metadata) = 'object')
    constraint trip_items_metadata_groesse check (char_length(metadata::text) <= 8192),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint trip_items_reise_fk foreign key (trip_id, user_id)
    references public.trips (id, user_id) on delete cascade,

  constraint trip_items_tag_fk foreign key (day_id, trip_id)
    references public.trip_days (id, trip_id) on delete set null (day_id),

  constraint trip_items_etappe_fk foreign key (stage_id, trip_id)
    references public.trip_stages (id, trip_id) on delete set null (stage_id)
);

comment on table public.trip_items is
  'Planpunkte einer Reise: flight, stay, activity, transfer, note. Tag und Etappe sind beide optional.';
comment on column public.trip_items.starts_at is
  'Ortszeit, absichtlich ohne Zeitzone. Ein Check-in um 15:00 bleibt 15:00, auch wenn der Browser in einer anderen Zone steht.';
comment on column public.trip_items.provider is
  'Anbieterkennung für Phase 3, etwa amadeus oder getyourguide. Keine eigene Anbietertabelle, solange es keinen angebundenen Anbieter gibt.';
comment on column public.trip_items.booking_url is
  'Deeplink zum Buchungspartner. Nur HTTPS – das Feld wird als Link gerendert.';

-- Deckt den Fremdschlüssel (trip_id, user_id) ab und liefert die Leseordnung
-- innerhalb einer Reise.
create index trip_items_reise_idx
  on public.trip_items (trip_id, user_id, day_id, position);

-- Die beiden Verweise brauchen einen eigenen Index: PostgreSQL sucht beim
-- Löschen eines Tages oder einer Etappe über sie, und die Advisors melden
-- einen Fremdschlüssel ohne deckenden Index.
create index trip_items_tag_idx on public.trip_items (day_id, trip_id);
create index trip_items_etappe_idx on public.trip_items (stage_id, trip_id);

create trigger trip_items_aktualisiert_am
  before update on public.trip_items
  for each row execute function public.setze_aktualisiert_am();

-- ---------------------------------------------------------------------------
-- 6. Row Level Security
-- ---------------------------------------------------------------------------
--
-- Vier Tabellen, je vier Policies, alle nach demselben Muster und
-- ausschliesslich für `authenticated`. `anon` bekommt weder Recht noch Policy:
-- Ein Gast hat serverseitig keine Identität und deshalb auch keine Reise in
-- der Datenbank.
--
-- `(select auth.uid())` statt `auth.uid()`: In der Unterabfrage wertet
-- PostgreSQL den Aufruf einmal je Anweisung aus statt einmal je Zeile. Die
-- Advisors melden die direkte Form als `auth_rls_initplan`.

alter table public.trips       enable row level security;
alter table public.trip_stages enable row level security;
alter table public.trip_days   enable row level security;
alter table public.trip_items  enable row level security;

create policy trips_lesen on public.trips
  for select to authenticated using (user_id = (select auth.uid()));

create policy trips_anlegen on public.trips
  for insert to authenticated with check (user_id = (select auth.uid()));

create policy trips_aendern on public.trips
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy trips_loeschen on public.trips
  for delete to authenticated using (user_id = (select auth.uid()));

create policy trip_stages_lesen on public.trip_stages
  for select to authenticated using (user_id = (select auth.uid()));

create policy trip_stages_anlegen on public.trip_stages
  for insert to authenticated with check (user_id = (select auth.uid()));

create policy trip_stages_aendern on public.trip_stages
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy trip_stages_loeschen on public.trip_stages
  for delete to authenticated using (user_id = (select auth.uid()));

create policy trip_days_lesen on public.trip_days
  for select to authenticated using (user_id = (select auth.uid()));

create policy trip_days_anlegen on public.trip_days
  for insert to authenticated with check (user_id = (select auth.uid()));

create policy trip_days_aendern on public.trip_days
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy trip_days_loeschen on public.trip_days
  for delete to authenticated using (user_id = (select auth.uid()));

create policy trip_items_lesen on public.trip_items
  for select to authenticated using (user_id = (select auth.uid()));

create policy trip_items_anlegen on public.trip_items
  for insert to authenticated with check (user_id = (select auth.uid()));

create policy trip_items_aendern on public.trip_items
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy trip_items_loeschen on public.trip_items
  for delete to authenticated using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- 7. Tabellenrechte
-- ---------------------------------------------------------------------------
--
-- Es gilt die Regel aus 20260817100300: ein Recht genau dann, wenn für
-- dieselbe Rolle und dieselbe Operation eine Policy existiert. `npm run
-- db:rechte` prüft beide Richtungen. Die Standardrechte des Schemas sind
-- entzogen, neue Tabellen bekommen also nichts geschenkt.

grant select, insert, update, delete on table public.trips       to authenticated;
grant select, insert, update, delete on table public.trip_stages to authenticated;
grant select, insert, update, delete on table public.trip_days   to authenticated;
grant select, insert, update, delete on table public.trip_items  to authenticated;
