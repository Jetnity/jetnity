// lib/reiseaenderung/snapshot.ts
//
// Die Reise, wie das Modell sie sehen darf.
//
// Keine Preise, keine Anbieter, keine Buchungslinks, kein Status, keine
// Nutzerkennung. Nur das, was eine Änderung braucht: Kennungen, Reihenfolge,
// Orte, Dauer, Tempo.
//
// Frei von Next, Supabase und `process.env`.

import type { Reisegraph } from '@/types/trips'

export type ReisefuerModell = {
  id: string
  revision: number
  titel: string
  abreiseort: string | null
  startdatum: string | null
  enddatum: string | null
  reisende: number
  waehrung: string
  budgetziel: number | null
  tempo: string
  interessen: string[]
  reisewunsch: string | null
  etappen: {
    id: string
    position: number
    name: string
    laendercode: string | null
    anreise: string | null
    abreise: string | null
    tagIds: string[]
  }[]
  tage: {
    id: string
    nummer: number
    datum: string | null
    titel: string | null
    etappeId: string | null
    punkte: {
      id: string
      art: string
      titel: string
      notiz: string | null
      beginn: string | null
    }[]
  }[]
}

/** Die kompakte, ungefährliche Fassung einer Reise für den Modellprompt. */
export function reiseFuerModell(reise: Reisegraph): ReisefuerModell {
  return {
    id: reise.id,
    revision: reise.revision,
    titel: reise.title,
    abreiseort: reise.origin,
    startdatum: reise.startDate,
    enddatum: reise.endDate,
    reisende: reise.travellers,
    waehrung: reise.currency,
    budgetziel: reise.budgetAmount,
    tempo: reise.pace,
    interessen: [...reise.interests],
    reisewunsch: reise.travelWish,
    etappen: reise.stages.map((etappe) => ({
      id: etappe.id,
      position: etappe.position,
      name: etappe.name,
      laendercode: etappe.countryCode,
      anreise: etappe.arrivalDate,
      abreise: etappe.departureDate,
      tagIds: reise.days.filter((tag) => tag.stageId === etappe.id).map((tag) => tag.id),
    })),
    tage: reise.days.map((tag) => ({
      id: tag.id,
      nummer: tag.dayIndex,
      datum: tag.dayDate,
      titel: tag.title,
      etappeId: tag.stageId,
      punkte: tag.items.map((punkt) => ({
        id: punkt.id,
        art: punkt.kind,
        titel: punkt.title,
        notiz: punkt.note,
        beginn: punkt.startsAt,
      })),
    })),
  }
}
