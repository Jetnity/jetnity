import 'server-only'

import { createHmac } from 'node:crypto'

import type { ProviderOpsCostGuard, ProviderOpsCostGuardErgebnis } from '@/lib/provider-ops/cost-guard'
import { PROVIDER_OPS_DOMAINS, type ProviderOpsDomain } from '@/lib/provider-ops/outcome'

export const PROVIDER_OPS_PERSISTENT_COST_GUARD_VERSION =
  'jetnity.provider_cost_guard.reserve.v1' as const

export type ProviderOpsPersistentCostGuardReservation = Readonly<{
  version: typeof PROVIDER_OPS_PERSISTENT_COST_GUARD_VERSION
  domain: ProviderOpsDomain
  identifierHash: string
  reservedCostMicrousd: number
}>

/**
 * Absichtlich nur ein Port. S6-A entscheidet weder Production-Principal noch
 * Secret-/Transport-Mechanik. Ein späterer serverseitiger Runtime-Adapter darf
 * diesen Port erst nach dem separaten Product-Owner-Gate implementieren.
 */
export type ProviderOpsPersistentCostGuardPort = Readonly<{
  reservieren(eingabe: ProviderOpsPersistentCostGuardReservation): Promise<unknown>
}>

export type ProviderOpsPersistentCostGuardKonfiguration = Readonly<{
  domain: ProviderOpsDomain
  reservedCostMicrousd: number
  identifierHmacKey: string
  port: ProviderOpsPersistentCostGuardPort
}>

const FAIL_CLOSED: ProviderOpsCostGuardErgebnis = { ok: false, retryAfterSec: 1 }
const MAX_RETRY_AFTER_SEC = 24 * 60 * 60
const MAX_COST_MICROUSD = Number.MAX_SAFE_INTEGER

function domainGueltig(domain: string): domain is ProviderOpsDomain {
  return (PROVIDER_OPS_DOMAINS as readonly string[]).includes(domain)
}

function hmacKeyGueltig(key: string): boolean {
  const bytes = new TextEncoder().encode(key).byteLength
  return bytes >= 32 && bytes <= 4096
}

function kostenGueltig(kostenMikroUsd: number): boolean {
  return (
    Number.isSafeInteger(kostenMikroUsd) &&
    kostenMikroUsd >= 0 &&
    kostenMikroUsd <= MAX_COST_MICROUSD
  )
}

function kennungHashen(
  domain: ProviderOpsDomain,
  kennung: string,
  hmacKey: string,
): string | null {
  const normalisiert = kennung.trim()
  if (!normalisiert) return null

  // Domain-Separation verhindert unnötige domänenübergreifende Verknüpfung
  // derselben operativen Kennung im persistenten Store.
  return createHmac('sha256', hmacKey)
    .update(domain, 'utf8')
    .update('\0', 'utf8')
    .update(normalisiert, 'utf8')
    .digest('hex')
}

function ergebnisLesen(wert: unknown): ProviderOpsCostGuardErgebnis {
  if (!wert || typeof wert !== 'object' || Array.isArray(wert)) return FAIL_CLOSED

  const ergebnis = wert as Record<string, unknown>
  if (ergebnis.ok === true) return { ok: true }

  if (
    ergebnis.ok === false &&
    typeof ergebnis.retryAfterSec === 'number' &&
    Number.isInteger(ergebnis.retryAfterSec) &&
    ergebnis.retryAfterSec >= 1 &&
    ergebnis.retryAfterSec <= MAX_RETRY_AFTER_SEC
  ) {
    return { ok: false, retryAfterSec: ergebnis.retryAfterSec }
  }

  return FAIL_CLOSED
}

/**
 * Persistenter S6-A-Adapter.
 *
 * - server-only
 * - keine Supabase-/Secret-Wahl in diesem Modul
 * - Kennung verlässt den Prozess nur als domänengetrennter HMAC-SHA256
 * - Uhr/Atomizität liegen beim persistenten Port bzw. in der DB
 * - jeder Fehler bleibt fail-closed
 * - `leeren()` ist absichtlich No-op: ein Prozess darf globale Zähler niemals
 *   löschen oder so tun, als hätte er sie gelöscht
 */
export function providerOpsPersistentCostGuard(
  konfiguration: ProviderOpsPersistentCostGuardKonfiguration,
): ProviderOpsCostGuard {
  return {
    async erlaubt(kennung) {
      try {
        if (!domainGueltig(konfiguration.domain)) return FAIL_CLOSED
        if (!kostenGueltig(konfiguration.reservedCostMicrousd)) return FAIL_CLOSED
        if (!hmacKeyGueltig(konfiguration.identifierHmacKey)) return FAIL_CLOSED
        if (!konfiguration.port || typeof konfiguration.port.reservieren !== 'function') {
          return FAIL_CLOSED
        }

        const identifierHash = kennungHashen(
          konfiguration.domain,
          kennung,
          konfiguration.identifierHmacKey,
        )
        if (!identifierHash) return FAIL_CLOSED

        const ergebnis = await konfiguration.port.reservieren({
          version: PROVIDER_OPS_PERSISTENT_COST_GUARD_VERSION,
          domain: konfiguration.domain,
          identifierHash,
          reservedCostMicrousd: konfiguration.reservedCostMicrousd,
        })

        return ergebnisLesen(ergebnis)
      } catch {
        return FAIL_CLOSED
      }
    },
    leeren() {
      // Persistent/global truth darf niemals aus einem einzelnen Prozess
      // zurückgesetzt werden. Bewusster No-op.
    },
  }
}
