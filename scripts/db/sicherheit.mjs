#!/usr/bin/env node
// Zugriffsnachweise gegen den Supabase-Development-Branch.
//
// Eine Policy zu lesen sagt nicht, was sie bewirkt. Über den Zugriff
// entscheiden vier Dinge gemeinsam: das Tabellenrecht, der RLS-Schalter, die
// Policies und ihre Rollenbindung – dazu Auslöser und Funktionsrechte. Diese
// Datei prüft deshalb nicht die Regeln, sondern das Ergebnis.
//
// Zu jedem Fall gehört ein positiver und ein negativer Nachweis: Was erlaubt
// sein soll, muss gelingen; was verboten sein soll, muss scheitern. Ein Test,
// der nur Verbote prüft, wäre auch dann grün, wenn gar nichts mehr ginge.
//
// Alles läuft in einer Transaktion, die am Ende zurückgerollt wird. Die
// Datenbank bleibt unverändert.
//
// Aufruf:
//   npm run db:sicherheit

import { runSql } from './sql.mjs'

const NUTZER = '11111111-1111-1111-1111-111111111111'
const ZWEITER = '22222222-2222-2222-2222-222222222222'
const ADMIN = '33333333-3333-3333-3333-333333333333'
const INHABER = '44444444-4444-4444-4444-444444444444'
const GESPERRT = '55555555-5555-5555-5555-555555555555'
const OHNE_PROFIL = '66666666-6666-6666-6666-666666666666'

/**
 * Erwartungen.
 *
 * `erwartung` ist entweder
 *   'erlaubt'    – die Anweisung läuft durch und trifft mindestens eine Zeile,
 *   'leer'       – sie läuft durch, trifft aber keine Zeile (RLS filtert),
 *   'abgelehnt'  – sie scheitert (fehlendes Recht, Policy oder Auslöser).
 */
