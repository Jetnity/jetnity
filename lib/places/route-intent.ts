// lib/places/route-intent.ts
//
// Deterministische Erkennung natürlicher Routenangaben.
// Kein Netz, keine DB, keine Place-IDs, kein Modell.
// Segmentierung erst, nachdem der ganze Eingabetext nicht als
// ein kanonischer Ort belegt ist. Jeder weitere Konjunktionsblock
// wird erneut gegen denselben Ganzort-Beweis geprüft.

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
  mehrdeutig:
    'Diese Angabe ist nicht eindeutig. Bitte trenne die Ziele mit Kommas oder wähle sie nacheinander aus der Liste.',
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
  | { art: 'mehrdeutig'; meldung: string }

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

function textVorbereiten(text: string): string {
  return text
    .replace(/[ \t\f\v]+/g, ' ')
    .replace(/[ \t]*\n[ \t]*/g, '\n')
    .trim()
}

/**
 * Nur starke Trenner. Konjunktionen bleiben im Block, bis ein
 * kanonischer Ganzort-Beweis den Block freigibt oder schützt.
 */
export function routeIntentStarkBloecke(text: string): string[] | null {
  const vorbereitet = textVorbereiten(text)
  if (!vorbereitet) return null
  const bloecke: string[] = []
  for (const block of vorbereitet.split(STARKER_TRENNER)) {
    const phrase = block.replace(/\s+/g, ' ').trim()
    if (!phraseGueltig(phrase)) return null
    bloecke.push(phrase)
  }
  return bloecke.length > 0 ? bloecke : null
}

export function routeIntentKonjunktionsTeile(block: string): string[] | null {
  const teile = block.split(KONJUNKTION_TRENNER).map((teil) => teil.replace(/\s+/g, ' ').trim())
  if (teile.some((teil) => !phraseGueltig(teil))) return null
  return teile.length > 0 ? teile : null
}

function indexImBlock(block: string, nadel: string, erste: boolean): number {
  const heu = block.toLowerCase()
  const such = nadel.toLowerCase()
  return erste ? heu.indexOf(such) : heu.lastIndexOf(such)
}

export function routeIntentPhraseAusSpanne(
  block: string,
  teile: readonly string[],
  von: number,
  bisExkl: number,
): string {
  if (von === 0 && bisExkl === teile.length) return routeIntentTextNormalisieren(block)
  const anfang = teile[von]
  const ende = teile[bisExkl - 1]
  if (!anfang || !ende) return ''
  const start = indexImBlock(block, anfang, true)
  const letztes = indexImBlock(block, ende, false)
  if (start < 0 || letztes < 0) return teile.slice(von, bisExkl).join(' und ')
  return routeIntentTextNormalisieren(block.slice(start, letztes + ende.length))
}

/**
 * Reine Syntax. Nicht die Produktionsentscheidung für zusammengesetzte
 * Ortsnamen. Die kanonische Prüfung liegt in `routeIntentEntscheiden`.
 */
export function routeIntentPhrasenLesen(text: string): string[] | null {
  const bloecke = routeIntentStarkBloecke(text)
  if (!bloecke) return null
  const phrasen: string[] = []
  for (const block of bloecke) {
    const teile = routeIntentKonjunktionsTeile(block)
    if (!teile) return null
    phrasen.push(...teile)
  }
  return phrasen.length > 0 ? phrasen : null
}

export type RouteIntentBeweise = Record<string, GanzerOrtSuche>

function beweisFuer(
  frage: string,
  beweise: RouteIntentBeweise | undefined,
): GanzerOrtSuche | undefined {
  return beweise?.[routeIntentTextNormalisieren(frage)]
}

/**
 * Zusätzliche Ganzort-Suchen nach der Gesamteingabe: jeder
 * Konjunktionsblock ungleich dem Gesamtwortlaut plus alle
 * zusammengesetzten Spannen bei drei oder mehr Teilen.
 */
export function routeIntentZusatzsuchen(text: string): string[] {
  const frage = routeIntentTextNormalisieren(text)
  const bloecke = routeIntentStarkBloecke(text)
  if (!bloecke || !frage) return []
  const suchen = new Set<string>()
  for (const block of bloecke) {
    const teile = routeIntentKonjunktionsTeile(block)
    if (!teile || teile.length < 2) continue
    const norm = routeIntentTextNormalisieren(block)
    if (norm !== frage) suchen.add(norm)
    if (teile.length < 3) continue
    for (let von = 0; von < teile.length; von += 1) {
      for (let bis = von + 2; bis <= teile.length; bis += 1) {
        const phrase = routeIntentTextNormalisieren(
          routeIntentPhraseAusSpanne(block, teile, von, bis),
        )
        if (phrase && phrase !== frage) suchen.add(phrase)
      }
    }
  }
  return [...suchen]
}

