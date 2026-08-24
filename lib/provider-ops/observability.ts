// lib/provider-ops/observability.ts
//
// Observability-Contract ohne Persistenz, ohne Admin-UI, ohne Payload-Leak.
// Nur die Allowlist wird übernommen – kein Spread des Inputs.

import type { ProviderOpsDomain, ProviderOpsOutcome } from '@/lib/provider-ops/outcome'

export const PROVIDER_OPS_OPERATIONEN = ['search', 'evaluate', 'nachweis'] as const
export type ProviderOpsOperation = (typeof PROVIDER_OPS_OPERATIONEN)[number]

export const PROVIDER_OPS_EVENT_FELDER = [
  'domain',
  'providerId',
  'operation',
  'outcome',
  'durationMs',
  'resultCount',
  'droppedCount',
  'rateLimitHit',
  'recordedAt',
] as const

export type ProviderOpsEvent = {
  domain: ProviderOpsDomain
  providerId: string | null
  operation: ProviderOpsOperation
  outcome: ProviderOpsOutcome
  durationMs: number
  resultCount: number | null
  droppedCount: number | null
  rateLimitHit: boolean
  recordedAt: string
}

export function providerOpsEvent(
  teil: Omit<ProviderOpsEvent, 'recordedAt'> & { recordedAt?: string },
): ProviderOpsEvent {
  return {
    domain: teil.domain,
    providerId: teil.providerId,
    operation: teil.operation,
    outcome: teil.outcome,
    durationMs: teil.durationMs,
    resultCount: teil.resultCount,
    droppedCount: teil.droppedCount,
    rateLimitHit: teil.rateLimitHit,
    recordedAt: teil.recordedAt ?? new Date().toISOString(),
  }
}
