import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import {
  bewerteCostGuard,
  bewerteKillSwitch,
  bewerteModelUsage,
  bewerteProviderOps,
  domainCheckAusZustand,
} from './bewertung'
import { berechneFreshness } from './freshness'
import { leereProviderOpsBoardCache, providerOpsBoardIdsVollstaendig, sammleProviderOpsBoard } from './sammeln'
import {
  PROVIDER_OPS_BOARD_API_PFAD,
  PROVIDER_OPS_BOARD_STATUSES,
  PROVIDER_OPS_BOARD_STATUS_LABEL,
  PROVIDER_OPS_BOARD_TTL_MS,
  PROVIDER_OPS_BOARD_WRITE_ACTIONS,
  istUeberzogenerGesamtClaim,
  providerOpsKarteIstGruen,
  sichtbarerKartenClaim,
} from './typen'

const JETZT = Date.parse('2026-08-24T17:00:00.000Z')

describe('Provider-Ops-Board Bewertung', () => {
  test('Parent bleibt foundation_only, auch wenn eine Domain available ist', () => {
    const board = bewerteProviderOps(
      [
        { id: 'domain-flights', name: 'Flights', zustand: { aktiv: true, umgebung: 'test' } },
        { id: 'domain-hotels', name: 'Hotels', zustand: { aktiv: false, grund: 'ohne-zugang' } },
      ],
      JETZT,
    )
    const flights = board.checks?.find((teil) => teil.id === 'domain-flights')
    assert.equal(board.status, 'foundation_only')
    assert.equal(providerOpsKarteIstGruen(board), false)
    assert.equal(istUeberzogenerGesamtClaim(board), false)
    assert.equal(sichtbarerKartenClaim(board), 'Provider-Ops – Nur Foundation')
    assert.equal(flights?.status, 'available')
    assert.equal(providerOpsKarteIstGruen(flights!), true)
    assert.match(board.doesNotProve, /Echte Provider/)
  })

  test('In-Memory Cost Guard ist nicht globales Budget', () => {
    const guard = bewerteCostGuard(JETZT)
    assert.equal(guard.status, 'foundation_only')
    assert.equal(providerOpsKarteIstGruen(guard), false)
    assert.match(guard.summary, /Kein globales, persistentes Budget/)
    assert.doesNotMatch(guard.summary, /Budget geschützt|Kostenlimit aktiv/)
  })

  test('Kill-Switch-Form ist keine persistente Enforcement', () => {
    const kill = bewerteKillSwitch({ vercelEnv: 'production', nowMs: JETZT })
    assert.equal(kill.status, 'foundation_only')
    assert.equal(providerOpsKarteIstGruen(kill), false)
    assert.match(kill.summary, /persistente Durchsetzung ist nicht belegt/)
    assert.equal(kill.metadata?.vercelEnv, 'production')
  })

  test('fehlender Provider wird nicht live/healthy', () => {
    const check = domainCheckAusZustand(
      { id: 'domain-hotels', name: 'Hotels', zustand: { aktiv: false, grund: 'ohne-zugang' } },
      JETZT,
      new Date(JETZT).toISOString(),
    )
    assert.equal(check.status, 'not_configured')
    assert.equal(providerOpsKarteIstGruen(check), false)
    assert.doesNotMatch(check.summary, /live|healthy|Production bereit/i)
  })

  test('leere Usage ist empty, keine 0-USD-Lüge', () => {
    const usage = bewerteModelUsage({
      nowMs: JETZT,
      usage: { ok: true, zeilen: 0, kostenMikroUsd: 0, juengsteCreatedAt: null },
    })
    assert.equal(usage.status, 'empty')
    assert.equal(providerOpsKarteIstGruen(usage), false)
    assert.match(usage.summary, /keine 0-USD-Budgetaussage/)
  })

  test('Usage-Fehler ist unavailable, nicht empty', () => {
    const usage = bewerteModelUsage({
      nowMs: JETZT,
      usage: { ok: false, timeout: true, message: 'timeout' },
    })
    assert.equal(usage.status, 'unavailable')
    assert.equal(providerOpsKarteIstGruen(usage), false)
    assert.match(usage.summary, /kein leeres Kostenprotokoll/)
  })

  test('alte Evidence ist stale und nicht grün', () => {
    const freshness = berechneFreshness({
      checkedAt: new Date(JETZT).toISOString(),
      nowMs: JETZT + PROVIDER_OPS_BOARD_TTL_MS['provider-ops'] + 1,
      ttlMs: PROVIDER_OPS_BOARD_TTL_MS['provider-ops'],
    })
    assert.equal(freshness.state, 'stale')
    assert.equal(
      providerOpsKarteIstGruen({ id: 'domain-flights', status: 'available', freshness }),
      false,
    )
  })

  test('Teilfehler der Usage lässt Provider-Ops unberührt', async () => {
    leereProviderOpsBoardCache()
    const bericht = await sammleProviderOpsBoard({
      nowMs: () => JETZT,
      vercelEnv: () => 'preview',
      domainZustaende: () => [
        { id: 'domain-flights', name: 'Flights', zustand: { aktiv: false, grund: 'abgeschaltet' } },
      ],
      liesModelUsage: async () => {
        throw Object.assign(new Error('timeout'), { timeout: true })
      },
    })
    assert.equal(providerOpsBoardIdsVollstaendig(bericht), true)
    assert.equal(bericht.items.find((item) => item.id === 'provider-ops')?.status, 'foundation_only')
    assert.equal(bericht.items.find((item) => item.id === 'model-usage')?.status, 'unavailable')
    assert.deepEqual(bericht.writeActions, [])
  })

  test('Status hat textliche Namen', () => {
    assert.equal(PROVIDER_OPS_BOARD_STATUS_LABEL.foundation_only, 'Nur Foundation')
    assert.equal(PROVIDER_OPS_BOARD_STATUS_LABEL.empty, 'Keine Einträge')
    assert.deepEqual([...PROVIDER_OPS_BOARD_STATUSES], [
      'available',
      'foundation_only',
      'disabled',
      'not_configured',
      'unknown',
      'unavailable',
      'empty',
    ])
  })

  test('keine Write-Aktionen', () => {
    assert.deepEqual(PROVIDER_OPS_BOARD_WRITE_ACTIONS, [])
  })
})

