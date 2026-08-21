// lib/rental-cars/ranking.ts
//
// Deterministisches, provisionsneutrales Mietwagenranking.
// Höherer Score ist besser.
//
// Unbekannt bleibt unbekannt: fehlende Signale bekommen keinen Neutralwert.
// Providername, Affiliate-Provision und Umsatz sind keine Rankingdimension.

import { rentalOneWay } from '@/lib/rental-cars/zeitraum'
import type {
  BewerteteRentalCarOption,
  RentalCarKandidat,
  RentalCarMarke,
  RentalCarOption,
} from '@/lib/rental-cars/domain'

const RENTAL_RANGLISTE_GEWICHTE = {
  ort: 26,
  zeitraum: 20,
  preis: 22,
  fahrzeug: 12,
  getriebe: 8,
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

function vergleichbareGesamtpreise(kandidaten: RentalCarKandidat[]): {
  waehrung: string
  min: number
  max: number
} | null {
  const vergleichbar = kandidaten.filter(
    (option) =>
      option.preis !== null &&
      option.preisIstGesamt === true &&
      Boolean(option.preisWaehrung),
  )
  if (vergleichbar.length === 0) return null
  const waehrungen = new Set(vergleichbar.map((option) => option.preisWaehrung))
  if (waehrungen.size !== 1) return null
  const preise = vergleichbar.map((option) => option.preis as number)
  return {
    waehrung: vergleichbar[0]!.preisWaehrung as string,
    min: Math.min(...preise),
    max: Math.max(...preise),
  }
}

function hatVergleichbarenGesamtpreis(
  option: RentalCarKandidat,
  vergleich: { waehrung: string } | null,
): boolean {
  return Boolean(
    vergleich &&
      option.preis !== null &&
      option.preisIstGesamt === true &&
      option.preisWaehrung === vergleich.waehrung,
  )
}

function signaleFuer(
  option: RentalCarKandidat,
  vergleich: { waehrung: string; min: number; max: number } | null,
): Signal[] {
  const signale: Signal[] = []
  if (option.context.ortFit !== null) {
    signale.push({ gewicht: RENTAL_RANGLISTE_GEWICHTE.ort, wert: option.context.ortFit })
  }
  if (option.context.zeitraumFit !== null) {
    signale.push({ gewicht: RENTAL_RANGLISTE_GEWICHTE.zeitraum, wert: option.context.zeitraumFit })
  }
  if (hatVergleichbarenGesamtpreis(option, vergleich) && option.preis !== null) {
    const preis = option.context.preisFit ?? lowerBetter(option.preis, vergleich!.min, vergleich!.max)
    signale.push({ gewicht: RENTAL_RANGLISTE_GEWICHTE.preis, wert: preis })
  }
  if (option.context.fahrzeugFit !== null) {
    signale.push({ gewicht: RENTAL_RANGLISTE_GEWICHTE.fahrzeug, wert: option.context.fahrzeugFit })
  }
  if (option.context.getriebeFit !== null) {
    signale.push({ gewicht: RENTAL_RANGLISTE_GEWICHTE.getriebe, wert: option.context.getriebeFit })
  }
  if (option.context.flexibilitaetFit !== null) {
    signale.push({ gewicht: RENTAL_RANGLISTE_GEWICHTE.flexibilitaet, wert: option.context.flexibilitaetFit })
  }
  if (option.context.evidenzFit !== null) {
    signale.push({ gewicht: RENTAL_RANGLISTE_GEWICHTE.evidenz, wert: option.context.evidenzFit })
  }
  return signale
}

function labelsFuer(
  option: RentalCarKandidat,
  beste: RentalCarKandidat | null,
  bestValueIds: ReadonlySet<string>,
): RentalCarMarke[] {
  const labels: RentalCarMarke[] = []
  if (beste && option.id === beste.id) labels.push('jetnity')
  if (bestValueIds.has(option.id)) labels.push('best_value')
  if (option.storno) labels.push('flexible')
  if (
    rentalOneWay({
      originPlaceId: option.pickupPlaceId,
      originName: option.pickupName,
      destinationPlaceId: option.dropoffPlaceId,
      destinationName: option.dropoffName,
    }) === 'same_location'
  ) {
    labels.push('same_location')
  }
  return labels
}

function gruendeFuer(option: RentalCarKandidat): string[] {
  const gruende: string[] = []
  if (option.preis !== null && option.preisIstGesamt === true && option.preisWaehrung) {
    gruende.push(`Gesamtpreis ${option.preisWaehrung} ${option.preis}`)
  }
  if (option.vehicleClass) gruende.push('Passende Fahrzeugklasse')
  if (option.transmission) gruende.push('Gewünschtes Getriebe')
  if (option.storno) gruende.push('Stornoregel bekannt')
  return gruende.slice(0, 4)
}

export function rentalCarKandidatAus(option: RentalCarOption): RentalCarKandidat {
  return {
    ...option,
    context: {
      ortFit: null,
      zeitraumFit: null,
      preisFit: null,
      fahrzeugFit: null,
      getriebeFit: null,
      flexibilitaetFit: null,
      evidenzFit: null,
    },
  }
}

export function rentalCarOptionenBewerten(kandidaten: RentalCarKandidat[]): BewerteteRentalCarOption[] {
  const vergleich = vergleichbareGesamtpreise(kandidaten)
  const bestValueIds = new Set(
    vergleich
      ? kandidaten
          .filter((option) => hatVergleichbarenGesamtpreis(option, vergleich) && option.preis === vergleich.min)
          .map((option) => option.id)
      : [],
  )

  const bewertet = kandidaten.map((option) => {
    const score = scoreAus(signaleFuer(option, vergleich))
    return { ...option, score, labels: [] as RentalCarMarke[], reasons: gruendeFuer(option) }
  })

  bewertet.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
  const beste = bewertet[0] ?? null
  return bewertet.map((option) => ({
    ...option,
    labels: labelsFuer(option, beste, bestValueIds),
  }))
}
