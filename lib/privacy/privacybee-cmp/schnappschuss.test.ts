import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { CMP_CATEGORIES, type CmpCategory } from '@/lib/privacy/privacybee-cmp/vertrag'
import { readCmpApi, readyCategoriesAreInventory } from '@/lib/privacy/privacybee-cmp/schnappschuss'

function basis(extra: Partial<Record<CmpCategory, boolean>> = {}) {
  return {
    SECURITY_STORAGE: true,
    FUNCTIONALITY_STORAGE: true,
    ANALYTICS_STORAGE: false,
    AD_STORAGE: false,
    AD_USER_DATA: false,
    AD_PERSONALIZATION: false,
    PERSONALIZATION_STORAGE: false,
    ...extra,
  }
}

function api(input: {
  consents?: Record<string, unknown>
  explicit?: unknown
  consent?: (category: string) => unknown
  throwAll?: boolean
}) {
  const consents: Record<string, unknown> = input.consents ?? basis()
  return {
    getAllConsents: () => {
      if (input.throwAll) throw new Error('kaputt')
      return consents
    },
    getConsent: (category: string) => (input.consent ? input.consent(category) : consents[category]),
    hasExplicitConsent: () => input.explicit ?? true,
  }
}

function grund(read: ReturnType<typeof readCmpApi>): string {
  return read.status === 'unusable' ? read.reason : read.status
}

describe('cmp schnappschuss', () => {
  test('sieben Kategorien, abgelehnte optionale Zwecke, explizite Entscheidung', () => {
    const read = readCmpApi(api({}))
    assert.equal(read.status, 'explicit')
    if (read.status !== 'explicit') return
    assert.equal(read.optionalSatisfied, false)
    assert.equal(read.consents.SECURITY_STORAGE, true)
    assert.equal(read.consents.ANALYTICS_STORAGE, false)
    assert.equal(read.consents.AD_STORAGE, false)
  })

  test('alle optionalen Kategorien wahr ist ein vollständiges Bündel, ready-Liste ist kein Grant', () => {
    const read = readCmpApi(api({
      consents: basis({
        ANALYTICS_STORAGE: true,
        AD_STORAGE: true,
        AD_USER_DATA: true,
        AD_PERSONALIZATION: true,
        PERSONALIZATION_STORAGE: true,
      }),
    }))
    assert.equal(read.status, 'explicit')
    if (read.status === 'explicit') assert.equal(read.optionalSatisfied, true)
    assert.equal(readyCategoriesAreInventory({ categories: [...CMP_CATEGORIES], hasExplicitConsent: false }), true)
    assert.equal(readyCategoriesAreInventory({ categories: [true] }), false)
  })

  test('ohne explizite Entscheidung bleiben wahre Werte kein Grant', () => {
    const read = readCmpApi(api({
      explicit: false,
      consents: basis({
        ANALYTICS_STORAGE: true,
        AD_STORAGE: true,
        AD_USER_DATA: true,
        AD_PERSONALIZATION: true,
        PERSONALIZATION_STORAGE: true,
      }),
    }))
    assert.deepEqual(read, { status: 'unusable', reason: 'no_explicit_consent' })
  })

  test('unbekannte, fehlende, nicht-boolesche und widersprüchliche Werte', () => {
    assert.equal(grund(readCmpApi(null)), 'missing_api')
    assert.equal(grund(readCmpApi(api({ throwAll: true }))), 'malformed')
    assert.equal(grund(readCmpApi(api({ consents: { ...basis(), NEU: true } }))), 'unknown_category')
    const missing: Record<string, unknown> = { ...basis() }
    delete missing.ANALYTICS_STORAGE
    assert.equal(grund(readCmpApi(api({ consents: missing }))), 'missing_category')
    assert.equal(grund(readCmpApi(api({ consents: { ...basis(), ANALYTICS_STORAGE: 'true' } }))), 'non_boolean')
    assert.equal(grund(readCmpApi(api({ consent: () => false }))), 'inconsistent_read')
    assert.equal(grund(readCmpApi(api({ consents: basis({ SECURITY_STORAGE: false }) }))), 'inconsistent_necessary')
  })
})
