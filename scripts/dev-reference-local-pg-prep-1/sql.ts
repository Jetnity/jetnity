// scripts/dev-reference-local-pg-prep-1/sql.ts
//
// SQL-Text für den psql-Weg. Spalten, Wertereihenfolge, ON CONFLICT und
// die ICAO-Freigabe entsprechen scripts/airports/importieren.ts und
// scripts/places/importieren.ts. sql.test.ts vergleicht das gegen den
// Quelltext der Originale.
//
// Unterschied zum Original: jeder Stapel läuft in begin/commit und meldet
// die Zahl geschriebener Zeilen zurück. Kein delete, truncate, drop.

import { z } from 'zod'

import type { FlughafenImportZeile } from '@/lib/airports/importieren'
import type { Ort } from '@/lib/places/domain'
import { ortAusFlughafen } from '@/lib/places/importieren'

export const STAPEL = 150
export const FLUGHAFEN_BEISPIELE = ['ZRH', 'GVA', 'BSL', 'LHR', 'LGW', 'JFK', 'EWR', 'DXB', 'BKK', 'HND', 'NRT'] as const

export const FLUGHAFEN_SPALTEN = [
  'iata', 'icao', 'name', 'city', 'region', 'country', 'country_code', 'lat', 'lon', 'keywords', 'klasse', 'updated_at',
] as const
export const ORT_SPALTEN = [
  'id', 'source', 'source_id', 'name', 'typ', 'country', 'country_code', 'region', 'lat', 'lon', 'iata', 'keywords', 'population', 'feature_code', 'updated_at',
] as const

// Erkennbar für Protokoll und Test-Double. Kein Daten- oder Geheimnisinhalt.
export const KENNUNG = '-- jetnity:'

// Eine Advisory-Lock-Nummer nur für diesen Import. Sitzungsweit, endet mit der Verbindung.
export const SPERRE = 7_096_200_965

export function sqlText(wert: string | null): string {
  if (wert === null) return 'null'
  return `'${wert.replaceAll("'", "''")}'`
}

export function sqlZahl(wert: number | null): string {
  if (wert === null || !Number.isFinite(wert)) return 'null'
  return String(wert)
}

function flughafenWerte(zeile: FlughafenImportZeile): string {
  return [
    sqlText(zeile.iata),
    sqlText(zeile.icao),
    sqlText(zeile.name),
    sqlText(zeile.city),
    sqlText(zeile.region),
    sqlText(zeile.country),
    sqlText(zeile.countryCode),
    sqlZahl(zeile.lat),
    sqlZahl(zeile.lon),
    sqlText(zeile.keywords),
    sqlText(zeile.klasse),
    'now()',
  ].join(', ')
}

function ortWerte(ort: Ort): string {
  return [
    sqlText(ort.id),
    sqlText(ort.source),
    sqlText(ort.sourceId),
    sqlText(ort.name),
    sqlText(ort.typ),
    sqlText(ort.country),
    sqlText(ort.countryCode),
    sqlText(ort.region),
    sqlZahl(ort.lat),
    sqlZahl(ort.lon),
    sqlText(ort.iata),
    sqlText(ort.keywords),
    sqlZahl(ort.population ?? null),
    sqlText(ort.featureCode ?? null),
    'now()',
  ].join(', ')
}

function aktualisieren(spalten: readonly string[], schluessel: string): string {
  return spalten
    .filter((spalte) => spalte !== schluessel && spalte !== 'updated_at')
    .map((spalte) => `${spalte} = excluded.${spalte}`)
    .concat('updated_at = now()')
    .join(',\n        ')
}

export type Stapel = { art: 'flughaefen' | 'orte'; nummer: number; zeilen: number; sql: string }

export function flughafenStapel(zeilen: FlughafenImportZeile[], nummer: number): Stapel {
  const iatas = zeilen.map((zeile) => sqlText(zeile.iata)).join(', ')
  const icaos = zeilen
    .map((zeile) => zeile.icao)
    .filter((code): code is string => Boolean(code))
    .map(sqlText)
    .join(', ')
  const freigeben = icaos
    ? `update public.airports
          set icao = null
        where icao in (${icaos})
          and iata not in (${iatas});\n`
    : ''
  const sql = `${KENNUNG}stapel flughaefen ${nummer} n=${zeilen.length}
begin;
${freigeben}with geschrieben as (
  insert into public.airports
        (${FLUGHAFEN_SPALTEN.join(', ')})
     values
        ${zeilen.map((zeile) => `(${flughafenWerte(zeile)})`).join(',\n        ')}
     on conflict (iata) do update set
        ${aktualisieren(FLUGHAFEN_SPALTEN, 'iata')}
  returning 1
)
select jsonb_build_object('n', count(*))::text from geschrieben;
commit;`
  return { art: 'flughaefen', nummer, zeilen: zeilen.length, sql }
}

