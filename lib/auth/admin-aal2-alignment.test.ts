import { createHash } from 'node:crypto'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import {
  CAPABILITIES,
  CAPABILITY_MINIMUM,
  can,
  databaseFunctionFor,
  hasAtLeast,
  type Role,
} from '@/lib/auth/roles'

const MIGRATIONEN = join(process.cwd(), 'supabase', 'migrations')
const ALIGNMENT = '20260827170000_admin_aal2_data_plane_alignment.sql'
const HISTORISCH = '20260826090000_admin_aal2_data_plane.sql'
const PRODUCTION_HEAD = '20260827010000_reise_anlegen_zero_stage_fail_closed.sql'

const MINDESTROLLEN = {
  darf_betrieb_lesen: 'moderator',
  darf_betrieb_eingreifen: 'operator',
  darf_konten_verwalten: 'moderator',
  darf_inhalte_moderieren: 'moderator',
  darf_konfiguration_verwalten: 'admin',
} as const

const ADMIN_RLS_CONSUMER = [
  { policy: 'profiles_lesen', capability: 'darf_konten_verwalten', selfService: true },
  { policy: 'profiles_aendern', capability: 'darf_konten_verwalten', selfService: true },
  { policy: 'profiles_loeschen', capability: 'darf_konten_verwalten', selfService: true },
  { policy: 'security_events_lesen', capability: 'darf_betrieb_lesen', selfService: false },
  { policy: 'payments_lesen', capability: 'darf_betrieb_lesen', selfService: false },
  { policy: 'refunds_lesen', capability: 'darf_betrieb_lesen', selfService: false },
  { policy: 'stripe_webhooks_lesen', capability: 'darf_betrieb_lesen', selfService: false },
  { policy: 'blocked_ips_lesen', capability: 'darf_betrieb_lesen', selfService: false },
  { policy: 'blocked_ips_eingriff_anlegen', capability: 'darf_betrieb_eingreifen', selfService: false },
  { policy: 'blocked_ips_eingriff_aendern', capability: 'darf_betrieb_eingreifen', selfService: false },
  { policy: 'blocked_ips_eingriff_loeschen', capability: 'darf_betrieb_eingreifen', selfService: false },
  { policy: 'refunds_eingriff_anlegen', capability: 'darf_betrieb_eingreifen', selfService: false },
  { policy: 'payments_eingriff_aendern', capability: 'darf_betrieb_eingreifen', selfService: false },
  { policy: 'model_usage_lesen', capability: 'darf_betrieb_lesen', selfService: false },
] as const

const HISTORISCHE_PROFIL_POLICIES = [
  'creator_profiles_lesen',
  'creator_profiles_aendern',
  'creator_profiles_loeschen',
] as const

const PROFIL_RENAME = '20260817120300_generisches_profil.sql'

type PolicyEreignis =
  | { art: 'create'; name: string; tabelle: string; koerper: string; index: number }
  | { art: 'drop'; name: string; index: number }
  | { art: 'rename'; von: string; nach: string; index: number }

type AktuellePolicy = {
  name: string
  tabelle: string
  koerper: string
}

const ADMIN_SECURITY_DEFINER_RPCS = [
  'admin_payments_summary_30d',
  'admin_reisen_kennzahlen',
  'admin_reisen_zeitreihe',
  'admin_security_overview',
] as const

function dateien(): string[] {
  return readdirSync(MIGRATIONEN).filter(datei => datei.endsWith('.sql')).sort()
}

function lies(name: string): string {
  return readFileSync(join(MIGRATIONEN, name), 'utf8')
}

function alleSql(): string {
  return dateien().map(lies).join('\n')
}

function letzterFunktionskoerper(sql: string, name: string): string {
  const muster = new RegExp(
    `create or replace function public\\.${name}\\((?:[^)]*)\\)[\\s\\S]*?as \\$\\$([\\s\\S]*?)\\$\\$`,
    'g',
  )
  const treffer = [...sql.matchAll(muster)]
  assert.ok(treffer.length > 0, `public.${name}() fehlt in den Migrationen`)
  return treffer[treffer.length - 1][1]
}

