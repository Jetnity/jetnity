// lib/flights/uebernahme.ts
//
// FlugOption → kommerzieller Planpunkt. Nur die Momentaufnahme, die die Reise
// braucht. bookingUrl bleibt leer: Die Suchschicht erzeugt keinen Deeplink.
//
// Frei von Next und Providern.

import type { FlugOption, FlugSegment } from '@/lib/flights/domain'
import { flugOptionLesen } from '@/lib/flights/schema'
import type { TripItem } from '@/types/trips'
import { dauerLesbar } from '@/lib/flights/zeit'

export type FlugMomentaufnahme = {
  kind: 'flight'
  title: string
  note: string
  startsOn: string
  startsAt: string
  endsOn: string
  endsAt: string
  priceAmount: number
  priceCurrency: string
  provider: string
  externalRef: string
  bookingUrl: null
}

function routeKurz(option: FlugOption): string {
  const teile = option.legs.map((bein) => {
    const start = bein.segments[0]
    const ende = bein.segments[bein.segments.length - 1]
    if (!start || !ende) return ''
    return `${start.origin} → ${ende.destination}`
  })
  return teile.filter(Boolean).join(' · ')
}

function stoppKurz(option: FlugOption): string {
  if (option.stops <= 0) return 'Direkt'
  if (option.stops === 1) return '1 Stopp'
  return `${option.stops} Stopps`
}

function segmentZeile(segment: FlugSegment): string {
  const op =
    segment.operatingAirline && segment.operatingAirline !== segment.airline
      ? ` (op. ${segment.operatingAirline})`
      : ''
  return `${segment.flightNumber}${op} ${segment.origin} ${segment.departureTime} → ${segment.destination} ${segment.arrivalTime}`
}

export function flugTitel(option: FlugOption): string {
  const titel = `${routeKurz(option)} · ${option.airlineName}`
  return titel.slice(0, 120)
}

export function flugNotiz(option: FlugOption): string {
  const koepfe = option.legs.map((bein, index) => {
    const start = bein.segments[0]
    const ende = bein.segments[bein.segments.length - 1]
    if (!start || !ende) return ''
    const prefix = option.legs.length > 1 ? `Teil ${index + 1}: ` : ''
    const umstieg = bein.stops === 0 ? 'Direkt' : `${bein.stops} Stopp${bein.stops === 1 ? '' : 's'}`
    const zeilen = bein.segments.map(segmentZeile).join('; ')
    return `${prefix}${start.origin} ${start.departureDate} ${start.departureTime} → ${ende.destination} ${ende.arrivalDate} ${ende.arrivalTime} · ${umstieg} · ${dauerLesbar(bein.durationMinutes)}. ${zeilen}`
  })
  return koepfe.filter(Boolean).join(' ').slice(0, 500)
}

export function alsFlugMomentaufnahme(wert: unknown): FlugMomentaufnahme | null {
  const option = flugOptionLesen(wert)
  if (!option) return null
  const start = option.legs[0]?.segments[0]
  const letztesBein = option.legs[option.legs.length - 1]
  const ende = letztesBein?.segments[letztesBein.segments.length - 1]
  if (!start || !ende) return null

  return {
    kind: 'flight',
    title: flugTitel(option),
    note: flugNotiz(option),
    startsOn: start.departureDate,
    startsAt: start.departureTime,
    endsOn: ende.arrivalDate,
    endsAt: ende.arrivalTime,
    priceAmount: option.priceAmount,
    priceCurrency: option.priceCurrency,
    provider: option.provider,
    externalRef: option.externalRef,
    bookingUrl: null,
  }
}

export function momentaufnahmeAlsPunkt(
  aufnahme: FlugMomentaufnahme,
  ids: { id: string; dayId: string | null; stageId: string | null; position: number },
): TripItem {
  return {
    id: ids.id,
    dayId: ids.dayId,
    stageId: ids.stageId,
    kind: 'flight',
    title: aufnahme.title,
    note: aufnahme.note,
    position: ids.position,
    startsOn: aufnahme.startsOn,
    startsAt: aufnahme.startsAt,
    endsOn: aufnahme.endsOn,
    endsAt: aufnahme.endsAt,
    priceAmount: aufnahme.priceAmount,
    priceCurrency: aufnahme.priceCurrency,
    provider: aufnahme.provider,
    externalRef: aufnahme.externalRef,
    bookingUrl: null,
  }
}

export function stoppKurztext(option: FlugOption): string {
  return stoppKurz(option)
}
