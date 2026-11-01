import assert from 'node:assert/strict'
import { test } from 'node:test'
import { activityWidgetErlaubt } from '@/lib/activities/widget-datenschutz'
import { readCmpApi } from '@/lib/privacy/privacybee-cmp/schnappschuss'

function snapshot(analytics: boolean, explicit = true) {
  const consents: Record<string, boolean> = {
    SECURITY_STORAGE: true, FUNCTIONALITY_STORAGE: true, ANALYTICS_STORAGE: analytics,
    AD_STORAGE: true, AD_USER_DATA: true, AD_PERSONALIZATION: true, PERSONALIZATION_STORAGE: true,
  }
  return readCmpApi({ getConsent: (name: string) => consents[name], getAllConsents: () => consents, hasExplicitConsent: () => explicit })
}
test('activity rollout displays without a CMP only until one is required or observed', () => {
  const read = readCmpApi(undefined)
  assert.equal(activityWidgetErlaubt({ read, cmpErforderlich: false }), true)
  assert.equal(activityWidgetErlaubt({ read, cmpErforderlich: true }), false)
})
test('refusal, withdrawal, pending and broken reads cannot be turned into agreement', () => {
  for (const cmpErforderlich of [false, true]) {
    assert.equal(activityWidgetErlaubt({ read: snapshot(true), cmpErforderlich }), true)
    assert.equal(activityWidgetErlaubt({ read: snapshot(false), cmpErforderlich }), false)
    assert.equal(activityWidgetErlaubt({ read: snapshot(true, false), cmpErforderlich }), false)
    assert.equal(activityWidgetErlaubt({ read: { status: 'unusable', reason: 'inconsistent_read' }, cmpErforderlich }), false)
  }
})
