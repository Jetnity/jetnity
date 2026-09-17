#!/usr/bin/env node
/**
 * Erzeugt die lokale Weltkarten-Geometrie der Account-Weltkarte aus
 * Natural-Earth-Quelldaten.
 *
 * Natural Earth ist gemeinfrei (public domain). Die Quelldateien werden nicht
 * mitversioniert: sie liegen in einem ignorierten Zwischenspeicher und werden
 * ueber eine feste Version und eine SHA-256-Pruefsumme identifiziert. Was im
 * Repository liegt, ist allein das erzeugte Ergebnis. Zur Laufzeit wird nichts
 * geladen, weder eine Kachel noch ein Geocoder noch diese Quelldateien.
 *
 * Der Lauf ist deterministisch: gleiche Quelle und gleiche Parameter erzeugen
 * Zeichen fuer Zeichen dieselbe Ausgabedatei.
 *
 * Schritte je Ring beziehungsweise Linie:
 *   1. auf den gezeigten Kartenausschnitt zuschneiden,
 *   2. mit Douglas-Peucker in Grad vereinfachen,
 *   3. auf feste Nachkommastellen runden und doppelte Punkte entfernen,
 *   4. zu gross genug pruefen und in Projektionskoordinaten schreiben.
 *
 * Projektion: gleichwinklig (equirectangular, plate carree), x = lon + 180,
 * y = 90 - lat. Das ist dieselbe Projektion, mit der `weltKarteProjektion` in
 * lib/account/world-map.ts gespeicherte Etappenkoordinaten setzt. Karte und
 * Marker bleiben dadurch deckungsgleich.
 *
 * Zwei Ausgaben entstehen im selben Lauf aus denselben Parametern:
 *   1. lib/account/world-map-geografie.ts  – anonyme Grundkarte (Land, Seen,
 *      Grenzlinien). Sie traegt den neutralen Zustand jedes Landes.
 *   2. lib/account/world-map-laender.ts    – dieselbe Geometrie, aber je Land
 *      nach ISO-3166-1-alpha-2 getrennt. Nur damit kann ein einzelnes Land
 *      eine eigene Flaechenfarbe tragen, ohne dass die Karte ihre Grenzen
 *      verliert.
 *
 * Aufruf:
 *   node scripts/kartografie/weltkarte-geometrie.mjs            # erzeugen
 *   node scripts/kartografie/weltkarte-geometrie.mjs --messen   # nur Kennzahlen
 *   node scripts/kartografie/weltkarte-geometrie.mjs --pruefen  # Drift-Check
 *
 * Optionen:
 *   --detail <110m|50m>   Natural-Earth-Aufloesungsstufe
 *   --toleranz <grad>     Douglas-Peucker-Toleranz in Grad
 *   --flaeche <grad2>     Mindestflaeche einer Landflaeche in Quadratgrad
 *   --seeflaeche <grad2>  Mindestflaeche eines Sees in Quadratgrad
 *   --landflaeche <grad2> Mindestflaeche eines Landesteils in Quadratgrad
 *   --stellen <n>         Nachkommastellen der Projektionskoordinaten
 *   --zwischenspeicher <verzeichnis>
 *   --ausgabe <datei>
 *   --ausgabe-laender <datei>
 */
import { createHash } from 'node:crypto'
import { gzipSync } from 'node:zlib'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

/** Fester Release-Tag des offiziellen Natural-Earth-Vector-Repositories. */
const NE_VERSION = 'v5.1.2'
const NE_BASIS = `https://raw.githubusercontent.com/nvkelso/natural-earth-vector/${NE_VERSION}/geojson`

const DATENSAETZE = {
  '110m': {
    land: 'ne_110m_land',
    grenzen: 'ne_110m_admin_0_boundary_lines_land',
    seen: 'ne_110m_lakes',
    laender: 'ne_110m_admin_0_countries',
  },
  '50m': {
    land: 'ne_50m_land',
    grenzen: 'ne_50m_admin_0_boundary_lines_land',
    seen: 'ne_50m_lakes',
    laender: 'ne_50m_admin_0_countries',
  },
}

/**
 * Gezeigter Ausschnitt. Er muss zu WORLD_MAP_RAHMEN in
 * lib/account/world-map-ansicht.ts passen; eine Abweichung meldet der Lauf.
 */
const RAHMEN = { lonMin: -180, lonMax: 180, latMin: -58, latMax: 84 }

