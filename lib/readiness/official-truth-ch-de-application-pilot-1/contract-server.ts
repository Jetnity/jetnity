import 'server-only'
import type { ContentIdentityBinding } from '@/lib/readiness/official-truth-content-identity'
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
}>
const contracts: readonly ApplicationContract[] = Object.freeze([])
export function applicationContract(id: string, digest: string): ApplicationContract | null {
  return contracts.find(c => c.id === id && c.digest === digest) ?? null
}
/** Outer genuine-use gate. No env/header/query/localStorage can change it. */
export function applicationPilotEnabled(): boolean { return false }
