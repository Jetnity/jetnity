// lib/places/reiseziele.ts
//
// Geordnete Create-Zielliste aus bestätigter Places-Evidence.
// Duplikate bleiben: Paris → Rom → Paris sind drei Ziele.

import { istOrtId, type Ort } from '@/lib/places/domain'
import { ORT_MELDUNG, ortAusBestand } from '@/lib/places/pruefen'
import { GRENZEN } from '@/lib/trips/schema'

export type ReisezielIdsErgebnis =
  | { ok: true; ids: string[] }
  | { ok: false; meldung: string; zielIndex?: number }

export type ReisezieleAusBestandErgebnis =
  | { ok: true; ziele: Ort[] }
  | { ok: false; meldung: string; zielIndex?: number }

const GEONAMES_ZIEL = /^geonames:\d+$/

export function weitereZielIdsLesen(wert: unknown): ReisezielIdsErgebnis {
  if (wert == null) return { ok: true, ids: [] }
  if (!Array.isArray(wert)) {
    return { ok: false, meldung: ORT_MELDUNG.zielUnbekannt }
  }
  if (wert.length > GRENZEN.etappenJeReise - 1) {
    return {
      ok: false,
      meldung: `Höchstens ${GRENZEN.etappenJeReise} Reiseziele sind möglich.`,
    }
  }

  const ids: string[] = []
  for (let index = 0; index < wert.length; index += 1) {
    const eintrag = wert[index]
    if (typeof eintrag !== 'string' || !GEONAMES_ZIEL.test(eintrag) || !istOrtId(eintrag)) {
      return { ok: false, meldung: ORT_MELDUNG.zielUnbekannt, zielIndex: index + 1 }
    }
    ids.push(eintrag)
  }
  return { ok: true, ids }
}

export function reisezielIdsLesen(erste: unknown, weitere: unknown): ReisezielIdsErgebnis {
  if (typeof erste !== 'string' || !GEONAMES_ZIEL.test(erste) || !istOrtId(erste)) {
    return { ok: false, meldung: ORT_MELDUNG.zielUnbekannt, zielIndex: 0 }
  }
  const rest = weitereZielIdsLesen(weitere)
  if (!rest.ok) return rest
  return { ok: true, ids: [erste, ...rest.ids] }
}

/**
 * Mappt IDs in Eingabereihenfolge auf kanonische Orte.
 * Fehlende oder rollenfremde IDs scheitern fail-closed.
 */
export function reisezieleAusBestand(bestand: Ort[], ids: string[]): ReisezieleAusBestandErgebnis {
  const ziele: Ort[] = []
  for (let index = 0; index < ids.length; index += 1) {
    const id = ids[index]
    const ort = ortAusBestand(bestand, id, 'ziel')
    if (!ort) {
      return { ok: false, meldung: ORT_MELDUNG.zielUnbekannt, zielIndex: index }
    }
    ziele.push(ort)
  }
  return { ok: true, ziele }
}
