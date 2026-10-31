import { serverReleaseAllowsCmp } from '@/lib/privacy/privacybee-cmp/freigabe'
import { PrivacyBeeCmpClient } from '@/components/privacy/PrivacyBeeCmpClient'

export type HarnessRelease = { readonly purpose: 's2-test-release' }

/**
 * Production calls this with no argument. The server gate is release plus kill switch.
 * The exact browser host is checked later by the bootstrap and the client, not via request headers.
 */
function killSwitchWert(): string | undefined {
  if (typeof process === 'undefined') return undefined
  const wert = process.env.PRIVACYBEE_KILL_SWITCH
  return typeof wert === 'string' ? wert : undefined
}

export function PrivacyBeeCmpBoundary({ harnessRelease }: { harnessRelease?: HarnessRelease }) {
  const release = harnessRelease?.purpose === 's2-test-release'
  const allowed = serverReleaseAllowsCmp(killSwitchWert(), release ? true : undefined)
  if (!allowed) return null
  return <PrivacyBeeCmpClient />
}
