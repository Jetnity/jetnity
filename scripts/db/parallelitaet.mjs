#!/usr/bin/env node
// Nachweis, dass die Erzeugungsschranke von `public.trips` auch unter echter
// Parallelität hält.
//
// Warum ein eigenes Skript und nicht ein weiterer Fall in `db:sicherheit`:
// Jener Nachweis läuft vollständig in EINER Transaktion, die am Ende zurückrollt.
// Das ist genau richtig, um Policies und Bedingungen zu prüfen, und vollständig
// blind für Wettläufe – zwei Anweisungen derselben Transaktion sehen einander
// immer, zwei gleichzeitige Transaktionen nicht.
//
// Die Schranke aus ADR-0045 ist ein Lesen mit anschliessendem Schreiben:
// `count(*)` gefolgt von der Einfügung. Ohne Serialisierung je Konto sehen zwei
// gleichzeitige Sitzungen bei 59 vorhandenen Reisen beide den Stand 59 und legen
// beide an. Über parallele PostgREST-Requests wäre die Schranke damit weiter
// überschreitbar (ADR-0049).
//
// Aufbau eines Falls:
//   1. Aufräumen, dann Saat: ein Testkonto mit N Reisen der letzten Stunde.
//      Die Saat wird festgeschrieben – gleichzeitige Sitzungen müssen sie sehen.
//   2. Ein Treffpunkt auf der Uhr des Servers. Ohne ihn entscheidet die Laufzeit
//      der HTTP-Anfragen, ob sich die Sitzungen überhaupt begegnen.
//   3. Mehrere gleichzeitige Sitzungen. Jede wartet bis zum Treffpunkt, schreibt
//      und hält ihre Transaktion danach offen. Das Offenhalten ist kein Kunstgriff:
//      `reise_anlegen()` schreibt nach der Reise bis zu 1416 weitere Zeilen, das
//      Fenster zwischen Zählung und Festschreibung ist also real.
//   4. Bestand nachzählen und mit der Erwartung vergleichen.
//   5. Aufräumen. Das Löschen des Kontos nimmt über `on delete cascade` alles mit.
//
// Das Skript schreibt echte Zeilen und rollt sie nicht zurück. Es läuft deshalb
// nur gegen den Development-Branch, auf den `SUPABASE_PROJECT_REF` zeigt – wie
// jedes Skript in diesem Verzeichnis.
//
// Aufruf:
//   node scripts/db/parallelitaet.mjs

import { runSql } from './sql.mjs'

// Ein eigenes Konto, das keiner der anderen Nachweise benutzt. Die Kennung ist
// fest, damit ein abgebrochener Lauf beim nächsten Mal aufgeräumt wird.
const KONTO = 'ffffffff-0000-4000-8000-00000000f001'
const INSTANCE = '00000000-0000-0000-0000-000000000000'

const SITZUNGEN = 6
// Vorlauf bis zum Treffpunkt. Die Anfragen starten laut Messung innerhalb von
// etwa einer halben Sekunde; 2,5 Sekunden lassen jeder Sitzung Zeit, ihre
// Verbindung aufzubauen und am Treffpunkt zu warten.
const VORLAUF_MS = 2500
// Wie lange eine Sitzung ihre Transaktion nach dem Schreiben offen hält. Deckt
// den Startversatz der Anfragen ab: Auch eine spät eintreffende Sitzung trifft
// die anderen noch im Fenster an.
//
// Die Zahl ist ein Kompromiss. Grösser macht den Wettlauf sicherer sichtbar,
// verlängert aber die Fälle, in denen alle Sitzungen durchkommen: Sie halten die
// Sperre der Reihe nach, die Laufzeit ist `SITZUNGEN × HALTEN_S`. Dass der Wert
// gross genug ist, ist nachgewiesen – mit der Fassung ohne Serialisierung
// scheitert das Skript (ADR-0049).
const HALTEN_S = 0.8

