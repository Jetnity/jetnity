// lib/trips/buchung.ts
//
// Buchungsstatus eines Planpunkts. Rein, ohne React und ohne Provider.
//
// Ein gespeicherter Flug oder Stay ist ausgewählt/geplant. `Gebucht` entsteht
// nur durch eine ausdrückliche Nutzerbestätigung. Der Browser darf keine
// Provider-Quelle behaupten.

import type {
  TripItem,
  TripItemBookingSource,
  TripItemBookingStatus,
  TripItemKind,
} from '@/types/trips'

export const UNBESTAETIGTE_BUCHUNG = {
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

const BUCHBARE_ARTEN: ReadonlySet<TripItemKind> = new Set(['flight', 'stay'])

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

/** Flug- und Stay-Planpunkte können manuell als gebucht bestätigt werden. */
export function kannBuchungMarkieren(punkt: Pick<TripItem, 'kind'>): boolean {
  return BUCHBARE_ARTEN.has(punkt.kind)
}

export function buchungsstatusLesen(wert: unknown): TripItemBookingStatus {
  return wert === 'booked' ? 'booked' : 'unconfirmed'
}

export function buchungsquelleLesen(wert: unknown): TripItemBookingSource | null {
  return wert === 'user' ? 'user' : null
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
    return { ok: false, meldung: 'Nur Flüge und Unterkünfte können als gebucht markiert werden.' }
  }

  if (!gebucht) {
    return { ok: true, punkt: { ...punkt, ...unbestaetigteBuchung() } }
  }

  return { ok: true, punkt: { ...punkt, ...gebuchteBuchung(zeit) } }
}
