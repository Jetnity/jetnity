-- Jetnity V2 – Explicit Visit History 1: bestaetigte Besuchshistorie im Konto
--
-- Ein Besuch entsteht nur, weil der angemeldete Kontoinhaber ihn ausdruecklich
-- bestaetigt hat. Nichts in diesem Schema laesst sich aus einer Reise, einem
-- vergangenen Datum, einem Archivstand oder einem Buchungszustand ableiten:
-- es gibt keine Fremdbeziehung zu `trips`, keinen Trigger auf Reisedaten und
-- keinen Weg, der eine Zeile ohne Nutzerhandlung erzeugt.
--
-- Geschrieben wird ausschliesslich ueber `account_visit_bestaetigen`,
-- `account_visit_aendern` und `account_visit_widerrufen`. `authenticated` hat
-- auf der Tabelle nur SELECT; INSERT, UPDATE und DELETE sind entzogen.
--
-- Der Grund steht im Review zu diesem Slice: RLS schuetzt das Eigentum, nicht
-- die Wahrheit. Mit direkten Tabellenrechten haette ein angemeldeter Client die
-- Serveraktion umgehen und erfundene Geografie oder ein Besuchsdatum von
-- morgen in sein eigenes Konto schreiben koennen – regelkonform gegenueber RLS
-- und trotzdem falsch. Der Schreibvertrag gehoert deshalb in die Datenbank.
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
-- `country_code` und die Koordinaten schreibt die Datenbank aus
-- `public.places` ab. Der Client schickt nur die Referenz. Ein freier Text
-- wird nie zur Geografie.
--
-- Datensparsam: keine Notizen, keine Medien, keine Begleitpersonen, keine
-- Dokument-, Gesundheits- oder Biometriedaten. Nichts hier ist oeffentlich.
--
-- Nur Development anwenden. Nicht auf Production anwenden.

-- ---------------------------------------------------------------------------
-- Laenderkatalog
-- ---------------------------------------------------------------------------
--
-- Offiziell zugewiesene ISO-3166-1-alpha-2-Codes, identisch mit
-- lib/country/katalog.ts. Keine user-assigned Codes (etwa XK), keine
-- Unicode-Zusatzregionen (EU, UN).
--
-- Die Liste steht hier, weil `country_code ~ '^[A-Z]{2}$'` nur eine Form
-- prueft und keine Identitaet: 'ZZ' erfuellt den Ausdruck und ist kein Land.
-- Ein Test vergleicht diese Liste Zeichen fuer Zeichen mit dem Katalog der
-- Anwendung, damit beide nicht auseinanderlaufen.

create or replace function public.ist_katalogland(_code text)
returns boolean
language sql
immutable
parallel safe
set search_path = pg_catalog
as $$
  select _code in (
    'AD', 'AE', 'AF', 'AG', 'AI', 'AL', 'AM', 'AO', 'AQ', 'AR', 'AS', 'AT',
    'AU', 'AW', 'AX', 'AZ', 'BA', 'BB', 'BD', 'BE', 'BF', 'BG', 'BH', 'BI',
    'BJ', 'BL', 'BM', 'BN', 'BO', 'BQ', 'BR', 'BS', 'BT', 'BV', 'BW', 'BY',
    'BZ', 'CA', 'CC', 'CD', 'CF', 'CG', 'CH', 'CI', 'CK', 'CL', 'CM', 'CN',
    'CO', 'CR', 'CU', 'CV', 'CW', 'CX', 'CY', 'CZ', 'DE', 'DJ', 'DK', 'DM',
    'DO', 'DZ', 'EC', 'EE', 'EG', 'EH', 'ER', 'ES', 'ET', 'FI', 'FJ', 'FK',
    'FM', 'FO', 'FR', 'GA', 'GB', 'GD', 'GE', 'GF', 'GG', 'GH', 'GI', 'GL',
    'GM', 'GN', 'GP', 'GQ', 'GR', 'GS', 'GT', 'GU', 'GW', 'GY', 'HK', 'HM',
    'HN', 'HR', 'HT', 'HU', 'ID', 'IE', 'IL', 'IM', 'IN', 'IO', 'IQ', 'IR',
    'IS', 'IT', 'JE', 'JM', 'JO', 'JP', 'KE', 'KG', 'KH', 'KI', 'KM', 'KN',
    'KP', 'KR', 'KW', 'KY', 'KZ', 'LA', 'LB', 'LC', 'LI', 'LK', 'LR', 'LS',
    'LT', 'LU', 'LV', 'LY', 'MA', 'MC', 'MD', 'ME', 'MF', 'MG', 'MH', 'MK',
    'ML', 'MM', 'MN', 'MO', 'MP', 'MQ', 'MR', 'MS', 'MT', 'MU', 'MV', 'MW',
    'MX', 'MY', 'MZ', 'NA', 'NC', 'NE', 'NF', 'NG', 'NI', 'NL', 'NO', 'NP',
    'NR', 'NU', 'NZ', 'OM', 'PA', 'PE', 'PF', 'PG', 'PH', 'PK', 'PL', 'PM',
    'PN', 'PR', 'PS', 'PT', 'PW', 'PY', 'QA', 'RE', 'RO', 'RS', 'RU', 'RW',
    'SA', 'SB', 'SC', 'SD', 'SE', 'SG', 'SH', 'SI', 'SJ', 'SK', 'SL', 'SM',
    'SN', 'SO', 'SR', 'SS', 'ST', 'SV', 'SX', 'SY', 'SZ', 'TC', 'TD', 'TF',
    'TG', 'TH', 'TJ', 'TK', 'TL', 'TM', 'TN', 'TO', 'TR', 'TT', 'TV', 'TW',
    'TZ', 'UA', 'UG', 'UM', 'US', 'UY', 'UZ', 'VA', 'VC', 'VE', 'VG', 'VI',
    'VN', 'VU', 'WF', 'WS', 'YE', 'YT', 'ZA', 'ZM', 'ZW'
  );
