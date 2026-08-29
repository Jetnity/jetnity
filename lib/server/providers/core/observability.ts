// lib/server/providers/core/observability.ts
//
// Injected observer contract. Events are structured, allowlisted and never
// carry request/response bodies or header values.

import {
  PROVIDER_TRANSPORT_EVENT_FIELDS,
  type ProviderTransportEvent,
} from '@/lib/server/providers/core/domain'

export function providerTransportEvent(
  teil: ProviderTransportEvent,
): ProviderTransportEvent {
  return {
    name: teil.name,
    providerId: teil.providerId,
    operationId: teil.operationId,
    method: teil.method,
    origin: teil.origin,
    path: teil.path,
    attempt: teil.attempt,
    maxAttempts: teil.maxAttempts,
    status: teil.status,
    elapsedMs: teil.elapsedMs,
    errorKind: teil.errorKind,
    causeKind: teil.causeKind,
    retryAfterMs: teil.retryAfterMs,
    delayMs: teil.delayMs,
    correlationId: teil.correlationId,
    recordedAt: teil.recordedAt,
  }
}

export function providerTransportEventFieldNames(): readonly string[] {
  return PROVIDER_TRANSPORT_EVENT_FIELDS
}

export function isoFromClock(nowMs: number): string {
  const iso = new Date(nowMs).toISOString()
  return Number.isNaN(Date.parse(iso)) ? '1970-01-01T00:00:00.000Z' : iso
}
