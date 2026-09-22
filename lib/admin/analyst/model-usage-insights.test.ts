import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import type { AdminDenial } from '@/lib/auth/admin-access'
import type { ProviderOpsBoardBericht, ProviderOpsBoardItem, ProviderOpsBoardStatus } from '@/lib/admin/provider-ops-board/typen'
import { ADMIN_EHRLICHE_TEXTE } from '@/lib/admin/ehrliche-zustaende'
import {
  berechneModelUsageFreshness,
  enthältVerboteneModelUsageAltersbehauptung,
  enthältVerbotenesModelUsageQuellleck,
  leiteModelUsageInsights,
  modelUsageBerichtTexte,
  parseEvidencedIsoInstant,
} from './model-usage-insights'
import {
  MODEL_USAGE_INSIGHT_KIND,
  MODEL_USAGE_MATERIALITY,
  MODEL_USAGE_SAFE_HREFS,
  MODEL_USAGE_TTL_MS,
  type ModelUsageAccess,
  type ModelUsageBericht,
} from './model-usage-typen'

const JETZT = Date.parse('2026-09-22T12:00:00.000Z')
const ROLL: ModelUsageAccess = { status: 'allowed', grant: 'role' }
const NOTZUGANG: ModelUsageAccess = { status: 'allowed', grant: 'break-glass' }
const DENIALS: readonly AdminDenial[] = [
  'unauthenticated',
  'forbidden',
  'aal2-required',
  'lookup-failed',
  'aal-lookup-failed',
]
const ALTER_30S = /höchstens 30s|hoechstens 30s|at most 30s old/i
const SITZUNG = /in dieser Sitzung/
const HOSTILE = {
  summary: '<script>alert(1)</script> 0 USD no spend all-clear # Leak',
  detail: 'ERROR backend user=admin@jetnity.test token=sk_live_123 prompt="book trip Paris"',
  proves: 'in dieser Sitzung 999 Zeilen',
  doesNotProve: '<img src=x onerror=alert(1)> victim@example.com',
  metadata: {
    zeilen: '199',
    kostenMikroUsd: '1234567',
    juengsteCreatedAt: '2026-09-22T11:59:59.000Z',
    email: 'victim@example.com',
  },
}

function parent(id: 'provider-ops' | 'kill-switch' | 'cost-guard'): ProviderOpsBoardItem {
  return {
    id,
    name: id,
    status: 'available',
    source: 'hostile-parent',
    checkedAt: new Date(JETZT).toISOString(),
    freshness: { state: 'fresh', ageMs: 0, ttlMs: 60_000 },
    summary: HOSTILE.summary,
    detail: HOSTILE.detail,
    proves: HOSTILE.proves,
    doesNotProve: HOSTILE.doesNotProve,
    metadata: HOSTILE.metadata,
  }
}

function modelUsageItem(
  status: ProviderOpsBoardStatus,
  checkedAt = new Date(JETZT).toISOString(),
): ProviderOpsBoardItem {
  return {
    id: 'model-usage',
    name: 'Modellnutzung',
    status,
    source: 'public.model_usage leaked',
    checkedAt,
    freshness: { state: 'fresh', ageMs: 0, ttlMs: 120_000 },
    summary: HOSTILE.summary,
    detail: HOSTILE.detail,
    proves: HOSTILE.proves,
    doesNotProve: HOSTILE.doesNotProve,
    metadata: HOSTILE.metadata,
  }
}

function board(
  items: ProviderOpsBoardItem[],
  checkedAt = new Date(JETZT + 5_000).toISOString(),
): ProviderOpsBoardBericht {
  return {
    checkedAt,
    writeActions: [],
    items: [parent('provider-ops'), parent('kill-switch'), parent('cost-guard'), ...items],
  }
}

function leite(
  access: ModelUsageAccess,
  quelle: ProviderOpsBoardBericht | null,
  nowMs = JETZT,
  sourceFailed = false,
) {
  return leiteModelUsageInsights({ access, board: quelle, nowMs, sourceFailed })
}

function texte(bericht: ModelUsageBericht): string {
  return modelUsageBerichtTexte(bericht)
}

function serialisiert(bericht: ModelUsageBericht): string {
  return JSON.stringify(bericht)
}

