import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { gastReisenPrimaerCta } from '@/lib/trips/gast-reisen-cta'

describe('Gast auf /reisen', () => {
  test('mit gültigem Entwurf ist Fortsetzen der primäre CTA', () => {
    const cta = gastReisenPrimaerCta({ id: 'trip-1' })
    assert.equal(cta.art, 'fortsetzen')
    assert.equal(cta.label, 'Reise fortsetzen')
    assert.equal(cta.href, '/reisen/trip-1')
  })

  test('ohne Entwurf gibt es keinen Fortsetzen-Zustand', () => {
    assert.equal(gastReisenPrimaerCta(null).art, 'erstellen')
    assert.equal(gastReisenPrimaerCta(undefined).art, 'erstellen')
    assert.equal(gastReisenPrimaerCta(null).label, 'Reise erstellen')
  })
})
