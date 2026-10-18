// R76: Reise-Eigentum nativ durch PostgreSQL erzwungen – trips und trip_stages.
//
// Eigener Wegwerf-Cluster aus startLocalProofCluster() (mkdtemp, Socket 0700,
// listen_addresses='', --auth-host=reject, PG*-freie Umgebung). Kein TCP, kein
// Hosted-Ziel, keine Zugangsdaten, keine echten Konten, nur synthetische Zeilen.
//
// Angewandt wird die unveränderte Original-Migration 20260817120000_reiseschema.sql,
// bytegenau über stdin, nach einem minimalen test-only Unterbau
// (scripts/db/trip-ownership-native-rls-1/bootstrap.sql). Jede Probe läuft als
// Login-Rolle `authenticator` mit `set local role authenticated|anon` und festem
// JWT-Claim in einer eigenen Transaktion, die zurückgerollt wird.
//
// Dieselbe Matrix läuft zusätzlich gegen absichtlich geöffnete Wegwerf-Mutanten
// und muss dort Verstösse melden. Eine Matrix, die auch dort grün bleibt, misst
// sich selbst.

import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join, resolve } from 'node:path'
import { after, before, describe, test } from 'node:test'
import { isDeepStrictEqual } from 'node:util'

import {
  assertLocalProofEnvironment,
  assertOwnedLocalProofCluster,
  findLocalPgBins,
  startLocalProofCluster,
  type LocalPgBins,
  type LocalProofCluster,
} from '../../scripts/db/official-truth-integrated-pilot-1/local-cluster'

const REPO = resolve(process.cwd())
const MIGRATIONEN = join(REPO, 'supabase/migrations')
const MIGRATION_NAME = '20260817120000_reiseschema.sql'
const MIGRATION = join(MIGRATIONEN, MIGRATION_NAME)
const MIGRATION_BLOB = '37bb78ddb919b16bd4cd8e00b0a1445a9718c4ba'
const BOOTSTRAP = join(REPO, 'scripts/db/trip-ownership-native-rls-1/bootstrap.sql')
const BINS = findLocalPgBins()
const IN_CI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true'
const SKIP =
  BINS || IN_CI
    ? false
    : 'NOT VERIFIED auf diesem Rechner: keine lokalen PostgreSQL-Server-Binaries (initdb, pg_ctl, postgres, psql). Kein Hosted-Fallback, kein Mock. In CI Pflicht.'
const DB = 'r76_reise'
const ZEIT = { timeout: 180_000 }

// Erfundene Identitäten. Keine davon existiert ausserhalb dieses Clusters.
const KONTO = { A: 'a0000000-0000-4000-8000-00000000000a', B: 'b0000000-0000-4000-8000-00000000000b' } as const
const DRITTE_UID = 'c0000000-0000-4000-8000-00000000000c'
const REISE = {
  A: { kind: 'a1000000-0000-4000-8000-000000000001', leer: 'a2000000-0000-4000-8000-000000000002' },
  B: { kind: 'b1000000-0000-4000-8000-000000000001', leer: 'b2000000-0000-4000-8000-000000000002' },
} as const
const ETAPPE = { A: 'a3000000-0000-4000-8000-000000000003', B: 'b3000000-0000-4000-8000-000000000003' } as const
const NEUE_REISE = 'e1000000-0000-4000-8000-000000000001'
const NEUE_ETAPPE = 'e2000000-0000-4000-8000-000000000002'

const LABEL = new Map<string, string>([
  [KONTO.A, 'konto-A'], [KONTO.B, 'konto-B'], [DRITTE_UID, 'uid-C'],
  [REISE.A.kind, 'reise-A-mit-etappe'], [REISE.A.leer, 'reise-A-ohne-etappe'],
  [REISE.B.kind, 'reise-B-mit-etappe'], [REISE.B.leer, 'reise-B-ohne-etappe'],
  [ETAPPE.A, 'etappe-A'], [ETAPPE.B, 'etappe-B'], [NEUE_REISE, 'neue-reise'], [NEUE_ETAPPE, 'neue-etappe'],
])

function lesbar(wert: unknown): string {
  let text = JSON.stringify(wert)
  for (const [uuid, label] of LABEL) text = text.replaceAll(uuid, label)
  return text
}

const SEED_SQL = `
begin;
insert into auth.users (id) values ('${KONTO.A}'), ('${KONTO.B}');
insert into public.trips (id, user_id, title) values
  ('${REISE.A.kind}', '${KONTO.A}', 'R76 synthetische Reise A mit Etappe'),
  ('${REISE.A.leer}', '${KONTO.A}', 'R76 synthetische Reise A ohne Etappe'),
  ('${REISE.B.kind}', '${KONTO.B}', 'R76 synthetische Reise B mit Etappe'),
  ('${REISE.B.leer}', '${KONTO.B}', 'R76 synthetische Reise B ohne Etappe');
insert into public.trip_stages (id, trip_id, user_id, name) values
  ('${ETAPPE.A}', '${REISE.A.kind}', '${KONTO.A}', 'R76 synthetische Etappe A'),
  ('${ETAPPE.B}', '${REISE.B.kind}', '${KONTO.B}', 'R76 synthetische Etappe B');
commit;
`

const ERWARTETE_BELEGUNG = {
  reisen: [
    { id: REISE.A.kind, user_id: KONTO.A }, { id: REISE.A.leer, user_id: KONTO.A },
    { id: REISE.B.kind, user_id: KONTO.B }, { id: REISE.B.leer, user_id: KONTO.B },
  ],
  etappen: [
    { id: ETAPPE.A, trip_id: REISE.A.kind, user_id: KONTO.A },
    { id: ETAPPE.B, trip_id: REISE.B.kind, user_id: KONTO.B },
  ],
  tage: 0,
  punkte: 0,
}

