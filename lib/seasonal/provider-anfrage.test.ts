import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { beispielreise } from '@/lib/reiseaenderung/fixtures/reise'
import type { RouteFacts } from '@/lib/route/domain'
import { seasonalAuswerten } from '@/lib/seasonal/engine'
import { seasonalContextFingerprint } from '@/lib/seasonal/fingerprint'
import {
  SEASONAL_NOW_MS,
  bangkokRouteReise,
  goaKeralaReise,
  testSeasonalProvider,
  wiederholteGoaReise,
} from '@/lib/seasonal/fixtures'
import { providerAnfrageAusKontext, seasonalReisekontext } from '@/lib/seasonal/kontext'
import type { SeasonalProviderAnfrage } from '@/lib/seasonal/provider'
import { providerRouteKontakte } from '@/lib/seasonal/route-kontakte'
import type { Trip, TripTraveller } from '@/types/trips'

function reisender(opts: { clientRef: string; codes: string[] }): TripTraveller {
  return {
    id: opts.clientRef,
    clientRef: opts.clientRef,
    label: opts.clientRef,
    residenceCountryCode: null,
    citizenships: opts.codes.map((code) => ({
      id: `${opts.clientRef}-${code}`,
      clientRef: `${opts.clientRef}:cit:${code}`,
      countryCode: code,
      createdAt: '2026-08-21T00:00:00.000Z',
      updatedAt: '2026-08-21T00:00:00.000Z',
    })),
    documents: [
      {
        id: `${opts.clientRef}-pass`,
        clientRef: `${opts.clientRef}:doc:pass`,
        documentType: 'passport',
        issuingCountryCode: opts.codes[0] ?? 'CH',
        citizenshipClientRef: `${opts.clientRef}:cit:${opts.codes[0] ?? 'CH'}`,
        expiresOn: '2030-01-01',
        createdAt: '2026-08-21T00:00:00.000Z',
        updatedAt: '2026-08-21T00:00:00.000Z',
      },
    ],
    createdAt: '2026-08-21T00:00:00.000Z',
    updatedAt: '2026-08-21T00:00:00.000Z',
  }
}

function anfrageFuer(reise: Trip, fingerprint = seasonalContextFingerprint(reise)): SeasonalProviderAnfrage {
  return providerAnfrageAusKontext(seasonalReisekontext(reise), fingerprint)
}

function schluessel(wert: unknown, prefix = ''): string[] {
  if (!wert || typeof wert !== 'object') return []
  return Object.entries(wert as Record<string, unknown>).flatMap(([name, inhalt]) => {
    const pfad = prefix ? `${prefix}.${name}` : name
    return [pfad, ...schluessel(inhalt, pfad)]
  })
}

