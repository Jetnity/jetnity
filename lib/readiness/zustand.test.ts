import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { requirementsProviderAus, type RequirementsAnfrage, type RequirementsProvider } from '@/lib/readiness/provider'
import { readinessZustand, requirementsProviderNachZustand } from '@/lib/readiness/zustand'

const testProvider: RequirementsProvider = {
  name: 'test-double',
  async evaluate(_anfrage: RequirementsAnfrage, _signal: AbortSignal) {
    return []
  },
}

describe('Readiness-Domain-Kill-Switch', () => {
  test('Production bleibt hart aus, auch mit Flag und Provider', () => {
    const zustand = readinessZustand(
      { VERCEL_ENV: 'production', JETNITY_READINESS_AKTIV: 'true' },
      true,
    )
    assert.deepEqual(zustand, { aktiv: false, grund: 'production' })
    assert.equal(
      requirementsProviderNachZustand(testProvider, {
        VERCEL_ENV: 'production',
        JETNITY_READINESS_AKTIV: 'true',
      }),
      null,
    )
  })

  test('ohne Flag bleibt die Domain aus', () => {
    const zustand = readinessZustand({}, true)
    assert.deepEqual(zustand, { aktiv: false, grund: 'abgeschaltet' })
    assert.equal(requirementsProviderNachZustand(testProvider, {}), null)
  })

  test('Flag an ohne Provider bleibt ohne Zugang', () => {
    const zustand = readinessZustand({ VERCEL_ENV: 'preview', JETNITY_READINESS_AKTIV: 'true' }, false)
    assert.deepEqual(zustand, { aktiv: false, grund: 'ohne-zugang' })
    assert.equal(
      requirementsProviderNachZustand(null, {
        VERCEL_ENV: 'preview',
        JETNITY_READINESS_AKTIV: 'true',
      }),
      null,
    )
  })

  test('nur Test/Preview + Flag an + Provider ist technisch aktivierbar', () => {
    const zustand = readinessZustand({ VERCEL_ENV: 'preview', JETNITY_READINESS_AKTIV: '1' }, true)
    assert.deepEqual(zustand, { aktiv: true, umgebung: 'test' })
    assert.equal(
      requirementsProviderNachZustand(testProvider, {
        VERCEL_ENV: 'preview',
        JETNITY_READINESS_AKTIV: 'true',
      }),
      testProvider,
    )
  })

  test('Factory bleibt null, auch wenn der Kill-Switch technisch aktivierbar wäre', () => {
    assert.equal(requirementsProviderAus(), null)
    assert.equal(
      requirementsProviderNachZustand(requirementsProviderAus(), {
        VERCEL_ENV: 'preview',
        JETNITY_READINESS_AKTIV: 'true',
      }),
      null,
    )
  })
})