const claims = `select set_config('role', 'authenticated', true);
select set_config('request.jwt.claims', '{"sub":"${KONTO}","role":"authenticated"}', true);`

/** Der Treffpunkt kommt von der Uhr des Servers, nicht von der des Clients. */
async function treffpunkt() {
  const rows = await runSql(
    `select (clock_timestamp() + interval '${VORLAUF_MS} milliseconds')::text as ziel`,
  )
  return rows[0].ziel
}

const warten = (ziel) =>
  `select pg_sleep(greatest(0, extract(epoch from ('${ziel}'::timestamptz - clock_timestamp()))));`

async function aufraeumen() {
  await runSql(`delete from auth.users where id = '${KONTO}';`)
}

/**
 * Ein Konto mit `anzahl` Reisen der letzten Stunde. Die Kennungen sind
 * `bestand-1` … `bestand-<anzahl>`; ein Fall, der einen Retry prüft, greift auf
 * `bestand-1` zurück.
 */
async function saat(anzahl) {
  await aufraeumen()
  await runSql(`
insert into auth.users
  (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
  values ('${KONTO}', '${INSTANCE}', 'authenticated', 'authenticated',
          'parallelitaet@example.invalid', 'x', now(), now(), now());
insert into public.profiles (user_id, display_name, role, status)
  values ('${KONTO}', 'parallelitaet', 'user', 'active');
insert into public.trips (user_id, client_ref, title)
  select '${KONTO}', 'bestand-' || g, 'Bestand ' || g from generate_series(1, ${anzahl}) as g;`)
}

async function bestand() {
  const rows = await runSql(
    `select count(*) as anzahl from public.trips where user_id = '${KONTO}'`,
  )
  return Number(rows[0].anzahl)
}

/** Aus dem Fehlertext der Management-API den SQLSTATE herausziehen. */
function sqlstate(fehler) {
  const treffer = /ERROR:\s+([0-9A-Z]{5}):/.exec(fehler.message)
  return treffer ? treffer[1] : 'unbekannt'
}

/**
 * `SITZUNGEN` gleichzeitige Sitzungen desselben Falls. Jede wartet bis zum
 * Treffpunkt, schreibt, hält ihre Transaktion offen und liest zum Schluss die
 * Reise ihrer Kennung – so lässt sich prüfen, ob alle dieselbe bekommen haben.
 *
 * Scheitert eine Sitzung, bricht ihre Transaktion ab; die Management-API meldet
 * das als HTTP 400 mit dem SQLSTATE im Text.
 */
async function gleichzeitig(ziel, fall) {
  const eine = async (nr) => {
    try {
      const rows = await runSql(`
begin;
${claims}
${warten(ziel)}
${fall.sql(nr)}
select pg_sleep(${HALTEN_S});
select coalesce((select id::text from public.trips
                 where user_id = '${KONTO}' and client_ref = '${fall.kennung(nr)}'), 'keine') as id;
commit;`)
      return { ok: true, id: rows[0]?.id ?? null }
    } catch (fehler) {
      return { ok: false, code: sqlstate(fehler) }
    }
  }
  return Promise.all(Array.from({ length: SITZUNGEN }, (_, i) => eine(i + 1)))
}

