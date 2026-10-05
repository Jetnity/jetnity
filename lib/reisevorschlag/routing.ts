// lib/reisevorschlag/routing.ts
//
// Welches Modell eine komplette Reiseplanung übernimmt.
//
// Kein zusätzlicher Modellaufruf. Die Wahl steht im Text, in festen Mustern,
// und ist deshalb im Test ohne Schlüssel prüfbar.
//
//   · Luna plant keine komplette Reise. Sie bleibt für spätere, sehr einfache
//     Hilfsaufgaben reserviert – nicht für diesen Weg.
//   · Terra ist der Standard: normale Planung, kürzere Laufzeit, Fallback.
//   · Sol nur bei komplexen Abwägungen (viele Ziele, Inseln, Nord–Süd,
//     Roadtrip, Widersprüche, mehrere Verkehrsmittel, enge Grenzen).
//
// `JETNITY_MODELL_NAME` bleibt der manuelle Stift: Probe und Betrieb können
// ein Modell festlegen. Ohne Stift entscheidet dieser Text.
//
// Frei von Next, Supabase und `process.env`.

import { MODELLE, type Modellname } from '@/lib/modell/preise'

export type Planungspfad = 'terra' | 'sol'

export type Planungwahl = {
  pfad: Planungspfad
  modell: Modellname
  gruende: string[]
}

const SOL_MODELL: Modellname = 'gpt-5.6-sol'
const TERRA_MODELL: Modellname = 'gpt-5.6-terra'

/** Ab dieser Punktzahl geht die Planung an Sol. Ein starkes Signal reicht. */
export const SOL_SCHWELLE = 2

function kleingeschrieben(text: string): string {
  return text.normalize('NFC').toLocaleLowerCase('de-CH')
}

function dauerTage(text: string): number | null {
  const wochenZahl = text.match(/(\d+)\s*wochen?\b/i)
  if (wochenZahl) return Number(wochenZahl[1]) * 7
  if (/\bzwei wochen\b/i.test(text)) return 14
  if (/\beine woche\b/i.test(text)) return 7

  const tage = text.match(/(\d{1,3})\s*tage?\b/i)
  if (tage) return Number(tage[1])

  const vonBis = text.match(
    /vom\s+(\d{1,2})\.\s*(?:bis\s+)?(\d{1,2})\.\s*(\w+)?\s*(\d{4})/i,
  )
  if (vonBis) {
    const start = Number(vonBis[1])
    const ende = Number(vonBis[2])
    if (ende >= start) return ende - start + 1
  }
  return null
}

/** Grobe Ortszahl: Aufzählungen und „von X nach Y“, keine Gazetteer. */
function ortssignale(text: string): number {
  const klein = kleingeschrieben(text)
  let zahl = 0

  const aufzaehlung = text.match(
    /(?:nach|in|:)\s*[A-ZÄÖÜ][\wäöüéèâ\-]+(?:\s*,\s*[A-ZÄÖÜ][\wäöüéèâ\-]+){1,}(?:\s+und\s+[A-ZÄÖÜ][\wäöüéèâ\-]+)?/,
  )
  if (aufzaehlung) {
    zahl = Math.max(zahl, aufzaehlung[0].split(/,| und /i).length)
  }

  if (/\bvon\s+[A-ZÄÖÜ][\wäöüéèâ\-]+\s+nach\s+[A-ZÄÖÜ][\wäöüéèâ\-]+/.test(text)) {
    zahl = Math.max(zahl, 2)
  }

  if (/(algarve|kyklad|yosemite)/i.test(klein)) zahl += 1

  return zahl
}

function widerspruch(text: string, tage: number | null): boolean {
  const klein = kleingeschrieben(text)
  if (/\bwochenend/.test(klein) && tage !== null && tage > 3) return true

  const alleTage = [...text.matchAll(/(\d{1,3})\s*tage?\b/gi)].map((m) => Number(m[1]))
  if (new Set(alleTage).size > 1) return true

  if (/\bvom\s+\d/.test(klein) && /\bbis\s+\d/.test(klein) && tage !== null && /\bwochenend/.test(klein)) {
    return true
  }
  return false
}

