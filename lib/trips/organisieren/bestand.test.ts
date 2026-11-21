import assert from 'node:assert/strict'
import { test } from 'node:test'

import { organisierenBestand } from '@/lib/trips/organisieren/bestand'
import { n12Punkt, n12Reise } from '@/lib/trips/n12-chronology-1/fixture'
import type { Trip, TripItem } from '@/types/trips'

const GEBUCHT = { bookingStatus: 'booked', bookingSource: 'user', bookingConfirmedAt: '2026-06-01T00:00:00.000Z' } as const

function reiseMit(tag1: TripItem[], tag3: TripItem[] = [], ohneTag: TripItem[] = []): Trip {
  const basis = n12Reise()
  return {
    ...basis,
    ohneTag,
    days: basis.days.map((tag, index) => ({
      ...tag,
      items: index === 0 ? tag1 : index === 2 ? tag3 : [],
    })),
  }
}

test('zeigt nur die Punkte der gewählten Kategorie, chronologisch', () => {
  const reise = reiseMit(
    [
      n12Punkt({ id: 'rueck', kind: 'flight', title: 'BKK–ZRH', startsOn: '2026-06-20', startsAt: '23:00' }),
      n12Punkt({ id: 'hin', kind: 'flight', title: 'ZRH–BKK', startsOn: '2026-06-01', startsAt: '22:10' }),
      n12Punkt({ id: 'hotel', kind: 'stay', title: 'Hotel', startsOn: '2026-06-02', endsOn: '2026-06-05' }),
    ],
  )
  const fluege = organisierenBestand(reise, reise.ohneTag, 'fluege')
  assert.deepEqual(fluege.map((eintrag) => eintrag.id), ['hin', 'rueck'])
  assert.match(fluege[0]!.wann ?? '', /22:10$/)
  assert.deepEqual(organisierenBestand(reise, reise.ohneTag, 'unterkunft').map((eintrag) => eintrag.id), ['hotel'])
  assert.deepEqual(organisierenBestand(reise, reise.ohneTag, 'mietwagen'), [])
})

test('Stand und Preis folgen dem Kostenbild: nichts wird erfunden', () => {
  const reise = reiseMit([
    n12Punkt({ id: 'f', kind: 'flight', title: 'Flug', priceAmount: 1380, priceCurrency: 'CHF', ...GEBUCHT }),
    n12Punkt({ id: 'g', kind: 'flight', title: 'Flug ohne Preis' }),
    n12Punkt({ id: 'h', kind: 'flight', title: 'Flug mit kaputtem Preis', priceAmount: -5, priceCurrency: 'CHF' }),
  ])
  const nachId = Object.fromEntries(organisierenBestand(reise, reise.ohneTag, 'fluege').map((eintrag) => [eintrag.id, eintrag]))
  assert.equal(nachId.f!.stand, 'gebucht')
  assert.deepEqual(nachId.f!.preis, { art: 'preis', betrag: 1380, waehrung: 'CHF' })
  assert.equal(nachId.g!.stand, 'ausgewaehlt')
  assert.deepEqual(nachId.g!.preis, { art: 'ohne' })
  assert.deepEqual(nachId.h!.preis, { art: 'ungueltig' })
})

test('eine Aktivität ist nie «gebucht», auch wenn der Status es behauptet', () => {
  const reise = reiseMit([n12Punkt({ id: 'a', kind: 'activity', title: 'Tour', ...GEBUCHT })])
  assert.equal(organisierenBestand(reise, reise.ohneTag, 'aktivitaeten')[0]!.stand, 'ausgewaehlt')
})

test('ein gleich gespeicherter Punkt an zwei Tagen erscheint einmal; widersprüchliche Doppel gar nicht', () => {
  const hotel = n12Punkt({ id: 's', kind: 'stay', title: 'Hotel' })
  const reise = reiseMit([hotel], [hotel])
  assert.equal(organisierenBestand(reise, reise.ohneTag, 'unterkunft').length, 1)
  const widerspruch = reiseMit([hotel], [{ ...hotel, title: 'Anderes Hotel' }])
  assert.equal(organisierenBestand(widerspruch, widerspruch.ohneTag, 'unterkunft').length, 0)
})

test('ungeplante Punkte zählen mit und stehen ohne Datum am Ende', () => {
  const reise = reiseMit(
    [n12Punkt({ id: 'tour', kind: 'activity', title: 'Tour', startsOn: '2026-06-01' })],
    [],
    [n12Punkt({ id: 'kurs', kind: 'activity', title: 'Kochkurs' })],
  )
  const liste = organisierenBestand(reise, reise.ohneTag, 'aktivitaeten')
  assert.deepEqual(liste.map((eintrag) => eintrag.id), ['tour', 'kurs'])
  assert.equal(liste[1]!.wann, null)
})

test('ohne eigenes Datum gilt das Datum des Tages', () => {
  const reise = reiseMit([n12Punkt({ id: 'tour', kind: 'activity', title: 'Tour', dayId: 'day-1' })])
  assert.ok(organisierenBestand(reise, reise.ohneTag, 'aktivitaeten')[0]!.wann)
})
