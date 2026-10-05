#!/usr/bin/env node
// Isolierter Nachweis des Schreibvertrags von `public.account_visits`.
//
// Gegen eine lokale, jedes Mal frisch angelegte PostgreSQL – niemals gegen
// Supabase, niemals gegen Production. Das Skript spricht kein Management-API
// an und liest keine Zugangsdaten.
//
// Der Lauf nimmt die Rolle des Angreifers ein, nicht die der Anwendung: er
// schreibt als `authenticated` direkt auf die Tabelle, so wie es ein Client
// über PostgREST tun könnte, und erwartet, abgewiesen zu werden. Erst danach
// prüft er, dass derselbe Vorgang über die Vertragsfunktionen gelingt.
//
// Das Bootstrap bildet dafür die Supabase-Voreinstellung nach, die neuen
// Tabellen von sich aus Rechte für anon, authenticated und service_role gibt.
// Ohne sie prüfte der Lauf ein `revoke`, das nichts zu entziehen hatte.
//
//   npm run db:besuche-lokal

import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const NUTZER = '11111111-1111-1111-1111-111111111111'
const ZWEITER = '22222222-2222-2222-2222-222222222222'
const BESUCH = 'cccccccc-0000-4000-8000-000000000001'
const FREMD = 'cccccccc-0000-4000-8000-000000000002'
const REISE = 'aaaaaaaa-0000-4000-8000-000000000001'
const DB = 'jetnity_besuche_rls_lokal'
const ROOT = new URL('../..', import.meta.url).pathname
const BOOTSTRAP = join(ROOT, 'scripts/db/besuche-rls-lokal-bootstrap.sql')
const MIGRATION = join(ROOT, 'supabase/migrations/20260917120000_account_visits.sql')

