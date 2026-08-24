// lib/rental-cars/konto-uebernahme.ts
//
// Vertrauensgrenze der kommerziellen Mietwagenübernahme im Konto.
//
// Der Browser darf nur identifiers liefern. Preis, Stationen, Provider,
// External-Ref und Fahrzeugfakten kommen aus Nachweis plus serverseitigem
// Suchkontext – oder die Übernahme fällt fail closed.
//
// Frei von Next und Supabase.

import type { RentalCarOption } from '@/lib/rental-cars/domain'
import type { RentalCarNachweis } from '@/lib/rental-cars/nachweis'
import { rentalCarNachweisFehler, rentalCarNachweisKontextAusReise } from '@/lib/rental-cars/nachweis'
import { alsRentalCarMomentaufnahme, type RentalCarMomentaufnahme } from '@/lib/rental-cars/uebernahme'
import type { Transmission, Trip, VehicleClass } from '@/types/trips'

export type RentalCarKontoUebernahmeEingabe = {
  tripId: string
  optionId: string
}

export type RentalCarKontoUebernahmeSuche = {
  pickupName: string
  dropoffName: string
  pickupPlaceId: string | null
  dropoffPlaceId: string | null
  pickupOn: string | null
  pickupAt: string | null
  dropoffOn: string | null
  dropoffAt: string | null
  vehicleClass: VehicleClass | null
  transmission: Transmission | null
}

export type RentalCarKontoUebernahmeFehlerArt =
  | 'reise-fremd'
  | 'unavailable'
  | 'unbekannt'
  | 'abgelaufen'
  | 'geaendert'
  | 'invalid'
  | 'error'

export type RentalCarKontoUebernahmeErgebnis =
  | {
      ok: true
      option: RentalCarOption
      aufnahme: RentalCarMomentaufnahme
    }
  | { ok: false; art: RentalCarKontoUebernahmeFehlerArt; message: string }

export async function rentalCarKontoUebernahmePruefen(
  eingabe: RentalCarKontoUebernahmeEingabe,
  ports: {
    nachweis: RentalCarNachweis | null
    reise: Pick<Trip, 'id' | 'currency'> | null
    suche: RentalCarKontoUebernahmeSuche | null
  },
): Promise<RentalCarKontoUebernahmeErgebnis> {
  if (!ports.nachweis || !ports.suche) return rentalCarNachweisFehler('unavailable')

  if (!ports.reise || ports.reise.id !== eingabe.tripId) {
    return { ok: false, art: 'reise-fremd', message: 'Diese Reise wurde nicht gefunden.' }
  }

  const kontext = rentalCarNachweisKontextAusReise(ports.reise, ports.suche)
  const nachgewiesen = await ports.nachweis.nachweisen({ optionId: eingabe.optionId, kontext })
  if (!nachgewiesen.ok) return nachgewiesen

  const aufnahme = alsRentalCarMomentaufnahme(nachgewiesen.option)
  if (!aufnahme) return rentalCarNachweisFehler('invalid')

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
export async function rentalCarInKontoUebernehmen(
  eingabe: RentalCarKontoUebernahmeEingabe,
): Promise<RentalCarKontoUebernahmeErgebnis> {
  return rentalCarKontoUebernahmePruefen(eingabe, {
    nachweis: null,
    reise: null,
    suche: null,
  })
}
