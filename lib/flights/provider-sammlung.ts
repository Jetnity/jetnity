// lib/flights/provider-sammlung.ts
//
// Kleinste Sammlung constructible FlugProvider. Keine dritte Abstraktion:
// das Array ist die Sammlung. Reihenfolge ist kein Default, kein Primary
// und kein Ranking-Gewicht. Doppelte Provider-IDs werden vollständig
// verworfen – nicht still auf das erste Element reduziert.

import 'server-only'

import { duffelProviderAus } from '@/lib/flights/duffel/factory'
import type { FlugProvider } from '@/lib/flights/provider'
import { flugUmgebungAusProzess, type FlugUmgebung } from '@/lib/flights/zustand'

export function flugProviderSammlungAus(
  kandidaten: readonly (FlugProvider | null | undefined)[],
): readonly FlugProvider[] {
  const brauchbar = kandidaten.filter((eintrag): eintrag is FlugProvider => {
    if (!eintrag) return false
    return eintrag.id.trim().length > 0
  })

  const zaehler = new Map<string, number>()
  for (const provider of brauchbar) {
    zaehler.set(provider.id, (zaehler.get(provider.id) ?? 0) + 1)
  }

  return brauchbar.filter((provider) => zaehler.get(provider.id) === 1)
}

export function aktuelleFlugProviderSammlung(
  umgebung: FlugUmgebung = flugUmgebungAusProzess(),
): readonly FlugProvider[] {
  // Nur provider-neutrale Flight-Umgebung. Duffel liest sein Token selbst.
  return flugProviderSammlungAus([duffelProviderAus(umgebung)])
}
