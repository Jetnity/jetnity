import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  WORLD_MAP_BESUCHT_TEXT,
  WORLD_MAP_FEHLER_TEXT,
  WORLD_MAP_LEER_TEXT,
  WORLD_MAP_TITEL,
  istGueltigeKarteKoordinate,
  weltKarteProjektion,
  worldMapAbleiten,
} from '@/lib/account/world-map'
import { WORLD_MAP_LAND_PFADE, WORLD_MAP_LAND_PROVENIENZ } from '@/lib/account/world-map-land'
import { tripAlsUebersicht } from '@/lib/trips/reise-orte'
import type { Trip, TripItem, TripStage, TripStatus, TripSummary } from '@/types/trips'

const hier = dirname(fileURLToPath(import.meta.url))
const JETZT = '2026-08-21T00:00:00.000Z'

function quelle(relativ: string) {
  return readFileSync(join(hier, relativ), 'utf8')
}

function etappe(teil: Partial<TripStage> & Pick<TripStage, 'id' | 'name' | 'position'>): TripStage {
  return {
    countryCode: null,
    arrivalDate: null,
    departureDate: null,
    latitude: null,
    longitude: null,
    placeId: null,
    ...teil,
  }
}

function punkt(id: string): TripItem {
  return {
    id,
    dayId: null,
    stageId: null,
    kind: 'note',
    title: id,
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
    bookingStatus: 'unconfirmed',
    bookingSource: null,
    bookingConfirmedAt: null,
    mobilityMode: null,
    originPlaceId: null,
    destinationPlaceId: null,
    originName: null,
    destinationName: null,
    connectionRef: null,
    mobilityChanges: null,
    mobilityEvidence: null,
    rentalSupplier: null,
    vehicleClass: null,
    transmission: null,
    rentalEvidence: null,
  }
}

function trip(teil: Partial<Trip> = {}): Trip {
  return {
    id: 'trip-1',
    clientRef: 'trip-1',
    title: 'Bali',
    origin: 'Zürich',
    originPlaceId: 'geonames:2657896',
    startDate: '2026-09-12',
    endDate: '2026-09-16',
    travellers: 2,
    currency: 'CHF',
    budgetAmount: 3500,
    status: 'draft',
    pace: 'calm',
    interests: ['beach'],
    travelWish: null,
    revision: 1,
    lastMutationId: null,
    stages: [],
    days: [],
    ohneTag: [],
    createdAt: JETZT,
    updatedAt: JETZT,
    ...teil,
  }
}

function reise(teil: Partial<TripSummary> & Pick<TripSummary, 'id' | 'title'>): TripSummary {
  return {
    origin: null,
    startDate: null,
    endDate: null,
    travellers: 1,
    currency: 'CHF',
    budgetAmount: null,
    status: 'draft',
    updatedAt: '2026-08-01T10:00:00.000Z',
    stages: [],
    stageCount: 0,
    dayCount: 0,
    itemCount: 0,
    ...teil,
    stageCount: teil.stageCount ?? teil.stages?.length ?? 0,
  }
}

function etappeSicht(
  teil: Partial<TripSummary['stages'][number]> & Pick<TripSummary['stages'][number], 'name' | 'position'>,
): TripSummary['stages'][number] {
  return {
    countryCode: null,
    placeId: null,
    latitude: null,
    longitude: null,
    ...teil,
  }
}

describe('TripSummary-Projektion bewahrt kanonische World-Map-Felder', () => {
  test('tripAlsUebersicht lässt countryCode, placeId, latitude und longitude nicht fallen', () => {
    const sicht = tripAlsUebersicht(
      trip({
        stages: [
          etappe({
            id: 'stage-1',
            name: 'Ubud',
            position: 2,
            countryCode: 'ID',
            placeId: 'geonames:1622786',
            latitude: -8.5069,
            longitude: 115.2625,
          }),
        ],
        days: [
          {
            id: 'day-1',
            stageId: 'stage-1',
            dayIndex: 1,
            dayDate: '2026-09-12',
            title: null,
            items: [punkt('a')],
          },
        ],
      }),
    )
    assert.equal(sicht.stages[0]?.countryCode, 'ID')
    assert.equal(sicht.stages[0]?.placeId, 'geonames:1622786')
    assert.equal(sicht.stages[0]?.latitude, -8.5069)
    assert.equal(sicht.stages[0]?.longitude, 115.2625)
    assert.equal(sicht.stageCount, 1)
  })
})

