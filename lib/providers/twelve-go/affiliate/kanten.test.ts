import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { datumKurz } from '@/lib/trips/datum-anzeige'
import { leereMobilitaet } from '@/lib/trips/mobilitaet-felder'
import { unbestaetigteBuchung } from '@/lib/trips/buchung'
import {
  TWELVE_GO_GEPRUEFTE_ROUTEN,
  type TwelveGoGepruefteRoute,
} from '@/lib/providers/twelve-go/affiliate/konstanten'
import {
  twelveGoKantenAusVorkommen,
  twelveGoKantenFuerReise,
  type TwelveGoEndpunkt,
  type TwelveGoTransferFakt,
} from '@/lib/providers/twelve-go/affiliate/kanten'
import { twelveGoGenerischeSuche } from '@/lib/providers/twelve-go/affiliate/url'
import type { Trip, TripItem, TripStage } from '@/types/trips'

const JETZT = '2026-10-27T18:00:00.000Z'
const GENERISCH = twelveGoGenerischeSuche()
const BANGKOK_KOH_CHANG: TwelveGoGepruefteRoute = {
  originPlaceId: 'geonames:9001',
  destinationPlaceId: 'geonames:9002',
  originKind: 'city',
  destinationKind: 'island',
  path: '/de/travel/Bangkok/Koh-Chang/',
}

function ort(teil: Partial<TwelveGoEndpunkt> & Pick<TwelveGoEndpunkt, 'occurrenceId' | 'name'>): TwelveGoEndpunkt {
  return {
    position: 1,
    placeId: null,
    countryCode: 'TH',
    kind: 'city',
    ...teil,
  }
}

function etappe(teil: Partial<TripStage> & Pick<TripStage, 'id' | 'name' | 'position'>): TripStage {
  return {
    countryCode: 'TH',
    arrivalDate: '2026-11-20',
    departureDate: '2026-11-24',
    latitude: null,
    longitude: null,
    placeId: null,
    ...teil,
  }
}

function punkt(teil: Partial<TripItem> & Pick<TripItem, 'id'>): TripItem {
  return {
    dayId: null,
    stageId: null,
    kind: 'transfer',
    title: 'Transfer',
    note: null,
    position: 1,
    startsOn: null,
    startsAt: null,
    endsOn: null,
    endsAt: null,
    priceAmount: null,
    priceCurrency: null,
    provider: null,
    externalRef: null,
    bookingUrl: null,
    ...unbestaetigteBuchung(),
    ...leereMobilitaet(),
    ...teil,
  }
}

function reise(teil: Partial<Trip> = {}): Trip {
  return {
    id: 'trip-personenbezogen',
    clientRef: 'gast-ref-nicht-in-die-url',
    title: 'Plan sasa@example.com',
    origin: 'Zürich',
    originPlaceId: 'geonames:2657896',
    startDate: '2026-11-01',
    endDate: '2026-11-30',
    travellers: 4,
    currency: 'CHF',
    budgetAmount: 3500,
    status: 'draft',
    pace: 'calm',
    interests: ['nature'],
    travelWish: 'zwei Erwachsene, Kind 8',
    revision: 3,
    lastMutationId: 'mutation-1',
    stages: [],
    days: [],
    ohneTag: [],
    createdAt: JETZT,
    updatedAt: JETZT,
    ...teil,
  }
}

function ohnePersonen(href: string) {
  const url = new URL(href)
  assert.equal(url.search, '?z=17323861&sub_id=jetnity-mobility-route')
  assert.doesNotMatch(href, /sasa@example|gast-ref|CHF|trip-personen|mutation|Kind|date=/i)
  assert.equal(href.includes('4'), false)
}

