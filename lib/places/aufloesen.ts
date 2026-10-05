// lib/places/aufloesen.ts
//
// Modelltext → höchstens ein kanonischer Ort.
// Nie raten: kein Treffer und mehrere plausible Treffer bleiben unaufgelöst.

import { gleichGefaltet } from '@/lib/airports/normalisieren'
import { istOrtId, ortPasstZurRolle, type Ort, type OrtRolle } from '@/lib/places/domain'

export type Modellort = {
  name: string | null | undefined
  countryCode?: string | null
  rolle: OrtRolle
}

export type OrtAufloesung =
  | { status: 'eindeutig'; ort: Ort }
  | { status: 'unaufgeloest'; grund: 'kein-treffer' | 'mehrdeutig' | 'ungueltig' }

/** ISO-3166 alpha-2 oder nichts. Alles andere ist untrusted und zählt nicht. */
function landescodeLesen(wert: unknown): string | null {
  if (typeof wert !== 'string') return null
  const code = wert.trim().toUpperCase()
  return /^[A-Z]{2}$/.test(code) ? code : null
}

function nameLesen(wert: unknown): string | null {
  if (typeof wert !== 'string') return null
  const name = wert.trim()
  if (!name || istOrtId(name)) return null
  return name
}

function keywordGenau(keywords: string | null, suche: string): boolean {
  if (!keywords) return false
  return keywords.split(',').some((teil) => gleichGefaltet(teil.trim(), suche))
}

function istPlausibel(ort: Ort, suche: string, rolle: OrtRolle): boolean {
  if (!ortPasstZurRolle(ort, rolle)) return false
  if (ort.typ === 'airport') {
    const code = suche.trim().toUpperCase()
    return Boolean(ort.iata && ort.iata === code) || gleichGefaltet(ort.name, suche)
  }
  return gleichGefaltet(ort.name, suche) || keywordGenau(ort.keywords, suche)
}

/**
 * Wählt höchstens einen Ort. Rangfolge der Autocomplete zählt hier nicht:
 * zwei gleich gute Treffer bleiben unaufgelöst.
 */
export function ortAufloesen(orte: Ort[], hinweis: Modellort): OrtAufloesung {
  const name = nameLesen(hinweis.name)
  if (!name) return { status: 'unaufgeloest', grund: 'ungueltig' }

  const land = landescodeLesen(hinweis.countryCode)
  const treffer = orte.filter((ort) => {
    if (land && ort.countryCode !== land) return false
    return istPlausibel(ort, name, hinweis.rolle)
  })

  if (treffer.length === 0) return { status: 'unaufgeloest', grund: 'kein-treffer' }
  if (treffer.length > 1) return { status: 'unaufgeloest', grund: 'mehrdeutig' }
  return { status: 'eindeutig', ort: treffer[0]! }
}

export function aufgeloesterOrt(orte: Ort[], hinweis: Modellort): Ort | null {
  const ergebnis = ortAufloesen(orte, hinweis)
  return ergebnis.status === 'eindeutig' ? ergebnis.ort : null
}
