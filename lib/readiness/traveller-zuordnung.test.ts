// lib/readiness/traveller-zuordnung.test.ts

import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import {
  TRAVELLER_ID_FEHLT,
  TRAVELLER_ID_UNGUELTIG,
  travellerIdAufloesen,
} from '@/lib/readiness/traveller-zuordnung'

const TRAVELLER = {
  id: 'aaaaaaaa-0000-4000-8000-000000000007',
  clientRef: 'traveller:1',
}

describe('Traveller-Zuordnung für Readiness', () => {
  test('null-Ref bleibt legal trip-level', () => {
    const ergebnis = travellerIdAufloesen([TRAVELLER], null)
    assert.equal(ergebnis.ok, true)
    if (ergebnis.ok) assert.equal(ergebnis.travellerId, null)
  })

  test('gültige Ref liefert die echte UUID', () => {
    const ergebnis = travellerIdAufloesen([TRAVELLER], 'traveller:1')
    assert.equal(ergebnis.ok, true)
    if (ergebnis.ok) assert.equal(ergebnis.travellerId, TRAVELLER.id)
  })

  test('unbekannte Ref wird abgewiesen', () => {
    const ergebnis = travellerIdAufloesen([TRAVELLER], 'traveller:fehlt')
    assert.equal(ergebnis.ok, false)
    if (!ergebnis.ok) assert.equal(ergebnis.meldung, TRAVELLER_ID_FEHLT)
  })

  test('Ref eines anderen Travellers wird abgewiesen', () => {
    const ergebnis = travellerIdAufloesen([TRAVELLER], 'traveller:2')
    assert.equal(ergebnis.ok, false)
  })

  test('nicht-UUID-Id degradiert nicht zu trip-level', () => {
    const ergebnis = travellerIdAufloesen([{ id: 'traveller:1', clientRef: 'traveller:1' }], 'traveller:1')
    assert.equal(ergebnis.ok, false)
    if (!ergebnis.ok) assert.equal(ergebnis.meldung, TRAVELLER_ID_UNGUELTIG)
  })
})
