import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import { clientEnthaeltGeheimnis, sucheFuerClient } from '@/lib/flights/client-sicht'
import { OPTION_DIREKT } from '@/lib/flights/fixtures/optionen'

describe('Client-Sicht der Flugsuche', () => {
  test('Score und Provider-Rohfelder kommen nicht in die Antwort', () => {
    const koerper = sucheFuerClient({
      status: 'ok',
      message: 'Verbindungen gefunden.',
      options: [
        {
          ...OPTION_DIREKT,
          score: 88.2,
          labels: ['jetnity', 'fastest'],
          reasons: ['Direktflug, ohne Umsteigen.', 'Angenehme Abflug- und Ankunftszeiten.'],
        },
      ],
    })
    assert.equal('score' in koerper.options[0]!, false)
    assert.equal(clientEnthaeltGeheimnis(koerper), false)
    assert.equal(koerper.options[0]?.airline, 'LX')
    assert.ok(koerper.options[0]?.reasons.length)
  })

  test('ein untergeschobenes Token kippt die Antwort', () => {
    assert.equal(clientEnthaeltGeheimnis({ options: [{ access_token: 'abc' }] }), true)
  })
})