// Vollständiger Fingerabdruck beider Tabellen, gelesen vom Cluster-Superuser.
const ZUSTAND_SQL = `select json_build_object(
  'reisen', (select coalesce(json_agg(json_build_object('id', id, 'user_id', user_id) order by id), '[]'::json) from public.trips),
  'etappen', (select coalesce(json_agg(json_build_object('id', id, 'trip_id', trip_id, 'user_id', user_id) order by id), '[]'::json) from public.trip_stages),
  'tage', (select count(*) from public.trip_days),
  'punkte', (select count(*) from public.trip_items),
  'fingerabdruck', md5(
    coalesce((select string_agg(to_jsonb(t)::text, '|' order by t.id) from public.trips t), '') || '#' ||
    coalesce((select string_agg(to_jsonb(s)::text, '|' order by s.id) from public.trip_stages s), ''))
)::text;`

const KATALOG_SQL = `select json_build_object(
  'rollen', (select json_object_agg(rolname, json_build_object('super', rolsuper, 'bypass', rolbypassrls, 'login', rolcanlogin, 'inherit', rolinherit))
    from pg_roles where rolname in ('anon', 'authenticated', 'service_role', 'authenticator', 'postgres')),
  'mitgliedschaft', json_build_object(
    'authenticatorAnon', pg_has_role('authenticator', 'anon', 'MEMBER'),
    'authenticatorAuthenticated', pg_has_role('authenticator', 'authenticated', 'MEMBER'),
    'authenticatorServiceRole', pg_has_role('authenticator', 'service_role', 'MEMBER'),
    'authenticatorPostgres', pg_has_role('authenticator', 'postgres', 'MEMBER'),
    'authenticatedPostgres', pg_has_role('authenticated', 'postgres', 'MEMBER'),
    'authenticatedServiceRole', pg_has_role('authenticated', 'service_role', 'MEMBER')),
  'tabellen', (select json_object_agg(c.relname, json_build_object('rls', c.relrowsecurity, 'force', c.relforcerowsecurity, 'eigentuemer', pg_get_userbyid(c.relowner)))
    from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relname in ('trips', 'trip_stages')),
  'rechte', (select json_object_agg(r || ':' || t || ':' || p, has_table_privilege(r, 'public.' || t, p))
    from unnest(array['anon', 'authenticated']) r, unnest(array['trips', 'trip_stages']) t,
      unnest(array['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER']) p),
  'policies', (select coalesce(json_agg(json_build_object('tabelle', tablename, 'name', policyname, 'befehl', cmd, 'rollen', roles,
      'art', permissive, 'using', qual, 'check', with_check) order by tablename, policyname), '[]'::json)
    from pg_policies where schemaname = 'public' and tablename in ('trips', 'trip_stages'))
)::text;`

type Zustand = { reisen: unknown[]; etappen: unknown[]; tage: number; punkte: number; fingerabdruck: string }
type Kontext = {
  phase: string; rolle: string; sitzung: string; uid: string | null; rowSecurity: string
  rolleSuper: boolean; rolleBypass: boolean; sitzungSuper: boolean; sitzungBypass: boolean
}
type Ergebnis =
  | { klasse: 'ok'; zeilen: number; rueckgabe: unknown[] | null }
  | { klasse: 'fehler'; sqlstate: string; meldung: string }
type Grund = 'rechte' | 'rls'
type Erwartung =
  | { klasse: 'ok'; zeilen: number; rueckgabe?: unknown[] }
  | { klasse: 'fehler'; sqlstate: string; grund?: Grund }
type Probe = {
  id: string
  rolle: 'authenticated' | 'anon'
  claims: Record<string, string> | null
  uid: string | null
  // anzahl: GET DIAGNOSTICS ROW_COUNT der letzten Anweisung, ohne RETURNING.
  // zeilen: SELECT oder DML … RETURNING, Rückgabe als JSON.
  art: 'anzahl' | 'zeilen'
  sql: string
  erwartet: Erwartung
}
type Befund = { id: string; ok: boolean; erwartet: unknown; beobachtet: unknown }
type Lauf = { probe: Probe; vorher: Kontext; ergebnis: Ergebnis; nachher: Kontext }

const ok = (zeilen: number, rueckgabe?: unknown[]): Erwartung => ({ klasse: 'ok', zeilen, rueckgabe })
const verweigert = (sqlstate: string, grund?: Grund): Erwartung => ({ klasse: 'fehler', sqlstate, grund })
const ids = (...werte: string[]) => [...werte].sort().map((id) => ({ id }))

function grundAus(meldung: string): Grund | 'anders' {
  if (meldung.startsWith('permission denied')) return 'rechte'
  if (/row-level security/.test(meldung)) return 'rls'
  return 'anders'
}

function als(konto: 'A' | 'B') {
  return { rolle: 'authenticated' as const, claims: { sub: KONTO[konto], role: 'authenticated' }, uid: KONTO[konto] }
}

