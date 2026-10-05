// lib/account/buchungen.ts
//
// AP-10-S1: kontoweite, read-only Abbildung bestätigter Buchungen.
//
// Autorität bleibt der bestehende Booking-Vertrag in `lib/trips/buchung.ts`.
// Diese Datei erfindet keinen zweiten Status und keine Zahlungs- oder Partnerwahrheit.
// Frei von Supabase, damit Filter, Sortierung und Empty≠Error ohne Datenbank
// prüfbar bleiben.

import { istArchiviert } from '@/lib/account/reise-archiv'
import { istGebucht, kannBuchungMarkieren } from '@/lib/trips/buchung'
import { ART_BEZEICHNUNG, STATUS_BEZEICHNUNG } from '@/lib/trips/bezeichnungen'
import { datumKurz } from '@/lib/trips/datum-anzeige'
import { TRIP_ITEM_KINDS, TRIP_STATUSES, type TripItemKind, type TripStatus } from '@/types/trips'

export const BUCHUNGEN_LISTE_GRENZE = 200

export const BUCHUNGEN_COPY = {
  seitenEyebrow: 'Konto',
  seitenTitel: 'Bestätigte Buchungen',
  seitenLead:
    'Reisebestandteile, die du in Jetnity ausdrücklich als gebucht bestätigt hast. Das ist keine Bestätigung durch eine Airline, ein Hotel oder einen anderen Anbieter.',
  hinweis: 'Unbestätigte Planpunkte bleiben in der jeweiligen Reise und erscheinen hier nicht.',
  leerTitel: 'Noch keine bestätigten Buchungen.',
  leerText:
    'Sobald du einen Flug, eine Unterkunft, eine Verbindung oder einen Mietwagen in einer Reise ausdrücklich als gebucht markierst, erscheint er hier.',
  fehlerTitel: 'Deine Buchungen konnten nicht geladen werden.',
  fehler500: 'Das ist ein Fehler auf unserer Seite, nicht in deinen Daten. Bitte lade die Seite neu.',
  fehler503: 'Wir konnten deinen aktuellen Stand gerade nicht prüfen; bitte lade später neu.',
  offenGruppe: 'In deinen Reisen',
  archivGruppe: 'Aus archivierten Reisen',
  archivHinweis: 'Archiviert bedeutet nicht gelöscht und nicht ungültig.',
  archivKennzeichen: STATUS_BEZEICHNUNG.archived,
  reiseOeffnen: 'Reise öffnen',
  reiseBezug: 'Reise',
  einstieg: 'Bestätigte Buchungen ansehen',
  einstiegHinweis: 'Nur ausdrücklich in Jetnity bestätigte Buchungen – ohne Beträge und ohne Partnerbestätigung.',
  abgeschnittenTitel: 'Diese Übersicht ist unvollständig.',
  abgeschnittenText:
    'Es gibt mehr bestätigte Buchungen, als hier gerade angezeigt werden können. Gezeigt wird die zuletzt ausdrücklich bestätigte Teilmenge. Nichts wurde still verworfen.',
  ladenTitel: 'Buchungen werden geladen.',
  ladenText: 'Einen Moment, wir lesen die bestätigten Buchungen deines Kontos.',
} as const

export type KontoBuchung = {
  id: string
  title: string
  kind: TripItemKind
  artBezeichnung: string
  startsOn: string | null
  startsAt: string | null
  endsOn: string | null
  endsAt: string | null
  tripId: string
  tripTitle: string
  tripStatus: TripStatus
  tripArchived: boolean
}

export type BuchungenAbbildung =
  | { ok: true; buchungen: KontoBuchung[] }
  | { ok: false; grund: 'unvollstaendig' }

export type RoheBuchungszeile = {
  id: unknown
  kind: unknown
  title: unknown
  starts_on?: unknown
  starts_at?: unknown
  ends_on?: unknown
  ends_at?: unknown
  booking_status?: unknown
  trips?: unknown
}

function artLesen(wert: unknown): TripItemKind | null {
  return typeof wert === 'string' && (TRIP_ITEM_KINDS as readonly string[]).includes(wert)
    ? (wert as TripItemKind)
    : null
}

function textOderNull(wert: unknown): string | null {
  if (typeof wert !== 'string') return null
  const getrimmt = wert.trim()
  return getrimmt.length > 0 ? getrimmt : null
}

function uhrzeitOderNull(wert: unknown): string | null {
  if (typeof wert !== 'string') return null
  return /^\d{2}:\d{2}/.test(wert) ? wert.slice(0, 5) : null
}

function tripAus(wert: unknown): { id: string; title: string; status: string } | null {
  const kandidat = Array.isArray(wert) ? wert[0] : wert
  if (!kandidat || typeof kandidat !== 'object') return null
  const zeile = kandidat as { id?: unknown; title?: unknown; status?: unknown }
  if (typeof zeile.id !== 'string' || zeile.id.length === 0) return null
  if (typeof zeile.title !== 'string') return null
  if (typeof zeile.status !== 'string') return null
  return { id: zeile.id, title: zeile.title, status: zeile.status }
}

/**
 * Liest einen Trip-Status nur, wenn er zur bestehenden Wertewelt gehört.
 * Unbekannte Werte werden nicht zu `draft` umgedeutet.
 */
export function tripStatusLesen(wert: string): TripStatus | null {
  return (TRIP_STATUSES as readonly string[]).includes(wert) ? (wert as TripStatus) : null
}

