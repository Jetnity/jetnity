// lib/trips/arbeitsbereich.ts
//
// Mobile Informationsarchitektur des Reise-Arbeitsbereichs.
//
// Die Reise selbst bleibt `Trip`. Hier steht nur, was die Oberfläche aus dem
// vorhandenen Graphen ableiten darf: welcher Bereich offen ist, welcher Tag
// gewählt ist, und welche Statuszeilen ehrlich sind. Keine Providerzustände,
// keine erfundenen Flüge, Hotels oder Aktivitäten.
//
// Sichtbare Mobile-Hauptbereiche: Übersicht, Flüge, Unterkunft, Aktivitäten
// und Mobilität. Der Tagesplan gehört zur Übersicht, nicht zu einem eigenen
// Tab. Ein historischer Wert `plan` fällt auf die Übersicht.

import { mobilitaetsAbdeckung } from '@/lib/mobility/kanten'
import { mietwagenBestand } from '@/lib/rental-cars/bestand'
import { routeFactsAusGraph } from '@/lib/route/ableitung'
import { routeKompaktOhneCode } from '@/lib/route/anzeige'
import { flugAbdeckung } from '@/lib/trips/flug-abdeckung'
import { unterkunftAbdeckung } from '@/lib/trips/naechte-abdeckung'
import type { Trip, TripItem, TripItemKind } from '@/types/trips'

export const ARBEITSBEREICHE = [
  'uebersicht',
  'fluege',
  'unterkunft',
  'aktivitaeten',
  'mobilitaet',
] as const

export type Arbeitsbereich = (typeof ARBEITSBEREICHE)[number]

export const STANDARD_ARBEITSBEREICH: Arbeitsbereich = 'uebersicht'

export const ARBEITSBEREICH_BEZEICHNUNG: Record<Arbeitsbereich, string> = {
  uebersicht: 'Übersicht',
  fluege: 'Flüge',
  unterkunft: 'Unterkunft',
  aktivitaeten: 'Aktivitäten',
  mobilitaet: 'Mobilität',
}

/** Unterhalb dieser Breite gilt die kompakte Mobile-/Tablet-Ansicht. */
export const ARBEITSBEREICH_DESKTOP_AB_PX = 1024

export type BereichStatus = {
  bereich: Exclude<Arbeitsbereich, 'uebersicht'>
  anzahl: number
  text: string
}

export type PlanStatus = {
  anzahl: number
  text: string
}

export function istArbeitsbereich(wert: string): wert is Arbeitsbereich {
  return (ARBEITSBEREICHE as readonly string[]).includes(wert)
}

/**
 * Liest einen Bereich. Unbekannte Werte und der frühere Mobile-Tab `plan`
 * fallen auf die Übersicht – `plan` ist kein erreichbarer Bereich mehr.
 */
export function arbeitsbereichLesen(wert: string | null | undefined): Arbeitsbereich {
  if (wert === 'plan') return STANDARD_ARBEITSBEREICH
  return wert && istArbeitsbereich(wert) ? wert : STANDARD_ARBEITSBEREICH
}

/** Alle Planpunkte der Reise, einschließlich noch nicht eingeplanter. */
export function planpunkteSammeln(reise: Trip, ohneTag: readonly TripItem[] = []): TripItem[] {
  return [...reise.days.flatMap((tag) => tag.items), ...ohneTag]
}

function anzahlVon(punkte: readonly TripItem[], art: TripItemKind): number {
  return punkte.filter((punkt) => punkt.kind === art).length
}

function anzahlText(anzahl: number, singular: string, plural: string, leer: string): string {
  if (anzahl === 0) return leer
  return `${anzahl} ${anzahl === 1 ? singular : plural}`
}

/**
 * Einleitung des eingebetteten Tagesplans.
 *
 * Zählt denselben Graphen wie die Übersicht. Kein Link in einen eigenen Bereich.
 */
export function planStatus(reise: Trip, ohneTag: readonly TripItem[] = []): PlanStatus {
  const punkte = planpunkteSammeln(reise, ohneTag)
  const ungeplant = ohneTag.length
  const text =
    punkte.length === 0
      ? '0 Punkte geplant'
      : ungeplant > 0
        ? `${anzahlText(punkte.length, 'Punkt geplant', 'Punkte geplant', '')}, davon ${anzahlText(
            ungeplant,
            'noch nicht eingeplant',
            'noch nicht eingeplant',
            '',
          )}`
        : anzahlText(punkte.length, 'Punkt geplant', 'Punkte geplant', '0 Punkte geplant')

  return { anzahl: punkte.length, text }
}

/**
 * Kompakte Statuszeilen der Übersicht für die übrigen Hauptbereiche.
 *
 * Der Planstatus gehört nicht hierher: er leitet den eingebetteten Tagesplan
 * ein und darf keinen Bereichswechsel auslösen.
 */
