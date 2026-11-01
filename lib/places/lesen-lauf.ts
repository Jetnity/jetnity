import type { Lesung } from '@/lib/api/datenbank-lesen'
import { ortAufloesen, type Modellort } from '@/lib/places/aufloesen'
import { istOrtId, type Ort } from '@/lib/places/domain'
import type { KanonischeOrtsLesung } from '@/lib/places/kanon'
import { ortAusBestand, ORT_MELDUNG } from '@/lib/places/pruefen'

export const ORT_AUFLOESUNG_MAX = 80
export type OrtsHinweise = {
  origin: Modellort
  stages: Modellort[]
  behaupteteIds?: { origin?: string | null; stages?: Array<string | null> }
}
export type OrtsLeser = (anfrage: { ids: string[] } | { hinweis: Modellort; limit: number }) => Promise<Lesung<Ort>>

/** Eine abgeschnittene Kandidatenmenge beweist niemals Eindeutigkeit. */
export async function kanonischeOrteLauf(eingabe: OrtsHinweise, lesen: OrtsLeser): Promise<KanonischeOrtsLesung> {
  const hinweise = [eingabe.origin, ...eingabe.stages]
  const ids = [eingabe.behaupteteIds?.origin, ...(eingabe.behaupteteIds?.stages ?? [])]
  const bestaetigteIds = [...new Set(ids.filter((id): id is string => typeof id === 'string' && istOrtId(id)))]
  const bestand = bestaetigteIds.length ? await lesen({ ids: bestaetigteIds }) : { zeilen: [], problem: null }
  if (bestand.problem) return { ok: false, meldung: ORT_MELDUNG.nichtErreichbar }
  const ergebnisse: Array<Ort | null> = []
  for (let index = 0; index < hinweise.length; index += 1) {
    const hinweis = hinweise[index]!
    const id = ids[index]
    const bekannt = id ? ortAusBestand(bestand.zeilen, id, hinweis.rolle) : null
    if (bekannt) {
      const code = hinweis.countryCode?.trim().toUpperCase()
      const widerspruch = (code && code !== bekannt.countryCode) ||
        (hinweis.name?.trim() && ortAufloesen([bekannt], hinweis).status !== 'eindeutig')
      if (widerspruch) return { ok: false, meldung: ORT_MELDUNG.widerspruch }
      ergebnisse.push(bekannt)
      continue
    }
    if (!hinweis.name?.trim()) { ergebnisse.push(null); continue }
    const gelesen = await lesen({ hinweis, limit: ORT_AUFLOESUNG_MAX + 1 })
    if (gelesen.problem) return { ok: false, meldung: ORT_MELDUNG.nichtErreichbar }
    if (gelesen.zeilen.length > ORT_AUFLOESUNG_MAX) { ergebnisse.push(null); continue }
    const aufloesung = ortAufloesen(gelesen.zeilen, hinweis)
    ergebnisse.push(aufloesung.status === 'eindeutig' ? aufloesung.ort : null)
  }
  return { ok: true, orte: { origin: ergebnisse[0] ?? null, stages: ergebnisse.slice(1) } }
}
