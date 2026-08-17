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
    name: 'anon liest Stripe-Ereignisse',
    rolle: 'anon',
    sql: `select * from public.stripe_webhooks`,
    erwartung: 'abgelehnt',
    grund: 'Die Tabelle ist seit dem Nachtrag lesbar – aber erst ab der Fähigkeit betrieb-lesen.',
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
    sql: `select * from public.creator_profiles where user_id = '${NUTZER}'`,
    erwartung: 'erlaubt',
    grund: 'canManageUsers() lässt eine Moderation auf /admin/users; RLS verlangte admin.',
  },
  {
    name: 'Moderation setzt ein fremdes Konto auf creator',
    rolle: 'authenticated',
    uid: MODERATION,
    sql: `update public.creator_profiles set role = 'creator' where user_id = '${ZWEITER}'`,
    erwartung: 'erlaubt',
  },
  {
    name: 'Moderation ernennt eine Administration',
    rolle: 'authenticated',
    uid: MODERATION,
    sql: `update public.creator_profiles set role = 'admin' where user_id = '${ZWEITER}'`,
    erwartung: 'abgelehnt',
    grund: 'Der Auslöser verlangt einen echt höheren Rang als die künftige Rolle.',
  },
  {
    name: 'Creator liest fremde Profile',
    rolle: 'authenticated',
    uid: CREATOR,
    sql: `select * from public.creator_profiles where user_id = '${NUTZER}'`,
    erwartung: 'leer',
  },

  // --- Fähigkeit inhalte-moderieren (ab moderator) -------------------------
  {
    name: 'Moderation liest fremde Sitzungen',
    rolle: 'authenticated',
    uid: MODERATION,
    sql: `select * from public.creator_sessions where user_id = '${NUTZER}'`,
    erwartung: 'erlaubt',
  },
  {
    name: 'Moderation verbirgt einen fremden Blogkommentar',
    rolle: 'authenticated',
    uid: MODERATION,
    sql: `update public.blog_comments set status = 'hidden' where user_id = '${NUTZER}'`,
    erwartung: 'erlaubt',
  },
  {
    name: 'Creator liest fremde Sitzungen',
    rolle: 'authenticated',
    uid: CREATOR,
    sql: `select * from public.creator_sessions where user_id = '${NUTZER}'`,
    erwartung: 'leer',
  },

  // --- Fähigkeit konfiguration-verwalten (ab admin) ------------------------
  //
  // Für diese Tabellen gibt es keine Route. Sie bleiben bei `admin`; die Fälle
  // belegen, dass die Absenkung der übrigen Tabellen sie nicht mitgenommen hat.
  {
    name: 'Administration liest das DNS-Protokoll',
    rolle: 'authenticated',
    uid: ADMIN,
    sql: `select * from public.dns_audit_events`,
    erwartung: 'erlaubt',
  },
  {
    name: 'Betrieb liest das DNS-Protokoll',
    rolle: 'authenticated',
    uid: BETRIEB,
    sql: `select * from public.dns_audit_events`,
    erwartung: 'leer',
  },
  {
    name: 'Betrieb legt ein Postfach an',
    rolle: 'authenticated',
    uid: BETRIEB,
    sql: `insert into public.admin_email_boxes (domain, address) values ('jetnity.com', 'x@jetnity.com')`,
    erwartung: 'abgelehnt',
  },
  {
    name: 'Administration legt ein Postfach an',
    rolle: 'authenticated',
    uid: ADMIN,
    sql: `insert into public.admin_email_boxes (domain, address) values ('jetnity.com', 'y@jetnity.com')`,
    erwartung: 'erlaubt',
  },

  // --- Notzugang erteilt keine Datenbankrechte -----------------------------
  //
  // `ADMIN_ALLOWED_EMAILS` öffnet die Oberfläche. Die Datenbank kennt die
  // Liste nicht und soll sie nicht kennen (ADR-0035). Für die Datenbank ist
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
    sql: `select * from public.creator_profiles`,
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
]

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
    `insert into public.dns_audit_events (domain, actor, mode) values ('jetnity.com', 'test', 'plan');`,
    `insert into public.admin_email_boxes (domain, address) values ('jetnity.com', 'info@jetnity.com');`,
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
