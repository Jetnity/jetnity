import { BUCHUNGEN_COPY, buchungZeittext, type KontoBuchung } from '@/lib/account/buchungen'
import { ART_BEZEICHNUNG } from '@/lib/trips/bezeichnungen'
import type { UiSprache } from './ui-sprache'

// The existing German booking contract remains the source of its wording.
const de = {
  ...BUCHUNGEN_COPY,
  metadatenBeschreibung: 'Reisebestandteile, die du in Jetnity ausdrücklich als gebucht bestätigt hast.',
  'art.flight': ART_BEZEICHNUNG.flight,
  'art.stay': ART_BEZEICHNUNG.stay,
  'art.activity': ART_BEZEICHNUNG.activity,
  'art.transfer': ART_BEZEICHNUNG.transfer,
  'art.rental_car': ART_BEZEICHNUNG.rental_car,
  'art.note': ART_BEZEICHNUNG.note,
} as const

export type BuchungenTextSchluessel = keyof typeof de

const en: Record<BuchungenTextSchluessel, string> = {
  seitenEyebrow: 'Account',
  seitenTitel: 'Confirmed bookings',
  seitenLead: 'Trip items you have explicitly marked as booked in Jetnity. This is not confirmation from an airline, hotel or other supplier.',
  hinweis: 'Unconfirmed plan items remain in their respective trip and do not appear here.',
  leerTitel: 'No confirmed bookings yet.',
  leerText: 'When you explicitly mark a flight, accommodation, connection or rental car as booked in a trip, it appears here.',
  leerAktion: 'Go to my trips',
  fehlerTitel: 'Your bookings could not be loaded.',
  fehler500: 'This is an error on our side, not in your data. Please reload the page.',
  fehler503: 'We could not check your current records just now; please reload later.',
  offenGruppe: 'In your trips',
  archivGruppe: 'From archived trips',
  archivHinweis: 'Archived does not mean deleted or invalid.',
  archivKennzeichen: 'Archived',
  planpunktOeffnen: 'Open plan item',
  reiseBezug: 'Trip',
  einstieg: 'View confirmed bookings',
  einstiegHinweis: 'Only bookings explicitly confirmed in Jetnity — without amounts or supplier confirmation.',
  ordnungHinweis: 'Your most recently confirmed booking is at the top.',
  keineTrefferTitel: 'No booking matches this search.',
  keineTrefferText: 'Change the title, type or archive selection, or reset the filters.',
  fortsetzungEndeTitel: 'There are no further bookings here in the current records.',
  fortsetzungEndeText: 'This does not mean the account is empty or the search has no matches overall. Since the previous page, bookings may have been removed or no longer match the filter. This is not a snapshot. Use your browser’s Back button to return to the previous page.',
  ersteSeite: 'First page with these filters',
  weitere: 'More bookings',
  ungueltigTitel: 'This address cannot be read.',
  ungueltigText: 'The filters or continuation are invalid. No query was made.',
  wiederholen: 'Try again',
  filterLegende: 'Filter bookings',
  titelLabel: 'Title',
  artLabel: 'Type',
  archivLabel: 'Archive',
  artAlle: 'All types',
  archivAktiv: 'Active trips',
  archivArchiviert: 'Archived trips',
  archivAlle: 'All trips',
  suchen: 'Search',
  zuruecksetzen: 'Reset filters',
  seitenEnde: 'These are all the bookings in this view.',
  ladenTitel: 'Loading bookings.',
  metadatenBeschreibung: 'Trip items you have explicitly marked as booked in Jetnity.',
  'art.flight': 'Flight',
  'art.stay': 'Accommodation',
  'art.activity': 'Activity',
  'art.transfer': 'Transfer',
  'art.rental_car': 'Rental car',
  'art.note': 'Note',
}

export const BUCHUNGEN_TEXTE: Readonly<Record<UiSprache, Readonly<Record<BuchungenTextSchluessel, string>>>> = { de, en }

/** Keep German formatting; English shows stored calendar dates without a timezone guess. */
export function buchungenZeitAnzeigen(buchung: Pick<KontoBuchung, 'startsOn' | 'startsAt' | 'endsOn'>, sprache: UiSprache): string | null {
  if (sprache === 'de') return buchungZeittext(buchung)
  const start = buchung.startsOn
  const ende = buchung.endsOn
  const uhr = buchung.startsAt
  if (start && ende && start !== ende) return uhr ? `${start}, ${uhr} – ${ende}` : `${start} – ${ende}`
  if (start) return uhr ? `${start}, ${uhr}` : start
  if (ende) return ende
  return uhr
}

// Only keys actually rendered by this route. Shared Account entry links and
// unused grouping copy are not claimed as translated catalog coverage.
export const BUCHUNGEN_SCHLUESSEL = [
  'seitenEyebrow', 'seitenTitel', 'seitenLead', 'hinweis', 'leerTitel', 'leerText', 'leerAktion',
  'fehlerTitel', 'fehler500', 'fehler503', 'archivKennzeichen', 'planpunktOeffnen',
  'reiseBezug', 'ordnungHinweis', 'keineTrefferTitel', 'keineTrefferText',
  'fortsetzungEndeTitel', 'fortsetzungEndeText', 'ersteSeite', 'weitere',
  'ungueltigTitel', 'ungueltigText', 'wiederholen', 'filterLegende', 'titelLabel',
  'artLabel', 'archivLabel', 'artAlle', 'archivAktiv', 'archivArchiviert',
  'archivAlle', 'suchen', 'zuruecksetzen', 'seitenEnde', 'ladenTitel',
  'metadatenBeschreibung', 'art.flight', 'art.stay', 'art.transfer', 'art.rental_car',
] as const satisfies readonly BuchungenTextSchluessel[]
