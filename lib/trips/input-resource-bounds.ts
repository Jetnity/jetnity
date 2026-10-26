// lib/trips/input-resource-bounds.ts
//
// Längenprüfung vor dem ersten Zod-Lauf der Create- und Import-Eingänge.
//
// Zod 3.25.76 wertet Array-Elemente aus, bevor `max` die Sammlung ablehnt.
// Diese Prüfung liest deshalb zuerst Längen bekannter Sammlungen und öffnet
// Einträge erst, wenn die Summe unter der kanonischen Planpunktgrenze liegt.
// Sie kürzt nichts, repariert keine Verweise und ersetzt die semantische
// Schema-Prüfung nicht. Es gibt keine Aussage, Zod sei damit überall behoben.

import { GRENZEN } from '@/lib/trips/schema'
import { TRIP_INTERESTS } from '@/types/trips'

/** Dieselbe Obergrenze wie `flugRouteItinerarySchema`: höchstens 6 Legs. */
export const ROUTE_LEGS_MAXIMUM = 6
/** Höchstens 8 Segmente je Leg, ebenfalls wie die Route-Prüfung. */
export const ROUTE_SEGMENTE_MAXIMUM = 8

export const INTERESSEN_EINGABE_MAXIMUM = TRIP_INTERESTS.length * 2

const TAGE = `Eine Reise trägt höchstens ${GRENZEN.reisetageJeReise} Tage.`
const ZIELE = `Eine Reise trägt höchstens ${GRENZEN.etappenJeReise} Reiseziele.`
const PUNKTE = `Eine Reise trägt höchstens ${GRENZEN.punkteJeReise} Planpunkte.`
const INTERESSEN = `Höchstens ${INTERESSEN_EINGABE_MAXIMUM} Interessen sind möglich.`
const ANSPRUECHE = `Die Tageszuordnung umfasst höchstens ${GRENZEN.etappenJeReise} Ansprüche.`
const ROUTE = `Eine Route umfasst höchstens ${ROUTE_LEGS_MAXIMUM} Teilstrecken mit je höchstens ${ROUTE_SEGMENTE_MAXIMUM} Abschnitten.`
const BEHAELTER = 'Die Eingabe enthält einen ungültigen Behälter.'

export type EingabeGrenze = { ok: true } | { ok: false; meldung: string }

type Sammlung =
  | { art: 'fehlt' }
  | { art: 'kaputt' }
  | { art: 'liste'; werte: readonly unknown[]; laenge: number }

function sammlung(wert: unknown): Sammlung {
  if (wert == null) return { art: 'fehlt' }
  if (!Array.isArray(wert)) return { art: 'kaputt' }
  return { art: 'liste', werte: wert, laenge: wert.length }
}

function abgelehnt(meldung: string): EingabeGrenze {
  return { ok: false, meldung }
}

function laengePruefen(wert: unknown, maximum: number, meldung: string): EingabeGrenze | Sammlung {
  const liste = sammlung(wert)
  if (liste.art === 'kaputt') return abgelehnt(BEHAELTER)
  if (liste.art === 'liste' && liste.laenge > maximum) return abgelehnt(meldung)
  return liste
}

function routePruefen(eintrag: unknown): string | null {
  if (eintrag == null || typeof eintrag !== 'object' || Array.isArray(eintrag)) return BEHAELTER
  if (!Object.prototype.hasOwnProperty.call(eintrag, 'route_itinerary')) return null
  const route = (eintrag as { route_itinerary?: unknown }).route_itinerary
  if (route == null) return null
  if (typeof route !== 'object' || Array.isArray(route)) return BEHAELTER
  if (!Object.prototype.hasOwnProperty.call(route, 'legs')) return null
  const legs = sammlung((route as { legs?: unknown }).legs)
  if (legs.art !== 'liste') return BEHAELTER
  if (legs.laenge > ROUTE_LEGS_MAXIMUM) return ROUTE
  for (let index = 0; index < legs.laenge; index += 1) {
    const leg = legs.werte[index]
    if (leg == null || typeof leg !== 'object' || Array.isArray(leg)) return BEHAELTER
    if (!Object.prototype.hasOwnProperty.call(leg, 'segments')) return BEHAELTER
    const segments = sammlung((leg as { segments?: unknown }).segments)
    if (segments.art !== 'liste') return BEHAELTER
    if (segments.laenge > ROUTE_SEGMENTE_MAXIMUM) return ROUTE
  }
  return null
}

