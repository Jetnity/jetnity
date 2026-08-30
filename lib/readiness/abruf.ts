// lib/readiness/abruf.ts
//
// Provider-neutraler Abort-/Timeout-Abruf für Requirements.
// Kein eigener HTTP-/Retry-Stack. Ein späterer Adapter reicht das
// kombinierte AbortSignal in den bestehenden Provider Transport Core weiter.

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
  optionen: { signal?: AbortSignal; timeoutMs?: number } = {},
): Promise<RequirementsProviderAbruf> {
  const aussen = optionen.signal
  if (aussen?.aborted) {
    return { ok: false, art: 'aborted' }
  }

  const timeoutMs = requirementsTimeoutBegrenzen(optionen.timeoutMs)
  const timeoutSteuer = new AbortController()
  const combined = aussen ? AbortSignal.any([aussen, timeoutSteuer.signal]) : timeoutSteuer.signal

  let timeoutId: ReturnType<typeof setTimeout> | undefined

  try {
    const lauf = provider.evaluate(anfrage, combined).then(
      (zeilen): RequirementsProviderAbruf => {
        if (!Array.isArray(zeilen)) {
          return { ok: false, art: 'temporarily_unavailable' }
        }
        return { ok: true, zeilen }
      },
      (fehler: unknown): RequirementsProviderAbruf => {
        if (aussen?.aborted) return { ok: false, art: 'aborted' }
        if (timeoutSteuer.signal.aborted) return { ok: false, art: 'timeout' }
        return { ok: false, art: artAusFehler(fehler) }
      },
    )

    const timeoutLauf = new Promise<RequirementsProviderAbruf>((resolve) => {
      timeoutId = setTimeout(() => {
        timeoutSteuer.abort()
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
