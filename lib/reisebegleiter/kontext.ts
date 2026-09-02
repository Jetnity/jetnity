// lib/reisebegleiter/kontext.ts
//
// Deterministische, privacy-minimierte Truth-Context-Projektion für den
// späteren Phase-1 In-Trip-Assistant. Keine neue Official-/Provider-/
// Commercial-Wahrheit, kein Modellcall, keine Persistenz.
//
// OFFICIAL ≠ PROVIDER ≠ RECOMMENDATION ≠ COMMUNITY OPINION ≠ GENERATED SUGGESTION.

import { landescodeLesen } from '@/lib/readiness/domain'
import type {
  MissingFact,
  OfficialClass,
  OfficialEvaluation,
  OfficialFreshness,
  OfficialResult,
  OfficialStatus,
  OfficialVisaMode,
} from '@/lib/readiness/official'
import type { OfficialTemporalRule } from '@/lib/readiness/temporal'
import {
  credentialOptionsAus,
  documentCitizenshipCode,
  documentsSortieren,
} from '@/lib/readiness/traveller-kontext'
import type { RouteFacts, RouteQuelle } from '@/lib/route/domain'
import type { SafetyEvaluation } from '@/lib/safety/domain'
import type { SeasonalEvaluation } from '@/lib/seasonal/domain'
import {
  destinationIstOfficialZiel,
  destinationSafetyBetrifftStage,
  destinationSeasonalBetrifftStage,
} from '@/lib/trips/destination-essentials'
import type {
  OfficialRequirementType,
  TravellerDocumentType,
  Trip,
  TripStage,
  TripTraveller,
} from '@/types/trips'

export const ASSISTANT_TRUTH_CONTEXT_VERSION = 'assistant-truth-context-v1' as const

export const ASSISTANT_TRUTH_CLASSES = [
  'official',
  'provider',
  'recommendation',
  'community_opinion',
  'generated_suggestion',
] as const
export type AssistantTruthClass = (typeof ASSISTANT_TRUTH_CLASSES)[number]

export type AssistantOfficialScope = 'destination' | 'transit'

export type AssistantStageContext = {
  stageId: string
  position: number
  name: string | null
  countryCode: string | null
  placeId: string | null
  arrivalDate: string | null
  departureDate: string | null
  latitude: number | null
  longitude: number | null
}

export type AssistantCitizenshipContext = {
  clientRef: string
  countryCode: string
}

export type AssistantDocumentContext = {
  clientRef: string
  documentType: TravellerDocumentType
  issuingCountryCode: string | null
  citizenshipClientRef: string | null
  citizenshipCountryCode: string | null
  expiresOn: string | null
}

export type AssistantCredentialOptionContext = {
  optionRef: string
  documentClientRef: string | null
  citizenshipCountryCodes: string[]
  issuingCountryCode: string | null
  expiresOn: string | null
}

export type AssistantTravellerContext = {
  travellerClientRef: string
  label: string | null
  residenceCountryCode: string | null
  citizenships: AssistantCitizenshipContext[]
  documents: AssistantDocumentContext[]
  credentialOptions: AssistantCredentialOptionContext[]
}

export type AssistantRouteContext = {
  vorhanden: boolean
  quelle: RouteQuelle | null
  destinationCountryCodes: string[]
  transitCountryCodes: string[]
}

export type AssistantOfficialContext = {
  truthClass: 'official'
  scope: AssistantOfficialScope
  travellerClientRef: string | null
  credentialOptionRef: string | null
  destinationCountryCode: string | null
  transitCountryCode: string | null
  boundStageIds: string[]
  requirementType: OfficialRequirementType
  result: OfficialResult
  status: OfficialStatus
  freshness: OfficialFreshness
  officialClass: OfficialClass
  visaMode: OfficialVisaMode | null
  optionEligibility: 'allowed' | 'not_allowed' | 'unknown' | null
  optionMandate: 'mandatory' | 'not_mandatory' | 'unknown' | null
  missingFacts: MissingFact[]
  checkedAt: string | null
  validFrom: string | null
  validUntil: string | null
  authority: string | null
  ruleReference: string | null
  temporalRule: OfficialTemporalRule | null
}

