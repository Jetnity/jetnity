// lib/readiness/party.ts
//
// Reisenden-Slots aus Anzahl + gespeichertem Kontext.
// `Trip.travellers` ist die Anzahl anwendbarer Plätze.
// Ein exaktes `traveller:N` innerhalb der Kopfzahl bleibt in seinem Platz.
// Kanonische `traveller:N` ausserhalb der Kopfzahl bleiben nicht anwendbar.
// Nur nicht-kanonische Trip-Snapshots füllen leere Plätze, in stabiler
// Reihenfolge createdAt, dann clientRef, und behalten ihre eigene clientRef.
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

/** True, wenn neue client_refs den Bestand über das Party-Limit heben. Bestehende Refs sind Updates. */
export function partyLimitUeberschritten(
  bestehendeRefs: Iterable<string>,
  naechsteRefs: Iterable<string>,
  limit: number = PARTY_GRENZEN.slots,
): boolean {
  const bestehend = new Set(bestehendeRefs)
  let neu = 0
  for (const ref of naechsteRefs) {
    if (!bestehend.has(ref)) neu += 1
  }
  return bestehend.size + neu > limit
}

/** Codepoint-Ordnung. Unabhängig von Array-Reihenfolge und Locale. */
function travellerReihenfolge(links: TripTraveller, rechts: TripTraveller): number {
  if (links.createdAt < rechts.createdAt) return -1
  if (links.createdAt > rechts.createdAt) return 1
  if (links.clientRef < rechts.clientRef) return -1
  if (links.clientRef > rechts.clientRef) return 1
  return 0
}

/** Kanonische Platz-Identität, wie der Slot-Index sie schreibt: `traveller:1`, nicht `traveller:01`. */
function kanonischePlatznummer(clientRef: string): number | null {
  const treffer = /^traveller:([1-9][0-9]*)$/.exec(clientRef)
  if (!treffer) return null
  const nummer = Number(treffer[1])
  return Number.isSafeInteger(nummer) ? nummer : null
}

export function travellerSlots(reise: Pick<Trip, 'travellers' | 'party'>): TravellerSlot[] {
  const gespeichert = partyVon(reise)
  const nachRef = new Map(gespeichert.map((eintrag) => [eintrag.clientRef, eintrag]))
  const anzahl = Math.min(Math.max(reise.travellers, 1), PARTY_GRENZEN.slots)
  const kanonisch = new Map<number, TripTraveller>()

  for (let i = 1; i <= anzahl; i += 1) {
    const clientRef = `traveller:${i}`
    const traveller = nachRef.get(clientRef)
    if (!traveller) continue
    kanonisch.set(i, traveller)
    nachRef.delete(clientRef)
  }

  const rest = [...nachRef.values()]
  const fuellbar = rest
    .filter((eintrag) => kanonischePlatznummer(eintrag.clientRef) === null)
    .sort(travellerReihenfolge)
  const ausserhalb = rest
    .filter((eintrag) => kanonischePlatznummer(eintrag.clientRef) !== null)
    .sort(travellerReihenfolge)
  let restIndex = 0
  const slots: TravellerSlot[] = []

  for (let i = 1; i <= anzahl; i += 1) {
    const fest = kanonisch.get(i)
    if (fest) {
      slots.push(slotAus(`traveller:${i}`, `Reisende ${i}`, fest, true))
      continue
    }
    const naechster = fuellbar[restIndex]
    if (naechster) {
      restIndex += 1
      slots.push(slotAus(naechster.clientRef, `Reisende ${i}`, naechster, true))
      continue
    }
    slots.push(slotAus(`traveller:${i}`, `Reisende ${i}`, null, true))
  }

  for (const extra of [...fuellbar.slice(restIndex), ...ausserhalb]) {
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
