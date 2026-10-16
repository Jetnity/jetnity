import type { DiscoveryQueryIntent } from '../query-intents'
import type { SourceDiscoveryResult } from '../coordinator'

/** Only this closed data shape is accepted from a transport. Never a sourceId. */
export type SearchHit = Readonly<{ url: string }>

/**
 * Code-owned injection seam, implemented ONLY by test fixtures in this slice.
 * Return a native Promise of untrusted data (expected: readonly SearchHit[]).
 * Cooperate with cancellation and release your own resources on signal abort.
 * This interface cannot sandbox arbitrary JavaScript or cancel a foreign promise.
 */
export type SearchHitPort = (intent: DiscoveryQueryIntent, signal: AbortSignal) => Promise<unknown>

export type SearchBridgeOptions = Readonly<{
  signal: AbortSignal
  transport?: SearchHitPort
  /** Whole operation, 1..5000ms, default 1000. Tests use mocked timers. */
  timeoutMs?: number
}>

export type SearchBridgeResult = SourceDiscoveryResult | (
  Extract<SourceDiscoveryResult, { status: 'gap_unqualified' }>
  & Readonly<{ authorityRegistration: 'independent_registration_required' }>
)
