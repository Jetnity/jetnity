import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import {
  mobilityKontoUebernahmeSchema,
  mobilityManuellSchema,
  mobilityOptionLesen,
  mobilitySucheEingabeSchema,
} from '@/lib/mobility/schema'

describe('Mobilitätsvalidierung', () => {
  test('lehnt eine Ankunft vor der Abfahrt ab', () => {
    const ergebnis = mobilityManuellSchema.safeParse({
      mode: 'rail',
      originName: 'Zürich',
      destinationName: 'Lugano',
      startsOn: '2026-09-12',
      startsAt: '10:00',
      endsOn: '2026-09-12',
      endsAt: '09:00',
    })
    assert.equal(ergebnis.success, false)
  })

  test('verlangt Preis und Währung gemeinsam', () => {
    const ergebnis = mobilityManuellSchema.safeParse({
      mode: 'bus',
      originName: 'Zürich',
      destinationName: 'Lugano',
      priceAmount: 20,
    })
    assert.equal(ergebnis.success, false)
  })

  test('akzeptiert eine direkte Fähre über Mitternacht', () => {
    const ergebnis = mobilityManuellSchema.safeParse({
      mode: 'ferry',
      originName: 'Split',
      destinationName: 'Hvar',
      startsOn: '2026-09-12',
      startsAt: '23:30',
      endsOn: '2026-09-13',
      endsAt: '01:10',
    })
    assert.equal(ergebnis.success, true)
  })

  test('die Suche braucht Start und Ziel', () => {
    const leer = mobilitySucheEingabeSchema.safeParse({ originName: '', destinationName: 'Lugano' })
    assert.equal(leer.success, false)
    const ok = mobilitySucheEingabeSchema.safeParse({
      originName: 'Zürich',
      destinationName: 'Lugano',
    })
    assert.equal(ok.success, true)
  })

  test('eine Konto-Übernahme akzeptiert nur identifiers', () => {
    const geparst = mobilityKontoUebernahmeSchema.safeParse({
      tripId: '11111111-1111-4111-8111-111111111111',
      optionId: 'opt-1',
      option: { preis: 1 },
      booking_url: 'https://evil.example',
    })
    assert.equal(geparst.success, true)
    if (!geparst.success) return
    assert.deepEqual(Object.keys(geparst.data).sort(), ['optionId', 'tripId'])
  })

  test('eine Option ohne booking_url bleibt ohne Deeplink', () => {
    const option = mobilityOptionLesen({
      id: 'ic-1',
      provider: 'test-rail',
      externalRef: 'ref-1',
      mode: 'rail',
      title: 'Zürich → Lugano',
      originName: 'Zürich',
      destinationName: 'Lugano',
      booking_url: 'https://evil.example/book',
    })
    assert.ok(option)
    assert.equal('booking_url' in option, false)
    assert.equal(option.preis, null)
  })
})
