// lib/trips/arbeitsbereich.ts
//
// Mobile Informationsarchitektur des Reise-Arbeitsbereichs.
//
// Die Reise selbst bleibt `Trip`. Hier steht nur, was die Oberfläche aus dem
// vorhandenen Graphen ableiten darf: welcher Bereich offen ist, welcher Tag
// gewählt ist, und welche Statuszeilen ehrlich sind. Keine Providerzustände,
// keine erfundenen Flüge, Hotels oder Aktivitäten.

import type { Trip, TripItem, TripItemKind } from '@/types/trips'

export const ARBEITSBEREICHE = [
  'uebersicht',
  'plan',
  'fluege',
  'unterkunft',
  'aktivitaeten',
] as const

export type Arbeitsbereich = (typeof ARBEITSBEREICHE)[number]

export const STANDARD_ARBEITSBEREICH: Arbeitsbereich = 'uebersicht'

export const ARBEITSBEREICH_BEZEICHNUNG: Record<Arbeitsbereich, string> = {
  uebersicht: 'Übersicht',
  plan: 'Plan',
  fluege: 'Flüge',
  unterkunft: 'Unterkunft',
  aktivitaeten: 'Aktivitäten',
}

/** Unterhalb dieser Breite gilt die kompakte Mobile-/Tablet-Ansicht. */
export const ARBEITSBEREICH_DESKTOP_AB_PX = 1024

export type BereichStatus = {
  bereich: Exclude<Arbeitsbereich, 'uebersicht'>
  anzahl: number
  text: string
}

export function istArbeitsbereich(wert: string): wert is Arbeitsbereich {
  return (ARBEITSBEREICHE as readonly string[]).includes(wert)
}

export function arbeitsbereichLesen(wert: string | null | undefined): Arbeitsbereich {
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
 * Kompakte Statuszeilen der Übersicht.
 *
 * Zählt nur, was im Reisegraphen liegt. Eine deaktivierte Suche oder ein
 * fehlender Provider ist kein Reisetatbestand und erscheint hier nicht.
 */
export function bereichStatus(reise: Trip, ohneTag: readonly TripItem[] = []): BereichStatus[] {
  const punkte = planpunkteSammeln(reise, ohneTag)
  const ungeplant = ohneTag.length
  const planText =
    punkte.length === 0
      ? 'Noch keine Punkte geplant'
      : ungeplant > 0
        ? `${anzahlText(punkte.length, 'Punkt geplant', 'Punkte geplant', '')}, davon ${anzahlText(
            ungeplant,
            'noch nicht eingeplant',
            'noch nicht eingeplant',
            '',
          )}`
        : anzahlText(punkte.length, 'Punkt geplant', 'Punkte geplant', 'Noch keine Punkte geplant')

  return [
    { bereich: 'plan', anzahl: punkte.length, text: planText },
    {
      bereich: 'fluege',
      anzahl: anzahlVon(punkte, 'flight'),
      text: anzahlText(anzahlVon(punkte, 'flight'), 'Flug ausgewählt', 'Flüge ausgewählt', 'Noch kein Flug ausgewählt'),
    },
    {
      bereich: 'unterkunft',
      anzahl: anzahlVon(punkte, 'stay'),
      text: anzahlText(
        anzahlVon(punkte, 'stay'),
        'Unterkunft ausgewählt',
        'Unterkünfte ausgewählt',
        'Noch keine Unterkunft ausgewählt',
      ),
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
 * Kommerzielle Suchbereiche werden auf Mobile erst beim ersten Besuch
 * eingehängt. So startet die Übersicht keine Hotel- oder Aktivitätsanfrage.
 * Ein einmal besuchter Bereich bleibt eingehängt, damit ein Tabwechsel keine
 * neue Suche auslöst.
 *
 * Plan und Übersicht haben keine Suche und dürfen immer da sein.
 */
export function bereichSollMounten(
  bereich: Arbeitsbereich,
  aktiv: Arbeitsbereich,
  bereitsBesucht: ReadonlySet<Arbeitsbereich>,
  kompakt: boolean,
): boolean {
  if (!kompakt) return bereich !== 'uebersicht'
  if (bereich === 'uebersicht' || bereich === 'plan') return true
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

export function besuchteBereicheErweitern(
  bisher: ReadonlySet<Arbeitsbereich>,
  naechster: Arbeitsbereich,
): ReadonlySet<Arbeitsbereich> {
  if (bisher.has(naechster)) return bisher
  return new Set([...bisher, naechster])
}
