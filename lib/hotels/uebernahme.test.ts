import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import type { HotelOption } from '@/lib/hotels/domain'
import { alsHotelMomentaufnahme, hotelMomentaufnahmeAlsPunkt } from '@/lib/hotels/uebernahme'

const OPTION: HotelOption = {
  id: 'opt-1',
  provider: 'test-hotel',
  externalRef: 'ref-77',
  name: 'Hotel Eixample',
  punkt: { lat: 41.39, lon: 2.16 },
  quartierName: 'Eixample',
  adresse: 'Carrer de Provença 1',
  sterne: 4,
  bewertung: 8.9,
  bewertungenAnzahl: 1400,
  preisGesamt: 760,
  preisProNacht: 190,
  preisWaehrung: 'CHF',
  steuernEnthalten: true,
  stornierbar: true,
  stornierungBis: '2026-08-30',
  fruehstueckEnthalten: true,
  zimmerName: 'Doppelzimmer',
}

describe('Hotel-Übernahme', () => {
  test('speichert die Momentaufnahme als stay ohne Booking-URL', () => {
    const aufnahme = alsHotelMomentaufnahme(OPTION, {
      checkIn: '2026-09-12',
      checkOut: '2026-09-16',
    })
    assert.ok(aufnahme)
    assert.equal(aufnahme.kind, 'stay')
    assert.equal(aufnahme.provider, 'test-hotel')
    assert.equal(aufnahme.externalRef, 'ref-77')
    assert.equal(aufnahme.priceAmount, 760)
    assert.equal(aufnahme.bookingUrl, null)
    assert.equal(aufnahme.startsOn, '2026-09-12')
    assert.equal(aufnahme.endsOn, '2026-09-16')
    assert.match(aufnahme.note, /Eixample|Provença|Sterne|Frühstück/)
  })

  test('ein Modell-Preis ohne geprüfte Option wird nicht übernommen', () => {
    assert.equal(
      alsHotelMomentaufnahme(
        { name: 'Traumhotel', preisGesamt: 99, preisWaehrung: 'CHF' },
        { checkIn: '2026-09-12', checkOut: '2026-09-16' },
      ),
      null,
    )
  })

  test('der Planpunkt hängt an der Etappe und behält Handelsfelder', () => {
    const aufnahme = alsHotelMomentaufnahme(OPTION, {
      checkIn: '2026-09-12',
      checkOut: '2026-09-16',
    })
    assert.ok(aufnahme)
    const punkt = hotelMomentaufnahmeAlsPunkt(aufnahme, {
      id: 'item-1',
      dayId: 'day-1',
      stageId: 'stage-1',
      position: 1,
    })
    assert.equal(punkt.kind, 'stay')
    assert.equal(punkt.stageId, 'stage-1')
    assert.equal(punkt.bookingUrl, null)
    assert.equal(punkt.provider, 'test-hotel')
  })
})