describe('reisenLaden-Select bleibt ein Pfad', () => {
  test('UEBERSICHT_SPALTEN liest die kanonischen Stage-Felder ohne zweite Abfrage', () => {
    const daten = readFileSync(join(hier, '../trips/daten.ts'), 'utf8')
    const ladenStart = daten.indexOf('export async function reisenLaden')
    const ladenEnde = daten.indexOf('export async function reiseLaden')
    const laden = daten.slice(ladenStart, ladenEnde)
    assert.match(laden, /UEBERSICHT_SPALTEN/)
    assert.match(daten, /trip_stages\(name, position, country_code, place_id, latitude, longitude\)/)
    assert.equal((laden.match(/\.from\('trips'\)/g) ?? []).length, 1)
    assert.equal(laden.includes('createServiceRole'), false)
    assert.equal(laden.includes("eq('user_id'"), false)
    assert.equal(daten.includes('from(\'trip_stages\')'), false)
  })
})

describe('World-Map-Derivation – geplante Wahrheit', () => {
  test('gültige gespeicherte Koordinaten werden zu geplanten Kartenpunkten', () => {
    const welt = worldMapAbleiten({
      problem: null,
      reisen: [
        reise({
          id: 'trip-lisbon',
          title: 'Lissabon',
          stages: [
            etappeSicht({
              name: 'Lissabon',
              position: 1,
              countryCode: 'PT',
              placeId: 'geonames:2267057',
              latitude: 38.7223,
              longitude: -9.1393,
            }),
          ],
        }),
      ],
    })
    assert.equal(welt.lage, 'geplant')
    assert.equal(welt.geplottet, 1)
    assert.equal(welt.orte[0]?.geplottet, true)
    assert.equal(welt.orte[0]?.latitude, 38.7223)
    assert.equal(welt.orte[0]?.longitude, -9.1393)
    assert.deepEqual(weltKarteProjektion(38.7223, -9.1393), { x: 170.8607, y: 51.2777 })
    assert.equal(welt.orte[0]?.herkuenfte[0]?.tripId, 'trip-lisbon')
    assert.equal(welt.laenderCodes.includes('PT'), true)
    assert.equal(welt.besuchtLage, 'nicht_erfasst')
  })

  test('ungültige oder fehlende Koordinaten werden nicht geraten', () => {
    const welt = worldMapAbleiten({
      problem: null,
      reisen: [
        reise({
          id: 'trip-bad',
          title: 'Unklar',
          stages: [
            etappeSicht({ name: 'Ohne Ort', position: 1, latitude: null, longitude: null }),
            etappeSicht({ name: 'Zu weit', position: 2, latitude: 200, longitude: 10 }),
            etappeSicht({ name: 'Unendlich', position: 3, latitude: Number.POSITIVE_INFINITY, longitude: 10 }),
            etappeSicht({ name: 'Nur Länge', position: 4, latitude: 12, longitude: null }),
          ],
        }),
      ],
    })
    assert.equal(welt.geplottet, 0)
    assert.equal(welt.ungeplottet, 4)
    assert.equal(welt.orte.every((ort) => ort.geplottet === false), true)
    assert.equal(welt.orte.every((ort) => ort.x === null && ort.y === null), true)
    assert.equal(istGueltigeKarteKoordinate(200, 10), false)
    assert.equal(istGueltigeKarteKoordinate(12, null), false)
  })

  test('fehlender countryCode wird nicht aus Name, Koordinaten oder placeId erschlossen', () => {
    const welt = worldMapAbleiten({
      problem: null,
      reisen: [
        reise({
          id: 'trip-italy',
          title: 'Italien',
          stages: [
            etappeSicht({
              name: 'Florenz, Italien',
              position: 1,
              countryCode: null,
              placeId: 'geonames:3176959',
              latitude: 43.77,
              longitude: 11.25,
            }),
          ],
        }),
      ],
    })
    assert.equal(welt.orte[0]?.countryCode, null)
    assert.equal(welt.orte[0]?.countryLabel, null)
    assert.deepEqual(welt.laenderCodes, [])
    assert.match(welt.laenderText, /Keine gespeicherten Ländercodes/)
    assert.equal(welt.geplottet, 1)
  })

  test('Status, Archiv und vergangene Daten erzeugen niemals visited', () => {
    const statusse: TripStatus[] = ['draft', 'planned', 'booked', 'archived']
    const welt = worldMapAbleiten({
      problem: null,
      reisen: statusse.map((status, index) =>
        reise({
          id: `trip-${status}`,
          title: status,
          status,
          startDate: '2024-01-01',
          endDate: '2024-01-10',
          stages: [
            etappeSicht({
              name: status,
              position: 1,
              countryCode: 'PT',
              placeId: `place-${status}`,
              latitude: 38 + index,
              longitude: -9,
            }),
          ],
        }),
      ),
    })
    assert.equal(welt.besuchtLage, 'nicht_erfasst')
    assert.equal(welt.besuchtText, WORLD_MAP_BESUCHT_TEXT)
    assert.equal(welt.besuchtText.includes('0'), false)
    const serialisiert = JSON.stringify(welt)
    assert.equal(serialisiert.includes('"visited":true'), false)
    assert.equal(serialisiert.includes('besucht=true'), false)
    assert.equal(welt.lage, 'geplant')
    assert.equal(welt.geplottet, 4)
  })

  test('identische nicht-leere placeId aggregiert, ohne Herkunft zu verlieren', () => {
    const welt = worldMapAbleiten({
      problem: null,
      reisen: [
        reise({
          id: 'trip-b',
          title: 'Zweite Lissabon-Reise',
          stages: [
            etappeSicht({
              name: 'Lisboa',
              position: 1,
              countryCode: 'PT',
              placeId: 'geonames:2267057',
              latitude: 38.72,
              longitude: -9.14,
            }),
          ],
        }),
        reise({
          id: 'trip-a',
          title: 'Erste Lissabon-Reise',
          stages: [
            etappeSicht({
              name: 'Lissabon',
              position: 2,
              countryCode: 'PT',
              placeId: 'geonames:2267057',
              latitude: 38.73,
              longitude: -9.13,
            }),
          ],
        }),
      ],
    })
    assert.equal(welt.orte.length, 1)
    assert.equal(welt.orte[0]?.placeId, 'geonames:2267057')
    assert.deepEqual(
      welt.orte[0]?.herkuenfte.map((eintrag) => `${eintrag.tripId}:${eintrag.stagePosition}`),
      ['trip-a:2', 'trip-b:1'],
    )
    assert.equal(welt.orte[0]?.latitude, 38.73)
    assert.equal(welt.orte[0]?.longitude, -9.13)
  })

  test('gleiche Labels, Länder oder ähnliche Koordinaten ohne placeId bleiben getrennt', () => {
    const welt = worldMapAbleiten({
      problem: null,
      reisen: [
        reise({
          id: 'trip-1',
          title: 'Paris A',
          stages: [
            etappeSicht({
              name: 'Paris',
              position: 1,
              countryCode: 'FR',
              placeId: null,
              latitude: 48.8566,
              longitude: 2.3522,
            }),
          ],
        }),
        reise({
          id: 'trip-2',
          title: 'Paris B',
          stages: [
            etappeSicht({
              name: 'Paris',
              position: 1,
              countryCode: 'FR',
              placeId: '',
              latitude: 48.8567,
              longitude: 2.3523,
            }),
          ],
        }),
      ],
    })
    assert.equal(welt.orte.length, 2)
    assert.equal(welt.orte.every((ort) => ort.placeId === null), true)
    assert.deepEqual(
      welt.orte.map((ort) => ort.herkuenfte[0]?.tripId).sort(),
      ['trip-1', 'trip-2'],
    )
  })

  test('Etappen ohne Koordinaten bleiben in der zugänglichen Fallback-Liste', () => {
    const welt = worldMapAbleiten({
      problem: null,
      reisen: [
        reise({
          id: 'trip-mix',
          title: 'Gemischt',
          stages: [
            etappeSicht({
              name: 'Kyoto',
              position: 2,
              countryCode: 'JP',
              latitude: 35.0116,
              longitude: 135.7681,
            }),
            etappeSicht({
              name: 'Osaka',
              position: 1,
              countryCode: 'JP',
            }),
          ],
        }),
      ],
    })
    const osaka = welt.orte.find((ort) => ort.name === 'Osaka')
    const kyoto = welt.orte.find((ort) => ort.name === 'Kyoto')
    assert.equal(osaka?.geplottet, false)
    assert.equal(kyoto?.geplottet, true)
    assert.equal(welt.ungeplottet, 1)
    assert.match(welt.zusammenfassung, /1 ohne gespeicherte Koordinaten/)
  })

  test('Lesefehler bleibt von leerer Welt unterscheidbar', () => {
    const leer = worldMapAbleiten({ problem: null, reisen: [] })
    const fehler = worldMapAbleiten({
      problem: { status: 503, message: 'unavailable' },
      reisen: [],
    })
    assert.equal(leer.lage, 'leer')
    assert.equal(leer.zusammenfassung, WORLD_MAP_LEER_TEXT)
    assert.equal(fehler.lage, 'fehler')
    assert.equal(fehler.zusammenfassung, WORLD_MAP_FEHLER_TEXT)
    assert.equal(fehler.orte.length, 0)
    assert.notEqual(fehler.lage, leer.lage)
    assert.equal(fehler.besuchtLage, 'nicht_erfasst')
    assert.equal(leer.titel, WORLD_MAP_TITEL)
  })

  test('Ordnung folgt nicht der Eingabereihenfolge', () => {
    const welt = worldMapAbleiten({
      problem: null,
      reisen: [
        reise({
          id: 'trip-z',
          title: 'Später',
          stages: [
            etappeSicht({ name: 'Zürich', position: 1, countryCode: 'CH' }),
            etappeSicht({ name: 'Bern', position: 2, countryCode: 'CH' }),
          ],
        }),
        reise({
          id: 'trip-a',
          title: 'Früher',
          stages: [etappeSicht({ name: 'Wien', position: 1, countryCode: 'AT' })],
        }),
      ],
    })
    assert.deepEqual(
      welt.orte.map((ort) => ort.name),
      ['Wien', 'Bern', 'Zürich'],
    )
  })
})

