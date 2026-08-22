// lib/readiness/engine.ts
//
// Provider-neutrale Travel-Requirements-Engine.
// Ohne Provider niemals required / not_required / conditional.
// Ein LLM-Feld in der Anfrage wird ignoriert.

import { OFFICIAL_REQUIREMENT_TYPES } from '@/types/trips'
import { landescodeLesen } from '@/lib/readiness/domain'
import {
  authorityLesen,
  checkedAtLesen,
  gültigkeitszeitLesen,
  missingFactsLesen,
  officialAktionAusQuelle,
  officialEvidenceVertrauenswuerdig,
  officialFrische,
  officialLeer,
  providerNameLesen,
  quelleUrlLesen,
  regelReferenzLesen,
  type MissingFact,
  type OfficialEvaluation,
  type OfficialFreshness,
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
  transitCountryCode: string | null = null,
  freshness: OfficialFreshness = 'provider_unavailable',
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
    transitCountryCodes: transitCountryCode ? [transitCountryCode] : anfrage.transitCountryCodes,
    startDate: anfrage.startDate,
    endDate: anfrage.endDate,
    requirementType,
  })
  return officialLeer({
    travellerClientRef: traveller.clientRef,
    destinationCountryCode,
    transitCountryCode,
    requirementType,
    status: missing.length > 0 ? 'insufficient_context' : freshness === 'provider_unavailable' ? 'unavailable' : 'unknown',
    freshness,
    missingFacts: missing,
    contextFingerprint: fingerprint,
  })
}

function gültigkeitsfeld(roh: unknown): { ok: true; wert: string | null } | { ok: false } {
  if (roh == null || roh === '') return { ok: true, wert: null }
  const wert = gültigkeitszeitLesen(roh)
  return wert ? { ok: true, wert } : { ok: false }
}

function providerFehlerFreshness(fehler: unknown): OfficialFreshness {
  if (fehler && typeof fehler === 'object' && 'availability' in fehler) {
    const art = (fehler as { availability?: unknown }).availability
    if (art === 'unavailable') return 'provider_unavailable'
  }
  return 'source_temporarily_unavailable'
}

/**
 * Untrusted Evidence darf niemals current bleiben.
 * Bereits ehrliche stale / recheck / source-outage bleiben erhalten.
 */
function freshnessNachTrust(freshness: OfficialFreshness, vertrauenswuerdig: boolean): OfficialFreshness {
  if (vertrauenswuerdig) return freshness
  if (
    freshness === 'stale' ||
    freshness === 'recheck_needed' ||
    freshness === 'source_temporarily_unavailable'
  ) {
    return freshness
  }
  return 'never_checked'
}

function zeileUebernehmen(
  anfrage: RequirementsAnfrage,
  traveller: RequirementsTravellerInput,
  zeile: RequirementsProviderZeile,
  providerNameRoh: string,
): OfficialEvaluation | null {
  if (zeile.travellerClientRef !== traveller.clientRef) return null
  if (!OFFICIAL_REQUIREMENT_TYPES.includes(zeile.requirementType)) return null
  if (!['required', 'not_required', 'conditional', 'unknown', 'insufficient_context'].includes(zeile.result)) {
    return null
  }

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
  const provider = providerNameLesen(providerNameRoh)
  const checkedAt = checkedAtLesen(zeile.checkedAt ?? null)
  const authority = authorityLesen(zeile.authority ?? null)
  const ruleReference = regelReferenzLesen(zeile.ruleReference ?? null)
  const sourceUrlRoh = zeile.sourceUrl ?? null
  const sourceUrl = quelleUrlLesen(sourceUrlRoh)
  const validFromFeld = gültigkeitsfeld(zeile.validFrom)
  const validUntilFeld = gültigkeitsfeld(zeile.validUntil)
  if (!validFromFeld.ok || !validUntilFeld.ok) {
    return officialLeer({
      travellerClientRef: traveller.clientRef,
      destinationCountryCode: destination,
      transitCountryCode: transit,
      requirementType: zeile.requirementType,
      status: 'unknown',
      freshness: 'never_checked',
      missingFacts: [],
      contextFingerprint: fingerprint,
    })
  }
  const freshness = officialFrische({
    storedFingerprint: fingerprint,
    currentFingerprint: fingerprint,
    checkedAt,
    validFrom: validFromFeld.wert,
    validUntil: validUntilFeld.wert,
    hasProvider: true,
    sourceAvailable: zeile.availability !== 'temporarily_unavailable',
  })
  const providerMissing = missingFactsLesen(zeile.missingFacts).filter((fakt) => {
    if (fakt === 'origin_country') return !anfrage.originCountryCode
    if (fakt === 'transit_itinerary') return anfrage.transitCountryCodes.length === 0
    if (fakt === 'residence') return !traveller.residenceCountryCode
    if (fakt === 'document_type') return !traveller.documentType || traveller.documentType === 'unknown'
    if (fakt === 'document_issuing_country') return !traveller.documentIssuingCountryCode
    if (fakt === 'document_expiry') return !traveller.documentExpiresOn
    if (fakt === 'nationality') return !traveller.nationalityCountryCode
    if (fakt === 'destination_country') return anfrage.destinationCountryCodes.length === 0
    if (fakt === 'travel_dates') return !anfrage.startDate && !anfrage.endDate
    return true
  })
  const missing = [...new Set([...fehlendeFakten(anfrage, traveller, zeile.requirementType), ...providerMissing])]
  if (missing.length > 0 || zeile.result === 'insufficient_context') {
    return officialLeer({
      travellerClientRef: traveller.clientRef,
      destinationCountryCode: destination,
      transitCountryCode: transit,
      requirementType: zeile.requirementType,
      status: 'insufficient_context',
      freshness: freshness === 'provider_unavailable' ? 'never_checked' : freshness,
      missingFacts: missing.length > 0 ? missing : missingFactsLesen(zeile.missingFacts),
      contextFingerprint: fingerprint,
    })
  }

  const vertrauenswuerdig = officialEvidenceVertrauenswuerdig({
    provider,
    checkedAt,
    authority,
    ruleReference,
    sourceUrl,
    sourceUrlRoh,
  })
  const uebernehmbar =
    vertrauenswuerdig &&
    freshness === 'current' &&
    (zeile.result === 'required' || zeile.result === 'not_required' || zeile.result === 'conditional')

  return {
    travellerClientRef: traveller.clientRef,
    destinationCountryCode: destination,
    transitCountryCode: transit,
    requirementType: zeile.requirementType,
    result: uebernehmbar ? zeile.result : 'unknown',
    status: uebernehmbar ? 'current' : 'unknown',
    freshness: freshnessNachTrust(freshness, vertrauenswuerdig),
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
      provider,
      authority,
      sourceUrl,
      checkedAt,
      validFrom: validFromFeld.wert,
      validUntil: validUntilFeld.wert,
      ruleReference,
      contextFingerprint: fingerprint,
    },
    action: uebernehmbar ? officialAktionAusQuelle(sourceUrl) : null,
  }
}

