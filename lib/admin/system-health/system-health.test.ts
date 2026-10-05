import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import {
  bewerteApp,
  bewerteSupabaseAppZugriff,
  githubNichtKonfiguriert,
  vercelNichtKonfiguriert,
} from './bewertung'
import { berechneFreshness } from './freshness'
import {
  leereSystemHealthCache,
  leseAppRuntime,
  sammleSystemHealth,
  systemHealthIdsVollstaendig,
} from './sammeln'
import {
  FRESHNESS_STATES,
  HEALTH_STATUSES,
  HEALTH_STATUS_LABEL,
  SYSTEM_HEALTH_API_PFAD,
  SYSTEM_HEALTH_TTL_MS,
  SYSTEM_HEALTH_WRITE_ACTIONS,
  healthKarteIstGruen,
  istUeberzogenerGesamtClaim,
  sichtbarerKartenClaim,
} from './typen'

const JETZT = Date.parse('2026-08-24T03:00:00.000Z')

describe('System Health Bewertung', () => {
  test('Prozess-Antwort macht nur den App-Prozess-Sub-Check healthy, nicht App / Deployment', () => {
    const app = bewerteApp(
      { vercelEnv: 'preview', commitSha: 'abc1234', deploymentId: 'dpl_1', region: 'fra1' },
      JETZT,
    )
    const prozess = app.checks?.find((teil) => teil.id === 'app-prozess')
    const deployment = app.checks?.find((teil) => teil.id === 'app-deployment')
    assert.equal(app.status, 'unknown')
    assert.equal(app.name, 'App / Deployment')
    assert.equal(sichtbarerKartenClaim(app), 'App / Deployment – Unbekannt')
    assert.equal(healthKarteIstGruen(app), false)
    assert.equal(istUeberzogenerGesamtClaim(app), false)
    assert.equal(prozess?.status, 'healthy')
    assert.equal(healthKarteIstGruen(prozess!), true)
    assert.equal(deployment?.status, 'unknown')
    assert.equal(healthKarteIstGruen(deployment!), false)
    assert.match(app.doesNotProve, /Deployment-Health/)
  })

  test('fehlende Quelle ist not_configured und niemals healthy', () => {
    const supabase = bewerteSupabaseAppZugriff({ configured: false, nowMs: JETZT })
    const github = githubNichtKonfiguriert(JETZT)
    assert.equal(supabase.status, 'not_configured')
    assert.equal(github.status, 'not_configured')
    assert.equal(healthKarteIstGruen(supabase), false)
    assert.equal(healthKarteIstGruen(github), false)
  })

  test('Timeout und Fehler machen nur den App-Datenzugriff unavailable', () => {
    const timeout = bewerteSupabaseAppZugriff({
      configured: true,
      ping: { ok: false, timeout: true, message: 'timeout' },
      nowMs: JETZT,
    })
    const fehler = bewerteSupabaseAppZugriff({
      configured: true,
      ping: { ok: false, message: 'connection refused' },
      nowMs: JETZT,
    })
    assert.equal(timeout.status, 'not_configured')
    assert.equal(fehler.status, 'not_configured')
    assert.equal(healthKarteIstGruen(timeout), false)
    assert.equal(healthKarteIstGruen(fehler), false)
    assert.equal(
      timeout.checks?.find((teil) => teil.id === 'supabase-app-datenzugriff')?.status,
      'unavailable',
    )
    assert.equal(
      fehler.checks?.find((teil) => teil.id === 'supabase-app-datenzugriff')?.status,
      'unavailable',
    )
  })

  test('alte Evidence ist stale und nicht grün', () => {
    const frisch = bewerteApp(
      { vercelEnv: 'preview', commitSha: 'abc', deploymentId: null, region: null },
      JETZT,
    )
    const freshness = berechneFreshness({
      checkedAt: frisch.checkedAt,
      nowMs: JETZT + SYSTEM_HEALTH_TTL_MS.app + 1,
      ttlMs: SYSTEM_HEALTH_TTL_MS.app,
    })
    assert.equal(freshness.state, 'stale')
    assert.equal(healthKarteIstGruen({ status: 'healthy', freshness }), false)
  })

  test('Teilfehler eines Systems lässt die anderen Karten unberührt', async () => {
    leereSystemHealthCache()
    const bericht = await sammleSystemHealth({
      nowMs: () => JETZT,
      appRuntime: () => ({
        vercelEnv: 'preview',
        commitSha: 'abc',
        deploymentId: null,
        region: null,
      }),
      supabaseConfigured: () => true,
      pingSupabase: async () => {
        throw Object.assign(new Error('timeout'), { timeout: true })
      },
    })
    assert.equal(systemHealthIdsVollstaendig(bericht), true)
    const app = bericht.items.find((item) => item.id === 'app')
    const supabase = bericht.items.find((item) => item.id === 'supabase')
    const vercel = bericht.items.find((item) => item.id === 'vercel')
    assert.equal(app?.status, 'unknown')
    assert.equal(healthKarteIstGruen(app!), false)
    assert.equal(app?.checks?.find((teil) => teil.id === 'app-prozess')?.status, 'healthy')
    assert.equal(supabase?.status, 'not_configured')
    assert.equal(
      supabase?.checks?.find((teil) => teil.id === 'supabase-app-datenzugriff')?.status,
      'unavailable',
    )
    assert.equal(vercel?.status, 'not_configured')
    assert.equal(healthKarteIstGruen(vercel!), false)
  })

  test('Status hat einen textlichen Namen, nicht nur Farbe', () => {
    assert.equal(HEALTH_STATUS_LABEL.healthy, 'Gesund')
    assert.equal(HEALTH_STATUS_LABEL.not_configured, 'Nicht konfiguriert')
    assert.equal(HEALTH_STATUS_LABEL.unavailable, 'Nicht erreichbar')
    assert.equal(HEALTH_STATUS_LABEL.unknown, 'Unbekannt')
  })

  test('Slice-B-Pfad deklariert keine Write-Aktionen', async () => {
    assert.deepEqual(SYSTEM_HEALTH_WRITE_ACTIONS, [])
    leereSystemHealthCache()
    const bericht = await sammleSystemHealth({
      nowMs: () => JETZT,
      appRuntime: () => ({
        vercelEnv: null,
        commitSha: null,
        deploymentId: null,
        region: null,
      }),
      supabaseConfigured: () => false,
      pingSupabase: async () => ({ ok: true }),
    })
    assert.deepEqual(bericht.writeActions, [])
    assert.equal(bericht.items.find((item) => item.id === 'supabase')?.status, 'not_configured')
  })

  test('airports-Read erzeugt nicht Supabase – Gesund', () => {
    const supabase = bewerteSupabaseAppZugriff({
      configured: true,
      ping: { ok: true },
      nowMs: JETZT,
    })
    const zugriff = supabase.checks?.find((teil) => teil.id === 'supabase-app-datenzugriff')
    const management = supabase.checks?.find((teil) => teil.id === 'supabase-management')
    assert.equal(supabase.name, 'Supabase')
    assert.equal(supabase.status, 'not_configured')
    assert.equal(sichtbarerKartenClaim(supabase), 'Supabase – Nicht konfiguriert')
    assert.equal(healthKarteIstGruen(supabase), false)
    assert.equal(istUeberzogenerGesamtClaim(supabase), false)
    assert.equal(zugriff?.name, 'Supabase App-Datenzugriff')
    assert.equal(zugriff?.status, 'healthy')
    assert.equal(healthKarteIstGruen(zugriff!), true)
    assert.equal(management?.status, 'not_configured')
    assert.match(zugriff!.proves, /airports/)
    assert.match(zugriff!.doesNotProve, /Management/)
  })

  test('VERCEL_ENV allein macht weder App/Deployment noch Vercel healthy', () => {
    const runtime = leseAppRuntime({
      VERCEL_ENV: 'preview',
      VERCEL_GIT_COMMIT_SHA: 'abc1234',
      VERCEL_DEPLOYMENT_ID: 'dpl_1',
    })
    const app = bewerteApp(runtime, JETZT)
    const vercel = vercelNichtKonfiguriert(JETZT)
    assert.equal(runtime.vercelEnv, 'preview')
    assert.equal(app.status, 'unknown')
    assert.equal(healthKarteIstGruen(app), false)
    assert.equal(app.metadata?.vercelEnv, 'preview')
    assert.equal(app.checks?.find((teil) => teil.id === 'app-deployment')?.status, 'unknown')
    assert.equal(vercel.status, 'not_configured')
    assert.equal(healthKarteIstGruen(vercel), false)
    assert.match(vercel.summary, /kein freigegebenes Vercel-Management-Token/i)
  })

  test('Status- und Freshness-Werte bleiben geschlossen', () => {
    assert.deepEqual([...HEALTH_STATUSES], [
      'healthy',
      'degraded',
      'unavailable',
      'unknown',
      'not_configured',
    ])
    assert.deepEqual([...FRESHNESS_STATES], ['fresh', 'stale', 'unknown'])
  })
})

