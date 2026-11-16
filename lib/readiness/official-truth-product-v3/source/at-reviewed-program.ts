// Austria source catalog and the existing V3 admission gate. A valid draft is
// not method approval, and this module does not open a second import path.
import 'server-only'
import { sha256Hex } from '@/lib/readiness/digest'
import { schema2Kanonisch } from '@/lib/readiness/regulierungs-anwendbarkeit'
import { quellenRegistryErstellen, type QuellenRegistry } from '@/lib/readiness/source-registry'
import type { ContentIdentityGraph, ContentItemDescriptor, RepresentationDescriptor } from '@/lib/readiness/official-truth-content-identity'
import { createV3ContextIdentity, readV3GlobalRuleContext, readV3MethodRevisionDraft,
  type V3GlobalRuleContext } from '../contract'
import { readMa1MethodBinding } from '../method/contract'
import { HRS1_LIMITS, readHrs1Binding } from '../result/contract'
import { AT_BERN_CANONICAL_URL, AT_BERN_URL, AT_FETCHED_AT_UTC, AT_SHORT_STAY_URL, AT_VISA_MATRIX_EDITION,
  AT_VISA_MATRIX_SHA256, AT_VISA_MATRIX_URL } from './at-bmi-ordinary-rules'

const method = Object.freeze({ methodId: 'jetnity-destination-primary-at-visa', revision: 1 })
const contextInput: V3GlobalRuleContext = {
  scope: { destinationCountryCode: 'AT', transitCountryCode: null,
    citizenship: { mode: 'required', countryCodes: ['CH'] },
    credentialOption: { mode: 'option', documentType: 'passport', issuingCountryCode: 'CH', relatedCitizenshipCountryCode: 'CH' },
    residence: { mode: 'not_applicable' }, requirementType: 'visa', validity: { mode: 'not_applicable' } },
  route: 'direct_entry', conditions: { status: 'unconditional' },
}
const contextRead = readV3GlobalRuleContext(contextInput)
const contextIdentity = createV3ContextIdentity(contextInput)
if (!contextRead.ok || !contextIdentity.ok) throw Error('at_context_invalid')

const sources = [
  { sourceId: 'at-bmi', sourceClass: 'official_authority' as const,
    publisherName: 'Bundesministerium für Inneres', authorityName: 'Bundesministerium für Inneres', domains: ['www.bmi.gv.at'] },
  { sourceId: 'at-bmeia-bern', sourceClass: 'official_authority' as const,
    publisherName: 'Österreichische Botschaft Bern', authorityName: 'Bundesministerium für europäische und internationale Angelegenheiten',
    domains: ['www.bmeia.gv.at'] },
]
const authority = quellenRegistryErstellen(sources)
if (!authority.ok) throw Error('at_authority_catalog_invalid')

const bindings = Object.freeze({
  visa: Object.freeze({ sourceId: 'at-bmi', contentItemId: 'bmi-visa-matrix', contentItemVersion: 1,
    representationId: 'bmi-visa-matrix-html-de', representationVersion: 1,
    identityProfileId: 'at-bmi-visa-matrix-html-de', identityProfileVersion: 1 }),
  shortStay: Object.freeze({ sourceId: 'at-bmi', contentItemId: 'bmi-short-stay', contentItemVersion: 1,
    representationId: 'bmi-short-stay-html-de', representationVersion: 1,
    identityProfileId: 'at-bmi-short-stay-html-de', identityProfileVersion: 1 }),
  bern: Object.freeze({ sourceId: 'at-bmeia-bern', contentItemId: 'bmeia-bern-application', contentItemVersion: 1,
    representationId: 'bmeia-bern-application-html-de', representationVersion: 1,
    identityProfileId: 'at-bmeia-bern-application-html-de', identityProfileVersion: 1 }),
})
const documents = Object.freeze({
  visa: Object.freeze({ url: AT_VISA_MATRIX_URL, nativeId: 'bmi-visa-matrix', publisherId: 'bundesministerium-fuer-inneres', authorityId: 'bundesministerium-fuer-inneres' }),
  shortStay: Object.freeze({ url: AT_SHORT_STAY_URL, nativeId: 'bmi-short-stay', publisherId: 'bundesministerium-fuer-inneres', authorityId: 'bundesministerium-fuer-inneres' }),
  bern: Object.freeze({ url: AT_BERN_URL, nativeId: 'bmeia-bern-application', publisherId: 'oesterreichische-botschaft-bern', authorityId: 'bmeia' }),
})
const roles = ['visa', 'shortStay', 'bern'] as const
const items: readonly ContentItemDescriptor[] = Object.freeze(roles.map(role => Object.freeze({
  sourceId: bindings[role].sourceId, contentItemId: bindings[role].contentItemId, contentItemVersion: 1, current: true,
  externalIdNamespace: 'at-official-document', externalContentId: documents[role].nativeId,
  expectedPublisherIds: Object.freeze([documents[role].publisherId]),
  expectedAuthorityIds: Object.freeze([documents[role].authorityId]),
})))
const representations: readonly RepresentationDescriptor[] = Object.freeze(roles.map(role => Object.freeze({
  ...bindings[role], current: true, requestUrls: Object.freeze([documents[role].url]),
  expectedFinalUrl: role === 'bern' ? AT_BERN_CANONICAL_URL : documents[role].url,
  expectedMediaType: 'text/html', expectedLocale: 'de', expectedSchema: 'html',
})))
const graph: ContentIdentityGraph = Object.freeze({
  authorityRegistry: authority.registry, items, representations,
  profiles: Object.freeze(roles.map(role => Object.freeze({
    identityProfileId: bindings[role].identityProfileId, identityProfileVersion: 1, current: true,
  }))),
})
export const AT_BMI_REVIEWED_REGISTRY: QuellenRegistry = Object.freeze({ ...authority.registry, contentIdentity: graph })

