// Offline probe of the public 12Go facade. Esbuild aliases the policy module.

import { resetSharedCmpController, readCmpController } from '@/lib/privacy/privacybee-cmp/abo'
import {
  checkProductionExecution,
  consumeProductionGrant,
  releaseProductionExecution,
  requestProductionExecution,
} from '@/lib/privacy/privacybee-cmp/produktion'
import { PRODUCTION_POLICY_TABLE } from '@/lib/privacy/privacybee-cmp/produktionspolitik'
import { TWELVE_GO_HOST_SANDBOX, TWELVE_GO_HOST_SRC, TWELVE_GO_POLICY_ID } from '@/lib/providers/twelve-go/widget/protokoll'

const fehler: string[] = []

function werte(analytics = true) {
  return {
    SECURITY_STORAGE: true,
    FUNCTIONALITY_STORAGE: true,
    ANALYTICS_STORAGE: analytics,
    AD_STORAGE: false,
    AD_USER_DATA: false,
    AD_PERSONALIZATION: false,
    PERSONALIZATION_STORAGE: false,
  }
}

function install(flag: boolean) {
  const host = globalThis as typeof globalThis & {
    window: typeof globalThis
    location: { hostname: string }
    PrivacyBee: { getAllConsents: () => ReturnType<typeof werte>; getConsent: (name: string) => boolean; hasExplicitConsent: () => boolean }
    __jetnityCmp?: { releaseAllowed: boolean; killDenied: boolean }
    __jetnityUseFixturePolicy?: boolean
  }
  host.window = host
  host.location = { hostname: 'jetnity.com' }
  const stand = { analytics: true }
  host.PrivacyBee = {
    getAllConsents: () => werte(stand.analytics),
    getConsent: (name: string) => werte(stand.analytics)[name as keyof ReturnType<typeof werte>],
    hasExplicitConsent: () => true,
  }
  host.__jetnityUseFixturePolicy = flag
  host.__jetnityCmp = { releaseAllowed: true, killDenied: false }
  return stand
}

if (PRODUCTION_POLICY_TABLE.twelvego !== null) fehler.push('Tabelle nicht null')

resetSharedCmpController()
install(false)
if (requestProductionExecution('twelvego', 'scope-a') !== null) fehler.push('ohne Fixture freigegeben')

resetSharedCmpController()
const stand = install(true)
const first = requestProductionExecution('twelvego', 'scope-a')
if (!first || first.src !== TWELVE_GO_HOST_SRC || first.sandbox !== TWELVE_GO_HOST_SANDBOX || first.childOrigin !== 'https://jetnity-widgets.vercel.app') {
  fehler.push('Capability weicht ab')
} else if (requestProductionExecution('twelvego', 'scope-a') !== null) {
  fehler.push('zweiter Kontext')
} else {
  const grant = consumeProductionGrant(first)
  if (!grant || grant.policyId !== TWELVE_GO_POLICY_ID || grant.parentGeneration < 1) fehler.push('Grant fehlt')
  if (consumeProductionGrant(first) !== null) fehler.push('zweiter Consume')
  if (!checkProductionExecution(first)) fehler.push('Check nach Consume')
  stand.analytics = false
  if (checkProductionExecution(first)) fehler.push('Kategorie-Verlust bleibt gültig')
  releaseProductionExecution(first)
  stand.analytics = true
  resetSharedCmpController()
  const second = requestProductionExecution('twelvego', 'scope-b')
  releaseProductionExecution(first)
  if (!second || !checkProductionExecution(second)) fehler.push('altes Release beendet den neuen Handle')
  else releaseProductionExecution(second)
}

if (readCmpController().live) fehler.push('Live bleibt nach Release')

if (fehler.length) {
  console.error(fehler.join('\n'))
  process.exit(1)
}
console.log('12go probe ok')
