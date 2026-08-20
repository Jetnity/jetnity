// lib/hotels/nachweis.ts
//
// Serverseitige Vertrauensnaht für eine Hotelauswahl.
//
// HotelProvider.suchen() bleibt schmal. Diese Schnittstelle bestätigt eine
// konkrete Option, bevor ein Konto sie als kommerziellen stay speichert.
// Search-Provider und Affiliate-/Booking-Partner müssen nicht identisch sein.
//
// Frei von Next, Secrets und Anbieter-SDKs.

import type { HotelOption } from '@/lib/hotels/domain'
import { hotelOptionLesen } from '@/lib/hotels/schema'

export type HotelNachweisFehlerArt =
  | 'unavailable'
  | 'unbekannt'
  | 'abgelaufen'
  | 'geaendert'
  | 'invalid'
  | 'error'

export type HotelNachweisErgebnis =
  | { ok: true; option: HotelOption }
  | { ok: false; art: HotelNachweisFehlerArt; message: string }

export type HotelNachweis = {
  nachweisen(eingabe: { optionId: string }): Promise<HotelNachweisErgebnis>
}

const HOTEL_NACHWEIS_MELDUNG: Record<HotelNachweisFehlerArt, string> = {
  unavailable: 'Hotels können noch nicht verbindlich in die Reise übernommen werden.',
  unbekannt: 'Diese Hotelauswahl ist unbekannt.',
  abgelaufen: 'Diese Hotelauswahl ist nicht mehr gültig.',
  geaendert: 'Dieses Angebot hat sich geändert. Bitte suche erneut.',
  invalid: 'Diese Hotelauswahl ist unvollständig.',
  error: 'Die Hotelauswahl konnte gerade nicht bestätigt werden.',
}

export function hotelNachweisFehler(
  art: HotelNachweisFehlerArt,
): Extract<HotelNachweisErgebnis, { ok: false }> {
  return { ok: false, art, message: HOTEL_NACHWEIS_MELDUNG[art] }
}

/**
 * Phase 3.2b: Es gibt keinen serverseitigen Nachweis.
 * Die Konto-Übernahme bleibt fail closed, bis ein Adapter oder ein
 * Jetnity-eigener Nachweis diese Naht implementiert.
 */
export function hotelNachweisAusUmgebung(): HotelNachweis | null {
  return null
}

export type HotelNachweisKatalog = {
  optionen?: Record<string, unknown>
  abgelaufen?: readonly string[]
  geaendert?: readonly string[]
  fehler?: Partial<Record<string, HotelNachweisFehlerArt>>
}

/** Fake-Nachweis für Tests. Kein Produktionsweg. */
export function hotelNachweisAusKatalog(katalog: HotelNachweisKatalog): HotelNachweis {
  const abgelaufen = new Set(katalog.abgelaufen ?? [])
  const geaendert = new Set(katalog.geaendert ?? [])
  const fehler = katalog.fehler ?? {}

  return {
    async nachweisen({ optionId }) {
      const id = optionId.trim()
      if (!id) return hotelNachweisFehler('invalid')

      const art = fehler[id]
      if (art) return hotelNachweisFehler(art)
      if (abgelaufen.has(id)) return hotelNachweisFehler('abgelaufen')
      if (geaendert.has(id)) return hotelNachweisFehler('geaendert')

      const roh = katalog.optionen?.[id]
      if (roh === undefined) return hotelNachweisFehler('unbekannt')
      const option = hotelOptionLesen(roh)
      if (!option) return hotelNachweisFehler('invalid')
      return { ok: true, option }
    },
  }
}
