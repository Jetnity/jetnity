import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { rentalCarManuellLesen, rentalCarManuellZuPunkt } from '@/lib/rental-cars/manuell'

describe('Manueller Mietwagen', () => {
  test('geplante Nutzerangabe bleibt unconfirmed und ohne Provider', () => {
    const gelesen = rentalCarManuellLesen({
      pickupName: 'Zürich Flughafen',
      dropoffName: 'Lugano Zentrum',
      pickupOn: '2026-09-12',
      pickupAt: '09:00',
      dropoffOn: '2026-09-16',
      dropoffAt: '18:00',
      vehicleClass: 'compact',
      rentalSupplier: 'Hertz',
    })
    assert.equal(gelesen.ok, true)
    if (!gelesen.ok) return
    const punkt = rentalCarManuellZuPunkt(gelesen.eingabe, {
      id: 'item-1',
      dayId: null,
      stageId: 'stage-1',
      position: 1,
    })
    assert.equal(punkt.kind, 'rental_car')
    assert.equal(punkt.bookingStatus, 'unconfirmed')
    assert.equal(punkt.bookingSource, null)
    assert.equal(punkt.provider, null)
    assert.equal(punkt.bookingUrl, null)
    assert.equal(punkt.rentalEvidence, 'user')
    assert.equal(punkt.originName, 'Zürich Flughafen')
    assert.equal(punkt.destinationName, 'Lugano Zentrum')
    assert.equal(punkt.vehicleClass, 'compact')
    assert.equal(punkt.mobilityMode, null)
  })

  test('unbekannte Bedingungen bleiben unbekannt', () => {
    const gelesen = rentalCarManuellLesen({
      pickupName: 'Zürich Flughafen',
      dropoffName: 'Zürich Flughafen',
    })
    assert.equal(gelesen.ok, true)
    if (!gelesen.ok) return
    const punkt = rentalCarManuellZuPunkt(gelesen.eingabe, {
      id: 'item-2',
      dayId: null,
      stageId: null,
      position: 1,
    })
    assert.equal(punkt.vehicleClass, null)
    assert.equal(punkt.transmission, null)
    assert.equal(punkt.rentalSupplier, null)
    assert.equal(punkt.priceAmount, null)
  })
})
