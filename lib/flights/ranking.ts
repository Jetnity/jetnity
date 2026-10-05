// lib/flights/ranking.ts
//
// Deterministisches Jetnity-Ranking. Kein Modell, keine Provision, kein Provider.
//
// Höherer Score ist besser. Die Gewichte stehen hier und nicht in der Umgebung:
// Eine Rangfolge, die sich über Variablen verschieben lässt, ist nicht testbar.
// Bei Gleichstand entscheidet Preis, dann Dauer, dann Stopps, dann die id.
//
// Frei von Next und Providern.

import type { BewerteteFlugOption, FlugMarke, FlugOption, FlugSuchanfrage } from '@/lib/flights/domain'
import { gruendeFuer } from '@/lib/flights/gruende'
import { minutenSeitMitternacht, umstiegMinuten } from '@/lib/flights/zeit'

export const RANGLISTE_GEWICHTE = {
  preis: 40,
  dauer: 25,
  stopps: 18,
  frueh: 5,
  spaet: 5,
  umstieg: 8,
  uebernachtung: 10,
  datum: 6,
} as const

const FRUEH_BIS_MINUTE = 6 * 60
const SPAET_AB_MINUTE = 22 * 60
const MINUTEN_BIS_MITTERNACHT_ENDE = 2 * 60
const LANGER_UMSTIEG_MINUTEN = 180
const SEHR_LANGER_UMSTIEG_MINUTEN = 360

function normalisieren(wert: number, min: number, max: number): number {
  if (max <= min) return 1
  return (wert - min) / (max - min)
}

function ersterAbflug(option: FlugOption) {
  return option.legs[0]?.segments[0] ?? null
}

function maxUmstiegMinuten(option: FlugOption): number {
  let maximum = 0
  for (const bein of option.legs) {
    for (let i = 1; i < bein.segments.length; i++) {
      const vorher = bein.segments[i - 1]!
      const nachher = bein.segments[i]!
      const minuten = umstiegMinuten(
        { date: vorher.arrivalDate, time: vorher.arrivalTime },
        { date: nachher.departureDate, time: nachher.departureTime },
      )
      if (minuten !== null && minuten > maximum) maximum = minuten
    }
  }
  return maximum
}

function hatUebernachtung(option: FlugOption): boolean {
  for (const bein of option.legs) {
    for (let i = 1; i < bein.segments.length; i++) {
      const vorher = bein.segments[i - 1]!
      const nachher = bein.segments[i]!
      const minuten = umstiegMinuten(
        { date: vorher.arrivalDate, time: vorher.arrivalTime },
        { date: nachher.departureDate, time: nachher.departureTime },
      )
      if (vorher.arrivalDate !== nachher.departureDate && minuten !== null && minuten >= LANGER_UMSTIEG_MINUTEN) {
        return true
      }
    }
  }
  return false
}

function fruehStrafmass(option: FlugOption): number {
  let masse = 0
  for (const bein of option.legs) {
    const start = bein.segments[0]
    if (!start) continue
    const minute = minutenSeitMitternacht(start.departureTime)
    if (minute !== null && minute < FRUEH_BIS_MINUTE) {
      masse = Math.max(masse, (FRUEH_BIS_MINUTE - minute) / FRUEH_BIS_MINUTE)
    }
  }
  return masse
}

function spaetStrafmass(option: FlugOption): number {
  let masse = 0
  for (const bein of option.legs) {
    const ende = bein.segments[bein.segments.length - 1]
    if (!ende) continue
    const minute = minutenSeitMitternacht(ende.arrivalTime)
    if (minute !== null && minute >= SPAET_AB_MINUTE) {
      masse = Math.max(masse, (minute - SPAET_AB_MINUTE) / MINUTEN_BIS_MITTERNACHT_ENDE)
    }
  }
  return Math.min(1, masse)
}

function umstiegStrafmass(option: FlugOption): number {
  const max = maxUmstiegMinuten(option)
  if (max <= LANGER_UMSTIEG_MINUTEN) return 0
  if (max >= SEHR_LANGER_UMSTIEG_MINUTEN) return 1
  return (max - LANGER_UMSTIEG_MINUTEN) / (SEHR_LANGER_UMSTIEG_MINUTEN - LANGER_UMSTIEG_MINUTEN)
}

function datumPassung(option: FlugOption, anfrage: FlugSuchanfrage): number {
  const start = ersterAbflug(option)
  if (!start) return 0
  const ziel = anfrage.context.selectedDate ?? anfrage.context.tripStartDate ?? anfrage.legs[0]?.date
  if (!ziel) return 0.5
  return start.departureDate === ziel ? 1 : 0
}