function blockBeweis(
  block: string,
  suche: GanzerOrtSuche,
  frage: string,
  beweise: RouteIntentBeweise | undefined,
): GanzerOrtSuche | undefined {
  const direkt = beweisFuer(block, beweise)
  if (direkt) return direkt
  if (routeIntentTextNormalisieren(block) === frage) return suche
  return undefined
}

function maximaleBelegteSpannen(
  belegte: readonly { von: number; bis: number; phrase: string }[],
): { von: number; bis: number; phrase: string }[] {
  return belegte.filter(
    (span) =>
      !belegte.some(
        (andere) =>
          (andere.von !== span.von || andere.bis !== span.bis) &&
          andere.von <= span.von &&
          andere.bis >= span.bis,
      ),
  )
}

function konjunktionsBlockZerlegen(
  block: string,
  suche: GanzerOrtSuche,
  frage: string,
  beweise: RouteIntentBeweise | undefined,
): { art: 'phrasen'; phrasen: string[] } | { art: 'mehrdeutig' } | { art: 'ungueltig' } {
  const teile = routeIntentKonjunktionsTeile(block)
  if (!teile) return { art: 'ungueltig' }
  const ganz = routeIntentTextNormalisieren(block)
  if (teile.length === 1) return { art: 'phrasen', phrasen: [ganz] }

  const beweis = blockBeweis(block, suche, frage, beweise)
  if (!beweis || beweis.art === 'ausfall') {
    return { art: 'phrasen', phrasen: [ganz] }
  }
  if (ganzerOrtGlaubwuerdig(block, beweis.optionen)) {
    return { art: 'phrasen', phrasen: [ganz] }
  }

  if (teile.length === 2) {
    return { art: 'phrasen', phrasen: teile }
  }

  const belegte: { von: number; bis: number; phrase: string }[] = []
  for (let von = 0; von < teile.length; von += 1) {
    for (let bis = von + 2; bis <= teile.length; bis += 1) {
      const phrase = routeIntentPhraseAusSpanne(block, teile, von, bis)
      const spanBeweis = blockBeweis(phrase, suche, frage, beweise)
      if (!spanBeweis || spanBeweis.art === 'ausfall') {
        return { art: 'phrasen', phrasen: [ganz] }
      }
      if (ganzerOrtGlaubwuerdig(phrase, spanBeweis.optionen)) {
        belegte.push({ von, bis, phrase })
      }
    }
  }

  if (belegte.length === 0) return { art: 'mehrdeutig' }

  const maximal = maximaleBelegteSpannen(belegte).sort((links, rechts) => links.von - rechts.von)
  for (let index = 1; index < maximal.length; index += 1) {
    if (maximal[index]!.von < maximal[index - 1]!.bis) {
      return { art: 'mehrdeutig' }
    }
  }

  const phrasen: string[] = []
  let position = 0
  let spanIndex = 0
  while (position < teile.length) {
    const span = maximal[spanIndex]
    if (span && span.von === position) {
      phrasen.push(routeIntentTextNormalisieren(span.phrase))
      position = span.bis
      spanIndex += 1
      continue
    }
    if (span && span.von < position) return { art: 'mehrdeutig' }
    phrasen.push(teile[position]!)
    position += 1
  }
  return { art: 'phrasen', phrasen }
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
  beweise?: RouteIntentBeweise,
): RouteIntentEntscheidung {
  const frage = routeIntentTextNormalisieren(text)
  if (!frage) return { art: 'ungueltig', meldung: ROUTE_INTENT_MELDUNG.ungueltig }

  if (suche.art === 'ausfall') {
    return { art: 'eine', phrase: frage, grund: 'ausfall' }
  }

  if (ganzerOrtGlaubwuerdig(frage, suche.optionen)) {
    return { art: 'eine', phrase: frage, grund: 'ganzer_ort' }
  }

  const bloecke = routeIntentStarkBloecke(text)
  if (!bloecke) {
    return { art: 'ungueltig', meldung: ROUTE_INTENT_MELDUNG.ungueltig }
  }

  const phrasen: string[] = []
  for (const block of bloecke) {
    const zerlegt = konjunktionsBlockZerlegen(block, suche, frage, beweise)
    if (zerlegt.art === 'ungueltig') {
      return { art: 'ungueltig', meldung: ROUTE_INTENT_MELDUNG.ungueltig }
    }
    if (zerlegt.art === 'mehrdeutig') {
      return { art: 'mehrdeutig', meldung: ROUTE_INTENT_MELDUNG.mehrdeutig }
    }
    phrasen.push(...zerlegt.phrasen)
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
