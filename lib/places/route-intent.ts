// lib/places/route-intent.ts
//
// Deterministische Erkennung natürlicher Routenangaben.
// Kein Netz, keine DB, keine Place-IDs, kein Modell.
// Segmentierung erst, nachdem der ganze Eingabetext nicht als
// ein kanonischer Ort belegt ist.

import { gleichGefaltet, enthaeltGefaltet } from '@/lib/airports/normalisieren'
import type { OrtAuswahl } from '@/lib/places/auswahl'
import type { OrtOption } from '@/lib/places/domain'
import {
  ROUTE_EINSTIEG_MELDUNG,
  routeAbsendenPruefen,
  startzielAuswahlUebernehmen,
  type RouteAbsenden,
  type StartzielStand,
} from '@/lib/places/route-einstieg'
import { GRENZEN } from '@/lib/trips/schema'

export const ROUTE_INTENT_MELDUNG = {
  zuViele: ROUTE_EINSTIEG_MELDUNG.zuViele,
  ungueltig:
    'Diese Angabe enthält keine klaren Reiseziele. Bitte formuliere die Ziele neu oder wähle sie aus der Liste.',
  pendingSchlange:
    'Bitte bestätige das erkannte Ziel aus der Liste oder verwirf die erkannte Route.',
} as const

const STARKER_TRENNER = /\s*(?:,+|；|;|\r\n|\n|\r|→|->|=>|&)\s*/u
const KONJUNKTION_TRENNER = /(?:^|\s+)(?:sowie|und|and|et|e|y|i)(?:\s+|$)/iu

export type GanzerOrtSuche = { art: 'ok'; optionen: OrtOption[] } | { art: 'ausfall' }

export type RouteIntentEntscheidung =
  | { art: 'eine'; phrase: string; grund: 'ausfall' | 'ganzer_ort' | 'eine_phrase' }
  | { art: 'route'; phrasen: string[] }
  | { art: 'zuViele'; anzahl: number; meldung: string }
  | { art: 'ungueltig'; meldung: string }

export type StartzielIntentStand = StartzielStand & {
  intentPhrasen: string[]
  intentIndex: number
}

export function leererStartzielIntentStand(): StartzielIntentStand {
  return {
    vorkommen: [],
    sucheText: '',
    sucheAuswahl: null,
    sucheOffen: true,
    ersetzenKey: null,
    meldung: '',
    naechsterKey: 1,
    intentPhrasen: [],
    intentIndex: 0,
  }
}

