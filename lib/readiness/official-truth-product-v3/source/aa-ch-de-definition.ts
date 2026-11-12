import 'server-only'

import type { ContentIdentityBinding } from '@/lib/readiness/official-truth-content-identity'
import type { QuellenRegistry } from '@/lib/readiness/source-registry'
import type { V3GlobalRuleContext, V3LegalValidity, V3MethodRef, V3RuleFact, V3SourceObservationRecord } from '../contract'
import type { Hrs1Binding, Hrs1SourceBinding } from '../result/contract'

/** Fixed physical publications, not registration, qualification or approval. */
export const AA_CH_DE_PUBLICATION = Object.freeze({
  url: 'https://www.auswaertiges-amt.de/de/service/visa-und-aufenthalt/staatenliste-zur-visumpflicht-207820',
  hostname: 'www.auswaertiges-amt.de',
  path: '/de/service/visa-und-aufenthalt/staatenliste-zur-visumpflicht-207820',
  mediaType: 'text/html' as const,
  maximumBytes: 131_072,
  maximumMilliseconds: 10_000,
  maximumConcurrentReads: 2,
})
export const BERN_CH_DE_PUBLICATION = Object.freeze({
  url: 'https://bern.diplo.de/ch-de/service/visumundeinreise/2611474-2611474',
  hostname: 'bern.diplo.de',
  path: '/ch-de/service/visumundeinreise/2611474-2611474',
  mediaType: 'text/html' as const,
  maximumBytes: 131_072,
  maximumMilliseconds: 10_000,
  maximumConcurrentReads: 2,
})
export type AaChDeSourceRole = 'primary' | 'counter'
export type AaChDeSemanticResult = Readonly<{
  status: 'clear'; fact: V3RuleFact; legalValidity: V3LegalValidity;
}> | Readonly<{
  status: 'unclear'; reason: 'ambiguous_statement' | 'unqualified_destination_authority' | 'invalid_or_unknown_validity';
}>
export type AaChDeComparison = 'agrees' | 'compatible' | 'conflicts' | 'not_comparable'
export type AaChDePublicationProgram = Readonly<{
  source: ContentIdentityBinding
  sourceBinding: Hrs1SourceBinding
  documentIdentity(bodyText: string): boolean
  interpret(bodyText: string): AaChDeSemanticResult
}>

/** One code-owned method: the AA primary and the independent Bern publication.
 * No request, environment value or research DTO selects either reader/program.
 * Each parser covers its complete current article and applicable qualifications. */
export interface AaChDeQualificationProgram extends AaChDePublicationProgram {
  readonly revision: number
  readonly binding: Hrs1Binding
  readonly context: V3GlobalRuleContext
  readonly contextKey: string
  readonly method: V3MethodRef
  readonly registry: QuellenRegistry
  readonly legalTimeZone: string
  readonly counter: AaChDePublicationProgram
  readonly counterInventory: Readonly<{
    revision: number
    eligibleRepresentations: readonly [ContentIdentityBinding]
  }>
  compare(primary: V3SourceObservationRecord, counter: V3SourceObservationRecord): AaChDeComparison
}

/** Root selects the separately reviewed current legal/identity program. The
 * consumed #1192 one-shot observation and old date-window pilot are no authority.
 * No setter, configurable implementation or test-profile injection is exported. */
export function selectedAaChDeQualification(): AaChDeQualificationProgram | null {
  return null
}