export type AssistantSafetyContext = {
  domain: 'safety'
  factId: string
  factKey: string
  category: SafetyEvaluation['category']
  evidenceStatus: SafetyEvaluation['evidenceStatus']
  freshness: SafetyEvaluation['freshness']
  relevance: SafetyEvaluation['relevance']
  presentationClass: SafetyEvaluation['presentationClass']
  authorityClass: SafetyEvaluation['authorityClass']
  boundStageIds: string[]
  conflict: boolean
  seasonalRejected: boolean
}

export type AssistantSeasonalContext = {
  domain: 'seasonal'
  factId: string
  factKey: string
  category: SeasonalEvaluation['category']
  evidenceStatus: SeasonalEvaluation['evidenceStatus']
  freshness: SeasonalEvaluation['freshness']
  relevance: SeasonalEvaluation['relevance']
  presentationClass: SeasonalEvaluation['presentationClass']
  authorityClass: SeasonalEvaluation['authorityClass']
  boundStageIds: string[]
  conflict: boolean
  acuteRejected: boolean
}

export type AssistantTruthContext = {
  version: typeof ASSISTANT_TRUTH_CONTEXT_VERSION
  trip: {
    startDate: string | null
    endDate: string | null
  }
  stages: AssistantStageContext[]
  travellers: AssistantTravellerContext[]
  route: AssistantRouteContext
  official: AssistantOfficialContext[]
  safety: AssistantSafetyContext[]
  seasonal: AssistantSeasonalContext[]
  generatedSuggestion: []
  unfilledTruthClasses: Array<Exclude<AssistantTruthClass, 'official'>>
}

export type AssistantTruthContextQuelle = {
  reise: Pick<Trip, 'stages' | 'party' | 'startDate' | 'endDate'>
  officialEvaluations?: readonly OfficialEvaluation[]
  safetyEvaluations?: readonly SafetyEvaluation[]
  seasonalEvaluations?: readonly SeasonalEvaluation[]
  routeFacts?: Pick<RouteFacts, 'quelle' | 'destinationCountryCodes' | 'transitCountryCodes'> | null
}

function textOderNull(wert: string | null | undefined): string | null {
  if (typeof wert !== 'string') return null
  const text = wert.trim()
  return text.length > 0 ? text : null
}

function datumLesen(wert: string | null | undefined): string | null {
  const text = textOderNull(wert)
  return text && /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null
}

function koordinateLesen(wert: unknown): number | null {
  return typeof wert === 'number' && Number.isFinite(wert) ? wert : null
}

function refOderNull(wert: string | null | undefined): string | null {
  const text = textOderNull(wert)
  return text ? text.slice(0, 64) : null
}

function etappenSortieren(links: TripStage, rechts: TripStage): number {
  const position = links.position - rechts.position
  if (position !== 0) return position
  return links.id.localeCompare(rechts.id)
}

function landescodesProjizieren(werte: readonly string[] | undefined): string[] {
  const gesehen = new Set<string>()
  for (const wert of werte ?? []) {
    const code = landescodeLesen(wert)
    if (code) gesehen.add(code)
  }
  return [...gesehen].sort((links, rechts) => links.localeCompare(rechts))
}

function citizenshipsProjizieren(traveller: TripTraveller): AssistantCitizenshipContext[] {
  return [...traveller.citizenships]
    .map((eintrag) => {
      const countryCode = landescodeLesen(eintrag.countryCode)
      const clientRef = refOderNull(eintrag.clientRef)
      if (!countryCode || !clientRef) return null
      return { clientRef, countryCode }
    })
    .filter((eintrag): eintrag is AssistantCitizenshipContext => eintrag != null)
    .sort((links, rechts) => links.countryCode.localeCompare(rechts.countryCode) || links.clientRef.localeCompare(rechts.clientRef))
}

function documentsProjizieren(traveller: TripTraveller): AssistantDocumentContext[] {
  return documentsSortieren(traveller.documents)
    .map((document) => {
      const clientRef = refOderNull(document.clientRef)
      if (!clientRef) return null
      return {
        clientRef,
        documentType: document.documentType,
        issuingCountryCode: landescodeLesen(document.issuingCountryCode),
        citizenshipClientRef: refOderNull(document.citizenshipClientRef),
        citizenshipCountryCode: documentCitizenshipCode(traveller, document),
        expiresOn: datumLesen(document.expiresOn),
      }
    })
    .filter((eintrag): eintrag is AssistantDocumentContext => eintrag != null)
}