const FAELLE = [
  // -------------------------------------------------------------------------
  // Der Nachweis prüft zuerst sich selbst
  // -------------------------------------------------------------------------
  {
    name: 'die nachgebildete Supabase-Voreinstellung ist wirksam',
    rolle: 'authenticated',
    uid: NUTZER,
    sql: `insert into public.acl_kontrolle (notiz) values ('voreinstellung')`,
    erwartung: 'erlaubt',
  },

  // -------------------------------------------------------------------------
  // Lesen: RLS und Rechte
  // -------------------------------------------------------------------------
  {
    name: 'anon liest keine Besuche',
    rolle: 'anon',
    sql: `select * from public.account_visits`,
    erwartung: 'abgelehnt',
  },
  {
    name: 'service_role erreicht die Tabelle nicht',
    rolle: 'service_role',
    sql: `select * from public.account_visits`,
    erwartung: 'abgelehnt',
  },
  {
    name: 'Konto liest den eigenen Besuch',
    rolle: 'authenticated',
    uid: NUTZER,
    sql: `select * from public.account_visits where id = '${BESUCH}'`,
    erwartung: 'erlaubt',
  },
  {
    name: 'Konto liest den fremden Besuch nicht',
    rolle: 'authenticated',
    uid: NUTZER,
    sql: `select * from public.account_visits where id = '${FREMD}'`,
    erwartung: 'leer',
  },

  // -------------------------------------------------------------------------
  // Der Schreibvertrag lässt sich nicht umgehen
  // -------------------------------------------------------------------------
  {
    name: 'Konto schreibt nicht direkt in die Tabelle',
    rolle: 'authenticated',
    uid: NUTZER,
    sql: `insert into public.account_visits (user_id, country_code) values ('${NUTZER}', 'PT')`,
    erwartung: 'abgelehnt',
  },
  {
    name: 'Konto erfindet keine Geografie per Direktschreibung',
    rolle: 'authenticated',
    uid: NUTZER,
    sql: `insert into public.account_visits
            (user_id, place_id, place_label, country_code, latitude, longitude)
          values ('${NUTZER}', 'geonames:999999', 'Atlantis', 'FR', 12.5, 13.5)`,
    erwartung: 'abgelehnt',
  },
  {
    name: 'Konto schreibt keinen Besuch von morgen per Direktschreibung',
    rolle: 'authenticated',
    uid: NUTZER,
    sql: `insert into public.account_visits (user_id, country_code, visited_year)
            values ('${NUTZER}', 'PT', 2199)`,
    erwartung: 'abgelehnt',
  },
  {
    name: 'Konto ändert die Tabelle nicht direkt',
    rolle: 'authenticated',
    uid: NUTZER,
    sql: `update public.account_visits set place_label = 'Atlantis' where id = '${BESUCH}'`,
    erwartung: 'abgelehnt',
  },
  {
    name: 'Konto löscht nicht direkt aus der Tabelle',
    rolle: 'authenticated',
    uid: NUTZER,
    sql: `delete from public.account_visits where id = '${BESUCH}'`,
    erwartung: 'abgelehnt',
  },
  {
    name: 'anon ruft den Schreibvertrag nicht auf',
    rolle: 'anon',
    sql: `select public.account_visit_bestaetigen(null, 'PT', null, null, null)`,
    erwartung: 'abgelehnt',
  },
  {
    name: 'service_role ruft den Schreibvertrag nicht auf',
    rolle: 'service_role',
    sql: `select public.account_visit_bestaetigen(null, 'PT', null, null, null)`,
    erwartung: 'abgelehnt',
  },
  {
    name: 'ohne angemeldetes Konto schreibt der Vertrag nicht',
    rolle: 'authenticated',
    sql: `select public.account_visit_bestaetigen(null, 'PT', null, null, null)`,
    erwartung: 'abgelehnt',
  },
  {
    name: 'der interne Vertragskern ist für niemanden aufrufbar',
    rolle: 'authenticated',
    uid: NUTZER,
    sql: `select public.account_visit_pruefen(null, 'PT', null, null, null)`,
    erwartung: 'abgelehnt',
  },

  // -------------------------------------------------------------------------
  // Der Vertrag selbst: Geografie
  // -------------------------------------------------------------------------
  {
    name: 'ein bekannter Ort wird mit Referenzgeografie übernommen',
    rolle: 'authenticated',
    uid: NUTZER,
    sql: `select public.account_visit_bestaetigen('geonames:2267057', null, 2012::smallint, 7::smallint, 14::smallint);
          select 1 from public.account_visits
           where place_id = 'geonames:2267057' and place_label = 'Lissabon'
             and country_code = 'PT' and latitude = 38.722300 and longitude = -9.139300
             and visited_year = 2012 and visited_month = 7 and visited_day = 14`,
    erwartung: 'erlaubt',
  },
  {
    name: 'eine unbekannte Ortsreferenz wird abgewiesen',
    rolle: 'authenticated',
    uid: NUTZER,
    sql: `select public.account_visit_bestaetigen('geonames:999999', null, null, null, null)`,
    erwartung: 'abgelehnt',
  },
  {
    name: 'ein Flughafen ist kein besuchter Ort',
    rolle: 'authenticated',
    uid: NUTZER,
    sql: `select public.account_visit_bestaetigen('airport:ZRH', null, null, null, null)`,
    erwartung: 'abgelehnt',
  },
  {
    name: 'ein Landtreffer der Ortssuche wird zum Landbesuch, nicht zum Ort',
    rolle: 'authenticated',
    uid: NUTZER,
    sql: `select public.account_visit_bestaetigen('geonames:3932488', null, null, null, null);
          select 1 from public.account_visits
           where country_code = 'PE' and place_id is null and place_label is null
             and latitude is null and longitude is null`,
    erwartung: 'erlaubt',
  },
  {
    name: 'ein Land ohne Ländercode in der Referenz wird abgewiesen',
    rolle: 'authenticated',
    uid: NUTZER,
    sql: `select public.account_visit_bestaetigen('geonames:1000001', null, null, null, null)`,
    erwartung: 'abgelehnt',
  },
  {
    name: 'ein Ländercode ausserhalb des Katalogs wird abgewiesen',
    rolle: 'authenticated',
    uid: NUTZER,
    sql: `select public.account_visit_bestaetigen(null, 'ZZ', null, null, null)`,
    erwartung: 'abgelehnt',
  },
  {
    name: 'ein Ländercode in falscher Form wird abgewiesen',
    rolle: 'authenticated',
    uid: NUTZER,
    sql: `select public.account_visit_bestaetigen(null, 'prt', null, null, null)`,
    erwartung: 'abgelehnt',
  },
  {
    name: 'ein Besuch ohne Ort und ohne Land wird abgewiesen',
    rolle: 'authenticated',
    uid: NUTZER,
    sql: `select public.account_visit_bestaetigen(null, null, 2004::smallint, null, null)`,
    erwartung: 'abgelehnt',
  },
  {
    name: 'Koordinaten der Referenz werden übernommen, nicht geraten',
    rolle: 'authenticated',
    uid: NUTZER,
    sql: `select public.account_visit_bestaetigen('geonames:1000002', null, null, null, null);
          select 1 from public.account_visits
           where place_id = 'geonames:1000002'
             and latitude is null and longitude is null and country_code = 'MA'`,
    erwartung: 'erlaubt',
  },

  // -------------------------------------------------------------------------
  // Der Vertrag selbst: Zeit
  // -------------------------------------------------------------------------
  {
    name: 'ein unbekannter Zeitpunkt bleibt unbekannt',
    rolle: 'authenticated',
    uid: NUTZER,
    sql: `select public.account_visit_bestaetigen(null, 'MA', null, null, null);
          select 1 from public.account_visits
           where country_code = 'MA' and place_id is null
             and visited_year is null and visited_month is null and visited_day is null`,
    erwartung: 'erlaubt',
  },
  {
    name: 'ein Monat ohne Jahr wird abgewiesen',
    rolle: 'authenticated',
    uid: NUTZER,
    sql: `select public.account_visit_bestaetigen(null, 'PT', null, 5::smallint, null)`,
    erwartung: 'abgelehnt',
  },
  {
    name: 'ein Tag ohne Monat wird abgewiesen',
    rolle: 'authenticated',
    uid: NUTZER,
    sql: `select public.account_visit_bestaetigen(null, 'PT', 2004::smallint, null, 9::smallint)`,
    erwartung: 'abgelehnt',
  },
  {
    name: 'der 30. Februar wird abgewiesen',
    rolle: 'authenticated',
    uid: NUTZER,
    sql: `select public.account_visit_bestaetigen(null, 'PT', 2023::smallint, 2::smallint, 30::smallint)`,
    erwartung: 'abgelehnt',
  },
  {
    name: 'ein Jahr in der Zukunft wird abgewiesen',
    rolle: 'authenticated',
    uid: NUTZER,
    sql: `select public.account_visit_bestaetigen(
            null, 'PT', (extract(year from now())::int + 1)::smallint, null, null)`,
    erwartung: 'abgelehnt',
  },
  {
    name: 'ein Monat in der Zukunft wird abgewiesen',
    rolle: 'authenticated',
    uid: NUTZER,
    sql: `select public.account_visit_bestaetigen(
            null, 'PT',
            extract(year from now())::smallint,
            12::smallint,
            31::smallint)`,
    erwartung: 'abgelehnt',
  },
  {
    name: 'ein Jahr vor 1900 wird abgewiesen',
    rolle: 'authenticated',
    uid: NUTZER,
    sql: `select public.account_visit_bestaetigen(null, 'PT', 1899::smallint, null, null)`,
    erwartung: 'abgelehnt',
  },

  // -------------------------------------------------------------------------
  // Eigentum und Ereignisse
  // -------------------------------------------------------------------------
  {
    name: 'derselbe Ort darf mehrfach bestätigt werden',
    rolle: 'authenticated',
    uid: NUTZER,
    sql: `select public.account_visit_bestaetigen('geonames:2267057', null, 2019::smallint, null, null);
          select public.account_visit_bestaetigen('geonames:2267057', null, null, null, null);
          select 1 from public.account_visits
           where place_id = 'geonames:2267057' having count(*) = 3`,
    erwartung: 'erlaubt',
  },
  {
    name: 'Konto ändert den eigenen Besuch über den Vertrag',
    rolle: 'authenticated',
    uid: NUTZER,
    sql: `select 1 where public.account_visit_aendern(
            '${BESUCH}'::uuid, null, 'IT', 2013::smallint, null, null) is not null`,
    erwartung: 'erlaubt',
  },
  {
    name: 'Konto ändert den fremden Besuch nicht',
    rolle: 'authenticated',
    uid: NUTZER,
    sql: `select 1 where public.account_visit_aendern(
            '${FREMD}'::uuid, null, 'IT', null, null, null) is not null`,
    erwartung: 'leer',
  },
  {
    name: 'Konto widerruft den eigenen Besuch',
    rolle: 'authenticated',
    uid: NUTZER,
    sql: `select 1 where public.account_visit_widerrufen('${BESUCH}'::uuid) is not null`,
    erwartung: 'erlaubt',
  },
  {
    name: 'Konto widerruft den fremden Besuch nicht',
    rolle: 'authenticated',
    uid: NUTZER,
    sql: `select 1 where public.account_visit_widerrufen('${FREMD}'::uuid) is not null`,
    erwartung: 'leer',
  },
  {
    name: 'ein Besuch verändert keine Reisezeile',
    rolle: 'authenticated',
    uid: NUTZER,
    sql: `select public.account_visit_bestaetigen(null, 'IT', null, null, null);
          select 1 from public.trips
           where id = '${REISE}' and status = 'draft'
             and updated_at = '2026-01-01T00:00:00Z'`,
    erwartung: 'erlaubt',
  },

  // -------------------------------------------------------------------------
  // Was die Tabelle über sich selbst aussagt
  // -------------------------------------------------------------------------
  {
    name: 'die Tabelle führt keinen persistierten Zähler',
    rolle: 'authenticated',
    uid: NUTZER,
    sql: `select 1 from information_schema.columns
           where table_schema = 'public' and table_name = 'account_visits'
             and (column_name ~ '(^|_)(count|counter|anzahl|summe|total)(_|$)')`,
    erwartung: 'leer',
  },
  {
    name: 'RLS ist aktiv und es gibt genau eine Lesepolicy',
    rolle: 'authenticated',
    uid: NUTZER,
    sql: `select 1
            from pg_class c
            join pg_namespace n on n.oid = c.relnamespace
           where n.nspname = 'public' and c.relname = 'account_visits'
             and c.relrowsecurity
             and (select count(*) from pg_policies
                   where schemaname = 'public' and tablename = 'account_visits') = 1
             and (select count(*) from pg_policies
                   where schemaname = 'public' and tablename = 'account_visits'
                     and cmd = 'SELECT' and roles = '{authenticated}') = 1`,
    erwartung: 'erlaubt',
  },
  {
    name: 'authenticated hat auf der Tabelle nur SELECT',
    rolle: 'authenticated',
    uid: NUTZER,
    sql: `select 1 from information_schema.role_table_grants
           where table_schema = 'public' and table_name = 'account_visits'
             and grantee = 'authenticated' and privilege_type <> 'SELECT'`,
    erwartung: 'leer',
  },
  {
    name: 'anon, service_role und PUBLIC haben kein Tabellenrecht',
    rolle: 'authenticated',
    uid: NUTZER,
    sql: `select 1 from information_schema.role_table_grants
           where table_schema = 'public' and table_name = 'account_visits'
             and grantee in ('anon', 'service_role', 'PUBLIC')`,
    erwartung: 'leer',
  },
  {
    name: 'anon und service_role dürfen keine Vertragsfunktion ausführen',
    rolle: 'authenticated',
    uid: NUTZER,
    sql: `select 1
            from pg_proc p
            join pg_namespace n on n.oid = p.pronamespace
            cross join unnest(array['anon', 'service_role', 'public']) as rolle
           where n.nspname = 'public'
             and p.proname in ('account_visit_bestaetigen', 'account_visit_aendern',
                               'account_visit_widerrufen', 'account_visit_pruefen')
             and has_function_privilege(rolle, p.oid, 'execute')`,
    erwartung: 'leer',
  },
]