function letzteFunktionsdefinition(sql: string, name: string): string {
  const muster = new RegExp(
    `create or replace function public\\.${name}\\((?:[^)]*)\\)[\\s\\S]*?as \\$\\$[\\s\\S]*?\\$\\$`,
    'g',
  )
  const treffer = [...sql.matchAll(muster)]
  assert.ok(treffer.length > 0, `public.${name}() fehlt in den Migrationen`)
  return treffer[treffer.length - 1][0]
}

function policyEreignisse(sql: string): PolicyEreignis[] {
  const ereignisse: PolicyEreignis[] = []
  for (const treffer of sql.matchAll(
    /create policy\s+([a-z0-9_]+)\s+on\s+(?:public\.)?([a-z0-9_]+)([\s\S]*?);/gi,
  )) {
    ereignisse.push({
      art: 'create',
      name: treffer[1],
      tabelle: treffer[2],
      koerper: treffer[0],
      index: treffer.index ?? 0,
    })
  }
  for (const treffer of sql.matchAll(
    /drop policy(?:\s+if exists)?\s+([a-z0-9_]+)\s+on\s+(?:public\.)?[a-z0-9_]+/gi,
  )) {
    ereignisse.push({
      art: 'drop',
      name: treffer[1],
      index: treffer.index ?? 0,
    })
  }
  for (const treffer of sql.matchAll(
    /alter policy\s+([a-z0-9_]+)\s+on\s+(?:public\.)?[a-z0-9_]+\s+rename to\s+([a-z0-9_]+)/gi,
  )) {
    ereignisse.push({
      art: 'rename',
      von: treffer[1],
      nach: treffer[2],
      index: treffer.index ?? 0,
    })
  }
  return ereignisse.sort((links, rechts) => links.index - rechts.index)
}

function aktuellePolicies(sql: string): Map<string, AktuellePolicy> {
  const stand = new Map<string, AktuellePolicy>()
  for (const ereignis of policyEreignisse(sql)) {
    if (ereignis.art === 'create') {
      stand.set(ereignis.name, {
        name: ereignis.name,
        tabelle: ereignis.tabelle,
        koerper: ereignis.koerper,
      })
      continue
    }
    if (ereignis.art === 'drop') {
      stand.delete(ereignis.name)
      continue
    }
    const bisher = stand.get(ereignis.von)
    assert.ok(bisher, `ALTER POLICY RENAME ohne aktuellen Stand: ${ereignis.von}`)
    stand.delete(ereignis.von)
    stand.set(ereignis.nach, { ...bisher, name: ereignis.nach })
  }
  return stand
}

function aktuellesAdminAal2(aal: string | null | undefined): boolean {
  return (aal ?? null) === 'aal2'
}

function administrativeFaehigkeit(rolle: Role, aal: string | null | undefined, minimum: Role): boolean {
  return hasAtLeast(rolle, minimum) && aktuellesAdminAal2(aal)
}

