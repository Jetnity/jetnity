import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'

import type { SupabaseClient } from '@supabase/supabase-js'

import {
  KONTO_DATENEXPORT_MAX_ZEILEN,
  KONTO_DATENEXPORT_SCHEMA_VERSION,
  KONTO_DATENEXPORT_SEITE,
  KONTO_DATENEXPORT_SPALTEN,
  KONTO_DATENEXPORT_TABELLEN,
  KONTO_DATENEXPORT_VOLLSTAENDIGKEIT,
  kontoDatenexportDateiname,
  kontoDatenexportDokument,
  kontoDatenexportErzeugen,
  kontoDatenexportSpaltenliste,
} from '@/lib/account/datenexport'
import type { Database } from '@/types/supabase'

const hier = dirname(fileURLToPath(import.meta.url))

function quelle(relativ: string) {
  return readFileSync(join(hier, relativ), 'utf8')
}

const helfer = quelle('datenexport.ts')
const route = quelle('../../app/api/account/export/route.ts')
const settings = quelle('../../app/account/settings/page.tsx')
const proxy = quelle('../../proxy.ts')

const VERBOTENE_TABELLEN = [
  'security_events',
  'blocked_ips',
  'payments',
  'refunds',
  'trip_item_commercial_provenance',
  'auth.users',
]

type MockFehler = { message: string; code?: string; status?: number }

function mockClient(args: {
  zeilen?: Partial<Record<string, unknown[]>>
  fehler?: Partial<Record<string, MockFehler>>
  gesehen?: { tabelle: string; userId: string; select: string }[]
}): SupabaseClient<Database> {
  const zeilen = args.zeilen ?? {}
  const fehler = args.fehler ?? {}
  const gesehen = args.gesehen

  return {
    from(tabelle: string) {
      let userId = ''
      let select = ''
      const kette = {
        select(spalten: string) {
          select = spalten
          return kette
        },
        eq(spalte: string, wert: string) {
          assert.equal(spalte, 'user_id')
          userId = wert
          return kette
        },
        range(von: number, bis: number) {
          gesehen?.push({ tabelle, userId, select })
          const eintrag = fehler[tabelle]
          if (eintrag) {
            return Promise.resolve({
              data: null,
              error: { message: eintrag.message, code: eintrag.code ?? null },
              status: eintrag.status ?? 500,
            })
          }
          const alle = zeilen[tabelle] ?? []
          return Promise.resolve({
            data: alle.slice(von, bis + 1),
            error: null,
            status: 200,
          })
        },
      }
      return kette
    },
  } as unknown as SupabaseClient<Database>
}

