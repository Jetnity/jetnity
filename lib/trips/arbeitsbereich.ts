// lib/trips/arbeitsbereich.ts
//
// Informationsarchitektur des Reise-Arbeitsbereichs. Dieselbe Produktlogik
// gilt auf allen Geräten; Desktop darf mehr Fläche nutzen, aber keine zweite
// IA besitzen (ADR-0163 / TW-1).
//
// Die Reise selbst bleibt `Trip`. Hier steht nur, was die Oberfläche aus dem
// vorhandenen Graphen ableiten darf: welcher Bereich offen ist, welcher Tag
// gewählt ist, und welche Statuszeilen ehrlich sind. Keine Providerzustände,
// keine erfundenen Flüge, Hotels oder Aktivitäten.
//
// Coverage-Domains bleiben intern: Flüge, Unterkunft, Aktivitäten, Mobilität.
// Sie sind seit TW-5 keine gleichrangige Hauptnavigation mehr. Der Tagesplan
// gehört zur Reiseoberfläche. Ein historischer Wert `plan` fällt auf die Übersicht.

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

/**
 * Maschinenlesbare Presentation-Lage der bestehenden Fachableitungen.
 *
 * `belegt` bedeutet bei deterministisch prüfbarer Coverage: keine bekannte
 * Lücke. Bei Aktivitäten gibt es keine kanonische Soll-Anzahl; dort bedeutet
 * es nur, dass mindestens eine Aktivität im Reisegraphen vorhanden ist.
 * `teilweise` bleibt ausdrücklich von `belegt` getrennt.
 */
export type BereichLage = 'offen' | 'teilweise' | 'belegt' | 'unbestimmt'