function proben(): Probe[] {
  const liste: Probe[] = []
  for (const [ich, fremd] of [['A', 'B'], ['B', 'A']] as const) {
    const r = `·${ich}→${fremd}`
    const wer = als(ich)
    const eigen = REISE[ich], anders = REISE[fremd]
    const p = (id: string, art: Probe['art'], sql: string, erwartet: Erwartung) => liste.push({ id: `${id}${r}`, ...wer, art, sql, erwartet })

    p('T02.eigene-reisen-ohne-filter', 'zeilen', 'select id from public.trips', ok(2, ids(eigen.kind, eigen.leer)))
    p('T02.fremde-reisen-direkt', 'zeilen', `select id from public.trips where id in ('${anders.kind}', '${anders.leer}')`, ok(0, []))
    p('T02.eigene-etappen-ohne-filter', 'zeilen', 'select id from public.trip_stages', ok(1, ids(ETAPPE[ich])))

    p('T03.fremde-reise-aendern', 'anzahl', `update public.trips set title = 'R76 fremd geaendert' where id = '${anders.kind}'`, ok(0))
    p('T03.fremde-reise-ohne-etappe-aendern', 'anzahl', `update public.trips set budget_amount = 1 where id = '${anders.leer}'`, ok(0))
    p('T03.aendern-ohne-filter-trifft-nur-eigene', 'anzahl', 'update public.trips set travellers = 2', ok(2))

    p('T04.fremde-reise-loeschen', 'anzahl', `delete from public.trips where id = '${anders.kind}'`, ok(0))
    p('T04.fremde-reise-ohne-etappe-loeschen', 'anzahl', `delete from public.trips where id = '${anders.leer}'`, ok(0))
    p('T04.loeschen-ohne-filter-trifft-nur-eigene', 'anzahl', 'delete from public.trips', ok(2))

    p('T05.reise-mit-fremdem-eigentuemer-anlegen', 'anzahl',
      `insert into public.trips (id, user_id, title) values ('${NEUE_REISE}', '${KONTO[fremd]}', 'R76 untergeschoben')`, verweigert('42501', 'rls'))
    p('T05.upsert-auf-fremde-reise', 'anzahl',
      `insert into public.trips (id, title) values ('${anders.kind}', 'R76 upsert') on conflict (id) do update set title = excluded.title`, verweigert('42501', 'rls'))
    // Dokumentiert, nicht erwünscht: Der Primärschlüssel ist tabellenweit eindeutig,
    // RLS verbirgt die Kollision nicht. Nur mit bekannter fremder UUID auslösbar.
    p('T05.anlegen-mit-fremder-reise-id-kollidiert', 'anzahl',
      `insert into public.trips (id, title) values ('${anders.kind}', 'R76 kollision')`, verweigert('23505'))

    p('T06.eigene-reise-aendern', 'anzahl', `update public.trips set title = 'R76 eigene Aenderung' where id = '${eigen.kind}'`, ok(1))
    p('T06.eigene-reise-aendern-returning', 'zeilen',
      `update public.trips set title = 'R76 eigene Aenderung' where id = '${eigen.leer}' returning id, user_id`, ok(1, [{ id: eigen.leer, user_id: KONTO[ich] }]))
    p('T06.eigene-reise-anlegen', 'zeilen',
      `insert into public.trips (id, title) values ('${NEUE_REISE}', 'R76 eigene neue Reise') returning id, user_id`, ok(1, [{ id: NEUE_REISE, user_id: KONTO[ich] }]))
    p('T06.eigene-reise-loeschen-mit-etappe', 'anzahl', `delete from public.trips where id = '${eigen.kind}'`, ok(1))
    p('T06.eigene-etappe-aendern', 'anzahl', `update public.trip_stages set name = 'R76 eigene Etappe' where id = '${ETAPPE[ich]}'`, ok(1))
    p('T06.eigene-etappe-anlegen', 'anzahl',
      `insert into public.trip_stages (id, trip_id, name) values ('${NEUE_ETAPPE}', '${eigen.leer}', 'R76 eigene neue Etappe')`, ok(1))

    p('T07.eigene-reise-ohne-etappe-uebertragen', 'anzahl',
      `update public.trips set user_id = '${KONTO[fremd]}' where id = '${eigen.leer}'`, verweigert('42501', 'rls'))
    p('T07.eigene-reise-mit-etappe-uebertragen', 'anzahl',
      `update public.trips set user_id = '${KONTO[fremd]}' where id = '${eigen.kind}'`, verweigert('42501', 'rls'))
    // Ohne WHERE und ohne RETURNING braucht das UPDATE kein SELECT-Recht; damit
    // greift allein die UPDATE-Policy. Die eigene Etappe wird vorher entfernt,
    // damit der zusammengesetzte Fremdschlüssel die Policy nicht verdeckt.
    p('T07.uebertragen-nur-update-policy', 'anzahl',
      `delete from public.trip_stages where trip_id = '${eigen.kind}'; update public.trips set user_id = '${KONTO[fremd]}'`, verweigert('42501', 'rls'))

    p('T08.fremde-etappe-lesen', 'zeilen',
      `select id from public.trip_stages where id = '${ETAPPE[fremd]}' or trip_id = '${anders.kind}'`, ok(0, []))
    p('T08.fremde-etappe-aendern', 'anzahl', `update public.trip_stages set name = 'R76 fremd' where id = '${ETAPPE[fremd]}'`, ok(0))
    p('T08.fremde-etappe-loeschen', 'anzahl', `delete from public.trip_stages where id = '${ETAPPE[fremd]}'`, ok(0))
    p('T08.etappe-mit-fremdem-eigentuemer-anlegen', 'anzahl',
      `insert into public.trip_stages (id, trip_id, user_id, name) values ('${NEUE_ETAPPE}', '${anders.kind}', '${KONTO[fremd]}', 'R76 untergeschoben')`,
      verweigert('42501', 'rls'))
    p('T08.etappe-an-fremde-reise-haengen', 'anzahl',
      `insert into public.trip_stages (id, trip_id, name) values ('${NEUE_ETAPPE}', '${anders.kind}', 'R76 fremd angehaengt')`, verweigert('23503'))
    p('T08.eigene-etappe-an-fremde-reise-umhaengen', 'anzahl',
      `update public.trip_stages set trip_id = '${anders.kind}' where id = '${ETAPPE[ich]}'`, verweigert('23503'))
    p('T08.eigene-etappe-fremdem-eigentuemer-geben', 'anzahl',
      `update public.trip_stages set user_id = '${KONTO[fremd]}' where id = '${ETAPPE[ich]}'`, verweigert('42501', 'rls'))
  }

  liste.push({ id: 'T01.andere-uid-ohne-konto', rolle: 'authenticated', claims: { sub: DRITTE_UID, role: 'authenticated' }, uid: DRITTE_UID,
    art: 'zeilen', sql: 'select id from public.trips', erwartet: ok(0, []) })

  const anon = { rolle: 'anon' as const, claims: null, uid: null }
  const ohneClaims = { rolle: 'authenticated' as const, claims: null, uid: null }
  const ohneSub = { rolle: 'authenticated' as const, claims: { role: 'authenticated' }, uid: null }
  liste.push(
    { id: 'T09.anon-reisen-lesen', ...anon, art: 'zeilen', sql: 'select id from public.trips', erwartet: verweigert('42501', 'rechte') },
    { id: 'T09.anon-etappen-lesen', ...anon, art: 'zeilen', sql: 'select id from public.trip_stages', erwartet: verweigert('42501', 'rechte') },
    { id: 'T09.anon-mit-sub-claim-lesen', rolle: 'anon', claims: { sub: KONTO.A, role: 'anon' }, uid: KONTO.A,
      art: 'zeilen', sql: 'select id from public.trips', erwartet: verweigert('42501', 'rechte') },
    { id: 'T09.anon-anlegen', ...anon, art: 'anzahl',
      sql: `insert into public.trips (id, user_id, title) values ('${NEUE_REISE}', '${KONTO.A}', 'R76 anon')`, erwartet: verweigert('42501', 'rechte') },
    { id: 'T09.anon-aendern', ...anon, art: 'anzahl', sql: `update public.trips set title = 'R76 anon' where id = '${REISE.A.kind}'`, erwartet: verweigert('42501', 'rechte') },
    { id: 'T09.anon-loeschen', ...anon, art: 'anzahl', sql: `delete from public.trips where id = '${REISE.B.kind}'`, erwartet: verweigert('42501', 'rechte') },
    { id: 'T09.ohne-claims-reisen-lesen', ...ohneClaims, art: 'zeilen', sql: 'select id from public.trips', erwartet: ok(0, []) },
    { id: 'T09.ohne-claims-etappen-lesen', ...ohneClaims, art: 'zeilen', sql: 'select id from public.trip_stages', erwartet: ok(0, []) },
    { id: 'T09.ohne-claims-aendern', ...ohneClaims, art: 'anzahl', sql: "update public.trips set title = 'R76 ohne claims'", erwartet: ok(0) },
    { id: 'T09.ohne-claims-loeschen', ...ohneClaims, art: 'anzahl', sql: 'delete from public.trips', erwartet: ok(0) },
    { id: 'T09.ohne-claims-anlegen', ...ohneClaims, art: 'anzahl',
      sql: `insert into public.trips (id, title) values ('${NEUE_REISE}', 'R76 ohne claims')`, erwartet: verweigert('42501', 'rls') },
    { id: 'T09.ohne-claims-fuer-fremd-anlegen', ...ohneClaims, art: 'anzahl',
      sql: `insert into public.trips (id, user_id, title) values ('${NEUE_REISE}', '${KONTO.B}', 'R76 ohne claims')`, erwartet: verweigert('42501', 'rls') },
    { id: 'T09.claim-ohne-sub-lesen', ...ohneSub, art: 'zeilen', sql: 'select id from public.trips', erwartet: ok(0, []) },
  )
  return liste
}

