// lib/readiness/engine.ts
//
// Provider-neutrale Travel-Requirements-Engine.
// Ohne Provider niemals required / not_required / conditional.
// Mehrere Credential-Optionen werden getrennt bewertet.
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
  optionEligibilityLesen,
  optionMandateLesen,
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
  type RequirementsCredentialInput,
  type RequirementsProvider,
  type RequirementsProviderZeile,
  type RequirementsTravellerInput,
} from '@/lib/readiness/provider'
import { readinessReisekontext } from '@/lib/readiness/kontext'
import { citizenshipCodesAus, credentialOptionsAus, documentCitizenshipCode } from '@/lib/readiness/traveller-kontext'
import type { Trip } from '@/types/trips'

const KERN_TYPEN = OFFICIAL_REQUIREMENT_TYPES

export function officialFingerprint(anfrage: {
  travellerClientRef: string | null
  credentialOptionRef?: string | null
  citizenshipCountryCodes?: readonly string[]
  nationalityCountryCode?: string | null
  residenceCountryCode: string | null
  documents?: readonly {
    documentType?: string | null
    issuingCountryCode?: string | null
    expiresOn?: string | null
    relatedCitizenshipCountryCode?: string | null
  }[]
  documentType?: string | null
  documentIssuingCountryCode?: string | null
  documentExpiresOn?: string | null
  originCountryCode?: string | null
  destinationCountryCode: string | null
  transitCountryCodes: readonly string[]
  startDate: string | null
  endDate: string | null
  requirementType: string
}): string {
  const citizenships = [
    ...new Set(
      (anfrage.citizenshipCountryCodes?.length
        ? anfrage.citizenshipCountryCodes
        : [anfrage.nationalityCountryCode ?? '']
      )
        .map((code) => landescodeLesen(code) ?? '')
        .filter(Boolean),
    ),
  ].sort()
  const documents = (
    anfrage.documents?.length
      ? anfrage.documents
      : [
          {
            documentType: anfrage.documentType ?? '',
            issuingCountryCode: anfrage.documentIssuingCountryCode ?? '',
            expiresOn: anfrage.documentExpiresOn ?? '',
          },
        ]
  )
    .map((document) =>
      [
        document.documentType ?? '',
        document.issuingCountryCode ?? '',
        document.expiresOn ?? '',
        landescodeLesen(document.relatedCitizenshipCountryCode ?? null) ?? '',
      ].join(':'),
    )
    .sort()
  return [
    'off-v2',
    `t=${anfrage.travellerClientRef ?? ''}`,
    `opt=${anfrage.credentialOptionRef ?? ''}`,
    `cit=${citizenships.join(',')}`,
    `res=${anfrage.residenceCountryCode ?? ''}`,
    `docs=${documents.join(',')}`,
    `orig=${anfrage.originCountryCode ?? ''}`,
    `dest=${anfrage.destinationCountryCode ?? ''}`,
    `tr=${[...anfrage.transitCountryCodes].sort().join(',')}`,
    `start=${anfrage.startDate ?? ''}`,
    `end=${anfrage.endDate ?? ''}`,
    `type=${anfrage.requirementType}`,
  ].join('|')
}

function travellerNormalisieren(roh: RequirementsTravellerInput | Record<string, unknown>): RequirementsTravellerInput {
  const eintrag = roh as RequirementsTravellerInput & {
    nationalityCountryCode?: string | null
    documentType?: string | null
    documentIssuingCountryCode?: string | null
    documentExpiresOn?: string | null
  }
  const citizenships = eintrag.citizenshipCountryCodes?.length
    ? eintrag.citizenshipCountryCodes
    : [landescodeLesen(eintrag.nationalityCountryCode ?? null)].filter((code): code is string => Boolean(code))
  const documents = eintrag.documents ?? []
  const options = eintrag.credentialOptions?.length
    ? eintrag.credentialOptions
    : [
        {
          optionRef: `${eintrag.clientRef}:${documents[0]?.clientRef ?? (eintrag.documentType ? `document:${eintrag.documentType}` : 'none')}`,
          documentClientRef: documents[0]?.clientRef ?? null,
          documentType: (documents[0]?.documentType ?? eintrag.documentType ?? null) as RequirementsCredentialInput['documentType'],
          issuingCountryCode: documents[0]?.issuingCountryCode ?? eintrag.documentIssuingCountryCode ?? null,
          expiresOn: documents[0]?.expiresOn ?? eintrag.documentExpiresOn ?? null,
          relatedCitizenshipCountryCode: documents[0]?.citizenshipCountryCode ?? null,
        },
      ]
  return {
    clientRef: eintrag.clientRef,
    residenceCountryCode: eintrag.residenceCountryCode ?? null,
    citizenshipCountryCodes: citizenships,
    documents,
    credentialOptions: options,
  }
}

function optionenVon(traveller: RequirementsTravellerInput): RequirementsCredentialInput[] {
  return travellerNormalisieren(traveller).credentialOptions
}

