-- Jetnity V2 – Explicit Visit History 1: bestaetigte Besuchshistorie im Konto
--
-- Ein Besuch entsteht nur, weil der angemeldete Kontoinhaber ihn ausdruecklich
-- bestaetigt hat. Nichts in diesem Schema laesst sich aus einer Reise, einem
-- vergangenen Datum, einem Archivstand oder einem Buchungszustand ableiten:
-- es gibt keine Fremdbeziehung zu `trips`, keinen Trigger auf Reisedaten und
-- keinen Weg, der eine Zeile ohne Nutzerhandlung erzeugt.
--
-- Wiederholte Besuche bleiben getrennte Zeilen. Es gibt deshalb bewusst keine
-- Eindeutigkeit ueber (user_id, place_id): zwei Aufenthalte in Lissabon sind
-- zwei Ereignisse, keine Dublette.
--
-- Zeitangaben duerfen unvollstaendig sein. Jahr, Monat und Tag stehen einzeln,
-- damit "irgendwann 2004" nicht als 1. Januar 2004 gespeichert werden muss.
-- Ein Datumsfeld haette diese Genauigkeit vorgetaeuscht.
--
-- Geografie wird uebernommen, nie erraten: `place_id`, `place_label`,
-- `country_code` und die Koordinaten schreibt der Server aus `public.places`
-- ab. Der Browser schickt nur die Referenz. Ein freier Text wird nie zur
-- Geografie.
--
-- Datensparsam: keine Notizen, keine Medien, keine Begleitpersonen, keine
-- Dokument-, Gesundheits- oder Biometriedaten. Nichts hier ist oeffentlich.
--
-- Nur Development anwenden. Nicht auf Production anwenden.

create table public.account_visits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  place_id text,
  place_label text,
  country_code text,
  latitude numeric(9, 6),
  longitude numeric(9, 6),
  visited_year smallint,
  visited_month smallint,
  visited_day smallint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint account_visits_user_fk
    foreign key (user_id)
    references auth.users (id)
    on delete cascade,

  -- Eine Zeile ohne Ort und ohne Land waere ein Besuch von nichts.
  constraint account_visits_hat_identitaet
    check (place_id is not null or country_code is not null),

  -- Quellqualifizierte Referenz auf `public.places`. Bewusst kein
  -- Fremdschluessel: die Ortsreferenz wird periodisch neu importiert, und ein
  -- bestaetigter Besuch darf nicht verschwinden, weil ein Katalogeintrag
  -- verschwindet. Der Server prueft die Referenz beim Schreiben gegen
  -- `public.places` und schreibt Label, Land und Koordinaten von dort ab.
  constraint account_visits_place_id_form
    check (place_id is null or place_id ~ '^[a-z]{2,20}:[A-Za-z0-9_.-]{1,60}$'),
  constraint account_visits_place_label_bei_ort
    check ((place_id is null) = (place_label is null)),
  constraint account_visits_place_label_laenge
    check (place_label is null or char_length(btrim(place_label)) between 1 and 120),
  constraint account_visits_keine_html
    check (place_label is null or place_label !~* '<[[:alpha:]/]'),
  constraint account_visits_country_format
    check (country_code is null or country_code ~ '^[A-Z]{2}$'),

  -- Koordinaten gibt es nur zu einem Ort, nie zu einem Land allein, und nur
  -- vollstaendig. Eine halbe Koordinate ist keine Position.
  constraint account_visits_koordinaten_paarig
    check ((latitude is null) = (longitude is null)),
  constraint account_visits_koordinaten_nur_mit_ort
    check (latitude is null or place_id is not null),
  constraint account_visits_latitude_bereich
    check (latitude is null or latitude between -90 and 90),
  constraint account_visits_longitude_bereich
    check (longitude is null or longitude between -180 and 180),

  -- Teilgenauigkeit statt Scheingenauigkeit: ein Monat ohne Jahr und ein Tag
  -- ohne Monat sind keine Angabe, sondern ein Widerspruch.
  constraint account_visits_jahr_bereich
    check (visited_year is null or visited_year between 1900 and 2200),
  constraint account_visits_monat_braucht_jahr
    check (visited_month is null or (visited_year is not null and visited_month between 1 and 12)),
  constraint account_visits_tag_braucht_monat
    check (visited_day is null or (visited_month is not null and visited_day between 1 and 31))
);

comment on table public.account_visits is
  'Vom Kontoinhaber ausdruecklich bestaetigte Besuche, auch vor Jetnity. Niemals aus Reisen, Daten, Buchungen oder Archivstand abgeleitet. Wiederholte Besuche bleiben getrennte Zeilen.';
comment on column public.account_visits.place_id is
  'Quellqualifizierte Referenz auf public.places. Ohne Fremdschluessel, damit ein bestaetigter Besuch einen Katalogimport ueberlebt.';
comment on column public.account_visits.place_label is
  'Ortsname zum Zeitpunkt der Bestaetigung, vom Server aus public.places abgeschrieben. Kein freier Nutzertext und keine Geografiequelle.';
comment on column public.account_visits.country_code is
  'ISO-3166-1-alpha-2 nur, wenn die Ortsreferenz ihn fuehrt. Niemals aus Name, Label oder Koordinate erschlossen. Unbekannt bleibt NULL.';
comment on column public.account_visits.visited_year is
  'Jahr, falls der Nutzer eines nennt. NULL heisst unbekannt, nicht "heute".';
comment on column public.account_visits.visited_month is
  'Monat nur zusammen mit einem Jahr. Fehlt er, war die Erinnerung jahresgenau.';
comment on column public.account_visits.visited_day is
  'Tag nur zusammen mit einem Monat. Die Kalendergueltigkeit (etwa 30. Februar) prueft die Schreibschicht, nicht dieser Check.';

-- Die Liste wird immer vollstaendig je Konto gelesen: Kennzahlen werden
-- abgeleitet, nicht gespeichert, und eine Teilmenge ergaebe eine falsche Zahl.
create index account_visits_owner_idx
  on public.account_visits (user_id, created_at desc, id);

create trigger account_visits_aktualisiert_am
  before update on public.account_visits
  for each row
  execute function public.setze_aktualisiert_am();

create or replace function public.account_visits_limit_pruefen()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  bestand bigint;
begin
  select count(*) into bestand
  from public.account_visits
  where user_id = new.user_id;

  if bestand > 1000 then
    raise exception 'Ein Konto fuehrt hoechstens 1000 bestaetigte Besuche.'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

comment on function public.account_visits_limit_pruefen() is
  'SECURITY INVOKER. Weiche Obergrenze gegen unbegrenztes Wachstum eines Kontos. Bewusst ohne Serialisierung: unter Parallelitaet darf die Grenze knapp ueberschritten werden, sie begrenzt Wachstum und ist keine Invariante.';

create trigger account_visits_limit
  after insert on public.account_visits
  for each row
  execute function public.account_visits_limit_pruefen();

alter table public.account_visits enable row level security;

create policy account_visits_lesen on public.account_visits
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy account_visits_anlegen on public.account_visits
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy account_visits_aendern on public.account_visits
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy account_visits_loeschen on public.account_visits
  for delete to authenticated
  using (user_id = (select auth.uid()));

revoke all on table public.account_visits from public;
revoke all on table public.account_visits from anon;
grant select, insert, update, delete on table public.account_visits to authenticated;

revoke all on function public.account_visits_limit_pruefen() from public;
revoke all on function public.account_visits_limit_pruefen() from anon;