function assertKeinLeck(bericht: ModelUsageBericht) {
  const roh = `${texte(bericht)}\n${serialisiert(bericht)}`
  assert.equal(enthältVerboteneModelUsageAltersbehauptung(roh), false)
  assert.equal(enthältVerbotenesModelUsageQuellleck(roh), false)
  assert.doesNotMatch(roh, ALTER_30S)
  assert.doesNotMatch(roh, SITZUNG)
  assert.doesNotMatch(roh, /<script|onerror=|sk_live_|admin@jetnity\.test|victim@example\.com|book trip Paris/)
  assert.doesNotMatch(roh, /kostenMikroUsd|juengsteCreatedAt|kosten_mikro/)
  assert.doesNotMatch(roh, /1234567|199 Zeilen|0 USD no spend/)
}

function assertKind(bericht: ModelUsageBericht) {
  assert.deepEqual(bericht.writeActions, [])
  assert.deepEqual(bericht.modelExplanation, { enabled: false })
  assert.equal(bericht.source, 'model-usage')
  assert.equal(bericht.insights.length, 1)
  for (const insight of bericht.insights) {
    assert.equal(insight.kind, MODEL_USAGE_INSIGHT_KIND)
    assert.equal(insight.category, 'model-usage')
    assert.equal(insight.sourceRef, 'model-usage')
    assert.equal(insight.sourceItemId, 'model-usage')
    assert.ok(MODEL_USAGE_MATERIALITY.includes(insight.materiality))
    if (insight.next) {
      assert.ok((MODEL_USAGE_SAFE_HREFS as readonly string[]).includes(insight.next.href))
      assert.equal(insight.next.kind, 'investigate')
      assert.equal(insight.next.label, 'Provider & Kosten öffnen')
    }
  }
  assertKeinLeck(bericht)
}