/**
 * Gemessene Vorgabe. Natural Earth 50m liefert erkennbar bessere Kuesten,
 * Inselgruppen und Archipele als 110m; die Douglas-Peucker-Toleranz von 0,25
 * Grad drueckt die Nutzlast dabei auf das Niveau einer 110m-Karte.
 * Belege in docs/REALISTIC_WORLD_CARTOGRAPHY_1_KARTOGRAFIE_PROVENIENZ.md.
 *
 * Eine Toleranz von 0,25 Grad entspricht bei 1280 Pixel Kartenbreite rund
 * 0,9 Pixel und bei 390 Pixel rund 0,27 Pixel: unterhalb dessen, was das
 * gezeigte Bild aufloesen kann.
 */
const STANDARD = {
  detail: '50m',
  toleranz: 0.25,
  flaeche: 0.05,
  seeflaeche: 1.2,
  /**
   * Mindestflaeche eines einzelnen Landesteils. Hoeher als bei der Grundkarte:
   * die Flaechenebene faerbt, sie zeichnet nicht die Kueste. Ein Splitter von
   * einem Zehntel Quadratgrad ist auf 390 Pixel Breite kleiner als ein
   * Bildpunkt und traegt keine erkennbare Farbe – kostet aber Nutzlast. Die
   * Kuestenlinie dieses Splitters bleibt in der Grundkarte erhalten.
   */
  landflaeche: 0.2,
  stellen: 1,
  zwischenspeicher: join(ROOT, '.cache', 'naturalearth'),
  ausgabe: join(ROOT, 'lib', 'account', 'world-map-geografie.ts'),
  ausgabeLaender: join(ROOT, 'lib', 'account', 'world-map-laender.ts'),
}

function argumente(argv) {
  const werte = { ...STANDARD, messen: false, pruefen: false }
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--messen') werte.messen = true
    else if (arg === '--pruefen') werte.pruefen = true
    else if (arg === '--detail') werte.detail = argv[(i += 1)]
    else if (arg === '--toleranz') werte.toleranz = Number(argv[(i += 1)])
    else if (arg === '--flaeche') werte.flaeche = Number(argv[(i += 1)])
    else if (arg === '--seeflaeche') werte.seeflaeche = Number(argv[(i += 1)])
    else if (arg === '--landflaeche') werte.landflaeche = Number(argv[(i += 1)])
    else if (arg === '--stellen') werte.stellen = Number(argv[(i += 1)])
    else if (arg === '--zwischenspeicher') werte.zwischenspeicher = argv[(i += 1)]
    else if (arg === '--ausgabe') werte.ausgabe = argv[(i += 1)]
    else if (arg === '--ausgabe-laender') werte.ausgabeLaender = argv[(i += 1)]
    else {
      console.error(`Unbekannte Option: ${arg}`)
      process.exit(2)
    }
  }
  if (!DATENSAETZE[werte.detail]) {
    console.error(`Unbekannte Detailstufe: ${werte.detail}`)
    process.exit(2)
  }
  return werte
}

function pruefsumme(inhalt) {
  return createHash('sha256').update(inhalt).digest('hex')
}

async function quelleLaden(name, verzeichnis) {
  const datei = join(verzeichnis, `${name}.geojson`)
  if (!existsSync(datei)) {
    mkdirSync(verzeichnis, { recursive: true })
    const url = `${NE_BASIS}/${name}.geojson`
    const antwort = await fetch(url)
    if (!antwort.ok) throw new Error(`${url}: HTTP ${antwort.status}`)
    writeFileSync(datei, Buffer.from(await antwort.arrayBuffer()))
  }
  const roh = readFileSync(datei)
  return { name, datei, bytes: roh.length, sha256: pruefsumme(roh), daten: JSON.parse(roh.toString('utf8')) }
}

/** Alle Ringe (aussen wie Loch) einer Polygon- oder MultiPolygon-Sammlung. */
function ringeAus(sammlung) {
  const ringe = []
  for (const merkmal of sammlung.features) {
    const geo = merkmal.geometry
    if (!geo) continue
    if (geo.type === 'Polygon') ringe.push(...geo.coordinates)
    else if (geo.type === 'MultiPolygon') for (const polygon of geo.coordinates) ringe.push(...polygon)
  }
  return ringe
}

