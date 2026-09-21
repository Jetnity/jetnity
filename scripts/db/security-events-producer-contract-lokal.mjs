#!/usr/bin/env node
// Isolierter Nachweis des mutation-derived security_events-Producer-Vertrags.
//
// Gegen eine lokale, jedes Mal frisch angelegte PostgreSQL – niemals gegen
// Supabase, niemals gegen Production/Preview/Development. Das Skript spricht
// kein Management-API an, importiert scripts/db/sql.mjs nicht und liest keine
// Verbindungs-Secrets.
//
//   npm run db:security-events-producer-contract-lokal

import { execFileSync, spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const OPERATOR = '11111111-1111-4111-8111-111111111111'
const MODERATOR = '22222222-2222-4222-8222-222222222222'
const TRAVELLER = '33333333-3333-4333-8333-333333333333'
const CAP = 3
const DB = 'jetnity_security_events_producer_lokal'
const ROOT = new URL('../..', import.meta.url).pathname
const BOOTSTRAP = join(ROOT, 'scripts/db/security-events-producer-contract-lokal-bootstrap.sql')
const CONTRACT = join(ROOT, 'scripts/db/security-events-producer-contract-lokal-contract.sql')

const REMOTE_OVERRIDE_KEYS = [
  'JETNITY_SECURITY_EVENTS_DB_URL',
  'SECURITY_EVENTS_DATABASE_URL',
  'JETNITY_LOCAL_DB_URL',
]

const ergebnisse = []
const concurrencyBeweis = []

function claims({ uid, rolle = 'authenticated', aal, extra = {} }) {
  if (!uid) return ''
  return JSON.stringify({
    sub: uid,
    role: rolle,
    ...(aal ? { aal } : {}),
    ...extra,
  })
}

function bewerte(name, gruppe, ok, detail) {
  ergebnisse.push({ name, gruppe, ok, detail: String(detail ?? '') })
  console.log(`${ok ? '  ok  ' : ' FEHL '} [${gruppe}] ${name}  ${detail ?? ''}`)
}

function psqlArgs(datenbank, extra = []) {
  return ['-u', 'postgres', 'psql', '-v', 'ON_ERROR_STOP=1', '-d', datenbank, ...extra]
}

function psqlSql(sql, datenbank = DB) {
  execFileSync('sudo', psqlArgs(datenbank, ['-f', '-']), {
    input: sql,
    stdio: ['pipe', 'pipe', 'pipe'],
  })
}

function psqlAt(sql, datenbank = DB) {
  return execFileSync('sudo', psqlArgs(datenbank, ['-At', '-q', '-c', sql]), {
    encoding: 'utf8',
  }).trim()
}

function psqlFile(sql, datenbank = DB) {
  return execFileSync('sudo', psqlArgs(datenbank, ['-At', '-q', '-f', '-']), {
    encoding: 'utf8',
    input: sql,
  }).trim()
}

function jsonZeile(roh) {
  const zeile = roh
    .split('\n')
    .map((teil) => teil.trim())
    .reverse()
    .find((teil) => teil.startsWith('{') || teil.startsWith('['))
  if (!zeile) throw new Error(`Keine JSON-Zeile gelesen.\n${roh}`)
  return JSON.parse(zeile)
}

function spawnPsql(sql) {
  return new Promise((resolve) => {
    const child = spawn(
      'sudo',
      ['-u', 'postgres', 'psql', '-v', 'ON_ERROR_STOP=1', '-d', DB, '-At', '-q', '-f', '-'],
      { stdio: ['pipe', 'pipe', 'pipe'] },
    )
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (chunk) => {
      stdout += chunk
    })
    child.stderr.on('data', (chunk) => {
      stderr += chunk
    })
    child.on('close', (code) => resolve({ code, stdout: stdout.trim(), stderr: stderr.trim() }))
    child.stdin.write(sql)
    child.stdin.end()
  })
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function sichereUmgebung() {
  if (process.env.JETNITY_ALLOW_REMOTE_DB === '1') {
    throw new Error('Dieser Lauf ist nur für isolierte lokale PostgreSQL. Remote-DB ist verboten.')
  }
  for (const schluessel of REMOTE_OVERRIDE_KEYS) {
    if (process.env[schluessel]) {
      throw new Error(`Remote-DB-Override ${schluessel} ist verboten.`)
    }
  }
  if (process.argv.some((arg) => /supabase\.(co|com)|pooler\.supabase|db\.[a-z0-9]+\.supabase/i.test(arg))) {
    throw new Error('Remote-Supabase-Ziel in den Argumenten ist verboten.')
  }
}

function sitzung({ rolle, uid, aal, extraClaims = {}, sql, inspektion = 'select 1 as ok' }) {
  const jwt = claims({ uid, rolle: rolle === 'service_role' ? 'service_role' : 'authenticated', aal, extra: extraClaims })
  const roh = psqlFile(`
begin;
select jetnity_test.sitzung(
  $r$${rolle}$r$,
  $c$${jwt}$c$,
  $a$${sql}$a$,
  $i$${inspektion}$i$
);
rollback;
`)
  return jsonZeile(roh)
}

function festgeschrieben({ rolle, uid, aal, extraClaims = {}, sql }) {
  const jwt = claims({ uid, rolle: rolle === 'service_role' ? 'service_role' : 'authenticated', aal, extra: extraClaims })
  const roh = psqlFile(`
begin;
select jetnity_test.sitzung(
  $r$${rolle}$r$,
  $c$${jwt}$c$,
  $a$${sql}$a$,
  $i$select 1 as ok$i$
);
commit;
`)
  return jsonZeile(roh)
}

function mussAblehnen(name, gruppe, opts, muster) {
  const ergebnis = sitzung(opts)
  const ok =
    ergebnis.arbeit?.ok === false && (!muster || new RegExp(muster, 'i').test(`${ergebnis.arbeit.sqlstate} ${ergebnis.arbeit.message}`))
  bewerte(
    name,
    gruppe,
    ok,
    ok
      ? `${ergebnis.arbeit.sqlstate} ${ergebnis.arbeit.message}`
      : `erwartet Ablehnung${muster ? ` / ${muster}` : ''}, gemessen ${JSON.stringify(ergebnis.arbeit)}`,
  )
  return ergebnis
}

function mussErlauben(name, gruppe, opts) {
  const ergebnis = sitzung(opts)
  const ok = ergebnis.arbeit?.ok === true
  bewerte(
    name,
    gruppe,
    ok,
    ok ? `row_count=${ergebnis.arbeit.row_count}` : `${ergebnis.arbeit?.sqlstate} ${ergebnis.arbeit?.message}`,
  )
  return ergebnis
}

function trackedInspektion() {
  return `
    select
      (select count(*) from public.security_events e
        where jetnity_internal.security_event_is_trigger_produced(e.id)) as tracked,
      (select count(*) from jetnity_internal.security_event_producer_origin) as origins,
      (select used from public.security_event_producer_quota where id = 'tracked_producer') as used,
      (select count(*) from public.blocked_ips) as blocked,
      (select count(*) from public.security_events where type = 'login_failed') as legacy,
      (select jsonb_agg(to_jsonb(e) order by e.created_at, e.id)
         from public.security_events e
        where jetnity_internal.security_event_is_trigger_produced(e.id)) as events
  `
}

function resetStand({ used = 0, cap = CAP, enabled = true } = {}) {
  psqlSql(`
delete from public.blocked_ips;
delete from public.security_events e
 where jetnity_internal.security_event_is_trigger_produced(e.id);
insert into public.security_event_producer_quota (id, used, cap, enabled)
values ('tracked_producer', ${used}, ${cap === null ? 'null' : cap}, ${enabled})
on conflict (id) do update
  set used = excluded.used, cap = excluded.cap, enabled = excluded.enabled;
`)
}

function starteCluster() {
  try {
    execFileSync('sudo', ['pg_ctlcluster', '16', 'main', 'start'], { stdio: 'pipe' })
  } catch (fehler) {
    const text = `${fehler.stdout || ''}${fehler.stderr || ''}${fehler.message || ''}`
    if (!/already running/i.test(text)) throw fehler
  }
}

function legeDatenbankAn() {
  if (psqlAt(`select 1 from pg_database where datname = '${DB}'`, 'postgres') === '1') {
    psqlAt(`drop database ${DB} with (force)`, 'postgres')
  }
  psqlAt(`create database ${DB}`, 'postgres')
  psqlSql(
    [
      readFileSync(BOOTSTRAP, 'utf8'),
      readFileSync(CONTRACT, 'utf8'),
      `
insert into auth.users (id) values ('${OPERATOR}'), ('${MODERATOR}'), ('${TRAVELLER}');
insert into public.creator_profiles (user_id, role, status) values
  ('${OPERATOR}', 'operator', 'active'),
  ('${MODERATOR}', 'moderator', 'active'),
  ('${TRAVELLER}', 'user', 'active');

insert into public.security_events (type, ip, extra, metadata)
  values ('login_failed', '203.0.113.1', '{"fixture":"legacy"}'::jsonb, '{"source":"historical"}'::jsonb);

insert into public.security_events (type, ip, user_id, extra, metadata)
  values (
    'admin_blocklist_add',
    '198.51.100.9',
    null,
    '{"note":"out-of-contract"}'::jsonb,
    '{"source":"privileged"}'::jsonb
  );

insert into public.security_event_producer_quota (id, used, cap, enabled)
  values ('tracked_producer', 0, ${CAP}, true);

create schema if not exists jetnity_test;

create or replace function jetnity_test.sitzung(
  _role text,
  _claims text,
  _arbeit text,
  _inspektion text
)
returns jsonb
language plpgsql
as $fn$
declare
  n bigint;
  arbeit jsonb;
  inspektion jsonb;
begin
  perform set_config('role', _role, true);
  perform set_config('request.jwt.claims', coalesce(_claims, ''), true);
  begin
    execute _arbeit;
    get diagnostics n = row_count;
    arbeit := jsonb_build_object('ok', true, 'row_count', n);
  exception when others then
    arbeit := jsonb_build_object('ok', false, 'sqlstate', sqlstate, 'message', sqlerrm);
  end;
  reset role;
  perform set_config('request.jwt.claims', '', true);
  if _inspektion is not null and btrim(_inspektion) <> '' then
    execute 'select to_jsonb(q) from (' || _inspektion || ') q' into inspektion;
  end if;
  return jsonb_build_object('arbeit', arbeit, 'inspektion', inspektion);
end
$fn$;

create or replace function jetnity_test.fault_event_insert()
returns trigger
language plpgsql
set search_path = ''
as $fn$
begin
  if current_setting('jetnity.fault_event_insert', true) = 'on' then
    raise exception 'injected security_events insert fault' using errcode = 'P0001';
  end if;
  return new;
end
$fn$;

create trigger jetnity_test_fault_event_insert
before insert on public.security_events
for each row
execute function jetnity_test.fault_event_insert();
`,
    ].join('\n'),
  )
}

function pruefeDirektUndAutorisierung() {
  const gruppe = 'F1/F2-auth'

  mussErlauben('Default-Privilegien sind wirksam (acl_kontrolle)', gruppe, {
    rolle: 'authenticated',
    uid: TRAVELLER,
    aal: 'aal1',
    sql: `insert into public.acl_kontrolle (notiz) values ('voreinstellung')`,
  })

  mussAblehnen('anon schreibt nicht direkt in security_events', gruppe, {
    rolle: 'anon',
    sql: `insert into public.security_events (type, extra) values ('admin_blocklist_add', '{"forged":true}')`,
  })

  mussAblehnen('Moderator AAL2 schreibt nicht direkt in security_events', gruppe, {
    rolle: 'authenticated',
    uid: MODERATOR,
    aal: 'aal2',
    sql: `insert into public.security_events (type, user_id, extra)
          values ('admin_blocklist_add', '${MODERATOR}', '{"forged":true}')`,
  })

  mussAblehnen('Operator AAL2 schreibt nicht direkt in security_events', gruppe, {
    rolle: 'authenticated',
    uid: OPERATOR,
    aal: 'aal2',
    sql: `insert into public.security_events (type, user_id, created_at, extra, ip, metadata)
          values ('admin_blocklist_remove', '${TRAVELLER}', '2010-01-01T00:00:00Z',
                  '{"surface":"client"}', '192.0.2.9', '{"k":1}')`,
  })

  mussAblehnen('Moderator AAL2 mutiert blocked_ips nicht', gruppe, {
    rolle: 'authenticated',
    uid: MODERATOR,
    aal: 'aal2',
    sql: `insert into public.blocked_ips (ip, reason) values ('192.0.2.10', 'moderator')`,
  })

  mussAblehnen('Operator AAL1 mutiert blocked_ips nicht', gruppe, {
    rolle: 'authenticated',
    uid: OPERATOR,
    aal: 'aal1',
    sql: `insert into public.blocked_ips (ip, reason) values ('192.0.2.11', 'aal1')`,
  })

  mussAblehnen('Break-Glass-Claim hebt Moderator nicht zu operator', gruppe, {
    rolle: 'authenticated',
    uid: MODERATOR,
    aal: 'aal2',
    extraClaims: { break_glass: true, grant: 'break-glass' },
    sql: `insert into public.blocked_ips (ip, reason) values ('192.0.2.12', 'break-glass')`,
  })

  mussAblehnen('Break-Glass allein gibt Reisenden kein DB-Recht', gruppe, {
    rolle: 'authenticated',
    uid: TRAVELLER,
    aal: 'aal2',
    extraClaims: { break_glass: true },
    sql: `insert into public.blocked_ips (ip, reason) values ('192.0.2.13', 'break-glass-user')`,
  })

  mussErlauben('Operator AAL2 darf blocked_ips mutieren', gruppe, {
    rolle: 'authenticated',
    uid: OPERATOR,
    aal: 'aal2',
    sql: `insert into public.blocked_ips (ip, reason) values ('192.0.2.14', 'operator-ok')`,
  })

  const privileged = sitzung({
    rolle: 'service_role',
    sql: `insert into public.blocked_ips (ip, reason) values ('192.0.2.80', 'service-null-uid')`,
    inspektion: `
      select
        exists(select 1 from public.blocked_ips where ip = '192.0.2.80') as source_ok,
        exists(
          select 1 from public.security_events e
           where jetnity_internal.security_event_is_trigger_produced(e.id)
             and e.extra ->> 'op' in ('INSERT', 'UPDATE', 'DELETE')
             and e.created_at > now() - interval '2 seconds'
        ) as tracked_event
    `,
  })
  const keinEvent =
    privileged.arbeit?.ok === true &&
    privileged.inspektion?.source_ok === true &&
    privileged.inspektion?.tracked_event === false
  bewerte(
    'service_role/null-uid mutiert ohne trusted Event',
    gruppe,
    keinEvent,
    JSON.stringify({ arbeit: privileged.arbeit, inspektion: privileged.inspektion }),
  )
}

function pruefeProducerIntegritaet() {
  const gruppe = 'producer'
  resetStand()

  const add = sitzung({
    rolle: 'authenticated',
    uid: OPERATOR,
    aal: 'aal2',
    sql: `insert into public.blocked_ips (ip, reason) values ('192.0.2.20', 'add')`,
    inspektion: trackedInspektion(),
  })
  const addEvent = add.inspektion?.events?.[0]
  bewerte(
    'INSERT blocked_ips erzeugt genau ein add-Event',
    gruppe,
    add.arbeit?.ok === true && add.inspektion?.tracked === 1 && addEvent?.type === 'admin_blocklist_add',
    JSON.stringify(add.inspektion),
  )

  festgeschrieben({
    rolle: 'authenticated',
    uid: OPERATOR,
    aal: 'aal2',
    sql: `insert into public.blocked_ips (ip, reason) values ('192.0.2.21', 'remove-setup')`,
  })
  const del = sitzung({
    rolle: 'authenticated',
    uid: OPERATOR,
    aal: 'aal2',
    sql: `delete from public.blocked_ips where ip = '192.0.2.21'`,
    inspektion: `
      select jsonb_agg(e.type order by e.created_at) as types
        from public.security_events e
       where jetnity_internal.security_event_is_trigger_produced(e.id)
    `,
  })
  bewerte(
    'DELETE blocked_ips erzeugt genau ein remove-Event',
    gruppe,
    del.arbeit?.ok === true &&
      Array.isArray(del.inspektion?.types) &&
      del.inspektion.types.filter((typ) => typ === 'admin_blocklist_remove').length === 1,
    JSON.stringify(del.inspektion),
  )

  festgeschrieben({
    rolle: 'authenticated',
    uid: OPERATOR,
    aal: 'aal2',
    sql: `insert into public.blocked_ips (ip, reason) values ('192.0.2.22', 'before')`,
  })
  const committedTracked = () =>
    Number(
      psqlAt(`select count(*) from public.security_events e
        where jetnity_internal.security_event_is_trigger_produced(e.id)`),
    )
  const beforeUpdate = committedTracked()
  const changed = sitzung({
    rolle: 'authenticated',
    uid: OPERATOR,
    aal: 'aal2',
    sql: `update public.blocked_ips set reason = 'after' where ip = '192.0.2.22'`,
    inspektion: trackedInspektion(),
  })
  bewerte(
    'UPDATE mit Bildänderung erzeugt genau ein add-Event',
    gruppe,
    changed.arbeit?.ok === true &&
      changed.inspektion?.tracked === beforeUpdate + 1 &&
      changed.inspektion?.events?.at(-1)?.type === 'admin_blocklist_add' &&
      changed.inspektion?.events?.at(-1)?.extra?.op === 'UPDATE',
    JSON.stringify({ beforeUpdate, inspektion: changed.inspektion }),
  )

  const baseline = committedTracked()
  const unchanged = sitzung({
    rolle: 'authenticated',
    uid: OPERATOR,
    aal: 'aal2',
    sql: `update public.blocked_ips set reason = 'before' where ip = '192.0.2.22'`,
    inspektion: trackedInspektion(),
  })
  bewerte(
    'unverändertes UPDATE erzeugt kein Event',
    gruppe,
    unchanged.arbeit?.ok === true && unchanged.inspektion?.tracked === baseline,
    JSON.stringify(unchanged.inspektion),
  )

  const zeroUpdate = sitzung({
    rolle: 'authenticated',
    uid: OPERATOR,
    aal: 'aal2',
    sql: `update public.blocked_ips set reason = 'ghost' where ip = '192.0.2.254'`,
    inspektion: trackedInspektion(),
  })
  bewerte(
    'Zero-row UPDATE erzeugt kein Event',
    gruppe,
    zeroUpdate.arbeit?.ok === true &&
      zeroUpdate.arbeit.row_count === 0 &&
      zeroUpdate.inspektion?.tracked === baseline,
    JSON.stringify(zeroUpdate),
  )

  const zeroDelete = sitzung({
    rolle: 'authenticated',
    uid: OPERATOR,
    aal: 'aal2',
    sql: `delete from public.blocked_ips where ip = '192.0.2.254'`,
    inspektion: trackedInspektion(),
  })
  bewerte(
    'Zero-row DELETE erzeugt kein Event',
    gruppe,
    zeroDelete.arbeit?.ok === true &&
      zeroDelete.arbeit.row_count === 0 &&
      zeroDelete.inspektion?.tracked === baseline,
    JSON.stringify(zeroDelete),
  )

  const conflictNothing = sitzung({
    rolle: 'authenticated',
    uid: OPERATOR,
    aal: 'aal2',
    sql: `insert into public.blocked_ips (ip, reason) values ('192.0.2.22', 'ignored')
          on conflict (ip) do nothing`,
    inspektion: trackedInspektion(),
  })
  bewerte(
    'ON CONFLICT DO NOTHING erzeugt kein Event',
    gruppe,
    conflictNothing.arbeit?.ok === true && conflictNothing.inspektion?.tracked === baseline,
    JSON.stringify(conflictNothing.inspektion),
  )

  const conflictUpdate = sitzung({
    rolle: 'authenticated',
    uid: OPERATOR,
    aal: 'aal2',
    sql: `insert into public.blocked_ips (ip, reason) values ('192.0.2.22', 'conflict-changed')
          on conflict (ip) do update set reason = excluded.reason`,
    inspektion: trackedInspektion(),
  })
  bewerte(
    'ON CONFLICT DO UPDATE mit Änderung erzeugt ein Event',
    gruppe,
    conflictUpdate.arbeit?.ok === true && conflictUpdate.inspektion?.tracked === baseline + 1,
    JSON.stringify(conflictUpdate.inspektion),
  )

  const extraKeys = new Set(Object.keys(addEvent?.extra ?? {}))
  const extraErlaubt =
    extraKeys.size === 3 && extraKeys.has('surface') && extraKeys.has('result') && extraKeys.has('op')
  bewerte(
    'Typ/Akteur/Zeit/extra sind nicht clientgewählt',
    gruppe,
    addEvent?.type === 'admin_blocklist_add' &&
      addEvent?.user_id === OPERATOR &&
      addEvent?.ip == null &&
      addEvent?.metadata == null &&
      extraErlaubt &&
      addEvent?.extra?.surface === 'blocked_ips' &&
      addEvent?.extra?.result === 'ok' &&
      addEvent?.extra?.op === 'INSERT',
    JSON.stringify(addEvent),
  )
}

function pruefePayload() {
  const gruppe = 'payload'
  resetStand()
  const add = sitzung({
    rolle: 'authenticated',
    uid: OPERATOR,
    aal: 'aal2',
    sql: `insert into public.blocked_ips (ip, reason) values ('192.0.2.30', 'payload-reason')`,
    inspektion: `
      select e.*, octet_length(e.extra::text) as extra_bytes,
             e.created_at >= now() - interval '5 seconds' as fresh
        from public.security_events e
       where jetnity_internal.security_event_is_trigger_produced(e.id)
    `,
  })
  const event = add.inspektion
  const extraText = JSON.stringify(event?.extra ?? {})
  bewerte('Event-IP ist null', gruppe, event?.ip == null, JSON.stringify(event?.ip))
  bewerte('metadata ist null', gruppe, event?.metadata == null, JSON.stringify(event?.metadata))
  bewerte('blocked IP steht nicht in extra', gruppe, !extraText.includes('192.0.2.30'), extraText)
  bewerte('reason/Freitext steht nicht in extra', gruppe, !extraText.includes('payload-reason'), extraText)
  bewerte(
    'extra-Keys/Werte sind allowlisted',
    gruppe,
    event?.extra?.surface === 'blocked_ips' &&
      event?.extra?.result === 'ok' &&
      event?.extra?.op === 'INSERT' &&
      Object.keys(event?.extra ?? {}).length === 3,
    extraText,
  )
  bewerte(
    'Payload liegt unter 256 Bytes',
    gruppe,
    Number(event?.extra_bytes) <= 256,
    String(event?.extra_bytes),
  )
  bewerte('created_at kommt aus der Datenbankzeit', gruppe, event?.fresh === true, JSON.stringify(event?.created_at))
}

function pruefeR1() {
  const gruppe = 'R1'
  resetStand()

  const fault2 = jsonZeile(
    psqlFile(`
begin;
select set_config('jetnity.fault_event_insert', 'on', true);
select jetnity_test.sitzung(
  'authenticated',
  $c$${claims({ uid: OPERATOR, aal: 'aal2' })}$c$,
  $a$insert into public.blocked_ips (ip, reason) values ('192.0.2.40', 'fault')$a$,
  $i$
    select
      exists(select 1 from public.blocked_ips where ip = '192.0.2.40') as source,
      (select count(*) from public.security_events e
        where jetnity_internal.security_event_is_trigger_produced(e.id)) as tracked,
      (select count(*) from jetnity_internal.security_event_producer_origin) as origins,
      (select used from public.security_event_producer_quota where id = 'tracked_producer') as used
  $i$
);
rollback;
`),
  )
  bewerte(
    'injizierter Event-Insert lässt Quelle/Event/Provenienz/Quote nicht stehen',
    gruppe,
    fault2.arbeit?.ok === false &&
      /injected security_events insert fault/i.test(fault2.arbeit?.message ?? '') &&
      fault2.inspektion?.source === false &&
      Number(fault2.inspektion?.tracked) === 0 &&
      Number(fault2.inspektion?.origins) === 0 &&
      Number(fault2.inspektion?.used) === 0,
    JSON.stringify(fault2),
  )

  const innerhalb = jsonZeile(
    psqlFile(`
begin;
select jetnity_test.sitzung(
  'authenticated',
  $c$${claims({ uid: OPERATOR, aal: 'aal2' })}$c$,
  $a$insert into public.blocked_ips (ip, reason) values ('192.0.2.41', 'outer')$a$,
  $i$
    select
      exists(select 1 from public.blocked_ips where ip = '192.0.2.41') as source,
      (select count(*) from public.security_events e
        where jetnity_internal.security_event_is_trigger_produced(e.id)) as tracked,
      (select count(*) from jetnity_internal.security_event_producer_origin) as origins,
      (select used from public.security_event_producer_quota where id = 'tracked_producer') as used
  $i$
);
rollback;
`),
  )
  const danach = jsonZeile(
    psqlFile(`
select to_jsonb(q) from (
  select
    exists(select 1 from public.blocked_ips where ip = '192.0.2.41') as source,
    (select count(*) from public.security_events e
      where jetnity_internal.security_event_is_trigger_produced(e.id)) as tracked,
    (select count(*) from jetnity_internal.security_event_producer_origin) as origins,
    (select used from public.security_event_producer_quota where id = 'tracked_producer') as used
) q;
`),
  )
  bewerte(
    'erfolgreiches Paar inkl. Provenienz existiert in der offenen Transaktion',
    gruppe,
    innerhalb.arbeit?.ok === true &&
      innerhalb.inspektion?.source === true &&
      Number(innerhalb.inspektion?.tracked) === 1 &&
      Number(innerhalb.inspektion?.origins) === 1 &&
      Number(innerhalb.inspektion?.used) === 1,
    JSON.stringify(innerhalb),
  )
  bewerte(
    'äusseres ROLLBACK entfernt Quelle, Event, Provenienz und Quote',
    gruppe,
    danach.source === false &&
      Number(danach.tracked) === 0 &&
      Number(danach.origins) === 0 &&
      Number(danach.used) === 0,
    JSON.stringify(danach),
  )
}

function pruefeInvalidUndAdmission() {
  const gruppe = 'R2/R4-serial'
  resetStand()

  festgeschrieben({
    rolle: 'authenticated',
    uid: OPERATOR,
    aal: 'aal2',
    sql: `insert into public.blocked_ips (ip, reason) values ('192.0.2.50', 'reserve-1')`,
  })
  const used = Number(psqlAt(`select used from public.security_event_producer_quota where id = 'tracked_producer'`))
  bewerte('jede qualifizierende Zeile reserviert genau 1', gruppe, used === 1, `used=${used}`)

  const retryLeak = jsonZeile(
    psqlFile(`
begin;
select jetnity_test.sitzung(
  'authenticated',
  $c$${claims({ uid: OPERATOR, aal: 'aal2' })}$c$,
  $a$insert into public.blocked_ips (ip, reason) values ('192.0.2.51', 'retry-leak')$a$,
  $i$select used from public.security_event_producer_quota where id = 'tracked_producer'$i$
);
rollback;
`),
  )
  const afterRollback = Number(psqlAt(`select used from public.security_event_producer_quota where id = 'tracked_producer'`))
  bewerte(
    'Rollback gibt die Reservation frei',
    gruppe,
    retryLeak.arbeit?.ok === true && Number(retryLeak.inspektion?.used) === 2 && afterRollback === 1,
    JSON.stringify({ inXact: retryLeak.inspektion, afterRollback }),
  )

  const retry = festgeschrieben({
    rolle: 'authenticated',
    uid: OPERATOR,
    aal: 'aal2',
    sql: `insert into public.blocked_ips (ip, reason) values ('192.0.2.51', 'retry-leak')`,
  })
  const usedNachRetry = Number(
    psqlAt(`select used from public.security_event_producer_quota where id = 'tracked_producer'`),
  )
  bewerte(
    'Retry muss erneut reservieren',
    gruppe,
    retry.arbeit?.ok === true && usedNachRetry === 2,
    `used=${usedNachRetry}`,
  )

  const multi = sitzung({
    rolle: 'authenticated',
    uid: OPERATOR,
    aal: 'aal2',
    sql: `insert into public.blocked_ips (ip, reason) values
            ('192.0.2.52', 'multi-a'),
            ('192.0.2.53', 'multi-b')`,
    inspektion: `
      select
        (select used from public.security_event_producer_quota where id = 'tracked_producer') as used,
        exists(select 1 from public.blocked_ips where ip in ('192.0.2.52', '192.0.2.53')) as source,
        (select count(*) from public.security_events e
          where jetnity_internal.security_event_is_trigger_produced(e.id)) as tracked
    `,
  })
  bewerte(
    'Mehrzeilen-Mutation über C rollt die ganze Anweisung zurück',
    gruppe,
    multi.arbeit?.ok === false &&
      /quota exceeded/i.test(multi.arbeit?.message ?? '') &&
      Number(multi.inspektion?.used) === 2 &&
      multi.inspektion?.source === false &&
      Number(multi.inspektion?.tracked) === 2,
    JSON.stringify(multi),
  )

  const gruppeInvalid = 'invalid-state'
  psqlSql(`delete from public.security_event_producer_quota`)
  const missing = sitzung({
    rolle: 'authenticated',
    uid: OPERATOR,
    aal: 'aal2',
    sql: `insert into public.blocked_ips (ip, reason) values ('192.0.2.60', 'missing-quota')`,
    inspektion: `select exists(select 1 from public.blocked_ips where ip = '192.0.2.60') as source`,
  })
  bewerte(
    'fehlende Quotenzeile sperrt Producer-Writes',
    gruppeInvalid,
    missing.arbeit?.ok === false &&
      /quota missing/i.test(missing.arbeit?.message ?? '') &&
      missing.inspektion?.source === false,
    JSON.stringify(missing),
  )

  for (const [label, capSql] of [
    ['cap=0', '0'],
    ['cap=-1', '-1'],
    ['cap=null', 'null'],
  ]) {
    psqlSql(`
insert into public.security_event_producer_quota (id, used, cap, enabled)
values ('tracked_producer', 0, ${capSql}, true)
on conflict (id) do update set used = 0, cap = excluded.cap, enabled = true;
`)
    const invalid = sitzung({
      rolle: 'authenticated',
      uid: OPERATOR,
      aal: 'aal2',
      sql: `insert into public.blocked_ips (ip, reason) values ('192.0.2.61', '${label}')`,
      inspektion: `select exists(select 1 from public.blocked_ips where ip = '192.0.2.61') as source`,
    })
    bewerte(
      `${label} sperrt Producer-Writes`,
      gruppeInvalid,
      invalid.arbeit?.ok === false &&
        /disabled or invalid/i.test(invalid.arbeit?.message ?? '') &&
        invalid.inspektion?.source === false,
      JSON.stringify(invalid),
    )
  }

  psqlSql(`
insert into public.security_event_producer_quota (id, used, cap, enabled)
values ('tracked_producer', 0, ${CAP}, false)
on conflict (id) do update set used = 0, cap = ${CAP}, enabled = false;
`)
  const disabled = sitzung({
    rolle: 'authenticated',
    uid: OPERATOR,
    aal: 'aal2',
    sql: `insert into public.blocked_ips (ip, reason) values ('192.0.2.64', 'disabled')`,
    inspektion: `select exists(select 1 from public.blocked_ips where ip = '192.0.2.64') as source`,
  })
  bewerte(
    'enabled=false sperrt Producer-Writes',
    'invalid-state',
    disabled.arbeit?.ok === false &&
      /disabled or invalid/i.test(disabled.arbeit?.message ?? '') &&
      disabled.inspektion?.source === false,
    JSON.stringify(disabled),
  )

  resetStand({ used: 0, cap: CAP, enabled: true })
  festgeschrieben({
    rolle: 'authenticated',
    uid: OPERATOR,
    aal: 'aal2',
    sql: `insert into public.blocked_ips (ip, reason) values ('192.0.2.62', 'drift-base')`,
  })
  psqlSql(`update public.security_event_producer_quota set used = used + 7 where id = 'tracked_producer'`)
  const drift = sitzung({
    rolle: 'authenticated',
    uid: OPERATOR,
    aal: 'aal2',
    sql: `insert into public.blocked_ips (ip, reason) values ('192.0.2.63', 'drift')`,
    inspektion: `select exists(select 1 from public.blocked_ips where ip = '192.0.2.63') as source`,
  })
  bewerte(
    'gedriftetes used sperrt Writes bis zur Reparatur',
    gruppeInvalid,
    drift.arbeit?.ok === false &&
      /drifted/i.test(drift.arbeit?.message ?? '') &&
      drift.inspektion?.source === false,
    JSON.stringify(drift),
  )
  psqlSql(`
update public.security_event_producer_quota
   set used = (
     select count(*) from public.security_events e
      where jetnity_internal.security_event_is_trigger_produced(e.id)
   )
 where id = 'tracked_producer';
`)
  const repaired = festgeschrieben({
    rolle: 'authenticated',
    uid: OPERATOR,
    aal: 'aal2',
    sql: `insert into public.blocked_ips (ip, reason) values ('192.0.2.63', 'repaired')`,
  })
  bewerte(
    'nach Reparatur ist kein silent best-effort nötig',
    gruppeInvalid,
    repaired.arbeit?.ok === true,
    JSON.stringify(repaired.arbeit),
  )
}

function pruefeCleanupUndLegacy() {
  const gruppe = 'R3-cleanup'
  resetStand()
  festgeschrieben({
    rolle: 'authenticated',
    uid: OPERATOR,
    aal: 'aal2',
    sql: `insert into public.blocked_ips (ip, reason) values ('192.0.2.70', 'keep')`,
  })
  festgeschrieben({
    rolle: 'authenticated',
    uid: OPERATOR,
    aal: 'aal2',
    sql: `insert into public.blocked_ips (ip, reason) values ('192.0.2.71', 'old')`,
  })
  const oldId = psqlAt(`
    select coalesce((
      select id::text from public.security_events e
       where jetnity_internal.security_event_is_trigger_produced(e.id)
       order by created_at desc
       limit 1
    ), '')
  `)
  if (!oldId) {
    bewerte('Cleanup-Saat hat tracked Events', gruppe, false, 'keine tracked Zeile zum Rückdatieren')
    return
  }
  psqlSql(`update public.security_events set created_at = now() - interval '2 days' where id = '${oldId}'`)

  const cleanupRollback = jsonZeile(
    psqlFile(`
begin;
select public.security_events_cleanup_tracked_producer(interval '1 day') as deleted;
select to_jsonb(q) from (
  select
    (select count(*) from public.security_events e
      where jetnity_internal.security_event_is_trigger_produced(e.id)) as tracked,
    (select used from public.security_event_producer_quota where id = 'tracked_producer') as used,
    exists(select 1 from public.security_events where id = '${oldId}') as old_row,
    exists(select 1 from public.security_events where type = 'login_failed' and ip = '203.0.113.1') as legacy,
    exists(select 1 from public.security_events where ip = '198.51.100.9') as privileged
) q;
rollback;
`),
  )
  const nachRollback = jsonZeile(
    psqlFile(`
select to_jsonb(q) from (
  select
    (select count(*) from public.security_events e
      where jetnity_internal.security_event_is_trigger_produced(e.id)) as tracked,
    (select used from public.security_event_producer_quota where id = 'tracked_producer') as used,
    exists(select 1 from public.security_events where id = '${oldId}') as old_row
) q;
`),
  )

  const cleanupRoh = psqlFile(`
begin;
select public.security_events_cleanup_tracked_producer(interval '1 day');
select to_jsonb(q) from (
  select
    (select count(*) from public.security_events e
      where jetnity_internal.security_event_is_trigger_produced(e.id)) as tracked,
    (select used from public.security_event_producer_quota where id = 'tracked_producer') as used,
    exists(select 1 from public.security_events where id = '${oldId}') as old_row,
    exists(select 1 from public.security_events where type = 'login_failed' and ip = '203.0.113.1') as legacy,
    exists(select 1 from public.security_events where ip = '198.51.100.9') as privileged
) q;
commit;
`)
  const cleanupCommit = jsonZeile(cleanupRoh)

  bewerte(
    'Cleanup löscht nur tracked Producer-Zeilen und setzt used',
    gruppe,
    Number(cleanupCommit.tracked) === 1 &&
      Number(cleanupCommit.used) === 1 &&
      cleanupCommit.old_row === false &&
      cleanupCommit.legacy === true &&
      cleanupCommit.privileged === true,
    JSON.stringify(cleanupCommit),
  )
  bewerte(
    'Cleanup-ROLLBACK stellt Events und used wieder her',
    gruppe,
    Number(nachRollback.tracked) === 2 &&
      Number(nachRollback.used) === 2 &&
      nachRollback.old_row === true,
    JSON.stringify({ inXact: cleanupRollback, nachRollback }),
  )

  mussAblehnen(
    'authenticated darf Cleanup nicht ausführen',
    gruppe,
    {
      rolle: 'authenticated',
      uid: OPERATOR,
      aal: 'aal2',
      sql: `select public.security_events_cleanup_tracked_producer(interval '1 day')`,
    },
    '42501|permission denied',
  )

  const gruppeLegacy = 'legacy'
  const legacy = jsonZeile(
    psqlFile(`
select to_jsonb(q) from (
  select
    exists(select 1 from pg_constraint
            where conrelid = 'public.security_events'::regclass
              and contype = 'c'
              and pg_get_constraintdef(oid) ~* 'admin_blocklist') as type_check,
    exists(select 1 from public.security_events where type = 'login_failed' and ip = '203.0.113.1') as legacy_readable,
    (select used from public.security_event_producer_quota where id = 'tracked_producer') as used,
    (select count(*) from public.security_events e
      where jetnity_internal.security_event_is_trigger_produced(e.id)) as tracked
) q;
`),
  )
  bewerte(
    'login_failed-Fixture bleibt lesbar, ohne type CHECK',
    gruppeLegacy,
    legacy.type_check === false && legacy.legacy_readable === true,
    JSON.stringify(legacy),
  )
  bewerte(
    'Quote ignoriert Legacy/Out-of-contract-Zeilen',
    gruppeLegacy,
    Number(legacy.used) === Number(legacy.tracked),
    JSON.stringify(legacy),
  )

  const moderatorLiest = sitzung({
    rolle: 'authenticated',
    uid: MODERATOR,
    aal: 'aal2',
    sql: `select 1 from public.security_events where type = 'login_failed' and ip = '203.0.113.1'`,
  })
  bewerte(
    'Moderator AAL2 kann historische login_failed-Zeile lesen',
    gruppeLegacy,
    moderatorLiest.arbeit?.ok === true && Number(moderatorLiest.arbeit.row_count) === 1,
    JSON.stringify(moderatorLiest.arbeit),
  )
}

function pruefeProvenienz() {
  const gruppe = 'F1-provenance'
  const forgedId = 'aaaaaaaa-0000-4000-8000-0000000000e1'
  const exactExtra = `{"surface":"blocked_ips","result":"ok","op":"INSERT"}`
  resetStand()
  const usedBefore = Number(
    psqlAt(`select used from public.security_event_producer_quota where id = 'tracked_producer'`),
  )

  const forged = festgeschrieben({
    rolle: 'service_role',
    sql: `insert into public.security_events (id, type, ip, user_id, extra, metadata)
          values ('${forgedId}', 'admin_blocklist_add', null, null, '${exactExtra}'::jsonb, null)`,
  })
  const forgedState = jsonZeile(
    psqlFile(`
select to_jsonb(q) from (
  select
    exists(select 1 from public.security_events where id = '${forgedId}') as public_row,
    exists(select 1 from jetnity_internal.security_event_producer_origin where event_id = '${forgedId}') as origin_row,
    jetnity_internal.security_event_is_trigger_produced('${forgedId}'::uuid) as tracked,
    (select used from public.security_event_producer_quota where id = 'tracked_producer') as used
) q;
`),
  )
  bewerte(
    'service_role darf exact-shape public INSERT (Residual ALL)',
    gruppe,
    forged.arbeit?.ok === true && forgedState.public_row === true,
    JSON.stringify({ arbeit: forged.arbeit, forgedState }),
  )
  bewerte(
    'exact-shape privileged Zeile ist nicht trigger-tracked',
    gruppe,
    forgedState.origin_row === false && forgedState.tracked === false,
    JSON.stringify(forgedState),
  )
  bewerte(
    'exact-shape privileged Zeile ändert used nicht',
    gruppe,
    Number(forgedState.used) === usedBefore,
    `before=${usedBefore} after=${forgedState.used}`,
  )

  const genuine = festgeschrieben({
    rolle: 'authenticated',
    uid: OPERATOR,
    aal: 'aal2',
    sql: `insert into public.blocked_ips (ip, reason) values ('192.0.2.88', 'genuine-origin')`,
  })
  const afterGenuine = jsonZeile(
    psqlFile(`
select to_jsonb(q) from (
  select
    (select count(*) from jetnity_internal.security_event_producer_origin) as origins,
    (select used from public.security_event_producer_quota where id = 'tracked_producer') as used,
    exists(select 1 from public.security_events where id = '${forgedId}') as forged_remains
) q;
`),
  )
  bewerte(
    'echtes Trigger-Event ist tracked und erhöht used um 1',
    gruppe,
    genuine.arbeit?.ok === true &&
      Number(afterGenuine.origins) === 1 &&
      Number(afterGenuine.used) === usedBefore + 1 &&
      afterGenuine.forged_remains === true,
    JSON.stringify({ genuine: genuine.arbeit, afterGenuine }),
  )

  psqlSql(`update public.security_events set created_at = now() - interval '2 days' where id = '${forgedId}'`)
  const cleanup = jsonZeile(
    psqlFile(`
begin;
select public.security_events_cleanup_tracked_producer(interval '1 day');
select to_jsonb(q) from (
  select
    exists(select 1 from public.security_events where id = '${forgedId}') as forged_remains,
    (select count(*) from jetnity_internal.security_event_producer_origin) as origins,
    (select used from public.security_event_producer_quota where id = 'tracked_producer') as used
) q;
commit;
`),
  )
  bewerte(
    'Cleanup löscht die privileged exact-shape Zeile nicht',
    gruppe,
    cleanup.forged_remains === true &&
      Number(cleanup.origins) === 1 &&
      Number(cleanup.used) === 1,
    JSON.stringify(cleanup),
  )

  mussAblehnen(
    'anon liest das Provenienzbuch nicht',
    gruppe,
    {
      rolle: 'anon',
      sql: `select * from jetnity_internal.security_event_producer_origin`,
    },
    '42501|permission denied',
  )
  mussAblehnen(
    'authenticated liest das Provenienzbuch nicht',
    gruppe,
    {
      rolle: 'authenticated',
      uid: OPERATOR,
      aal: 'aal2',
      sql: `select * from jetnity_internal.security_event_producer_origin`,
    },
    '42501|permission denied',
  )
  mussAblehnen(
    'service_role liest das Provenienzbuch nicht',
    gruppe,
    {
      rolle: 'service_role',
      sql: `select * from jetnity_internal.security_event_producer_origin`,
    },
    '42501|permission denied',
  )
  mussAblehnen(
    'service_role schreibt das Provenienzbuch nicht',
    gruppe,
    {
      rolle: 'service_role',
      sql: `insert into jetnity_internal.security_event_producer_origin (event_id) values ('${forgedId}')`,
    },
    '42501|permission denied',
  )
  mussAblehnen(
    'authenticated führt die interne Herkunftsfunktion nicht aus',
    gruppe,
    {
      rolle: 'authenticated',
      uid: OPERATOR,
      aal: 'aal2',
      sql: `select jetnity_internal.security_event_is_trigger_produced('${forgedId}'::uuid)`,
    },
    '42501|permission denied',
  )
}

function pruefeKatalog() {
  const gruppe = 'definer-catalog'
  const katalog = jsonZeile(
    psqlFile(`
select to_jsonb(q) from (
  select
    p.prosecdef as security_definer,
    p.prorettype = 'trigger'::regtype as returns_trigger,
    coalesce(p.proconfig, array[]::text[]) as config,
    has_function_privilege('anon', p.oid, 'execute') as anon_exec,
    has_function_privilege('authenticated', p.oid, 'execute') as auth_exec,
    has_function_privilege('service_role', p.oid, 'execute') as service_exec,
    exists (
      select 1
        from unnest(coalesce(p.proacl, acldefault('f', p.proowner))) acl
        join aclexplode(array[acl]) e on true
       where e.grantee = 0 and e.privilege_type = 'EXECUTE'
    ) as public_exec,
    p.prosrc as src
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'security_events_from_blocked_ips'
) q;
`),
  )
  const searchPath = (katalog.config ?? []).some((wert) => /^search_path=\s*$/.test(wert) || wert === 'search_path=""')
  bewerte('Producer ist SECURITY DEFINER', gruppe, katalog.security_definer === true, JSON.stringify(katalog.security_definer))
  bewerte('search_path ist leer/fixiert', gruppe, searchPath, JSON.stringify(katalog.config))
  bewerte(
    'PUBLIC/anon/authenticated/service_role haben kein EXECUTE',
    gruppe,
    katalog.anon_exec === false &&
      katalog.auth_exec === false &&
      katalog.service_exec === false &&
      katalog.public_exec === false,
    JSON.stringify(katalog),
  )
  bewerte(
    'Funktion ist Trigger-Funktion, keine Client-RPC',
    gruppe,
    katalog.returns_trigger === true,
    JSON.stringify(katalog.returns_trigger),
  )
  bewerte(
    'kein statement-weites n; Reserve ist used + 1',
    gruppe,
    /used \+ 1/.test(katalog.src) &&
      !/referencing/i.test(katalog.src) &&
      !/statement.wide|tg_argv|new table|old table/i.test(katalog.src),
    'prosrc inspected',
  )

  const triggers = jsonZeile(
    psqlFile(`
select jsonb_build_object(
  'row_triggers', count(*) filter (where t.tgtype & 1 = 1),
  'stmt_triggers', count(*) filter (where t.tgtype & 1 = 0),
  'names', jsonb_agg(t.tgname)
)
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname = 'blocked_ips' and not t.tgisinternal
  and t.tgfoid = 'public.security_events_from_blocked_ips'::regproc;
`),
  )
  bewerte(
    'Producer-Trigger sind AFTER ROW, nicht STATEMENT',
    gruppe,
    Number(triggers.row_triggers) >= 1 && Number(triggers.stmt_triggers) === 0,
    JSON.stringify(triggers),
  )

  const grants = jsonZeile(
    psqlFile(`
select to_jsonb(q) from (
  select
    has_table_privilege('anon', 'public.security_events', 'INSERT') as anon_insert,
    has_table_privilege('authenticated', 'public.security_events', 'INSERT') as auth_insert,
    has_table_privilege('authenticated', 'public.security_events', 'UPDATE') as auth_update,
    has_table_privilege('authenticated', 'public.security_events', 'DELETE') as auth_delete,
    has_table_privilege('authenticated', 'public.security_event_producer_quota', 'SELECT') as auth_quota,
    has_table_privilege('authenticated', 'public.security_event_producer_quota', 'UPDATE') as auth_quota_upd,
    pg_has_role('anon', 'postgres', 'MEMBER') as anon_inherits_owner,
    pg_has_role('authenticated', 'postgres', 'MEMBER') as auth_inherits_owner
) q;
`),
  )
  bewerte(
    'direkte Event-DML-Grants bleiben geschlossen',
    gruppe,
    grants.anon_insert === false &&
      grants.auth_insert === false &&
      grants.auth_update === false &&
      grants.auth_delete === false &&
      grants.auth_quota === false &&
      grants.auth_quota_upd === false,
    JSON.stringify(grants),
  )
  bewerte(
    'keine unerwartete Rollenvererbung auf den Owner',
    gruppe,
    grants.anon_inherits_owner === false && grants.auth_inherits_owner === false,
    JSON.stringify(grants),
  )

  mussAblehnen(
    'authenticated kann die Producer-Funktion nicht als RPC aufrufen',
    gruppe,
    {
      rolle: 'authenticated',
      uid: OPERATOR,
      aal: 'aal2',
      sql: `select public.security_events_from_blocked_ips()`,
    },
    '42501|permission denied',
  )

  const provenanceAcl = jsonZeile(
    psqlFile(`
select to_jsonb(q) from (
  select
    has_schema_privilege('anon', 'jetnity_internal', 'USAGE') as anon_schema,
    has_schema_privilege('authenticated', 'jetnity_internal', 'USAGE') as auth_schema,
    has_schema_privilege('service_role', 'jetnity_internal', 'USAGE') as service_schema,
    has_table_privilege('anon', 'jetnity_internal.security_event_producer_origin', 'SELECT') as anon_sel,
    has_table_privilege('authenticated', 'jetnity_internal.security_event_producer_origin', 'SELECT') as auth_sel,
    has_table_privilege('service_role', 'jetnity_internal.security_event_producer_origin', 'SELECT') as service_sel,
    has_table_privilege('service_role', 'jetnity_internal.security_event_producer_origin', 'INSERT') as service_ins,
    has_function_privilege(
      'anon',
      'jetnity_internal.security_event_is_trigger_produced(uuid)',
      'execute'
    ) as anon_fn,
    has_function_privilege(
      'authenticated',
      'jetnity_internal.security_event_is_trigger_produced(uuid)',
      'execute'
    ) as auth_fn,
    has_function_privilege(
      'service_role',
      'jetnity_internal.security_event_is_trigger_produced(uuid)',
      'execute'
    ) as service_fn,
    exists(
      select 1 from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = 'security_event_is_tracked_producer'
    ) as public_shape_classifier
) q;
`),
  )
  bewerte(
    'privates Provenienzschema ist für anon/authenticated/service_role geschlossen',
    gruppe,
    provenanceAcl.anon_schema === false &&
      provenanceAcl.auth_schema === false &&
      provenanceAcl.service_schema === false &&
      provenanceAcl.anon_sel === false &&
      provenanceAcl.auth_sel === false &&
      provenanceAcl.service_sel === false &&
      provenanceAcl.service_ins === false &&
      provenanceAcl.anon_fn === false &&
      provenanceAcl.auth_fn === false &&
      provenanceAcl.service_fn === false &&
      provenanceAcl.public_shape_classifier === false,
    JSON.stringify(provenanceAcl),
  )
}

async function warteBisServer(ziel, extraMs) {
  for (;;) {
    const delta = Number(
      psqlAt(`select extract(epoch from (clock_timestamp() - '${ziel}'::timestamptz))`),
    )
    if (delta * 1000 >= extraMs) return
    await sleep(40)
  }
}

function concurrentSession({ name, ip, ziel, haltenSekunden }) {
  return `
set application_name = '${name}';
begin;
select set_config('role', 'authenticated', true);
select set_config('request.jwt.claims', $c$${claims({ uid: OPERATOR, aal: 'aal2' })}$c$, true);
select pg_sleep(greatest(0, extract(epoch from ('${ziel}'::timestamptz - clock_timestamp()))));
insert into public.blocked_ips (ip, reason) values ('${ip}', '${name}');
select pg_sleep(${haltenSekunden});
commit;
select 'ok';
`
}

async function pruefeConcurrentAdmission() {
  const gruppe = 'R2-concurrency'
  let beobachtet = null

  for (let versuch = 1; versuch <= 3; versuch += 1) {
    resetStand()
    festgeschrieben({
      rolle: 'authenticated',
      uid: OPERATOR,
      aal: 'aal2',
      sql: `insert into public.blocked_ips (ip, reason) values ('192.0.2.90', 'c-seed-1')`,
    })
    festgeschrieben({
      rolle: 'authenticated',
      uid: OPERATOR,
      aal: 'aal2',
      sql: `insert into public.blocked_ips (ip, reason) values ('192.0.2.91', 'c-seed-2')`,
    })
    const usedBefore = Number(
      psqlAt(`select used from public.security_event_producer_quota where id = 'tracked_producer'`),
    )
    if (usedBefore !== CAP - 1) {
      bewerte('Concurrency-Saat steht auf C-1', gruppe, false, `used=${usedBefore}`)
      return
    }

    const ziel = psqlAt(`select (clock_timestamp() + interval '2500 milliseconds')::text`)
    const a = spawnPsql(concurrentSession({ name: 'producer-a', ip: '192.0.2.201', ziel, haltenSekunden: 2.4 }))
    const b = spawnPsql(concurrentSession({ name: 'producer-b', ip: '192.0.2.202', ziel, haltenSekunden: 0.2 }))
    await warteBisServer(ziel, 350)
    const locks = jsonZeile(
      psqlFile(`
select jsonb_build_object(
  'activity', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'application_name', application_name,
      'state', state,
      'wait_event_type', wait_event_type,
      'wait_event', wait_event
    ) order by application_name), '[]'::jsonb)
    from pg_stat_activity
    where application_name in ('producer-a', 'producer-b')
  ),
  'locks', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'application_name', a.application_name,
      'relation', c.relname,
      'mode', l.mode,
      'granted', l.granted
    )), '[]'::jsonb)
    from pg_locks l
    join pg_stat_activity a on a.pid = l.pid
    left join pg_class c on c.oid = l.relation
    where a.application_name in ('producer-a', 'producer-b')
      and c.relname = 'security_event_producer_quota'
  )
);
`),
    )
    const [ra, rb] = await Promise.all([a, b])
    const nachher = jsonZeile(
      psqlFile(`
select to_jsonb(q) from (
  select
    (select used from public.security_event_producer_quota where id = 'tracked_producer') as used,
    (select count(*) from public.security_events e
      where jetnity_internal.security_event_is_trigger_produced(e.id)) as tracked,
    exists(select 1 from public.blocked_ips where ip = '192.0.2.201') as a_row,
    exists(select 1 from public.blocked_ips where ip = '192.0.2.202') as b_row
) q;
`),
    )
    const aOk = ra.code === 0
    const bOk = rb.code === 0
    const einerGewinnt = aOk !== bOk
    const waitGesehen =
      (locks.activity ?? []).some((row) => row.wait_event_type === 'Lock') ||
      (locks.locks ?? []).some((row) => row.granted === false)
    beobachtet = { versuch, ziel, locks, ra, rb, nachher, einerGewinnt, waitGesehen }
    concurrencyBeweis.push(beobachtet)
    if (einerGewinnt && Number(nachher.used) === CAP && Number(nachher.tracked) === CAP && waitGesehen) {
      break
    }
  }

  const ok =
    beobachtet &&
    beobachtet.einerGewinnt &&
    Number(beobachtet.nachher.used) === CAP &&
    Number(beobachtet.nachher.tracked) === CAP &&
    beobachtet.waitGesehen &&
    !(beobachtet.nachher.a_row && beobachtet.nachher.b_row)
  bewerte(
    'zwei parallele Transaktionen bei C-1 überschreiten C nicht; eine wartet und scheitert',
    gruppe,
    Boolean(ok),
    JSON.stringify({
      versuche: concurrencyBeweis.length,
      wait: beobachtet?.waitGesehen,
      codes: { a: beobachtet?.ra.code, b: beobachtet?.rb.code },
      nachher: beobachtet?.nachher,
      activity: beobachtet?.locks.activity,
      quotaLocks: beobachtet?.locks.locks,
      stderr: { a: beobachtet?.ra.stderr, b: beobachtet?.rb.stderr },
    }),
  )
}

async function main() {
  sichereUmgebung()
  if (typeof execFileSync !== 'function' || typeof spawn !== 'function') {
    throw new Error('Echte lokale Prozess-Concurrency ist in dieser Umgebung nicht verfügbar.')
  }

  starteCluster()
  legeDatenbankAn()

  try {
    pruefeDirektUndAutorisierung()
    pruefeProducerIntegritaet()
    pruefePayload()
    pruefeR1()
    pruefeInvalidUndAdmission()
    pruefeCleanupUndLegacy()
    pruefeProvenienz()
    pruefeKatalog()
    await pruefeConcurrentAdmission()
  } finally {
    if (psqlAt(`select 1 from pg_database where datname = '${DB}'`, 'postgres') === '1') {
      psqlAt(`drop database ${DB} with (force)`, 'postgres')
    }
  }

  const fehler = ergebnisse.filter((eintrag) => !eintrag.ok)
  console.log(`\n${ergebnisse.length - fehler.length}/${ergebnisse.length} isolierte Producer-Nachweise erfüllt.`)
  console.log('Ziel: lokale disposable PostgreSQL. Supabase und Production nicht berührt.')
  console.log(`Concurrency-Läufe: ${concurrencyBeweis.length}`)
  if (fehler.length) {
    console.error('Fehlgeschlagen:')
    for (const eintrag of fehler) {
      console.error(`- [${eintrag.gruppe}] ${eintrag.name}: ${eintrag.detail}`)
    }
    process.exit(1)
  }
}

main().catch((fehler) => {
  console.error(fehler)
  try {
    if (psqlAt(`select 1 from pg_database where datname = '${DB}'`, 'postgres') === '1') {
      psqlAt(`drop database ${DB} with (force)`, 'postgres')
    }
  } catch {
    // Best-effort drop of the disposable database.
  }
  process.exit(1)
})