describe('benachbarte 12Go-Kanten', () => {
  test('drei Ziele ergeben zwei Kanten und keine Diagonale', () => {
    const kanten = twelveGoKantenFuerReise(
      reise({
        stages: [
          etappe({ id: 'bkk', name: 'Bangkok', position: 1, placeId: 'geonames:1609350' }),
          etappe({ id: 'koh', name: 'Koh Chang', position: 2, placeId: 'geonames:9002' }),
          etappe({ id: 'hkt', name: 'Phuket', position: 3, placeId: 'geonames:1151254' }),
        ],
      }),
    )
    assert.equal(kanten.length, 2)
    assert.deepEqual(
      kanten.map((kante) => kante.id),
      ['bkk:koh', 'koh:hkt'],
    )
    assert.equal(kanten.every((kante) => kante.art === 'generic'), true)
    assert.equal(kanten.every((kante) => kante.href === GENERISCH), true)
    assert.equal(kanten.every((kante) => kante.vonLand === 'TH' && kante.nachLand === 'TH'), true)
    assert.equal(kanten.some((kante) => kante.id === 'bkk:hkt'), false)
    assert.equal(kanten.some((kante) => kante.vonName === 'Zürich' || kante.nachName === 'Zürich'), false)
    for (const kante of kanten) ohnePersonen(kante.href)
    assert.match(kanten[0]!.aktion, /^Bei 12Go selbst nach Verbindungen suchen$/)
    assert.doesNotMatch(kanten[0]!.aktion, /Angebot|gebucht|ausgewählt/i)
  })

  test('Positionsreihenfolge gewinnt, nicht der Name und nicht die Arrayfolge', () => {
    const kanten = twelveGoKantenAusVorkommen(
      [
        ort({ occurrenceId: 'c', name: 'Phuket', position: 3 }),
        ort({ occurrenceId: 'a', name: 'Zürich-Name', position: 1, countryCode: 'CH' }),
        ort({ occurrenceId: 'b', name: 'Bangkok', position: 2 }),
      ],
      [],
      [],
    )
    assert.deepEqual(
      kanten.map((kante) => `${kante.vonName}:${kante.nachName}`),
      ['Zürich-Name:Bangkok', 'Bangkok:Phuket'],
    )
  })

  test('dieselbe Position folgt der Vorkommenskennung', () => {
    const kanten = twelveGoKantenAusVorkommen(
      [
        ort({ occurrenceId: 'b', name: 'Zweite', position: 1, placeId: 'geonames:2' }),
        ort({ occurrenceId: 'a', name: 'Erste', position: 1, placeId: 'geonames:1' }),
      ],
      [],
      [],
    )
    assert.equal(kanten[0]?.id, 'a:b')
  })

  test('Wiederholung und gleiches Land bleiben eigene Vorkommen', () => {
    const kanten = twelveGoKantenFuerReise(
      reise({
        stages: [
          etappe({ id: 'bkk-1', name: 'Bangkok', position: 1, placeId: 'geonames:1609350' }),
          etappe({ id: 'hkt', name: 'Phuket', position: 2, placeId: 'geonames:1151254' }),
          etappe({ id: 'bkk-2', name: 'Bangkok', position: 3, placeId: 'geonames:1609350' }),
        ],
      }),
    )
    assert.deepEqual(
      kanten.map((kante) => kante.id),
      ['bkk-1:hkt', 'hkt:bkk-2'],
    )
  })

  test('gleiche Beschriftung mit anderer Kennung bleibt eine Kante', () => {
    const kanten = twelveGoKantenFuerReise(
      reise({
        stages: [
          etappe({ id: 'eins', name: 'Bangkok', position: 1, placeId: 'geonames:1609350' }),
          etappe({ id: 'zwei', name: 'Bangkok', position: 2, placeId: 'geonames:999001' }),
        ],
      }),
    )
    assert.equal(kanten.length, 1)
    assert.equal(kanten[0]?.vonPlaceId, 'geonames:1609350')
    assert.equal(kanten[0]?.nachPlaceId, 'geonames:999001')
    assert.equal(kanten[0]?.art, 'generic')
  })

  test('ein Land allein, ein Flughafen und eine Lücke erfinden keine Strecke', () => {
    const land = twelveGoKantenFuerReise(
      reise({
        stages: [
          etappe({ id: 'th', name: 'Thailand', position: 1, countryCode: 'TH', placeId: null }),
          etappe({ id: 'vn', name: 'Vietnam', position: 2, countryCode: 'VN', placeId: null }),
        ],
      }),
    )
    assert.equal(land[0]?.art, 'generic')
    assert.doesNotMatch(land[0]!.href, /\/travel\//)

    const flughafen = twelveGoKantenFuerReise(
      reise({
        stages: [
          etappe({ id: 'bkk', name: 'Bangkok', position: 1, placeId: 'airport:BKK' }),
          etappe({ id: 'hkt', name: 'Phuket', position: 2, placeId: 'airport:HKT' }),
        ],
      }),
    )
    assert.equal(flughafen[0]?.art, 'generic')

    const luecke = twelveGoKantenAusVorkommen(
      [
        ort({ occurrenceId: 'a', name: 'Bangkok', position: 1 }),
        ort({ occurrenceId: 'leer', name: '   ', position: 2 }),
        ort({ occurrenceId: 'c', name: 'Phuket', position: 3 }),
      ],
      [],
      [BANGKOK_KOH_CHANG],
    )
    assert.equal(luecke.length, 0)
  })

  test('Mehrländer-Pfad bleibt paarweise und ohne Heimat', () => {
    const kanten = twelveGoKantenFuerReise(
      reise({
        origin: 'Bern',
        stages: [
          etappe({ id: 'sg', name: 'Singapur', position: 1, countryCode: 'SG', placeId: 'geonames:1880252' }),
          etappe({ id: 'bkk', name: 'Bangkok', position: 2, countryCode: 'TH', placeId: 'geonames:1609350' }),
          etappe({ id: 'hkt', name: 'Phuket', position: 3, countryCode: 'TH', placeId: 'geonames:1151254' }),
        ],
      }),
    )
    assert.deepEqual(
      kanten.map((kante) => [kante.vonLand, kante.nachLand]),
      [
        ['SG', 'TH'],
        ['TH', 'TH'],
      ],
    )
    assert.equal(kanten.some((kante) => kante.nachName === 'Bern' || kante.vonName === 'Bern'), false)
  })

  test('eingespritzte Prüfroute gilt nur in dieser Richtung', () => {
    const hin = twelveGoKantenAusVorkommen(
      [
        ort({ occurrenceId: 'bkk', name: 'Bangkok', position: 1, placeId: 'geonames:9001', kind: 'city' }),
        ort({ occurrenceId: 'koh', name: 'Koh Chang', position: 2, placeId: 'geonames:9002', kind: 'island' }),
        ort({ occurrenceId: 'hkt', name: 'Phuket', position: 3, placeId: 'geonames:9003', kind: 'city' }),
      ],
      [],
      [BANGKOK_KOH_CHANG],
    )
    assert.equal(hin[0]?.art, 'route')
    assert.equal(hin[1]?.art, 'generic')
    assert.match(hin[0]!.href, /\/de\/travel\/Bangkok\/Koh-Chang\/\?z=17323861&sub_id=jetnity-mobility-route$/)
    assert.equal(hin[0]?.aktion, 'Verbindungen Bangkok–Koh Chang bei 12Go ansehen')
    assert.equal(hin[1]?.href, GENERISCH)
    assert.doesNotMatch(hin[1]!.href, /Phuket|Koh-Chang/)
    ohnePersonen(hin[0]!.href)

    const rueck = twelveGoKantenAusVorkommen(
      [
        ort({ occurrenceId: 'koh', name: 'Koh Chang', position: 1, placeId: 'geonames:9002', kind: 'island' }),
        ort({ occurrenceId: 'bkk', name: 'Bangkok', position: 2, placeId: 'geonames:9001', kind: 'city' }),
      ],
      [],
      [BANGKOK_KOH_CHANG],
    )
    assert.equal(rueck[0]?.art, 'generic')
    assert.equal(rueck[0]?.href, GENERISCH)
  })

  test('Produktionsreise macht aus dem Beispiel keine Deep-Link-Strecke', () => {
    const kanten = twelveGoKantenFuerReise(
      reise({
        stages: [
          etappe({ id: 'bkk', name: 'Bangkok', position: 1, placeId: 'geonames:1609350' }),
          etappe({ id: 'koh', name: 'Koh Chang', position: 2, placeId: 'geonames:9002' }),
        ],
      }),
    )
    assert.equal(TWELVE_GO_GEPRUEFTE_ROUTEN.length, 0)
    assert.equal(kanten[0]?.art, 'generic')
    assert.equal(kanten[0]?.href, GENERISCH)
    assert.equal(kanten[0]?.streckenHinweis, 'Bitte Strecke und Datum bei 12Go auswählen')
  })

  test('Namen und feindliche Hosts verlassen die sichtbare Beschriftung nicht', () => {
    const kanten = twelveGoKantenAusVorkommen(
      [
        ort({
          occurrenceId: 'a',
          name: 'https://evil.example/de/travel/Bangkok/Koh-Chang/?z=1',
          position: 1,
          placeId: null,
          kind: null,
        }),
        ort({ occurrenceId: 'b', name: 'javascript:alert(1)', position: 2, placeId: 'airport:BKK', kind: 'airport' }),
      ],
      [],
      [BANGKOK_KOH_CHANG],
    )
    assert.equal(kanten[0]?.href, GENERISCH)
    assert.doesNotMatch(kanten[0]!.href, /evil\.example|javascript/)
  })

  test('Datum nur aus genau einem passenden Transfer, nie aus Ankunft oder Reisezeitraum', () => {
    const ziele = [
      ort({ occurrenceId: 'bkk', name: 'Bangkok', position: 1, placeId: 'geonames:9001', kind: 'city' }),
      ort({ occurrenceId: 'koh', name: 'Koh Chang', position: 2, placeId: 'geonames:9002', kind: 'island' }),
    ]
    const ohne = twelveGoKantenAusVorkommen(ziele, [], [])
    assert.equal(ohne[0]?.geplantesDatum, null)
    assert.equal(ohne[0]?.datumHinweis, 'Bitte das Datum bei 12Go wählen.')

    const transfer: TwelveGoTransferFakt = {
      id: 't1',
      originPlaceId: 'geonames:9001',
      destinationPlaceId: 'geonames:9002',
      startsOn: '2026-11-15',
    }
    const mit = twelveGoKantenAusVorkommen(ziele, [transfer], [BANGKOK_KOH_CHANG])
    assert.equal(mit[0]?.geplantesDatum, '2026-11-15')
    assert.match(mit[0]!.datumHinweis, new RegExp(`Geplant am ${datumKurz('2026-11-15').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`))
    assert.match(mit[0]!.datumHinweis, /bei 12Go bestätigen/)
    assert.doesNotMatch(mit[0]!.href, /2026-11-15|date=/)

    const doppelt = twelveGoKantenAusVorkommen(ziele, [transfer, { ...transfer, id: 't2' }], [])
    assert.equal(doppelt[0]?.geplantesDatum, null)

    const nurName: TwelveGoTransferFakt = {
      id: 'name',
      originPlaceId: 'geonames:111',
      destinationPlaceId: 'geonames:222',
      startsOn: '2026-11-15',
    }
    assert.equal(twelveGoKantenAusVorkommen(ziele, [nurName], [])[0]?.geplantesDatum, null)

    const unmoeglich = twelveGoKantenAusVorkommen(
      ziele,
      [{ id: 'x', originPlaceId: 'geonames:9001', destinationPlaceId: 'geonames:9002', startsOn: '2026-02-31' }],
      [],
    )
    assert.equal(unmoeglich[0]?.geplantesDatum, null)

    const mitZeit = twelveGoKantenAusVorkommen(
      ziele,
      [{ id: 'z', originPlaceId: 'geonames:9001', destinationPlaceId: 'geonames:9002', startsOn: '2026-11-15T00:00:00Z' }],
      [],
    )
    assert.equal(mitZeit[0]?.geplantesDatum, null)
  })

  test('Reisegraph ignoriert Ankunft, Reisebeginn und Übernacht-Ende', () => {
    const kanten = twelveGoKantenFuerReise(
      reise({
        startDate: '2026-11-01',
        endDate: '2026-11-30',
        stages: [
          etappe({
            id: 'bkk',
            name: 'Bangkok',
            position: 1,
            placeId: 'geonames:9001',
            arrivalDate: '2026-11-01',
            departureDate: '2026-11-14',
          }),
          etappe({
            id: 'koh',
            name: 'Koh Chang',
            position: 2,
            placeId: 'geonames:9002',
            arrivalDate: '2026-11-16',
            departureDate: '2026-11-20',
          }),
        ],
        ohneTag: [
          punkt({
            id: 'nacht',
            originPlaceId: 'geonames:9001',
            destinationPlaceId: 'geonames:9002',
            originName: 'Bangkok',
            destinationName: 'Koh Chang',
            startsOn: '2026-11-15',
            endsOn: '2026-11-16',
          }),
        ],
      }),
    )
    assert.equal(kanten[0]?.geplantesDatum, '2026-11-15')
    assert.doesNotMatch(kanten[0]!.href, /2026/)
    assert.doesNotMatch(kanten[0]!.datumHinweis, /2026-11-01|2026-11-16|2026-11-30/)
  })

  test('wiederholtes X→Y bindet ein Transferdatum an kein Vorkommen', () => {
    const hinundher = [
      ort({ occurrenceId: 'a1', name: 'Bangkok', position: 1, placeId: 'geonames:9001', kind: 'city' }),
      ort({ occurrenceId: 'b1', name: 'Koh Chang', position: 2, placeId: 'geonames:9002', kind: 'island' }),
      ort({ occurrenceId: 'a2', name: 'Bangkok', position: 3, placeId: 'geonames:9001', kind: 'city' }),
      ort({ occurrenceId: 'b2', name: 'Koh Chang', position: 4, placeId: 'geonames:9002', kind: 'island' }),
    ]
    const einer: TwelveGoTransferFakt = {
      id: 't1',
      originPlaceId: 'geonames:9001',
      destinationPlaceId: 'geonames:9002',
      startsOn: '2026-11-15',
    }
    const einmal = twelveGoKantenAusVorkommen(hinundher, [einer], [])
    assert.deepEqual(
      einmal.map((kante) => kante.id),
      ['a1:b1', 'b1:a2', 'a2:b2'],
    )
    assert.equal(einmal[0]?.geplantesDatum, null)
    assert.equal(einmal[2]?.geplantesDatum, null)
    assert.equal(einmal[0]?.datumHinweis, 'Bitte das Datum bei 12Go wählen.')
    assert.equal(einmal[2]?.datumHinweis, 'Bitte das Datum bei 12Go wählen.')
    assert.doesNotMatch(einmal[0]!.href, /date=|2026-11-15/)
    assert.doesNotMatch(einmal[2]!.href, /date=|2026-11-15/)
    assert.equal(einmal[1]?.geplantesDatum, null)

    const zwei = twelveGoKantenAusVorkommen(
      hinundher,
      [einer, { id: 't2', originPlaceId: 'geonames:9001', destinationPlaceId: 'geonames:9002', startsOn: '2026-11-20' }],
      [],
    )
    assert.equal(zwei[0]?.geplantesDatum, null)
    assert.equal(zwei[2]?.geplantesDatum, null)
    assert.doesNotMatch(`${zwei[0]?.datumHinweis} ${zwei[2]?.datumHinweis}`, /2026-11-15|2026-11-20/)

    const eindeutig = twelveGoKantenAusVorkommen(
      [
        hinundher[0]!,
        hinundher[1]!,
        ort({ occurrenceId: 'c', name: 'Phuket', position: 3, placeId: 'geonames:9003', kind: 'city' }),
      ],
      [einer],
      [],
    )
    assert.equal(eindeutig[0]?.geplantesDatum, '2026-11-15')
    assert.equal(eindeutig[1]?.geplantesDatum, null)
    assert.doesNotMatch(eindeutig[0]!.href, /date=|2026-11-15/)
  })

  test('Umsortieren und eine geänderte Kante lassen das alte Datum nicht mitwandern', () => {
    const transfer: TwelveGoTransferFakt = {
      id: 't1',
      originPlaceId: 'geonames:9001',
      destinationPlaceId: 'geonames:9002',
      startsOn: '2026-11-15',
    }
    const offen = twelveGoKantenAusVorkommen(
      [
        ort({ occurrenceId: 'a1', name: 'Bangkok', position: 1, placeId: 'geonames:9001' }),
        ort({ occurrenceId: 'b1', name: 'Koh Chang', position: 2, placeId: 'geonames:9002' }),
      ],
      [transfer],
      [],
    )
    assert.equal(offen[0]?.geplantesDatum, '2026-11-15')

    const gedreht = twelveGoKantenAusVorkommen(
      [
        ort({ occurrenceId: 'b1', name: 'Koh Chang', position: 1, placeId: 'geonames:9002' }),
        ort({ occurrenceId: 'a1', name: 'Bangkok', position: 2, placeId: 'geonames:9001' }),
      ],
      [transfer],
      [],
    )
    assert.equal(gedreht[0]?.id, 'b1:a1')
    assert.equal(gedreht[0]?.geplantesDatum, null)
    assert.doesNotMatch(gedreht[0]!.href, /date=|2026-11-15/)

    const wiederholt = twelveGoKantenAusVorkommen(
      [
        ort({ occurrenceId: 'a1', name: 'Bangkok', position: 1, placeId: 'geonames:9001' }),
        ort({ occurrenceId: 'b1', name: 'Koh Chang', position: 2, placeId: 'geonames:9002' }),
        ort({ occurrenceId: 'a2', name: 'Bangkok', position: 3, placeId: 'geonames:9001' }),
        ort({ occurrenceId: 'b2', name: 'Koh Chang', position: 4, placeId: 'geonames:9002' }),
      ],
      [transfer],
      [],
    )
    assert.equal(wiederholt.every((kante) => kante.geplantesDatum === null), true)

    const veraltet = twelveGoKantenAusVorkommen(
      [
        ort({ occurrenceId: 'a1', name: 'Bangkok', position: 1, placeId: 'geonames:9001' }),
        ort({ occurrenceId: 'b1', name: 'Phuket', position: 2, placeId: 'geonames:9003' }),
      ],
      [transfer],
      [],
    )
    assert.equal(veraltet[0]?.geplantesDatum, null)
    assert.equal(veraltet[0]?.datumHinweis, 'Bitte das Datum bei 12Go wählen.')
  })

  test('Umsortierung verwirft die alte Richtung', () => {
    const aufbau = [
      etappe({ id: 'bkk', name: 'Bangkok', position: 1, placeId: 'geonames:9001' }),
      etappe({ id: 'koh', name: 'Koh Chang', position: 2, placeId: 'geonames:9002' }),
    ]
    const hin = twelveGoKantenAusVorkommen(
      aufbau.map((etappe) => ({
        occurrenceId: etappe.id,
        position: etappe.position,
        name: etappe.name,
        placeId: etappe.placeId,
        countryCode: etappe.countryCode,
        kind: etappe.placeId === 'geonames:9001' ? ('city' as const) : ('island' as const),
      })),
      [],
      [BANGKOK_KOH_CHANG],
    )
    const zurueck = twelveGoKantenAusVorkommen(
      aufbau.map((etappe) => ({
        occurrenceId: etappe.id,
        position: etappe.id === 'bkk' ? 2 : 1,
        name: etappe.name,
        placeId: etappe.placeId,
        countryCode: etappe.countryCode,
        kind: etappe.placeId === 'geonames:9001' ? ('city' as const) : ('island' as const),
      })),
      [],
      [BANGKOK_KOH_CHANG],
    )
    assert.equal(hin[0]?.art, 'route')
    assert.equal(zurueck[0]?.id, 'koh:bkk')
    assert.equal(zurueck[0]?.art, 'generic')
  })

  test('zweites Register oder unpassende Art bleibt allgemein', () => {
    const ziele = [
      ort({ occurrenceId: 'a', name: 'Bangkok', position: 1, placeId: 'geonames:9001', kind: 'city' }),
      ort({ occurrenceId: 'b', name: 'Koh Chang', position: 2, placeId: 'geonames:9002', kind: 'island' }),
    ]
    const doppelt = twelveGoKantenAusVorkommen(ziele, [], [BANGKOK_KOH_CHANG, { ...BANGKOK_KOH_CHANG }])
    assert.equal(doppelt[0]?.art, 'generic')
    const land = twelveGoKantenAusVorkommen(
      ziele.map((ziel) => ({ ...ziel, kind: 'country' as const })),
      [],
      [BANGKOK_KOH_CHANG],
    )
    assert.equal(land[0]?.art, 'generic')
    const kaputt = twelveGoKantenAusVorkommen(
      ziele,
      [],
      [{ ...BANGKOK_KOH_CHANG, path: '/de/travel/Bangkok/Koh-Chang/?date=2026-11-15' }],
    )
    assert.equal(kaputt[0]?.art, 'generic')
    assert.equal(kaputt[0]?.href, GENERISCH)
  })
})