function bewerte(fall, ergebnis) {
  if (ergebnis.startsWith('treffer:')) {
    const n = Number(ergebnis.slice('treffer:'.length))
    const tatsaechlich = n > 0 ? 'erlaubt' : 'leer'
    return { ok: tatsaechlich === fall.erwartung, tatsaechlich, detail: `${n} Zeilen` }
  }
  const [, code, ...rest] = ergebnis.split(':')
  return {
    ok: fall.erwartung === 'abgelehnt',
    tatsaechlich: 'abgelehnt',
    detail: `${code} ${rest.join(':').trim()}`,
  }
}

function psqlSql(sql, datenbank = DB) {
  execFileSync(
    'sudo',
    ['-u', 'postgres', 'psql', '-v', 'ON_ERROR_STOP=1', '-d', datenbank, '-f', '-'],
    { input: sql, stdio: ['pipe', 'pipe', 'pipe'] },
  )
}

function psqlc(sql) {
  return execFileSync(
    'sudo',
    ['-u', 'postgres', 'psql', '-v', 'ON_ERROR_STOP=1', '-d', 'postgres', '-At', '-c', sql],
    { encoding: 'utf8' },
  ).trim()
}

function main() {
  if (process.env.JETNITY_ALLOW_REMOTE_DB === '1') {
    throw new Error('Dieser Lauf ist nur für isolierte lokale PostgreSQL. Remote-DB ist verboten.')
  }

  try {
    execFileSync('sudo', ['pg_ctlcluster', '16', 'main', 'start'], { stdio: 'pipe' })
  } catch (fehler) {
    const text = `${fehler.stdout || ''}${fehler.stderr || ''}${fehler.message || ''}`
    if (!/already running/i.test(text)) throw fehler
  }

  if (psqlc(`select 1 from pg_database where datname = '${DB}'`) === '1') {
    psqlc(`drop database ${DB} with (force)`)
  }
  psqlc(`create database ${DB}`)

  psqlSql(
    [
      readFileSync(BOOTSTRAP, 'utf8'),
      readFileSync(MIGRATION, 'utf8'),
      `
insert into auth.users (id) values ('${NUTZER}'), ('${ZWEITER}');

-- Die Ortsreferenz, so weit der Schreibvertrag sie liest. Peru steht als
-- Landtreffer der Ortssuche, Zuerich als Flughafen, 'Ohne Code' als Land ohne
-- Laendercode und 'Ohne Koordinaten' als Ort, dessen Position fehlt.
insert into public.places (id, name, typ, country_code, lat, lon) values
  ('geonames:2267057', 'Lissabon', 'city', 'PT', 38.7223, -9.1393),
  ('geonames:3932488', 'Peru', 'country', 'PE', -9.19, -75.0152),
  ('airport:ZRH', 'Zuerich', 'airport', 'CH', 47.4647, 8.5492),
  ('geonames:1000001', 'Gebiet ohne Code', 'country', null, 0, 0),
  ('geonames:1000002', 'Ort ohne Koordinaten', 'city', 'MA', null, null);

insert into public.trips (id, user_id, status, updated_at)
  values ('${REISE}', '${NUTZER}', 'draft', '2026-01-01T00:00:00Z');

-- Saatzeilen entstehen als Eigentuemer der Tabelle, nicht als PostgREST-Rolle:
-- der Vertrag laesst sich sonst nicht pruefen, weil es ohne Bestand nichts zu
-- aendern und nichts zu widerrufen gaebe.
insert into public.account_visits (id, user_id, place_id, place_label, country_code, visited_year)
  values ('${BESUCH}', '${NUTZER}', 'geonames:2267057', 'Lissabon', 'PT', 2012);
insert into public.account_visits (id, user_id, country_code)
  values ('${FREMD}', '${ZWEITER}', 'FR');
`,
    ].join('\n'),
  )

  const hilfe = `
create or replace function pg_temp.versuch(_sql text, _role text, _uid text)
returns text language plpgsql as $fn$
declare n bigint;
begin
  begin
    perform set_config('role', _role, true);
    perform set_config(
      'request.jwt.claims',
      case when _uid is null then '' else json_build_object('sub', _uid, 'role', _role)::text end,
      true);
    execute _sql;
    get diagnostics n = row_count;
    raise exception using errcode = 'ZZ000', message = 'treffer:' || n;
  exception when others then
    if sqlstate = 'ZZ000' then return sqlerrm; end if;
    return 'abgelehnt:' || sqlstate || ':' || sqlerrm;
  end;
end
$fn$;
`

  const anweisungen = FAELLE.map(
    (fall, i) =>
      `insert into pg_temp.ergebnis select ${i}, pg_temp.versuch($s$${fall.sql}$s$, '${fall.rolle}', ${
        fall.uid ? `'${fall.uid}'` : 'null'
      });`,
  ).join('\n')

  const roh = execFileSync(
    'sudo',
    ['-u', 'postgres', 'psql', '-v', 'ON_ERROR_STOP=1', '-q', '-d', DB, '-At', '-f', '-'],
    {
      encoding: 'utf8',
      input: `
begin;
${hilfe}
create temporary table ergebnis (i int, wert text) on commit drop;
${anweisungen}
reset role;
select jsonb_agg(jsonb_build_object('i', i, 'wert', wert) order by i) from pg_temp.ergebnis;
rollback;
`,
    },
  )

  const jsonZeile = roh
    .split('\n')
    .map((zeile) => zeile.trim())
    .find((zeile) => zeile.startsWith('['))
  if (!jsonZeile) throw new Error(`Keine Ergebnisse gelesen. Ausgabe:\n${roh}`)

  const ergebnisse = JSON.parse(jsonZeile).map((zeile) => {
    const fall = FAELLE[zeile.i]
    return { fall, ...bewerte(fall, zeile.wert) }
  })

  if (ergebnisse.length !== FAELLE.length) {
    throw new Error(`Erwartet ${FAELLE.length} Nachweise, gelesen ${ergebnisse.length}.`)
  }

  let fehler = 0
  for (const ergebnis of ergebnisse) {
    if (!ergebnis.ok) fehler += 1
    console.log(
      `${ergebnis.ok ? '  ok  ' : ' FEHL '} ${ergebnis.fall.name.padEnd(62)} ${String(
        ergebnis.fall.erwartung,
      ).padEnd(10)} ${ergebnis.detail}`,
    )
    if (!ergebnis.ok) {
      console.log(`       erwartet ${ergebnis.fall.erwartung}, gemessen ${ergebnis.tatsaechlich}`)
    }
  }

  console.log(`\n${ergebnisse.length - fehler}/${ergebnisse.length} isolierte Besuchs-Nachweise erfüllt.`)
  console.log('Ziel: lokale PostgreSQL. Supabase und Production nicht berührt.')
  if (fehler) process.exit(1)
}

main()
