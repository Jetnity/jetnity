// Root-selected finite CH→DE method data. This exports no approval, SQL
// credential, configurable source profile, caller registration or trusted receipt.
import 'server-only'
import { sha256Hex } from '@/lib/readiness/digest'
import { immutable } from '@/lib/readiness/official-truth-autonomous-provenance-artifact'
import { schema2Kanonisch } from '@/lib/readiness/regulierungs-anwendbarkeit'
import { quellenRegistryErstellen, type QuellenRegistry } from '@/lib/readiness/source-registry'
import type { ContentIdentityBinding, ContentIdentityGraph, ContentItemDescriptor,
  RepresentationDescriptor } from '@/lib/readiness/official-truth-content-identity'
import { createV3ContextIdentity, readV3GlobalRuleContext, readV3MethodRevisionDraft,
  type V3GlobalRuleContext, type V3MethodRevisionDraft, type V3SourceObservationRecord } from '../contract'
import { readMa1MethodBinding } from '../method/contract'
import { readHrs1Binding, hrs1Same, type Hrs1Binding, type Hrs1SourceBinding } from '../result/contract'
import { AA_BERN_REVIEWED_DOCUMENTS, AA_CH_DE_REVIEWED_IDENTITY_PROFILE, BERN_CH_DE_REVIEWED_IDENTITY_PROFILE,
  aaBernReviewedDocumentIdentity, interpretAaBernReviewedArticle } from './aa-bern-ch-de-current-article'
import type { AaChDeQualificationProgram, AaChDeSourceRole } from './aa-ch-de-definition'

const method = Object.freeze({ methodId: 'jetnity-destination-primary-ch-de-visa', revision: 1 })
const contextInput: V3GlobalRuleContext = {
  scope: { destinationCountryCode: 'DE', transitCountryCode: null,
    citizenship: { mode: 'required', countryCodes: ['CH'] },
    credentialOption: { mode: 'option', documentType: 'passport', issuingCountryCode: 'CH', relatedCitizenshipCountryCode: 'CH' },
    residence: { mode: 'not_applicable' }, requirementType: 'visa', validity: { mode: 'not_applicable' } },
  route: 'direct_entry', conditions: { status: 'unconditional' },
}
const contextRead = readV3GlobalRuleContext(contextInput), contextIdentity = createV3ContextIdentity(contextInput)
if (!contextRead.ok || !contextIdentity.ok) throw Error('reviewed_ch_de_context_invalid')
const context = immutable(contextRead.value), contextKey = contextIdentity.value.contextKey

const sources = [
  { sourceId: 'de-aa', sourceClass: 'official_authority' as const,
    publisherName: 'Auswärtiges Amt', authorityName: 'Auswärtiges Amt', domains: ['www.auswaertiges-amt.de'] },
  { sourceId: 'de-aa-bern', sourceClass: 'official_authority' as const,
    publisherName: 'Deutsche Botschaft Bern', authorityName: 'Auswärtiges Amt – Deutsche Botschaft Bern', domains: ['bern.diplo.de'] },
]
const authority = quellenRegistryErstellen(sources)
if (!authority.ok) throw Error('reviewed_ch_de_authority_catalog_invalid')
const sourceByRole = Object.freeze({
  primary: Object.freeze({ sourceId: 'de-aa', contentItemId: 'aa-207820', contentItemVersion: 1,
    representationId: 'aa-207820-html-de', representationVersion: 1,
    identityProfileId: AA_BERN_REVIEWED_DOCUMENTS.primary.profileId, identityProfileVersion: 1 }),
  counter: Object.freeze({ sourceId: 'de-aa-bern', contentItemId: 'bern-2611474', contentItemVersion: 1,
    representationId: 'bern-2611474-html-de', representationVersion: 1,
    identityProfileId: AA_BERN_REVIEWED_DOCUMENTS.counter.profileId, identityProfileVersion: 1 }),
}) satisfies Readonly<Record<AaChDeSourceRole, ContentIdentityBinding>>
const items: readonly ContentItemDescriptor[] = immutable((['primary','counter'] as const).map(role => ({
  sourceId: sourceByRole[role].sourceId, contentItemId: sourceByRole[role].contentItemId, contentItemVersion: 1, current: true,
  externalIdNamespace: 'aa-content-id', externalContentId: AA_BERN_REVIEWED_DOCUMENTS[role].nativeId,
  expectedPublisherIds: [AA_BERN_REVIEWED_DOCUMENTS[role].publisherId],
  expectedAuthorityIds: [AA_BERN_REVIEWED_DOCUMENTS[role].authorityId],
})))
const representations: readonly RepresentationDescriptor[] = immutable((['primary','counter'] as const).map(role => ({
  ...sourceByRole[role], current: true, requestUrls: [AA_BERN_REVIEWED_DOCUMENTS[role].url],
  expectedFinalUrl: AA_BERN_REVIEWED_DOCUMENTS[role].url, expectedMediaType: 'text/html',
  expectedLocale: 'de', expectedSchema: 'article',
})))
/** This is a fixed compiled server catalog, not caller registration through the
 * graph validator's explicit test-profile parameter. Its two actual profiles
 * and descriptors are constant and reviewed together. Graph data itself still
 * supplies no HTTP origin, method approval or source-custody authority. */