export function routeIntentTextNormalisieren(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

export function routeIntentStatusText(gesamt: number, aktuell: number): string {
  return `${gesamt} Ziele erkannt – bitte Ziel ${aktuell} von ${gesamt} bestätigen`
}

function phraseGueltig(phrase: string): boolean {
  if (!phrase) return false
  if (phrase.length > GRENZEN.ort) return false
  return /\p{L}/u.test(phrase)
}

/**
 * Syntax-Segmentierung. Darf erst nach gescheiterter Ganzort-Prüfung
 * verwendet werden. Leere oder nur-Zeichensetzungsteile machen die
 * gesamte Angabe ungültig – keine Teilliste.
 */
export function routeIntentPhrasenLesen(text: string): string[] | null {
  const vorbereitet = text
    .replace(/[ \t\f\v]+/g, ' ')
    .replace(/[ \t]*\n[ \t]*/g, '\n')
    .trim()
  if (!vorbereitet) return null

  const phrasen: string[] = []
  for (const block of vorbereitet.split(STARKER_TRENNER)) {
    for (const stueck of block.split(KONJUNKTION_TRENNER)) {
      const phrase = stueck.replace(/\s+/g, ' ').trim()
      if (!phraseGueltig(phrase)) return null
      phrasen.push(phrase)
    }
  }
  return phrasen.length > 0 ? phrasen : null
}

function labelMitOrtskontext(frage: string, option: OrtOption): boolean {
  const teile = frage
    .split(/\s*[,;；]\s*/u)
    .map((teil) => teil.trim())
    .filter((teil) => teil.length > 0)
  if (teile.length !== 2) return false
  const [name, kontext] = teile
  if (!gleichGefaltet(option.label, name)) return false
  const beschreibung = option.description?.trim() ?? ''
  if (!beschreibung) return false
  return enthaeltGefaltet(beschreibung, kontext) || gleichGefaltet(beschreibung, kontext)
}

export function ganzerOrtGlaubwuerdig(
  query: string,
  optionen: readonly OrtOption[],
): boolean {
  const frage = routeIntentTextNormalisieren(query)
  if (!frage || optionen.length === 0) return false
  return optionen.some(
    (option) =>
      gleichGefaltet(option.label, frage) ||
      option.landAliasMatch === true ||
      labelMitOrtskontext(frage, option),
  )
}

function istOrtOptionRoh(wert: unknown): wert is OrtOption {
  if (!wert || typeof wert !== 'object') return false
  const eintrag = wert as { id?: unknown; label?: unknown; typ?: unknown }
  return typeof eintrag.id === 'string' && typeof eintrag.label === 'string' && typeof eintrag.typ === 'string'
}

/** Liest die Ganzort-Suche. 503, Netzfehler-Status und Formfehler sind Ausfall. */
export function ganzerOrtSucheLesen(status: number, json: unknown): GanzerOrtSuche {
  if (!Number.isInteger(status) || status < 200 || status >= 300) return { art: 'ausfall' }
  if (!Array.isArray(json)) return { art: 'ausfall' }
  const optionen: OrtOption[] = []
  for (const eintrag of json) {
    if (!istOrtOptionRoh(eintrag)) return { art: 'ausfall' }
    optionen.push(eintrag)
  }
  return { art: 'ok', optionen }
}

export function routeIntentEntscheiden(
  text: string,
  suche: GanzerOrtSuche,
  bereitsBestaetigt = 0,
): RouteIntentEntscheidung {
  const frage = routeIntentTextNormalisieren(text)
  if (!frage) return { art: 'ungueltig', meldung: ROUTE_INTENT_MELDUNG.ungueltig }

  if (suche.art === 'ausfall') {
    return { art: 'eine', phrase: frage, grund: 'ausfall' }
  }

  if (ganzerOrtGlaubwuerdig(frage, suche.optionen)) {
    return { art: 'eine', phrase: frage, grund: 'ganzer_ort' }
  }

  const phrasen = routeIntentPhrasenLesen(text)
  if (phrasen === null) {
    return { art: 'ungueltig', meldung: ROUTE_INTENT_MELDUNG.ungueltig }
  }
  if (phrasen.length === 1) {
    return { art: 'eine', phrase: phrasen[0]!, grund: 'eine_phrase' }
  }

  const anzahl = bereitsBestaetigt + phrasen.length
  if (anzahl > GRENZEN.etappenJeReise) {
    return { art: 'zuViele', anzahl, meldung: ROUTE_INTENT_MELDUNG.zuViele }
  }
  return { art: 'route', phrasen }
}

export function startzielIntentSchlangeAktiv(stand: StartzielIntentStand): boolean {
  return stand.intentPhrasen.length > 0
}

export function startzielIntentStatus(stand: StartzielIntentStand): string {
  if (!startzielIntentSchlangeAktiv(stand)) return ''
  return routeIntentStatusText(stand.intentPhrasen.length, stand.intentIndex + 1)
}

export function startzielIntentPlatzhalter(stand: StartzielIntentStand): string | null {
  if (!startzielIntentSchlangeAktiv(stand)) return null
  return `Ziel ${stand.intentIndex + 1} von ${stand.intentPhrasen.length} aus der Liste wählen`
}

export function startzielIntentSchlangeOeffnen(
  stand: StartzielIntentStand,
  phrasen: string[],
): StartzielIntentStand {
  const erste = phrasen[0] ?? ''
  return {
    ...stand,
    sucheText: erste,
    sucheAuswahl: null,
    sucheOffen: true,
    ersetzenKey: null,
    meldung: '',
    intentPhrasen: phrasen,
    intentIndex: 0,
  }
}

export function startzielIntentAuswahlUebernehmen(
  stand: StartzielIntentStand,
  wert: OrtAuswahl,
): StartzielIntentStand {
  const nachAuswahl = startzielAuswahlUebernehmen(stand, wert)
  if (!startzielIntentSchlangeAktiv(stand)) {
    return { ...nachAuswahl, intentPhrasen: [], intentIndex: 0 }
  }
  const naechster = stand.intentIndex + 1
  if (naechster >= stand.intentPhrasen.length) {
    return { ...nachAuswahl, intentPhrasen: [], intentIndex: 0 }
  }
  return {
    ...nachAuswahl,
    sucheText: stand.intentPhrasen[naechster] ?? '',
    sucheOffen: true,
    intentPhrasen: stand.intentPhrasen,
    intentIndex: naechster,
  }
}

export function startzielIntentSchlangeAbbrechen(stand: StartzielIntentStand): StartzielIntentStand {
  return {
    ...stand,
    intentPhrasen: [],
    intentIndex: 0,
    sucheText: '',
    sucheAuswahl: null,
    sucheOffen: stand.vorkommen.length === 0,
    ersetzenKey: null,
    meldung: '',
  }
}

export function startzielIntentTextVerwerfen(stand: StartzielIntentStand): StartzielIntentStand {
  return {
    ...stand,
    sucheText: '',
    sucheAuswahl: null,
    ersetzenKey: null,
    meldung: '',
    sucheOffen: true,
  }
}

export function startzielIntentAbsendenPruefen(stand: StartzielIntentStand): RouteAbsenden {
  if (startzielIntentSchlangeAktiv(stand)) {
    return { ok: false, meldung: ROUTE_INTENT_MELDUNG.pendingSchlange }
  }
  return routeAbsendenPruefen(stand.vorkommen, stand.sucheText, stand.ersetzenKey)
}
