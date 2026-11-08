import { z } from 'zod'
import { OFFICIAL_REQUIREMENT_TYPES,type Trip } from '@/types/trips'
import { requirementsLokalFuerReise } from '../engine'
import { pilotContextFingerprint } from '../official-truth-ch-de-application-pilot-1/context'
import type { OfficialEvaluation } from '../official'
import type { AcceptedStoreTripResult } from './result'
import { acceptedStoreRuleReference } from './engine-reference'

const text=z.string().max(16_384),nullable=text.nullable()
const date=z.string().max(40).refine(value=>Number.isFinite(Date.parse(value)))
const evaluation=z.object({travellerClientRef:nullable,credentialOptionRef:nullable.optional(),destinationCountryCode:nullable,transitCountryCode:nullable,
  requirementType:z.enum(OFFICIAL_REQUIREMENT_TYPES),result:z.enum(['required','not_required','conditional','unknown']),
  status:z.enum(['unavailable','insufficient_context','unknown','current']),freshness:z.enum(['never_checked','current','recheck_needed','stale','provider_unavailable','source_temporarily_unavailable']),
  officialClass:z.enum(['requirement','recommendation','advisory','unknown']),visaMode:z.enum(['visa_exempt','visa_on_arrival','electronic_visa','visa_before_travel','unknown']).nullable(),
  optionEligibility:z.enum(['allowed','not_allowed','unknown']).nullable().optional(),optionMandate:z.enum(['mandatory','not_mandatory','unknown']).nullable().optional(),
  missingFacts:z.array(z.enum(['nationality','residence','document_type','document_issuing_country','document_expiry','destination_country','travel_dates','transit_itinerary','origin_country'])).max(9),
  evidence:z.object({provider:nullable,authority:nullable,sourceUrl:nullable,checkedAt:nullable,validFrom:nullable,validUntil:nullable,ruleReference:nullable,contextFingerprint:text}).strict(),
  action:z.object({kind:z.literal('open_official_action'),purpose:z.literal('information'),href:z.string().url().max(2048)}).strict().nullable(),
  temporalRule:z.null(),
}).strict()
const envelope=z.object({status:z.enum(['current','unavailable','unsupported_context','context_changed']),tripId:z.string().uuid(),revision:z.number().int().positive(),
  contextFingerprint:z.string().regex(/^[a-f0-9]{64}$/),receiptFingerprint:z.string().regex(/^ot-provenance-v1:[a-f0-9]{64}$/).nullable(),
  evidenceVersionId:z.string().regex(/^ev2_[a-f0-9]{32}$/).nullable(),sourceCheckedAt:date.nullable(),acceptedAt:date.nullable(),readAt:date.nullable(),expiresAt:date.nullable(),
  deadlineFromRequestStartMs:z.number().int().min(0).max(45_000),evaluations:z.array(evaluation).max(12_000),
}).strict()
const cell=(value:OfficialEvaluation)=>JSON.stringify([value.travellerClientRef,value.credentialOptionRef,value.destinationCountryCode,value.transitCountryCode,value.requirementType])

/** Transport/context validation only: never creates or improves a legal result.
 * Positive rows must already be the server's existing engine output. */
export function acceptedStoreClientResult(raw:unknown,trip:Trip):AcceptedStoreTripResult {
  const result=envelope.parse(raw)
  if(result.tripId!==trip.id||result.revision!==trip.revision||result.contextFingerprint!==pilotContextFingerprint(trip))throw Error('response_context_changed')
  const local=requirementsLokalFuerReise(trip),scopes=new Map(local.map(value=>[cell(value),value.evidence.contextFingerprint]))
  const rows=result.evaluations as OfficialEvaluation[]
  if(rows.length!==local.length||new Set(rows.map(cell)).size!==rows.length
    ||rows.some(value=>scopes.get(cell(value))!==value.evidence.contextFingerprint))throw Error('response_scope_changed')
  const positives=rows.filter(value=>value.result!=='unknown'),declaration=trip.regulatoryContext?.declaration
  if(result.status==='current') {
    if(!result.receiptFingerprint||!result.evidenceVersionId||!result.sourceCheckedAt||!result.acceptedAt||!result.readAt||!result.expiresAt||result.deadlineFromRequestStartMs<=0
      ||positives.length!==1||!declaration)throw Error('response_incomplete')
    const p=positives[0]!,source=Date.parse(result.sourceCheckedAt),accepted=Date.parse(result.acceptedAt),read=Date.parse(result.readAt),end=Date.parse(result.expiresAt)
    if(p.status!=='current'||p.freshness!=='current'||p.officialClass!=='requirement'||p.requirementType!=='visa'||p.destinationCountryCode!=='DE'||p.transitCountryCode!==null
      ||p.travellerClientRef!==declaration.travellerClientRef||p.credentialOptionRef!==declaration.credentialOptionRef
      ||p.evidence.checkedAt!==result.sourceCheckedAt||p.evidence.ruleReference!==acceptedStoreRuleReference(result.receiptFingerprint)
      ||p.action&&(p.action.href!==p.evidence.sourceUrl||!p.action.href.startsWith('https://'))
      ||source>accepted||accepted>read||end<=read||end-read>15_000||end-source>300_000)throw Error('response_binding_invalid')
  } else if(positives.length||result.receiptFingerprint!==null||result.evidenceVersionId!==null||result.sourceCheckedAt!==null||result.acceptedAt!==null
    ||result.readAt!==null||result.expiresAt!==null||result.deadlineFromRequestStartMs!==0)throw Error('response_negative_invalid')
  return {...result,evaluations:rows}
}
