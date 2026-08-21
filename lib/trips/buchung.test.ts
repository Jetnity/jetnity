// lib/trips/buchung.test.ts

import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import {
  buchungsquelleLesen,
  buchungsstatusAnwenden,
  buchungsstatusLesen,
  gebuchteBuchung,
  istGebucht,
  kannBuchungMarkieren,
  unbestaetigteBuchung,
} from '@/lib/trips/buchung'
import type { TripItem } from '@/types/trips'

function punkt(teil: Partial<TripItem> & Pick<TripItem, 'id' | 'kind'>): TripItem {
  return {
    dayId: 'day-1',
    stageId: 'stage-1',
    title: 'Punkt',
    note: null,
    position: 1,
    startsOn: '2026-08-30',
    startsAt: null,
    endsOn: '2026-09-05',
    endsAt: null,
    priceAmount: 120,
    priceCurrency: 'CHF',
    provider: 'test',
    externalRef: 'ref-1',
    bookingUrl: null,
    ...unbestaetigteBuchung(),
    ...teil,
  }
}

describe('Buchungsstatus', () => {
  test('ein vorhandener Planpunkt ist nicht automatisch gebucht', () => {
    assert.equal(istGebucht(punkt({ id: 'stay-1', kind: 'stay' })), false)
    assert.equal(unbestaetigteBuchung().bookingStatus, 'unconfirmed')
    assert.equal(unbestaetigteBuchung().bookingSource, null)
  })

  test('nur Flug und Stay dürfen manuell als gebucht markiert werden', () => {
    assert.equal(kannBuchungMarkieren(punkt({ id: 'f', kind: 'flight' })), true)
    assert.equal(kannBuchungMarkieren(punkt({ id: 's', kind: 'stay' })), true)
    assert.equal(kannBuchungMarkieren(punkt({ id: 'a', kind: 'activity' })), false)
    assert.equal(kannBuchungMarkieren(punkt({ id: 'n', kind: 'note' })), false)
  })

  test('die manuelle Bestätigung setzt Quelle user, niemals provider', () => {
    const zeit = '2026-08-21T10:00:00.000Z'
    const ergebnis = buchungsstatusAnwenden(punkt({ id: 'f', kind: 'flight' }), true, zeit)
    assert.equal(ergebnis.ok, true)
    if (!ergebnis.ok) return
    assert.equal(ergebnis.punkt.bookingStatus, 'booked')
    assert.equal(ergebnis.punkt.bookingSource, 'user')
    assert.equal(ergebnis.punkt.bookingConfirmedAt, zeit)
    assert.equal(gebuchteBuchung(zeit).bookingSource, 'user')
  })

  test('eine Korrektur nimmt Gebucht zurück auf ausgewählt', () => {
    const gebucht = buchungsstatusAnwenden(punkt({ id: 's', kind: 'stay' }), true, '2026-08-21T10:00:00.000Z')
    assert.equal(gebucht.ok, true)
    if (!gebucht.ok) return
    const korrigiert = buchungsstatusAnwenden(gebucht.punkt, false, '2026-08-21T11:00:00.000Z')
    assert.equal(korrigiert.ok, true)
    if (!korrigiert.ok) return
    assert.deepEqual(
      {
        bookingStatus: korrigiert.punkt.bookingStatus,
        bookingSource: korrigiert.punkt.bookingSource,
        bookingConfirmedAt: korrigiert.punkt.bookingConfirmedAt,
      },
      unbestaetigteBuchung(),
    )
  })

  test('eine Aktivität bleibt unverändert und ohne Provider-Quelle', () => {
    const original = punkt({ id: 'a', kind: 'activity' })
    const ergebnis = buchungsstatusAnwenden(original, true, '2026-08-21T10:00:00.000Z')
    assert.equal(ergebnis.ok, false)
    assert.equal(buchungsquelleLesen('provider'), null)
    assert.equal(buchungsquelleLesen('user'), 'user')
    assert.equal(buchungsstatusLesen('provider'), 'unconfirmed')
    assert.equal(buchungsstatusLesen('booked'), 'booked')
  })
})
