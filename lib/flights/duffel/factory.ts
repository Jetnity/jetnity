// lib/flights/duffel/factory.ts
//
// Baut den Adapter nur, wenn die Suche in dieser Umgebung laufen darf.

import 'server-only'

import { duffelAdapter } from '@/lib/flights/duffel/adapter'
import type { FlugProvider } from '@/lib/flights/provider'
import { flugUmgebungAusProzess, flugZustand, istDuffelTestToken, type FlugUmgebung } from '@/lib/flights/zustand'

export function duffelProviderAus(umgebung: FlugUmgebung = flugUmgebungAusProzess()): FlugProvider | null {
  const zustand = flugZustand(umgebung)
  if (!zustand.aktiv) return null
  const token = umgebung.DUFFEL_ACCESS_TOKEN?.trim()
  // Vendor credential stays inside this factory. Global Flight state is
  // only Production-hard-off plus JETNITY_FLIGHT_AKTIV.
  if (!token || !istDuffelTestToken(token)) return null
  return duffelAdapter(token)
}
