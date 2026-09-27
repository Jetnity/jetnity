#!/usr/bin/env node
// Isolierter Nachweis: direkte Kindänderungen erhöhen trips.revision,
// eine Löschkaskade auf die Elternreise schreibt sie nicht mehr an.
//
// Gegen eine lokale, jedes Mal frisch angelegte PostgreSQL. Niemals gegen
// Supabase, niemals gegen Production. Kein Management-API, keine Zugangsdaten.
//
//   npm run db:graph-kaskade-tiefe-lokal

import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const DB = 'jetnity_graph_kaskade_lokal'
const ROOT = new URL('../..', import.meta.url).pathname
const BOOTSTRAP = join(ROOT, 'scripts/db/graph-kaskade-tiefe-lokal-bootstrap.sql')
const MIGRATION = join(ROOT, 'supabase/migrations/20260927230000_reise_graph_kaskade_tiefe.sql')

const NUTZER = '11111111-1111-4111-8111-111111111111'
const AUTH = '22222222-2222-4222-8222-222222222222'
const GESCHWISTER = '33333333-3333-4333-8333-333333333333'
const REISE = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1'
const REISE_AUTH = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2'
const REISE_GESCHWISTER = 'cccccccc-cccc-4ccc-8ccc-ccccccccccc3'

function psqlSql(sql, datenbank = DB) {
  return execFileSync(
    'sudo',
    ['-u', 'postgres', 'psql', '-v', 'ON_ERROR_STOP=1', '-d', datenbank, '-f', '-'],
    { input: sql, encoding: 'utf8' },
  )
}

function psqlc(sql) {
  return execFileSync(
    'sudo',
    ['-u', 'postgres', 'psql', '-v', 'ON_ERROR_STOP=1', '-d', 'postgres', '-At', '-c', sql],
    { encoding: 'utf8' },
  ).trim()
}

function ohneKommentare(text) {
  return text.replace(/--[^\n]*/g, '')
}

function pruefeMigration(text) {
  const sql = ohneKommentare(text)
  if (!/security\s+invoker/i.test(sql)) {
    throw new Error('Die Migration muss SECURITY INVOKER bleiben.')
  }
  if (/security\s+definer/i.test(sql)) {
    throw new Error('Die Migration darf die Funktion nicht SECURITY DEFINER machen.')
  }
  if (/supabase_auth_admin/i.test(sql)) {
    throw new Error('Die Migration darf keinen Rollennamen der Auth-Verwaltung nennen.')
  }
  if (/\bgrant\b/i.test(sql)) {
    throw new Error('Die Migration darf keine neuen Rechte vergeben.')
  }
  if (!/pg_trigger_depth\(\)\s*>\s*1/.test(sql)) {
    throw new Error('Die Migration muss bei Trigger-Tiefe über 1 vor dem UPDATE zurückkehren.')
  }
  if (/drop\s+trigger/i.test(sql)) {
    throw new Error('Die Migration darf die Graph-Trigger nicht entfernen.')
  }
}

