// lib/trips/bezeichnungen.ts
//
// Was Reisende lesen – an einer Stelle.
//
// Die Datenbank speichert `calm`, `culture`, `stay`. Das ist Absicht: Ein
// Wertebereich in der Datenbank ist ein Schlüssel und kein Anzeigetext, sonst
// braucht eine zweite Sprache eine Migration. Die deutschen Bezeichnungen
// stehen deshalb hier und nirgends sonst.
//
// Dazu die Rückübersetzung der Legacy-Werte: Bis Phase 1.5 lagen im
// `localStorage` deutsche Werte (`ruhig`, `Kultur`). Ein Entwurf, der dort noch
// liegt, soll seine Angaben behalten und nicht auf Vorgaben zurückfallen.

import {
  TRIP_INTERESTS,
  TRIP_PACES,
  type TripInterest,
  type TripItemKind,
  type TripPace,
  type TripStatus,
} from '@/types/trips'

export const TEMPO_BEZEICHNUNG: Record<TripPace, { titel: string; beschreibung: string }> = {
  calm: { titel: 'Ruhig', beschreibung: 'Mehr Freiraum und Erholung' },
  balanced: { titel: 'Ausgewogen', beschreibung: 'Erlebnisse und freie Zeit' },
  intense: { titel: 'Intensiv', beschreibung: 'Möglichst viel entdecken' },
}

export const INTERESSE_BEZEICHNUNG: Record<TripInterest, string> = {
  culture: 'Kultur',
  nature: 'Natur',
  food: 'Kulinarik',
  beach: 'Strand',
  adventure: 'Abenteuer',
  wellness: 'Wellness',
}

export const STATUS_BEZEICHNUNG: Record<TripStatus, string> = {
  draft: 'Entwurf',
  planned: 'Geplant',
  booked: 'Gebucht',
  archived: 'Archiviert',
}

export const ART_BEZEICHNUNG: Record<TripItemKind, string> = {
  flight: 'Flug',
  stay: 'Unterkunft',
  activity: 'Aktivität',
  transfer: 'Transfer',
  rental_car: 'Mietwagen',
  note: 'Notiz',
}

/**
 * Ein Betrag, wie Reisende ihn lesen: `CHF 1’110.40`.
 *
 * Bewusst ohne `Intl.NumberFormat`. Der Gruppentrenner von `de-CH` kommt aus
 * ICU, und Node und Browser bringen jeweils ihre eigene Fassung mit: Node 22
 * schreibt U+2019, ältere ICU-Fassungen schreiben U+0027. Derselbe Betrag sieht
 * dann auf dem Server anders aus als im Browser. Ein Trenner, den Jetnity
 * selbst setzt, ist in beiden Laufzeiten derselbe. Die Dezimaltrennung ist der
 * Punkt, die Gruppierung U+2019, immer mit zwei Nachkommastellen (Hundertstel).
 *
 * Die Währung erscheint als ISO-Code und nicht als Symbol, weil auch die
 * Symbolwahl aus ICU kommt.
 *
 * Gespeicherte Preise rechnet das Kostenbild in Rappen. Diese Anzeige rundet
 * nicht auf Franken. Ein Wert, der sich nicht exakt und sicher als Hundertstel
 * darstellen lässt, wird nicht geraten.
 */
export const BETRAG_NICHT_LESBAR = 'Betrag nicht lesbar'

export function betragLesbar(wert: number, waehrung: string): string {
  const rappen = rappenGenau(wert)
  if (rappen === null) return `${waehrung} ${BETRAG_NICHT_LESBAR}`
  const negativ = rappen < 0
  const absolut = Math.abs(rappen)
  const franken = Math.trunc(absolut / 100)
  const rest = absolut % 100
  const gruppiert = String(franken).replace(/\B(?=(\d{3})+$)/g, '\u2019')
  return `${waehrung} ${negativ ? '-' : ''}${gruppiert}.${String(rest).padStart(2, '0')}`
}

function rappenGenau(wert: number): number | null {
  if (typeof wert !== 'number' || !Number.isFinite(wert)) return null
  const negativ = wert < 0
  const betrag = Math.abs(wert)
  const ganz = Math.round(betrag * 100)
  if (!Number.isSafeInteger(ganz) || Math.abs(ganz / 100 - betrag) > 1e-8) return null
  return negativ ? -ganz : ganz
}

/**
 * Die deutschen Tempowerte der Fassung bis Phase 1.5.
 *
 * Sie standen in `types/trips.ts` als `TRIP_PACES` und liegen deshalb in jedem
 * Entwurf, der vor dieser Phase entstanden ist.
 */
const TEMPO_LEGACY: Record<string, TripPace> = {
  ruhig: 'calm',
  ausgewogen: 'balanced',
  intensiv: 'intense',
}

const INTERESSE_LEGACY: Record<string, TripInterest> = {
  Kultur: 'culture',
  Natur: 'nature',
  Kulinarik: 'food',
  Strand: 'beach',
  Abenteuer: 'adventure',
  Wellness: 'wellness',
}

/** Liest ein Tempo, gleich ob es der neuen oder der alten Schreibweise folgt. */
export function tempoLesen(wert: unknown): TripPace | null {
  if (typeof wert !== 'string') return null
  if ((TRIP_PACES as readonly string[]).includes(wert)) return wert as TripPace
  return TEMPO_LEGACY[wert] ?? null
}

/** Liest ein Interesse, gleich ob es der neuen oder der alten Schreibweise folgt. */
export function interesseLesen(wert: unknown): TripInterest | null {
  if (typeof wert !== 'string') return null
  if ((TRIP_INTERESTS as readonly string[]).includes(wert)) return wert as TripInterest
  return INTERESSE_LEGACY[wert] ?? null
}
