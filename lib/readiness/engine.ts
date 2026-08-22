// lib/readiness/engine.ts
//
// Provider-neutrale Travel-Requirements-Engine.
// Ohne Provider niemals required / not_required / conditional.
// Ein LLM-Feld in der Anfrage wird ignoriert.

import { OFFICIAL_REQUIREMENT_TYPES } from '@/types/trips'
import { landescodeLesen } from '@/lib/readiness/domain'
import {
  officialAktionAusQuelle,
  officialFrische,
  officialLeer,
  quelleUrlLesen,
  type MissingFact,
  type OfficialEvaluation,
} from '@/lib/readiness/official'
import { partyVon, travellerSlots } from '@/lib/readiness/party'
import {
  requirementsProviderAus,
  type RequirementsAnfrage,
  type RequirementsProvider,
  type RequirementsProviderZeile,
  type RequirementsTravellerInput,
} from '@/lib/readiness/provider'
import { readinessReisekontext } from '@/lib/readiness/kontext'
import type { Trip } from '@/types/trips'

const KERN_TYPEN = OFFICIAL_REQUIREMENT_TYPES

export function officialFingerprint(anfrage: {
  travellerClientRef: string | null
  nationalityCountryCode: string | null
  residenceCountryCode: string | null
  documentType: string | null
  documentIssuingCountryCode: string | null
  documentExpiresOn: string | null
  originCountryCode?: string | null
  destinationCountryCode: string | null
  transitCountryCodes: readonly string[]
  startDate: string | null
  endDate: string | null
  requirementType: string
}): string {
  return [
    'off-v1',
    `t=${anfrage.travellerClientRef ?? ''}`,
    `nat=${anfrage.nationalityCountryCode ?? ''}`,
    `res=${anfrage.residenceCountryCode ?? ''}`,
    `doc=${anfrage.documentType ?? ''}`,
    `iss=${anfrage.documentIssuingCountryCode ?? ''}`,
    `exp=${anfrage.documentExpiresOn ?? ''}`,
    `orig=${anfrage.originCountryCode ?? ''}`,
    `dest=${anfrage.destinationCountryCode ?? ''}`,
    `tr=${[...anfrage.transitCountryCodes].sort().join(',')}`,
    `start=${anfrage.startDate ?? ''}`,
    `end=${anfrage.endDate ?? ''}`,
    `type=${anfrage.requirementType}`,
  ].join('|')
}

function requirementsAnfrageAusReise(reise: Trip): RequirementsAnfrage {
  const kontext = readinessReisekontext(reise)
  const slots = travellerSlots(reise).filter((slot) => slot.applicable)
  return {
    originCountryCode: kontext.originCountryCode,
    destinationCountryCodes: kontext.destinationCountries,
    transitCountryCodes: kontext.transitCountryCodes,
    startDate: kontext.startDate,
    endDate: kontext.endDate,
    travellers: slots.map((slot): RequirementsTravellerInput => ({
      clientRef: slot.clientRef,
      nationalityCountryCode: landescodeLesen(slot.traveller?.nationalityCountryCode ?? null),
      residenceCountryCode: landescodeLesen(slot.traveller?.residenceCountryCode ?? null),
      documentType: slot.traveller?.documentType ?? null,
      documentIssuingCountryCode: landescodeLesen(slot.traveller?.documentIssuingCountryCode ?? null),
      documentExpiresOn: slot.traveller?.documentExpiresOn ?? null,
    })),
  }
}

function fehlendeFakten(
  anfrage: RequirementsAnfrage,
  traveller: RequirementsTravellerInput,
  requirementType?: OfficialEvaluation['requirementType'],
): MissingFact[] {
  const fakten: MissingFact[] = []
  if (!traveller.nationalityCountryCode) fakten.push('nationality')
  if (anfrage.destinationCountryCodes.length === 0) fakten.push('destination_country')
  if (!anfrage.startDate && !anfrage.endDate) fakten.push('travel_dates')
  if (requirementType === 'transit' && anfrage.transitCountryCodes.length === 0) {
    fakten.push('transit_itinerary')
  }
  return fakten
}

function leerFuer(
  anfrage: RequirementsAnfrage,
  traveller: RequirementsTravellerInput,
  destinationCountryCode: string | null,
  requirementType: OfficialEvaluation['requirementType'],
  extraMissing: MissingFact[] = [],
): OfficialEvaluation {
  const missing = [...new Set([...fehlendeFakten(anfrage, traveller, requirementType), ...extraMissing])]
  const fingerprint = officialFingerprint({
    travellerClientRef: traveller.clientRef,
    nationalityCountryCode: traveller.nationalityCountryCode,
    residenceCountryCode: traveller.residenceCountryCode,
    documentType: traveller.documentType,
    documentIssuingCountryCode: traveller.documentIssuingCountryCode,
    documentExpiresOn: traveller.documentExpiresOn,
    originCountryCode: anfrage.originCountryCode,
    destinationCountryCode,
    transitCountryCodes: anfrage.transitCountryCodes,
    startDate: anfrage.startDate,
    endDate: anfrage.endDate,
    requirementType,
  })
  return officialLeer({
    travellerClientRef: traveller.clientRef,
    destinationCountryCode,
    requirementType,
    status: missing.length > 0 ? 'insufficient_context' : 'unavailable',
    freshness: 'provider_unavailable',
    missingFacts: missing,
    contextFingerprint: fingerprint,
  })
}

