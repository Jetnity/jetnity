import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { clientEnthaeltGeheimnis, sucheFuerClient } from '@/lib/hotels/client-sicht'
import type { BewerteteHotelOption, BewertetesQuartier } from '@/lib/hotels/domain'

const QUARTIER: BewertetesQuartier = {
  id: 'barcelona',
  name: 'Barcelona',
  herkunft: 'etappenort',
  zentrum: { lat: 41.3874, lon: 2.1686 },
  taeglicheWegeMinuten: null,
  anreiseTransferMinuten: null,
  abreiseTransferMinuten: null,
  gehScore: null,
  oevScore: null,
  ruheScore: null,
  nachtlebenScore: null,
  essenScore: null,
  strandScore: null,
  familieScore: null,
  typischeNachtPreis: null,
  score: 50,
  reasons: ['Für diese Gegend fehlen noch Wegezeitdaten; Jetnity bewertet sie deshalb vorsichtig.'],
}

const OPTION: BewerteteHotelOption = {
  id: 'opt-1',
  provider: 'test',
  externalRef: 'ref-1',
  name: 'Hotel Test',
  punkt: { lat: 41.39, lon: 2.16 },
  quartierName: 'Eixample',
  adresse: null,
  sterne: 4,
  bewertung: 8.8,
  bewertungenAnzahl: 900,
  preisGesamt: 760,
  preisProNacht: 190,
  preisWaehrung: 'CHF',
  steuernEnthalten: true,
  stornierbar: true,
  stornierungBis: null,
  fruehstueckEnthalten: null,
  zimmerName: null,
  context: {
    taeglicheWegeMinuten: null,
    quartierFitScore: 0.9,
    ruheScore: null,
    praeferenzFitScore: null,
  },
  score: 77.2,
  labels: ['jetnity'],
  reasons: ['Sehr gute Lage für die geplanten Wege dieser Reise.'],
}

describe('Client-Sicht der Hotelsuche', () => {
  test('Score und Provider-Rohfelder kommen nicht in die Antwort', () => {
    const koerper = sucheFuerClient({
      status: 'ok',
      message: 'Hotels gefunden.',
      quartier: QUARTIER,
      options: [OPTION],
    })
    assert.equal('score' in koerper.options[0]!, false)
    assert.equal(koerper.quartier && 'score' in koerper.quartier, false)
    assert.equal(koerper.quartier?.herkunft, 'etappenort')
    assert.equal(clientEnthaeltGeheimnis(koerper), false)
    assert.equal(koerper.options[0]?.name, 'Hotel Test')
    assert.ok(koerper.quartier?.reasons.length)
  })

  test('ein untergeschobenes Token kippt die Antwort', () => {
    assert.equal(clientEnthaeltGeheimnis({ options: [{ access_token: 'abc' }] }), true)
  })
})
