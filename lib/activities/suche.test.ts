import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { clientEnthaeltGeheimnis } from '@/lib/activities/client-sicht'
import type { ActivityOption } from '@/lib/activities/domain'
import { ActivityProviderFehler, type ActivityProvider } from '@/lib/activities/provider'
import { activityRateLeeren } from '@/lib/activities/rate-limit'
import { activitiesSuchen } from '@/lib/activities/suche'
import { activityZustand } from '@/lib/activities/zustand'

const EINGABE = {
  stage: {
    id: 'stage-1',
    name: 'Florenz',
    placeId: 'geonames:3176959',
    latitude: 43.7696,
    longitude: 11.2558,
  },
  day: {
    id: 'day-1',
    dayDate: '2026-09-12',
    stageId: 'stage-1',
  },
  trip: {
    startDate: '2026-09-12',
    endDate: '2026-09-16',
    travellers: 2,
    currency: 'CHF',
    budgetAmount: 4000,
    interests: ['culture'],
    pace: 'calm',
  },
  items: [
    {
      id: 'item-1',
      kind: 'activity' as const,
      title: 'Dom',
      startsOn: '2026-09-12',
      startsAt: '09:00',
      endsOn: '2026-09-12',
      endsAt: '11:00',
    },
  ],
}

function option(teil: Partial<ActivityOption> & Pick<ActivityOption, 'id' | 'title'>): ActivityOption {
  return {
    provider: 'test',
    externalRef: teil.id,
    description: null,
    locationName: 'Florenz',
    punkt: { lat: 43.77, lon: 11.25 },
    dauerMinuten: 90,
    timeslot: {
      startsOn: '2026-09-12',
      startsAt: '15:00',
      endsOn: '2026-09-12',
      endsAt: '16:30',
    },
    preis: 28,
    preisWaehrung: 'CHF',
    bewertung: 9,
    bewertungenAnzahl: 900,
    stornierbar: true,
    kategorien: ['culture'],
    tags: ['museum'],
    ...teil,
  }
}

function providerMit(optionen: ActivityOption[]): ActivityProvider {
  return {
    id: 'test',
    async suchen() {
      return { options: optionen, partial: false }
    },
  }
}

describe('Aktivitätensuche-Orchestrierung', () => {
  test('fehlender Provider liefert unavailable und darf den Tageskontext zeigen', async () => {
    const { httpStatus, koerper } = await activitiesSuchen(EINGABE, {
      zustand: activityZustand({ JETNITY_ACTIVITY_AKTIV: 'true' }, false),
      provider: null,
      kennung: 'activity-ohne-zugang',
    })
    assert.equal(httpStatus, 200)
    assert.equal(koerper.status, 'unavailable')
    assert.equal(koerper.options.length, 0)
    assert.equal(koerper.evidenz.hatOrt, true)
    assert.equal(koerper.evidenz.hatDatum, true)
    assert.equal(koerper.evidenz.hatBelastbareZeiten, true)
    assert.equal(clientEnthaeltGeheimnis(koerper), false)
  })

  test('Production bleibt aus', async () => {
    const { koerper } = await activitiesSuchen(EINGABE, {
      zustand: activityZustand(
        { VERCEL_ENV: 'production', JETNITY_ACTIVITY_AKTIV: 'true' },
        true,
      ),
      provider: providerMit([]),
      kennung: 'activity-prod',
    })
    assert.equal(koerper.status, 'unavailable')
    assert.match(koerper.message, /Production/)
  })

  test('ungültige Eingabe fällt fail-closed', async () => {
    const { httpStatus, koerper } = await activitiesSuchen({ trip: { travellers: 99 } }, {
      zustand: { aktiv: true, umgebung: 'test' },
      provider: providerMit([]),
      kennung: 'activity-invalid',
    })
    assert.equal(httpStatus, 400)
    assert.equal(koerper.status, 'error')
    assert.equal(koerper.options.length, 0)
  })

  test('Timeout und empty bleiben kontrollierte Zustände', async () => {
    activityRateLeeren()
    const timeout: ActivityProvider = {
      id: 't',
      suchen: async () => {
        throw new ActivityProviderFehler('timeout', 'Die Aktivitätensuche hat zu lange gedauert.')
      },
    }
    const { koerper: zeit } = await activitiesSuchen(EINGABE, {
      zustand: { aktiv: true, umgebung: 'test' },
      provider: timeout,
      kennung: 'activity-timeout',
    })
    assert.equal(zeit.status, 'timeout')

    activityRateLeeren()
    const { koerper: leer } = await activitiesSuchen(EINGABE, {
      zustand: { aktiv: true, umgebung: 'test' },
      provider: providerMit([]),
      kennung: 'activity-empty',
    })
    assert.equal(leer.status, 'empty')
    assert.equal(leer.options.length, 0)
  })

  test('eine gültige Suche liefert bewertete Optionen ohne Geheimnisse', async () => {
    activityRateLeeren()
    const { httpStatus, koerper } = await activitiesSuchen(EINGABE, {
      zustand: { aktiv: true, umgebung: 'test' },
      provider: providerMit([
        option({ id: 'uffizien', title: 'Uffizien', preis: 28 }),
        option({
          id: 'billig',
          title: 'Billig-Tour',
          preis: 9,
          bewertung: 6.4,
          timeslot: {
            startsOn: '2026-09-12',
            startsAt: '09:30',
            endsOn: '2026-09-12',
            endsAt: '10:30',
          },
        }),
      ]),
      kennung: 'activity-ok',
    })
    assert.equal(httpStatus, 200)
    assert.equal(koerper.status, 'ok')
    assert.ok(koerper.options.length >= 2)
    assert.ok(koerper.options.some((eintrag) => eintrag.labels.includes('jetnity')))
    assert.equal(koerper.options.find((eintrag) => eintrag.labels.includes('jetnity'))?.id, 'uffizien')
    assert.equal(koerper.options.find((eintrag) => eintrag.id === 'billig')?.konflikt, 'ueberschneidung')
    assert.equal('score' in koerper.options[0]!, false)
    assert.equal(clientEnthaeltGeheimnis(koerper), false)
  })

  test('zu viele Suchen liefern 429 mit Retry-After', async () => {
    activityRateLeeren()
    const ports = {
      zustand: { aktiv: true, umgebung: 'test' } as const,
      provider: providerMit([]),
      kennung: 'activity-rate',
    }
    for (let i = 0; i < 8; i += 1) {
      const erlaubt = await activitiesSuchen(EINGABE, ports)
      assert.equal(erlaubt.httpStatus, 200)
    }
    const begrenzt = await activitiesSuchen(EINGABE, ports)
    assert.equal(begrenzt.httpStatus, 429)
    assert.equal(begrenzt.koerper.status, 'rate_limited')
    assert.ok((begrenzt.retryAfterSec ?? 0) >= 1)
    assert.equal(begrenzt.koerper.options.length, 0)
  })
})