/**
 * ISO-3166-1-alpha-2 eines Natural-Earth-Landmerkmals.
 *
 * `ISO_A2` traegt in Natural Earth bei einigen Staaten `-99`; `ISO_A2_EH` ist
 * die von Natural Earth gepflegte Korrektur derselben Zuordnung. Beide werden
 * gelesen, `WB_A2` bleibt als letzter Rueckfall. Findet sich kein Code, wird
 * das Merkmal uebersprungen: Jetnity erfindet keine Laenderidentitaet, und ein
 * Gebiet ohne anerkannten Code faerbt sich nicht. Seine Kuestenlinie bleibt in
 * der Grundkarte trotzdem sichtbar.
 */
function landCodeAus(eigenschaften) {
  for (const feld of ['ISO_A2_EH', 'ISO_A2', 'WB_A2']) {
    const wert = eigenschaften?.[feld]
    if (typeof wert === 'string' && /^[A-Za-z]{2}$/.test(wert)) return wert.toUpperCase()
  }
  return null
}

/** Ringe je Landcode. Mehrere Merkmale desselben Codes werden zusammengefuehrt. */
function ringeJeLand(sammlung) {
  const nachCode = new Map()
  const punkte = new Map()
  const namen = new Map()
  const ohneCode = []
  for (const merkmal of sammlung.features) {
    const geo = merkmal.geometry
    if (!geo) continue
    const code = landCodeAus(merkmal.properties)
    const ringe = []
    if (geo.type === 'Polygon') ringe.push(...geo.coordinates)
    else if (geo.type === 'MultiPolygon') for (const polygon of geo.coordinates) ringe.push(...polygon)
    if (!code) {
      if (ringe.length > 0) ohneCode.push(merkmal.properties?.NAME ?? 'ohne Namen')
      continue
    }
    const bisher = nachCode.get(code)
    if (bisher) bisher.push(...ringe)
    else nachCode.set(code, ringe)
    // LABEL_X/LABEL_Y sind der von Natural Earth gepflegte Beschriftungspunkt
    // des Landes. Er wird uebernommen, nicht gerechnet: ein selbst gemittelter
    // Schwerpunkt laege bei Inselstaaten im Meer.
    const { LABEL_X: lon, LABEL_Y: lat } = merkmal.properties ?? {}
    if (!punkte.has(code) && typeof lon === 'number' && typeof lat === 'number') {
      punkte.set(code, [lon, lat])
      namen.set(code, merkmal.properties?.NAME ?? code)
    }
  }
  return { nachCode, punkte, namen, ohneCode }
}

function linienAus(sammlung) {
  const linien = []
  for (const merkmal of sammlung.features) {
    const geo = merkmal.geometry
    if (!geo) continue
    if (geo.type === 'LineString') linien.push(geo.coordinates)
    else if (geo.type === 'MultiLineString') linien.push(...geo.coordinates)
  }
  return linien
}

const KANTEN = [
  { innen: (p) => p[0] >= RAHMEN.lonMin, schnitt: (a, b) => teilen(a, b, 0, RAHMEN.lonMin) },
  { innen: (p) => p[0] <= RAHMEN.lonMax, schnitt: (a, b) => teilen(a, b, 0, RAHMEN.lonMax) },
  { innen: (p) => p[1] >= RAHMEN.latMin, schnitt: (a, b) => teilen(a, b, 1, RAHMEN.latMin) },
  { innen: (p) => p[1] <= RAHMEN.latMax, schnitt: (a, b) => teilen(a, b, 1, RAHMEN.latMax) },
]

function teilen(a, b, achse, wert) {
  const spanne = b[achse] - a[achse]
  const t = spanne === 0 ? 0 : (wert - a[achse]) / spanne
  return achse === 0 ? [wert, a[1] + (b[1] - a[1]) * t] : [a[0] + (b[0] - a[0]) * t, wert]
}

/** Sutherland-Hodgman gegen den rechteckigen – also konvexen – Ausschnitt. */
function ringSchneiden(ring) {
  let punkte = ring.slice(0, -1)
  for (const kante of KANTEN) {
    if (punkte.length === 0) return []
    const naechste = []
    for (let i = 0; i < punkte.length; i += 1) {
      const aktuell = punkte[i]
      const vorher = punkte[(i + punkte.length - 1) % punkte.length]
      const aktuellInnen = kante.innen(aktuell)
      const vorherInnen = kante.innen(vorher)
      if (aktuellInnen) {
        if (!vorherInnen) naechste.push(kante.schnitt(vorher, aktuell))
        naechste.push(aktuell)
      } else if (vorherInnen) {
        naechste.push(kante.schnitt(vorher, aktuell))
      }
    }
    punkte = naechste
  }
  return punkte.length === 0 ? [] : [...punkte, punkte[0]]
}

