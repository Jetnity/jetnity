import 'server-only'
import type { AcceptedStoreContract } from './canonical-server'

export type StoreHead = Readonly<{ sequence: number; hash: string }>
/** A deployment must bind BOTH server custody and a durable restore witness
 * outside this database. No key, runtime enable flag or admission is provided
 * by this dormant package. These are code-owned bindings, never HTTP inputs. */
export type AcceptedStoreBinding = Readonly<{
  /** Exact compiled deployment URL. The only HTTP shape is a literal loopback
   * infrastructure fixture selected outside the production module registry. */
  targetUrl: string;
  contract: AcceptedStoreContract;
  codeDigest: string;
  sourceMaxAgeSeconds: number;
  retentionSeconds: number;
  displaySeconds: number;
  current: () => boolean;
  key: Readonly<{ id: string; policyDigest: string; resolve: (signal:AbortSignal) => Promise<Uint8Array | null> }>;
  witness: Readonly<{
    domain: string;
    read: (signal: AbortSignal) => Promise<StoreHead | null>;
    compareAndSwap: (prior: StoreHead, successor: StoreHead, operationId: string, signal: AbortSignal) => Promise<boolean>;
  }>;
}>

const DEPLOYMENTS: readonly AcceptedStoreBinding[] = Object.freeze([])

export function acceptedStoreBinding(): AcceptedStoreBinding | null {
  if (DEPLOYMENTS.length !== 1) return null
  const binding = DEPLOYMENTS[0]!
  return binding.current() ? binding : null
}
export function bindingCurrent(binding: AcceptedStoreBinding): boolean {
  return acceptedStoreBinding() === binding && binding.current()
}
export function acceptedStoreAvailable(): boolean { return acceptedStoreBinding() !== null }
