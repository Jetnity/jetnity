// lib/trips/naechte-abdeckung.ts
//
// Deterministische Nachtabdeckung aus dem echten Reisegraphen.
//
// Check-in/Check-out ist ein halboffenes Intervall `[checkIn, checkOut)`.
// Überlappende Stays werden vereinigt, nicht doppelt gezählt. Fehlende Daten
// werden nicht erfunden: unbekannte Abdeckung ist unbekannt, nicht `0/14`.
//
// Frei von React, Next und Providern.

import { istGebucht } from '@/lib/trips/buchung'
import { datumVerschieben } from '@/lib/trips/tage'
import type { Trip, TripItem, TripStage } from '@/types/trips'

function allePunkte(reise: Trip, ohneTag: readonly TripItem[]): TripItem[] {
  const extra = ohneTag.length > 0 ? ohneTag : reise.ohneTag
  return [...reise.days.flatMap((tag) => tag.items), ...extra]
}

const EIN_TAG = 86_400_000

export type UnterkunftZeitraum = {
  start: string
  end: string
  stageId: string | null
  stageName: string | null
}

export type UnterkunftLuecke = UnterkunftZeitraum & {
  naechte: number
}

export type UnterkunftAufenthalt = {
  item: TripItem
  start: string | null
  end: string | null
  naechte: number | null
  status: 'selected' | 'booked' | 'unknown'
  ausserhalb: boolean
}

export type UnterkunftAbdeckung = {
  bekannt: boolean
  naechteGesamt: number | null
  naechteAbgedeckt: number | null
  naechteGebucht: number | null
  naechteAusgewaehlt: number | null
  zeitraeume: UnterkunftZeitraum[]
  luecken: UnterkunftLuecke[]
  aufenthalte: UnterkunftAufenthalt[]
  zusammenfassung: string
}

export function naechteHalboffen(checkIn: string, checkOut: string): string[] {
  const start = Date.parse(`${checkIn}T00:00:00Z`)
  const ende = Date.parse(`${checkOut}T00:00:00Z`)
  if (Number.isNaN(start) || Number.isNaN(ende) || ende <= start) return []

  const naechte: string[] = []
  for (let zeit = start; zeit < ende; zeit += EIN_TAG) {
    naechte.push(new Date(zeit).toISOString().slice(0, 10))
  }
  return naechte
}

function datumGueltig(wert: string | null | undefined): wert is string {
  if (!wert || !/^\d{4}-\d{2}-\d{2}$/.test(wert)) return false
  const [jahr, monat, tag] = wert.split('-').map(Number)
  const geprueft = new Date(Date.UTC(jahr, monat - 1, tag))
  return (
    geprueft.getUTCFullYear() === jahr &&
    geprueft.getUTCMonth() === monat - 1 &&
    geprueft.getUTCDate() === tag
  )
}

function stayZeitraum(punkt: TripItem): { start: string; end: string } | null {
  if (!datumGueltig(punkt.startsOn) || !datumGueltig(punkt.endsOn)) return null
  if (punkt.startsOn >= punkt.endsOn) return null
  return { start: punkt.startsOn, end: punkt.endsOn }
}

function etappenZeitraum(etappe: TripStage): UnterkunftZeitraum | null {
  if (!datumGueltig(etappe.arrivalDate) || !datumGueltig(etappe.departureDate)) return null
  if (etappe.arrivalDate >= etappe.departureDate) return null
  return {
    start: etappe.arrivalDate,
    end: etappe.departureDate,
    stageId: etappe.id,
    stageName: etappe.name,
  }
}

function reiseZeitraum(reise: Trip): UnterkunftZeitraum | null {
  if (!datumGueltig(reise.startDate) || !datumGueltig(reise.endDate)) return null
  if (reise.startDate >= reise.endDate) return null
  return {
    start: reise.startDate,
    end: reise.endDate,
    stageId: reise.stages.length === 1 ? reise.stages[0]?.id ?? null : null,
    stageName: reise.stages.length === 1 ? reise.stages[0]?.name ?? null : null,
  }
}

function benoetigteZeitraeume(reise: Trip): { bekannt: boolean; zeitraeume: UnterkunftZeitraum[] } {
  const ausEtappen = reise.stages.map(etappenZeitraum)
  if (reise.stages.length > 0 && ausEtappen.every(Boolean)) {
    return { bekannt: true, zeitraeume: ausEtappen.filter((wert): wert is UnterkunftZeitraum => wert !== null) }
  }

  if (reise.stages.length === 0 || reise.stages.length === 1) {
    const fallback = reiseZeitraum(reise)
    if (fallback) return { bekannt: true, zeitraeume: [fallback] }
  }

  if (reise.stages.length > 1 && ausEtappen.some(Boolean) && ausEtappen.some((wert) => wert === null)) {
    return { bekannt: false, zeitraeume: ausEtappen.filter((wert): wert is UnterkunftZeitraum => wert !== null) }
  }

  const fallback = reiseZeitraum(reise)
  if (fallback) return { bekannt: true, zeitraeume: [fallback] }
  return { bekannt: false, zeitraeume: [] }
}