function zeileUebernehmen(
  anfrage: RequirementsAnfrage,
  traveller: RequirementsTravellerInput,
  zeile: RequirementsProviderZeile,
  providerName: string,
): OfficialEvaluation | null {
  if (zeile.travellerClientRef !== traveller.clientRef) return null
  if (!OFFICIAL_REQUIREMENT_TYPES.includes(zeile.requirementType)) return null
  if (!['required', 'not_required', 'conditional', 'unknown'].includes(zeile.result)) return null

  const destination = landescodeLesen(zeile.destinationCountryCode)
  const transit = landescodeLesen(zeile.transitCountryCode ?? null)
  const fingerprint = officialFingerprint({
    travellerClientRef: traveller.clientRef,
    nationalityCountryCode: traveller.nationalityCountryCode,
    residenceCountryCode: traveller.residenceCountryCode,
    documentType: traveller.documentType,
    documentIssuingCountryCode: traveller.documentIssuingCountryCode,
    documentExpiresOn: traveller.documentExpiresOn,
    originCountryCode: anfrage.originCountryCode,
    destinationCountryCode: destination,
    transitCountryCodes: transit ? [transit] : anfrage.transitCountryCodes,
    startDate: anfrage.startDate,
    endDate: anfrage.endDate,
    requirementType: zeile.requirementType,
  })
  const freshness = officialFrische({
    storedFingerprint: fingerprint,
    currentFingerprint: fingerprint,
    checkedAt: zeile.checkedAt ?? null,
    validUntil: zeile.validUntil ?? null,
    hasProvider: true,
    sourceAvailable: zeile.availability !== 'temporarily_unavailable',
  })
  const missing = fehlendeFakten(anfrage, traveller, zeile.requirementType)
  if (missing.length > 0) {
    return leerFuer(anfrage, traveller, destination, zeile.requirementType, missing)
  }

  const sourceUrl = quelleUrlLesen(zeile.sourceUrl ?? null)
  const quelleFehlt = freshness === 'source_temporarily_unavailable' || freshness === 'stale' || freshness === 'recheck_needed'

  return {
    travellerClientRef: traveller.clientRef,
    destinationCountryCode: destination,
    transitCountryCode: transit,
    requirementType: zeile.requirementType,
    result: quelleFehlt ? 'unknown' : zeile.result,
    status: freshness === 'current' ? 'current' : 'unknown',
    freshness,
    officialClass:
      zeile.requirementType === 'health' ||
      zeile.requirementType === 'vaccination' ||
      zeile.requirementType === 'health_document'
        ? zeile.officialClass ?? 'unknown'
        : zeile.officialClass === 'requirement'
          ? 'requirement'
          : 'unknown',
    missingFacts: [],
    evidence: {
      provider: providerName,
      authority: typeof zeile.authority === 'string' ? zeile.authority.slice(0, 80) : null,
      sourceUrl,
      checkedAt: zeile.checkedAt ?? null,
      validFrom: zeile.validFrom ?? null,
      validUntil: zeile.validUntil ?? null,
      ruleReference: typeof zeile.ruleReference === 'string' ? zeile.ruleReference.slice(0, 80) : null,
      contextFingerprint: fingerprint,
    },
    action: quelleFehlt ? null : officialAktionAusQuelle(sourceUrl),
  }
}

export function requirementsAuswerten(
  anfrage: RequirementsAnfrage,
  provider: RequirementsProvider | null = requirementsProviderAus(),
  roh: unknown = null,
): OfficialEvaluation[] {
  if (roh && typeof roh === 'object' && roh !== null) {
    const behauptung = roh as { officialResult?: unknown; llmResult?: unknown; result?: unknown }
    void behauptung.officialResult
    void behauptung.llmResult
    void behauptung.result
  }

  const evaluations: OfficialEvaluation[] = []
  const gesehen = new Set<string>()
  const merken = (evaluation: OfficialEvaluation) => {
    const key = `${evaluation.travellerClientRef}|${evaluation.destinationCountryCode}|${evaluation.requirementType}|${evaluation.transitCountryCode}`
    if (gesehen.has(key)) return
    gesehen.add(key)
    evaluations.push(evaluation)
  }

  const destinations =
    anfrage.destinationCountryCodes.length > 0 ? anfrage.destinationCountryCodes : [null]
  const travellers =
    anfrage.travellers.length > 0
      ? anfrage.travellers
      : [
          {
            clientRef: 'traveller:1',
            nationalityCountryCode: null,
            residenceCountryCode: null,
            documentType: null,
            documentIssuingCountryCode: null,
            documentExpiresOn: null,
          },
        ]

  const providerZeilen = provider ? provider.evaluate(anfrage) : []

  for (const traveller of travellers) {
    for (const destination of destinations) {
      for (const typ of KERN_TYPEN) {
        const vomProvider = provider
          ? providerZeilen.find(
              (zeile) =>
                zeile.travellerClientRef === traveller.clientRef &&
                landescodeLesen(zeile.destinationCountryCode) === destination &&
                zeile.requirementType === typ,
            )
          : undefined
        if (vomProvider && provider) {
          const uebernommen = zeileUebernehmen(anfrage, traveller, vomProvider, provider.name)
          if (uebernommen) merken(uebernommen)
          else merken(leerFuer(anfrage, traveller, destination, typ))
        } else {
          merken(leerFuer(anfrage, traveller, destination, typ))
        }
      }
    }
  }

  return evaluations
}

export function requirementsFuerReise(
  reise: Trip,
  provider: RequirementsProvider | null = requirementsProviderAus(),
): OfficialEvaluation[] {
  return requirementsAuswerten(requirementsAnfrageAusReise(reise), provider)
}

export function travellerGeloeschtPruefen(reise: Trip, clientRef: string): boolean {
  return !partyVon(reise).some((eintrag) => eintrag.clientRef === clientRef)
}
