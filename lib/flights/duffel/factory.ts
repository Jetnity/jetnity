// lib/flights/duffel/factory.ts
//
// Baut den Adapter nur, wenn die Suche in dieser Umgebung laufen darf.
// Duffel-Credentials bleiben hier bzw. in zugang.ts, nicht in FlugUmgebung.

import 'server-only'

import { duffelAdapter } from '@/lib/flights/duffel/adapter'
import {
  duffelUmgebungAusProzess,
  istDuffelTestToken,
  type DuffelUmgebung,
} from '@/lib/flights/duffel/zugang'
import type { FlugProvider } from '@/lib/flights/provider'
import { flugUmgebungAusProzess, flugZustand, type FlugUmgebung } from '@/lib/flights/zustand'

export function duffelProviderAus(
  umgebung: FlugUmgebung = flugUmgebungAusProzess(),
  duffelZugang: DuffelUmgebung = duffelUmgebungAusProzess(),
): FlugProvider | null {
  const zustand = flugZustand(umgebung)
  if (!zustand.aktiv) return null
  const token = duffelZugang.DUFFEL_ACCESS_TOKEN?.trim()
  if (!token || !istDuffelTestToken(token)) return null
  return duffelAdapter(token)
}