describe('Seasonal-Provider-Anfrage', () => {
  test('R4-Widerspruch: Testdouble sieht Bangkok 12.–16.09. trotz Top-Level 01.–05.09.', async () => {
    const reise = beispielreise({
      title: 'Bangkok ausserhalb der groben Hülle',
      startDate: '2026-09-01',
      endDate: '2026-09-05',
      stages: [
        {
          id: 'stage-bkk',
          position: 1,
          name: 'Bangkok',
          countryCode: 'TH',
          placeId: 'geonames:1609350',
          latitude: 13.7563,
          longitude: 100.5018,
          arrivalDate: '2026-09-12',
          departureDate: '2026-09-16',
        },
      ],
      days: [],
      ohneTag: [],
    })
    const gesehen: SeasonalProviderAnfrage[] = []
    await seasonalAuswerten(
      reise,
      testSeasonalProvider(async (anfrage) => {
        gesehen.push(anfrage)
        return []
      }),
      null,
      SEASONAL_NOW_MS,
    )
    assert.equal(gesehen.length, 1)
    assert.equal(gesehen[0]?.startDate, '2026-09-01')
    assert.equal(gesehen[0]?.endDate, '2026-09-05')
    assert.equal(gesehen[0]?.stages[0]?.id, 'stage-bkk')
    assert.equal(gesehen[0]?.stages[0]?.placeId, 'geonames:1609350')
    assert.equal(gesehen[0]?.stages[0]?.countryCode, 'TH')
    assert.equal(gesehen[0]?.stages[0]?.arrivalDate, '2026-09-12')
    assert.equal(gesehen[0]?.stages[0]?.departureDate, '2026-09-16')
    assert.deepEqual(gesehen[0], anfrageFuer(reise))
  })

  test('zwei Destinationen bleiben mit eigenen Stage-Fenstern getrennt zuordenbar', () => {
    const anfrage = anfrageFuer(goaKeralaReise())
    const goa = anfrage.stages.find((etappe) => etappe.id === 'stage-goa')
    const kerala = anfrage.stages.find((etappe) => etappe.id === 'stage-kerala')
    assert.equal(goa?.placeId, 'geonames:1271157')
    assert.equal(goa?.arrivalDate, '2026-07-10')
    assert.equal(goa?.departureDate, '2026-07-14')
    assert.equal(kerala?.placeId, 'geonames:1273874')
    assert.equal(kerala?.arrivalDate, '2026-07-15')
    assert.equal(kerala?.departureDate, '2026-07-20')
    assert.notEqual(goa?.arrivalDate, kerala?.arrivalDate)
  })

  test('wiederholtes gleiches Place bleibt als getrennte Stage-Kontakte erhalten', () => {
    const anfrage = anfrageFuer(wiederholteGoaReise())
    const goa = anfrage.stages.filter((etappe) => etappe.placeId === 'geonames:1271157')
    assert.equal(goa.length, 2)
    assert.deepEqual(
      goa.map((etappe) => [etappe.id, etappe.arrivalDate, etappe.departureDate]),
      [
        ['stage-goa-jul', '2026-07-10', '2026-07-16'],
        ['stage-goa-mar', '2026-03-02', '2026-03-06'],
      ],
    )
  })

  test('Route-/Airport-Kontakte behalten einzelne Zeiten und werden nicht zu Min/Max verschmolzen', () => {
    const anfrage = anfrageFuer(bangkokRouteReise())
    const doh = anfrage.routeContacts.filter((kontakt) => kontakt.airportCode === 'DOH')
    assert.equal(doh.length, 1)
    assert.equal(doh[0]?.start, '2026-09-12T17:40')
    assert.equal(doh[0]?.end, '2026-09-12T19:10')

    const route: RouteFacts = {
      quelle: 'flight_itinerary',
      origin: { airportCode: 'ZRH', countryCode: 'CH', city: null, country: null },
      destination: { airportCode: 'ZRH', countryCode: 'CH', city: null, country: null },
      segments: [
        {
          origin: { airportCode: 'ZRH', countryCode: 'CH', city: null, country: null },
          destination: { airportCode: 'BKK', countryCode: 'TH', city: null, country: null },
          departureDate: '2026-09-12',
          departureTime: '09:15',
          arrivalDate: '2026-09-13',
          arrivalTime: '06:20',
        },
        {
          origin: { airportCode: 'BKK', countryCode: 'TH', city: null, country: null },
          destination: { airportCode: 'ZRH', countryCode: 'CH', city: null, country: null },
          departureDate: '2026-09-20',
          departureTime: '23:00',
          arrivalDate: '2026-09-21',
          arrivalTime: '06:00',
        },
      ],
      connections: [],
      transitCountryCodes: ['TH'],
      destinationCountryCodes: ['TH'],
      sourceItemIds: [],
      fingerprint: 'audit-roundtrip',
    }
    const kontakte = providerRouteKontakte(route)
    const zrh = kontakte.filter((kontakt) => kontakt.airportCode === 'ZRH')
    assert.equal(zrh.length, 2)
    assert.deepEqual(
      zrh.map((kontakt) => [kontakt.start, kontakt.end]),
      [
        ['2026-09-12T09:15', '2026-09-12T09:15'],
        ['2026-09-21T06:00', '2026-09-21T06:00'],
      ],
    )
    assert.equal(
      zrh.some((kontakt) => kontakt.start === '2026-09-12T09:15' && kontakt.end === '2026-09-21T06:00'),
      false,
    )
  })

  test('Reihenfolge des Tripgraphen ändert den kanonischen Provider-Request nicht', () => {
    const basis = goaKeralaReise()
    const umgestellt: Trip = {
      ...basis,
      stages: [...basis.stages].reverse(),
      days: [...basis.days].reverse(),
    }
    const a = anfrageFuer(basis)
    const b = anfrageFuer(umgestellt)
    assert.equal(a.contextFingerprint, b.contextFingerprint)
    assert.deepEqual(a.stages, b.stages)
    assert.deepEqual(a.routeContacts, b.routeContacts)
    assert.deepEqual(a.countryCodes, b.countryCodes)
    assert.deepEqual(a.placeIds, b.placeIds)
  })

  test('keine Citizenship-/Document-/LLM-Felder gelangen in den Seasonal-Port', () => {
    const reise = {
      ...goaKeralaReise(),
      party: [reisender({ clientRef: 'a', codes: ['CH', 'IT'] })],
    }
    const anfrage = anfrageFuer(reise)
    const felder = schluessel(anfrage)
    assert.equal(
      felder.some((feld) => /citizenship|document|llm|officialResult|seasonalResult|label|name|title/i.test(feld)),
      false,
    )
    assert.equal(anfrage.stages.some((etappe) => 'name' in etappe), false)
    assert.deepEqual(anfrageFuer(goaKeralaReise()).stages, anfrage.stages)
  })
})