/** Zerlegt eine Linie in die Teilstuecke, die im Ausschnitt liegen. */
function linieSchneiden(linie) {
  const stuecke = []
  let laufend = []
  const anhaengen = (punkt) => {
    const letzter = laufend[laufend.length - 1]
    if (letzter && letzter[0] === punkt[0] && letzter[1] === punkt[1]) return
    laufend.push(punkt)
  }
  const abschliessen = () => {
    if (laufend.length > 1) stuecke.push(laufend)
    laufend = []
  }
  for (let i = 0; i < linie.length - 1; i += 1) {
    const a = linie[i]
    const b = linie[i + 1]
    const geklemmt = segmentKlemmen(a, b)
    if (!geklemmt) {
      abschliessen()
      continue
    }
    const [start, ende] = geklemmt
    // Beginnt das sichtbare Stueck nicht am Segmentanfang, war die Linie
    // zwischendurch draussen: dort endet das vorherige Teilstueck.
    if (start[0] !== a[0] || start[1] !== a[1]) abschliessen()
    anhaengen(start)
    anhaengen(ende)
    if (ende[0] !== b[0] || ende[1] !== b[1]) abschliessen()
  }
  abschliessen()
  return stuecke
}

/** Liang-Barsky auf dem Rechteck. */
function segmentKlemmen(a, b) {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  let t0 = 0
  let t1 = 1
  const paare = [
    [-dx, a[0] - RAHMEN.lonMin],
    [dx, RAHMEN.lonMax - a[0]],
    [-dy, a[1] - RAHMEN.latMin],
    [dy, RAHMEN.latMax - a[1]],
  ]
  for (const [p, q] of paare) {
    if (p === 0) {
      if (q < 0) return null
      continue
    }
    const r = q / p
    if (p < 0) {
      if (r > t1) return null
      if (r > t0) t0 = r
    } else {
      if (r < t0) return null
      if (r < t1) t1 = r
    }
  }
  return [
    [a[0] + t0 * dx, a[1] + t0 * dy],
    [a[0] + t1 * dx, a[1] + t1 * dy],
  ]
}

function abstandZurStrecke(punkt, a, b) {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  if (dx === 0 && dy === 0) return Math.hypot(punkt[0] - a[0], punkt[1] - a[1])
  const t = Math.max(0, Math.min(1, ((punkt[0] - a[0]) * dx + (punkt[1] - a[1]) * dy) / (dx * dx + dy * dy)))
  return Math.hypot(punkt[0] - (a[0] + t * dx), punkt[1] - (a[1] + t * dy))
}

/** Douglas-Peucker, iterativ, damit lange Kuestenlinien den Stack nicht sprengen. */
function vereinfachen(punkte, toleranz) {
  if (punkte.length <= 2) return punkte.slice()
  const behalten = new Uint8Array(punkte.length)
  behalten[0] = 1
  behalten[punkte.length - 1] = 1
  const stapel = [[0, punkte.length - 1]]
  while (stapel.length > 0) {
    const [start, ende] = stapel.pop()
    let groesster = 0
    let index = -1
    for (let i = start + 1; i < ende; i += 1) {
      const abstand = abstandZurStrecke(punkte[i], punkte[start], punkte[ende])
      if (abstand > groesster) {
        groesster = abstand
        index = i
      }
    }
    if (index !== -1 && groesster > toleranz) {
      behalten[index] = 1
      stapel.push([start, index], [index, ende])
    }
  }
  return punkte.filter((_, i) => behalten[i] === 1)
}

/**
 * Naeherung der Flaeche in Quadratgrad am Aequator. Die Gausssche Trapezformel
 * arbeitet in Grad; der Kosinus der mittleren Breite gleicht aus, dass ein
 * Laengengrad polwaerts schmaler wird. Das reicht, um Splitter auszusortieren,
 * und ist keine Flaechenangabe fuer die Anzeige.
 */
function flaecheGrad(ring) {
  let summe = 0
  let breiteSumme = 0
  for (let i = 0; i < ring.length - 1; i += 1) {
    const [x1, y1] = ring[i]
    const [x2, y2] = ring[i + 1]
    summe += x1 * y2 - x2 * y1
    breiteSumme += y1
  }
  const mittlereBreite = ring.length > 1 ? breiteSumme / (ring.length - 1) : 0
  return Math.abs(summe / 2) * Math.cos((mittlereBreite * Math.PI) / 180)
}

