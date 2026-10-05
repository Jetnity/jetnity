#!/usr/bin/env node
// Isolierte S5-B Persistenz-Evidence gegen lokale PostgreSQL.
// Niemals Production. Kein Supabase-Management-API-Write.
//
//   npm run db:s5b-persistenz-lokal

import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const NUTZER = '11111111-1111-1111-1111-111111111111'
const ZWEITER = '22222222-2222-2222-2222-222222222222'
const REISE = 'aaaaaaaa-0000-4000-8000-000000000001'
const PUNKT = 'aaaaaaaa-0000-4000-8000-000000000004'
const PUNKT_NEU = 'aaaaaaaa-0000-4000-8000-000000000005'
const DB = 'jetnity_s5b_persistenz_lokal'
const ROOT = new URL('../..', import.meta.url).pathname
const BOOTSTRAP = join(ROOT, 'scripts/db/s5b-persistenz-lokal-bootstrap.sql')
const MIGRATION = join(ROOT, 'supabase/migrations/20260829140000_trip_item_commercial_provenance.sql')

function persistenz(teil = {}) {
  return {
    vertrag: 'jetnity.commercial_persistence.v1',
    mint: 's5a_validated_snapshot',
    trip_item_id: PUNKT,
    domain: 'activities',
    provider_id: 'gyg',
    source_kind: 'persisted_snapshot',
    persistenz: 'snapshot',
    external_ref: 'act-seed',
    retrieved_at: '2026-08-29T11:05:00Z',
    observed_at: '2026-08-29T11:05:00Z',
    quoted_currency: 'EUR',
    amount: 50,
    amount_status: 'quoted',
    ...teil,
  }
}

function sqlJson(wert) {
  return `'${JSON.stringify(wert).replaceAll("'", "''")}'::jsonb`
}

