import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { rentalCarZustand, rentalCarZustandMeldung } from '@/lib/rental-cars/zustand'

describe('Mietwagen-Zustand', () => {
  test('Production bleibt hart aus', () => {
    const zustand = rentalCarZustand({ VERCEL_ENV: 'production', JETNITY_RENTAL_CAR_AKTIV: 'true' }, true)
    assert.equal(zustand.aktiv, false)
    if (zustand.aktiv) return
    assert.equal(zustand.grund, 'production')
  })

  test('ohne Provider bleibt Preview unavailable', () => {
    const zustand = rentalCarZustand({ VERCEL_ENV: 'preview', JETNITY_RENTAL_CAR_AKTIV: 'true' }, false)
    assert.equal(zustand.aktiv, false)
    if (zustand.aktiv) return
    assert.equal(zustand.grund, 'ohne-zugang')
    assert.match(rentalCarZustandMeldung(zustand), /vorbereitet/)
  })

  test('Kill Switch aus bleibt abgeschaltet', () => {
    const zustand = rentalCarZustand({ VERCEL_ENV: 'preview' }, true)
    assert.equal(zustand.aktiv, false)
    if (zustand.aktiv) return
    assert.equal(zustand.grund, 'abgeschaltet')
  })
})
