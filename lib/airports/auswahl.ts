// lib/airports/auswahl.ts
//
// Bestätigte Flughafenwahl für die Workspace-Flugsuche.
// Freitext ist keine IATA-Wahrheit.

import { iataLesen } from '@/lib/route/referenz'

export type FlughafenAuswahl = {
  iata: string
  name: string
}

export const FLUGHAFEN_MELDUNG = {
  fehlt: 'Bitte wähle einen Flughafen aus der Liste.',
  unbekannt: 'Dieser Flughafen ist unbekannt. Bitte wähle einen Eintrag aus der Liste.',
  gleich: 'Abflug und Ankunft dürfen nicht derselbe Flughafen sein.',
} as const

export function iataBestaetigt(auswahl: FlughafenAuswahl | null | undefined): string | null {
  return iataLesen(auswahl?.iata ?? null)
}

export function flughafenAusFreitext(text: string | null | undefined): FlughafenAuswahl | null {
  void text
  return null
}

export function flughafenAusReiseort(eingabe: {
  placeId?: string | null
  name?: string | null
}): FlughafenAuswahl | null {
  const treffer = eingabe.placeId?.trim().match(/^airport:([A-Z]{3})$/)
  if (!treffer?.[1]) return null
  const name = eingabe.name?.trim()
  return {
    iata: treffer[1],
    name: name && !iataLesen(name) ? name : `${treffer[1]}`,
  }
}

export function flugSucheBeine(eingabe: {
  herkunft: FlughafenAuswahl | null
  ziel: FlughafenAuswahl | null
  herkunftText: string
  zielText: string
  hin: string
  rueck?: string
  mitRueck: boolean
}):
  | {
      legs: Array<{ origin: string; destination: string; date: string }>
    }
  | { fehler: { herkunft?: string; ziel?: string; allgemein?: string } } {
  const origin = iataBestaetigt(eingabe.herkunft)
  const destination = iataBestaetigt(eingabe.ziel)
  const fehler: { herkunft?: string; ziel?: string; allgemein?: string } = {}

  if (!origin) {
    fehler.herkunft = eingabe.herkunftText.trim() ? FLUGHAFEN_MELDUNG.unbekannt : FLUGHAFEN_MELDUNG.fehlt
  }
  if (!destination) {
    fehler.ziel = eingabe.zielText.trim() ? FLUGHAFEN_MELDUNG.unbekannt : FLUGHAFEN_MELDUNG.fehlt
  }
  if (origin && destination && origin === destination) {
    fehler.allgemein = FLUGHAFEN_MELDUNG.gleich
  }
  if (fehler.herkunft || fehler.ziel || fehler.allgemein) return { fehler }

  const legs = [{ origin: origin!, destination: destination!, date: eingabe.hin }]
  if (eingabe.mitRueck && eingabe.rueck) {
    legs.push({ origin: destination!, destination: origin!, date: eingabe.rueck })
  }
  return { legs }
}
