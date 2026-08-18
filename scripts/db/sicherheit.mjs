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
const CREATOR = '77777777-7777-7777-7777-777777777777'
const MODERATION = '88888888-8888-8888-8888-888888888888'
const BETRIEB = '99999999-9999-9999-9999-999999999999'

// Feste Kennungen der Reise von NUTZER und ihrer Kinder, damit die Fälle sie
// benennen können.
const REISE = 'aaaaaaaa-0000-4000-8000-000000000001'
const ETAPPE = 'aaaaaaaa-0000-4000-8000-000000000002'
const TAG = 'aaaaaaaa-0000-4000-8000-000000000003'
const PUNKT = 'aaaaaaaa-0000-4000-8000-000000000004'

// Die Reise des zweiten Kontos.
const FREMDE_REISE = 'bbbbbbbb-0000-4000-8000-000000000001'

// Ein Konto, das die Missbrauchsschranke von public.reise_anlegen() im Aufbau
// bereits erreicht hat.
const VIELREISEND = 'dddddddd-0000-4000-8000-000000000001'

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
    name: 'anon liest die einzige öffentliche Tabelle und sonst keine',
    rolle: 'anon',
    sql: `select * from information_schema.role_table_grants
          where table_schema = 'public' and grantee = 'anon' and table_name <> 'airports'`,
    erwartung: 'leer',
    grund:
      'Bis Phase 1.4b las anon zusätzlich blog_posts und blog_comments. Beide Tabellen sind entfernt; ' +
      'airports ist der letzte öffentliche Lesezugriff und soll der letzte bleiben.',
  },

  // --- Kein Zugriff ohne Anmeldung ----------------------------------------
  {
    name: 'anon liest Profile',
    rolle: 'anon',
    sql: `select * from public.profiles`,
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
    name: 'anon liest Reisen',
    rolle: 'anon',
    sql: `select * from public.trips`,
    erwartung: 'abgelehnt',
    grund:
      'Der Fall ersetzt die entfallenen Nachweise zu creator_uploads und session_comments, ' +
      'auf denen bis Phase 1.4 USING true galt. Seit Phase 1.5 ist public.trips die ' +
      'Tabelle mit privaten Inhalten; anon hat dort weder Recht noch Policy.',
  },
  {
    name: 'anon liest Stripe-Ereignisse',
    rolle: 'anon',
    sql: `select * from public.stripe_webhooks`,
    erwartung: 'abgelehnt',
    grund: 'Die Tabelle ist seit dem Nachtrag lesbar – aber erst ab der Fähigkeit betrieb-lesen.',
  },
  {
    name: 'anon legt eine Reise an',
    rolle: 'anon',
    sql: `insert into public.trips (user_id, title) values ('${NUTZER}', 'x')`,
    erwartung: 'abgelehnt',
    grund:
      'Ersetzt den entfallenen Nachweis zu creator_uploads, dessen Policy ' +
      '„Allow insert for virtual uploads" das jedem Besucher erlaubte.',
  },
  {
    name: 'anon ruft reise_anlegen',
    rolle: 'anon',
    sql: `select public.reise_anlegen('{"client_ref":"anon","title":"x"}'::jsonb)`,
    erwartung: 'abgelehnt',
    grund:
      'Die Funktion ist der einzige Schreibweg für eine ganze Reise. Ohne Anmeldung ' +
      'fehlt das EXECUTE-Recht – der Gast bleibt im localStorage (ADR-0042).',
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
    sql: `select * from public.profiles where user_id = '${NUTZER}'`,
    erwartung: 'erlaubt',
  },
  {
    name: 'Konto liest ein fremdes Profil',
    rolle: 'authenticated',
    uid: NUTZER,
    sql: `select * from public.profiles where user_id = '${ZWEITER}'`,
    erwartung: 'leer',
  },
  {
    name: 'Konto ändert den eigenen Anzeigenamen',
    rolle: 'authenticated',
    uid: NUTZER,
    sql: `update public.profiles set display_name = 'neu' where user_id = '${NUTZER}'`,
    erwartung: 'erlaubt',
  },
  {
    name: 'Konto ändert ein fremdes Profil',
    rolle: 'authenticated',
    uid: NUTZER,
    sql: `update public.profiles set display_name = 'fremd' where user_id = '${ZWEITER}'`,
    erwartung: 'leer',
  },
  ...reisenachweise(),

  // --- Rechteausweitung ---------------------------------------------------
  {
    name: 'Konto befördert sich selbst zum Inhaber',
    rolle: 'authenticated',
    uid: NUTZER,
    sql: `update public.profiles set role = 'owner' where user_id = '${NUTZER}'`,
    erwartung: 'abgelehnt',
    grund: 'Vor Phase 1.4 lieferte genau diese Anweisung ok:1.',
  },
  {
    name: 'gesperrtes Konto entsperrt sich selbst',
    rolle: 'authenticated',
    uid: GESPERRT,
    sql: `update public.profiles set status = 'active' where user_id = '${GESPERRT}'`,
    erwartung: 'abgelehnt',
  },
  {
    name: 'Konto befördert ein fremdes Konto',
    rolle: 'authenticated',
    uid: NUTZER,
    sql: `update public.profiles set role = 'admin' where user_id = '${ZWEITER}'`,
    erwartung: 'leer',
  },
  {
    name: 'neues Konto legt sich ein Profil mit Rolle owner an',
    rolle: 'authenticated',
    uid: OHNE_PROFIL,
    sql: `insert into public.profiles (user_id, display_name, role)
          values ('${OHNE_PROFIL}', 'Neuling', 'owner')`,
    erwartung: 'abgelehnt',
  },
  {
    name: 'neues Konto legt sich ein gewöhnliches Profil an',
    rolle: 'authenticated',
    uid: OHNE_PROFIL,
    sql: `insert into public.profiles (user_id, display_name) values ('${OHNE_PROFIL}', 'Neuling')`,
    erwartung: 'erlaubt',
  },
  {
    name: 'Administration setzt ein fremdes Konto auf moderator',
    rolle: 'authenticated',
    uid: ADMIN,
    sql: `update public.profiles set role = 'moderator' where user_id = '${ZWEITER}'`,
    erwartung: 'erlaubt',
  },
  {
    name: 'Administration ernennt eine zweite Administration',
    rolle: 'authenticated',
    uid: ADMIN,
    sql: `update public.profiles set role = 'admin' where user_id = '${ZWEITER}'`,
    erwartung: 'abgelehnt',
    grund: 'canAssignRole() verlangt einen echt höheren Rang als die künftige Rolle.',
  },
  {
    name: 'Inhaber ernennt eine Administration',
    rolle: 'authenticated',
    uid: INHABER,
    sql: `update public.profiles set role = 'admin' where user_id = '${ZWEITER}'`,
    erwartung: 'erlaubt',
  },
  {
    name: 'Administration ändert die eigene Rolle',
    rolle: 'authenticated',
    uid: ADMIN,
    sql: `update public.profiles set role = 'owner' where user_id = '${ADMIN}'`,
    erwartung: 'abgelehnt',
  },
  {
    name: 'unbekannte Rolle lässt sich nicht setzen',
    rolle: 'authenticated',
    uid: INHABER,
    sql: `update public.profiles set role = 'superuser' where user_id = '${ZWEITER}'`,
    erwartung: 'abgelehnt',
    grund: 'profiles_role_check lässt nur Rollen mit bekanntem Rang zu.',
  },
  {
    name: 'unbekannter Status lässt sich nicht setzen',
    rolle: 'authenticated',
    uid: ADMIN,
    sql: `update public.profiles set status = 'gelöscht' where user_id = '${ZWEITER}'`,
    erwartung: 'abgelehnt',
  },
  {
    name: 'Administration setzt einen der vier gültigen Zustände',
    rolle: 'authenticated',
    uid: ADMIN,
    sql: `update public.profiles set status = 'disabled' where user_id = '${ZWEITER}'`,
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
    sql: `select * from public.profiles where user_id <> '${ADMIN}'`,
    erwartung: 'erlaubt',
  },
  {
    name: 'Administration liest fremde Reisen',
    rolle: 'authenticated',
    uid: ADMIN,
    sql: `select * from public.trips where user_id = '${NUTZER}'`,
    erwartung: 'leer',
    grund:
      'Absichtlich leer: Adminrechte öffnen private Reiseinhalte nicht (ADR-0041). Die ' +
      'Kennzahlen des Administrationsbereichs kommen aus Aggregatfunktionen, nicht aus ' +
      'dieser Tabelle.',
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
  //
  // Die beiden Nachweise zu `creator_alerts_eval_all` sind mit Phase 1.4b
  // entfallen: Die Funktion ist entfernt. Was sie belegten – ein
  // `SECURITY DEFINER` ohne eigene Rechteprüfung ist für `anon` und für jedes
  // angemeldete Konto unerreichbar – belegen die folgenden sechs Fälle für die
  // beiden verbleibenden Funktionen dieser Art.
  {
    name: 'keine SECURITY-DEFINER-Funktion ist für anon ausführbar',
    rolle: 'anon',
    sql: `select p.proname from pg_proc p
          join pg_namespace n on n.oid = p.pronamespace
          where n.nspname = 'public'
            and p.prosecdef
            and has_function_privilege('anon', p.oid, 'execute')`,
    erwartung: 'leer',
    grund:
      'Vor Phase 1.4 war creator_alerts_eval_all() für anon aufrufbar und schrieb Zeilen. ' +
      'Der Fall hält fest, dass keine SECURITY-DEFINER-Funktion diesen Weg zurückbekommt.',
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

  // --- Fähigkeit betrieb-lesen (ab moderator) ------------------------------
  //
  // Bis zum Nachtrag verlangten diese Tabellen `admin`. Eine Moderation kam
  // durch `requireAdminApi()` und scheiterte danach an RLS – die Oberfläche
  // zeigte eine leere Liste statt einer Ablehnung.
  {
    name: 'Moderation liest Sicherheitsereignisse',
    rolle: 'authenticated',
    uid: MODERATION,
    sql: `select * from public.security_events`,
    erwartung: 'erlaubt',
    grund: 'GET /api/admin/security/list lässt eine Moderation durch.',
  },
  {
    name: 'Moderation liest die Sperrliste',
    rolle: 'authenticated',
    uid: MODERATION,
    sql: `select * from public.blocked_ips`,
    erwartung: 'erlaubt',
  },
  {
    name: 'Moderation liest Zahlungen',
    rolle: 'authenticated',
    uid: MODERATION,
    sql: `select * from public.payments`,
    erwartung: 'erlaubt',
  },
  {
    name: 'Moderation liest Rückerstattungen',
    rolle: 'authenticated',
    uid: MODERATION,
    sql: `select * from public.refunds`,
    erwartung: 'erlaubt',
  },
  {
    name: 'Moderation liest Stripe-Ereignisse',
    rolle: 'authenticated',
    uid: MODERATION,
    sql: `select * from public.stripe_webhooks`,
    erwartung: 'erlaubt',
    grund: 'GET /api/admin/payments/webhooks lieferte vorher immer eine leere Liste.',
  },
  // Eine Stufe unterhalb: `creator` liegt direkt unter `moderator`.
  {
    name: 'Creator liest Sicherheitsereignisse',
    rolle: 'authenticated',
    uid: CREATOR,
    sql: `select * from public.security_events`,
    erwartung: 'leer',
  },
  {
    name: 'Creator liest die Sperrliste',
    rolle: 'authenticated',
    uid: CREATOR,
    sql: `select * from public.blocked_ips`,
    erwartung: 'leer',
  },
  {
    name: 'Creator liest Zahlungen',
    rolle: 'authenticated',
    uid: CREATOR,
    sql: `select * from public.payments`,
    erwartung: 'leer',
  },
  {
    name: 'Creator liest Stripe-Ereignisse',
    rolle: 'authenticated',
    uid: CREATOR,
    sql: `select * from public.stripe_webhooks`,
    erwartung: 'leer',
  },

  // --- Fähigkeit betrieb-eingreifen (ab operator) --------------------------
  {
    name: 'Betrieb sperrt eine IP',
    rolle: 'authenticated',
    uid: BETRIEB,
    sql: `insert into public.blocked_ips (ip, reason) values ('203.0.113.50', 'Test')`,
    erwartung: 'erlaubt',
    grund: 'POST /api/admin/security/block verlangt operator; die Policy verlangte admin.',
  },
  {
    name: 'Moderation sperrt eine IP',
    rolle: 'authenticated',
    uid: MODERATION,
    sql: `insert into public.blocked_ips (ip, reason) values ('203.0.113.51', 'Test')`,
    erwartung: 'abgelehnt',
    grund: 'Lesen ja, eingreifen nein – genau eine Stufe unterhalb.',
  },
  {
    name: 'Betrieb entsperrt eine IP',
    rolle: 'authenticated',
    uid: BETRIEB,
    sql: `delete from public.blocked_ips where ip = '203.0.113.2'`,
    erwartung: 'erlaubt',
  },
  {
    name: 'Moderation entsperrt eine IP',
    rolle: 'authenticated',
    uid: MODERATION,
    sql: `delete from public.blocked_ips where ip = '203.0.113.2'`,
    erwartung: 'leer',
  },
  {
    name: 'Betrieb bucht eine Rückerstattung',
    rolle: 'authenticated',
    uid: BETRIEB,
    sql: `insert into public.refunds (payment_id, amount_chf) values ('pay_1', 5)`,
    erwartung: 'erlaubt',
    grund: 'POST /api/admin/payments/refund schrieb vorher ins Leere: keine INSERT-Policy.',
  },
  {
    name: 'Moderation bucht eine Rückerstattung',
    rolle: 'authenticated',
    uid: MODERATION,
    sql: `insert into public.refunds (payment_id, amount_chf) values ('pay_1', 5)`,
    erwartung: 'abgelehnt',
  },
  {
    name: 'Betrieb setzt eine Zahlung auf erstattet',
    rolle: 'authenticated',
    uid: BETRIEB,
    sql: `update public.payments set status = 'refunded' where id = 'pay_1'`,
    erwartung: 'erlaubt',
  },
  {
    name: 'Moderation setzt eine Zahlung auf erstattet',
    rolle: 'authenticated',
    uid: MODERATION,
    sql: `update public.payments set status = 'refunded' where id = 'pay_1'`,
    erwartung: 'leer',
  },

  // --- Fähigkeit konten-verwalten (ab moderator) ---------------------------
  {
    name: 'Moderation liest fremde Profile',
    rolle: 'authenticated',
    uid: MODERATION,
    sql: `select * from public.profiles where user_id = '${NUTZER}'`,
    erwartung: 'erlaubt',
    grund: 'canManageUsers() lässt eine Moderation auf /admin/users; RLS verlangte admin.',
  },
  {
    name: 'Moderation setzt ein fremdes Konto auf creator',
    rolle: 'authenticated',
    uid: MODERATION,
    sql: `update public.profiles set role = 'creator' where user_id = '${ZWEITER}'`,
    erwartung: 'erlaubt',
  },
  {
    name: 'Moderation ernennt eine Administration',
    rolle: 'authenticated',
    uid: MODERATION,
    sql: `update public.profiles set role = 'admin' where user_id = '${ZWEITER}'`,
    erwartung: 'abgelehnt',
    grund: 'Der Auslöser verlangt einen echt höheren Rang als die künftige Rolle.',
  },
  {
    name: 'Creator liest fremde Profile',
    rolle: 'authenticated',
    uid: CREATOR,
    sql: `select * from public.profiles where user_id = '${NUTZER}'`,
    erwartung: 'leer',
  },

  // --- Fähigkeit inhalte-moderieren (ab moderator) -------------------------
  //
  // Diese Fähigkeit deckt seit Phase 1.5 keine Tabelle mehr ab: Ihre letzte
  // Tabelle war `creator_sessions`, entfernt mit
  // `20260817120200_creator_sessions_entfernen.sql`. Die neuen Reisetabellen
  // treten **nicht** an ihre Stelle – eine Reise ist privat und kein zu
  // moderierender Inhalt (ADR-0041). Die Fähigkeit bleibt Teil des Modells,
  // das `CAPABILITY_MINIMUM` in `lib/auth/roles.ts` und
  // `lib/auth/faehigkeiten-datenbank.test.ts` zusammenhalten, und wird deshalb
  // wie `konfiguration-verwalten` direkt geprüft.
  {
    name: 'Moderation erreicht die Fähigkeit inhalte-moderieren',
    rolle: 'authenticated',
    uid: MODERATION,
    sql: `select 1 where public.darf_inhalte_moderieren()`,
    erwartung: 'erlaubt',
  },
  {
    name: 'Creator erreicht die Fähigkeit inhalte-moderieren nicht',
    rolle: 'authenticated',
    uid: CREATOR,
    sql: `select 1 where public.darf_inhalte_moderieren()`,
    erwartung: 'leer',
    grund: 'Genau eine Stufe unterhalb: creator liegt unter moderator.',
  },
  {
    name: 'Moderation liest fremde Reisen',
    rolle: 'authenticated',
    uid: MODERATION,
    sql: `select * from public.trips where user_id = '${NUTZER}'`,
    erwartung: 'leer',
    grund:
      'Die Fähigkeit inhalte-moderieren erstreckt sich nicht auf Reisen. Der Fall hält ' +
      'fest, dass die entfallene Moderation von creator_sessions keine Entsprechung im ' +
      'neuen Reiseschema bekommt.',
  },

  // --- Fähigkeit konfiguration-verwalten (ab admin) ------------------------
  //
  // Diese Fähigkeit deckt seit Phase 1.4b keine Tabelle mehr ab: Ihre drei
  // Tabellen – `admin_email_boxes`, `dns_audit_events`, `copilot_suggestions` –
  // gehörten zu den 29 entfernten. Die Funktion bleibt trotzdem bestehen; sie
  // ist Teil des Fähigkeitsmodells, das `CAPABILITY_MINIMUM` in
  // `lib/auth/roles.ts` und `lib/auth/faehigkeiten-datenbank.test.ts`
  // zusammenhalten. Die beiden Fälle prüfen sie deshalb direkt statt über eine
  // Tabelle: `select 1 where …` liefert eine Zeile, wenn die Fähigkeit greift,
  // und keine, wenn sie es nicht tut.
  {
    name: 'Administration erreicht die Fähigkeit konfiguration-verwalten',
    rolle: 'authenticated',
    uid: ADMIN,
    sql: `select 1 where public.darf_konfiguration_verwalten()`,
    erwartung: 'erlaubt',
  },
  {
    name: 'Betrieb erreicht die Fähigkeit konfiguration-verwalten nicht',
    rolle: 'authenticated',
    uid: BETRIEB,
    sql: `select 1 where public.darf_konfiguration_verwalten()`,
    erwartung: 'leer',
    grund: 'Genau eine Stufe unterhalb: operator liegt unter admin.',
  },

  // --- Notzugang erteilt keine Datenbankrechte -----------------------------
  //
  // `ADMIN_ALLOWED_EMAILS` öffnet die Oberfläche. Die Datenbank kennt die
  // Liste nicht und soll sie nicht kennen (ADR-0036). Für die Datenbank ist
  // ein solches Konto genau das, was seine Rolle sagt – hier `user`, im
  // zweiten Fall ein Konto ganz ohne Profil.
  {
    name: 'Notzugang mit Rolle user liest Sicherheitsereignisse',
    rolle: 'authenticated',
    uid: NUTZER,
    sql: `select * from public.security_events`,
    erwartung: 'leer',
  },
  {
    name: 'Notzugang mit Rolle user sperrt eine IP',
    rolle: 'authenticated',
    uid: NUTZER,
    sql: `insert into public.blocked_ips (ip, reason) values ('203.0.113.52', 'Test')`,
    erwartung: 'abgelehnt',
  },
  {
    name: 'Notzugang ohne Profil liest Zahlungen',
    rolle: 'authenticated',
    uid: OHNE_PROFIL,
    sql: `select * from public.payments`,
    erwartung: 'leer',
    grund: 'aktuelle_rolle() liefert NULL; hat_rolle_mindestens() ist fail-closed.',
  },
  {
    name: 'Notzugang ohne Profil liest alle Profile',
    rolle: 'authenticated',
    uid: OHNE_PROFIL,
    sql: `select * from public.profiles`,
    erwartung: 'leer',
  },

  // --- Funktionen mit eigener Prüfung --------------------------------------
  {
    name: 'Moderation ruft admin_payments_summary_30d',
    rolle: 'authenticated',
    uid: MODERATION,
    sql: `select * from public.admin_payments_summary_30d()`,
    erwartung: 'erlaubt',
    grund: 'Die Kennzahlenleiste steht im Bereich, der ab moderator offen ist.',
  },
  {
    name: 'Creator ruft admin_payments_summary_30d',
    rolle: 'authenticated',
    uid: CREATOR,
    sql: `select * from public.admin_payments_summary_30d()`,
    erwartung: 'leer',
  },
  {
    name: 'Moderation ruft admin_security_overview',
    rolle: 'authenticated',
    uid: MODERATION,
    sql: `select * from public.admin_security_overview()`,
    erwartung: 'erlaubt',
  },
  {
    name: 'Creator ruft admin_security_overview',
    rolle: 'authenticated',
    uid: CREATOR,
    sql: `select * from public.admin_security_overview()`,
    erwartung: 'leer',
  },

  // --- Reisekennzahlen: Zahlen ja, Inhalte nein ----------------------------
  {
    name: 'anon ruft admin_reisen_kennzahlen',
    rolle: 'anon',
    sql: `select * from public.admin_reisen_kennzahlen()`,
    erwartung: 'abgelehnt',
  },
  {
    name: 'gewöhnliches Konto ruft admin_reisen_kennzahlen',
    rolle: 'authenticated',
    uid: NUTZER,
    sql: `select * from public.admin_reisen_kennzahlen()`,
    erwartung: 'leer',
    grund: 'Die Funktion ist SECURITY DEFINER und prüft betrieb-lesen selbst.',
  },
  {
    name: 'Moderation ruft admin_reisen_kennzahlen',
    rolle: 'authenticated',
    uid: MODERATION,
    sql: `select * from public.admin_reisen_kennzahlen()`,
    erwartung: 'erlaubt',
  },
  {
    name: 'anon ruft admin_reisen_zeitreihe',
    rolle: 'anon',
    sql: `select * from public.admin_reisen_zeitreihe(14)`,
    erwartung: 'abgelehnt',
  },
  {
    name: 'Creator ruft admin_reisen_zeitreihe',
    rolle: 'authenticated',
    uid: CREATOR,
    sql: `select * from public.admin_reisen_zeitreihe(14)`,
    erwartung: 'leer',
  },
  {
    name: 'Moderation ruft admin_reisen_zeitreihe',
    rolle: 'authenticated',
    uid: MODERATION,
    sql: `select * from public.admin_reisen_zeitreihe(14)`,
    erwartung: 'erlaubt',
  },
]

/**
 * Die Nachweise zu den vier Reisetabellen und zu `public.reise_anlegen()`.
 *
 * Als eigene Funktion, weil es rund vierzig Fälle sind und die Liste `FAELLE`
 * sonst zur Hälfte aus Reisen bestünde. Aufgerufen wird sie dort, wo die
 * Nachweise zum Eigentum stehen – die Reihenfolge der Ausgabe folgt der Liste.
 *
 * Ein JSON-Rumpf für `reise_anlegen()`. Die Nutzlast ist absichtlich klein: Was
 * die Funktion aus einem vollständigen Reisegraphen macht, prüfen die
 * Einheitentests der Abbildung; hier geht es um Eigentum, Idempotenz und die
 * Frage, was die Funktion aus der Nutzlast **nicht** übernimmt.
 */
function reisenachweise() {
  const reise = (kennung, weiteres = '') =>
    `'{"client_ref":"${kennung}","title":"Testreise"${weiteres}}'::jsonb`

  return [
    // --- trips: Eigentum ---------------------------------------------------
    {
      name: 'Konto liest die eigene Reise',
      rolle: 'authenticated',
      uid: NUTZER,
      sql: `select * from public.trips where id = '${REISE}'`,
      erwartung: 'erlaubt',
    },
    {
      name: 'Konto liest eine fremde Reise',
      rolle: 'authenticated',
      uid: ZWEITER,
      sql: `select * from public.trips where id = '${REISE}'`,
      erwartung: 'leer',
    },
    {
      name: 'Konto liest ausser der eigenen keine Reise',
      rolle: 'authenticated',
      uid: NUTZER,
      sql: `select * from public.trips where user_id <> '${NUTZER}'`,
      erwartung: 'leer',
      grund:
        'Der Gegenprobe-Fall zum Lesen: Es gibt eine zweite Reise in der Tabelle, und ' +
        'sie bleibt unsichtbar.',
    },
    {
      name: 'Konto ändert den Titel der eigenen Reise',
      rolle: 'authenticated',
      uid: NUTZER,
      sql: `update public.trips set title = 'Japan im Frühling' where id = '${REISE}'`,
      erwartung: 'erlaubt',
    },
    {
      name: 'Konto ändert eine fremde Reise',
      rolle: 'authenticated',
      uid: ZWEITER,
      sql: `update public.trips set title = 'geklaut' where id = '${REISE}'`,
      erwartung: 'leer',
    },
    {
      name: 'Konto löscht die eigene Reise',
      rolle: 'authenticated',
      uid: NUTZER,
      sql: `delete from public.trips where id = '${REISE}'`,
      erwartung: 'erlaubt',
    },
    {
      name: 'Konto löscht eine fremde Reise',
      rolle: 'authenticated',
      uid: ZWEITER,
      sql: `delete from public.trips where id = '${REISE}'`,
      erwartung: 'leer',
    },
    {
      name: 'Konto leert die Reisetabelle mit TRUNCATE',
      rolle: 'authenticated',
      uid: NUTZER,
      sql: `truncate table public.trips`,
      erwartung: 'abgelehnt',
      grund: 'TRUNCATE greift an RLS vorbei und ist deshalb kein vergebenes Recht.',
    },

    // --- trips: Eigentum ist nicht vom Client setzbar ----------------------
    {
      name: 'Konto legt eine Reise im fremden Namen an',
      rolle: 'authenticated',
      uid: ZWEITER,
      sql: `insert into public.trips (user_id, title) values ('${NUTZER}', 'geschenkt')`,
      erwartung: 'abgelehnt',
      grund: 'Der WITH CHECK der INSERT-Policy verlangt user_id = auth.uid().',
    },
    {
      name: 'Konto legt eine Reise ohne user_id an',
      rolle: 'authenticated',
      uid: ZWEITER,
      sql: `insert into public.trips (title, client_ref) values ('meine', 'ohne-uid')`,
      erwartung: 'erlaubt',
      grund:
        'Der positive Gegenfall: `default auth.uid()` setzt die Spalte. Genau so schreibt ' +
        'lib/trips/aktionen.ts – die Anwendung schickt user_id nie mit.',
    },
    {
      name: 'Konto schreibt die eigene Reise auf ein fremdes Konto um',
      rolle: 'authenticated',
      uid: NUTZER,
      sql: `update public.trips set user_id = '${ZWEITER}' where id = '${REISE}'`,
      erwartung: 'abgelehnt',
      grund:
        'Der WITH CHECK der UPDATE-Policy macht user_id faktisch unveränderlich. Ohne ihn ' +
        'liesse sich fremdes Eigentum erzeugen, ohne es je zu lesen.',
    },
    {
      name: 'Konto legt dieselbe Kennung zweimal an',
      rolle: 'authenticated',
      uid: NUTZER,
      sql: `insert into public.trips (title, client_ref) values ('zweite', 'gast-1')`,
      erwartung: 'abgelehnt',
      grund:
        'trips_client_ref_eindeutig ist der Träger der Idempotenz. Ohne die Bedingung wäre ' +
        'jeder Retry der Gastübernahme eine zweite Reise.',
    },
    {
      name: 'zwei Konten dürfen dieselbe Kennung tragen',
      rolle: 'authenticated',
      uid: ZWEITER,
      sql: `insert into public.trips (title, client_ref) values ('gleiche Kennung', 'gast-1')`,
      erwartung: 'erlaubt',
      grund:
        'Die Eindeutigkeit gilt je Konto. Sonst könnte ein fremder Browser eine Kennung ' +
        'belegen und die Übernahme eines anderen Kontos blockieren.',
    },

    // --- trips: die Erzeugungsregeln gelten auf jedem Weg ------------------
    //
    // `public.reise_anlegen()` ist der Weg, den die Anwendung nimmt – aber
    // `authenticated` hat `INSERT` auf der Tabelle, und PostgREST macht dieses
    // Recht öffentlich erreichbar. Die folgenden Fälle prüfen deshalb die
    // Regeln dort, wo jeder Weg vorbeikommt: am Auslöser
    // `trips_erzeugung_pruefen` und an der Bedingung auf `client_ref`
    // (ADR-0045). Zu jeder Regel gehört der direkte Versuch, sie zu umgehen.
    {
      name: 'Konto legt direkt eine Reise ohne Kennung an',
      rolle: 'authenticated',
      uid: NUTZER,
      sql: `insert into public.trips (title) values ('ohne Kennung')`,
      erwartung: 'abgelehnt',
      grund:
        'Ohne Kennung wäre trips_client_ref_eindeutig wirkungslos – NULL kollidiert in ' +
        'PostgreSQL nicht mit NULL. Die Spalte ist seit ADR-0045 NOT NULL, damit die ' +
        'Idempotenz nicht am Aufrufweg hängt.',
    },
    {
      name: 'Konto legt direkt eine gebuchte Reise an',
      rolle: 'authenticated',
      uid: NUTZER,
      sql: `insert into public.trips (title, client_ref, status)
            values ('direkt gebucht', 'direkt-1', 'booked')`,
      erwartung: 'abgelehnt',
      grund:
        'reise_anlegen() setzt status hart auf draft. Ohne den Auslöser liesse sich derselbe ' +
        'Status am direkten Weg einfach behaupten.',
    },
    {
      name: 'Konto legt direkt eine Reise als Entwurf an',
      rolle: 'authenticated',
      uid: NUTZER,
      sql: `insert into public.trips (title, client_ref) values ('direkt', 'direkt-2')`,
      erwartung: 'erlaubt',
      grund:
        'Der positive Gegenfall: Ein direkter INSERT bleibt möglich. Er ergibt dasselbe wie ' +
        'ein Aufruf ohne Etappen – eine eigene Reise mit Kennung, als Entwurf.',
    },
    {
      name: 'die Datenbank setzt created_at selbst',
      rolle: 'authenticated',
      uid: NUTZER,
      sql: `insert into public.trips (title, client_ref, created_at, updated_at)
              values ('rückdatiert', 'direkt-3', '2020-01-01', '2020-01-01');
            select id from public.trips
              where client_ref = 'direkt-3'
                and created_at >= now() - interval '1 minute'
                and updated_at >= now() - interval '1 minute'`,
      erwartung: 'erlaubt',
      grund:
        'Ein rückdatiertes created_at wäre der bequemste Weg an der Schranke vorbei: Zeilen ' +
        'ausserhalb des Fensters zählen nicht mit. Der Auslöser setzt beide Zeitstempel.',
    },
    {
      name: 'Konto umgeht die Schranke mit einem direkten INSERT',
      rolle: 'authenticated',
      uid: VIELREISEND,
      sql: `insert into public.trips (title, client_ref) values ('direkt', 'direkt-4')`,
      erwartung: 'abgelehnt',
      grund:
        'Der Kern des Befunds: Bis ADR-0045 stand die Schranke nur in reise_anlegen(). Über ' +
        'PostgREST liess sie sich mit einem direkten INSERT vollständig übergehen.',
    },
    {
      name: 'Konto umgeht die Schranke mit einem rückdatierten INSERT',
      rolle: 'authenticated',
      uid: VIELREISEND,
      sql: `insert into public.trips (title, client_ref, created_at)
            values ('alt', 'direkt-5', now() - interval '3 hours')`,
      erwartung: 'abgelehnt',
      grund:
        'Die zweite Hälfte derselben Lücke: Eine Schranke über ein Zeitfenster ist nur so ' +
        'gut wie der Zeitstempel, auf den sie sich stützt.',
    },
    {
      name: 'Konto legt viele Reisen in einer Anweisung an',
      rolle: 'authenticated',
      uid: NUTZER,
      sql: `insert into public.trips (title, client_ref)
            select 'Serie ' || g, 'serie-' || g from generate_series(1, 61) as g`,
      erwartung: 'abgelehnt',
      grund:
        'Eine Anweisung ist kein Schlupfloch: Der Auslöser zählt je Zeile und sieht die ' +
        'Zeilen, die dieselbe Anweisung vorher eingefügt hat.',
    },

    // --- trips: Adminrechte öffnen keine Reise -----------------------------
    {
      name: 'Inhaber liest eine fremde Reise',
      rolle: 'authenticated',
      uid: INHABER,
      sql: `select * from public.trips where id = '${REISE}'`,
      erwartung: 'leer',
      grund: 'Die höchste Rolle des Modells sieht keine private Reise (ADR-0041).',
    },
    {
      name: 'Administration ändert eine fremde Reise',
      rolle: 'authenticated',
      uid: ADMIN,
      sql: `update public.trips set status = 'archived' where id = '${REISE}'`,
      erwartung: 'leer',
    },
    {
      name: 'Administration löscht eine fremde Reise',
      rolle: 'authenticated',
      uid: ADMIN,
      sql: `delete from public.trips where id = '${REISE}'`,
      erwartung: 'leer',
    },
    {
      name: 'keine Policy der Reisetabellen prüft eine Fähigkeit',
      rolle: 'anon',
      sql: `select polname from pg_policy p
            join pg_class c on c.oid = p.polrelid
            join pg_namespace n on n.oid = c.relnamespace
            where n.nspname = 'public'
              and c.relname in ('trips', 'trip_stages', 'trip_days', 'trip_items')
              and (pg_get_expr(p.polqual, p.polrelid) like '%darf\\_%'
                or pg_get_expr(p.polwithcheck, p.polrelid) like '%darf\\_%'
                or pg_get_expr(p.polqual, p.polrelid) like '%hat\\_rolle%'
                or pg_get_expr(p.polwithcheck, p.polrelid) like '%hat\\_rolle%')`,
      erwartung: 'leer',
      grund:
        'Der strukturelle Nachweis zu den drei Fällen darüber: Es gibt keine Policy, über ' +
        'die eine künftige Rolle in Reisen hineinkäme. Ein solcher Zugriff müsste als ' +
        'eigene Entscheidung dokumentiert werden.',
    },

    // --- Kindtabellen: anon ------------------------------------------------
    {
      name: 'anon liest Reiseetappen',
      rolle: 'anon',
      sql: `select * from public.trip_stages`,
      erwartung: 'abgelehnt',
    },
    {
      name: 'anon liest Reisetage',
      rolle: 'anon',
      sql: `select * from public.trip_days`,
      erwartung: 'abgelehnt',
    },
    {
      name: 'anon liest Planpunkte',
      rolle: 'anon',
      sql: `select * from public.trip_items`,
      erwartung: 'abgelehnt',
    },

    // --- Kindtabellen: Eigentum -------------------------------------------
    {
      name: 'Konto liest die eigene Etappe',
      rolle: 'authenticated',
      uid: NUTZER,
      sql: `select * from public.trip_stages where trip_id = '${REISE}'`,
      erwartung: 'erlaubt',
    },
    {
      name: 'Konto liest eine fremde Etappe',
      rolle: 'authenticated',
      uid: ZWEITER,
      sql: `select * from public.trip_stages where trip_id = '${REISE}'`,
      erwartung: 'leer',
    },
    {
      name: 'Konto liest den eigenen Reisetag',
      rolle: 'authenticated',
      uid: NUTZER,
      sql: `select * from public.trip_days where trip_id = '${REISE}'`,
      erwartung: 'erlaubt',
    },
    {
      name: 'Konto liest einen fremden Reisetag',
      rolle: 'authenticated',
      uid: ZWEITER,
      sql: `select * from public.trip_days where trip_id = '${REISE}'`,
      erwartung: 'leer',
    },
    {
      name: 'Konto liest den eigenen Planpunkt',
      rolle: 'authenticated',
      uid: NUTZER,
      sql: `select * from public.trip_items where trip_id = '${REISE}'`,
      erwartung: 'erlaubt',
    },
    {
      name: 'Konto liest einen fremden Planpunkt',
      rolle: 'authenticated',
      uid: ZWEITER,
      sql: `select * from public.trip_items where trip_id = '${REISE}'`,
      erwartung: 'leer',
    },
    {
      name: 'Konto ändert die eigene Etappe',
      rolle: 'authenticated',
      uid: NUTZER,
      sql: `update public.trip_stages set name = 'Kyoto' where id = '${ETAPPE}'`,
      erwartung: 'erlaubt',
    },
    {
      name: 'Konto ändert einen fremden Planpunkt',
      rolle: 'authenticated',
      uid: ZWEITER,
      sql: `update public.trip_items set title = 'geklaut' where id = '${PUNKT}'`,
      erwartung: 'leer',
    },
    {
      name: 'Konto löscht den eigenen Planpunkt',
      rolle: 'authenticated',
      uid: NUTZER,
      sql: `delete from public.trip_items where id = '${PUNKT}'`,
      erwartung: 'erlaubt',
    },
    {
      name: 'Konto löscht einen fremden Reisetag',
      rolle: 'authenticated',
      uid: ZWEITER,
      sql: `delete from public.trip_days where id = '${TAG}'`,
      erwartung: 'leer',
    },

    // --- Kindtabellen: kein Kind an einer fremden Reise --------------------
    //
    // Diese vier Fälle prüfen den zusammengesetzten Fremdschlüssel
    // `(trip_id, user_id) → trips (id, user_id)`. Er ist der Grund, warum die
    // Policies der Kindtabellen ein Spaltenvergleich sein dürfen: Ein Kind mit
    // eigener `user_id` kann nicht auf eine fremde Reise zeigen, weil das Paar
    // in `trips` nicht existiert.
    {
      name: 'Konto hängt eine Etappe an eine fremde Reise',
      rolle: 'authenticated',
      uid: ZWEITER,
      sql: `insert into public.trip_stages (trip_id, name) values ('${REISE}', 'Einbruch')`,
      erwartung: 'abgelehnt',
      grund: 'Das Paar (fremde Reise, eigenes Konto) gibt es in trips nicht.',
    },
    {
      name: 'Konto hängt einen Reisetag an eine fremde Reise',
      rolle: 'authenticated',
      uid: ZWEITER,
      sql: `insert into public.trip_days (trip_id, day_index) values ('${REISE}', 9)`,
      erwartung: 'abgelehnt',
    },
    {
      name: 'Konto hängt einen Planpunkt an eine fremde Reise',
      rolle: 'authenticated',
      uid: ZWEITER,
      sql: `insert into public.trip_items (trip_id, kind, title)
            values ('${REISE}', 'note', 'Einbruch')`,
      erwartung: 'abgelehnt',
    },
    {
      name: 'Konto hängt einen Planpunkt an einen fremden Reisetag',
      rolle: 'authenticated',
      uid: ZWEITER,
      sql: `insert into public.trip_items (trip_id, day_id, kind, title)
            values ('${FREMDE_REISE}', '${TAG}', 'note', 'Einbruch')`,
      erwartung: 'abgelehnt',
      grund:
        'trip_items_tag_fk bindet den Tag an dieselbe Reise. Ein Tag einer anderen Reise ' +
        'ist deshalb auch dann unerreichbar, wenn die eigene Reise stimmt.',
    },
    {
      name: 'Konto hängt eine Etappe mit fremder user_id an die eigene Reise',
      rolle: 'authenticated',
      uid: ZWEITER,
      sql: `insert into public.trip_stages (trip_id, user_id, name)
            values ('${FREMDE_REISE}', '${NUTZER}', 'untergeschoben')`,
      erwartung: 'abgelehnt',
      grund:
        'Der WITH CHECK verlangt user_id = auth.uid(); ohne ihn liefe die Eigentümerspalte ' +
        'der Kindtabelle von der Reise weg.',
    },
    {
      name: 'Konto hängt eine Etappe ohne user_id an die eigene Reise',
      rolle: 'authenticated',
      uid: ZWEITER,
      sql: `insert into public.trip_stages (trip_id, name) values ('${FREMDE_REISE}', 'Bergen')`,
      erwartung: 'erlaubt',
      grund: 'Der positive Gegenfall: So schreibt die Anwendung.',
    },

    // --- reise_anlegen -----------------------------------------------------
    {
      name: 'Konto ruft reise_anlegen',
      rolle: 'authenticated',
      uid: NUTZER,
      sql: `select public.reise_anlegen(${reise('neu-1')})`,
      erwartung: 'erlaubt',
    },
    // Die folgenden Fälle setzen zwei Anweisungen ab: erst der Aufruf, dann die
    // Nachschau. Ein einzelner Ausdruck ginge nicht – ein `select` über
    // `public.trips` arbeitet auf dem Zustand vom Beginn seiner Anweisung und
    // sähe die Reise nicht, die ein Funktionsaufruf in derselben Anweisung
    // gerade angelegt hat.
    {
      name: 'reise_anlegen liefert bei zweitem Aufruf dieselbe Reise',
      rolle: 'authenticated',
      uid: NUTZER,
      sql: `select public.reise_anlegen(${reise('idem-1')});
            select 1 where public.reise_anlegen(${reise('idem-1')})
              = (select id from public.trips
                 where user_id = '${NUTZER}' and client_ref = 'idem-1')`,
      erwartung: 'erlaubt',
      grund:
        'Der Kern der Idempotenz: Der zweite Aufruf legt nichts an und liefert die Kennung ' +
        'der bestehenden Reise. Genau darauf verlässt sich die Brücke auf /reisen, wenn sie ' +
        'den Entwurf im Browser erst nach der Antwort löscht.',
    },
    {
      name: 'reise_anlegen legt bei zweitem Aufruf keine zweite Reise an',
      rolle: 'authenticated',
      uid: NUTZER,
      sql: `select public.reise_anlegen(${reise('idem-2')});
            select public.reise_anlegen(${reise('idem-2')});
            select id from public.trips
              where user_id = '${NUTZER}' and client_ref = 'idem-2' offset 1`,
      erwartung: 'leer',
      grund:
        'Die Gegenprobe: Nach zwei Aufrufen gibt es keine zweite Zeile. `offset 1` lässt die ' +
        'erste liegen – bleibt etwas übrig, wäre die Übernahme nicht idempotent.',
    },
    {
      name: 'reise_anlegen übernimmt keine mitgeschickte user_id',
      rolle: 'authenticated',
      uid: NUTZER,
      sql: `select public.reise_anlegen(${reise('fremd-1', `,"user_id":"${ZWEITER}"`)});
            select id from public.trips
              where client_ref = 'fremd-1' and user_id = '${NUTZER}'`,
      erwartung: 'erlaubt',
      grund:
        'Die Eigentümerkennung kommt aus auth.uid(). Eine mitgeschickte user_id wird nicht ' +
        'gelesen – die Reise gehört dem Aufrufer, nicht dem genannten Konto.',
    },
    {
      name: 'reise_anlegen legt die Reise nicht beim genannten Konto an',
      rolle: 'authenticated',
      uid: NUTZER,
      sql: `select public.reise_anlegen(${reise('fremd-2', `,"user_id":"${ZWEITER}"`)});
            select id from public.trips
              where client_ref = 'fremd-2' and user_id = '${ZWEITER}'`,
      erwartung: 'leer',
      grund: 'Die Gegenprobe zum Fall darüber, gelesen als Eigentümer der behaupteten Kennung.',
    },
    {
      name: 'reise_anlegen übernimmt keinen mitgeschickten Status',
      rolle: 'authenticated',
      uid: NUTZER,
      sql: `select public.reise_anlegen(${reise('status-1', ',"status":"booked"')});
            select id from public.trips where client_ref = 'status-1' and status = 'draft'`,
      erwartung: 'erlaubt',
      grund: 'Eine neue Reise ist ein Entwurf. „booked" darf niemand über diesen Weg behaupten.',
    },
    {
      name: 'reise_anlegen lehnt eine unbekannte Interessenangabe ab',
      rolle: 'authenticated',
      uid: NUTZER,
      sql: `select public.reise_anlegen(${reise('interesse-1', ',"interests":["hacking"]')})`,
      erwartung: 'abgelehnt',
      grund: 'trips_interests_werte greift auch auf diesem Weg.',
    },
    {
      name: 'reise_anlegen lehnt eine Reise ohne Kennung ab',
      rolle: 'authenticated',
      uid: NUTZER,
      sql: `select public.reise_anlegen('{"title":"ohne Kennung"}'::jsonb)`,
      erwartung: 'abgelehnt',
      grund: 'Ohne client_ref gäbe es keine Idempotenz – die Funktion nimmt sie nicht an.',
    },
    {
      name: 'reise_anlegen lehnt zu viele Reisetage ab',
      rolle: 'authenticated',
      uid: NUTZER,
      sql: `select public.reise_anlegen(jsonb_build_object(
              'client_ref', 'viele-tage',
              'title', 'zu lang',
              'days', (select jsonb_agg(jsonb_build_object('day_index', g))
                         from generate_series(1, 367) as g)))`,
      erwartung: 'abgelehnt',
      grund: 'Die Grenze der Nutzlast liegt vor dem ersten INSERT, nicht erst im CHECK.',
    },
    {
      name: 'reise_anlegen greift bei zu vielen Reisen in kurzer Zeit',
      rolle: 'authenticated',
      uid: VIELREISEND,
      sql: `select public.reise_anlegen(${reise('schranke-1')})`,
      erwartung: 'abgelehnt',
      grund:
        'Die Missbrauchsschranke: 60 Reisen je Stunde. Dieses Konto hat sie im Aufbau ' +
        'erreicht. Sie steht seit ADR-0045 im Auslöser der Tabelle und gilt damit auch für ' +
        'den direkten Weg – die Fälle oben prüfen ihn.',
    },
    {
      name: 'reise_anlegen läuft unterhalb der Schranke',
      rolle: 'authenticated',
      uid: ZWEITER,
      sql: `select public.reise_anlegen(${reise('schranke-2')})`,
      erwartung: 'erlaubt',
      grund: 'Der positive Gegenfall zur Schranke.',
    },
  ]
}

// Je ein Konto für jede Stufe des Modells. Ohne die beiden mittleren Rollen
// blieb bis zum Nachtrag unbemerkt, dass die Policies pauschal `admin`
// verlangten, während die Anwendung ab `moderator` hereinliess.
const KONTEN = [
  { id: NUTZER, name: 'nutzer', role: 'user', status: 'active', profil: true },
  { id: ZWEITER, name: 'zweiter', role: 'user', status: 'active', profil: true },
  { id: CREATOR, name: 'creator', role: 'creator', status: 'active', profil: true },
  { id: MODERATION, name: 'moderation', role: 'moderator', status: 'active', profil: true },
  { id: BETRIEB, name: 'betrieb', role: 'operator', status: 'active', profil: true },
  { id: ADMIN, name: 'verwaltung', role: 'admin', status: 'active', profil: true },
  { id: INHABER, name: 'inhaber', role: 'owner', status: 'active', profil: true },
  { id: GESPERRT, name: 'gesperrt', role: 'user', status: 'disabled', profil: true },
  { id: VIELREISEND, name: 'vielreisend', role: 'user', status: 'active', profil: true },
  // Ein Konto ohne Profil: Nur so lässt sich das erstmalige Anlegen prüfen –
  // und der Notzugang, dessen Rolle die Datenbank gar nicht kennt.
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
    (k) => `insert into public.profiles (user_id, display_name, role, status)
            values ('${k.id}', '${k.name}', '${k.role}', '${k.status}');`,
  )

  // Je eine Zeile in den Tabellen, auf die sich die Fälle beziehen. Ohne Daten
  // wäre „0 Zeilen“ mehrdeutig: gefiltert oder schlicht leer?
  const daten = [
    // Eine vollständige Reise mit Etappe, Tag und Planpunkt, alle mit fester
    // Kennung: Die Fälle brauchen bekannte Kennungen, um eine Zeile im fremden
    // Namen anzulegen oder ein Kind an eine fremde Reise zu hängen.
    `insert into public.trips (id, user_id, client_ref, title, start_date, end_date)
       values ('${REISE}', '${NUTZER}', 'gast-1', 'Japan im Herbst', current_date, current_date + 3);`,
    `insert into public.trip_stages (id, trip_id, user_id, position, name)
       values ('${ETAPPE}', '${REISE}', '${NUTZER}', 1, 'Tokio');`,
    `insert into public.trip_days (id, trip_id, user_id, day_index, day_date)
       values ('${TAG}', '${REISE}', '${NUTZER}', 1, current_date);`,
    `insert into public.trip_items (id, trip_id, user_id, day_id, kind, title)
       values ('${PUNKT}', '${REISE}', '${NUTZER}', '${TAG}', 'activity', 'Fischmarkt');`,
    // Eine zweite Reise, die dem fremden Konto gehört. Ohne sie wäre „0 Zeilen“
    // beim Zugriff des fremden Kontos nicht von „nichts vorhanden“ zu trennen.
    `insert into public.trips (id, user_id, client_ref, title)
       values ('${FREMDE_REISE}', '${ZWEITER}', 'gast-2', 'Norwegen');`,
    // 60 Reisen innerhalb der letzten Stunde: genau die Schranke aus
    // public.reise_erzeugung_pruefen(). Der Auslöser zählt je Zeile und lässt
    // die sechzigste noch durch – die einundsechzigste ist Sache der Fälle.
    `insert into public.trips (user_id, client_ref, title)
       select '${VIELREISEND}', 'aufbau-' || g, 'Serie ' || g from generate_series(1, 60) as g;`,
    `insert into public.payments (id, status, amount_chf, created_at) values ('pay_1', 'paid', 100, now());`,
    `insert into public.refunds (payment_id, amount_chf, created_at) values ('pay_1', 10, now());`,
    `insert into public.security_events (type, ip) values ('login_failed', '203.0.113.1');`,
    `insert into public.blocked_ips (ip, reason) values ('203.0.113.2', 'Test');`,
    `insert into public.airports (iata, name, city, country) values ('ZRH', 'Zürich', 'Zürich', 'CH');`,
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