const draftInput = {
  schema: 3 as const, method, predecessor: null, status: 'NOT_APPROVED' as const, createdAt: '2026-11-16T19:45:39.000Z',
  primaryPolicy: 'one_clear_qualified_destination_primary' as const, counterCheckPolicy: 'when_available' as const,
  conflictPolicy: 'positive_method_valid_resolution' as const,
  operatingProposal: { primaryMaxAgeSeconds: 86400, checkIntervalSeconds: 3600, optionalAttemptLimit: 1,
    optionalTimeBudgetMilliseconds: 10000, attemptPlanRevision: 1 },
}
const draftRead = readV3MethodRevisionDraft(draftInput)
if (!draftRead.ok) throw Error('at_method_draft_invalid')
export const AT_METHOD_DRAFT = Object.freeze(draftRead.value)
const packageText = schema2Kanonisch({
  schema: 1, kind: 'jetnity_reviewed_at_ordinary_passport_method', method, draft: AT_METHOD_DRAFT,
  edition: { visaMatrix: AT_VISA_MATRIX_EDITION, fetchedAtUtc: AT_FETCHED_AT_UTC, visaMatrixSha256: AT_VISA_MATRIX_SHA256 },
  scope: 'Ordinary passports, direct tourist short stay to Austria, visa and identity-card cells only. Not approved.',
})
const methodBinding = readMa1MethodBinding(AT_METHOD_DRAFT, new TextEncoder().encode(packageText), sha256Hex(packageText))
if (!methodBinding.ok) throw Error('at_method_binding_invalid')
export const AT_METHOD_BINDING = methodBinding.value

/** The shared HRS reader still admits only Germany/Switzerland. Austria stops here. */
export function atHrsAdmissionRefusal(): Readonly<{ admitted: false; reason: 'hrs_binding_locked_to_de_ch'; originalByteLimit: number }> {
  const refused = readHrs1Binding({
    ...methodBinding.value, schema: 1, qualificationScope: 'global_context',
    context: contextRead.value, contextKey: contextIdentity.value.contextKey, factKind: 'requirement_effect',
    dataMode: 'official_projection', legalTimeZone: 'Europe/Vienna',
    activeFrom: '2026-11-16T19:45:39.000Z', activeUntilExclusive: '2027-11-17T00:00:00.000Z',
    sourceMaxAgeMilliseconds: 86400000, projectionMaxAgeMilliseconds: 3600000,
    monitorIntervalMilliseconds: 3600000, monitorLeaseMilliseconds: 30000, attemptLimit: 4,
    sources: [],
  }, AT_BMI_REVIEWED_REGISTRY)
  if (refused) throw Error('at_hrs_binding_unexpectedly_admitted')
  return Object.freeze({ admitted: false, reason: 'hrs_binding_locked_to_de_ch', originalByteLimit: HRS1_LIMITS.originalBytes })
}
