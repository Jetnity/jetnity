// lib/account/world-map-ansicht.ts
//
// Reine Darstellungsschicht der Account-Weltkarte. Sie rechnet gespeicherte
// Koordinaten in Positionen im gezeigten Kartenausschnitt um und baut lesbare
// Reisebezeichnungen aus bereits geladenen Reisefeldern.
//
// Sie erfindet keine Wahrheit: kein Geocoding, kein Ländercode-Schluss, keine
// Besuchshistorie, keine zweite Abfrage, kein Runtime-Fetch. Wo eine Angabe
// fehlt, bleibt sie sichtbar unbekannt.

import { STATUS_BEZEICHNUNG } from '@/lib/trips/bezeichnungen'
import type { WorldMapOrt, WorldMapReise } from '@/lib/account/world-map'

/**
 * Gezeigter Ausschnitt der gleichwinkligen Projektion. Die Polkappen bleiben
 * aussen vor: sie tragen keine Reiseziele und erzeugten im V1-Bild einen
 * leeren Balken unter der Landsilhouette.
 */
export const WORLD_MAP_RAHMEN = {
  lonMin: -180,
  lonMax: 180,
  latMax: 84,
  latMin: -58,
} as const

export const WORLD_MAP_RAHMEN_VIEWBOX = {
  x: WORLD_MAP_RAHMEN.lonMin + 180,
  y: 90 - WORLD_MAP_RAHMEN.latMax,
  width: WORLD_MAP_RAHMEN.lonMax - WORLD_MAP_RAHMEN.lonMin,
  height: WORLD_MAP_RAHMEN.latMax - WORLD_MAP_RAHMEN.latMin,
} as const

export const WORLD_MAP_AUSSERHALB_RAHMEN_TEXT =
  'Gespeicherte Koordinaten liegen ausserhalb des gezeigten Kartenausschnitts.'

export const WORLD_MAP_ZEITRAUM_OFFEN_TEXT = 'Zeitraum offen'

/**
 * Abstand in Projektionsgrad, unter dem zwei Punkte auf einer Weltkarte in
 * jeder gezeigten Breite übereinanderliegen. Solche Punkte teilen sich eine
 * Trefferfläche, damit keiner davon unerreichbar unter einem anderen liegt.
 * Sie werden dabei nicht zusammengelegt: die Auswahl bleibt ortsweise.
 */
export const WORLD_MAP_MARKER_ABSTAND = 5

export type WorldMapAusrichtung = 'links' | 'mitte' | 'rechts'

export type WorldMapMarker = {
  ort: WorldMapOrt
  /** Position in Prozent der gezeigten Kartenfläche. */
  links: number
  oben: number
  /** Ausrichtung der Beschriftung, damit sie den Ausschnitt nicht verlässt. */
  ausrichtung: WorldMapAusrichtung
}

/**
 * Eine Trefferfläche auf der Karte. Sie sitzt auf den gespeicherten
 * Koordinaten ihres ersten Ortes – kein gemittelter Kunstpunkt – und führt bei
 * mehreren Orten zu einer Auswahl statt zu einem stillen Vorrang.
 */
export type WorldMapMarkerGruppe = {
  schluessel: string
  links: number
  oben: number
  ausrichtung: WorldMapAusrichtung
  orte: readonly WorldMapOrt[]
}

export type WorldMapGitterlinie = {
  schluessel: string
  x1: number
  y1: number
  x2: number
  y2: number
}

export type WorldMapReiseAnzeige = {
  tripId: string
  titel: string
  /** Status und Zeitraum aus bereits geladenen Reisefeldern. */
  meta: string
  /** Nur gesetzt, wenn Titel und Meta zweier eigener Reisen gleich aussehen. */
  ordinalText: string | null
  ariaLabel: string
}

export type WorldMapKartenAnsicht = {
  viewBox: string
  gruppen: readonly WorldMapMarkerGruppe[]
  gitter: readonly WorldMapGitterlinie[]
  /** Orte mit gespeicherten Koordinaten, die der Ausschnitt nicht zeigt. */
  ausserhalb: readonly WorldMapOrt[]
  rahmenHinweis: string | null
}

const MERIDIANE = [-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150] as const
const PARALLELEN = [60, 30, 0, -30] as const