function nachtMenge(zeitraeume: readonly UnterkunftZeitraum[]): Set<string> {
  const naechte = new Set<string>()
  for (const zeitraum of zeitraeume) {
    for (const nacht of naechteHalboffen(zeitraum.start, zeitraum.end)) naechte.add(nacht)
  }
  return naechte
}

function lueckenAus(naechte: readonly string[], stageByNight: Map<string, UnterkunftZeitraum>): UnterkunftLuecke[] {
  if (naechte.length === 0) return []
  const geordnet = [...naechte].sort()
  const luecken: UnterkunftLuecke[] = []
  let start = geordnet[0]
  let vorher = geordnet[0]

  const schliessen = (von: string, letzte: string) => {
    const end = datumVerschieben(letzte, 1)
    if (!end) return
    const zuordnung = stageByNight.get(von)
    luecken.push({
      start: von,
      end,
      naechte: naechteHalboffen(von, end).length,
      stageId: zuordnung?.stageId ?? null,
      stageName: zuordnung?.stageName ?? null,
    })
  }

  for (let i = 1; i < geordnet.length; i += 1) {
    const aktuell = geordnet[i]
    const erwartet = datumVerschieben(vorher, 1)
    const gleicheEtappe = stageByNight.get(start)?.stageId === stageByNight.get(aktuell)?.stageId
    if (erwartet === aktuell && gleicheEtappe) {
      vorher = aktuell
      continue
    }
    schliessen(start, vorher)
    start = aktuell
    vorher = aktuell
  }
  schliessen(start, vorher)
  return luecken
}

function zusammenfassungAus(abdeckung: Omit<UnterkunftAbdeckung, 'zusammenfassung'>): string {
  if (!abdeckung.bekannt || abdeckung.naechteGesamt === null || abdeckung.naechteAbgedeckt === null) {
    return 'Abdeckung noch nicht vollständig bestimmbar'
  }
  if (abdeckung.naechteGesamt === 0) return 'Keine Übernachtung in diesem Zeitraum'
  if (abdeckung.aufenthalte.some((aufenthalt) => aufenthalt.status === 'unknown')) {
    return 'Abdeckung noch nicht vollständig bestimmbar'
  }
  if (abdeckung.naechteAbgedeckt === 0 && abdeckung.aufenthalte.length === 0) {
    return 'Noch keine Unterkunft ausgewählt'
  }
  const gebucht = abdeckung.naechteGebucht ?? 0
  const kern = `${abdeckung.naechteAbgedeckt}/${abdeckung.naechteGesamt} Nächte abgedeckt`
  if (gebucht > 0 && gebucht === abdeckung.naechteAbgedeckt) return `${kern} · gebucht`
  if (gebucht > 0) return `${kern} · ${gebucht} gebucht`
  return kern
}

export function unterkunftAbdeckung(reise: Trip, ohneTag: readonly TripItem[] = []): UnterkunftAbdeckung {
  const { bekannt, zeitraeume } = benoetigteZeitraeume(reise)
  const benoetigt = nachtMenge(zeitraeume)
  const stageByNight = new Map<string, UnterkunftZeitraum>()
  for (const zeitraum of zeitraeume) {
    for (const nacht of naechteHalboffen(zeitraum.start, zeitraum.end)) {
      if (!stageByNight.has(nacht)) stageByNight.set(nacht, zeitraum)
    }
  }

  const stays = allePunkte(reise, ohneTag).filter((punkt) => punkt.kind === 'stay')
  const deckung = new Map<string, 'booked' | 'selected'>()
  const aufenthalte: UnterkunftAufenthalt[] = stays.map((item) => {
    const zeitraum = stayZeitraum(item)
    if (!zeitraum) {
      return {
        item,
        start: item.startsOn,
        end: item.endsOn,
        naechte: null,
        status: 'unknown',
        ausserhalb: false,
      }
    }

    const stayNights = naechteHalboffen(zeitraum.start, zeitraum.end)
    const imZeitraum = stayNights.filter((nacht) => benoetigt.has(nacht))
    const status = istGebucht(item) ? 'booked' : 'selected'
    for (const nacht of imZeitraum) {
      if (status === 'booked' || deckung.get(nacht) !== 'booked') deckung.set(nacht, status)
    }

    return {
      item,
      start: zeitraum.start,
      end: zeitraum.end,
      naechte: stayNights.length,
      status,
      ausserhalb: benoetigt.size > 0 && imZeitraum.length === 0,
    }
  })

  const offeneNaechte = [...benoetigt].filter((nacht) => !deckung.has(nacht)).sort()
  const naechteGesamt = bekannt ? benoetigt.size : null
  const naechteAbgedeckt = bekannt ? deckung.size : null
  const naechteGebucht = bekannt
    ? [...deckung.values()].filter((status) => status === 'booked').length
    : null
  const naechteAusgewaehlt = bekannt
    ? [...deckung.values()].filter((status) => status === 'selected').length
    : null

  const ergebnis: Omit<UnterkunftAbdeckung, 'zusammenfassung'> = {
    bekannt,
    naechteGesamt,
    naechteAbgedeckt,
    naechteGebucht,
    naechteAusgewaehlt,
    zeitraeume,
    luecken: bekannt ? lueckenAus(offeneNaechte, stageByNight) : [],
    aufenthalte,
  }

  return { ...ergebnis, zusammenfassung: zusammenfassungAus(ergebnis) }
}
