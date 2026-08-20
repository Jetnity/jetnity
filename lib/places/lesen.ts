// lib/places/lesen.ts
//
// Liest public.places für die Modellauflösung. Kein Geocoding, kein Schreibweg.

import 'server-only'

import { lese } from '@/lib/api/datenbank-lesen'
import { ORT_SPALTEN, ortAusZeile, type OrtZeile } from '@/lib/places/abbildung'
import { aufgeloesterOrt, type Modellort } from '@/lib/places/aufloesen'
import { istOrtId, type Ort, type OrtRolle } from '@/lib/places/domain'
import type { KanonischeOrte } from '@/lib/places/kanon'
import { ORT_ABFRAGE, ortNamensfilter, ortSchluesselfilter } from '@/lib/places/suche'
import { ortAusBestand } from '@/lib/places/pruefen'
import { createServerActionClient } from '@/lib/supabase/server'

function alsOrt(zeile: unknown): Ort | null {
  return ortAusZeile(zeile as OrtZeile)
}

async function zeilenHolen(ids: string[], namen: string[]): Promise<Ort[] | null> {
  const client = createServerActionClient()
  const nachId = new Map<string, Ort>()

  const eindeutigeIds = [...new Set(ids.filter((id) => istOrtId(id)))]
  if (eindeutigeIds.length > 0) {
    const gelesen = await lese(() =>
      client.from('places').select(ORT_SPALTEN).in('id', eindeutigeIds),
    )
    if (gelesen.problem) return null
    for (const zeile of gelesen.zeilen) {
      const ort = alsOrt(zeile)
      if (ort) nachId.set(ort.id, ort)
    }
  }

  for (const name of [...new Set(namen.map((wert) => wert.trim()).filter(Boolean))]) {
    const namensfilter = ortNamensfilter(name)
    if (!namensfilter) continue
    const namenGelesen = await lese(() =>
      client.from('places').select(ORT_SPALTEN).or(namensfilter).limit(ORT_ABFRAGE),
    )
    if (namenGelesen.problem) return null
    for (const zeile of namenGelesen.zeilen) {
      const ort = alsOrt(zeile)
      if (ort) nachId.set(ort.id, ort)
    }

    const schluessel = ortSchluesselfilter(name)
    if (!schluessel) continue
    const extra = await lese(() =>
      client.from('places').select(ORT_SPALTEN).or(schluessel).limit(ORT_ABFRAGE),
    )
    if (extra.problem) return null
    for (const zeile of extra.zeilen) {
      const ort = alsOrt(zeile)
      if (ort) nachId.set(ort.id, ort)
    }
  }

  return [...nachId.values()]
}

function einenOrt(
  bestand: Ort[],
  hinweis: Modellort,
  behaupteteId: string | null | undefined,
): Ort | null {
  if (behaupteteId) {
    const bekannt = ortAusBestand(bestand, behaupteteId, hinweis.rolle)
    if (bekannt) return bekannt
  }
  return aufgeloesterOrt(bestand, hinweis)
}

export async function kanonischeOrteLesen(eingabe: {
  origin: Modellort
  stages: Modellort[]
  behaupteteIds?: { origin?: string | null; stages?: Array<string | null> }
}): Promise<KanonischeOrte> {
  const namen = [
    eingabe.origin.name ?? '',
    ...eingabe.stages.map((etappe) => etappe.name ?? ''),
  ]
  const ids = [
    eingabe.behaupteteIds?.origin ?? '',
    ...(eingabe.behaupteteIds?.stages ?? []),
  ].filter((wert): wert is string => typeof wert === 'string' && wert.length > 0)

  const bestand = await zeilenHolen(ids, namen)
  if (!bestand) {
    return { origin: null, stages: eingabe.stages.map(() => null) }
  }

  return {
    origin: einenOrt(bestand, eingabe.origin, eingabe.behaupteteIds?.origin),
    stages: eingabe.stages.map((etappe, stelle) =>
      einenOrt(bestand, etappe, eingabe.behaupteteIds?.stages?.[stelle]),
    ),
  }
}

export async function reiseOrteKanonisieren<T extends {
  origin: string | null
  originPlaceId: string | null
  stages: { name: string; countryCode: string | null; placeId: string | null }[]
}>(reise: T): Promise<KanonischeOrte> {
  return kanonischeOrteLesen({
    origin: { name: reise.origin, countryCode: null, rolle: 'abreise' as OrtRolle },
    stages: reise.stages.map((etappe) => ({
      name: etappe.name,
      countryCode: etappe.countryCode,
      rolle: 'ziel' as const,
    })),
    behaupteteIds: {
      origin: reise.originPlaceId,
      stages: reise.stages.map((etappe) => etappe.placeId),
    },
  })
}