function transportarten(text: string): number {
  const klein = kleingeschrieben(text)
  let n = 0
  if (/\bflug|\bfliegen|\bflughafen/.test(klein)) n += 1
  if (/\bzug|\bbahn|\bshinkansen|\bfähr|\bfaehr|\bfähre|\bfaehre/.test(klein)) n += 1
  if (/\bmietwagen|\bauto\b|\broad\s*trip|\bper auto/.test(klein)) n += 1
  return n
}

function engesBudget(text: string): boolean {
  const klein = kleingeschrieben(text)
  if (/\bknapp|\bsparsam|\bgünstig|\bguenstig|\bbillig/.test(klein)) return true
  const betrag = klein.match(/maximal\s+(?:chf|eur|usd|€|fr\.?)?\s*(\d{1,5})(?:[’']\d{3})?/)
  if (!betrag) return false
  return Number(betrag[1].replace(/[’']/g, '')) <= 800
}

function komfortGegenVieleWuensche(text: string, orte: number, tage: number | null): boolean {
  const klein = kleingeschrieben(text)
  const ruhig = /\bruhig|\bentspann|\bnicht zu stress|\bnicht zu viel programm|\bgemütlich|\bgemuetlich/.test(
    klein,
  )
  if (!ruhig) return false
  return orte >= 2 || (tage !== null && tage >= 10)
}

/**
 * Welche Planung die Beschreibung braucht – ohne Modell, ohne Zufall.
 */
export function planungspfad(freitext: string): Planungwahl {
  const text = freitext.trim()
  const klein = kleingeschrieben(text)
  const tage = dauerTage(text)
  const orte = ortssignale(text)
  const gruende: string[] = []
  let punkte = 0

  if (orte >= 3) {
    punkte += 2
    gruende.push('mehrere-ziele')
  } else if (orte >= 2 && (tage ?? 0) >= 10) {
    punkte += 2
    gruende.push('lange-mehrzielreise')
  }

  if (/\binsel|\bkyklad|\bfähr|\bfaehr|\bisland hop/.test(klein)) {
    punkte += 2
    gruende.push('insel-transfers')
  }

  if (/\broad\s*trip|\bmietwagen|\bper auto|\byosemite|\bwestküste|\bwestkueste/.test(klein)) {
    punkte += 2
    gruende.push('roadtrip')
  }

  if (/\bvon\s+\w+\s+nach\s+\w+/.test(klein) && (tage ?? 0) >= 8) {
    punkte += 2
    gruende.push('strecke-nord-sued')
  }

  if (widerspruch(text, tage)) {
    punkte += 2
    gruende.push('widerspruch')
  }

  if (transportarten(text) >= 2) {
    punkte += 1
    gruende.push('mehrere-verkehrsmittel')
  }

  if (engesBudget(text) && (orte >= 2 || (tage ?? 0) >= 7)) {
    punkte += 1
    gruende.push('enges-budget')
  }

  if (komfortGegenVieleWuensche(text, orte, tage)) {
    punkte += 1
    gruende.push('komfort-gegen-wuensche')
  }

  if ((tage ?? 0) >= 12 && orte >= 2) {
    punkte += 1
    gruende.push('lange-logistik')
  }

  if (punkte >= SOL_SCHWELLE) {
    return { pfad: 'sol', modell: SOL_MODELL, gruende }
  }
  return { pfad: 'terra', modell: TERRA_MODELL, gruende }
}

/** Manueller Stift gewinnt. Sonst der Pfad aus dem Text. Luna nie automatisch. */
export function modellFuerReisevorschlag(
  freitext: string,
  festgelegt?: string,
): Modellname {
  const stift = festgelegt?.trim()
  if (stift && (MODELLE as readonly string[]).includes(stift)) return stift as Modellname
  return planungspfad(freitext).modell
}
