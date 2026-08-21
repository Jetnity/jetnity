import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { mobilityManuellSchema, mobilitySucheEingabeSchema } from '@/lib/mobility/schema'

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
})