function travellerAusSlot(slot: ReturnType<typeof travellerSlots>[number]): RequirementsTravellerInput {
  const traveller = slot.traveller
  const options = traveller ? credentialOptionsAus(traveller) : []
  return {
    clientRef: slot.clientRef,
    residenceCountryCode: landescodeLesen(traveller?.residenceCountryCode ?? null),
    citizenshipCountryCodes: traveller ? citizenshipCodesAus(traveller) : [],
    documents: (traveller?.documents ?? []).map((document) => ({
      clientRef: document.clientRef,
      documentType: document.documentType,
      issuingCountryCode: document.issuingCountryCode,
      expiresOn: document.expiresOn,
      citizenshipCountryCode: traveller ? documentCitizenshipCode(traveller, document) : null,
    })),
    credentialOptions: options.map((option) => ({
      optionRef: option.optionRef,
      documentClientRef: option.document?.clientRef ?? null,
      documentType: option.document?.documentType ?? null,
      issuingCountryCode: option.document?.issuingCountryCode ?? null,
      expiresOn: option.document?.expiresOn ?? null,
      relatedCitizenshipCountryCode: option.document?.citizenshipCountryCode ?? null,
    })),
  }
}

function leererTraveller(): RequirementsTravellerInput {
  return {
    clientRef: 'traveller:1',
    residenceCountryCode: null,
    citizenshipCountryCodes: [],
    documents: [],
    credentialOptions: [
      {
        optionRef: 'traveller:1:none',
        documentClientRef: null,
        documentType: null,
        issuingCountryCode: null,
        expiresOn: null,
        relatedCitizenshipCountryCode: null,
      },
    ],
  }
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
    travellers: slots.map(travellerAusSlot),
  }
}

function fehlendeFakten(
  anfrage: RequirementsAnfrage,
  traveller: RequirementsTravellerInput,
  option: RequirementsCredentialInput,
  requirementType?: OfficialEvaluation['requirementType'],
): MissingFact[] {
  const fakten: MissingFact[] = []
  if (traveller.citizenshipCountryCodes.length === 0) fakten.push('nationality')
  if (anfrage.destinationCountryCodes.length === 0) fakten.push('destination_country')
  if (!anfrage.startDate && !anfrage.endDate) fakten.push('travel_dates')
  if (requirementType === 'transit' && anfrage.transitCountryCodes.length === 0) {
    fakten.push('transit_itinerary')
  }
  void option
  return [...new Set(fakten)]
}

function fingerprintFuer(
  anfrage: RequirementsAnfrage,
  traveller: RequirementsTravellerInput,
  option: RequirementsCredentialInput,
  destinationCountryCode: string | null,
  requirementType: string,
  transitCountryCode: string | null,
): string {
  return officialFingerprint({
    travellerClientRef: traveller.clientRef,
    credentialOptionRef: option.optionRef,
    citizenshipCountryCodes: traveller.citizenshipCountryCodes,
    residenceCountryCode: traveller.residenceCountryCode,
    documents: option.documentType
      ? [
          {
            documentType: option.documentType,
            issuingCountryCode: option.issuingCountryCode,
            expiresOn: option.expiresOn,
            relatedCitizenshipCountryCode: option.relatedCitizenshipCountryCode,
          },
        ]
      : [],
    originCountryCode: anfrage.originCountryCode,
    destinationCountryCode,
    transitCountryCodes: transitCountryCode ? [transitCountryCode] : anfrage.transitCountryCodes,
    startDate: anfrage.startDate,
    endDate: anfrage.endDate,
    requirementType,
  })
}

