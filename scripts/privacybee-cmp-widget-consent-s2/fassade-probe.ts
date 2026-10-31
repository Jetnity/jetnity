// Offline probe of the public facade. Esbuild aliases the policy module to the test mock.

import { resetSharedCmpController, readCmpController } from '@/lib/privacy/privacybee-cmp/abo'
import { buildBootstrapSource, readBakedProductionGate } from '@/lib/privacy/privacybee-cmp/bootstrap'
import {
  checkProductionExecution,
  consumeProductionGrant,
  releaseProductionExecution,
  requestProductionExecution,
} from '@/lib/privacy/privacybee-cmp/produktion'
import {
  CMP_CHILD_ORIGIN,
  DISCOVERCARS_EMBED_PATH,
  TWELVEGO_ARTIFACT_SHA256,
  TWELVEGO_EMBED_PATH,
  validateProductionPolicy,
} from '@/lib/privacy/privacybee-cmp/produktionspolitik'

const fehler: string[] = []

function werte() {
  return {
    SECURITY_STORAGE: true,
    FUNCTIONALITY_STORAGE: true,
    ANALYTICS_STORAGE: true,
    AD_STORAGE: true,
    AD_USER_DATA: true,
    AD_PERSONALIZATION: true,
    PERSONALIZATION_STORAGE: true,
  }
}

function install(release: boolean, killDenied: boolean) {
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
    PrivacyBee: unknown
    __jetnityCmp?: unknown
    __jetnityUseFixturePolicy?: boolean
    __jetnityPolicyOverride?: unknown
  }
  host.window = host
  host.location = { hostname: 'jetnity.com' }
  host.document = {
    addEventListener() {},
    querySelector() { return null },
    createElement() { return { src: '', async: false, setAttribute() {} } },
    head: { appendChild() {} },
    documentElement: { appendChild() {} },
  }
  host.PrivacyBee = {
    getAllConsents: () => werte(),
    getConsent: (name: string) => werte()[name as keyof ReturnType<typeof werte>],
    hasExplicitConsent: () => true,
  }
  host.__jetnityUseFixturePolicy = true
  delete host.__jetnityPolicyOverride
  delete host.__jetnityCmp
  eval(buildBootstrapSource({ release, killDenied }))
}

resetSharedCmpController()
const ohne = requestProductionExecution('discovercars', 'scope-alpha')
if (ohne !== null || readBakedProductionGate() !== null) fehler.push('fehlendes Gate hat autorisiert')

resetSharedCmpController()
install(true, true)
const kill = requestProductionExecution('discovercars', 'scope-alpha')
if (kill !== null || readCmpController().live) fehler.push('Kill-Switch hat eine Capability ausgestellt')

resetSharedCmpController()
install(true, false)
const erlaubt = requestProductionExecution('discovercars', 'scope-alpha')
if (!erlaubt || !checkProductionExecution(erlaubt)) fehler.push('erlaubtes Gate ohne Grant')
else {
  const grant = consumeProductionGrant(erlaubt)
  if (!grant || grant.parentGeneration < 1 || grant.policyId !== 'discovercars-analytics') fehler.push('Consume fehlt')
  if (consumeProductionGrant(erlaubt) !== null) fehler.push('zweiter Consume')
  if (!checkProductionExecution(erlaubt)) fehler.push('Check nach Consume')
  if (erlaubt.src !== `${CMP_CHILD_ORIGIN}${DISCOVERCARS_EMBED_PATH}`) fehler.push(`src ${erlaubt.src}`)
  releaseProductionExecution(erlaubt)
}

resetSharedCmpController()
install(true, false)
const fremd = validateProductionPolicy({
  providerId: 'twelvego',
  policyId: 'twelvego-analytics',
  requiredOptional: ['ANALYTICS_STORAGE'],
  processingPolicyRevision: 'rev1',
  disclosureRevision: 'notice1',
  artifactSha256: TWELVEGO_ARTIFACT_SHA256,
  parentOrigin: 'https://jetnity.com',
  childOrigin: CMP_CHILD_ORIGIN,
  embedPath: TWELVEGO_EMBED_PATH,
  protocolRevision: 1,
  networkPolicyRevision: 'net1',
  hostSelectionCommit: '0123456789abcdef0123456789abcdef01234567',
  sandbox: 'allow-scripts allow-same-origin',
})
;(globalThis as { __jetnityPolicyOverride?: unknown }).__jetnityPolicyOverride = fremd
if (!fremd) fehler.push('Override ungültig')
if (requestProductionExecution('discovercars', 'scope-alpha') !== null) fehler.push('fremder Record wurde akzeptiert')

if (fehler.length) {
  console.error(fehler.join('\n'))
  process.exit(1)
}
console.log('probe ok')