describe('P1-AAL2-PROD-01 Alignment-Migration', () => {
  const alignment = lies(ALIGNMENT)
  const historisch = lies(HISTORISCH)
  const sql = alleSql()

  test('liegt nach dem aktuellen Production-Head und bleibt kollisionsfrei', () => {
    assert.ok(dateien().includes(PRODUCTION_HEAD))
    assert.ok(dateien().includes(ALIGNMENT))
    assert.ok(ALIGNMENT > PRODUCTION_HEAD)
    assert.equal(dateien().filter(name => name.startsWith('20260827170000')).length, 1)
  })

  test('ändert die historische Development-/Repo-Datei nicht', () => {
    assert.ok(dateien().includes(HISTORISCH))
    assert.match(historisch, /create or replace function public\.aktuelles_admin_aal2/)
    assert.notEqual(ALIGNMENT, HISTORISCH)
    assert.notEqual(
      createHash('sha256').update(alignment).digest('hex'),
      createHash('sha256').update(historisch).digest('hex'),
    )
  })

  test('ist forward-only: keine Policy-/Tabellen-/Ownership-Mutation', () => {
    assert.equal(/create policy|drop policy|alter policy/i.test(alignment), false)
    assert.equal(/alter table|drop table|create table/i.test(alignment), false)
    assert.equal(/alter function public\.(hat_rolle_mindestens|auth\.)/i.test(alignment), false)
    assert.equal(/owner to/i.test(alignment), false)
  })

  test('liest AAL ausschließlich aus auth.jwt() und ist fail closed', () => {
    const definition = letzteFunktionsdefinition(sql, 'aktuelles_admin_aal2')
    const koerper = letzterFunktionskoerper(sql, 'aktuelles_admin_aal2')
    assert.match(koerper, /auth\.jwt\(\)\s*->>\s*'aal'/)
    assert.match(koerper, /=\s*'aal2'/)
    assert.match(koerper, /coalesce\(/)
    assert.match(definition, /security invoker/i)
    assert.match(definition, /search_path\s*=\s*pg_catalog/)
    assert.equal(/nextLevel|factor|user_metadata|break-glass|allowlist/i.test(koerper), false)
  })

  test('jede Fähigkeit verknüpft unveränderte Mindestrolle AND AAL2', () => {
    for (const faehigkeit of CAPABILITIES) {
      const name = databaseFunctionFor(faehigkeit)
      const definition = letzteFunktionsdefinition(sql, name)
      const koerper = letzterFunktionskoerper(sql, name)
      assert.match(koerper, /hat_rolle_mindestens\('([a-z]+)'\)/)
      assert.match(koerper, /aktuelles_admin_aal2\(\)/)
      assert.match(koerper, /and/i)
      assert.match(definition, /security invoker/i)
      assert.match(definition, /search_path\s*=\s*pg_catalog/)
      const rolle = koerper.match(/hat_rolle_mindestens\('([a-z]+)'\)/)?.[1]
      assert.equal(rolle, CAPABILITY_MINIMUM[faehigkeit])
      assert.equal(rolle, MINDESTROLLEN[name as keyof typeof MINDESTROLLEN])
    }
  })

  test('Grants bleiben authenticated/service_role, Revoke für public/anon', () => {
    assert.match(alignment, /revoke all on function public\.aktuelles_admin_aal2\(\) from public, anon/)
    assert.match(
      alignment,
      /grant execute on function public\.aktuelles_admin_aal2\(\) to authenticated, service_role/,
    )
    assert.match(alignment, /revoke all on function public\.%I\(\) from public, anon/)
    assert.match(alignment, /grant execute on function public\.%I\(\) to authenticated, service_role/)
  })
})

describe('P1-AAL2-PROD-01 Capability-Matrix', () => {
  const faelle: Array<{
    name: string
    rolle: Role
    aal: string | null | undefined
    capability: keyof typeof CAPABILITY_MINIMUM
    erwartet: boolean
  }> = [
    { name: 'AAL1 + owner => false', rolle: 'owner', aal: 'aal1', capability: 'betrieb-lesen', erwartet: false },
    { name: 'fehlender AAL + admin => false', rolle: 'admin', aal: null, capability: 'konten-verwalten', erwartet: false },
    { name: 'leerer AAL + operator => false', rolle: 'operator', aal: '', capability: 'betrieb-eingreifen', erwartet: false },
    { name: 'malformed AAL + owner => false', rolle: 'owner', aal: 'AAL2', capability: 'konfiguration-verwalten', erwartet: false },
    { name: 'AAL2 + user => false', rolle: 'user', aal: 'aal2', capability: 'betrieb-lesen', erwartet: false },
    { name: 'AAL2 + creator => false', rolle: 'creator', aal: 'aal2', capability: 'betrieb-lesen', erwartet: false },
    { name: 'AAL2 + moderator => betrieb-lesen true', rolle: 'moderator', aal: 'aal2', capability: 'betrieb-lesen', erwartet: true },
    { name: 'AAL2 + moderator => betrieb-eingreifen false', rolle: 'moderator', aal: 'aal2', capability: 'betrieb-eingreifen', erwartet: false },
    { name: 'AAL2 + operator => betrieb-eingreifen true', rolle: 'operator', aal: 'aal2', capability: 'betrieb-eingreifen', erwartet: true },
    { name: 'AAL2 + admin => konfiguration-verwalten true', rolle: 'admin', aal: 'aal2', capability: 'konfiguration-verwalten', erwartet: true },
    { name: 'AAL2 + moderator => konfiguration-verwalten false', rolle: 'moderator', aal: 'aal2', capability: 'konfiguration-verwalten', erwartet: false },
  ]

  for (const fall of faelle) {
    test(fall.name, () => {
      const minimum = CAPABILITY_MINIMUM[fall.capability]
      assert.equal(can(fall.rolle, fall.capability), hasAtLeast(fall.rolle, minimum))
      assert.equal(
        administrativeFaehigkeit(fall.rolle, fall.aal, minimum),
        fall.erwartet,
      )
    })
  }

  test('Break-Glass erzeugt keine DB-Rechte und ersetzt AAL2 nicht', () => {
    const sql = alleSql()
    for (const name of Object.keys(MINDESTROLLEN)) {
      const koerper = letzterFunktionskoerper(sql, name)
      assert.equal(/break-glass|ADMIN_ALLOWED_EMAILS|allowlist/i.test(koerper), false)
    }
    const aalKoerper = letzterFunktionskoerper(sql, 'aktuelles_admin_aal2')
    assert.equal(/break-glass|ADMIN_ALLOWED_EMAILS|allowlist|nextLevel/i.test(aalKoerper), false)
    assert.equal(/grant execute[\s\S]{0,80}break-glass/i.test(lies(ALIGNMENT)), false)
    assert.equal(administrativeFaehigkeit('owner', 'aal1', 'moderator'), false)
  })
})

describe('P1-AAL2-PROD-01 Consumer-Inventur', () => {
  const sql = alleSql()
  const alignment = lies(ALIGNMENT)
  const stand = aktuellePolicies(sql)

  test('14 direkte Admin-RLS-Policies bleiben am aktuellen Capability-Pfad', () => {
    assert.equal(ADMIN_RLS_CONSUMER.length, 14)
    for (const eintrag of ADMIN_RLS_CONSUMER) {
      const aktuell = stand.get(eintrag.policy)
      assert.ok(
        aktuell,
        `${eintrag.policy} fehlt im finalen Policy-Stand (CREATE + RENAME + DROP)`,
      )
      assert.match(
        aktuell.koerper,
        new RegExp(`${eintrag.capability}\\(\\)`),
        `${eintrag.policy} muss ${eintrag.capability}() nutzen`,
      )
    }
    assert.equal(/create policy|drop policy|alter policy/i.test(alignment), false)
  })

  test('Profil-Policies heißen aktuell profiles_* nach der Rename-Kette', () => {
    const rename = lies(PROFIL_RENAME)
    assert.match(rename, /alter policy creator_profiles_lesen\s+on public\.profiles rename to profiles_lesen/)
    assert.match(rename, /alter policy creator_profiles_aendern\s+on public\.profiles rename to profiles_aendern/)
    assert.match(rename, /alter policy creator_profiles_loeschen\s+on public\.profiles rename to profiles_loeschen/)
    for (const historisch of HISTORISCHE_PROFIL_POLICIES) {
      assert.equal(
        stand.has(historisch),
        false,
        `${historisch} darf nach der Rename-Kette nicht mehr der aktuelle Name sein`,
      )
    }
    assert.equal(stand.has('profiles_lesen'), true)
    assert.equal(stand.has('profiles_aendern'), true)
    assert.equal(stand.has('profiles_loeschen'), true)
  })

  test('Consumer-Self-Service-OR-Zweige bleiben in der Alignment-Migration unangetastet', () => {
    assert.match(sql, /user_id = \(select auth\.uid\(\)\) or public\.darf_konten_verwalten\(\)/)
    assert.equal(/user_id|auth\.uid\(\)/.test(alignment), false)
  })

  test('vier administrative SECURITY-DEFINER-RPCs prüfen intern darf_betrieb_lesen()', () => {
    assert.equal(ADMIN_SECURITY_DEFINER_RPCS.length, 4)
    for (const name of ADMIN_SECURITY_DEFINER_RPCS) {
      const definition = letzteFunktionsdefinition(sql, name)
      assert.match(definition, /security definer/i)
      assert.match(definition, /darf_betrieb_lesen\(\)/)
    }
  })
})
