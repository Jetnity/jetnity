import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  WORLD_MAP_FEHLER_TEXT,
  WORLD_MAP_GEPLANT_LEER_KURZ,
  WORLD_MAP_LEER_TEXT,
  WORLD_MAP_TITEL,
  istGueltigeKarteKoordinate,
  weltKarteProjektion,
  worldMapAbleiten,
  type WorldMapOrt,
  type WorldMapReise,
} from '@/lib/account/world-map'
import {
  WORLD_MAP_AUSSERHALB_RAHMEN_TEXT,
  WORLD_MAP_GRUNDKARTE_BESCHREIBUNG,
  WORLD_MAP_GRUNDKARTE_HINWEIS,
  WORLD_MAP_MARKER_ABSTAND,
  WORLD_MAP_RAHMEN,
  WORLD_MAP_RAHMEN_VIEWBOX,
  WORLD_MAP_ZEITRAUM_OFFEN_TEXT,
  weltKartenAnsicht,
  weltMarkerGruppeText,
  weltMarkerLage,
  weltOrtReiseAnzeigen,
  weltReiseZeitraum,
} from '@/lib/account/world-map-ansicht'
import {
  WORLD_MAP_GEOGRAFIE_HERKUNFT,
  WORLD_MAP_GRENZ_PFADE,
  WORLD_MAP_LAND_PFADE,
  WORLD_MAP_SEE_PFADE,
} from '@/lib/account/world-map-geografie'
import {
  WELT_BESUCHT_LEER_KURZ,
  WELT_BESUCHT_TEXT,
  weltBesuchtAbleiten,
} from '@/lib/account/welt-ansicht'
import { weltLaenderAbleiten } from '@/lib/account/welt-laender'
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
    assert.equal(Object.keys(welt).some((feld) => feld.startsWith('besucht')), false)
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
    assert.equal(istGueltigeKarteKoordinate(undefined, 10), false)
    assert.equal(istGueltigeKarteKoordinate(12, undefined), false)
  })

  test('legacy { name, position } bleibt gültig und fail-closed ohne Land oder Punkt', () => {
    const legacy: TripSummary['stages'][number] = { name: 'Lissabon', position: 1 }
    const welt = worldMapAbleiten({
      problem: null,
      reisen: [
        reise({
          id: 'trip-legacy',
          title: 'Legacy',
          stages: [legacy],
        }),
      ],
    })
    assert.equal(welt.lage, 'geplant')
    assert.equal(welt.orte.length, 1)
    assert.equal(welt.orte[0]?.name, 'Lissabon')
    assert.equal(welt.orte[0]?.geplottet, false)
    assert.equal(welt.orte[0]?.countryCode, null)
    assert.equal(welt.orte[0]?.countryLabel, null)
    assert.equal(welt.orte[0]?.placeId, null)
    assert.equal(welt.orte[0]?.latitude, null)
    assert.equal(welt.orte[0]?.longitude, null)
    assert.deepEqual(welt.laenderCodes, [])
    assert.deepEqual(welt.orte[0]?.reisen, [
      {
        tripId: 'trip-legacy',
        tripTitle: 'Legacy',
        tripStatus: 'draft',
        startDate: null,
        endDate: null,
      },
    ])
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
    // Vier Reisen, alle in der Vergangenheit, eine davon archiviert: die
    // geplante Ableitung darf daraus keinen Besuch machen, und die bestaetigte
    // Seite kennt diese Reisen gar nicht.
    const serialisiert = JSON.stringify(welt)
    assert.equal(serialisiert.includes('"visited":true'), false)
    assert.equal(serialisiert.includes('besucht=true'), false)
    // Die geplante Ableitung trägt überhaupt kein Besuchsfeld mehr: sie kann
    // nichts über Besuche sagen, also sagt sie nichts.
    assert.equal(
      Object.keys(welt).some((feld) => feld.toLowerCase().startsWith('besucht')),
      false,
    )
    assert.equal(welt.lage, 'geplant')
    assert.equal(welt.geplottet, 4)

    const besucht = weltBesuchtAbleiten({ besuche: [], problem: null })
    assert.equal(besucht.lage, 'leer')
    assert.equal(besucht.kennzahlen.laender, 0)
    assert.equal(besucht.laenderCodes.length, 0)
    assert.equal(
      weltLaenderAbleiten({
        besucht: besucht.laenderCodes,
        geplant: welt.laenderCodes,
        geometrie: { PT: { pfade: ['M0 0 L1 0 L1 1 Z'], punkt: null } },
      }).flaechen.every((flaeche) => flaeche.zustand === 'geplant'),
      true,
    )
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
    assert.deepEqual(
      welt.orte[0]?.reisen.map((eintrag) => [eintrag.tripId, eintrag.tripTitle]),
      [
        ['trip-a', 'Erste Lissabon-Reise'],
        ['trip-b', 'Zweite Lissabon-Reise'],
      ],
    )
  })

  test('aggregierter Ort behält jede einzigartige Reise, auch bei gleichem Titel', () => {
    const welt = worldMapAbleiten({
      problem: null,
      reisen: [
        reise({
          id: 'trip-b',
          title: 'Lissabon',
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
          title: 'Lissabon',
          stages: [
            etappeSicht({
              name: 'Lissabon',
              position: 1,
              countryCode: 'PT',
              placeId: 'geonames:2267057',
              latitude: 38.73,
              longitude: -9.13,
            }),
            etappeSicht({
              name: 'Lisboa Altstadt',
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
    assert.equal(welt.orte[0]?.herkuenfte.length, 3)
    assert.deepEqual(
      welt.orte[0]?.reisen.map((eintrag) => eintrag.tripId),
      ['trip-a', 'trip-b'],
    )
    assert.deepEqual(
      welt.orte[0]?.reisen.map((eintrag) => eintrag.tripTitle),
      ['Lissabon', 'Lissabon'],
    )
    assert.equal(welt.orte[0]?.reisen.length, 2)
    assert.notEqual(welt.orte[0]?.reisen[0]?.tripId, welt.orte[0]?.reisen[1]?.tripId)
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

  test('Reise öffnen benutzt nicht herkuenfte[0] als stillen Navigationsdefault', () => {
    const karte = quelle('../../components/account/AccountWeltKarte.tsx')
    assert.equal(karte.includes('herkuenfte[0]'), false)
    assert.match(karte, /weltOrtReiseAnzeigen\(ort\.reisen\)/)
    assert.match(karte, /href=\{`\/reisen\/\$\{reise\.tripId\}` as Route\}/)
    assert.match(karte, /aria-label=\{reise\.ariaLabel\}/)
  })

  test('kein externes Karten-, Tile- oder Geocoding-Runtime-Ziel', () => {
    const dateien = [
      '../../components/account/AccountWeltKarte.tsx',
      'world-map.ts',
      'world-map-ansicht.ts',
      'world-map-geografie.ts',
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
    assert.equal(WORLD_MAP_GEOGRAFIE_HERKUNFT.runtimeFetch, false)
    assert.equal(WORLD_MAP_LAND_PFADE.length > 0, true)
    assert.equal(
      WORLD_MAP_LAND_PFADE.every((pfad) => pfad.startsWith('M') && pfad.endsWith('Z')),
      true,
    )
  })

  test('die Landsilhouette enthält keinen Polplatzhalter über die ganze Breite', () => {
    const balken = WORLD_MAP_LAND_PFADE.filter((pfad) => {
      const xWerte = koordinaten(pfad).map(([x]) => x)
      return Math.min(...xWerte) <= 0 && Math.max(...xWerte) >= 360
    })
    assert.deepEqual(balken, [])
  })
})

/** Alle Punkte eines Pfades als Projektionskoordinaten. */
function koordinaten(pfad: string): readonly (readonly [number, number])[] {
  return [...pfad.matchAll(/[ML](-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g)].map(
    (treffer) => [Number(treffer[1]), Number(treffer[2])] as const,
  )
}

describe('Die Grundkarte ist belegte, lokale Vektorgeografie', () => {
  const alleEbenen = [
    ['Land', WORLD_MAP_LAND_PFADE],
    ['Seen', WORLD_MAP_SEE_PFADE],
    ['Grenzen', WORLD_MAP_GRENZ_PFADE],
  ] as const

  test('die Herkunft nennt Datensatz, Version, Lizenz und Pruefsummen', () => {
    assert.equal(WORLD_MAP_GEOGRAFIE_HERKUNFT.datensatz, 'Natural Earth')
    assert.match(WORLD_MAP_GEOGRAFIE_HERKUNFT.version, /^v\d+\.\d+\.\d+$/)
    assert.match(WORLD_MAP_GEOGRAFIE_HERKUNFT.lizenz, /[Pp]ublic domain/)
    assert.equal(WORLD_MAP_GEOGRAFIE_HERKUNFT.quellen.length, 3)
    for (const quellDatei of WORLD_MAP_GEOGRAFIE_HERKUNFT.quellen) {
      assert.match(quellDatei.datei, /^ne_\d+m_[a-z0-9_]+\.geojson$/)
      assert.match(quellDatei.sha256, /^[0-9a-f]{64}$/)
      assert.equal(quellDatei.bytes > 0, true)
    }
  })

  /**
   * Der Gewinn dieser Etappe ist Geometrie, nicht Farbe. Die abgeloeste
   * Handzeichnung hatte elf Formen mit 192 Stuetzpunkten; alles in dieser
   * Groessenordnung waere wieder eine Skizze.
   */
  test('die Geometrie ist deutlich feiner als die abgeloeste Handzeichnung', () => {
    const landPunkte = WORLD_MAP_LAND_PFADE.reduce((summe, pfad) => summe + koordinaten(pfad).length, 0)
    assert.equal(WORLD_MAP_LAND_PFADE.length > 150, true)
    assert.equal(landPunkte > 3000, true)
    assert.equal(WORLD_MAP_GRENZ_PFADE.length > 100, true)
    assert.equal(WORLD_MAP_SEE_PFADE.length > 5, true)
  })

  test('Land und Seen sind geschlossen, Grenzen sind offene Linien', () => {
    assert.equal(
      WORLD_MAP_SEE_PFADE.every((pfad) => pfad.startsWith('M') && pfad.endsWith('Z')),
      true,
    )
    assert.equal(
      WORLD_MAP_GRENZ_PFADE.every((pfad) => pfad.startsWith('M') && !pfad.endsWith('Z')),
      true,
    )
  })

  /**
   * Die Grundkarte muss in derselben Projektion liegen wie die Marker, sonst
   * sitzt eine gespeicherte Koordinate neben ihrer Kueste. Jeder Punkt muss
   * deshalb im Ausschnitt liegen, den `weltMarkerLage` auch fuer Marker gelten
   * laesst.
   */
  test('jeder Punkt liegt im gezeigten Ausschnitt der Markerprojektion', () => {
    const links = WORLD_MAP_RAHMEN_VIEWBOX.x
    const rechts = WORLD_MAP_RAHMEN_VIEWBOX.x + WORLD_MAP_RAHMEN_VIEWBOX.width
    const oben = WORLD_MAP_RAHMEN_VIEWBOX.y
    const unten = WORLD_MAP_RAHMEN_VIEWBOX.y + WORLD_MAP_RAHMEN_VIEWBOX.height
    for (const [name, pfade] of alleEbenen) {
      for (const pfad of pfade) {
        for (const [x, y] of koordinaten(pfad)) {
          assert.equal(x >= links && x <= rechts, true, `${name}: x=${x}`)
          assert.equal(y >= oben && y <= unten, true, `${name}: y=${y}`)
        }
      }
    }
  })

  /**
   * Stichproben gegen die Projektion: bekannte Landpunkte muessen von Land
   * getroffen werden, bekannte Seepunkte nicht. Das faengt einen gespiegelten,
   * verschobenen oder vertauschten Achsensatz, den eine reine Formpruefung
   * durchliesse.
   */
  test('bekannte Orte liegen auf Land, bekannte Meerespunkte nicht', () => {
    const ringe = WORLD_MAP_LAND_PFADE.map(koordinaten)
    const aufLand = (lat: number, lon: number): boolean => {
      const { x, y } = weltKarteProjektion(lat, lon)
      let drin = false
      for (const ring of ringe) {
        for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
          const [xi, yi] = ring[i] as readonly [number, number]
          const [xj, yj] = ring[j] as readonly [number, number]
          if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) drin = !drin
        }
      }
      return drin
    }

    for (const [name, lat, lon] of [
      ['Lissabon', 38.72, -9.14],
      ['Zürich', 47.37, 8.54],
      ['Tokio', 35.69, 139.69],
      ['Nairobi', -1.29, 36.82],
      ['Buenos Aires', -34.6, -58.38],
      ['Denver', 39.74, -104.99],
      ['Perth', -31.95, 115.86],
    ] as const) {
      assert.equal(aufLand(lat, lon), true, `${name} sollte auf Land liegen`)
    }

    for (const [name, lat, lon] of [
      ['Nordatlantik', 40, -40],
      ['Südpazifik', -30, -130],
      ['Indischer Ozean', -20, 80],
      ['Golf von Guinea', 0, 0],
    ] as const) {
      assert.equal(aufLand(lat, lon), false, `${name} sollte Wasser sein`)
    }
  })

  /**
   * Die Nutzlast ist der Preis dieser Etappe. Eine Obergrenze im Test macht
   * aus der Messung eine Zusage: wer die Geometrie verfeinert, sieht sofort,
   * wenn das Telefon dafuer bezahlt.
   */
  test('die Geometrie bleibt unter der zugesagten Nutzlastgrenze', () => {
    const zeichen = [...WORLD_MAP_LAND_PFADE, ...WORLD_MAP_SEE_PFADE, ...WORLD_MAP_GRENZ_PFADE].join(
      ' ',
    ).length
    assert.equal(zeichen < 90_000, true, `Geometrie ${zeichen} Zeichen`)
  })

  test('die erzeugte Datei bleibt erzeugt und traegt ihren Erzeuger', () => {
    const text = quelle('world-map-geografie.ts')
    assert.match(text, /ERZEUGT/)
    assert.match(text, /scripts\/kartografie\/weltkarte-geometrie\.mjs/)
  })

  test('die Karte zeichnet eine Ebene je Pfad statt eines Elements je Ring', () => {
    const karte = quelle('../../components/account/AccountWeltKarte.tsx')
    assert.match(karte, /const LAND_PFAD = WORLD_MAP_LAND_PFADE\.join\(' '\)/)
    assert.match(karte, /fillRule="evenodd"/)
    assert.equal(karte.includes('WORLD_MAP_LAND_PFADE.map('), false)
  })

  test('Herkunft und Grenzvorbehalt stehen sichtbar an der Karte', () => {
    const karte = quelle('../../components/account/AccountWeltKarte.tsx')
    assert.match(karte, /WORLD_MAP_GRUNDKARTE_HINWEIS/)
    assert.match(WORLD_MAP_GRUNDKARTE_HINWEIS, /Natural Earth/)
    assert.match(WORLD_MAP_GRUNDKARTE_HINWEIS, /Orientierung/)
    assert.match(WORLD_MAP_GRUNDKARTE_BESCHREIBUNG, /Orientierung/)
    assert.match(karte, /WORLD_MAP_GRUNDKARTE_BESCHREIBUNG/)
  })
})

describe('World-Map-Darstellung bleibt an gespeicherte Koordinaten gebunden', () => {
  const ort = (teil: Partial<WorldMapOrt> & Pick<WorldMapOrt, 'schluessel'>): WorldMapOrt => ({
    placeId: null,
    name: teil.schluessel,
    countryCode: null,
    countryLabel: null,
    latitude: null,
    longitude: null,
    geplottet: false,
    x: null,
    y: null,
    herkuenfte: [],
    reisen: [],
    ...teil,
  })

  function geplotteterOrt(schluessel: string, latitude: number, longitude: number): WorldMapOrt {
    const projektion = weltKarteProjektion(latitude, longitude)
    return ort({
      schluessel,
      latitude,
      longitude,
      geplottet: true,
      x: projektion.x,
      y: projektion.y,
    })
  }

  test('der gezeigte Ausschnitt lässt die Polkappen weg, ohne die Projektion zu ändern', () => {
    assert.equal(WORLD_MAP_RAHMEN.latMax, 84)
    assert.equal(WORLD_MAP_RAHMEN.latMin, -58)
    assert.deepEqual(WORLD_MAP_RAHMEN_VIEWBOX, { x: 0, y: 6, width: 360, height: 142 })
    assert.deepEqual(weltKarteProjektion(38.7223, -9.1393), { x: 170.8607, y: 51.2777 })
  })

  test('Marker liegen prozentual im Ausschnitt, nicht in der Vollprojektion', () => {
    const lage = weltMarkerLage(geplotteterOrt('lissabon', 38.7223, -9.1393))
    assert.notEqual(lage, null)
    assert.equal(Math.round((lage?.links ?? 0) * 100) / 100, 47.46)
    assert.equal(Math.round((lage?.oben ?? 0) * 100) / 100, 31.89)
    assert.equal(lage?.ausrichtung, 'mitte')
  })

  test('Beschriftungen am Rand richten sich nach innen aus', () => {
    assert.equal(weltMarkerLage(geplotteterOrt('anchorage', 61.2, -149.9))?.ausrichtung, 'links')
    assert.equal(weltMarkerLage(geplotteterOrt('auckland', -36.85, 174.76))?.ausrichtung, 'rechts')
  })

  test('Koordinaten ausserhalb des Ausschnitts werden nicht an den Rand geschoben', () => {
    const draussen = geplotteterOrt('ushuaia-sued', -72.4, -60)
    assert.equal(weltMarkerLage(draussen), null)
    const ansicht = weltKartenAnsicht([draussen, geplotteterOrt('lissabon', 38.7223, -9.1393)])
    assert.equal(ansicht.gruppen.length, 1)
    assert.equal(ansicht.gruppen[0]?.orte[0]?.schluessel, 'lissabon')
    assert.deepEqual(
      ansicht.ausserhalb.map((eintrag) => eintrag.schluessel),
      ['ushuaia-sued'],
    )
    assert.equal(ansicht.rahmenHinweis, `1 Ort: ${WORLD_MAP_AUSSERHALB_RAHMEN_TEXT}`)
  })

  test('Orte ohne gespeicherte Koordinaten erzeugen keinen Marker und keinen Rahmenhinweis', () => {
    const ansicht = weltKartenAnsicht([ort({ schluessel: 'osaka' })])
    assert.equal(ansicht.gruppen.length, 0)
    assert.deepEqual(ansicht.ausserhalb, [])
    assert.equal(ansicht.rahmenHinweis, null)
    assert.equal(ansicht.viewBox, '0 6 360 142')
  })

  test('dicht liegende Orte teilen eine Trefferfläche, bleiben aber getrennte Orte', () => {
    const ansicht = weltKartenAnsicht([
      geplotteterOrt('tokio', 35.6895, 139.6917),
      geplotteterOrt('kyoto', 35.0116, 135.7681),
      geplotteterOrt('lissabon', 38.7223, -9.1393),
    ])
    assert.equal(WORLD_MAP_MARKER_ABSTAND, 5)
    assert.equal(ansicht.gruppen.length, 2)
    const dicht = ansicht.gruppen.find((gruppe) => gruppe.orte.length > 1)
    assert.deepEqual(
      dicht?.orte.map((eintrag) => eintrag.schluessel),
      ['tokio', 'kyoto'],
    )
    // Die Fläche sitzt auf echten gespeicherten Koordinaten, nicht auf einem Mittelwert.
    assert.equal(dicht?.schluessel, 'tokio')
    assert.deepEqual(weltMarkerLage(geplotteterOrt('tokio', 35.6895, 139.6917))?.links, dicht?.links)
    assert.equal(weltMarkerGruppeText(dicht!), '2 Orte an dieser Stelle: tokio, kyoto')
    const einzeln = ansicht.gruppen.find((gruppe) => gruppe.orte.length === 1)
    assert.equal(weltMarkerGruppeText(einzeln!), 'lissabon')
  })

  test('weit auseinanderliegende Orte behalten je eine eigene Trefferfläche', () => {
    const ansicht = weltKartenAnsicht([
      geplotteterOrt('lissabon', 38.7223, -9.1393),
      geplotteterOrt('madrid', 40.4168, -3.7038),
      geplotteterOrt('kapstadt', -33.9249, 18.4241),
    ])
    assert.equal(ansicht.gruppen.length, 3)
    assert.equal(
      ansicht.gruppen.every((gruppe) => gruppe.orte.length === 1),
      true,
    )
  })

  test('das Gitter ist deterministisch und bleibt im Ausschnitt', () => {
    const gitter = weltKartenAnsicht([]).gitter
    assert.equal(gitter.length, 15)
    assert.equal(
      gitter.every(
        (linie) =>
          linie.y1 >= WORLD_MAP_RAHMEN_VIEWBOX.y &&
          linie.y2 <= WORLD_MAP_RAHMEN_VIEWBOX.y + WORLD_MAP_RAHMEN_VIEWBOX.height &&
          linie.x1 >= WORLD_MAP_RAHMEN_VIEWBOX.x &&
          linie.x2 <= WORLD_MAP_RAHMEN_VIEWBOX.x + WORLD_MAP_RAHMEN_VIEWBOX.width,
      ),
      true,
    )
  })
})

describe('World-Map-Reiseaktionen bleiben je tripId unterscheidbar', () => {
  const reiseAnzeige = (
    tripId: string,
    tripTitle: string,
    teil: Partial<Pick<WorldMapReise, 'tripStatus' | 'startDate' | 'endDate'>> = {},
  ): WorldMapReise => ({
    tripId,
    tripTitle,
    tripStatus: 'planned',
    startDate: null,
    endDate: null,
    ...teil,
  })

  test('gleicher Titel und gleicher Zeitraum werden gezählt, nicht zusammengelegt', () => {
    const zeilen = weltOrtReiseAnzeigen([
      reiseAnzeige('trip-a', 'Lissabon', { startDate: '2026-09-12', endDate: '2026-09-16' }),
      reiseAnzeige('trip-b', 'Lissabon', { startDate: '2026-09-12', endDate: '2026-09-16' }),
    ])
    assert.equal(zeilen.length, 2)
    assert.notEqual(zeilen[0]?.tripId, zeilen[1]?.tripId)
    assert.equal(zeilen[0]?.ordinalText, 'Reise 1 von 2')
    assert.equal(zeilen[1]?.ordinalText, 'Reise 2 von 2')
    assert.equal(zeilen[0]?.ariaLabel.includes('trip-a'), true)
    assert.equal(zeilen[1]?.ariaLabel.includes('trip-b'), true)
    assert.notEqual(zeilen[0]?.ariaLabel, zeilen[1]?.ariaLabel)
  })

  test('gleicher Titel mit verschiedenem Zeitraum braucht keine Zählung', () => {
    const zeilen = weltOrtReiseAnzeigen([
      reiseAnzeige('trip-a', 'Lissabon', { startDate: '2026-09-12', endDate: '2026-09-16' }),
      reiseAnzeige('trip-b', 'Lissabon', { startDate: '2027-04-02', endDate: '2027-04-09' }),
    ])
    assert.equal(zeilen[0]?.ordinalText, null)
    assert.equal(zeilen[1]?.ordinalText, null)
    assert.notEqual(zeilen[0]?.meta, zeilen[1]?.meta)
  })

  test('Status und Zeitraum benutzen bestehende Anzeigebezeichnungen statt Rohwerte', () => {
    const zeilen = weltOrtReiseAnzeigen([
      reiseAnzeige('trip-a', 'Algarve', {
        tripStatus: 'archived',
        startDate: '2025-04-02',
        endDate: '2025-04-06',
      }),
    ])
    assert.equal(zeilen[0]?.meta.includes('archived'), false)
    assert.equal(zeilen[0]?.meta.includes('Archiviert'), true)
    assert.equal(zeilen[0]?.meta.includes('2025'), true)
  })

  test('fehlende Reisedaten bleiben offen und werden nicht erfunden', () => {
    assert.equal(weltReiseZeitraum(null, null), WORLD_MAP_ZEITRAUM_OFFEN_TEXT)
    assert.equal(weltReiseZeitraum('nicht-ein-datum', null), WORLD_MAP_ZEITRAUM_OFFEN_TEXT)
    assert.match(weltReiseZeitraum('2026-09-12', null), /^ab 12\./)
    assert.match(weltReiseZeitraum(null, '2026-09-16'), /^bis 16\./)
    assert.match(weltReiseZeitraum('2026-09-12', '2026-09-16'), /^12\.–16\./)
    assert.match(weltReiseZeitraum('2026-09-12', '2027-01-03'), /2026.*2027/)
  })

  test('ein leerer Reisetitel wird sichtbar benannt, nicht verschluckt', () => {
    const zeilen = weltOrtReiseAnzeigen([reiseAnzeige('trip-a', '   ')])
    assert.equal(zeilen[0]?.titel, 'Reise ohne Titel')
    assert.equal(zeilen[0]?.ariaLabel.includes('trip-a'), true)
  })
})

describe('World-Map-Legende behauptet keine leere Besuchshistorie', () => {
  test('die Kurzform nennt den leeren Stand ohne Zahl', () => {
    assert.equal(WELT_BESUCHT_LEER_KURZ, 'Noch keine Besuche bestätigt')
    assert.equal(/\d/.test(WELT_BESUCHT_LEER_KURZ), false)
    const besucht = weltBesuchtAbleiten({ besuche: [], problem: null })
    assert.equal(besucht.kurz, WELT_BESUCHT_LEER_KURZ)
    assert.equal(besucht.text, WELT_BESUCHT_TEXT)
  })

  test('die Zusammenfassung zeigt keine Null-Zählung', () => {
    const nurKarte = worldMapAbleiten({
      problem: null,
      reisen: [
        reise({
          id: 'trip-1',
          title: 'Lissabon',
          stages: [
            etappeSicht({ name: 'Lissabon', position: 1, latitude: 38.72, longitude: -9.14 }),
          ],
        }),
      ],
    })
    assert.equal(nurKarte.zusammenfassung, '1 Ort auf der Karte')
    const nurListe = worldMapAbleiten({
      problem: null,
      reisen: [
        reise({
          id: 'trip-2',
          title: 'Ohne Punkt',
          stages: [etappeSicht({ name: 'Osaka', position: 1 })],
        }),
      ],
    })
    assert.equal(nurListe.zusammenfassung, '1 Ort ohne gespeicherte Koordinaten')
    assert.equal(nurKarte.geplantKurz, nurKarte.zusammenfassung)
  })

  test('der leere Zustand steht in Legende und Bildunterschrift nicht doppelt', () => {
    const leer = worldMapAbleiten({ problem: null, reisen: [] })
    assert.equal(leer.geplantKurz, WORLD_MAP_GEPLANT_LEER_KURZ)
    assert.equal(leer.leerText, WORLD_MAP_LEER_TEXT)
    assert.notEqual(leer.geplantKurz, leer.leerText)
  })
})
