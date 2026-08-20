import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import type { ActivityOption } from '@/lib/activities/domain'
import { alsActivityMomentaufnahme, activityMomentaufnahmeAlsPunkt } from '@/lib/activities/uebernahme'
import { istKommerziell } from '@/lib/reiseaenderung/geschuetzt'

const OPTION: ActivityOption = {
  id: 'opt-1',
  provider: 'test-activity',
  externalRef: 'ref-77',
  title: 'Uffizien',
  description: null,
  locationName: 'Florenz',
  punkt: { lat: 43.77, lon: 11.25 },
  dauerMinuten: 90,
  timeslot: {
    startsOn: '2026-09-12',
    startsAt: '15:00',
    endsOn: '2026-09-12',
    endsAt: '16:30',
  },
  preis: 28,
  preisWaehrung: 'CHF',
  bewertung: 9.1,
  bewertungenAnzahl: 1400,
  stornierbar: true,
  kategorien: ['culture'],
  tags: ['museum'],
}

describe('Aktivitäts-Übernahme', () => {
  test('speichert die Momentaufnahme als activity ohne Booking-URL', () => {
    const aufnahme = alsActivityMomentaufnahme(OPTION, '2026-09-12')
    assert.ok(aufnahme)
    assert.equal(aufnahme.kind, 'activity')
    assert.equal(aufnahme.provider, 'test-activity')
    assert.equal(aufnahme.externalRef, 'ref-77')
    assert.equal(aufnahme.priceAmount, 28)
    assert.equal(aufnahme.bookingUrl, null)
    assert.equal(aufnahme.startsOn, '2026-09-12')
    assert.equal(aufnahme.startsAt, '15:00')
    assert.match(aufnahme.note, /Florenz|Bewertung|Stornierbar/)
  })

  test('ein Modell-Preis ohne geprüfte Option wird nicht übernommen', () => {
    assert.equal(
      alsActivityMomentaufnahme({ title: 'Traumtour', preis: 99, preisWaehrung: 'CHF' }, '2026-09-12'),
      null,
    )
  })

  test('der Planpunkt hängt am Tag und bleibt kommerziell geschützt', () => {
    const aufnahme = alsActivityMomentaufnahme(OPTION, '2026-09-12')
    assert.ok(aufnahme)
    const punkt = activityMomentaufnahmeAlsPunkt(aufnahme, {
      id: 'item-1',
      dayId: 'day-1',
      stageId: 'stage-1',
      position: 1,
    })
    assert.equal(punkt.kind, 'activity')
    assert.equal(punkt.dayId, 'day-1')
    assert.equal(punkt.stageId, 'stage-1')
    assert.equal(punkt.bookingUrl, null)
    assert.equal(istKommerziell(punkt), true)
  })
})