/**
 * Reine Normalisierung. Kein Netzwerk, keine Provider-Ausführung.
 */
export function requirementsAusZeilen(
  anfrage: RequirementsAnfrage,
  providerZeilen: readonly RequirementsProviderZeile[],
  providerName: string | null,
  roh: unknown = null,
  leerFreshness: OfficialFreshness = 'provider_unavailable',
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
  const angefragteTransits = [
    ...new Set(
      anfrage.transitCountryCodes
        .map((code) => landescodeLesen(code))
        .filter((code): code is string => Boolean(code)),
    ),
  ]
  const hatProvider = Boolean(providerName)

  for (const traveller of travellers) {
    for (const destination of destinations) {
      for (const typ of KERN_TYPEN) {
        const zeilen = hatProvider
          ? providerZeilen.filter((zeile) => {
              if (zeile.travellerClientRef !== traveller.clientRef) return false
              if (landescodeLesen(zeile.destinationCountryCode) !== destination) return false
              if (zeile.requirementType !== typ) return false
              if (typ === 'transit') {
                const transit = landescodeLesen(zeile.transitCountryCode ?? null)
                return Boolean(transit && angefragteTransits.includes(transit))
              }
              return true
            })
          : []

        if (typ === 'transit' && angefragteTransits.length > 0) {
          for (const transit of angefragteTransits) {
            const passende = zeilen.filter((zeile) => landescodeLesen(zeile.transitCountryCode ?? null) === transit)
            let uebernommen = 0
            if (hatProvider) {
              for (const zeile of passende) {
                const evaluation = zeileUebernehmen(anfrage, traveller, zeile, providerName as string)
                if (evaluation) {
                  merken(evaluation)
                  uebernommen += 1
                }
              }
            }
            if (uebernommen === 0) {
              merken(leerFuer(anfrage, traveller, destination, typ, [], transit, leerFreshness))
            }
          }
          continue
        }

        if (zeilen.length > 0 && hatProvider) {
          let uebernommen = 0
          for (const zeile of zeilen) {
            const evaluation = zeileUebernehmen(anfrage, traveller, zeile, providerName as string)
            if (evaluation) {
              merken(evaluation)
              uebernommen += 1
            }
          }
          if (uebernommen === 0) merken(leerFuer(anfrage, traveller, destination, typ, [], null, leerFreshness))
        } else {
          merken(leerFuer(anfrage, traveller, destination, typ, [], null, leerFreshness))
        }
      }
    }
  }

  return evaluations
}

export async function requirementsAuswerten(
  anfrage: RequirementsAnfrage,
  provider: RequirementsProvider | null = requirementsProviderAus(),
  roh: unknown = null,
): Promise<OfficialEvaluation[]> {
  if (!provider) return requirementsAusZeilen(anfrage, [], null, roh)
  try {
    const zeilen = await provider.evaluate(anfrage)
    return requirementsAusZeilen(anfrage, zeilen, provider.name, roh)
  } catch (fehler) {
    return requirementsAusZeilen(anfrage, [], provider.name, roh, providerFehlerFreshness(fehler))
  }
}

export function requirementsLokalFuerReise(reise: Trip): OfficialEvaluation[] {
  return requirementsAusZeilen(requirementsAnfrageAusReise(reise), [], null)
}

export async function requirementsFuerReise(
  reise: Trip,
  provider: RequirementsProvider | null = requirementsProviderAus(),
): Promise<OfficialEvaluation[]> {
  return requirementsAuswerten(requirementsAnfrageAusReise(reise), provider)
}

export function travellerGeloeschtPruefen(reise: Trip, clientRef: string): boolean {
  return !partyVon(reise).some((eintrag) => eintrag.clientRef === clientRef)
}