function vergleichen(a: BewerteteFlugOption, b: BewerteteFlugOption): number {
  if (b.score !== a.score) return b.score - a.score
  if (a.priceAmount !== b.priceAmount) return a.priceAmount - b.priceAmount
  if (a.durationMinutes !== b.durationMinutes) return a.durationMinutes - b.durationMinutes
  if (a.stops !== b.stops) return a.stops - b.stops
  return a.id.localeCompare(b.id)
}

function markenSetzen(optionen: BewerteteFlugOption[]): BewerteteFlugOption[] {
  if (optionen.length === 0) return optionen

  const jetnity = [...optionen].sort(vergleichen)[0]!
  const cheapest = [...optionen].sort((a, b) => {
    if (a.priceAmount !== b.priceAmount) return a.priceAmount - b.priceAmount
    if (a.durationMinutes !== b.durationMinutes) return a.durationMinutes - b.durationMinutes
    return a.id.localeCompare(b.id)
  })[0]!
  const fastest = [...optionen].sort((a, b) => {
    if (a.durationMinutes !== b.durationMinutes) return a.durationMinutes - b.durationMinutes
    if (a.priceAmount !== b.priceAmount) return a.priceAmount - b.priceAmount
    return a.id.localeCompare(b.id)
  })[0]!

  const zuMarke = new Map<string, FlugMarke[]>(optionen.map((option) => [option.id, []]))
  zuMarke.get(jetnity.id)?.push('jetnity')
  zuMarke.get(cheapest.id)?.push('cheapest')
  zuMarke.get(fastest.id)?.push('fastest')

  return optionen.map((option) => {
    const labels = zuMarke.get(option.id) ?? []
    const reasons = labels.includes('jetnity') ? gruendeFuer(option, cheapest, fastest) : []
    return { ...option, labels, reasons }
  })
}

export function optionenBewerten(
  optionen: FlugOption[],
  anfrage: FlugSuchanfrage,
): BewerteteFlugOption[] {
  if (optionen.length === 0) return []

  const preise = optionen.map((option) => option.priceAmount)
  const dauern = optionen.map((option) => option.durationMinutes)
  const stopps = optionen.map((option) => option.stops)
  const minPreis = Math.min(...preise)
  const maxPreis = Math.max(...preise)
  const minDauer = Math.min(...dauern)
  const maxDauer = Math.max(...dauern)
  const minStopps = Math.min(...stopps)
  const maxStopps = Math.max(...stopps)

  const bewertet: BewerteteFlugOption[] = optionen.map((option) => {
    const preis = 1 - normalisieren(option.priceAmount, minPreis, maxPreis)
    const dauer = 1 - normalisieren(option.durationMinutes, minDauer, maxDauer)
    const halte = 1 - normalisieren(option.stops, minStopps, maxStopps)
    const score =
      RANGLISTE_GEWICHTE.preis * preis +
      RANGLISTE_GEWICHTE.dauer * dauer +
      RANGLISTE_GEWICHTE.stopps * halte +
      RANGLISTE_GEWICHTE.frueh * (1 - fruehStrafmass(option)) +
      RANGLISTE_GEWICHTE.spaet * (1 - spaetStrafmass(option)) +
      RANGLISTE_GEWICHTE.umstieg * (1 - umstiegStrafmass(option)) +
      RANGLISTE_GEWICHTE.uebernachtung * (hatUebernachtung(option) ? 0 : 1) +
      RANGLISTE_GEWICHTE.datum * datumPassung(option, anfrage)

    return {
      ...option,
      score: Math.round(score * 1000) / 1000,
      labels: [],
      reasons: [],
    }
  })

  return markenSetzen(bewertet).sort(vergleichen)
}

export function istFrueherAbflug(option: FlugOption): boolean {
  return fruehStrafmass(option) > 0
}

export function istSpaeteAnkunft(option: FlugOption): boolean {
  return spaetStrafmass(option) > 0
}

export function hatLangenUmstieg(option: FlugOption): boolean {
  return maxUmstiegMinuten(option) > LANGER_UMSTIEG_MINUTEN
}

export function hatOvernight(option: FlugOption): boolean {
  return hatUebernachtung(option)
}

export function laengsterUmstiegMinuten(option: FlugOption): number {
  return maxUmstiegMinuten(option)
}
