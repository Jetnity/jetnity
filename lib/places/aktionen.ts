// lib/places/aktionen.ts
//
// Serverprüfung einer Client-Auswahl. Dieselbe Regel für Konto und Gast.

'use server'

import { ORT_ROLLEN, istOrtId, type Ort, type OrtRolle } from '@/lib/places/domain'
import { ORT_SPALTEN, ortAusZeile, type OrtZeile } from '@/lib/places/abbildung'
import { ORT_MELDUNG, ortAusBestand } from '@/lib/places/pruefen'
import { createServerActionClient } from '@/lib/supabase/server'

export type OrtBestaetigung =
  | { ok: true; wert: Ort }
  | { ok: false; meldung: string }

async function zeileLesen(id: string): Promise<Ort | null> {
  const { data, error } = await createServerActionClient()
    .from('places')
    .select(ORT_SPALTEN)
    .eq('id', id)
    .maybeSingle()
  if (error || !data) return null
  return ortAusZeile(data as OrtZeile)
}

export async function ortBestaetigen(id: unknown, rolle: unknown): Promise<OrtBestaetigung> {
  if (rolle !== 'ziel' && rolle !== 'abreise') {
    return { ok: false, meldung: ORT_MELDUNG.idUngueltig }
  }
  if (typeof id !== 'string' || !istOrtId(id)) {
    return { ok: false, meldung: rolle === 'ziel' ? ORT_MELDUNG.zielUnbekannt : ORT_MELDUNG.abreiseUnbekannt }
  }
  const ort = await zeileLesen(id)
  if (!ort || !ortAusBestand([ort], id, rolle as OrtRolle)) {
    return { ok: false, meldung: rolle === 'ziel' ? ORT_MELDUNG.zielUnbekannt : ORT_MELDUNG.abreiseUnbekannt }
  }
  return { ok: true, wert: ort }
}

export async function reiseorteBestaetigen(eingabe: {
  zielId: unknown
  abreiseId: unknown
}): Promise<{ ok: true; ziel: Ort; abreise: Ort } | { ok: false; meldung: string }> {
  const ziel = await ortBestaetigen(eingabe.zielId, ORT_ROLLEN[0])
  if (!ziel.ok) return ziel
  const abreise = await ortBestaetigen(eingabe.abreiseId, ORT_ROLLEN[1])
  if (!abreise.ok) return abreise
  return { ok: true, ziel: ziel.wert, abreise: abreise.wert }
}
