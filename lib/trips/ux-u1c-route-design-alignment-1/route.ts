// Presentation rows for the compact route.
// Reads N12 runs and existing mobility edges. Does not sort or write the trip.

import { landDarstellung } from '@/lib/country/darstellung'
import { istGebucht } from '@/lib/trips/buchung'
import { etappenZeitraumAnzeigen } from '@/lib/trips/datum-anzeige'
import { mobilitaetsAbdeckung, type Bewegungskante } from '@/lib/mobility/kanten'
import {
  chronologischeLaeufe,
  laufUntertitel,
  type ChronologieLesart,
  type ChronologischerLauf,
} from '@/lib/trips/n12-chronology-1/laeufe'
import type { Trip, TripDay } from '@/types/trips'

const ISO_TAG = /^\d{4}-\d{2}-\d{2}$/

export type RouteLaufZeile = {
  art: 'lauf'
  schluessel: string
  stageId: string | null
  name: string
  lesart: ChronologieLesart
  land: string | null
  untertitel: string | null
  geplanteTage: string | null
  gespeicherterZeitraum: string | null
  tagIds: string[]
}

export type RouteKanteZeile = {
  art: 'kante'
  occurrenceKey: string
  kanteId: string
  vonSchluessel: string
  nachSchluessel: string
  rueckTagId: string
  tagIds: string[]
  titel: string
  waehlbar: boolean
  mehrdeutig: boolean
  datumText: string
  dauerText: string
  planText: string
}

export type RouteZeile = RouteLaufZeile | RouteKanteZeile

export type KanteAufloesung =
  | { art: 'keine' }
  | { art: 'eindeutig'; occurrenceKey: string; zeile: RouteKanteZeile }
  | { art: 'mehrdeutig' }
  | { art: 'nicht-verfuegbar' }

export const KANTE_MEHRDEUTIG = 'Dieser Abschnitt kommt mehrfach vor. Keiner wird automatisch ausgewählt.'
export const KANTE_ZUORDNUNG_UNKLAR = 'Die Zuordnung gespeicherter Verbindungen ist noch unklar. Das belegt nicht, dass keine Verbindung gespeichert ist.'
export const KANTE_NICHT_VERFUEGBAR = 'Dieser Reiseabschnitt ist nicht mehr verfügbar. Ein anderer Abschnitt wird nicht eingesetzt.'
export const KANTE_UNLESBAR = 'Dieser Reiseabschnitt ist nicht lesbar. Ein anderer Abschnitt wird nicht eingesetzt.'

function isoGueltig(wert: string | null | undefined): wert is string {
  if (!wert || !ISO_TAG.test(wert)) return false
  const zeit = new Date(`${wert}T00:00:00Z`)
  return Number.isFinite(zeit.getTime()) && zeit.toISOString().slice(0, 10) === wert
}

function naechsterTag(iso: string): string {
  const zeit = new Date(`${iso}T00:00:00Z`)
  zeit.setUTCDate(zeit.getUTCDate() + 1)
  return zeit.toISOString().slice(0, 10)
}

/** Contiguous calendar ranges only. A gap never becomes one span from first to last. */
export function geplanteTageText(tage: readonly Pick<TripDay, 'dayDate'>[], art: 'aufenthalt' | 'kalender'): string | null {
  if (tage.length === 0) return null
  const roh = tage.map((tag) => tag.dayDate)
  const gueltig = roh.filter(isoGueltig)
  const fehlend = roh.length - gueltig.length
  const eindeutig = [...new Set(gueltig)].sort()
  const doppelt = gueltig.length !== eindeutig.length
  const prefix = art === 'aufenthalt' ? 'Geplante Tage' : 'Kalenderdaten'
  if (eindeutig.length === 0) return `${prefix}: Datum nicht festgelegt`
  const bereiche: { start: string; ende: string }[] = []
  for (const tag of eindeutig) {
    const letzter = bereiche[bereiche.length - 1]
    if (letzter && naechsterTag(letzter.ende) === tag) letzter.ende = tag
    else bereiche.push({ start: tag, ende: tag })
  }
  const spanne = bereiche.map((bereich) => etappenZeitraumAnzeigen(bereich.start, bereich.ende) ?? bereich.start).join(', ')
  const teile = [`${prefix}: ${spanne}`]
  if (fehlend > 0) teile.push(fehlend === 1 ? '1 Tag ohne gültiges Datum' : `${fehlend} Tage ohne gültiges Datum`)
  if (doppelt) teile.push('einzelne Daten liegen mehrfach vor')
  if (bereiche.length > 1) teile.push('nicht durchgehend')
  return teile.join(' · ')
}

function landText(lauf: ChronologischerLauf): string | null {
  if (lauf.lesart !== 'ziel') return null
  if (!lauf.countryCode) return 'Land noch nicht zugeordnet'
  const darstellung = landDarstellung(lauf.countryCode)
  if (darstellung.art === 'leer') return 'Land noch nicht zugeordnet'
  if (darstellung.art === 'katalog') return darstellung.name ?? 'Land noch nicht zugeordnet'
  return darstellung.label
}

function kanteDatumText(kante: Pick<Bewegungskante, 'date'>): string {
  if (!kante.date) return 'Reisedatum nicht gespeichert. Aus den Aufenthaltstagen wird keines abgeleitet.'
  const sichtbar = etappenZeitraumAnzeigen(kante.date, kante.date) ?? kante.date
  return `Gespeichertes Ankunftsdatum des Ziels: ${sichtbar}. Das ist kein nachgewiesenes Reisedatum.`
}

