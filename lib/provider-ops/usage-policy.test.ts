import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import {
  PROVIDER_OPS_DISPLAY_NOTICE_MAX_CHARS,
  PROVIDER_OPS_USAGE_POLICY_FELDER,
  providerOpsHttpHeader,
  providerOpsUngepruefteUsagePolicy,
  providerOpsUsagePolicyAusGepruefterKonfiguration,
} from '@/lib/provider-ops'

describe('Provider Readiness S8 usage policy', () => {
  test('ungeprüfte Vertragslage bleibt vollständig fail-closed', () => {
    assert.deepEqual(providerOpsUngepruefteUsagePolicy(), {
      cacheClass: 'forbidden',
      persistClass: 'forbidden',
      attributionRequired: null,
      displayNotice: null,
    })
    assert.equal(providerOpsHttpHeader({})['cache-control'], 'private, no-store')
  })

  test('fehlende oder ungültige Werte erzeugen keine stillen Rechte', () => {
    for (const eingabe of [
      null,
      [],
      {},
      {
        cacheClass: 'forever',
        persistClass: 'anything',
        attributionRequired: 'false',
        displayNotice: 123,
      },
    ]) {
      assert.deepEqual(providerOpsUsagePolicyAusGepruefterKonfiguration(eingabe), {
        cacheClass: 'forbidden',
        persistClass: 'forbidden',
        attributionRequired: null,
        displayNotice: null,
      })
    }
  })

  test('unknown Attribution bleibt von verifiziert false unterscheidbar', () => {
    assert.equal(
      providerOpsUsagePolicyAusGepruefterKonfiguration({ attributionRequired: null })
        .attributionRequired,
      null,
    )
    assert.equal(
      providerOpsUsagePolicyAusGepruefterKonfiguration({ attributionRequired: false })
        .attributionRequired,
      false,
    )
    assert.equal(
      providerOpsUsagePolicyAusGepruefterKonfiguration({ attributionRequired: true })
        .attributionRequired,
      true,
    )
  })

  test('explizit geprüfte erlaubte Klassen werden ohne Providertext normalisiert', () => {
    const policy = providerOpsUsagePolicyAusGepruefterKonfiguration({
      cacheClass: 'short_search',
      persistClass: 'user_snapshot',
      attributionRequired: true,
      displayNotice: '  Attribution\nlaut geprüftem Vertrag  ',
    })

    assert.deepEqual(policy, {
      cacheClass: 'short_search',
      persistClass: 'user_snapshot',
      attributionRequired: true,
      displayNotice: 'Attribution laut geprüftem Vertrag',
    })
  })

  test('Policy übernimmt nur die Allowlist und leakt keine Zusatzfelder', () => {
    const policy = providerOpsUsagePolicyAusGepruefterKonfiguration({
      cacheClass: 'reference',
      persistClass: 'ephemeral_offer',
      attributionRequired: false,
      displayNotice: null,
      token: 'secret',
      route: 'ZRH-BKK',
      payload: { price: 199 },
    })

    assert.deepEqual(Object.keys(policy).sort(), [...PROVIDER_OPS_USAGE_POLICY_FELDER].sort())
    const serialisiert = JSON.stringify(policy)
    assert.equal(serialisiert.includes('secret'), false)
    assert.equal(serialisiert.includes('ZRH-BKK'), false)
    assert.equal(serialisiert.includes('199'), false)
  })

  test('Display Notice ist bereinigt und hart begrenzt', () => {
    const policy = providerOpsUsagePolicyAusGepruefterKonfiguration({
      displayNotice: `\u0000  ${'x'.repeat(PROVIDER_OPS_DISPLAY_NOTICE_MAX_CHARS + 100)}  `,
    })

    assert.equal(policy.displayNotice?.length, PROVIDER_OPS_DISPLAY_NOTICE_MAX_CHARS)
    assert.equal(policy.displayNotice?.includes('\u0000'), false)
  })
})
