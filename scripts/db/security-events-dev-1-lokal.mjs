#!/usr/bin/env node
// Local disposable proof for Development security-event retention.
// Never connects to Supabase, Development, Preview, or Production.
// Does not read or forward injected Supabase keys.

import { execFileSync, spawn } from 'node:child_process'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const OPERATOR = '11111111-1111-4111-8111-111111111111'
const MODERATOR = '22222222-2222-4222-8222-222222222222'
const TRAVELLER = '33333333-3333-4333-8333-333333333333'
const OTHER = '44444444-4444-4444-8444-444444444444'
const DB = 'jetnity_security_events_dev_lokal'
const CAP = 1000
const ROOT = new URL('../..', import.meta.url).pathname
const DIR = join(ROOT, 'scripts/db/security-events-dev-1')
const BOOTSTRAP = join(ROOT, 'scripts/db/security-events-producer-contract-lokal-bootstrap.sql')
const EVIDENCE = join(ROOT, 'docs/evidence/dev-security-event-logging-retention-1/local-execution.json')

const REMOTE_OVERRIDE_KEYS = [
  'JETNITY_ALLOW_REMOTE_DB',
  'JETNITY_SECURITY_EVENTS_DB_URL',
  'SECURITY_EVENTS_DATABASE_URL',
  'JETNITY_LOCAL_DB_URL',
  'DATABASE_URL',
  'SUPABASE_DB_URL',
  'PGHOST',
  'PGPORT',
  'PGPASSWORD',
]

const ergebnisse = []
let eigeneDatenbank = false

function claims({ uid, rolle = 'authenticated', aal, extra = {} }) {
  if (!uid) return ''
  return JSON.stringify({ sub: uid, role: rolle, ...(aal ? { aal } : {}), ...extra })
}

function bewerte(name, gruppe, ok, detail) {
  ergebnisse.push({ name, gruppe, ok, detail: String(detail ?? '').slice(0, 2000) })
  console.log(`${ok ? '  ok  ' : ' FEHL '} [${gruppe}] ${name}`)
  if (!ok && detail) console.log(`        ${String(detail).slice(0, 800)}`)
}