const FAELLE = [
  // --- Öffentlicher Lesezugriff -------------------------------------------
  {
    name: 'anon liest Flughäfen',
    rolle: 'anon',
    sql: `select * from public.airports`,
    erwartung: 'erlaubt',
    grund: 'Die öffentliche Flughafensuche unter /api/search/airports braucht diesen Zugriff.',
  },
  {
    name: 'anon liest sichtbare Blogkommentare',
    rolle: 'anon',
    sql: `select * from public.blog_comments where status = 'visible'`,
    erwartung: 'erlaubt',
  },

  // --- Kein Zugriff ohne Anmeldung ----------------------------------------
  {
    name: 'anon liest Profile',
    rolle: 'anon',
    sql: `select * from public.creator_profiles`,
    erwartung: 'abgelehnt',
  },
  {
    name: 'anon liest Zahlungen',
    rolle: 'anon',
    sql: `select * from public.payments`,
    erwartung: 'abgelehnt',
  },
  {
    name: 'anon liest Sicherheitsereignisse',
    rolle: 'anon',
    sql: `select * from public.security_events`,
    erwartung: 'abgelehnt',
  },
  {
    name: 'anon liest Creator-Uploads',
    rolle: 'anon',
    sql: `select * from public.creator_uploads`,
    erwartung: 'abgelehnt',
    grund: 'Bis Phase 1.4 galt hier USING true – jede Zeile war ohne Anmeldung lesbar.',
  },
  {
    name: 'anon liest Sitzungskommentare',
    rolle: 'anon',
    sql: `select * from public.session_comments`,
    erwartung: 'abgelehnt',
    grund: 'Bis Phase 1.4 galt hier USING true.',
  },
  {
    name: 'anon legt einen Creator-Upload an',
    rolle: 'anon',
    sql: `insert into public.creator_uploads (title, description, file_url, region, tags, language, created_at, is_virtual)
          values ('x','x','x','x','{}','de', now(), true)`,
    erwartung: 'abgelehnt',
    grund: 'Die Policy „Allow insert for virtual uploads" erlaubte das jedem Besucher.',
  },
  {
    name: 'anon leert eine Tabelle mit TRUNCATE',
    rolle: 'anon',
    sql: `truncate table public.airports`,
    erwartung: 'abgelehnt',
    grund: 'TRUNCATE greift an RLS vorbei; das Recht war bis Phase 1.4 vergeben.',
  },
  {
    name: 'angemeldetes Konto leert eine Tabelle mit TRUNCATE',
    rolle: 'authenticated',
    uid: NUTZER,
    sql: `truncate table public.security_events`,
    erwartung: 'abgelehnt',
  },

  // --- Eigentum -----------------------------------------------------------
  {
    name: 'Konto liest das eigene Profil',
    rolle: 'authenticated',
    uid: NUTZER,
    sql: `select * from public.creator_profiles where user_id = '${NUTZER}'`,
    erwartung: 'erlaubt',
  },
  {
    name: 'Konto liest ein fremdes Profil',
    rolle: 'authenticated',
    uid: NUTZER,
    sql: `select * from public.creator_profiles where user_id = '${ZWEITER}'`,
    erwartung: 'leer',
  },
  {
    name: 'Konto ändert den eigenen Anzeigenamen',
    rolle: 'authenticated',
    uid: NUTZER,
    sql: `update public.creator_profiles set display_name = 'neu' where user_id = '${NUTZER}'`,
    erwartung: 'erlaubt',
  },
  {
    name: 'Konto ändert ein fremdes Profil',
    rolle: 'authenticated',
    uid: NUTZER,
    sql: `update public.creator_profiles set display_name = 'fremd' where user_id = '${ZWEITER}'`,
    erwartung: 'leer',
  },
  {
    name: 'Konto liest die eigene Sitzung',
    rolle: 'authenticated',
    uid: NUTZER,
    sql: `select * from public.creator_sessions where user_id = '${NUTZER}'`,
    erwartung: 'erlaubt',
  },
  {
    name: 'Konto liest eine fremde Sitzung',
    rolle: 'authenticated',
    uid: ZWEITER,
    sql: `select * from public.creator_sessions where user_id = '${NUTZER}'`,
    erwartung: 'leer',
  },
  {
    name: 'Konto legt eine Sitzung im fremden Namen an',
    rolle: 'authenticated',
    uid: ZWEITER,
    sql: `insert into public.creator_sessions (user_id, title, role, status)
          values ('${NUTZER}', 'geklaut', 'creator', 'draft')`,
    erwartung: 'abgelehnt',
  },

  // --- Rechteausweitung ---------------------------------------------------
  {
    name: 'Konto befördert sich selbst zum Inhaber',
    rolle: 'authenticated',
    uid: NUTZER,
    sql: `update public.creator_profiles set role = 'owner' where user_id = '${NUTZER}'`,
    erwartung: 'abgelehnt',
    grund: 'Vor Phase 1.4 lieferte genau diese Anweisung ok:1.',
  },
  {
    name: 'gesperrtes Konto entsperrt sich selbst',
    rolle: 'authenticated',
    uid: GESPERRT,
    sql: `update public.creator_profiles set status = 'active' where user_id = '${GESPERRT}'`,
    erwartung: 'abgelehnt',
  },
  {
    name: 'Konto befördert ein fremdes Konto',
    rolle: 'authenticated',
    uid: NUTZER,
    sql: `update public.creator_profiles set role = 'admin' where user_id = '${ZWEITER}'`,
    erwartung: 'leer',
  },
  {
    name: 'neues Konto legt sich ein Profil mit Rolle owner an',
    rolle: 'authenticated',
    uid: OHNE_PROFIL,
    sql: `insert into public.creator_profiles (user_id, username, role)
          values ('${OHNE_PROFIL}', 'neuling', 'owner')`,
    erwartung: 'abgelehnt',
  },
  {
    name: 'neues Konto legt sich ein gewöhnliches Profil an',
    rolle: 'authenticated',
    uid: OHNE_PROFIL,
    sql: `insert into public.creator_profiles (user_id, username) values ('${OHNE_PROFIL}', 'neuling')`,
    erwartung: 'erlaubt',
  },
  {
    name: 'Administration setzt ein fremdes Konto auf moderator',
    rolle: 'authenticated',
    uid: ADMIN,
    sql: `update public.creator_profiles set role = 'moderator' where user_id = '${ZWEITER}'`,
    erwartung: 'erlaubt',
  },
  {
    name: 'Administration ernennt eine zweite Administration',
    rolle: 'authenticated',
    uid: ADMIN,
    sql: `update public.creator_profiles set role = 'admin' where user_id = '${ZWEITER}'`,
    erwartung: 'abgelehnt',
    grund: 'canAssignRole() verlangt einen echt höheren Rang als die künftige Rolle.',
  },
  {
    name: 'Inhaber ernennt eine Administration',
    rolle: 'authenticated',
    uid: INHABER,
    sql: `update public.creator_profiles set role = 'admin' where user_id = '${ZWEITER}'`,
    erwartung: 'erlaubt',
  },
  {
    name: 'Administration ändert die eigene Rolle',
    rolle: 'authenticated',
    uid: ADMIN,
    sql: `update public.creator_profiles set role = 'owner' where user_id = '${ADMIN}'`,
    erwartung: 'abgelehnt',
  },
  {
    name: 'unbekannte Rolle lässt sich nicht setzen',
    rolle: 'authenticated',
    uid: INHABER,
    sql: `update public.creator_profiles set role = 'superuser' where user_id = '${ZWEITER}'`,
    erwartung: 'abgelehnt',
    grund: 'creator_profiles_role_check lässt nur Rollen mit bekanntem Rang zu.',
  },
  {
    name: 'unbekannter Status lässt sich nicht setzen',
    rolle: 'authenticated',
    uid: ADMIN,
    sql: `update public.creator_profiles set status = 'gelöscht' where user_id = '${ZWEITER}'`,
    erwartung: 'abgelehnt',
  },
  {
    name: 'Administration setzt einen der vier gültigen Zustände',
    rolle: 'authenticated',
    uid: ADMIN,
    sql: `update public.creator_profiles set status = 'disabled' where user_id = '${ZWEITER}'`,
    erwartung: 'erlaubt',
    grund: 'Der frühere CHECK kannte nur active und banned; setUserStatus scheiterte an pending und disabled.',
  },

  // --- Administrativer Zugriff --------------------------------------------
  {
    name: 'gewöhnliches Konto liest Zahlungen',
    rolle: 'authenticated',
    uid: NUTZER,
    sql: `select * from public.payments`,
    erwartung: 'leer',
  },
  {
    name: 'Administration liest Zahlungen',
    rolle: 'authenticated',
    uid: ADMIN,
    sql: `select * from public.payments`,
    erwartung: 'erlaubt',
  },
  {
    name: 'Inhaber liest Zahlungen',
    rolle: 'authenticated',
    uid: INHABER,
    sql: `select * from public.payments`,
    erwartung: 'erlaubt',
    grund: 'Die alten Policies verglichen role = admin; der Inhaber war dadurch ausgeschlossen.',
  },
  {
    name: 'Administration liest alle Profile',
    rolle: 'authenticated',
    uid: ADMIN,
    sql: `select * from public.creator_profiles where user_id <> '${ADMIN}'`,
    erwartung: 'erlaubt',
  },
  {
    name: 'Administration liest fremde Sitzungen',
    rolle: 'authenticated',
    uid: ADMIN,
    sql: `select * from public.creator_sessions where user_id = '${NUTZER}'`,
    erwartung: 'erlaubt',
    grund: 'Die alte Policy verglich creator_profiles.id statt user_id und konnte nie zutreffen.',
  },
  {
    name: 'Administration sperrt eine IP',
    rolle: 'authenticated',
    uid: ADMIN,
    sql: `insert into public.blocked_ips (ip, reason) values ('203.0.113.99', 'Test')`,
    erwartung: 'erlaubt',
    grund: 'Vorher gab es nur eine Lesepolicy; die Sperrfunktion war wirkungslos.',
  },
  {
    name: 'gewöhnliches Konto sperrt eine IP',
    rolle: 'authenticated',
    uid: NUTZER,
    sql: `insert into public.blocked_ips (ip, reason) values ('203.0.113.98', 'Test')`,
    erwartung: 'abgelehnt',
  },

  // --- Funktionen ---------------------------------------------------------
  {
    name: 'anon ruft creator_alerts_eval_all',
    rolle: 'anon',
    sql: `select public.creator_alerts_eval_all()`,
    erwartung: 'abgelehnt',
    grund: 'SECURITY DEFINER ohne Rechtenachweis: Der Aufruf lieferte vorher ok:1 und schrieb Zeilen.',
  },
  {
    name: 'angemeldetes Konto ruft creator_alerts_eval_all',
    rolle: 'authenticated',
    uid: NUTZER,
    sql: `select public.creator_alerts_eval_all()`,
    erwartung: 'abgelehnt',
  },
  {
    name: 'anon ruft admin_payments_summary_30d',
    rolle: 'anon',
    sql: `select * from public.admin_payments_summary_30d()`,
    erwartung: 'abgelehnt',
  },
  {
    name: 'gewöhnliches Konto ruft admin_payments_summary_30d',
    rolle: 'authenticated',
    uid: NUTZER,
    sql: `select * from public.admin_payments_summary_30d()`,
    erwartung: 'leer',
    grund: 'Die Funktion ist SECURITY DEFINER und prüft die Rolle jetzt selbst.',
  },
  {
    name: 'Administration ruft admin_payments_summary_30d',
    rolle: 'authenticated',
    uid: ADMIN,
    sql: `select * from public.admin_payments_summary_30d()`,
    erwartung: 'erlaubt',
  },
  {
    name: 'anon ruft admin_security_overview',
    rolle: 'anon',
    sql: `select * from public.admin_security_overview()`,
    erwartung: 'abgelehnt',
  },
  {
    name: 'gewöhnliches Konto ruft admin_security_overview',
    rolle: 'authenticated',
    uid: NUTZER,
    sql: `select * from public.admin_security_overview()`,
    erwartung: 'leer',
    grund: 'Die Funktion umgeht als DEFINER die Policies und prüft die Rolle deshalb selbst.',
  },
  {
    name: 'Administration ruft admin_security_overview',
    rolle: 'authenticated',
    uid: ADMIN,
    sql: `select * from public.admin_security_overview()`,
    erwartung: 'erlaubt',
  },

  // --- Nur mit Service-Key ------------------------------------------------
  {
    name: 'angemeldetes Konto liest Stripe-Ereignisse',
    rolle: 'authenticated',
    uid: ADMIN,
    sql: `select * from public.stripe_webhooks`,
    erwartung: 'abgelehnt',
  },
]

