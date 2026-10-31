import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { vendorScriptMayExecute, createWidgetConsentState } from '@/lib/privacy/widget-consent/entscheidung'
import { CMP_OPTIONAL_CATEGORIES } from '@/lib/privacy/privacybee-cmp/vertrag'
import { decideBundle, productionPolicy, type ReviewedPolicy } from '@/lib/privacy/privacybee-cmp/bundle'
import {
  acceptPending,
  createController,
  dispatchChoice,
  ingestApi,
  productionStart,
  selectProvider,
  startLocalContext,
} from '@/lib/privacy/privacybee-cmp/steuerung'

const POLICY: ReviewedPolicy = Object.freeze({
  id: 's2-test-policy',
  requiredOptional: Object.freeze([...CMP_OPTIONAL_CATEGORIES]),
})

function werte(analytics: boolean) {
  return {
    SECURITY_STORAGE: true,
    FUNCTIONALITY_STORAGE: true,
    ANALYTICS_STORAGE: analytics,
    AD_STORAGE: true,
    AD_USER_DATA: true,
    AD_PERSONALIZATION: true,
    PERSONALIZATION_STORAGE: true,
  }
}

function api(analytics = true, explicit = true) {
  const consents = werte(analytics)
  return {
    getAllConsents: () => consents,
    getConsent: (category: string) => consents[category as keyof typeof consents],
    hasExplicitConsent: () => explicit,
  }
}

describe('cmp entscheidung und steuerung', () => {
  test('Produktionspolitik bleibt null und verweigert trotz enabled', () => {
    assert.equal(productionPolicy('discovercars'), null)
    const entscheidung = decideBundle({
      policy: null,
      providerId: 'discovercars',
      intent: 'selected',
      generation: 1,
      expectedGeneration: 1,
      consents: werte(true),
      snapshotUsable: true,
      hostname: 'jetnity.com',
    })
    assert.equal(entscheidung.localContext, false)
    assert.equal(entscheidung.productionExecute, false)
    assert.equal(entscheidung.reason, 'production_policy_unreviewed')
    assert.equal(vendorScriptMayExecute(createWidgetConsentState('discovercars', 'scope-alpha'), { enabled: true }), false)
  })

  test('dieselbe Funktion lehnt leere, nur-notwendige und widersprüchliche Karten ab', () => {
    const basis = {
      providerId: 'discovercars' as const,
      intent: 'selected' as const,
      generation: 1,
      expectedGeneration: 1,
      snapshotUsable: true,
      hostname: 'jetnity.com',
    }
    assert.equal(decideBundle({ ...basis, policy: { id: 'leer', requiredOptional: [] }, consents: werte(true) }).reason, 'empty_required_categories')
    assert.equal(decideBundle({
      ...basis,
      policy: { id: 'pflicht', requiredOptional: ['SECURITY_STORAGE'] },
      consents: werte(true),
    }).reason, 'necessary_only_policy')
    assert.equal(decideBundle({
      ...basis,
      policy: POLICY,
      consents: werte(false),
    }).reason, 'optional_category_refused')
    assert.equal(decideBundle({
      ...basis,
      policy: POLICY,
      consents: werte(true),
      hostname: '127.0.0.1',
    }).reason, 'host_unlicensed')
  })

  test('Testpolitik erlaubt nur mit Absicht, Snapshot und Host; informative Zustimmung startet nichts', () => {
    let state = ingestApi(createController(), api(true, true))
    const erlaubt = decideBundle({
      policy: POLICY,
      providerId: 'discovercars',
      intent: 'selected',
      generation: state.slots.discovercars.consent.generation,
      expectedGeneration: state.slots.discovercars.consent.generation,
      consents: state.read.status === 'explicit' ? state.read.consents : null,
      snapshotUsable: true,
      hostname: 'jetnity.com',
    })
    assert.equal(erlaubt.localContext, true)
    assert.equal(erlaubt.productionExecute, false)

    const generation = state.slots.discovercars.consent.generation
    state = dispatchChoice(state, 'discovercars', { type: 'grant_informative', generation })
    assert.equal(state.slots.discovercars.consent.informative, 'granted')
    assert.equal(state.slots.discovercars.intent, 'none')
    assert.equal(state.live, null)
    const ohneAbsicht = startLocalContext(state, 'discovercars', POLICY, api(), 'jetnity.com')
    assert.equal(ohneAbsicht.created, false)

    state = selectProvider(state, 'discovercars')
    const gestartet = startLocalContext(state, 'discovercars', POLICY, api(), 'jetnity.com')
    assert.equal(gestartet.created, true)
    assert.equal(gestartet.state.live?.providerId, 'discovercars')
    const pending = { providerId: 'discovercars' as const, generation: gestartet.state.live!.generation }
    assert.equal(acceptPending(gestartet.state, pending), true)

    const prod = productionStart(gestartet.state, 'twelvego', api(), 'jetnity.com')
    assert.equal(prod.created, false)
    assert.equal(prod.decision.reason, 'production_policy_unreviewed')
  })

  test('Kategorieverlust, Entzug und veraltete Arbeit entfernen den Rahmen', () => {
    let state = selectProvider(ingestApi(createController(), api()), 'discovercars')
    state = startLocalContext(state, 'discovercars', POLICY, api(), 'jetnity.com').state
    const pending = { providerId: 'discovercars' as const, generation: state.live!.generation }
    const verloren = ingestApi(state, api(false, true))
    assert.equal(verloren.phase, 'ready')
    assert.equal(verloren.revision > state.revision, true)
    assert.equal(verloren.live, null)
    assert.equal(acceptPending(verloren, pending), false)

    let neu = selectProvider(ingestApi(createController(), api()), 'discovercars')
    neu = startLocalContext(neu, 'discovercars', POLICY, api(), 'jetnity.com').state
    const alt = neu.live!.generation
    neu = dispatchChoice(neu, 'discovercars', { type: 'withdraw', generation: neu.slots.discovercars.consent.generation })
    assert.equal(neu.live, null)
    assert.equal(neu.slots.discovercars.intent, 'withdrawn')
    const wieder = startLocalContext(neu, 'discovercars', POLICY, api(), 'jetnity.com')
    assert.equal(wieder.created, false)
    neu = selectProvider(neu, 'discovercars')
    const frisch = startLocalContext(neu, 'discovercars', POLICY, api(), 'jetnity.com')
    assert.equal(frisch.created, true)
    assert.notEqual(frisch.state.live?.generation, alt)

    const scope = dispatchChoice(frisch.state, 'discovercars', {
      type: 'reset_context',
      generation: frisch.state.slots.discovercars.consent.generation,
      reason: 'reorder',
    })
    assert.equal(scope.live, null)
  })
})
