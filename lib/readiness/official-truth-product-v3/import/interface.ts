import { sha256Hex } from '@/lib/readiness/digest'
import { readV3ResearchProposal, OFFICIAL_TRUTH_V3_LIMITS, type V3ResearchProposal } from '../contract'
import type { QuellenRegistry } from '@/lib/readiness/source-registry'

/** One neutral envelope. This manifest describes transport, not an approval API. */
export const V3_PROPOSAL_INTERFACE = Object.freeze({
  interface: 'jetnity.official-truth.research-proposal', revision: 1, schema: 3,
  mediaType: 'application/json; charset=utf-8', encoding: 'UTF-8', cardinality: 'one_proposal',
  kind: 'untrusted_research_proposal', authority: 'none', maximumBytes: OFFICIAL_TRUTH_V3_LIMITS.payloadBytes,
  validator: 'readV3ResearchProposal',
  fields: Object.freeze(['schema', 'kind', 'jobId', 'operationId', 'context', 'contextKey', 'research', 'proposedFact', 'references']),
  referenceType: 'RepresentationRef', factType: 'RegelFakt | RegelFaktV2',
  receiptPolicy: 'no_approval_or_accepted_receipt_from_upload',
} as const)

export type V3ProposalUpload = Readonly<{ proposal: V3ResearchProposal; digest: string; bytes: number }>
export type V3UploadResult =
  | Readonly<{ ok: true; value: V3ProposalUpload }>
  | Readonly<{ ok: false; reason: 'invalid_upload' | 'bound_exceeded' | 'invalid_proposal' }>

/** Exact UTF-8 text bytes bind an operation; whitespace changes count as new bytes. */
export function readV3ProposalUpload(input: unknown, registry: QuellenRegistry): V3UploadResult {
  if (typeof input !== 'string') return Object.freeze({ ok: false, reason: 'invalid_upload' })
  // The cheap character bound precedes encoding and parsing. No Buffer, file or URL input.
  if (input.length > OFFICIAL_TRUTH_V3_LIMITS.payloadBytes) return Object.freeze({ ok: false, reason: 'bound_exceeded' })
  const encoded = new TextEncoder().encode(input)
  if (encoded.byteLength > OFFICIAL_TRUTH_V3_LIMITS.payloadBytes) return Object.freeze({ ok: false, reason: 'bound_exceeded' })
  // UTF-16 lone surrogates must not silently normalize to replacement bytes.
  if (new TextDecoder('utf-8', { fatal: true }).decode(encoded) !== input) return Object.freeze({ ok: false, reason: 'invalid_upload' })
  try {
    const parsed = readV3ResearchProposal(JSON.parse(input), registry)
    if (!parsed.ok) return Object.freeze({ ok: false, reason: 'invalid_proposal' })
    return Object.freeze({ ok: true, value: Object.freeze({ proposal: parsed.value, digest: sha256Hex(input), bytes: encoded.byteLength }) })
  } catch {
    return Object.freeze({ ok: false, reason: 'invalid_upload' })
  }
}
