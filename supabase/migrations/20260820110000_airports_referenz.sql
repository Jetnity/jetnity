-- Jetnity V2 – Phase 3.1: Airport-Referenzfelder
--
-- `public.airports` ist die einzige Quelle für `/api/search/airports`.
-- Die Suche hängt weder an Amadeus noch an Duffel noch an einer
-- Live-Abfrage gegen OurAirports. Inhalt kommt aus dem kontrollierten
-- Import (`npm run airports:importieren`), nicht aus dieser Datei.
--
-- Die neuen Spalten erweitern das bestehende Schema, sie ersetzen es
-- nicht. RLS und Rechte bleiben: anon und authenticated dürfen weiter
-- nur lesen.
--
-- Nur Development/Preview anwenden. Production nicht ohne ausdrückliche
-- Freigabe. Production enthält historische Zeilen und wird hier nicht
-- verändert.

alter table public.airports
  add column if not exists region text,
  add column if not exists country_code text,
  add column if not exists keywords text,
  add column if not exists klasse text,
  add column if not exists updated_at timestamptz;

alter table public.airports
  drop constraint if exists airports_klasse_check;
alter table public.airports
  add constraint airports_klasse_check
    check (klasse is null or klasse in ('large', 'medium', 'small'));

alter table public.airports
  drop constraint if exists airports_country_code_form;
alter table public.airports
  add constraint airports_country_code_form
    check (country_code is null or country_code ~ '^[A-Z]{2}$');

alter table public.airports
  drop constraint if exists airports_iata_form;
alter table public.airports
  add constraint airports_iata_form
    check (iata is null or iata ~ '^[A-Z]{3}$');

alter table public.airports
  drop constraint if exists airports_icao_form;
alter table public.airports
  add constraint airports_icao_form
    check (icao is null or icao ~ '^[A-Z0-9]{4}$');

alter table public.airports
  drop constraint if exists airports_lat_bereich;
alter table public.airports
  add constraint airports_lat_bereich
    check (lat is null or (lat >= -90 and lat <= 90));

alter table public.airports
  drop constraint if exists airports_lon_bereich;
alter table public.airports
  add constraint airports_lon_bereich
    check (lon is null or (lon >= -180 and lon <= 180));

comment on column public.airports.region is
  'Verwaltungsregion aus OurAirports, soweit zuverlässig auflösbar.';
comment on column public.airports.country_code is
  'ISO-3166-1-alpha-2, Grossbuchstaben.';
comment on column public.airports.keywords is
  'Zusätzliche Suchworte (Umlaute, Alternativnamen), nicht für die Anzeige.';
comment on column public.airports.klasse is
  'large | medium | small nach OurAirports-Typ, nach Jetnity-Filter.';
comment on column public.airports.updated_at is
  'Letzter erfolgreicher Import. Nicht automatisch bei jeder Suche.';

create index if not exists airports_keywords_trgm
  on public.airports using gin (keywords extensions.gin_trgm_ops);
