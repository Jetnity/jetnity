// lib/mobility/ranking.ts
//
// Deterministisches, provisionsneutrales Mobilitätsranking.
// Höherer Score ist besser.
//
// Unbekannt bleibt unbekannt: fehlende Signale bekommen keinen Neutralwert.
// Providername, Affiliate-Provision und Umsatz sind keine Rankingdimension.

import type {
  BewerteteMobilityOption,
  MobilityKandidat,
  MobilityMarke,
  MobilityOption,
} from '@/lib/mobility/domain'

export const MOBILITY_RANGLISTE_GEWICHTE = {
  route: 24,
  zeit: 20,
  dauer: 16,
  umstiege: 14,
  preis: 14,
  flexibilitaet: 6,
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

type Signal = { gewicht: number; wert: number }

function scoreAus(signale: Signal[]): number {
  if (signale.length === 0) return 0
  const gewicht = signale.reduce((summe, signal) => summe + signal.gewicht, 0)
  if (gewicht <= 0) return 0
  const roh = signale.reduce((summe, signal) => summe + signal.gewicht * signal.wert, 0) / gewicht
  return Math.round(roh * 1000) / 1000
}

function signaleFuer(
  option: MobilityKandidat,
  dauern: { min: number; max: number },
  umstiege: { min: number; max: number },
  preise: { min: number; max: number },
): Signal[] {
  const signale: Signal[] = []
  if (option.context.routeFit !== null) {
    signale.push({ gewicht: MOBILITY_RANGLISTE_GEWICHTE.route, wert: option.context.routeFit })
  }
  if (option.context.zeitFit !== null) {
    signale.push({ gewicht: MOBILITY_RANGLISTE_GEWICHTE.zeit, wert: option.context.zeitFit })
  }
  if (option.durationMinutes !== null) {
    const dauer = option.context.dauerFit ?? lowerBetter(option.durationMinutes, dauern.min, dauern.max)
    signale.push({ gewicht: MOBILITY_RANGLISTE_GEWICHTE.dauer, wert: dauer })
  }
  if (option.changes !== null) {
    const umstieg = option.context.umstiegFit ?? lowerBetter(option.changes, umstiege.min, umstiege.max)
    signale.push({ gewicht: MOBILITY_RANGLISTE_GEWICHTE.umstiege, wert: umstieg })
  }
  if (option.preis !== null) {
    const preis = option.context.preisFit ?? lowerBetter(option.preis, preise.min, preise.max)
    signale.push({ gewicht: MOBILITY_RANGLISTE_GEWICHTE.preis, wert: preis })
  }
  if (option.context.flexibilitaetFit !== null) {
    signale.push({
      gewicht: MOBILITY_RANGLISTE_GEWICHTE.flexibilitaet,
      wert: option.context.flexibilitaetFit,
    })
  } else if (option.stornierbar !== null) {
    signale.push({
      gewicht: MOBILITY_RANGLISTE_GEWICHTE.flexibilitaet,
      wert: option.stornierbar ? 1 : 0.15,
    })
  }
  if (option.context.evidenzFit !== null) {
    signale.push({ gewicht: MOBILITY_RANGLISTE_GEWICHTE.evidenz, wert: option.context.evidenzFit })
  }
  return signale
}

function markenFuer(
  option: MobilityKandidat,
  bewertete: readonly { option: MobilityKandidat; score: number }[],
): MobilityMarke[] {
  const labels: MobilityMarke[] = []
  const beste = bewertete[0]
  if (beste && beste.option.id === option.id) labels.push('jetnity')

  const mitPreis = bewertete.filter((eintrag) => eintrag.option.preis !== null)
  const guenstigste = [...mitPreis].sort((a, b) => (a.option.preis ?? 0) - (b.option.preis ?? 0))[0]
  if (guenstigste && guenstigste.option.id === option.id) labels.push('best_value')

  const mitDauer = bewertete.filter((eintrag) => eintrag.option.durationMinutes !== null)
  const schnellste = [...mitDauer].sort(
    (a, b) => (a.option.durationMinutes ?? 0) - (b.option.durationMinutes ?? 0),
  )[0]
  if (schnellste && schnellste.option.id === option.id) labels.push('fastest')

  const mitUmstieg = bewertete.filter((eintrag) => eintrag.option.changes !== null)
  const wenige = [...mitUmstieg].sort((a, b) => (a.option.changes ?? 0) - (b.option.changes ?? 0))[0]
  if (wenige && wenige.option.id === option.id) labels.push('fewest_changes')

  if (option.stornierbar === true) labels.push('flexible')
  return labels
}

function gruendeFuer(option: MobilityKandidat, labels: readonly MobilityMarke[]): string[] {
  const gruende: string[] = []
  if (labels.includes('jetnity')) gruende.push('Passt am besten zu Start, Ziel und Reisegraph.')
  if (option.context.routeFit === 1) gruende.push('Start und Ziel entsprechen der benötigten Verbindung.')
  if (option.durationMinutes !== null) gruende.push(`Reisezeit ${option.durationMinutes} Minuten.`)
  if (option.changes === 0) gruende.push('Direkte Verbindung, ohne Umstieg.')
  else if (option.changes !== null) gruende.push(`${option.changes} Umstiege.`)
  if (option.preis !== null && option.preisWaehrung) {
    gruende.push(`Preis ${option.preisWaehrung} ${option.preis}.`)
  }
  if (option.stornierbar === true) gruende.push('Stornierbar laut Quelle.')
  return gruende
}

function evidenzAus(option: MobilityOption): number | null {
  let bekannt = 0
  let moeglich = 0
  const felder: Array<unknown> = [
    option.originName,
    option.destinationName,
    option.startsOn,
    option.durationMinutes,
    option.changes,
    option.preis,
    option.stornierbar,
  ]
  for (const feld of felder) {
    moeglich += 1
    if (feld !== null && feld !== undefined && feld !== '') bekannt += 1
  }
  if (bekannt === 0) return null
  return clamp01(bekannt / moeglich)
}

export function mobilityKandidatAus(
  option: MobilityOption,
  kontext: Partial<MobilityKandidat['context']> = {},
): MobilityKandidat {
  return {
    ...option,
    context: {
      routeFit: kontext.routeFit ?? null,
      zeitFit: kontext.zeitFit ?? null,
      dauerFit: kontext.dauerFit ?? null,
      umstiegFit: kontext.umstiegFit ?? null,
      preisFit: kontext.preisFit ?? null,
      flexibilitaetFit: kontext.flexibilitaetFit ?? null,
      evidenzFit: kontext.evidenzFit ?? evidenzAus(option),
    },
  }
}

export function mobilityOptionenBewerten(kandidaten: readonly MobilityKandidat[]): BewerteteMobilityOption[] {
  const dauern = kandidaten
    .map((option) => option.durationMinutes)
    .filter((wert): wert is number => wert !== null)
  const umstiege = kandidaten
    .map((option) => option.changes)
    .filter((wert): wert is number => wert !== null)
  const preise = kandidaten
    .map((option) => option.preis)
    .filter((wert): wert is number => wert !== null)

  const span = {
    dauer: { min: Math.min(...dauern, 0), max: Math.max(...dauern, 0) },
    umstieg: { min: Math.min(...umstiege, 0), max: Math.max(...umstiege, 0) },
    preis: { min: Math.min(...preise, 0), max: Math.max(...preise, 0) },
  }

  const bewertet = kandidaten
    .map((option) => ({
      option,
      score: scoreAus(signaleFuer(option, span.dauer, span.umstieg, span.preis)),
    }))
    .sort((links, rechts) => {
      if (rechts.score !== links.score) return rechts.score - links.score
      return links.option.id.localeCompare(rechts.option.id)
    })

  return bewertet.map(({ option, score }) => {
    const labels = markenFuer(option, bewertet)
    return {
      ...option,
      score,
      labels,
      reasons: gruendeFuer(option, labels),
    }
  })
}