const FAELLE = [
  {
    name: 'anon liest Commercial Provenance nicht',
    rolle: 'anon',
    sql: `select * from public.trip_item_commercial_provenance`,
    erwartung: 'abgelehnt',
  },
  {
    name: 'Konto liest die eigene Commercial Provenance',
    rolle: 'authenticated',
    uid: NUTZER,
    sql: `select * from public.trip_item_commercial_provenance where trip_item_id = '${PUNKT}'`,
    erwartung: 'erlaubt',
  },
  {
    name: 'Konto liest fremde Commercial Provenance nicht',
    rolle: 'authenticated',
    uid: ZWEITER,
    sql: `select * from public.trip_item_commercial_provenance where trip_item_id = '${PUNKT}'`,
    erwartung: 'leer',
  },
  {
    name: 'authenticated Direct-INSERT auf Provenance wird abgelehnt',
    rolle: 'authenticated',
    uid: NUTZER,
    sql: `insert into public.trip_item_commercial_provenance (
            trip_item_id, trip_id, user_id, domain, provider_id,
            retrieved_at, observed_at
          ) values (
            '${PUNKT}', '${REISE}', '${NUTZER}', 'activities', 'evil',
            '2026-08-29T11:00:00Z', '2026-08-29T11:00:00Z'
          )`,
    erwartung: 'abgelehnt',
  },
  {
    name: 'authenticated Direct-UPDATE auf Provenance wird abgelehnt',
    rolle: 'authenticated',
    uid: NUTZER,
    sql: `update public.trip_item_commercial_provenance
             set provider_id = 'evil'
           where trip_item_id = '${PUNKT}'`,
    erwartung: 'abgelehnt',
  },
  {
    name: 'authenticated Direct-DELETE auf Provenance wird abgelehnt',
    rolle: 'authenticated',
    uid: NUTZER,
    sql: `delete from public.trip_item_commercial_provenance where trip_item_id = '${PUNKT}'`,
    erwartung: 'abgelehnt',
  },
  {
    name: 'authenticated darf den internen Provenance-Write nicht ausführen',
    rolle: 'authenticated',
    uid: NUTZER,
    sql: `select jetnity_internal.trip_item_commercial_provenance_schreiben(${sqlJson(persistenz())})`,
    erwartung: 'abgelehnt',
  },
  {
    name: 'service_role darf den internen Provenance-Write nicht ausführen',
    rolle: 'service_role',
    sql: `select jetnity_internal.trip_item_commercial_provenance_schreiben(${sqlJson(persistenz())})`,
    erwartung: 'abgelehnt',
  },
  {
    name: 'kontrollierter Write ohne auth.uid() ist fail-closed',
    rolle: 'jetnity_commercial_writer',
    sql: `select jetnity_internal.trip_item_commercial_provenance_schreiben(${sqlJson(persistenz())})`,
    erwartung: 'abgelehnt',
  },
  {
    name: 'kontrollierter Write lehnt fremdes auth.uid() ab',
    rolle: 'jetnity_commercial_writer',
    uid: ZWEITER,
    sql: `select jetnity_internal.trip_item_commercial_provenance_schreiben(${sqlJson(persistenz())})`,
    erwartung: 'abgelehnt',
  },
  {
    name: 'kontrollierter Write lehnt rohe Client-sourceKind-Nutzlast ab',
    rolle: 'jetnity_commercial_writer',
    uid: NUTZER,
    sql: `select jetnity_internal.trip_item_commercial_provenance_schreiben(
            jsonb_build_object(
              'trip_item_id', '${PUNKT}',
              'providerId', 'gyg',
              'sourceKind', 'live_api',
              'akteur', 'user'
            )
          )`,
    erwartung: 'abgelehnt',
  },
  {
    name: 'kontrollierter Write lehnt User-Intake als Source ab',
    rolle: 'jetnity_commercial_writer',
    uid: NUTZER,
    sql: `select jetnity_internal.trip_item_commercial_provenance_schreiben(${sqlJson(
      persistenz({ source_kind: 'user_intake' }),
    )})`,
    erwartung: 'abgelehnt',
  },
  {
    name: 'kontrollierter Write lehnt Domain/Kind-Widerspruch ab',
    rolle: 'jetnity_commercial_writer',
    uid: NUTZER,
    sql: `select jetnity_internal.trip_item_commercial_provenance_schreiben(${sqlJson(
      persistenz({ domain: 'flights' }),
    )})`,
    erwartung: 'abgelehnt',
  },
  {
    name: 'kontrollierter Write erzwingt Refresh-Identität',
    rolle: 'jetnity_commercial_writer',
    uid: NUTZER,
    sql: `select jetnity_internal.trip_item_commercial_provenance_schreiben(${sqlJson(
      persistenz({ external_ref: 'act-other' }),
    )})`,
    erwartung: 'abgelehnt',
  },
  {
    name: 'kontrollierter Write lehnt note-Items ab',
    rolle: 'jetnity_commercial_writer',
    uid: NUTZER,
    sql: `do $body$
begin
  reset role;
  insert into public.trip_items (id, trip_id, user_id, kind, title)
    values ('${PUNKT_NEU}', '${REISE}', '${NUTZER}', 'note', 'S5B Note');
  perform set_config('role', 'jetnity_commercial_writer', true);
  perform set_config('request.jwt.claims', json_build_object('sub', '${NUTZER}')::text, true);
  perform jetnity_internal.trip_item_commercial_provenance_schreiben(
    ${sqlJson(persistenz({ trip_item_id: PUNKT_NEU, domain: 'flights', provider_id: 'duffel', external_ref: 'note-x' }))}
  );
  raise exception 'note durfte keine Provenance erhalten';
end
$body$`,
    erwartung: 'abgelehnt',
  },
  {
    name: 'kontrollierter Provenance-Write akzeptiert nur validierte Persistenz-Nutzlast',
    rolle: 'jetnity_commercial_writer',
    uid: NUTZER,
    sql: `select 1
            from jetnity_internal.trip_item_commercial_provenance_schreiben(${sqlJson(persistenz())}) as r
           where (r ->> 'ok') = 'true'
             and (r ->> 'source_kind') = 'persisted_snapshot'`,
    erwartung: 'erlaubt',
  },
  {
    name: 'Stay-Direct-DML mintet keine Provider-Hard-Truth',
    rolle: 'authenticated',
    uid: NUTZER,
    sql: `insert into public.trip_items (
            trip_id, kind, title, price_amount, price_currency, provider,
            external_ref, booking_url
          ) values (
            '${REISE}', 'stay', 'S5B Stay', 180, 'CHF', 'booking',
            'htl-1', 'https://hotel.example/x'
          );
          select 1 from public.trip_items
            where trip_id = '${REISE}' and title = 'S5B Stay'
              and kind = 'stay'
              and price_amount is null
              and provider is null
              and external_ref is null
              and booking_url is null`,
    erwartung: 'erlaubt',
  },
  {
    name: 'Transfer-INSERT behält User-Intake-Preis und nullt Providerfelder',
    rolle: 'authenticated',
    uid: NUTZER,
    sql: `insert into public.trip_items (
            trip_id, kind, title, price_amount, price_currency, provider,
            external_ref, booking_url
          ) values (
            '${REISE}', 'transfer', 'S5B Transfer', 40, 'CHF', 'evil',
            'ref-x', 'https://evil.example'
          );
          select 1 from public.trip_items
            where trip_id = '${REISE}' and title = 'S5B Transfer'
              and price_amount = 40
              and provider is null
              and external_ref is null
              and booking_url is null`,
    erwartung: 'erlaubt',
  },
  {
    name: 'Production-Write-Pfad und PostgREST-Mitgliedschaft bleiben geschlossen',
    rolle: 'jetnity_commercial_writer',
    uid: NUTZER,
    sql: `do $body$
begin
  reset role;
  if not exists (
    select 1 from jetnity_internal.commercial_write_runtime_gate
     where singleton and production_write_path_allocated = false
  ) then
    raise exception 'Production-Write-Pfad darf nicht allokiert sein';
  end if;
  if has_function_privilege('anon', 'jetnity_internal.trip_item_commercial_provenance_schreiben(jsonb)', 'execute')
     or has_function_privilege('authenticated', 'jetnity_internal.trip_item_commercial_provenance_schreiben(jsonb)', 'execute')
     or has_function_privilege('service_role', 'jetnity_internal.trip_item_commercial_provenance_schreiben(jsonb)', 'execute')
  then
    raise exception 'PostgREST-Rollen haben EXECUTE';
  end if;
  if pg_has_role('anon', 'jetnity_commercial_writer', 'USAGE')
     or pg_has_role('authenticated', 'jetnity_commercial_writer', 'USAGE')
     or pg_has_role('service_role', 'jetnity_commercial_writer', 'USAGE')
  then
    raise exception 'PostgREST-Rollen erben Writer';
  end if;
  if not pg_has_role('jetnity_commercial_runtime', 'jetnity_commercial_writer', 'MEMBER') then
    raise exception 'Runtime muss Writer-Mitglied sein';
  end if;
  raise exception using errcode = 'ZZ000', message = 'treffer:1';
end
$body$`,
    erwartung: 'erlaubt',
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
  execFileSync('sudo', ['-u', 'postgres', 'psql', '-v', 'ON_ERROR_STOP=1', '-d', datenbank, '-f', '-'], {
    input: sql,
    stdio: ['pipe', 'pipe', 'pipe'],
  })
}

function psqlc(sql) {
  return execFileSync(
    'sudo',
    ['-u', 'postgres', 'psql', '-v', 'ON_ERROR_STOP=1', '-d', 'postgres', '-At', '-c', sql],
    { encoding: 'utf8' },
  ).trim()
}

function main() {
  if (process.env.S5B_ALLOW_REMOTE_DB === '1') {
    throw new Error('Dieser Lauf ist nur für isolierte lokale PostgreSQL. Remote-DB ist verboten.')
  }

  try {
    execFileSync('sudo', ['pg_ctlcluster', '16', 'main', 'start'], { stdio: 'pipe' })
  } catch (fehler) {
    const text = `${fehler.stdout || ''}${fehler.stderr || ''}${fehler.message || ''}`
    if (!/already running/i.test(text)) throw fehler
  }
  const existing = psqlc(`select 1 from pg_database where datname = '${DB}'`)
  if (existing === '1') {
    psqlc(`drop database ${DB} with (force)`)
  }
  psqlc(`create database ${DB}`)

  psqlSql(
    [
      readFileSync(BOOTSTRAP, 'utf8'),
      readFileSync(MIGRATION, 'utf8'),
      `
insert into public.trips (id, user_id) values ('${REISE}', '${NUTZER}');
insert into public.trips (id, user_id) values ('bbbbbbbb-0000-4000-8000-000000000001', '${ZWEITER}');
insert into public.trip_items (id, trip_id, user_id, kind, title)
  values ('${PUNKT}', '${REISE}', '${NUTZER}', 'activity', 'Fischmarkt');
insert into public.trip_item_commercial_provenance (
  trip_item_id, trip_id, user_id, domain, provider_id, external_ref,
  retrieved_at, observed_at, quoted_currency, amount, amount_status
) values (
  '${PUNKT}', '${REISE}', '${NUTZER}', 'activities', 'gyg', 'act-seed',
  '2026-08-29T11:00:00Z', '2026-08-29T11:00:00Z', 'EUR', 45, 'quoted'
);
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
    (f, i) =>
      `insert into pg_temp.ergebnis select ${i}, pg_temp.versuch($s$${f.sql}$s$, '${f.rolle}', ${
        f.uid ? `'${f.uid}'` : 'null'
      });`,
  ).join('\n')

  const raw = execFileSync(
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

  const jsonZeile = raw
    .split('\n')
    .map((z) => z.trim())
    .find((z) => z.startsWith('['))
  if (!jsonZeile) {
    throw new Error(`Keine isolierten S5-B-Ergebnisse gelesen. Ausgabe:\n${raw}`)
  }
  const zeilen = JSON.parse(jsonZeile)
  const ergebnisse = zeilen.map((zeile) => {
    const fall = FAELLE[zeile.i]
    return { fall, ...bewerte(fall, zeile.wert) }
  })

  if (ergebnisse.length !== FAELLE.length) {
    throw new Error(`Erwartet ${FAELLE.length} Nachweise, gelesen ${ergebnisse.length}.`)
  }

  let fehler = 0
  for (const e of ergebnisse) {
    const zeichen = e.ok ? '  ok  ' : ' FEHL '
    if (!e.ok) fehler += 1
    console.log(`${zeichen} ${e.fall.name.padEnd(72)} ${String(e.fall.erwartung).padEnd(10)} ${e.detail}`)
    if (!e.ok) console.log(`       erwartet ${e.fall.erwartung}, gemessen ${e.tatsaechlich}`)
  }

  console.log(`\n${ergebnisse.length - fehler}/${ergebnisse.length} isolierte S5-B-Nachweise erfüllt.`)
  console.log('Ziel: lokale PostgreSQL. Production nicht berührt.')
  if (fehler) process.exit(1)
}

main()
