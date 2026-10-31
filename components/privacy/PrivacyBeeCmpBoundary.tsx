import { cmpProductionBannerAllowed } from '@/lib/privacy/privacybee-cmp/freigabe'
import { PrivacyBeeCmpClient } from '@/components/privacy/PrivacyBeeCmpClient'

/** Mount point for a later true release. Today the constant keeps this null. */
export function PrivacyBeeCmpBoundary() {
  const allowed = cmpProductionBannerAllowed({
    hostname: null,
    killSwitch: process.env.PRIVACYBEE_KILL_SWITCH,
  })
  if (!allowed) return null
  return <PrivacyBeeCmpClient />
}