export function ortStapel(orte: Ort[], nummer: number): Stapel {
  const sql = `${KENNUNG}stapel orte ${nummer} n=${orte.length}
begin;
with geschrieben as (
  insert into public.places
        (${ORT_SPALTEN.join(', ')})
     values
        ${orte.map((ort) => `(${ortWerte(ort)})`).join(',\n        ')}
     on conflict (id) do update set
        ${aktualisieren(ORT_SPALTEN, 'id')}
  returning 1
)
select jsonb_build_object('n', count(*))::text from geschrieben;
commit;`
  return { art: 'orte', nummer, zeilen: orte.length, sql }
}

export function inStapel<T>(liste: readonly T[], bauen: (teil: T[], nummer: number) => Stapel): Stapel[] {
  const stapel: Stapel[] = []
  for (let i = 0; i < liste.length; i += STAPEL) {
    stapel.push(bauen(liste.slice(i, i + STAPEL), stapel.length + 1))
  }
  return stapel
}

// Wie scripts/places/importieren.ts: GeoNames zuerst, Flughafen-Orte nur
// mit neuer ID dahinter.
export function orteMitFlughaefen(geonames: Ort[], flughafenOrte: Ort[]): Ort[] {
  const ids = new Set(geonames.map((ort) => ort.id))
  return [...geonames, ...flughafenOrte.filter((ort) => !ids.has(ort.id))]
}

export const SITZUNG_SQL = `${KENNUNG}sitzung
set statement_timeout = '120s';
set lock_timeout = '10s';
set idle_in_transaction_session_timeout = '120s';
select jsonb_build_object('sperre', pg_try_advisory_lock(${SPERRE}))::text;`

export const sperreSchema = z.object({ sperre: z.literal(true) }).strict()

function spaltenVon(tabelle: 'airports' | 'places'): string {
  return `(select coalesce(jsonb_agg(column_name::text order by column_name::text), '[]'::jsonb)
             from information_schema.columns
            where table_schema = 'public' and table_name = '${tabelle}')`
}

export const VORPRUEFUNG_SQL = `${KENNUNG}vorpruefung
select jsonb_build_object(
  'datenbank', current_database(),
  'benutzer', current_user,
  'replik', pg_is_in_recovery(),
  'ssl', coalesce((select ssl from pg_stat_ssl where pid = pg_backend_pid()), false),
  'standardStrings', current_setting('standard_conforming_strings'),
  'serverVersion', current_setting('server_version_num')::int,
  'flughafenSpalten', ${spaltenVon('airports')},
  'ortSpalten', ${spaltenVon('places')},
  'flughaefen', (select count(*) from public.airports),
  'orte', (select count(*) from public.places)
)::text;`

export const vorpruefungSchema = z
  .object({
    datenbank: z.string(),
    benutzer: z.string(),
    replik: z.boolean(),
    ssl: z.boolean(),
    standardStrings: z.string(),
    serverVersion: z.number().int(),
    flughafenSpalten: z.array(z.string()),
    ortSpalten: z.array(z.string()),
    flughaefen: z.number().int().nonnegative(),
    orte: z.number().int().nonnegative(),
  })
  .strict()

export type Vorpruefung = z.infer<typeof vorpruefungSchema>

// Vor dem ersten Schreiben: darf anon public.places lesen? Erst Katalog
// (als postgres, read only), dann ein echter Lesezugriff als anon.
export const ANON_RECHTE_SQL = `${KENNUNG}anon-rechte
begin transaction read only;
select jsonb_build_object(
  'anonSelect', has_table_privilege('anon', 'public.places', 'SELECT'),
  'rls', (select relrowsecurity from pg_class where oid = 'public.places'::regclass),
  'anonPolicy', exists(
    select 1 from pg_policies
     where schemaname = 'public' and tablename = 'places'
       and cmd in ('SELECT', 'ALL')
       and roles && array['anon', 'public']::name[]
  )
)::text;
rollback;`

