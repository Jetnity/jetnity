import 'server-only'

import { rentalAccess } from '@/lib/providers/discovercars/search/server'
import type { NativeRentalConfigurationSnapshot } from './bewertung'

/** Only the actual request gate decides whether configuration is sufficient.
 * Its credential result never crosses this server-only adapter. No transport
 * is created and no provider request is made. */
export function nativeRentalConfiguration(
  env: Record<string, string | undefined> = process.env,
): NativeRentalConfigurationSnapshot {
  if (env.JETNITY_DISCOVERCARS_SEARCH_ENABLED !== '1') return { kind: 'disabled' }
  return { kind: rentalAccess(env) ? 'configured' : 'not_configured' }
}
