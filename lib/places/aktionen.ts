// lib/places/aktionen.ts
//
// Serverprüfung einer Client-Auswahl. Dieselbe Regel für Konto und Gast.

'use server'

import { ORT_ROLLEN, istOrtId, type Ort, type OrtRolle } from '@/lib/places/domain'
import { ORT_SPALTEN, ortAusZeile, type OrtZeile } from '@/lib/places/abbildung'
import { ORT_MELDUNG, ortAusBestand } from '@/lib/places/pruefen'
import { reisezielIdsLesen, reisezieleAusBestand } from '@/lib/places/reiseziele'
import { createServerActionClient } from '@/lib/supabase/server'
import { GRENZEN } from '@/lib/trips/schema'

export type OrtBestaetigung =
  | { ok: true; wert: Ort }
  | { ok: false; meldung: string }

export type ReiseorteBestaetigung =
  | { ok: true; ziel: Ort; abreise: Ort; weitereZiele: Ort[] }
  | { ok: false; meldung: string; feld?: 'destination' | 'origin'; zielIndex?: number }

async function zeileLesen(id: string): Promise<Ort | null> {
  const { data, error } = await createServerActionClient()
    .from('places')
    .select(ORT_SPALTEN)
    .eq('id', id)
    .maybeSingle()
  if (error || !data) return null
  return ortAusZeile(data as OrtZeile)
}

async function zeilenLesen(ids: string[]): Promise<Ort[] | null> {
  const eindeutig = [...new Set(ids.filter((id) => istOrtId(id)))]
  if (eindeutig.length === 0) return []
  if (eindeutig.length > GRENZEN.etappenJeReise + 1) return null

  const { data, error } = await createServerActionClient()
    .from('places')
    .select(ORT_SPALTEN)
    .in('id', eindeutig)
  if (error || !data) return null
  return data
    .map((zeile) => ortAusZeile(zeile as OrtZeile))
    .filter((ort): ort is Ort => ort !== null)
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
  weitereZielIds?: unknown
}): Promise<ReiseorteBestaetigung> {
  const zielIds = reisezielIdsLesen(eingabe.zielId, eingabe.weitereZielIds)
  if (!zielIds.ok) {
    return {
      ok: false,
      meldung: zielIds.meldung,
      feld: 'destination',
      zielIndex: zielIds.zielIndex,
    }
  }

  if (typeof eingabe.abreiseId !== 'string' || !istOrtId(eingabe.abreiseId)) {
    return { ok: false, meldung: ORT_MELDUNG.abreiseUnbekannt, feld: 'origin' }
  }

  const bestand = await zeilenLesen([eingabe.abreiseId, ...zielIds.ids])
  if (!bestand) {
    return { ok: false, meldung: ORT_MELDUNG.idUngueltig }
  }

  const abreise = ortAusBestand(bestand, eingabe.abreiseId, ORT_ROLLEN[1])
  if (!abreise) {
    return { ok: false, meldung: ORT_MELDUNG.abreiseUnbekannt, feld: 'origin' }
  }

  const ziele = reisezieleAusBestand(bestand, zielIds.ids)
  if (!ziele.ok) {
    return {
      ok: false,
      meldung: ziele.meldung,
      feld: 'destination',
      zielIndex: ziele.zielIndex,
    }
  }

  const [ziel, ...weitereZiele] = ziele.ziele
  if (!ziel) {
    return { ok: false, meldung: ORT_MELDUNG.zielUnbekannt, feld: 'destination', zielIndex: 0 }
  }
  return { ok: true, ziel, abreise, weitereZiele }
}