export function bereichStatus(reise: Trip, ohneTag: readonly TripItem[] = []): BereichStatus[] {
  const punkte = planpunkteSammeln(reise, ohneTag)
  const fluege = flugAbdeckung(reise, ohneTag)
  const route = routeFactsAusGraph({ days: reise.days, ohneTag: [...ohneTag, ...reise.ohneTag] })
  const routeText = routeKompaktOhneCode(route)
  const fluegeText = routeText ? `${routeText} · ${fluege.zusammenfassung}` : fluege.zusammenfassung
  const unterkunft = unterkunftAbdeckung(reise, ohneTag)
  const mobilitaet = mobilitaetsAbdeckung(reise, ohneTag)
  const mietwagen = mietwagenBestand(reise, ohneTag)
  const verbindungsAnzahl = anzahlVon(punkte, 'transfer')
  const mietwagenAnzahl = anzahlVon(punkte, 'rental_car')
  const mobilitaetText = mietwagen.uebersicht
    ? `${mobilitaet.zusammenfassung} · ${mietwagen.uebersicht}`
    : mobilitaet.zusammenfassung

  return [
    {
      bereich: 'fluege',
      anzahl: anzahlVon(punkte, 'flight'),
      text: fluegeText,
    },
    {
      bereich: 'unterkunft',
      anzahl: anzahlVon(punkte, 'stay'),
      text: unterkunft.zusammenfassung,
    },
    {
      bereich: 'aktivitaeten',
      anzahl: anzahlVon(punkte, 'activity'),
      text: anzahlText(
        anzahlVon(punkte, 'activity'),
        'Aktivität geplant',
        'Aktivitäten geplant',
        'Noch keine Aktivität geplant',
      ),
    },
    {
      bereich: 'mobilitaet',
      anzahl: verbindungsAnzahl + mietwagenAnzahl,
      text: mobilitaetText,
    },
  ]
}

/**
 * Hält die Tagesauswahl, solange der Tag noch zur Reise gehört.
 * Sonst der erste Tag – dieselbe Regel wie bisher im Arbeitsbereich.
 */
export function gewaehlterTagId(reise: Pick<Trip, 'days'>, bisher: string): string {
  return reise.days.some((tag) => tag.id === bisher) ? bisher : (reise.days[0]?.id ?? '')
}

export function aenderungIstSichtbar(kompakt: boolean, offen: boolean): boolean {
  return !kompakt || offen
}

/**
 * Der Tagesplan liegt auf Mobile in der Übersicht und auf Desktop in der
 * bisherigen breiten Arbeitsansicht. Er ist kein eigener Hauptbereich.
 */
export function tagesplanIstSichtbar(aktiv: Arbeitsbereich, kompakt: boolean): boolean {
  return !kompakt || aktiv === 'uebersicht'
}

/**
 * Kommerzielle Suchbereiche werden auf Mobile erst beim ersten Besuch
 * eingehängt. So startet die Übersicht keine Hotel- oder Aktivitätsanfrage.
 * Ein einmal besuchter Bereich bleibt eingehängt, damit ein Tabwechsel keine
 * neue Suche auslöst.
 *
 * Übersicht und der darin liegende Tagesplan haben keine Suche und dürfen
 * immer da sein.
 */
export function bereichSollMounten(
  bereich: Arbeitsbereich,
  aktiv: Arbeitsbereich,
  bereitsBesucht: ReadonlySet<Arbeitsbereich>,
  kompakt: boolean,
): boolean {
  if (!kompakt) return bereich !== 'uebersicht'
  if (bereich === 'uebersicht') return true
  return bereich === aktiv || bereitsBesucht.has(bereich)
}

export function bereichSollSichtbar(
  bereich: Arbeitsbereich,
  aktiv: Arbeitsbereich,
  kompakt: boolean,
): boolean {
  if (!kompakt) return bereich !== 'uebersicht'
  return bereich === aktiv
}

/**
 * Display-Klasse eines gemounteten Hauptbereichs.
 *
 * Tailwind-Utilities wie `grid` überschreiben Preflight `[hidden] { display: none }`.
 * Ein verborgener Bereich darf deshalb nur `hidden` tragen, niemals zusätzlich
 * `grid`, `flex` oder `block`.
 */
export function bereichDarstellungKlasse(verborgen: boolean, sichtbarKlasse = ''): string {
  return verborgen ? 'hidden' : sichtbarKlasse
}

export function besuchteBereicheErweitern(
  bisher: ReadonlySet<Arbeitsbereich>,
  naechster: Arbeitsbereich,
): ReadonlySet<Arbeitsbereich> {
  if (bisher.has(naechster)) return bisher
  return new Set([...bisher, naechster])
}