function credentialOptionsProjizieren(traveller: TripTraveller): AssistantCredentialOptionContext[] {
  return credentialOptionsAus(traveller).map((option) => ({
    optionRef: option.optionRef,
    documentClientRef: option.document?.clientRef ?? null,
    citizenshipCountryCodes: [...option.citizenshipCountryCodes],
    issuingCountryCode: option.document?.issuingCountryCode ?? null,
    expiresOn: datumLesen(option.document?.expiresOn),
  }))
}

function reisendeProjizieren(party: readonly TripTraveller[] | undefined): AssistantTravellerContext[] {
  return [...(party ?? [])]
    .map((traveller) => {
      const travellerClientRef = refOderNull(traveller.clientRef)
      if (!travellerClientRef) return null
      const label = textOderNull(traveller.label)
      return {
        travellerClientRef,
        label: label && label !== travellerClientRef ? label.slice(0, 40) : null,
        residenceCountryCode: landescodeLesen(traveller.residenceCountryCode),
        citizenships: citizenshipsProjizieren(traveller),
        documents: documentsProjizieren(traveller),
        credentialOptions: credentialOptionsProjizieren(traveller),
      }
    })
    .filter((eintrag): eintrag is AssistantTravellerContext => eintrag != null)
    .sort((links, rechts) => links.travellerClientRef.localeCompare(rechts.travellerClientRef))
}

function etappenProjizieren(stages: readonly TripStage[]): AssistantStageContext[] {
  return [...stages].sort(etappenSortieren).map((stage) => ({
    stageId: stage.id,
    position: stage.position,
    name: textOderNull(stage.name),
    countryCode: landescodeLesen(stage.countryCode),
    placeId: textOderNull(stage.placeId),
    arrivalDate: datumLesen(stage.arrivalDate),
    departureDate: datumLesen(stage.departureDate),
    latitude: koordinateLesen(stage.latitude),
    longitude: koordinateLesen(stage.longitude),
  }))
}

function routeProjizieren(
  routeFacts: AssistantTruthContextQuelle['routeFacts'],
): AssistantRouteContext {
  if (!routeFacts) {
    return {
      vorhanden: false,
      quelle: null,
      destinationCountryCodes: [],
      transitCountryCodes: [],
    }
  }
  return {
    vorhanden: true,
    quelle: routeFacts.quelle,
    destinationCountryCodes: landescodesProjizieren(routeFacts.destinationCountryCodes),
    transitCountryCodes: landescodesProjizieren(routeFacts.transitCountryCodes),
  }
}

export function assistantOfficialIstTransit(evaluation: OfficialEvaluation): boolean {
  return evaluation.requirementType === 'transit' || evaluation.transitCountryCode != null
}

function officialAnEtappen(
  evaluation: OfficialEvaluation,
  stages: readonly AssistantStageContext[],
  scope: AssistantOfficialScope,
): string[] {
  if (scope !== 'destination') return []
  return stages
    .filter((stage) => destinationIstOfficialZiel(evaluation, stage.countryCode))
    .map((stage) => stage.stageId)
}