/**
 * Bekannte Create-/Import-Sammlungen vor dem ersten `safeParse`.
 *
 * Zuerst Top-Level-Längen, dann die Summe der Tages-`items.length` plus
 * ungeplante Punkte. Überlauf kehrt zurück, bevor Eintragsinhalte gelesen
 * werden. Danach werden höchstens 1000 Einträge auf vorhandene
 * `route_itinerary`-Sammlungen geprüft, auch bei Nicht-Flug-Punkten.
 */
export function rohEingabeBegrenzen(eingabe: unknown): EingabeGrenze {
  if (eingabe == null || typeof eingabe !== 'object' || Array.isArray(eingabe)) {
    return abgelehnt(BEHAELTER)
  }
  const record = eingabe as Record<string, unknown>

  const stages = laengePruefen(record.stages, GRENZEN.etappenJeReise, ZIELE)
  if (!('art' in stages)) return stages
  const days = laengePruefen(record.days, GRENZEN.reisetageJeReise, TAGE)
  if (!('art' in days)) return days
  const ungeplante = laengePruefen(record.ungeplante, GRENZEN.punkteJeReise, PUNKTE)
  if (!('art' in ungeplante)) return ungeplante
  const weitere = laengePruefen(record.weitereDestinationPlaceIds, GRENZEN.etappenJeReise - 1, ZIELE)
  if (!('art' in weitere)) return weitere
  const interests = laengePruefen(record.interests, INTERESSEN_EINGABE_MAXIMUM, INTERESSEN)
  if (!('art' in interests)) return interests

  if (Object.prototype.hasOwnProperty.call(record, 'dayAllocation') && record.dayAllocation != null) {
    const allocation = record.dayAllocation
    if (typeof allocation !== 'object' || Array.isArray(allocation)) return abgelehnt(BEHAELTER)
    const claims = laengePruefen(
      (allocation as { claims?: unknown }).claims,
      GRENZEN.etappenJeReise,
      ANSPRUECHE,
    )
    if (!('art' in claims)) return claims
  }

  // Die Summe zählt nur Längen. `days.length` ist bereits auf 366 begrenzt.
  let summe = ungeplante.art === 'liste' ? ungeplante.laenge : 0
  if (summe > GRENZEN.punkteJeReise) return abgelehnt(PUNKTE)
  if (days.art === 'liste') {
    for (let index = 0; index < days.laenge; index += 1) {
      const tag = days.werte[index]
      if (tag == null || typeof tag !== 'object' || Array.isArray(tag)) return abgelehnt(BEHAELTER)
      const items = sammlung((tag as { items?: unknown }).items)
      if (items.art === 'kaputt') return abgelehnt(BEHAELTER)
      const anzahl = items.art === 'liste' ? items.laenge : 0
      if (anzahl > GRENZEN.punkteJeReise || summe + anzahl > GRENZEN.punkteJeReise) {
        return abgelehnt(PUNKTE)
      }
      summe += anzahl
    }
  }

  let gesehen = 0
  const besuchen = (liste: readonly unknown[]): string | null => {
    for (let index = 0; index < liste.length; index += 1) {
      gesehen += 1
      if (gesehen > GRENZEN.punkteJeReise) return PUNKTE
      const meldung = routePruefen(liste[index])
      if (meldung) return meldung
    }
    return null
  }

  if (days.art === 'liste') {
    for (let index = 0; index < days.laenge; index += 1) {
      const tag = days.werte[index]
      if (tag == null || typeof tag !== 'object' || Array.isArray(tag)) return abgelehnt(BEHAELTER)
      const items = sammlung((tag as { items?: unknown }).items)
      if (items.art === 'fehlt') continue
      if (items.art === 'kaputt') return abgelehnt(BEHAELTER)
      const meldung = besuchen(items.werte)
      if (meldung) return abgelehnt(meldung)
    }
  }
  if (ungeplante.art === 'liste') {
    const meldung = besuchen(ungeplante.werte)
    if (meldung) return abgelehnt(meldung)
  }

  return { ok: true }
}
