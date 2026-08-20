// lib/hotels/ranking.ts
//
// Deterministisches, provisionsneutrales Hotelranking innerhalb einer bereits
// ausgewählten Gegend. Höherer Score ist besser.

import type { BewerteteHotelOption, HotelKandidat, HotelMarke, HotelSuchanfrage } from '@/lib/hotels/domain'

export const HOTEL_RANGLISTE_GEWICHTE = {
  lage: 34,
  preis: 28,
  qualitaet: 14,
  flexibilitaet: 10,
  praeferenzen: 8,
  evidenz: 6,
} as const

function clamp01(wert: number): number {
  return Math.max(0, Math.min(1, wert))
}

function normalisieren(wert: number, min: number, max: number): number {
  if (max <= min) return 1
  return clamp01((wert - min) / (max - min))
}

function lowerBetter(wert: number, min: number, max: number): number {
  if (max <= min) return 1
  return 1 - normalisieren(wert, min, max)
}

function lageScore(option: HotelKandidat, minWege: number, maxWege: number): number {
  const wege = option.context.taeglicheWegeMinuten
  const wegeScore = wege === null ? 0.5 : lowerBetter(wege, minWege, maxWege)
  const quartierFit = option.context.quartierFitScore ?? 0.5
  return clamp01(wegeScore * 0.7 + quartierFit * 0.3)
}

function qualitaetScore(option: HotelKandidat): number {
  const werte: number[] = []
  if (option.bewertung !== null) werte.push(clamp01(option.bewertung / 10))
  if (option.sterne !== null) werte.push(clamp01(option.sterne / 5))
  if (werte.length === 0) return 0.5
  return werte.reduce((summe, wert) => summe + wert, 0) / werte.length
}

function flexibilitaetScore(option: HotelKandidat, anfrage: HotelSuchanfrage): number {
  let score = option.stornierbar === true ? 1 : option.stornierbar === false ? 0.2 : 0.5
  if (anfrage.preferences.stornierbarBevorzugt === false) score = Math.max(score, 0.5)
  return score
}

function praeferenzScore(option: HotelKandidat, anfrage: HotelSuchanfrage): number {
  const werte: number[] = []
  if (option.context.praeferenzFitScore !== null) werte.push(clamp01(option.context.praeferenzFitScore))
  if (anfrage.preferences.fruehstueckBevorzugt !== null) {
    if (option.fruehstueckEnthalten === null) werte.push(0.5)
    else werte.push(option.fruehstueckEnthalten === anfrage.preferences.fruehstueckBevorzugt ? 1 : 0)
  }
  if (anfrage.preferences.mindestSterne !== null) {
    if (option.sterne === null) werte.push(0.5)
    else werte.push(option.sterne >= anfrage.preferences.mindestSterne ? 1 : clamp01(option.sterne / anfrage.preferences.mindestSterne))
  }
  if (werte.length === 0) return 0.5
  return werte.reduce((summe, wert) => summe + wert, 0) / werte.length
}

function evidenzScore(option: HotelKandidat, maxBewertungen: number): number {
  const anzahl = option.bewertungenAnzahl
  if (anzahl === null || anzahl <= 0 || maxBewertungen <= 0) return 0.5
  return clamp01(Math.log10(anzahl + 1) / Math.log10(maxBewertungen + 1))
}

function vergleichen(a: BewerteteHotelOption, b: BewerteteHotelOption): number {
  if (b.score !== a.score) return b.score - a.score
  if (a.preisGesamt !== b.preisGesamt) return a.preisGesamt - b.preisGesamt
  const aWege = a.context.taeglicheWegeMinuten ?? Number.POSITIVE_INFINITY
  const bWege = b.context.taeglicheWegeMinuten ?? Number.POSITIVE_INFINITY
  if (aWege !== bWege) return aWege - bWege
  return a.id.localeCompare(b.id)
}

function besteLage(optionen: BewerteteHotelOption[]): BewerteteHotelOption {
  return [...optionen].sort((a, b) => {
    const aWege = a.context.taeglicheWegeMinuten ?? Number.POSITIVE_INFINITY
    const bWege = b.context.taeglicheWegeMinuten ?? Number.POSITIVE_INFINITY
    if (aWege !== bWege) return aWege - bWege
    const aFit = a.context.quartierFitScore ?? 0
    const bFit = b.context.quartierFitScore ?? 0
    if (aFit !== bFit) return bFit - aFit
    if (a.preisGesamt !== b.preisGesamt) return a.preisGesamt - b.preisGesamt
    return a.id.localeCompare(b.id)
  })[0]!
}

function bestValue(optionen: BewerteteHotelOption[]): BewerteteHotelOption {
  const preise = optionen.map((option) => option.preisGesamt)
  const minPreis = Math.min(...preise)
  const maxPreis = Math.max(...preise)
  return [...optionen].sort((a, b) => {
    const scoreA = lowerBetter(a.preisGesamt, minPreis, maxPreis) * 0.5 + qualitaetScore(a) * 0.3 + (a.context.quartierFitScore ?? 0.5) * 0.2
    const scoreB = lowerBetter(b.preisGesamt, minPreis, maxPreis) * 0.5 + qualitaetScore(b) * 0.3 + (b.context.quartierFitScore ?? 0.5) * 0.2
    if (scoreB !== scoreA) return scoreB - scoreA
    return a.id.localeCompare(b.id)
  })[0]!
}

