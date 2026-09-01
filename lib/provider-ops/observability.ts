// lib/provider-ops/observability.ts
//
// Payload-sicherer gemeinsamer Observability-Contract.
// Nur die Allowlist wird übernommen – kein Spread des Inputs.
// S7 fügt eine best-effort Sink-Naht und eine rein read-only Health-Ableitung
// hinzu. Keine Persistenz, kein Provider-Ping, keine Steuerung.

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

const PROVIDER_OPS_MAX_DURATION_MS = 10 * 60 * 1_000
const PROVIDER_OPS_MAX_COUNT = 1_000_000
const PROVIDER_OPS_MAX_PROVIDER_ID = 80

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

export type ProviderOpsEventSink = {
  write(event: ProviderOpsEvent): void | Promise<void>
}

export type ProviderOpsHealthStatus =
  | 'unknown'
  | 'ok'
  | 'empty'
  | 'partial'
  | 'unavailable'
  | 'timeout'
  | 'rate_limited'
  | 'internal'

export type ProviderOpsHealth = {
  status: ProviderOpsHealthStatus
  evidenceAt: string | null
  stale: boolean
}

function begrenzteGanzzahl(wert: number, maximum: number): number {
  if (!Number.isFinite(wert)) return 0
  return Math.min(Math.max(Math.floor(wert), 0), maximum)
}

function begrenzterZaehler(wert: number | null): number | null {
  if (wert === null) return null
  return begrenzteGanzzahl(wert, PROVIDER_OPS_MAX_COUNT)
}

function providerIdLesen(wert: string | null): string | null {
  if (wert === null) return null
  const bereinigt = wert.trim().slice(0, PROVIDER_OPS_MAX_PROVIDER_ID)
  return bereinigt || null
}

export function providerOpsEvent(
  teil: Omit<ProviderOpsEvent, 'recordedAt'> & { recordedAt?: string },
): ProviderOpsEvent {
  return {
    domain: teil.domain,
    providerId: providerIdLesen(teil.providerId),
    operation: teil.operation,
    outcome: teil.outcome,
    durationMs: begrenzteGanzzahl(teil.durationMs, PROVIDER_OPS_MAX_DURATION_MS),
    resultCount: begrenzterZaehler(teil.resultCount),
    droppedCount: begrenzterZaehler(teil.droppedCount),
    rateLimitHit: teil.rateLimitHit,
    recordedAt: teil.recordedAt ?? new Date().toISOString(),
  }
}

/**
 * Best-effort: Observability darf die fachliche Provider-Antwort nie verändern.
 * Der Sink erhält ausschliesslich das bereits allowlist-konstruierte Event.
 */
export async function providerOpsEventSchreiben(
  sink: ProviderOpsEventSink | null | undefined,
  teil: Omit<ProviderOpsEvent, 'recordedAt'> & { recordedAt?: string },
): Promise<ProviderOpsEvent> {
  const event = providerOpsEvent(teil)
  if (!sink) return event
  try {
    await sink.write(event)
  } catch {
    // Absichtlich leer: Telemetrie ist nicht Teil der User-Truth.
  }
  return event
}

/**
 * Server-Log-Sink ohne externe Abhängigkeit. `event` ist bereits allowlisted.
 * Keine Rohdaten, Kennungen, Request-Payloads oder Provider-Antworten ergänzen.
 */
export const providerOpsConsoleEventSink: ProviderOpsEventSink = {
  write(event) {
    console.info('provider_ops_event', event)
  },
}

function healthStatusAusOutcome(outcome: ProviderOpsOutcome): ProviderOpsHealthStatus {
  if (outcome === 'ok' || outcome === 'checked_empty') return outcome === 'ok' ? 'ok' : 'empty'
  if (outcome === 'empty') return 'empty'
  if (outcome === 'partial') return 'partial'
  if (outcome === 'unavailable') return 'unavailable'
  if (outcome === 'timeout') return 'timeout'
  if (outcome === 'rate_limited') return 'rate_limited'
  return outcome === 'error' ? 'internal' : 'unknown'
}

/**
 * Deterministische read-only Ableitung aus vorhandener Evidence.
 * Keine oder veraltete Evidence darf niemals als grün erscheinen.
 *
 * `invalid` ist absichtlich keine Health-Evidence: dieselbe S1-Taxonomie wird
 * auch für Request-/Schemafehler vor einem Provider-Aufruf verwendet. Solche
 * Clientfehler dürfen eine echte Provider-Ausführung weder herstellen noch
 * verdrängen. Ein Providerfehler nach tatsächlichem Aufruf muss an der
 * Orchestrierungsnaht als technischer Providerfehler beobachtet werden.
 */
export function providerOpsHealthAusEvents(
  events: readonly ProviderOpsEvent[],
  optionen: { domain: ProviderOpsDomain; nowMs: number; maxAgeMs: number },
): ProviderOpsHealth {
  const passende = events
    .filter((event) => event.domain === optionen.domain && event.outcome !== 'invalid')
    .map((event) => ({ event, atMs: Date.parse(event.recordedAt) }))
    .filter((eintrag) => Number.isFinite(eintrag.atMs))
    .sort((a, b) => b.atMs - a.atMs)

  const juengste = passende[0]
  if (!juengste) return { status: 'unknown', evidenceAt: null, stale: false }

  if (
    !Number.isFinite(optionen.nowMs) ||
    !Number.isFinite(optionen.maxAgeMs) ||
    optionen.maxAgeMs < 0
  ) {
    return { status: 'unknown', evidenceAt: juengste.event.recordedAt, stale: true }
  }

  const ageMs = optionen.nowMs - juengste.atMs
  const stale = ageMs < 0 || ageMs > optionen.maxAgeMs
  if (stale) {
    return { status: 'unknown', evidenceAt: juengste.event.recordedAt, stale: true }
  }

  return {
    status: healthStatusAusOutcome(juengste.event.outcome),
    evidenceAt: juengste.event.recordedAt,
    stale: false,
  }
}
