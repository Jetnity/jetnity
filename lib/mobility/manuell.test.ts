import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { mobilityManuellLesen, mobilityManuellZuPunkt } from '@/lib/mobility/manuell'

describe('Manuelle Mobilität', () => {
  test('speichert Nutzerangaben als transfer mit evidence user', () => {
    const gelesen = mobilityManuellLesen({
      mode: 'rail',
      originName: 'Zürich HB',
      destinationName: 'Lugano',
      startsOn: '2026-09-12',
      startsAt: '08:10',
    })
    assert.equal(gelesen.ok, true)
    if (!gelesen.ok) return
    const punkt = mobilityManuellZuPunkt(gelesen.eingabe, {
      id: 'item-1',
      dayId: 'day-1',
      stageId: 'stage-1',
      position: 1,
    })
    assert.equal(punkt.kind, 'transfer')
    assert.equal(punkt.mobilityMode, 'rail')
    assert.equal(punkt.mobilityEvidence, 'user')
    assert.equal(punkt.bookingStatus, 'unconfirmed')
    assert.equal(punkt.provider, null)
    assert.equal(punkt.bookingUrl, null)
    assert.equal(punkt.title, 'Zürich HB → Lugano')
  })

  test('lehnt eine Booking-URL stillschweigend ab, weil das Schema sie nicht kennt', () => {
    const gelesen = mobilityManuellLesen({
      mode: 'bus',
      originName: 'Zürich',
      destinationName: 'Mailand',
      bookingUrl: 'https://evil.example/book',
      provider: 'secret-provider',
    })
    assert.equal(gelesen.ok, true)
    if (!gelesen.ok) return
    const punkt = mobilityManuellZuPunkt(gelesen.eingabe, {
      id: 'item-2',
      dayId: null,
      stageId: null,
      position: 1,
    })
    assert.equal(punkt.bookingUrl, null)
    assert.equal(punkt.provider, null)
  })
})