const graph: ContentIdentityGraph = immutable({
  authorityRegistry: authority.registry, items, representations,
  profiles: [AA_CH_DE_REVIEWED_IDENTITY_PROFILE, BERN_CH_DE_REVIEWED_IDENTITY_PROFILE]
    .map(({ identityProfileId, identityProfileVersion, current }) => ({ identityProfileId, identityProfileVersion, current })),
})
const registry: QuellenRegistry = Object.freeze({ ...authority.registry, contentIdentity: graph })

export const AA_BERN_CH_DE_QUALIFICATION_POLICY = immutable({
  schema: 1, revision: 1, context, contextKey, legalTimeZone: 'Europe/Berlin',
  scope: 'Swiss national passports; direct entry to Germany; visa requirement alone',
  primary: 'Current complete AA article: Swiss row has no footnote marker; all nine notes were reviewed, including bilateral exceptions.',
  counter: 'Current complete Bern article: the Swiss section explicitly distinguishes visa-free entry from the separate third-country and residence rules.',
  inference: 'The destination authorities support the visa exemption for the selected Swiss-passport context without a tourism, residence-country or stay-duration condition on this visa fact.',
  excludes: ['individual admission guarantee','passport validity decision','residence permission','employment permission','90/180 entitlement','transit'],
  legalValidity: { status: 'specified', validFrom: null, validUntil: null },
  legalValidityMeaning: 'The current official statement specifies no legal start or end date; article publication dates are not legal commencement dates.',
  changeHandling: 'Every owned refresh rechecks identity and the complete reviewed main. A changed main is unclear; old evidence is never relabelled as a fresh original.',
  reviewedArticles: (['primary','counter'] as const).map(role => ({
    role, url: AA_BERN_REVIEWED_DOCUMENTS[role].url, nativeId: AA_BERN_REVIEWED_DOCUMENTS[role].nativeId,
    mainSha256: AA_BERN_REVIEWED_DOCUMENTS[role].reviewedMainSha256,
  })),
})
const executableDigest = 'a6e4eeac83e0b9ee03b35ebd3ccbab887097d2572abd318526faa2fa6358067e'
const sourceBindings: readonly Hrs1SourceBinding[] = immutable((['primary','counter'] as const).map(role => ({
  source: sourceByRole[role], canonicalUrl: AA_BERN_REVIEWED_DOCUMENTS[role].url, contentType: 'text/html' as const,
  executableDigest, qualificationDigest: sha256Hex(schema2Kanonisch({ policy: AA_BERN_CH_DE_QUALIFICATION_POLICY, role })), role,
})))

const draftInput: V3MethodRevisionDraft = {
  schema: 3, method, predecessor: null, status: 'NOT_APPROVED', createdAt: '2026-11-12T19:41:12.000Z',
  primaryPolicy: 'one_clear_qualified_destination_primary', counterCheckPolicy: 'when_available',
  conflictPolicy: 'positive_method_valid_resolution',
  operatingProposal: { primaryMaxAgeSeconds: 86400, checkIntervalSeconds: 3600, optionalAttemptLimit: 1,
    optionalTimeBudgetMilliseconds: 10000, attemptPlanRevision: 1 },
}
const draftRead = readV3MethodRevisionDraft(draftInput)
if (!draftRead.ok) throw Error('reviewed_ch_de_method_draft_invalid')
export const AA_BERN_CH_DE_METHOD_DRAFT = immutable(draftRead.value)
const operation = immutable({
  activeFrom: '2026-11-12T19:41:09.241Z', activeUntilExclusive: '2027-11-13T00:00:00.000Z',
  sourceMaxAgeMilliseconds: 86400000, projectionMaxAgeMilliseconds: 3600000,
  monitorIntervalMilliseconds: 3600000, monitorLeaseMilliseconds: 30000, attemptLimit: 4,
})
/** The operating window is a finite deployment/review boundary, not a claimed
 * legal validity period or an extension of the old dated tourism pilot. */
