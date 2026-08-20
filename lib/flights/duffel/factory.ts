// lib/flights/duffel/factory.ts
//
// Baut den Adapter nur, wenn die Suche in dieser Umgebung laufen darf.

import 'server-only'

import { duffelAdapter } from '@/lib/flights/duffel/adapter'
import type { FlugProvider } from '@/lib/flights/provider'
import { flugZustand, istDuffelTestToken, type FlugUmgebung } from '@/lib/flights/zustand'

export function duffelProviderAus(umgebung: FlugUmgebung = process.env): FlugProvider | null {
  const zustand = flugZustand(umgebung)
  if (!zustand.aktiv) return null
  const token = umgebung.DUFFEL_ACCESS_TOKEN?.trim()
  if (!token || !istDuffelTestToken(token)) return null
  return duffelAdapter(token)
}
