// lib/readiness/party.ts
//
// Reisenden-Slots aus Anzahl + gespeichertem Kontext.
// Bekannte Fakten nicht erneut verlangen.

import { landescodeLesen } from '@/lib/readiness/domain'
import type { MissingFact } from '@/lib/readiness/official'
import { travellerFehlendeKernfakten } from '@/lib/readiness/traveller-kontext'
import type { Trip, TripTraveller } from '@/types/trips'

export const PARTY_GRENZEN = {
  label: 40,
  slots: 20,
} as const

export type TravellerSlot = {
  clientRef: string
  label: string
  persisted: boolean
  traveller: TripTraveller | null
  missingFacts: MissingFact[]
  applicable: boolean
}

export function partyVon(reise: Pick<Trip, 'party'>): TripTraveller[] {
  return [...(reise.party ?? [])]
}

export function travellerSlots(reise: Pick<Trip, 'travellers' | 'party'>): TravellerSlot[] {
  const gespeichert = partyVon(reise)
  const nachRef = new Map(gespeichert.map((eintrag) => [eintrag.clientRef, eintrag]))
  const anzahl = Math.min(Math.max(reise.travellers, 1), PARTY_GRENZEN.slots)
  const slots: TravellerSlot[] = []

  for (let i = 1; i <= anzahl; i += 1) {
    const clientRef = `traveller:${i}`
    const traveller = nachRef.get(clientRef) ?? null
    slots.push(slotAus(clientRef, `Reisende ${i}`, traveller, true))
    nachRef.delete(clientRef)
  }

  for (const extra of nachRef.values()) {
    slots.push(slotAus(extra.clientRef, extra.label ?? extra.clientRef, extra, false))
  }

  return slots
}

function slotAus(
  clientRef: string,
  fallbackLabel: string,
  traveller: TripTraveller | null,
  applicable: boolean,
): TravellerSlot {
  const missingFacts: MissingFact[] = []
  if (travellerFehlendeKernfakten(traveller).includes('nationality')) missingFacts.push('nationality')

  return {
    clientRef,
    label: traveller?.label?.trim() || fallbackLabel,
    persisted: Boolean(traveller),
    traveller,
    missingFacts: applicable ? missingFacts : [],
    applicable,
  }
}

export function slotMissingFactsErgaenzen(
  slot: TravellerSlot,
  extra: readonly MissingFact[],
): TravellerSlot {
  if (!slot.applicable) return slot
  const gesehen = new Set(slot.missingFacts)
  const kern = travellerFehlendeKernfakten(slot.traveller)
  for (const fakt of extra) {
    if (fakt === 'residence' && !landescodeLesen(slot.traveller?.residenceCountryCode ?? null)) {
      gesehen.add(fakt)
    }
    if (fakt === 'document_type' && kern.includes('document_type')) gesehen.add(fakt)
    if (fakt === 'document_issuing_country' && kern.includes('document_issuing_country')) gesehen.add(fakt)
    if (fakt === 'document_expiry' && kern.includes('document_expiry')) gesehen.add(fakt)
    if (fakt === 'nationality' && kern.includes('nationality')) gesehen.add(fakt)
  }
  return { ...slot, missingFacts: [...gesehen] }
}

export function fehlendeFaktenFuerReise(reise: Pick<Trip, 'travellers' | 'party' | 'startDate' | 'endDate'> & {
  stages?: { countryCode?: string | null }[]
}): MissingFact[] {
  const gesehen = new Set<MissingFact>()
  for (const slot of travellerSlots(reise)) {
    if (!slot.applicable) continue
    for (const fakt of slot.missingFacts) gesehen.add(fakt)
  }
  const laender = (reise.stages ?? [])
    .map((etappe) => landescodeLesen(etappe.countryCode ?? null))
    .filter((code): code is string => Boolean(code))
  if (laender.length === 0) gesehen.add('destination_country')
  if (!reise.startDate && !reise.endDate) gesehen.add('travel_dates')
  return [...gesehen]
}

export function gruppenUnterschiede(reise: Pick<Trip, 'travellers' | 'party'>): {
  mehrereTraveller: boolean
  unterschiedlicheCitizenships: boolean
  unterschiedlicheDokumente: boolean
} {
  const slots = travellerSlots(reise).filter((slot) => slot.applicable)
  const citizenships = slots.map((slot) =>
    (slot.traveller?.citizenships ?? []).map((eintrag) => eintrag.countryCode).sort().join(','),
  )
  const dokumente = slots.map((slot) =>
    (slot.traveller?.documents ?? [])
      .map((eintrag) => `${eintrag.documentType}:${eintrag.issuingCountryCode ?? ''}`)
      .sort()
      .join(','),
  )
  return {
    mehrereTraveller: slots.length > 1,
    unterschiedlicheCitizenships: new Set(citizenships).size > 1,
    unterschiedlicheDokumente: new Set(dokumente).size > 1,
  }
}
