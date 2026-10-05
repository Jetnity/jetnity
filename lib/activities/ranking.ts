// lib/activities/ranking.ts
//
// Deterministisches, provisionsneutrales Aktivitätsranking.
// Höherer Score ist besser.
//
// Unbekannt bleibt unbekannt: fehlende Signale bekommen keinen Neutralwert 0,5.
// Vorhandene Evidenz wird nur über bekannte Dimensionen gewichtet.
// Providername und Provision sind keine Rankingdimension.

import type {
  ActivityKandidat,
  ActivityMarke,
  BewerteteActivityOption,
} from '@/lib/activities/domain'

export const ACTIVITY_RANGLISTE_GEWICHTE = {
  interessen: 22,
  zeit: 20,
  preis: 16,
  qualitaet: 14,
  evidenz: 8,
  flexibilitaet: 8,
  dauer: 8,
  lage: 4,
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

function qualitaetScore(option: ActivityKandidat): number | null {
  if (option.bewertung === null) return null
  return clamp01(option.bewertung / 10)
}

function evidenzScore(option: ActivityKandidat, maxBewertungen: number): number | null {
  const anzahl = option.bewertungenAnzahl
  if (anzahl === null || anzahl <= 0 || maxBewertungen <= 0) return null
  return clamp01(Math.log10(anzahl + 1) / Math.log10(maxBewertungen + 1))
}

function flexibilitaetScore(option: ActivityKandidat): number | null {
  if (option.stornierbar === null) return null
  return option.stornierbar ? 1 : 0.15
}

function preisSignal(option: ActivityKandidat, minPreis: number, maxPreis: number): number | null {
  if (option.preis === null) return null
  const relativ = lowerBetter(option.preis, minPreis, maxPreis)
  if (option.context.preisFit === null) return relativ
  return clamp01(relativ * 0.6 + option.context.preisFit * 0.4)
}

type Signal = { gewicht: number; wert: number }

function scoreAus(signale: Signal[]): number {
  if (signale.length === 0) return 0
  const gewicht = signale.reduce((summe, signal) => summe + signal.gewicht, 0)
  if (gewicht <= 0) return 0
  const roh = signale.reduce((summe, signal) => summe + signal.gewicht * signal.wert, 0) / gewicht
  return Math.round(roh * 1000) / 1000
}

function signaleFuer(
  option: ActivityKandidat,
  preise: { min: number; max: number },
  maxBewertungen: number,
): Signal[] {
  const signale: Signal[] = []
  if (option.context.interessenFit !== null) {
    signale.push({ gewicht: ACTIVITY_RANGLISTE_GEWICHTE.interessen, wert: clamp01(option.context.interessenFit) })
  }
  if (option.context.zeitFit !== null) {
    signale.push({ gewicht: ACTIVITY_RANGLISTE_GEWICHTE.zeit, wert: clamp01(option.context.zeitFit) })
  }
  const preis = preisSignal(option, preise.min, preise.max)
  if (preis !== null) signale.push({ gewicht: ACTIVITY_RANGLISTE_GEWICHTE.preis, wert: preis })
  const qualitaet = qualitaetScore(option)
  if (qualitaet !== null) signale.push({ gewicht: ACTIVITY_RANGLISTE_GEWICHTE.qualitaet, wert: qualitaet })
  const evidenz = evidenzScore(option, maxBewertungen)
  if (evidenz !== null) signale.push({ gewicht: ACTIVITY_RANGLISTE_GEWICHTE.evidenz, wert: evidenz })
  const flexibilitaet = flexibilitaetScore(option)
  if (flexibilitaet !== null) {
    signale.push({ gewicht: ACTIVITY_RANGLISTE_GEWICHTE.flexibilitaet, wert: flexibilitaet })
  }
  if (option.context.dauerFit !== null) {
    signale.push({ gewicht: ACTIVITY_RANGLISTE_GEWICHTE.dauer, wert: clamp01(option.context.dauerFit) })
  }
  if (option.context.lageFit !== null) {
    signale.push({ gewicht: ACTIVITY_RANGLISTE_GEWICHTE.lage, wert: clamp01(option.context.lageFit) })
  }
  return signale
}

function vergleichen(a: BewerteteActivityOption, b: BewerteteActivityOption): number {
  if (b.score !== a.score) return b.score - a.score
  if (a.context.konflikt !== b.context.konflikt) {
    const rang = { ueberschneidung: 2, unbekannt: 1, frei: 0 }
    return rang[a.context.konflikt] - rang[b.context.konflikt]
  }
  const aPreis = a.preis ?? Number.POSITIVE_INFINITY
  const bPreis = b.preis ?? Number.POSITIVE_INFINITY
  if (aPreis !== bPreis) return aPreis - bPreis
  const aBewertung = a.bewertung ?? -1
  const bBewertung = b.bewertung ?? -1
  if (aBewertung !== bBewertung) return bBewertung - aBewertung
  return a.id.localeCompare(b.id)
}

function ohneUeberschneidung(optionen: BewerteteActivityOption[]): BewerteteActivityOption[] {
  return optionen.filter((option) => option.context.konflikt !== 'ueberschneidung')
}

function bestValue(optionen: BewerteteActivityOption[]): BewerteteActivityOption | null {
  const mitDaten = optionen.filter((option) => option.preis !== null && option.bewertung !== null)
  if (mitDaten.length === 0) return null
  const preise = mitDaten.map((option) => option.preis!)
  const minPreis = Math.min(...preise)
  const maxPreis = Math.max(...preise)
  return [...mitDaten].sort((a, b) => {
    const scoreA = lowerBetter(a.preis!, minPreis, maxPreis) * 0.55 + clamp01(a.bewertung! / 10) * 0.45
    const scoreB = lowerBetter(b.preis!, minPreis, maxPreis) * 0.55 + clamp01(b.bewertung! / 10) * 0.45
    if (scoreB !== scoreA) return scoreB - scoreA
    return a.id.localeCompare(b.id)
  })[0]!
}

function besteBewertung(optionen: BewerteteActivityOption[]): BewerteteActivityOption | null {
  const mitWert = optionen.filter((option) => option.bewertung !== null)
  if (mitWert.length === 0) return null
  return [...mitWert].sort((a, b) => {
    if (a.bewertung !== b.bewertung) return (b.bewertung ?? 0) - (a.bewertung ?? 0)
    const aAnzahl = a.bewertungenAnzahl ?? -1
    const bAnzahl = b.bewertungenAnzahl ?? -1
    if (aAnzahl !== bAnzahl) return bAnzahl - aAnzahl
    return a.id.localeCompare(b.id)
  })[0]!
}

function flexibelste(optionen: BewerteteActivityOption[]): BewerteteActivityOption | null {
  const stornierbar = optionen.filter((option) => option.stornierbar === true)
  if (stornierbar.length === 0) return null
  return [...stornierbar].sort(vergleichen)[0]!
}

function kompakteste(optionen: BewerteteActivityOption[]): BewerteteActivityOption | null {
  const mitDauer = optionen.filter(
    (option) =>
      option.dauerMinuten !== null &&
      option.dauerMinuten <= 120 &&
      option.context.konflikt !== 'ueberschneidung',
  )
  if (mitDauer.length === 0) return null
  return [...mitDauer].sort((a, b) => {
    if (a.dauerMinuten !== b.dauerMinuten) return (a.dauerMinuten ?? 0) - (b.dauerMinuten ?? 0)
    return vergleichen(a, b)
  })[0]!
}

function gruendeFuer(
  jetnity: BewerteteActivityOption,
  billigste: BewerteteActivityOption | null,
): string[] {
  const gruende: string[] = []
  if (jetnity.context.interessenFit !== null && jetnity.context.interessenFit >= 0.5) {
    gruende.push('Passt zu den Interessen dieser Reise.')
  }
  if (jetnity.context.konflikt === 'frei') {
    gruende.push('Liegt zeitlich neben den bereits geplanten Punkten dieses Tages.')
  }
  if (jetnity.context.dauerFit !== null && jetnity.dauerMinuten !== null && jetnity.dauerMinuten <= 120) {
    gruende.push('Die Dauer fügt sich gut in das Tempo dieses Tages ein.')
  }
  if (
    billigste &&
    jetnity.preis !== null &&
    billigste.preis !== null &&
    jetnity.preis > billigste.preis
  ) {
    gruende.push('Etwas teurer als die günstigste Option, dafür mit besserer Gesamtpassung.')
  } else if (jetnity.preis !== null) {
    gruende.push('Preislich nachvollziehbar im Vergleich zu den anderen passenden Aktivitäten.')
  }
  if (jetnity.stornierbar === true) gruende.push('Stornierbar, falls sich der Tag noch ändert.')
  if (jetnity.bewertung !== null && jetnity.bewertung >= 8.5) {
    gruende.push('Sehr gute Gästebewertung.')
  }
  if (jetnity.context.lageFit !== null && jetnity.context.lageFit >= 0.7) {
    gruende.push('Die Koordinaten liegen im Umfeld des Etappenorts – ohne erfundene Wegezeit.')
  }
  return [...new Set(gruende)].slice(0, 4)
}

function markenSetzen(optionen: BewerteteActivityOption[]): BewerteteActivityOption[] {
  if (optionen.length === 0) return optionen

  const ohneKonflikt = ohneUeberschneidung(optionen)
  const jetnity = [...(ohneKonflikt.length > 0 ? ohneKonflikt : optionen)].sort(vergleichen)[0]!
  const mitPreis = optionen.filter((option) => option.preis !== null)
  const billigste =
    mitPreis.length > 0
      ? [...mitPreis].sort((a, b) => (a.preis ?? 0) - (b.preis ?? 0) || a.id.localeCompare(b.id))[0]!
      : null
  const value = bestValue(ohneKonflikt)
  const rating = besteBewertung(ohneKonflikt)
  const flexibel = flexibelste(ohneKonflikt)
  const kompakt = kompakteste(ohneKonflikt)

  const labels = new Map<string, ActivityMarke[]>(optionen.map((option) => [option.id, []]))
  labels.get(jetnity.id)?.push('jetnity')
  if (value) labels.get(value.id)?.push('best_value')
  if (rating) labels.get(rating.id)?.push('best_rating')
  if (flexibel) labels.get(flexibel.id)?.push('flexible')
  if (kompakt) labels.get(kompakt.id)?.push('compact')

  return optionen.map((option) => ({
    ...option,
    labels: labels.get(option.id) ?? [],
    reasons: option.id === jetnity.id ? gruendeFuer(option, billigste) : [],
  }))
}

export function activityOptionenBewerten(optionen: ActivityKandidat[]): BewerteteActivityOption[] {
  if (optionen.length === 0) return []

  const preise = optionen
    .map((option) => option.preis)
    .filter((wert): wert is number => wert !== null)
  const minPreis = preise.length > 0 ? Math.min(...preise) : 0
  const maxPreis = preise.length > 0 ? Math.max(...preise) : 0
  const maxBewertungen = Math.max(0, ...optionen.map((option) => option.bewertungenAnzahl ?? 0))

  const bewertet: BewerteteActivityOption[] = optionen.map((option) => ({
    ...option,
    score: scoreAus(signaleFuer(option, { min: minPreis, max: maxPreis }, maxBewertungen)),
    labels: [],
    reasons: [],
  }))

  return markenSetzen(bewertet).sort(vergleichen)
}
