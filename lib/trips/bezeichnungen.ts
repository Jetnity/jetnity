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
  note: 'Notiz',
}

/**
 * Ein Betrag, wie Reisende ihn lesen: `CHF 3’000`.
 *
 * Bewusst ohne `Intl.NumberFormat`, und das ist keine Bastelei. Der
 * Gruppentrenner von `de-CH` kommt aus ICU, und Node und Browser bringen jeweils
 * ihre eigene Fassung mit: Node 22 schreibt U+2019, ältere ICU-Fassungen
 * schreiben U+0027. Derselbe Betrag sieht dann auf dem Server anders aus als im
 * Browser, React findet beim Hydrieren zwei verschiedene Texte und bricht die
 * ganze Seite auf Client-Rendering zurück („Text content does not match
 * server-rendered HTML“). Ein Trenner, den Jetnity selbst setzt, ist in beiden
 * Laufzeiten derselbe.
 *
 * Die Währung erscheint als ISO-Code und nicht als Symbol, weil auch die
 * Symbolwahl aus ICU kommt – sie würde dieselbe Frage nur verschieben.
 *
 * `wert` ist nach `lib/trips/schema.ts` nicht negativ; ein Vorzeichen kann hier
 * deshalb nicht entstehen.
 */
export function betragLesbar(wert: number, waehrung: string): string {
  const gruppiert = String(Math.round(wert)).replace(/\B(?=(\d{3})+$)/g, '\u2019')
  return `${waehrung} ${gruppiert}`
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
