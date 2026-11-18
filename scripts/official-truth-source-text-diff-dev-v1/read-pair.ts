// Explicitly Dev-only, read-only SQL over existing immutable source samples.
// Parameter values are strict country/source identifiers, never model text.
// Queries deliberately return the exact two HTML bodies only to the local,
// trusted worker process; the worker NEVER prints the bodies to the terminal.
import { createHash } from 'node:crypto'

export type SourceSelection = Readonly<{
  sourceFamily: 'SIX' | 'FOUR'
  destinationCode: string
  sourceKey: string
}>

const BRANCH = 'yfvbxvijcorffwxbxahl'
export const OFFICIAL_SOURCE_DIFF_DEV_REF = BRANCH

export function readSelection(value: unknown): SourceSelection | null {
  if (!value || typeof value !== 'object' || Array.isArray(value) ||
      Object.getPrototypeOf(value)!==Object.prototype) return null
  const x=value as Record<string,unknown>
  if(Object.keys(x).length!==3 || !Object.hasOwn(x,'sourceFamily') ||
     !Object.hasOwn(x,'destinationCode') || !Object.hasOwn(x,'sourceKey')) return null
  if(x.sourceFamily!=='SIX' && x.sourceFamily!=='FOUR') return null
  if(typeof x.destinationCode!=='string' || !/^[A-Z]{2}$/.test(x.destinationCode))return null
  if(typeof x.sourceKey!=='string' || !/^[a-z][a-z0-9-]{1,63}$/.test(x.sourceKey))return null
  if(x.sourceFamily==='FOUR' && x.sourceKey!=='primary')return null
  return {sourceFamily:x.sourceFamily,destinationCode:x.destinationCode,sourceKey:x.sourceKey}
}
const quote = (x: string): string => "'" + x.replaceAll("'","''") + "'"

/** One SELECT only, no dynamic identifiers or mutating statement. */
export function sourcePairReadSql(untrusted: unknown): string | null {
  const s=readSelection(untrusted)
  if(!s)return null
  const dest=quote(s.destinationCode),key=quote(s.sourceKey)
  const shared=`
    AND sample.evidence_class='UNQUALIFIED_RESEARCH_SNAPSHOT'
    AND NOT sample.primary_rule_qualified
    AND NOT sample.legal_fact_approved
    AND NOT sample.public_publish_allowed
    AND (SELECT count(*) FROM jetnity_global_research_private.cases_v1)=10300
    AND NOT EXISTS (SELECT 1 FROM jetnity_global_research_private.cases_v1
      WHERE publication_allowed OR legal_rule_qualified OR accepted_fact_count<>0)
    AND public.official_v3_guard_alarm_status_v1()->>'status'='current'
  `
  // One source, one latest captured daily sample, never an invented "current"
  // source: latest monitored receipt is read separately in the same snapshot.
  const sql=s.sourceFamily==='SIX'?
  `SELECT 'SIX'::text AS source_family,sample.destination_code,sample.source_key,
      base.batch_id AS old_batch,base.raw_sha AS old_sha,base.body_bytes AS old_bytes,
      encode(base.original_html,'base64') AS old_body_base64,
      sample.batch_id AS new_batch,sample.raw_sha AS new_sha,sample.body_bytes AS new_bytes,
      encode(sample.original_html,'base64') AS new_body_base64,
      latest.batch_id AS latest_batch,latest.raw_sha AS latest_sha,
      latest.result AS latest_state
    FROM jetnity_source_body_private.changed_originals_v1 sample
    JOIN jetnity_global_source_monitor_private.first_originals_v1 base
      ON base.dest=sample.destination_code AND base.source_key=sample.source_key
    JOIN jetnity_global_source_monitor_private.sources_v1 registered
      ON registered.dest=sample.destination_code AND registered.source_key=sample.source_key
    JOIN LATERAL (
      SELECT o.batch_id,o.raw_sha,o.result
      FROM jetnity_global_source_monitor_private.observations_v1 o
      WHERE o.dest=sample.destination_code AND o.source_key=sample.source_key
      ORDER BY o.batch_id DESC LIMIT 1
    ) latest ON true
    WHERE sample.source_family='SIX' AND sample.destination_code=${dest}
      AND sample.source_key=${key} AND base.batch_id<sample.batch_id
      AND registered.source_verification_state='RESEARCH_ONLY'
      AND NOT registered.legally_qualified AND NOT registered.publication_allowed
      ${shared}
    ORDER BY sample.batch_id DESC LIMIT 1`
  :
  `SELECT 'FOUR'::text AS source_family,sample.destination_code,sample.source_key,
      original_observation.batch_id AS old_batch,
      base.raw_sha256 AS old_sha,base.raw_bytes AS old_bytes,
      encode(base.original_html,'base64') AS old_body_base64,
      sample.batch_id AS new_batch,sample.raw_sha AS new_sha,sample.body_bytes AS new_bytes,
      encode(sample.original_html,'base64') AS new_body_base64,
      latest.batch_id AS latest_batch,latest.source_sha256 AS latest_sha,
      latest.status AS latest_state
    FROM jetnity_source_body_private.changed_originals_v1 sample
    JOIN jetnity_followup_source_monitor_private.source_originals_v1 base
      ON base.destination_code=sample.destination_code
    JOIN jetnity_followup_source_monitor_private.sources_v3 registered
      ON registered.destination_code=sample.destination_code
    JOIN LATERAL (
      SELECT o.batch_id
      FROM jetnity_followup_source_monitor_private.observations_v3 o
      WHERE o.destination_code=sample.destination_code
        AND o.status='unqualified_snapshot'
        AND o.source_sha256=base.raw_sha256
      ORDER BY o.batch_id ASC LIMIT 1
    ) original_observation ON true
    JOIN LATERAL (
      SELECT o.batch_id,o.source_sha256,o.status
      FROM jetnity_followup_source_monitor_private.observations_v3 o
      WHERE o.destination_code=sample.destination_code
      ORDER BY o.batch_id DESC LIMIT 1
    ) latest ON true
    WHERE sample.source_family='FOUR' AND sample.destination_code=${dest}
      AND sample.source_key='primary'
      AND registered.source_state='RESEARCH_ONLY'
      AND NOT registered.source_qualified AND registered.approved_facts=0
      AND base.research_only AND NOT base.source_qualified
      AND NOT base.publication_allowed AND base.positive_legal_facts=0
      AND original_observation.batch_id<sample.batch_id
      ${shared}
    ORDER BY sample.batch_id DESC LIMIT 1`
  return sql
}

