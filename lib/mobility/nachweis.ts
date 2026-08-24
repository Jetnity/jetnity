// lib/mobility/nachweis.ts
//
// Serverseitige Vertrauensnaht für eine Mobilitätsauswahl.
//
// MobilityProvider.suchen() bleibt schmal. Diese Schnittstelle bestätigt eine
// konkrete Option gegen den erwarteten Suchkontext, bevor ein Konto sie als
// kommerziellen transfer-Punkt speichern dürfte. Search-Provider und
// Affiliate-/Booking-Partner müssen nicht identisch sein.
//
// Die fachliche Form bleibt mobility-spezifisch: Orte, Datum, Modus,
// Reisende, Währung. Kein Flug-Schema, keine booking_url.
//
// Frei von Next, Secrets und Anbieter-SDKs.

import { MOBILITY_SUCHE_GRENZEN, type MobilityOption } from '@/lib/mobility/domain'
import { mobilityOptionLesen } from '@/lib/mobility/schema'
import type { MobilityMode, Trip } from '@/types/trips'

export type MobilityNachweisFehlerArt =
  | 'unavailable'
  | 'unbekannt'
  | 'abgelaufen'
  | 'geaendert'
  | 'invalid'
  | 'error'

export type MobilityNachweisKontext = {
  originName: string
  destinationName: string
  originPlaceId: string | null
  destinationPlaceId: string | null
  date: string | null
  mode: MobilityMode | null
  travellers: number
  currency: string
}

export type MobilityNachweisErgebnis =
  | { ok: true; option: MobilityOption }
  | { ok: false; art: MobilityNachweisFehlerArt; message: string }

export type MobilityNachweis = {
  nachweisen(eingabe: {
    optionId: string
    kontext: MobilityNachweisKontext
  }): Promise<MobilityNachweisErgebnis>
}

const MOBILITY_NACHWEIS_MELDUNG: Record<MobilityNachweisFehlerArt, string> = {
  unavailable: 'Verbindungen können noch nicht verbindlich in die Reise übernommen werden.',
  unbekannt: 'Diese Verbindung ist unbekannt.',
  abgelaufen: 'Diese Verbindung ist nicht mehr gültig.',
  geaendert: 'Dieses Angebot hat sich geändert. Bitte suche erneut.',
  invalid: 'Diese Verbindung ist unvollständig.',
  error: 'Die Verbindung konnte gerade nicht bestätigt werden.',
}

export function mobilityNachweisFehler(
  art: MobilityNachweisFehlerArt,
): Extract<MobilityNachweisErgebnis, { ok: false }> {
  return { ok: false, art, message: MOBILITY_NACHWEIS_MELDUNG[art] }
}

function textGleich(a: string | null, b: string | null): boolean {
  return (a ?? null) === (b ?? null)
}

function mobilityNachweisKontextGleich(
  a: MobilityNachweisKontext,
  b: MobilityNachweisKontext,
): boolean {
  return (
    a.originName === b.originName &&
    a.destinationName === b.destinationName &&
    textGleich(a.originPlaceId, b.originPlaceId) &&
    textGleich(a.destinationPlaceId, b.destinationPlaceId) &&
    textGleich(a.date, b.date) &&
    a.mode === b.mode &&
    a.travellers === b.travellers &&
    a.currency === b.currency
  )
}

function mobilityReisendeAusReise(reise: Pick<Trip, 'travellers'>): number {
  return Math.min(
    MOBILITY_SUCHE_GRENZEN.reisende.max,
    Math.max(MOBILITY_SUCHE_GRENZEN.reisende.min, reise.travellers),
  )
}

export function mobilityNachweisKontextAusReise(
  reise: Pick<Trip, 'travellers' | 'currency'>,
  suche: {
    originName: string
    destinationName: string
    originPlaceId: string | null
    destinationPlaceId: string | null
    date: string | null
    mode: MobilityMode | null
  },
): MobilityNachweisKontext {
  return {
    originName: suche.originName.trim(),
    destinationName: suche.destinationName.trim(),
    originPlaceId: suche.originPlaceId,
    destinationPlaceId: suche.destinationPlaceId,
    date: suche.date,
    mode: suche.mode,
    travellers: mobilityReisendeAusReise(reise),
    currency: reise.currency.trim().toUpperCase(),
  }
}

/**
 * S3: Es gibt keinen serverseitigen Nachweis und keinen Suchkontext-Speicher.
 * Die Konto-Übernahme bleibt fail closed, bis ein Adapter oder ein
 * Jetnity-eigener Nachweis diese Naht implementiert.
 */
export function mobilityNachweisAusUmgebung(): MobilityNachweis | null {
  return null
}

export type MobilityNachweisKatalog = {
  optionen?: Record<string, unknown>
  kontexte?: Record<string, MobilityNachweisKontext>
  abgelaufen?: readonly string[]
  geaendert?: readonly string[]
  fehler?: Partial<Record<string, MobilityNachweisFehlerArt>>
}

/** Fake-Nachweis für Tests. Kein Produktionsweg. */
export function mobilityNachweisAusKatalog(katalog: MobilityNachweisKatalog): MobilityNachweis {
  const abgelaufen = new Set(katalog.abgelaufen ?? [])
  const geaendert = new Set(katalog.geaendert ?? [])
  const fehler = katalog.fehler ?? {}

  return {
    async nachweisen({ optionId, kontext }) {
      const id = optionId.trim()
      if (!id) return mobilityNachweisFehler('invalid')

      const art = fehler[id]
      if (art) return mobilityNachweisFehler(art)
      if (abgelaufen.has(id)) return mobilityNachweisFehler('abgelaufen')
      if (geaendert.has(id)) return mobilityNachweisFehler('geaendert')

      const roh = katalog.optionen?.[id]
      if (roh === undefined) return mobilityNachweisFehler('unbekannt')
      const erwartet = katalog.kontexte?.[id]
      if (!erwartet || !mobilityNachweisKontextGleich(erwartet, kontext)) {
        return mobilityNachweisFehler('geaendert')
      }
      const option = mobilityOptionLesen(roh)
      if (!option) return mobilityNachweisFehler('invalid')
      return { ok: true, option }
    },
  }
}
