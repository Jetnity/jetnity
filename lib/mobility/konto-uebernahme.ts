// lib/mobility/konto-uebernahme.ts
//
// Vertrauensgrenze der kommerziellen Mobilitätsübernahme im Konto.
//
// Der Browser darf nur identifiers liefern. Preis, Zeiten, Provider,
// External-Ref und Modus kommen aus Nachweis plus serverseitigem
// Suchkontext – oder die Übernahme fällt fail closed.
//
// Frei von Next und Supabase.

import type { MobilityMode, MobilityOption } from '@/lib/mobility/domain'
import type { MobilityNachweis } from '@/lib/mobility/nachweis'
import { mobilityNachweisFehler, mobilityNachweisKontextAusReise } from '@/lib/mobility/nachweis'
import { alsMobilityMomentaufnahme, type MobilityMomentaufnahme } from '@/lib/mobility/uebernahme'
import type { Trip } from '@/types/trips'

export type MobilityKontoUebernahmeEingabe = {
  tripId: string
  optionId: string
}

export type MobilityKontoUebernahmeSuche = {
  originName: string
  destinationName: string
  originPlaceId: string | null
  destinationPlaceId: string | null
  date: string | null
  mode: MobilityMode | null
}

export type MobilityKontoUebernahmeFehlerArt =
  | 'reise-fremd'
  | 'unavailable'
  | 'unbekannt'
  | 'abgelaufen'
  | 'geaendert'
  | 'invalid'
  | 'error'

export type MobilityKontoUebernahmeErgebnis =
  | {
      ok: true
      option: MobilityOption
      aufnahme: MobilityMomentaufnahme
    }
  | { ok: false; art: MobilityKontoUebernahmeFehlerArt; message: string }

export async function mobilityKontoUebernahmePruefen(
  eingabe: MobilityKontoUebernahmeEingabe,
  ports: {
    nachweis: MobilityNachweis | null
    reise: Pick<Trip, 'id' | 'travellers' | 'currency'> | null
    suche: MobilityKontoUebernahmeSuche | null
  },
): Promise<MobilityKontoUebernahmeErgebnis> {
  if (!ports.nachweis || !ports.suche) return mobilityNachweisFehler('unavailable')

  if (!ports.reise || ports.reise.id !== eingabe.tripId) {
    return { ok: false, art: 'reise-fremd', message: 'Diese Reise wurde nicht gefunden.' }
  }

  const kontext = mobilityNachweisKontextAusReise(ports.reise, ports.suche)
  const nachgewiesen = await ports.nachweis.nachweisen({ optionId: eingabe.optionId, kontext })
  if (!nachgewiesen.ok) return nachgewiesen

  const aufnahme = alsMobilityMomentaufnahme(nachgewiesen.option)
  if (!aufnahme) return mobilityNachweisFehler('invalid')

  return {
    ok: true,
    option: nachgewiesen.option,
    aufnahme,
  }
}

/**
 * Produktionsweg: Umgebung hat keinen Nachweis und keinen Suchkontext.
 * Bleibt fail closed, bis ein Adapter diese Naht implementiert.
 */
export async function mobilityInKontoUebernehmen(
  eingabe: MobilityKontoUebernahmeEingabe,
): Promise<MobilityKontoUebernahmeErgebnis> {
  return mobilityKontoUebernahmePruefen(eingabe, {
    nachweis: null,
    reise: null,
    suche: null,
  })
}