const DATUM_FORMAT = new Intl.DateTimeFormat('de-CH', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

const TAG_MONAT_FORMAT = new Intl.DateTimeFormat('de-CH', {
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
})

const NUR_TAG_FORMAT = new Intl.DateTimeFormat('de-CH', {
  day: 'numeric',
  timeZone: 'UTC',
})

function istImRahmen(x: number, y: number): boolean {
  return (
    x >= WORLD_MAP_RAHMEN_VIEWBOX.x &&
    x <= WORLD_MAP_RAHMEN_VIEWBOX.x + WORLD_MAP_RAHMEN_VIEWBOX.width &&
    y >= WORLD_MAP_RAHMEN_VIEWBOX.y &&
    y <= WORLD_MAP_RAHMEN_VIEWBOX.y + WORLD_MAP_RAHMEN_VIEWBOX.height
  )
}

function ausrichtungFuer(links: number): WorldMapAusrichtung {
  if (links < 18) return 'links'
  if (links > 82) return 'rechts'
  return 'mitte'
}

export function weltMarkerLage(ort: WorldMapOrt): WorldMapMarker | null {
  if (!ort.geplottet || ort.x === null || ort.y === null) return null
  if (!istImRahmen(ort.x, ort.y)) return null
  const links = ((ort.x - WORLD_MAP_RAHMEN_VIEWBOX.x) / WORLD_MAP_RAHMEN_VIEWBOX.width) * 100
  const oben = ((ort.y - WORLD_MAP_RAHMEN_VIEWBOX.y) / WORLD_MAP_RAHMEN_VIEWBOX.height) * 100
  return { ort, links, oben, ausrichtung: ausrichtungFuer(links) }
}

function gitterlinien(): readonly WorldMapGitterlinie[] {
  const oben = WORLD_MAP_RAHMEN_VIEWBOX.y
  const unten = WORLD_MAP_RAHMEN_VIEWBOX.y + WORLD_MAP_RAHMEN_VIEWBOX.height
  const links = WORLD_MAP_RAHMEN_VIEWBOX.x
  const rechts = WORLD_MAP_RAHMEN_VIEWBOX.x + WORLD_MAP_RAHMEN_VIEWBOX.width
  return [
    ...MERIDIANE.map((lon) => {
      const x = lon + 180
      return { schluessel: `meridian-${lon}`, x1: x, y1: oben, x2: x, y2: unten }
    }),
    ...PARALLELEN.map((lat) => {
      const y = 90 - lat
      return { schluessel: `parallele-${lat}`, x1: links, y1: y, x2: rechts, y2: y }
    }),
  ]
}

function rahmenHinweis(anzahl: number): string | null {
  if (anzahl === 0) return null
  if (anzahl === 1) return `1 Ort: ${WORLD_MAP_AUSSERHALB_RAHMEN_TEXT}`
  return `${anzahl} Orte: ${WORLD_MAP_AUSSERHALB_RAHMEN_TEXT}`
}

export function weltKartenAnsicht(orte: readonly WorldMapOrt[]): WorldMapKartenAnsicht {
  const marker: WorldMapMarker[] = []
  const ausserhalb: WorldMapOrt[] = []
  for (const ort of orte) {
    if (!ort.geplottet) continue
    const lage = weltMarkerLage(ort)
    if (lage) marker.push(lage)
    else ausserhalb.push(ort)
  }

  const gruppen: WorldMapMarkerGruppe[] = []
  for (const eintrag of marker) {
    const anker = gruppen.find((gruppe) => {
      const erster = gruppe.orte[0]
      if (!erster || erster.x === null || erster.y === null) return false
      return (
        Math.hypot((eintrag.ort.x ?? 0) - erster.x, (eintrag.ort.y ?? 0) - erster.y) <=
        WORLD_MAP_MARKER_ABSTAND
      )
    })
    if (anker) {
      anker.orte = [...anker.orte, eintrag.ort]
      continue
    }
    gruppen.push({
      schluessel: eintrag.ort.schluessel,
      links: eintrag.links,
      oben: eintrag.oben,
      ausrichtung: eintrag.ausrichtung,
      orte: [eintrag.ort],
    })
  }

  return {
    viewBox: `${WORLD_MAP_RAHMEN_VIEWBOX.x} ${WORLD_MAP_RAHMEN_VIEWBOX.y} ${WORLD_MAP_RAHMEN_VIEWBOX.width} ${WORLD_MAP_RAHMEN_VIEWBOX.height}`,
    gruppen,
    gitter: gitterlinien(),
    ausserhalb,
    rahmenHinweis: rahmenHinweis(ausserhalb.length),
  }
}

export const WORLD_MAP_GRUPPE_FRAGE = 'Mehrere Orte an dieser Stelle. Welchen möchtest du sehen?'

/**
 * Beschreibt eine Trefferfläche für Hilfsmittel. Mehrere Orte werden benannt,
 * nicht auf einen reduziert.
 */
export function weltMarkerGruppeText(gruppe: WorldMapMarkerGruppe): string {
  const namen = gruppe.orte.map((ort) => ort.name)
  if (namen.length === 1) return namen[0] ?? ''
  return `${namen.length} Orte an dieser Stelle: ${namen.join(', ')}`
}

function alsUtcDatum(wert: string | null): Date | null {
  if (typeof wert !== 'string') return null
  if (!/^\d{4}-\d{2}-\d{2}$/.test(wert.trim())) return null
  const datum = new Date(`${wert.trim()}T00:00:00Z`)
  return Number.isNaN(datum.getTime()) ? null : datum
}

/**
 * Kompakter Zeitraum aus gespeicherten Reisedaten. Fehlt ein Datum, bleibt das
 * sichtbar offen; es wird keines abgeleitet.
 */
export function weltReiseZeitraum(startDate: string | null, endDate: string | null): string {
  const start = alsUtcDatum(startDate)
  const ende = alsUtcDatum(endDate)
  if (start && ende) {
    if (start.getTime() > ende.getTime()) {
      return `${DATUM_FORMAT.format(start)} – ${DATUM_FORMAT.format(ende)}`
    }
    if (start.getUTCFullYear() === ende.getUTCFullYear()) {
      if (start.getUTCMonth() === ende.getUTCMonth()) {
        return `${NUR_TAG_FORMAT.format(start)}.–${DATUM_FORMAT.format(ende)}`
      }
      return `${TAG_MONAT_FORMAT.format(start)} – ${DATUM_FORMAT.format(ende)}`
    }
    return `${DATUM_FORMAT.format(start)} – ${DATUM_FORMAT.format(ende)}`
  }
  if (start) return `ab ${DATUM_FORMAT.format(start)}`
  if (ende) return `bis ${DATUM_FORMAT.format(ende)}`
  return WORLD_MAP_ZEITRAUM_OFFEN_TEXT
}

function reiseMeta(reise: WorldMapReise): string {
  return `${STATUS_BEZEICHNUNG[reise.tripStatus]} · ${weltReiseZeitraum(reise.startDate, reise.endDate)}`
}

/**
 * Lesbare Aktionen für die Reisen eines Ortes.
 *
 * Reisen werden nie über den Titel zusammengelegt: zwei eigene Reisen mit
 * gleichem Titel bleiben zwei Aktionen mit unterschiedlicher `tripId`. Sähen
 * Titel und Meta identisch aus, ergänzt eine Zählung die Unterscheidung,
 * damit die Zeilen nicht wie eine Wiederholung wirken.
 */
export function weltOrtReiseAnzeigen(
  reisen: readonly WorldMapReise[],
): readonly WorldMapReiseAnzeige[] {
  const zeilen = reisen.map((reise) => ({
    tripId: reise.tripId,
    titel: reise.tripTitle.trim().length > 0 ? reise.tripTitle.trim() : 'Reise ohne Titel',
    meta: reiseMeta(reise),
  }))

  const gruppen = new Map<string, number>()
  for (const zeile of zeilen) {
    const schluessel = `${zeile.titel}|${zeile.meta}`
    gruppen.set(schluessel, (gruppen.get(schluessel) ?? 0) + 1)
  }
  const gezaehlt = new Map<string, number>()

  return zeilen.map((zeile) => {
    const schluessel = `${zeile.titel}|${zeile.meta}`
    const gesamt = gruppen.get(schluessel) ?? 1
    const laufend = (gezaehlt.get(schluessel) ?? 0) + 1
    gezaehlt.set(schluessel, laufend)
    const ordinalText = gesamt > 1 ? `Reise ${laufend} von ${gesamt}` : null
    return {
      tripId: zeile.tripId,
      titel: zeile.titel,
      meta: zeile.meta,
      ordinalText,
      ariaLabel: `Reise öffnen: ${zeile.titel}, ${zeile.meta}${
        ordinalText ? `, ${ordinalText}` : ''
      } (${zeile.tripId})`,
    }
  })
}