export const AA_BERN_CH_DE_METHOD_PACKAGE_TEXT = schema2Kanonisch({
  schema: 1, kind: 'jetnity_reviewed_ch_de_visa_method', method,
  draft: AA_BERN_CH_DE_METHOD_DRAFT, qualification: AA_BERN_CH_DE_QUALIFICATION_POLICY,
  registry: graph, sources: sourceBindings, operation,
  executable: { path: 'lib/readiness/official-truth-product-v3/source/aa-bern-ch-de-current-article.ts', sha256: executableDigest },
  sourceReview: { run: 43292509169, commit: '03702a4d9e8a3100be44a28f6fc7536bdb3fb91f',
    scope: 'Two complete actually joined public originals; review only, no accepted evidence or method approval' },
})
const methodBinding = readMa1MethodBinding(AA_BERN_CH_DE_METHOD_DRAFT,
  new TextEncoder().encode(AA_BERN_CH_DE_METHOD_PACKAGE_TEXT), sha256Hex(AA_BERN_CH_DE_METHOD_PACKAGE_TEXT))
if (!methodBinding.ok) throw Error('reviewed_ch_de_method_binding_invalid')
const bindingInput: Hrs1Binding = {
  ...methodBinding.value, schema: 1, qualificationScope: 'global_context',
  context, contextKey, factKind: 'requirement_effect', dataMode: 'official_projection',
  legalTimeZone: 'Europe/Berlin', ...operation, sources: sourceBindings,
}
const binding = readHrs1Binding(bindingInput, registry)
if (!binding) throw Error('reviewed_ch_de_result_binding_invalid')

function compare(primary: V3SourceObservationRecord, counter: V3SourceObservationRecord) {
  try {
    if (primary.contextKey!==contextKey||counter.contextKey!==contextKey
      ||!hrs1Same(primary.context,context)||!hrs1Same(counter.context,context)
      ||!hrs1Same(primary.evidence.source,sourceByRole.primary)||!hrs1Same(counter.evidence.source,sourceByRole.counter)
      ||!hrs1Same(primary.evidence.legalValidity,counter.evidence.legalValidity)
      ||primary.fact.schema!==1||counter.fact.schema!==1
      ||primary.fact.fact.kind!=='requirement_effect'||counter.fact.fact.kind!=='requirement_effect') return 'not_comparable' as const
    if(hrs1Same(primary.fact,counter.fact)) return 'agrees' as const
    if(primary.fact.fact.effect!==counter.fact.fact.effect
      &&['required','not_required'].includes(primary.fact.fact.effect)
      &&['required','not_required'].includes(counter.fact.fact.effect)) return 'conflicts' as const
    return 'not_comparable' as const
  } catch {return 'not_comparable' as const}
}
export const AA_BERN_CH_DE_REVIEWED_PROGRAM: AaChDeQualificationProgram = Object.freeze({
  revision: 1, binding, context, contextKey, method, registry, legalTimeZone: 'Europe/Berlin',
  source: sourceByRole.primary, sourceBinding: sourceBindings[0]!,
  documentIdentity: (bodyText: string) => aaBernReviewedDocumentIdentity('primary',bodyText),
  interpret: (bodyText: string) => interpretAaBernReviewedArticle('primary',bodyText),
  counter: Object.freeze({ source: sourceByRole.counter, sourceBinding: sourceBindings[1]!,
    documentIdentity: (bodyText: string) => aaBernReviewedDocumentIdentity('counter',bodyText),
    interpret: (bodyText: string) => interpretAaBernReviewedArticle('counter',bodyText) }),
  counterInventory: Object.freeze({ revision: 1, eligibleRepresentations: Object.freeze([sourceByRole.counter] as const) }),
  compare,
})
