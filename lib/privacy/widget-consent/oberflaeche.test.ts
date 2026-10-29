import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { WidgetConsentChoice } from '@/components/privacy/WidgetConsentChoice'
import {
  applyWidgetConsentCommand,
  commandForAction,
  createWidgetConsentState,
} from '@/lib/privacy/widget-consent/entscheidung'
import { WIDGET_CONSENT_PROVIDERS } from '@/lib/privacy/widget-consent/vertrag'

function markup(provider: 'discovercars' | 'twelvego', art: 'open' | 'granted' | 'closed') {
  let state = createWidgetConsentState(provider, 'scope-alpha')
  if (art === 'granted') {
    const zu = applyWidgetConsentCommand(state, commandForAction(state, 'grant_informative'))
    state = applyWidgetConsentCommand(zu.state, commandForAction(zu.state, 'reopen')).state
  }
  if (art === 'closed') {
    state = applyWidgetConsentCommand(state, commandForAction(state, 'close')).state
  }
  return renderToStaticMarkup(createElement(WidgetConsentChoice, { state, onCommand: () => undefined }))
}

describe('widget consent oberflaeche', () => {
  test('offene Auswahl zeigt gleiche Aktionen und keinen Zweck-Schalter', () => {
    for (const id of ['discovercars', 'twelvego'] as const) {
      const html = markup(id, 'open')
      const faktum = WIDGET_CONSENT_PROVIDERS[id]
      assert.match(html, new RegExp(`data-provider="${id}"`))
      assert.match(html, /data-panel="open"/)
      assert.match(html, /data-informative="not_decided"/)
      assert.match(html, /data-purpose-controls="locked"/)
      assert.match(html, /data-effective-vendor-execution="denied"/)
      assert.match(html, /Wirksame Anbieter-Ausführung: aus\./)
      assert.equal(html.includes('type="checkbox"'), false)
      assert.equal(html.includes('<iframe'), false)
      assert.equal(html.includes('<script'), false)
      assert.match(html, /Ablehnen/)
      assert.match(html, /Zustimmen/)
      const knoepfe = html.match(/<button\b[^>]*>/g) ?? []
      const klasseVon = (aktion: string) => {
        const knopf = knoepfe.find((tag) => tag.includes(`data-widget-consent-action="${aktion}"`))
        return knopf?.match(/class="([^"]*)"/)?.[1] ?? ''
      }
      const ablehnen = klasseVon('refuse')
      const zustimmen = klasseVon('grant_informative')
      assert.equal(ablehnen.length > 0, true)
      assert.equal(ablehnen, zustimmen)
      assert.match(html, new RegExp(`href="${faktum.privacyHref}"`))
      assert.match(html, /rel="noopener noreferrer"/)
      assert.match(html, /referrerpolicy="no-referrer"/i)
      const adressen = [...html.matchAll(/https:\/\/[^"'\s]+/g)].map((treffer) => treffer[0])
      assert.deepEqual(adressen, [faktum.privacyHref])
    }
  })

  test('informative Zustimmung bleibt in der Fläche als Ausführung aus sichtbar', () => {
    const html = markup('discovercars', 'granted')
    assert.match(html, /data-informative="granted"/)
    assert.match(html, /data-effective-vendor-execution="denied"/)
    assert.match(html, /Entscheidung zurücknehmen/)
    assert.match(html, /Kein Zweck ist freigegeben/)
    assert.match(html, /startet kein Anbieter-Skript/)
    assert.equal(html.includes('widget.js'), false)
    assert.equal(html.includes('googletagmanager.com/gtm'), false)
  })

  test('geschlossene Fläche lässt sich wieder öffnen, ohne einen Ladehinweis', () => {
    const html = markup('twelvego', 'closed')
    assert.match(html, /data-panel="closed"/)
    assert.match(html, /data-informative="not_decided"/)
    assert.match(html, /Auswahl erneut öffnen/)
    assert.equal(html.includes('role="dialog"'), false)
    assert.equal(html.includes('https://'), false)
  })
})
