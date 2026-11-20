// DEV-ONLY, read-only orchestration seam. The trusted reader gets the exact
// registered source pair from the private Supabase Dev evidence store.
// No OpenAI/xAI calls, no database credentials, no SQL, no persistence.
// This is NOT Source Identity custody or MA1/BG1 method authorization.
// Model/source input can never become an accepted rule through this seam.

import {
  officialTruthQuellenTextVergleich,
  type OfficialSourceResearchSnapshot,
  type SourceTextComparison,
} from './official-truth-source-text-diff-v1'

type Request = Readonly<{
  sourceFamily: 'SIX' | 'FOUR'
  destinationCode: string
  sourceKey: string
}>

type Present = Readonly<{
  status: 'stored_pair'
  sourceFamily: 'SIX' | 'FOUR'
  destinationCode: string
  sourceKey: string
  original: Readonly<{
    batchId: number
    rawSha: string
    bodyBytes: number
    html: string
  }>
  changed: Readonly<{
    batchId: number
    rawSha: string
    bodyBytes: number
    html: string
  }>
  latest: Readonly<{
    batchId: number
    rawSha: string | null
    sourceState: string
  }>
  qualified: false
  publishable: false
}>

export type SourceDiffReadResult = Present | Readonly<{ status: 'not_found' }> | Readonly<{ status: 'unavailable' }>
export type TrustedSourceDiffReader = (request: Request) => Promise<unknown>

export type DevSourceDiffResult =
  | Readonly<{
    status: 'blocked'
    reason: 'invalid_request' | 'reader_failed' | 'missing_evidence' | 'invalid_evidence'
      | 'evidence_mismatch' | 'unsupported_source_state'
  }>
  | Readonly<{
    status: 'research_only'
    sourceFamily: 'SIX' | 'FOUR'
    destinationCode: string
    sourceKey: string
    disposition: Extract<SourceTextComparison, { status: 'research_comparison_only' }>['disposition']
    currency: 'HISTORICAL_SAMPLE_NOT_CURRENT' | 'LATEST_SOURCE_SAMPLE_RESEARCH_ONLY'
    sampledBatchId: number
    latestBatchId: number
    oldRawSha: string
    newRawSha: string
    oldVisibleTextSha: string
    newVisibleTextSha: string
    oldLinkAndFormSha: string
    newLinkAndFormSha: string
    changedOrAddedFragments: number
    changedOrRemovedFragments: number
    legalRuleApproved: false
    publicationAllowed: false
    acceptedFacts: 0
    modelCalls: 0
    databaseWrites: 0
  }>

const blocked = (reason: Extract<DevSourceDiffResult, { status: 'blocked' }>['reason']) =>
  Object.freeze({ status: 'blocked', reason } as const)

const VALID_SOURCE_STATES = new Set([
  'changed_unqualified_snapshot',
  'same_unqualified_snapshot',
  'unqualified_snapshot',
  'unavailable',
  'rejected_body',
  'changed_requires_review',
  'unchanged_unqualified',
  'http_unavailable',
  'invalid_source_body',
])

