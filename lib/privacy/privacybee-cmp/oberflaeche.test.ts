import { readFileSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { PrivacyBeeCmpBoundary } from '@/components/privacy/PrivacyBeeCmpBoundary'
import { PrivacyBeeCmpFrameSlot } from '@/components/privacy/PrivacyBeeCmpFrameSlot'
import { WidgetConsentChoice } from '@/components/privacy/WidgetConsentChoice'
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

  test('bereite Präferenzen sind eine echte Schaltfläche, der Rahmen ist kein iframe', () => {
    const state = createWidgetConsentState('twelvego', 'scope-alpha')
    const html = renderToStaticMarkup(createElement(WidgetConsentChoice, {
      state,
      onCommand: () => undefined,
      cmpPreferences: 'ready',
    }))
    assert.match(html, new RegExp(`class="[^"]*${CMP_PREFERENCES_CLASS}`))
    assert.match(html, /Datenschutz-Einstellungen/)
    const rahmen = renderToStaticMarkup(createElement(PrivacyBeeCmpFrameSlot, {
      live: { providerId: 'discovercars', generation: 2, requiredOptional: ['ANALYTICS_STORAGE'] },
    }))
    assert.match(rahmen, /data-synthetic-frame="1"/)
    assert.match(rahmen, /<iframe/)
    assert.match(rahmen, /sandbox=""/)
    assert.equal(rahmen.includes('discovercars.com'), false)
    assert.equal(rahmen.includes('src="http'), false)
    assert.equal(renderToStaticMarkup(createElement(PrivacyBeeCmpFrameSlot, { live: null })), '')
  })

  test('Layout nutzt nur den Produktions-Bootstrap', () => {
    const layout = readFileSync('app/layout.tsx', 'utf8')
    assert.match(layout, /productionBootstrapSource/)
    assert.match(layout, /PrivacyBeeCmpBoundary/)
    assert.equal(layout.includes('buildBootstrapSource(true)'), false)
    assert.equal(layout.includes('cookie-banner.js'), false)
  })
})