function sichereUmgebung() {
  if (process.env.JETNITY_ALLOW_REMOTE_DB === '1') {
    throw new Error('Remote-DB override JETNITY_ALLOW_REMOTE_DB=1 is refused.')
  }
  for (const schluessel of REMOTE_OVERRIDE_KEYS) {
    if (schluessel === 'JETNITY_ALLOW_REMOTE_DB') continue
    if (process.env[schluessel]) {
      throw new Error(`Remote connection override ${schluessel} is refused.`)
    }
  }
  if (process.argv.some((arg) => /supabase\.(co|com)|pooler\.supabase|postgres:\/\//i.test(arg))) {
    throw new Error('Remote database target in arguments is refused.')
  }
}

function psqlArgs(datenbank, extra = []) {
  return ['-u', 'postgres', 'psql', '-v', 'ON_ERROR_STOP=1', '-d', datenbank, ...extra]
}

function psqlSql(sql, datenbank = DB) {
  execFileSync('sudo', psqlArgs(datenbank, ['-f', '-']), { input: sql, stdio: ['pipe', 'pipe', 'pipe'] })
}

function psqlCapture(sql, datenbank = DB) {
  try {
    const stdout = execFileSync('sudo', psqlArgs(datenbank, ['-f', '-']), {
      input: sql,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    return { code: 0, stdout, stderr: '' }
  } catch (fehler) {
    return {
      code: fehler.status ?? 1,
      stdout: `${fehler.stdout ?? ''}`,
      stderr: `${fehler.stderr ?? fehler.message ?? ''}`,
    }
  }
}

function psqlAt(sql, datenbank = DB) {
  return execFileSync('sudo', psqlArgs(datenbank, ['-At', '-q', '-c', sql]), { encoding: 'utf8' }).trim()
}

function psqlFile(sql, datenbank = DB) {
  return execFileSync('sudo', psqlArgs(datenbank, ['-At', '-q', '-f', '-']), {
    encoding: 'utf8',
    input: sql,
  }).trim()
}

function jsonZeile(roh) {
  const zeile = String(roh)
    .split('\n')
    .map((teil) => teil.trim())
    .reverse()
    .find((teil) => teil.startsWith('{') || teil.startsWith('['))
  if (!zeile) throw new Error(`No JSON row.\n${roh}`)
  return JSON.parse(zeile)
}

function spawnPsql(sql) {
  return new Promise((resolve) => {
    const child = spawn('sudo', psqlArgs(DB, ['-At', '-q', '-f', '-']), { stdio: ['pipe', 'pipe', 'pipe'] })
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

function sitzung({ rolle, uid, aal, extraClaims = {}, sql, inspektion = 'select 1 as ok' }) {
  const jwt = claims({
    uid,
    rolle: rolle === 'service_role' ? 'service_role' : 'authenticated',
    aal,
    extra: extraClaims,
  })
  const roh = psqlFile(`
begin;
select jetnity_test.sitzung($r$${rolle}$r$, $c$${jwt}$c$, $a$${sql}$a$, $i$${inspektion}$i$);
rollback;
`)
  return jsonZeile(roh)
}

function festgeschrieben({ rolle, uid, aal, extraClaims = {}, sql, inspektion = 'select 1 as ok' }) {
  const jwt = claims({
    uid,
    rolle: rolle === 'service_role' ? 'service_role' : 'authenticated',
    aal,
    extra: extraClaims,
  })
  const roh = psqlFile(`
begin;
select jetnity_test.sitzung($r$${rolle}$r$, $c$${jwt}$c$, $a$${sql}$a$, $i$${inspektion}$i$);
commit;
`)
  return jsonZeile(roh)
}

function mussAblehnen(name, gruppe, opts, muster) {
  const ergebnis = sitzung(opts)
  const ok =
    ergebnis.arbeit?.ok === false &&
    (!muster || new RegExp(muster, 'i').test(`${ergebnis.arbeit.sqlstate} ${ergebnis.arbeit.message}`))
  bewerte(name, gruppe, ok, ok ? `${ergebnis.arbeit.sqlstate} ${ergebnis.arbeit.message}` : JSON.stringify(ergebnis.arbeit))
  return ergebnis
}

function mussErlauben(name, gruppe, opts) {
  const ergebnis = opts.commit ? festgeschrieben(opts) : sitzung(opts)
  const ok = ergebnis.arbeit?.ok === true
  bewerte(name, gruppe, ok, ok ? `row_count=${ergebnis.arbeit.row_count}` : `${ergebnis.arbeit?.sqlstate} ${ergebnis.arbeit?.message}`)
  return ergebnis
}

function stand() {
  return jsonZeile(psqlFile(`
select jsonb_build_object(
  'used', (select used from jetnity_internal.security_event_producer_quota where id = 'tracked_producer'),
  'enabled', (select enabled from jetnity_internal.security_event_producer_quota where id = 'tracked_producer'),
  'origins', (select count(*) from jetnity_internal.security_event_producer_origin),
  'tracked', (select count(*) from public.security_events e where jetnity_internal.security_event_is_dev_produced(e.id)),
  'legacy', (select count(*) from public.security_events where type = 'login_failed'),
  'lookalike', (select count(*) from public.security_events where type = 'admin_blocklist_add' and not jetnity_internal.security_event_is_dev_produced(id)),
  'blocked', (select count(*) from public.blocked_ips),
  'state', (select state from jetnity_internal.security_event_dev_control where id = 'dev_v1'),
  'health', jetnity_internal.security_event_dev_health_state(),
  'kind', (select last_success_kind from jetnity_internal.security_event_dev_control where id = 'dev_v1'),
  'triggers', (select count(*) from pg_trigger where not tgisinternal and tgname like 'security_event_dev_v1_%')
);
`))
}

function resetAdmission() {
  psqlSql(`
alter table public.blocked_ips disable trigger user;
delete from public.blocked_ips;
alter table public.blocked_ips enable trigger user;
delete from public.security_events e
 using jetnity_internal.security_event_producer_origin o
 where o.event_id = e.id;
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
  const cronDb = psqlAt(`select current_setting('cron.database_name')`, 'postgres')
  if (cronDb !== DB) {
    throw new Error(`Local cron.database_name is ${cronDb}, expected ${DB}. Refusing to retarget a database.`)
  }
  if (psqlAt(`select 1 from pg_database where datname = '${DB}'`, 'postgres') === '1') {
    psqlAt(`select pg_terminate_backend(pid) from pg_stat_activity where datname = '${DB}' and pid <> pg_backend_pid()`, 'postgres')
    psqlAt(`drop database ${DB} with (force)`, 'postgres')
  }
  psqlAt(`create database ${DB}`, 'postgres')
  eigeneDatenbank = true
  psqlSql('create extension if not exists pg_cron;', DB)
  psqlSql(readFileSync(BOOTSTRAP, 'utf8'), DB)
  psqlSql(
    `
insert into auth.users (id) values ('${OPERATOR}'), ('${MODERATOR}'), ('${TRAVELLER}'), ('${OTHER}');
insert into public.creator_profiles (user_id, role, status) values
  ('${OPERATOR}', 'operator', 'active'),
  ('${MODERATOR}', 'moderator', 'active'),
  ('${TRAVELLER}', 'user', 'active'),
  ('${OTHER}', 'operator', 'active');
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

create schema if not exists jetnity_test;
create or replace function jetnity_test.sitzung(_role text, _claims text, _arbeit text, _inspektion text)
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

drop trigger if exists jetnity_test_fault_event_insert on public.security_events;
create trigger jetnity_test_fault_event_insert
before insert on public.security_events
for each row
execute function jetnity_test.fault_event_insert();
`,
    DB,
  )
}

function pruefeAbwesenheit() {
  const gruppe = 'before'
  const operator = festgeschrieben({
    rolle: 'authenticated',
    uid: OPERATOR,
    aal: 'aal2',
    sql: `insert into public.blocked_ips (ip, reason) values ('192.0.2.10', 'before-producer')`,
    inspektion: `select count(*) as events from public.security_events where user_id = '${OPERATOR}'`,
  })
  const vorher = jsonZeile(psqlFile(`
select jsonb_build_object(
  'quota', to_regclass('jetnity_internal.security_event_producer_quota') is not null,
  'origin', to_regclass('jetnity_internal.security_event_producer_origin') is not null,
  'blocked', (select count(*) from public.blocked_ips),
  'operator_events', (select count(*) from public.security_events where user_id = '${OPERATOR}')
);
`))
  bewerte(
    'before install, blocklist write commits and no producer objects or actor events exist',
    gruppe,
    operator.arbeit?.ok === true &&
      vorher.quota === false &&
      vorher.origin === false &&
      Number(vorher.blocked) === 1 &&
      Number(vorher.operator_events) === 0,
    JSON.stringify(vorher),
  )
  psqlSql(`delete from public.blocked_ips where ip = '192.0.2.10';`)
}

function pruefeKollision() {
  const gruppe = 'scheduler'
  psqlSql(`
insert into cron.job (schedule, command, nodename, nodeport, database, username, active, jobname)
values ('* * * * *', 'select 1', 'localhost', coalesce(inet_server_port(), 5432), current_database(), current_user, true,
        'jetnity-security-events-dev-cleanup-v1');
`)
  const install = psqlCapture(readFileSync(join(DIR, '10-install-dormant.sql'), 'utf8'))
  const tabellen = psqlAt(`select to_regclass('jetnity_internal.security_event_dev_control') is not null`)
  bewerte(
    'job-name collision aborts dormant install and leaves no control table',
    gruppe,
    install.code !== 0 && /collision/i.test(`${install.stderr}${install.stdout}`) && tabellen === 'f',
    install.stderr.slice(0, 500),
  )
  psqlSql(`delete from cron.job where jobname = 'jetnity-security-events-dev-cleanup-v1';`)
}

function installiere() {
  const install = psqlCapture(readFileSync(join(DIR, '10-install-dormant.sql'), 'utf8'))
  if (install.code !== 0) {
    throw new Error(`Dormant install failed.\n${install.stderr}\n${install.stdout}`)
  }
  const erneut = psqlCapture(readFileSync(join(DIR, '10-install-dormant.sql'), 'utf8'))
  const nach = stand()
  bewerte(
    'dormant install and safe re-run leave triggers detached and health unknown',
    'install',
    erneut.code === 0 && nach.state === 'dormant' && Number(nach.triggers) === 0 && nach.health === 'unknown' && nach.enabled === false,
    JSON.stringify(nach),
  )
}

function pruefeDormantUndAktivierung() {
  const gruppe = 'activation'
  const geschrieben = festgeschrieben({
    rolle: 'authenticated',
    uid: OPERATOR,
    aal: 'aal2',
    sql: `insert into public.blocked_ips (ip, reason) values ('192.0.2.11', 'dormant')`,
  })
  const nachDormant = stand()
  bewerte(
    'dormant install does not audit or block an operator blocklist insert',
    gruppe,
    geschrieben.arbeit?.ok === true && Number(nachDormant.tracked) === 0 && Number(nachDormant.blocked) === 1,
    JSON.stringify(nachDormant),
  )
  psqlSql(`delete from public.blocked_ips where ip = '192.0.2.11';`)

  const ohneHealth = psqlCapture(`select jetnity_internal.security_event_dev_activate();`)
  bewerte(
    'activation refuses unknown cleanup health',
    gruppe,
    ohneHealth.code !== 0 && /health/i.test(`${ohneHealth.stderr}`),
    ohneHealth.stderr.slice(0, 400),
  )

  psqlSql(`select jetnity_internal.security_event_dev_cleanup('manual');`)
  const nurManuell = psqlCapture(`select jetnity_internal.security_event_dev_activate();`)
  bewerte(
    'manual cleanup does not satisfy activation',
    gruppe,
    nurManuell.code !== 0 && /scheduled/i.test(`${nurManuell.stderr}`),
    nurManuell.stderr.slice(0, 400),
  )

  psqlSql(`select jetnity_internal.security_event_dev_cleanup('scheduled');`)
  const ohneNative = psqlCapture(`select jetnity_internal.security_event_dev_activate();`)
  bewerte(
    'scheduled function stamp without cron run detail does not activate',
    gruppe,
    ohneNative.code !== 0 && /native/i.test(`${ohneNative.stderr}`),
    ohneNative.stderr.slice(0, 400),
  )

  psqlSql(`
insert into cron.job_run_details (jobid, job_pid, database, username, command, status, return_message, start_time, end_time)
select j.jobid, 0, current_database(), current_user, j.command, 'succeeded',
       'LOCAL_FIXTURE_NOT_HOSTED_NATIVE', clock_timestamp() - interval '5 seconds', clock_timestamp()
  from cron.job j
 where j.jobname = 'jetnity-security-events-dev-cleanup-v1';
`)
  const datei = psqlCapture(readFileSync(join(DIR, '20-activate.sql'), 'utf8'))
  const aktiv = stand()
  bewerte(
    'operator activate file attaches all five triggers after fixture cron evidence',
    gruppe,
    datei.code === 0 && aktiv.state === 'active' && Number(aktiv.triggers) === 5 && aktiv.enabled === true,
    JSON.stringify({ aktiv, stderr: datei.stderr.slice(0, 300), native: 'LOCAL_FIXTURE_NOT_HOSTED_NATIVE' }),
  )
  const erneut = psqlCapture(readFileSync(join(DIR, '20-activate.sql'), 'utf8'))
  const nachErneut = stand()
  bewerte(
    'activation re-run stays at five triggers',
    gruppe,
    erneut.code === 0 && Number(nachErneut.triggers) === 5,
    erneut.stderr.slice(0, 300),
  )
}

function pruefeAutorisierung() {
  const gruppe = 'auth'
  mussAblehnen('anon cannot insert security_events', gruppe, {
    rolle: 'anon',
    sql: `insert into public.security_events (type, extra) values ('admin_blocklist_add', '{"forged":true}')`,
  })
  mussAblehnen('operator cannot insert security_events directly', gruppe, {
    rolle: 'authenticated',
    uid: OPERATOR,
    aal: 'aal2',
    sql: `insert into public.security_events (type, user_id, created_at, extra, ip, metadata)
          values ('admin_blocklist_remove', '${TRAVELLER}', '2010-01-01', '{"surface":"client"}', '192.0.2.9', '{"k":1}')`,
  })
  mussAblehnen('moderator AAL2 cannot mutate blocked_ips', gruppe, {
    rolle: 'authenticated',
    uid: MODERATOR,
    aal: 'aal2',
    sql: `insert into public.blocked_ips (ip, reason) values ('192.0.2.12', 'moderator')`,
  })
  mussAblehnen('operator AAL1 cannot mutate blocked_ips', gruppe, {
    rolle: 'authenticated',
    uid: OPERATOR,
    aal: 'aal1',
    sql: `insert into public.blocked_ips (ip, reason) values ('192.0.2.13', 'aal1')`,
  })
  mussAblehnen('break-glass claim does not grant moderator a blocklist write', gruppe, {
    rolle: 'authenticated',
    uid: MODERATOR,
    aal: 'aal2',
    extraClaims: { break_glass: true },
    sql: `insert into public.blocked_ips (ip, reason) values ('192.0.2.14', 'break-glass')`,
  })
  mussAblehnen('authenticated cannot execute cleanup', gruppe, {
    rolle: 'authenticated',
    uid: OPERATOR,
    aal: 'aal2',
    sql: `select jetnity_internal.security_event_dev_cleanup('manual')`,
  }, '42501')
  const origin = sitzung({
    rolle: 'service_role',
    sql: `insert into jetnity_internal.security_event_producer_origin (event_id, actor_id, producer, source_op)
          values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '${OPERATOR}', 'blocked_ips_dev_v1', 'INSERT')`,
  })
  bewerte(
    'service_role cannot forge an origin row',
    gruppe,
    origin.arbeit?.ok === false,
    JSON.stringify(origin.arbeit),
  )
  const vorher = stand()
  const forged = festgeschrieben({
    rolle: 'service_role',
    sql: `insert into public.security_events (type, extra) values ('admin_blocklist_add', '{"forged":true}')`,
  })
  const nach = stand()
  bewerte(
    'existing service_role event insert stays unaudited and does not move quota',
    gruppe,
    forged.arbeit?.ok === true && Number(nach.used) === Number(vorher.used) && Number(nach.origins) === Number(vorher.origins),
    JSON.stringify({ forged: forged.arbeit, used: nach.used }),
  )
  psqlSql(`delete from public.security_events where extra = '{"forged":true}'::jsonb;`)
}

function pruefeProducer() {
  const gruppe = 'producer'
  const insert = festgeschrieben({
    rolle: 'authenticated',
    uid: OPERATOR,
    aal: 'aal2',
    sql: `insert into public.blocked_ips (ip, reason) values ('192.0.2.20', 'secret-token-not-in-event')`,
    inspektion: `
      select e.type, e.ip, e.user_id::text, e.metadata, e.extra, e.created_at > pg_catalog.now() - interval '5 minutes' as fresh
        from public.security_events e
        join jetnity_internal.security_event_producer_origin o on o.event_id = e.id
       where o.source_op = 'INSERT'
       order by e.created_at desc
       limit 1
    `,
  })
  const event = insert.inspektion
  bewerte(
    'AAL2 operator insert emits one fixed event and ignores caller payload',
    gruppe,
    insert.arbeit?.ok === true &&
      event?.type === 'admin_blocklist_add' &&
      event?.ip === null &&
      event?.metadata === null &&
      event?.user_id === OPERATOR &&
      event?.fresh === true &&
      event?.extra?.surface === 'blocked_ips' &&
      event?.extra?.result === 'ok' &&
      event?.extra?.op === 'INSERT' &&
      !JSON.stringify(event?.extra).includes('secret-token'),
    JSON.stringify(event),
  )
  const noOp = festgeschrieben({
    rolle: 'authenticated',
    uid: OPERATOR,
    aal: 'aal2',
    sql: `update public.blocked_ips set reason = 'secret-token-not-in-event' where ip = '192.0.2.20'`,
  })
  const zero = festgeschrieben({
    rolle: 'authenticated',
    uid: OPERATOR,
    aal: 'aal2',
    sql: `update public.blocked_ips set reason = 'missing' where ip = '192.0.2.404'`,
  })
  const afterNoOp = stand()
  bewerte(
    'no-op update and zero-row update emit nothing',
    gruppe,
    noOp.arbeit?.ok === true && zero.arbeit?.ok === true && Number(afterNoOp.tracked) === 1,
    JSON.stringify({ noOp: noOp.arbeit, zero: zero.arbeit, tracked: afterNoOp.tracked }),
  )
  const update = festgeschrieben({
    rolle: 'authenticated',
    uid: OPERATOR,
    aal: 'aal2',
    sql: `update public.blocked_ips set reason = 'changed' where ip = '192.0.2.20'`,
    inspektion: `select count(*) as n from jetnity_internal.security_event_producer_origin where source_op = 'UPDATE'`,
  })
  bewerte(
    'real update emits admin_blocklist_add with op UPDATE',
    gruppe,
    update.arbeit?.ok === true && Number(update.inspektion?.n) === 1,
    JSON.stringify(update.inspektion),
  )
  const remove = festgeschrieben({
    rolle: 'authenticated',
    uid: OPERATOR,
    aal: 'aal2',
    sql: `delete from public.blocked_ips where ip = '192.0.2.20'`,
    inspektion: `select count(*) as n from public.security_events where type = 'admin_blocklist_remove'`,
  })
  bewerte(
    'delete emits admin_blocklist_remove',
    gruppe,
    remove.arbeit?.ok === true && Number(remove.inspektion?.n) === 1 && Number(stand().tracked) === 3,
    JSON.stringify(remove.inspektion),
  )
  const uncovered = festgeschrieben({
    rolle: 'service_role',
    sql: `insert into public.blocked_ips (ip, reason) values ('192.0.2.21', 'no-actor')`,
  })
  const nachUncovered = stand()
  bewerte(
    'no-actor service_role blocklist write is the disclosed uncovered case',
    gruppe,
    uncovered.arbeit?.ok === true && Number(nachUncovered.blocked) === 1 && Number(nachUncovered.tracked) === 3,
    JSON.stringify(nachUncovered),
  )
  psqlSql(`
alter table public.blocked_ips disable trigger user;
delete from public.blocked_ips where ip = '192.0.2.21';
alter table public.blocked_ips enable trigger user;
`)
}

function pruefeAtomaritaet() {
  const gruppe = 'atomicity'
  const before = stand()
  const fault = festgeschrieben({
    rolle: 'authenticated',
    uid: OPERATOR,
    aal: 'aal2',
    sql: `do $do$ begin
      perform set_config('jetnity.fault_event_insert', 'on', true);
      insert into public.blocked_ips (ip, reason) values ('192.0.2.30', 'fault');
    end $do$`,
  })
  const after = stand()
  bewerte(
    'injected event failure rolls back the blocklist row and quota',
    gruppe,
    fault.arbeit?.ok === false && Number(after.used) === Number(before.used) && Number(after.blocked) === Number(before.blocked),
    JSON.stringify({ fault: fault.arbeit, before: before.used, after: after.used }),
  )
  psqlSql(`
begin;
insert into public.blocked_ips (ip, reason) values ('192.0.2.31', 'outer');
-- role is superuser here; the producer skips a null actor. The rollback
-- proof below uses the operator session instead.
rollback;
`)
  const outer = psqlFile(`
begin;
select set_config('role', 'authenticated', true);
select set_config('request.jwt.claims', $c$${claims({ uid: OPERATOR, aal: 'aal2' })}$c$, true);
insert into public.blocked_ips (ip, reason) values ('192.0.2.31', 'outer');
rollback;
select jsonb_build_object(
  'blocked', exists(select 1 from public.blocked_ips where ip = '192.0.2.31'),
  'used', (select used from jetnity_internal.security_event_producer_quota where id = 'tracked_producer')
);
`)
  const outerJson = jsonZeile(outer)
  bewerte(
    'outer rollback drops the blocklist row and the reservation',
    gruppe,
    outerJson.blocked === false && Number(outerJson.used) === Number(before.used),
    JSON.stringify(outerJson),
  )
}

function seedCap(count) {
  resetAdmission()
  const seeded = festgeschrieben({
    rolle: 'authenticated',
    uid: OPERATOR,
    aal: 'aal2',
    sql: `insert into public.blocked_ips (ip, reason)
          select 'dev-seed-' || lpad(g::text, 4, '0'), 'seed'
            from generate_series(1, ${count}) g`,
  })
  const nach = stand()
  if (seeded.arbeit?.ok !== true || Number(nach.used) !== count || Number(nach.tracked) !== count) {
    throw new Error(`Cap seed failed: ${JSON.stringify({ seeded: seeded.arbeit, nach })}`)
  }
  return nach
}

function pruefeCapUndParallel() {
  const gruppe = 'cap'
  const seeded = seedCap(CAP - 1)
  bewerte('seed stands at C-1 for the fixed cap 1000', gruppe, Number(seeded.used) === CAP - 1, JSON.stringify(seeded))
  const overflow = festgeschrieben({
    rolle: 'authenticated',
    uid: OPERATOR,
    aal: 'aal2',
    sql: `insert into public.blocked_ips (ip, reason) values ('192.0.2.40', 'overflow-a'), ('192.0.2.41', 'overflow-b')`,
  })
  const nachOverflow = stand()
  bewerte(
    'multi-row overflow rolls back every row and leaks no reservation',
    gruppe,
    overflow.arbeit?.ok === false &&
      Number(nachOverflow.used) === CAP - 1 &&
      Number(nachOverflow.blocked) === CAP - 1,
    JSON.stringify({ overflow: overflow.arbeit, used: nachOverflow.used, blocked: nachOverflow.blocked }),
  )
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

async function warteBis(ziel, extraMs) {
  for (;;) {
    const delta = Number(psqlAt(`select extract(epoch from (clock_timestamp() - '${ziel}'::timestamptz))`))
    if (delta * 1000 >= extraMs) return
    await sleep(40)
  }
}

async function pruefeConcurrentAdmission() {
  const gruppe = 'concurrency'
  let beobachtet = null
  for (let versuch = 1; versuch <= 3; versuch += 1) {
    seedCap(CAP - 1)
    const ziel = psqlAt(`select (clock_timestamp() + interval '2500 milliseconds')::text`)
    const a = spawnPsql(concurrentSession({ name: 'producer-a', ip: '192.0.2.201', ziel, haltenSekunden: 1.6 }))
    const b = spawnPsql(concurrentSession({ name: 'producer-b', ip: '192.0.2.202', ziel, haltenSekunden: 0.2 }))
    await warteBis(ziel, 350)
    const locks = jsonZeile(psqlFile(`
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
`))
    const [ra, rb] = await Promise.all([a, b])
    const nach = stand()
    const waitGesehen =
      (locks.activity ?? []).some((row) => row.wait_event_type === 'Lock') ||
      (locks.locks ?? []).some((row) => row.granted === false)
    const einer = (ra.code === 0) !== (rb.code === 0)
    beobachtet = { versuch, waitGesehen, einer, ra, rb, nach, locks }
    if (einer && waitGesehen && Number(nach.used) === CAP && Number(nach.tracked) === CAP) break
  }
  const nach = beobachtet.nach
  bewerte(
    'two sessions at C-1 cannot commit C+1; one waits and fails',
    gruppe,
    Boolean(beobachtet.einer && beobachtet.waitGesehen && Number(nach.used) === CAP && Number(nach.tracked) === CAP),
    JSON.stringify({
      versuch: beobachtet.versuch,
      waitGesehen: beobachtet.waitGesehen,
      codes: { a: beobachtet.ra.code, b: beobachtet.rb.code },
      used: nach.used,
      blocked: nach.blocked,
      activity: beobachtet.locks.activity,
      quotaLocks: beobachtet.locks.locks,
      stderr: { a: beobachtet.ra.stderr.slice(0, 300), b: beobachtet.rb.stderr.slice(0, 300) },
    }),
  )
  const bothRows =
    psqlAt(`select (exists(select 1 from public.blocked_ips where ip = '192.0.2.201') and exists(select 1 from public.blocked_ips where ip = '192.0.2.202'))`) === 't'
  bewerte('the losing concurrent insert is absent', gruppe, !bothRows && Number(nach.blocked) === CAP, `bothRows=${bothRows} blocked=${nach.blocked}`)
}

function pruefeLockTimeoutUndReihenfolge() {
  const gruppe = 'locks'
  resetAdmission()
  festgeschrieben({
    rolle: 'authenticated',
    uid: OPERATOR,
    aal: 'aal2',
    sql: `insert into public.blocked_ips (ip, reason) values ('192.0.2.50', 'held')`,
  })
  const halter = spawnPsql(`
set application_name = 'quota-holder';
begin;
select used from jetnity_internal.security_event_producer_quota where id = 'tracked_producer' for update;
select pg_sleep(8);
commit;
`)
  return sleep(300).then(async () => {
    const versuch = spawnPsql(`
set application_name = 'quota-waiter';
begin;
select set_config('role', 'authenticated', true);
select set_config('request.jwt.claims', $c$${claims({ uid: OPERATOR, aal: 'aal2' })}$c$, true);
insert into public.blocked_ips (ip, reason) values ('192.0.2.51', 'timeout');
commit;
`)
    await sleep(400)
    const warten = jsonZeile(psqlFile(`
select jsonb_build_object(
  'waiter', (
    select coalesce(jsonb_agg(jsonb_build_object('state', state, 'wait_event_type', wait_event_type, 'wait_event', wait_event)), '[]'::jsonb)
      from pg_stat_activity where application_name = 'quota-waiter'
  )
);
`))
    const ergebnis = await versuch
    await halter
    const vorhanden = psqlAt(`select exists(select 1 from public.blocked_ips where ip = '192.0.2.51')`)
    const used = Number(stand().used)
    bewerte(
      'admission lock_timeout aborts the waiter and keeps the prior reservation',
      gruppe,
      ergebnis.code !== 0 &&
        /lock timeout|55P03/i.test(`${ergebnis.stderr}`) &&
        vorhanden === 'f' &&
        used === 1 &&
        (warten.waiter ?? []).some((row) => row.wait_event_type === 'Lock'),
      JSON.stringify({ stderr: ergebnis.stderr.slice(0, 300), warten, used, vorhanden }),
    )
  })
}

async function pruefeErasureUndCleanup() {
  const gruppe = 'lifecycle'
  resetAdmission()
  festgeschrieben({
    rolle: 'authenticated',
    uid: OPERATOR,
    aal: 'aal2',
    sql: `insert into public.blocked_ips (ip, reason)
          select 'life-' || g::text, 'life' from generate_series(1, 3) g`,
  })
  psqlSql(`
insert into public.security_events (type, user_id, extra)
values ('login_failed', '${OPERATOR}', '{"fixture":"same-user-legacy"}'::jsonb);
`)
  const before = stand()
  const geloescht = festgeschrieben({
    rolle: 'service_role',
    sql: `delete from public.security_events where user_id = '${OPERATOR}'`,
  })
  const nachDelete = stand()
  const authBleibt = psqlAt(`select exists(select 1 from auth.users where id = '${OPERATOR}')`)
  bewerte(
    'account-style event delete removes mixed rows once and leaves the Auth user for the later step',
    gruppe,
    geloescht.arbeit?.ok === true &&
      Number(before.used) === 3 &&
      Number(nachDelete.used) === 0 &&
      Number(nachDelete.origins) === 0 &&
      Number(nachDelete.tracked) === 0 &&
      authBleibt === 't' &&
      Number(nachDelete.legacy) >= 1 &&
      Number(nachDelete.lookalike) === 1,
    JSON.stringify({ before, nachDelete, authBleibt }),
  )

  festgeschrieben({
    rolle: 'authenticated',
    uid: OPERATOR,
    aal: 'aal2',
    sql: `insert into public.blocked_ips (ip, reason) values ('192.0.2.60', 'race-old')`,
  })
  const alterEvent = psqlAt(`
select e.id::text
  from public.security_events e
  join jetnity_internal.security_event_producer_origin o on o.event_id = e.id
 where o.source_op = 'INSERT' and e.user_id = '${OPERATOR}'
 order by e.created_at desc
 limit 1
`)
  const mutation = spawnPsql(`
set application_name = 'race-mutation';
begin;
select set_config('role', 'authenticated', true);
select set_config('request.jwt.claims', $c$${claims({ uid: OPERATOR, aal: 'aal2' })}$c$, true);
insert into public.blocked_ips (ip, reason) values ('192.0.2.61', 'race-new');
select pg_sleep(1.2);
commit;
`)
  await sleep(350)
  const erasure = spawnPsql(`
set application_name = 'race-erasure';
begin;
set role service_role;
delete from public.security_events where user_id = '${OPERATOR}';
commit;
`)
  await sleep(250)
  const waits = jsonZeile(psqlFile(`
select coalesce(jsonb_agg(jsonb_build_object(
  'application_name', application_name,
  'wait_event_type', wait_event_type,
  'wait_event', wait_event
) order by application_name), '[]'::jsonb)
  from pg_stat_activity
 where application_name in ('race-mutation', 'race-erasure');
`))
  const [mutationErgebnis, erasureErgebnis] = await Promise.all([mutation, erasure])
  const zwischen = stand()
  const neuerNochDa = psqlAt(`
select exists(
  select 1 from public.security_events e
  join jetnity_internal.security_event_producer_origin o on o.event_id = e.id
  where e.user_id = '${OPERATOR}'
)
`)
  psqlSql(`delete from auth.users where id = '${OPERATOR}';`)
  const nachAuth = stand()
  const actorWeg = psqlAt(`select count(*) from public.security_events where user_id = '${OPERATOR}'`)
  bewerte(
    'mutation waits with erasure, then Auth deletion clears the event committed in that interval',
    gruppe,
    mutationErgebnis.code === 0 &&
      erasureErgebnis.code === 0 &&
      (waits ?? []).some((row) => row.wait_event_type === 'Lock') &&
      neuerNochDa === 't' &&
      actorWeg === '0' &&
      Number(nachAuth.origins) === 0 &&
      Number(nachAuth.used) === 0 &&
      Number(nachAuth.lookalike) === 1,
    JSON.stringify({
      waits,
      codes: { mutation: mutationErgebnis.code, erasure: erasureErgebnis.code },
      stderr: { mutation: mutationErgebnis.stderr.slice(0, 250), erasure: erasureErgebnis.stderr.slice(0, 250) },
      zwischenUsed: zwischen.used,
      neuerNochDa,
      alterEvent,
      actorWeg,
      lookalike: nachAuth.lookalike,
    }),
  )
  psqlSql(`
insert into auth.users (id) values ('${OPERATOR}') on conflict do nothing;
alter table public.blocked_ips disable trigger user;
delete from public.blocked_ips;
alter table public.blocked_ips enable trigger user;
`)

  festgeschrieben({
    rolle: 'authenticated',
    uid: OTHER,
    aal: 'aal2',
    sql: `insert into public.blocked_ips (ip, reason) values ('192.0.2.70', 'young'), ('192.0.2.71', 'old'), ('192.0.2.72', 'boundary')`,
  })
  psqlSql(`
update public.security_events
   set created_at = pg_catalog.clock_timestamp() - interval '8 days'
 where type = 'admin_blocklist_add'
   and user_id is null;
with numbered as (
  select e.id, row_number() over (order by e.created_at, e.id) as n
    from public.security_events e
    join jetnity_internal.security_event_producer_origin o on o.event_id = e.id
   where e.user_id = '${OTHER}'
)
update public.security_events e
   set created_at = case numbered.n
     when 1 then pg_catalog.clock_timestamp() - interval '7 days' - interval '1 minute'
     when 2 then pg_catalog.clock_timestamp() - interval '7 days' + interval '1 minute'
     else pg_catalog.clock_timestamp()
   end
  from numbered
 where e.id = numbered.id;
`)
  const vorCleanup = Number(stand().used)
  const cleanup = psqlFile(`
begin;
select jetnity_internal.security_event_dev_cleanup('manual');
select jsonb_build_object(
  'used', (select used from jetnity_internal.security_event_producer_quota where id = 'tracked_producer'),
  'tracked', (select count(*) from public.security_events e where jetnity_internal.security_event_is_dev_produced(e.id)),
  'lookalike', (select count(*) from public.security_events where type = 'admin_blocklist_add' and user_id is null),
  'legacy', (select count(*) from public.security_events where type = 'login_failed')
);
rollback;
`)
  const cleanupJson = jsonZeile(cleanup)
  const nachRollback = Number(stand().used)
  bewerte(
    'cleanup removes only expired provenance rows and rollback restores quota',
    gruppe,
    Number(vorCleanup) === 3 &&
      Number(cleanupJson.used) === 2 &&
      Number(cleanupJson.tracked) === 2 &&
      cleanupJson.lookalike === 1 &&
      Number(cleanupJson.legacy) >= 1 &&
      nachRollback === vorCleanup,
    JSON.stringify({ vorCleanup, cleanupJson, nachRollback }),
  )
  const committed = psqlCapture(readFileSync(join(DIR, '60-cleanup-manual.sql'), 'utf8'))
  const nachCommitted = stand()
  bewerte(
    'committed manual cleanup expires the old provenance row and keeps the look-alike',
    gruppe,
    committed.code === 0 && Number(nachCommitted.lookalike) === 1 && Number(nachCommitted.used) === Number(nachCommitted.origins),
    JSON.stringify(nachCommitted),
  )

  psqlSql(`
insert into cron.job (schedule, command, nodename, nodeport, database, username, active, jobname)
select '15 * * * *', 'select 1', 'localhost', coalesce(inet_server_port(), 5432), current_database(), current_user, true, 'jetnity-other-local-fixture'
where not exists (select 1 from cron.job where jobname = 'jetnity-other-local-fixture');
insert into cron.job_run_details (jobid, database, username, command, status, return_message, start_time, end_time)
select j.jobid, current_database(), current_user, j.command, 'succeeded', 'own-old',
       clock_timestamp() - interval '9 days', clock_timestamp() - interval '8 days'
  from cron.job j where j.jobname = 'jetnity-security-events-dev-cleanup-v1';
insert into cron.job_run_details (jobid, database, username, command, status, return_message, start_time, end_time)
select j.jobid, current_database(), current_user, j.command, 'failed', 'own-old-failed',
       clock_timestamp() - interval '9 days', clock_timestamp() - interval '8 days'
  from cron.job j where j.jobname = 'jetnity-security-events-dev-cleanup-v1';
insert into cron.job_run_details (jobid, database, username, command, status, return_message, start_time, end_time)
select j.jobid, current_database(), current_user, j.command, 'running', 'own-running',
       clock_timestamp() - interval '9 days', null
  from cron.job j where j.jobname = 'jetnity-security-events-dev-cleanup-v1';
insert into cron.job_run_details (jobid, database, username, command, status, return_message, start_time, end_time)
select j.jobid, current_database(), current_user, j.command, 'succeeded', 'own-recent',
       clock_timestamp() - interval '1 day', clock_timestamp() - interval '1 day'
  from cron.job j where j.jobname = 'jetnity-security-events-dev-cleanup-v1';
insert into cron.job_run_details (jobid, database, username, command, status, return_message, start_time, end_time)
select j.jobid, current_database(), current_user, j.command, 'succeeded', 'other-old',
       clock_timestamp() - interval '9 days', clock_timestamp() - interval '8 days'
  from cron.job j where j.jobname = 'jetnity-other-local-fixture';
`)
  psqlSql(`select jetnity_internal.security_event_dev_cleanup('manual');`)
  const historie = jsonZeile(psqlFile(`
select jsonb_build_object(
  'own_old', (select count(*) from cron.job_run_details d join cron.job j on j.jobid = d.jobid
               where j.jobname = 'jetnity-security-events-dev-cleanup-v1' and d.return_message in ('own-old', 'own-old-failed')),
  'own_running', (select count(*) from cron.job_run_details d join cron.job j on j.jobid = d.jobid
                   where j.jobname = 'jetnity-security-events-dev-cleanup-v1' and d.return_message = 'own-running'),
  'own_recent', (select count(*) from cron.job_run_details d join cron.job j on j.jobid = d.jobid
                  where j.jobname = 'jetnity-security-events-dev-cleanup-v1' and d.return_message = 'own-recent'),
  'other_old', (select count(*) from cron.job_run_details d join cron.job j on j.jobid = d.jobid
                 where j.jobname = 'jetnity-other-local-fixture' and d.return_message = 'other-old')
);
`))
  bewerte(
    'history cleanup deletes only this job terminal rows older than 7 days',
    gruppe,
    Number(historie.own_old) === 0 &&
      Number(historie.own_running) === 1 &&
      Number(historie.own_recent) === 1 &&
      Number(historie.other_old) === 1,
    JSON.stringify(historie),
  )
}

function pruefeGesundheitUndRollback() {
  const gruppe = 'health'
  psqlSql(`
update jetnity_internal.security_event_dev_control
   set last_success_at = pg_catalog.clock_timestamp() - interval '3 hours',
       last_success_kind = 'scheduled'
 where id = 'dev_v1';
`)
  const stale = festgeschrieben({
    rolle: 'authenticated',
    uid: OTHER,
    aal: 'aal2',
    sql: `insert into public.blocked_ips (ip, reason) values ('192.0.2.80', 'stale')`,
  })
  bewerte('stale cleanup health fails closed for a new audited write', gruppe, stale.arbeit?.ok === false && /stale/i.test(stale.arbeit?.message ?? ''), stale.arbeit?.message)
  const repairCleanup = psqlCapture(readFileSync(join(DIR, '60-cleanup-manual.sql'), 'utf8'))
  const nachRepair = festgeschrieben({
    rolle: 'authenticated',
    uid: OTHER,
    aal: 'aal2',
    sql: `insert into public.blocked_ips (ip, reason) values ('192.0.2.80', 'recovered')`,
  })
  bewerte(
    'manual cleanup restores writes without being native evidence',
    gruppe,
    repairCleanup.code === 0 && nachRepair.arbeit?.ok === true && stand().kind === 'manual',
    stand().kind,
  )

  psqlSql(`
insert into cron.job_run_details (jobid, database, username, command, status, return_message, start_time, end_time)
select j.jobid, current_database(), current_user, j.command, 'failed', 'fresh-failure',
       clock_timestamp(), clock_timestamp()
  from cron.job j where j.jobname = 'jetnity-security-events-dev-cleanup-v1';
`)
  const failing = festgeschrieben({
    rolle: 'authenticated',
    uid: OTHER,
    aal: 'aal2',
    sql: `insert into public.blocked_ips (ip, reason) values ('192.0.2.81', 'failing')`,
  })
  bewerte('a newer failed cron row fails closed', gruppe, failing.arbeit?.ok === false && /failing/i.test(failing.arbeit?.message ?? ''), failing.arbeit?.message)
  psqlSql(`delete from cron.job_run_details where return_message = 'fresh-failure';`)

  const usedVorher = Number(stand().used)
  psqlSql(`update jetnity_internal.security_event_producer_quota set used = used + 4 where id = 'tracked_producer';`)
  const drift = festgeschrieben({
    rolle: 'authenticated',
    uid: OTHER,
    aal: 'aal2',
    sql: `insert into public.blocked_ips (ip, reason) values ('192.0.2.82', 'drift')`,
  })
  const lookalikeVorRepair = Number(stand().lookalike)
  const repair = psqlCapture(readFileSync(join(DIR, '50-repair-quota.sql'), 'utf8'))
  const nachRepairQuota = stand()
  bewerte(
    'quota drift fails writes and owner repair restores used without deleting the look-alike',
    gruppe,
    drift.arbeit?.ok === false &&
      /drift/i.test(drift.arbeit?.message ?? '') &&
      repair.code === 0 &&
      Number(nachRepairQuota.used) === Number(nachRepairQuota.origins) &&
      Number(nachRepairQuota.lookalike) === lookalikeVorRepair &&
      Number(nachRepairQuota.used) === usedVorher,
    JSON.stringify({ drift: drift.arbeit, nachRepairQuota }),
  )

  psqlSql(`update cron.job set active = false where jobname = 'jetnity-security-events-dev-cleanup-v1';`)
  const jobDrift = festgeschrieben({
    rolle: 'authenticated',
    uid: OTHER,
    aal: 'aal2',
    sql: `insert into public.blocked_ips (ip, reason) values ('192.0.2.83', 'job-drift')`,
  })
  psqlSql(`update cron.job set active = true where jobname = 'jetnity-security-events-dev-cleanup-v1';`)
  bewerte('disabling the cleanup job fails closed', gruppe, jobDrift.arbeit?.ok === false && /scheduler/i.test(jobDrift.arbeit?.message ?? ''), jobDrift.arbeit?.message)

  const tz = festgeschrieben({
    rolle: 'authenticated',
    uid: OTHER,
    aal: 'aal2',
    sql: `do $do$ begin
      perform set_config('TimeZone', 'Europe/Berlin', true);
      insert into public.blocked_ips (ip, reason) values ('192.0.2.84', 'tz');
    end $do$`,
  })
  bewerte('non-UTC session offset fails closed', gruppe, tz.arbeit?.ok === false && /timezone/i.test(tz.arbeit?.message ?? ''), tz.arbeit?.message)

  const voll = seedCap(CAP)
  const erasureBeiCap = festgeschrieben({
    rolle: 'service_role',
    sql: `delete from public.security_events where user_id = '${OPERATOR}'`,
  })
  const nachCap = stand()
  bewerte(
    'account-style deletion still runs when the retained cap is full',
    gruppe,
    Number(voll.used) === CAP && erasureBeiCap.arbeit?.ok === true && Number(nachCap.used) === 0,
    JSON.stringify({ erasure: erasureBeiCap.arbeit, used: nachCap.used }),
  )

  const andereJob = psqlAt(`select count(*) from cron.job where jobname = 'jetnity-other-local-fixture'`)
  const legacyVorher = psqlAt(`select count(*) from public.security_events where type = 'login_failed'`)
  const rollback = psqlCapture(readFileSync(join(DIR, '40-rollback.sql'), 'utf8'))
  const nachRollback = jsonZeile(psqlFile(`
select jsonb_build_object(
  'schema', exists(select 1 from pg_namespace where nspname = 'jetnity_internal'),
  'triggers', (select count(*) from pg_trigger where not tgisinternal and tgname like 'security_event_dev_v1_%'),
  'own_job', (select count(*) from cron.job where jobname = 'jetnity-security-events-dev-cleanup-v1'),
  'other_job', (select count(*) from cron.job where jobname = 'jetnity-other-local-fixture'),
  'legacy', (select count(*) from public.security_events where type = 'login_failed'),
  'lookalike', (select count(*) from public.security_events where type = 'admin_blocklist_add' and user_id is null),
  'blocked', (select count(*) from public.blocked_ips)
);
`))
  const wieder = festgeschrieben({
    rolle: 'authenticated',
    uid: OTHER,
    aal: 'aal2',
    sql: `insert into public.blocked_ips (ip, reason) values ('192.0.2.90', 'baseline')`,
    inspektion: `select count(*) as events from public.security_events where user_id = '${OTHER}'`,
  })
  bewerte(
    'scoped rollback restores unaudited blocklist writes and keeps legacy rows and the other job',
    gruppe,
    rollback.code === 0 &&
      nachRollback.schema === false &&
      Number(nachRollback.triggers) === 0 &&
      Number(nachRollback.own_job) === 0 &&
      Number(nachRollback.other_job) === Number(andereJob) &&
      Number(nachRollback.legacy) === Number(legacyVorher) &&
      Number(nachRollback.lookalike) === 1 &&
      wieder.arbeit?.ok === true &&
      Number(wieder.inspektion?.events) === 0,
    JSON.stringify({ rollback: rollback.stderr.slice(0, 400), nachRollback, wieder: wieder.inspektion }),
  )
}

function pruefeKatalog() {
  const gruppe = 'catalog'
  const acl = jsonZeile(psqlFile(`
select jsonb_build_object(
  'auth_event_insert', has_table_privilege('authenticated', 'public.security_events', 'INSERT'),
  'service_event_insert', has_table_privilege('service_role', 'public.security_events', 'INSERT'),
  'service_origin', has_table_privilege('service_role', 'jetnity_internal.security_event_producer_origin', 'INSERT'),
  'auth_cleanup', has_function_privilege('authenticated', 'jetnity_internal.security_event_dev_cleanup(text)', 'EXECUTE'),
  'public_cleanup', has_function_privilege('public', 'jetnity_internal.security_event_dev_cleanup(text)', 'EXECUTE'),
  'retention', jetnity_internal.security_event_dev_retention()::text,
  'cap', jetnity_internal.security_event_dev_cap(),
  'schedule', jetnity_internal.security_event_dev_job_schedule(),
  'timeouts', (
    select jsonb_object_agg(p.proname, p.proconfig)
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'jetnity_internal'
       and p.proname in (
         'security_event_dev_on_blocked_ips',
         'security_event_dev_cleanup',
         'security_event_dev_event_delete_account'
       )
  )
);
`))
  bewerte(
    'fixed limits and ACLs match the approved Development contract',
    gruppe,
    acl.auth_event_insert === false &&
      acl.service_event_insert === true &&
      acl.service_origin === false &&
      acl.auth_cleanup === false &&
      acl.public_cleanup === false &&
      acl.retention === '7 days' &&
      Number(acl.cap) === 1000 &&
      acl.schedule === '0 * * * *' &&
      JSON.stringify(acl.timeouts).includes('lock_timeout=4s'),
    JSON.stringify(acl),
  )
}

async function main() {
  sichereUmgebung()
  starteCluster()
  legeDatenbankAn()
  try {
    pruefeAbwesenheit()
    pruefeKollision()
    installiere()
    pruefeDormantUndAktivierung()
    pruefeKatalog()
    pruefeAutorisierung()
    pruefeProducer()
    pruefeAtomaritaet()
    pruefeCapUndParallel()
    await pruefeConcurrentAdmission()
    await pruefeLockTimeoutUndReihenfolge()
    await pruefeErasureUndCleanup()
    pruefeGesundheitUndRollback()
  } finally {
    try {
      if (psqlAt(`select 1 from pg_database where datname = '${DB}'`, 'postgres') === '1') {
        psqlAt(`drop database ${DB} with (force)`, 'postgres')
      }
    } catch {
      // The disposable database is local. Leave the error to the summary if the drop fails.
    }
  }

  const fehler = ergebnisse.filter((eintrag) => !eintrag.ok)
  const bericht = {
    classification: 'LOCAL_SYNTHETIC_EXECUTION',
    hosted_development: 'NOT_RUN',
    native_scheduled: 'NOT_RUN',
    production: 'NOT_RUN',
    database: DB,
    passed: ergebnisse.length - fehler.length,
    failed: fehler.length,
    results: ergebnisse,
  }
  mkdirSync(join(ROOT, 'docs/evidence/dev-security-event-logging-retention-1'), { recursive: true })
  writeFileSync(EVIDENCE, `${JSON.stringify(bericht, null, 2)}\n`)
  console.log(`\n${bericht.passed}/${ergebnisse.length} local proofs passed.`)
  console.log('Hosted Development, native scheduled run, and Production were not executed.')
  if (fehler.length) {
    process.exit(1)
  }
}

main().catch((fehler) => {
  console.error(fehler)
    if (eigeneDatenbank) {
      try {
        if (psqlAt(`select 1 from pg_database where datname = '${DB}'`, 'postgres') === '1') {
          psqlAt(`drop database ${DB} with (force)`, 'postgres')
        }
      } catch {
        // Best-effort drop only.
      }
    }
  process.exit(1)
})
