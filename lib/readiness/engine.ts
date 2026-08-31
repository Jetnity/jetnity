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
  officialAktionAusMetadaten,
  officialEvidenceVertrauenswuerdig,
  officialFrische,
  officialLeer,
  officialVisaWiderspruchDegradieren,
  optionEligibilityLesen,
  optionMandateLesen,
  providerNameLesen,
  visaModeLesen,
  quelleUrlLesen,
  regelReferenzLesen,
  type MissingFact,
  type OfficialEvaluation,
  type OfficialFreshness,
} from '@/lib/readiness/official'
import { partyVon, travellerSlots } from '@/lib/readiness/party'
import { requirementsFreshnessAusFehlerArt, requirementsProviderAbrufen } from '@/lib/readiness/abruf'
import {
  requirementsProviderAus,
  type RequirementsAnfrage,
  type RequirementsCredentialInput,
  type RequirementsDocumentInput,
  type RequirementsProvider,
  type RequirementsProviderZeile,
  type RequirementsTravellerInput,
} from '@/lib/readiness/provider'

export type RequirementsAuswertenOptionen = {
  signal?: AbortSignal
  timeoutMs?: number
  now?: string | number
  maxAgeMs?: number
}

function bewertungsZeitMs(optionen?: RequirementsAuswertenOptionen): number {
  if (typeof optionen?.now === 'number' && Number.isFinite(optionen.now)) return optionen.now
  if (typeof optionen?.now === 'string') {
    const ms = Date.parse(optionen.now)
    if (Number.isFinite(ms)) return ms
  }
  return Date.now()
}
import { entscheidungenGleich } from '@/lib/readiness/entscheidung'
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

function hatLegacyDokument(eintrag: {
  documentType?: string | null
  documentIssuingCountryCode?: string | null
  documentExpiresOn?: string | null
}): boolean {
  return Boolean(eintrag.documentType || eintrag.documentIssuingCountryCode || eintrag.documentExpiresOn)
}

function dokumentOptionRef(
  travellerClientRef: string,
  document: {
    clientRef?: string | null
    documentType?: string | null
    issuingCountryCode?: string | null
    expiresOn?: string | null
  },
  index: number,
  gesehen: Set<string>,
): string {
  const documentClientRef = typeof document.clientRef === 'string' ? document.clientRef.trim() : ''
  const basis = documentClientRef
    ? `${travellerClientRef}:${documentClientRef}`
    : `${travellerClientRef}:document:${document.documentType ?? 'unknown'}:${document.issuingCountryCode ?? 'xx'}:${document.expiresOn ?? 'none'}:${index}`
  if (!gesehen.has(basis)) {
    gesehen.add(basis)
    return basis
  }
  let lauf = 2
  let kandidat = `${basis}#${lauf}`
  while (gesehen.has(kandidat)) {
    lauf += 1
    kandidat = `${basis}#${lauf}`
  }
  gesehen.add(kandidat)
  return kandidat
}

function optionAusDokument(
  travellerClientRef: string,
  document: RequirementsDocumentInput | Record<string, unknown>,
  index: number,
  gesehen: Set<string>,
): RequirementsCredentialInput {
  const clientRef = typeof document.clientRef === 'string' && document.clientRef.trim() ? document.clientRef.trim() : null
  return {
    optionRef: dokumentOptionRef(travellerClientRef, document, index, gesehen),
    documentClientRef: clientRef,
    documentType: (document.documentType ?? null) as RequirementsCredentialInput['documentType'],
    issuingCountryCode: typeof document.issuingCountryCode === 'string' ? document.issuingCountryCode : null,
    expiresOn: typeof document.expiresOn === 'string' ? document.expiresOn : null,
    relatedCitizenshipCountryCode:
      typeof document.citizenshipCountryCode === 'string' ? document.citizenshipCountryCode : null,
  }
}

function optionsAusDokumenten(
  travellerClientRef: string,
  documents: Array<RequirementsDocumentInput | Record<string, unknown>>,
): RequirementsCredentialInput[] {
  const gesehen = new Set<string>()
  return documents.map((document, index) => optionAusDokument(travellerClientRef, document, index, gesehen))
}

function noneOption(travellerClientRef: string): RequirementsCredentialInput {
  return {
    optionRef: `${travellerClientRef}:none`,
    documentClientRef: null,
    documentType: null,
    issuingCountryCode: null,
    expiresOn: null,
    relatedCitizenshipCountryCode: null,
  }
}