function main() {
  if (process.env.JETNITY_ALLOW_REMOTE_DB === '1') {
    throw new Error('Dieser Lauf ist nur für isolierte lokale PostgreSQL. Remote-DB ist verboten.')
  }

  const migration = readFileSync(MIGRATION, 'utf8')
  pruefeMigration(migration)

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

  psqlSql(readFileSync(BOOTSTRAP, 'utf8'))
  psqlSql(`
begin;
select set_config('jetnity.graph_mutation', '1', true);
insert into auth.users (id) values ('${NUTZER}'), ('${AUTH}'), ('${GESCHWISTER}');
insert into public.trips (id, user_id, revision) values
  ('${REISE}', '${NUTZER}', 1),
  ('${REISE_AUTH}', '${AUTH}', 1),
  ('${REISE_GESCHWISTER}', '${GESCHWISTER}', 4);
insert into public.trip_stages (id, trip_id, user_id) values
  ('a0000000-0000-4000-8000-0000000000a1', '${REISE_AUTH}', '${AUTH}');
insert into public.trip_days (id, trip_id, user_id) values
  ('b0000000-0000-4000-8000-0000000000b1', '${REISE_AUTH}', '${AUTH}');
insert into public.trip_items (id, trip_id, user_id) values
  ('c0000000-0000-4000-8000-0000000000c1', '${REISE_AUTH}', '${AUTH}'),
  ('c0000000-0000-4000-8000-0000000000c2', '${REISE_GESCHWISTER}', '${GESCHWISTER}');
select set_config('jetnity.graph_mutation', '', true);
commit;
`)

  const saat = psqlSql(`
select revision::text || ':' || id::text from public.trips order by id;
select count(*) from public.fassungs_log;
`)
  if (!saat.includes('1:aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1')) {
    throw new Error(`Saatfassung der direkten Reise ist nicht 1.\n${saat}`)
  }
  if (!saat.includes('1:bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2')) {
    throw new Error(`Saatfassung der Auth-Reise ist nicht 1.\n${saat}`)
  }
  if (!saat.includes('4:cccccccc-cccc-4ccc-8ccc-ccccccccccc3')) {
    throw new Error(`Saatfassung der Geschwisterreise ist nicht 4.\n${saat}`)
  }
  if (!/^\s*0\s*$/m.test(saat)) {
    throw new Error(`Die Saat darf trips nicht schreiben.\n${saat}`)
  }

  const vorher = psqlSql(`
set role supabase_auth_admin;
select public.probe_auth_loeschen('${AUTH}'::uuid);
reset role;
`)
  if (!/42501/.test(vorher) || !/trips/.test(vorher)) {
    throw new Error(`Die alte Funktion sollte 42501 auf trips werfen. Ausgabe:\n${vorher}`)
  }
  const bleibt = psqlSql(
    `select count(*) from auth.users where id = '${AUTH}';`,
  )
  if (!/\b1\b/.test(bleibt)) {
    throw new Error(`Der fehlgeschlagene Auth-Löschversuch darf das Konto nicht entfernen.\n${bleibt}`)
  }
  console.log('  ok   alte Funktion: Auth-Löschung bricht mit 42501 ab, Konto bleibt')

  psqlSql(migration)

  const nachweis = `
do $$
declare
  _rev integer;
  _log integer;
  _auth text;
begin
  if exists (
    select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'reise_graph_geaendert'
       and p.prosecdef
  ) then
    raise exception 'Funktion ist SECURITY DEFINER';
  end if;

  if exists (
    select 1
      from (values ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE')) as recht(name)
     where has_table_privilege('supabase_auth_admin', 'public.trips', recht.name)
  ) then
    raise exception 'supabase_auth_admin hat ein Tabellenrecht auf trips';
  end if;

  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', '${NUTZER}')::text, true);

  insert into public.trip_stages (id, trip_id, user_id)
    values ('d1000000-0000-4000-8000-0000000000d1', '${REISE}', '${NUTZER}');
  update public.trip_stages set note = 'geaendert'
    where id = 'd1000000-0000-4000-8000-0000000000d1';
  delete from public.trip_stages where id = 'd1000000-0000-4000-8000-0000000000d1';

  insert into public.trip_days (id, trip_id, user_id)
    values ('d2000000-0000-4000-8000-0000000000d2', '${REISE}', '${NUTZER}');
  update public.trip_days set note = 'geaendert'
    where id = 'd2000000-0000-4000-8000-0000000000d2';
  delete from public.trip_days where id = 'd2000000-0000-4000-8000-0000000000d2';

  insert into public.trip_items (id, trip_id, user_id)
    values ('d3000000-0000-4000-8000-0000000000d3', '${REISE}', '${NUTZER}');
  update public.trip_items set note = 'geaendert'
    where id = 'd3000000-0000-4000-8000-0000000000d3';
  delete from public.trip_items where id = 'd3000000-0000-4000-8000-0000000000d3';

  select revision into _rev from public.trips where id = '${REISE}';
  if _rev is distinct from 10 then
    raise exception 'direkte Kindänderungen: erwartet 10, ist %', _rev;
  end if;
  select count(*) into _log from public.fassungs_log;
  if _log is distinct from 9 then
    raise exception 'direkte Kindänderungen: erwartet 9 Schreibversuche, ist %', _log;
  end if;

  perform set_config('jetnity.graph_mutation', '1', true);
  insert into public.trip_items (id, trip_id, user_id)
    values ('d4000000-0000-4000-8000-0000000000d4', '${REISE}', '${NUTZER}');
  perform set_config('jetnity.graph_mutation', '', true);
  select revision into _rev from public.trips where id = '${REISE}';
  if _rev is distinct from 10 then
    raise exception 'graph_mutation: erwartet 10, ist %', _rev;
  end if;
  select count(*) into _log from public.fassungs_log;
  if _log is distinct from 9 then
    raise exception 'graph_mutation: Schreibversuch auf trips, Log %', _log;
  end if;

  delete from public.trips where id = '${REISE}';
  if exists (select 1 from public.trips where id = '${REISE}') then
    raise exception 'Elternreise wurde nicht gelöscht';
  end if;
  if exists (
    select 1 from public.trip_items where trip_id = '${REISE}'
    union all
    select 1 from public.trip_days where trip_id = '${REISE}'
    union all
    select 1 from public.trip_stages where trip_id = '${REISE}'
  ) then
    raise exception 'Kindzeilen der gelöschten Reise sind noch da';
  end if;
  select count(*) into _log from public.fassungs_log;
  if _log is distinct from 9 then
    raise exception 'Löschen der Elternreise hat trips geschrieben, Log %', _log;
  end if;

  reset role;
  perform set_config('request.jwt.claims', '', true);

  create temp table aussen (id integer primary key) on commit drop;
  create or replace function pg_temp.aussen_loescht()
  returns trigger language plpgsql as $fn$
  begin
    delete from public.trip_items
     where id = 'c0000000-0000-4000-8000-0000000000c2';
    return null;
  end
  $fn$;
  create trigger aussen_del after delete on aussen
    for each statement execute function pg_temp.aussen_loescht();
  insert into aussen values (1);
  delete from aussen;
  select revision into _rev from public.trips where id = '${REISE_GESCHWISTER}';
  if _rev is distinct from 4 then
    raise exception 'verschachtelte Trigger-Tiefe: erwartet 4, ist %', _rev;
  end if;
  select count(*) into _log from public.fassungs_log;
  if _log is distinct from 9 then
    raise exception 'verschachtelte Trigger-Tiefe hat trips geschrieben, Log %', _log;
  end if;

  set role supabase_auth_admin;
  _auth := public.probe_auth_loeschen('${AUTH}'::uuid);
  reset role;
  if _auth is distinct from 'ok' then
    raise exception 'Auth-Löschung nach der Korrektur: %', _auth;
  end if;
  if exists (select 1 from auth.users where id = '${AUTH}') then
    raise exception 'Auth-Konto ist nach der Löschung noch da';
  end if;
  if exists (select 1 from public.trips where id = '${REISE_AUTH}') then
    raise exception 'Reise der Auth-Löschung ist noch da';
  end if;
  select revision into _rev from public.trips where id = '${REISE_GESCHWISTER}';
  if _rev is distinct from 4 then
    raise exception 'Geschwisterreise: erwartet 4, ist %', _rev;
  end if;
  select count(*) into _log from public.fassungs_log;
  if _log is distinct from 9 then
    raise exception 'Auth-Löschung hat trips geschrieben, Log %', _log;
  end if;
end
$$;
`
  psqlSql(nachweis)
  console.log('  ok   direkte Kindänderungen erhöhen die Fassung um genau 1')
  console.log('  ok   jetnity.graph_mutation lässt die Fassung unverändert')
  console.log('  ok   Löschen der Elternreise schreibt trips nicht an')
  console.log('  ok   Trigger-Tiefe über 1 kehrt vor dem UPDATE zurück')
  console.log('  ok   Auth-Löschung mit Kindkaskade gelingt ohne Recht auf trips')
  console.log('  ok   Funktion bleibt SECURITY INVOKER, ohne neue Tabellenrechte')
  console.log('\n6/6 isolierte Kaskaden-Nachweise erfüllt.')
  console.log('Ziel: lokale PostgreSQL. Supabase und Production nicht berührt.')
}

main()