const FAELLE = [
  {
    name: 'parallele neue Kennungen bei 59 – direkter INSERT',
    bestandVorher: 59,
    kennung: (nr) => `parallel-${nr}`,
    sql: (nr) =>
      `insert into public.trips (user_id, client_ref, title)
       values ('${KONTO}', 'parallel-${nr}', 'Parallel ${nr}');`,
    erwartung: {
      bestandNachher: 60,
      erfolge: 1,
      code: '53400',
      grund:
        'Der Kern des Befunds: Ohne Serialisierung je Konto sehen alle acht Sitzungen den ' +
        'Stand 59 und legen alle an. Höchstens eine darf durchkommen, der Rest mit 53400.',
    },
  },
  {
    name: 'parallele neue Kennungen bei 59 – reise_anlegen()',
    bestandVorher: 59,
    kennung: (nr) => `funktion-${nr}`,
    sql: (nr) =>
      `select public.reise_anlegen('{"client_ref":"funktion-${nr}","title":"Parallel","stages":[{"position":1,"name":"Testziel"}]}'::jsonb);`,
    erwartung: {
      bestandNachher: 60,
      erfolge: 1,
      code: '53400',
      grund: 'Dasselbe auf dem Weg, den die Anwendung nimmt.',
    },
  },
  {
    name: 'parallele Retries einer bestehenden Kennung bei 59',
    bestandVorher: 59,
    kennung: () => `bestand-1`,
    sql: () =>
      `select public.reise_anlegen('{"client_ref":"bestand-1","title":"Parallel","stages":[{"position":1,"name":"Testziel"}]}'::jsonb);`,
    erwartung: {
      bestandNachher: 59,
      erfolge: SITZUNGEN,
      eineKennung: true,
      grund:
        'Die Idempotenz aus ADR-0048 muss auch gleichzeitig gelten: Acht Retries derselben ' +
        'Kennung sind acht Mal dieselbe Reise und keine neue Zeile.',
    },
  },
  {
    name: 'paralleles Doppelabsenden derselben neuen Kennung bei 59',
    bestandVorher: 59,
    kennung: () => `doppelt`,
    sql: () =>
      `select public.reise_anlegen('{"client_ref":"doppelt","title":"Parallel","stages":[{"position":1,"name":"Testziel"}]}'::jsonb);`,
    erwartung: {
      bestandNachher: 60,
      erfolge: SITZUNGEN,
      eineKennung: true,
      grund:
        'Zwei Tabs, ein Klick: Alle acht Sitzungen legen dieselbe Kennung an. Genau eine ' +
        'Zeile entsteht, und jede Sitzung bekommt deren Kennung – nicht sieben Fehler.',
    },
  },
  {
    name: 'parallele neue Kennungen bei erreichtem Limit',
    bestandVorher: 60,
    kennung: (nr) => `voll-${nr}`,
    sql: (nr) =>
      `select public.reise_anlegen('{"client_ref":"voll-${nr}","title":"Parallel","stages":[{"position":1,"name":"Testziel"}]}'::jsonb);`,
    erwartung: {
      bestandNachher: 60,
      erfolge: 0,
      code: '53400',
      grund: 'Die Schranke bleibt eine Schranke: Bei 60 kommt keine weitere Reise hinzu.',
    },
  },
]

function bewerte(fall, ergebnisse, nachher) {
  const erfolge = ergebnisse.filter((e) => e.ok)
  const fehler = ergebnisse.filter((e) => !e.ok)
  const codes = [...new Set(fehler.map((e) => e.code))]
  const ids = [...new Set(erfolge.map((e) => e.id))]
  const e = fall.erwartung
  const maengel = []

  if (nachher !== e.bestandNachher) {
    maengel.push(`Bestand ${nachher}, erwartet ${e.bestandNachher}`)
  }
  if (erfolge.length !== e.erfolge) {
    maengel.push(`${erfolge.length} Sitzungen erfolgreich, erwartet ${e.erfolge}`)
  }
  if (e.code && codes.some((c) => c !== e.code)) {
    maengel.push(`Fehlercodes ${codes.join(', ')}, erwartet nur ${e.code}`)
  }
  if (e.eineKennung && ids.length !== 1) {
    maengel.push(`${ids.length} verschiedene Reisen geliefert, erwartet 1`)
  }
  if (e.eineKennung && ids[0] === 'keine') {
    maengel.push('keine Reise geliefert')
  }

  const teile = [`Bestand ${fall.bestandVorher} → ${nachher}`, `${erfolge.length}× erfolgreich`]
  if (fehler.length) teile.push(`${fehler.length}× ${codes.join('/')}`)
  if (e.eineKennung) teile.push(`${ids.length} Reise(n) geliefert`)

  return { ok: maengel.length === 0, detail: teile.join(', '), maengel }
}