function legacyOption(eintrag: {
  clientRef: string
  documentType?: string | null
  documentIssuingCountryCode?: string | null
  documentExpiresOn?: string | null
}): RequirementsCredentialInput {
  return {
    optionRef: `${eintrag.clientRef}:${eintrag.documentType ? `document:${eintrag.documentType}` : 'document:unknown'}`,
    documentClientRef: null,
    documentType: (eintrag.documentType ?? null) as RequirementsCredentialInput['documentType'],
    issuingCountryCode: eintrag.documentIssuingCountryCode ?? null,
    expiresOn: eintrag.documentExpiresOn ?? null,
    relatedCitizenshipCountryCode: null,
  }
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
  const documents = Array.isArray(eintrag.documents) ? eintrag.documents : []
  const gelieferteOptionen = Array.isArray(eintrag.credentialOptions) ? eintrag.credentialOptions : []
  const options = gelieferteOptionen.length
    ? gelieferteOptionen
    : documents.length > 0
      ? optionsAusDokumenten(eintrag.clientRef, documents)
      : hatLegacyDokument(eintrag)
        ? [legacyOption(eintrag)]
        : [noneOption(eintrag.clientRef)]
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
  optionen?: RequirementsAuswertenOptionen,
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
  const nowMs = bewertungsZeitMs(optionen)
  const freshness = officialFrische({
    storedFingerprint: fingerprint,
    currentFingerprint: fingerprint,
    checkedAt,
    validFrom: validFromFeld.wert,
    validUntil: validUntilFeld.wert,
    now: new Date(nowMs).toISOString(),
    maxAgeMs: optionen?.maxAgeMs,
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
    nowMs,
  })
  const uebernehmbar =
    vertrauenswuerdig &&
    freshness === 'current' &&
    (zeile.result === 'required' || zeile.result === 'not_required' || zeile.result === 'conditional')

  return officialVisaWiderspruchDegradieren({
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
    visaMode: visaModeLesen(zeile.requirementType, uebernehmbar ? zeile.visaMode : null),
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
    action: uebernehmbar
      ? officialAktionAusMetadaten({
          actionUrl: zeile.actionUrl,
          actionPurpose: zeile.actionPurpose,
          sourceUrl,
        })
      : null,
  })
}

export function requirementsAusZeilen(
  anfrage: RequirementsAnfrage,
  providerZeilen: readonly RequirementsProviderZeile[],
  providerName: string | null,
  roh: unknown = null,
  leerFreshness: OfficialFreshness = 'provider_unavailable',
  optionen?: RequirementsAuswertenOptionen,
): OfficialEvaluation[] {
  if (roh && typeof roh === 'object' && roh !== null) {
    const behauptung = roh as { officialResult?: unknown; llmResult?: unknown; result?: unknown }
    void behauptung.officialResult
    void behauptung.llmResult
    void behauptung.result
  }

  const evaluations: OfficialEvaluation[] = []
  const gesehen = new Map<string, OfficialEvaluation>()
  const konflikte = new Set<string>()
  const evaluationSchluessel = (evaluation: OfficialEvaluation) =>
    `${evaluation.travellerClientRef}|${evaluation.credentialOptionRef}|${evaluation.destinationCountryCode}|${evaluation.requirementType}|${evaluation.transitCountryCode}`
  const konfliktAus = (evaluation: OfficialEvaluation): OfficialEvaluation => ({
    ...officialLeer({
      travellerClientRef: evaluation.travellerClientRef,
      credentialOptionRef: evaluation.credentialOptionRef,
      destinationCountryCode: evaluation.destinationCountryCode,
      transitCountryCode: evaluation.transitCountryCode,
      requirementType: evaluation.requirementType,
      status: 'unknown',
      freshness: 'recheck_needed',
      missingFacts: evaluation.missingFacts,
      contextFingerprint: evaluation.evidence.contextFingerprint,
    }),
    optionEligibility: 'unknown',
    optionMandate: 'unknown',
  })
  const merken = (evaluation: OfficialEvaluation) => {
    const key = evaluationSchluessel(evaluation)
    if (konflikte.has(key)) return
    const vorher = gesehen.get(key)
    if (!vorher) {
      gesehen.set(key, evaluation)
      return
    }
    if (!entscheidungenGleich(vorher, evaluation)) {
      gesehen.set(key, konfliktAus(vorher))
      konflikte.add(key)
    }
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
                  const evaluation = zeileUebernehmen(
                    anfrage,
                    traveller,
                    option,
                    zeile,
                    providerName as string,
                    optionen,
                  )
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
              const evaluation = zeileUebernehmen(
                anfrage,
                traveller,
                option,
                zeile,
                providerName as string,
                optionen,
              )
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

  for (const evaluation of gesehen.values()) evaluations.push(evaluation)
  return evaluations
}

export async function requirementsAuswerten(
  anfrage: Omit<RequirementsAnfrage, 'travellers'> & {
    travellers: Array<RequirementsTravellerInput | Record<string, unknown>>
  },
  provider: RequirementsProvider | null = requirementsProviderAus(),
  roh: unknown = null,
  optionen: RequirementsAuswertenOptionen = {},
): Promise<OfficialEvaluation[]> {
  const kanonisch: RequirementsAnfrage = {
    ...anfrage,
    travellers:
      anfrage.travellers.length > 0 ? anfrage.travellers.map(travellerNormalisieren) : [leererTraveller()],
  }
  if (!provider) return requirementsAusZeilen(kanonisch, [], null, roh, 'provider_unavailable', optionen)
  const gelesen = await requirementsProviderAbrufen(provider, kanonisch, optionen)
  if (!gelesen.ok) {
    return requirementsAusZeilen(
      kanonisch,
      [],
      provider.name,
      roh,
      requirementsFreshnessAusFehlerArt(gelesen.art),
      optionen,
    )
  }
  return requirementsAusZeilen(kanonisch, gelesen.zeilen, provider.name, roh, 'provider_unavailable', optionen)
}

export function requirementsLokalFuerReise(reise: Trip): OfficialEvaluation[] {
  return requirementsAusZeilen(requirementsAnfrageAusReise(reise), [], null)
}

export async function requirementsFuerReise(
  reise: Trip,
  provider: RequirementsProvider | null = requirementsProviderAus(),
  optionen: RequirementsAuswertenOptionen = {},
): Promise<OfficialEvaluation[]> {
  return requirementsAuswerten(requirementsAnfrageAusReise(reise), provider, null, optionen)
}

export function travellerGeloeschtPruefen(reise: Trip, clientRef: string): boolean {
  return !partyVon(reise).some((eintrag) => eintrag.clientRef === clientRef)
}
