import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { hotelZustand, hotelZustandMeldung } from '@/lib/hotels/zustand'

describe('Hotelzustand', () => {
  test('Production bleibt hart aus, auch mit Kill Switch und Provider', () => {
    const zustand = hotelZustand({ VERCEL_ENV: 'production', JETNITY_HOTEL_AKTIV: 'true' }, true)
    assert.equal(zustand.aktiv, false)
    if (!zustand.aktiv) assert.equal(zustand.grund, 'production')
    assert.match(hotelZustandMeldung(zustand), /Production/)
  })

  test('ohne Kill Switch bleibt die Suche aus', () => {
    const zustand = hotelZustand({}, true)
    assert.equal(zustand.aktiv, false)
    if (!zustand.aktiv) assert.equal(zustand.grund, 'abgeschaltet')
  })

  test('fehlender Provider ist Feature-unavailable, kein Buildfehler', () => {
    const zustand = hotelZustand({ JETNITY_HOTEL_AKTIV: 'true' }, false)
    assert.equal(zustand.aktiv, false)
    if (!zustand.aktiv) assert.equal(zustand.grund, 'ohne-zugang')
    assert.match(hotelZustandMeldung(zustand), /noch nicht angebunden/)
  })

  test('Preview darf die Suche nur mit Provider einschalten', () => {
    const zustand = hotelZustand({ VERCEL_ENV: 'preview', JETNITY_HOTEL_AKTIV: 'true' }, true)
    assert.deepEqual(zustand, { aktiv: true, umgebung: 'test' })
  })
})
