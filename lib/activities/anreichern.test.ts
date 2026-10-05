import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { activityKandidatenAnreichern } from '@/lib/activities/anreichern'
import type { ActivityOption, ActivitySuchanfrage } from '@/lib/activities/domain'

const ANFRAGE: ActivitySuchanfrage = {
  destinationPlaceId: 'geonames:3176959',
  destinationName: 'Florenz',
  dayDate: '2026-09-12',
  participants: 2,
  currency: 'CHF',
  budgetAmount: 4000,
  interests: ['culture'],
  pace: 'calm',
}

const OPTION: ActivityOption = {
  id: 'opt-1',
  provider: 'test',
  externalRef: 'opt-1',
  title: 'Uffizien',
  description: null,
  locationName: 'Florenz',
  punkt: { lat: 43.768, lon: 11.256 },
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
  bewertungenAnzahl: 800,
  stornierbar: true,
  kategorien: ['culture'],
  tags: ['museum'],
}

describe('Aktivitäts-Anreicherung', () => {
  test('Interessenpassung und Konfliktfreiheit entstehen nur aus vorhandenen Daten', () => {
    const [kandidat] = activityKandidatenAnreichern(
      [OPTION],
      ANFRAGE,
      [
        {
          startsOn: '2026-09-12',
          startsAt: '09:00',
          endsOn: '2026-09-12',
          endsAt: '11:00',
        },
      ],
      { lat: 43.7696, lon: 11.2558 },
    )
    assert.ok(kandidat)
    assert.equal(kandidat.context.interessenFit, 1)
    assert.equal(kandidat.context.konflikt, 'frei')
    assert.equal(kandidat.context.zeitFit, 1)
    assert.ok((kandidat.context.lageFit ?? 0) > 0.8)
  })

  test('ohne Kategorien bleibt die Interessenpassung unbekannt statt 0,5', () => {
    const [kandidat] = activityKandidatenAnreichern(
      [{ ...OPTION, kategorien: [], tags: [] }],
      ANFRAGE,
      [],
      null,
    )
    assert.equal(kandidat?.context.interessenFit, null)
    assert.equal(kandidat?.context.lageFit, null)
  })
})