$$;

comment on function public.ist_katalogland(text) is
  'Ist der Code ein offiziell zugewiesener ISO-3166-1-alpha-2-Code? Spiegelt lib/country/katalog.ts. IMMUTABLE, damit eine Check-Bedingung ihn benutzen darf.';

revoke all on function public.ist_katalogland(text) from public, anon, service_role;
grant execute on function public.ist_katalogland(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Tabelle
-- ---------------------------------------------------------------------------

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
  -- verschwindet. Dass es die Referenz beim Schreiben gab, erzwingt
  -- `account_visit_pruefen`.
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

  -- Ein Land ohne Ortsreferenz waehlt der Nutzer selbst; es muss deshalb im
  -- Katalog stehen. Kommt der Code aus einer Ortsreferenz, gilt die Referenz
  -- als Quelle und nicht der Katalog: `places` fuehrt auch Gebiete, deren Code
  -- ISO nicht offiziell zugewiesen hat, und ein bestaetigter Besuch dort ist
  -- trotzdem wahr.
  constraint account_visits_country_katalog
    check (
      country_code is null
      or place_id is not null
      or public.ist_katalogland(country_code)
    ),

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
  --
  -- Dass ein Besuch nicht in der Zukunft liegen darf, steht hier bewusst
  -- nicht: eine Check-Bedingung muss immutable sein und darf `now()` nicht
  -- lesen. Diese Zusage traegt `account_visit_pruefen`, und sie ist deshalb
  -- durchsetzbar, weil die Tabelle keinen anderen Schreibweg hat.
  constraint account_visits_jahr_bereich
    check (visited_year is null or visited_year between 1900 and 2200),
  constraint account_visits_monat_braucht_jahr
    check (visited_month is null or (visited_year is not null and visited_month between 1 and 12)),
  constraint account_visits_tag_braucht_monat
    check (visited_day is null or (visited_month is not null and visited_day between 1 and 31))
);

comment on table public.account_visits is
  'Vom Kontoinhaber ausdruecklich bestaetigte Besuche, auch vor Jetnity. Niemals aus Reisen, Daten, Buchungen oder Archivstand abgeleitet. Wiederholte Besuche bleiben getrennte Zeilen. Geschrieben wird nur ueber account_visit_bestaetigen/aendern/widerrufen.';
comment on column public.account_visits.place_id is
  'Quellqualifizierte Referenz auf public.places. Ohne Fremdschluessel, damit ein bestaetigter Besuch einen Katalogimport ueberlebt; die Existenz prueft der Schreibweg.';
comment on column public.account_visits.place_label is
  'Ortsname zum Zeitpunkt der Bestaetigung, aus public.places abgeschrieben. Kein freier Nutzertext und keine Geografiequelle.';
