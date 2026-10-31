import { VIATOR_LIVE_CHECK_CACHE_SECONDS, VIATOR_MAX_CACHE_SECONDS, type ViatorCacheVerdict, type ViatorEvidenceMode, type ViatorPaxMixItem } from '@/lib/providers/viator/activities/contracts'
import { instantMs } from '@/lib/providers/viator/activities/guard'

export function viatorContextKey(parts: {
  destinationId?: string | null
  productCode?: string | null
  productOptionCode?: string | null
  travelDate?: string | null
  paxMix?: readonly ViatorPaxMixItem[] | null
}): string {
  const pax = [...(parts.paxMix ?? [])]
    .map((item) => ({ ageBand: item.ageBand, numberOfTravelers: item.numberOfTravelers }))
    .sort((left, right) => left.ageBand.localeCompare(right.ageBand))
  return JSON.stringify({
    destinationId: parts.destinationId ?? null,
    productCode: parts.productCode ?? null,
    productOptionCode: parts.productOptionCode ?? null,
    travelDate: parts.travelDate ?? null,
    pax,
  })
}

export function viatorCacheVerdict(input: {
  evidenceMode: ViatorEvidenceMode
  ttlSeconds: number
  retrievedAt: string | null
  nowMs: number
  boundKey?: string | null
  currentKey?: string | null
}): ViatorCacheVerdict {
  const blocked = (reason: ViatorCacheVerdict['reason'], acceptedTtl = false): ViatorCacheVerdict => ({
    acceptedTtl,
    fresh: false,
    reusable: false,
    reason,
  })

  if (input.evidenceMode === 'fixture') return blocked('fixture_not_reusable')
  if (input.evidenceMode === 'affiliate_redirect') return blocked('affiliate_not_cached')
  if (!Number.isInteger(input.ttlSeconds) || input.ttlSeconds < 0) return blocked('invalid_ttl')
  if (input.ttlSeconds > VIATOR_MAX_CACHE_SECONDS) return blocked('ttl_exceeds_3600')
  if (input.evidenceMode === 'live_check' && input.ttlSeconds !== VIATOR_LIVE_CHECK_CACHE_SECONDS) {
    return blocked('live_check_must_not_cache')
  }
  if (input.boundKey != null && input.currentKey != null && input.boundKey !== input.currentKey) {
    return blocked('stale_context', true)
  }
  if (!input.retrievedAt) return blocked('invalid_timestamp', true)
  const retrievedAtMs = instantMs(input.retrievedAt)
  if (retrievedAtMs == null) return blocked('invalid_timestamp', true)
  const ageMs = input.nowMs - retrievedAtMs
  if (ageMs < 0) return blocked('invalid_timestamp', true)

  if (input.evidenceMode === 'live_check') {
    return {
      acceptedTtl: true,
      fresh: ageMs === 0,
      reusable: false,
      reason: ageMs === 0 ? 'ok' : 'expired',
    }
  }

  const fresh = ageMs <= input.ttlSeconds * 1000
  return {
    acceptedTtl: true,
    fresh,
    reusable: fresh,
    reason: fresh ? 'ok' : 'expired',
  }
}