describe('System Health Verträge', () => {
  const wurzel = process.cwd()

  test('Admin-Route verlangt Betrieb-Lesen, ist GET-only und ohne Writes', () => {
    const route = readFileSync(join(wurzel, 'app/api/admin/system-health/route.ts'), 'utf8')
    assert.match(route, /from '@\/lib\/auth\/admin-guard'/)
    assert.match(route, /requireAdminApi\(\{\s*surface:\s*'api\/system-health',\s*capability:\s*'betrieb-lesen',?\s*\}\)/)
    assert.match(route, /export async function GET/)
    assert.doesNotMatch(route, /export async function (POST|PUT|PATCH|DELETE)/)
    assert.doesNotMatch(route, /betrieb-schreiben|betrieb-eingreifen/)
    assert.doesNotMatch(route, /createServiceRole|SERVICE_ROLE|SUPABASE_SERVICE/)
  })

  test('Admin-Seite bleibt hinter requireAdminPage mit Betrieb-Lesen', () => {
    const seite = readFileSync(join(wurzel, 'app/(admin)/admin/system-health/page.tsx'), 'utf8')
    assert.match(seite, /requireAdminPage\(\{\s*surface:\s*'system-health',\s*capability:\s*'betrieb-lesen'\s*\}\)/)
  })

  test('Client-Board darf keine Management-API-URL, Secrets oder Writes enthalten', () => {
    const board = readFileSync(
      join(wurzel, 'components/admin/system-health/SystemHealthBoard.tsx'),
      'utf8',
    )
    assert.match(board, /SYSTEM_HEALTH_API_PFAD/)
    assert.doesNotMatch(board, /api\.vercel\.com|api\.github\.com|supabase\.co\/v1|infomaniak\.com\/api/)
    assert.doesNotMatch(board, /method:\s*['"]POST['"]|method:\s*['"]PATCH['"]|method:\s*['"]DELETE['"]/)
    assert.doesNotMatch(board, /VERCEL_TOKEN|GITHUB_TOKEN|SUPABASE_ACCESS_TOKEN|INFOMANIAK/)
    assert.match(board, /HEALTH_STATUS_LABEL/)
    assert.match(board, /FRESHNESS_LABEL/)
  })

  test('Runtime und Sammler nutzen keine Management-Tokens', () => {
    const runtime = readFileSync(join(wurzel, 'lib/admin/system-health/runtime.ts'), 'utf8')
    const sammeln = readFileSync(join(wurzel, 'lib/admin/system-health/sammeln.ts'), 'utf8')
    for (const quelle of [runtime, sammeln]) {
      assert.doesNotMatch(quelle, /VERCEL_TOKEN|GITHUB_TOKEN|SUPABASE_ACCESS_TOKEN|INFOMANIAK_/)
      assert.doesNotMatch(quelle, /createServiceRole|SERVICE_ROLE/)
    }
    assert.match(runtime, /from\('airports'\)\.select\('iata'\)/)
    assert.equal(SYSTEM_HEALTH_API_PFAD, '/api/admin/system-health')
  })
})