function ruhigste(optionen: BewerteteHotelOption[]): BewerteteHotelOption | null {
  const mitWert = optionen.filter((option) => option.context.ruheScore !== null)
  if (mitWert.length === 0) return null
  return [...mitWert].sort((a, b) => {
    const aWert = a.context.ruheScore ?? 0
    const bWert = b.context.ruheScore ?? 0
    if (aWert !== bWert) return bWert - aWert
    return a.id.localeCompare(b.id)
  })[0]!
}

function premium(optionen: BewerteteHotelOption[]): BewerteteHotelOption {
  return [...optionen].sort((a, b) => {
    const aQual = qualitaetScore(a)
    const bQual = qualitaetScore(b)
    if (aQual !== bQual) return bQual - aQual
    if (a.preisGesamt !== b.preisGesamt) return b.preisGesamt - a.preisGesamt
    return a.id.localeCompare(b.id)
  })[0]!
}

function gruendeFuer(jetnity: BewerteteHotelOption, billigstes: BewerteteHotelOption, lage: BewerteteHotelOption): string[] {
  const gruende: string[] = []
  if (jetnity.id === lage.id) gruende.push('Sehr gute Lage für die geplanten Wege dieser Reise.')
  if (jetnity.context.taeglicheWegeMinuten !== null && lage.context.taeglicheWegeMinuten !== null) {
    const differenz = jetnity.context.taeglicheWegeMinuten - lage.context.taeglicheWegeMinuten
    if (differenz <= 5) gruende.push('Die täglichen Wege bleiben nahe an der besten Lageoption.')
  }
  if (jetnity.preisGesamt > billigstes.preisGesamt) {
    gruende.push('Etwas teurer als die günstigste Option, dafür mit besserer Gesamtpassung.')
  } else {
    gruende.push('Preislich stark im Vergleich zu den anderen passenden Hotels.')
  }
  if (jetnity.stornierbar === true) gruende.push('Stornierbare Rate verbessert die Flexibilität der Reise.')
  if (jetnity.bewertung !== null && jetnity.bewertung >= 8.5) gruende.push('Sehr gute Gästebewertung.')
  return [...new Set(gruende)].slice(0, 4)
}

function markenSetzen(optionen: BewerteteHotelOption[]): BewerteteHotelOption[] {
  if (optionen.length === 0) return optionen

  const jetnity = [...optionen].sort(vergleichen)[0]!
  const billigstes = [...optionen].sort((a, b) => a.preisGesamt - b.preisGesamt || a.id.localeCompare(b.id))[0]!
  const value = bestValue(optionen)
  const lage = besteLage(optionen)
  const quiet = ruhigste(optionen)
  const premiumOption = premium(optionen)

  const labels = new Map<string, HotelMarke[]>(optionen.map((option) => [option.id, []]))
  labels.get(jetnity.id)?.push('jetnity')
  labels.get(value.id)?.push('best_value')
  labels.get(lage.id)?.push('best_location')
  if (quiet) labels.get(quiet.id)?.push('quiet')
  labels.get(premiumOption.id)?.push('premium')

  return optionen.map((option) => ({
    ...option,
    labels: labels.get(option.id) ?? [],
    reasons: option.id === jetnity.id ? gruendeFuer(option, billigstes, lage) : [],
  }))
}

export function hotelOptionenBewerten(optionen: HotelKandidat[], anfrage: HotelSuchanfrage): BewerteteHotelOption[] {
  if (optionen.length === 0) return []

  const preise = optionen.map((option) => option.preisGesamt)
  const minPreis = Math.min(...preise)
  const maxPreis = Math.max(...preise)
  const wege = optionen
    .map((option) => option.context.taeglicheWegeMinuten)
    .filter((wert): wert is number => wert !== null)
  const minWege = wege.length > 0 ? Math.min(...wege) : 0
  const maxWege = wege.length > 0 ? Math.max(...wege) : 0
  const maxBewertungen = Math.max(0, ...optionen.map((option) => option.bewertungenAnzahl ?? 0))

  const bewertet: BewerteteHotelOption[] = optionen.map((option) => {
    const preis = lowerBetter(option.preisGesamt, minPreis, maxPreis)
    const lage = lageScore(option, minWege, maxWege)
    const qualitaet = qualitaetScore(option)
    const flexibilitaet = flexibilitaetScore(option, anfrage)
    const praeferenzen = praeferenzScore(option, anfrage)
    const evidenz = evidenzScore(option, maxBewertungen)

    const score =
      HOTEL_RANGLISTE_GEWICHTE.lage * lage +
      HOTEL_RANGLISTE_GEWICHTE.preis * preis +
      HOTEL_RANGLISTE_GEWICHTE.qualitaet * qualitaet +
      HOTEL_RANGLISTE_GEWICHTE.flexibilitaet * flexibilitaet +
      HOTEL_RANGLISTE_GEWICHTE.praeferenzen * praeferenzen +
      HOTEL_RANGLISTE_GEWICHTE.evidenz * evidenz

    return {
      ...option,
      score: Math.round(score * 1000) / 1000,
      labels: [],
      reasons: [],
    }
  })

  return markenSetzen(bewertet).sort(vergleichen)
}