describe('World Map bleibt lokal und nicht-kommerziell', () => {
  test('Account-Weltkarte startet keine Flug-/Hotel-/Aktivitäten-Suche', () => {
    const dateien = [
      '../../components/account/AccountWeltKarte.tsx',
      '../../components/account/AccountUebersicht.tsx',
      '../../components/account/AccountUebersichtLive.tsx',
      'world-map.ts',
    ]
    for (const datei of dateien) {
      const text = quelle(datei)
      for (const verboten of [
        'FlugSuche',
        'HotelBereich',
        'AktivitaetenBereich',
        'UnterkunftBestand',
        'data-destination-search="ein"',
        'JETNITY_FLIGHT_AKTIV',
      ]) {
        assert.equal(text.includes(verboten), false, `${datei}: ${verboten}`)
      }
    }
    const karte = quelle('../../components/account/AccountWeltKarte.tsx')
    assert.match(karte, /data-world-map-search="nein"/)
  })

  test('kein externes Karten-, Tile- oder Geocoding-Runtime-Ziel', () => {
    const dateien = [
      '../../components/account/AccountWeltKarte.tsx',
      'world-map.ts',
      'world-map-land.ts',
    ]
    for (const datei of dateien) {
      const text = quelle(datei)
      for (const verboten of [
        'mapbox',
        'googleapis.com/maps',
        'openstreetmap',
        'tile.openstreetmap',
        'maptiler',
        'hereapi',
        'geocode',
        'nominatim',
        'leaflet',
        'https://',
        'http://',
      ]) {
        assert.equal(text.toLowerCase().includes(verboten), false, `${datei}: ${verboten}`)
      }
    }
    assert.equal(WORLD_MAP_LAND_PROVENIENZ.runtimeFetch, false)
    assert.equal(WORLD_MAP_LAND_PFADE.length > 0, true)
    assert.equal(
      WORLD_MAP_LAND_PFADE.every((pfad) => pfad.startsWith('M') && pfad.endsWith('Z')),
      true,
    )
  })
})
