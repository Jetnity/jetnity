import type { AtBindResult, AtBoundSource } from './bind'
import { AT_OFFICIAL_PUBLICATIONS } from './publications'

export const AT_IMPORT_DISPOSITION = 'RESEARCH_ONLY' as const
export const AT_CUSTOMER_STATEMENT = 'derzeit nicht verfügbar' as const

export type AtImportBlockReason =
  | 'source_unbound'
  | 'version_observation_ambiguous'
  | 'tl_evaluation_required'
  | 'method_approval_required'
  | 'external_shape'
  | 'shared_v3_method_not_attached'

export type AtImportCandidate = Readonly<{
  lane: 'at-official-source-reader'
  issue: 1223
  disposition: typeof AT_IMPORT_DISPOSITION
  customerStatement: typeof AT_CUSTOMER_STATEMENT
  legalClassification: 'not_performed'
  acceptedFactCount: 0
  positiveStatementCount: 0
  importable: false
  v3MethodInvoked: false
  visitorReadback: false
  sources: readonly AtBindResult[]
}>

export type AtImportAdmission = Readonly<{
  status: 'not_importable'
  reason: AtImportBlockReason
  technicalEligibility: 'bytes_bound_external_refs_present' | null
  acceptedFactCount: 0
  positiveStatementCount: 0
  importable: false
  disposition: typeof AT_IMPORT_DISPOSITION
  customerStatement: typeof AT_CUSTOMER_STATEMENT
}>

const TL_REF = /^TL-AT-[0-9]{4}-[0-9]{2}-[0-9]{2}-[a-z0-9-]{8,64}$/
const METHOD_REF = /^V3-METHOD-[A-Z0-9-]{12,80}$/

function closed(reason: AtImportBlockReason, technicalEligibility: AtImportAdmission['technicalEligibility'] = null): AtImportAdmission {
  return Object.freeze({
    status: 'not_importable',
    reason,
    technicalEligibility,
    acceptedFactCount: 0,
    positiveStatementCount: 0,
    importable: false,
    disposition: AT_IMPORT_DISPOSITION,
    customerStatement: AT_CUSTOMER_STATEMENT,
  })
}

function plainRecord(value: unknown, fields: readonly string[]): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Object.getPrototypeOf(value) !== Object.prototype) return null
  const keys = Object.keys(value)
  if (keys.length !== fields.length || fields.some(field => !keys.includes(field))) return null
  const record: Record<string, unknown> = {}
  for (const field of fields) record[field] = (value as Record<string, unknown>)[field]
  return record
}

/** Packages mechanical reads. Every customer-facing statement stays unavailable.
 * No accepted fact is created here. */
export function buildAtImportCandidate(sources: readonly AtBindResult[]): AtImportCandidate {
  const ordered = AT_OFFICIAL_PUBLICATIONS.map(publication =>
    sources.find(source => source.publicationId === publication.id) ?? null)
  const complete = ordered.every((source): source is AtBindResult => source !== null) && sources.length === AT_OFFICIAL_PUBLICATIONS.length
    ? ordered
    : sources
  return Object.freeze({
    lane: 'at-official-source-reader',
    issue: 1223,
    disposition: AT_IMPORT_DISPOSITION,
    customerStatement: AT_CUSTOMER_STATEMENT,
    legalClassification: 'not_performed',
    acceptedFactCount: 0,
    positiveStatementCount: 0,
    importable: false,
    v3MethodInvoked: false,
    visitorReadback: false,
    sources: Object.freeze([...complete]),
  })
}

function boundSources(candidate: AtImportCandidate): readonly AtBoundSource[] | null {
  if (candidate.sources.length !== AT_OFFICIAL_PUBLICATIONS.length) return null
  const bound: AtBoundSource[] = []
  for (const [index, publication] of AT_OFFICIAL_PUBLICATIONS.entries()) {
    const source = candidate.sources[index]
    if (!source || source.status !== 'bound' || source.publicationId !== publication.id) return null
    bound.push(source)
  }
  return bound
}

/** Fail-closed gate in front of the existing V3 method path.
 * This lane never mints a Technical-Lead evaluation or a method approval,
 * and it does not call Method, S1, M04, I1, HRS, BG1 or the visitor readback. */
export function admitAtImportCandidate(candidate: AtImportCandidate, external?: unknown): AtImportAdmission {
  if (candidate.acceptedFactCount !== 0 || candidate.positiveStatementCount !== 0 || candidate.importable !== false
    || candidate.disposition !== AT_IMPORT_DISPOSITION || candidate.v3MethodInvoked !== false
    || candidate.visitorReadback !== false) {
    return closed('external_shape')
  }
  const bound = boundSources(candidate)
  if (!bound) return closed('source_unbound')
  if (bound.some(source => source.versionObservation.status === 'ambiguous' || source.versionObservation.approvedVersion !== null)) {
    return closed('version_observation_ambiguous')
  }
  if (external == null) return closed('tl_evaluation_required')
  const record = plainRecord(external, ['tlEvaluationRef', 'methodApprovalRef'])
  if (!record) return closed('external_shape')
  if (typeof record.tlEvaluationRef !== 'string' || !TL_REF.test(record.tlEvaluationRef)) return closed('tl_evaluation_required')
  if (typeof record.methodApprovalRef !== 'string' || !METHOD_REF.test(record.methodApprovalRef)) return closed('method_approval_required')
  return closed('shared_v3_method_not_attached', 'bytes_bound_external_refs_present')
}
