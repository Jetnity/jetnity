// Dieselbe Referenz für Modellauflösung und Reiseänderung. Kein Schreibweg.
import 'server-only'

import { lese } from '@/lib/api/datenbank-lesen'
import { ORT_SPALTEN, ortAusZeile, type OrtZeile } from '@/lib/places/abbildung'
import type { Ort } from '@/lib/places/domain'
import { kanonischeOrteLauf, type OrtsHinweise } from '@/lib/places/lesen-lauf'
import { ORT_MELDUNG } from '@/lib/places/pruefen'
import { ortExaktfilter } from '@/lib/places/suche'
import { createServerActionClient } from '@/lib/supabase/server'
import type { KanonischeOrtsLesung } from '@/lib/places/kanon'

export async function kanonischeOrteLesen(eingabe: OrtsHinweise): Promise<KanonischeOrtsLesung> {
  try {
    const client = await createServerActionClient()
    return await kanonischeOrteLauf(eingabe, async (anfrage) => {
      const gelesen = await lese(() => {
        const query = client.from('places').select(ORT_SPALTEN)
        if ('ids' in anfrage) return query.in('id', anfrage.ids)
        const filter = ortExaktfilter(anfrage.hinweis.name ?? '')
        if (!filter) return Promise.resolve({ data: [], error: null })
        const rollenQuery = anfrage.hinweis.rolle === 'abreise'
          ? query.in('typ', ['city', 'airport']) : query.neq('typ', 'airport')
        const code = anfrage.hinweis.countryCode?.trim().toUpperCase()
        const mitLand = code && /^[A-Z]{2}$/.test(code) ? rollenQuery.eq('country_code', code) : rollenQuery
        return mitLand.or(filter).order('id').limit(anfrage.limit)
      })
      if (gelesen.problem) return gelesen
      return { zeilen: gelesen.zeilen.map((z) => ortAusZeile(z as OrtZeile)).filter((ort): ort is Ort => ort !== null), problem: null }
    })
  } catch {
    return { ok: false, meldung: ORT_MELDUNG.nichtErreichbar }
  }
}

export async function reiseOrteKanonisieren<T extends {
  origin: string | null
  originPlaceId: string | null
  stages: { name: string; countryCode: string | null; placeId: string | null }[]
}>(reise: T): Promise<KanonischeOrtsLesung> {
  return kanonischeOrteLesen({
    origin: { name: reise.origin, countryCode: null, rolle: 'abreise' },
    stages: reise.stages.map((etappe) => ({ name: etappe.name, countryCode: etappe.countryCode, rolle: 'ziel' })),
    behaupteteIds: { origin: reise.originPlaceId, stages: reise.stages.map((etappe) => etappe.placeId) },
  })
}