/**
 * Eine Rohzeile wird nur zur Buchung, wenn der bestehende Vertrag sie als
 * ausdrücklich gebucht und buchbar anerkennt. Unbestätigtes und nicht
 * buchbare Arten werden ausgelassen, nicht umgedeutet.
 */
export function buchungAusZeile(zeile: RoheBuchungszeile): KontoBuchung | 'auslassen' | 'unvollstaendig' {
  if (typeof zeile.id !== 'string' || zeile.id.length === 0) return 'unvollstaendig'

  const kind = artLesen(zeile.kind)
  if (!kind || !kannBuchungMarkieren({ kind })) return 'auslassen'
  if (!istGebucht({ bookingStatus: zeile.booking_status === 'booked' ? 'booked' : 'unconfirmed' })) {
    return 'auslassen'
  }

  const title = textOderNull(zeile.title)
  const trip = tripAus(zeile.trips)
  if (!title || !trip) return 'unvollstaendig'

  const tripStatus = tripStatusLesen(trip.status)
  if (!tripStatus) return 'unvollstaendig'

  return {
    id: zeile.id,
    title,
    kind,
    artBezeichnung: ART_BEZEICHNUNG[kind],
    startsOn: textOderNull(zeile.starts_on),
    startsAt: uhrzeitOderNull(zeile.starts_at),
    endsOn: textOderNull(zeile.ends_on),
    endsAt: uhrzeitOderNull(zeile.ends_at),
    tripId: trip.id,
    tripTitle: trip.title.trim(),
    tripStatus,
    tripArchived: istArchiviert({ status: tripStatus }),
  }
}

function vergleich(a: KontoBuchung, b: KontoBuchung): number {
  if (a.tripArchived !== b.tripArchived) return a.tripArchived ? 1 : -1
  const startA = a.startsOn ?? '9999-12-31'
  const startB = b.startsOn ?? '9999-12-31'
  if (startA !== startB) return startA.localeCompare(startB)
  const zeitA = a.startsAt ?? '99:99'
  const zeitB = b.startsAt ?? '99:99'
  if (zeitA !== zeitB) return zeitA.localeCompare(zeitB)
  if (a.title !== b.title) return a.title.localeCompare(b.title, 'de')
  if (a.tripTitle !== b.tripTitle) return a.tripTitle.localeCompare(b.tripTitle, 'de')
  return a.id.localeCompare(b.id)
}

export function buchungenAusZeilen(zeilen: readonly RoheBuchungszeile[]): BuchungenAbbildung {
  const buchungen: KontoBuchung[] = []
  for (const zeile of zeilen) {
    const gelesen = buchungAusZeile(zeile)
    if (gelesen === 'unvollstaendig') return { ok: false, grund: 'unvollstaendig' }
    if (gelesen !== 'auslassen') buchungen.push(gelesen)
  }
  buchungen.sort(vergleich)
  return { ok: true, buchungen }
}

export function buchungenGruppenAus(buchungen: readonly KontoBuchung[]): {
  aktuell: KontoBuchung[]
  archiviert: KontoBuchung[]
} {
  return {
    aktuell: buchungen.filter((buchung) => !buchung.tripArchived),
    archiviert: buchungen.filter((buchung) => buchung.tripArchived),
  }
}

export type BuchungenSchnittSchluessel = {
  bookingConfirmedAt: string | null
  id: string
}

/**
 * Schnitt-Ordnung vor dem Limit: neueste ausdrückliche Bestätigung zuerst,
 * fehlende Bestätigungszeit zuletzt, danach stabile `id`.
 * Das bestimmt die gelesene Teilmenge, nicht die sichtbare Kartenreihenfolge.
 */
export function buchungenSchnittVergleich(
  a: BuchungenSchnittSchluessel,
  b: BuchungenSchnittSchluessel,
): number {
  const zeitA = a.bookingConfirmedAt
  const zeitB = b.bookingConfirmedAt
  if (zeitA && zeitB && zeitA !== zeitB) return zeitB.localeCompare(zeitA)
  if (zeitA && !zeitB) return -1
  if (!zeitA && zeitB) return 1
  return a.id.localeCompare(b.id)
}

export function buchungenAbgeschnitten(
  gelesen: number,
  gesamt: number | null | undefined,
  grenze: number = BUCHUNGEN_LISTE_GRENZE,
): boolean {
  if (typeof gesamt === 'number') return gesamt > gelesen
  return gelesen >= grenze
}

/**
 * Datum und Uhrzeit nur aus gespeicherten Werten. Fehlt beides, gibt es
 * keinen Ersatztext.
 */
export function buchungZeittext(buchung: Pick<KontoBuchung, 'startsOn' | 'startsAt' | 'endsOn'>): string | null {
  const start = buchung.startsOn ? datumKurz(buchung.startsOn) : null
  const ende = buchung.endsOn ? datumKurz(buchung.endsOn) : null
  const uhr = buchung.startsAt

  if (start && ende && start !== ende) {
    return uhr ? `${start}, ${uhr} – ${ende}` : `${start} – ${ende}`
  }
  if (start) return uhr ? `${start}, ${uhr}` : start
  if (ende) return ende
  return uhr
}

export function buchungReisePfad(tripId: string): `/reisen/${string}` {
  return `/reisen/${tripId}`
}
