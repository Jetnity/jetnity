import assert from 'node:assert/strict'
import { test } from 'node:test'
import { weatherProviderConfigured } from './provider-config'

test('missing and deliberately inert Dev provider credentials cannot activate the weather UI or reserve quota', () => {
  assert.equal(weatherProviderConfigured(undefined), false)
  assert.equal(weatherProviderConfigured(''), false)
  assert.equal(weatherProviderConfigured('  '), false)
  assert.equal(weatherProviderConfigured('intentionally-invalid-dev-only-no-weather-api'), false)
  assert.equal(weatherProviderConfigured('intentionally-invalid-another-value'), false)
  assert.equal(weatherProviderConfigured('existing-reviewed-provider-key-reference'), true)
})
