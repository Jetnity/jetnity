import { cmpProductionBannerAllowed } from '@/lib/privacy/privacybee-cmp/freigabe'
import { PrivacyBeeCmpClient } from '@/components/privacy/PrivacyBeeCmpClient'

/** Mount point for a later true release. Today the constant keeps this null. */
export function PrivacyBeeCmpBoundary() {
  const allowed: boolean = cmpProductionBannerAllowed({ hostname: null, killSwitch: null })
  if (!allowed) return null
  return <PrivacyBeeCmpClient />
}
