#!/usr/bin/env node
// Isolierter RLS-/Constraint-Nachweis für `public.account_visits`.
//
// Gegen eine lokale, jedes Mal frisch angelegte PostgreSQL – niemals gegen
// Supabase, niemals gegen Production. Das Skript spricht kein Management-API
// an und liest keine Zugangsdaten.
//
// Was es beweist, ist genau das, was eine Ansicht nicht beweisen kann: dass
// anon nichts darf, dass ein Konto nur die eigenen Zeilen sieht und ändert,
// dass wiederholte Besuche desselben Ortes erlaubt bleiben und dass ein
// halbes Datum nicht persistiert werden kann.
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
  {
    name: 'anon liest keine Besuche',
    rolle: 'anon',
    sql: `select * from public.account_visits`,
    erwartung: 'abgelehnt',
  },
  {
    name: 'anon legt keinen Besuch an',
    rolle: 'anon',
    sql: `insert into public.account_visits (user_id, country_code) values ('${NUTZER}', 'PT')`,
    erwartung: 'abgelehnt',
  },
  {
    name: 'anon ändert keinen Besuch',
    rolle: 'anon',
    sql: `update public.account_visits set country_code = 'FR' where id = '${BESUCH}'`,
    erwartung: 'abgelehnt',
  },
  {
    name: 'anon löscht keinen Besuch',
    rolle: 'anon',
    sql: `delete from public.account_visits where id = '${BESUCH}'`,
    erwartung: 'abgelehnt',
  },
  {
    name: 'service_role erreicht die Tabelle nicht über PostgREST-Rechte',
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
  {
    name: 'Konto ändert den fremden Besuch nicht',
    rolle: 'authenticated',
    uid: NUTZER,
    sql: `update public.account_visits set country_code = 'FR' where id = '${FREMD}'`,
    erwartung: 'leer',
  },
  {
    name: 'Konto löscht den fremden Besuch nicht',
    rolle: 'authenticated',
    uid: NUTZER,
    sql: `delete from public.account_visits where id = '${FREMD}'`,
    erwartung: 'leer',
  },
  {
    name: 'Konto schreibt keinen Besuch auf ein fremdes Konto',
    rolle: 'authenticated',
    uid: NUTZER,
    sql: `insert into public.account_visits (user_id, country_code) values ('${ZWEITER}', 'PT')`,
    erwartung: 'abgelehnt',
  },
  {
    name: 'Konto schiebt den eigenen Besuch nicht auf ein fremdes Konto',
    rolle: 'authenticated',
    uid: NUTZER,
    sql: `update public.account_visits set user_id = '${ZWEITER}' where id = '${BESUCH}'`,
    erwartung: 'abgelehnt',
  },
  {
    name: 'Konto ändert und löscht den eigenen Besuch',
    rolle: 'authenticated',
    uid: NUTZER,
    sql: `update public.account_visits set visited_year = 2013 where id = '${BESUCH}';
          delete from public.account_visits where id = '${BESUCH}'`,
    erwartung: 'erlaubt',
  },
  {
    name: 'derselbe Ort darf mehrfach bestätigt werden',
    rolle: 'authenticated',
    uid: NUTZER,
    sql: `insert into public.account_visits (user_id, place_id, place_label, country_code, visited_year)
            values ('${NUTZER}', 'geonames:2267057', 'Lissabon', 'PT', 2019);
          insert into public.account_visits (user_id, place_id, place_label, country_code)
            values ('${NUTZER}', 'geonames:2267057', 'Lissabon', 'PT');
          select 1 from public.account_visits
            where place_id = 'geonames:2267057' having count(*) = 3`,
    erwartung: 'erlaubt',
  },
  {
    name: 'ein Besuch ohne Ort und ohne Land wird abgelehnt',
    rolle: 'authenticated',
    uid: NUTZER,
    sql: `insert into public.account_visits (user_id, visited_year) values ('${NUTZER}', 2004)`,
    erwartung: 'abgelehnt',
  },
  {
    name: 'ein Monat ohne Jahr wird abgelehnt',
    rolle: 'authenticated',
    uid: NUTZER,
    sql: `insert into public.account_visits (user_id, country_code, visited_month)
            values ('${NUTZER}', 'PT', 5)`,
    erwartung: 'abgelehnt',
  },
  {
    name: 'ein Tag ohne Monat wird abgelehnt',
    rolle: 'authenticated',
    uid: NUTZER,
    sql: `insert into public.account_visits (user_id, country_code, visited_year, visited_day)
            values ('${NUTZER}', 'PT', 2004, 9)`,
    erwartung: 'abgelehnt',
  },
  {
    name: 'ein unbekannter Zeitpunkt bleibt unbekannt',
    rolle: 'authenticated',
    uid: NUTZER,
    sql: `insert into public.account_visits (user_id, country_code) values ('${NUTZER}', 'MA');
          select 1 from public.account_visits
            where country_code = 'MA'
              and visited_year is null and visited_month is null and visited_day is null`,
    erwartung: 'erlaubt',
  },
  {
    name: 'ein Ortsname ohne Ortsreferenz wird abgelehnt',
    rolle: 'authenticated',
    uid: NUTZER,
    sql: `insert into public.account_visits (user_id, country_code, place_label)
            values ('${NUTZER}', 'PT', 'Irgendwo')`,
    erwartung: 'abgelehnt',
  },
  {
    name: 'Koordinaten ohne Ortsreferenz werden abgelehnt',
    rolle: 'authenticated',
    uid: NUTZER,
    sql: `insert into public.account_visits (user_id, country_code, latitude, longitude)
            values ('${NUTZER}', 'PT', 38.72, -9.14)`,
    erwartung: 'abgelehnt',
  },
  {
    name: 'eine halbe Koordinate wird abgelehnt',
    rolle: 'authenticated',
    uid: NUTZER,
    sql: `insert into public.account_visits (user_id, place_id, place_label, latitude)
            values ('${NUTZER}', 'geonames:1', 'Irgendwo', 38.72)`,
    erwartung: 'abgelehnt',
  },
  {
    name: 'ein Ländercode in falscher Form wird abgelehnt',
    rolle: 'authenticated',
    uid: NUTZER,
    sql: `insert into public.account_visits (user_id, country_code) values ('${NUTZER}', 'prt')`,
    erwartung: 'abgelehnt',
  },
  {
    name: 'ein Ortslabel mit Markup wird abgelehnt',
    rolle: 'authenticated',
    uid: NUTZER,
    sql: `insert into public.account_visits (user_id, place_id, place_label)
            values ('${NUTZER}', 'geonames:1', '<script>x</script>')`,
    erwartung: 'abgelehnt',
  },
  {
    name: 'ein Besuch verändert keine Reisezeile',
    rolle: 'authenticated',
    uid: NUTZER,
    sql: `insert into public.account_visits (user_id, country_code) values ('${NUTZER}', 'IT');
          select 1 from public.trips
            where id = '${REISE}' and status = 'draft'
              and updated_at = '2026-01-01T00:00:00Z'`,
    erwartung: 'erlaubt',
  },
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
    name: 'RLS ist aktiv und die vier Owner-Policies stehen',
    rolle: 'authenticated',
    uid: NUTZER,
    sql: `select 1
            from pg_class c
            join pg_namespace n on n.oid = c.relnamespace
           where n.nspname = 'public' and c.relname = 'account_visits'
             and c.relrowsecurity
             and (select count(*) from pg_policies
                   where schemaname = 'public' and tablename = 'account_visits'
                     and roles = '{authenticated}') = 4`,
    erwartung: 'erlaubt',
  },
  {
    name: 'anon und service_role haben kein einziges Tabellenrecht',
    rolle: 'authenticated',
    uid: NUTZER,
    sql: `select 1 from information_schema.role_table_grants
           where table_schema = 'public' and table_name = 'account_visits'
             and grantee in ('anon', 'service_role', 'PUBLIC')`,
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
insert into public.places (id, name, typ, country_code, lat, lon)
  values ('geonames:2267057', 'Lissabon', 'city', 'PT', 38.7223, -9.1393);
insert into public.trips (id, user_id, status, updated_at)
  values ('${REISE}', '${NUTZER}', 'draft', '2026-01-01T00:00:00Z');
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
