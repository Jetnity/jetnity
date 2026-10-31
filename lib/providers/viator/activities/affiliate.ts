import {
  VIATOR_NORMALIZED_SCHEMA,
  type ViatorAffiliateRedirect,
} from '@/lib/providers/viator/activities/contracts'
import { validateViatorProductUrl } from '@/lib/providers/viator/activities/url'
import { istViatorProduktcode } from '@/lib/providers/viator/activities/produktcode'

/**
 * Affiliate attribution exists only for an untouched provider productUrl.
 * Fixture payloads cannot mint a redirect, even when the URL itself is safe.
 */
export function readViatorAffiliateRedirect(input: {
  source: 'provider_response' | 'fixture'
  productCode: string
  productUrl: unknown
}): ViatorAffiliateRedirect | null {
  if (input.source !== 'provider_response') return null
  if (!istViatorProduktcode(input.productCode)) return null
  const checked = validateViatorProductUrl(input.productUrl)
  if (!checked.ok) return null
  return {
    schema: VIATOR_NORMALIZED_SCHEMA,
    evidenceMode: 'affiliate_redirect',
    productCode: input.productCode,
    productUrl: checked.url,
    attributionIntact: true,
    source: 'provider_response',
  }
}
