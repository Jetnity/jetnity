// Suchentwurf für die vorhandene Stay22-Hotelsuche.
// Keine neue Reise-, Alters- oder Zimmerwahrheit und kein zweiter Suchpfad.
// `travellers` bleibt eine Kopfzahl. `party` hat kein Geburtsdatum.

import { tageUtc } from '@/lib/activities/zeit'
import { hotelZeitraumAusEtappe } from '@/lib/hotels/reisegraph'
import { gespeicherteEtappeAnzeigen } from '@/lib/places/titel-name'
import { etappenZeitraumAnzeigen } from '@/lib/trips/datum-anzeige'
import type { Trip, TripStage } from '@/types/trips'

export const HOTEL_ERWACHSENE_MAX = 9
export const HOTEL_KINDER_MAX = 8
export const HOTEL_ZIMMER_MAX = 8

export const HOTEL_BELEGUNG_FEHLT =
  'Bitte lege Erwachsene, Kinder und Zimmer fest. Die Anzahl Reisender ist kein Altersnachweis.'
export const HOTEL_BELEGUNG_UNGUELTIG =
  'Bitte prüfe Erwachsene, Kinder und Zimmer. Die Suche unterstützt bis zu neun Erwachsene. Pro Zimmer wird mindestens ein Erwachsener benötigt.'
export const HOTEL_HINWEIS_ALTER =
  'Kinderalter überträgt diese Suche nicht. Bitte beim Anbieter bestätigen.'
export const HOTEL_HINWEIS_ZIMMER =
  'Die Aufteilung auf einzelne Zimmer überträgt diese Suche nicht. Bitte beim Anbieter bestätigen.'
export const HOTEL_HINWEIS_BEIDES =
  'Kinderalter und die Aufteilung auf einzelne Zimmer überträgt diese Suche nicht. Bitte beim Anbieter bestätigen.'
export const HOTEL_HINWEIS_SUCHE =
  'Diese Belegung gilt nur für die Suche. Sie ist nicht aus dem Alter der Reisegruppe abgeleitet.'

export type HotelTerminHerkunft = 'etappe' | 'einzelreise' | 'unvollstaendig' | 'ungueltig' | 'offen'

export type HotelSuchtermine = {
  anreise: string
  abreise: string
  herkunft: HotelTerminHerkunft
}

export type HotelBelegungsfelder = {
  erwachsene: number | null
  kinder: number | null
  zimmer: number | null
}

export type HotelSuchvorlage = HotelSuchtermine & HotelBelegungsfelder & {
  reisende: number | null
}

type ReiseFuerTermine = Pick<Trip, 'startDate' | 'endDate' | 'stages'>
type EtappeFuerTermine = Pick<TripStage, 'arrivalDate' | 'departureDate'>

function kalender(wert: string | null | undefined): string {
  return wert && tageUtc(wert) !== null ? wert : ''
}

/** Kopfzahl der Reise. Kein Erwachsenenbeleg und keine Party-Ableitung. */
export function hotelKopfzahl(travellers: number): number | null {
  return Number.isInteger(travellers) && travellers > 0 ? travellers : null
}

/**
 * Check-in und Check-out nur aus `hotelZeitraumAusEtappe`.
 * Mehrere Etappen erhalten nie den ganzen Reisezeitraum.
 * Eine unvollständige eigene Grenze bleibt sichtbar; eine ungültige Spanne nicht.
 */
export function hotelSuchtermine(reise: ReiseFuerTermine, etappe?: EtappeFuerTermine): HotelSuchtermine {
  if (!etappe) return { anreise: '', abreise: '', herkunft: 'offen' }
  const zeitraum = hotelZeitraumAusEtappe(reise, etappe)
  if (zeitraum) {
    const eigene = etappe.arrivalDate === zeitraum.checkIn && etappe.departureDate === zeitraum.checkOut
    return {
      anreise: zeitraum.checkIn,
      abreise: zeitraum.checkOut,
      herkunft: eigene ? 'etappe' : 'einzelreise',
    }
  }
  const anreise = kalender(etappe.arrivalDate)
  const abreise = kalender(etappe.departureDate)
  if (anreise && abreise) return { anreise: '', abreise: '', herkunft: 'ungueltig' }
  if (anreise || abreise) return { anreise, abreise, herkunft: 'unvollstaendig' }
  return { anreise: '', abreise: '', herkunft: 'offen' }
}