function runden(wert, stellen) {
  const faktor = 10 ** stellen
  const gerundet = Math.round(wert * faktor) / faktor
  return Object.is(gerundet, -0) ? 0 : gerundet
}

/** Projektion und Rundung in einem Schritt, danach doppelte Punkte entfernen. */
function projizieren(punkte, stellen) {
  const ergebnis = []
  for (const [lon, lat] of punkte) {
    const x = runden(lon + 180, stellen)
    const y = runden(90 - lat, stellen)
    const letzter = ergebnis[ergebnis.length - 1]
    if (letzter && letzter[0] === x && letzter[1] === y) continue
    ergebnis.push([x, y])
  }
  return ergebnis
}

function pfad(punkte, stellen, geschlossen) {
  const teile = punkte.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(stellen)} ${y.toFixed(stellen)}`)
  return `${teile.join(' ')}${geschlossen ? ' Z' : ''}`
}

function ringePfade(ringe, { toleranz, flaeche, stellen }) {
  const pfade = []
  let punkte = 0
  for (const ring of ringe) {
    const geschnitten = ringSchneiden(ring)
    if (geschnitten.length < 4) continue
    if (flaecheGrad(geschnitten) < flaeche) continue
    const vereinfacht = vereinfachen(geschnitten, toleranz)
    const projiziert = projizieren(vereinfacht, stellen)
    // Nach der Rundung kann der Schlusspunkt auf dem Anfangspunkt liegen.
    while (
      projiziert.length > 1 &&
      projiziert[0][0] === projiziert[projiziert.length - 1][0] &&
      projiziert[0][1] === projiziert[projiziert.length - 1][1]
    ) {
      projiziert.pop()
    }
    if (projiziert.length < 3) continue
    pfade.push(pfad(projiziert, stellen, true))
    punkte += projiziert.length
  }
  return { pfade, punkte }
}

function linienPfade(linien, { toleranz, stellen }) {
  const pfade = []
  let punkte = 0
  for (const linie of linien) {
    for (const stueck of linieSchneiden(linie)) {
      const vereinfacht = vereinfachen(stueck, toleranz)
      const projiziert = projizieren(vereinfacht, stellen)
      if (projiziert.length < 2) continue
      pfade.push(pfad(projiziert, stellen, false))
      punkte += projiziert.length
    }
  }
  return { pfade, punkte }
}

function rahmenPruefen() {
  const quelle = readFileSync(join(ROOT, 'lib', 'account', 'world-map-ansicht.ts'), 'utf8')
  const gefunden = {
    lonMin: Number(/lonMin:\s*(-?\d+(?:\.\d+)?)/.exec(quelle)?.[1]),
    lonMax: Number(/lonMax:\s*(-?\d+(?:\.\d+)?)/.exec(quelle)?.[1]),
    latMax: Number(/latMax:\s*(-?\d+(?:\.\d+)?)/.exec(quelle)?.[1]),
    latMin: Number(/latMin:\s*(-?\d+(?:\.\d+)?)/.exec(quelle)?.[1]),
  }
  for (const schluessel of Object.keys(RAHMEN)) {
    if (gefunden[schluessel] !== RAHMEN[schluessel]) {
      throw new Error(
        `Ausschnitt weicht ab: world-map-ansicht.ts ${schluessel}=${gefunden[schluessel]}, Skript ${schluessel}=${RAHMEN[schluessel]}. Erst angleichen, dann neu erzeugen.`,
      )
    }
  }
}

function liste(pfade, einrueckung = '  ') {
  return pfade.map((eintrag) => `${einrueckung}'${eintrag}',`).join('\n')
}

function modul({ optionen, quellen, land, grenzen, seen }) {
  const quellZeilen = quellen
    .map(
      (quelle) =>
        `    {\n      datei: '${quelle.name}.geojson',\n      bytes: ${quelle.bytes},\n      sha256: '${quelle.sha256}',\n    },`,
    )
    .join('\n')

  return `// lib/account/world-map-geografie.ts