async function pruefe() {
  const ergebnisse = []
  try {
    for (const fall of FAELLE) {
      await saat(fall.bestandVorher)
      const laeufe = await gleichzeitig(await treffpunkt(), fall)
      ergebnisse.push({ fall, ...bewerte(fall, laeufe, await bestand()) })
    }
  } finally {
    await aufraeumen()
  }
  return ergebnisse
}

const TRAVELLER_REISE = 'ffffffff-0000-4000-8000-00000000f011'
const TRAVELLER = 'ffffffff-0000-4000-8000-00000000f012'
const KINDER_SITZUNGEN = 4

async function saatTraveller(citizenshipsVorher) {
  await aufraeumen()
  await runSql(`
insert into auth.users
  (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
  values ('${KONTO}', '${INSTANCE}', 'authenticated', 'authenticated',
          'parallelitaet@example.invalid', 'x', now(), now(), now());
insert into public.profiles (user_id, display_name, role, status)
  values ('${KONTO}', 'parallelitaet', 'user', 'active');
insert into public.trips (id, user_id, client_ref, title)
  values ('${TRAVELLER_REISE}', '${KONTO}', 'parallel-traveller', 'Parallel Traveller');
insert into public.trip_travellers (id, trip_id, user_id, client_ref)
  values ('${TRAVELLER}', '${TRAVELLER_REISE}', '${KONTO}', 'traveller:1');
insert into public.trip_traveller_citizenships
  (traveller_id, trip_id, user_id, client_ref, country_code)
select '${TRAVELLER}', '${TRAVELLER_REISE}', '${KONTO}',
       'citizenship:X' || chr(65 + g),
       'X' || chr(65 + g)
  from generate_series(0, ${citizenshipsVorher} - 1) as g;
`)
}

async function citizenshipBestand() {
  const rows = await runSql(
    `select count(*) as anzahl from public.trip_traveller_citizenships where traveller_id = '${TRAVELLER}'`,
  )
  return Number(rows[0].anzahl)
}

async function gleichzeitigKinder(ziel) {
  const eine = async (nr) => {
    const land = String.fromCharCode(81 + nr) + 'Z' // QZ, RZ, SZ, TZ
    try {
      await runSql(`
begin;
${claims}
${warten(ziel)}
insert into public.trip_traveller_citizenships
  (traveller_id, trip_id, user_id, client_ref, country_code)
values ('${TRAVELLER}', '${TRAVELLER_REISE}', '${KONTO}', 'citizenship:${land}', '${land}');
select pg_sleep(${HALTEN_S});
commit;`)
      return { ok: true, code: null }
    } catch (fehler) {
      return { ok: false, code: sqlstate(fehler) }
    }
  }
  return Promise.all(Array.from({ length: KINDER_SITZUNGEN }, (_, i) => eine(i)))
}

async function pruefeTravellerKinder() {
  const faelle = [
    {
      name: 'parallele Citizenship-Inserts bei 7 – Limit 8',
      bestandVorher: 7,
      bestandNachher: 8,
      erfolge: 1,
      code: '23514',
    },
    {
      name: 'parallele Citizenship-Inserts bei erreichtem Limit',
      bestandVorher: 8,
      bestandNachher: 8,
      erfolge: 0,
      code: '23514',
    },
  ]
  const ergebnisse = []
  try {
    for (const fall of faelle) {
      await saatTraveller(fall.bestandVorher)
      const laeufe = await gleichzeitigKinder(await treffpunkt())
      const nachher = await citizenshipBestand()
      const erfolge = laeufe.filter((e) => e.ok)
      const fehler = laeufe.filter((e) => !e.ok)
      const codes = [...new Set(fehler.map((e) => e.code))]
      const maengel = []
      if (nachher !== fall.bestandNachher) {
        maengel.push(`Bestand ${nachher}, erwartet ${fall.bestandNachher}`)
      }
      if (erfolge.length !== fall.erfolge) {
        maengel.push(`${erfolge.length} Sitzungen erfolgreich, erwartet ${fall.erfolge}`)
      }
      if (codes.includes('40P01')) {
        maengel.push('Deadlock 40P01 – Parent-Lock kollidiert mit FK KEY SHARE')
      }
      if (fall.code && codes.some((c) => c !== fall.code)) {
        maengel.push(`Fehlercodes ${codes.join(', ')}, erwartet nur ${fall.code}`)
      }
      if (nachher > 8) {
        maengel.push(`Limit überschritten: ${nachher}`)
      }
      const teile = [`Bestand ${fall.bestandVorher} → ${nachher}`, `${erfolge.length}× erfolgreich`]
      if (fehler.length) teile.push(`${fehler.length}× ${codes.join('/')}`)
      ergebnisse.push({
        fall,
        ok: maengel.length === 0,
        detail: teile.join(', '),
        maengel,
      })
    }
  } finally {
    await aufraeumen()
  }
  return ergebnisse
}

