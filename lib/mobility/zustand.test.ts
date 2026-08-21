import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { mobilityZustand, mobilityZustandMeldung } from '@/lib/mobility/zustand'

describe('Mobilitätszustand', () => {
  test('Production bleibt hart aus, auch mit Kill-Switch und Provider', () => {
    const zustand = mobilityZustand({ VERCEL_ENV: 'production', JETNITY_MOBILITY_AKTIV: 'true' }, true)
    assert.deepEqual(zustand, { aktiv: false, grund: 'production' })
    assert.match(mobilityZustandMeldung(zustand), /Production/)
  })

  test('ohne Kill-Switch bleibt Preview aus', () => {
    const zustand = mobilityZustand({ VERCEL_ENV: 'preview' }, true)
    assert.deepEqual(zustand, { aktiv: false, grund: 'abgeschaltet' })
  })

  test('ohne Provider bleibt die Suche unavailable', () => {
    const zustand = mobilityZustand({ VERCEL_ENV: 'preview', JETNITY_MOBILITY_AKTIV: 'true' }, false)
    assert.deepEqual(zustand, { aktiv: false, grund: 'ohne-zugang' })
    assert.match(mobilityZustandMeldung(zustand), /Datenpartner/)
    assert.doesNotMatch(mobilityZustandMeldung(zustand), /Duffel|GetYourGuide|Booking/)
  })
})