export function hotelTerminHinweis(herkunft: HotelTerminHerkunft): string {
  switch (herkunft) {
    case 'etappe':
      return 'Aufenthaltsdaten aus dieser Etappe.'
    case 'einzelreise':
      return 'Aufenthaltsdaten aus deiner Reise. Diese Reise hat eine Etappe.'
    case 'unvollstaendig':
      return 'Für diese Etappe fehlt An- oder Abreise. Der übrige Reisezeitraum wird nicht eingesetzt.'
    case 'ungueltig':
      return 'Die Aufenthaltsdaten dieser Etappe passen nicht zum Reisezeitraum. Bitte prüfe An- und Abreise.'
    case 'offen':
      return 'Ergänze die Aufenthaltsdaten für diese Etappe.'
  }
}

/** Gleiche Zielnamen bleiben in der Auswahl unterscheidbar, ohne eine zweite Suche. */
export function hotelEtappenName(reise: ReiseFuerTermine, etappe: TripStage): string {
  const name = etappe.name.trim().toLocaleLowerCase('de')
  const wiederholt = reise.stages.filter((s) => s.name.trim().toLocaleLowerCase('de') === name).length > 1
  const termine = hotelSuchtermine(reise, etappe)
  const zeit = etappenZeitraumAnzeigen(termine.anreise, termine.abreise)
  const sichtbar = gespeicherteEtappeAnzeigen(etappe)
  const basis = wiederholt ? `${etappe.position}. ${sichtbar}` : sichtbar
  return zeit ? `${basis} · ${zeit}` : basis
}

/**
 * Vorbelegung der Suche. Erwachsene, Kinder und Zimmer bleiben offen:
 * weder `travellers` noch `party` belegen ein Alter oder eine Zimmeraufteilung.
 */
export function hotelSuchvorlage(
  reise: ReiseFuerTermine & Pick<Trip, 'travellers' | 'party'>,
  etappe?: EtappeFuerTermine,
): HotelSuchvorlage {
  return {
    ...hotelSuchtermine(reise, etappe),
    erwachsene: null,
    kinder: null,
    zimmer: null,
    reisende: hotelKopfzahl(reise.travellers),
  }
}

export function hotelBelegungZurueck(): HotelBelegungsfelder {
  return { erwachsene: null, kinder: null, zimmer: null }
}

export function hotelBelegungZahl(wert: string): number | null {
  if (wert === '') return null
  const zahl = Number(wert)
  return Number.isInteger(zahl) ? zahl : null
}

/** Nutzerwahl übernehmen. Ein Zimmer über der Erwachsenenzahl wird auf diese begrenzt. */
export function hotelBelegungSetzen(
  aktuell: HotelBelegungsfelder,
  patch: Partial<HotelBelegungsfelder>,
): HotelBelegungsfelder {
  const erwachsene = patch.erwachsene !== undefined ? patch.erwachsene : aktuell.erwachsene
  const kinder = patch.kinder !== undefined ? patch.kinder : aktuell.kinder
  let zimmer = patch.zimmer !== undefined ? patch.zimmer : aktuell.zimmer
  if (erwachsene !== null && zimmer !== null && zimmer > Math.min(HOTEL_ZIMMER_MAX, erwachsene)) {
    zimmer = Math.min(HOTEL_ZIMMER_MAX, erwachsene)
  }
  return { erwachsene, kinder, zimmer }
}

function hotelBelegungVollstaendig(
  wert: HotelBelegungsfelder,
): wert is { erwachsene: number; kinder: number; zimmer: number } {
  return wert.erwachsene !== null && wert.kinder !== null && wert.zimmer !== null
}

export function hotelAnbieterHinweis(wert: { kinder: number; zimmer: number }): string | null {
  if (wert.kinder > 0 && wert.zimmer > 1) return HOTEL_HINWEIS_BEIDES
  if (wert.kinder > 0) return HOTEL_HINWEIS_ALTER
  if (wert.zimmer > 1) return HOTEL_HINWEIS_ZIMMER
  return null
}