const PARTY_QUELLE = 'ffffffff-0000-4000-8000-00000000f021'
const PARTY_ZIEL = 'ffffffff-0000-4000-8000-00000000f022'
const PARTY_SITZUNGEN = 4

async function saatParty(zielBestand, extraQuelle = 0) {
  await aufraeumen()
  await runSql(`
insert into auth.users
  (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
  values ('${KONTO}', '${INSTANCE}', 'authenticated', 'authenticated',
          'parallelitaet@example.invalid', 'x', now(), now(), now());
insert into public.profiles (user_id, display_name, role, status)
  values ('${KONTO}', 'parallelitaet', 'user', 'active');
insert into public.trips (id, user_id, client_ref, title)
  values
    ('${PARTY_ZIEL}', '${KONTO}', 'parallel-party-ziel', 'Parallel Party Ziel'),
    ('${PARTY_QUELLE}', '${KONTO}', 'parallel-party-quelle', 'Parallel Party Quelle');
insert into public.trip_travellers (trip_id, user_id, client_ref)
select '${PARTY_ZIEL}', '${KONTO}', 'traveller:' || g
  from generate_series(1, ${zielBestand}) as g;
insert into public.trip_travellers (id, trip_id, user_id, client_ref)
select ('ffffffff-0000-4000-8000-00000000f03' || g)::uuid,
       '${PARTY_QUELLE}', '${KONTO}', 'traveller:move-' || g
  from generate_series(1, ${extraQuelle}) as g;
`)
}

async function partyBestand(reise) {
  const rows = await runSql(
    `select count(*) as anzahl from public.trip_travellers where trip_id = '${reise}'`,
  )
  return Number(rows[0].anzahl)
}

async function gleichzeitigPartyInsert(ziel, sql) {
  const eine = async (nr) => {
    try {
      await runSql(`
begin;
${claims}
${warten(ziel)}
${sql(nr)}
select pg_sleep(${HALTEN_S});
commit;`)
      return { ok: true, code: null }
    } catch (fehler) {
      return { ok: false, code: sqlstate(fehler) }
    }
  }
  return Promise.all(Array.from({ length: PARTY_SITZUNGEN }, (_, i) => eine(i + 1)))
}

