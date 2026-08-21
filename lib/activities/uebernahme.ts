// lib/activities/uebernahme.ts
//
// ActivityOption → kommerzieller Planpunkt `activity`. Nur die Momentaufnahme,
// die die Reise braucht. bookingUrl bleibt leer: Die Suchschicht erzeugt keinen Deeplink.
//
// Frei von Next und Providern.

import type { ActivityOption } from '@/lib/activities/domain'
import { activityOptionLesen } from '@/lib/activities/schema'
import type { TripItem } from '@/types/trips'
import { unbestaetigteBuchung } from '@/lib/trips/buchung'
import { leereMobilitaet } from '@/lib/trips/mobilitaet-felder'

export type ActivityMomentaufnahme = {
  kind: 'activity'
  title: string
  note: string
  startsOn: string | null
  startsAt: string | null
  endsOn: string | null
  endsAt: string | null
  priceAmount: number | null
  priceCurrency: string | null
  provider: string
  externalRef: string
  bookingUrl: null
}

function bewertungText(option: ActivityOption): string | null {
  if (option.bewertung === null) return null
  const basis = option.bewertungenAnzahl !== null ? ` (${option.bewertungenAnzahl} Bewertungen)` : ''
  return `Bewertung ${option.bewertung.toFixed(1)}${basis}`
}

function dauerText(option: ActivityOption): string | null {
  if (option.dauerMinuten === null) return null
  if (option.dauerMinuten < 60) return `${option.dauerMinuten} Min.`
  const stunden = Math.floor(option.dauerMinuten / 60)
  const minuten = option.dauerMinuten % 60
  return minuten === 0 ? `${stunden} Std.` : `${stunden} Std. ${minuten} Min.`
}

function activityNotiz(option: ActivityOption, tagDatum: string | null): string {
  const teile = [
    option.locationName,
    dauerText(option),
    bewertungText(option),
    option.stornierbar === true ? 'Stornierbar' : option.stornierbar === false ? 'Nicht stornierbar' : null,
    option.timeslot
      ? `${option.timeslot.startsOn} ${option.timeslot.startsAt}${
          option.timeslot.endsAt ? `–${option.timeslot.endsAt}` : ''
        }`
      : tagDatum,
    option.preis !== null && option.preisWaehrung
      ? `${option.preis} ${option.preisWaehrung}`
      : null,
  ]
  return teile.filter(Boolean).join(' · ').slice(0, 500)
}

export function alsActivityMomentaufnahme(
  wert: unknown,
  tagDatum: string | null,
): ActivityMomentaufnahme | null {
  const option = activityOptionLesen(wert)
  if (!option) return null
  if (option.preis !== null && !option.preisWaehrung) return null
  if (option.preis === null && option.preisWaehrung) return null

  const startsOn = option.timeslot?.startsOn ?? tagDatum
  const startsAt = option.timeslot?.startsAt ?? null
  const endsOn = option.timeslot?.endsOn ?? null
  const endsAt = option.timeslot?.endsAt ?? null

  return {
    kind: 'activity',
    title: option.title.slice(0, 120),
    note: activityNotiz(option, tagDatum),
    startsOn,
    startsAt,
    endsOn,
    endsAt,
    priceAmount: option.preis,
    priceCurrency: option.preisWaehrung,
    provider: option.provider,
    externalRef: option.externalRef,
    bookingUrl: null,
  }
}

export function activityMomentaufnahmeAlsPunkt(
  aufnahme: ActivityMomentaufnahme,
  ids: { id: string; dayId: string; stageId: string; position: number },
): TripItem {
  return {
    id: ids.id,
    dayId: ids.dayId,
    stageId: ids.stageId,
    kind: 'activity',
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
    ...unbestaetigteBuchung(),
    ...leereMobilitaet(),
  }
}
