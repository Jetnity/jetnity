import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import type { ProviderOpsEvent, ProviderOpsEventSink } from '@/lib/provider-ops'
import { requirementsProviderAbrufen } from '@/lib/readiness/abruf'
import type { RequirementsAnfrage, RequirementsProvider } from '@/lib/readiness/provider'
import { safetyEvaluationsPruefen } from '@/lib/safety/auswerten'
import type { SafetyProvider } from '@/lib/safety/provider'
import { safetyAnfrageSchema } from '@/lib/safety/schema'
import { seasonalEvaluationsPruefen } from '@/lib/seasonal/auswerten'
import type { SeasonalProvider } from '@/lib/seasonal/provider'
import { seasonalAnfrageSchema } from '@/lib/seasonal/schema'

function sammler(): { events: ProviderOpsEvent[]; sink: ProviderOpsEventSink } {
  const events: ProviderOpsEvent[] = []
  return {
    events,
    sink: {
      write(event) {
        events.push(event)
      },
    },
  }
}

const requirementsAnfrage: RequirementsAnfrage = {
  originCountryCode: 'CH',
  destinationCountryCodes: ['US'],
  transitCountryCodes: [],
  startDate: '2026-09-12',
  endDate: '2026-09-16',
  travellers: [],
}

describe('Provider Readiness S7 runtime observability', () => {
  test('Readiness schreibt checked_empty ohne Anfrage-Payload', async () => {
    const { events, sink } = sammler()
    const provider: RequirementsProvider = {
      name: 'requirements-test',
      async evaluate() {
        return []
      },
    }

    const ergebnis = await requirementsProviderAbrufen(provider, requirementsAnfrage, { eventSink: sink })
    assert.deepEqual(ergebnis, { ok: true, zeilen: [] })
    assert.equal(events.length, 1)
    assert.equal(events[0]?.domain, 'readiness')
    assert.equal(events[0]?.operation, 'evaluate')
    assert.equal(events[0]?.outcome, 'checked_empty')
    assert.equal(events[0]?.resultCount, 0)
    assert.equal(JSON.stringify(events).includes('US'), false)
    assert.equal(JSON.stringify(events).includes('2026-09-12'), false)
  })

  test('Readiness dedupliziert Timeout trotz nachlaufendem Abort-Reject', async () => {
    const { events, sink } = sammler()
    const provider: RequirementsProvider = {
      name: 'requirements-timeout-test',
      evaluate(_anfrage, signal) {
        return new Promise((_resolve, reject) => {
          signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true })
        })
      },
    }

    const ergebnis = await requirementsProviderAbrufen(provider, requirementsAnfrage, {
      timeoutMs: 20,
      eventSink: sink,
    })
    assert.equal(ergebnis.ok, false)
    if (!ergebnis.ok) assert.equal(ergebnis.art, 'timeout')
    await new Promise((resolve) => setTimeout(resolve, 5))
    assert.equal(events.length, 1)
    assert.equal(events[0]?.outcome, 'timeout')
  })

  test('Safety schreibt checked_empty und übernimmt keine Trip-Wahrheit ins Event', async () => {
    const geprueft = safetyAnfrageSchema.safeParse({ stages: [], days: [], items: [] })
    assert.equal(geprueft.success, true)
    if (!geprueft.success) throw new Error('Safety-Testanfrage ungültig')

    const { events, sink } = sammler()
    const provider: SafetyProvider = {
      name: 'safety-test',
      async evaluate() {
        return []
      },
    }
    const ergebnis = await safetyEvaluationsPruefen(geprueft.data, { provider, eventSink: sink })
    assert.equal(ergebnis.ok, true)
    assert.equal(events.length, 1)
    assert.equal(events[0]?.domain, 'safety')
    assert.equal(events[0]?.outcome, 'checked_empty')
    assert.equal('tripId' in (events[0] ?? {}), false)
  })

  test('Safety Provider-Throw bleibt fachlich fail-closed und operativ internal', async () => {
    const geprueft = safetyAnfrageSchema.safeParse({ stages: [], days: [], items: [] })
    assert.equal(geprueft.success, true)
    if (!geprueft.success) throw new Error('Safety-Testanfrage ungültig')

    const { events, sink } = sammler()
    const provider: SafetyProvider = {
      name: 'safety-error-test',
      async evaluate() {
        throw new Error('provider down')
      },
    }
    const ergebnis = await safetyEvaluationsPruefen(geprueft.data, { provider, eventSink: sink })
    assert.equal(ergebnis.ok, true)
    assert.equal(events.length, 1)
    assert.equal(events[0]?.outcome, 'error')
  })

  test('Seasonal schreibt checked_empty ohne Routen-Payload', async () => {
    const geprueft = seasonalAnfrageSchema.safeParse({ stages: [], days: [], items: [] })
    assert.equal(geprueft.success, true)
    if (!geprueft.success) throw new Error('Seasonal-Testanfrage ungültig')

    const { events, sink } = sammler()
    const provider: SeasonalProvider = {
      name: 'seasonal-test',
      async evaluate() {
        return []
      },
    }
    const evaluations = await seasonalEvaluationsPruefen(geprueft.data, provider, sink)
    assert.deepEqual(evaluations, [])
    assert.equal(events.length, 1)
    assert.equal(events[0]?.domain, 'seasonal')
    assert.equal(events[0]?.outcome, 'checked_empty')
    assert.equal(JSON.stringify(events).includes('stages'), false)
  })
})
