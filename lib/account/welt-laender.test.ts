import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  WORLD_MAP_LAENDER_HERKUNFT,
  WORLD_MAP_LAENDER_PFADE,
  WORLD_MAP_LAENDER_PUNKTE,
} from '@/lib/account/world-map-laender'
import { WORLD_MAP_LAND_PFADE } from '@/lib/account/world-map-geografie'
import {
  WORLD_MAP_RAHMEN_VIEWBOX,
  weltKartenAnsicht,
} from '@/lib/account/world-map-ansicht'
import { weltKarteProjektion } from '@/lib/account/world-map'
import { weltLaenderAbleiten, weltOhneFlaecheHinweis } from '@/lib/account/welt-laender'

const hier = dirname(fileURLToPath(import.meta.url))

function quelle(relativ: string) {
  return readFileSync(join(hier, relativ), 'utf8')
}

/** Alle Punkte eines Pfades als Projektionskoordinaten. */
function koordinaten(pfad: string): readonly (readonly [number, number])[] {
  return [...pfad.matchAll(/[ML](-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g)].map(
    (treffer) => [Number(treffer[1]), Number(treffer[2])] as const,
  )
}

function inRingen(ringe: readonly (readonly (readonly [number, number])[])[], x: number, y: number) {
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

describe('Die Länderflächen sind belegte, lokale Vektorgeografie', () => {
  test('die Herkunft nennt Datensatz, Version, Lizenz und Pruefsumme', () => {
    assert.equal(WORLD_MAP_LAENDER_HERKUNFT.datensatz, 'Natural Earth')
    assert.match(WORLD_MAP_LAENDER_HERKUNFT.version, /^v\d+\.\d+\.\d+$/)
    assert.match(WORLD_MAP_LAENDER_HERKUNFT.lizenz, /[Pp]ublic domain/)
    assert.equal(WORLD_MAP_LAENDER_HERKUNFT.runtimeFetch, false)
    assert.match(WORLD_MAP_LAENDER_HERKUNFT.quelle.datei, /^ne_\d+m_admin_0_countries\.geojson$/)
    assert.match(WORLD_MAP_LAENDER_HERKUNFT.quelle.sha256, /^[0-9a-f]{64}$/)
    assert.equal(WORLD_MAP_LAENDER_HERKUNFT.quelle.bytes > 0, true)
    assert.equal(WORLD_MAP_LAENDER_HERKUNFT.grenzenSindOrientierung, true)
  })

  test('die erzeugte Datei bleibt erzeugt und trägt ihren Erzeuger', () => {
    const text = quelle('world-map-laender.ts')
    assert.match(text, /ERZEUGT/)
    assert.match(text, /scripts\/kartografie\/weltkarte-geometrie\.mjs/)
  })

  test('kein externes Karten-, Tile- oder Geocoding-Runtime-Ziel', () => {
    const dateien = [
      'world-map-laender.ts',
      'welt-laender.ts',
      'welt-geometrie.ts',
      '../../components/account/WeltZustaende.tsx',
    ]
    for (const datei of dateien) {
      const text = quelle(datei).toLowerCase()
      for (const verboten of [
        'mapbox',
        'googleapis.com/maps',
        'openstreetmap',
        'maptiler',
        'hereapi',
        'geocode',
        'nominatim',
        'leaflet',
        'https://',
        'http://',
        'fetch(',
      ]) {
        assert.equal(text.includes(verboten), false, `${datei}: ${verboten}`)
      }
    }
  })

  test('jedes Land ist nach ISO-3166-1-alpha-2 benannt und geschlossen gezeichnet', () => {
    const codes = Object.keys(WORLD_MAP_LAENDER_PFADE)
    assert.equal(codes.length > 150, true, `nur ${codes.length} Länder`)
    for (const code of codes) {
      assert.match(code, /^[A-Z]{2}$/)
      const pfade = WORLD_MAP_LAENDER_PFADE[code] ?? []
      assert.equal(pfade.length > 0, true, code)
      for (const pfad of pfade) {
        assert.equal(pfad.startsWith('M') && pfad.endsWith('Z'), true, `${code}: ${pfad.slice(0, 20)}`)
      }
    }
  })

  test('ein Land hat entweder eine Fläche oder einen Punkt, nie beides', () => {
    for (const code of Object.keys(WORLD_MAP_LAENDER_PUNKTE)) {
      assert.match(code, /^[A-Z]{2}$/)
      assert.equal(WORLD_MAP_LAENDER_PFADE[code], undefined, code)
    }
    for (const code of Object.keys(WORLD_MAP_LAENDER_PFADE)) {
      assert.equal(WORLD_MAP_LAENDER_PUNKTE[code], undefined, code)
    }
  })

  test('jeder Punkt liegt im gezeigten Ausschnitt der Markerprojektion', () => {
    const links = WORLD_MAP_RAHMEN_VIEWBOX.x
    const rechts = WORLD_MAP_RAHMEN_VIEWBOX.x + WORLD_MAP_RAHMEN_VIEWBOX.width
    const oben = WORLD_MAP_RAHMEN_VIEWBOX.y
    const unten = WORLD_MAP_RAHMEN_VIEWBOX.y + WORLD_MAP_RAHMEN_VIEWBOX.height

    for (const [code, pfade] of Object.entries(WORLD_MAP_LAENDER_PFADE)) {
      for (const pfad of pfade) {
        for (const [x, y] of koordinaten(pfad)) {
          assert.equal(x >= links && x <= rechts, true, `${code}: x=${x}`)
          assert.equal(y >= oben && y <= unten, true, `${code}: y=${y}`)
        }
      }
    }
    for (const [code, [x, y]] of Object.entries(WORLD_MAP_LAENDER_PUNKTE)) {
      assert.equal(x >= links && x <= rechts, true, `${code}: x=${x}`)
      assert.equal(y >= oben && y <= unten, true, `${code}: y=${y}`)
    }
  })

  /**
   * Die Flächenebene liegt über der Grundkarte. Läge sie in einer anderen
   * Projektion, würde ein bestätigtes Land neben seiner Küste leuchten – der
   * Fehler, den eine reine Formprüfung durchliesse.
   */
  test('bekannte Städte liegen in der Fläche ihres Landes', () => {
    for (const [code, lat, lon] of [
      ['PT', 38.72, -9.14],
      ['CH', 46.95, 7.45],
      ['JP', 35.69, 139.69],
      ['KE', -1.29, 36.82],
      ['AR', -34.6, -58.38],
      ['US', 39.74, -104.99],
      ['AU', -31.95, 115.86],
    ] as const) {
      const ringe = (WORLD_MAP_LAENDER_PFADE[code] ?? []).map(koordinaten)
      assert.equal(ringe.length > 0, true, `${code} ohne Fläche`)
      const { x, y } = weltKarteProjektion(lat, lon)
      assert.equal(inRingen(ringe, x, y), true, `${code} trifft seine eigene Fläche nicht`)
    }
  })

  test('kein Land greift über den halben Globus', () => {
    // Ein über die Datumsgrenze falsch zusammengesetzter Ring erzeugte einen
    // Balken quer über die Karte. Russland und die USA sind die Kandidaten.
    for (const [code, pfade] of Object.entries(WORLD_MAP_LAENDER_PFADE)) {
      for (const pfad of pfade) {
        const xWerte = koordinaten(pfad).map(([x]) => x)
        assert.equal(Math.max(...xWerte) - Math.min(...xWerte) < 180, true, `${code}`)
      }
    }
  })

  test('die Flächenebene bleibt unter der zugesagten Nutzlastgrenze', () => {
    const zeichen = Object.values(WORLD_MAP_LAENDER_PFADE).flat().join(' ').length
    assert.equal(zeichen < 100_000, true, `Länderflächen ${zeichen} Zeichen`)
    const groesstes = Math.max(
      ...Object.values(WORLD_MAP_LAENDER_PFADE).map((pfade) => pfade.join(' ').length),
    )
    // Nur die Länder des eigenen Kontos erreichen den Browser. Die Grenze gilt
    // deshalb je Land, nicht für die Tabelle.
    assert.equal(groesstes < 15_000, true, `grösstes Land ${groesstes} Zeichen`)
  })

  test('die Grundkarte bleibt unverändert und trägt weiterhin alle Küsten', () => {
    assert.equal(WORLD_MAP_LAND_PFADE.length > 150, true)
    const laenderZeichen = Object.values(WORLD_MAP_LAENDER_PFADE).flat().join('').length
    const grundZeichen = WORLD_MAP_LAND_PFADE.join('').length
    // Die Flächen ersetzen die Grundkarte nicht, sie liegen darüber. Wäre die
    // Grundkarte verschwunden, hätten Gebiete ohne ISO-Code kein Land mehr.
    assert.equal(grundZeichen > 0 && laenderZeichen > 0, true)
  })
})

describe('Die Zustandsebene lässt Grenzen sichtbar', () => {
  const karte = quelle('../../components/account/AccountWeltKarte.tsx')

  test('die Grenzlinien werden nach den Länderflächen gezeichnet', () => {
    const flaechen = karte.indexOf('<WeltFuellungen')
    const grenzen = karte.indexOf('d={GRENZ_PFAD}')
    const land = karte.indexOf('d={LAND_PFAD}')
    assert.equal(land > -1 && flaechen > -1 && grenzen > -1, true)
    assert.equal(land < flaechen, true, 'Grundkarte muss unter den Flächen liegen')
    assert.equal(flaechen < grenzen, true, 'Grenzen müssen über den Flächen liegen')
  })

  test('keine Füllung ist deckend, und jede Fläche behält ihren Umriss', () => {
    const zustaende = quelle('../../components/account/WeltZustaende.tsx')
    for (const fuellung of ['fill-brand-800/45', 'fill-brand-600/10']) {
      assert.equal(zustaende.includes(fuellung), true, fuellung)
    }
    assert.equal(/fill-brand-\d00(?![/\d])/.test(zustaende), false, 'keine deckende Füllung')
    assert.match(zustaende, /UMRISS\[flaeche\.zustand\]/)
    assert.match(zustaende, /\[vector-effect:non-scaling-stroke\]/)
  })

  test('die Kartenbeschreibung nennt die Zustände in Worten', () => {
    assert.match(karte, /WELT_KARTE_ZUSTAND_BESCHREIBUNG/)
    assert.match(karte, /<WeltLaenderListe flaechen=\{laender\.flaechen\} \/>/)
  })
})

describe('Die vollständige Ländertabelle bleibt auf dem Server', () => {
  test('nur welt-geometrie.ts schlägt sie nach, und sie ist server-only', () => {
    const geometrie = quelle('welt-geometrie.ts')
    assert.match(geometrie, /^import 'server-only'$/m)
    assert.match(geometrie, /world-map-laender/)

    const verbraucher = [
      '../../components/account/AccountWeltKarte.tsx',
      '../../components/account/WeltZustaende.tsx',
      '../../components/account/AccountBesuche.tsx',
      '../../components/account/AccountUebersicht.tsx',
      '../../components/account/AccountUebersichtLive.tsx',
      '../../components/account/AccountAuditClient.tsx',
      'welt-laender.ts',
    ]
    for (const datei of verbraucher) {
      const text = quelle(datei)
      assert.equal(/from '@\/lib\/account\/world-map-laender'/.test(text), false, datei)
      assert.equal(/from '@\/lib\/account\/welt-geometrie'/.test(text), false, datei)
    }
  })

  test('der Hinweis für Länder ohne Fläche widerspricht der Kennzahl nicht', () => {
    assert.equal(weltOhneFlaecheHinweis([]), null)
    assert.match(weltOhneFlaecheHinweis(['Singapur']) ?? '', /Singapur/)
    assert.match(weltOhneFlaecheHinweis(['Singapur', 'Malta']) ?? '', /Singapur, Malta/)
  })

  test('die Zustandsebene stört die Markerprojektion nicht', () => {
    // Beide Ebenen rechnen in derselben Projektion: die Flächen kommen aus dem
    // Erzeuger, die Marker aus `weltKarteProjektion`.
    const ansicht = weltKartenAnsicht([])
    assert.equal(
      ansicht.viewBox,
      `${WORLD_MAP_RAHMEN_VIEWBOX.x} ${WORLD_MAP_RAHMEN_VIEWBOX.y} ${WORLD_MAP_RAHMEN_VIEWBOX.width} ${WORLD_MAP_RAHMEN_VIEWBOX.height}`,
    )
    const laender = weltLaenderAbleiten({
      besucht: ['PT'],
      geplant: [],
      geometrie: { PT: { pfade: WORLD_MAP_LAENDER_PFADE.PT ?? [], punkt: null } },
    })
    const ringe = (laender.flaechen[0]?.pfad ?? '').split('Z').filter(Boolean).map(koordinaten)
    const { x, y } = weltKarteProjektion(38.72, -9.14)
    assert.equal(inRingen(ringe, x, y), true)
  })
})
