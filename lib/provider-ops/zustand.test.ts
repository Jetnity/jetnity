import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { providerOpsFlagAn, providerOpsIstProduction, providerOpsZustand } from '@/lib/provider-ops'

describe('Provider-Ops Kill-Switch-Form', () => {
  test('Production bleibt hart aus', () => {
    const zustand = providerOpsZustand({
      vercelEnv: 'production',
      flag: 'true',
      zugangVorhanden: true,
    })
    assert.deepEqual(zustand, { aktiv: false, grund: 'production' })
    assert.equal(providerOpsIstProduction('production'), true)
  })

  test('ohne Flag bleibt die Suche aus', () => {
    const zustand = providerOpsZustand({
      flag: undefined,
      zugangVorhanden: true,
    })
    assert.deepEqual(zustand, { aktiv: false, grund: 'abgeschaltet' })
    assert.equal(providerOpsFlagAn('true'), true)
    assert.equal(providerOpsFlagAn('1'), true)
    assert.equal(providerOpsFlagAn('false'), false)
  })

  test('fehlender Zugang ist unavailable, kein Buildfehler', () => {
    const zustand = providerOpsZustand({
      flag: 'true',
      zugangVorhanden: false,
    })
    assert.deepEqual(zustand, { aktiv: false, grund: 'ohne-zugang' })
  })

  test('Preview darf einschalten, wenn Flag und Zugang da sind', () => {
    assert.deepEqual(
      providerOpsZustand({
        vercelEnv: 'preview',
        flag: 'true',
        zugangVorhanden: true,
      }),
      { aktiv: true, umgebung: 'test' },
    )
  })
})
