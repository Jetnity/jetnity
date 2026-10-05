import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { clientEnthaeltGeheimnis, sucheFuerClient } from '@/lib/activities/client-sicht'
import type { BewerteteActivityOption } from '@/lib/activities/domain'

const OPTION: BewerteteActivityOption = {
  id: 'opt-1',
  provider: 'test',
  externalRef: 'ref-1',
  title: 'Uffizien',
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
  bewertung: 9.1,
  bewertungenAnzahl: 1200,
  stornierbar: true,
  kategorien: ['culture'],
  tags: ['museum'],
  context: {
    interessenFit: 1,
    zeitFit: 1,
    konflikt: 'frei',
    preisFit: 0.8,
    dauerFit: 1,
    lageFit: 0.9,
  },
  score: 0.91,
  labels: ['jetnity'],
  reasons: ['Passt zu den Interessen dieser Reise.'],
}

describe('Client-Sicht der Aktivitätensuche', () => {
  test('Score und Provider-Rohfelder kommen nicht in die Antwort', () => {
    const koerper = sucheFuerClient({
      status: 'ok',
      message: 'Aktivitäten gefunden.',
      options: [OPTION],
    })
    assert.equal('score' in koerper.options[0]!, false)
    assert.equal('context' in koerper.options[0]!, false)
    assert.equal(koerper.options[0]?.konflikt, 'frei')
    assert.equal(clientEnthaeltGeheimnis(koerper), false)
    assert.equal(koerper.options[0]?.title, 'Uffizien')
  })

  test('ein untergeschobenes Token kippt die Antwort', () => {
    assert.equal(clientEnthaeltGeheimnis({ options: [{ access_token: 'abc' }] }), true)
  })
})
