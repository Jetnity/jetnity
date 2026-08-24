// lib/flights/konto-uebernahme.ts
//
// Vertrauensgrenze der kommerziellen Flugübernahme im Konto.
//
// Der Browser darf nur identifiers liefern. Preis, Zeiten, Provider,
// External-Ref, Kabine und Legs kommen aus Nachweis plus serverseitigem
// Suchkontext – oder die Übernahme fällt fail closed.
//
// Frei von Next und Supabase.

import type { FlugKabine, FlugOption, FlugSuchBein } from '@/lib/flights/domain'
import type { FlugNachweis } from '@/lib/flights/nachweis'
import { flugNachweisFehler, flugNachweisKontextAusReise } from '@/lib/flights/nachweis'
import { flugReisegraphPruefen, type FlugReisegraphFehlerArt } from '@/lib/flights/reisegraph'
import { alsFlugMomentaufnahme, type FlugMomentaufnahme } from '@/lib/flights/uebernahme'
import type { FlughafenReferenzKarte } from '@/lib/route/domain'
import type { Trip } from '@/types/trips'

export type FlugKontoUebernahmeEingabe = {
  tripId: string
  dayId: string | null
  optionId: string
}

export type FlugKontoUebernahmeSuche = {
  legs: readonly FlugSuchBein[]
  cabin: FlugKabine
}

export type FlugKontoUebernahmeFehlerArt =
  | FlugReisegraphFehlerArt
  | 'unavailable'
  | 'unbekannt'
  | 'abgelaufen'
  | 'geaendert'
  | 'invalid'
  | 'error'

export type FlugKontoUebernahmeErgebnis =
  | {
      ok: true
      option: FlugOption
      aufnahme: FlugMomentaufnahme
      dayId: string | null
    }
  | { ok: false; art: FlugKontoUebernahmeFehlerArt; message: string }

export async function flugKontoUebernahmePruefen(
  eingabe: FlugKontoUebernahmeEingabe,
  ports: {
    nachweis: FlugNachweis | null
    reise: Trip
    suche: FlugKontoUebernahmeSuche | null
    refs?: FlughafenReferenzKarte
  },
): Promise<FlugKontoUebernahmeErgebnis> {
  const graph = flugReisegraphPruefen(ports.reise, {
    tripId: eingabe.tripId,
    dayId: eingabe.dayId,
  })
  if (!graph.ok) return graph

  if (!ports.nachweis || !ports.suche) return flugNachweisFehler('unavailable')

  const kontext = flugNachweisKontextAusReise(ports.reise, ports.suche)
  const nachgewiesen = await ports.nachweis.nachweisen({ optionId: eingabe.optionId, kontext })
  if (!nachgewiesen.ok) return nachgewiesen

  const aufnahme = alsFlugMomentaufnahme(nachgewiesen.option, ports.refs ?? {})
  if (!aufnahme) return flugNachweisFehler('invalid')

  return {
    ok: true,
    option: nachgewiesen.option,
    aufnahme,
    dayId: graph.tag?.id ?? null,
  }
}