describe('Provider-Ops-Board Verträge', () => {
  const wurzel = process.cwd()

  test('Admin-Route verlangt Betrieb-Lesen, ist GET-only und ohne Writes', () => {
    const route = readFileSync(join(wurzel, 'app/api/admin/provider-ops/route.ts'), 'utf8')
    assert.match(route, /from '@\/lib\/auth\/admin-guard'/)
    assert.match(
      route,
      /requireAdminApi\(\{\s*surface:\s*'api\/provider-ops',\s*capability:\s*'betrieb-lesen',?\s*\}\)/,
    )
    assert.match(route, /export async function GET/)
    assert.doesNotMatch(route, /export async function (POST|PUT|PATCH|DELETE)/)
    assert.doesNotMatch(route, /betrieb-schreiben|betrieb-eingreifen/)
    assert.doesNotMatch(route, /createServiceRole|SERVICE_ROLE|SUPABASE_SERVICE/)
  })

  test('Admin-Seite bleibt hinter requireAdminPage mit Betrieb-Lesen', () => {
    const seite = readFileSync(join(wurzel, 'app/(admin)/admin/provider-ops/page.tsx'), 'utf8')
    assert.match(
      seite,
      /requireAdminPage\(\{\s*surface:\s*'provider-ops',\s*capability:\s*'betrieb-lesen'\s*\}\)/,
    )
  })

  test('Client-Board darf keine Management-API-URL, Secrets oder Writes enthalten', () => {
    const board = readFileSync(join(wurzel, 'components/admin/provider-ops/ProviderOpsBoard.tsx'), 'utf8')
    assert.match(board, /PROVIDER_OPS_BOARD_API_PFAD/)
    assert.doesNotMatch(board, /api\.vercel\.com|api\.github\.com|duffel\.com|infomaniak\.com\/api/)
    assert.doesNotMatch(board, /method:\s*['"]POST['"]|method:\s*['"]PATCH['"]|method:\s*['"]DELETE['"]/)
    assert.doesNotMatch(board, /DUFFEL_|GITHUB_TOKEN|SUPABASE_ACCESS_TOKEN|INFOMANIAK/)
  })

  test('Runtime nutzt S1-Vertrag und keine Service-Role', () => {
    const runtime = readFileSync(join(wurzel, 'lib/admin/provider-ops-board/runtime.ts'), 'utf8')
    assert.match(runtime, /from '@\/lib\/provider-ops'/)
    assert.match(runtime, /from\('model_usage'\)/)
    assert.match(runtime, /select\('created_at,kosten_mikro_usd'\)/)
    assert.doesNotMatch(runtime, /createServiceRole|SERVICE_ROLE|DUFFEL_ACCESS_TOKEN/)
    assert.equal(PROVIDER_OPS_BOARD_API_PFAD, '/api/admin/provider-ops')
  })
})
