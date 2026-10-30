import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'

import {
  VENDOR_PURPOSE_SEPARATION_VERIFIED,
  VENDOR_SCRIPT_EXECUTION_AUTHORIZED,
  WIDGET_CONSENT_PROVIDER_IDS,
  WIDGET_CONSENT_PROVIDERS,
  WIDGET_CONSENT_PURPOSES,
  parseWidgetConsentProviderId,
  purposeControlsEnforceable,
} from '@/lib/privacy/widget-consent/vertrag'

const hier = dirname(fileURLToPath(import.meta.url))
const wurzel = join(hier, '../../..')

const QUELLEN = [
  'lib/privacy/widget-consent/vertrag.ts',
  'lib/privacy/widget-consent/entscheidung.ts',
  'components/privacy/WidgetConsentChoice.tsx',
  'scripts/widget-consent-foundation-1/einbindung.tsx',
  'scripts/widget-consent-foundation-1/harness.ts',
]

const VERBOTEN = [
  /localStorage/,
  /sessionStorage/,
  /document\.cookie/,
  /XMLHttpRequest/,
  /sendBeacon/,
  /googletagmanager\.com\/gtm\.js/,
  /widget\.js/,
  /<iframe/,
  /createElement\(\s*['"]script['"]/,
  /\bfetch\s*\(/,
]

describe('widget consent vertrag', () => {
  test('nur discovercars und twelvego, beide fail-closed', () => {
    assert.deepEqual(WIDGET_CONSENT_PROVIDER_IDS, ['discovercars', 'twelvego'])
    assert.equal(VENDOR_PURPOSE_SEPARATION_VERIFIED, false)
    assert.equal(VENDOR_SCRIPT_EXECUTION_AUTHORIZED, false)
    assert.deepEqual(Object.keys(WIDGET_CONSENT_PROVIDERS), [...WIDGET_CONSENT_PROVIDER_IDS])
    for (const id of WIDGET_CONSENT_PROVIDER_IDS) {
      const faktum = WIDGET_CONSENT_PROVIDERS[id]
      assert.equal(faktum.liveInJetnity, false)
      assert.equal(faktum.purposeSeparationVerified, false)
      assert.equal(faktum.vendorScriptExecutionAuthorized, false)
      assert.equal(purposeControlsEnforceable(id), false)
      assert.equal(faktum.privacyHref.startsWith('https://'), true)
      assert.equal(faktum.observedHosts.length > 0, true)
    }
  })

  test('fremde Anbieter und URLs werden verworfen', () => {
    assert.equal(parseWidgetConsentProviderId('discovercars'), 'discovercars')
    assert.equal(parseWidgetConsentProviderId('twelvego'), 'twelvego')
    for (const wert of ['gyg', 'privacybee', 'https://www.discovercars.com', 'discovercars ', '', null, 1, {}]) {
      assert.equal(parseWidgetConsentProviderId(wert), null)
    }
  })

  test('der Nachweis lässt sich nicht zur Laufzeit einschalten', () => {
    assert.throws(() => {
      const ziel = WIDGET_CONSENT_PROVIDERS.discovercars as { vendorScriptExecutionAuthorized: boolean }
      ziel.vendorScriptExecutionAuthorized = true
    }, TypeError)
  })

  test('Zwecke bleiben die drei vorgesehenen Kategorien', () => {
    assert.deepEqual(WIDGET_CONSENT_PURPOSES, [
      'functional_load',
      'nonessential_analytics',
      'advertising_marketing',
    ])
  })

  test('Quelltext schreibt keinen Speicher und lädt kein Skript', () => {
    for (const relativ of QUELLEN) {
      const text = readFileSync(join(wurzel, relativ), 'utf8')
      for (const muster of VERBOTEN) {
        assert.equal(muster.test(text), false, `${relativ} trifft ${muster}`)
      }
    }
  })
})