//
// ERZEUGT – nicht von Hand bearbeiten.
// Quelle: scripts/kartografie/weltkarte-geometrie.mjs
// Neu erzeugen: node scripts/kartografie/weltkarte-geometrie.mjs
//
// Lokale Vektorgeografie der Account-Weltkarte, abgeleitet aus Natural Earth
// (gemeinfrei / public domain), Release ${NE_VERSION}, Detailstufe ${optionen.detail}.
//
// Zur Laufzeit wird nichts nachgeladen: keine Kacheln, kein Kartendienst,
// keine Ortsaufloesung, keine Quelldatei. Die Pfade liegen in Projektions-
// koordinaten der gleichwinkligen Projektion (x = lon + 180, y = 90 - lat),
// also in derselben Projektion, in der \`weltKarteProjektion\` gespeicherte
// Etappenkoordinaten setzt. Karte und Marker sind deshalb deckungsgleich.
//
// Die Geometrie ist auf den gezeigten Ausschnitt zugeschnitten
// (lon ${RAHMEN.lonMin}..${RAHMEN.lonMax}, lat ${RAHMEN.latMin}..${RAHMEN.latMax}). Die Antarktis liegt vollstaendig
// suedlich davon und ist deshalb nicht enthalten – sie fehlt, statt als Balken
// am unteren Rand zu erscheinen.
//
// Die Grenzlinien sind Orientierungskartografie. Sie sind keine Aussage
// Jetnitys ueber voelkerrechtliche Grenzverlaeufe, Hoheit oder Anerkennung.

/** Herkunft der Geometrie. Belegt, dass nichts zur Laufzeit geladen wird. */
export const WORLD_MAP_GEOGRAFIE_HERKUNFT = {
  datensatz: 'Natural Earth',
  version: '${NE_VERSION}',
  detail: '${optionen.detail}',
  lizenz: 'Public domain (Natural Earth terms of use)',
  bezugsquelle: 'nvkelso/natural-earth-vector (GitHub), Verzeichnis geojson',
  projektion: 'equirectangular / plate carree, x = lon + 180, y = 90 - lat',
  vereinfachung: 'Douglas-Peucker',
  toleranzGrad: ${optionen.toleranz},
  nachkommastellen: ${optionen.stellen},
  runtimeFetch: false,
  grenzenSindOrientierung: true,
  quellen: [
${quellZeilen}
  ],
} as const

/** Landflaechen als geschlossene Ringe. Loecher (Kaspisches Meer) inklusive. */
export const WORLD_MAP_LAND_PFADE: readonly string[] = [
${liste(land.pfade)}
]

/** Grosse Binnenseen, als Wasserflaeche ueber das Land gezeichnet. */
export const WORLD_MAP_SEE_PFADE: readonly string[] = [
${liste(seen.pfade)}
]

