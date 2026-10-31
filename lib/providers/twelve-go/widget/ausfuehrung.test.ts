import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import TwelveGoWidgetRahmen from '@/components/trips/TwelveGoWidgetRahmen'
import { twelveGoWidgetDarfAusfuehren } from '@/lib/providers/twelve-go/widget/ausfuehrung'
import { TWELVE_GO_WIDGET_FREIGABE } from '@/lib/providers/twelve-go/widget/freigabe'
import { TWELVE_GO_HOST_SANDBOX, TWELVE_GO_HOST_SRC } from '@/lib/providers/twelve-go/widget/protokoll'
import {
  TWELVE_GO_WIDGET_RAHMEN_HOEHE_PX,
  TWELVE_GO_WIDGET_SANDBOX,
  twelveGoHostPasst,
  twelveGoWidgetBeobachteteHosts,
  twelveGoWidgetSandboxIstOpaque,
} from '@/lib/providers/twelve-go/widget/rahmen'
import { vendorScriptMayExecute, createWidgetConsentState } from '@/lib/privacy/widget-consent/entscheidung'
import { WIDGET_CONSENT_PROVIDERS } from '@/lib/privacy/widget-consent/vertrag'

describe('12Go-Ausführung bleibt zu', () => {
  test('informativer Grant und enabled öffnen nichts', () => {
    assert.equal(TWELVE_GO_WIDGET_FREIGABE.ausfuehrbar, false)
    assert.equal(TWELVE_GO_WIDGET_FREIGABE.status, 'CONSENT_BLOCKED')
    const zustand = createWidgetConsentState('twelvego', 'twelve-go-widget')
    assert.equal(vendorScriptMayExecute(zustand, { enabled: true }), false)
    assert.equal(twelveGoWidgetDarfAusfuehren(), false)
    assert.equal(twelveGoWidgetDarfAusfuehren({ enabled: true }), false)
    assert.equal(WIDGET_CONSENT_PROVIDERS.twelvego.vendorScriptExecutionAuthorized, false)
    assert.equal(WIDGET_CONSENT_PROVIDERS.twelvego.liveInJetnity, false)
  })

  test('der Rahmen ist undurchsichtig, leer und nicht die Besucherfläche', () => {
    assert.equal(twelveGoWidgetSandboxIstOpaque(TWELVE_GO_WIDGET_SANDBOX), true)
    assert.equal(twelveGoWidgetSandboxIstOpaque('allow-scripts allow-same-origin'), false)
    assert.equal(twelveGoWidgetSandboxIstOpaque('allow-scripts allow-forms'), false)
    assert.equal(TWELVE_GO_WIDGET_RAHMEN_HOEHE_PX >= 800, true)
    assert.deepEqual(twelveGoWidgetBeobachteteHosts(), [
      '12go.asia',
      'cdn0.trainbusferry.com',
      'ajax.googleapis.com',
      'agent.12go.asia',
    ])

    const html = renderToStaticMarkup(createElement(TwelveGoWidgetRahmen, { zweck: 'synthetische-pruefung' }))
    assert.equal(html.includes('sandbox="allow-scripts"'), true)
    assert.equal(html.includes('allow-same-origin'), false)
    assert.equal(html.includes('src='), false)
    assert.equal(html.includes('height:800px'), true)
    assert.equal(html.includes('<script'), false)
    assert.equal(renderToStaticMarkup(createElement(TwelveGoWidgetRahmen, { zweck: 'besucher' })), '')
    assert.equal(twelveGoHostPasst({
      providerId: 'twelvego',
      src: TWELVE_GO_HOST_SRC,
      childOrigin: 'https://jetnity-widgets.vercel.app',
      sandbox: TWELVE_GO_HOST_SANDBOX,
      protocolRevision: 1,
    }), true)
    assert.equal(twelveGoHostPasst({
      providerId: 'twelvego',
      src: 'https://jetnity.com/embed/twelvego',
      childOrigin: 'https://jetnity-widgets.vercel.app',
      sandbox: TWELVE_GO_HOST_SANDBOX,
      protocolRevision: 1,
    }), false)
    assert.equal(twelveGoHostPasst({
      providerId: 'twelvego',
      src: `${TWELVE_GO_HOST_SRC}?z=1`,
      childOrigin: 'https://jetnity-widgets.vercel.app',
      sandbox: TWELVE_GO_HOST_SANDBOX,
      protocolRevision: 1,
    }), false)
    assert.equal(twelveGoHostPasst({
      providerId: 'twelvego',
      src: TWELVE_GO_HOST_SRC,
      childOrigin: 'https://jetnity-widgets.vercel.app',
      sandbox: 'allow-scripts',
      protocolRevision: 1,
    }), false)
    assert.equal(twelveGoHostPasst({
      providerId: 'twelvego',
      src: TWELVE_GO_HOST_SRC,
      childOrigin: 'https://jetnity-widgets.vercel.app',
      sandbox: `${TWELVE_GO_HOST_SANDBOX} allow-top-navigation`,
      protocolRevision: 1,
    }), false)
    assert.equal(twelveGoHostPasst({
      providerId: 'twelvego',
      src: TWELVE_GO_HOST_SRC,
      childOrigin: 'https://jetnity-widgets.vercel.app',
      sandbox: `${TWELVE_GO_HOST_SANDBOX} allow-popups-to-escape-sandbox`,
      protocolRevision: 1,
    }), false)
    assert.equal(twelveGoWidgetDarfAusfuehren(undefined, {
      providerId: 'twelvego',
      src: TWELVE_GO_HOST_SRC,
      childOrigin: 'https://jetnity-widgets.vercel.app',
      sandbox: TWELVE_GO_HOST_SANDBOX,
      protocolRevision: 1,
    }), false)
  })
})
