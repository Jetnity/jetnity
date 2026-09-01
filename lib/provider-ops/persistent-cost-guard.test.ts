import { createHmac } from 'node:crypto'
import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import {
  PROVIDER_OPS_PERSISTENT_COST_GUARD_VERSION,
  providerOpsPersistentCostGuard,
  type ProviderOpsPersistentCostGuardPort,
  type ProviderOpsPersistentCostGuardReservation,
} from '@/lib/provider-ops'

const HMAC_KEY = '0123456789abcdef0123456789abcdef'

function portMitAntwort(
  antwort: unknown,
  aufrufe: ProviderOpsPersistentCostGuardReservation[] = [],
): ProviderOpsPersistentCostGuardPort {
  return {
    async reservieren(eingabe) {
      aufrufe.push(eingabe)
      return antwort
    },
  }
}

describe('Provider-Ops persistenter Cost Guard', () => {
  test('sendet nur domänengetrennten HMAC-Hash, Domain, Vertrag und konservative Kosten', async () => {
    const aufrufe: ProviderOpsPersistentCostGuardReservation[] = []
    const guard = providerOpsPersistentCostGuard({
      domain: 'flights',
      reservedCostMicrousd: 1250,
      identifierHmacKey: HMAC_KEY,
      port: portMitAntwort({ ok: true }, aufrufe),
    })

    const ergebnis = await guard.erlaubt('  ip:203.0.113.42  ')
    assert.deepEqual(ergebnis, { ok: true })
    assert.equal(aufrufe.length, 1)

    const erwartet = createHmac('sha256', HMAC_KEY)
      .update('flights', 'utf8')
      .update('\0', 'utf8')
      .update('ip:203.0.113.42', 'utf8')
      .digest('hex')
    assert.deepEqual(aufrufe[0], {
      version: PROVIDER_OPS_PERSISTENT_COST_GUARD_VERSION,
      domain: 'flights',
      identifierHash: erwartet,
      reservedCostMicrousd: 1250,
    })
    assert.equal(JSON.stringify(aufrufe[0]).includes('203.0.113.42'), false)
  })

  test('dieselbe Kennung ist zwischen Domains nicht verknüpfbar', async () => {
    const flightAufrufe: ProviderOpsPersistentCostGuardReservation[] = []
    const hotelAufrufe: ProviderOpsPersistentCostGuardReservation[] = []

    const flights = providerOpsPersistentCostGuard({
      domain: 'flights',
      reservedCostMicrousd: 1,
      identifierHmacKey: HMAC_KEY,
      port: portMitAntwort({ ok: true }, flightAufrufe),
    })
    const hotels = providerOpsPersistentCostGuard({
      domain: 'hotels',
      reservedCostMicrousd: 1,
      identifierHmacKey: HMAC_KEY,
      port: portMitAntwort({ ok: true }, hotelAufrufe),
    })

    assert.deepEqual(await flights.erlaubt('ip:gleich'), { ok: true })
    assert.deepEqual(await hotels.erlaubt('ip:gleich'), { ok: true })
    assert.notEqual(flightAufrufe[0]?.identifierHash, hotelAufrufe[0]?.identifierHash)
  })

  test('leere Kennung, zu kurzer HMAC-Key und ungültige Kosten bleiben fail-closed', async () => {
    let aufrufe = 0
    const port: ProviderOpsPersistentCostGuardPort = {
      async reservieren() {
        aufrufe += 1
        return { ok: true }
      },
    }

    const leer = providerOpsPersistentCostGuard({
      domain: 'flights',
      reservedCostMicrousd: 1,
      identifierHmacKey: HMAC_KEY,
      port,
    })
    assert.deepEqual(await leer.erlaubt('   '), { ok: false, retryAfterSec: 1 })

    const kurzerKey = providerOpsPersistentCostGuard({
      domain: 'flights',
      reservedCostMicrousd: 1,
      identifierHmacKey: 'zu-kurz',
      port,
    })
    assert.deepEqual(await kurzerKey.erlaubt('ip:a'), { ok: false, retryAfterSec: 1 })

    const negativeKosten = providerOpsPersistentCostGuard({
      domain: 'flights',
      reservedCostMicrousd: -1,
      identifierHmacKey: HMAC_KEY,
      port,
    })
    assert.deepEqual(await negativeKosten.erlaubt('ip:a'), { ok: false, retryAfterSec: 1 })

    const unsichereKosten = providerOpsPersistentCostGuard({
      domain: 'flights',
      reservedCostMicrousd: Number.MAX_SAFE_INTEGER + 1,
      identifierHmacKey: HMAC_KEY,
      port,
    })
    assert.deepEqual(await unsichereKosten.erlaubt('ip:a'), { ok: false, retryAfterSec: 1 })

    assert.equal(aufrufe, 0)
  })

  test('Port-Fehler und unlesbare Antworten geben niemals frei', async () => {
    const wirft = providerOpsPersistentCostGuard({
      domain: 'hotels',
      reservedCostMicrousd: 10,
      identifierHmacKey: HMAC_KEY,
      port: {
        async reservieren() {
          throw new Error('db down')
        },
      },
    })
    assert.deepEqual(await wirft.erlaubt('ip:a'), { ok: false, retryAfterSec: 1 })

    for (const antwort of [null, {}, { ok: false }, { ok: false, retryAfterSec: 0 }, { ok: 'true' }]) {
      const guard = providerOpsPersistentCostGuard({
        domain: 'hotels',
        reservedCostMicrousd: 10,
        identifierHmacKey: HMAC_KEY,
        port: portMitAntwort(antwort),
      })
      assert.deepEqual(await guard.erlaubt('ip:a'), { ok: false, retryAfterSec: 1 })
    }
  })

  test('valider Retry wird übernommen, aber nie ausserhalb eines Tages akzeptiert', async () => {
    const gesperrt = providerOpsPersistentCostGuard({
      domain: 'activities',
      reservedCostMicrousd: 0,
      identifierHmacKey: HMAC_KEY,
      port: portMitAntwort({ ok: false, retryAfterSec: 321 }),
    })
    assert.deepEqual(await gesperrt.erlaubt('konto:1'), { ok: false, retryAfterSec: 321 })

    const zuGross = providerOpsPersistentCostGuard({
      domain: 'activities',
      reservedCostMicrousd: 0,
      identifierHmacKey: HMAC_KEY,
      port: portMitAntwort({ ok: false, retryAfterSec: 86401 }),
    })
    assert.deepEqual(await zuGross.erlaubt('konto:1'), { ok: false, retryAfterSec: 1 })
  })

  test('persistente Wahrheit benutzt nicht die prozesslokale Test-Uhr', async () => {
    const guard = providerOpsPersistentCostGuard({
      domain: 'readiness',
      reservedCostMicrousd: 5,
      identifierHmacKey: HMAC_KEY,
      port: portMitAntwort({ ok: true }),
    })

    const ergebnis = await guard.erlaubt('ip:a', () => {
      throw new Error('diese Uhr darf der persistente Guard nicht lesen')
    })
    assert.deepEqual(ergebnis, { ok: true })
  })

  test('leeren ist absichtlich No-op und löscht keine persistente Wahrheit', async () => {
    const aufrufe: ProviderOpsPersistentCostGuardReservation[] = []
    const guard = providerOpsPersistentCostGuard({
      domain: 'safety',
      reservedCostMicrousd: 1,
      identifierHmacKey: HMAC_KEY,
      port: portMitAntwort({ ok: true }, aufrufe),
    })

    assert.deepEqual(await guard.erlaubt('ip:a'), { ok: true })
    guard.leeren()
    assert.equal(aufrufe.length, 1)
    assert.deepEqual(await guard.erlaubt('ip:a'), { ok: true })
    assert.equal(aufrufe.length, 2)
  })
})