describe('V1 Account Data Export 1 Vertrag', () => {
  test('Scope ist genau die freigegebene Tabellenliste', () => {
    assert.deepEqual([...KONTO_DATENEXPORT_TABELLEN], [
      'profiles',
      'account_travellers',
      'account_traveller_citizenships',
      'account_traveller_documents',
      'account_visits',
      'trips',
      'trip_stages',
      'trip_days',
      'trip_items',
      'trip_travellers',
      'trip_traveller_citizenships',
      'trip_traveller_documents',
      'trip_readiness_items',
    ])
    for (const tabelle of KONTO_DATENEXPORT_TABELLEN) {
      assert.match(helfer, new RegExp(`\\.from\\('${tabelle}'\\)`))
    }
    for (const verboten of VERBOTENE_TABELLEN) {
      assert.equal(helfer.includes(`.from('${verboten}')`), false, verboten)
      assert.equal(route.includes(`.from('${verboten}')`), false, verboten)
    }
  })

  test('Dateiname enthält weder E-Mail noch Namen noch User-Id', () => {
    assert.equal(
      kontoDatenexportDateiname('2026-09-18T10:49:00.000Z'),
      'jetnity-account-export-2026-09-18.json',
    )
    assert.equal(kontoDatenexportDateiname('ungueltig'), 'jetnity-account-export.json')
    const name = kontoDatenexportDateiname('2026-09-18T10:49:00.000Z')
    assert.equal(name.includes('@'), false)
    assert.equal(/[A-Za-z]+ [A-Za-z]+/.test(name), false)
    assert.equal(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(name),
      false,
    )
    const dateinameFn = helfer.slice(
      helfer.indexOf('export function kontoDatenexportDateiname'),
      helfer.indexOf('export function kontoDatenexportDokument'),
    )
    assert.equal(dateinameFn.includes('email'), false)
    assert.equal(dateinameFn.includes('display_name'), false)
    assert.equal(route.includes('email'), false)
    assert.equal(route.includes('user.email'), false)
    assert.equal(route.includes('user.user_metadata'), false)
  })

  test('jeder Export-Read nutzt eine explizite Spalten-Allowlist, niemals select *', async () => {
    assert.equal(helfer.includes(".select('*')"), false)
    assert.equal(helfer.includes('.select("*")'), false)
    assert.equal(helfer.includes('.select(`*`)'), false)
    assert.doesNotMatch(helfer, /\.select\(\s*['"`]\s*\*\s*['"`]\s*\)/)
    assert.match(helfer, /export const KONTO_DATENEXPORT_SPALTEN/)
    assert.match(helfer, /A later migration must not enter/)
    assert.match(helfer, /export-contract review/)
    assert.match(helfer, /`schemaVersion` stays `jetnity\.account-export\.v1`/)
    assert.deepEqual(Object.keys(KONTO_DATENEXPORT_SPALTEN), [...KONTO_DATENEXPORT_TABELLEN])

    for (const tabelle of KONTO_DATENEXPORT_TABELLEN) {
      const spalten = KONTO_DATENEXPORT_SPALTEN[tabelle]
      assert.ok(Array.isArray(spalten) && spalten.length > 0, tabelle)
      assert.equal(spalten.includes('*'), false, tabelle)
      assert.equal(new Set(spalten).size, spalten.length, `duplikat ${tabelle}`)
      assert.equal(kontoDatenexportSpaltenliste(tabelle), spalten.join(','))
      assert.equal(kontoDatenexportSpaltenliste(tabelle).includes('*'), false, tabelle)
      assert.match(helfer, new RegExp(`\\.from\\('${tabelle}'\\)[\\s\\S]{0,80}\\.select\\(spalten\\)`))
    }

    const gesehen: { tabelle: string; userId: string; select: string }[] = []
    const leer = await kontoDatenexportErzeugen(
      mockClient({ gesehen }),
      '55555555-5555-5555-5555-555555555555',
    )
    assert.equal(leer.ok, true)
    assert.deepEqual(
      gesehen.map((eintrag) => eintrag.tabelle),
      [...KONTO_DATENEXPORT_TABELLEN],
    )
    for (const eintrag of gesehen) {
      assert.equal(eintrag.select, kontoDatenexportSpaltenliste(eintrag.tabelle as (typeof KONTO_DATENEXPORT_TABELLEN)[number]))
      assert.notEqual(eintrag.select, '*')
      assert.equal(eintrag.select.includes('*'), false, eintrag.tabelle)
      assert.equal(eintrag.userId, '55555555-5555-5555-5555-555555555555')
    }
  })

  test('Dokument hat stabile Schemaversion und generatedAt', () => {
    const leer = {} as Record<(typeof KONTO_DATENEXPORT_TABELLEN)[number], unknown[]>
    for (const tabelle of KONTO_DATENEXPORT_TABELLEN) leer[tabelle] = []
    const dokument = kontoDatenexportDokument({
      generatedAt: '2026-09-18T10:49:00.000Z',
      data: leer,
    })
    assert.equal(dokument.schemaVersion, 'jetnity.account-export.v1')
    assert.equal(dokument.schemaVersion, KONTO_DATENEXPORT_SCHEMA_VERSION)
    assert.equal(dokument.generatedAt, '2026-09-18T10:49:00.000Z')
    assert.equal(dokument.scope.completeness, KONTO_DATENEXPORT_VOLLSTAENDIGKEIT)
    assert.equal(dokument.scope.owner, 'authenticated-session')
    assert.deepEqual([...dokument.scope.tables], [...KONTO_DATENEXPORT_TABELLEN])
    for (const tabelle of KONTO_DATENEXPORT_TABELLEN) {
      assert.deepEqual(dokument.data[tabelle], [])
    }
  })

  test('leere eigene Tabellen bleiben leere Arrays, ein Tabellenfehler beendet den Export', async () => {
    const leer = await kontoDatenexportErzeugen(
      mockClient({}),
      '11111111-1111-1111-1111-111111111111',
      () => new Date('2026-09-18T10:49:00.000Z'),
    )
    assert.equal(leer.ok, true)
    if (!leer.ok) throw new Error('erwartet ok')
    assert.equal(leer.dokument.generatedAt, '2026-09-18T10:49:00.000Z')
    for (const tabelle of KONTO_DATENEXPORT_TABELLEN) {
      assert.deepEqual(leer.dokument.data[tabelle], [])
    }

    const gesehen: { tabelle: string; userId: string; select: string }[] = []
    const fehl = await kontoDatenexportErzeugen(
      mockClient({
        gesehen,
        zeilen: { profiles: [{ id: 'p1' }] },
        fehler: { trips: { message: 'permission denied', status: 500 } },
      }),
      '22222222-2222-2222-2222-222222222222',
    )
    assert.equal(fehl.ok, false)
    if (fehl.ok) throw new Error('erwartet Fehler')
    assert.equal(fehl.problem.status, 500)
    assert.equal(gesehen.some((eintrag) => eintrag.tabelle === 'trips'), true)
    assert.equal(
      gesehen.every((eintrag) => eintrag.userId === '22222222-2222-2222-2222-222222222222'),
      true,
    )
    assert.equal(gesehen.some((eintrag) => eintrag.tabelle === 'trip_stages'), false)
  })

  test('Seiten werden gelesen, eine überschrittene Grenze wird nicht still abgeschnitten', async () => {
    const volleSeite = Array.from({ length: KONTO_DATENEXPORT_SEITE }, (_, i) => ({ id: `p${i}` }))
    const ok = await kontoDatenexportErzeugen(
      mockClient({
        zeilen: { account_visits: [...volleSeite, { id: 'rest' }] },
      }),
      '33333333-3333-3333-3333-333333333333',
    )
    assert.equal(ok.ok, true)
    if (!ok.ok) throw new Error('erwartet ok')
    assert.equal(ok.dokument.data.account_visits.length, KONTO_DATENEXPORT_SEITE + 1)

    const zuViel = Array.from({ length: KONTO_DATENEXPORT_MAX_ZEILEN + 1 }, (_, i) => ({ id: `x${i}` }))
    const grenze = await kontoDatenexportErzeugen(
      mockClient({ zeilen: { account_visits: zuViel } }),
      '44444444-4444-4444-4444-444444444444',
    )
    assert.equal(grenze.ok, false)
    if (grenze.ok) throw new Error('erwartet Fehler')
    assert.equal(grenze.problem.status, 500)
  })

  test('Route ist sessiongebunden, fail-closed und ohne Service-Role', () => {
    assert.match(route, /createRouteHandlerClient<Database>\(\)/)
    assert.match(route, /auth\.getUser\(\)/)
    assert.match(route, /if \(error \|\| !data\.user\)/)
    assert.match(route, /status: 401/)
    assert.match(route, /kontoDatenexportErzeugen\(supabase, data\.user\.id\)/)
    assert.match(route, /Cache-Control': 'no-store'/)
    assert.match(route, /Content-Type': 'application\/json; charset=utf-8'/)
    assert.match(route, /Content-Disposition': `attachment; filename="\$\{dateiname\}"`/)
    assert.match(route, /export async function GET\(/)
    assert.equal(route.includes('export async function POST'), false)
    assert.equal(route.includes('searchParams'), false)
    assert.equal(route.includes('req.url'), false)
    assert.equal(route.includes('req.json'), false)
    assert.equal(route.includes('params'), false)
    assert.equal(/user_id.*query|query.*user_id/.test(route), false)
    for (const verboten of [
      'SERVICE_ROLE',
      'service_role',
      'createAdminClient',
      'SUPABASE_SERVICE_ROLE_KEY',
      'createClient(',
    ]) {
      assert.equal(route.includes(verboten), false, verboten)
      assert.equal(helfer.includes(verboten), false, verboten)
    }
    assert.match(helfer, /import 'server-only'/)
    assert.match(helfer, /from '@\/lib\/api\/datenbank-lesen'/)
    assert.equal(helfer.includes('providerOpsInMemoryCostGuard'), false)
    assert.equal(route.includes('providerOpsInMemoryCostGuard'), false)
    assert.equal(helfer.includes('rate-limit'), false)
    assert.equal(route.includes('rate-limit'), false)
    for (const verboten of ['.insert(', '.update(', '.upsert(', '.delete(', '.rpc(']) {
      assert.equal(helfer.includes(verboten), false, verboten)
      assert.equal(route.includes(verboten), false, verboten)
    }
  })

  test('Einstellungen bieten den Export ehrlich und ohne Löschversprechen', () => {
    assert.match(settings, /href="\/api\/account\/export"/)
    assert.match(settings, /aria-labelledby="account-datenexport-title"/)
    assert.match(settings, /<h2[\s\S]*id="account-datenexport-title"/)
    assert.match(settings, /aktuell von Jetnity gespeicherten Konto- und Reisedaten/)
    assert.match(settings, /sensible Reise- und Reisendenangaben/)
    assert.match(settings, /kein[\s\S]*vollständiger rechtlicher Datenauszug/)
    assert.match(settings, /keine Kontolöschung/)
    assert.equal(settings.includes('/account/delete'), false)
    assert.equal(settings.includes('DSGVO-konform'), false)
    assert.equal(settings.includes('Konto löschen'), false)
    assert.match(settings, /aktuelle Sitzung/)
    assert.match(settings, /href="\/account\/security"/)
    assert.match(settings, /min-h-11/)
  })

  test('Proxy bleibt unverändert und schützt /api/account nicht anstelle der Route', () => {
    assert.match(proxy, /pathname\.startsWith\('\/account'\)/)
    assert.equal(proxy.includes("/api/account"), false)
    assert.match(proxy, /pathname\.startsWith\('\/api\/admin'\)/)
  })
})
