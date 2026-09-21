import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import {
  bewerteApp,
  bewerteSupabaseAppZugriff,
  githubNichtKonfiguriert,
  infomaniakNichtKonfiguriert,
  vercelNichtKonfiguriert,
  wendeEvidenceAlterAn,
} from '@/lib/admin/system-health/bewertung'
import { SYSTEM_HEALTH_AUDIT_BERICHT } from '@/lib/admin/system-health/fixtures'
import { systemHealthIdsVollstaendig } from '@/lib/admin/system-health/sammeln'
import {
  istUeberzogenerGesamtClaim,
  type SystemHealthBericht,
  type SystemHealthCheck,
} from '@/lib/admin/system-health/typen'
import { CAPABILITIES } from '@/lib/auth/roles'
import { ADMIN_EHRLICHE_TEXTE, ADMIN_NAECHSTE_SCHRITTE } from '@/lib/admin/ehrliche-zustaende'
import {
  alsUnvertrautenText,
  enthältVerboteneAltersbehauptung,
  leiteSystemHealthInsights,
  projiziereBreakGlassSystemHealth,
} from './system-health-insights'
import type { AnalystAccess, AnalystBericht } from './typen'
import {
  ANALYST_DENIAL_TO_OBSERVED,
  ANALYST_INSIGHT_KIND,
  ANALYST_MATERIALITY,
  ANALYST_SAFE_HREFS,
} from './typen'

const JETZT = Date.parse('2026-09-21T12:00:00.000Z')
const ROLL = { status: 'allowed' as const, grant: 'role' as const }
const NOTZUGANG = { status: 'allowed' as const, grant: 'break-glass' as const }
const ALTER_30S = /höchstens 30s|hoechstens 30s|at most 30s old/i
const SITZUNG = /in dieser Sitzung/

function synthetisch(nowMs = JETZT): SystemHealthBericht {
  return {
    checkedAt: new Date(nowMs).toISOString(),
    writeActions: [],
    items: [
      bewerteApp(
        { vercelEnv: 'preview', commitSha: 'abc1234', deploymentId: 'dpl_syn', region: 'fra1' },
        nowMs,
      ),
      vercelNichtKonfiguriert(nowMs),
      bewerteSupabaseAppZugriff({ configured: true, ping: { ok: true }, nowMs }),
      githubNichtKonfiguriert(nowMs),
      infomaniakNichtKonfiguriert(nowMs),
    ],
  }
}

function mitZugriff(
  bericht: SystemHealthBericht,
  aenderung: Partial<SystemHealthCheck>,
): SystemHealthBericht {
  return {
    ...bericht,
    items: bericht.items.map((item) => {
      if (item.id !== 'supabase') return item
      return {
        ...item,
        checks: item.checks?.map((check) =>
          check.id === 'supabase-app-datenzugriff' ? { ...check, ...aenderung } : check,
        ),
      }
    }),
  }
}

function mitProzess(
  bericht: SystemHealthBericht,
  aenderung: Partial<SystemHealthCheck>,
): SystemHealthBericht {
  return {
    ...bericht,
    items: bericht.items.map((item) => {
      if (item.id !== 'app') return item
      return {
        ...item,
        checks: item.checks?.map((check) =>
          check.id === 'app-prozess' ? { ...check, ...aenderung } : check,
        ),
      }
    }),
  }
}

function leite(access: AnalystAccess, bericht: SystemHealthBericht | null, nowMs = JETZT, sourceFailed = false) {
  return leiteSystemHealthInsights({ access, bericht, nowMs, sourceFailed })
}

function texte(bericht: AnalystBericht): string {
  return [
    ADMIN_EHRLICHE_TEXTE.aktuelleHinweiseHinweis,
    ...bericht.insights.flatMap((insight) => [
      insight.title,
      insight.explanation,
      insight.proves,
      insight.doesNotProve,
      ...insight.limitations,
    ]),
  ].join('\n')
}

