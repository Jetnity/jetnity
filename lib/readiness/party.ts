// lib/readiness/party.ts
//
// Reisenden-Slots aus Anzahl + gespeichertem Kontext.
// Bekannte Fakten nicht erneut verlangen.

import { landescodeLesen } from '@/lib/readiness/domain'
import type { MissingFact } from '@/lib/readiness/official'
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
  if (!landescodeLesen(traveller?.nationalityCountryCode ?? null)) missingFacts.push('nationality')
  if (!landescodeLesen(traveller?.residenceCountryCode ?? null)) missingFacts.push('residence')
  if (!traveller?.documentType || traveller.documentType === 'unknown') missingFacts.push('document_type')
  if (!landescodeLesen(traveller?.documentIssuingCountryCode ?? null)) {
    missingFacts.push('document_issuing_country')
  }
  if (!traveller?.documentExpiresOn) missingFacts.push('document_expiry')

  return {
    clientRef,
    label: traveller?.label?.trim() || fallbackLabel,
    persisted: Boolean(traveller),
    traveller,
    missingFacts: applicable ? missingFacts : [],
    applicable,
  }
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