function safeNumber(x:unknown):number|null {
  if(typeof x==='number' && Number.isSafeInteger(x) && x>0)return x
  if(typeof x==='string' && /^[1-9][0-9]{0,12}$/.test(x)){
    const value=Number(x);return Number.isSafeInteger(value)?value:null
  }
  return null
}
function readHtml(base64:unknown, expectedBytes:number):string|null {
  if(typeof base64!=='string'||base64.length>370000)return null
  const raw=base64.replaceAll('\n','')
  if(!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(raw))return null
  const binary=Buffer.from(raw,'base64')
  if(binary.length!==expectedBytes||binary.length>262144||binary.toString('base64')!==raw)return null
  const text=binary.toString('utf8')
  if(!Buffer.from(text,'utf8').equals(binary))return null
  return text
}

/** Non-authoritative pair, with no source URL or client-visible raw body. */
export function parseOnePrivateRow(
  input:unknown, selection:SourceSelection,
):unknown {
  if(!Array.isArray(input)||input.length!==1)return {status:'not_found'}
  const r=input[0]
  if(!r||typeof r!=='object'||Array.isArray(r)||Object.getPrototypeOf(r)!==Object.prototype)
    return {status:'unavailable'}
  const p=r as Record<string,unknown>
  const expected=[
    'source_family','destination_code','source_key','old_batch','old_sha','old_bytes',
    'old_body_base64','new_batch','new_sha','new_bytes','new_body_base64',
    'latest_batch','latest_sha','latest_state',
  ]
  if(Object.keys(p).length!==expected.length||expected.some(k=>!Object.hasOwn(p,k)))return {status:'unavailable'}
  if(p.source_family!==selection.sourceFamily||p.destination_code!==selection.destinationCode||
     p.source_key!==selection.sourceKey)return {status:'unavailable'}
  const oldBatch=safeNumber(p.old_batch),newBatch=safeNumber(p.new_batch),
        latestBatch=safeNumber(p.latest_batch),oldBytes=safeNumber(p.old_bytes),
        newBytes=safeNumber(p.new_bytes)
  if(oldBatch===null||newBatch===null||latestBatch===null||oldBytes===null||newBytes===null||
     !(oldBatch<newBatch && newBatch<=latestBatch))return {status:'unavailable'}
  const oldBody=readHtml(p.old_body_base64,oldBytes),newBody=readHtml(p.new_body_base64,newBytes)
  if(oldBody===null||newBody===null)return {status:'unavailable'}
  const verify=(body:string,sha:unknown):sha is string =>
    typeof sha==='string' && /^[a-f0-9]{64}$/.test(sha) &&
    createHash('sha256').update(body,'utf8').digest('hex')===sha
  if(!verify(oldBody,p.old_sha)||!verify(newBody,p.new_sha)||
     !(p.latest_sha===null||typeof p.latest_sha==='string')||
     typeof p.latest_state!=='string')return {status:'unavailable'}
  return {
    status:'stored_pair',sourceFamily:selection.sourceFamily,
    destinationCode:selection.destinationCode,sourceKey:selection.sourceKey,
    original:{batchId:oldBatch,rawSha:p.old_sha,bodyBytes:oldBytes,html:oldBody},
    changed:{batchId:newBatch,rawSha:p.new_sha,bodyBytes:newBytes,html:newBody},
    latest:{batchId:latestBatch,rawSha:p.latest_sha,sourceState:p.latest_state},
    qualified:false,publishable:false,
  }
}