function shape(value: unknown, fields: readonly string[]): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  try {
    if (Object.getPrototypeOf(value) !== Object.prototype) return null
    const d = Object.getOwnPropertyDescriptors(value)
    const keys = Reflect.ownKeys(d)
    if (keys.length !== fields.length || keys.some(x => typeof x !== 'string' || !fields.includes(x))) return null
    const out: Record<string, unknown> = {}
    for (const key of fields) {
      const descriptor = d[key]
      if (!descriptor?.enumerable || !('value' in descriptor)) return null
      out[key] = descriptor.value
    }
    return out
  } catch { return null }
}
const int = (x: unknown): x is number => Number.isSafeInteger(x) && typeof x === 'number' && x>0
const hash = (x: unknown): x is string => typeof x==='string' && /^[a-f0-9]{64}$/.test(x)
const allowed = (request: unknown): request is Request => {
  const s=shape(request,['sourceFamily','destinationCode','sourceKey'])
  return !!s && (s.sourceFamily==='SIX' || s.sourceFamily==='FOUR')
    && typeof s.destinationCode==='string' && /^[A-Z]{2}$/.test(s.destinationCode)
    && typeof s.sourceKey==='string' && /^[a-z][a-z0-9-]{1,63}$/.test(s.sourceKey)
    && (s.sourceFamily!=='FOUR' || s.sourceKey==='primary')
}
function part(value: unknown): Present['original'] | null {
  const s=shape(value,['batchId','rawSha','bodyBytes','html'])
  if(!s || !int(s.batchId) || !hash(s.rawSha) ||
     !int(s.bodyBytes) || s.bodyBytes>262144 || typeof s.html!=='string')return null
  return {batchId:s.batchId,rawSha:s.rawSha,bodyBytes:s.bodyBytes,html:s.html}
}
function present(value: unknown): Present | null {
  const p=shape(value,[
    'status','sourceFamily','destinationCode','sourceKey','original','changed',
    'latest','qualified','publishable',
  ])
  if(!p || p.status!=='stored_pair' || !allowed({
    sourceFamily:p.sourceFamily,destinationCode:p.destinationCode,sourceKey:p.sourceKey,
  }) || p.qualified!==false || p.publishable!==false)return null
  const original=part(p.original),changed=part(p.changed)
  const latest=shape(p.latest,['batchId','rawSha','sourceState'])
  if(!original||!changed||!latest||!int(latest.batchId) ||
     !(latest.rawSha===null || hash(latest.rawSha)) ||
     typeof latest.sourceState!=='string' || !VALID_SOURCE_STATES.has(latest.sourceState) ||
     latest.batchId<changed.batchId)return null
  return {
    status:'stored_pair',sourceFamily:p.sourceFamily as Present['sourceFamily'],
    destinationCode:p.destinationCode as string,sourceKey:p.sourceKey as string,
    original,changed,latest: {
      batchId:latest.batchId as number,
      rawSha:latest.rawSha as string|null,
      sourceState:latest.sourceState,
    }, qualified:false,publishable:false,
  }
}
/**
 * Every result stays research-only. Important: a daily sample can be older
 * than the most recent government source observation. Never pretend a
 * historical comparison says anything conclusive about current legal rules.
 */
export async function reviewDevSourceDiff(
  request: unknown,
  reader: TrustedSourceDiffReader,
): Promise<DevSourceDiffResult> {
  if(!allowed(request) || typeof reader!=='function')return blocked('invalid_request')
  let raw: unknown
  try { raw=await reader(request) } catch { return blocked('reader_failed') }
  const metadata=shape(raw,['status'])
  if(metadata?.status==='not_found')return blocked('missing_evidence')
  if(metadata?.status==='unavailable')return blocked('reader_failed')
  const pair=present(raw)
  if(!pair)return blocked('invalid_evidence')
  if(pair.sourceFamily!==request.sourceFamily||
     pair.destinationCode!==request.destinationCode||
     pair.sourceKey!==request.sourceKey)return blocked('evidence_mismatch')

  const original:OfficialSourceResearchSnapshot={
    sourceFamily:pair.sourceFamily,destinationCode:pair.destinationCode,sourceKey:pair.sourceKey,
    batchId:pair.original.batchId,rawSha:pair.original.rawSha,
    bodyBytes:pair.original.bodyBytes,html:pair.original.html,
  }
  const changed:OfficialSourceResearchSnapshot={
    ...original,batchId:pair.changed.batchId,rawSha:pair.changed.rawSha,
    bodyBytes:pair.changed.bodyBytes,html:pair.changed.html,
  }
  const result=officialTruthQuellenTextVergleich(original,changed)
  if(result.status!=='research_comparison_only')return blocked('invalid_evidence')
  if(!VALID_SOURCE_STATES.has(pair.latest.sourceState))return blocked('unsupported_source_state')
  const current=pair.latest.batchId===pair.changed.batchId &&
    pair.latest.rawSha===pair.changed.rawSha &&
    (pair.latest.sourceState==='changed_unqualified_snapshot' ||
     pair.latest.sourceState==='changed_requires_review')
  return Object.freeze({
    status:'research_only',sourceFamily:pair.sourceFamily,destinationCode:pair.destinationCode,
    sourceKey:pair.sourceKey,disposition:result.disposition,
    currency:current?'LATEST_SOURCE_SAMPLE_RESEARCH_ONLY':'HISTORICAL_SAMPLE_NOT_CURRENT',
    sampledBatchId:pair.changed.batchId,latestBatchId:pair.latest.batchId,
    oldRawSha:result.oldRawSha,newRawSha:result.newRawSha,
    oldVisibleTextSha:result.oldVisibleTextSha,newVisibleTextSha:result.newVisibleTextSha,
    oldLinkAndFormSha:result.oldLinkAndFormSha,newLinkAndFormSha:result.newLinkAndFormSha,
    changedOrAddedFragments:result.changedOrAddedFragments,
    changedOrRemovedFragments:result.changedOrRemovedFragments,
    legalRuleApproved:false,publicationAllowed:false,acceptedFacts:0,
    modelCalls:0,databaseWrites:0,
  })
}
