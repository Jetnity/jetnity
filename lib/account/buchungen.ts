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
import { modusUrl } from '@/lib/trips/workspace-mode'
import { TRIP_ITEM_KINDS, TRIP_STATUSES, type TripItemKind, type TripStatus } from '@/types/trips'

const BUCHUNGS_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

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
  planpunktOeffnen: 'Planpunkt öffnen',
  reiseBezug: 'Reise',
  einstieg: 'Bestätigte Buchungen ansehen',
  einstiegHinweis: 'Nur ausdrücklich in Jetnity bestätigte Buchungen – ohne Beträge und ohne Partnerbestätigung.',
  ordnungHinweis:
    'Sortiert nach deiner eigenen Bestätigung, die neueste zuerst. Ein späterer Seitenaufruf ist keine Momentaufnahme.',
  keineTrefferTitel: 'Keine Buchung passt zu dieser Suche.',
  keineTrefferText: 'Ändere Titel, Art oder Archiv, oder setze die Filter zurück.',
  fortsetzungEndeTitel: 'In diesem Stand gibt es hier keine weitere Buchung.',
  fortsetzungEndeText:
    'Das Konto ist deshalb nicht leer, und die Suche ist nicht insgesamt ohne Treffer. Seit der vorigen Seite können Buchungen weggefallen oder aus dem Filter gerutscht sein. Das ist keine Momentaufnahme. Mit Zurück im Browser erreichst du die vorige Seite.',
  ersteSeite: 'Erste Seite dieser Filter',
  weitere: 'Weitere Buchungen',
  ungueltigTitel: 'Diese Adresse lässt sich nicht lesen.',
  ungueltigText: 'Filter oder Fortsetzung sind ungültig. Es wurde nichts abgefragt.',
  wiederholen: 'Erneut versuchen',
  filterLegende: 'Buchungen eingrenzen',
  titelLabel: 'Titel',
  artLabel: 'Art',
  archivLabel: 'Archiv',
  artAlle: 'Alle Arten',
  archivAktiv: 'Aktive Reisen',
  archivArchiviert: 'Archivierte Reisen',
  archivAlle: 'Alle Reisen',
  suchen: 'Suchen',
  zuruecksetzen: 'Filter zurücksetzen',
  seitenEnde: 'Das sind alle Buchungen dieser Ansicht.',
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

export function buchungenAusZeilen(zeilen: readonly RoheBuchungszeile[]): BuchungenAbbildung {
  const buchungen: KontoBuchung[] = []
  for (const zeile of zeilen) {
    const gelesen = buchungAusZeile(zeile)
    if (gelesen === 'unvollstaendig') return { ok: false, grund: 'unvollstaendig' }
    if (gelesen !== 'auslassen') buchungen.push(gelesen)
  }
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
 * Sichtbare Ordnung und Fortsetzung: neueste ausdrückliche Bestätigung zuerst,
 * fehlende Bestätigungszeit zuletzt, danach stabile `id`.
 * Archiv und Reisedatum sortieren diese Seite nicht um.
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

export function istBuchungsUuid(wert: string): boolean {
  return BUCHUNGS_UUID.test(wert)
}

/**
 * Öffnet den bestehenden Planpunkt. Nur kanonische Kleinbuchstaben-UUIDs.
 * Alles andere bleibt ohne Link, statt eine Adresse zu raten.
 */
export function buchungPlanpunktPfad(tripId: string, itemId: string): string | null {
  if (!istBuchungsUuid(tripId) || !istBuchungsUuid(itemId)) return null
  return modusUrl(`/reisen/${tripId}`, { ansicht: 'plan', bereich: null, itemId })
}