const KONTEN = [
  { id: NUTZER, name: 'nutzer', role: 'user', status: 'active', profil: true },
  { id: ZWEITER, name: 'zweiter', role: 'user', status: 'active', profil: true },
  { id: ADMIN, name: 'verwaltung', role: 'admin', status: 'active', profil: true },
  { id: INHABER, name: 'inhaber', role: 'owner', status: 'active', profil: true },
  { id: GESPERRT, name: 'gesperrt', role: 'user', status: 'disabled', profil: true },
  // Ein Konto ohne Profil: Nur so lässt sich das erstmalige Anlegen prüfen.
  { id: OHNE_PROFIL, name: null, role: null, status: null, profil: false },
]

const INSTANCE = '00000000-0000-0000-0000-000000000000'

function aufbau() {
  const nutzer = KONTEN.map(
    (k, i) => `insert into auth.users
      (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
      values ('${k.id}', '${INSTANCE}', 'authenticated', 'authenticated',
              'sicherheit-${i}@example.invalid', 'x', now(), now(), now());`,
  )

  const profile = KONTEN.filter((k) => k.profil).map(
    (k) => `insert into public.creator_profiles (user_id, username, role, status)
            values ('${k.id}', '${k.name}', '${k.role}', '${k.status}');`,
  )

  // Je eine Zeile in den Tabellen, auf die sich die Fälle beziehen. Ohne Daten
  // wäre „0 Zeilen“ mehrdeutig: gefiltert oder schlicht leer?
  const daten = [
    `insert into public.creator_sessions (user_id, title, role, status)
       values ('${NUTZER}', 'Reise', 'creator', 'draft');`,
    `insert into public.payments (id, status, amount_chf, created_at) values ('pay_1', 'paid', 100, now());`,
    `insert into public.refunds (payment_id, amount_chf, created_at) values ('pay_1', 10, now());`,
    `insert into public.security_events (type, ip) values ('login_failed', '203.0.113.1');`,
    `insert into public.blocked_ips (ip, reason) values ('203.0.113.2', 'Test');`,
    `insert into public.airports (iata, name, city, country) values ('ZRH', 'Zürich', 'Zürich', 'CH');`,
    `insert into public.blog_comments (user_id, status, content) values ('${NUTZER}', 'visible', 'Hallo');`,
    `insert into public.creator_uploads (user_id, title, description, file_url, region, tags, language, created_at)
       values ('${NUTZER}', 'T', 'B', 'https://example.invalid/a', 'CH', '{}', 'de', now());`,
    `insert into public.session_comments (user_id, session_id, text)
       select '${NUTZER}', s.id, 'Notiz' from public.creator_sessions s limit 1;`,
    `insert into public.stripe_webhooks (id, type) values ('evt_1', 'payment_intent.succeeded');`,
  ]

  return [...nutzer, ...profile, ...daten].join('\n')
}

