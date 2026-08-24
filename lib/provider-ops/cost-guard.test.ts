import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { providerOpsInMemoryCostGuard } from '@/lib/provider-ops'

const GRENZEN = {
  fensterMs: 60_000,
  anfragenJeFenster: 2,
  tagMs: 86_400_000,
  anfragenJeTag: 3,
}

describe('Provider-Ops Cost-Guard', () => {
  test('leere Kennung bleibt fail-closed', () => {
    const guard = providerOpsInMemoryCostGuard(GRENZEN)
    assert.deepEqual(guard.erlaubt(''), { ok: false, retryAfterSec: 1 })
    assert.deepEqual(guard.erlaubt('   '), { ok: false, retryAfterSec: 1 })
  })

  test('Fenster lässt die erlaubte Zahl durch und sperrt danach', () => {
    const guard = providerOpsInMemoryCostGuard(GRENZEN)
    let uhr = 1_000_000
    assert.equal(guard.erlaubt('ip:1', () => uhr).ok, true)
    uhr += 10
    assert.equal(guard.erlaubt('ip:1', () => uhr).ok, true)
    uhr += 10
    const gesperrt = guard.erlaubt('ip:1', () => uhr)
    assert.equal(gesperrt.ok, false)
    if (!gesperrt.ok) assert.ok(gesperrt.retryAfterSec > 0)
  })

  test('eine andere Kennung bleibt frei', () => {
    const guard = providerOpsInMemoryCostGuard(GRENZEN)
    assert.equal(guard.erlaubt('ip:a', () => 1).ok, true)
    assert.equal(guard.erlaubt('ip:b', () => 1).ok, true)
  })

  test('leeren isoliert die Zähler', () => {
    const guard = providerOpsInMemoryCostGuard(GRENZEN)
    assert.equal(guard.erlaubt('ip:1', () => 1).ok, true)
    assert.equal(guard.erlaubt('ip:1', () => 2).ok, true)
    guard.leeren()
    assert.equal(guard.erlaubt('ip:1', () => 3).ok, true)
  })
})
