import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import EtappenTage from '@/components/trips/reiseplan/EtappenTage'
import { beispielreise } from '@/lib/reiseaenderung/fixtures/reise'
import { etappenAgenda, offenerEtappentag, tagesKonflikte } from '@/lib/trips/etappen-tagesagenda'
import { tripZeitpruefung } from '@/lib/trips/trip-timeline-temporal-review-1'
import type { TripDay, TripItem } from '@/types/trips'

function tag(index: number, dayDate: string | null, items: TripItem[] = []): TripDay {
  return { id: 'tag-' + index, dayDate, dayIndex: index, stageId: 'etappe', title: null, items }
}

function punkt(id: string, felder: Partial<TripItem> = {}): TripItem {
  return {
    ...beispielreise().days[0].items[0], id, title: id, kind: 'activity', stageId: 'etappe',
    dayId: 'tag-1', startsOn: '2027-01-01', endsOn: null, startsAt: null, endsAt: null,
    routeItinerary: null, ...felder,
  }
}

test('Kalendertage bleiben bei Jahreswechsel, doppeltem Datum und Datumsgrenze stabil', () => {
  const original = [
    tag(5, null), tag(4, '2027-02-29'), tag(3, '2027-01-01'), tag(2, '2027-01-01'), tag(1, '2026-12-31'),
  ]
  const vorher = structuredClone(original)
  const tage = etappenAgenda(original)
  assert.deepEqual(tage.map((t) => t.index), [1, 2, 3, 4, 5])
  assert.equal(tage[0].kalendertag, 31)
  assert.equal(tage[0].wochentag, 'Donnerstag')
  assert.equal(tage[1].kalendertag, 1)
  assert.equal(tage[1].wochentag, 'Freitag')
  assert.ok(tage[3].datumUngueltig)
  assert.equal(tage[4].datumUngueltig, false)
  assert.deepEqual(original, vorher)
})

test('ein leerer Tag kann gezielt geöffnet werden; vergangene und ungültige Daten fallen heraus', () => {
  const tage = etappenAgenda([
    tag(1, '2026-12-31'), tag(2, '2027-01-01', [punkt('Notiz')]), tag(3, '2027-01-02'),
    tag(4, '2027-02-30'), tag(5, null),
  ])
  assert.equal(offenerEtappentag(tage, '2027-01-01')?.id, 'tag-3')
  assert.equal(offenerEtappentag(tage, '2027-03-01')?.id, 'tag-5')
  assert.equal(offenerEtappentag(tage.slice(0, 3), '2027-03-01'), undefined)
})

test('die Vorschau enthält gebundene Uhrzeiten und einen flexiblen Punkt, ohne alle anderen Einträge zu verlieren', () => {
  const tage = etappenAgenda([tag(1, '2027-01-01', [
    punkt('Museumsbesuch', { startsAt: '10:30' }), punkt('Frühstück', { startsAt: '07:00' }), punkt('Spaziergang'),
  ])])
  assert.equal(tage[0].anzahl, 3)
  assert.deepEqual(tage[0].vorschau.map((e) => [e.punkt.title, e.label]), [
    ['Frühstück', '07:00'], ['Spaziergang', 'Ohne Uhrzeit'],
  ])
})

test('Abweichendes Datum, Übernachtfahrt, reine Endzeit und ungültige Werte lassen sich unterscheiden', () => {
  function label(felder: Partial<TripItem>) {
    return etappenAgenda([tag(1, '2027-01-01', [punkt('Punkt', felder)])])[0].vorschau[0].label
  }
  assert.match(label({ startsOn: '2026-12-31', startsAt: '16:00' }), /31.*2026.*16:00/)
  assert.match(label({ startsAt: '23:00', endsOn: '2027-01-02', endsAt: '06:00' }), /23:00.*2.*2027.*06:00/)
  assert.match(label({ startsOn: '2027-01-02', startsAt: '09:00', endsOn: '2027-01-01', endsAt: '17:00' }), /2.*2027.*09:00.*1.*2027.*17:00/)
  assert.equal(label({ startsAt: '23:00', endsAt: '06:00' }), '23:00 · Ende 06:00 (Datum offen)')
  assert.equal(label({ endsAt: '17:00' }), 'Bis 17:00')
  assert.equal(label({ startsAt: '25:17' }), 'Zeit prüfen')
  assert.equal(label({ startsOn: '2027-02-29' }), 'Zeit prüfen')
})

test('Flug über die Datumsgrenze zeigt den gespeicherten lokalen Abflug des ersten Segments', () => {
  const airport = (airportCode: string) => ({ airportCode, countryCode: null, city: null, country: null })
  const flug = punkt('Tokio – Los Angeles', {
    kind: 'flight', startsAt: '12:34', routeItinerary: {
      v: 1, type: 'flight_route_itinerary', legs: [{ segments: [{
        origin: airport('NRT'), destination: airport('LAX'),
        departureDate: '2027-01-02', departureTime: '00:30', arrivalDate: '2027-01-01', arrivalTime: '18:30',
      }] }],
    },
  })
  assert.match(etappenAgenda([tag(1, '2027-01-01', [flug])])[0].vorschau[0].label, /2.*2027.*00:30/)
})

test('gleiche lokale Uhrzeiten belegen keinen Konflikt; nur ein explizit vergleichbarer Kontext erhält einen Hinweis', () => {
  const make = (id: string, airport: string) => punkt(id, {
    kind: 'transfer', mobilityEvidence: 'user', originPlaceId: airport, destinationPlaceId: airport,
    startsAt: '10:00', endsOn: '2027-01-01', endsAt: '11:00',
  })
  const graph = (items: TripItem[]) => ({ ...beispielreise(), days: [tag(1, '2027-01-01', items)], ohneTag: [] })
  const getrennt = graph([make('Transfer eins', 'airport:ZRH'), make('Transfer zwei', 'airport:NRT')])
  assert.equal(tagesKonflikte(getrennt.days, tripZeitpruefung(getrennt)).size, 0)
  const gemeinsam = graph([make('Transfer eins', 'airport:ZRH'), make('Transfer zwei', 'airport:ZRH')])
  assert.deepEqual(tagesKonflikte(gemeinsam.days, tripZeitpruefung(gemeinsam)).get('tag-1'), {
    ids: ['Transfer eins', 'Transfer zwei'], sicher: false, minuten: null,
  })
  const hotel = graph([make('Transfer eins', 'airport:ZRH'), { ...make('Hotel', 'airport:ZRH'), kind: 'stay' }])
  assert.equal(tagesKonflikte(hotel.days, tripZeitpruefung(hotel)).size, 0)
})

test('die Agenda hat auch bei langen Aufenthalten für jeden Tag einen echten Button; ohne zugewiesene Tage bleibt sie leer', () => {
  const reise = beispielreise()
  const render = (days: TripDay[]) => renderToStaticMarkup(createElement(EtappenTage, { days, reise, onDay: () => {} }))
  const lang = render(Array.from({ length: 9 }, (_, i) => tag(i + 1, null)))
  assert.match(lang, /<details/)
  assert.match(lang, /5 weitere Tage/)
  assert.equal((lang.match(/class="et-agenda-tag"/g) ?? []).length, 9)
  assert.match(render([]), /noch kein Reisetag zugeordnet/)
})