const HILFSFUNKTION = `
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
    -- Absichtlich scheitern lassen: Damit rollt der Unterabschnitt zurück und
    -- ein erfolgreiches DELETE verfälscht die folgenden Fälle nicht.
    raise exception using errcode = 'ZZ000', message = 'treffer:' || n;
  exception when others then
    if sqlstate = 'ZZ000' then return sqlerrm; end if;
    return 'abgelehnt:' || sqlstate || ':' || sqlerrm;
  end;
end
$fn$;`

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

export async function pruefe() {
  const anweisungen = FAELLE.map(
    (f, i) => `insert into pg_temp.ergebnis
               select ${i}, pg_temp.versuch($s$${f.sql}$s$, '${f.rolle}', ${
                 f.uid ? `'${f.uid}'` : 'null'
               });`,
  )

  const sql = `
begin;
set local search_path = public, extensions;
${HILFSFUNKTION}
create temporary table ergebnis (i int, wert text) on commit drop;
${aufbau()}
${anweisungen.join('\n')}
reset role;
select jsonb_agg(to_jsonb(e) order by e.i) as ergebnisse from pg_temp.ergebnis e;
rollback;`

  const rows = await runSql(sql)
  return rows[0].ergebnisse.map((r) => {
    const fall = FAELLE[r.i]
    return { fall, ...bewerte(fall, r.wert) }
  })
}

async function main() {
  const ergebnisse = await pruefe()
  const fehler = ergebnisse.filter((e) => !e.ok)

  for (const e of ergebnisse) {
    const zeichen = e.ok ? '  ok  ' : ' FEHL '
    console.log(
      `${zeichen} ${e.fall.name.padEnd(58)} ${String(e.fall.erwartung).padEnd(10)} ${e.detail}`,
    )
    if (!e.ok) console.log(`       erwartet ${e.fall.erwartung}, gemessen ${e.tatsaechlich}`)
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
