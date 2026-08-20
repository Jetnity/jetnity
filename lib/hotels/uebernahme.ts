// lib/hotels/uebernahme.ts
//
// HotelOption → kommerzieller Planpunkt `stay`. Nur die Momentaufnahme, die
// die Reise braucht. bookingUrl bleibt leer: Die Suchschicht erzeugt keinen Deeplink.
//
// Frei von Next und Providern.

import type { HotelOption } from '@/lib/hotels/domain'
import { hotelOptionLesen } from '@/lib/hotels/schema'
import type { TripItem } from '@/types/trips'

export type HotelMomentaufnahme = {
  kind: 'stay'
  title: string
  note: string
  startsOn: string
  startsAt: null
  endsOn: string
  endsAt: null
  priceAmount: number
  priceCurrency: string
  provider: string
  externalRef: string
  bookingUrl: null
}

function sterneText(option: HotelOption): string | null {
  if (option.sterne === null) return null
  return `${option.sterne} Sterne`
}

function bewertungText(option: HotelOption): string | null {
  if (option.bewertung === null) return null
  const basis = option.bewertungenAnzahl !== null ? ` (${option.bewertungenAnzahl} Bewertungen)` : ''
  return `Bewertung ${option.bewertung.toFixed(1)}${basis}`
}

export function hotelTitel(option: HotelOption): string {
  const lage = option.quartierName ? ` · ${option.quartierName}` : ''
  return `${option.name}${lage}`.slice(0, 120)
}

export function hotelNotiz(option: HotelOption, checkIn: string, checkOut: string): string {
  const teile = [
    option.adresse,
    sterneText(option),
    bewertungText(option),
    option.zimmerName,
    option.fruehstueckEnthalten === true
      ? 'Frühstück enthalten'
      : option.fruehstueckEnthalten === false
        ? 'Frühstück nicht enthalten'
        : null,
    option.stornierbar === true
      ? option.stornierungBis
        ? `Stornierbar bis ${option.stornierungBis}`
        : 'Stornierbare Rate'
      : option.stornierbar === false
        ? 'Nicht stornierbar'
        : null,
    option.steuernEnthalten === true ? 'Steuern enthalten' : option.steuernEnthalten === false ? 'Steuern nicht enthalten' : null,
    `${checkIn} bis ${checkOut}`,
    `${option.preisProNacht} ${option.preisWaehrung} / Nacht`,
  ]
  return teile.filter(Boolean).join(' · ').slice(0, 500)
}

export function alsHotelMomentaufnahme(
  wert: unknown,
  zeitraum: { checkIn: string; checkOut: string },
): HotelMomentaufnahme | null {
  const option = hotelOptionLesen(wert)
  if (!option) return null
  if (zeitraum.checkIn >= zeitraum.checkOut) return null

  return {
    kind: 'stay',
    title: hotelTitel(option),
    note: hotelNotiz(option, zeitraum.checkIn, zeitraum.checkOut),
    startsOn: zeitraum.checkIn,
    startsAt: null,
    endsOn: zeitraum.checkOut,
    endsAt: null,
    priceAmount: option.preisGesamt,
    priceCurrency: option.preisWaehrung,
    provider: option.provider,
    externalRef: option.externalRef,
    bookingUrl: null,
  }
}

export function hotelMomentaufnahmeAlsPunkt(
  aufnahme: HotelMomentaufnahme,
  ids: { id: string; dayId: string | null; stageId: string | null; position: number },
): TripItem {
  return {
    id: ids.id,
    dayId: ids.dayId,
    stageId: ids.stageId,
    kind: 'stay',
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