function hotelReisegruppeText(reisende: number | null): string {
  if (reisende === null) return 'Reisegruppe ohne belegte Personenzahl.'
  if (reisende === 1) return 'Reisegruppe: 1 Person.'
  return `Reisegruppe: ${reisende} Personen.`
}

export function hotelBelegungHinweis(reisende: number | null, belegung: HotelBelegungsfelder): string {
  if (!hotelBelegungVollstaendig(belegung)) {
    const grenze = reisende !== null && reisende > 9
      ? ' Die Suche unterstützt bis zu neun Erwachsene. Bitte teile die Gruppe.'
      : ''
    return `${hotelReisegruppeText(reisende)} Alter und Zimmer sind nicht belegt. Bitte lege Erwachsene, Kinder und Zimmer für diese Suche fest.${grenze}`
  }
  // The trip's headcount is not an adult/child allocation. A hotel search
  // may intentionally cover a subset, so disagreement is advisory, not a gate.
  const suchGaeste = belegung.erwachsene + belegung.kinder
  const abweichung = reisende !== null && suchGaeste !== reisende
    ? `Deine Reisegruppe umfasst ${reisende} ${reisende === 1 ? 'Person' : 'Personen'}, diese Hotelsuche ${suchGaeste} ${suchGaeste === 1 ? 'Person' : 'Personen'}. Das kann beabsichtigt sein, wenn nur ein Teil deiner Reisegruppe hier übernachtet. Bitte prüfe die Belegung.`
    : null
  const anbieterHinweis = hotelAnbieterHinweis(belegung) ?? HOTEL_HINWEIS_SUCHE
  return abweichung ? `${abweichung} ${anbieterHinweis}` : anbieterHinweis
}

export function hotelGaesteText(reisende: number | null, belegung: HotelBelegungsfelder): string {
  if (!hotelBelegungVollstaendig(belegung)) {
    if (reisende === null) return 'Belegung offen'
    return `${reisende} ${reisende === 1 ? 'Person' : 'Personen'} · Belegung offen`
  }
  const erwachsen = belegung.erwachsene === 1 ? '1 Erwachsener' : `${belegung.erwachsene} Erwachsene`
  const kind = belegung.kinder === 0 ? '' : belegung.kinder === 1 ? ', 1 Kind' : `, ${belegung.kinder} Kinder`
  return `${erwachsen}${kind}`
}

export function hotelBelegungPruefen(wert: HotelBelegungsfelder):
  | { ok: true; erwachsene: number; kinder: number; zimmer: number; anbieterHinweis: string | null }
  | { ok: false; fehler: string } {
  if (!hotelBelegungVollstaendig(wert)) return { ok: false, fehler: HOTEL_BELEGUNG_FEHLT }
  const { erwachsene, kinder, zimmer } = wert
  if (
    !Number.isInteger(erwachsene) || erwachsene < 1 || erwachsene > HOTEL_ERWACHSENE_MAX ||
    !Number.isInteger(kinder) || kinder < 0 || kinder > HOTEL_KINDER_MAX ||
    !Number.isInteger(zimmer) || zimmer < 1 || zimmer > Math.min(HOTEL_ZIMMER_MAX, erwachsene)
  ) {
    return { ok: false, fehler: HOTEL_BELEGUNG_UNGUELTIG }
  }
  return { ok: true, erwachsene, kinder, zimmer, anbieterHinweis: hotelAnbieterHinweis(wert) }
}

/** Entwurf einer Etappe. Ein Wechsel liest nie den Entwurf einer anderen Etappe. */
export function hotelEtappenEntwurf<T>(entwuerfe: Readonly<Record<string, T>>, stageId: string, vorlage: T): T {
  return entwuerfe[stageId] ?? vorlage
}

export function hotelEtappenMerken<T>(
  entwuerfe: Readonly<Record<string, T>>,
  stageId: string,
  vorlage: T,
  patch: Partial<T>,
): Record<string, T> {
  return { ...entwuerfe, [stageId]: { ...hotelEtappenEntwurf(entwuerfe, stageId, vorlage), ...patch } }
}
