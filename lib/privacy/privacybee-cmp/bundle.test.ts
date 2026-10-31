import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { vendorScriptMayExecute, createWidgetConsentState } from '@/lib/privacy/widget-consent/entscheidung'
import {
  SYNTHETIC_BUNDLE_POLICY,
  SYNTHETIC_BUNDLE_POLICY_ID,
  classifyUnreviewedPolicy,
  decideProductionProvider,
  decideSyntheticBundle,
} from '@/lib/privacy/privacybee-cmp/bundle'
import { readCmpApi } from '@/lib/privacy/privacybee-cmp/schnappschuss'
import { emptyFrameBook, invalidateFrame, staleFrameSignal, tryStartFrame } from '@/lib/privacy/privacybee-cmp/rahmen'

function voll(explicit = true) {
  return readCmpApi({
    getAllConsents: () => ({
      SECURITY_STORAGE: true,
      FUNCTIONALITY_STORAGE: true,
      ANALYTICS_STORAGE: true,
      AD_STORAGE: true,
      AD_USER_DATA: true,
      AD_PERSONALIZATION: true,
      PERSONALIZATION_STORAGE: true,
    }),
    getConsent: (category: string) => category === 'ANALYTICS_STORAGE' || true,
    hasExplicitConsent: () => explicit,
  })
}

describe('cmp bundle und rahmen', () => {
  test('Produktion bleibt verweigert, auch mit enabled und vollständigem CMP', () => {
    const entscheidung = decideProductionProvider('discovercars', { enabled: true })
    assert.equal(entscheidung.execute, false)
    assert.equal(entscheidung.productionExecute, false)
    assert.equal(entscheidung.reason, 'production_policy_unreviewed')
    assert.equal(decideProductionProvider('twelvego').execute, false)
    const state = createWidgetConsentState('discovercars', 'scope-alpha')
    assert.equal(vendorScriptMayExecute(state, { enabled: true }), false)
  })

  test('leere, nur-notwendige und nachgebaute Politik verweigern', () => {
    assert.equal(classifyUnreviewedPolicy({ requiredOptional: [] }), 'empty_required_categories')
    assert.equal(
      classifyUnreviewedPolicy({ requiredOptional: ['SECURITY_STORAGE', 'FUNCTIONALITY_STORAGE'] }),
      'necessary_only_policy',
    )
    const lookalike = { ...SYNTHETIC_BUNDLE_POLICY }
    const denied = decideSyntheticBundle({
      policy: lookalike,
      providerId: 'discovercars',
      intent: 'selected',
      generation: 1,
      expectedGeneration: 1,
      cmp: voll(),
    })
    assert.equal(denied.execute, false)
    assert.equal(denied.reason, 'unknown_policy')
  })

  test('synthetisches Bündel braucht aktuelle Absicht, Generation und alle optionalen Kategorien', () => {
    const cmp = voll()
    const erlaubt = decideSyntheticBundle({
      policy: SYNTHETIC_BUNDLE_POLICY,
      providerId: 'discovercars',
      intent: 'selected',
      generation: 1,
      expectedGeneration: 1,
      cmp,
    })
    assert.equal(erlaubt.execute, true)
    assert.equal(erlaubt.productionExecute, false)
    assert.equal(erlaubt.reason, 'synthetic_bundle_allowed')
    assert.equal(SYNTHETIC_BUNDLE_POLICY.id, SYNTHETIC_BUNDLE_POLICY_ID)

    assert.equal(decideSyntheticBundle({
      policy: SYNTHETIC_BUNDLE_POLICY,
      providerId: 'twelvego',
      intent: 'none',
      generation: 1,
      expectedGeneration: 1,
      cmp,
    }).reason, 'no_provider_intent')
    assert.equal(decideSyntheticBundle({
      policy: SYNTHETIC_BUNDLE_POLICY,
      providerId: 'discovercars',
      intent: 'withdrawn',
      generation: 1,
      expectedGeneration: 1,
      cmp,
    }).reason, 'provider_withdrawn')
    assert.equal(decideSyntheticBundle({
      policy: SYNTHETIC_BUNDLE_POLICY,
      providerId: 'discovercars',
      intent: 'selected',
      generation: 1,
      expectedGeneration: 2,
      cmp,
    }).reason, 'stale_generation')
    assert.equal(decideSyntheticBundle({
      policy: SYNTHETIC_BUNDLE_POLICY,
      providerId: 'discovercars',
      intent: 'selected',
      generation: 1,
      expectedGeneration: 1,
      cmp: voll(false),
    }).reason, 'cmp_snapshot_unusable')

    const teilweise = readCmpApi({
      getAllConsents: () => ({
        SECURITY_STORAGE: true,
        FUNCTIONALITY_STORAGE: true,
        ANALYTICS_STORAGE: false,
        AD_STORAGE: true,
        AD_USER_DATA: true,
        AD_PERSONALIZATION: true,
        PERSONALIZATION_STORAGE: true,
      }),
      getConsent: (category: string) => {
        const map: Record<string, boolean> = {
          SECURITY_STORAGE: true,
          FUNCTIONALITY_STORAGE: true,
          ANALYTICS_STORAGE: false,
          AD_STORAGE: true,
          AD_USER_DATA: true,
          AD_PERSONALIZATION: true,
          PERSONALIZATION_STORAGE: true,
        }
        return map[category]
      },
      hasExplicitConsent: () => true,
    })
    assert.equal(decideSyntheticBundle({
      policy: SYNTHETIC_BUNDLE_POLICY,
      providerId: 'discovercars',
      intent: 'selected',
      generation: 1,
      expectedGeneration: 1,
      cmp: teilweise,
    }).reason, 'optional_category_refused')
  })

  test('ein Rahmen, Entzug, veraltetes Signal und kein stilles Wiederbeleben', () => {
    let book = emptyFrameBook()
    const first = tryStartFrame(book, { allowed: true, providerId: 'discovercars', generation: 1 })
    assert.equal(first.created, true)
    book = first.book
    const repeat = tryStartFrame(book, { allowed: true, providerId: 'discovercars', generation: 1 })
    assert.equal(repeat.created, false)
    assert.equal(book.live?.providerId, 'discovercars')
    book = invalidateFrame(book)
    assert.equal(book.live, null)
    assert.equal(book.generation, 2)
    const stale = tryStartFrame(book, { allowed: true, providerId: 'discovercars', generation: 1 })
    assert.equal(stale.created, false)
    assert.equal(staleFrameSignal(book, 1).resurrected, false)
    assert.equal(book.live, null)
    const denied = tryStartFrame(book, { allowed: false, providerId: 'twelvego', generation: 2 })
    assert.equal(denied.created, false)
    const next = tryStartFrame(book, { allowed: true, providerId: 'twelvego', generation: 2 })
    assert.equal(next.created, true)
    assert.equal(next.book.live?.providerId, 'twelvego')
  })
})