/** Internationale Landgrenzen als offene Linien. Reine Orientierung. */
export const WORLD_MAP_GRENZ_PFADE: readonly string[] = [
${liste(grenzen.pfade)}
]
`
}

function laenderModul({ optionen, quelle, laender, kleinstaaten, uebersprungen }) {
  const zeilen = laender
    .map(({ code, pfade }) => `  ${code}: [\n${liste(pfade, '    ')}\n  ],`)
    .join('\n')

  const punktZeilen = kleinstaaten
    .map(
      ({ code, name, x, y }) =>
        `  ${code}: [${x.toFixed(optionen.stellen)}, ${y.toFixed(optionen.stellen)}], // ${name}`,
    )
    .join('\n')

  return `// lib/account/world-map-laender.ts
//
// ERZEUGT – nicht von Hand bearbeiten.
// Quelle: scripts/kartografie/weltkarte-geometrie.mjs
// Neu erzeugen: node scripts/kartografie/weltkarte-geometrie.mjs
//
// Dieselbe lokale Vektorgeografie wie world-map-geografie.ts, aber je Land
// getrennt und nach ISO-3166-1-alpha-2 benannt. Abgeleitet aus Natural Earth
// (gemeinfrei / public domain), Release ${NE_VERSION}, Detailstufe ${optionen.detail}.
//
// Wozu: die Grundkarte traegt den neutralen Zustand. Ein einzelnes Land kann
// nur dann \`besucht\` oder \`geplant\` zeigen, wenn seine Flaeche als eigener
// Pfad vorliegt. Die Grenzlinien der Grundkarte werden weiterhin ueber die
// Flaechen gezeichnet und bleiben unter jeder Fuellung lesbar.
//
// Was hier nicht steht, faerbt sich nicht: Gebiete ohne anerkannten ISO-Code
// (${uebersprungen.join(', ')}) bleiben neutrale Grundkarte. Das ist eine
// bewusste Enthaltung, keine Luecke.
//
// Zur Laufzeit wird nichts nachgeladen. Dieses Modul gehoert auf den Server:
// es traegt die Flaechen aller Laender, waehrend der Browser nur die wenigen
// Pfade erhaelt, die das Konto tatsaechlich einfaerbt.
//
// Projektion wie die Grundkarte: x = lon + 180, y = 90 - lat.
//
// Die Flaechen sind Orientierungskartografie. Sie sind keine Aussage Jetnitys
// ueber voelkerrechtliche Grenzverlaeufe, Hoheit oder Anerkennung.

/** Herkunft der Laenderflaechen. Belegt, dass nichts zur Laufzeit geladen wird. */
export const WORLD_MAP_LAENDER_HERKUNFT = {
  datensatz: 'Natural Earth',
  version: '${NE_VERSION}',
  detail: '${optionen.detail}',
  lizenz: 'Public domain (Natural Earth terms of use)',
  bezugsquelle: 'nvkelso/natural-earth-vector (GitHub), Verzeichnis geojson',
  projektion: 'equirectangular / plate carree, x = lon + 180, y = 90 - lat',
  vereinfachung: 'Douglas-Peucker',
  toleranzGrad: ${optionen.toleranz},
  mindestflaecheGrad2: ${optionen.landflaeche},
  nachkommastellen: ${optionen.stellen},
  runtimeFetch: false,
  grenzenSindOrientierung: true,
  /** Gebiete ohne anerkannten ISO-3166-1-alpha-2-Code. Sie bleiben neutral. */
  ohneLandcode: [${uebersprungen.map((name) => `'${name.replace(/'/g, "\\'")}'`).join(', ')}] as readonly string[],
  quelle: {
    datei: '${quelle.name}.geojson',
    bytes: ${quelle.bytes},
    sha256: '${quelle.sha256}',
  },
} as const

/**
 * Landflaechen je ISO-3166-1-alpha-2-Code, als geschlossene Ringe.
 *
 * Der Schluessel ist Grosschreibung, wie \`countryCodeNormalisieren\` sie
 * liefert. Ein fehlender Schluessel heisst: fuer dieses Land liegt keine
 * faerbbare Flaeche vor – nicht, dass es das Land nicht gibt.
 */
export const WORLD_MAP_LAENDER_PFADE: Readonly<Record<string, readonly string[]>> = {
${zeilen}
}

/**
 * Beschriftungspunkt der Laender, die auf Weltmassstab keine zeichenbare
 * Flaeche haben.
 *
 * Singapur, Malta oder die Malediven sind kleiner als ein Bildpunkt dieser
 * Karte: nach dem Vereinfachen bleibt von ihrem Umriss keine Flaeche uebrig.
 * Ohne diesen Punkt behauptete die Karte, ein bestaetigt besuchtes Land sei
 * nicht besucht, waehrend die Kennzahl daneben es zaehlt. Der Punkt stammt aus
 * \`LABEL_X\`/\`LABEL_Y\` des Datensatzes – er ist uebernommen, nicht gerechnet.
 *
 * Nur Laender ohne eigenen Eintrag in \`WORLD_MAP_LAENDER_PFADE\` stehen hier.
 * Ein Land hat entweder eine Flaeche oder einen Punkt, nie beides.
 */
