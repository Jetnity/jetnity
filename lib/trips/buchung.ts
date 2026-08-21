// lib/trips/buchung.ts
//
// Buchungsstatus eines Planpunkts. Rein, ohne React und ohne Provider.
//
// Ein gespeicherter Flug, Stay oder Transfer ist ausgewählt/geplant. `Gebucht`
// entsteht nur durch eine ausdrückliche Nutzerbestätigung. Der Browser darf
// keine Provider-Quelle behaupten.

import {
  TRIP_ITEM_BOOKING_SOURCES,
  TRIP_ITEM_BOOKING_STATUSES,
  type TripItem,
  type TripItemBookingSource,
  type TripItemBookingStatus,
  type TripItemKind,
} from '@/types/trips'

const UNBESTAETIGTE_BUCHUNG = {
  bookingStatus: 'unconfirmed' as const,
  bookingSource: null,
  bookingConfirmedAt: null,
} satisfies {
  bookingStatus: TripItemBookingStatus
  bookingSource: TripItemBookingSource | null
  bookingConfirmedAt: string | null
}

export const BUCHUNGSSTATUS_BEZEICHNUNG: Record<TripItemBookingStatus, string> = {
  unconfirmed: 'Ausgewählt',
  booked: 'Gebucht',
}

const BUCHBARE_ARTEN: ReadonlySet<TripItemKind> = new Set(['flight', 'stay', 'transfer'])

export function unbestaetigteBuchung(): typeof UNBESTAETIGTE_BUCHUNG {
  return { ...UNBESTAETIGTE_BUCHUNG }
}

export function gebuchteBuchung(zeit: string): {
  bookingStatus: 'booked'
  bookingSource: 'user'
  bookingConfirmedAt: string
} {
  return {
    bookingStatus: 'booked',
    bookingSource: 'user',
    bookingConfirmedAt: zeit,
  }
}

export function istGebucht(punkt: Pick<TripItem, 'bookingStatus'>): boolean {
  return punkt.bookingStatus === 'booked'
}

/** Flug-, Stay- und Transfer-Planpunkte können manuell als gebucht bestätigt werden. */
export function kannBuchungMarkieren(punkt: Pick<TripItem, 'kind'>): boolean {
  return BUCHBARE_ARTEN.has(punkt.kind)
}

export function buchungsstatusLesen(wert: unknown): TripItemBookingStatus {
  return (TRIP_ITEM_BOOKING_STATUSES as readonly string[]).includes(wert as string)
    ? (wert as TripItemBookingStatus)
    : 'unconfirmed'
}

export function buchungsquelleLesen(wert: unknown): TripItemBookingSource | null {
  return (TRIP_ITEM_BOOKING_SOURCES as readonly string[]).includes(wert as string)
    ? (wert as TripItemBookingSource)
    : null
}

/**
 * Setzt oder korrigiert den manuellen Buchungsstatus.
 *
 * `source` wird immer `user`, niemals `provider`. Ungültige Arten bleiben
 * unverändert und liefern eine Meldung.
 */
export function buchungsstatusAnwenden(
  punkt: TripItem,
  gebucht: boolean,
  zeit: string,
): { ok: true; punkt: TripItem } | { ok: false; meldung: string } {
  if (!kannBuchungMarkieren(punkt)) {
    return { ok: false, meldung: 'Nur Flüge, Unterkünfte und Verbindungen können als gebucht markiert werden.' }
  }

  if (!gebucht) {
    return { ok: true, punkt: { ...punkt, ...unbestaetigteBuchung() } }
  }

  return { ok: true, punkt: { ...punkt, ...gebuchteBuchung(zeit) } }
}