comment on column public.account_visits.country_code is
  'ISO-3166-1-alpha-2. Zu einem Ort aus der Ortsreferenz, ohne Ort aus dem Laenderkatalog. Niemals aus Name, Label oder Koordinate erschlossen. Unbekannt bleibt NULL.';
comment on column public.account_visits.visited_year is
  'Jahr, falls der Nutzer eines nennt. NULL heisst unbekannt, nicht "heute".';
comment on column public.account_visits.visited_month is
  'Monat nur zusammen mit einem Jahr. Fehlt er, war die Erinnerung jahresgenau.';
comment on column public.account_visits.visited_day is
  'Tag nur zusammen mit einem Monat. Kalendergueltigkeit und Zukunftsausschluss prueft account_visit_pruefen.';

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
      using errcode = '23514', hint = 'grenze';
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

-- ---------------------------------------------------------------------------
-- Lesen: RLS und Rechte
-- ---------------------------------------------------------------------------
--
-- Gelesen wird direkt, mit RLS. Geschrieben wird gar nicht direkt: es gibt
-- keine INSERT-, UPDATE- oder DELETE-Policy, weil es kein entsprechendes Recht
-- gibt. Eine Policy ohne Recht saehe aus, als erlaube sie etwas, und wirkte
-- nie (`npm run db:rechte` verlangt beide Richtungen).

alter table public.account_visits enable row level security;

create policy account_visits_lesen on public.account_visits
  for select to authenticated
  using (user_id = (select auth.uid()));

-- Erst entziehen, dann geben, und zwar jeder Rolle einzeln.
--
-- Supabase setzt fuer `public` Default-Privilegien, die einer neu angelegten
-- Tabelle von sich aus Rechte fuer `anon`, `authenticated` und `service_role`
-- mitgeben. Ein `revoke` nur gegen `public` und `anon` haette `authenticated`
-- die vollen Schreibrechte und `service_role` den kompletten Tabellenzugriff
-- gelassen – beides still, beides genau das, was hier nicht sein soll.
revoke all on table public.account_visits from public;
revoke all on table public.account_visits from anon;
revoke all on table public.account_visits from authenticated;
revoke all on table public.account_visits from service_role;

grant select on table public.account_visits to authenticated;

revoke all on function public.account_visits_limit_pruefen() from public, anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Schreiben: der Vertrag
-- ---------------------------------------------------------------------------
--
-- `account_visit_pruefen` ist die einzige Stelle, an der aus einer Behauptung
-- eine Zeile wird. Sie nimmt eine Ortsreferenz oder einen Ländercode und eine
-- moeglicherweise unvollstaendige Zeitangabe entgegen und liefert die fertige
-- Zeile – oder sie bricht ab.
--
-- Sie laeuft SECURITY DEFINER, weil `authenticated` auf der Tabelle kein
-- Schreibrecht hat. Deshalb steht am Anfang jeder Funktion `auth.uid()`: ohne
-- angemeldetes Konto passiert nichts, und die Eigentuemerkennung kommt nie aus
-- dem Aufruf.
--
-- Fehler tragen einen `hint`. Die Schreibschicht bildet ihn auf einen Satz ab,
-- statt eine Datenbankmeldung durchzureichen.

create or replace function public.account_visit_pruefen(
  _place_id text,
  _country_code text,
  _jahr smallint,
  _monat smallint,
  _tag smallint
)
returns public.account_visits
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  _ort public.places%rowtype;
  _zeile public.account_visits%rowtype;
  _heute date := (now() at time zone 'utc')::date;
  _geprueft date;