export function kanteDauerText(kante: Pick<Bewegungskante, 'durationMinutes'>): string {
  if (kante.durationMinutes == null) return 'Dauer nicht gespeichert.'
  return `Gespeicherte Ortszeitdifferenz: ${kante.durationMinutes} Minuten. Keine geprüfte Reisezeit.`
}

export function kantePlanText(kante: Pick<Bewegungskante, 'mobilityItem' | 'status'>): string {
  if (kante.status === 'unknown') return KANTE_ZUORDNUNG_UNKLAR
  const punkt = kante.mobilityItem
  if (!punkt) return 'Noch keine gespeicherte Verbindung.'
  const markierung = istGebucht(punkt)
    ? 'Vom Nutzer als gebucht markiert. Keine Anbieterbestätigung.'
    : 'Im Plan ausgewählt. Keine Anbieterbestätigung.'
  return `Gespeicherter Eintrag «${punkt.title}». ${markierung}`
}

function laufZeile(lauf: ChronologischerLauf): RouteLaufZeile {
  const gespeichert = lauf.lesart === 'ziel'
    ? etappenZeitraumAnzeigen(lauf.arrivalDate, lauf.departureDate)
    : null
  return {
    art: 'lauf',
    schluessel: lauf.schluessel,
    stageId: lauf.stageId,
    name: lauf.name,
    lesart: lauf.lesart,
    land: landText(lauf),
    untertitel: lauf.lesart === 'ziel' ? null : laufUntertitel(lauf),
    geplanteTage: geplanteTageText(lauf.tage, lauf.lesart === 'ziel' ? 'aufenthalt' : 'kalender'),
    gespeicherterZeitraum: gespeichert ? `Gespeicherter Etappenzeitraum: ${gespeichert}` : null,
    tagIds: lauf.tage.map((tag) => tag.id),
  }
}

export function routeModell(reise: Trip): { gueltig: boolean; zeilen: RouteZeile[] } {
  const chronologie = chronologischeLaeufe(reise)
  if (!chronologie.gueltig) return { gueltig: false, zeilen: [] }
  const kanten = mobilitaetsAbdeckung(reise, reise.ohneTag).kanten
  const laeufe = chronologie.laeufe
  const kanditaten: RouteKanteZeile[] = []
  for (let index = 0; index < laeufe.length - 1; index += 1) {
    const links = laeufe[index]
    const rechts = laeufe[index + 1]
    if (!links || !rechts) continue
    if (links.lesart !== 'ziel' || rechts.lesart !== 'ziel') continue
    if (!links.stageId || !rechts.stageId || links.stageId === rechts.stageId) continue
    const kanteId = `connection:${links.stageId}:${rechts.stageId}`
    const kante = kanten.find((eintrag) => eintrag.art === 'connection' && eintrag.id === kanteId)
    if (!kante) continue
    const linksZeile = laufZeile(links)
    const rechtsZeile = laufZeile(rechts)
    kanditaten.push({
      art: 'kante',
      occurrenceKey: `${links.schluessel}=>${rechts.schluessel}`,
      kanteId,
      vonSchluessel: links.schluessel,
      nachSchluessel: rechts.schluessel,
      rueckTagId: rechtsZeile.tagIds[0] ?? linksZeile.tagIds[0] ?? '',
      tagIds: [...linksZeile.tagIds, ...rechtsZeile.tagIds],
      titel: `${kante.originName} → ${kante.destinationName}`,
      waehlbar: true,
      mehrdeutig: false,
      datumText: kanteDatumText(kante),
      dauerText: kanteDauerText(kante),
      planText: kantePlanText(kante),
    })
  }
  const anzahl = new Map<string, number>()
  for (const kante of kanditaten) anzahl.set(kante.kanteId, (anzahl.get(kante.kanteId) ?? 0) + 1)
  for (const kante of kanditaten) {
    if ((anzahl.get(kante.kanteId) ?? 0) > 1) {
      kante.waehlbar = false
      kante.mehrdeutig = true
    }
  }
  const zeilen: RouteZeile[] = []
  for (let index = 0; index < laeufe.length; index += 1) {
    const lauf = laeufe[index]
    if (!lauf) continue
    zeilen.push(laufZeile(lauf))
    for (const kante of kanditaten) {
      if (kante.vonSchluessel === lauf.schluessel) zeilen.push(kante)
    }
  }
  return { gueltig: true, zeilen }
}

export function kanteAufloesen(zeilen: readonly RouteZeile[], kanteId: string | null | undefined): KanteAufloesung {
  if (!kanteId) return { art: 'keine' }
  const treffer = zeilen.filter((zeile): zeile is RouteKanteZeile => zeile.art === 'kante' && zeile.kanteId === kanteId)
  if (treffer.length > 1 || treffer.some((zeile) => zeile.mehrdeutig)) return { art: 'mehrdeutig' }
  const einzige = treffer[0]
  if (einzige?.waehlbar) return { art: 'eindeutig', occurrenceKey: einzige.occurrenceKey, zeile: einzige }
  return { art: 'nicht-verfuegbar' }
}

export function backToTopEntscheidung(fixedBottomNav: boolean, offsetPx: number | null): 'standard' | 'frei' | 'verborgen' {
  if (!fixedBottomNav) return 'standard'
  if (offsetPx == null || !(offsetPx > 0)) return 'verborgen'
  return 'frei'
}

/** Inline bottom only outside the released shell. Inside `.workspace-page` the shell CSS is the only spacing owner. */
export function backToTopInlineAbstand(
  imWorkspace: boolean,
  lage: 'standard' | 'frei' | 'verborgen',
  offsetPx: number | null,
): string | undefined {
  if (imWorkspace || lage !== 'frei' || offsetPx == null || !(offsetPx > 0)) return undefined
  return `calc(${offsetPx}px + 0.75rem)`
}