export const WORLD_MAP_LAENDER_PUNKTE: Readonly<Record<string, readonly [number, number]>> = {
${punktZeilen}
}
`
}

const optionen = argumente(process.argv.slice(2))
rahmenPruefen()

const namen = DATENSAETZE[optionen.detail]
const quelleLand = await quelleLaden(namen.land, optionen.zwischenspeicher)
const quelleGrenzen = await quelleLaden(namen.grenzen, optionen.zwischenspeicher)
const quelleSeen = await quelleLaden(namen.seen, optionen.zwischenspeicher)
const quelleLaender = await quelleLaden(namen.laender, optionen.zwischenspeicher)

const land = ringePfade(ringeAus(quelleLand.daten), optionen)
const seen = ringePfade(ringeAus(quelleSeen.daten), {
  ...optionen,
  flaeche: optionen.seeflaeche,
})
const grenzen = linienPfade(linienAus(quelleGrenzen.daten), optionen)

const { nachCode, punkte: labelPunkte, namen: landNamen, ohneCode } = ringeJeLand(quelleLaender.daten)
const laender = []
const kleinstaaten = []
let laenderPunkte = 0
for (const code of [...nachCode.keys()].sort()) {
  const erzeugt = ringePfade(nachCode.get(code), { ...optionen, flaeche: optionen.landflaeche })
  if (erzeugt.pfade.length > 0) {
    laender.push({ code, pfade: erzeugt.pfade })
    laenderPunkte += erzeugt.punkte
    continue
  }
  const label = labelPunkte.get(code)
  if (!label) continue
  const [[x, y] = []] = projizieren([label], optionen.stellen)
  if (x === undefined || y === undefined) continue
  // Antarktis liegt vollstaendig ausserhalb des gezeigten Ausschnitts und
  // bekaeme sonst einen Punkt auf der unteren Kante.
  if (
    x < RAHMEN.lonMin + 180 ||
    x > RAHMEN.lonMax + 180 ||
    y < 90 - RAHMEN.latMax ||
    y > 90 - RAHMEN.latMin
  ) {
    continue
  }
  kleinstaaten.push({ code, name: landNamen.get(code) ?? code, x, y })
}

const inhalt = modul({
  optionen,
  quellen: [quelleLand, quelleGrenzen, quelleSeen],
  land,
  grenzen,
  seen,
})

const laenderInhalt = laenderModul({
  optionen,
  quelle: quelleLaender,
  laender,
  kleinstaaten,
  uebersprungen: [...new Set(ohneCode)].sort(),
})

const nutzlast = [...land.pfade, ...seen.pfade, ...grenzen.pfade].join(' ')
const laenderNutzlast = laender.flatMap((eintrag) => eintrag.pfade).join(' ')
const kennzahlen = {
  detail: optionen.detail,
  toleranz: optionen.toleranz,
  stellen: optionen.stellen,
  landPfade: land.pfade.length,
  landPunkte: land.punkte,
  seePfade: seen.pfade.length,
  seePunkte: seen.punkte,
  grenzPfade: grenzen.pfade.length,
  grenzPunkte: grenzen.punkte,
  geometrieBytes: Buffer.byteLength(nutzlast, 'utf8'),
  geometrieBytesGzip: gzipSync(Buffer.from(nutzlast, 'utf8')).length,
  moduleBytes: Buffer.byteLength(inhalt, 'utf8'),
  moduleBytesGzip: gzipSync(Buffer.from(inhalt, 'utf8')).length,
  laenderMitFlaeche: laender.length,
  laenderMitPunkt: kleinstaaten.length,
  laenderOhneCode: [...new Set(ohneCode)].sort(),
  laenderPfade: laender.reduce((summe, eintrag) => summe + eintrag.pfade.length, 0),
  laenderPunkte,
  laenderBytes: Buffer.byteLength(laenderNutzlast, 'utf8'),
  laenderBytesGzip: gzipSync(Buffer.from(laenderNutzlast, 'utf8')).length,
  /** Grosstes einzelnes Land: so viel erreicht den Browser je gefaerbtem Land. */
  groesstesLandBytes: Math.max(
    ...laender.map((eintrag) => Buffer.byteLength(eintrag.pfade.join(' '), 'utf8')),
  ),
  laenderModuleBytes: Buffer.byteLength(laenderInhalt, 'utf8'),
  laenderModuleBytesGzip: gzipSync(Buffer.from(laenderInhalt, 'utf8')).length,
}

const ausgaben = [
  [optionen.ausgabe, inhalt],
  [optionen.ausgabeLaender, laenderInhalt],
]

if (optionen.messen) {
  console.log(JSON.stringify(kennzahlen, null, 2))
} else if (optionen.pruefen) {
  let abweichung = false
  for (const [datei, erwartet] of ausgaben) {
    const vorhanden = existsSync(datei) ? readFileSync(datei, 'utf8') : ''
    if (vorhanden !== erwartet) {
      console.error(
        `${relative(ROOT, datei)} weicht von der Erzeugung ab. node scripts/kartografie/weltkarte-geometrie.mjs ausfuehren.`,
      )
      abweichung = true
    } else {
      console.log(`${relative(ROOT, datei)} ist aktuell.`)
    }
  }
  if (abweichung) process.exit(1)
} else {
  for (const [datei, erzeugt] of ausgaben) {
    writeFileSync(datei, erzeugt)
    console.log(`${relative(ROOT, datei)} erzeugt.`)
  }
  console.log(JSON.stringify(kennzahlen, null, 2))
}