begin
  if _place_id is null and _country_code is null then
    raise exception 'Ein Besuch braucht einen Ort oder ein Land.'
      using errcode = '22023', hint = 'ohne_ziel';
  end if;

  if _place_id is not null then
    select * into _ort from public.places where id = _place_id;

    if not found then
      raise exception 'Diese Ortsreferenz gibt es nicht.'
        using errcode = '22023', hint = 'ort_unbekannt';
    end if;

    -- Ein Flughafen ist kein besuchter Ort: wer in Zuerich umgestiegen ist,
    -- war nicht in Zuerich.
    if _ort.typ = 'airport' then
      raise exception 'Ein Flughafen ist kein besuchter Ort.'
        using errcode = '22023', hint = 'ort_unbekannt';
    end if;

    if _ort.typ = 'country' then
      -- Die Ortssuche liefert fuer die Rolle `ziel` auch Laender. Ein Land ist
      -- aber kein Ort: als Ort gezaehlt wuerde "Peru" die Ortszahl erhoehen und
      -- als Kartenmarke am Landesschwerpunkt sitzen, als sei jemand dort
      -- gewesen. Es wird deshalb auf seine Landesidentitaet zurueckgefuehrt,
      -- nicht abgelehnt – die Aussage "ich war in Peru" bleibt wahr.
      if _ort.country_code is null then
        raise exception 'Zu diesem Land fuehrt die Ortsreferenz keinen Laendercode.'
          using errcode = '22023', hint = 'land_unbekannt';
      end if;
      _zeile.place_id := null;
      _zeile.place_label := null;
      _zeile.country_code := _ort.country_code;
      _zeile.latitude := null;
      _zeile.longitude := null;
    else
      if btrim(coalesce(_ort.name, '')) = '' then
        raise exception 'Diese Ortsreferenz hat keinen Namen.'
          using errcode = '22023', hint = 'ort_unbekannt';
      end if;
      _zeile.place_id := _ort.id;
      _zeile.place_label := left(btrim(_ort.name), 120);
      _zeile.country_code := _ort.country_code;
      -- Koordinaten nur, wenn beide da und plausibel sind. Eine halbe oder
      -- unmoegliche Koordinate bleibt unbekannt statt auf dem Nullmeridian zu
      -- landen.
      if _ort.lat is not null and _ort.lon is not null
         and _ort.lat between -90 and 90 and _ort.lon between -180 and 180 then
        _zeile.latitude := _ort.lat::numeric(9, 6);
        _zeile.longitude := _ort.lon::numeric(9, 6);
      end if;
    end if;
  else
    if not public.ist_katalogland(_country_code) then
      raise exception 'Diesen Laendercode kennt Jetnity nicht.'
        using errcode = '22023', hint = 'land_unbekannt';
    end if;
    _zeile.country_code := _country_code;
  end if;

  -- Zeit: Reihenfolge, Kalender, Gegenwart.
  if _jahr is null then
    if _monat is not null or _tag is not null then
      raise exception 'Ein Monat oder Tag ohne Jahr ist keine Angabe.'
        using errcode = '22023', hint = 'datum_ungueltig';
    end if;
  else
    if _jahr < 1900 or _jahr > extract(year from _heute)::smallint then
      raise exception 'Das Jahr liegt ausserhalb des zulaessigen Bereichs.'
        using errcode = '22023', hint = 'jahr_bereich';
    end if;
    if _monat is null and _tag is not null then
      raise exception 'Ein Tag ohne Monat ist keine Angabe.'
        using errcode = '22023', hint = 'datum_ungueltig';
    end if;
    if _monat is not null and (_monat < 1 or _monat > 12) then
      raise exception 'Diesen Monat gibt es nicht.'
        using errcode = '22023', hint = 'datum_ungueltig';
    end if;
    if _tag is not null then
      begin
        _geprueft := make_date(_jahr::int, _monat::int, _tag::int);
      exception when others then
        raise exception 'Dieses Datum gibt es nicht.'
          using errcode = '22023', hint = 'datum_ungueltig';
      end;
    else
      -- Ohne Tag reicht der Monatsanfang, um die Zukunft auszuschliessen.
      _geprueft := make_date(_jahr::int, coalesce(_monat, 1)::int, 1);
    end if;
    if _geprueft > _heute then
      raise exception 'Ein Besuch kann nicht in der Zukunft liegen.'
        using errcode = '22023', hint = 'datum_zukunft';
    end if;
  end if;

  _zeile.visited_year := _jahr;
  _zeile.visited_month := _monat;
  _zeile.visited_day := _tag;

  return _zeile;
end;
$$;

comment on function public.account_visit_pruefen(text, text, smallint, smallint, smallint) is
  'Interner Schreibvertrag der Besuchshistorie: loest die Ortsreferenz gegen public.places auf, fuehrt ein Landergebnis auf seine Landesidentitaet zurueck, prueft den Laenderkatalog und schliesst ungueltige sowie zukuenftige Zeitangaben aus. SECURITY DEFINER, ohne EXECUTE fuer PostgREST-Rollen.';

revoke all on function public.account_visit_pruefen(text, text, smallint, smallint, smallint)
  from public, anon, authenticated, service_role;

