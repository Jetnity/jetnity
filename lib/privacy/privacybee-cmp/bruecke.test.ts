import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { attachCmpBridge, phaseFromRead } from '@/lib/privacy/privacybee-cmp/bruecke'
import { productionBootstrapSource, buildBootstrapSource } from '@/lib/privacy/privacybee-cmp/bootstrap'
import { CMP_BANNER_SRC, CMP_WEBSITE_ID } from '@/lib/privacy/privacybee-cmp/vertrag'

function ziel() {
  const emitter = new EventTarget()
  return {
    emitter,
    addEventListener: (type: string, listener: (event: Event) => void) => emitter.addEventListener(type, listener),
    removeEventListener: (type: string, listener: (event: Event) => void) => emitter.removeEventListener(type, listener),
  }
}

function api(explicit: boolean) {
  const consents = {
    SECURITY_STORAGE: true,
    FUNCTIONALITY_STORAGE: true,
    ANALYTICS_STORAGE: true,
    AD_STORAGE: true,
    AD_USER_DATA: true,
    AD_PERSONALIZATION: true,
    PERSONALIZATION_STORAGE: true,
  }
  return {
    getAllConsents: () => consents,
    getConsent: (category: string) => consents[category as keyof typeof consents],
    hasExplicitConsent: () => explicit,
  }
}

describe('cmp bruecke und bootstrap', () => {
  test('bereits bereite API wird gelesen, bevor ein Event kommt', () => {
    const doc = ziel()
    const bridge = attachCmpBridge(doc, () => api(true))
    assert.equal(bridge.phase(), 'ready')
    assert.equal(phaseFromRead({ status: 'unusable', reason: 'missing_api' }, false), 'missing')
    bridge.stop()
    doc.emitter.dispatchEvent(new CustomEvent('privacybee:consent-changed'))
    assert.equal(bridge.phase(), 'ready')
  })

  test('spaetes ready, fehlende API und Wurf', () => {
    const doc = ziel()
    let current: unknown = undefined
    const bridge = attachCmpBridge(doc, () => current)
    assert.equal(bridge.phase(), 'missing')
    current = api(false)
    doc.emitter.dispatchEvent(new CustomEvent('privacybee:ready', { detail: { categories: ['ANALYTICS_STORAGE'], hasExplicitConsent: true } }))
    assert.equal(bridge.phase(), 'denied')
    current = api(true)
    doc.emitter.dispatchEvent(new CustomEvent('privacybee:consent-changed', { detail: { explicitConsent: false, consents: { ANALYTICS_STORAGE: true } } }))
    assert.equal(bridge.phase(), 'ready')
    current = { getAllConsents: () => { throw new Error('x') }, getConsent: () => true, hasExplicitConsent: () => true }
    bridge.notify()
    assert.equal(bridge.phase(), 'error')
  })

  test('Produktions-Bootstrap ist wahr und ruft keine Schreib-API', () => {
    const text = productionBootstrapSource(null)
    assert.equal(text.includes('root.booted'), true)
    assert.equal(text.includes('true!==true'), true)
    assert.equal(text.includes('false===true'), true)
    assert.equal(text.indexOf('addEventListener') < text.indexOf('createElement'), true)
    assert.equal(text.includes('acceptAll'), false)
    assert.equal(text.includes('setAllConsents'), false)
    assert.equal(text.includes('localStorage'), false)
    assert.equal(text.includes('document.cookie'), false)
    assert.equal(text.includes(CMP_BANNER_SRC), true)
    assert.equal(text.includes(CMP_WEBSITE_ID), true)
    assert.equal(text.includes('website-id'), true)
    const offen = buildBootstrapSource({ release: true, killDenied: false })
    assert.equal(offen.includes('true!==true'), true)
    assert.equal(offen.includes('acceptAll'), false)
  })
})