function leerFuer(
  anfrage: RequirementsAnfrage,
  traveller: RequirementsTravellerInput,
  option: RequirementsCredentialInput,
  destinationCountryCode: string | null,
  requirementType: OfficialEvaluation['requirementType'],
  extraMissing: MissingFact[] = [],
  transitCountryCode: string | null = null,
  freshness: OfficialFreshness = 'provider_unavailable',
): OfficialEvaluation {
  const missing = [...new Set([...fehlendeFakten(anfrage, traveller, option, requirementType), ...extraMissing])]
  return officialLeer({
    travellerClientRef: traveller.clientRef,
    credentialOptionRef: option.optionRef,
    destinationCountryCode,
    transitCountryCode,
    requirementType,
    status: missing.length > 0 ? 'insufficient_context' : freshness === 'provider_unavailable' ? 'unavailable' : 'unknown',
    freshness,
    missingFacts: missing,
    contextFingerprint: fingerprintFuer(anfrage, traveller, option, destinationCountryCode, requirementType, transitCountryCode),
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

function optionPasst(zeile: RequirementsProviderZeile, traveller: RequirementsTravellerInput, option: RequirementsCredentialInput): boolean {
  if (zeile.travellerClientRef !== traveller.clientRef) return false
  if (zeile.credentialOptionRef) return zeile.credentialOptionRef === option.optionRef
  return optionenVon(traveller).length === 1
}

function zeileUebernehmen(
  anfrage: RequirementsAnfrage,
  traveller: RequirementsTravellerInput,
  option: RequirementsCredentialInput,
  zeile: RequirementsProviderZeile,
  providerNameRoh: string,
): OfficialEvaluation | null {
  if (!optionPasst(zeile, traveller, option)) return null
  if (!OFFICIAL_REQUIREMENT_TYPES.includes(zeile.requirementType)) return null
  if (!['required', 'not_required', 'conditional', 'unknown', 'insufficient_context'].includes(zeile.result)) {
    return null
  }

  const destination = landescodeLesen(zeile.destinationCountryCode)
  const transit = landescodeLesen(zeile.transitCountryCode ?? null)
  const fingerprint = fingerprintFuer(anfrage, traveller, option, destination, zeile.requirementType, transit)
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
      credentialOptionRef: option.optionRef,
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
    if (fakt === 'document_type') return !option.documentType || option.documentType === 'unknown'
    if (fakt === 'document_issuing_country') return !option.issuingCountryCode
    if (fakt === 'document_expiry') return !option.expiresOn
    if (fakt === 'nationality') return traveller.citizenshipCountryCodes.length === 0
    if (fakt === 'destination_country') return anfrage.destinationCountryCodes.length === 0
    if (fakt === 'travel_dates') return !anfrage.startDate && !anfrage.endDate
    return true
  })
  const missing = [...new Set([...fehlendeFakten(anfrage, traveller, option, zeile.requirementType), ...providerMissing])]
  if (missing.length > 0 || zeile.result === 'insufficient_context') {
    return officialLeer({
      travellerClientRef: traveller.clientRef,
      credentialOptionRef: option.optionRef,
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
    credentialOptionRef: option.optionRef,
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
    optionEligibility: uebernehmbar ? optionEligibilityLesen(zeile.optionEligibility) : undefined,
    optionMandate: uebernehmbar ? optionMandateLesen(zeile.optionMandate) : undefined,
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
    const key = `${evaluation.travellerClientRef}|${evaluation.credentialOptionRef}|${evaluation.destinationCountryCode}|${evaluation.requirementType}|${evaluation.transitCountryCode}`
    if (gesehen.has(key)) return
    gesehen.add(key)
    evaluations.push(evaluation)
  }

  const destinations =
    anfrage.destinationCountryCodes.length > 0 ? anfrage.destinationCountryCodes : [null]
  const travellers =
    anfrage.travellers.length > 0 ? anfrage.travellers.map(travellerNormalisieren) : [leererTraveller()]
  const angefragteTransits = [
    ...new Set(
      anfrage.transitCountryCodes
        .map((code) => landescodeLesen(code))
        .filter((code): code is string => Boolean(code)),
    ),
  ]
  const hatProvider = Boolean(providerName)

  for (const traveller of travellers) {
    for (const option of optionenVon(traveller)) {
      for (const destination of destinations) {
        for (const typ of KERN_TYPEN) {
          const zeilen = hatProvider
            ? providerZeilen.filter((zeile) => {
                if (!optionPasst(zeile, traveller, option)) return false
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
                  const evaluation = zeileUebernehmen(anfrage, traveller, option, zeile, providerName as string)
                  if (evaluation) {
                    merken(evaluation)
                    uebernommen += 1
                  }
                }
              }
              if (uebernommen === 0) {
                merken(leerFuer(anfrage, traveller, option, destination, typ, [], transit, leerFreshness))
              }
            }
            continue
          }

          if (zeilen.length > 0 && hatProvider) {
            let uebernommen = 0
            for (const zeile of zeilen) {
              const evaluation = zeileUebernehmen(anfrage, traveller, option, zeile, providerName as string)
              if (evaluation) {
                merken(evaluation)
                uebernommen += 1
              }
            }
            if (uebernommen === 0) merken(leerFuer(anfrage, traveller, option, destination, typ, [], null, leerFreshness))
          } else {
            merken(leerFuer(anfrage, traveller, option, destination, typ, [], null, leerFreshness))
          }
        }
      }
    }
  }

  return evaluations
}

export async function requirementsAuswerten(
  anfrage: Omit<RequirementsAnfrage, 'travellers'> & {
    travellers: Array<RequirementsTravellerInput | Record<string, unknown>>
  },
  provider: RequirementsProvider | null = requirementsProviderAus(),
  roh: unknown = null,
): Promise<OfficialEvaluation[]> {
  const kanonisch: RequirementsAnfrage = {
    ...anfrage,
    travellers:
      anfrage.travellers.length > 0 ? anfrage.travellers.map(travellerNormalisieren) : [leererTraveller()],
  }
  if (!provider) return requirementsAusZeilen(kanonisch, [], null, roh)
  try {
    const zeilen = await provider.evaluate(kanonisch)
    return requirementsAusZeilen(kanonisch, zeilen, provider.name, roh)
  } catch (fehler) {
    return requirementsAusZeilen(kanonisch, [], provider.name, roh, providerFehlerFreshness(fehler))
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
