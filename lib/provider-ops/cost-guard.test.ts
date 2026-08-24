import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import {
  providerOpsInMemoryCostGuard,
  type ProviderOpsCostGuard,
  type ProviderOpsCostGuardErgebnis,
} from '@/lib/provider-ops'

const GRENZEN = {
  fensterMs: 60_000,
  anfragenJeFenster: 2,
  tagMs: 86_400_000,
  anfragenJeTag: 3,
}

describe('Provider-Ops Cost-Guard', () => {
  test('leere Kennung bleibt fail-closed', async () => {
    const guard = providerOpsInMemoryCostGuard(GRENZEN)
    assert.deepEqual(await guard.erlaubt(''), { ok: false, retryAfterSec: 1 })
    assert.deepEqual(await guard.erlaubt('   '), { ok: false, retryAfterSec: 1 })
  })

  test('Fenster lässt die erlaubte Zahl durch und sperrt danach', async () => {
    const guard = providerOpsInMemoryCostGuard(GRENZEN)
    let uhr = 1_000_000
    assert.equal((await guard.erlaubt('ip:1', () => uhr)).ok, true)
    uhr += 10
    assert.equal((await guard.erlaubt('ip:1', () => uhr)).ok, true)
    uhr += 10
    const gesperrt = await guard.erlaubt('ip:1', () => uhr)
    assert.equal(gesperrt.ok, false)
    if (!gesperrt.ok) assert.ok(gesperrt.retryAfterSec > 0)
  })

  test('eine andere Kennung bleibt frei', async () => {
    const guard = providerOpsInMemoryCostGuard(GRENZEN)
    assert.equal((await guard.erlaubt('ip:a', () => 1)).ok, true)
    assert.equal((await guard.erlaubt('ip:b', () => 1)).ok, true)
  })

  test('leeren isoliert die Zähler', async () => {
    const guard = providerOpsInMemoryCostGuard(GRENZEN)
    assert.equal((await guard.erlaubt('ip:1', () => 1)).ok, true)
    assert.equal((await guard.erlaubt('ip:1', () => 2)).ok, true)
    guard.leeren()
    assert.equal((await guard.erlaubt('ip:1', () => 3)).ok, true)
  })

  test('interne Fehler bleiben fail-closed', async () => {
    const guard = providerOpsInMemoryCostGuard(GRENZEN)
    const gesperrt = await guard.erlaubt('ip:1', () => {
      throw new Error('uhr defekt')
    })
    assert.deepEqual(gesperrt, { ok: false, retryAfterSec: 1 })
  })

  test('ein späterer persistenter Port kann dieselbe async Grenze erfüllen', async () => {
    const speicher = new Map<string, number>()
    const port: ProviderOpsCostGuard = {
      async erlaubt(kennung) {
        const key = kennung.trim()
        if (!key) return { ok: false, retryAfterSec: 1 }
        const stand = speicher.get(key) ?? 0
        if (stand >= 1) return { ok: false, retryAfterSec: 2 }
        speicher.set(key, stand + 1)
        return { ok: true }
      },
      leeren() {
        speicher.clear()
      },
    }
    const erst: ProviderOpsCostGuardErgebnis = await port.erlaubt('s6')
    const dann: ProviderOpsCostGuardErgebnis = await port.erlaubt('s6')
    assert.deepEqual(erst, { ok: true })
    assert.deepEqual(dann, { ok: false, retryAfterSec: 2 })
  })
})