export type BereichStatus = {
  bereich: Exclude<Arbeitsbereich, 'uebersicht'>
  anzahl: number
  text: string
  lage: BereichLage
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

/**
 * Eine ungeplante Item-Liste für Workspace-Presentation.
 *
 * Der Produktpfad (Guest und Account) übergibt oft `ohneTag === reise.ohneTag`.
 * Diese Liste darf nur einmal in Coverage-, Route- und Zählableitungen
 * eingehen. Eine leere Prop bedeutet „nicht gesetzt“ und fällt auf
 * `reise.ohneTag`. Es gibt keine ID-Deduplizierung und keine zweite
 * Route-Wahrheit. P1-QS1-01.
 */
export function ungeplantePunkteLesen(
  reise: Pick<Trip, 'ohneTag'>,
  ohneTag: readonly TripItem[] = [],
): readonly TripItem[] {
  return ohneTag.length > 0 ? ohneTag : reise.ohneTag
}

/** Alle Planpunkte der Reise, einschließlich noch nicht eingeplanter. */
export function planpunkteSammeln(reise: Trip, ohneTag: readonly TripItem[] = []): TripItem[] {
  return [...reise.days.flatMap((tag) => tag.items), ...ungeplantePunkteLesen(reise, ohneTag)]
}

function anzahlVon(punkte: readonly TripItem[], art: TripItemKind): number {
  return punkte.filter((punkt) => punkt.kind === art).length
}

function anzahlText(anzahl: number, singular: string, plural: string, leer: string): string {
  if (anzahl === 0) return leer
  return `${anzahl} ${anzahl === 1 ? singular : plural}`
}

function flugLage(abdeckung: ReturnType<typeof flugAbdeckung>): BereichLage {
  if (!abdeckung.bestimmbar || abdeckung.unzugeordnet.length > 0) return 'unbestimmt'
  if (abdeckung.abschnitte.some((abschnitt) => abschnitt.status === 'unknown')) return 'unbestimmt'
  if (abdeckung.abschnitte.length === 0) return 'belegt'

  const offen = abdeckung.abschnitte.filter((abschnitt) => abschnitt.status === 'open').length
  if (offen === abdeckung.abschnitte.length) return 'offen'
  if (offen > 0) return 'teilweise'
  return 'belegt'
}

function unterkunftLage(abdeckung: ReturnType<typeof unterkunftAbdeckung>): BereichLage {
  if (
    !abdeckung.bekannt ||
    abdeckung.naechteGesamt === null ||
    abdeckung.naechteAbgedeckt === null ||
    abdeckung.aufenthalte.some((aufenthalt) => aufenthalt.status === 'unknown')
  ) {
    return 'unbestimmt'
  }

  if (abdeckung.naechteGesamt === 0) return 'belegt'
  if (abdeckung.naechteAbgedeckt === 0) return 'offen'
  if (abdeckung.naechteAbgedeckt < abdeckung.naechteGesamt) return 'teilweise'
  return 'belegt'
}

function mobilitaetLage(abdeckung: ReturnType<typeof mobilitaetsAbdeckung>): BereichLage {
  if (!abdeckung.bestimmbar || abdeckung.unzugeordnet.length > 0) return 'unbestimmt'

  const boden = abdeckung.kanten.filter((kante) => kante.status !== 'covered_by_flight')
  if (boden.some((kante) => kante.status === 'unknown')) return 'unbestimmt'
  if (boden.length === 0) return 'belegt'

  const offen = boden.filter((kante) => kante.status === 'open').length
  if (offen === boden.length) return 'offen'
  if (offen > 0) return 'teilweise'
  return 'belegt'
}

/**
 * Einleitung des eingebetteten Tagesplans.
 *
 * Zählt denselben Graphen wie die Übersicht. Kein Link in einen eigenen Bereich.
 */
export function planStatus(reise: Trip, ohneTag: readonly TripItem[] = []): PlanStatus {
  const ungeplante = ungeplantePunkteLesen(reise, ohneTag)
  const punkte = planpunkteSammeln(reise, ungeplante)
  const ungeplant = ungeplante.length
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
 * Text und maschinenlesbare Lage werden aus denselben kanonischen
 * Fachableitungen erzeugt. Die Lage wird bewusst nicht aus lokalisiertem
 * Anzeigetext zurückgeparst: eine Textänderung darf keine Reise-Wahrheit
 * verändern.
 *
 * Der Planstatus gehört nicht hierher: er leitet den eingebetteten Tagesplan
 * ein und darf keinen Bereichswechsel auslösen.
 */
export function bereichStatus(reise: Trip, ohneTag: readonly TripItem[] = []): BereichStatus[] {
  const ungeplante = ungeplantePunkteLesen(reise, ohneTag)
  const punkte = planpunkteSammeln(reise, ungeplante)
  const fluege = flugAbdeckung(reise, ungeplante)
  // Eine Liste, einmal. Spread nur, weil RouteFacts den Trip-shaped Eingang
  // `ohneTag: TripItem[]` verlangt – kein Concat, keine ID-Deduplizierung.
  const route = routeFactsAusGraph({ days: reise.days, ohneTag: [...ungeplante] })
  const routeText = routeKompaktOhneCode(route)
  const fluegeText = routeText ? `${routeText} · ${fluege.zusammenfassung}` : fluege.zusammenfassung
  const unterkunft = unterkunftAbdeckung(reise, ungeplante)
  const mobilitaet = mobilitaetsAbdeckung(reise, ungeplante)
  const mietwagen = mietwagenBestand(reise, ungeplante)
  const aktivitaetenAnzahl = anzahlVon(punkte, 'activity')
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
      lage: flugLage(fluege),
    },
    {
      bereich: 'unterkunft',
      anzahl: anzahlVon(punkte, 'stay'),
      text: unterkunft.zusammenfassung,
      lage: unterkunftLage(unterkunft),
    },
    {
      bereich: 'aktivitaeten',
      anzahl: aktivitaetenAnzahl,
      text: anzahlText(
        aktivitaetenAnzahl,
        'Aktivität geplant',
        'Aktivitäten geplant',
        'Noch keine Aktivität geplant',
      ),
      lage: aktivitaetenAnzahl > 0 ? 'belegt' : 'offen',
    },
    {
      bereich: 'mobilitaet',
      anzahl: verbindungsAnzahl + mietwagenAnzahl,
      text: mobilitaetText,
      lage: mobilitaetLage(mobilitaet),
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

export function aenderungIstSichtbar(offen: boolean): boolean {
  return offen
}

/**
 * Der Tagesplan liegt in der Übersicht. Er ist kein eigener Hauptbereich
 * und erscheint nicht parallel zu Domain-Suchen.
 */
export function tagesplanIstSichtbar(aktiv: Arbeitsbereich): boolean {
  return aktiv === 'uebersicht'
}

/**
 * Kommerzielle Suchbereiche werden erst beim ersten Besuch eingehängt.
 * So startet die Übersicht keine Hotel- oder Aktivitätsanfrage – auf keinem
 * Gerät. Ein einmal besuchter Bereich bleibt eingehängt, damit ein Wechsel
 * keine neue Suche auslöst.
 *
 * Übersicht und der darin liegende Tagesplan haben keine Suche und dürfen
 * immer da sein.
 */
export function bereichSollMounten(
  bereich: Arbeitsbereich,
  aktiv: Arbeitsbereich,
  bereitsBesucht: ReadonlySet<Arbeitsbereich>,
): boolean {
  if (bereich === 'uebersicht') return true
  return bereich === aktiv || bereitsBesucht.has(bereich)
}

export function bereichSollSichtbar(bereich: Arbeitsbereich, aktiv: Arbeitsbereich): boolean {
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