function probeSkript(p: Probe): string {
  const kontext = (phase: 'vorher' | 'nachher') =>
    `select json_build_object('art', 'kontext', 'phase', '${phase}', 'rolle', current_user, 'sitzung', session_user, 'uid', auth.uid(),
      'rowSecurity', current_setting('row_security'), 'rolleSuper', r.rolsuper, 'rolleBypass', r.rolbypassrls,
      'sitzungSuper', s.rolsuper, 'sitzungBypass', s.rolbypassrls)::text
    from pg_roles r, pg_roles s where r.rolname = current_user and s.rolname = session_user;`
  const koerper = p.art === 'anzahl'
    ? `${p.sql};\n  get diagnostics n = row_count;`
    : `with z as (${p.sql}) select coalesce(jsonb_agg(to_jsonb(z) order by z.id::text), '[]'::jsonb) into rueckgabe from z;\n  n := jsonb_array_length(rueckgabe);`
  return [
    'begin;',
    `set local role ${p.rolle};`,
    p.claims ? `set local request.jwt.claims = '${JSON.stringify(p.claims)}';` : '',
    kontext('vorher'),
    `do $r76$
declare
  n bigint;
  rueckgabe jsonb;
begin
  ${koerper}
  perform set_config('r76.ergebnis', jsonb_build_object('klasse', 'ok', 'zeilen', n, 'rueckgabe', rueckgabe)::text, true);
exception when others then
  perform set_config('r76.ergebnis', jsonb_build_object('klasse', 'fehler', 'sqlstate', sqlstate, 'meldung', sqlerrm)::text, true);
end
$r76$;`,
    `select json_build_object('art', 'ergebnis', 'wert', current_setting('r76.ergebnis', true)::jsonb)::text;`,
    kontext('nachher'),
    'rollback;',
  ].join('\n')
}

function ergebnisNormal(e: Ergebnis): unknown {
  return e.klasse === 'ok'
    ? { klasse: 'ok', zeilen: e.zeilen, rueckgabe: e.rueckgabe }
    : { klasse: 'fehler', sqlstate: e.sqlstate, grund: grundAus(e.meldung), meldung: e.meldung }
}

function ergebnisPasst(e: Erwartung, b: Ergebnis): boolean {
  if (e.klasse === 'ok' && b.klasse === 'ok') {
    return b.zeilen === e.zeilen && (e.rueckgabe === undefined || isDeepStrictEqual(b.rueckgabe, e.rueckgabe))
  }
  if (e.klasse === 'fehler' && b.klasse === 'fehler') {
    return b.sqlstate === e.sqlstate && (e.grund === undefined || grundAus(b.meldung) === e.grund)
  }
  return false
}

const AUSDRUCK_EIGENTUM = /^\(user_id = \( ?SELECT auth\.uid\(\) AS uid\)\)$/