describe('Model-Usage-Analyst (synthetic fixtures)', () => {
  test('T-statuses-distinct: available/empty/unavailable/unknown bleiben getrennt', () => {
    const available = leite(ROLL, board([modelUsageItem('available')]))
    const empty = leite(ROLL, board([modelUsageItem('empty')]))
    const unavailable = leite(ROLL, board([modelUsageItem('unavailable')]))
    const unknown = leite(ROLL, board([modelUsageItem('unknown')]))
    assert.equal(available.insights[0]?.observed, 'available')
    assert.equal(empty.insights[0]?.observed, 'empty')
    assert.equal(unavailable.insights[0]?.observed, 'unavailable')
    assert.equal(unknown.insights[0]?.observed, 'unknown')
    assert.notEqual(available.insights[0]?.observed, empty.insights[0]?.observed)
    assert.notEqual(empty.insights[0]?.observed, unavailable.insights[0]?.observed)
    assert.notEqual(unknown.insights[0]?.observed, empty.insights[0]?.observed)
    assert.match(texte(available), /keine Finanz-, Budget- oder Limitaussage/)
    assert.match(texte(empty), /kein Beleg für null Ausgaben/)
    assert.match(texte(unavailable), /kein leeres Kostenprotokoll/)
    assert.match(texte(unknown), /Unbekannt ist nicht leer/)
    assert.doesNotMatch(texte(available), /Monatsbudget greift|Provider jetzt aktivieren|Limit greift/)
    assert.doesNotMatch(texte(empty), /0 USD|keine Kosten entstanden sind\./)
    for (const bericht of [available, empty, unavailable, unknown]) {
      assert.equal(bericht.insights[0]?.next?.href, '/admin/provider-ops')
      assertKind(bericht)
    }
  })

  test('T-foundation-disabled-not-configured: konservative Abdeckung ohne Aktivierung', () => {
    for (const status of ['foundation_only', 'disabled', 'not_configured'] as const) {
      const bericht = leite(ROLL, board([modelUsageItem(status)]))
      assert.equal(bericht.insights[0]?.observed, status)
      assert.equal(bericht.insights[0]?.materiality, 'coverage')
      assert.match(texte(bericht), /keine Empfehlung, Provider zu aktivieren/)
      assert.doesNotMatch(texte(bericht), /Token anlegen|jetzt aktivieren/)
      assertKind(bericht)
    }
  })

  test('T-missing-duplicate-malformed: kein first-match und kein healthy fallback', () => {
    const fehlend = leite(ROLL, board([]))
    const doppelt = leite(ROLL, board([modelUsageItem('empty'), modelUsageItem('available')]))
    const unbrauchbar = leite(
      ROLL,
      board([{ ...modelUsageItem('available'), status: 'healthy-finances' as ProviderOpsBoardStatus }]),
    )
    for (const bericht of [fehlend, doppelt, unbrauchbar]) {
      assert.equal(bericht.insights[0]?.observed, 'partial_failed')
      assert.equal(bericht.insights[0]?.materiality, 'attention')
      assert.notEqual(bericht.insights[0]?.observed, 'available')
      assert.notEqual(bericht.insights[0]?.observed, 'empty')
      assert.equal(bericht.sourceCheckedAt, null)
      assertKind(bericht)
    }
    assert.equal(fehlend.insights[0]?.sourceCheckId, 'missing')
    assert.equal(doppelt.insights[0]?.sourceCheckId, 'duplicate')
    assert.equal(unbrauchbar.insights[0]?.sourceCheckId, 'malformed')
  })

  test('T-unrelated-parents: feindliche Eltern kontaminieren die Quelle nicht', () => {
    const bericht = leite(ROLL, board([modelUsageItem('empty')]))
    assert.equal(bericht.insights.length, 1)
    assert.equal(bericht.insights[0]?.observed, 'empty')
    assert.doesNotMatch(serialisiert(bericht), /hostile-parent|"id":"provider-ops"|kill-switch|cost-guard/)
    assertKeinLeck(bericht)
  })

  test('T-source-failed: Throw/timeout ist nicht empty und ohne Rohfehler', () => {
    const bericht = leite(ROLL, null, JETZT, true)
    assert.equal(bericht.insights[0]?.observed, 'source_failed')
    assert.notEqual(bericht.insights[0]?.observed, 'empty')
    assert.equal(bericht.sourceCheckedAt, null)
    assert.equal(bericht.insights[0]?.checkedAt, null)
    assertKind(bericht)
  })

  test('T-original-item-time: Board- und metadata-Zeit ersetzen item.checkedAt nicht', () => {
    const ursprung = new Date(JETZT - 180_000).toISOString()
    const item = modelUsageItem('available', ursprung)
    const quelle = board([item], new Date(JETZT).toISOString())
    const bericht = leite(ROLL, quelle, JETZT)
    assert.equal(bericht.sourceCheckedAt, ursprung)
    assert.equal(bericht.insights[0]?.checkedAt, ursprung)
    assert.equal(bericht.insights[0]?.freshness.ageMs, 180_000)
    assert.equal(bericht.insights[0]?.freshness.state, 'stale')
    assert.doesNotMatch(serialisiert(bericht), /2026-09-22T11:59:59.000Z/)
    assert.notEqual(bericht.sourceCheckedAt, quelle.checkedAt)
    assertKind(bericht)
  })

  test('T-boundary-120s: genau 120s bleibt frisch, 120001 wird veraltet', () => {
    const genau = leite(ROLL, board([modelUsageItem('empty', new Date(JETZT - MODEL_USAGE_TTL_MS).toISOString())]), JETZT)
    const knapp = leite(
      ROLL,
      board([modelUsageItem('empty', new Date(JETZT - MODEL_USAGE_TTL_MS - 1).toISOString())]),
      JETZT,
    )
    assert.equal(genau.insights[0]?.freshness.state, 'fresh')
    assert.equal(genau.insights[0]?.freshness.ageMs, MODEL_USAGE_TTL_MS)
    assert.equal(knapp.insights[0]?.freshness.state, 'stale')
    assert.equal(knapp.insights[0]?.freshness.ageMs, MODEL_USAGE_TTL_MS + 1)
    assert.equal(knapp.insights[0]?.materiality, 'attention')
    assert.match(texte(knapp), /Stand ist veraltet/)
    assert.notEqual(knapp.insights[0]?.materiality, 'none')
  })

  test('T-stale-available-empty: kein aktueller All-Clear', () => {
    const ursprung = new Date(JETZT - 180_000).toISOString()
    for (const status of ['available', 'empty'] as const) {
      const bericht = leite(ROLL, board([modelUsageItem(status, ursprung)]), JETZT)
      assert.equal(bericht.insights[0]?.freshness.state, 'stale')
      assert.equal(bericht.insights[0]?.materiality, 'attention')
      assert.notEqual(bericht.insights[0]?.materiality, 'none')
      assert.match(texte(bericht), /Stand ist veraltet/)
      assert.doesNotMatch(texte(bericht), /alles ruhig|all-clear|aktuell in Ordnung/)
    }
  })

  test('T-missing-invalid-future-timestamp: unknown ohne erfundenes Alter', () => {
    const ohne = leite(ROLL, board([{ ...modelUsageItem('available'), checkedAt: '' }]))
    const ungueltig = leite(ROLL, board([{ ...modelUsageItem('empty'), checkedAt: 'gestern-vormittag' }]))
    const zukunftIso = new Date(JETZT + 60_000).toISOString()
    const zukunft = leite(ROLL, board([modelUsageItem('available', zukunftIso)]), JETZT)
    for (const bericht of [ohne, ungueltig, zukunft]) {
      assert.equal(bericht.insights[0]?.freshness.state, 'unknown')
      assert.equal(bericht.insights[0]?.freshness.ageMs, null)
      assert.notEqual(bericht.insights[0]?.freshness.state, 'fresh')
    }
    assert.equal(ohne.sourceCheckedAt, null)
    assert.equal(ohne.insights[0]?.checkedAt, null)
    assert.equal(ungueltig.sourceCheckedAt, null)
    assert.equal(ungueltig.insights[0]?.checkedAt, null)
    assert.doesNotMatch(serialisiert(ungueltig), /gestern-vormittag/)
    assert.equal(zukunft.sourceCheckedAt, zukunftIso)
    assert.equal(zukunft.insights[0]?.checkedAt, zukunftIso)
    const clamped = berechneModelUsageFreshness(new Date(JETZT + 1).toISOString(), JETZT)
    assert.equal(clamped.state, 'unknown')
    assert.equal(clamped.ageMs, null)
  })

  test('MU-R1: nur Collector-ISO wird behalten; feindliche und unmögliche Zeiten werden verworfen', () => {
    const marker = 'test-person@example.invalid SYNTHETIC_MARKER'
    const rfcAnnotiert = `Tue, 22 Sep 2026 12:00:00 GMT (${marker})`
    const feindlich = leite(ROLL, board([{ ...modelUsageItem('available'), checkedAt: marker }]))
    const annotiert = leite(ROLL, board([{ ...modelUsageItem('available'), checkedAt: rfcAnnotiert }]), JETZT + 1_000)
    const rollover = leite(
      ROLL,
      board([{ ...modelUsageItem('empty'), checkedAt: '2026-02-30T12:00:00.000Z' }]),
      Date.parse('2026-03-02T12:00:01.000Z'),
    )
    const ohneZone = leite(ROLL, board([{ ...modelUsageItem('available'), checkedAt: '2026-09-22T12:00:00.000' }]))
    const offset = leite(ROLL, board([{ ...modelUsageItem('available'), checkedAt: '2026-09-22T12:00:00.000+00:00' }]))
    const frei = leite(ROLL, board([{ ...modelUsageItem('empty'), checkedAt: '2026-09-22 12:00:00' }]))
    const leapUngueltig = leite(ROLL, board([{ ...modelUsageItem('available'), checkedAt: '2026-02-29T12:00:00.000Z' }]))
    const gültig = leite(ROLL, board([modelUsageItem('available', '2026-09-22T12:00:00.000Z')]), JETZT)
    const zukunft = leite(ROLL, board([modelUsageItem('empty', '2026-09-22T12:00:01.000Z')]), JETZT)

    for (const bericht of [feindlich, annotiert, rollover, ohneZone, offset, frei, leapUngueltig]) {
      assert.equal(bericht.sourceCheckedAt, null)
      assert.equal(bericht.insights[0]?.checkedAt, null)
      assert.equal(bericht.insights[0]?.freshness.state, 'unknown')
      assert.equal(bericht.insights[0]?.freshness.ageMs, null)
      assert.notEqual(bericht.insights[0]?.freshness.state, 'fresh')
      assert.doesNotMatch(serialisiert(bericht), /SYNTHETIC_MARKER|test-person@example\.invalid|gestern-vormittag|Tue, 22 Sep|2026-02-30|2026-02-29T12:00:00\.000Z|12:00:00\.000\+00:00/)
    }
    assert.equal(parseEvidencedIsoInstant(rfcAnnotiert), null)
    assert.equal(parseEvidencedIsoInstant('2026-02-30T12:00:00.000Z'), null)
    assert.equal(parseEvidencedIsoInstant('2026-09-22T12:00:00.000'), null)
    assert.equal(parseEvidencedIsoInstant('2026-09-22T12:00:00.000Z'), '2026-09-22T12:00:00.000Z')
    assert.equal(gültig.sourceCheckedAt, '2026-09-22T12:00:00.000Z')
    assert.equal(gültig.insights[0]?.checkedAt, '2026-09-22T12:00:00.000Z')
    assert.equal(gültig.insights[0]?.freshness.state, 'fresh')
    assert.equal(gültig.insights[0]?.freshness.ageMs, 0)
    assert.equal(zukunft.sourceCheckedAt, '2026-09-22T12:00:01.000Z')
    assert.equal(zukunft.insights[0]?.checkedAt, '2026-09-22T12:00:01.000Z')
    assert.equal(zukunft.insights[0]?.freshness.state, 'unknown')
    assert.doesNotMatch(serialisiert(gültig), /SYNTHETIC_MARKER|juengsteCreatedAt/)
  })

  test('T-cache-A-then-B: identisches Objekt, originale Zeit, process-recent, keine Sitzung', () => {
    const ursprung = new Date(JETZT - 15_000).toISOString()
    const cacheObjekt = board([modelUsageItem('available', ursprung)])
    const a = leite(ROLL, cacheObjekt, JETZT)
    const b = leite(ROLL, cacheObjekt, JETZT)
    assert.equal(a.sourceCheckedAt, ursprung)
    assert.equal(b.sourceCheckedAt, ursprung)
    assert.equal(a.insights[0]?.checkedAt, b.insights[0]?.checkedAt)
    assert.equal(a.insights[0]?.freshness.ageMs, 15_000)
    assert.equal(b.insights[0]?.freshness.ageMs, 15_000)
    assert.equal(a.observationScope, 'process-recent')
    assert.equal(b.observationScope, 'process-recent')
    assert.doesNotMatch(texte(a), SITZUNG)
    assert.doesNotMatch(texte(b), SITZUNG)
    assert.equal(a.insights[0]?.id, b.insights[0]?.id)
  })

  test('T-denied-and-break-glass-ignore-board: kein reuse eines erlaubten Stands', () => {
    const cache = board([modelUsageItem('available')])
    const rolle = leite(ROLL, cache)
    assert.equal(rolle.insights[0]?.observed, 'available')
    const glas = leite(NOTZUGANG, cache)
    assert.equal(glas.insights[0]?.attribution, 'not_attributed')
    assert.equal(glas.sourceCheckedAt, null)
    assert.notEqual(glas.insights[0]?.observed, 'available')
    assert.equal(glas.insights[0]?.next, null)
    for (const denial of DENIALS) {
      const gesperrt = leite({ status: 'denied', denial }, cache)
      assert.equal(gesperrt.access.status, 'denied')
      if (gesperrt.access.status === 'denied') assert.equal(gesperrt.access.denial, denial)
      assert.equal(gesperrt.sourceCheckedAt, null)
      assert.equal(gesperrt.insights[0]?.next, null)
      assert.notEqual(gesperrt.insights[0]?.observed, 'available')
    }
  })

  test('T-fixed-link-and-writes: nur Provider & Kosten, writes leer, Modell aus', () => {
    const bericht = leite(ROLL, board([modelUsageItem('unavailable')]))
    assert.deepEqual(bericht.writeActions, [])
    assert.deepEqual(bericht.modelExplanation, { enabled: false })
    assert.deepEqual(bericht.insights[0]?.next, {
      href: '/admin/provider-ops',
      label: 'Provider & Kosten öffnen',
      kind: 'investigate',
    })
    assert.equal(ADMIN_EHRLICHE_TEXTE.modellnutzungUntersuchen, 'Provider & Kosten öffnen')
  })
})