function assertKeinUniversal30s(bericht: AnalystBericht) {
  assert.equal(enthältVerboteneAltersbehauptung(texte(bericht)), false)
  assert.doesNotMatch(texte(bericht), ALTER_30S)
}

function assertKind(bericht: AnalystBericht) {
  assert.deepEqual(bericht.writeActions, [])
  assert.deepEqual(bericht.modelExplanation, { enabled: false })
  for (const insight of bericht.insights) {
    assert.equal(insight.kind, ANALYST_INSIGHT_KIND)
    assert.ok(ANALYST_MATERIALITY.includes(insight.materiality))
    assert.ok(insight.attribution === 'none' || insight.attribution === 'process-recent' || insight.attribution === 'not_attributed')
    if (insight.next) {
      assert.ok((ANALYST_SAFE_HREFS as readonly string[]).includes(insight.next.href))
      assert.equal(insight.next.kind, 'investigate')
    }
  }
}

describe('System-Health-Analyst (synthetic fixtures)', () => {
  test('T-healthy-fresh: genau ein none, process-recent, keine Session, keine Eltern-Grün', () => {
    const quelle = synthetisch()
    const bericht = leite(ROLL, quelle)
    assert.equal(bericht.insights.length, 1)
    assert.equal(bericht.insights[0]?.materiality, 'none')
    assert.equal(bericht.insights[0]?.next, null)
    assert.equal(bericht.observationScope, 'process-recent')
    assert.equal(bericht.access.status, 'allowed')
    assert.equal(systemHealthIdsVollstaendig(quelle), true)
    for (const id of ['vercel', 'github', 'infomaniak', 'supabase-management']) {
      assert.ok(bericht.coverage.notConfigured.includes(id), `expected ${id} in notConfigured`)
    }
    assert.equal(quelle.items.some((item) => istUeberzogenerGesamtClaim(item)), false)
    assert.equal(
      bericht.insights.some((insight) => insight.sourceCheckId === null && insight.observed === 'healthy' && insight.sourceItemId !== 'system-health-collection'),
      false,
    )
    assert.doesNotMatch(texte(bericht), SITZUNG)
    assertKind(bericht)
    assertKeinUniversal30s(bericht)
  })

  test('T-unavailable: eine Attention, process-recent, kein Sitzungsclaim, doesNotProve nicht umgedeutet', () => {
    const basis = SYSTEM_HEALTH_AUDIT_BERICHT
    const zugriff = basis.items
      .find((item) => item.id === 'supabase')
      ?.checks?.find((check) => check.id === 'supabase-app-datenzugriff')
    assert.equal(zugriff?.status, 'unavailable')
    const sauber = mitZugriff(synthetisch(), {
      status: 'unavailable',
      summary: zugriff!.summary,
      proves: zugriff!.proves,
      doesNotProve: zugriff!.doesNotProve,
    })
    const bericht = leite(ROLL, sauber)
    const attention = bericht.insights.filter((insight) => insight.materiality === 'attention')
    assert.equal(attention.length, 1)
    assert.equal(attention[0]?.observed, 'unavailable')
    assert.equal(attention[0]?.next?.href, '/admin/system-health')
    assert.equal(attention[0]?.attribution, 'process-recent')
    assert.doesNotMatch(texte(bericht), SITZUNG)
    assert.match(attention[0]!.doesNotProve, /Management|Plattform/)
    assert.doesNotMatch(attention[0]!.doesNotProve, /Supabase is down|gesamt down/i)
    assertKind(bericht)
  })

  test('T-degraded: Attention steht vor Coverage', () => {
    const quelle = mitZugriff(synthetisch(), { status: 'degraded', summary: 'Synthetisch eingeschränkt.' })
    const bericht = leite(ROLL, quelle)
    assert.equal(bericht.insights[0]?.observed, 'degraded')
    assert.equal(bericht.insights[0]?.materiality, 'attention')
    const coverageIndex = bericht.insights.findIndex((insight) => insight.materiality === 'coverage')
    if (coverageIndex >= 0) {
      assert.ok(0 < coverageIndex)
    }
  })

  test('T-unknown-attempt: unknown zugriff ist coverage, nicht healthy', () => {
    const quelle = bewerteSupabaseAppZugriff({ configured: true, nowMs: JETZT })
    const zugriff = quelle.checks?.find((check) => check.id === 'supabase-app-datenzugriff')
    assert.equal(zugriff?.status, 'unknown')
    const bericht = leite(ROLL, {
      checkedAt: new Date(JETZT).toISOString(),
      writeActions: [],
      items: [
        bewerteApp({ vercelEnv: null, commitSha: null, deploymentId: null, region: null }, JETZT),
        vercelNichtKonfiguriert(JETZT),
        quelle,
        githubNichtKonfiguriert(JETZT),
        infomaniakNichtKonfiguriert(JETZT),
      ],
    })
    const ziel = bericht.insights.find((insight) => insight.sourceCheckId === 'supabase-app-datenzugriff')
    assert.ok(ziel)
    assert.equal(ziel!.observed, 'unknown')
    assert.notEqual(ziel!.observed, 'healthy')
    assert.equal(ziel!.materiality, 'coverage')
    assert.equal(ziel!.next?.href, '/admin/system-health')
  })

  test('T-missing-item: fehlendes github ergibt partial_failed, kein erfundenes healthy', () => {
    const voll = synthetisch()
    const ohneGithub: SystemHealthBericht = {
      ...voll,
      items: voll.items.filter((item) => item.id !== 'github'),
    }
    assert.equal(systemHealthIdsVollstaendig(ohneGithub), false)
    const bericht = leite(ROLL, ohneGithub)
    const partial = bericht.insights.find((insight) => insight.observed === 'partial_failed')
    assert.ok(partial)
    assert.equal(partial!.materiality, 'attention')
    assert.equal(
      bericht.insights.some((insight) => insight.sourceItemId === 'github' && insight.observed === 'healthy'),
      false,
    )
  })

  test('T-stale: stale healthy bleibt Attention, checkedAt unverändert, kein 30s-Claim', () => {
    const ursprung = new Date(JETZT - 90_000).toISOString()
    const alt = synthetisch(JETZT - 90_000)
    const gereift: SystemHealthBericht = {
      ...alt,
      items: alt.items.map((item) => wendeEvidenceAlterAn(item, JETZT)),
    }
    const zugriff = gereift.items
      .find((item) => item.id === 'supabase')
      ?.checks?.find((check) => check.id === 'supabase-app-datenzugriff')
    assert.ok(zugriff)
    assert.ok((zugriff!.freshness.ageMs ?? 0) > zugriff!.freshness.ttlMs)
    assert.equal(zugriff!.freshness.state, 'stale')
    const bericht = leite(ROLL, { ...gereift, checkedAt: ursprung }, JETZT)
    const ziel = bericht.insights.find((insight) => insight.sourceCheckId === 'supabase-app-datenzugriff')
    assert.ok(ziel)
    assert.equal(ziel!.freshness.state, 'stale')
    assert.equal(ziel!.materiality, 'attention')
    assert.notEqual(ziel!.materiality, 'none')
    assert.equal(ziel!.checkedAt, ursprung)
    assert.equal(bericht.sourceCheckedAt, ursprung)
    assertKeinUniversal30s(bericht)
  })

  test('T-age-older-than-cache: 90s original checkedAt, Frische aus nowMs, kein 30s-Claim', () => {
    const ursprung = new Date(JETZT - 90_000).toISOString()
    const alt = synthetisch(JETZT - 90_000)
    const bericht = leite(ROLL, { ...alt, checkedAt: ursprung }, JETZT)
    assert.equal(bericht.sourceCheckedAt, ursprung)
    for (const insight of bericht.insights) {
      assert.equal(insight.checkedAt, ursprung)
    }
    const zugriff = bericht.insights.find((insight) => insight.sourceCheckId === 'supabase-app-datenzugriff')
    assert.ok(zugriff)
    assert.equal(zugriff!.freshness.state, 'stale')
    assert.ok((zugriff!.freshness.ageMs ?? 0) > 30_000)
    assertKeinUniversal30s(bericht)
  })

  test('T-age-missing-checkedAt: missing → unknown, ageMs null, kein 30s-Claim', () => {
    const roh = synthetisch()
    const ohneZeit = {
      ...roh,
      checkedAt: '',
      items: roh.items.map((item) => ({ ...item, checkedAt: '' })),
    } as SystemHealthBericht
    const bericht = leite(ROLL, ohneZeit)
    assert.ok(bericht.insights.length > 0)
    for (const insight of bericht.insights) {
      assert.equal(insight.freshness.state, 'unknown')
      assert.equal(insight.freshness.ageMs, null)
    }
    assertKeinUniversal30s(bericht)
  })

  test('T-age-invalid-checkedAt: ungültiger Zeitpunkt → unknown, kein 30s-Claim', () => {
    const roh = synthetisch()
    const ungueltig = {
      ...roh,
      checkedAt: 'gestern-vormittag',
      items: roh.items.map((item) => ({ ...item, checkedAt: 'gestern-vormittag' })),
    }
    const bericht = leite(ROLL, ungueltig)
    for (const insight of bericht.insights) {
      assert.equal(insight.freshness.state, 'unknown')
      assert.equal(insight.freshness.ageMs, null)
    }
    assert.equal(bericht.sourceCheckedAt, 'gestern-vormittag')
    assertKeinUniversal30s(bericht)
  })

  test('T-denied: forbidden/unauthenticated/aal2-required laden nicht und haben keinen Hop', () => {
    for (const denial of ['forbidden', 'unauthenticated', 'aal2-required'] as const) {
      const bericht = leite({ status: 'denied', denial }, null)
      assert.equal(bericht.access.status, 'denied')
      if (bericht.access.status === 'denied') assert.equal(bericht.access.denial, denial)
      assert.equal(bericht.observationScope, 'none')
      assert.equal(bericht.insights[0]?.observed, 'access_denied')
      assert.equal(bericht.insights[0]?.next, null)
      assert.equal(bericht.insights[0]?.materiality, 'attention')
      assert.match(bericht.insights[0]!.explanation, /betrieb-lesen-Prüfung/)
      assert.doesNotMatch(texte(bericht), /alle Systeme|0 Vorfälle|all-clear/i)
    }
  })

  test('T-lookup-failed: unavailable-Kopie, nicht empty-zero, nicht abgemeldet', () => {
    const bericht = leite({ status: 'denied', denial: 'lookup-failed' }, null)
    assert.equal(bericht.insights[0]?.observed, 'lookup-failed')
    assert.equal(bericht.observationScope, 'none')
    assert.match(bericht.insights[0]!.explanation, /nicht geprüft|nicht gelesen/)
    assert.doesNotMatch(bericht.insights[0]!.title, /Nicht angemeldet|logged out/)
    assert.doesNotMatch(bericht.insights[0]!.explanation, /Nicht angemeldet\.|logged out/)
    assert.doesNotMatch(texte(bericht), /0 Vorfälle|alles ruhig/i)
  })

  test('T-aal-lookup-failed: denial bleibt, observed ist lookup-failed', () => {
    const bericht = leite({ status: 'denied', denial: 'aal-lookup-failed' }, null)
    assert.equal(bericht.access.status, 'denied')
    if (bericht.access.status === 'denied') {
      assert.equal(bericht.access.denial, 'aal-lookup-failed')
    }
    assert.equal(bericht.insights[0]?.observed, ANALYST_DENIAL_TO_OBSERVED['aal-lookup-failed'])
    assert.equal(bericht.insights[0]?.observed, 'lookup-failed')
    assert.equal(bericht.observationScope, 'none')
  })

  test('T-dedupe: supabase parent + unavailable zugriff ergibt eine Insight', () => {
    const quelle = mitZugriff(synthetisch(), { status: 'unavailable' })
    const bericht = leite(ROLL, quelle)
    const supabase = bericht.insights.filter(
      (insight) => insight.sourceItemId === 'supabase' || insight.sourceCheckId === 'supabase-app-datenzugriff',
    )
    assert.equal(supabase.filter((insight) => insight.observed === 'unavailable').length, 1)
    assert.equal(
      bericht.insights.filter((insight) => insight.sourceItemId === 'supabase' && insight.sourceCheckId === null).length,
      0,
    )
  })

  test('T-expected-nc: höchstens eine Coverage für erwartete not_configured, kein Token-Auftrag', () => {
    const nowMs = JETZT
    const quelle: SystemHealthBericht = {
      checkedAt: new Date(nowMs).toISOString(),
      writeActions: [],
      items: [
        bewerteApp({ vercelEnv: null, commitSha: null, deploymentId: null, region: null }, nowMs),
        vercelNichtKonfiguriert(nowMs),
        bewerteSupabaseAppZugriff({ configured: false, nowMs }),
        githubNichtKonfiguriert(nowMs),
        infomaniakNichtKonfiguriert(nowMs),
      ],
    }
    const bericht = leite(ROLL, quelle)
    const coverage = bericht.insights.filter((insight) => insight.materiality === 'coverage')
    assert.ok(coverage.length <= 1)
    assert.doesNotMatch(texte(bericht), /Token anlegen|create a token|bitte.*Token/i)
    assert.equal(coverage.every((insight) => insight.next === null), true)
  })

  test('T-overclaim: grüne Eltern app/supabase werden nicht emittiert', () => {
    const roh = synthetisch()
    const ueberzogen: SystemHealthBericht = {
      ...roh,
      items: roh.items.map((item) =>
        item.id === 'app' || item.id === 'supabase' ? { ...item, status: 'healthy' } : item,
      ),
    }
    assert.equal(ueberzogen.items.some((item) => istUeberzogenerGesamtClaim(item)), true)
    const bericht = leite(ROLL, ueberzogen)
    assert.equal(
      bericht.insights.some(
        (insight) =>
          (insight.sourceItemId === 'app' || insight.sourceItemId === 'supabase') &&
          insight.sourceCheckId === null &&
          insight.observed === 'healthy',
      ),
      false,
    )
  })

  test('T-order: deterministische Reihenfolge und stabile IDs', () => {
    const quelle = mitProzess(mitZugriff(synthetisch(JETZT - 90_000), { status: 'unavailable' }), {
      status: 'healthy',
      freshness: { state: 'stale', ageMs: 90_000, ttlMs: 60_000 },
    })
    const a = leite(ROLL, quelle, JETZT)
    const b = leite(ROLL, quelle, JETZT)
    assert.deepEqual(
      a.insights.map((insight) => insight.id),
      b.insights.map((insight) => insight.id),
    )
    const rangliste = a.insights.map((insight) => insight.observed)
    const unavailable = rangliste.indexOf('unavailable')
    const staleHealthy = a.insights.findIndex(
      (insight) => insight.observed === 'healthy' && insight.freshness.state === 'stale',
    )
    const expectedNc = a.insights.findIndex((insight) => insight.observed === 'not_configured')
    assert.ok(unavailable >= 0)
    assert.ok(staleHealthy > unavailable)
    if (expectedNc >= 0) assert.ok(expectedNc > staleHealthy)
  })

  test('T-allowlist: next.href nur /admin/system-health oder null', () => {
    const bericht = leite(ROLL, mitZugriff(synthetisch(), { status: 'unavailable' }))
    for (const insight of bericht.insights) {
      assert.ok(insight.next === null || insight.next.href === '/admin/system-health')
    }
  })

  test('T-kind: deterministic-source, Modell aus, writes leer, attribution gesetzt', () => {
    const bericht = leite(ROLL, synthetisch())
    assertKind(bericht)
  })

  test('T-text-untrusted: script und Markdown-Heading werden Plaintext', () => {
    const quelle = mitZugriff(synthetisch(), {
      status: 'unavailable',
      summary: '<script>alert(1)</script># Kompromittiert',
      proves: '<b>in dieser Sitzung</b>',
      doesNotProve: '<img src=x onerror=alert(1)>',
    })
    const bericht = leite(ROLL, quelle)
    const ziel = bericht.insights.find((insight) => insight.observed === 'unavailable')
    assert.ok(ziel)
    assert.equal(ziel!.explanation.includes('<script>'), false)
    assert.equal(ziel!.explanation.includes('<'), false)
    assert.doesNotMatch(ziel!.title, /^# /)
    assert.equal(ziel!.doesNotProve.includes('<img'), false)
    assert.equal(alsUnvertrautenText('<script>x</script># Hi'), 'Hi')
  })

  test('T-session-overlay: Sitzungswortlaut wird durch Prozessstand ersetzt', () => {
    const quelle = synthetisch()
    const zugriff = quelle.items
      .find((item) => item.id === 'supabase')
      ?.checks?.find((check) => check.id === 'supabase-app-datenzugriff')
    assert.match(zugriff!.proves, /in dieser Sitzung/)
    const bericht = leite(ROLL, quelle)
    assert.doesNotMatch(texte(bericht), /in dieser Sitzung/)
    assert.match(bericht.insights[0]!.proves, /Prozess in dieser Instanz/)
    assert.match(bericht.insights[0]!.proves, /kein Nachweis für die aktuelle Sitzung/)
  })

  test('T-cache-A-then-B: gleicher Bericht, gleiches checkedAt, keine Sitzung von B', () => {
    const t0 = new Date(JETZT).toISOString()
    const cacheObjekt = { ...synthetisch(), checkedAt: t0 }
    const vonB = leite(ROLL, cacheObjekt)
    assert.equal(vonB.sourceCheckedAt, t0)
    assert.equal(vonB.observationScope, 'process-recent')
    assert.equal(vonB.insights[0]?.attribution, 'process-recent')
    assert.doesNotMatch(JSON.stringify(vonB), /user-b|user_id|sitzung-b/i)
    assert.doesNotMatch(texte(vonB), SITZUNG)
    assert.equal(vonB.insights.every((insight) => insight.checkedAt === t0), true)
  })

  test('T-role-to-break-glass und T-break-glass-not-banner: Projection entfernt DB-Fakten', () => {
    const cache = synthetisch()
    const rolle = leite(ROLL, cache)
    assert.ok(rolle.insights.some((insight) => insight.materiality === 'none'))
    assert.equal(typeof projiziereBreakGlassSystemHealth, 'function')
    const projection = projiziereBreakGlassSystemHealth(cache)
    assert.ok(projection.notAttributed.includes('supabase-app-datenzugriff'))
    const glas = leite(NOTZUGANG, cache)
    assert.ok(glas.coverage.notAttributed.includes('supabase-app-datenzugriff'))
    assert.ok(glas.insights.some((insight) => insight.attribution === 'not_attributed'))
    assert.equal(
      glas.insights.some(
        (insight) =>
          insight.sourceCheckId === 'supabase-app-datenzugriff' &&
          (insight.observed === 'healthy' || insight.observed === 'unavailable') &&
          insight.attribution !== 'not_attributed',
      ),
      false,
    )
    assert.equal(
      glas.insights.some(
        (insight) =>
          (insight.materiality === 'attention' || insight.materiality === 'none') &&
          /airports|Datenzugriff/.test(`${insight.title} ${insight.explanation}`) &&
          insight.attribution !== 'not_attributed',
      ),
      false,
    )
  })

  test('T-stale-reage: wendeEvidenceAlterAn, checkedAt bleibt original, kein 30s-Claim', () => {
    const ursprungMs = JETZT - 90_000
    const ursprung = new Date(ursprungMs).toISOString()
    const roh = synthetisch(ursprungMs)
    const gereift: SystemHealthBericht = {
      checkedAt: ursprung,
      writeActions: [],
      items: roh.items.map((item) => wendeEvidenceAlterAn(item, JETZT)),
    }
    const bericht = leite(ROLL, gereift, JETZT)
    const ziel = bericht.insights.find((insight) => insight.sourceCheckId === 'supabase-app-datenzugriff')
    assert.ok(ziel)
    assert.equal(ziel!.freshness.state, 'stale')
    assert.equal(ziel!.checkedAt, ursprung)
    assert.equal(bericht.sourceCheckedAt, ursprung)
    assertKeinUniversal30s(bericht)
  })

  test('T-hint-no-universal-30s: Hinweis und Limitations der Altersfälle ohne 30s-Claim', () => {
    const faelle: AnalystBericht[] = [
      leite(ROLL, { ...synthetisch(JETZT - 90_000), checkedAt: new Date(JETZT - 90_000).toISOString() }, JETZT),
      leite(ROLL, { ...synthetisch(), checkedAt: '', items: synthetisch().items.map((item) => ({ ...item, checkedAt: '' })) } as SystemHealthBericht),
      leite(ROLL, { ...synthetisch(), checkedAt: 'kein-datum', items: synthetisch().items.map((item) => ({ ...item, checkedAt: 'kein-datum' })) }),
    ]
    for (const bericht of faelle) {
      assertKeinUniversal30s(bericht)
    }
    assert.doesNotMatch(ADMIN_EHRLICHE_TEXTE.aktuelleHinweiseHinweis, ALTER_30S)
  })

  test('T-no-security-fields: Analyst importiert keine Security-Events oder #494', () => {
    const wurzel = join(process.cwd(), 'lib/admin/analyst')
    const dateien = ['typen.ts', 'system-health-insights.ts', 'laden.ts', 'index.ts']
    const text = dateien.map((name) => readFileSync(join(wurzel, name), 'utf8')).join('\n')
    assert.doesNotMatch(text, /security_events/)
    assert.doesNotMatch(text, /api\/admin\/security\/list/)
    assert.doesNotMatch(text, /jetnity_internal/)
    assert.doesNotMatch(text, /security_event_producer_origin/)
  })

  test('T-no-new-capability: keine neue Capability', () => {
    assert.deepEqual(CAPABILITIES, [
      'betrieb-lesen',
      'betrieb-eingreifen',
      'konten-verwalten',
      'inhalte-moderieren',
      'konfiguration-verwalten',
    ])
    const text = readFileSync(join(process.cwd(), 'lib/admin/analyst/laden.ts'), 'utf8')
    assert.match(text, /betrieb-lesen/)
    assert.doesNotMatch(text, /analyst-lesen|copilot-ausfuehren/)
  })

  test('IA-R1 mixed-clock: item-checkedAt trägt Frische, Sammlung bleibt sourceCheckedAt', () => {
    const sammlung = JETZT
    const itemMs = JETZT - 90_000
    const itemZeit = new Date(itemMs).toISOString()
    const sammlungZeit = new Date(sammlung).toISOString()
    const roh = synthetisch(sammlung)
    const gemischt: SystemHealthBericht = {
      ...roh,
      checkedAt: sammlungZeit,
      items: roh.items.map((item) =>
        item.id === 'supabase'
          ? wendeEvidenceAlterAn({ ...item, checkedAt: itemZeit }, sammlung)
          : item,
      ),
    }
    const bericht = leite(ROLL, gemischt, sammlung)
    const zugriff = bericht.insights.find((insight) => insight.sourceCheckId === 'supabase-app-datenzugriff')
    assert.ok(zugriff)
    assert.equal(zugriff!.checkedAt, itemZeit)
    assert.equal(zugriff!.freshness.ageMs, 90_000)
    assert.equal(zugriff!.freshness.state, 'stale')
    assert.equal(bericht.sourceCheckedAt, sammlungZeit)
    assert.notEqual(zugriff!.checkedAt, bericht.sourceCheckedAt)
  })

  test('IA-R1 mixed-clock no-signal: airports-Zeit trägt Frische, Sammlung bleibt sourceCheckedAt', () => {
    const sammlung = JETZT
    const itemMs = JETZT - 30_000
    const itemZeit = new Date(itemMs).toISOString()
    const sammlungZeit = new Date(sammlung).toISOString()
    const roh = synthetisch(sammlung)
    const gemischt: SystemHealthBericht = {
      ...roh,
      checkedAt: sammlungZeit,
      items: roh.items.map((item) =>
        item.id === 'supabase' ? wendeEvidenceAlterAn({ ...item, checkedAt: itemZeit }, sammlung) : item,
      ),
    }
    const bericht = leite(ROLL, gemischt, sammlung)
    assert.equal(bericht.insights.length, 1)
    const ziel = bericht.insights[0]!
    assert.equal(ziel.title, ADMIN_EHRLICHE_TEXTE.aktuelleHinweiseKeinSignalTitel)
    assert.equal(ziel.sourceCheckId, 'supabase-app-datenzugriff')
    assert.equal(ziel.checkedAt, itemZeit)
    assert.equal(ziel.freshness.ageMs, 30_000)
    assert.equal(ziel.freshness.state, 'fresh')
    assert.equal(bericht.sourceCheckedAt, sammlungZeit)
    assert.notEqual(ziel.checkedAt, bericht.sourceCheckedAt)
  })

  test('IA-R1 item-local missing/invalid checkedAt: nur diese Beobachtung wird unknown', () => {
    const roh = synthetisch()
    const ohneItemZeit: SystemHealthBericht = {
      ...roh,
      items: roh.items.map((item) =>
        item.id === 'supabase' ? { ...item, checkedAt: '' } : item,
      ),
    }
    const ohne = leite(ROLL, ohneItemZeit)
    const fehlend = ohne.insights.find((insight) => insight.sourceCheckId === 'supabase-app-datenzugriff')
    assert.ok(fehlend)
    assert.equal(fehlend!.freshness.state, 'unknown')
    assert.equal(fehlend!.freshness.ageMs, null)
    assert.equal(ohne.sourceCheckedAt, roh.checkedAt)

    const ungueltig: SystemHealthBericht = {
      ...roh,
      items: roh.items.map((item) =>
        item.id === 'supabase' ? { ...item, checkedAt: 'nicht-parsebar' } : item,
      ),
    }
    const kaputt = leite(ROLL, ungueltig)
    const ziel = kaputt.insights.find((insight) => insight.sourceCheckId === 'supabase-app-datenzugriff')
    assert.ok(ziel)
    assert.equal(ziel!.freshness.state, 'unknown')
    assert.equal(ziel!.freshness.ageMs, null)
    assert.equal(ziel!.checkedAt, 'nicht-parsebar')
    assert.equal(kaputt.sourceCheckedAt, roh.checkedAt)
  })

  test('T-home-directory: ready hrefs unverändert', () => {
    assert.deepEqual(
      ADMIN_NAECHSTE_SCHRITTE.filter((schritt) => schritt.stand === 'ready').map((schritt) => schritt.href),
      ['/admin/users', '/admin/payments', '/admin/security', '/admin/system-health', '/admin/provider-ops'],
    )
  })
})