function erwarteterKatalog() {
  const rolle = (login: boolean) => ({ super: false, bypass: false, login, inherit: false })
  const rechte: Record<string, boolean> = {}
  for (const r of ['anon', 'authenticated']) {
    for (const t of ['trips', 'trip_stages']) {
      for (const p of ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER']) {
        rechte[`${r}:${t}:${p}`] = r === 'authenticated' && ['SELECT', 'INSERT', 'UPDATE', 'DELETE'].includes(p)
      }
    }
  }
  const policies = (['trip_stages', 'trips'] as const).flatMap((t) => [
    { tabelle: t, name: `${t}_aendern`, befehl: 'UPDATE', using: 'eigentum', check: 'eigentum' },
    { tabelle: t, name: `${t}_anlegen`, befehl: 'INSERT', using: null, check: 'eigentum' },
    { tabelle: t, name: `${t}_lesen`, befehl: 'SELECT', using: 'eigentum', check: null },
    { tabelle: t, name: `${t}_loeschen`, befehl: 'DELETE', using: 'eigentum', check: null },
  ].map((x) => ({ ...x, rollen: ['authenticated'], art: 'PERMISSIVE' })))
  return {
    rollen: { anon: rolle(false), authenticated: rolle(false), service_role: rolle(false), authenticator: rolle(true), postgres: rolle(false) },
    mitgliedschaft: {
      authenticatorAnon: true, authenticatorAuthenticated: true, authenticatorServiceRole: false,
      authenticatorPostgres: false, authenticatedPostgres: false, authenticatedServiceRole: false,
    },
    tabellen: { trips: { rls: true, force: false, eigentuemer: 'postgres' }, trip_stages: { rls: true, force: false, eigentuemer: 'postgres' } },
    rechte,
    policies,
  }
}

function gitBlob(bytes: Buffer): string {
  return createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex')
}

function originalMigration(): Buffer {
  const bytes = readFileSync(MIGRATION)
  assert.equal(gitBlob(bytes), MIGRATION_BLOB, 'Original-Migration ist nicht mehr der geprüfte Blob')
  return bytes
}

// Statische Gegenprobe: Spätere Migrationen dürfen den hier geprüften Vertrag
// nicht verändern, sonst bewiese die Original-Migration allein nichts mehr.
function vertragsanweisungen(sql: string, tabellenregeln: boolean): string[] {
  const tabelle = /^"?(public"?\.)?"?(trips|trip_stages)"?$/i
  const treffer: string[] = []
  for (const roh of sql.replace(/--[^\n]*/g, '').split(';')) {
    const s = roh.replace(/\s+/g, ' ').trim()
    const melden = () => treffer.push(s.slice(0, 200))
    // Rollenrechte: niemand darf authenticated/anon eine stärkere Rolle oder BYPASSRLS geben.
    if (/^grant (?![\s\S]* on )[\s\S]* to "?(authenticated|anon|authenticator)"?\b/i.test(s)) melden()
    else if (/^alter role "?(authenticated|anon|authenticator)"? .*\b(bypassrls|superuser)\b/i.test(s)) melden()
    if (!tabellenregeln) continue
    const policy = /^(create|alter|drop) policy (if exists )?("[^"]+"|\S+) on (\S+)/i.exec(s)
    const recht = /^(grant|revoke) .*? on (table )?(.+?) (to|from) /i.exec(s)
    if (policy && tabelle.test(policy[4]!)) melden()
    else if (recht && !/^(function|procedure|routine|schema|sequence|all functions|all sequences)\b/i.test(recht[3]!)) {
      const ziele = recht[3]!.split(',').map((x) => x.trim())
      if (ziele.some((z) => tabelle.test(z)) || /all tables in schema public/i.test(recht[3]!)) melden()
    } else if (/^alter table (if exists )?(only )?"?(public"?\.)?"?(trips|trip_stages)"? .*\b(row level security|owner to|rename to)\b/i.test(s)) melden()
    else if (/^drop table .*\b(public\.)?(trips|trip_stages)\b(?!_)/i.test(s)) melden()
  }
  return treffer
}

function vertragsaenderungen(): string[] {
  const alle = readdirSync(MIGRATIONEN).filter((name) => name.endsWith('.sql')).sort()
  assert.ok(alle.some((name) => name > MIGRATION_NAME), 'keine späteren Migrationen gefunden')
  return alle.flatMap((name) =>
    vertragsanweisungen(readFileSync(join(MIGRATIONEN, name), 'utf8'), name > MIGRATION_NAME).map((s) => `${name}: ${s}`))
}

test('R76 Original-Migration: Git-Blob unverändert, enthält den geprüften Policy-Satz', () => {
  const bytes = originalMigration()
  const text = bytes.toString('utf8')
  for (const t of ['trips', 'trip_stages']) {
    for (const name of ['lesen', 'anlegen', 'aendern', 'loeschen']) assert.match(text, new RegExp(`create policy ${t}_${name} on public\\.${t}\\b`))
    assert.match(text, new RegExp(`alter table public\\.${t}\\s+enable row level security;`))
    assert.match(text, new RegExp(`grant select, insert, update, delete on table public\\.${t}\\s+to authenticated;`))
  }
})

test('R76 Source-Parität: keine spätere Migration ändert Policies, Tabellenrechte, RLS-Schalter oder Eigentümer von trips/trip_stages', (t) => {
  // Gegenprobe des Scanners: auf die Original-Migration angewandt erkennt er
  // alle acht Policies, beide Grants und beide RLS-Schalter.
  assert.equal(vertragsanweisungen(originalMigration().toString('utf8'), true).length, 12, 'Scanner erkennt den Vertrag nicht')
  const treffer = vertragsaenderungen()
  t.diagnostic(`geprüft: alle Migrationen; Treffer: ${treffer.length}`)
  assert.deepEqual(treffer, [])
})

