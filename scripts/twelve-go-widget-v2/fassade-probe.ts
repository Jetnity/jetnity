// Offline probe of the public 12Go facade against the selected source policy.
// The positive path uses the actual production bootstrap. Explicit false stays separate.

import { resetSharedCmpController, readCmpController } from '@/lib/privacy/privacybee-cmp/abo'
import { buildBootstrapSource, productionBootstrapSource } from '@/lib/privacy/privacybee-cmp/bootstrap'
import {
  checkProductionExecution,
  consumeProductionGrant,
  releaseProductionExecution,
  requestProductionExecution,
} from '@/lib/privacy/privacybee-cmp/produktion'
import { PRODUCTION_POLICY_TABLE } from '@/lib/privacy/privacybee-cmp/produktionspolitik'
import { CMP_RELEASE_AUTHORIZED } from '@/lib/privacy/privacybee-cmp/vertrag'
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

function install(hostname: string) {
  const host = globalThis as typeof globalThis & {
    window: typeof globalThis
    location: { hostname: string }
    document: {
      addEventListener: () => void
      querySelector: () => null
      createElement: () => { src: string; async: boolean; setAttribute: () => void }
      head: { appendChild: () => void }
      documentElement: { appendChild: () => void }
    }
    PrivacyBee: {
      getAllConsents: () => ReturnType<typeof werte>
      getConsent: (name: string) => boolean
      hasExplicitConsent: () => boolean
    }
    __jetnityCmp?: unknown
  }
  host.window = host
  host.location = { hostname }
  host.document = {
    addEventListener() {},
    querySelector() { return null },
    createElement() { return { src: '', async: false, setAttribute() {} } },
    head: { appendChild() {} },
    documentElement: { appendChild() {} },
  }
  const stand = { analytics: true }
  host.PrivacyBee = {
    getAllConsents: () => werte(stand.analytics),
    getConsent: (name: string) => werte(stand.analytics)[name as keyof ReturnType<typeof werte>],
    hasExplicitConsent: () => true,
  }
  delete host.__jetnityCmp
  return stand
}

if (CMP_RELEASE_AUTHORIZED !== true) fehler.push('Release ist nicht true')
if (PRODUCTION_POLICY_TABLE.discovercars !== null) fehler.push('DiscoverCars ist nicht null')
if (PRODUCTION_POLICY_TABLE.twelvego?.policyId !== TWELVE_GO_POLICY_ID) fehler.push('12Go-Policy fehlt')
if (PRODUCTION_POLICY_TABLE.twelvego?.hostSelectionCommit !== 'f056b01d63ac7d61650864734a9b44eb6484989e') fehler.push('Host-Pin fehlt')

resetSharedCmpController()
if (requestProductionExecution('twelvego', 'scope-a') !== null) fehler.push('fehlendes Gate hat freigegeben')

resetSharedCmpController()
install('jetnity.com')
eval(buildBootstrapSource({ release: false, killDenied: false }))
if (requestProductionExecution('twelvego', 'scope-a') !== null || readCmpController().live) fehler.push('explizites false hat freigegeben')

resetSharedCmpController()
install('jetnity.com')
eval(buildBootstrapSource({ release: true, killDenied: true }))
if (requestProductionExecution('twelvego', 'scope-a') !== null) fehler.push('Kill hat freigegeben')

resetSharedCmpController()
install('example.com')
eval(buildBootstrapSource({ release: true, killDenied: false }))
if (requestProductionExecution('twelvego', 'scope-a') !== null) fehler.push('fremder Host hat freigegeben')

resetSharedCmpController()
const stand = install('jetnity.com')
eval(productionBootstrapSource(null))
const gate = (globalThis as { __jetnityCmp?: { releaseAllowed?: boolean; killDenied?: boolean; scripts?: number } }).__jetnityCmp
if (!gate || gate.releaseAllowed !== true || gate.killDenied !== false || (gate.scripts ?? 0) < 1) fehler.push('Produktionsgate fehlt')
if (requestProductionExecution('discovercars', 'scope-a') !== null) fehler.push('DiscoverCars hat eine Capability')
const kopie = {
  providerId: 'twelvego' as const,
  src: TWELVE_GO_HOST_SRC,
  childOrigin: 'https://jetnity-widgets.vercel.app',
  sandbox: TWELVE_GO_HOST_SANDBOX,
  protocolRevision: 1 as const,
}
if (checkProductionExecution(kopie)) fehler.push('Feldkopie ist ein Handle')
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
  if (checkProductionExecution(first)) fehler.push('freigegebener Handle bleibt gültig')
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
