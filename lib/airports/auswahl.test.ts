import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import {
  FLUGHAFEN_MELDUNG,
  flughafenAusFreitext,
  flughafenAusReiseort,
  flugSucheBeine,
  iataBestaetigt,
} from '@/lib/airports/auswahl'

describe('Flughafenauswahl', () => {
  test('nur eine bestätigte IATA darf in die Flugsuche', () => {
    const zrh = { iata: 'ZRH', name: 'Zürich Airport · ZRH' }
    assert.equal(iataBestaetigt(zrh), 'ZRH')
    assert.equal(flughafenAusFreitext('Zürich'), null)
    assert.equal(flughafenAusFreitext('ZRH'), null)
    assert.equal(flughafenAusFreitext('XXX'), null)

    const ok = flugSucheBeine({
      herkunft: zrh,
      ziel: { iata: 'BKK', name: 'Bangkok · BKK' },
      herkunftText: 'Zürich Airport · ZRH',
      zielText: 'Bangkok · BKK',
      hin: '2026-09-01',
      mitRueck: false,
    })
    assert.equal('legs' in ok, true)
    if ('legs' in ok) {
      assert.deepEqual(ok.legs, [{ origin: 'ZRH', destination: 'BKK', date: '2026-09-01' }])
    }
  })

  test('unbestätigter natürlicher Text wird nicht zu IATA', () => {
    const fehl = flugSucheBeine({
      herkunft: null,
      ziel: null,
      herkunftText: 'Zürich',
      zielText: 'Bangkok',
      hin: '2026-09-01',
      mitRueck: false,
    })
    assert.equal('fehler' in fehl, true)
    if ('fehler' in fehl) {
      assert.equal(fehl.fehler.herkunft, FLUGHAFEN_MELDUNG.unbekannt)
      assert.equal(fehl.fehler.ziel, FLUGHAFEN_MELDUNG.unbekannt)
    }
  })

  test('Trip-Origin wird nur bei airport-Place-ID übernommen', () => {
    assert.deepEqual(flughafenAusReiseort({ placeId: 'airport:ZRH', name: 'Zürich Airport' }), {
      iata: 'ZRH',
      name: 'Zürich Airport',
    })
    assert.equal(flughafenAusReiseort({ placeId: 'geonames:2657896', name: 'Zürich' }), null)
    assert.equal(flughafenAusReiseort({ placeId: null, name: 'ZRH' }), null)
  })
})
