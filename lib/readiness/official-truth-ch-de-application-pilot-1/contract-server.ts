import 'server-only'
import { sha256Hex } from '@/lib/readiness/digest'
import { contentIdentityBinding, type ContentIdentityBinding } from '@/lib/readiness/official-truth-content-identity'
import { OFFICIAL_TRUTH_WHOLE_SOURCE_CURRENT_REQUEST_POLICY } from '@/lib/readiness/official-truth-whole-source-current-request-1'
import type { QuellenAbdeckung } from '@/lib/readiness/source-router'

/** Code-owned, independently reviewed legal/application mapping. A database
 * grant can select an EXACT compiled contract; it cannot supply source or fact.
 * No German source/mapping is qualified by #938. Adding one is a later review. */
export type ApplicationContract = Readonly<{
  id: string; digest: string;
  applicationScope: 'ch-ordinary-tourism-direct-de-v1';
  travelDates: Readonly<{ from: string; through: string }>;
  source: Readonly<{ sourceId: string; url: string; binding: ContentIdentityBinding; coverage: QuellenAbdeckung }>;
  extractorId: string; extractorVersion: number;
  /** Derives legal validity from the COMPLETE current representation. Null means
   * no evidenced legal bound, never the presentation expiry. Failure is closed. */
  validity: (completeText: string) => { validFrom: string | null; validUntil: string | null } | null;
  /** Absent on every legacy contract. A future Protocol 3 contract names the dormant policy. */
  sourceProtocol?: 3
  policyId?: string
  policyVersion?: number
}>
const contracts: readonly ApplicationContract[] = Object.freeze([])
export function applicationContract(id: string, digest: string): ApplicationContract | null {
  return contracts.find(c => c.id === id && c.digest === digest) ?? null
}
export function applicationContractExpectsCurrentRequest(contract: ApplicationContract): boolean {
  return contract.sourceProtocol === 3
    && contract.policyId === OFFICIAL_TRUTH_WHOLE_SOURCE_CURRENT_REQUEST_POLICY.policyId
    && contract.policyVersion === OFFICIAL_TRUTH_WHOLE_SOURCE_CURRENT_REQUEST_POLICY.policyVersion
}
/** Identity of a future Protocol 3 contract. The compiled list above stays empty. */
export function applicationCurrentRequestContractDigest(contract: ApplicationContract): string | null {
  if (!applicationContractExpectsCurrentRequest(contract)) return null
  return sha256Hex(JSON.stringify({
    usage: 'current_request_only',
    sourceFingerprintProtocol: 3,
    policyId: contract.policyId,
    policyVersion: contract.policyVersion,
    id: contract.id,
    applicationScope: contract.applicationScope,
    sourceId: contract.source.sourceId,
    url: contract.source.url,
    binding: contentIdentityBinding(contract.source.binding),
    extractorId: contract.extractorId,
    extractorVersion: contract.extractorVersion,
  }))
}
/** Outer genuine-use gate. No env/header/query/localStorage can change it. */
export function applicationPilotEnabled(): boolean { return false }
