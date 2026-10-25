import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { deuteProviderOps, deuteSystemHealth } from './operations-report-validation'
import { PROVIDER_OPS_BOARD_AUDIT_BERICHT } from './provider-ops-board/fixtures'
import { leereProviderOpsBoardCache, sammleProviderOpsBoard } from './provider-ops-board/sammeln'
import { bewerteNichtKonfiguriert } from './system-health/bewertung'
import { SYSTEM_HEALTH_AUDIT_BERICHT } from './system-health/fixtures'
import { leereSystemHealthCache, sammleSystemHealth } from './system-health/sammeln'
import type { ProviderOpsBoardBericht } from './provider-ops-board/typen'
import type { SystemHealthBericht, SystemHealthItem } from './system-health/typen'

const JETZT = Date.parse('2026-10-25T00:00:00.000Z')

function bild(wert: unknown): string {
  return JSON.stringify(wert, (_feld, eintrag) => (eintrag === undefined ? '__undefined__' : eintrag))
}

function health(): SystemHealthBericht {
  return structuredClone(SYSTEM_HEALTH_AUDIT_BERICHT)
}

function ops(): ProviderOpsBoardBericht {
  return structuredClone(PROVIDER_OPS_BOARD_AUDIT_BERICHT)
}

describe('Operationsbericht-Validierung', () => {
  test('Audit-Fixtures und ihre JSON-Form sind gültig', () => {
    const healthJson = JSON.parse(JSON.stringify(SYSTEM_HEALTH_AUDIT_BERICHT)) as SystemHealthBericht
    const opsJson = JSON.parse(JSON.stringify(PROVIDER_OPS_BOARD_AUDIT_BERICHT)) as ProviderOpsBoardBericht
    assert.equal(deuteSystemHealth(SYSTEM_HEALTH_AUDIT_BERICHT), SYSTEM_HEALTH_AUDIT_BERICHT)
    assert.equal(deuteSystemHealth(healthJson).items[0]?.id, 'app')
    assert.equal(deuteProviderOps(PROVIDER_OPS_BOARD_AUDIT_BERICHT), PROVIDER_OPS_BOARD_AUDIT_BERICHT)
    assert.equal(deuteProviderOps(opsJson).items[3]?.id, 'model-usage')
  })

  test('echte Sammlerobjekte mit optional undefined bleiben unverändert und ihre JSON-Form gilt', async () => {
    leereSystemHealthCache()
    const abhaengig = {
      nowMs: () => JETZT,
      appRuntime: () => ({ vercelEnv: null, commitSha: null, deploymentId: null, region: null }),
      supabaseConfigured: () => true,
      pingSupabase: async () => ({ ok: true as const }),
    }
    const erster = await sammleSystemHealth(abhaengig)
    const supabase = erster.items.find((item) => item.id === 'supabase') as SystemHealthItem
    assert.equal(supabase.sourceUpdatedAt, undefined)
    assert.equal(Object.hasOwn(supabase, 'sourceUpdatedAt'), true)
    const ohneDetail = bewerteNichtKonfiguriert('vercel', JETZT, {
      source: 'none',
      summary: 'Keine Quelle.',
      proves: 'Nur das Fehlen.',
      doesNotProve: 'Den Dienst.',
    })
    assert.equal(ohneDetail.detail, undefined)
    assert.equal(Object.hasOwn(ohneDetail, 'detail'), true)
    deuteSystemHealth({
      checkedAt: new Date(JETZT).toISOString(),
      writeActions: [],
      items: [
        { ...erster.items[0]! },
        ohneDetail,
        erster.items.find((item) => item.id === 'supabase')!,
        erster.items.find((item) => item.id === 'github')!,
        erster.items.find((item) => item.id === 'infomaniak')!,
      ],
    })
    assert.equal(ohneDetail.detail, undefined)
    const vorher = bild(erster)
    assert.equal(deuteSystemHealth(erster), erster)
    assert.equal(bild(erster), vorher)
    assert.equal(supabase.sourceUpdatedAt, undefined)
    const json = JSON.parse(JSON.stringify(erster)) as SystemHealthBericht
    assert.equal(Object.hasOwn(json.items.find((item) => item.id === 'supabase') as object, 'sourceUpdatedAt'), false)
    deuteSystemHealth(json)

    const zweiter = await sammleSystemHealth(abhaengig)
    const vercelCache = zweiter.items.find((item) => item.id === 'vercel') as SystemHealthItem
    assert.equal(vercelCache.checks, undefined)
    assert.equal(Object.hasOwn(vercelCache, 'checks'), true)
    const cacheBild = bild(zweiter)
    assert.equal(deuteSystemHealth(zweiter), zweiter)
    assert.equal(bild(zweiter), cacheBild)
    deuteSystemHealth(JSON.parse(JSON.stringify(zweiter)) as SystemHealthBericht)

    leereProviderOpsBoardCache()
    const opsDeps = {
      nowMs: () => JETZT,
      vercelEnv: () => null,
      domainZustaende: () => [],
      liesModelUsage: async () => ({ ok: true as const, zeilen: 0, kostenMikroUsd: 0, juengsteCreatedAt: null }),
    }
    await sammleProviderOpsBoard(opsDeps)
    const opsCache = await sammleProviderOpsBoard(opsDeps)
    const guard = opsCache.items.find((item) => item.id === 'cost-guard')
    assert.ok(guard)
    assert.equal(guard.checks, undefined)
    assert.equal(Object.hasOwn(guard, 'checks'), true)
    const opsBild = bild(opsCache)
    assert.equal(deuteProviderOps(opsCache), opsCache)
    assert.equal(bild(opsCache), opsBild)
    deuteProviderOps(JSON.parse(JSON.stringify(opsCache)) as ProviderOpsBoardBericht)
  })

  test('ungültige Körper scheitern geschlossen, ohne eine Karte zu ergänzen', () => {
    const faelle: unknown[] = [null, [], {}, { checkedAt: '2026-10-25T00:00:00.000Z', items: [], writeActions: [] }]
    for (const fall of faelle) {
      assert.throws(() => deuteSystemHealth(fall))
      assert.throws(() => deuteProviderOps(fall))
    }
  })

  test('Health-Grenzen: Schlüssel, Status, Alter, TTL und Aktionen', () => {
    const fehlt = health()
    fehlt.items = fehlt.items.filter((item) => item.id !== 'github')
    assert.throws(() => deuteSystemHealth(fehlt))

    const doppelt = health()
    doppelt.items[1] = { ...doppelt.items[0]!, id: 'app' }
    assert.throws(() => deuteSystemHealth(doppelt))

    const extra = health()
    extra.items.splice(1, 0, { ...extra.items[0]!, id: 'github' })
    assert.throws(() => deuteSystemHealth(extra))

    const unbekannt = health() as SystemHealthBericht & { extra?: undefined }
    unbekannt.extra = undefined
    assert.throws(() => deuteSystemHealth(unbekannt))

    const status = health()
    status.items[0]!.status = 'kaputt' as 'unknown'
    assert.throws(() => deuteSystemHealth(status))

    const frische = health()
    ;(frische.items[0]!.freshness as { state: string }).state = 'offen'
    assert.throws(() => deuteSystemHealth(frische))

    const aktionen = health()
    ;(aktionen as { writeActions: string[] }).writeActions = ['refresh']
    assert.throws(() => deuteSystemHealth(aktionen))

    const meta = health()
    meta.items[0]!.metadata = { vercelEnv: 1 as unknown as string }
    assert.throws(() => deuteSystemHealth(meta))

    const metaObjekt = health()
    metaObjekt.items[0]!.metadata = { vercelEnv: { tief: true } as unknown as string }
    assert.throws(() => deuteSystemHealth(metaObjekt))

    const zeit = health()
    zeit.checkedAt = 'gestern'
    assert.throws(() => deuteSystemHealth(zeit))

    const detail = health()
    detail.items[0]!.detail = null as unknown as string
    assert.throws(() => deuteSystemHealth(detail))

    const quelle = health()
    quelle.items[0]!.sourceUpdatedAt = null as unknown as string
    assert.throws(() => deuteSystemHealth(quelle))

    const negativ = health()
    negativ.items[0]!.freshness = { state: 'stale', ageMs: -1, ttlMs: 60_000 }
    assert.throws(() => deuteSystemHealth(negativ))

    const ohneAlter = health()
    ohneAlter.items[0]!.freshness = { state: 'fresh', ageMs: null, ttlMs: 60_000 }
    assert.throws(() => deuteSystemHealth(ohneAlter))

    const unbekanntMitAlter = health()
    unbekanntMitAlter.items[4]!.freshness = { state: 'unknown', ageMs: 5, ttlMs: 300_000 }
    assert.throws(() => deuteSystemHealth(unbekanntMitAlter))

    const ueberTtl = health()
    ueberTtl.items[0]!.freshness = { state: 'fresh', ageMs: 60_001, ttlMs: 60_000 }
    assert.throws(() => deuteSystemHealth(ueberTtl))

    const nullTtl = health()
    nullTtl.items[0]!.freshness = { state: 'stale', ageMs: 1, ttlMs: 0 }
    assert.throws(() => deuteSystemHealth(nullTtl))

    const negativeTtl = health()
    negativeTtl.items[0]!.freshness = { state: 'stale', ageMs: 1, ttlMs: -1 }
    assert.throws(() => deuteSystemHealth(negativeTtl))

    const unendlich = health()
    unendlich.items[0]!.freshness = { state: 'stale', ageMs: 1, ttlMs: Number.POSITIVE_INFINITY }
    assert.throws(() => deuteSystemHealth(unendlich))

    const deckel = health()
    deckel.items[0]!.freshness = { state: 'fresh', ageMs: 0, ttlMs: 60_001 }
    assert.throws(() => deuteSystemHealth(deckel))

    const kuerzer = health()
    kuerzer.items[0]!.freshness = { state: 'fresh', ageMs: 0, ttlMs: 1 }
    deuteSystemHealth(kuerzer)

    const checkDoppelt = health()
    const checks = checkDoppelt.items[0]!.checks
    assert.ok(checks && checks[1])
    checks[1] = { ...checks[0]! }
    assert.throws(() => deuteSystemHealth(checkDoppelt))
  })

  test('Provider-Grenzen inklusive Modellnutzung unter dem TTL-Deckel', () => {
    const sechzig = ops()
    sechzig.items[3]!.freshness = { state: 'fresh', ageMs: 0, ttlMs: 60_000 }
    deuteProviderOps(sechzig)

    const zuLang = ops()
    zuLang.items[3]!.freshness = { state: 'fresh', ageMs: 0, ttlMs: 120_001 }
    assert.throws(() => deuteProviderOps(zuLang))

    const quelle = ops() as ProviderOpsBoardBericht & { items: Array<ProviderOpsBoardBericht['items'][number] & { sourceUpdatedAt?: undefined }> }
    quelle.items[0]!.sourceUpdatedAt = undefined
    assert.throws(() => deuteProviderOps(quelle))

    const status = ops()
    status.items[0]!.status = 'guarded' as 'foundation_only'
    assert.throws(() => deuteProviderOps(status))

    const leer = ops()
    leer.items[0]!.checks = []
    deuteProviderOps(leer)
  })
})