create or replace function public.account_visit_bestaetigen(
  _place_id text default null,
  _country_code text default null,
  _jahr smallint default null,
  _monat smallint default null,
  _tag smallint default null
)
returns uuid
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  _uid uuid := (select auth.uid());
  _zeile public.account_visits%rowtype;
  _id uuid;
begin
  if _uid is null then
    raise exception 'Um einen Besuch zu bestaetigen, ist eine Anmeldung erforderlich.'
      using errcode = '42501', hint = 'nicht_angemeldet';
  end if;

  _zeile := public.account_visit_pruefen(_place_id, _country_code, _jahr, _monat, _tag);

  insert into public.account_visits (
    user_id, place_id, place_label, country_code, latitude, longitude,
    visited_year, visited_month, visited_day
  ) values (
    _uid, _zeile.place_id, _zeile.place_label, _zeile.country_code,
    _zeile.latitude, _zeile.longitude,
    _zeile.visited_year, _zeile.visited_month, _zeile.visited_day
  )
  returning id into _id;

  return _id;
end;
$$;

comment on function public.account_visit_bestaetigen(text, text, smallint, smallint, smallint) is
  'Bestaetigt einen Besuch fuer das aufrufende Konto. Einziger Anlageweg: authenticated hat auf der Tabelle kein INSERT. Eigentuemer ist immer auth.uid(). Geografie stammt aus public.places, nie aus dem Aufruf.';

create or replace function public.account_visit_aendern(
  _id uuid,
  _place_id text default null,
  _country_code text default null,
  _jahr smallint default null,
  _monat smallint default null,
  _tag smallint default null
)
returns uuid
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  _uid uuid := (select auth.uid());
  _zeile public.account_visits%rowtype;
  _treffer uuid;
begin
  if _uid is null then
    raise exception 'Um einen Besuch zu aendern, ist eine Anmeldung erforderlich.'
      using errcode = '42501', hint = 'nicht_angemeldet';
  end if;

  _zeile := public.account_visit_pruefen(_place_id, _country_code, _jahr, _monat, _tag);

  -- Der Eigentumsfilter steht hier und nicht in einer Policy: SECURITY DEFINER
  -- laeuft als Eigentuemer der Tabelle und sieht RLS nicht.
  update public.account_visits
     set place_id = _zeile.place_id,
         place_label = _zeile.place_label,
         country_code = _zeile.country_code,
         latitude = _zeile.latitude,
         longitude = _zeile.longitude,
         visited_year = _zeile.visited_year,
         visited_month = _zeile.visited_month,
         visited_day = _zeile.visited_day
   where id = _id and user_id = _uid
  returning id into _treffer;

  return _treffer;
end;
$$;

comment on function public.account_visit_aendern(uuid, text, text, smallint, smallint, smallint) is
  'Aendert einen eigenen bestaetigten Besuch. Liefert NULL, wenn die Zeile nicht existiert oder einem anderen Konto gehoert – beides ist fuer den Aufrufer dieselbe Auskunft.';

create or replace function public.account_visit_widerrufen(_id uuid)
returns uuid
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  _uid uuid := (select auth.uid());
  _treffer uuid;
begin
  if _uid is null then
    raise exception 'Um einen Besuch zu widerrufen, ist eine Anmeldung erforderlich.'
      using errcode = '42501', hint = 'nicht_angemeldet';
  end if;

  delete from public.account_visits
   where id = _id and user_id = _uid
  returning id into _treffer;

  return _treffer;
end;
$$;

comment on function public.account_visit_widerrufen(uuid) is
  'Nimmt eine eigene Bestaetigung zurueck. Auch das Loeschen laeuft ueber eine Funktion, damit die Tabelle fuer PostgREST-Rollen ausschliesslich lesbar ist.';

revoke all on function public.account_visit_bestaetigen(text, text, smallint, smallint, smallint)
  from public, anon, service_role;
revoke all on function public.account_visit_aendern(uuid, text, text, smallint, smallint, smallint)
  from public, anon, service_role;
revoke all on function public.account_visit_widerrufen(uuid)
  from public, anon, service_role;

grant execute on function public.account_visit_bestaetigen(text, text, smallint, smallint, smallint)
  to authenticated;
grant execute on function public.account_visit_aendern(uuid, text, text, smallint, smallint, smallint)
  to authenticated;
grant execute on function public.account_visit_widerrufen(uuid)
  to authenticated;
