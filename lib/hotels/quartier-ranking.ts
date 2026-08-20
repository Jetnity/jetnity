// lib/hotels/quartier-ranking.ts
//
// Deterministische Quartierwahl vor der Hotelsuche.
// Höherer Score ist besser. Keine Provision, kein Provider, kein Sprachmodell.

import type { BewertetesQuartier, QuartierKandidat, QuartierPraeferenzen, QuartierSuchkontext } from '@/lib/hotels/domain'

export const QUARTIER_GEWICHTE = {
  reisewege: 35,
  transfer: 15,
  mobilitaet: 15,
  praeferenzen: 25,
  budget: 10,
} as const

function clamp01(wert: number): number {
  return Math.max(0, Math.min(1, wert))
}

function lowerBetter(wert: number | null, min: number, max: number): number {
  if (wert === null) return 0.5
  if (max <= min) return 1
  return 1 - clamp01((wert - min) / (max - min))
}

function vorhandeneZahlen(kandidaten: QuartierKandidat[], lesen: (k: QuartierKandidat) => number | null): number[] {
  return kandidaten.map(lesen).filter((wert): wert is number => wert !== null && Number.isFinite(wert))
}

function minMax(werte: number[]): { min: number; max: number } {
  if (werte.length === 0) return { min: 0, max: 0 }
  return { min: Math.min(...werte), max: Math.max(...werte) }
}

function transferMinuten(kandidat: QuartierKandidat, context: QuartierSuchkontext): number | null {
  const teile: Array<{ minuten: number; gewicht: number }> = []
  if (kandidat.anreiseTransferMinuten !== null && context.transferPrioritaet.anreise > 0) {
    teile.push({ minuten: kandidat.anreiseTransferMinuten, gewicht: context.transferPrioritaet.anreise })
  }
  if (kandidat.abreiseTransferMinuten !== null && context.transferPrioritaet.abreise > 0) {
    teile.push({ minuten: kandidat.abreiseTransferMinuten, gewicht: context.transferPrioritaet.abreise })
  }
  if (teile.length === 0) return null
  const gewicht = teile.reduce((summe, teil) => summe + teil.gewicht, 0)
  if (gewicht <= 0) return null
  return teile.reduce((summe, teil) => summe + teil.minuten * teil.gewicht, 0) / gewicht
}

function mobilitaet(kandidat: QuartierKandidat): number {
  const werte = [kandidat.gehScore, kandidat.oevScore].filter((wert): wert is number => wert !== null)
  if (werte.length === 0) return 0.5
  return clamp01(werte.reduce((summe, wert) => summe + wert, 0) / werte.length)
}

function profilWerte(kandidat: QuartierKandidat, praef: QuartierPraeferenzen): Array<{ ist: number; soll: number }> {
  const paare: Array<[number | null, number | null]> = [
    [kandidat.ruheScore, praef.ruhe],
    [kandidat.nachtlebenScore, praef.nachtleben],
    [kandidat.essenScore, praef.essen],
    [kandidat.strandScore, praef.strand],
    [kandidat.familieScore, praef.familie],
  ]
  return paare
    .filter((paar): paar is [number, number] => paar[0] !== null && paar[1] !== null)
    .map(([ist, soll]) => ({ ist: clamp01(ist), soll: clamp01(soll) }))
}

function praeferenzFit(kandidat: QuartierKandidat, praef: QuartierPraeferenzen): number {
  const paare = profilWerte(kandidat, praef)
  if (paare.length === 0) return 0.5
  const abweichung = paare.reduce((summe, paar) => summe + Math.abs(paar.ist - paar.soll), 0) / paare.length
  return 1 - clamp01(abweichung)
}

function budgetFit(kandidat: QuartierKandidat, budget: number | null): number {
  if (budget === null || budget <= 0 || kandidat.typischeNachtPreis === null) return 0.5
  if (kandidat.typischeNachtPreis <= budget) return 1
  return clamp01(1 - (kandidat.typischeNachtPreis - budget) / budget)
}

function gruende(
  kandidat: QuartierKandidat,
  scoreTeile: { reisewege: number; transfer: number; mobilitaet: number; praeferenzen: number; budget: number },
): string[] {
  const kandidaten: Array<{ score: number; text: string }> = [
    { score: scoreTeile.reisewege, text: 'Kurze Wege zu den geplanten Stationen der Reise.' },
    { score: scoreTeile.transfer, text: 'Gute Lage für An- und Abreise.' },
    { score: scoreTeile.mobilitaet, text: 'Gute Erreichbarkeit zu Fuß und mit öffentlichen Verkehrsmitteln.' },
    { score: scoreTeile.praeferenzen, text: 'Passt gut zu deinen gewünschten Eigenschaften der Gegend.' },
    { score: scoreTeile.budget, text: 'Das typische Preisniveau passt zum geplanten Budget.' },
  ]
  if (kandidat.taeglicheWegeMinuten === null) {
    kandidaten.push({ score: 0.49, text: 'Für diese Gegend fehlen noch vollständige Wegezeitdaten; Jetnity bewertet sie deshalb vorsichtig.' })
  }
  return kandidaten
    .sort((a, b) => b.score - a.score || a.text.localeCompare(b.text))
    .slice(0, 3)
    .map((eintrag) => eintrag.text)
}

export function quartiereBewerten(kandidaten: QuartierKandidat[], context: QuartierSuchkontext): BewertetesQuartier[] {
  if (kandidaten.length === 0) return []

  const reiseWerte = vorhandeneZahlen(kandidaten, (k) => k.taeglicheWegeMinuten)
  const reiseBereich = minMax(reiseWerte)

  const transferWerte = kandidaten
    .map((kandidat) => transferMinuten(kandidat, context))
    .filter((wert): wert is number => wert !== null && Number.isFinite(wert))
  const transferBereich = minMax(transferWerte)

  return kandidaten
    .map((kandidat) => {
      const reisewege = lowerBetter(kandidat.taeglicheWegeMinuten, reiseBereich.min, reiseBereich.max)
      const transfer = lowerBetter(transferMinuten(kandidat, context), transferBereich.min, transferBereich.max)
      const mobil = mobilitaet(kandidat)
      const pref = praeferenzFit(kandidat, context.praeferenzen)
      const budget = budgetFit(kandidat, context.budgetProNachtMax)
      const score =
        QUARTIER_GEWICHTE.reisewege * reisewege +
        QUARTIER_GEWICHTE.transfer * transfer +
        QUARTIER_GEWICHTE.mobilitaet * mobil +
        QUARTIER_GEWICHTE.praeferenzen * pref +
        QUARTIER_GEWICHTE.budget * budget

      return {
        ...kandidat,
        score: Math.round(score * 1000) / 1000,
        reasons: gruende(kandidat, { reisewege, transfer, mobilitaet: mobil, praeferenzen: pref, budget }),
      }
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      const aWege = a.taeglicheWegeMinuten ?? Number.POSITIVE_INFINITY
      const bWege = b.taeglicheWegeMinuten ?? Number.POSITIVE_INFINITY
      if (aWege !== bWege) return aWege - bWege
      const aPreis = a.typischeNachtPreis ?? Number.POSITIVE_INFINITY
      const bPreis = b.typischeNachtPreis ?? Number.POSITIVE_INFINITY
      if (aPreis !== bPreis) return aPreis - bPreis
      return a.id.localeCompare(b.id)
    })
}
