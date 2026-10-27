import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'

import {
  DISCOVERCARS_BKK_HREF,
  DISCOVERCARS_BKK_STATION,
  DISCOVERCARS_GENERISCH_HREF,
  discoverCarsAffiliateZiel,
  discoverCarsIstBkkStation,
  discoverCarsMehrereStationen,
  discoverCarsStationNachReisewechsel,
} from '@/lib/providers/discovercars/affiliate/ziel'

const hier = dirname(fileURLToPath(import.meta.url))

const VERBOTEN = [
  'passport',
  'P1234567',
  'client-ref-geheim',
  'trip-uuid-geheim',
  '1988-04-02',
  '25',
  'utm_source',
  'sub_id',
  'evil.example',
  'javascript:',
  'bangkok-city',
  'THB',
  'stages[0]',
]

function ziel(eingabe: { ausdruecklich: boolean; station: unknown } & Record<string, unknown>) {
  return discoverCarsAffiliateZiel(eingabe)
}

describe('DiscoverCars Affiliate-Adresse', () => {
  test('die beiden Konstanten sind exakt die geprüften Adressen', () => {
    assert.equal(DISCOVERCARS_GENERISCH_HREF, 'https://www.discovercars.com/?a_aid=jetnity')
    assert.equal(
      DISCOVERCARS_BKK_HREF,
      'https://www.discovercars.com/de/thailand/bangkok/suvarnabhumi-airport-bkk?a_aid=jetnity&currency=chf',
    )
    const allgemein = new URL(DISCOVERCARS_GENERISCH_HREF)
    assert.equal(allgemein.protocol, 'https:')
    assert.equal(allgemein.hostname, 'www.discovercars.com')
    assert.equal(allgemein.pathname, '/')
    assert.deepEqual([...allgemein.searchParams.entries()], [['a_aid', 'jetnity']])

    const bkk = new URL(DISCOVERCARS_BKK_HREF)
    assert.equal(bkk.pathname, '/de/thailand/bangkok/suvarnabhumi-airport-bkk')
    assert.deepEqual(
      [...bkk.searchParams.entries()],
      [
        ['a_aid', 'jetnity'],
        ['currency', 'chf'],
      ],
    )
    assert.equal(bkk.hash, '')
    assert.equal(bkk.username, '')
    assert.equal(bkk.port, '')
  })

  test('ohne ausdrückliche Wahl bleibt die allgemeine Suche', () => {
    const ergebnis = ziel({ ausdruecklich: false, station: DISCOVERCARS_BKK_STATION })
    assert.equal(ergebnis.art, 'generisch')
    assert.equal(ergebnis.href, DISCOVERCARS_GENERISCH_HREF)
    assert.equal(ergebnis.href.includes('currency'), false)
    assert.equal(ergebnis.href.includes('thailand'), false)
  })

  test('ausdrückliche geprüfte Station öffnet nur den BKK-Link', () => {
    const ergebnis = ziel({ ausdruecklich: true, station: { ...DISCOVERCARS_BKK_STATION } })
    assert.equal(ergebnis.art, 'bkk')
    assert.equal(ergebnis.href, DISCOVERCARS_BKK_HREF)
    assert.equal(discoverCarsIstBkkStation(DISCOVERCARS_BKK_STATION), true)
  })

  test('Stadt Bangkok, Land und IATA allein sind nicht BKK', () => {
    const proben = [
      'Bangkok',
      'bangkok',
      'BKK',
      'bkk',
      'VTBS',
      'Suvarnabhumi Airport',
      'TH',
      'Thailand',
      { iata: 'BKK' },
      { name: 'Bangkok', iata: 'BKK' },
      { ...DISCOVERCARS_BKK_STATION, name: 'Bangkok' },
      { ...DISCOVERCARS_BKK_STATION, klasse: 'city' },
      { ...DISCOVERCARS_BKK_STATION, iata: 'bkk' },
      { ...DISCOVERCARS_BKK_STATION, icao: 'VTBD' },
      { ...DISCOVERCARS_BKK_STATION, currency: 'usd' },
      { art: 'flughafen', iata: 'BKK', icao: 'VTBS', name: 'Suvarnabhumi Airport' },
    ]
    for (const station of proben) {
      const ergebnis = ziel({ ausdruecklich: true, station })
      assert.equal(ergebnis.href, DISCOVERCARS_GENERISCH_HREF, JSON.stringify(station))
      assert.equal(discoverCarsIstBkkStation(station), false)
    }
  })

  test('Etappe, Koordinate, Titel und feindliche Adressen werden nicht übernommen', () => {
    const feindlich = {
      ausdruecklich: true,
      station: {
        ...DISCOVERCARS_BKK_STATION,
        href: 'https://evil.example/redirect',
        slug: 'suvarnabhumi-airport-bkk',
      },
      href: 'https://evil.example/?a_aid=jetnity',
      stages: [{ name: 'Bangkok', position: 0 }],
      'stages[0]': 'Bangkok',
      title: 'Bangkok Stadt',
      origin: 'bangkok-city',
      latitude: 13.7563,
      longitude: 100.5018,
      currency: 'THB',
      travellers: 4,
      driverAge: 25,
      residence: 'CH',
      passport: 'P1234567',
      clientRef: 'client-ref-geheim',
      tripId: 'trip-uuid-geheim',
      startsOn: '1988-04-02',
      utm_source: 'paid',
      sub_id: 'sub_id',
      pickup: 'BKK',
      dropoff: 'HKT',
    }
    const ergebnis = ziel(feindlich)
    assert.equal(ergebnis.href, DISCOVERCARS_GENERISCH_HREF)
    for (const verboten of VERBOTEN) {
      assert.equal(ergebnis.href.includes(verboten), false, verboten)
    }
    assert.equal(ergebnis.href.includes('currency'), false)
  })

  test('Felder neben der gültigen Station erscheinen nicht in der Adresse', () => {
    const ergebnis = ziel({
      ausdruecklich: true,
      station: DISCOVERCARS_BKK_STATION,
      sub_id: 'kampagne',
      currency: 'eur',
      date_from: '2026-11-01',
    })
    assert.equal(ergebnis.href, DISCOVERCARS_BKK_HREF)
    assert.equal(ergebnis.href.includes('sub_id'), false)
    assert.equal(ergebnis.href.includes('eur'), false)
    assert.equal(ergebnis.href.includes('2026'), false)
  })

  test('kein Open Redirect und kein zweites a_aid aus der Eingabe', () => {
    const proben = [
      'https://www.discovercars.com.evil.example/?a_aid=jetnity',
      'https://evil.example/?next=https://www.discovercars.com/?a_aid=jetnity',
      '//evil.example',
      'javascript:alert(1)',
      'https://www.discovercars.com/?a_aid=jetnity&a_aid=other',
      'https://www.discovercars.com/?a_aid=jetnity&currency=usd',
    ]
    for (const station of proben) {
      const ergebnis = ziel({ ausdruecklich: true, station })
      assert.equal(ergebnis.href, DISCOVERCARS_GENERISCH_HREF)
      const url = new URL(ergebnis.href)
      assert.equal(url.hostname, 'www.discovercars.com')
      assert.equal([...url.searchParams.keys()].filter((name) => name === 'a_aid').length, 1)
    }
  })

  test('Gast und Konto erzeugen dieselbe Adresse', () => {
    const gast = ziel({ ausdruecklich: false, station: null, konto: false, clientRef: 'gast-1' })
    const konto = ziel({ ausdruecklich: false, station: null, konto: true, clientRef: 'user-1' })
    assert.equal(gast.href, konto.href)
    assert.equal(gast.href, DISCOVERCARS_GENERISCH_HREF)
  })

  test('eine andere Reise löscht BKK, dieselbe Reise behält nur die geprüfte Station', () => {
    assert.equal(
      discoverCarsStationNachReisewechsel('reise-a', 'reise-b', DISCOVERCARS_BKK_STATION),
      null,
    )
    assert.equal(
      discoverCarsStationNachReisewechsel('reise-a', 'reise-a', { ...DISCOVERCARS_BKK_STATION }),
      DISCOVERCARS_BKK_STATION,
    )
    assert.equal(discoverCarsStationNachReisewechsel('reise-a', 'reise-a', 'BKK'), null)
    assert.equal(discoverCarsStationNachReisewechsel('reise-a', 'reise-a', null), null)
  })

  test('mehrere Stationen sind ein Hinweis, keine Adresse', () => {
    assert.equal(discoverCarsMehrereStationen(2), true)
    assert.equal(discoverCarsMehrereStationen(1), false)
    assert.equal(discoverCarsMehrereStationen(0), false)
    assert.equal(discoverCarsMehrereStationen(1.5), false)
    assert.equal(discoverCarsMehrereStationen(Number.NaN), false)
    const beiMehreren = ziel({
      ausdruecklich: false,
      station: null,
      stationen: 3,
      names: ['Bangkok', 'Phuket'],
    })
    assert.equal(beiMehreren.href, DISCOVERCARS_GENERISCH_HREF)
  })

  test('die Schicht liest keine Flughafensuche und kein Reiseobjekt', () => {
    const quelle = readFileSync(join(hier, 'ziel.ts'), 'utf8')
    assert.equal(quelle.includes('@/lib/airports'), false)
    assert.equal(quelle.includes('@/types/trips'), false)
    assert.equal(quelle.includes('fetch('), false)
    assert.equal(quelle.includes('XMLHttpRequest'), false)
    assert.equal(quelle.includes('server-only'), false)
  })
})
