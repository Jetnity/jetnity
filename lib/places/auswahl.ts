// lib/places/auswahl.ts
//
// Gemeinsame Auswahlregel für Startseite und /planen.
// Ein eingetippter Text ohne bestätigten Treffer ist kein Ort.

import { istOrtId, type OrtRolle } from '@/lib/places/domain'
import { ORT_MELDUNG, eingabeOhneAuswahl } from '@/lib/places/pruefen'

export type OrtAuswahl = {
  id: string
  name: string
}

export function auswahlFehlt(
  text: string,
  auswahl: OrtAuswahl | null | undefined,
  rolle: OrtRolle,
): string | null {
  const id = auswahl?.id
  if (eingabeOhneAuswahl(text, id) || !id) {
    return rolle === 'ziel' ? ORT_MELDUNG.zielFehlt : ORT_MELDUNG.abreiseFehlt
  }
  if (!istOrtId(id)) {
    return rolle === 'ziel' ? ORT_MELDUNG.zielUnbekannt : ORT_MELDUNG.abreiseUnbekannt
  }
  return null
}

export function reiseorteFehler(eingabe: {
  destination: string
  destinationPlaceId?: string | null
  origin: string
  originPlaceId?: string | null
}): { destination?: string; origin?: string } {
  const destination = auswahlFehlt(
    eingabe.destination,
    eingabe.destinationPlaceId
      ? { id: eingabe.destinationPlaceId, name: eingabe.destination }
      : null,
    'ziel',
  )
  const origin = auswahlFehlt(
    eingabe.origin,
    eingabe.originPlaceId ? { id: eingabe.originPlaceId, name: eingabe.origin } : null,
    'abreise',
  )
  return {
    ...(destination ? { destination } : {}),
    ...(origin ? { origin } : {}),
  }
}

export function reiseortePflicht(eingabe: {
  destination: string
  destinationPlaceId?: string | null
  origin: string
  originPlaceId?: string | null
}): string | null {
  const fehler = reiseorteFehler(eingabe)
  return fehler.destination ?? fehler.origin ?? null
}

/** Nur eine bestätigte Ziel-ID darf nach /planen als Ort mitgegeben werden. */
export function zielHref(auswahl: OrtAuswahl | null, idee?: string): string | null {
  if (!auswahl || !istOrtId(auswahl.id)) return null
  const params = new URLSearchParams()
  params.set('zielId', auswahl.id)
  if (idee?.trim()) params.set('idee', idee.trim())
  return `/planen?${params.toString()}`
}

/**
 * Kompatibler Handoff: ein Ziel bleibt `zielId`, mehrere nutzen wiederholtes `zielIds`.
 * Ungültige IDs erzeugen keinen Link. Die Route-Transportregeln liegen in route-einstieg.
 */
export function zielHrefAusListe(auswahlen: OrtAuswahl[], idee?: string): string | null {
  if (auswahlen.length === 0) return null
  if (auswahlen.length === 1) return zielHref(auswahlen[0], idee)
  if (auswahlen.some((auswahl) => !istOrtId(auswahl.id))) return null
  const params = new URLSearchParams()
  for (const auswahl of auswahlen) params.append('zielIds', auswahl.id)
  if (idee?.trim()) params.set('idee', idee.trim())
  return `/planen?${params.toString()}`
}