async function pruefePartyLimit() {
  const faelle = [
    {
      name: 'parallele Traveller-Inserts bei 19 – Limit 20',
      zielBestand: 19,
      extraQuelle: 0,
      bestandNachher: 20,
      erfolge: 1,
      code: '23514',
      sql: (nr) =>
        `insert into public.trip_travellers (trip_id, user_id, client_ref)
         values ('${PARTY_ZIEL}', '${KONTO}', 'traveller:parallel-${nr}');`,
    },
    {
      name: 'parallele Traveller-Inserts bei erreichtem Limit',
      zielBestand: 20,
      extraQuelle: 0,
      bestandNachher: 20,
      erfolge: 0,
      code: '23514',
      sql: (nr) =>
        `insert into public.trip_travellers (trip_id, user_id, client_ref)
         values ('${PARTY_ZIEL}', '${KONTO}', 'traveller:voll-${nr}');`,
    },
    {
      name: 'paralleles inkrementelles party_schreiben bei 19 – Limit 20',
      zielBestand: 19,
      extraQuelle: 0,
      bestandNachher: 20,
      erfolge: 1,
      code: '23514',
      sql: (nr) =>
        `select public.party_schreiben(jsonb_build_object(
           'tripId', '${PARTY_ZIEL}',
           'party', jsonb_build_array(jsonb_build_object(
             'clientRef', 'traveller:rpc-${nr}',
             'citizenships', '[]'::jsonb,
             'documents', '[]'::jsonb
           ))
         ));`,
    },
    {
      name: 'paralleles Reparenting in eine Reise bei 19 – Limit 20',
      zielBestand: 19,
      extraQuelle: 4,
      bestandNachher: 20,
      erfolge: 1,
      code: '23514',
      sql: (nr) =>
        `update public.trip_travellers
            set trip_id = '${PARTY_ZIEL}'
          where id = ('ffffffff-0000-4000-8000-00000000f03' || ${nr})::uuid;`,
    },
  ]
  const ergebnisse = []
  try {
    for (const fall of faelle) {
      await saatParty(fall.zielBestand, fall.extraQuelle)
      const laeufe = await gleichzeitigPartyInsert(await treffpunkt(), fall.sql)
      const nachher = await partyBestand(PARTY_ZIEL)
      const erfolge = laeufe.filter((e) => e.ok)
      const fehler = laeufe.filter((e) => !e.ok)
      const codes = [...new Set(fehler.map((e) => e.code))]
      const maengel = []
      if (nachher !== fall.bestandNachher) {
        maengel.push(`Bestand ${nachher}, erwartet ${fall.bestandNachher}`)
      }
      if (erfolge.length !== fall.erfolge) {
        maengel.push(`${erfolge.length} Sitzungen erfolgreich, erwartet ${fall.erfolge}`)
      }
      if (codes.includes('40P01')) {
        maengel.push('Deadlock 40P01 – Trip-Lock kollidiert mit FK KEY SHARE')
      }
      if (fall.code && codes.some((c) => c !== fall.code)) {
        maengel.push(`Fehlercodes ${codes.join(', ')}, erwartet nur ${fall.code}`)
      }
      if (nachher > 20) {
        maengel.push(`Limit überschritten: ${nachher}`)
      }
      const teile = [`Bestand ${fall.zielBestand} → ${nachher}`, `${erfolge.length}× erfolgreich`]
      if (fehler.length) teile.push(`${fehler.length}× ${codes.join('/')}`)
      ergebnisse.push({
        fall,
        ok: maengel.length === 0,
        detail: teile.join(', '),
        maengel,
      })
    }
  } finally {
    await aufraeumen()
  }
  return ergebnisse
}

async function main() {
  console.log(
    `${SITZUNGEN} gleichzeitige Sitzungen je Fall, Treffpunkt auf der Uhr des Servers,\n` +
      `Transaktion nach dem Schreiben ${HALTEN_S} s offen gehalten.\n`,
  )

  const ergebnisse = [
    ...(await pruefe()),
    ...(await pruefeTravellerKinder()),
    ...(await pruefePartyLimit()),
  ]
  const fehler = ergebnisse.filter((e) => !e.ok)

  for (const e of ergebnisse) {
    console.log(`${e.ok ? '  ok  ' : ' FEHL '} ${e.fall.name.padEnd(52)} ${e.detail}`)
    for (const m of e.maengel) console.log(`       ${m}`)
  }

  console.log(`\n${ergebnisse.length - fehler.length}/${ergebnisse.length} Nachweise erfüllt.`)
  if (fehler.length) process.exit(1)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err.message)
    process.exit(1)
  })
}