function officialProjizieren(
  evaluations: readonly OfficialEvaluation[] | undefined,
  stages: readonly AssistantStageContext[],
): AssistantOfficialContext[] {
  return (evaluations ?? [])
    .map((evaluation) => {
      const scope: AssistantOfficialScope = assistantOfficialIstTransit(evaluation) ? 'transit' : 'destination'
      const contextFingerprint = evaluation.evidence.contextFingerprint
      const projiziert: AssistantOfficialContext = {
        truthClass: 'official',
        scope,
        travellerClientRef: refOderNull(evaluation.travellerClientRef),
        credentialOptionRef: refOderNull(evaluation.credentialOptionRef),
        destinationCountryCode: landescodeLesen(evaluation.destinationCountryCode),
        transitCountryCode: landescodeLesen(evaluation.transitCountryCode),
        boundStageIds: officialAnEtappen(evaluation, stages, scope),
        requirementType: evaluation.requirementType,
        result: evaluation.result,
        status: evaluation.status,
        freshness: evaluation.freshness,
        officialClass: evaluation.officialClass,
        visaMode: evaluation.visaMode,
        optionEligibility: evaluation.optionEligibility ?? null,
        optionMandate: evaluation.optionMandate ?? null,
        missingFacts: [...evaluation.missingFacts],
        checkedAt: evaluation.evidence.checkedAt,
        validFrom: evaluation.evidence.validFrom,
        validUntil: evaluation.evidence.validUntil,
        authority: evaluation.evidence.authority,
        ruleReference: evaluation.evidence.ruleReference,
        temporalRule: evaluation.temporalRule,
      }
      return { projiziert, contextFingerprint }
    })
    .sort((links, rechts) =>
      links.projiziert.scope.localeCompare(rechts.projiziert.scope) ||
      (links.projiziert.destinationCountryCode ?? '').localeCompare(rechts.projiziert.destinationCountryCode ?? '') ||
      (links.projiziert.transitCountryCode ?? '').localeCompare(rechts.projiziert.transitCountryCode ?? '') ||
      (links.projiziert.travellerClientRef ?? '').localeCompare(rechts.projiziert.travellerClientRef ?? '') ||
      (links.projiziert.credentialOptionRef ?? '').localeCompare(rechts.projiziert.credentialOptionRef ?? '') ||
      links.projiziert.requirementType.localeCompare(rechts.projiziert.requirementType) ||
      links.contextFingerprint.localeCompare(rechts.contextFingerprint),
    )
    .map(({ projiziert }) => projiziert)
}

function safetyProjizieren(
  evaluations: readonly SafetyEvaluation[] | undefined,
  stages: readonly AssistantStageContext[],
): AssistantSafetyContext[] {
  const stageIds = new Set(stages.map((stage) => stage.stageId))
  return (evaluations ?? [])
    .map((evaluation) => ({
      domain: 'safety' as const,
      factId: evaluation.factId,
      factKey: evaluation.factKey,
      category: evaluation.category,
      evidenceStatus: evaluation.evidenceStatus,
      freshness: evaluation.freshness,
      relevance: evaluation.relevance,
      presentationClass: evaluation.presentationClass,
      authorityClass: evaluation.authorityClass,
      boundStageIds: [...stageIds]
        .filter((stageId) => destinationSafetyBetrifftStage(evaluation, stageId))
        .sort((links, rechts) => links.localeCompare(rechts)),
      conflict: evaluation.conflict,
      seasonalRejected: evaluation.seasonalRejected,
    }))
    .sort((links, rechts) => links.factId.localeCompare(rechts.factId))
}

function seasonalProjizieren(
  evaluations: readonly SeasonalEvaluation[] | undefined,
  stages: readonly AssistantStageContext[],
): AssistantSeasonalContext[] {
  const stageIds = new Set(stages.map((stage) => stage.stageId))
  return (evaluations ?? [])
    .map((evaluation) => ({
      domain: 'seasonal' as const,
      factId: evaluation.factId,
      factKey: evaluation.factKey,
      category: evaluation.category,
      evidenceStatus: evaluation.evidenceStatus,
      freshness: evaluation.freshness,
      relevance: evaluation.relevance,
      presentationClass: evaluation.presentationClass,
      authorityClass: evaluation.authorityClass,
      boundStageIds: [...stageIds]
        .filter((stageId) => destinationSeasonalBetrifftStage(evaluation, stageId))
        .sort((links, rechts) => links.localeCompare(rechts)),
      conflict: evaluation.conflict,
      acuteRejected: evaluation.acuteRejected,
    }))
    .sort((links, rechts) => links.factId.localeCompare(rechts.factId))
}

export function assistantTruthContextProjizieren(
  quelle: AssistantTruthContextQuelle,
): AssistantTruthContext {
  const stages = etappenProjizieren(quelle.reise.stages)
  return {
    version: ASSISTANT_TRUTH_CONTEXT_VERSION,
    trip: {
      startDate: datumLesen(quelle.reise.startDate),
      endDate: datumLesen(quelle.reise.endDate),
    },
    stages,
    travellers: reisendeProjizieren(quelle.reise.party),
    route: routeProjizieren(quelle.routeFacts),
    official: officialProjizieren(quelle.officialEvaluations, stages),
    safety: safetyProjizieren(quelle.safetyEvaluations, stages),
    seasonal: seasonalProjizieren(quelle.seasonalEvaluations, stages),
    generatedSuggestion: [],
    unfilledTruthClasses: ['provider', 'recommendation', 'community_opinion', 'generated_suggestion'],
  }
}