test('R76 Vertrauensgrenze: fremde Verbindungsvariablen und -argumente werden vor jeder Verbindung abgelehnt', () => {
  for (const env of [{ DATABASE_URL: 'x' }, { PGHOST: 'x' }, { PGPASSWORD: 'x' }, { POSTGRES_URL: 'x' }, { SUPABASE_DB_URL: 'x' }, { SUPABASE_DB_PASSWORD: 'x' }, { JETNITY_DEV_DB: 'x' }]) {
    assert.throws(() => assertLocalProofEnvironment(env, []), /local_proof_connection_override_forbidden/)
  }
  for (const arg of ['postgres://h/db', 'postgresql://h/db', '--host=h', '--port=5432', 'db.example.supabase.co']) {
    assert.throws(() => assertLocalProofEnvironment({}, [arg]), /local_proof_connection_argument_forbidden/)
  }
  assert.doesNotThrow(() => assertLocalProofEnvironment({ PATH: '/usr/bin' }, ['node', '--test']))
})

describe('R76 nativ: Reise-Eigentum in trips/trip_stages im eigenen Wegwerf-Cluster', { skip: SKIP }, () => {
  let cluster: LocalProofCluster
  let bins: LocalPgBins
  let umgebung: NodeJS.ProcessEnv
  let seed: Zustand
  let befunde: Befund[] = []
  let laeufe: Lauf[] = []
  const alleProben = proben()

  function psql(db: string, benutzer: 'eigentuemer' | 'authenticator', eingabe: string | Buffer | null, extra: string[] = []): string[] {
    assertLocalProofEnvironment()
    assertOwnedLocalProofCluster(cluster)
    const user = benutzer === 'eigentuemer' ? cluster.user : 'authenticator'
    return execFileSync(
      bins.psql,
      [
        '--no-psqlrc', '--quiet', '--no-align', '--tuples-only', '--set=ON_ERROR_STOP=1',
        `--dbname=host=${cluster.socket} port=${cluster.port} dbname=${db} user=${user}`,
        ...extra,
      ],
      { input: eingabe ?? '', env: umgebung, encoding: 'utf8', timeout: 30_000, stdio: ['pipe', 'pipe', 'pipe'] },
    ).split('\n').filter((zeile) => zeile !== '')
  }

  const admin = (sql: string, db = DB) => psql(db, 'eigentuemer', sql)
  const einJson = <T>(zeilen: string[]): T => {
    assert.equal(zeilen.length, 1, `genau eine Zeile erwartet: ${lesbar(zeilen)}`)
    return JSON.parse(zeilen[0]!) as T
  }
  const zustand = (db = DB) => einJson<Zustand>(admin(ZUSTAND_SQL, db))

  function datenbankAufbauen(db: string): Zustand {
    admin(`create database ${db} template template0 encoding 'UTF8';`, 'postgres')
    psql(db, 'eigentuemer', null, ['--single-transaction', `--file=${BOOTSTRAP}`])
    psql(db, 'eigentuemer', originalMigration(), ['--single-transaction', '--command=set role postgres', '--file=-'])
    admin(SEED_SQL, db)
    return zustand(db)
  }

  function probeAusfuehren(db: string, p: Probe): Lauf {
    const zeilen = psql(db, 'authenticator', probeSkript(p)).map((z) => JSON.parse(z) as Record<string, unknown>)
    assert.deepEqual(zeilen.map((z) => z.art), ['kontext', 'ergebnis', 'kontext'], `Probe ${p.id}: unerwartete Ausgabe ${lesbar(zeilen)}`)
    const kontext = (z: Record<string, unknown>) => Object.fromEntries(Object.entries(z).filter(([k]) => k !== 'art')) as Kontext
    return { probe: p, vorher: kontext(zeilen[0]!), ergebnis: zeilen[1]!.wert as Ergebnis, nachher: kontext(zeilen[2]!) }
  }

  function matrix(db: string, zustandJeProbe: boolean, ausgang: Zustand): { befunde: Befund[]; laeufe: Lauf[] } {
    const b: Befund[] = []
    const l: Lauf[] = []
    const pruefen = (id: string, erwartet: unknown, beobachtet: unknown) => b.push({ id, ok: isDeepStrictEqual(erwartet, beobachtet), erwartet, beobachtet })

    const katalog = einJson<Record<string, unknown>>(admin(KATALOG_SQL, db))
    const soll = erwarteterKatalog()
    pruefen('T01.katalog.rollen', soll.rollen, katalog.rollen)
    pruefen('T01.katalog.mitgliedschaft', soll.mitgliedschaft, katalog.mitgliedschaft)
    pruefen('T01.katalog.tabellen', soll.tabellen, katalog.tabellen)
    pruefen('T01.katalog.rechte', soll.rechte, katalog.rechte)
    const policies = (katalog.policies as Record<string, unknown>[]).map((x) => ({
      ...x,
      using: typeof x.using === 'string' && AUSDRUCK_EIGENTUM.test(x.using) ? 'eigentum' : x.using,
      check: typeof x.check === 'string' && AUSDRUCK_EIGENTUM.test(x.check) ? 'eigentum' : x.check,
    }))
    const reihenfolge = ['tabelle', 'name', 'befehl', 'rollen', 'art', 'using', 'check']
    const ordnen = (x: Record<string, unknown>) => Object.fromEntries(reihenfolge.map((k) => [k, x[k]]))
    pruefen('T01.katalog.policies', soll.policies.map(ordnen), policies.map(ordnen))

    const belegung = (z: Zustand) => ({ reisen: z.reisen, etappen: z.etappen, tage: z.tage, punkte: z.punkte })
    pruefen('T02.vorbedingung.fremde-zeilen-vorhanden', ERWARTETE_BELEGUNG, belegung(ausgang))

    for (const p of alleProben) {
      if (zustandJeProbe) pruefen(`T10.zustand:${p.id}:vorher`, ausgang, zustand(db))
      const lauf = probeAusfuehren(db, p)
      l.push(lauf)
      const kontextSoll = (phase: string) => ({
        phase, rolle: p.rolle, sitzung: 'authenticator', uid: p.uid, rowSecurity: 'on',
        rolleSuper: false, rolleBypass: false, sitzungSuper: false, sitzungBypass: false,
      })
      pruefen(`T01.kontext:${p.id}:vorher`, kontextSoll('vorher'), lauf.vorher)
      pruefen(`T01.kontext:${p.id}:nachher`, kontextSoll('nachher'), lauf.nachher)
      b.push({ id: p.id, ok: ergebnisPasst(p.erwartet, lauf.ergebnis), erwartet: p.erwartet, beobachtet: ergebnisNormal(lauf.ergebnis) })
      if (zustandJeProbe) pruefen(`T10.zustand:${p.id}:nachher`, ausgang, zustand(db))
    }
    pruefen('T10.rollback-gesamt', ausgang, zustand(db))
    return { befunde: b, laeufe: l }
  }

  function gruppe(praefix: string, mindestens: number, t: { diagnostic(text: string): void }) {
    const auswahl = befunde.filter((x) => x.id.startsWith(praefix))
    assert.ok(auswahl.length >= mindestens, `${praefix}: nur ${auswahl.length} Befunde, mindestens ${mindestens} erwartet`)
    for (const x of auswahl.filter((y) => !y.id.includes(':'))) {
      const lauf = laeufe.find((y) => y.probe.id === x.id)
      t.diagnostic(lesbar({ probe: x.id, ok: x.ok, rolle: lauf?.vorher.rolle, uid: lauf?.vorher.uid, beobachtet: x.beobachtet }))
    }
    const fehler = auswahl.filter((x) => !x.ok)
    assert.deepEqual(fehler.map((x) => lesbar(x)), [], `${praefix}: Verstösse`)
  }

  const beideRichtungen = (praefix: string) => {
    const idsInGruppe = alleProben.filter((p) => p.id.startsWith(praefix)).map((p) => p.id)
    assert.ok(idsInGruppe.some((id) => id.endsWith('·A→B')) && idsInGruppe.some((id) => id.endsWith('·B→A')), `${praefix}: nicht in beiden Richtungen`)
  }

  before(() => {
    assertLocalProofEnvironment()
    cluster = startLocalProofCluster()
    bins = findLocalPgBins()!
    umgebung = {
      PATH: '/usr/bin:/bin', HOME: cluster.root, LANG: 'C.UTF-8', LC_ALL: 'C.UTF-8',
      PGPASSFILE: '/dev/null', PGSERVICEFILE: '/dev/null', PSQLRC: '/dev/null', PGCLIENTENCODING: 'UTF8',
    } as Record<string, string> as NodeJS.ProcessEnv
    seed = datenbankAufbauen(DB)
    const geprueft = matrix(DB, true, seed)
    befunde = geprueft.befunde
    laeufe = geprueft.laeufe
  }, ZEIT)

  after(() => cluster?.stop())

  test('Einschluss: eigener Cluster, nur Unix-Socket 0700, kein TCP, PostgreSQL 16+, eigene Datenbank', (t) => {
    const psqlVersion = execFileSync(bins.psql, ['--version'], { env: umgebung, encoding: 'utf8' }).trim()
    assert.match(psqlVersion, /^psql \(PostgreSQL\) (1[6-9]|[2-9]\d)\.\d+/)
    assert.match(cluster.version, /^postgres \(PostgreSQL\) (1[6-9]|[2-9]\d)\.\d+/)
    assert.deepEqual(admin('show listen_addresses;'), [], "listen_addresses = ''")
    assert.deepEqual(admin('show unix_socket_directories;'), [cluster.socket])
    assert.deepEqual(admin('select inet_server_addr() is null;'), ['t'])
    assert.deepEqual(admin('select count(*) from pg_stat_ssl where ssl;'), ['0'])
    assert.match(readFileSync(join(cluster.root, 'data', 'pg_hba.conf'), 'utf8'), /^host\s+all\s+all\s+\S+\s+reject$/m)
    assert.ok(cluster.root.startsWith(`${tmpdir()}/`))
    assert.match(basename(cluster.root), /^ot-pilot-1-/)
    assert.equal(statSync(cluster.root).uid, process.getuid?.())
    assert.equal(statSync(cluster.root).mode & 0o077, 0, 'Wurzel nur für den Eigentümer')
    assert.equal(statSync(cluster.socket).mode & 0o777, 0o700)
    assert.deepEqual(admin(`select datname from pg_database where datname like 'r76_%' order by datname;`, 'postgres'), [DB])
    t.diagnostic(JSON.stringify({ psql: psqlVersion, postgres: cluster.version, migrationBlob: MIGRATION_BLOB }))
  })

  test('R76-T01 Bootstrap: echte Rollen, GRANTs, Policies, RLS an, kein BYPASSRLS, auth.uid() je Probe aus dem JWT-Claim', (t) => {
    gruppe('T01.', 5 + 2 * alleProben.length + 1, t)
    const uids = new Set(laeufe.filter((x) => x.probe.rolle === 'authenticated').map((x) => x.vorher.uid))
    assert.ok(uids.has(KONTO.A) && uids.has(KONTO.B) && uids.has(DRITTE_UID) && uids.has(null), lesbar([...uids]))
    t.diagnostic(lesbar({ probenGesamt: alleProben.length, uids: [...uids] }))
  })

  test('R76-T02 Lesen: A liest A, B liest B; fremde Reisen und Etappen sind in beiden Richtungen 0 Zeilen', (t) => {
    beideRichtungen('T02.')
    gruppe('T02.', 7, t)
  })

  test('R76-T03 Fremde Reise ändern: 0 tatsächlich veränderte Zeilen, kein Fehler, beide Richtungen', (t) => {
    beideRichtungen('T03.')
    gruppe('T03.', 6, t)
  })

  test('R76-T04 Fremde Reise löschen: 0 tatsächlich gelöschte Zeilen, keine Kaskade auf Fremdes, beide Richtungen', (t) => {
    beideRichtungen('T04.')
    gruppe('T04.', 6, t)
  })

  test('R76-T05 Anlegen mit fremdem Eigentümer und Upsert auf fremde Reise: 42501 durch RLS, keine Zeile', (t) => {
    beideRichtungen('T05.')
    gruppe('T05.', 6, t)
  })

  test('R76-T06 Positive Kontrolle: eigene Writes wirken (1 Zeile, RETURNING eigenbezogen)', (t) => {
    beideRichtungen('T06.')
    gruppe('T06.', 12, t)
  })

  test('R76-T07 Eigentümerwechsel der eigenen Reise auf fremd: 42501 durch WITH CHECK, Original bleibt', (t) => {
    beideRichtungen('T07.')
    gruppe('T07.', 6, t)
  })

  test('R76-T08 trip_stages: fremde Etappe weder lesen, ändern, löschen noch untergeschoben; FK zusätzlich', (t) => {
    beideRichtungen('T08.')
    gruppe('T08.', 14, t)
  })

  test('R76-T09 anon und fehlende Claims: nichts lesbar, kein Write erlaubt', (t) => {
    gruppe('T09.', 13, t)
  })

  const MUTANTEN: { name: string; sql: string; ziele: string[] }[] = [
    { name: 'trips_rls_aus', sql: 'alter table public.trips disable row level security;', ziele: ['T02.', 'T03.', 'T04.', 'T05.'] },
    { name: 'trips_lesen_offen', sql: 'create policy r76_mutante_offen on public.trips for select to authenticated using (true);', ziele: ['T02.'] },
    {
      name: 'trips_aendern_ohne_with_check',
      sql: 'drop policy trips_aendern on public.trips; create policy trips_aendern on public.trips for update to authenticated using (user_id = (select auth.uid())) with check (true);',
      ziele: ['T07.'],
    },
    { name: 'trips_eigentuemer_ist_testrolle', sql: 'alter table public.trips owner to authenticated;', ziele: ['T01.katalog', 'T02.'] },
    { name: 'auth_uid_ignoriert_claim', sql: 'create or replace function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;', ziele: ['T01.kontext', 'T02.', 'T06.'] },
    { name: 'trips_update_grant_fehlt', sql: 'revoke update on public.trips from authenticated;', ziele: ['T03.', 'T06.'] },
    { name: 'etappen_rls_aus', sql: 'alter table public.trip_stages disable row level security;', ziele: ['T08.'] },
    {
      name: 'etappen_anlegen_ohne_with_check',
      sql: 'drop policy trip_stages_anlegen on public.trip_stages; create policy trip_stages_anlegen on public.trip_stages for insert to authenticated with check (true);',
      ziele: ['T08.'],
    },
    { name: 'anon_lesen_offen', sql: 'grant select on public.trips to anon; create policy r76_mutante_anon on public.trips for select to anon using (true);', ziele: ['T09.'] },
  ]

  MUTANTEN.forEach((m, i) => {
    test(`R76-T11 Gegenprobe ${m.name}: die Matrix meldet die absichtlich geöffnete Schranke`, ZEIT, (t) => {
      const db = `r76_mutante_${i + 1}`
      try {
        const ausgang = datenbankAufbauen(db)
        admin(`begin;\n${m.sql}\ncommit;`, db)
        const ergebnis = matrix(db, false, ausgang)
        const verstoesse = ergebnis.befunde.filter((x) => !x.ok)
        t.diagnostic(lesbar({ mutante: m.name, verstoesse: verstoesse.map((x) => ({ id: x.id, beobachtet: x.beobachtet })) }))
        assert.ok(verstoesse.length > 0, `${m.name}: Matrix bleibt grün, obwohl die Schranke offen ist`)
        for (const ziel of m.ziele) assert.ok(verstoesse.some((x) => x.id.startsWith(ziel)), `${m.name}: kein Verstoss in ${ziel}`)
      } finally {
        admin(`drop database if exists ${db};`, 'postgres')
      }
      assert.deepEqual(admin(`select count(*) from pg_database where datname = '${db}';`, 'postgres'), ['0'], 'Mutante verworfen')
      assert.deepEqual(zustand(), seed, 'die geprüfte Datenbank bleibt unberührt')
    })
  })

  test('R76-T10 Rollback und Aufräumen: frischer Leser sieht die Originalbelegung, keine Mutante, kein Postmaster, kein Rest', (t) => {
    gruppe('T10.', 2 * alleProben.length + 1, t)
    const frisch = zustand()
    assert.deepEqual(frisch, seed, 'frischer unabhängiger Leser sieht exakt die Seed-Belegung')
    assert.deepEqual(
      { reisen: frisch.reisen, etappen: frisch.etappen, tage: frisch.tage, punkte: frisch.punkte },
      ERWARTETE_BELEGUNG,
    )
    assert.deepEqual(admin(`select count(*) from pg_database where datname like 'r76_mutante_%';`, 'postgres'), ['0'])
    // Ein Backend beendet sich kurz nach seinem Client; deshalb begrenzt warten.
    const offen = `select count(*) from pg_stat_activity where datname = '${DB}' and pid <> pg_backend_pid();`
    let sitzungen = admin(offen, 'postgres')
    for (let i = 0; i < 50 && sitzungen[0] !== '0'; i += 1) {
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100)
      sitzungen = admin(offen, 'postgres')
    }
    assert.deepEqual(sitzungen, ['0'], 'keine offene Sitzung auf der geprüften Datenbank')
    t.diagnostic(lesbar({ fingerabdruck: frisch.fingerabdruck, reisen: frisch.reisen.length, etappen: frisch.etappen.length }))

    const wurzel = cluster.root
    const pid = Number(readFileSync(join(wurzel, 'data', 'postmaster.pid'), 'utf8').split('\n')[0])
    assert.ok(Number.isInteger(pid) && pid > 1)
    cluster.stop()
    assert.ok(!existsSync(wurzel), 'nur das eigene Verzeichnis, vollständig entfernt')
    assert.throws(() => process.kill(pid, 0), /ESRCH/)
  })
})

test('R76 CI ohne native PostgreSQL-Binaries schlägt fehl statt zu überspringen', { skip: IN_CI ? false : 'nur in CI relevant' }, () => {
  assert.ok(BINS, 'native PostgreSQL-Binaries fehlen in CI')
})
