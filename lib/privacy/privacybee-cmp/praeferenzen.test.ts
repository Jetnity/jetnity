import { readFileSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { PrivacyBeeCmpPreferences } from '@/components/privacy/PrivacyBeeCmpPreferences'
import { TWELVEGO_PRODUCTION_DISCLOSURE } from '@/lib/privacy/privacybee-cmp/offenlegung'
import { PRODUCTION_POLICY_TABLE } from '@/lib/privacy/privacybee-cmp/produktionspolitik'
import { CMP_PREFERENCES_CLASS, CMP_RELEASE_AUTHORIZED } from '@/lib/privacy/privacybee-cmp/vertrag'
import { WIDGET_CONSENT_PROVIDERS } from '@/lib/privacy/widget-consent/vertrag'

describe('cmp praeferenzen und offenlegung', () => {
  test('ohne gebackenes Gate bleibt die gelieferte Schaltfläche unsichtbar', () => {
    assert.equal(CMP_RELEASE_AUTHORIZED, true)
    const html = renderToStaticMarkup(createElement(PrivacyBeeCmpPreferences, { appearance: 'footer' }))
    assert.equal(html.includes(CMP_PREFERENCES_CLASS), false)
    assert.equal(html.includes('Datenschutz-Einstellungen'), false)
    const quelle = readFileSync('components/privacy/PrivacyBeeCmpPreferences.tsx', 'utf8')
    assert.equal(quelle.includes('harnessRelease'), false)
    assert.equal(quelle.includes('onClick'), false)
    assert.equal(quelle.includes('setAllConsents'), false)
    assert.equal(quelle.includes('acceptAll'), false)
    const fuss = readFileSync('components/layout/Footer.tsx', 'utf8')
    assert.match(fuss, /<PrivacyBeeCmpPreferences appearance="footer" \/>/)
  })

  test('die 12Go-Offenlegung ist eingefroren und folgt der ausgewählten Revision', () => {
    const notice = TWELVEGO_PRODUCTION_DISCLOSURE
    assert.equal(Object.isFrozen(notice), true)
    assert.equal(Object.isFrozen(notice.paragraphs), true)
    assert.equal(Object.isFrozen(notice.recipients), true)
    assert.equal(notice.providerId, 'twelvego')
    assert.equal(notice.disclosureRevision, 'twelvego-general-disclosure-v1')
    assert.equal(notice.disclosureRevision, PRODUCTION_POLICY_TABLE.twelvego.disclosureRevision)
    assert.equal(notice.label, '12Go')
    assert.equal(notice.privacyHref, WIDGET_CONSENT_PROVIDERS.twelvego.privacyHref)
    assert.equal(notice.privacyLinkLabel, WIDGET_CONSENT_PROVIDERS.twelvego.privacyLinkLabel)
    assert.deepEqual(notice.recipients, [
      '12go.asia',
      'cdn0.trainbusferry.com',
      'agent.12go.asia',
      'ajax.googleapis.com',
    ])
    const text = notice.paragraphs.join(' ')
    assert.equal(text.includes('twelvego-general-chf'), false)
    assert.equal(text.includes('f056b01d'), false)
    assert.match(text, /12go\.asia/)
    assert.match(text, /Bangkok-Referenz/)
    assert.match(text, /manuelle Planung/)
  })
})