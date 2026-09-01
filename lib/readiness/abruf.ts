// lib/readiness/abruf.ts
//
// Provider-neutraler Abort-/Timeout-Abruf für Requirements.
// Kein eigener HTTP-/Retry-Stack. Ein späterer Adapter reicht das
// kombinierte AbortSignal in den bestehenden Provider Transport Core weiter.

import {
  providerOpsConsoleEventSink,
  providerOpsEventSchreiben,
  type ProviderOpsEventSink,
  type ProviderOpsOutcome,
} from '@/lib/provider-ops'
import type { RequirementsAnfrage, RequirementsProvider, RequirementsProviderZeile } from '@/lib/readiness/provider'
import type { OfficialFreshness } from '@/lib/readiness/official'

export const REQUIREMENTS_PROVIDER_TIMEOUT_MS = 4_000

export type RequirementsTechnischerFehlerArt =
  | 'timeout'
  | 'aborted'
  | 'temporarily_unavailable'
  | 'unavailable'

export type RequirementsProviderAbruf =
  | { ok: true; zeilen: RequirementsProviderZeile[] }
  | { ok: false; art: RequirementsTechnischerFehlerArt }

export function requirementsTimeoutBegrenzen(wert: unknown): number {
  if (typeof wert !== 'number' || !Number.isFinite(wert) || wert <= 0) {
    return REQUIREMENTS_PROVIDER_TIMEOUT_MS
  }
  return Math.min(Math.floor(wert), REQUIREMENTS_PROVIDER_TIMEOUT_MS)
}

function artAusFehler(fehler: unknown): RequirementsTechnischerFehlerArt {
  if (fehler && typeof fehler === 'object' && 'availability' in fehler) {
    const art = (fehler as { availability?: unknown }).availability
    if (art === 'unavailable') return 'unavailable'
    if (art === 'temporarily_unavailable') return 'temporarily_unavailable'
  }
  return 'temporarily_unavailable'
}

export function requirementsFreshnessAusFehlerArt(art: RequirementsTechnischerFehlerArt): OfficialFreshness {
  if (art === 'unavailable') return 'provider_unavailable'
  return 'source_temporarily_unavailable'
}

export async function requirementsProviderAbrufen(
  provider: RequirementsProvider,
  anfrage: RequirementsAnfrage,
  optionen: { signal?: AbortSignal; timeoutMs?: number; eventSink?: ProviderOpsEventSink } = {},
): Promise<RequirementsProviderAbruf> {
  const aussen = optionen.signal
  if (aussen?.aborted) {
    return { ok: false, art: 'aborted' }
  }

  const gestartet = Date.now()
  const sink = optionen.eventSink ?? providerOpsConsoleEventSink
  const beobachten = (outcome: ProviderOpsOutcome, resultCount: number | null = 0) => {
    void providerOpsEventSchreiben(sink, {
      domain: 'readiness',
      providerId: provider.name.trim() || null,
      operation: 'evaluate',
      outcome,
      durationMs: Math.max(0, Date.now() - gestartet),
      resultCount,
      droppedCount: null,
      rateLimitHit: false,
    })
  }

  const timeoutMs = requirementsTimeoutBegrenzen(optionen.timeoutMs)
  const timeoutSteuer = new AbortController()
  const combined = aussen ? AbortSignal.any([aussen, timeoutSteuer.signal]) : timeoutSteuer.signal

  let timeoutId: ReturnType<typeof setTimeout> | undefined

  try {
    const lauf = provider.evaluate(anfrage, combined).then(
      (zeilen): RequirementsProviderAbruf => {
        if (!Array.isArray(zeilen)) {
          beobachten('error')
          return { ok: false, art: 'temporarily_unavailable' }
        }
        beobachten(zeilen.length === 0 ? 'checked_empty' : 'ok', zeilen.length)
        return { ok: true, zeilen }
      },
      (fehler: unknown): RequirementsProviderAbruf => {
        if (aussen?.aborted) return { ok: false, art: 'aborted' }
        if (timeoutSteuer.signal.aborted) {
          beobachten('timeout')
          return { ok: false, art: 'timeout' }
        }
        const art = artAusFehler(fehler)
        beobachten(art === 'unavailable' ? 'unavailable' : 'error')
        return { ok: false, art }
      },
    )

    const timeoutLauf = new Promise<RequirementsProviderAbruf>((resolve) => {
      timeoutId = setTimeout(() => {
        timeoutSteuer.abort()
        beobachten('timeout')
        resolve({ ok: false, art: 'timeout' })
      }, timeoutMs)
    })

    const abortLauf = aussen
      ? new Promise<RequirementsProviderAbruf>((resolve) => {
          aussen.addEventListener(
            'abort',
            () => {
              timeoutSteuer.abort()
              resolve({ ok: false, art: 'aborted' })
            },
            { once: true },
          )
        })
      : null

    const gewinner = abortLauf
      ? await Promise.race([lauf, timeoutLauf, abortLauf])
      : await Promise.race([lauf, timeoutLauf])

    if (aussen?.aborted) return { ok: false, art: 'aborted' }
    return gewinner
  } finally {
    if (timeoutId !== undefined) clearTimeout(timeoutId)
    timeoutSteuer.abort()
  }
}
