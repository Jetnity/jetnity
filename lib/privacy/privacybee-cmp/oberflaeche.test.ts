import { readFileSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { PrivacyBeeCmpBoundary } from '@/components/privacy/PrivacyBeeCmpBoundary'
import { PrivacyBeeCmpClient } from '@/components/privacy/PrivacyBeeCmpClient'
import { PrivacyBeeCmpFrameSlot } from '@/components/privacy/PrivacyBeeCmpFrameSlot'
import { WidgetConsentChoice } from '@/components/privacy/WidgetConsentChoice'
import { readCmpController, serverCmpSnapshot } from '@/lib/privacy/privacybee-cmp/abo'
import { createWidgetConsentState } from '@/lib/privacy/widget-consent/entscheidung'
import { CMP_PREFERENCES_CLASS } from '@/lib/privacy/privacybee-cmp/vertrag'

describe('cmp oberflaeche', () => {
  test('Grenze und Präferenzen bleiben ohne Bereitschaft unsichtbar', () => {
    assert.equal(renderToStaticMarkup(createElement(PrivacyBeeCmpBoundary)), '')
    const state = createWidgetConsentState('discovercars', 'scope-alpha')
    const html = renderToStaticMarkup(createElement(WidgetConsentChoice, { state, onCommand: () => undefined }))
    assert.equal(html.includes(CMP_PREFERENCES_CLASS), false)
    assert.equal(html.includes('data-cmp-preferences'), false)
  })

  test('eine Testfreigabe mountet den echten Client, der Server-Snapshot bleibt stabil', () => {
    assert.equal(serverCmpSnapshot(), serverCmpSnapshot())
    assert.equal(readCmpController().phase, 'missing')
    const html = renderToStaticMarkup(createElement(PrivacyBeeCmpBoundary, {
      harnessRelease: { purpose: 's2-test-release' },
    }))
    assert.match(html, /data-cmp-client="1"/)
    assert.match(html, /data-cmp-phase="missing"/)
    const client = readFileSync('components/privacy/PrivacyBeeCmpClient.tsx', 'utf8')
    assert.match(client, /useSyncExternalStore\(subscribeCmpController, readCmpController, serverCmpSnapshot\)/)
    assert.match(client, /export \{ readCmpController, subscribeCmpController \}/)
    const boundary = readFileSync('components/privacy/PrivacyBeeCmpBoundary.tsx', 'utf8')
    assert.equal(boundary.includes('hostname'), false)
    assert.equal(boundary.includes('cmpProductionBannerAllowed'), false)
    assert.equal(renderToStaticMarkup(createElement(PrivacyBeeCmpClient)).includes('data-cmp-client'), true)
  })

  test('bereite Präferenzen sind eine echte Schaltfläche, der Rahmen ist ein isolierter Canary', () => {
    const state = createWidgetConsentState('twelvego', 'scope-alpha')
    const html = renderToStaticMarkup(createElement(WidgetConsentChoice, {
      state,
      onCommand: () => undefined,
      cmpPreferences: 'ready',
    }))
    assert.match(html, new RegExp(`class="[^"]*${CMP_PREFERENCES_CLASS}`))
    assert.match(html, /Datenschutz-Einstellungen/)
    const rahmen = renderToStaticMarkup(createElement(PrivacyBeeCmpFrameSlot, {
      live: {
        providerId: 'discovercars',
        generation: 2,
        epoch: 4,
        scopeKey: 'scope-alpha',
        policyId: 'surface-test',
        requiredOptional: ['ANALYTICS_STORAGE'],
      },
    }))
    assert.match(rahmen, /data-synthetic-frame="1"/)
    assert.match(rahmen, /<iframe/)
    assert.match(rahmen, /sandbox="allow-scripts"/)
    assert.match(rahmen, /parent\.postMessage/)
    assert.match(rahmen, /jetnityCanary/)
    assert.equal(rahmen.includes('discovercars.com'), false)
    assert.equal(rahmen.includes('privacybee'), false)
    assert.equal(rahmen.includes('src="http'), false)
    assert.equal(renderToStaticMarkup(createElement(PrivacyBeeCmpFrameSlot, { live: null })), '')
  })

  test('Layout nutzt nur den Produktions-Bootstrap', () => {
    const layout = readFileSync('app/layout.tsx', 'utf8')
    assert.match(layout, /productionBootstrapSource/)
    assert.match(layout, /PrivacyBeeCmpBoundary/)
    assert.equal(layout.includes('buildBootstrapSource(true)'), false)
    assert.equal(layout.includes('cookie-banner.js'), false)
    assert.equal(layout.includes('harnessRelease'), false)
    assert.equal(layout.includes('s2-test-release'), false)
    assert.equal(layout.includes('headers('), false)
  })
})