export const anonRechteSchema = z
  .object({ anonSelect: z.boolean(), rls: z.boolean(), anonPolicy: z.boolean() })
  .strict()

export const ANON_LESEPROBE_SQL = `${KENNUNG}anon-leseprobe
begin transaction read only;
set local role anon;
select jsonb_build_object('rolle', current_user, 'orte', (select count(*) from public.places))::text;
rollback;`

export const anonLeseprobeSchema = z
  .object({ rolle: z.string(), orte: z.number().int().nonnegative() })
  .strict()

export const FLUGHAEFEN_PRUEFEN_SQL = `${KENNUNG}flughaefen-pruefen
select jsonb_build_object(
  'anzahl', (select count(*) from public.airports),
  'beispiele', (select coalesce(jsonb_agg(iata order by iata), '[]'::jsonb)
                  from public.airports
                 where iata in (${FLUGHAFEN_BEISPIELE.map(sqlText).join(', ')}))
)::text;`

export const flughaefenPruefenSchema = z
  .object({ anzahl: z.number().int().nonnegative(), beispiele: z.array(z.string()) })
  .strict()

// Gleiche Spalten wie flughaefenHolen() im Original, als eine JSON-Zeile.
export const FLUGHAEFEN_LESEN_SQL = `${KENNUNG}flughaefen-lesen
select coalesce(jsonb_agg(jsonb_build_object(
  'iata', iata, 'name', name, 'city', city, 'region', region, 'country', country,
  'countryCode', country_code, 'lat', lat, 'lon', lon, 'keywords', keywords
) order by iata), '[]'::jsonb)::text
  from public.airports
 where iata is not null;`

const textOderNull = z.string().nullable()
const zahlOderNull = z.number().nullable()

export const flughaefenLesenSchema = z.array(
  z
    .object({
      iata: z.string(),
      name: z.string(),
      city: textOderNull,
      region: textOderNull,
      country: textOderNull,
      countryCode: textOderNull,
      lat: zahlOderNull,
      lon: zahlOderNull,
      keywords: textOderNull,
    })
    .strict(),
)

export function flughafenOrte(zeilen: z.infer<typeof flughaefenLesenSchema>): Ort[] {
  return zeilen.map(ortAusFlughafen).filter((ort): ort is Ort => Boolean(ort))
}

// Liest als anon in einer Read-only-Transaktion, die zurückgerollt wird.
// Prüft damit auch den normalen öffentlichen Lesepfad (RLS places_lesen).
export const ORTE_PRUEFEN_SQL = `${KENNUNG}orte-pruefen
begin transaction read only;
set local role anon;
select jsonb_build_object(
  'anzahl', (select count(*) from public.places),
  'japan', exists(select 1 from public.places where typ = 'country' and country_code = 'JP' and name = 'Japan'),
  'zuerich', exists(select 1 from public.places where typ = 'city' and country_code = 'CH' and name in ('Zürich', 'Zurich')),
  'zrh', exists(select 1 from public.places where id = 'airport:ZRH' and typ = 'airport' and iata = 'ZRH'),
  'rolle', current_user
)::text;
rollback;`

export const ortePruefenSchema = z
  .object({
    anzahl: z.number().int().nonnegative(),
    japan: z.boolean(),
    zuerich: z.boolean(),
    zrh: z.boolean(),
    rolle: z.string(),
  })
  .strict()

export const stapelAntwortSchema = z.object({ n: z.number().int().positive() }).strict()

const VERBOTEN = /\b(delete|truncate|drop|alter|grant|revoke|create|comment\s+on|copy|vacuum|reindex|cluster)\b/i

// Letzte Sicherung vor dem Senden: kein DDL, kein Löschen, keine psql-Metabefehle.
export function sqlZulassen(sql: string): void {
  const ohneLiterale = sql.replace(/'(?:[^']|'')*'/g, "''").replace(/--[^\n]*/g, '')
  if (VERBOTEN.test(ohneLiterale)) throw new Error('Abgebrochen: verbotene SQL-Anweisung erkannt.')
  if (/^\s*\\/m.test(ohneLiterale)) throw new Error('Abgebrochen: psql-Metabefehl im SQL erkannt.')
  if (/:['"]?[A-Za-z_]/.test(ohneLiterale.replace(/::[a-z]+/g, ''))) {
    throw new Error('Abgebrochen: psql-Variable im SQL erkannt.')
  }
}
